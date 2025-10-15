"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const client_1 = require("@prisma/client");
const node_fetch_1 = __importDefault(require("node-fetch"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const payment_service_1 = require("../../src/services/payment.service");
const user_service_1 = require("../../src/services/user.service");
const notification_service_1 = require("../../src/services/notification.service");
const order_service_1 = require("../../src/services/order.service");
const menuItem_service_1 = require("../../src/services/menuItem.service");
class SubscriptionService {
    async create() { return { success: true }; }
}
class InvoiceService {
    async generate() { return { success: true }; }
}
class AuditService {
    async log() { return { success: true }; }
}
class SchoolService {
    async findById() { return { success: true }; }
}
const TEST_CONFIG = {
    apiBaseUrl: process.env.TEST_API_BASE_URL || 'http://localhost:3000/api',
    jwtSecret: process.env.JWT_SECRET || 'test_jwt_secret_key',
    databaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/hasivu_test',
    webhookSecret: process.env.WEBHOOK_SECRET || 'test_webhook_secret',
    maxRetries: 3,
    timeoutMs: 30000
};
let prisma;
let paymentService;
let userService;
let notificationService;
let orderService;
let menuItemService;
let testSchoolId;
let testParentId;
let testStudentId;
let testParentToken;
let testStudentToken;
let testPaymentMethodId;
let testOrderIds;
let testPaymentIds;
let testMenuItemIds;
let performanceMetrics;
(0, globals_1.beforeAll)(async () => {
    console.log('🚀 Initializing Analytics to Payment Workflows Test Environment...');
    try {
        prisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: TEST_CONFIG.databaseUrl
                }
            },
            log: ['error', 'warn']
        });
        paymentService = payment_service_1.PaymentService.getInstance();
        userService = user_service_1.UserService.getInstance();
        notificationService = notification_service_1.NotificationService.getInstance();
        orderService = order_service_1.OrderService.getInstance();
        menuItemService = menuItem_service_1.MenuItemService.getInstance();
        await cleanupTestData();
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
        if ('createSchool' in userService && typeof userService.createSchool === 'function') {
            school = await userService.createSchool(schoolData);
        }
        else {
            school = { id: 'school-analytics-test-id', ...schoolData };
        }
        testSchoolId = school.id;
        const parentData = {
            email: 'parent@analytics-test.com',
            password: 'SecurePassword123!',
            firstName: 'Analytics',
            lastName: 'Parent',
            role: 'PARENT',
            schoolId: testSchoolId,
            phone: '+91-9876543213'
        };
        let parent;
        if ('createUser' in userService && typeof userService.createUser === 'function') {
            parent = await userService.createUser(parentData);
        }
        else {
            parent = { id: 'parent-analytics-test-id', ...parentData };
        }
        testParentId = parent.id;
        testParentToken = jsonwebtoken_1.default.sign({
            userId: parent.id,
            schoolId: testSchoolId,
            role: 'PARENT'
        }, TEST_CONFIG.jwtSecret, { expiresIn: '24h' });
        const studentData = {
            email: 'student@analytics-test.com',
            password: 'SecurePassword123!',
            firstName: 'Analytics',
            lastName: 'Student',
            role: 'STUDENT',
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
        if ('createUser' in userService && typeof userService.createUser === 'function') {
            student = await userService.createUser(studentData);
        }
        else {
            student = { id: 'student-analytics-test-id', ...studentData };
        }
        testStudentId = student.id;
        testStudentToken = jsonwebtoken_1.default.sign({
            userId: student.id,
            schoolId: testSchoolId,
            role: 'STUDENT',
            parentId: testParentId
        }, TEST_CONFIG.jwtSecret, { expiresIn: '24h' });
        const menuItems = [
            {
                name: 'Analytics Test Meal',
                description: 'Meal for analytics-driven payment testing',
                price: 12000,
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
                price: 20000,
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
                price: 8000,
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
            if ('createMenuItem' in menuItemService && typeof menuItemService.createMenuItem === 'function') {
                menuItem = await menuItemService.createMenuItem(item);
            }
            else {
                menuItem = { id: `menu-${(0, uuid_1.v4)()}`, ...item };
            }
            testMenuItemIds.push(menuItem.id);
        }
        performanceMetrics = {
            analyticsProcessingTime: [],
            insightGenerationTime: [],
            recommendationApplicationTime: [],
            paymentOptimizationTime: []
        };
        console.log(`✅ Analytics to Payment Test Environment Ready`);
        console.log(`📊 School: ${testSchoolId}, Menu Items: ${testMenuItemIds.length}`);
    }
    catch (error) {
        console.error('❌ Failed to initialize test environment:', error);
        throw error;
    }
}, 60000);
(0, globals_1.afterAll)(async () => {
    console.log('🧹 Cleaning up Analytics to Payment Workflows Test Environment...');
    try {
        await cleanupTestData();
        await prisma.$disconnect();
        console.log('✅ Analytics to Payment cleanup completed successfully');
    }
    catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}, 30000);
