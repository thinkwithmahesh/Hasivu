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
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const response_utils_1 = require("../shared/response.utils");
const database_service_1 = require("../../services/database.service");
const jwt = __importStar(require("jsonwebtoken"));
function extractAccessToken(authHeader) {
    if (!authHeader) {
        return null;
    }
    if (!authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
async function invalidateAccessToken(accessToken) {
    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET || 'default_access_secret');
        if (!decoded.sessionId || !decoded.userId) {
            logger_1.logger.warn('Invalid access token structure during logout', { sessionId: decoded.sessionId });
            return;
        }
        await database_service_1.DatabaseService.client.authSession.updateMany({
            where: {
                sessionId: decoded.sessionId,
                userId: decoded.userId,
                isActive: true
            },
            data: {
                isActive: false,
                updatedAt: new Date()
            }
        });
        logger_1.logger.info('Session invalidated', {
            sessionId: decoded.sessionId,
            userId: decoded.userId
        });
    }
    catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            logger_1.logger.warn('Invalid access token format during logout');
        }
        else if (error instanceof jwt.TokenExpiredError) {
            logger_1.logger.info('Expired access token during logout');
        }
        else {
            logger_1.logger.error('Error invalidating access token', error);
        }
    }
}
async function invalidateRefreshToken(refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'default_refresh_secret');
        if (!decoded.sessionId || !decoded.userId) {
            logger_1.logger.warn('Invalid refresh token structure during logout', { sessionId: decoded.sessionId });
            return;
        }
        const result = await database_service_1.DatabaseService.client.authSession.updateMany({
            where: {
                sessionId: decoded.sessionId,
                userId: decoded.userId,
                isActive: true
            },
            data: {
                isActive: false,
                updatedAt: new Date()
            }
        });
        if (result.count > 0) {
            logger_1.logger.info('Session deactivated via refresh token', {
                sessionId: decoded.sessionId,
                userId: decoded.userId
            });
        }
        else {
            logger_1.logger.warn('Session not found in database', {
                sessionId: decoded.sessionId,
                userId: decoded.userId
            });
        }
    }
    catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            logger_1.logger.warn('Invalid refresh token format during logout');
        }
        else if (error instanceof jwt.TokenExpiredError) {
            logger_1.logger.info('Expired refresh token during logout');
        }
        else {
            logger_1.logger.error('Error invalidating refresh token', error);
        }
    }
}
async function invalidateAllUserSessions(userId) {
    try {
        const result = await database_service_1.DatabaseService.client.authSession.updateMany({
            where: {
                userId: userId,
                isActive: true
            },
            data: {
                isActive: false,
                updatedAt: new Date()
            }
        });
        logger_1.logger.info('All user sessions invalidated', { userId, sessionCount: result.count });
    }
    catch (error) {
        logger_1.logger.error('Error invalidating all user sessions', error);
    }
}
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.info('Logout handler starting', {
        requestId: context.awsRequestId,
        httpMethod: event.httpMethod
    });
    try {
        if (event.httpMethod === 'OPTIONS') {
            return (0, response_utils_1.createSuccessResponse)({
                message: 'CORS preflight successful'
            });
        }
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed', undefined, 'METHOD_NOT_ALLOWED');
        }
        const requestBody = JSON.parse(event.body || '{}');
        logger_1.logger.info('Processing logout request', {
            hasRefreshToken: !!requestBody.refreshToken,
            hasAuthHeader: !!(event.headers.Authorization || event.headers.authorization)
        });
        const authHeader = event.headers.Authorization || event.headers.authorization;
        const accessToken = extractAccessToken(authHeader);
        const logoutPromises = [];
        if (accessToken) {
            logoutPromises.push(invalidateAccessToken(accessToken));
        }
        if (requestBody.refreshToken) {
            logoutPromises.push(invalidateRefreshToken(requestBody.refreshToken));
        }
        await Promise.allSettled(logoutPromises);
        const logoutAll = event.queryStringParameters?.logoutAll === 'true';
        if (logoutAll && accessToken) {
            try {
                const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET || 'default_access_secret');
                if (decoded.userId) {
                    await invalidateAllUserSessions(decoded.userId);
                }
            }
            catch (error) {
                logger_1.logger.warn('Could not invalidate all sessions', error);
            }
        }
        const duration = Date.now() - startTime;
        logger_1.logger.info('Logout handler completed successfully', {
            statusCode: 200,
            duration,
            requestId: context.awsRequestId
        });
        logger_1.logger.info('Logout completed successfully', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!requestBody.refreshToken,
            logoutAll: logoutAll,
            duration: duration
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                loggedOut: true,
                timestamp: new Date().toISOString()
            },
            message: 'Logout successful'
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.info('Logout handler completed with partial success', {
            statusCode: 200,
            duration,
            requestId: context.awsRequestId,
            note: 'Still return 200 for logout'
        });
        logger_1.logger.error('Logout error (gracefully handled)', error);
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                loggedOut: true,
                timestamp: new Date().toISOString()
            },
            message: 'Logout completed'
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=logout.js.map