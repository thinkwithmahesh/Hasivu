"use strict";
/**
 * HASIVU Platform - Delete Menu Item Lambda Function
 * Handles: DELETE /api/v1/menu/items/{id}
 * Implements Story 2.1: Product Catalog Foundation - Menu Item Deletion
 * Production-ready with comprehensive validation and error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMenuItemHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const Joi = require("joi");
// Initialize database client
const prisma = new client_1.PrismaClient();
// Delete request validation schema
const deleteRequestSchema = Joi.object({
    hard: Joi.boolean().optional().default(false)
});
/**
 * Validation helper - check if user can delete menu item
 */
function canDeleteMenuItem(user) {
    const allowedRoles = ['super_admin', 'admin', 'school_admin', 'staff'];
    return allowedRoles.includes(user.role);
}
/**
 * Create audit log entry for menu item deletion
 */
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
/**
 * Delete Menu Item Lambda Handler
 * DELETE /api/v1/menu/items/{id}
 */
const deleteMenuItemHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Delete menu item request started', { requestId });
        // Authenticate request
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        // Check authentication success and extract user
        if (!authResult.success || !authResult.user) {
            logger.warn('Authentication failed', { requestId, error: authResult.error });
            return (0, response_utils_1.createErrorResponse)('Authentication failed', 401, 'AUTHENTICATION_FAILED');
        }
        const authenticatedUser = authResult.user;
        // Validate authorization
        if (!canDeleteMenuItem(authenticatedUser)) {
            logger.warn('Insufficient permissions for menu item deletion', {
                requestId,
                userId: authenticatedUser.id,
                role: authenticatedUser.role
            });
            return (0, response_utils_1.createErrorResponse)('Insufficient permissions to delete menu items', 403, 'UNAUTHORIZED');
        }
        // Extract and validate menu item ID
        const menuItemId = event.pathParameters?.id;
        if (!menuItemId) {
            logger.warn('Missing menu item ID in path parameters', { requestId });
            return (0, response_utils_1.createErrorResponse)('Menu item ID is required', 400, 'VALIDATION_ERROR');
        }
        // Validate UUID format
        const validationService = validation_service_1.ValidationService.getInstance();
        try {
            validationService.validateUUID(menuItemId, 'Menu item ID');
        }
        catch (error) {
            logger.warn('Invalid menu item ID format', { requestId, menuItemId, error: error.message });
            return (0, response_utils_1.createErrorResponse)('Invalid menu item ID format', 400, 'VALIDATION_ERROR');
        }
        // Parse and validate query parameters
        const queryParams = event.queryStringParameters || {};
        const { error, value: deleteOptions } = deleteRequestSchema.validate(queryParams);
        if (error) {
            logger.warn('Invalid query parameters', { requestId, error: error.details });
            return (0, response_utils_1.createErrorResponse)('Invalid query parameters', 400, 'VALIDATION_ERROR');
        }
        const isHardDelete = deleteOptions.hard;
        // Check if menu item exists
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
        // Check school authorization (school admin can only delete items from their school)
        if (authenticatedUser.role === 'school_admin' && authenticatedUser.schoolId !== existingMenuItem.schoolId) {
            logger.warn('Cross-school menu item deletion attempt', {
                requestId,
                userId: authenticatedUser.id,
                userSchoolId: authenticatedUser.schoolId,
                menuItemSchoolId: existingMenuItem.schoolId
            });
            return (0, response_utils_1.createErrorResponse)('Cannot delete menu items from other schools', 403, 'UNAUTHORIZED');
        }
        // Perform deletion based on type
        let result;
        if (isHardDelete) {
            // Hard delete - permanently remove from database
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
            // Soft delete - mark as inactive
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
        // Create audit log
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
