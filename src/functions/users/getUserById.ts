/**
 * HASIVU Platform - Get User By ID Lambda Function
 * Retrieve specific user details with authorization checks
 * Implements Story 1.3: Core User Management System
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { UserService } from '../../services/user.service';
import { LoggerService } from '../shared/logger.service';
import { handleError, createSuccessResponse } from '../shared/response.utils';

/**
 * Get User By ID Lambda Handler
 * GET /api/v1/users/{id}
 * 
 * Path Parameters:
 * - id: User UUID
 * 
 * Query Parameters:
 * - includeAuditLogs: Include audit logs (boolean, default false)
 */
export const getUserByIdHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const logger = LoggerService.getInstance();
  const requestId = context.awsRequestId;

  try {
    logger.info('Get user by ID request started', {
      requestId,
      pathParameters: event.pathParameters,
      userAgent: event.headers['User-Agent']
    });

    // Extract user context from authorizer
    const userContext = event.requestContext.authorizer;
    if (!userContext?.userId) {
      logger.warn('Unauthorized access attempt', { requestId });
      return handleError(new Error('Unauthorized'), undefined, 401, requestId);
    }

    // Validate user ID parameter
    const userId = event.pathParameters?.id;
    if (!userId) {
      logger.warn('Missing user ID parameter', { requestId });
      return handleError(new Error('User ID is required'), undefined, 400, requestId);
    }

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const includeAuditLogs = queryParams.includeAuditLogs === 'true';

    // Get requesting user for permission checks
    const requestingUser = await UserService.getUserById(userContext.userId);
    if (!requestingUser) {
      logger.error('Requesting user not found', {
        requestId,
        userId: userContext.userId
      });
      return handleError(new Error('Requesting user not found'), undefined, 404, requestId);
    }

    // Get target user
    const targetUser = await UserService.getUserById(userId);
    if (!targetUser) {
      logger.warn('Target user not found', {
        requestId,
        targetUserId: userId,
        requestingUserId: userContext.userId
      });
      return handleError(new Error('User not found'), undefined, 404, requestId);
    }

    // Check permissions
    const canViewUser = await checkViewPermissions(requestingUser, targetUser);
    if (!canViewUser) {
      logger.warn('Access denied to user profile', {
        requestId,
        requestingUserId: userContext.userId,
        requestingUserRole: requestingUser.role,
        targetUserId: userId,
        targetUserRole: targetUser.role
      });
      return handleError(new Error('Access denied'), undefined, 403, requestId);
    }

    // Get user audit logs if requesting own profile or admin
    let auditLogs: any[] = [];
    const canViewAuditLogs = (
      requestingUser.id === targetUser.id ||
      ['admin', 'super_admin', 'school_admin'].includes(requestingUser.role)
    ) && includeAuditLogs;

    if (canViewAuditLogs) {
      try {
        auditLogs = await UserService.getUserAuditLogs(userId, 10);
      } catch (auditError) {
        logger.warn('Failed to fetch audit logs', {
          requestId,
          userId,
          error: (auditError as Error).message
        });
        // Continue without audit logs
      }
    }

    logger.info('Get user by ID request completed', {
      requestId,
      requestingUserId: userContext.userId,
      targetUserId: userId,
      includeAuditLogs: canViewAuditLogs
    });

    // Prepare response with appropriate data based on permissions
    const responseData = {
      id: targetUser.id,
      email: targetUser.email,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      role: targetUser.role,
      schoolId: targetUser.schoolId,
      school: null, // School relation not loaded
      parentId: targetUser.parentId,
      parent: null, // Parent relation not loaded
      children: [], // Children relation not loaded
      isActive: targetUser.isActive,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt,
      metadata: targetUser.metadata || {},
      ...(canViewAuditLogs && { auditLogs }),
      permissions: {
        canEdit: await checkEditPermissions(requestingUser, targetUser),
        canDelete: await checkDeletePermissions(requestingUser, targetUser),
        canManageChildren: await checkChildrenManagementPermissions(requestingUser, targetUser)
      }
    };

    // Return response
    return createSuccessResponse(responseData, 'User retrieved successfully', 200, requestId);

  } catch (error) {
    logger.error('Get user by ID request failed', {
      requestId,
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    return handleError(error as Error, undefined, 500, requestId);
  }
};

/**
 * Check if requesting user can view target user
 */
async function checkViewPermissions(requestingUser: any, targetUser: any): Promise<boolean> {
  // Super admin and admin can view anyone
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    return true;
  }

  // School admin can view users from their school
  if (requestingUser.role === 'school_admin' && 
      requestingUser.schoolId === targetUser.schoolId) {
    return true;
  }

  // Users can view their own profile
  if (requestingUser.id === targetUser.id) {
    return true;
  }

  // Parents can view their children
  if (requestingUser.role === 'parent' && targetUser.parentId === requestingUser.id) {
    return true;
  }

  // Children can view their parent
  if (targetUser.role === 'parent' && requestingUser.parentId === targetUser.id) {
    return true;
  }

  // Staff and teachers can view students from their school
  if (['staff', 'teacher'].includes(requestingUser.role) &&
      targetUser.role === 'student' &&
      requestingUser.schoolId === targetUser.schoolId) {
    return true;
  }

  return false;
}

/**
 * Check if requesting user can edit target user
 */
async function checkEditPermissions(requestingUser: any, targetUser: any): Promise<boolean> {
  // Super admin can edit anyone except other super admins
  if (requestingUser.role === 'super_admin' && targetUser.role !== 'super_admin') {
    return true;
  }

  // Admin can edit users except super admins
  if (requestingUser.role === 'admin' && targetUser.role !== 'super_admin') {
    return true;
  }

  // School admin can edit users from their school (except admin and super admin)
  if (requestingUser.role === 'school_admin' &&
      requestingUser.schoolId === targetUser.schoolId &&
      !['admin', 'super_admin'].includes(targetUser.role)) {
    return true;
  }

  // Users can edit their own profile (limited fields)
  if (requestingUser.id === targetUser.id) {
    return true;
  }

  // Parents can edit their children's profiles (limited fields)
  if (requestingUser.role === 'parent' && targetUser.parentId === requestingUser.id) {
    return true;
  }

  return false;
}

/**
 * Check if requesting user can delete target user
 */
async function checkDeletePermissions(requestingUser: any, targetUser: any): Promise<boolean> {
  // Super admin can delete anyone except other super admins
  if (requestingUser.role === 'super_admin' && targetUser.role !== 'super_admin') {
    return true;
  }

  // Admin can delete users except admins and super admins
  if (requestingUser.role === 'admin' &&
      !['admin', 'super_admin'].includes(targetUser.role)) {
    return true;
  }

  // School admin can delete non-admin users from their school
  if (requestingUser.role === 'school_admin' &&
      requestingUser.schoolId === targetUser.schoolId &&
      !['admin', 'super_admin', 'school_admin'].includes(targetUser.role)) {
    return true;
  }

  return false;
}

/**
 * Check if requesting user can manage children for target user
 */
async function checkChildrenManagementPermissions(requestingUser: any, targetUser: any): Promise<boolean> {
  // Super admin and admin can manage anyone's children
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    return true;
  }

  // School admin can manage relationships within their school
  if (requestingUser.role === 'school_admin' &&
      requestingUser.schoolId === targetUser.schoolId) {
    return true;
  }

  // Users can manage their own children relationships if they're a parent
  if (requestingUser.id === targetUser.id &&
      ['parent', 'teacher', 'staff', 'school_admin'].includes(targetUser.role)) {
    return true;
  }

  return false;
}

export default getUserByIdHandler;