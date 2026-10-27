import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaAutomationRepository } from './prisma-automation.repository.js';

const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const orgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('PrismaAutomationRepository Multi-Tenant Persistence (GAP-001 slice 5)', () => {
  let repository: PrismaAutomationRepository;
  let mockPrisma: any;
  let rulesTable: any[];
  let runsTable: any[];

  beforeEach(() => {
    rulesTable = [
      {
        id: 'rule-1',
        organizationId: orgA,
        name: 'تخصیص خودکار لید',
        trigger: 'LEAD_CREATED',
        conditionField: 'source',
        conditionValue: 'WEB_FORM',
        actionType: 'ASSIGN_OWNER',
        actionPayload: { ownerId: '22222222-2222-2222-2222-222222222222' },
        enabled: true,
        executionCount: 5,
        lastExecutedAt: new Date('2026-10-26T10:00:00.000Z'),
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-26T10:00:00.000Z'),
      },
      {
        id: 'rule-disabled',
        organizationId: orgA,
        name: 'غیرفعال',
        trigger: 'LEAD_CREATED',
        conditionField: null,
        conditionValue: null,
        actionType: 'SEND_NOTIFICATION',
        actionPayload: {},
        enabled: false,
        executionCount: 0,
        lastExecutedAt: null,
        createdAt: new Date('2026-10-21T00:00:00.000Z'),
        updatedAt: new Date('2026-10-21T00:00:00.000Z'),
      },
      {
        id: 'rule-beta',
        organizationId: orgB,
        name: 'قانون سازمان دیگر',
        trigger: 'LEAD_CREATED',
        conditionField: null,
        conditionValue: null,
        actionType: 'ASSIGN_OWNER',
        actionPayload: {},
        enabled: true,
        executionCount: 1,
        lastExecutedAt: null,
        createdAt: new Date('2026-10-22T00:00:00.000Z'),
        updatedAt: new Date('2026-10-22T00:00:00.000Z'),
      },
    ];
    runsTable = [];
    mockPrisma = {
      automationRule: {
        findMany: async ({ where, orderBy }: any) =>
          rulesTable
            .filter(
              (r) =>
                r.organizationId === where.organizationId &&
                (!where.trigger || r.trigger === where.trigger) &&
                (where.enabled === undefined || r.enabled === where.enabled),
            )
            .sort((a, b) =>
              orderBy?.[0]?.createdAt === 'asc'
                ? a.createdAt.getTime() - b.createdAt.getTime()
                : b.createdAt.getTime() - a.createdAt.getTime(),
            ),
        findFirst: async ({ where }: any) =>
          rulesTable.find((r) => r.organizationId === where.organizationId && r.id === where.id) ?? null,
        create: async ({ data }: any) => {
          const row = {
            ...data,
            id: 'rule-new',
            executionCount: 0,
            lastExecutedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          rulesTable.unshift(row);
          return row;
        },
        update: async ({ where, data }: any) => {
          const row = rulesTable.find((r) => r.id === where.id);
          if (!row) throw new Error('P2025');
          Object.assign(row, data);
          return row;
        },
        delete: async ({ where }: any) => {
          const idx = rulesTable.findIndex((r) => r.id === where.id);
          if (idx === -1) throw new Error('P2025');
          rulesTable.splice(idx, 1);
        },
      },
      automationRun: {
        create: async ({ data }: any) => {
          const row = { ...data, id: 'run-new', executedAt: new Date() };
          runsTable.push(row);
          return row;
        },
        findMany: async ({ where, take }: any) =>
          runsTable
            .filter((x) => x.organizationId === where.organizationId)
            .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
            .slice(0, take ?? undefined),
      },
    };
    mockPrisma.tenantClient = mockPrisma;
    repository = new PrismaAutomationRepository(mockPrisma as any);
  });

  it('findMatchingRules returns only enabled rules of the same org + trigger', async () => {
    const matching = await repository.findMatchingRules(orgA, 'LEAD_CREATED');
    expect(matching.map((r) => r.id)).toEqual(['rule-1']);
    expect(await repository.findMatchingRules(orgB, 'LEAD_CREATED')).toHaveLength(1);
  });

  it('create starts with zero executions and update tracks them', async () => {
    const created = await repository.create({
      organizationId: orgA,
      name: 'قانون جدید',
      trigger: 'LEAD_CONVERTED',
      conditionField: null,
      conditionValue: null,
      actionType: 'SEND_NOTIFICATION',
      actionPayload: { channel: 'inApp' },
      enabled: true,
    });
    expect(created.executionCount).toBe(0);
    const updated = await repository.update({
      ...created,
      executionCount: 1,
      lastExecutedAt: new Date().toISOString(),
    });
    expect(updated.executionCount).toBe(1);
  });

  it('delete and run history stay inside the organization', async () => {
    expect(await repository.delete(orgB, 'rule-1')).toBe(false);
    expect(await repository.delete(orgA, 'rule-1')).toBe(true);
    await repository.createRun({
      organizationId: orgA,
      ruleId: 'rule-disabled',
      ruleName: 'غیرفعال',
      trigger: 'LEAD_CREATED',
      status: 'SKIPPED',
      executedAction: 'SEND_NOTIFICATION',
      actionDetails: '-',
      payloadSummary: '-',
      durationMs: 12,
    });
    expect((await repository.findRuns(orgA, 10))).toHaveLength(1);
  });
});
