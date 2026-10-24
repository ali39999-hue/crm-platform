import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  areBlockingDependenciesResolved,
  assertNoCycle,
  assertTaskTransition,
  type TransitionActorCapabilities,
} from '@crm/domain';
import type { ITaskRepository, TaskEntity } from './task.repository.js';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { TransitionTaskDto } from './dto/transition-task.dto.js';
import type { TaskQueryDto } from './dto/task-query.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import type { TaskDetails, TaskSummary, TaskPriority, TaskStatus } from '@crm/contracts';

@Injectable()
export class TasksService {
  constructor(
    @Inject('TASK_REPOSITORY') private readonly taskRepo: ITaskRepository,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async getMyWork(organizationId: string, userId: string): Promise<TaskSummary[]> {
    const tasks = await this.taskRepo.findMyWork(organizationId, userId);
    return tasks.map((t) => this.mapToSummary(t));
  }

  async getTasks(
    organizationId: string,
    query: TaskQueryDto,
  ): Promise<{ items: TaskSummary[]; nextCursor: string | null }> {
    const filter: {
      status?: TaskStatus | undefined;
      priority?: TaskPriority | undefined;
      assigneeId?: string | undefined;
      limit?: number | undefined;
    } = {};

    if (query.status) filter.status = query.status as TaskStatus;
    if (query.priority) filter.priority = query.priority as TaskPriority;
    if (query.assigneeId) filter.assigneeId = query.assigneeId;
    if (query.limit) filter.limit = query.limit;

    const tasks = await this.taskRepo.findAll(organizationId, filter);
    return {
      items: tasks.map((t) => this.mapToSummary(t)),
      nextCursor: null,
    };
  }

  async getTaskById(organizationId: string, id: string): Promise<TaskDetails> {
    const task = await this.taskRepo.findById(organizationId, id);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found in this organization`);
    }
    const deps = await this.taskRepo.getDependencies(organizationId, id);
    return this.mapToDetails(task, deps.map((d) => d.id));
  }

  async createTask(
    organizationId: string,
    creatorId: string,
    dto: CreateTaskDto,
    requestId?: string,
  ): Promise<TaskDetails> {
    const task = await this.taskRepo.create({
      organizationId,
      creatorId,
      assigneeId: dto.assigneeId ?? creatorId,
      projectId: dto.projectId ?? null,
      parentId: null,
      title: dto.title.trim(),
      description: dto.description?.trim() ?? null,
      status: 'TODO',
      priority: dto.priority ?? 'MEDIUM',
      visibility: dto.visibility ?? 'INTERNAL',
      dueAt: dto.dueAt ?? null,
    });

    this.auditService.record({
      organizationId,
      actorId: creatorId,
      action: 'TASK_CREATED',
      entityType: 'Task',
      entityId: task.id,
      requestId,
      metadata: { key: task.key, title: task.title, status: task.status },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'TaskCreated',
      aggregateType: 'Task',
      aggregateId: task.id,
      payload: { key: task.key, title: task.title, assigneeId: task.assigneeId },
    });

    return this.mapToDetails(task);
  }

  async transitionTask(
    organizationId: string,
    actorId: string,
    taskId: string,
    dto: TransitionTaskDto,
    actorCapabilities: TransitionActorCapabilities = { canReopenDoneTask: false, canRestoreCanceledTask: false },
    requestId?: string,
  ): Promise<TaskDetails> {
    const task = await this.taskRepo.findById(organizationId, taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found in this organization`);
    }

    // Optimistic Concurrency check
    if (task.version !== dto.expectedVersion) {
      throw new ConflictException(
        `Optimistic lock conflict: task version is ${task.version}, but expected ${dto.expectedVersion}`,
      );
    }

    // Check blocking dependencies if transitioning to DONE
    if (dto.targetStatus === 'DONE') {
      const deps = await this.taskRepo.getDependencies(organizationId, taskId);
      if (!areBlockingDependenciesResolved(deps)) {
        throw new BadRequestException(
          'Cannot complete task: blocking dependencies are not yet resolved',
        );
      }
    }

    // Domain state machine transition check
    try {
      assertTaskTransition(task.status, dto.targetStatus, actorCapabilities);
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Invalid status transition');
    }

    const previousStatus = task.status;
    task.status = dto.targetStatus;
    task.version += 1;

    const updated = await this.taskRepo.update(task);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'TASK_TRANSITIONED',
      entityType: 'Task',
      entityId: task.id,
      requestId,
      metadata: {
        from: previousStatus,
        to: task.status,
        version: task.version,
        reason: dto.reason,
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'TaskStatusTransitioned',
      aggregateType: 'Task',
      aggregateId: task.id,
      payload: {
        key: task.key,
        fromStatus: previousStatus,
        toStatus: task.status,
        actorId,
      },
    });

    const currentDeps = await this.taskRepo.getDependencies(organizationId, taskId);
    return this.mapToDetails(updated, currentDeps.map((d) => d.id));
  }

  async addDependency(
    organizationId: string,
    actorId: string,
    taskId: string,
    dependsOnId: string,
    requestId?: string,
  ): Promise<TaskDetails> {
    const task = await this.taskRepo.findById(organizationId, taskId);
    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found in organization`);
    }

    const target = await this.taskRepo.findById(organizationId, dependsOnId);
    if (!target) {
      throw new NotFoundException(`Target dependency ${dependsOnId} not found in organization`);
    }

    // Check circular dependencies
    const existingEdges = await this.taskRepo.getAllDependencyEdges(organizationId);
    try {
      assertNoCycle(existingEdges, { taskId, dependsOnId });
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }

    await this.taskRepo.addDependency(organizationId, taskId, dependsOnId);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'TASK_DEPENDENCY_ADDED',
      entityType: 'Task',
      entityId: taskId,
      requestId,
      metadata: { taskId, dependsOnId },
    });

    const deps = await this.taskRepo.getDependencies(organizationId, taskId);
    return this.mapToDetails(task, deps.map((d) => d.id));
  }

  private mapToSummary(t: TaskEntity): TaskSummary {
    return {
      id: t.id,
      key: t.key,
      title: t.title,
      status: t.status,
      priority: t.priority,
      visibility: t.visibility,
      assigneeId: t.assigneeId,
      projectId: t.projectId,
      dueAt: t.dueAt,
      version: t.version,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }

  private mapToDetails(t: TaskEntity, dependencies: string[] = []): TaskDetails {
    return {
      ...this.mapToSummary(t),
      description: t.description,
      creatorId: t.creatorId,
      commentsCount: 0,
      dependencies,
    };
  }
}
