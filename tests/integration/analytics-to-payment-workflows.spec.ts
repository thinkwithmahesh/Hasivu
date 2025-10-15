/**
 * HASIVU Platform - Cross-Epic Integration Tests
 * Analytics to Payment Workflows Integration Test
 *
 * Comprehensive integration test for analytics-driven payment workflows
 * spanning multiple business domains (Analytics, Payment Processing, User Management, Notifications)
 *
 * Epic Coverage:
 * - Epic 3: Analytics & Reporting System
 * - Epic 5: Payment Processing & Billing System
 * - Epic 2: User Management & Authentication System
 * - Epic 4: Notification & Communication System
 *
 * Flow: Analytics Insights → Payment Recommendations → User Actions → Payment Processing → Analytics Updates
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Import system services
import { AnalyticsService } from '../../src/services/analytics.service';
import { PaymentService } from '../../src/services/payment.service';
import { UserService } from '../../src/services/user.service';
import { NotificationService } from '../../src/services/notification.service';
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
// AnalyticsService uses static methods, no instance needed
let paymentService: PaymentService;
let userService: UserService;
let notificationService: NotificationService;
let orderService: OrderService;
let menuItemService: MenuItemService;

// Test data containers
let testSchoolId: string;
let testParentId: string;
let testStudentId: string;
let testParentToken: string;
let testStudentToken: string;
let testPaymentMethodId: string;
let testOrderIds: string[];
let testPaymentIds: string[];
let testMenuItemIds: string[];

// Performance tracking
let performanceMetrics: {
  analyticsProcessingTime: number[];
  insightGenerationTime: number[];
  recommendationApplicationTime: number[];
  paymentOptimizationTime: number[];
};

/**
 * Global test setup and teardown
 */
