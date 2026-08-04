import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../auth/guards/auth-guards.module';
import { ListingsModule } from '../listings/listings.module';
import { ModerationController } from './moderation.controller';

@Module({
  imports: [AuthGuardsModule, ListingsModule],
  controllers: [ModerationController],
})
export class ModerationModule {}
