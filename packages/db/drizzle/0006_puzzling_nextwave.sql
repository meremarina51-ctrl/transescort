ALTER TABLE "listings" ADD COLUMN "slug" varchar(160);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "listings_slug_idx" ON "listings" USING btree ("slug");