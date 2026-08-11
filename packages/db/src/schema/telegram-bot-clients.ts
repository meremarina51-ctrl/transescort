import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { listings } from './listings';

/**
 * An anonymous visitor who reaches a performer through the Telegram bot — never a `users` row,
 * no site login. Identified purely by Telegram id; `ageConfirmedAt`/`rulesAcceptedAt` gate the
 * bot's relay flow on first contact (see TelegramService.handleClientStart).
 */
export const telegramBotClients = pgTable(
  'telegram_bot_clients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    telegramId: varchar('telegram_id', { length: 32 }).notNull(),
    telegramUsername: varchar('telegram_username', { length: 255 }),

    ageConfirmedAt: timestamp('age_confirmed_at'),
    rulesAcceptedAt: timestamp('rules_accepted_at'),

    /** Listing the client tried to reach before the 18+/rules gate — resumed once they confirm. */
    pendingListingId: uuid('pending_listing_id').references(() => listings.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    telegramIdIdx: uniqueIndex('telegram_bot_clients_telegram_id_idx').on(table.telegramId),
  }),
);

export type TelegramBotClient = typeof telegramBotClients.$inferSelect;
export type NewTelegramBotClient = typeof telegramBotClients.$inferInsert;
