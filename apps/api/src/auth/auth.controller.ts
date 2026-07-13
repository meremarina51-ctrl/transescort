import { Controller, Post, Get, Patch, Body, Query, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsIn, IsOptional, MinLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Иван Петров' })
  @IsString()
  @MinLength(2, { message: 'Имя слишком короткое' })
  fullName!: string;

  @ApiProperty({ required: false, enum: ['client', 'performer'], default: 'client' })
  @IsOptional()
  @IsIn(['client', 'performer'])
  role?: 'client' | 'performer';
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({ status: 201, description: 'Аккаунт создан, письмо с подтверждением отправлено' })
  @ApiResponse({ status: 409, description: 'Email уже занят' })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.fullName, body.role ?? 'client');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход в систему' })
  @ApiResponse({ status: 200, description: 'Успешный вход' })
  @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
  @ApiResponse({ status: 403, description: 'Email не подтверждён' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Подтвердить email по токену из письма' })
  @ApiResponse({ status: 200, description: 'Email подтверждён, выданы токены' })
  @ApiResponse({ status: 400, description: 'Токен недействителен или истёк' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  @ApiOperation({ summary: 'Повторно отправить письмо с подтверждением email' })
  async resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerification(body.email);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновить токены' })
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Выход из системы' })
  async logout() {
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить текущий профиль' })
  async getProfile(@Request() req: any) {
    const userId = req.user.userId as string;
    const user = await this.usersService.findById(userId);
    return {
      id: user?.id ?? req.user.userId,
      email: user?.email ?? req.user.email,
      role: user?.role ?? req.user.role,
      status: user?.status ?? 'active',
      fullName: user?.fullName ?? null,
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить имя пользователя' })
  async updateProfile(@Request() req: any, @Body() body: { fullName?: string }) {
    const userId = req.user.userId as string;
    if (body.fullName?.trim()) {
      await this.usersService.updateFullName(userId, body.fullName.trim());
    }
    return { ok: true };
  }
}