async function cleanupTestData() {
    try {
        if ('paymentRefund' in prisma) {
            await prisma.paymentRefund.deleteMany({});
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
    }
    catch (error) {
        console.warn('⚠️ Cleanup warning (non-critical):', error);
    }
}
async function apiRequest(method, endpoint, data, token) {
    const url = `${TEST_CONFIG.apiBaseUrl}${endpoint}`;
    const startTime = Date.now();
    const fetchOptions = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : undefined,
            'X-School-ID': testSchoolId,
            'X-Request-ID': (0, uuid_1.v4)()
        },
        timeout: TEST_CONFIG.timeoutMs
    };
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(data);
    }
    const response = await (0, node_fetch_1.default)(url, fetchOptions);
    const responseTime = Date.now() - startTime;
    let responseData;
    try {
        responseData = await response.json();
    }
    catch (parseError) {
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
async function seedHistoricalData() {
    const historicalOrders = [];
    const historicalPayments = [];
    for (let i = 0; i < 30; i++) {
        const orderDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
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
                await apiRequest('POST', `/payments/${paymentResponse.data.paymentId}/confirm`, {
                    paymentId: paymentResponse.data.paymentId,
                    status: 'completed',
                    transactionId: `txn_hist_${i}_${j}_${(0, uuid_1.v4)()}`
                });
                historicalOrders.push(orderResponse.data.id);
                historicalPayments.push(paymentResponse.data.paymentId);
            }
            catch (error) {
                console.warn(`⚠️ Failed to create historical data ${i}-${j}:`, error.message);
            }
        }
    }
    console.log(`📊 Seeded ${historicalOrders.length} historical orders and ${historicalPayments.length} payments`);
}
(0, globals_1.describe)('Analytics to Payment Workflows Integration Tests', () => {
    console.log(`📈 Testing analytics-driven payment workflows across multiple epics`);
    (0, globals_1.beforeEach)(async () => {
        await cleanupTestData();
    });
    (0, globals_1.test)('should use predictive analytics to optimize payment timing and methods', async () => {
        console.log('🔮 Testing predictive analytics for payment optimization...');
        const flowStartTime = Date.now();
        await seedHistoricalData();
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
        (0, globals_1.expect)(analyticsResponse.status).toBe(200);
        (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('insights');
        (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('predictions');
        const analyticsProcessingTime = Date.now() - analyticsStartTime;
        performanceMetrics.analyticsProcessingTime.push(analyticsProcessingTime);
        console.log(`📊 Payment behavior analytics generated (${analyticsProcessingTime}ms)`);
        const insightStartTime = Date.now();
        const insightsResponse = await apiRequest('GET', `/analytics/payments/insights/${testParentId}`, undefined, testParentToken);
        (0, globals_1.expect)(insightsResponse.status).toBe(200);
        (0, globals_1.expect)(insightsResponse.data).toHaveProperty('optimalPaymentTimes');
        (0, globals_1.expect)(insightsResponse.data).toHaveProperty('recommendedMethods');
        (0, globals_1.expect)(insightsResponse.data).toHaveProperty('riskFactors');
        const insightGenerationTime = Date.now() - insightStartTime;
        performanceMetrics.insightGenerationTime.push(insightGenerationTime);
        console.log(`💡 Payment insights generated (${insightGenerationTime}ms)`);
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
        (0, globals_1.expect)(orderResponse.status).toBe(201);
        const testOrderId = orderResponse.data.id;
        console.log(`📦 Analytics-optimized order created: ${testOrderId}`);
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
        (0, globals_1.expect)(paymentResponse.status).toBe(200);
        const testPaymentId = paymentResponse.data.paymentId;
        const completionResponse = await apiRequest('POST', `/payments/${testPaymentId}/confirm`, {
            paymentId: testPaymentId,
            status: 'completed',
            transactionId: `txn_analytics_${(0, uuid_1.v4)()}`,
            analyticsValidation: {
                timingOptimal: true,
                riskAcceptable: true,
                predictionAccurate: true
            }
        }, testParentToken);
        (0, globals_1.expect)(completionResponse.status).toBe(200);
        const paymentOptimizationTime = Date.now() - optimizationStartTime;
        performanceMetrics.paymentOptimizationTime.push(paymentOptimizationTime);
        console.log(`✅ Analytics-optimized payment completed (${paymentOptimizationTime}ms)`);
        const feedbackResponse = await apiRequest('POST', '/analytics/payments/feedback', {
            paymentId: testPaymentId,
            orderId: testOrderId,
            userId: testParentId,
            analyticsAccuracy: {
                timingPrediction: 0.95,
                methodRecommendation: 0.90,
                riskAssessment: 0.85
            },
            outcome: 'success',
            processingTime: paymentOptimizationTime
        }, testParentToken);
        (0, globals_1.expect)(feedbackResponse.status).toBe(200);
        console.log(`🔄 Analytics feedback loop completed`);
        const totalFlowTime = Date.now() - flowStartTime;
        console.log(`🎉 Complete analytics-to-payment optimization flow completed in ${totalFlowTime}ms`);
    });
    (0, globals_1.test)('should use churn prevention analytics to drive payment recovery', async () => {
        console.log('🚨 Testing churn prevention analytics for payment recovery...');
        const decliningPayments = [];
        for (let i = 0; i < 5; i++) {
            const orderData = {
                studentId: testStudentId,
                schoolId: testSchoolId,
                items: [{
                        menuItemId: testMenuItemIds[i % testMenuItemIds.length],
                        quantity: 1
                    }],
                deliveryDate: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                deliveryTimeSlot: '12:00-13:00',
                paymentMethod: 'razorpay'
            };
            const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
            const paymentAmount = orderResponse.data.totalAmount * (1 - i * 0.1);
            const shouldFail = i >= 3;
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
                await apiRequest('POST', `/payments/${paymentResponse.data.paymentId}/confirm`, {
                    paymentId: paymentResponse.data.paymentId,
                    status: 'completed',
                    transactionId: `txn_decline_success_${i}_${(0, uuid_1.v4)()}`
                });
            }
            else {
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
        (0, globals_1.expect)(churnAnalyticsResponse.status).toBe(200);
        (0, globals_1.expect)(churnAnalyticsResponse.data).toHaveProperty('churnRisk');
        (0, globals_1.expect)(churnAnalyticsResponse.data.churnRisk.score).toBeGreaterThan(0.7);
        (0, globals_1.expect)(churnAnalyticsResponse.data).toHaveProperty('interventions');
        console.log(`⚠️ Churn risk detected: ${Math.round(churnAnalyticsResponse.data.churnRisk.score * 100)}%`);
        const recoveryRecommendations = churnAnalyticsResponse.data.interventions.recommendedActions;
        (0, globals_1.expect)(recoveryRecommendations.length).toBeGreaterThan(0);
        const recoveryStrategy = recoveryRecommendations[0];
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
        (0, globals_1.expect)(recoveryResponse.status).toBe(200);
        console.log(`🛟 Applied churn prevention recovery strategy`);
        const recoveryOrderData = {
            studentId: testStudentId,
            schoolId: testSchoolId,
            items: [
                {
                    menuItemId: testMenuItemIds[1],
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
        const discountedAmount = recoveryOrderResponse.data.totalAmount;
        const originalAmount = 20000;
        const expectedDiscount = Math.round(originalAmount * 0.15);
        (0, globals_1.expect)(discountedAmount).toBe(originalAmount - expectedDiscount);
        console.log(`💸 Recovery discount applied: ₹${expectedDiscount} off`);
        const improvedPaymentMethodData = {
            type: 'card',
            card: {
                number: '4111111111111111',
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
        await apiRequest('POST', `/payments/${recoveryPaymentId}/confirm`, {
            paymentId: recoveryPaymentId,
            status: 'completed',
            transactionId: `txn_recovery_${(0, uuid_1.v4)()}`
        }, testParentToken);
        const finalOrderResponse = await apiRequest('GET', `/orders/${recoveryOrderId}`, undefined, testParentToken);
        (0, globals_1.expect)(finalOrderResponse.data.status).toBe('confirmed');
        const recoveryUpdateResponse = await apiRequest('POST', '/analytics/churn/recovery/success', {
            userId: testParentId,
            recoveryPaymentId,
            strategy: recoveryStrategy.type,
            discountUsed: expectedDiscount,
            outcome: 'successful_recovery'
        }, testParentToken);
        (0, globals_1.expect)(recoveryUpdateResponse.status).toBe(200);
        console.log(`✅ Churn prevention recovery successful`);
    });
    (0, globals_1.test)('should use revenue optimization analytics to drive payment strategies', async () => {
        console.log('💰 Testing revenue optimization analytics for payment strategies...');
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
            await apiRequest('POST', `/payments/${paymentResponse.data.paymentId}/confirm`, {
                paymentId: paymentResponse.data.paymentId,
                status: 'completed',
                transactionId: `txn_opt_${i}_${(0, uuid_1.v4)()}`
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
        (0, globals_1.expect)(optimizationAnalyticsResponse.status).toBe(200);
        (0, globals_1.expect)(optimizationAnalyticsResponse.data).toHaveProperty('recommendations');
        (0, globals_1.expect)(optimizationAnalyticsResponse.data).toHaveProperty('predictedRevenue');
        (0, globals_1.expect)(optimizationAnalyticsResponse.data).toHaveProperty('optimizationStrategies');
        console.log(`📈 Revenue optimization analytics generated`);
        const topStrategy = optimizationAnalyticsResponse.data.optimizationStrategies[0];
        const applicationStartTime = Date.now();
        const optimizedOrderData = {
            studentId: testStudentId,
            schoolId: testSchoolId,
            items: [
                {
                    menuItemId: testMenuItemIds[1],
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
        await apiRequest('POST', `/payments/${optimizedPaymentId}/confirm`, {
            paymentId: optimizedPaymentId,
            status: 'completed',
            transactionId: `txn_optimized_${(0, uuid_1.v4)()}`
        }, testParentToken);
        const recommendationApplicationTime = Date.now() - applicationStartTime;
        performanceMetrics.recommendationApplicationTime.push(recommendationApplicationTime);
        console.log(`✅ Revenue optimization strategy applied (${recommendationApplicationTime}ms)`);
        const finalOptimizedOrderResponse = await apiRequest('GET', `/orders/${optimizedOrderId}`, undefined, testParentToken);
        (0, globals_1.expect)(finalOptimizedOrderResponse.data.status).toBe('confirmed');
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
        (0, globals_1.expect)(optimizationResultsResponse.status).toBe(200);
        console.log(`📊 Optimization results recorded for continuous learning`);
    });
    (0, globals_1.afterEach)(async () => {
        await cleanupTestData();
    });
});
//# sourceMappingURL=analytics-to-payment-workflows.spec.js.map