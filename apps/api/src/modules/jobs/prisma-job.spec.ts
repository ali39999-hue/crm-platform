import { describe, expect, it, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { PrismaJobRepository } from './prisma-job.repository.js';

const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const orgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function jobRow(id: string, org: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    organizationId: org,
    type: 'EMAIL_SEND',
    priority: 'NORMAL',
    payload: { to: 'a@b.c' },
    result: null,
    error: null,
    status: 'QUEUED',
    maxAttempts: 3,
    attempts: 0,
    runAt: new Date('2026-10-27T10:00:00.000Z'),
    startedAt: null,
    completedAt: null,
    createdAt: new Date('2026-10-27T09:00:00.000Z'),
    ...overrides,
  };
}

describe('PrismaJobRepository Queue Semantics (GAP-001 slice 5)', () => {
  let repository: PrismaJobRepository;
  let mockPrisma: any;
  let table: any[];

  beforeEach(() => {
    table = [];
    mockPrisma = {
      job: {
        create: async ({ data }: any) => {
          // Prisma semantics: undefined fields fall back to column defaults.
          const row = jobRow(data.id ?? randomUUID(), data.organizationId);
          for (const [k, v] of Object.entries(data)) {
            if (v !== undefined) (row as any)[k] = v;
          }
          row.createdAt = new Date();
          table.push(row);
          return row;
        },
        findUnique: async ({ where }: any) => table.find((j) => j.id === where.id) ?? null,
        findMany: async ({ where, take }: any) =>
          table.filter((j) => {
            if (where.status && !(Array.isArray(where.status) ? where.status : where.status?.in ?? [where.status]).includes(j.status)) return false;
            if (where.runAt?.lte && new Date(j.runAt) > where.runAt.lte) return false;
            if (where.organizationId && j.organizationId !== where.organizationId) return false;
            return true;
          }).slice(0, take ?? undefined),
        updateMany: async ({ where, data }: any) => {
          let count = 0;
          for (const j of table) {
            if (j.id === where.id && (Array.isArray(where.status) ? where.status : where.status?.in ?? [where.status]).includes(j.status)) {
              for (const [k, v] of Object.entries(data)) {
                if (v && typeof v === 'object' && 'increment' in (v as any)) {
                  (j as any)[k] += (v as any).increment;
                } else {
                  (j as any)[k] = v;
                }
              }
              count++;
            }
          }
          return { count };
        },
        update: async ({ where, data }: any) => {
          const row = table.find((j) => j.id === where.id);
          if (!row) {
            const e: any = new Error('Record not found');
            e.code = 'P2025';
            throw e;
          }
          Object.assign(row, data);
          return row;
        },
        delete: async ({ where }: any) => {
          const idx = table.findIndex((j) => j.id === where.id);
          if (idx === -1) throw new Error('P2025');
          table.splice(idx, 1);
        },
        deleteMany: async () => {
          const n = table.length;
          table.length = 0;
          return n;
        },
        groupBy: async ({ by, where }: any) => {
          const rows = table.filter((j) => !where?.organizationId || j.organizationId === where.organizationId);
          const counts = new Map<string, number>();
          for (const r of rows) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
          return [...counts.entries()].map(([status, c]) => ({ status, _count: { _all: c } }));
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;
    repository = new PrismaJobRepository(mockPrisma as any);
  });

  it('enqueues with defaults and claims in priority order atomically', async () => {
    await repository.enqueue({ organizationId: orgA, type: 'EMAIL_SEND' });
    await repository.enqueue({
      organizationId: orgA,
      type: 'EMAIL_SEND',
      priority: 'CRITICAL',
    });
    const claimed = await repository.claimNextRunnableJob(new Date('2026-10-27T11:00:00.000Z'));
    expect(claimed?.priority).toBe('CRITICAL');
    expect(claimed?.status).toBe('RUNNING');
    expect(claimed?.attempts).toBe(1);
    // second claim skips the running one
    const second = await repository.claimNextRunnableJob(new Date('2026-10-27T11:00:00.000Z'));
    expect(second?.priority).toBe('NORMAL');
  });

  it('does not claim jobs scheduled for the future', async () => {
    await repository.enqueue({
      organizationId: orgA,
      type: 'EMAIL_SEND',
      runAt: '2026-10-28T00:00:00.000Z',
    });
    expect(await repository.claimNextRunnableJob(new Date('2026-10-27T11:00:00.000Z'))).toBeNull();
    expect(await repository.peekNextRunnableJob(new Date('2026-10-29T00:00:00.000Z'))).not.toBeNull();
  });

  it('findById/delete honor the optional organization guard', async () => {
    const created = await repository.enqueue({ organizationId: orgA, type: 'EMAIL_SEND' });
    expect((await repository.findById(created.id, orgB)) === null).toBe(true);
    expect(await repository.delete(created.id, orgB)).toBe(false);
    expect(await repository.delete(created.id, orgA)).toBe(true);
  });

  it('aggregates stats per status', async () => {
    await repository.enqueue({ organizationId: orgA, type: 'EMAIL_SEND' });
    await repository.enqueue({ organizationId: orgB, type: 'EMAIL_SEND' });
    const stats = await repository.getStats(orgA);
    expect(stats.total).toBe(1);
    expect(stats.queued).toBe(1);
  });
});
