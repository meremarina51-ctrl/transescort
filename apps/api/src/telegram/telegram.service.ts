import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { and, desc, eq, isNull, lt } from 'drizzle-orm';
import {
  listings,
  telegramBotClients,
  telegramBotRelayMessages,
  telegramBotThreads,
  telegramLinkTokens,
  users,
  type NewTelegramLinkToken,
} from '@transescort/db';

const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;
const MAX_RELAY_TEXT_LENGTH = 4000;
/** Prefixes the /start payload for "contact this performer" deep links — distinguishes it from a plain account-link token. */
const CONTACT_PAYLOAD_PREFIX = 'c_';
/** Prefixes the "end dialog" inline button's callback_data — the rest is the thread id. */
const END_THREAD_PREFIX = 'end_thread:';

export interface TelegramStatus {
  linked: boolean;
  username: string | null;
  linkedAt: Date | null;
}

export interface CreateLinkTokenResult {
  expiresAt: Date;
  deepLink: string | null;
  botConfigured: boolean;
}

export interface BotInfo {
  username: string | null;
}

/**
 * Two independent flows share one bot:
 *
 * 1. **Account linking** (existing) — a logged-in user opens `t.me/<bot>?start=<token>` from
 *    /cabinet/settings to attach their Telegram to their platform account.
 * 2. **Anonymous client contact** (this file's main addition) — a site visitor, no account needed,
 *    opens `t.me/<bot>?start=c_<listingId>` from an anketa page. On first contact ever they must
 *    confirm 18+ and accept the rules (inline button); after that every message they send is
 *    relayed to the performer's own linked Telegram chat, and vice versa — the two sides never see
 *    each other's real Telegram identity, only the bot. The performer replies by replying-to the
 *    specific forwarded message (so concurrent conversations with different clients don't cross);
 *    a plain (non-reply) message from the performer falls back to their most recently active thread.
 *
 * Runs a long-polling loop against the Telegram Bot API — no public webhook needed — but only
 * starts if TELEGRAM_BOT_TOKEN is set; otherwise both flows are simply unavailable.
 */
