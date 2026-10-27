import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaWebhookRepository } from './prisma-webhook.repository.js';

const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const orgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('PrismaWebhookRepository Persistence + Replay Nonces (GAP-001 slice 6)', () => {
  let repository: PrismaWebhookRepository;
  let mockPrisma: any;
  let subsTable: any[];
  let deliveriesTable: any[];
  let noncesTable: any[];

  beforeEach(() => {
    subsTable = [
      {
        id: 'sub-1',
        organizationId: orgA,
        url: 'https://hooks.example.com/a',
        secret: 'whsec_alpha',
        events: ['task.created', '*'],
        description: null,
        enabled: true,
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      {
        id: 'sub-beta',
        organizationId: orgB,
        url: 'https://hooks.example.com/b',
        secret: 'whsec_beta',
        events: ['task.created'],
        description: null,
        enabled: true,
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
    ];
    deliveriesTable = [];
    noncesTable = [];
    mockPrisma = {
      webhookSubscription: {
        findMany: async ({ where }: any) =>
          subsTable.filter((s) => {
            if (s.organizationId !== where.organizationId) return false;
            if (where.enabled !== undefined && s.enabled !== where.enabled) return false;
            if (where.OR) {
              const event = where.OR[0].events.has;
              if (!s.events.includes(event) && !s.events.includes('*')) return false;
            }
            return true;
          }),
        findFirst: async ({ where }: any) =>
          subsTable.find((s) => s.organizationId === where.organizationId && s.id === where.id) ?? null,
        create: async ({ data }: any) => {
          const row = { ...data, id: 'sub-new', createdAt: new Date(), updatedAt: new Date() };
          subsTable.push(row);
          return row;
        },
        update: async ({ where, data }: any) => {
          const row = subsTable.find((s) => s.id === where.id);
          if (!row) throw new Error('P2025');
          Object.keys(data).forEach((k) => {
            if (data[k] !== undefined) row[k] = data[k];
          });
          return row;
        },
        delete: async ({ where }: any) => {
          const idx = subsTable.findIndex((s) => s.id === where.id);
          if (idx === -1) throw new Error('P2025');
          subsTable.splice(idx, 1);
        },
      },
      webhookDelivery: {
        create: async ({ data }: any) => {
          const row = { ...data, id: 'del-new', timestamp: new Date(data.timestamp ?? Date.now()) };
          deliveriesTable.push(row);
          return row;
        },
        findFirst: async ({ where }: any) =>
          deliveriesTable.find((d) => d.organizationId === where.organizationId && d.id === where.id) ?? null,
        findMany: async ({ where, take }: any) =>
          deliveriesTable
            .filter((d) => {
              if (d.organizationId !== where.organizationId) return false;
              if (where.subscriptionId && d.subscriptionId !== where.subscriptionId) return false;
              if (where.status && d.status !== where.status) return false;
              return true;
            })
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, take ?? 50),
        update: async ({ where, data }: any) => {
          const row = deliveriesTable.find((d) => d.id === where.id);
          if (!row) throw new Error('P2025');
          Object.keys(data).forEach((k) => {
            if (data[k] !== undefined) row[k] = data[k];
          });
          return row;
        },
      },
      webhookNonce: {
        findUnique: async ({ where }: any) =>
          noncesTable.find((n) => n.scope === where.scope_nonce.scope && n.nonce === where.scope_nonce.nonce) ?? null,
        delete: async ({ where }: any) => {
          const idx = noncesTable.findIndex(
            (n) => n.scope === where.scope_nonce.scope && n.nonce === where.scope_nonce.nonce,
          );
          if (idx !== -1) noncesTable.splice(idx, 1);
        },
        upsert: async ({ where, create, update }: any) => {
          const row = noncesTable.find(
            (n) => n.scope === where.scope_nonce.scope && n.nonce === where.scope_nonce.nonce,
          );
          if (!row) {
            noncesTable.push({ ...create });
            return noncesTable.at(-1);
          }
          Object.assign(row, update);
          return row;
        },
        deleteMany: async ({ where }: any) => {
          const before = noncesTable.length;
          for (let i = noncesTable.length - 1; i >= 0; i--) {
            if (noncesTable[i]!.expiresAt.getTime() <= where.expiresAt.lte.getTime()) noncesTable.splice(i, 1);
          }
          return { count: before - noncesTable.length };
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;
    repository = new PrismaWebhookRepository(mockPrisma as any);
  });

  it('matches active subscriptions per org with wildcard support', async () => {
    const subs = await repository.findActiveSubscriptionsByEvent(orgA, 'lead.converted');
    expect(subs.map((s) => s.id)).toEqual(['sub-1']); // wildcard '*' matches
    const orgBSubs = await repository.findActiveSubscriptionsByEvent(orgB, 'lead.converted');
    expect(orgBSubs).toHaveLength(0); // orgB did not subscribe to this event
  });

  it('records deliveries and filters by subscription/status', async () => {
    await repository.createDelivery({
      subscriptionId: 'sub-1',
      organizationId: orgA,
      event: 'task.created',
      payload: { id: 't1' },
      attemptNumber: 1,
      maxRetries: 3,
      status: 'SUCCESS',
      statusCode: 200,
      responseBody: 'ok',
      error: null,
      durationMs: 120,
      headers: { 'content-type': 'application/json' },
      timestamp: new Date('2026-10-27T10:00:00.000Z').toISOString(),
      nextRetryAt: null,
    });
    await repository.createDelivery({
      subscriptionId: 'sub-beta',
      organizationId: orgA,
      event: 'task.created',
      payload: {},
      attemptNumber: 1,
      maxRetries: 3,
      status: 'FAILED',
      statusCode: 500,
      responseBody: null,
      error: 'boom',
      durationMs: 30,
      headers: {},
      timestamp: new Date('2026-10-27T09:00:00.000Z').toISOString(),
      nextRetryAt: new Date('2026-10-27T09:05:00.000Z').toISOString(),
    });
    expect((await repository.findDeliveriesByOrg(orgA, { status: 'FAILED' })).map((d) => d.id)).toEqual(['del-new']);
    expect(await repository.findDeliveryById(orgB, 'del-new')).toBeNull();
  });

  it('updateDelivery stays org-scoped', async () => {
    const created = await repository.createDelivery({
      subscriptionId: 'sub-1',
      organizationId: orgA,
      event: 'task.created',
      payload: {},
      attemptNumber: 1,
      maxRetries: 3,
      status: 'PENDING',
      statusCode: null,
      responseBody: null,
      error: null,
      durationMs: undefined,
      headers: {},
      timestamp: new Date().toISOString(),
      nextRetryAt: null,
    });
    const updated = await repository.updateDelivery(orgA, created.id, { status: 'SUCCESS' });
    expect(updated?.status).toBe('SUCCESS');
    expect(await repository.updateDelivery(orgB, created.id, { status: 'FAILED' })).toBeNull();
  });

  it('nonces: record → detected → expire → purge', async () => {
    const now = 1_000_000;
    await repository.recordNonce(orgA, 'nonce-1', now + 60_000);
    expect(await repository.hasNonce(orgA, 'nonce-1', now)).toBe(true);
    expect(await repository.hasNonce(orgB, 'nonce-1', now)).toBe(false); // scope includes org
    await repository.recordNonce(orgA, 'nonce-2', now + 120_000);
    // purge happens before any lazy delete reads the expired nonce
    expect(await repository.clearExpiredNonces(now + 61_000)).toBe(1);
    expect(await repository.hasNonce(orgA, 'nonce-1', now + 61_000)).toBe(false); // expired (and gone)
    expect(noncesTable).toHaveLength(1);
  });
});
