-- Data-only migration, no schema change. Listings that were already marked photos_verified=true
-- under the old all-or-nothing flag predate the listing_photo_reviews table and have no rows in it.
-- Without this backfill, the first time an admin touches any single photo on one of these listings,
-- the recompute in ListingsService would see the rest as unreviewed and incorrectly drop the
-- anketa's "photos verified" badge.
INSERT INTO listing_photo_reviews (listing_id, url, status, reviewed_at)
SELECT l.id, photo_url, 'confirmed', l.updated_at
FROM listings l, jsonb_array_elements_text(l.photos) AS photo_url
WHERE l.photos_verified = true
ON CONFLICT (listing_id, url) DO NOTHING;
