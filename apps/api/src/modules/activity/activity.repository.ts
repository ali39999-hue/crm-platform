import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ActivityStatus, ActivityType } from '@crm/contracts';

export type ActivityEntity = {
  id: string;
  organizationId: string;
  actorId: string | null;
  actorName?: string | null | undefined;
  entityType: string;
  entityId: string;
  kind: string;
  summary: string;
  visibility: 'INTERNAL' | 'CUSTOMER_SHARED';
  occurredAt: string;
  metadata?: Record<string, any> | undefined;
};

export type ScheduledActivityEntity = {
  id: string;
  organizationId: string;
  type: ActivityType;
  title: string;
  description?: string | undefined;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  status: ActivityStatus;
  ownerId: string;
  ownerName: string;
  participantIds: string[];
  associatedEntityType?: string | undefined;
  associatedEntityId?: string | undefined;
  associatedEntityTitle?: string | undefined;
  visibility: 'INTERNAL' | 'CUSTOMER_SHARED';
  reminderMinutesBefore?: number | undefined;
  createdAt: string;
  updatedAt: string;
};

export interface IActivityRepository {
  create(data: Omit<ActivityEntity, 'id' | 'occurredAt'>): Promise<ActivityEntity>;
  findByEntity(organizationId: string, entityType: string, entityId: string, limit?: number): Promise<ActivityEntity[]>;
  findByAccount(organizationId: string, accountId: string, limit?: number): Promise<ActivityEntity[]>;
  findRecent(organizationId: string, limit?: number): Promise<ActivityEntity[]>;

  // Scheduled activities
  createScheduled(data: Omit<ScheduledActivityEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledActivityEntity>;
  updateScheduled(organizationId: string, id: string, data: Partial<Omit<ScheduledActivityEntity, 'id' | 'organizationId' | 'createdAt'>>): Promise<ScheduledActivityEntity | null>;
  findScheduledById(organizationId: string, id: string): Promise<ScheduledActivityEntity | null>;
  findScheduled(organizationId: string, filters?: { from?: string; to?: string; type?: ActivityType; status?: ActivityStatus; ownerId?: string }): Promise<ScheduledActivityEntity[]>;
  deleteScheduled(organizationId: string, id: string): Promise<boolean>;
  detectConflicts(organizationId: string, startsAt: string, endsAt: string, participantIds: string[], excludeId?: string): Promise<ScheduledActivityEntity[]>;
}

@Injectable()
export class InMemoryActivityRepository implements IActivityRepository {
  private activities: ActivityEntity[] = [];
  private scheduledActivities: ScheduledActivityEntity[] = [];

