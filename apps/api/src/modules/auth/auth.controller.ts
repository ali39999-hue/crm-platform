import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { AuthService } from '../../common/auth/auth.service.js';
import type { CurrentUserDto, WorkspaceDto } from '@crm/contracts';

@Controller()
@UseGuards(AuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
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

  @Get('workspaces')
  getWorkspaces(@CurrentUser() user: UserContext): WorkspaceDto[] {
    return this.authService.getWorkspaces(user.id);
  }
}
