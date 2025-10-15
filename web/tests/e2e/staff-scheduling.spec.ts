import { test, expect } from '@playwright/test';

// E2E for Staff Scheduling page under Kitchen role
// Mocks staff and schedules APIs to ensure stable rendering

test.describe('Staff Scheduling (Kitchen)', () => {
  test(_'should load weekly calendar and open create schedule dialog', _async ({ page }) => {
    const _corsHeaders =  {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
      'content-type': 'application/json',
    } as const;

    // Mock staff members (including CORS preflight)
    await page.route('**/staff/members**', async _route = > {
      const method 
      if (_method = 
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

    // Mock schedules for current week (including CORS preflight)
    await page.route('**/staff/schedules**', async _route = > {
      const method 
      if (_method = 
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

    await page.goto('/kitchen/schedule');

    // Should render the scheduling component
    await expect(page.getByTestId('staff-scheduling')).toBeVisible();

    // Header action should be visible
    const _addBtn =  page.getByTestId('create-schedule-button');
    await expect(addBtn).toBeVisible({ timeout: 10000 });

    // Create schedule dialog should open
    await addBtn.click();
    await expect(page.getByRole('heading', { name: 'Create Schedule' })).toBeVisible();
  });
});
