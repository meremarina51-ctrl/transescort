import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/** Short-lived, single-use tokens behind the /cabinet/settings "Привязать Telegram" deep link. */
export const telegramLinkTokens = pgTable(
  'telegram_link_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** SHA-256 hex digest — fast, deterministic lookup by the raw token the bot receives via /start. */
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tokenHashIdx: index('telegram_link_tokens_hash_idx').on(table.tokenHash),
  }),
);

export type TelegramLinkToken = typeof telegramLinkTokens.$inferSelect;
export type NewTelegramLinkToken = typeof telegramLinkTokens.$inferInsert;
