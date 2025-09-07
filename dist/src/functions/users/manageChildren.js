"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageChildrenHandler = void 0;
const user_service_1 = require("../../services/user.service");
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../shared/response.utils");
const joi_1 = __importDefault(require("joi"));
const manageChildrenSchema = joi_1.default.object({
    action: joi_1.default.string().valid('replace', 'add', 'remove').default('replace'),
    childrenIds: joi_1.default.array().items(joi_1.default.string().uuid()).required().min(0).max(50)
});
const manageChildrenHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Manage children relationships request started', {
            requestId,
            pathParameters: event.pathParameters,
            userAgent: event.headers['User-Agent']
        });
        const userContext = event.requestContext.authorizer;
        if (!userContext?.userId) {
            logger.warn('Unauthorized access attempt', { requestId });
            return (0, response_utils_1.handleError)(new Error('Unauthorized'), undefined, 401, requestId);
        }
        const parentId = event.pathParameters?.id;
        if (!parentId) {
            logger.warn('Missing parent ID parameter', { requestId });
            return (0, response_utils_1.handleError)(new Error('Parent ID is required'), undefined, 400, requestId);
        }
        let requestData;
        try {
            requestData = JSON.parse(event.body || '{}');
        }
        catch (parseError) {
            logger.warn('Invalid JSON in request body', {
                requestId,
                error: parseError.message
            });
            return (0, response_utils_1.handleError)(new Error('Invalid JSON in request body'), undefined, 400, requestId);
        }
        const validation = await validation_service_1.ValidationService.validateObject(requestData, manageChildrenSchema);
        if (!validation.isValid) {
            logger.warn('Invalid children management data', {
                requestId,
                errors: validation.errors
            });
            return (0, response_utils_1.handleError)(new Error(`Validation failed: ${validation.errors?.join(', ')}`), undefined, 400, requestId);
        }
        const action = requestData.action || 'replace';
        const providedChildrenIds = requestData.childrenIds || [];
        const requestingUser = await user_service_1.UserService.getUserById(userContext.userId);
        if (!requestingUser) {
            logger.error('Requesting user not found', {
                requestId,
                userId: userContext.userId
            });
            return (0, response_utils_1.handleError)(new Error('Requesting user not found'), undefined, 404, requestId);
        }
        const parentUser = await user_service_1.UserService.getUserById(parentId);
        if (!parentUser) {
            logger.warn('Parent user not found', {
                requestId,
                parentId,
                requestingUserId: userContext.userId
            });
            return (0, response_utils_1.handleError)(new Error('Parent user not found'), undefined, 404, requestId);
        }
        const canManage = await checkChildrenManagementPermissions(requestingUser, parentUser);
        if (!canManage.allowed) {
            logger.warn('Children management permission denied', {
                requestId,
                requestingUserId: userContext.userId,
                requestingUserRole: requestingUser.role,
                parentId,
                parentRole: parentUser.role,
                reason: canManage.reason
            });
            return (0, response_utils_1.handleError)(new Error(canManage.reason || 'Access denied'), undefined, 403, requestId);
        }
        if (!['parent', 'teacher', 'staff', 'school_admin', 'admin', 'super_admin'].includes(parentUser.role)) {
            return (0, response_utils_1.handleError)(new Error('Invalid parent role. Only parents, teachers, staff, and admins can have children'), undefined, 400, requestId);
        }
        const currentChildren = await user_service_1.UserService.searchUsers({
            parentId,
            limit: 100
        });
        const currentChildrenIds = currentChildren.users.map(child => child.id);
        let newChildrenIds;
        switch (action) {
            case 'replace':
                newChildrenIds = providedChildrenIds;
                break;
            case 'add':
                newChildrenIds = [...new Set([...currentChildrenIds, ...providedChildrenIds])];
                break;
            case 'remove':
                newChildrenIds = currentChildrenIds.filter(id => !providedChildrenIds.includes(id));
                break;
            default:
                return (0, response_utils_1.handleError)(new Error('Invalid action'), undefined, 400, requestId);
        }
        if (newChildrenIds.length > 0) {
            const childrenToValidate = await Promise.all(newChildrenIds.map(id => user_service_1.UserService.getUserById(id)));
            const missingChildren = newChildrenIds.filter((id, index) => !childrenToValidate[index]);
            if (missingChildren.length > 0) {
                return (0, response_utils_1.handleError)(new Error(`Children not found: ${missingChildren.join(', ')}`), undefined, 404, requestId);
            }
            if (parentUser.schoolId) {
                const invalidSchoolChildren = childrenToValidate.filter(child => child && child.schoolId !== parentUser.schoolId);
                if (invalidSchoolChildren.length > 0) {
                    const invalidIds = invalidSchoolChildren.map(child => child.id);
                    return (0, response_utils_1.handleError)(new Error(`Children must be from the same school as parent: ${invalidIds.join(', ')}`), undefined, 400, requestId);
                }
            }
            if (parentUser.role === 'parent') {
                const invalidRoleChildren = childrenToValidate.filter(child => child && child.role !== 'student');
                if (invalidRoleChildren.length > 0) {
                    const invalidIds = invalidRoleChildren.map(child => `${child.id} (${child.role})`);
                    return (0, response_utils_1.handleError)(new Error(`Invalid child roles - only students can be children: ${invalidIds.join(', ')}`), undefined, 400, requestId);
                }
            }
        }
        logger.info('Updating children relationships', {
            requestId,
            parentId,
            action,
            currentChildrenCount: currentChildrenIds.length,
            newChildrenCount: newChildrenIds.length,
            requestingUserId: userContext.userId
        });
        await user_service_1.UserService.updateChildrenAssociations(parentId, newChildrenIds, userContext.userId);
        const updatedParent = await user_service_1.UserService.getUserById(parentId);
        logger.info('Children relationships updated successfully', {
            requestId,
            parentId,
            action,
            finalChildrenCount: newChildrenIds.length,
            addedChildren: action === 'add' ? providedChildrenIds.filter(id => !currentChildrenIds.includes(id)) : [],
            removedChildren: action === 'remove' ? providedChildrenIds : []
        });
        return (0, response_utils_1.createSuccessResponse)({
            action,
            parent: {
                id: updatedParent.id,
                firstName: updatedParent.firstName,
                lastName: updatedParent.lastName,
                email: updatedParent.email,
                role: updatedParent.role
            },
            children: [],
            summary: {
                previousCount: currentChildrenIds.length,
                newCount: newChildrenIds.length,
                added: action === 'add' ? providedChildrenIds.filter(id => !currentChildrenIds.includes(id)).length : 0,
                removed: action === 'remove' ? providedChildrenIds.length :
                    action === 'replace' ? currentChildrenIds.filter(id => !newChildrenIds.includes(id)).length : 0
            }
        }, 'Children relationships updated successfully', 200, requestId);
    }
    catch (error) {
        logger.error('Manage children relationships request failed', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, undefined, 500, requestId);
    }
};
exports.manageChildrenHandler = manageChildrenHandler;
async function checkChildrenManagementPermissions(requestingUser, parentUser) {
    if (['super_admin', 'admin'].includes(requestingUser.role)) {
        return { allowed: true };
    }
    if (requestingUser.role === 'school_admin') {
        if (requestingUser.schoolId !== parentUser.schoolId) {
            return { allowed: false, reason: 'Can only manage relationships within your school' };
        }
        return { allowed: true };
    }
    if (requestingUser.id === parentUser.id) {
        if (['parent', 'teacher', 'staff', 'school_admin'].includes(parentUser.role)) {
            return { allowed: true };
        }
        return { allowed: false, reason: 'User role cannot have children relationships' };
    }
    if (['teacher', 'staff'].includes(requestingUser.role)) {
        if (requestingUser.schoolId !== parentUser.schoolId) {
            return { allowed: false, reason: 'Can only manage relationships within your school' };
        }
        if (parentUser.role === 'parent') {
            return { allowed: true };
        }
        return { allowed: false, reason: 'Can only manage parent-child relationships' };
    }
    return { allowed: false, reason: 'Insufficient permissions' };
}
exports.default = exports.manageChildrenHandler;
//# sourceMappingURL=manageChildren.js.map