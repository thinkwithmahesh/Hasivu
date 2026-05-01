import { test, expect } from '@playwright/test';

test.describe('Critical User Journey: Login -> Order -> Pay', () => {
  // Use a unique suffix for this test run to prevent user collisions if running in parallel
  const timestamp = Date.now();
  const testEmail = `parent_${timestamp}@test.com`;

  test.beforeEach(async ({ page }) => {
    // Navigate to the app (assuming it's running locally on port 3000)
    await page.goto('/');
  });

  test('Parent logs in, selects meals, and completes payment', async ({ page }) => {
    // 1. Authentication / Login (Simulated via bypassing to dashboard or using the login form)
    // We navigate to /login and fill out the mock parent credentials
    await page.goto('/login');

    // Expect login page to be loaded
    await expect(page.getByRole('heading', { name: /Sign in|Login/i })).toBeVisible();

    // Fill credentials (assuming test accounts are seeded or mock server is running)
    await page.getByLabel(/email/i).fill('parent@hasivu.com');
    await page.getByLabel(/password/i).fill('Hasivu@123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Welcome back/i)).toBeVisible();

    // 2. Select Meals / Ordering
    // Navigate to the ordering page
    await page.getByRole('link', { name: /Order Meals/i }).click();
    await expect(page).toHaveURL(/\/order/);

    // Add a meal to the cart (Find a meal card and click 'Add' or '+' button)
    const firstMealCard = page.locator('.meal-card').first();
    await expect(firstMealCard).toBeVisible();
    await firstMealCard.getByRole('button', { name: /Add|Order/i }).click();

    // Open the Drawer / Cart
    await page.getByRole('button', { name: /View Cart/i }).click();

    // 3. Review and Pay
    // Verify item is in cart
    await expect(page.getByRole('dialog', { name: /Cart/i })).toBeVisible();
    await expect(page.getByText(/Total/i)).toBeVisible();

    // Click checkout
    await page.getByRole('button', { name: /Checkout/i }).click();

    // Verify order success or payment gateway trigger
    // Since we can't fully mock Razorpay in e2e without a sandbox mock, we look for the intent
    await expect(page.getByText(/Order Placed|Proceeding to Payment/i)).toBeVisible();
  });
});
