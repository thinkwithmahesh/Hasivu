import { test, expect } from '@playwright/test';

// E2E for Admin Staff Scheduling page
// Mocks staff and schedules APIs and verifies dialog opens

test.describe('Admin Staff Scheduling', () => {
  test('should load and open create schedule dialog', async ({ page }) => {
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
      'content-type': 'application/json',
    } as const;

    await page.route('**/staff/members**', async route => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: corsHeaders, body: '' });
        return;
      }
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          data: [
            { id: 'S1', name: 'Anita Sharma', role: 'Cook', email: 'anita@example.com', phone: '9999999999' },
            { id: 'S2', name: 'Rahul Verma', role: 'Assistant', email: 'rahul@example.com', phone: '9999999998' },
          ],
          success: true,
          message: 'ok',
          timestamp: new Date().toISOString(),
        })
      });
    });

    await page.route('**/staff/schedules**', async route => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: corsHeaders, body: '' });
        return;
      }
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          data: [
            { id: 'SC1', staffId: 'S1', date: new Date().toISOString().split('T')[0], shiftId: 'morning', status: 'confirmed' },
            { id: 'SC2', staffId: 'S2', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], shiftId: 'afternoon', status: 'scheduled' },
          ],
          success: true,
          message: 'ok',
          timestamp: new Date().toISOString(),
        })
      });
    });

    await page.goto('/admin/schedule');

    await expect(page.getByTestId('staff-scheduling')).toBeVisible();
    const addBtn = page.getByTestId('create-schedule-button');
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();
    await expect(page.getByRole('heading', { name: 'Create Schedule' })).toBeVisible();
  });
});
