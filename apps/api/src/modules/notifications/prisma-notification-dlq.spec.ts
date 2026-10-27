import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaNotificationDlqRepository } from './prisma-notification-dlq.repository.js';

const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const orgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function deadLetter(id: string, org: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    organizationId: org,
    userId: '22222222-2222-2222-2222-222222222222',
    channel: 'email',
    recipient: 'user@company.com',
    title: 'ارسال ناموفق',
    message: 'متن اعلان',
    payload: null,
    dedupeKey: null,
    retryCount: 3,
    maxRetries: 3,
    lastError: 'SMTP timeout',
    status: 'FAILED',
    createdAt: new Date('2026-10-26T10:00:00.000Z'),
    failedAt: new Date('2026-10-26T10:05:00.000Z'),
    resolvedAt: null,
    ...overrides,
  };
}

describe('PrismaNotificationDlqRepository Multi-Tenant Persistence (GAP-001 slice 5)', () => {
  let repository: PrismaNotificationDlqRepository;
  let mockPrisma: any;
  let table: any[];

  beforeEach(() => {
    table = [deadLetter('dlq-1', orgA), deadLetter('dlq-beta', orgB)];
    mockPrisma = {
      notificationDeadLetter: {
        findMany: async ({ where, take }: any) =>
          table
            .filter((d) => d.organizationId === where.organizationId)
            .sort((a, b) => b.failedAt.getTime() - a.failedAt.getTime())
            .slice(0, take ?? undefined),
        findFirst: async ({ where }: any) =>
          table.find((d) => d.organizationId === where.organizationId && d.id === where.id) ?? null,
        create: async ({ data }: any) => {
          const row = deadLetter('dlq-new', data.organizationId);
          for (const [k, v] of Object.entries(data)) {
            if (v !== undefined) (row as any)[k] = v;
          }
          row.createdAt = new Date();
          row.failedAt = new Date();
          table.unshift(row);
          return row;
        },
        update: async ({ where, data }: any) => {
          const row = table.find((d) => d.id === where.id);
          if (!row) throw new Error('P2025');
          Object.assign(row, data);
          return row;
        },
        delete: async ({ where }: any) => {
          const idx = table.findIndex((d) => d.id === where.id);
          if (idx === -1) throw new Error('P2025');
          table.splice(idx, 1);
        },
        deleteMany: async () => {
          const n = table.length;
          table.length = 0;
          return n;
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;
    repository = new PrismaNotificationDlqRepository(mockPrisma as any);
  });

  it('scopes the dead-letter queue per organization', async () => {
    expect((await repository.findByOrg(orgA)).map((d) => d.id)).toEqual(['dlq-1']);
    expect(await repository.findById(orgB, 'dlq-1')).toBeNull();
  });

  it('creates an entry and updates resolution inside org scope', async () => {
    const created = await repository.create({
      organizationId: orgA,
      userId: '22222222-2222-2222-2222-222222222222',
      channel: 'sms',
      recipient: '09120000000',
      title: 'پیامک ناموفق',
      message: 'متن',
      payload: undefined,
      dedupeKey: null,
      retryCount: 2,
      maxRetries: 3,
      lastError: 'gateway down',
      resolvedAt: null,
    });
    expect(created.status).toBe('FAILED');
    const resolved = await repository.update(orgA, created.id, {
      status: 'RESOLVED' as any,
      resolvedAt: new Date().toISOString(),
    });
    expect(resolved?.status).toBe('RESOLVED');
    expect(await repository.update(orgB, created.id, { status: 'RESOLVED' as any })).toBeNull();
  });

  it('deletes inside org and clears everything', async () => {
    expect(await repository.delete(orgB, 'dlq-1')).toBe(false);
    expect(await repository.delete(orgA, 'dlq-1')).toBe(true);
    expect(await repository.findByOrg(orgB)).toHaveLength(1); // other org untouched by scoped delete
    await repository.clear();
    expect(await repository.findByOrg(orgB)).toHaveLength(0); // clear() is global by contract
  });
});
