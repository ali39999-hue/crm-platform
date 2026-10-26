import { test, expect } from '@playwright/test';

test.describe('Support Canned Responses & Macros P2 Journey (R-060)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to Support and inspect tickets table and sub-tabs', async ({ page }) => {
    const supportNav = page.locator('[data-testid="nav-support"]');
    await expect(supportNav).toBeVisible();
    await supportNav.click();

    // Verify support sub-tabs exist
    await expect(page.locator('[data-testid="support-tab-tickets"]')).toBeVisible();
    await expect(page.locator('[data-testid="support-tab-macros"]')).toBeVisible();

    // Verify tickets table rendered
    await expect(page.locator('.data-table')).toBeVisible();
    await expect(page.locator('body')).toContainText('TKT-1042');
  });

  test('should switch to Support Macros tab and inspect seeded responses', async ({ page }) => {
    await page.locator('[data-testid="nav-support"]').click();

    // Switch to Macros sub-tab
    const macrosTab = page.locator('[data-testid="support-tab-macros"]');
    await expect(macrosTab).toBeVisible();
    await macrosTab.click();

    // Verify Support Macros View rendered
    const view = page.locator('[data-testid="support-macros-view"]');
    await expect(view).toBeVisible();
    await expect(view).toContainText('قالب‌های پاسخ آماده و ماکروهای پشتیبانی');

    // Verify seeded macro card
    const grid = page.locator('[data-testid="macros-grid"]');
    await expect(grid).toBeVisible();
    await expect(grid).toContainText('پاسخ اولیه و اعلام بررسی فنی');
    await expect(grid).toContainText('!ack');
  });

  test('should create a new support macro via modal', async ({ page }) => {
    await page.locator('[data-testid="nav-support"]').click();
    await page.locator('[data-testid="support-tab-macros"]').click();

    const macroTitle = `قالب آزمون خودکار ${Date.now()}`;
    const macroShortcut = `test-${Date.now().toString().slice(-4)}`;
    const macroContent = 'با تشکر از تماس شما، بررسی فنی موضوع به اتمام رسید.';

    // Open create modal
    const createBtn = page.locator('[data-testid="create-macro-btn"]');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    const modal = page.locator('[data-testid="create-macro-modal"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.locator('[data-testid="macro-title-input"]').fill(macroTitle);
    await page.locator('[data-testid="macro-shortcut-input"]').fill(macroShortcut);
    await page.locator('[data-testid="macro-content-textarea"]').fill(macroContent);

    // Submit form
    await page.locator('[data-testid="submit-macro-btn"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Verify toast confirmation
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('ایجاد شد');

    // Verify macro appears in grid
    const grid = page.locator('[data-testid="macros-grid"]');
    await expect(grid).toContainText(macroTitle);
    await expect(grid).toContainText(`!${macroShortcut}`);
  });

  test('should copy macro text to clipboard with success toast', async ({ page }) => {
    await page.locator('[data-testid="nav-support"]').click();
    await page.locator('[data-testid="support-tab-macros"]').click();

    const copyBtn = page.locator('[data-testid^="use-macro-btn-"]').first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Verify toast confirmation
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('کپی شد');
  });
});
