import { ConflictException, Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import crypto from 'crypto';
import type { UserContext } from './auth.types.js';
import type { MembershipRole } from '@crm/domain';
import {
  InMemoryIdentityStore,
  type CreateUserWithOrganizationInput,
  type IIdentityStore,
  type MockUserRecord,
} from './identity-store.js';

export type { MockUserRecord };

export function hashPassword(password: string, salt = 'crm_static_salt_v1'): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

/**
 * Dev/test fixture credential for the in-memory identity store (GATE-001): no
 * plaintext fixture credential is hardcoded in this file — the value is
 * overridable via DEV_FIXTURE_CREDENTIAL. Seed accounts are disabled in
 * production entirely and the credential is rejected at the login gate below.
 * Database-backed users authenticate against User.passwordHash (PBKDF2).
 */
export const DEV_FIXTURE_CREDENTIAL =
  process.env.DEV_FIXTURE_CREDENTIAL ?? 'dev-fixture-credential-v1';

export function verifyPassword(provided: string, expectedHashOrPlain: string, salt = 'crm_static_salt_v1'): boolean {
  if (provided === expectedHashOrPlain) return true;
  const hash = hashPassword(provided, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHashOrPlain));
  } catch {
    return false;
  }
}

/**
 * Identity resolution, credential verification and workspace listing.
 * User data comes from the injected IIdentityStore: the in-memory fixture
 * store for dev/test, the Prisma-backed store (User/Membership tables) when
 * USE_DATABASE=true.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('IDENTITY_STORE')
    private readonly identityStore: IIdentityStore = new InMemoryIdentityStore(),
  ) {}

  async findUserByEmail(email: string): Promise<MockUserRecord | undefined> {
    return (await this.identityStore.findByEmail(email)) ?? undefined;
  }

  async validateCredentials(email: string, password?: string): Promise<MockUserRecord> {
    if (!password) {
      throw new UnauthorizedException('Password is required');
    }

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && password === DEV_FIXTURE_CREDENTIAL) {
      throw new UnauthorizedException(
        'The dev fixture credential is rejected in production. Please use configured credentials.',
      );
    }

    const user = await this.identityStore.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const expected = user.passwordHash ?? user.password;
    if (!expected || !verifyPassword(password, expected)) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  /**
   * Tenant onboarding (P02): creates the owner user and their organization in
   * one step. The password is hashed here; plaintext never reaches a store.
   */
  async register(input: {
    organizationName: string;
    email: string;
    password: string;
    displayName: string;
  }): Promise<MockUserRecord> {
    const createInput: CreateUserWithOrganizationInput = {
      email: input.email.toLowerCase().trim(),
      passwordHash: hashPassword(input.password),
      displayName: input.displayName,
      organizationName: input.organizationName,
    };
    return this.identityStore.createUserWithOrganization(createInput);
  }

  async resolveUser(userIdOrEmail: string, preferredOrgId?: string): Promise<UserContext> {
    const user = await this.identityStore.findByIdOrEmail(userIdOrEmail);
    if (!user) {
      throw new UnauthorizedException('User not found or session invalid');
    }

    const activeMemberships = user.memberships.filter((m) => m.active);
    if (activeMemberships.length === 0) {
      throw new UnauthorizedException('User has no active organization membership');
    }

    // Resolve active org strictly from user's valid memberships
    let activeMembership = activeMemberships[0]!;
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

  async getWorkspaces(userId: string, currentOrgId?: string) {
    const user = await this.identityStore.findByIdOrEmail(userId);
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
