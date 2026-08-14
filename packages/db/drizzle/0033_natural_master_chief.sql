ALTER TABLE "telegram_bot_clients" ADD COLUMN "blocked_at" timestamp;--> statement-breakpoint
ALTER TABLE "telegram_bot_clients" ADD COLUMN "blocked_reason" text;