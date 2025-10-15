/**
 * Lambda Authentication Middleware
 * JWT authentication middleware for Lambda functions
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { authService } from '../../services/auth.service';

export interface AuthenticatedEvent {
  headers: {
    authorization?: string;
    [key: string]: string | undefined;
  };
  requestContext?: {
    authorizer?: {
      userId?: string;
      email?: string;
      role?: string;
    };
  };
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

export interface AuthMiddlewareResult {
  success: boolean;
  userId?: string;
  id?: string;
  email?: string;
  role?: string;
  user?: AuthenticatedUser;
  error?: {
    code: string;
    message: string;
  };
}

export async function authenticateRequest(event: any): Promise<AuthMiddlewareResult> {
  try {
    // Check for authorization header
    const authHeader = event.headers?.authorization || event.headers?.Authorization;

    if (!authHeader) {
      return {
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization header is required',
        },
      };
    }

    // Extract token from Bearer scheme
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must use Bearer scheme',
        },
      };
    }

    const token = parts[1];

    // Verify token
    const payload = await authService.verifyToken(token, 'access');

    if (!payload) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      };
    }

    const user: AuthenticatedUser = {
      id: payload.userId,
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    return {
      success: true,
      userId: payload.userId,
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: error instanceof Error ? error.message : 'Authentication failed',
      },
    };
  }
}

export async function requireAuth(event: APIGatewayProxyEvent): Promise<AuthMiddlewareResult> {
  const result = await authenticateRequest(event);

  if (!result.success) {
    throw new Error(result.error?.message || 'Authentication failed');
  }

  return result;
}

export function requireRole(allowedRoles: string[]) {
  return async (event: APIGatewayProxyEvent): Promise<AuthMiddlewareResult> => {
    const result = await requireAuth(event);

    if (!result.role || !allowedRoles.includes(result.role)) {
      throw new Error('Insufficient permissions');
    }

    return result;
  };
}

// Aliases for compatibility
export const authenticateLambda = authenticateRequest;

export interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  role: string;
  schoolId?: string;
}
