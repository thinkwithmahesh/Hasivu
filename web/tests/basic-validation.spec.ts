import { test, expect } from '@playwright/test';

/**
 * Basic Framework Validation Tests
 * Ensures Playwright setup is working correctly
 */

test.describe('Framework Validation', () => {
  test('should validate Playwright is configured correctly', async ({ page }) => {
    // Simple test to validate framework setup
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);
  });

  test('should support basic browser automation', async ({ page }) => {
    await page.goto('https://example.com');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should handle responsive viewports', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.goto('https://example.com');
    await expect(page).toHaveURL(/example.com/);
  });
});