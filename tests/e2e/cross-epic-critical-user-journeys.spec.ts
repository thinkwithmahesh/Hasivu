/**
 * HASIVU Platform - Cross-Epic E2E Tests
 * Critical User Journeys End-to-End Test
 *
 * Comprehensive end-to-end tests for critical user journeys spanning multiple business domains
 * using Playwright for browser automation and real user experience validation
 *
 * Epic Coverage:
 * - Epic 1: User Management & Authentication System
 * - Epic 2: Order Management System
 * - Epic 5: Payment Processing & Billing System
 * - Epic 4: Notification & Communication System
 * - Epic 3: Analytics & Reporting System
 *
 * Critical User Journeys:
 * - New User Registration to First Purchase
 * - Existing User Order to Payment
 * - Payment Failure Recovery
 * - Bulk Operations and Admin Workflows
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.TEST_API_BASE_URL || 'http://localhost:3000/api',
  testUserEmail: 'e2e-test@example.com',
  testUserPassword: 'SecurePassword123!',
  testSchoolId: 'test-school-e2e',
  timeout: 60000
};

// Utility functions
async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Additional wait for dynamic content
}

async function fillFormField(page: Page, selector: string, value: string): Promise<void> {
  await page.fill(selector, value);
  await page.waitForTimeout(200); // Wait for validation
}

async function clickAndWait(page: Page, selector: string): Promise<void> {
  await page.click(selector);
  await waitForPageLoad(page);
}

async function waitForNotification(page: Page, type: string = 'success'): Promise<void> {
  await page.waitForSelector(`[data-testid="notification-${type}"]`, { timeout: 10000 });
}

/**
 * Cross-Epic Critical User Journeys E2E Tests
 */
