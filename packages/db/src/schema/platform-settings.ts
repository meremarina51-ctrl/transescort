import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/** Key-value хранилище платформенных флагов — например режим CTA на лендинге. */
export const platformSettings = pgTable(
    'platform_settings',
    {
        key: varchar('key', { length: 64 }).primaryKey(),
        value: varchar('value', { length: 255 }).notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    }
);

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type NewPlatformSetting = typeof platformSettings.$inferInsert;
