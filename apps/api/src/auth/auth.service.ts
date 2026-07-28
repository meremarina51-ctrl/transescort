import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import type { User } from '@transescort/db';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(email: string, password: string, fullName: string, role: 'client' | 'performer') {
    const user = await this.usersService.createUser(email, password, fullName, role);

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
    return this.generateTokens(user);
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
