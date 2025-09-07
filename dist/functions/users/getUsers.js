"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersHandler = void 0;
const user_service_1 = require("../../services/user.service");
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../shared/response.utils");
const joi_1 = require("joi");
// Request validation schema
const getUsersSchema = joi_1.default.object({
    query: joi_1.default.string().optional().allow('').max(100),
    role: joi_1.default.string().valid('student', 'parent', 'teacher', 'staff', 'school_admin', 'admin', 'super_admin').optional(),
    schoolId: joi_1.default.string().uuid().optional(),
    isActive: joi_1.default.boolean().optional(),
    parentId: joi_1.default.string().uuid().optional(),
    hasChildren: joi_1.default.boolean().optional(),
    sortBy: joi_1.default.string().valid('firstName', 'lastName', 'email', 'createdAt', 'updatedAt').optional(),
    sortOrder: joi_1.default.string().valid('asc', 'desc').optional(),
    page: joi_1.default.number().integer().min(1).max(1000).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional()
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
const getUsersHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Get users request started', {
            requestId,
            queryParams: event.queryStringParameters,
            userAgent: event.headers['User-Agent']
        });
        // Extract user context from authorizer
        const userContext = event.requestContext.authorizer;
        if (!userContext?.userId) {
            logger.warn('Unauthorized access attempt', { requestId });
            return (0, response_utils_1.handleError)(new Error('Unauthorized'), undefined, 401, requestId);
        }
        // Parse and validate query parameters
        const queryParams = event.queryStringParameters || {};
        const filters = {
            query: queryParams.query || undefined,
            role: queryParams.role || undefined,
            schoolId: queryParams.schoolId || undefined,
            isActive: queryParams.isActive ? queryParams.isActive === 'true' : undefined,
            parentId: queryParams.parentId || undefined,
            hasChildren: queryParams.hasChildren ? queryParams.hasChildren === 'true' : undefined,
            sortBy: queryParams.sortBy || 'createdAt',
            sortOrder: queryParams.sortOrder || 'desc',
            page: queryParams.page ? parseInt(queryParams.page, 10) : 1,
            limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 50
        };
        // Validate filters
        const validation = validation_service_1.ValidationService.validateObject(filters, getUsersSchema);
        if (!validation.isValid) {
            logger.warn('Invalid query parameters', {
                requestId,
                errors: validation.errors,
                filters
            });
            return (0, response_utils_1.handleError)(new Error(`Validation failed: ${validation.errors?.join(', ')}`), undefined, 400, requestId);
        }
        // Check permissions - users can only see users from their school unless admin
        const requestingUser = await user_service_1.UserService.getUserById(userContext.userId);
        if (!requestingUser) {
            logger.error('Requesting user not found', {
                requestId,
                userId: userContext.userId
            });
            return (0, response_utils_1.handleError)(new Error('User not found'), undefined, 404, requestId);
        }
        // Apply school filtering based on user permissions
        if (!['admin', 'super_admin'].includes(requestingUser.role)) {
            // Non-admin users can only see users from their school
            filters.schoolId = requestingUser.schoolId || undefined;
            // Parents can only see their children and themselves
            if (requestingUser.role === 'parent' && !filters.parentId) {
                filters.parentId = requestingUser.id;
            }
        }
        logger.info('Searching users with filters', {
            requestId,
            userId: userContext.userId,
            role: requestingUser.role,
            appliedFilters: filters
        });
        // Search users
        const result = await user_service_1.UserService.searchUsers(filters);
        // Transform response to remove sensitive data
        const transformedUsers = result.users.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            schoolId: user.schoolId,
            school: null, // School relation not loaded
            parentId: user.parentId,
            parent: null, // Parent relation not loaded
            children: [], // Children relation not loaded
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
        // Log successful operation
        logger.info('Get users request completed', {
            requestId,
            userId: userContext.userId,
            resultCount: result.users.length,
            total: result.total,
            page: result.page,
            totalPages: result.totalPages
        });
        // Return response
        return (0, response_utils_1.createSuccessResponse)({
            users: transformedUsers,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasNext: result.page < result.totalPages,
                hasPrev: result.page > 1
            },
            filters: {
                query: filters.query,
                role: filters.role,
                schoolId: filters.schoolId,
                isActive: filters.isActive,
                parentId: filters.parentId,
                hasChildren: filters.hasChildren,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder
            }
        }, 'Users retrieved successfully', 200, requestId);
    }
    catch (error) {
        logger.error('Get users request failed', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, undefined, 500, requestId);
    }
};
exports.getUsersHandler = getUsersHandler;
exports.default = exports.getUsersHandler;
