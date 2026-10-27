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
import { ProjectService } from './project.service.js';
import type {
  GanttProjectScheduleDto,
  MilestoneDto,
  ProjectDetailDto,
  ProjectSummaryDto,
} from '@crm/contracts';
import { CreateProjectDto } from './dto/create-project.dto.js';
import {
  CreateMilestoneDto,
  UpdateProjectDto,
} from './dto/update-project.dto.js';

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @RequirePermission('view_internal_tasks')
  async getProjects(
    @CurrentUser() user: UserContext,
  ): Promise<ProjectSummaryDto[]> {
    return this.projectService.getProjects(user.activeOrganization.id);
  }

  @Get(':id')
  @RequirePermission('view_internal_tasks')
  async getProjectDetail(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<ProjectDetailDto> {
    return this.projectService.getProjectDetail(user.activeOrganization.id, id);
  }

  @Get(':id/gantt')
  @RequirePermission('view_internal_tasks')
  async getProjectGantt(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<GanttProjectScheduleDto> {
    return this.projectService.getProjectGanttSchedule(
      user.activeOrganization.id,
      id,
    );
  }

  @Post()
  @RequirePermission('create_or_edit_tasks')
  async createProject(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectDetailDto> {
    return this.projectService.createProject(
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
  async updateProject(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectDetailDto> {
    return this.projectService.updateProject(
      user.activeOrganization.id,
      user.id,
      id,
      dto,
    );
  }

  @Post(':id/milestones')
  @RequirePermission('create_or_edit_tasks')
  async addMilestone(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: CreateMilestoneDto,
  ): Promise<MilestoneDto> {
    return this.projectService.addMilestone(
      user.activeOrganization.id,
      user.id,
      id,
      dto,
    );
  }

  @Patch(':id/milestones/:milestoneId')
  @RequirePermission('create_or_edit_tasks')
  async toggleMilestone(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body('isCompleted') isCompleted: boolean,
  ): Promise<MilestoneDto> {
    return this.projectService.toggleMilestone(
      user.activeOrganization.id,
      user.id,
      id,
      milestoneId,
      Boolean(isCompleted),
    );
  }

  @Delete(':id')
  @RequirePermission('create_or_edit_tasks')
  async deleteProject(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.projectService.deleteProject(
      user.activeOrganization.id,
      user.id,
      id,
    );
  }
}
