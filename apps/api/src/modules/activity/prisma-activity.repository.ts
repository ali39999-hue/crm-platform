import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  ActivityEntity,
  IActivityRepository,
  ScheduledActivityEntity,
} from './activity.repository.js';
import type { ActivityStatus, ActivityType } from '@crm/contracts';

const ACTOR_INCLUDE = { actor: { select: { displayName: true } } } as const;

@Injectable()
export class PrismaActivityRepository implements IActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapActivity(a: any): ActivityEntity {
    return {
      id: a.id,
      organizationId: a.organizationId,
      actorId: a.actorId ?? null,
      actorName: a.actor?.displayName ?? null,
      entityType: a.entityType,
      entityId: a.entityId,
      kind: a.kind,
      summary: a.summary,
      visibility: a.visibility as ActivityEntity['visibility'],
      occurredAt: a.occurredAt.toISOString(),
      metadata: a.metadata ?? undefined,
    };
  }

  private mapScheduled(a: any): ScheduledActivityEntity {
    return {
      id: a.id,
      organizationId: a.organizationId,
      type: a.type as ActivityType,
      title: a.title,
      description: a.description ?? undefined,
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt.toISOString(),
      isAllDay: a.isAllDay,
      status: a.status as ActivityStatus,
      ownerId: a.ownerId,
      ownerName: a.ownerName ?? '',
      participantIds: a.participantIds ?? [],
      associatedEntityType: a.associatedEntityType ?? undefined,
      associatedEntityId: a.associatedEntityId ?? undefined,
      associatedEntityTitle: a.associatedEntityTitle ?? undefined,
      visibility: a.visibility as ScheduledActivityEntity['visibility'],
      reminderMinutesBefore: a.reminderMinutesBefore ?? undefined,
      isPinned: a.isPinned,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }

  async create(data: Omit<ActivityEntity, 'id' | 'occurredAt'>): Promise<ActivityEntity> {
    const created = await (this.prisma.tenantClient as any).activity.create({
      data: {
        organizationId: data.organizationId,
        actorId: data.actorId,
        entityType: data.entityType,
        entityId: data.entityId,
        kind: data.kind,
        summary: data.summary,
        visibility: data.visibility,
        metadata: data.metadata ?? undefined,
      },
      include: ACTOR_INCLUDE,
    });
    return this.mapActivity(created);
  }

  async findByEntity(
    organizationId: string,
    entityType: string,
    entityId: string,
    limit = 50,
  ): Promise<ActivityEntity[]> {
    const rows = await (this.prisma.tenantClient as any).activity.findMany({
      where: { organizationId, entityType, entityId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: ACTOR_INCLUDE,
    });
    return rows.map((a: any) => this.mapActivity(a));
  }

  async findByAccount(organizationId: string, accountId: string, limit = 50): Promise<ActivityEntity[]> {
    const rows = await (this.prisma.tenantClient as any).activity.findMany({
      where: {
        organizationId,
        OR: [
          { entityId: accountId },
          { metadata: { path: ['accountId'], equals: accountId } },
        ],
      },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: ACTOR_INCLUDE,
    });
    return rows.map((a: any) => this.mapActivity(a));
  }

  async findRecent(organizationId: string, limit = 50): Promise<ActivityEntity[]> {
    const rows = await (this.prisma.tenantClient as any).activity.findMany({
      where: { organizationId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: ACTOR_INCLUDE,
    });
    return rows.map((a: any) => this.mapActivity(a));
  }

  /* Scheduled activities */

  async createScheduled(
    data: Omit<ScheduledActivityEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ScheduledActivityEntity> {
    const created = await (this.prisma.tenantClient as any).scheduledActivity.create({
      data: {
        organizationId: data.organizationId,
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        isAllDay: data.isAllDay,
        status: data.status,
        ownerId: data.ownerId,
        ownerName: data.ownerName || null,
        participantIds: data.participantIds,
        associatedEntityType: data.associatedEntityType ?? null,
        associatedEntityId: data.associatedEntityId ?? null,
        associatedEntityTitle: data.associatedEntityTitle ?? null,
        visibility: data.visibility,
        reminderMinutesBefore: data.reminderMinutesBefore ?? null,
        isPinned: data.isPinned ?? false,
      },
    });
    return this.mapScheduled(created);
  }

  async updateScheduled(
    organizationId: string,
    id: string,
    data: Partial<Omit<ScheduledActivityEntity, 'id' | 'organizationId' | 'createdAt'>>,
  ): Promise<ScheduledActivityEntity | null> {
    const existing = await (this.prisma.tenantClient as any).scheduledActivity.findFirst({
      where: { organizationId, id },
    });
    if (!existing) return null;

    const updated = await (this.prisma.tenantClient as any).scheduledActivity.update({
      where: { id },
      data: {
        type: data.type,
        title: data.title,
        description: data.description === undefined ? undefined : (data.description ?? null),
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
        isAllDay: data.isAllDay,
        status: data.status,
        ownerId: data.ownerId,
        ownerName: data.ownerName === undefined ? undefined : (data.ownerName || null),
        participantIds: data.participantIds,
        associatedEntityType: data.associatedEntityType === undefined ? undefined : (data.associatedEntityType ?? null),
        associatedEntityId: data.associatedEntityId === undefined ? undefined : (data.associatedEntityId ?? null),
        associatedEntityTitle: data.associatedEntityTitle === undefined ? undefined : (data.associatedEntityTitle ?? null),
        visibility: data.visibility,
        reminderMinutesBefore: data.reminderMinutesBefore === undefined ? undefined : (data.reminderMinutesBefore ?? null),
        isPinned: data.isPinned,
      },
    });
    return this.mapScheduled(updated);
  }

  async findScheduledById(organizationId: string, id: string): Promise<ScheduledActivityEntity | null> {
    const row = await (this.prisma.tenantClient as any).scheduledActivity.findFirst({
      where: { organizationId, id },
    });
    return row ? this.mapScheduled(row) : null;
  }

  async findScheduled(
    organizationId: string,
    filters?: {
      from?: string | undefined;
      to?: string | undefined;
      type?: ActivityType | undefined;
      status?: ActivityStatus | undefined;
      ownerId?: string | undefined;
    },
  ): Promise<ScheduledActivityEntity[]> {
    const where: any = { organizationId };
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.ownerId) where.ownerId = filters.ownerId;
    if (filters?.from || filters?.to) {
      where.AND = [];
      // Keep an entry when it has not ended before `from` and has not started after `to`.
      if (filters?.from) where.AND.push({ endsAt: { gte: new Date(filters.from) } });
      if (filters?.to) where.AND.push({ startsAt: { lte: new Date(filters.to) } });
    }

    const rows = await (this.prisma.tenantClient as any).scheduledActivity.findMany({
      where,
      orderBy: { startsAt: 'asc' },
    });
    return rows.map((a: any) => this.mapScheduled(a));
  }

  async deleteScheduled(organizationId: string, id: string): Promise<boolean> {
    const existing = await (this.prisma.tenantClient as any).scheduledActivity.findFirst({
      where: { organizationId, id },
    });
    if (!existing) return false;
    await (this.prisma.tenantClient as any).scheduledActivity.delete({ where: { id } });
    return true;
  }

  async detectConflicts(
    organizationId: string,
    startsAt: string,
    endsAt: string,
    participantIds: string[],
    excludeId?: string,
  ): Promise<ScheduledActivityEntity[]> {
    const rows = await (this.prisma.tenantClient as any).scheduledActivity.findMany({
      where: {
        organizationId,
        status: { not: 'CANCELLED' },
        id: excludeId ? { not: excludeId } : undefined,
        // time-range overlap: existing.startsAt < targetEnd AND existing.endsAt > targetStart
        startsAt: { lt: new Date(endsAt) },
        endsAt: { gt: new Date(startsAt) },
        OR: [
          { ownerId: { in: participantIds } },
          { participantIds: { hasSome: participantIds } },
        ],
      },
    });
    return rows.map((a: any) => this.mapScheduled(a));
  }
}
