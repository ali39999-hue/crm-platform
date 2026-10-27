import { describe, expect, it, beforeEach } from 'vitest';
import { PrismaDocumentRepository } from './prisma-document.repository.js';

const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const orgB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('PrismaDocumentRepository Multi-Tenant Persistence (GAP-001 slice 6)', () => {
  let repository: PrismaDocumentRepository;
  let mockPrisma: any;
  let spacesTable: any[];
  let docsTable: any[];
  let revisionsTable: any[];

  beforeEach(() => {
    spacesTable = [
      {
        id: 'space-1',
        organizationId: orgA,
        name: 'پایگاه دانش',
        slug: 'kb',
        description: null,
        icon: 'book',
        isDefault: true,
        createdAt: new Date('2026-10-01T00:00:00.000Z'),
        updatedAt: new Date('2026-10-01T00:00:00.000Z'),
      },
    ];
    docsTable = [
      {
        id: 'doc-1',
        organizationId: orgA,
        spaceId: 'space-1',
        title: 'سیاست امنیت',
        slug: 'security-policy',
        content: '# امنیت',
        visibility: 'WORKSPACE',
        isPublished: true,
        authorId: '22222222-2222-2222-2222-222222222222',
        authorName: 'سارا',
        version: 1,
        tags: ['امنیت'],
        associatedEntityType: null,
        associatedEntityId: null,
        createdAt: new Date('2026-10-10T10:00:00.000Z'),
        updatedAt: new Date('2026-10-10T10:00:00.000Z'),
      },
      {
        id: 'doc-beta',
        organizationId: orgB,
        spaceId: 'space-1',
        title: 'سند سازمان دیگر',
        slug: 'security-policy',
        content: 'x',
        visibility: 'WORKSPACE',
        isPublished: true,
        authorId: '22222222-2222-2222-2222-222222222222',
        authorName: 'بتا',
        version: 1,
        tags: [],
        associatedEntityType: null,
        associatedEntityId: null,
        createdAt: new Date('2026-10-10T10:00:00.000Z'),
        updatedAt: new Date('2026-10-10T10:00:00.000Z'),
      },
    ];
    revisionsTable = [];
    mockPrisma = {
      documentSpace: {
        create: async ({ data }: any) => {
          const row = { ...data, id: 'space-new', createdAt: new Date(), updatedAt: new Date() };
          spacesTable.push(row);
          return row;
        },
        findMany: async ({ where }: any) =>
          spacesTable.filter((s) => s.organizationId === where.organizationId),
        findFirst: async ({ where }: any) =>
          spacesTable.find((s) => s.organizationId === where.organizationId && s.id === where.id) ?? null,
      },
      document: {
        create: async ({ data }: any) => {
          const row = {
            ...data,
            id: 'doc-new',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          docsTable.push(row);
          return row;
        },
        findFirst: async ({ where }: any) =>
          docsTable.find((d) => d.organizationId === where.organizationId && d.id === where.id) ?? null,
        findMany: async ({ where }: any) =>
          docsTable.filter((d) => {
            if (d.organizationId !== where.organizationId) return false;
            if (where.spaceId && d.spaceId !== where.spaceId) return false;
            if (where.visibility && d.visibility !== where.visibility) return false;
            if (where.isPublished !== undefined && d.isPublished !== where.isPublished) return false;
            if (where.OR) {
              const q = where.OR[0].title.contains.toLowerCase();
              const matchTitle = d.title.toLowerCase().includes(q);
              const matchTags = d.tags.some((t: string) => t.toLowerCase().includes(q));
              if (!matchTitle && !matchTags) return false;
            }
            return true;
          }),
        update: async ({ where, data }: any) => {
          const row = docsTable.find((d) => d.id === where.id);
          if (!row) throw new Error('P2025');
          Object.keys(data).forEach((k) => {
            if (data[k] !== undefined) row[k] = data[k];
          });
          return row;
        },
        delete: async ({ where }: any) => {
          const idx = docsTable.findIndex((d) => d.id === where.id);
          if (idx === -1) throw new Error('P2025');
          docsTable.splice(idx, 1);
        },
      },
      documentRevision: {
        create: async ({ data }: any) => {
          const row = { ...data, id: `rev-${revisionsTable.length + 1}`, createdAt: new Date() };
          revisionsTable.push(row);
          return row;
        },
        findMany: async ({ where }: any) =>
          revisionsTable
            .filter((r) => r.documentId === where.documentId)
            .sort((a, b) => b.version - a.version),
        findFirst: async ({ where }: any) =>
          revisionsTable.find((r) => r.documentId === where.documentId && r.version === where.version) ?? null,
      },
    };
    mockPrisma.tenantClient = mockPrisma;
    repository = new PrismaDocumentRepository(mockPrisma as any);
  });

  it('document ids stay organization-scoped even with identical slugs', async () => {
    expect((await repository.findDocumentById(orgB, 'doc-1')) === null).toBe(true);
    const found = await repository.findDocumentById(orgA, 'doc-1');
    expect(found?.version).toBe(1);
  });

  it('create writes the initial v1 revision; update bumps version with a new revision', async () => {
    const created = await repository.createDocument({
      organizationId: orgA,
      spaceId: 'space-1',
      title: 'سند جدید',
      slug: 'new-doc',
      content: '# جدید',
      visibility: 'WORKSPACE',
      isPublished: false,
      authorId: '22222222-2222-2222-2222-222222222222',
      authorName: 'سارا',
      tags: [],
      associatedEntityType: undefined,
      associatedEntityId: undefined,
    });
    expect(created.version).toBe(1);
    expect(revisionsTable).toHaveLength(1);

    const updated = await repository.updateDocument(orgA, created.id, {
      content: '# نسخه دو',
      summaryChange: 'افزودن بخش دوم',
    });
    expect(updated?.version).toBe(2);
    expect(revisionsTable).toHaveLength(2);
    expect((await repository.findRevisions(created.id)).map((r) => r.version)).toEqual([2, 1]);
    expect((await repository.findRevisionByVersion(created.id, 1))?.content).toBe('# جدید');
  });

  it('updateDocument returns null for a foreign organization document', async () => {
    expect(await repository.updateDocument(orgB, 'doc-1', { title: 'hack' })).toBeNull();
  });

  it('search filters by title/tags and delete stays scoped', async () => {
    const hits = await repository.findDocuments(orgA, { search: 'امنیت' });
    expect(hits.map((d) => d.id)).toEqual(['doc-1']);
    expect(await repository.deleteDocument(orgB, 'doc-1')).toBe(false);
    expect(await repository.deleteDocument(orgA, 'doc-1')).toBe(true);
    expect(docsTable).toHaveLength(1);
  });
});
