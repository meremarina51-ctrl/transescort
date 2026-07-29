import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, SetMetadata } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  login: string;
  role: 'client' | 'performer' | 'admin';
  type: 'access' | 'refresh';
  jti?: string;
  iat: number;
  exp: number;
}

export interface RequestWithUser extends Request {
  user?: {
    userId: string;
    login: string;
    role: string;
    iat: number;
    exp: number;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        algorithms: ['HS256'],
        issuer: 'transescort-api',
        audience: 'transescort-client',
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      request.user = {
        userId: payload.sub,
        login: payload.login || '',
        role: payload.role,
        iat: payload.iat,
        exp: payload.exp,
      };

      return true;
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired. Please refresh.');
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
