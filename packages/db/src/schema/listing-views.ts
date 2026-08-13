import { pgTable, uuid, varchar, date, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { listings } from './listings';

/**
 * One row per (listing, visitor, day) — visitor identity is a hash, never a raw IP. The unique index
 * is the dedup mechanism: repeated page loads from the same visitor on the same day insert nothing
 * further (`ON CONFLICT DO NOTHING`), so the row count is a real "daily unique visitors" number, not
 * a raw hit counter inflated by refreshes.
 */
export const listingViews = pgTable(
  'listing_views',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    viewerHash: varchar('viewer_hash', { length: 64 }).notNull(),
    viewDate: date('view_date').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    dedupIdx: uniqueIndex('listing_views_dedup_idx').on(table.listingId, table.viewerHash, table.viewDate),
    listingIdx: index('listing_views_listing_idx').on(table.listingId),
  }),
);

export type ListingView = typeof listingViews.$inferSelect;
export type NewListingView = typeof listingViews.$inferInsert;