@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('TelegramService');
  private readonly botToken: string | undefined;
  private abortController: AbortController | null = null;
  private updateOffset = 0;
  private botUsername: string | null = null;

  constructor(
    @Inject('DRIZZLE') private readonly db: any,
    private readonly configService: ConfigService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN')?.trim() || undefined;
  }

  onModuleInit() {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — Telegram features are disabled');
      return;
    }
    this.startPolling(this.botToken);
  }

  onModuleDestroy() {
    this.abortController?.abort();
  }

  isConfigured(): boolean {
    return Boolean(this.botToken);
  }

  getBotInfo(): BotInfo {
    return { username: this.botUsername };
  }

  private async startPolling(token: string) {
    try {
      const me = await this.callApi(token, 'getMe');
      this.botUsername = me.result?.username ?? null;
      this.logger.log(`Telegram bot connected: @${this.botUsername}`);
    } catch (error) {
      this.logger.error(`Failed to connect Telegram bot: ${(error as Error).message}`);
      return;
    }

    this.abortController = new AbortController();
    void this.pollLoop(token);
  }

  private async pollLoop(token: string) {
    while (!this.abortController?.signal.aborted) {
      try {
        const res = await this.callApi(
          token,
          'getUpdates',
          { offset: this.updateOffset, timeout: 25, allowed_updates: ['message', 'callback_query'] },
          this.abortController?.signal,
        );
        for (const update of res.result ?? []) {
          this.updateOffset = update.update_id + 1;
          try {
            await this.handleUpdate(token, update);
          } catch (error) {
            this.logger.error(`Failed to handle Telegram update: ${(error as Error).message}`);
          }
        }
      } catch (error) {
        if (this.abortController?.signal.aborted) break;
        this.logger.error(`Telegram polling error: ${(error as Error).message}`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Update dispatch
  // ---------------------------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleUpdate(token: string, update: any) {
    if (update.callback_query) {
      return this.handleCallbackQuery(token, update.callback_query);
    }

    const message = update.message;
    const text: string | undefined = message?.text;
    if (!message || !text) return;

    if (text.startsWith('/start')) {
      return this.handleStart(token, message, text);
    }

    const telegramId = String(message.from.id);
    if (await this.isLinkedPerformer(telegramId)) {
      return this.relayFromPerformer(token, message, telegramId);
    }
    return this.relayFromClient(token, message, telegramId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleStart(token: string, message: any, text: string) {
    const chatId = message.chat.id;
    const payload = text.trim().split(/\s+/)[1];

    if (!payload) {
      await this.callApi(token, 'sendMessage', {
        chat_id: chatId,
        text: 'Привет! Эта ссылка должна содержать код — откройте её из личного кабинета или со страницы анкеты исполнителя на LuxEscortia.',
      });
      return;
    }

    if (payload.startsWith(CONTACT_PAYLOAD_PREFIX)) {
      return this.handleClientStart(token, message, payload.slice(CONTACT_PAYLOAD_PREFIX.length));
    }
    return this.handleLinkStart(token, message, payload);
  }

  // ---------------------------------------------------------------------------------------------
  // Flow 1: account linking (performer/client attaches their own Telegram in /cabinet/settings)
  // ---------------------------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleLinkStart(token: string, message: any, linkToken: string) {
    const chatId = message.chat.id;
    const telegramId = String(message.from.id);
    const telegramUsername: string | null = message.from.username ?? null;
    const result = await this.consumeLinkToken(linkToken, telegramId, telegramUsername);

    const reply =
      result === 'ok'
        ? 'Готово! Telegram привязан к вашему аккаунту LuxEscortia.'
        : result === 'taken'
          ? 'Этот Telegram-аккаунт уже привязан к другому профилю.'
          : 'Ссылка недействительна или устарела. Сгенерируйте новую в личном кабинете.';

    await this.callApi(token, 'sendMessage', { chat_id: chatId, text: reply });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async createLinkToken(userId: string): Promise<CreateLinkTokenResult> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS);
    const value: NewTelegramLinkToken = { userId, tokenHash: this.hashToken(token), expiresAt };
    await this.db.insert(telegramLinkTokens).values(value);

    return {
      expiresAt,
      deepLink: this.botUsername ? `https://t.me/${this.botUsername}?start=${token}` : null,
      botConfigured: this.isConfigured(),
    };
  }

  async getStatus(userId: string): Promise<TelegramStatus> {
    const rows = await this.db
      .select({ telegramUsername: users.telegramUsername, telegramLinkedAt: users.telegramLinkedAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const row = rows[0];
    return {
      linked: Boolean(row?.telegramLinkedAt),
      username: row?.telegramUsername ?? null,
      linkedAt: row?.telegramLinkedAt ?? null,
    };
  }

  async unlink(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ telegramId: null, telegramUsername: null, telegramLinkedAt: null, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  private async consumeLinkToken(
    rawToken: string,
    telegramId: string,
    telegramUsername: string | null,
  ): Promise<'ok' | 'invalid' | 'taken'> {
    const tokenHash = this.hashToken(rawToken);
    const rows = await this.db
      .select()
      .from(telegramLinkTokens)
      .where(eq(telegramLinkTokens.tokenHash, tokenHash))
      .limit(1);
    const record = rows[0];
    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      return 'invalid';
    }

    const takenRows = await this.db.select({ id: users.id }).from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (takenRows[0] && takenRows[0].id !== record.userId) {
      return 'taken';
    }

    await this.db
      .update(users)
      .set({ telegramId, telegramUsername, telegramLinkedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, record.userId));
    await this.db.update(telegramLinkTokens).set({ usedAt: new Date() }).where(eq(telegramLinkTokens.id, record.id));
    await this.db.delete(telegramLinkTokens).where(lt(telegramLinkTokens.expiresAt, new Date()));

    return 'ok';
  }

  // ---------------------------------------------------------------------------------------------
  // Flow 2: anonymous client <-> performer relay
  // ---------------------------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleClientStart(token: string, message: any, listingId: string) {
    const chatId = message.chat.id;
    const telegramId = String(message.from.id);
    const telegramUsername: string | null = message.from.username ?? null;

    const row = await this.findContactableListing(listingId);
    if (!row) {
      await this.callApi(token, 'sendMessage', {
        chat_id: chatId,
        text: 'Эта анкета сейчас недоступна для связи через Telegram.',
      });
      return;
    }

    const client = await this.findOrCreateClient(telegramId, telegramUsername);

    if (!client.ageConfirmedAt || !client.rulesAcceptedAt) {
      await this.db
        .update(telegramBotClients)
        .set({ pendingListingId: listingId, updatedAt: new Date() })
        .where(eq(telegramBotClients.id, client.id));
      await this.sendGate(token, chatId);
      return;
    }

    await this.openThreadAndGreet(token, client.id, chatId, row);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleCallbackQuery(token: string, callbackQuery: any) {
    const data: string | undefined = callbackQuery.data;
    if (data?.startsWith(END_THREAD_PREFIX)) {
      return this.handleEndThread(token, callbackQuery, data.slice(END_THREAD_PREFIX.length));
    }

    await this.callApi(token, 'answerCallbackQuery', { callback_query_id: callbackQuery.id }).catch(() => undefined);

    if (data !== 'gate_accept') return;
    const chatId = callbackQuery.message?.chat?.id;
    const telegramId = String(callbackQuery.from.id);
    if (!chatId) return;

    const rows = await this.db.select().from(telegramBotClients).where(eq(telegramBotClients.telegramId, telegramId)).limit(1);
    const client = rows[0];
    if (!client) return;

    await this.db
      .update(telegramBotClients)
      .set({ ageConfirmedAt: new Date(), rulesAcceptedAt: new Date(), pendingListingId: null, updatedAt: new Date() })
      .where(eq(telegramBotClients.id, client.id));

    if (!client.pendingListingId) {
      await this.callApi(token, 'sendMessage', {
        chat_id: chatId,
        text: 'Спасибо! Теперь откройте «Написать в Telegram» на странице анкеты исполнителя на сайте.',
      });
      return;
    }

    const row = await this.findContactableListing(client.pendingListingId);
    if (!row) {
      await this.callApi(token, 'sendMessage', {
        chat_id: chatId,
        text: 'Спасибо! Анкета, с которой вы начинали, сейчас недоступна — попробуйте другую.',
      });
      return;
    }

    await this.openThreadAndGreet(token, client.id, chatId, row);
  }

  /**
   * Performer tapped "🚫 Завершить диалог" on a relayed message. Marks the thread ended so it drops
   * out of the "active thread" fallback (see `mostRecentThread`), removes the now-stale button, and
   * lets the client know — without revealing anything about the performer beyond the bot already does.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleEndThread(token: string, callbackQuery: any, threadId: string) {
    const rows = await this.db.select().from(telegramBotThreads).where(eq(telegramBotThreads.id, threadId)).limit(1);
    const thread = rows[0];

    if (!thread || thread.endedAt) {
      await this.callApi(token, 'answerCallbackQuery', {
        callback_query_id: callbackQuery.id,
        text: thread ? 'Диалог уже завершён' : 'Диалог не найден',
      }).catch(() => undefined);
      return;
    }

    await this.db.update(telegramBotThreads).set({ endedAt: new Date() }).where(eq(telegramBotThreads.id, threadId));

    await this.callApi(token, 'answerCallbackQuery', {
      callback_query_id: callbackQuery.id,
      text: 'Диалог завершён',
    }).catch(() => undefined);

    const chatId = callbackQuery.message?.chat?.id;
    const messageId = callbackQuery.message?.message_id;
    if (chatId && messageId) {
      await this.callApi(token, 'editMessageReplyMarkup', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] },
      }).catch(() => undefined);
    }

    const clientRows = await this.db
      .select({ telegramId: telegramBotClients.telegramId })
      .from(telegramBotClients)
      .where(eq(telegramBotClients.id, thread.clientId))
      .limit(1);
    const clientTelegramId: string | null = clientRows[0]?.telegramId ?? null;
    if (clientTelegramId) {
      await this.callApi(token, 'sendMessage', {
        chat_id: clientTelegramId,
        text: 'Исполнитель завершил этот диалог. Чтобы написать снова, откройте «Написать в Telegram» на странице анкеты.',
      }).catch(() => undefined);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async sendGate(token: string, chatId: any) {
    await this.callApi(token, 'sendMessage', {
      chat_id: chatId,
      text:
        'Прежде чем продолжить, подтвердите:\n\n' +
        '• Вам есть 18 лет\n' +
        '• Вы принимаете правила сервиса LuxEscortia\n\n' +
        'Регистрация на сайте не требуется — мы используем только ваш Telegram ID.',
      reply_markup: {
        inline_keyboard: [[{ text: '✅ Подтверждаю', callback_data: 'gate_accept' }]],
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async relayFromClient(token: string, message: any, telegramId: string) {
    const chatId = message.chat.id;
    const text: string = message.text;

    const clientRows = await this.db.select().from(telegramBotClients).where(eq(telegramBotClients.telegramId, telegramId)).limit(1);
    const client = clientRows[0];
    if (!client || !client.ageConfirmedAt || !client.rulesAcceptedAt) {
      await this.callApi(token, 'sendMessage', {
        chat_id: chatId,
        text: 'Чтобы написать исполнителю, откройте «Написать в Telegram» на странице анкеты на сайте LuxEscortia.',
      });
      return;
    }

    const thread = await this.mostRecentThread(eq(telegramBotThreads.clientId, client.id));
    if (!thread) {
      await this.callApi(token, 'sendMessage', {
        chat_id: chatId,
        text: 'Сначала откройте «Написать в Telegram» на странице анкеты исполнителя на сайте.',
      });
      return;
    }

    const performerRows = await this.db.select({ telegramId: users.telegramId }).from(users).where(eq(users.id, thread.performerId)).limit(1);
    const performerTelegramId: string | null = performerRows[0]?.telegramId ?? null;
    if (!performerTelegramId) {
      await this.callApi(token, 'sendMessage', { chat_id: chatId, text: 'Исполнитель временно недоступен в Telegram.' });
      return;
    }

    const sent = await this.callApi(token, 'sendMessage', {
      chat_id: performerTelegramId,
      text: `📩 Сообщение от клиента через LuxEscortia:\n\n${this.truncate(text)}\n\n(ответьте на это сообщение, чтобы отправить его клиенту)`,
      reply_markup: {
        inline_keyboard: [[{ text: '🚫 Завершить диалог', callback_data: `${END_THREAD_PREFIX}${thread.id}` }]],
      },
    });

    await this.recordRelay(thread.id, 'client_to_performer', performerTelegramId, sent.result.message_id);
    await this.touchThread(thread.id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async relayFromPerformer(token: string, message: any, performerTelegramId: string) {
    const chatId = message.chat.id;
    const text: string = message.text;
    const repliedToId: number | undefined = message.reply_to_message?.message_id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let thread: any = null;
    if (repliedToId) {
      const relayRows = await this.db
        .select()
        .from(telegramBotRelayMessages)
        .where(and(eq(telegramBotRelayMessages.chatId, performerTelegramId), eq(telegramBotRelayMessages.messageId, repliedToId)))
        .limit(1);
      if (relayRows[0]) {
        const threadRows = await this.db.select().from(telegramBotThreads).where(eq(telegramBotThreads.id, relayRows[0].threadId)).limit(1);
        thread = threadRows[0] ?? null;
      }
    }

    if (!thread) {
      const performerRow = await this.db.select({ id: users.id }).from(users).where(eq(users.telegramId, performerTelegramId)).limit(1);
      const performerId = performerRow[0]?.id;
      thread = performerId ? await this.mostRecentThread(eq(telegramBotThreads.performerId, performerId)) : null;
    }

    if (!thread) {
      await this.callApi(token, 'sendMessage', {
        chat_id: chatId,
        text: 'Нет активных диалогов с клиентами — сообщения появятся здесь, когда клиент напишет через сайт.',
      });
      return;
    }

    const clientRows = await this.db
      .select({ telegramId: telegramBotClients.telegramId })
      .from(telegramBotClients)
      .where(eq(telegramBotClients.id, thread.clientId))
      .limit(1);
    const clientTelegramId: string | null = clientRows[0]?.telegramId ?? null;
    if (!clientTelegramId) return;

    const sent = await this.callApi(token, 'sendMessage', {
      chat_id: clientTelegramId,
      text: `💬 Ответ от исполнителя:\n\n${this.truncate(text)}`,
    });

    await this.recordRelay(thread.id, 'performer_to_client', clientTelegramId, sent.result.message_id);
    await this.touchThread(thread.id);
  }

  private async findContactableListing(listingId: string) {
    const rows = await this.db
      .select({ listing: listings, performerTelegramId: users.telegramId, performerName: users.fullName })
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .where(and(eq(listings.id, listingId), eq(listings.status, 'published')))
      .limit(1);
    const row = rows[0];
    return row?.performerTelegramId ? row : null;
  }

  private async findOrCreateClient(telegramId: string, telegramUsername: string | null) {
    const existing = await this.db.select().from(telegramBotClients).where(eq(telegramBotClients.telegramId, telegramId)).limit(1);
    if (existing[0]) {
      if (existing[0].telegramUsername !== telegramUsername) {
        await this.db
          .update(telegramBotClients)
          .set({ telegramUsername, updatedAt: new Date() })
          .where(eq(telegramBotClients.id, existing[0].id));
      }
      return existing[0];
    }
    const inserted = await this.db.insert(telegramBotClients).values({ telegramId, telegramUsername }).returning();
    return inserted[0];
  }

  /** The client explicitly re-opening contact from the site is exactly the signal that should reopen a thread the performer had ended. */
  private async findOrCreateThread(clientId: string, performerId: string) {
    const pairWhere = and(eq(telegramBotThreads.clientId, clientId), eq(telegramBotThreads.performerId, performerId));
    const existing = await this.db.select().from(telegramBotThreads).where(pairWhere).limit(1);
    if (existing[0]) {
      if (existing[0].endedAt) {
        const reopened = await this.db
          .update(telegramBotThreads)
          .set({ endedAt: null })
          .where(eq(telegramBotThreads.id, existing[0].id))
          .returning();
        return reopened[0];
      }
      return existing[0];
    }
    const inserted = await this.db.insert(telegramBotThreads).values({ clientId, performerId }).onConflictDoNothing().returning();
    return inserted[0] ?? (await this.db.select().from(telegramBotThreads).where(pairWhere).limit(1))[0];
  }

  /** Only ever picks a thread the performer hasn't ended — that's the whole point of ending one. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async mostRecentThread(condition: any) {
    const rows = await this.db
      .select()
      .from(telegramBotThreads)
      .where(and(condition, isNull(telegramBotThreads.endedAt)))
      .orderBy(desc(telegramBotThreads.lastMessageAt), desc(telegramBotThreads.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async openThreadAndGreet(token: string, clientId: string, clientChatId: any, listingRow: { listing: any; performerName: string | null }) {
    await this.findOrCreateThread(clientId, listingRow.listing.userId);
    const displayName = listingRow.listing.name || listingRow.performerName || 'исполнителем';
    await this.callApi(token, 'sendMessage', {
      chat_id: clientChatId,
      text: `Вы на связи с «${displayName}» через LuxEscortia. Напишите сообщение — оно будет передано анонимно, без раскрытия ваших данных.`,
    });
  }

  private async isLinkedPerformer(telegramId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.telegramId, telegramId), eq(users.role, 'performer')))
      .limit(1);
    return Boolean(rows[0]);
  }

  private async recordRelay(threadId: string, direction: 'client_to_performer' | 'performer_to_client', chatId: string, messageId: number) {
    await this.db.insert(telegramBotRelayMessages).values({ threadId, direction, chatId, messageId });
  }

  private async touchThread(threadId: string): Promise<void> {
    await this.db.update(telegramBotThreads).set({ lastMessageAt: new Date() }).where(eq(telegramBotThreads.id, threadId));
  }

  private truncate(text: string): string {
    return text.length > MAX_RELAY_TEXT_LENGTH ? `${text.slice(0, MAX_RELAY_TEXT_LENGTH)}…` : text;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async callApi(
    token: string,
    method: string,
    params: Record<string, unknown> = {},
    signal?: AbortSignal,
  ): Promise<any> {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal,
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || `Telegram API error (${method})`);
    return data;
  }
}
