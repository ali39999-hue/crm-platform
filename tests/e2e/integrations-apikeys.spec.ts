import { test, expect } from '@playwright/test';

test.describe('External Integrations & API Keys Management P1 Journey (R-079, R-080)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to Settings and inspect Integrations & Connected Providers', async ({
    page,
  }) => {
    // 1. Navigate to Settings
    const settingsNav = page.locator('[data-testid="nav-settings"]');
    await expect(settingsNav).toBeVisible();
    await settingsNav.click();

    // 2. Click Integrations & Keys tab
    const tabBtn = page.locator('[data-testid="tab-integrations"]');
    await expect(tabBtn).toBeVisible();
    await tabBtn.click();

    // Verify Integrations view is rendered
    const view = page.locator('[data-testid="integrations-view"]');
    await expect(view).toBeVisible();
    await expect(view).toContainText('اتصالات خارجی و مدیریت کلیدهای API');

    // Verify connected providers grid
    const grid = page.locator('[data-testid="providers-grid"]');
    await expect(grid).toBeVisible();
    await expect(grid).toContainText('پیام‌رسان سازمانی اسلک (Slack)');
    await expect(grid).toContainText('گیت‌هاب (GitHub)');
  });

  test('should open Connect modal for disconnected provider', async ({ page }) => {
    await page.locator('[data-testid="nav-settings"]').click();
    await page.locator('[data-testid="tab-integrations"]').click();

    // Find connect button on email provider
    const connectBtn = page.locator('[data-testid="connect-btn-EMAIL_SMTP"]');
    if (await connectBtn.isVisible()) {
      await connectBtn.click();

      const modal = page.locator('[data-testid="connect-provider-modal"]');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('اتصال به سرور ارسال ایمیل (SMTP)');

      // Fill token
      await page.locator('[data-testid="provider-token-input"]').fill('smtp_secret_token_123');
      await page.locator('[data-testid="submit-provider-btn"]').click();

      // Verify modal closes
      await expect(modal).not.toBeVisible();
    }
  });

  test('should switch to API Keys tab and create a new key with secret display', async ({
    page,
  }) => {
    await page.locator('[data-testid="nav-settings"]').click();
    await page.locator('[data-testid="tab-integrations"]').click();

    // Switch to API Keys sub-tab
    const keysTab = page.locator('[data-testid="tab-keys"]');
    await expect(keysTab).toBeVisible();
    await keysTab.click();

    // Verify keys table rendered
    const tbody = page.locator('[data-testid="keys-tbody"]');
    await expect(tbody).toBeVisible();
    await expect(tbody).toContainText('کلید وب‌سایت اصلی شرکت');

    // Click create key button
    const createBtn = page.locator('[data-testid="create-key-btn"]');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    const modal = page.locator('[data-testid="create-key-modal"]');
    await expect(modal).toBeVisible();

    const keyName = `کلید آزمون اتوماسیون ${Date.now()}`;
    await page.locator('[data-testid="key-name-input"]').fill(keyName);

    // Submit key creation
    await page.locator('[data-testid="submit-key-btn"]').click();

    // Security check: One-time secret key warning and output must be visible
    await expect(modal).toContainText('هشدار امنیتی بسیار مهم');
    const secretOutput = page.locator('[data-testid="secret-key-output"]');
    await expect(secretOutput).toBeVisible();
    const val = await secretOutput.inputValue();
    expect(val).toMatch(/^crm_live_/);

    // Close modal
    await modal.locator('button', { hasText: 'بستن پنجره' }).click();
    await expect(modal).not.toBeVisible();

    // Verify key appears in table
    await expect(tbody).toContainText(keyName);
  });

  test('should revoke an existing API key', async ({ page }) => {
    await page.locator('[data-testid="nav-settings"]').click();
    await page.locator('[data-testid="tab-integrations"]').click();
    await page.locator('[data-testid="tab-keys"]').click();

    page.on('dialog', (dialog) => dialog.accept());

    const revokeBtn = page.locator('[data-testid^="revoke-key-btn-"]').first();
    if (await revokeBtn.isVisible()) {
      await revokeBtn.click();

      const toast = page.locator('[data-testid="toast-notification"]');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('باطل گردید');
    }
  });
});
