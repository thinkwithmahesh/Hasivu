"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileHandler = void 0;
const cognito_service_1 = require("../../services/cognito.service");
const database_service_1 = require("../../services/database.service");
const logger_1 = require("../../utils/logger");
const validation_service_1 = require("../../services/validation.service");
// Initialize services
const cognito = cognito_service_1.CognitoServiceClass.getInstance();
const db = database_service_1.DatabaseService.getInstance();
const logger = logger_1.logger;
const validator = validation_service_1.ValidationService.getInstance();
// Common Lambda response helper
const createResponse = (statusCode, body, headers = {}) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        ...headers
    },
    body: JSON.stringify(body)
});
// Error handling helper
const handleError = (error, context) => {
    logger.error('Update profile Lambda function error', error, { requestId: context.awsRequestId });
    if (error.name === 'ValidationError') {
        return createResponse(400, { error: error.message, details: error.details });
    }
    if (error.isCognitoError) {
        const statusCode = error.statusCode || 400;
        return createResponse(statusCode, {
            error: error.message || 'Profile update failed',
            code: error.code
        });
    }
    return createResponse(500, { error: 'Internal server error' });
};
/**
 * Update User Profile Lambda Function Handler
 * Updates user profile in both Cognito and database
 */
const updateProfileHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        logger.logFunctionStart('updateProfileHandler', { requestId: context.awsRequestId });
        // Get Cognito user ID from the event
        const cognitoUserId = event.requestContext.authorizer?.claims?.sub;
        if (!cognitoUserId) {
            return createResponse(401, { error: 'Unauthorized - No user ID found' });
        }
        // Parse and validate request body
        const body = JSON.parse(event.body || '{}');
        const validationResult = await validator.validateProfileUpdate(body);
        if (!validationResult.isValid) {
            return createResponse(400, {
                error: 'Validation failed',
                details: validationResult.errors
            });
        }
        const validatedData = validationResult.sanitizedValue;
        logger.info('Processing profile update request', {
            cognitoUserId,
            fieldsToUpdate: Object.keys(validatedData),
            requestId: context.awsRequestId
        });
        // Get current user from database
        const currentUser = await db.user.findFirst({
            where: { cognitoUserId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                schoolId: true,
                isActive: true,
                preferences: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!currentUser) {
            return createResponse(404, { error: 'User not found' });
        }
        // Get access token from Authorization header
        const authHeader = event.headers.Authorization || event.headers.authorization;
        const accessToken = authHeader?.replace('Bearer ', '');
        if (!accessToken) {
            return createResponse(401, { error: 'Access token required for profile updates' });
        }
        // Prepare updates for database
        const databaseUpdates = {};
        // Prepare updates for Cognito
        const cognitoUpdates = {};
        // Handle name updates
        if (validatedData.firstName && validatedData.firstName !== currentUser.firstName) {
            databaseUpdates.firstName = validatedData.firstName;
            cognitoUpdates.given_name = validatedData.firstName;
        }
        if (validatedData.lastName && validatedData.lastName !== currentUser.lastName) {
            databaseUpdates.lastName = validatedData.lastName;
            cognitoUpdates.family_name = validatedData.lastName;
        }
        // Handle phone update
        if (validatedData.phone !== undefined && validatedData.phone !== currentUser.phone) {
            databaseUpdates.phone = validatedData.phone;
            if (validatedData.phone) {
                cognitoUpdates.phone_number = validatedData.phone;
            }
        }
        // Handle preferences update
        if (validatedData.preferences !== undefined) {
            const currentPreferences = currentUser.preferences || {};
            const newPreferences = { ...currentPreferences, ...validatedData.preferences };
            databaseUpdates.preferences = newPreferences;
        }
        // Update Cognito attributes if any
        if (Object.keys(cognitoUpdates).length > 0) {
            try {
                await cognito.updateUserAttributes(accessToken, cognitoUpdates);
                logger.info('Cognito attributes updated successfully', {
                    attributes: Object.keys(cognitoUpdates),
                    cognitoUserId
                });
            }
            catch (cognitoError) {
                logger.error('Cognito update failed', cognitoError, { cognitoUserId });
                throw cognitoError;
            }
        }
        // Update database if any changes
        let updatedUser = currentUser;
        if (Object.keys(databaseUpdates).length > 0) {
            updatedUser = await db.user.update({
                where: { id: currentUser.id },
                data: databaseUpdates,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    schoolId: true,
                    isActive: true,
                    preferences: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            logger.info('Database profile updated successfully', {
                userId: currentUser.id,
                updatedFields: Object.keys(databaseUpdates)
            });
        }
        // Get school information
        const school = updatedUser.schoolId ? await db.school.findUnique({
            where: { id: updatedUser.schoolId },
            select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                postalCode: true
            }
        }) : null;
        const duration = Date.now() - startTime;
        logger.logFunctionEnd("handler", { statusCode: 200, duration });
        logger.info('Profile updated successfully', {
            userId: updatedUser.id,
            email: updatedUser.email,
            updatedFields: Object.keys(databaseUpdates),
            duration
        });
        return createResponse(200, {
            message: 'Profile updated successfully',
            user: {
                ...updatedUser,
                school
            }
        });
    }
    catch (error) {
        return handleError(error, context);
    }
};
exports.updateProfileHandler = updateProfileHandler;
