/**
 * HASIVU Platform - Cross-Epic Integration Tests
 * Cross-Epic Data Consistency Integration Test
 *
 * Comprehensive integration test for data consistency across multiple business domains
 * spanning all epics (User Management, Order Management, Payment Processing, Notifications, Analytics)
 *
 * Epic Coverage:
 * - Epic 1: User Management & Authentication System
 * - Epic 2: Order Management System
 * - Epic 5: Payment Processing & Billing System
 * - Epic 4: Notification & Communication System
 * - Epic 3: Analytics & Reporting System
 *
 * Flow: Data Creation → Cross-Service Validation → Consistency Verification → Synchronization Testing
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
  consistencyCheckTime: number[];
  synchronizationTime: number[];
  dataValidationTime: number[];
};

/**
 * Global test setup and teardown
 */
beforeAll(async () => {
  console.log('🚀 Initializing Cross-Epic Data Consistency Test Environment...');

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
      name: 'Test Consistency School',
      address: '123 Consistency Test Lane',
      city: 'TestCity',
      state: 'TestState',
      pincode: '123456',
      phone: '+91-9876543210',
      email: 'consistency-test@school.com',
      principalName: 'Consistency Test Principal',
      principalEmail: 'principal@consistency-test.com',
      settings: {
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        dataConsistency: {
          enabled: true,
          realTimeSync: true,
          crossServiceValidation: true
        }
      }
    };

    let school;
    if ('createSchool' in (userService as any) && typeof (userService as any).createSchool === 'function') {
      school = await (userService as any).createSchool(schoolData);
    } else {
      school = { id: 'school-consistency-test-id', ...schoolData };
    }
    testSchoolId = school.id;

    // Set up test users
    const parentData = {
      email: 'parent@consistency-test.com',
      password: 'SecurePassword123!',
      firstName: 'Consistency',
      lastName: 'Parent',
      role: 'PARENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543213'
    };

    let parent;
    if ('createUser' in userService && typeof (userService as any).createUser === 'function') {
      parent = await (userService as any).createUser(parentData);
    } else {
      parent = { id: 'parent-consistency-test-id', ...parentData };
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
      email: 'student@consistency-test.com',
      password: 'SecurePassword123!',
      firstName: 'Consistency',
      lastName: 'Student',
      role: 'STUDENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543215',
      profile: {
        class: '10th Grade',
        section: 'A',
        rollNumber: 'CT001',
        parentId: testParentId
      }
    };

    let student;
    if ('createUser' in userService && typeof (userService as any).createUser === 'function') {
      student = await (userService as any).createUser(studentData);
    } else {
      student = { id: 'student-consistency-test-id', ...studentData };
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
        name: 'Consistency Test Meal',
        description: 'Meal for data consistency testing',
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
        name: 'Consistency Test Drink',
        description: 'Drink for data consistency testing',
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
      consistencyCheckTime: [],
      synchronizationTime: [],
      dataValidationTime: []
    };

    console.log(`✅ Cross-Epic Data Consistency Test Environment Ready`);
    console.log(`📊 School: ${testSchoolId}, Menu Items: ${testMenuItemIds.length}`);

  } catch (error) {
    console.error('❌ Failed to initialize test environment:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  console.log('🧹 Cleaning up Cross-Epic Data Consistency Test Environment...');

  try {
    await cleanupTestData();
    await prisma.$disconnect();
    console.log('✅ Cross-Epic Data Consistency cleanup completed successfully');
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
 * Cross-Epic Data Consistency Integration Tests
 */
describe('Cross-Epic Data Consistency Integration Tests', () => {

  console.log(`🔗 Testing data consistency across all epics`);

  beforeEach(async () => {
    // Reset test data for each test
    await cleanupTestData();
  });

  /**
   * Complete Transaction Data Consistency Test
   */
  test('should maintain data consistency across complete order-to-payment transaction', async () => {
    console.log('🔄 Testing complete transaction data consistency...');

    const consistencyStartTime = Date.now();

    // Step 1: Create order
    const orderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [
        {
          menuItemId: testMenuItemIds[0],
          quantity: 2,
          specialInstructions: 'Data consistency test order'
        },
        {
          menuItemId: testMenuItemIds[1],
          quantity: 1,
          specialInstructions: 'Extra testing needed'
        }
      ],
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeSlot: '12:00-13:00',
      paymentMethod: 'razorpay',
      metadata: {
        consistencyTest: true,
        testId: uuidv4()
      }
    };

    const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
    expect(orderResponse.status).toBe(201);
    const orderId = orderResponse.data.id;
    testOrderIds = [orderId];

    console.log(`📦 Order created: ${orderId}`);

    // Step 2: Set up payment method
    const paymentMethodData = {
      type: 'card',
      card: {
        number: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Consistency Test Parent'
      },
      billingAddress: {
        line1: '123 Consistency Street',
        city: 'TestCity',
        state: 'TestState',
        pincode: '123456',
        country: 'IN'
      },
      isDefault: true,
      metadata: {
        consistencyTest: true,
        orderId
      }
    };

    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', paymentMethodData, testParentToken);
    const paymentMethodId = paymentMethodResponse.data.id;
    const testPaymentMethodId = paymentMethodId;

    // Step 3: Process payment
    const paymentData = {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId,
      description: `Consistency test payment for Order ${orderResponse.data.orderNumber}`,
      metadata: {
        consistencyTest: true,
        orderId,
        testId: orderData.metadata.testId
      }
    };

    const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);
    expect(paymentResponse.status).toBe(200);
    const {paymentId} = paymentResponse.data;
    testPaymentIds = [paymentId];

    // Step 4: Complete payment
    const completionData = {
      paymentId,
      status: 'completed',
      transactionId: `txn_consistency_${uuidv4()}`,
      gatewayResponse: {
        razorpay_payment_id: `pay_${uuidv4()}`,
        razorpay_order_id: `order_${uuidv4()}`,
        razorpay_signature: 'consistency_signature'
      }
    };

    const completionResponse = await apiRequest('POST', `/payments/${paymentId}/confirm`, completionData, testParentToken);
    expect(completionResponse.status).toBe(200);

    console.log(`✅ Payment completed: ${paymentId}`);

    // Step 5: Comprehensive data consistency validation
    const validationStartTime = Date.now();

    // Validate order data consistency
    const orderValidationResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
    expect(orderValidationResponse.data.status).toBe('confirmed');
    expect(orderValidationResponse.data.totalAmount).toBe(orderResponse.data.totalAmount);
    expect(orderValidationResponse.data.studentId).toBe(testStudentId);
    expect(orderValidationResponse.data.items.length).toBe(2);

    // Validate payment data consistency
    const paymentValidationResponse = await apiRequest('GET', `/payments/${paymentId}`, undefined, testParentToken);
    expect(paymentValidationResponse.data.status).toBe('completed');
    expect(paymentValidationResponse.data.amount).toBe(orderResponse.data.totalAmount);
    expect(paymentValidationResponse.data.orderId).toBe(orderId);
    expect(paymentValidationResponse.data.userId).toBe(testParentId);

    // Validate user data consistency
    const userValidationResponse = await apiRequest('GET', `/users/${testParentId}`, undefined, testParentToken);
    expect(userValidationResponse.data.id).toBe(testParentId);
    expect(userValidationResponse.data.role).toBe('PARENT');

    // Validate student data consistency
    const studentValidationResponse = await apiRequest('GET', `/users/${testStudentId}`, undefined, testStudentToken);
    expect(studentValidationResponse.data.id).toBe(testStudentId);
    expect(studentValidationResponse.data.role).toBe('STUDENT');
    expect(studentValidationResponse.data.profile.parentId).toBe(testParentId);

    // Cross-reference validation
    expect(orderValidationResponse.data.studentId).toBe(studentValidationResponse.data.id);
    expect(paymentValidationResponse.data.userId).toBe(userValidationResponse.data.id);
    expect(orderValidationResponse.data.id).toBe(paymentValidationResponse.data.orderId);

    const dataValidationTime = Date.now() - validationStartTime;
    performanceMetrics.dataValidationTime.push(dataValidationTime);

    console.log(`✅ Data consistency validated (${dataValidationTime}ms)`);

    // Step 6: Check analytics data consistency
    const analyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
    expect(analyticsResponse.data).toHaveProperty('totalOrders', 1);
    expect(analyticsResponse.data).toHaveProperty('totalPayments', 1);
    expect(analyticsResponse.data).toHaveProperty('totalSpent', orderResponse.data.totalAmount);

    // Step 7: Verify audit trail consistency
    const auditResponse = await apiRequest('GET', '/audit/transactions', {
      entityId: orderId,
      entityType: 'order'
    }, testParentToken);

    expect(auditResponse.data.events.length).toBeGreaterThan(0);
    const orderCreatedEvent = auditResponse.data.events.find((e: any) => e.action === 'order.created');
    const paymentCompletedEvent = auditResponse.data.events.find((e: any) => e.action === 'payment.completed');

    expect(orderCreatedEvent).toBeDefined();
    expect(paymentCompletedEvent).toBeDefined();
    expect(orderCreatedEvent.entityId).toBe(orderId);
    expect(paymentCompletedEvent.entityId).toBe(paymentId);

    const consistencyCheckTime = Date.now() - consistencyStartTime;
    performanceMetrics.consistencyCheckTime.push(consistencyCheckTime);

    console.log(`🔗 Complete transaction data consistency verified (${consistencyCheckTime}ms)`);
  });

  /**
   * Concurrent Transaction Data Consistency Test
   */
  test('should maintain data consistency under concurrent transactions', async () => {
    console.log('⚡ Testing data consistency under concurrent transactions...');

    const concurrentTransactions = 5;
    const transactionPromises = [];

    // Create concurrent orders and payments
    for (let i = 0; i < concurrentTransactions; i++) {
      const transactionPromise = (async () => {
        // Create order
        const orderData = {
          studentId: testStudentId,
          schoolId: testSchoolId,
          items: [{
            menuItemId: testMenuItemIds[i % testMenuItemIds.length],
            quantity: 1
          }],
          deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          deliveryTimeSlot: '12:00-13:00',
          paymentMethod: 'razorpay',
          metadata: {
            concurrentTest: true,
            transactionId: i
          }
        };

        const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
        const orderId = orderResponse.data.id;

        // Set up payment method
        const paymentMethodData = {
          type: 'card',
          card: {
            number: '4111111111111111',
            expiryMonth: 12,
            expiryYear: 2026,
            cvv: '123',
            holderName: `Concurrent Test ${i}`
          },
          isDefault: false,
          metadata: {
            concurrentTest: true,
            orderId
          }
        };

        const paymentMethodResponse = await apiRequest('POST', '/payments/methods', paymentMethodData, testParentToken);
        const paymentMethodId = paymentMethodResponse.data.id;

        // Process payment
        const paymentData = {
          orderId,
          amount: orderResponse.data.totalAmount,
          currency: 'INR',
          paymentMethodId,
          description: `Concurrent test payment ${i}`
        };

        const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);
        const {paymentId} = paymentResponse.data;

        // Complete payment
        await apiRequest('POST', `/payments/${paymentId}/confirm`, {
          paymentId,
          status: 'completed',
          transactionId: `txn_concurrent_${i}_${uuidv4()}`
        }, testParentToken);

        return { orderId, paymentId, amount: orderResponse.data.totalAmount };
      })();

      transactionPromises.push(transactionPromise);
    }

    const concurrentStartTime = Date.now();
    const transactionResults = await Promise.allSettled(transactionPromises);
    const concurrentProcessingTime = Date.now() - concurrentStartTime;

    const successfulTransactions = transactionResults.filter(r => r.status === 'fulfilled').length;
    expect(successfulTransactions).toBe(concurrentTransactions);

    const transactionData = transactionResults
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value);

    console.log(`✅ ${successfulTransactions} concurrent transactions completed in ${concurrentProcessingTime}ms`);

    // Validate data consistency across all concurrent transactions
    const consistencyValidationPromises = transactionData.map(async (transaction, index) => {
      // Validate order
      const orderResponse = await apiRequest('GET', `/orders/${transaction.orderId}`, undefined, testParentToken);
      expect(orderResponse.data.status).toBe('confirmed');
      expect(orderResponse.data.totalAmount).toBe(transaction.amount);

      // Validate payment
      const paymentResponse = await apiRequest('GET', `/payments/${transaction.paymentId}`, undefined, testParentToken);
      expect(paymentResponse.data.status).toBe('completed');
      expect(paymentResponse.data.amount).toBe(transaction.amount);
      expect(paymentResponse.data.orderId).toBe(transaction.orderId);

      return { orderId: transaction.orderId, paymentId: transaction.paymentId, consistent: true };
    });

    const consistencyResults = await Promise.allSettled(consistencyValidationPromises);
    const consistentTransactions = consistencyResults.filter(r => r.status === 'fulfilled').length;
    expect(consistentTransactions).toBe(concurrentTransactions);

    console.log(`🔗 Data consistency maintained across ${consistentTransactions} concurrent transactions`);

    // Validate aggregate data consistency
    const userSummaryResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
    expect(userSummaryResponse.data.totalOrders).toBe(concurrentTransactions);
    expect(userSummaryResponse.data.totalPayments).toBe(concurrentTransactions);

    const totalSpent = transactionData.reduce((sum, t) => sum + t.amount, 0);
    expect(userSummaryResponse.data.totalSpent).toBe(totalSpent);

    console.log(`📊 Aggregate data consistency verified: ${concurrentTransactions} orders, ₹${totalSpent / 100} total spent`);
  });

  /**
   * Data Synchronization Across Services Test
   */
  test('should synchronize data changes across all related services', async () => {
    console.log('🔄 Testing data synchronization across services...');

    const syncStartTime = Date.now();

    // Step 1: Create initial transaction
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

    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Sync Test Parent'
      },
      isDefault: true
    }, testParentToken);
    const paymentMethodId = paymentMethodResponse.data.id;

    const paymentResponse = await apiRequest('POST', '/payments/process', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId
    }, testParentToken);
    const {paymentId} = paymentResponse.data;

    await apiRequest('POST', `/payments/${paymentId}/confirm`, {
      paymentId,
      status: 'completed',
      transactionId: `txn_sync_${uuidv4()}`
    }, testParentToken);

    console.log(`📦 Initial transaction created: ${orderId} -> ${paymentId}`);

    // Step 2: Modify order (add item)
    const modificationData = {
      items: [
        {
          menuItemId: testMenuItemIds[0],
          quantity: 1
        },
        {
          menuItemId: testMenuItemIds[1],
          quantity: 1
        }
      ]
    };

    const modifyResponse = await apiRequest('PUT', `/orders/${orderId}`, modificationData, testParentToken);
    expect(modifyResponse.status).toBe(200);
    const newAmount = modifyResponse.data.totalAmount;
    const additionalAmount = newAmount - orderResponse.data.totalAmount;

    console.log(`✏️ Order modified, additional amount: ₹${additionalAmount / 100}`);

    // Step 3: Process additional payment
    const additionalPaymentResponse = await apiRequest('POST', '/payments/process', {
      orderId,
      amount: additionalAmount,
      currency: 'INR',
      paymentMethodId,
      description: 'Additional payment for order modification'
    }, testParentToken);
    const additionalPaymentId = additionalPaymentResponse.data.paymentId;

    await apiRequest('POST', `/payments/${additionalPaymentId}/confirm`, {
      paymentId: additionalPaymentId,
      status: 'completed',
      transactionId: `txn_additional_${uuidv4()}`
    }, testParentToken);

    console.log(`💰 Additional payment processed: ${additionalPaymentId}`);

    // Step 4: Verify synchronization across all services
    const synchronizationTime = Date.now() - syncStartTime;

    // Check order synchronization
    const updatedOrderResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
    expect(updatedOrderResponse.data.totalAmount).toBe(newAmount);
    expect(updatedOrderResponse.data.items.length).toBe(2);
    expect(updatedOrderResponse.data.status).toBe('confirmed');

    // Check payment synchronization
    const allPaymentsResponse = await apiRequest('GET', '/payments', {
      orderId
    }, testParentToken);
    expect(allPaymentsResponse.data.length).toBe(2);

    const totalPaid = allPaymentsResponse.data.reduce((sum: number, p: any) => sum + p.amount, 0);
    expect(totalPaid).toBe(newAmount);

    // Check analytics synchronization
    const analyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
    expect(analyticsResponse.data.totalOrders).toBe(1);
    expect(analyticsResponse.data.totalPayments).toBe(2);
    expect(analyticsResponse.data.totalSpent).toBe(newAmount);

    // Check notification synchronization
    const notificationsResponse = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'payment_confirmation'
    }, testParentToken);
    expect(notificationsResponse.data.length).toBeGreaterThan(0);

    // Verify audit trail synchronization
    const auditResponse = await apiRequest('GET', '/audit/transactions', {
      entityId: orderId,
      entityType: 'order'
    }, testParentToken);

    const orderEvents = auditResponse.data.events.filter((e: any) => e.entityId === orderId);
    const paymentEvents = auditResponse.data.events.filter((e: any) =>
      e.entityType === 'payment' && e.metadata?.orderId === orderId
    );

    expect(orderEvents.length).toBeGreaterThan(1); // created + modified
    expect(paymentEvents.length).toBe(2); // 2 payments

    performanceMetrics.synchronizationTime.push(synchronizationTime);

    console.log(`🔄 Data synchronization completed across all services (${synchronizationTime}ms)`);
  });

  /**
   * Data Integrity Under Failure Conditions Test
   */
  test('should maintain data integrity when services fail or rollback', async () => {
    console.log('🛡️ Testing data integrity under failure conditions...');

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

    // Step 2: Attempt payment that will fail
    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4000000000000002', // Stripe test card that declines
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Failure Test Parent'
      },
      isDefault: true
    }, testParentToken);
    const paymentMethodId = paymentMethodResponse.data.id;

    const paymentResponse = await apiRequest('POST', '/payments/process', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId,
      simulateFailure: true,
      failureReason: 'card_declined'
    }, testParentToken);
    const {paymentId} = paymentResponse.data;

    // Step 3: Confirm payment failure
    await apiRequest('POST', `/payments/${paymentId}/fail`, {
      paymentId,
      status: 'failed',
      error: { code: 'CARD_DECLINED', message: 'Your card was declined' }
    }, testParentToken);

    console.log(`❌ Payment failed as expected: ${paymentId}`);

    // Step 4: Verify data integrity after failure
    // Order should still exist but not be confirmed
    const orderAfterFailureResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
    expect(orderAfterFailureResponse.data.status).toBe('pending'); // Not confirmed due to payment failure
    expect(orderAfterFailureResponse.data.id).toBe(orderId);

    // Payment should be marked as failed
    const paymentAfterFailureResponse = await apiRequest('GET', `/payments/${paymentId}`, undefined, testParentToken);
    expect(paymentAfterFailureResponse.data.status).toBe('failed');
    expect(paymentAfterFailureResponse.data.id).toBe(paymentId);

    // Analytics should not count failed payment
    const analyticsAfterFailureResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
    expect(analyticsAfterFailureResponse.data.totalOrders).toBe(1);
    expect(analyticsAfterFailureResponse.data.totalPayments).toBe(0); // Failed payment not counted
    expect(analyticsAfterFailureResponse.data.totalSpent).toBe(0);

    console.log(`🛡️ Data integrity maintained after payment failure`);

    // Step 5: Test recovery with successful payment
    const newPaymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4111111111111111', // Valid card
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Recovery Test Parent'
      },
      isDefault: true
    }, testParentToken);
    const newPaymentMethodId = newPaymentMethodResponse.data.id;

    const recoveryPaymentResponse = await apiRequest('POST', '/payments/process', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: newPaymentMethodId,
      description: 'Recovery payment after failure'
    }, testParentToken);
    const recoveryPaymentId = recoveryPaymentResponse.data.paymentId;

    await apiRequest('POST', `/payments/${recoveryPaymentId}/confirm`, {
      paymentId: recoveryPaymentId,
      status: 'completed',
      transactionId: `txn_recovery_${uuidv4()}`
    }, testParentToken);

    // Step 6: Verify data integrity after successful recovery
    const orderAfterRecoveryResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
    expect(orderAfterRecoveryResponse.data.status).toBe('confirmed');

    const analyticsAfterRecoveryResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
    expect(analyticsAfterRecoveryResponse.data.totalOrders).toBe(1);
    expect(analyticsAfterRecoveryResponse.data.totalPayments).toBe(1); // Now counted
    expect(analyticsAfterRecoveryResponse.data.totalSpent).toBe(orderResponse.data.totalAmount);

    // Verify audit trail integrity
    const auditResponse = await apiRequest('GET', '/audit/transactions', {
      entityId: orderId,
      entityType: 'order'
    }, testParentToken);

    const paymentEvents = auditResponse.data.events.filter((e: any) => e.entityType === 'payment');
    expect(paymentEvents.length).toBe(2); // One failed, one successful

    const failedPaymentEvent = paymentEvents.find((e: any) => e.action === 'payment.failed');
    const successfulPaymentEvent = paymentEvents.find((e: any) => e.action === 'payment.completed');

    expect(failedPaymentEvent).toBeDefined();
    expect(successfulPaymentEvent).toBeDefined();

    console.log(`✅ Data integrity maintained through failure and recovery`);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });
});