import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../auth/guards/auth-guards.module';
import { ReportsController } from './reports.controller';
import { AdminReportsController } from './admin-reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthGuardsModule],
  controllers: [ReportsController, AdminReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
