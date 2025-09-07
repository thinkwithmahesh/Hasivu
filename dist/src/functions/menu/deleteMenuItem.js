"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMenuItemHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const Joi = __importStar(require("joi"));
const prisma = new client_1.PrismaClient();
const deleteRequestSchema = Joi.object({
    hard: Joi.boolean().optional().default(false)
});
function canDeleteMenuItem(user) {
    const allowedRoles = ['super_admin', 'admin', 'school_admin', 'staff'];
    return allowedRoles.includes(user.role);
}
async function createAuditLog(menuItemId, userId, action, isHardDelete) {
    await prisma.auditLog.create({
        data: {
            entityType: 'MenuItem',
            entityId: menuItemId,
            action,
            changes: JSON.stringify({
                deletionType: isHardDelete ? 'hard' : 'soft',
                timestamp: new Date().toISOString()
            }),
            userId,
            createdById: userId,
            metadata: JSON.stringify({
                timestamp: new Date().toISOString(),
                action: 'MENU_ITEM_DELETED'
            })
        }
    });
}
const deleteMenuItemHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Delete menu item request started', { requestId });
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if (!authResult.success || !authResult.user) {
            logger.warn('Authentication failed', { requestId, error: authResult.error });
            return (0, response_utils_1.createErrorResponse)('Authentication failed', 401, 'AUTHENTICATION_FAILED');
        }
        const authenticatedUser = authResult.user;
        if (!canDeleteMenuItem(authenticatedUser)) {
            logger.warn('Insufficient permissions for menu item deletion', {
                requestId,
                userId: authenticatedUser.id,
                role: authenticatedUser.role
            });
            return (0, response_utils_1.createErrorResponse)('Insufficient permissions to delete menu items', 403, 'UNAUTHORIZED');
        }
        const menuItemId = event.pathParameters?.id;
        if (!menuItemId) {
            logger.warn('Missing menu item ID in path parameters', { requestId });
            return (0, response_utils_1.createErrorResponse)('Menu item ID is required', 400, 'VALIDATION_ERROR');
        }
        const validationService = validation_service_1.ValidationService.getInstance();
        try {
            validationService.validateUUID(menuItemId, 'Menu item ID');
        }
        catch (error) {
            logger.warn('Invalid menu item ID format', { requestId, menuItemId, error: error.message });
            return (0, response_utils_1.createErrorResponse)('Invalid menu item ID format', 400, 'VALIDATION_ERROR');
        }
        const queryParams = event.queryStringParameters || {};
        const { error, value: deleteOptions } = deleteRequestSchema.validate(queryParams);
        if (error) {
            logger.warn('Invalid query parameters', { requestId, error: error.details });
            return (0, response_utils_1.createErrorResponse)('Invalid query parameters', 400, 'VALIDATION_ERROR');
        }
        const isHardDelete = deleteOptions.hard;
        const existingMenuItem = await prisma.menuItem.findUnique({
            where: { id: menuItemId },
            include: {
                school: {
                    select: { id: true, name: true }
                }
            }
        });
        if (!existingMenuItem) {
            logger.warn('Menu item not found', { requestId, menuItemId });
            return (0, response_utils_1.createErrorResponse)('Menu item not found', 404, 'MENU_ITEM_NOT_FOUND');
        }
        if (authenticatedUser.role === 'school_admin' && authenticatedUser.schoolId !== existingMenuItem.schoolId) {
            logger.warn('Cross-school menu item deletion attempt', {
                requestId,
                userId: authenticatedUser.id,
                userSchoolId: authenticatedUser.schoolId,
                menuItemSchoolId: existingMenuItem.schoolId
            });
            return (0, response_utils_1.createErrorResponse)('Cannot delete menu items from other schools', 403, 'UNAUTHORIZED');
        }
        let result;
        if (isHardDelete) {
            result = await prisma.menuItem.delete({
                where: { id: menuItemId }
            });
            logger.info('Menu item hard deleted', {
                requestId,
                menuItemId,
                deletedBy: authenticatedUser.email,
                schoolId: existingMenuItem.schoolId
            });
        }
        else {
            result = await prisma.menuItem.update({
                where: { id: menuItemId },
                data: {
                    available: false,
                    updatedAt: new Date()
                }
            });
            logger.info('Menu item soft deleted', {
                requestId,
                menuItemId,
                deletedBy: authenticatedUser.email,
                schoolId: existingMenuItem.schoolId
            });
        }
        await createAuditLog(menuItemId, authenticatedUser.id, isHardDelete ? 'HARD_DELETE' : 'SOFT_DELETE', isHardDelete);
        logger.info('Menu item deletion completed successfully', {
            requestId,
            menuItemId,
            deletionType: isHardDelete ? 'hard' : 'soft',
            deletedBy: authenticatedUser.email
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: `Menu item ${isHardDelete ? 'permanently deleted' : 'marked as unavailable'}`,
            data: {
                id: menuItemId,
                deletionType: isHardDelete ? 'hard' : 'soft',
                deletedAt: new Date().toISOString(),
                deletedBy: authenticatedUser.email
            }
        });
    }
    catch (error) {
        logger.error('Menu item deletion failed', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to delete menu item');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.deleteMenuItemHandler = deleteMenuItemHandler;
//# sourceMappingURL=deleteMenuItem.js.map