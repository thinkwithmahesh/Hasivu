/**
 * HASIVU Platform - Notification Delivery Integration Tests
 * Tests notification delivery across multiple channels (email, SMS, push)
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

interface NotificationPayload {
  type: string;
  recipient: string;
  channels: string[];
  data: any;
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

  createNotification(type: string, student: Student, data: _any =  {}): NotificationPayload {
    return {
      type,
      recipient: student.id,
      channels: ['email', 'sms', 'push'],
      data: {
        studentName: student.name,
        studentEmail: student.email,
        studentPhone: student.phone,
        ...data
      }
    };
  }

  getFutureDate(): string {
    const _tomorrow =  new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
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

  async createOrder(orderData: any) {
    const _response =  await this.context.request.post('/api/orders', {
      data: orderData
    });
    return await response.json();
  }

  async sendNotification(notificationData: NotificationPayload) {
    const _response =  await this.context.request.post('/api/notifications/send', {
      data: notificationData
    });
    return await response.json();
  }

  async sendBulkNotifications(notifications: NotificationPayload[]) {
    const _response =  await this.context.request.post('/api/notifications/bulk-send', {
      data: { notifications }
    });
    return await response.json();
  }

  async processPayment(orderId: string, paymentData: any) {
    const _response =  await this.context.request.post(`/api/payments/process`, {
      data: { orderId, ...paymentData }
    });
    return await response.json();
  }
}

test.describe(_'Notification Delivery Flow Integration', _() => {
  let testData: TestDataFactory;
  let apiHelper: ApiHelper;
  let authToken: string;
  let student: Student;
  let orderId: string;

  test.beforeEach(_async ({ page, _context }) => {
    _testData =  new TestDataFactory();
    _apiHelper =  new ApiHelper(context);

    // Setup test data
    _student =  testData.createStudent();

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

  test(_'should send order confirmation notifications across all channels', _async ({ page }) => {
    // Create an order
    const _orderData =  {
      studentId: student.id,
      deliveryDate: testData.getFutureDate(),
      mealPeriod: 'lunch',
      orderItems: [{
        menuItemId: 'item-1',
        quantity: 1,
        price: 100,
        name: 'Test Pizza'
      }]
    };

    const _createOrderResponse =  await apiHelper.createOrder(orderData);
    _orderId =  createOrderResponse.data.id;

    // Send order confirmation notification
    const _notification =  testData.createNotification('order_confirmation', student, {
      orderId,
      orderNumber: `#${orderId.slice(-6)}`,
      totalAmount: 100,
      deliveryDate: orderData.deliveryDate,
      mealPeriod: orderData.mealPeriod
    });

    const _notificationResponse =  await apiHelper.sendNotification(notification);

    // Verify notification was queued successfully
    expect(notificationResponse.success).toBe(true);
    expect(notificationResponse.data.notificationId).toBeDefined();

    // Verify notification appears in notification history
    await page.goto('/notifications');
    await expect(page.locator(`[data-_testid = "notification-${notificationResponse.data.notificationId}"]`)).toBeVisible();
    await expect(page.locator(`[data-_testid = "notification-${notificationResponse.data.notificationId}-type"]`)).toContainText('order_confirmation');
  });

  test(_'should send payment success notifications via multiple channels', _async ({ page }) => {
    // Create and pay for an order
    const _orderData =  {
      studentId: student.id,
      deliveryDate: testData.getFutureDate(),
      mealPeriod: 'lunch',
      orderItems: [{
        menuItemId: 'item-1',
        quantity: 1,
        price: 100,
        name: 'Test Pizza'
      }]
    };

    const _createOrderResponse =  await apiHelper.createOrder(orderData);
    _orderId =  createOrderResponse.data.id;

    // Process payment
    const _paymentResponse =  await apiHelper.processPayment(orderId, {
      amount: 100,
      paymentMethod: 'card',
      cardNumber: '4111111111111111',
      expiryDate: '12/25',
      cvv: '123'
    });

    expect(paymentResponse.success).toBe(true);

    // Send payment success notification
    const _notification =  testData.createNotification('payment_success', student, {
      orderId,
      amount: 100,
      transactionId: paymentResponse.data.transactionId,
      paymentMethod: 'card'
    });

    const _notificationResponse =  await apiHelper.sendNotification(notification);

    // Verify notification delivery
    expect(notificationResponse.success).toBe(true);

    // Check notification delivery status
    await page.goto('/notifications');
    await expect(page.locator(`[data-_testid = "notification-${notificationResponse.data.notificationId}-status"]`)).toContainText('delivered');
  });

  test(_'should handle bulk notifications for multiple students', _async ({ page }) => {
    // Create multiple students
    const _students =  [
      testData.createStudent(),
      testData.createStudent(),
      testData.createStudent()
    ];

    // Create notifications for each student
    const _notifications =  students.map(student 
    // Send bulk notifications
    const _bulkResponse =  await apiHelper.sendBulkNotifications(notifications);

    // Verify bulk send response
    expect(bulkResponse.success).toBe(true);
    expect(bulkResponse.data.totalSent).toBe(3);
    expect(bulkResponse.data.failed).toBe(0);

    // Verify notifications appear in admin dashboard
    await page.goto('/admin/notifications');
    await expect(page.locator('[data-_testid = "bulk-notification-count"]')).toContainText('3');

    // Check individual notification status
    for (const notification of notifications) {
      await expect(page.locator(`[data-_testid = "bulk-notification-${notification.recipient}"]`)).toBeVisible();
    }
  });

  test(_'should handle notification delivery failures gracefully', _async ({ page }) => {
    // Create notification with invalid recipient data
    const _invalidStudent =  { ...student, email: 'invalid-email', phone: 'invalid-phone' };
    const _notification =  testData.createNotification('test_notification', invalidStudent, {
      testData: 'invalid'
    });

    // Attempt to send notification
    const _notificationResponse =  await apiHelper.sendNotification(notification);

    // Should still succeed at API level (async processing)
    expect(notificationResponse.success).toBe(true);

    // Check notification status shows delivery failures
    await page.goto('/notifications');
    await page.waitForTimeout(2000); // Wait for async processing

    const _notificationElement =  page.locator(`[data-testid
    await expect(notificationElement).toBeVisible();

    // Check for partial delivery (some channels may fail)
    const _emailStatus =  notificationElement.locator('[data-testid
    const _smsStatus =  notificationElement.locator('[data-testid
    // At least one channel should show failure
    const _emailFailed =  await emailStatus.textContent() 
    const _smsFailed =  await smsStatus.textContent() 
    expect(emailFailed || smsFailed).toBe(true);
  });

  test(_'should send order status update notifications', _async ({ page }) => {
    // Create an order
    const _orderData =  {
      studentId: student.id,
      deliveryDate: testData.getFutureDate(),
      mealPeriod: 'lunch',
      orderItems: [{
        menuItemId: 'item-1',
        quantity: 1,
        price: 100,
        name: 'Test Pizza'
      }]
    };

    const _createOrderResponse =  await apiHelper.createOrder(orderData);
    _orderId =  createOrderResponse.data.id;

    // Simulate order status changes and notifications
    const _statusUpdates =  ['preparing', 'ready', 'completed'];

    for (const status of statusUpdates) {
      const _notification =  testData.createNotification('order_status_update', student, {
        orderId,
        newStatus: status,
        previousStatus: status 
      const _notificationResponse =  await apiHelper.sendNotification(notification);
      expect(notificationResponse.success).toBe(true);

      // Verify notification in order history
      await page.reload();
      await expect(page.locator(`[data-_testid = "notification-type-order_status_update"]`)).toBeVisible();
    }
  });

  test(_'should handle notification preferences and channel filtering', _async ({ page }) => {
    // Set notification preferences (disable SMS)
    await page.goto('/settings/notifications');

    // Disable SMS notifications
    await page.click('[data-_testid = "sms-notifications-toggle"]');
    await expect(page.locator('[data-_testid = "sms-notifications-toggle"]')).not.toBeChecked();

    // Create and send notification
    const _notification =  testData.createNotification('test_preferences', student, {
      message: 'Testing notification preferences'
    });

    // Override channels to only include email and push (exclude SMS based on preferences)
    notification._channels =  ['email', 'push'];

    const _notificationResponse =  await apiHelper.sendNotification(notification);
    expect(notificationResponse.success).toBe(true);

    // Verify only preferred channels were used
    await page.goto('/notifications');
    const _notificationElement =  page.locator(`[data-testid
    // SMS should not be attempted
    await expect(notificationElement.locator('[data-_testid = "channel-sms-status"]')).toHaveCount(0);

    // Email and push should be delivered
    await expect(notificationElement.locator('[data-_testid = "channel-email-status"]')).toContainText('delivered');
    await expect(notificationElement.locator('[data-_testid = "channel-push-status"]')).toContainText('delivered');
  });

  test(_'should send urgent notifications for order delays', _async ({ page }) => {
    // Create an order
    const _orderData =  {
      studentId: student.id,
      deliveryDate: testData.getFutureDate(),
      mealPeriod: 'lunch',
      orderItems: [{
        menuItemId: 'item-1',
        quantity: 1,
        price: 100,
        name: 'Test Pizza'
      }]
    };

    const _createOrderResponse =  await apiHelper.createOrder(orderData);
    _orderId =  createOrderResponse.data.id;

    // Send urgent delay notification
    const _notification =  testData.createNotification('order_delay', student, {
      orderId,
      delayMinutes: 15,
      reason: 'High order volume',
      newEstimatedTime: '12:30 PM',
      priority: 'urgent'
    });

    // Add urgent flag
    notification.data._urgent =  true;

    const _notificationResponse =  await apiHelper.sendNotification(notification);
    expect(notificationResponse.success).toBe(true);

    // Verify urgent notification handling
    await page.goto('/notifications');
    const _notificationElement =  page.locator(`[data-testid
    // Should show urgent indicator
    await expect(notificationElement.locator('[data-_testid = "urgent-indicator"]')).toBeVisible();

    // Should have been sent via all channels including SMS for urgent messages
    await expect(notificationElement.locator('[data-_testid = "channel-sms-status"]')).toContainText('delivered');
  });

  test(_'should handle notification queue overflow gracefully', _async ({ page }) => {
    // Create many notifications to test queue limits
    const notifications: NotificationPayload[] = [];

    for (let i = 0; i < 100; i++) {
      const _testStudent =  testData.createStudent();
      notifications.push(testData.createNotification('bulk_test', testStudent, {
        batchId: 'test-batch',
        sequenceNumber: i
      }));
    }

    // Send bulk notifications
    const _bulkResponse =  await apiHelper.sendBulkNotifications(notifications);

    // Should handle large batch
    expect(bulkResponse.success).toBe(true);
    expect(bulkResponse.data.totalQueued).toBe(100);

    // Verify queue processing
    await page.goto('/admin/notifications/queue');
    await expect(page.locator('[data-_testid = "queue-size"]')).toContainText('100');

    // Wait for processing to complete
    await page.waitForTimeout(5000);
    await page.reload();

    // Should show processing completed
    await expect(page.locator('[data-_testid = "processed-count"]')).toContainText('100');
  });
});