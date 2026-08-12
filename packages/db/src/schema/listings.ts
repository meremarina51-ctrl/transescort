import { pgTable, uuid, varchar, integer, text, timestamp, uniqueIndex, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

/** One listing per performer — created/updated from the cabinet "Моя анкета" section. */
export const listings = pgTable(
  'listings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /**
     * The anketa's single lifecycle status:
     * - draft              — being edited, never submitted (or sent back and not yet resubmitted)
     * - pending             — submitted, awaiting an admin decision
     * - changes_requested   — admin sent it back with a required note (see `verificationNote`)
     * - published           — approved and live in the public catalog
     * - hidden              — was published; performer or admin pulled it out of the catalog (no re-review needed to restore)
     * - blocked             — admin force-blocked it for a policy violation (see `verificationNote`); only an admin can lift this
     * Performers can only reach `pending`/`hidden` themselves (via submit/hide/unhide); every other
     * transition requires an admin decision — see ListingsService.verify/block/unblock/adminHide/adminUnhide.
     */
    status: varchar('status', { length: 20 })
      .$type<'draft' | 'pending' | 'changes_requested' | 'published' | 'hidden' | 'blocked'>()
      .notNull()
      .default('draft'),

    /** Admin's note — required when requesting changes or blocking, shown to the performer. */
    verificationNote: text('verification_note'),
    submittedAt: timestamp('submitted_at'),

    /**
     * Independent of `status` — an admin manually confirms the photos are genuine (not stolen/AI-generated)
     * and only then flips this on. Shown as a trust badge in the catalog and on the anketa page; never
     * set automatically and never reset by publish/hide/block transitions.
     */
    photosVerified: boolean('photos_verified').notNull().default(false),

    /** Set once, the first time this anketa is approved — never reset. Used only to distinguish a brand-new submission from a resubmission in the admin moderation queue. */
    everPublished: boolean('ever_published').notNull().default(false),

    /** URL slug, transliterated from `name` at creation time — stable, doesn't change on rename. */
    slug: varchar('slug', { length: 160 }),

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

    /** Rubles. Shown to clients only once the performer has a paid tariff (not enforced yet). */
    priceHour: integer('price_hour'),
    priceNight: integer('price_night'),

    /** Same visibility rule as pricing. */
    contactPhone: varchar('contact_phone', { length: 32 }),
    contactTelegram: varchar('contact_telegram', { length: 100 }),
    contactWhatsapp: varchar('contact_whatsapp', { length: 32 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex('listings_user_idx').on(table.userId),
    slugIdx: uniqueIndex('listings_slug_idx').on(table.slug),
  }),
);

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
