import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ReportsService } from './reports.service';
import { VerifyReportDto } from './dto/verify-report.dto';

@ApiTags('Admin Reports')
@ApiBearerAuth()
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Все жалобы (любой статус) — очередь модерации фильтруется на клиенте по status=pending' })
  async list() {
    return this.reportsService.listAllForAdmin();
  }

  @Get(':id/conversation')
  @ApiOperation({ summary: 'Переписка по жалобе на сообщение — доступна только через жалобу, без общего доступа к чатам' })
  async conversation(@Param('id') id: string) {
    return this.reportsService.getConversationForReport(id);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Закрыть жалобу как обработанную или отклонённую' })
  async verify(@Param('id') id: string, @Body() body: VerifyReportDto) {
    return this.reportsService.verify(id, body.decision, body.note);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить жалобу безвозвратно' })
  async remove(@Param('id') id: string) {
    await this.reportsService.adminDelete(id);
    return { ok: true };
  }
}
