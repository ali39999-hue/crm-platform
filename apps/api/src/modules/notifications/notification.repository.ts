import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NotificationDto, NotificationPreferencesDto } from '@crm/contracts';

export type NotificationEntity = {
  id: string;
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, any>;
  dedupeKey: string | null;
  readAt: string | null;
  createdAt: string;
};

export interface INotificationRepository {
  findByUser(organizationId: string, userId: string, limit?: number): Promise<NotificationEntity[]>;
  findById(organizationId: string, userId: string, id: string): Promise<NotificationEntity | null>;
  create(data: Omit<NotificationEntity, 'id' | 'createdAt' | 'readAt'>): Promise<NotificationEntity | null>;
  markAsRead(organizationId: string, userId: string, id: string): Promise<NotificationEntity | null>;
  markAllAsRead(organizationId: string, userId: string): Promise<number>;
  getPreferences(userId: string): Promise<NotificationPreferencesDto>;
  setPreferences(userId: string, prefs: NotificationPreferencesDto): Promise<NotificationPreferencesDto>;
}

@Injectable()
export class InMemoryNotificationRepository implements INotificationRepository {
  private notifications: NotificationEntity[] = [];
  private preferences: Map<string, NotificationPreferencesDto> = new Map();

  constructor() {
    this.seedNotifications();
  }

  private seedNotifications() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const employeeAlpha = '22222222-2222-2222-2222-222222222222';

    this.notifications.push(
      {
        id: '99000000-0000-0000-0000-000000000001',
        organizationId: orgAlpha,
        userId: employeeAlpha,
        type: 'TASK_ASSIGNED',
        title: 'تخصیص وظیفه جدید',
        message: 'وظیفه TSK-1001 به شما واگذار شد.',
        payload: { taskId: '10000000-0000-0000-0000-000000000001', key: 'TSK-1001' },
        dedupeKey: 'task-assign-1001',
        readAt: null,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '99000000-0000-0000-0000-000000000002',
        organizationId: orgAlpha,
        userId: employeeAlpha,
        type: 'TICKET_REPLIED',
        title: 'پیام جدید در تیکت',
        message: 'پیام جدیدی در تیکت TKT-1042 ثبت شد.',
        payload: { ticketId: '90000000-0000-0000-0000-000000000001', reference: 'TKT-1042' },
        dedupeKey: 'ticket-reply-1042-msg-1',
        readAt: null,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    );
  }

  async findByUser(organizationId: string, userId: string, limit = 50): Promise<NotificationEntity[]> {
    return this.notifications
      .filter((n) => n.organizationId === organizationId && n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async findById(organizationId: string, userId: string, id: string): Promise<NotificationEntity | null> {
    return (
      this.notifications.find(
        (n) => n.id === id && n.organizationId === organizationId && n.userId === userId,
      ) ?? null
    );
  }

  async create(data: Omit<NotificationEntity, 'id' | 'createdAt' | 'readAt'>): Promise<NotificationEntity | null> {
    // Check dedupe key if provided
    if (data.dedupeKey) {
      const existing = this.notifications.find(
        (n) =>
          n.organizationId === data.organizationId &&
          n.userId === data.userId &&
          n.dedupeKey === data.dedupeKey,
      );
      if (existing) {
        return existing; // idempotent: return existing notification
      }
    }

    const entity: NotificationEntity = {
      ...data,
      id: randomUUID(),
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(entity);
    return entity;
  }

  async markAsRead(organizationId: string, userId: string, id: string): Promise<NotificationEntity | null> {
    const notif = await this.findById(organizationId, userId, id);
    if (!notif) return null;
    notif.readAt = new Date().toISOString();
    return notif;
  }

  async markAllAsRead(organizationId: string, userId: string): Promise<number> {
    let count = 0;
    const now = new Date().toISOString();
    for (const n of this.notifications) {
      if (n.organizationId === organizationId && n.userId === userId && !n.readAt) {
        n.readAt = now;
        count++;
      }
    }
    return count;
  }

  async getPreferences(userId: string): Promise<NotificationPreferencesDto> {
    return (
      this.preferences.get(userId) ?? {
        inApp: true,
        email: true,
        push: false,
        digest: true,
      }
    );
  }

  async setPreferences(
    userId: string,
    prefs: NotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    this.preferences.set(userId, prefs);
    return prefs;
  }
}
