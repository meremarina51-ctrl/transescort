/**
 * Global DB module: one Postgres client for the whole app.
 * Services inject the 'DRIZZLE' provider and run select/insert/update via drizzle-orm.
 */

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@transescort/db';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const postgres = require('postgres');

@Global()
@Module({
  providers: [
    {
      provide: 'DRIZZLE',
      useFactory: async (configService: ConfigService) => {
        const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');
        const client = postgres(databaseUrl, { max: 10 });
        await client`select 1 as bootstrap_ok`;
        return drizzle(client, { schema });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DRIZZLE'],
})
export class DatabaseModule {}
