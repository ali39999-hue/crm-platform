import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { Public } from '../../common/auth/public.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { AuthService } from '../../common/auth/auth.service.js';
import { TokenService, type TokenPayload } from '../../common/auth/token.service.js';
import { AuditService } from '../audit/audit.service.js';
import { InvitationService } from '../organization/invitation.service.js';
import type { CurrentUserDto, WorkspaceDto } from '@crm/contracts';
import {
  AcceptInvitationDto,
  AuthResponseDto,
  LoginRequestDto,
  LogoutRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
  SwitchWorkspaceRequestDto,
} from './dto/auth.dto.js';

@Controller()
@UseGuards(AuthGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
    private readonly invitationService: InvitationService,
  ) {}

  /**
   * Tenant onboarding (P02): creates the owner account + organization and
   * issues the first token pair. Public by definition; protected by the
   * sensitive-path rate limit (auth/*).
   */
  @Public()
  @Post(['register', 'auth/register'])
  async register(@Body() dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const userRecord = await this.authService.register({
      organizationName: dto.organizationName,
      email: dto.email,
      password: dto.password,
      displayName: dto.displayName,
    });
    const userContext = await this.authService.resolveUser(userRecord.id);

    const tokenPair = this.tokenService.generateTokenPair({
      userId: userContext.id,
      email: userContext.email,
      orgId: userContext.activeOrganization.id,
      role: userContext.activeOrganization.role,
    });

    this.auditService.record({
      organizationId: userContext.activeOrganization.id,
      actorId: userContext.id,
      action: 'AUTH_REGISTER',
      entityType: 'User',
      entityId: userContext.id,
      metadata: { email: userContext.email, sessionId: tokenPair.sessionId },
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      tokenType: tokenPair.tokenType,
      user: {
        id: userContext.id,
        email: userContext.email,
        displayName: userContext.displayName,
        activeOrganization: userContext.activeOrganization,
        memberships: userContext.memberships,
      },
    };
  }

  /**
   * Redeems a member invitation with its one-time token. New invitees set
   * their password here; existing users join with their current identity.
   */
  @Public()
  @Post('auth/invitations/accept')
  async acceptInvitation(
    @Body() dto: AcceptInvitationDto,
  ): Promise<{ organizationId: string; organizationName: string; role: string; email: string }> {
    return this.invitationService.acceptInvitation({
      token: dto.token,
      password: dto.password,
      displayName: dto.displayName,
    });
  }

  @Public()
  @Post(['login', 'auth/login'])
  async login(@Body() dto: LoginRequestDto): Promise<AuthResponseDto> {
    try {
      const userRecord = await this.authService.validateCredentials(dto.email, dto.password);
      const userContext = await this.authService.resolveUser(userRecord.id);

      const tokenPair = this.tokenService.generateTokenPair({
        userId: userContext.id,
        email: userContext.email,
        orgId: userContext.activeOrganization.id,
        role: userContext.activeOrganization.role,
      });

      this.auditService.record({
        organizationId: userContext.activeOrganization.id,
        actorId: userContext.id,
        action: 'AUTH_LOGIN_SUCCESS',
        entityType: 'User',
        entityId: userContext.id,
        metadata: {
          email: dto.email,
          sessionId: tokenPair.sessionId,
        },
      });

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        tokenType: tokenPair.tokenType,
        user: {
          id: userContext.id,
          email: userContext.email,
          displayName: userContext.displayName,
          activeOrganization: userContext.activeOrganization,
          memberships: userContext.memberships,
        },
      };
    } catch (err) {
      this.auditService.record({
        organizationId: 'system',
        actorId: null,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'User',
        entityId: dto.email || 'unknown',
        metadata: {
          email: dto.email,
          reason: err instanceof Error ? err.message : 'Unknown error',
        },
      });
      throw err;
    }
  }

  @Public()
  @Post(['refresh', 'auth/refresh'])
  async refresh(@Body() dto: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // Verify refresh token (checks signature, exp, revocation, and type: 'refresh')
    const payload = this.tokenService.verifyToken(dto.refreshToken, 'refresh');

    // Token rotation: revoke the consumed refresh token
    this.tokenService.revokeToken(payload.jti, payload.exp);

    // Resolve user context
    const userContext = await this.authService.resolveUser(payload.sub, payload.orgId);

    // Issue new token pair preserving the session
    const tokenPair = this.tokenService.generateTokenPair({
      userId: userContext.id,
      email: userContext.email,
      orgId: userContext.activeOrganization.id,
      role: userContext.activeOrganization.role,
      sessionId: payload.sessionId,
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      tokenType: tokenPair.tokenType,
      user: {
        id: userContext.id,
        email: userContext.email,
        displayName: userContext.displayName,
        activeOrganization: userContext.activeOrganization,
        memberships: userContext.memberships,
      },
    };
  }

  @Post(['logout', 'auth/logout'])
  async logout(
    @Req() req: Request,
    @CurrentUser() user: UserContext,
    @Body() body?: LogoutRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    const rawToken = (req as any).token as string | undefined;
    const tokenPayload = (req as any).tokenPayload as TokenPayload | undefined;

    // Revoke current access token
    if (rawToken) {
      this.tokenService.revokeToken(rawToken);
    }

    // Revoke session if sessionId is known
    if (tokenPayload?.sessionId) {
      this.tokenService.revokeSession(tokenPayload.sessionId);
    }

    // Revoke refresh token if supplied in body
    if (body?.refreshToken) {
      this.tokenService.revokeToken(body.refreshToken);
      const refreshPayload = this.tokenService.decodeToken(body.refreshToken);
      if (refreshPayload?.sessionId) {
        this.tokenService.revokeSession(refreshPayload.sessionId);
      }
    }

    this.auditService.record({
      organizationId: user.activeOrganization.id,
      actorId: user.id,
      action: 'AUTH_LOGOUT',
      entityType: 'User',
      entityId: user.id,
      metadata: {
        email: user.email,
        sessionId: tokenPayload?.sessionId,
      },
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post(['switch-workspace', 'auth/switch-workspace'])
  async switchWorkspace(
    @Req() req: Request,
    @CurrentUser() user: UserContext,
    @Body() dto: SwitchWorkspaceRequestDto,
  ): Promise<AuthResponseDto> {
    const targetMembership = user.memberships.find(
      (m) => m.organizationId === dto.organizationId && m.active,
    );

    if (!targetMembership) {
      throw new ForbiddenException(
        'User is not an active member of the requested organization',
      );
    }

    const newUserContext = await this.authService.resolveUser(user.id, dto.organizationId);
    const tokenPayload = (req as any).tokenPayload as TokenPayload | undefined;

    const tokenPair = this.tokenService.generateTokenPair({
      userId: newUserContext.id,
      email: newUserContext.email,
      orgId: newUserContext.activeOrganization.id,
      role: newUserContext.activeOrganization.role,
      sessionId: tokenPayload?.sessionId,
    });

    this.auditService.record({
      organizationId: dto.organizationId,
      actorId: user.id,
      action: 'AUTH_SWITCH_WORKSPACE',
      entityType: 'Organization',
      entityId: dto.organizationId,
      metadata: {
        fromOrgId: user.activeOrganization.id,
        toOrgId: dto.organizationId,
        newRole: targetMembership.role,
      },
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      tokenType: tokenPair.tokenType,
      user: {
        id: newUserContext.id,
        email: newUserContext.email,
        displayName: newUserContext.displayName,
        activeOrganization: newUserContext.activeOrganization,
        memberships: newUserContext.memberships,
      },
    };
  }

  @Get(['me', 'auth/me'])
  getMe(@CurrentUser() user: UserContext): CurrentUserDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      activeOrganization: {
        id: user.activeOrganization.id,
        name: user.activeOrganization.name,
        slug: user.activeOrganization.slug,
        role: user.activeOrganization.role,
      },
      memberships: user.memberships,
    };
  }

  @Get(['workspaces', 'auth/workspaces'])
  async getWorkspaces(@CurrentUser() user: UserContext): Promise<WorkspaceDto[]> {
    return this.authService.getWorkspaces(user.id, user.activeOrganization.id);
  }
}
