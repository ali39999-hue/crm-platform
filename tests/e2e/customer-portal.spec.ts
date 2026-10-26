import { test, expect } from '@playwright/test';

test.describe('Customer Portal & Access Boundary P0 Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portal');
    await expect(page.locator('[data-testid="customer-portal"]')).toBeVisible();
  });

  test('should navigate to /portal and display customer support tickets', async ({ page }) => {
    // 1. Verify portal header branding and customer account scope
    await expect(page.locator('header')).toContainText('پورتال خدمات مشتریان');
    await expect(page.locator('header')).toContainText('پتروشیمی سپهر');

    // 2. Verify tickets list is loaded and displays tickets scoped to this customer
    const ticketItems = page.locator('[data-testid="customer-ticket-item"]');
    await expect(ticketItems.first()).toBeVisible();

    // Verify seeded customer tickets exist in list
    await expect(page.locator('[data-testid="customer-portal"]')).toContainText('TKT-1042');
    await expect(page.locator('[data-testid="customer-portal"]')).toContainText('TKT-1038');

    // Verify first ticket is selected by default in conversation pane
    const selectedTitle = page.locator('[data-testid="selected-ticket-title"]');
    await expect(selectedTitle).toBeVisible();
    await expect(selectedTitle).toContainText('عدم دسترسی به ماژول گزارش‌گیری');
  });

  test('should verify internal staff notes are strictly NOT displayed in customer portal', async ({
    page,
  }) => {
    // Select TKT-1042 which contains internal notes in staff backend
    const tkt1042 = page.locator('[data-testid="customer-ticket-item"]', {
      hasText: 'TKT-1042',
    });
    await tkt1042.click();

    const messagesList = page.locator('[data-testid="ticket-messages-list"]');
    await expect(messagesList).toBeVisible();

    // 1. Verify customer-visible shared messages ARE rendered
    await expect(messagesList).toContainText(
      'سلام، ما نمی‌توانیم گزارش خروجی ماهانه را دریافت کنیم',
    );
    await expect(messagesList).toContainText(
      'با سلام، درخواست شما دریافت و در حال بررسی سطح دسترسی سازمانی شما هستیم',
    );

    // 2. Security validation: Internal note MUST NOT leak to customer portal UI
    await expect(messagesList).not.toContainText('یادداشت داخلی');
    await expect(messagesList).not.toContainText('لاگ‌های دسترسی کاربر بررسی شد');
    await expect(messagesList).not.toContainText('نیاز به بازنشانی مجوز دارد');
    await expect(page.locator('body')).not.toContainText('نیاز به بازنشانی مجوز دارد');
  });

  test('should submit a customer reply to the open ticket', async ({ page }) => {
    const replyMessage = `پیام تست مشتری در سامانه - زمان ${Date.now()}`;

    // Fill customer reply
    const replyTextarea = page.locator('[data-testid="ticket-reply-textarea"]');
    await replyTextarea.fill(replyMessage);

    // Click submit
    const submitBtn = page.locator('[data-testid="ticket-reply-submit-btn"]');
    await submitBtn.click();

    // Verify success toast
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('پاسخ شما برای کارشناس پشتیبانی ارسال شد');

    // Verify message appears in conversation thread
    const messagesList = page.locator('[data-testid="ticket-messages-list"]');
    await expect(messagesList).toContainText(replyMessage);
  });

  test('should create a new customer support ticket via modal', async ({ page }) => {
    const ticketTitle = `تیکت جدید مشتری تست ${Date.now()}`;
    const ticketDesc = 'گزارش خطای تستی جهت بررسی فرآیند ایجاد تیکت جدید از طریق پورتال مشتریان';

    // Click new ticket button
    const newTicketBtn = page.locator('[data-testid="create-ticket-btn"]');
    await newTicketBtn.click();

    const modal = page.locator('[data-testid="create-ticket-modal"]');
    await expect(modal).toBeVisible();

    // Fill new ticket form
    await page.locator('[data-testid="new-ticket-title-input"]').fill(ticketTitle);
    await page.locator('[data-testid="new-ticket-priority-select"]').selectOption('HIGH');
    await page.locator('[data-testid="new-ticket-desc-input"]').fill(ticketDesc);

    // Submit ticket
    await page.locator('[data-testid="new-ticket-submit-btn"]').click();

    // Modal closes
    await expect(modal).not.toBeVisible();

    // Toast notification
    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('با موفقیت ثبت شد');

    // Verify ticket appears in list and conversation pane
    await expect(page.locator('[data-testid="selected-ticket-title"]')).toContainText(ticketTitle);
    const ticketsList = page.locator('[data-testid="customer-portal"]');
    await expect(ticketsList).toContainText(ticketTitle);

    // Verify initial message from customer is present in conversation
    const messagesList = page.locator('[data-testid="ticket-messages-list"]');
    await expect(messagesList).toContainText(ticketDesc);
  });

  test('should render Didar CSAT 5-star rating survey on resolved tickets', async ({ page }) => {
    // Select TKT-1038 which has RESOLVED status
    const resolvedTicket = page.locator('[data-testid="customer-ticket-item"]', {
      hasText: 'TKT-1038',
    });
    await resolvedTicket.click();

    // Verify CSAT survey card is displayed
    const csatCard = page.locator('[data-testid="csat-survey-card"]');
    await expect(csatCard).toBeVisible();
    await expect(csatCard).toContainText('ارزیابی کیفیت پاسخگویی');

    // Click 5-star rating and submit
    const star5 = page.locator('[data-testid="csat-star-5"]');
    await expect(star5).toBeVisible();
    await star5.click();

    const submitCsatBtn = page.locator('[data-testid="submit-csat-btn"]');
    await submitCsatBtn.click();

    // Verify thank you message
    await expect(csatCard).toContainText('با تشکر از شما! امتیاز ۵ از ۵ ستاره');
  });
});
