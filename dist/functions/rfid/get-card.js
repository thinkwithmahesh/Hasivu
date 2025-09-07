"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRfidCardHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
// Initialize database client
const prisma = new client_1.PrismaClient();
/**
 * Get RFID card with full details including statistics and verification history
 */
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
                    isActive: true
                }
            },
            deliveryVerifications: {
                orderBy: { verifiedAt: 'desc' },
                take: 10, // Last 10 verifications
                include: {
                    reader: {
                        select: {
                            id: true,
                            name: true,
                            location: true
                        }
                    }
                }
            }
        }
    });
    if (!card) {
        throw new Error('RFID card not found');
    }
    return card;
}
/**
 * Get usage statistics for the RFID card
 */
async function getUsageStatistics(cardId) {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // Get total verifications count
    const totalVerifications = await prisma.deliveryVerification.count({
        where: { cardId }
    });
    // Get monthly verifications count
    const verificationsThisMonth = await prisma.deliveryVerification.count({
        where: {
            cardId,
            verifiedAt: { gte: oneMonthAgo }
        }
    });
    // Get weekly verifications count
    const verificationsThisWeek = await prisma.deliveryVerification.count({
        where: {
            cardId,
            verifiedAt: { gte: oneWeekAgo }
        }
    });
    // Get first and last verification timestamps
    const lastVerification = await prisma.deliveryVerification.findFirst({
        where: { cardId },
        orderBy: { verifiedAt: 'desc' },
        select: { verifiedAt: true }
    });
    const firstVerification = await prisma.deliveryVerification.findFirst({
        where: { cardId },
        orderBy: { verifiedAt: 'asc' },
        select: { verifiedAt: true }
    });
    // Calculate days since first use
    const daysSinceFirstUse = firstVerification?.verifiedAt
        ? Math.floor((now.getTime() - firstVerification.verifiedAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;
    // Calculate average verifications per day
    const averageVerificationsPerDay = daysSinceFirstUse && daysSinceFirstUse > 0
        ? totalVerifications / daysSinceFirstUse
        : 0;
    return {
        totalVerifications,
        verificationsThisMonth,
        verificationsThisWeek,
        lastVerification: lastVerification?.verifiedAt || null,
        firstVerification: firstVerification?.verifiedAt || null,
        daysSinceFirstUse,
        averageVerificationsPerDay: Math.round(averageVerificationsPerDay * 100) / 100
    };
}
/**
 * Check if user can view the RFID card details
 */
function canViewCard(requestingUser, card) {
    const userRole = requestingUser.role;
    // Super admin and admin can view any card
    if (['super_admin', 'admin'].includes(userRole)) {
        return true;
    }
    // School admin can view cards in their school
    if (userRole === 'school_admin' && requestingUser.schoolId === card.schoolId) {
        return true;
    }
    // Staff can view cards in their school
    if (userRole === 'staff' && requestingUser.schoolId === card.schoolId) {
        return true;
    }
    // Teachers can view cards for students in their school
    if (userRole === 'teacher' && requestingUser.schoolId === card.schoolId) {
        return true;
    }
    // Parents can view cards for their children
    if (userRole === 'parent') {
        // Check if the card belongs to one of their children
        // This would need to be verified through parent-child relationships
        return requestingUser.schoolId === card.schoolId; // Simplified check
    }
    // Students can view their own card
    if (userRole === 'student' && requestingUser.id === card.studentId) {
        return true;
    }
    return false;
}
/**
 * Determine card status based on current state
 */
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
/**
 * Create audit log entry for card access
 */
async function createAccessAuditLog(cardId, userId, cardNumber) {
    await prisma.auditLog.create({
        data: {
            entityType: 'RFIDCard',
            entityId: cardId,
            action: 'VIEW',
            changes: JSON.stringify({
                cardNumber,
                accessedBy: userId,
                timestamp: new Date().toISOString()
            }),
            userId,
            createdById: userId,
            metadata: JSON.stringify({
                action: 'RFID_CARD_ACCESSED',
                timestamp: new Date().toISOString()
            })
        }
    });
}
/**
 * Get RFID Card Lambda Handler
 * GET /api/v1/rfid/cards/{cardNumber}
 */
const getRfidCardHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Get RFID card request started', { requestId });
        // Authenticate request
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        // Extract card number from path parameters
        const cardNumber = event.pathParameters?.cardNumber;
        if (!cardNumber) {
            logger.warn('Missing card number parameter', { requestId });
            return (0, response_utils_1.createErrorResponse)(400, 'Card number is required');
        }
        // Validate card number format (basic validation)
        if (!/^RFID-[A-Z0-9-]+$/.test(cardNumber)) {
            logger.warn('Invalid card number format', { requestId, cardNumber });
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid card number format');
        }
        // Get RFID card details
        const card = await getRfidCardDetails(cardNumber);
        // Authorization check
        if (!canViewCard(authenticatedUser.user, card)) {
            logger.warn('Unauthorized card access attempt', {
                requestId,
                userId: authenticatedUser.user?.id,
                cardNumber,
                userRole: authenticatedUser.user?.role
            });
            return (0, response_utils_1.createErrorResponse)(403, 'Insufficient permissions to view this RFID card');
        }
        // Get usage statistics
        const statistics = await getUsageStatistics(card.id);
        // Parse metadata safely
        let metadata = {};
        try {
            metadata = JSON.parse(card.metadata);
        }
        catch (error) {
            logger.warn('Failed to parse card metadata', { cardId: card.id, metadata: card.metadata });
            metadata = {};
        }
        // Format recent verifications
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
                reader: verification.reader
            };
        });
        // Determine card status
        const cardStatus = determineCardStatus(card);
        // Create response
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
            recentVerifications
        };
        // Create audit log for access
        await createAccessAuditLog(card.id, authenticatedUser.id, cardNumber);
        logger.info('RFID card retrieved successfully', {
            requestId,
            cardId: card.id,
            cardNumber,
            accessedBy: authenticatedUser.email,
            cardStatus
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'RFID card retrieved successfully',
            data: response
        });
    }
    catch (error) {
        logger.error('Failed to retrieve RFID card', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve RFID card');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.getRfidCardHandler = getRfidCardHandler;
