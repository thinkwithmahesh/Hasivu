/**
 * HASIVU Platform - Payment Performance Load Tests
 * 
 * Comprehensive payment system performance testing under load conditions,
 * validating payment processing, transaction handling, concurrent operations,
 * and system resilience across the restaurant management platform.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { performance } from 'perf_hooks';
import { PaymentService } from '../../src/services/payment.service';
import { OrderService } from '../../src/services/order.service';
import { MenuItemService as MenuService } from '../../src/services/menuItem.service';
import { CustomerService } from '../../src/services/customer.service';
import { PaymentGatewayService } from '../../src/services/paymentGateway.service';
import { NotificationService } from '../../src/services/notification.service';
import { AnalyticsService } from '../../src/services/analytics.service';
import { RfidService } from '../../src/services/rfid.service';
import { DatabaseManager } from '../../src/database/DatabaseManager';
import { LoadTestDataGenerator } from '../utils/LoadTestDataGenerator';
import { MockPaymentProcessor } from '../mocks/MockPaymentProcessor';
import { MockNotificationProvider } from '../mocks/MockNotificationProvider';
import { PaymentMethod, PaymentStatus, OrderStatus } from '../../src/types/api.types';
import { OrderStatus as OrderStatusEnum } from '../../src/services/order.service';

// Load testing configuration
const LOAD_TEST_CONFIG = {
  CONCURRENT_USERS: 100,
  TRANSACTIONS_PER_USER: 10,
  TEST_DURATION_MS: 30000,
  PAYMENT_AMOUNTS: [15.99, 25.50, 35.75, 42.30, 18.25],
  PERFORMANCE_THRESHOLDS: {
    PAYMENT_PROCESSING_MS: 2000,
    TRANSACTION_COMPLETION_MS: 3000,
    DATABASE_QUERY_MS: 500,
    API_RESPONSE_MS: 1000,
    CONCURRENT_LOAD_SUCCESS_RATE: 0.95
  }
};

// Mock services setup
const mockServices = {
  paymentProcessor: new MockPaymentProcessor(),
  notificationProvider: new MockNotificationProvider(),
  database: null as any,
  dataGenerator: new LoadTestDataGenerator()
};

// Performance metrics tracking
interface PerformanceMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageResponseTime: number;
  peakResponseTime: number;
  minResponseTime: number;
  throughputPerSecond: number;
  errorRate: number;
  concurrentUsers: number;
  memoryUsageMB: number;
  cpuUsagePercent: number;
}

class PerformanceTracker {
  private metrics: PerformanceMetrics = {
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    averageResponseTime: 0,
    peakResponseTime: 0,
    minResponseTime: Infinity,
    throughputPerSecond: 0,
    errorRate: 0,
    concurrentUsers: 0,
    memoryUsageMB: 0,
    cpuUsagePercent: 0
  };

  private responseTimes: number[] = [];
  private startTime: number = 0;

  startTracking(): void {
    this.startTime = performance.now();
    this.resetMetrics();
  }

  recordTransaction(responseTime: number, success: boolean): void {
    this.metrics.totalTransactions++;
    this.responseTimes.push(responseTime);

    if (success) {
      this.metrics.successfulTransactions++;
    } else {
      this.metrics.failedTransactions++;
    }

    this.updateResponseTimeMetrics(responseTime);
  }

  private updateResponseTimeMetrics(responseTime: number): void {
    this.metrics.peakResponseTime = Math.max(this.metrics.peakResponseTime, responseTime);
    this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, responseTime);
    this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  finishTracking(): PerformanceMetrics {
    const duration = (performance.now() - this.startTime) / 1000;
    this.metrics.throughputPerSecond = this.metrics.totalTransactions / duration;
    this.metrics.errorRate = this.metrics.failedTransactions / this.metrics.totalTransactions;
    this.metrics.memoryUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
    return this.metrics;
  }

  private resetMetrics(): void {
    this.metrics = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      averageResponseTime: 0,
      peakResponseTime: 0,
      minResponseTime: Infinity,
      throughputPerSecond: 0,
      errorRate: 0,
      concurrentUsers: 0,
      memoryUsageMB: 0,
      cpuUsagePercent: 0
    };
    this.responseTimes = [];
  }
}

describe('Payment Performance Load Tests', () => {
  let paymentService: PaymentService;
  let orderService: typeof OrderService;
  let menuService: any; // MenuItemService uses static methods
  let customerService: CustomerService;
  let paymentGatewayService: PaymentGatewayService;
  let notificationService: typeof NotificationService;
  let analyticsService: typeof AnalyticsService;
  let rfidService: typeof RfidService;
  let performanceTracker: PerformanceTracker;

  beforeAll(async () => {
    // Initialize mock database
    mockServices.database = await DatabaseManager.getInstance();
    await mockServices.database.connect();
    await mockServices.database.migrate();

    // Initialize services with correct patterns based on actual implementations
    paymentGatewayService = PaymentGatewayService.getInstance(); // Singleton
    notificationService = NotificationService; // Static class
    analyticsService = AnalyticsService; // Static class
    rfidService = RfidService; // Static class

    // Static method services - no instance needed
    customerService = CustomerService.getInstance(); // Singleton
    orderService = OrderService; // Static class
    paymentService = new PaymentService(); // Instance methods (except processPayment)

    performanceTracker = new PerformanceTracker();

    // Seed test data
    await mockServices.dataGenerator.seedMenuItems(100);
    await mockServices.dataGenerator.seedCustomers(1000);
  });

  afterAll(async () => {
    await mockServices.database.disconnect();
  });

  beforeEach(() => {
    mockServices.paymentProcessor.reset();
    mockServices.notificationProvider.reset();
  });

  afterEach(() => {
    // Clean up any test-specific data
  });

  describe('Single Payment Processing Performance', () => {
    it('should process individual payments within performance thresholds', async () => {
      const testData = await mockServices.dataGenerator.generateOrder();
      
      const startTime = performance.now();
      const result = await PaymentService.processPayment({
        orderId: testData.id,
        amount: testData.totalAmount,
        currency: 'INR',
          paymentMethod: 'card',
              });
      const processingTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data?.paymentId).toBeDefined();
      expect(processingTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
    });

    it('should handle payment failures gracefully with minimal overhead', async () => {
      mockServices.paymentProcessor.setFailureRate(1.0); // Force failure
      const testData = await mockServices.dataGenerator.generateOrder();
      
      const startTime = performance.now();
      const result = await PaymentService.processPayment({
        orderId: testData.id,
        amount: testData.totalAmount,
        currency: 'INR',
        paymentMethod: 'card'
      });
      const processingTime = performance.now() - startTime;

      expect(result.success).toBe(false);
      expect(result.error?.message).toBeDefined();
      expect(processingTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
    });

    it('should perform database operations within acceptable limits', async () => {
      const testData = await mockServices.dataGenerator.generateOrder();
      
      // Test payment record creation
      const startTime = performance.now();
      const payment = await paymentService.createPaymentOrder({
        userId: testData.userId,
        amount: testData.totalAmount,
        currency: 'INR'
      });
      const dbTime = performance.now() - startTime;

      expect(payment.id).toBeDefined();
      expect(dbTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MS);

      // Test payment status update
      const updateStartTime = performance.now();
      await paymentService.updateOrder(payment.id, 'completed');
      const updateTime = performance.now() - updateStartTime;

      expect(updateTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MS);
    });
  });

  describe('Concurrent Payment Processing Load Tests', () => {
    it('should handle high concurrent payment volume with acceptable performance', async () => {
      performanceTracker.startTracking();
      const concurrentUsers = LOAD_TEST_CONFIG.CONCURRENT_USERS;
      const transactionsPerUser = LOAD_TEST_CONFIG.TRANSACTIONS_PER_USER;

      // Generate test data for all transactions
      const testOrders = await Promise.all(
        Array.from({ length: concurrentUsers * transactionsPerUser }, () =>
          mockServices.dataGenerator.generateOrder()
        )
      );

      // Create concurrent user sessions
      const userPromises = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
        const userOrders = testOrders.slice(
          userIndex * transactionsPerUser,
          (userIndex + 1) * transactionsPerUser
        );

        return Promise.all(
          userOrders.map(async (order) => {
            const startTime = performance.now();
            try {
              const result = await PaymentService.processPayment({
                orderId: order.id,
                amount: order.totalAmount,
                currency: 'INR',
          paymentMethod: 'card',
                              });

              const responseTime = performance.now() - startTime;
              performanceTracker.recordTransaction(responseTime, result.success);
              return result;
            } catch (error) {
              const responseTime = performance.now() - startTime;
              performanceTracker.recordTransaction(responseTime, false);
              throw error;
            }
          })
        );
      });

      // Execute all concurrent transactions
      await Promise.all(userPromises);
      
      const metrics = performanceTracker.finishTracking();

      // Validate performance metrics
      expect(metrics.errorRate).toBeLessThan(1 - LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.CONCURRENT_LOAD_SUCCESS_RATE);
      expect(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
      expect(metrics.throughputPerSecond).toBeGreaterThan(10); // At least 10 TPS
      expect(metrics.totalTransactions).toBe(concurrentUsers * transactionsPerUser);
    });

    it('should maintain payment processing integrity under concurrent load', async () => {
      const concurrentTransactions = 50;
      const testAmount = 25.99;
      
      // Generate orders for concurrent processing
      const orders = await Promise.all(
        Array.from({ length: concurrentTransactions }, () =>
          mockServices.dataGenerator.generateOrder()
        )
      );

      // Process payments concurrently
      const paymentPromises = orders.map(async (order) => {
        return PaymentService.processPayment({
          orderId: order.id,
          amount: testAmount,
          currency: 'INR',
          paymentMethod: 'card',
        });
      });

      const results = await Promise.all(paymentPromises);
      
      // Validate all payments processed successfully
      const successfulPayments = results.filter(r => r.success);
      expect(successfulPayments.length).toBe(concurrentTransactions);

      // Verify unique transaction IDs
      const transactionIds = successfulPayments.map(p => p.data?.paymentId);
      const uniqueIds = new Set(transactionIds);
      expect(uniqueIds.size).toBe(concurrentTransactions);

      // Verify database consistency
      for (const result of successfulPayments) {
        const paymentRecord = await paymentService.getPaymentOrder(result.data!.paymentId);
        expect(paymentRecord).toBeDefined();
        expect(paymentRecord.amount).toBe(testAmount);
        expect(paymentRecord.status).toBe('completed');
      }
    });
  });

  describe('Payment Method Performance Variations', () => {
    const paymentMethods = [
      'card',
      'card', 
      'wallet',
      'card',
      'upi'
    ];

    paymentMethods.forEach(method => {
      it(`should process ${method} payments within performance thresholds`, async () => {
        const testData = await mockServices.dataGenerator.generateOrder();
        performanceTracker.startTracking();

        const startTime = performance.now();
        const result = await PaymentService.processPayment({
          orderId: testData.id,
          amount: testData.totalAmount,
          currency: 'INR',
          paymentMethod: method,
                    ...(method === 'card' && {
          }),
          ...(method === 'card' && {
            rfidTag: 'RFID123456789'
          }),
          ...(method === 'wallet' && {
            walletId: 'wallet_test_123'
          })
        });
        const processingTime = performance.now() - startTime;

        performanceTracker.recordTransaction(processingTime, result.success);
        const metrics = performanceTracker.finishTracking();

        expect(result.success).toBe(true);
        expect(processingTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
        expect(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
      });
    });
  });

  describe('Payment Gateway Performance', () => {
    it('should handle payment gateway timeouts gracefully', async () => {
      mockServices.paymentProcessor.setNetworkDelay(5000); // 5 second delay
      const testData = await mockServices.dataGenerator.generateOrder();

      const startTime = performance.now();
      const result = await PaymentService.processPayment({
        orderId: testData.id,
        amount: testData.totalAmount,
        currency: 'INR',
          paymentMethod: 'card',
              });
      const processingTime = performance.now() - startTime;

      // Should handle timeout with fallback mechanism
      expect(result).toBeDefined();
      expect(processingTime).toBeLessThan(10000); // Should timeout before 10 seconds
    });

    it('should maintain performance under payment gateway rate limiting', async () => {
      mockServices.paymentProcessor.setRateLimit(5); // 5 requests per second
      const concurrentPayments = 20;
      
      const orders = await Promise.all(
        Array.from({ length: concurrentPayments }, () =>
          mockServices.dataGenerator.generateOrder()
        )
      );

      performanceTracker.startTracking();

      const paymentPromises = orders.map(async (order, index) => {
        // Stagger requests to respect rate limit
        await new Promise(resolve => setTimeout(resolve, index * 200));
        
        const startTime = performance.now();
        const result = await PaymentService.processPayment({
          orderId: order.id,
          amount: order.totalAmount,
          currency: 'INR',
          paymentMethod: 'card',
        });
        const responseTime = performance.now() - startTime;

        performanceTracker.recordTransaction(responseTime, result.success);
        return result;
      });

      const results = await Promise.all(paymentPromises);
      const metrics = performanceTracker.finishTracking();

      // Validate that rate limiting doesn't cause excessive failures
      expect(metrics.errorRate).toBeLessThan(0.1);
      expect(results.filter(r => r.success).length).toBeGreaterThan(concurrentPayments * 0.9);
    });
  });

  describe('Database Performance Under Load', () => {
    it('should handle high-volume payment record operations', async () => {
      const recordCount = 1000;
      const batchSize = 50;

      const orders = await Promise.all(
        Array.from({ length: recordCount }, () =>
          mockServices.dataGenerator.generateOrder()
        )
      );

      performanceTracker.startTracking();

      // Process in batches to simulate realistic usage
      for (let i = 0; i < recordCount; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (order) => {
          const startTime = performance.now();
          try {
            const payment = await paymentService.createPaymentOrder({
              userId: order.userId,
              amount: order.totalAmount,
              currency: 'INR'
            });
            
            const responseTime = performance.now() - startTime;
            performanceTracker.recordTransaction(responseTime, true);
            return payment;
          } catch (error) {
            const responseTime = performance.now() - startTime;
            performanceTracker.recordTransaction(responseTime, false);
            throw error;
          }
        });

        await Promise.all(batchPromises);
      }

      const metrics = performanceTracker.finishTracking();

      expect(metrics.errorRate).toBeLessThan(0.01);
      expect(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MS);
      expect(metrics.totalTransactions).toBe(recordCount);
    });

    it('should maintain query performance with large payment history', async () => {
      // Create large payment history
      const historicalPayments = 5000;
      await mockServices.dataGenerator.seedPaymentHistory(historicalPayments);

      const testData = await mockServices.dataGenerator.generateOrder();
      
      // Test payment query performance
      const startTime = performance.now();
      const payments = await paymentService.getAllOrders({
        userId: testData.userId,
        limit: 50,
        offset: 0,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date()
        }
      });
      const queryTime = performance.now() - startTime;

      expect(payments).toBeDefined();
      expect(queryTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MS);
      
      // Test payment analytics performance
      const analyticsStartTime = performance.now();
      const analytics = await paymentService.getPaymentAnalytics({
        userId: testData.userId,
        period: 'month',
        type: 'summary'
      });
      const analyticsTime = performance.now() - analyticsStartTime;

      expect(analytics).toBeDefined();
      expect(analyticsTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MS * 2);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain stable memory usage under sustained load', async () => {
      const testDuration = 10000; // 10 seconds
      const requestInterval = 100; // Every 100ms
      const startTime = Date.now();
      const initialMemory = process.memoryUsage().heapUsed;
      
      const memoryReadings: number[] = [];
      
      const loadTestPromise = (async () => {
        while (Date.now() - startTime < testDuration) {
          const order = await mockServices.dataGenerator.generateOrder();
          
          await PaymentService.processPayment({
            orderId: order.id,
            amount: order.totalAmount,
            currency: 'INR',
          paymentMethod: 'card',
                      });

          memoryReadings.push(process.memoryUsage().heapUsed);
          await new Promise(resolve => setTimeout(resolve, requestInterval));
        }
      })();

      await loadTestPromise;

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50);

      // Check for memory leaks (memory should stabilize, not continuously grow)
      const recentMemory = memoryReadings.slice(-10);
      const memoryTrend = recentMemory[recentMemory.length - 1] - recentMemory[0];
      expect(memoryTrend).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth in last readings
    });

    it('should efficiently manage connection pooling', async () => {
      const concurrentConnections = 100;
      const connectionPromises: Promise<any>[] = [];

      for (let i = 0; i < concurrentConnections; i++) {
        const promise = (async () => {
          const order = await mockServices.dataGenerator.generateOrder();
          return PaymentService.processPayment({
            orderId: order.id,
            amount: 25.99,
            currency: 'INR',
          paymentMethod: 'card',
                      });
        })();
        
        connectionPromises.push(promise);
      }

      const startTime = performance.now();
      const results = await Promise.all(connectionPromises);
      const totalTime = performance.now() - startTime;

      // All connections should complete successfully
      expect(results.filter(r => r.success).length).toBe(concurrentConnections);
      
      // Average time per connection should be reasonable
      const avgTimePerConnection = totalTime / concurrentConnections;
      expect(avgTimePerConnection).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
    });
  });

  describe('End-to-End Performance Scenarios', () => {
    it('should handle complete restaurant order and payment flow under load', async () => {
      const numberOfOrders = 50;
      performanceTracker.startTracking();

      const orderPromises = Array.from({ length: numberOfOrders }, async () => {
        const customer = await mockServices.dataGenerator.generateCustomer();
        const menuItems = await mockServices.dataGenerator.getRandomMenuItems(3);
        
        const startTime = performance.now();
        
        try {
          // Create order
          const order = await OrderService.createOrder({
            studentId: customer.id,
            parentId: customer.id,
            schoolId: 'test-school-1',
            items: menuItems.map(item => ({
              menuItemId: item.id,
              quantity: Math.floor(Math.random() * 3) + 1
            })),
            deliveryDate: new Date(),
            deliveryType: 'pickup'
          });

          // Process payment
          const paymentResult = await PaymentService.processPayment({
            orderId: order.data?.id,
            amount: order.data?.totalAmount,
            currency: 'INR',
          paymentMethod: 'card',
                      });

          // Update order status
          await OrderService.updateOrderStatus(order.data?.id, OrderStatusEnum.CONFIRMED);

          const responseTime = performance.now() - startTime;
          performanceTracker.recordTransaction(responseTime, paymentResult.success);

          return {
            order,
            payment: paymentResult,
            responseTime
          };
        } catch (error) {
          const responseTime = performance.now() - startTime;
          performanceTracker.recordTransaction(responseTime, false);
          throw error;
        }
      });

      const results = await Promise.all(orderPromises);
      const metrics = performanceTracker.finishTracking();

      // Validate end-to-end performance
      expect(metrics.errorRate).toBeLessThan(0.05);
      expect(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.TRANSACTION_COMPLETION_MS);
      expect(results.length).toBe(numberOfOrders);
    });

    it('should maintain performance during peak restaurant hours simulation', async () => {
      // Simulate peak hours: high order volume with mixed payment methods
      const peakDurationMs = 15000; // 15 seconds
      const ordersPerSecond = 8;
      const startTime = Date.now();
      
      performanceTracker.startTracking();
      const orderPromises: Promise<any>[] = [];

      while (Date.now() - startTime < peakDurationMs) {
        // Create burst of orders
        for (let i = 0; i < ordersPerSecond; i++) {
          const orderPromise = (async () => {
            const customer = await mockServices.dataGenerator.generateCustomer();
            const menuItems = await mockServices.dataGenerator.getRandomMenuItems(2);
            const paymentMethod = [
              'card',
              'card',
              'wallet',
              'upi'
            ][Math.floor(Math.random() * 4)];

            const requestStartTime = performance.now();

            try {
              const order = await OrderService.createOrder({
                studentId: customer.id,
                parentId: customer.id,
                schoolId: 'test-school-1',
                items: menuItems.map(item => ({
                  menuItemId: item.id,
                  quantity: Math.floor(Math.random() * 2) + 1
                })),
                deliveryDate: new Date(),
                deliveryType: 'pickup'
              });

              const payment = await PaymentService.processPayment({
                orderId: order.data?.id,
                amount: order.data?.totalAmount,
                currency: 'INR',
                paymentMethod,
                                ...(paymentMethod === 'card' && {
                })
              });

              const responseTime = performance.now() - requestStartTime;
              performanceTracker.recordTransaction(responseTime, payment.success);

              return { order, payment };
            } catch (error) {
              const responseTime = performance.now() - requestStartTime;
              performanceTracker.recordTransaction(responseTime, false);
              throw error;
            }
          })();

          orderPromises.push(orderPromise);
        }

        // Wait before next burst (simulate real-world spacing)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await Promise.all(orderPromises);
      const metrics = performanceTracker.finishTracking();

      // Validate peak performance
      expect(metrics.errorRate).toBeLessThan(0.1);
      expect(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.TRANSACTION_COMPLETION_MS * 1.5);
      expect(metrics.throughputPerSecond).toBeGreaterThan(5);
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain consistent performance across multiple test runs', async () => {
      const testRuns = 5;
      const transactionsPerRun = 20;
      const performanceResults: PerformanceMetrics[] = [];

      for (let run = 0; run < testRuns; run++) {
        const runTracker = new PerformanceTracker();
        runTracker.startTracking();

        const orders = await Promise.all(
          Array.from({ length: transactionsPerRun }, () =>
            mockServices.dataGenerator.generateOrder()
          )
        );

        const paymentPromises = orders.map(async (order) => {
          const startTime = performance.now();
          const result = await PaymentService.processPayment({
            orderId: order.id,
            amount: order.totalAmount,
            currency: 'INR',
          paymentMethod: 'card',
                      });
          const responseTime = performance.now() - startTime;

          runTracker.recordTransaction(responseTime, result.success);
          return result;
        });

        await Promise.all(paymentPromises);
        performanceResults.push(runTracker.finishTracking());

        // Brief pause between runs
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Analyze performance consistency
      const avgResponseTimes = performanceResults.map(r => r.averageResponseTime);
      const minAvgTime = Math.min(...avgResponseTimes);
      const maxAvgTime = Math.max(...avgResponseTimes);
      const performanceVariation = (maxAvgTime - minAvgTime) / minAvgTime;

      // Performance should be consistent across runs (less than 50% variation)
      expect(performanceVariation).toBeLessThan(0.5);
      
      // All runs should meet performance thresholds
      performanceResults.forEach(metrics => {
        expect(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
        expect(metrics.errorRate).toBeLessThan(0.05);
      });
    });
  });
});