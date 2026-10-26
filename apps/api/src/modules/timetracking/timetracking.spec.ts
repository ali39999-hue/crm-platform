import { describe, expect, it, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TimeTrackingService } from './timetracking.service.js';
import { InMemoryTimeTrackingRepository } from './timetracking.repository.js';
import { AuditService } from '../audit/audit.service.js';

describe('Time Tracking & Work Logs (R-052)', () => {
  let service: TimeTrackingService;
  let repo: InMemoryTimeTrackingRepository;
  let auditService: AuditService;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const employeeAlpha = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'سارا احمدی',
    role: 'Employee',
  };
  const otherEmployee = {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'رضا کمالی',
    role: 'Employee',
  };
  const adminActor = {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'OrganizationAdmin',
  };

  beforeEach(() => {
    repo = new InMemoryTimeTrackingRepository();
    auditService = new AuditService();
    service = new TimeTrackingService(repo, auditService);
  });

  describe('Listing & Summary Aggregation', () => {
    it('returns seeded work logs for organization and respects user filter', async () => {
      const logs = await service.getWorkLogs(orgAlpha);
      expect(logs.length).toBeGreaterThanOrEqual(3);
      expect(logs.some((l) => l.entityType === 'TASK')).toBe(true);
      expect(logs.some((l) => l.entityType === 'PROJECT')).toBe(true);

      const userLogs = await service.getWorkLogs(orgAlpha, { userId: employeeAlpha.id });
      expect(userLogs.length).toBe(logs.length);

      const betaLogs = await service.getWorkLogs(orgBeta);
      expect(betaLogs.length).toBe(0);
    });

    it('calculates total hours, billable hours, and daily breakdown correctly', async () => {
      const summary = await service.getSummary(orgAlpha);
      expect(summary.totalMinutes).toBeGreaterThan(0);
      expect(summary.totalHours).toBeGreaterThan(0);
      expect(summary.billableHours).toBeGreaterThan(0);
      expect(summary.entriesCount).toBeGreaterThanOrEqual(3);
      expect(summary.dailyBreakdown.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Creation & Validation', () => {
    it('creates work log, records audit event, and updates summary', async () => {
      const created = await service.createWorkLog(orgAlpha, employeeAlpha, {
        entityType: 'TASK',
        entityId: '10000000-0000-0000-0000-000000000002',
        entityTitle: 'بهینه‌سازی کوئری‌های دیتابیس',
        durationMinutes: 75,
        description: 'ایندکس‌گذاری فیلدهای جستجو',
        isBillable: true,
      });

      expect(created.id).toBeDefined();
      expect(created.durationMinutes).toBe(75);
      expect(created.userName).toBe(employeeAlpha.name);

      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'WORKLOG_CREATED');
      expect(audit).toBeDefined();
      expect(audit?.actorId).toBe(employeeAlpha.id);
    });

    it('rejects work log with zero or negative duration with BadRequestException', async () => {
      await expect(
        service.createWorkLog(orgAlpha, employeeAlpha, {
          entityType: 'TASK',
          entityId: 'tsk-1',
          entityTitle: 'نامعتبر',
          durationMinutes: 0,
          description: 'خطا',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createWorkLog(orgAlpha, employeeAlpha, {
          entityType: 'TASK',
          entityId: 'tsk-1',
          entityTitle: 'نامعتبر',
          durationMinutes: -15,
          description: 'خطا',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Update & Deletion Access Control', () => {
    it('allows owner to update work log and logs audit event', async () => {
      const updated = await service.updateWorkLog(
        orgAlpha,
        employeeAlpha,
        'wl-001',
        {
          durationMinutes: 150, // Updated from 120
          description: 'ویرایش زمان کارکرد',
        },
      );

      expect(updated.durationMinutes).toBe(150);
      expect(updated.description).toBe('ویرایش زمان کارکرد');

      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'WORKLOG_UPDATED');
      expect(audit).toBeDefined();
    });

    it('forbids another employee from updating work log', async () => {
      await expect(
        service.updateWorkLog(orgAlpha, otherEmployee, 'wl-001', {
          durationMinutes: 200,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin or manager to update any work log', async () => {
      const updated = await service.updateWorkLog(
        orgAlpha,
        adminActor,
        'wl-001',
        {
          durationMinutes: 180,
        },
      );
      expect(updated.durationMinutes).toBe(180);
    });

    it('deletes work log and logs audit event', async () => {
      const res = await service.deleteWorkLog(orgAlpha, employeeAlpha, 'wl-003');
      expect(res.success).toBe(true);

      const logs = await service.getWorkLogs(orgAlpha);
      expect(logs.some((l) => l.id === 'wl-003')).toBe(false);

      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'WORKLOG_DELETED');
      expect(audit).toBeDefined();
    });
  });
});
