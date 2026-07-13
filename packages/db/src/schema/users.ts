import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    role: varchar('role', { length: 20 })
      .$type<'client' | 'performer' | 'admin'>()
      .notNull()
      .default('client'),
    status: varchar('status', { length: 20 })
      .$type<'active' | 'suspended'>()
      .notNull()
      .default('active'),

    /** NULL until the user clicks the link from the verification email. */
    emailVerifiedAt: timestamp('email_verified_at'),
    /** sha256(token); the plain token is only ever in the emailed link. */
    emailVerificationTokenHash: varchar('email_verification_token_hash', { length: 64 }),
    emailVerificationExpiresAt: timestamp('email_verification_expires_at'),

    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    verificationTokenIdx: uniqueIndex('users_email_verification_token_idx').on(
      table.emailVerificationTokenHash,
    ),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
