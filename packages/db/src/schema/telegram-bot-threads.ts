import { pgTable, uuid, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { telegramBotClients } from './telegram-bot-clients';
import { users } from './users';

/** One thread per (anonymous client, performer) pair — messages relay through the bot, never direct. */
export const telegramBotThreads = pgTable(
  'telegram_bot_threads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => telegramBotClients.id, { onDelete: 'cascade' }),
    performerId: uuid('performer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    /** Bumped on every relayed message either direction — used to find the "active" thread for a side that isn't replying-to-message. */
    lastMessageAt: timestamp('last_message_at'),
    /**
     * Set when the performer taps "Завершить диалог". An ended thread is skipped by the "most
     * recently active thread" fallback in both directions — the client's plain messages and the
     * performer's plain (non-reply) messages both stop relaying until the client re-opens contact
     * from the site, which clears this back to null. Replying directly to an old forwarded message
     * still works regardless — that's an explicit action, not the implicit fallback.
     */
    endedAt: timestamp('ended_at'),

    /**
     * message_id of the most recent message on each side that still carries the "🚫 Завершить
     * диалог" button — before attaching the button to a new message, the bot strips it from
     * whichever message this points at, so only ever one message per side shows it. Each side's
     * chat id is just their own Telegram id (performer via `users`, client via
     * `telegram_bot_clients`), so only the message id needs storing here.
     */
    performerButtonMessageId: integer('performer_button_message_id'),
    clientButtonMessageId: integer('client_button_message_id'),
  },
  (table) => ({
    pairIdx: uniqueIndex('telegram_bot_threads_pair_idx').on(table.clientId, table.performerId),
  }),
);

export type TelegramBotThread = typeof telegramBotThreads.$inferSelect;
export type NewTelegramBotThread = typeof telegramBotThreads.$inferInsert;
