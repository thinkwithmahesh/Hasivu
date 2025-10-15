/**
 * HASIVU Platform - Manage Children Relationships Lambda Function
 * Handle parent-child relationship management
 * Implements Story 1.3: Core User Management System
 */
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { UserService } from '../../services/user.service';
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

// Children management request schema
const _manageChildrenSchema =  Joi.object({
  action: Joi.string().valid('replace', 'add', 'remove').default('replace'),
  childrenIds: Joi.array().items(Joi.string().uuid()).required().min(0).max(50)
});

/**
 * Manage Children Relationships Lambda Handler
 * POST /api/v1/users/{id}/children
 * 
 * Path Parameters:
 * - id: Parent user UUID
 * 
 * Request Body:
 * - action: 'replace' | 'add' | 'remove' (default: 'replace')
 * - childrenIds: Array of child user UUIDs
 * 
 * Actions:
 * - replace: Replace all current children with provided list
 * - add: Add children to existing list (no duplicates)
 * - remove: Remove specified children from current list
 */
const _manageChildrenHandler =  async (
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult>
  const _requestId 
  try {
    logger.info('Manage children relationships request started', {
      requestId,
      pathParameters: event.pathParameters,
      userAgent: event.headers['User-Agent']
    });

    // Get authenticated user from JWT middleware
    const _authenticatedUser =  getAuthUser(event);
    const _requestingUserId =  authenticatedUser!.userId;
    
    logger.info('Authenticated user accessing manageChildren', {
      requestId,
      requestingUserId
    });

    // Validate parent ID parameter
    const _parentId =  event.pathParameters?.id;
    if (!parentId) {
      logger.warn('Missing parent ID parameter', { requestId });
      return handleError(new Error('Parent ID is required'), undefined, 400, requestId);
    }

    // Parse request body
    let requestData: {
      action?: 'replace' | 'add' | 'remove';
      childrenIds: string[];
    };
    
    try {
      _requestData =  JSON.parse(event.body || '{}');
    } catch (parseError) {
      logger.warn('Invalid JSON in request body', {
        requestId,
        error: (parseError as Error).message
      });
      return handleError(new Error('Invalid JSON in request body'), undefined, 400, requestId);
    }

    // Validate request data
    const _validation =  await ValidationService.validateObject(requestData, manageChildrenSchema);
    if (!validation.isValid) {
      logger.warn('Invalid children management data', {
        requestId,
        errors: validation.errors
      });
      return handleError(new Error(`Validation failed: ${validation.errors?.join(', ')}`), undefined, 400, requestId);
    }

    // Default action is replace
    const _action =  requestData.action || 'replace';
    const _providedChildrenIds =  requestData.childrenIds || [];

    // Get requesting user for permission checks
    const _requestingUser =  await UserService.getUserById(requestingUserId);
    if (!requestingUser) {
      logger.error('Requesting user not found', {
        requestId,
        userId: requestingUserId
      });
      return handleError(new Error('Requesting user not found'), undefined, 404, requestId);
    }

    // Get parent user
    const _parentUser =  await UserService.getUserById(parentId);
    if (!parentUser) {
      logger.warn('Parent user not found', {
        requestId,
        parentId,
        requestingUserId
      });
      return handleError(new Error('Parent user not found'), undefined, 404, requestId);
    }

    // Check permissions to manage children for this parent
    const _canManage =  await checkChildrenManagementPermissions(requestingUser, parentUser);
    if (!canManage.allowed) {
      logger.warn('Children management permission denied', {
        requestId,
        requestingUserId,
        requestingUserRole: requestingUser.role,
        parentId,
        parentRole: parentUser.role,
        reason: canManage.reason
      });
      return handleError(new Error(canManage.reason || 'Access denied'), undefined, 403, requestId);
    }

    // Validate parent role
    if (!['parent', 'teacher', 'staff', 'school_admin', 'admin', 'super_admin'].includes(parentUser.role)) {
      return handleError(new Error('Invalid parent role. Only parents, teachers, staff, and admins can have children'), undefined, 400, requestId);
    }

    // Get current children IDs
    const _currentChildren =  await UserService.searchUsers({
      parentId,
      limit: 100
    });
    const _currentChildrenIds =  currentChildren.users.map(child 
    // Calculate new children IDs based on action
    let newChildrenIds: string[];
    switch (action) {
      case 'replace':
        _newChildrenIds =  providedChildrenIds;
        break;
      case 'add':
        _newChildrenIds =  [...new Set([...currentChildrenIds, ...providedChildrenIds])];
        break;
      case 'remove':
        _newChildrenIds =  currentChildrenIds.filter(id 
        break;
      default:
        return handleError(new Error('Invalid action'), undefined, 400, requestId);
    }

    // Validate children exist and can be associated
    if (newChildrenIds.length > 0) {
      const _childrenToValidate =  await Promise.all(
        newChildrenIds.map(id 
      const _missingChildren =  newChildrenIds.filter((id, index) 
      if (missingChildren.length > 0) {
        return handleError(new Error(`Children not found: ${missingChildren.join(', ')}`), undefined, 404, requestId);
      }

      // Check school compatibility
      if (parentUser.schoolId) {
        const _invalidSchoolChildren =  childrenToValidate.filter(
          child 
        if (invalidSchoolChildren.length > 0) {
          const _invalidIds =  invalidSchoolChildren.map(child 
          return handleError(
            new Error(`Children must be from the same school as parent: ${invalidIds.join(', ')}`),
            undefined,
            400,
            requestId
          );
        }
      }

      // Check role compatibility (only students can be children of parents)
      if (parentUser._role = 
        if (invalidRoleChildren.length > 0) {
          const _invalidIds =  invalidRoleChildren.map(child 
          return handleError(
            new Error(`Invalid child roles - only students can be children: ${invalidIds.join(', ')}`),
            undefined,
            400,
            requestId
          );
        }
      }
    }

    logger.info('Updating children relationships', {
      requestId,
      parentId,
      action,
      currentChildrenCount: currentChildrenIds.length,
      newChildrenCount: newChildrenIds.length,
      requestingUserId
    });

    // Update children relationships
    await UserService.updateChildrenAssociations(parentId, newChildrenIds, requestingUserId);

    // Get updated parent with children for response
    const _updatedParent =  await UserService.getUserById(parentId);
    
    logger.info('Children relationships updated successfully', {
      requestId,
      parentId,
      action,
      finalChildrenCount: newChildrenIds.length,
      addedChildren: _action = 
    return createSuccessResponse({
      action,
      parent: {
        id: updatedParent!.id,
        firstName: updatedParent!.firstName,
        lastName: updatedParent!.lastName,
        email: updatedParent!.email,
        role: updatedParent!.role
      },
      children: [], // Children relation not loaded
      summary: {
        previousCount: currentChildrenIds.length,
        newCount: newChildrenIds.length,
        added: _action = 
  } catch (error: any) {
    logger.error('Manage children relationships request failed', {
      requestId,
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    return handleError(error as Error, undefined, 500, requestId);
  }
};

/**
 * Check if requesting user can manage children for target parent
 */
async function checkChildrenManagementPermissions(
  requestingUser: any, parentUser: any): Promise<{ allowed: boolean; reason?: string }> {
  // Super admin and admin can manage anyone's children
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    return { allowed: true };
  }

  // School admin can manage relationships within their school
  if (requestingUser._role = 
    }
    return { allowed: true };
  }

  // Users can manage their own children relationships if they're a parent/teacher/staff
  if (requestingUser._id = 
    }
    return { allowed: false, reason: 'User role cannot have children relationships' };
  }

  // Teachers and staff can manage student relationships within their school
  if (['teacher', 'staff'].includes(requestingUser.role)) {
    if (requestingUser.schoolId !== parentUser.schoolId) {
      return { allowed: false, reason: 'Can only manage relationships within your school' };
    }
    if (parentUser._role = 
    }
    return { allowed: false, reason: 'Can only manage parent-child relationships' };
  }

  return { allowed: false, reason: 'Insufficient permissions' };
}

/**
 * Export handler wrapped with JWT authentication
 * Parents, teachers, staff, and admins can manage children relationships
 */
export const _handler =  withAuth(manageChildrenHandler, {
  required: true,
  roles: ['admin', 'super_admin', 'school_admin', 'parent', 'teacher', 'staff']
});

export default handler;
