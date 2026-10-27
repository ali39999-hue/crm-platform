import { test, expect } from '@playwright/test';

test.describe('Calendar & Activity Scheduling P1 Journey (R-064)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should switch to calendar view and view scheduled activities', async ({ page }) => {
    // 1. Ensure on My Work
    const myWorkNav = page.locator('[data-testid="nav-my-work"]');
    await myWorkNav.click();

    // 2. Switch to Calendar view mode
    const calendarViewBtn = page.locator('[data-testid="view-btn-calendar"]');
    await expect(calendarViewBtn).toBeVisible();
    await calendarViewBtn.click();

    // Verify Calendar & Activity Agenda is displayed
    const agendaView = page.locator('[data-testid="calendar-agenda-view"]');
    await expect(agendaView).toBeVisible();
    await expect(agendaView).toContainText('تقویم یکپارچه وظایف و جلسات کاری');

    // Verify seeded activities are rendered
    await expect(agendaView).toContainText('جلسه بررسی پیشرفت استقرار CRM');
  });

  test('should open Activity Composer modal and schedule a new meeting', async ({ page }) => {
    // Navigate to calendar view
    await page.locator('[data-testid="nav-my-work"]').click();
    await page.locator('[data-testid="view-btn-calendar"]').click();

    const activityTitle = `جلسه تست پلی‌رایت ${Date.now()}`;

    // Click schedule activity button
    const scheduleBtn = page.locator('[data-testid="schedule-activity-btn"]');
    await expect(scheduleBtn).toBeVisible();
    await scheduleBtn.click();

    // Verify modal is open
    const modal = page.locator('[data-testid="activity-composer-modal"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.locator('[data-testid="activity-title-input"]').fill(activityTitle);

    // Submit form
    await page.locator('[data-testid="activity-submit-btn"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Verify activity appears in activities list
    const activitiesList = page.locator('[data-testid="activities-list"]');
    await expect(activitiesList).toBeVisible();
    await expect(activitiesList).toContainText(activityTitle);
  });

  test('should mark an activity as completed', async ({ page }) => {
    await page.locator('[data-testid="nav-my-work"]').click();
    await page.locator('[data-testid="view-btn-calendar"]').click();

    const activitiesList = page.locator('[data-testid="activities-list"]');
    await expect(activitiesList).toBeVisible();

    // Find the first "انجام شد" button
    const completeBtn = activitiesList.locator('button', { hasText: 'انجام شد' }).first();
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // Verify status update
    await expect(activitiesList).toContainText('تکمیل‌شده');
  });
});
