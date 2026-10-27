import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { OrganizationSettingsDto, TeamDto } from '@crm/contracts';

/**
 * Durable organization settings and teams (P02 step 8): replaces the
 * in-memory maps of OrganizationService on those routes in database mode.
 * Org settings live in Organization.settings (JSON); team members are
 * TeamMember rows keyed by user, and leadMemberId stores a user id.
 */
@Injectable()
export class OrganizationWorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private mapSettings(org: any): OrganizationSettingsDto {
    const settings = (org.settings ?? {}) as Record<string, any>;
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      timezone: settings.timezone ?? 'Asia/Tehran',
      locale: settings.locale ?? 'fa-IR',
      branding: settings.branding ?? undefined,
      retentionPolicy: settings.retentionPolicy ?? undefined,
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  async getSettings(organizationId: string): Promise<OrganizationSettingsDto> {
    const org = await (this.prisma.tenantClient as any).organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new NotFoundException('سازمان مورد نظر یافت نشد');
    return this.mapSettings(org);
  }

  async updateSettings(
    organizationId: string,
    actorId: string,
    dto: {
      name?: string | undefined;
      timezone?: string | undefined;
      locale?: string | undefined;
      branding?: { logoUrl?: string | undefined; primaryColor?: string | undefined } | undefined;
      retentionPolicy?:
        | { auditLogsDays?: number | undefined; tempFilesDays?: number | undefined }
        | undefined;
    },
  ): Promise<OrganizationSettingsDto> {
    const existing = await this.getSettings(organizationId);
    const settings: Record<string, any> = {
      timezone: dto.timezone ?? existing.timezone,
      locale: dto.locale ?? existing.locale,
      branding:
        dto.branding !== undefined
          ? { logoUrl: dto.branding.logoUrl, primaryColor: dto.branding.primaryColor }
          : existing.branding,
      retentionPolicy:
        dto.retentionPolicy !== undefined
          ? {
              auditLogsDays:
                dto.retentionPolicy.auditLogsDays ??
                existing.retentionPolicy?.auditLogsDays ??
                90,
              tempFilesDays:
                dto.retentionPolicy.tempFilesDays ?? existing.retentionPolicy?.tempFilesDays ?? 7,
            }
          : existing.retentionPolicy,
    };

    const updated = await (this.prisma.tenantClient as any).organization.update({
      where: { id: organizationId },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : existing.name,
        settings,
      },
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'ORGANIZATION_SETTINGS_UPDATED',
      entityType: 'Organization',
      entityId: organizationId,
      metadata: { name: updated.name, timezone: settings.timezone },
    });

    return this.mapSettings(updated);
  }

  private async mapTeam(t: any): Promise<TeamDto> {
    const members = await (this.prisma.tenantClient as any).teamMember.findMany({
      where: { teamId: t.id },
      include: { user: { select: { displayName: true } } },
    });
    const memberIds = members.map((m: any) => m.userId);
    const lead = t.leadMemberId
      ? members.find((m: any) => m.userId === t.leadMemberId)
      : undefined;
    return {
      id: t.id,
      organizationId: t.organizationId,
      name: t.name,
      slug: t.slug ?? '',
      description: t.description ?? undefined,
      leadMemberId: t.leadMemberId ?? undefined,
      leadMemberName: lead?.user?.displayName ?? undefined,
      memberIds,
      membersCount: memberIds.length,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  private slugify(name: string): string {
    return name.trim().toLowerCase().replace(/[\s-]+/g, '-');
  }

  private async findTeam(organizationId: string, teamId: string) {
    const team = await (this.prisma.tenantClient as any).team.findFirst({
      where: { organizationId, id: teamId },
    });
    if (!team) throw new NotFoundException(`Team ${teamId} not found`);
    return team;
  }

  async getTeams(organizationId: string): Promise<TeamDto[]> {
    const rows = await (this.prisma.tenantClient as any).team.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(rows.map((t: any) => this.mapTeam(t)));
  }

  async createTeam(
    organizationId: string,
    actorId: string,
    dto: { name: string; description?: string | undefined; leadMemberId?: string | undefined; memberIds?: string[] | undefined },
  ): Promise<TeamDto> {
    const created = await (this.prisma.tenantClient as any).team.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        slug: this.slugify(dto.name),
        description: dto.description ?? null,
        leadMemberId: dto.leadMemberId ?? null,
        members: dto.memberIds?.length
          ? { create: dto.memberIds.map((userId) => ({ userId })) }
          : undefined,
      },
    });
    this.auditService.record({
      organizationId,
      actorId,
      action: 'TEAM_CREATED',
      entityType: 'Team',
      entityId: created.id,
      metadata: { name: created.name, slug: created.slug },
    });
    return this.mapTeam(created);
  }

  async updateTeam(
    organizationId: string,
    actorId: string,
    teamId: string,
    dto: { name?: string | undefined; description?: string | undefined; leadMemberId?: string | undefined; memberIds?: string[] | undefined },
  ): Promise<TeamDto> {
    const team = await this.findTeam(organizationId, teamId);
    const updated = await (this.prisma.tenantClient as any).team.update({
      where: { id: team.id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        slug: dto.name !== undefined ? this.slugify(dto.name) : undefined,
        description: dto.description,
        leadMemberId: dto.leadMemberId,
      },
    });

    if (dto.memberIds !== undefined) {
      const client = this.prisma.tenantClient as any;
      await client.teamMember.deleteMany({ where: { teamId: team.id } });
      if (dto.memberIds.length) {
        await client.teamMember.createMany({
          data: dto.memberIds.map((userId) => ({ teamId: team.id, userId })),
        });
      }
    }

    this.auditService.record({
      organizationId,
      actorId,
      action: 'TEAM_UPDATED',
      entityType: 'Team',
      entityId: team.id,
      metadata: { name: updated.name },
    });
    return this.mapTeam(updated);
  }

  async addTeamMember(
    organizationId: string,
    actorId: string,
    teamId: string,
    userId: string,
  ): Promise<TeamDto> {
    const team = await this.findTeam(organizationId, teamId);
    await (this.prisma.tenantClient as any).teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId } },
      create: { teamId: team.id, userId },
      update: {},
    });
    this.auditService.record({
      organizationId,
      actorId,
      action: 'TEAM_MEMBER_ADDED',
      entityType: 'Team',
      entityId: team.id,
      metadata: { memberId: userId },
    });
    return this.mapTeam(team);
  }

  async removeTeamMember(
    organizationId: string,
    actorId: string,
    teamId: string,
    userId: string,
  ): Promise<TeamDto> {
    const team = await this.findTeam(organizationId, teamId);
    await (this.prisma.tenantClient as any).teamMember.deleteMany({
      where: { teamId: team.id, userId },
    });
    this.auditService.record({
      organizationId,
      actorId,
      action: 'TEAM_MEMBER_REMOVED',
      entityType: 'Team',
      entityId: team.id,
      metadata: { memberId: userId },
    });
    return this.mapTeam(team);
  }

  async deleteTeam(organizationId: string, actorId: string, teamId: string): Promise<{ success: boolean }> {
    const team = await this.findTeam(organizationId, teamId);
    await (this.prisma.tenantClient as any).team.delete({ where: { id: team.id } });
    this.auditService.record({
      organizationId,
      actorId,
      action: 'TEAM_DELETED',
      entityType: 'Team',
      entityId: teamId,
      metadata: { name: team.name },
    });
    return { success: true };
  }
}
