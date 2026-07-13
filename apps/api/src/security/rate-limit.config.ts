import { Module, Global } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: configService.get<number>('RATE_LIMIT_TTL', 60) * 1000,
            limit: configService.get<number>('RATE_LIMIT_MAX', 100),
          },
        ],
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}

export { Throttle, SkipThrottle } from '@nestjs/throttler';
