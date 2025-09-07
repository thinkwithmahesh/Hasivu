"use strict";
/**
 * Logout Lambda Function
 * Handles: POST /auth/logout
 * Implements Epic 1: Authentication & Authorization - User Logout
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const response_utils_1 = require("../shared/response.utils");
const database_service_1 = require("../../services/database.service");
const jwt = require("jsonwebtoken");
/**
 * Extract and validate access token from Authorization header
 */
function extractAccessToken(authHeader) {
    if (!authHeader) {
        return null;
    }
    if (!authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
}
/**
 * Invalidate access token by ending the session
 */
async function invalidateAccessToken(accessToken) {
    try {
        // Verify and decode the access token
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET || 'default_access_secret');
        if (!decoded.sessionId || !decoded.userId) {
            logger_1.logger.warn('Invalid access token structure during logout', { sessionId: decoded.sessionId });
            return; // Don't throw error for logout
        }
        // Deactivate the session
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
        // Don't throw error for logout - always succeed gracefully
    }
}
/**
 * Invalidate refresh token (for session-based auth, this is similar to access token)
 */
async function invalidateRefreshToken(refreshToken) {
    try {
        // Verify and decode the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'default_refresh_secret');
        if (!decoded.sessionId || !decoded.userId) {
            logger_1.logger.warn('Invalid refresh token structure during logout', { sessionId: decoded.sessionId });
            return; // Don't throw error for logout
        }
        // Deactivate the session
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
        // Don't throw error for logout - always succeed gracefully
    }
}
/**
 * Invalidate all user sessions (optional)
 */
async function invalidateAllUserSessions(userId) {
    try {
        // Deactivate all active sessions for the user
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
        // Don't throw error for logout - always succeed gracefully
    }
}
/**
 * Logout Lambda Function Handler
 */
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.info('Logout handler starting', {
        requestId: context.awsRequestId,
        httpMethod: event.httpMethod
    });
    try {
        // Handle OPTIONS request for CORS
        if (event.httpMethod === 'OPTIONS') {
            return (0, response_utils_1.createSuccessResponse)({
                message: 'CORS preflight successful'
            });
        }
        // Only allow POST method
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed', undefined, 'METHOD_NOT_ALLOWED');
        }
        // Parse request body
        const requestBody = JSON.parse(event.body || '{}');
        logger_1.logger.info('Processing logout request', {
            hasRefreshToken: !!requestBody.refreshToken,
            hasAuthHeader: !!(event.headers.Authorization || event.headers.authorization)
        });
        // Extract access token from Authorization header
        const authHeader = event.headers.Authorization || event.headers.authorization;
        const accessToken = extractAccessToken(authHeader);
        // Perform logout operations (gracefully handle errors)
        const logoutPromises = [];
        // Invalidate access token if present
        if (accessToken) {
            logoutPromises.push(invalidateAccessToken(accessToken));
        }
        // Invalidate refresh token if provided
        if (requestBody.refreshToken) {
            logoutPromises.push(invalidateRefreshToken(requestBody.refreshToken));
        }
        // Wait for all logout operations to complete
        await Promise.allSettled(logoutPromises);
        // Optional: If user wants to logout from all devices
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
        // For logout, we always return success to avoid client-side issues
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
