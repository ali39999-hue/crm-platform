import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type ActivityEntity = {
  id: string;
  organizationId: string;
  actorId: string | null;
  actorName?: string | null;
  entityType: string;
  entityId: string;
  kind: string;
  summary: string;
  visibility: 'INTERNAL' | 'CUSTOMER_SHARED';
  occurredAt: string;
  metadata?: Record<string, any>;
};

export interface IActivityRepository {
  create(data: Omit<ActivityEntity, 'id' | 'occurredAt'>): Promise<ActivityEntity>;
  findByEntity(organizationId: string, entityType: string, entityId: string, limit?: number): Promise<ActivityEntity[]>;
  findByAccount(organizationId: string, accountId: string, limit?: number): Promise<ActivityEntity[]>;
  findRecent(organizationId: string, limit?: number): Promise<ActivityEntity[]>;
}

@Injectable()
export class InMemoryActivityRepository implements IActivityRepository {
  private activities: ActivityEntity[] = [];

  constructor() {
    this.seedDefaultActivities();
  }

  private seedDefaultActivities() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const employeeAlpha = '22222222-2222-2222-2222-222222222222';
    const accAlpha = '50000000-0000-0000-0000-000000000001';

    this.activities.push(
      {
        id: randomUUID(),
        organizationId: orgAlpha,
        actorId: employeeAlpha,
        actorName: 'کارمند عملیات',
        entityType: 'ACCOUNT',
        entityId: accAlpha,
        kind: 'ACCOUNT_CREATED',
        summary: 'حساب شرکت فولاد گستر آریا ثبت گردید',
        visibility: 'CUSTOMER_SHARED',
        occurredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: randomUUID(),
        organizationId: orgAlpha,
        actorId: employeeAlpha,
        actorName: 'کارمند عملیات',
        entityType: 'DEAL',
        entityId: '80000000-0000-0000-0000-000000000001',
        kind: 'DEAL_PROPOSAL_SENT',
        summary: 'پروپوزال فروش ۳۵۰,۰۰۰,۰۰۰ ریالی به مشتری تحویل شد',
        visibility: 'CUSTOMER_SHARED',
        occurredAt: new Date(Date.now() - 86400000).toISOString(),
        metadata: { accountId: accAlpha },
      },
      {
        id: randomUUID(),
        organizationId: orgAlpha,
        actorId: employeeAlpha,
        actorName: 'کارمند عملیات',
        entityType: 'TASK',
        entityId: '10000000-0000-0000-0000-000000000001',
        kind: 'TASK_INTERNAL_REVIEW',
        summary: 'یادداشت داخلی ممیزی مالی ثبت گردید',
        visibility: 'INTERNAL',
        occurredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        metadata: { accountId: accAlpha },
      },
    );
  }

  async create(data: Omit<ActivityEntity, 'id' | 'occurredAt'>): Promise<ActivityEntity> {
    const activity: ActivityEntity = {
      ...data,
      id: randomUUID(),
      occurredAt: new Date().toISOString(),
    };
    this.activities.unshift(activity);
    return activity;
  }

  async findByEntity(
    organizationId: string,
    entityType: string,
    entityId: string,
    limit = 50,
  ): Promise<ActivityEntity[]> {
    return this.activities
      .filter((a) => a.organizationId === organizationId && a.entityType === entityType && a.entityId === entityId)
      .slice(0, limit);
  }

  async findByAccount(organizationId: string, accountId: string, limit = 50): Promise<ActivityEntity[]> {
    return this.activities
      .filter(
        (a) =>
          a.organizationId === organizationId &&
          (a.entityId === accountId || a.metadata?.['accountId'] === accountId),
      )
      .slice(0, limit);
  }

  async findRecent(organizationId: string, limit = 50): Promise<ActivityEntity[]> {
    return this.activities
      .filter((a) => a.organizationId === organizationId)
      .slice(0, limit);
  }
}
