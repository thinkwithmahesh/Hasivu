/**
 * HASIVU Platform - Cross-Epic Integration Tests
 * Notification to Payment Integration Test
 *
 * Comprehensive integration test for notification-driven payment workflows
 * spanning multiple business domains (Notifications, Payment Processing, User Management)
 *
 * Epic Coverage:
 * - Epic 4: Notification & Communication System
 * - Epic 5: Payment Processing & Billing System
 * - Epic 2: User Management & Authentication System
 *
 * Flow: Payment Reminders → User Actions → Payment Processing → Confirmation Notifications
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Import system services
import { NotificationService } from '../../src/services/notification.service';
import { PaymentService } from '../../src/services/payment.service';
import { UserService } from '../../src/services/user.service';
import { OrderService } from '../../src/services/order.service';
import { MenuItemService } from '../../src/services/menuItem.service';

// Mock services for unavailable imports
class SubscriptionService { async create() { return { success: true }; } }
class InvoiceService { async generate() { return { success: true }; } }
class AuditService { async log() { return { success: true }; } }
class SchoolService { async findById() { return { success: true }; } }
class AnalyticsService { async track() { return { success: true }; } }

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
let notificationService: NotificationService;
let paymentService: PaymentService;
let userService: UserService;
let orderService: OrderService;

// Test data containers
let testSchoolId: string;
let testParentId: string;
let testStudentId: string;
let testParentToken: string;
let testStudentToken: string;
let testPaymentMethodId: string;
let testOrderId: string;
let testPaymentId: string;
let testMenuItemIds: string[];

// Performance tracking
let performanceMetrics: {
  notificationDeliveryTime: number[];
  paymentReminderResponseTime: number[];
  notificationCascadeTime: number[];
};

/**
 * Global test setup and teardown
 */
