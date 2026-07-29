/**
 * Seed 5 sample performer listings for the public catalog.
 * Photos are intentionally left empty — upload them manually via the cabinet afterwards.
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/seed-listings.ts
 */

import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { slugify } from '../listings/slug.util';

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

const SEED_PASSWORD = 'Seed12345!';

const PROFILES = [
  {
    login: 'alina.seed',
    fullName: 'Алина',
    name: 'Алина',
    age: 24,
    height: 168,
    weight: 54,
    breastSize: 2,
    type: 'Универсал',
    figure: 'Стройная',
    temperament: 'Игривая',
    hairColor: 'Блондинка',
    eyeColor: 'Голубые',
    country: 'Россия',
    city: 'Москва',
    bio: 'Приветливая и открытая, люблю уютные встречи и хорошие разговоры за бокалом вина.',
    contactMethod: 'telegram',
    contactValue: '@alina_seed',
  },
  {
    login: 'viktoria.seed',
    fullName: 'Виктория',
    name: 'Виктория',
    age: 26,
    height: 172,
    weight: 58,
    breastSize: 3,
    type: 'Активный',
    figure: 'Спортивная',
    temperament: 'Страстная',
    hairColor: 'Брюнетка',
    eyeColor: 'Карие',
    country: 'Россия',
    city: 'Балашиха',
    bio: 'Энергичная и уверенная в себе, ценю искренность и хорошее чувство юмора.',
    contactMethod: 'whatsapp',
    contactValue: '+79991234567',
  },
  {
    login: 'darya.seed',
    fullName: 'Дарья',
    name: 'Дарья',
    age: 23,
    height: 165,
    weight: 52,
    breastSize: 2,
    type: 'Пассивный',
    figure: 'Худощавая',
    temperament: 'Нежная',
    hairColor: 'Шатенка',
    eyeColor: 'Зелёные',
    country: 'Россия',
    city: 'Химки',
    bio: 'Спокойная и внимательная, создам тёплую атмосферу для приятного вечера.',
    contactMethod: 'phone',
    contactValue: '+79997654321',
  },
  {
    login: 'ekaterina.seed',
    fullName: 'Екатерина',
    name: 'Екатерина',
    age: 29,
    height: 170,
    weight: 62,
    breastSize: 4,
    type: 'Универсал',
    figure: 'Пышная',
    temperament: 'Доминантная',
    hairColor: 'Рыжая',
    eyeColor: 'Серые',
    country: 'Беларусь',
    city: 'Одинцово',
    bio: 'Яркая и харизматичная, знаю, как сделать встречу незабываемой.',
    contactMethod: 'telegram',
    contactValue: '@ekaterina_seed',
  },
  {
    login: 'sofia.seed',
    fullName: 'Софья',
    name: 'Софья',
    age: 25,
    height: 174,
    weight: 56,
    breastSize: 3,
    type: 'Активный',
    figure: 'Модельная',
    temperament: 'Спокойная',
    hairColor: 'Блондинка',
    eyeColor: 'Чёрные',
    country: 'Россия',
    city: 'Мытищи',
    bio: 'Элегантная и утончённая, предпочитаю неспешные встречи и хорошие рестораны.',
    contactMethod: 'email',
    contactValue: 'sofia.seed@transescort.local',
  },
] as const;

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  const generateUniqueSlug = async (name: string): Promise<string> => {
    const base = slugify(name) || 'anketa';
    let candidate = base;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const taken = await sql`SELECT id FROM listings WHERE slug = ${candidate}`;
      if (taken.length === 0) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  };

  try {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    for (const p of PROFILES) {
      let userId: string;
      const existingUser = await sql`SELECT id FROM users WHERE login = ${p.login}`;

      if (existingUser.length > 0) {
        userId = existingUser[0].id;
        console.log(`User ${p.login} already exists, reusing`);
      } else {
        const inserted = await sql`
          INSERT INTO users (login, password_hash, full_name, role, status, contact_method, contact_value, created_at, updated_at)
          VALUES (${p.login}, ${passwordHash}, ${p.fullName}, 'performer', 'active', ${p.contactMethod}, ${p.contactValue}, NOW(), NOW())
          RETURNING id
        `;
        userId = inserted[0].id;
        console.log(`Created user ${p.login}`);
      }

      const existingListing = await sql`SELECT id, slug FROM listings WHERE user_id = ${userId}`;

      if (existingListing.length > 0) {
        const slug = existingListing[0].slug || (await generateUniqueSlug(p.name));
        await sql`
          UPDATE listings SET
            status = 'published',
            slug = ${slug},
            bio = ${p.bio},
            name = ${p.name},
            age = ${p.age},
            height = ${p.height},
            weight = ${p.weight},
            breast_size = ${p.breastSize},
            type = ${p.type},
            figure = ${p.figure},
            temperament = ${p.temperament},
            hair_color = ${p.hairColor},
            eye_color = ${p.eyeColor},
            country = ${p.country},
            city = ${p.city},
            updated_at = NOW()
          WHERE user_id = ${userId}
        `;
        console.log(`Updated listing for ${p.name} (slug: ${slug})`);
      } else {
        const slug = await generateUniqueSlug(p.name);
        await sql`
          INSERT INTO listings (
            user_id, status, slug, bio, name, age, height, weight, breast_size,
            type, figure, temperament, hair_color, eye_color, country, city,
            created_at, updated_at
          ) VALUES (
            ${userId}, 'published', ${slug}, ${p.bio}, ${p.name}, ${p.age}, ${p.height}, ${p.weight}, ${p.breastSize},
            ${p.type}, ${p.figure}, ${p.temperament}, ${p.hairColor}, ${p.eyeColor}, ${p.country}, ${p.city},
            NOW(), NOW()
          )
        `;
        console.log(`Created listing for ${p.name} (slug: ${slug})`);
      }
    }

    console.log('');
    console.log('Done. 5 published listings ready.');
    console.log(`Password for each: ${SEED_PASSWORD}`);

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error('Failed to seed listings:', error.message);
    await sql.end();
    process.exit(1);
  }
}

seed();
