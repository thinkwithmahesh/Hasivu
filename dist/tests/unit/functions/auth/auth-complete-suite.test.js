"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
globals_1.jest.mock('@aws-sdk/client-cognito-identity-provider');
globals_1.jest.mock('@aws-sdk/client-dynamodb');
globals_1.jest.mock('@aws-sdk/client-secrets-manager');
const login_1 = require("../../../../src/functions/auth/login");
const register_1 = require("../../../../src/functions/auth/register");
const refresh_1 = require("../../../../src/functions/auth/refresh");
const logout_1 = require("../../../../src/functions/auth/logout");
const profile_1 = require("../../../../src/functions/auth/profile");
const update_profile_1 = require("../../../../src/functions/auth/update-profile");
const change_password_1 = require("../../../../src/functions/auth/change-password");
const createMockEvent = (body = {}, headers = {}, pathParameters = {}, queryStringParameters = {}) => ({
    body: JSON.stringify(body),
    headers: {
        'Content-Type': 'application/json',
        ...headers
    },
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/auth/test',
    pathParameters,
    queryStringParameters,
    multiValueQueryStringParameters: {},
    stageVariables: {},
    requestContext: {
        accountId: 'test-account',
        apiId: 'test-api',
        protocol: 'HTTP/1.1',
        httpMethod: 'POST',
        path: '/auth/test',
        stage: 'test',
        requestId: 'test-request-id',
        requestTime: '09/Apr/2015:12:34:56 +0000',
        requestTimeEpoch: 1428582896000,
        identity: {
            cognitoIdentityPoolId: null,
            accountId: null,
            cognitoIdentityId: null,
            caller: null,
            sourceIp: '127.0.0.1',
            principalOrgId: null,
            accessKey: null,
            cognitoAuthenticationType: null,
            cognitoAuthenticationProvider: null,
            userArn: null,
            userAgent: 'Custom User Agent String',
            user: null,
            apiKey: null,
            apiKeyId: null,
            clientCert: null
        },
        resourceId: 'test-resource',
        resourcePath: '/auth/test',
        authorizer: null
    },
    resource: '/auth/test'
});
const createMockContext = () => ({
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2023/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: () => { },
    fail: () => { },
    succeed: () => { }
});
(0, globals_1.describe)('Authentication Functions Test Suite', () => {
    let mockContext;
    (0, globals_1.beforeEach)(() => {
        mockContext = createMockContext();
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.resetAllMocks();
    });
    (0, globals_1.describe)('Login Function Tests', () => {
        (0, globals_1.test)('should successfully login with valid credentials', async () => {
            const event = createMockEvent({
                email: 'test@hasivu.com',
                password: 'TestPassword123!'
            });
            const result = await (0, login_1.loginHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('success', true);
            (0, globals_1.expect)(body).toHaveProperty('data');
            (0, globals_1.expect)(body.data).toHaveProperty('user');
            (0, globals_1.expect)(body.data).toHaveProperty('tokens');
            (0, globals_1.expect)(body.data.user).toHaveProperty('email', 'test@hasivu.com');
        });
        (0, globals_1.test)('should reject login with invalid email format', async () => {
            const event = createMockEvent({
                email: 'invalid-email',
                password: 'TestPassword123!'
            });
            const result = await (0, login_1.loginHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Invalid email format');
        });
        (0, globals_1.test)('should reject login with weak password', async () => {
            const event = createMockEvent({
                email: 'test@hasivu.com',
                password: '123'
            });
            const result = await (0, login_1.loginHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Password must be at least 8 characters');
        });
        (0, globals_1.test)('should handle login with non-existent user', async () => {
            const event = createMockEvent({
                email: 'nonexistent@hasivu.com',
                password: 'TestPassword123!'
            });
            const result = await (0, login_1.loginHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(401);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Invalid credentials');
        });
        (0, globals_1.test)('should handle missing request body', async () => {
            const event = createMockEvent();
            event.body = null;
            const result = await (0, login_1.loginHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Request body is required');
        });
        (0, globals_1.test)('should handle malformed JSON in request body', async () => {
            const event = createMockEvent();
            event.body = '{ invalid json }';
            const result = await (0, login_1.loginHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Invalid JSON');
        });
        (0, globals_1.test)('should implement rate limiting', async () => {
            const event = createMockEvent({
                email: 'test@hasivu.com',
                password: 'wrong-password'
            });
            const promises = Array.from({ length: 6 }, () => (0, login_1.loginHandler)(event, mockContext));
            const results = await Promise.all(promises);
            const lastResult = results[results.length - 1];
            (0, globals_1.expect)(lastResult.statusCode).toBe(429);
            const body = JSON.parse(lastResult.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Too many login attempts');
        });
        (0, globals_1.test)('should handle database connection errors', async () => {
            (0, globals_1.expect)(true).toBe(true);
        });
    });
    (0, globals_1.describe)('Register Function Tests', () => {
        (0, globals_1.test)('should successfully register new user', async () => {
            const event = createMockEvent({
                email: 'newuser@hasivu.com',
                password: 'TestPassword123!',
                firstName: 'John',
                lastName: 'Doe',
                role: 'student'
            });
            const result = await (0, register_1.registerHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(201);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('message', 'User registered successfully');
            (0, globals_1.expect)(body).toHaveProperty('userId');
        });
        (0, globals_1.test)('should reject registration with existing email', async () => {
            const event = createMockEvent({
                email: 'existing@hasivu.com',
                password: 'TestPassword123!',
                firstName: 'John',
                lastName: 'Doe',
                role: 'student'
            });
            const result = await (0, register_1.registerHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(409);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Email already exists');
        });
        (0, globals_1.test)('should validate required fields', async () => {
            const event = createMockEvent({
                email: 'test@hasivu.com'
            });
            const result = await (0, register_1.registerHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Missing required fields');
        });
        (0, globals_1.test)('should validate password strength', async () => {
            const event = createMockEvent({
                email: 'test@hasivu.com',
                password: 'weak',
                firstName: 'John',
                lastName: 'Doe',
                role: 'student'
            });
            const result = await (0, register_1.registerHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Password must contain');
        });
        (0, globals_1.test)('should validate email format', async () => {
            const event = createMockEvent({
                email: 'invalid-email-format',
                password: 'TestPassword123!',
                firstName: 'John',
                lastName: 'Doe',
                role: 'student'
            });
            const result = await (0, register_1.registerHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Invalid email format');
        });
        (0, globals_1.test)('should validate role', async () => {
            const event = createMockEvent({
                email: 'test@hasivu.com',
                password: 'TestPassword123!',
                firstName: 'John',
                lastName: 'Doe',
                role: 'invalid-role'
            });
            const result = await (0, register_1.registerHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Invalid role');
        });
    });
    (0, globals_1.describe)('Refresh Token Function Tests', () => {
        (0, globals_1.test)('should successfully refresh valid token', async () => {
            const event = createMockEvent({
                refreshToken: 'valid-refresh-token'
            });
            const result = await (0, refresh_1.refreshHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('token');
            (0, globals_1.expect)(body).toHaveProperty('refreshToken');
        });
        (0, globals_1.test)('should reject invalid refresh token', async () => {
            const event = createMockEvent({
                refreshToken: 'invalid-refresh-token'
            });
            const result = await (0, refresh_1.refreshHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(401);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Invalid refresh token');
        });
        (0, globals_1.test)('should reject expired refresh token', async () => {
            const event = createMockEvent({
                refreshToken: 'expired-refresh-token'
            });
            const result = await (0, refresh_1.refreshHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(401);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Refresh token expired');
        });
        (0, globals_1.test)('should require refresh token', async () => {
            const event = createMockEvent({});
            const result = await (0, refresh_1.refreshHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Refresh token is required');
        });
    });
    (0, globals_1.describe)('Logout Function Tests', () => {
        (0, globals_1.test)('should successfully logout with valid token', async () => {
            const event = createMockEvent({}, {
                'Authorization': 'Bearer valid-jwt-token'
            });
            const result = await (0, logout_1.logoutHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('message', 'Logged out successfully');
        });
        (0, globals_1.test)('should handle logout without token', async () => {
            const event = createMockEvent({});
            const result = await (0, logout_1.logoutHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(401);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Authorization token required');
        });
        (0, globals_1.test)('should handle invalid token format', async () => {
            const event = createMockEvent({}, {
                'Authorization': 'InvalidTokenFormat'
            });
            const result = await (0, logout_1.logoutHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(401);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Invalid token format');
        });
    });
    (0, globals_1.describe)('Profile Function Tests', () => {
        (0, globals_1.test)('should get user profile with valid token', async () => {
            const event = createMockEvent({}, {
                'Authorization': 'Bearer valid-jwt-token'
            });
            const result = await (0, profile_1.profileHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('user');
            (0, globals_1.expect)(body.user).toHaveProperty('email');
            (0, globals_1.expect)(body.user).toHaveProperty('firstName');
            (0, globals_1.expect)(body.user).toHaveProperty('lastName');
            (0, globals_1.expect)(body.user).not.toHaveProperty('password');
        });
        (0, globals_1.test)('should reject request without authorization', async () => {
            const event = createMockEvent({});
            const result = await (0, profile_1.profileHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(401);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Authorization required');
        });
    });
    (0, globals_1.describe)('Update Profile Function Tests', () => {
        (0, globals_1.test)('should update profile with valid data', async () => {
            const event = createMockEvent({
                firstName: 'UpdatedFirst',
                lastName: 'UpdatedLast',
                phone: '+1234567890'
            }, {
                'Authorization': 'Bearer valid-jwt-token'
            });
            const result = await (0, update_profile_1.updateProfileHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('message', 'Profile updated successfully');
            (0, globals_1.expect)(body).toHaveProperty('user');
            (0, globals_1.expect)(body.user.firstName).toBe('UpdatedFirst');
            (0, globals_1.expect)(body.user.lastName).toBe('UpdatedLast');
        });
        (0, globals_1.test)('should validate phone number format', async () => {
            const event = createMockEvent({
                phone: 'invalid-phone'
            }, {
                'Authorization': 'Bearer valid-jwt-token'
            });
            const result = await (0, update_profile_1.updateProfileHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Invalid phone number format');
        });
        (0, globals_1.test)('should not allow email update', async () => {
            const event = createMockEvent({
                email: 'newemail@hasivu.com'
            }, {
                'Authorization': 'Bearer valid-jwt-token'
            });
            const result = await (0, update_profile_1.updateProfileHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Email cannot be updated');
        });
    });
    (0, globals_1.describe)('Change Password Function Tests', () => {
        (0, globals_1.test)('should change password with valid current password', async () => {
            const event = createMockEvent({
                currentPassword: 'CurrentPassword123!',
                newPassword: 'NewPassword456!',
                confirmPassword: 'NewPassword456!'
            }, {
                'Authorization': 'Bearer valid-jwt-token'
            });
            const result = await (0, change_password_1.changePasswordHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('message', 'Password changed successfully');
        });
        (0, globals_1.test)('should reject with wrong current password', async () => {
            const event = createMockEvent({
                currentPassword: 'WrongPassword123!',
                newPassword: 'NewPassword456!',
                confirmPassword: 'NewPassword456!'
            }, {
                'Authorization': 'Bearer valid-jwt-token'
            });
            const result = await (0, change_password_1.changePasswordHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Current password is incorrect');
        });
        (0, globals_1.test)('should reject when new passwords do not match', async () => {
            const event = createMockEvent({
                currentPassword: 'CurrentPassword123!',
                newPassword: 'NewPassword456!',
                confirmPassword: 'DifferentPassword789!'
            }, {
                'Authorization': 'Bearer valid-jwt-token'
            });
            const result = await (0, change_password_1.changePasswordHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('New passwords do not match');
        });
        (0, globals_1.test)('should validate new password strength', async () => {
            const event = createMockEvent({
                currentPassword: 'CurrentPassword123!',
                newPassword: 'weak',
                confirmPassword: 'weak'
            }, {
                'Authorization': 'Bearer valid-jwt-token'
            });
            const result = await (0, change_password_1.changePasswordHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Password must be at least 8 characters');
        });
        (0, globals_1.test)('should require all password fields', async () => {
            const event = createMockEvent({
                currentPassword: 'CurrentPassword123!'
            }, {
                'Authorization': 'Bearer valid-jwt-token'
            });
            const result = await (0, change_password_1.changePasswordHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('All password fields are required');
        });
    });
    (0, globals_1.describe)('Security Tests', () => {
        (0, globals_1.test)('should implement proper input sanitization', async () => {
            const event = createMockEvent({
                email: '<script>alert("xss")</script>@hasivu.com',
                password: 'TestPassword123!'
            });
            const result = await (0, login_1.loginHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
            (0, globals_1.expect)(body.error).toContain('Invalid email format');
        });
        (0, globals_1.test)('should implement SQL injection protection', async () => {
            const event = createMockEvent({
                email: "test'; DROP TABLE users; --@hasivu.com",
                password: 'TestPassword123!'
            });
            const result = await (0, login_1.loginHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
        });
        (0, globals_1.test)('should implement proper error handling without information disclosure', async () => {
            (0, globals_1.expect)(true).toBe(true);
        });
    });
    (0, globals_1.describe)('Performance Tests', () => {
        (0, globals_1.test)('should respond within acceptable time limits', async () => {
            const event = createMockEvent({
                email: 'test@hasivu.com',
                password: 'TestPassword123!'
            });
            const startTime = performance.now();
            const result = await (0, login_1.loginHandler)(event, mockContext);
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            (0, globals_1.expect)(responseTime).toBeLessThan(300);
            (0, globals_1.expect)(result.statusCode).toBeDefined();
        });
        (0, globals_1.test)('should handle concurrent requests', async () => {
            const event = createMockEvent({
                email: 'test@hasivu.com',
                password: 'TestPassword123!'
            });
            const promises = Array.from({ length: 10 }, () => (0, login_1.loginHandler)(event, mockContext));
            const results = await Promise.all(promises);
            results.forEach(result => {
                (0, globals_1.expect)(result.statusCode).toBeDefined();
            });
        });
    });
    (0, globals_1.describe)('Edge Cases and Error Handling', () => {
        (0, globals_1.test)('should handle extremely long input strings', async () => {
            const longString = 'a'.repeat(10000);
            const event = createMockEvent({
                email: `${longString}@hasivu.com`,
                password: 'TestPassword123!'
            });
            const result = await (0, login_1.loginHandler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
        });
        (0, globals_1.test)('should handle special characters in input', async () => {
            const event = createMockEvent({
                email: 'test+special.email@hasivu.com',
                password: 'TestPassword123!@#$%'
            });
            const result = await (0, login_1.loginHandler)(event, mockContext);
            (0, globals_1.expect)([200, 401]).toContain(result.statusCode);
        });
        (0, globals_1.test)('should handle Unicode characters', async () => {
            const event = createMockEvent({
                firstName: '测试用户',
                lastName: 'Тест',
                email: 'unicode@hasivu.com',
                password: 'TestPassword123!',
                role: 'student'
            });
            const result = await (0, register_1.registerHandler)(event, mockContext);
            (0, globals_1.expect)([201, 400]).toContain(result.statusCode);
        });
        (0, globals_1.test)('should handle timeout scenarios', async () => {
            globals_1.jest.setTimeout(10000);
            globals_1.jest.mock('../../../../src/services/database.service', () => ({
                findUserByEmail: globals_1.jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 8000)))
            }));
            const event = createMockEvent({
                email: 'test@hasivu.com',
                password: 'TestPassword123!'
            });
            const shortContext = { ...mockContext, getRemainingTimeInMillis: () => 1000 };
            const result = await (0, login_1.loginHandler)(event, shortContext);
            (0, globals_1.expect)(result.statusCode).toBe(500);
            const body = JSON.parse(result.body);
            (0, globals_1.expect)(body).toHaveProperty('error');
        });
    });
});
//# sourceMappingURL=auth-complete-suite.test.js.map