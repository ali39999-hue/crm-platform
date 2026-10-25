import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  PERMISSION_MATRIX,
  MEMBERSHIP_ROLES,
  type MembershipRole,
} from '@crm/domain';
import { AuditService } from '../audit/audit.service.js';
import { TokenService } from '../../common/auth/token.service.js';
import type {
  OrganizationMemberDto,
  OrganizationSettingsDto,
  UpdateOrganizationSettingsRequest,
} from '@crm/contracts';
import type { InviteMemberDto } from './dto/invite-member.dto.js';

export type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  locale: string;
  branding?: {
    logoUrl?: string | undefined;
    primaryColor?: string | undefined;
  } | undefined;
  retentionPolicy?: {
    auditLogsDays: number;
    tempFilesDays: number;
  } | undefined;
  updatedAt: string;
};

export type MemberRecord = {
  id: string;
  organizationId: string;
  userId: string;
  email: string;
  displayName: string;
  role: MembershipRole;
  active: boolean;
  joinedAt: string;
};

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  private organizations: Map<string, OrganizationRecord> = new Map([
    [
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'شرکت آلفا (اصلی)',
        slug: 'alpha',
        timezone: 'Asia/Tehran',
        locale: 'fa-IR',
        branding: {
          primaryColor: '#6366f1',
        },
        retentionPolicy: {
          auditLogsDays: 90,
          tempFilesDays: 7,
        },
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ],
    [
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'سازمان بتا',
        slug: 'beta',
        timezone: 'Asia/Tehran',
        locale: 'fa-IR',
        retentionPolicy: {
          auditLogsDays: 30,
          tempFilesDays: 3,
        },
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ],
  ]);

  private members: MemberRecord[] = [
    {
      id: 'mem-001',
      organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'admin@org-alpha.com',
      displayName: 'علی مدیر',
      role: 'SystemOwner',
      active: true,
      joinedAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'mem-002',
      organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      userId: '22222222-2222-2222-2222-222222222222',
      email: 'employee@org-alpha.com',
      displayName: 'سارا احمدی',
      role: 'Employee',
      active: true,
      joinedAt: '2026-09-10T00:00:00.000Z',
    },
    {
      id: 'mem-003',
      organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      userId: '55555555-5555-5555-5555-555555555555',
      email: 'support@org-alpha.com',
      displayName: 'پویا مرادی',
      role: 'SupportAgent',
      active: true,
      joinedAt: '2026-09-15T00:00:00.000Z',
    },
    {
      id: 'mem-004',
      organizationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      userId: '33333333-3333-3333-3333-333333333333',
      email: 'customer@client.com',
      displayName: 'کاربر پورتال مشتری',
      role: 'CustomerPortalUser',
      active: true,
      joinedAt: '2026-10-01T00:00:00.000Z',
    },
  ];

  constructor(
    private readonly auditService: AuditService,
    private readonly tokenService: TokenService,
  ) {}

  /* Organization Workspace Settings */

  async getSettings(organizationId: string): Promise<OrganizationSettingsDto> {
    const org = this.organizations.get(organizationId);
    if (!org) {
      throw new NotFoundException('سازمان مورد نظر یافت نشد');
    }
    return { ...org };
  }

  async updateSettings(
    organizationId: string,
    actorId: string,
    dto: UpdateOrganizationSettingsRequest,
  ): Promise<OrganizationSettingsDto> {
    const existing = this.organizations.get(organizationId);
    if (!existing) {
      throw new NotFoundException('سازمان مورد نظر یافت نشد');
    }

    const now = new Date().toISOString();
    const updated: OrganizationRecord = {
      ...existing,
      updatedAt: now,
    };

    if (dto.name !== undefined) updated.name = dto.name.trim();
    if (dto.timezone !== undefined) updated.timezone = dto.timezone;
    if (dto.locale !== undefined) updated.locale = dto.locale;
    if (dto.branding !== undefined) {
      updated.branding = {
        logoUrl: dto.branding.logoUrl,
        primaryColor: dto.branding.primaryColor,
      };
    }
    if (dto.retentionPolicy !== undefined) {
      updated.retentionPolicy = {
        auditLogsDays: dto.retentionPolicy.auditLogsDays ?? existing.retentionPolicy?.auditLogsDays ?? 90,
        tempFilesDays: dto.retentionPolicy.tempFilesDays ?? existing.retentionPolicy?.tempFilesDays ?? 7,
      };
    }

    this.organizations.set(organizationId, updated);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'ORGANIZATION_SETTINGS_UPDATED',
      entityType: 'Organization',
      entityId: organizationId,
      metadata: { name: updated.name, timezone: updated.timezone },
    });

    return { ...updated };
  }

  /* Member Management */

  async getMembers(organizationId: string): Promise<OrganizationMemberDto[]> {
    return this.members
      .filter((m) => m.organizationId === organizationId)
      .map((m) => ({ ...m }));
  }

  async inviteMember(
    organizationId: string,
    actorId: string,
    dto: InviteMemberDto,
  ): Promise<OrganizationMemberDto> {
    const existing = this.members.find(
      (m) =>
        m.organizationId === organizationId &&
        m.email.toLowerCase() === dto.email.trim().toLowerCase(),
    );

    if (existing && existing.active) {
      throw new ConflictException('کاربری با این ایمیل در سازمان فعال است');
    }

    const now = new Date().toISOString();
    const newMember: MemberRecord = {
      id: `mem-${Date.now()}`,
      organizationId,
      userId: existing ? existing.userId : randomUUID(),
      email: dto.email.trim().toLowerCase(),
      displayName: dto.displayName.trim(),
      role: dto.role,
      active: true,
      joinedAt: now,
    };

    if (existing) {
      // Re-activate member
      const idx = this.members.findIndex((m) => m.id === existing.id);
      this.members[idx] = newMember;
    } else {
      this.members.push(newMember);
    }

    this.auditService.record({
      organizationId,
      actorId,
      action: 'MEMBER_INVITED',
      entityType: 'OrganizationMember',
      entityId: newMember.id,
      metadata: { email: newMember.email, role: newMember.role },
    });

    return { ...newMember };
  }

  async updateMemberRole(
    organizationId: string,
    actorId: string,
    memberId: string,
    newRole: MembershipRole,
  ): Promise<OrganizationMemberDto> {
    const member = this.members.find(
      (m) => m.organizationId === organizationId && m.id === memberId,
    );
    if (!member) {
      throw new NotFoundException('عضو مورد نظر در این سازمان یافت نشد');
    }

    if (!member.active) {
      throw new ForbiddenException('امکان تغییر نقش برای عضو غیرفعال یا معلق وجود ندارد');
    }

    const previousRole = member.role;
    member.role = newRole;

    this.auditService.record({
      organizationId,
      actorId,
      action: 'MEMBER_ROLE_CHANGED',
      entityType: 'OrganizationMember',
      entityId: member.id,
      metadata: { previousRole, newRole, email: member.email },
    });

    return { ...member };
  }

  async revokeMember(
    organizationId: string,
    actorId: string,
    memberId: string,
  ): Promise<{ success: boolean }> {
    const member = this.members.find(
      (m) => m.organizationId === organizationId && m.id === memberId,
    );
    if (!member) {
      throw new NotFoundException('عضو مورد نظر در این سازمان یافت نشد');
    }

    if (member.role === 'SystemOwner') {
      throw new ForbiddenException('امکان تعلیق یا لغو عضویت مالک سیستم (SystemOwner) وجود ندارد');
    }

    member.active = false;

    // Security Gate: Revoke all issued tokens & sessions for this user!
    this.tokenService.revokeAllForUser(member.userId);

    this.auditService.record({
      organizationId,
      actorId,
      action: 'MEMBER_REVOKED',
      entityType: 'OrganizationMember',
      entityId: member.id,
      metadata: { email: member.email, role: member.role },
    });

    return { success: true };
  }

  getRoleMatrix() {
    return {
      roles: MEMBERSHIP_ROLES,
      matrix: PERMISSION_MATRIX,
    };
  }
}
