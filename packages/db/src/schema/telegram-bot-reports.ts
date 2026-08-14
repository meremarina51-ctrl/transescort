import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { telegramBotThreads } from './telegram-bot-threads';

/** Kept identical to `REPORT_CATEGORIES` in `reports.ts` so admins see one consistent set of reasons everywhere. */
export const TELEGRAM_REPORT_CATEGORIES = ['spam', 'fake', 'harassment', 'inappropriate', 'other'] as const;
export type TelegramReportCategory = (typeof TELEGRAM_REPORT_CATEGORIES)[number];

export const TELEGRAM_REPORT_STATUSES = ['pending', 'resolved', 'dismissed'] as const;
export type TelegramReportStatus = (typeof TELEGRAM_REPORT_STATUSES)[number];

/**
 * A complaint one side of a Telegram-bot conversation files against the other, via the "🚩
 * Пожаловаться" button next to "🚫 Завершить диалог" — see TelegramService.handleReportCategory.
 * Deliberately its own table rather than reusing `reports`: the reporter here may be an anonymous
 * `telegram_bot_clients` row (never a `users` row), which `reports.reporterId`'s NOT NULL FK to
 * `users` can't represent — the thread itself (client + performer) is enough context, so there's
 * no separate target column either.
 */
export const telegramBotReports = pgTable('telegram_bot_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id')
    .notNull()
    .references(() => telegramBotThreads.id, { onDelete: 'cascade' }),

  /** Who filed it — the other side of the thread is the one being reported. */
  reporterRole: varchar('reporter_role', { length: 20 }).$type<'client' | 'performer'>().notNull(),
  category: varchar('category', { length: 30 }).$type<TelegramReportCategory>().notNull(),

  status: varchar('status', { length: 20 }).$type<TelegramReportStatus>().notNull().default('pending'),
  /** Admin's internal note on the resolution — never shown to either side of the thread. */
  adminNote: text('admin_note'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type TelegramBotReport = typeof telegramBotReports.$inferSelect;
export type NewTelegramBotReport = typeof telegramBotReports.$inferInsert;
