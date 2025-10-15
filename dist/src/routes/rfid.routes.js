"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rfidRouter = void 0;
const express_1 = require("express");
const rfid_service_1 = require("@/services/rfid.service");
const error_middleware_1 = require("@/middleware/error.middleware");
const auth_middleware_1 = require("@/middleware/auth.middleware");
const bulk_import_cards_1 = require("@/functions/rfid/bulk-import-cards");
const get_card_1 = require("@/functions/rfid/get-card");
const manage_readers_1 = require("@/functions/rfid/manage-readers");
const mobile_card_management_1 = require("@/functions/rfid/mobile-card-management");
const mobile_tracking_1 = require("@/functions/rfid/mobile-tracking");
const photo_verification_1 = require("@/functions/rfid/photo-verification");
const router = (0, express_1.Router)();
exports.rfidRouter = router;
router.post('/cards', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { cardNumber, studentId } = req.body;
    if (!studentId) {
        throw (0, error_middleware_1.createValidationError)('studentId is required');
    }
    const generatedId = `RFID-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const finalCardNumber = cardNumber || generatedId;
    const newCard = await rfid_service_1.rfidService.registerCard({
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
    const result = await rfid_service_1.rfidService.deactivateCard(id);
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
    const result = await rfid_service_1.rfidService.bulkRegisterCards({ schoolId, cards });
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
    const result = await rfid_service_1.rfidService.getVerificationHistory(query);
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
    const result = await rfid_service_1.rfidService.getCardAnalytics(query);
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
//# sourceMappingURL=rfid.routes.js.map