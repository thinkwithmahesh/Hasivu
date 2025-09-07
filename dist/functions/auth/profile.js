"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfileHandler = void 0;
const database_service_1 = require("../../services/database.service");
const logger_1 = require("../../utils/logger");
// Initialize database client
const db = database_service_1.DatabaseService.client;
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
/**
 * Get User Profile Lambda Function Handler
 * Retrieves authenticated user's profile information
 */
const getUserProfileHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        logger_1.logger.info('Profile handler starting', {
            requestId: context.awsRequestId,
            cognitoUserId: event.requestContext.authorizer?.claims?.sub
        });
        // Get Cognito user ID from the event
        const cognitoUserId = event.requestContext.authorizer?.claims?.sub;
        if (!cognitoUserId) {
            return createResponse(401, { error: 'Unauthorized - No user ID found' });
        }
        // Get user from database
        const user = await db.user.findFirst({
            where: { cognitoUserId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                schoolId: true,
                parentId: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            return createResponse(404, { error: 'User not found' });
        }
        // Get school information
        const school = user.schoolId ? await db.school.findUnique({
            where: { id: user.schoolId },
            select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                postalCode: true
            }
        }) : null;
        // Get additional role-specific information
        let roleSpecificInfo = null;
        if (user.role === 'student') {
            // Student-specific info would come from User table or related tables
            // For now, we'll skip this since studentProfile doesn't exist in schema
            roleSpecificInfo = {
                parentId: user.parentId
                // class, section, rollNumber would need to be added to User model or separate table
            };
        }
        // Get recent orders for students
        let recentOrders = null;
        if (user.role === 'student' && roleSpecificInfo) {
            recentOrders = await db.order.findMany({
                where: { studentId: user.id },
                select: {
                    id: true,
                    totalAmount: true,
                    status: true,
                    createdAt: true,
                    orderItems: {
                        select: {
                            quantity: true,
                            menuItem: {
                                select: {
                                    name: true,
                                    price: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 5 // Last 5 orders
            });
        }
        // Get notification preferences (using WhatsApp messages as notifications for now)
        const notifications = await db.whatsAppMessage.count({
            where: {
                userId: user.id,
                status: 'sent'
            }
        });
        const duration = Date.now() - startTime;
        logger_1.logger.info('Profile handler completed successfully', {
            statusCode: 200,
            duration,
            requestId: context.awsRequestId
        });
        logger_1.logger.info('Profile retrieved successfully', {
            userId: user.id,
            email: user.email,
            duration
        });
        return createResponse(200, {
            user: {
                ...user,
                school,
                roleSpecificInfo,
                ...(recentOrders && { recentOrders }),
                notificationCount: notifications
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get profile Lambda function error', {
            error: error instanceof Error ? error.message : String(error),
            requestId: context.awsRequestId
        });
        return createResponse(500, { error: 'Internal server error' });
    }
};
exports.getUserProfileHandler = getUserProfileHandler;
