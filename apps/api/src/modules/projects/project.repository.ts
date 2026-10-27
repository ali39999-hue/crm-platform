import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  MilestoneDto,
  ProjectHealth,
  ProjectStatus,
  ProjectSummaryDto,
} from '@crm/contracts';

export type ProjectEntity = {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  description?: string | undefined;
  status: ProjectStatus;
  health: ProjectHealth;
  ownerId: string;
  ownerName: string;
  startDate?: string | undefined;
  targetDate?: string | undefined;
  associatedAccountId?: string | undefined;
  associatedAccountName?: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export type MilestoneEntity = {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
  createdAt: string;
};

export interface IProjectRepository {
  findByOrg(organizationId: string): Promise<ProjectEntity[]>;
  findById(organizationId: string, id: string): Promise<ProjectEntity | null>;
  findByKey(organizationId: string, key: string): Promise<ProjectEntity | null>;
  create(data: Omit<ProjectEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectEntity>;
  update(entity: ProjectEntity): Promise<ProjectEntity>;
  delete(organizationId: string, id: string): Promise<boolean>;

  // Milestones
  findMilestones(organizationId: string, projectId: string): Promise<MilestoneEntity[]>;
  createMilestone(data: Omit<MilestoneEntity, 'id' | 'createdAt'>): Promise<MilestoneEntity>;
  toggleMilestone(
    organizationId: string,
    projectId: string,
    milestoneId: string,
    isCompleted: boolean,
  ): Promise<MilestoneEntity | null>;
}

@Injectable()
export class InMemoryProjectRepository implements IProjectRepository {
  private projects: Map<string, ProjectEntity> = new Map();
  private milestones: MilestoneEntity[] = [];

  constructor() {
    this.seedDefaultProjects();
  }

  private seedDefaultProjects() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const employeeAlpha = '22222222-2222-2222-2222-222222222222';
    const accAlpha = '50000000-0000-0000-0000-000000000001';

    const p1: ProjectEntity = {
      id: 'prj-001',
      organizationId: orgAlpha,
      key: 'PRJ-CRM',
      name: 'استقرار و بومی‌سازی پلتفرم جامع سازمانی',
      description: 'راه‌اندازی ماژول‌های تسک، فرآیند فروش CRM، پورتال مشتریان و پایگاه دانش سازمانی',
      status: 'ACTIVE',
      health: 'ON_TRACK',
      ownerId: employeeAlpha,
      ownerName: 'سارا احمدی',
      startDate: '2026-10-01T00:00:00.000Z',
      targetDate: '2026-12-30T00:00:00.000Z',
      associatedAccountId: accAlpha,
      associatedAccountName: 'پتروشیمی سپهر',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z',
    };

    const p2: ProjectEntity = {
      id: 'prj-002',
      organizationId: orgAlpha,
      key: 'PRJ-PORTAL',
      name: 'توسعه پورتال سلف‌سرویس مشتریان و تیکتینگ',
      description: 'فاز دوم پورتال مشتریان با پشتیبانی از اتصال مدارک، پیگیری تیکت‌ها و SLA',
      status: 'ACTIVE',
      health: 'ON_TRACK',
      ownerId: employeeAlpha,
      ownerName: 'سارا احمدی',
      startDate: '2026-10-15T00:00:00.000Z',
      targetDate: '2026-11-20T00:00:00.000Z',
      createdAt: '2026-10-15T00:00:00.000Z',
      updatedAt: '2026-10-20T00:00:00.000Z',
    };

    this.projects.set(p1.id, p1);
    this.projects.set(p2.id, p2);

    this.milestones.push(
      {
        id: 'ms-001',
        organizationId: orgAlpha,
        projectId: p1.id,
        title: 'طراحی قراردادهای داده و معماری چندمستأجری',
        dueDate: '2026-10-10T00:00:00.000Z',
        isCompleted: true,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 'ms-002',
        organizationId: orgAlpha,
        projectId: p1.id,
        title: 'پیاده‌سازی بردهای درگ اند دراپ و خطوط فروش',
        dueDate: '2026-10-25T00:00:00.000Z',
        isCompleted: true,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 'ms-003',
        organizationId: orgAlpha,
        projectId: p1.id,
        title: 'استقرار پایگاه دانش و گزارش‌های تحلیلی BI',
        dueDate: '2026-11-15T00:00:00.000Z',
        isCompleted: false,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    );
  }

  async findByOrg(organizationId: string): Promise<ProjectEntity[]> {
    return Array.from(this.projects.values()).filter((p) => p.organizationId === organizationId);
  }

  async findById(organizationId: string, id: string): Promise<ProjectEntity | null> {
    const p = this.projects.get(id);
    if (!p || p.organizationId !== organizationId) return null;
    return p;
  }

  async findByKey(organizationId: string, key: string): Promise<ProjectEntity | null> {
    return (
      Array.from(this.projects.values()).find(
        (p) =>
          p.organizationId === organizationId &&
          p.key.toUpperCase() === key.toUpperCase(),
      ) ?? null
    );
  }

  async create(data: Omit<ProjectEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectEntity> {
    const now = new Date().toISOString();
    const entity: ProjectEntity = {
      ...data,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(entity.id, entity);
    return entity;
  }

  async update(entity: ProjectEntity): Promise<ProjectEntity> {
    const updated: ProjectEntity = {
      ...entity,
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(entity.id, updated);
    return updated;
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const p = await this.findById(organizationId, id);
    if (!p) return false;
    this.projects.delete(id);
    return true;
  }

  /* Milestones */

  async findMilestones(organizationId: string, projectId: string): Promise<MilestoneEntity[]> {
    return this.milestones.filter(
      (m) => m.organizationId === organizationId && m.projectId === projectId,
    );
  }

  async createMilestone(data: Omit<MilestoneEntity, 'id' | 'createdAt'>): Promise<MilestoneEntity> {
    const entity: MilestoneEntity = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.milestones.push(entity);
    return entity;
  }

  async toggleMilestone(
    organizationId: string,
    projectId: string,
    milestoneId: string,
    isCompleted: boolean,
  ): Promise<MilestoneEntity | null> {
    const m = this.milestones.find(
      (x) =>
        x.organizationId === organizationId &&
        x.projectId === projectId &&
        x.id === milestoneId,
    );
    if (!m) return null;
    m.isCompleted = isCompleted;
    return m;
  }
}
