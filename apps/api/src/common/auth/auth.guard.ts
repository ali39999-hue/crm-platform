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

    const isProd = process.env.NODE_ENV === 'production';
    const isAllowedInsecure =
      process.env.NODE_ENV !== 'production' &&
      (process.env.ALLOW_INSECURE_DEV_AUTH === 'true' || process.env.NODE_ENV === 'test');

    let rawToken: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawToken = authHeader.substring(7).trim();
    } else if (headerUserId) {
      // Security Gate F-01 / RA-001:
      // Direct x-user-id header is strictly rejected in production!
      if (isProd || !isAllowedInsecure) {
        throw new UnauthorizedException(
          'Insecure identity-only header (x-user-id) is strictly forbidden in production. A valid Bearer JWT is required.',
        );
      }
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

      // Security Gate: Ensure target organization matches user's valid membership (anti-IDOR)
      if (headerOrgId && userContext.activeOrganization.id !== headerOrgId) {
        throw new UnauthorizedException(
          'Forbidden: User is not an active member of the requested organization',
        );
      }

      request.token = rawToken;
      request.tokenPayload = payload;
    } else {
      // Security Gate F-01: Direct identity string (email/userId) as token is forbidden in production
      if (isProd || !isAllowedInsecure) {
        throw new UnauthorizedException(
          'Direct identity tokens are forbidden in production. A cryptographically signed Bearer JWT is required.',
        );
      }
      // Fallback for non-production environments with explicit flag enabled
      userContext = this.authService.resolveUser(rawToken, headerOrgId);
      request.token = rawToken;
    }

    request.user = userContext;
    return true;
  }
}
