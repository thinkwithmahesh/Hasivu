import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002';

test.describe('RFID Verification Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(`${BASE}/auth/login`);
    // Assuming student role since it's an RFID verification flow
    await page.getByRole('tab', { name: 'Student' }).click();
    await page
      .getByLabel(/email/i)
      .fill(process.env.TEST_STUDENT_EMAIL || 'student.demo@hasivu.local');
    await page.getByRole('textbox', { name: 'Password' }).fill('Hasivu123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Student can navigate to RFID verification and view status', async ({ page }) => {
    await page.goto(`${BASE}/rfid-verification`);

    // Verify the page loads
    await expect(page.getByRole('heading', { name: /RFID/i })).toBeVisible();

    // Verify there's an input or a prompt to scan the card
    // Note: Adjust the accessible names depending on how the UI is actually structured
    const input = page.getByPlaceholder(/Scan/i).or(page.getByRole('textbox', { name: /rfid/i }));

    if ((await input.count()) > 0) {
      await expect(input).toBeVisible();
    } else {
      await expect(page.getByText(/Ready to Scan/i)).toBeVisible();
    }
  });
});
