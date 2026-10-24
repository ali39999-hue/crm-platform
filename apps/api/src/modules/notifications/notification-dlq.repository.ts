import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { DeadLetterNotificationDto, DeadLetterStatus } from '@crm/contracts';

export type DeadLetterNotification = DeadLetterNotificationDto;

export interface INotificationDlqRepository {
  findByOrg(organizationId: string, limit?: number | undefined): Promise<DeadLetterNotification[]>;
  findById(organizationId: string, id: string): Promise<DeadLetterNotification | null>;
  create(
    data: Omit<DeadLetterNotification, 'id' | 'createdAt' | 'failedAt' | 'status'> & {
      status?: DeadLetterStatus | undefined;
    },
  ): Promise<DeadLetterNotification>;
  update(
    organizationId: string,
    id: string,
    updates: Partial<DeadLetterNotification>,
  ): Promise<DeadLetterNotification | null>;
  delete(organizationId: string, id: string): Promise<boolean>;
  clear(): Promise<void>;
}

@Injectable()
export class InMemoryNotificationDlqRepository implements INotificationDlqRepository {
  private deadLetters: DeadLetterNotification[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults(): void {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const userAlpha = '22222222-2222-2222-2222-222222222222';

    this.deadLetters.push({
      id: '88000000-0000-0000-0000-000000000001',
      organizationId: orgAlpha,
      userId: userAlpha,
      channel: 'email',
      recipient: 'employee@org-alpha.com',
      title: 'یادآور تسک موعد گذشته',
      message: 'تسک شماره TSK-1001 از موعد مقرر عبور کرده است.',
      payload: { taskId: '10000000-0000-0000-0000-000000000001' },
      dedupeKey: 'task-overdue-1001-email',
      retryCount: 3,
      maxRetries: 3,
      lastError: 'SMTP connection timeout after 3 attempts',
      status: 'FAILED',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      failedAt: new Date(Date.now() - 7100000).toISOString(),
      resolvedAt: null,
    });
  }

  async findByOrg(organizationId: string, limit = 50): Promise<DeadLetterNotification[]> {
    return this.deadLetters
      .filter((dl) => dl.organizationId === organizationId)
      .sort((a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime())
      .slice(0, limit);
  }

  async findById(organizationId: string, id: string): Promise<DeadLetterNotification | null> {
    return (
      this.deadLetters.find((dl) => dl.organizationId === organizationId && dl.id === id) ?? null
    );
  }

  async create(
    data: Omit<DeadLetterNotification, 'id' | 'createdAt' | 'failedAt' | 'status'> & {
      status?: DeadLetterStatus;
    },
  ): Promise<DeadLetterNotification> {
    const now = new Date().toISOString();
    const entry: DeadLetterNotification = {
      ...data,
      id: randomUUID(),
      status: data.status ?? 'FAILED',
      createdAt: now,
      failedAt: now,
      resolvedAt: null,
    };
    this.deadLetters.unshift(entry);
    return entry;
  }

  async update(
    organizationId: string,
    id: string,
    updates: Partial<DeadLetterNotification>,
  ): Promise<DeadLetterNotification | null> {
    const index = this.deadLetters.findIndex(
      (dl) => dl.organizationId === organizationId && dl.id === id,
    );
    if (index === -1) {
      return null;
    }
    const current = this.deadLetters[index];
    if (!current) {
      return null;
    }
    const updated: DeadLetterNotification = {
      ...current,
      ...updates,
      id: current.id,
      organizationId: current.organizationId,
    };
    this.deadLetters[index] = updated;
    return updated;
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const prevLen = this.deadLetters.length;
    this.deadLetters = this.deadLetters.filter(
      (dl) => !(dl.organizationId === organizationId && dl.id === id),
    );
    return this.deadLetters.length < prevLen;
  }

  async clear(): Promise<void> {
    this.deadLetters = [];
  }
}