  constructor() {
    this.seedDefaultActivities();
    this.seedScheduledActivities();
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

  private seedScheduledActivities() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const employeeAlpha = '22222222-2222-2222-2222-222222222222';
    const now = Date.now();

    this.scheduledActivities.push(
      {
        id: 'act-meeting-101',
        organizationId: orgAlpha,
        type: 'MEETING',
        title: 'جلسه بررسی پیشرفت استقرار CRM با مدیران پتروشیمی',
        description: 'بررسی دسترسی‌های سازمانی، تنظیمات پورتال و رفع موانع فنی',
        startsAt: new Date(now + 3600000 * 2).toISOString(),
        endsAt: new Date(now + 3600000 * 3).toISOString(),
        isAllDay: false,
        status: 'SCHEDULED',
        ownerId: employeeAlpha,
        ownerName: 'سارا احمدی',
        participantIds: [employeeAlpha, '11111111-1111-1111-1111-111111111111'],
        associatedEntityType: 'ACCOUNT',
        associatedEntityId: '50000000-0000-0000-0000-000000000001',
        associatedEntityTitle: 'پتروشیمی سپهر',
        visibility: 'CUSTOMER_SHARED',
        reminderMinutesBefore: 30,
        createdAt: new Date(now - 86400000).toISOString(),
        updatedAt: new Date(now - 86400000).toISOString(),
      },
      {
        id: 'act-call-102',
        organizationId: orgAlpha,
        type: 'CALL',
        title: 'تماس پیگیری فرصت تجاری ارتقای زیرساخت سرورها',
        description: 'هماهنگی نهایی پیش‌فاکتور و تایید واحد تدارکات',
        startsAt: new Date(now + 3600000 * 5).toISOString(),
        endsAt: new Date(now + 3600000 * 5.5).toISOString(),
        isAllDay: false,
        status: 'SCHEDULED',
        ownerId: employeeAlpha,
        ownerName: 'سارا احمدی',
        participantIds: [employeeAlpha],
        associatedEntityType: 'DEAL',
        associatedEntityId: '80000000-0000-0000-0000-000000000001',
        associatedEntityTitle: 'قرارداد توسعه سالانه',
        visibility: 'INTERNAL',
        reminderMinutesBefore: 15,
        createdAt: new Date(now - 86400000).toISOString(),
        updatedAt: new Date(now - 86400000).toISOString(),
      },
      {
        id: 'act-remind-103',
        organizationId: orgAlpha,
        type: 'REMINDER',
        title: 'یادآوری ارسال گزارش ممیزی ماهانه',
        description: 'خروجی اکسل گزارش فعالیت کارکنان تهیه و ارسال گردد',
        startsAt: new Date(now + 86400000).toISOString(),
        endsAt: new Date(now + 86400000 + 1800000).toISOString(),
        isAllDay: false,
        status: 'SCHEDULED',
        ownerId: employeeAlpha,
        ownerName: 'سارا احمدی',
        participantIds: [employeeAlpha],
        visibility: 'INTERNAL',
        reminderMinutesBefore: 60,
        createdAt: new Date(now - 86400000).toISOString(),
        updatedAt: new Date(now - 86400000).toISOString(),
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

  /* Scheduled Activities */

  async createScheduled(
    data: Omit<ScheduledActivityEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ScheduledActivityEntity> {
    const now = new Date().toISOString();
    const item: ScheduledActivityEntity = {
      ...data,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.scheduledActivities.unshift(item);
    return item;
  }

  async updateScheduled(
    organizationId: string,
    id: string,
    data: Partial<Omit<ScheduledActivityEntity, 'id' | 'organizationId' | 'createdAt'>>,
  ): Promise<ScheduledActivityEntity | null> {
    const idx = this.scheduledActivities.findIndex(
      (a) => a.organizationId === organizationId && a.id === id,
    );
    if (idx === -1) return null;

    const existing = this.scheduledActivities[idx]!;
    const updated: ScheduledActivityEntity = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.scheduledActivities[idx] = updated;
    return updated;
  }

  async findScheduledById(
    organizationId: string,
    id: string,
  ): Promise<ScheduledActivityEntity | null> {
    return (
      this.scheduledActivities.find(
        (a) => a.organizationId === organizationId && a.id === id,
      ) ?? null
    );
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
    return this.scheduledActivities.filter((a) => {
      if (a.organizationId !== organizationId) return false;
      if (filters?.type && a.type !== filters.type) return false;
      if (filters?.status && a.status !== filters.status) return false;
      if (filters?.ownerId && a.ownerId !== filters.ownerId) return false;
      if (filters?.from && new Date(a.endsAt) < new Date(filters.from)) return false;
      if (filters?.to && new Date(a.startsAt) > new Date(filters.to)) return false;
      return true;
    });
  }

  async deleteScheduled(organizationId: string, id: string): Promise<boolean> {
    const idx = this.scheduledActivities.findIndex(
      (a) => a.organizationId === organizationId && a.id === id,
    );
    if (idx === -1) return false;
    this.scheduledActivities.splice(idx, 1);
    return true;
  }

  async detectConflicts(
    organizationId: string,
    startsAt: string,
    endsAt: string,
    participantIds: string[],
    excludeId?: string,
  ): Promise<ScheduledActivityEntity[]> {
    const targetStart = new Date(startsAt).getTime();
    const targetEnd = new Date(endsAt).getTime();

    return this.scheduledActivities.filter((act) => {
      if (act.organizationId !== organizationId) return false;
      if (excludeId && act.id === excludeId) return false;
      if (act.status === 'CANCELLED') return false;

      // Only check conflicts if time ranges overlap
      const actStart = new Date(act.startsAt).getTime();
      const actEnd = new Date(act.endsAt).getTime();
      const hasOverlap = targetStart < actEnd && targetEnd > actStart;
      if (!hasOverlap) return false;

      // Check if any participant matches
      const participantSet = new Set(participantIds);
      const sharesParticipant =
        participantSet.has(act.ownerId) ||
        act.participantIds.some((p) => participantSet.has(p));

      return sharesParticipant;
    });
  }
}
