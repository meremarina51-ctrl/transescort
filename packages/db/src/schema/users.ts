import { pgTable, uuid, varchar, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    login: varchar('login', { length: 255 }).notNull(),
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

    /** Optional profile contact info, editable in the cabinet — not used for auth. */
    email: varchar('email', { length: 255 }),
    /** Client-only, optional. */
    phone: varchar('phone', { length: 32 }),
    /** Performer-only, required at registration — how clients reach them. */
    contactMethod: varchar('contact_method', { length: 20 }).$type<
      'telegram' | 'email' | 'phone' | 'whatsapp'
    >(),
    contactValue: varchar('contact_value', { length: 255 }),

    /** Bumped to invalidate every previously issued refresh token — see AuthService.logoutAllDevices. */
    tokenVersion: integer('token_version').notNull().default(0),

    /** Hashed one-time backup code for password-less recovery — null until first (re)generated. */
    recoveryCodeHash: varchar('recovery_code_hash', { length: 255 }),

    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    loginIdx: uniqueIndex('users_login_idx').on(table.login),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
