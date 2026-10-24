import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { TaskDetails, TaskPriority, TaskStatus, RecordVisibility } from '@crm/contracts';

export type TaskEntity = {
  id: string;
  organizationId: string;
  projectId: string | null;
  creatorId: string;
  assigneeId: string | null;
  parentId: string | null;
  key: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  visibility: RecordVisibility;
  dueAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export interface ITaskRepository {
  findMyWork(organizationId: string, userId: string): Promise<TaskEntity[]>;
  findAll(
    organizationId: string,
    filter?: {
      status?: TaskStatus | undefined;
      priority?: TaskPriority | undefined;
      assigneeId?: string | undefined;
      limit?: number | undefined;
    },
  ): Promise<TaskEntity[]>;
  findById(organizationId: string, id: string): Promise<TaskEntity | null>;
  create(task: Omit<TaskEntity, 'id' | 'key' | 'version' | 'createdAt' | 'updatedAt'>): Promise<TaskEntity>;
  update(task: TaskEntity): Promise<TaskEntity>;
}

@Injectable()
export class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Map<string, TaskEntity> = new Map();
  private orgCounter: Map<string, number> = new Map();

  constructor() {
    this.seedDefaultTasks();
  }

  private seedDefaultTasks() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const employeeAlpha = '22222222-2222-2222-2222-222222222222';
    const employeeBeta = '44444444-4444-4444-4444-444444444444';

    const sampleTasks: Array<Omit<TaskEntity, 'key' | 'version' | 'createdAt' | 'updatedAt'>> = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        organizationId: orgAlpha,
        projectId: null,
        creatorId: employeeAlpha,
        assigneeId: employeeAlpha,
        parentId: null,
        title: 'بررسی قرارداد مشتری جدید و ثبت در CRM',
        description: 'اطلاعات اولیه مشتری دریافت شده و نیازمند بررسی است.',
        status: 'TODO',
        priority: 'HIGH',
        visibility: 'INTERNAL',
        dueAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        organizationId: orgAlpha,
        projectId: null,
        creatorId: employeeAlpha,
        assigneeId: employeeAlpha,
        parentId: null,
        title: 'پیاده‌سازی تست‌های امنیتی احراز هویت و مجوزها',
        description: 'تست‌های BOLA و منفی برای جلوگیری از IDOR',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        visibility: 'INTERNAL',
        dueAt: new Date(Date.now() + 86400000).toISOString(),
      },
      {
        id: '20000000-0000-0000-0000-000000000001',
        organizationId: orgBeta,
        projectId: null,
        creatorId: employeeBeta,
        assigneeId: employeeBeta,
        parentId: null,
        title: 'پروژه محرمانه سازمان بتا',
        description: 'این تسک متعلق به سازمان دیگری است و نباید توسط آلفا دیده شود.',
        status: 'TODO',
        priority: 'MEDIUM',
        visibility: 'INTERNAL',
        dueAt: null,
      },
    ];

    for (const t of sampleTasks) {
      const counter = (this.orgCounter.get(t.organizationId) ?? 0) + 1;
      this.orgCounter.set(t.organizationId, counter);
      const entity: TaskEntity = {
        ...t,
        key: `TSK-${counter}`,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.tasks.set(entity.id, entity);
    }
  }

  async findMyWork(organizationId: string, userId: string): Promise<TaskEntity[]> {
    return Array.from(this.tasks.values())
      .filter((t) => t.organizationId === organizationId && t.assigneeId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
    let result = Array.from(this.tasks.values()).filter((t) => t.organizationId === organizationId);

    if (filter?.status) {
      result = result.filter((t) => t.status === filter.status);
    }
    if (filter?.priority) {
      result = result.filter((t) => t.priority === filter.priority);
    }
    if (filter?.assigneeId) {
      result = result.filter((t) => t.assigneeId === filter.assigneeId);
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }
    return result;
  }

  async findById(organizationId: string, id: string): Promise<TaskEntity | null> {
    const task = this.tasks.get(id);
    if (!task) return null;
    // Strict tenant isolation: return null if not in requested organization
    if (task.organizationId !== organizationId) {
      return null;
    }
    return task;
  }

  async create(data: Omit<TaskEntity, 'id' | 'key' | 'version' | 'createdAt' | 'updatedAt'>): Promise<TaskEntity> {
    const counter = (this.orgCounter.get(data.organizationId) ?? 0) + 1;
    this.orgCounter.set(data.organizationId, counter);

    const now = new Date().toISOString();
    const task: TaskEntity = {
      ...data,
      id: randomUUID(),
      key: `TSK-${counter}`,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async update(task: TaskEntity): Promise<TaskEntity> {
    const updated = {
      ...task,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(task.id, updated);
    return updated;
  }
}
