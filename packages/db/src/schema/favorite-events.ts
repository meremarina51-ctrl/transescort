import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { listings } from './listings';

export const FAVORITE_EVENT_ACTIONS = ['added', 'removed'] as const;
export type FavoriteEventAction = (typeof FAVORITE_EVENT_ACTIONS)[number];

/**
 * Append-only log of add/remove actions on `favorites` — the join table itself only reflects current
 * state (a row exists or it doesn't), so once something is un-favorited there'd be no trace it ever
 * happened without this. Powers the "добавления/удаления" analytics on the performer's stats page.
 */
export const favoriteEvents = pgTable(
  'favorite_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 10 }).$type<FavoriteEventAction>().notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    listingIdx: index('favorite_events_listing_idx').on(table.listingId),
  }),
);

export type FavoriteEvent = typeof favoriteEvents.$inferSelect;
export type NewFavoriteEvent = typeof favoriteEvents.$inferInsert;
