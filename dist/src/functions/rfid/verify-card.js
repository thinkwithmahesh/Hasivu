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
exports.handler = exports.verifyRfidCardHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const Joi = __importStar(require("joi"));
const prisma = new client_1.PrismaClient();
const verifyCardSchema = Joi.object({
    cardNumber: Joi.string()
        .required()
        .pattern(/^RFID-[A-Z0-9-]+$/),
    readerId: Joi.string().uuid().optional(),
    orderId: Joi.string().uuid().optional(),
    location: Joi.string().optional(),
    verificationData: Joi.object().optional().default({}),
});
async function validateRfidCard(cardNumber) {
    const card = await prisma.rFIDCard.findUnique({
        where: { cardNumber },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    isActive: true,
                    schoolId: true,
                },
            },
        },
    });
    if (!card) {
        throw new Error('RFID card not found');
    }
    if (!card.isActive) {
        throw new Error('RFID card is deactivated');
    }
    if (card.expiresAt && card.expiresAt <= new Date()) {
        throw new Error('RFID card has expired');
    }
    const student = await prisma.user.findUnique({
        where: { id: card.studentId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            schoolId: true,
        },
    });
    if (!student || !student.isActive) {
        throw new Error('Student account is inactive');
    }
    const school = await prisma.school.findUnique({
        where: { id: card.schoolId },
        select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
        },
    });
    if (!school || !school.isActive) {
        throw new Error('School is inactive');
    }
    return { card, student, school };
}
async function validateRfidReader(readerId) {
    const reader = await prisma.rFIDReader.findUnique({
        where: { id: readerId },
        select: {
            id: true,
            name: true,
            location: true,
            status: true,
            isActive: true,
            schoolId: true,
            lastHeartbeat: true,
        },
    });
    if (!reader) {
        throw new Error('RFID reader not found');
    }
    if (!reader.isActive) {
        throw new Error('RFID reader is inactive');
    }
    if (reader.status === 'offline') {
        const location = reader.location || '';
        logger_service_1.LoggerService.getInstance().warn('RFID reader is offline', {
            readerId,
            location,
        });
    }
    return reader;
}
async function validateOrderForDelivery(orderId, studentId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            student: {
                include: {
                    rfidCards: {
                        where: {
                            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                            isActive: true,
                        },
                        select: {
                            cardNumber: true,
                        },
                    },
                },
            },
            school: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
        },
    });
    if (!order) {
        throw new Error('Order not found');
    }
    if (order.studentId !== studentId) {
        throw new Error('Order does not belong to the specified student');
    }
    const deliverableStatuses = ['ready', 'out_for_delivery', 'preparing'];
    if (!deliverableStatuses.includes(order.status)) {
        throw new Error(`Order cannot be delivered. Current status: ${order.status}`);
    }
    const today = new Date();
    const deliveryDate = new Date(order.deliveryDate);
    if (deliveryDate.toDateString() !== today.toDateString()) {
        throw new Error('Order is not scheduled for delivery today');
    }
    return order;
}
async function recordDeliveryVerification(card, readerId, orderId, location, verificationData) {
    const verification = await prisma.deliveryVerification.create({
        data: {
            cardId: card.id,
            studentId: card.studentId,
            readerId: readerId || 'manual-verification',
            orderId: orderId ?? null,
            status: 'verified',
            verificationData: JSON.stringify({
                location: location ?? null,
                verificationData: verificationData || {},
            }),
            verifiedAt: new Date(),
        },
    });
    await prisma.rFIDCard.update({
        where: { id: card.id },
        data: { lastUsedAt: new Date() },
    });
    if (orderId) {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'delivered',
                deliveredAt: new Date(),
            },
        });
    }
    return verification;
}
function canPerformVerification(requestingUser, schoolId) {
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
async function createVerificationAuditLog(verificationId, cardId, userId, details) {
    try {
        await prisma.auditLog.create({
            data: {
                entityType: 'DeliveryVerification',
                entityId: verificationId,
                action: 'CREATE',
                changes: JSON.stringify(details),
                userId,
                createdById: userId,
                metadata: JSON.stringify({
                    action: 'DELIVERY_VERIFIED',
                    timestamp: new Date().toISOString(),
                    cardId,
                }),
            },
        });
    }
    catch (auditError) {
        logger_service_1.LoggerService.getInstance().warn('Failed to create audit log', auditError);
    }
}
const verifyRfidCardHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('RFID card verification request started', { requestId });
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        const requestBody = JSON.parse(event.body || '{}');
        const { error, value: verifyData } = verifyCardSchema.validate(requestBody);
        if (error) {
            logger.warn('Invalid verification request data', { requestId, error: error.details });
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid request data', 400, error.details);
        }
        const { cardNumber, readerId, orderId, location, verificationData } = verifyData;
        const { card, student, school } = await validateRfidCard(cardNumber);
        if (!canPerformVerification(authenticatedUser.user, school.id)) {
            logger.warn('Unauthorized verification attempt', {
                requestId,
                userId: authenticatedUser.userId,
                cardNumber,
                schoolId: school.id,
                userRole: authenticatedUser.role,
            });
            return (0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Insufficient permissions to perform RFID verification', 403);
        }
        let result;
        let reader = null;
        let order = null;
        const warnings = [];
        try {
            if (readerId) {
                reader = await validateRfidReader(readerId);
                if (reader.schoolId !== school.id) {
                    warnings.push('RFID reader belongs to a different school');
                }
            }
            if (orderId) {
                order = await validateOrderForDelivery(orderId, student.id);
                if (order.student.schoolId !== school.id) {
                    throw new Error('Order belongs to a different school');
                }
            }
            const verification = await recordDeliveryVerification(card, readerId, orderId, location ?? undefined, verificationData);
            result = {
                success: true,
                cardId: card.id,
                cardNumber: card.cardNumber,
                verificationId: verification.id,
                message: 'RFID card verified successfully',
                student: {
                    id: student.id,
                    name: `${student.firstName} ${student.lastName}`,
                    firstName: student.firstName || '',
                    lastName: student.lastName || '',
                    email: student.email,
                    role: student.role,
                },
                school: {
                    id: school.id,
                    name: school.name,
                    code: school.code,
                },
                order: order
                    ? {
                        id: order.id,
                        orderNumber: order.orderNumber,
                        status: 'delivered',
                        deliveryDate: order.deliveryDate,
                        totalAmount: order.totalAmount,
                    }
                    : undefined,
                reader: reader
                    ? {
                        id: reader.id,
                        name: reader.name,
                        location: reader.location || '',
                        status: reader.status,
                    }
                    : undefined,
                warnings: warnings.length > 0 ? warnings : undefined,
            };
            await createVerificationAuditLog(verification.id, card.id, authenticatedUser.userId, {
                cardNumber,
                studentId: student.id,
                schoolId: school.id,
                orderId,
                readerId,
                location,
                verifiedBy: authenticatedUser.email,
                timestamp: new Date().toISOString(),
            });
            logger.info('RFID card verified successfully', {
                requestId,
                verificationId: verification.id,
                cardNumber,
                studentId: student.id,
                orderId,
                verifiedBy: authenticatedUser.email,
            });
        }
        catch (validationError) {
            result = {
                success: false,
                cardId: card.id,
                cardNumber: card.cardNumber,
                message: 'RFID card verification failed',
                error: validationError.message,
                student: {
                    id: student.id,
                    name: `${student.firstName} ${student.lastName}`,
                    firstName: student.firstName || '',
                    lastName: student.lastName || '',
                    email: student.email,
                    role: student.role,
                },
                school: {
                    id: school.id,
                    name: school.name,
                    code: school.code,
                },
            };
            logger.warn('RFID card verification failed', {
                requestId,
                cardNumber,
                error: validationError.message,
                studentId: student.id,
            });
        }
        return (0, response_utils_1.createSuccessResponse)({
            message: result.success ? 'Verification completed successfully' : 'Verification failed',
            data: result,
        });
    }
    catch (error) {
        logger.error('RFID card verification error', error instanceof Error ? error : new Error(String(error)), {
            requestId,
        });
        return (0, response_utils_1.handleError)(error, 'Failed to verify RFID card');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.verifyRfidCardHandler = verifyRfidCardHandler;
exports.handler = exports.verifyRfidCardHandler;
//# sourceMappingURL=verify-card.js.map