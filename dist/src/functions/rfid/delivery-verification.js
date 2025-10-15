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
exports.handler = exports.deliveryVerificationHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const Joi = __importStar(require("joi"));
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
const deliveryVerificationSchema = Joi.object({
    cardId: Joi.string().required(),
    readerId: Joi.string().uuid().required(),
    orderId: Joi.string().uuid().optional(),
    location: Joi.object({
        latitude: Joi.number().optional(),
        longitude: Joi.number().optional(),
        venue: Joi.string().optional(),
        description: Joi.string().optional(),
    }).required(),
    metadata: Joi.object({
        signalStrength: Joi.number().optional(),
        readerVersion: Joi.string().optional(),
        timestamp: Joi.string().optional(),
    })
        .optional()
        .default({}),
});
async function validateRFIDCard(cardId) {
    const card = await prisma.rFIDCard.findFirst({
        where: {
            OR: [{ cardNumber: cardId }, { id: cardId }],
        },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    grade: true,
                    section: true,
                    schoolId: true,
                    parentId: true,
                    isActive: true,
                },
            },
        },
    });
    if (!card) {
        throw new Error('RFID card not found');
    }
    if (!card.isActive) {
        throw new Error('RFID card is inactive');
    }
    if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
        throw new Error('RFID card has expired');
    }
    if (!card.student) {
        throw new Error('RFID card is not associated with a student');
    }
    if (!card.student.isActive) {
        throw new Error('Student account is inactive');
    }
    return {
        id: card.id,
        cardNumber: card.cardNumber,
        student: card.student,
        schoolId: card.schoolId,
    };
}
async function findPendingOrder(studentId, orderId) {
    let order;
    if (orderId) {
        order = await prisma.order.findFirst({
            where: {
                id: orderId,
                studentId,
            },
        });
    }
    else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        order = await prisma.order.findFirst({
            where: {
                studentId,
                deliveryDate: {
                    gte: today,
                    lt: tomorrow,
                },
                status: {
                    in: ['confirmed', 'preparing', 'ready'],
                },
                paymentStatus: 'paid',
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }
    if (!order) {
        if (orderId) {
            throw new Error('Order not found or not eligible for delivery');
        }
        else {
            throw new Error('No pending orders found for today');
        }
    }
    const deliverableStatuses = ['confirmed', 'preparing', 'ready'];
    if (!deliverableStatuses.includes(order.status)) {
        throw new Error(`Order cannot be delivered. Current status: ${order.status}`);
    }
    if (order.paymentStatus !== 'paid') {
        throw new Error(`Order payment not confirmed. Payment status: ${order.paymentStatus}`);
    }
    return order;
}
async function validateRFIDReader(readerId) {
    const reader = await prisma.rFIDReader.findUnique({
        where: { id: readerId },
        select: {
            id: true,
            name: true,
            location: true,
            schoolId: true,
            isActive: true,
            lastHeartbeat: true,
        },
    });
    if (!reader) {
        throw new Error('RFID reader not found');
    }
    if (!reader.isActive) {
        throw new Error('RFID reader is inactive');
    }
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (reader.lastHeartbeat && new Date(reader.lastHeartbeat) < fiveMinutesAgo) {
        logger_service_1.LoggerService.getInstance().warn('RFID reader heartbeat is stale', {
            readerId,
            lastHeartbeat: reader.lastHeartbeat,
        });
    }
    return reader;
}
async function recordDeliveryVerification(order, student, reader, location, metadata) {
    const verificationId = (0, uuid_1.v4)();
    try {
        await prisma.$transaction(async (tx) => {
            await tx.deliveryVerification.create({
                data: {
                    id: verificationId,
                    orderId: order.id,
                    studentId: student.id,
                    readerId: reader.id,
                    cardId: order.cardId || null,
                    status: 'verified',
                    verificationData: JSON.stringify({
                        location,
                        readerInfo: metadata || {},
                    }),
                    verifiedAt: new Date(),
                },
            });
            await tx.order.update({
                where: { id: order.id },
                data: {
                    status: 'delivered',
                    deliveredAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            await tx.rFIDReader.update({
                where: { id: reader.id },
                data: {
                    lastHeartbeat: new Date(),
                },
            });
        });
        logger_service_1.LoggerService.getInstance().info('Delivery verification recorded', {
            verificationId,
            orderId: order.id,
            studentId: student.id,
            readerId: reader.id,
        });
        return verificationId;
    }
    catch (error) {
        logger_service_1.LoggerService.getInstance().error('Failed to record delivery verification', error);
        throw error;
    }
}
async function sendDeliveryNotifications(order, student, verification) {
    try {
        const notifications = [];
        const messageContent = {
            title: 'Meal Delivered Successfully! 🍽️',
            body: `${student.firstName}'s meal order #${order.orderNumber} has been delivered.`,
            details: {
                studentName: `${student.firstName} ${student.lastName}`,
                orderNumber: order.orderNumber,
                mealPeriod: order.mealPeriod,
                deliveredAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                verificationMethod: 'RFID Card',
            },
        };
        logger_service_1.LoggerService.getInstance().info('Delivery notification should be sent', {
            orderId: order.id,
            studentId: student.id,
            parentId: student.parentId,
            messageContent,
        });
        notifications.push('app');
        return {
            sent: true,
            channels: notifications,
        };
    }
    catch (error) {
        logger_service_1.LoggerService.getInstance().error('Failed to send delivery notifications', error, {
            orderId: order.id,
            studentId: student.id,
        });
        return {
            sent: false,
            channels: [],
        };
    }
}
function canPerformDeliveryVerification(requestingUser, schoolId) {
    const userRole = requestingUser.role;
    if (['super_admin', 'admin'].includes(userRole)) {
        return true;
    }
    if (['school_admin', 'staff', 'teacher'].includes(userRole) &&
        requestingUser.schoolId === schoolId) {
        return true;
    }
    return false;
}
const deliveryVerificationHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const startTime = Date.now();
    try {
        logger.info('Delivery verification request started', {
            requestId: context.awsRequestId,
            httpMethod: event.httpMethod,
        });
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        const requestBody = JSON.parse(event.body || '{}');
        const { error, value: verifyData } = deliveryVerificationSchema.validate(requestBody);
        if (error) {
            logger.warn('Invalid delivery verification request data', {
                requestId: context.awsRequestId,
                error: error.details,
            });
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid request data', 400);
        }
        const { cardId, readerId, orderId, location, metadata } = verifyData;
        const cardInfo = await validateRFIDCard(cardId);
        if (!canPerformDeliveryVerification(authenticatedUser.user, cardInfo.schoolId)) {
            logger.warn('Unauthorized delivery verification attempt', {
                requestId: context.awsRequestId,
                userId: authenticatedUser.user?.id,
                cardId,
                schoolId: cardInfo.schoolId,
            });
            return (0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Insufficient permissions to perform delivery verification', 403);
        }
        const reader = await validateRFIDReader(readerId);
        if (reader.schoolId !== cardInfo.student.schoolId) {
            return (0, response_utils_1.createErrorResponse)('SCHOOL_MISMATCH', "RFID reader does not belong to student's school", 403);
        }
        const order = await findPendingOrder(cardInfo.student.id, orderId);
        const verificationId = await recordDeliveryVerification(order, cardInfo.student, reader, location, metadata);
        const notifications = await sendDeliveryNotifications(order, cardInfo.student, {
            verificationId,
            reader,
            location,
        });
        const school = await prisma.school.findUnique({
            where: { id: cardInfo.student.schoolId },
            select: { id: true, name: true },
        });
        const response = {
            success: true,
            verificationId,
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                status: 'delivered',
                deliveredAt: new Date(),
            },
            student: {
                id: cardInfo.student.id,
                firstName: cardInfo.student.firstName,
                lastName: cardInfo.student.lastName,
                grade: cardInfo.student.grade,
                section: cardInfo.student.section,
            },
            school: {
                id: school?.id || cardInfo.student.schoolId,
                name: school?.name || 'Unknown School',
            },
            delivery: {
                verifiedBy: reader.name,
                location,
                timestamp: new Date(),
                method: 'rfid',
            },
            notifications,
        };
        const duration = Date.now() - startTime;
        logger.info('Delivery verification completed successfully', {
            verificationId,
            orderId: order.id,
            studentId: cardInfo.student.id,
            duration,
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: `Delivery verified for ${cardInfo.student.firstName} ${cardInfo.student.lastName}`,
            data: response,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Delivery verification failed', error, {
            duration,
            requestId: context.awsRequestId,
        });
        return (0, response_utils_1.handleError)(error, 'Failed to verify delivery');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.deliveryVerificationHandler = deliveryVerificationHandler;
exports.handler = exports.deliveryVerificationHandler;
//# sourceMappingURL=delivery-verification.js.map