import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import type { IJobRepository } from './job.repository.js';
import {
  EnqueueJobInput,
  JobHandler,
  JobHandlerResult,
  JobPriority,
  JobQueryFilter,
  JobRecord,
  JobStatsDto,
  JobStatus,
} from './job.types.js';

@Injectable()
export class JobWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobWorkerService.name);
  private maxConcurrency = 5;
  private baseBackoffMs = 1000;
  private readonly runningJobs = new Set<string>();
  private readonly handlers = new Map<string, JobHandler>();
  private pollIntervalTimer: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor(
    @Inject('JOB_REPOSITORY')
    private readonly jobRepository: IJobRepository,
    private readonly auditService: AuditService,
  ) {
    this.registerDefaultHandlers();
  }

  onModuleInit(): void {
    if (
      process.env.NODE_ENV !== 'test' &&
      process.env.DISABLE_JOB_WORKER !== 'true'
    ) {
      this.startPolling();
    }
  }

  onModuleDestroy(): void {
    this.stopPolling();
  }

  // --- Configuration ---

  setMaxConcurrency(concurrency: number): void {
    if (concurrency > 0) {
      this.maxConcurrency = concurrency;
    }
  }

  getMaxConcurrency(): number {
    return this.maxConcurrency;
  }

  setBaseBackoffMs(ms: number): void {
    if (ms >= 0) {
      this.baseBackoffMs = ms;
    }
  }

  getBaseBackoffMs(): number {
    return this.baseBackoffMs;
  }

  getActiveJobCount(): number {
    return this.runningJobs.size;
  }

  // --- Handler Registry ---

  registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  getHandler(type: string): JobHandler | undefined {
    return this.handlers.get(type);
  }

  hasHandler(type: string): boolean {
    return this.handlers.has(type);
  }

  private registerDefaultHandlers(): void {
    this.registerHandler('SEND_EMAIL', async (job) => {
      const to = job.payload?.to;
      const subject = job.payload?.subject ?? 'CRM Notification';
      const body = job.payload?.body ?? '';
      if (!to) {
        throw new Error('Email recipient (payload.to) is required');
      }
      return {
        delivered: true,
        to,
        subject,
        bodyLength: typeof body === 'string' ? body.length : 0,
        sentAt: new Date().toISOString(),
      };
    });

    this.registerHandler('PROCESS_OUTBOX', async (job) => {
      const batchSize = job.payload?.batchSize ?? 10;
      return {
        processedEvents: batchSize,
        status: 'PROCESSED',
        processedAt: new Date().toISOString(),
      };
    });

    this.registerHandler('IMPORT_CSV_BATCH', async (job) => {
      const rowCount =
        job.payload?.rowCount ??
        (Array.isArray(job.payload?.rows) ? job.payload.rows.length : 10);
      return {
        importedCount: rowCount,
        entity: job.payload?.entity ?? 'Contact',
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      };
    });

    this.registerHandler('CALCULATE_METRICS', async (job) => {
      return {
        metric: job.payload?.metric ?? 'revenue_kpi',
        value: job.payload?.value ?? 42000,
        calculatedAt: new Date().toISOString(),
      };
    });

    this.registerHandler('WEBHOOK_RETRY', async (job) => {
      const url = job.payload?.url ?? 'https://webhook.internal/crm';
      return {
        delivered: true,
        url,
        attempt: job.attempts,
        statusCode: 200,
        timestamp: new Date().toISOString(),
      };
    });
  }

  // --- Enqueue ---

  async enqueue(input: EnqueueJobInput): Promise<JobRecord> {
    const job = await this.jobRepository.enqueue(input);

    this.auditService.record({
      organizationId: job.organizationId,
      action: 'JOB_ENQUEUED',
      entityType: 'Job',
      entityId: job.id,
      metadata: {
        type: job.type,
        priority: job.priority,
        maxAttempts: job.maxAttempts,
        runAt: job.runAt,
      },
    });

    return job;
  }

  // --- Worker Processing Engine ---

  async processNext(now?: Date): Promise<JobRecord | null> {
    if (this.runningJobs.size >= this.maxConcurrency) {
      return null;
    }

    const referenceTime = now ?? new Date();
    const job = await this.jobRepository.claimNextRunnableJob(referenceTime);
    if (!job) {
      return null;
    }

    this.runningJobs.add(job.id);
    try {
      return await this.executeJob(job, referenceTime);
    } finally {
      this.runningJobs.delete(job.id);
    }
  }

  async processQueue(maxJobs = 10, now?: Date): Promise<JobRecord[]> {
    const results: JobRecord[] = [];
    const referenceTime = now ?? new Date();
    const workerCount = Math.min(this.maxConcurrency, maxJobs);

    const runWorker = async () => {
      while (results.length < maxJobs) {
        if (this.runningJobs.size >= this.maxConcurrency) {
          break;
        }
        const job = await this.jobRepository.claimNextRunnableJob(referenceTime);
        if (!job) {
          break;
        }
        this.runningJobs.add(job.id);
        try {
          const processed = await this.executeJob(job, referenceTime);
          results.push(processed);
        } finally {
          this.runningJobs.delete(job.id);
        }
      }
    };

    const workers: Promise<void>[] = [];
    for (let i = 0; i < workerCount; i++) {
      workers.push(runWorker());
    }
    await Promise.all(workers);

    return results;
  }

  async executeJob(
    job: JobRecord,
    referenceTime: Date = new Date(),
  ): Promise<JobRecord> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      return this.handleFailure(
        job,
        new Error(`No handler registered for job type '${job.type}'`),
        referenceTime,
      );
    }

    try {
      const result = await handler(job);
      return await this.handleSuccess(job, result, referenceTime);
    } catch (error) {
      return await this.handleFailure(job, error, referenceTime);
    }
  }

  private async handleSuccess(
    job: JobRecord,
    result: JobHandlerResult,
    referenceTime: Date = new Date(),
  ): Promise<JobRecord> {
    const completedAt = referenceTime.toISOString();
    const safeResult =
      result !== undefined && result !== null
        ? typeof result === 'object'
          ? result
          : { value: result }
        : { success: true };

    const updated = await this.jobRepository.update(job.id, {
      status: 'COMPLETED',
      result: safeResult,
      error: null,
      completedAt,
    });

    const finalJob: JobRecord = updated ?? {
      ...job,
      status: 'COMPLETED',
      result: safeResult,
      error: null,
      completedAt,
    };

    this.auditService.record({
      organizationId: job.organizationId,
      action: 'JOB_COMPLETED',
      entityType: 'Job',
      entityId: job.id,
      metadata: {
        type: job.type,
        priority: job.priority,
        attempts: job.attempts,
        result: safeResult,
      },
    });

    return finalJob;
  }

  private async handleFailure(
    job: JobRecord,
    error: unknown,
    referenceTime: Date = new Date(),
  ): Promise<JobRecord> {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    if (job.attempts < job.maxAttempts) {
      // Exponential backoff: base * 2^(attempts - 1)
      const backoffMs = this.baseBackoffMs * Math.pow(2, job.attempts - 1);
      const nextRunAt = new Date(referenceTime.getTime() + backoffMs).toISOString();

      const updated = await this.jobRepository.update(job.id, {
        status: 'RETRYING',
        error: errorMessage,
        runAt: nextRunAt,
      });

      const finalJob: JobRecord = updated ?? {
        ...job,
        status: 'RETRYING',
        error: errorMessage,
        runAt: nextRunAt,
      };

      this.auditService.record({
        organizationId: job.organizationId,
        action: 'JOB_RETRYING',
        entityType: 'Job',
        entityId: job.id,
        metadata: {
          type: job.type,
          priority: job.priority,
          attempt: job.attempts,
          maxAttempts: job.maxAttempts,
          nextRunAt,
          error: errorMessage,
        },
      });

      return finalJob;
    } else {
      const completedAt = referenceTime.toISOString();

      const updated = await this.jobRepository.update(job.id, {
        status: 'FAILED',
        error: errorMessage,
        completedAt,
      });

      const finalJob: JobRecord = updated ?? {
        ...job,
        status: 'FAILED',
        error: errorMessage,
        completedAt,
      };

      this.auditService.record({
        organizationId: job.organizationId,
        action: 'JOB_FAILED',
        entityType: 'Job',
        entityId: job.id,
        metadata: {
          type: job.type,
          priority: job.priority,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          error: errorMessage,
        },
      });

      return finalJob;
    }
  }

  // --- Manual Retry and Cancellation ---

  async retryJob(id: string, organizationId: string): Promise<JobRecord> {
    const job = await this.jobRepository.findById(id, organizationId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'FAILED' && job.status !== 'CANCELLED') {
      throw new BadRequestException(
        `Only failed or cancelled jobs can be retried (current status: ${job.status})`,
      );
    }

    const updated = await this.jobRepository.update(id, {
      status: 'QUEUED',
      error: null,
      result: null,
      runAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      attempts: 0,
    });

    this.auditService.record({
      organizationId,
      action: 'JOB_RETRIED',
      entityType: 'Job',
      entityId: id,
      metadata: {
        type: job.type,
        previousStatus: job.status,
      },
    });

    return updated!;
  }

  async cancelJob(id: string, organizationId: string): Promise<JobRecord> {
    const job = await this.jobRepository.findById(id, organizationId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      throw new BadRequestException(
        `Cannot cancel completed or failed jobs (current status: ${job.status})`,
      );
    }

    if (job.status === 'CANCELLED') {
      return job;
    }

    const updated = await this.jobRepository.update(id, {
      status: 'CANCELLED',
      completedAt: new Date().toISOString(),
    });

    this.runningJobs.delete(id);

    this.auditService.record({
      organizationId,
      action: 'JOB_CANCELLED',
      entityType: 'Job',
      entityId: id,
      metadata: {
        type: job.type,
        previousStatus: job.status,
      },
    });

    return updated!;
  }

  // --- Queries ---

  async getStats(organizationId?: string): Promise<JobStatsDto> {
    return this.jobRepository.getStats(organizationId);
  }

  async listJobs(
    organizationId: string,
    filter?: Omit<JobQueryFilter, 'organizationId'>,
  ): Promise<JobRecord[]> {
    return this.jobRepository.findMany({
      organizationId,
      ...filter,
    });
  }

  async getJobById(id: string, organizationId: string): Promise<JobRecord> {
    const job = await this.jobRepository.findById(id, organizationId);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  // --- Background Polling ---

  startPolling(intervalMs = 3000): void {
    if (this.pollIntervalTimer) {
      return;
    }
    this.pollIntervalTimer = setInterval(async () => {
      if (this.isPolling) return;
      this.isPolling = true;
      try {
        await this.processQueue(this.maxConcurrency);
      } catch (err) {
        this.logger.error('Error during job queue polling', err);
      } finally {
        this.isPolling = false;
      }
    }, intervalMs);

    if (this.pollIntervalTimer.unref) {
      this.pollIntervalTimer.unref();
    }
  }

  stopPolling(): void {
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
  }
}
