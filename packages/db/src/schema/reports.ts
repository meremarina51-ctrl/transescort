import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const REPORT_TARGET_TYPES = ['listing', 'review', 'message', 'user'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_CATEGORIES = ['spam', 'fake', 'harassment', 'inappropriate', 'other'] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_STATUSES = ['pending', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/**
 * A complaint against an anketa, a review, a chat message, or another user. `targetId` is
 * polymorphic — it points at a row in `listings`/`reviews`/`messages`/`users` depending on
 * `targetType` — so it deliberately has no FK constraint; ReportsService resolves target context
 * per-type when building the admin queue.
 */
export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterId: uuid('reporter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  targetType: varchar('target_type', { length: 20 }).$type<ReportTargetType>().notNull(),
  targetId: uuid('target_id').notNull(),

  category: varchar('category', { length: 30 }).$type<ReportCategory>().notNull(),
  text: text('text').notNull(),

  status: varchar('status', { length: 20 }).$type<ReportStatus>().notNull().default('pending'),
  /** Admin's internal note on the resolution — never shown to the reporter. */
  adminNote: text('admin_note'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
