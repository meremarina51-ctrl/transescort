import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../auth/guards/auth-guards.module';
import { TelegramController } from './telegram.controller';
import { AdminTelegramClientsController } from './admin-telegram-clients.controller';
import { AdminTelegramReportsController } from './admin-telegram-reports.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [AuthGuardsModule],
  controllers: [TelegramController, AdminTelegramClientsController, AdminTelegramReportsController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
