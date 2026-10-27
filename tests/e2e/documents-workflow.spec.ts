import { test, expect } from '@playwright/test';

test.describe('Enterprise Documents & Knowledge Base P1 Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to Documents workspace and render spaces and default document', async ({
    page,
  }) => {
    const docsNav = page.locator('[data-testid="nav-docs"]');
    await expect(docsNav).toBeVisible();
    await docsNav.click();

    // Verify Documents workspace layout is rendered
    const workspace = page.locator('[data-testid="documents-workspace"]');
    await expect(workspace).toBeVisible();

    // Verify Spaces tree
    await expect(workspace).toContainText('پایگاه دانش عمومی');
    await expect(workspace).toContainText('راهنماهای مشتریان');

    // Verify seeded documents are listed
    await expect(workspace).toContainText('دستورالعمل امنیت داده‌ها');

    // Verify selected document details are displayed
    const docTitle = page.locator('[data-testid="selected-doc-title"]');
    await expect(docTitle).toBeVisible();
    await expect(docTitle).toContainText('دستورالعمل امنیت داده‌ها');

    const contentView = page.locator('[data-testid="document-content-view"]');
    await expect(contentView).toBeVisible();
    await expect(contentView).toContainText('سیاست‌های امنیت اطلاعات');
  });

  test('should create a new document via modal and list it', async ({ page }) => {
    const docsNav = page.locator('[data-testid="nav-docs"]');
    await docsNav.click();

    const newDocTitle = `سند آموزشی پلی‌رایت ${Date.now()}`;
    const newDocContent = '# راهنمای تست E2E\nاین یک سند تستی خودکار برای سیستم مستندات است.';

    // Open create document modal
    const createBtn = page.locator('[data-testid="create-doc-btn"]');
    await createBtn.click();

    const modal = page.locator('[data-testid="create-document-modal"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.locator('[data-testid="doc-title-input"]').fill(newDocTitle);
    await page.locator('[data-testid="doc-content-textarea"]').fill(newDocContent);
    await page.locator('[data-testid="doc-visibility-select"]').selectOption('WORKSPACE');

    // Submit form
    await page.locator('[data-testid="doc-submit-btn"]').click();

    // Modal closes
    await expect(modal).not.toBeVisible();

    // Toast notification
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('با موفقیت ایجاد شد');

    // Document appears in list and content viewer
    await expect(page.locator('[data-testid="documents-workspace"]')).toContainText(newDocTitle);
    await expect(page.locator('[data-testid="selected-doc-title"]')).toContainText(newDocTitle);
    await expect(page.locator('[data-testid="document-content-view"]')).toContainText(
      'راهنمای تست E2E',
    );
  });

  test('should edit an existing document and verify revision increment', async ({ page }) => {
    const docsNav = page.locator('[data-testid="nav-docs"]');
    await docsNav.click();

    // Click edit document button
    const editBtn = page.locator('[data-testid="edit-doc-btn"]');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Edit textarea
    const textarea = page.locator('[data-testid="edit-doc-textarea"]');
    await expect(textarea).toBeVisible();
    await textarea.fill('# ویرایش جدید\nمحتوای به‌روزرسانی‌شده توسط آزمون E2E');

    // Save changes
    const saveBtn = page.locator('[data-testid="save-doc-btn"]');
    await saveBtn.click();

    // Toast confirmation
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('نسخه جدید ثبت شد');

    // Verify content updated
    const contentView = page.locator('[data-testid="document-content-view"]');
    await expect(contentView).toContainText('محتوای به‌روزرسانی‌شده');

    // Verify version updated to 2
    await expect(page.locator('[data-testid="documents-workspace"]')).toContainText(/نسخه [2۲]/);
  });

  test('should view revision history drawer and inspect versions', async ({ page }) => {
    const docsNav = page.locator('[data-testid="nav-docs"]');
    await docsNav.click();

    // Open revisions drawer
    const revToggleBtn = page.locator('[data-testid="revisions-toggle-btn"]');
    await revToggleBtn.click();

    const drawer = page.locator('[data-testid="revisions-drawer"]');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('تاریخچه ویرایش‌ها');
    await expect(drawer).toContainText(/نسخه [1۱]/);
  });

  test('should verify customer portal only accesses published customer-visible documents', async ({
    page,
  }) => {
    await page.goto('/portal');
    await expect(page.locator('[data-testid="customer-portal"]')).toBeVisible();

    // Switch to Knowledge Base tab in Customer Portal
    const docTabBtn = page.locator('[data-testid="portal-tab-documents"]');
    await expect(docTabBtn).toBeVisible();
    await docTabBtn.click();

    const workspace = page.locator('[data-testid="documents-workspace"]');
    await expect(workspace).toBeVisible();

    // 1. Customer-visible guide MUST be visible
    await expect(workspace).toContainText('راهنمای جامع ثبت تیکت و پیگیری پشتیبانی');

    // 2. Internal and private docs MUST NOT be visible or accessible to customer
    await expect(workspace).not.toContainText('دستورالعمل امنیت داده‌ها و حریم خصوصی');
    await expect(workspace).not.toContainText('پیش‌نویس محرمانه استراتژی تجاری');
    await expect(page.locator('body')).not.toContainText('پیش‌نویس محرمانه استراتژی تجاری');
  });
});
