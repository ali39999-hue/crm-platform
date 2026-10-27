import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaMentionRepository } from './prisma-mention.repository.js';

describe('PrismaMentionRepository Multi-Tenant Persistence (GAP-001 slice 4)', () => {
  let repository: PrismaMentionRepository;
  let mockPrisma: any;
  let table: any[];

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const recipient = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    table = [
      {
        id: 'men-1',
        organizationId: orgAlpha,
        sourceEntityType: 'TASK',
        sourceEntityId: 'task-1',
        sourceTitle: 'وظیفه بررسی لاگ',
        authorId: '33333333-3333-3333-3333-333333333333',
        authorName: 'علی',
        recipientId: recipient,
        recipientName: 'سارا',
        contextSnippet: 'سلام @سارا لطفا بررسی کن',
        readAt: null,
        createdAt: new Date('2026-10-26T10:00:00.000Z'),
      },
      {
        id: 'men-beta',
        organizationId: orgBeta,
        sourceEntityType: 'TASK',
        sourceEntityId: 'task-1',
        sourceTitle: 'سازمان دیگر',
        authorId: '33333333-3333-3333-3333-333333333333',
        authorName: 'کاربر بتا',
        recipientId: recipient,
        recipientName: 'سارا',
        contextSnippet: 'منشن بین‌سازمانی',
        readAt: null,
        createdAt: new Date('2026-10-26T09:00:00.000Z'),
      },
    ];

    mockPrisma = {
      mention: {
        findMany: async ({ where }: any) =>
          table
            .filter((m) => m.organizationId === where.organizationId && m.recipientId === where.recipientId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        findFirst: async ({ where }: any) =>
          table.find((m) => m.organizationId === where.organizationId && m.id === where.id) ?? null,
        create: async ({ data }: any) => {
          const row = { ...data, id: 'men-new', createdAt: new Date() };
          table.unshift(row);
          return row;
        },
        update: async ({ where, data }: any) => {
          const row = table.find((m) => m.id === where.id);
          if (!row) throw new Error('P2025');
          Object.assign(row, data);
          return row;
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;

    repository = new PrismaMentionRepository(mockPrisma as any);
  });

  it('lists inbox strictly per organization + recipient', async () => {
    const rows = await repository.findByRecipient(orgAlpha, recipient);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe('men-1');
  });

  it('findById stays inside the organization', async () => {
    expect(await repository.findById(orgBeta, 'men-1')).toBeNull();
    expect((await repository.findById(orgAlpha, 'men-1'))?.contextSnippet).toContain('بررسی');
  });

  it('creates with mapped dates and marks read inside org scope', async () => {
    const created = await repository.create({
      organizationId: orgAlpha,
      sourceEntityType: 'TASK',
      sourceEntityId: 'task-2',
      sourceTitle: 'وظیفه جدید',
      authorId: '33333333-3333-3333-3333-333333333333',
      authorName: 'علی',
      recipientId: recipient,
      recipientName: 'سارا',
      contextSnippet: 'منشن جدید',
      readAt: null,
    });
    expect(created.createdAt).toBeDefined();
    expect((await repository.markAsRead(orgBeta, created.id))).toBeNull();
    const marked = await repository.markAsRead(orgAlpha, created.id);
    expect(marked?.readAt).not.toBeNull();
  });
});
