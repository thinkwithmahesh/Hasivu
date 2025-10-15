"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const api_middleware_1 = require("../middleware/api.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const kitchen_service_1 = require("../services/kitchen.service");
const inventory_service_1 = require("../services/inventory.service");
const quality_control_service_1 = require("../services/quality-control.service");
const production_service_1 = require("../services/production.service");
const staff_management_service_1 = require("../services/staff-management.service");
const cache_service_1 = require("../services/cache.service");
const audit_service_1 = require("../services/audit.service");
const notification_service_1 = require("../services/notification.service");
const websocket_service_1 = require("../services/websocket.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const router = express_1.default.Router();
const kitchenService = new kitchen_service_1.KitchenService();
const inventoryService = new inventory_service_1.InventoryService();
const qualityControlService = new quality_control_service_1.QualityControlService();
const productionService = new production_service_1.ProductionService();
const staffManagementService = new staff_management_service_1.StaffManagementService();
const cacheService = new cache_service_1.CacheService();
const auditService = new audit_service_1.AuditService();
const notificationService = new notification_service_1.NotificationService();
const wsService = new websocket_service_1.WebSocketService();
const readRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 200, windowMs: 60000 });
const writeRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 100, windowMs: 60000 });
const operationsRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 300, windowMs: 60000 });
const orderUpdateSchema = zod_1.z.object({
    orderId: zod_1.z.string().uuid('Invalid order ID'),
    status: zod_1.z.enum([
        'received',
        'preparing',
        'cooking',
        'quality_check',
        'packaging',
        'ready',
        'dispatched'
    ]),
    estimatedCompletionTime: zod_1.z.string().datetime().optional(),
    notes: zod_1.z.string().max(500).optional(),
    qualityChecks: zod_1.z.array(zod_1.z.object({
        checkType: zod_1.z.enum(['temperature', 'appearance', 'taste', 'freshness', 'hygiene']),
        status: zod_1.z.enum(['pass', 'fail', 'pending']),
        notes: zod_1.z.string().max(200).optional(),
        checkedBy: zod_1.z.string().uuid().optional()
    })).optional()
});
const inventoryUpdateSchema = zod_1.z.object({
    itemId: zod_1.z.string().uuid('Invalid item ID'),
    operation: zod_1.z.enum(['add', 'consume', 'adjust', 'expire', 'waste']),
    quantity: zod_1.z.number().min(0, 'Quantity must be non-negative'),
    unit: zod_1.z.enum(['kg', 'g', 'l', 'ml', 'pieces', 'packets']),
    reason: zod_1.z.string().max(200).optional(),
    batchNumber: zod_1.z.string().optional(),
    expiryDate: zod_1.z.string().datetime().optional(),
    cost: zod_1.z.number().min(0).optional(),
    supplierId: zod_1.z.string().uuid().optional()
});
const productionPlanSchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    mealType: zod_1.z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    items: zod_1.z.array(zod_1.z.object({
        menuItemId: zod_1.z.string().uuid('Invalid menu item ID'),
        plannedQuantity: zod_1.z.number().min(1, 'Planned quantity must be at least 1'),
        startTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        estimatedDuration: zod_1.z.number().min(15, 'Duration must be at least 15 minutes'),
        assignedStaff: zod_1.z.array(zod_1.z.string().uuid()).optional(),
        requiredEquipment: zod_1.z.array(zod_1.z.string()).optional(),
        specialInstructions: zod_1.z.string().max(300).optional()
    })).min(1, 'At least one item is required'),
    totalCapacity: zod_1.z.number().min(1),
    notes: zod_1.z.string().max(500).optional()
});
const qualityCheckSchema = zod_1.z.object({
    orderId: zod_1.z.string().uuid('Invalid order ID').optional(),
    batchId: zod_1.z.string().uuid('Invalid batch ID').optional(),
    itemId: zod_1.z.string().uuid('Invalid item ID'),
    checkType: zod_1.z.enum(['temperature', 'appearance', 'taste', 'freshness', 'hygiene', 'packaging']),
    result: zod_1.z.enum(['pass', 'fail']),
    temperature: zod_1.z.number().optional(),
    notes: zod_1.z.string().max(300).optional(),
    images: zod_1.z.array(zod_1.z.string().url()).optional(),
    corrective_action: zod_1.z.string().max(500).optional()
});
const staffScheduleSchema = zod_1.z.object({
    staffId: zod_1.z.string().uuid('Invalid staff ID'),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    shift: zod_1.z.enum(['morning', 'afternoon', 'evening', 'night']),
    startTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    role: zod_1.z.enum(['chef', 'sous_chef', 'cook', 'prep_cook', 'dishwasher', 'cleaner']),
    assignedStations: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().max(200).optional()
});
const kitchenQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/).optional(),
    limit: zod_1.z.string().regex(/^\d+$/).optional(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: zod_1.z.string().optional(),
    mealType: zod_1.z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    sortBy: zod_1.z.enum(['createdAt', 'deliveryTime', 'priority']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional()
});
router.get('/dashboard', readRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['kitchen_staff', 'chef', 'school_admin', 'admin']), async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser.schoolId) {
            res.status(400).json({ error: 'School ID is required' });
            return;
        }
        const cacheKey = `kitchen:dashboard:${currentUser.schoolId}:${new Date().toISOString().split('T')[0]}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            res.json(cached);
            return;
        }
        const [orderQueue, productionSchedule, inventoryAlerts, qualityMetrics, staffStatus, equipmentStatus, performanceMetrics] = await Promise.all([
            kitchenService.getOrderQueue(currentUser.schoolId),
            productionService.getTodaySchedule(currentUser.schoolId),
            inventoryService.getCriticalAlerts(currentUser.schoolId),
            qualityControlService.getTodayMetrics(currentUser.schoolId),
            staffManagementService.getCurrentStaffStatus(currentUser.schoolId),
            kitchenService.getEquipmentStatus(currentUser.schoolId),
            kitchenService.getPerformanceMetrics(currentUser.schoolId)
        ]);
        const dashboardData = {
            orderQueue: {
                total: orderQueue.length,
                byStatus: orderQueue.reduce((acc, order) => {
                    acc[order.status] = (acc[order.status] || 0) + 1;
                    return acc;
                }, {}),
                urgent: orderQueue.filter((order) => order.priority === 'urgent').length,
                delayed: orderQueue.filter((order) => order.isDelayed).length
            },
            production: {
                todaySchedule: productionSchedule,
                completionRate: productionSchedule.completionRate,
                onTimeRate: productionSchedule.onTimeRate,
                nextMeal: productionSchedule.nextMeal
            },
            inventory: {
                criticalItems: inventoryAlerts.critical.length,
                lowStockItems: inventoryAlerts.low.length,
                nearExpiryItems: inventoryAlerts.nearExpiry.length,
                totalAlerts: inventoryAlerts.total
            },
            quality: {
                todayScore: qualityMetrics.averageScore,
                passRate: qualityMetrics.passRate,
                failedChecks: qualityMetrics.failedChecks,
                totalChecks: qualityMetrics.totalChecks
            },
            staff: {
                present: staffStatus.present,
                absent: staffStatus.absent,
                onBreak: staffStatus.onBreak,
                efficiency: staffStatus.averageEfficiency
            },
            equipment: {
                operational: equipmentStatus.operational,
                maintenance: equipmentStatus.maintenance,
                outOfOrder: equipmentStatus.outOfOrder,
                utilizationRate: equipmentStatus.utilizationRate
            },
            performance: {
                ordersCompleted: performanceMetrics.ordersCompleted,
                averagePreparationTime: performanceMetrics.avgPreparationTime,
                customerSatisfaction: performanceMetrics.customerSatisfaction,
                efficiency: performanceMetrics.efficiency
            },
            alerts: [
                ...inventoryAlerts.critical.map((item) => ({
                    type: 'inventory',
                    severity: 'high',
                    message: `Critical: ${item.name} is out of stock`,
                    action: 'Order immediately'
                })),
                ...qualityMetrics.recentFailures.map((check) => ({
                    type: 'quality',
                    severity: 'medium',
                    message: `Quality check failed: ${check.itemName}`,
                    action: 'Review preparation process'
                }))
            ],
            lastUpdated: new Date()
        };
        await cacheService.set(cacheKey, { data: dashboardData, requestId: req.requestId }, { ttl: 120 });
        res.json({
            data: dashboardData,
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get kitchen dashboard', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            userId: req.user?.id,
            schoolId: req.user?.schoolId
        });
        throw error;
    }
});
router.get('/orders', readRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['kitchen_staff', 'chef', 'school_admin', 'admin']), api_middleware_1.paginationMiddleware, (0, api_middleware_1.validateRequest)({ query: kitchenQuerySchema }), async (req, res) => {
    try {
        const currentUser = req.user;
        const { date = new Date().toISOString().split('T')[0], status, mealType, priority, sortBy = 'deliveryTime', sortOrder = 'asc' } = req.query;
        const { page, limit, offset } = req.pagination;
        const orders = await kitchenService.getOrderQueue(currentUser.schoolId, {
            date,
            status,
            mealType,
            priority,
            pagination: { page, limit, offset },
            sort: { field: sortBy, order: sortOrder }
        });
        const enrichedOrders = await Promise.all(orders.data.map(async (order) => {
            const [preparationStatus, ingredientAvailability, estimatedTime] = await Promise.all([
                kitchenService.getPreparationStatus(order.id),
                inventoryService.checkIngredientAvailability(order.items),
                kitchenService.estimatePreparationTime(order.items, currentUser.schoolId)
            ]);
            return {
                ...order,
                preparationStatus,
                ingredientAvailability,
                estimatedTime,
                canStart: preparationStatus.canStart && ingredientAvailability.allAvailable
            };
        }));
        res.json({
            data: enrichedOrders,
            pagination: {
                page,
                limit,
                total: orders.total,
                totalPages: Math.ceil(orders.total / limit),
                hasNext: page < Math.ceil(orders.total / limit),
                hasPrev: page > 1
            },
            summary: {
                totalOrders: orders.total,
                statusCounts: orders.statusCounts,
                priorityCounts: orders.priorityCounts,
                avgPreparationTime: orders.avgPreparationTime
            },
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get kitchen orders', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            userId: req.user?.id,
            query: req.query
        });
        throw error;
    }
});
router.put('/orders/:orderId/status', operationsRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['kitchen_staff', 'chef']), (0, api_middleware_1.validateRequest)({
    params: zod_1.z.object({ orderId: zod_1.z.string().uuid() }),
    body: orderUpdateSchema
}), async (req, res) => {
    try {
        const { orderId } = req.params;
        const updateData = req.body;
        const currentUser = req.user;
        const order = await kitchenService.getOrder(orderId);
        if (!order || order.schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('Order not found or access denied', 404);
        }
        const canTransition = await kitchenService.canTransitionStatus(order.kitchenStatus, updateData.status);
        if (!canTransition.allowed) {
            throw new errors_1.AppError(`Cannot transition from ${order.kitchenStatus} to ${updateData.status}: ${canTransition.reason}`, 400, true);
        }
        const updateResult = await kitchenService.updateOrderStatus(orderId, {
            ...updateData,
            updatedBy: currentUser.id,
            timestamp: new Date()
        });
        switch (updateData.status) {
            case 'preparing':
                await Promise.all([
                    kitchenService.startPreparationTimer(orderId),
                    inventoryService.reserveIngredients(orderId)
                ]);
                break;
            case 'quality_check':
                await qualityControlService.initiateCheck(orderId, updateData.qualityChecks);
                break;
            case 'ready':
                await Promise.all([
                    notification_service_1.NotificationService.notifyDeliveryTeam(orderId),
                    notification_service_1.NotificationService.notifyCustomer(orderId, 'ready_for_pickup')
                ]);
                break;
            case 'dispatched':
                await kitchenService.markDispatched(orderId, currentUser.id);
                break;
        }
        wsService.emitToKitchen(currentUser.schoolId, 'order.status.updated', {
            orderId,
            status: updateData.status,
            updatedBy: currentUser.id,
            timestamp: new Date()
        });
        wsService.emitToUser(order.customerId, 'order.kitchen.update', {
            orderId,
            status: updateData.status,
            estimatedTime: updateData.estimatedCompletionTime
        });
        auditService.log({
            action: 'kitchen.order.status.update',
            userId: currentUser.id,
            metadata: {
                orderId,
                previousStatus: order.kitchenStatus,
                newStatus: updateData.status,
                schoolId: currentUser.schoolId,
                requestId: req.requestId
            }
        });
        logger_1.logger.info('Order status updated successfully', {
            orderId,
            previousStatus: order.kitchenStatus,
            newStatus: updateData.status,
            updatedBy: currentUser.id,
            requestId: req.requestId
        });
        res.json({
            data: updateResult,
            message: 'Order status updated successfully',
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update order status', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            orderId: req.params.orderId,
            updateData: req.body,
            userId: req.user?.id
        });
        throw error;
    }
});
router.get('/inventory', readRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['kitchen_staff', 'chef', 'school_admin', 'admin']), api_middleware_1.paginationMiddleware, async (req, res) => {
    try {
        const currentUser = req.user;
        const { page, limit, offset } = req.pagination;
        const inventory = await inventoryService.getKitchenInventory(currentUser.schoolId, {
            pagination: { page, limit, offset },
            includeAlerts: true,
            includeCosts: ['admin', 'school_admin'].includes(currentUser.role)
        });
        res.json({
            data: inventory.items,
            pagination: {
                page,
                limit,
                total: inventory.total,
                totalPages: Math.ceil(inventory.total / limit),
                hasNext: page < Math.ceil(inventory.total / limit),
                hasPrev: page > 1
            },
            summary: {
                totalItems: inventory.total,
                lowStockItems: inventory.lowStock,
                nearExpiryItems: inventory.nearExpiry,
                totalValue: inventory.totalValue,
                alerts: inventory.alerts
            },
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get kitchen inventory', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            userId: req.user?.id,
            schoolId: req.user?.schoolId
        });
        throw error;
    }
});
router.post('/inventory/update', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['kitchen_staff', 'chef', 'inventory_manager']), (0, api_middleware_1.validateRequest)({ body: inventoryUpdateSchema }), async (req, res) => {
    try {
        const updateData = req.body;
        const currentUser = req.user;
        const updateResult = await inventoryService.updateInventory({
            ...updateData,
            schoolId: currentUser.schoolId,
            updatedBy: currentUser.id
        });
        if (updateResult.alertsGenerated?.length > 0) {
            await notification_service_1.NotificationService.sendInventoryAlerts(updateResult.alertsGenerated, currentUser.schoolId);
        }
        wsService.emitToKitchen(currentUser.schoolId, 'inventory.updated', {
            itemId: updateData.itemId,
            operation: updateData.operation,
            newLevel: updateResult.newQuantity,
            alerts: updateResult.alertsGenerated
        });
        auditService.log({
            action: 'kitchen.inventory.update',
            userId: currentUser.id,
            metadata: {
                itemId: updateData.itemId,
                operation: updateData.operation,
                quantity: updateData.quantity,
                reason: updateData.reason,
                requestId: req.requestId
            }
        });
        res.json({
            data: updateResult,
            message: 'Inventory updated successfully',
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update inventory', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            updateData: req.body,
            userId: req.user?.id
        });
        throw error;
    }
});
router.post('/production/plan', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['chef', 'kitchen_manager', 'school_admin']), (0, api_middleware_1.validateRequest)({ body: productionPlanSchema }), async (req, res) => {
    try {
        const planData = req.body;
        const currentUser = req.user;
        const resourceValidation = await productionService.validateResources({
            ...planData,
            schoolId: currentUser.schoolId
        });
        if (!resourceValidation.isValid) {
            throw new errors_1.AppError(`Resource validation failed: ${resourceValidation.errors.join(', ')}`, 400, true);
        }
        const productionPlan = await productionService.createPlan({
            ...planData,
            schoolId: currentUser.schoolId,
            createdBy: currentUser.id
        });
        if (planData.items.some((item) => item.assignedStaff?.length > 0)) {
            const assignedStaff = planData.items
                .flatMap((item) => item.assignedStaff || [])
                .filter((staff, index, arr) => arr.indexOf(staff) === index);
            await notification_service_1.NotificationService.notifyProductionAssignment(assignedStaff, productionPlan.id);
        }
        auditService.log({
            action: 'kitchen.production.plan.create',
            userId: currentUser.id,
            metadata: {
                planId: productionPlan.id,
                date: planData.date,
                mealType: planData.mealType,
                itemCount: planData.items.length,
                totalCapacity: planData.totalCapacity,
                requestId: req.requestId
            }
        });
        res.status(201).json({
            data: productionPlan,
            message: 'Production plan created successfully',
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create production plan', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            planData: req.body,
            userId: req.user?.id
        });
        throw error;
    }
});
router.post('/quality/check', operationsRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['kitchen_staff', 'chef', 'quality_inspector']), (0, api_middleware_1.validateRequest)({ body: qualityCheckSchema }), async (req, res) => {
    try {
        const checkData = req.body;
        const currentUser = req.user;
        const qualityCheck = await qualityControlService.submitCheck({
            ...checkData,
            checkedBy: currentUser.id,
            schoolId: currentUser.schoolId
        });
        if (checkData.result === 'fail') {
            await qualityControlService.handleFailedCheck(qualityCheck.id, {
                correctiveAction: checkData.corrective_action,
                notifyManager: true
            });
        }
        await qualityControlService.updateMetrics(currentUser.schoolId, {
            checkType: checkData.checkType,
            result: checkData.result
        });
        wsService.emitToKitchen(currentUser.schoolId, 'quality.check.submitted', {
            checkId: qualityCheck.id,
            itemId: checkData.itemId,
            result: checkData.result,
            checkedBy: currentUser.id
        });
        auditService.log({
            action: 'kitchen.quality.check.submit',
            userId: currentUser.id,
            metadata: {
                checkId: qualityCheck.id,
                itemId: checkData.itemId,
                checkType: checkData.checkType,
                result: checkData.result,
                orderId: checkData.orderId,
                requestId: req.requestId
            }
        });
        res.status(201).json({
            data: qualityCheck,
            message: 'Quality check submitted successfully',
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to submit quality check', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            checkData: req.body,
            userId: req.user?.id
        });
        throw error;
    }
});
exports.default = router;
//# sourceMappingURL=kitchen.routes.js.map