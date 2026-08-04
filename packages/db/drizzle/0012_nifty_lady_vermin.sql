ALTER TABLE "listings" ADD COLUMN "price_hour" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "price_night" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "contact_phone" varchar(32);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "contact_telegram" varchar(100);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "contact_whatsapp" varchar(32);