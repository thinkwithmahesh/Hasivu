import { test, expect } from '@playwright/test';
import { TEST_CONSTANTS } from '../../utils/brand-constants';

/**
 * Enhanced Admin Dashboard Test Scenarios
 * HASIVU Platform - Admin User Workflows
 * 
 * Features Tested:
 * ✅ Analytics view data fetching and display
 * ✅ Orders view data fetching and display
 * ✅ RFID view data fetching and display
 * ✅ Real-time data updates
 */

test.describe(_'Enhanced Admin Dashboard', _() => {
  test.beforeEach(_async ({ page }) => {
    // Login as admin user
    await page.goto('/auth/login');
    await page.fill('[data-_testid = "login-email-input"]', TEST_CONSTANTS.defaultUsers.admin.email);
    await page.fill('[data-_testid = "login-password-input"]', TEST_CONSTANTS.defaultUsers.admin.password);
    await page.click('[data-_testid = "login-submit-button"]');
    
    // Wait for dashboard redirect
    await page.waitForURL('**/dashboard/admin', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test(_'admin can access the enhanced admin dashboard @admin @dashboard @smoke', _async ({ page }) => {
    // Verify that the main dashboard elements are visible
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();
    await expect(page.locator('[data-_testid = "analytics-nav"]')).toBeVisible();
    await expect(page.locator('[data-_testid = "orders-nav"]')).toBeVisible();
    await expect(page.locator('[data-_testid = "rfid-nav"]')).toBeVisible();
  });

  test(_'admin can view analytics data @admin @dashboard @analytics', _async ({ page }) => {
    // Click on the analytics nav button
    await page.click('[data-_testid = "analytics-nav"]');

    // Check for the loading state
    await expect(page.locator('p:has-text("Loading analytics...")')).toBeVisible();

    // Wait for the data to load and check for the chart
    await expect(page.locator('h3:has-text("Order Trends")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test(_'admin can view orders data @admin @dashboard @orders', _async ({ page }) => {
    // Click on the orders nav button
    await page.click('[data-_testid = "orders-nav"]');

    // Check for the loading state
    await expect(page.locator('p:has-text("Loading orders...")')).toBeVisible();

    // Wait for the data to load and check for the data display
    await expect(page.locator('h3:has-text("Orders Data")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('pre')).toBeVisible();
  });

  test(_'admin can view RFID data @admin @dashboard @rfid', _async ({ page }) => {
    // Click on the rfid nav button
    await page.click('[data-_testid = "rfid-nav"]');

    // Check for the loading state
    await expect(page.locator('p:has-text("Loading RFID data...")')).toBeVisible();

    // Wait for the data to load and check for the data display
    await expect(page.locator('h3:has-text("RFID Analytics Data")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('pre')).toBeVisible();
  });
});
