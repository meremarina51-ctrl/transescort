import { Controller, Delete, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, type RequestWithUser } from '../auth/guards/jwt-auth.guard';
import { TelegramService } from './telegram.service';

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('bot-info')
  @ApiOperation({ summary: 'Публичная информация о боте (username) — для ссылок "Написать в Telegram"' })
  getBotInfo() {
    return this.telegramService.getBotInfo();
  }

  @Post('link-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать одноразовую ссылку для привязки Telegram (действует 10 минут)' })
  async createLinkToken(@Request() req: RequestWithUser) {
    return this.telegramService.createLinkToken(req.user!.userId);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Статус привязки Telegram текущего пользователя' })
  async getStatus(@Request() req: RequestWithUser) {
    return this.telegramService.getStatus(req.user!.userId);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Отвязать Telegram от аккаунта' })
  async unlink(@Request() req: RequestWithUser) {
    await this.telegramService.unlink(req.user!.userId);
    return { message: 'Telegram отвязан' };
  }
}
