import { pgTable, uuid, integer, text, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';
import { listings } from './listings';

/**
 * A client's review of a performer's anketa. New reviews start `pending` and are invisible on
 * the public anketa page until an admin approves them (see ReviewsService.verify). One review
 * per (author, listing) — to leave a new one the client must delete their existing one first,
 * there's no edit-in-place.
 */
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    rating: integer('rating').notNull(),
    text: text('text').notNull(),

    status: varchar('status', { length: 20 })
      .$type<'pending' | 'published' | 'rejected' | 'hidden'>()
      .notNull()
      .default('pending'),
    /** Admin's note — required on rejection, shown to the client in "Мои отзывы". */
    moderatorNote: text('moderator_note'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    authorListingIdx: uniqueIndex('reviews_author_listing_idx').on(table.authorId, table.listingId),
  }),
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
