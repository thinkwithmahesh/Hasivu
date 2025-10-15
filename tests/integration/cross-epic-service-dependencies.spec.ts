/**
 * HASIVU Platform - Cross-Epic Integration Tests
 * Cross-Epic Service Dependencies Integration Test
 *
 * Comprehensive integration test for service dependencies and interactions across multiple business domains
 * spanning all epics (User Management, Order Management, Payment Processing, Notifications, Analytics)
 *
 * Epic Coverage:
 * - Epic 1: User Management & Authentication System
 * - Epic 2: Order Management System
 * - Epic 5: Payment Processing & Billing System
 * - Epic 4: Notification & Communication System
 * - Epic 3: Analytics & Reporting System
 *
 * Flow: Service Dependency Mapping → Dependency Chain Testing → Service Health Monitoring → Dependency Failure Handling
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
  dependencyCheckTime: number[];
  serviceHealthTime: number[];
  dependencyChainTime: number[];
};

/**
 * Global test setup and teardown
 */
beforeAll(async () => {
  console.log('🚀 Initializing Cross-Epic Service Dependencies Test Environment...');

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
      name: 'Test Dependencies School',
      address: '123 Dependencies Test Lane',
      city: 'TestCity',
      state: 'TestState',
      pincode: '123456',
      phone: '+91-9876543210',
      email: 'dependencies-test@school.com',
      principalName: 'Dependencies Test Principal',
      principalEmail: 'principal@dependencies-test.com',
      settings: {
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        serviceDependencies: {
          enabled: true,
          healthMonitoring: true,
          dependencyMapping: true,
          failoverEnabled: true
        }
      }
    };

    let school;
    if ('createSchool' in (userService as any) && typeof (userService as any).createSchool === 'function') {
      school = await (userService as any).createSchool(schoolData);
    } else {
      school = { id: 'school-dependencies-test-id', ...schoolData };
    }
    testSchoolId = school.id;

    // Set up test users
    const parentData = {
      email: 'parent@dependencies-test.com',
      password: 'SecurePassword123!',
      firstName: 'Dependencies',
      lastName: 'Parent',
      role: 'PARENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543213'
    };

    let parent;
    if ('createUser' in userService && typeof (userService as any).createUser === 'function') {
      parent = await (userService as any).createUser(parentData);
    } else {
      parent = { id: 'parent-dependencies-test-id', ...parentData };
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
      email: 'student@dependencies-test.com',
      password: 'SecurePassword123!',
      firstName: 'Dependencies',
      lastName: 'Student',
      role: 'STUDENT' as const,
      schoolId: testSchoolId,
      phone: '+91-9876543215',
      profile: {
        class: '10th Grade',
        section: 'A',
        rollNumber: 'DT001',
        parentId: testParentId
      }
    };

    let student;
    if ('createUser' in userService && typeof (userService as any).createUser === 'function') {
      student = await (userService as any).createUser(studentData);
    } else {
      student = { id: 'student-dependencies-test-id', ...studentData };
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
        name: 'Dependencies Test Meal',
        description: 'Meal for service dependencies testing',
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
        name: 'Dependencies Test Drink',
        description: 'Drink for service dependencies testing',
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
      dependencyCheckTime: [],
      serviceHealthTime: [],
      dependencyChainTime: []
    };

    console.log(`✅ Cross-Epic Service Dependencies Test Environment Ready`);
    console.log(`📊 School: ${testSchoolId}, Menu Items: ${testMenuItemIds.length}`);

  } catch (error) {
    console.error('❌ Failed to initialize test environment:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  console.log('🧹 Cleaning up Cross-Epic Service Dependencies Test Environment...');

  try {
    await cleanupTestData();
    await prisma.$disconnect();
    console.log('✅ Cross-Epic Service Dependencies cleanup completed successfully');
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
 * Cross-Epic Service Dependencies Integration Tests
 */
describe('Cross-Epic Service Dependencies Integration Tests', () => {

  console.log(`🔗 Testing service dependencies across all epics`);

  beforeEach(async () => {
    // Reset test data for each test
    await cleanupTestData();
  });

  /**
   * Service Dependency Mapping Test
   */
  test('should map and validate service dependencies across epics', async () => {
    console.log('🗺️ Testing service dependency mapping...');

    const dependencyStartTime = Date.now();

    // Step 1: Get service dependency map
    const dependencyMapResponse = await apiRequest('GET', '/system/dependencies', undefined, testParentToken);
    expect(dependencyMapResponse.status).toBe(200);
    expect(dependencyMapResponse.data).toHaveProperty('services');
    expect(dependencyMapResponse.data).toHaveProperty('dependencies');

    const {services} = dependencyMapResponse.data;
    const {dependencies} = dependencyMapResponse.data;

    // Verify all expected services are present
    expect(services).toContain('user-service');
    expect(services).toContain('order-service');
    expect(services).toContain('payment-service');
    expect(services).toContain('notification-service');
    expect(services).toContain('analytics-service');

    console.log(`📋 Service dependency map contains ${services.length} services`);

    // Step 2: Validate dependency relationships
    // Order service should depend on user service
    expect(dependencies['order-service']).toContain('user-service');

    // Payment service should depend on order service and user service
    expect(dependencies['payment-service']).toContain('order-service');
    expect(dependencies['payment-service']).toContain('user-service');

    // Notification service should depend on multiple services
    expect(dependencies['notification-service']).toContain('user-service');
    expect(dependencies['notification-service']).toContain('order-service');
    expect(dependencies['notification-service']).toContain('payment-service');

    // Analytics service should depend on all other services
    expect(dependencies['analytics-service']).toContain('user-service');
    expect(dependencies['analytics-service']).toContain('order-service');
    expect(dependencies['analytics-service']).toContain('payment-service');
    expect(dependencies['analytics-service']).toContain('notification-service');

    console.log(`🔗 Service dependency relationships validated`);

    // Step 3: Test dependency health checks
    const healthCheckResponse = await apiRequest('GET', '/system/health/dependencies', undefined, testParentToken);
    expect(healthCheckResponse.status).toBe(200);
    expect(healthCheckResponse.data).toHaveProperty('services');

    // All services should be healthy
    Object.values(healthCheckResponse.data.services).forEach((service: any) => {
      expect(service.status).toBe('healthy');
    });

    console.log(`💚 All service dependencies healthy`);

    // Step 4: Test circular dependency detection
    const circularDependencyResponse = await apiRequest('GET', '/system/dependencies/circular', undefined, testParentToken);
    expect(circularDependencyResponse.status).toBe(200);
    expect(circularDependencyResponse.data).toHaveProperty('hasCircularDependencies', false);

    console.log(`🔄 No circular dependencies detected`);

    const dependencyCheckTime = Date.now() - dependencyStartTime;
    performanceMetrics.dependencyCheckTime.push(dependencyCheckTime);

    console.log(`🗺️ Service dependency mapping completed (${dependencyCheckTime}ms)`);
  });

  /**
   * Service Dependency Chain Execution Test
   */
  test('should execute complete service dependency chain for order-to-payment flow', async () => {
    console.log('⛓️ Testing service dependency chain execution...');

    const chainStartTime = Date.now();

    // Step 1: Create order (depends on user service)
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

    console.log(`📦 Order created via dependency chain: ${orderId}`);

    // Step 2: Verify user service dependency was used
    const orderDetailsResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
    expect(orderDetailsResponse.data).toHaveProperty('userId', testParentId);
    expect(orderDetailsResponse.data).toHaveProperty('studentId', testStudentId);

    // Step 3: Set up payment method (depends on user service)
    const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
      type: 'card',
      card: {
        number: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2026,
        cvv: '123',
        holderName: 'Dependency Chain Parent'
      },
      billingAddress: {
        line1: '123 Dependency Street',
        city: 'TestCity',
        state: 'TestState',
        pincode: '123456',
        country: 'IN'
      },
      isDefault: true
    }, testParentToken);
    const paymentMethodId = paymentMethodResponse.data.id;

    console.log(`💳 Payment method created via dependency chain: ${paymentMethodId}`);

    // Step 4: Process payment (depends on order service, user service, payment method)
    const paymentResponse = await apiRequest('POST', '/payments/process', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId,
      description: `Dependency chain payment for Order ${orderResponse.data.orderNumber}`
    }, testParentToken);
    expect(paymentResponse.status).toBe(200);
    const {paymentId} = paymentResponse.data;

    console.log(`💰 Payment processed via dependency chain: ${paymentId}`);

    // Step 5: Complete payment (triggers notification and analytics dependencies)
    await apiRequest('POST', `/payments/${paymentId}/confirm`, {
      paymentId,
      status: 'completed',
      transactionId: `txn_chain_${uuidv4()}`
    }, testParentToken);

    console.log(`✅ Payment completed, triggering dependent services`);

    // Step 6: Verify notification service dependency execution
    const notificationsResponse = await apiRequest('GET', '/notifications', {
      userId: testParentId,
      type: 'payment_confirmation'
    }, testParentToken);

    expect(notificationsResponse.data.length).toBeGreaterThan(0);
    const confirmationNotification = notificationsResponse.data.find((n: any) =>
      n.data?.orderId === orderId
    );
    expect(confirmationNotification).toBeDefined();

    console.log(`📧 Notification service executed via dependency chain`);

    // Step 7: Verify analytics service dependency execution
    const analyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
    expect(analyticsResponse.data.totalOrders).toBe(1);
    expect(analyticsResponse.data.totalPayments).toBe(1);
    expect(analyticsResponse.data.totalSpent).toBe(orderResponse.data.totalAmount);

    console.log(`📊 Analytics service executed via dependency chain`);

    // Step 8: Verify complete dependency chain execution
    const chainExecutionResponse = await apiRequest('GET', `/system/dependencies/chain/${orderId}`, undefined, testParentToken);
    expect(chainExecutionResponse.status).toBe(200);
    expect(chainExecutionResponse.data).toHaveProperty('chain');
    expect(chainExecutionResponse.data.chain.length).toBeGreaterThan(3); // At least 4 services involved

    const executedServices = chainExecutionResponse.data.chain.map((c: any) => c.service);
    expect(executedServices).toContain('user-service');
    expect(executedServices).toContain('order-service');
    expect(executedServices).toContain('payment-service');
    expect(executedServices).toContain('notification-service');
    expect(executedServices).toContain('analytics-service');

    const dependencyChainTime = Date.now() - chainStartTime;
    performanceMetrics.dependencyChainTime.push(dependencyChainTime);

    console.log(`⛓️ Complete service dependency chain executed (${dependencyChainTime}ms)`);
  });

  /**
   * Service Health Monitoring and Failover Test
   */
  test('should monitor service health and handle dependency failures', async () => {
    console.log('💓 Testing service health monitoring and failover...');

    const healthStartTime = Date.now();

    // Step 1: Check initial service health
    const initialHealthResponse = await apiRequest('GET', '/system/health/services', undefined, testParentToken);
    expect(initialHealthResponse.status).toBe(200);

    Object.values(initialHealthResponse.data.services).forEach((service: any) => {
      expect(service.status).toBe('healthy');
      expect(service).toHaveProperty('responseTime');
      expect(service).toHaveProperty('lastChecked');
    });

    console.log(`💚 Initial service health check passed`);

    // Step 2: Create order to establish baseline
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

    // Step 3: Simulate payment service degradation
    const degradedPaymentResponse = await apiRequest('POST', '/payments/process', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: 'pm_test_card',
      simulateDegradation: true,
      responseDelay: 5000 // 5 second delay
    }, testParentToken);

    // Should still succeed but with warning
    expect(degradedPaymentResponse.status).toBe(200);
    expect(degradedPaymentResponse.data).toHaveProperty('performanceWarning', true);

    console.log(`⚠️ Payment service degradation detected and handled`);

    // Step 4: Check updated service health after degradation
    const degradedHealthResponse = await apiRequest('GET', '/system/health/services', undefined, testParentToken);
    expect(degradedHealthResponse.status).toBe(200);

    const paymentServiceHealth = Object.values(degradedHealthResponse.data.services)
      .find((s: any) => s.name === 'payment-service') as any;

    expect(paymentServiceHealth).toBeDefined();
    expect(paymentServiceHealth.status).toBe('degraded');
    expect(paymentServiceHealth.responseTime).toBeGreaterThan(4000);

    console.log(`📉 Payment service health status updated to degraded`);

    // Step 5: Test failover to backup payment processing
    const failoverPaymentResponse = await apiRequest('POST', '/payments/process/failover', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: 'pm_failover_card',
      reason: 'primary_service_degraded'
    }, testParentToken);

    expect(failoverPaymentResponse.status).toBe(200);
    expect(failoverPaymentResponse.data).toHaveProperty('failoverMode', true);
    expect(failoverPaymentResponse.data).toHaveProperty('backupService', 'payment-service-backup');

    const failoverPaymentId = failoverPaymentResponse.data.paymentId;

    // Complete failover payment
    await apiRequest('POST', `/payments/${failoverPaymentId}/confirm`, {
      paymentId: failoverPaymentId,
      status: 'completed',
      transactionId: `txn_failover_${uuidv4()}`
    }, testParentToken);

    console.log(`🔄 Failover payment processing successful`);

    // Step 6: Verify service recovery monitoring
    // Simulate service recovery
    await new Promise(resolve => setTimeout(resolve, 2000));

    const recoveryTestResponse = await apiRequest('POST', '/payments/process', {
      orderId,
      amount: orderResponse.data.totalAmount,
      currency: 'INR',
      paymentMethodId: 'pm_recovery_test',
      description: 'Test service recovery'
    }, testParentToken);

    expect(recoveryTestResponse.status).toBe(200);

    // Step 7: Check service health recovery
    const recoveryHealthResponse = await apiRequest('GET', '/system/health/services', undefined, testParentToken);
    const recoveredPaymentService = Object.values(recoveryHealthResponse.data.services)
      .find((s: any) => s.name === 'payment-service') as any;

    expect(recoveredPaymentService.status).toBe('healthy');
    expect(recoveredPaymentService.responseTime).toBeLessThan(2000);

    console.log(`💚 Payment service health recovered`);

    // Step 8: Verify failover analytics
    const failoverAnalyticsResponse = await apiRequest('GET', '/analytics/system/failover', {
      timeframe: 'last_hour'
    }, testParentToken);

    expect(failoverAnalyticsResponse.data).toHaveProperty('failoverEvents');
    expect(failoverAnalyticsResponse.data.failoverEvents.length).toBeGreaterThan(0);

    const paymentFailoverEvent = failoverAnalyticsResponse.data.failoverEvents
      .find((e: any) => e.service === 'payment-service');
    expect(paymentFailoverEvent).toBeDefined();
    expect(paymentFailoverEvent).toHaveProperty('success', true);

    const serviceHealthTime = Date.now() - healthStartTime;
    performanceMetrics.serviceHealthTime.push(serviceHealthTime);

    console.log(`💓 Service health monitoring and failover completed (${serviceHealthTime}ms)`);
  });

  /**
   * Service Dependency Impact Analysis Test
   */
  test('should analyze and predict service dependency impacts', async () => {
    console.log('🔍 Testing service dependency impact analysis...');

    // Step 1: Generate dependency impact baseline
    const baselineResponse = await apiRequest('GET', '/system/dependencies/impact/baseline', undefined, testParentToken);
    expect(baselineResponse.status).toBe(200);
    expect(baselineResponse.data).toHaveProperty('serviceImpacts');

    console.log(`📊 Service dependency impact baseline established`);

    // Step 2: Create test transactions to analyze
    const testTransactions = [];
    for (let i = 0; i < 5; i++) {
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
      testTransactions.push(orderResponse.data.id);
    }

    console.log(`📦 Created ${testTransactions.length} test transactions for impact analysis`);

    // Step 3: Analyze dependency chain performance
    const performanceAnalysisResponse = await apiRequest('POST', '/system/dependencies/impact/analyze', {
      transactions: testTransactions,
      metrics: ['responseTime', 'successRate', 'errorRate', 'dependencyLatency']
    }, testParentToken);

    expect(performanceAnalysisResponse.status).toBe(200);
    expect(performanceAnalysisResponse.data).toHaveProperty('servicePerformance');
    expect(performanceAnalysisResponse.data).toHaveProperty('dependencyChains');

    // Verify performance metrics for each service
    Object.values(performanceAnalysisResponse.data.servicePerformance).forEach((service: any) => {
      expect(service).toHaveProperty('averageResponseTime');
      expect(service).toHaveProperty('successRate');
      expect(service.successRate).toBeGreaterThan(0.8); // 80% success rate
    });

    console.log(`⚡ Service performance metrics analyzed`);

    // Step 4: Predict impact of service failure
    const failurePredictionResponse = await apiRequest('POST', '/system/dependencies/impact/predict', {
      failureScenario: {
        service: 'payment-service',
        failureType: 'complete_outage',
        duration: '1_hour'
      },
      impactMetrics: ['transactionFailureRate', 'userImpact', 'revenueLoss', 'recoveryTime']
    }, testParentToken);

    expect(failurePredictionResponse.status).toBe(200);
    expect(failurePredictionResponse.data).toHaveProperty('predictedImpact');
    expect(failurePredictionResponse.data.predictedImpact).toHaveProperty('transactionFailureRate');
    expect(failurePredictionResponse.data.predictedImpact).toHaveProperty('userImpact');
    expect(failurePredictionResponse.data.predictedImpact).toHaveProperty('revenueLoss');

    console.log(`🔮 Service failure impact predicted`);

    // Step 5: Test dependency optimization recommendations
    const optimizationResponse = await apiRequest('GET', '/system/dependencies/impact/optimize', undefined, testParentToken);
    expect(optimizationResponse.status).toBe(200);
    expect(optimizationResponse.data).toHaveProperty('recommendations');

    // Should include recommendations for improving dependency performance
    expect(optimizationResponse.data.recommendations.length).toBeGreaterThan(0);

    const {recommendations} = optimizationResponse.data;
    const hasCachingRecommendation = recommendations.some((r: any) =>
      r.type === 'caching' || r.description.toLowerCase().includes('cache')
    );
    const hasAsyncRecommendation = recommendations.some((r: any) =>
      r.type === 'async_processing' || r.description.toLowerCase().includes('async')
    );

    expect(hasCachingRecommendation || hasAsyncRecommendation).toBe(true);

    console.log(`💡 Dependency optimization recommendations generated`);

    // Step 6: Verify impact analysis completeness
    const completenessResponse = await apiRequest('GET', '/system/dependencies/impact/completeness', undefined, testParentToken);
    expect(completenessResponse.status).toBe(200);
    expect(completenessResponse.data).toHaveProperty('coverage');
    expect(completenessResponse.data.coverage.services).toBeGreaterThan(0.8); // 80% coverage
    expect(completenessResponse.data.coverage.dependencies).toBeGreaterThan(0.8);

    console.log(`📈 Dependency impact analysis completeness verified`);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });
});