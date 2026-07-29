DROP INDEX IF EXISTS "users_email_idx";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "login" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(32);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contact_method" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contact_value" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_login_idx" ON "users" USING btree ("login");