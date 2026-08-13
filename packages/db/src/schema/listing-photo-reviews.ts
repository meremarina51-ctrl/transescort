import { pgTable, uuid, varchar, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { listings } from './listings';

export const LISTING_PHOTO_REVIEW_STATUSES = ['pending', 'confirmed', 'rejected'] as const;
export type ListingPhotoReviewStatus = (typeof LISTING_PHOTO_REVIEW_STATUSES)[number];

/**
 * Per-photo moderation state — deliberately separate from `listings.photos` (which stays a plain
 * URL array everywhere else in the app) so the review history survives independent of it. A photo
 * with no row here is implicitly "pending". `listings.photosVerified` is a cached derived value —
 * true only when every URL currently in `photos` has a `confirmed` row — recomputed by
 * ListingsService whenever a review changes or the photo set changes.
 */
export const listingPhotoReviews = pgTable(
  'listing_photo_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),

    status: varchar('status', { length: 20 }).$type<ListingPhotoReviewStatus>().notNull().default('pending'),
    /** Required when rejecting — shown to the performer. */
    note: text('note'),
    reviewedAt: timestamp('reviewed_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    listingUrlIdx: uniqueIndex('listing_photo_reviews_listing_url_idx').on(table.listingId, table.url),
  }),
);

export type ListingPhotoReview = typeof listingPhotoReviews.$inferSelect;
export type NewListingPhotoReview = typeof listingPhotoReviews.$inferInsert;
