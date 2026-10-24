import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isActionAllowed, type PermissionAction } from '@crm/domain';
import { PERMISSION_KEY } from './require-permission.decorator.js';
import type { UserContext } from './auth.types.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<PermissionAction>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as UserContext;

    if (!user || !user.activeOrganization) {
      throw new ForbiddenException('User context or active organization missing');
    }

    const role = user.activeOrganization.role;
    const allowed = isActionAllowed(role, requiredPermission);

    if (!allowed) {
      throw new ForbiddenException(
        `Permission denied: role '${role}' is not permitted to perform '${requiredPermission}'`,
      );
    }

    return true;
  }
}
