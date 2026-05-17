import { expect, test, type Page } from '@playwright/test';

const credentials = {
  parent: {
    tab: 'Parent',
    email: process.env.TEST_PARENT_EMAIL || 'parent.demo@hasivu.local',
    password: process.env.TEST_PARENT_PASSWORD || 'Hasivu123!',
    dashboard: /\/dashboard\/parent|\/dashboard$/,
  },
  admin: {
    tab: 'Admin',
    email: process.env.TEST_ADMIN_EMAIL || 'admin.demo@hasivu.local',
    password: process.env.TEST_ADMIN_PASSWORD || 'Hasivu123!',
    dashboard: /\/dashboard\/admin/,
  },
  kitchen: {
    tab: 'Kitchen',
    email: process.env.TEST_KITCHEN_EMAIL || 'kitchen.demo@hasivu.local',
    password: process.env.TEST_KITCHEN_PASSWORD || 'Hasivu123!',
    dashboard: /\/dashboard\/kitchen/,
  },
} as const;

async function login(page: Page, role: keyof typeof credentials) {
  const account = credentials[role];
  await page.goto('/auth/login');
  await expect(page.getByRole('form', { name: 'Login form' })).toBeVisible();
  await page.getByRole('tab', { name: account.tab }).click();
  await page.getByLabel(/email/i).fill(account.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(account.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(account.dashboard, { timeout: 15000 });
}

async function expectUsablePage(page: Page, heading: RegExp) {
  await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByText(/This page couldn.t load|Request failed with status code 404|404|Page Not Found/i)
  ).not.toBeVisible();
}

function parentDesktopNav(page: Page) {
  return page.getByRole('navigation', { name: 'Parent desktop navigation' });
}

test.describe('Visible role navigation does not route to error pages', () => {
  test('parent dashboard cards and bottom nav routes are usable', async ({ page }) => {
    await login(page, 'parent');
    await expectUsablePage(page, /Parent Dashboard/i);

    await page.getByRole('link', { name: 'Place Orders' }).click();
    await expect(page).toHaveURL(/\/menu/);
    await expectUsablePage(page, /School Menu/i);

    await page.goto('/dashboard/parent');
    await page.getByRole('link', { name: 'Order History' }).click();
    await expect(page).toHaveURL(/\/orders/);
    await expectUsablePage(page, /Meal Orders/i);

    await parentDesktopNav(page).getByRole('link', { name: 'Menu' }).click();
    await expect(page).toHaveURL(/\/menu/);
    await expectUsablePage(page, /School Menu/i);

    await parentDesktopNav(page).getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL(/\/orders/);
    await expectUsablePage(page, /Meal Orders/i);

    await parentDesktopNav(page).getByRole('link', { name: 'Account' }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expectUsablePage(page, /Settings/i);

    const parentRoutes: Array<[string, RegExp]> = [
      ['/dashboard/parent', /Parent Dashboard/i],
      ['/menu', /School Menu/i],
      ['/orders', /Meal Orders/i],
      ['/cart', /Cart|Your cart is empty/i],
      ['/settings', /Settings/i],
      ['/notifications', /Notifications Center/i],
    ];

    for (const [route, heading] of parentRoutes) {
      await page.goto(route);
      await expectUsablePage(page, heading);
    }
  });

  test('admin dashboard visible cards route to usable pages', async ({ page }) => {
    await login(page, 'admin');
    await expectUsablePage(page, /Admin Dashboard/i);

    await page.getByRole('link', { name: /User Management/i }).click();
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText(/This page couldn.t load|404|Page Not Found/i)).not.toBeVisible();

    await page.goto('/dashboard/admin');
    await page.getByRole('link', { name: /Analytics/i }).click();
    await expect(page).toHaveURL(/\/analytics/);
    await expect(page.getByText(/This page couldn.t load|404|Page Not Found/i)).not.toBeVisible();

    const adminRoutes: Array<[string, RegExp]> = [
      ['/dashboard/admin', /Admin Dashboard/i],
      ['/admin/users', /User Management/i],
      ['/analytics', /Platform Analytics/i],
      ['/menu', /School Menu/i],
    ];

    for (const [route, heading] of adminRoutes) {
      await page.goto(route);
      await expectUsablePage(page, heading);
    }
  });

  test('kitchen dashboard visible cards route to usable pages', async ({ page }) => {
    await login(page, 'kitchen');
    await expectUsablePage(page, /Kitchen Management/i);

    await page.getByRole('link', { name: /Preparation Queue/i }).click();
    await expect(page).toHaveURL(/\/kitchen-management/);
    await expectUsablePage(page, /Kitchen/i);

    await page.goto('/dashboard/kitchen');
    await page.getByRole('link', { name: /Inventory/i }).click();
    await expect(page).toHaveURL(/\/kitchen\/inventory/);
    await expect(page.getByText(/This page couldn.t load|404|Page Not Found/i)).not.toBeVisible();

    const kitchenRoutes: Array<[string, RegExp]> = [
      ['/dashboard/kitchen', /Kitchen Management/i],
      ['/kitchen-management', /Kitchen Management/i],
      ['/kitchen/inventory', /Inventory Management/i],
      ['/menu', /School Menu/i],
    ];

    for (const [route, heading] of kitchenRoutes) {
      await page.goto(route);
      await expectUsablePage(page, heading);
    }
  });
});
