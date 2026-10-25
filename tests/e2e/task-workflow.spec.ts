import { test, expect } from '@playwright/test';

test.describe('Task Workflow & State Machine P0 Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the workspace application to finish initial loading
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load dashboard and navigate between Overview and My Work', async ({ page }) => {
    // 1. Navigate to Overview
    const overviewNav = page.locator('[data-testid="nav-overview"]');
    await overviewNav.click();
    await expect(page.locator('h1')).toContainText('داشبورد سلامت و شاخص‌ها');
    await expect(page.locator('.summary-grid')).toBeVisible();

    // 2. Navigate to My Work
    const myWorkNav = page.locator('[data-testid="nav-my-work"]');
    await myWorkNav.click();
    await expect(page.locator('h1')).toContainText('وظایف و پیگیری‌های من');

    // Verify kanban board is displayed by default
    await expect(page.locator('.kanban-board')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-column-TODO"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-column-IN_PROGRESS"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-column-IN_REVIEW"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-column-DONE"]')).toBeVisible();
  });

  test('should create a new task via modal and display it in TODO', async ({ page }) => {
    const taskTitle = `تسک تست پلی‌رایت ${Date.now()}`;
    const taskDesc = 'شرح سناریوی اعتبارسنجی ایجاد تسک جدید برای تست E2E';

    // Open create task modal
    const createBtn = page.locator('[data-testid="create-task-btn"]');
    await createBtn.click();

    const modal = page.locator('[data-testid="create-task-modal"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.locator('[data-testid="task-title-input"]').fill(taskTitle);
    await page.locator('[data-testid="task-desc-input"]').fill(taskDesc);
    await page.locator('[data-testid="task-priority-select"]').selectOption('HIGH');
    await page.locator('[data-testid="task-due-input"]').fill('۱۴۰۵/۰۸/۲۰');

    // Submit form
    await page.locator('[data-testid="task-submit-btn"]').click();

    // Verify modal is closed
    await expect(modal).not.toBeVisible();

    // Verify toast confirmation
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('با موفقیت ایجاد شد');

    // Verify new task card is in the TODO column
    const todoColumn = page.locator('[data-testid="kanban-column-TODO"]');
    await expect(todoColumn).toContainText(taskTitle);
  });

  test('should move task through full workflow (TODO -> IN_PROGRESS -> IN_REVIEW -> DONE)', async ({
    page,
  }) => {
    // We will use TSK-1001 which is seeded in TODO state
    const taskCard = page.locator('[data-testid="task-card-TSK-1001"]');
    await expect(taskCard).toBeVisible();
    await expect(page.locator('[data-testid="kanban-column-TODO"]')).toContainText('TSK-1001');

    // Step 1: Transition TODO -> IN_PROGRESS
    const startBtn = taskCard.locator('[data-testid="transition-btn-TODO"]');
    await startBtn.click();

    const toast1 = page.locator('[data-testid="toast-notification"]');
    await expect(toast1).toBeVisible();
    await expect(toast1).toContainText('در حال انجام');

    // Verify task is now in IN_PROGRESS column
    const inProgressColumn = page.locator('[data-testid="kanban-column-IN_PROGRESS"]');
    await expect(inProgressColumn).toContainText('TSK-1001');

    // Step 2: Transition IN_PROGRESS -> IN_REVIEW
    const reviewBtn = taskCard.locator('[data-testid="transition-btn-IN_PROGRESS"]');
    await reviewBtn.click();

    const toast2 = page.locator('[data-testid="toast-notification"]');
    await expect(toast2).toBeVisible();
    await expect(toast2).toContainText('در انتظار بازبینی');

    // Verify task is now in IN_REVIEW column
    const inReviewColumn = page.locator('[data-testid="kanban-column-IN_REVIEW"]');
    await expect(inReviewColumn).toContainText('TSK-1001');

    // Step 3: Transition IN_REVIEW -> DONE
    const doneBtn = taskCard.locator('[data-testid="transition-btn-IN_REVIEW"]');
    await doneBtn.click();

    const toast3 = page.locator('[data-testid="toast-notification"]');
    await expect(toast3).toBeVisible();
    await expect(toast3).toContainText('تکمیل‌شده');

    // Verify task is now in DONE column
    const doneColumn = page.locator('[data-testid="kanban-column-DONE"]');
    await expect(doneColumn).toContainText('TSK-1001');
  });

  test('should block invalid direct transition from TODO to DONE', async ({ page }) => {
    // Create a fresh task in TODO or use a task in TODO
    const taskTitle = `تسک آزمون گذار نامعتبر ${Date.now()}`;
    await page.locator('[data-testid="create-task-btn"]').click();
    await page.locator('[data-testid="task-title-input"]').fill(taskTitle);
    await page.locator('[data-testid="task-submit-btn"]').click();
    await expect(page.locator('[data-testid="create-task-modal"]')).not.toBeVisible();

    const todoColumn = page.locator('[data-testid="kanban-column-TODO"]');
    await expect(todoColumn).toContainText(taskTitle);

    // Locate the newly created card
    const card = todoColumn.locator('article', { hasText: taskTitle });
    await expect(card).toBeVisible();

    // Attempt illegal transition directly from TODO to DONE using transition selector
    const transitionSelect = card.locator('select[aria-label="انتقال دستی وضعیت"]');
    await transitionSelect.selectOption('DONE');

    // Verify that domain state machine blocked the transition and showed error toast
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('خطای دامنه: انتقال مستقیم');

    // Verify the card was NOT moved to DONE and remains in TODO
    const doneColumn = page.locator('[data-testid="kanban-column-DONE"]');
    await expect(doneColumn).not.toContainText(taskTitle);
    await expect(todoColumn).toContainText(taskTitle);
  });
});
