import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { hashPassword } from '../../common/auth/auth.service.js';
import type { MembershipRole } from '@crm/domain';

/**
 * Durable member invitations (P02 / CRM-AUTH).
 *
 * Unlike the legacy OrganizationService.inviteMember (which grants instant
 * active membership with a fabricated user id and no consent step), an
 * invitation here is a PENDING grant that the invitee must redeem with the
 * one-time token before any Membership row is created.
 *
 * The Invitation table is intentionally NOT in TENANT_SCOPED_MODELS: the
 * public accept endpoint runs outside an authenticated tenant context and the
 * one-time token is the credential. Organization filtering is manual.
 */
export type InvitationDto = {
  id: string;
  organizationId: string;
  email: string;
  displayName: string;
  role: MembershipRole;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
};

const INVITATION_TTL_DAYS = 7;

@Injectable()
export class InvitationService {
  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private mapInvitation(i: any): InvitationDto {
    return {
      id: i.id,
      organizationId: i.organizationId,
      email: i.email,
      displayName: i.displayName,
      role: i.role as MembershipRole,
      status: i.status,
      expiresAt: i.expiresAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
    };
  }

  async createInvitation(
    organizationId: string,
    actorId: string,
    dto: { email: string; displayName: string; role: MembershipRole },
  ): Promise<InvitationDto & { token: string }> {
    const email = dto.email.toLowerCase().trim();
    const client = this.prisma.tenantClient as any;

    const pending = await client.invitation.findFirst({
      where: { organizationId, email, status: 'PENDING' },
    });
    if (pending) {
      throw new ConflictException('یک دعوت‌نامه در انتظار برای این ایمیل وجود دارد');
    }

    // Reject if the email already holds an active membership in this org.
    const existingUser = await client.user.findFirst({
      where: { email },
      include: { memberships: true },
    });
    if (existingUser?.memberships?.some((m: any) => m.organizationId === organizationId && m.active)) {
      throw new ConflictException('کاربری با این ایمیل در سازمان فعال است');
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
    const created = await client.invitation.create({
      data: {
        organizationId,
        email,
        displayName: dto.displayName.trim(),
        role: dto.role,
        tokenHash: this.hashToken(token),
        invitedBy: actorId,
        expiresAt,
      },
    });
    // The plaintext token is returned exactly once and never stored.
    return { ...this.mapInvitation(created), token };
  }

  async listInvitations(organizationId: string): Promise<InvitationDto[]> {
    const rows = await (this.prisma.tenantClient as any).invitation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((i: any) => this.mapInvitation(i));
  }

  async revokeInvitation(organizationId: string, invitationId: string): Promise<InvitationDto> {
    const invitation = await (this.prisma.tenantClient as any).invitation.findFirst({
      where: { organizationId, id: invitationId },
    });
    if (!invitation) {
      throw new NotFoundException('دعوت‌نامه یافت نشد');
    }
    if (invitation.status !== 'PENDING') {
      throw new ForbiddenException('فقط دعوت‌نامه‌های در انتظار قابل لغو هستند');
    }
    const updated = await (this.prisma.tenantClient as any).invitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });
    return this.mapInvitation(updated);
  }

  /**
   * Redeems a one-time token. New users must set a password (hashed with the
   * shared PBKDF2 helper); existing users join with their current identity.
   */
  async acceptInvitation(input: {
    token: string;
    password?: string | undefined;
    displayName?: string | undefined;
  }): Promise<{ organizationId: string; organizationName: string; role: MembershipRole; email: string }> {
    const client = this.prisma.tenantClient as any;
    const tokenHash = this.hashToken(input.token);
    const invitation = await client.invitation.findUnique({ where: { tokenHash } });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new NotFoundException('دعوت‌نامه معتبر یافت نشد');
    }
    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new ForbiddenException('دعوت‌نامه منقضی شده است');
    }

    const email = invitation.email;
    let user = await client.user.findFirst({ where: { email }, include: { memberships: true } });

    if (!user) {
      if (!input.password || input.password.length < 8) {
        throw new ForbiddenException('برای پذیرش دعوت‌نامه، رمز عبور با حداقل ۸ کاراکتر لازم است');
      }
      user = await client.user.create({
        data: {
          email,
          displayName: input.displayName?.trim() || invitation.displayName,
          passwordHash: hashPassword(input.password),
        },
        include: { memberships: true },
      });
    } else if (user.memberships?.some((m: any) => m.organizationId === invitation.organizationId && m.active)) {
      throw new ConflictException('کاربر از قبل عضو این سازمان است');
    }

    await client.membership.create({
      data: {
        organizationId: invitation.organizationId,
        userId: user.id,
        role: invitation.role,
        active: true,
      },
    });
    await client.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date(), acceptedUserId: user.id },
    });

    return {
      organizationId: invitation.organizationId,
      organizationName: invitation.organization?.name ?? '',
      role: invitation.role,
      email,
    };
  }
}
