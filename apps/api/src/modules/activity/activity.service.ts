import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import type { MembershipRole } from '@crm/domain';
import {
  InMemoryActivityRepository,
  type ActivityEntity,
  type ScheduledActivityEntity,
} from './activity.repository.js';
import { AuditService } from '../audit/audit.service.js';
import type {
  ActivityDto,
  ActivityStatus,
  ActivityType,
  CalendarConflictDto,
  CreateActivityRequest,
  CustomerTimelineItem,
  RecordVisibility,
  UpdateActivityRequest,
} from '@crm/contracts';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private readonly activityRepo: InMemoryActivityRepository,
    private readonly auditService: AuditService,
  ) {}

  /* Passive Timeline Logging */

  async logActivity(params: {
    organizationId: string;
    actorId?: string | null | undefined;
    actorName?: string | null | undefined;
    entityType: string;
    entityId: string;
    kind: string;
    summary: string;
    visibility?: RecordVisibility | undefined;
    metadata?: Record<string, any> | undefined;
  }): Promise<ActivityEntity> {
    const createData: Omit<ActivityEntity, 'id' | 'occurredAt'> = {
      organizationId: params.organizationId,
      actorId: params.actorId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      kind: params.kind,
      summary: params.summary,
      visibility: params.visibility ?? 'INTERNAL',
    };
    if (params.actorName !== undefined) {
      createData.actorName = params.actorName;
    }
    if (params.metadata !== undefined) {
      createData.metadata = params.metadata;
    }
    return this.activityRepo.create(createData);
  }

  async getAccountTimeline(
    organizationId: string,
    role: MembershipRole,
    accountId: string,
    limit = 50,
  ): Promise<CustomerTimelineItem[]> {
    const raw = await this.activityRepo.findByAccount(organizationId, accountId, limit);
    return this.filterAndMap(raw, role);
  }

  async getEntityTimeline(
    organizationId: string,
    role: MembershipRole,
    entityType: string,
    entityId: string,
    limit = 50,
  ): Promise<CustomerTimelineItem[]> {
    const raw = await this.activityRepo.findByEntity(organizationId, entityType, entityId, limit);
    return this.filterAndMap(raw, role);
  }

  async getRecentActivities(
    organizationId: string,
    role: MembershipRole,
    limit = 50,
  ): Promise<CustomerTimelineItem[]> {
    const raw = await this.activityRepo.findRecent(organizationId, limit);
    return this.filterAndMap(raw, role);
  }

  /* Scheduled Activities & Calendar */

  async createScheduledActivity(
    organizationId: string,
    actor: { id: string; displayName: string; role: MembershipRole },
    dto: CreateActivityRequest,
  ): Promise<{ activity: ActivityDto; conflictInfo: CalendarConflictDto }> {
    // 1. Calculate default endsAt (1 hour if not specified)
    const startsAtDate = new Date(dto.startsAt);
    const endsAtDate = dto.endsAt
      ? new Date(dto.endsAt)
      : new Date(startsAtDate.getTime() + 3600000);

    const startsAtIso = startsAtDate.toISOString();
    const endsAtIso = endsAtDate.toISOString();

    const participants = dto.participantIds ?? [actor.id];

    // 2. Conflict detection
    const conflicting = await this.activityRepo.detectConflicts(
      organizationId,
      startsAtIso,
      endsAtIso,
      participants,
    );

    const conflictInfo: CalendarConflictDto = {
      hasConflict: conflicting.length > 0,
      conflictingActivities: conflicting.map((c) => this.mapActivityDto(c)),
    };

    // 3. Persist activity
    const createData: Omit<
      ScheduledActivityEntity,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      organizationId,
      type: dto.type,
      title: dto.title.trim(),
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      isAllDay: Boolean(dto.isAllDay),
      status: 'SCHEDULED',
      ownerId: actor.id,
      ownerName: actor.displayName,
      participantIds: participants,
      visibility: dto.visibility ?? 'INTERNAL',
    };

    if (dto.description !== undefined) {
      createData.description = dto.description;
    }
    if (dto.associatedEntityType !== undefined) {
      createData.associatedEntityType = dto.associatedEntityType;
    }
    if (dto.associatedEntityId !== undefined) {
      createData.associatedEntityId = dto.associatedEntityId;
    }
    if (dto.associatedEntityTitle !== undefined) {
      createData.associatedEntityTitle = dto.associatedEntityTitle;
    }
    if (dto.reminderMinutesBefore !== undefined) {
      createData.reminderMinutesBefore = dto.reminderMinutesBefore;
    }

    const saved = await this.activityRepo.createScheduled(createData);

    // 4. Log passive timeline entry
    await this.logActivity({
      organizationId,
      actorId: actor.id,
      actorName: actor.displayName,
      entityType: saved.associatedEntityType || 'ACTIVITY',
      entityId: saved.associatedEntityId || saved.id,
      kind: `ACTIVITY_${saved.type}_SCHEDULED`,
      summary: `رویداد «${saved.title}» برای تاریخ ${new Date(saved.startsAt).toLocaleDateString('fa-IR')} زمان‌بندی شد`,
      visibility: saved.visibility,
      metadata: { activityId: saved.id, type: saved.type },
    });

    // 5. Audit event
    this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: 'ACTIVITY_SCHEDULED',
      entityType: 'ScheduledActivity',
      entityId: saved.id,
      metadata: { title: saved.title, type: saved.type, startsAt: saved.startsAt },
    });

    return {
      activity: this.mapActivityDto(saved),
      conflictInfo,
    };
  }

  async getCalendarActivities(
    organizationId: string,
    role: MembershipRole,
    filters?: {
      from?: string | undefined;
      to?: string | undefined;
      type?: ActivityType | undefined;
      status?: ActivityStatus | undefined;
      ownerId?: string | undefined;
    },
  ): Promise<ActivityDto[]> {
    const raw = await this.activityRepo.findScheduled(organizationId, filters);
    const isCustomer = role === 'CustomerPortalUser';

    return raw
      .filter((a) => {
        if (isCustomer && a.visibility !== 'CUSTOMER_SHARED') {
          return false;
        }
        return true;
      })
      .map((a) => this.mapActivityDto(a));
  }

  async getScheduledActivityById(
    organizationId: string,
    id: string,
  ): Promise<ActivityDto> {
    const act = await this.activityRepo.findScheduledById(organizationId, id);
    if (!act) {
      throw new NotFoundException('فعالیت مورد نظر یافت نشد');
    }
    return this.mapActivityDto(act);
  }

  async updateScheduledActivity(
    organizationId: string,
    actor: { id: string; displayName: string; role: MembershipRole },
    id: string,
    dto: UpdateActivityRequest,
  ): Promise<ActivityDto> {
    const existing = await this.activityRepo.findScheduledById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('فعالیت مورد نظر یافت نشد');
    }

    const updates: Partial<
      Omit<ScheduledActivityEntity, 'id' | 'organizationId' | 'createdAt'>
    > = {};

    if (dto.title !== undefined) updates.title = dto.title.trim();
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.startsAt !== undefined) updates.startsAt = new Date(dto.startsAt).toISOString();
    if (dto.endsAt !== undefined) updates.endsAt = new Date(dto.endsAt).toISOString();
    if (dto.isAllDay !== undefined) updates.isAllDay = dto.isAllDay;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.associatedEntityType !== undefined) updates.associatedEntityType = dto.associatedEntityType;
    if (dto.associatedEntityId !== undefined) updates.associatedEntityId = dto.associatedEntityId;
    if (dto.associatedEntityTitle !== undefined) updates.associatedEntityTitle = dto.associatedEntityTitle;
    if (dto.participantIds !== undefined) updates.participantIds = dto.participantIds;
    if (dto.visibility !== undefined) updates.visibility = dto.visibility;
    if (dto.reminderMinutesBefore !== undefined) updates.reminderMinutesBefore = dto.reminderMinutesBefore;

    const updated = await this.activityRepo.updateScheduled(organizationId, id, updates);
    if (!updated) {
      throw new NotFoundException('خطا در به‌روزرسانی فعالیت');
    }

    // If status changed, log timeline entry
    if (dto.status && dto.status !== existing.status) {
      await this.logActivity({
        organizationId,
        actorId: actor.id,
        actorName: actor.displayName,
        entityType: updated.associatedEntityType || 'ACTIVITY',
        entityId: updated.associatedEntityId || updated.id,
        kind: `ACTIVITY_STATUS_${dto.status}`,
        summary: `وضعیت فعالیت «${updated.title}» به ${dto.status} تغییر کرد`,
        visibility: updated.visibility,
      });
    }

    this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: 'ACTIVITY_UPDATED',
      entityType: 'ScheduledActivity',
      entityId: updated.id,
      metadata: { status: updated.status, title: updated.title },
    });

    return this.mapActivityDto(updated);
  }

  async deleteScheduledActivity(
    organizationId: string,
    actorId: string,
    id: string,
  ): Promise<boolean> {
    const existing = await this.activityRepo.findScheduledById(organizationId, id);
    if (!existing) {
      throw new NotFoundException('فعالیت مورد نظر یافت نشد');
    }

    await this.activityRepo.deleteScheduled(organizationId, id);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'ACTIVITY_DELETED',
      entityType: 'ScheduledActivity',
      entityId: id,
      metadata: { title: existing.title },
    });

    return true;
  }

  async checkConflicts(
    organizationId: string,
    startsAt: string,
    endsAt: string,
    participantIds: string[],
    excludeId?: string,
  ): Promise<CalendarConflictDto> {
    const conflicting = await this.activityRepo.detectConflicts(
      organizationId,
      startsAt,
      endsAt,
      participantIds,
      excludeId,
    );
    return {
      hasConflict: conflicting.length > 0,
      conflictingActivities: conflicting.map((c) => this.mapActivityDto(c)),
    };
  }

  private mapActivityDto(entity: ScheduledActivityEntity): ActivityDto {
    const result: ActivityDto = {
      id: entity.id,
      organizationId: entity.organizationId,
      type: entity.type,
      title: entity.title,
      startsAt: entity.startsAt,
      endsAt: entity.endsAt,
      isAllDay: entity.isAllDay,
      status: entity.status,
      ownerId: entity.ownerId,
      ownerName: entity.ownerName,
      participantIds: entity.participantIds,
      visibility: entity.visibility,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    if (entity.description !== undefined) result.description = entity.description;
    if (entity.associatedEntityType !== undefined)
      result.associatedEntityType = entity.associatedEntityType;
    if (entity.associatedEntityId !== undefined)
      result.associatedEntityId = entity.associatedEntityId;
    if (entity.associatedEntityTitle !== undefined)
      result.associatedEntityTitle = entity.associatedEntityTitle;
    if (entity.reminderMinutesBefore !== undefined)
      result.reminderMinutesBefore = entity.reminderMinutesBefore;

    return result;
  }

  private filterAndMap(
    items: ActivityEntity[],
    role: MembershipRole,
  ): CustomerTimelineItem[] {
    const isCustomer = role === 'CustomerPortalUser';

    return items
      .filter((item) => {
        // Customer never sees internal notes/activities
        if (isCustomer && item.visibility === 'INTERNAL') {
          return false;
        }
        return true;
      })
      .map((item) => {
        const entry: CustomerTimelineItem = {
          id: item.id,
          entityType: item.entityType as any,
          entityId: item.entityId,
          kind: item.kind,
          summary: item.summary,
          occurredAt: item.occurredAt,
          actorName: item.actorName ?? null,
        };
        if (item.metadata !== undefined) {
          entry.metadata = item.metadata;
        }
        return entry;
      });
  }
}
