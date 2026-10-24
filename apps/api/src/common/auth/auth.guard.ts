import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly tokenService: TokenService = new TokenService(),
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

    let rawToken: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawToken = authHeader.substring(7).trim();
    } else if (headerUserId) {
      rawToken = headerUserId.trim();
    }

    if (!rawToken) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check if token is revoked directly
    if (this.tokenService.isRevoked(rawToken)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    let userContext;

    if (this.tokenService.isTokenFormat(rawToken)) {
      // Verify JWT signature, expiration, revocation and access token type
      const payload = this.tokenService.verifyToken(rawToken, 'access');
      const targetOrgId = headerOrgId || payload.orgId;
      userContext = this.authService.resolveUser(payload.sub, targetOrgId);
      request.token = rawToken;
      request.tokenPayload = payload;
    } else {
      // Fallback for mock/test environments passing user id or email directly
      userContext = this.authService.resolveUser(rawToken, headerOrgId);
      request.token = rawToken;
    }

    request.user = userContext;
    return true;
  }
}
