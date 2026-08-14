import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../auth/guards/auth-guards.module';
import { TelegramModule } from '../telegram/telegram.module';
import { UsersService } from './users.service';
import { AdminUsersController } from './users.controller';

@Module({
  imports: [AuthGuardsModule, TelegramModule],
  controllers: [AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
