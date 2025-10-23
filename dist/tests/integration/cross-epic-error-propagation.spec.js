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
    console.log('🚀 Initializing Cross-Epic Error Propagation Test Environment...');
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
            name: 'Test Error Propagation School',
            address: '123 Error Test Lane',
            city: 'TestCity',
            state: 'TestState',
            pincode: '123456',
            phone: '+91-9876543210',
            email: 'error-test@school.com',
            principalName: 'Error Test Principal',
            principalEmail: 'principal@error-test.com',
            settings: {
                timezone: 'Asia/Kolkata',
                currency: 'INR',
                errorHandling: {
                    enabled: true,
                    propagateErrors: true,
                    retryMechanisms: true,
                    fallbackServices: true
                }
            }
        };
        let school;
        if ('createSchool' in userService && typeof userService.createSchool === 'function') {
            school = await userService.createSchool(schoolData);
        }
        else {
            school = { id: 'school-error-test-id', ...schoolData };
        }
        testSchoolId = school.id;
        const parentData = {
            email: 'parent@error-test.com',
            password: 'SecurePassword123!',
            firstName: 'Error',
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
            parent = { id: 'parent-error-test-id', ...parentData };
        }
        testParentId = parent.id;
        testParentToken = jsonwebtoken_1.default.sign({
            userId: parent.id,
            schoolId: testSchoolId,
            role: 'PARENT'
        }, TEST_CONFIG.jwtSecret, { expiresIn: '24h' });
        const studentData = {
            email: 'student@error-test.com',
            password: 'SecurePassword123!',
            firstName: 'Error',
            lastName: 'Student',
            role: 'STUDENT',
            schoolId: testSchoolId,
            phone: '+91-9876543215',
            profile: {
                class: '10th Grade',
                section: 'A',
                rollNumber: 'ET001',
                parentId: testParentId
            }
        };
        let student;
        if ('createUser' in userService && typeof userService.createUser === 'function') {
            student = await userService.createUser(studentData);
        }
        else {
            student = { id: 'student-error-test-id', ...studentData };
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
                name: 'Error Test Meal',
                description: 'Meal for error propagation testing',
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
                name: 'Error Test Drink',
                description: 'Drink for error propagation testing',
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
            errorPropagationTime: [],
            errorRecoveryTime: [],
            errorHandlingTime: []
        };
        console.log(`✅ Cross-Epic Error Propagation Test Environment Ready`);
        console.log(`📊 School: ${testSchoolId}, Menu Items: ${testMenuItemIds.length}`);
    }
    catch (error) {
        console.error('❌ Failed to initialize test environment:', error);
        throw error;
    }
}, 60000);
(0, globals_1.afterAll)(async () => {
    console.log('🧹 Cleaning up Cross-Epic Error Propagation Test Environment...');
    try {
        await cleanupTestData();
        await prisma.$disconnect();
        console.log('✅ Cross-Epic Error Propagation cleanup completed successfully');
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
(0, globals_1.describe)('Cross-Epic Error Propagation Integration Tests', () => {
    console.log(`🚨 Testing error propagation across all epics`);
    (0, globals_1.beforeEach)(async () => {
        await cleanupTestData();
    });
    (0, globals_1.test)('should propagate payment failures across order, notification, and analytics services', async () => {
        console.log('💸 Testing payment failure error propagation...');
        const errorStartTime = Date.now();
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
        console.log(`📦 Order created: ${orderId}`);
        const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
            type: 'card',
            card: {
                number: '4000000000000002',
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
            failureReason: 'insufficient_funds'
        }, testParentToken);
        const { paymentId } = paymentResponse.data;
        const failureResponse = await apiRequest('POST', `/payments/${paymentId}/fail`, {
            paymentId,
            status: 'failed',
            error: {
                code: 'PAYMENT_FAILED',
                message: 'Insufficient funds',
                gatewayError: 'insufficient_funds'
            }
        }, testParentToken);
        (0, globals_1.expect)(failureResponse.status).toBe(200);
        const errorPropagationTime = Date.now() - errorStartTime;
        performanceMetrics.errorPropagationTime.push(errorPropagationTime);
        console.log(`❌ Payment failed, error propagation initiated (${errorPropagationTime}ms)`);
        const orderAfterFailureResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
        (0, globals_1.expect)(orderAfterFailureResponse.data.status).toBe('payment_pending');
        (0, globals_1.expect)(orderAfterFailureResponse.data).toHaveProperty('lastPaymentError');
        (0, globals_1.expect)(orderAfterFailureResponse.data.lastPaymentError.code).toBe('PAYMENT_FAILED');
        console.log(`📋 Order service updated with payment failure status`);
        const failureNotificationsResponse = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'payment_failed'
        }, testParentToken);
        (0, globals_1.expect)(failureNotificationsResponse.data.length).toBeGreaterThan(0);
        const failureNotification = failureNotificationsResponse.data.find((n) => n.data?.orderId === orderId && n.type === 'payment_failed');
        (0, globals_1.expect)(failureNotification).toBeDefined();
        (0, globals_1.expect)(failureNotification.data).toHaveProperty('error');
        (0, globals_1.expect)(failureNotification.data.error.code).toBe('PAYMENT_FAILED');
        console.log(`📧 Notification service sent payment failure notifications`);
        const analyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
        (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('paymentFailures');
        (0, globals_1.expect)(analyticsResponse.data.paymentFailures.count).toBeGreaterThan(0);
        (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('lastPaymentError');
        (0, globals_1.expect)(analyticsResponse.data.lastPaymentError.code).toBe('PAYMENT_FAILED');
        const paymentAnalyticsResponse = await apiRequest('GET', '/analytics/payments/summary', {
            userId: testParentId,
            timeframe: 'all_time'
        }, testParentToken);
        (0, globals_1.expect)(paymentAnalyticsResponse.data).toHaveProperty('failureRate');
        (0, globals_1.expect)(paymentAnalyticsResponse.data.failureRate).toBeGreaterThan(0);
        (0, globals_1.expect)(paymentAnalyticsResponse.data).toHaveProperty('lastFailure');
        (0, globals_1.expect)(paymentAnalyticsResponse.data.lastFailure.errorCode).toBe('PAYMENT_FAILED');
        console.log(`📊 Analytics service recorded payment failure metrics`);
        const auditResponse = await apiRequest('GET', '/audit/transactions', {
            entityId: orderId,
            entityType: 'order'
        }, testParentToken);
        const errorEvents = auditResponse.data.events.filter((e) => e.action === 'payment.failed' || e.action === 'error.propagated');
        (0, globals_1.expect)(errorEvents.length).toBeGreaterThan(0);
        const paymentFailureEvent = errorEvents.find((e) => e.action === 'payment.failed');
        (0, globals_1.expect)(paymentFailureEvent).toBeDefined();
        (0, globals_1.expect)(paymentFailureEvent.metadata.errorCode).toBe('PAYMENT_FAILED');
        console.log(`📋 Audit trail recorded error propagation events`);
    });
    (0, globals_1.test)('should handle and propagate service unavailability errors', async () => {
        console.log('🔌 Testing service unavailability error propagation...');
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
        const paymentResponse = await apiRequest('POST', '/payments/process', {
            orderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: 'pm_test_card',
            simulateServiceUnavailable: true
        }, testParentToken);
        (0, globals_1.expect)(paymentResponse.status).toBe(503);
        (0, globals_1.expect)(paymentResponse.data).toHaveProperty('error');
        (0, globals_1.expect)(paymentResponse.data.error.code).toBe('SERVICE_UNAVAILABLE');
        console.log(`🔌 Payment service unavailable error received`);
        const orderAfterErrorResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
        (0, globals_1.expect)(orderAfterErrorResponse.data).toHaveProperty('serviceErrors');
        (0, globals_1.expect)(orderAfterErrorResponse.data.serviceErrors.length).toBeGreaterThan(0);
        const paymentServiceError = orderAfterErrorResponse.data.serviceErrors.find((e) => e.service === 'payment' && e.code === 'SERVICE_UNAVAILABLE');
        (0, globals_1.expect)(paymentServiceError).toBeDefined();
        console.log(`📋 Order service recorded service unavailability error`);
        const errorNotificationsResponse = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'service_error'
        }, testParentToken);
        (0, globals_1.expect)(errorNotificationsResponse.data.length).toBeGreaterThan(0);
        const serviceErrorNotification = errorNotificationsResponse.data.find((n) => n.data?.service === 'payment' && n.data?.errorCode === 'SERVICE_UNAVAILABLE');
        (0, globals_1.expect)(serviceErrorNotification).toBeDefined();
        console.log(`📧 Notification service sent service error notifications`);
        const analyticsResponse = await apiRequest('GET', `/analytics/system/health`, undefined, testParentToken);
        (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('serviceErrors');
        (0, globals_1.expect)(analyticsResponse.data.serviceErrors).toHaveProperty('payment');
        (0, globals_1.expect)(analyticsResponse.data.serviceErrors.payment.unavailableCount).toBeGreaterThan(0);
        console.log(`📊 Analytics service recorded service health issues`);
        const recoveryStartTime = Date.now();
        const retryPaymentResponse = await apiRequest('POST', '/payments/process', {
            orderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: 'pm_test_card',
            description: 'Retry after service recovery'
        }, testParentToken);
        (0, globals_1.expect)(retryPaymentResponse.status).toBe(200);
        const retryPaymentId = retryPaymentResponse.data.paymentId;
        await apiRequest('POST', `/payments/${retryPaymentId}/confirm`, {
            paymentId: retryPaymentId,
            status: 'completed',
            transactionId: `txn_recovery_${(0, uuid_1.v4)()}`
        }, testParentToken);
        const errorRecoveryTime = Date.now() - recoveryStartTime;
        performanceMetrics.errorRecoveryTime.push(errorRecoveryTime);
        const orderAfterRecoveryResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
        (0, globals_1.expect)(orderAfterRecoveryResponse.data.status).toBe('confirmed');
        const recoveryNotificationsResponse = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'service_recovery'
        }, testParentToken);
        (0, globals_1.expect)(recoveryNotificationsResponse.data.length).toBeGreaterThan(0);
        console.log(`🔄 Service recovery successful, error propagation reversed (${errorRecoveryTime}ms)`);
    });
    (0, globals_1.test)('should handle cascading errors across dependent services', async () => {
        console.log('🔗 Testing cascading error propagation...');
        const cascadeStartTime = Date.now();
        const orders = [];
        for (let i = 0; i < 3; i++) {
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
            orders.push({
                id: orderResponse.data.id,
                amount: orderResponse.data.totalAmount
            });
        }
        console.log(`📦 Created ${orders.length} dependent orders`);
        const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
            type: 'card',
            card: {
                number: '4111111111111111',
                expiryMonth: 12,
                expiryYear: 2026,
                cvv: '123',
                holderName: 'Cascade Test Parent'
            },
            isDefault: true
        }, testParentToken);
        const paymentMethodId = paymentMethodResponse.data.id;
        const bulkPaymentData = {
            orders: orders.map(order => ({
                orderId: order.id,
                amount: order.amount,
                currency: 'INR'
            })),
            paymentMethodId,
            description: `Bulk payment for ${orders.length} orders`,
            simulatePartialFailure: true,
            failurePattern: [false, true, false]
        };
        const bulkPaymentResponse = await apiRequest('POST', '/payments/process/bulk', bulkPaymentData, testParentToken);
        (0, globals_1.expect)(bulkPaymentResponse.status).toBe(207);
        (0, globals_1.expect)(bulkPaymentResponse.data).toHaveProperty('results');
        (0, globals_1.expect)(bulkPaymentResponse.data.results.length).toBe(3);
        const successfulPayments = bulkPaymentResponse.data.results.filter((r) => r.success).length;
        const failedPayments = bulkPaymentResponse.data.results.filter((r) => !r.success).length;
        (0, globals_1.expect)(successfulPayments).toBe(2);
        (0, globals_1.expect)(failedPayments).toBe(1);
        console.log(`⚖️ Bulk payment partially failed: ${successfulPayments} success, ${failedPayments} failed`);
        const errorHandlingStartTime = Date.now();
        for (let i = 0; i < orders.length; i++) {
            const orderResponse = await apiRequest('GET', `/orders/${orders[i].id}`, undefined, testParentToken);
            const expectedStatus = bulkPaymentResponse.data.results[i].success ? 'confirmed' : 'payment_pending';
            (0, globals_1.expect)(orderResponse.data.status).toBe(expectedStatus);
            if (!bulkPaymentResponse.data.results[i].success) {
                (0, globals_1.expect)(orderResponse.data).toHaveProperty('lastPaymentError');
            }
        }
        console.log(`📋 Order statuses updated to reflect payment results`);
        const notificationsResponse = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            limit: 20
        }, testParentToken);
        const successNotifications = notificationsResponse.data.filter((n) => n.type === 'payment_confirmation');
        const failureNotifications = notificationsResponse.data.filter((n) => n.type === 'payment_failed');
        (0, globals_1.expect)(successNotifications.length).toBe(2);
        (0, globals_1.expect)(failureNotifications.length).toBe(1);
        console.log(`📧 Notifications sent: ${successNotifications.length} confirmations, ${failureNotifications.length} failures`);
        const analyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
        (0, globals_1.expect)(analyticsResponse.data.totalOrders).toBe(3);
        (0, globals_1.expect)(analyticsResponse.data.totalPayments).toBe(2);
        (0, globals_1.expect)(analyticsResponse.data.paymentFailures.count).toBe(1);
        console.log(`📊 Analytics updated with partial success metrics`);
        const failedOrderIndex = bulkPaymentResponse.data.results.findIndex((r) => !r.success);
        const failedOrder = orders[failedOrderIndex];
        const retryPaymentResponse = await apiRequest('POST', '/payments/process', {
            orderId: failedOrder.id,
            amount: failedOrder.amount,
            currency: 'INR',
            paymentMethodId,
            description: 'Retry failed payment'
        }, testParentToken);
        const retryPaymentId = retryPaymentResponse.data.paymentId;
        await apiRequest('POST', `/payments/${retryPaymentId}/confirm`, {
            paymentId: retryPaymentId,
            status: 'completed',
            transactionId: `txn_retry_cascade_${(0, uuid_1.v4)()}`
        }, testParentToken);
        const errorHandlingTime = Date.now() - errorHandlingStartTime;
        performanceMetrics.errorHandlingTime.push(errorHandlingTime);
        const recoveredOrderResponse = await apiRequest('GET', `/orders/${failedOrder.id}`, undefined, testParentToken);
        (0, globals_1.expect)(recoveredOrderResponse.data.status).toBe('confirmed');
        const finalAnalyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
        (0, globals_1.expect)(finalAnalyticsResponse.data.totalPayments).toBe(3);
        (0, globals_1.expect)(finalAnalyticsResponse.data.paymentFailures.count).toBe(0);
        console.log(`✅ Cascading error recovery completed (${errorHandlingTime}ms)`);
        const totalCascadeTime = Date.now() - cascadeStartTime;
        console.log(`🔗 Complete cascading error propagation test completed in ${totalCascadeTime}ms`);
    });
    (0, globals_1.test)('should propagate timeout and circuit breaker errors across services', async () => {
        console.log('⏱️ Testing timeout and circuit breaker error propagation...');
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
        const timeoutPaymentResponse = await apiRequest('POST', '/payments/process', {
            orderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: 'pm_test_card',
            simulateTimeout: true,
            timeoutDuration: 35000
        }, testParentToken);
        (0, globals_1.expect)(timeoutPaymentResponse.status).toBe(504);
        (0, globals_1.expect)(timeoutPaymentResponse.data).toHaveProperty('error');
        (0, globals_1.expect)(timeoutPaymentResponse.data.error.code).toBe('GATEWAY_TIMEOUT');
        console.log(`⏱️ Payment service timeout error received`);
        const rapidRequests = Array.from({ length: 5 }, () => apiRequest('POST', '/payments/process', {
            orderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: 'pm_test_card',
            simulateTimeout: true
        }, testParentToken));
        const rapidResponses = await Promise.allSettled(rapidRequests);
        const circuitBreakerResponses = rapidResponses.filter(r => r.status === 'fulfilled' && r.value.status === 503);
        (0, globals_1.expect)(circuitBreakerResponses.length).toBeGreaterThan(0);
        console.log(`🔌 Circuit breaker activated after multiple timeouts`);
        const circuitBreakerOrderResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
        (0, globals_1.expect)(circuitBreakerOrderResponse.data).toHaveProperty('circuitBreakerStatus');
        (0, globals_1.expect)(circuitBreakerOrderResponse.data.circuitBreakerStatus).toBe('open');
        const fallbackPaymentResponse = await apiRequest('POST', '/payments/process/fallback', {
            orderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: 'pm_fallback_card',
            description: 'Fallback payment processing'
        }, testParentToken);
        (0, globals_1.expect)(fallbackPaymentResponse.status).toBe(200);
        (0, globals_1.expect)(fallbackPaymentResponse.data).toHaveProperty('fallbackMode', true);
        const fallbackPaymentId = fallbackPaymentResponse.data.paymentId;
        await apiRequest('POST', `/payments/${fallbackPaymentId}/confirm`, {
            paymentId: fallbackPaymentId,
            status: 'completed',
            transactionId: `txn_fallback_${(0, uuid_1.v4)()}`
        }, testParentToken);
        console.log(`🔄 Fallback payment processing successful`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const recoveryPaymentResponse = await apiRequest('POST', '/payments/process', {
            orderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: 'pm_test_card',
            description: 'Test circuit breaker recovery'
        }, testParentToken);
        (0, globals_1.expect)(recoveryPaymentResponse.status).toBe(200);
        console.log(`🔧 Circuit breaker recovered, normal service resumed`);
        const errorAnalyticsResponse = await apiRequest('GET', '/analytics/system/errors', {
            timeframe: 'last_hour'
        }, testParentToken);
        (0, globals_1.expect)(errorAnalyticsResponse.data).toHaveProperty('timeouts');
        (0, globals_1.expect)(errorAnalyticsResponse.data).toHaveProperty('circuitBreakerActivations');
        (0, globals_1.expect)(errorAnalyticsResponse.data).toHaveProperty('fallbackActivations');
        (0, globals_1.expect)(errorAnalyticsResponse.data.timeouts.count).toBeGreaterThan(0);
        (0, globals_1.expect)(errorAnalyticsResponse.data.circuitBreakerActivations.count).toBeGreaterThan(0);
        (0, globals_1.expect)(errorAnalyticsResponse.data.fallbackActivations.count).toBeGreaterThan(0);
        console.log(`📊 Comprehensive error analytics recorded`);
    });
    (0, globals_1.afterEach)(async () => {
        await cleanupTestData();
    });
});
//# sourceMappingURL=cross-epic-error-propagation.spec.js.map