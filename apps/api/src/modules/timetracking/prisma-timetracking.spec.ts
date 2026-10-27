import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaTimeTrackingRepository } from './prisma-timetracking.repository.js';

describe('PrismaTimeTrackingRepository Multi-Tenant Persistence (GAP-001 slice)', () => {
  let repository: PrismaTimeTrackingRepository;
  let mockPrisma: any;
  let logsTable: any[];

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeEach(() => {
    logsTable = [
      {
        id: 'wl-1',
        organizationId: orgAlpha,
        userId: '22222222-2222-2222-2222-222222222222',
        userName: 'سارا',
        entityType: 'TASK',
        entityId: 'task-1',
        entityTitle: 'بررسی لاگ‌ها',
        durationMinutes: 120,
        description: 'تحلیل',
        isBillable: true,
        loggedDate: new Date('2026-10-25T00:00:00.000Z'),
        createdAt: new Date('2026-10-25T10:00:00.000Z'),
        updatedAt: new Date('2026-10-25T10:00:00.000Z'),
      },
      {
        id: 'wl-beta',
        organizationId: orgBeta,
        userId: '44444444-4444-4444-4444-444444444444',
        userName: 'کاربر بتا',
        entityType: 'PROJECT',
        entityId: 'prj-beta',
        entityTitle: 'پروژه بتا',
        durationMinutes: 30,
        description: 'هماهنگی',
        isBillable: false,
        loggedDate: new Date('2026-10-26T00:00:00.000Z'),
        createdAt: new Date('2026-10-26T10:00:00.000Z'),
        updatedAt: new Date('2026-10-26T10:00:00.000Z'),
      },
    ];

    mockPrisma = {
      workLog: {
        findMany: async ({ where }: any) =>
          logsTable.filter((l) => l.organizationId === where.organizationId),
        findUnique: async ({ where }: any) => logsTable.find((l) => l.id === where.id) ?? null,
        create: async ({ data }: any) => {
          const row = {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          logsTable.push(row);
          return row;
        },
        update: async ({ where, data }: any) => {
          const row = logsTable.find((l) => l.id === where.id);
          if (!row) throw new Error('P2025');
          Object.assign(row, data);
          return row;
        },
        delete: async ({ where }: any) => {
          const idx = logsTable.findIndex((l) => l.id === where.id);
          if (idx === -1) throw new Error('P2025');
          logsTable.splice(idx, 1);
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;

    repository = new PrismaTimeTrackingRepository(mockPrisma as any);
  });

  it('maps @db.Date columns to date-only strings', async () => {
    const log = await repository.findById(orgAlpha, 'wl-1');
    expect(log?.loggedDate).toBe('2026-10-25');
  });

  it('scopes lookups to the organization', async () => {
    expect(await repository.findById(orgBeta, 'wl-1')).toBeNull();
    expect((await repository.findByOrg(orgAlpha)).map((l) => l.id)).toEqual(['wl-1']);
  });

  it('creates and re-reads with the date-only contract', async () => {
    const created = await repository.create({
      organizationId: orgAlpha,
      userId: '22222222-2222-2222-2222-222222222222',
      userName: 'سارا',
      entityType: 'TICKET',
      entityId: 'tkt-9',
      entityTitle: 'تیکت',
      durationMinutes: 45,
      description: 'پیگیری',
      isBillable: false,
      loggedDate: '2026-10-27',
    });
    expect(created.loggedDate).toBe('2026-10-27');
    expect((logsTable.at(-1) as any).loggedDate).toEqual(new Date('2026-10-27T00:00:00.000Z'));
  });

  it('updates and deletes only inside the organization', async () => {
    const target = await repository.findById(orgAlpha, 'wl-1');
    const updated = await repository.update({ ...target!, durationMinutes: 200 });
    expect(updated.durationMinutes).toBe(200);

    expect(await repository.delete(orgBeta, 'wl-1')).toBe(false);
    expect(await repository.delete(orgAlpha, 'wl-1')).toBe(true);
    expect(logsTable).toHaveLength(1);
  });
});
