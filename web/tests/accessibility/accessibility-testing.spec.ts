import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility smoke checks', () => {
  test('landing page has no critical accessibility violations', async ({ page, baseURL }) => {
    const target = baseURL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';
    await page.goto(target, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/HASIVU|School Meals/i);

    const results = await new AxeBuilder({ page }).analyze();
    const criticalViolations = results.violations.filter(v => v.impact === 'critical');

    expect(
      criticalViolations,
      `Critical accessibility violations found:\n${JSON.stringify(criticalViolations, null, 2)}`
    ).toHaveLength(0);
  });
});
