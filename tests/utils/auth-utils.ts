/**
 * Authentication Utilities for Testing
 */

import jwt from 'jsonwebtoken';

export interface AuthTestUtils {
  generateTestToken: (payload?: any) => string;
  generateTestUser: () => any;
  createTestAuthHeader: (token?: string) => string;
  mockAuthMiddleware: () => any;
}

/**
 * Create authentication test utilities
 */
export function createAuthTestUtils(): AuthTestUtils {
  return {
    generateTestToken: (payload: any = {}) => {
      const defaultPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const tokenPayload = { ...defaultPayload, ...payload };

      return jwt.sign(tokenPayload, 'test-secret-key');
    },

    generateTestUser: () => {
      return {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        schoolId: 'test-school-id',
        isActive: true
      };
    },

    createTestAuthHeader: (token?: string) => {
      const authToken = token || createAuthTestUtils().generateTestToken();
      return `Bearer ${authToken}`;
    },

    mockAuthMiddleware: () => {
      return (req: any, res: any, next: any) => {
        req.user = createAuthTestUtils().generateTestUser();
        next();
      };
    }
  };
}

/**
 * Generate test JWT token
 */
export function generateTestJWT(payload?: any): string {
  return createAuthTestUtils().generateTestToken(payload);
}

/**
 * Create mock authenticated request
 */
export function createMockAuthRequest(token?: string) {
  const authHeader = createAuthTestUtils().createTestAuthHeader(token);

  return {
    headers: {
      authorization: authHeader,
      'x-api-key': 'test-api-key'
    },
    user: createAuthTestUtils().generateTestUser()
  };
}

/**
 * Create test user (convenience export)
 */
export function createTestUser(overrides?: any) {
  const utils = createAuthTestUtils();
  const user = utils.generateTestUser();
  return { ...user, ...overrides, token: utils.generateTestToken(user) };
}

/**
 * Generate auth token (convenience export)
 */
export function generateAuthToken(payload?: any) {
  return createAuthTestUtils().generateTestToken(payload);
}