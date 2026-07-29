import { Controller, Post, Get, Patch, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsNotEmpty, MinLength, MaxLength, Matches, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

export const CONTACT_METHOD_OPTIONS = ['telegram', 'email', 'phone', 'whatsapp'] as const;

export class RegisterDto {
  @ApiProperty({ example: 'ivan_petrov' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3, { message: 'Логин слишком короткий' })
  @MaxLength(100)
  login!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @Matches(/(?:.*\S){8,}/, { message: 'Пароль должен содержать минимум 8 значащих символов' })
  password!: string;

  @ApiProperty({ required: false, enum: ['client', 'performer'], default: 'client' })
  @IsOptional()
  @IsIn(['client', 'performer'])
  role?: 'client' | 'performer';

  @ApiProperty({ required: false, description: 'Клиент: необязательно' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiProperty({ required: false, enum: CONTACT_METHOD_OPTIONS, description: 'Обязательно для исполнителя' })
  @ValidateIf((o) => o.role === 'performer')
  @IsIn(CONTACT_METHOD_OPTIONS, { message: 'Укажите способ связи' })
  contactMethod?: (typeof CONTACT_METHOD_OPTIONS)[number];

  @ApiProperty({ required: false, example: '@ivan_petrov', description: 'Обязательно для исполнителя' })
  @ValidateIf((o) => o.role === 'performer')
  @IsString()
  @IsNotEmpty({ message: 'Укажите контакт' })
  @MaxLength(255)
  contactValue?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'ivan_petrov' })
  @IsString()
  login!: string;

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
  @ApiResponse({ status: 409, description: 'Логин уже занят' })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.login, body.password, body.login, body.role ?? 'client', {
      phone: body.phone,
      contactMethod: body.contactMethod,
      contactValue: body.contactValue,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход в систему' })
  @ApiResponse({ status: 200, description: 'Успешный вход' })
  @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.login, body.password);
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
      login: user?.login ?? req.user.login,
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
