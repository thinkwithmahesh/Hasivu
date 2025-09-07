"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserHandler = void 0;
const user_service_1 = require("../../services/user.service");
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../shared/response.utils");
const joi_1 = __importDefault(require("joi"));
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
const updateUserHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Update user request started', {
            requestId,
            pathParameters: event.pathParameters,
            userAgent: event.headers['User-Agent']
        });
        const userContext = event.requestContext.authorizer;
        if (!userContext?.userId) {
            logger.warn('Unauthorized access attempt', { requestId });
            return (0, response_utils_1.handleError)(new Error('Unauthorized'), undefined, 401, requestId);
        }
        const userId = event.pathParameters?.id;
        if (!userId) {
            logger.warn('Missing user ID parameter', { requestId });
            return (0, response_utils_1.handleError)(new Error('User ID is required'), undefined, 400, requestId);
        }
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
        const requestingUser = await user_service_1.UserService.getUserById(userContext.userId);
        if (!requestingUser) {
            logger.error('Requesting user not found', {
                requestId,
                userId: userContext.userId
            });
            return (0, response_utils_1.handleError)(new Error('Requesting user not found'), undefined, 404, requestId);
        }
        const targetUser = await user_service_1.UserService.getUserById(userId);
        if (!targetUser) {
            logger.warn('Target user not found', {
                requestId,
                targetUserId: userId,
                requestingUserId: userContext.userId
            });
            return (0, response_utils_1.handleError)(new Error('User not found'), undefined, 404, requestId);
        }
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
        const filteredUpdateData = filterUpdateDataByPermissions(updateData, requestingUser, targetUser);
        const validation = await validation_service_1.ValidationService.validateObject(filteredUpdateData, updateUserSchema);
        if (!validation.isValid) {
            logger.warn('Invalid update data', {
                requestId,
                errors: validation.errors,
                updateData: filteredUpdateData
            });
            return (0, response_utils_1.handleError)(new Error(`Validation failed: ${validation.errors?.join(', ')}`), undefined, 400, requestId);
        }
        if (filteredUpdateData.schoolId && filteredUpdateData.schoolId !== targetUser.schoolId) {
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
        if (filteredUpdateData.parentId !== undefined && filteredUpdateData.parentId !== targetUser.parentId) {
            if (filteredUpdateData.parentId) {
                const newParent = await user_service_1.UserService.getUserById(filteredUpdateData.parentId);
                if (!newParent) {
                    return (0, response_utils_1.handleError)(new Error('New parent user not found'), undefined, 400, requestId);
                }
                if (!['parent', 'teacher', 'staff', 'school_admin'].includes(newParent.role)) {
                    return (0, response_utils_1.handleError)(new Error('Invalid parent role'), undefined, 400, requestId);
                }
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
        const updatedUser = await user_service_1.UserService.updateUser(userId, filteredUpdateData, userContext.userId);
        logger.info('Update user request completed', {
            requestId,
            targetUserId: userId,
            requestingUserId: userContext.userId,
            updatedFields: Object.keys(filteredUpdateData)
        });
        return (0, response_utils_1.createSuccessResponse)({
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                role: updatedUser.role,
                schoolId: updatedUser.schoolId,
                school: null,
                parentId: updatedUser.parentId,
                parent: null,
                children: [],
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
async function checkUpdatePermissions(requestingUser, targetUser, updateData) {
    if (requestingUser.role === 'super_admin') {
        if (targetUser.role === 'super_admin' && updateData.role && updateData.role !== 'super_admin') {
            return { allowed: false, reason: 'Cannot demote other super administrators' };
        }
        return { allowed: true };
    }
    if (requestingUser.role === 'admin' && targetUser.role !== 'super_admin') {
        return { allowed: true };
    }
    if (requestingUser.role === 'school_admin') {
        if (requestingUser.schoolId !== targetUser.schoolId) {
            return { allowed: false, reason: 'Can only update users from your school' };
        }
        if (['admin', 'super_admin'].includes(targetUser.role)) {
            return { allowed: false, reason: 'Cannot update admin users' };
        }
        return { allowed: true };
    }
    if (requestingUser.id === targetUser.id) {
        const restrictedFields = ['role', 'schoolId', 'isActive'];
        const hasRestrictedFields = restrictedFields.some(field => updateData[field] !== undefined);
        if (hasRestrictedFields) {
            return { allowed: false, reason: 'Cannot update restricted fields' };
        }
        return { allowed: true };
    }
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
function filterUpdateDataByPermissions(updateData, requestingUser, targetUser) {
    const filteredData = { ...updateData };
    if (['super_admin', 'admin'].includes(requestingUser.role)) {
        return filteredData;
    }
    if (requestingUser.role === 'school_admin' &&
        requestingUser.schoolId === targetUser.schoolId) {
        delete filteredData.role;
        delete filteredData.schoolId;
        return filteredData;
    }
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
    return {};
}
exports.default = exports.updateUserHandler;
//# sourceMappingURL=updateUser.js.map