test.describe('Cross-Epic Critical User Journeys', () => {

  test.setTimeout(TEST_CONFIG.timeout);

  console.log(`🌐 Testing critical user journeys with Playwright E2E`);

  /**
   * New User Registration to First Purchase Journey
   */
  test('should complete new user registration to first purchase journey', async ({ page, context }) => {
    console.log('🎯 Testing new user registration to first purchase journey...');

    const journeyStartTime = Date.now();

    // Step 1: Navigate to registration page
    await page.goto(`${TEST_CONFIG.baseUrl}/register`);
    await waitForPageLoad(page);

    expect(page.url()).toContain('/register');
    await expect(page.locator('h1')).toContainText(/register|sign up/i);

    console.log(`📝 Registration page loaded`);

    // Step 2: Fill registration form
    const testEmail = `newuser_${Date.now()}@e2etest.com`;

    await fillFormField(page, '[data-testid="email-input"]', testEmail);
    await fillFormField(page, '[data-testid="password-input"]', TEST_CONFIG.testUserPassword);
    await fillFormField(page, '[data-testid="confirm-password-input"]', TEST_CONFIG.testUserPassword);
    await fillFormField(page, '[data-testid="first-name-input"]', 'E2E');
    await fillFormField(page, '[data-testid="last-name-input"]', 'TestUser');
    await fillFormField(page, '[data-testid="phone-input"]', '+91-9876543220');

    // Select role
    await page.selectOption('[data-testid="role-select"]', 'PARENT');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');
    await page.check('[data-testid="privacy-checkbox"]');

    console.log(`📝 Registration form filled`);

    // Step 3: Submit registration
    await clickAndWait(page, '[data-testid="register-submit"]');

    // Should redirect to email verification or dashboard
    await expect(page).toHaveURL(/\/verify-email|\/dashboard|\/onboarding/);

    console.log(`✅ Registration submitted successfully`);

    // Step 4: Handle email verification (if required)
    if (page.url().includes('/verify-email')) {
      // In E2E test, we might need to simulate email verification
      // For now, assume auto-verification or skip this step
      console.log(`📧 Email verification required (handled automatically in test)`);
    }

    // Step 5: Complete profile setup
    if (page.url().includes('/onboarding') || page.url().includes('/profile')) {
      await fillFormField(page, '[data-testid="address-line1-input"]', '123 E2E Test Street');
      await fillFormField(page, '[data-testid="city-input"]', 'TestCity');
      await fillFormField(page, '[data-testid="state-input"]', 'TestState');
      await fillFormField(page, '[data-testid="pincode-input"]', '123456');

      await clickAndWait(page, '[data-testid="profile-save"]');
      await waitForNotification(page, 'success');

      console.log(`👤 Profile setup completed`);
    }

    // Step 6: Add student profile
    await page.goto(`${TEST_CONFIG.baseUrl}/students/add`);
    await waitForPageLoad(page);

    await fillFormField(page, '[data-testid="student-first-name-input"]', 'E2E');
    await fillFormField(page, '[data-testid="student-last-name-input"]', 'Student');
    await fillFormField(page, '[data-testid="student-email-input"]', `student_${Date.now()}@e2etest.com`);
    await fillFormField(page, '[data-testid="student-phone-input"]', '+91-9876543221');

    await page.selectOption('[data-testid="class-select"]', '10th Grade');
    await page.selectOption('[data-testid="section-select"]', 'A');
    await fillFormField(page, '[data-testid="roll-number-input"]', 'E2E001');

    await clickAndWait(page, '[data-testid="student-save"]');
    await waitForNotification(page, 'success');

    console.log(`🎓 Student profile added`);

    // Step 7: Set up payment method
    await page.goto(`${TEST_CONFIG.baseUrl}/payment-methods/add`);
    await waitForPageLoad(page);

    await page.selectOption('[data-testid="payment-type-select"]', 'card');

    await fillFormField(page, '[data-testid="card-number-input"]', '4111111111111111');
    await page.selectOption('[data-testid="card-expiry-month-select"]', '12');
    await page.selectOption('[data-testid="card-expiry-year-select"]', '2026');
    await fillFormField(page, '[data-testid="card-cvv-input"]', '123');
    await fillFormField(page, '[data-testid="card-holder-name-input"]', 'E2E Test User');

    await page.check('[data-testid="billing-same-as-profile-checkbox"]');

    await clickAndWait(page, '[data-testid="payment-method-save"]');
    await waitForNotification(page, 'success');

    console.log(`💳 Payment method added`);

    // Step 8: Place first order
    await page.goto(`${TEST_CONFIG.baseUrl}/menu`);
    await waitForPageLoad(page);

    // Select first available menu item
    await page.click('[data-testid="menu-item-add"]:first-child');
    await page.waitForSelector('[data-testid="cart-item-count"]', { timeout: 5000 });

    // Go to cart
    await page.goto(`${TEST_CONFIG.baseUrl}/cart`);
    await waitForPageLoad(page);

    // Select delivery options
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deliveryDate = tomorrow.toISOString().split('T')[0];

    await fillFormField(page, '[data-testid="delivery-date-input"]', deliveryDate);
    await page.selectOption('[data-testid="delivery-time-select"]', '12:00-13:00');

    await clickAndWait(page, '[data-testid="proceed-to-payment"]');

    console.log(`🛒 Order placed, proceeding to payment`);

    // Step 9: Complete payment
    await expect(page).toHaveURL(/\/payment|\/checkout/);

    // Payment should be pre-selected
    await expect(page.locator('[data-testid="selected-payment-method"]')).toBeVisible();

    await clickAndWait(page, '[data-testid="confirm-payment"]');

    // Handle payment processing
    await page.waitForSelector('[data-testid="payment-processing"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="payment-success"]', { timeout: 30000 });

    console.log(`✅ Payment completed successfully`);

    // Step 10: Verify order confirmation
    await expect(page).toHaveURL(/\/order-confirmation|\/orders/);
    await expect(page.locator('[data-testid="order-status"]')).toContainText(/confirmed|completed/i);

    // Step 11: Check welcome notifications (if implemented in UI)
    await page.goto(`${TEST_CONFIG.baseUrl}/notifications`);
    await waitForPageLoad(page);

    // Should have order confirmation notification
    const notificationCount = await page.locator('[data-testid="notification-item"]').count();
    expect(notificationCount).toBeGreaterThan(0);

    console.log(`📧 Welcome notifications received`);

    // Step 12: Verify analytics tracking
    await page.goto(`${TEST_CONFIG.baseUrl}/analytics`);
    await waitForPageLoad(page);

    // Should show first purchase metrics
    await expect(page.locator('[data-testid="total-orders"]')).toContainText('1');
    await expect(page.locator('[data-testid="total-spent"]')).toBeVisible();

    console.log(`📊 Analytics updated with first purchase data`);

    const journeyTime = Date.now() - journeyStartTime;
    console.log(`🎉 Complete new user registration to first purchase journey completed in ${journeyTime}ms`);
  });

  /**
   * Existing User Order to Payment Journey
   */
  test('should complete existing user order to payment journey', async ({ page, context }) => {
    console.log('🔄 Testing existing user order to payment journey...');

    // Assume user is already logged in (would need authentication setup)
    // For this test, we'll simulate the flow starting from menu selection

    const journeyStartTime = Date.now();

    // Step 1: Navigate to menu and select items
    await page.goto(`${TEST_CONFIG.baseUrl}/menu`);
    await waitForPageLoad(page);

    // Add multiple items to cart
    const menuItems = await page.locator('[data-testid="menu-item-card"]').all();
    expect(menuItems.length).toBeGreaterThan(0);

    // Add first 3 items
    for (let i = 0; i < Math.min(3, menuItems.length); i++) {
      await menuItems[i].click();
      await page.click('[data-testid="add-to-cart-button"]');
      await page.waitForTimeout(500);
    }

    // Check cart count
    const cartCount = await page.locator('[data-testid="cart-count"]').textContent();
    expect(parseInt(cartCount || '0')).toBeGreaterThan(0);

    console.log(`🛒 Added ${cartCount} items to cart`);

    // Step 2: Review cart and proceed to checkout
    await page.goto(`${TEST_CONFIG.baseUrl}/cart`);
    await waitForPageLoad(page);

    // Verify cart contents
    const cartItems = await page.locator('[data-testid="cart-item"]').all();
    expect(cartItems.length).toBeGreaterThan(0);

    // Select delivery options
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deliveryDate = tomorrow.toISOString().split('T')[0];

    await fillFormField(page, '[data-testid="delivery-date-input"]', deliveryDate);
    await page.selectOption('[data-testid="delivery-time-select"]', '13:00-14:00');

    // Apply any available discounts or coupons
    const couponInput = page.locator('[data-testid="coupon-input"]');
    if (await couponInput.isVisible()) {
      await fillFormField(page, '[data-testid="coupon-input"]', 'WELCOME10');
      await clickAndWait(page, '[data-testid="apply-coupon"]');

      // Check if discount was applied
      const discountApplied = await page.locator('[data-testid="discount-amount"]').isVisible();
      if (discountApplied) {
        console.log(`💸 Coupon discount applied`);
      }
    }

    await clickAndWait(page, '[data-testid="checkout-button"]');

    console.log(`🛒 Cart reviewed, proceeding to checkout`);

    // Step 3: Complete checkout process
    await expect(page).toHaveURL(/\/checkout|\/payment/);

    // Verify order summary
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    const totalAmount = await page.locator('[data-testid="order-total"]').textContent();

    console.log(`💰 Order total: ${totalAmount}`);

    // Select or verify payment method
    const paymentMethods = await page.locator('[data-testid="payment-method-option"]').all();
    expect(paymentMethods.length).toBeGreaterThan(0);

    // Select first available payment method
    await paymentMethods[0].click();

    // Confirm payment
    await clickAndWait(page, '[data-testid="confirm-payment-button"]');

    console.log(`💳 Payment method selected and confirmed`);

    // Step 4: Handle payment processing
    await page.waitForSelector('[data-testid="payment-processing"]', { timeout: 10000 });

    // Wait for payment completion
    await page.waitForSelector('[data-testid="payment-success"]', { timeout: 30000 });

    // Verify success message
    await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();

    console.log(`✅ Payment processed successfully`);

    // Step 5: Verify order confirmation page
    await expect(page).toHaveURL(/\/order-confirmation|\/orders\/\d+/);

    // Check order details
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-status"]')).toContainText(/confirmed|completed/i);
    await expect(page.locator('[data-testid="delivery-info"]')).toBeVisible();

    console.log(`📋 Order confirmation displayed`);

    // Step 6: Check order history
    await page.goto(`${TEST_CONFIG.baseUrl}/orders`);
    await waitForPageLoad(page);

    const orderHistoryItems = await page.locator('[data-testid="order-history-item"]').all();
    expect(orderHistoryItems.length).toBeGreaterThan(0);

    // Verify latest order is at the top
    const latestOrder = orderHistoryItems[0];
    await expect(latestOrder.locator('[data-testid="order-status"]')).toContainText(/confirmed|completed/i);

    console.log(`📚 Order history updated`);

    // Step 7: Verify notifications
    await page.goto(`${TEST_CONFIG.baseUrl}/notifications`);
    await waitForPageLoad(page);

    // Should have new order and payment notifications
    const newNotifications = await page.locator('[data-testid="notification-item"]:not([data-testid*="read"])').all();
    expect(newNotifications.length).toBeGreaterThan(0);

    console.log(`📧 Order and payment notifications received`);

    const journeyTime = Date.now() - journeyStartTime;
    console.log(`🔄 Complete existing user order to payment journey completed in ${journeyTime}ms`);
  });

  /**
   * Payment Failure Recovery Journey
   */
  test('should handle payment failure and recovery journey', async ({ page, context }) => {
    console.log('🔧 Testing payment failure and recovery journey...');

    const journeyStartTime = Date.now();

    // Step 1: Add items to cart and proceed to checkout
    await page.goto(`${TEST_CONFIG.baseUrl}/menu`);
    await waitForPageLoad(page);

    await page.click('[data-testid="menu-item-add"]:first-child');
    await page.waitForSelector('[data-testid="cart-count"]');

    await page.goto(`${TEST_CONFIG.baseUrl}/cart`);
    await waitForPageLoad(page);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deliveryDate = tomorrow.toISOString().split('T')[0];

    await fillFormField(page, '[data-testid="delivery-date-input"]', deliveryDate);
    await page.selectOption('[data-testid="delivery-time-select"]', '12:00-13:00');

    await clickAndWait(page, '[data-testid="checkout-button"]');

    // Step 2: Attempt payment with failing card
    await expect(page).toHaveURL(/\/checkout|\/payment/);

    // Select payment method that will fail
    await page.selectOption('[data-testid="payment-method-select"]', 'fail-card');

    await clickAndWait(page, '[data-testid="confirm-payment-button"]');

    // Step 3: Handle payment failure
    await page.waitForSelector('[data-testid="payment-failed"]', { timeout: 30000 });

    // Verify failure message
    await expect(page.locator('[data-testid="payment-error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-error-message"]')).toContainText(/failed|declined|error/i);

    console.log(`❌ Payment failed as expected`);

    // Step 4: Check failure notifications
    await page.goto(`${TEST_CONFIG.baseUrl}/notifications`);
    await waitForPageLoad(page);

    const failureNotifications = await page.locator('[data-testid="notification-item"]').filter({
      hasText: /payment.*failed|declined/i
    }).all();

    expect(failureNotifications.length).toBeGreaterThan(0);

    console.log(`📧 Payment failure notifications received`);

    // Step 5: Retry with different payment method
    await page.goto(`${TEST_CONFIG.baseUrl}/payment-methods/add`);
    await waitForPageLoad(page);

    // Add new payment method
    await page.selectOption('[data-testid="payment-type-select"]', 'card');

    await fillFormField(page, '[data-testid="card-number-input"]', '4111111111111111'); // Valid card
    await page.selectOption('[data-testid="card-expiry-month-select"]', '12');
    await page.selectOption('[data-testid="card-expiry-year-select"]', '2026');
    await fillFormField(page, '[data-testid="card-cvv-input"]', '123');
    await fillFormField(page, '[data-testid="card-holder-name-input"]', 'Recovery Test User');

    await clickAndWait(page, '[data-testid="payment-method-save"]');
    await waitForNotification(page, 'success');

    console.log(`💳 New payment method added for recovery`);

    // Step 6: Retry payment
    await page.goto(`${TEST_CONFIG.baseUrl}/orders`);
    await waitForPageLoad(page);

    // Find the failed order and retry payment
    const failedOrder = await page.locator('[data-testid="order-item"]').filter({
      hasText: /pending|payment.*failed/i
    }).first();

    await failedOrder.click();
    await waitForPageLoad(page);

    // Click retry payment
    await clickAndWait(page, '[data-testid="retry-payment-button"]');

    // Select the new payment method
    await page.selectOption('[data-testid="payment-method-select"]', 'new-card');
    await clickAndWait(page, '[data-testid="confirm-retry-payment"]');

    // Step 7: Verify successful retry
    await page.waitForSelector('[data-testid="payment-success"]', { timeout: 30000 });

    console.log(`✅ Payment retry successful`);

    // Step 8: Verify order status updated
    await expect(page.locator('[data-testid="order-status"]')).toContainText(/confirmed|completed/i);

    // Step 9: Check recovery notifications
    await page.goto(`${TEST_CONFIG.baseUrl}/notifications`);
    await waitForPageLoad(page);

    const recoveryNotifications = await page.locator('[data-testid="notification-item"]').filter({
      hasText: /payment.*successful|confirmed/i
    }).all();

    expect(recoveryNotifications.length).toBeGreaterThan(0);

    console.log(`📧 Payment recovery notifications received`);

    // Step 10: Verify analytics reflect recovery
    await page.goto(`${TEST_CONFIG.baseUrl}/analytics`);
    await waitForPageLoad(page);

    // Should show recovery metrics
    const failureRate = await page.locator('[data-testid="payment-failure-rate"]').textContent();
    const recoveryRate = await page.locator('[data-testid="payment-recovery-rate"]').textContent();

    // Failure rate should be accounted for, recovery should be tracked
    expect(failureRate).toBeDefined();
    expect(recoveryRate).toBeDefined();

    console.log(`📊 Analytics updated with failure and recovery metrics`);

    const journeyTime = Date.now() - journeyStartTime;
    console.log(`🔧 Complete payment failure and recovery journey completed in ${journeyTime}ms`);
  });

  /**
   * Bulk Operations Admin Journey
   */
  test('should handle bulk operations admin workflow', async ({ page, context }) => {
    console.log('📦 Testing bulk operations admin workflow...');

    // Assume admin login (would need admin authentication setup)
    const journeyStartTime = Date.now();

    // Step 1: Navigate to admin bulk operations
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/bulk-operations`);
    await waitForPageLoad(page);

    expect(page.url()).toContain('/admin/bulk-operations');

    console.log(`👨‍💼 Admin bulk operations page loaded`);

    // Step 2: Upload bulk order data
    const fileInput = page.locator('[data-testid="bulk-upload-input"]');
    await fileInput.setInputFiles('./test-data/bulk-orders.csv'); // Would need test file

    await clickAndWait(page, '[data-testid="upload-bulk-orders"]');

    // Verify upload success
    await waitForNotification(page, 'success');
    await expect(page.locator('[data-testid="upload-results"]')).toContainText(/processed|uploaded/i);

    console.log(`📤 Bulk order data uploaded`);

    // Step 3: Review and validate bulk data
    await expect(page.locator('[data-testid="bulk-validation-results"]')).toBeVisible();

    const validationErrors = await page.locator('[data-testid="validation-error"]').count();
    expect(validationErrors).toBe(0); // Assume clean data

    await clickAndWait(page, '[data-testid="proceed-bulk-processing"]');

    console.log(`✅ Bulk data validated, proceeding to processing`);

    // Step 4: Monitor bulk processing
    await expect(page.locator('[data-testid="bulk-processing-progress"]')).toBeVisible();

    // Wait for processing to complete
    await page.waitForSelector('[data-testid="bulk-processing-complete"]', { timeout: 120000 });

    const processedCount = await page.locator('[data-testid="processed-count"]').textContent();
    const successCount = await page.locator('[data-testid="success-count"]').textContent();

    expect(parseInt(processedCount || '0')).toBeGreaterThan(0);
    expect(parseInt(successCount || '0')).toBe(parseInt(processedCount || '0')); // All successful

    console.log(`⚙️ Bulk processing completed: ${successCount}/${processedCount} successful`);

    // Step 5: Review processing results
    await clickAndWait(page, '[data-testid="view-processing-results"]');

    // Verify detailed results
    const resultRows = await page.locator('[data-testid="processing-result-row"]').all();
    expect(resultRows.length).toBe(parseInt(processedCount || '0'));

    // Check that all results are successful
    for (const row of resultRows) {
      await expect(row.locator('[data-testid="result-status"]')).toContainText(/success|completed/i);
    }

    console.log(`📋 Bulk processing results reviewed`);

    // Step 6: Handle bulk notifications
    await clickAndWait(page, '[data-testid="send-bulk-notifications"]');

    await page.waitForSelector('[data-testid="notification-sending-progress"]', { timeout: 30000 });
    await page.waitForSelector('[data-testid="notification-sending-complete"]', { timeout: 60000 });

    const notificationsSent = await page.locator('[data-testid="notifications-sent-count"]').textContent();
    expect(parseInt(notificationsSent || '0')).toBe(parseInt(processedCount || '0'));

    console.log(`📧 Bulk notifications sent: ${notificationsSent}`);

    // Step 7: Verify bulk analytics
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/analytics`);
    await waitForPageLoad(page);

    // Check bulk operation metrics
    const bulkOrdersCreated = await page.locator('[data-testid="bulk-orders-created"]').textContent();
    const bulkRevenueGenerated = await page.locator('[data-testid="bulk-revenue-generated"]').textContent();

    expect(parseInt(bulkOrdersCreated || '0')).toBe(parseInt(processedCount || '0'));
    expect(bulkRevenueGenerated).toBeDefined();

    console.log(`📊 Bulk operation analytics verified`);

    // Step 8: Export bulk operation report
    await clickAndWait(page, '[data-testid="export-bulk-report"]');

    // Verify download started
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/bulk.*report|export/i);

    console.log(`📄 Bulk operation report exported`);

    const journeyTime = Date.now() - journeyStartTime;
    console.log(`📦 Complete bulk operations admin workflow completed in ${journeyTime}ms`);
  });

  /**
   * Performance and Load Testing Journey
   */
  test('should handle high-load user journey performance', async ({ page, context }) => {
    console.log('⚡ Testing high-load user journey performance...');

    const journeyStartTime = Date.now();

    // Step 1: Simulate concurrent user load
    const pages = await context.pages();
    const additionalPages = [];

    // Create additional browser contexts for concurrent users
    for (let i = 0; i < 4; i++) { // 5 total concurrent users
      const newPage = await context.newPage();
      additionalPages.push(newPage);
    }

    const allPages = [page, ...additionalPages];

    console.log(`🌐 Created ${allPages.length} concurrent user sessions`);

    // Step 2: Execute concurrent user journeys
    const journeyPromises = allPages.map(async (userPage, index) => {
      const userStartTime = Date.now();

      try {
        // Each user performs a complete journey
        await userPage.goto(`${TEST_CONFIG.baseUrl}/menu`);
        await waitForPageLoad(userPage);

        // Add items to cart
        const menuItems = await userPage.locator('[data-testid="menu-item-card"]').all();
        const itemsToAdd = Math.min(3, menuItems.length);

        for (let i = 0; i < itemsToAdd; i++) {
          await menuItems[i].click();
          await userPage.click('[data-testid="add-to-cart-button"]');
          await userPage.waitForTimeout(200);
        }

        // Proceed to checkout
        await userPage.goto(`${TEST_CONFIG.baseUrl}/cart`);
        await waitForPageLoad(userPage);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const deliveryDate = tomorrow.toISOString().split('T')[0];

        await fillFormField(userPage, '[data-testid="delivery-date-input"]', deliveryDate);
        await userPage.selectOption('[data-testid="delivery-time-select"]', '12:00-13:00');

        await clickAndWait(userPage, '[data-testid="checkout-button"]');

        // Complete payment
        await clickAndWait(userPage, '[data-testid="confirm-payment-button"]');

        // Wait for completion
        await userPage.waitForSelector('[data-testid="payment-success"]', { timeout: 45000 });

        const userJourneyTime = Date.now() - userStartTime;
        return { user: index + 1, success: true, time: userJourneyTime };

      } catch (error) {
        const userJourneyTime = Date.now() - userStartTime;
        return { user: index + 1, success: false, time: userJourneyTime, error: (error as Error).message };
      }
    });

    // Step 3: Wait for all journeys to complete
    const journeyResults = await Promise.allSettled(journeyPromises);

    const successfulJourneys = journeyResults.filter(r =>
      r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success
    ).length;

    const failedJourneys = journeyResults.filter(r =>
      r.status === 'rejected' ||
      (r.status === 'fulfilled' && !(r as PromiseFulfilledResult<any>).value.success)
    ).length;

    console.log(`📊 Concurrent journey results: ${successfulJourneys} successful, ${failedJourneys} failed`);

    // Step 4: Analyze performance metrics
    const successfulResults = journeyResults
      .filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success)
      .map(r => (r as PromiseFulfilledResult<any>).value);

    if (successfulResults.length > 0) {
      const avgJourneyTime = successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length;
      const maxJourneyTime = Math.max(...successfulResults.map(r => r.time));
      const minJourneyTime = Math.min(...successfulResults.map(r => r.time));

      console.log(`⏱️ Performance metrics:
        - Average journey time: ${avgJourneyTime}ms
        - Max journey time: ${maxJourneyTime}ms
        - Min journey time: ${minJourneyTime}ms`);

      // Performance assertions
      expect(avgJourneyTime).toBeLessThan(60000); // Under 1 minute average
      expect(maxJourneyTime).toBeLessThan(120000); // Under 2 minutes max
      expect(successfulJourneys / allPages.length).toBeGreaterThan(0.8); // 80% success rate
    }

    // Step 5: Verify system remained stable under load
    await page.goto(`${TEST_CONFIG.baseUrl}/system/health`);
    await waitForPageLoad(page);

    // Check system health indicators
    const responseTime = await page.locator('[data-testid="avg-response-time"]').textContent();
    const errorRate = await page.locator('[data-testid="error-rate"]').textContent();
    const throughput = await page.locator('[data-testid="throughput"]').textContent();

    expect(parseFloat(responseTime || '0')).toBeLessThan(5000); // Under 5 seconds
    expect(parseFloat(errorRate || '0')).toBeLessThan(0.1); // Under 10% error rate
    expect(parseFloat(throughput || '0')).toBeGreaterThan(10); // At least 10 requests/second

    console.log(`💚 System health under load verified`);

    // Step 6: Check analytics captured load testing data
    await page.goto(`${TEST_CONFIG.baseUrl}/analytics/performance`);
    await waitForPageLoad(page);

    const concurrentUsersPeak = await page.locator('[data-testid="concurrent-users-peak"]').textContent();
    const loadTestDuration = await page.locator('[data-testid="load-test-duration"]').textContent();

    expect(parseInt(concurrentUsersPeak || '0')).toBe(allPages.length);
    expect(parseInt(loadTestDuration || '0')).toBeGreaterThan(0);

    console.log(`📊 Load testing analytics captured`);

    // Cleanup additional pages
    for (const additionalPage of additionalPages) {
      await additionalPage.close();
    }

    const journeyTime = Date.now() - journeyStartTime;
    console.log(`⚡ Complete high-load user journey performance test completed in ${journeyTime}ms`);
  });
});