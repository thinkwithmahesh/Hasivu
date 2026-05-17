/**
 * HASIVU Platform - Cross-Epic Integration Tests
 * Cross-Epic Error Propagation Integration Test
 *
 * Comprehensive integration test for error propagation and handling across multiple business domains
 * spanning all epics (User Management, Order Management, Payment Processing, Notifications, Analytics)
 *
 * Epic Coverage:
 * - Epic 1: User Management & Authentication System
 * - Epic 2: Order Management System
 * - Epic 5: Payment Processing & Billing System
 * - Epic 4: Notification & Communication System
 * - Epic 3: Analytics & Reporting System
 *
 * Flow: Error Generation → Cross-Service Propagation → Error Handling → Recovery Mechanisms
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Import system services
import { UserService } from '../../src/services/user.service';
import { OrderService } from '../../src/services/order.service';
import { PaymentService } from '../../src/services/payment.service';
import { NotificationService } from '../../src/services/notification.service';
import { AnalyticsService } from '../../src/services/analytics.service';
import { MenuItemService } from '../../src/services/menuItem.service';

// Mock services for unavailable imports
class SubscriptionService { async create() { return { success: true }; } }
class InvoiceService { async generate() { return { success: true }; } }
class AuditService { async log() { return { success: true }; } }
class SchoolService { async findById() { return { success: true }; } }

// Test configuration
const TEST_CONFIG = {
  apiBaseUrl: process.env.TEST_API_BASE_URL || 'http://localhost:3000/api',
  jwtSecret: process.env.JWT_SECRET || 'test_jwt_secret_key',
  databaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/hasivu_test',
  webhookSecret: process.env.WEBHOOK_SECRET || 'test_webhook_secret',
  maxRetries: 3,
  timeoutMs: 30000
};

// Global test state
let prisma: PrismaClient;
let userService: UserService;
let orderService: OrderService;
let paymentService: PaymentService;
let notificationService: NotificationService;
// AnalyticsService uses static methods, no instance needed
let menuItemService: MenuItemService;

// Test data containers
let testSchoolId: string;
let testParentId: string;
let testStudentId: string;
let testParentToken: string;
let testStudentToken: string;
let testOrderIds: string[];
let testPaymentIds: string[];
let testMenuItemIds: string[];

// Performance tracking
let performanceMetrics: {
  errorPropagationTime: number[];
  errorRecoveryTime: number[];
  errorHandlingTime: number[];
};

/**
 * Global test setup and teardown
 */
