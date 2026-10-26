import { test, expect } from '@playwright/test';

test.describe('System State Recovery & Team Mentions Journey (R-065, R-095, R-097, R-098)', () => {
  test('should render 403 Forbidden page safely without sensitive data leakage', async ({
    page,
  }) => {
    await page.goto('/forbidden');
    const forbidden = page.locator('[data-testid="forbidden-page"]');
    await expect(forbidden).toBeVisible();
    await expect(forbidden).toContainText('خطای ۴۰۳: دسترسی به این بخش مجاز نیست');
    await expect(forbidden).toContainText('راهنمای رفع مشکل');

    // Security gate: No secrets or raw stack traces rendered
    await expect(page.locator('body')).not.toContainText('stack trace');
    await expect(page.locator('body')).not.toContainText('password');
  });

  test('should render 503 Service Unavailable page with retry action', async ({ page }) => {
    await page.goto('/service-unavailable');
    const unavailable = page.locator('[data-testid="service-unavailable-page"]');
    await expect(unavailable).toBeVisible();
    await expect(unavailable).toContainText('خطای ۵۰۳: سرویس به صورت موقت در دسترس نیست');
    await expect(unavailable).toContainText('تلاش مجدد');
  });

  test('should render Invite Expired page with clear recovery instructions', async ({ page }) => {
    await page.goto('/invite-expired');
    const expired = page.locator('[data-testid="invite-expired-page"]');
    await expect(expired).toBeVisible();
    await expect(expired).toContainText('لینک دعوت‌نامه منقضی شده است');
    await expect(expired).toContainText('اقدام لازم');
  });

  test('should view mentions inbox and create new team mention', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();

    // Navigate to Notifications tab
    const notifNav = page.locator('[data-testid="nav-notifications"]');
    await expect(notifNav).toBeVisible();
    await notifNav.click();

    // Switch to Mentions sub-tab
    const mentionsTab = page.locator('[data-testid="notif-tab-mentions"]');
    await expect(mentionsTab).toBeVisible();
    await mentionsTab.click();

    // Verify Mentions view rendered
    const view = page.locator('[data-testid="mentions-inbox-view"]');
    await expect(view).toBeVisible();
    await expect(view).toContainText('صندوق منشن‌ها و همکاری تیمی');

    // Verify seeded mention exists
    const list = page.locator('[data-testid="mentions-list"]');
    await expect(list).toContainText('علی مدیر');
    await expect(list).toContainText('@سارا');

    // Open create mention modal
    const createBtn = page.locator('[data-testid="create-mention-btn"]');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    const modal = page.locator('[data-testid="create-mention-modal"]');
    await expect(modal).toBeVisible();

    // Fill form
    const mentionTitle = 'پروژه استقرار CRM سازمانی';
    const mentionContext = '@سارا لطفاً بخش سوم را بازبینی فرمایید';
    await page.locator('[data-testid="mention-source-input"]').fill(mentionTitle);
    await page.locator('[data-testid="mention-context-textarea"]').fill(mentionContext);

    // Submit form
    await page.locator('[data-testid="submit-mention-btn"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Verify toast confirmation
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('ثبت شد');

    // Verify mention appears in list
    await expect(list).toContainText(mentionTitle);
  });
});
