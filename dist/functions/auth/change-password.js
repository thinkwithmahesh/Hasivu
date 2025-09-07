"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordHandler = void 0;
const cognito_service_1 = require("../shared/cognito.service");
const database_service_1 = require("../shared/database.service");
const logger_1 = require("../../utils/logger");
const validation_service_1 = require("../shared/validation.service");
// Initialize services
const cognito = cognito_service_1.CognitoService;
const db = database_service_1.DatabaseService;
const validator = validation_service_1.ValidationService.getInstance();
// Common Lambda response helper
const createResponse = (statusCode, body, headers = {}) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,PATCH',
        ...headers
    },
    body: JSON.stringify(body)
});
// Error handling helper
const handleError = (error, context) => {
    logger_1.logger.error('Change password Lambda function error', error, { requestId: context.awsRequestId });
    if (error.name === 'ValidationError') {
        return createResponse(400, {
            error: 'VALIDATION_ERROR',
            message: error.message,
            details: error.details
        });
    }
    if (error.name === 'NotAuthorizedException') {
        return createResponse(401, {
            error: 'INVALID_CREDENTIALS',
            message: 'Current password is incorrect'
        });
    }
    if (error.name === 'InvalidPasswordException') {
        return createResponse(400, {
            error: 'INVALID_PASSWORD',
            message: 'New password does not meet security requirements'
        });
    }
    return createResponse(500, {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while changing password'
    });
};
/**
 * Main Lambda handler for change password
 */
const changePasswordHandler = async (event, context) => {
    try {
        logger_1.logger.info('Change password request received', {
            requestId: context.awsRequestId,
            headers: event.headers
        });
        // Handle CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            return createResponse(200, { message: 'CORS preflight successful' });
        }
        // Validate HTTP method
        if (event.httpMethod !== 'PATCH') {
            return createResponse(405, {
                error: 'METHOD_NOT_ALLOWED',
                message: 'Only PATCH method is allowed'
            });
        }
        // Parse request body
        let body;
        try {
            body = JSON.parse(event.body || '{}');
        }
        catch (error) {
            return createResponse(400, {
                error: 'INVALID_JSON',
                message: 'Request body must be valid JSON'
            });
        }
        // Validate required fields
        const validation = await validator.validatePasswordChange(body);
        if (!validation.isValid) {
            return createResponse(400, {
                error: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: validation.errors
            });
        }
        const { currentPassword, newPassword } = body;
        // Get user from authorization header
        const authorization = event.headers.Authorization || event.headers.authorization;
        if (!authorization) {
            return createResponse(401, {
                error: 'AUTHORIZATION_REQUIRED',
                message: 'Authorization header is required'
            });
        }
        const token = authorization.replace('Bearer ', '');
        // Verify token and get user
        const user = await cognito.verifyToken(token);
        if (!user) {
            return createResponse(401, {
                error: 'INVALID_TOKEN',
                message: 'Invalid or expired token'
            });
        }
        // Change password in Cognito
        await cognito.changePassword(token, currentPassword, newPassword);
        // Log successful password change
        logger_1.logger.info('Password changed successfully', {
            userId: user.sub,
            username: user.username,
            requestId: context.awsRequestId
        });
        // Update last modified timestamp in database
        try {
            await db.user.update({
                where: { id: user.sub },
                data: { updatedAt: new Date() }
            });
        }
        catch (dbError) {
            // Don't fail the request if database update fails
            logger_1.logger.warn('Failed to update user timestamp', { error: dbError, userId: user.sub });
        }
        return createResponse(200, {
            message: 'Password changed successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        return handleError(error, context);
    }
};
exports.changePasswordHandler = changePasswordHandler;
exports.default = exports.changePasswordHandler;
