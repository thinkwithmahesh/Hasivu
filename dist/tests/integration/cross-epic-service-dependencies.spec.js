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
const user_service_1 = require("../../src/services/user.service");
const order_service_1 = require("../../src/services/order.service");
const payment_service_1 = require("../../src/services/payment.service");
const notification_service_1 = require("../../src/services/notification.service");
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
let userService;
let orderService;
let paymentService;
let notificationService;
let menuItemService;
let testSchoolId;
let testParentId;
let testStudentId;
let testParentToken;
let testStudentToken;
let testOrderIds;
let testPaymentIds;
let testMenuItemIds;
let performanceMetrics;
(0, globals_1.beforeAll)(async () => {
    console.log('🚀 Initializing Cross-Epic Service Dependencies Test Environment...');
    try {
        prisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: TEST_CONFIG.databaseUrl
                }
            },
            log: ['error', 'warn']
        });
        userService = user_service_1.UserService.getInstance();
        orderService = order_service_1.OrderService.getInstance();
        paymentService = payment_service_1.PaymentService.getInstance();
        notificationService = notification_service_1.NotificationService.getInstance();
        menuItemService = menuItem_service_1.MenuItemService.getInstance();
        await cleanupTestData();
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
        if ('createSchool' in userService && typeof userService.createSchool === 'function') {
            school = await userService.createSchool(schoolData);
        }
        else {
            school = { id: 'school-dependencies-test-id', ...schoolData };
        }
        testSchoolId = school.id;
        const parentData = {
            email: 'parent@dependencies-test.com',
            password: 'SecurePassword123!',
            firstName: 'Dependencies',
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
            parent = { id: 'parent-dependencies-test-id', ...parentData };
        }
        testParentId = parent.id;
        testParentToken = jsonwebtoken_1.default.sign({
            userId: parent.id,
            schoolId: testSchoolId,
            role: 'PARENT'
        }, TEST_CONFIG.jwtSecret, { expiresIn: '24h' });
        const studentData = {
            email: 'student@dependencies-test.com',
            password: 'SecurePassword123!',
            firstName: 'Dependencies',
            lastName: 'Student',
            role: 'STUDENT',
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
        if ('createUser' in userService && typeof userService.createUser === 'function') {
            student = await userService.createUser(studentData);
        }
        else {
            student = { id: 'student-dependencies-test-id', ...studentData };
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
                name: 'Dependencies Test Meal',
                description: 'Meal for service dependencies testing',
                price: 12000,
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
                price: 4000,
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
            if ('createMenuItem' in menuItemService && typeof menuItemService.createMenuItem === 'function') {
                menuItem = await menuItemService.createMenuItem(item);
            }
            else {
                menuItem = { id: `menu-${(0, uuid_1.v4)()}`, ...item };
            }
            testMenuItemIds.push(menuItem.id);
        }
        performanceMetrics = {
            dependencyCheckTime: [],
            serviceHealthTime: [],
            dependencyChainTime: []
        };
        console.log(`✅ Cross-Epic Service Dependencies Test Environment Ready`);
        console.log(`📊 School: ${testSchoolId}, Menu Items: ${testMenuItemIds.length}`);
    }
    catch (error) {
        console.error('❌ Failed to initialize test environment:', error);
        throw error;
    }
}, 60000);
(0, globals_1.afterAll)(async () => {
    console.log('🧹 Cleaning up Cross-Epic Service Dependencies Test Environment...');
    try {
        await cleanupTestData();
        await prisma.$disconnect();
        console.log('✅ Cross-Epic Service Dependencies cleanup completed successfully');
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
    return {
        status: response.status,
        data: responseData,
        responseTime,
        headers: Object.fromEntries(response.headers.entries())
    };
}
(0, globals_1.describe)('Cross-Epic Service Dependencies Integration Tests', () => {
    console.log(`🔗 Testing service dependencies across all epics`);
    (0, globals_1.beforeEach)(async () => {
        await cleanupTestData();
    });
    (0, globals_1.test)('should map and validate service dependencies across epics', async () => {
        console.log('🗺️ Testing service dependency mapping...');
        const dependencyStartTime = Date.now();
        const dependencyMapResponse = await apiRequest('GET', '/system/dependencies', undefined, testParentToken);
        (0, globals_1.expect)(dependencyMapResponse.status).toBe(200);
        (0, globals_1.expect)(dependencyMapResponse.data).toHaveProperty('services');
        (0, globals_1.expect)(dependencyMapResponse.data).toHaveProperty('dependencies');
        const { services } = dependencyMapResponse.data;
        const { dependencies } = dependencyMapResponse.data;
        (0, globals_1.expect)(services).toContain('user-service');
        (0, globals_1.expect)(services).toContain('order-service');
        (0, globals_1.expect)(services).toContain('payment-service');
        (0, globals_1.expect)(services).toContain('notification-service');
        (0, globals_1.expect)(services).toContain('analytics-service');
        console.log(`📋 Service dependency map contains ${services.length} services`);
        (0, globals_1.expect)(dependencies['order-service']).toContain('user-service');
        (0, globals_1.expect)(dependencies['payment-service']).toContain('order-service');
        (0, globals_1.expect)(dependencies['payment-service']).toContain('user-service');
        (0, globals_1.expect)(dependencies['notification-service']).toContain('user-service');
        (0, globals_1.expect)(dependencies['notification-service']).toContain('order-service');
        (0, globals_1.expect)(dependencies['notification-service']).toContain('payment-service');
        (0, globals_1.expect)(dependencies['analytics-service']).toContain('user-service');
        (0, globals_1.expect)(dependencies['analytics-service']).toContain('order-service');
        (0, globals_1.expect)(dependencies['analytics-service']).toContain('payment-service');
        (0, globals_1.expect)(dependencies['analytics-service']).toContain('notification-service');
        console.log(`🔗 Service dependency relationships validated`);
        const healthCheckResponse = await apiRequest('GET', '/system/health/dependencies', undefined, testParentToken);
        (0, globals_1.expect)(healthCheckResponse.status).toBe(200);
        (0, globals_1.expect)(healthCheckResponse.data).toHaveProperty('services');
        Object.values(healthCheckResponse.data.services).forEach((service) => {
            (0, globals_1.expect)(service.status).toBe('healthy');
        });
        console.log(`💚 All service dependencies healthy`);
        const circularDependencyResponse = await apiRequest('GET', '/system/dependencies/circular', undefined, testParentToken);
        (0, globals_1.expect)(circularDependencyResponse.status).toBe(200);
        (0, globals_1.expect)(circularDependencyResponse.data).toHaveProperty('hasCircularDependencies', false);
        console.log(`🔄 No circular dependencies detected`);
        const dependencyCheckTime = Date.now() - dependencyStartTime;
        performanceMetrics.dependencyCheckTime.push(dependencyCheckTime);
        console.log(`🗺️ Service dependency mapping completed (${dependencyCheckTime}ms)`);
    });
    (0, globals_1.test)('should execute complete service dependency chain for order-to-payment flow', async () => {
        console.log('⛓️ Testing service dependency chain execution...');
        const chainStartTime = Date.now();
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
        (0, globals_1.expect)(orderResponse.status).toBe(201);
        const orderId = orderResponse.data.id;
        console.log(`📦 Order created via dependency chain: ${orderId}`);
        const orderDetailsResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
        (0, globals_1.expect)(orderDetailsResponse.data).toHaveProperty('userId', testParentId);
        (0, globals_1.expect)(orderDetailsResponse.data).toHaveProperty('studentId', testStudentId);
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
        const paymentResponse = await apiRequest('POST', '/payments/process', {
            orderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId,
            description: `Dependency chain payment for Order ${orderResponse.data.orderNumber}`
        }, testParentToken);
        (0, globals_1.expect)(paymentResponse.status).toBe(200);
        const { paymentId } = paymentResponse.data;
        console.log(`💰 Payment processed via dependency chain: ${paymentId}`);
        await apiRequest('POST', `/payments/${paymentId}/confirm`, {
            paymentId,
            status: 'completed',
            transactionId: `txn_chain_${(0, uuid_1.v4)()}`
        }, testParentToken);
        console.log(`✅ Payment completed, triggering dependent services`);
        const notificationsResponse = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'payment_confirmation'
        }, testParentToken);
        (0, globals_1.expect)(notificationsResponse.data.length).toBeGreaterThan(0);
        const confirmationNotification = notificationsResponse.data.find((n) => n.data?.orderId === orderId);
        (0, globals_1.expect)(confirmationNotification).toBeDefined();
        console.log(`📧 Notification service executed via dependency chain`);
        const analyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
        (0, globals_1.expect)(analyticsResponse.data.totalOrders).toBe(1);
        (0, globals_1.expect)(analyticsResponse.data.totalPayments).toBe(1);
        (0, globals_1.expect)(analyticsResponse.data.totalSpent).toBe(orderResponse.data.totalAmount);
        console.log(`📊 Analytics service executed via dependency chain`);
        const chainExecutionResponse = await apiRequest('GET', `/system/dependencies/chain/${orderId}`, undefined, testParentToken);
        (0, globals_1.expect)(chainExecutionResponse.status).toBe(200);
        (0, globals_1.expect)(chainExecutionResponse.data).toHaveProperty('chain');
        (0, globals_1.expect)(chainExecutionResponse.data.chain.length).toBeGreaterThan(3);
        const executedServices = chainExecutionResponse.data.chain.map((c) => c.service);
        (0, globals_1.expect)(executedServices).toContain('user-service');
        (0, globals_1.expect)(executedServices).toContain('order-service');
        (0, globals_1.expect)(executedServices).toContain('payment-service');
        (0, globals_1.expect)(executedServices).toContain('notification-service');
        (0, globals_1.expect)(executedServices).toContain('analytics-service');
        const dependencyChainTime = Date.now() - chainStartTime;
        performanceMetrics.dependencyChainTime.push(dependencyChainTime);
        console.log(`⛓️ Complete service dependency chain executed (${dependencyChainTime}ms)`);
    });
    (0, globals_1.test)('should monitor service health and handle dependency failures', async () => {
        console.log('💓 Testing service health monitoring and failover...');
        const healthStartTime = Date.now();
        const initialHealthResponse = await apiRequest('GET', '/system/health/services', undefined, testParentToken);
        (0, globals_1.expect)(initialHealthResponse.status).toBe(200);
        Object.values(initialHealthResponse.data.services).forEach((service) => {
            (0, globals_1.expect)(service.status).toBe('healthy');
            (0, globals_1.expect)(service).toHaveProperty('responseTime');
            (0, globals_1.expect)(service).toHaveProperty('lastChecked');
        });
        console.log(`💚 Initial service health check passed`);
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
        const degradedPaymentResponse = await apiRequest('POST', '/payments/process', {
            orderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: 'pm_test_card',
            simulateDegradation: true,
            responseDelay: 5000
        }, testParentToken);
        (0, globals_1.expect)(degradedPaymentResponse.status).toBe(200);
        (0, globals_1.expect)(degradedPaymentResponse.data).toHaveProperty('performanceWarning', true);
        console.log(`⚠️ Payment service degradation detected and handled`);
        const degradedHealthResponse = await apiRequest('GET', '/system/health/services', undefined, testParentToken);
        (0, globals_1.expect)(degradedHealthResponse.status).toBe(200);
        const paymentServiceHealth = Object.values(degradedHealthResponse.data.services)
            .find((s) => s.name === 'payment-service');
        (0, globals_1.expect)(paymentServiceHealth).toBeDefined();
        (0, globals_1.expect)(paymentServiceHealth.status).toBe('degraded');
        (0, globals_1.expect)(paymentServiceHealth.responseTime).toBeGreaterThan(4000);
        console.log(`📉 Payment service health status updated to degraded`);
        const failoverPaymentResponse = await apiRequest('POST', '/payments/process/failover', {
            orderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: 'pm_failover_card',
            reason: 'primary_service_degraded'
        }, testParentToken);
        (0, globals_1.expect)(failoverPaymentResponse.status).toBe(200);
        (0, globals_1.expect)(failoverPaymentResponse.data).toHaveProperty('failoverMode', true);
        (0, globals_1.expect)(failoverPaymentResponse.data).toHaveProperty('backupService', 'payment-service-backup');
        const failoverPaymentId = failoverPaymentResponse.data.paymentId;
        await apiRequest('POST', `/payments/${failoverPaymentId}/confirm`, {
            paymentId: failoverPaymentId,
            status: 'completed',
            transactionId: `txn_failover_${(0, uuid_1.v4)()}`
        }, testParentToken);
        console.log(`🔄 Failover payment processing successful`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const recoveryTestResponse = await apiRequest('POST', '/payments/process', {
            orderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: 'pm_recovery_test',
            description: 'Test service recovery'
        }, testParentToken);
        (0, globals_1.expect)(recoveryTestResponse.status).toBe(200);
        const recoveryHealthResponse = await apiRequest('GET', '/system/health/services', undefined, testParentToken);
        const recoveredPaymentService = Object.values(recoveryHealthResponse.data.services)
            .find((s) => s.name === 'payment-service');
        (0, globals_1.expect)(recoveredPaymentService.status).toBe('healthy');
        (0, globals_1.expect)(recoveredPaymentService.responseTime).toBeLessThan(2000);
        console.log(`💚 Payment service health recovered`);
        const failoverAnalyticsResponse = await apiRequest('GET', '/analytics/system/failover', {
            timeframe: 'last_hour'
        }, testParentToken);
        (0, globals_1.expect)(failoverAnalyticsResponse.data).toHaveProperty('failoverEvents');
        (0, globals_1.expect)(failoverAnalyticsResponse.data.failoverEvents.length).toBeGreaterThan(0);
        const paymentFailoverEvent = failoverAnalyticsResponse.data.failoverEvents
            .find((e) => e.service === 'payment-service');
        (0, globals_1.expect)(paymentFailoverEvent).toBeDefined();
        (0, globals_1.expect)(paymentFailoverEvent).toHaveProperty('success', true);
        const serviceHealthTime = Date.now() - healthStartTime;
        performanceMetrics.serviceHealthTime.push(serviceHealthTime);
        console.log(`💓 Service health monitoring and failover completed (${serviceHealthTime}ms)`);
    });
    (0, globals_1.test)('should analyze and predict service dependency impacts', async () => {
        console.log('🔍 Testing service dependency impact analysis...');
        const baselineResponse = await apiRequest('GET', '/system/dependencies/impact/baseline', undefined, testParentToken);
        (0, globals_1.expect)(baselineResponse.status).toBe(200);
        (0, globals_1.expect)(baselineResponse.data).toHaveProperty('serviceImpacts');
        console.log(`📊 Service dependency impact baseline established`);
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
        const performanceAnalysisResponse = await apiRequest('POST', '/system/dependencies/impact/analyze', {
            transactions: testTransactions,
            metrics: ['responseTime', 'successRate', 'errorRate', 'dependencyLatency']
        }, testParentToken);
        (0, globals_1.expect)(performanceAnalysisResponse.status).toBe(200);
        (0, globals_1.expect)(performanceAnalysisResponse.data).toHaveProperty('servicePerformance');
        (0, globals_1.expect)(performanceAnalysisResponse.data).toHaveProperty('dependencyChains');
        Object.values(performanceAnalysisResponse.data.servicePerformance).forEach((service) => {
            (0, globals_1.expect)(service).toHaveProperty('averageResponseTime');
            (0, globals_1.expect)(service).toHaveProperty('successRate');
            (0, globals_1.expect)(service.successRate).toBeGreaterThan(0.8);
        });
        console.log(`⚡ Service performance metrics analyzed`);
        const failurePredictionResponse = await apiRequest('POST', '/system/dependencies/impact/predict', {
            failureScenario: {
                service: 'payment-service',
                failureType: 'complete_outage',
                duration: '1_hour'
            },
            impactMetrics: ['transactionFailureRate', 'userImpact', 'revenueLoss', 'recoveryTime']
        }, testParentToken);
        (0, globals_1.expect)(failurePredictionResponse.status).toBe(200);
        (0, globals_1.expect)(failurePredictionResponse.data).toHaveProperty('predictedImpact');
        (0, globals_1.expect)(failurePredictionResponse.data.predictedImpact).toHaveProperty('transactionFailureRate');
        (0, globals_1.expect)(failurePredictionResponse.data.predictedImpact).toHaveProperty('userImpact');
        (0, globals_1.expect)(failurePredictionResponse.data.predictedImpact).toHaveProperty('revenueLoss');
        console.log(`🔮 Service failure impact predicted`);
        const optimizationResponse = await apiRequest('GET', '/system/dependencies/impact/optimize', undefined, testParentToken);
        (0, globals_1.expect)(optimizationResponse.status).toBe(200);
        (0, globals_1.expect)(optimizationResponse.data).toHaveProperty('recommendations');
        (0, globals_1.expect)(optimizationResponse.data.recommendations.length).toBeGreaterThan(0);
        const { recommendations } = optimizationResponse.data;
        const hasCachingRecommendation = recommendations.some((r) => r.type === 'caching' || r.description.toLowerCase().includes('cache'));
        const hasAsyncRecommendation = recommendations.some((r) => r.type === 'async_processing' || r.description.toLowerCase().includes('async'));
        (0, globals_1.expect)(hasCachingRecommendation || hasAsyncRecommendation).toBe(true);
        console.log(`💡 Dependency optimization recommendations generated`);
        const completenessResponse = await apiRequest('GET', '/system/dependencies/impact/completeness', undefined, testParentToken);
        (0, globals_1.expect)(completenessResponse.status).toBe(200);
        (0, globals_1.expect)(completenessResponse.data).toHaveProperty('coverage');
        (0, globals_1.expect)(completenessResponse.data.coverage.services).toBeGreaterThan(0.8);
        (0, globals_1.expect)(completenessResponse.data.coverage.dependencies).toBeGreaterThan(0.8);
        console.log(`📈 Dependency impact analysis completeness verified`);
    });
    (0, globals_1.afterEach)(async () => {
        await cleanupTestData();
    });
});
//# sourceMappingURL=cross-epic-service-dependencies.spec.js.map