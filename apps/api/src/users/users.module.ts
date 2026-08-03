import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../auth/guards/auth-guards.module';
import { UsersService } from './users.service';
import { AdminUsersController } from './users.controller';

@Module({
  imports: [AuthGuardsModule],
  controllers: [AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
