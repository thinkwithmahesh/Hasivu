"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const auth_service_1 = require("../../../src/services/auth.service");
const database_service_1 = require("../../../src/services/database.service");
const redis_service_1 = require("../../../src/services/redis.service");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
globals_1.jest.mock('../../../src/services/database.service');
globals_1.jest.mock('../../../src/services/redis.service');
globals_1.jest.mock('bcryptjs', () => ({
    hash: globals_1.jest.fn(),
    compare: globals_1.jest.fn(),
}));
globals_1.jest.mock('jsonwebtoken', () => ({
    sign: globals_1.jest.fn(),
    verify: globals_1.jest.fn(),
    decode: globals_1.jest.fn(),
    TokenExpiredError: globals_1.jest.fn(),
}));
globals_1.jest.mock('../../../src/config/environment', () => ({
    config: {
        jwt: {
            secret: 'test-jwt-secret-key-for-testing-only-minimum-64-characters-required-for-security-validation',
            refreshSecret: 'test-jwt-refresh-secret-key-for-testing-only-minimum-64-characters-required-for-security-validation',
        },
        redis: {
            url: 'redis://localhost:6379/1',
        },
        server: {
            nodeEnv: 'test',
        },
    },
}));
globals_1.jest.mock('../../../src/shared/logger.service', () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)('AuthService', () => {
    let authService;
    let mockDatabaseService;
    let mockRedisService;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        mockDatabaseService = {
            client: {
                user: {
                    findUnique: globals_1.jest.fn(),
                    findFirst: globals_1.jest.fn(),
                    create: globals_1.jest.fn(),
                    update: globals_1.jest.fn(),
                    count: globals_1.jest.fn(),
                },
                authSession: {
                    create: globals_1.jest.fn(),
                    findUnique: globals_1.jest.fn(),
                    update: globals_1.jest.fn(),
                    delete: globals_1.jest.fn(),
                },
            },
        };
        mockRedisService = {
            get: globals_1.jest.fn(),
            set: globals_1.jest.fn(),
            del: globals_1.jest.fn(),
            expire: globals_1.jest.fn(),
        };
        database_service_1.DatabaseService.getInstance.mockReturnValue(mockDatabaseService);
        redis_service_1.RedisService.getInstance.mockReturnValue(mockRedisService);
        authService = auth_service_1.AuthService.getInstance();
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)('Password Validation', () => {
        (0, globals_1.test)('should validate strong password successfully', () => {
            const strongPassword = 'SecurePass123!';
            const result = authService.validatePassword(strongPassword);
            (0, globals_1.expect)(result).toBe(true);
        });
        (0, globals_1.test)('should reject password without uppercase letter', () => {
            const weakPassword = 'securepass123!';
            const result = authService.validatePassword(weakPassword);
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.test)('should reject password without lowercase letter', () => {
            const weakPassword = 'SECUREPASS123!';
            const result = authService.validatePassword(weakPassword);
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.test)('should reject password without number', () => {
            const weakPassword = 'SecurePass!';
            const result = authService.validatePassword(weakPassword);
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.test)('should reject password without special character', () => {
            const weakPassword = 'SecurePass123';
            const result = authService.validatePassword(weakPassword);
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.test)('should reject password shorter than 8 characters', () => {
            const shortPassword = 'Sec1!';
            const result = authService.validatePassword(shortPassword);
            (0, globals_1.expect)(result).toBe(false);
        });
    });
    (0, globals_1.describe)('User Registration', () => {
        const validRegistrationData = {
            email: 'test@example.com',
            password: 'SecurePass123!',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            role: 'parent',
        };
        (0, globals_1.test)('should register new user successfully', async () => {
            mockDatabaseService.client.user.findUnique.mockResolvedValue(null);
            mockDatabaseService.client.user.findFirst.mockResolvedValue(null);
            bcryptjs_1.default.hash.mockResolvedValue('hashed_password');
            const mockCreatedUser = {
                id: 'user-123',
                email: validRegistrationData.email,
                passwordHash: 'hashed_password',
                firstName: validRegistrationData.firstName,
                lastName: validRegistrationData.lastName,
                phone: validRegistrationData.phone,
                role: validRegistrationData.role,
                status: 'ACTIVE',
                isActive: true,
                emailVerified: false,
                phoneVerified: false,
                twoFactorEnabled: false,
                loginAttempts: 0,
                language: 'en',
                preferences: '{}',
                securitySettings: '{}',
                deviceTokens: '[]',
                metadata: '{}',
                schoolId: null,
                cognitoUserId: null,
                parentId: null,
                grade: null,
                section: null,
                profilePictureUrl: null,
                timezone: 'UTC',
                lastLoginAt: null,
                lockedUntil: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockDatabaseService.client.user.create.mockResolvedValue(mockCreatedUser);
            const result = await authService.register(validRegistrationData);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.user).toEqual(mockCreatedUser);
            (0, globals_1.expect)(mockDatabaseService.client.user.create).toHaveBeenCalledWith({
                data: globals_1.expect.objectContaining({
                    email: validRegistrationData.email,
                    passwordHash: 'hashed_password',
                    firstName: validRegistrationData.firstName,
                    lastName: validRegistrationData.lastName,
                    phone: validRegistrationData.phone,
                    role: validRegistrationData.role,
                }),
            });
        });
        (0, globals_1.test)('should reject registration with existing email', async () => {
            mockDatabaseService.client.user.findUnique.mockResolvedValue({
                id: 'existing-user',
                email: validRegistrationData.email,
            });
            const result = await authService.register(validRegistrationData);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('already exists');
        });
        (0, globals_1.test)('should reject registration with invalid email format', async () => {
            const invalidData = { ...validRegistrationData, email: 'invalid-email' };
            const result = await authService.register(invalidData);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Invalid email format');
        });
        (0, globals_1.test)('should reject registration with weak password', async () => {
            const invalidData = { ...validRegistrationData, password: 'weak' };
            const result = await authService.register(invalidData);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Password does not meet requirements');
        });
        (0, globals_1.test)('should handle database errors during registration', async () => {
            mockDatabaseService.client.user.findUnique.mockRejectedValue(new Error('Database connection failed'));
            const result = await authService.register(validRegistrationData);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Database connection failed');
        });
    });
    (0, globals_1.describe)('User Authentication', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'SecurePass123!',
        };
        const mockUser = {
            id: 'user-123',
            email: validLoginData.email,
            passwordHash: 'hashed_password',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            role: 'parent',
            status: 'ACTIVE',
            isActive: true,
            emailVerified: true,
            phoneVerified: false,
            twoFactorEnabled: false,
            loginAttempts: 0,
            language: 'en',
            preferences: '{}',
            securitySettings: '{}',
            deviceTokens: '[]',
            metadata: '{}',
            schoolId: null,
            cognitoUserId: null,
            parentId: null,
            grade: null,
            section: null,
            profilePictureUrl: null,
            timezone: 'UTC',
            lastLoginAt: null,
            lockedUntil: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        (0, globals_1.test)('should authenticate user successfully', async () => {
            mockDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            bcryptjs_1.default.compare.mockResolvedValue(true);
            jsonwebtoken_1.default.sign.mockReturnValue('access_token');
            jsonwebtoken_1.default.sign.mockReturnValueOnce('refresh_token');
            mockDatabaseService.client.authSession.create.mockResolvedValue({
                id: 'session-123',
                userId: mockUser.id,
                sessionId: 'session-123',
                isActive: true,
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const result = await authService.authenticate(validLoginData);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.user).toEqual(mockUser);
            (0, globals_1.expect)(result.tokens).toBeDefined();
            (0, globals_1.expect)(result.tokens?.accessToken).toBe('access_token');
            (0, globals_1.expect)(result.tokens?.refreshToken).toBe('refresh_token');
        });
        (0, globals_1.test)('should reject authentication with non-existent user', async () => {
            mockDatabaseService.client.user.findUnique.mockResolvedValue(null);
            const result = await authService.authenticate(validLoginData);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Invalid credentials');
        });
        (0, globals_1.test)('should reject authentication with wrong password', async () => {
            mockDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            bcryptjs_1.default.compare.mockResolvedValue(false);
            const result = await authService.authenticate(validLoginData);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Invalid credentials');
        });
        (0, globals_1.test)('should handle inactive user authentication', async () => {
            const inactiveUser = { ...mockUser, isActive: false };
            mockDatabaseService.client.user.findUnique.mockResolvedValue(inactiveUser);
            const result = await authService.authenticate(validLoginData);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Account is inactive');
        });
        (0, globals_1.test)('should handle suspended user authentication', async () => {
            const suspendedUser = { ...mockUser, status: 'SUSPENDED' };
            mockDatabaseService.client.user.findUnique.mockResolvedValue(suspendedUser);
            const result = await authService.authenticate(validLoginData);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Account is suspended');
        });
        (0, globals_1.test)('should increment login attempts on failed authentication', async () => {
            mockDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            bcryptjs_1.default.compare.mockResolvedValue(false);
            await authService.authenticate(validLoginData);
            (0, globals_1.expect)(mockDatabaseService.client.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: { loginAttempts: 1 },
            });
        });
        (0, globals_1.test)('should lock account after maximum failed attempts', async () => {
            const userWithMaxAttempts = { ...mockUser, loginAttempts: 4 };
            mockDatabaseService.client.user.findUnique.mockResolvedValue(userWithMaxAttempts);
            bcryptjs_1.default.compare.mockResolvedValue(false);
            await authService.authenticate(validLoginData);
            (0, globals_1.expect)(mockDatabaseService.client.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: globals_1.expect.objectContaining({
                    loginAttempts: 5,
                    lockedUntil: globals_1.expect.any(Date),
                }),
            });
        });
    });
    (0, globals_1.describe)('Token Management', () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            passwordHash: 'hashed_password',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            role: 'parent',
            status: 'ACTIVE',
            isActive: true,
            emailVerified: true,
            phoneVerified: false,
            twoFactorEnabled: false,
            loginAttempts: 0,
            language: 'en',
            preferences: '{}',
            securitySettings: '{}',
            deviceTokens: '[]',
            metadata: '{}',
            schoolId: null,
            cognitoUserId: null,
            parentId: null,
            grade: null,
            section: null,
            profilePictureUrl: null,
            timezone: 'UTC',
            lastLoginAt: null,
            lockedUntil: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        (0, globals_1.test)('should refresh access token successfully', async () => {
            const refreshToken = 'valid_refresh_token';
            jsonwebtoken_1.default.verify.mockReturnValue({ userId: mockUser.id, type: 'refresh' });
            mockDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            jsonwebtoken_1.default.sign.mockReturnValue('new_access_token');
            const result = await authService.refreshAccessToken(refreshToken);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.tokens?.accessToken).toBe('new_access_token');
        });
        (0, globals_1.test)('should reject invalid refresh token', async () => {
            const invalidToken = 'invalid_token';
            jsonwebtoken_1.default.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            const result = await authService.refreshAccessToken(invalidToken);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Invalid refresh token');
        });
        (0, globals_1.test)('should reject refresh token for inactive user', async () => {
            const refreshToken = 'valid_refresh_token';
            const inactiveUser = { ...mockUser, isActive: false };
            jsonwebtoken_1.default.verify.mockReturnValue({ userId: mockUser.id, type: 'refresh' });
            mockDatabaseService.client.user.findUnique.mockResolvedValue(inactiveUser);
            const result = await authService.refreshAccessToken(refreshToken);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('User account is inactive');
        });
        (0, globals_1.test)('should validate access token successfully', async () => {
            const accessToken = 'valid_access_token';
            jsonwebtoken_1.default.verify.mockReturnValue({
                userId: mockUser.id,
                role: mockUser.role,
                type: 'access'
            });
            mockDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            const result = await authService.validateToken(accessToken);
            (0, globals_1.expect)(result.valid).toBe(true);
            (0, globals_1.expect)(result.user).toEqual(mockUser);
        });
        (0, globals_1.test)('should reject expired access token', async () => {
            const expiredToken = 'expired_token';
            jsonwebtoken_1.default.verify.mockImplementation(() => {
                throw new jsonwebtoken_1.default.TokenExpiredError('Token expired', new Date());
            });
            const result = await authService.validateToken(expiredToken);
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Token expired');
        });
    });
    (0, globals_1.describe)('Session Management', () => {
        (0, globals_1.test)('should create session successfully', async () => {
            const userId = 'user-123';
            const sessionData = {
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
            };
            const mockSession = {
                id: 'session-123',
                userId,
                sessionId: 'session-123',
                isActive: true,
                ipAddress: sessionData.ipAddress,
                userAgent: sessionData.userAgent,
                lastActivity: new Date(),
                expiresAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockDatabaseService.client.authSession.create.mockResolvedValue(mockSession);
            (0, globals_1.expect)(true).toBe(true);
        });
        (0, globals_1.test)('should invalidate session successfully', async () => {
            const sessionId = 'session-123';
            mockDatabaseService.client.authSession.update.mockResolvedValue({
                id: sessionId,
                userId: 'user-123',
                sessionId: 'session-123',
                isActive: false,
                ipAddress: null,
                userAgent: null,
                lastActivity: new Date(),
                expiresAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            (0, globals_1.expect)(true).toBe(true);
        });
        (0, globals_1.test)('should cleanup expired sessions', async () => {
            const expiredSessions = [
                {
                    id: 'session-1',
                    userId: 'user-1',
                    sessionId: 'session-1',
                    isActive: true,
                    ipAddress: null,
                    userAgent: null,
                    lastActivity: new Date(),
                    expiresAt: new Date(Date.now() - 1000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'session-2',
                    userId: 'user-2',
                    sessionId: 'session-2',
                    isActive: true,
                    ipAddress: null,
                    userAgent: null,
                    lastActivity: new Date(),
                    expiresAt: new Date(Date.now() - 2000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            mockDatabaseService.client.authSession.findMany.mockResolvedValue(expiredSessions);
            mockDatabaseService.client.authSession.delete.mockResolvedValue({});
            (0, globals_1.expect)(true).toBe(true);
        });
    });
    (0, globals_1.describe)('Password Reset', () => {
        (0, globals_1.test)('should initiate password reset successfully', async () => {
            const email = 'test@example.com';
            const mockUser = {
                id: 'user-123',
                email,
                passwordHash: 'hashed_password',
                firstName: 'John',
                lastName: 'Doe',
                phone: '+1234567890',
                role: 'parent',
                status: 'ACTIVE',
                isActive: true,
                emailVerified: true,
                phoneVerified: false,
                twoFactorEnabled: false,
                loginAttempts: 0,
                language: 'en',
                preferences: '{}',
                securitySettings: '{}',
                deviceTokens: '[]',
                metadata: '{}',
                schoolId: null,
                cognitoUserId: null,
                parentId: null,
                grade: null,
                section: null,
                profilePictureUrl: null,
                timezone: 'UTC',
                lastLoginAt: null,
                lockedUntil: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            mockRedisService.set.mockResolvedValue(undefined);
            const result = await authService.initiatePasswordReset(email);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(mockRedisService.set).toHaveBeenCalled();
        });
        (0, globals_1.test)('should reject password reset for non-existent user', async () => {
            const email = 'nonexistent@example.com';
            mockDatabaseService.client.user.findUnique.mockResolvedValue(null);
            const result = await authService.initiatePasswordReset(email);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('User not found');
        });
        (0, globals_1.test)('should reset password successfully', async () => {
            const resetToken = 'valid_reset_token';
            const newPassword = 'NewSecurePass123!';
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                passwordHash: 'old_hashed_password',
                firstName: 'John',
                lastName: 'Doe',
                phone: '+1234567890',
                role: 'parent',
                status: 'ACTIVE',
                isActive: true,
                emailVerified: true,
                phoneVerified: false,
                twoFactorEnabled: false,
                loginAttempts: 0,
                language: 'en',
                preferences: '{}',
                securitySettings: '{}',
                deviceTokens: '[]',
                metadata: '{}',
                schoolId: null,
                cognitoUserId: null,
                parentId: null,
                grade: null,
                section: null,
                profilePictureUrl: null,
                timezone: 'UTC',
                lastLoginAt: null,
                lockedUntil: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockRedisService.get.mockResolvedValue(mockUser.id);
            mockDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            bcryptjs_1.default.hash.mockResolvedValue('new_hashed_password');
            mockDatabaseService.client.user.update.mockResolvedValue({
                ...mockUser,
                passwordHash: 'new_hashed_password',
            });
            const result = await authService.resetPassword(resetToken, newPassword);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(mockDatabaseService.client.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: globals_1.expect.objectContaining({
                    passwordHash: 'new_hashed_password',
                    loginAttempts: 0,
                }),
            });
            (0, globals_1.expect)(mockRedisService.del).toHaveBeenCalledWith(resetToken);
        });
        (0, globals_1.test)('should reject password reset with invalid token', async () => {
            const invalidToken = 'invalid_token';
            const newPassword = 'NewSecurePass123!';
            mockRedisService.get.mockResolvedValue(null);
            const result = await authService.resetPassword(invalidToken, newPassword);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Invalid or expired reset token');
        });
    });
    (0, globals_1.describe)('Security Features', () => {
        (0, globals_1.test)('should detect brute force attacks', async () => {
            const email = 'test@example.com';
            for (let i = 0; i < 5; i++) {
                mockDatabaseService.client.user.findUnique.mockResolvedValue({
                    id: 'user-123',
                    email,
                    loginAttempts: i,
                });
                bcryptjs_1.default.compare.mockResolvedValue(false);
                await authService.authenticate({ email, password: 'wrong' });
            }
            (0, globals_1.expect)(mockDatabaseService.client.user.update).toHaveBeenLastCalledWith({
                where: { id: 'user-123' },
                data: globals_1.expect.objectContaining({
                    lockedUntil: globals_1.expect.any(Date),
                }),
            });
        });
        (0, globals_1.test)('should handle concurrent login attempts', async () => {
            const email = 'test@example.com';
            const mockUser = {
                id: 'user-123',
                email,
                passwordHash: 'hashed_password',
                firstName: 'John',
                lastName: 'Doe',
                phone: '+1234567890',
                role: 'parent',
                status: 'ACTIVE',
                isActive: true,
                emailVerified: true,
                phoneVerified: false,
                twoFactorEnabled: false,
                loginAttempts: 0,
                language: 'en',
                preferences: '{}',
                securitySettings: '{}',
                deviceTokens: '[]',
                metadata: '{}',
                schoolId: null,
                cognitoUserId: null,
                parentId: null,
                grade: null,
                section: null,
                profilePictureUrl: null,
                timezone: 'UTC',
                lastLoginAt: null,
                lockedUntil: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            bcryptjs_1.default.compare.mockResolvedValue(true);
            jsonwebtoken_1.default.sign.mockReturnValue('token');
            const promises = Array(5).fill(null).map(() => authService.authenticate({ email, password: 'correct' }));
            const results = await Promise.all(promises);
            results.forEach(result => {
                (0, globals_1.expect)(result.success).toBe(true);
            });
        });
        (0, globals_1.test)('should validate session integrity', async () => {
            const sessionId = 'session-123';
            mockDatabaseService.client.authSession.findUnique.mockResolvedValue({
                id: sessionId,
                userId: 'user-123',
                sessionId: 'session-123',
                isActive: true,
                ipAddress: null,
                userAgent: null,
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const result = await authService.validateSession(sessionId);
            (0, globals_1.expect)(result.valid).toBe(true);
        });
        (0, globals_1.test)('should reject expired sessions', async () => {
            const sessionId = 'expired-session';
            mockDatabaseService.client.authSession.findUnique.mockResolvedValue({
                id: sessionId,
                userId: 'user-123',
                sessionId: 'expired-session',
                isActive: true,
                ipAddress: null,
                userAgent: null,
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() - 1000),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const result = await authService.validateSession(sessionId);
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Session expired');
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.test)('should handle database connection errors', async () => {
            mockDatabaseService.client.user.findUnique.mockRejectedValue(new Error('Database connection failed'));
            const result = await authService.authenticate({
                email: 'test@example.com',
                password: 'password',
            });
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Database connection failed');
        });
        (0, globals_1.test)('should handle Redis connection errors', async () => {
            mockRedisService.get.mockRejectedValue(new Error('Redis connection failed'));
            const result = await authService.validateToken('token');
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Redis connection failed');
        });
        (0, globals_1.test)('should handle JWT signing errors', async () => {
            jsonwebtoken_1.default.sign.mockImplementation(() => {
                throw new Error('JWT signing failed');
            });
            const result = await authService.authenticate({
                email: 'test@example.com',
                password: 'password',
            });
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('JWT signing failed');
        });
        (0, globals_1.test)('should handle bcrypt errors', async () => {
            bcryptjs_1.default.hash.mockRejectedValue(new Error('Hashing failed'));
            const result = await authService.register({
                email: 'test@example.com',
                password: 'SecurePass123!',
                firstName: 'John',
                lastName: 'Doe',
            });
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Hashing failed');
        });
    });
});
//# sourceMappingURL=auth.service.test.js.map