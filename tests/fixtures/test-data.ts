/**
 * Test Data Fixtures
 * Centralized test data generators for consistent testing
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a future date (tomorrow by default)
 */
export function getFutureDate(daysAhead = 1): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

/**
 * Generates a past date
 */
export function getPastDate(daysAgo = 1): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Generates test user data
 */
export function createTestUser(overrides = {}) {
  return {
    id: uuidv4(),
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

/**
 * Generates test menu item data
 */
export function createTestMenuItem(overrides = {}) {
  return {
    id: uuidv4(),
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
    schoolId: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Generates test daily menu data
 */
export function createTestDailyMenu(overrides = {}) {
  return {
    id: uuidv4(),
    schoolId: uuidv4(),
    date: getFutureDate(),
    menuItems: [createTestMenuItem(), createTestMenuItem()],
    specialNotes: 'Test special notes',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Generates test order data
 */
export function createTestOrder(overrides = {}) {
  return {
    id: uuidv4(),
    userId: uuidv4(),
    schoolId: uuidv4(),
    menuItemId: uuidv4(),
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

/**
 * Generates test payment data
 */
export function createTestPayment(overrides = {}) {
  return {
    id: uuidv4(),
    orderId: uuidv4(),
    userId: uuidv4(),
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

/**
 * Generates test RFID card data
 */
export function createTestRFIDCard(overrides = {}) {
  return {
    id: uuidv4(),
    cardNumber: `CARD${Date.now()}`,
    userId: uuidv4(),
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

/**
 * Generates test delivery verification data
 */
export function createTestDeliveryVerification(overrides = {}) {
  return {
    id: uuidv4(),
    orderId: uuidv4(),
    rfidCardNumber: `CARD${Date.now()}`,
    rfidReaderId: uuidv4(),
    verificationStatus: 'VERIFIED',
    verifiedAt: new Date(),
    location: 'Test Location',
    notes: '',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Generates test school data
 */
export function createTestSchool(overrides = {}) {
  return {
    id: uuidv4(),
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

/**
 * Creates a mock API Gateway event
 */
export function createMockAPIGatewayEvent(overrides = {}) {
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
      requestId: uuidv4(),
      requestTime: new Date().toISOString(),
      requestTimeEpoch: Date.now(),
      resourceId: 'test-resource',
      resourcePath: '/test',
    } as any,
    resource: '/test',
    multiValueHeaders: {},
    ...overrides,
  };
}

/**
 * Creates a mock Lambda context
 */
export function createMockLambdaContext(overrides = {}) {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:test',
    memoryLimitInMB: '128',
    awsRequestId: uuidv4(),
    logGroupName: '/aws/lambda/test',
    logStreamName: '2024/01/01/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
    ...overrides,
  };
}

/**
 * Array of test menu items for bulk operations
 */
export const testMenuItems = [
  createTestMenuItem({ name: 'Vegetarian Burger', category: 'MAIN_COURSE' }),
  createTestMenuItem({ name: 'Caesar Salad', category: 'SALAD' }),
  createTestMenuItem({ name: 'Chocolate Cake', category: 'DESSERT' }),
  createTestMenuItem({ name: 'Orange Juice', category: 'BEVERAGE' }),
];

/**
 * Array of test users for bulk operations
 */
export const testUsers = [
  createTestUser({ email: 'student1@test.com', role: 'STUDENT' }),
  createTestUser({ email: 'student2@test.com', role: 'STUDENT' }),
  createTestUser({ email: 'parent1@test.com', role: 'PARENT' }),
  createTestUser({ email: 'admin1@test.com', role: 'SCHOOL_ADMIN' }),
];
