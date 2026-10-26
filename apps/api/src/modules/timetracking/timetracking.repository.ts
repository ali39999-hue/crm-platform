import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { WorkLogEntityType } from '@crm/contracts';

export type WorkLogEntity = {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  entityType: WorkLogEntityType;
  entityId: string;
  entityTitle: string;
  durationMinutes: number;
  description: string;
  isBillable: boolean;
  loggedDate: string;
  createdAt: string;
  updatedAt: string;
};

export interface ITimeTrackingRepository {
  findByOrg(
    organizationId: string,
    filters?: {
      userId?: string | undefined;
      entityType?: WorkLogEntityType | undefined;
      entityId?: string | undefined;
      fromDate?: string | undefined;
      toDate?: string | undefined;
    },
  ): Promise<WorkLogEntity[]>;
  findById(organizationId: string, id: string): Promise<WorkLogEntity | null>;
  create(data: Omit<WorkLogEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkLogEntity>;
  update(entity: WorkLogEntity): Promise<WorkLogEntity>;
  delete(organizationId: string, id: string): Promise<boolean>;
}

@Injectable()
export class InMemoryTimeTrackingRepository implements ITimeTrackingRepository {
  private logs: Map<string, WorkLogEntity> = new Map();

  constructor() {
    this.seedDefaultLogs();
  }

  private seedDefaultLogs() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const employeeAlpha = '22222222-2222-2222-2222-222222222222';
    const now = new Date();

    const seeded: WorkLogEntity[] = [
      {
        id: 'wl-001',
        organizationId: orgAlpha,
        userId: employeeAlpha,
        userName: 'سارا احمدی',
        entityType: 'TASK',
        entityId: '10000000-0000-0000-0000-000000000001',
        entityTitle: 'بررسی لاگ‌های ورود و اتصال چندمستأجری',
        durationMinutes: 120, // 2 hours
        description: 'تحلیل امنیتی درخواست‌ها و تست اعتبارسنجی توکن',
        isBillable: true,
        loggedDate: new Date(now.getTime() - 86400000 * 2).toISOString().slice(0, 10),
        createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
        updatedAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
      },
      {
        id: 'wl-002',
        organizationId: orgAlpha,
        userId: employeeAlpha,
        userName: 'سارا احمدی',
        entityType: 'PROJECT',
        entityId: 'prj-001',
        entityTitle: 'استقرار و بومی‌سازی پلتفرم جامع سازمانی',
        durationMinutes: 90, // 1.5 hours
        description: 'هماهنگی با تیم زیرساخت جهت تست استقرار کانتینری',
        isBillable: true,
        loggedDate: new Date(now.getTime() - 86400000).toISOString().slice(0, 10),
        createdAt: new Date(now.getTime() - 86400000).toISOString(),
        updatedAt: new Date(now.getTime() - 86400000).toISOString(),
      },
      {
        id: 'wl-003',
        organizationId: orgAlpha,
        userId: employeeAlpha,
        userName: 'سارا احمدی',
        entityType: 'TICKET',
        entityId: '90000000-0000-0000-0000-000000000001',
        entityTitle: 'مشکل در خروجی اکسل گزارش‌ها',
        durationMinutes: 45,
        description: 'بررسی پارامترهای تاریخ جلالی و رفع باگ تایپ‌اسکریپت',
        isBillable: false,
        loggedDate: now.toISOString().slice(0, 10),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    for (const item of seeded) {
      this.logs.set(item.id, item);
    }
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
    return Array.from(this.logs.values())
      .filter((log) => {
        if (log.organizationId !== organizationId) return false;
        if (filters?.userId && log.userId !== filters.userId) return false;
        if (filters?.entityType && log.entityType !== filters.entityType) return false;
        if (filters?.entityId && log.entityId !== filters.entityId) return false;
        if (filters?.fromDate && log.loggedDate < filters.fromDate) return false;
        if (filters?.toDate && log.loggedDate > filters.toDate) return false;
        return true;
      })
      .sort((a, b) => new Date(b.loggedDate).getTime() - new Date(a.loggedDate).getTime());
  }

  async findById(organizationId: string, id: string): Promise<WorkLogEntity | null> {
    const item = this.logs.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  async create(data: Omit<WorkLogEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkLogEntity> {
    const now = new Date().toISOString();
    const entity: WorkLogEntity = {
      ...data,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.logs.set(entity.id, entity);
    return entity;
  }

  async update(entity: WorkLogEntity): Promise<WorkLogEntity> {
    const updated: WorkLogEntity = {
      ...entity,
      updatedAt: new Date().toISOString(),
    };
    this.logs.set(entity.id, updated);
    return updated;
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const item = await this.findById(organizationId, id);
    if (!item) return false;
    this.logs.delete(id);
    return true;
  }
}
