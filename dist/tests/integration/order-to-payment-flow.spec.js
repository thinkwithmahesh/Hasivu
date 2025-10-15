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
const order_service_1 = require("../../src/services/order.service");
const payment_service_1 = require("../../src/services/payment.service");
const notification_service_1 = require("../../src/services/notification.service");
const user_service_1 = require("../../src/services/user.service");
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
let orderService;
let paymentService;
let notificationService;
let userService;
let testSchoolId;
let testParentId;
let testStudentId;
let testParentToken;
let testStudentToken;
let testOrderId;
let testPaymentId;
let testMenuItemIds;
let performanceMetrics;
(0, globals_1.beforeAll)(async () => {
    console.log('🚀 Initializing Order-to-Payment Flow Test Environment...');
    try {
        prisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: TEST_CONFIG.databaseUrl
                }
            },
            log: ['error', 'warn']
        });
        orderService = order_service_1.OrderService.getInstance();
        paymentService = new payment_service_1.PaymentService();
        notificationService = notification_service_1.NotificationService.getInstance();
        userService = new user_service_1.UserService();
        await cleanupTestData();
        const schoolData = {
            name: 'Test Order School',
            address: '123 Order Test Lane',
            city: 'TestCity',
            state: 'TestState',
            pincode: '123456',
            phone: '+91-9876543210',
            email: 'order-test@school.com',
            principalName: 'Order Test Principal',
            principalEmail: 'principal@order-test.com',
            settings: {
                timezone: 'Asia/Kolkata',
                currency: 'INR'
            }
        };
        let school;
        if ('createSchool' in userService && typeof userService.createSchool === 'function') {
            school = await userService.createSchool(schoolData);
        }
        else {
            school = { id: 'school-order-test-id', ...schoolData };
        }
        testSchoolId = school.id;
        const parentData = {
            email: 'parent@order-test.com',
            password: 'SecurePassword123!',
            firstName: 'Test',
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
            parent = { id: 'parent-order-test-id', ...parentData };
        }
        testParentId = parent.id;
        testParentToken = jsonwebtoken_1.default.sign({
            userId: parent.id,
            schoolId: testSchoolId,
            role: 'PARENT'
        }, TEST_CONFIG.jwtSecret, { expiresIn: '24h' });
        const studentData = {
            email: 'student@order-test.com',
            password: 'SecurePassword123!',
            firstName: 'Test',
            lastName: 'Student',
            role: 'STUDENT',
            schoolId: testSchoolId,
            phone: '+91-9876543215',
            profile: {
                class: '10th Grade',
                section: 'A',
                rollNumber: 'OS001',
                parentId: testParentId
            }
        };
        let student;
        if ('createUser' in userService && typeof userService.createUser === 'function') {
            student = await userService.createUser(studentData);
        }
        else {
            student = { id: 'student-order-test-id', ...studentData };
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
                name: 'Chicken Biryani',
                description: 'Aromatic basmati rice with tender chicken',
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
                name: 'Vegetable Pulao',
                description: 'Fragrant rice with mixed vegetables',
                price: 8000,
                category: 'Main Course',
                nutritionalInfo: {
                    calories: 300,
                    protein: 8,
                    carbs: 55,
                    fat: 8
                },
                isAvailable: true,
                schoolId: testSchoolId
            },
            {
                name: 'Mango Lassi',
                description: 'Sweet yogurt drink with mango',
                price: 4000,
                category: 'Beverage',
                nutritionalInfo: {
                    calories: 180,
                    protein: 6,
                    carbs: 25,
                    fat: 5
                },
                isAvailable: true,
                schoolId: testSchoolId
            }
        ];
        testMenuItemIds = [];
        for (const item of menuItems) {
            let menuItem;
            try {
                menuItem = await menuItem_service_1.MenuItemService.createMenuItem(item);
            }
            catch (error) {
                menuItem = { id: `menu-${(0, uuid_1.v4)()}`, ...item };
            }
            testMenuItemIds.push(menuItem.id);
        }
        performanceMetrics = {
            orderCreationTime: [],
            paymentProcessingTime: [],
            notificationDeliveryTime: []
        };
        console.log(`✅ Order-to-Payment Test Environment Ready`);
        console.log(`📊 School: ${testSchoolId}, Parent: ${testParentId}, Student: ${testStudentId}`);
        console.log(`🍽️ Menu Items: ${testMenuItemIds.length}`);
    }
    catch (error) {
        console.error('❌ Failed to initialize test environment:', error);
        throw error;
    }
}, 60000);
(0, globals_1.afterAll)(async () => {
    console.log('🧹 Cleaning up Order-to-Payment Flow Test Environment...');
    try {
        await cleanupTestData();
        await prisma.$disconnect();
        console.log('✅ Order-to-Payment cleanup completed successfully');
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
            'Authorization': `Bearer ${token || testParentToken}`,
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
(0, globals_1.describe)('Order to Payment Flow Integration Tests', () => {
    console.log(`🍽️ Testing complete order-to-payment workflow across multiple epics`);
    (0, globals_1.beforeEach)(async () => {
        await cleanupTestData();
    });
    (0, globals_1.test)('should complete full order-to-payment flow successfully', async () => {
        console.log('🛒 Testing complete order-to-payment flow...');
        const startTime = Date.now();
        const orderData = {
            studentId: testStudentId,
            schoolId: testSchoolId,
            items: [
                {
                    menuItemId: testMenuItemIds[0],
                    quantity: 1,
                    specialInstructions: 'Extra spicy'
                },
                {
                    menuItemId: testMenuItemIds[1],
                    quantity: 1,
                    specialInstructions: 'No onions'
                },
                {
                    menuItemId: testMenuItemIds[2],
                    quantity: 2,
                    specialInstructions: 'Extra sweet'
                }
            ],
            deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            deliveryTimeSlot: '12:00-13:00',
            paymentMethod: 'razorpay',
            notes: 'Please pack carefully'
        };
        const orderResponse = await apiRequest('POST', '/orders', orderData);
        (0, globals_1.expect)(orderResponse.status).toBe(201);
        (0, globals_1.expect)(orderResponse.data).toHaveProperty('id');
        (0, globals_1.expect)(orderResponse.data).toHaveProperty('orderNumber');
        (0, globals_1.expect)(orderResponse.data).toHaveProperty('status', 'pending');
        (0, globals_1.expect)(orderResponse.data).toHaveProperty('totalAmount');
        testOrderId = orderResponse.data.id;
        const orderCreationTime = Date.now() - startTime;
        performanceMetrics.orderCreationTime.push(orderCreationTime);
        (0, globals_1.expect)(orderResponse.data.items).toHaveLength(3);
        (0, globals_1.expect)(orderResponse.data.totalAmount).toBe(12000 + 8000 + 4000 * 2);
        console.log(`📦 Order created: ${testOrderId} (${orderCreationTime}ms)`);
        const paymentStartTime = Date.now();
        const paymentData = {
            orderId: testOrderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: 'pm_test_card',
            description: `Payment for Order ${orderResponse.data.orderNumber}`,
            metadata: {
                orderId: testOrderId,
                studentId: testStudentId,
                schoolId: testSchoolId
            }
        };
        const paymentResponse = await apiRequest('POST', '/payments/process', paymentData);
        (0, globals_1.expect)(paymentResponse.status).toBe(200);
        (0, globals_1.expect)(paymentResponse.data).toHaveProperty('paymentId');
        (0, globals_1.expect)(paymentResponse.data).toHaveProperty('status', 'processing');
        testPaymentId = paymentResponse.data.paymentId;
        const paymentProcessingTime = Date.now() - paymentStartTime;
        performanceMetrics.paymentProcessingTime.push(paymentProcessingTime);
        console.log(`💳 Payment initiated: ${testPaymentId} (${paymentProcessingTime}ms)`);
        const paymentCompletionData = {
            paymentId: testPaymentId,
            status: 'completed',
            transactionId: `txn_${(0, uuid_1.v4)()}`,
            gatewayResponse: {
                razorpay_payment_id: `pay_${(0, uuid_1.v4)()}`,
                razorpay_order_id: `order_${(0, uuid_1.v4)()}`,
                razorpay_signature: 'test_signature'
            }
        };
        const completionResponse = await apiRequest('POST', `/payments/${testPaymentId}/confirm`, paymentCompletionData);
        (0, globals_1.expect)(completionResponse.status).toBe(200);
        (0, globals_1.expect)(completionResponse.data.status).toBe('completed');
        const orderStatusResponse = await apiRequest('GET', `/orders/${testOrderId}`);
        (0, globals_1.expect)(orderStatusResponse.status).toBe(200);
        (0, globals_1.expect)(orderStatusResponse.data.status).toBe('confirmed');
        console.log(`✅ Order confirmed after payment: ${testOrderId}`);
        const notificationStartTime = Date.now();
        const notificationsResponse = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'order_confirmation'
        });
        (0, globals_1.expect)(notificationsResponse.status).toBe(200);
        (0, globals_1.expect)(notificationsResponse.data.length).toBeGreaterThan(0);
        const orderNotification = notificationsResponse.data.find((n) => n.data?.orderId === testOrderId);
        (0, globals_1.expect)(orderNotification).toBeDefined();
        (0, globals_1.expect)(orderNotification.type).toBe('order_confirmation');
        (0, globals_1.expect)(orderNotification.data.orderId).toBe(testOrderId);
        const notificationDeliveryTime = Date.now() - notificationStartTime;
        performanceMetrics.notificationDeliveryTime.push(notificationDeliveryTime);
        console.log(`📧 Notifications sent (${notificationDeliveryTime}ms)`);
        const auditResponse = await apiRequest('GET', '/audit/orders', {
            entityId: testOrderId,
            entityType: 'order'
        });
        (0, globals_1.expect)(auditResponse.status).toBe(200);
        (0, globals_1.expect)(auditResponse.data.events).toContainEqual(globals_1.expect.objectContaining({
            action: 'order.created'
        }));
        (0, globals_1.expect)(auditResponse.data.events).toContainEqual(globals_1.expect.objectContaining({
            action: 'payment.completed'
        }));
        console.log(`📋 Audit trail verified for order: ${testOrderId}`);
        const trackingResponse = await apiRequest('GET', `/orders/${testOrderId}/tracking`);
        (0, globals_1.expect)(trackingResponse.status).toBe(200);
        (0, globals_1.expect)(trackingResponse.data).toHaveProperty('status', 'confirmed');
        (0, globals_1.expect)(trackingResponse.data).toHaveProperty('paymentStatus', 'completed');
        (0, globals_1.expect)(trackingResponse.data).toHaveProperty('estimatedDelivery');
        console.log(`🚚 Order tracking verified`);
        const totalFlowTime = Date.now() - startTime;
        console.log(`🎉 Complete order-to-payment flow completed in ${totalFlowTime}ms`);
    });
    (0, globals_1.test)('should handle payment failure and trigger recovery flow', async () => {
        console.log('❌ Testing payment failure and recovery...');
        const orderData = {
            studentId: testStudentId,
            schoolId: testSchoolId,
            items: [
                {
                    menuItemId: testMenuItemIds[0],
                    quantity: 1
                }
            ],
            deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            deliveryTimeSlot: '12:00-13:00',
            paymentMethod: 'razorpay'
        };
        const orderResponse = await apiRequest('POST', '/orders', orderData);
        testOrderId = orderResponse.data.id;
        const paymentData = {
            orderId: testOrderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: 'pm_failed_card',
            description: `Payment for Order ${orderResponse.data.orderNumber}`,
            simulateFailure: true,
            failureReason: 'insufficient_funds'
        };
        const paymentResponse = await apiRequest('POST', '/payments/process', paymentData);
        (0, globals_1.expect)(paymentResponse.status).toBe(200);
        testPaymentId = paymentResponse.data.paymentId;
        const failureData = {
            paymentId: testPaymentId,
            status: 'failed',
            error: {
                code: 'PAYMENT_FAILED',
                message: 'Insufficient funds',
                gatewayError: 'insufficient_funds'
            }
        };
        const failureResponse = await apiRequest('POST', `/payments/${testPaymentId}/fail`, failureData);
        (0, globals_1.expect)(failureResponse.status).toBe(200);
        const orderStatusResponse = await apiRequest('GET', `/orders/${testOrderId}`);
        (0, globals_1.expect)(orderStatusResponse.data.status).toBe('payment_pending');
        const failureNotifications = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'payment_failed'
        });
        (0, globals_1.expect)(failureNotifications.data.length).toBeGreaterThan(0);
        const failureNotification = failureNotifications.data.find((n) => n.data?.orderId === testOrderId);
        (0, globals_1.expect)(failureNotification).toBeDefined();
        console.log(`💸 Payment failure handled and notifications sent`);
        const retryData = {
            paymentId: testPaymentId,
            newPaymentMethodId: 'pm_retry_card',
            retryReason: 'User requested retry'
        };
        const retryResponse = await apiRequest('POST', `/payments/${testPaymentId}/retry`, retryData);
        (0, globals_1.expect)(retryResponse.status).toBe(200);
        const retrySuccessData = {
            paymentId: testPaymentId,
            status: 'completed',
            transactionId: `txn_retry_${(0, uuid_1.v4)()}`
        };
        const retrySuccessResponse = await apiRequest('POST', `/payments/${testPaymentId}/confirm`, retrySuccessData);
        (0, globals_1.expect)(retrySuccessResponse.status).toBe(200);
        const finalOrderStatus = await apiRequest('GET', `/orders/${testOrderId}`);
        (0, globals_1.expect)(finalOrderStatus.data.status).toBe('confirmed');
        console.log(`🔄 Payment retry successful, order confirmed`);
    });
    (0, globals_1.test)('should handle order modifications with payment adjustments', async () => {
        console.log('✏️ Testing order modifications with payment adjustments...');
        const initialOrderData = {
            studentId: testStudentId,
            schoolId: testSchoolId,
            items: [
                {
                    menuItemId: testMenuItemIds[0],
                    quantity: 1
                }
            ],
            deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            deliveryTimeSlot: '12:00-13:00',
            paymentMethod: 'razorpay'
        };
        const orderResponse = await apiRequest('POST', '/orders', initialOrderData);
        testOrderId = orderResponse.data.id;
        const initialAmount = orderResponse.data.totalAmount;
        const paymentResponse = await apiRequest('POST', '/payments/process', {
            orderId: testOrderId,
            amount: initialAmount,
            currency: 'INR',
            paymentMethodId: 'pm_test_card'
        });
        testPaymentId = paymentResponse.data.paymentId;
        await apiRequest('POST', `/payments/${testPaymentId}/confirm`, {
            paymentId: testPaymentId,
            status: 'completed',
            transactionId: `txn_${(0, uuid_1.v4)()}`
        });
        const modificationData = {
            items: [
                {
                    menuItemId: testMenuItemIds[0],
                    quantity: 1
                },
                {
                    menuItemId: testMenuItemIds[2],
                    quantity: 1
                }
            ]
        };
        const modifyResponse = await apiRequest('PUT', `/orders/${testOrderId}`, modificationData);
        (0, globals_1.expect)(modifyResponse.status).toBe(200);
        const newAmount = modifyResponse.data.totalAmount;
        (0, globals_1.expect)(newAmount).toBe(initialAmount + 4000);
        const additionalPaymentData = {
            orderId: testOrderId,
            amount: 4000,
            currency: 'INR',
            paymentMethodId: 'pm_test_card',
            description: `Additional payment for order modification`,
            metadata: {
                originalPaymentId: testPaymentId,
                modificationType: 'item_added'
            }
        };
        const additionalPaymentResponse = await apiRequest('POST', '/payments/process', additionalPaymentData);
        const additionalPaymentId = additionalPaymentResponse.data.paymentId;
        await apiRequest('POST', `/payments/${additionalPaymentId}/confirm`, {
            paymentId: additionalPaymentId,
            status: 'completed',
            transactionId: `txn_add_${(0, uuid_1.v4)()}`
        });
        const finalOrderResponse = await apiRequest('GET', `/orders/${testOrderId}`);
        (0, globals_1.expect)(finalOrderResponse.data.status).toBe('confirmed');
        (0, globals_1.expect)(finalOrderResponse.data.totalAmount).toBe(newAmount);
        console.log(`💰 Order modification with payment adjustment completed`);
    });
    (0, globals_1.test)('should handle bulk order processing with payment batching', async () => {
        console.log('📦 Testing bulk order processing...');
        const bulkOrders = [];
        const orderIds = [];
        for (let i = 0; i < 5; i++) {
            const orderData = {
                studentId: testStudentId,
                schoolId: testSchoolId,
                items: [
                    {
                        menuItemId: testMenuItemIds[i % testMenuItemIds.length],
                        quantity: 1
                    }
                ],
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                deliveryTimeSlot: '12:00-13:00',
                paymentMethod: 'razorpay'
            };
            const orderResponse = await apiRequest('POST', '/orders', orderData);
            orderIds.push(orderResponse.data.id);
            bulkOrders.push({
                orderId: orderResponse.data.id,
                amount: orderResponse.data.totalAmount,
                currency: 'INR'
            });
        }
        const bulkPaymentData = {
            orders: bulkOrders,
            paymentMethodId: 'pm_bulk_card',
            description: `Bulk payment for ${bulkOrders.length} orders`,
            batchMetadata: {
                batchId: `batch_${(0, uuid_1.v4)()}`,
                orderCount: bulkOrders.length,
                totalAmount: bulkOrders.reduce((sum, order) => sum + order.amount, 0)
            }
        };
        const bulkPaymentResponse = await apiRequest('POST', '/payments/bulk/process', bulkPaymentData);
        (0, globals_1.expect)(bulkPaymentResponse.status).toBe(200);
        (0, globals_1.expect)(bulkPaymentResponse.data).toHaveProperty('batchId');
        (0, globals_1.expect)(bulkPaymentResponse.data.processedOrders).toHaveLength(5);
        for (const orderId of orderIds) {
            const orderResponse = await apiRequest('GET', `/orders/${orderId}`);
            (0, globals_1.expect)(orderResponse.data.status).toBe('confirmed');
        }
        console.log(`✅ Bulk order processing completed for ${orderIds.length} orders`);
    });
    (0, globals_1.test)('should maintain performance under concurrent order-payment load', async () => {
        console.log('⚡ Testing performance under concurrent load...');
        const concurrentOrders = 10;
        const orderPromises = [];
        for (let i = 0; i < concurrentOrders; i++) {
            const orderData = {
                studentId: testStudentId,
                schoolId: testSchoolId,
                items: [
                    {
                        menuItemId: testMenuItemIds[0],
                        quantity: 1
                    }
                ],
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                deliveryTimeSlot: '12:00-13:00',
                paymentMethod: 'razorpay'
            };
            orderPromises.push(apiRequest('POST', '/orders', orderData));
        }
        const startTime = Date.now();
        const orderResults = await Promise.allSettled(orderPromises);
        const orderProcessingTime = Date.now() - startTime;
        const successfulOrders = orderResults.filter(r => r.status === 'fulfilled').length;
        (0, globals_1.expect)(successfulOrders).toBeGreaterThanOrEqual(concurrentOrders * 0.9);
        console.log(`📊 Concurrent order creation: ${successfulOrders}/${concurrentOrders} successful in ${orderProcessingTime}ms`);
        const successfulOrderResults = orderResults
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
        const paymentPromises = successfulOrderResults.map(orderResult => {
            const paymentData = {
                orderId: orderResult.data.id,
                amount: orderResult.data.totalAmount,
                currency: 'INR',
                paymentMethodId: 'pm_load_test_card'
            };
            return apiRequest('POST', '/payments/process', paymentData);
        });
        const paymentStartTime = Date.now();
        const paymentResults = await Promise.allSettled(paymentPromises);
        const paymentProcessingTime = Date.now() - paymentStartTime;
        const successfulPayments = paymentResults.filter(r => r.status === 'fulfilled').length;
        (0, globals_1.expect)(successfulPayments).toBeGreaterThanOrEqual(successfulOrders * 0.9);
        console.log(`💳 Concurrent payment processing: ${successfulPayments}/${successfulOrders} successful in ${paymentProcessingTime}ms`);
        const avgOrderTime = orderProcessingTime / concurrentOrders;
        const avgPaymentTime = paymentProcessingTime / successfulPayments;
        (0, globals_1.expect)(avgOrderTime).toBeLessThan(5000);
        (0, globals_1.expect)(avgPaymentTime).toBeLessThan(3000);
        console.log(`📈 Performance metrics - Avg order time: ${avgOrderTime}ms, Avg payment time: ${avgPaymentTime}ms`);
    });
    (0, globals_1.afterEach)(async () => {
        await cleanupTestData();
    });
});
//# sourceMappingURL=order-to-payment-flow.spec.js.map