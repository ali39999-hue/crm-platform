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
import { AutomationService } from './automation.service.js';
import type { AutomationRuleDto, CreateAutomationRuleRequest } from '@crm/contracts';

@Controller('automation/rules')
@UseGuards(AuthGuard, PermissionsGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get()
  @RequirePermission('manage_integrations')
  async getRules(@CurrentUser() user: UserContext): Promise<AutomationRuleDto[]> {
    return this.automationService.getRules(user.activeOrganization.id);
  }

  @Post()
  @RequirePermission('manage_integrations')
  async createRule(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateAutomationRuleRequest,
  ): Promise<AutomationRuleDto> {
    return this.automationService.createRule(user.activeOrganization.id, dto, user.id);
  }

  @Patch(':id/toggle')
  @RequirePermission('manage_integrations')
  async toggleRule(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body('enabled') enabled: boolean,
  ): Promise<AutomationRuleDto> {
    return this.automationService.toggleRule(user.activeOrganization.id, id, enabled);
  }

  @Post(':id/dry-run')
  @RequirePermission('manage_integrations')
  async dryRun(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body('payload') testPayload: Record<string, any>,
  ): Promise<{ matched: boolean; wouldExecute: string }> {
    return this.automationService.dryRun(user.activeOrganization.id, id, testPayload);
  }

  @Delete(':id')
  @RequirePermission('manage_integrations')
  async deleteRule(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.automationService.deleteRule(user.activeOrganization.id, id);
  }
}
