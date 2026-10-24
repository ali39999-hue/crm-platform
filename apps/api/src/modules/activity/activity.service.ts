import { Injectable, Logger } from '@nestjs/common';
import { isActionAllowed, type MembershipRole } from '@crm/domain';
import {
  InMemoryActivityRepository,
  type ActivityEntity,
} from './activity.repository.js';
import type { CustomerTimelineItem, RecordVisibility } from '@crm/contracts';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly activityRepo: InMemoryActivityRepository) {}

  async logActivity(params: {
    organizationId: string;
    actorId?: string | null;
    actorName?: string | null;
    entityType: string;
    entityId: string;
    kind: string;
    summary: string;
    visibility?: RecordVisibility;
    metadata?: Record<string, any>;
  }): Promise<ActivityEntity> {
    const createData: Omit<ActivityEntity, 'id' | 'occurredAt'> = {
      organizationId: params.organizationId,
      actorId: params.actorId ?? null,
      actorName: params.actorName ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      kind: params.kind,
      summary: params.summary,
      visibility: params.visibility ?? 'INTERNAL',
    };
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
