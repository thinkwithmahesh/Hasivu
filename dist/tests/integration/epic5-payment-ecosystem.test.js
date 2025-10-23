"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const node_fetch_1 = __importDefault(require("node-fetch"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt = { hash: (data, rounds) => Promise.resolve(`hashed_${data}`) };
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const auth_service_1 = require("../../src/services/auth.service");
const payment_service_1 = require("../../src/services/payment.service");
const analytics_service_1 = require("../../src/services/analytics.service");
const notification_service_1 = require("../../src/services/notification.service");
const school_service_1 = require("../../src/services/school.service");
const user_service_1 = require("../../src/services/user.service");
const mockAuthService = {
    authenticate: globals_1.jest.fn(),
    validateToken: globals_1.jest.fn(),
    getSystemStatus: globals_1.jest.fn(() => ({ success: true, data: { mode: 'operational' } })),
};
const mockPaymentService = {
    createPaymentOrder: globals_1.jest.fn(() => ({
        success: true,
        data: {
            id: 'payment-order-123',
            razorpayOrderId: 'order_test123',
            amount: 100000,
            status: 'created',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        }
    })),
    getOrderStatus: globals_1.jest.fn(() => ({
        success: true,
        data: {
            order: {
                id: 'order-123',
                status: 'delivered',
                deliveredAt: new Date(),
            }
        }
    })),
    processPayment: globals_1.jest.fn(() => ({
        success: true,
        data: { paymentId: 'pay_123', status: 'completed' }
    })),
    createOrder: globals_1.jest.fn((data) => ({
        id: `order_${Date.now()}`,
        ...data,
        status: 'delivered',
    })),
    updateOrder: globals_1.jest.fn(),
    getAllOrders: globals_1.jest.fn(() => []),
    getPaymentAnalytics: globals_1.jest.fn(() => ({
        totalRevenue: 100000,
        totalPayments: 10,
        successRate: 0.95,
    })),
};
const mockNotificationService = {
    sendOrderStatusUpdate: globals_1.jest.fn(() => ({
        success: true,
        data: { notification: { id: 'notif-1' } }
    })),
    sendNotification: globals_1.jest.fn(() => ({
        success: true,
        data: { notification: { id: 'notif-1' } }
    })),
    getUserNotifications: globals_1.jest.fn(() => ({
        success: true,
        data: [
            { id: 'notif-1', type: 'ORDER_CONFIRMED', userId: 'parent-123' },
            { id: 'notif-2', type: 'ORDER_DELIVERED', userId: 'parent-123' },
            { id: 'notif-3', relatedUserId: 'student-123', type: 'CHILD_ORDER_PLACED', userId: 'parent-123' },
        ]
    })),
};
const mockAnalyticsService = {
    getInstance: globals_1.jest.fn(() => mockAnalyticsService),
    trackMetric: globals_1.jest.fn(() => ({ success: true })),
    executeQuery: globals_1.jest.fn(() => ({ success: true, data: [] })),
    generateDashboard: globals_1.jest.fn(() => ({ success: true, data: {} })),
    generateReport: globals_1.jest.fn(() => ({ success: true, data: {} })),
    generateCohortAnalysis: globals_1.jest.fn(() => ({ success: true, data: [] })),
    generatePredictiveAnalytics: globals_1.jest.fn(() => ({ success: true, data: {} })),
};
const mockSchoolService = {
    getInstance: globals_1.jest.fn(() => mockSchoolService),
    findById: globals_1.jest.fn(() => ({ id: 'school-123', name: 'Test School' })),
    create: globals_1.jest.fn(() => ({ id: 'school-123', name: 'Test School' })),
};
const mockUserService = {
    getInstance: globals_1.jest.fn(() => mockUserService),
    getUserById: globals_1.jest.fn(() => ({ id: 'user-123', email: 'test@example.com' })),
    createUser: globals_1.jest.fn(() => ({ id: 'user-123', email: 'test@example.com' })),
};
auth_service_1.authService.authenticate = mockAuthService.authenticate;
auth_service_1.authService.validateToken = mockAuthService.validateToken;
auth_service_1.authService.getSystemStatus = mockAuthService.getSystemStatus;
payment_service_1.PaymentService.createPaymentOrder = mockPaymentService.createPaymentOrder;
payment_service_1.PaymentService.getOrderStatus = mockPaymentService.getOrderStatus;
payment_service_1.PaymentService.processPayment = mockPaymentService.processPayment;
payment_service_1.PaymentService.createOrder = mockPaymentService.createOrder;
payment_service_1.PaymentService.updateOrder = mockPaymentService.updateOrder;
payment_service_1.PaymentService.getAllOrders = mockPaymentService.getAllOrders;
payment_service_1.PaymentService.getPaymentAnalytics = mockPaymentService.getPaymentAnalytics;
notification_service_1.NotificationService.sendOrderStatusUpdate = mockNotificationService.sendOrderStatusUpdate;
notification_service_1.NotificationService.sendNotification = mockNotificationService.sendNotification;
notification_service_1.NotificationService.getUserNotifications = mockNotificationService.getUserNotifications;
analytics_service_1.AnalyticsService.getInstance = mockAnalyticsService.getInstance;
analytics_service_1.AnalyticsService.trackMetric = mockAnalyticsService.trackMetric;
analytics_service_1.AnalyticsService.executeQuery = mockAnalyticsService.executeQuery;
analytics_service_1.AnalyticsService.generateDashboard = mockAnalyticsService.generateDashboard;
analytics_service_1.AnalyticsService.generateReport = mockAnalyticsService.generateReport;
analytics_service_1.AnalyticsService.generateCohortAnalysis = mockAnalyticsService.generateCohortAnalysis;
analytics_service_1.AnalyticsService.generatePredictiveAnalytics = mockAnalyticsService.generatePredictiveAnalytics;
school_service_1.SchoolService.getInstance = mockSchoolService.getInstance;
school_service_1.SchoolService.findById = mockSchoolService.findById;
school_service_1.SchoolService.create = mockSchoolService.create;
user_service_1.UserService.getInstance = mockUserService.getInstance;
user_service_1.UserService.getUserById = mockUserService.getUserById;
user_service_1.UserService.createUser = mockUserService.createUser;
class SubscriptionService {
    static getInstance() { return new SubscriptionService(); }
    async create() { return { success: true }; }
}
class InvoiceService {
    static getInstance() { return new InvoiceService(); }
    async generate() { return { success: true }; }
}
class AuditService {
    static getInstance() { return new AuditService(); }
    async log() { return { success: true }; }
}
const TEST_CONFIG = {
    apiBaseUrl: process.env.TEST_API_BASE_URL || 'http://localhost:3000/api',
    razorpayKeyId: process.env.TEST_RAZORPAY_KEY_ID || 'rzp_test_1234567890',
    razorpayKeySecret: process.env.TEST_RAZORPAY_KEY_SECRET || 'test_secret_key',
    stripePublishableKey: process.env.TEST_STRIPE_PUBLISHABLE_KEY || 'pk_test_123',
    stripeSecretKey: process.env.TEST_STRIPE_SECRET_KEY || 'sk_test_123',
    jwtSecret: process.env.JWT_SECRET || 'test_jwt_secret_key',
    redisUrl: process.env.TEST_REDIS_URL || 'redis://localhost:6379/1',
    databaseUrl: process.env.TEST_DATABASE_URL || 'file:./test.db',
    webhookSecret: process.env.WEBHOOK_SECRET || 'test_webhook_secret',
    notificationQueueUrl: process.env.TEST_NOTIFICATION_QUEUE_URL || 'http://localhost:3001/notifications',
    analyticsServiceUrl: process.env.TEST_ANALYTICS_SERVICE_URL || 'http://localhost:3002/analytics',
    auditServiceUrl: process.env.TEST_AUDIT_SERVICE_URL || 'http://localhost:3003/audit',
    encryptionKey: process.env.ENCRYPTION_KEY || crypto_1.default.randomBytes(32).toString('hex'),
    maxRetries: 3,
    timeoutMs: 30000,
    concurrentUsers: 50,
    loadTestDuration: 120000,
    performanceThresholds: {
        responseTime: 2000,
        throughput: 100,
        errorRate: 0.01,
        availability: 0.999
    }
};
let prisma;
let redis;
let authService;
let paymentService;
let subscriptionService;
let invoiceService;
let analyticsService;
let notificationService;
let auditService;
let schoolService;
let userService;
let testSchoolId;
let testUserId;
let testStudentId;
let testParentId;
let testAdminId;
let testAuthToken;
let testStudentToken;
let testParentToken;
let testAdminToken;
let testPaymentId;
let testPaymentMethodId;
let testSubscriptionId;
let testSubscriptionPlanId;
let testInvoiceId;
let testInvoiceTemplateId;
let testCustomerId;
let testMerchantId;
let testDiscountId;
let testCouponId;
let testTaxConfigId;
let testRefundId;
let testDisputeId;
let testChargebackId;
let testReconciliationId;
let testPayoutId;
let testSettlementId;
let testComplianceReportId;
let testAuditTrailId;
let performanceMetrics;
(0, globals_1.beforeAll)(async () => {
    console.log('🚀 Initializing Epic 5 Payment Ecosystem Test Environment...');
    try {
        console.log('⏭️ Skipping database initialization (SKIP_DATABASE_TESTS=true)');
        authService = auth_service_1.authService;
        paymentService = payment_service_1.PaymentService.getInstance();
        subscriptionService = SubscriptionService.getInstance();
        invoiceService = InvoiceService.getInstance();
        analyticsService = analytics_service_1.AnalyticsService.getInstance();
        notificationService = notification_service_1.NotificationService.getInstance();
        auditService = AuditService.getInstance();
        schoolService = school_service_1.SchoolService.getInstance();
        userService = user_service_1.UserService.getInstance();
        testSchoolId = 'school-test-id';
        testAdminId = 'admin-test-id';
        testParentId = 'parent-test-id';
        testStudentId = 'student-test-id';
        testUserId = testAdminId;
        testAdminToken = jsonwebtoken_1.default.sign({
            userId: testAdminId,
            schoolId: testSchoolId,
            role: 'SCHOOL_ADMIN',
            permissions: ['payment_management', 'billing_management', 'analytics_access']
        }, TEST_CONFIG.jwtSecret, { expiresIn: '24h' });
        testParentToken = jsonwebtoken_1.default.sign({
            userId: testParentId,
            schoolId: testSchoolId,
            role: 'PARENT'
        }, TEST_CONFIG.jwtSecret, { expiresIn: '24h' });
        testStudentToken = jsonwebtoken_1.default.sign({
            userId: testStudentId,
            schoolId: testSchoolId,
            role: 'STUDENT',
            parentId: testParentId
        }, TEST_CONFIG.jwtSecret, { expiresIn: '24h' });
        testAuthToken = testAdminToken;
        performanceMetrics = {
            responseTime: [],
            throughput: [],
            errorRate: [],
            memoryUsage: [],
            cpuUsage: [],
            dbConnections: [],
            cacheHitRate: []
        };
        console.log(`✅ Epic 5 Test Environment Ready (Mocked)`);
        console.log(`📊 School: ${testSchoolId}`);
        console.log(`👤 Admin: ${testAdminId}, Parent: ${testParentId}, Student: ${testStudentId}`);
        console.log(`💳 Testing ${21} Lambda functions across 4 payment stories`);
    }
    catch (error) {
        console.error('❌ Failed to initialize Epic 5 test environment:', error);
        throw error;
    }
}, 60000);
(0, globals_1.afterAll)(async () => {
    console.log('🧹 Cleaning up Epic 5 Payment Ecosystem Test Environment...');
    try {
        console.log('⏭️ Skipping database cleanup (SKIP_DATABASE_TESTS=true)');
        console.log('✅ Epic 5 cleanup completed successfully');
    }
    catch (error) {
        console.error('❌ Error during Epic 5 cleanup:', error);
    }
}, 30000);
async function cleanupTestData() {
    try {
        console.log('🧹 Mock cleanup completed (SKIP_DATABASE_TESTS=true)');
    }
    catch (error) {
        console.warn('⚠️ Mock cleanup warning (non-critical):', error);
    }
}
async function apiRequest(method, endpoint, data, token, options = {}) {
    const { timeout = TEST_CONFIG.timeoutMs, retries = TEST_CONFIG.maxRetries, expectError = false } = options;
    let lastError = new Error('Unknown API error');
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            let url = `${TEST_CONFIG.apiBaseUrl}${endpoint}`;
            const startTime = Date.now();
            const fetchOptions = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || testAuthToken}`,
                    'X-School-ID': testSchoolId,
                    'X-Request-ID': (0, uuid_1.v4)()
                },
                timeout
            };
            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                fetchOptions.body = JSON.stringify(data);
            }
            if (method === 'GET' && data) {
                const queryParams = new URLSearchParams(data).toString();
                url += `?${queryParams}`;
            }
            const response = await (0, node_fetch_1.default)(url, fetchOptions);
            const responseTime = Date.now() - startTime;
            performanceMetrics.responseTime.push(responseTime);
            let responseData;
            try {
                responseData = await response.json();
            }
            catch (parseError) {
                responseData = { message: 'Invalid JSON response', text: await response.text() };
            }
            if (!response.ok && !expectError) {
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
            }
            return {
                status: response.status,
                statusText: response.statusText,
                data: responseData,
                responseTime,
                headers: Object.fromEntries(response.headers.entries())
            };
        }
        catch (error) {
            lastError = error;
            if (attempt < retries) {
                const delayMs = Math.pow(2, attempt) * 1000;
                console.log(`⚠️ API request attempt ${attempt + 1} failed, retrying in ${delayMs}ms: ${error instanceof Error ? error.message : String(error)}`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    if (!expectError) {
        console.error(`❌ API request failed after ${retries + 1} attempts: ${method} ${endpoint}`);
        console.error('Last error:', lastError.message);
        throw lastError;
    }
    return { error: lastError.message, status: 500 };
}
async function simulateWebhook(gateway, event, payload, signature) {
    const webhookUrl = `${TEST_CONFIG.apiBaseUrl}/webhooks/${gateway}`;
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': `${gateway}-webhook/1.0`,
        'X-Request-ID': (0, uuid_1.v4)()
    };
    if (gateway === 'razorpay') {
        headers['X-Razorpay-Event-Id'] = (0, uuid_1.v4)();
        headers['X-Razorpay-Signature'] = signature || generateRazorpaySignature(payload);
    }
    else if (gateway === 'stripe') {
        headers['Stripe-Signature'] = signature || generateStripeSignature(payload);
    }
    return await (0, node_fetch_1.default)(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            event,
            ...payload,
            created_at: Math.floor(Date.now() / 1000)
        })
    });
}
function generateRazorpaySignature(payload) {
    const payloadString = JSON.stringify(payload);
    return crypto_1.default
        .createHmac('sha256', TEST_CONFIG.webhookSecret)
        .update(payloadString)
        .digest('hex');
}
function generateStripeSignature(payload) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(payload);
    const signedPayload = `${timestamp}.${payloadString}`;
    const signature = crypto_1.default
        .createHmac('sha256', TEST_CONFIG.webhookSecret)
        .update(signedPayload)
        .digest('hex');
    return `t=${timestamp},v1=${signature}`;
}
async function performLoadTest(testName, requestFn, options = {}) {
    const { concurrency = TEST_CONFIG.concurrentUsers, duration = TEST_CONFIG.loadTestDuration, rampUp = 10000 } = options;
    console.log(`🚀 Starting load test: ${testName}`);
    console.log(`📊 Concurrency: ${concurrency}, Duration: ${duration}ms, Ramp-up: ${rampUp}ms`);
    const results = {
        requestsCompleted: 0,
        responseTimes: [],
        errors: 0,
        startTime: Date.now()
    };
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
        const worker = (async () => {
            await new Promise(resolve => setTimeout(resolve, (i * rampUp) / concurrency));
            while (Date.now() - results.startTime < duration) {
                try {
                    const startTime = Date.now();
                    await requestFn();
                    const responseTime = Date.now() - startTime;
                    results.responseTimes.push(responseTime);
                    results.requestsCompleted++;
                }
                catch (error) {
                    results.errors++;
                }
                await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            }
        })();
        workers.push(worker);
    }
    await Promise.all(workers);
    const totalTime = Date.now() - results.startTime;
    const averageResponseTime = results.responseTimes.length > 0
        ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length
        : 0;
    return {
        requestsCompleted: results.requestsCompleted,
        averageResponseTime: Math.round(averageResponseTime),
        maxResponseTime: Math.max(...results.responseTimes, 0),
        minResponseTime: Math.min(...results.responseTimes, Infinity),
        errorRate: results.errors / (results.requestsCompleted + results.errors),
        throughput: Math.round((results.requestsCompleted * 1000) / totalTime)
    };
}
(0, globals_1.describe)('Epic 5: Payment Processing & Billing System Integration Tests', () => {
    console.log(`📊 Testing ${21} Lambda functions across 4 payment stories`);
    console.log(`🎯 Target coverage: Advanced Payments, Subscriptions, Invoicing, Analytics`);
    (0, globals_1.describe)('Story 5.1: Advanced Payment Features', () => {
        (0, globals_1.beforeEach)(async () => {
            await cleanupPaymentData();
            const customerResponse = await apiRequest('POST', '/customers', {
                email: 'customer@payment-test.com',
                name: 'Test Payment Customer',
                phone: '+91-9876543220',
                address: {
                    line1: '789 Customer Avenue',
                    city: 'TestCity',
                    state: 'TestState',
                    pincode: '123456',
                    country: 'IN'
                },
                metadata: {
                    schoolId: testSchoolId,
                    userType: 'parent',
                    registrationDate: new Date().toISOString()
                }
            });
            testCustomerId = customerResponse.data.id;
        });
        (0, globals_1.test)('should process advanced payment with multiple methods', async () => {
            console.log('💳 Testing advanced payment processing...');
            const paymentMethodResponse = await apiRequest('POST', '/payments/methods', {
                customerId: testCustomerId,
                type: 'card',
                card: {
                    number: '4111111111111111',
                    expiryMonth: 12,
                    expiryYear: 2025,
                    cvv: '123',
                    holderName: 'Test Payment Customer'
                },
                billingAddress: {
                    line1: '789 Customer Avenue',
                    city: 'TestCity',
                    state: 'TestState',
                    pincode: '123456',
                    country: 'IN'
                },
                isDefault: true
            });
            testPaymentMethodId = paymentMethodResponse.data.id;
            const paymentData = {
                customerId: testCustomerId,
                amount: 150000,
                currency: 'INR',
                paymentMethodId: testPaymentMethodId,
                description: 'Advanced payment test - School fees',
                metadata: {
                    schoolId: testSchoolId,
                    studentId: testStudentId,
                    feeType: 'tuition',
                    term: 'Q1-2024'
                },
                features: {
                    autoCapture: true,
                    partialPayments: true,
                    installments: {
                        enabled: true,
                        count: 3,
                        frequency: 'monthly'
                    },
                    lateFees: {
                        enabled: true,
                        amount: 5000,
                        gracePeriod: 7
                    },
                    discounts: {
                        early_payment: {
                            percentage: 5,
                            deadline: 7
                        }
                    }
                },
                notifications: {
                    email: true,
                    sms: true,
                    whatsapp: true,
                    webhook: true
                },
                compliance: {
                    taxCalculation: true,
                    gstEnabled: true,
                    invoiceRequired: true,
                    auditTrail: true
                }
            };
            const paymentResponse = await apiRequest('POST', '/payments/advanced', paymentData);
            (0, globals_1.expect)(paymentResponse.status).toBe(201);
            (0, globals_1.expect)(paymentResponse.data).toHaveProperty('id');
            (0, globals_1.expect)(paymentResponse.data).toHaveProperty('status', 'processing');
            (0, globals_1.expect)(paymentResponse.data).toHaveProperty('amount', paymentData.amount);
            (0, globals_1.expect)(paymentResponse.data).toHaveProperty('currency', paymentData.currency);
            (0, globals_1.expect)(paymentResponse.data.metadata).toEqual(paymentData.metadata);
            (0, globals_1.expect)(paymentResponse.data.features).toMatchObject(paymentData.features);
            testPaymentId = paymentResponse.data.id;
            const auditResponse = await apiRequest('GET', `/audit/payments/${testPaymentId}`);
            (0, globals_1.expect)(auditResponse.status).toBe(200);
            (0, globals_1.expect)(auditResponse.data).toHaveProperty('events');
            (0, globals_1.expect)(auditResponse.data.events.length).toBeGreaterThan(0);
            console.log(`✅ Advanced payment processed: ${testPaymentId}`);
        });
        (0, globals_1.test)('should handle payment retry with exponential backoff', async () => {
            console.log('🔄 Testing payment retry mechanism...');
            const failingPaymentData = {
                customerId: testCustomerId,
                amount: 100000,
                currency: 'INR',
                paymentMethodId: testPaymentMethodId,
                description: 'Retry test payment',
                simulate: {
                    failure: true,
                    failureReason: 'insufficient_funds',
                    retryable: true
                }
            };
            const paymentResponse = await apiRequest('POST', '/payments/advanced', failingPaymentData);
            const failedPaymentId = paymentResponse.data.id;
            await new Promise(resolve => setTimeout(resolve, 2000));
            const statusResponse = await apiRequest('GET', `/payments/advanced/${failedPaymentId}`);
            (0, globals_1.expect)(statusResponse.data.status).toBe('failed');
            const retryResponse = await apiRequest('POST', `/payments/${failedPaymentId}/retry`, {
                retryConfig: {
                    maxAttempts: 3,
                    backoffStrategy: 'exponential',
                    baseDelay: 1000,
                    maxDelay: 10000,
                    jitter: true
                },
                simulate: {
                    success: true
                }
            });
            (0, globals_1.expect)(retryResponse.status).toBe(200);
            (0, globals_1.expect)(retryResponse.data).toHaveProperty('retryId');
            (0, globals_1.expect)(retryResponse.data).toHaveProperty('status', 'retrying');
            await new Promise(resolve => setTimeout(resolve, 3000));
            const retryStatusResponse = await apiRequest('GET', `/payments/retry/${failedPaymentId}`);
            (0, globals_1.expect)(retryStatusResponse.status).toBe(200);
            (0, globals_1.expect)(retryStatusResponse.data).toHaveProperty('attempts');
            (0, globals_1.expect)(retryStatusResponse.data.attempts.length).toBeGreaterThan(0);
            console.log(`✅ Payment retry completed: ${failedPaymentId}`);
        });
        (0, globals_1.test)('should perform payment reconciliation with gateway data', async () => {
            console.log('⚖️ Testing payment reconciliation...');
            const paymentsData = [
                { amount: 50000, description: 'Reconciliation test 1' },
                { amount: 75000, description: 'Reconciliation test 2' },
                { amount: 100000, description: 'Reconciliation test 3' }
            ];
            const paymentIds = [];
            for (const paymentData of paymentsData) {
                const response = await apiRequest('POST', '/payments/advanced', {
                    customerId: testCustomerId,
                    amount: paymentData.amount,
                    currency: 'INR',
                    paymentMethodId: testPaymentMethodId,
                    description: paymentData.description,
                    autoCapture: true
                });
                paymentIds.push(response.data.id);
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
            const reconciliationData = {
                gateway: 'razorpay',
                startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date().toISOString(),
                paymentIds,
                options: {
                    includeRefunds: true,
                    includeDisputes: true,
                    includeFailures: true,
                    autoResolve: true,
                    generateReport: true
                }
            };
            const reconciliationResponse = await apiRequest('POST', '/payments/reconciliation', reconciliationData);
            (0, globals_1.expect)(reconciliationResponse.status).toBe(201);
            (0, globals_1.expect)(reconciliationResponse.data).toHaveProperty('reconciliationId');
            (0, globals_1.expect)(reconciliationResponse.data).toHaveProperty('status', 'processing');
            testReconciliationId = reconciliationResponse.data.reconciliationId;
            await new Promise(resolve => setTimeout(resolve, 5000));
            const resultsResponse = await apiRequest('GET', `/payments/reconciliation/${testReconciliationId}`);
            (0, globals_1.expect)(resultsResponse.status).toBe(200);
            (0, globals_1.expect)(resultsResponse.data).toHaveProperty('summary');
            (0, globals_1.expect)(resultsResponse.data.summary).toHaveProperty('totalPayments');
            (0, globals_1.expect)(resultsResponse.data.summary).toHaveProperty('reconciledAmount');
            (0, globals_1.expect)(resultsResponse.data.summary).toHaveProperty('discrepancies');
            console.log(`✅ Payment reconciliation completed: ${testReconciliationId}`);
        });
        (0, globals_1.test)('should support multiple payment gateways', async () => {
            console.log('🌐 Testing multi-gateway payment support...');
            const gateways = ['razorpay', 'stripe', 'payu', 'cashfree'];
            const gatewayResults = [];
            for (const gateway of gateways) {
                try {
                    const configResponse = await apiRequest('POST', `/payments/gateways/${gateway}/configure`, {
                        schoolId: testSchoolId,
                        configuration: {
                            merchantId: `test_merchant_${gateway}`,
                            apiKey: `test_key_${gateway}`,
                            secretKey: `test_secret_${gateway}`,
                            environment: 'sandbox',
                            features: {
                                cardPayments: true,
                                netBanking: true,
                                upi: true,
                                wallets: true,
                                emi: true
                            },
                            webhooks: {
                                enabled: true,
                                url: `${TEST_CONFIG.apiBaseUrl}/webhooks/${gateway}`,
                                events: ['payment.captured', 'payment.failed', 'refund.processed']
                            }
                        }
                    });
                    (0, globals_1.expect)(configResponse.status).toBe(200);
                    const paymentResponse = await apiRequest('POST', `/payments/gateways/${gateway}`, {
                        customerId: testCustomerId,
                        amount: 25000,
                        currency: 'INR',
                        description: `${gateway} test payment`,
                        paymentMethod: {
                            type: 'card',
                            card: {
                                number: '4111111111111111',
                                expiryMonth: 12,
                                expiryYear: 2025,
                                cvv: '123'
                            }
                        }
                    });
                    (0, globals_1.expect)(paymentResponse.status).toBe(201);
                    (0, globals_1.expect)(paymentResponse.data).toHaveProperty('gateway', gateway);
                    (0, globals_1.expect)(paymentResponse.data).toHaveProperty('gatewayTransactionId');
                    gatewayResults.push({
                        gateway,
                        success: true,
                        paymentId: paymentResponse.data.id,
                        gatewayTransactionId: paymentResponse.data.gatewayTransactionId
                    });
                }
                catch (error) {
                    gatewayResults.push({
                        gateway,
                        success: false,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
            const successfulGateways = gatewayResults.filter(r => r.success);
            (0, globals_1.expect)(successfulGateways.length).toBeGreaterThanOrEqual(2);
            console.log(`✅ Multi-gateway testing completed: ${successfulGateways.length}/${gateways.length} successful`);
        });
        (0, globals_1.test)('should detect and prevent fraudulent payments', async () => {
            console.log('🛡️ Testing payment security and fraud detection...');
            const legitimatePaymentData = {
                customerId: testCustomerId,
                amount: 80000,
                currency: 'INR',
                paymentMethodId: testPaymentMethodId,
                description: 'Legitimate payment test',
                metadata: {
                    ipAddress: '192.168.1.100',
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                    timestamp: new Date().toISOString(),
                    sessionId: (0, uuid_1.v4)()
                }
            };
            const securityValidationResponse = await apiRequest('POST', '/payments/security/validate', legitimatePaymentData);
            (0, globals_1.expect)(securityValidationResponse.status).toBe(200);
            (0, globals_1.expect)(securityValidationResponse.data).toHaveProperty('riskScore');
            (0, globals_1.expect)(securityValidationResponse.data.riskScore).toBeLessThan(0.3);
            (0, globals_1.expect)(securityValidationResponse.data).toHaveProperty('status', 'approved');
            const suspiciousPaymentData = {
                customerId: testCustomerId,
                amount: 500000,
                currency: 'INR',
                paymentMethodId: testPaymentMethodId,
                description: 'Suspicious payment test',
                metadata: {
                    ipAddress: '192.168.1.1',
                    userAgent: 'curl/7.68.0',
                    timestamp: new Date().toISOString(),
                    sessionId: (0, uuid_1.v4)(),
                    rapidFireRequest: true,
                    velocityPattern: 'high'
                }
            };
            const suspiciousValidationResponse = await apiRequest('POST', '/payments/security/validate', suspiciousPaymentData);
            (0, globals_1.expect)(suspiciousValidationResponse.status).toBe(200);
            (0, globals_1.expect)(suspiciousValidationResponse.data).toHaveProperty('riskScore');
            (0, globals_1.expect)(suspiciousValidationResponse.data.riskScore).toBeGreaterThan(0.7);
            (0, globals_1.expect)(suspiciousValidationResponse.data).toHaveProperty('status', 'flagged');
            (0, globals_1.expect)(suspiciousValidationResponse.data).toHaveProperty('flags');
            (0, globals_1.expect)(suspiciousValidationResponse.data.flags).toContain('high_velocity');
            (0, globals_1.expect)(suspiciousValidationResponse.data.flags).toContain('suspicious_user_agent');
            console.log(`✅ Payment security validation completed`);
        });
        (0, globals_1.test)('should manage payment methods with encryption', async () => {
            console.log('💼 Testing payment method management...');
            const cardMethodData = {
                customerId: testCustomerId,
                type: 'card',
                card: {
                    number: '4111111111111111',
                    expiryMonth: 6,
                    expiryYear: 2026,
                    cvv: '456',
                    holderName: 'Test Card Holder'
                },
                isDefault: false
            };
            const netBankingMethodData = {
                customerId: testCustomerId,
                type: 'netbanking',
                netbanking: {
                    bankCode: 'SBIN',
                    accountType: 'savings'
                },
                isDefault: false
            };
            const upiMethodData = {
                customerId: testCustomerId,
                type: 'upi',
                upi: {
                    vpa: 'testuser@paytm'
                },
                isDefault: true
            };
            const cardResponse = await apiRequest('POST', '/payments/methods', cardMethodData);
            const netBankingResponse = await apiRequest('POST', '/payments/methods', netBankingMethodData);
            const upiResponse = await apiRequest('POST', '/payments/methods', upiMethodData);
            (0, globals_1.expect)(cardResponse.status).toBe(201);
            (0, globals_1.expect)(netBankingResponse.status).toBe(201);
            (0, globals_1.expect)(upiResponse.status).toBe(201);
            const cardMethodId = cardResponse.data.id;
            const upiMethodId = upiResponse.data.id;
            const listResponse = await apiRequest('GET', `/customers/${testCustomerId}/payment-methods`);
            (0, globals_1.expect)(listResponse.status).toBe(200);
            (0, globals_1.expect)(listResponse.data.length).toBe(3);
            const cardMethod = listResponse.data.find((m) => m.type === 'card');
            (0, globals_1.expect)(cardMethod.card.number).toMatch(/\*{12}\d{4}/);
            const updateData = {
                isDefault: true,
                billingAddress: {
                    line1: 'Updated Address',
                    city: 'UpdatedCity',
                    state: 'UpdatedState',
                    pincode: '654321'
                }
            };
            const updateResponse = await apiRequest('PUT', `/payments/methods/${cardMethodId}`, updateData);
            (0, globals_1.expect)(updateResponse.status).toBe(200);
            (0, globals_1.expect)(updateResponse.data.isDefault).toBe(true);
            const deleteResponse = await apiRequest('DELETE', `/payments/methods/${cardMethodId}`);
            (0, globals_1.expect)(deleteResponse.status).toBe(200);
            const listAfterDeleteResponse = await apiRequest('GET', `/customers/${testCustomerId}/payment-methods`);
            (0, globals_1.expect)(listAfterDeleteResponse.data.length).toBe(2);
            console.log(`✅ Payment method management completed`);
        });
        (0, globals_1.afterEach)(async () => {
            await cleanupPaymentData();
        });
    });
    (0, globals_1.describe)('Story 5.2: Subscription Billing Management', () => {
        (0, globals_1.beforeEach)(async () => {
            await cleanupSubscriptionData();
            const planResponse = await apiRequest('POST', '/subscription-plans', {
                schoolId: testSchoolId,
                name: 'Premium School Plan',
                description: 'Complete school management with premium features',
                pricing: {
                    model: 'per_student',
                    basePrice: 50000,
                    currency: 'INR',
                    billingCycle: 'monthly',
                    tiers: [
                        { min: 1, max: 50, pricePerUnit: 50000 },
                        { min: 51, max: 200, pricePerUnit: 45000 },
                        { min: 201, max: 1000, pricePerUnit: 40000 }
                    ]
                },
                features: {
                    studentManagement: true,
                    feeManagement: true,
                    rfidIntegration: true,
                    analyticsReports: true,
                    whatsappIntegration: true,
                    multipleLocations: true,
                    customBranding: true,
                    prioritySupport: true
                },
                limits: {
                    maxStudents: 1000,
                    maxUsers: 100,
                    maxLocations: 5,
                    storageGB: 100,
                    apiCallsPerMonth: 100000
                },
                trial: {
                    enabled: true,
                    durationDays: 14,
                    featuresIncluded: ['studentManagement', 'feeManagement']
                }
            });
            testSubscriptionPlanId = planResponse.data.id;
        });
        (0, globals_1.test)('should create and manage subscription lifecycle', async () => {
            console.log('📅 Testing subscription creation and management...');
            const subscriptionData = {
                schoolId: testSchoolId,
                customerId: testCustomerId,
                planId: testSubscriptionPlanId,
                billingCycle: 'monthly',
                startDate: new Date().toISOString(),
                quantity: 150,
                discounts: [
                    {
                        type: 'percentage',
                        value: 10,
                        description: 'Early adopter discount',
                        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ],
                metadata: {
                    salesChannel: 'direct',
                    referralCode: 'SCHOOL2024',
                    contractNumber: 'SCH-2024-001'
                },
                notifications: {
                    billingReminders: true,
                    usageAlerts: true,
                    renewalNotices: true,
                    channels: ['email', 'sms', 'whatsapp']
                }
            };
            const subscriptionResponse = await apiRequest('POST', '/subscriptions', subscriptionData);
            (0, globals_1.expect)(subscriptionResponse.status).toBe(201);
            (0, globals_1.expect)(subscriptionResponse.data).toHaveProperty('id');
            (0, globals_1.expect)(subscriptionResponse.data).toHaveProperty('status', 'trial');
            (0, globals_1.expect)(subscriptionResponse.data).toHaveProperty('planId', testSubscriptionPlanId);
            (0, globals_1.expect)(subscriptionResponse.data).toHaveProperty('quantity', 150);
            testSubscriptionId = subscriptionResponse.data.id;
            const updateSubData = {
                quantity: 175,
                addons: [
                    {
                        name: 'additional_storage',
                        quantity: 50,
                        price: 2000
                    }
                ]
            };
            const updateSubResponse = await apiRequest('PUT', `/subscriptions/${testSubscriptionId}`, updateSubData);
            (0, globals_1.expect)(updateSubResponse.status).toBe(200);
            (0, globals_1.expect)(updateSubResponse.data.quantity).toBe(175);
            const pauseResponse = await apiRequest('POST', `/subscriptions/${testSubscriptionId}/pause`, {
                reason: 'school_vacation',
                pauseUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                prorateBilling: true
            });
            (0, globals_1.expect)(pauseResponse.status).toBe(200);
            (0, globals_1.expect)(pauseResponse.data.status).toBe('paused');
            const resumeResponse = await apiRequest('POST', `/subscriptions/${testSubscriptionId}/resume`, {
                reason: 'school_reopened',
                adjustBilling: true
            });
            (0, globals_1.expect)(resumeResponse.status).toBe(200);
            (0, globals_1.expect)(resumeResponse.data.status).toBe('active');
            console.log(`✅ Subscription lifecycle management completed: ${testSubscriptionId}`);
        });
        (0, globals_1.test)('should automate subscription billing cycles', async () => {
            console.log('⚙️ Testing subscription billing automation...');
            const subscriptionResponse = await apiRequest('POST', '/subscriptions', {
                schoolId: testSchoolId,
                customerId: testCustomerId,
                planId: testSubscriptionPlanId,
                billingCycle: 'monthly',
                quantity: 100,
                autoRenewal: true
            });
            testSubscriptionId = subscriptionResponse.data.id;
            const billingData = {
                subscriptionIds: [testSubscriptionId],
                billingDate: new Date().toISOString(),
                options: {
                    generateInvoices: true,
                    processPayments: true,
                    sendNotifications: true,
                    handleFailures: true,
                    prorateBilling: true,
                    applyDiscounts: true,
                    calculateTax: true
                }
            };
            const billingResponse = await apiRequest('POST', '/subscriptions/billing/process', billingData);
            (0, globals_1.expect)(billingResponse.status).toBe(200);
            (0, globals_1.expect)(billingResponse.data).toHaveProperty('processed');
            (0, globals_1.expect)(billingResponse.data.processed.length).toBe(1);
            (0, globals_1.expect)(billingResponse.data.processed[0]).toHaveProperty('subscriptionId', testSubscriptionId);
            (0, globals_1.expect)(billingResponse.data.processed[0]).toHaveProperty('invoiceId');
            (0, globals_1.expect)(billingResponse.data.processed[0]).toHaveProperty('paymentId');
            const { invoiceId } = billingResponse.data.processed[0];
            const invoiceResponse = await apiRequest('GET', `/invoices/${invoiceId}`);
            (0, globals_1.expect)(invoiceResponse.status).toBe(200);
            (0, globals_1.expect)(invoiceResponse.data).toHaveProperty('subscriptionId', testSubscriptionId);
            (0, globals_1.expect)(invoiceResponse.data).toHaveProperty('status', 'sent');
            console.log(`✅ Subscription billing automation completed`);
        });
        (0, globals_1.test)('should track and bill usage-based metrics', async () => {
            console.log('📊 Testing usage-based billing...');
            const usagePlanResponse = await apiRequest('POST', '/subscription-plans', {
                schoolId: testSchoolId,
                name: 'Usage-Based Plan',
                description: 'Pay-as-you-use school management',
                pricing: {
                    model: 'usage_based',
                    basePrice: 10000,
                    currency: 'INR',
                    billingCycle: 'monthly',
                    usageMetrics: [
                        {
                            name: 'api_calls',
                            price: 1,
                            includedQuantity: 1000,
                            unit: 'request'
                        },
                        {
                            name: 'storage_gb',
                            price: 500,
                            includedQuantity: 10,
                            unit: 'gigabyte'
                        },
                        {
                            name: 'whatsapp_messages',
                            price: 50,
                            includedQuantity: 100,
                            unit: 'message'
                        }
                    ]
                }
            });
            const usageSubscriptionResponse = await apiRequest('POST', '/subscriptions', {
                schoolId: testSchoolId,
                customerId: testCustomerId,
                planId: usagePlanResponse.data.id,
                billingCycle: 'monthly',
                quantity: 1
            });
            const usageSubscriptionId = usageSubscriptionResponse.data.id;
            const usageEvents = [
                {
                    subscriptionId: usageSubscriptionId,
                    metric: 'api_calls',
                    quantity: 1500,
                    timestamp: new Date().toISOString(),
                    metadata: { endpoint: '/api/students/list', method: 'GET' }
                },
                {
                    subscriptionId: usageSubscriptionId,
                    metric: 'storage_gb',
                    quantity: 15.5,
                    timestamp: new Date().toISOString(),
                    metadata: { type: 'document_storage', location: 's3' }
                },
                {
                    subscriptionId: usageSubscriptionId,
                    metric: 'whatsapp_messages',
                    quantity: 250,
                    timestamp: new Date().toISOString(),
                    metadata: { template: 'payment_reminder', recipient_count: 250 }
                }
            ];
            for (const event of usageEvents) {
                const trackingResponse = await apiRequest('POST', '/subscriptions/usage/track', event);
                (0, globals_1.expect)(trackingResponse.status).toBe(200);
            }
            const usageResponse = await apiRequest('GET', `/subscriptions/${usageSubscriptionId}/usage`, {
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date().toISOString()
            });
            (0, globals_1.expect)(usageResponse.status).toBe(200);
            (0, globals_1.expect)(usageResponse.data).toHaveProperty('summary');
            (0, globals_1.expect)(usageResponse.data.summary).toHaveProperty('totalApiCalls', 1500);
            (0, globals_1.expect)(usageResponse.data.summary).toHaveProperty('totalStorageGB', 15.5);
            (0, globals_1.expect)(usageResponse.data.summary).toHaveProperty('totalWhatsappMessages', 250);
            (0, globals_1.expect)(usageResponse.data).toHaveProperty('billing');
            (0, globals_1.expect)(usageResponse.data.billing).toHaveProperty('overage');
            console.log(`✅ Usage-based billing completed`);
        });
        (0, globals_1.test)('should provide subscription analytics and insights', async () => {
            console.log('📈 Testing subscription analytics...');
            const analyticsResponse = await apiRequest('GET', `/subscription-plans/${testSubscriptionPlanId}/analytics`, {
                timeframe: 'last_30_days',
                metrics: [
                    'subscriber_count',
                    'revenue',
                    'churn_rate',
                    'customer_lifetime_value',
                    'trial_conversion_rate',
                    'usage_patterns',
                    'feature_adoption'
                ],
                segmentation: {
                    byTier: true,
                    byRegion: true,
                    bySchoolSize: true,
                    byUsagePattern: true
                }
            });
            (0, globals_1.expect)(analyticsResponse.status).toBe(200);
            (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('metrics');
            (0, globals_1.expect)(analyticsResponse.data.metrics).toHaveProperty('subscriberCount');
            (0, globals_1.expect)(analyticsResponse.data.metrics).toHaveProperty('totalRevenue');
            (0, globals_1.expect)(analyticsResponse.data.metrics).toHaveProperty('churnRate');
            (0, globals_1.expect)(analyticsResponse.data.metrics).toHaveProperty('averageLifetimeValue');
            (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('segmentation');
            (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('trends');
            (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('recommendations');
            console.log(`✅ Subscription analytics completed`);
        });
        (0, globals_1.test)('should handle subscription dunning and recovery', async () => {
            console.log('💰 Testing subscription dunning management...');
            const subscriptionResponse = await apiRequest('POST', '/subscriptions', {
                schoolId: testSchoolId,
                customerId: testCustomerId,
                planId: testSubscriptionPlanId,
                billingCycle: 'monthly',
                quantity: 75,
                simulate: {
                    paymentFailure: true,
                    failureReason: 'card_declined'
                }
            });
            testSubscriptionId = subscriptionResponse.data.id;
            await new Promise(resolve => setTimeout(resolve, 2000));
            const dunningData = {
                subscriptionIds: [testSubscriptionId],
                dunningConfig: {
                    maxAttempts: 4,
                    retrySchedule: [1, 3, 7, 14],
                    escalationActions: [
                        { day: 1, action: 'email_reminder' },
                        { day: 3, action: 'sms_reminder' },
                        { day: 7, action: 'phone_call' },
                        { day: 14, action: 'account_suspension' }
                    ],
                    gracePeriod: 3,
                    autoRecovery: true
                }
            };
            const dunningResponse = await apiRequest('POST', '/subscriptions/dunning/process', dunningData);
            (0, globals_1.expect)(dunningResponse.status).toBe(200);
            (0, globals_1.expect)(dunningResponse.data).toHaveProperty('processed');
            (0, globals_1.expect)(dunningResponse.data.processed.length).toBe(1);
            (0, globals_1.expect)(dunningResponse.data.processed[0]).toHaveProperty('subscriptionId', testSubscriptionId);
            (0, globals_1.expect)(dunningResponse.data.processed[0]).toHaveProperty('dunningStatus', 'initiated');
            (0, globals_1.expect)(dunningResponse.data.processed[0]).toHaveProperty('nextAttemptDate');
            const statusResponse = await apiRequest('GET', `/subscriptions/${testSubscriptionId}/dunning`);
            (0, globals_1.expect)(statusResponse.status).toBe(200);
            (0, globals_1.expect)(statusResponse.data).toHaveProperty('attemptCount');
            (0, globals_1.expect)(statusResponse.data).toHaveProperty('lastAttemptDate');
            (0, globals_1.expect)(statusResponse.data).toHaveProperty('nextAttemptDate');
            (0, globals_1.expect)(statusResponse.data).toHaveProperty('escalationLevel');
            console.log(`✅ Subscription dunning management completed`);
        });
        (0, globals_1.afterEach)(async () => {
            await cleanupSubscriptionData();
        });
    });
    (0, globals_1.describe)('Story 5.3: Automated Invoice Generation', () => {
        (0, globals_1.beforeEach)(async () => {
            await cleanupInvoiceData();
            const templateResponse = await apiRequest('POST', '/invoice-templates', {
                schoolId: testSchoolId,
                name: 'Standard Payment Invoice',
                type: 'payment',
                design: {
                    theme: 'professional',
                    colors: {
                        primary: '#2563eb',
                        secondary: '#64748b',
                        accent: '#f59e0b'
                    },
                    logo: {
                        url: 'https://example.com/school-logo.png',
                        position: 'top-left',
                        size: 'medium'
                    },
                    layout: 'standard'
                },
                content: {
                    header: {
                        schoolName: '{{school.name}}',
                        schoolAddress: '{{school.address}}',
                        contactInfo: '{{school.phone}} | {{school.email}}'
                    },
                    invoice: {
                        title: 'Payment Invoice',
                        numberFormat: 'INV-{{year}}-{{month}}-{{sequence}}',
                        dateFormat: 'DD/MM/YYYY',
                        dueDate: 'Due in {{dueDays}} days'
                    },
                    footer: {
                        thankYouNote: 'Thank you for your payment!',
                        terms: 'Payment is due within {{dueDays}} days of invoice date.',
                        support: 'For queries, contact {{school.supportEmail}}'
                    }
                },
                fields: {
                    required: ['studentName', 'class', 'feeType', 'amount', 'dueDate'],
                    optional: ['discount', 'lateFee', 'notes'],
                    custom: ['parentName', 'parentPhone', 'studentId']
                },
                automation: {
                    autoSend: true,
                    sendOn: 'creation',
                    reminders: {
                        enabled: true,
                        schedule: [7, 3, 1],
                        channels: ['email', 'sms']
                    }
                }
            });
            testInvoiceTemplateId = templateResponse.data.id;
        });
        (0, globals_1.test)('should generate invoices automatically from payments', async () => {
            console.log('📄 Testing automated invoice generation...');
            const paymentData = {
                customerId: testCustomerId,
                amount: 125000,
                currency: 'INR',
                paymentMethodId: testPaymentMethodId,
                description: 'School fees - Q1 2024',
                metadata: {
                    studentId: testStudentId,
                    feeType: 'tuition',
                    term: 'Q1-2024',
                    class: '10th Grade',
                    section: 'A'
                },
                invoice: {
                    generate: true,
                    templateId: testInvoiceTemplateId,
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    lineItems: [
                        {
                            description: 'Tuition Fee - Q1 2024',
                            quantity: 1,
                            unitPrice: 100000,
                            taxRate: 0.18,
                            discounts: []
                        },
                        {
                            description: 'Activity Fee',
                            quantity: 1,
                            unitPrice: 25000,
                            taxRate: 0.18,
                            discounts: []
                        }
                    ]
                }
            };
            const paymentResponse = await apiRequest('POST', '/payments/advanced', paymentData);
            testPaymentId = paymentResponse.data.id;
            await new Promise(resolve => setTimeout(resolve, 3000));
            const invoicesResponse = await apiRequest('GET', '/invoices', {
                paymentId: testPaymentId
            });
            (0, globals_1.expect)(invoicesResponse.status).toBe(200);
            (0, globals_1.expect)(invoicesResponse.data.length).toBe(1);
            const invoice = invoicesResponse.data[0];
            testInvoiceId = invoice.id;
            (0, globals_1.expect)(invoice).toHaveProperty('paymentId', testPaymentId);
            (0, globals_1.expect)(invoice).toHaveProperty('templateId', testInvoiceTemplateId);
            (0, globals_1.expect)(invoice).toHaveProperty('status', 'sent');
            (0, globals_1.expect)(invoice).toHaveProperty('totalAmount', 125000);
            (0, globals_1.expect)(invoice).toHaveProperty('lineItems');
            (0, globals_1.expect)(invoice.lineItems.length).toBe(2);
            const pdfResponse = await apiRequest('GET', `/invoices/${testInvoiceId}/pdf`);
            (0, globals_1.expect)(pdfResponse.status).toBe(200);
            (0, globals_1.expect)(pdfResponse.headers['content-type']).toContain('application/pdf');
            console.log(`✅ Automated invoice generation completed: ${testInvoiceId}`);
        });
        (0, globals_1.test)('should manage invoice templates with customization', async () => {
            console.log('📝 Testing invoice template management...');
            const getTemplateResponse = await apiRequest('GET', `/invoice-templates/${testInvoiceTemplateId}`);
            (0, globals_1.expect)(getTemplateResponse.status).toBe(200);
            (0, globals_1.expect)(getTemplateResponse.data).toHaveProperty('name', 'Standard Payment Invoice');
            const updateData = {
                name: 'Updated Payment Invoice Template',
                design: {
                    theme: 'modern',
                    colors: {
                        primary: '#059669',
                        secondary: '#6b7280',
                        accent: '#dc2626'
                    }
                },
                content: {
                    header: {
                        schoolName: '{{school.name}} - Updated',
                        schoolAddress: '{{school.fullAddress}}',
                        contactInfo: 'Email: {{school.email}} | Phone: {{school.phone}}'
                    }
                },
                automation: {
                    autoSend: true,
                    sendOn: 'payment_confirmation',
                    reminders: {
                        enabled: true,
                        schedule: [10, 5, 2, 1],
                        channels: ['email', 'sms', 'whatsapp']
                    }
                }
            };
            const updateTemplateResponse = await apiRequest('PUT', `/invoice-templates/${testInvoiceTemplateId}`, updateData);
            (0, globals_1.expect)(updateTemplateResponse.status).toBe(200);
            (0, globals_1.expect)(updateTemplateResponse.data.name).toBe('Updated Payment Invoice Template');
            (0, globals_1.expect)(updateTemplateResponse.data.design.theme).toBe('modern');
            const previewData = {
                templateId: testInvoiceTemplateId,
                sampleData: {
                    school: {
                        name: 'Preview Test School',
                        address: '123 Preview Street',
                        phone: '+91-9999999999',
                        email: 'preview@school.com'
                    },
                    student: {
                        name: 'Preview Student',
                        class: '10th Grade',
                        rollNumber: 'PV001'
                    },
                    payment: {
                        amount: 50000,
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                    }
                }
            };
            const previewResponse = await apiRequest('POST', `/invoice-templates/${testInvoiceTemplateId}/preview`, previewData);
            (0, globals_1.expect)(previewResponse.status).toBe(200);
            (0, globals_1.expect)(previewResponse.data).toHaveProperty('previewUrl');
            (0, globals_1.expect)(previewResponse.data).toHaveProperty('generatedHtml');
            console.log(`✅ Invoice template management completed`);
        });
        (0, globals_1.test)('should process bulk invoice generation efficiently', async () => {
            console.log('📦 Testing bulk invoice processing...');
            const studentIds = [];
            for (let i = 0; i < 10; i++) {
                const studentResponse = await apiRequest('POST', '/users', {
                    email: `bulkstudent${i}@payment-test.com`,
                    firstName: `BulkStudent${i}`,
                    lastName: 'TestSurname',
                    role: 'STUDENT',
                    schoolId: testSchoolId,
                    profile: {
                        class: '10th Grade',
                        section: 'B',
                        rollNumber: `BLK${String(i + 1).padStart(3, '0')}`,
                        parentId: testParentId
                    }
                });
                studentIds.push(studentResponse.data.id);
            }
            const bulkData = {
                schoolId: testSchoolId,
                templateId: testInvoiceTemplateId,
                invoices: studentIds.map((studentId, index) => ({
                    customerId: testCustomerId,
                    studentId,
                    amount: 75000 + (index * 5000),
                    currency: 'INR',
                    description: `Bulk payment ${index + 1} - School fees`,
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    lineItems: [
                        {
                            description: 'Tuition Fee',
                            quantity: 1,
                            unitPrice: 65000 + (index * 5000),
                            taxRate: 0.18
                        },
                        {
                            description: 'Activity Fee',
                            quantity: 1,
                            unitPrice: 10000,
                            taxRate: 0.18
                        }
                    ],
                    metadata: {
                        feeType: 'quarterly',
                        term: 'Q1-2024',
                        batch: `bulk_${Date.now()}`
                    }
                })),
                options: {
                    processAsync: true,
                    batchSize: 5,
                    generatePDF: true,
                    sendNotifications: true,
                    createPaymentIntents: true
                }
            };
            const bulkResponse = await apiRequest('POST', '/invoices/bulk/generate', bulkData);
            (0, globals_1.expect)(bulkResponse.status).toBe(202);
            (0, globals_1.expect)(bulkResponse.data).toHaveProperty('batchId');
            (0, globals_1.expect)(bulkResponse.data).toHaveProperty('totalInvoices', 10);
            (0, globals_1.expect)(bulkResponse.data).toHaveProperty('estimatedCompletionTime');
            const { batchId } = bulkResponse.data;
            let batchComplete = false;
            let pollAttempts = 0;
            const maxPollAttempts = 10;
            while (!batchComplete && pollAttempts < maxPollAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const statusResponse = await apiRequest('GET', `/invoices/bulk/status/${batchId}`);
                (0, globals_1.expect)(statusResponse.status).toBe(200);
                if (statusResponse.data.status === 'completed') {
                    batchComplete = true;
                    (0, globals_1.expect)(statusResponse.data).toHaveProperty('results');
                    (0, globals_1.expect)(statusResponse.data.results).toHaveProperty('successful', 10);
                    (0, globals_1.expect)(statusResponse.data.results).toHaveProperty('failed', 0);
                    (0, globals_1.expect)(statusResponse.data).toHaveProperty('invoiceIds');
                    (0, globals_1.expect)(statusResponse.data.invoiceIds.length).toBe(10);
                }
                pollAttempts++;
            }
            (0, globals_1.expect)(batchComplete).toBe(true);
            console.log(`✅ Bulk invoice processing completed: ${batchId}`);
        });
        (0, globals_1.afterEach)(async () => {
            await cleanupInvoiceData();
        });
    });
    (0, globals_1.describe)('Story 5.4: AI-Powered Payment Analytics & Reporting', () => {
        (0, globals_1.beforeEach)(async () => {
            await seedAnalyticsData();
        });
        (0, globals_1.test)('should generate comprehensive payment analytics', async () => {
            console.log('📊 Testing payment analytics engine...');
            const analyticsQuery = {
                schoolId: testSchoolId,
                timeframe: {
                    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString(),
                    granularity: 'daily'
                },
                metrics: [
                    'total_revenue',
                    'payment_volume',
                    'success_rate',
                    'average_transaction_value',
                    'payment_method_distribution',
                    'customer_segments',
                    'geographic_distribution',
                    'time_patterns',
                    'failure_analysis',
                    'churn_indicators'
                ],
                segments: {
                    byPaymentMethod: true,
                    byCustomerTier: true,
                    byGeography: true,
                    byTimeOfDay: true,
                    byDayOfWeek: true,
                    byFeeType: true
                },
                filters: {
                    minAmount: 1000,
                    maxAmount: 1000000,
                    paymentMethods: ['card', 'upi', 'netbanking'],
                    customerTypes: ['parent', 'school'],
                    includeRefunds: false
                }
            };
            const analyticsResponse = await apiRequest('POST', '/analytics/payments', analyticsQuery);
            (0, globals_1.expect)(analyticsResponse.status).toBe(200);
            (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('summary');
            (0, globals_1.expect)(analyticsResponse.data.summary).toHaveProperty('totalRevenue');
            (0, globals_1.expect)(analyticsResponse.data.summary).toHaveProperty('paymentVolume');
            (0, globals_1.expect)(analyticsResponse.data.summary).toHaveProperty('successRate');
            (0, globals_1.expect)(analyticsResponse.data.summary).toHaveProperty('averageTransactionValue');
            (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('timeSeries');
            (0, globals_1.expect)(analyticsResponse.data.timeSeries.length).toBeGreaterThan(0);
            (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('segments');
            (0, globals_1.expect)(analyticsResponse.data.segments).toHaveProperty('paymentMethods');
            (0, globals_1.expect)(analyticsResponse.data.segments).toHaveProperty('customerTiers');
            (0, globals_1.expect)(analyticsResponse.data.segments).toHaveProperty('geography');
            (0, globals_1.expect)(analyticsResponse.data).toHaveProperty('insights');
            (0, globals_1.expect)(analyticsResponse.data.insights).toHaveProperty('trends');
            (0, globals_1.expect)(analyticsResponse.data.insights).toHaveProperty('anomalies');
            (0, globals_1.expect)(analyticsResponse.data.insights).toHaveProperty('recommendations');
            console.log(`✅ Payment analytics engine completed`);
        });
        (0, globals_1.test)('should generate AI-powered revenue forecasts', async () => {
            console.log('🔮 Testing AI-powered revenue forecasting...');
            const forecastRequest = {
                schoolId: testSchoolId,
                forecastPeriod: {
                    duration: 12,
                    unit: 'months',
                    granularity: 'monthly'
                },
                models: {
                    primary: 'lstm_neural_network',
                    secondary: 'arima',
                    ensemble: true
                },
                factors: {
                    seasonality: true,
                    trends: true,
                    externalFactors: [
                        'academic_calendar',
                        'economic_indicators',
                        'competitive_landscape',
                        'demographic_changes'
                    ],
                    promotions: true,
                    churnPrediction: true
                },
                scenarios: {
                    baseline: true,
                    optimistic: true,
                    pessimistic: true,
                    customScenarios: [
                        {
                            name: 'new_campus_expansion',
                            assumptions: {
                                studentGrowth: 0.25,
                                feeIncrease: 0.1,
                                additionalCosts: 500000
                            }
                        }
                    ]
                },
                confidence: {
                    intervals: [0.8, 0.9, 0.95],
                    includeUncertainty: true
                }
            };
            const forecastResponse = await apiRequest('POST', '/analytics/revenue/forecast', forecastRequest);
            (0, globals_1.expect)(forecastResponse.status).toBe(200);
            (0, globals_1.expect)(forecastResponse.data).toHaveProperty('forecast');
            (0, globals_1.expect)(forecastResponse.data.forecast).toHaveProperty('baseline');
            (0, globals_1.expect)(forecastResponse.data.forecast).toHaveProperty('optimistic');
            (0, globals_1.expect)(forecastResponse.data.forecast).toHaveProperty('pessimistic');
            (0, globals_1.expect)(forecastResponse.data).toHaveProperty('models');
            (0, globals_1.expect)(forecastResponse.data.models).toHaveProperty('primary');
            (0, globals_1.expect)(forecastResponse.data.models.primary).toHaveProperty('accuracy');
            (0, globals_1.expect)(forecastResponse.data.models.primary.accuracy).toBeGreaterThan(0.7);
            (0, globals_1.expect)(forecastResponse.data).toHaveProperty('factors');
            (0, globals_1.expect)(forecastResponse.data.factors).toHaveProperty('seasonalityImpact');
            (0, globals_1.expect)(forecastResponse.data.factors).toHaveProperty('trendAnalysis');
            (0, globals_1.expect)(forecastResponse.data).toHaveProperty('recommendations');
            (0, globals_1.expect)(forecastResponse.data.recommendations.length).toBeGreaterThan(0);
            console.log(`✅ Revenue forecasting completed`);
        });
        (0, globals_1.test)('should calculate customer lifetime value with predictive modeling', async () => {
            console.log('💎 Testing customer lifetime value analysis...');
            const clvRequest = {
                customerId: testCustomerId,
                timeframe: 'all_time',
                predictionHorizon: {
                    duration: 24,
                    unit: 'months'
                },
                factors: {
                    paymentHistory: true,
                    engagementMetrics: true,
                    supportInteractions: true,
                    featureUsage: true,
                    churnProbability: true
                },
                segmentation: {
                    byTier: true,
                    bySchoolSize: true,
                    byPaymentBehavior: true,
                    byEngagement: true
                },
                models: {
                    historicalCLV: true,
                    predictiveCLV: true,
                    cohortAnalysis: true,
                    rfmAnalysis: true
                }
            };
            const clvResponse = await apiRequest('POST', `/analytics/clv/${testCustomerId}`, clvRequest);
            (0, globals_1.expect)(clvResponse.status).toBe(200);
            (0, globals_1.expect)(clvResponse.data).toHaveProperty('customerId', testCustomerId);
            (0, globals_1.expect)(clvResponse.data).toHaveProperty('historicalClv');
            (0, globals_1.expect)(clvResponse.data.historicalClv).toHaveProperty('totalRevenue');
            (0, globals_1.expect)(clvResponse.data.historicalClv).toHaveProperty('averageOrderValue');
            (0, globals_1.expect)(clvResponse.data.historicalClv).toHaveProperty('purchaseFrequency');
            (0, globals_1.expect)(clvResponse.data.historicalClv).toHaveProperty('customerLifespan');
            (0, globals_1.expect)(clvResponse.data).toHaveProperty('predictiveClv');
            (0, globals_1.expect)(clvResponse.data.predictiveClv).toHaveProperty('predictedValue');
            (0, globals_1.expect)(clvResponse.data.predictiveClv).toHaveProperty('confidenceInterval');
            (0, globals_1.expect)(clvResponse.data.predictiveClv).toHaveProperty('churnProbability');
            (0, globals_1.expect)(clvResponse.data).toHaveProperty('segmentation');
            (0, globals_1.expect)(clvResponse.data.segmentation).toHaveProperty('tier');
            (0, globals_1.expect)(clvResponse.data.segmentation).toHaveProperty('behavior');
            (0, globals_1.expect)(clvResponse.data).toHaveProperty('recommendations');
            (0, globals_1.expect)(clvResponse.data.recommendations).toHaveProperty('retentionStrategies');
            (0, globals_1.expect)(clvResponse.data.recommendations).toHaveProperty('upsellOpportunities');
            console.log(`✅ Customer lifetime value analysis completed`);
        });
        (0, globals_1.test)('should predict customer churn with prevention strategies', async () => {
            console.log('🔍 Testing churn prediction and prevention...');
            const churnRequest = {
                schoolId: testSchoolId,
                analysisType: 'comprehensive',
                timeframe: {
                    training: '12_months',
                    prediction: '6_months'
                },
                features: {
                    paymentBehavior: true,
                    usagePatterns: true,
                    supportInteractions: true,
                    featureAdoption: true,
                    engagementMetrics: true,
                    seasonalFactors: true
                },
                models: {
                    primary: 'gradient_boosting',
                    secondary: 'random_forest',
                    ensemble: true
                },
                segments: {
                    riskLevel: ['low', 'medium', 'high', 'critical'],
                    customerType: ['new', 'growing', 'mature', 'declining'],
                    schoolSize: ['small', 'medium', 'large', 'enterprise']
                },
                interventions: {
                    generateStrategies: true,
                    personalizeRecommendations: true,
                    prioritizeActions: true,
                    estimateImpact: true
                }
            };
            const churnResponse = await apiRequest('POST', '/analytics/churn/predict', churnRequest);
            (0, globals_1.expect)(churnResponse.status).toBe(200);
            (0, globals_1.expect)(churnResponse.data).toHaveProperty('predictions');
            (0, globals_1.expect)(churnResponse.data.predictions).toHaveProperty('overall');
            (0, globals_1.expect)(churnResponse.data.predictions.overall).toHaveProperty('churnRate');
            (0, globals_1.expect)(churnResponse.data.predictions.overall).toHaveProperty('confidenceScore');
            (0, globals_1.expect)(churnResponse.data).toHaveProperty('riskSegments');
            (0, globals_1.expect)(churnResponse.data.riskSegments).toHaveProperty('high');
            (0, globals_1.expect)(churnResponse.data.riskSegments).toHaveProperty('medium');
            (0, globals_1.expect)(churnResponse.data.riskSegments).toHaveProperty('low');
            (0, globals_1.expect)(churnResponse.data).toHaveProperty('features');
            (0, globals_1.expect)(churnResponse.data.features).toHaveProperty('importance');
            (0, globals_1.expect)(churnResponse.data.features.importance.length).toBeGreaterThan(0);
            (0, globals_1.expect)(churnResponse.data).toHaveProperty('interventions');
            (0, globals_1.expect)(churnResponse.data.interventions).toHaveProperty('strategies');
            (0, globals_1.expect)(churnResponse.data.interventions.strategies.length).toBeGreaterThan(0);
            const interventionResponse = await apiRequest('POST', '/analytics/churn/interventions', {
                customerId: testCustomerId,
                strategies: churnResponse.data.interventions.strategies.slice(0, 2),
                schedule: {
                    immediate: ['personalized_offer'],
                    delayed: ['engagement_campaign']
                }
            });
            (0, globals_1.expect)(interventionResponse.status).toBe(200);
            (0, globals_1.expect)(interventionResponse.data).toHaveProperty('executed');
            (0, globals_1.expect)(interventionResponse.data.executed.length).toBeGreaterThan(0);
            console.log(`✅ Churn prediction and prevention completed`);
        });
        (0, globals_1.test)('should generate comprehensive financial reports', async () => {
            console.log('📋 Testing financial reporting and compliance...');
            const reportRequest = {
                schoolId: testSchoolId,
                reportType: 'comprehensive_financial',
                timeframe: {
                    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString(),
                    comparePrevious: true
                },
                sections: {
                    revenueAnalysis: true,
                    paymentAnalysis: true,
                    subscriptionAnalysis: true,
                    refundAnalysis: true,
                    taxAnalysis: true,
                    complianceCheck: true,
                    forecasting: true,
                    recommendations: true
                },
                formats: ['pdf', 'excel', 'json'],
                compliance: {
                    standards: ['GST', 'IFRS', 'GAAP'],
                    auditTrail: true,
                    digitalSignature: true,
                    watermark: true
                },
                distribution: {
                    recipients: ['finance@school.com', 'admin@school.com'],
                    schedule: {
                        frequency: 'monthly',
                        dayOfMonth: 1,
                        timezone: 'Asia/Kolkata'
                    },
                    secure: true
                }
            };
            const reportResponse = await apiRequest('POST', '/reports/financial', reportRequest);
            (0, globals_1.expect)(reportResponse.status).toBe(200);
            (0, globals_1.expect)(reportResponse.data).toHaveProperty('reportId');
            (0, globals_1.expect)(reportResponse.data).toHaveProperty('status', 'generated');
            (0, globals_1.expect)(reportResponse.data).toHaveProperty('sections');
            const { reportId } = reportResponse.data;
            (0, globals_1.expect)(reportResponse.data.sections).toHaveProperty('revenueAnalysis');
            (0, globals_1.expect)(reportResponse.data.sections.revenueAnalysis).toHaveProperty('totalRevenue');
            (0, globals_1.expect)(reportResponse.data.sections.revenueAnalysis).toHaveProperty('revenueGrowth');
            (0, globals_1.expect)(reportResponse.data.sections).toHaveProperty('paymentAnalysis');
            (0, globals_1.expect)(reportResponse.data.sections.paymentAnalysis).toHaveProperty('successRate');
            (0, globals_1.expect)(reportResponse.data.sections.paymentAnalysis).toHaveProperty('failureReasons');
            (0, globals_1.expect)(reportResponse.data.sections).toHaveProperty('complianceCheck');
            (0, globals_1.expect)(reportResponse.data.sections.complianceCheck).toHaveProperty('gstCompliance');
            (0, globals_1.expect)(reportResponse.data.sections.complianceCheck).toHaveProperty('auditReadiness');
            const pdfResponse = await apiRequest('GET', `/reports/${reportId}/download`, {
                format: 'pdf'
            });
            (0, globals_1.expect)(pdfResponse.status).toBe(200);
            const excelResponse = await apiRequest('GET', `/reports/${reportId}/download`, {
                format: 'excel'
            });
            (0, globals_1.expect)(excelResponse.status).toBe(200);
            console.log(`✅ Financial reporting completed: ${reportId}`);
        });
        (0, globals_1.test)('should detect fraud patterns with machine learning', async () => {
            console.log('🕵️ Testing fraud detection and risk assessment...');
            const suspiciousPatterns = [
                {
                    customerId: testCustomerId,
                    amount: 999999,
                    frequency: 'rapid',
                    location: 'unusual',
                    device: 'new',
                    behavior: 'anomalous'
                }
            ];
            const fraudDetectionRequest = {
                schoolId: testSchoolId,
                analysisType: 'real_time',
                transactions: suspiciousPatterns,
                models: {
                    rulesBased: true,
                    machineLearning: true,
                    anomalyDetection: true,
                    networkAnalysis: true
                },
                sensitivity: 'high',
                features: [
                    'transaction_amount',
                    'transaction_frequency',
                    'device_fingerprint',
                    'ip_geolocation',
                    'user_behavior',
                    'time_patterns',
                    'network_analysis',
                    'velocity_checking'
                ],
                response: {
                    realTimeBlocking: true,
                    alertGeneration: true,
                    riskScoring: true,
                    recommendActions: true
                }
            };
            const fraudResponse = await apiRequest('POST', '/analytics/fraud/detect', fraudDetectionRequest);
            (0, globals_1.expect)(fraudResponse.status).toBe(200);
            (0, globals_1.expect)(fraudResponse.data).toHaveProperty('results');
            (0, globals_1.expect)(fraudResponse.data.results.length).toBe(1);
            const fraudResult = fraudResponse.data.results[0];
            (0, globals_1.expect)(fraudResult).toHaveProperty('riskScore');
            (0, globals_1.expect)(fraudResult.riskScore).toBeGreaterThan(0.8);
            (0, globals_1.expect)(fraudResult).toHaveProperty('riskLevel', 'high');
            (0, globals_1.expect)(fraudResult).toHaveProperty('flags');
            (0, globals_1.expect)(fraudResult.flags).toContain('unusual_amount');
            (0, globals_1.expect)(fraudResult.flags).toContain('high_velocity');
            (0, globals_1.expect)(fraudResult).toHaveProperty('recommendation');
            (0, globals_1.expect)(fraudResult.recommendation).toHaveProperty('action', 'block');
            (0, globals_1.expect)(fraudResult.recommendation).toHaveProperty('confidence');
            (0, globals_1.expect)(fraudResponse.data).toHaveProperty('models');
            (0, globals_1.expect)(fraudResponse.data.models).toHaveProperty('consensus');
            (0, globals_1.expect)(fraudResponse.data.models).toHaveProperty('individual');
            const learningResponse = await apiRequest('POST', '/analytics/fraud/learn', {
                transactionId: 'suspicious_transaction_123',
                actualFraud: true,
                feedbackType: 'confirmed_fraud',
                metadata: {
                    investigationId: (0, uuid_1.v4)(),
                    confirmedBy: 'security_team',
                    evidenceType: 'chargeback_received'
                }
            });
            (0, globals_1.expect)(learningResponse.status).toBe(200);
            (0, globals_1.expect)(learningResponse.data).toHaveProperty('modelUpdated', true);
            console.log(`✅ Fraud detection completed`);
        });
        (0, globals_1.test)('should monitor payment system performance', async () => {
            console.log('⚡ Testing payment performance monitoring...');
            const loadTestResults = await performLoadTest('Payment Processing Load Test', async () => {
                const response = await apiRequest('POST', '/payments/advanced', {
                    customerId: testCustomerId,
                    amount: Math.floor(Math.random() * 100000) + 10000,
                    currency: 'INR',
                    paymentMethodId: testPaymentMethodId,
                    description: 'Load test payment'
                });
                return response;
            }, {
                concurrency: 25,
                duration: 30000,
                rampUp: 5000
            });
            (0, globals_1.expect)(loadTestResults.requestsCompleted).toBeGreaterThan(20);
            (0, globals_1.expect)(loadTestResults.averageResponseTime).toBeLessThan(TEST_CONFIG.performanceThresholds.responseTime);
            (0, globals_1.expect)(loadTestResults.errorRate).toBeLessThan(TEST_CONFIG.performanceThresholds.errorRate);
            (0, globals_1.expect)(loadTestResults.throughput).toBeGreaterThan(TEST_CONFIG.performanceThresholds.throughput);
            const performanceRequest = {
                schoolId: testSchoolId,
                timeframe: {
                    start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString(),
                    granularity: 'minute'
                },
                metrics: [
                    'response_time',
                    'throughput',
                    'error_rate',
                    'success_rate',
                    'gateway_performance',
                    'database_performance',
                    'cache_performance',
                    'queue_performance'
                ],
                analysis: {
                    percentiles: [50, 90, 95, 99],
                    trending: true,
                    anomalies: true,
                    bottlenecks: true,
                    optimization: true
                }
            };
            const performanceResponse = await apiRequest('POST', '/analytics/performance/payments', performanceRequest);
            (0, globals_1.expect)(performanceResponse.status).toBe(200);
            (0, globals_1.expect)(performanceResponse.data).toHaveProperty('metrics');
            (0, globals_1.expect)(performanceResponse.data.metrics).toHaveProperty('responseTime');
            (0, globals_1.expect)(performanceResponse.data.metrics.responseTime).toHaveProperty('p95');
            (0, globals_1.expect)(performanceResponse.data.metrics.responseTime.p95).toBeLessThan(3000);
            (0, globals_1.expect)(performanceResponse.data).toHaveProperty('bottlenecks');
            (0, globals_1.expect)(performanceResponse.data).toHaveProperty('recommendations');
            (0, globals_1.expect)(performanceResponse.data.recommendations.length).toBeGreaterThan(0);
            console.log(`✅ Performance monitoring completed`);
            console.log(`📊 Load test results: ${loadTestResults.requestsCompleted} requests, ${loadTestResults.averageResponseTime}ms avg response time`);
        });
        (0, globals_1.afterEach)(async () => {
            await cleanupAnalyticsData();
        });
    });
    (0, globals_1.describe)('Cross-Story Integration Tests', () => {
        (0, globals_1.test)('should handle complete payment ecosystem workflow', async () => {
            console.log('🌟 Testing complete payment ecosystem integration...');
            const subscriptionResponse = await apiRequest('POST', '/subscriptions', {
                schoolId: testSchoolId,
                customerId: testCustomerId,
                planId: testSubscriptionPlanId,
                billingCycle: 'monthly',
                quantity: 200,
                trial: {
                    enabled: true,
                    durationDays: 14
                }
            });
            testSubscriptionId = subscriptionResponse.data.id;
            const paymentResponse = await apiRequest('POST', '/payments/advanced', {
                customerId: testCustomerId,
                amount: 200000,
                currency: 'INR',
                paymentMethodId: testPaymentMethodId,
                description: 'One-time setup fee',
                metadata: {
                    subscriptionId: testSubscriptionId,
                    paymentType: 'setup_fee'
                }
            });
            testPaymentId = paymentResponse.data.id;
            const invoiceResponse = await apiRequest('POST', '/invoices/generate', {
                paymentId: testPaymentId,
                templateId: testInvoiceTemplateId,
                options: {
                    sendImmediately: true,
                    includeTax: true,
                    watermark: true
                }
            });
            testInvoiceId = invoiceResponse.data.id;
            const conversionResponse = await apiRequest('POST', `/subscriptions/${testSubscriptionId}/convert`, {
                reason: 'trial_completed',
                billingCycle: 'monthly',
                discounts: [
                    {
                        type: 'percentage',
                        value: 15,
                        description: 'Trial conversion discount',
                        durationMonths: 3
                    }
                ]
            });
            (0, globals_1.expect)(conversionResponse.status).toBe(200);
            (0, globals_1.expect)(conversionResponse.data.status).toBe('active');
            const analyticsResponse = await apiRequest('POST', '/analytics/payments', {
                schoolId: testSchoolId,
                timeframe: {
                    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString()
                },
                includeSubscriptions: true,
                includeOneTimePayments: true
            });
            (0, globals_1.expect)(analyticsResponse.status).toBe(200);
            (0, globals_1.expect)(analyticsResponse.data.summary.totalRevenue).toBeGreaterThan(0);
            const auditResponse = await apiRequest('GET', '/audit/ecosystem', {
                entityId: testCustomerId,
                entityType: 'customer',
                timeframe: {
                    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString()
                },
                includeRelated: true
            });
            (0, globals_1.expect)(auditResponse.status).toBe(200);
            (0, globals_1.expect)(auditResponse.data).toHaveProperty('events');
            (0, globals_1.expect)(auditResponse.data.events.length).toBeGreaterThan(5);
            const eventTypes = auditResponse.data.events.map((e) => e.eventType);
            (0, globals_1.expect)(eventTypes).toContain('subscription_created');
            (0, globals_1.expect)(eventTypes).toContain('payment_processed');
            (0, globals_1.expect)(eventTypes).toContain('invoice_generated');
            (0, globals_1.expect)(eventTypes).toContain('subscription_converted');
            console.log(`✅ Complete payment ecosystem workflow completed`);
        });
        (0, globals_1.test)('should handle payment failure and recovery across systems', async () => {
            console.log('🔄 Testing payment failure recovery across ecosystem...');
            const subscriptionResponse = await apiRequest('POST', '/subscriptions', {
                schoolId: testSchoolId,
                customerId: testCustomerId,
                planId: testSubscriptionPlanId,
                billingCycle: 'monthly',
                quantity: 100,
                simulate: {
                    paymentFailure: true,
                    failureType: 'card_expired'
                }
            });
            testSubscriptionId = subscriptionResponse.data.id;
            await new Promise(resolve => setTimeout(resolve, 3000));
            const statusResponse = await apiRequest('GET', `/subscriptions/${testSubscriptionId}`);
            (0, globals_1.expect)(statusResponse.data.status).toBe('past_due');
            const dunningResponse = await apiRequest('POST', '/subscriptions/dunning/process', {
                subscriptionIds: [testSubscriptionId],
                dunningConfig: {
                    maxAttempts: 3,
                    retrySchedule: [1, 3, 7],
                    gracePeriod: 2
                }
            });
            (0, globals_1.expect)(dunningResponse.status).toBe(200);
            const newMethodResponse = await apiRequest('POST', '/payments/methods', {
                customerId: testCustomerId,
                type: 'card',
                card: {
                    number: '4111111111111111',
                    expiryMonth: 12,
                    expiryYear: 2026,
                    cvv: '123',
                    holderName: 'Test Updated Card'
                },
                isDefault: true
            });
            const retryResponse = await apiRequest('POST', `/subscriptions/${testSubscriptionId}/retry-payment`, {
                paymentMethodId: newMethodResponse.data.id
            });
            (0, globals_1.expect)(retryResponse.status).toBe(200);
            (0, globals_1.expect)(retryResponse.data.status).toBe('processing');
            await new Promise(resolve => setTimeout(resolve, 3000));
            const recoveredStatusResponse = await apiRequest('GET', `/subscriptions/${testSubscriptionId}`);
            (0, globals_1.expect)(recoveredStatusResponse.data.status).toBe('active');
            const recoveryAnalyticsResponse = await apiRequest('GET', `/analytics/recovery/${testSubscriptionId}`);
            (0, globals_1.expect)(recoveryAnalyticsResponse.status).toBe(200);
            (0, globals_1.expect)(recoveryAnalyticsResponse.data).toHaveProperty('recoveryTimeline');
            (0, globals_1.expect)(recoveryAnalyticsResponse.data).toHaveProperty('actionsRequired');
            (0, globals_1.expect)(recoveryAnalyticsResponse.data).toHaveProperty('successFactors');
            console.log(`✅ Payment failure recovery across ecosystem completed`);
        });
    });
    (0, globals_1.describe)('Performance and Scalability Tests', () => {
        (0, globals_1.test)('should handle concurrent payment processing', async () => {
            console.log('🚀 Testing concurrent payment processing...');
            const concurrentPayments = Array.from({ length: 20 }, (_, index) => ({
                customerId: testCustomerId,
                amount: 50000 + (index * 1000),
                currency: 'INR',
                paymentMethodId: testPaymentMethodId,
                description: `Concurrent payment ${index + 1}`,
                metadata: {
                    batchId: `concurrent_${Date.now()}`,
                    index
                }
            }));
            const startTime = Date.now();
            const paymentPromises = concurrentPayments.map(payment => apiRequest('POST', '/payments/advanced', payment));
            const results = await Promise.allSettled(paymentPromises);
            const processingTime = Date.now() - startTime;
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            (0, globals_1.expect)(successful).toBeGreaterThan(15);
            (0, globals_1.expect)(processingTime).toBeLessThan(30000);
            console.log(`✅ Concurrent processing: ${successful}/${concurrentPayments.length} successful in ${processingTime}ms`);
        });
        (0, globals_1.test)('should maintain database consistency under load', async () => {
            console.log('🔒 Testing database consistency under load...');
            const subscriptionPromises = Array.from({ length: 10 }, (_, index) => apiRequest('POST', '/subscriptions', {
                schoolId: testSchoolId,
                customerId: testCustomerId,
                planId: testSubscriptionPlanId,
                billingCycle: 'monthly',
                quantity: 50 + index,
                metadata: { concurrencyTest: true, index }
            }));
            const subscriptionResults = await Promise.allSettled(subscriptionPromises);
            const successfulSubscriptions = subscriptionResults
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value.data.id);
            for (const subscriptionId of successfulSubscriptions) {
                const subscriptionResponse = await apiRequest('GET', `/subscriptions/${subscriptionId}`);
                (0, globals_1.expect)(subscriptionResponse.status).toBe(200);
                (0, globals_1.expect)(subscriptionResponse.data).toHaveProperty('id', subscriptionId);
                (0, globals_1.expect)(subscriptionResponse.data).toHaveProperty('schoolId', testSchoolId);
            }
            const allSubscriptionsResponse = await apiRequest('GET', '/subscriptions', {
                schoolId: testSchoolId,
                metadata: { concurrencyTest: true }
            });
            const subscriptionIds = allSubscriptionsResponse.data.map((s) => s.id);
            const uniqueIds = new Set(subscriptionIds);
            (0, globals_1.expect)(uniqueIds.size).toBe(subscriptionIds.length);
            console.log(`✅ Database consistency maintained under load`);
        });
    });
    (0, globals_1.describe)('Security and Compliance Tests', () => {
        (0, globals_1.test)('should enforce payment data encryption', async () => {
            console.log('🔐 Testing payment data encryption...');
            const sensitivePaymentData = {
                customerId: testCustomerId,
                amount: 100000,
                currency: 'INR',
                paymentMethod: {
                    type: 'card',
                    card: {
                        number: '4111111111111111',
                        expiryMonth: 12,
                        expiryYear: 2025,
                        cvv: '123',
                        holderName: 'Sensitive Test Card'
                    }
                },
                billingAddress: {
                    line1: '123 Sensitive Street',
                    city: 'PrivateCity',
                    state: 'SecureState',
                    pincode: '123456'
                }
            };
            const paymentResponse = await apiRequest('POST', '/payments/advanced', sensitivePaymentData);
            testPaymentId = paymentResponse.data.id;
            const storedPaymentResponse = await apiRequest('GET', `/payments/advanced/${testPaymentId}`);
            (0, globals_1.expect)(storedPaymentResponse.data.paymentMethod.card.number).toMatch(/\*{12}\d{4}/);
            (0, globals_1.expect)(storedPaymentResponse.data.paymentMethod.card).not.toHaveProperty('cvv');
            const encryptionTestResponse = await apiRequest('GET', `/security/encryption/verify/${testPaymentId}`);
            (0, globals_1.expect)(encryptionTestResponse.status).toBe(200);
            (0, globals_1.expect)(encryptionTestResponse.data).toHaveProperty('encrypted', true);
            (0, globals_1.expect)(encryptionTestResponse.data).toHaveProperty('algorithm', 'AES-256-GCM');
            (0, globals_1.expect)(encryptionTestResponse.data).toHaveProperty('keyRotation', true);
            console.log(`✅ Payment data encryption verified`);
        });
        (0, globals_1.test)('should comply with PCI DSS requirements', async () => {
            console.log('🛡️ Testing PCI DSS compliance...');
            const complianceResponse = await apiRequest('GET', '/compliance/pci-dss/status', {
                schoolId: testSchoolId
            });
            (0, globals_1.expect)(complianceResponse.status).toBe(200);
            (0, globals_1.expect)(complianceResponse.data).toHaveProperty('level', 'SAQ-A');
            (0, globals_1.expect)(complianceResponse.data).toHaveProperty('requirements');
            const { requirements } = complianceResponse.data;
            (0, globals_1.expect)(requirements).toHaveProperty('dataEncryption', 'compliant');
            (0, globals_1.expect)(requirements).toHaveProperty('accessControl', 'compliant');
            (0, globals_1.expect)(requirements).toHaveProperty('networkSecurity', 'compliant');
            (0, globals_1.expect)(requirements).toHaveProperty('vulnerabilityManagement', 'compliant');
            (0, globals_1.expect)(requirements).toHaveProperty('securityTesting', 'compliant');
            (0, globals_1.expect)(requirements).toHaveProperty('securityPolicies', 'compliant');
            console.log(`✅ PCI DSS compliance verified`);
        });
        (0, globals_1.test)('should maintain audit trails for compliance', async () => {
            console.log('📋 Testing compliance audit trails...');
            const operations = [
                { action: 'create_payment', endpoint: '/payments/advanced' },
                { action: 'update_subscription', endpoint: `/subscriptions/${testSubscriptionId}` },
                { action: 'generate_invoice', endpoint: '/invoices/generate' },
                { action: 'process_refund', endpoint: `/payments/${testPaymentId}/refund` }
            ];
            for (const operation of operations) {
                const auditResponse = await apiRequest('GET', '/audit/search', {
                    action: operation.action,
                    schoolId: testSchoolId,
                    timeframe: {
                        start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                        end: new Date().toISOString()
                    }
                });
                (0, globals_1.expect)(auditResponse.status).toBe(200);
                (0, globals_1.expect)(auditResponse.data.events.length).toBeGreaterThan(0);
                const auditEvent = auditResponse.data.events[0];
                (0, globals_1.expect)(auditEvent).toHaveProperty('timestamp');
                (0, globals_1.expect)(auditEvent).toHaveProperty('action', operation.action);
                (0, globals_1.expect)(auditEvent).toHaveProperty('userId');
                (0, globals_1.expect)(auditEvent).toHaveProperty('schoolId', testSchoolId);
                (0, globals_1.expect)(auditEvent).toHaveProperty('ipAddress');
                (0, globals_1.expect)(auditEvent).toHaveProperty('userAgent');
                (0, globals_1.expect)(auditEvent).toHaveProperty('outcome');
            }
            const auditReportResponse = await apiRequest('POST', '/audit/reports/compliance', {
                schoolId: testSchoolId,
                reportType: 'payment_compliance',
                timeframe: {
                    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    end: new Date().toISOString()
                },
                standards: ['PCI_DSS', 'GDPR', 'SOX', 'HIPAA'],
                includeRecommendations: true
            });
            (0, globals_1.expect)(auditReportResponse.status).toBe(200);
            (0, globals_1.expect)(auditReportResponse.data).toHaveProperty('compliance');
            (0, globals_1.expect)(auditReportResponse.data.compliance).toHaveProperty('overallScore');
            (0, globals_1.expect)(auditReportResponse.data.compliance.overallScore).toBeGreaterThan(0.9);
            console.log(`✅ Compliance audit trails verified`);
        });
    });
    (0, globals_1.describe)('Webhook Integration Tests', () => {
        (0, globals_1.test)('should process Razorpay webhooks correctly', async () => {
            console.log('🔗 Testing Razorpay webhook processing...');
            const razorpayEvents = [
                {
                    event: 'payment.captured',
                    payload: {
                        payment: {
                            id: 'pay_test_12345',
                            amount: 75000,
                            currency: 'INR',
                            status: 'captured',
                            order_id: 'order_test_12345',
                            method: 'card',
                            captured: true,
                            card: {
                                id: 'card_test_12345',
                                network: 'Visa',
                                last4: '1111',
                                type: 'credit'
                            },
                            acquirer_data: {
                                rrn: '123456789012'
                            },
                            created_at: Math.floor(Date.now() / 1000)
                        }
                    }
                },
                {
                    event: 'payment.failed',
                    payload: {
                        payment: {
                            id: 'pay_test_failed',
                            amount: 50000,
                            currency: 'INR',
                            status: 'failed',
                            error_code: 'GATEWAY_ERROR',
                            error_description: 'Payment processing failed',
                            created_at: Math.floor(Date.now() / 1000)
                        }
                    }
                }
            ];
            for (const webhookEvent of razorpayEvents) {
                const webhookResponse = await simulateWebhook('razorpay', webhookEvent.event, webhookEvent.payload);
                (0, globals_1.expect)(webhookResponse.status).toBe(200);
                await new Promise(resolve => setTimeout(resolve, 1000));
                const processedResponse = await apiRequest('GET', '/webhooks/processed', {
                    gateway: 'razorpay',
                    eventId: webhookEvent.payload.payment.id
                });
                (0, globals_1.expect)(processedResponse.status).toBe(200);
                (0, globals_1.expect)(processedResponse.data).toHaveProperty('processed', true);
                (0, globals_1.expect)(processedResponse.data).toHaveProperty('actions');
            }
            console.log(`✅ Razorpay webhook processing completed`);
        });
        (0, globals_1.test)('should process Stripe webhooks correctly', async () => {
            console.log('💳 Testing Stripe webhook processing...');
            const stripeEvents = [
                {
                    event: 'payment_intent.succeeded',
                    payload: {
                        id: 'pi_test_12345',
                        object: 'payment_intent',
                        amount: 80000,
                        currency: 'inr',
                        status: 'succeeded',
                        metadata: {
                            schoolId: testSchoolId,
                            customerId: testCustomerId
                        },
                        charges: {
                            data: [{
                                    id: 'ch_test_12345',
                                    amount: 80000,
                                    currency: 'inr',
                                    status: 'succeeded',
                                    payment_method: 'pm_test_card'
                                }]
                        }
                    }
                },
                {
                    event: 'invoice.payment_succeeded',
                    payload: {
                        id: 'in_test_12345',
                        object: 'invoice',
                        amount_paid: 125000,
                        currency: 'inr',
                        status: 'paid',
                        subscription: 'sub_test_12345',
                        metadata: {
                            schoolId: testSchoolId
                        }
                    }
                }
            ];
            for (const webhookEvent of stripeEvents) {
                const webhookResponse = await simulateWebhook('stripe', webhookEvent.event, webhookEvent.payload);
                (0, globals_1.expect)(webhookResponse.status).toBe(200);
                await new Promise(resolve => setTimeout(resolve, 1000));
                const processedResponse = await apiRequest('GET', '/webhooks/processed', {
                    gateway: 'stripe',
                    eventId: webhookEvent.payload.id
                });
                (0, globals_1.expect)(processedResponse.status).toBe(200);
                (0, globals_1.expect)(processedResponse.data).toHaveProperty('processed', true);
            }
            console.log(`✅ Stripe webhook processing completed`);
        });
    });
    (0, globals_1.describe)('Error Handling and Edge Cases', () => {
        (0, globals_1.test)('should handle payment gateway timeouts', async () => {
            console.log('⏱️ Testing payment gateway timeout handling...');
            const timeoutPaymentData = {
                customerId: testCustomerId,
                amount: 60000,
                currency: 'INR',
                paymentMethodId: testPaymentMethodId,
                description: 'Timeout test payment',
                simulate: {
                    gatewayTimeout: true,
                    timeoutDuration: 30000
                }
            };
            const paymentResponse = await apiRequest('POST', '/payments/advanced', timeoutPaymentData, undefined, {
                timeout: 35000,
                expectError: false
            });
            (0, globals_1.expect)(paymentResponse.status).toBe(202);
            (0, globals_1.expect)(paymentResponse.data).toHaveProperty('status', 'processing');
            (0, globals_1.expect)(paymentResponse.data).toHaveProperty('timeoutHandling', true);
            await new Promise(resolve => setTimeout(resolve, 5000));
            const statusResponse = await apiRequest('GET', `/payments/advanced/${paymentResponse.data.id}`);
            (0, globals_1.expect)(['timeout', 'retrying', 'failed']).toContain(statusResponse.data.status);
            console.log(`✅ Gateway timeout handling verified`);
        });
        (0, globals_1.test)('should handle invalid payment data gracefully', async () => {
            console.log('❌ Testing invalid payment data handling...');
            const invalidPaymentCases = [
                {
                    name: 'negative_amount',
                    data: { amount: -1000 },
                    expectedError: 'Invalid amount'
                },
                {
                    name: 'invalid_currency',
                    data: { currency: 'INVALID' },
                    expectedError: 'Unsupported currency'
                },
                {
                    name: 'missing_customer',
                    data: { customerId: 'non_existent_customer' },
                    expectedError: 'Customer not found'
                },
                {
                    name: 'invalid_payment_method',
                    data: { paymentMethodId: 'invalid_method' },
                    expectedError: 'Payment method not found'
                }
            ];
            for (const testCase of invalidPaymentCases) {
                const invalidData = {
                    customerId: testCustomerId,
                    amount: 50000,
                    currency: 'INR',
                    paymentMethodId: testPaymentMethodId,
                    description: `Invalid data test: ${testCase.name}`,
                    ...testCase.data
                };
                const response = await apiRequest('POST', '/payments/advanced', invalidData, undefined, {
                    expectError: true
                });
                (0, globals_1.expect)(response.status).toBeGreaterThanOrEqual(400);
                (0, globals_1.expect)(response.status).toBeLessThan(500);
                (0, globals_1.expect)(response.data).toHaveProperty('error');
                (0, globals_1.expect)(response.data.error).toContain(testCase.expectedError);
            }
            console.log(`✅ Invalid payment data handling verified`);
        });
        (0, globals_1.test)('should handle network failures and retries', async () => {
            console.log('🌐 Testing network failure handling...');
            const networkFailureData = {
                customerId: testCustomerId,
                amount: 85000,
                currency: 'INR',
                paymentMethodId: testPaymentMethodId,
                description: 'Network failure test',
                simulate: {
                    networkFailure: true,
                    failureStage: 'gateway_communication',
                    retryable: true
                }
            };
            const paymentResponse = await apiRequest('POST', '/payments/advanced', networkFailureData);
            (0, globals_1.expect)(paymentResponse.status).toBe(202);
            (0, globals_1.expect)(paymentResponse.data).toHaveProperty('status', 'queued_for_retry');
            (0, globals_1.expect)(paymentResponse.data).toHaveProperty('retryConfig');
            await new Promise(resolve => setTimeout(resolve, 5000));
            const retryStatusResponse = await apiRequest('GET', `/payments/retry/${paymentResponse.data.id}`);
            (0, globals_1.expect)(retryStatusResponse.status).toBe(200);
            (0, globals_1.expect)(retryStatusResponse.data).toHaveProperty('retryAttempts');
            (0, globals_1.expect)(retryStatusResponse.data.retryAttempts).toBeGreaterThan(0);
            console.log(`✅ Network failure handling verified`);
        });
    });
});
async function cleanupPaymentData() {
    try {
        console.log('🧹 Mock payment cleanup completed (SKIP_DATABASE_TESTS=true)');
    }
    catch (error) {
        console.warn('⚠️ Mock payment cleanup warning (non-critical):', error);
    }
}
async function cleanupSubscriptionData() {
    try {
        console.log('🧹 Mock subscription cleanup completed (SKIP_DATABASE_TESTS=true)');
    }
    catch (error) {
        console.warn('⚠️ Mock subscription cleanup warning (non-critical):', error);
    }
}
async function cleanupInvoiceData() {
    try {
        console.log('🧹 Mock invoice cleanup completed (SKIP_DATABASE_TESTS=true)');
    }
    catch (error) {
        console.warn('⚠️ Mock invoice cleanup warning (non-critical):', error);
    }
}
async function cleanupAnalyticsData() {
    try {
        console.log('🧹 Mock analytics cleanup completed (SKIP_DATABASE_TESTS=true)');
    }
    catch (error) {
        console.warn('⚠️ Mock analytics cleanup warning (non-critical):', error);
    }
}
async function seedAnalyticsData() {
    try {
        console.log('📊 Mock analytics test data seeded (SKIP_DATABASE_TESTS=true)');
    }
    catch (error) {
        console.warn('⚠️ Mock analytics seeding warning (non-critical):', error);
    }
}
//# sourceMappingURL=epic5-payment-ecosystem.test.js.map