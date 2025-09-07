"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByIdHandler = void 0;
const user_service_1 = require("../../services/user.service");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const getUserByIdHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Get user by ID request started', {
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
        const queryParams = event.queryStringParameters || {};
        const includeAuditLogs = queryParams.includeAuditLogs === 'true';
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
        const canViewUser = await checkViewPermissions(requestingUser, targetUser);
        if (!canViewUser) {
            logger.warn('Access denied to user profile', {
                requestId,
                requestingUserId: userContext.userId,
                requestingUserRole: requestingUser.role,
                targetUserId: userId,
                targetUserRole: targetUser.role
            });
            return (0, response_utils_1.handleError)(new Error('Access denied'), undefined, 403, requestId);
        }
        let auditLogs = [];
        const canViewAuditLogs = (requestingUser.id === targetUser.id ||
            ['admin', 'super_admin', 'school_admin'].includes(requestingUser.role)) && includeAuditLogs;
        if (canViewAuditLogs) {
            try {
                auditLogs = await user_service_1.UserService.getUserAuditLogs(userId, 10);
            }
            catch (auditError) {
                logger.warn('Failed to fetch audit logs', {
                    requestId,
                    userId,
                    error: auditError.message
                });
            }
        }
        logger.info('Get user by ID request completed', {
            requestId,
            requestingUserId: userContext.userId,
            targetUserId: userId,
            includeAuditLogs: canViewAuditLogs
        });
        const responseData = {
            id: targetUser.id,
            email: targetUser.email,
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
            role: targetUser.role,
            schoolId: targetUser.schoolId,
            school: null,
            parentId: targetUser.parentId,
            parent: null,
            children: [],
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
        return (0, response_utils_1.createSuccessResponse)(responseData, 'User retrieved successfully', 200, requestId);
    }
    catch (error) {
        logger.error('Get user by ID request failed', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, undefined, 500, requestId);
    }
};
exports.getUserByIdHandler = getUserByIdHandler;
async function checkViewPermissions(requestingUser, targetUser) {
    if (['super_admin', 'admin'].includes(requestingUser.role)) {
        return true;
    }
    if (requestingUser.role === 'school_admin' &&
        requestingUser.schoolId === targetUser.schoolId) {
        return true;
    }
    if (requestingUser.id === targetUser.id) {
        return true;
    }
    if (requestingUser.role === 'parent' && targetUser.parentId === requestingUser.id) {
        return true;
    }
    if (targetUser.role === 'parent' && requestingUser.parentId === targetUser.id) {
        return true;
    }
    if (['staff', 'teacher'].includes(requestingUser.role) &&
        targetUser.role === 'student' &&
        requestingUser.schoolId === targetUser.schoolId) {
        return true;
    }
    return false;
}
async function checkEditPermissions(requestingUser, targetUser) {
    if (requestingUser.role === 'super_admin' && targetUser.role !== 'super_admin') {
        return true;
    }
    if (requestingUser.role === 'admin' && targetUser.role !== 'super_admin') {
        return true;
    }
    if (requestingUser.role === 'school_admin' &&
        requestingUser.schoolId === targetUser.schoolId &&
        !['admin', 'super_admin'].includes(targetUser.role)) {
        return true;
    }
    if (requestingUser.id === targetUser.id) {
        return true;
    }
    if (requestingUser.role === 'parent' && targetUser.parentId === requestingUser.id) {
        return true;
    }
    return false;
}
async function checkDeletePermissions(requestingUser, targetUser) {
    if (requestingUser.role === 'super_admin' && targetUser.role !== 'super_admin') {
        return true;
    }
    if (requestingUser.role === 'admin' &&
        !['admin', 'super_admin'].includes(targetUser.role)) {
        return true;
    }
    if (requestingUser.role === 'school_admin' &&
        requestingUser.schoolId === targetUser.schoolId &&
        !['admin', 'super_admin', 'school_admin'].includes(targetUser.role)) {
        return true;
    }
    return false;
}
async function checkChildrenManagementPermissions(requestingUser, targetUser) {
    if (['super_admin', 'admin'].includes(requestingUser.role)) {
        return true;
    }
    if (requestingUser.role === 'school_admin' &&
        requestingUser.schoolId === targetUser.schoolId) {
        return true;
    }
    if (requestingUser.id === targetUser.id &&
        ['parent', 'teacher', 'staff', 'school_admin'].includes(targetUser.role)) {
        return true;
    }
    return false;
}
exports.default = exports.getUserByIdHandler;
//# sourceMappingURL=getUserById.js.map