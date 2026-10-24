import { describe, expect, it, beforeEach } from 'vitest';
import { ActivityService } from './activity.service.js';
import { InMemoryActivityRepository } from './activity.repository.js';

describe('Activity Service & Timeline (F5-05)', () => {
  let activityService: ActivityService;
  let activityRepo: InMemoryActivityRepository;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const accAlpha = '50000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    activityRepo = new InMemoryActivityRepository();
    activityService = new ActivityService(activityRepo);
  });

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
    // Try to get activities for accAlpha under Org Beta
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
      actorId: '22222222-2222-2222-2222-222222222222',
      actorName: 'کارمند عملیات',
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
