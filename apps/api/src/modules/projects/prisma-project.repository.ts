import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IProjectRepository, ProjectEntity, MilestoneEntity } from './project.repository.js';
import type { ProjectHealth, ProjectStatus } from '@crm/contracts';

@Injectable()
export class PrismaProjectRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(p: any): ProjectEntity {
    return {
      id: p.id,
      organizationId: p.organizationId,
      key: p.key,
      name: p.name,
      description: p.description ?? undefined,
      status: p.status as ProjectStatus,
      health: p.health as ProjectHealth,
      ownerId: p.ownerId ?? '',
      ownerName: p.ownerName ?? '',
      startDate: p.startDate ? p.startDate.toISOString() : undefined,
      targetDate: p.targetDate ? p.targetDate.toISOString() : undefined,
      associatedAccountId: p.associatedAccountId ?? undefined,
      associatedAccountName: p.associatedAccountName ?? undefined,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  private mapMilestone(m: any): MilestoneEntity {
    return {
      id: m.id,
      organizationId: m.organizationId,
      projectId: m.projectId,
      title: m.title,
      dueDate: m.dueDate.toISOString(),
      isCompleted: m.isCompleted,
      createdAt: m.createdAt.toISOString(),
    };
  }

  async findByOrg(organizationId: string): Promise<ProjectEntity[]> {
    const projects = await (this.prisma.tenantClient as any).project.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return projects.map((p: any) => this.mapToEntity(p));
  }

  async findById(organizationId: string, id: string): Promise<ProjectEntity | null> {
    const project = await (this.prisma.tenantClient as any).project.findUnique({
      where: { id },
    });
    if (!project || project.organizationId !== organizationId) return null;
    return this.mapToEntity(project);
  }

  async findByKey(organizationId: string, key: string): Promise<ProjectEntity | null> {
    const project = await (this.prisma.tenantClient as any).project.findFirst({
      where: { organizationId, key: { equals: key, mode: 'insensitive' } },
    });
    if (!project) return null;
    return this.mapToEntity(project);
  }

  async create(data: Omit<ProjectEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectEntity> {
    const created = await (this.prisma.tenantClient as any).project.create({
      data: {
        organizationId: data.organizationId,
        key: data.key,
        name: data.name,
        description: data.description ?? null,
        status: data.status,
        health: data.health,
        ownerId: data.ownerId || null,
        ownerName: data.ownerName || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        associatedAccountId: data.associatedAccountId ?? null,
        associatedAccountName: data.associatedAccountName ?? null,
      },
    });
    return this.mapToEntity(created);
  }

  async update(entity: ProjectEntity): Promise<ProjectEntity> {
    const updated = await (this.prisma.tenantClient as any).project.update({
      where: { id: entity.id },
      data: {
        key: entity.key,
        name: entity.name,
        description: entity.description ?? null,
        status: entity.status,
        health: entity.health,
        ownerId: entity.ownerId || null,
        ownerName: entity.ownerName || null,
        startDate: entity.startDate ? new Date(entity.startDate) : null,
        targetDate: entity.targetDate ? new Date(entity.targetDate) : null,
        associatedAccountId: entity.associatedAccountId ?? null,
        associatedAccountName: entity.associatedAccountName ?? null,
      },
    });
    return this.mapToEntity(updated);
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findById(organizationId, id);
    if (!existing) return false;
    await (this.prisma.tenantClient as any).project.delete({
      where: { id },
    });
    return true;
  }

  /* Milestones */

  async findMilestones(organizationId: string, projectId: string): Promise<MilestoneEntity[]> {
    const milestones = await (this.prisma.tenantClient as any).milestone.findMany({
      where: { organizationId, projectId },
      orderBy: { dueDate: 'asc' },
    });
    return milestones.map((m: any) => this.mapMilestone(m));
  }

  async createMilestone(data: Omit<MilestoneEntity, 'id' | 'createdAt'>): Promise<MilestoneEntity> {
    const created = await (this.prisma.tenantClient as any).milestone.create({
      data: {
        organizationId: data.organizationId,
        projectId: data.projectId,
        title: data.title,
        dueDate: new Date(data.dueDate),
        isCompleted: data.isCompleted,
      },
    });
    return this.mapMilestone(created);
  }

  async toggleMilestone(
    organizationId: string,
    projectId: string,
    milestoneId: string,
    isCompleted: boolean,
  ): Promise<MilestoneEntity | null> {
    const existing = await (this.prisma.tenantClient as any).milestone.findFirst({
      where: { organizationId, projectId, id: milestoneId },
    });
    if (!existing) return null;
    const updated = await (this.prisma.tenantClient as any).milestone.update({
      where: { id: milestoneId },
      data: { isCompleted },
    });
    return this.mapMilestone(updated);
  }
}
