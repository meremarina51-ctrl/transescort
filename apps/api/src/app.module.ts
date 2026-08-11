/**
 * Root module: ConfigModule (reads repo-root .env) -> DatabaseModule (DRIZZLE provider)
 * -> feature modules with HTTP controllers.
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuardsModule } from './auth/guards/auth-guards.module';
import { RateLimitModule } from './security/rate-limit.config';
import { ListingsModule } from './listings/listings.module';
import { ModerationModule } from './moderation/moderation.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ChatModule } from './chat/chat.module';
import { TelegramModule } from './telegram/telegram.module';
import { ReviewsModule } from './reviews/reviews.module';

function resolveEnvFilePath(): string {
  const cwd = process.cwd();
  for (let depth = 0; depth < 8; depth++) {
    const base = depth === 0 ? cwd : resolve(cwd, ...Array(depth).fill('..'));
    const envPath = resolve(base, '.env');
    if (existsSync(envPath)) return envPath;
  }
  return resolve(cwd, '.env');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePath(),
    }),
    DatabaseModule,
    HealthModule,
    UsersModule,
    AuthModule,
    AuthGuardsModule,
    RateLimitModule,
    ListingsModule,
    ModerationModule,
    FavoritesModule,
    ChatModule,
    TelegramModule,
    ReviewsModule,
  ],
})
export class AppModule {}
