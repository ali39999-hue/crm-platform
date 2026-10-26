import { test, expect } from '@playwright/test';

test.describe('Teams & Department Management P1 Journey (R-075)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to Settings and inspect Teams & Departments tab', async ({ page }) => {
    // 1. Navigate to Settings
    const settingsNav = page.locator('[data-testid="nav-settings"]');
    await expect(settingsNav).toBeVisible();
    await settingsNav.click();

    // 2. Click Teams tab
    const teamsTabBtn = page.locator('[data-testid="tab-teams"]');
    await expect(teamsTabBtn).toBeVisible();
    await teamsTabBtn.click();

    // Verify Teams Manager view rendered
    const view = page.locator('[data-testid="teams-manager-view"]');
    await expect(view).toBeVisible();
    await expect(view).toContainText('مدیریت دپارتمان‌ها و تیم‌های سازمانی');

    // Verify seeded teams in grid
    const grid = page.locator('[data-testid="teams-grid"]');
    await expect(grid).toBeVisible();
    await expect(grid).toContainText('تیم مهندسی و توسعه محصول');
    await expect(grid).toContainText('تیم پشتیبانی و خدمات مشتریان');
  });

  test('should create a new team via modal', async ({ page }) => {
    await page.locator('[data-testid="nav-settings"]').click();
    await page.locator('[data-testid="tab-teams"]').click();

    const teamTitle = `تیم بازاریابی و رشد ${Date.now()}`;

    // Open create team modal
    const createBtn = page.locator('[data-testid="create-team-btn"]');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    const modal = page.locator('[data-testid="create-team-modal"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.locator('[data-testid="team-name-input"]').fill(teamTitle);

    // Submit form
    await page.locator('[data-testid="submit-team-btn"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Verify toast confirmation
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('تشکیل شد');

    // Verify team appears in grid
    const grid = page.locator('[data-testid="teams-grid"]');
    await expect(grid).toContainText(teamTitle);
  });

  test('should add a member to an existing team', async ({ page }) => {
    await page.locator('[data-testid="nav-settings"]').click();
    await page.locator('[data-testid="tab-teams"]').click();

    const addMemberBtn = page.locator('[data-testid^="add-member-to-team-btn-"]').first();
    if (await addMemberBtn.isVisible()) {
      await addMemberBtn.click();

      const modal = page.locator('[data-testid="add-member-modal"]');
      await expect(modal).toBeVisible();

      const confirmBtn = page.locator('[data-testid="confirm-add-member-btn"]');
      await expect(confirmBtn).toBeVisible();
      await confirmBtn.click();

      // Verify toast confirmation
      const toast = page.locator('[data-testid="toast-notification"]');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('اضافه شد');
    }
  });
});
