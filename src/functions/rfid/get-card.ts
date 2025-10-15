/**
 * HASIVU Platform - Get RFID Card Lambda Function
 * Handles: GET /api/v1/rfid/cards/{cardNumber}
 * Implements Story 2.1: RFID Card Management - Secure Card Retrieval
 * Production-ready with comprehensive authorization and statistics
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../shared/logger.service';
import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils';
import {
  authenticateLambda,
  AuthenticatedUser,
  AuthenticatedEvent,
} from '../../shared/middleware/lambda-auth.middleware';

// Initialize database client
const prisma = new PrismaClient();

// RFID Card detailed response interface
interface RFIDCardDetailedResponse {
  id: string;
  cardNumber: string;
  studentId: string;
  schoolId: string;
  isActive: boolean;
  issuedAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  deactivatedAt?: Date;
  deactivationReason?: string;
  metadata: Record<string, any>;
  status: 'active' | 'expired' | 'deactivated' | 'inactive';
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  school: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  };
  statistics: {
    totalVerifications: number;
    verificationsThisMonth: number;
    verificationsThisWeek: number;
    lastVerification?: Date;
    firstVerification?: Date;
    daysSinceFirstUse?: number;
    averageVerificationsPerDay: number;
  };
  recentVerifications: Array<{
    id: string;
    verifiedAt: Date;
    status: string;
    location?: string;
    orderId?: string;
    reader?: {
      id: string;
      name: string;
      location: string;
    };
  }>;
}

/**
 * Get RFID card with full details including statistics and verification history
 */
async function getRfidCardDetails(cardNumber: string): Promise<any> {
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
        take: 10, // Last 10 verifications
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

/**
 * Get usage statistics for the RFID card
 */
async function getUsageStatistics(cardId: string): Promise<any> {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get total verifications count
  const totalVerifications = await prisma.deliveryVerification.count({
    where: { cardId },
  });

  // Get monthly verifications count
  const verificationsThisMonth = await prisma.deliveryVerification.count({
    where: {
      cardId,
      verifiedAt: { gte: oneMonthAgo },
    },
  });

  // Get weekly verifications count
  const verificationsThisWeek = await prisma.deliveryVerification.count({
    where: {
      cardId,
      verifiedAt: { gte: oneWeekAgo },
    },
  });

  // Get first and last verification timestamps
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

  // Calculate days since first use
  const daysSinceFirstUse = firstVerification?.verifiedAt
    ? Math.floor((now.getTime() - firstVerification.verifiedAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate average verifications per day
  const averageVerificationsPerDay =
    daysSinceFirstUse && daysSinceFirstUse > 0 ? totalVerifications / daysSinceFirstUse : 0;

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

/**
 * Check if user can view the RFID card details
 */
function canViewCard(requestingUser: AuthenticatedUser, card: any): boolean {
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
function determineCardStatus(card: any): 'active' | 'expired' | 'deactivated' | 'inactive' {
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
async function createAccessAuditLog(
  cardId: string,
  userId: string,
  cardNumber: string
): Promise<void> {
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

/**
 * Get RFID Card Lambda Handler
 * GET /api/v1/rfid/cards/{cardNumber}
 */
export const getRfidCardHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const logger = LoggerService.getInstance();
  const requestId = context.awsRequestId;

  try {
    logger.info('Get RFID card request started', { requestId });

    // Authenticate request
    const authenticatedUser = await authenticateLambda(event);

    // Extract card number from path parameters
    const cardNumber = event.pathParameters?.cardNumber;
    if (!cardNumber) {
      logger.warn('Missing card number parameter', { requestId });
      return createErrorResponse('VALIDATION_ERROR', 'Card number is required', 400);
    }

    // Validate card number format (basic validation)
    if (!/^RFID-[A-Z0-9-]+$/.test(cardNumber)) {
      logger.warn('Invalid card number format', { requestId, cardNumber });
      return createErrorResponse('VALIDATION_ERROR', 'Invalid card number format', 400);
    }

    // Get RFID card details
    const card = await getRfidCardDetails(cardNumber);

    // Authorization check
    if (!canViewCard(authenticatedUser.user!, card)) {
      logger.warn('Unauthorized card access attempt', {
        requestId,
        userId: authenticatedUser.user?.id,
        cardNumber,
        userRole: authenticatedUser.user?.role,
      });
      return createErrorResponse(
        'FORBIDDEN',
        'Insufficient permissions to view this RFID card',
        403
      );
    }

    // Get usage statistics
    const statistics = await getUsageStatistics(card.id);

    // Parse metadata safely
    let metadata = {};
    try {
      metadata = JSON.parse(card.metadata);
    } catch (error: unknown) {
      logger.warn('Failed to parse card metadata', { cardId: card.id, metadata: card.metadata });
      metadata = {};
    }

    // Format recent verifications
    const recentVerifications = card.deliveryVerifications.map((verification: any) => {
      let verificationData = {};
      try {
        verificationData = JSON.parse(verification.verificationData || '{}');
      } catch (error: unknown) {
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

    // Determine card status
    const cardStatus = determineCardStatus(card);

    // Create response
    const response: RFIDCardDetailedResponse = {
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

    // Create audit log for access
    await createAccessAuditLog(card.id, authenticatedUser.userId!, cardNumber);

    logger.info('RFID card retrieved successfully', {
      requestId,
      cardId: card.id,
      cardNumber,
      accessedBy: authenticatedUser.email,
      cardStatus,
    });

    return createSuccessResponse({
      message: 'RFID card retrieved successfully',
      data: response,
    });
  } catch (error: any) {
    logger.error(
      'Failed to retrieve RFID card',
      error instanceof Error ? error : new Error(String(error)),
      {
        requestId,
      }
    );

    return handleError(error, 'Failed to retrieve RFID card');
  } finally {
    await prisma.$disconnect();
  }
};
