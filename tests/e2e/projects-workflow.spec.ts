import { test, expect } from '@playwright/test';

test.describe('Enterprise Projects & Milestones P0 Journey (R-040, R-042)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to Projects workspace and inspect active projects', async ({ page }) => {
    // 1. Navigate to Projects
    const projectsNav = page.locator('[data-testid="nav-projects"]');
    await expect(projectsNav).toBeVisible();
    await projectsNav.click();

    // Verify Projects workspace is rendered
    const workspace = page.locator('[data-testid="projects-workspace"]');
    await expect(workspace).toBeVisible();
    await expect(workspace).toContainText('پروژه‌ها و مدیریت اهداف سازمانی');

    // Verify seeded project cards
    await expect(workspace).toContainText('PRJ-CRM');
    await expect(workspace).toContainText('PRJ-PORTAL');

    // Verify selected project detail is rendered
    const title = page.locator('[data-testid="selected-project-title"]');
    await expect(title).toBeVisible();
    await expect(title).toContainText('استقرار و بومی‌سازی پلتفرم جامع');
  });

  test('should create a new project via modal', async ({ page }) => {
    await page.locator('[data-testid="nav-projects"]').click();

    const projKey = `PRJ-${Date.now().toString().slice(-4)}`;
    const projName = `پروژه تست اتوماسیون ${Date.now()}`;

    // Click create project button
    const createBtn = page.locator('[data-testid="create-project-btn"]');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    const modal = page.locator('[data-testid="create-project-modal"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.locator('[data-testid="project-key-input"]').fill(projKey);
    await page.locator('[data-testid="project-name-input"]').fill(projName);

    // Submit form
    await page.locator('[data-testid="submit-project-btn"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Verify toast confirmation
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('ایجاد شد');

    // Verify project appears in list
    const workspace = page.locator('[data-testid="projects-workspace"]');
    await expect(workspace).toContainText(projKey);
    await expect(workspace).toContainText(projName);
  });

  test('should add and toggle milestones within a project', async ({ page }) => {
    await page.locator('[data-testid="nav-projects"]').click();

    const milestoneTitle = `مایل‌استون آزمون E2E ${Date.now()}`;

    // Add milestone
    await page.locator('[data-testid="new-milestone-input"]').fill(milestoneTitle);
    await page.locator('[data-testid="add-milestone-btn"]').click();

    // Verify toast notification
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('مایل‌استون جدید');

    // Verify milestone appears in list
    const milestonesList = page.locator('[data-testid="milestones-list"]');
    await expect(milestonesList).toContainText(milestoneTitle);

    // Toggle the milestone checkbox
    const lastCheckbox = milestonesList.locator('input[type="checkbox"]').last();
    await expect(lastCheckbox).toBeVisible();
    await lastCheckbox.click();

    // Verify toast confirmation
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('به‌روزرسانی شد');
  });
});
