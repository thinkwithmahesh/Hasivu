/**
 * HASIVU Platform - Cross-Epic Integration Tests
 * User Registration to Payment Processing Integration Test
 *
 * Comprehensive integration test for the complete user registration to payment workflow
 * spanning multiple business domains (User Management, Payment Processing, Notifications, Analytics)
 *
 * Epic Coverage:
 * - Epic 2: User Management & Authentication System
 * - Epic 5: Payment Processing & Billing System
 * - Epic 4: Notification & Communication System
 * - Epic 3: Analytics & Reporting System
 *
 * Flow: User Registration → Profile Setup → Payment Method Setup → First Purchase → Analytics Tracking
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Import system services
import { UserService } from '../../src/services/user.service';
import { PaymentService } from '../../src/services/payment.service';
import { NotificationService } from '../../src/services/notification.service';
import { AnalyticsService } from '../../src/services/analytics.service';
import { OrderService } from '../../src/services/order.service';
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
let paymentService: PaymentService;
let notificationService: NotificationService;
let analyticsService: AnalyticsService;
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
  registrationTime: number[];
  paymentSetupTime: number[];
  firstPurchaseTime: number[];
  analyticsProcessingTime: number[];
};

/**
 * Global test setup and teardown
 */
beforeAll(async () => {
  console.log('🚀 Initializing User Registration to Payment Test Environment...');

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
    userService = new UserService();
    paymentService = new PaymentService();
    notificationService = NotificationService.getInstance();
    analyticsService = new AnalyticsService();
    orderService = OrderService.getInstance();
    // menuItemService uses static methods only, no instantiation needed

    // Clear test data
    await cleanupTestData();

    // Set up test school
    const schoolData = {
      name: 'Test Registration School',
      address: '123 Registration Test Lane',
      city: 'TestCity',
      state: 'TestState',
      pincode: '123456',
      phone: '+91-9876543210',
      email: 'registration-test@school.com',
      principalName: 'Registration Test Principal',
      principalEmail: 'principal@registration-test.com',
      settings: {
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        allowParentRegistration: true,
        requirePaymentSetup: true
      }
    };

    let school;
    if ('createSchool' in (userService as any) && typeof (userService as any).createSchool === 'function') {
      school = await (userService as any).createSchool(schoolData);
    } else {
      school = { id: 'school-registration-test-id', ...schoolData };
    }
    testSchoolId = school.id;

    // Set up test menu items for purchases
    const menuItems = [
      {
        name: 'Welcome Meal - Chicken Curry',
        description: 'Special welcome meal for new users',
        price: 15000, // ₹150.00
        category: 'Welcome Special',
        nutritionalInfo: {
          calories: 550,
          protein: 30,
          carbs: 45,
          fat: 25
        },
        isAvailable: true,
        schoolId: testSchoolId,
        tags: ['welcome', 'new_user']
      },
      {
        name: 'Student Starter Pack',
        description: 'Complete meal package for students',
        price: 20000, // ₹200.00
        category: 'Meal Package',
        nutritionalInfo: {
          calories: 800,
          protein: 35,
          carbs: 90,
          fat: 20
        },
        isAvailable: true,
        schoolId: testSchoolId,
        tags: ['starter', 'package']
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
      registrationTime: [],
      paymentSetupTime: [],
      firstPurchaseTime: [],
      analyticsProcessingTime: []
    };

    console.log(`✅ User Registration to Payment Test Environment Ready`);
    console.log(`📊 School: ${testSchoolId}, Menu Items: ${testMenuItemIds.length}`);

  } catch (error) {
    console.error('❌ Failed to initialize test environment:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  console.log('🧹 Cleaning up User Registration to Payment Test Environment...');

  try {
    await cleanupTestData();
    await prisma.$disconnect();
    console.log('✅ User Registration to Payment cleanup completed successfully');
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

  if (!response.ok && !endpoint.includes('/register') && !endpoint.includes('/login')) {
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
 * User Registration to Payment Processing Integration Tests
 */
describe('User Registration to Payment Processing Integration Tests', () => {

  console.log(`👤 Testing complete user registration to payment workflow across multiple epics`);

  beforeEach(async () => {
    // Reset test data for each test
    await cleanupTestData();
  });

  /**
   * Complete User Registration to First Payment Flow Test
   */
  test('should complete full user registration to first payment flow', async () => {
    console.log('🎯 Testing complete user registration to payment flow...');

    const flowStartTime = Date.now();

    // Step 1: User Registration
    const registrationStartTime = Date.now();
    const registrationData = {
      email: `newparent${Date.now()}@test.com`,
      password: 'SecurePassword123!',
      firstName: 'New',
      lastName: 'Parent',
      role: 'PARENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543220',
      profile: {
        address: {
          line1: '456 New User Street',
          city: 'TestCity',
          state: 'TestState',
          pincode: '123456'
        },
        occupation: 'Software Engineer',
        emergencyContact: '+91-9876543221',
        preferredLanguage: 'en',
        timezone: 'Asia/Kolkata'
      },
      registrationSource: 'web_app',
      marketingConsent: true,
      termsAccepted: true,
      privacyPolicyAccepted: true
    };

    const registrationResponse = await apiRequest('POST', '/auth/register', registrationData);
    expect(registrationResponse.status).toBe(201);
    expect(registrationResponse.data).toHaveProperty('user');
    expect(registrationResponse.data).toHaveProperty('tokens');
    expect(registrationResponse.data.user).toHaveProperty('id');
    expect(registrationResponse.data.user.email).toBe(registrationData.email);
    expect(registrationResponse.data.user.role).toBe('PARENT');

    testParentId = registrationResponse.data.user.id;
    testParentToken = registrationResponse.data.tokens.accessToken;

    const registrationTime = Date.now() - registrationStartTime;
    performanceMetrics.registrationTime.push(registrationTime);

    console.log(`📝 User registered: ${testParentId} (${registrationTime}ms)`);

    // Step 2: Email Verification (if required)
    if (registrationResponse.data.requiresEmailVerification) {
      // Simulate email verification
      const verificationToken = 'mock_verification_token'; // In real scenario, this would come from email
      const verificationResponse = await apiRequest('POST', '/auth/verify-email', {
        token: verificationToken,
        userId: testParentId
      });
      expect(verificationResponse.status).toBe(200);
      console.log(`✅ Email verified for user: ${testParentId}`);
    }

    // Step 3: Student Registration/Profile Setup
    const studentData = {
      firstName: 'New',
      lastName: 'Student',
      email: `newstudent${Date.now()}@test.com`,
      phone: '+91-9876543222',
      profile: {
        class: '8th Grade',
        section: 'A',
        rollNumber: 'NS001',
        dateOfBirth: '2010-05-15',
        gender: 'male',
        bloodGroup: 'O+',
        allergies: ['nuts'],
        medicalConditions: [],
        emergencyContact: {
          name: 'New Parent',
          relationship: 'Parent',
          phone: '+91-9876543220'
        },
        dietaryPreferences: {
          vegetarian: false,
          halal: false,
          allergies: ['nuts'],
          favoriteCuisines: ['Indian', 'Chinese']
        }
      },
      parentId: testParentId
    };

    const studentResponse = await apiRequest('POST', '/users/students', studentData, testParentToken);
    expect(studentResponse.status).toBe(201);
    expect(studentResponse.data).toHaveProperty('id');

    testStudentId = studentResponse.data.id;

    console.log(`🎓 Student profile created: ${testStudentId}`);

    // Step 4: Payment Method Setup
    const paymentSetupStartTime = Date.now();
    const paymentMethodData = {
      type: 'card',
      card: {
        number: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'New Parent'
      },
      billingAddress: {
        line1: '456 New User Street',
        city: 'TestCity',
        state: 'TestState',
        pincode: '123456',
        country: 'IN'
      },
      isDefault: true,
      metadata: {
        setupBy: testParentId,
        purpose: 'first_time_setup'
      }
    };

    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', paymentMethodData, testParentToken);
    expect(paymentMethodResponse.status).toBe(201);
    expect(paymentMethodResponse.data).toHaveProperty('id');
    expect(paymentMethodResponse.data).toHaveProperty('type', 'card');
    expect(paymentMethodResponse.data).toHaveProperty('isDefault', true);

    testPaymentMethodId = paymentMethodResponse.data.id;

    const paymentSetupTime = Date.now() - paymentSetupStartTime;
    performanceMetrics.paymentSetupTime.push(paymentSetupTime);

    console.log(`💳 Payment method setup: ${testPaymentMethodId} (${paymentSetupTime}ms)`);

    // Step 5: First Purchase/Order
    const purchaseStartTime = Date.now();
    const orderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [
        {
          menuItemId: testMenuItemIds[0], // Welcome Meal
          quantity: 1,
          specialInstructions: 'Welcome to HASIVU! Please make it special.'
        }
      ],
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeSlot: '12:30-13:30',
      paymentMethodId: testPaymentMethodId,
      orderType: 'first_purchase',
      metadata: {
        isFirstOrder: true,
        userType: 'new_registration',
        welcomeDiscount: true
      }
    };

    const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
    expect(orderResponse.status).toBe(201);
    expect(orderResponse.data).toHaveProperty('id');
    expect(orderResponse.data).toHaveProperty('status', 'pending');

    testOrderId = orderResponse.data.id;

    console.log(`🛒 First order placed: ${testOrderId}`);

    // Step 6: Payment Processing
    const paymentData = {
      orderId: testOrderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: testPaymentMethodId,
      description: `First Purchase - Welcome to HASIVU`,
      metadata: {
        orderId: testOrderId,
        studentId: testStudentId,
        orderType: 'first_purchase',
        userJourney: 'new_user_onboarding'
      }
    };

    const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);
    expect(paymentResponse.status).toBe(200);
    expect(paymentResponse.data).toHaveProperty('paymentId');
    expect(paymentResponse.data).toHaveProperty('status', 'processing');

    testPaymentId = paymentResponse.data.paymentId;

    // Simulate payment completion
    const paymentCompletionData = {
      paymentId: testPaymentId,
      status: 'completed',
      transactionId: `txn_welcome_${uuidv4()}`,
      gatewayResponse: {
        razorpay_payment_id: `pay_${uuidv4()}`,
        razorpay_order_id: `order_${uuidv4()}`,
        razorpay_signature: 'welcome_signature'
      }
    };

    const completionResponse = await apiRequest('POST', `/payments/${testPaymentId}/confirm`, paymentCompletionData, testParentToken);
    expect(completionResponse.status).toBe(200);

    const firstPurchaseTime = Date.now() - purchaseStartTime;
    performanceMetrics.firstPurchaseTime.push(firstPurchaseTime);

    console.log(`✅ First payment completed: ${testPaymentId} (${firstPurchaseTime}ms)`);

    // Step 7: Verify Order Confirmation
    const orderStatusResponse = await apiRequest('GET', `/orders/${testOrderId}`, undefined, testParentToken);
    expect(orderStatusResponse.data.status).toBe('confirmed');

    // Step 8: Check Welcome Notifications
    const notificationsResponse = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'order_confirmation'
    }, testParentToken);

    expect(notificationsResponse.data.length).toBeGreaterThan(0);
    const welcomeNotification = notificationsResponse.data.find((n: any) =>
      n.data?.orderId === testOrderId && n.type === 'order_confirmation'
    );
    expect(welcomeNotification).toBeDefined();
    expect(welcomeNotification.data).toHaveProperty('isFirstOrder', true);

    console.log(`📧 Welcome notifications sent`);

    // Step 9: Analytics Tracking
    const analyticsStartTime = Date.now();

    // Check user analytics
    const userAnalyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}`, undefined, testParentToken);
    expect(userAnalyticsResponse.status).toBe(200);
    expect(userAnalyticsResponse.data).toHaveProperty('registrationDate');
    expect(userAnalyticsResponse.data).toHaveProperty('firstPurchaseDate');
    expect(userAnalyticsResponse.data).toHaveProperty('totalOrders', 1);
    expect(userAnalyticsResponse.data).toHaveProperty('totalSpent', orderResponse.data.totalAmount);

    // Check payment analytics
    const paymentAnalyticsResponse = await apiRequest('GET', '/analytics/payments/summary', {
      userId: testParentId,
      timeframe: 'all_time'
    }, testParentToken);

    expect(paymentAnalyticsResponse.data).toHaveProperty('totalPayments', 1);
    expect(paymentAnalyticsResponse.data).toHaveProperty('successfulPayments', 1);
    expect(paymentAnalyticsResponse.data).toHaveProperty('totalAmount', orderResponse.data.totalAmount);

    const analyticsProcessingTime = Date.now() - analyticsStartTime;
    performanceMetrics.analyticsProcessingTime.push(analyticsProcessingTime);

    console.log(`📊 Analytics updated (${analyticsProcessingTime}ms)`);

    // Step 10: Verify User Status Update
    const userProfileResponse = await apiRequest('GET', `/users/${testParentId}`, undefined, testParentToken);
    expect(userProfileResponse.data).toHaveProperty('profile');
    expect(userProfileResponse.data.profile).toHaveProperty('hasCompletedFirstPurchase', true);
    expect(userProfileResponse.data.profile).toHaveProperty('firstPurchaseDate');

    const totalFlowTime = Date.now() - flowStartTime;
    console.log(`🎉 Complete user registration to payment flow completed in ${totalFlowTime}ms`);
  });

  /**
   * User Onboarding with Payment Failure Recovery Test
   */
  test('should handle user onboarding with payment failure and recovery', async () => {
    console.log('🔄 Testing user onboarding with payment failure recovery...');

    // Register new user
    const registrationData = {
      email: `recovery${Date.now()}@test.com`,
      password: 'SecurePassword123!',
      firstName: 'Recovery',
      lastName: 'Test',
      role: 'PARENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543230'
    };

    const registrationResponse = await apiRequest('POST', '/auth/register', registrationData);
    testParentId = registrationResponse.data.user.id;
    testParentToken = registrationResponse.data.tokens.accessToken;

    // Create student
    const studentResponse = await apiRequest('POST', '/users/students', {
      firstName: 'Recovery',
      lastName: 'Student',
      email: `recoverystudent${Date.now()}@test.com`,
      parentId: testParentId,
      profile: { class: '9th Grade', section: 'B' }
    }, testParentToken);
    testStudentId = studentResponse.data.id;

    // Set up payment method
    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4000000000000002', // Stripe test card that will decline
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Recovery Test'
      },
      isDefault: true
    }, testParentToken);
    testPaymentMethodId = paymentMethodResponse.data.id;

    // Attempt first purchase (will fail)
    const orderResponse = await apiRequest('POST', '/orders', {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [{ menuItemId: testMenuItemIds[0], quantity: 1 }],
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeSlot: '13:00-14:00',
      paymentMethodId: testPaymentMethodId
    }, testParentToken);
    testOrderId = orderResponse.data.id;

    // Process payment (simulate failure)
    const paymentResponse = await apiRequest('POST', '/payments/process', {
      orderId: testOrderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: testPaymentMethodId,
      simulateFailure: true,
      failureReason: 'card_declined'
    }, testParentToken);
    testPaymentId = paymentResponse.data.paymentId;

    // Confirm payment failure
    await apiRequest('POST', `/payments/${testPaymentId}/fail`, {
      paymentId: testPaymentId,
      status: 'failed',
      error: { code: 'CARD_DECLINED', message: 'Your card was declined' }
    }, testParentToken);

    // Verify failure notifications
    const failureNotifications = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'payment_failed'
    }, testParentToken);
    expect(failureNotifications.data.length).toBeGreaterThan(0);

    console.log(`❌ Payment failed, notifications sent`);

    // Update payment method with valid card
    const newPaymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4111111111111111', // Valid test card
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Recovery Test Fixed'
      },
      isDefault: true
    }, testParentToken);
    const newPaymentMethodId = newPaymentMethodResponse.data.id;

    // Retry payment with new method
    const retryResponse = await apiRequest('POST', `/payments/${testPaymentId}/retry`, {
      newPaymentMethodId,
      retryReason: 'Updated payment method'
    }, testParentToken);
    expect(retryResponse.status).toBe(200);

    // Confirm successful retry
    await apiRequest('POST', `/payments/${testPaymentId}/confirm`, {
      paymentId: testPaymentId,
      status: 'completed',
      transactionId: `txn_retry_${uuidv4()}`
    }, testParentToken);

    // Verify order is now confirmed
    const finalOrderResponse = await apiRequest('GET', `/orders/${testOrderId}`, undefined, testParentToken);
    expect(finalOrderResponse.data.status).toBe('confirmed');

    // Check recovery analytics
    const recoveryAnalytics = await apiRequest('GET', `/analytics/users/${testParentId}/recovery`, undefined, testParentToken);
    expect(recoveryAnalytics.data).toHaveProperty('paymentFailures', 1);
    expect(recoveryAnalytics.data).toHaveProperty('successfulRecovery', true);

    console.log(`✅ Payment recovery successful, user onboarding completed`);
  });

  /**
   * Bulk User Registration and Payment Setup Test
   */
  test('should handle bulk user registration with payment setup', async () => {
    console.log('👥 Testing bulk user registration with payment setup...');

    const bulkUsers = [];
    const userTokens = [];

    // Register multiple users
    for (let i = 0; i < 5; i++) {
      const registrationData = {
        email: `bulkuser${i}_${Date.now()}@test.com`,
        password: 'SecurePassword123!',
        firstName: `Bulk${i}`,
        lastName: 'User',
        role: 'PARENT' as const,
        schoolId: testSchoolId,
        phone: `+91-98765432${20 + i}`
      };

      const registrationResponse = await apiRequest('POST', '/auth/register', registrationData);
      bulkUsers.push({
        id: registrationResponse.data.user.id,
        token: registrationResponse.data.tokens.accessToken,
        email: registrationData.email
      });
      userTokens.push(registrationResponse.data.tokens.accessToken);
    }

    console.log(`📝 ${bulkUsers.length} users registered`);

    // Bulk payment method setup
    const paymentSetupPromises = bulkUsers.map((user, index) =>
      apiRequest('POST', '/payments/methods', {
        type: 'card',
        card: {
          number: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 2026,
          cvv: '123',
          holderName: `Bulk User ${index}`
        },
        isDefault: true
      }, user.token)
    );

    const paymentSetupResults = await Promise.allSettled(paymentSetupPromises);
    const successfulSetups = paymentSetupResults.filter(r => r.status === 'fulfilled').length;
    expect(successfulSetups).toBeGreaterThanOrEqual(bulkUsers.length * 0.9); // 90% success rate

    console.log(`💳 ${successfulSetups}/${bulkUsers.length} payment methods setup`);

    // Bulk first purchases
    const purchasePromises = bulkUsers.map((user, index) =>
      apiRequest('POST', '/orders', {
        studentId: user.id, // Using user ID as student ID for simplicity
        schoolId: testSchoolId,
        items: [{ menuItemId: testMenuItemIds[index % testMenuItemIds.length], quantity: 1 }],
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryTimeSlot: '12:00-13:00',
        paymentMethodId: 'pm_bulk_test', // Would be retrieved from user's payment methods
        orderType: 'bulk_onboarding'
      }, user.token)
    );

    const purchaseResults = await Promise.allSettled(purchasePromises);
    const successfulPurchases = purchaseResults.filter(r => r.status === 'fulfilled').length;
    expect(successfulPurchases).toBeGreaterThanOrEqual(successfulSetups * 0.8); // 80% success rate

    console.log(`🛒 ${successfulPurchases}/${bulkUsers.length} first purchases completed`);

    // Verify bulk analytics
    const bulkAnalyticsResponse = await apiRequest('GET', '/analytics/users/bulk', {
      userIds: bulkUsers.map(u => u.id).join(','),
      metrics: ['registration_rate', 'payment_setup_rate', 'first_purchase_rate']
    });

    expect(bulkAnalyticsResponse.data).toHaveProperty('summary');
    expect(bulkAnalyticsResponse.data.summary).toHaveProperty('totalUsers', bulkUsers.length);
    expect(bulkAnalyticsResponse.data.summary).toHaveProperty('successfulOnboardings');

    console.log(`📊 Bulk onboarding analytics verified`);
  });

  /**
   * User Journey Analytics and Insights Test
   */
  test('should track and analyze complete user journey from registration to payment', async () => {
    console.log('📈 Testing user journey analytics and insights...');

    // Register user
    const registrationResponse = await apiRequest('POST', '/auth/register', {
      email: `analytics${Date.now()}@test.com`,
      password: 'SecurePassword123!',
      firstName: 'Analytics',
      lastName: 'Test',
      role: 'PARENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543240'
    });
    testParentId = registrationResponse.data.user.id;
    testParentToken = registrationResponse.data.tokens.accessToken;

    // Create student
    const studentResponse = await apiRequest('POST', '/users/students', {
      firstName: 'Analytics',
      lastName: 'Student',
      email: `analyticsstudent${Date.now()}@test.com`,
      parentId: testParentId,
      profile: { class: '10th Grade', section: 'A' }
    }, testParentToken);
    testStudentId = studentResponse.data.id;

    // Setup payment method
    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Analytics Test'
      },
      isDefault: true
    }, testParentToken);
    testPaymentMethodId = paymentMethodResponse.data.id;

    // Make multiple purchases over time
    const purchases = [
      { itemIndex: 0, delay: 0 },
      { itemIndex: 1, delay: 1000 },
      { itemIndex: 0, delay: 2000 }
    ];

    for (const purchase of purchases) {
      await new Promise(resolve => setTimeout(resolve, purchase.delay));

      const orderResponse = await apiRequest('POST', '/orders', {
        studentId: testStudentId,
        schoolId: testSchoolId,
        items: [{ menuItemId: testMenuItemIds[purchase.itemIndex], quantity: 1 }],
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryTimeSlot: '12:00-13:00',
        paymentMethodId: testPaymentMethodId
      }, testParentToken);

      const paymentResponse = await apiRequest('POST', '/payments/process', {
        orderId: orderResponse.data.id,
        amount: orderResponse.data.totalAmount,
        currency: 'INR',
        paymentMethodId: testPaymentMethodId
      }, testParentToken);

      // Confirm payment
      await apiRequest('POST', `/payments/${paymentResponse.data.paymentId}/confirm`, {
        paymentId: paymentResponse.data.paymentId,
        status: 'completed',
        transactionId: `txn_analytics_${uuidv4()}`
      });
    }

    // Get comprehensive user journey analytics
    const journeyAnalyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/journey`, undefined, testParentToken);
    expect(journeyAnalyticsResponse.status).toBe(200);

    // Verify journey stages
    expect(journeyAnalyticsResponse.data).toHaveProperty('stages');
    expect(journeyAnalyticsResponse.data.stages).toHaveProperty('registration');
    expect(journeyAnalyticsResponse.data.stages).toHaveProperty('profile_completion');
    expect(journeyAnalyticsResponse.data.stages).toHaveProperty('payment_setup');
    expect(journeyAnalyticsResponse.data.stages).toHaveProperty('first_purchase');
    expect(journeyAnalyticsResponse.data.stages).toHaveProperty('repeat_purchases');

    // Verify journey metrics
    expect(journeyAnalyticsResponse.data).toHaveProperty('metrics');
    expect(journeyAnalyticsResponse.data.metrics).toHaveProperty('timeToFirstPurchase');
    expect(journeyAnalyticsResponse.data.metrics).toHaveProperty('purchaseFrequency');
    expect(journeyAnalyticsResponse.data.metrics).toHaveProperty('averageOrderValue');
    expect(journeyAnalyticsResponse.data.metrics).toHaveProperty('customerLifetimeValue');

    // Verify journey insights
    expect(journeyAnalyticsResponse.data).toHaveProperty('insights');
    expect(journeyAnalyticsResponse.data.insights).toHaveProperty('engagement_score');
    expect(journeyAnalyticsResponse.data.insights).toHaveProperty('retention_probability');
    expect(journeyAnalyticsResponse.data.insights).toHaveProperty('next_best_action');

    console.log(`✅ User journey analytics completed with insights`);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });
});