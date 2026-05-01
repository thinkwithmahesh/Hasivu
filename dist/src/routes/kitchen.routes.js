"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const api_middleware_1 = require("../middleware/api.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const order_service_1 = require("../services/order.service");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
const writeRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 30, windowMs: 60000 });
const readRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 150, windowMs: 60000 });
const orderService = order_service_1.OrderService.getInstance();
const kitchenOrderParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid order ID'),
});
const assignOrderBodySchema = zod_1.z.object({
    staffId: zod_1.z.string().uuid('staffId must be a valid UUID'),
});
const kitchenStaffQuerySchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid('schoolId must be a valid UUID'),
});
router.put('/orders/:id/assign', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['kitchen_staff', 'school_admin', 'admin', 'super_admin']), (0, api_middleware_1.validateRequest)({
    params: kitchenOrderParamsSchema,
    body: assignOrderBodySchema,
}), async (req, res) => {
    try {
        const { id } = req.params;
        const { staffId } = req.body;
        const currentUser = req.user;
        const existing = await orderService.findById(id);
        if (!existing) {
            throw new errors_1.AppError('Order not found', 404, true);
        }
        const schoolId = currentUser.schoolId ?? existing.schoolId;
        const order = await orderService.assignOrder(id, { staffId, schoolId }, currentUser.id, currentUser.role, currentUser.schoolId);
        res.json({
            success: true,
            data: order,
            message: 'Order assigned successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to assign order', error instanceof Error ? error : new Error(String(error)), { requestId: req.requestId, orderId: req.params.id });
        throw error;
    }
});
router.get('/staff', readRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['kitchen_staff', 'school_admin', 'admin', 'super_admin']), (0, api_middleware_1.validateRequest)({ query: kitchenStaffQuerySchema }), async (req, res) => {
    const currentUser = req.user;
    const { schoolId } = req.query;
    const elevated = ['admin', 'super_admin'].includes(currentUser.role);
    if (!elevated) {
        if (!currentUser.schoolId || currentUser.schoolId !== schoolId) {
            throw new errors_1.AppError('You can only list staff for your school', 403, true);
        }
    }
    const staff = await orderService.listAssignableStaff(schoolId);
    res.json({
        success: true,
        data: staff,
        requestId: req.requestId,
    });
});
exports.default = router;
//# sourceMappingURL=kitchen.routes.js.map