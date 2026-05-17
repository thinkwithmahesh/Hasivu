/**
 * HASIVU Platform - Cross-Epic Integration Tests
 * Order to Payment Flow Integration Test
 *
 * Comprehensive integration test for the complete order-to-payment workflow
 * spanning multiple business domains (Order Management, Payment Processing, Notifications)
 *
 * Epic Coverage:
 * - Epic 1: Order Management System
 * - Epic 5: Payment Processing & Billing System
 * - Epic 4: Notification & Communication System
 *
 * Flow: Order Creation → Payment Processing → Confirmation → Notifications
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Import system services
import { OrderService } from '../../src/services/order.service';
import { PaymentService } from '../../src/services/payment.service';
import { NotificationService } from '../../src/services/notification.service';
import { UserService } from '../../src/services/user.service';
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
let orderService: OrderService;
let paymentService: PaymentService;
let notificationService: NotificationService;
let userService: UserService;

// Test data containers
let testSchoolId: string;
let testParentId: string;
let testStudentId: string;
let testParentToken: string;
let testStudentToken: string;
let testOrderId: string;
let testPaymentId: string;
let testMenuItemIds: string[];

// Performance tracking
let performanceMetrics: {
  orderCreationTime: number[];
  paymentProcessingTime: number[];
  notificationDeliveryTime: number[];
};

/**
 * Global test setup and teardown
 */
