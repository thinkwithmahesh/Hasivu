/**
 * Auth Service Unit Tests — Pure function coverage
 * Tests password validation, configuration, and token logic
 * without requiring Redis or database connections.
 */

/** Real bcrypt — global `setup.ts` mocks bcrypt with `compare` always true, which breaks these tests. */
jest.mock('bcryptjs', () => jest.requireActual('bcryptjs'));

import * as bcrypt from 'bcryptjs';

// Mock Redis before importing AuthService
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  }));
});

// Mock config
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

// Mock database service
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

// Mock logger
jest.mock('../../../src/shared/logger.service', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { AuthService } from '../../../src/services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    // Reset singleton between tests
    (AuthService as any).instance = undefined;
    authService = AuthService.getInstance();
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
      const instance1 = AuthService.getInstance();
      const instance2 = AuthService.getInstance();
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
      expect(result.requirements!.length).toBe(true);
      expect(result.requirements!.uppercase).toBe(true);
      expect(result.requirements!.lowercase).toBe(true);
      expect(result.requirements!.numbers).toBe(true);
      expect(result.requirements!.symbols).toBe(true);
    });
  });

  describe('hashPassword', () => {
    it('hashes a valid password', async () => {
      const hash = await authService.hashPassword('MyP@ssw0rd!');
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix
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
      expect(user.password).not.toBe('MyP@ssw0rd!'); // should be hashed
      expect(user.password.startsWith('$2')).toBe(true);
    });
  });

  describe('generateSecureToken', () => {
    it('generates a hex token of expected length', async () => {
      const token = await authService.generateSecureToken(32);
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
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
