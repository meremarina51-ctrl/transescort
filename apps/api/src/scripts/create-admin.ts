/**
 * Create Admin User Script
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/create-admin.ts
 */

import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { existsSync } from 'fs';
import { resolve } from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const postgres = require('postgres');

for (let depth = 0; depth < 8; depth++) {
  const envPath = resolve(__dirname, ...Array(depth).fill('..'), '.env');
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}
dotenv.config();

async function createAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    const existing = await sql`SELECT id FROM users WHERE role = 'admin'`;
    if (existing.length > 0) {
      console.log('Admin user already exists');
      await sql.end();
      process.exit(0);
    }

    const email = 'admin@transescort.local';
    const password = 'Admin123!';
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sql`
      INSERT INTO users (email, password_hash, full_name, role, status, email_verified_at, created_at, updated_at)
      VALUES (${email}, ${passwordHash}, 'Admin', 'admin', 'active', NOW(), NOW(), NOW())
      RETURNING id
    `;

    console.log('Admin user created successfully!');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  ID: ${result[0].id}`);

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error('Failed to create admin:', error.message);
    await sql.end();
    process.exit(1);
  }
}

createAdmin();
