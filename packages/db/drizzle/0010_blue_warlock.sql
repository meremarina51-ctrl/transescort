ALTER TABLE "listings" ADD COLUMN "verification_status" varchar(20) DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "verification_note" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "submitted_at" timestamp;--> statement-breakpoint
-- Grandfather in anketas that were already published before verification existed, so they don't vanish from the catalog.
UPDATE "listings" SET "verification_status" = 'approved' WHERE "status" = 'published';