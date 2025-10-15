"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.getIssueReportStatus = exports.reportRfidIssue = exports.getRfidCardStatus = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../../shared/utils/logger");
const auth_1 = require("../../shared/middleware/auth");
const response_utils_1 = require("../shared/response.utils");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const issueReportSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid(),
    issueType: zod_1.z.enum(['lost', 'damaged', 'not_working', 'other']),
    description: zod_1.z.string().min(10).max(500),
    requestReplacement: zod_1.z.boolean(),
    additionalInfo: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
async function validateParentAccessForRfid(studentId, parentUserId) {
    try {
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                school: true,
                studentParents: {
                    include: {
                        parent: true,
                    },
                },
            },
        });
        if (!student) {
            return { success: false, error: 'Student not found' };
        }
        if (student.role !== 'student') {
            return { success: false, error: 'User is not a student' };
        }
        if (!student.isActive) {
            return { success: false, error: 'Student account is inactive' };
        }
        const parentRelationship = await prisma.studentParent.findFirst({
            where: {
                studentId,
                parentId: parentUserId,
                isActive: true,
            },
            include: {
                parent: true,
            },
        });
        if (!parentRelationship) {
            return { success: false, error: 'Parent-student relationship not found' };
        }
        if (!parentRelationship.parent.isActive) {
            return { success: false, error: 'Parent account is inactive' };
        }
        return { success: true };
    }
    catch (error) {
        logger_1.logger.error('Error validating parent access for RFID', error instanceof Error ? error : new Error(String(error)));
        return { success: false, error: 'Validation failed' };
    }
}
async function getRfidCardInfo(studentId) {
    const card = await prisma.rFIDCard.findFirst({
        where: {
            studentId,
            isActive: true,
        },
        include: {
            student: {
                include: {
                    school: true,
                },
            },
            deliveryVerifications: {
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
        },
    });
    if (!card) {
        return null;
    }
    return card;
}
async function getUsageStatistics(cardId) {
    const totalScans = await prisma.deliveryVerification.count({
        where: { cardId },
    });
    const successfulDeliveries = await prisma.deliveryVerification.count({
        where: {
            cardId,
            status: 'success',
        },
    });
    const lastScan = await prisma.deliveryVerification.findFirst({
        where: { cardId },
        select: {
            createdAt: true,
            location: true,
            status: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    const recentVerifications = await prisma.deliveryVerification.findMany({
        where: { cardId },
        select: {
            id: true,
            createdAt: true,
            location: true,
            status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });
    const recentActivity = recentVerifications.map(verification => ({
        id: verification.id,
        timestamp: verification.createdAt,
        location: verification.location || '',
        status: verification.status,
    }));
    return {
        totalScans,
        successfulDeliveries,
        lastScanDate: lastScan?.createdAt || undefined,
        lastScanLocation: lastScan?.location || undefined,
        recentActivity,
    };
}
async function getIssueReports(cardId) {
    return [];
}
async function getReplacementInfo(cardId) {
    return undefined;
}
async function createIssueReport(request, parentId) {
    const card = await getRfidCardInfo(request.studentId);
    if (!card) {
        throw new Error('RFID card not found for student');
    }
    throw new Error('Issue report creation not available - RFIDIssueReport model missing');
}
async function getRfidCardStatus(event) {
    try {
        const authResult = await (0, auth_1.authenticateJWT)(event);
        if (!authResult.success) {
            return (0, response_utils_1.createErrorResponse)('UNAUTHORIZED', authResult.error || 'Authentication failed', 401);
        }
        const parentId = authResult.user?.id;
        if (!parentId) {
            return (0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'User ID not found in authentication', 401);
        }
        const studentId = event.pathParameters?.studentId;
        if (!studentId) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Student ID is required', 400);
        }
        const accessValidation = await validateParentAccessForRfid(studentId, parentId);
        if (!accessValidation.success) {
            return (0, response_utils_1.createErrorResponse)('FORBIDDEN', accessValidation.error, 403);
        }
        const card = await getRfidCardInfo(studentId);
        if (!card) {
            return (0, response_utils_1.createErrorResponse)('NOT_FOUND', 'RFID card not found for student', 404);
        }
        const usageStats = await getUsageStatistics(card.id);
        const issueReports = await getIssueReports(card.id);
        const replacementInfo = await getReplacementInfo(card.id);
        const cardInfo = {
            id: card.id,
            cardNumber: card.cardNumber,
            status: card.status,
            isActive: card.isActive,
            issuedDate: card.issuedDate,
            student: {
                id: card.student.id,
                firstName: card.student.firstName,
                lastName: card.student.lastName,
                grade: card.student.grade,
                school: {
                    id: card.student.school.id,
                    name: card.student.school.name,
                },
            },
            usageStats,
            issueReports,
            replacementInfo,
        };
        return (0, response_utils_1.createSuccessResponse)(cardInfo);
    }
    catch (error) {
        logger_1.logger.error('Error getting RFID card status', error instanceof Error ? error : new Error(String(error)));
        return (0, response_utils_1.handleError)(error);
    }
}
exports.getRfidCardStatus = getRfidCardStatus;
async function reportRfidIssue(event) {
    try {
        const authResult = await (0, auth_1.authenticateJWT)(event);
        if (!authResult.success) {
            return (0, response_utils_1.createErrorResponse)('UNAUTHORIZED', authResult.error, 401);
        }
        const parentId = authResult.user?.id;
        const requestBody = JSON.parse(event.body || '{}');
        const validatedRequest = issueReportSchema.parse(requestBody);
        const accessValidation = await validateParentAccessForRfid(validatedRequest.studentId, parentId);
        if (!accessValidation.success) {
            return (0, response_utils_1.createErrorResponse)('FORBIDDEN', accessValidation.error, 403);
        }
        const validIssueTypes = ['lost', 'damaged', 'not_working', 'other'];
        if (!validIssueTypes.includes(validatedRequest.issueType)) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', `Invalid issue type. Must be one of: ${validIssueTypes.join(', ')}`, 400);
        }
        const result = await createIssueReport(validatedRequest, parentId);
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Issue report created successfully',
            trackingId: `RFID-${result.issueReport.id.substring(0, 8).toUpperCase()}`,
            issueReport: result.issueReport,
            replacementRequest: result.replacementRequest,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', `Invalid request data: ${error.issues.map(e => e.message).join(', ')}`, 400);
        }
        logger_1.logger.error('Error reporting RFID issue', error instanceof Error ? error : new Error(String(error)));
        return (0, response_utils_1.handleError)(error);
    }
}
exports.reportRfidIssue = reportRfidIssue;
async function getIssueReportStatus(event) {
    try {
        const authResult = await (0, auth_1.authenticateJWT)(event);
        if (!authResult.success) {
            return (0, response_utils_1.createErrorResponse)('UNAUTHORIZED', authResult.error, 401);
        }
        const parentId = authResult.user?.id;
        const reportId = event.pathParameters?.reportId;
        if (!reportId) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Report ID is required', 400);
        }
        return (0, response_utils_1.createErrorResponse)('NOT_FOUND', 'Issue report functionality not available', 404);
    }
    catch (error) {
        logger_1.logger.error('Error getting issue report status', error instanceof Error ? error : new Error(String(error)));
        return (0, response_utils_1.handleError)(error instanceof Error ? error : new Error(String(error)));
    }
}
exports.getIssueReportStatus = getIssueReportStatus;
const handler = async (event, context) => {
    const { httpMethod, path } = event;
    try {
        switch (`${httpMethod}:${path}`) {
            case 'GET:/rfid/students/{studentId}/card':
                return await getRfidCardStatus(event);
            case 'POST:/rfid/issues':
                return await reportRfidIssue(event);
            case 'GET:/rfid/issues/{reportId}':
                return await getIssueReportStatus(event);
            default:
                return (0, response_utils_1.createErrorResponse)('NOT_FOUND', 'Endpoint not found', 404);
        }
    }
    catch (error) {
        logger_1.logger.error('Mobile RFID card management handler error:', error instanceof Error ? error : new Error(String(error)));
        return (0, response_utils_1.handleError)(error instanceof Error ? error : new Error(String(error)));
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.handler = handler;
//# sourceMappingURL=mobile-card-management.js.map