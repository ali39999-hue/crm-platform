import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaActivityRepository } from './prisma-activity.repository.js';

describe('PrismaActivityRepository Multi-Tenant Persistence (GAP-001 slice 3)', () => {
  let repository: PrismaActivityRepository;
  let mockPrisma: any;
  let feedTable: any[];
  let scheduledTable: any[];

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeEach(() => {
    feedTable = [
      {
        id: 'act-1',
        organizationId: orgAlpha,
        actorId: '22222222-2222-2222-2222-222222222222',
        actor: { displayName: 'سارا' },
        entityType: 'ACCOUNT',
        entityId: 'acc-1',
        kind: 'ACCOUNT_CREATED',
        summary: 'حساب ثبت شد',
        visibility: 'CUSTOMER_SHARED',
        occurredAt: new Date('2026-10-25T10:00:00.000Z'),
        metadata: { accountId: 'acc-1' },
      },
      {
        id: 'act-beta',
        organizationId: orgBeta,
        actorId: null,
        actor: null,
        entityType: 'ACCOUNT',
        entityId: 'acc-1',
        kind: 'ACCOUNT_UPDATED',
        summary: 'سازمان دیگر',
        visibility: 'INTERNAL',
        occurredAt: new Date('2026-10-25T09:00:00.000Z'),
        metadata: null,
      },
    ];
    scheduledTable = [
      {
        id: 'sa-1',
        organizationId: orgAlpha,
        type: 'MEETING',
        title: 'جلسه هفتگی',
        description: null,
        startsAt: new Date('2026-10-28T09:00:00.000Z'),
        endsAt: new Date('2026-10-28T10:00:00.000Z'),
        isAllDay: false,
        status: 'SCHEDULED',
        ownerId: '22222222-2222-2222-2222-222222222222',
        ownerName: 'سارا',
        participantIds: ['22222222-2222-2222-2222-222222222222'],
        associatedEntityType: null,
        associatedEntityId: null,
        associatedEntityTitle: null,
        visibility: 'INTERNAL',
        reminderMinutesBefore: 30,
        isPinned: false,
        createdAt: new Date('2026-10-25T00:00:00.000Z'),
        updatedAt: new Date('2026-10-25T00:00:00.000Z'),
      },
    ];

    mockPrisma = {
      activity: {
        create: async ({ data, include }: any) => {
          const row = {
            id: 'act-new',
            occurredAt: new Date(),
            actor: null,
            metadata: null,
            ...data,
          };
          if (include?.actor) row.actor = { displayName: 'سارا' };
          feedTable.unshift(row);
          return row;
        },
        findMany: async ({ where, orderBy, take }: any) => {
          let rows = feedTable.filter((a) => a.organizationId === where.organizationId);
          if (where.entityType) rows = rows.filter((a) => a.entityType === where.entityType && a.entityId === where.entityId);
          if (where.OR) {
            rows = rows.filter(
              (a) =>
                where.OR.some((cond: any) => a.entityId === cond.entityId) ||
                where.OR.some((cond: any) => a.metadata?.[cond.metadata?.path?.[0]] === cond.metadata?.equals),
            );
          }
          rows = [...rows].sort(
            (x, y) => new Date(y.occurredAt).getTime() - new Date(x.occurredAt).getTime(),
          );
          return take ? rows.slice(0, take) : rows;
        },
      },
      scheduledActivity: {
        create: async ({ data }: any) => {
          const row = {
            id: 'sa-new',
            description: null,
            ownerName: null,
            associatedEntityType: null,
            associatedEntityId: null,
            associatedEntityTitle: null,
            reminderMinutesBefore: null,
            isPinned: false,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          scheduledTable.unshift(row);
          return row;
        },
        findFirst: async ({ where }: any) =>
          scheduledTable.find((s) => s.organizationId === where.organizationId && s.id === where.id) ?? null,
        findMany: async ({ where }: any) =>
          scheduledTable.filter(
            (s) =>
              s.organizationId === where.organizationId &&
              (!where.startsAt || new Date(s.startsAt) < where.startsAt.lt) &&
              (!where.endsAt || new Date(s.endsAt) > where.endsAt.gt) &&
              (!where.OR ||
                where.OR.some(
                  (cond: any) =>
                    cond.ownerId?.in?.some((p: string) => s.participantIds.includes(p) || s.ownerId === p) ||
                    cond.participantIds?.hasSome?.some((p: string) => s.participantIds.includes(p)),
                )),
          ),
        update: async ({ where, data }: any) => {
          const row = scheduledTable.find((s) => s.id === where.id);
          if (!row) throw new Error('P2025');
          Object.keys(data).forEach((k) => {
            if (data[k] !== undefined) row[k] = data[k];
          });
          return row;
        },
        delete: async ({ where }: any) => {
          const idx = scheduledTable.findIndex((s) => s.id === where.id);
          if (idx === -1) throw new Error('P2025');
          scheduledTable.splice(idx, 1);
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;

    repository = new PrismaActivityRepository(mockPrisma as any);
  });

  it('scopes the timeline feed to the organization and maps actorName', async () => {
    const recent = await repository.findRecent(orgAlpha);
    expect(recent).toHaveLength(1);
    expect(recent[0]!.actorName).toBe('سارا');
    expect(await repository.findRecent(orgBeta)).toHaveLength(1);
  });

  it('findByAccount matches entityId or metadata.accountId', async () => {
    const rows = await repository.findByAccount(orgAlpha, 'acc-1');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe('act-1');
  });

  it('creates a feed entry with occurredAt set server-side', async () => {
    const created = await repository.create({
      organizationId: orgAlpha,
      actorId: null,
      actorName: null,
      entityType: 'DEAL',
      entityId: 'deal-9',
      kind: 'DEAL_CREATED',
      summary: 'فرصت جدید',
      visibility: 'INTERNAL',
      metadata: undefined,
    });
    expect(created.occurredAt).toBeDefined();
    expect(feedTable[0]!.entityId).toBe('deal-9');
  });

  it('detects conflicts only within org, overlapping time and shared participants', async () => {
    const conflicts = await repository.detectConflicts(
      orgAlpha,
      '2026-10-28T09:30:00.000Z',
      '2026-10-28T10:30:00.000Z',
      ['22222222-2222-2222-2222-222222222222'],
    );
    expect(conflicts.map((c) => c.id)).toContain('sa-1');

    const none = await repository.detectConflicts(
      orgAlpha,
      '2026-11-01T09:00:00.000Z',
      '2026-11-01T10:00:00.000Z',
      ['22222222-2222-2222-2222-222222222222'],
    );
    expect(none).toHaveLength(0);
  });

  it('updateScheduled and deleteScheduled stay inside the organization', async () => {
    expect(await repository.updateScheduled(orgBeta, 'sa-1', { title: 'hack' })).toBeNull();
    const updated = await repository.updateScheduled(orgAlpha, 'sa-1', { status: 'CANCELLED' });
    expect(updated?.status).toBe('CANCELLED');

    expect(await repository.deleteScheduled(orgBeta, 'sa-1')).toBe(false);
    expect(await repository.deleteScheduled(orgAlpha, 'sa-1')).toBe(true);
    expect(scheduledTable).toHaveLength(0);
  });
});
