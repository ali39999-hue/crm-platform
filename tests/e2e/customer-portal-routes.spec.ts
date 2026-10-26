import { test, expect } from '@playwright/test';

test.describe('Customer Portal Dedicated Routes Journey (R-087, R-094)', () => {
  test('should render customer sign-in page and support password/OTP modes', async ({
    page,
  }) => {
    await page.goto('/portal/sign-in');

    const signInCard = page.locator('[data-testid="customer-sign-in-page"]');
    await expect(signInCard).toBeVisible();
    await expect(signInCard).toContainText('ورود به پورتال مشتریان');

    // Email and Password inputs
    const emailInput = page.locator('[data-testid="customer-email-input"]');
    await expect(emailInput).toBeVisible();

    const passInput = page.locator('[data-testid="customer-password-input"]');
    await expect(passInput).toBeVisible();

    // Toggle to OTP mode
    const otpToggle = page.locator('button', { hasText: 'رمز یکبار مصرف (OTP)' });
    await expect(otpToggle).toBeVisible();
    await otpToggle.click();

    // Submit sign in and verify redirect to /portal
    await page.locator('[data-testid="customer-signin-btn"]').click();
  });

  test('should navigate to Customer Help Center and search guides and FAQs', async ({
    page,
  }) => {
    await page.goto('/portal/help');

    const helpPage = page.locator('[data-testid="customer-help-page"]');
    await expect(helpPage).toBeVisible();
    await expect(helpPage).toContainText('مرکز راهنما و پایگاه دانش مشتریان');
    await expect(helpPage).toContainText('چگونه می‌توانیم به شما کمک کنیم؟');

    // Verify guides grid
    const guides = page.locator('[data-testid="guides-grid"]');
    await expect(guides).toBeVisible();
    await expect(guides).toContainText('راهنمای جامع ثبت تیکت');

    // Verify FAQ list
    const faqList = page.locator('[data-testid="faq-list"]');
    await expect(faqList).toBeVisible();
    await expect(faqList).toContainText('SLA');

    // Interact with search input
    const searchInput = page.locator('[data-testid="help-search-input"]');
    await searchInput.fill('تیکت');
    await expect(guides).toContainText('ثبت تیکت');

    // Click contact support CTA
    const cta = page.locator('[data-testid="contact-support-cta"]');
    await expect(cta).toBeVisible();
    await cta.click();

    // Verify navigates back to portal
    await expect(page).toHaveURL(/\/portal/);
  });

  test('should navigate from customer portal to help center via header link', async ({
    page,
  }) => {
    await page.goto('/portal');
    await expect(page.locator('[data-testid="customer-portal"]')).toBeVisible();

    const helpLink = page.locator('[data-testid="portal-nav-help"]');
    await expect(helpLink).toBeVisible();
    await helpLink.click();

    await expect(page).toHaveURL(/\/portal\/help/);
    await expect(page.locator('[data-testid="customer-help-page"]')).toBeVisible();
  });
});
