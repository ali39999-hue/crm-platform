import { describe, expect, it } from 'vitest';
import { InMemoryIdentityStore } from './identity-store.js';
import { PrismaIdentityStore } from './prisma-identity.store.js';

const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const adminId = '11111111-1111-1111-1111-111111111111';

describe('InMemoryIdentityStore (dev/test fixtures)', () => {
  const store = new InMemoryIdentityStore();

  it('resolves by id and by email, case-insensitively', async () => {
    expect((await store.findByIdOrEmail(adminId))?.email).toBe('admin@org-alpha.com');
    expect((await store.findByIdOrEmail('ADMIN@org-alpha.com'))?.id).toBe(adminId);
    expect(await store.findByIdOrEmail('nobody@nowhere.io')).toBeNull();
  });

  it('seeds multi-organization users with active memberships', async () => {
    const multi = await store.findByEmail('multiorg@example.com');
    expect(multi?.memberships).toHaveLength(2);
    expect(multi?.memberships.every((m) => m.active)).toBe(true);
  });

  it('seeds no fixture accounts in production', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const prodStore = new InMemoryIdentityStore();
      expect(await prodStore.findByIdOrEmail(adminId)).toBeNull();
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});

describe('PrismaIdentityStore role mapping (P02 / CRM-AUTH)', () => {
  function makeMockPrisma(rows: any[]) {
    return {
      user: {
        findFirst: async ({ where }: any) =>
          rows.find((u) => u.id === where.id || u.email === where.email) ?? null,
      },
    };
  }

  it('passes unified domain roles through unchanged', async () => {
    const mock = makeMockPrisma([
      {
        id: adminId,
        email: 'owner@org.com',
        passwordHash: 'pbkdf2hash',
        displayName: 'Owner',
        memberships: [
          {
            organizationId: orgAlpha,
            active: true,
            role: 'SystemOwner',
            organization: { name: 'شرکت الف', slug: 'alpha' },
          },
          {
            organizationId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            active: false,
            role: 'Manager',
            organization: { name: 'بتا', slug: 'beta' },
          },
        ],
      },
    ]);
    (mock as any).tenantClient = mock;
    const store = new PrismaIdentityStore(mock as any);

    const user = await store.findByIdOrEmail(adminId);
    expect(user?.passwordHash).toBe('pbkdf2hash');
    expect(user?.memberships[0]!.role).toBe('SystemOwner');
    expect(user?.memberships[0]!.organizationSlug).toBe('alpha');
    // inactive membership is filtered out at the store level
    expect(user?.memberships).toHaveLength(1);
  });

  it('maps legacy coarse roles defensively and resolves by email', async () => {
    const mock = makeMockPrisma([
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'weird@org.com',
        passwordHash: null,
        displayName: 'Weird',
        memberships: [
          { organizationId: orgAlpha, active: true, role: 'SOMETHING_NEW', organization: { name: 'الف', slug: 'alpha' } },
        ],
      },
    ]);
    (mock as any).tenantClient = mock;
    const store = new PrismaIdentityStore(mock as any);

    const user = await store.findByEmail('weird@org.com');
    // Unknown roles pass through as-is: the permission matrix then denies
    // every action for them (fail-closed) instead of silently granting the
    // Employee baseline.
    expect(user?.memberships[0]!.role).toBe('SOMETHING_NEW');
    expect(user?.passwordHash).toBeUndefined();
  });
});
