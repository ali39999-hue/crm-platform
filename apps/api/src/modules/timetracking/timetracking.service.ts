import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import type {
  CreateWorkLogRequest,
  UpdateWorkLogRequest,
  WorkLogDto,
  WorkLogEntityType,
  WorkLogSummaryDto,
} from '@crm/contracts';
import {
  InMemoryTimeTrackingRepository,
  type WorkLogEntity,
} from './timetracking.repository.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class TimeTrackingService {
  private readonly logger = new Logger(TimeTrackingService.name);

  constructor(
    private readonly repo: InMemoryTimeTrackingRepository,
    private readonly auditService: AuditService,
  ) {}

  async getWorkLogs(
    organizationId: string,
    filters?: {
      userId?: string | undefined;
      entityType?: WorkLogEntityType | undefined;
      entityId?: string | undefined;
      fromDate?: string | undefined;
      toDate?: string | undefined;
    },
  ): Promise<WorkLogDto[]> {
    const list = await this.repo.findByOrg(organizationId, filters);
    return list.map((l) => ({ ...l }));
  }

  async getSummary(
    organizationId: string,
    filters?: {
      userId?: string | undefined;
      fromDate?: string | undefined;
      toDate?: string | undefined;
    },
  ): Promise<WorkLogSummaryDto> {
    const logs = await this.repo.findByOrg(organizationId, filters);

    let totalMinutes = 0;
    let billableMinutes = 0;
    const dailyMap = new Map<string, number>();

    for (const log of logs) {
      totalMinutes += log.durationMinutes;
      if (log.isBillable) {
        billableMinutes += log.durationMinutes;
      }
      const day = log.loggedDate;
      dailyMap.set(day, (dailyMap.get(day) || 0) + log.durationMinutes);
    }

    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, minutes]) => ({
        date,
        minutes,
        hours: Number((minutes / 60).toFixed(1)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalMinutes,
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      billableHours: Number((billableMinutes / 60).toFixed(1)),
      entriesCount: logs.length,
      dailyBreakdown,
    };
  }

  async createWorkLog(
    organizationId: string,
    actor: { id: string; name: string },
    dto: CreateWorkLogRequest,
  ): Promise<WorkLogDto> {
    if (!dto.durationMinutes || dto.durationMinutes <= 0) {
      throw new BadRequestException('مدت زمان ثبت کارکرد باید عددی بزرگتر از صفر (به دقیقه) باشد');
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const loggedDate = dto.loggedDate || todayIso;

    const entity: Omit<WorkLogEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      organizationId,
      userId: actor.id,
      userName: actor.name,
      entityType: dto.entityType,
      entityId: dto.entityId,
      entityTitle: dto.entityTitle.trim(),
      durationMinutes: Math.round(dto.durationMinutes),
      description: dto.description.trim(),
      isBillable: dto.isBillable !== false,
      loggedDate,
    };

    const saved = await this.repo.create(entity);

    this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: 'WORKLOG_CREATED',
      entityType: 'WorkLog',
      entityId: saved.id,
      metadata: {
        entityType: saved.entityType,
        entityId: saved.entityId,
        durationMinutes: saved.durationMinutes,
      },
    });

    return { ...saved };
  }

  async updateWorkLog(
    organizationId: string,
    actor: { id: string; role: string },
    id: string,
    dto: UpdateWorkLogRequest,
  ): Promise<WorkLogDto> {
    const existing = await this.repo.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException(`WorkLog ${id} not found`);
    }

    const isAdmin =
      actor.role === 'SystemOwner' ||
      actor.role === 'OrganizationAdmin' ||
      actor.role === 'Manager';
    const isOwner = existing.userId === actor.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('فقط کاربر ثبت‌کننده یا مدیر سازمان مجاز به ویرایش این کارکرد است');
    }

    if (dto.durationMinutes !== undefined) {
      if (dto.durationMinutes <= 0) {
        throw new BadRequestException('مدت زمان کارکرد باید بیشتر از صفر باشد');
      }
      existing.durationMinutes = Math.round(dto.durationMinutes);
    }
    if (dto.description !== undefined) {
      existing.description = dto.description.trim();
    }
    if (dto.isBillable !== undefined) {
      existing.isBillable = dto.isBillable;
    }
    if (dto.loggedDate !== undefined) {
      existing.loggedDate = dto.loggedDate;
    }

    const updated = await this.repo.update(existing);

    this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: 'WORKLOG_UPDATED',
      entityType: 'WorkLog',
      entityId: updated.id,
      metadata: { durationMinutes: updated.durationMinutes },
    });

    return { ...updated };
  }

  async deleteWorkLog(
    organizationId: string,
    actor: { id: string; role: string },
    id: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.repo.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundException(`WorkLog ${id} not found`);
    }

    const isAdmin =
      actor.role === 'SystemOwner' ||
      actor.role === 'OrganizationAdmin' ||
      actor.role === 'Manager';
    const isOwner = existing.userId === actor.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('فقط کاربر ثبت‌کننده یا مدیر سازمان مجاز به حذف این کارکرد است');
    }

    await this.repo.delete(organizationId, id);

    this.auditService.record({
      organizationId,
      actorId: actor.id,
      action: 'WORKLOG_DELETED',
      entityType: 'WorkLog',
      entityId: id,
      metadata: { durationMinutes: existing.durationMinutes },
    });

    return { success: true };
  }
}
