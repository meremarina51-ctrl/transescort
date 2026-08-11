import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../auth/guards/auth-guards.module';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [AuthGuardsModule],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
