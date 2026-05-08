import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoCriticalAxeViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const criticalViolations = results.violations.filter(violation => violation.impact === 'critical');

  expect(
    criticalViolations,
    `Critical accessibility violations found:\n${JSON.stringify(criticalViolations, null, 2)}`
  ).toHaveLength(0);
}

test.describe('Persona accessibility smoke checks', () => {
  test('auth page role selector is keyboard reachable and has no critical violations', async ({
    page,
  }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('form', { name: 'Login form' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Parent' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Admin' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Kitchen' })).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    await expectNoCriticalAxeViolations(page);
  });

  test('landing page respects reduced-motion preference and has no critical violations', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/HASIVU|School Meals/i);
    await expectNoCriticalAxeViolations(page);
  });
});
