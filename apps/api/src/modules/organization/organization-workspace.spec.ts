import { describe, expect, it, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { OrganizationWorkspaceService } from './organization-workspace.service.js';
import { NotFoundException } from '@nestjs/common';

const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const actorId = '11111111-1111-1111-1111-111111111111';

describe('OrganizationWorkspaceService — durable settings and teams (P02 step 8)', () => {
  let service: OrganizationWorkspaceService;
  let mockPrisma: any;
  let orgRow: any;
  let teamsTable: any[];
  let teamMembersTable: any[];
  let auditRecords: any[];

  beforeEach(() => {
    orgRow = {
      id: orgA,
      name: 'شرکت آلفا',
      slug: 'alpha',
      settings: { timezone: 'Asia/Tehran', locale: 'fa-IR' },
      updatedAt: new Date('2026-10-01T00:00:00.000Z'),
    };
    teamsTable = [];
    teamMembersTable = [];
    auditRecords = [];
    mockPrisma = {
      organization: {
        findUnique: async ({ where }: any) =>
          orgRow.id === where.id ? orgRow : null,
        update: async ({ where, data }: any) => {
          Object.assign(orgRow, data);
          return orgRow;
        },
      },
      team: {
        findFirst: async ({ where }: any) =>
          teamsTable.find((t) => t.organizationId === where.organizationId && t.id === where.id) ?? null,
        findMany: async ({ where }: any) =>
          teamsTable.filter((t) => t.organizationId === where.organizationId),
        create: async ({ data }: any) => {
          // Prisma expands nested `members: { create: [...] }` into TeamMember rows.
          const nested = data.members?.create ?? [];
          const row = { ...data, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() };
          delete row.members;
          teamsTable.push(row);
          for (const m of nested) teamMembersTable.push({ ...m, teamId: row.id, createdAt: new Date() });
          return row;
        },
        update: async ({ where, data }: any) => {
          const row = teamsTable.find((t) => t.id === where.id);
          if (!row) throw new Error('P2025');
          Object.keys(data).forEach((k) => {
            if (data[k] !== undefined) row[k] = data[k];
          });
          return row;
        },
        delete: async ({ where }: any) => {
          const idx = teamsTable.findIndex((t) => t.id === where.id);
          if (idx === -1) throw new Error('P2025');
          teamsTable.splice(idx, 1);
        },
      },
      teamMember: {
        findMany: async ({ where, include }: any) =>
          teamMembersTable
            .filter((m) => m.teamId === where.teamId)
            .map((m) =>
              include?.user ? { ...m, user: { displayName: 'کاربر ' + m.userId } } : { ...m },
            ),
        create: async ({ data }: any) => {
          const row = { ...data, createdAt: new Date() };
          teamMembersTable.push(row);
          return row;
        },
        createMany: async ({ data }: any) => {
          for (const d of data) teamMembersTable.push({ ...d, createdAt: new Date() });
          return { count: data.length };
        },
        deleteMany: async ({ where }: any) => {
          const before = teamMembersTable.length;
          teamMembersTable = teamMembersTable.filter(
            (m) => !(m.teamId === where.teamId && (!where.userId || m.userId === where.userId)),
          );
          return { count: before - teamMembersTable.length };
        },
        upsert: async ({ where, create }: any) => {
          const existing = teamMembersTable.find(
            (m) => m.teamId === where.teamId_userId.teamId && m.userId === where.teamId_userId.userId,
          );
          if (!existing) teamMembersTable.push({ ...create, createdAt: new Date() });
          return existing ?? {};
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;
    const audit = { record: (r: any) => auditRecords.push(r) } as any;
    service = new OrganizationWorkspaceService(mockPrisma as any, audit);
  });

  it('returns settings with defaults and persists updates', async () => {
    const before = await service.getSettings(orgA);
    expect(before.timezone).toBe('Asia/Tehran');

    const updated = await service.updateSettings(orgA, actorId, {
      timezone: 'Europe/Berlin',
      retentionPolicy: { auditLogsDays: 120, tempFilesDays: 14 },
    });
    expect(updated.timezone).toBe('Europe/Berlin');
    expect(updated.retentionPolicy?.auditLogsDays).toBe(120);
    expect(auditRecords[0]!.action).toBe('ORGANIZATION_SETTINGS_UPDATED');
  });

  it('settings 404 for an unknown organization', async () => {
    await expect(service.getSettings('missing')).rejects.toThrow(NotFoundException);
  });

  it('creates a team with slug and members; lists with counts', async () => {
    const created = await service.createTeam(orgA, actorId, {
      name: 'تیم فروش',
      memberIds: ['user-1', 'user-2'],
    });
    expect(created.slug).toBe('تیم-فروش');
    expect(created.membersCount).toBe(2);

    const lead = await service.createTeam(orgA, actorId, {
      name: 'تیم پشتیبانی',
      leadMemberId: 'user-9',
      memberIds: ['user-9'],
    });
    const teams = await service.getTeams(orgA);
    expect(teams).toHaveLength(2);
    const withLead = teams.find((t) => t.id === lead.id)!;
    expect(withLead.leadMemberName).toBeDefined();
  });

  it('update replaces the member set; add/remove are idempotent; delete cascades', async () => {
    const created = await service.createTeam(orgA, actorId, {
      name: 'تیم عملیات',
      memberIds: ['u1'],
    });
    await service.updateTeam(orgA, actorId, created.id, { memberIds: ['u2', 'u3'], name: 'تیم عملیات ۲' });
    expect(teamMembersTable.filter((m) => m.teamId === created.id)).toHaveLength(2);

    await service.addTeamMember(orgA, actorId, created.id, 'u4');
    await service.addTeamMember(orgA, actorId, created.id, 'u4'); // idempotent
    expect(teamMembersTable.filter((m) => m.teamId === created.id && m.userId === 'u4')).toHaveLength(1);

    await service.removeTeamMember(orgA, actorId, created.id, 'u2');
    const afterRemove = await service.getTeams(orgA);
    expect(afterRemove[0]!.memberIds).not.toContain('u2');

    await service.deleteTeam(orgA, actorId, created.id);
    expect(teamsTable).toHaveLength(0);
    expect(auditRecords.some((r) => r.action === 'TEAM_DELETED')).toBe(true);
  });
});
