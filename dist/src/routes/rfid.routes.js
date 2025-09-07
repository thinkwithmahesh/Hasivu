"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rfidRouter = void 0;
const express_1 = require("express");
const rfid_service_1 = require("@/services/rfid.service");
const error_middleware_1 = require("@/middleware/error.middleware");
const auth_middleware_1 = require("@/middleware/auth.middleware");
const router = (0, express_1.Router)();
exports.rfidRouter = router;
router.post('/cards', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { cardNumber, studentId } = req.body;
    if (!studentId) {
        throw (0, error_middleware_1.createValidationError)('studentId is required');
    }
    const generatedId = `RFID-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
    const finalCardNumber = cardNumber || generatedId;
    const newCard = await rfid_service_1.RFIDService.registerCard({
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
//# sourceMappingURL=rfid.routes.js.map