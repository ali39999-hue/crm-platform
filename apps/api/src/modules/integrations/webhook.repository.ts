import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookSubscription,
} from './dto/webhook-subscription.dto.js';

export interface IWebhookRepository {
  findSubscriptionsByOrg(organizationId: string): Promise<WebhookSubscription[]>;
  findSubscriptionById(organizationId: string, id: string): Promise<WebhookSubscription | null>;
  findActiveSubscriptionsByEvent(organizationId: string, event: string): Promise<WebhookSubscription[]>;
  createSubscription(
    data: Omit<WebhookSubscription, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<WebhookSubscription>;
  updateSubscription(
    organizationId: string,
    id: string,
    updates: Partial<Omit<WebhookSubscription, 'id' | 'organizationId' | 'createdAt'>>,
  ): Promise<WebhookSubscription | null>;
  deleteSubscription(organizationId: string, id: string): Promise<boolean>;

  createDelivery(data: Omit<WebhookDelivery, 'id'>): Promise<WebhookDelivery>;
  updateDelivery(
    organizationId: string,
    id: string,
    updates: Partial<Omit<WebhookDelivery, 'id' | 'organizationId'>>,
  ): Promise<WebhookDelivery | null>;
  findDeliveryById(organizationId: string, id: string): Promise<WebhookDelivery | null>;
  findDeliveriesByOrg(
    organizationId: string,
    options?: {
      subscriptionId?: string | undefined;
      status?: WebhookDeliveryStatus | undefined;
      limit?: number | undefined;
    } | undefined,
  ): Promise<WebhookDelivery[]>;

  hasNonce(scope: string, nonce: string, now?: number): Promise<boolean>;
  recordNonce(scope: string, nonce: string, expiresAt: number): Promise<void>;
  clearExpiredNonces(now?: number): Promise<number>;
}

@Injectable()
export class InMemoryWebhookRepository implements IWebhookRepository {
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private seenNonces: Map<string, number> = new Map(); // key `${scope}:${nonce}` => expiresAt

  constructor() {
    this.seedDefaultSubscriptions();
  }

  private seedDefaultSubscriptions() {
    const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const sampleSubscription: WebhookSubscription = {
      id: '99000000-0000-0000-0000-000000000001',
      organizationId: orgAlpha,
      url: 'https://webhook.site/sample-endpoint',
      secret: 'whsec_sample_secret_seed_alpha_32bytes_value',
      events: ['task.created', 'task.transitioned', 'lead.converted'],
      description: 'سامانه یکپارچه‌ساز پیش‌فرض',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.subscriptions.set(sampleSubscription.id, sampleSubscription);
  }

  async findSubscriptionsByOrg(organizationId: string): Promise<WebhookSubscription[]> {
    return Array.from(this.subscriptions.values()).filter(
      (s) => s.organizationId === organizationId,
    );
  }

  async findSubscriptionById(organizationId: string, id: string): Promise<WebhookSubscription | null> {
    const sub = this.subscriptions.get(id);
    if (!sub || sub.organizationId !== organizationId) return null;
    return { ...sub };
  }

  async findActiveSubscriptionsByEvent(
    organizationId: string,
    event: string,
  ): Promise<WebhookSubscription[]> {
    return Array.from(this.subscriptions.values()).filter(
      (s) =>
        s.organizationId === organizationId &&
        s.enabled &&
        (s.events.includes(event) || s.events.includes('*')),
    );
  }

  async createSubscription(
    data: Omit<WebhookSubscription, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<WebhookSubscription> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const entity: WebhookSubscription = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.set(id, entity);
    return { ...entity };
  }

  async updateSubscription(
    organizationId: string,
    id: string,
    updates: Partial<Omit<WebhookSubscription, 'id' | 'organizationId' | 'createdAt'>>,
  ): Promise<WebhookSubscription | null> {
    const existing = await this.findSubscriptionById(organizationId, id);
    if (!existing) return null;

    const updated: WebhookSubscription = {
      ...existing,
      ...updates,
      id: existing.id,
      organizationId: existing.organizationId,
      updatedAt: new Date().toISOString(),
    };
    this.subscriptions.set(id, updated);
    return { ...updated };
  }

  async deleteSubscription(organizationId: string, id: string): Promise<boolean> {
    const sub = await this.findSubscriptionById(organizationId, id);
    if (!sub) return false;
    this.subscriptions.delete(id);
    return true;
  }

  async createDelivery(data: Omit<WebhookDelivery, 'id'>): Promise<WebhookDelivery> {
    const id = randomUUID();
    const entity: WebhookDelivery = {
      ...data,
      id,
    };
    this.deliveries.set(id, entity);
    return { ...entity };
  }

  async updateDelivery(
    organizationId: string,
    id: string,
    updates: Partial<Omit<WebhookDelivery, 'id' | 'organizationId'>>,
  ): Promise<WebhookDelivery | null> {
    const existing = await this.findDeliveryById(organizationId, id);
    if (!existing) return null;

    const updated: WebhookDelivery = {
      ...existing,
      ...updates,
      id: existing.id,
      organizationId: existing.organizationId,
    };
    this.deliveries.set(id, updated);
    return { ...updated };
  }

  async findDeliveryById(organizationId: string, id: string): Promise<WebhookDelivery | null> {
    const del = this.deliveries.get(id);
    if (!del || del.organizationId !== organizationId) return null;
    return { ...del };
  }

  async findDeliveriesByOrg(
    organizationId: string,
    options?: {
      subscriptionId?: string | undefined;
      status?: WebhookDeliveryStatus | undefined;
      limit?: number | undefined;
    } | undefined,
  ): Promise<WebhookDelivery[]> {
    const limit = options?.limit ?? 50;
    let list = Array.from(this.deliveries.values()).filter(
      (d) => d.organizationId === organizationId,
    );

    if (options?.subscriptionId) {
      list = list.filter((d) => d.subscriptionId === options.subscriptionId);
    }
    if (options?.status) {
      list = list.filter((d) => d.status === options.status);
    }

    return list
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async hasNonce(scope: string, nonce: string, now = Date.now()): Promise<boolean> {
    const key = `${scope}:${nonce}`;
    const expiresAt = this.seenNonces.get(key);
    if (expiresAt === undefined) return false;
    if (expiresAt <= now) {
      this.seenNonces.delete(key);
      return false;
    }
    return true;
  }

  async recordNonce(scope: string, nonce: string, expiresAt: number): Promise<void> {
    const key = `${scope}:${nonce}`;
    this.seenNonces.set(key, expiresAt);
  }

  async clearExpiredNonces(now = Date.now()): Promise<number> {
    let count = 0;
    for (const [key, expiresAt] of this.seenNonces.entries()) {
      if (expiresAt <= now) {
        this.seenNonces.delete(key);
        count++;
      }
    }
    return count;
  }
}