beforeAll(async () => {
  console.log('🚀 Initializing Cross-Epic Error Propagation Test Environment...');

  try {
    // Initialize database connection
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: TEST_CONFIG.databaseUrl
        }
      },
      log: ['error', 'warn']
    });

    // Initialize services using singleton getInstance() methods
    userService = UserService.getInstance();
    orderService = OrderService.getInstance();
    paymentService = PaymentService.getInstance();
    notificationService = NotificationService.getInstance();
    // AnalyticsService uses static methods, no getInstance() needed
    menuItemService = MenuItemService.getInstance();

    // Clear test data
    await cleanupTestData();

    // Set up test school
    const schoolData = {
      name: 'Test Error Propagation School',
      address: '123 Error Test Lane',
      city: 'TestCity',
      state: 'TestState',
      pincode: '123456',
      phone: '+91-9876543210',
      email: 'error-test@school.com',
      principalName: 'Error Test Principal',
      principalEmail: 'principal@error-test.com',
      settings: {
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        errorHandling: {
          enabled: true,
          propagateErrors: true,
          retryMechanisms: true,
          fallbackServices: true
        }
      }
    };

    let school;
    if ('createSchool' in (userService as any) && typeof (userService as any).createSchool === 'function') {
      school = await (userService as any).createSchool(schoolData);
    } else {
      school = { id: 'school-error-test-id', ...schoolData };
    }
    testSchoolId = school.id;

    // Set up test users
    const parentData = {
      email: 'parent@error-test.com',
      password: 'SecurePassword123!',
      firstName: 'Error',
      lastName: 'Parent',
      role: 'PARENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543213'
    };

    let parent;
    if ('createUser' in userService && typeof (userService as any).createUser === 'function') {
      parent = await (userService as any).createUser(parentData);
    } else {
      parent = { id: 'parent-error-test-id', ...parentData };
    }
    testParentId = parent.id;
    testParentToken = jwt.sign(
      {
        userId: parent.id,
        schoolId: testSchoolId,
        role: 'PARENT'
      },
      TEST_CONFIG.jwtSecret,
      { expiresIn: '24h' }
    );

    const studentData = {
      email: 'student@error-test.com',
      password: 'SecurePassword123!',
      firstName: 'Error',
      lastName: 'Student',
      role: 'STUDENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543215',
      profile: {
        class: '10th Grade',
        section: 'A',
        rollNumber: 'ET001',
        parentId: testParentId
      }
    };

    let student;
    if ('createUser' in userService && typeof (userService as any).createUser === 'function') {
      student = await (userService as any).createUser(studentData);
    } else {
      student = { id: 'student-error-test-id', ...studentData };
    }
    testStudentId = student.id;
    testStudentToken = jwt.sign(
      {
        userId: student.id,
        schoolId: testSchoolId,
        role: 'STUDENT',
        parentId: testParentId
      },
      TEST_CONFIG.jwtSecret,
      { expiresIn: '24h' }
    );

    // Set up test menu items
    const menuItems = [
      {
        name: 'Error Test Meal',
        description: 'Meal for error propagation testing',
        price: 12000, // ₹120.00
        category: 'Main Course',
        nutritionalInfo: {
          calories: 450,
          protein: 25,
          carbs: 50,
          fat: 15
        },
        isAvailable: true,
        schoolId: testSchoolId
      },
      {
        name: 'Error Test Drink',
        description: 'Drink for error propagation testing',
        price: 4000, // ₹40.00
        category: 'Beverage',
        nutritionalInfo: {
          calories: 150,
          protein: 1,
          carbs: 20,
          fat: 2
        },
        isAvailable: true,
        schoolId: testSchoolId
      }
    ];

    testMenuItemIds = [];
    for (const item of menuItems) {
      let menuItem;
      if ('createMenuItem' in menuItemService && typeof (menuItemService as any).createMenuItem === 'function') {
        menuItem = await (menuItemService as any).createMenuItem(item);
      } else {
        menuItem = { id: `menu-${uuidv4()}`, ...item };
      }
      testMenuItemIds.push(menuItem.id);
    }

    // Initialize performance tracking
    performanceMetrics = {
      errorPropagationTime: [],
      errorRecoveryTime: [],
      errorHandlingTime: []
    };

    console.log(`✅ Cross-Epic Error Propagation Test Environment Ready`);
    console.log(`📊 School: ${testSchoolId}, Menu Items: ${testMenuItemIds.length}`);

  } catch (error) {
    console.error('❌ Failed to initialize test environment:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  console.log('🧹 Cleaning up Cross-Epic Error Propagation Test Environment...');

  try {
    await cleanupTestData();
    await prisma.$disconnect();
    console.log('✅ Cross-Epic Error Propagation cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}, 30000);

/**
 * Test data cleanup utility
 */
async function cleanupTestData(): Promise<void> {
  try {
    // Clean in dependency order
    if ('paymentRefund' in prisma) {
      await (prisma as any).paymentRefund.deleteMany({});
    }
    if ('payment' in prisma) {
      await prisma.payment.deleteMany({});
    }
    if ('paymentMethod' in prisma) {
      await prisma.paymentMethod.deleteMany({});
    }
    if ('orderItem' in prisma) {
      await prisma.orderItem.deleteMany({});
    }
    if ('order' in prisma) {
      await prisma.order.deleteMany({});
    }
    if ('notification' in prisma) {
      await prisma.notification.deleteMany({});
    }
    if ('menuItem' in prisma) {
      await prisma.menuItem.deleteMany({ where: { schoolId: testSchoolId } });
    }
    if ('user' in prisma) {
      await prisma.user.deleteMany({ where: { schoolId: testSchoolId } });
    }
    if ('school' in prisma) {
      await prisma.school.deleteMany({ where: { id: testSchoolId } });
    }

    console.log('🗑️ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Cleanup warning (non-critical):', error);
  }
}

/**
 * API request helper with authentication
 */
async function apiRequest(
  method: string,
  endpoint: string,
  data?: any,
  token?: string
): Promise<any> {
  const url = `${TEST_CONFIG.apiBaseUrl}${endpoint}`;
  const startTime = Date.now();

  const fetchOptions: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined,
      'X-School-ID': testSchoolId,
      'X-Request-ID': uuidv4()
    },
    timeout: TEST_CONFIG.timeoutMs
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    fetchOptions.body = JSON.stringify(data);
  }

  const response = await fetch(url, fetchOptions);
  const responseTime = Date.now() - startTime;

  let responseData;
  try {
    responseData = await response.json();
  } catch (parseError) {
    responseData = { message: 'Invalid JSON response', text: await response.text() };
  }

  return {
    status: response.status,
    data: responseData,
    responseTime,
    headers: Object.fromEntries(response.headers.entries())
  };
}

/**
 * Cross-Epic Error Propagation Integration Tests
 */
describe('Cross-Epic Error Propagation Integration Tests', () => {

  console.log(`🚨 Testing error propagation across all epics`);

  beforeEach(async () => {
    // Reset test data for each test
    await cleanupTestData();
  });

  /**
   * Payment Failure Error Propagation Test
   */
  test('should propagate payment failures across order, notification, and analytics services', async () => {
    console.log('💸 Testing payment failure error propagation...');

    const errorStartTime = Date.now();

    // Step 1: Create order
    const orderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [{
        menuItemId: testMenuItemIds[0],
        quantity: 1
      }],
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeSlot: '12:00-13:00',
      paymentMethod: 'razorpay'
    };

    const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
    expect(orderResponse.status).toBe(201);
    const orderId = orderResponse.data.id;

    console.log(`📦 Order created: ${orderId}`);

    // Step 2: Set up payment method that will fail
    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4000000000000002', // Declined card
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Failure Test Parent'
      },
      isDefault: true
    }, testParentToken);
    const paymentMethodId = paymentMethodResponse.data.id;

    // Step 3: Process payment that will fail
    const paymentResponse = await apiRequest('POST', '/payments/process', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId,
      simulateFailure: true,
      failureReason: 'insufficient_funds'
    }, testParentToken);
    const {paymentId} = paymentResponse.data;

    // Step 4: Confirm payment failure
    const failureResponse = await apiRequest('POST', `/payments/${paymentId}/fail`, {
      paymentId,
      status: 'failed',
      error: {
        code: 'PAYMENT_FAILED',
        message: 'Insufficient funds',
        gatewayError: 'insufficient_funds'
      }
    }, testParentToken);
    expect(failureResponse.status).toBe(200);

    const errorPropagationTime = Date.now() - errorStartTime;
    performanceMetrics.errorPropagationTime.push(errorPropagationTime);

    console.log(`❌ Payment failed, error propagation initiated (${errorPropagationTime}ms)`);

    // Step 5: Verify error propagation to order service
    const orderAfterFailureResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
    expect(orderAfterFailureResponse.data.status).toBe('payment_pending'); // Should reflect payment failure
    expect(orderAfterFailureResponse.data).toHaveProperty('lastPaymentError');
    expect(orderAfterFailureResponse.data.lastPaymentError.code).toBe('PAYMENT_FAILED');

    console.log(`📋 Order service updated with payment failure status`);

    // Step 6: Verify error propagation to notification service
    const failureNotificationsResponse = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'payment_failed'
    }, testParentToken);

    expect(failureNotificationsResponse.data.length).toBeGreaterThan(0);
    const failureNotification = failureNotificationsResponse.data.find((n: any) =>
      n.data?.orderId === orderId && n.type === 'payment_failed'
    );
    expect(failureNotification).toBeDefined();
    expect(failureNotification.data).toHaveProperty('error');
    expect(failureNotification.data.error.code).toBe('PAYMENT_FAILED');

    console.log(`📧 Notification service sent payment failure notifications`);

    // Step 7: Verify error propagation to analytics service
    const analyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
    expect(analyticsResponse.data).toHaveProperty('paymentFailures');
    expect(analyticsResponse.data.paymentFailures.count).toBeGreaterThan(0);
    expect(analyticsResponse.data).toHaveProperty('lastPaymentError');
    expect(analyticsResponse.data.lastPaymentError.code).toBe('PAYMENT_FAILED');

    // Check payment analytics specifically
    const paymentAnalyticsResponse = await apiRequest('GET', '/analytics/payments/summary', {
      userId: testParentId,
      timeframe: 'all_time'
    }, testParentToken);

    expect(paymentAnalyticsResponse.data).toHaveProperty('failureRate');
    expect(paymentAnalyticsResponse.data.failureRate).toBeGreaterThan(0);
    expect(paymentAnalyticsResponse.data).toHaveProperty('lastFailure');
    expect(paymentAnalyticsResponse.data.lastFailure.errorCode).toBe('PAYMENT_FAILED');

    console.log(`📊 Analytics service recorded payment failure metrics`);

    // Step 8: Verify audit trail error propagation
    const auditResponse = await apiRequest('GET', '/audit/transactions', {
      entityId: orderId,
      entityType: 'order'
    }, testParentToken);

    const errorEvents = auditResponse.data.events.filter((e: any) =>
      e.action === 'payment.failed' || e.action === 'error.propagated'
    );
    expect(errorEvents.length).toBeGreaterThan(0);

    const paymentFailureEvent = errorEvents.find((e: any) => e.action === 'payment.failed');
    expect(paymentFailureEvent).toBeDefined();
    expect(paymentFailureEvent.metadata.errorCode).toBe('PAYMENT_FAILED');

    console.log(`📋 Audit trail recorded error propagation events`);
  });

  /**
   * Service Unavailability Error Propagation Test
   */
  test('should handle and propagate service unavailability errors', async () => {
    console.log('🔌 Testing service unavailability error propagation...');

    // Step 1: Create order
    const orderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [{
        menuItemId: testMenuItemIds[0],
        quantity: 1
      }],
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeSlot: '12:00-13:00',
      paymentMethod: 'razorpay'
    };

    const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
    const orderId = orderResponse.data.id;

    // Step 2: Simulate payment service unavailability
    const paymentResponse = await apiRequest('POST', '/payments/process', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: 'pm_test_card',
      simulateServiceUnavailable: true
    }, testParentToken);

    // Should receive service unavailable error
    expect(paymentResponse.status).toBe(503);
    expect(paymentResponse.data).toHaveProperty('error');
    expect(paymentResponse.data.error.code).toBe('SERVICE_UNAVAILABLE');

    console.log(`🔌 Payment service unavailable error received`);

    // Step 3: Verify error propagation to order service
    const orderAfterErrorResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
    expect(orderAfterErrorResponse.data).toHaveProperty('serviceErrors');
    expect(orderAfterErrorResponse.data.serviceErrors.length).toBeGreaterThan(0);

    const paymentServiceError = orderAfterErrorResponse.data.serviceErrors.find((e: any) =>
      e.service === 'payment' && e.code === 'SERVICE_UNAVAILABLE'
    );
    expect(paymentServiceError).toBeDefined();

    console.log(`📋 Order service recorded service unavailability error`);

    // Step 4: Verify error propagation to notification service
    const errorNotificationsResponse = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'service_error'
    }, testParentToken);

    expect(errorNotificationsResponse.data.length).toBeGreaterThan(0);
    const serviceErrorNotification = errorNotificationsResponse.data.find((n: any) =>
      n.data?.service === 'payment' && n.data?.errorCode === 'SERVICE_UNAVAILABLE'
    );
    expect(serviceErrorNotification).toBeDefined();

    console.log(`📧 Notification service sent service error notifications`);

    // Step 5: Verify error propagation to analytics service
    const analyticsResponse = await apiRequest('GET', `/analytics/system/health`, undefined, testParentToken);
    expect(analyticsResponse.data).toHaveProperty('serviceErrors');
    expect(analyticsResponse.data.serviceErrors).toHaveProperty('payment');
    expect(analyticsResponse.data.serviceErrors.payment.unavailableCount).toBeGreaterThan(0);

    console.log(`📊 Analytics service recorded service health issues`);

    // Step 6: Test error recovery when service becomes available
    const recoveryStartTime = Date.now();

    // Retry payment with service now available
    const retryPaymentResponse = await apiRequest('POST', '/payments/process', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: 'pm_test_card',
      description: 'Retry after service recovery'
    }, testParentToken);

    expect(retryPaymentResponse.status).toBe(200);
    const retryPaymentId = retryPaymentResponse.data.paymentId;

    // Complete payment
    await apiRequest('POST', `/payments/${retryPaymentId}/confirm`, {
      paymentId: retryPaymentId,
      status: 'completed',
      transactionId: `txn_recovery_${uuidv4()}`
    }, testParentToken);

    const errorRecoveryTime = Date.now() - recoveryStartTime;
    performanceMetrics.errorRecoveryTime.push(errorRecoveryTime);

    // Step 7: Verify recovery propagation
    const orderAfterRecoveryResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
    expect(orderAfterRecoveryResponse.data.status).toBe('confirmed');

    // Check recovery notifications
    const recoveryNotificationsResponse = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'service_recovery'
    }, testParentToken);

    expect(recoveryNotificationsResponse.data.length).toBeGreaterThan(0);

    console.log(`🔄 Service recovery successful, error propagation reversed (${errorRecoveryTime}ms)`);
  });

  /**
   * Cascading Error Propagation Test
   */
  test('should handle cascading errors across dependent services', async () => {
    console.log('🔗 Testing cascading error propagation...');

    const cascadeStartTime = Date.now();

    // Step 1: Create multiple dependent orders
    const orders = [];
    for (let i = 0; i < 3; i++) {
      const orderData = {
        studentId: testStudentId,
        schoolId: testSchoolId,
        items: [{
          menuItemId: testMenuItemIds[i % testMenuItemIds.length],
          quantity: 1
        }],
        deliveryDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryTimeSlot: '12:00-13:00',
        paymentMethod: 'razorpay'
      };

      const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
      orders.push({
        id: orderResponse.data.id,
        amount: orderResponse.data.totalAmount
      });
    }

    console.log(`📦 Created ${orders.length} dependent orders`);

    // Step 2: Set up payment method
    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Cascade Test Parent'
      },
      isDefault: true
    }, testParentToken);
    const paymentMethodId = paymentMethodResponse.data.id;

    // Step 3: Process bulk payment that will partially fail
    const bulkPaymentData = {
      orders: orders.map(order => ({
        orderId: order.id,
        amount: order.amount,
        currency: 'INR'
      })),
      paymentMethodId,
      description: `Bulk payment for ${orders.length} orders`,
      simulatePartialFailure: true,
      failurePattern: [false, true, false] // First and third succeed, second fails
    };

    const bulkPaymentResponse = await apiRequest('POST', '/payments/process/bulk', bulkPaymentData, testParentToken);
    expect(bulkPaymentResponse.status).toBe(207); // Multi-status response
    expect(bulkPaymentResponse.data).toHaveProperty('results');
    expect(bulkPaymentResponse.data.results.length).toBe(3);

    const successfulPayments = bulkPaymentResponse.data.results.filter((r: any) => r.success).length;
    const failedPayments = bulkPaymentResponse.data.results.filter((r: any) => !r.success).length;

    expect(successfulPayments).toBe(2);
    expect(failedPayments).toBe(1);

    console.log(`⚖️ Bulk payment partially failed: ${successfulPayments} success, ${failedPayments} failed`);

    // Step 4: Verify cascading error propagation
    const errorHandlingStartTime = Date.now();

    // Check order statuses reflect the payment results
    for (let i = 0; i < orders.length; i++) {
      const orderResponse = await apiRequest('GET', `/orders/${orders[i].id}`, undefined, testParentToken);
      const expectedStatus = bulkPaymentResponse.data.results[i].success ? 'confirmed' : 'payment_pending';

      expect(orderResponse.data.status).toBe(expectedStatus);

      if (!bulkPaymentResponse.data.results[i].success) {
        expect(orderResponse.data).toHaveProperty('lastPaymentError');
      }
    }

    console.log(`📋 Order statuses updated to reflect payment results`);

    // Step 5: Verify notification cascade
    const notificationsResponse = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      limit: 20
    }, testParentToken);

    const successNotifications = notificationsResponse.data.filter((n: any) => n.type === 'payment_confirmation');
    const failureNotifications = notificationsResponse.data.filter((n: any) => n.type === 'payment_failed');

    expect(successNotifications.length).toBe(2);
    expect(failureNotifications.length).toBe(1);

    console.log(`📧 Notifications sent: ${successNotifications.length} confirmations, ${failureNotifications.length} failures`);

    // Step 6: Verify analytics cascade
    const analyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
    expect(analyticsResponse.data.totalOrders).toBe(3);
    expect(analyticsResponse.data.totalPayments).toBe(2); // Only successful payments counted
    expect(analyticsResponse.data.paymentFailures.count).toBe(1);

    console.log(`📊 Analytics updated with partial success metrics`);

    // Step 7: Test error recovery for failed payment
    const failedOrderIndex = bulkPaymentResponse.data.results.findIndex((r: any) => !r.success);
    const failedOrder = orders[failedOrderIndex];

    // Retry failed payment
    const retryPaymentResponse = await apiRequest('POST', '/payments/process', {
      orderId: failedOrder.id,
      amount: failedOrder.amount,
      currency: 'INR',
      paymentMethodId,
      description: 'Retry failed payment'
    }, testParentToken);
    const retryPaymentId = retryPaymentResponse.data.paymentId;

    // Complete retry payment
    await apiRequest('POST', `/payments/${retryPaymentId}/confirm`, {
      paymentId: retryPaymentId,
      status: 'completed',
      transactionId: `txn_retry_cascade_${uuidv4()}`
    }, testParentToken);

    const errorHandlingTime = Date.now() - errorHandlingStartTime;
    performanceMetrics.errorHandlingTime.push(errorHandlingTime);

    // Step 8: Verify recovery propagation
    const recoveredOrderResponse = await apiRequest('GET', `/orders/${failedOrder.id}`, undefined, testParentToken);
    expect(recoveredOrderResponse.data.status).toBe('confirmed');

    // Check final analytics
    const finalAnalyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
    expect(finalAnalyticsResponse.data.totalPayments).toBe(3); // All payments now successful
    expect(finalAnalyticsResponse.data.paymentFailures.count).toBe(0); // Failures resolved

    console.log(`✅ Cascading error recovery completed (${errorHandlingTime}ms)`);

    const totalCascadeTime = Date.now() - cascadeStartTime;
    console.log(`🔗 Complete cascading error propagation test completed in ${totalCascadeTime}ms`);
  });

  /**
   * Timeout and Circuit Breaker Error Propagation Test
   */
  test('should propagate timeout and circuit breaker errors across services', async () => {
    console.log('⏱️ Testing timeout and circuit breaker error propagation...');

    // Step 1: Create order
    const orderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [{
        menuItemId: testMenuItemIds[0],
        quantity: 1
      }],
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeSlot: '12:00-13:00',
      paymentMethod: 'razorpay'
    };

    const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
    const orderId = orderResponse.data.id;

    // Step 2: Simulate payment service timeout
    const timeoutPaymentResponse = await apiRequest('POST', '/payments/process', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: 'pm_test_card',
      simulateTimeout: true,
      timeoutDuration: 35000 // Longer than our client timeout
    }, testParentToken);

    // Should receive timeout error
    expect(timeoutPaymentResponse.status).toBe(504); // Gateway timeout
    expect(timeoutPaymentResponse.data).toHaveProperty('error');
    expect(timeoutPaymentResponse.data.error.code).toBe('GATEWAY_TIMEOUT');

    console.log(`⏱️ Payment service timeout error received`);

    // Step 3: Verify circuit breaker activation
    // Make multiple rapid requests to trigger circuit breaker
    const rapidRequests = Array.from({ length: 5 }, () =>
      apiRequest('POST', '/payments/process', {
        orderId,
        amount: orderResponse.data.totalAmount,
        currency: 'INR',
        paymentMethodId: 'pm_test_card',
        simulateTimeout: true
      }, testParentToken)
    );

    const rapidResponses = await Promise.allSettled(rapidRequests);
    const circuitBreakerResponses = rapidResponses.filter(r =>
      r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.status === 503
    );

    expect(circuitBreakerResponses.length).toBeGreaterThan(0);

    console.log(`🔌 Circuit breaker activated after multiple timeouts`);

    // Step 4: Verify error propagation during circuit breaker state
    const circuitBreakerOrderResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
    expect(circuitBreakerOrderResponse.data).toHaveProperty('circuitBreakerStatus');
    expect(circuitBreakerOrderResponse.data.circuitBreakerStatus).toBe('open');

    // Step 5: Test fallback service activation
    const fallbackPaymentResponse = await apiRequest('POST', '/payments/process/fallback', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: 'pm_fallback_card',
      description: 'Fallback payment processing'
    }, testParentToken);

    expect(fallbackPaymentResponse.status).toBe(200);
    expect(fallbackPaymentResponse.data).toHaveProperty('fallbackMode', true);

    const fallbackPaymentId = fallbackPaymentResponse.data.paymentId;

    // Complete fallback payment
    await apiRequest('POST', `/payments/${fallbackPaymentId}/confirm`, {
      paymentId: fallbackPaymentId,
      status: 'completed',
      transactionId: `txn_fallback_${uuidv4()}`
    }, testParentToken);

    console.log(`🔄 Fallback payment processing successful`);

    // Step 6: Verify circuit breaker recovery
    // Wait for circuit breaker to attempt half-open state
    await new Promise(resolve => setTimeout(resolve, 2000));

    const recoveryPaymentResponse = await apiRequest('POST', '/payments/process', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: 'pm_test_card',
      description: 'Test circuit breaker recovery'
    }, testParentToken);

    // Should succeed as circuit breaker recovers
    expect(recoveryPaymentResponse.status).toBe(200);

    console.log(`🔧 Circuit breaker recovered, normal service resumed`);

    // Step 7: Verify comprehensive error tracking
    const errorAnalyticsResponse = await apiRequest('GET', '/analytics/system/errors', {
      timeframe: 'last_hour'
    }, testParentToken);

    expect(errorAnalyticsResponse.data).toHaveProperty('timeouts');
    expect(errorAnalyticsResponse.data).toHaveProperty('circuitBreakerActivations');
    expect(errorAnalyticsResponse.data).toHaveProperty('fallbackActivations');

    expect(errorAnalyticsResponse.data.timeouts.count).toBeGreaterThan(0);
    expect(errorAnalyticsResponse.data.circuitBreakerActivations.count).toBeGreaterThan(0);
    expect(errorAnalyticsResponse.data.fallbackActivations.count).toBeGreaterThan(0);

    console.log(`📊 Comprehensive error analytics recorded`);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });
});