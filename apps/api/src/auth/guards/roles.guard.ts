import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RequestWithUser } from './jwt-auth.guard';

export type AppRole = 'client' | 'performer' | 'admin';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const role = context.switchToHttp().getRequest<RequestWithUser>().user?.role as AppRole | undefined;
    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
