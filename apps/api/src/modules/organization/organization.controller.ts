import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { OrganizationService } from './organization.service.js';
import { InvitationService } from './invitation.service.js';
import { OrganizationDirectoryService } from './organization-directory.service.js';
import type {
  OrganizationMemberDto,
  OrganizationSettingsDto,
  TeamDto,
} from '@crm/contracts';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto.js';
import {
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './dto/invite-member.dto.js';
import {
  AddTeamMemberDto,
  CreateTeamDto,
  UpdateTeamDto,
} from './dto/team.dto.js';
import type { InvitationDto } from './invitation.service.js';

@Controller('organization')
@UseGuards(AuthGuard, PermissionsGuard)
export class OrganizationController {
  constructor(
    private readonly orgService: OrganizationService,
    private readonly invitationService: InvitationService,
    private readonly directoryService: OrganizationDirectoryService,
  ) {}

  @Get('settings')
  @RequirePermission('organization_settings')
  async getSettings(
    @CurrentUser() user: UserContext,
  ): Promise<OrganizationSettingsDto> {
    return this.orgService.getSettings(user.activeOrganization.id);
  }

  @Patch('settings')
  @RequirePermission('organization_settings')
  async updateSettings(
    @CurrentUser() user: UserContext,
    @Body() dto: UpdateOrganizationSettingsDto,
  ): Promise<OrganizationSettingsDto> {
    return this.orgService.updateSettings(
      user.activeOrganization.id,
      user.id,
      dto,
    );
  }

  @Get('members')
  @RequirePermission('manage_members')
  async getMembers(
    @CurrentUser() user: UserContext,
  ): Promise<OrganizationMemberDto[]> {
    if (process.env.USE_DATABASE === 'true') {
      return this.directoryService.getMembers(user.activeOrganization.id);
    }
    return this.orgService.getMembers(user.activeOrganization.id);
  }

  @Post('members/invite')
  @RequirePermission('manage_members')
  async inviteMember(
    @CurrentUser() user: UserContext,
    @Body() dto: InviteMemberDto,
  ): Promise<OrganizationMemberDto | { invitation: InvitationDto; token: string }> {
    // P02 migration step: in database mode the legacy instant-member invite is
    // replaced by the one-time-token InvitationService flow (no fabricated
    // user ids, consent + password required). The fixture mode keeps the
    // legacy behavior for dev/E2E until the members UI learns pending states.
    if (process.env.USE_DATABASE === 'true') {
      const result = await this.invitationService.createInvitation(
        user.activeOrganization.id,
        user.id,
        dto,
      );
      return { invitation: result, token: result.token };
    }
    return this.orgService.inviteMember(
      user.activeOrganization.id,
      user.id,
      dto,
    );
  }

  @Patch('members/:id/role')
  @Post('invitations')
  @RequirePermission('manage_members')
  async createInvitation(
    @CurrentUser() user: UserContext,
    @Body() dto: InviteMemberDto,
  ): Promise<{ invitation: InvitationDto; token: string }> {
    const result = await this.invitationService.createInvitation(
      user.activeOrganization.id,
      user.id,
      dto,
    );
    return { invitation: result, token: result.token };
  }

  @Get('invitations')
  @RequirePermission('manage_members')
  async listInvitations(@CurrentUser() user: UserContext): Promise<InvitationDto[]> {
    return this.invitationService.listInvitations(user.activeOrganization.id);
  }

  @Post('invitations/:id/revoke')
  @RequirePermission('manage_members')
  async revokeInvitation(@CurrentUser() user: UserContext, @Param('id') id: string): Promise<InvitationDto> {
    return this.invitationService.revokeInvitation(user.activeOrganization.id, id);
  }

  @RequirePermission('manage_members')
  async updateMemberRole(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<OrganizationMemberDto> {
    if (process.env.USE_DATABASE === 'true') {
      return this.directoryService.updateMemberRole(
        user.activeOrganization.id,
        user.id,
        id,
        dto.role,
      );
    }
    return this.orgService.updateMemberRole(
      user.activeOrganization.id,
      user.id,
      id,
      dto.role,
    );
  }

  @Post('members/:id/revoke')
  @RequirePermission('manage_members')
  async revokeMember(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    if (process.env.USE_DATABASE === 'true') {
      return this.directoryService.revokeMember(
        user.activeOrganization.id,
        user.id,
        id,
      );
    }
    return this.orgService.revokeMember(
      user.activeOrganization.id,
      user.id,
      id,
    );
  }

  @Get('roles')
  @RequirePermission('organization_settings')
  getRolesMatrix() {
    return this.orgService.getRoleMatrix();
  }

  /* Teams & Departments */

  @Get('teams')
  @RequirePermission('organization_settings')
  async getTeams(@CurrentUser() user: UserContext): Promise<TeamDto[]> {
    return this.orgService.getTeams(user.activeOrganization.id);
  }

  @Post('teams')
  @RequirePermission('organization_settings')
  async createTeam(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateTeamDto,
  ): Promise<TeamDto> {
    return this.orgService.createTeam(
      user.activeOrganization.id,
      user.id,
      dto,
    );
  }

  @Patch('teams/:id')
  @RequirePermission('organization_settings')
  async updateTeam(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
  ): Promise<TeamDto> {
    return this.orgService.updateTeam(
      user.activeOrganization.id,
      user.id,
      id,
      dto,
    );
  }

  @Post('teams/:id/members')
  @RequirePermission('organization_settings')
  async addTeamMember(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: AddTeamMemberDto,
  ): Promise<TeamDto> {
    return this.orgService.addTeamMember(
      user.activeOrganization.id,
      user.id,
      id,
      dto.memberId,
    );
  }

  @Delete('teams/:id/members/:memberId')
  @RequirePermission('organization_settings')
  async removeTeamMember(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ): Promise<TeamDto> {
    return this.orgService.removeTeamMember(
      user.activeOrganization.id,
      user.id,
      id,
      memberId,
    );
  }

  @Delete('teams/:id')
  @RequirePermission('organization_settings')
  async deleteTeam(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.orgService.deleteTeam(
      user.activeOrganization.id,
      user.id,
      id,
    );
  }
}
