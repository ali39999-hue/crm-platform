import {
  Body,
  Controller,
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
import type {
  OrganizationMemberDto,
  OrganizationSettingsDto,
} from '@crm/contracts';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto.js';
import {
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './dto/invite-member.dto.js';

@Controller('organization')
@UseGuards(AuthGuard, PermissionsGuard)
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

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
    return this.orgService.getMembers(user.activeOrganization.id);
  }

  @Post('members/invite')
  @RequirePermission('manage_members')
  async inviteMember(
    @CurrentUser() user: UserContext,
    @Body() dto: InviteMemberDto,
  ): Promise<OrganizationMemberDto> {
    return this.orgService.inviteMember(
      user.activeOrganization.id,
      user.id,
      dto,
    );
  }

  @Patch('members/:id/role')
  @RequirePermission('manage_members')
  async updateMemberRole(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<OrganizationMemberDto> {
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
}
