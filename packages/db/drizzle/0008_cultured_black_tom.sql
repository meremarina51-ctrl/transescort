DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email'
  ) THEN
    UPDATE "users" SET "login" = "email" WHERE "login" IS NULL;
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "login" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "email";