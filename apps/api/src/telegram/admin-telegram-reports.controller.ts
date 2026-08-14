import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { TelegramService } from './telegram.service';

const REPORT_DECISIONS = ['resolved', 'dismissed'] as const;

class VerifyTelegramReportDto {
  @ApiProperty({ enum: REPORT_DECISIONS })
  @IsIn(REPORT_DECISIONS)
  decision!: (typeof REPORT_DECISIONS)[number];

  @ApiProperty({ required: false, description: 'Внутренняя заметка админа' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

@ApiTags('Admin Telegram Reports')
@ApiBearerAuth()
@Controller('admin/telegram-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminTelegramReportsController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get()
  @ApiOperation({ summary: 'Все жалобы, поданные через кнопку «Пожаловаться» в Telegram-боте' })
  async list() {
    return this.telegramService.listBotReports();
  }

  @Get(':id/conversation')
  @ApiOperation({ summary: 'Переписка по жалобе из Telegram-бота — доступна только через жалобу, без общего доступа к диалогам' })
  async conversation(@Param('id') id: string) {
    return this.telegramService.getConversationForReport(id);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Закрыть жалобу из Telegram-бота как обработанную или отклонённую' })
  async verify(@Param('id') id: string, @Body() body: VerifyTelegramReportDto) {
    return this.telegramService.verifyBotReport(id, body.decision, body.note);
  }
}
