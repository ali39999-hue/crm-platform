import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ITimeTrackingRepository, WorkLogEntity } from './timetracking.repository.js';
import type { WorkLogEntityType } from '@crm/contracts';

@Injectable()
export class PrismaTimeTrackingRepository implements ITimeTrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(log: any): WorkLogEntity {
    return {
      id: log.id,
      organizationId: log.organizationId,
      userId: log.userId,
      userName: log.userName,
      entityType: log.entityType as WorkLogEntityType,
      entityId: log.entityId,
      entityTitle: log.entityTitle,
      durationMinutes: log.durationMinutes,
      description: log.description,
      isBillable: log.isBillable,
      // @db.Date columns come back as UTC midnight; the entity contract is a date-only string.
      loggedDate: log.loggedDate.toISOString().slice(0, 10),
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
    };
  }

  async findByOrg(
    organizationId: string,
    filters?: {
      userId?: string | undefined;
      entityType?: WorkLogEntityType | undefined;
      entityId?: string | undefined;
      fromDate?: string | undefined;
      toDate?: string | undefined;
    },
  ): Promise<WorkLogEntity[]> {
    const where: any = { organizationId };
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;
    if (filters?.fromDate || filters?.toDate) {
      where.loggedDate = {};
      if (filters?.fromDate) where.loggedDate.gte = new Date(`${filters.fromDate}T00:00:00.000Z`);
      if (filters?.toDate) where.loggedDate.lte = new Date(`${filters.toDate}T23:59:59.999Z`);
    }

    const logs = await (this.prisma.tenantClient as any).workLog.findMany({
      where,
      orderBy: { loggedDate: 'desc' },
    });
    return logs.map((l: any) => this.mapToEntity(l));
  }

  async findById(organizationId: string, id: string): Promise<WorkLogEntity | null> {
    const log = await (this.prisma.tenantClient as any).workLog.findUnique({
      where: { id },
    });
    if (!log || log.organizationId !== organizationId) return null;
    return this.mapToEntity(log);
  }

  async create(data: Omit<WorkLogEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkLogEntity> {
    const created = await (this.prisma.tenantClient as any).workLog.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        userName: data.userName,
        entityType: data.entityType,
        entityId: data.entityId,
        entityTitle: data.entityTitle,
        durationMinutes: data.durationMinutes,
        description: data.description,
        isBillable: data.isBillable,
        loggedDate: new Date(`${data.loggedDate}T00:00:00.000Z`),
      },
    });
    return this.mapToEntity(created);
  }

  async update(entity: WorkLogEntity): Promise<WorkLogEntity> {
    const updated = await (this.prisma.tenantClient as any).workLog.update({
      where: { id: entity.id },
      data: {
        userName: entity.userName,
        entityType: entity.entityType,
        entityId: entity.entityId,
        entityTitle: entity.entityTitle,
        durationMinutes: entity.durationMinutes,
        description: entity.description,
        isBillable: entity.isBillable,
        loggedDate: new Date(`${entity.loggedDate}T00:00:00.000Z`),
      },
    });
    return this.mapToEntity(updated);
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findById(organizationId, id);
    if (!existing) return false;
    await (this.prisma.tenantClient as any).workLog.delete({
      where: { id },
    });
    return true;
  }
}
