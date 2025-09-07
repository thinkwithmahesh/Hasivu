import { PaymentStatus, PaymentMethodType } from '../../src/types/api.types';
export declare const createMockUser: (overrides?: Partial<any>) => {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: string;
    schoolId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockSchool: (overrides?: Partial<any>) => {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    principalName: string;
    isActive: boolean;
    settings: {
        paymentGateways: string[];
        currencies: string[];
        taxRate: number;
        serviceCharges: number;
    };
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockPaymentMethod: (overrides?: Partial<any>) => {
    id: string;
    userId: string;
    type: PaymentMethodType;
    method: PaymentMethodType;
    gateway: string;
    gatewayMethodId: string;
    isDefault: boolean;
    cardLast4: string;
    cardBrand: string;
    cardExpiry: string;
    cardHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiHandle: string;
    walletProvider: string;
    isVerified: boolean;
    metadata: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockUPIPaymentMethod: (overrides?: Partial<any>) => {
    id: string;
    type: PaymentMethodType;
    method: PaymentMethodType;
    cardLast4: any;
    cardBrand: any;
    cardExpiry: any;
    cardHolderName: any;
    upiHandle: string;
    metadata: string;
    userId: string;
    gateway: string;
    gatewayMethodId: string;
    isDefault: boolean;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    walletProvider: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockWalletPaymentMethod: (overrides?: Partial<any>) => {
    id: string;
    type: PaymentMethodType;
    method: PaymentMethodType;
    cardLast4: any;
    cardBrand: any;
    cardExpiry: any;
    cardHolderName: any;
    upiHandle: any;
    walletProvider: string;
    metadata: string;
    userId: string;
    gateway: string;
    gatewayMethodId: string;
    isDefault: boolean;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockPaymentOrder: (overrides?: Partial<any>) => {
    id: string;
    userId: string;
    schoolId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    description: string;
    metadata: string;
    razorpayOrderId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockPaymentTransaction: (overrides?: Partial<any>) => {
    id: string;
    orderId: string;
    userId: string;
    schoolId: string;
    paymentMethodId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    type: PaymentMethodType;
    method: PaymentMethodType;
    gateway: string;
    razorpayPaymentId: string;
    gatewayTransactionId: string;
    gatewayOrderId: string;
    description: string;
    gatewayMetadata: string;
    fees: string;
    failureReason: any;
    refundReason: any;
    notes: string;
    paidAt: Date;
    capturedAt: Date;
    refundedAt: any;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockFailedPaymentTransaction: (overrides?: Partial<any>) => {
    id: string;
    status: PaymentStatus;
    razorpayPaymentId: string;
    failureReason: string;
    paidAt: any;
    capturedAt: any;
    orderId: string;
    userId: string;
    schoolId: string;
    paymentMethodId: string;
    amount: number;
    currency: string;
    type: PaymentMethodType;
    method: PaymentMethodType;
    gateway: string;
    gatewayTransactionId: string;
    gatewayOrderId: string;
    description: string;
    gatewayMetadata: string;
    fees: string;
    refundReason: any;
    notes: string;
    refundedAt: any;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockOrder: (overrides?: Partial<any>) => {
    id: string;
    userId: string;
    schoolId: string;
    rfidTagId: string;
    totalAmount: number;
    currency: "INR";
    status: string;
    type: string;
    items: {
        id: string;
        name: string;
        price: number;
        quantity: number;
        category: string;
        description: string;
    }[];
    metadata: string;
    paymentTransactionId: string;
    estimatedPrepTime: number;
    actualPrepTime: any;
    deliveredAt: any;
    cancelledAt: any;
    cancellationReason: any;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockRFIDTag: (overrides?: Partial<any>) => {
    id: string;
    userId: string;
    schoolId: string;
    tagNumber: string;
    balance: number;
    status: string;
    isBlocked: boolean;
    lastTransactionId: string;
    lastActivity: Date;
    metadata: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockPaymentRetry: (overrides?: Partial<any>) => {
    id: string;
    paymentTransactionId: string;
    retryCount: number;
    maxRetries: number;
    nextRetryAt: Date;
    lastAttemptAt: Date;
    failureReason: string;
    isExhausted: boolean;
    strategy: string;
    metadata: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockPaymentPlan: (overrides?: Partial<any>) => {
    id: string;
    name: string;
    description: string;
    amount: number;
    currency: "INR";
    interval: string;
    intervalCount: number;
    trialPeriodDays: number;
    maxCycles: any;
    setupFee: number;
    metadata: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockSubscription: (overrides?: Partial<any>) => {
    id: string;
    userId: string;
    schoolId: string;
    subscriptionPlanId: string;
    paymentMethodId: string;
    status: string;
    currentCycle: number;
    totalCycles: any;
    nextBillingDate: Date;
    trialStartDate: Date;
    trialEndDate: Date;
    activatedAt: Date;
    metadata: string;
    pausedAt: any;
    pauseReason: any;
    resumedAt: any;
    cancelledAt: any;
    cancellationReason: any;
    suspendedAt: any;
    suspensionReason: any;
    lastBillingDate: any;
    lastPaymentDate: any;
    lastFailedPaymentAt: any;
    failedPaymentCount: number;
    prorationAmount: any;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
    subscriptionPlan: {
        id: string;
        name: string;
        description: string;
        amount: number;
        currency: "INR";
        interval: string;
        intervalCount: number;
        trialPeriodDays: number;
        maxCycles: any;
        setupFee: number;
        metadata: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    user: {
        id: string;
        email: string;
        name: string;
        phone: string;
        role: string;
        schoolId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
};
export declare const createMockSubscriptionPlan: (overrides?: Partial<any>) => {
    id: string;
    name: string;
    description: string;
    amount: number;
    currency: "INR";
    interval: string;
    intervalCount: number;
    trialPeriodDays: number;
    maxCycles: any;
    setupFee: number;
    features: string[];
    metadata: string;
    isActive: boolean;
    sortOrder: number;
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockBillingCycle: (overrides?: Partial<any>) => {
    id: string;
    subscriptionId: string;
    cycleNumber: number;
    startDate: Date;
    endDate: Date;
    billingDate: Date;
    dueDate: Date;
    amount: number;
    prorationAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
    paymentTransactionId: string;
    invoice: string;
    paidAt: Date;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockTrialSubscription: (overrides?: Partial<any>) => {
    id: string;
    userId: string;
    schoolId: string;
    subscriptionPlanId: string;
    paymentMethodId: string;
    status: string;
    currentCycle: number;
    totalCycles: any;
    nextBillingDate: Date;
    trialStartDate: Date;
    trialEndDate: Date;
    activatedAt: Date;
    metadata: string;
    pausedAt: any;
    pauseReason: any;
    resumedAt: any;
    cancelledAt: any;
    cancellationReason: any;
    suspendedAt: any;
    suspensionReason: any;
    lastBillingDate: any;
    lastPaymentDate: any;
    lastFailedPaymentAt: any;
    failedPaymentCount: number;
    prorationAmount: any;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
    subscriptionPlan: {
        id: string;
        name: string;
        description: string;
        amount: number;
        currency: "INR";
        interval: string;
        intervalCount: number;
        trialPeriodDays: number;
        maxCycles: any;
        setupFee: number;
        metadata: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    user: {
        id: string;
        email: string;
        name: string;
        phone: string;
        role: string;
        schoolId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
};
export declare const createMockCancelledSubscription: (overrides?: Partial<any>) => {
    id: string;
    userId: string;
    schoolId: string;
    subscriptionPlanId: string;
    paymentMethodId: string;
    status: string;
    currentCycle: number;
    totalCycles: any;
    nextBillingDate: Date;
    trialStartDate: Date;
    trialEndDate: Date;
    activatedAt: Date;
    metadata: string;
    pausedAt: any;
    pauseReason: any;
    resumedAt: any;
    cancelledAt: any;
    cancellationReason: any;
    suspendedAt: any;
    suspensionReason: any;
    lastBillingDate: any;
    lastPaymentDate: any;
    lastFailedPaymentAt: any;
    failedPaymentCount: number;
    prorationAmount: any;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
    subscriptionPlan: {
        id: string;
        name: string;
        description: string;
        amount: number;
        currency: "INR";
        interval: string;
        intervalCount: number;
        trialPeriodDays: number;
        maxCycles: any;
        setupFee: number;
        metadata: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    user: {
        id: string;
        email: string;
        name: string;
        phone: string;
        role: string;
        schoolId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
};
export declare const createMockSuspendedSubscription: (overrides?: Partial<any>) => {
    id: string;
    userId: string;
    schoolId: string;
    subscriptionPlanId: string;
    paymentMethodId: string;
    status: string;
    currentCycle: number;
    totalCycles: any;
    nextBillingDate: Date;
    trialStartDate: Date;
    trialEndDate: Date;
    activatedAt: Date;
    metadata: string;
    pausedAt: any;
    pauseReason: any;
    resumedAt: any;
    cancelledAt: any;
    cancellationReason: any;
    suspendedAt: any;
    suspensionReason: any;
    lastBillingDate: any;
    lastPaymentDate: any;
    lastFailedPaymentAt: any;
    failedPaymentCount: number;
    prorationAmount: any;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
    subscriptionPlan: {
        id: string;
        name: string;
        description: string;
        amount: number;
        currency: "INR";
        interval: string;
        intervalCount: number;
        trialPeriodDays: number;
        maxCycles: any;
        setupFee: number;
        metadata: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    user: {
        id: string;
        email: string;
        name: string;
        phone: string;
        role: string;
        schoolId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
};
export declare const createMockDunningConfig: (overrides?: Partial<any>) => {
    id: string;
    schoolId: string;
    maxRetries: number;
    retryIntervalDays: number[];
    gracePeriodDays: number;
    autoSuspendAfterDays: number;
    autoCancelAfterDays: number;
    notificationSettings: {
        emailEnabled: boolean;
        smsEnabled: boolean;
        whatsappEnabled: boolean;
    };
    emailTemplates: string;
    smsTemplates: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockSubscriptionAnalytics: (overrides?: Partial<any>) => {
    id: string;
    schoolId: string;
    period: string;
    periodStart: Date;
    periodEnd: Date;
    metrics: {
        totalSubscriptions: number;
        activeSubscriptions: number;
        newSubscriptions: number;
        cancelledSubscriptions: number;
        suspendedSubscriptions: number;
        churnRate: number;
        revenueGenerated: number;
        averageRevenuePerUser: number;
        lifetimeValue: number;
        cohortAnalysis: {
            month1Retention: number;
            month3Retention: number;
            month6Retention: number;
            month12Retention: number;
        };
    };
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockRefund: (overrides?: Partial<any>) => {
    id: string;
    paymentTransactionId: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: "INR";
    reason: string;
    status: string;
    type: string;
    gateway: "razorpay";
    gatewayRefundId: string;
    metadata: string;
    processedAt: Date;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockPaymentAnalytics: (overrides?: Partial<any>) => {
    schoolId: string;
    period: string;
    date: Date;
    metrics: {
        totalTransactions: number;
        successfulTransactions: number;
        failedTransactions: number;
        totalAmount: number;
        successfulAmount: number;
        failedAmount: number;
        successRate: number;
        averageTransactionAmount: number;
        paymentMethodDistribution: {
            card: number;
            upi: number;
            wallet: number;
            netbanking: number;
        };
        gatewayDistribution: {
            razorpay: number;
            payu: number;
        };
        hourlyDistribution: {
            '09': number;
            '10': number;
            '11': number;
            '12': number;
            '13': number;
            '14': number;
            '15': number;
            '16': number;
            '17': number;
        };
    };
};
export declare const mockRazorpayResponses: {
    createOrder: {
        id: string;
        entity: string;
        amount: number;
        amount_paid: number;
        amount_due: number;
        currency: string;
        receipt: string;
        status: string;
        attempts: number;
        notes: {
            order_id: string;
            user_id: string;
        };
        created_at: number;
    };
    createCustomer: {
        id: string;
        entity: string;
        name: string;
        email: string;
        contact: string;
        gstin: any;
        notes: {
            user_id: string;
        };
        created_at: number;
    };
    capturePayment: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id: any;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status: any;
        captured: boolean;
        description: string;
        card_id: string;
        bank: string;
        wallet: any;
        vpa: any;
        email: string;
        contact: string;
        notes: {
            order_id: string;
        };
        fee: number;
        tax: number;
        error_code: any;
        error_description: any;
        created_at: number;
    };
    failedPayment: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        method: string;
        captured: boolean;
        description: string;
        error_code: string;
        error_description: string;
        created_at: number;
    };
    createRefund: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        payment_id: string;
        notes: {
            reason: string;
        };
        receipt: any;
        acquirer_data: {
            rrn: string;
        };
        created_at: number;
        batch_id: any;
        status: string;
        speed_processed: string;
    };
};
export declare const mockWebhookPayloads: {
    paymentCaptured: {
        entity: string;
        account_id: string;
        event: string;
        contains: string[];
        payload: {
            payment: {
                entity: {
                    id: string;
                    entity: string;
                    amount: number;
                    currency: string;
                    status: string;
                    order_id: string;
                    invoice_id: any;
                    international: boolean;
                    method: string;
                    amount_refunded: number;
                    refund_status: any;
                    captured: boolean;
                    description: string;
                    card_id: string;
                    bank: string;
                    wallet: any;
                    vpa: any;
                    email: string;
                    contact: string;
                    notes: {
                        order_id: string;
                    };
                    fee: number;
                    tax: number;
                    error_code: any;
                    error_description: any;
                    acquirer_data: {
                        rrn: string;
                    };
                    created_at: number;
                };
            };
        };
        created_at: number;
    };
    paymentFailed: {
        entity: string;
        account_id: string;
        event: string;
        contains: string[];
        payload: {
            payment: {
                entity: {
                    id: string;
                    entity: string;
                    amount: number;
                    currency: string;
                    status: string;
                    order_id: string;
                    method: string;
                    captured: boolean;
                    description: string;
                    error_code: string;
                    error_description: string;
                    error_source: string;
                    error_step: string;
                    error_reason: string;
                    created_at: number;
                };
            };
        };
        created_at: number;
    };
    refundProcessed: {
        entity: string;
        account_id: string;
        event: string;
        contains: string[];
        payload: {
            refund: {
                entity: {
                    id: string;
                    entity: string;
                    amount: number;
                    currency: string;
                    payment_id: string;
                    notes: {
                        reason: string;
                    };
                    receipt: any;
                    acquirer_data: {
                        rrn: string;
                    };
                    created_at: number;
                    batch_id: any;
                    status: string;
                    speed_processed: string;
                };
            };
        };
        created_at: number;
    };
    orderPaid: {
        entity: string;
        account_id: string;
        event: string;
        contains: string[];
        payload: {
            order: {
                entity: {
                    id: string;
                    entity: string;
                    amount: number;
                    amount_paid: number;
                    amount_due: number;
                    currency: string;
                    receipt: string;
                    status: string;
                    attempts: number;
                    notes: {
                        order_id: string;
                        user_id: string;
                    };
                    created_at: number;
                };
            };
        };
        created_at: number;
    };
};
export declare const createMockAPIGatewayEvent: (method: string, path: string, body?: any, pathParameters?: Record<string, string>, headers?: Record<string, string>) => {
    httpMethod: string;
    path: string;
    body: string;
    pathParameters: Record<string, string>;
    headers: {
        'Content-Type': string;
        'User-Agent': string;
        'X-Request-ID': string;
    };
    queryStringParameters: any;
    multiValueQueryStringParameters: any;
    requestContext: {
        requestId: string;
        identity: {
            sourceIp: string;
        };
        httpMethod: string;
        path: string;
        stage: string;
        requestTime: string;
        requestTimeEpoch: number;
    };
    isBase64Encoded: boolean;
    resource: string;
    stageVariables: any;
    multiValueHeaders: {};
};
export declare const createMockLambdaContext: () => {
    callbackWaitsForEmptyEventLoop: boolean;
    functionName: string;
    functionVersion: string;
    invokedFunctionArn: string;
    memoryLimitInMB: string;
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
    identity: any;
    clientContext: any;
    getRemainingTimeInMillis: () => number;
};
export declare const createMockAuthResult: (overrides?: Partial<any>) => {
    isAuthenticated: boolean;
    user: {
        id: string;
        email: string;
        name: string;
        phone: string;
        role: string;
        schoolId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    school: {
        id: string;
        name: string;
        address: string;
        phone: string;
        email: string;
        website: string;
        principalName: string;
        isActive: boolean;
        settings: {
            paymentGateways: string[];
            currencies: string[];
            taxRate: number;
            serviceCharges: number;
        };
        createdAt: Date;
        updatedAt: Date;
    };
    permissions: string[];
    session: {
        id: string;
        userId: string;
        token: string;
        refreshToken: string;
        expiresAt: Date;
        createdAt: Date;
    };
};
export declare const createMockUnauthResult: () => {
    isAuthenticated: boolean;
    user: any;
    school: any;
    permissions: any[];
    session: any;
    error: string;
};
export declare const mockErrors: {
    insufficientFunds: Error;
    invalidCard: Error;
    paymentTimeout: Error;
    gatewayError: Error;
    orderNotFound: Error;
    orderExpired: Error;
    orderAlreadyPaid: Error;
    userNotFound: Error;
    userNotActive: Error;
    insufficientBalance: Error;
    databaseError: Error;
    externalServiceError: Error;
    validationError: Error;
};
export declare const generateMultiplePaymentMethods: (count: number, userId?: string) => any[];
export declare const generateMultipleTransactions: (count: number, userId?: string) => any[];
export declare const generateMultipleRetries: (count: number, transactionId?: string) => any[];
export declare const generateMultipleSubscriptions: (count: number, userId?: string) => any[];
export declare const generateMultipleBillingCycles: (count: number, subscriptionId?: string) => any[];
export declare const generatePaymentAnalyticsData: (days?: number) => any[];
export declare const generateMockWebhookSignature: (payload: string, secret?: string) => string;
export declare const createMockPaymentFormData: (overrides?: Partial<any>) => {
    amount: number;
    currency: string;
    description: string;
    customer: {
        name: string;
        email: string;
        contact: string;
    };
    paymentMethod: {
        type: string;
        cardNumber: string;
        expiryMonth: string;
        expiryYear: string;
        cvv: string;
        holderName: string;
    };
    billingAddress: {
        line1: string;
        line2: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    metadata: {
        orderId: string;
        userId: string;
        schoolId: string;
    };
};
export declare const createMockUPIFormData: (overrides?: Partial<any>) => {
    amount: number;
    currency: string;
    description: string;
    customer: {
        name: string;
        email: string;
        contact: string;
    };
    paymentMethod: {
        type: string;
        vpa: string;
    };
    metadata: {
        orderId: string;
        userId: string;
        schoolId: string;
    };
};
export declare const createMockWalletFormData: (overrides?: Partial<any>) => {
    amount: number;
    currency: string;
    description: string;
    customer: {
        name: string;
        email: string;
        contact: string;
    };
    paymentMethod: {
        type: string;
        provider: string;
    };
    metadata: {
        orderId: string;
        userId: string;
        schoolId: string;
    };
};
export declare const mockValidationResponses: {
    validCard: {
        isValid: boolean;
        cardType: string;
        issuer: string;
        country: string;
        warnings: any[];
    };
    invalidCard: {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    validUPI: {
        isValid: boolean;
        provider: string;
        verified: boolean;
        warnings: any[];
    };
    invalidUPI: {
        isValid: boolean;
        errors: string[];
        warnings: any[];
    };
};
export declare const mockPaymentFlowStates: {
    initiated: {
        orderId: string;
        status: string;
        step: string;
        progress: number;
        nextAction: string;
        timeRemaining: number;
        metadata: {
            sessionId: string;
            retryCount: number;
        };
    };
    processing: {
        orderId: string;
        status: string;
        step: string;
        progress: number;
        nextAction: string;
        timeRemaining: number;
        metadata: {
            sessionId: string;
            gatewayTransactionId: string;
        };
    };
    completed: {
        orderId: string;
        status: string;
        step: string;
        progress: number;
        nextAction: string;
        timeRemaining: number;
        metadata: {
            sessionId: string;
            paymentId: string;
            receiptUrl: string;
        };
    };
    failed: {
        orderId: string;
        status: string;
        step: string;
        progress: number;
        nextAction: string;
        timeRemaining: number;
        error: {
            code: string;
            message: string;
            retryable: boolean;
        };
        metadata: {
            sessionId: string;
            failureCount: number;
        };
    };
};
export declare const mockSubscriptionEvents: {
    subscriptionCreated: {
        id: string;
        event: string;
        timestamp: Date;
        data: {
            id: string;
            userId: string;
            schoolId: string;
            subscriptionPlanId: string;
            paymentMethodId: string;
            status: string;
            currentCycle: number;
            totalCycles: any;
            nextBillingDate: Date;
            trialStartDate: Date;
            trialEndDate: Date;
            activatedAt: Date;
            metadata: string;
            pausedAt: any;
            pauseReason: any;
            resumedAt: any;
            cancelledAt: any;
            cancellationReason: any;
            suspendedAt: any;
            suspensionReason: any;
            lastBillingDate: any;
            lastPaymentDate: any;
            lastFailedPaymentAt: any;
            failedPaymentCount: number;
            prorationAmount: any;
            discountAmount: number;
            taxAmount: number;
            totalAmount: number;
            createdAt: Date;
            updatedAt: Date;
            subscriptionPlan: {
                id: string;
                name: string;
                description: string;
                amount: number;
                currency: "INR";
                interval: string;
                intervalCount: number;
                trialPeriodDays: number;
                maxCycles: any;
                setupFee: number;
                metadata: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            user: {
                id: string;
                email: string;
                name: string;
                phone: string;
                role: string;
                schoolId: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        };
    };
    subscriptionActivated: {
        id: string;
        event: string;
        timestamp: Date;
        data: {
            id: string;
            userId: string;
            schoolId: string;
            subscriptionPlanId: string;
            paymentMethodId: string;
            status: string;
            currentCycle: number;
            totalCycles: any;
            nextBillingDate: Date;
            trialStartDate: Date;
            trialEndDate: Date;
            activatedAt: Date;
            metadata: string;
            pausedAt: any;
            pauseReason: any;
            resumedAt: any;
            cancelledAt: any;
            cancellationReason: any;
            suspendedAt: any;
            suspensionReason: any;
            lastBillingDate: any;
            lastPaymentDate: any;
            lastFailedPaymentAt: any;
            failedPaymentCount: number;
            prorationAmount: any;
            discountAmount: number;
            taxAmount: number;
            totalAmount: number;
            createdAt: Date;
            updatedAt: Date;
            subscriptionPlan: {
                id: string;
                name: string;
                description: string;
                amount: number;
                currency: "INR";
                interval: string;
                intervalCount: number;
                trialPeriodDays: number;
                maxCycles: any;
                setupFee: number;
                metadata: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            user: {
                id: string;
                email: string;
                name: string;
                phone: string;
                role: string;
                schoolId: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        };
    };
    subscriptionCancelled: {
        id: string;
        event: string;
        timestamp: Date;
        data: {
            id: string;
            userId: string;
            schoolId: string;
            subscriptionPlanId: string;
            paymentMethodId: string;
            status: string;
            currentCycle: number;
            totalCycles: any;
            nextBillingDate: Date;
            trialStartDate: Date;
            trialEndDate: Date;
            activatedAt: Date;
            metadata: string;
            pausedAt: any;
            pauseReason: any;
            resumedAt: any;
            cancelledAt: any;
            cancellationReason: any;
            suspendedAt: any;
            suspensionReason: any;
            lastBillingDate: any;
            lastPaymentDate: any;
            lastFailedPaymentAt: any;
            failedPaymentCount: number;
            prorationAmount: any;
            discountAmount: number;
            taxAmount: number;
            totalAmount: number;
            createdAt: Date;
            updatedAt: Date;
            subscriptionPlan: {
                id: string;
                name: string;
                description: string;
                amount: number;
                currency: "INR";
                interval: string;
                intervalCount: number;
                trialPeriodDays: number;
                maxCycles: any;
                setupFee: number;
                metadata: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            user: {
                id: string;
                email: string;
                name: string;
                phone: string;
                role: string;
                schoolId: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        };
    };
    paymentFailed: {
        id: string;
        event: string;
        timestamp: Date;
        data: {
            subscription: {
                id: string;
                userId: string;
                schoolId: string;
                subscriptionPlanId: string;
                paymentMethodId: string;
                status: string;
                currentCycle: number;
                totalCycles: any;
                nextBillingDate: Date;
                trialStartDate: Date;
                trialEndDate: Date;
                activatedAt: Date;
                metadata: string;
                pausedAt: any;
                pauseReason: any;
                resumedAt: any;
                cancelledAt: any;
                cancellationReason: any;
                suspendedAt: any;
                suspensionReason: any;
                lastBillingDate: any;
                lastPaymentDate: any;
                lastFailedPaymentAt: any;
                failedPaymentCount: number;
                prorationAmount: any;
                discountAmount: number;
                taxAmount: number;
                totalAmount: number;
                createdAt: Date;
                updatedAt: Date;
                subscriptionPlan: {
                    id: string;
                    name: string;
                    description: string;
                    amount: number;
                    currency: "INR";
                    interval: string;
                    intervalCount: number;
                    trialPeriodDays: number;
                    maxCycles: any;
                    setupFee: number;
                    metadata: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                };
                user: {
                    id: string;
                    email: string;
                    name: string;
                    phone: string;
                    role: string;
                    schoolId: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                };
            };
            payment: {
                id: string;
                status: PaymentStatus;
                razorpayPaymentId: string;
                failureReason: string;
                paidAt: any;
                capturedAt: any;
                orderId: string;
                userId: string;
                schoolId: string;
                paymentMethodId: string;
                amount: number;
                currency: string;
                type: PaymentMethodType;
                method: PaymentMethodType;
                gateway: string;
                gatewayTransactionId: string;
                gatewayOrderId: string;
                description: string;
                gatewayMetadata: string;
                fees: string;
                refundReason: any;
                notes: string;
                refundedAt: any;
                createdAt: Date;
                updatedAt: Date;
            };
        };
    };
};
export declare const mockPaymentAnalyticsAggregations: {
    daily: {
        period: string;
        data: any[];
    };
    weekly: {
        period: string;
        data: {
            week: number;
            weekStart: Date;
            weekEnd: Date;
            metrics: {
                totalTransactions: number;
                totalAmount: number;
                successRate: number;
            };
        }[];
    };
    monthly: {
        period: string;
        data: {
            month: number;
            year: number;
            monthStart: Date;
            monthEnd: Date;
            metrics: {
                totalTransactions: number;
                totalAmount: number;
                successRate: number;
                averageOrderValue: number;
                uniqueUsers: number;
                repeatCustomers: number;
            };
        }[];
    };
};
export declare const createMockRFIDTransaction: (overrides?: Partial<any>) => {
    id: string;
    rfidTagId: string;
    userId: string;
    schoolId: string;
    type: string;
    amount: number;
    balance: number;
    description: string;
    orderId: string;
    merchantId: string;
    deviceId: string;
    location: string;
    metadata: string;
    processedAt: Date;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockRFIDTopUpTransaction: (overrides?: Partial<any>) => {
    id: string;
    type: string;
    amount: number;
    balance: number;
    description: string;
    orderId: any;
    merchantId: any;
    paymentTransactionId: string;
    metadata: string;
    rfidTagId: string;
    userId: string;
    schoolId: string;
    deviceId: string;
    location: string;
    processedAt: Date;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockPaymentSettlement: (overrides?: Partial<any>) => {
    id: string;
    schoolId: string;
    gateway: "razorpay";
    settlementId: string;
    amount: number;
    fees: number;
    tax: number;
    netAmount: number;
    transactionCount: number;
    period: {
        start: Date;
        end: Date;
    };
    status: string;
    bankAccount: {
        accountNumber: string;
        ifscCode: string;
        bankName: string;
    };
    metadata: string;
    processedAt: Date;
    createdAt: Date;
    updatedAt: Date;
};
export declare const createMockPaymentDispute: (overrides?: Partial<any>) => {
    id: string;
    paymentTransactionId: string;
    userId: string;
    schoolId: string;
    gatewayDisputeId: string;
    amount: number;
    currency: "INR";
    reason: string;
    status: string;
    phase: string;
    evidence: string;
    dueBy: Date;
    respondBy: Date;
    gatewayNotifiedAt: Date;
    resolvedAt: any;
    resolution: any;
    metadata: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare const mockPaymentPlanComparisons: {
    plans: {
        id: string;
        name: string;
        description: string;
        amount: number;
        currency: "INR";
        interval: string;
        intervalCount: number;
        trialPeriodDays: number;
        maxCycles: any;
        setupFee: number;
        metadata: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[];
    comparison: {
        mostPopular: string;
        bestValue: string;
        recommended: string;
    };
};
export declare const createMockGatewayHealthCheck: (overrides?: Partial<any>) => {
    gateway: "razorpay";
    status: string;
    responseTime: number;
    lastChecked: Date;
    uptime: number;
    errorRate: number;
    metrics: {
        avgResponseTime: number;
        maxResponseTime: number;
        minResponseTime: number;
        timeoutRate: number;
        successRate: number;
    };
    endpoints: {
        createOrder: {
            status: string;
            responseTime: number;
        };
        capturePayment: {
            status: string;
            responseTime: number;
        };
        createRefund: {
            status: string;
            responseTime: number;
        };
        webhooks: {
            status: string;
            responseTime: number;
        };
    };
};
export declare const mockGatewayErrors: {
    invalidRequest: {
        error: {
            code: string;
            description: string;
            source: string;
            step: string;
            reason: string;
            metadata: {
                field: string;
                value: string;
            };
        };
    };
    gatewayError: {
        error: {
            code: string;
            description: string;
            source: string;
            step: string;
            reason: string;
        };
    };
    serverError: {
        error: {
            code: string;
            description: string;
            source: string;
            step: string;
            reason: string;
        };
    };
};
export declare const resetAllMocks: () => void;
export declare const setupPaymentMocks: () => void;
export declare const setupDatabaseMocks: () => void;
export declare const mockEnvVars: {
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;
    RAZORPAY_WEBHOOK_SECRET: string;
    PAYMENT_CURRENCY: string;
    PAYMENT_TIMEOUT: string;
    MAX_PAYMENT_RETRIES: string;
    PAYMENT_SUCCESS_URL: string;
    PAYMENT_FAILURE_URL: string;
};
export declare const setupTestEnvironment: () => void;
export declare const cleanupTestEnvironment: () => void;
export declare const mockDateUtils: {
    now: Date;
    tomorrow: Date;
    yesterday: Date;
    nextWeek: Date;
    nextMonth: Date;
    addDays: (days: number) => Date;
    addHours: (hours: number) => Date;
    addMinutes: (minutes: number) => Date;
};
export declare const setupMockTimers: () => void;
export declare const cleanupMockTimers: () => void;
export * from './payment-mocks';
declare const _default: {
    createMockUser: (overrides?: Partial<any>) => {
        id: string;
        email: string;
        name: string;
        phone: string;
        role: string;
        schoolId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockSchool: (overrides?: Partial<any>) => {
        id: string;
        name: string;
        address: string;
        phone: string;
        email: string;
        website: string;
        principalName: string;
        isActive: boolean;
        settings: {
            paymentGateways: string[];
            currencies: string[];
            taxRate: number;
            serviceCharges: number;
        };
        createdAt: Date;
        updatedAt: Date;
    };
    createMockPaymentMethod: (overrides?: Partial<any>) => {
        id: string;
        userId: string;
        type: PaymentMethodType;
        method: PaymentMethodType;
        gateway: string;
        gatewayMethodId: string;
        isDefault: boolean;
        cardLast4: string;
        cardBrand: string;
        cardExpiry: string;
        cardHolderName: string;
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        upiHandle: string;
        walletProvider: string;
        isVerified: boolean;
        metadata: string;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockUPIPaymentMethod: (overrides?: Partial<any>) => {
        id: string;
        type: PaymentMethodType;
        method: PaymentMethodType;
        cardLast4: any;
        cardBrand: any;
        cardExpiry: any;
        cardHolderName: any;
        upiHandle: string;
        metadata: string;
        userId: string;
        gateway: string;
        gatewayMethodId: string;
        isDefault: boolean;
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        walletProvider: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockWalletPaymentMethod: (overrides?: Partial<any>) => {
        id: string;
        type: PaymentMethodType;
        method: PaymentMethodType;
        cardLast4: any;
        cardBrand: any;
        cardExpiry: any;
        cardHolderName: any;
        upiHandle: any;
        walletProvider: string;
        metadata: string;
        userId: string;
        gateway: string;
        gatewayMethodId: string;
        isDefault: boolean;
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockPaymentOrder: (overrides?: Partial<any>) => {
        id: string;
        userId: string;
        schoolId: string;
        amount: number;
        currency: string;
        status: PaymentStatus;
        description: string;
        metadata: string;
        razorpayOrderId: string;
        expiresAt: Date;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockPaymentTransaction: (overrides?: Partial<any>) => {
        id: string;
        orderId: string;
        userId: string;
        schoolId: string;
        paymentMethodId: string;
        amount: number;
        currency: string;
        status: PaymentStatus;
        type: PaymentMethodType;
        method: PaymentMethodType;
        gateway: string;
        razorpayPaymentId: string;
        gatewayTransactionId: string;
        gatewayOrderId: string;
        description: string;
        gatewayMetadata: string;
        fees: string;
        failureReason: any;
        refundReason: any;
        notes: string;
        paidAt: Date;
        capturedAt: Date;
        refundedAt: any;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockFailedPaymentTransaction: (overrides?: Partial<any>) => {
        id: string;
        status: PaymentStatus;
        razorpayPaymentId: string;
        failureReason: string;
        paidAt: any;
        capturedAt: any;
        orderId: string;
        userId: string;
        schoolId: string;
        paymentMethodId: string;
        amount: number;
        currency: string;
        type: PaymentMethodType;
        method: PaymentMethodType;
        gateway: string;
        gatewayTransactionId: string;
        gatewayOrderId: string;
        description: string;
        gatewayMetadata: string;
        fees: string;
        refundReason: any;
        notes: string;
        refundedAt: any;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockOrder: (overrides?: Partial<any>) => {
        id: string;
        userId: string;
        schoolId: string;
        rfidTagId: string;
        totalAmount: number;
        currency: "INR";
        status: string;
        type: string;
        items: {
            id: string;
            name: string;
            price: number;
            quantity: number;
            category: string;
            description: string;
        }[];
        metadata: string;
        paymentTransactionId: string;
        estimatedPrepTime: number;
        actualPrepTime: any;
        deliveredAt: any;
        cancelledAt: any;
        cancellationReason: any;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockRFIDTag: (overrides?: Partial<any>) => {
        id: string;
        userId: string;
        schoolId: string;
        tagNumber: string;
        balance: number;
        status: string;
        isBlocked: boolean;
        lastTransactionId: string;
        lastActivity: Date;
        metadata: string;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockPaymentRetry: (overrides?: Partial<any>) => {
        id: string;
        paymentTransactionId: string;
        retryCount: number;
        maxRetries: number;
        nextRetryAt: Date;
        lastAttemptAt: Date;
        failureReason: string;
        isExhausted: boolean;
        strategy: string;
        metadata: string;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockPaymentPlan: (overrides?: Partial<any>) => {
        id: string;
        name: string;
        description: string;
        amount: number;
        currency: "INR";
        interval: string;
        intervalCount: number;
        trialPeriodDays: number;
        maxCycles: any;
        setupFee: number;
        metadata: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockSubscription: (overrides?: Partial<any>) => {
        id: string;
        userId: string;
        schoolId: string;
        subscriptionPlanId: string;
        paymentMethodId: string;
        status: string;
        currentCycle: number;
        totalCycles: any;
        nextBillingDate: Date;
        trialStartDate: Date;
        trialEndDate: Date;
        activatedAt: Date;
        metadata: string;
        pausedAt: any;
        pauseReason: any;
        resumedAt: any;
        cancelledAt: any;
        cancellationReason: any;
        suspendedAt: any;
        suspensionReason: any;
        lastBillingDate: any;
        lastPaymentDate: any;
        lastFailedPaymentAt: any;
        failedPaymentCount: number;
        prorationAmount: any;
        discountAmount: number;
        taxAmount: number;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
        subscriptionPlan: {
            id: string;
            name: string;
            description: string;
            amount: number;
            currency: "INR";
            interval: string;
            intervalCount: number;
            trialPeriodDays: number;
            maxCycles: any;
            setupFee: number;
            metadata: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        user: {
            id: string;
            email: string;
            name: string;
            phone: string;
            role: string;
            schoolId: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    };
    createMockTrialSubscription: (overrides?: Partial<any>) => {
        id: string;
        userId: string;
        schoolId: string;
        subscriptionPlanId: string;
        paymentMethodId: string;
        status: string;
        currentCycle: number;
        totalCycles: any;
        nextBillingDate: Date;
        trialStartDate: Date;
        trialEndDate: Date;
        activatedAt: Date;
        metadata: string;
        pausedAt: any;
        pauseReason: any;
        resumedAt: any;
        cancelledAt: any;
        cancellationReason: any;
        suspendedAt: any;
        suspensionReason: any;
        lastBillingDate: any;
        lastPaymentDate: any;
        lastFailedPaymentAt: any;
        failedPaymentCount: number;
        prorationAmount: any;
        discountAmount: number;
        taxAmount: number;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
        subscriptionPlan: {
            id: string;
            name: string;
            description: string;
            amount: number;
            currency: "INR";
            interval: string;
            intervalCount: number;
            trialPeriodDays: number;
            maxCycles: any;
            setupFee: number;
            metadata: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        user: {
            id: string;
            email: string;
            name: string;
            phone: string;
            role: string;
            schoolId: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    };
    createMockCancelledSubscription: (overrides?: Partial<any>) => {
        id: string;
        userId: string;
        schoolId: string;
        subscriptionPlanId: string;
        paymentMethodId: string;
        status: string;
        currentCycle: number;
        totalCycles: any;
        nextBillingDate: Date;
        trialStartDate: Date;
        trialEndDate: Date;
        activatedAt: Date;
        metadata: string;
        pausedAt: any;
        pauseReason: any;
        resumedAt: any;
        cancelledAt: any;
        cancellationReason: any;
        suspendedAt: any;
        suspensionReason: any;
        lastBillingDate: any;
        lastPaymentDate: any;
        lastFailedPaymentAt: any;
        failedPaymentCount: number;
        prorationAmount: any;
        discountAmount: number;
        taxAmount: number;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
        subscriptionPlan: {
            id: string;
            name: string;
            description: string;
            amount: number;
            currency: "INR";
            interval: string;
            intervalCount: number;
            trialPeriodDays: number;
            maxCycles: any;
            setupFee: number;
            metadata: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        user: {
            id: string;
            email: string;
            name: string;
            phone: string;
            role: string;
            schoolId: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    };
    createMockSuspendedSubscription: (overrides?: Partial<any>) => {
        id: string;
        userId: string;
        schoolId: string;
        subscriptionPlanId: string;
        paymentMethodId: string;
        status: string;
        currentCycle: number;
        totalCycles: any;
        nextBillingDate: Date;
        trialStartDate: Date;
        trialEndDate: Date;
        activatedAt: Date;
        metadata: string;
        pausedAt: any;
        pauseReason: any;
        resumedAt: any;
        cancelledAt: any;
        cancellationReason: any;
        suspendedAt: any;
        suspensionReason: any;
        lastBillingDate: any;
        lastPaymentDate: any;
        lastFailedPaymentAt: any;
        failedPaymentCount: number;
        prorationAmount: any;
        discountAmount: number;
        taxAmount: number;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
        subscriptionPlan: {
            id: string;
            name: string;
            description: string;
            amount: number;
            currency: "INR";
            interval: string;
            intervalCount: number;
            trialPeriodDays: number;
            maxCycles: any;
            setupFee: number;
            metadata: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        user: {
            id: string;
            email: string;
            name: string;
            phone: string;
            role: string;
            schoolId: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    };
    createMockSubscriptionPlan: (overrides?: Partial<any>) => {
        id: string;
        name: string;
        description: string;
        amount: number;
        currency: "INR";
        interval: string;
        intervalCount: number;
        trialPeriodDays: number;
        maxCycles: any;
        setupFee: number;
        features: string[];
        metadata: string;
        isActive: boolean;
        sortOrder: number;
        isVisible: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockBillingCycle: (overrides?: Partial<any>) => {
        id: string;
        subscriptionId: string;
        cycleNumber: number;
        startDate: Date;
        endDate: Date;
        billingDate: Date;
        dueDate: Date;
        amount: number;
        prorationAmount: number;
        discountAmount: number;
        taxAmount: number;
        totalAmount: number;
        status: string;
        paymentTransactionId: string;
        invoice: string;
        paidAt: Date;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockDunningConfig: (overrides?: Partial<any>) => {
        id: string;
        schoolId: string;
        maxRetries: number;
        retryIntervalDays: number[];
        gracePeriodDays: number;
        autoSuspendAfterDays: number;
        autoCancelAfterDays: number;
        notificationSettings: {
            emailEnabled: boolean;
            smsEnabled: boolean;
            whatsappEnabled: boolean;
        };
        emailTemplates: string;
        smsTemplates: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockSubscriptionAnalytics: (overrides?: Partial<any>) => {
        id: string;
        schoolId: string;
        period: string;
        periodStart: Date;
        periodEnd: Date;
        metrics: {
            totalSubscriptions: number;
            activeSubscriptions: number;
            newSubscriptions: number;
            cancelledSubscriptions: number;
            suspendedSubscriptions: number;
            churnRate: number;
            revenueGenerated: number;
            averageRevenuePerUser: number;
            lifetimeValue: number;
            cohortAnalysis: {
                month1Retention: number;
                month3Retention: number;
                month6Retention: number;
                month12Retention: number;
            };
        };
        createdAt: Date;
        updatedAt: Date;
    };
    createMockRefund: (overrides?: Partial<any>) => {
        id: string;
        paymentTransactionId: string;
        orderId: string;
        userId: string;
        amount: number;
        currency: "INR";
        reason: string;
        status: string;
        type: string;
        gateway: "razorpay";
        gatewayRefundId: string;
        metadata: string;
        processedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockPaymentAnalytics: (overrides?: Partial<any>) => {
        schoolId: string;
        period: string;
        date: Date;
        metrics: {
            totalTransactions: number;
            successfulTransactions: number;
            failedTransactions: number;
            totalAmount: number;
            successfulAmount: number;
            failedAmount: number;
            successRate: number;
            averageTransactionAmount: number;
            paymentMethodDistribution: {
                card: number;
                upi: number;
                wallet: number;
                netbanking: number;
            };
            gatewayDistribution: {
                razorpay: number;
                payu: number;
            };
            hourlyDistribution: {
                '09': number;
                '10': number;
                '11': number;
                '12': number;
                '13': number;
                '14': number;
                '15': number;
                '16': number;
                '17': number;
            };
        };
    };
    createMockAPIGatewayEvent: (method: string, path: string, body?: any, pathParameters?: Record<string, string>, headers?: Record<string, string>) => {
        httpMethod: string;
        path: string;
        body: string;
        pathParameters: Record<string, string>;
        headers: {
            'Content-Type': string;
            'User-Agent': string;
            'X-Request-ID': string;
        };
        queryStringParameters: any;
        multiValueQueryStringParameters: any;
        requestContext: {
            requestId: string;
            identity: {
                sourceIp: string;
            };
            httpMethod: string;
            path: string;
            stage: string;
            requestTime: string;
            requestTimeEpoch: number;
        };
        isBase64Encoded: boolean;
        resource: string;
        stageVariables: any;
        multiValueHeaders: {};
    };
    createMockLambdaContext: () => {
        callbackWaitsForEmptyEventLoop: boolean;
        functionName: string;
        functionVersion: string;
        invokedFunctionArn: string;
        memoryLimitInMB: string;
        awsRequestId: string;
        logGroupName: string;
        logStreamName: string;
        identity: any;
        clientContext: any;
        getRemainingTimeInMillis: () => number;
    };
    createMockAuthResult: (overrides?: Partial<any>) => {
        isAuthenticated: boolean;
        user: {
            id: string;
            email: string;
            name: string;
            phone: string;
            role: string;
            schoolId: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        school: {
            id: string;
            name: string;
            address: string;
            phone: string;
            email: string;
            website: string;
            principalName: string;
            isActive: boolean;
            settings: {
                paymentGateways: string[];
                currencies: string[];
                taxRate: number;
                serviceCharges: number;
            };
            createdAt: Date;
            updatedAt: Date;
        };
        permissions: string[];
        session: {
            id: string;
            userId: string;
            token: string;
            refreshToken: string;
            expiresAt: Date;
            createdAt: Date;
        };
    };
    createMockUnauthResult: () => {
        isAuthenticated: boolean;
        user: any;
        school: any;
        permissions: any[];
        session: any;
        error: string;
    };
    createMockPaymentFormData: (overrides?: Partial<any>) => {
        amount: number;
        currency: string;
        description: string;
        customer: {
            name: string;
            email: string;
            contact: string;
        };
        paymentMethod: {
            type: string;
            cardNumber: string;
            expiryMonth: string;
            expiryYear: string;
            cvv: string;
            holderName: string;
        };
        billingAddress: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        };
        metadata: {
            orderId: string;
            userId: string;
            schoolId: string;
        };
    };
    createMockUPIFormData: (overrides?: Partial<any>) => {
        amount: number;
        currency: string;
        description: string;
        customer: {
            name: string;
            email: string;
            contact: string;
        };
        paymentMethod: {
            type: string;
            vpa: string;
        };
        metadata: {
            orderId: string;
            userId: string;
            schoolId: string;
        };
    };
    createMockWalletFormData: (overrides?: Partial<any>) => {
        amount: number;
        currency: string;
        description: string;
        customer: {
            name: string;
            email: string;
            contact: string;
        };
        paymentMethod: {
            type: string;
            provider: string;
        };
        metadata: {
            orderId: string;
            userId: string;
            schoolId: string;
        };
    };
    createMockGatewayHealthCheck: (overrides?: Partial<any>) => {
        gateway: "razorpay";
        status: string;
        responseTime: number;
        lastChecked: Date;
        uptime: number;
        errorRate: number;
        metrics: {
            avgResponseTime: number;
            maxResponseTime: number;
            minResponseTime: number;
            timeoutRate: number;
            successRate: number;
        };
        endpoints: {
            createOrder: {
                status: string;
                responseTime: number;
            };
            capturePayment: {
                status: string;
                responseTime: number;
            };
            createRefund: {
                status: string;
                responseTime: number;
            };
            webhooks: {
                status: string;
                responseTime: number;
            };
        };
    };
    createMockRFIDTransaction: (overrides?: Partial<any>) => {
        id: string;
        rfidTagId: string;
        userId: string;
        schoolId: string;
        type: string;
        amount: number;
        balance: number;
        description: string;
        orderId: string;
        merchantId: string;
        deviceId: string;
        location: string;
        metadata: string;
        processedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockRFIDTopUpTransaction: (overrides?: Partial<any>) => {
        id: string;
        type: string;
        amount: number;
        balance: number;
        description: string;
        orderId: any;
        merchantId: any;
        paymentTransactionId: string;
        metadata: string;
        rfidTagId: string;
        userId: string;
        schoolId: string;
        deviceId: string;
        location: string;
        processedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockPaymentSettlement: (overrides?: Partial<any>) => {
        id: string;
        schoolId: string;
        gateway: "razorpay";
        settlementId: string;
        amount: number;
        fees: number;
        tax: number;
        netAmount: number;
        transactionCount: number;
        period: {
            start: Date;
            end: Date;
        };
        status: string;
        bankAccount: {
            accountNumber: string;
            ifscCode: string;
            bankName: string;
        };
        metadata: string;
        processedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockPaymentDispute: (overrides?: Partial<any>) => {
        id: string;
        paymentTransactionId: string;
        userId: string;
        schoolId: string;
        gatewayDisputeId: string;
        amount: number;
        currency: "INR";
        reason: string;
        status: string;
        phase: string;
        evidence: string;
        dueBy: Date;
        respondBy: Date;
        gatewayNotifiedAt: Date;
        resolvedAt: any;
        resolution: any;
        metadata: string;
        createdAt: Date;
        updatedAt: Date;
    };
    generateMultiplePaymentMethods: (count: number, userId?: string) => any[];
    generateMultipleTransactions: (count: number, userId?: string) => any[];
    generateMultipleRetries: (count: number, transactionId?: string) => any[];
    generateMultipleSubscriptions: (count: number, userId?: string) => any[];
    generateMultipleBillingCycles: (count: number, subscriptionId?: string) => any[];
    generatePaymentAnalyticsData: (days?: number) => any[];
    generateMockWebhookSignature: (payload: string, secret?: string) => string;
    mockRazorpayResponses: {
        createOrder: {
            id: string;
            entity: string;
            amount: number;
            amount_paid: number;
            amount_due: number;
            currency: string;
            receipt: string;
            status: string;
            attempts: number;
            notes: {
                order_id: string;
                user_id: string;
            };
            created_at: number;
        };
        createCustomer: {
            id: string;
            entity: string;
            name: string;
            email: string;
            contact: string;
            gstin: any;
            notes: {
                user_id: string;
            };
            created_at: number;
        };
        capturePayment: {
            id: string;
            entity: string;
            amount: number;
            currency: string;
            status: string;
            order_id: string;
            invoice_id: any;
            international: boolean;
            method: string;
            amount_refunded: number;
            refund_status: any;
            captured: boolean;
            description: string;
            card_id: string;
            bank: string;
            wallet: any;
            vpa: any;
            email: string;
            contact: string;
            notes: {
                order_id: string;
            };
            fee: number;
            tax: number;
            error_code: any;
            error_description: any;
            created_at: number;
        };
        failedPayment: {
            id: string;
            entity: string;
            amount: number;
            currency: string;
            status: string;
            order_id: string;
            method: string;
            captured: boolean;
            description: string;
            error_code: string;
            error_description: string;
            created_at: number;
        };
        createRefund: {
            id: string;
            entity: string;
            amount: number;
            currency: string;
            payment_id: string;
            notes: {
                reason: string;
            };
            receipt: any;
            acquirer_data: {
                rrn: string;
            };
            created_at: number;
            batch_id: any;
            status: string;
            speed_processed: string;
        };
    };
    mockWebhookPayloads: {
        paymentCaptured: {
            entity: string;
            account_id: string;
            event: string;
            contains: string[];
            payload: {
                payment: {
                    entity: {
                        id: string;
                        entity: string;
                        amount: number;
                        currency: string;
                        status: string;
                        order_id: string;
                        invoice_id: any;
                        international: boolean;
                        method: string;
                        amount_refunded: number;
                        refund_status: any;
                        captured: boolean;
                        description: string;
                        card_id: string;
                        bank: string;
                        wallet: any;
                        vpa: any;
                        email: string;
                        contact: string;
                        notes: {
                            order_id: string;
                        };
                        fee: number;
                        tax: number;
                        error_code: any;
                        error_description: any;
                        acquirer_data: {
                            rrn: string;
                        };
                        created_at: number;
                    };
                };
            };
            created_at: number;
        };
        paymentFailed: {
            entity: string;
            account_id: string;
            event: string;
            contains: string[];
            payload: {
                payment: {
                    entity: {
                        id: string;
                        entity: string;
                        amount: number;
                        currency: string;
                        status: string;
                        order_id: string;
                        method: string;
                        captured: boolean;
                        description: string;
                        error_code: string;
                        error_description: string;
                        error_source: string;
                        error_step: string;
                        error_reason: string;
                        created_at: number;
                    };
                };
            };
            created_at: number;
        };
        refundProcessed: {
            entity: string;
            account_id: string;
            event: string;
            contains: string[];
            payload: {
                refund: {
                    entity: {
                        id: string;
                        entity: string;
                        amount: number;
                        currency: string;
                        payment_id: string;
                        notes: {
                            reason: string;
                        };
                        receipt: any;
                        acquirer_data: {
                            rrn: string;
                        };
                        created_at: number;
                        batch_id: any;
                        status: string;
                        speed_processed: string;
                    };
                };
            };
            created_at: number;
        };
        orderPaid: {
            entity: string;
            account_id: string;
            event: string;
            contains: string[];
            payload: {
                order: {
                    entity: {
                        id: string;
                        entity: string;
                        amount: number;
                        amount_paid: number;
                        amount_due: number;
                        currency: string;
                        receipt: string;
                        status: string;
                        attempts: number;
                        notes: {
                            order_id: string;
                            user_id: string;
                        };
                        created_at: number;
                    };
                };
            };
            created_at: number;
        };
    };
    mockErrors: {
        insufficientFunds: Error;
        invalidCard: Error;
        paymentTimeout: Error;
        gatewayError: Error;
        orderNotFound: Error;
        orderExpired: Error;
        orderAlreadyPaid: Error;
        userNotFound: Error;
        userNotActive: Error;
        insufficientBalance: Error;
        databaseError: Error;
        externalServiceError: Error;
        validationError: Error;
    };
    mockValidationResponses: {
        validCard: {
            isValid: boolean;
            cardType: string;
            issuer: string;
            country: string;
            warnings: any[];
        };
        invalidCard: {
            isValid: boolean;
            errors: string[];
            warnings: string[];
        };
        validUPI: {
            isValid: boolean;
            provider: string;
            verified: boolean;
            warnings: any[];
        };
        invalidUPI: {
            isValid: boolean;
            errors: string[];
            warnings: any[];
        };
    };
    mockPaymentFlowStates: {
        initiated: {
            orderId: string;
            status: string;
            step: string;
            progress: number;
            nextAction: string;
            timeRemaining: number;
            metadata: {
                sessionId: string;
                retryCount: number;
            };
        };
        processing: {
            orderId: string;
            status: string;
            step: string;
            progress: number;
            nextAction: string;
            timeRemaining: number;
            metadata: {
                sessionId: string;
                gatewayTransactionId: string;
            };
        };
        completed: {
            orderId: string;
            status: string;
            step: string;
            progress: number;
            nextAction: string;
            timeRemaining: number;
            metadata: {
                sessionId: string;
                paymentId: string;
                receiptUrl: string;
            };
        };
        failed: {
            orderId: string;
            status: string;
            step: string;
            progress: number;
            nextAction: string;
            timeRemaining: number;
            error: {
                code: string;
                message: string;
                retryable: boolean;
            };
            metadata: {
                sessionId: string;
                failureCount: number;
            };
        };
    };
    mockSubscriptionEvents: {
        subscriptionCreated: {
            id: string;
            event: string;
            timestamp: Date;
            data: {
                id: string;
                userId: string;
                schoolId: string;
                subscriptionPlanId: string;
                paymentMethodId: string;
                status: string;
                currentCycle: number;
                totalCycles: any;
                nextBillingDate: Date;
                trialStartDate: Date;
                trialEndDate: Date;
                activatedAt: Date;
                metadata: string;
                pausedAt: any;
                pauseReason: any;
                resumedAt: any;
                cancelledAt: any;
                cancellationReason: any;
                suspendedAt: any;
                suspensionReason: any;
                lastBillingDate: any;
                lastPaymentDate: any;
                lastFailedPaymentAt: any;
                failedPaymentCount: number;
                prorationAmount: any;
                discountAmount: number;
                taxAmount: number;
                totalAmount: number;
                createdAt: Date;
                updatedAt: Date;
                subscriptionPlan: {
                    id: string;
                    name: string;
                    description: string;
                    amount: number;
                    currency: "INR";
                    interval: string;
                    intervalCount: number;
                    trialPeriodDays: number;
                    maxCycles: any;
                    setupFee: number;
                    metadata: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                };
                user: {
                    id: string;
                    email: string;
                    name: string;
                    phone: string;
                    role: string;
                    schoolId: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                };
            };
        };
        subscriptionActivated: {
            id: string;
            event: string;
            timestamp: Date;
            data: {
                id: string;
                userId: string;
                schoolId: string;
                subscriptionPlanId: string;
                paymentMethodId: string;
                status: string;
                currentCycle: number;
                totalCycles: any;
                nextBillingDate: Date;
                trialStartDate: Date;
                trialEndDate: Date;
                activatedAt: Date;
                metadata: string;
                pausedAt: any;
                pauseReason: any;
                resumedAt: any;
                cancelledAt: any;
                cancellationReason: any;
                suspendedAt: any;
                suspensionReason: any;
                lastBillingDate: any;
                lastPaymentDate: any;
                lastFailedPaymentAt: any;
                failedPaymentCount: number;
                prorationAmount: any;
                discountAmount: number;
                taxAmount: number;
                totalAmount: number;
                createdAt: Date;
                updatedAt: Date;
                subscriptionPlan: {
                    id: string;
                    name: string;
                    description: string;
                    amount: number;
                    currency: "INR";
                    interval: string;
                    intervalCount: number;
                    trialPeriodDays: number;
                    maxCycles: any;
                    setupFee: number;
                    metadata: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                };
                user: {
                    id: string;
                    email: string;
                    name: string;
                    phone: string;
                    role: string;
                    schoolId: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                };
            };
        };
        subscriptionCancelled: {
            id: string;
            event: string;
            timestamp: Date;
            data: {
                id: string;
                userId: string;
                schoolId: string;
                subscriptionPlanId: string;
                paymentMethodId: string;
                status: string;
                currentCycle: number;
                totalCycles: any;
                nextBillingDate: Date;
                trialStartDate: Date;
                trialEndDate: Date;
                activatedAt: Date;
                metadata: string;
                pausedAt: any;
                pauseReason: any;
                resumedAt: any;
                cancelledAt: any;
                cancellationReason: any;
                suspendedAt: any;
                suspensionReason: any;
                lastBillingDate: any;
                lastPaymentDate: any;
                lastFailedPaymentAt: any;
                failedPaymentCount: number;
                prorationAmount: any;
                discountAmount: number;
                taxAmount: number;
                totalAmount: number;
                createdAt: Date;
                updatedAt: Date;
                subscriptionPlan: {
                    id: string;
                    name: string;
                    description: string;
                    amount: number;
                    currency: "INR";
                    interval: string;
                    intervalCount: number;
                    trialPeriodDays: number;
                    maxCycles: any;
                    setupFee: number;
                    metadata: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                };
                user: {
                    id: string;
                    email: string;
                    name: string;
                    phone: string;
                    role: string;
                    schoolId: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                };
            };
        };
        paymentFailed: {
            id: string;
            event: string;
            timestamp: Date;
            data: {
                subscription: {
                    id: string;
                    userId: string;
                    schoolId: string;
                    subscriptionPlanId: string;
                    paymentMethodId: string;
                    status: string;
                    currentCycle: number;
                    totalCycles: any;
                    nextBillingDate: Date;
                    trialStartDate: Date;
                    trialEndDate: Date;
                    activatedAt: Date;
                    metadata: string;
                    pausedAt: any;
                    pauseReason: any;
                    resumedAt: any;
                    cancelledAt: any;
                    cancellationReason: any;
                    suspendedAt: any;
                    suspensionReason: any;
                    lastBillingDate: any;
                    lastPaymentDate: any;
                    lastFailedPaymentAt: any;
                    failedPaymentCount: number;
                    prorationAmount: any;
                    discountAmount: number;
                    taxAmount: number;
                    totalAmount: number;
                    createdAt: Date;
                    updatedAt: Date;
                    subscriptionPlan: {
                        id: string;
                        name: string;
                        description: string;
                        amount: number;
                        currency: "INR";
                        interval: string;
                        intervalCount: number;
                        trialPeriodDays: number;
                        maxCycles: any;
                        setupFee: number;
                        metadata: string;
                        isActive: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                    user: {
                        id: string;
                        email: string;
                        name: string;
                        phone: string;
                        role: string;
                        schoolId: string;
                        isActive: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                };
                payment: {
                    id: string;
                    status: PaymentStatus;
                    razorpayPaymentId: string;
                    failureReason: string;
                    paidAt: any;
                    capturedAt: any;
                    orderId: string;
                    userId: string;
                    schoolId: string;
                    paymentMethodId: string;
                    amount: number;
                    currency: string;
                    type: PaymentMethodType;
                    method: PaymentMethodType;
                    gateway: string;
                    gatewayTransactionId: string;
                    gatewayOrderId: string;
                    description: string;
                    gatewayMetadata: string;
                    fees: string;
                    refundReason: any;
                    notes: string;
                    refundedAt: any;
                    createdAt: Date;
                    updatedAt: Date;
                };
            };
        };
    };
    mockPaymentAnalyticsAggregations: {
        daily: {
            period: string;
            data: any[];
        };
        weekly: {
            period: string;
            data: {
                week: number;
                weekStart: Date;
                weekEnd: Date;
                metrics: {
                    totalTransactions: number;
                    totalAmount: number;
                    successRate: number;
                };
            }[];
        };
        monthly: {
            period: string;
            data: {
                month: number;
                year: number;
                monthStart: Date;
                monthEnd: Date;
                metrics: {
                    totalTransactions: number;
                    totalAmount: number;
                    successRate: number;
                    averageOrderValue: number;
                    uniqueUsers: number;
                    repeatCustomers: number;
                };
            }[];
        };
    };
    mockGatewayErrors: {
        invalidRequest: {
            error: {
                code: string;
                description: string;
                source: string;
                step: string;
                reason: string;
                metadata: {
                    field: string;
                    value: string;
                };
            };
        };
        gatewayError: {
            error: {
                code: string;
                description: string;
                source: string;
                step: string;
                reason: string;
            };
        };
        serverError: {
            error: {
                code: string;
                description: string;
                source: string;
                step: string;
                reason: string;
            };
        };
    };
    mockPaymentPlanComparisons: {
        plans: {
            id: string;
            name: string;
            description: string;
            amount: number;
            currency: "INR";
            interval: string;
            intervalCount: number;
            trialPeriodDays: number;
            maxCycles: any;
            setupFee: number;
            metadata: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        comparison: {
            mostPopular: string;
            bestValue: string;
            recommended: string;
        };
    };
    mockDateUtils: {
        now: Date;
        tomorrow: Date;
        yesterday: Date;
        nextWeek: Date;
        nextMonth: Date;
        addDays: (days: number) => Date;
        addHours: (hours: number) => Date;
        addMinutes: (minutes: number) => Date;
    };
    setupTestEnvironment: () => void;
    cleanupTestEnvironment: () => void;
    setupMockTimers: () => void;
    cleanupMockTimers: () => void;
    resetAllMocks: () => void;
    setupPaymentMocks: () => void;
    setupDatabaseMocks: () => void;
};
export default _default;
//# sourceMappingURL=payment-mocks.d.ts.map