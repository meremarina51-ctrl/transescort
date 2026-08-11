CREATE TABLE IF NOT EXISTS "telegram_link_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_id" varchar(32);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_username" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_linked_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_link_tokens" ADD CONSTRAINT "telegram_link_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_link_tokens_hash_idx" ON "telegram_link_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_telegram_id_idx" ON "users" USING btree ("telegram_id");