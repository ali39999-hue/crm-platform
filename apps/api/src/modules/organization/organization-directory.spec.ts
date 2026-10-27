import { describe, expect, it, beforeEach } from 'vitest';
import { OrganizationDirectoryService } from './organization-directory.service.js';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const actorId = '11111111-1111-1111-1111-111111111111';

function memberRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    organizationId: orgA,
    userId: `user-${id}`,
    role: 'Employee',
    active: true,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    user: { email: `${id}@org.com`, displayName: 'کاربر' },
    ...overrides,
  };
}

describe('OrganizationDirectoryService — durable member directory (P02 step 6)', () => {
  let service: OrganizationDirectoryService;
  let mockPrisma: any;
  let auditRecords: any[];
  let membershipsTable: any[];

  beforeEach(() => {
    membershipsTable = [
      memberRow('mem-1'),
      memberRow('mem-owner', { role: 'SystemOwner' }),
      memberRow('mem-inactive', { active: false }),
    ];
    auditRecords = [];
    mockPrisma = {
      membership: {
        findFirst: async ({ where }: any) =>
          membershipsTable.find(
            (m) => m.organizationId === where.organizationId && m.id === where.id,
          ) ?? null,
        findMany: async ({ where }: any) =>
          membershipsTable.filter((m) => m.organizationId === where.organizationId),
        update: async ({ where, data }: any) => {
          const idx = membershipsTable.findIndex((m) => m.id === where.id);
          if (idx === -1) throw new Error('P2025');
          // Prisma returns a fresh snapshot; previously fetched objects stay stale.
          membershipsTable[idx] = { ...membershipsTable[idx]!, ...data };
          return membershipsTable[idx]!;
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;
    const audit = { record: (r: any) => auditRecords.push(r) } as any;
    service = new OrganizationDirectoryService(mockPrisma as any, audit);
  });

  it('lists members scoped to the organization', async () => {
    const members = await service.getMembers(orgA);
    expect(members).toHaveLength(3);
    expect(members[0]!.email).toBe('mem-1@org.com');
  });

  it('updates roles and writes an audit record', async () => {
    const updated = await service.updateMemberRole(orgA, actorId, 'mem-1', 'Manager');
    expect(updated.role).toBe('Manager');
    expect(auditRecords[0]!.action).toBe('MEMBER_ROLE_CHANGED');
    expect(auditRecords[0]!.metadata.previousRole).toBe('Employee');
  });

  it('guards: missing member 404, inactive member 403, SystemOwner role change 403', async () => {
    await expect(service.updateMemberRole(orgA, actorId, 'missing', 'Manager')).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      service.updateMemberRole(orgA, actorId, 'mem-inactive', 'Manager'),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.updateMemberRole(orgA, actorId, 'mem-owner', 'Employee'),
    ).rejects.toThrow(/مالک سیستم/);
  });

  it('revokes non-owner members and refuses the SystemOwner', async () => {
    const res = await service.revokeMember(orgA, actorId, 'mem-1');
    expect(res.success).toBe(true);
    expect(membershipsTable.find((m) => m.id === 'mem-1')!.active).toBe(false);
    expect(auditRecords[0]!.action).toBe('MEMBER_REVOKED');

    await expect(service.revokeMember(orgA, actorId, 'mem-owner')).rejects.toThrow(/مالک سیستم/);
  });
});