beforeAll(async () => {
  console.log('🚀 Initializing Notification to Payment Integration Test Environment...');

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
    notificationService = NotificationService.getInstance();
    paymentService = new PaymentService();
    userService = new UserService();
    orderService = OrderService.getInstance();
    // menuItemService uses static methods only, no instantiation needed

    // Clear test data
    await cleanupTestData();

    // Set up test school
    const schoolData = {
      name: 'Test Notification School',
      address: '123 Notification Test Lane',
      city: 'TestCity',
      state: 'TestState',
      pincode: '123456',
      phone: '+91-9876543210',
      email: 'notification-test@school.com',
      principalName: 'Notification Test Principal',
      principalEmail: 'principal@notification-test.com',
      settings: {
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        notificationSettings: {
          paymentReminders: {
            enabled: true,
            schedule: [7, 3, 1], // Days before due date
            channels: ['email', 'sms', 'whatsapp', 'push']
          },
          orderConfirmations: {
            enabled: true,
            immediate: true
          },
          promotionalNotifications: {
            enabled: true,
            frequency: 'weekly'
          }
        }
      }
    };

    let school;
    if ('createSchool' in (userService as any) && typeof (userService as any).createSchool === 'function') {
      school = await (userService as any).createSchool(schoolData);
    } else {
      school = { id: 'school-notification-test-id', ...schoolData };
    }
    testSchoolId = school.id;

    // Set up test users
    const parentData = {
      email: 'parent@notification-test.com',
      password: 'SecurePassword123!',
      firstName: 'Notification',
      lastName: 'Parent',
      role: 'PARENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543213',
      profile: {
        notificationPreferences: {
          email: true,
          sms: true,
          whatsapp: true,
          push: true,
          paymentReminders: true,
          orderUpdates: true,
          promotionalContent: false
        }
      }
    };

    let parent;
    if ('createUser' in userService && typeof (userService as any).createUser === 'function') {
      parent = await (userService as any).createUser(parentData);
    } else {
      parent = { id: 'parent-notification-test-id', ...parentData };
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
      email: 'student@notification-test.com',
      password: 'SecurePassword123!',
      firstName: 'Notification',
      lastName: 'Student',
      role: 'STUDENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543215',
      profile: {
        class: '10th Grade',
        section: 'A',
        rollNumber: 'NT001',
        parentId: testParentId
      }
    };

    let student;
    if ('createUser' in userService && typeof (userService as any).createUser === 'function') {
      student = await (userService as any).createUser(studentData);
    } else {
      student = { id: 'student-notification-test-id', ...studentData };
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
        name: 'Payment Reminder Special',
        description: 'Special dish for payment reminder testing',
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
        name: 'Urgent Payment Meal',
        description: 'Meal for urgent payment scenarios',
        price: 15000, // ₹150.00
        category: 'Quick Service',
        nutritionalInfo: {
          calories: 400,
          protein: 20,
          carbs: 45,
          fat: 12
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
      notificationDeliveryTime: [],
      paymentReminderResponseTime: [],
      notificationCascadeTime: []
    };

    console.log(`✅ Notification to Payment Test Environment Ready`);
    console.log(`📊 School: ${testSchoolId}, Parent: ${testParentId}, Student: ${testStudentId}`);

  } catch (error) {
    console.error('❌ Failed to initialize test environment:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  console.log('🧹 Cleaning up Notification to Payment Integration Test Environment...');

  try {
    await cleanupTestData();
    await prisma.$disconnect();
    console.log('✅ Notification to Payment cleanup completed successfully');
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

  if (!response.ok && !endpoint.includes('/notifications/send')) {
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
 * Notification to Payment Integration Tests
 */
describe('Notification to Payment Integration Tests', () => {

  console.log(`📱 Testing notification-driven payment workflows across multiple epics`);

  beforeEach(async () => {
    // Reset test data for each test
    await cleanupTestData();
  });

  /**
   * Payment Reminder to Payment Completion Flow Test
   */
  test('should complete payment reminder to payment completion flow', async () => {
    console.log('💰 Testing payment reminder to completion flow...');

    const flowStartTime = Date.now();

    // Step 1: Create order with future due date
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const orderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [
        {
          menuItemId: testMenuItemIds[0],
          quantity: 1,
          specialInstructions: 'Payment reminder test order'
        }
      ],
      deliveryDate: dueDate.toISOString().split('T')[0],
      deliveryTimeSlot: '12:00-13:00',
      paymentMethod: 'razorpay',
      notes: 'Test order for payment reminders'
    };

    const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
    expect(orderResponse.status).toBe(201);
    testOrderId = orderResponse.data.id;

    console.log(`📦 Order created: ${testOrderId} with due date: ${dueDate.toISOString()}`);

    // Step 2: Set up payment method
    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Notification Test Parent'
      },
      billingAddress: {
        line1: '123 Notification Street',
        city: 'TestCity',
        state: 'TestState',
        pincode: '123456',
        country: 'IN'
      },
      isDefault: true
    }, testParentToken);
    testPaymentMethodId = paymentMethodResponse.data.id;

    // Step 3: Trigger payment reminder notifications
    const reminderStartTime = Date.now();
    const reminderData = {
      orderId: testOrderId,
      userId: testParentId,
      reminderType: 'payment_due',
      dueDate: dueDate.toISOString(),
      amount: orderResponse.data.totalAmount,
      daysUntilDue: 7,
      channels: ['email', 'sms', 'whatsapp', 'push'],
      templateData: {
        studentName: 'Notification Student',
        orderNumber: orderResponse.data.orderNumber,
        dueDate: dueDate.toLocaleDateString(),
        amount: `₹${(orderResponse.data.totalAmount / 100).toFixed(2)}`,
        paymentLink: `https://app.hasivu.com/pay/${testOrderId}`
      }
    };

    const reminderResponse = await apiRequest('POST', '/notifications/send/payment-reminder', reminderData, testParentToken);
    expect(reminderResponse.status).toBe(200);
    expect(reminderResponse.data).toHaveProperty('notificationIds');
    expect(reminderResponse.data.notificationIds.length).toBe(4); // 4 channels

    const notificationDeliveryTime = Date.now() - reminderStartTime;
    performanceMetrics.notificationDeliveryTime.push(notificationDeliveryTime);

    console.log(`📧 Payment reminders sent via 4 channels (${notificationDeliveryTime}ms)`);

    // Step 4: Verify notifications were created and delivered
    const notificationsResponse = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'payment_reminder',
      limit: 10
    }, testParentToken);

    expect(notificationsResponse.data.length).toBeGreaterThan(0);
    const paymentReminder = notificationsResponse.data.find((n: any) =>
      n.data?.orderId === testOrderId && n.type === 'payment_reminder'
    );
    expect(paymentReminder).toBeDefined();
    expect(paymentReminder.channels).toContain('email');
    expect(paymentReminder.channels).toContain('sms');
    expect(paymentReminder.channels).toContain('whatsapp');

    // Step 5: Simulate user clicking payment link from notification
    const paymentLinkStartTime = Date.now();
    const paymentData = {
      orderId: testOrderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: testPaymentMethodId,
      description: `Payment for Order ${orderResponse.data.orderNumber}`,
      metadata: {
        orderId: testOrderId,
        studentId: testStudentId,
        triggeredBy: 'notification_reminder',
        reminderId: paymentReminder.id
      }
    };

    const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);
    expect(paymentResponse.status).toBe(200);
    testPaymentId = paymentResponse.data.paymentId;

    // Step 6: Complete payment
    const paymentCompletionData = {
      paymentId: testPaymentId,
      status: 'completed',
      transactionId: `txn_reminder_${uuidv4()}`,
      gatewayResponse: {
        razorpay_payment_id: `pay_${uuidv4()}`,
        razorpay_order_id: `order_${uuidv4()}`,
        razorpay_signature: 'reminder_signature'
      }
    };

    const completionResponse = await apiRequest('POST', `/payments/${testPaymentId}/confirm`, paymentCompletionData, testParentToken);
    expect(completionResponse.status).toBe(200);

    const paymentReminderResponseTime = Date.now() - paymentLinkStartTime;
    performanceMetrics.paymentReminderResponseTime.push(paymentReminderResponseTime);

    console.log(`✅ Payment completed from reminder (${paymentReminderResponseTime}ms)`);

    // Step 7: Verify order status updated
    const orderStatusResponse = await apiRequest('GET', `/orders/${testOrderId}`, undefined, testParentToken);
    expect(orderStatusResponse.data.status).toBe('confirmed');

    // Step 8: Verify payment confirmation notifications sent
    const confirmationNotifications = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'payment_confirmation'
    }, testParentToken);

    expect(confirmationNotifications.data.length).toBeGreaterThan(0);
    const confirmationNotification = confirmationNotifications.data.find((n: any) =>
      n.data?.orderId === testOrderId && n.type === 'payment_confirmation'
    );
    expect(confirmationNotification).toBeDefined();

    console.log(`📧 Payment confirmation notifications sent`);

    // Step 9: Verify notification cascade analytics
    const cascadeStartTime = Date.now();
    const analyticsResponse = await apiRequest('GET', `/analytics/notifications/cascade/${testOrderId}`, undefined, testParentToken);
    expect(analyticsResponse.data).toHaveProperty('notificationChain');
    expect(analyticsResponse.data.notificationChain).toHaveProperty('reminder');
    expect(analyticsResponse.data.notificationChain).toHaveProperty('confirmation');
    expect(analyticsResponse.data).toHaveProperty('conversionMetrics');
    expect(analyticsResponse.data.conversionMetrics).toHaveProperty('reminderToPaymentTime');

    const notificationCascadeTime = Date.now() - cascadeStartTime;
    performanceMetrics.notificationCascadeTime.push(notificationCascadeTime);

    console.log(`📊 Notification cascade analytics verified (${notificationCascadeTime}ms)`);

    const totalFlowTime = Date.now() - flowStartTime;
    console.log(`🎉 Complete payment reminder to completion flow completed in ${totalFlowTime}ms`);
  });

  /**
   * Multi-Channel Notification Escalation Test
   */
  test('should handle multi-channel notification escalation for overdue payments', async () => {
    console.log('📈 Testing multi-channel notification escalation...');

    // Create order with past due date (overdue)
    const overdueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const orderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [
        {
          menuItemId: testMenuItemIds[1],
          quantity: 1
        }
      ],
      deliveryDate: overdueDate.toISOString().split('T')[0],
      deliveryTimeSlot: '12:00-13:00',
      paymentMethod: 'razorpay'
    };

    const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
    testOrderId = orderResponse.data.id;

    // Set up payment method
    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Escalation Test Parent'
      },
      isDefault: true
    }, testParentToken);
    testPaymentMethodId = paymentMethodResponse.data.id;

    // Trigger escalation notifications
    const escalationData = {
      orderId: testOrderId,
      userId: testParentId,
      escalationLevel: 'overdue',
      daysOverdue: 2,
      amount: orderResponse.data.totalAmount,
      escalationSequence: [
        {
          level: 1,
          channels: ['email', 'push'],
          message: 'Gentle reminder: Payment is 2 days overdue'
        },
        {
          level: 2,
          channels: ['sms', 'whatsapp'],
          message: 'URGENT: Payment is 2 days overdue. Please pay immediately.'
        },
        {
          level: 3,
          channels: ['email', 'sms', 'whatsapp', 'push'],
          message: 'FINAL NOTICE: Payment is 2 days overdue. Account may be suspended.'
        }
      ],
      metadata: {
        orderNumber: orderResponse.data.orderNumber,
        studentName: 'Escalation Test Student',
        overdueAmount: orderResponse.data.totalAmount,
        lateFee: 500 // ₹5.00 late fee
      }
    };

    const escalationResponse = await apiRequest('POST', '/notifications/send/escalation', escalationData, testParentToken);
    expect(escalationResponse.status).toBe(200);
    expect(escalationResponse.data).toHaveProperty('escalationId');
    expect(escalationResponse.data).toHaveProperty('notificationsSent', 6); // 2 levels × 3 channels average

    console.log(`🚨 Escalation notifications sent: ${escalationResponse.data.notificationsSent} messages`);

    // Verify escalation notifications
    const escalationNotifications = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'payment_escalation',
      limit: 20
    }, testParentToken);

    expect(escalationNotifications.data.length).toBeGreaterThan(0);

    // Check for different escalation levels
    const level1Notifications = escalationNotifications.data.filter((n: any) => n.data?.escalationLevel === 1);
    const level2Notifications = escalationNotifications.data.filter((n: any) => n.data?.escalationLevel === 2);

    expect(level1Notifications.length).toBeGreaterThan(0);
    expect(level2Notifications.length).toBeGreaterThan(0);

    // Verify escalation contains urgent messaging
    const urgentNotification = escalationNotifications.data.find((n: any) =>
      n.data?.escalationLevel === 2 && n.channels.includes('sms')
    );
    expect(urgentNotification).toBeDefined();
    expect(urgentNotification.data.message).toContain('URGENT');

    console.log(`✅ Escalation notifications verified with different priority levels`);

    // Process payment after escalation
    const paymentData = {
      orderId: testOrderId,
      amount: orderResponse.data.totalAmount + 500, // Include late fee
      currency: 'INR',
      paymentMethodId: testPaymentMethodId,
      description: `Overdue payment with late fee - Order ${orderResponse.data.orderNumber}`,
      metadata: {
        triggeredBy: 'escalation_notification',
        escalationId: escalationResponse.data.escalationId,
        includesLateFee: true
      }
    };

    const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);
    testPaymentId = paymentResponse.data.paymentId;

    // Complete payment
    await apiRequest('POST', `/payments/${testPaymentId}/confirm`, {
      paymentId: testPaymentId,
      status: 'completed',
      transactionId: `txn_escalation_${uuidv4()}`
    }, testParentToken);

    // Verify resolution notifications
    const resolutionNotifications = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'payment_resolution'
    }, testParentToken);

    expect(resolutionNotifications.data.length).toBeGreaterThan(0);
    const resolutionNotification = resolutionNotifications.data.find((n: any) =>
      n.data?.orderId === testOrderId
    );
    expect(resolutionNotification).toBeDefined();

    console.log(`✅ Payment resolved after escalation with confirmation notifications`);
  });

  /**
   * Proactive Notification to Payment Conversion Test
   */
  test('should convert proactive notifications to successful payments', async () => {
    console.log('🎯 Testing proactive notification to payment conversion...');

    // Create multiple orders for proactive notifications
    const orders = [];
    for (let i = 0; i < 3; i++) {
      const orderData = {
        studentId: testStudentId,
        schoolId: testSchoolId,
        items: [{ menuItemId: testMenuItemIds[i % testMenuItemIds.length], quantity: 1 }],
        deliveryDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryTimeSlot: '12:00-13:00',
        paymentMethod: 'razorpay'
      };

      const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
      orders.push({
        id: orderResponse.data.id,
        amount: orderResponse.data.totalAmount,
        orderNumber: orderResponse.data.orderNumber
      });
    }

    console.log(`📦 Created ${orders.length} orders for proactive notifications`);

    // Set up payment method
    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Proactive Test Parent'
      },
      isDefault: true
    }, testParentToken);
    testPaymentMethodId = paymentMethodResponse.data.id;

    // Send proactive payment bundle notification
    const proactiveData = {
      userId: testParentId,
      orders,
      totalAmount: orders.reduce((sum, order) => sum + order.amount, 0),
      campaignType: 'payment_bundle_discount',
      discountOffer: {
        type: 'percentage',
        value: 10,
        description: '10% off for paying all pending orders together',
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      channels: ['email', 'whatsapp', 'push'],
      personalizedMessage: {
        subject: 'Complete Your Pending Orders & Save 10%!',
        body: 'Hi Notification Parent, you have 3 pending orders. Pay them all together and get 10% off!',
        cta: 'Pay All & Save',
        paymentLink: `https://app.hasivu.com/pay/bundle/${uuidv4()}`
      }
    };

    const proactiveResponse = await apiRequest('POST', '/notifications/send/proactive-payment', proactiveData, testParentToken);
    expect(proactiveResponse.status).toBe(200);
    expect(proactiveResponse.data).toHaveProperty('campaignId');
    expect(proactiveResponse.data).toHaveProperty('notificationsSent', 3);

    console.log(`📧 Proactive payment bundle notifications sent`);

    // Verify proactive notifications
    const proactiveNotifications = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'proactive_payment',
      limit: 10
    }, testParentToken);

    expect(proactiveNotifications.data.length).toBeGreaterThan(0);
    const bundleNotification = proactiveNotifications.data.find((n: any) =>
      n.data?.campaignType === 'payment_bundle_discount'
    );
    expect(bundleNotification).toBeDefined();
    expect(bundleNotification.data).toHaveProperty('discountOffer');
    expect(bundleNotification.data.discountOffer.value).toBe(10);

    // Process bundle payment
    const bundlePaymentData = {
      orderIds: orders.map(o => o.id),
      amount: Math.round((orders.reduce((sum, order) => sum + order.amount, 0) * 0.9)), // 10% discount
      currency: 'INR',
      paymentMethodId: testPaymentMethodId,
      description: `Bundle payment for ${orders.length} orders with 10% discount`,
      metadata: {
        campaignId: proactiveResponse.data.campaignId,
        discountApplied: 10,
        ordersCount: orders.length,
        triggeredBy: 'proactive_notification'
      }
    };

    const bundlePaymentResponse = await apiRequest('POST', '/payments/process/bundle', bundlePaymentData, testParentToken);
    expect(bundlePaymentResponse.status).toBe(200);
    expect(bundlePaymentResponse.data).toHaveProperty('bundlePaymentId');
    expect(bundlePaymentResponse.data).toHaveProperty('processedOrders', orders.length);

    const {bundlePaymentId} = bundlePaymentResponse.data;

    // Complete bundle payment
    await apiRequest('POST', `/payments/${bundlePaymentId}/confirm`, {
      paymentId: bundlePaymentId,
      status: 'completed',
      transactionId: `txn_bundle_${uuidv4()}`
    }, testParentToken);

    // Verify all orders are confirmed
    for (const order of orders) {
      const orderResponse = await apiRequest('GET', `/orders/${order.id}`, undefined, testParentToken);
      expect(orderResponse.data.status).toBe('confirmed');
    }

    // Verify success notifications
    const successNotifications = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'bundle_payment_success'
    }, testParentToken);

    expect(successNotifications.data.length).toBeGreaterThan(0);

    console.log(`✅ Proactive notification converted to successful bundle payment`);
  });

  /**
   * Notification Preference Based Payment Flows Test
   */
  test('should respect user notification preferences in payment flows', async () => {
    console.log('⚙️ Testing notification preferences in payment flows...');

    // Update user notification preferences
    const preferenceUpdate = {
      notificationPreferences: {
        email: true,
        sms: false, // Disable SMS
        whatsapp: true,
        push: true,
        paymentReminders: true,
        orderUpdates: true,
        promotionalContent: false,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        }
      }
    };

    const preferenceResponse = await apiRequest('PUT', `/users/${testParentId}/preferences`, preferenceUpdate, testParentToken);
    expect(preferenceResponse.status).toBe(200);

    // Create order
    const orderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [{ menuItemId: testMenuItemIds[0], quantity: 1 }],
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeSlot: '12:00-13:00',
      paymentMethod: 'razorpay'
    };

    const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
    testOrderId = orderResponse.data.id;

    // Set up payment method
    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Preference Test Parent'
      },
      isDefault: true
    }, testParentToken);
    testPaymentMethodId = paymentMethodResponse.data.id;

    // Send payment reminder respecting preferences
    const reminderData = {
      orderId: testOrderId,
      userId: testParentId,
      reminderType: 'payment_due',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      amount: orderResponse.data.totalAmount,
      respectPreferences: true, // Key flag to respect user preferences
      templateData: {
        studentName: 'Preference Test Student',
        orderNumber: orderResponse.data.orderNumber,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        amount: `₹${(orderResponse.data.totalAmount / 100).toFixed(2)}`
      }
    };

    const reminderResponse = await apiRequest('POST', '/notifications/send/payment-reminder', reminderData, testParentToken);
    expect(reminderResponse.status).toBe(200);

    // Verify only preferred channels were used
    const notificationsResponse = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'payment_reminder'
    }, testParentToken);

    expect(notificationsResponse.data.length).toBeGreaterThan(0);

    // Check that SMS was NOT sent (disabled in preferences)
    const smsNotifications = notificationsResponse.data.filter((n: any) =>
      n.channels.includes('sms')
    );
    expect(smsNotifications.length).toBe(0);

    // Check that email, whatsapp, and push were sent (enabled in preferences)
    const emailNotifications = notificationsResponse.data.filter((n: any) =>
      n.channels.includes('email')
    );
    const whatsappNotifications = notificationsResponse.data.filter((n: any) =>
      n.channels.includes('whatsapp')
    );
    const pushNotifications = notificationsResponse.data.filter((n: any) =>
      n.channels.includes('push')
    );

    expect(emailNotifications.length).toBeGreaterThan(0);
    expect(whatsappNotifications.length).toBeGreaterThan(0);
    expect(pushNotifications.length).toBeGreaterThan(0);

    console.log(`✅ Notification preferences respected - SMS disabled, others enabled`);

    // Process payment
    const paymentData = {
      orderId: testOrderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: testPaymentMethodId,
      description: `Payment for Order ${orderResponse.data.orderNumber}`
    };

    const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);
    testPaymentId = paymentResponse.data.paymentId;

    // Complete payment
    await apiRequest('POST', `/payments/${testPaymentId}/confirm`, {
      paymentId: testPaymentId,
      status: 'completed',
      transactionId: `txn_preference_${uuidv4()}`
    }, testParentToken);

    // Verify confirmation notifications respect preferences
    const confirmationsResponse = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'payment_confirmation'
    }, testParentToken);

    // Should not have SMS confirmations
    const smsConfirmations = confirmationsResponse.data.filter((n: any) =>
      n.channels.includes('sms')
    );
    expect(smsConfirmations.length).toBe(0);

    console.log(`✅ Payment confirmations also respect notification preferences`);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });
});