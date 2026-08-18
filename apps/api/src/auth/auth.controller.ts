import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsIn,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
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

export class DeleteAccountDto {
  @ApiProperty({ description: 'Текущий пароль — обязателен для подтверждения удаления' })
  @IsString()
  @IsNotEmpty({ message: 'Введите пароль для подтверждения' })
  password!: string;
}

export class RecoverAccountDto {
  @ApiProperty({ example: 'ivan_petrov' })
  @IsString()
  @IsNotEmpty()
  login!: string;

  @ApiProperty({ example: 'A7K9-XQ2R-BC3D-FG4H', description: 'Код восстановления, выданный при регистрации' })
  @IsString()
  @IsNotEmpty({ message: 'Введите код восстановления' })
  recoveryCode!: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(8)
  @Matches(/(?:.*\S){8,}/, { message: 'Пароль должен содержать минимум 8 значащих символов' })
  newPassword!: string;
}

export class RegenerateRecoveryCodeDto {
  @ApiProperty({ description: 'Текущий пароль — обязателен для перевыпуска кода' })
  @IsString()
  @IsNotEmpty({ message: 'Введите пароль для подтверждения' })
  password!: string;
}

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiProperty({ required: false, description: 'Необязательно, для профиля клиента' })
  @IsOptional()
  @ValidateIf((o) => o.email !== undefined && o.email !== '')
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(255)
  email?: string;

  @ApiProperty({ required: false, description: 'WhatsApp, необязательно' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ example: 'currentPassword123' })
  @IsString()
  @IsNotEmpty({ message: 'Введите текущий пароль' })
  currentPassword!: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(8)
  @Matches(/(?:.*\S){8,}/, { message: 'Пароль должен содержать минимум 8 значащих символов' })
  newPassword!: string;
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

  @Post('recover')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Восстановить доступ по коду восстановления и задать новый пароль' })
  @ApiResponse({ status: 401, description: 'Неверный логин или код восстановления' })
  async recover(@Body() body: RecoverAccountDto) {
    return this.authService.recover(body.login, body.recoveryCode, body.newPassword);
  }

  @Post('recovery-code/regenerate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Перевыпустить код восстановления' })
  @ApiResponse({ status: 403, description: 'Неверный пароль' })
  async regenerateRecoveryCode(@Request() req: any, @Body() body: RegenerateRecoveryCodeDto) {
    const recoveryCode = await this.authService.regenerateRecoveryCode(req.user.userId as string, body.password);
    return { recoveryCode };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Завершить все активные сессии пользователя' })
  async logoutAll(@Request() req: any) {
    await this.authService.logoutAllDevices(req.user.userId as string);
    return { message: 'Все сессии завершены' };
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить свой аккаунт' })
  @ApiResponse({ status: 403, description: 'Неверный пароль' })
  async deleteOwnAccount(@Request() req: any, @Body() body: DeleteAccountDto) {
    const userId = req.user.userId as string;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await this.usersService.validatePassword(user, body.password);
    if (!isValid) {
      // 403, not 401 — the session/access token is perfectly valid here, only the confirmation
      // password was wrong. authFetch treats any 401 as "token expired" and silently refreshes +
      // retries; since the retry would fail with the same wrong-password 401, that logs the user
      // out and bounces them to /login instead of just showing "Неверный пароль" on this form.
      throw new ForbiddenException('Неверный пароль');
    }

    await this.usersService.deleteUser(userId);
    return { message: 'Аккаунт удалён' };
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить пароль пользователя' })
  @ApiResponse({ status: 403, description: 'Неверный текущий пароль' })
  async updatePassword(@Request() req: any, @Body() body: UpdatePasswordDto) {
    const userId = req.user.userId as string;
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await this.usersService.validatePassword(user, body.currentPassword);
    if (!isValid) {
      // See the same note in deleteOwnAccount — must be 403, not 401, or authFetch's silent
      // refresh-and-retry-then-logout logic kicks the user to /login on a simple wrong-password entry.
      throw new ForbiddenException('Неверный текущий пароль');
    }

    await this.usersService.updatePassword(userId, body.newPassword);
    await this.authService.logoutAllDevices(userId);

    return { message: 'Пароль обновлён, все сессии завершены' };
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
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      createdAt: user?.createdAt ?? null,
      messagingRestricted: Boolean(user?.messagingRestrictedAt),
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить профиль пользователя' })
  async updateProfile(@Request() req: any, @Body() body: UpdateProfileDto) {
    const userId = req.user.userId as string;
    await this.usersService.updateProfile(userId, {
      fullName: body.fullName?.trim(),
      email: body.email !== undefined ? body.email.trim() : undefined,
      phone: body.phone !== undefined ? body.phone.trim() : undefined,
    });

    const user = await this.usersService.findById(userId);
    return {
      id: user?.id ?? userId,
      login: user?.login,
      role: user?.role,
      status: user?.status ?? 'active',
      fullName: user?.fullName ?? null,
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      createdAt: user?.createdAt ?? null,
      messagingRestricted: Boolean(user?.messagingRestrictedAt),
    };
  }
}
