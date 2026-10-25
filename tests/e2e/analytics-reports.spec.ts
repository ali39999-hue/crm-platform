import { test, expect } from '@playwright/test';

test.describe('Reports & Business Intelligence Analytics P1 Journey (R-064 & REPORT-001)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to Reports & Analytics tab and render KPI cards and pipeline stages', async ({
    page,
  }) => {
    // 1. Navigate to Reports
    const reportsNav = page.locator('[data-testid="nav-reports"]');
    await expect(reportsNav).toBeVisible();
    await reportsNav.click();

    // Verify Analytics Dashboard View is rendered
    const view = page.locator('[data-testid="analytics-dashboard-view"]');
    await expect(view).toBeVisible();
    await expect(view).toContainText('داشبورد هوش تجاری و شاخص‌های کلیدی عملکرد');

    // Verify KPI cards
    await expect(view).toContainText('نرخ تبدیل سرنخ (Funnel)');
    await expect(view).toContainText('ارزش کل پایپ‌لاین فروش');
    await expect(view).toContainText('نرخ نقض تعهدات (SLA Breach)');

    // Verify Pipeline stages breakdown
    await expect(view).toContainText('مراحل فرصت‌های تجاری و خطوط فروش');
  });

  test('should interact with custom report builder and switch metrics', async ({ page }) => {
    await page.locator('[data-testid="nav-reports"]').click();

    const metricSelect = page.locator('[data-testid="report-metric-select"]');
    await expect(metricSelect).toBeVisible();

    // Switch metric to LEADS
    await metricSelect.selectOption('LEADS');

    // Verify groups rendered
    const groupsContainer = page.locator('[data-testid="custom-report-groups"]');
    await expect(groupsContainer).toBeVisible();
    await expect(groupsContainer).toContainText('سرنخ');

    // Switch metric to TASKS
    await metricSelect.selectOption('TASKS');
    await expect(groupsContainer).toBeVisible();
  });

  test('should trigger CSV export and display success toast notification', async ({ page }) => {
    await page.locator('[data-testid="nav-reports"]').click();

    const exportBtn = page.locator('[data-testid="export-report-btn"]');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    // Verify toast notification
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('با موفقیت دانلود و در لاگ ممیزی ثبت شد');
  });
});
