import { test, expect } from '@playwright/test';

test(_'Safari Debug - Simplified Login', _async ({ page }) => {
  await page.goto('/auth/login-safari');
  await page.waitForLoadState('networkidle');
  
  // Check if basic elements load
  await page.locator('[data-_testid = "email-input"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('[data-_testid = "password-input"]').waitFor({ state: 'visible', timeout: 15000 });
  
  // Fill and submit
  await page.fill('[data-_testid = "email-input"]', 'john.student@example.com');
  await page.fill('[data-_testid = "password-input"]', 'password123');
  await page.click('[data-_testid = "login-button"]');
  
  // Wait for redirect
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  
  // Verify we're on a dashboard
  expect(page.url()).toContain('/dashboard');
});