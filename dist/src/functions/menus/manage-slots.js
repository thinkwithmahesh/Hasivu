"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.manageMenuSlotsHandler = void 0;
const logger_1 = require("../../shared/utils/logger");
const database_service_1 = require("../../shared/database.service");
const jwt_service_1 = require("../../shared/services/jwt.service");
const db = database_service_1.databaseService.getPrismaClient();
function parseRequestBody(event) {
    try {
        return event.body ? JSON.parse(event.body) : {};
    }
    catch (error) {
        throw new Error('Invalid JSON in request body');
    }
}
async function authenticateLambda(event) {
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        throw new Error('No authentication token provided');
    }
    return jwt_service_1.jwtService.verifyToken(token);
}
const manageMenuSlotsHandler = async (event, context) => {
    const startTime = Date.now();
    const requestId = context.awsRequestId;
    logger_1.logger.info('Menu slot management request received', {
        requestId,
        method: event.httpMethod,
        path: event.path,
        pathParameters: event.pathParameters
    });
    try {
        const authenticatedUser = await authenticateLambda(event);
        const method = event.httpMethod;
        const pathParameters = event.pathParameters || {};
        const duration = Date.now() - startTime;
        logger_1.logger.warn('Menu slot management schema incompatible', {
            requestId,
            method,
            pathParameters,
            duration,
            message: 'Function requires rewrite for current MenuItemSlot schema'
        });
        return {
            statusCode: 501,
            body: JSON.stringify({
                error: 'Menu slot management not implemented',
                message: 'Function requires schema migration for MenuItemSlot model',
                details: {
                    currentSchema: 'dailyMenuId, plannedQuantity, availableQuantity, category',
                    expectedSchema: 'mealSlotId, quantity, portionSize, status',
                    needsRewrite: true
                },
                method,
                path: event.path,
                requestId
            })
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.error('Menu slot management authentication failed', {
            requestId,
            duration,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            stack: error.stack
        });
        return {
            statusCode: 401,
            body: JSON.stringify({
                error: 'Authentication failed',
                requestId
            })
        };
    }
};
exports.manageMenuSlotsHandler = manageMenuSlotsHandler;
exports.handler = exports.manageMenuSlotsHandler;
//# sourceMappingURL=manage-slots.js.map