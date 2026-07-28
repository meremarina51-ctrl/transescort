DROP INDEX IF EXISTS "users_email_verification_token_idx";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verification_token_hash";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verification_expires_at";