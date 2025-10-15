export type TestEnvironment = 'development' | 'staging' | 'production';
export interface EnvironmentConfig {
    baseUrl: string;
    apiUrl: string;
    websocketUrl: string;
}
export interface TestTimeouts {
    test: number;
    suite: number;
}
export interface CriticalEndpoints {
    health: string;
    auth: {
        login: string;
        register: string;
        refresh: string;
        profile: string;
    };
    orders: {
        create: string;
        list: string;
        status: string;
    };
    payments: {
        create: string;
        verify: string;
        status: string;
    };
    rfid: {
        verify: string;
        delivery: string;
        test: string;
    };
    monitoring: {
        status: string;
        metrics: string;
    };
}
export interface TestUser {
    email: string;
    password: string;
    name: string;
    role: string;
}
export interface TestOrder {
    items: Array<{
        menuItemId: string;
        quantity: number;
        specialInstructions?: string;
    }>;
    deliveryTime: string;
    paymentMethod: string;
}
export interface TestPayment {
    amount: number;
    currency: string;
    method: string;
}
export interface TestRFID {
    cardId: string;
    studentId: string;
    orderId: string;
}
export interface TestData {
    user: TestUser;
    order: TestOrder;
    payment: TestPayment;
    rfid: TestRFID;
}
export interface PerformanceThresholds {
    healthCheck: number;
    authFlow: number;
    orderCreation: number;
    paymentFlow: number;
    rfidVerification: number;
    totalSuite: number;
}
export interface RetryConfig {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
}
export interface ExpectedResponses {
    success: number[];
    authRequired: number[];
    notFound: number[];
    serverError: number[];
    validationError: number[];
}
export interface SmokeTestConfig {
    environment: TestEnvironment;
    timeouts: TestTimeouts;
    endpoints: CriticalEndpoints;
    testData: TestData;
    thresholds: PerformanceThresholds;
    retry: RetryConfig;
    responses: ExpectedResponses;
    urls: EnvironmentConfig;
}
export interface TestResult {
    testName: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    responseCode?: number;
    responseTime?: number;
}
export interface SuiteResult {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    totalDuration: number;
    results: TestResult[];
    environment: TestEnvironment;
    timestamp: string;
}
//# sourceMappingURL=test-types.test.d.ts.map