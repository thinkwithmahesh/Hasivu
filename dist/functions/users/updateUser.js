"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserHandler = void 0;
const user_service_1 = require("../../services/user.service");
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../shared/response.utils");
const joi_1 = require("joi");
// Update user validation schema
const updateUserSchema = joi_1.default.object({
    firstName: joi_1.default.string().trim().min(1).max(50).optional(),
    lastName: joi_1.default.string().trim().min(1).max(50).optional(),
    email: joi_1.default.string().email().lowercase().optional(),
    role: joi_1.default.string().valid('student', 'parent', 'teacher', 'staff', 'school_admin', 'admin', 'super_admin').optional(),
    schoolId: joi_1.default.string().uuid().optional(),
    parentId: joi_1.default.string().uuid().optional().allow(null),
    isActive: joi_1.default.boolean().optional(),
    metadata: joi_1.default.object().optional()
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
const updateUserHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Update user request started', {
            requestId,
            pathParameters: event.pathParameters,
            userAgent: event.headers['User-Agent']
        });
        // Extract user context from authorizer
        const userContext = event.requestContext.authorizer;
        if (!userContext?.userId) {
            logger.warn('Unauthorized access attempt', { requestId });
            return (0, response_utils_1.handleError)(new Error('Unauthorized'), undefined, 401, requestId);
        }
        // Validate user ID parameter
        const userId = event.pathParameters?.id;
        if (!userId) {
            logger.warn('Missing user ID parameter', { requestId });
            return (0, response_utils_1.handleError)(new Error('User ID is required'), undefined, 400, requestId);
        }
        // Parse request body
        let updateData;
        try {
            updateData = JSON.parse(event.body || '{}');
        }
        catch (parseError) {
            logger.warn('Invalid JSON in request body', {
                requestId,
                body: event.body,
                error: parseError.message
            });
            return (0, response_utils_1.handleError)(new Error('Invalid JSON in request body'), undefined, 400, requestId);
        }
        // Get requesting user for permission checks
        const requestingUser = await user_service_1.UserService.getUserById(userContext.userId);
        if (!requestingUser) {
            logger.error('Requesting user not found', {
                requestId,
                userId: userContext.userId
            });
            return (0, response_utils_1.handleError)(new Error('Requesting user not found'), undefined, 404, requestId);
        }
        // Get target user
        const targetUser = await user_service_1.UserService.getUserById(userId);
        if (!targetUser) {
            logger.warn('Target user not found', {
                requestId,
                targetUserId: userId,
                requestingUserId: userContext.userId
            });
            return (0, response_utils_1.handleError)(new Error('User not found'), undefined, 404, requestId);
        }
        // Check update permissions
        const canEdit = await checkUpdatePermissions(requestingUser, targetUser, updateData);
        if (!canEdit.allowed) {
            logger.warn('Update permission denied', {
                requestId,
                requestingUserId: userContext.userId,
                requestingUserRole: requestingUser.role,
                targetUserId: userId,
                targetUserRole: targetUser.role,
                reason: canEdit.reason
            });
            return (0, response_utils_1.handleError)(new Error(canEdit.reason || 'Access denied'), undefined, 403, requestId);
        }
        // Filter update data based on permissions
        const filteredUpdateData = filterUpdateDataByPermissions(updateData, requestingUser, targetUser);
        // Validate update data
        const validation = await validation_service_1.ValidationService.validateObject(filteredUpdateData, updateUserSchema);
        if (!validation.isValid) {
            logger.warn('Invalid update data', {
                requestId,
                errors: validation.errors,
                updateData: filteredUpdateData
            });
            return (0, response_utils_1.handleError)(new Error(`Validation failed: ${validation.errors?.join(', ')}`), undefined, 400, requestId);
        }
        // Additional business rule validations
        if (filteredUpdateData.schoolId && filteredUpdateData.schoolId !== targetUser.schoolId) {
            // Only admins can change school association
            if (!['admin', 'super_admin'].includes(requestingUser.role)) {
                logger.warn('Unauthorized school change attempt', {
                    requestId,
                    requestingUserId: userContext.userId,
                    requestingUserRole: requestingUser.role,
                    currentSchoolId: targetUser.schoolId,
                    newSchoolId: filteredUpdateData.schoolId
                });
                return (0, response_utils_1.handleError)(new Error('Only administrators can change school associations'), undefined, 403, requestId);
            }
        }
        // Handle parent-child relationship changes
        if (filteredUpdateData.parentId !== undefined && filteredUpdateData.parentId !== targetUser.parentId) {
            if (filteredUpdateData.parentId) {
                // Validate new parent exists and is appropriate
                const newParent = await user_service_1.UserService.getUserById(filteredUpdateData.parentId);
                if (!newParent) {
                    return (0, response_utils_1.handleError)(new Error('New parent user not found'), undefined, 400, requestId);
                }
                if (!['parent', 'teacher', 'staff', 'school_admin'].includes(newParent.role)) {
                    return (0, response_utils_1.handleError)(new Error('Invalid parent role'), undefined, 400, requestId);
                }
                // Check school compatibility
                if (targetUser.schoolId && newParent.schoolId !== targetUser.schoolId) {
                    return (0, response_utils_1.handleError)(new Error('Parent and child must be from the same school'), undefined, 400, requestId);
                }
            }
        }
        logger.info('Updating user with filtered data', {
            requestId,
            targetUserId: userId,
            requestingUserId: userContext.userId,
            updateFields: Object.keys(filteredUpdateData)
        });
        // Update user
        const updatedUser = await user_service_1.UserService.updateUser(userId, filteredUpdateData, userContext.userId);
        // Log successful operation
        logger.info('Update user request completed', {
            requestId,
            targetUserId: userId,
            requestingUserId: userContext.userId,
            updatedFields: Object.keys(filteredUpdateData)
        });
        // Return updated user data
        return (0, response_utils_1.createSuccessResponse)({
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
    }
    catch (error) {
        logger.error('Update user request failed', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, undefined, 500, requestId);
    }
};
exports.updateUserHandler = updateUserHandler;
/**
 * Check if requesting user can update target user
 */
