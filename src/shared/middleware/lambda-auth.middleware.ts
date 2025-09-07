 /**
 * HASIVU Platform - Lambda Authentication Middleware
 * JWT token validation for serverless functions
 * Production-ready implementation with comprehensive error handling
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../../functions/shared/logger.service';

// Initialize database client
const prisma = new PrismaClient();
const logger = LoggerService.getInstance();

// JWT Secret from environment variables
const jwtSecret = process.env.JWT_SECRET || 'hasivu-default-secret-key';

/**
 * Authenticated user interface
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
  permissions: string[];
  sessionId: string;
}

/**
 * Authentication result interface
 */
export interface AuthenticationResult {
  success: boolean;
  userId?: string;
  user?: AuthenticatedUser;
  error?: string;
  schoolId?: string;
  // Flattened user properties for backward compatibility
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: string[];
  sessionId?: string;
}

/**
 * Authentication middleware options
 */
export interface AuthMiddlewareOptions {
  roles?: string[];
  permissions?: string[];
  schoolRequired?: boolean;
  optional?: boolean;
}

/**
 * Extract JWT token from Lambda event
 */
function extractToken(event: APIGatewayProxyEvent): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check query parameters (for WebSocket/URL-based auth)
  if (event.queryStringParameters && event.queryStringParameters.token) {
    return event.queryStringParameters.token;
  }

  // Check cookies if present
  const cookies = event.headers.Cookie || event.headers.cookie;
  if (cookies) {
    const tokenMatch = cookies.match(/token=([^;]+)/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  }

  return null;
}

/**
 * Verify JWT token and validate session
 */
async function verifyAndValidateToken(token: string): Promise<AuthenticatedUser> {
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    if (!decoded.userId || !decoded.sessionId || !decoded.email || !decoded.role) {
      throw new Error('Invalid token payload');
    }

    // Validate session in database
    const session = await prisma.authSession.findUnique({
      where: { id: decoded.sessionId },
      include: {
        user: {
          include: {
            userRoleAssignments: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.user.isActive) {
      throw new Error('User account is inactive');
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Mark session as inactive
      await prisma.authSession.update({
        where: { id: session.id },
        data: { isActive: false }
      });
      throw new Error('Session expired');
    }

    // Extract permissions from role assignments (simplified for demo)
    const permissions = session.user.userRoleAssignments.map(
      (assignment) => assignment.role.name
    );

    // Update session activity
    await prisma.authSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() }
    });

    return {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      role: decoded.role,
      schoolId: session.user.schoolId || undefined,
      permissions,
      sessionId: session.id
    };

  } catch (error) {
    throw new Error(`Token validation failed: ${(error as Error).message}`);
  }
}

/**
 * Check role-based authorization
 */
function checkRoleAuthorization(user: AuthenticatedUser, requiredRoles?: string[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  return requiredRoles.includes(user.role);
}

/**
 * Check permission-based authorization
 */
function checkPermissionAuthorization(user: AuthenticatedUser, requiredPermissions?: string[]): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  return requiredPermissions.some(permission => user.permissions.includes(permission));
}

/**
 * Check school context requirement
 */
function checkSchoolContext(user: AuthenticatedUser, schoolRequired?: boolean): boolean {
  if (!schoolRequired) {
    return true;
  }
  return !!user.schoolId;
}

/**
 * Create authentication error response
 */
function createAuthErrorResponse(
  message: string,
  statusCode: number = 401,
  code: string = 'UNAUTHORIZED'
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      error: message,
      code,
      meta: {
        timestamp: new Date().toISOString()
      }
    })
  };
}

/**
 * Main Lambda authentication middleware
 * Returns authentication result with success status, user data, and error information
 */
export async function authenticateLambda(
  event: APIGatewayProxyEvent,
  options: AuthMiddlewareOptions = {}
): Promise<AuthenticationResult> {
  const startTime = Date.now();
  
  try {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
      throw new Error('OPTIONS requests should be handled before authentication');
    }

    // Extract token from request
    const token = extractToken(event);
    
    if (!token) {
      if (options.optional) {
        const anonymousUser = { id: '', email: '', firstName: '', lastName: '', role: 'anonymous', permissions: [], sessionId: '' };
        return {
          success: true,
          userId: '',
          user: anonymousUser,
          schoolId: undefined,
          // Flattened user properties for backward compatibility
          id: '',
          email: '',
          firstName: '',
          lastName: '',
          role: 'anonymous',
          permissions: [],
          sessionId: ''
        };
      }
      logger.warn('Authentication failed - no token provided', {
        path: event.path,
        method: event.httpMethod
      });
      throw new Error('Authentication token required');
    }

    // Verify token and get user data
    const user = await verifyAndValidateToken(token);
    
    // Check role-based authorization
    if (!checkRoleAuthorization(user, options.roles)) {
      logger.warn('Authorization failed - insufficient role', {
        userId: user.id,
        userRole: user.role,
        requiredRoles: options.roles
      });
      throw new Error(`Access denied. Required role: ${options.roles?.join(' or ')}`);
    }
    
    // Check permission-based authorization
    if (!checkPermissionAuthorization(user, options.permissions)) {
      logger.warn('Authorization failed - insufficient permissions', {
        userId: user.id,
        userPermissions: user.permissions,
        requiredPermissions: options.permissions
      });
      throw new Error(`Access denied. Required permission: ${options.permissions?.join(' or ')}`);
    }
    
    // Check school context requirement
    if (!checkSchoolContext(user, options.schoolRequired)) {
      logger.warn('Authorization failed - school context required', {
        userId: user.id,
        hasSchoolId: !!user.schoolId
      });
      throw new Error('School context required for this operation');
    }
    
    const duration = Date.now() - startTime;
    logger.debug('Authentication successful', {
      userId: user.id,
      role: user.role,
      schoolId: user.schoolId,
      authDuration: `${duration}ms`
    });
    
    return {
      success: true,
      userId: user.id,
      user: user,
      schoolId: user.schoolId,
      // Flattened user properties for backward compatibility
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      sessionId: user.sessionId
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Authentication failed', error, {
      path: event.path,
      method: event.httpMethod,
      authDuration: `${duration}ms`
    });
    
    return {
      success: false,
      error: error.message || 'Authentication failed'
    };
  } finally {
    // Don't disconnect Prisma here as it may be reused in the same Lambda execution
  }
}