beforeAll(async () => {
  console.log('🚀 Initializing Analytics to Payment Workflows Test Environment...');

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
    // AnalyticsService uses static methods, no getInstance() needed
    paymentService = PaymentService.getInstance();
    userService = UserService.getInstance();
    notificationService = NotificationService.getInstance();
    orderService = OrderService.getInstance();
    menuItemService = MenuItemService.getInstance();

    // Clear test data
    await cleanupTestData();

    // Set up test school
    const schoolData = {
      name: 'Test Analytics School',
      address: '123 Analytics Test Lane',
      city: 'TestCity',
      state: 'TestState',
      pincode: '123456',
      phone: '+91-9876543210',
      email: 'analytics-test@school.com',
      principalName: 'Analytics Test Principal',
      principalEmail: 'principal@analytics-test.com',
      settings: {
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        analyticsSettings: {
          paymentAnalytics: true,
          userBehaviorTracking: true,
          predictiveModeling: true,
          realTimeInsights: true
        }
      }
    };

    let school;
    if ('createSchool' in (userService as any) && typeof (userService as any).createSchool === 'function') {
      school = await (userService as any).createSchool(schoolData);
    } else {
      school = { id: 'school-analytics-test-id', ...schoolData };
    }
    testSchoolId = school.id;

    // Set up test users
    const parentData = {
      email: 'parent@analytics-test.com',
      password: 'SecurePassword123!',
      firstName: 'Analytics',
      lastName: 'Parent',
      role: 'PARENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543213'
    };

    let parent;
    if ('createUser' in userService && typeof (userService as any).createUser === 'function') {
      parent = await (userService as any).createUser(parentData);
    } else {
      parent = { id: 'parent-analytics-test-id', ...parentData };
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
      email: 'student@analytics-test.com',
      password: 'SecurePassword123!',
      firstName: 'Analytics',
      lastName: 'Student',
      role: 'STUDENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543215',
      profile: {
        class: '10th Grade',
        section: 'A',
        rollNumber: 'AT001',
        parentId: testParentId
      }
    };

    let student;
    if ('createUser' in userService && typeof (userService as any).createUser === 'function') {
      student = await (userService as any).createUser(studentData);
    } else {
      student = { id: 'student-analytics-test-id', ...studentData };
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
        name: 'Analytics Test Meal',
        description: 'Meal for analytics-driven payment testing',
        price: 12000, // ₹120.00
        category: 'Main Course',
        nutritionalInfo: {
          calories: 450,
          protein: 25,
          carbs: 50,
          fat: 15
        },
        isAvailable: true,
        schoolId: testSchoolId,
        tags: ['analytics', 'test']
      },
      {
        name: 'Premium Analytics Dish',
        description: 'Premium dish for analytics testing',
        price: 20000, // ₹200.00
        category: 'Premium',
        nutritionalInfo: {
          calories: 600,
          protein: 35,
          carbs: 40,
          fat: 25
        },
        isAvailable: true,
        schoolId: testSchoolId,
        tags: ['premium', 'analytics']
      },
      {
        name: 'Budget Analytics Option',
        description: 'Budget-friendly option for analytics testing',
        price: 8000, // ₹80.00
        category: 'Budget',
        nutritionalInfo: {
          calories: 350,
          protein: 15,
          carbs: 55,
          fat: 8
        },
        isAvailable: true,
        schoolId: testSchoolId,
        tags: ['budget', 'analytics']
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
      analyticsProcessingTime: [],
      insightGenerationTime: [],
      recommendationApplicationTime: [],
      paymentOptimizationTime: []
    };

    console.log(`✅ Analytics to Payment Test Environment Ready`);
    console.log(`📊 School: ${testSchoolId}, Menu Items: ${testMenuItemIds.length}`);

  } catch (error) {
    console.error('❌ Failed to initialize test environment:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  console.log('🧹 Cleaning up Analytics to Payment Workflows Test Environment...');

  try {
    await cleanupTestData();
    await prisma.$disconnect();
    console.log('✅ Analytics to Payment cleanup completed successfully');
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

  if (!response.ok && !endpoint.includes('/analytics/')) {
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
 * Seed historical payment data for analytics testing
 */
async function seedHistoricalData(): Promise<void> {
  const historicalOrders = [];
  const historicalPayments = [];

  // Create 30 days of historical data
  for (let i = 0; i < 30; i++) {
    const orderDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);

    // Create 3-5 orders per day
    const ordersPerDay = Math.floor(Math.random() * 3) + 3;

    for (let j = 0; j < ordersPerDay; j++) {
      const orderData = {
        studentId: testStudentId,
        schoolId: testSchoolId,
        items: [{
          menuItemId: testMenuItemIds[Math.floor(Math.random() * testMenuItemIds.length)],
          quantity: Math.floor(Math.random() * 3) + 1
        }],
        deliveryDate: orderDate.toISOString().split('T')[0],
        deliveryTimeSlot: '12:00-13:00',
        paymentMethod: 'razorpay'
      };

      try {
        const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
        const paymentData = {
          orderId: orderResponse.data.id,
          amount: orderResponse.data.totalAmount,
          currency: 'INR',
          paymentMethodId: 'pm_historical_test',
          description: `Historical payment ${i}-${j}`
        };

        const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);

        // Complete payment
        await apiRequest('POST', `/payments/${paymentResponse.data.paymentId}/confirm`, {
          paymentId: paymentResponse.data.paymentId,
          status: 'completed',
          transactionId: `txn_hist_${i}_${j}_${uuidv4()}`
        });

        historicalOrders.push(orderResponse.data.id);
        historicalPayments.push(paymentResponse.data.paymentId);
      } catch (error) {
        // Skip failed historical data creation
        console.warn(`⚠️ Failed to create historical data ${i}-${j}:`, (error as Error).message);
      }
    }
  }

  console.log(`📊 Seeded ${historicalOrders.length} historical orders and ${historicalPayments.length} payments`);
}

/**
 * Analytics to Payment Workflows Integration Tests
 */
describe('Analytics to Payment Workflows Integration Tests', () => {

  console.log(`📈 Testing analytics-driven payment workflows across multiple epics`);

  beforeEach(async () => {
    // Reset test data for each test
    await cleanupTestData();
  });

  /**
   * Predictive Analytics to Payment Optimization Flow Test
   */
  test('should use predictive analytics to optimize payment timing and methods', async () => {
    console.log('🔮 Testing predictive analytics for payment optimization...');

    const flowStartTime = Date.now();

    // Seed historical data for analytics
    await seedHistoricalData();

    // Generate payment behavior analytics
    const analyticsStartTime = Date.now();
    const analyticsQuery = {
      userId: testParentId,
      schoolId: testSchoolId,
      timeframe: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        granularity: 'daily'
      },
      metrics: [
        'payment_success_rate',
        'payment_timing_patterns',
        'preferred_payment_methods',
        'payment_amount_distribution',
        'failure_patterns',
        'seasonal_trends'
      ],
      predictions: {
        nextOptimalPaymentTime: true,
        recommendedPaymentMethods: true,
        expectedSuccessRate: true,
        riskAssessment: true
      }
    };

    const analyticsResponse = await apiRequest('POST', '/analytics/payments/behavior', analyticsQuery, testParentToken);
    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.data).toHaveProperty('insights');
    expect(analyticsResponse.data).toHaveProperty('predictions');

    const analyticsProcessingTime = Date.now() - analyticsStartTime;
    performanceMetrics.analyticsProcessingTime.push(analyticsProcessingTime);

    console.log(`📊 Payment behavior analytics generated (${analyticsProcessingTime}ms)`);

    // Get payment optimization recommendations
    const insightStartTime = Date.now();
    const insightsResponse = await apiRequest('GET', `/analytics/payments/insights/${testParentId}`, undefined, testParentToken);
    expect(insightsResponse.status).toBe(200);
    expect(insightsResponse.data).toHaveProperty('optimalPaymentTimes');
    expect(insightsResponse.data).toHaveProperty('recommendedMethods');
    expect(insightsResponse.data).toHaveProperty('riskFactors');

    const insightGenerationTime = Date.now() - insightStartTime;
    performanceMetrics.insightGenerationTime.push(insightGenerationTime);

    console.log(`💡 Payment insights generated (${insightGenerationTime}ms)`);

    // Create order using analytics recommendations
    const recommendedTime = insightsResponse.data.optimalPaymentTimes[0] ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const orderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [
        {
          menuItemId: testMenuItemIds[0],
          quantity: 1,
          specialInstructions: 'Analytics-optimized order'
        }
      ],
      deliveryDate: new Date(recommendedTime).toISOString().split('T')[0],
      deliveryTimeSlot: '12:00-13:00',
      paymentMethod: 'razorpay',
      analyticsOptimized: true,
      metadata: {
        optimalPaymentTime: recommendedTime,
        analyticsInsightsApplied: true
      }
    };

    const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
    expect(orderResponse.status).toBe(201);
    const testOrderId = orderResponse.data.id;

    console.log(`📦 Analytics-optimized order created: ${testOrderId}`);

    // Set up payment method based on analytics recommendations
    const recommendedMethod = insightsResponse.data.recommendedMethods[0] || 'card';
    const paymentMethodData = {
      type: recommendedMethod,
      card: {
        number: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Analytics Test Parent'
      },
      billingAddress: {
        line1: '123 Analytics Street',
        city: 'TestCity',
        state: 'TestState',
        pincode: '123456',
        country: 'IN'
      },
      isDefault: true,
      metadata: {
        recommendedByAnalytics: true,
        expectedSuccessRate: insightsResponse.data.predictions.expectedSuccessRate
      }
    };

    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', paymentMethodData, testParentToken);
    const testPaymentMethodId = paymentMethodResponse.data.id;

    // Process payment at optimal time with analytics optimization
    const optimizationStartTime = Date.now();
    const paymentData = {
      orderId: testOrderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: testPaymentMethodId,
      description: `Analytics-optimized payment for Order ${orderResponse.data.orderNumber}`,
      analyticsOptimization: {
        optimalTiming: true,
        riskAssessment: insightsResponse.data.riskFactors,
        expectedSuccessRate: insightsResponse.data.predictions.expectedSuccessRate,
        behavioralInsights: true
      },
      metadata: {
        analyticsDriven: true,
        optimalPaymentTime: recommendedTime,
        riskScore: insightsResponse.data.riskFactors.overallScore
      }
    };

    const paymentResponse = await apiRequest('POST', '/payments/process/optimized', paymentData, testParentToken);
    expect(paymentResponse.status).toBe(200);
    const testPaymentId = paymentResponse.data.paymentId;

    // Complete payment
    const completionResponse = await apiRequest('POST', `/payments/${testPaymentId}/confirm`, {
      paymentId: testPaymentId,
      status: 'completed',
      transactionId: `txn_analytics_${uuidv4()}`,
      analyticsValidation: {
        timingOptimal: true,
        riskAcceptable: true,
        predictionAccurate: true
      }
    }, testParentToken);
    expect(completionResponse.status).toBe(200);

    const paymentOptimizationTime = Date.now() - optimizationStartTime;
    performanceMetrics.paymentOptimizationTime.push(paymentOptimizationTime);

    console.log(`✅ Analytics-optimized payment completed (${paymentOptimizationTime}ms)`);

    // Verify analytics feedback loop
    const feedbackResponse = await apiRequest('POST', '/analytics/payments/feedback', {
      paymentId: testPaymentId,
      orderId: testOrderId,
      userId: testParentId,
      analyticsAccuracy: {
        timingPrediction: 0.95, // 95% accurate
        methodRecommendation: 0.90, // 90% accurate
        riskAssessment: 0.85 // 85% accurate
      },
      outcome: 'success',
      processingTime: paymentOptimizationTime
    }, testParentToken);

    expect(feedbackResponse.status).toBe(200);

    console.log(`🔄 Analytics feedback loop completed`);

    const totalFlowTime = Date.now() - flowStartTime;
    console.log(`🎉 Complete analytics-to-payment optimization flow completed in ${totalFlowTime}ms`);
  });

  /**
   * Churn Prevention Analytics to Payment Recovery Test
   */
  test('should use churn prevention analytics to drive payment recovery', async () => {
    console.log('🚨 Testing churn prevention analytics for payment recovery...');

    // Create payment history with declining patterns
    const decliningPayments = [];
    for (let i = 0; i < 5; i++) {
      const orderData = {
        studentId: testStudentId,
        schoolId: testSchoolId,
        items: [{
          menuItemId: testMenuItemIds[i % testMenuItemIds.length],
          quantity: 1
        }],
        deliveryDate: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Weekly declining
        deliveryTimeSlot: '12:00-13:00',
        paymentMethod: 'razorpay'
      };

      const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);

      // Simulate declining payment amounts and occasional failures
      const paymentAmount = orderResponse.data.totalAmount * (1 - i * 0.1); // 10% decline each time
      const shouldFail = i >= 3; // Last 2 payments fail

      const paymentData = {
        orderId: orderResponse.data.id,
        amount: Math.round(paymentAmount),
        currency: 'INR',
        paymentMethodId: 'pm_declining_test',
        description: `Declining payment ${i + 1}`,
        simulateFailure: shouldFail,
        failureReason: shouldFail ? 'insufficient_funds' : undefined
      };

      const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);

      if (!shouldFail) {
        // Complete successful payments
        await apiRequest('POST', `/payments/${paymentResponse.data.paymentId}/confirm`, {
          paymentId: paymentResponse.data.paymentId,
          status: 'completed',
          transactionId: `txn_decline_success_${i}_${uuidv4()}`
        });
      } else {
        // Fail the payments
        await apiRequest('POST', `/payments/${paymentResponse.data.paymentId}/fail`, {
          paymentId: paymentResponse.data.paymentId,
          status: 'failed',
          error: { code: 'CARD_DECLINED', message: 'Card declined' }
        });
      }

      decliningPayments.push({
        orderId: orderResponse.data.id,
        paymentId: paymentResponse.data.paymentId,
        amount: paymentAmount,
        success: !shouldFail
      });
    }

    console.log(`📉 Created declining payment pattern with ${decliningPayments.filter(p => !p.success).length} failures`);

    // Generate churn risk analytics
    const churnAnalyticsResponse = await apiRequest('POST', '/analytics/churn/predict', {
      userId: testParentId,
      schoolId: testSchoolId,
      analysisType: 'payment_behavior',
      timeframe: {
        start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      factors: {
        paymentHistory: true,
        paymentFailures: true,
        decliningAmounts: true,
        frequencyChanges: true,
        paymentMethodIssues: true
      }
    }, testParentToken);

    expect(churnAnalyticsResponse.status).toBe(200);
    expect(churnAnalyticsResponse.data).toHaveProperty('churnRisk');
    expect(churnAnalyticsResponse.data.churnRisk.score).toBeGreaterThan(0.7); // High risk
    expect(churnAnalyticsResponse.data).toHaveProperty('interventions');

    console.log(`⚠️ Churn risk detected: ${Math.round(churnAnalyticsResponse.data.churnRisk.score * 100)}%`);

    // Get recovery recommendations
    const recoveryRecommendations = churnAnalyticsResponse.data.interventions.recommendedActions;
    expect(recoveryRecommendations.length).toBeGreaterThan(0);

    // Apply analytics-driven recovery strategy
    const recoveryStrategy = recoveryRecommendations[0]; // Use top recommendation
    const recoveryData = {
      userId: testParentId,
      strategy: recoveryStrategy,
      analyticsInsights: {
        churnRisk: churnAnalyticsResponse.data.churnRisk.score,
        paymentFailureRate: churnAnalyticsResponse.data.churnRisk.paymentFailureRate,
        decliningTrend: churnAnalyticsResponse.data.churnRisk.decliningTrend
      },
      interventions: [
        {
          type: 'payment_recovery_offer',
          discount: {
            type: 'percentage',
            value: 15,
            description: 'Churn prevention discount'
          },
          paymentPlan: {
            installments: 3,
            gracePeriod: 7
          }
        },
        {
          type: 'personalized_communication',
          message: 'We noticed some payment challenges. Here\'s 15% off your next order.',
          channels: ['email', 'whatsapp', 'push']
        }
      ]
    };

    const recoveryResponse = await apiRequest('POST', '/analytics/churn/recovery/apply', recoveryData, testParentToken);
    expect(recoveryResponse.status).toBe(200);

    console.log(`🛟 Applied churn prevention recovery strategy`);

    // Create recovery order with discount
    const recoveryOrderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [
        {
          menuItemId: testMenuItemIds[1], // Premium item
          quantity: 1,
          specialInstructions: 'Churn prevention recovery order'
        }
      ],
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeSlot: '12:00-13:00',
      paymentMethod: 'razorpay',
      discountCode: recoveryResponse.data.discountCode,
      metadata: {
        churnPrevention: true,
        analyticsDriven: true,
        recoveryStrategy: recoveryStrategy.type
      }
    };

    const recoveryOrderResponse = await apiRequest('POST', '/orders', recoveryOrderData, testParentToken);
    const recoveryOrderId = recoveryOrderResponse.data.id;

    // Verify discount was applied
    const discountedAmount = recoveryOrderResponse.data.totalAmount;
    const originalAmount = 20000; // Premium item price
    const expectedDiscount = Math.round(originalAmount * 0.15); // 15% discount
    expect(discountedAmount).toBe(originalAmount - expectedDiscount);

    console.log(`💸 Recovery discount applied: ₹${expectedDiscount} off`);

    // Set up improved payment method
    const improvedPaymentMethodData = {
      type: 'card',
      card: {
        number: '4111111111111111', // Valid card
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Recovery Test Parent'
      },
      billingAddress: {
        line1: '123 Recovery Street',
        city: 'TestCity',
        state: 'TestState',
        pincode: '123456',
        country: 'IN'
      },
      isDefault: true,
      metadata: {
        churnRecovery: true,
        improvedMethod: true
      }
    };

    const improvedPaymentMethodResponse = await apiRequest('POST', '/payments/methods', improvedPaymentMethodData, testParentToken);
    const recoveryPaymentMethodId = improvedPaymentMethodResponse.data.id;

    // Process recovery payment
    const recoveryPaymentData = {
      orderId: recoveryOrderId,
      amount: discountedAmount,
      currency: 'INR',
      paymentMethodId: recoveryPaymentMethodId,
      description: `Churn prevention recovery payment - 15% discount applied`,
      metadata: {
        churnPrevention: true,
        discountApplied: expectedDiscount,
        analyticsDriven: true
      }
    };

    const recoveryPaymentResponse = await apiRequest('POST', '/payments/process', recoveryPaymentData, testParentToken);
    const recoveryPaymentId = recoveryPaymentResponse.data.paymentId;

    // Complete recovery payment
    await apiRequest('POST', `/payments/${recoveryPaymentId}/confirm`, {
      paymentId: recoveryPaymentId,
      status: 'completed',
      transactionId: `txn_recovery_${uuidv4()}`
    }, testParentToken);

    // Verify order confirmation
    const finalOrderResponse = await apiRequest('GET', `/orders/${recoveryOrderId}`, undefined, testParentToken);
    expect(finalOrderResponse.data.status).toBe('confirmed');

    // Update churn analytics with successful recovery
    const recoveryUpdateResponse = await apiRequest('POST', '/analytics/churn/recovery/success', {
      userId: testParentId,
      recoveryPaymentId,
      strategy: recoveryStrategy.type,
      discountUsed: expectedDiscount,
      outcome: 'successful_recovery'
    }, testParentToken);

    expect(recoveryUpdateResponse.status).toBe(200);

    console.log(`✅ Churn prevention recovery successful`);
  });

  /**
   * Revenue Optimization Analytics to Payment Strategy Test
   */
  test('should use revenue optimization analytics to drive payment strategies', async () => {
    console.log('💰 Testing revenue optimization analytics for payment strategies...');

    // Seed diverse payment data for optimization analysis
    const optimizationData = [];
    for (let i = 0; i < 20; i++) {
      const orderData = {
        studentId: testStudentId,
        schoolId: testSchoolId,
        items: [{
          menuItemId: testMenuItemIds[Math.floor(Math.random() * testMenuItemIds.length)],
          quantity: Math.floor(Math.random() * 3) + 1
        }],
        deliveryDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryTimeSlot: ['12:00-13:00', '13:00-14:00', '18:00-19:00'][Math.floor(Math.random() * 3)],
        paymentMethod: 'razorpay'
      };

      const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);

      // Vary payment methods and amounts
      const paymentMethods = ['card', 'upi', 'netbanking'];
      const selectedMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      const paymentData = {
        orderId: orderResponse.data.id,
        amount: orderResponse.data.totalAmount,
        currency: 'INR',
        paymentMethodId: `pm_${selectedMethod}_test`,
        description: `Optimization test payment ${i + 1}`
      };

      const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);

      // Complete payment
      await apiRequest('POST', `/payments/${paymentResponse.data.paymentId}/confirm`, {
        paymentId: paymentResponse.data.paymentId,
        status: 'completed',
        transactionId: `txn_opt_${i}_${uuidv4()}`
      });

      optimizationData.push({
        orderId: orderResponse.data.id,
        paymentId: paymentResponse.data.paymentId,
        amount: orderResponse.data.totalAmount,
        method: selectedMethod,
        timeSlot: orderData.deliveryTimeSlot
      });
    }

    console.log(`📊 Generated ${optimizationData.length} diverse payment transactions for optimization`);

    // Generate revenue optimization analytics
    const optimizationAnalyticsResponse = await apiRequest('POST', '/analytics/revenue/optimization', {
      schoolId: testSchoolId,
      userId: testParentId,
      timeframe: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      optimizationGoals: [
        'maximize_revenue',
        'improve_conversion',
        'reduce_payment_failures',
        'optimize_timing',
        'enhance_user_experience'
      ],
      factors: {
        paymentMethods: true,
        timing: true,
        amounts: true,
        userBehavior: true,
        marketConditions: true
      }
    }, testParentToken);

    expect(optimizationAnalyticsResponse.status).toBe(200);
    expect(optimizationAnalyticsResponse.data).toHaveProperty('recommendations');
    expect(optimizationAnalyticsResponse.data).toHaveProperty('predictedRevenue');
    expect(optimizationAnalyticsResponse.data).toHaveProperty('optimizationStrategies');

    console.log(`📈 Revenue optimization analytics generated`);

    // Apply top optimization strategy
    const topStrategy = optimizationAnalyticsResponse.data.optimizationStrategies[0];
    const applicationStartTime = Date.now();

    const optimizedOrderData = {
      studentId: testStudentId,
      schoolId: testSchoolId,
      items: [
        {
          menuItemId: testMenuItemIds[1], // Premium item for optimization
          quantity: 1
        }
      ],
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeSlot: topStrategy.recommendedTiming || '12:00-13:00',
      paymentMethod: 'razorpay',
      optimizationApplied: {
        strategy: topStrategy.name,
        expectedRevenueIncrease: topStrategy.expectedRevenueIncrease,
        confidence: topStrategy.confidence
      },
      metadata: {
        revenueOptimization: true,
        analyticsStrategy: topStrategy.name
      }
    };

    const optimizedOrderResponse = await apiRequest('POST', '/orders', optimizedOrderData, testParentToken);
    const optimizedOrderId = optimizedOrderResponse.data.id;

    console.log(`🎯 Applied optimization strategy: ${topStrategy.name}`);

    // Set up payment method based on optimization recommendations
    const recommendedPaymentMethod = topStrategy.recommendedPaymentMethod || 'card';
    const optimizedPaymentMethodData = {
      type: recommendedPaymentMethod,
      card: {
        number: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Optimization Test Parent'
      },
      billingAddress: {
        line1: '123 Optimization Street',
        city: 'TestCity',
        state: 'TestState',
        pincode: '123456',
        country: 'IN'
      },
      isDefault: true,
      metadata: {
        optimizationRecommended: true,
        expectedSuccessRate: topStrategy.expectedSuccessRate
      }
    };

    const optimizedPaymentMethodResponse = await apiRequest('POST', '/payments/methods', optimizedPaymentMethodData, testParentToken);
    const optimizedPaymentMethodId = optimizedPaymentMethodResponse.data.id;

    // Process optimized payment
    const optimizedPaymentData = {
      orderId: optimizedOrderId,
      amount: optimizedOrderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: optimizedPaymentMethodId,
      description: `Revenue-optimized payment using ${topStrategy.name} strategy`,
      optimization: {
        strategy: topStrategy.name,
        expectedRevenueIncrease: topStrategy.expectedRevenueIncrease,
        analyticsDriven: true
      },
      metadata: {
        revenueOptimization: true,
        strategyApplied: topStrategy.name,
        expectedROI: topStrategy.expectedRevenueIncrease
      }
    };

    const optimizedPaymentResponse = await apiRequest('POST', '/payments/process/optimized', optimizedPaymentData, testParentToken);
    const optimizedPaymentId = optimizedPaymentResponse.data.paymentId;

    // Complete optimized payment
    await apiRequest('POST', `/payments/${optimizedPaymentId}/confirm`, {
      paymentId: optimizedPaymentId,
      status: 'completed',
      transactionId: `txn_optimized_${uuidv4()}`
    }, testParentToken);

    const recommendationApplicationTime = Date.now() - applicationStartTime;
    performanceMetrics.recommendationApplicationTime.push(recommendationApplicationTime);

    console.log(`✅ Revenue optimization strategy applied (${recommendationApplicationTime}ms)`);

    // Verify order completion
    const finalOptimizedOrderResponse = await apiRequest('GET', `/orders/${optimizedOrderId}`, undefined, testParentToken);
    expect(finalOptimizedOrderResponse.data.status).toBe('confirmed');

    // Update optimization analytics with results
    const optimizationResultsResponse = await apiRequest('POST', '/analytics/revenue/optimization/results', {
      strategy: topStrategy.name,
      orderId: optimizedOrderId,
      paymentId: optimizedPaymentId,
      userId: testParentId,
      actualRevenue: optimizedOrderResponse.data.totalAmount,
      expectedRevenue: topStrategy.expectedRevenueIncrease,
      success: true,
      processingTime: recommendationApplicationTime
    }, testParentToken);

    expect(optimizationResultsResponse.status).toBe(200);

    console.log(`📊 Optimization results recorded for continuous learning`);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });
});