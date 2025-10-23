"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRfidCardHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const prisma = new client_1.PrismaClient();
async function getRfidCardDetails(cardNumber) {
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
                },
            },
            deliveryVerifications: {
                orderBy: { verifiedAt: 'desc' },
                take: 10,
                include: {
                    reader: {
                        select: {
                            id: true,
                            name: true,
                            location: true,
                        },
                    },
                },
            },
        },
    });
    if (!card) {
        throw new Error('RFID card not found');
    }
    return card;
}
async function getUsageStatistics(cardId) {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const totalVerifications = await prisma.deliveryVerification.count({
        where: { cardId },
    });
    const verificationsThisMonth = await prisma.deliveryVerification.count({
        where: {
            cardId,
            verifiedAt: { gte: oneMonthAgo },
        },
    });
    const verificationsThisWeek = await prisma.deliveryVerification.count({
        where: {
            cardId,
            verifiedAt: { gte: oneWeekAgo },
        },
    });
    const lastVerification = await prisma.deliveryVerification.findFirst({
        where: { cardId },
        orderBy: { verifiedAt: 'desc' },
        select: { verifiedAt: true },
    });
    const firstVerification = await prisma.deliveryVerification.findFirst({
        where: { cardId },
        orderBy: { verifiedAt: 'asc' },
        select: { verifiedAt: true },
    });
    const daysSinceFirstUse = firstVerification?.verifiedAt
        ? Math.floor((now.getTime() - firstVerification.verifiedAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const averageVerificationsPerDay = daysSinceFirstUse && daysSinceFirstUse > 0 ? totalVerifications / daysSinceFirstUse : 0;
    return {
        totalVerifications,
        verificationsThisMonth,
        verificationsThisWeek,
        lastVerification: lastVerification?.verifiedAt || null,
        firstVerification: firstVerification?.verifiedAt || null,
        daysSinceFirstUse,
        averageVerificationsPerDay: Math.round(averageVerificationsPerDay * 100) / 100,
    };
}
function canViewCard(requestingUser, card) {
    const userRole = requestingUser.role;
    if (['super_admin', 'admin'].includes(userRole)) {
        return true;
    }
    if (userRole === 'school_admin' && requestingUser.schoolId === card.schoolId) {
        return true;
    }
    if (userRole === 'staff' && requestingUser.schoolId === card.schoolId) {
        return true;
    }
    if (userRole === 'teacher' && requestingUser.schoolId === card.schoolId) {
        return true;
    }
    if (userRole === 'parent') {
        return requestingUser.schoolId === card.schoolId;
    }
    if (userRole === 'student' && requestingUser.id === card.studentId) {
        return true;
    }
    return false;
}
function determineCardStatus(card) {
    if (!card.isActive || card.deactivatedAt) {
        return 'deactivated';
    }
    if (!card.student.isActive) {
        return 'inactive';
    }
    if (card.expiresAt && card.expiresAt <= new Date()) {
        return 'expired';
    }
    return 'active';
}
async function createAccessAuditLog(cardId, userId, cardNumber) {
    await prisma.auditLog.create({
        data: {
            entityType: 'RFIDCard',
            entityId: cardId,
            action: 'VIEW',
            changes: JSON.stringify({
                cardNumber,
                accessedBy: userId,
                timestamp: new Date().toISOString(),
            }),
            userId,
            createdById: userId,
            metadata: JSON.stringify({
                action: 'RFID_CARD_ACCESSED',
                timestamp: new Date().toISOString(),
            }),
        },
    });
}
const getRfidCardHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Get RFID card request started', { requestId });
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        const cardNumber = event.pathParameters?.cardNumber;
        if (!cardNumber) {
            logger.warn('Missing card number parameter', { requestId });
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Card number is required', 400);
        }
        if (!/^RFID-[A-Z0-9-]+$/.test(cardNumber)) {
            logger.warn('Invalid card number format', { requestId, cardNumber });
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid card number format', 400);
        }
        const card = await getRfidCardDetails(cardNumber);
        if (!canViewCard(authenticatedUser.user, card)) {
            logger.warn('Unauthorized card access attempt', {
                requestId,
                userId: authenticatedUser.user?.id,
                cardNumber,
                userRole: authenticatedUser.user?.role,
            });
            return (0, response_utils_1.createErrorResponse)('FORBIDDEN', 'Insufficient permissions to view this RFID card', 403);
        }
        const statistics = await getUsageStatistics(card.id);
        let metadata = {};
        try {
            metadata = JSON.parse(card.metadata);
        }
        catch (error) {
            logger.warn('Failed to parse card metadata', { cardId: card.id, metadata: card.metadata });
            metadata = {};
        }
        const recentVerifications = card.deliveryVerifications.map((verification) => {
            let verificationData = {};
            try {
                verificationData = JSON.parse(verification.verificationData || '{}');
            }
            catch (error) {
                logger.warn('Failed to parse verification data', { verificationId: verification.id });
                verificationData = {};
            }
            return {
                id: verification.id,
                verifiedAt: verification.verifiedAt,
                status: verification.status,
                location: verification.location,
                orderId: verification.orderId,
                reader: verification.reader,
            };
        });
        const cardStatus = determineCardStatus(card);
        const response = {
            id: card.id,
            cardNumber: card.cardNumber,
            studentId: card.studentId,
            schoolId: card.schoolId,
            isActive: card.isActive,
            issuedAt: card.issuedAt,
            expiresAt: card.expiresAt || undefined,
            lastUsedAt: card.lastUsedAt || undefined,
            deactivatedAt: card.deactivatedAt || undefined,
            deactivationReason: card.deactivationReason || undefined,
            metadata,
            status: cardStatus,
            student: card.student,
            school: card.school,
            statistics,
            recentVerifications,
        };
        await createAccessAuditLog(card.id, authenticatedUser.userId, cardNumber);
        logger.info('RFID card retrieved successfully', {
            requestId,
            cardId: card.id,
            cardNumber,
            accessedBy: authenticatedUser.email,
            cardStatus,
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'RFID card retrieved successfully',
            data: response,
        });
    }
    catch (error) {
        logger.error('Failed to retrieve RFID card', error instanceof Error ? error : new Error(String(error)), {
            requestId,
        });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve RFID card');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.getRfidCardHandler = getRfidCardHandler;
//# sourceMappingURL=get-card.js.map