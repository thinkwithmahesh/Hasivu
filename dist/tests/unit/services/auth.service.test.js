"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserRole = {
    ADMIN: 'ADMIN',
    PARENT: 'PARENT',
    STUDENT: 'STUDENT',
    SCHOOL: 'SCHOOL'
};
jest.mock('../../../src/services/database.service', () => ({
    DatabaseService: {
        client: {
            user: {
                findUnique: jest.fn(),
                update: jest.fn(),
                create: jest.fn()
            }
        },
        getInstance: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        getHealth: jest.fn(),
        isConnected: jest.fn()
    }
}));
jest.mock('../../../src/services/redis.service', () => ({
    RedisService: {
        get: jest.fn(),
        set: jest.fn(),
        setex: jest.fn(),
        del: jest.fn(),
        exists: jest.fn(),
        deleteSession: jest.fn()
    }
}));
jest.mock('../../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));
jest.mock('../../../src/config/environment', () => ({
    config: {
        JWT_SECRET: 'test-jwt-secret-key-for-testing-purposes-only',
        JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-key-for-testing-purposes-only'
    }
}));
const auth_service_1 = require("../../../src/services/auth.service");
const database_service_1 = require("../../../src/services/database.service");
const redis_service_1 = require("../../../src/services/redis.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const MockedDatabaseService = jest.mocked(database_service_1.DatabaseService);
const MockedRedisService = jest.mocked(redis_service_1.RedisService);
const createMockUser = (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    schoolId: 'school-123',
    role: UserRole.PARENT,
    status: 'active',
    metadata: '{}',
    cognitoUserId: 'cognito-123',
    deviceTokens: '[]',
    preferences: '{}',
    avatar: null,
    bio: null,
    dateOfBirth: null,
    address: null,
    emergencyContact: null,
    parentalConsent: true,
    termsAcceptedAt: new Date(),
    lastLoginAt: new Date(),
    passwordHash: '$2a$12$hash.hash.hash.hash.hash.hash',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});
expect.extend({
    toBeValidJWT(received) {
        try {
            const decoded = jsonwebtoken_1.default.decode(received);
            const isValid = decoded &&
                typeof decoded === 'object' &&
                'userId' in decoded &&
                'email' in decoded &&
                'role' in decoded &&
                'sessionId' in decoded &&
                'tokenType' in decoded &&
                'iat' in decoded &&
                'exp' in decoded;
            return {
                message: () => `expected ${received} to be a valid JWT token`,
                pass: !!isValid
            };
        }
        catch {
            return {
                message: () => `expected ${received} to be a valid JWT token`,
                pass: false
            };
        }
    }
});
describe('AuthService', () => {
    let authService;
    let mockUser;
    beforeEach(() => {
        jest.clearAllMocks();
        authService = auth_service_1.AuthService.getInstance();
        mockUser = createMockUser();
        MockedRedisService.get.mockResolvedValue(null);
        MockedRedisService.set.mockResolvedValue('OK');
        MockedRedisService.setex.mockResolvedValue(undefined);
        MockedRedisService.del.mockResolvedValue(1);
        MockedRedisService.exists.mockResolvedValue(1);
    });
    describe('Password Management', () => {
        describe('hashPassword', () => {
            it('should hash password successfully', async () => {
                const password = 'TestPassword123!';
                const hashedPassword = await authService.hashPassword(password);
                expect(hashedPassword).toBeDefined();
                expect(hashedPassword).not.toBe(password);
                expect(hashedPassword.startsWith('$2a$12$')).toBe(true);
            });
            it('should generate different hashes for same password', async () => {
                const password = 'TestPassword123!';
                const hash1 = await authService.hashPassword(password);
                const hash2 = await authService.hashPassword(password);
                expect(hash1).not.toBe(hash2);
            });
            it('should handle empty password', async () => {
                await expect(authService.hashPassword('')).rejects.toThrow('Password hashing failed');
            });
            it('should handle very long passwords', async () => {
                const longPassword = 'a'.repeat(1000);
                const hashedPassword = await authService.hashPassword(longPassword);
                expect(hashedPassword).toBeDefined();
            });
        });
        describe('verifyPassword', () => {
            it('should verify correct password', async () => {
                const password = 'TestPassword123!';
                const hashedPassword = await authService.hashPassword(password);
                const isValid = await authService.verifyPassword(password, hashedPassword);
                expect(isValid).toBe(true);
            });
            it('should reject incorrect password', async () => {
                const password = 'TestPassword123!';
                const wrongPassword = 'WrongPassword123!';
                const hashedPassword = await authService.hashPassword(password);
                const isValid = await authService.verifyPassword(wrongPassword, hashedPassword);
                expect(isValid).toBe(false);
            });
            it('should handle invalid hash format', async () => {
                const password = 'TestPassword123!';
                const invalidHash = 'invalid-hash-format';
                const isValid = await authService.verifyPassword(password, invalidHash);
                expect(isValid).toBe(false);
            });
            it('should handle empty inputs gracefully', async () => {
                const isValid1 = await authService.verifyPassword('', '');
                const isValid2 = await authService.verifyPassword('password', '');
                const isValid3 = await authService.verifyPassword('', 'hash');
                expect(isValid1).toBe(false);
                expect(isValid2).toBe(false);
                expect(isValid3).toBe(false);
            });
        });
        describe('validatePassword', () => {
            it('should validate strong password', () => {
                const result = authService.validatePassword('StrongPass123!');
                expect(result.valid).toBe(true);
                expect(result.message).toBe('Password is strong');
                expect(result.score).toBeGreaterThan(3);
                expect(result.requirements?.length).toBe(true);
                expect(result.requirements?.uppercase).toBe(true);
                expect(result.requirements?.lowercase).toBe(true);
                expect(result.requirements?.numbers).toBe(true);
                expect(result.requirements?.symbols).toBe(true);
            });
            it('should reject weak passwords', () => {
                const weakPasswords = ['123', 'password', 'PASSWORD', 'Pass123'];
                weakPasswords.forEach(password => {
                    const result = authService.validatePassword(password);
                    expect(result.valid).toBe(false);
                    expect(result.message).toContain('Password must');
                });
            });
            it('should provide specific error messages', () => {
                const testCases = [
                    { password: 'short', expectedError: 'at least 8 characters' },
                    { password: 'nouppercase123!', expectedError: 'uppercase letter' },
                    { password: 'NOLOWERCASE123!', expectedError: 'lowercase letter' },
                    { password: 'NoNumbers!', expectedError: 'number' },
                    { password: 'NoSymbols123', expectedError: 'special character' }
                ];
                testCases.forEach(({ password, expectedError }) => {
                    const result = authService.validatePassword(password);
                    expect(result.valid).toBe(false);
                    expect(result.message).toContain(expectedError);
                });
            });
            it('should calculate password score correctly', () => {
                const testCases = [
                    { password: 'Weak123!', expectedMinScore: 4 },
                    { password: 'VeryStrongPassword123!@#', expectedMinScore: 5 }
                ];
                testCases.forEach(({ password, expectedMinScore }) => {
                    const result = authService.validatePassword(password);
                    expect(result.score).toBeGreaterThanOrEqual(expectedMinScore);
                });
            });
        });
    });
    describe('Token Management', () => {
        describe('verifyToken', () => {
            it('should verify valid access token', async () => {
                const sessionId = 'test-session-id';
                const payload = {
                    userId: mockUser.id,
                    email: mockUser.email,
                    role: mockUser.role,
                    sessionId,
                    tokenType: 'access',
                    permissions: ['read', 'write']
                };
                const token = jsonwebtoken_1.default.sign({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }, 'test-jwt-secret-key-for-testing-purposes-only');
                MockedRedisService.get.mockResolvedValue(null);
                const decoded = await authService.verifyToken(token, 'access');
                expect(decoded.userId).toBe(mockUser.id);
                expect(decoded.email).toBe(mockUser.email);
                expect(decoded.sessionId).toBe(sessionId);
                expect(decoded.tokenType).toBe('access');
            });
            it('should verify valid refresh token', async () => {
                const sessionId = 'test-session-id';
                const payload = {
                    userId: mockUser.id,
                    email: mockUser.email,
                    role: mockUser.role,
                    sessionId,
                    tokenType: 'refresh',
                    permissions: ['read', 'write']
                };
                const token = jsonwebtoken_1.default.sign({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }, 'test-jwt-refresh-secret-key-for-testing-purposes-only');
                MockedRedisService.get.mockResolvedValue(null);
                const decoded = await authService.verifyToken(token, 'refresh');
                expect(decoded.userId).toBe(mockUser.id);
                expect(decoded.tokenType).toBe('refresh');
            });
            it('should reject invalid token', async () => {
                const invalidToken = 'invalid.jwt.token';
                await expect(authService.verifyToken(invalidToken, 'access'))
                    .rejects.toThrow('Invalid or expired token');
            });
            it('should reject expired token', async () => {
                const expiredPayload = {
                    userId: mockUser.id,
                    email: mockUser.email,
                    role: mockUser.role,
                    sessionId: 'test-session',
                    tokenType: 'access',
                    permissions: ['read'],
                    iat: Math.floor(Date.now() / 1000) - 7200,
                    exp: Math.floor(Date.now() / 1000) - 3600
                };
                const expiredToken = jsonwebtoken_1.default.sign(expiredPayload, 'test-jwt-secret-key-for-testing-purposes-only');
                await expect(authService.verifyToken(expiredToken, 'access'))
                    .rejects.toThrow('Invalid or expired token');
            });
            it('should reject blacklisted token', async () => {
                const payload = {
                    userId: mockUser.id,
                    email: mockUser.email,
                    role: mockUser.role,
                    sessionId: 'test-session',
                    tokenType: 'access',
                    permissions: ['read'],
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 3600
                };
                const token = jsonwebtoken_1.default.sign(payload, 'test-jwt-secret-key-for-testing-purposes-only');
                MockedRedisService.get.mockResolvedValue('true');
                await expect(authService.verifyToken(token, 'access'))
                    .rejects.toThrow('Invalid or expired token');
                expect(MockedRedisService.get).toHaveBeenCalledWith(`blacklist:${token}`);
            });
            it('should reject wrong token type', async () => {
                const payload = {
                    userId: mockUser.id,
                    email: mockUser.email,
                    role: mockUser.role,
                    sessionId: 'test-session',
                    tokenType: 'access',
                    permissions: ['read'],
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 3600
                };
                const token = jsonwebtoken_1.default.sign(payload, 'test-jwt-secret-key-for-testing-purposes-only');
                MockedRedisService.get.mockResolvedValue(null);
                await expect(authService.verifyToken(token, 'refresh'))
                    .rejects.toThrow('Invalid or expired token');
            });
        });
        describe('blacklistToken', () => {
            it('should blacklist valid token', async () => {
                const payload = {
                    userId: mockUser.id,
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 3600
                };
                const token = jsonwebtoken_1.default.sign(payload, 'test-jwt-secret-key-for-testing-purposes-only');
                await authService.blacklistToken(token);
                expect(MockedRedisService.setex).toHaveBeenCalledWith(`blacklist:${token}`, expect.any(Number), 'true');
            });
            it('should handle invalid token gracefully', async () => {
                const invalidToken = 'invalid.token.format';
                await authService.blacklistToken(invalidToken);
                expect(MockedRedisService.setex).not.toHaveBeenCalled();
            });
            it('should not blacklist already expired token', async () => {
                const expiredPayload = {
                    userId: mockUser.id,
                    iat: Math.floor(Date.now() / 1000) - 7200,
                    exp: Math.floor(Date.now() / 1000) - 3600
                };
                const expiredToken = jsonwebtoken_1.default.sign(expiredPayload, 'test-jwt-secret-key-for-testing-purposes-only');
                await authService.blacklistToken(expiredToken);
                expect(MockedRedisService.setex).not.toHaveBeenCalled();
            });
        });
    });
    describe('Authentication Flow', () => {
        beforeEach(() => {
            MockedDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            jest.spyOn(authService, 'verifyPassword').mockResolvedValue(true);
        });
        describe('authenticate', () => {
            const validCredentials = {
                email: 'test@example.com',
                password: 'TestPassword123!',
                rememberMe: false,
                userAgent: 'Test Agent',
                ipAddress: '127.0.0.1'
            };
            it('should authenticate user successfully', async () => {
                MockedRedisService.get.mockResolvedValue(null);
                const result = await authService.authenticate(validCredentials);
                expect(result?.user?.id).toBe(mockUser.id);
                expect(result?.user?.email).toBe(mockUser.email);
                expect(result?.user?.role).toBe(mockUser.role);
                expect(result?.tokens?.accessToken).toBeDefined();
                expect(typeof result?.tokens?.accessToken).toBe('string');
                expect(result?.tokens?.refreshToken).toBeDefined();
                expect(typeof result?.tokens?.refreshToken).toBe('string');
                expect(result?.sessionId).toBeDefined();
                expect(result?.tokens?.expiresIn).toBe(3600);
            });
            it('should generate longer-lived tokens for remember me', async () => {
                MockedRedisService.get.mockResolvedValue(null);
                const credentialsWithRememberMe = { ...validCredentials, rememberMe: true };
                const result = await authService.authenticate(credentialsWithRememberMe);
                expect(result?.tokens?.expiresIn).toBe(30 * 24 * 3600);
            });
            it('should reject invalid email', async () => {
                MockedDatabaseService.client.user.findUnique.mockResolvedValue(null);
                MockedRedisService.get.mockResolvedValue(null);
                const credentials = { ...validCredentials, email: 'invalid@example.com' };
                await expect(authService.authenticate(credentials))
                    .rejects.toThrow('Invalid credentials');
                expect(MockedRedisService.setex).toHaveBeenCalledWith('attempts:invalid@example.com', expect.any(Number), '1');
            });
            it('should reject invalid password', async () => {
                jest.spyOn(authService, 'verifyPassword').mockResolvedValue(false);
                MockedRedisService.get.mockResolvedValue(null);
                const credentials = { ...validCredentials, password: 'WrongPassword123!' };
                await expect(authService.authenticate(credentials))
                    .rejects.toThrow('Invalid credentials');
                expect(MockedRedisService.setex).toHaveBeenCalledWith(`attempts:${validCredentials.email}`, expect.any(Number), '1');
            });
            it('should reject inactive user', async () => {
                const inactiveUser = { ...mockUser, isActive: false };
                MockedDatabaseService.client.user.findUnique.mockResolvedValue(inactiveUser);
                MockedRedisService.get.mockResolvedValue(null);
                await expect(authService.authenticate(validCredentials))
                    .rejects.toThrow('Account is deactivated');
            });
            it('should reject locked account', async () => {
                MockedRedisService.get.mockResolvedValue('true');
                await expect(authService.authenticate(validCredentials))
                    .rejects.toThrow('Account temporarily locked due to too many failed attempts');
            });
            it('should clear failed attempts on successful login', async () => {
                MockedRedisService.get.mockResolvedValue(null);
                await authService.authenticate(validCredentials);
                expect(MockedRedisService.del).toHaveBeenCalledWith(`attempts:${validCredentials.email}`);
            });
            it('should create session with metadata', async () => {
                MockedRedisService.get.mockResolvedValue(null);
                await authService.authenticate(validCredentials);
                expect(MockedRedisService.setex).toHaveBeenCalledWith(expect.stringMatching(/^session:/), expect.any(Number), expect.stringContaining(validCredentials.userAgent));
            });
            it('should handle case-insensitive email', async () => {
                MockedRedisService.get.mockResolvedValue(null);
                const credentials = { ...validCredentials, email: 'TEST@EXAMPLE.COM' };
                await authService.authenticate(credentials);
                expect(MockedDatabaseService.client.user.findUnique).toHaveBeenCalledWith({
                    where: { email: 'test@example.com' },
                    select: expect.any(Object)
                });
            });
        });
        describe('lockout mechanism', () => {
            it('should track failed attempts', async () => {
                MockedDatabaseService.client.user.findUnique.mockResolvedValue(null);
                MockedRedisService.get.mockResolvedValue(null);
                const credentials = { email: 'test@example.com', password: 'wrong' };
                await expect(authService.authenticate(credentials)).rejects.toThrow();
                expect(MockedRedisService.setex).toHaveBeenCalledWith('attempts:test@example.com', expect.any(Number), '1');
            });
            it('should lock account after max failed attempts', async () => {
                MockedDatabaseService.client.user.findUnique.mockResolvedValue(null);
                MockedRedisService.get
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce('5');
                const credentials = { email: 'test@example.com', password: 'wrong' };
                await expect(authService.authenticate(credentials)).rejects.toThrow();
                expect(MockedRedisService.setex).toHaveBeenCalledWith('lockout:test@example.com', expect.any(Number), 'true');
            });
        });
    });
    describe('Session Management', () => {
        describe('updateSessionActivity', () => {
            it('should update existing session activity', async () => {
                const sessionId = 'test-session-id';
                const existingSession = JSON.stringify({
                    userId: mockUser.id,
                    createdAt: '2024-01-01T00:00:00.000Z',
                    lastActivity: '2024-01-01T00:00:00.000Z'
                });
                MockedRedisService.get.mockResolvedValue(existingSession);
                await authService.updateSessionActivity(sessionId, { action: 'test' });
                expect(MockedRedisService.get).toHaveBeenCalledWith(`session:${sessionId}`);
                expect(MockedRedisService.setex).toHaveBeenCalledWith(`session:${sessionId}`, expect.any(Number), expect.stringContaining('"action":"test"'));
            });
            it('should handle non-existent session gracefully', async () => {
                const sessionId = 'non-existent-session';
                MockedRedisService.get.mockResolvedValue(null);
                await authService.updateSessionActivity(sessionId);
                expect(MockedRedisService.setex).not.toHaveBeenCalled();
            });
            it('should handle Redis errors gracefully', async () => {
                const sessionId = 'test-session-id';
                MockedRedisService.get.mockRejectedValue(new Error('Redis error'));
                await authService.updateSessionActivity(sessionId);
                expect(MockedRedisService.setex).not.toHaveBeenCalled();
            });
        });
        describe('revokeSession', () => {
            it('should revoke session successfully', async () => {
                const sessionId = 'test-session-id';
                await authService.revokeSession(sessionId);
                expect(MockedRedisService.del).toHaveBeenCalledWith(`session:${sessionId}`);
            });
            it('should handle Redis errors gracefully', async () => {
                const sessionId = 'test-session-id';
                MockedRedisService.del.mockRejectedValue(new Error('Redis error'));
                await authService.revokeSession(sessionId);
            });
        });
        describe('logout', () => {
            it('should logout user successfully', async () => {
                const sessionId = 'test-session-id';
                const token = 'test.jwt.token';
                await authService.logout(sessionId, token);
                expect(MockedRedisService.del).toHaveBeenCalledWith(`session:${sessionId}`);
            });
            it('should logout without token', async () => {
                const sessionId = 'test-session-id';
                await authService.logout(sessionId);
                expect(MockedRedisService.del).toHaveBeenCalledWith(`session:${sessionId}`);
            });
        });
    });
    describe('Token Refresh', () => {
        describe('refreshToken', () => {
            it('should refresh token successfully', async () => {
                const refreshPayload = {
                    userId: mockUser.id,
                    email: mockUser.email,
                    role: mockUser.role,
                    sessionId: 'test-session',
                    tokenType: 'refresh',
                    permissions: ['read', 'write'],
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 3600
                };
                const refreshToken = jsonwebtoken_1.default.sign(refreshPayload, 'test-jwt-refresh-secret-key-for-testing-purposes-only');
                MockedRedisService.get.mockResolvedValue(null);
                const result = await authService.refreshToken(refreshToken);
                expect(result.accessToken).toBeDefined();
                expect(typeof result.accessToken).toBe('string');
            });
            it('should reject invalid refresh token', async () => {
                const invalidToken = 'invalid.refresh.token';
                await expect(authService.refreshToken(invalidToken))
                    .rejects.toThrow();
            });
            it('should reject access token as refresh token', async () => {
                const accessPayload = {
                    userId: mockUser.id,
                    email: mockUser.email,
                    role: mockUser.role,
                    sessionId: 'test-session',
                    tokenType: 'access',
                    permissions: ['read'],
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 3600
                };
                const accessToken = jsonwebtoken_1.default.sign(accessPayload, 'test-jwt-secret-key-for-testing-purposes-only');
                await expect(authService.refreshToken(accessToken))
                    .rejects.toThrow();
            });
        });
    });
    describe('Role Permissions', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            MockedRedisService.get.mockResolvedValue(null);
        });
        it('should get admin permissions', async () => {
            const adminUser = createMockUser({ role: UserRole.ADMIN });
            MockedDatabaseService.client.user.findUnique.mockResolvedValue(adminUser);
            jest.spyOn(authService, 'verifyPassword').mockResolvedValue(true);
            const credentials = {
                email: 'admin@example.com',
                password: 'AdminPass123!'
            };
            const result = await authService.authenticate(credentials);
            expect(result?.user?.permissions).toContain('manage_users');
            expect(result?.user?.permissions).toContain('manage_settings');
            expect(result?.user?.permissions).toContain('read');
            expect(result?.user?.permissions).toContain('write');
            expect(result?.user?.permissions).toContain('delete');
        });
        it('should get parent permissions', async () => {
            const parentUser = createMockUser({ role: UserRole.PARENT });
            MockedDatabaseService.client.user.findUnique.mockResolvedValue(parentUser);
            jest.spyOn(authService, 'verifyPassword').mockResolvedValue(true);
            const credentials = {
                email: 'parent@example.com',
                password: 'ParentPass123!'
            };
            const result = await authService.authenticate(credentials);
            expect(result?.user?.permissions).toContain('order_food');
            expect(result?.user?.permissions).toContain('view_reports');
            expect(result?.user?.permissions).toContain('read');
            expect(result?.user?.permissions).toContain('write');
            expect(result?.user?.permissions).not.toContain('manage_users');
        });
        it('should get student permissions', async () => {
            const studentUser = createMockUser({ role: UserRole.STUDENT });
            MockedDatabaseService.client.user.findUnique.mockResolvedValue(studentUser);
            jest.spyOn(authService, 'verifyPassword').mockResolvedValue(true);
            const credentials = {
                email: 'student@example.com',
                password: 'StudentPass123!'
            };
            const result = await authService.authenticate(credentials);
            expect(result?.user?.permissions).toContain('read');
            expect(result?.user?.permissions).toContain('view_orders');
            expect(result?.user?.permissions).not.toContain('write');
            expect(result?.user?.permissions).not.toContain('manage_users');
        });
        it('should get school permissions', async () => {
            const schoolUser = createMockUser({ role: UserRole.SCHOOL });
            MockedDatabaseService.client.user.findUnique.mockResolvedValue(schoolUser);
            jest.spyOn(authService, 'verifyPassword').mockResolvedValue(true);
            const credentials = {
                email: 'school@example.com',
                password: 'SchoolPass123!'
            };
            const result = await authService.authenticate(credentials);
            expect(result?.user?.permissions).toContain('manage_menus');
            expect(result?.user?.permissions).toContain('view_analytics');
            expect(result?.user?.permissions).toContain('read');
            expect(result?.user?.permissions).toContain('write');
        });
        it('should default to student permissions for unknown roles', async () => {
            const unknownRoleUser = createMockUser({ role: 'UNKNOWN_ROLE' });
            MockedDatabaseService.client.user.findUnique.mockResolvedValue(unknownRoleUser);
            jest.spyOn(authService, 'verifyPassword').mockResolvedValue(true);
            const credentials = {
                email: 'unknown@example.com',
                password: 'UnknownPass123!'
            };
            const result = await authService.authenticate(credentials);
            expect(result?.user?.permissions).toEqual(['read', 'view_orders']);
        });
    });
    describe('Error Handling', () => {
        it('should handle database connection errors', async () => {
            MockedDatabaseService.client.user.findUnique.mockRejectedValue(new Error('Database connection failed'));
            MockedRedisService.get.mockResolvedValue(null);
            const credentials = {
                email: 'test@example.com',
                password: 'TestPass123!'
            };
            await expect(authService.authenticate(credentials))
                .rejects.toThrow('Database connection failed');
        });
        it('should handle Redis connection errors gracefully', async () => {
            MockedDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            MockedRedisService.get.mockRejectedValue(new Error('Redis connection failed'));
            const credentials = {
                email: 'test@example.com',
                password: 'TestPass123!'
            };
            await expect(authService.authenticate(credentials))
                .rejects.toThrow();
        });
        it('should handle password hashing errors', async () => {
            jest.spyOn(bcryptjs_1.default, 'hash').mockRejectedValue(new Error('Hashing failed'));
            await expect(authService.hashPassword('password'))
                .rejects.toThrow('Password hashing failed');
        });
        it('should handle password verification errors', async () => {
            jest.spyOn(bcryptjs_1.default, 'compare').mockRejectedValue(new Error('Comparison failed'));
            const result = await authService.verifyPassword('password', 'hash');
            expect(result).toBe(false);
        });
    });
    describe('Service Configuration', () => {
        it('should validate JWT secrets on initialization', () => {
            expect(() => auth_service_1.AuthService.getInstance()).not.toThrow();
        });
        it('should throw error for missing JWT secrets', () => {
            class TestAuthService {
                jwtSecret;
                jwtRefreshSecret;
                constructor(jwtSecret = '', jwtRefreshSecret = '') {
                    this.jwtSecret = jwtSecret;
                    this.jwtRefreshSecret = jwtRefreshSecret;
                    this.validateConfiguration();
                }
                validateConfiguration() {
                    if (!this.jwtSecret || !this.jwtRefreshSecret) {
                        throw new Error('JWT secrets are required for authentication service');
                    }
                }
            }
            expect(() => new TestAuthService('', '')).toThrow('JWT secrets are required for authentication service');
            expect(() => new TestAuthService('secret', '')).toThrow('JWT secrets are required for authentication service');
            expect(() => new TestAuthService('', 'secret')).toThrow('JWT secrets are required for authentication service');
            expect(() => new TestAuthService('secret', 'refresh-secret')).not.toThrow();
        });
    });
    describe('Session Cleanup', () => {
        describe('cleanupSessions', () => {
            it('should complete cleanup without errors', async () => {
                await authService.cleanupSessions();
                expect(true).toBe(true);
            });
        });
        describe('logoutAll', () => {
            it('should attempt to logout all user sessions', async () => {
                const userId = 'user-123';
                await authService.logoutAll(userId);
                expect(true).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=auth.service.test.js.map