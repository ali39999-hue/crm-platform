import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { OrganizationMemberDto } from '@crm/contracts';

/**
 * Durable member directory (P02 / CRM-AUTH): reads and mutates organization
 * membership from the Membership table in database mode, replacing the
 * in-memory member list of OrganizationService. Roles are the unified domain
 * roles (see migration 20261028_membership_role_unification).
 */
@Injectable()
export class OrganizationDirectoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private mapMember(m: any): OrganizationMemberDto {
    return {
      id: m.id,
      userId: m.userId,
      email: m.user?.email ?? '',
      displayName: m.user?.displayName ?? '',
      role: m.role,
      active: m.active,
      joinedAt: m.createdAt.toISOString(),
    };
  }

  async getMembers(organizationId: string): Promise<OrganizationMemberDto[]> {
    const rows = await (this.prisma.tenantClient as any).membership.findMany({
      where: { organizationId },
      include: { user: { select: { email: true, displayName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((m: any) => this.mapMember(m));
  }

  async updateMemberRole(
    organizationId: string,
    actorId: string,
    membershipId: string,
    newRole: string,
  ): Promise<OrganizationMemberDto> {
    const membership = await (this.prisma.tenantClient as any).membership.findFirst({
      where: { organizationId, id: membershipId },
      include: { user: { select: { email: true, displayName: true } } },
    });
    if (!membership) {
      throw new NotFoundException('عضو مورد نظر در این سازمان یافت نشد');
    }
    if (!membership.active) {
      throw new ForbiddenException('امکان تغییر نقش برای عضو غیرفعال یا معلق وجود ندارد');
    }
    if (membership.role === 'SystemOwner' && newRole !== 'SystemOwner') {
      throw new ForbiddenException('امکان تغییر نقش مالک سیستم (SystemOwner) وجود ندارد');
    }

    const updated = await (this.prisma.tenantClient as any).membership.update({
      where: { id: membershipId },
      data: { role: newRole },
      include: { user: { select: { email: true, displayName: true } } },
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'MEMBER_ROLE_CHANGED',
      entityType: 'OrganizationMember',
      entityId: membershipId,
      metadata: { previousRole: membership.role, newRole, email: membership.user?.email },
    });

    return this.mapMember(updated);
  }

  async revokeMember(
    organizationId: string,
    actorId: string,
    membershipId: string,
  ): Promise<{ success: boolean }> {
    const membership = await (this.prisma.tenantClient as any).membership.findFirst({
      where: { organizationId, id: membershipId },
      include: { user: { select: { email: true } } },
    });
    if (!membership) {
      throw new NotFoundException('عضو مورد نظر در این سازمان یافت نشد');
    }
    if (membership.role === 'SystemOwner') {
      throw new ForbiddenException('امکان تعلیق یا لغو عضویت مالک سیستم (SystemOwner) وجود ندارد');
    }

    await (this.prisma.tenantClient as any).membership.update({
      where: { id: membershipId },
      data: { active: false },
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'MEMBER_REVOKED',
      entityType: 'OrganizationMember',
      entityId: membershipId,
      metadata: { email: membership.user?.email },
    });

    return { success: true };
  }
}
