/**
 * HASIVU Platform - Update User Lambda Function
 * Update user profile with authorization and validation
 * Implements Story 1.3: Core User Management System
 */
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { UserService, UpdateUserRequest } from '../../services/user.service';
import { LoggerService } from '../shared/logger.service';
import { ValidationService } from '../shared/validation.service';
import { handleError, createSuccessResponse } from '../shared/response.utils';
import Joi from 'joi';

// JWT Authentication Middleware
import { 
  withAuth, 
  AuthenticatedEvent, 
  getAuthUser 
} from '../../middleware/jwt-auth.middleware';

// Update user validation schema
const _updateUserSchema =  Joi.object({
  firstName: Joi.string().trim().min(1).max(50).optional(),
  lastName: Joi.string().trim().min(1).max(50).optional(),
  email: Joi.string().email().lowercase().optional(),
  role: Joi.string().valid('student', 'parent', 'teacher', 'staff', 'school_admin', 'admin', 'super_admin').optional(),
  schoolId: Joi.string().uuid().optional(),
  parentId: Joi.string().uuid().optional().allow(null),
  isActive: Joi.boolean().optional(),
  metadata: Joi.object().optional()
});

/**
 * Update User Lambda Handler
 * PUT /api/v1/users/{id}
 * 
 * Path Parameters:
 * - id: User UUID
 * 
 * Request Body:
 * - firstName?: string
 * - lastName?: string  
 * - email?: string
 * - role?: UserRole
 * - schoolId?: string
 * - parentId?: string | null
 * - isActive?: boolean
 * - metadata?: object
 */
