import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IIdentityStore, MockUserRecord } from './identity-store.js';
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
}
