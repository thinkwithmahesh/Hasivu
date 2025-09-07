"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandler = void 0;
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
    logger.error('Registration Lambda function error', error, { requestId: context.awsRequestId });
    if (error.name === 'ValidationError') {
        return createResponse(400, { error: error.message, details: error.details });
    }
    if (error.isCognitoError) {
        const statusCode = error.statusCode || 400;
        return createResponse(statusCode, {
            error: error.message || 'Registration failed',
            code: error.code
        });
    }
    return createResponse(500, { error: 'Internal server error' });
};
/**
 * User Registration Lambda Function Handler
 * Handles user registration with AWS Cognito and database storage
 */
const registerHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        logger.logFunctionStart('registerHandler', { requestId: context.awsRequestId });
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        logger.info('Processing registration request', {
            email: body.email,
            role: body.role,
            schoolId: body.schoolId,
            requestId: context.awsRequestId
        });
        // Validate input data
        const validationResult = await validator.validateRegistration(body);
        if (!validationResult.isValid) {
            return createResponse(400, {
                error: 'Validation failed',
                details: validationResult.errors
            });
        }
        const { email, password, firstName, lastName, phone, schoolId, role } = validationResult.sanitizedValue;
        // Validate school exists and is active
        const school = await db.school.findUnique({
            where: { id: schoolId },
            select: { id: true, name: true, isActive: true }
        });
        if (!school) {
            return createResponse(400, {
                error: 'Validation failed',
                details: [{ field: 'schoolId', message: 'School not found' }]
            });
        }
        if (!school.isActive) {
            return createResponse(400, {
                error: 'Validation failed',
                details: [{ field: 'schoolId', message: 'School is not accepting registrations' }]
            });
        }
        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email },
            select: { id: true, email: true }
        });
        if (existingUser) {
            return createResponse(409, {
                error: 'User already exists',
                details: [{ field: 'email', message: 'A user with this email already exists' }]
            });
        }
        // Create user in Cognito User Pool
        const cognitoResult = await cognito.signUp({
            email,
            password,
            firstName,
            lastName,
            phoneNumber: phone
        });
        // Store additional user data in database
        const user = await db.user.create({
            data: {
                email,
                firstName,
                lastName,
                phone,
                role,
                schoolId,
                cognitoUserId: cognitoResult.userSub,
                passwordHash: 'cognito-managed', // Password managed by Cognito
                isActive: true
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                schoolId: true,
                isActive: true,
                createdAt: true
            }
        });
        // If the role is 'student', create a student profile
        if (role === 'student') {
            await db.studentProfile.create({
                data: {
                    userId: user.id,
                    studentId: `STU-${Date.now()}-${user.id.slice(-4)}`,
                    name: `${firstName} ${lastName}`,
                    schoolId
                }
            });
        }
        const duration = Date.now() - startTime;
        logger.logFunctionEnd('register', { statusCode: 201, duration });
        logger.info('User registration successful', {
            userId: user.id,
            email: user.email,
            role: user.role,
            duration
        });
        return createResponse(201, {
            message: 'Registration successful',
            user: {
                ...user,
                school: {
                    id: school.id,
                    name: school.name
                }
            },
            requiresConfirmation: !cognitoResult.isConfirmed
        });
    }
    catch (error) {
        return handleError(error, context);
    }
};
exports.registerHandler = registerHandler;
