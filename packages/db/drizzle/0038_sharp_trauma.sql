CREATE TABLE IF NOT EXISTS "platform_settings" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value" varchar(255) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
