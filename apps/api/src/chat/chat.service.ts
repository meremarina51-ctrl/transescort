import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, ilike, ne, or } from 'drizzle-orm';
import { conversations, messages, users, type Conversation, type Message } from '@transescort/db';

export interface ConversationParticipant {
  id: string;
  login: string;
  fullName: string | null;
  role: string;
}

export interface ConversationSummary {
  id: string;
  otherUser: ConversationParticipant;
  lastMessage: { body: string; senderId: string; createdAt: Date } | null;
  unreadCount: number;
  updatedAt: Date;
}

export interface OutgoingMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
}

@Injectable()
export class ChatService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  /** Always orders the pair the same way regardless of who initiates, so the unique index dedupes correctly. */
  private canonicalPair(userId1: string, userId2: string): [string, string] {
    return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  }

  async searchUsers(query: string, excludeUserId: string): Promise<ConversationParticipant[]> {
    const q = query.trim();
    if (!q) return [];

    return this.db
      .select({ id: users.id, login: users.login, fullName: users.fullName, role: users.role })
      .from(users)
      .where(and(ilike(users.login, `%${q}%`), ne(users.id, excludeUserId)))
      .limit(10);
  }

  /** Finds or creates the 1:1 conversation with a user identified by login, and returns it list-item-shaped. */
  async startConversation(userId: string, otherLogin: string): Promise<ConversationSummary> {
    const otherUserRows = await this.db
      .select()
      .from(users)
      .where(eq(users.login, otherLogin.toLowerCase().trim()))
      .limit(1);
    const otherUser = otherUserRows[0];
    if (!otherUser) throw new NotFoundException('Пользователь не найден');
    if (otherUser.id === userId) throw new BadRequestException('Нельзя начать чат с самим собой');

    const [userAId, userBId] = this.canonicalPair(userId, otherUser.id);
    const pairWhere = and(eq(conversations.userAId, userAId), eq(conversations.userBId, userBId));

    const existing = await this.db.select().from(conversations).where(pairWhere).limit(1);
    let conversation: Conversation = existing[0];

    if (!conversation) {
      const inserted = await this.db.insert(conversations).values({ userAId, userBId }).onConflictDoNothing().returning();
      conversation = inserted[0] ?? (await this.db.select().from(conversations).where(pairWhere).limit(1))[0];
    }

    const summary = await this.toSummary(conversation, userId);
    if (!summary) throw new NotFoundException('Пользователь не найден');
    return summary;
  }

  async listConversations(userId: string): Promise<ConversationSummary[]> {
    const rows: Conversation[] = await this.db
      .select()
      .from(conversations)
      .where(or(eq(conversations.userAId, userId), eq(conversations.userBId, userId)))
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.createdAt));

    const summaries: ConversationSummary[] = [];
    for (const row of rows) {
      const summary = await this.toSummary(row, userId);
      if (summary) summaries.push(summary);
    }
    return summaries;
  }

  async listMessages(conversationId: string, userId: string): Promise<Message[]> {
    await this.assertParticipant(conversationId, userId);
    return this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
      .limit(200);
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    body: string,
  ): Promise<{ message: OutgoingMessage; otherUserId: string }> {
    const conversation = await this.assertParticipant(conversationId, senderId);

    const trimmed = body.trim();
    if (!trimmed) throw new BadRequestException('Сообщение не может быть пустым');

    const inserted = await this.db.insert(messages).values({ conversationId, senderId, body: trimmed }).returning();
    const message: Message = inserted[0];

    await this.db.update(conversations).set({ lastMessageAt: message.createdAt }).where(eq(conversations.id, conversationId));

    const otherUserId = conversation.userAId === senderId ? conversation.userBId : conversation.userAId;
    return { message, otherUserId };
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.assertParticipant(conversationId, userId);
    const isA = conversation.userAId === userId;
    await this.db
      .update(conversations)
      .set(isA ? { lastReadAtA: new Date() } : { lastReadAtB: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  private async assertParticipant(conversationId: string, userId: string): Promise<Conversation> {
    const rows = await this.db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
    const conversation = rows[0];
    if (!conversation) throw new NotFoundException('Чат не найден');
    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new ForbiddenException('Вы не участник этого чата');
    }
    return conversation;
  }

  /** Returns null if the other participant's account no longer exists. */
  private async toSummary(row: Conversation, userId: string): Promise<ConversationSummary | null> {
    const otherUserId = row.userAId === userId ? row.userBId : row.userAId;
    const otherUserRows = await this.db
      .select({ id: users.id, login: users.login, fullName: users.fullName, role: users.role })
      .from(users)
      .where(eq(users.id, otherUserId))
      .limit(1);
    const otherUser = otherUserRows[0];
    if (!otherUser) return null;

    const thread: Message[] = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, row.id))
      .orderBy(desc(messages.createdAt));

    const myLastRead = row.userAId === userId ? row.lastReadAtA : row.lastReadAtB;
    const lastMessage = thread[0] ?? null;
    const unreadCount = thread.filter(
      (m) => m.senderId !== userId && (!myLastRead || m.createdAt > myLastRead),
    ).length;

    return {
      id: row.id,
      otherUser,
      lastMessage: lastMessage ? { body: lastMessage.body, senderId: lastMessage.senderId, createdAt: lastMessage.createdAt } : null,
      unreadCount,
      updatedAt: row.lastMessageAt ?? row.createdAt,
    };
  }
}
