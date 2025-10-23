import { TestEnvironment, SmokeTestConfig } from '../utils/test-types';
export declare const TEST_ENVIRONMENT: TestEnvironment;
export declare const TEST_TIMEOUT = 30000;
export declare const SUITE_TIMEOUT = 300000;
export declare const ENVIRONMENT_CONFIGS: {
    development: {
        baseUrl: string;
        apiUrl: string;
        websocketUrl: string;
    };
    staging: {
        baseUrl: string;
        apiUrl: string;
        websocketUrl: string;
    };
    production: {
        baseUrl: string;
        apiUrl: string;
        websocketUrl: string;
    };
};
export declare const CRITICAL_ENDPOINTS: {
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
};
export declare const TEST_DATA: {
    user: {
        email: string;
        password: string;
        name: string;
        role: string;
    };
    order: {
        items: {
            menuItemId: string;
            quantity: number;
            specialInstructions: string;
        }[];
        deliveryTime: string;
        paymentMethod: string;
    };
    payment: {
        amount: number;
        currency: string;
        method: string;
    };
    rfid: {
        cardId: string;
        studentId: string;
        orderId: string;
    };
};
export declare const PERFORMANCE_THRESHOLDS: {
    healthCheck: number;
    authFlow: number;
    orderCreation: number;
    paymentFlow: number;
    rfidVerification: number;
    totalSuite: number;
};
export declare const RETRY_CONFIG: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
};
export declare const EXPECTED_RESPONSES: {
    success: number[];
    authRequired: number[];
    notFound: number[];
    serverError: number[];
    validationError: number[];
};
export declare function getCurrentConfig(): {
    baseUrl: string;
    apiUrl: string;
    websocketUrl: string;
} | {
    baseUrl: string;
    apiUrl: string;
    websocketUrl: string;
} | {
    baseUrl: string;
    apiUrl: string;
    websocketUrl: string;
};
export declare function buildUrl(endpoint: string): string;
export declare function validateEnvironment(): boolean;
export declare const SMOKE_TEST_CONFIG: SmokeTestConfig;
//# sourceMappingURL=smoke-test.config.test.d.ts.map