import { expect, test } from '@playwright/test';

const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin.demo@hasivu.local';
const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'Hasivu123!';
const kitchenEmail = process.env.TEST_KITCHEN_EMAIL || 'kitchen.demo@hasivu.local';
const kitchenPassword = process.env.TEST_KITCHEN_PASSWORD || 'Hasivu123!';
const parentEmail = process.env.TEST_PARENT_EMAIL || 'parent.demo@hasivu.local';
const parentPassword = process.env.TEST_PARENT_PASSWORD || 'Hasivu123!';

async function loginAs(
  page: import('@playwright/test').Page,
  role: 'Parent' | 'Admin' | 'Kitchen',
  email: string,
  password: string
) {
  await page.goto('/auth/login');
  await expect(page.getByRole('form', { name: 'Login form' })).toBeVisible();
  await page.getByRole('tab', { name: role }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe('Role dashboard journeys', () => {
  test('admin logs in and reaches the admin dashboard', async ({ page }) => {
    await loginAs(page, 'Admin', adminEmail, adminPassword);

    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible();
    await expect(page.getByText(/denied|unauthorized|failed/i)).not.toBeVisible();
  });

  test('kitchen staff logs in and reaches the kitchen dashboard', async ({ page }) => {
    await loginAs(page, 'Kitchen', kitchenEmail, kitchenPassword);

    await expect(page).toHaveURL(/\/dashboard\/kitchen/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /kitchen management/i })).toBeVisible();
    await expect(page.getByText(/denied|unauthorized|failed/i)).not.toBeVisible();
  });
});

test.describe('Auth security journeys', () => {
  for (const route of ['parent', 'admin', 'kitchen', 'student', 'vendor']) {
    test(`unauthenticated dashboard/${route} redirects to login`, async ({ page }) => {
      await page.context().clearCookies();
      await page.goto(`/dashboard/${route}`);

      await expect(page).toHaveURL(/\/auth\/login|\/login/, { timeout: 10000 });
      await expect(page.getByRole('form', { name: 'Login form' })).toBeVisible();
    });
  }

  test('logout clears the session and protected routes require login again', async ({ page }) => {
    await loginAs(page, 'Parent', parentEmail, parentPassword);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/logout');
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });

    await page.goto('/dashboard/parent');
    await expect(page).toHaveURL(/\/auth\/login|\/login/, { timeout: 10000 });
  });
});
