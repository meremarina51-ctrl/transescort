import { pgTable, uuid, varchar, integer, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { telegramBotThreads } from './telegram-bot-threads';

/**
 * Tracks every message the bot relays, keyed by where it landed (`chatId`+`messageId` in the
 * *recipient's* chat with the bot). When the performer replies to a specific forwarded message,
 * Telegram gives us that message's id back via `reply_to_message` — this table maps it to a thread.
 */
export const telegramBotRelayMessages = pgTable(
  'telegram_bot_relay_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => telegramBotThreads.id, { onDelete: 'cascade' }),
    direction: varchar('direction', { length: 20 }).$type<'client_to_performer' | 'performer_to_client'>().notNull(),

    /** Telegram chat id the relayed copy was delivered to (private chats: equals the recipient's user id). */
    chatId: varchar('chat_id', { length: 32 }).notNull(),
    messageId: integer('message_id').notNull(),

    /**
     * The plain message text, kept solely so an admin reviewing a "🚩 Пожаловаться" report can see
     * the conversation that led to it (see TelegramService.getConversationForReport — reachable
     * only via a report id, never a general thread browser). Nullable because rows relayed before
     * this column existed have no body on file.
     */
    body: text('body'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    lookupIdx: uniqueIndex('telegram_bot_relay_messages_lookup_idx').on(table.chatId, table.messageId),
  }),
);

export type TelegramBotRelayMessage = typeof telegramBotRelayMessages.$inferSelect;
export type NewTelegramBotRelayMessage = typeof telegramBotRelayMessages.$inferInsert;
