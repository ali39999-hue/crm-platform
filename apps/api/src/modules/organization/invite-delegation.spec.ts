import { describe, expect, it, beforeEach } from 'vitest';
import { OrganizationController } from './organization.controller.js';
import { InvitationService } from './invitation.service.js';
import { OrganizationService } from './organization.service.js';
import type { UserContext } from '../../common/auth/auth.types.js';

const actor: UserContext = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@org-alpha.com',
  displayName: 'مدیر',
  activeOrganization: {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'آلفا',
    slug: 'alpha',
    role: 'SystemOwner',
  },
  memberships: [],
};

describe('inviteMember DB-mode delegation (P02 step 5)', () => {
  let controller: OrganizationController;
  let invitationCalls: number;
  let legacyCalls: number;

  beforeEach(() => {
    invitationCalls = 0;
    legacyCalls = 0;
    const invitationService = {
      createInvitation: async () => {
        invitationCalls++;
        return {
          id: 'inv-1',
          organizationId: actor.activeOrganization.id,
          email: 'x@y.z',
          displayName: 'x',
          role: 'Sales',
          status: 'PENDING',
          expiresAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          token: 'one-time-token',
        };
      },
    } as unknown as InvitationService;
    const orgService = {
      inviteMember: async () => {
        legacyCalls++;
        return { id: 'mem-1' } as any;
      },
    } as unknown as OrganizationService;
    controller = new OrganizationController(orgService, invitationService as any);
  });

  it('delegates to InvitationService in database mode', async () => {
    process.env.USE_DATABASE = 'true';
    try {
      const res = await controller.inviteMember(actor, {
        email: 'x@y.z',
        displayName: 'x',
        role: 'Sales',
      } as any);
      expect(invitationCalls).toBe(1);
      expect(legacyCalls).toBe(0);
      expect((res as any).token).toBe('one-time-token');
    } finally {
      delete process.env.USE_DATABASE;
    }
  });

  it('keeps the legacy instant-member flow in fixture mode', async () => {
    delete process.env.USE_DATABASE;
    const res = await controller.inviteMember(actor, {
      email: 'x@y.z',
      displayName: 'x',
      role: 'Sales',
    } as any);
    expect(legacyCalls).toBe(1);
    expect(invitationCalls).toBe(0);
    expect((res as any).id).toBe('mem-1');
  });
});
