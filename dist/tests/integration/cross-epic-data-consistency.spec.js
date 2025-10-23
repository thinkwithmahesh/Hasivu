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
    console.log('🚀 Initializing Cross-Epic Data Consistency Test Environment...');
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
        if ('createSchool' in userService && typeof userService.createSchool === 'function') {
            school = await userService.createSchool(schoolData);
        }
        else {
            school = { id: 'school-consistency-test-id', ...schoolData };
        }
        testSchoolId = school.id;
        const parentData = {
            email: 'parent@consistency-test.com',
            password: 'SecurePassword123!',
            firstName: 'Consistency',
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
            parent = { id: 'parent-consistency-test-id', ...parentData };
        }
        testParentId = parent.id;
        testParentToken = jsonwebtoken_1.default.sign({
            userId: parent.id,
            schoolId: testSchoolId,
            role: 'PARENT'
        }, TEST_CONFIG.jwtSecret, { expiresIn: '24h' });
        const studentData = {
            email: 'student@consistency-test.com',
            password: 'SecurePassword123!',
            firstName: 'Consistency',
            lastName: 'Student',
            role: 'STUDENT',
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
        if ('createUser' in userService && typeof userService.createUser === 'function') {
            student = await userService.createUser(studentData);
        }
        else {
            student = { id: 'student-consistency-test-id', ...studentData };
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
                name: 'Consistency Test Meal',
                description: 'Meal for data consistency testing',
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
                name: 'Consistency Test Drink',
                description: 'Drink for data consistency testing',
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
            consistencyCheckTime: [],
            synchronizationTime: [],
            dataValidationTime: []
        };
        console.log(`✅ Cross-Epic Data Consistency Test Environment Ready`);
        console.log(`📊 School: ${testSchoolId}, Menu Items: ${testMenuItemIds.length}`);
    }
    catch (error) {
        console.error('❌ Failed to initialize test environment:', error);
        throw error;
    }
}, 60000);
(0, globals_1.afterAll)(async () => {
    console.log('🧹 Cleaning up Cross-Epic Data Consistency Test Environment...');
    try {
        await cleanupTestData();
        await prisma.$disconnect();
        console.log('✅ Cross-Epic Data Consistency cleanup completed successfully');
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
(0, globals_1.describe)('Cross-Epic Data Consistency Integration Tests', () => {
    console.log(`🔗 Testing data consistency across all epics`);
    (0, globals_1.beforeEach)(async () => {
        await cleanupTestData();
    });
    (0, globals_1.test)('should maintain data consistency across complete order-to-payment transaction', async () => {
        console.log('🔄 Testing complete transaction data consistency...');
        const consistencyStartTime = Date.now();
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
                testId: (0, uuid_1.v4)()
            }
        };
        const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
        (0, globals_1.expect)(orderResponse.status).toBe(201);
        const orderId = orderResponse.data.id;
        testOrderIds = [orderId];
        console.log(`📦 Order created: ${orderId}`);
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
        (0, globals_1.expect)(paymentResponse.status).toBe(200);
        const { paymentId } = paymentResponse.data;
        testPaymentIds = [paymentId];
        const completionData = {
            paymentId,
            status: 'completed',
            transactionId: `txn_consistency_${(0, uuid_1.v4)()}`,
            gatewayResponse: {
                razorpay_payment_id: `pay_${(0, uuid_1.v4)()}`,
                razorpay_order_id: `order_${(0, uuid_1.v4)()}`,
                razorpay_signature: 'consistency_signature'
            }
        };
        const completionResponse = await apiRequest('POST', `/payments/${paymentId}/confirm`, completionData, testParentToken);
        (0, globals_1.expect)(completionResponse.status).toBe(200);
        console.log(`✅ Payment completed: ${paymentId}`);
        const validationStartTime = Date.now();
        const orderValidationResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
        (0, globals_1.expect)(orderValidationResponse.data.status).toBe('confirmed');
        (0, globals_1.expect)(orderValidationResponse.data.totalAmount).toBe(orderResponse.data.totalAmount);
        (0, globals_1.expect)(orderValidationResponse.data.studentId).toBe(testStudentId);
        (0, globals_1.expect)(orderValidationResponse.data.items.length).toBe(2);
        const paymentValidationResponse = await apiRequest('GET', `/payments/${paymentId}`, undefined, testParentToken);
        (0, globals_1.expect)(paymentValidationResponse.data.status).toBe('completed');
        (0, globals_1.expect)(paymentValidationResponse.data.amount).toBe(orderResponse.data.totalAmount);
        (0, globals_1.expect)(paymentValidationResponse.data.orderId).toBe(orderId);
        (0, globals_1.expect)(paymentValidationResponse.data.userId).toBe(testParentId);
        const userValidationResponse = await apiRequest('GET', `/users/${testParentId}`, undefined, testParentToken);
        (0, globals_1.expect)(userValidationResponse.data.id).toBe(testParentId);
        (0, globals_1.expect)(userValidationResponse.data.role).toBe('PARENT');
        const studentValidationResponse = await apiRequest('GET', `/users/${testStudentId}`, undefined, testStudentToken);
        (0, globals_1.expect)(studentValidationResponse.data.id).toBe(testStudentId);
        (0, globals_1.expect)(studentValidationResponse.data.role).toBe('STUDENT');
        (0, globals_1.expect)(studentValidationResponse.data.profile.parentId).toBe(testParentId);
        (0, globals_1.expect)(orderValidationResponse.data.studentId).toBe(studentValidationResponse.data.id);
        (0, globals_1.expect)(paymentValidationResponse.data.userId).toBe(userValidationResponse.data.id);
        (0, globals_1.expect)(orderValidationResponse.data.id).toBe(paymentValidationResponse.data.orderId);
        const dataValidationTime = Date.now() - validationStartTime;
        performanceMetrics.dataValidationTime.push(dataValidationTime);
        console.log(`✅ Data consistency validated (${dataValidationTime}ms)`);
        const analyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
        (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('totalOrders', 1);
        (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('totalPayments', 1);
        (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('totalSpent', orderResponse.data.totalAmount);
        const auditResponse = await apiRequest('GET', '/audit/transactions', {
            entityId: orderId,
            entityType: 'order'
        }, testParentToken);
        (0, globals_1.expect)(auditResponse.data.events.length).toBeGreaterThan(0);
        const orderCreatedEvent = auditResponse.data.events.find((e) => e.action === 'order.created');
        const paymentCompletedEvent = auditResponse.data.events.find((e) => e.action === 'payment.completed');
        (0, globals_1.expect)(orderCreatedEvent).toBeDefined();
        (0, globals_1.expect)(paymentCompletedEvent).toBeDefined();
        (0, globals_1.expect)(orderCreatedEvent.entityId).toBe(orderId);
        (0, globals_1.expect)(paymentCompletedEvent.entityId).toBe(paymentId);
        const consistencyCheckTime = Date.now() - consistencyStartTime;
        performanceMetrics.consistencyCheckTime.push(consistencyCheckTime);
        console.log(`🔗 Complete transaction data consistency verified (${consistencyCheckTime}ms)`);
    });
    (0, globals_1.test)('should maintain data consistency under concurrent transactions', async () => {
        console.log('⚡ Testing data consistency under concurrent transactions...');
        const concurrentTransactions = 5;
        const transactionPromises = [];
        for (let i = 0; i < concurrentTransactions; i++) {
            const transactionPromise = (async () => {
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
                const paymentData = {
                    orderId,
                    amount: orderResponse.data.totalAmount,
                    currency: 'INR',
                    paymentMethodId,
                    description: `Concurrent test payment ${i}`
                };
                const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);
                const { paymentId } = paymentResponse.data;
                await apiRequest('POST', `/payments/${paymentId}/confirm`, {
                    paymentId,
                    status: 'completed',
                    transactionId: `txn_concurrent_${i}_${(0, uuid_1.v4)()}`
                }, testParentToken);
                return { orderId, paymentId, amount: orderResponse.data.totalAmount };
            })();
            transactionPromises.push(transactionPromise);
        }
        const concurrentStartTime = Date.now();
        const transactionResults = await Promise.allSettled(transactionPromises);
        const concurrentProcessingTime = Date.now() - concurrentStartTime;
        const successfulTransactions = transactionResults.filter(r => r.status === 'fulfilled').length;
        (0, globals_1.expect)(successfulTransactions).toBe(concurrentTransactions);
        const transactionData = transactionResults
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
        console.log(`✅ ${successfulTransactions} concurrent transactions completed in ${concurrentProcessingTime}ms`);
        const consistencyValidationPromises = transactionData.map(async (transaction, index) => {
            const orderResponse = await apiRequest('GET', `/orders/${transaction.orderId}`, undefined, testParentToken);
            (0, globals_1.expect)(orderResponse.data.status).toBe('confirmed');
            (0, globals_1.expect)(orderResponse.data.totalAmount).toBe(transaction.amount);
            const paymentResponse = await apiRequest('GET', `/payments/${transaction.paymentId}`, undefined, testParentToken);
            (0, globals_1.expect)(paymentResponse.data.status).toBe('completed');
            (0, globals_1.expect)(paymentResponse.data.amount).toBe(transaction.amount);
            (0, globals_1.expect)(paymentResponse.data.orderId).toBe(transaction.orderId);
            return { orderId: transaction.orderId, paymentId: transaction.paymentId, consistent: true };
        });
        const consistencyResults = await Promise.allSettled(consistencyValidationPromises);
        const consistentTransactions = consistencyResults.filter(r => r.status === 'fulfilled').length;
        (0, globals_1.expect)(consistentTransactions).toBe(concurrentTransactions);
        console.log(`🔗 Data consistency maintained across ${consistentTransactions} concurrent transactions`);
        const userSummaryResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
        (0, globals_1.expect)(userSummaryResponse.data.totalOrders).toBe(concurrentTransactions);
        (0, globals_1.expect)(userSummaryResponse.data.totalPayments).toBe(concurrentTransactions);
        const totalSpent = transactionData.reduce((sum, t) => sum + t.amount, 0);
        (0, globals_1.expect)(userSummaryResponse.data.totalSpent).toBe(totalSpent);
        console.log(`📊 Aggregate data consistency verified: ${concurrentTransactions} orders, ₹${totalSpent / 100} total spent`);
    });
    (0, globals_1.test)('should synchronize data changes across all related services', async () => {
        console.log('🔄 Testing data synchronization across services...');
        const syncStartTime = Date.now();
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
        const { paymentId } = paymentResponse.data;
        await apiRequest('POST', `/payments/${paymentId}/confirm`, {
            paymentId,
            status: 'completed',
            transactionId: `txn_sync_${(0, uuid_1.v4)()}`
        }, testParentToken);
        console.log(`📦 Initial transaction created: ${orderId} -> ${paymentId}`);
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
        (0, globals_1.expect)(modifyResponse.status).toBe(200);
        const newAmount = modifyResponse.data.totalAmount;
        const additionalAmount = newAmount - orderResponse.data.totalAmount;
        console.log(`✏️ Order modified, additional amount: ₹${additionalAmount / 100}`);
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
            transactionId: `txn_additional_${(0, uuid_1.v4)()}`
        }, testParentToken);
        console.log(`💰 Additional payment processed: ${additionalPaymentId}`);
        const synchronizationTime = Date.now() - syncStartTime;
        const updatedOrderResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
        (0, globals_1.expect)(updatedOrderResponse.data.totalAmount).toBe(newAmount);
        (0, globals_1.expect)(updatedOrderResponse.data.items.length).toBe(2);
        (0, globals_1.expect)(updatedOrderResponse.data.status).toBe('confirmed');
        const allPaymentsResponse = await apiRequest('GET', '/payments', {
            orderId
        }, testParentToken);
        (0, globals_1.expect)(allPaymentsResponse.data.length).toBe(2);
        const totalPaid = allPaymentsResponse.data.reduce((sum, p) => sum + p.amount, 0);
        (0, globals_1.expect)(totalPaid).toBe(newAmount);
        const analyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
        (0, globals_1.expect)(analyticsResponse.data.totalOrders).toBe(1);
        (0, globals_1.expect)(analyticsResponse.data.totalPayments).toBe(2);
        (0, globals_1.expect)(analyticsResponse.data.totalSpent).toBe(newAmount);
        const notificationsResponse = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'payment_confirmation'
        }, testParentToken);
        (0, globals_1.expect)(notificationsResponse.data.length).toBeGreaterThan(0);
        const auditResponse = await apiRequest('GET', '/audit/transactions', {
            entityId: orderId,
            entityType: 'order'
        }, testParentToken);
        const orderEvents = auditResponse.data.events.filter((e) => e.entityId === orderId);
        const paymentEvents = auditResponse.data.events.filter((e) => e.entityType === 'payment' && e.metadata?.orderId === orderId);
        (0, globals_1.expect)(orderEvents.length).toBeGreaterThan(1);
        (0, globals_1.expect)(paymentEvents.length).toBe(2);
        performanceMetrics.synchronizationTime.push(synchronizationTime);
        console.log(`🔄 Data synchronization completed across all services (${synchronizationTime}ms)`);
    });
    (0, globals_1.test)('should maintain data integrity when services fail or rollback', async () => {
        console.log('🛡️ Testing data integrity under failure conditions...');
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
            failureReason: 'card_declined'
        }, testParentToken);
        const { paymentId } = paymentResponse.data;
        await apiRequest('POST', `/payments/${paymentId}/fail`, {
            paymentId,
            status: 'failed',
            error: { code: 'CARD_DECLINED', message: 'Your card was declined' }
        }, testParentToken);
        console.log(`❌ Payment failed as expected: ${paymentId}`);
        const orderAfterFailureResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
        (0, globals_1.expect)(orderAfterFailureResponse.data.status).toBe('pending');
        (0, globals_1.expect)(orderAfterFailureResponse.data.id).toBe(orderId);
        const paymentAfterFailureResponse = await apiRequest('GET', `/payments/${paymentId}`, undefined, testParentToken);
        (0, globals_1.expect)(paymentAfterFailureResponse.data.status).toBe('failed');
        (0, globals_1.expect)(paymentAfterFailureResponse.data.id).toBe(paymentId);
        const analyticsAfterFailureResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
        (0, globals_1.expect)(analyticsAfterFailureResponse.data.totalOrders).toBe(1);
        (0, globals_1.expect)(analyticsAfterFailureResponse.data.totalPayments).toBe(0);
        (0, globals_1.expect)(analyticsAfterFailureResponse.data.totalSpent).toBe(0);
        console.log(`🛡️ Data integrity maintained after payment failure`);
        const newPaymentMethodResponse = await apiRequest('POST', '/payments/methods', {
            type: 'card',
            card: {
                number: '4111111111111111',
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
            transactionId: `txn_recovery_${(0, uuid_1.v4)()}`
        }, testParentToken);
        const orderAfterRecoveryResponse = await apiRequest('GET', `/orders/${orderId}`, undefined, testParentToken);
        (0, globals_1.expect)(orderAfterRecoveryResponse.data.status).toBe('confirmed');
        const analyticsAfterRecoveryResponse = await apiRequest('GET', `/analytics/users/${testParentId}/summary`, undefined, testParentToken);
        (0, globals_1.expect)(analyticsAfterRecoveryResponse.data.totalOrders).toBe(1);
        (0, globals_1.expect)(analyticsAfterRecoveryResponse.data.totalPayments).toBe(1);
        (0, globals_1.expect)(analyticsAfterRecoveryResponse.data.totalSpent).toBe(orderResponse.data.totalAmount);
        const auditResponse = await apiRequest('GET', '/audit/transactions', {
            entityId: orderId,
            entityType: 'order'
        }, testParentToken);
        const paymentEvents = auditResponse.data.events.filter((e) => e.entityType === 'payment');
        (0, globals_1.expect)(paymentEvents.length).toBe(2);
        const failedPaymentEvent = paymentEvents.find((e) => e.action === 'payment.failed');
        const successfulPaymentEvent = paymentEvents.find((e) => e.action === 'payment.completed');
        (0, globals_1.expect)(failedPaymentEvent).toBeDefined();
        (0, globals_1.expect)(successfulPaymentEvent).toBeDefined();
        console.log(`✅ Data integrity maintained through failure and recovery`);
    });
    (0, globals_1.afterEach)(async () => {
        await cleanupTestData();
    });
});
//# sourceMappingURL=cross-epic-data-consistency.spec.js.map