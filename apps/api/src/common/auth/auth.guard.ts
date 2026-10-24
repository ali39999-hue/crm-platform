import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string;
    const headerUserId = request.headers['x-user-id'] as string;
    const headerOrgId = request.headers['x-organization-id'] as string;

    let userIdentifier: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      userIdentifier = authHeader.substring(7).trim();
    } else if (headerUserId) {
      userIdentifier = headerUserId.trim();
    }

    if (!userIdentifier) {
      throw new UnauthorizedException('Authentication required');
    }

    // Resolve user and active organization from verified membership
    const userContext = this.authService.resolveUser(userIdentifier, headerOrgId);
    request.user = userContext;
    return true;
  }
}
