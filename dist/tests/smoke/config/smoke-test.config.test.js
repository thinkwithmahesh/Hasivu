"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMOKE_TEST_CONFIG = exports.validateEnvironment = exports.buildUrl = exports.getCurrentConfig = exports.EXPECTED_RESPONSES = exports.RETRY_CONFIG = exports.PERFORMANCE_THRESHOLDS = exports.TEST_DATA = exports.CRITICAL_ENDPOINTS = exports.ENVIRONMENT_CONFIGS = exports.SUITE_TIMEOUT = exports.TEST_TIMEOUT = exports.TEST_ENVIRONMENT = void 0;
exports.TEST_ENVIRONMENT = (process.env.TEST_ENVIRONMENT || 'staging');
exports.TEST_TIMEOUT = 30000;
exports.SUITE_TIMEOUT = 300000;
exports.ENVIRONMENT_CONFIGS = {
    development: {
        baseUrl: 'http://localhost:3000',
        apiUrl: 'http://localhost:3000/api/v1',
        websocketUrl: 'ws://localhost:3000'
    },
    staging: {
        baseUrl: 'https://staging.hasivu.com',
        apiUrl: 'https://staging-api.hasivu.com/api/v1',
        websocketUrl: 'wss://staging.hasivu.com'
    },
    production: {
        baseUrl: 'https://app.hasivu.com',
        apiUrl: 'https://api.hasivu.com/api/v1',
        websocketUrl: 'wss://app.hasivu.com'
    }
};
exports.CRITICAL_ENDPOINTS = {
    health: '/health',
    auth: {
        login: '/auth/login',
        register: '/auth/register',
        refresh: '/auth/refresh',
        profile: '/auth/profile'
    },
    orders: {
        create: '/orders',
        list: '/orders',
        status: '/orders/{id}/status'
    },
    payments: {
        create: '/payments/orders',
        verify: '/payments/verify',
        status: '/payments/status/{id}'
    },
    rfid: {
        verify: '/rfid/verify-card',
        delivery: '/rfid/delivery/{orderId}',
        test: '/rfid/test-connection'
    },
    monitoring: {
        status: '/monitoring/status',
        metrics: '/monitoring/metrics'
    }
};
exports.TEST_DATA = {
    user: {
        email: `smoke-test-${Date.now()}@hasivu.com`,
        password: 'SmokeTest123!',
        name: 'Smoke Test User',
        role: 'student'
    },
    order: {
        items: [
            {
                menuItemId: 'test-menu-item-1',
                quantity: 1,
                specialInstructions: 'Smoke test order'
            }
        ],
        deliveryTime: new Date(Date.now() + 3600000).toISOString(),
        paymentMethod: 'razorpay'
    },
    payment: {
        amount: 10000,
        currency: 'INR',
        method: 'card'
    },
    rfid: {
        cardId: 'TEST_CARD_001',
        studentId: 'test-student-001',
        orderId: 'test-order-001'
    }
};
exports.PERFORMANCE_THRESHOLDS = {
    healthCheck: 2000,
    authFlow: 5000,
    orderCreation: 10000,
    paymentFlow: 15000,
    rfidVerification: 3000,
    totalSuite: 240000
};
exports.RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2
};
exports.EXPECTED_RESPONSES = {
    success: [200, 201, 202],
    authRequired: [401, 403],
    notFound: [404],
    serverError: [500, 502, 503],
    validationError: [400, 422]
};
function getCurrentConfig() {
    return exports.ENVIRONMENT_CONFIGS[exports.TEST_ENVIRONMENT] || exports.ENVIRONMENT_CONFIGS.staging;
}
exports.getCurrentConfig = getCurrentConfig;
function buildUrl(endpoint) {
    const config = getCurrentConfig();
    return `${config.apiUrl}${endpoint}`;
}
exports.buildUrl = buildUrl;
function validateEnvironment() {
    const config = getCurrentConfig();
    if (!config.baseUrl || !config.apiUrl) {
        console.error(`❌ Invalid configuration for environment: ${exports.TEST_ENVIRONMENT}`);
        return false;
    }
    console.log(`✅ Environment validated: ${exports.TEST_ENVIRONMENT}`);
    console.log(`🌐 Base URL: ${config.baseUrl}`);
    console.log(`🔗 API URL: ${config.apiUrl}`);
    return true;
}
exports.validateEnvironment = validateEnvironment;
exports.SMOKE_TEST_CONFIG = {
    environment: exports.TEST_ENVIRONMENT,
    timeouts: {
        test: exports.TEST_TIMEOUT,
        suite: exports.SUITE_TIMEOUT
    },
    endpoints: exports.CRITICAL_ENDPOINTS,
    testData: exports.TEST_DATA,
    thresholds: exports.PERFORMANCE_THRESHOLDS,
    retry: exports.RETRY_CONFIG,
    responses: exports.EXPECTED_RESPONSES,
    urls: getCurrentConfig()
};
//# sourceMappingURL=smoke-test.config.test.js.map