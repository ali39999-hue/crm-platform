import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaNotificationRepository } from './prisma-notification.repository.js';

describe('PrismaNotificationRepository Multi-Tenant Persistence (GAP-001 slice 3)', () => {
  let repository: PrismaNotificationRepository;
  let mockPrisma: any;
  let table: any[];

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const userAlpha = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    table = [
      {
        id: 'n-1',
        organizationId: orgAlpha,
        userId: userAlpha,
        type: 'TASK_ASSIGNED',
        title: 'تخصیص وظیفه',
        message: 'وظیفه جدید',
        payload: { taskId: 't1' },
        dedupeKey: 'task-assign-t1',
        readAt: null,
        createdAt: new Date('2026-10-26T10:00:00.000Z'),
      },
      {
        id: 'n-beta',
        organizationId: orgBeta,
        userId: userAlpha,
        type: 'TASK_ASSIGNED',
        title: 'سازمان دیگر',
        message: 'x',
        payload: {},
        dedupeKey: null,
        readAt: null,
        createdAt: new Date('2026-10-26T09:00:00.000Z'),
      },
    ];

    mockPrisma = {
      notification: {
        findMany: async ({ where, take }: any) =>
          table
            .filter((n) => n.organizationId === where.organizationId && n.userId === where.userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, take ?? 50),
        findFirst: async ({ where }: any) =>
          table.find(
            (n) =>
              (!where.id || n.id === where.id) &&
              (!where.organizationId || n.organizationId === where.organizationId) &&
              (!where.userId || n.userId === where.userId) &&
              (!where.dedupeKey || n.dedupeKey === where.dedupeKey),
          ) ?? null,
        create: async ({ data }: any) => {
          const row = { ...data, id: 'n-new', readAt: null, createdAt: new Date() };
          table.unshift(row);
          return row;
        },
        update: async ({ where, data }: any) => {
          const row = table.find((n) => n.id === where.id);
          if (!row) throw new Error('P2025');
          Object.assign(row, data);
          return row;
        },
        updateMany: async ({ where, data }: any) => {
          let count = 0;
          for (const row of table) {
            if (
              row.organizationId === where.organizationId &&
              row.userId === where.userId &&
              row.readAt === (where.readAt ?? null)
            ) {
              Object.assign(row, data);
              count++;
            }
          }
          return { count };
        },
      },
      notificationPreference: {
        findUnique: async ({ where }: any) => table.find((n) => n.id === `pref-${where.userId}`) ?? null,
        upsert: async ({ where, create, update }: any) => {
          let row = table.find((n) => n.id === `pref-${where.userId}`);
          if (!row) {
            row = { id: `pref-${where.userId}`, ...create };
            table.push(row);
          } else {
            Object.assign(row, update);
          }
          return row;
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;

    repository = new PrismaNotificationRepository(mockPrisma as any);
  });

  it('scopes reads to organization + user', async () => {
    const rows = await repository.findByUser(orgAlpha, userAlpha);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe('n-1');
    expect(await repository.findById(orgBeta, userAlpha, 'n-1')).toBeNull();
  });

  it('create with an existing dedupeKey is idempotent', async () => {
    const again = await repository.create({
      organizationId: orgAlpha,
      userId: userAlpha,
      type: 'TASK_ASSIGNED',
      title: 'تخصیص وظیفه',
      message: 'وظیفه جدید',
      payload: { taskId: 't1' },
      dedupeKey: 'task-assign-t1',
    });
    expect(again?.id).toBe('n-1');
    expect(table).toHaveLength(2);
  });

  it('markAsRead and markAllAsRead count only the same org+user', async () => {
    const marked = await repository.markAsRead(orgAlpha, userAlpha, 'n-1');
    expect(marked?.readAt).not.toBeNull();

    table.push({
      id: 'n-2',
      organizationId: orgAlpha,
      userId: userAlpha,
      type: 'TICKET_REPLIED',
      title: 'تیکت',
      message: 'پیام',
      payload: {},
      dedupeKey: null,
      readAt: null,
      createdAt: new Date(),
    });
    const count = await repository.markAllAsRead(orgAlpha, userAlpha);
    expect(count).toBe(1); // n-beta belongs to another organization
  });

  it('preferences default and upsert round-trip', async () => {
    expect(await repository.getPreferences(userAlpha)).toEqual({ inApp: true, email: true, push: false, digest: true });
    const saved = await repository.setPreferences(userAlpha, { inApp: false, email: true, push: true, digest: false });
    expect(saved).toEqual({ inApp: false, email: true, push: true, digest: false });
    expect(await repository.getPreferences(userAlpha)).toEqual(saved);
  });
});
