"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const auth_routes_1 = require("../../../src/routes/auth.routes");
const auth_service_1 = require("../../../src/services/auth.service");
const database_service_1 = require("../../../src/services/database.service");
jest.mock('../../../src/services/auth.service');
jest.mock('../../../src/services/database.service');
jest.mock('../../../src/utils/logger');
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/auth', auth_routes_1.authRouter);
describe('Authentication Routes - Comprehensive Tests', () => {
    let mockAuthService;
    let mockDatabaseService;
    beforeEach(() => {
        mockAuthService = auth_service_1.authService;
        mockDatabaseService = {
            client: {
                user: {
                    findUnique: jest.fn(),
                    create: jest.fn(),
                    update: jest.fn()
                }
            },
            transaction: jest.fn()
        };
        database_service_1.DatabaseService.client = mockDatabaseService.client;
        database_service_1.DatabaseService.transaction = mockDatabaseService.transaction;
        jest.clearAllMocks();
    });
    describe('POST /auth/register', () => {
        const validRegistrationData = {
            email: 'test@example.com',
            password: 'SecurePassword123!',
            passwordConfirm: 'SecurePassword123!',
            firstName: 'John',
            lastName: 'Doe',
            role: 'parent'
        };
        test('should successfully register a new user', async () => {
            mockDatabaseService.client.user.findUnique.mockResolvedValue(null);
            mockAuthService.validatePassword.mockReturnValue({
                valid: true,
                isValid: true,
                message: 'Strong password',
                score: 85,
                requirements: {
                    length: true,
                    uppercase: true,
                    lowercase: true,
                    numbers: true,
                    symbols: true
                }
            });
            mockAuthService.hashPassword.mockResolvedValue('hashedPassword123');
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'parent',
                createdAt: new Date()
            };
            mockDatabaseService.transaction.mockImplementation(async (callback) => {
                return await callback({
                    user: {
                        create: jest.fn().mockResolvedValue(mockUser)
                    },
                    role: {
                        findUnique: jest.fn().mockResolvedValue({ id: 'role-1', name: 'parent' })
                    },
                    userRole: {
                        create: jest.fn().mockResolvedValue({})
                    }
                });
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send(validRegistrationData)
                .expect(201);
            expect(response.body).toMatchObject({
                success: true,
                message: 'User registered successfully',
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'parent'
                }
            });
            expect(mockAuthService.validatePassword).toHaveBeenCalledWith('SecurePassword123!');
            expect(mockAuthService.hashPassword).toHaveBeenCalledWith('SecurePassword123!');
        });
        test('should reject registration with missing required fields', async () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'password123'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send(invalidData)
                .expect(400);
            expect(response.body.message).toContain('All required fields must be provided');
        });
        test('should reject registration with mismatched passwords', async () => {
            const invalidData = {
                ...validRegistrationData,
                passwordConfirm: 'DifferentPassword123!'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send(invalidData)
                .expect(400);
            expect(response.body.message).toContain('Passwords do not match');
        });
        test('should reject registration with invalid email format', async () => {
            const invalidData = {
                ...validRegistrationData,
                email: 'invalid-email'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send(invalidData)
                .expect(400);
            expect(response.body.message).toContain('Invalid email format');
        });
        test('should reject registration with weak password', async () => {
            mockAuthService.validatePassword.mockReturnValue({
                valid: false,
                isValid: false,
                message: 'Password must be at least 8 characters',
                errors: ['Password must be at least 8 characters'],
                score: 25,
                requirements: {
                    length: false,
                    uppercase: true,
                    lowercase: true,
                    numbers: false,
                    symbols: false
                }
            });
            const invalidData = {
                ...validRegistrationData,
                password: '123',
                passwordConfirm: '123'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send(invalidData)
                .expect(400);
            expect(response.body.message).toContain('Password validation failed');
        });
        test('should reject registration with existing email', async () => {
            mockDatabaseService.client.user.findUnique.mockResolvedValue({
                id: 'existing-user',
                email: 'test@example.com'
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send(validRegistrationData)
                .expect(409);
            expect(response.body.message).toContain('User with this email already exists');
        });
    });
    describe('POST /auth/login', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'SecurePassword123!',
            rememberMe: false
        };
        test('should successfully login with valid credentials', async () => {
            const mockAuthResult = {
                success: true,
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                    role: 'parent',
                    permissions: ['read:profile', 'write:profile'],
                    schoolId: 'school-123'
                },
                tokens: {
                    accessToken: 'access-token-123',
                    refreshToken: 'refresh-token-123',
                    expiresIn: 3600
                },
                sessionId: 'session-123',
                schoolId: 'school-123'
            };
            mockAuthService.authenticate.mockResolvedValue(mockAuthResult);
            mockAuthService.updateSessionActivity.mockResolvedValue(undefined);
            const response = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send(validLoginData)
                .expect(200);
            expect(response.body).toMatchObject({
                success: true,
                message: 'Login successful',
                user: mockAuthResult.user,
                tokens: mockAuthResult.tokens
            });
            expect(mockAuthService.authenticate).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'SecurePassword123!',
                rememberMe: false,
                userAgent: expect.any(String),
                ipAddress: expect.any(String)
            });
        });
        test('should reject login with missing credentials', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send({ email: 'test@example.com' })
                .expect(400);
            expect(response.body.message).toContain('Email and password are required');
        });
        test('should handle authentication service errors', async () => {
            mockAuthService.authenticate.mockRejectedValue(new Error('Invalid credentials'));
            const response = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send(validLoginData)
                .expect(500);
            expect(response.body.message).toContain('Invalid credentials');
        });
    });
    describe('POST /auth/refresh', () => {
        test('should successfully refresh token', async () => {
            const mockRefreshResult = {
                accessToken: 'new-access-token-123'
            };
            mockAuthService.refreshToken.mockResolvedValue(mockRefreshResult);
            const response = await (0, supertest_1.default)(app)
                .post('/auth/refresh')
                .send({ refreshToken: 'valid-refresh-token' })
                .expect(200);
            expect(response.body).toMatchObject({
                success: true,
                message: 'Token refreshed successfully',
                accessToken: 'new-access-token-123'
            });
        });
        test('should reject refresh without token', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/auth/refresh')
                .send({})
                .expect(400);
            expect(response.body.message).toContain('Refresh token is required');
        });
    });
    describe('POST /auth/validate-password', () => {
        test('should validate strong password', async () => {
            mockAuthService.validatePassword.mockReturnValue({
                valid: true,
                isValid: true,
                message: 'Strong password',
                score: 5,
                requirements: {
                    length: true,
                    uppercase: true,
                    lowercase: true,
                    numbers: true,
                    symbols: true
                }
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/validate-password')
                .send({ password: 'StrongPassword123!' })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.validation.valid).toBe(true);
        });
        test('should validate weak password', async () => {
            mockAuthService.validatePassword.mockReturnValue({
                valid: false,
                isValid: false,
                message: 'Password too weak',
                score: 2,
                requirements: {
                    length: false,
                    uppercase: false,
                    lowercase: true,
                    numbers: true,
                    symbols: false
                }
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/validate-password')
                .send({ password: '123' })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.validation.valid).toBe(false);
        });
        test('should reject validation without password', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/auth/validate-password')
                .send({})
                .expect(400);
            expect(response.body.message).toContain('Password is required');
        });
    });
    describe('POST /auth/forgot-password', () => {
        test('should handle password reset request', async () => {
            mockDatabaseService.client.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com'
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/forgot-password')
                .send({ email: 'test@example.com' })
                .expect(200);
            expect(response.body).toMatchObject({
                success: true,
                message: 'If an account with this email exists, a password reset link has been sent'
            });
        });
        test('should handle password reset for non-existent user', async () => {
            mockDatabaseService.client.user.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .post('/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(200);
            expect(response.body.success).toBe(true);
        });
        test('should reject password reset without email', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/auth/forgot-password')
                .send({})
                .expect(400);
            expect(response.body.message).toContain('Email is required');
        });
    });
    describe('Security Headers and Cookies', () => {
        test('should set secure HTTP-only cookies on login', async () => {
            const mockAuthResult = {
                success: true,
                user: {
                    id: 'user-123',
                    email: 'test@example.com',
                    role: 'parent',
                    permissions: ['read:profile', 'write:profile'],
                    schoolId: 'school-123'
                },
                tokens: {
                    accessToken: 'access-token-123',
                    refreshToken: 'refresh-token-123',
                    expiresIn: 3600
                },
                sessionId: 'session-123',
                schoolId: 'school-123'
            };
            mockAuthService.authenticate.mockResolvedValue(mockAuthResult);
            mockAuthService.updateSessionActivity.mockResolvedValue(undefined);
            const response = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send({
                email: 'test@example.com',
                password: 'password123',
                rememberMe: true
            });
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
            expect(cookieArray.some((cookie) => cookie.includes('accessToken'))).toBe(true);
            expect(cookieArray.some((cookie) => cookie.includes('refreshToken'))).toBe(true);
            expect(cookieArray.some((cookie) => cookie.includes('HttpOnly'))).toBe(true);
        });
    });
    describe('Rate Limiting and Security', () => {
        test('should handle multiple registration attempts', async () => {
            mockDatabaseService.client.user.findUnique.mockResolvedValue(null);
            mockAuthService.validatePassword.mockReturnValue({
                valid: true,
                isValid: true,
                message: 'Strong',
                score: 90,
                requirements: {
                    length: true,
                    uppercase: true,
                    lowercase: true,
                    numbers: true,
                    symbols: true
                }
            });
            mockAuthService.hashPassword.mockResolvedValue('hashedPassword');
            const requests = Array(5).fill(null).map(() => (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({
                email: `test${Math.random()}@example.com`,
                password: 'SecurePassword123!',
                passwordConfirm: 'SecurePassword123!',
                firstName: 'Test',
                lastName: 'User'
            }));
            const responses = await Promise.all(requests);
            responses.forEach(response => {
                expect([201, 400, 409, 429]).toContain(response.status);
            });
        });
    });
    describe('Input Sanitization', () => {
        test('should handle SQL injection attempts in email', async () => {
            const maliciousData = {
                email: "'; DROP TABLE users; --",
                password: 'SecurePassword123!',
                passwordConfirm: 'SecurePassword123!',
                firstName: 'John',
                lastName: 'Doe'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send(maliciousData);
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Invalid email format');
        });
        test('should handle XSS attempts in user data', async () => {
            const xssData = {
                email: 'test@example.com',
                password: 'SecurePassword123!',
                passwordConfirm: 'SecurePassword123!',
                firstName: '<script>alert("xss")</script>',
                lastName: '<img src=x onerror=alert("xss")>'
            };
            mockDatabaseService.client.user.findUnique.mockResolvedValue(null);
            mockAuthService.validatePassword.mockReturnValue({
                valid: true,
                isValid: true,
                message: 'Strong',
                score: 90,
                requirements: {
                    length: true,
                    uppercase: true,
                    lowercase: true,
                    numbers: true,
                    symbols: true
                }
            });
            mockAuthService.hashPassword.mockResolvedValue('hashedPassword');
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                firstName: '<script>alert("xss")</script>',
                lastName: '<img src=x onerror=alert("xss")>',
                role: 'parent',
                createdAt: new Date()
            };
            mockDatabaseService.transaction.mockImplementation(async (callback) => {
                return await callback({
                    user: { create: jest.fn().mockResolvedValue(mockUser) },
                    role: { findUnique: jest.fn().mockResolvedValue({ id: 'role-1', name: 'parent' }) },
                    userRole: { create: jest.fn().mockResolvedValue({}) }
                });
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send(xssData);
            expect(response.status).toBe(201);
        });
    });
});
//# sourceMappingURL=auth.routes.test.js.map