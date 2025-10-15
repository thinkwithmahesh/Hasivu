/**
 * HASIVU Platform - Get Users Lambda Function
 * List users with advanced filtering, pagination, and search
 * Implements Story 1.3: Core User Management System
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { UserService, UserSearchFilters } from '../../services/user.service';
import { logger } from '../../utils/logger';
import { ValidationService } from '../shared/validation.service';
import { handleError, createSuccessResponse } from '../shared/response.utils';
import Joi from 'joi';

// Request validation schema
const getUsersSchema = Joi.object({
  query: Joi.string().optional().allow('').max(100),
  role: Joi.string()
    .valid('student', 'parent', 'teacher', 'staff', 'school_admin', 'admin', 'super_admin')
    .optional(),
  schoolId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
  parentId: Joi.string().uuid().optional(),
  hasChildren: Joi.boolean().optional(),
  sortBy: Joi.string().valid('firstName', 'lastName', 'email', 'createdAt', 'updatedAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  page: Joi.number().integer().min(1).max(1000).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

/**
 * Get Users Lambda Handler
 * GET /api/v1/users
 *
 * Query Parameters:
 * - query: Search term for name/email
 * - role: Filter by user role
 * - schoolId: Filter by school (admins only)
 * - isActive: Filter by status
 * - parentId: Filter by parent
 * - hasChildren: Filter by parent status
 * - sortBy: Sort field
 * - sortOrder: Sort direction
 * - page: Page number
 * - limit: Items per page
 */
export const getUsersHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;

  try {
    logger.info('Get users request started', {
      requestId,
      queryParams: event.queryStringParameters,
      userAgent: event.headers['User-Agent'],
    });

    // Extract user context from authorizer
    const userContext = event.requestContext.authorizer;
    if (!userContext?.userId) {
      logger.warn('Unauthorized access attempt', { requestId });
      return handleError(new Error('Unauthorized'));
    }

    // Parse and validate query parameters
    const queryParams = event.queryStringParameters || {};

    const filters: UserSearchFilters = {
      search: queryParams.query || undefined,
      role: (queryParams.role as any) || undefined,
      schoolId: queryParams.schoolId || undefined,
      isActive: queryParams.isActive ? queryParams.isActive === 'true' : undefined,
      page: queryParams.page ? parseInt(queryParams.page, 10) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 50,
    };

    // Store additional filter parameters not in UserSearchFilters interface
    const additionalFilters = {
      query: queryParams.query || undefined,
      parentId: queryParams.parentId || undefined,
      hasChildren: queryParams.hasChildren ? queryParams.hasChildren === 'true' : undefined,
      sortBy: queryParams.sortBy || 'createdAt',
      sortOrder: (queryParams.sortOrder as 'asc' | 'desc') || 'desc',
    };

    // Validate filters
    const validation = ValidationService.validateObject(filters, getUsersSchema);
    if (!validation.isValid) {
      logger.warn('Invalid query parameters', {
        requestId,
        errors: validation.errors,
        filters,
      });
      return handleError(new Error(`Validation failed: ${validation.errors?.join(', ')}`));
    }

    // Check permissions - users can only see users from their school unless admin
    const requestingUser = await UserService.getUserById(userContext.userId);
    if (!requestingUser) {
      logger.error('Requesting user not found', new Error('User not found'), {
        requestId,
        userId: userContext.userId,
      });
      return handleError(new Error('User not found'));
    }

    // Apply school filtering based on user permissions
    if (!['admin', 'super_admin'].includes(requestingUser.role)) {
      // Non-admin users can only see users from their school
      filters.schoolId = requestingUser.schoolId ?? undefined;

      // Parents can only see their children and themselves
      if (requestingUser.role === 'parent' && !additionalFilters.parentId) {
        additionalFilters.parentId = requestingUser.id;
      }
    }

    logger.info('Searching users with filters', {
      requestId,
      userId: userContext.userId,
      role: requestingUser.role,
      appliedFilters: filters,
    });

    // Search users
    const result = await UserService.searchUsers(filters);

    // Transform response to remove sensitive data
    const transformedUsers = result.users.map((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      schoolId: user.schoolId ?? undefined,
      school: null, // School relation not loaded
      parentId: user.parentId ?? undefined,
      parent: null, // Parent relation not loaded
      children: [], // Children relation not loaded
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    // Calculate total pages
    const totalPages = Math.ceil(result.total / result.limit);

    // Log successful operation
    logger.info('Get users request completed', {
      requestId,
      userId: userContext.userId,
      resultCount: result.users.length,
      total: result.total,
      page: result.page,
      totalPages,
    });

    // Return response
    return createSuccessResponse({
      users: transformedUsers,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages,
        hasNext: result.page < totalPages,
        hasPrev: result.page > 1,
      },
      filters: {
        query: additionalFilters.query,
        role: filters.role,
        schoolId: filters.schoolId,
        isActive: filters.isActive,
        parentId: additionalFilters.parentId,
        hasChildren: additionalFilters.hasChildren,
        sortBy: additionalFilters.sortBy,
        sortOrder: additionalFilters.sortOrder,
      },
    });
  } catch (error) {
    logger.error('Get users request failed', error as Error, {
      requestId,
    });
    return handleError(error as Error);
  }
};

export default getUsersHandler;
