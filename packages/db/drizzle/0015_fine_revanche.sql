ALTER TABLE "listings" ALTER COLUMN "verification_status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "verification_status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "ever_published" boolean DEFAULT false NOT NULL;