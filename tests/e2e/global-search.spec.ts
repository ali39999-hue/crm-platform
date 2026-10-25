import { test, expect } from '@playwright/test';

test.describe('Global Search & Command Palette P0 Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should open Command Palette via Ctrl+K keyboard shortcut and button trigger', async ({
    page,
  }) => {
    const modal = page.locator('[data-testid="command-palette-modal"]');
    const input = page.locator('[data-testid="command-palette-input"]');

    // Initially modal should not be visible
    await expect(modal).not.toBeVisible();

    // 1. Press Control+K / Meta+K to open
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k');

    // Verify modal is open and input is focused
    await expect(modal).toBeVisible();
    await expect(input).toBeFocused();

    // 2. Press Escape to close
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    // 3. Open via search trigger button in header
    const searchTriggerBtn = page.locator('[data-testid="search-trigger-btn"]');
    await searchTriggerBtn.click();
    await expect(modal).toBeVisible();
    await expect(input).toBeFocused();
  });

  test('should search for task by key (TSK-1001) or title', async ({ page }) => {
    // Open palette
    await page.locator('[data-testid="search-trigger-btn"]').click();
    const modal = page.locator('[data-testid="command-palette-modal"]');
    await expect(modal).toBeVisible();

    const input = page.locator('[data-testid="command-palette-input"]');

    // 1. Search by task key: "TSK-1001"
    await input.fill('TSK-1001');

    // Wait for search debouncing and result items
    const taskResult = page.locator('[data-testid="command-item"]', {
      hasText: 'TSK-1001',
    });
    await expect(taskResult).toBeVisible();
    await expect(taskResult).toContainText('بررسی مدارک و اعتبارسنجی قرارداد مشتری جدید');

    // 2. Search by title keyword: "اعتبارسنجی"
    await input.fill('اعتبارسنجی');
    const titleResult = page.locator('[data-testid="command-item"]', {
      hasText: 'اعتبارسنجی',
    });
    await expect(titleResult).toBeVisible();
    await expect(titleResult).toContainText('TSK-1001');
  });

  test('should select search result and navigate to task in My Work', async ({ page }) => {
    // First switch away from My Work to Overview
    await page.locator('[data-testid="nav-overview"]').click();
    await expect(page.locator('h1')).toContainText('داشبورد سلامت و شاخص‌ها');

    // Open command palette
    await page.locator('[data-testid="search-trigger-btn"]').click();
    const modal = page.locator('[data-testid="command-palette-modal"]');
    await expect(modal).toBeVisible();

    // Search for TSK-1002
    const input = page.locator('[data-testid="command-palette-input"]');
    await input.fill('TSK-1002');

    const resultItem = page.locator('[data-testid="command-item"]', {
      hasText: 'TSK-1002',
    });
    await expect(resultItem).toBeVisible();

    // Click result item to select
    await resultItem.click();

    // Palette modal should close
    await expect(modal).not.toBeVisible();

    // Toast notification confirms selection
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('TSK-1002');

    // Verify automatically navigated to My Work tab
    await expect(page.locator('h1')).toContainText('وظایف و پیگیری‌های من');
    await expect(page.locator('[data-testid="kanban-column-IN_PROGRESS"]')).toContainText(
      'TSK-1002',
    );
  });
});
