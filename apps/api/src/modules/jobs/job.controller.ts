import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { JobWorkerService } from './job-worker.service.js';
import {
  EnqueueJobDto,
  JobPriority,
  JobRecord,
  JobStatsDto,
  JobStatus,
} from './job.types.js';

@Controller('operations/jobs')
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermission('manage_integrations')
export class JobController {
  constructor(private readonly jobWorkerService: JobWorkerService) {}

  @Get('stats')
  @RequirePermission('manage_integrations')
  async getStats(@CurrentUser() user: UserContext): Promise<JobStatsDto> {
    return this.jobWorkerService.getStats(user.activeOrganization.id);
  }

  @Get()
  @RequirePermission('manage_integrations')
  async listJobs(
    @CurrentUser() user: UserContext,
    @Query('status') status?: JobStatus,
    @Query('type') type?: string,
    @Query('priority') priority?: JobPriority,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<JobRecord[]> {
    const parsedLimit = limit !== undefined ? parseInt(limit, 10) : undefined;
    const parsedOffset = offset !== undefined ? parseInt(offset, 10) : undefined;

    return this.jobWorkerService.listJobs(user.activeOrganization.id, {
      status,
      type,
      priority,
      limit: parsedLimit,
      offset: parsedOffset,
    });
  }

  @Get(':id')
  @RequirePermission('manage_integrations')
  async getJob(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<JobRecord> {
    return this.jobWorkerService.getJobById(id, user.activeOrganization.id);
  }

  @Post()
  @RequirePermission('manage_integrations')
  async enqueueJob(
    @CurrentUser() user: UserContext,
    @Body() dto: EnqueueJobDto,
  ): Promise<JobRecord> {
    return this.jobWorkerService.enqueue({
      organizationId: user.activeOrganization.id,
      type: dto.type,
      priority: dto.priority,
      payload: dto.payload,
      maxAttempts: dto.maxAttempts,
      runAt: dto.runAt,
    });
  }

  @Post(':id/retry')
  @RequirePermission('manage_integrations')
  async retryJob(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<JobRecord> {
    return this.jobWorkerService.retryJob(id, user.activeOrganization.id);
  }

  @Post(':id/cancel')
  @RequirePermission('manage_integrations')
  async cancelJob(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<JobRecord> {
    return this.jobWorkerService.cancelJob(id, user.activeOrganization.id);
  }
}