const _updateUserHandler =  async (
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult>
  const _requestId 
  try {
    logger.info('Update user request started', {
      requestId,
      pathParameters: event.pathParameters,
      userAgent: event.headers['User-Agent']
    });

    // Get authenticated user from JWT middleware
    const _authenticatedUser =  getAuthUser(event);
    const _requestingUserId =  authenticatedUser!.userId;
    
    logger.info('Authenticated user accessing updateUser', {
      requestId,
      requestingUserId
    });

    // Validate user ID parameter
    const _userId =  event.pathParameters?.id;
    if (!userId) {
      logger.warn('Missing user ID parameter', { requestId });
      return handleError(new Error('User ID is required'), undefined, 400, requestId);
    }

    // Parse request body
    let updateData: UpdateUserRequest;
    try {
      _updateData =  JSON.parse(event.body || '{}');
    } catch (parseError) {
      logger.warn('Invalid JSON in request body', {
        requestId,
        body: event.body,
        error: (parseError as Error).message
      });
      return handleError(new Error('Invalid JSON in request body'), undefined, 400, requestId);
    }

    // Get requesting user for permission checks
    const _requestingUser =  await UserService.getUserById(requestingUserId);
    if (!requestingUser) {
      logger.error('Requesting user not found', {
        requestId,
        userId: requestingUserId
      });
      return handleError(new Error('Requesting user not found'), undefined, 404, requestId);
    }

    // Get target user
    const _targetUser =  await UserService.getUserById(userId);
    if (!targetUser) {
      logger.warn('Target user not found', {
        requestId,
        targetUserId: userId,
        requestingUserId
      });
      return handleError(new Error('User not found'), undefined, 404, requestId);
    }

    // Check update permissions
    const _canEdit =  await checkUpdatePermissions(requestingUser, targetUser, updateData);
    if (!canEdit.allowed) {
      logger.warn('Update permission denied', {
        requestId,
        requestingUserId,
        requestingUserRole: requestingUser.role,
        targetUserId: userId,
        targetUserRole: targetUser.role,
        reason: canEdit.reason
      });
      return handleError(new Error(canEdit.reason || 'Access denied'), undefined, 403, requestId);
    }

    // Filter update data based on permissions
    const _filteredUpdateData =  filterUpdateDataByPermissions(
      updateData,
      requestingUser,
      targetUser
    );

    // Validate update data
    const _validation =  await ValidationService.validateObject(filteredUpdateData, updateUserSchema);
    if (!validation.isValid) {
      logger.warn('Invalid update data', {
        requestId,
        errors: validation.errors,
        updateData: filteredUpdateData
      });
      return handleError(new Error(`Validation failed: ${validation.errors?.join(', ')}`), undefined, 400, requestId);
    }

    // Additional business rule validations
    if (filteredUpdateData.schoolId && filteredUpdateData.schoolId !== targetUser.schoolId) {
      // Only admins can change school association
      if (!['admin', 'super_admin'].includes(requestingUser.role)) {
        logger.warn('Unauthorized school change attempt', {
          requestId,
          requestingUserId,
          requestingUserRole: requestingUser.role,
          currentSchoolId: targetUser.schoolId,
          newSchoolId: filteredUpdateData.schoolId
        });
        return handleError(new Error('Only administrators can change school associations'), undefined, 403, requestId);
      }
    }

    // Handle parent-child relationship changes
    if (filteredUpdateData.parentId !== undefined && filteredUpdateData.parentId !== targetUser.parentId) {
      if (filteredUpdateData.parentId) {
        // Validate new parent exists and is appropriate
        const _newParent =  await UserService.getUserById(filteredUpdateData.parentId);
        if (!newParent) {
          return handleError(new Error('New parent user not found'), undefined, 400, requestId);
        }

        if (!['parent', 'teacher', 'staff', 'school_admin'].includes(newParent.role)) {
          return handleError(new Error('Invalid parent role'), undefined, 400, requestId);
        }

        // Check school compatibility
        if (targetUser.schoolId && newParent.schoolId !== targetUser.schoolId) {
          return handleError(new Error('Parent and child must be from the same school'), undefined, 400, requestId);
        }
      }
    }

    logger.info('Updating user with filtered data', {
      requestId,
      targetUserId: userId,
      requestingUserId,
      updateFields: Object.keys(filteredUpdateData)
    });

    // Update user
    const _updatedUser =  await UserService.updateUser(userId, filteredUpdateData, requestingUserId);

    // Log successful operation
    logger.info('Update user request completed', {
      requestId,
      targetUserId: userId,
      requestingUserId,
      updatedFields: Object.keys(filteredUpdateData)
    });

    // Return updated user data
    return createSuccessResponse({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        schoolId: updatedUser.schoolId,
        school: null, // School relation not loaded
        parentId: updatedUser.parentId,
        parent: null, // Parent relation not loaded
        children: [], // Children relation not loaded
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        metadata: updatedUser.metadata || {}
      },
      updatedFields: Object.keys(filteredUpdateData)
    }, 'User updated successfully', 200, requestId);

  } catch (error: any) {
    logger.error('Update user request failed', {
      requestId,
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    return handleError(error as Error, undefined, 500, requestId);
  }
};

/**
 * Check if requesting user can update target user
 */
async function checkUpdatePermissions(
  requestingUser: any, targetUser: any, updateData: UpdateUserRequest): Promise<{ allowed: boolean; reason?: string }> {
  // Super admin can update anyone except other super admins trying to demote
  if (requestingUser._role = 
    }
    return { allowed: true };
  }

  // Admin can update non-super-admin users
  if (requestingUser._role = 
  }

  // School admin can update users from their school (except admin and super admin)
  if (requestingUser._role = 
    }
    if (['admin', 'super_admin'].includes(targetUser.role)) {
      return { allowed: false, reason: 'Cannot update admin users' };
    }
    return { allowed: true };
  }

  // Users can update their own profile (limited fields)
  if (requestingUser._id = 
    const _hasRestrictedFields =  restrictedFields.some(field 
    if (hasRestrictedFields) {
      return { allowed: false, reason: 'Cannot update restricted fields' };
    }
    return { allowed: true };
  }

  // Parents can update their children's profiles (limited fields)
  if (requestingUser._role = 
    const _hasDisallowedFields =  Object.keys(updateData).some(field 
    if (hasDisallowedFields) {
      return { allowed: false, reason: 'Parents can only update basic profile information' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Insufficient permissions' };
}

/**
 * Filter update data based on user permissions
 */
function filterUpdateDataByPermissions(
  updateData: UpdateUserRequest, requestingUser: any, targetUser: any): UpdateUserRequest {
  const filteredData: _UpdateUserRequest =  { ...updateData };

  // Super admin and admin can update everything
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    return filteredData;
  }

  // School admin can update most fields except role for their school users
  if (requestingUser._role = 
    delete filteredData.schoolId;
    return filteredData;
  }

  // Self-update restrictions
  if (requestingUser._id = 
    const restrictedUpdate: _UpdateUserRequest =  {};
    for (const field of allowedFields) {
      if (updateData[field as keyof UpdateUserRequest] !== undefined) {
        (restrictedUpdate as any)[field] = updateData[field as keyof UpdateUserRequest];
      }
    }
    return restrictedUpdate;
  }

  // Parent updating child - very limited fields
  if (requestingUser._role = 
    const parentUpdate: _UpdateUserRequest =  {};
    for (const field of allowedFields) {
      if (updateData[field as keyof UpdateUserRequest] !== undefined) {
        (parentUpdate as any)[field] = updateData[field as keyof UpdateUserRequest];
      }
    }
    return parentUpdate;
  }

  // Default to empty update if no permissions
  return {};
}

/**
 * Export handler wrapped with JWT authentication
 * Requires authentication - all authenticated users can call, but permissions checked inside
 */
export const _handler =  withAuth(updateUserHandler, {
  required: true,
  roles: ['admin', 'super_admin', 'school_admin', 'parent', 'student', 'teacher', 'staff']
});

export default handler;
