import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { UserContext } from './auth.types.js';
import type { MembershipRole } from '@crm/domain';

export type MockUserRecord = {
  id: string;
  email: string;
  password?: string;
  displayName: string;
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    role: MembershipRole;
    active: boolean;
  }>;
};

@Injectable()
export class AuthService {
  private users: Map<string, MockUserRecord> = new Map();

  constructor() {
    this.seedDefaultUsers();
  }

  private seedDefaultUsers() {
    const users: MockUserRecord[] = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@org-alpha.com',
        password: 'password123',
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
        password: 'password123',
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
        password: 'password123',
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
        password: 'password123',
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
        password: 'password123',
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
        password: 'password123',
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

  findUserByEmail(email: string): MockUserRecord | undefined {
    return this.users.get(email) || this.users.get(email.toLowerCase().trim());
  }

  validateCredentials(email: string, password?: string): MockUserRecord {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.password && password && user.password !== password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!password) {
      throw new UnauthorizedException('Password is required');
    }

    return user;
  }

  resolveUser(userIdOrEmail: string, preferredOrgId?: string): UserContext {
    const user = this.users.get(userIdOrEmail) || this.users.get(userIdOrEmail.toLowerCase().trim());
    if (!user) {
      throw new UnauthorizedException('User not found or session invalid');
    }

    const activeMemberships = user.memberships.filter((m) => m.active);
    if (activeMemberships.length === 0) {
      throw new UnauthorizedException('User has no active organization membership');
    }

    // Resolve active org strictly from user's valid memberships
    let activeMembership = activeMemberships[0];
    if (preferredOrgId) {
      const matched = activeMemberships.find((m) => m.organizationId === preferredOrgId);
      if (matched) {
        activeMembership = matched;
      }
    }

    if (!activeMembership) {
      throw new UnauthorizedException('Active membership could not be resolved');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      activeOrganization: {
        id: activeMembership.organizationId,
        name: activeMembership.organizationName,
        slug: activeMembership.organizationSlug,
        role: activeMembership.role,
      },
      memberships: activeMemberships.map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organizationName,
        role: m.role,
        active: m.active,
      })),
    };
  }

  getWorkspaces(userId: string, currentOrgId?: string) {
    const user = this.users.get(userId) || this.users.get(userId.toLowerCase().trim());
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user.memberships.map((m, idx) => ({
      id: m.organizationId,
      name: m.organizationName,
      slug: m.organizationSlug,
      role: m.role,
      isCurrent: currentOrgId ? m.organizationId === currentOrgId : idx === 0,
    }));
  }
}
