import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { RequirePermission } from '../../common/auth/require-permission.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { TransitionTaskDto } from './dto/transition-task.dto.js';
import { TaskQueryDto } from './dto/task-query.dto.js';
import type { Request } from 'express';

@Controller('tasks')
@UseGuards(AuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('my-work')
  @RequirePermission('view_internal_tasks')
  async getMyWork(@CurrentUser() user: UserContext) {
    return this.tasksService.getMyWork(user.activeOrganization.id, user.id);
  }

  @Get()
  @RequirePermission('view_internal_tasks')
  async getTasks(@CurrentUser() user: UserContext, @Query() query: TaskQueryDto) {
    return this.tasksService.getTasks(user.activeOrganization.id, query);
  }

  @Get(':id')
  @RequirePermission('view_internal_tasks')
  async getTaskById(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.tasksService.getTaskById(user.activeOrganization.id, id);
  }

  @Post()
  @RequirePermission('create_or_edit_tasks')
  async createTask(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateTaskDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    return this.tasksService.createTask(
      user.activeOrganization.id,
      user.id,
      dto,
      requestId,
    );
  }

  @Post(':id/transitions')
  @RequirePermission('create_or_edit_tasks')
  async transitionTask(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: TransitionTaskDto,
    @Req() req: Request,
  ) {
    const reqAny = req as any;
    const requestId = reqAny.requestId as string | undefined;
    const canReopen =
      user.activeOrganization.role === 'SystemOwner' ||
      user.activeOrganization.role === 'OrganizationAdmin';

    return this.tasksService.transitionTask(
      user.activeOrganization.id,
      user.id,
      id,
      dto,
      { canReopenDoneTask: canReopen, canRestoreCanceledTask: canReopen },
      requestId,
    );
  }
}
