import { describe, expect, it, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { PrismaProjectRepository } from './prisma-project.repository.js';

describe('PrismaProjectRepository Multi-Tenant Persistence (GAP-001 slice)', () => {
  let repository: PrismaProjectRepository;
  let mockPrisma: any;
  let projectsTable: any[];
  let milestonesTable: any[];

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeEach(() => {
    projectsTable = [
      {
        id: 'prj-1',
        organizationId: orgAlpha,
        key: 'PRJ-CRM',
        name: 'پروژه آلفا',
        description: null,
        status: 'ACTIVE',
        health: 'ON_TRACK',
        ownerId: '22222222-2222-2222-2222-222222222222',
        ownerName: 'سارا',
        startDate: new Date('2026-10-01'),
        targetDate: new Date('2026-12-30'),
        associatedAccountId: null,
        associatedAccountName: null,
        createdAt: new Date('2026-10-01'),
        updatedAt: new Date('2026-10-15'),
      },
      {
        id: 'prj-beta',
        organizationId: orgBeta,
        key: 'PRJ-BETA',
        name: 'پروژه بتا',
        description: null,
        status: 'ACTIVE',
        health: 'AT_RISK',
        ownerId: null,
        ownerName: null,
        startDate: null,
        targetDate: null,
        associatedAccountId: null,
        associatedAccountName: null,
        createdAt: new Date('2026-10-01'),
        updatedAt: new Date('2026-10-01'),
      },
    ];
    milestonesTable = [
      {
        id: 'ms-1',
        organizationId: orgAlpha,
        projectId: 'prj-1',
        title: 'فاز یک',
        dueDate: new Date('2026-11-15'),
        isCompleted: false,
        createdAt: new Date('2026-10-01'),
      },
    ];

    mockPrisma = {
      project: {
        findMany: async ({ where }: any) =>
          projectsTable.filter((p) => p.organizationId === where.organizationId),
        findUnique: async ({ where }: any) => projectsTable.find((p) => p.id === where.id) ?? null,
        findFirst: async ({ where }: any) =>
          projectsTable.find(
            (p) =>
              p.organizationId === where.organizationId &&
              p.key.toLowerCase() === (where.key?.equals ?? where.key ?? '').toLowerCase(),
          ) ?? null,
        create: async ({ data }: any) => {
          const row = {
            id: randomUUID(),
            description: null,
            ownerId: null,
            ownerName: null,
            startDate: null,
            targetDate: null,
            associatedAccountId: null,
            associatedAccountName: null,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          projectsTable.push(row);
          return row;
        },
        update: async ({ where, data }: any) => {
          const row = projectsTable.find((p) => p.id === where.id);
          if (!row) throw new Error('P2025');
          Object.assign(row, data);
          return row;
        },
        delete: async ({ where }: any) => {
          const idx = projectsTable.findIndex((p) => p.id === where.id);
          if (idx === -1) throw new Error('P2025');
          projectsTable.splice(idx, 1);
        },
      },
      milestone: {
        findMany: async ({ where }: any) =>
          milestonesTable.filter(
            (m) => m.organizationId === where.organizationId && m.projectId === where.projectId,
          ),
        findFirst: async ({ where }: any) =>
          milestonesTable.find(
            (m) =>
              m.organizationId === where.organizationId &&
              m.projectId === where.projectId &&
              m.id === where.id,
          ) ?? null,
        create: async ({ data }: any) => {
          const row = { ...data, createdAt: new Date() };
          milestonesTable.push(row);
          return row;
        },
        update: async ({ where, data }: any) => {
          const row = milestonesTable.find((m) => m.id === where.id);
          if (!row) throw new Error('P2025');
          Object.assign(row, data);
          return row;
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;

    repository = new PrismaProjectRepository(mockPrisma as any);
  });

  it('finds projects strictly scoped to the organization', async () => {
    const projects = await repository.findByOrg(orgAlpha);
    expect(projects).toHaveLength(1);
    expect(projects[0]!.id).toBe('prj-1');
    expect(await repository.findByOrg(orgBeta)).toHaveLength(1);
  });

  it('returns null for a foreign-organization project id', async () => {
    expect(await repository.findById(orgBeta, 'prj-1')).toBeNull();
    expect(await repository.findById(orgAlpha, 'prj-1')).not.toBeNull();
  });

  it('finds by key case-insensitively inside the organization', async () => {
    expect((await repository.findByKey(orgAlpha, 'prj-crm'))?.id).toBe('prj-1');
    expect(await repository.findByKey(orgAlpha, 'PRJ-BETA')).toBeNull();
  });

  it('creates with mapped date fields and round-trips the entity', async () => {
    const created = await repository.create({
      organizationId: orgAlpha,
      key: 'PRJ-NEW',
      name: 'پروژه جدید',
      description: undefined,
      status: 'ACTIVE',
      health: 'ON_TRACK',
      ownerId: '22222222-2222-2222-2222-222222222222',
      ownerName: 'سارا',
      startDate: '2026-11-01T00:00:00.000Z',
      targetDate: undefined,
      associatedAccountId: undefined,
      associatedAccountName: undefined,
    });
    expect(created.id).toBeDefined();
    expect(created.startDate).toBe('2026-11-01T00:00:00.000Z');
    expect(await repository.findByKey(orgAlpha, 'PRJ-NEW')).not.toBeNull();
  });

  it('deletes only inside the organization', async () => {
    expect(await repository.delete(orgBeta, 'prj-1')).toBe(false);
    expect(await repository.delete(orgAlpha, 'prj-1')).toBe(true);
    expect(projectsTable.find((p) => p.id === 'prj-1')).toBeUndefined();
  });

  it('toggles a milestone only within org + project scope', async () => {
    expect(await repository.toggleMilestone(orgBeta, 'prj-1', 'ms-1', true)).toBeNull();
    const toggled = await repository.toggleMilestone(orgAlpha, 'prj-1', 'ms-1', true);
    expect(toggled?.isCompleted).toBe(true);
    expect(await repository.toggleMilestone(orgAlpha, 'prj-1', 'missing', true)).toBeNull();
  });
});
