ALTER TABLE "users" ALTER COLUMN "login" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "email";