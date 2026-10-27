import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  DeadLetterNotification,
  INotificationDlqRepository,
} from './notification-dlq.repository.js';
import type { DeadLetterStatus } from '@crm/contracts';

@Injectable()
export class PrismaNotificationDlqRepository implements INotificationDlqRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(d: any): DeadLetterNotification {
    return {
      id: d.id,
      organizationId: d.organizationId,
      userId: d.userId,
      channel: d.channel,
      recipient: d.recipient,
      title: d.title,
      message: d.message,
      payload: d.payload ?? undefined,
      dedupeKey: d.dedupeKey ?? null,
      retryCount: d.retryCount,
      maxRetries: d.maxRetries,
      lastError: d.lastError,
      status: d.status as DeadLetterStatus,
      createdAt: d.createdAt.toISOString(),
      failedAt: d.failedAt.toISOString(),
      resolvedAt: d.resolvedAt ? d.resolvedAt.toISOString() : null,
    };
  }

  async findByOrg(organizationId: string, limit?: number | undefined): Promise<DeadLetterNotification[]> {
    const rows = await (this.prisma.tenantClient as any).notificationDeadLetter.findMany({
      where: { organizationId },
      orderBy: { failedAt: 'desc' },
      take: limit ?? undefined,
    });
    return rows.map((d: any) => this.mapToEntity(d));
  }

  async findById(organizationId: string, id: string): Promise<DeadLetterNotification | null> {
    const row = await (this.prisma.tenantClient as any).notificationDeadLetter.findFirst({
      where: { organizationId, id },
    });
    return row ? this.mapToEntity(row) : null;
  }

  async create(
    data: Omit<DeadLetterNotification, 'id' | 'createdAt' | 'failedAt' | 'status'> & {
      status?: DeadLetterStatus | undefined;
    },
  ): Promise<DeadLetterNotification> {
    const created = await (this.prisma.tenantClient as any).notificationDeadLetter.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        channel: data.channel,
        recipient: data.recipient,
        title: data.title,
        message: data.message,
        payload: data.payload ?? undefined,
        dedupeKey: data.dedupeKey,
        retryCount: data.retryCount,
        maxRetries: data.maxRetries,
        lastError: data.lastError,
        status: data.status,
        resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null,
      },
    });
    return this.mapToEntity(created);
  }

  async update(
    organizationId: string,
    id: string,
    updates: Partial<DeadLetterNotification>,
  ): Promise<DeadLetterNotification | null> {
    const existing = await this.findById(organizationId, id);
    if (!existing) return null;
    const data: Record<string, any> = {};
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.retryCount !== undefined) data.retryCount = updates.retryCount;
    if (updates.lastError !== undefined) data.lastError = updates.lastError;
    if (updates.resolvedAt !== undefined) {
      data.resolvedAt = updates.resolvedAt ? new Date(updates.resolvedAt) : null;
    }
    const updated = await (this.prisma.tenantClient as any).notificationDeadLetter.update({
      where: { id },
      data,
    });
    return this.mapToEntity(updated);
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findById(organizationId, id);
    if (!existing) return false;
    await (this.prisma.tenantClient as any).notificationDeadLetter.delete({ where: { id } });
    return true;
  }

  async clear(): Promise<void> {
    await (this.prisma.tenantClient as any).notificationDeadLetter.deleteMany({});
  }
}
