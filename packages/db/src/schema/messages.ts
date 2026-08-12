import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { conversations } from './conversations';

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    conversationIdx: index('messages_conversation_created_idx').on(table.conversationId, table.createdAt),
    /** Backs the anti-spam rate/duplicate checks in ChatService.sendMessage — both scan a sender's recent messages across all conversations. */
    senderCreatedIdx: index('messages_sender_created_idx').on(table.senderId, table.createdAt),
  }),
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
