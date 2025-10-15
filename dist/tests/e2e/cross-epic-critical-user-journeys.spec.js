"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const TEST_CONFIG = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    apiBaseUrl: process.env.TEST_API_BASE_URL || 'http://localhost:3000/api',
    testUserEmail: 'e2e-test@example.com',
    testUserPassword: 'SecurePassword123!',
    testSchoolId: 'test-school-e2e',
    timeout: 60000
};
async function waitForPageLoad(page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
}
async function fillFormField(page, selector, value) {
    await page.fill(selector, value);
    await page.waitForTimeout(200);
}
async function clickAndWait(page, selector) {
    await page.click(selector);
    await waitForPageLoad(page);
}
async function waitForNotification(page, type = 'success') {
    await page.waitForSelector(`[data-testid="notification-${type}"]`, { timeout: 10000 });
}
test_1.test.describe('Cross-Epic Critical User Journeys', () => {
    test_1.test.setTimeout(TEST_CONFIG.timeout);
    console.log(`🌐 Testing critical user journeys with Playwright E2E`);
    (0, test_1.test)('should complete new user registration to first purchase journey', async ({ page, context }) => {
        console.log('🎯 Testing new user registration to first purchase journey...');
        const journeyStartTime = Date.now();
        await page.goto(`${TEST_CONFIG.baseUrl}/register`);
        await waitForPageLoad(page);
        (0, test_1.expect)(page.url()).toContain('/register');
        await (0, test_1.expect)(page.locator('h1')).toContainText(/register|sign up/i);
        console.log(`📝 Registration page loaded`);
        const testEmail = `newuser_${Date.now()}@e2etest.com`;
        await fillFormField(page, '[data-testid="email-input"]', testEmail);
        await fillFormField(page, '[data-testid="password-input"]', TEST_CONFIG.testUserPassword);
        await fillFormField(page, '[data-testid="confirm-password-input"]', TEST_CONFIG.testUserPassword);
        await fillFormField(page, '[data-testid="first-name-input"]', 'E2E');
        await fillFormField(page, '[data-testid="last-name-input"]', 'TestUser');
        await fillFormField(page, '[data-testid="phone-input"]', '+91-9876543220');
        await page.selectOption('[data-testid="role-select"]', 'PARENT');
        await page.check('[data-testid="terms-checkbox"]');
        await page.check('[data-testid="privacy-checkbox"]');
        console.log(`📝 Registration form filled`);
        await clickAndWait(page, '[data-testid="register-submit"]');
        await (0, test_1.expect)(page).toHaveURL(/\/verify-email|\/dashboard|\/onboarding/);
        console.log(`✅ Registration submitted successfully`);
        if (page.url().includes('/verify-email')) {
            console.log(`📧 Email verification required (handled automatically in test)`);
        }
        if (page.url().includes('/onboarding') || page.url().includes('/profile')) {
            await fillFormField(page, '[data-testid="address-line1-input"]', '123 E2E Test Street');
            await fillFormField(page, '[data-testid="city-input"]', 'TestCity');
            await fillFormField(page, '[data-testid="state-input"]', 'TestState');
            await fillFormField(page, '[data-testid="pincode-input"]', '123456');
            await clickAndWait(page, '[data-testid="profile-save"]');
            await waitForNotification(page, 'success');
            console.log(`👤 Profile setup completed`);
        }
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
        await page.goto(`${TEST_CONFIG.baseUrl}/menu`);
        await waitForPageLoad(page);
        await page.click('[data-testid="menu-item-add"]:first-child');
        await page.waitForSelector('[data-testid="cart-item-count"]', { timeout: 5000 });
        await page.goto(`${TEST_CONFIG.baseUrl}/cart`);
        await waitForPageLoad(page);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const deliveryDate = tomorrow.toISOString().split('T')[0];
        await fillFormField(page, '[data-testid="delivery-date-input"]', deliveryDate);
        await page.selectOption('[data-testid="delivery-time-select"]', '12:00-13:00');
        await clickAndWait(page, '[data-testid="proceed-to-payment"]');
        console.log(`🛒 Order placed, proceeding to payment`);
        await (0, test_1.expect)(page).toHaveURL(/\/payment|\/checkout/);
        await (0, test_1.expect)(page.locator('[data-testid="selected-payment-method"]')).toBeVisible();
        await clickAndWait(page, '[data-testid="confirm-payment"]');
        await page.waitForSelector('[data-testid="payment-processing"]', { timeout: 10000 });
        await page.waitForSelector('[data-testid="payment-success"]', { timeout: 30000 });
        console.log(`✅ Payment completed successfully`);
        await (0, test_1.expect)(page).toHaveURL(/\/order-confirmation|\/orders/);
        await (0, test_1.expect)(page.locator('[data-testid="order-status"]')).toContainText(/confirmed|completed/i);
        await page.goto(`${TEST_CONFIG.baseUrl}/notifications`);
        await waitForPageLoad(page);
        const notificationCount = await page.locator('[data-testid="notification-item"]').count();
        (0, test_1.expect)(notificationCount).toBeGreaterThan(0);
        console.log(`📧 Welcome notifications received`);
        await page.goto(`${TEST_CONFIG.baseUrl}/analytics`);
        await waitForPageLoad(page);
        await (0, test_1.expect)(page.locator('[data-testid="total-orders"]')).toContainText('1');
        await (0, test_1.expect)(page.locator('[data-testid="total-spent"]')).toBeVisible();
        console.log(`📊 Analytics updated with first purchase data`);
        const journeyTime = Date.now() - journeyStartTime;
        console.log(`🎉 Complete new user registration to first purchase journey completed in ${journeyTime}ms`);
    });
    (0, test_1.test)('should complete existing user order to payment journey', async ({ page, context }) => {
        console.log('🔄 Testing existing user order to payment journey...');
        const journeyStartTime = Date.now();
        await page.goto(`${TEST_CONFIG.baseUrl}/menu`);
        await waitForPageLoad(page);
        const menuItems = await page.locator('[data-testid="menu-item-card"]').all();
        (0, test_1.expect)(menuItems.length).toBeGreaterThan(0);
        for (let i = 0; i < Math.min(3, menuItems.length); i++) {
            await menuItems[i].click();
            await page.click('[data-testid="add-to-cart-button"]');
            await page.waitForTimeout(500);
        }
        const cartCount = await page.locator('[data-testid="cart-count"]').textContent();
        (0, test_1.expect)(parseInt(cartCount || '0')).toBeGreaterThan(0);
        console.log(`🛒 Added ${cartCount} items to cart`);
        await page.goto(`${TEST_CONFIG.baseUrl}/cart`);
        await waitForPageLoad(page);
        const cartItems = await page.locator('[data-testid="cart-item"]').all();
        (0, test_1.expect)(cartItems.length).toBeGreaterThan(0);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const deliveryDate = tomorrow.toISOString().split('T')[0];
        await fillFormField(page, '[data-testid="delivery-date-input"]', deliveryDate);
        await page.selectOption('[data-testid="delivery-time-select"]', '13:00-14:00');
        const couponInput = page.locator('[data-testid="coupon-input"]');
        if (await couponInput.isVisible()) {
            await fillFormField(page, '[data-testid="coupon-input"]', 'WELCOME10');
            await clickAndWait(page, '[data-testid="apply-coupon"]');
            const discountApplied = await page.locator('[data-testid="discount-amount"]').isVisible();
            if (discountApplied) {
                console.log(`💸 Coupon discount applied`);
            }
        }
        await clickAndWait(page, '[data-testid="checkout-button"]');
        console.log(`🛒 Cart reviewed, proceeding to checkout`);
        await (0, test_1.expect)(page).toHaveURL(/\/checkout|\/payment/);
        await (0, test_1.expect)(page.locator('[data-testid="order-summary"]')).toBeVisible();
        const totalAmount = await page.locator('[data-testid="order-total"]').textContent();
        console.log(`💰 Order total: ${totalAmount}`);
        const paymentMethods = await page.locator('[data-testid="payment-method-option"]').all();
        (0, test_1.expect)(paymentMethods.length).toBeGreaterThan(0);
        await paymentMethods[0].click();
        await clickAndWait(page, '[data-testid="confirm-payment-button"]');
        console.log(`💳 Payment method selected and confirmed`);
        await page.waitForSelector('[data-testid="payment-processing"]', { timeout: 10000 });
        await page.waitForSelector('[data-testid="payment-success"]', { timeout: 30000 });
        await (0, test_1.expect)(page.locator('[data-testid="payment-success-message"]')).toBeVisible();
        console.log(`✅ Payment processed successfully`);
        await (0, test_1.expect)(page).toHaveURL(/\/order-confirmation|\/orders\/\d+/);
        await (0, test_1.expect)(page.locator('[data-testid="order-number"]')).toBeVisible();
        await (0, test_1.expect)(page.locator('[data-testid="order-status"]')).toContainText(/confirmed|completed/i);
        await (0, test_1.expect)(page.locator('[data-testid="delivery-info"]')).toBeVisible();
        console.log(`📋 Order confirmation displayed`);
        await page.goto(`${TEST_CONFIG.baseUrl}/orders`);
        await waitForPageLoad(page);
        const orderHistoryItems = await page.locator('[data-testid="order-history-item"]').all();
        (0, test_1.expect)(orderHistoryItems.length).toBeGreaterThan(0);
        const latestOrder = orderHistoryItems[0];
        await (0, test_1.expect)(latestOrder.locator('[data-testid="order-status"]')).toContainText(/confirmed|completed/i);
        console.log(`📚 Order history updated`);
        await page.goto(`${TEST_CONFIG.baseUrl}/notifications`);
        await waitForPageLoad(page);
        const newNotifications = await page.locator('[data-testid="notification-item"]:not([data-testid*="read"])').all();
        (0, test_1.expect)(newNotifications.length).toBeGreaterThan(0);
        console.log(`📧 Order and payment notifications received`);
        const journeyTime = Date.now() - journeyStartTime;
        console.log(`🔄 Complete existing user order to payment journey completed in ${journeyTime}ms`);
    });
    (0, test_1.test)('should handle payment failure and recovery journey', async ({ page, context }) => {
        console.log('🔧 Testing payment failure and recovery journey...');
        const journeyStartTime = Date.now();
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
        await (0, test_1.expect)(page).toHaveURL(/\/checkout|\/payment/);
        await page.selectOption('[data-testid="payment-method-select"]', 'fail-card');
        await clickAndWait(page, '[data-testid="confirm-payment-button"]');
        await page.waitForSelector('[data-testid="payment-failed"]', { timeout: 30000 });
        await (0, test_1.expect)(page.locator('[data-testid="payment-error-message"]')).toBeVisible();
        await (0, test_1.expect)(page.locator('[data-testid="payment-error-message"]')).toContainText(/failed|declined|error/i);
        console.log(`❌ Payment failed as expected`);
        await page.goto(`${TEST_CONFIG.baseUrl}/notifications`);
        await waitForPageLoad(page);
        const failureNotifications = await page.locator('[data-testid="notification-item"]').filter({
            hasText: /payment.*failed|declined/i
        }).all();
        (0, test_1.expect)(failureNotifications.length).toBeGreaterThan(0);
        console.log(`📧 Payment failure notifications received`);
        await page.goto(`${TEST_CONFIG.baseUrl}/payment-methods/add`);
        await waitForPageLoad(page);
        await page.selectOption('[data-testid="payment-type-select"]', 'card');
        await fillFormField(page, '[data-testid="card-number-input"]', '4111111111111111');
        await page.selectOption('[data-testid="card-expiry-month-select"]', '12');
        await page.selectOption('[data-testid="card-expiry-year-select"]', '2026');
        await fillFormField(page, '[data-testid="card-cvv-input"]', '123');
        await fillFormField(page, '[data-testid="card-holder-name-input"]', 'Recovery Test User');
        await clickAndWait(page, '[data-testid="payment-method-save"]');
        await waitForNotification(page, 'success');
        console.log(`💳 New payment method added for recovery`);
        await page.goto(`${TEST_CONFIG.baseUrl}/orders`);
        await waitForPageLoad(page);
        const failedOrder = await page.locator('[data-testid="order-item"]').filter({
            hasText: /pending|payment.*failed/i
        }).first();
        await failedOrder.click();
        await waitForPageLoad(page);
        await clickAndWait(page, '[data-testid="retry-payment-button"]');
        await page.selectOption('[data-testid="payment-method-select"]', 'new-card');
        await clickAndWait(page, '[data-testid="confirm-retry-payment"]');
        await page.waitForSelector('[data-testid="payment-success"]', { timeout: 30000 });
        console.log(`✅ Payment retry successful`);
        await (0, test_1.expect)(page.locator('[data-testid="order-status"]')).toContainText(/confirmed|completed/i);
        await page.goto(`${TEST_CONFIG.baseUrl}/notifications`);
        await waitForPageLoad(page);
        const recoveryNotifications = await page.locator('[data-testid="notification-item"]').filter({
            hasText: /payment.*successful|confirmed/i
        }).all();
        (0, test_1.expect)(recoveryNotifications.length).toBeGreaterThan(0);
        console.log(`📧 Payment recovery notifications received`);
        await page.goto(`${TEST_CONFIG.baseUrl}/analytics`);
        await waitForPageLoad(page);
        const failureRate = await page.locator('[data-testid="payment-failure-rate"]').textContent();
        const recoveryRate = await page.locator('[data-testid="payment-recovery-rate"]').textContent();
        (0, test_1.expect)(failureRate).toBeDefined();
        (0, test_1.expect)(recoveryRate).toBeDefined();
        console.log(`📊 Analytics updated with failure and recovery metrics`);
        const journeyTime = Date.now() - journeyStartTime;
        console.log(`🔧 Complete payment failure and recovery journey completed in ${journeyTime}ms`);
    });
    (0, test_1.test)('should handle bulk operations admin workflow', async ({ page, context }) => {
        console.log('📦 Testing bulk operations admin workflow...');
        const journeyStartTime = Date.now();
        await page.goto(`${TEST_CONFIG.baseUrl}/admin/bulk-operations`);
        await waitForPageLoad(page);
        (0, test_1.expect)(page.url()).toContain('/admin/bulk-operations');
        console.log(`👨‍💼 Admin bulk operations page loaded`);
        const fileInput = page.locator('[data-testid="bulk-upload-input"]');
        await fileInput.setInputFiles('./test-data/bulk-orders.csv');
        await clickAndWait(page, '[data-testid="upload-bulk-orders"]');
        await waitForNotification(page, 'success');
        await (0, test_1.expect)(page.locator('[data-testid="upload-results"]')).toContainText(/processed|uploaded/i);
        console.log(`📤 Bulk order data uploaded`);
        await (0, test_1.expect)(page.locator('[data-testid="bulk-validation-results"]')).toBeVisible();
        const validationErrors = await page.locator('[data-testid="validation-error"]').count();
        (0, test_1.expect)(validationErrors).toBe(0);
        await clickAndWait(page, '[data-testid="proceed-bulk-processing"]');
        console.log(`✅ Bulk data validated, proceeding to processing`);
        await (0, test_1.expect)(page.locator('[data-testid="bulk-processing-progress"]')).toBeVisible();
        await page.waitForSelector('[data-testid="bulk-processing-complete"]', { timeout: 120000 });
        const processedCount = await page.locator('[data-testid="processed-count"]').textContent();
        const successCount = await page.locator('[data-testid="success-count"]').textContent();
        (0, test_1.expect)(parseInt(processedCount || '0')).toBeGreaterThan(0);
        (0, test_1.expect)(parseInt(successCount || '0')).toBe(parseInt(processedCount || '0'));
        console.log(`⚙️ Bulk processing completed: ${successCount}/${processedCount} successful`);
        await clickAndWait(page, '[data-testid="view-processing-results"]');
        const resultRows = await page.locator('[data-testid="processing-result-row"]').all();
        (0, test_1.expect)(resultRows.length).toBe(parseInt(processedCount || '0'));
        for (const row of resultRows) {
            await (0, test_1.expect)(row.locator('[data-testid="result-status"]')).toContainText(/success|completed/i);
        }
        console.log(`📋 Bulk processing results reviewed`);
        await clickAndWait(page, '[data-testid="send-bulk-notifications"]');
        await page.waitForSelector('[data-testid="notification-sending-progress"]', { timeout: 30000 });
        await page.waitForSelector('[data-testid="notification-sending-complete"]', { timeout: 60000 });
        const notificationsSent = await page.locator('[data-testid="notifications-sent-count"]').textContent();
        (0, test_1.expect)(parseInt(notificationsSent || '0')).toBe(parseInt(processedCount || '0'));
        console.log(`📧 Bulk notifications sent: ${notificationsSent}`);
        await page.goto(`${TEST_CONFIG.baseUrl}/admin/analytics`);
        await waitForPageLoad(page);
        const bulkOrdersCreated = await page.locator('[data-testid="bulk-orders-created"]').textContent();
        const bulkRevenueGenerated = await page.locator('[data-testid="bulk-revenue-generated"]').textContent();
        (0, test_1.expect)(parseInt(bulkOrdersCreated || '0')).toBe(parseInt(processedCount || '0'));
        (0, test_1.expect)(bulkRevenueGenerated).toBeDefined();
        console.log(`📊 Bulk operation analytics verified`);
        await clickAndWait(page, '[data-testid="export-bulk-report"]');
        const downloadPromise = page.waitForEvent('download');
        const download = await downloadPromise;
        (0, test_1.expect)(download.suggestedFilename()).toMatch(/bulk.*report|export/i);
        console.log(`📄 Bulk operation report exported`);
        const journeyTime = Date.now() - journeyStartTime;
        console.log(`📦 Complete bulk operations admin workflow completed in ${journeyTime}ms`);
    });
    (0, test_1.test)('should handle high-load user journey performance', async ({ page, context }) => {
        console.log('⚡ Testing high-load user journey performance...');
        const journeyStartTime = Date.now();
        const pages = await context.pages();
        const additionalPages = [];
        for (let i = 0; i < 4; i++) {
            const newPage = await context.newPage();
            additionalPages.push(newPage);
        }
        const allPages = [page, ...additionalPages];
        console.log(`🌐 Created ${allPages.length} concurrent user sessions`);
        const journeyPromises = allPages.map(async (userPage, index) => {
            const userStartTime = Date.now();
            try {
                await userPage.goto(`${TEST_CONFIG.baseUrl}/menu`);
                await waitForPageLoad(userPage);
                const menuItems = await userPage.locator('[data-testid="menu-item-card"]').all();
                const itemsToAdd = Math.min(3, menuItems.length);
                for (let i = 0; i < itemsToAdd; i++) {
                    await menuItems[i].click();
                    await userPage.click('[data-testid="add-to-cart-button"]');
                    await userPage.waitForTimeout(200);
                }
                await userPage.goto(`${TEST_CONFIG.baseUrl}/cart`);
                await waitForPageLoad(userPage);
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const deliveryDate = tomorrow.toISOString().split('T')[0];
                await fillFormField(userPage, '[data-testid="delivery-date-input"]', deliveryDate);
                await userPage.selectOption('[data-testid="delivery-time-select"]', '12:00-13:00');
                await clickAndWait(userPage, '[data-testid="checkout-button"]');
                await clickAndWait(userPage, '[data-testid="confirm-payment-button"]');
                await userPage.waitForSelector('[data-testid="payment-success"]', { timeout: 45000 });
                const userJourneyTime = Date.now() - userStartTime;
                return { user: index + 1, success: true, time: userJourneyTime };
            }
            catch (error) {
                const userJourneyTime = Date.now() - userStartTime;
                return { user: index + 1, success: false, time: userJourneyTime, error: error.message };
            }
        });
        const journeyResults = await Promise.allSettled(journeyPromises);
        const successfulJourneys = journeyResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failedJourneys = journeyResults.filter(r => r.status === 'rejected' ||
            (r.status === 'fulfilled' && !r.value.success)).length;
        console.log(`📊 Concurrent journey results: ${successfulJourneys} successful, ${failedJourneys} failed`);
        const successfulResults = journeyResults
            .filter(r => r.status === 'fulfilled' && r.value.success)
            .map(r => r.value);
        if (successfulResults.length > 0) {
            const avgJourneyTime = successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length;
            const maxJourneyTime = Math.max(...successfulResults.map(r => r.time));
            const minJourneyTime = Math.min(...successfulResults.map(r => r.time));
            console.log(`⏱️ Performance metrics:
        - Average journey time: ${avgJourneyTime}ms
        - Max journey time: ${maxJourneyTime}ms
        - Min journey time: ${minJourneyTime}ms`);
            (0, test_1.expect)(avgJourneyTime).toBeLessThan(60000);
            (0, test_1.expect)(maxJourneyTime).toBeLessThan(120000);
            (0, test_1.expect)(successfulJourneys / allPages.length).toBeGreaterThan(0.8);
        }
        await page.goto(`${TEST_CONFIG.baseUrl}/system/health`);
        await waitForPageLoad(page);
        const responseTime = await page.locator('[data-testid="avg-response-time"]').textContent();
        const errorRate = await page.locator('[data-testid="error-rate"]').textContent();
        const throughput = await page.locator('[data-testid="throughput"]').textContent();
        (0, test_1.expect)(parseFloat(responseTime || '0')).toBeLessThan(5000);
        (0, test_1.expect)(parseFloat(errorRate || '0')).toBeLessThan(0.1);
        (0, test_1.expect)(parseFloat(throughput || '0')).toBeGreaterThan(10);
        console.log(`💚 System health under load verified`);
        await page.goto(`${TEST_CONFIG.baseUrl}/analytics/performance`);
        await waitForPageLoad(page);
        const concurrentUsersPeak = await page.locator('[data-testid="concurrent-users-peak"]').textContent();
        const loadTestDuration = await page.locator('[data-testid="load-test-duration"]').textContent();
        (0, test_1.expect)(parseInt(concurrentUsersPeak || '0')).toBe(allPages.length);
        (0, test_1.expect)(parseInt(loadTestDuration || '0')).toBeGreaterThan(0);
        console.log(`📊 Load testing analytics captured`);
        for (const additionalPage of additionalPages) {
            await additionalPage.close();
        }
        const journeyTime = Date.now() - journeyStartTime;
        console.log(`⚡ Complete high-load user journey performance test completed in ${journeyTime}ms`);
    });
});
//# sourceMappingURL=cross-epic-critical-user-journeys.spec.js.map