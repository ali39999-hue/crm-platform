import { describe, expect, it, beforeEach } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { InMemoryTaskRepository } from './task.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { AuthService } from '../../common/auth/auth.service.js';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { PermissionsGuard } from '../../common/auth/permissions.guard.js';
import { Reflector } from '@nestjs/core';

describe('Tasks & Security Vertical Slice', () => {
  let tasksService: TasksService;
  let taskRepo: InMemoryTaskRepository;
  let auditService: AuditService;
  let outboxService: OutboxService;
  let authService: AuthService;
  let authGuard: AuthGuard;
  let permissionsGuard: PermissionsGuard;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBetaId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const employeeAlphaId = '22222222-2222-2222-2222-222222222222';
  const customerId = '33333333-3333-3333-3333-333333333333';
  const employeeBetaId = '44444444-4444-4444-4444-444444444444';

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository();
    auditService = new AuditService();
    outboxService = new OutboxService();
    authService = new AuthService();
    tasksService = new TasksService(taskRepo, auditService, outboxService);

    const reflector = new Reflector();
    authGuard = new AuthGuard(reflector, authService);
    permissionsGuard = new PermissionsGuard(reflector);
  });

  describe('1. Authentication and Workspace resolution', () => {
    it('authenticates valid employee and resolves active organization scope', () => {
      const user = authService.resolveUser(employeeAlphaId);
      expect(user.id).toBe(employeeAlphaId);
      expect(user.activeOrganization.id).toBe(orgAlphaId);
      expect(user.activeOrganization.role).toBe('Employee');
    });

    it('rejects unknown user with 401 Unauthorized', () => {
      expect(() => authService.resolveUser('unknown-user-id')).toThrow(UnauthorizedException);
    });
  });

  describe('2. Tasks CRUD and My Work', () => {
    it('returns tasks assigned to the employee in their organization', async () => {
      const myWork = await tasksService.getMyWork(orgAlphaId, employeeAlphaId);
      expect(myWork.length).toBeGreaterThan(0);
      expect(myWork.every((t) => t.assigneeId === employeeAlphaId)).toBe(true);
    });

    it('creates a task, records audit event, and enqueues outbox event', async () => {
      const created = await tasksService.createTask(
        orgAlphaId,
        employeeAlphaId,
        {
          title: 'بررسی گزارش فصلی',
          description: 'تحلیل داده‌های فروش',
          priority: 'HIGH',
        },
        'req-123',
      );

      expect(created.id).toBeDefined();
      expect(created.title).toBe('بررسی گزارش فصلی');
      expect(created.version).toBe(1);
      expect(created.status).toBe('TODO');

      // Check audit event
      const auditEvents = auditService.getEvents(orgAlphaId);
      const audit = auditEvents.find((a) => a.entityId === created.id && a.action === 'TASK_CREATED');
      expect(audit).toBeDefined();
      expect(audit?.actorId).toBe(employeeAlphaId);
      expect(audit?.requestId).toBe('req-123');

      // Check outbox event
      const outboxEvents = outboxService.getEvents(orgAlphaId);
      const outbox = outboxEvents.find((o) => o.aggregateId === created.id && o.eventType === 'TaskCreated');
      expect(outbox).toBeDefined();
      expect(outbox?.status).toBe('PROCESSED');
    });
  });

  describe('3. State Machine Transitions & Optimistic Concurrency', () => {
    it('allows valid transition TODO -> IN_PROGRESS and increments version', async () => {
      const taskId = '10000000-0000-0000-0000-000000000001'; // seeded TODO task
      const updated = await tasksService.transitionTask(
        orgAlphaId,
        employeeAlphaId,
        taskId,
        {
          targetStatus: 'IN_PROGRESS',
          expectedVersion: 1,
        },
      );

      expect(updated.status).toBe('IN_PROGRESS');
      expect(updated.version).toBe(2);

      // Verify audit trail
      const audit = auditService.getEvents(orgAlphaId).find((a) => a.action === 'TASK_TRANSITIONED');
      expect(audit).toBeDefined();
      expect(audit?.metadata?.from).toBe('TODO');
      expect(audit?.metadata?.to).toBe('IN_PROGRESS');
    });

    it('rejects invalid state transition according to domain state machine', async () => {
      const taskId = '10000000-0000-0000-0000-000000000001'; // seeded TODO task
      // Transitioning directly from TODO to DONE is not allowed by state machine
      await expect(
        tasksService.transitionTask(orgAlphaId, employeeAlphaId, taskId, {
          targetStatus: 'DONE',
          expectedVersion: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects update with 409 Conflict if expected version does not match', async () => {
      const taskId = '10000000-0000-0000-0000-000000000001';
      // Attempt transition with outdated version (e.g. 99 instead of 1)
      await expect(
        tasksService.transitionTask(orgAlphaId, employeeAlphaId, taskId, {
          targetStatus: 'IN_PROGRESS',
          expectedVersion: 99,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('4. Security Negative Tests: Authorization and Cross-Org IDOR', () => {
    it('CustomerPortalUser is forbidden from viewing internal tasks', () => {
      const customer = authService.resolveUser(customerId);
      const mockContext: any = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: customer }),
        }),
      };

      // simulate guard with action 'view_internal_tasks'
      const customGuard = new PermissionsGuard({
        getAllAndOverride: () => 'view_internal_tasks',
      } as any);

      expect(() => customGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('prevents cross-organization IDOR: Org Alpha user cannot read Org Beta task', async () => {
      const betaTaskId = '20000000-0000-0000-0000-00000001'; // task belonging to Org Beta

      // Trying to fetch Org Beta's task using Org Alpha scope must fail with NotFound (no leakage)
      await expect(tasksService.getTaskById(orgAlphaId, betaTaskId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('prevents cross-organization IDOR: Org Alpha user cannot transition Org Beta task', async () => {
      const betaTaskId = '20000000-0000-0000-0000-00000001';

      await expect(
        tasksService.transitionTask(orgAlphaId, employeeAlphaId, betaTaskId, {
          targetStatus: 'IN_PROGRESS',
          expectedVersion: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('5. Task Dependencies and Cycle Prevention', () => {
    it('successfully links two tasks with dependency', async () => {
      const taskA = '10000000-0000-0000-0000-000000000001';
      const taskB = '10000000-0000-0000-0000-000000000002';

      const result = await tasksService.addDependency(orgAlphaId, employeeAlphaId, taskA, taskB);
      expect(result.dependencies).toContain(taskB);

      const audit = auditService.getEvents(orgAlphaId).find((a) => a.action === 'TASK_DEPENDENCY_ADDED');
      expect(audit).toBeDefined();
    });

    it('rejects circular dependencies when adding inverse edge', async () => {
      const taskA = '10000000-0000-0000-0000-000000000001';
      const taskB = '10000000-0000-0000-0000-000000000002';

      // First link taskA -> taskB
      await tasksService.addDependency(orgAlphaId, employeeAlphaId, taskA, taskB);

      // Now attempting inverse link taskB -> taskA creates a cycle!
      await expect(
        tasksService.addDependency(orgAlphaId, employeeAlphaId, taskB, taskA),
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents completing task if blocking dependency is not resolved', async () => {
      const taskA = '10000000-0000-0000-0000-000000000001';
      const taskB = '10000000-0000-0000-0000-000000000002';

      // Link taskA -> taskB (where taskB is IN_PROGRESS)
      await tasksService.addDependency(orgAlphaId, employeeAlphaId, taskA, taskB);

      // Transitioning taskA to DONE directly must be rejected
      await expect(
        tasksService.transitionTask(orgAlphaId, employeeAlphaId, taskA, {
          targetStatus: 'DONE',
          expectedVersion: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
