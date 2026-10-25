import { test, expect } from '@playwright/test';

test.describe('Custom Fields & Dynamic Schema Builder P1 Journey (R-039, R-077)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to Settings and inspect Custom Fields tab and table', async ({ page }) => {
    // 1. Navigate to Settings
    const settingsNav = page.locator('[data-testid="nav-settings"]');
    await expect(settingsNav).toBeVisible();
    await settingsNav.click();

    // 2. Click Custom Fields tab
    const fieldsTabBtn = page.locator('[data-testid="tab-fields"]');
    await expect(fieldsTabBtn).toBeVisible();
    await fieldsTabBtn.click();

    // Verify Custom Field Schema Builder is rendered
    const builder = page.locator('[data-testid="custom-field-schema-builder"]');
    await expect(builder).toBeVisible();
    await expect(builder).toContainText('مدیریت اسکیمای فیلدهای سفارشی');

    // Verify seeded fields exist in table
    const tbody = page.locator('[data-testid="custom-fields-tbody"]');
    await expect(tbody).toBeVisible();
    await expect(tbody).toContainText('شناسه ملی / کد اقتصادی');
    await expect(tbody).toContainText('national_id');
    await expect(tbody).toContainText('کانال معرفی فرصت تجاری');
  });

  test('should filter custom fields by entity type pills', async ({ page }) => {
    await page.locator('[data-testid="nav-settings"]').click();
    await page.locator('[data-testid="tab-fields"]').click();

    const tbody = page.locator('[data-testid="custom-fields-tbody"]');

    // Click filter for ACCOUNT
    const accountFilter = page.locator('[data-testid="entity-tab-ACCOUNT"]');
    await expect(accountFilter).toBeVisible();
    await accountFilter.click();

    // Verify only ACCOUNT fields are visible
    await expect(tbody).toContainText('national_id');
    await expect(tbody).not.toContainText('channel_source');

    // Click filter for DEAL
    const dealFilter = page.locator('[data-testid="entity-tab-DEAL"]');
    await dealFilter.click();
    await expect(tbody).toContainText('channel_source');
    await expect(tbody).not.toContainText('national_id');
  });

  test('should create a new custom field via modal', async ({ page }) => {
    await page.locator('[data-testid="nav-settings"]').click();
    await page.locator('[data-testid="tab-fields"]').click();

    const fieldLabel = `کد مالیاتی آزمایشی ${Date.now()}`;
    const fieldKey = `tax_code_${Date.now().toString().slice(-4)}`;

    // Open create modal
    const createBtn = page.locator('[data-testid="create-field-btn"]');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    const modal = page.locator('[data-testid="create-field-modal"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.locator('[data-testid="field-entity-select"]').selectOption('LEAD');
    await page.locator('[data-testid="field-label-input"]').fill(fieldLabel);
    await page.locator('[data-testid="field-key-input"]').fill(fieldKey);
    await page.locator('[data-testid="field-type-select"]').selectOption('TEXT');
    await page.locator('[data-testid="field-required-checkbox"]').check();

    // Submit form
    await page.locator('[data-testid="submit-field-btn"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Verify toast notification
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('با موفقیت افزوده شد');

    // Switch to ALL or LEAD to verify new field
    await page.locator('[data-testid="entity-tab-ALL"]').click();
    const tbody = page.locator('[data-testid="custom-fields-tbody"]');
    await expect(tbody).toContainText(fieldLabel);
    await expect(tbody).toContainText(fieldKey);
  });

  test('should toggle custom field archive status', async ({ page }) => {
    await page.locator('[data-testid="nav-settings"]').click();
    await page.locator('[data-testid="tab-fields"]').click();

    const tbody = page.locator('[data-testid="custom-fields-tbody"]');
    const toggleBtn = tbody.locator('[data-testid^="toggle-active-btn-"]').first();
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // Verify toast notification
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('بایگانی گردید');
  });
});
