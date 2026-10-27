import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IJobRepository } from './job.repository.js';
import { compareJobPriority } from './job.repository.js';
import type {
  EnqueueJobInput,
  JobQueryFilter,
  JobRecord,
  JobStatsDto,
} from './job.types.js';

/**
 * Note: Job is intentionally NOT in TENANT_SCOPED_MODELS — the worker claims
 * runnable jobs outside any HTTP request, and findById/delete take an
 * optional organizationId. Organization filtering stays manual. Handlers that
 * touch tenant-scoped models receive the job's organization via the worker's
 * tenant-context wrapper (job-worker.service.ts).
 */
@Injectable()
export class PrismaJobRepository implements IJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(j: any): JobRecord {
    return {
      id: j.id,
      organizationId: j.organizationId,
      type: j.type,
      priority: j.priority,
      payload: j.payload ?? {},
      result: j.result ?? null,
      error: j.error ?? null,
      status: j.status,
      maxAttempts: j.maxAttempts,
      attempts: j.attempts,
      runAt: j.runAt.toISOString(),
      startedAt: j.startedAt ? j.startedAt.toISOString() : null,
      completedAt: j.completedAt ? j.completedAt.toISOString() : null,
      createdAt: j.createdAt.toISOString(),
    } as JobRecord;
  }

  async enqueue(input: EnqueueJobInput): Promise<JobRecord> {
    const created = await (this.prisma.tenantClient as any).job.create({
      data: {
        id: input.id,
        organizationId: input.organizationId,
        type: input.type,
        priority: input.priority,
        payload: input.payload ?? {},
        maxAttempts: input.maxAttempts,
        runAt: input.runAt ? new Date(input.runAt) : undefined,
      },
    });
    return this.mapToEntity(created);
  }

  async findById(id: string, organizationId?: string): Promise<JobRecord | null> {
    const row = await (this.prisma.tenantClient as any).job.findUnique({ where: { id } });
    if (!row) return null;
    if (organizationId && row.organizationId !== organizationId) return null;
    return this.mapToEntity(row);
  }

  async findMany(filter?: JobQueryFilter): Promise<JobRecord[]> {
    const where: Record<string, any> = {};
    if (filter?.organizationId) where.organizationId = filter.organizationId;
    if (filter?.status) {
      where.status = Array.isArray(filter.status) ? { in: filter.status } : filter.status;
    }
    if (filter?.type) where.type = filter.type;
    if (filter?.priority) where.priority = filter.priority;

    const orderByField =
      filter?.orderBy === 'priority' ? ['priority', 'runAt', 'createdAt'] : ['createdAt'];
    const direction = filter?.orderDirection === 'asc' ? 'asc' : 'desc';
    const rows = await (this.prisma.tenantClient as any).job.findMany({
      where,
      orderBy: orderByField.map((f) => ({ [f]: direction })),
      take: filter?.limit ?? undefined,
      skip: filter?.offset ?? undefined,
    });
    const records = rows.map((j: any) => this.mapToEntity(j));
    if (filter?.orderBy === 'priority') {
      records.sort(compareJobPriority);
      if (direction === 'desc') records.reverse();
    }
    return records;
  }

  async getStats(organizationId?: string): Promise<JobStatsDto> {
    const where = organizationId ? { organizationId } : {};
    const grouped = await (this.prisma.tenantClient as any).job.groupBy({
      by: ['status'],
      _count: { _all: true },
      where,
    });
    const stats: JobStatsDto = {
      total: 0,
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      retrying: 0,
      cancelled: 0,
    };
    for (const g of grouped) {
      const count = g._count?._all ?? 0;
      stats.total += count;
      const key = String(g.status).toLowerCase() as keyof JobStatsDto;
      if (key in stats && key !== 'total') {
        (stats as any)[key] = count;
      }
    }
    return stats;
  }

  async claimNextRunnableJob(now?: Date): Promise<JobRecord | null> {
    const at = now ?? new Date();
    const candidates = await (this.prisma.tenantClient as any).job.findMany({
      where: {
        status: { in: ['QUEUED', 'RETRYING'] },
        runAt: { lte: at },
      },
      take: 10,
    });
    if (candidates.length === 0) return null;
    // Priority order, then runAt, then createdAt (same contract as in-memory repo).
    const ordered = candidates
      .map((j: any) => this.mapToEntity(j))
      .sort(compareJobPriority);
    const chosen = ordered[0]!;
    const claimed = await (this.prisma.tenantClient as any).job.updateMany({
      where: {
        id: chosen.id,
        status: { in: ['QUEUED', 'RETRYING'] },
      },
      data: { status: 'RUNNING', startedAt: at, attempts: { increment: 1 } },
    });
    if (claimed?.count !== 1) return null; // lost the race to another worker
    return this.findById(chosen.id);
  }

  async peekNextRunnableJob(now?: Date): Promise<JobRecord | null> {
    const at = now ?? new Date();
    const candidates = await (this.prisma.tenantClient as any).job.findMany({
      where: {
        status: { in: ['QUEUED', 'RETRYING'] },
        runAt: { lte: at },
      },
      take: 10,
    });
    if (candidates.length === 0) return null;
    const ordered = candidates.map((j: any) => this.mapToEntity(j)).sort(compareJobPriority);
    return ordered[0] ?? null;
  }

  async update(id: string, updates: Partial<JobRecord>): Promise<JobRecord | null> {
    const data: Record<string, any> = {};
    const dateFields: Record<string, boolean> = {
      runAt: true,
      startedAt: true,
      completedAt: true,
    };
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id' || value === undefined) continue;
      data[key] = dateFields[key] && value ? new Date(value as string) : value;
    }
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }
    try {
      const updated = await (this.prisma.tenantClient as any).job.update({
        where: { id },
        data,
      });
      return this.mapToEntity(updated);
    } catch (err: any) {
      if (err?.code === 'P2025') return null;
      throw err;
    }
  }

  async delete(id: string, organizationId?: string): Promise<boolean> {
    const existing = await this.findById(id, organizationId);
    if (!existing) return false;
    await (this.prisma.tenantClient as any).job.delete({ where: { id } });
    return true;
  }

  async clear(): Promise<void> {
    await (this.prisma.tenantClient as any).job.deleteMany({});
  }
}
