"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockGatewayErrors = exports.createMockGatewayHealthCheck = exports.mockPaymentPlanComparisons = exports.createMockPaymentDispute = exports.createMockPaymentSettlement = exports.createMockRFIDTopUpTransaction = exports.createMockRFIDTransaction = exports.mockPaymentAnalyticsAggregations = exports.mockSubscriptionEvents = exports.mockPaymentFlowStates = exports.mockValidationResponses = exports.createMockWalletFormData = exports.createMockUPIFormData = exports.createMockPaymentFormData = exports.generateMockWebhookSignature = exports.generatePaymentAnalyticsData = exports.generateMultipleBillingCycles = exports.generateMultipleSubscriptions = exports.generateMultipleRetries = exports.generateMultipleTransactions = exports.generateMultiplePaymentMethods = exports.mockErrors = exports.createMockUnauthResult = exports.createMockAuthResult = exports.createMockLambdaContext = exports.createMockAPIGatewayEvent = exports.mockWebhookPayloads = exports.mockRazorpayResponses = exports.createMockPaymentAnalytics = exports.createMockRefund = exports.createMockSubscriptionAnalytics = exports.createMockDunningConfig = exports.createMockSuspendedSubscription = exports.createMockCancelledSubscription = exports.createMockTrialSubscription = exports.createMockBillingCycle = exports.createMockSubscriptionPlan = exports.createMockSubscription = exports.createMockPaymentPlan = exports.createMockPaymentRetry = exports.createMockRFIDTag = exports.createMockOrder = exports.createMockFailedPaymentTransaction = exports.createMockPaymentTransaction = exports.createMockPaymentOrder = exports.createMockWalletPaymentMethod = exports.createMockUPIPaymentMethod = exports.createMockPaymentMethod = exports.createMockSchool = exports.createMockUser = void 0;
exports.cleanupMockTimers = exports.setupMockTimers = exports.mockDateUtils = exports.cleanupTestEnvironment = exports.setupTestEnvironment = exports.mockEnvVars = exports.setupDatabaseMocks = exports.setupPaymentMocks = exports.resetAllMocks = void 0;
const Currency = {
    INR: 'INR',
    EUR: 'EUR'
};
const PaymentGateway = {
    RAZORPAY: 'razorpay',
    STRIPE: 'stripe',
    PAYU: 'payu'
};
const PaymentType = {
    MEAL: 'meal',
    TRANSPORT: 'transport',
    FEE: 'fee',
    SUBSCRIPTION: 'subscription'
};
const PAYMENT_TYPES = {
    CARD: 'card',
    UPI: 'upi',
    WALLET: 'wallet',
    BANK_ACCOUNT: 'bank_account',
    RFID: 'rfid',
    CASH: 'cash'
};
const PAYMENT_STATUSES = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};
const GATEWAYS = {
    RAZORPAY: 'razorpay',
    STRIPE: 'stripe',
    PAYU: 'payu'
};
const CURRENCIES = {
    INR: 'INR',
    EUR: 'EUR'
};
const createMockUser = (overrides = {}) => ({
    id: 'user-test-123',
    email: 'test@example.com',
    name: 'Test User',
    phone: '+919876543210',
    role: 'student',
    schoolId: 'school-test-123',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockUser = createMockUser;
const createMockSchool = (overrides = {}) => ({
    id: 'school-test-123',
    name: 'Test School',
    address: '123 Test Street, Test City',
    phone: '+919876543210',
    email: 'contact@testschool.edu',
    website: 'https://testschool.edu',
    principalName: 'Dr. Test Principal',
    isActive: true,
    settings: {
        paymentGateways: ['razorpay'],
        currencies: ['INR'],
        taxRate: 18,
        serviceCharges: 5
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockSchool = createMockSchool;
const createMockPaymentMethod = (overrides = {}) => ({
    id: 'payment-method-test-123',
    userId: 'user-test-123',
    type: PAYMENT_TYPES.CARD,
    method: PAYMENT_TYPES.CARD,
    gateway: GATEWAYS.RAZORPAY,
    gatewayMethodId: 'card_test_razorpay_123',
    isDefault: false,
    cardLast4: '4242',
    cardBrand: 'visa',
    cardExpiry: '12/25',
    cardHolderName: 'Test User',
    bankName: 'Test Bank',
    accountNumber: '****1234',
    ifscCode: 'TEST0001234',
    upiHandle: 'testuser@paytm',
    walletProvider: 'paytm',
    isVerified: true,
    metadata: JSON.stringify({
        fingerprint: 'card_fingerprint_test',
        country: 'IN',
        network: 'Visa'
    }),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockPaymentMethod = createMockPaymentMethod;
const createMockUPIPaymentMethod = (overrides = {}) => ({
    ...(0, exports.createMockPaymentMethod)(),
    id: 'payment-method-upi-test-123',
    type: PAYMENT_TYPES.UPI,
    method: PAYMENT_TYPES.UPI,
    cardLast4: null,
    cardBrand: null,
    cardExpiry: null,
    cardHolderName: null,
    upiHandle: 'testuser@upi',
    metadata: JSON.stringify({
        upiAppName: 'PhonePe',
        verified: true
    }),
    ...overrides
});
exports.createMockUPIPaymentMethod = createMockUPIPaymentMethod;
const createMockWalletPaymentMethod = (overrides = {}) => ({
    ...(0, exports.createMockPaymentMethod)(),
    id: 'payment-method-wallet-test-123',
    type: PAYMENT_TYPES.WALLET,
    method: PAYMENT_TYPES.WALLET,
    cardLast4: null,
    cardBrand: null,
    cardExpiry: null,
    cardHolderName: null,
    upiHandle: null,
    walletProvider: 'paytm',
    metadata: JSON.stringify({
        walletBalance: 5000,
        kycVerified: true
    }),
    ...overrides
});
exports.createMockWalletPaymentMethod = createMockWalletPaymentMethod;
const createMockPaymentOrder = (overrides = {}) => ({
    id: 'order-test-123',
    userId: 'user-test-123',
    schoolId: 'school-test-123',
    amount: 15000,
    currency: CURRENCIES.INR,
    status: PAYMENT_STATUSES.PENDING,
    description: 'Test meal order payment',
    metadata: JSON.stringify({
        orderType: 'meal',
        items: [
            { name: 'Lunch Combo A', price: 15000, quantity: 1 }
        ]
    }),
    razorpayOrderId: 'order_test_razorpay_123',
    expiresAt: new Date('2024-01-02'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockPaymentOrder = createMockPaymentOrder;
const createMockPaymentTransaction = (overrides = {}) => ({
    id: 'transaction-test-123',
    orderId: 'order-test-123',
    userId: 'user-test-123',
    schoolId: 'school-test-123',
    paymentMethodId: 'payment-method-test-123',
    amount: 15000,
    currency: CURRENCIES.INR,
    status: PAYMENT_STATUSES.COMPLETED,
    type: PAYMENT_TYPES.CARD,
    method: PAYMENT_TYPES.CARD,
    gateway: GATEWAYS.RAZORPAY,
    razorpayPaymentId: 'pay_test_razorpay_123',
    gatewayTransactionId: 'txn_test_gateway_123',
    gatewayOrderId: 'order_test_razorpay_123',
    description: 'Test meal order payment',
    gatewayMetadata: JSON.stringify({
        payment_id: 'pay_test_razorpay_123',
        order_id: 'order_test_razorpay_123',
        signature: 'test_signature_123'
    }),
    fees: JSON.stringify({
        platformFee: 500,
        gatewayFee: 300,
        gst: 144
    }),
    failureReason: null,
    refundReason: null,
    notes: 'Test payment transaction',
    paidAt: new Date('2024-01-01T10:00:00Z'),
    capturedAt: new Date('2024-01-01T10:01:00Z'),
    refundedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockPaymentTransaction = createMockPaymentTransaction;
const createMockFailedPaymentTransaction = (overrides = {}) => ({
    ...(0, exports.createMockPaymentTransaction)(),
    id: 'transaction-failed-test-123',
    status: PAYMENT_STATUSES.FAILED,
    razorpayPaymentId: 'pay_failed_test_123',
    failureReason: 'Insufficient funds',
    paidAt: null,
    capturedAt: null,
    ...overrides
});
exports.createMockFailedPaymentTransaction = createMockFailedPaymentTransaction;
const createMockOrder = (overrides = {}) => ({
    id: 'order-test-123',
    userId: 'user-test-123',
    schoolId: 'school-test-123',
    rfidTagId: 'tag-test-123',
    totalAmount: 15000,
    currency: Currency.INR,
    status: 'pending',
    type: 'meal',
    items: [
        {
            id: 'item-test-123',
            name: 'Lunch Combo A',
            price: 15000,
            quantity: 1,
            category: 'lunch',
            description: 'Rice, Dal, Vegetables'
        }
    ],
    metadata: JSON.stringify({
        orderNumber: 'ORD-2024-001',
        deliveryLocation: 'Cafeteria Block A',
        specialInstructions: 'No spicy food'
    }),
    paymentTransactionId: 'transaction-test-123',
    estimatedPrepTime: 15,
    actualPrepTime: null,
    deliveredAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockOrder = createMockOrder;
const createMockRFIDTag = (overrides = {}) => ({
    id: 'tag-test-123',
    userId: 'user-test-123',
    schoolId: 'school-test-123',
    tagNumber: 'RFID123456789',
    balance: 50000,
    status: 'active',
    isBlocked: false,
    lastTransactionId: 'transaction-test-123',
    lastActivity: new Date('2024-01-01T10:00:00Z'),
    metadata: JSON.stringify({
        issueDate: '2024-01-01',
        expiryDate: '2025-01-01',
        cardType: 'student'
    }),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockRFIDTag = createMockRFIDTag;
const createMockPaymentRetry = (overrides = {}) => ({
    id: 'retry-test-123',
    paymentTransactionId: 'transaction-test-123',
    retryCount: 1,
    maxRetries: 3,
    nextRetryAt: new Date('2024-01-01T11:00:00Z'),
    lastAttemptAt: new Date('2024-01-01T10:30:00Z'),
    failureReason: 'Network timeout',
    isExhausted: false,
    strategy: 'exponential_backoff',
    metadata: JSON.stringify({
        delayMs: 60000,
        backoffMultiplier: 2,
        maxDelayMs: 300000
    }),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockPaymentRetry = createMockPaymentRetry;
const createMockPaymentPlan = (overrides = {}) => ({
    id: 'plan-test-123',
    name: 'Test Monthly Plan',
    description: 'Test plan for monthly payments',
    amount: 99900,
    currency: Currency.INR,
    interval: 'monthly',
    intervalCount: 1,
    trialPeriodDays: 7,
    maxCycles: null,
    setupFee: 0,
    metadata: JSON.stringify({
        features: ['feature1', 'feature2'],
        category: 'premium'
    }),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockPaymentPlan = createMockPaymentPlan;
const createMockSubscription = (overrides = {}) => ({
    id: 'subscription-test-123',
    userId: 'user-test-123',
    schoolId: 'school-test-123',
    subscriptionPlanId: 'plan-test-123',
    paymentMethodId: 'payment-method-test-123',
    status: 'active',
    currentCycle: 1,
    totalCycles: null,
    nextBillingDate: new Date('2024-02-01'),
    trialStartDate: new Date('2024-01-01'),
    trialEndDate: new Date('2024-01-08'),
    activatedAt: new Date('2024-01-08'),
    metadata: JSON.stringify({
        planName: 'Premium Monthly',
        features: ['feature1', 'feature2'],
        autoRenewal: true
    }),
    pausedAt: null,
    pauseReason: null,
    resumedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    suspendedAt: null,
    suspensionReason: null,
    lastBillingDate: null,
    lastPaymentDate: null,
    lastFailedPaymentAt: null,
    failedPaymentCount: 0,
    prorationAmount: null,
    discountAmount: 0,
    taxAmount: 17982,
    totalAmount: 99900,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    subscriptionPlan: (0, exports.createMockPaymentPlan)(),
    user: (0, exports.createMockUser)(),
    ...overrides
});
exports.createMockSubscription = createMockSubscription;
const createMockSubscriptionPlan = (overrides = {}) => ({
    id: 'plan-test-123',
    name: 'Test Premium Plan',
    description: 'Premium subscription plan for testing',
    amount: 99900,
    currency: Currency.INR,
    interval: 'monthly',
    intervalCount: 1,
    trialPeriodDays: 7,
    maxCycles: null,
    setupFee: 0,
    features: ['unlimited_meals', 'priority_support', 'nutritional_tracking'],
    metadata: JSON.stringify({
        category: 'premium',
        popular: true,
        tierLevel: 3
    }),
    isActive: true,
    sortOrder: 2,
    isVisible: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockSubscriptionPlan = createMockSubscriptionPlan;
const createMockBillingCycle = (overrides = {}) => ({
    id: 'cycle-test-123',
    subscriptionId: 'subscription-test-123',
    cycleNumber: 1,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    billingDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-08'),
    amount: 99900,
    prorationAmount: 0,
    discountAmount: 0,
    taxAmount: 17982,
    totalAmount: 99900,
    status: 'completed',
    paymentTransactionId: 'transaction-test-123',
    invoice: JSON.stringify({
        number: 'INV-2024-001',
        items: [
            {
                description: 'Premium Plan - January 2024',
                amount: 99900,
                quantity: 1
            }
        ]
    }),
    paidAt: new Date('2024-01-01T10:00:00Z'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockBillingCycle = createMockBillingCycle;
const createMockTrialSubscription = (overrides = {}) => (0, exports.createMockSubscription)({
    status: 'trialing',
    trialStartDate: new Date('2024-01-01'),
    trialEndDate: new Date('2024-01-08'),
    activatedAt: null,
    nextBillingDate: new Date('2024-01-08'),
    ...overrides
});
exports.createMockTrialSubscription = createMockTrialSubscription;
const createMockCancelledSubscription = (overrides = {}) => (0, exports.createMockSubscription)({
    status: 'cancelled',
    cancelledAt: new Date('2024-01-15'),
    cancellationReason: 'User requested cancellation',
    nextBillingDate: null,
    ...overrides
});
exports.createMockCancelledSubscription = createMockCancelledSubscription;
const createMockSuspendedSubscription = (overrides = {}) => (0, exports.createMockSubscription)({
    status: 'suspended',
    suspendedAt: new Date('2024-01-10'),
    suspensionReason: 'Payment failure',
    failedPaymentCount: 3,
    lastFailedPaymentAt: new Date('2024-01-10T09:00:00Z'),
    ...overrides
});
exports.createMockSuspendedSubscription = createMockSuspendedSubscription;
const createMockDunningConfig = (overrides = {}) => ({
    id: 'dunning-config-test-123',
    schoolId: 'school-test-123',
    maxRetries: 3,
    retryIntervalDays: [1, 3, 7],
    gracePeriodDays: 3,
    autoSuspendAfterDays: 7,
    autoCancelAfterDays: 30,
    notificationSettings: {
        emailEnabled: true,
        smsEnabled: true,
        whatsappEnabled: false
    },
    emailTemplates: JSON.stringify({
        reminder: 'payment_reminder_template',
        final_notice: 'payment_final_notice_template'
    }),
    smsTemplates: JSON.stringify({
        reminder: 'Your payment is due. Please pay to continue service.',
        final_notice: 'Final notice: Payment overdue. Service will be suspended.'
    }),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockDunningConfig = createMockDunningConfig;
const createMockSubscriptionAnalytics = (overrides = {}) => ({
    id: 'analytics-test-123',
    schoolId: 'school-test-123',
    period: 'monthly',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    metrics: {
        totalSubscriptions: 150,
        activeSubscriptions: 140,
        newSubscriptions: 25,
        cancelledSubscriptions: 10,
        suspendedSubscriptions: 5,
        churnRate: 6.67,
        revenueGenerated: 13986000,
        averageRevenuePerUser: 99900,
        lifetimeValue: 999000,
        cohortAnalysis: {
            month1Retention: 95,
            month3Retention: 85,
            month6Retention: 75,
            month12Retention: 65
        }
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockSubscriptionAnalytics = createMockSubscriptionAnalytics;
const createMockRefund = (overrides = {}) => ({
    id: 'refund-test-123',
    paymentTransactionId: 'transaction-test-123',
    orderId: 'order-test-123',
    userId: 'user-test-123',
    amount: 15000,
    currency: Currency.INR,
    reason: 'Customer requested refund',
    status: 'completed',
    type: 'full',
    gateway: PaymentGateway.RAZORPAY,
    gatewayRefundId: 'rfnd_test_razorpay_123',
    metadata: JSON.stringify({
        initiatedBy: 'admin',
        approvedBy: 'manager',
        customerNotes: 'Food quality issue'
    }),
    processedAt: new Date('2024-01-01T15:00:00Z'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});
exports.createMockRefund = createMockRefund;
const createMockPaymentAnalytics = (overrides = {}) => ({
    schoolId: 'school-test-123',
    period: 'daily',
    date: new Date('2024-01-01'),
    metrics: {
        totalTransactions: 250,
        successfulTransactions: 238,
        failedTransactions: 12,
        totalAmount: 3750000,
        successfulAmount: 3570000,
        failedAmount: 180000,
        successRate: 95.2,
        averageTransactionAmount: 15000,
        paymentMethodDistribution: {
            card: 40,
            upi: 45,
            wallet: 10,
            netbanking: 5
        },
        gatewayDistribution: {
            razorpay: 85,
            payu: 15
        },
        hourlyDistribution: {
            '09': 15, '10': 25, '11': 35, '12': 50,
            '13': 45, '14': 30, '15': 25, '16': 15,
            '17': 10
        }
    },
    ...overrides
});
exports.createMockPaymentAnalytics = createMockPaymentAnalytics;
exports.mockRazorpayResponses = {
    createOrder: {
        id: 'order_test_razorpay_123',
        entity: 'order',
        amount: 15000,
        amount_paid: 0,
        amount_due: 15000,
        currency: 'INR',
        receipt: 'order_test_123',
        status: 'created',
        attempts: 0,
        notes: {
            order_id: 'order-test-123',
            user_id: 'user-test-123'
        },
        created_at: 1642681800
    },
    createCustomer: {
        id: 'cust_test_razorpay_123',
        entity: 'customer',
        name: 'Test User',
        email: 'test@example.com',
        contact: '+919876543210',
        gstin: null,
        notes: {
            user_id: 'user-test-123'
        },
        created_at: 1642681800
    },
    capturePayment: {
        id: 'pay_test_razorpay_123',
        entity: 'payment',
        amount: 15000,
        currency: 'INR',
        status: 'captured',
        order_id: 'order_test_razorpay_123',
        invoice_id: null,
        international: false,
        method: 'card',
        amount_refunded: 0,
        refund_status: null,
        captured: true,
        description: 'Test meal order payment',
        card_id: 'card_test_razorpay_123',
        bank: 'HDFC',
        wallet: null,
        vpa: null,
        email: 'test@example.com',
        contact: '+919876543210',
        notes: {
            order_id: 'order-test-123'
        },
        fee: 300,
        tax: 54,
        error_code: null,
        error_description: null,
        created_at: 1642681800
    },
    failedPayment: {
        id: 'pay_failed_test_123',
        entity: 'payment',
        amount: 15000,
        currency: 'INR',
        status: 'failed',
        order_id: 'order_test_razorpay_123',
        method: 'card',
        captured: false,
        description: 'Test meal order payment',
        error_code: 'BAD_REQUEST_ERROR',
        error_description: 'Your card has insufficient funds',
        created_at: 1642681800
    },
    createRefund: {
        id: 'rfnd_test_razorpay_123',
        entity: 'refund',
        amount: 15000,
        currency: 'INR',
        payment_id: 'pay_test_razorpay_123',
        notes: {
            reason: 'Customer requested refund'
        },
        receipt: null,
        acquirer_data: {
            rrn: '123456789012'
        },
        created_at: 1642681800,
        batch_id: null,
        status: 'processed',
        speed_processed: 'normal'
    }
};
exports.mockWebhookPayloads = {
    paymentCaptured: {
        entity: 'event',
        account_id: 'acc_test_123',
        event: 'payment.captured',
        contains: ['payment'],
        payload: {
            payment: {
                entity: {
                    id: 'pay_test_razorpay_123',
                    entity: 'payment',
                    amount: 15000,
                    currency: 'INR',
                    status: 'captured',
                    order_id: 'order_test_razorpay_123',
                    invoice_id: null,
                    international: false,
                    method: 'card',
                    amount_refunded: 0,
                    refund_status: null,
                    captured: true,
                    description: 'Test meal order payment',
                    card_id: 'card_test_razorpay_123',
                    bank: 'HDFC',
                    wallet: null,
                    vpa: null,
                    email: 'test@example.com',
                    contact: '+919876543210',
                    notes: {
                        order_id: 'order-test-123'
                    },
                    fee: 300,
                    tax: 54,
                    error_code: null,
                    error_description: null,
                    acquirer_data: {
                        rrn: '123456789012'
                    },
                    created_at: 1642681800
                }
            }
        },
        created_at: 1642681800
    },
    paymentFailed: {
        entity: 'event',
        account_id: 'acc_test_123',
        event: 'payment.failed',
        contains: ['payment'],
        payload: {
            payment: {
                entity: {
                    id: 'pay_failed_test_123',
                    entity: 'payment',
                    amount: 15000,
                    currency: 'INR',
                    status: 'failed',
                    order_id: 'order_test_razorpay_123',
                    method: 'card',
                    captured: false,
                    description: 'Test meal order payment',
                    error_code: 'BAD_REQUEST_ERROR',
                    error_description: 'Your card has insufficient funds',
                    error_source: 'customer',
                    error_step: 'payment_authentication',
                    error_reason: 'card_declined',
                    created_at: 1642681800
                }
            }
        },
        created_at: 1642681800
    },
    refundProcessed: {
        entity: 'event',
        account_id: 'acc_test_123',
        event: 'refund.created',
        contains: ['refund'],
        payload: {
            refund: {
                entity: {
                    id: 'rfnd_test_razorpay_123',
                    entity: 'refund',
                    amount: 15000,
                    currency: 'INR',
                    payment_id: 'pay_test_razorpay_123',
                    notes: {
                        reason: 'Customer requested refund'
                    },
                    receipt: null,
                    acquirer_data: {
                        rrn: '123456789012'
                    },
                    created_at: 1642681800,
                    batch_id: null,
                    status: 'processed',
                    speed_processed: 'normal'
                }
            }
        },
        created_at: 1642681800
    },
    orderPaid: {
        entity: 'event',
        account_id: 'acc_test_123',
        event: 'order.paid',
        contains: ['order'],
        payload: {
            order: {
                entity: {
                    id: 'order_test_razorpay_123',
                    entity: 'order',
                    amount: 15000,
                    amount_paid: 15000,
                    amount_due: 0,
                    currency: 'INR',
                    receipt: 'order_test_123',
                    status: 'paid',
                    attempts: 1,
                    notes: {
                        order_id: 'order-test-123',
                        user_id: 'user-test-123'
                    },
                    created_at: 1642681800
                }
            }
        },
        created_at: 1642681800
    }
};
const createMockAPIGatewayEvent = (method, path, body, pathParameters, headers) => ({
    httpMethod: method,
    path,
    body: body ? JSON.stringify(body) : null,
    pathParameters: pathParameters || {},
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'jest-test-agent',
        'X-Request-ID': 'test-request-123',
        ...(headers || {})
    },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    requestContext: {
        requestId: 'test-request-123',
        identity: {
            sourceIp: '127.0.0.1'
        },
        httpMethod: method,
        path,
        stage: 'test',
        requestTime: '01/Jan/2024:00:00:00 +0000',
        requestTimeEpoch: 1704067200
    },
    isBase64Encoded: false,
    resource: path,
    stageVariables: null,
    multiValueHeaders: {}
});
exports.createMockAPIGatewayEvent = createMockAPIGatewayEvent;
const createMockLambdaContext = () => ({
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-aws-request-123',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2024/01/01/[$LATEST]test-stream',
    identity: undefined,
    clientContext: undefined,
    getRemainingTimeInMillis: () => 30000
});
exports.createMockLambdaContext = createMockLambdaContext;
const createMockAuthResult = (overrides = {}) => ({
    isAuthenticated: true,
    user: (0, exports.createMockUser)(),
    school: (0, exports.createMockSchool)(),
    permissions: ['read:meals', 'write:orders', 'read:payments'],
    session: {
        id: 'session-test-123',
        userId: 'user-test-123',
        token: 'jwt-token-test-123',
        refreshToken: 'refresh-token-test-123',
        expiresAt: new Date('2024-01-02'),
        createdAt: new Date('2024-01-01')
    },
    ...overrides
});
exports.createMockAuthResult = createMockAuthResult;
const createMockUnauthResult = () => ({
    isAuthenticated: false,
    user: null,
    school: null,
    permissions: [],
    session: null,
    error: 'Authentication required'
});
exports.createMockUnauthResult = createMockUnauthResult;
exports.mockErrors = {
    insufficientFunds: new Error('Insufficient funds in account'),
    invalidCard: new Error('Invalid card details provided'),
    paymentTimeout: new Error('Payment processing timeout'),
    gatewayError: new Error('Payment gateway temporarily unavailable'),
    orderNotFound: new Error('Order not found'),
    orderExpired: new Error('Order has expired'),
    orderAlreadyPaid: new Error('Order has already been paid'),
    userNotFound: new Error('User not found'),
    userNotActive: new Error('User account is not active'),
    insufficientBalance: new Error('Insufficient RFID balance'),
    databaseError: new Error('Database connection failed'),
    externalServiceError: new Error('External service unavailable'),
    validationError: new Error('Request validation failed')
};
const generateMultiplePaymentMethods = (count, userId = 'user-test-123') => {
    return Array.from({ length: count }, (_, index) => (0, exports.createMockPaymentMethod)({
        id: `payment-method-${index}`,
        userId,
        cardLast4: index % 2 === 0 ? `424${index}` : null,
        upiHandle: index % 2 === 1 ? `user${index}@paytm` : null,
        type: index % 2 === 0 ? PaymentType.MEAL : PaymentType.TRANSPORT,
        method: index % 2 === 0 ? PAYMENT_TYPES.CARD : PAYMENT_TYPES.UPI,
        isDefault: index === 0
    }));
};
exports.generateMultiplePaymentMethods = generateMultiplePaymentMethods;
const generateMultipleTransactions = (count, userId = 'user-test-123') => {
    return Array.from({ length: count }, (_, index) => (0, exports.createMockPaymentTransaction)({
        id: `transaction-${index}`,
        userId,
        amount: 15000 + (index * 500),
        status: index % 10 === 0 ? PAYMENT_STATUSES.FAILED : PAYMENT_STATUSES.COMPLETED,
        razorpayPaymentId: `pay_test_${index}`,
        createdAt: new Date(`2024-01-${String(index % 28 + 1).padStart(2, '0')}`)
    }));
};
exports.generateMultipleTransactions = generateMultipleTransactions;
const generateMultipleRetries = (count, transactionId = 'transaction-test-123') => {
    return Array.from({ length: count }, (_, index) => (0, exports.createMockPaymentRetry)({
        id: `retry-${index}`,
        paymentTransactionId: transactionId,
        retryCount: index + 1,
        lastAttemptAt: new Date(`2024-01-01T${String(10 + index).padStart(2, '0')}:00:00Z`)
    }));
};
exports.generateMultipleRetries = generateMultipleRetries;
const generateMultipleSubscriptions = (count, userId = 'user-test-123') => {
    return Array.from({ length: count }, (_, index) => (0, exports.createMockSubscription)({
        id: `subscription-${index}`,
        userId: userId || `user-${index}`,
        subscriptionPlanId: `plan-${index % 3}`,
        status: index % 4 === 0 ? 'cancelled' : 'active',
        currentCycle: index + 1
    }));
};
exports.generateMultipleSubscriptions = generateMultipleSubscriptions;
const generateMultipleBillingCycles = (count, subscriptionId = 'subscription-test-123') => {
    return Array.from({ length: count }, (_, index) => (0, exports.createMockBillingCycle)({
        id: `cycle-${index}`,
        subscriptionId,
        cycleNumber: index + 1,
        startDate: new Date(`2024-${String(index % 12 + 1).padStart(2, '0')}-01`),
        endDate: new Date(`2024-${String(index % 12 + 1).padStart(2, '0')}-28`)
    }));
};
exports.generateMultipleBillingCycles = generateMultipleBillingCycles;
const generatePaymentAnalyticsData = (days = 30) => {
    return Array.from({ length: days }, (_, index) => (0, exports.createMockPaymentAnalytics)({
        date: new Date(`2024-01-${String(index + 1).padStart(2, '0')}`),
        metrics: {
            ...(0, exports.createMockPaymentAnalytics)().metrics,
            totalTransactions: 200 + Math.floor(Math.random() * 100),
            successRate: 92 + Math.random() * 6
        }
    }));
};
exports.generatePaymentAnalyticsData = generatePaymentAnalyticsData;
const generateMockWebhookSignature = (payload, secret = 'test_webhook_secret') => {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};
exports.generateMockWebhookSignature = generateMockWebhookSignature;
const createMockPaymentFormData = (overrides = {}) => ({
    amount: 15000,
    currency: 'INR',
    description: 'Test meal order',
    customer: {
        name: 'Test User',
        email: 'test@example.com',
        contact: '+919876543210'
    },
    paymentMethod: {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '25',
        cvv: '123',
        holderName: 'Test User'
    },
    billingAddress: {
        line1: '123 Test Street',
        line2: 'Test Area',
        city: 'Test City',
        state: 'Test State',
        postalCode: '123456',
        country: 'IN'
    },
    metadata: {
        orderId: 'order-test-123',
        userId: 'user-test-123',
        schoolId: 'school-test-123'
    },
    ...overrides
});
exports.createMockPaymentFormData = createMockPaymentFormData;
const createMockUPIFormData = (overrides = {}) => ({
    amount: 15000,
    currency: 'INR',
    description: 'Test meal order',
    customer: {
        name: 'Test User',
        email: 'test@example.com',
        contact: '+919876543210'
    },
    paymentMethod: {
        type: 'upi',
        vpa: 'testuser@paytm'
    },
    metadata: {
        orderId: 'order-test-123',
        userId: 'user-test-123',
        schoolId: 'school-test-123'
    },
    ...overrides
});
exports.createMockUPIFormData = createMockUPIFormData;
const createMockWalletFormData = (overrides = {}) => ({
    amount: 15000,
    currency: 'INR',
    description: 'Test meal order',
    customer: {
        name: 'Test User',
        email: 'test@example.com',
        contact: '+919876543210'
    },
    paymentMethod: {
        type: 'wallet',
        provider: 'paytm'
    },
    metadata: {
        orderId: 'order-test-123',
        userId: 'user-test-123',
        schoolId: 'school-test-123'
    },
    ...overrides
});
exports.createMockWalletFormData = createMockWalletFormData;
exports.mockValidationResponses = {
    validCard: {
        isValid: true,
        cardType: 'visa',
        issuer: 'HDFC Bank',
        country: 'IN',
        warnings: []
    },
    invalidCard: {
        isValid: false,
        errors: ['Invalid card number', 'Expired card'],
        warnings: ['Issuer not supported']
    },
    validUPI: {
        isValid: true,
        provider: 'PhonePe',
        verified: true,
        warnings: []
    },
    invalidUPI: {
        isValid: false,
        errors: ['Invalid UPI handle format'],
        warnings: []
    }
};
exports.mockPaymentFlowStates = {
    initiated: {
        orderId: 'order-test-123',
        status: 'initiated',
        step: 'payment_method_selection',
        progress: 25,
        nextAction: 'select_payment_method',
        timeRemaining: 600,
        metadata: {
            sessionId: 'session-test-123',
            retryCount: 0
        }
    },
    processing: {
        orderId: 'order-test-123',
        status: 'processing',
        step: 'payment_authentication',
        progress: 75,
        nextAction: 'wait_for_gateway_response',
        timeRemaining: 120,
        metadata: {
            sessionId: 'session-test-123',
            gatewayTransactionId: 'txn_test_123'
        }
    },
    completed: {
        orderId: 'order-test-123',
        status: 'completed',
        step: 'payment_confirmed',
        progress: 100,
        nextAction: 'redirect_to_success',
        timeRemaining: 0,
        metadata: {
            sessionId: 'session-test-123',
            paymentId: 'pay_test_razorpay_123',
            receiptUrl: 'https://example.com/receipt/test-123'
        }
    },
    failed: {
        orderId: 'order-test-123',
        status: 'failed',
        step: 'payment_authentication',
        progress: 50,
        nextAction: 'retry_payment',
        timeRemaining: 0,
        error: {
            code: 'CARD_DECLINED',
            message: 'Your card was declined',
            retryable: true
        },
        metadata: {
            sessionId: 'session-test-123',
            failureCount: 1
        }
    }
};
exports.mockSubscriptionEvents = {
    subscriptionCreated: {
        id: 'subscription-test-123',
        event: 'subscription.created',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        data: (0, exports.createMockSubscription)({
            status: 'trialing'
        })
    },
    subscriptionActivated: {
        id: 'subscription-test-123',
        event: 'subscription.activated',
        timestamp: new Date('2024-01-08T00:00:00Z'),
        data: (0, exports.createMockSubscription)({
            status: 'active',
            activatedAt: new Date('2024-01-08T00:00:00Z')
        })
    },
    subscriptionCancelled: {
        id: 'subscription-test-123',
        event: 'subscription.cancelled',
        timestamp: new Date('2024-01-15T00:00:00Z'),
        data: (0, exports.createMockSubscription)({
            status: 'cancelled',
            cancelledAt: new Date('2024-01-15T00:00:00Z'),
            cancellationReason: 'User requested'
        })
    },
    paymentFailed: {
        id: 'subscription-test-123',
        event: 'subscription.payment_failed',
        timestamp: new Date('2024-01-10T00:00:00Z'),
        data: {
            subscription: (0, exports.createMockSubscription)({
                status: 'past_due',
                failedPaymentCount: 1,
                lastFailedPaymentAt: new Date('2024-01-10T00:00:00Z')
            }),
            payment: (0, exports.createMockFailedPaymentTransaction)()
        }
    }
};
exports.mockPaymentAnalyticsAggregations = {
    daily: {
        period: 'daily',
        data: (0, exports.generatePaymentAnalyticsData)(30)
    },
    weekly: {
        period: 'weekly',
        data: Array.from({ length: 4 }, (_, index) => ({
            week: index + 1,
            weekStart: new Date(`2024-01-${String(index * 7 + 1).padStart(2, '0')}`),
            weekEnd: new Date(`2024-01-${String((index + 1) * 7).padStart(2, '0')}`),
            metrics: {
                totalTransactions: 1750 + Math.floor(Math.random() * 500),
                totalAmount: 26250000 + Math.floor(Math.random() * 5000000),
                successRate: 94 + Math.random() * 4
            }
        }))
    },
    monthly: {
        period: 'monthly',
        data: [{
                month: 1,
                year: 2024,
                monthStart: new Date('2024-01-01'),
                monthEnd: new Date('2024-01-31'),
                metrics: {
                    totalTransactions: 7500,
                    totalAmount: 112500000,
                    successRate: 95.8,
                    averageOrderValue: 15000,
                    uniqueUsers: 500,
                    repeatCustomers: 350
                }
            }]
    }
};
const createMockRFIDTransaction = (overrides = {}) => ({
    id: 'rfid-txn-test-123',
    rfidTagId: 'tag-test-123',
    userId: 'user-test-123',
    schoolId: 'school-test-123',
    type: 'debit',
    amount: 15000,
    balance: 35000,
    description: 'Meal purchase - Lunch Combo A',
    orderId: 'order-test-123',
    merchantId: 'cafeteria-001',
    deviceId: 'pos-device-001',
    location: 'Main Cafeteria',
    metadata: JSON.stringify({
        items: [
            { name: 'Lunch Combo A', price: 15000, quantity: 1 }
        ],
        deviceInfo: {
            model: 'RFID-POS-V2',
            serialNumber: 'RFP123456'
        }
    }),
    processedAt: new Date('2024-01-01T12:00:00Z'),
    createdAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z'),
    ...overrides
});
exports.createMockRFIDTransaction = createMockRFIDTransaction;
const createMockRFIDTopUpTransaction = (overrides = {}) => ({
    ...(0, exports.createMockRFIDTransaction)(),
    id: 'rfid-topup-test-123',
    type: 'credit',
    amount: 50000,
    balance: 85000,
    description: 'RFID wallet top-up',
    orderId: null,
    merchantId: null,
    paymentTransactionId: 'transaction-topup-test-123',
    metadata: JSON.stringify({
        topUpMethod: 'online_payment',
        bonusAmount: 0,
        promoCode: null
    }),
    ...overrides
});
exports.createMockRFIDTopUpTransaction = createMockRFIDTopUpTransaction;
const createMockPaymentSettlement = (overrides = {}) => ({
    id: 'settlement-test-123',
    schoolId: 'school-test-123',
    gateway: PaymentGateway.RAZORPAY,
    settlementId: 'setl_test_razorpay_123',
    amount: 1485000,
    fees: 515,
    tax: 93,
    netAmount: 1484392,
    transactionCount: 100,
    period: {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-01T23:59:59Z')
    },
    status: 'processed',
    bankAccount: {
        accountNumber: '****1234',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank'
    },
    metadata: JSON.stringify({
        settlementType: 'daily',
        processingTime: '2024-01-02T06:00:00Z',
        transactionIds: Array.from({ length: 100 }, (_, i) => `txn-${i}`)
    }),
    processedAt: new Date('2024-01-02T06:00:00Z'),
    createdAt: new Date('2024-01-01T23:59:59Z'),
    updatedAt: new Date('2024-01-02T06:00:00Z'),
    ...overrides
});
exports.createMockPaymentSettlement = createMockPaymentSettlement;
const createMockPaymentDispute = (overrides = {}) => ({
    id: 'dispute-test-123',
    paymentTransactionId: 'transaction-test-123',
    userId: 'user-test-123',
    schoolId: 'school-test-123',
    gatewayDisputeId: 'disp_test_razorpay_123',
    amount: 15000,
    currency: Currency.INR,
    reason: 'fraud',
    status: 'open',
    phase: 'chargeback',
    evidence: JSON.stringify({
        customerCommunication: 'Email thread with customer',
        serviceDocumentation: 'Proof of service delivery',
        shippingDocumentation: 'Not applicable for digital service'
    }),
    dueBy: new Date('2024-01-15T23:59:59Z'),
    respondBy: new Date('2024-01-10T23:59:59Z'),
    gatewayNotifiedAt: new Date('2024-01-05T10:00:00Z'),
    resolvedAt: null,
    resolution: null,
    metadata: JSON.stringify({
        customerReason: 'Did not receive the service',
        riskScore: 'low',
        previousDisputes: 0
    }),
    createdAt: new Date('2024-01-05T10:00:00Z'),
    updatedAt: new Date('2024-01-05T10:00:00Z'),
    ...overrides
});
exports.createMockPaymentDispute = createMockPaymentDispute;
exports.mockPaymentPlanComparisons = {
    plans: [
        (0, exports.createMockPaymentPlan)({
            id: 'plan-basic-123',
            name: 'Basic Plan',
            amount: 49900,
            features: ['feature1', 'feature2']
        }),
        (0, exports.createMockPaymentPlan)({
            id: 'plan-premium-123',
            name: 'Premium Plan',
            amount: 99900,
            features: ['feature1', 'feature2', 'feature3', 'feature4']
        }),
        (0, exports.createMockPaymentPlan)({
            id: 'plan-enterprise-123',
            name: 'Enterprise Plan',
            amount: 199900,
            features: ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6']
        })
    ],
    comparison: {
        mostPopular: 'plan-premium-123',
        bestValue: 'plan-premium-123',
        recommended: 'plan-premium-123'
    }
};
const createMockGatewayHealthCheck = (overrides = {}) => ({
    gateway: PaymentGateway.RAZORPAY,
    status: 'healthy',
    responseTime: 150,
    lastChecked: new Date('2024-01-01T12:00:00Z'),
    uptime: 99.98,
    errorRate: 0.02,
    metrics: {
        avgResponseTime: 145,
        maxResponseTime: 2000,
        minResponseTime: 50,
        timeoutRate: 0.01,
        successRate: 99.98
    },
    endpoints: {
        createOrder: { status: 'healthy', responseTime: 120 },
        capturePayment: { status: 'healthy', responseTime: 180 },
        createRefund: { status: 'healthy', responseTime: 200 },
        webhooks: { status: 'healthy', responseTime: 50 }
    },
    ...overrides
});
exports.createMockGatewayHealthCheck = createMockGatewayHealthCheck;
exports.mockGatewayErrors = {
    invalidRequest: {
        error: {
            code: 'BAD_REQUEST_ERROR',
            description: 'The request is not valid',
            source: 'business',
            step: 'payment_initiation',
            reason: 'invalid_request',
            metadata: {
                field: 'amount',
                value: 'invalid'
            }
        }
    },
    gatewayError: {
        error: {
            code: 'GATEWAY_ERROR',
            description: 'Payment processing failed',
            source: 'gateway',
            step: 'payment_processing',
            reason: 'gateway_unavailable'
        }
    },
    serverError: {
        error: {
            code: 'SERVER_ERROR',
            description: 'Something went wrong',
            source: 'internal',
            step: 'internal_processing',
            reason: 'server_error'
        }
    }
};
const resetAllMocks = () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
};
exports.resetAllMocks = resetAllMocks;
const setupPaymentMocks = () => {
    jest.mock('razorpay', () => ({
        orders: {
            create: jest.fn().mockResolvedValue(exports.mockRazorpayResponses.createOrder),
            fetch: jest.fn().mockResolvedValue(exports.mockRazorpayResponses.createOrder)
        },
        payments: {
            capture: jest.fn().mockResolvedValue(exports.mockRazorpayResponses.capturePayment),
            fetch: jest.fn().mockResolvedValue(exports.mockRazorpayResponses.capturePayment)
        },
        customers: {
            create: jest.fn().mockResolvedValue(exports.mockRazorpayResponses.createCustomer)
        },
        refunds: {
            create: jest.fn().mockResolvedValue(exports.mockRazorpayResponses.createRefund)
        }
    }));
};
exports.setupPaymentMocks = setupPaymentMocks;
const setupDatabaseMocks = () => {
    const mockDb = {
        paymentMethod: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        paymentTransaction: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        order: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        subscription: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        }
    };
    jest.mock('../../src/lib/database', () => ({
        db: mockDb
    }));
};
exports.setupDatabaseMocks = setupDatabaseMocks;
exports.mockEnvVars = {
    RAZORPAY_KEY_ID: 'rzp_test_123456789',
    RAZORPAY_KEY_SECRET: 'test_secret_key_123',
    RAZORPAY_WEBHOOK_SECRET: 'test_webhook_secret_123',
    PAYMENT_CURRENCY: 'INR',
    PAYMENT_TIMEOUT: '300000',
    MAX_PAYMENT_RETRIES: '3',
    PAYMENT_SUCCESS_URL: 'https://example.com/payment/success',
    PAYMENT_FAILURE_URL: 'https://example.com/payment/failure'
};
const setupTestEnvironment = () => {
    Object.entries(exports.mockEnvVars).forEach(([key, value]) => {
        process.env[key] = value;
    });
    (0, exports.setupPaymentMocks)();
    (0, exports.setupDatabaseMocks)();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
};
exports.setupTestEnvironment = setupTestEnvironment;
const cleanupTestEnvironment = () => {
    Object.keys(exports.mockEnvVars).forEach(key => {
        delete process.env[key];
    });
    (0, exports.resetAllMocks)();
    jest.restoreAllMocks();
};
exports.cleanupTestEnvironment = cleanupTestEnvironment;
exports.mockDateUtils = {
    now: new Date('2024-01-01T12:00:00Z'),
    tomorrow: new Date('2024-01-02T12:00:00Z'),
    yesterday: new Date('2023-12-31T12:00:00Z'),
    nextWeek: new Date('2024-01-08T12:00:00Z'),
    nextMonth: new Date('2024-02-01T12:00:00Z'),
    addDays: (days) => {
        const date = new Date(exports.mockDateUtils.now);
        date.setDate(date.getDate() + days);
        return date;
    },
    addHours: (hours) => {
        const date = new Date(exports.mockDateUtils.now);
        date.setHours(date.getHours() + hours);
        return date;
    },
    addMinutes: (minutes) => {
        const date = new Date(exports.mockDateUtils.now);
        date.setMinutes(date.getMinutes() + minutes);
        return date;
    }
};
const setupMockTimers = () => {
    jest.useFakeTimers();
    jest.setSystemTime(exports.mockDateUtils.now);
};
exports.setupMockTimers = setupMockTimers;
const cleanupMockTimers = () => {
    jest.useRealTimers();
};
exports.cleanupMockTimers = cleanupMockTimers;
__exportStar(require("./payment-mocks"), exports);
exports.default = {
    createMockUser: exports.createMockUser,
    createMockSchool: exports.createMockSchool,
    createMockPaymentMethod: exports.createMockPaymentMethod,
    createMockUPIPaymentMethod: exports.createMockUPIPaymentMethod,
    createMockWalletPaymentMethod: exports.createMockWalletPaymentMethod,
    createMockPaymentOrder: exports.createMockPaymentOrder,
    createMockPaymentTransaction: exports.createMockPaymentTransaction,
    createMockFailedPaymentTransaction: exports.createMockFailedPaymentTransaction,
    createMockOrder: exports.createMockOrder,
    createMockRFIDTag: exports.createMockRFIDTag,
    createMockPaymentRetry: exports.createMockPaymentRetry,
    createMockPaymentPlan: exports.createMockPaymentPlan,
    createMockSubscription: exports.createMockSubscription,
    createMockTrialSubscription: exports.createMockTrialSubscription,
    createMockCancelledSubscription: exports.createMockCancelledSubscription,
    createMockSuspendedSubscription: exports.createMockSuspendedSubscription,
    createMockSubscriptionPlan: exports.createMockSubscriptionPlan,
    createMockBillingCycle: exports.createMockBillingCycle,
    createMockDunningConfig: exports.createMockDunningConfig,
    createMockSubscriptionAnalytics: exports.createMockSubscriptionAnalytics,
    createMockRefund: exports.createMockRefund,
    createMockPaymentAnalytics: exports.createMockPaymentAnalytics,
    createMockAPIGatewayEvent: exports.createMockAPIGatewayEvent,
    createMockLambdaContext: exports.createMockLambdaContext,
    createMockAuthResult: exports.createMockAuthResult,
    createMockUnauthResult: exports.createMockUnauthResult,
    createMockPaymentFormData: exports.createMockPaymentFormData,
    createMockUPIFormData: exports.createMockUPIFormData,
    createMockWalletFormData: exports.createMockWalletFormData,
    createMockGatewayHealthCheck: exports.createMockGatewayHealthCheck,
    createMockRFIDTransaction: exports.createMockRFIDTransaction,
    createMockRFIDTopUpTransaction: exports.createMockRFIDTopUpTransaction,
    createMockPaymentSettlement: exports.createMockPaymentSettlement,
    createMockPaymentDispute: exports.createMockPaymentDispute,
    generateMultiplePaymentMethods: exports.generateMultiplePaymentMethods,
    generateMultipleTransactions: exports.generateMultipleTransactions,
    generateMultipleRetries: exports.generateMultipleRetries,
    generateMultipleSubscriptions: exports.generateMultipleSubscriptions,
    generateMultipleBillingCycles: exports.generateMultipleBillingCycles,
    generatePaymentAnalyticsData: exports.generatePaymentAnalyticsData,
    generateMockWebhookSignature: exports.generateMockWebhookSignature,
    mockRazorpayResponses: exports.mockRazorpayResponses,
    mockWebhookPayloads: exports.mockWebhookPayloads,
    mockErrors: exports.mockErrors,
    mockValidationResponses: exports.mockValidationResponses,
    mockPaymentFlowStates: exports.mockPaymentFlowStates,
    mockSubscriptionEvents: exports.mockSubscriptionEvents,
    mockPaymentAnalyticsAggregations: exports.mockPaymentAnalyticsAggregations,
    mockGatewayErrors: exports.mockGatewayErrors,
    mockPaymentPlanComparisons: exports.mockPaymentPlanComparisons,
    mockDateUtils: exports.mockDateUtils,
    setupTestEnvironment: exports.setupTestEnvironment,
    cleanupTestEnvironment: exports.cleanupTestEnvironment,
    setupMockTimers: exports.setupMockTimers,
    cleanupMockTimers: exports.cleanupMockTimers,
    resetAllMocks: exports.resetAllMocks,
    setupPaymentMocks: exports.setupPaymentMocks,
    setupDatabaseMocks: exports.setupDatabaseMocks
};
//# sourceMappingURL=payment-mocks.js.map