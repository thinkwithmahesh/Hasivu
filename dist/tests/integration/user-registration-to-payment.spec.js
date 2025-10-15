"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const client_1 = require("@prisma/client");
const node_fetch_1 = __importDefault(require("node-fetch"));
const uuid_1 = require("uuid");
const user_service_1 = require("../../src/services/user.service");
const payment_service_1 = require("../../src/services/payment.service");
const notification_service_1 = require("../../src/services/notification.service");
const analytics_service_1 = require("../../src/services/analytics.service");
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
let userService;
let paymentService;
let notificationService;
let analyticsService;
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
    console.log('🚀 Initializing User Registration to Payment Test Environment...');
    try {
        prisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: TEST_CONFIG.databaseUrl
                }
            },
            log: ['error', 'warn']
        });
        userService = new user_service_1.UserService();
        paymentService = new payment_service_1.PaymentService();
        notificationService = notification_service_1.NotificationService.getInstance();
        analyticsService = new analytics_service_1.AnalyticsService();
        orderService = order_service_1.OrderService.getInstance();
        await cleanupTestData();
        const schoolData = {
            name: 'Test Registration School',
            address: '123 Registration Test Lane',
            city: 'TestCity',
            state: 'TestState',
            pincode: '123456',
            phone: '+91-9876543210',
            email: 'registration-test@school.com',
            principalName: 'Registration Test Principal',
            principalEmail: 'principal@registration-test.com',
            settings: {
                timezone: 'Asia/Kolkata',
                currency: 'INR',
                allowParentRegistration: true,
                requirePaymentSetup: true
            }
        };
        let school;
        if ('createSchool' in userService && typeof userService.createSchool === 'function') {
            school = await userService.createSchool(schoolData);
        }
        else {
            school = { id: 'school-registration-test-id', ...schoolData };
        }
        testSchoolId = school.id;
        const menuItems = [
            {
                name: 'Welcome Meal - Chicken Curry',
                description: 'Special welcome meal for new users',
                price: 15000,
                category: 'Welcome Special',
                nutritionalInfo: {
                    calories: 550,
                    protein: 30,
                    carbs: 45,
                    fat: 25
                },
                isAvailable: true,
                schoolId: testSchoolId,
                tags: ['welcome', 'new_user']
            },
            {
                name: 'Student Starter Pack',
                description: 'Complete meal package for students',
                price: 20000,
                category: 'Meal Package',
                nutritionalInfo: {
                    calories: 800,
                    protein: 35,
                    carbs: 90,
                    fat: 20
                },
                isAvailable: true,
                schoolId: testSchoolId,
                tags: ['starter', 'package']
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
            registrationTime: [],
            paymentSetupTime: [],
            firstPurchaseTime: [],
            analyticsProcessingTime: []
        };
        console.log(`✅ User Registration to Payment Test Environment Ready`);
        console.log(`📊 School: ${testSchoolId}, Menu Items: ${testMenuItemIds.length}`);
    }
    catch (error) {
        console.error('❌ Failed to initialize test environment:', error);
        throw error;
    }
}, 60000);
(0, globals_1.afterAll)(async () => {
    console.log('🧹 Cleaning up User Registration to Payment Test Environment...');
    try {
        await cleanupTestData();
        await prisma.$disconnect();
        console.log('✅ User Registration to Payment cleanup completed successfully');
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
    if (!response.ok && !endpoint.includes('/register') && !endpoint.includes('/login')) {
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
    }
    return {
        status: response.status,
        data: responseData,
        responseTime,
        headers: Object.fromEntries(response.headers.entries())
    };
}
(0, globals_1.describe)('User Registration to Payment Processing Integration Tests', () => {
    console.log(`👤 Testing complete user registration to payment workflow across multiple epics`);
    (0, globals_1.beforeEach)(async () => {
        await cleanupTestData();
    });
    (0, globals_1.test)('should complete full user registration to first payment flow', async () => {
        console.log('🎯 Testing complete user registration to payment flow...');
        const flowStartTime = Date.now();
        const registrationStartTime = Date.now();
        const registrationData = {
            email: `newparent${Date.now()}@test.com`,
            password: 'SecurePassword123!',
            firstName: 'New',
            lastName: 'Parent',
            role: 'PARENT',
            schoolId: testSchoolId,
            phone: '+91-9876543220',
            profile: {
                address: {
                    line1: '456 New User Street',
                    city: 'TestCity',
                    state: 'TestState',
                    pincode: '123456'
                },
                occupation: 'Software Engineer',
                emergencyContact: '+91-9876543221',
                preferredLanguage: 'en',
                timezone: 'Asia/Kolkata'
            },
            registrationSource: 'web_app',
            marketingConsent: true,
            termsAccepted: true,
            privacyPolicyAccepted: true
        };
        const registrationResponse = await apiRequest('POST', '/auth/register', registrationData);
        (0, globals_1.expect)(registrationResponse.status).toBe(201);
        (0, globals_1.expect)(registrationResponse.data).toHaveProperty('user');
        (0, globals_1.expect)(registrationResponse.data).toHaveProperty('tokens');
        (0, globals_1.expect)(registrationResponse.data.user).toHaveProperty('id');
        (0, globals_1.expect)(registrationResponse.data.user.email).toBe(registrationData.email);
        (0, globals_1.expect)(registrationResponse.data.user.role).toBe('PARENT');
        testParentId = registrationResponse.data.user.id;
        testParentToken = registrationResponse.data.tokens.accessToken;
        const registrationTime = Date.now() - registrationStartTime;
        performanceMetrics.registrationTime.push(registrationTime);
        console.log(`📝 User registered: ${testParentId} (${registrationTime}ms)`);
        if (registrationResponse.data.requiresEmailVerification) {
            const verificationToken = 'mock_verification_token';
            const verificationResponse = await apiRequest('POST', '/auth/verify-email', {
                token: verificationToken,
                userId: testParentId
            });
            (0, globals_1.expect)(verificationResponse.status).toBe(200);
            console.log(`✅ Email verified for user: ${testParentId}`);
        }
        const studentData = {
            firstName: 'New',
            lastName: 'Student',
            email: `newstudent${Date.now()}@test.com`,
            phone: '+91-9876543222',
            profile: {
                class: '8th Grade',
                section: 'A',
                rollNumber: 'NS001',
                dateOfBirth: '2010-05-15',
                gender: 'male',
                bloodGroup: 'O+',
                allergies: ['nuts'],
                medicalConditions: [],
                emergencyContact: {
                    name: 'New Parent',
                    relationship: 'Parent',
                    phone: '+91-9876543220'
                },
                dietaryPreferences: {
                    vegetarian: false,
                    halal: false,
                    allergies: ['nuts'],
                    favoriteCuisines: ['Indian', 'Chinese']
                }
            },
            parentId: testParentId
        };
        const studentResponse = await apiRequest('POST', '/users/students', studentData, testParentToken);
        (0, globals_1.expect)(studentResponse.status).toBe(201);
        (0, globals_1.expect)(studentResponse.data).toHaveProperty('id');
        testStudentId = studentResponse.data.id;
        console.log(`🎓 Student profile created: ${testStudentId}`);
        const paymentSetupStartTime = Date.now();
        const paymentMethodData = {
            type: 'card',
            card: {
                number: '4111111111111111',
                expiryMonth: 12,
                expiryYear: 2026,
                cvv: '123',
                holderName: 'New Parent'
            },
            billingAddress: {
                line1: '456 New User Street',
                city: 'TestCity',
                state: 'TestState',
                pincode: '123456',
                country: 'IN'
            },
            isDefault: true,
            metadata: {
                setupBy: testParentId,
                purpose: 'first_time_setup'
            }
        };
        const paymentMethodResponse = await apiRequest('POST', '/payments/methods', paymentMethodData, testParentToken);
        (0, globals_1.expect)(paymentMethodResponse.status).toBe(201);
        (0, globals_1.expect)(paymentMethodResponse.data).toHaveProperty('id');
        (0, globals_1.expect)(paymentMethodResponse.data).toHaveProperty('type', 'card');
        (0, globals_1.expect)(paymentMethodResponse.data).toHaveProperty('isDefault', true);
        testPaymentMethodId = paymentMethodResponse.data.id;
        const paymentSetupTime = Date.now() - paymentSetupStartTime;
        performanceMetrics.paymentSetupTime.push(paymentSetupTime);
        console.log(`💳 Payment method setup: ${testPaymentMethodId} (${paymentSetupTime}ms)`);
        const purchaseStartTime = Date.now();
        const orderData = {
            studentId: testStudentId,
            schoolId: testSchoolId,
            items: [
                {
                    menuItemId: testMenuItemIds[0],
                    quantity: 1,
                    specialInstructions: 'Welcome to HASIVU! Please make it special.'
                }
            ],
            deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            deliveryTimeSlot: '12:30-13:30',
            paymentMethodId: testPaymentMethodId,
            orderType: 'first_purchase',
            metadata: {
                isFirstOrder: true,
                userType: 'new_registration',
                welcomeDiscount: true
            }
        };
        const orderResponse = await apiRequest('POST', '/orders', orderData, testParentToken);
        (0, globals_1.expect)(orderResponse.status).toBe(201);
        (0, globals_1.expect)(orderResponse.data).toHaveProperty('id');
        (0, globals_1.expect)(orderResponse.data).toHaveProperty('status', 'pending');
        testOrderId = orderResponse.data.id;
        console.log(`🛒 First order placed: ${testOrderId}`);
        const paymentData = {
            orderId: testOrderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: testPaymentMethodId,
            description: `First Purchase - Welcome to HASIVU`,
            metadata: {
                orderId: testOrderId,
                studentId: testStudentId,
                orderType: 'first_purchase',
                userJourney: 'new_user_onboarding'
            }
        };
        const paymentResponse = await apiRequest('POST', '/payments/process', paymentData, testParentToken);
        (0, globals_1.expect)(paymentResponse.status).toBe(200);
        (0, globals_1.expect)(paymentResponse.data).toHaveProperty('paymentId');
        (0, globals_1.expect)(paymentResponse.data).toHaveProperty('status', 'processing');
        testPaymentId = paymentResponse.data.paymentId;
        const paymentCompletionData = {
            paymentId: testPaymentId,
            status: 'completed',
            transactionId: `txn_welcome_${(0, uuid_1.v4)()}`,
            gatewayResponse: {
                razorpay_payment_id: `pay_${(0, uuid_1.v4)()}`,
                razorpay_order_id: `order_${(0, uuid_1.v4)()}`,
                razorpay_signature: 'welcome_signature'
            }
        };
        const completionResponse = await apiRequest('POST', `/payments/${testPaymentId}/confirm`, paymentCompletionData, testParentToken);
        (0, globals_1.expect)(completionResponse.status).toBe(200);
        const firstPurchaseTime = Date.now() - purchaseStartTime;
        performanceMetrics.firstPurchaseTime.push(firstPurchaseTime);
        console.log(`✅ First payment completed: ${testPaymentId} (${firstPurchaseTime}ms)`);
        const orderStatusResponse = await apiRequest('GET', `/orders/${testOrderId}`, undefined, testParentToken);
        (0, globals_1.expect)(orderStatusResponse.data.status).toBe('confirmed');
        const notificationsResponse = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'order_confirmation'
        }, testParentToken);
        (0, globals_1.expect)(notificationsResponse.data.length).toBeGreaterThan(0);
        const welcomeNotification = notificationsResponse.data.find((n) => n.data?.orderId === testOrderId && n.type === 'order_confirmation');
        (0, globals_1.expect)(welcomeNotification).toBeDefined();
        (0, globals_1.expect)(welcomeNotification.data).toHaveProperty('isFirstOrder', true);
        console.log(`📧 Welcome notifications sent`);
        const analyticsStartTime = Date.now();
        const userAnalyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}`, undefined, testParentToken);
        (0, globals_1.expect)(userAnalyticsResponse.status).toBe(200);
        (0, globals_1.expect)(userAnalyticsResponse.data).toHaveProperty('registrationDate');
        (0, globals_1.expect)(userAnalyticsResponse.data).toHaveProperty('firstPurchaseDate');
        (0, globals_1.expect)(userAnalyticsResponse.data).toHaveProperty('totalOrders', 1);
        (0, globals_1.expect)(userAnalyticsResponse.data).toHaveProperty('totalSpent', orderResponse.data.totalAmount);
        const paymentAnalyticsResponse = await apiRequest('GET', '/analytics/payments/summary', {
            userId: testParentId,
            timeframe: 'all_time'
        }, testParentToken);
        (0, globals_1.expect)(paymentAnalyticsResponse.data).toHaveProperty('totalPayments', 1);
        (0, globals_1.expect)(paymentAnalyticsResponse.data).toHaveProperty('successfulPayments', 1);
        (0, globals_1.expect)(paymentAnalyticsResponse.data).toHaveProperty('totalAmount', orderResponse.data.totalAmount);
        const analyticsProcessingTime = Date.now() - analyticsStartTime;
        performanceMetrics.analyticsProcessingTime.push(analyticsProcessingTime);
        console.log(`📊 Analytics updated (${analyticsProcessingTime}ms)`);
        const userProfileResponse = await apiRequest('GET', `/users/${testParentId}`, undefined, testParentToken);
        (0, globals_1.expect)(userProfileResponse.data).toHaveProperty('profile');
        (0, globals_1.expect)(userProfileResponse.data.profile).toHaveProperty('hasCompletedFirstPurchase', true);
        (0, globals_1.expect)(userProfileResponse.data.profile).toHaveProperty('firstPurchaseDate');
        const totalFlowTime = Date.now() - flowStartTime;
        console.log(`🎉 Complete user registration to payment flow completed in ${totalFlowTime}ms`);
    });
    (0, globals_1.test)('should handle user onboarding with payment failure and recovery', async () => {
        console.log('🔄 Testing user onboarding with payment failure recovery...');
        const registrationData = {
            email: `recovery${Date.now()}@test.com`,
            password: 'SecurePassword123!',
            firstName: 'Recovery',
            lastName: 'Test',
            role: 'PARENT',
            schoolId: testSchoolId,
            phone: '+91-9876543230'
        };
        const registrationResponse = await apiRequest('POST', '/auth/register', registrationData);
        testParentId = registrationResponse.data.user.id;
        testParentToken = registrationResponse.data.tokens.accessToken;
        const studentResponse = await apiRequest('POST', '/users/students', {
            firstName: 'Recovery',
            lastName: 'Student',
            email: `recoverystudent${Date.now()}@test.com`,
            parentId: testParentId,
            profile: { class: '9th Grade', section: 'B' }
        }, testParentToken);
        testStudentId = studentResponse.data.id;
        const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
            type: 'card',
            card: {
                number: '4000000000000002',
                expiryMonth: 12,
                expiryYear: 2026,
                cvv: '123',
                holderName: 'Recovery Test'
            },
            isDefault: true
        }, testParentToken);
        testPaymentMethodId = paymentMethodResponse.data.id;
        const orderResponse = await apiRequest('POST', '/orders', {
            studentId: testStudentId,
            schoolId: testSchoolId,
            items: [{ menuItemId: testMenuItemIds[0], quantity: 1 }],
            deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            deliveryTimeSlot: '13:00-14:00',
            paymentMethodId: testPaymentMethodId
        }, testParentToken);
        testOrderId = orderResponse.data.id;
        const paymentResponse = await apiRequest('POST', '/payments/process', {
            orderId: testOrderId,
            amount: orderResponse.data.totalAmount,
            currency: 'INR',
            paymentMethodId: testPaymentMethodId,
            simulateFailure: true,
            failureReason: 'card_declined'
        }, testParentToken);
        testPaymentId = paymentResponse.data.paymentId;
        await apiRequest('POST', `/payments/${testPaymentId}/fail`, {
            paymentId: testPaymentId,
            status: 'failed',
            error: { code: 'CARD_DECLINED', message: 'Your card was declined' }
        }, testParentToken);
        const failureNotifications = await apiRequest('GET', '/notifications', {
            userId: testParentId,
            type: 'payment_failed'
        }, testParentToken);
        (0, globals_1.expect)(failureNotifications.data.length).toBeGreaterThan(0);
        console.log(`❌ Payment failed, notifications sent`);
        const newPaymentMethodResponse = await apiRequest('POST', '/payments/methods', {
            type: 'card',
            card: {
                number: '4111111111111111',
                expiryMonth: 12,
                expiryYear: 2026,
                cvv: '123',
                holderName: 'Recovery Test Fixed'
            },
            isDefault: true
        }, testParentToken);
        const newPaymentMethodId = newPaymentMethodResponse.data.id;
        const retryResponse = await apiRequest('POST', `/payments/${testPaymentId}/retry`, {
            newPaymentMethodId,
            retryReason: 'Updated payment method'
        }, testParentToken);
        (0, globals_1.expect)(retryResponse.status).toBe(200);
        await apiRequest('POST', `/payments/${testPaymentId}/confirm`, {
            paymentId: testPaymentId,
            status: 'completed',
            transactionId: `txn_retry_${(0, uuid_1.v4)()}`
        }, testParentToken);
        const finalOrderResponse = await apiRequest('GET', `/orders/${testOrderId}`, undefined, testParentToken);
        (0, globals_1.expect)(finalOrderResponse.data.status).toBe('confirmed');
        const recoveryAnalytics = await apiRequest('GET', `/analytics/users/${testParentId}/recovery`, undefined, testParentToken);
        (0, globals_1.expect)(recoveryAnalytics.data).toHaveProperty('paymentFailures', 1);
        (0, globals_1.expect)(recoveryAnalytics.data).toHaveProperty('successfulRecovery', true);
        console.log(`✅ Payment recovery successful, user onboarding completed`);
    });
    (0, globals_1.test)('should handle bulk user registration with payment setup', async () => {
        console.log('👥 Testing bulk user registration with payment setup...');
        const bulkUsers = [];
        const userTokens = [];
        for (let i = 0; i < 5; i++) {
            const registrationData = {
                email: `bulkuser${i}_${Date.now()}@test.com`,
                password: 'SecurePassword123!',
                firstName: `Bulk${i}`,
                lastName: 'User',
                role: 'PARENT',
                schoolId: testSchoolId,
                phone: `+91-98765432${20 + i}`
            };
            const registrationResponse = await apiRequest('POST', '/auth/register', registrationData);
            bulkUsers.push({
                id: registrationResponse.data.user.id,
                token: registrationResponse.data.tokens.accessToken,
                email: registrationData.email
            });
            userTokens.push(registrationResponse.data.tokens.accessToken);
        }
        console.log(`📝 ${bulkUsers.length} users registered`);
        const paymentSetupPromises = bulkUsers.map((user, index) => apiRequest('POST', '/payments/methods', {
            type: 'card',
            card: {
                number: '4111111111111111',
                expiryMonth: 12,
                expiryYear: 2026,
                cvv: '123',
                holderName: `Bulk User ${index}`
            },
            isDefault: true
        }, user.token));
        const paymentSetupResults = await Promise.allSettled(paymentSetupPromises);
        const successfulSetups = paymentSetupResults.filter(r => r.status === 'fulfilled').length;
        (0, globals_1.expect)(successfulSetups).toBeGreaterThanOrEqual(bulkUsers.length * 0.9);
        console.log(`💳 ${successfulSetups}/${bulkUsers.length} payment methods setup`);
        const purchasePromises = bulkUsers.map((user, index) => apiRequest('POST', '/orders', {
            studentId: user.id,
            schoolId: testSchoolId,
            items: [{ menuItemId: testMenuItemIds[index % testMenuItemIds.length], quantity: 1 }],
            deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            deliveryTimeSlot: '12:00-13:00',
            paymentMethodId: 'pm_bulk_test',
            orderType: 'bulk_onboarding'
        }, user.token));
        const purchaseResults = await Promise.allSettled(purchasePromises);
        const successfulPurchases = purchaseResults.filter(r => r.status === 'fulfilled').length;
        (0, globals_1.expect)(successfulPurchases).toBeGreaterThanOrEqual(successfulSetups * 0.8);
        console.log(`🛒 ${successfulPurchases}/${bulkUsers.length} first purchases completed`);
        const bulkAnalyticsResponse = await apiRequest('GET', '/analytics/users/bulk', {
            userIds: bulkUsers.map(u => u.id).join(','),
            metrics: ['registration_rate', 'payment_setup_rate', 'first_purchase_rate']
        });
        (0, globals_1.expect)(bulkAnalyticsResponse.data).toHaveProperty('summary');
        (0, globals_1.expect)(bulkAnalyticsResponse.data.summary).toHaveProperty('totalUsers', bulkUsers.length);
        (0, globals_1.expect)(bulkAnalyticsResponse.data.summary).toHaveProperty('successfulOnboardings');
        console.log(`📊 Bulk onboarding analytics verified`);
    });
    (0, globals_1.test)('should track and analyze complete user journey from registration to payment', async () => {
        console.log('📈 Testing user journey analytics and insights...');
        const registrationResponse = await apiRequest('POST', '/auth/register', {
            email: `analytics${Date.now()}@test.com`,
            password: 'SecurePassword123!',
            firstName: 'Analytics',
            lastName: 'Test',
            role: 'PARENT',
            schoolId: testSchoolId,
            phone: '+91-9876543240'
        });
        testParentId = registrationResponse.data.user.id;
        testParentToken = registrationResponse.data.tokens.accessToken;
        const studentResponse = await apiRequest('POST', '/users/students', {
            firstName: 'Analytics',
            lastName: 'Student',
            email: `analyticsstudent${Date.now()}@test.com`,
            parentId: testParentId,
            profile: { class: '10th Grade', section: 'A' }
        }, testParentToken);
        testStudentId = studentResponse.data.id;
        const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
            type: 'card',
            card: {
                number: '4111111111111111',
                expiryMonth: 12,
                expiryYear: 2026,
                cvv: '123',
                holderName: 'Analytics Test'
            },
            isDefault: true
        }, testParentToken);
        testPaymentMethodId = paymentMethodResponse.data.id;
        const purchases = [
            { itemIndex: 0, delay: 0 },
            { itemIndex: 1, delay: 1000 },
            { itemIndex: 0, delay: 2000 }
        ];
        for (const purchase of purchases) {
            await new Promise(resolve => setTimeout(resolve, purchase.delay));
            const orderResponse = await apiRequest('POST', '/orders', {
                studentId: testStudentId,
                schoolId: testSchoolId,
                items: [{ menuItemId: testMenuItemIds[purchase.itemIndex], quantity: 1 }],
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                deliveryTimeSlot: '12:00-13:00',
                paymentMethodId: testPaymentMethodId
            }, testParentToken);
            const paymentResponse = await apiRequest('POST', '/payments/process', {
                orderId: orderResponse.data.id,
                amount: orderResponse.data.totalAmount,
                currency: 'INR',
                paymentMethodId: testPaymentMethodId
            }, testParentToken);
            await apiRequest('POST', `/payments/${paymentResponse.data.paymentId}/confirm`, {
                paymentId: paymentResponse.data.paymentId,
                status: 'completed',
                transactionId: `txn_analytics_${(0, uuid_1.v4)()}`
            });
        }
        const journeyAnalyticsResponse = await apiRequest('GET', `/analytics/users/${testParentId}/journey`, undefined, testParentToken);
        (0, globals_1.expect)(journeyAnalyticsResponse.status).toBe(200);
        (0, globals_1.expect)(journeyAnalyticsResponse.data).toHaveProperty('stages');
        (0, globals_1.expect)(journeyAnalyticsResponse.data.stages).toHaveProperty('registration');
        (0, globals_1.expect)(journeyAnalyticsResponse.data.stages).toHaveProperty('profile_completion');
        (0, globals_1.expect)(journeyAnalyticsResponse.data.stages).toHaveProperty('payment_setup');
        (0, globals_1.expect)(journeyAnalyticsResponse.data.stages).toHaveProperty('first_purchase');
        (0, globals_1.expect)(journeyAnalyticsResponse.data.stages).toHaveProperty('repeat_purchases');
        (0, globals_1.expect)(journeyAnalyticsResponse.data).toHaveProperty('metrics');
        (0, globals_1.expect)(journeyAnalyticsResponse.data.metrics).toHaveProperty('timeToFirstPurchase');
        (0, globals_1.expect)(journeyAnalyticsResponse.data.metrics).toHaveProperty('purchaseFrequency');
        (0, globals_1.expect)(journeyAnalyticsResponse.data.metrics).toHaveProperty('averageOrderValue');
        (0, globals_1.expect)(journeyAnalyticsResponse.data.metrics).toHaveProperty('customerLifetimeValue');
        (0, globals_1.expect)(journeyAnalyticsResponse.data).toHaveProperty('insights');
        (0, globals_1.expect)(journeyAnalyticsResponse.data.insights).toHaveProperty('engagement_score');
        (0, globals_1.expect)(journeyAnalyticsResponse.data.insights).toHaveProperty('retention_probability');
        (0, globals_1.expect)(journeyAnalyticsResponse.data.insights).toHaveProperty('next_best_action');
        console.log(`✅ User journey analytics completed with insights`);
    });
    (0, globals_1.afterEach)(async () => {
        await cleanupTestData();
    });
});
//# sourceMappingURL=user-registration-to-payment.spec.js.map