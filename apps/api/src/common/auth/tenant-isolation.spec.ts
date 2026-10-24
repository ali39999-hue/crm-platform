import { describe, expect, it, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { TasksService } from '../../modules/tasks/tasks.service.js';
import { InMemoryTaskRepository } from '../../modules/tasks/task.repository.js';
import { CrmService } from '../../modules/crm/crm.service.js';
import { InMemoryCrmRepository } from '../../modules/crm/crm.repository.js';
import { SupportService } from '../../modules/support/support.service.js';
import { InMemorySupportRepository } from '../../modules/support/support.repository.js';
import { AuditService } from '../../modules/audit/audit.service.js';
import { OutboxService } from '../../modules/outbox/outbox.service.js';
import { PermissionsGuard } from './permissions.guard.js';

describe('Tenant Isolation & Cross-Org Security Negative Tests (CRM-011 / SEC-001)', () => {
  let authService: AuthService;
  let taskRepo: InMemoryTaskRepository;
  let tasksService: TasksService;
  let crmRepo: InMemoryCrmRepository;
  let crmService: CrmService;
  let supportRepo: InMemorySupportRepository;
  let supportService: SupportService;
  let auditService: AuditService;
  let outboxService: OutboxService;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const userAlpha = '22222222-2222-2222-2222-222222222222';
  const userBeta = '44444444-4444-4444-4444-444444444444';
  const customerUser = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    authService = new AuthService();
    auditService = new AuditService();
    outboxService = new OutboxService();

    taskRepo = new InMemoryTaskRepository();
    tasksService = new TasksService(taskRepo, auditService, outboxService);

    crmRepo = new InMemoryCrmRepository();
    crmService = new CrmService(crmRepo, auditService, outboxService);

    supportRepo = new InMemorySupportRepository();
    supportService = new SupportService(supportRepo, auditService, outboxService);
  });

  describe('1. Task Cross-Tenant Security', () => {
    it('user in Org Alpha cannot read Org Beta tasks by ID', async () => {
      // Seed task in Beta
      const betaTask = await taskRepo.create({
        organizationId: orgBeta,
        creatorId: userBeta,
        assigneeId: userBeta,
        projectId: null,
        parentId: null,
        title: 'Secret Beta Task',
        description: null,
        status: 'TODO',
        priority: 'HIGH',
        visibility: 'INTERNAL',
        dueAt: null,
      });

      // User Alpha trying to fetch with Org Alpha context
      await expect(tasksService.getTaskById(orgAlpha, betaTask.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('user in Org Alpha cannot mutate Org Beta task status', async () => {
      const betaTask = await taskRepo.create({
        organizationId: orgBeta,
        creatorId: userBeta,
        assigneeId: userBeta,
        projectId: null,
        parentId: null,
        title: 'Secret Beta Task',
        description: null,
        status: 'TODO',
        priority: 'HIGH',
        visibility: 'INTERNAL',
        dueAt: null,
      });

      await expect(
        tasksService.transitionTask(orgAlpha, userAlpha, betaTask.id, {
          targetStatus: 'IN_PROGRESS',
          expectedVersion: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('user in Org Alpha cannot link dependency to Org Beta task', async () => {
      const alphaTask = (await tasksService.getMyWork(orgAlpha, userAlpha))[0]!;
      const betaTask = await taskRepo.create({
        organizationId: orgBeta,
        creatorId: userBeta,
        assigneeId: userBeta,
        projectId: null,
        parentId: null,
        title: 'Secret Beta Task',
        description: null,
        status: 'TODO',
        priority: 'HIGH',
        visibility: 'INTERNAL',
        dueAt: null,
      });

      // Trying to link Alpha task to Beta task must be rejected
      await expect(
        tasksService.addDependency(orgAlpha, userAlpha, alphaTask.id, betaTask.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('list tasks only returns tasks belonging to caller organization', async () => {
      const alphaTasks = await tasksService.getTasks(orgAlpha, { limit: 100 });
      expect(alphaTasks.items.every((t) => !t.title.includes('سازمان بتا'))).toBe(true);

      const betaTasks = await tasksService.getTasks(orgBeta, { limit: 100 });
      expect(betaTasks.items.every((t) => t.title.includes('سازمان بتا'))).toBe(true);
    });
  });

  describe('2. CRM Cross-Tenant Security', () => {
    it('user in Org Alpha cannot view Org Beta accounts', async () => {
      const accounts = await crmService.getAccounts(orgAlpha);
      expect(accounts.every((a) => a.name !== 'سازمان بتا پارتنر')).toBe(true);
    });

    it('user in Org Alpha cannot view Org Beta timeline', async () => {
      const betaAccountId = '50000000-0000-0000-0000-000000000002';
      await expect(crmService.getCustomerTimeline(orgAlpha, betaAccountId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('user cannot create contact associated with an account from another org', async () => {
      const betaAccountId = '50000000-0000-0000-0000-000000000002';
      await expect(
        crmService.createContact(orgAlpha, userAlpha, {
          accountId: betaAccountId,
          firstName: 'تست',
          lastName: 'غیرمجاز',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deduplication check does not leak data across tenants', async () => {
      // Create lead in Beta with specific email
      await crmRepo.createLead({
        organizationId: orgBeta,
        ownerId: userBeta,
        accountId: null,
        displayName: 'Beta Unique Person',
        email: 'secret@unique-company.com',
        phone: '09120000000',
        source: 'DIRECT',
        status: 'NEW',
      });

      // Checking same email in Org Alpha should NOT match Beta's lead
      const result = await crmService.createLead(orgAlpha, userAlpha, {
        displayName: 'Alpha New Person',
        email: 'secret@unique-company.com',
        phone: '09121111111',
      });

      expect(result.isDuplicateCandidate).toBe(false);
    });
  });

  describe('3. Support Tickets Cross-Tenant Security & Customer Privacy', () => {
    it('user in Org Alpha cannot read Org Beta tickets', async () => {
      const betaTicketId = '90000000-0000-0000-0000-000000000002';
      await expect(supportService.getTicketById(orgAlpha, betaTicketId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('CustomerPortalUser cannot read ticket messages from another tenant or internal notes', async () => {
      const alphaTicketId = '90000000-0000-0000-0000-000000000001';
      const messages = await supportService.getTicketMessages(
        orgAlpha,
        'CustomerPortalUser',
        alphaTicketId,
      );

      // Verify no INTERNAL messages are returned
      expect(messages.every((m) => m.visibility === 'CUSTOMER_SHARED')).toBe(true);
      expect(messages.some((m) => m.body.includes('محرمانه'))).toBe(false);
    });
  });
});
