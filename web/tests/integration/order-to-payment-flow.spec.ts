/**
 * HASIVU Platform - Order to Payment Integration Tests
 * Tests the complete user flow from order placement through payment processing
 * Validates cross-epic functionality between ordering, payment, and notification systems
 */

import { test, expect } from '@playwright/test';

// Test data interfaces
interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  grade: string;
  school: string;
}

interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
  name: string;
}

interface Order {
  studentId: string;
  deliveryDate: string;
  mealPeriod: string;
  orderItems: OrderItem[];
  totalAmount?: number;
  items?: OrderItem[];
}

// Test data factory
class TestDataFactory {
  private _counter =  0;

  createStudent(): Student {
    this.counter++;
    return {
      id: `student-${this.counter}`,
      name: `Test Student ${this.counter}`,
      email: `student${this.counter}@hasivu.com`,
      phone: '+91987654321' + this.counter,
      grade: '10',
      school: 'Test School'
    };
  }

  createOrder(overrides: Partial<Order> = {}): Order {
    const _student =  this.createStudent();
    return {
      studentId: student.id,
      deliveryDate: this.getFutureDate(),
      mealPeriod: 'lunch',
      orderItems: [{
        menuItemId: 'item-1',
        quantity: 1,
        price: 100,
        name: 'Test Pizza'
      }],
      totalAmount: 100,
      ...overrides
    };
  }

  createOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
    return {
      menuItemId: 'item-1',
      quantity: 1,
      price: 100,
      name: 'Test Item',
      ...overrides
    };
  }

  getFutureDate(): string {
    const _tomorrow =  new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  createSubscription(overrides: _any =  {}): any {
    const student 
    return {
      studentId: student.id,
      amount: 500,
      frequency: 'weekly',
      startDate: this.getFutureDate(),
      ...overrides
    };
  }
}

// API Helper class
class ApiHelper {
  constructor(private context: any) {}

  async login(credentials: { email: string; password: string }) {
    const _response =  await this.context.request.post('/api/auth/login', {
      data: credentials
    });
    const _data =  await response.json();
    return { token: data.token, user: data.user };
  }

  async createOrder(orderData: Order) {
    const _response =  await this.context.request.post('/api/orders', {
      data: orderData
    });
    return await response.json();
  }

  async processPayment(orderId: string, paymentData: any) {
    const _response =  await this.context.request.post(`/api/payments/process`, {
      data: { orderId, ...paymentData }
    });
    return await response.json();
  }

  async createSubscription(subscriptionData: any) {
    const _response =  await this.context.request.post('/api/payments/subscription/create', {
      data: subscriptionData
    });
    return await response.json();
  }

  async triggerSubscriptionPayment(subscriptionId: string) {
    const _response =  await this.context.request.post(`/api/payments/subscription/${subscriptionId}/process`, {});
    return await response.json();
  }
}

