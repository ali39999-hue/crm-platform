import { Injectable } from '@nestjs/common';
import type { MembershipRole } from '@crm/domain';
import { DEV_FIXTURE_CREDENTIAL } from './auth.service.js';

/**
 * Identity storage abstraction (P02 / CRM-AUTH): the first step away from the
 * in-memory mock user list. The in-memory implementation keeps serving dev and
 * unit tests; the Prisma implementation reads the real User/Membership tables
 * when USE_DATABASE=true. Real identity provisioning (signup, invitations)
 * remains a P02 deliverable — in database mode users must exist in the User
 * table with a passwordHash.
 */
export type MockUserRecord = {
  id: string;
  email: string;
  password?: string;
  passwordHash?: string;
  displayName: string;
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    role: MembershipRole;
    active: boolean;
  }>;
};

export interface IIdentityStore {
  findByIdOrEmail(key: string): Promise<MockUserRecord | null>;
  findByEmail(email: string): Promise<MockUserRecord | null>;
}

@Injectable()
export class InMemoryIdentityStore implements IIdentityStore {
  private readonly users: Map<string, MockUserRecord> = new Map();

  constructor() {
    this.seedDefaultUsers();
  }

  private seedDefaultUsers() {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      // Mock seed accounts are strictly disabled in production.
      return;
    }
    const users: MockUserRecord[] = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@org-alpha.com',
        password: DEV_FIXTURE_CREDENTIAL,
        displayName: 'مدیر سیستم',
        memberships: [
          {
            organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            organizationName: 'شرکت آلفا',
            organizationSlug: 'alpha',
            role: 'SystemOwner',
            active: true,
          },
        ],
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'employee@org-alpha.com',
        password: DEV_FIXTURE_CREDENTIAL,
        displayName: 'کارمند عملیات',
        memberships: [
          {
            organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            organizationName: 'شرکت آلفا',
            organizationSlug: 'alpha',
            role: 'Employee',
            active: true,
          },
        ],
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'customer@client.com',
        password: DEV_FIXTURE_CREDENTIAL,
        displayName: 'کاربر پورتال مشتری',
        memberships: [
          {
            organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            organizationName: 'شرکت آلفا',
            organizationSlug: 'alpha',
            role: 'CustomerPortalUser',
            active: true,
          },
        ],
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'other-org@beta.com',
        password: DEV_FIXTURE_CREDENTIAL,
        displayName: 'کارمند سازمان بتا',
        memberships: [
          {
            organizationId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            organizationName: 'سازمان بتا',
            organizationSlug: 'beta',
            role: 'Employee',
            active: true,
          },
        ],
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'support@org-alpha.com',
        password: DEV_FIXTURE_CREDENTIAL,
        displayName: 'کارشناس پشتیبانی',
        memberships: [
          {
            organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            organizationName: 'شرکت آلفا',
            organizationSlug: 'alpha',
            role: 'SupportAgent',
            active: true,
          },
        ],
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        email: 'multiorg@example.com',
        password: DEV_FIXTURE_CREDENTIAL,
        displayName: 'کاربر چندسازمانی',
        memberships: [
          {
            organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            organizationName: 'شرکت آلفا',
            organizationSlug: 'alpha',
            role: 'Employee',
            active: true,
          },
          {
            organizationId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            organizationName: 'سازمان بتا',
            organizationSlug: 'beta',
            role: 'Employee',
            active: true,
          },
        ],
      },
    ];

    for (const u of users) {
      this.users.set(u.id, u);
      this.users.set(u.email, u);
      this.users.set(u.email.toLowerCase(), u);
    }
  }

  async findByIdOrEmail(key: string): Promise<MockUserRecord | null> {
    return (
      this.users.get(key) ??
      this.users.get(key.toLowerCase().trim()) ??
      null
    );
  }

  async findByEmail(email: string): Promise<MockUserRecord | null> {
    return this.findByIdOrEmail(email);
  }
}
