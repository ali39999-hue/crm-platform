import { test, expect } from '@playwright/test';

test.describe('Workflow & Automation Engine P1 Journey (AUTO-001 & R-070)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to Automations tab and render rules catalog and stats', async ({ page }) => {
    const autoNav = page.locator('[data-testid="nav-automation"]');
    await expect(autoNav).toBeVisible();
    await autoNav.click();

    // Verify Workflow Automation View is rendered
    const view = page.locator('[data-testid="workflow-automation-view"]');
    await expect(view).toBeVisible();
    await expect(view).toContainText('موتور اتوماسیون و گردش‌کارها');

    // Verify stats cards
    await expect(view).toContainText('سقف عمق بازگشتی (Recursion Cap)');
    await expect(view).toContainText('حداکثر ۳ مرحله');
    await expect(view).toContainText('موتور شبیه‌سازی (Dry-run)');

    // Verify seeded rule is displayed
    await expect(view).toContainText('اطلاع‌رسانی خودکار برای وظایف با اولویت فوری');
  });

  test('should toggle rule with kill-switch', async ({ page }) => {
    await page.locator('[data-testid="nav-automation"]').click();

    const view = page.locator('[data-testid="workflow-automation-view"]');
    await expect(view).toBeVisible();

    // Find the first toggle button
    const toggleBtn = page.locator('[data-testid^="toggle-btn-"]').first();
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // Verify toast notification
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Kill Switch');
  });

  test('should create a new automation rule via modal', async ({ page }) => {
    await page.locator('[data-testid="nav-automation"]').click();

    const ruleName = `قانون تست خودکار پلی‌رایت ${Date.now()}`;

    // Open create rule modal
    const createBtn = page.locator('[data-testid="create-rule-btn"]');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    const modal = page.locator('[data-testid="create-rule-modal"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.locator('[data-testid="rule-name-input"]').fill(ruleName);
    await page.locator('[data-testid="rule-trigger-select"]').selectOption('LEAD_CREATED');
    await page.locator('[data-testid="rule-cond-field-input"]').fill('source');
    await page.locator('[data-testid="rule-cond-val-input"]').fill('WEBSITE');
    await page.locator('[data-testid="rule-action-select"]').selectOption('SEND_NOTIFICATION');

    // Submit form
    await page.locator('[data-testid="submit-rule-btn"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Verify rule appears in catalog
    const rulesList = page.locator('[data-testid="automation-rules-list"]');
    await expect(rulesList).toContainText(ruleName);
  });

  test('should simulate rule with sample payload (Dry-run)', async ({ page }) => {
    await page.locator('[data-testid="nav-automation"]').click();

    // Open simulation modal on first rule
    const simBtn = page.locator('[data-testid^="simulate-btn-"]').first();
    await expect(simBtn).toBeVisible();
    await simBtn.click();

    const modal = page.locator('[data-testid="simulate-rule-modal"]');
    await expect(modal).toBeVisible();

    // Run simulation
    const runBtn = page.locator('[data-testid="run-simulate-btn"]');
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // Verify simulation result banner is displayed
    const banner = page.locator('[data-testid="simulate-result-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('مطابقت دارد');
  });

  test('should inspect execution history tab', async ({ page }) => {
    await page.locator('[data-testid="nav-automation"]').click();

    // Switch to history tab
    const historyTabBtn = page.locator('[data-testid="tab-history"]');
    await expect(historyTabBtn).toBeVisible();
    await historyTabBtn.click();

    // Verify execution runs table
    const tbody = page.locator('[data-testid="runs-tbody"]');
    await expect(tbody).toBeVisible();
    await expect(tbody).toContainText('موفقیت‌آمیز');
  });
});
