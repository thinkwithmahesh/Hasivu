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
const notification_service_1 = require("../../src/services/notification.service");
const payment_service_1 = require("../../src/services/payment.service");
const user_service_1 = require("../../src/services/user.service");
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
class AnalyticsService {
    async track() { return { success: true }; }
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
let notificationService;
let paymentService;
let userService;
let orderService;
let testSchoolId;
let testParentId;
let testStudentId;
let testParentToken;
let testStudentToken;
let testPaymentMethodId;
let testOrderId;
let testPaymentId;
let testMenuItemIds;
let performanceMetrics;
(0, globals_1.beforeAll)(async () => {
    console.log('🚀 Initializing Notification to Payment Integration Test Environment...');
    try {
        prisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: TEST_CONFIG.databaseUrl
                }
            },
            log: ['error', 'warn']
        });
        notificationService = notification_service_1.NotificationService.getInstance();
        paymentService = new payment_service_1.PaymentService();
        userService = new user_service_1.UserService();
        orderService = order_service_1.OrderService.getInstance();
        await cleanupTestData();
        const schoolData = {
            name: 'Test Notification School',
            address: '123 Notification Test Lane',
            city: 'TestCity',
            state: 'TestState',
            pincode: '123456',
            phone: '+91-9876543210',
            email: 'notification-test@school.com',
            principalName: 'Notification Test Principal',
            principalEmail: 'principal@notification-test.com',
            settings: {
                timezone: 'Asia/Kolkata',
                currency: 'INR',
                notificationSettings: {
                    paymentReminders: {
                        enabled: true,
                        schedule: [7, 3, 1],
                        channels: ['email', 'sms', 'whatsapp', 'push']
                    },
                    orderConfirmations: {
                        enabled: true,
                        immediate: true
                    },
                    promotionalNotifications: {
                        enabled: true,
                        frequency: 'weekly'
                    }
                }
            }
        };
        let school;
        if ('createSchool' in userService && typeof userService.createSchool === 'function') {
            school = await userService.createSchool(schoolData);
        }
        else {
            school = { id: 'school-notification-test-id', ...schoolData };
        }
        testSchoolId = school.id;
        const parentData = {
            email: 'parent@notification-test.com',
            password: 'SecurePassword123!',
            firstName: 'Notification',
            lastName: 'Parent',
            role: 'PARENT',
            schoolId: testSchoolId,
            phone: '+91-9876543213',
            profile: {
                notificationPreferences: {
                    email: true,
                    sms: true,
                    whatsapp: true,
                    push: true,
                    paymentReminders: true,
                    orderUpdates: true,
                    promotionalContent: false
                }
            }
        };
        let parent;
        if ('createUser' in userService && typeof userService.createUser === 'function') {
            parent = await userService.createUser(parentData);
        }
        else {
            parent = { id: 'parent-notification-test-id', ...parentData };
        }
        testParentId = parent.id;
        testParentToken = jsonwebtoken_1.default.sign({
            userId: parent.id,
            schoolId: testSchoolId,
            role: 'PARENT'
        }, TEST_CONFIG.jwtSecret, { expiresIn: '24h' });
        const studentData = {
            email: 'student@notification-test.com',
            password: 'SecurePassword123!',
            firstName: 'Notification',
            lastName: 'Student',
            role: 'STUDENT',
            schoolId: testSchoolId,
            phone: '+91-9876543215',
            profile: {
                class: '10th Grade',
                section: 'A',
                rollNumber: 'NT001',
                parentId: testParentId
            }
        };
        let student;
        if ('createUser' in userService && typeof userService.createUser === 'function') {
            student = await userService.createUser(studentData);
        }
        else {
            student = { id: 'student-notification-test-id', ...studentData };
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
                name: 'Payment Reminder Special',
                description: 'Special dish for payment reminder testing',
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
                name: 'Urgent Payment Meal',
                description: 'Meal for urgent payment scenarios',
                price: 15000,
                category: 'Quick Service',
                nutritionalInfo: {
                    calories: 400,
                    protein: 20,
                    carbs: 45,
                    fat: 12
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
            notificationDeliveryTime: [],
            paymentReminderResponseTime: [],
            notificationCascadeTime: []
        };
        console.log(`✅ Notification to Payment Test Environment Ready`);
        console.log(`📊 School: ${testSchoolId}, Parent: ${testParentId}, Student: ${testStudentId}`);
    }
    catch (error) {
        console.error('❌ Failed to initialize test environment:', error);
        throw error;
    }
}, 60000);
(0, globals_1.afterAll)(async () => {
    console.log('🧹 Cleaning up Notification to Payment Integration Test Environment...');
    try {
        await cleanupTestData();
        await prisma.$disconnect();
        console.log('✅ Notification to Payment cleanup completed successfully');
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
    if (!response.ok && !endpoint.includes('/notifications/send')) {
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
    }
    return {
        status: response.status,
        data: responseData,
        responseTime,
        headers: Object.fromEntries(response.headers.entries())
    };
}
(0, globals_1.describe)('Notification to Payment Integration Tests', () => {
    console.log(`📱 Testing notification-driven payment workflows across multiple epics`);
    (0, globals_1.beforeEach)(async () => {
        await cleanupTestData();
    });
    (0, globals_1.test)('should complete payment reminder to payment completion flow', async () => {
        console.log('💰 Testing payment reminder to completion flow...');
        const flowStartTime = Date.now();
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const orderData = {
            studentId: testStudentId,
            schoolId: testSchoolId,
            items: [
                {
                    menuItemId: testMenuItemIds[0],
                    quantity: 1,
                    specialInstructions: 'Payment reminder test order'
                }
            ],
            deliveryDate: dueDate.toISOString().split('T')[0],
            deliveryTimeSlot: '12:00-13:00',
            paymentMethod: 'razorpay',
            notes: 'Test order for payment reminders'
        };
        const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
        (0, globals_1.expect)(orderResponse.status).toBe(201);
        testOrderId = orderResponse.data.id;
        console.log(`📦 Order created: ${testOrderId} with due date: ${dueDate.toISOString()}`);
        const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
            type: 'card',
            card: {
                number: '4111111111111111',
                expiryMonth: 12,
                expiryYear: 2026,
                cvv: '123',
                holderName: 'Notification Test Parent'
            },
            billingAddress: {
                line1: '123 Notification Street',
                city: 'TestCity',
                state: 'TestState',
                pincode: '123456',
                country: 'IN'
            },
            isDefault: true
        }, testParentToken);
        testPaymentMethodId = paymentMethodResponse.data.id;
        const reminderStartTime = Date.now();
        const reminderData = {
            orderId: testOrderId,
            userId: testParentId,
            reminderType: 'payment_due',
            dueDate: dueDate.toISOString(),
            amount: orderResponse.data.totalAmount,
            daysUntilDue: 7,
            channels: ['email', 'sms', 'whatsapp', 'push'],
            templateData: {
                studentName: 'Notification Student',
                orderNumber: orderResponse.data.orderNumber,
                dueDate: dueDate.toLocaleDateString(),
                amount: `₹${(orderResponse.data.totalAmount / 100).toFixed(2)}`,
                paymentLink: `https://app.hasivu.com/pay/${testOrderId}`
            }
        };
        const reminderResponse = await apiRequest('POST', '/notifications/send/payment-reminder', reminderData, testParentToken);
        (0, globals_1.expect)(reminderResponse.status).toBe(200);
        (0, globals_1.expect)(reminderResponse.data).toHaveProperty('notificationIds');
        (0, globals_1.expect)(reminderResponse.data.notificationIds.length).toBe(4);
        const notificationDeliveryTime = Date.now() - reminderStartTime;
        performanceMetrics.notificationDeliveryTime.push(notificationDeliveryTime);
        console.log(`📧 Payment reminders sent via 4 channels (${notificationDeliveryTime}ms)`);
        const notificationsResponse = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'payment_reminder',
            limit: 10
        }, testParentToken);
        (0, globals_1.expect)(notificationsResponse.data.length).toBeGreaterThan(0);
        const paymentReminder = notificationsResponse.data.find((n) => n.data?.orderId === testOrderId && n.type === 'payment_reminder');
        (0, globals_1.expect)(paymentReminder).toBeDefined();
        (0, globals_1.expect)(paymentReminder.channels).toContain('email');
        (0, globals_1.expect)(paymentReminder.channels).toContain('sms');
        (0, globals_1.expect)(paymentReminder.channels).toContain('whatsapp');
        const paymentLinkStartTime = Date.now();
        const paymentData = {
            orderId: testOrderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: testPaymentMethodId,
            description: `Payment for Order ${orderResponse.data.orderNumber}`,
            metadata: {
                orderId: testOrderId,
                studentId: testStudentId,
                triggeredBy: 'notification_reminder',
                reminderId: paymentReminder.id
            }
        };
        const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);
        (0, globals_1.expect)(paymentResponse.status).toBe(200);
        testPaymentId = paymentResponse.data.paymentId;
        const paymentCompletionData = {
            paymentId: testPaymentId,
            status: 'completed',
            transactionId: `txn_reminder_${(0, uuid_1.v4)()}`,
            gatewayResponse: {
                razorpay_payment_id: `pay_${(0, uuid_1.v4)()}`,
                razorpay_order_id: `order_${(0, uuid_1.v4)()}`,
                razorpay_signature: 'reminder_signature'
            }
        };
        const completionResponse = await apiRequest('POST', `/payments/${testPaymentId}/confirm`, paymentCompletionData, testParentToken);
        (0, globals_1.expect)(completionResponse.status).toBe(200);
        const paymentReminderResponseTime = Date.now() - paymentLinkStartTime;
        performanceMetrics.paymentReminderResponseTime.push(paymentReminderResponseTime);
        console.log(`✅ Payment completed from reminder (${paymentReminderResponseTime}ms)`);
        const orderStatusResponse = await apiRequest('GET', `/orders/${testOrderId}`, undefined, testParentToken);
        (0, globals_1.expect)(orderStatusResponse.data.status).toBe('confirmed');
        const confirmationNotifications = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'payment_confirmation'
        }, testParentToken);
        (0, globals_1.expect)(confirmationNotifications.data.length).toBeGreaterThan(0);
        const confirmationNotification = confirmationNotifications.data.find((n) => n.data?.orderId === testOrderId && n.type === 'payment_confirmation');
        (0, globals_1.expect)(confirmationNotification).toBeDefined();
        console.log(`📧 Payment confirmation notifications sent`);
        const cascadeStartTime = Date.now();
        const analyticsResponse = await apiRequest('GET', `/analytics/notifications/cascade/${testOrderId}`, undefined, testParentToken);
        (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('notificationChain');
        (0, globals_1.expect)(analyticsResponse.data.notificationChain).toHaveProperty('reminder');
        (0, globals_1.expect)(analyticsResponse.data.notificationChain).toHaveProperty('confirmation');
        (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('conversionMetrics');
        (0, globals_1.expect)(analyticsResponse.data.conversionMetrics).toHaveProperty('reminderToPaymentTime');
        const notificationCascadeTime = Date.now() - cascadeStartTime;
        performanceMetrics.notificationCascadeTime.push(notificationCascadeTime);
        console.log(`📊 Notification cascade analytics verified (${notificationCascadeTime}ms)`);
        const totalFlowTime = Date.now() - flowStartTime;
        console.log(`🎉 Complete payment reminder to completion flow completed in ${totalFlowTime}ms`);
    });
    (0, globals_1.test)('should handle multi-channel notification escalation for overdue payments', async () => {
        console.log('📈 Testing multi-channel notification escalation...');
        const overdueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const orderData = {
            studentId: testStudentId,
            schoolId: testSchoolId,
            items: [
                {
                    menuItemId: testMenuItemIds[1],
                    quantity: 1
                }
            ],
            deliveryDate: overdueDate.toISOString().split('T')[0],
            deliveryTimeSlot: '12:00-13:00',
            paymentMethod: 'razorpay'
        };
        const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
        testOrderId = orderResponse.data.id;
        const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
            type: 'card',
            card: {
                number: '4111111111111111',
                expiryMonth: 12,
                expiryYear: 2026,
                cvv: '123',
                holderName: 'Escalation Test Parent'
            },
            isDefault: true
        }, testParentToken);
        testPaymentMethodId = paymentMethodResponse.data.id;
        const escalationData = {
            orderId: testOrderId,
            userId: testParentId,
            escalationLevel: 'overdue',
            daysOverdue: 2,
            amount: orderResponse.data.totalAmount,
            escalationSequence: [
                {
                    level: 1,
                    channels: ['email', 'push'],
                    message: 'Gentle reminder: Payment is 2 days overdue'
                },
                {
                    level: 2,
                    channels: ['sms', 'whatsapp'],
                    message: 'URGENT: Payment is 2 days overdue. Please pay immediately.'
                },
                {
                    level: 3,
                    channels: ['email', 'sms', 'whatsapp', 'push'],
                    message: 'FINAL NOTICE: Payment is 2 days overdue. Account may be suspended.'
                }
            ],
            metadata: {
                orderNumber: orderResponse.data.orderNumber,
                studentName: 'Escalation Test Student',
                overdueAmount: orderResponse.data.totalAmount,
                lateFee: 500
            }
        };
        const escalationResponse = await apiRequest('POST', '/notifications/send/escalation', escalationData, testParentToken);
        (0, globals_1.expect)(escalationResponse.status).toBe(200);
        (0, globals_1.expect)(escalationResponse.data).toHaveProperty('escalationId');
        (0, globals_1.expect)(escalationResponse.data).toHaveProperty('notificationsSent', 6);
        console.log(`🚨 Escalation notifications sent: ${escalationResponse.data.notificationsSent} messages`);
        const escalationNotifications = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'payment_escalation',
            limit: 20
        }, testParentToken);
        (0, globals_1.expect)(escalationNotifications.data.length).toBeGreaterThan(0);
        const level1Notifications = escalationNotifications.data.filter((n) => n.data?.escalationLevel === 1);
        const level2Notifications = escalationNotifications.data.filter((n) => n.data?.escalationLevel === 2);
        (0, globals_1.expect)(level1Notifications.length).toBeGreaterThan(0);
        (0, globals_1.expect)(level2Notifications.length).toBeGreaterThan(0);
        const urgentNotification = escalationNotifications.data.find((n) => n.data?.escalationLevel === 2 && n.channels.includes('sms'));
        (0, globals_1.expect)(urgentNotification).toBeDefined();
        (0, globals_1.expect)(urgentNotification.data.message).toContain('URGENT');
        console.log(`✅ Escalation notifications verified with different priority levels`);
        const paymentData = {
            orderId: testOrderId,
            amount: orderResponse.data.totalAmount + 500,
            currency: 'INR',
            paymentMethodId: testPaymentMethodId,
            description: `Overdue payment with late fee - Order ${orderResponse.data.orderNumber}`,
            metadata: {
                triggeredBy: 'escalation_notification',
                escalationId: escalationResponse.data.escalationId,
                includesLateFee: true
            }
        };
        const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);
        testPaymentId = paymentResponse.data.paymentId;
        await apiRequest('POST', `/payments/${testPaymentId}/confirm`, {
            paymentId: testPaymentId,
            status: 'completed',
            transactionId: `txn_escalation_${(0, uuid_1.v4)()}`
        }, testParentToken);
        const resolutionNotifications = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'payment_resolution'
        }, testParentToken);
        (0, globals_1.expect)(resolutionNotifications.data.length).toBeGreaterThan(0);
        const resolutionNotification = resolutionNotifications.data.find((n) => n.data?.orderId === testOrderId);
        (0, globals_1.expect)(resolutionNotification).toBeDefined();
        console.log(`✅ Payment resolved after escalation with confirmation notifications`);
    });
    (0, globals_1.test)('should convert proactive notifications to successful payments', async () => {
        console.log('🎯 Testing proactive notification to payment conversion...');
        const orders = [];
        for (let i = 0; i < 3; i++) {
            const orderData = {
                studentId: testStudentId,
                schoolId: testSchoolId,
                items: [{ menuItemId: testMenuItemIds[i % testMenuItemIds.length], quantity: 1 }],
                deliveryDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                deliveryTimeSlot: '12:00-13:00',
                paymentMethod: 'razorpay'
            };
            const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
            orders.push({
                id: orderResponse.data.id,
                amount: orderResponse.data.totalAmount,
                orderNumber: orderResponse.data.orderNumber
            });
        }
        console.log(`📦 Created ${orders.length} orders for proactive notifications`);
        const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
            type: 'card',
            card: {
                number: '4111111111111111',
                expiryMonth: 12,
                expiryYear: 2026,
                cvv: '123',
                holderName: 'Proactive Test Parent'
            },
            isDefault: true
        }, testParentToken);
        testPaymentMethodId = paymentMethodResponse.data.id;
        const proactiveData = {
            userId: testParentId,
            orders,
            totalAmount: orders.reduce((sum, order) => sum + order.amount, 0),
            campaignType: 'payment_bundle_discount',
            discountOffer: {
                type: 'percentage',
                value: 10,
                description: '10% off for paying all pending orders together',
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            },
            channels: ['email', 'whatsapp', 'push'],
            personalizedMessage: {
                subject: 'Complete Your Pending Orders & Save 10%!',
                body: 'Hi Notification Parent, you have 3 pending orders. Pay them all together and get 10% off!',
                cta: 'Pay All & Save',
                paymentLink: `https://app.hasivu.com/pay/bundle/${(0, uuid_1.v4)()}`
            }
        };
        const proactiveResponse = await apiRequest('POST', '/notifications/send/proactive-payment', proactiveData, testParentToken);
        (0, globals_1.expect)(proactiveResponse.status).toBe(200);
        (0, globals_1.expect)(proactiveResponse.data).toHaveProperty('campaignId');
        (0, globals_1.expect)(proactiveResponse.data).toHaveProperty('notificationsSent', 3);
        console.log(`📧 Proactive payment bundle notifications sent`);
        const proactiveNotifications = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'proactive_payment',
            limit: 10
        }, testParentToken);
        (0, globals_1.expect)(proactiveNotifications.data.length).toBeGreaterThan(0);
        const bundleNotification = proactiveNotifications.data.find((n) => n.data?.campaignType === 'payment_bundle_discount');
        (0, globals_1.expect)(bundleNotification).toBeDefined();
        (0, globals_1.expect)(bundleNotification.data).toHaveProperty('discountOffer');
        (0, globals_1.expect)(bundleNotification.data.discountOffer.value).toBe(10);
        const bundlePaymentData = {
            orderIds: orders.map(o => o.id),
            amount: Math.round((orders.reduce((sum, order) => sum + order.amount, 0) * 0.9)),
            currency: 'INR',
            paymentMethodId: testPaymentMethodId,
            description: `Bundle payment for ${orders.length} orders with 10% discount`,
            metadata: {
                campaignId: proactiveResponse.data.campaignId,
                discountApplied: 10,
                ordersCount: orders.length,
                triggeredBy: 'proactive_notification'
            }
        };
        const bundlePaymentResponse = await apiRequest('POST', '/payments/process/bundle', bundlePaymentData, testParentToken);
        (0, globals_1.expect)(bundlePaymentResponse.status).toBe(200);
        (0, globals_1.expect)(bundlePaymentResponse.data).toHaveProperty('bundlePaymentId');
        (0, globals_1.expect)(bundlePaymentResponse.data).toHaveProperty('processedOrders', orders.length);
        const { bundlePaymentId } = bundlePaymentResponse.data;
        await apiRequest('POST', `/payments/${bundlePaymentId}/confirm`, {
            paymentId: bundlePaymentId,
            status: 'completed',
            transactionId: `txn_bundle_${(0, uuid_1.v4)()}`
        }, testParentToken);
        for (const order of orders) {
            const orderResponse = await apiRequest('GET', `/orders/${order.id}`, undefined, testParentToken);
            (0, globals_1.expect)(orderResponse.data.status).toBe('confirmed');
        }
        const successNotifications = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'bundle_payment_success'
        }, testParentToken);
        (0, globals_1.expect)(successNotifications.data.length).toBeGreaterThan(0);
        console.log(`✅ Proactive notification converted to successful bundle payment`);
    });
    (0, globals_1.test)('should respect user notification preferences in payment flows', async () => {
        console.log('⚙️ Testing notification preferences in payment flows...');
        const preferenceUpdate = {
            notificationPreferences: {
                email: true,
                sms: false,
                whatsapp: true,
                push: true,
                paymentReminders: true,
                orderUpdates: true,
                promotionalContent: false,
                quietHours: {
                    enabled: true,
                    start: '22:00',
                    end: '08:00'
                }
            }
        };
        const preferenceResponse = await apiRequest('PUT', `/users/${testParentId}/preferences`, preferenceUpdate, testParentToken);
        (0, globals_1.expect)(preferenceResponse.status).toBe(200);
        const orderData = {
            studentId: testStudentId,
            schoolId: testSchoolId,
            items: [{ menuItemId: testMenuItemIds[0], quantity: 1 }],
            deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            deliveryTimeSlot: '12:00-13:00',
            paymentMethod: 'razorpay'
        };
        const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
        testOrderId = orderResponse.data.id;
        const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
            type: 'card',
            card: {
                number: '4111111111111111',
                expiryMonth: 12,
                expiryYear: 2026,
                cvv: '123',
                holderName: 'Preference Test Parent'
            },
            isDefault: true
        }, testParentToken);
        testPaymentMethodId = paymentMethodResponse.data.id;
        const reminderData = {
            orderId: testOrderId,
            userId: testParentId,
            reminderType: 'payment_due',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            amount: orderResponse.data.totalAmount,
            respectPreferences: true,
            templateData: {
                studentName: 'Preference Test Student',
                orderNumber: orderResponse.data.orderNumber,
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                amount: `₹${(orderResponse.data.totalAmount / 100).toFixed(2)}`
            }
        };
        const reminderResponse = await apiRequest('POST', '/notifications/send/payment-reminder', reminderData, testParentToken);
        (0, globals_1.expect)(reminderResponse.status).toBe(200);
        const notificationsResponse = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'payment_reminder'
        }, testParentToken);
        (0, globals_1.expect)(notificationsResponse.data.length).toBeGreaterThan(0);
        const smsNotifications = notificationsResponse.data.filter((n) => n.channels.includes('sms'));
        (0, globals_1.expect)(smsNotifications.length).toBe(0);
        const emailNotifications = notificationsResponse.data.filter((n) => n.channels.includes('email'));
        const whatsappNotifications = notificationsResponse.data.filter((n) => n.channels.includes('whatsapp'));
        const pushNotifications = notificationsResponse.data.filter((n) => n.channels.includes('push'));
        (0, globals_1.expect)(emailNotifications.length).toBeGreaterThan(0);
        (0, globals_1.expect)(whatsappNotifications.length).toBeGreaterThan(0);
        (0, globals_1.expect)(pushNotifications.length).toBeGreaterThan(0);
        console.log(`✅ Notification preferences respected - SMS disabled, others enabled`);
        const paymentData = {
            orderId: testOrderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: testPaymentMethodId,
            description: `Payment for Order ${orderResponse.data.orderNumber}`
        };
        const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);
        testPaymentId = paymentResponse.data.paymentId;
        await apiRequest('POST', `/payments/${testPaymentId}/confirm`, {
            paymentId: testPaymentId,
            status: 'completed',
            transactionId: `txn_preference_${(0, uuid_1.v4)()}`
        }, testParentToken);
        const confirmationsResponse = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'payment_confirmation'
        }, testParentToken);
        const smsConfirmations = confirmationsResponse.data.filter((n) => n.channels.includes('sms'));
        (0, globals_1.expect)(smsConfirmations.length).toBe(0);
        console.log(`✅ Payment confirmations also respect notification preferences`);
    });
    (0, globals_1.afterEach)(async () => {
        await cleanupTestData();
    });
});
//# sourceMappingURL=notification-to-payment-integration.spec.js.map