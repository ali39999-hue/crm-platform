import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaCustomFieldRepository } from './prisma-custom-field.repository.js';

const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const orgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('PrismaCustomFieldRepository Multi-Tenant Persistence (GAP-001 slice 5)', () => {
  let repository: PrismaCustomFieldRepository;
  let mockPrisma: any;
  let table: any[];

  beforeEach(() => {
    table = [
      {
        id: 'cf-1',
        organizationId: orgA,
        entityType: 'ACCOUNT',
        key: 'industry_code',
        label: 'کد صنعت',
        type: 'SELECT',
        options: ['ENERGY', 'RETAIL'],
        isRequired: false,
        defaultValue: null,
        order: 1,
        active: true,
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
      {
        id: 'cf-beta',
        organizationId: orgB,
        entityType: 'ACCOUNT',
        key: 'industry_code',
        label: 'سازمان دیگر',
        type: 'TEXT',
        options: [],
        isRequired: false,
        defaultValue: null,
        order: 1,
        active: true,
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
        updatedAt: new Date('2026-10-20T00:00:00.000Z'),
      },
    ];
    mockPrisma = {
      customField: {
        findMany: async ({ where }: any) =>
          table
            .filter(
              (c) =>
                c.organizationId === where.organizationId &&
                (!where.entityType || c.entityType === where.entityType),
            )
            .sort((a, b) => a.order - b.order),
        findFirst: async ({ where }: any) =>
          table.find(
            (c) =>
              c.organizationId === where.organizationId &&
              (!where.id || c.id === where.id) &&
              (!where.key || c.key === where.key) &&
              (!where.entityType || c.entityType === where.entityType),
          ) ?? null,
        create: async ({ data }: any) => {
          const row = { ...data, id: 'cf-new', createdAt: new Date(), updatedAt: new Date() };
          table.push(row);
          return row;
        },
        update: async ({ where, data }: any) => {
          const row = table.find((c) => c.id === where.id);
          if (!row) throw new Error('P2025');
          Object.assign(row, data);
          return row;
        },
        delete: async ({ where }: any) => {
          const idx = table.findIndex((c) => c.id === where.id);
          if (idx === -1) throw new Error('P2025');
          table.splice(idx, 1);
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;
    repository = new PrismaCustomFieldRepository(mockPrisma as any);
  });

  it('same key in two organizations stays isolated', async () => {
    const alpha = await repository.findByKey(orgA, 'ACCOUNT', 'industry_code');
    const beta = await repository.findByKey(orgB, 'ACCOUNT', 'industry_code');
    expect(alpha?.id).toBe('cf-1');
    expect(beta?.id).toBe('cf-beta');
  });

  it('creates and updates inside org scope', async () => {
    const created = await repository.create({
      organizationId: orgA,
      entityType: 'DEAL',
      key: 'discount_reason',
      label: 'علت تخفیف',
      type: 'TEXT',
      options: undefined,
      isRequired: true,
      defaultValue: undefined,
      order: 2,
      active: true,
    });
    expect(created.isRequired).toBe(true);
    const updated = await repository.update({ ...created, label: 'علت تخفیف ویژه', order: 3 });
    expect(updated.label).toBe('علت تخفیف ویژه');
    expect(updated.order).toBe(3);
  });

  it('delete stays inside the organization', async () => {
    expect(await repository.delete(orgB, 'cf-1')).toBe(false);
    expect(await repository.delete(orgA, 'cf-1')).toBe(true);
    expect(table).toHaveLength(1);
  });
});
