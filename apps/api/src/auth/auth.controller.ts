import { Controller, Post, Get, Patch, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsIn, IsOptional, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
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
  @Matches(/(?:.*\S){8,}/, { message: 'Пароль должен содержать минимум 8 значащих символов' })
  password!: string;

  @ApiProperty({ example: 'Иван Петров' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({ status: 201, description: 'Аккаунт создан' })
  @ApiResponse({ status: 409, description: 'Email уже занят' })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.fullName, body.role ?? 'client');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход в систему' })
  @ApiResponse({ status: 200, description: 'Успешный вход' })
  @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
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
