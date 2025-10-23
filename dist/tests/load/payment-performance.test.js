"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const perf_hooks_1 = require("perf_hooks");
const payment_service_1 = require("../../src/services/payment.service");
const order_service_1 = require("../../src/services/order.service");
const customer_service_1 = require("../../src/services/customer.service");
const paymentGateway_service_1 = require("../../src/services/paymentGateway.service");
const notification_service_1 = require("../../src/services/notification.service");
const analytics_service_1 = require("../../src/services/analytics.service");
const rfid_service_1 = require("../../src/services/rfid.service");
const DatabaseManager_1 = require("../../src/database/DatabaseManager");
const LoadTestDataGenerator_1 = require("../utils/LoadTestDataGenerator");
const MockPaymentProcessor_1 = require("../mocks/MockPaymentProcessor");
const MockNotificationProvider_1 = require("../mocks/MockNotificationProvider");
const order_service_2 = require("../../src/services/order.service");
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
const mockServices = {
    paymentProcessor: new MockPaymentProcessor_1.MockPaymentProcessor(),
    notificationProvider: new MockNotificationProvider_1.MockNotificationProvider(),
    database: null,
    dataGenerator: new LoadTestDataGenerator_1.LoadTestDataGenerator()
};
class PerformanceTracker {
    metrics = {
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
    responseTimes = [];
    startTime = 0;
    startTracking() {
        this.startTime = perf_hooks_1.performance.now();
        this.resetMetrics();
    }
    recordTransaction(responseTime, success) {
        this.metrics.totalTransactions++;
        this.responseTimes.push(responseTime);
        if (success) {
            this.metrics.successfulTransactions++;
        }
        else {
            this.metrics.failedTransactions++;
        }
        this.updateResponseTimeMetrics(responseTime);
    }
    updateResponseTimeMetrics(responseTime) {
        this.metrics.peakResponseTime = Math.max(this.metrics.peakResponseTime, responseTime);
        this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, responseTime);
        this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    }
    finishTracking() {
        const duration = (perf_hooks_1.performance.now() - this.startTime) / 1000;
        this.metrics.throughputPerSecond = this.metrics.totalTransactions / duration;
        this.metrics.errorRate = this.metrics.failedTransactions / this.metrics.totalTransactions;
        this.metrics.memoryUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
        return this.metrics;
    }
    resetMetrics() {
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
(0, globals_1.describe)('Payment Performance Load Tests', () => {
    let paymentService;
    let orderService;
    let menuService;
    let customerService;
    let paymentGatewayService;
    let notificationService;
    let analyticsService;
    let rfidService;
    let performanceTracker;
    (0, globals_1.beforeAll)(async () => {
        mockServices.database = await DatabaseManager_1.DatabaseManager.getInstance();
        await mockServices.database.connect();
        await mockServices.database.migrate();
        paymentGatewayService = paymentGateway_service_1.PaymentGatewayService.getInstance();
        notificationService = notification_service_1.NotificationService;
        analyticsService = analytics_service_1.AnalyticsService;
        rfidService = rfid_service_1.RfidService;
        customerService = customer_service_1.CustomerService.getInstance();
        orderService = order_service_1.OrderService;
        paymentService = new payment_service_1.PaymentService();
        performanceTracker = new PerformanceTracker();
        await mockServices.dataGenerator.seedMenuItems(100);
        await mockServices.dataGenerator.seedCustomers(1000);
    });
    (0, globals_1.afterAll)(async () => {
        await mockServices.database.disconnect();
    });
    (0, globals_1.beforeEach)(() => {
        mockServices.paymentProcessor.reset();
        mockServices.notificationProvider.reset();
    });
    (0, globals_1.afterEach)(() => {
    });
    (0, globals_1.describe)('Single Payment Processing Performance', () => {
        (0, globals_1.it)('should process individual payments within performance thresholds', async () => {
            const testData = await mockServices.dataGenerator.generateOrder();
            const startTime = perf_hooks_1.performance.now();
            const result = await payment_service_1.PaymentService.processPayment({
                orderId: testData.id,
                amount: testData.totalAmount,
                currency: 'INR',
                paymentMethod: 'card',
            });
            const processingTime = perf_hooks_1.performance.now() - startTime;
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.data?.paymentId).toBeDefined();
            (0, globals_1.expect)(processingTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
        });
        (0, globals_1.it)('should handle payment failures gracefully with minimal overhead', async () => {
            mockServices.paymentProcessor.setFailureRate(1.0);
            const testData = await mockServices.dataGenerator.generateOrder();
            const startTime = perf_hooks_1.performance.now();
            const result = await payment_service_1.PaymentService.processPayment({
                orderId: testData.id,
                amount: testData.totalAmount,
                currency: 'INR',
                paymentMethod: 'card'
            });
            const processingTime = perf_hooks_1.performance.now() - startTime;
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error?.message).toBeDefined();
            (0, globals_1.expect)(processingTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
        });
        (0, globals_1.it)('should perform database operations within acceptable limits', async () => {
            const testData = await mockServices.dataGenerator.generateOrder();
            const startTime = perf_hooks_1.performance.now();
            const payment = await paymentService.createPaymentOrder({
                userId: testData.userId,
                amount: testData.totalAmount,
                currency: 'INR'
            });
            const dbTime = perf_hooks_1.performance.now() - startTime;
            (0, globals_1.expect)(payment.id).toBeDefined();
            (0, globals_1.expect)(dbTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MS);
            const updateStartTime = perf_hooks_1.performance.now();
            await paymentService.updateOrder(payment.id, 'completed');
            const updateTime = perf_hooks_1.performance.now() - updateStartTime;
            (0, globals_1.expect)(updateTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MS);
        });
    });
    (0, globals_1.describe)('Concurrent Payment Processing Load Tests', () => {
        (0, globals_1.it)('should handle high concurrent payment volume with acceptable performance', async () => {
            performanceTracker.startTracking();
            const concurrentUsers = LOAD_TEST_CONFIG.CONCURRENT_USERS;
            const transactionsPerUser = LOAD_TEST_CONFIG.TRANSACTIONS_PER_USER;
            const testOrders = await Promise.all(Array.from({ length: concurrentUsers * transactionsPerUser }, () => mockServices.dataGenerator.generateOrder()));
            const userPromises = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
                const userOrders = testOrders.slice(userIndex * transactionsPerUser, (userIndex + 1) * transactionsPerUser);
                return Promise.all(userOrders.map(async (order) => {
                    const startTime = perf_hooks_1.performance.now();
                    try {
                        const result = await payment_service_1.PaymentService.processPayment({
                            orderId: order.id,
                            amount: order.totalAmount,
                            currency: 'INR',
                            paymentMethod: 'card',
                        });
                        const responseTime = perf_hooks_1.performance.now() - startTime;
                        performanceTracker.recordTransaction(responseTime, result.success);
                        return result;
                    }
                    catch (error) {
                        const responseTime = perf_hooks_1.performance.now() - startTime;
                        performanceTracker.recordTransaction(responseTime, false);
                        throw error;
                    }
                }));
            });
            await Promise.all(userPromises);
            const metrics = performanceTracker.finishTracking();
            (0, globals_1.expect)(metrics.errorRate).toBeLessThan(1 - LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.CONCURRENT_LOAD_SUCCESS_RATE);
            (0, globals_1.expect)(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
            (0, globals_1.expect)(metrics.throughputPerSecond).toBeGreaterThan(10);
            (0, globals_1.expect)(metrics.totalTransactions).toBe(concurrentUsers * transactionsPerUser);
        });
        (0, globals_1.it)('should maintain payment processing integrity under concurrent load', async () => {
            const concurrentTransactions = 50;
            const testAmount = 25.99;
            const orders = await Promise.all(Array.from({ length: concurrentTransactions }, () => mockServices.dataGenerator.generateOrder()));
            const paymentPromises = orders.map(async (order) => {
                return payment_service_1.PaymentService.processPayment({
                    orderId: order.id,
                    amount: testAmount,
                    currency: 'INR',
                    paymentMethod: 'card',
                });
            });
            const results = await Promise.all(paymentPromises);
            const successfulPayments = results.filter(r => r.success);
            (0, globals_1.expect)(successfulPayments.length).toBe(concurrentTransactions);
            const transactionIds = successfulPayments.map(p => p.data?.paymentId);
            const uniqueIds = new Set(transactionIds);
            (0, globals_1.expect)(uniqueIds.size).toBe(concurrentTransactions);
            for (const result of successfulPayments) {
                const paymentRecord = await paymentService.getPaymentOrder(result.data.paymentId);
                (0, globals_1.expect)(paymentRecord).toBeDefined();
                (0, globals_1.expect)(paymentRecord.amount).toBe(testAmount);
                (0, globals_1.expect)(paymentRecord.status).toBe('completed');
            }
        });
    });
    (0, globals_1.describe)('Payment Method Performance Variations', () => {
        const paymentMethods = [
            'card',
            'card',
            'wallet',
            'card',
            'upi'
        ];
        paymentMethods.forEach(method => {
            (0, globals_1.it)(`should process ${method} payments within performance thresholds`, async () => {
                const testData = await mockServices.dataGenerator.generateOrder();
                performanceTracker.startTracking();
                const startTime = perf_hooks_1.performance.now();
                const result = await payment_service_1.PaymentService.processPayment({
                    orderId: testData.id,
                    amount: testData.totalAmount,
                    currency: 'INR',
                    paymentMethod: method,
                    ...(method === 'card' && {}),
                    ...(method === 'card' && {
                        rfidTag: 'RFID123456789'
                    }),
                    ...(method === 'wallet' && {
                        walletId: 'wallet_test_123'
                    })
                });
                const processingTime = perf_hooks_1.performance.now() - startTime;
                performanceTracker.recordTransaction(processingTime, result.success);
                const metrics = performanceTracker.finishTracking();
                (0, globals_1.expect)(result.success).toBe(true);
                (0, globals_1.expect)(processingTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
                (0, globals_1.expect)(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
            });
        });
    });
    (0, globals_1.describe)('Payment Gateway Performance', () => {
        (0, globals_1.it)('should handle payment gateway timeouts gracefully', async () => {
            mockServices.paymentProcessor.setNetworkDelay(5000);
            const testData = await mockServices.dataGenerator.generateOrder();
            const startTime = perf_hooks_1.performance.now();
            const result = await payment_service_1.PaymentService.processPayment({
                orderId: testData.id,
                amount: testData.totalAmount,
                currency: 'INR',
                paymentMethod: 'card',
            });
            const processingTime = perf_hooks_1.performance.now() - startTime;
            (0, globals_1.expect)(result).toBeDefined();
            (0, globals_1.expect)(processingTime).toBeLessThan(10000);
        });
        (0, globals_1.it)('should maintain performance under payment gateway rate limiting', async () => {
            mockServices.paymentProcessor.setRateLimit(5);
            const concurrentPayments = 20;
            const orders = await Promise.all(Array.from({ length: concurrentPayments }, () => mockServices.dataGenerator.generateOrder()));
            performanceTracker.startTracking();
            const paymentPromises = orders.map(async (order, index) => {
                await new Promise(resolve => setTimeout(resolve, index * 200));
                const startTime = perf_hooks_1.performance.now();
                const result = await payment_service_1.PaymentService.processPayment({
                    orderId: order.id,
                    amount: order.totalAmount,
                    currency: 'INR',
                    paymentMethod: 'card',
                });
                const responseTime = perf_hooks_1.performance.now() - startTime;
                performanceTracker.recordTransaction(responseTime, result.success);
                return result;
            });
            const results = await Promise.all(paymentPromises);
            const metrics = performanceTracker.finishTracking();
            (0, globals_1.expect)(metrics.errorRate).toBeLessThan(0.1);
            (0, globals_1.expect)(results.filter(r => r.success).length).toBeGreaterThan(concurrentPayments * 0.9);
        });
    });
    (0, globals_1.describe)('Database Performance Under Load', () => {
        (0, globals_1.it)('should handle high-volume payment record operations', async () => {
            const recordCount = 1000;
            const batchSize = 50;
            const orders = await Promise.all(Array.from({ length: recordCount }, () => mockServices.dataGenerator.generateOrder()));
            performanceTracker.startTracking();
            for (let i = 0; i < recordCount; i += batchSize) {
                const batch = orders.slice(i, i + batchSize);
                const batchPromises = batch.map(async (order) => {
                    const startTime = perf_hooks_1.performance.now();
                    try {
                        const payment = await paymentService.createPaymentOrder({
                            userId: order.userId,
                            amount: order.totalAmount,
                            currency: 'INR'
                        });
                        const responseTime = perf_hooks_1.performance.now() - startTime;
                        performanceTracker.recordTransaction(responseTime, true);
                        return payment;
                    }
                    catch (error) {
                        const responseTime = perf_hooks_1.performance.now() - startTime;
                        performanceTracker.recordTransaction(responseTime, false);
                        throw error;
                    }
                });
                await Promise.all(batchPromises);
            }
            const metrics = performanceTracker.finishTracking();
            (0, globals_1.expect)(metrics.errorRate).toBeLessThan(0.01);
            (0, globals_1.expect)(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MS);
            (0, globals_1.expect)(metrics.totalTransactions).toBe(recordCount);
        });
        (0, globals_1.it)('should maintain query performance with large payment history', async () => {
            const historicalPayments = 5000;
            await mockServices.dataGenerator.seedPaymentHistory(historicalPayments);
            const testData = await mockServices.dataGenerator.generateOrder();
            const startTime = perf_hooks_1.performance.now();
            const payments = await paymentService.getAllOrders({
                userId: testData.userId,
                limit: 50,
                offset: 0,
                dateRange: {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    end: new Date()
                }
            });
            const queryTime = perf_hooks_1.performance.now() - startTime;
            (0, globals_1.expect)(payments).toBeDefined();
            (0, globals_1.expect)(queryTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MS);
            const analyticsStartTime = perf_hooks_1.performance.now();
            const analytics = await paymentService.getPaymentAnalytics({
                userId: testData.userId,
                period: 'month',
                type: 'summary'
            });
            const analyticsTime = perf_hooks_1.performance.now() - analyticsStartTime;
            (0, globals_1.expect)(analytics).toBeDefined();
            (0, globals_1.expect)(analyticsTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.DATABASE_QUERY_MS * 2);
        });
    });
    (0, globals_1.describe)('Memory and Resource Usage', () => {
        (0, globals_1.it)('should maintain stable memory usage under sustained load', async () => {
            const testDuration = 10000;
            const requestInterval = 100;
            const startTime = Date.now();
            const initialMemory = process.memoryUsage().heapUsed;
            const memoryReadings = [];
            const loadTestPromise = (async () => {
                while (Date.now() - startTime < testDuration) {
                    const order = await mockServices.dataGenerator.generateOrder();
                    await payment_service_1.PaymentService.processPayment({
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
            const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
            (0, globals_1.expect)(memoryIncrease).toBeLessThan(50);
            const recentMemory = memoryReadings.slice(-10);
            const memoryTrend = recentMemory[recentMemory.length - 1] - recentMemory[0];
            (0, globals_1.expect)(memoryTrend).toBeLessThan(10 * 1024 * 1024);
        });
        (0, globals_1.it)('should efficiently manage connection pooling', async () => {
            const concurrentConnections = 100;
            const connectionPromises = [];
            for (let i = 0; i < concurrentConnections; i++) {
                const promise = (async () => {
                    const order = await mockServices.dataGenerator.generateOrder();
                    return payment_service_1.PaymentService.processPayment({
                        orderId: order.id,
                        amount: 25.99,
                        currency: 'INR',
                        paymentMethod: 'card',
                    });
                })();
                connectionPromises.push(promise);
            }
            const startTime = perf_hooks_1.performance.now();
            const results = await Promise.all(connectionPromises);
            const totalTime = perf_hooks_1.performance.now() - startTime;
            (0, globals_1.expect)(results.filter(r => r.success).length).toBe(concurrentConnections);
            const avgTimePerConnection = totalTime / concurrentConnections;
            (0, globals_1.expect)(avgTimePerConnection).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
        });
    });
    (0, globals_1.describe)('End-to-End Performance Scenarios', () => {
        (0, globals_1.it)('should handle complete restaurant order and payment flow under load', async () => {
            const numberOfOrders = 50;
            performanceTracker.startTracking();
            const orderPromises = Array.from({ length: numberOfOrders }, async () => {
                const customer = await mockServices.dataGenerator.generateCustomer();
                const menuItems = await mockServices.dataGenerator.getRandomMenuItems(3);
                const startTime = perf_hooks_1.performance.now();
                try {
                    const order = await order_service_1.OrderService.createOrder({
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
                    const paymentResult = await payment_service_1.PaymentService.processPayment({
                        orderId: order.data?.id,
                        amount: order.data?.totalAmount,
                        currency: 'INR',
                        paymentMethod: 'card',
                    });
                    await order_service_1.OrderService.updateOrderStatus(order.data?.id, order_service_2.OrderStatus.CONFIRMED);
                    const responseTime = perf_hooks_1.performance.now() - startTime;
                    performanceTracker.recordTransaction(responseTime, paymentResult.success);
                    return {
                        order,
                        payment: paymentResult,
                        responseTime
                    };
                }
                catch (error) {
                    const responseTime = perf_hooks_1.performance.now() - startTime;
                    performanceTracker.recordTransaction(responseTime, false);
                    throw error;
                }
            });
            const results = await Promise.all(orderPromises);
            const metrics = performanceTracker.finishTracking();
            (0, globals_1.expect)(metrics.errorRate).toBeLessThan(0.05);
            (0, globals_1.expect)(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.TRANSACTION_COMPLETION_MS);
            (0, globals_1.expect)(results.length).toBe(numberOfOrders);
        });
        (0, globals_1.it)('should maintain performance during peak restaurant hours simulation', async () => {
            const peakDurationMs = 15000;
            const ordersPerSecond = 8;
            const startTime = Date.now();
            performanceTracker.startTracking();
            const orderPromises = [];
            while (Date.now() - startTime < peakDurationMs) {
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
                        const requestStartTime = perf_hooks_1.performance.now();
                        try {
                            const order = await order_service_1.OrderService.createOrder({
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
                            const payment = await payment_service_1.PaymentService.processPayment({
                                orderId: order.data?.id,
                                amount: order.data?.totalAmount,
                                currency: 'INR',
                                paymentMethod,
                                ...(paymentMethod === 'card' && {})
                            });
                            const responseTime = perf_hooks_1.performance.now() - requestStartTime;
                            performanceTracker.recordTransaction(responseTime, payment.success);
                            return { order, payment };
                        }
                        catch (error) {
                            const responseTime = perf_hooks_1.performance.now() - requestStartTime;
                            performanceTracker.recordTransaction(responseTime, false);
                            throw error;
                        }
                    })();
                    orderPromises.push(orderPromise);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            await Promise.all(orderPromises);
            const metrics = performanceTracker.finishTracking();
            (0, globals_1.expect)(metrics.errorRate).toBeLessThan(0.1);
            (0, globals_1.expect)(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.TRANSACTION_COMPLETION_MS * 1.5);
            (0, globals_1.expect)(metrics.throughputPerSecond).toBeGreaterThan(5);
        });
    });
    (0, globals_1.describe)('Performance Regression Tests', () => {
        (0, globals_1.it)('should maintain consistent performance across multiple test runs', async () => {
            const testRuns = 5;
            const transactionsPerRun = 20;
            const performanceResults = [];
            for (let run = 0; run < testRuns; run++) {
                const runTracker = new PerformanceTracker();
                runTracker.startTracking();
                const orders = await Promise.all(Array.from({ length: transactionsPerRun }, () => mockServices.dataGenerator.generateOrder()));
                const paymentPromises = orders.map(async (order) => {
                    const startTime = perf_hooks_1.performance.now();
                    const result = await payment_service_1.PaymentService.processPayment({
                        orderId: order.id,
                        amount: order.totalAmount,
                        currency: 'INR',
                        paymentMethod: 'card',
                    });
                    const responseTime = perf_hooks_1.performance.now() - startTime;
                    runTracker.recordTransaction(responseTime, result.success);
                    return result;
                });
                await Promise.all(paymentPromises);
                performanceResults.push(runTracker.finishTracking());
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            const avgResponseTimes = performanceResults.map(r => r.averageResponseTime);
            const minAvgTime = Math.min(...avgResponseTimes);
            const maxAvgTime = Math.max(...avgResponseTimes);
            const performanceVariation = (maxAvgTime - minAvgTime) / minAvgTime;
            (0, globals_1.expect)(performanceVariation).toBeLessThan(0.5);
            performanceResults.forEach(metrics => {
                (0, globals_1.expect)(metrics.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.PAYMENT_PROCESSING_MS);
                (0, globals_1.expect)(metrics.errorRate).toBeLessThan(0.05);
            });
        });
    });
});
//# sourceMappingURL=payment-performance.test.js.map