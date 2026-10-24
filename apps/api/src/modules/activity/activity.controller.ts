import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { ActivityService } from './activity.service.js';
import type { CustomerTimelineItem } from '@crm/contracts';

@Controller('activities')
@UseGuards(AuthGuard, PermissionsGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('recent')
  async getRecent(
    @CurrentUser() user: UserContext,
    @Query('limit') limit?: number,
  ): Promise<CustomerTimelineItem[]> {
    return this.activityService.getRecentActivities(
      user.activeOrganization.id,
      user.activeOrganization.role,
      limit ? Number(limit) : 50,
    );
  }

  @Get('account/:accountId')
  async getAccountTimeline(
    @CurrentUser() user: UserContext,
    @Param('accountId') accountId: string,
    @Query('limit') limit?: number,
  ): Promise<CustomerTimelineItem[]> {
    return this.activityService.getAccountTimeline(
      user.activeOrganization.id,
      user.activeOrganization.role,
      accountId,
      limit ? Number(limit) : 50,
    );
  }

  @Get('entity/:type/:id')
  async getEntityTimeline(
    @CurrentUser() user: UserContext,
    @Param('type') type: string,
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<CustomerTimelineItem[]> {
    return this.activityService.getEntityTimeline(
      user.activeOrganization.id,
      user.activeOrganization.role,
      type.toUpperCase(),
      id,
      limit ? Number(limit) : 50,
    );
  }
}
