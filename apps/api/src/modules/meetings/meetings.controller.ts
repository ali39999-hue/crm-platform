import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { MeetingsService } from './meetings.service.js';
import type { Request } from 'express';
import type {
  ConvertResolutionToTaskRequest,
  CreateMeetingMinuteRequest,
  MeetingMinuteDto,
  MeetingResolutionDto,
  SignatureStatus,
} from '@crm/contracts';

@Controller('meetings')
@UseGuards(AuthGuard, PermissionsGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  @RequirePermission('view_internal_tasks')
  async listMeetings(@CurrentUser() user: UserContext): Promise<MeetingMinuteDto[]> {
    return this.meetingsService.listMeetings(user.activeOrganization.id);
  }

  @Post()
  @RequirePermission('create_or_edit_tasks')
  async createMeeting(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateMeetingMinuteRequest,
    @Req() req: Request,
  ): Promise<MeetingMinuteDto> {
    const requestId = (req as any).requestId as string | undefined;
    return this.meetingsService.createMeeting(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  @Get(':id')
  @RequirePermission('view_internal_tasks')
  async getMeetingById(
    @CurrentUser() user: UserContext,
    @Param('id') meetingId: string,
  ): Promise<MeetingMinuteDto> {
    return this.meetingsService.getMeetingById(user.activeOrganization.id, meetingId);
  }

  @Post(':id/sign')
  @RequirePermission('create_or_edit_tasks')
  async signMeeting(
    @CurrentUser() user: UserContext,
    @Param('id') meetingId: string,
    @Body('status') status: SignatureStatus,
    @Req() req: Request,
  ): Promise<MeetingMinuteDto> {
    const requestId = (req as any).requestId as string | undefined;
    return this.meetingsService.signMeeting(
      user.activeOrganization.id,
      user.id,
      meetingId,
      status || 'SIGNED',
      requestId,
    );
  }

  @Post(':id/resolutions/:resolutionId/convert-to-task')
  @RequirePermission('create_or_edit_tasks')
  async convertResolutionToTask(
    @CurrentUser() user: UserContext,
    @Param('id') meetingId: string,
    @Param('resolutionId') resolutionId: string,
    @Body() dto: ConvertResolutionToTaskRequest,
    @Req() req: Request,
  ): Promise<{ resolution: MeetingResolutionDto; taskId: string }> {
    const requestId = (req as any).requestId as string | undefined;
    return this.meetingsService.convertResolutionToTask(
      user.activeOrganization.id,
      user.id,
      meetingId,
      resolutionId,
      dto,
      requestId,
    );
  }
}
