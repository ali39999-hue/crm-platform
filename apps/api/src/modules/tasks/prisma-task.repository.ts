import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ITaskRepository, TaskEntity } from './task.repository.js';
import type { TaskDependencyEdge } from '@crm/domain';
import type { TaskPriority, TaskStatus, RecordVisibility } from '@crm/contracts';

@Injectable()
export class PrismaTaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(task: any): TaskEntity {
    return {
      id: task.id,
      organizationId: task.organizationId,
      projectId: task.projectId ?? null,
      creatorId: task.creatorId,
      assigneeId: task.assigneeId ?? null,
      parentId: task.parentId ?? null,
      key: task.key,
      title: task.title,
      description: task.description ?? null,
      status: task.status as TaskStatus,
      priority: task.priority as TaskPriority,
      visibility: task.visibility as RecordVisibility,
      dueAt: task.dueAt ? task.dueAt.toISOString() : null,
      version: task.version,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  async findMyWork(organizationId: string, userId: string): Promise<TaskEntity[]> {
    const tasks = await (this.prisma as any).task.findMany({
      where: {
        organizationId,
        assigneeId: userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return tasks.map((t: any) => this.mapToEntity(t));
  }

  async findAll(
    organizationId: string,
    filter?: {
      status?: TaskStatus | undefined;
      priority?: TaskPriority | undefined;
      assigneeId?: string | undefined;
      limit?: number | undefined;
    },
  ): Promise<TaskEntity[]> {
    const where: any = {
      organizationId,
    };

    if (filter?.status) where.status = filter.status;
    if (filter?.priority) where.priority = filter.priority;
    if (filter?.assigneeId) where.assigneeId = filter.assigneeId;

    const tasks = await (this.prisma as any).task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter?.limit ?? undefined,
    });
    return tasks.map((t: any) => this.mapToEntity(t));
  }

  async findById(organizationId: string, id: string): Promise<TaskEntity | null> {
    const task = await (this.prisma as any).task.findUnique({
      where: {
        id,
      },
    });
    if (!task || task.organizationId !== organizationId) {
      return null;
    }
    return this.mapToEntity(task);
  }

  async create(data: Omit<TaskEntity, 'id' | 'key' | 'version' | 'createdAt' | 'updatedAt'>): Promise<TaskEntity> {
    const count = await (this.prisma as any).task.count({
      where: { organizationId: data.organizationId },
    });
    const key = `TSK-${count + 1}`;

    const task = await (this.prisma as any).task.create({
      data: {
        organizationId: data.organizationId,
        projectId: data.projectId,
        creatorId: data.creatorId,
        assigneeId: data.assigneeId,
        parentId: data.parentId,
        key,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        visibility: data.visibility,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        version: 1,
      },
    });
    return this.mapToEntity(task);
  }

  async update(task: TaskEntity): Promise<TaskEntity> {
    const updated = await (this.prisma as any).task.update({
      where: { id: task.id },
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        visibility: task.visibility,
        dueAt: task.dueAt ? new Date(task.dueAt) : null,
        version: task.version,
      },
    });
    return this.mapToEntity(updated);
  }

  async getDependencies(organizationId: string, taskId: string): Promise<TaskEntity[]> {
    const links = await (this.prisma as any).taskDependency.findMany({
      where: {
        taskId,
      },
      include: {
        dependsOn: true,
      },
    });
    return links
      .filter((l: any) => l.dependsOn && l.dependsOn.organizationId === organizationId)
      .map((l: any) => this.mapToEntity(l.dependsOn));
  }

  async getAllDependencyEdges(organizationId: string): Promise<TaskDependencyEdge[]> {
    const links = await (this.prisma as any).taskDependency.findMany({
      where: {
        task: {
          organizationId,
        },
      },
      select: {
        taskId: true,
        dependsOnId: true,
      },
    });
    return links;
  }

  async addDependency(organizationId: string, taskId: string, dependsOnId: string): Promise<void> {
    await (this.prisma as any).taskDependency.create({
      data: {
        taskId,
        dependsOnId,
      },
    });
  }
}
