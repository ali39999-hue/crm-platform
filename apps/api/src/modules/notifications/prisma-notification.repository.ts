import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { INotificationRepository, NotificationEntity } from './notification.repository.js';
import type { NotificationPreferencesDto } from '@crm/contracts';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(n: any): NotificationEntity {
    return {
      id: n.id,
      organizationId: n.organizationId,
      userId: n.userId,
      type: n.type,
      title: n.title ?? '',
      message: n.message ?? '',
      payload: n.payload ?? {},
      dedupeKey: n.dedupeKey ?? null,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    };
  }

  async findByUser(organizationId: string, userId: string, limit = 50): Promise<NotificationEntity[]> {
    const rows = await (this.prisma.tenantClient as any).notification.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((n: any) => this.mapToEntity(n));
  }

  async findById(organizationId: string, userId: string, id: string): Promise<NotificationEntity | null> {
    const row = await (this.prisma.tenantClient as any).notification.findFirst({
      where: { id, organizationId, userId },
    });
    return row ? this.mapToEntity(row) : null;
  }

  async create(
    data: Omit<NotificationEntity, 'id' | 'createdAt' | 'readAt'>,
  ): Promise<NotificationEntity | null> {
    const client = this.prisma.tenantClient as any;

    if (data.dedupeKey) {
      const existing = await client.notification.findFirst({
        where: { organizationId: data.organizationId, userId: data.userId, dedupeKey: data.dedupeKey },
      });
      if (existing) {
        return this.mapToEntity(existing); // idempotent: return existing notification
      }
    }

    try {
      const created = await client.notification.create({
        data: {
          organizationId: data.organizationId,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          payload: data.payload ?? {},
          dedupeKey: data.dedupeKey,
        },
      });
      return this.mapToEntity(created);
    } catch (err: any) {
      // Concurrent dedupe hit on @@unique([organizationId, userId, dedupeKey])
      if (err?.code === 'P2002' && data.dedupeKey) {
        const existing = await client.notification.findFirst({
          where: { organizationId: data.organizationId, userId: data.userId, dedupeKey: data.dedupeKey },
        });
        return existing ? this.mapToEntity(existing) : null;
      }
      throw err;
    }
  }

  async markAsRead(organizationId: string, userId: string, id: string): Promise<NotificationEntity | null> {
    const existing = await this.findById(organizationId, userId, id);
    if (!existing) return null;
    const updated = await (this.prisma.tenantClient as any).notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return this.mapToEntity(updated);
  }

  async markAllAsRead(organizationId: string, userId: string): Promise<number> {
    const result = await (this.prisma.tenantClient as any).notification.updateMany({
      where: { organizationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result?.count ?? 0;
  }

  async getPreferences(userId: string): Promise<NotificationPreferencesDto> {
    const row = await (this.prisma.tenantClient as any).notificationPreference.findUnique({
      where: { userId },
    });
    return (
      row
        ? { inApp: row.inApp, email: row.email, push: row.push, digest: row.digest }
        : {
            inApp: true,
            email: true,
            push: false,
            digest: true,
          }
    );
  }

  async setPreferences(userId: string, prefs: NotificationPreferencesDto): Promise<NotificationPreferencesDto> {
    const saved = await (this.prisma.tenantClient as any).notificationPreference.upsert({
      where: { userId },
      create: { userId, inApp: prefs.inApp, email: prefs.email, push: prefs.push, digest: prefs.digest },
      update: { inApp: prefs.inApp, email: prefs.email, push: prefs.push, digest: prefs.digest },
    });
    return {
      inApp: saved.inApp,
      email: saved.email,
      push: saved.push,
      digest: saved.digest,
    };
  }
}