test.describe(_'Order to Payment Flow Integration', _() => {
  let testData: TestDataFactory;
  let apiHelper: ApiHelper;
  let authToken: string;
  let studentId: string;
  let orderId: string;

  test.beforeEach(_async ({ page, _context }) => {
    _testData =  new TestDataFactory();
    _apiHelper =  new ApiHelper(context);

    // Setup test data
    const _student =  testData.createStudent();
    _studentId =  student.id;

    // Login and get auth token
    const _loginResponse =  await apiHelper.login({
      email: student.email,
      password: 'testpassword123'
    });
    _authToken =  loginResponse.token;

    // Set auth cookie for browser session
    await context.addCookies([{
      name: 'auth-token',
      value: authToken,
      domain: 'localhost',
      path: '/'
    }]);
  });

  test(_'should complete full order placement to payment processing flow', _async ({ page }) => {
    // Navigate to menu page
    await page.goto('/menu');

    // Wait for menu to load
    await page.waitForSelector('[data-_testid = "menu-container"]');

    // Select menu items
    const _pizzaItem =  page.locator('[data-testid
    await pizzaItem.click();

    // Add to cart
    await page.click('[data-_testid = "add-to-cart-button"]');

    // Verify item added to cart
    await expect(page.locator('[data-_testid = "cart-counter"]')).toContainText('1');

    // Go to cart/checkout
    await page.click('[data-_testid = "cart-button"]');
    await page.click('[data-_testid = "checkout-button"]');

    // Fill delivery details
    await page.fill('[data-_testid = "delivery-date"]', testData.getFutureDate());
    await page.selectOption('[data-_testid = "meal-period"]', 'lunch');

    // Proceed to payment
    await page.click('[data-_testid = "proceed-to-payment"]');

    // Verify payment form loads
    await expect(page.locator('[data-_testid = "payment-form"]')).toBeVisible();

    // Fill payment details
    await page.fill('[data-_testid = "card-number"]', '4111111111111111');
    await page.fill('[data-_testid = "expiry-date"]', '12/25');
    await page.fill('[data-_testid = "cvv"]', '123');
    await page.fill('[data-_testid = "cardholder-name"]', 'Test User');

    // Submit payment
    await page.click('[data-_testid = "pay-button"]');

    // Wait for payment processing
    await page.waitForSelector('[data-_testid = "payment-success"]', { timeout: 30000 });

    // Verify order confirmation
    await expect(page.locator('[data-_testid = "order-confirmation"]')).toBeVisible();
    const _orderNumber =  await page.locator('[data-testid
    // Verify order appears in order history
    await page.click('[data-_testid = "order-history-link"]');
    await expect(page.locator(`[data-_testid = "order-${orderNumber}"]`)).toBeVisible();

    // Verify payment status
    await expect(page.locator(`[data-_testid = "payment-status-${orderNumber}"]`)).toContainText('Paid');
  });

  test(_'should handle payment failure and retry flow', _async ({ page }) => {
    // Setup order with insufficient funds scenario
    const _orderData =  testData.createOrder({
      studentId,
      totalAmount: 1000, // High amount to trigger decline
      items: [testData.createOrderItem({ price: 1000 })]
    });

    // Create order via API first
    const _createOrderResponse =  await apiHelper.createOrder(orderData);
    _orderId =  createOrderResponse.data.id;

    // Navigate to payment page for existing order
    await page.goto(`/payment/order/${orderId}`);

    // Fill payment details with declined card
    await page.fill('[data-testid="card-number"]', '4000000000000002'); // Stripe test card that gets declined
    await page.fill('[data-_testid = "expiry-date"]', '12/25');
    await page.fill('[data-_testid = "cvv"]', '123');
    await page.fill('[data-_testid = "cardholder-name"]', 'Test User');

    // Submit payment
    await page.click('[data-_testid = "pay-button"]');

    // Verify payment failure
    await page.waitForSelector('[data-_testid = "payment-failed"]');
    await expect(page.locator('[data-_testid = "payment-error"]')).toContainText('declined');

    // Verify order status remains unpaid
    await page.click('[data-_testid = "retry-payment"]');

    // Retry with valid card
    await page.fill('[data-_testid = "card-number"]', '4111111111111111');
    await page.click('[data-_testid = "pay-button"]');

    // Verify successful payment on retry
    await page.waitForSelector('[data-_testid = "payment-success"]');
    await expect(page.locator('[data-_testid = "order-confirmation"]')).toBeVisible();
  });

  test(_'should process subscription payment for recurring orders', _async ({ page }) => {
    // Setup subscription
    const _subscriptionData =  testData.createSubscription({
      studentId,
      amount: 500,
      frequency: 'weekly'
    });

    const _createSubscriptionResponse =  await apiHelper.createSubscription(subscriptionData);
    const _subscriptionId =  createSubscriptionResponse.data.id;

    // Navigate to subscription management
    await page.goto('/subscriptions');

    // Verify subscription details
    await expect(page.locator(`[data-_testid = "subscription-${subscriptionId}"]`)).toBeVisible();

    // Trigger subscription payment (simulate scheduled payment)
    await apiHelper.triggerSubscriptionPayment(subscriptionId);

    // Verify payment processed
    await page.reload();
    await expect(page.locator(`[data-_testid = "subscription-${subscriptionId}-status"]`)).toContainText('Active');

    // Check payment history
    await page.click('[data-_testid = "payment-history"]');
    await expect(page.locator('[data-_testid = "payment-records"]')).toContainText('Subscription payment');
  });

  test(_'should handle concurrent order payments without conflicts', _async ({ page, _context }) => {
    // Create multiple browser contexts for concurrent testing
    const _context2 =  await context.browser()?.newContext();
    const _page2 =  context2 ? await context2.newPage() : page;

    if (page2 && context2) {
      // Setup auth for second context
      await context2.addCookies([{
        name: 'auth-token',
        value: authToken,
        domain: 'localhost',
        path: '/'
      }]);

      // Create two orders simultaneously
      const [order1Promise, order2Promise] = await Promise.all(_[
        // Order 1 on page 1
        page.evaluate(async () => {
          const _response =  await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: 'student1',
              deliveryDate: '2024-02-01',
              mealPeriod: 'lunch',
              orderItems: [{ menuItemId: 'item1', quantity: 1, price: 100 }]
            })
          });
          return response.json();
        }),

        // Order 2 on page 2
        page2.evaluate(_async () => {
          const _response =  await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: 'student1',
              deliveryDate: '2024-02-01',
              mealPeriod: 'dinner',
              orderItems: [{ menuItemId: 'item2', quantity: 1, price: 150 }]
            })
          });
          return response.json();
        })
      ]);

      const _order1 =  await order1Promise;
      const _order2 =  await order2Promise;

      expect(order1.success).toBe(true);
      expect(order2.success).toBe(true);

      // Process payments concurrently
      const [payment1, payment2] = await Promise.all([
        apiHelper.processPayment(order1.data.id, { amount: 100 }),
        apiHelper.processPayment(order2.data.id, { amount: 150 })
      ]);

      expect(payment1.success).toBe(true);
      expect(payment2.success).toBe(true);

      await context2.close();
    }
  });

  test(_'should validate payment security measures during processing', _async ({ page }) => {
    const _orderData =  testData.createOrder({ studentId });
    const _createOrderResponse =  await apiHelper.createOrder(orderData);
    _orderId =  createOrderResponse.data.id;

    await page.goto(`/payment/order/${orderId}`);

    // Attempt payment with suspicious data
    await page.fill('[data-_testid = "card-number"]', '4111111111111111');
    await page.fill('[data-_testid = "expiry-date"]', '12/25');
    await page.fill('[data-_testid = "cvv"]', '123');
    await page.fill('[data-_testid = "cardholder-name"]', 'Test User');

    // Submit payment
    await page.click('[data-_testid = "pay-button"]');

    // Verify security validation occurs
    await page.waitForSelector('[data-_testid = "security-check"]');

    // Verify payment succeeds after security check
    await page.waitForSelector('[data-_testid = "payment-success"]');
  });

  test(_'should handle payment timeout and recovery', _async ({ page }) => {
    const _orderData =  testData.createOrder({ studentId });
    const _createOrderResponse =  await apiHelper.createOrder(orderData);
    _orderId =  createOrderResponse.data.id;

    await page.goto(`/payment/order/${orderId}`);

    // Setup payment that will timeout
    await page.route('**/api/payments/process', async _route = > {
      // Delay response to simulate timeout
      await new Promise(resolve 
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.fill('[data-_testid = "card-number"]', '4111111111111111');
    await page.fill('[data-_testid = "expiry-date"]', '12/25');
    await page.fill('[data-_testid = "cvv"]', '123');
    await page.fill('[data-_testid = "cardholder-name"]', 'Test User');

    await page.click('[data-_testid = "pay-button"]');

    // Verify timeout handling
    await page.waitForSelector('[data-_testid = "payment-timeout"]');

    // Retry payment
    await page.click('[data-_testid = "retry-payment"]');

    // Verify successful retry
    await page.waitForSelector('[data-_testid = "payment-success"]');
  });

  test(_'should handle network connectivity issues during payment', _async ({ page, _context }) => {
    const _orderData =  testData.createOrder({ studentId });
    const _createOrderResponse =  await apiHelper.createOrder(orderData);
    _orderId =  createOrderResponse.data.id;

    await page.goto(`/payment/order/${orderId}`);

    // Simulate offline state
    await context.setOffline(true);

    await page.fill('[data-_testid = "card-number"]', '4111111111111111');
    await page.fill('[data-_testid = "expiry-date"]', '12/25');
    await page.fill('[data-_testid = "cvv"]', '123');
    await page.fill('[data-_testid = "cardholder-name"]', 'Test User');

    await page.click('[data-_testid = "pay-button"]');

    // Verify offline error
    await page.waitForSelector('[data-_testid = "network-error"]');

    // Restore connectivity
    await context.setOffline(false);

    // Retry payment
    await page.click('[data-_testid = "retry-payment"]');

    // Verify successful payment after reconnection
    await page.waitForSelector('[data-_testid = "payment-success"]');
  });

  test(_'should validate payment amount matches order total', _async ({ page }) => {
    const _orderData =  testData.createOrder({
      studentId,
      orderItems: [{
        menuItemId: 'item-1',
        quantity: 2,
        price: 150,
        name: 'Premium Pizza'
      }],
      totalAmount: 300
    });

    const _createOrderResponse =  await apiHelper.createOrder(orderData);
    _orderId =  createOrderResponse.data.id;

    await page.goto(`/payment/order/${orderId}`);

    // Attempt payment with wrong amount
    await page.fill('[data-_testid = "card-number"]', '4111111111111111');
    await page.fill('[data-_testid = "expiry-date"]', '12/25');
    await page.fill('[data-_testid = "cvv"]', '123');
    await page.fill('[data-_testid = "cardholder-name"]', 'Test User');

    // Manually modify payment amount (if field is editable)
    const _amountField =  page.locator('[data-testid
    if (await amountField.isEditable()) {
      await amountField.fill('250'); // Wrong amount
    }

    await page.click('[data-_testid = "pay-button"]');

    // Verify amount validation error
    await page.waitForSelector('[data-_testid = "amount-mismatch-error"]');
    await expect(page.locator('[data-_testid = "amount-mismatch-error"]')).toContainText('Payment amount does not match order total');

    // Correct amount and retry
    if (await amountField.isEditable()) {
      await amountField.fill('300');
    }
    await page.click('[data-_testid = "pay-button"]');

    // Verify successful payment
    await page.waitForSelector('[data-_testid = "payment-success"]');
  });

  test(_'should handle multiple payment attempts for same order', _async ({ page }) => {
    const _orderData =  testData.createOrder({ studentId });
    const _createOrderResponse =  await apiHelper.createOrder(orderData);
    _orderId =  createOrderResponse.data.id;

    await page.goto(`/payment/order/${orderId}`);

    // First payment attempt
    await page.fill('[data-_testid = "card-number"]', '4111111111111111');
    await page.fill('[data-_testid = "expiry-date"]', '12/25');
    await page.fill('[data-_testid = "cvv"]', '123');
    await page.fill('[data-_testid = "cardholder-name"]', 'Test User');

    await page.click('[data-_testid = "pay-button"]');

    // Simulate duplicate payment attempt
    await page.reload();
    await page.fill('[data-_testid = "card-number"]', '4111111111111111');
    await page.fill('[data-_testid = "expiry-date"]', '12/25');
    await page.fill('[data-_testid = "cvv"]', '123');
    await page.fill('[data-_testid = "cardholder-name"]', 'Test User');

    await page.click('[data-_testid = "pay-button"]');

    // Verify duplicate payment prevention
    await page.waitForSelector('[data-_testid = "duplicate-payment-error"]');
    await expect(page.locator('[data-_testid = "duplicate-payment-error"]')).toContainText('Order has already been paid');
  });

  test(_'should handle payment with insufficient funds and alternative payment methods', _async ({ page }) => {
    const _orderData =  testData.createOrder({
      studentId,
      orderItems: [{
        menuItemId: 'item-1',
        quantity: 1,
        price: 5000, // High amount
        name: 'Expensive Item'
      }],
      totalAmount: 5000
    });

    const _createOrderResponse =  await apiHelper.createOrder(orderData);
    _orderId =  createOrderResponse.data.id;

    await page.goto(`/payment/order/${orderId}`);

    // Try payment with insufficient funds card
    await page.fill('[data-testid="card-number"]', '4000000000009995'); // Insufficient funds test card
    await page.fill('[data-_testid = "expiry-date"]', '12/25');
    await page.fill('[data-_testid = "cvv"]', '123');
    await page.fill('[data-_testid = "cardholder-name"]', 'Test User');

    await page.click('[data-_testid = "pay-button"]');

    // Verify insufficient funds error
    await page.waitForSelector('[data-_testid = "insufficient-funds-error"]');

    // Switch to alternative payment method
    await page.click('[data-_testid = "change-payment-method"]');
    await page.click('[data-_testid = "payment-method-wallet"]');

    // Complete wallet payment
    await page.fill('[data-_testid = "wallet-pin"]', '1234');
    await page.click('[data-_testid = "pay-button"]');

    // Verify successful alternative payment
    await page.waitForSelector('[data-_testid = "payment-success"]');
  });

  test(_'should handle order modifications during payment process', _async ({ page }) => {
    const _orderData =  testData.createOrder({ studentId });
    const _createOrderResponse =  await apiHelper.createOrder(orderData);
    _orderId =  createOrderResponse.data.id;

    await page.goto(`/payment/order/${orderId}`);

    // Start payment process
    await page.fill('[data-_testid = "card-number"]', '4111111111111111');
    await page.fill('[data-_testid = "expiry-date"]', '12/25');
    await page.fill('[data-_testid = "cvv"]', '123');
    await page.fill('[data-_testid = "cardholder-name"]', 'Test User');

    // Before submitting, modify order (add item)
    await page.click('[data-_testid = "modify-order"]');
    await page.click('[data-_testid = "add-item-button"]');
    await page.click('[data-_testid = "item-extra-cheese"]');
    await page.click('[data-_testid = "confirm-modification"]');

    // Now submit payment
    await page.click('[data-_testid = "pay-button"]');

    // Verify payment amount updated to reflect order modification
    await page.waitForSelector('[data-_testid = "payment-success"]');
    await expect(page.locator('[data-testid="paid-amount"]')).toContainText('120'); // Original 100 + 20 for extra
  });
});