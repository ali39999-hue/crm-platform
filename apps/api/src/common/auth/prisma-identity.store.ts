import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CreateUserWithOrganizationInput,
  IIdentityStore,
  MockUserRecord,
} from './identity-store.js';
import type { MembershipRole } from '@crm/domain';

/**
 * Durable identity store (P02 / CRM-AUTH): reads users and their organization
 * memberships from the User/Membership tables via the tenant-scoped client.
 *
 * Role mapping: the Prisma enum (OWNER/ADMIN/MANAGER/MEMBER/CUSTOMER/AUDITOR)
 * is coarser than the domain permission matrix roles; mapping below preserves
 * the semantics of each database role. Unifying the two enums is a follow-up
 * schema decision (see P02 backlog).
 */
const PRISMA_ROLE_TO_DOMAIN: Record<string, MembershipRole> = {
  OWNER: 'SystemOwner',
  ADMIN: 'OrganizationAdmin',
  MANAGER: 'Manager',
  MEMBER: 'Employee',
  CUSTOMER: 'CustomerPortalUser',
  AUDITOR: 'Auditor',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class PrismaIdentityStore implements IIdentityStore {
  constructor(private readonly prisma: PrismaService) {}

  private mapUser(u: any): MockUserRecord {
    return {
      id: u.id,
      email: u.email,
      passwordHash: u.passwordHash ?? undefined,
      displayName: u.displayName,
      memberships: (u.memberships ?? [])
        .filter((m: any) => m.active)
        .map((m: any) => ({
          organizationId: m.organizationId,
          organizationName: m.organization?.name ?? '',
          organizationSlug: m.organization?.slug ?? '',
          role: PRISMA_ROLE_TO_DOMAIN[m.role] ?? 'Employee',
          active: m.active,
        })),
    };
  }

  private async findUser(where: Record<string, any>): Promise<MockUserRecord | null> {
    const row = await (this.prisma.tenantClient as any).user.findFirst({
      where,
      include: {
        memberships: {
          include: { organization: { select: { name: true, slug: true } } },
        },
      },
    });
    return row ? this.mapUser(row) : null;
  }

  async findByIdOrEmail(key: string): Promise<MockUserRecord | null> {
    if (UUID_RE.test(key.trim())) {
      const byId = await this.findUser({ id: key.trim() });
      if (byId) return byId;
    }
    return this.findUser({ email: key.toLowerCase().trim() });
  }

  async findByEmail(email: string): Promise<MockUserRecord | null> {
    return this.findUser({ email: email.toLowerCase().trim() });
  }

  async createUserWithOrganization(
    input: CreateUserWithOrganizationInput,
  ): Promise<MockUserRecord> {
    const email = input.email.toLowerCase().trim();
    if (await this.findByEmail(email)) {
      throw new ConflictException('An account with this email already exists');
    }
    const client = this.prisma.tenantClient as any;
    const organization = await client.organization.create({
      data: { name: input.organizationName, slug: `org-${randomUUID().slice(0, 8)}` },
    });
    try {
      await client.user.create({
        data: {
          email,
          passwordHash: input.passwordHash,
          displayName: input.displayName,
          memberships: {
            create: { organizationId: organization.id, role: 'OWNER', active: true },
          },
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('An account with this email already exists');
      }
      throw err;
    }
    const user = await this.findByEmail(email);
    if (!user) throw new ConflictException('Registration could not be completed');
    return user;
  }
}
