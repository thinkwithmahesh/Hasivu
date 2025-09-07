"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.verifyRfidCardHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const Joi = require("joi");
// Initialize database client
const prisma = new client_1.PrismaClient();
// RFID Card verification request schema
const verifyCardSchema = Joi.object({
    cardNumber: Joi.string().required().pattern(/^RFID-[A-Z0-9-]+$/),
    readerId: Joi.string().uuid().optional(),
    orderId: Joi.string().uuid().optional(),
    location: Joi.string().optional(),
    verificationData: Joi.object().optional().default({})
});
/**
 * Verify RFID card validity and get associated information
 */
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
                    schoolId: true
                }
            },
        }
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
    // Get student and school info separately
    const student = await prisma.user.findUnique({
        where: { id: card.studentId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            schoolId: true
        }
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
            isActive: true
        }
    });
    if (!school || !school.isActive) {
        throw new Error('School is inactive');
    }
    return { card, student, school };
}
/**
 * Validate RFID reader if provided
 */
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
            lastHeartbeat: true
        }
    });
    if (!reader) {
        throw new Error('RFID reader not found');
    }
    if (!reader.isActive) {
        throw new Error('RFID reader is inactive');
    }
    if (reader.status === 'offline') {
        // Log warning but don't block verification
        logger_service_1.LoggerService.getInstance().warn('RFID reader is offline', {
            readerId,
            location: reader.location
        });
    }
    return reader;
}
/**
 * Validate order if provided and check if it's ready for delivery
 */
async function validateOrderForDelivery(orderId, studentId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            student: {
                include: {
                    rfidCards: {
                        where: {
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gt: new Date() } }
                            ],
                            isActive: true
                        },
                        select: {
                            cardNumber: true
                        }
                    }
                }
            },
            school: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            }
        }
    });
    if (!order) {
        throw new Error('Order not found');
    }
    // Check if order belongs to the correct student
    if (order.studentId !== studentId) {
        throw new Error('Order does not belong to the specified student');
    }
    // Check order status - should be ready for delivery
    const deliverableStatuses = ['ready', 'out_for_delivery', 'preparing'];
    if (!deliverableStatuses.includes(order.status)) {
        throw new Error(`Order cannot be delivered. Current status: ${order.status}`);
    }
    // Check delivery date
    const today = new Date();
    const deliveryDate = new Date(order.deliveryDate);
    if (deliveryDate.toDateString() !== today.toDateString()) {
        throw new Error('Order is not scheduled for delivery today');
    }
    return order;
}
/**
 * Record delivery verification
 */
async function recordDeliveryVerification(card, readerId, orderId, location, verificationData) {
    const verification = await prisma.deliveryVerification.create({
        data: {
            cardId: card.id,
            studentId: card.studentId,
            readerId: readerId || null,
            orderId: orderId || null,
            status: 'verified',
            verificationData: JSON.stringify({
                location: location || null,
                verificationData: verificationData || {}
            }),
            verifiedAt: new Date()
        }
    });
    // Update card last used timestamp
    await prisma.rFIDCard.update({
        where: { id: card.id },
        data: { lastUsedAt: new Date() }
    });
    // Update order status if order was provided
    if (orderId) {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'delivered',
                deliveredAt: new Date()
            }
        });
    }
    return verification;
}
/**
 * Check if user can perform RFID verification
 */
function canPerformVerification(requestingUser, schoolId) {
    const userRole = requestingUser.role;
    // Super admin and admin can verify anywhere
    if (['super_admin', 'admin'].includes(userRole)) {
        return true;
    }
    // School admin, staff, and teachers can verify in their school
    if (['school_admin', 'staff', 'teacher'].includes(userRole) &&
        requestingUser.schoolId === schoolId) {
        return true;
    }
    return false;
}
/**
 * Create audit log entry for verification
 */
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
                    cardId
                })
            }
        });
    }
    catch (auditError) {
        // If audit log creation fails, log the error but don't fail the verification
        logger_service_1.LoggerService.getInstance().warn('Failed to create audit log', auditError);
    }
}
/**
 * Verify RFID Card Lambda Handler
 * POST /api/v1/rfid/verify
 */
const verifyRfidCardHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('RFID card verification request started', { requestId });
        // Authenticate request
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        // Parse and validate request body
        const requestBody = JSON.parse(event.body || '{}');
        const { error, value: verifyData } = verifyCardSchema.validate(requestBody);
        if (error) {
            logger.warn('Invalid verification request data', { requestId, error: error.details });
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid request data', undefined, 'VALIDATION_ERROR');
        }
        const { cardNumber, readerId, orderId, location, verificationData } = verifyData;
        // Validate RFID card
        const { card, student, school } = await validateRfidCard(cardNumber);
        // Authorization check
        if (!canPerformVerification(authenticatedUser.user, school.id)) {
            logger.warn('Unauthorized verification attempt', {
                requestId,
                userId: authenticatedUser.id,
                cardNumber,
                schoolId: school.id,
                userRole: authenticatedUser.role
            });
            return (0, response_utils_1.createErrorResponse)(403, 'Insufficient permissions to perform RFID verification', undefined, 'UNAUTHORIZED');
        }
        let result;
        let reader = null;
        let order = null;
        const warnings = [];
        try {
            // Validate reader if provided
            if (readerId) {
                reader = await validateRfidReader(readerId);
                // Check if reader belongs to the same school
                if (reader.schoolId !== school.id) {
                    warnings.push('RFID reader belongs to a different school');
                }
            }
            // Validate order if provided
            if (orderId) {
                order = await validateOrderForDelivery(orderId, student.id);
                // Check if order belongs to the same school
                if (order.student.schoolId !== school.id) {
                    throw new Error('Order belongs to a different school');
                }
            }
            // Record delivery verification
            const verification = await recordDeliveryVerification(card, readerId, orderId, location, verificationData);
            result = {
                success: true,
                cardId: card.id,
                cardNumber: card.cardNumber,
                verificationId: verification.id,
                message: 'RFID card verified successfully',
                student: {
                    id: student.id,
                    name: `${student.firstName} ${student.lastName}`,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    email: student.email,
                    role: student.role
                },
                school: {
                    id: school.id,
                    name: school.name,
                    code: school.code
                },
                order: order ? {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: 'delivered', // Updated status
                    deliveryDate: order.deliveryDate,
                    totalAmount: order.totalAmount
                } : undefined,
                reader: reader ? {
                    id: reader.id,
                    name: reader.name,
                    location: reader.location,
                    status: reader.status
                } : undefined,
                warnings: warnings.length > 0 ? warnings : undefined
            };
            // Create audit log
            await createVerificationAuditLog(verification.id, card.id, authenticatedUser.id, {
                cardNumber,
                studentId: student.id,
                schoolId: school.id,
                orderId,
                readerId,
                location,
                verifiedBy: authenticatedUser.email,
                timestamp: new Date().toISOString()
            });
            logger.info('RFID card verified successfully', {
                requestId,
                verificationId: verification.id,
                cardNumber,
                studentId: student.id,
                orderId,
                verifiedBy: authenticatedUser.email
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
                    firstName: student.firstName,
                    lastName: student.lastName,
                    email: student.email,
                    role: student.role
                },
                school: {
                    id: school.id,
                    name: school.name,
                    code: school.code
                }
            };
            logger.warn('RFID card verification failed', {
                requestId,
                cardNumber,
                error: validationError.message,
                studentId: student.id
            });
        }
        return (0, response_utils_1.createSuccessResponse)({
            message: result.success ? 'Verification completed successfully' : 'Verification failed',
            data: result
        });
    }
    catch (error) {
        logger.error('RFID card verification error', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to verify RFID card');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.verifyRfidCardHandler = verifyRfidCardHandler;
exports.handler = exports.verifyRfidCardHandler;
