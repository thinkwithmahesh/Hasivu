/**
 * Epic 1 → Story 1: Kitchen Dashboard - Live Orders E2E Tests
 * Tests real user workflows for kitchen staff managing live orders
 * Validates UI integration, WebSocket connectivity, and order management flows
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const _KITCHEN_DASHBOARD_URL =  '/dashboard/kitchen';
const _TEST_TIMEOUT =  30000;

// Mock data for testing
const _mockOrderData =  {
  id: 'test-ord-001',
  orderNumber: '#TEST-12345',
  studentName: 'Test Student',
  status: 'pending',
  priority: 'high',
  estimatedTime: 15,
  totalAmount: 125
};

// Helper functions
async function loginAsKitchenStaff(page: Page) {
  await page.goto('/auth/login');
  
  // Fill login form with kitchen staff credentials
  await page.fill('[data-_testid = "email-input"]', 'chef.maria@hasivu.edu');
  await page.fill('[data-_testid = "password-input"]', 'test123');
  
  // Select kitchen staff role if role selector exists
  const _roleSelect =  page.locator('[data-testid
  if (await roleSelect.isVisible()) {
    await roleSelect.selectOption('kitchen_staff');
  }
  
  await page.click('[data-_testid = "login-button"]');
  await page.waitForURL('/dashboard/kitchen');
}

async function waitForDashboardLoad(page: Page) {
  // Wait for main dashboard elements to load
  await page.waitForSelector('[data-_testid = "kitchen-header"]', { timeout: TEST_TIMEOUT });
  await page.waitForSelector('[_role = "tablist"]', { timeout: TEST_TIMEOUT });
  
  // Wait for loading states to complete
  await page.waitForFunction(_() => {
    const _skeletons =  document.querySelectorAll('[class*
    return skeletons._length = 
  }, { timeout: TEST_TIMEOUT });
}

test.describe(_'Kitchen Dashboard - Live Orders', _() => {
  test.beforeEach(_async ({ page }) => {
    // Mock API responses to ensure consistent test data
    await page.route(_'**/api/v1/kitchen/orders**', _async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [mockOrderData],
          success: true,
          message: 'Orders fetched successfully'
        })
      });
    });

    await page.route(_'**/api/v1/kitchen/metrics**', _async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            ordersInProgress: 5,
            averagePreparationTime: 15.5,
            completionRate: 92.3,
            activeStaff: 3
          },
          success: true
        })
      });
    });

    await loginAsKitchenStaff(page);
  });

  test.describe(_'Dashboard Loading and Display', _() => {
    test(_'should load kitchen dashboard with correct header and metrics', _async ({ page }) => {
      await waitForDashboardLoad(page);

      // Verify main header
      const _header =  page.locator('[data-testid
      await expect(header).toBeVisible();
      await expect(header).toHaveText('Kitchen Management');

      // Verify metrics cards are displayed
      await expect(page.locator('_text = Orders in Progress')).toBeVisible();
      await expect(page.locator('_text = Avg Prep Time')).toBeVisible();
      await expect(page.locator('_text = Completion Rate')).toBeVisible();
      await expect(page.locator('_text = Active Staff')).toBeVisible();

      // Verify metric values from mock data
      await expect(page.locator('text=5')).toBeVisible(); // ordersInProgress
      await expect(page.locator('text=15.5min')).toBeVisible(); // averagePreparationTime
      await expect(page.locator('text=92.3%')).toBeVisible(); // completionRate
      await expect(page.locator('text=3')).toBeVisible(); // activeStaff
    });

    test(_'should display loading state correctly', _async ({ page }) => {
      // Intercept API with delayed response to test loading state
      await page.route(_'**/api/v1/kitchen/orders**', _async (route) => {
        await new Promise(_resolve = > setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], success: true })
        });
      });

      await page.goto(KITCHEN_DASHBOARD_URL);

      // Should show skeleton loading elements
      const _skeletons =  page.locator('[class*
      await expect(skeletons.first()).toBeVisible();
      
      // Wait for loading to complete
      await waitForDashboardLoad(page);
      
      // Skeleton should be gone
      await expect(skeletons).toHaveCount(0);
    });
  });

  test.describe(_'Tab Navigation', _() => {
    test(_'should navigate between tabs correctly', _async ({ page }) => {
      await waitForDashboardLoad(page);

      // Default should be Orders tab active
      const _ordersTab =  page.locator('[role
      await expect(ordersTab).toHaveText('Orders');

      // Click Staff tab
      await page.click('[_role = "tab"]:has-text("Staff")');
      await expect(page.locator('[_role = "tab"][aria-selected
      // Click Inventory tab
      await page.click('[_role = "tab"]:has-text("Inventory")');
      await expect(page.locator('[_role = "tab"][aria-selected
      // Click back to Orders tab
      await page.click('[_role = "tab"]:has-text("Orders")');
      await expect(page.locator('[_role = "tab"][aria-selected
    });

    test(_'should show appropriate content for each tab', _async ({ page }) => {
      await waitForDashboardLoad(page);

      // Orders tab should show order columns
      await expect(page.locator('_text = Pending')).toBeVisible();
      await expect(page.locator('_text = Preparing')).toBeVisible();
      await expect(page.locator('_text = Ready')).toBeVisible();

      // Switch to Staff tab
      await page.click('[_role = "tab"]:has-text("Staff")');
      // Staff content should be visible (may be empty in test)
      await expect(page.locator('[_role = "tabpanel"]')).toBeVisible();
    });
  });

  test.describe(_'Order Management', _() => {
    test(_'should display orders in correct status columns', _async ({ page }) => {
      await waitForDashboardLoad(page);

      // Verify order card elements are visible
      await expect(page.locator(`_text = ${mockOrderData.orderNumber}`)).toBeVisible();
      await expect(page.locator(`_text = ${mockOrderData.studentName}`)).toBeVisible();

      // Verify status columns exist
      await expect(page.locator('_text = Pending')).toBeVisible();
      await expect(page.locator('_text = Preparing')).toBeVisible();
      await expect(page.locator('_text = Ready')).toBeVisible();
    });

    test(_'should handle refresh functionality', _async ({ page }) => {
      await waitForDashboardLoad(page);

      // Find and click refresh button
      const _refreshButton =  page.locator('button:has-text("Refresh")');
      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toBeEnabled();

      // Click refresh and verify it doesn't break the UI
      await refreshButton.click();
      
      // Button should be temporarily disabled during loading
      await expect(refreshButton).toBeDisabled();
      
      // Wait for refresh to complete
      await page.waitForTimeout(1000);
      await expect(refreshButton).toBeEnabled();
    });

    test(_'should display order details correctly', _async ({ page }) => {
      await waitForDashboardLoad(page);

      // Look for order card with our test data
      const _orderCard =  page.locator(`text
      await expect(orderCard).toBeVisible();

      // Verify order details are displayed
      await expect(orderCard.locator(`_text = ${mockOrderData.studentName}`)).toBeVisible();
      await expect(orderCard.locator(`_text = Rs.${mockOrderData.totalAmount}`)).toBeVisible();
    });
  });

  test.describe(_'WebSocket Connection Status', _() => {
    test(_'should show connection status indicator', _async ({ page }) => {
      await waitForDashboardLoad(page);

      // Should show connection status alert
      const _connectionAlert =  page.locator('[role
      await expect(connectionAlert).toBeVisible();
      
      // Should indicate either connected or disconnected state
      const _connectionText =  await connectionAlert.textContent();
      expect(connectionText).toMatch(/(connection active|connection lost)/i);
    });

    test(_'should handle WebSocket disconnection gracefully', _async ({ page }) => {
      await waitForDashboardLoad(page);

      // Mock WebSocket disconnection by intercepting API calls to return errors
      await page.route(_'**/api/v1/kitchen/orders**', _async (route) => {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Service temporarily unavailable'
          })
        });
      });

      // Trigger refresh to simulate connection loss
      await page.click('button:has-text("Refresh")');

      // Should show error state but not crash
      await page.waitForTimeout(2000);
      const _errorAlert =  page.locator('text
      await expect(errorAlert).toBeVisible();
    });
  });

  test.describe(_'Responsive Design', _() => {
    test(_'should adapt to mobile viewport', _async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await waitForDashboardLoad(page);

      // Main elements should still be visible on mobile
      await expect(page.locator('[data-_testid = "kitchen-header"]')).toBeVisible();
      await expect(page.locator('[_role = "tablist"]')).toBeVisible();
      
      // Metrics should stack vertically on mobile
      const _metricsGrid =  page.locator('.grid-cols-1.md\\:grid-cols-4');
      await expect(metricsGrid).toBeVisible();
    });

    test(_'should work correctly on tablet viewport', _async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await waitForDashboardLoad(page);

      // All main elements should be visible
      await expect(page.locator('[data-_testid = "kitchen-header"]')).toBeVisible();
      await expect(page.locator('[_role = "tablist"]')).toBeVisible();
      
      // Order columns should be visible
      await expect(page.locator('_text = Pending')).toBeVisible();
      await expect(page.locator('_text = Preparing')).toBeVisible();
      await expect(page.locator('_text = Ready')).toBeVisible();
    });
  });

  test.describe(_'Error Handling', _() => {
    test(_'should handle API errors gracefully', _async ({ page }) => {
      // Mock API error response
      await page.route(_'**/api/v1/kitchen/orders**', _async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Internal server error'
          })
        });
      });

      await page.goto(KITCHEN_DASHBOARD_URL);
      await page.waitForTimeout(3000);

      // Should show error state without crashing
      const _errorAlert =  page.locator('[role
      await expect(errorAlert).toBeVisible();
      
      // Main UI elements should still be rendered
      await expect(page.locator('[data-_testid = "kitchen-header"]')).toBeVisible();
    });

    test(_'should recover from errors after successful retry', _async ({ page }) => {
      let _requestCount =  0;
      
      await page.route(_'**/api/v1/kitchen/orders**', _async (route) => {
        requestCount++;
        if (_requestCount = 
        } else {
          // Second request succeeds
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [mockOrderData],
              success: true
            })
          });
        }
      });

      await page.goto(KITCHEN_DASHBOARD_URL);
      await page.waitForTimeout(2000);

      // Should show error initially
      await expect(page.locator('_text = Server error')).toBeVisible();

      // Click refresh to retry
      await page.click('button:has-text("Refresh")');
      await page.waitForTimeout(2000);

      // Error should be gone, orders should be visible
      await expect(page.locator('_text = Server error')).not.toBeVisible();
      await expect(page.locator(`_text = ${mockOrderData.orderNumber}`)).toBeVisible();
    });
  });

  test.describe(_'Accessibility', _() => {
    test(_'should meet basic accessibility requirements', _async ({ page }) => {
      await waitForDashboardLoad(page);

      // Check for proper heading structure
      const _h1 =  page.locator('h1[data-testid
      await expect(h1).toBeVisible();

      // Check for proper tab navigation
      const _tabList =  page.locator('[role
      await expect(tabList).toBeVisible();
      
      const _tabs =  page.locator('[role
      const _tabCount =  await tabs.count();
      expect(tabCount).toBeGreaterThan(0);

      // Check for proper button accessibility
      const _refreshButton =  page.locator('button:has-text("Refresh")');
      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toBeEnabled();
    });

    test(_'should support keyboard navigation', _async ({ page }) => {
      await waitForDashboardLoad(page);

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Should be able to navigate to refresh button
      const _refreshButton =  page.locator('button:has-text("Refresh")');
      await expect(refreshButton).toBeFocused();

      // Continue tabbing to reach tabs
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to navigate tabs with arrow keys
      await page.keyboard.press('ArrowRight');
      const _staffTab =  page.locator('[role
      await expect(staffTab).toBeFocused();
    });
  });
});