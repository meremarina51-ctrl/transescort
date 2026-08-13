import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { listings } from './listings';

export const CONTACT_EVENT_ACTIONS = ['click', 'platform', 'telegram'] as const;
export type ContactEventAction = (typeof CONTACT_EVENT_ACTIONS)[number];

/**
 * Raw log of "Связаться" activity on the anketa page — one row per action, never deduped (unlike
 * `listing_views`): a client re-opening the contact modal or reconsidering channels is a genuine
 * signal, not noise. `click` fires when the modal opens; `platform`/`telegram` fire when a channel is
 * picked, so `click` count is always >= `platform` + `telegram` combined (the gap is drop-off).
 */
export const contactEvents = pgTable(
  'contact_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 10 }).$type<ContactEventAction>().notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    listingIdx: index('contact_events_listing_idx').on(table.listingId),
  }),
);

export type ContactEvent = typeof contactEvents.$inferSelect;
export type NewContactEvent = typeof contactEvents.$inferInsert;
