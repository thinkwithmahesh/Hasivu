"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageChildrenHandler = void 0;
const user_service_1 = require("../../services/user.service");
const logger_1 = require("../../utils/logger");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../shared/response.utils");
const joi_1 = __importDefault(require("joi"));
const manageChildrenSchema = joi_1.default.object({
    action: joi_1.default.string().valid('replace', 'add', 'remove').default('replace'),
    childrenIds: joi_1.default.array().items(joi_1.default.string().uuid()).required().min(0).max(50),
});
const manageChildrenHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('Manage children relationships request started', {
            requestId,
            pathParameters: event.pathParameters,
            userAgent: event.headers['User-Agent'],
        });
        const userContext = event.requestContext.authorizer;
        if (!userContext?.userId) {
            logger_1.logger.warn('Unauthorized access attempt', { requestId });
            return (0, response_utils_1.handleError)(new Error('Unauthorized'));
        }
        const parentId = event.pathParameters?.id;
        if (!parentId) {
            logger_1.logger.warn('Missing parent ID parameter', { requestId });
            return (0, response_utils_1.handleError)(new Error('Parent ID is required'));
        }
        let requestData;
        try {
            requestData = JSON.parse(event.body || '{}');
        }
        catch (parseError) {
            logger_1.logger.warn('Invalid JSON in request body', {
                requestId,
                error: parseError.message,
            });
            return (0, response_utils_1.handleError)(new Error('Invalid JSON in request body'));
        }
        const validation = await validation_service_1.ValidationService.validateObject(requestData, manageChildrenSchema);
        if (!validation.isValid) {
            logger_1.logger.warn('Invalid children management data', {
                requestId,
                errors: validation.errors,
            });
            return (0, response_utils_1.handleError)(new Error(`Validation failed: ${validation.errors?.join(', ')}`));
        }
        const action = requestData.action || 'replace';
        const providedChildrenIds = requestData.childrenIds || [];
        const requestingUser = await user_service_1.UserService.getUserById(userContext.userId);
        if (!requestingUser) {
            logger_1.logger.error('Requesting user not found', new Error('User not found'), {
                requestId,
                userId: userContext.userId,
            });
            return (0, response_utils_1.handleError)(new Error('Requesting user not found'));
        }
        const parentUser = await user_service_1.UserService.getUserById(parentId);
        if (!parentUser) {
            logger_1.logger.warn('Parent user not found', {
                requestId,
                parentId,
                requestingUserId: userContext.userId,
            });
            return (0, response_utils_1.handleError)(new Error('Parent user not found'));
        }
        const canManage = await checkChildrenManagementPermissions(requestingUser, parentUser);
        if (!canManage.allowed) {
            logger_1.logger.warn('Children management permission denied', {
                requestId,
                requestingUserId: userContext.userId,
                requestingUserRole: requestingUser.role,
                parentId,
                parentRole: parentUser.role,
                reason: canManage.reason,
            });
            return (0, response_utils_1.handleError)(new Error(canManage.reason || 'Access denied'));
        }
        if (!['parent', 'teacher', 'staff', 'school_admin', 'admin', 'super_admin'].includes(parentUser.role)) {
            return (0, response_utils_1.handleError)(new Error('Invalid parent role. Only parents, teachers, staff, and admins can have children'));
        }
        const currentChildrenIds = [];
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
                return (0, response_utils_1.handleError)(new Error('Invalid action'));
        }
        if (newChildrenIds.length > 0) {
            const childrenToValidate = await Promise.all(newChildrenIds.map((id) => user_service_1.UserService.getUserById(id)));
            const missingChildren = newChildrenIds.filter((id, index) => !childrenToValidate[index]);
            if (missingChildren.length > 0) {
                return (0, response_utils_1.handleError)(new Error(`Children not found: ${missingChildren.join(', ')}`));
            }
            if (parentUser.schoolId) {
                const invalidSchoolChildren = childrenToValidate.filter((child) => child && child.schoolId !== parentUser.schoolId);
                if (invalidSchoolChildren.length > 0) {
                    const invalidIds = invalidSchoolChildren.map((child) => child.id);
                    return (0, response_utils_1.handleError)(new Error(`Children must be from the same school as parent: ${invalidIds.join(', ')}`));
                }
            }
            if (parentUser.role === 'parent') {
                const invalidRoleChildren = childrenToValidate.filter((child) => child && child.role !== 'student');
                if (invalidRoleChildren.length > 0) {
                    const invalidIds = invalidRoleChildren.map((child) => `${child.id} (${child.role})`);
                    return (0, response_utils_1.handleError)(new Error(`Invalid child roles - only students can be children: ${invalidIds.join(', ')}`));
                }
            }
        }
        logger_1.logger.info('Updating children relationships', {
            requestId,
            parentId,
            action,
            currentChildrenCount: currentChildrenIds.length,
            newChildrenCount: newChildrenIds.length,
            requestingUserId: userContext.userId,
        });
        await user_service_1.UserService.updateChildrenAssociations(parentId, newChildrenIds);
        const updatedParent = await user_service_1.UserService.getUserById(parentId);
        logger_1.logger.info('Children relationships updated successfully', {
            requestId,
            parentId,
            action,
            finalChildrenCount: newChildrenIds.length,
            addedChildren: action === 'add' ? providedChildrenIds.filter(id => !currentChildrenIds.includes(id)) : [],
            removedChildren: action === 'remove' ? providedChildrenIds : [],
        });
        return (0, response_utils_1.createSuccessResponse)({
            action,
            parent: {
                id: updatedParent.id,
                firstName: updatedParent.firstName,
                lastName: updatedParent.lastName,
                email: updatedParent.email,
                role: updatedParent.role,
            },
            children: [],
            summary: {
                previousCount: currentChildrenIds.length,
                newCount: newChildrenIds.length,
                added: action === 'add'
                    ? providedChildrenIds.filter((id) => !currentChildrenIds.includes(id)).length
                    : 0,
                removed: action === 'remove'
                    ? providedChildrenIds.length
                    : action === 'replace'
                        ? currentChildrenIds.filter((id) => !newChildrenIds.includes(id)).length
                        : 0,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Manage children relationships request failed', error, {
            requestId,
        });
        return (0, response_utils_1.handleError)(error);
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