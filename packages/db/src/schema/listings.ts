import { pgTable, uuid, varchar, integer, text, timestamp, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

/** One listing per performer — created/updated from the cabinet "Моя анкета" section. */
export const listings = pgTable(
  'listings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    status: varchar('status', { length: 20 })
      .$type<'draft' | 'published'>()
      .notNull()
      .default('draft'),

    bio: text('bio'),
    photos: jsonb('photos').$type<string[]>().notNull().default([]),
    videoUrl: varchar('video_url', { length: 500 }),

    name: varchar('name', { length: 100 }),
    age: integer('age'),
    height: integer('height'),
    weight: integer('weight'),

    breastSize: integer('breast_size'),
    type: varchar('type', { length: 30 }),
    figure: varchar('figure', { length: 30 }),
    temperament: varchar('temperament', { length: 30 }),
    hairColor: varchar('hair_color', { length: 30 }),
    eyeColor: varchar('eye_color', { length: 30 }),
    country: varchar('country', { length: 50 }),
    city: varchar('city', { length: 50 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex('listings_user_idx').on(table.userId),
  }),
);

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
