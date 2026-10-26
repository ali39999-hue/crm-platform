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
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { TimeTrackingService } from './timetracking.service.js';
import type {
  WorkLogDto,
  WorkLogEntityType,
  WorkLogSummaryDto,
} from '@crm/contracts';
import { CreateWorkLogDto } from './dto/create-worklog.dto.js';
import { UpdateWorkLogDto } from './dto/update-worklog.dto.js';

@Controller('timetracking')
@UseGuards(AuthGuard, PermissionsGuard)
export class TimeTrackingController {
  constructor(private readonly service: TimeTrackingService) {}

  @Get()
  @RequirePermission('view_internal_tasks')
  async getWorkLogs(
    @CurrentUser() user: UserContext,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: WorkLogEntityType,
    @Query('entityId') entityId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<WorkLogDto[]> {
    return this.service.getWorkLogs(user.activeOrganization.id, {
      userId,
      entityType,
      entityId,
      fromDate,
      toDate,
    });
  }

  @Get('summary')
  @RequirePermission('view_internal_tasks')
  async getSummary(
    @CurrentUser() user: UserContext,
    @Query('userId') userId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<WorkLogSummaryDto> {
    return this.service.getSummary(user.activeOrganization.id, {
      userId,
      fromDate,
      toDate,
    });
  }

  @Post()
  @RequirePermission('create_or_edit_tasks')
  async createWorkLog(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateWorkLogDto,
  ): Promise<WorkLogDto> {
    return this.service.createWorkLog(
      user.activeOrganization.id,
      {
        id: user.id,
        name: user.displayName,
      },
      dto,
    );
  }

  @Patch(':id')
  @RequirePermission('create_or_edit_tasks')
  async updateWorkLog(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateWorkLogDto,
  ): Promise<WorkLogDto> {
    return this.service.updateWorkLog(
      user.activeOrganization.id,
      {
        id: user.id,
        role: user.activeOrganization.role,
      },
      id,
      dto,
    );
  }

  @Delete(':id')
  @RequirePermission('create_or_edit_tasks')
  async deleteWorkLog(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.service.deleteWorkLog(
      user.activeOrganization.id,
      {
        id: user.id,
        role: user.activeOrganization.role,
      },
      id,
    );
  }
}
