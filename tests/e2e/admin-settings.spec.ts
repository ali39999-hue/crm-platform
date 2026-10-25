import { test, expect } from '@playwright/test';

test.describe('Admin Settings & Organization Management P0 Journey (R-072, R-073)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to organization settings and view workspace details', async ({ page }) => {
    // 1. Navigate to Settings
    const settingsNav = page.locator('[data-testid="nav-settings"]');
    await expect(settingsNav).toBeVisible();
    await settingsNav.click();

    // Verify Admin Settings View is rendered
    const view = page.locator('[data-testid="admin-settings-view"]');
    await expect(view).toBeVisible();
    await expect(view).toContainText('تنظیمات و مدیریت سازمان');

    // Verify workspace name input
    const orgNameInput = page.locator('[data-testid="org-name-input"]');
    await expect(orgNameInput).toBeVisible();
    await expect(orgNameInput).toHaveValue('شرکت آلفا (اصلی)');
  });

  test('should update organization name and data retention policy', async ({ page }) => {
    await page.locator('[data-testid="nav-settings"]').click();

    const newOrgName = `هلدینگ پیشرو سازمانی ${Date.now()}`;
    const orgNameInput = page.locator('[data-testid="org-name-input"]');
    await orgNameInput.fill(newOrgName);

    // Click save settings button
    const saveBtn = page.locator('[data-testid="save-settings-btn"]');
    await saveBtn.click();

    // Verify success toast notification
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('تنظیمات سازمان و سیاست‌های نگهداری با موفقیت ذخیره شد');

    // Verify value persisted
    await expect(orgNameInput).toHaveValue(newOrgName);
  });

  test('should switch to members tab and invite a new team member', async ({ page }) => {
    await page.locator('[data-testid="nav-settings"]').click();

    // Switch to Members tab
    const membersTabBtn = page.locator('[data-testid="tab-members"]');
    await expect(membersTabBtn).toBeVisible();
    await membersTabBtn.click();

    // Verify members table is displayed
    const tbody = page.locator('[data-testid="members-tbody"]');
    await expect(tbody).toBeVisible();
    await expect(tbody).toContainText('علی مدیر');
    await expect(tbody).toContainText('سارا احمدی');

    // Open invite member modal
    const inviteBtn = page.locator('[data-testid="invite-member-btn"]');
    await expect(inviteBtn).toBeVisible();
    await inviteBtn.click();

    const modal = page.locator('[data-testid="invite-member-modal"]');
    await expect(modal).toBeVisible();

    // Fill invite form
    const memberName = 'سینا کریمی';
    const memberEmail = `sina.${Date.now()}@org-alpha.com`;
    await page.locator('[data-testid="invite-name-input"]').fill(memberName);
    await page.locator('[data-testid="invite-email-input"]').fill(memberEmail);
    await page.locator('[data-testid="invite-role-select"]').selectOption('Sales');

    // Submit form
    await page.locator('[data-testid="invite-submit-btn"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Verify member appears in table
    await expect(tbody).toContainText(memberName);
    await expect(tbody).toContainText(memberEmail);
  });

  test('should inspect roles and permissions matrix tab', async ({ page }) => {
    await page.locator('[data-testid="nav-settings"]').click();

    // Switch to Roles tab
    const rolesTabBtn = page.locator('[data-testid="tab-roles"]');
    await expect(rolesTabBtn).toBeVisible();
    await rolesTabBtn.click();

    // Verify all discrete roles are listed
    await expect(page.locator('[data-testid="admin-settings-view"]')).toContainText(
      'مالک سیستم (SystemOwner)',
    );
    await expect(page.locator('[data-testid="admin-settings-view"]')).toContainText(
      'مدیر سازمان (OrganizationAdmin)',
    );
    await expect(page.locator('[data-testid="admin-settings-view"]')).toContainText(
      'کاربر پورتال مشتری (CustomerPortalUser)',
    );
  });
});
