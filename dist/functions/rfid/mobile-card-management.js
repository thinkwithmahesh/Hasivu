"use strict";
/**
 * Mobile RFID Card Management Lambda Function
 *
 * Implements Story 2.4: Parent Mobile Integration - RFID Card Status and Issue Reporting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.getIssueReportStatus = exports.reportRfidIssue = exports.getRfidCardStatus = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../../shared/utils/logger");
const auth_1 = require("../../shared/middleware/auth");
const response_utils_1 = require("../shared/response.utils");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
// Validation schemas
const issueReportSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid(),
    issueType: zod_1.z.enum(['lost', 'damaged', 'not_working', 'other']),
    description: zod_1.z.string().min(10).max(500),
    requestReplacement: zod_1.z.boolean(),
    additionalInfo: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
});
/**
 * Validate parent access to student RFID information
 */
async function validateParentAccessForRfid(studentId, parentUserId) {
    try {
        // Get student information
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                school: true,
                studentParents: {
                    include: {
                        parent: true
                    }
                }
            }
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
        // Verify parent relationship
        const parentRelationship = await prisma.studentParent.findFirst({
            where: {
                studentId: studentId,
                parentId: parentUserId,
                isActive: true
            },
            include: {
                parent: true
            }
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
        logger_1.logger.error('Error validating parent access for RFID:', error);
        return { success: false, error: 'Validation failed' };
    }
}
/**
 * Get RFID card information for student
 */
async function getRfidCardInfo(studentId) {
    const card = await prisma.rFIDCard.findFirst({
        where: {
            studentId: studentId,
            isActive: true
        },
        include: {
            student: {
                include: {
                    school: true
                }
            },
            deliveryVerifications: {
                orderBy: { createdAt: 'desc' },
                take: 10
            }
        }
    });
    if (!card) {
        return null;
    }
    return card;
}
/**
 * Get usage statistics for RFID card
 */
async function getUsageStatistics(cardId) {
    // Get total verification attempts
    const totalScans = await prisma.deliveryVerification.count({
        where: { cardId }
    });
    // Get successful deliveries
    const successfulDeliveries = await prisma.deliveryVerification.count({
        where: {
            cardId,
            status: 'success'
        }
    });
    // Get last scan location
    const lastScan = await prisma.deliveryVerification.findFirst({
        where: { cardId },
        select: {
            createdAt: true,
            location: true,
            status: true
        },
        orderBy: { createdAt: 'desc' }
    });
    // Get recent activity
    const recentVerifications = await prisma.deliveryVerification.findMany({
        where: { cardId },
        select: {
            id: true,
            createdAt: true,
            location: true,
            status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    const recentActivity = recentVerifications.map(verification => ({
        id: verification.id,
        timestamp: verification.createdAt,
        location: verification.location,
        status: verification.status
    }));
    return {
        totalScans,
        successfulDeliveries,
        lastScanDate: lastScan?.createdAt || undefined,
        lastScanLocation: lastScan?.location || undefined,
        recentActivity
    };
}
/**
 * Get issue reports for RFID card
 */
async function getIssueReports(cardId) {
    // Note: RFIDIssueReport model may not exist - returning empty array for now
    return [];
    /* Commented out until RFIDIssueReport model is available
    const issues = await prisma.rfidIssueReport.findMany({
      where: { cardId },
      select: {
        id: true,
        issueType: true,
        description: true,
        status: true,
        reportedDate: true,
        reportedBy: true,
        resolutionDate: true,
        resolutionNotes: true,
        trackingId: true
      },
      orderBy: { reportedDate: 'desc' },
      take: 5
    });
  
    return issues.map(issue => ({
      id: issue.id,
      issueType: issue.issueType,
      description: issue.description,
      status: issue.status as 'pending' | 'investigating' | 'resolved' | 'closed',
      reportedDate: issue.reportedDate,
      reportedBy: issue.reportedBy,
      resolutionDate: issue.resolutionDate || undefined,
      resolutionNotes: issue.resolutionNotes || undefined,
      trackingId: issue.trackingId
    }));
    */
}
/**
 * Get replacement information for card
 */
async function getReplacementInfo(cardId) {
    // Note: rFIDCardReplacement model may not exist - returning undefined for now
    return undefined;
    /* Commented out until rFIDCardReplacement model is available
    const replacement = await prisma.rFIDCardReplacement.findFirst({
      where: { originalCardId: cardId },
      select: {
        id: true,
        requestDate: true,
        status: true,
        reason: true,
        newCardId: true,
        issuedDate: true,
        trackingId: true
      },
      orderBy: { requestDate: 'desc' }
    });
  
    if (!replacement) {
      return undefined;
    }
  
    let newCardNumber: string | undefined;
    if (replacement.newCardId) {
      const newCard = await prisma.rFIDCard.findUnique({
        where: { id: replacement.newCardId },
        select: { cardNumber: true }
      });
      newCardNumber = newCard?.cardNumber;
    }
  
    return {
      id: replacement.id,
      requestDate: replacement.requestDate,
      status: replacement.status as 'pending' | 'approved' | 'issued' | 'completed',
      reason: replacement.reason,
      newCardNumber,
      issuedDate: replacement.issuedDate || undefined,
      trackingId: replacement.trackingId
    };
    */
}
/**
 * Create issue report
 */
async function createIssueReport(request, parentId) {
    const card = await getRfidCardInfo(request.studentId);
    if (!card) {
        throw new Error('RFID card not found for student');
    }
    // Create issue report - Note: RFIDIssueReport model may not exist
    throw new Error('Issue report creation not available - RFIDIssueReport model missing');
    /* Commented out until RFIDIssueReport model is available
    const issueReport = await prisma.rfidIssueReport.create({
      data: {
        cardId: card.id,
        issueType: request.issueType,
        description: request.description,
        status: 'pending',
        reportedBy: parentId,
        reportedDate: new Date(),
        additionalInfo: JSON.stringify(request.additionalInfo || {}),
        trackingId: `RFID-ISSUE-${Date.now()}`
      }
    });
  
    // If replacement requested, create replacement request
    let replacementRequest = null;
    if (request.requestReplacement) {
      replacementRequest = await prisma.rFIDCardReplacement.create({
        data: {
          originalCardId: card.id,
          requestedBy: parentId,
          requestDate: new Date(),
          status: 'pending',
          reason: `${request.issueType}: ${request.description}`,
          trackingId: `RFID-REPLACE-${Date.now()}`
        }
      });
  
      // Deactivate the old card if it's lost or severely damaged
      if (['lost', 'damaged'].includes(request.issueType)) {
        await prisma.rFIDCard.update({
          where: { id: card.id },
          data: {
            isActive: false,
            deactivatedAt: new Date(),
            deactivationReason: `${request.issueType}_reported`
          }
        });
      }
    }
  
    // Create notification for admin
    await prisma.notification.create({
      data: {
        userId: card.student.id,
        type: 'rfid_issue_reported',
        title: 'RFID Card Issue Reported',
        message: `Issue reported for ${card.student.firstName} ${card.student.lastName}: ${request.issueType}`,
        createdAt: new Date()
      }
    });
  
    return {
      issueReport: {
        id: issueReport.id,
        trackingId: issueReport.trackingId,
        status: issueReport.status
      },
      replacementRequest: replacementRequest ? {
        id: replacementRequest.id,
        trackingId: replacementRequest.trackingId,
        status: replacementRequest.status
      } : null
    };
    */
}
/**
 * Get RFID card status - Main handler
 */
async function getRfidCardStatus(event) {
    try {
        // Authenticate user
        const authResult = await (0, auth_1.authenticateJWT)(event);
        if (!authResult.success) {
            return (0, response_utils_1.createErrorResponse)(401, authResult.error);
        }
        const parentId = authResult.user?.id;
        const studentId = event.pathParameters?.studentId;
        if (!studentId) {
            return (0, response_utils_1.createErrorResponse)(400, 'Student ID is required');
        }
        // Validate parent access
        const accessValidation = await validateParentAccessForRfid(studentId, parentId);
        if (!accessValidation.success) {
            return (0, response_utils_1.createErrorResponse)(403, accessValidation.error);
        }
        // Get RFID card information
        const card = await getRfidCardInfo(studentId);
        if (!card) {
            return (0, response_utils_1.createErrorResponse)(404, 'RFID card not found for student');
        }
        // Get usage statistics
        const usageStats = await getUsageStatistics(card.id);
        // Get issue reports
        const issueReports = await getIssueReports(card.id);
        // Get replacement information
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
                    name: card.student.school.name
                }
            },
            usageStats,
            issueReports,
            replacementInfo
        };
        return (0, response_utils_1.createSuccessResponse)(cardInfo);
    }
    catch (error) {
        logger_1.logger.error('Error getting RFID card status:', error);
        return (0, response_utils_1.handleError)(error);
    }
}
exports.getRfidCardStatus = getRfidCardStatus;
/**
 * Report RFID card issue - Handler
 */
async function reportRfidIssue(event) {
    try {
        // Authenticate user
        const authResult = await (0, auth_1.authenticateJWT)(event);
        if (!authResult.success) {
            return (0, response_utils_1.createErrorResponse)(401, authResult.error);
        }
        const parentId = authResult.user?.id;
        // Parse and validate request body
        const requestBody = JSON.parse(event.body || '{}');
        const validatedRequest = issueReportSchema.parse(requestBody);
        // Validate parent access
        const accessValidation = await validateParentAccessForRfid(validatedRequest.studentId, parentId);
        if (!accessValidation.success) {
            return (0, response_utils_1.createErrorResponse)(403, accessValidation.error);
        }
        // Validate issue type
        const validIssueTypes = ['lost', 'damaged', 'not_working', 'other'];
        if (!validIssueTypes.includes(validatedRequest.issueType)) {
            return (0, response_utils_1.createErrorResponse)(400, `Invalid issue type. Must be one of: ${validIssueTypes.join(', ')}`);
        }
        // Create issue report
        const result = await createIssueReport(validatedRequest, parentId);
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Issue report created successfully',
            trackingId: `RFID-${result.issueReport.id.substring(0, 8).toUpperCase()}`,
            issueReport: result.issueReport,
            replacementRequest: result.replacementRequest
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid request data: ' + error.issues.map(e => e.message).join(', '));
        }
        logger_1.logger.error('Error reporting RFID issue:', error);
        return (0, response_utils_1.handleError)(error);
    }
}
exports.reportRfidIssue = reportRfidIssue;
/**
 * Get issue report status - Handler
 */
