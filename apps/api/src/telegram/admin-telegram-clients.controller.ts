import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { TelegramService } from './telegram.service';

class BlockTelegramClientDto {
  @ApiProperty({ description: 'true — заблокировать доступ к боту, false — снять блокировку' })
  @IsBoolean()
  blocked!: boolean;

  @ApiProperty({ required: false, description: 'Причина блокировки — необязательна' })
  @ValidateIf((o) => o.blocked === true)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

@ApiTags('Admin Telegram')
@ApiBearerAuth()
@Controller('admin/telegram-clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminTelegramClientsController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get()
  @ApiOperation({ summary: 'Список анонимных пользователей Telegram-бота' })
  async list() {
    return this.telegramService.listBotClients();
  }

  @Patch(':id/block')
  @ApiOperation({ summary: 'Заблокировать или разблокировать доступ пользователя к Telegram-боту' })
  async block(@Param('id') id: string, @Body() body: BlockTelegramClientDto) {
    return this.telegramService.setBotClientBlocked(id, body.blocked, body.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить анонимного пользователя Telegram-бота вместе с его диалогами' })
  async remove(@Param('id') id: string) {
    const deleted = await this.telegramService.deleteBotClient(id);
    if (!deleted) throw new NotFoundException('Пользователь Telegram-бота не найден');
    return { success: true };
  }
}
