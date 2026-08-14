import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { TelegramService } from '../telegram/telegram.service';
import { UsersService } from './users.service';

class AdminUpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiProperty({ required: false, description: 'Пустая строка — сбросить' })
  @IsOptional()
  @ValidateIf((o) => o.email !== undefined && o.email !== '')
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(255)
  email?: string;

  @ApiProperty({ required: false, description: 'Пустая строка — сбросить' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;
}

class SetStatusDto {
  @ApiProperty({ enum: ['active', 'suspended'] })
  @IsIn(['active', 'suspended'])
  status!: 'active' | 'suspended';
}

class SetMessagingRestrictionDto {
  @ApiProperty({ description: 'true — запретить отправку сообщений в чате, false — снять ограничение' })
  @IsBoolean()
  restricted!: boolean;
}

@ApiTags('Admin Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly telegramService: TelegramService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Список всех пользователей' })
  async list() {
    return this.usersService.listAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Пользователь по id' })
  async getOne(@Param('id') id: string) {
    const user = await this.usersService.findPublicById(id);
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Редактировать данные пользователя' })
  async update(@Param('id') id: string, @Body() body: AdminUpdateUserDto) {
    const existing = await this.usersService.findById(id);
    if (!existing) throw new NotFoundException('Пользователь не найден');

    await this.usersService.updateProfile(id, {
      fullName: body.fullName?.trim(),
      email: body.email !== undefined ? body.email.trim() : undefined,
      phone: body.phone !== undefined ? body.phone.trim() : undefined,
    });

    return this.usersService.findPublicById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Заблокировать / разблокировать пользователя' })
  async setStatus(@Param('id') id: string, @Body() body: SetStatusDto, @Request() req: any) {
    if (id === req.user.userId) {
      throw new BadRequestException('Нельзя изменить статус своего аккаунта');
    }
    const existing = await this.usersService.findById(id);
    if (!existing) throw new NotFoundException('Пользователь не найден');

    await this.usersService.setStatus(id, body.status);
    return this.usersService.findPublicById(id);
  }

  @Patch(':id/messaging-restriction')
  @ApiOperation({ summary: 'Ограничить / снять ограничение на отправку сообщений в чате — применяется при спаме или жалобах' })
  async setMessagingRestriction(@Param('id') id: string, @Body() body: SetMessagingRestrictionDto, @Request() req: any) {
    if (id === req.user.userId) {
      throw new BadRequestException('Нельзя изменить ограничение своего аккаунта');
    }
    const existing = await this.usersService.findById(id);
    if (!existing) throw new NotFoundException('Пользователь не найден');

    await this.usersService.setMessagingRestriction(id, body.restricted);
    return this.usersService.findPublicById(id);
  }

  @Patch(':id/telegram-unlink')
  @ApiOperation({ summary: 'Принудительно отвязать Telegram-аккаунт от профиля пользователя' })
  async unlinkTelegram(@Param('id') id: string) {
    const existing = await this.usersService.findById(id);
    if (!existing) throw new NotFoundException('Пользователь не найден');

    await this.telegramService.unlink(id);
    return this.usersService.findPublicById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить пользователя' })
  async remove(@Param('id') id: string, @Request() req: any) {
    if (id === req.user.userId) {
      throw new BadRequestException('Нельзя удалить свой аккаунт');
    }
    const existing = await this.usersService.findById(id);
    if (!existing) throw new NotFoundException('Пользователь не найден');

    await this.usersService.deleteUser(id);
    return { ok: true };
  }
}
