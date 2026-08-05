-- Fold the old two-field (status, verification_status) state into the new unified `status` enum
-- before the old column disappears. Also backfills `ever_published` from the same data.
UPDATE "listings" SET
  "status" = CASE
    WHEN "status" = 'published' AND "verification_status" = 'approved' THEN 'published'
    WHEN "status" = 'published' THEN 'published'
    WHEN "verification_status" = 'pending' THEN 'pending'
    WHEN "verification_status" IN ('rejected', 'changes_requested') THEN 'changes_requested'
    ELSE 'draft'
  END,
  "ever_published" = ("status" = 'published' AND "verification_status" = 'approved');
--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN IF EXISTS "verification_status";