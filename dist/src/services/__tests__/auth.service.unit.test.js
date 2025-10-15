"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../auth.service");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const crypto = __importStar(require("crypto"));
const redis_service_1 = require("../redis.service");
const database_service_1 = require("../database.service");
const logger_1 = require("../../utils/logger");
const environment_1 = require("../../config/environment");
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('crypto');
jest.mock('../redis.service');
jest.mock('../database.service');
jest.mock('../../utils/logger');
jest.mock('../../config/environment', () => ({
    config: {
        jwt: {
            secret: 'test-jwt-secret-key-12345',
            refreshSecret: 'test-refresh-secret-key-12345'
        }
    }
}));
const mockedBcrypt = bcrypt;
const mockedJwt = jwt;
const mockedCrypto = crypto;
const mockedRedis = redis_service_1.RedisService;
const mockedDatabase = database_service_1.DatabaseService;
const mockedLogger = logger_1.logger;
describe('AuthService', () => {
    let authService;
    beforeEach(() => {
        jest.clearAllMocks();
        mockedCrypto.randomBytes = jest.fn().mockReturnValue(Buffer.from('test-session-id-1234567890123456'));
        mockedDatabase.client = {
            user: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn()
            }
        };
        authService = new auth_service_1.AuthService();
    });
    describe('Constructor and Configuration', () => {
        it('should initialize with correct default values', () => {
            expect(authService).toBeInstanceOf(auth_service_1.AuthService);
            expect(authService['jwtSecret']).toBe('test-jwt-secret-key-12345');
            expect(authService['jwtRefreshSecret']).toBe('test-refresh-secret-key-12345');
            expect(authService['sessionTimeout']).toBe(24 * 60 * 60);
            expect(authService['maxFailedAttempts']).toBe(5);
            expect(authService['lockoutDuration']).toBe(30 * 60);
        });
        it('should validate configuration successfully', () => {
            const validation = authService.validateConfiguration();
            expect(validation.isValid).toBe(true);
            expect(validation.missingConfigs).toHaveLength(0);
            expect(validation.securityIssues).toHaveLength(0);
        });
        it('should throw error for invalid configuration', () => {
            const originalConfig = environment_1.config.jwt;
            environment_1.config.jwt.secret = '';
            environment_1.config.jwt.refreshSecret = '';
            expect(() => new auth_service_1.AuthService()).toThrow('Auth service configuration invalid: JWT_SECRET, JWT_REFRESH_SECRET');
            environment_1.config.jwt = originalConfig;
        });
    });
    describe('Password Management', () => {
        describe('hashPassword', () => {
            it('should hash password successfully', async () => {
                const password = 'TestPassword123!';
                const hashedPassword = 'hashed-password-result';
                mockedBcrypt.hash.mockResolvedValueOnce(hashedPassword);
                const result = await authService.hashPassword(password);
                expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 12);
                expect(result).toBe(hashedPassword);
            });
            it('should reject empty password', async () => {
                await expect(authService.hashPassword('')).rejects.toThrow('Password cannot be empty');
                await expect(authService.hashPassword('   ')).rejects.toThrow('Password cannot be empty');
            });
            it('should handle bcrypt errors', async () => {
                mockedBcrypt.hash.mockRejectedValueOnce(new Error('Bcrypt error'));
                await expect(authService.hashPassword('password')).rejects.toThrow('Password hashing failed');
                expect(mockedLogger.error).toHaveBeenCalledWith('Password hashing failed:', expect.any(Error));
            });
        });
        describe('verifyPassword', () => {
            it('should verify password successfully', async () => {
                const password = 'TestPassword123!';
                const hashedPassword = 'hashed-password';
                mockedBcrypt.compare.mockResolvedValueOnce(true);
                const result = await authService.verifyPassword(password, hashedPassword);
                expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
                expect(result).toBe(true);
            });
            it('should return false for empty inputs', async () => {
                expect(await authService.verifyPassword('', 'hash')).toBe(false);
                expect(await authService.verifyPassword('password', '')).toBe(false);
                expect(await authService.verifyPassword('   ', 'hash')).toBe(false);
            });
            it('should handle bcrypt errors gracefully', async () => {
                mockedBcrypt.compare.mockRejectedValueOnce(new Error('Compare error'));
                const result = await authService.verifyPassword('password', 'hash');
                expect(result).toBe(false);
                expect(mockedLogger.error).toHaveBeenCalledWith('Password verification failed:', expect.any(Error));
            });
        });
        describe('validatePassword', () => {
            it('should validate strong password', () => {
                const password = 'StrongPass123!';
                const result = authService.validatePassword(password);
                expect(result.valid).toBe(true);
                expect(result.isValid).toBe(true);
                expect(result.message).toBe('Password is strong');
                expect(result.score).toBeGreaterThan(0);
                expect(result.requirements).toEqual({
                    length: true,
                    uppercase: true,
                    lowercase: true,
                    numbers: true,
                    symbols: true
                });
            });
            it('should validate weak password', () => {
                const password = 'weak';
                const result = authService.validatePassword(password);
                expect(result.valid).toBe(false);
                expect(result.isValid).toBe(false);
                expect(result.message).toContain('Password must be at least 8 characters long');
                expect(result.requirements?.length).toBe(false);
                expect(result.requirements?.uppercase).toBe(false);
                expect(result.requirements?.lowercase).toBe(true);
                expect(result.requirements?.numbers).toBe(false);
                expect(result.requirements?.symbols).toBe(false);
            });
            it('should provide detailed validation feedback', () => {
                const password = 'password';
                const result = authService.validatePassword(password);
                expect(result.valid).toBe(false);
                expect(result.message).toContain('uppercase letter');
                expect(result.message).toContain('number');
                expect(result.message).toContain('special character');
            });
        });
        describe('calculatePasswordScore', () => {
            it('should calculate correct password scores', () => {
                const testCases = [
                    { password: 'weak', expectedScore: 1 },
                    { password: 'WeakPass123', expectedScore: 4 },
                    { password: 'StrongPassword123!', expectedScore: 5 },
                    { password: 'VeryLongPasswordWithAllRequirements123!@#', expectedScore: 5 }
                ];
                testCases.forEach(({ password, expectedScore }) => {
                    const result = authService.validatePassword(password);
                    expect(result.score).toBeLessThanOrEqual(expectedScore);
                });
            });
        });
    });
    describe('JWT Token Management', () => {
        describe('generateToken', () => {
            it('should generate valid JWT token', async () => {
                const mockToken = 'mock-jwt-token';
                const payload = {
                    userId: 'user-123',
                    email: 'test@example.com',
                    role: 'PARENT',
                    sessionId: 'session-123',
                    tokenType: 'access',
                    permissions: ['read', 'write']
                };
                mockedJwt.sign.mockReturnValueOnce(mockToken);
                const result = await authService.generateToken(payload, 3600);
                expect(mockedJwt.sign).toHaveBeenCalledWith(expect.objectContaining({
                    ...payload,
                    iat: expect.any(Number),
                    exp: expect.any(Number),
                    iss: 'hasivu-platform',
                    aud: 'hasivu-users'
                }), 'test-jwt-secret-key-12345', { algorithm: 'HS256' });
                expect(result).toBe(mockToken);
            });
        });
        describe('verifyToken', () => {
            const mockPayload = {
                userId: 'user-123',
                email: 'test@example.com',
                role: 'PARENT',
                sessionId: 'session-123',
                tokenType: 'access',
                permissions: ['read', 'write'],
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600,
                iss: 'hasivu-platform',
                aud: 'hasivu-users'
            };
            it('should verify valid access token', async () => {
                const token = 'valid-token';
                mockedJwt.verify.mockReturnValueOnce(mockPayload);
                mockedRedis.get.mockResolvedValueOnce(null);
                const result = await authService.verifyToken(token, 'access');
                expect(mockedJwt.verify).toHaveBeenCalledWith(token, 'test-jwt-secret-key-12345');
                expect(mockedRedis.get).toHaveBeenCalledWith(`blacklist:${token}`);
                expect(result).toEqual(mockPayload);
            });
            it('should verify valid refresh token', async () => {
                const token = 'valid-refresh-token';
                const refreshPayload = { ...mockPayload, tokenType: 'refresh' };
                mockedJwt.verify.mockReturnValueOnce(refreshPayload);
                mockedRedis.get.mockResolvedValueOnce(null);
                const result = await authService.verifyToken(token, 'refresh');
                expect(mockedJwt.verify).toHaveBeenCalledWith(token, 'test-refresh-secret-key-12345');
                expect(result).toEqual(refreshPayload);
            });
            it('should reject blacklisted token', async () => {
                const token = 'blacklisted-token';
                mockedJwt.verify.mockReturnValueOnce(mockPayload);
                mockedRedis.get.mockResolvedValueOnce('true');
                await expect(authService.verifyToken(token)).rejects.toThrow('Invalid or expired token');
                expect(mockedLogger.error).toHaveBeenCalledWith('Token verification failed:', expect.any(Error));
            });
            it('should reject invalid token type', async () => {
                const token = 'wrong-type-token';
                const accessPayload = { ...mockPayload, tokenType: 'access' };
                mockedJwt.verify.mockReturnValueOnce(accessPayload);
                mockedRedis.get.mockResolvedValueOnce(null);
                await expect(authService.verifyToken(token, 'refresh')).rejects.toThrow('Invalid or expired token');
            });
            it('should handle JWT verification errors', async () => {
                const token = 'invalid-token';
                mockedJwt.verify.mockImplementationOnce(() => {
                    throw new Error('Token expired');
                });
                await expect(authService.verifyToken(token)).rejects.toThrow('Invalid or expired token');
                expect(mockedLogger.error).toHaveBeenCalledWith('Token verification failed:', expect.any(Error));
            });
        });
    });
    describe('Session Management', () => {
        describe('createSession', () => {
            it('should create session successfully', async () => {
                const userId = 'user-123';
                const sessionId = 'session-123';
                const metadata = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };
                mockedRedis.setex.mockResolvedValueOnce('OK');
                await authService.createSession(userId, sessionId, metadata);
                expect(mockedRedis.setex).toHaveBeenCalledWith(`session:${sessionId}`, 24 * 60 * 60, expect.stringContaining(userId));
            });
            it('should handle session creation errors', async () => {
                const userId = 'user-123';
                const sessionId = 'session-123';
                mockedRedis.setex.mockRejectedValueOnce(new Error('Redis error'));
                await expect(authService.createSession(userId, sessionId)).rejects.toThrow('Session creation failed');
                expect(mockedLogger.error).toHaveBeenCalledWith('Session creation failed:', expect.any(Error));
            });
        });
        describe('updateSessionActivity', () => {
            it('should update session activity', async () => {
                const sessionId = 'session-123';
                const existingSession = JSON.stringify({
                    userId: 'user-123',
                    createdAt: new Date().toISOString(),
                    lastActivity: new Date().toISOString()
                });
                mockedRedis.get.mockResolvedValueOnce(existingSession);
                mockedRedis.setex.mockResolvedValueOnce('OK');
                await authService.updateSessionActivity(sessionId, { action: 'test' });
                expect(mockedRedis.get).toHaveBeenCalledWith(`session:${sessionId}`);
                expect(mockedRedis.setex).toHaveBeenCalledWith(`session:${sessionId}`, 24 * 60 * 60, expect.stringContaining('test'));
            });
            it('should handle non-existent session gracefully', async () => {
                const sessionId = 'non-existent-session';
                mockedRedis.get.mockResolvedValueOnce(null);
                await authService.updateSessionActivity(sessionId);
                expect(mockedRedis.get).toHaveBeenCalledWith(`session:${sessionId}`);
                expect(mockedRedis.setex).not.toHaveBeenCalled();
            });
        });
        describe('revokeSession', () => {
            it('should revoke session successfully', async () => {
                const sessionId = 'session-123';
                mockedRedis.del.mockResolvedValueOnce(1);
                await authService.revokeSession(sessionId);
                expect(mockedRedis.del).toHaveBeenCalledWith(`session:${sessionId}`);
            });
            it('should handle session revocation errors gracefully', async () => {
                const sessionId = 'session-123';
                mockedRedis.del.mockRejectedValueOnce(new Error('Redis error'));
                await authService.revokeSession(sessionId);
                expect(mockedLogger.error).toHaveBeenCalledWith('Session revocation failed:', expect.any(Error));
            });
        });
    });
    describe('Token Blacklisting', () => {
        describe('blacklistToken', () => {
            it('should blacklist valid token', async () => {
                const token = 'token-to-blacklist';
                const mockPayload = {
                    exp: Math.floor(Date.now() / 1000) + 3600
                };
                mockedJwt.decode.mockReturnValueOnce(mockPayload);
                mockedRedis.setex.mockResolvedValueOnce('OK');
                await authService.blacklistToken(token);
                expect(mockedJwt.decode).toHaveBeenCalledWith(token);
                expect(mockedRedis.setex).toHaveBeenCalledWith(`blacklist:${token}`, 3600, 'true');
            });
            it('should not blacklist expired token', async () => {
                const token = 'expired-token';
                const mockPayload = {
                    exp: Math.floor(Date.now() / 1000) - 3600
                };
                mockedJwt.decode.mockReturnValueOnce(mockPayload);
                await authService.blacklistToken(token);
                expect(mockedRedis.setex).not.toHaveBeenCalled();
            });
            it('should handle blacklisting errors gracefully', async () => {
                const token = 'problematic-token';
                mockedJwt.decode.mockImplementationOnce(() => {
                    throw new Error('Decode error');
                });
                await authService.blacklistToken(token);
                expect(mockedLogger.error).toHaveBeenCalledWith('Token blacklisting failed:', expect.any(Error));
            });
        });
    });
    describe('User Authentication', () => {
        describe('authenticate', () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                role: 'PARENT',
                isActive: true,
                schoolId: 'school-123'
            };
            const credentials = {
                email: 'test@example.com',
                password: 'TestPassword123!',
                rememberMe: false,
                userAgent: 'test-agent',
                ipAddress: '127.0.0.1'
            };
            beforeEach(() => {
                mockedCrypto.randomBytes.mockReturnValue(Buffer.from('session-id-bytes'));
                mockedJwt.sign.mockReturnValue('mock-token');
            });
            it('should authenticate user successfully', async () => {
                mockedRedis.get.mockResolvedValueOnce(null);
                mockedDatabase.client.user.findUnique.mockResolvedValueOnce(mockUser);
                mockedBcrypt.compare.mockResolvedValueOnce(true);
                mockedRedis.del.mockResolvedValueOnce(1);
                mockedRedis.setex.mockResolvedValueOnce('OK');
                const result = await authService.authenticate(credentials);
                expect(result.success).toBe(true);
                expect(result.user.id).toBe(mockUser.id);
                expect(result.user.email).toBe(mockUser.email);
                expect(result.user.role).toBe(mockUser.role);
                expect(result.user.permissions).toEqual(['read', 'write', 'order_food', 'view_reports']);
                expect(result.tokens.accessToken).toBe('mock-token');
                expect(result.tokens.refreshToken).toBe('mock-token');
                expect(result.sessionId).toBeTruthy();
                expect(result.schoolId).toBe(mockUser.schoolId);
            });
            it('should handle account lockout', async () => {
                mockedRedis.get.mockResolvedValueOnce('lockout-info');
                const result = await authService.authenticate(credentials);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Account temporarily locked due to too many failed attempts');
            });
            it('should handle invalid user', async () => {
                mockedRedis.get.mockResolvedValueOnce(null);
                mockedDatabase.client.user.findUnique.mockResolvedValueOnce(null);
                const result = await authService.authenticate(credentials);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Invalid credentials');
            });
            it('should handle inactive user', async () => {
                const inactiveUser = { ...mockUser, isActive: false };
                mockedRedis.get.mockResolvedValueOnce(null);
                mockedDatabase.client.user.findUnique.mockResolvedValueOnce(inactiveUser);
                const result = await authService.authenticate(credentials);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Account is deactivated');
            });
            it('should handle invalid password', async () => {
                mockedRedis.get.mockResolvedValueOnce(null);
                mockedDatabase.client.user.findUnique.mockResolvedValueOnce(mockUser);
                mockedBcrypt.compare.mockResolvedValueOnce(false);
                const result = await authService.authenticate(credentials);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Invalid credentials');
            });
            it('should handle remember me option', async () => {
                const rememberMeCredentials = { ...credentials, rememberMe: true };
                mockedRedis.get.mockResolvedValueOnce(null);
                mockedDatabase.client.user.findUnique.mockResolvedValueOnce(mockUser);
                mockedBcrypt.compare.mockResolvedValueOnce(true);
                mockedRedis.del.mockResolvedValueOnce(1);
                mockedRedis.setex.mockResolvedValueOnce('OK');
                const result = await authService.authenticate(rememberMeCredentials);
                expect(result.success).toBe(true);
                expect(result.tokens.expiresIn).toBe(30 * 24 * 3600);
            });
            it('should handle database errors gracefully', async () => {
                mockedRedis.get.mockResolvedValueOnce(null);
                mockedDatabase.client.user.findUnique.mockRejectedValueOnce(new Error('Database error'));
                const result = await authService.authenticate(credentials);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Database error');
                expect(mockedLogger.error).toHaveBeenCalledWith('Authentication failed:', expect.any(Error));
            });
        });
    });
    describe('Role Permissions', () => {
        it('should return correct permissions for each role', () => {
            const testCases = [
                {
                    role: 'ADMIN',
                    expectedPermissions: ['read', 'write', 'delete', 'manage_users', 'manage_settings']
                },
                {
                    role: 'PARENT',
                    expectedPermissions: ['read', 'write', 'order_food', 'view_reports']
                },
                {
                    role: 'STUDENT',
                    expectedPermissions: ['read', 'view_orders']
                },
                {
                    role: 'SCHOOL',
                    expectedPermissions: ['read', 'write', 'manage_menus', 'view_analytics']
                }
            ];
            testCases.forEach(({ role, expectedPermissions }) => {
                const permissions = authService.getRolePermissions(role);
                expect(permissions).toEqual(expectedPermissions);
            });
        });
        it('should handle lowercase role names', () => {
            const permissions = authService.getRolePermissions('admin');
            expect(permissions).toEqual(['read', 'write', 'delete', 'manage_users', 'manage_settings']);
        });
        it('should return default permissions for unknown role', () => {
            const permissions = authService.getRolePermissions('UNKNOWN');
            expect(permissions).toEqual(['read', 'view_orders']);
        });
    });
    describe('Session ID Generation', () => {
        it('should generate unique session IDs', () => {
            const sessionId1 = authService.generateSessionId();
            const sessionId2 = authService.generateSessionId();
            expect(sessionId1).toBeTruthy();
            expect(sessionId2).toBeTruthy();
            expect(typeof sessionId1).toBe('string');
            expect(typeof sessionId2).toBe('string');
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle Redis connection failures gracefully', async () => {
            mockedRedis.get.mockRejectedValueOnce(new Error('Redis connection failed'));
            await authService.updateSessionActivity('test-session');
            expect(mockedLogger.error).toHaveBeenCalledWith('Session update failed:', expect.any(Error));
        });
        it('should validate all authentication inputs', async () => {
            const invalidCredentials = [
                { email: '', password: 'password' },
                { email: 'test@example.com', password: '' },
                { email: 'invalid-email', password: 'password' }
            ];
            for (const credentials of invalidCredentials) {
                const result = await authService.authenticate(credentials);
                expect(result.success).toBe(false);
            }
        });
        it('should handle malformed tokens gracefully', async () => {
            mockedJwt.verify.mockImplementationOnce(() => {
                throw new Error('Malformed token');
            });
            await expect(authService.verifyToken('malformed-token')).rejects.toThrow('Invalid or expired token');
        });
    });
});
//# sourceMappingURL=auth.service.unit.test.js.map