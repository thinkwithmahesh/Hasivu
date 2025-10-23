/**
 * RFID Management API Routes
 * Comprehensive RFID card and reader management endpoints
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import {
  APIRequest,
  APIResponse,
  validateRequest,
  paginationMiddleware,
  createRateLimiter,
} from '../middleware/api.middleware';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler, createValidationError } from '../middleware/error.middleware';
import { RfidService } from '../services/rfid.service';
import { AuditService } from '../services/audit.service';
import { CacheService } from '../services/cache.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { bulkImportRfidCardsHandler } from '../functions/rfid/bulk-import-cards';
import { getRfidCardHandler } from '../functions/rfid/get-card';
import { manageReadersHandler } from '../functions/rfid/manage-readers';
import { getRfidCardStatus, reportRfidIssue } from '../functions/rfid/mobile-card-management';
import {
  getMobileTrackingHandler,
  updateTrackingStatusHandler,
} from '../functions/rfid/mobile-tracking';
import {
  photoVerificationHandler,
  photoUploadRequestHandler,
  getPhotoVerificationHandler,
} from '../functions/rfid/photo-verification';

const router = express.Router();

// Create service instances
const rfidService = RfidService.getInstance();
const auditService = new AuditService();
const cacheService = new CacheService();

// Rate limiters
const readRateLimit = createRateLimiter({ requests: 150, windowMs: 60000 });
const writeRateLimit = createRateLimiter({ requests: 30, windowMs: 60000 });
const verificationRateLimit = createRateLimiter({ requests: 100, windowMs: 60000 }); // Higher for verifications

// Validation Schemas
const registerCardSchema = z.object({
  cardNumber: z
    .string()
    .min(4)
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Invalid card number format'),
  studentId: z.string().uuid('Invalid student ID'),
  schoolId: z.string().uuid('Invalid school ID'),
  cardType: z.enum(['student', 'staff']).optional().default('student'),
  expiryDate: z.string().datetime().optional(),
});

const bulkRegisterSchema = z.object({
  schoolId: z.string().uuid(),
  cards: z
    .array(
      z.object({
        cardNumber: z
          .string()
          .min(4)
          .max(20)
          .regex(/^[A-Z0-9-]+$/),
        studentId: z.string().uuid(),
        cardType: z.enum(['student', 'staff']).optional().default('student'),
      })
    )
    .min(1)
    .max(100), // Max 100 cards per bulk operation
});

const verifyDeliverySchema = z.object({
  cardNumber: z
    .string()
    .min(4)
    .max(20)
    .regex(/^[A-Z0-9-]+$/),
  readerId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  signalStrength: z.number().min(0).max(100).optional(),
  readDuration: z.number().min(0).max(10000).optional(), // milliseconds
  location: z.string().max(200).optional(),
  timestamp: z.string().datetime().optional(),
});

const updateReaderSchema = z.object({
  status: z.enum(['online', 'offline', 'maintenance']).optional(),
  location: z.string().max(200).optional(),
  metadata: z.object({}).optional(),
});

const verificationHistorySchema = z.object({
  cardNumber: z.string().optional(),
  studentId: z.string().uuid().optional(),
  schoolId: z.string().uuid().optional(),
  readerId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

const cardParamsSchema = z.object({
  id: z.string().uuid('Invalid card ID'),
});

const readerParamsSchema = z.object({
  readerId: z.string().uuid('Invalid reader ID'),
});

/**
 * POST /api/v1/rfid/cards
 * Register new RFID card
 */
