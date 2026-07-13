import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import type { User } from '@transescort/db';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(email: string, password: string, fullName: string, role: 'client' | 'performer') {
    const { user, verificationToken } = await this.usersService.createUser(email, password, fullName, role);

    if (this.emailVerificationEnabled()) {
      await this.sendVerificationEmail(user, verificationToken);
    } else {
      // No SMTP configured — nothing to verify against, mark verified immediately.
      await this.usersService.markEmailVerified(user.id);
    }

    // Registration logs the user in right away; email verification (if enabled) happens in the background.
    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user);
    return { user: this.toPublicUser(user), ...tokens };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
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

    if (!user.emailVerifiedAt && this.emailVerificationEnabled()) {
      throw new ForbiddenException({ code: 'EMAIL_NOT_VERIFIED', message: 'Email ещё не подтверждён' });
    }

    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user);

    return { user: this.toPublicUser(user), ...tokens };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.verifyEmailByToken(token);
    if (!user) {
      throw new BadRequestException('Ссылка недействительна или устарела');
    }

    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user);
    return { user: this.toPublicUser(user), ...tokens };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    // Same response whether or not the account exists/is already verified — avoid leaking which emails are registered.
    if (user && !user.emailVerifiedAt && this.emailVerificationEnabled()) {
      const token = await this.usersService.issueVerificationToken(user.id);
      await this.sendVerificationEmail(user, token);
    }
    return { message: 'Если аккаунт существует и не подтверждён, письмо отправлено повторно.' };
  }

  async refreshTokens(refreshToken: string) {
    const payload = await this.verifyToken(refreshToken, 'refresh');
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.generateTokens(user);
  }

  /** SMTP_HOST unset — most likely local/dev without Mailhog, or a deploy that hasn't wired email yet. */
  private emailVerificationEnabled(): boolean {
    return !!this.configService.get<string>('SMTP_HOST')?.trim();
  }

  private async sendVerificationEmail(user: User, token: string) {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL').replace(/\/$/, '');
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
    await this.emailService.sendVerificationEmail(user.email, user.fullName, verifyUrl);
  }

  private toPublicUser(user: User) {
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
  }

  private async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, user.role, user.email, 'access'),
      this.signToken(user.id, user.role, user.email, 'refresh'),
    ]);
    return { accessToken, refreshToken };
  }

  private async signToken(userId: string, role: string, email: string, type: 'access' | 'refresh') {
    const payload = { sub: userId, email, role, type };
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
