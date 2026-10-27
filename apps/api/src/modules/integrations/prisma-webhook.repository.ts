import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IWebhookRepository } from './webhook.repository.js';
import type {
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookSubscription,
} from './dto/webhook-subscription.dto.js';

@Injectable()
export class PrismaWebhookRepository implements IWebhookRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapSubscription(s: any): WebhookSubscription {
    return {
      id: s.id,
      organizationId: s.organizationId,
      url: s.url,
      secret: s.secret,
      events: s.events ?? [],
      description: s.description ?? undefined,
      enabled: s.enabled,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  private mapDelivery(d: any): WebhookDelivery {
    return {
      id: d.id,
      subscriptionId: d.subscriptionId,
      organizationId: d.organizationId,
      event: d.event,
      payload: d.payload ?? {},
      attemptNumber: d.attemptNumber,
      maxRetries: d.maxRetries,
      status: d.status as WebhookDeliveryStatus,
      statusCode: d.statusCode ?? null,
      responseBody: d.responseBody ?? null,
      error: d.error ?? null,
      durationMs: d.durationMs ?? undefined,
      headers: d.headers ?? {},
      timestamp: d.timestamp.toISOString(),
      nextRetryAt: d.nextRetryAt ? d.nextRetryAt.toISOString() : null,
    };
  }

  /* Subscriptions */

  async findSubscriptionsByOrg(organizationId: string): Promise<WebhookSubscription[]> {
    const rows = await (this.prisma.tenantClient as any).webhookSubscription.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((s: any) => this.mapSubscription(s));
  }

  async findSubscriptionById(organizationId: string, id: string): Promise<WebhookSubscription | null> {
    const row = await (this.prisma.tenantClient as any).webhookSubscription.findFirst({
      where: { organizationId, id },
    });
    return row ? this.mapSubscription(row) : null;
  }

  async findActiveSubscriptionsByEvent(organizationId: string, event: string): Promise<WebhookSubscription[]> {
    const rows = await (this.prisma.tenantClient as any).webhookSubscription.findMany({
      where: {
        organizationId,
        enabled: true,
        OR: [{ events: { has: event } }, { events: { has: '*' } }],
      },
    });
    return rows.map((s: any) => this.mapSubscription(s));
  }

  async createSubscription(
    data: Omit<WebhookSubscription, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<WebhookSubscription> {
    const created = await (this.prisma.tenantClient as any).webhookSubscription.create({
      data: {
        organizationId: data.organizationId,
        url: data.url,
        secret: data.secret,
        events: data.events,
        description: data.description ?? null,
        enabled: data.enabled,
      },
    });
    return this.mapSubscription(created);
  }

  async updateSubscription(
    organizationId: string,
    id: string,
    updates: Partial<Omit<WebhookSubscription, 'id' | 'organizationId' | 'createdAt'>>,
  ): Promise<WebhookSubscription | null> {
    const existing = await this.findSubscriptionById(organizationId, id);
    if (!existing) return null;
    const updated = await (this.prisma.tenantClient as any).webhookSubscription.update({
      where: { id },
      data: {
        url: updates.url,
        secret: updates.secret,
        events: updates.events,
        description: updates.description,
        enabled: updates.enabled,
      },
    });
    return this.mapSubscription(updated);
  }

  async deleteSubscription(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findSubscriptionById(organizationId, id);
    if (!existing) return false;
    await (this.prisma.tenantClient as any).webhookSubscription.delete({ where: { id } });
    return true;
  }

  /* Deliveries */

  async createDelivery(data: Omit<WebhookDelivery, 'id'>): Promise<WebhookDelivery> {
    const created = await (this.prisma.tenantClient as any).webhookDelivery.create({
      data: {
        organizationId: data.organizationId,
        subscriptionId: data.subscriptionId,
        event: data.event,
        payload: data.payload ?? {},
        attemptNumber: data.attemptNumber,
        maxRetries: data.maxRetries,
        status: data.status,
        statusCode: data.statusCode ?? null,
        responseBody: data.responseBody ?? null,
        error: data.error ?? null,
        durationMs: data.durationMs ?? null,
        headers: data.headers ?? {},
        timestamp: new Date(data.timestamp),
        nextRetryAt: data.nextRetryAt ? new Date(data.nextRetryAt) : null,
      },
    });
    return this.mapDelivery(created);
  }

  async updateDelivery(
    organizationId: string,
    id: string,
    updates: Partial<Omit<WebhookDelivery, 'id' | 'organizationId'>>,
  ): Promise<WebhookDelivery | null> {
    const existing = await this.findDeliveryById(organizationId, id);
    if (!existing) return null;
    const data: Record<string, any> = {};
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.statusCode !== undefined) data.statusCode = updates.statusCode;
    if (updates.responseBody !== undefined) data.responseBody = updates.responseBody;
    if (updates.error !== undefined) data.error = updates.error;
    if (updates.attemptNumber !== undefined) data.attemptNumber = updates.attemptNumber;
    if (updates.durationMs !== undefined) data.durationMs = updates.durationMs;
    if (updates.nextRetryAt !== undefined) {
      data.nextRetryAt = updates.nextRetryAt ? new Date(updates.nextRetryAt) : null;
    }
    const updated = await (this.prisma.tenantClient as any).webhookDelivery.update({
      where: { id },
      data,
    });
    return this.mapDelivery(updated);
  }

  async findDeliveryById(organizationId: string, id: string): Promise<WebhookDelivery | null> {
    const row = await (this.prisma.tenantClient as any).webhookDelivery.findFirst({
      where: { organizationId, id },
    });
    return row ? this.mapDelivery(row) : null;
  }

  async findDeliveriesByOrg(
    organizationId: string,
    options?: {
      subscriptionId?: string | undefined;
      status?: WebhookDeliveryStatus | undefined;
      limit?: number | undefined;
    } | undefined,
  ): Promise<WebhookDelivery[]> {
    const where: any = { organizationId };
    if (options?.subscriptionId) where.subscriptionId = options.subscriptionId;
    if (options?.status) where.status = options.status;
    const rows = await (this.prisma.tenantClient as any).webhookDelivery.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options?.limit ?? 50,
    });
    return rows.map((d: any) => this.mapDelivery(d));
  }

  /* Nonces (replay protection) — infra-level, not tenant-scoped */

  async hasNonce(scope: string, nonce: string, now = Date.now()): Promise<boolean> {
    const row = await (this.prisma.tenantClient as any).webhookNonce.findUnique({
      where: { scope_nonce: { scope, nonce } },
    });
    if (!row) return false;
    if (row.expiresAt.getTime() <= now) {
      await (this.prisma.tenantClient as any).webhookNonce.delete({
        where: { scope_nonce: { scope, nonce } },
      });
      return false;
    }
    return true;
  }

  async recordNonce(scope: string, nonce: string, expiresAt: number): Promise<void> {
    await (this.prisma.tenantClient as any).webhookNonce.upsert({
      where: { scope_nonce: { scope, nonce } },
      create: { scope, nonce, expiresAt: new Date(expiresAt) },
      update: { expiresAt: new Date(expiresAt) },
    });
  }

  async clearExpiredNonces(now = Date.now()): Promise<number> {
    const result = await (this.prisma.tenantClient as any).webhookNonce.deleteMany({
      where: { expiresAt: { lte: new Date(now) } },
    });
    return result?.count ?? 0;
  }
}