router.post(
  '/cards',
  writeRateLimit,
  authMiddleware,
  requireRole(['school_admin', 'admin']),
  validateRequest({ body: registerCardSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const cardData = req.body;
      const currentUser = req.user!;

      // Check permissions
      if (currentUser.role === 'school_admin' && cardData.schoolId !== currentUser.schoolId) {
        throw new AppError('You can only register cards for your school', 403);
      }

      const result = await rfidService.registerCard(cardData);

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to register RFID card', 500);
      }

      // Invalidate caches
      await cacheService.invalidatePattern('rfid_cards:*');

      // Audit log
      await auditService.log(currentUser.id, 'rfid.register_card', {
        cardId: result.data!.id,
        cardNumber: cardData.cardNumber,
        studentId: cardData.studentId,
        schoolId: cardData.schoolId,
        requestId: req.requestId,
      });

      logger.info('RFID card registered successfully', {
        cardId: result.data!.id,
        cardNumber: cardData.cardNumber,
        studentId: cardData.studentId,
        registeredBy: currentUser.id,
        requestId: req.requestId,
      });

      res.status(201).json({
        data: result.data,
        message: 'RFID card registered successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to register RFID card', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * POST /api/v1/rfid/cards/bulk
 * Bulk register RFID cards
 */
router.post(
  '/cards/bulk',
  writeRateLimit,
  authMiddleware,
  requireRole(['school_admin', 'admin']),
  validateRequest({ body: bulkRegisterSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { schoolId, cards } = req.body;
      const currentUser = req.user!;

      // Check permissions
      if (currentUser.role === 'school_admin' && schoolId !== currentUser.schoolId) {
        throw new AppError('You can only bulk register cards for your school', 403);
      }

      const result = await rfidService.bulkRegisterCards({ schoolId, cards });

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to bulk register RFID cards', 500);
      }

      // Invalidate caches
      await cacheService.invalidatePattern('rfid_cards:*');

      // Audit log
      await auditService.log(currentUser.id, 'rfid.bulk_register_cards', {
        schoolId,
        cardCount: cards.length,
        successful: result.data!.successful.length,
        failed: result.data!.failed.length,
        requestId: req.requestId,
      });

      logger.info('RFID cards bulk registered successfully', {
        schoolId,
        cardCount: cards.length,
        successful: result.data!.successful.length,
        failed: result.data!.failed.length,
        registeredBy: currentUser.id,
        requestId: req.requestId,
      });

      res.status(201).json({
        data: result.data,
        message: 'RFID cards bulk registered successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error(
        'Failed to bulk register RFID cards',
        error instanceof Error ? error : undefined,
        {
          requestId: req.requestId,
          userId: req.user?.id,
        }
      );
      throw error;
    }
  }
);

/**
 * POST /api/v1/rfid/verify-delivery
 * Verify delivery using RFID card
 */
router.post(
  '/verify-delivery',
  verificationRateLimit,
  authMiddleware,
  validateRequest({ body: verifyDeliverySchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const verificationData = req.body;
      const currentUser = req.user!;

      const result = await rfidService.verifyDelivery(verificationData);

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to verify delivery', 500);
      }

      // Invalidate caches
      await cacheService.invalidatePattern('rfid_verifications:*');

      // Audit log
      await auditService.log(currentUser.id, 'rfid.verify_delivery', {
        cardNumber: verificationData.cardNumber,
        verificationId: result.data!.verificationId,
        orderId: verificationData.orderId,
        readerId: verificationData.readerId,
        requestId: req.requestId,
      });

      logger.info('RFID delivery verified successfully', {
        cardNumber: verificationData.cardNumber,
        verificationId: result.data!.verificationId,
        studentId: result.data!.studentId,
        verifiedBy: currentUser.id,
        requestId: req.requestId,
      });

      res.json({
        data: result.data,
        message: 'Delivery verified successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to verify RFID delivery', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * PUT /api/v1/rfid/readers/:readerId
 * Update RFID reader status
 */
router.put(
  '/readers/:readerId',
  writeRateLimit,
  authMiddleware,
  requireRole(['school_admin', 'admin', 'kitchen_staff']),
  validateRequest({
    params: readerParamsSchema,
    body: updateReaderSchema,
  }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { readerId } = req.params;
      const updateData = req.body;
      const currentUser = req.user!;

      const result = await rfidService.updateReaderStatus({
        readerId,
        ...updateData,
      });

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to update reader status', 500);
      }

      // Invalidate caches
      await cacheService.invalidatePattern(`rfid_reader:${readerId}:*`);

      // Audit log
      await auditService.log(currentUser.id, 'rfid.update_reader', {
        readerId,
        changes: Object.keys(updateData),
        newStatus: updateData.status,
        requestId: req.requestId,
      });

      logger.info('RFID reader updated successfully', {
        readerId,
        changes: Object.keys(updateData),
        updatedBy: currentUser.id,
        requestId: req.requestId,
      });

      res.json({
        data: result.data,
        message: 'RFID reader updated successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to update RFID reader', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        readerId: req.params.readerId,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * GET /api/v1/rfid/verifications
 * Get verification history with filtering
 */
router.get(
  '/verifications',
  readRateLimit,
  authMiddleware,
  validateRequest({ query: verificationHistorySchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const query = req.query as any;
      const currentUser = req.user!;

      // Build cache key
      const cacheKey = `rfid_verifications:${JSON.stringify({ ...query, userId: currentUser.id })}`;

      // Check cache
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.info('RFID verifications served from cache', { requestId: req.requestId });
        res.json(cached);
        return;
      }

      // Parse query parameters
      const verificationQuery: any = {
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? Math.min(parseInt(query.limit, 10), 100) : 20,
      };

      if (query.cardNumber) verificationQuery.cardNumber = query.cardNumber;
      if (query.studentId) verificationQuery.studentId = query.studentId;
      if (query.schoolId) verificationQuery.schoolId = query.schoolId;
      if (query.readerId) verificationQuery.readerId = query.readerId;
      if (query.orderId) verificationQuery.orderId = query.orderId;
      if (query.startDate) verificationQuery.startDate = new Date(query.startDate);
      if (query.endDate) verificationQuery.endDate = new Date(query.endDate);

      // Role-based filtering
      if (currentUser.role === 'student') {
        verificationQuery.studentId = currentUser.id;
      } else if (currentUser.role === 'parent') {
        // Would need to get children IDs
        verificationQuery.studentId = currentUser.id; // Placeholder
      } else if (currentUser.role === 'school_admin') {
        verificationQuery.schoolId = currentUser.schoolId;
      }

      const result = await rfidService.getVerificationHistory(verificationQuery);

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to get verification history', 500);
      }

      const response = {
        data: result.data,
        requestId: req.requestId,
      };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, response, { ttl: 300 });

      res.json(response);
    } catch (error: unknown) {
      logger.error(
        'Failed to get RFID verification history',
        error instanceof Error ? error : undefined,
        {
          requestId: req.requestId,
          userId: req.user?.id,
        }
      );
      throw error;
    }
  }
);

/**
 * GET /api/v1/rfid/analytics
 * Get RFID analytics
 */
router.get(
  '/analytics',
  readRateLimit,
  authMiddleware,
  requireRole(['school_admin', 'admin']),
  validateRequest({
    query: z.object({
      schoolId: z.string().uuid().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      groupBy: z.enum(['day', 'week', 'month']).optional(),
    }),
  }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { schoolId, startDate, endDate, groupBy } = req.query as any;
      const currentUser = req.user!;

      // Role-based filtering
      let targetSchoolId = schoolId;
      if (currentUser.role === 'school_admin') {
        targetSchoolId = currentUser.schoolId;
      }

      const query: any = {};
      if (targetSchoolId) query.schoolId = targetSchoolId;
      if (startDate) query.startDate = new Date(startDate);
      if (endDate) query.endDate = new Date(endDate);
      if (groupBy) query.groupBy = groupBy;

      const result = await rfidService.getCardAnalytics(query);

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to get RFID analytics', 500);
      }

      res.json({
        data: result.data,
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to get RFID analytics', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * DELETE /api/v1/rfid/cards/:id
 * Deactivate RFID card
 */
router.delete(
  '/cards/:id',
  writeRateLimit,
  authMiddleware,
  requireRole(['school_admin', 'admin']),
  validateRequest({ params: cardParamsSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.query as any;
      const currentUser = req.user!;

      // Check if card exists and user has permission
      const existingResult = await rfidService.getVerificationHistory({
        cardNumber: id, // This is a bit of a hack - would need proper card lookup
        limit: 1,
      });

      const result = await rfidService.deactivateCard(id, reason);

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to deactivate RFID card', 500);
      }

      // Invalidate caches
      await cacheService.invalidatePattern('rfid_cards:*');
      await cacheService.invalidatePattern(`rfid_card:${id}:*`);

      // Audit log
      await auditService.log(currentUser.id, 'rfid.deactivate_card', {
        cardId: id,
        reason: reason || 'No reason provided',
        requestId: req.requestId,
      });

      logger.info('RFID card deactivated successfully', {
        cardId: id,
        reason: reason || 'No reason provided',
        deactivatedBy: currentUser.id,
        requestId: req.requestId,
      });

      res.json({
        message: 'RFID card deactivated successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to deactivate RFID card', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        cardId: req.params.id,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * Register RFID card
 * POST /rfid/cards
 */
router.post(
  '/cards',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { cardNumber, studentId } = req.body;

    // Basic validation
    if (!studentId) {
      throw createValidationError('studentId is required');
    }

    // Fallback or autogenerated card number
    const generatedId = `RFID-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const finalCardNumber = cardNumber || generatedId;

    // Call RFID service to register
    const newCard = await rfidService.registerCard({
      cardNumber: finalCardNumber,
      studentId,
      schoolId: 'default-school-id', // TODO: Get from student or authenticated user context
      cardType: 'student' as const, // Default to student type
    });

    res.status(201).json({
      message: 'RFID card registered successfully',
      data: newCard,
    });
  })
);

/**
 * Deactivate RFID card
 * POST /rfid/cards/:id/deactivate
 */
router.post(
  '/cards/:id/deactivate',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await rfidService.deactivateCard(id);

    if (!result.success) {
      throw createValidationError(result.error?.message || 'Failed to deactivate card');
    }

    res.json({
      message: 'RFID card deactivated successfully',
      data: result.data,
    });
  })
);

/**
 * Bulk register RFID cards
 * POST /rfid/cards/bulk-register
 */
router.post(
  '/cards/bulk-register',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { schoolId, cards } = req.body;

    if (!schoolId || !Array.isArray(cards)) {
      throw createValidationError('schoolId and cards array are required');
    }

    const result = await rfidService.bulkRegisterCards({ schoolId, cards });

    res.status(201).json({
      message: 'RFID cards bulk registered successfully',
      data: result.data,
    });
  })
);

/**
 * Get verification history
 * GET /rfid/verifications
 */
router.get(
  '/verifications',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      cardNumber,
      studentId,
      schoolId,
      readerId,
      orderId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query: any = {
      page: Number(page),
      limit: Number(limit),
    };

    if (cardNumber) query.cardNumber = cardNumber as string;
    if (studentId) query.studentId = studentId as string;
    if (schoolId) query.schoolId = schoolId as string;
    if (readerId) query.readerId = readerId as string;
    if (orderId) query.orderId = orderId as string;
    if (startDate) query.startDate = new Date(startDate as string);
    if (endDate) query.endDate = new Date(endDate as string);

    const result = await rfidService.getVerificationHistory(query);

    if (!result.success) {
      throw createValidationError(result.error?.message || 'Failed to get verification history');
    }

    res.json({
      message: 'Verification history retrieved successfully',
      data: result.data,
    });
  })
);

/**
 * Get RFID analytics
 * GET /rfid/analytics
 */
router.get(
  '/analytics',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { schoolId, startDate, endDate, groupBy } = req.query;

    const query: any = {};
    if (schoolId) query.schoolId = schoolId as string;
    if (startDate) query.startDate = new Date(startDate as string);
    if (endDate) query.endDate = new Date(endDate as string);
    if (groupBy) query.groupBy = groupBy as 'day' | 'week' | 'month';

    const result = await rfidService.getCardAnalytics(query);

    if (!result.success) {
      throw createValidationError(result.error?.message || 'Failed to get analytics');
    }

    res.json({
      message: 'RFID analytics retrieved successfully',
      data: result.data,
    });
  })
);

/**
 * Extended RFID Features - Phase 2.1
 * Additional endpoints for bulk operations, mobile integration, and advanced verification
 */

/**
 * Bulk Import RFID Cards
 * POST /rfid/cards/bulk-import
 */
router.post(
  '/cards/bulk-import',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Forward to Lambda function
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body),
      headers: (req as any).headers,
      pathParameters: {},
      queryStringParameters: req.query,
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await bulkImportRfidCardsHandler(event as any, {} as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

/**
 * Get Single RFID Card Details
 * GET /rfid/cards/{cardNumber}
 */
router.get(
  '/cards/:cardNumber',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'GET',
      pathParameters: { cardNumber: req.params.cardNumber },
      headers: (req as any).headers,
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await getRfidCardHandler(event as any, {} as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

/**
 * Manage RFID Readers (CRUD operations)
 * POST/PUT/GET/DELETE /rfid/readers
 */
router.post(
  '/readers',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body),
      headers: (req as any).headers,
      pathParameters: {},
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await manageReadersHandler(event as any, {} as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

router.put(
  '/readers/:readerId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'PUT',
      body: JSON.stringify(req.body),
      headers: (req as any).headers,
      pathParameters: { readerId: req.params.readerId },
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await manageReadersHandler(event as any, {} as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

router.get(
  '/readers',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: req.query,
      headers: (req as any).headers,
      pathParameters: {},
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await manageReadersHandler(event as any, {} as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

router.get(
  '/readers/:readerId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'GET',
      pathParameters: { readerId: req.params.readerId },
      queryStringParameters: req.query,
      headers: (req as any).headers,
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await manageReadersHandler(event as any, {} as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

router.delete(
  '/readers/:readerId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'DELETE',
      pathParameters: { readerId: req.params.readerId },
      headers: (req as any).headers,
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await manageReadersHandler(event as any, {} as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

/**
 * Mobile Card Management - Parent Access
 * GET /rfid/mobile/students/{studentId}/card
 * POST /rfid/mobile/issues
 */
router.get(
  '/mobile/students/:studentId/card',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'GET',
      pathParameters: { studentId: req.params.studentId },
      headers: (req as any).headers,
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await getRfidCardStatus(event as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

router.post(
  '/mobile/issues',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body),
      headers: (req as any).headers,
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await reportRfidIssue(event as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

/**
 * Mobile Real-time Tracking
 * GET /rfid/mobile/students/{studentId}/tracking
 * PUT /rfid/mobile/orders/{orderId}/tracking
 */
router.get(
  '/mobile/students/:studentId/tracking',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'GET',
      pathParameters: { studentId: req.params.studentId },
      headers: (req as any).headers,
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await getMobileTrackingHandler(event as any, {} as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

router.put(
  '/mobile/orders/:orderId/tracking',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'PUT',
      body: JSON.stringify(req.body),
      pathParameters: { orderId: req.params.orderId },
      headers: (req as any).headers,
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await updateTrackingStatusHandler(event as any, {} as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

/**
 * Photo Verification for Delivery
 * POST /rfid/photo-verification
 * POST /rfid/photo-verification/upload-url
 * GET /rfid/photo-verification/{verificationId}
 */
router.post(
  '/photo-verification',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body),
      headers: (req as any).headers,
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await photoVerificationHandler(event as any, {} as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

router.post(
  '/photo-verification/upload-url',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body),
      headers: (req as any).headers,
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await photoUploadRequestHandler(event as any, {} as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

router.get(
  '/photo-verification/:verificationId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const event = {
      httpMethod: 'GET',
      pathParameters: { verificationId: req.params.verificationId },
      headers: (req as any).headers,
      requestContext: {
        authorizer: {
          principalId: req.user?.id,
        },
      },
    };

    const result = await getPhotoVerificationHandler(event as any, {} as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  })
);

export default router;