async function getIssueReportStatus(event) {
    try {
        // Authenticate user
        const authResult = await (0, auth_1.authenticateJWT)(event);
        if (!authResult.success) {
            return (0, response_utils_1.createErrorResponse)(401, authResult.error);
        }
        const parentId = authResult.user?.id;
        const reportId = event.pathParameters?.reportId;
        if (!reportId) {
            return (0, response_utils_1.createErrorResponse)(400, 'Report ID is required');
        }
        // Get issue report
        // Note: RFIDIssueReport model may not exist - returning error for now
        return (0, response_utils_1.createErrorResponse)(404, 'Issue report functionality not available');
        /* Commented out until RFIDIssueReport model is available
        const issueReport = await prisma.rfidIssueReport.findUnique({
          where: { id: reportId },
          include: {
            card: {
              include: {
                student: {
                  include: {
                    studentParents: {
                      where: { parentId: parentId }
                    }
                  }
                }
              }
            }
          }
        });
    
        if (!issueReport) {
          return createErrorResponse(404, 'Issue report not found');
        }
    
        // Verify parent has access to this report
        if (issueReport.card.student.studentParents.length === 0) {
          return createErrorResponse(403, 'Access denied');
        }
    
        return createSuccessResponse({
          id: issueReport.id,
          trackingId: issueReport.trackingId,
          issueType: issueReport.issueType,
          description: issueReport.description,
          status: issueReport.status,
          reportedDate: issueReport.reportedDate,
          resolutionDate: issueReport.resolutionDate,
          resolutionNotes: issueReport.resolutionNotes,
          student: {
            id: issueReport.card.student.id,
            name: `${issueReport.card.student.firstName} ${issueReport.card.student.lastName}`
          }
        });
        */
    }
    catch (error) {
        logger_1.logger.error('Error getting issue report status:', error);
        return (0, response_utils_1.handleError)(error);
    }
}
exports.getIssueReportStatus = getIssueReportStatus;
// Export handler for serverless framework
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
                return (0, response_utils_1.createErrorResponse)(404, 'Endpoint not found');
        }
    }
    catch (error) {
        logger_1.logger.error('Mobile RFID card management handler error:', error);
        return (0, response_utils_1.handleError)(error);
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.handler = handler;
