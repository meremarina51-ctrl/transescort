CREATE TABLE IF NOT EXISTS "telegram_bot_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" varchar(32) NOT NULL,
	"telegram_username" varchar(255),
	"age_confirmed_at" timestamp,
	"rules_accepted_at" timestamp,
	"pending_listing_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram_bot_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"performer_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram_bot_relay_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"direction" varchar(20) NOT NULL,
	"chat_id" varchar(32) NOT NULL,
	"message_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_bot_clients" ADD CONSTRAINT "telegram_bot_clients_pending_listing_id_listings_id_fk" FOREIGN KEY ("pending_listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_bot_threads" ADD CONSTRAINT "telegram_bot_threads_client_id_telegram_bot_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."telegram_bot_clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_bot_threads" ADD CONSTRAINT "telegram_bot_threads_performer_id_users_id_fk" FOREIGN KEY ("performer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_bot_relay_messages" ADD CONSTRAINT "telegram_bot_relay_messages_thread_id_telegram_bot_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."telegram_bot_threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_bot_clients_telegram_id_idx" ON "telegram_bot_clients" USING btree ("telegram_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_bot_threads_pair_idx" ON "telegram_bot_threads" USING btree ("client_id","performer_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_bot_relay_messages_lookup_idx" ON "telegram_bot_relay_messages" USING btree ("chat_id","message_id");