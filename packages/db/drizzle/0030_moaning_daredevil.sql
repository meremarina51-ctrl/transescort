CREATE TABLE IF NOT EXISTS "listing_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"viewer_hash" varchar(64) NOT NULL,
	"view_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "listing_views" ADD CONSTRAINT "listing_views_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "listing_views_dedup_idx" ON "listing_views" USING btree ("listing_id","viewer_hash","view_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listing_views_listing_idx" ON "listing_views" USING btree ("listing_id");