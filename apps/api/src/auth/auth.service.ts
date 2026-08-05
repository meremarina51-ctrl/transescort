import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import type { User } from '@transescort/db';

interface RegisterExtra {
  phone?: string;
  contactMethod?: 'telegram' | 'email' | 'phone' | 'whatsapp';
  contactValue?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    login: string,
    password: string,
    fullName: string,
    role: 'client' | 'performer',
    extra: RegisterExtra = {},
  ) {
    const user = await this.usersService.createUser(login, password, fullName, role, extra);

    await this.usersService.updateLastLogin(user.id);
    const recoveryCode = await this.usersService.setRecoveryCode(user.id);
    const tokens = await this.generateTokens(user);
    return { user: this.toPublicUser(user), ...tokens, recoveryCode };
  }

  async login(login: string, password: string) {
    const user = await this.usersService.findByLogin(login);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'suspended') {
      throw new UnauthorizedException('Account is blocked');
    }

    const isValid = await this.usersService.validatePassword(user, password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user);

    return { user: this.toPublicUser(user), ...tokens };
  }

  async refreshTokens(refreshToken: string) {
    const payload = await this.verifyToken(refreshToken, 'refresh');
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (payload.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }
    return this.generateTokens(user);
  }

  /** Invalidates every previously issued refresh token by bumping the user's tokenVersion. */
  async logoutAllDevices(userId: string): Promise<void> {
    await this.usersService.incrementTokenVersion(userId);
  }

  /**
   * Password-less recovery: a valid backup code sets a new password. Also revokes every other
   * session (password reset implies "I may have lost control of my account") and issues a fresh
   * backup code, since the one just used is now consumed.
   */
  async recover(login: string, recoveryCode: string, newPassword: string) {
    const user = await this.usersService.findByLogin(login);
    if (!user) {
      throw new UnauthorizedException('Неверный логин или код восстановления');
    }

    const isValid = await this.usersService.verifyRecoveryCode(user, recoveryCode);
    if (!isValid) {
      throw new UnauthorizedException('Неверный логин или код восстановления');
    }

    await this.usersService.updatePassword(user.id, newPassword);
    await this.usersService.incrementTokenVersion(user.id);
    const recoveryCodeNew = await this.usersService.setRecoveryCode(user.id);

    const updatedUser = await this.usersService.findById(user.id);
    const tokens = await this.generateTokens(updatedUser!);
    return { user: this.toPublicUser(updatedUser!), ...tokens, recoveryCode: recoveryCodeNew };
  }

  /** Requires the current password so a hijacked-but-logged-in session can't silently mint a new code. */
  async regenerateRecoveryCode(userId: string, password: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await this.usersService.validatePassword(user, password);
    if (!isValid) {
      throw new UnauthorizedException('Неверный пароль');
    }

    return this.usersService.setRecoveryCode(userId);
  }

  private toPublicUser(user: User) {
    return { id: user.id, login: user.login, fullName: user.fullName, role: user.role };
  }

  private async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, user.role, user.login, user.tokenVersion, 'access'),
      this.signToken(user.id, user.role, user.login, user.tokenVersion, 'refresh'),
    ]);
    return { accessToken, refreshToken };
  }

  private async signToken(
    userId: string,
    role: string,
    login: string,
    tokenVersion: number,
    type: 'access' | 'refresh',
  ) {
    const payload = { sub: userId, login, role, tokenVersion, type };
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    const expiresIn = type === 'access' ? '15m' : '7d';

    return this.jwtService.sign(payload, {
      secret,
      expiresIn,
      issuer: 'transescort-api',
      audience: 'transescort-client',
    });
  }

  private async verifyToken(token: string, type: 'access' | 'refresh') {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    const payload = await this.jwtService.verifyAsync(token, { secret });
    if (payload.type !== type) {
      throw new UnauthorizedException('Invalid token type');
    }
    return payload;
  }
}
