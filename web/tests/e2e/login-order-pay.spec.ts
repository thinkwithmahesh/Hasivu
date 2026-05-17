import { test, expect } from '@playwright/test';

test.describe('Critical User Journey: Login -> Order -> Pay', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (assuming it's running locally on port 3000)
    await page.goto('/');
  });

  test('Parent logs in, selects meals, and completes payment', async ({ page }) => {
    // 1. Authentication / Login against the canonical cookie-backed auth route.
    await page.goto('/auth/login');

    await expect(page.getByRole('form', { name: 'Login form' })).toBeVisible();

    await page.getByRole('tab', { name: 'Parent' }).click();
    await page.getByLabel(/email/i).fill(process.env.TEST_PARENT_EMAIL || 'parent.demo@hasivu.local');
    // "Password" label also matches the show-password control's accessible name in strict mode
    await page
      .getByRole('textbox', { name: 'Password' })
      .fill(process.env.TEST_PARENT_PASSWORD || 'Hasivu123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard (parent route renders Parent Dashboard, not login copy)
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /Parent Dashboard/i })).toBeVisible();

    // 2. Select Meals / Ordering via the current parent navigation.
    await page.getByRole('link', { name: 'Menu' }).click();
    await expect(page).toHaveURL(/\/menu/);
    await expect(page.getByRole('heading', { name: /School Menu/i })).toBeVisible();

    await page.getByRole('button', { name: /Quick Add/i }).first().click();

    await page.getByRole('button', { name: /Cart/i }).click();
    await expect(page).toHaveURL(/\/cart/);

    // 3. Review and Pay
    await expect(page.getByRole('heading', { name: /^Cart$/i })).toBeVisible();
    await expect(page.getByText(/^Total\s*₹/i)).toBeVisible();

    // Click checkout
    await page.getByRole('button', { name: /Proceed to checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout/);

    // Verify order success or payment gateway trigger
    await expect(page.getByRole('heading', { name: /Checkout/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pay/i })).toBeVisible();
  });
});