beforeAll(async () => {
  console.log('🚀 Initializing Order-to-Payment Flow Test Environment...');

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

    // Initialize services
    orderService = OrderService.getInstance();
    paymentService = new PaymentService();
    notificationService = NotificationService.getInstance();
    userService = new UserService();
    // menuItemService uses static methods only, no instantiation needed

    // Clear test data
    await cleanupTestData();

    // Set up test school
    const schoolData = {
      name: 'Test Order School',
      address: '123 Order Test Lane',
      city: 'TestCity',
      state: 'TestState',
      pincode: '123456',
      phone: '+91-9876543210',
      email: 'order-test@school.com',
      principalName: 'Order Test Principal',
      principalEmail: 'principal@order-test.com',
      settings: {
        timezone: 'Asia/Kolkata',
        currency: 'INR'
      }
    };

    let school;
    if ('createSchool' in (userService as any) && typeof (userService as any).createSchool === 'function') {
      school = await (userService as any).createSchool(schoolData);
    } else {
      school = { id: 'school-order-test-id', ...schoolData };
    }
    testSchoolId = school.id;

    // Set up test users
    const parentData = {
      email: 'parent@order-test.com',
      password: 'SecurePassword123!',
      firstName: 'Test',
      lastName: 'Parent',
      role: 'PARENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543213'
    };

    let parent;
    if ('createUser' in userService && typeof (userService as any).createUser === 'function') {
      parent = await (userService as any).createUser(parentData);
    } else {
      parent = { id: 'parent-order-test-id', ...parentData };
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
      email: 'student@order-test.com',
      password: 'SecurePassword123!',
      firstName: 'Test',
      lastName: 'Student',
      role: 'STUDENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543215',
      profile: {
        class: '10th Grade',
        section: 'A',
        rollNumber: 'OS001',
        parentId: testParentId
      }
    };

    let student;
    if ('createUser' in userService && typeof (userService as any).createUser === 'function') {
      student = await (userService as any).createUser(studentData);
    } else {
      student = { id: 'student-order-test-id', ...studentData };
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
        name: 'Chicken Biryani',
        description: 'Aromatic basmati rice with tender chicken',
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
        name: 'Vegetable Pulao',
        description: 'Fragrant rice with mixed vegetables',
        price: 8000, // ₹80.00
        category: 'Main Course',
        nutritionalInfo: {
          calories: 300,
          protein: 8,
          carbs: 55,
          fat: 8
        },
        isAvailable: true,
        schoolId: testSchoolId
      },
      {
        name: 'Mango Lassi',
        description: 'Sweet yogurt drink with mango',
        price: 4000, // ₹40.00
        category: 'Beverage',
        nutritionalInfo: {
          calories: 180,
          protein: 6,
          carbs: 25,
          fat: 5
        },
        isAvailable: true,
        schoolId: testSchoolId
      }
    ];

    testMenuItemIds = [];
    for (const item of menuItems) {
      let menuItem;
      try {
        menuItem = await MenuItemService.createMenuItem(item as any);
      } catch (error) {
        // Fallback for tests
        menuItem = { id: `menu-${uuidv4()}`, ...item };
      }
      testMenuItemIds.push(menuItem.id);
    }

    // Initialize performance tracking
    performanceMetrics = {
      orderCreationTime: [],
      paymentProcessingTime: [],
      notificationDeliveryTime: []
    };

    console.log(`✅ Order-to-Payment Test Environment Ready`);
    console.log(`📊 School: ${testSchoolId}, Parent: ${testParentId}, Student: ${testStudentId}`);
    console.log(`🍽️ Menu Items: ${testMenuItemIds.length}`);

  } catch (error) {
    console.error('❌ Failed to initialize test environment:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  console.log('🧹 Cleaning up Order-to-Payment Flow Test Environment...');

  try {
    await cleanupTestData();
    await prisma.$disconnect();
    console.log('✅ Order-to-Payment cleanup completed successfully');
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
    if ('orderItem' in prisma) {
      await prisma.orderItem.deleteMany({});
    }
    if ('order' in prisma) {
      await prisma.order.deleteMany({});
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
      'Authorization': `Bearer ${token || testParentToken}`,
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

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
  }

  return {
    status: response.status,
    data: responseData,
    responseTime,
    headers: Object.fromEntries(response.headers.entries())
  };
}

/**
 * Order to Payment Flow Integration Tests
 */
describe('Order to Payment Flow Integration Tests', () => {

  console.log(`🍽️ Testing complete order-to-payment workflow across multiple epics`);

  beforeEach(async () => {
    // Reset test data for each test
    await cleanupTestData();
  });

  /**
   * Complete Order to Payment Flow Test
   * Tests the entire user journey from order placement to payment completion
   */
  test('should complete full order-to-payment flow successfully', async () => {
    console.log('🛒 Testing complete order-to-payment flow...');

    const startTime = Date.now();

    // Step 1: Create order
    const orderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [
        {
          menuItemId: testMenuItemIds[0], // Chicken Biryani
          quantity: 1,
          specialInstructions: 'Extra spicy'
        },
        {
          menuItemId: testMenuItemIds[1], // Vegetable Pulao
          quantity: 1,
          specialInstructions: 'No onions'
        },
        {
          menuItemId: testMenuItemIds[2], // Mango Lassi
          quantity: 2,
          specialInstructions: 'Extra sweet'
        }
      ],
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      deliveryTimeSlot: '12:00-13:00',
      paymentMethod: 'razorpay',
      notes: 'Please pack carefully'
    };

    const orderResponse = await apiRequest('POST', '/orders', orderData);
    expect(orderResponse.status).toBe(201);
    expect(orderResponse.data).toHaveProperty('id');
    expect(orderResponse.data).toHaveProperty('orderNumber');
    expect(orderResponse.data).toHaveProperty('status', 'pending');
    expect(orderResponse.data).toHaveProperty('totalAmount');

    testOrderId = orderResponse.data.id;
    const orderCreationTime = Date.now() - startTime;
    performanceMetrics.orderCreationTime.push(orderCreationTime);

    // Verify order details
    expect(orderResponse.data.items).toHaveLength(3);
    expect(orderResponse.data.totalAmount).toBe(12000 + 8000 + 4000 * 2); // ₹120 + ₹80 + ₹40*2 = ₹280

    console.log(`📦 Order created: ${testOrderId} (${orderCreationTime}ms)`);

    // Step 2: Process payment for the order
    const paymentStartTime = Date.now();
    const paymentData = {
      orderId: testOrderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: 'pm_test_card', // Mock payment method
      description: `Payment for Order ${orderResponse.data.orderNumber}`,
      metadata: {
        orderId: testOrderId,
        studentId: testStudentId,
        schoolId: testSchoolId
      }
    };

    const paymentResponse = await apiRequest('POST', '/payments/process', paymentData);
    expect(paymentResponse.status).toBe(200);
    expect(paymentResponse.data).toHaveProperty('paymentId');
    expect(paymentResponse.data).toHaveProperty('status', 'processing');

    testPaymentId = paymentResponse.data.paymentId;
    const paymentProcessingTime = Date.now() - paymentStartTime;
    performanceMetrics.paymentProcessingTime.push(paymentProcessingTime);

    console.log(`💳 Payment initiated: ${testPaymentId} (${paymentProcessingTime}ms)`);

    // Step 3: Simulate payment completion (webhook or direct confirmation)
    const paymentCompletionData = {
      paymentId: testPaymentId,
      status: 'completed',
      transactionId: `txn_${uuidv4()}`,
      gatewayResponse: {
        razorpay_payment_id: `pay_${uuidv4()}`,
        razorpay_order_id: `order_${uuidv4()}`,
        razorpay_signature: 'test_signature'
      }
    };

    const completionResponse = await apiRequest('POST', `/payments/${testPaymentId}/confirm`, paymentCompletionData);
    expect(completionResponse.status).toBe(200);
    expect(completionResponse.data.status).toBe('completed');

    // Step 4: Verify order status updated after payment
    const orderStatusResponse = await apiRequest('GET', `/orders/${testOrderId}`);
    expect(orderStatusResponse.status).toBe(200);
    expect(orderStatusResponse.data.status).toBe('confirmed');

    console.log(`✅ Order confirmed after payment: ${testOrderId}`);

    // Step 5: Verify notifications were sent
    const notificationStartTime = Date.now();

    // Check for order confirmation notification
    const notificationsResponse = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'order_confirmation'
    });

    expect(notificationsResponse.status).toBe(200);
    expect(notificationsResponse.data.length).toBeGreaterThan(0);

    const orderNotification = notificationsResponse.data.find((n: any) =>
      n.data?.orderId === testOrderId
    );
    expect(orderNotification).toBeDefined();
    expect(orderNotification.type).toBe('order_confirmation');
    expect(orderNotification.data.orderId).toBe(testOrderId);

    const notificationDeliveryTime = Date.now() - notificationStartTime;
    performanceMetrics.notificationDeliveryTime.push(notificationDeliveryTime);

    console.log(`📧 Notifications sent (${notificationDeliveryTime}ms)`);

    // Step 6: Verify audit trail
    const auditResponse = await apiRequest('GET', '/audit/orders', {
      entityId: testOrderId,
      entityType: 'order'
    });

    expect(auditResponse.status).toBe(200);
    expect(auditResponse.data.events).toContainEqual(
      expect.objectContaining({
        action: 'order.created'
      })
    );
    expect(auditResponse.data.events).toContainEqual(
      expect.objectContaining({
        action: 'payment.completed'
      })
    );

    console.log(`📋 Audit trail verified for order: ${testOrderId}`);

    // Step 7: Test order tracking
    const trackingResponse = await apiRequest('GET', `/orders/${testOrderId}/tracking`);
    expect(trackingResponse.status).toBe(200);
    expect(trackingResponse.data).toHaveProperty('status', 'confirmed');
    expect(trackingResponse.data).toHaveProperty('paymentStatus', 'completed');
    expect(trackingResponse.data).toHaveProperty('estimatedDelivery');

    console.log(`🚚 Order tracking verified`);

    const totalFlowTime = Date.now() - startTime;
    console.log(`🎉 Complete order-to-payment flow completed in ${totalFlowTime}ms`);
  });

  /**
   * Payment Failure and Recovery Flow Test
   */
  test('should handle payment failure and trigger recovery flow', async () => {
    console.log('❌ Testing payment failure and recovery...');

    // Create order
    const orderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [
        {
          menuItemId: testMenuItemIds[0],
          quantity: 1
        }
      ],
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeSlot: '12:00-13:00',
      paymentMethod: 'razorpay'
    };

    const orderResponse = await apiRequest('POST', '/orders', orderData);
    testOrderId = orderResponse.data.id;

    // Attempt payment that will fail
    const paymentData = {
      orderId: testOrderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: 'pm_failed_card', // Mock failed payment method
      description: `Payment for Order ${orderResponse.data.orderNumber}`,
      simulateFailure: true,
      failureReason: 'insufficient_funds'
    };

    const paymentResponse = await apiRequest('POST', '/payments/process', paymentData);
    expect(paymentResponse.status).toBe(200);
    testPaymentId = paymentResponse.data.paymentId;

    // Simulate payment failure
    const failureData = {
      paymentId: testPaymentId,
      status: 'failed',
      error: {
        code: 'PAYMENT_FAILED',
        message: 'Insufficient funds',
        gatewayError: 'insufficient_funds'
      }
    };

    const failureResponse = await apiRequest('POST', `/payments/${testPaymentId}/fail`, failureData);
    expect(failureResponse.status).toBe(200);

    // Verify order status reflects payment failure
    const orderStatusResponse = await apiRequest('GET', `/orders/${testOrderId}`);
    expect(orderStatusResponse.data.status).toBe('payment_pending');

    // Check for payment failure notification
    const failureNotifications = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'payment_failed'
    });

    expect(failureNotifications.data.length).toBeGreaterThan(0);
    const failureNotification = failureNotifications.data.find((n: any) =>
      n.data?.orderId === testOrderId
    );
    expect(failureNotification).toBeDefined();

    console.log(`💸 Payment failure handled and notifications sent`);

    // Test payment retry
    const retryData = {
      paymentId: testPaymentId,
      newPaymentMethodId: 'pm_retry_card',
      retryReason: 'User requested retry'
    };

    const retryResponse = await apiRequest('POST', `/payments/${testPaymentId}/retry`, retryData);
    expect(retryResponse.status).toBe(200);

    // Simulate successful retry
    const retrySuccessData = {
      paymentId: testPaymentId,
      status: 'completed',
      transactionId: `txn_retry_${uuidv4()}`
    };

    const retrySuccessResponse = await apiRequest('POST', `/payments/${testPaymentId}/confirm`, retrySuccessData);
    expect(retrySuccessResponse.status).toBe(200);

    // Verify order is now confirmed
    const finalOrderStatus = await apiRequest('GET', `/orders/${testOrderId}`);
    expect(finalOrderStatus.data.status).toBe('confirmed');

    console.log(`🔄 Payment retry successful, order confirmed`);
  });

  /**
   * Order Modification and Payment Adjustment Test
   */
  test('should handle order modifications with payment adjustments', async () => {
    console.log('✏️ Testing order modifications with payment adjustments...');

    // Create initial order
    const initialOrderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [
        {
          menuItemId: testMenuItemIds[0], // ₹120
          quantity: 1
        }
      ],
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeSlot: '12:00-13:00',
      paymentMethod: 'razorpay'
    };

    const orderResponse = await apiRequest('POST', '/orders', initialOrderData);
    testOrderId = orderResponse.data.id;
    const initialAmount = orderResponse.data.totalAmount;

    // Process initial payment
    const paymentResponse = await apiRequest('POST', '/payments/process', {
      orderId: testOrderId,
      amount: initialAmount,
      currency: 'INR',
      paymentMethodId: 'pm_test_card'
    });
    testPaymentId = paymentResponse.data.paymentId;

    // Confirm initial payment
    await apiRequest('POST', `/payments/${testPaymentId}/confirm`, {
      paymentId: testPaymentId,
      status: 'completed',
      transactionId: `txn_${uuidv4()}`
    });

    // Modify order (add item)
    const modificationData = {
      items: [
        {
          menuItemId: testMenuItemIds[0], // Keep existing
          quantity: 1
        },
        {
          menuItemId: testMenuItemIds[2], // Add Mango Lassi ₹40
          quantity: 1
        }
      ]
    };

    const modifyResponse = await apiRequest('PUT', `/orders/${testOrderId}`, modificationData);
    expect(modifyResponse.status).toBe(200);

    const newAmount = modifyResponse.data.totalAmount;
    expect(newAmount).toBe(initialAmount + 4000); // + ₹40

    // Process additional payment for modification
    const additionalPaymentData = {
      orderId: testOrderId,
      amount: 4000, // Additional amount
      currency: 'INR',
      paymentMethodId: 'pm_test_card',
      description: `Additional payment for order modification`,
      metadata: {
        originalPaymentId: testPaymentId,
        modificationType: 'item_added'
      }
    };

    const additionalPaymentResponse = await apiRequest('POST', '/payments/process', additionalPaymentData);
    const additionalPaymentId = additionalPaymentResponse.data.paymentId;

    // Confirm additional payment
    await apiRequest('POST', `/payments/${additionalPaymentId}/confirm`, {
      paymentId: additionalPaymentId,
      status: 'completed',
      transactionId: `txn_add_${uuidv4()}`
    });

    // Verify final order status
    const finalOrderResponse = await apiRequest('GET', `/orders/${testOrderId}`);
    expect(finalOrderResponse.data.status).toBe('confirmed');
    expect(finalOrderResponse.data.totalAmount).toBe(newAmount);

    console.log(`💰 Order modification with payment adjustment completed`);
  });

  /**
   * Bulk Order Processing Test
   */
  test('should handle bulk order processing with payment batching', async () => {
    console.log('📦 Testing bulk order processing...');

    const bulkOrders = [];
    const orderIds = [];

    // Create multiple orders
    for (let i = 0; i < 5; i++) {
      const orderData = {
        studentId: testStudentId,
        schoolId: testSchoolId,
        items: [
          {
            menuItemId: testMenuItemIds[i % testMenuItemIds.length],
            quantity: 1
          }
        ],
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryTimeSlot: '12:00-13:00',
        paymentMethod: 'razorpay'
      };

      const orderResponse = await apiRequest('POST', '/orders', orderData);
      orderIds.push(orderResponse.data.id);
      bulkOrders.push({
        orderId: orderResponse.data.id,
        amount: orderResponse.data.totalAmount,
        currency: 'INR'
      });
    }

    // Process bulk payment
    const bulkPaymentData = {
      orders: bulkOrders,
      paymentMethodId: 'pm_bulk_card',
      description: `Bulk payment for ${bulkOrders.length} orders`,
      batchMetadata: {
        batchId: `batch_${uuidv4()}`,
        orderCount: bulkOrders.length,
        totalAmount: bulkOrders.reduce((sum, order) => sum + order.amount, 0)
      }
    };

    const bulkPaymentResponse = await apiRequest('POST', '/payments/bulk/process', bulkPaymentData);
    expect(bulkPaymentResponse.status).toBe(200);
    expect(bulkPaymentResponse.data).toHaveProperty('batchId');
    expect(bulkPaymentResponse.data.processedOrders).toHaveLength(5);

    // Verify all orders are confirmed
    for (const orderId of orderIds) {
      const orderResponse = await apiRequest('GET', `/orders/${orderId}`);
      expect(orderResponse.data.status).toBe('confirmed');
    }

    console.log(`✅ Bulk order processing completed for ${orderIds.length} orders`);
  });

  /**
   * Performance and Scalability Test
   */
  test('should maintain performance under concurrent order-payment load', async () => {
    console.log('⚡ Testing performance under concurrent load...');

    const concurrentOrders = 10;
    const orderPromises = [];

    // Create concurrent orders
    for (let i = 0; i < concurrentOrders; i++) {
      const orderData = {
        studentId: testStudentId,
        schoolId: testSchoolId,
        items: [
          {
            menuItemId: testMenuItemIds[0],
            quantity: 1
          }
        ],
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryTimeSlot: '12:00-13:00',
        paymentMethod: 'razorpay'
      };

      orderPromises.push(apiRequest('POST', '/orders', orderData));
    }

    const startTime = Date.now();
    const orderResults = await Promise.allSettled(orderPromises);
    const orderProcessingTime = Date.now() - startTime;

    const successfulOrders = orderResults.filter(r => r.status === 'fulfilled').length;
    expect(successfulOrders).toBeGreaterThanOrEqual(concurrentOrders * 0.9); // 90% success rate

    console.log(`📊 Concurrent order creation: ${successfulOrders}/${concurrentOrders} successful in ${orderProcessingTime}ms`);

    // Extract successful order IDs and process payments concurrently
    const successfulOrderResults = orderResults
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value);

    const paymentPromises = successfulOrderResults.map(orderResult => {
      const paymentData = {
        orderId: orderResult.data.id,
        amount: orderResult.data.totalAmount,
        currency: 'INR',
        paymentMethodId: 'pm_load_test_card'
      };
      return apiRequest('POST', '/payments/process', paymentData);
    });

    const paymentStartTime = Date.now();
    const paymentResults = await Promise.allSettled(paymentPromises);
    const paymentProcessingTime = Date.now() - paymentStartTime;

    const successfulPayments = paymentResults.filter(r => r.status === 'fulfilled').length;
    expect(successfulPayments).toBeGreaterThanOrEqual(successfulOrders * 0.9); // 90% success rate

    console.log(`💳 Concurrent payment processing: ${successfulPayments}/${successfulOrders} successful in ${paymentProcessingTime}ms`);

    // Performance assertions
    const avgOrderTime = orderProcessingTime / concurrentOrders;
    const avgPaymentTime = paymentProcessingTime / successfulPayments;

    expect(avgOrderTime).toBeLessThan(5000); // Under 5 seconds per order
    expect(avgPaymentTime).toBeLessThan(3000); // Under 3 seconds per payment

    console.log(`📈 Performance metrics - Avg order time: ${avgOrderTime}ms, Avg payment time: ${avgPaymentTime}ms`);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });
});