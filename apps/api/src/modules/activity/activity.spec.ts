import { describe, expect, it, beforeEach } from 'vitest';
import { ActivityService } from './activity.service.js';
import { InMemoryActivityRepository } from './activity.repository.js';
import { AuditService } from '../audit/audit.service.js';

describe('Activity Service & Timeline & Scheduling (F5-05 & R-064)', () => {
  let activityService: ActivityService;
  let activityRepo: InMemoryActivityRepository;
  let auditService: AuditService;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const accAlpha = '50000000-0000-0000-0000-000000000001';
  const employeeAlpha = {
    id: '22222222-2222-2222-2222-222222222222',
    displayName: 'سارا احمدی',
    role: 'Employee' as const,
  };

  beforeEach(() => {
    activityRepo = new InMemoryActivityRepository();
    auditService = new AuditService();
    activityService = new ActivityService(activityRepo, auditService);
  });

  describe('Passive Timeline Logging', () => {
    it('retrieves account timeline with correct visibility for staff', async () => {
      const timeline = await activityService.getAccountTimeline(
        orgAlpha,
        'Employee',
        accAlpha,
      );

      expect(timeline.length).toBeGreaterThanOrEqual(2);
      // Staff should see internal activities
      expect(timeline.some((item) => item.summary.includes('ممیزی'))).toBe(true);
    });

    it('filters out internal activities for CustomerPortalUser', async () => {
      const timeline = await activityService.getAccountTimeline(
        orgAlpha,
        'CustomerPortalUser',
        accAlpha,
      );

      // Customer should NOT see internal activities
      expect(timeline.every((item) => !item.summary.includes('ممیزی'))).toBe(true);
      expect(timeline.some((item) => item.kind === 'ACCOUNT_CREATED')).toBe(true);
    });

    it('prevents cross-tenant access to activities', async () => {
      const timeline = await activityService.getAccountTimeline(
        orgBeta,
        'Employee',
        accAlpha,
      );

      expect(timeline.length).toBe(0);
    });

    it('logs a new activity and appends to timeline', async () => {
      await activityService.logActivity({
        organizationId: orgAlpha,
        actorId: employeeAlpha.id,
        actorName: employeeAlpha.displayName,
        entityType: 'ACCOUNT',
        entityId: accAlpha,
        kind: 'CALL_LOGGED',
        summary: 'تماس تلفنی با مدیر خرید برقرار شد',
        visibility: 'CUSTOMER_SHARED',
      });

      const timeline = await activityService.getAccountTimeline(
        orgAlpha,
        'Employee',
        accAlpha,
      );

      expect(timeline.some((item) => item.kind === 'CALL_LOGGED')).toBe(true);
    });
  });

  describe('Scheduled Activities & Conflict Detection', () => {
    it('creates scheduled meeting and automatically logs a timeline event', async () => {
      const now = new Date();
      // Pick a future time slot without any conflict (e.g. 10 hours from now)
      const startsAt = new Date(now.getTime() + 3600000 * 10).toISOString();
      const endsAt = new Date(now.getTime() + 3600000 * 11).toISOString();

      const result = await activityService.createScheduledActivity(
        orgAlpha,
        employeeAlpha,
        {
          type: 'MEETING',
          title: 'جلسه بازبینی نیازمندی‌های مشتری',
          description: 'بررسی جزئیات ماژول اسناد و پایگاه دانش',
          startsAt,
          endsAt,
          associatedEntityType: 'ACCOUNT',
          associatedEntityId: accAlpha,
          associatedEntityTitle: 'پتروشیمی سپهر',
          visibility: 'CUSTOMER_SHARED',
          reminderMinutesBefore: 30,
        },
      );

      expect(result.activity.id).toBeDefined();
      expect(result.activity.status).toBe('SCHEDULED');
      expect(result.activity.type).toBe('MEETING');
      expect(result.conflictInfo.hasConflict).toBe(false);

      // Timeline must have logged this scheduled meeting
      const timeline = await activityService.getAccountTimeline(
        orgAlpha,
        'Employee',
        accAlpha,
      );
      expect(
        timeline.some((item) => item.summary.includes('جلسه بازبینی نیازمندی‌های مشتری')),
      ).toBe(true);
    });

    it('detects calendar conflict when scheduling overlapping meeting with same participant', async () => {
      const baseTime = Date.now() + 86400000;
      const startsAt1 = new Date(baseTime).toISOString();
      const endsAt1 = new Date(baseTime + 3600000).toISOString();

      // Schedule first meeting
      await activityService.createScheduledActivity(orgAlpha, employeeAlpha, {
        type: 'MEETING',
        title: 'جلسه اول',
        startsAt: startsAt1,
        endsAt: endsAt1,
        participantIds: [employeeAlpha.id],
      });

      // Attempt to schedule conflicting meeting with 30 minute overlap
      const startsAt2 = new Date(baseTime + 1800000).toISOString();
      const endsAt2 = new Date(baseTime + 5400000).toISOString();

      const result2 = await activityService.createScheduledActivity(
        orgAlpha,
        employeeAlpha,
        {
          type: 'CALL',
          title: 'تماس همزمان متداخل',
          startsAt: startsAt2,
          endsAt: endsAt2,
          participantIds: [employeeAlpha.id],
        },
      );

      expect(result2.conflictInfo.hasConflict).toBe(true);
      expect(result2.conflictInfo.conflictingActivities.length).toBeGreaterThanOrEqual(1);
      expect(
        result2.conflictInfo.conflictingActivities.some((a) => a.title === 'جلسه اول'),
      ).toBe(true);
    });

    it('updates activity status and registers timeline event', async () => {
      const scheduled = await activityService.createScheduledActivity(
        orgAlpha,
        employeeAlpha,
        {
          type: 'CALL',
          title: 'تماس فروش فوری',
          startsAt: new Date(Date.now() + 3600000).toISOString(),
          associatedEntityType: 'ACCOUNT',
          associatedEntityId: accAlpha,
        },
      );

      const updated = await activityService.updateScheduledActivity(
        orgAlpha,
        employeeAlpha,
        scheduled.activity.id,
        {
          status: 'COMPLETED',
        },
      );

      expect(updated.status).toBe('COMPLETED');

      // Verify status change logged in timeline
      const timeline = await activityService.getAccountTimeline(
        orgAlpha,
        'Employee',
        accAlpha,
      );
      expect(timeline.some((t) => t.kind === 'ACTIVITY_STATUS_COMPLETED')).toBe(true);
    });

    it('enforces customer portal isolation on calendar activities', async () => {
      // Seeded act-meeting-101 is CUSTOMER_SHARED
      // Seeded act-call-102 is INTERNAL
      const customerActivities = await activityService.getCalendarActivities(
        orgAlpha,
        'CustomerPortalUser',
      );

      expect(customerActivities.every((a) => a.visibility === 'CUSTOMER_SHARED')).toBe(true);
      expect(customerActivities.some((a) => a.id === 'act-call-102')).toBe(false);
      expect(customerActivities.some((a) => a.id === 'act-meeting-101')).toBe(true);
    });
  });
});
