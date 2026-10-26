import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { ActivityService } from './activity.service.js';
import type {
  ActivityDto,
  ActivityStatus,
  ActivityType,
  CalendarConflictDto,
  CustomerTimelineItem,
} from '@crm/contracts';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';

@Controller('activities')
@UseGuards(AuthGuard, PermissionsGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /* Passive Timeline */

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

  /* Scheduled Activities & Calendar */

  @Post()
  async createScheduled(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateActivityDto,
  ): Promise<{ activity: ActivityDto; conflictInfo: CalendarConflictDto }> {
    return this.activityService.createScheduledActivity(
      user.activeOrganization.id,
      {
        id: user.id,
        displayName: user.displayName,
        role: user.activeOrganization.role,
      },
      dto,
    );
  }

  @Get('calendar/jalali')
  async getJalaliCalendar(
    @CurrentUser() user: UserContext,
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ) {
    const today = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : today.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : today.getMonth() + 1;
    return this.activityService.getJalaliCalendarMonth(
      user.activeOrganization.id,
      year,
      month,
      user.activeOrganization.role,
    );
  }

  @Get('pinned')
  async getPinnedActivities(
    @CurrentUser() user: UserContext,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ): Promise<ActivityDto[]> {
    return this.activityService.getPinnedActivities(
      user.activeOrganization.id,
      entityType,
      entityId,
    );
  }

  @Post(':id/pin')
  async togglePinActivity(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<ActivityDto> {
    return this.activityService.togglePinActivity(
      user.activeOrganization.id,
      user.id,
      id,
    );
  }

  @Get('calendar')
  async getCalendarActivities(
    @CurrentUser() user: UserContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: ActivityType,
    @Query('status') status?: ActivityStatus,
    @Query('ownerId') ownerId?: string,
  ): Promise<ActivityDto[]> {
    const filters: {
      from?: string | undefined;
      to?: string | undefined;
      type?: ActivityType | undefined;
      status?: ActivityStatus | undefined;
      ownerId?: string | undefined;
    } = {};

    if (from !== undefined) filters.from = from;
    if (to !== undefined) filters.to = to;
    if (type !== undefined) filters.type = type;
    if (status !== undefined) filters.status = status;
    if (ownerId !== undefined) filters.ownerId = ownerId;

    return this.activityService.getCalendarActivities(
      user.activeOrganization.id,
      user.activeOrganization.role,
      filters,
    );
  }

  @Get('conflicts')
  async checkConflicts(
    @CurrentUser() user: UserContext,
    @Query('startsAt') startsAt: string,
    @Query('endsAt') endsAt: string,
    @Query('participantIds') participantIdsStr?: string,
    @Query('excludeId') excludeId?: string,
  ): Promise<CalendarConflictDto> {
    const participantIds = participantIdsStr
      ? participantIdsStr.split(',').map((p) => p.trim())
      : [user.id];

    return this.activityService.checkConflicts(
      user.activeOrganization.id,
      startsAt,
      endsAt,
      participantIds,
      excludeId,
    );
  }

  @Get(':id')
  async getScheduledActivity(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<ActivityDto> {
    return this.activityService.getScheduledActivityById(
      user.activeOrganization.id,
      id,
    );
  }

  @Patch(':id')
  async updateScheduledActivity(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ): Promise<ActivityDto> {
    return this.activityService.updateScheduledActivity(
      user.activeOrganization.id,
      {
        id: user.id,
        displayName: user.displayName,
        role: user.activeOrganization.role,
      },
      id,
      dto,
    );
  }

  @Delete(':id')
  async deleteScheduledActivity(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const success = await this.activityService.deleteScheduledActivity(
      user.activeOrganization.id,
      user.id,
      id,
    );
    return { success };
  }
}
