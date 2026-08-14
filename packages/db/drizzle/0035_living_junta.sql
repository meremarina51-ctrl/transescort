CREATE TABLE IF NOT EXISTS "telegram_bot_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"reporter_role" varchar(20) NOT NULL,
	"category" varchar(30) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_bot_reports" ADD CONSTRAINT "telegram_bot_reports_thread_id_telegram_bot_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."telegram_bot_threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
