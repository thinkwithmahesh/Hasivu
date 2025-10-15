"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testUsers = exports.testMenuItems = exports.createMockLambdaContext = exports.createMockAPIGatewayEvent = exports.createTestSchool = exports.createTestDeliveryVerification = exports.createTestRFIDCard = exports.createTestPayment = exports.createTestOrder = exports.createTestDailyMenu = exports.createTestMenuItem = exports.createTestUser = exports.getPastDate = exports.getFutureDate = void 0;
const uuid_1 = require("uuid");
function getFutureDate(daysAhead = 1) {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date;
}
exports.getFutureDate = getFutureDate;
function getPastDate(daysAgo = 1) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
}
exports.getPastDate = getPastDate;
function createTestUser(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        email: `test${Date.now()}@example.com`,
        name: 'Test User',
        role: 'STUDENT',
        phoneNumber: '+1234567890',
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
exports.createTestUser = createTestUser;
function createTestMenuItem(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        name: `Test Item ${Date.now()}`,
        description: 'Test menu item description',
        category: 'MAIN_COURSE',
        price: 100,
        cost: 60,
        available: true,
        preparationTime: 15,
        calories: 500,
        allergens: [],
        tags: ['vegetarian'],
        imageUrl: 'https://example.com/image.jpg',
        schoolId: (0, uuid_1.v4)(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
exports.createTestMenuItem = createTestMenuItem;
function createTestDailyMenu(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        schoolId: (0, uuid_1.v4)(),
        date: getFutureDate(),
        menuItems: [createTestMenuItem(), createTestMenuItem()],
        specialNotes: 'Test special notes',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
exports.createTestDailyMenu = createTestDailyMenu;
function createTestOrder(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        userId: (0, uuid_1.v4)(),
        schoolId: (0, uuid_1.v4)(),
        menuItemId: (0, uuid_1.v4)(),
        quantity: 1,
        totalAmount: 100,
        status: 'PENDING',
        deliveryDate: getFutureDate(),
        orderType: 'ADVANCE',
        paymentStatus: 'PENDING',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
exports.createTestOrder = createTestOrder;
function createTestPayment(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        orderId: (0, uuid_1.v4)(),
        userId: (0, uuid_1.v4)(),
        amount: 100,
        currency: 'INR',
        status: 'PENDING',
        gateway: 'RAZORPAY',
        gatewayOrderId: `order_${Date.now()}`,
        gatewayPaymentId: null,
        gatewaySignature: null,
        method: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
exports.createTestPayment = createTestPayment;
function createTestRFIDCard(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        cardNumber: `CARD${Date.now()}`,
        userId: (0, uuid_1.v4)(),
        status: 'ACTIVE',
        type: 'STUDENT',
        issuedAt: new Date(),
        expiresAt: getFutureDate(365),
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
exports.createTestRFIDCard = createTestRFIDCard;
function createTestDeliveryVerification(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        orderId: (0, uuid_1.v4)(),
        rfidCardNumber: `CARD${Date.now()}`,
        rfidReaderId: (0, uuid_1.v4)(),
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        location: 'Test Location',
        notes: '',
        createdAt: new Date(),
        ...overrides,
    };
}
exports.createTestDeliveryVerification = createTestDeliveryVerification;
function createTestSchool(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        name: `Test School ${Date.now()}`,
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345',
        phoneNumber: '+1234567890',
        email: `school${Date.now()}@example.com`,
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'PREMIUM',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
exports.createTestSchool = createTestSchool;
function createMockAPIGatewayEvent(overrides = {}) {
    return {
        body: null,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'test-agent',
        },
        httpMethod: 'GET',
        isBase64Encoded: false,
        path: '/test',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {
            accountId: 'test-account',
            apiId: 'test-api',
            authorizer: null,
            protocol: 'HTTP/1.1',
            httpMethod: 'GET',
            identity: {
                sourceIp: '127.0.0.1',
                userAgent: 'test-agent',
            },
            path: '/test',
            stage: 'test',
            requestId: (0, uuid_1.v4)(),
            requestTime: new Date().toISOString(),
            requestTimeEpoch: Date.now(),
            resourceId: 'test-resource',
            resourcePath: '/test',
        },
        resource: '/test',
        multiValueHeaders: {},
        ...overrides,
    };
}
exports.createMockAPIGatewayEvent = createMockAPIGatewayEvent;
function createMockLambdaContext(overrides = {}) {
    return {
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'test-function',
        functionVersion: '1',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:test',
        memoryLimitInMB: '128',
        awsRequestId: (0, uuid_1.v4)(),
        logGroupName: '/aws/lambda/test',
        logStreamName: '2024/01/01/[$LATEST]test',
        getRemainingTimeInMillis: () => 30000,
        done: () => { },
        fail: () => { },
        succeed: () => { },
        ...overrides,
    };
}
exports.createMockLambdaContext = createMockLambdaContext;
exports.testMenuItems = [
    createTestMenuItem({ name: 'Vegetarian Burger', category: 'MAIN_COURSE' }),
    createTestMenuItem({ name: 'Caesar Salad', category: 'SALAD' }),
    createTestMenuItem({ name: 'Chocolate Cake', category: 'DESSERT' }),
    createTestMenuItem({ name: 'Orange Juice', category: 'BEVERAGE' }),
];
exports.testUsers = [
    createTestUser({ email: 'student1@test.com', role: 'STUDENT' }),
    createTestUser({ email: 'student2@test.com', role: 'STUDENT' }),
    createTestUser({ email: 'parent1@test.com', role: 'PARENT' }),
    createTestUser({ email: 'admin1@test.com', role: 'SCHOOL_ADMIN' }),
];
//# sourceMappingURL=test-data.js.map