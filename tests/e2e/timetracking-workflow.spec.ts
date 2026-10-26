import { test, expect } from '@playwright/test';

test.describe('Time Tracking & Work Logs P2 Journey (R-052)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to Time Tracking tab and verify stats and seeded logs', async ({ page }) => {
    // 1. Navigate to Time
    const timeNav = page.locator('[data-testid="nav-time"]');
    await expect(timeNav).toBeVisible();
    await timeNav.click();

    // Verify view is rendered
    const view = page.locator('[data-testid="time-tracking-view"]');
    await expect(view).toBeVisible();
    await expect(view).toContainText('مدیریت زمان کاری و لاگ کارکردها');

    // Verify stats cards
    await expect(view).toContainText('کل ساعات کارکرد ثبت‌شده');
    await expect(view).toContainText('ساعات قابل فاکتور (Billable)');

    // Verify seeded work logs in table
    const tbody = page.locator('[data-testid="worklogs-tbody"]');
    await expect(tbody).toBeVisible();
    await expect(tbody).toContainText('بررسی لاگ‌های ورود و اتصال چندمستأجری');
    await expect(tbody).toContainText('سارا احمدی');
  });

  test('should operate live timer controls', async ({ page }) => {
    await page.locator('[data-testid="nav-time"]').click();

    const titleInput = page.locator('[data-testid="timer-title-input"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('تست تایمر زنده');

    // Click start timer
    const startBtn = page.locator('[data-testid="start-timer-btn"]');
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Verify toast confirmation
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('آغاز شد');

    // Pause timer
    const pauseBtn = page.locator('[data-testid="pause-timer-btn"]');
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();
  });

  test('should submit a manual work log via modal', async ({ page }) => {
    await page.locator('[data-testid="nav-time"]').click();

    const logTitle = `کارکرد آزمون اتوماسیون ${Date.now()}`;

    // Click manual log button
    const manualBtn = page.locator('[data-testid="manual-log-btn"]');
    await expect(manualBtn).toBeVisible();
    await manualBtn.click();

    const modal = page.locator('[data-testid="create-worklog-modal"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.locator('[data-testid="worklog-title-input"]').fill(logTitle);
    await page.locator('[data-testid="worklog-hours-input"]').fill('2');
    await page.locator('[data-testid="worklog-minutes-input"]').fill('30');

    // Submit form
    await page.locator('[data-testid="submit-worklog-btn"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Verify toast confirmation
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('با موفقیت ثبت شد');

    // Verify entry in table
    const tbody = page.locator('[data-testid="worklogs-tbody"]');
    await expect(tbody).toContainText(logTitle);
    await expect(tbody).toContainText('۲ ساعت و ۳۰ دقیقه');
  });

  test('should filter work logs by entity type tabs', async ({ page }) => {
    await page.locator('[data-testid="nav-time"]').click();

    const tbody = page.locator('[data-testid="worklogs-tbody"]');

    // Filter by TASK
    const taskTab = page.locator('[data-testid="filter-tab-TASK"]');
    await taskTab.click();
    await expect(tbody).toContainText('TASK');

    // Filter by PROJECT
    const projTab = page.locator('[data-testid="filter-tab-PROJECT"]');
    await projTab.click();
    await expect(tbody).toContainText('PROJECT');
  });
});
