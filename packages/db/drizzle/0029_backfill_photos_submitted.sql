-- Data-only migration, no schema change. Listings that already went through the old "any upload
-- lands in moderation" flow (anything past a fresh, never-touched draft) should keep showing up in
-- the admin "Медиа" queue even though they never went through the new explicit photos-submit step —
-- otherwise this migration would silently drop real outstanding moderation work from the queue.
-- A plain 'draft' that's never been submitted is left untouched: it genuinely needs the performer
-- to click "Отправить фото на проверку" first, same as any listing created after this change.
UPDATE listings
SET photos_submitted_at = COALESCE(submitted_at, updated_at)
WHERE photos_verified = false
  AND jsonb_array_length(photos) > 0
  AND status <> 'draft';
