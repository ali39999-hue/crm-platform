import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  EnqueueJobInput,
  JOB_PRIORITY_WEIGHT,
  JobPriority,
  JobQueryFilter,
  JobRecord,
  JobStatsDto,
} from './job.types.js';

export interface IJobRepository {
  enqueue(input: EnqueueJobInput): Promise<JobRecord>;
  findById(id: string, organizationId?: string): Promise<JobRecord | null>;
  findMany(filter?: JobQueryFilter): Promise<JobRecord[]>;
  getStats(organizationId?: string): Promise<JobStatsDto>;
  claimNextRunnableJob(now?: Date): Promise<JobRecord | null>;
  peekNextRunnableJob(now?: Date): Promise<JobRecord | null>;
  update(id: string, updates: Partial<JobRecord>): Promise<JobRecord | null>;
  delete(id: string, organizationId?: string): Promise<boolean>;
  clear(): void;
}

export function compareJobPriority(a: JobRecord, b: JobRecord): number {
  const priorityDiff = JOB_PRIORITY_WEIGHT[b.priority] - JOB_PRIORITY_WEIGHT[a.priority];
  if (priorityDiff !== 0) {
    return priorityDiff;
  }
  const runAtA = new Date(a.runAt).getTime();
  const runAtB = new Date(b.runAt).getTime();
  if (runAtA !== runAtB) {
    return runAtA - runAtB;
  }
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

@Injectable()
export class InMemoryJobRepository implements IJobRepository {
  private jobs: Map<string, JobRecord> = new Map();

  clear(): void {
    this.jobs.clear();
  }

  async enqueue(input: EnqueueJobInput): Promise<JobRecord> {
    const id = input.id ?? randomUUID();
    const now = new Date().toISOString();
    const record: JobRecord = {
      id,
      organizationId: input.organizationId,
      type: input.type,
      priority: input.priority ?? 'NORMAL',
      payload: input.payload ?? {},
      result: null,
      error: null,
      status: 'QUEUED',
      maxAttempts: input.maxAttempts !== undefined && input.maxAttempts > 0 ? input.maxAttempts : 3,
      attempts: 0,
      runAt: input.runAt ?? now,
      startedAt: null,
      completedAt: null,
      createdAt: now,
    };

    this.jobs.set(id, { ...record });
    return { ...record };
  }

  async findById(id: string, organizationId?: string): Promise<JobRecord | null> {
    const job = this.jobs.get(id);
    if (!job) {
      return null;
    }
    if (organizationId && job.organizationId !== organizationId) {
      return null;
    }
    return { ...job };
  }

  async findMany(filter: JobQueryFilter = {}): Promise<JobRecord[]> {
    let list = Array.from(this.jobs.values());

    if (filter.organizationId !== undefined) {
      list = list.filter((j) => j.organizationId === filter.organizationId);
    }
    if (filter.status !== undefined) {
      if (Array.isArray(filter.status)) {
        list = list.filter((j) => (filter.status as string[]).includes(j.status));
      } else {
        list = list.filter((j) => j.status === filter.status);
      }
    }
    if (filter.type !== undefined) {
      list = list.filter((j) => j.type === filter.type);
    }
    if (filter.priority !== undefined) {
      list = list.filter((j) => j.priority === filter.priority);
    }

    if (filter.orderBy === 'createdAt') {
      const direction = filter.orderDirection === 'asc' ? 1 : -1;
      list.sort((a, b) => (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction);
    } else {
      list.sort(compareJobPriority);
    }

    const offset = filter.offset ?? 0;
    if (offset > 0) {
      list = list.slice(offset);
    }
    if (filter.limit !== undefined && filter.limit >= 0) {
      list = list.slice(0, filter.limit);
    }

    return list.map((j) => ({ ...j }));
  }

  async getStats(organizationId?: string): Promise<JobStatsDto> {
    let list = Array.from(this.jobs.values());
    if (organizationId) {
      list = list.filter((j) => j.organizationId === organizationId);
    }

    const stats: JobStatsDto = {
      total: list.length,
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      retrying: 0,
      cancelled: 0,
    };

    for (const job of list) {
      switch (job.status) {
        case 'QUEUED':
          stats.queued++;
          break;
        case 'RUNNING':
          stats.running++;
          break;
        case 'COMPLETED':
          stats.completed++;
          break;
        case 'FAILED':
          stats.failed++;
          break;
        case 'RETRYING':
          stats.retrying++;
          break;
        case 'CANCELLED':
          stats.cancelled++;
          break;
      }
    }

    return stats;
  }

  async claimNextRunnableJob(now: Date = new Date()): Promise<JobRecord | null> {
    const nowTime = now.getTime();
    const candidates: JobRecord[] = [];

    for (const job of this.jobs.values()) {
      if ((job.status === 'QUEUED' || job.status === 'RETRYING') && new Date(job.runAt).getTime() <= nowTime) {
        candidates.push(job);
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort(compareJobPriority);
    const selected = candidates[0];
    if (!selected) {
      return null;
    }

    const updated: JobRecord = {
      id: selected.id,
      organizationId: selected.organizationId,
      type: selected.type,
      priority: selected.priority,
      payload: selected.payload,
      result: selected.result,
      error: selected.error,
      status: 'RUNNING',
      maxAttempts: selected.maxAttempts,
      attempts: selected.attempts + 1,
      runAt: selected.runAt,
      startedAt: now.toISOString(),
      completedAt: selected.completedAt,
      createdAt: selected.createdAt,
    };

    this.jobs.set(selected.id, updated);
    return { ...updated };
  }

  async peekNextRunnableJob(now: Date = new Date()): Promise<JobRecord | null> {
    const nowTime = now.getTime();
    const candidates: JobRecord[] = [];

    for (const job of this.jobs.values()) {
      if ((job.status === 'QUEUED' || job.status === 'RETRYING') && new Date(job.runAt).getTime() <= nowTime) {
        candidates.push(job);
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort(compareJobPriority);
    const top = candidates[0];
    return top ? { ...top } : null;
  }

  async update(id: string, updates: Partial<JobRecord>): Promise<JobRecord | null> {
    const existing = this.jobs.get(id);
    if (!existing) {
      return null;
    }
    const updated: JobRecord = {
      ...existing,
      ...updates,
      id: existing.id,
      organizationId: existing.organizationId,
    };
    this.jobs.set(id, updated);
    return { ...updated };
  }

  async delete(id: string, organizationId?: string): Promise<boolean> {
    const existing = this.jobs.get(id);
    if (!existing) {
      return false;
    }
    if (organizationId && existing.organizationId !== organizationId) {
      return false;
    }
    return this.jobs.delete(id);
  }
}
