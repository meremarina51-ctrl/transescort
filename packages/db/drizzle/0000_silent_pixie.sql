CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'client' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"email_verified_at" timestamp,
	"email_verification_token_hash" varchar(64),
	"email_verification_expires_at" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_verification_token_idx" ON "users" USING btree ("email_verification_token_hash");