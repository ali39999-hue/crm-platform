import { describe, expect, it, beforeEach } from 'vitest';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthController } from './auth.controller.js';
import { AuthService } from '../../common/auth/auth.service.js';
import { TokenService } from '../../common/auth/token.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { IS_PUBLIC_KEY } from '../../common/auth/public.decorator.js';

describe('Secure Session Management & Auth (Task F4-03)', () => {
  let authController: AuthController;
  let authService: AuthService;
  let tokenService: TokenService;
  let auditService: AuditService;
  let authGuard: AuthGuard;
  let reflector: Reflector;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBetaId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const adminEmail = 'admin@org-alpha.com';
  const employeeEmail = 'employee@org-alpha.com';
  const multiOrgEmail = 'multiorg@example.com';
  const validPassword = 'password123';

  const createMockContext = (options: {
    authorization?: string;
    userId?: string;
    orgId?: string;
    isPublic?: boolean;
  }): { context: ExecutionContext; req: any } => {
    const req: any = {
      headers: {
        ...(options.authorization ? { authorization: options.authorization } : {}),
        ...(options.userId ? { 'x-user-id': options.userId } : {}),
        ...(options.orgId ? { 'x-organization-id': options.orgId } : {}),
      },
      user: undefined,
    };

    const handler = () => {};
    if (options.isPublic) {
      Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);
    }

    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
      }),
      getHandler: () => handler,
      getClass: () => class DummyController {},
    } as unknown as ExecutionContext;

    return { context, req };
  };

  beforeEach(() => {
    authService = new AuthService();
    tokenService = new TokenService('test-secret-key-at-least-32-chars-long-12345', 900, 604800);
    auditService = new AuditService();
    authController = new AuthController(authService, tokenService, auditService);
    reflector = new Reflector();
    authGuard = new AuthGuard(reflector, authService, tokenService);
  });

  /* ---------------- 1. Login with Valid and Invalid Credentials ---------------- */

  describe('1. Login with Valid & Invalid Credentials', () => {
    it('successfully logs in with valid email and password', async () => {
      const response = await authController.login({
        email: adminEmail,
        password: validPassword,
      });

      expect(response).toBeDefined();
      expect(response.accessToken).toBeDefined();
      expect(response.refreshToken).toBeDefined();
      expect(response.expiresIn).toBe(900);
      expect(response.tokenType).toBe('Bearer');
      expect(response.user.email).toBe(adminEmail);
      expect(response.user.activeOrganization.id).toBe(orgAlphaId);
      expect(response.user.activeOrganization.role).toBe('SystemOwner');
    });

    it('records AUTH_LOGIN_SUCCESS audit event on successful login', async () => {
      await authController.login({
        email: employeeEmail,
        password: validPassword,
      });

      const events = auditService.getEvents(orgAlphaId);
      const loginEvent = events.find((e) => e.action === 'AUTH_LOGIN_SUCCESS');
      expect(loginEvent).toBeDefined();
      expect(loginEvent?.entityType).toBe('User');
      expect(loginEvent?.metadata?.email).toBe(employeeEmail);
      expect(loginEvent?.metadata?.sessionId).toBeDefined();
    });

    it('rejects login with incorrect password and throws UnauthorizedException', async () => {
      await expect(
        authController.login({
          email: adminEmail,
          password: 'incorrect-password',
        }),
      ).rejects.toThrow(UnauthorizedException);

      // Verifies AUTH_LOGIN_FAILED audit event was recorded
      const events = auditService.getEvents('system');
      const failEvent = events.find((e) => e.action === 'AUTH_LOGIN_FAILED');
      expect(failEvent).toBeDefined();
      expect(failEvent?.entityId).toBe(adminEmail);
    });

    it('rejects login with non-existent email and logs failure', async () => {
      const fakeEmail = 'nonexistent-user@org-alpha.com';
      await expect(
        authController.login({
          email: fakeEmail,
          password: validPassword,
        }),
      ).rejects.toThrow(UnauthorizedException);

      const events = auditService.getEvents('system');
      const failEvent = events.find(
        (e) => e.action === 'AUTH_LOGIN_FAILED' && e.entityId === fakeEmail,
      );
      expect(failEvent).toBeDefined();
    });

    it('rejects login with empty password', async () => {
      await expect(
        authController.login({
          email: adminEmail,
          password: '',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  /* ---------------- 2. Token Generation, Verification & Expiration ---------------- */

  describe('2. Token Service Generation, Verification & Expiration', () => {
    it('generates a valid JWT pair with 3 dot-separated segments', () => {
      const pair = tokenService.generateTokenPair({
        userId: '11111111-1111-1111-1111-111111111111',
        email: adminEmail,
        orgId: orgAlphaId,
        role: 'SystemOwner',
      });

      expect(pair.accessToken.split('.').length).toBe(3);
      expect(pair.refreshToken.split('.').length).toBe(3);
      expect(pair.sessionId).toBeDefined();
    });

    it('verifies access token successfully and extracts payload', () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const pair = tokenService.generateTokenPair({
        userId,
        email: adminEmail,
        orgId: orgAlphaId,
        role: 'SystemOwner',
      });

      const payload = tokenService.verifyToken(pair.accessToken, 'access');
      expect(payload.sub).toBe(userId);
      expect(payload.email).toBe(adminEmail);
      expect(payload.orgId).toBe(orgAlphaId);
      expect(payload.role).toBe('SystemOwner');
      expect(payload.type).toBe('access');
      expect(payload.jti).toBeDefined();
      expect(payload.sessionId).toBe(pair.sessionId);
    });

    it('rejects token with invalid signature', () => {
      const pair = tokenService.generateTokenPair({
        userId: '11111111-1111-1111-1111-111111111111',
        email: adminEmail,
        orgId: orgAlphaId,
        role: 'SystemOwner',
      });

      // Tamper signature segment
      const tampered = `${pair.accessToken.slice(0, -6)}xxxxxx`;
      expect(() => tokenService.verifyToken(tampered)).toThrow(UnauthorizedException);
    });

    it('rejects expired token', () => {
      // Create service with -10s TTL and same secret
      const expiredService = new TokenService('test-secret-key-at-least-32-chars-long-12345', -10, -10);
      const pair = expiredService.generateTokenPair({
        userId: '11111111-1111-1111-1111-111111111111',
        email: adminEmail,
        orgId: orgAlphaId,
        role: 'SystemOwner',
      });

      expect(() => expiredService.verifyToken(pair.accessToken)).toThrow(UnauthorizedException);
      expect(() => expiredService.verifyToken(pair.accessToken)).toThrow(/expired/i);
    });

    it('rejects when token type does not match expected type', () => {
      const pair = tokenService.generateTokenPair({
        userId: '11111111-1111-1111-1111-111111111111',
        email: adminEmail,
        orgId: orgAlphaId,
        role: 'SystemOwner',
      });

      // Expect refresh type on an access token
      expect(() => tokenService.verifyToken(pair.accessToken, 'refresh')).toThrow(
        UnauthorizedException,
      );
    });
  });

  /* ---------------- 3. Token Refresh and Rotation ---------------- */

  describe('3. Token Refresh & Rotation', () => {
    it('successfully refreshes token pair with valid refresh token', async () => {
      const loginRes = await authController.login({
        email: employeeEmail,
        password: validPassword,
      });

      const refreshRes = await authController.refresh({
        refreshToken: loginRes.refreshToken,
      });

      expect(refreshRes).toBeDefined();
      expect(refreshRes.accessToken).toBeDefined();
      expect(refreshRes.refreshToken).toBeDefined();
      // New refresh token must be different from the old one
      expect(refreshRes.refreshToken).not.toBe(loginRes.refreshToken);
      expect(refreshRes.user.email).toBe(employeeEmail);
    });

    it('rotates refresh token: old refresh token is revoked after use', async () => {
      const loginRes = await authController.login({
        email: employeeEmail,
        password: validPassword,
      });

      // First refresh succeeds and rotates the token
      await authController.refresh({
        refreshToken: loginRes.refreshToken,
      });

      // Attempting to reuse old refresh token must be rejected
      await expect(
        authController.refresh({
          refreshToken: loginRes.refreshToken,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects refresh when an access token is supplied instead of refresh token', async () => {
      const loginRes = await authController.login({
        email: employeeEmail,
        password: validPassword,
      });

      // Pass accessToken instead of refreshToken
      await expect(
        authController.refresh({
          refreshToken: loginRes.accessToken,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects refresh when refresh token is malformed', async () => {
      await expect(
        authController.refresh({
          refreshToken: 'invalid.malformed.token',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  /* ---------------- 4. Logout, Revocation Store & Blacklist Check ---------------- */

  describe('4. Logout, Revocation Store & Session Invalidation', () => {
    it('revokes access token and refresh token upon logout', async () => {
      const loginRes = await authController.login({
        email: employeeEmail,
        password: validPassword,
      });

      const userContext = authService.resolveUser(loginRes.user.id);
      const tokenPayload = tokenService.verifyToken(loginRes.accessToken, 'access');

      const mockReq: any = {
        token: loginRes.accessToken,
        tokenPayload,
      };

      const logoutRes = await authController.logout(mockReq, userContext, {
        refreshToken: loginRes.refreshToken,
      });

      expect(logoutRes.success).toBe(true);

      // Verify tokens are now revoked in tokenService
      expect(tokenService.isRevoked(loginRes.accessToken)).toBe(true);
      expect(tokenService.isRevoked(loginRes.refreshToken)).toBe(true);
      expect(tokenService.isRevoked(tokenPayload.sessionId)).toBe(true);
    });

    it('records AUTH_LOGOUT audit event on logout', async () => {
      const loginRes = await authController.login({
        email: employeeEmail,
        password: validPassword,
      });

      const userContext = authService.resolveUser(loginRes.user.id);
      const tokenPayload = tokenService.verifyToken(loginRes.accessToken, 'access');

      await authController.logout(
        { token: loginRes.accessToken, tokenPayload } as any,
        userContext,
      );

      const events = auditService.getEvents(orgAlphaId);
      const logoutEvent = events.find((e) => e.action === 'AUTH_LOGOUT');
      expect(logoutEvent).toBeDefined();
      expect(logoutEvent?.actorId).toBe(userContext.id);
      expect(logoutEvent?.metadata?.sessionId).toBe(tokenPayload.sessionId);
    });

    it('rejects subsequent requests via AuthGuard after logout', async () => {
      const loginRes = await authController.login({
        email: employeeEmail,
        password: validPassword,
      });

      const userContext = authService.resolveUser(loginRes.user.id);
      const tokenPayload = tokenService.verifyToken(loginRes.accessToken, 'access');

      // Logout
      await authController.logout(
        { token: loginRes.accessToken, tokenPayload } as any,
        userContext,
        { refreshToken: loginRes.refreshToken },
      );

      // Attempt to access protected endpoint using the logged-out token
      const { context } = createMockContext({
        authorization: `Bearer ${loginRes.accessToken}`,
      });

      expect(() => authGuard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => authGuard.canActivate(context)).toThrow(/revoked/i);
    });

    it('supports revoking all tokens for a user (session invalidation on admin action)', async () => {
      const user = authService.resolveUser('11111111-1111-1111-1111-111111111111');
      const token1 = tokenService.generateTokenPair({
        userId: user.id,
        email: user.email,
        orgId: orgAlphaId,
        role: 'SystemOwner',
      });

      // Invalidate all sessions for this user
      tokenService.revokeAllForUser(user.id);

      // Token issued before or at invalidation time is now revoked
      expect(tokenService.isRevoked(token1.accessToken)).toBe(true);
      expect(() => tokenService.verifyToken(token1.accessToken)).toThrow(/revoked/i);
    });

    it('cleans up expired records in revocation store', () => {
      // Add a token that has already expired
      tokenService.revokeToken('expired-jti-123', Math.floor(Date.now() / 1000) - 100);
      tokenService.revokeSession('expired-session-123', Math.floor(Date.now() / 1000) - 100);

      // Cleanup
      tokenService.cleanupExpired();

      // Expired items should no longer be in the store
      expect(tokenService.isRevoked('expired-jti-123')).toBe(false);
      expect(tokenService.isRevoked('expired-session-123')).toBe(false);
    });
  });

  /* ---------------- 5. Switch Workspace Tenant Validation ---------------- */

  describe('5. Switch Workspace & Tenant Validation', () => {
    it('switches workspace successfully for user belonging to multiple organizations', async () => {
      // User multiorg belongs to both Org Alpha and Org Beta
      const userContextAlpha = authService.resolveUser(multiOrgEmail, orgAlphaId);
      expect(userContextAlpha.activeOrganization.id).toBe(orgAlphaId);

      const loginRes = await authController.login({
        email: multiOrgEmail,
        password: validPassword,
      });

      const tokenPayload = tokenService.verifyToken(loginRes.accessToken, 'access');
      const mockReq: any = {
        token: loginRes.accessToken,
        tokenPayload,
      };

      const switchRes = await authController.switchWorkspace(mockReq, userContextAlpha, {
        organizationId: orgBetaId,
      });

      expect(switchRes).toBeDefined();
      expect(switchRes.user.activeOrganization.id).toBe(orgBetaId);
      expect(switchRes.user.activeOrganization.name).toBe('سازمان بتا');

      // New token must contain Org Beta claims
      const newPayload = tokenService.verifyToken(switchRes.accessToken, 'access');
      expect(newPayload.orgId).toBe(orgBetaId);

      // Audit event was logged
      const events = auditService.getEvents(orgBetaId);
      const switchEvent = events.find((e) => e.action === 'AUTH_SWITCH_WORKSPACE');
      expect(switchEvent).toBeDefined();
      expect(switchEvent?.metadata?.fromOrgId).toBe(orgAlphaId);
      expect(switchEvent?.metadata?.toOrgId).toBe(orgBetaId);
    });

    it('rejects switching workspace if user is not a member of the target organization', async () => {
      // Employee belongs only to Org Alpha
      const employeeContext = authService.resolveUser(employeeEmail, orgAlphaId);

      const mockReq: any = {
        token: 'mock-token',
        tokenPayload: { sessionId: 'mock-session' },
      };

      await expect(
        authController.switchWorkspace(mockReq, employeeContext, {
          organizationId: orgBetaId, // Employee is not member of Beta
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects switching to non-existent organization with ForbiddenException', async () => {
      const employeeContext = authService.resolveUser(employeeEmail, orgAlphaId);

      await expect(
        authController.switchWorkspace({} as any, employeeContext, {
          organizationId: '99999999-9999-9999-9999-999999999999',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  /* ---------------- 6. AuthGuard End-to-End Behavior ---------------- */

  describe('6. AuthGuard Enforcement', () => {
    it('allows public endpoints without authentication header', () => {
      const { context } = createMockContext({ isPublic: true });
      expect(authGuard.canActivate(context)).toBe(true);
    });

    it('rejects protected endpoints when no credentials are provided', () => {
      const { context } = createMockContext({});
      expect(() => authGuard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('accepts protected endpoints with valid Bearer JWT', async () => {
      const loginRes = await authController.login({
        email: employeeEmail,
        password: validPassword,
      });

      const { context, req } = createMockContext({
        authorization: `Bearer ${loginRes.accessToken}`,
      });

      expect(authGuard.canActivate(context)).toBe(true);
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe(employeeEmail);
      expect(req.token).toBe(loginRes.accessToken);
    });

    it('rejects protected endpoints with revoked Bearer JWT', async () => {
      const loginRes = await authController.login({
        email: employeeEmail,
        password: validPassword,
      });

      tokenService.revokeToken(loginRes.accessToken);

      const { context } = createMockContext({
        authorization: `Bearer ${loginRes.accessToken}`,
      });

      expect(() => authGuard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => authGuard.canActivate(context)).toThrow(/revoked/i);
    });

    it('supports backward-compatible x-user-id header in test environment', () => {
      const userId = '22222222-2222-2222-2222-222222222222';
      const { context, req } = createMockContext({
        userId,
      });

      expect(authGuard.canActivate(context)).toBe(true);
      expect(req.user.id).toBe(userId);
    });
  });

  /* ---------------- 7. Me and Workspaces Endpoints ---------------- */

  describe('7. Profile & Workspaces', () => {
    it('returns profile via getMe', () => {
      const user = authService.resolveUser(adminEmail);
      const profile = authController.getMe(user);

      expect(profile.id).toBe(user.id);
      expect(profile.email).toBe(adminEmail);
      expect(profile.displayName).toBe('مدیر سیستم');
      expect(profile.activeOrganization.id).toBe(orgAlphaId);
    });

    it('returns workspace list via getWorkspaces marking active org as current', () => {
      const user = authService.resolveUser(multiOrgEmail, orgBetaId);
      const workspaces = authController.getWorkspaces(user);

      expect(workspaces.length).toBe(2);
      const current = workspaces.find((w) => w.isCurrent);
      expect(current?.id).toBe(orgBetaId);
    });
  });
});
