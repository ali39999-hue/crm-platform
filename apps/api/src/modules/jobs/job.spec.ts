import { describe, expect, it, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InMemoryJobRepository, compareJobPriority } from './job.repository.js';
import { JobWorkerService } from './job-worker.service.js';
import { JobController } from './job.controller.js';
import { AuditService } from '../audit/audit.service.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import type { UserContext } from '../../common/auth/auth.types.js';
import type { JobRecord } from './job.types.js';

describe('Task F8-02: Background Jobs, Retry Policy, Concurrency, and Visibility', () => {
  let jobRepo: InMemoryJobRepository;
  let auditService: AuditService;
  let workerService: JobWorkerService;
  let jobController: JobController;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const adminAlpha: UserContext = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@alpha.internal',
    displayName: 'Admin Alpha',
    activeOrganization: {
      id: orgAlpha,
      name: 'Alpha Corp',
      slug: 'alpha-corp',
      role: 'OrganizationAdmin',
    },
    memberships: [
      {
        organizationId: orgAlpha,
        organizationName: 'Alpha Corp',
        role: 'OrganizationAdmin',
        active: true,
      },
    ],
  };

  const adminBeta: UserContext = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'admin@beta.internal',
    displayName: 'Admin Beta',
    activeOrganization: {
      id: orgBeta,
      name: 'Beta Corp',
      slug: 'beta-corp',
      role: 'OrganizationAdmin',
    },
    memberships: [
      {
        organizationId: orgBeta,
        organizationName: 'Beta Corp',
        role: 'OrganizationAdmin',
        active: true,
      },
    ],
  };

  const employeeAlpha: UserContext = {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'employee@alpha.internal',
    displayName: 'Employee Alpha',
    activeOrganization: {
      id: orgAlpha,
      name: 'Alpha Corp',
      slug: 'alpha-corp',
      role: 'Employee',
    },
    memberships: [
      {
        organizationId: orgAlpha,
        organizationName: 'Alpha Corp',
        role: 'Employee',
        active: true,
      },
    ],
  };

  beforeEach(() => {
    jobRepo = new InMemoryJobRepository();
    auditService = new AuditService();
    workerService = new JobWorkerService(jobRepo, auditService);
    workerService.setBaseBackoffMs(50); // fast backoff for tests
    jobController = new JobController(workerService);
  });

  // =========================================================================
  // 1. ENQUEUEING AND PRIORITY ORDERING (CRITICAL before LOW)
  // =========================================================================
  describe('1. Enqueueing and Priority Ordering', () => {
    it('enqueues jobs with default priority NORMAL and initial status QUEUED', async () => {
      const job = await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'SEND_EMAIL',
        payload: { to: 'customer@example.com' },
      });

      expect(job.id).toBeDefined();
      expect(job.organizationId).toBe(orgAlpha);
      expect(job.priority).toBe('NORMAL');
      expect(job.status).toBe('QUEUED');
      expect(job.attempts).toBe(0);
      expect(job.maxAttempts).toBe(3);
      expect(job.startedAt).toBeNull();
      expect(job.completedAt).toBeNull();

      const events = auditService.getEvents(orgAlpha);
      const enqueuedEvent = events.find((e) => e.action === 'JOB_ENQUEUED');
      expect(enqueuedEvent).toBeDefined();
      expect(enqueuedEvent?.entityId).toBe(job.id);
    });

    it('claims and sorts jobs strictly by priority (CRITICAL before HIGH before NORMAL before LOW)', async () => {
      const lowJob = await jobRepo.enqueue({
        organizationId: orgAlpha,
        type: 'SEND_EMAIL',
        priority: 'LOW',
        payload: { name: 'low' },
      });

      const normalJob = await jobRepo.enqueue({
        organizationId: orgAlpha,
        type: 'SEND_EMAIL',
        priority: 'NORMAL',
        payload: { name: 'normal' },
      });

      const highJob = await jobRepo.enqueue({
        organizationId: orgAlpha,
        type: 'SEND_EMAIL',
        priority: 'HIGH',
        payload: { name: 'high' },
      });

      const criticalJob = await jobRepo.enqueue({
        organizationId: orgAlpha,
        type: 'SEND_EMAIL',
        priority: 'CRITICAL',
        payload: { name: 'critical' },
      });

      // Claim jobs sequentially and verify claim order
      const claimed1 = await jobRepo.claimNextRunnableJob();
      expect(claimed1?.id).toBe(criticalJob.id);
      expect(claimed1?.priority).toBe('CRITICAL');

      const claimed2 = await jobRepo.claimNextRunnableJob();
      expect(claimed2?.id).toBe(highJob.id);
      expect(claimed2?.priority).toBe('HIGH');

      const claimed3 = await jobRepo.claimNextRunnableJob();
      expect(claimed3?.id).toBe(normalJob.id);
      expect(claimed3?.priority).toBe('NORMAL');

      const claimed4 = await jobRepo.claimNextRunnableJob();
      expect(claimed4?.id).toBe(lowJob.id);
      expect(claimed4?.priority).toBe('LOW');

      // No more runnable jobs
      const claimed5 = await jobRepo.claimNextRunnableJob();
      expect(claimed5).toBeNull();
    });

    it('preserves FIFO ordering within the same priority level', async () => {
      const job1 = await jobRepo.enqueue({
        organizationId: orgAlpha,
        type: 'PROCESS_OUTBOX',
        priority: 'HIGH',
        payload: { index: 1 },
      });

      const job2 = await jobRepo.enqueue({
        organizationId: orgAlpha,
        type: 'PROCESS_OUTBOX',
        priority: 'HIGH',
        payload: { index: 2 },
      });

      const job3 = await jobRepo.enqueue({
        organizationId: orgAlpha,
        type: 'PROCESS_OUTBOX',
        priority: 'HIGH',
        payload: { index: 3 },
      });

      const firstClaimed = await jobRepo.claimNextRunnableJob();
      const secondClaimed = await jobRepo.claimNextRunnableJob();
      const thirdClaimed = await jobRepo.claimNextRunnableJob();

      expect(firstClaimed?.id).toBe(job1.id);
      expect(secondClaimed?.id).toBe(job2.id);
      expect(thirdClaimed?.id).toBe(job3.id);
    });

    it('unit test compareJobPriority comparator helper directly', () => {
      const base: JobRecord = {
        id: '1',
        organizationId: orgAlpha,
        type: 'SEND_EMAIL',
        priority: 'NORMAL',
        payload: {},
        result: null,
        error: null,
        status: 'QUEUED',
        maxAttempts: 3,
        attempts: 0,
        runAt: new Date(1000).toISOString(),
        startedAt: null,
        completedAt: null,
        createdAt: new Date(1000).toISOString(),
      };

      const critical = { ...base, id: 'c', priority: 'CRITICAL' as const };
      const low = { ...base, id: 'l', priority: 'LOW' as const };

      expect(compareJobPriority(critical, low)).toBeLessThan(0);
      expect(compareJobPriority(low, critical)).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 2. WORKER EXECUTION WITH HANDLER
  // =========================================================================
  describe('2. Worker Execution with Handler', () => {
    it('executes built-in SEND_EMAIL handler and marks job COMPLETED with timestamps', async () => {
      const job = await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'SEND_EMAIL',
        payload: { to: 'alice@example.com', subject: 'Welcome!', body: 'Hello Alice' },
      });

      const processed = await workerService.processNext();
      expect(processed).not.toBeNull();
      expect(processed?.id).toBe(job.id);
      expect(processed?.status).toBe('COMPLETED');
      expect(processed?.attempts).toBe(1);
      expect(processed?.startedAt).toBeDefined();
      expect(processed?.completedAt).toBeDefined();
      expect(processed?.result).toMatchObject({
        delivered: true,
        to: 'alice@example.com',
        subject: 'Welcome!',
      });

      const events = auditService.getEvents(orgAlpha);
      const completedEvent = events.find((e) => e.action === 'JOB_COMPLETED' && e.entityId === job.id);
      expect(completedEvent).toBeDefined();
      expect(completedEvent?.metadata?.result).toBeDefined();
    });

    it('supports custom registered job handlers', async () => {
      let customExecuted = false;

      workerService.registerHandler('CUSTOM_SYNC_TASK', async (job) => {
        customExecuted = true;
        return { syncedItems: 42, target: job.payload?.target };
      });

      const job = await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'CUSTOM_SYNC_TASK',
        payload: { target: 'external-service' },
      });

      const processed = await workerService.processNext();
      expect(customExecuted).toBe(true);
      expect(processed?.status).toBe('COMPLETED');
      expect(processed?.result).toEqual({ syncedItems: 42, target: 'external-service' });
    });

    it('executes all 5 required built-in handlers successfully', async () => {
      const handlers = [
        { type: 'SEND_EMAIL', payload: { to: 'test@crm.internal', subject: 'Hi' } },
        { type: 'PROCESS_OUTBOX', payload: { batchSize: 5 } },
        { type: 'IMPORT_CSV_BATCH', payload: { rowCount: 15, entity: 'Contact' } },
        { type: 'CALCULATE_METRICS', payload: { metric: 'mrr', value: 12500 } },
        { type: 'WEBHOOK_RETRY', payload: { url: 'https://example.com/webhook' } },
      ];

      for (const h of handlers) {
        const job = await workerService.enqueue({
          organizationId: orgAlpha,
          type: h.type,
          payload: h.payload,
        });

        const executed = await workerService.processNext();
        expect(executed?.id).toBe(job.id);
        expect(executed?.status).toBe('COMPLETED');
        expect(executed?.result).toBeDefined();
      }
    });
  });

  // =========================================================================
  // 3. RETRY WITH EXPONENTIAL BACKOFF ON TRANSIENT FAILURE
  // =========================================================================
  describe('3. Retry with Exponential Backoff on Transient Failure', () => {
    it('sets status to RETRYING and schedules next runAt with exponential backoff on transient failure', async () => {
      let runCount = 0;
      workerService.registerHandler('TRANSIENT_TASK', async () => {
        runCount++;
        if (runCount < 3) {
          throw new Error(`Temporary network failure #${runCount}`);
        }
        return { recovered: true, runs: runCount };
      });

      workerService.setBaseBackoffMs(100);

      const job = await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'TRANSIENT_TASK',
        maxAttempts: 4,
      });

      const startTime = Date.now();

      // First run: fails (attempt 1)
      const afterRun1 = await workerService.processNext();
      expect(afterRun1?.id).toBe(job.id);
      expect(afterRun1?.status).toBe('RETRYING');
      expect(afterRun1?.attempts).toBe(1);
      expect(afterRun1?.error).toBe('Temporary network failure #1');
      // Backoff delay for attempt 1: 100 * 2^0 = 100ms
      const runAt1 = new Date(afterRun1!.runAt).getTime();
      expect(runAt1).toBeGreaterThanOrEqual(startTime + 90);

      const events1 = auditService.getEvents(orgAlpha);
      const retryingEvent1 = events1.find((e) => e.action === 'JOB_RETRYING' && e.entityId === job.id);
      expect(retryingEvent1).toBeDefined();
      expect(retryingEvent1?.metadata?.attempt).toBe(1);

      // Immediate attempt to process should return null because runAt is in future
      const immediateClaim = await workerService.processNext(new Date(startTime + 10));
      expect(immediateClaim).toBeNull();

      // Second run: time advances past runAt1
      const afterRun2 = await workerService.processNext(new Date(runAt1 + 10));
      expect(afterRun2?.id).toBe(job.id);
      expect(afterRun2?.status).toBe('RETRYING');
      expect(afterRun2?.attempts).toBe(2);
      expect(afterRun2?.error).toBe('Temporary network failure #2');
      // Backoff delay for attempt 2: 100 * 2^1 = 200ms
      const runAt2 = new Date(afterRun2!.runAt).getTime();
      expect(runAt2).toBeGreaterThanOrEqual(runAt1 + 190);

      // Third run: time advances past runAt2, succeeds!
      const afterRun3 = await workerService.processNext(new Date(runAt2 + 10));
      expect(afterRun3?.id).toBe(job.id);
      expect(afterRun3?.status).toBe('COMPLETED');
      expect(afterRun3?.attempts).toBe(3);
      expect(afterRun3?.error).toBeNull();
      expect(afterRun3?.result).toEqual({ recovered: true, runs: 3 });

      const finalEvents = auditService.getEvents(orgAlpha);
      const completedEvent = finalEvents.find((e) => e.action === 'JOB_COMPLETED' && e.entityId === job.id);
      expect(completedEvent).toBeDefined();
      expect(completedEvent?.metadata?.attempts).toBe(3);
    });
  });

  // =========================================================================
  // 4. PERMANENT FAILURE AFTER EXCEEDING MAX ATTEMPTS AND AUDIT LOGGING
  // =========================================================================
  describe('4. Permanent Failure after Exceeding maxAttempts and Audit Logging', () => {
    it('marks job FAILED permanently when maxAttempts is exceeded and records JOB_FAILED audit event', async () => {
      workerService.registerHandler('ALWAYS_FAILING', async () => {
        throw new Error('Fatal unrecoverable error');
      });

      const maxAttempts = 2;
      const job = await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'ALWAYS_FAILING',
        maxAttempts,
      });

      // Attempt 1: retrying
      const run1 = await workerService.processNext();
      expect(run1?.status).toBe('RETRYING');
      expect(run1?.attempts).toBe(1);

      // Fast forward past backoff
      const future = new Date(Date.now() + 10000);

      // Attempt 2: hits maxAttempts (2) -> permanent failure
      const run2 = await workerService.processNext(future);
      expect(run2?.id).toBe(job.id);
      expect(run2?.status).toBe('FAILED');
      expect(run2?.attempts).toBe(2);
      expect(run2?.completedAt).toBeDefined();
      expect(run2?.error).toBe('Fatal unrecoverable error');

      // Subsequent processNext cannot claim this failed job
      const run3 = await workerService.processNext(new Date(future.getTime() + 10000));
      expect(run3).toBeNull();

      // Check audit service log
      const events = auditService.getEvents(orgAlpha);
      const failedEvent = events.find((e) => e.action === 'JOB_FAILED' && e.entityId === job.id);
      expect(failedEvent).toBeDefined();
      expect(failedEvent?.metadata?.attempts).toBe(2);
      expect(failedEvent?.metadata?.maxAttempts).toBe(2);
      expect(failedEvent?.metadata?.error).toBe('Fatal unrecoverable error');
    });

    it('fails gracefully when no handler is registered for job type', async () => {
      const job = await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'UNREGISTERED_TYPE',
        maxAttempts: 1,
      });

      const processed = await workerService.processNext();
      expect(processed?.status).toBe('FAILED');
      expect(processed?.error).toContain("No handler registered for job type 'UNREGISTERED_TYPE'");
    });
  });

  // =========================================================================
  // 5. CONCURRENCY LIMITER
  // =========================================================================
  describe('5. Concurrency Limiter', () => {
    it('respects concurrency limit when processing jobs in parallel', async () => {
      const maxConcurrency = 3;
      workerService.setMaxConcurrency(maxConcurrency);
      expect(workerService.getMaxConcurrency()).toBe(3);

      let activeResolvers: Array<() => void> = [];
      let concurrentExecutions = 0;
      let peakConcurrency = 0;

      workerService.registerHandler('SLOW_JOB', async () => {
        concurrentExecutions++;
        if (concurrentExecutions > peakConcurrency) {
          peakConcurrency = concurrentExecutions;
        }
        await new Promise<void>((resolve) => {
          activeResolvers.push(resolve);
        });
        concurrentExecutions--;
        return { done: true };
      });

      // Enqueue 6 jobs
      for (let i = 0; i < 6; i++) {
        await workerService.enqueue({
          organizationId: orgAlpha,
          type: 'SLOW_JOB',
        });
      }

      // Trigger queue processing
      const processPromise = workerService.processQueue(6);

      // Wait a tick for claims to happen
      await new Promise((r) => setTimeout(r, 20));

      expect(workerService.getActiveJobCount()).toBe(maxConcurrency);
      expect(peakConcurrency).toBe(maxConcurrency);

      // Release first batch of resolvers
      const resolversToRelease = [...activeResolvers];
      activeResolvers = [];
      resolversToRelease.forEach((resolve) => resolve());

      // Let first batch complete and next batch start
      await new Promise((r) => setTimeout(r, 20));

      // Release second batch of resolvers
      const secondBatch = [...activeResolvers];
      activeResolvers = [];
      secondBatch.forEach((resolve) => resolve());

      const results = await processPromise;
      expect(results.length).toBe(6);
      expect(peakConcurrency).toBeLessThanOrEqual(maxConcurrency);
      expect(workerService.getActiveJobCount()).toBe(0);
    });
  });

  // =========================================================================
  // 6. MANUAL RETRY AND CANCELLATION
  // =========================================================================
  describe('6. Manual Retry and Cancellation', () => {
    it('cancels a queued job and logs audit event', async () => {
      const job = await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'SEND_EMAIL',
        payload: { to: 'cancel@example.com' },
      });

      const cancelled = await jobController.cancelJob(adminAlpha, job.id);
      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.completedAt).toBeDefined();

      const events = auditService.getEvents(orgAlpha);
      const cancelEvent = events.find((e) => e.action === 'JOB_CANCELLED' && e.entityId === job.id);
      expect(cancelEvent).toBeDefined();

      // Cancelled job should not be processed
      const next = await workerService.processNext();
      expect(next).toBeNull();
    });

    it('throws BadRequestException when attempting to cancel a completed job', async () => {
      const job = await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'SEND_EMAIL',
        payload: { to: 'completed@example.com' },
      });
      await workerService.processNext();

      await expect(jobController.cancelJob(adminAlpha, job.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('manually retries a failed job, resetting it to QUEUED', async () => {
      let shouldFail = true;
      workerService.registerHandler('FAIL_THEN_RECOVER', async () => {
        if (shouldFail) {
          throw new Error('Initial crash');
        }
        return { ok: true };
      });

      const job = await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'FAIL_THEN_RECOVER',
        maxAttempts: 1, // fails permanently on first run
      });

      const failedJob = await workerService.processNext();
      expect(failedJob?.status).toBe('FAILED');

      // Admin retries the failed job
      shouldFail = false;
      const retried = await jobController.retryJob(adminAlpha, job.id);
      expect(retried.status).toBe('QUEUED');
      expect(retried.attempts).toBe(0);
      expect(retried.error).toBeNull();

      const events = auditService.getEvents(orgAlpha);
      const retryEvent = events.find((e) => e.action === 'JOB_RETRIED' && e.entityId === job.id);
      expect(retryEvent).toBeDefined();

      // Can be executed again
      const executed = await workerService.processNext();
      expect(executed?.status).toBe('COMPLETED');
      expect(executed?.result).toEqual({ ok: true });
    });

    it('throws BadRequestException when retrying a job that is already QUEUED', async () => {
      const job = await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'SEND_EMAIL',
        payload: { to: 'queued@example.com' },
      });

      await expect(jobController.retryJob(adminAlpha, job.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // =========================================================================
  // 7. TENANT ISOLATION
  // =========================================================================
  describe('7. Tenant Isolation', () => {
    it('ensures Org Alpha cannot list, inspect, retry, or cancel Org Beta jobs', async () => {
      const jobBeta = await workerService.enqueue({
        organizationId: orgBeta,
        type: 'SEND_EMAIL',
        payload: { to: 'beta@example.com' },
      });

      const jobAlpha = await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'SEND_EMAIL',
        payload: { to: 'alpha@example.com' },
      });

      // 1. List isolation
      const alphaList = await jobController.listJobs(adminAlpha);
      expect(alphaList.some((j) => j.id === jobAlpha.id)).toBe(true);
      expect(alphaList.some((j) => j.id === jobBeta.id)).toBe(false);

      const betaList = await jobController.listJobs(adminBeta);
      expect(betaList.some((j) => j.id === jobBeta.id)).toBe(true);
      expect(betaList.some((j) => j.id === jobAlpha.id)).toBe(false);

      // 2. Stats isolation
      const alphaStats = await jobController.getStats(adminAlpha);
      const betaStats = await jobController.getStats(adminBeta);
      expect(alphaStats.total).toBe(1);
      expect(betaStats.total).toBe(1);

      // 3. Org Alpha cannot get Org Beta job by id
      await expect(jobController.getJob(adminAlpha, jobBeta.id)).rejects.toThrow(
        NotFoundException,
      );

      // 4. Org Alpha cannot cancel Org Beta job
      await expect(jobController.cancelJob(adminAlpha, jobBeta.id)).rejects.toThrow(
        NotFoundException,
      );

      // 5. Org Alpha cannot retry Org Beta job
      await expect(jobController.retryJob(adminAlpha, jobBeta.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // 8. CONTROLLER ENDPOINTS AND PERMISSION GUARD
  // =========================================================================
  describe('8. Controller Endpoints and Permission Guards', () => {
    it('supports listing jobs with status and type filters', async () => {
      await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'SEND_EMAIL',
      });
      await workerService.enqueue({
        organizationId: orgAlpha,
        type: 'PROCESS_OUTBOX',
      });

      const emailJobs = await jobController.listJobs(adminAlpha, undefined, 'SEND_EMAIL');
      expect(emailJobs.length).toBe(1);
      expect(emailJobs[0]?.type).toBe('SEND_EMAIL');
    });

    it('enforces RBAC via PermissionsGuard for manage_integrations', () => {
      const reflector = new Reflector();
      const guard = new PermissionsGuard(reflector);

      // Admin with manage_integrations allowed
      const allowedContext: any = {
        getHandler: () => ({}),
        getClass: () => JobController,
        switchToHttp: () => ({
          getRequest: () => ({ user: adminAlpha }),
        }),
      };
      expect(guard.canActivate(allowedContext)).toBe(true);

      // Employee without manage_integrations denied
      const deniedContext: any = {
        getHandler: () => ({}),
        getClass: () => JobController,
        switchToHttp: () => ({
          getRequest: () => ({ user: employeeAlpha }),
        }),
      };
      expect(() => guard.canActivate(deniedContext)).toThrow(ForbiddenException);
    });
  });
});
