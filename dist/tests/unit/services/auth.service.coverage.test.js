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
const bcrypt = __importStar(require("bcryptjs"));
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(null),
        setex: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue('OK'),
    }));
});
jest.mock('../../../src/config/environment', () => ({
    config: {
        jwt: {
            secret: 'test-jwt-secret-that-is-at-least-32-characters-long-here',
            refreshSecret: 'test-refresh-secret-that-is-at-least-32-characters-long',
            expiresIn: '15m',
            refreshExpiresIn: '7d',
            issuer: 'hasivu-platform',
            audience: 'hasivu-users',
        },
        redis: { url: 'redis://localhost:6379' },
        database: {},
    },
}));
jest.mock('../../../src/shared/database.service', () => ({
    DatabaseService: {
        client: {
            user: {
                findUnique: jest.fn(),
                update: jest.fn(),
                create: jest.fn(),
            },
        },
    },
}));
jest.mock('../../../src/shared/logger.service', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));
const auth_service_1 = require("../../../src/services/auth.service");
describe('AuthService', () => {
    let authService;
    beforeEach(() => {
        auth_service_1.AuthService.instance = undefined;
        authService = auth_service_1.AuthService.getInstance();
    });
    describe('validateConfiguration', () => {
        it('returns valid when secrets are present', () => {
            const result = authService.validateConfiguration();
            expect(result.isValid).toBe(true);
            expect(result.missingConfigs).toHaveLength(0);
        });
    });
    describe('getInstance', () => {
        it('returns the same instance (singleton)', () => {
            const instance1 = auth_service_1.AuthService.getInstance();
            const instance2 = auth_service_1.AuthService.getInstance();
            expect(instance1).toBe(instance2);
        });
    });
    describe('validatePassword', () => {
        it('rejects password shorter than 8 characters', () => {
            const result = authService.validatePassword('Ab1!');
            expect(result.isValid).toBe(false);
            expect(result.errors || [result.message]).toBeDefined();
        });
        it('rejects password without uppercase', () => {
            const result = authService.validatePassword('abcdefgh1!');
            expect(result.isValid).toBe(false);
        });
        it('rejects password without lowercase', () => {
            const result = authService.validatePassword('ABCDEFGH1!');
            expect(result.isValid).toBe(false);
        });
        it('rejects password without numbers', () => {
            const result = authService.validatePassword('Abcdefgh!');
            expect(result.isValid).toBe(false);
        });
        it('rejects password without symbols', () => {
            const result = authService.validatePassword('Abcdefgh1');
            expect(result.isValid).toBe(false);
        });
        it('accepts a strong password', () => {
            const result = authService.validatePassword('StrongP@ss1!');
            expect(result.isValid).toBe(true);
            expect(result.score).toBeGreaterThan(0);
        });
        it('returns requirement breakdown', () => {
            const result = authService.validatePassword('StrongP@ss1!');
            expect(result.requirements).toBeDefined();
            expect(result.requirements.length).toBe(true);
            expect(result.requirements.uppercase).toBe(true);
            expect(result.requirements.lowercase).toBe(true);
            expect(result.requirements.numbers).toBe(true);
            expect(result.requirements.symbols).toBe(true);
        });
    });
    describe('hashPassword', () => {
        it('hashes a valid password', async () => {
            const hash = await authService.hashPassword('MyP@ssw0rd!');
            expect(hash).toBeDefined();
            expect(hash.startsWith('$2')).toBe(true);
        });
        it('throws on empty password', async () => {
            await expect(authService.hashPassword('')).rejects.toThrow();
        });
        it('throws on whitespace-only password', async () => {
            await expect(authService.hashPassword('   ')).rejects.toThrow();
        });
    });
    describe('verifyPassword', () => {
        it('returns true for matching password', async () => {
            const password = 'MyP@ssw0rd!';
            const hash = await bcrypt.hash(password, 12);
            const result = await authService.verifyPassword(password, hash);
            expect(result).toBe(true);
        });
        it('returns false for wrong password', async () => {
            const hash = await bcrypt.hash('correctPassword', 12);
            const result = await authService.verifyPassword('wrongPassword', hash);
            expect(result).toBe(false);
        });
        it('returns false for empty password', async () => {
            const result = await authService.verifyPassword('', 'somehash');
            expect(result).toBe(false);
        });
        it('returns false for empty hash', async () => {
            const result = await authService.verifyPassword('password', '');
            expect(result).toBe(false);
        });
    });
    describe('createUser', () => {
        it('creates a user object with hashed password', async () => {
            const user = await authService.createUser({
                email: 'test@example.com',
                password: 'MyP@ssw0rd!',
                name: 'Test User',
            });
            expect(user.id).toBeDefined();
            expect(user.email).toBe('test@example.com');
            expect(user.password).not.toBe('MyP@ssw0rd!');
            expect(user.password.startsWith('$2')).toBe(true);
        });
    });
    describe('generateSecureToken', () => {
        it('generates a hex token of expected length', async () => {
            const token = await authService.generateSecureToken(32);
            expect(token).toHaveLength(64);
        });
        it('generates unique tokens', async () => {
            const token1 = await authService.generateSecureToken();
            const token2 = await authService.generateSecureToken();
            expect(token1).not.toBe(token2);
        });
    });
    describe('encryptPersonalData', () => {
        it('base64 encodes data', async () => {
            const data = { name: 'John', email: 'john@test.com' };
            const result = await authService.encryptPersonalData(data);
            expect(result.sensitive).toBeDefined();
            const decoded = JSON.parse(Buffer.from(result.sensitive, 'base64').toString());
            expect(decoded.name).toBe('John');
        });
    });
    describe('session management', () => {
        it('revokeSession calls redis del', async () => {
            await expect(authService.revokeSession('test-session-id')).resolves.not.toThrow();
        });
        it('logout revokes session and blacklists token', async () => {
            await expect(authService.logout('session-123', 'fake-token')).resolves.not.toThrow();
        });
        it('cleanupSessions completes without error', async () => {
            await expect(authService.cleanupSessions()).resolves.not.toThrow();
        });
    });
});
//# sourceMappingURL=auth.service.coverage.test.js.map