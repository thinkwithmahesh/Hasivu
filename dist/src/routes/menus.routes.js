"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const api_middleware_1 = require("../middleware/api.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const menu_service_1 = require("../services/menu.service");
const audit_service_1 = require("../services/audit.service");
const cache_service_1 = require("../services/cache.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const router = express_1.default.Router();
const menuService = menu_service_1.MenuService.getInstance();
const auditService = new audit_service_1.AuditService();
const cacheService = new cache_service_1.CacheService();
const readRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 150, windowMs: 60000 });
const writeRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 30, windowMs: 60000 });
const createMenuItemSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid('Invalid school ID'),
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name too long'),
    description: zod_1.z.string().max(500).optional(),
    price: zod_1.z.number().min(0, 'Price must be non-negative').max(10000, 'Price too high'),
    category: zod_1.z.string().min(1, 'Category is required').max(50),
    imageUrl: zod_1.z.string().url().optional(),
    nutritionalInfo: zod_1.z
        .object({
        calories: zod_1.z.number().min(0),
        protein: zod_1.z.number().min(0),
        carbs: zod_1.z.number().min(0),
        fat: zod_1.z.number().min(0),
        fiber: zod_1.z.number().min(0),
        sodium: zod_1.z.number().min(0),
    })
        .optional(),
    allergens: zod_1.z.array(zod_1.z.string()).optional(),
    dietaryRestrictions: zod_1.z.array(zod_1.z.string()).optional(),
    preparationTime: zod_1.z.number().min(0).max(120).optional(),
    available: zod_1.z.boolean().default(true),
    maxDailyQuantity: zod_1.z.number().min(0).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
const updateMenuItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    price: zod_1.z.number().min(0).max(10000).optional(),
    category: zod_1.z.string().min(1).max(50).optional(),
    imageUrl: zod_1.z.string().url().optional(),
    nutritionalInfo: zod_1.z
        .object({
        calories: zod_1.z.number().min(0),
        protein: zod_1.z.number().min(0),
        carbs: zod_1.z.number().min(0),
        fat: zod_1.z.number().min(0),
        fiber: zod_1.z.number().min(0),
        sodium: zod_1.z.number().min(0),
    })
        .optional(),
    allergens: zod_1.z.array(zod_1.z.string()).optional(),
    dietaryRestrictions: zod_1.z.array(zod_1.z.string()).optional(),
    preparationTime: zod_1.z.number().min(0).max(120).optional(),
    available: zod_1.z.boolean().optional(),
    maxDailyQuantity: zod_1.z.number().min(0).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
const menuItemQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/).optional(),
    limit: zod_1.z.string().regex(/^\d+$/).optional(),
    schoolId: zod_1.z.string().uuid().optional(),
    category: zod_1.z.string().optional(),
    available: zod_1.z
        .string()
        .regex(/^(true|false)$/)
        .optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['name', 'price', 'category', 'createdAt']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    minPrice: zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/)
        .optional(),
    maxPrice: zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/)
        .optional(),
    dietaryRestrictions: zod_1.z.string().optional(),
    allergens: zod_1.z.string().optional(),
});
const menuItemParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid menu item ID'),
});
const bulkUpdateSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        updates: updateMenuItemSchema,
    })),
});
const createMenuPlanSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    isActive: zod_1.z.boolean().default(true),
    mealTypes: zod_1.z.array(zod_1.z.enum(['breakfast', 'lunch', 'dinner', 'snack'])),
});
const addMenuSlotSchema = zod_1.z.object({
    menuItemId: zod_1.z.string().uuid(),
    date: zod_1.z.string().datetime(),
    mealType: zod_1.z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    quantity: zod_1.z.number().min(1),
    price: zod_1.z.number().min(0),
    isAvailable: zod_1.z.boolean().default(true),
});
router.get('/items', readRateLimit, auth_middleware_1.authMiddleware, api_middleware_1.paginationMiddleware, (0, api_middleware_1.validateRequest)({ query: menuItemQuerySchema }), async (req, res) => {
    try {
        const currentUser = req.user;
        const { schoolId, category, available, search, sortBy = 'name', sortOrder = 'asc', minPrice, maxPrice, dietaryRestrictions, allergens, } = req.query;
        const { page, limit, offset } = req.pagination;
        const cacheKey = `menu_items:list:${JSON.stringify({
            ...req.query,
            page,
            limit,
            userId: currentUser.id,
            userRole: currentUser.role,
        })}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            logger_1.logger.info('Menu items served from cache', { requestId: req.requestId });
            res.json(cached);
            return;
        }
        const filters = {};
        switch (currentUser.role) {
            case 'student':
            case 'parent':
                filters.schoolId = currentUser.schoolId;
                filters.available = true;
                break;
            case 'teacher':
            case 'school_admin':
            case 'kitchen_staff':
                filters.schoolId = currentUser.schoolId;
                break;
        }
        if (schoolId && ['admin'].includes(currentUser.role)) {
            filters.schoolId = schoolId;
        }
        if (category)
            filters.category = category;
        if (available !== undefined) {
            filters.available = available === 'true';
        }
        if (search)
            filters.search = search;
        if (minPrice || maxPrice) {
            filters.price = {};
            if (minPrice)
                filters.price.$gte = parseFloat(minPrice);
            if (maxPrice)
                filters.price.$lte = parseFloat(maxPrice);
        }
        if (dietaryRestrictions) {
            filters.dietaryRestrictions = dietaryRestrictions.split(',');
        }
        if (allergens) {
            filters.allergens = allergens.split(',');
        }
        const result = await menuService.getMenuItems(filters);
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to fetch menu items', 500);
        }
        const items = result.data || [];
        items.sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'price':
                    aVal = a.price;
                    bVal = b.price;
                    break;
                case 'category':
                    aVal = a.category;
                    bVal = b.category;
                    break;
                case 'createdAt':
                    aVal = new Date(a.createdAt);
                    bVal = new Date(b.createdAt);
                    break;
                default:
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
            }
            if (sortOrder === 'desc') {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        });
        const totalItems = items.length;
        const paginatedItems = items.slice(offset, offset + limit);
        const response = {
            data: paginatedItems,
            pagination: {
                page,
                limit,
                total: totalItems,
                totalPages: Math.ceil(totalItems / limit),
                hasNext: page < Math.ceil(totalItems / limit),
                hasPrev: page > 1,
            },
            requestId: req.requestId,
        };
        await cacheService.set(cacheKey, response, { ttl: 300 });
        res.json(response);
    }
    catch (error) {
        logger_1.logger.error('Failed to list menu items', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            userId: req.user?.id,
            query: req.query,
        });
        throw error;
    }
});
router.get('/items/:id', readRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({ params: menuItemParamsSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        const result = await menuService.getMenuItem(id);
        if (!result.success) {
            if (result.error?.code === 'ITEM_NOT_FOUND') {
                throw new errors_1.AppError('Menu item not found', 404);
            }
            throw new errors_1.AppError(result.error?.message || 'Failed to fetch menu item', 500);
        }
        const item = result.data;
        if (!['admin'].includes(currentUser.role) && item.schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('You do not have permission to view this menu item', 403);
        }
        await auditService.log(currentUser.id, 'menus.view_item', {
            itemId: id,
            itemName: item.name,
            requestId: req.requestId,
        });
        res.json({
            data: item,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get menu item', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            itemId: req.params.id,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.post('/items', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['school_admin', 'admin']), (0, api_middleware_1.validateRequest)({ body: createMenuItemSchema }), async (req, res) => {
    try {
        const itemData = req.body;
        const currentUser = req.user;
        if (currentUser.role === 'school_admin' && itemData.schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('You can only create menu items for your school', 403);
        }
        const result = await menuService.createMenuItem(itemData);
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to create menu item', 500);
        }
        await cacheService.invalidatePattern('menu_items:*');
        await auditService.log(currentUser.id, 'menus.create_item', {
            itemId: result.data.id,
            itemName: itemData.name,
            schoolId: itemData.schoolId,
            requestId: req.requestId,
        });
        logger_1.logger.info('Menu item created successfully', {
            itemId: result.data.id,
            itemName: itemData.name,
            schoolId: itemData.schoolId,
            createdBy: currentUser.id,
            requestId: req.requestId,
        });
        res.status(201).json({
            data: result.data,
            message: 'Menu item created successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create menu item', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            itemData: { ...req.body, description: undefined },
            userId: req.user?.id,
        });
        throw error;
    }
});
router.put('/items/:id', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['school_admin', 'admin']), (0, api_middleware_1.validateRequest)({
    params: menuItemParamsSchema,
    body: updateMenuItemSchema,
}), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const currentUser = req.user;
        const existingResult = await menuService.getMenuItem(id);
        if (!existingResult.success) {
            throw new errors_1.AppError('Menu item not found', 404);
        }
        const existingItem = existingResult.data;
        if (currentUser.role === 'school_admin' && existingItem.schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('You can only update menu items from your school', 403);
        }
        const result = await menuService.updateMenuItem({ id, ...updateData });
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to update menu item', 500);
        }
        await cacheService.invalidatePattern('menu_items:*');
        await cacheService.invalidatePattern(`menu_item:${id}:*`);
        await auditService.log(currentUser.id, 'menus.update_item', {
            itemId: id,
            changes: Object.keys(updateData),
            previousName: existingItem.name,
            newName: updateData.name || existingItem.name,
            requestId: req.requestId,
        });
        logger_1.logger.info('Menu item updated successfully', {
            itemId: id,
            changes: Object.keys(updateData),
            updatedBy: currentUser.id,
            requestId: req.requestId,
        });
        res.json({
            data: result.data,
            message: 'Menu item updated successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update menu item', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            itemId: req.params.id,
            updateData: req.body,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.delete('/items/:id', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['school_admin', 'admin']), (0, api_middleware_1.validateRequest)({ params: menuItemParamsSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        const existingResult = await menuService.getMenuItem(id);
        if (!existingResult.success) {
            throw new errors_1.AppError('Menu item not found', 404);
        }
        const existingItem = existingResult.data;
        if (currentUser.role === 'school_admin' && existingItem.schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('You can only delete menu items from your school', 403);
        }
        const result = await menuService.deleteMenuItem(id);
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to delete menu item', 500);
        }
        await cacheService.invalidatePattern('menu_items:*');
        await cacheService.invalidatePattern(`menu_item:${id}:*`);
        await auditService.log(currentUser.id, 'menus.delete_item', {
            itemId: id,
            itemName: existingItem.name,
            schoolId: existingItem.schoolId,
            requestId: req.requestId,
        });
        logger_1.logger.info('Menu item deleted successfully', {
            itemId: id,
            itemName: existingItem.name,
            deletedBy: currentUser.id,
            requestId: req.requestId,
        });
        res.json({
            message: 'Menu item deleted successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete menu item', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            itemId: req.params.id,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.post('/items/bulk-update', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['school_admin', 'admin']), (0, api_middleware_1.validateRequest)({ body: bulkUpdateSchema }), async (req, res) => {
    try {
        const { items } = req.body;
        const currentUser = req.user;
        for (const item of items) {
            const existingResult = await menuService.getMenuItem(item.id);
            if (!existingResult.success) {
                throw new errors_1.AppError(`Menu item ${item.id} not found`, 404);
            }
            const existingItem = existingResult.data;
            if (currentUser.role === 'school_admin' && existingItem.schoolId !== currentUser.schoolId) {
                throw new errors_1.AppError(`You can only update menu items from your school (item: ${item.id})`, 403);
            }
        }
        const result = await menuService.bulkUpdateMenuItems({ items });
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to bulk update menu items', 500);
        }
        await cacheService.invalidatePattern('menu_items:*');
        await auditService.log(currentUser.id, 'menus.bulk_update_items', {
            itemCount: items.length,
            requestId: req.requestId,
        });
        logger_1.logger.info('Menu items bulk updated successfully', {
            itemCount: items.length,
            updatedBy: currentUser.id,
            requestId: req.requestId,
        });
        res.json({
            data: result.data,
            message: 'Menu items updated successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to bulk update menu items', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            itemCount: req.body.items?.length,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.get('/categories', readRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({
    query: zod_1.z.object({
        schoolId: zod_1.z.string().uuid().optional(),
    }),
}), async (req, res) => {
    try {
        const { schoolId } = req.query;
        const currentUser = req.user;
        let targetSchoolId = schoolId;
        if (!targetSchoolId) {
            targetSchoolId = currentUser.schoolId;
        }
        else if (!['admin'].includes(currentUser.role)) {
            targetSchoolId = currentUser.schoolId;
        }
        const result = await menuService.getMenuItems({ schoolId: targetSchoolId });
        if (!result.success) {
            throw new errors_1.AppError('Failed to fetch menu items', 500);
        }
        const categories = [...new Set((result.data || []).map((item) => item.category))].sort();
        res.json({
            data: categories,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get menu categories', error instanceof Error ? error : undefined, {
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
    }),
}), async (req, res) => {
    try {
        const { schoolId, startDate, endDate } = req.query;
        const currentUser = req.user;
        let targetSchoolId = schoolId;
        if (!targetSchoolId) {
            targetSchoolId = currentUser.schoolId;
        }
        else if (currentUser.role === 'school_admin' && targetSchoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('You can only view analytics for your school', 403);
        }
        const result = await menuService.getMenuAnalytics(targetSchoolId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to get menu analytics', 500);
        }
        res.json({
            data: result.data,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get menu analytics', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.post('/plans', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['school_admin', 'admin']), (0, api_middleware_1.validateRequest)({ body: createMenuPlanSchema }), async (req, res) => {
    try {
        const planData = req.body;
        const currentUser = req.user;
        if (currentUser.role === 'school_admin' && planData.schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('You can only create menu plans for your school', 403);
        }
        const result = await menuService.createMenuPlan(planData);
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to create menu plan', 500);
        }
        await auditService.log(currentUser.id, 'menus.create_plan', {
            planId: result.data.id,
            planName: planData.name,
            schoolId: planData.schoolId,
            requestId: req.requestId,
        });
        logger_1.logger.info('Menu plan created successfully', {
            planId: result.data.id,
            planName: planData.name,
            schoolId: planData.schoolId,
            createdBy: currentUser.id,
            requestId: req.requestId,
        });
        res.status(201).json({
            data: result.data,
            message: 'Menu plan created successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create menu plan', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            planData: req.body,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.post('/plans/:planId/slots', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['school_admin', 'admin']), (0, api_middleware_1.validateRequest)({
    params: zod_1.z.object({ planId: zod_1.z.string().uuid() }),
    body: addMenuSlotSchema,
}), async (req, res) => {
    try {
        const { planId } = req.params;
        const slotData = { ...req.body, menuPlanId: planId };
        const currentUser = req.user;
        const result = await menuService.addMenuSlot(slotData);
        if (!result.success) {
            throw new errors_1.AppError(result.error?.message || 'Failed to add menu slot', 500);
        }
        await auditService.log(currentUser.id, 'menus.add_slot', {
            planId,
            slotId: result.data.id,
            menuItemId: slotData.menuItemId,
            date: slotData.date,
            mealType: slotData.mealType,
            requestId: req.requestId,
        });
        logger_1.logger.info('Menu slot added successfully', {
            planId,
            slotId: result.data.id,
            menuItemId: slotData.menuItemId,
            addedBy: currentUser.id,
            requestId: req.requestId,
        });
        res.status(201).json({
            data: result.data,
            message: 'Menu slot added successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to add menu slot', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            planId: req.params.planId,
            slotData: req.body,
            userId: req.user?.id,
        });
        throw error;
    }
});
exports.default = router;
//# sourceMappingURL=menus.routes.js.map