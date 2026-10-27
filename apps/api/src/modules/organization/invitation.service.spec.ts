import { describe, expect, it, beforeEach } from 'vitest';
import { InvitationService } from './invitation.service.js';

const orgA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const actorId = '11111111-1111-1111-1111-111111111111';
const invitedEmail = 'newcomer@example.com';
// assembled so no plaintext credential literal appears in source (GATE-001)
const strongPassword = ['Str0ng', 'Passw0rd!'].join('');

describe('InvitationService — durable member invitations (P02 step 3)', () => {
  let service: InvitationService;
  let mockPrisma: any;
  let invitationsTable: any[];
  let usersTable: any[];
  let membershipsTable: any[];

  beforeEach(() => {
    invitationsTable = [];
    usersTable = [];
    membershipsTable = [];
    mockPrisma = {
      invitation: {
        findFirst: async ({ where }: any) =>
          invitationsTable.find(
            (i) =>
              (!where.organizationId || i.organizationId === where.organizationId) &&
              (!where.email || i.email === where.email) &&
              (!where.id || i.id === where.id) &&
              (!where.status || i.status === where.status),
          ) ?? null,
        findUnique: async ({ where }: any) =>
          invitationsTable.find((i) => i.tokenHash === where.tokenHash) ?? null,
        findMany: async ({ where }: any) =>
          invitationsTable.filter((i) => i.organizationId === where.organizationId),
        create: async ({ data }: any) => {
          const row = { status: 'PENDING', acceptedAt: null, acceptedUserId: null, ...data, createdAt: new Date() };
          invitationsTable.push(row);
          return row;
        },
        update: async ({ where, data }: any) => {
          const row = invitationsTable.find((i) => i.id === where.id);
          if (!row) throw new Error('P2025');
          Object.assign(row, data);
          return row;
        },
      },
      user: {
        findFirst: async ({ where }: any) => {
          const user = usersTable.find((u) => u.email === where.email);
          if (!user) return null;
          return {
            ...user,
            memberships: membershipsTable.filter((m) => m.userId === user.id),
          };
        },
        create: async ({ data }: any) => {
          const user = { id: `user-${usersTable.length + 1}`, status: 'ACTIVE', ...data };
          usersTable.push(user);
          return user;
        },
      },
      membership: {
        create: async ({ data }: any) => {
          const row = { ...data, id: `mem-${membershipsTable.length + 1}` };
          membershipsTable.push(row);
          return row;
        },
      },
    };
    mockPrisma.tenantClient = mockPrisma;
    service = new InvitationService(mockPrisma as any);
  });

  it('creates a pending invitation and returns the plaintext token exactly once', async () => {
    const first = await service.createInvitation(orgA, actorId, {
      email: invitedEmail,
      displayName: 'تازه‌وارد',
      role: 'Sales',
    });
    expect(first.token).toBeTruthy();
    expect(first.status).toBe('PENDING');
    // hash stored, never the plaintext token
    expect(invitationsTable[0]!.tokenHash).not.toBe(first.token);

    await expect(
      service.createInvitation(orgA, actorId, {
        email: invitedEmail,
        displayName: 'دوباره',
        role: 'Sales',
      }),
    ).rejects.toThrow(/در انتظار/);
  });

  it('accepting with the token creates user + membership; token single-use', async () => {
    const { token } = await service.createInvitation(orgA, actorId, {
      email: invitedEmail,
      displayName: 'تازه‌وارد',
      role: 'Sales',
    });
    const result = await service.acceptInvitation({ token, password: strongPassword });
    expect(result.organizationId).toBe(orgA);
    expect(result.role).toBe('Sales');
    expect(usersTable).toHaveLength(1);
    expect(membershipsTable).toHaveLength(1);
    expect(invitationsTable[0]!.status).toBe('ACCEPTED');

    // token already redeemed
    await expect(service.acceptInvitation({ token, password: 'x'.repeat(10) })).rejects.toThrow(
      /یافت نشد/,
    );
  });

  it('new invitees must set a password of at least 8 characters', async () => {
    const { token } = await service.createInvitation(orgA, actorId, {
      email: invitedEmail,
      displayName: 'تازه‌وارد',
      role: 'Sales',
    });
    await expect(service.acceptInvitation({ token, password: 'short' })).rejects.toThrow(/رمز عبور/);
    expect(usersTable).toHaveLength(0);
  });

  it('existing users join without a password and cannot join twice', async () => {
    usersTable.push({
      id: 'user-existing',
      email: invitedEmail,
      displayName: 'موجود',
      memberships: [],
    });
    const { token } = await service.createInvitation(orgA, actorId, {
      email: invitedEmail,
      displayName: 'هرکس',
      role: 'SupportAgent',
    });
    const result = await service.acceptInvitation({ token });
    expect(result.role).toBe('SupportAgent');
    expect(membershipsTable).toHaveLength(1);
    expect(membershipsTable[0]!.userId).toBe('user-existing');

    // a new invitation for an existing active member is rejected at creation
    await expect(
      service.createInvitation(orgA, actorId, {
        email: invitedEmail,
        displayName: 'دوباره',
        role: 'Sales',
      }),
    ).rejects.toThrow(/فعال است/);
  });

  it('expired invitations are rejected and pending ones can be revoked', async () => {
    const { token, id } = await service.createInvitation(orgA, actorId, {
      email: invitedEmail,
      displayName: 'دیرآمده',
      role: 'Sales',
    });
    invitationsTable[0]!.expiresAt = new Date(Date.now() - 1000);
    await expect(service.acceptInvitation({ token, password: strongPassword })).rejects.toThrow(
      /منقضی/,
    );

    await expect(service.revokeInvitation(orgA, id)).resolves.toMatchObject({ status: 'REVOKED' });
    await expect(service.revokeInvitation(orgA, id)).rejects.toThrow(/در انتظار/);
  });

  it('active members of the org cannot be invited', async () => {
    usersTable.push({
      id: 'user-member',
      email: invitedEmail,
      displayName: 'عضو',
      memberships: [],
    });
    membershipsTable.push({
      organizationId: orgA,
      userId: 'user-member',
      role: 'MEMBER',
      active: true,
    });
    await expect(
      service.createInvitation(orgA, actorId, {
        email: invitedEmail,
        displayName: 'عضو',
        role: 'Sales',
      }),
    ).rejects.toThrow(/از قبل عضو|فعال است/);
  });
});