async function checkUpdatePermissions(requestingUser, targetUser, updateData) {
    // Super admin can update anyone except other super admins trying to demote
    if (requestingUser.role === 'super_admin') {
        if (targetUser.role === 'super_admin' && updateData.role && updateData.role !== 'super_admin') {
            return { allowed: false, reason: 'Cannot demote other super administrators' };
        }
        return { allowed: true };
    }
    // Admin can update non-super-admin users
    if (requestingUser.role === 'admin' && targetUser.role !== 'super_admin') {
        return { allowed: true };
    }
    // School admin can update users from their school (except admin and super admin)
    if (requestingUser.role === 'school_admin') {
        if (requestingUser.schoolId !== targetUser.schoolId) {
            return { allowed: false, reason: 'Can only update users from your school' };
        }
        if (['admin', 'super_admin'].includes(targetUser.role)) {
            return { allowed: false, reason: 'Cannot update admin users' };
        }
        return { allowed: true };
    }
    // Users can update their own profile (limited fields)
    if (requestingUser.id === targetUser.id) {
        const restrictedFields = ['role', 'schoolId', 'isActive'];
        const hasRestrictedFields = restrictedFields.some(field => updateData[field] !== undefined);
        if (hasRestrictedFields) {
            return { allowed: false, reason: 'Cannot update restricted fields' };
        }
        return { allowed: true };
    }
    // Parents can update their children's profiles (limited fields)
    if (requestingUser.role === 'parent' && targetUser.parentId === requestingUser.id) {
        const allowedFields = ['firstName', 'lastName', 'metadata'];
        const hasDisallowedFields = Object.keys(updateData).some(field => !allowedFields.includes(field));
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
function filterUpdateDataByPermissions(updateData, requestingUser, targetUser) {
    const filteredData = { ...updateData };
    // Super admin and admin can update everything
    if (['super_admin', 'admin'].includes(requestingUser.role)) {
        return filteredData;
    }
    // School admin can update most fields except role for their school users
    if (requestingUser.role === 'school_admin' &&
        requestingUser.schoolId === targetUser.schoolId) {
        // School admins cannot change roles or school associations
        delete filteredData.role;
        delete filteredData.schoolId;
        return filteredData;
    }
    // Self-update restrictions
    if (requestingUser.id === targetUser.id) {
        const allowedFields = ['firstName', 'lastName', 'metadata'];
        const restrictedUpdate = {};
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                restrictedUpdate[field] = updateData[field];
            }
        }
        return restrictedUpdate;
    }
    // Parent updating child - very limited fields
    if (requestingUser.role === 'parent' && targetUser.parentId === requestingUser.id) {
        const allowedFields = ['firstName', 'lastName', 'metadata'];
        const parentUpdate = {};
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                parentUpdate[field] = updateData[field];
            }
        }
        return parentUpdate;
    }
    // Default to empty update if no permissions
    return {};
}
exports.default = exports.updateUserHandler;
