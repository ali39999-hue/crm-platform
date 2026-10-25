import { test, expect } from '@playwright/test';

test.describe('CRM Deals Pipeline Kanban & Duplicate Resolution P1 Journey (R-034, R-037)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to CRM tab and inspect Accounts table', async ({ page }) => {
    const crmNav = page.locator('[data-testid="nav-crm"]');
    await expect(crmNav).toBeVisible();
    await crmNav.click();

    // Accounts sub-tab is active by default
    const accountsTab = page.locator('[data-testid="crm-tab-accounts"]');
    await expect(accountsTab).toBeVisible();

    // Verify accounts table
    await expect(page.locator('.data-table')).toBeVisible();
    await expect(page.locator('body')).toContainText('پتروشیمی سپهر');
  });

  test('should switch to Deals Pipeline Kanban and view stages', async ({ page }) => {
    await page.locator('[data-testid="nav-crm"]').click();

    // Switch to Pipeline Kanban tab
    const pipelineTab = page.locator('[data-testid="crm-tab-pipeline"]');
    await expect(pipelineTab).toBeVisible();
    await pipelineTab.click();

    // Verify Deals Kanban board is rendered
    const kanban = page.locator('[data-testid="deals-pipeline-kanban"]');
    await expect(kanban).toBeVisible();
    await expect(kanban).toContainText('برد کانبان فرصت‌ها و خطوط فروش');

    // Verify standard pipeline stages exist
    await expect(page.locator('[data-testid="pipeline-column-DISCOVERY"]')).toBeVisible();
    await expect(page.locator('[data-testid="pipeline-column-PROPOSAL"]')).toBeVisible();
    await expect(page.locator('[data-testid="pipeline-column-NEGOTIATION"]')).toBeVisible();
    await expect(page.locator('[data-testid="pipeline-column-WON"]')).toBeVisible();
    await expect(page.locator('[data-testid="pipeline-column-LOST"]')).toBeVisible();
  });

  test('should transition deal to another pipeline stage via manual select', async ({ page }) => {
    await page.locator('[data-testid="nav-crm"]').click();
    await page.locator('[data-testid="crm-tab-pipeline"]').click();

    // Find the first deal card
    const firstCard = page.locator('[data-testid^="deal-card-"]').first();
    await expect(firstCard).toBeVisible();

    // Transition via stage select
    const select = firstCard.locator('select');
    await expect(select).toBeVisible();
    await select.selectOption('PROPOSAL');

    // Verify toast confirmation
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('منتقل شد');
  });

  test('should switch to Duplicates tab and execute intelligent record merge', async ({ page }) => {
    await page.locator('[data-testid="nav-crm"]').click();

    // Switch to Duplicates sub-tab
    const duplicatesTab = page.locator('[data-testid="crm-tab-duplicates"]');
    await expect(duplicatesTab).toBeVisible();
    await duplicatesTab.click();

    // Verify duplicate review view is rendered
    const dupView = page.locator('[data-testid="duplicate-review-view"]');
    await expect(dupView).toBeVisible();
    await expect(dupView).toContainText('مدیریت و ادغام رکوردهای تکراری');

    // Verify duplicate candidate card
    const candCard = page.locator('[data-testid^="duplicate-card-"]').first();
    await expect(candCard).toBeVisible();
    await expect(candCard).toContainText('تشابه');
    await expect(candCard).toContainText('علیرضا حسینی');

    // Click merge button
    page.on('dialog', (dialog) => dialog.accept());
    const mergeBtn = page.locator('[data-testid^="merge-btn-"]').first();
    await expect(mergeBtn).toBeVisible();
    await mergeBtn.click();

    // Verify toast notification
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('با موفقیت در رکورد اصلی ادغام شد');
  });
});
