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
const order_repository_1 = require("../repositories/order.repository");
const payment_service_1 = require("../services/payment.service");
const inventory_service_1 = require("../services/inventory.service");
const notification_service_1 = require("../services/notification.service");
const cache_service_1 = require("../services/cache.service");
const audit_service_1 = require("../services/audit.service");
const websocket_service_1 = require("../services/websocket.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const router = express_1.default.Router();
const orderService = order_service_1.OrderService.getInstance();
const paymentService = new payment_service_1.PaymentService();
const inventoryService = new inventory_service_1.InventoryService();
const notificationService = notification_service_1.NotificationService.getInstance();
const cacheService = new cache_service_1.CacheService();
const auditService = new audit_service_1.AuditService();
const wsService = new websocket_service_1.WebSocketService();
const readRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 150, windowMs: 60000 });
const writeRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 30, windowMs: 60000 });
const publicRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 100, windowMs: 60000 });
const createOrderSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid('Invalid student ID'),
    schoolId: zod_1.z.string().uuid('Invalid school ID'),
    deliveryDate: zod_1.z.string().datetime('Invalid delivery date'),
    deliveryTimeSlot: zod_1.z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    items: zod_1.z
        .array(zod_1.z.object({
        menuItemId: zod_1.z.string().uuid('Invalid menu item ID'),
        quantity: zod_1.z.number().min(1, 'Quantity must be at least 1').max(10, 'Max 10 items per type'),
        customizations: zod_1.z
            .object({
            spiceLevel: zod_1.z.number().min(0).max(5).optional(),
            excludeIngredients: zod_1.z.array(zod_1.z.string()).optional(),
            addOns: zod_1.z.array(zod_1.z.string()).optional(),
            specialInstructions: zod_1.z.string().max(200).optional(),
        })
            .optional(),
        unitPrice: zod_1.z.number().min(0),
    }))
        .min(1, 'At least one item is required')
        .max(20, 'Maximum 20 different items per order'),
    paymentMethod: zod_1.z.enum(['wallet', 'card', 'upi', 'cash', 'subscription']),
    paymentDetails: zod_1.z
        .object({
        cardId: zod_1.z.string().optional(),
        upiId: zod_1.z.string().optional(),
        walletId: zod_1.z.string().optional(),
    })
        .optional(),
    deliveryAddress: zod_1.z.object({
        type: zod_1.z.enum(['school', 'home', 'custom']),
        address: zod_1.z.string().optional(),
        coordinates: zod_1.z
            .object({
            latitude: zod_1.z.number(),
            longitude: zod_1.z.number(),
        })
            .optional(),
        specialInstructions: zod_1.z.string().max(300).optional(),
    }),
    discountCode: zod_1.z.string().optional(),
    specialRequests: zod_1.z.string().max(500).optional(),
    parentConsent: zod_1.z.boolean().default(false),
});
const updateOrderSchema = zod_1.z.object({
    status: zod_1.z
        .enum([
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded',
    ])
        .optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        menuItemId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().min(1).max(10),
        customizations: zod_1.z
            .object({
            spiceLevel: zod_1.z.number().min(0).max(5).optional(),
            excludeIngredients: zod_1.z.array(zod_1.z.string()).optional(),
            addOns: zod_1.z.array(zod_1.z.string()).optional(),
            specialInstructions: zod_1.z.string().max(200).optional(),
        })
            .optional(),
        unitPrice: zod_1.z.number().min(0),
    }))
        .optional(),
    deliveryTimeSlot: zod_1.z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
    specialRequests: zod_1.z.string().max(500).optional(),
    cancellationReason: zod_1.z.string().max(300).optional(),
});
const orderQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/).optional(),
    limit: zod_1.z.string().regex(/^\d+$/).optional(),
    status: zod_1.z
        .enum([
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded',
    ])
        .optional(),
    studentId: zod_1.z.string().uuid().optional(),
    schoolId: zod_1.z.string().uuid().optional(),
    paymentMethod: zod_1.z.enum(['wallet', 'card', 'upi', 'cash', 'subscription']).optional(),
    deliveryTimeSlot: zod_1.z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
    deliveryDateFrom: zod_1.z.string().datetime().optional(),
    deliveryDateTo: zod_1.z.string().datetime().optional(),
    createdFrom: zod_1.z.string().datetime().optional(),
    createdTo: zod_1.z.string().datetime().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'deliveryDate', 'total', 'status']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    minAmount: zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/)
        .optional(),
    maxAmount: zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/)
        .optional(),
    includeCompleted: zod_1.z
        .string()
        .regex(/^(true|false)$/)
        .optional(),
});
const orderParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid order ID'),
});
router.get('/', readRateLimit, auth_middleware_1.authMiddleware, api_middleware_1.paginationMiddleware, (0, api_middleware_1.validateRequest)({ query: orderQuerySchema }), async (req, res) => {
    try {
        const currentUser = req.user;
        const { status, studentId, schoolId, paymentMethod, deliveryTimeSlot, deliveryDateFrom, deliveryDateTo, createdFrom, createdTo, search, sortBy = 'createdAt', sortOrder = 'desc', minAmount, maxAmount, includeCompleted = 'true', } = req.query;
        const { page, limit, offset } = req.pagination;
        const cacheKey = `orders:list:${JSON.stringify({
            ...req.query,
            page,
            limit,
            userId: currentUser.id,
            userRole: currentUser.role,
        })}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            logger_1.logger.info('Orders list served from cache', { requestId: req.requestId });
            res.json(cached);
            return;
        }
        const filters = {};
        switch (currentUser.role) {
            case 'student':
                filters.studentId = currentUser.id;
                break;
            case 'parent':
                const children = await orderService.getParentChildren(currentUser.id);
                filters.studentId = children.map(child => child.id);
                break;
            case 'teacher':
            case 'school_admin':
                filters.schoolId = currentUser.schoolId;
                break;
            case 'kitchen_staff':
                filters.schoolId = currentUser.schoolId;
                filters.status = ['confirmed', 'preparing', 'ready', 'out_for_delivery'];
                break;
        }
        if (status)
            filters.status = status;
        if (studentId && ['school_admin', 'admin', 'teacher'].includes(currentUser.role)) {
            filters.studentId = studentId;
        }
        if (schoolId && ['admin'].includes(currentUser.role)) {
            filters.schoolId = schoolId;
        }
        if (paymentMethod)
            filters.paymentMethod = paymentMethod;
        if (deliveryTimeSlot)
            filters.deliveryTimeSlot = deliveryTimeSlot;
        if (deliveryDateFrom || deliveryDateTo) {
            filters.deliveryDate = {};
            if (deliveryDateFrom)
                filters.deliveryDate.$gte = new Date(deliveryDateFrom);
            if (deliveryDateTo)
                filters.deliveryDate.$lte = new Date(deliveryDateTo);
        }
        if (createdFrom || createdTo) {
            filters.createdAt = {};
            if (createdFrom)
                filters.createdAt.$gte = new Date(createdFrom);
            if (createdTo)
                filters.createdAt.$lte = new Date(createdTo);
        }
        if (minAmount || maxAmount) {
            filters.total = {};
            if (minAmount)
                filters.total.$gte = parseFloat(minAmount);
            if (maxAmount)
                filters.total.$lte = parseFloat(maxAmount);
        }
        if (search)
            filters.search = search;
        if (includeCompleted === 'false') {
            filters.status = { $nin: ['delivered', 'cancelled', 'refunded'] };
        }
        const result = await orderService.findMany({
            ...filters,
            skip: (page - 1) * limit,
            take: limit,
            sortBy,
            sortOrder,
        });
        const totalCount = await order_repository_1.OrderRepository.count(filters);
        const enrichedOrders = await Promise.all(result.items.map(async (order) => {
            const [trackingInfo, estimatedDelivery] = await Promise.all([
                orderService.getTrackingInfo(order.id),
                orderService.estimateDeliveryTime(order.id),
            ]);
            return {
                ...order,
                trackingInfo,
                estimatedDelivery,
                paymentDetails: ['admin', 'school_admin'].includes(currentUser.role)
                    ? order.paymentDetails
                    : undefined,
            };
        }));
        const statusCounts = await orderService.getStatusCounts(currentUser.schoolId || '');
        const response = {
            data: enrichedOrders,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: page < Math.ceil(totalCount / limit),
                hasPrev: page > 1,
            },
            summary: {
                statusCounts,
                totalAmount: 0,
                avgOrderValue: 0,
            },
            requestId: req.requestId,
        };
        await cacheService.set(cacheKey, response, { ttl: 120 });
        res.json(response);
    }
    catch (error) {
        logger_1.logger.error('Failed to list orders', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            userId: req.user?.id,
            query: req.query,
        });
        throw error;
    }
});
router.get('/:id', readRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({ params: orderParamsSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        const order = await orderService.findById(id);
        if (!order) {
            throw new errors_1.AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }
        const canView = await orderService.canUserAccessOrder(currentUser.id, id);
        if (!canView) {
            throw new errors_1.AppError('You do not have permission to view this order', 403, true);
        }
        const [trackingInfo, deliveryStatus, paymentStatus, preparationInfo] = await Promise.all([
            orderService.getDetailedTrackingInfo(id),
            orderService.getDeliveryStatus(id),
            payment_service_1.PaymentService.getPaymentStatus(order.id),
            orderService.getPreparationInfo(id),
        ]);
        const enrichedOrder = {
            ...order,
            trackingInfo,
            deliveryStatus,
            paymentStatus,
            preparationInfo,
            canCancel: await orderService.canCancelOrder(id),
            canModify: await orderService.canModifyOrder(id),
            refundEligible: await orderService.isRefundEligible(id),
            paymentDetails: ['admin', 'school_admin', 'kitchen_staff'].includes(currentUser.role)
                ? order.paymentDetails
                : undefined,
            deliveryDetails: order.studentId === currentUser.id ||
                ['admin', 'school_admin', 'kitchen_staff', 'delivery_staff'].includes(currentUser.role)
                ? order.deliveryDetails
                : undefined,
        };
        await auditService.log(currentUser.id, 'orders.view', {
            orderId: id,
            orderStatus: order.status,
            requestId: req.requestId,
        });
        res.json({
            data: enrichedOrder,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get order', error instanceof Error ? error : new Error(String(error)), {
            requestId: req.requestId,
            orderId: req.params.id,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.post('/', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['student', 'parent']), (0, api_middleware_1.validateRequest)({ body: createOrderSchema }), async (req, res) => {
    try {
        const orderData = req.body;
        const currentUser = req.user;
        if (currentUser.role === 'parent') {
            const canOrderFor = await orderService.canParentOrderForStudent(currentUser.id, orderData.studentId);
            if (!canOrderFor) {
                throw new errors_1.AppError('You do not have permission to place orders for this student', 403, true);
            }
        }
        else if (currentUser.role === 'student' && orderData.studentId !== currentUser.id) {
            throw new errors_1.AppError('Students can only place orders for themselves', 403, true);
        }
        const deliveryValidation = await orderService.validateDeliverySlot(orderData.deliveryDate, orderData.deliveryTimeSlot);
        if (!deliveryValidation.valid) {
            throw new errors_1.AppError(`Invalid delivery slot: ${deliveryValidation.message}`, 400, true);
        }
        const itemsValidation = await orderService.validateOrderItems(orderData.items);
        if (!itemsValidation.valid) {
            throw new errors_1.AppError(`Invalid order items: ${itemsValidation.errors ? itemsValidation.errors.join(', ') : 'Unknown error'}`, 400, true);
        }
        const inventoryCheck = await inventoryService.checkAvailability(orderData.items, orderData.schoolId, orderData.deliveryDate);
        if (!inventoryCheck.isAvailable) {
            throw new errors_1.AppError(`Insufficient inventory: ${inventoryCheck.unavailableItems.join(', ')}`, 400, true);
        }
        const pricingInfo = await orderService.calculateOrderPricing(orderData.items);
        const paymentValidation = await payment_service_1.PaymentService.validatePaymentOrder(orderData.paymentMethod);
        if (!paymentValidation) {
            throw new errors_1.AppError('Invalid payment method', 400, true);
        }
        const createOrderResult = await order_service_1.OrderService.createOrder({
            ...orderData,
            createdBy: currentUser.id,
            status: 'pending',
        });
        if (!createOrderResult.success || !createOrderResult.data) {
            throw new errors_1.AppError('Failed to create order', 500, true);
        }
        const newOrder = createOrderResult.data;
        await inventoryService.reserveItems(orderData.items, {
            orderId: newOrder.id,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });
        const paymentResult = await payment_service_1.PaymentService.processPayment({
            orderId: newOrder.id,
            amount: newOrder.total || 0,
            currency: newOrder.currency || 'INR',
            paymentMethod: orderData.paymentMethod,
            paymentDetails: orderData.paymentDetails,
        });
        if (paymentResult.success && paymentResult.data) {
            await orderService.updateStatus(newOrder.id, 'confirmed');
            await inventoryService.confirmReservation(newOrder.id);
            await notificationService.constructor.sendOrderConfirmation(newOrder.id);
            wsService.emitToUser(currentUser.id, 'order.created', {
                orderId: newOrder.id,
                status: 'confirmed',
            });
            wsService.emitToSchool(orderData.schoolId, 'new.order', {
                orderId: newOrder.id,
                deliveryTimeSlot: orderData.deliveryTimeSlot,
                deliveryDate: orderData.deliveryDate,
            });
        }
        else {
            await orderService.updateStatus(newOrder.id, 'cancelled');
            await inventoryService.releaseReservation(newOrder.id);
            throw new errors_1.AppError(`Payment failed: ${paymentResult.error?.message || 'Unknown error'}`, 402, true);
        }
        await cacheService.invalidatePattern('orders:*');
        await cacheService.invalidatePattern(`inventory:${orderData.schoolId}:*`);
        await auditService.log(currentUser.id, 'orders.create', {
            orderId: newOrder.id,
            studentId: orderData.studentId,
            schoolId: orderData.schoolId,
            total: newOrder.total || 0,
            itemCount: orderData.items.length,
            requestId: req.requestId,
        });
        logger_1.logger.info('Order created successfully', {
            orderId: newOrder.id,
            studentId: orderData.studentId,
            schoolId: orderData.schoolId,
            total: newOrder.total || 0,
            paymentMethod: orderData.paymentMethod,
            createdBy: currentUser.id,
            requestId: req.requestId,
        });
        res.status(201).json({
            data: {
                ...newOrder,
                paymentResult,
            },
            message: 'Order created successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create order', error instanceof Error ? error : new Error(String(error)), {
            requestId: req.requestId,
            orderData: { ...req.body, paymentDetails: undefined },
            userId: req.user?.id,
        });
        throw error;
    }
});
router.put('/:id', writeRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({
    params: orderParamsSchema,
    body: updateOrderSchema,
}), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const currentUser = req.user;
        const existingOrder = await orderService.findById(id);
        if (!existingOrder) {
            throw new errors_1.AppError('Order not found', 404, true);
        }
        const canUpdate = await orderService.canUserUpdateOrder(currentUser.id, id);
        if (!canUpdate) {
            throw new errors_1.AppError('You do not have permission to update this order', 403, true);
        }
        if (updateData.status) {
            const canChangeStatus = await orderService.canChangeStatus(id, updateData.status);
            if (!canChangeStatus) {
                throw new errors_1.AppError(`Cannot change status from ${existingOrder.status} to ${updateData.status}`, 400, true);
            }
        }
        if (updateData.items) {
            const modificationValidation = await orderService.validateOrderItems(updateData.items);
            if (!modificationValidation.valid) {
                throw new errors_1.AppError(`Cannot modify items: ${modificationValidation.errors ? modificationValidation.errors.join(', ') : 'Unknown error'}`, 400, true);
            }
            await inventoryService.updateReservation(id, updateData.items);
        }
        const updatedOrder = await orderService.update(id, {
            ...updateData,
            updatedBy: currentUser.id,
        });
        if (updateData.status) {
            await orderService.handleStatusUpdate(id, updateData.status);
            await notificationService.constructor.sendStatusUpdate(id, updateData.status);
            wsService.emitToUser(existingOrder.studentId, 'order.status.updated', {
                orderId: id,
                status: updateData.status,
                timestamp: new Date(),
            });
            if (existingOrder.parentId) {
                wsService.emitToUser(existingOrder.parentId, 'order.status.updated', {
                    orderId: id,
                    status: updateData.status,
                    timestamp: new Date(),
                });
            }
        }
        await cacheService.invalidatePattern(`orders:*`);
        await cacheService.invalidatePattern(`order:${id}:*`);
        await auditService.log(currentUser.id, 'orders.update', {
            orderId: id,
            changes: Object.keys(updateData),
            previousStatus: existingOrder.status,
            newStatus: updateData.status,
            requestId: req.requestId,
        });
        logger_1.logger.info('Order updated successfully', {
            orderId: id,
            changes: Object.keys(updateData),
            updatedBy: currentUser.id,
            previousStatus: existingOrder.status,
            newStatus: updateData.status,
            requestId: req.requestId,
        });
        res.json({
            data: updatedOrder,
            message: 'Order updated successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update order', error instanceof Error ? error : new Error(String(error)), {
            requestId: req.requestId,
            orderId: req.params.id,
            updateData: req.body,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.post('/:id/cancel', writeRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({
    params: orderParamsSchema,
    body: zod_1.z.object({
        reason: zod_1.z.string().min(1, 'Cancellation reason is required').max(300),
        refundRequested: zod_1.z.boolean().default(true),
    }),
}), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, refundRequested } = req.body;
        const currentUser = req.user;
        const order = await orderService.findById(id);
        if (!order) {
            throw new errors_1.AppError('Order not found', 404, true);
        }
        const canCancel = await orderService.canCancelOrder(id);
        if (!canCancel) {
            throw new errors_1.AppError('Cannot cancel order', 400, true);
        }
        const cancellationResult = await orderService.cancelOrder(id);
        let refundResult = null;
        if (refundRequested) {
            try {
                const payments = await paymentService.findByOrder(id);
                if (payments.length > 0) {
                    const payment = payments[0];
                    await paymentService.refund(payment.id);
                    refundResult = { amount: payment.amount, status: 'refunded' };
                }
            }
            catch (error) {
                logger_1.logger.error('Refund processing failed', error instanceof Error ? error : undefined);
            }
        }
        await inventoryService.releaseReservation(id);
        await notificationService.constructor.sendOrderCancellation(id, reason);
        wsService.emitToUser(order.studentId, 'order.cancelled', {
            orderId: id,
            reason,
            refundAmount: refundResult?.amount,
            timestamp: new Date(),
        });
        await auditService.log(currentUser.id, 'orders.cancel', {
            orderId: id,
            reason,
            refundRequested,
            refundAmount: refundResult?.amount,
            requestId: req.requestId,
        });
        logger_1.logger.info('Order cancelled successfully', {
            orderId: id,
            reason,
            refundRequested,
            refundAmount: refundResult?.amount,
            cancelledBy: currentUser.id,
            requestId: req.requestId,
        });
        res.json({
            data: {
                ...cancellationResult,
                refund: refundResult,
            },
            message: 'Order cancelled successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to cancel order', error instanceof Error ? error : new Error(String(error)), {
            requestId: req.requestId,
            orderId: req.params.id,
            reason: req.body.reason,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.get('/:id/tracking', readRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({ params: orderParamsSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        const order = await orderService.findById(id);
        if (!order) {
            throw new errors_1.AppError('Order not found', 404, true);
        }
        const canView = await orderService.canUserAccessOrder(currentUser.id, id);
        if (!canView) {
            throw new errors_1.AppError('You do not have permission to track this order', 403, true);
        }
        const trackingInfo = await orderService.getComprehensiveTrackingInfo(id);
        res.json({
            data: trackingInfo,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get order tracking', error instanceof Error ? error : new Error(String(error)), {
            requestId: req.requestId,
            orderId: req.params.id,
            userId: req.user?.id,
        });
        throw error;
    }
});
exports.default = router;
//# sourceMappingURL=orders.routes.js.map