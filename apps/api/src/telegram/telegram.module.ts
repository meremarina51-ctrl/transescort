import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../auth/guards/auth-guards.module';
import { TelegramController } from './telegram.controller';
import { AdminTelegramClientsController } from './admin-telegram-clients.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [AuthGuardsModule],
  controllers: [TelegramController, AdminTelegramClientsController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
