"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const api_middleware_1 = require("../middleware/api.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const menuItem_service_1 = require("../services/menuItem.service");
const dailyMenu_service_1 = require("../services/dailyMenu.service");
const menuPlan_service_1 = require("../services/menuPlan.service");
const nutritional_compliance_service_1 = require("../services/nutritional-compliance.service");
const cache_service_1 = require("../services/cache.service");
const audit_service_1 = require("../services/audit.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const router = express_1.default.Router();
const menuItemService = new menuItem_service_1.MenuItemService();
const dailyMenuService = new dailyMenu_service_1.DailyMenuService();
const menuPlanService = new menuPlan_service_1.MenuPlanService();
const nutritionalService = new nutritional_compliance_service_1.NutritionalComplianceService();
const cacheService = new cache_service_1.CacheService();
const auditService = new audit_service_1.AuditService();
const readRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 150, windowMs: 60000 });
const writeRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 30, windowMs: 60000 });
const publicRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 100, windowMs: 60000 });
const createMenuItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(200, 'Name too long'),
    description: zod_1.z.string().max(1000).optional(),
    category: zod_1.z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']),
    price: zod_1.z.number().min(0.01, 'Price must be greater than 0'),
    currency: zod_1.z.string().default('INR'),
    available: zod_1.z.boolean().default(true),
    featured: zod_1.z.boolean().default(false),
    imageUrl: zod_1.z.string().url().optional(),
    nutritionalInfo: zod_1.z.any().optional(),
    allergens: zod_1.z.array(zod_1.z.string()).optional(),
    ingredients: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    preparationTime: zod_1.z.number().min(0).optional(),
    portionSize: zod_1.z.string().optional(),
    calories: zod_1.z.number().min(0).optional(),
    schoolId: zod_1.z.string().uuid().optional()
});
const updateMenuItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(1000).optional(),
    category: zod_1.z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']).optional(),
    price: zod_1.z.number().min(0.01).optional(),
    currency: zod_1.z.string().optional(),
    available: zod_1.z.boolean().optional(),
    featured: zod_1.z.boolean().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    nutritionalInfo: zod_1.z.any().optional(),
    allergens: zod_1.z.array(zod_1.z.string()).optional(),
    ingredients: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    preparationTime: zod_1.z.number().min(0).optional(),
    portionSize: zod_1.z.string().optional(),
    calories: zod_1.z.number().min(0).optional()
});
const menuItemQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/).optional(),
    limit: zod_1.z.string().regex(/^\d+$/).optional(),
    category: zod_1.z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']).optional(),
    available: zod_1.z.string().regex(/^(true|false)$/).optional(),
    featured: zod_1.z.string().regex(/^(true|false)$/).optional(),
    schoolId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['name', 'price', 'sortOrder', 'createdAt']).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    priceMin: zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    priceMax: zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/).optional()
});
const menuItemIdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid menu item ID')
});
const createDailyMenuSchema = zod_1.z.object({
    date: zod_1.z.string().datetime('Invalid date format'),
    schoolId: zod_1.z.string().uuid('Invalid school ID'),
    category: zod_1.z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']),
    dayType: zod_1.z.enum(['WEEKDAY', 'WEEKEND', 'HOLIDAY', 'SPECIAL_EVENT']),
    menuItemIds: zod_1.z.array(zod_1.z.string().uuid()).min(1, 'At least one menu item required'),
    availableQuantity: zod_1.z.number().min(0).optional(),
    notes: zod_1.z.string().max(500).optional()
});
const createMenuPlanSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(200),
    description: zod_1.z.string().max(1000).optional(),
    schoolId: zod_1.z.string().uuid('Invalid school ID'),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    recurringPattern: zod_1.z.any().optional(),
    approvalWorkflow: zod_1.z.any().optional(),
    metadata: zod_1.z.any().optional()
});
(router.get('/items', readRateLimit, auth_middleware_1.authMiddleware, api_middleware_1.paginationMiddleware, (0, api_middleware_1.validateRequest)({ query: menuItemQuerySchema }), (async (req, res) => {
    try {
        const currentUser = req.user;
        const { category, available, featured, schoolId, search, sortBy = 'sortOrder', sortOrder = 'asc', priceMin, priceMax } = req.query;
        const { page, limit, offset } = req.pagination;
        const filters = {};
        switch (currentUser.role) {
            case 'school_admin':
                filters.schoolId = currentUser.schoolId;
                break;
            case 'admin':
                if (schoolId)
                    filters.schoolId = schoolId;
                break;
            default:
                filters.available = true;
                break;
        }
        if (category)
            filters.category = category;
        if (available !== undefined)
            filters.available = available === 'true';
        if (featured !== undefined)
            filters.featured = featured === 'true';
        if (priceMin)
            filters.priceMin = parseFloat(priceMin);
        if (priceMax)
            filters.priceMax = parseFloat(priceMax);
        const result = await menuItem_service_1.MenuItemService.getMenuItems(filters, {
            page,
            limit,
            sortBy,
            sortOrder
        });
        if (['admin', 'school_admin'].includes(currentUser.role)) {
            auditService.log({
                action: 'menus.items.list',
                userId: currentUser.id,
                metadata: {
                    filters,
                    resultCount: result.items.length,
                    requestId: req.requestId
                }
            });
        }
        res.json({
            data: result.items,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasNext: result.page < result.totalPages,
                hasPrev: result.page > 1
            },
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get menu items', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            userId: req.user?.id
        });
        throw error;
    }
})));
(router.get('/items/:id', readRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({ params: menuItemIdSchema }), (async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        const menuItem = await menuItem_service_1.MenuItemService.getMenuItemById(id);
        if (!menuItem) {
            throw new errors_1.AppError('Menu item not found', 404, true);
        }
        if (currentUser.role === 'school_admin' && menuItem.schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('Access denied: Item belongs to different school', 403, true);
        }
        auditService.log({
            action: 'menus.items.view',
            userId: currentUser.id,
            metadata: {
                menuItemId: id,
                menuItemName: menuItem.name,
                requestId: req.requestId
            }
        });
        res.json({
            data: menuItem,
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get menu item', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            menuItemId: req.params.id,
            userId: req.user?.id
        });
        throw error;
    }
})));
(router.post('/items', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['admin', 'school_admin']), (0, api_middleware_1.validateRequest)({ body: createMenuItemSchema }), (async (req, res) => {
    try {
        const menuItemData = req.body;
        const currentUser = req.user;
        if (currentUser.role === 'school_admin') {
            menuItemData.schoolId = currentUser.schoolId;
        }
        const menuItem = await menuItem_service_1.MenuItemService.createMenuItem(menuItemData);
        if (!menuItem) {
            throw new errors_1.AppError('Failed to create menu item', 500, true);
        }
        auditService.log({
            action: 'menus.items.create',
            userId: currentUser.id,
            metadata: {
                menuItemId: menuItem.id,
                menuItemName: menuItem.name,
                category: menuItem.category,
                schoolId: menuItem.schoolId,
                requestId: req.requestId
            }
        });
        logger_1.logger.info('Menu item created successfully', {
            menuItemId: menuItem.id,
            name: menuItem.name,
            createdBy: currentUser.id,
            requestId: req.requestId
        });
        res.status(201).json({
            data: menuItem,
            message: 'Menu item created successfully',
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create menu item', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            menuItemData: req.body,
            userId: req.user?.id
        });
        throw error;
    }
})));
(router.put('/items/:id', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['admin', 'school_admin']), (0, api_middleware_1.validateRequest)({
    params: menuItemIdSchema,
    body: updateMenuItemSchema
}), (async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const currentUser = req.user;
        const existingItem = await menuItem_service_1.MenuItemService.getMenuItemById(id);
        if (!existingItem) {
            throw new errors_1.AppError('Menu item not found', 404, true);
        }
        if (currentUser.role === 'school_admin' && existingItem.schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('Access denied: Cannot modify items from other schools', 403, true);
        }
        const updatedItem = await menuItem_service_1.MenuItemService.updateMenuItem(id, updateData);
        auditService.log({
            action: 'menus.items.update',
            userId: currentUser.id,
            metadata: {
                menuItemId: id,
                changes: Object.keys(updateData),
                previousName: existingItem.name,
                newName: updatedItem.name,
                requestId: req.requestId
            }
        });
        logger_1.logger.info('Menu item updated successfully', {
            menuItemId: id,
            changes: Object.keys(updateData),
            updatedBy: currentUser.id,
            requestId: req.requestId
        });
        res.json({
            data: updatedItem,
            message: 'Menu item updated successfully',
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update menu item', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            menuItemId: req.params.id,
            updateData: req.body,
            userId: req.user?.id
        });
        throw error;
    }
})));
(router.delete('/items/:id', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['admin', 'school_admin']), (0, api_middleware_1.validateRequest)({ params: menuItemIdSchema }), (async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        const existingItem = await menuItem_service_1.MenuItemService.getMenuItemById(id);
        if (!existingItem) {
            throw new errors_1.AppError('Menu item not found', 404, true);
        }
        if (currentUser.role === 'school_admin' && existingItem.schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('Access denied: Cannot delete items from other schools', 403, true);
        }
        const deletedItem = await menuItem_service_1.MenuItemService.deleteMenuItem(id);
        auditService.log({
            action: 'menus.items.delete',
            userId: currentUser.id,
            metadata: {
                menuItemId: id,
                menuItemName: existingItem.name,
                schoolId: existingItem.schoolId,
                requestId: req.requestId
            }
        });
        logger_1.logger.info('Menu item deleted successfully', {
            menuItemId: id,
            deletedBy: currentUser.id,
            requestId: req.requestId
        });
        res.json({
            data: deletedItem,
            message: 'Menu item deleted successfully',
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete menu item', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            menuItemId: req.params.id,
            userId: req.user?.id
        });
        throw error;
    }
})));
(router.get('/daily/:schoolId/:date', readRateLimit, auth_middleware_1.authMiddleware, (async (req, res) => {
    try {
        const { schoolId, date: dateStr } = req.params;
        const currentUser = req.user;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            throw new errors_1.AppError('Invalid date format', 400, true);
        }
        if (currentUser.role === 'school_admin' && schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('Access denied: Cannot view menus from other schools', 403, true);
        }
        const dailyMenus = await dailyMenu_service_1.DailyMenuService.getDailyMenuByDate(schoolId, date);
        if (['admin', 'school_admin'].includes(currentUser.role)) {
            auditService.log({
                action: 'menus.daily.view',
                userId: currentUser.id,
                metadata: {
                    schoolId,
                    date: dateStr,
                    menuCount: dailyMenus.length,
                    requestId: req.requestId
                }
            });
        }
        res.json({
            data: dailyMenus,
            date: dateStr,
            schoolId,
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get daily menu', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            schoolId: req.params.schoolId,
            date: req.params.date,
            userId: req.user?.id
        });
        throw error;
    }
})));
(router.post('/daily', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['admin', 'school_admin']), (0, api_middleware_1.validateRequest)({ body: createDailyMenuSchema }), (async (req, res) => {
    try {
        const dailyMenuData = req.body;
        const currentUser = req.user;
        if (currentUser.role === 'school_admin') {
            dailyMenuData.schoolId = currentUser.schoolId;
        }
        const dailyMenu = await dailyMenu_service_1.DailyMenuService.createDailyMenu({
            ...dailyMenuData,
            date: new Date(dailyMenuData.date)
        });
        auditService.log({
            action: 'menus.daily.create',
            userId: currentUser.id,
            metadata: {
                dailyMenuId: dailyMenu.id,
                schoolId: dailyMenuData.schoolId,
                date: dailyMenuData.date,
                category: dailyMenuData.category,
                itemCount: dailyMenuData.menuItemIds.length,
                requestId: req.requestId
            }
        });
        logger_1.logger.info('Daily menu created successfully', {
            dailyMenuId: dailyMenu.id,
            schoolId: dailyMenuData.schoolId,
            date: dailyMenuData.date,
            createdBy: currentUser.id,
            requestId: req.requestId
        });
        res.status(201).json({
            data: dailyMenu,
            message: 'Daily menu created successfully',
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create daily menu', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            dailyMenuData: req.body,
            userId: req.user?.id
        });
        throw error;
    }
})));
(router.post('/plans', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['admin', 'school_admin']), (0, api_middleware_1.validateRequest)({ body: createMenuPlanSchema }), (async (req, res) => {
    try {
        const planData = req.body;
        const currentUser = req.user;
        if (currentUser.role === 'school_admin') {
            planData.schoolId = currentUser.schoolId;
        }
        const menuPlan = await menuPlanService.createMenuPlan({
            ...planData,
            startDate: new Date(planData.startDate),
            endDate: new Date(planData.endDate)
        });
        auditService.log({
            action: 'menus.plans.create',
            userId: currentUser.id,
            metadata: {
                menuPlanId: menuPlan.id,
                planName: menuPlan.name,
                schoolId: planData.schoolId,
                startDate: planData.startDate,
                endDate: planData.endDate,
                requestId: req.requestId
            }
        });
        logger_1.logger.info('Menu plan created successfully', {
            menuPlanId: menuPlan.id,
            name: menuPlan.name,
            schoolId: planData.schoolId,
            createdBy: currentUser.id,
            requestId: req.requestId
        });
        res.status(201).json({
            data: menuPlan,
            message: 'Menu plan created successfully',
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create menu plan', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            planData: req.body,
            userId: req.user?.id
        });
        throw error;
    }
})));
(router.get('/nutrition/analysis/:itemId', readRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({ params: menuItemIdSchema }), (async (req, res) => {
    try {
        const { itemId } = req.params;
        const currentUser = req.user;
        const menuItem = await menuItem_service_1.MenuItemService.getMenuItemById(itemId);
        if (!menuItem) {
            throw new errors_1.AppError('Menu item not found', 404, true);
        }
        if (currentUser.role === 'school_admin' && menuItem.schoolId !== currentUser.schoolId) {
            throw new errors_1.AppError('Access denied: Cannot analyze items from other schools', 403, true);
        }
        const analysis = await nutritionalService.analyzeNutritionalContent(menuItem);
        auditService.log({
            action: 'menus.nutrition.analyze',
            userId: currentUser.id,
            metadata: {
                menuItemId: itemId,
                menuItemName: menuItem.name,
                analysisType: 'nutritional_content',
                requestId: req.requestId
            }
        });
        res.json({
            data: analysis,
            menuItem: {
                id: menuItem.id,
                name: menuItem.name,
                category: menuItem.category
            },
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to analyze nutritional content', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            menuItemId: req.params.itemId,
            userId: req.user?.id
        });
        throw error;
    }
})));
(router.get('/search', readRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({
    query: zod_1.z.object({
        q: zod_1.z.string().min(1, 'Search query is required'),
        schoolId: zod_1.z.string().uuid().optional(),
        category: zod_1.z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional()
    })
}), (async (req, res) => {
    try {
        const { q: searchTerm, schoolId, category, limit = '20' } = req.query;
        const currentUser = req.user;
        const filters = {};
        if (currentUser.role === 'school_admin') {
            filters.schoolId = currentUser.schoolId;
        }
        else if (schoolId) {
            filters.schoolId = schoolId;
        }
        if (category)
            filters.category = category;
        filters.available = true;
        const result = await menuItem_service_1.MenuItemService.searchMenuItems(searchTerm, filters, { limit: parseInt(limit) });
        res.json({
            data: result.items,
            total: result.total,
            searchTerm,
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to search menu items', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            searchTerm: req.query.q,
            userId: req.user?.id
        });
        throw error;
    }
})));
(router.get('/featured', publicRateLimit, (0, api_middleware_1.validateRequest)({
    query: zod_1.z.object({
        schoolId: zod_1.z.string().uuid().optional(),
        category: zod_1.z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional()
    })
}), (async (req, res) => {
    try {
        const { schoolId, category, limit = '10' } = req.query;
        const featuredItems = await menuItem_service_1.MenuItemService.getFeaturedItems({
            schoolId,
            category: category,
            limit: parseInt(limit)
        });
        res.json({
            data: featuredItems,
            count: featuredItems.length,
            requestId: req.requestId
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get featured menu items', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            requestId: req.requestId,
            query: req.query
        });
        throw error;
    }
})));
exports.default = router;
//# sourceMappingURL=menus.routes.js.map