"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const api_middleware_1 = require("../middleware/api.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const rfid_service_1 = require("../services/rfid.service");
const audit_service_1 = require("../services/audit.service");
const cache_service_1 = require("../services/cache.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const bulk_import_cards_1 = require("../functions/rfid/bulk-import-cards");
const get_card_1 = require("../functions/rfid/get-card");
const manage_readers_1 = require("../functions/rfid/manage-readers");
const mobile_card_management_1 = require("../functions/rfid/mobile-card-management");
const mobile_tracking_1 = require("../functions/rfid/mobile-tracking");
const photo_verification_1 = require("../functions/rfid/photo-verification");
const router = express_1.default.Router();
const rfidService = rfid_service_1.RfidService.getInstance();
const auditService = new audit_service_1.AuditService();
const cacheService = new cache_service_1.CacheService();
const readRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 150, windowMs: 60000 });
const writeRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 30, windowMs: 60000 });
const verificationRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 100, windowMs: 60000 });
const registerCardSchema = zod_1.z.object({
    cardNumber: zod_1.z
        .string()
        .min(4)
        .max(20)
        .regex(/^[A-Z0-9-]+$/, 'Invalid card number format'),
    studentId: zod_1.z.string().uuid('Invalid student ID'),
    schoolId: zod_1.z.string().uuid('Invalid school ID'),
    cardType: zod_1.z.enum(['student', 'staff']).optional().default('student'),
    expiryDate: zod_1.z.string().datetime().optional(),
});
const bulkRegisterSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid(),
    cards: zod_1.z
        .array(zod_1.z.object({
        cardNumber: zod_1.z
            .string()
            .min(4)
            .max(20)
            .regex(/^[A-Z0-9-]+$/),
        studentId: zod_1.z.string().uuid(),
        cardType: zod_1.z.enum(['student', 'staff']).optional().default('student'),
    }))
        .min(1)
        .max(100),
});
const verifyDeliverySchema = zod_1.z.object({
    cardNumber: zod_1.z
        .string()
        .min(4)
        .max(20)
        .regex(/^[A-Z0-9-]+$/),
    readerId: zod_1.z.string().uuid().optional(),
    orderId: zod_1.z.string().uuid().optional(),
    signalStrength: zod_1.z.number().min(0).max(100).optional(),
    readDuration: zod_1.z.number().min(0).max(10000).optional(),
    location: zod_1.z.string().max(200).optional(),
    timestamp: zod_1.z.string().datetime().optional(),
});
const updateReaderSchema = zod_1.z.object({
    status: zod_1.z.enum(['online', 'offline', 'maintenance']).optional(),
    location: zod_1.z.string().max(200).optional(),
    metadata: zod_1.z.object({}).optional(),
});
const verificationHistorySchema = zod_1.z.object({
    cardNumber: zod_1.z.string().optional(),
    studentId: zod_1.z.string().uuid().optional(),
    schoolId: zod_1.z.string().uuid().optional(),
    readerId: zod_1.z.string().uuid().optional(),
    orderId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    page: zod_1.z.string().regex(/^\d+$/).optional(),
    limit: zod_1.z.string().regex(/^\d+$/).optional(),
});
const cardParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid card ID'),
});
const readerParamsSchema = zod_1.z.object({
    readerId: zod_1.z.string().uuid('Invalid reader ID'),
});
router.post('/cards', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['school_admin', 'admin']), (0, api_middleware_1.validateRequest)({ body: registerCardSchema }), async (req, res) => {
    try {
        const cardData = req.body;
        const currentUser = req.user;
        if (currentUser.role === 'school_admin' && cardData.schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('You can only register cards for your school', 403);
        }
        const result = await rfidService.registerCard(cardData);
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to register RFID card', 500);
        }
        await cacheService.invalidatePattern('rfid_cards:*');
        await auditService.log(currentUser.id, 'rfid.register_card', {
            cardId: result.data.id,
            cardNumber: cardData.cardNumber,
            studentId: cardData.studentId,
            schoolId: cardData.schoolId,
            requestId: req.requestId,
        });
        logger_1.logger.info('RFID card registered successfully', {
            cardId: result.data.id,
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
    }
    catch (error) {
        logger_1.logger.error('Failed to register RFID card', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.post('/cards/bulk', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['school_admin', 'admin']), (0, api_middleware_1.validateRequest)({ body: bulkRegisterSchema }), async (req, res) => {
    try {
        const { schoolId, cards } = req.body;
        const currentUser = req.user;
        if (currentUser.role === 'school_admin' && schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('You can only bulk register cards for your school', 403);
        }
        const result = await rfidService.bulkRegisterCards({ schoolId, cards });
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to bulk register RFID cards', 500);
        }
        await cacheService.invalidatePattern('rfid_cards:*');
        await auditService.log(currentUser.id, 'rfid.bulk_register_cards', {
            schoolId,
            cardCount: cards.length,
            successful: result.data.successful.length,
            failed: result.data.failed.length,
            requestId: req.requestId,
        });
        logger_1.logger.info('RFID cards bulk registered successfully', {
            schoolId,
            cardCount: cards.length,
            successful: result.data.successful.length,
            failed: result.data.failed.length,
            registeredBy: currentUser.id,
            requestId: req.requestId,
        });
        res.status(201).json({
            data: result.data,
            message: 'RFID cards bulk registered successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to bulk register RFID cards', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.post('/verify-delivery', verificationRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({ body: verifyDeliverySchema }), async (req, res) => {
    try {
        const verificationData = req.body;
        const currentUser = req.user;
        const result = await rfidService.verifyDelivery(verificationData);
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to verify delivery', 500);
        }
        await cacheService.invalidatePattern('rfid_verifications:*');
        await auditService.log(currentUser.id, 'rfid.verify_delivery', {
            cardNumber: verificationData.cardNumber,
            verificationId: result.data.verificationId,
            orderId: verificationData.orderId,
            readerId: verificationData.readerId,
            requestId: req.requestId,
        });
        logger_1.logger.info('RFID delivery verified successfully', {
            cardNumber: verificationData.cardNumber,
            verificationId: result.data.verificationId,
            studentId: result.data.studentId,
            verifiedBy: currentUser.id,
            requestId: req.requestId,
        });
        res.json({
            data: result.data,
            message: 'Delivery verified successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to verify RFID delivery', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.put('/readers/:readerId', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['school_admin', 'admin', 'kitchen_staff']), (0, api_middleware_1.validateRequest)({
    params: readerParamsSchema,
    body: updateReaderSchema,
}), async (req, res) => {
    try {
        const { readerId } = req.params;
        const updateData = req.body;
        const currentUser = req.user;
        const result = await rfidService.updateReaderStatus({
            readerId,
            ...updateData,
        });
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to update reader status', 500);
        }
        await cacheService.invalidatePattern(`rfid_reader:${readerId}:*`);
        await auditService.log(currentUser.id, 'rfid.update_reader', {
            readerId,
            changes: Object.keys(updateData),
            newStatus: updateData.status,
            requestId: req.requestId,
        });
        logger_1.logger.info('RFID reader updated successfully', {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to update RFID reader', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            readerId: req.params.readerId,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.get('/verifications', readRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({ query: verificationHistorySchema }), async (req, res) => {
    try {
        const query = req.query;
        const currentUser = req.user;
        const cacheKey = `rfid_verifications:${JSON.stringify({ ...query, userId: currentUser.id })}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            logger_1.logger.info('RFID verifications served from cache', { requestId: req.requestId });
            res.json(cached);
            return;
        }
        const verificationQuery = {
            page: query.page ? parseInt(query.page, 10) : 1,
            limit: query.limit ? Math.min(parseInt(query.limit, 10), 100) : 20,
        };
        if (query.cardNumber)
            verificationQuery.cardNumber = query.cardNumber;
        if (query.studentId)
            verificationQuery.studentId = query.studentId;
        if (query.schoolId)
            verificationQuery.schoolId = query.schoolId;
        if (query.readerId)
            verificationQuery.readerId = query.readerId;
        if (query.orderId)
            verificationQuery.orderId = query.orderId;
        if (query.startDate)
            verificationQuery.startDate = new Date(query.startDate);
        if (query.endDate)
            verificationQuery.endDate = new Date(query.endDate);
        if (currentUser.role === 'student') {
            verificationQuery.studentId = currentUser.id;
        }
        else if (currentUser.role === 'parent') {
            verificationQuery.studentId = currentUser.id;
        }
        else if (currentUser.role === 'school_admin') {
            verificationQuery.schoolId = currentUser.schoolId;
        }
        const result = await rfidService.getVerificationHistory(verificationQuery);
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to get verification history', 500);
        }
        const response = {
            data: result.data,
            requestId: req.requestId,
        };
        await cacheService.set(cacheKey, response, { ttl: 300 });
        res.json(response);
    }
    catch (error) {
        logger_1.logger.error('Failed to get RFID verification history', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.get('/analytics', readRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['school_admin', 'admin']), (0, api_middleware_1.validateRequest)({
    query: zod_1.z.object({
        schoolId: zod_1.z.string().uuid().optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        groupBy: zod_1.z.enum(['day', 'week', 'month']).optional(),
    }),
}), async (req, res) => {
    try {
        const { schoolId, startDate, endDate, groupBy } = req.query;
        const currentUser = req.user;
        let targetSchoolId = schoolId;
        if (currentUser.role === 'school_admin') {
            targetSchoolId = currentUser.schoolId;
        }
        const query = {};
        if (targetSchoolId)
            query.schoolId = targetSchoolId;
        if (startDate)
            query.startDate = new Date(startDate);
        if (endDate)
            query.endDate = new Date(endDate);
        if (groupBy)
            query.groupBy = groupBy;
        const result = await rfidService.getCardAnalytics(query);
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to get RFID analytics', 500);
        }
        res.json({
            data: result.data,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get RFID analytics', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.delete('/cards/:id', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['school_admin', 'admin']), (0, api_middleware_1.validateRequest)({ params: cardParamsSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.query;
        const currentUser = req.user;
        const existingResult = await rfidService.getVerificationHistory({
            cardNumber: id,
            limit: 1,
        });
        const result = await rfidService.deactivateCard(id, reason);
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to deactivate RFID card', 500);
        }
        await cacheService.invalidatePattern('rfid_cards:*');
        await cacheService.invalidatePattern(`rfid_card:${id}:*`);
        await auditService.log(currentUser.id, 'rfid.deactivate_card', {
            cardId: id,
            reason: reason || 'No reason provided',
            requestId: req.requestId,
        });
        logger_1.logger.info('RFID card deactivated successfully', {
            cardId: id,
            reason: reason || 'No reason provided',
            deactivatedBy: currentUser.id,
            requestId: req.requestId,
        });
        res.json({
            message: 'RFID card deactivated successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to deactivate RFID card', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            cardId: req.params.id,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.post('/cards', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { cardNumber, studentId } = req.body;
    if (!studentId) {
        throw (0, error_middleware_1.createValidationError)('studentId is required');
    }
    const generatedId = `RFID-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const finalCardNumber = cardNumber || generatedId;
    const newCard = await rfidService.registerCard({
        cardNumber: finalCardNumber,
        studentId,
        schoolId: 'default-school-id',
        cardType: 'student',
    });
    res.status(201).json({
        message: 'RFID card registered successfully',
        data: newCard,
    });
}));
router.post('/cards/:id/deactivate', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await rfidService.deactivateCard(id);
    if (!result.success) {
        throw (0, error_middleware_1.createValidationError)(result.error?.message || 'Failed to deactivate card');
    }
    res.json({
        message: 'RFID card deactivated successfully',
        data: result.data,
    });
}));
router.post('/cards/bulk-register', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId, cards } = req.body;
    if (!schoolId || !Array.isArray(cards)) {
        throw (0, error_middleware_1.createValidationError)('schoolId and cards array are required');
    }
    const result = await rfidService.bulkRegisterCards({ schoolId, cards });
    res.status(201).json({
        message: 'RFID cards bulk registered successfully',
        data: result.data,
    });
}));
router.get('/verifications', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { cardNumber, studentId, schoolId, readerId, orderId, startDate, endDate, page = 1, limit = 20, } = req.query;
    const query = {
        page: Number(page),
        limit: Number(limit),
    };
    if (cardNumber)
        query.cardNumber = cardNumber;
    if (studentId)
        query.studentId = studentId;
    if (schoolId)
        query.schoolId = schoolId;
    if (readerId)
        query.readerId = readerId;
    if (orderId)
        query.orderId = orderId;
    if (startDate)
        query.startDate = new Date(startDate);
    if (endDate)
        query.endDate = new Date(endDate);
    const result = await rfidService.getVerificationHistory(query);
    if (!result.success) {
        throw (0, error_middleware_1.createValidationError)(result.error?.message || 'Failed to get verification history');
    }
    res.json({
        message: 'Verification history retrieved successfully',
        data: result.data,
    });
}));
router.get('/analytics', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId, startDate, endDate, groupBy } = req.query;
    const query = {};
    if (schoolId)
        query.schoolId = schoolId;
    if (startDate)
        query.startDate = new Date(startDate);
    if (endDate)
        query.endDate = new Date(endDate);
    if (groupBy)
        query.groupBy = groupBy;
    const result = await rfidService.getCardAnalytics(query);
    if (!result.success) {
        throw (0, error_middleware_1.createValidationError)(result.error?.message || 'Failed to get analytics');
    }
    res.json({
        message: 'RFID analytics retrieved successfully',
        data: result.data,
    });
}));
router.post('/cards/bulk-import', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'POST',
        body: JSON.stringify(req.body),
        headers: req.headers,
        pathParameters: {},
        queryStringParameters: req.query,
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(event, {});
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.get('/cards/:cardNumber', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'GET',
        pathParameters: { cardNumber: req.params.cardNumber },
        headers: req.headers,
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, get_card_1.getRfidCardHandler)(event, {});
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.post('/readers', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'POST',
        body: JSON.stringify(req.body),
        headers: req.headers,
        pathParameters: {},
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, manage_readers_1.manageReadersHandler)(event, {});
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.put('/readers/:readerId', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'PUT',
        body: JSON.stringify(req.body),
        headers: req.headers,
        pathParameters: { readerId: req.params.readerId },
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, manage_readers_1.manageReadersHandler)(event, {});
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.get('/readers', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'GET',
        queryStringParameters: req.query,
        headers: req.headers,
        pathParameters: {},
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, manage_readers_1.manageReadersHandler)(event, {});
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.get('/readers/:readerId', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'GET',
        pathParameters: { readerId: req.params.readerId },
        queryStringParameters: req.query,
        headers: req.headers,
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, manage_readers_1.manageReadersHandler)(event, {});
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.delete('/readers/:readerId', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'DELETE',
        pathParameters: { readerId: req.params.readerId },
        headers: req.headers,
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, manage_readers_1.manageReadersHandler)(event, {});
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.get('/mobile/students/:studentId/card', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'GET',
        pathParameters: { studentId: req.params.studentId },
        headers: req.headers,
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, mobile_card_management_1.getRfidCardStatus)(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.post('/mobile/issues', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'POST',
        body: JSON.stringify(req.body),
        headers: req.headers,
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, mobile_card_management_1.reportRfidIssue)(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.get('/mobile/students/:studentId/tracking', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'GET',
        pathParameters: { studentId: req.params.studentId },
        headers: req.headers,
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, mobile_tracking_1.getMobileTrackingHandler)(event, {});
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.put('/mobile/orders/:orderId/tracking', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'PUT',
        body: JSON.stringify(req.body),
        pathParameters: { orderId: req.params.orderId },
        headers: req.headers,
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, mobile_tracking_1.updateTrackingStatusHandler)(event, {});
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.post('/photo-verification', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'POST',
        body: JSON.stringify(req.body),
        headers: req.headers,
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, photo_verification_1.photoVerificationHandler)(event, {});
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.post('/photo-verification/upload-url', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'POST',
        body: JSON.stringify(req.body),
        headers: req.headers,
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, photo_verification_1.photoUploadRequestHandler)(event, {});
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
router.get('/photo-verification/:verificationId', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const event = {
        httpMethod: 'GET',
        pathParameters: { verificationId: req.params.verificationId },
        headers: req.headers,
        requestContext: {
            authorizer: {
                principalId: req.user?.id,
            },
        },
    };
    const result = await (0, photo_verification_1.getPhotoVerificationHandler)(event, {});
    res.status(result.statusCode).json(JSON.parse(result.body));
}));
exports.default = router;
//# sourceMappingURL=rfid.routes.js.map