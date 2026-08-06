import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * A direct 1:1 conversation between two users, any role. `userAId`/`userBId` are always stored
 * with the lexicographically smaller uuid first (see ChatService.canonicalPair) so the unique
 * index reliably dedupes a pair regardless of who started the chat.
 */
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userAId: uuid('user_a_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userBId: uuid('user_b_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    lastMessageAt: timestamp('last_message_at'),
    /** Per-participant "read up to" watermark — unread count = messages after the reader's own value. */
    lastReadAtA: timestamp('last_read_at_a'),
    lastReadAtB: timestamp('last_read_at_b'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    pairIdx: uniqueIndex('conversations_pair_idx').on(table.userAId, table.userBId),
  }),
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
