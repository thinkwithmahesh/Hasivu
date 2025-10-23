"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._menuService = exports.menuService = exports.MenuService = void 0;
const database_service_1 = require("./database.service");
const redis_service_1 = require("./redis.service");
const cache_1 = require("../utils/cache");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
class MenuService {
    static instance;
    prisma;
    constructor() {
        this.prisma = database_service_1.DatabaseService.getInstance().client;
        logger_1.logger.info('MenuService initialized');
    }
    static getInstance() {
        if (!MenuService.instance) {
            MenuService.instance = new MenuService();
        }
        return MenuService.instance;
    }
    async createMenuItem(data) {
        try {
            if (!data.name || !data.price || !data.category || !data.schoolId) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Missing required fields: name, price, category, schoolId',
                    },
                };
            }
            if (data.nutritionalInfo) {
                const { calories, protein, carbs, fat } = data.nutritionalInfo;
                if (calories < 0 || protein < 0 || carbs < 0 || fat < 0) {
                    return {
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Nutritional values cannot be negative',
                        },
                    };
                }
            }
            const existingItem = await this.prisma.menuItem.findFirst({
                where: {
                    name: data.name,
                    schoolId: data.schoolId,
                },
            });
            if (existingItem) {
                return {
                    success: false,
                    error: {
                        code: 'DUPLICATE_ITEM',
                        message: 'Menu item with this name already exists in the school',
                    },
                };
            }
            const menuItem = await this.prisma.menuItem.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    schoolId: data.schoolId,
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    category: data.category,
                    imageUrl: data.imageUrl,
                    nutritionalInfo: data.nutritionalInfo ? JSON.stringify(data.nutritionalInfo) : null,
                    allergens: data.allergens ? JSON.stringify(data.allergens) : undefined,
                    preparationTime: data.preparationTime,
                    available: data.available,
                    tags: data.tags ? JSON.stringify(data.tags) : undefined,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            await this.clearMenuCache(data.schoolId);
            logger_1.logger.info('Menu item created', { id: menuItem.id, name: menuItem.name });
            return { success: true, data: menuItem };
        }
        catch (error) {
            logger_1.logger.error('Failed to create menu item', error, { data });
            return {
                success: false,
                error: {
                    code: 'CREATION_FAILED',
                    message: 'Failed to create menu item',
                },
            };
        }
    }
    async updateMenuItem(data) {
        try {
            const existingItem = await this.prisma.menuItem.findUnique({
                where: { id: data.id },
            });
            if (!existingItem) {
                return {
                    success: false,
                    error: {
                        code: 'ITEM_NOT_FOUND',
                        message: 'Menu item not found',
                    },
                };
            }
            if (data.nutritionalInfo) {
                const { calories, protein, carbs, fat } = data.nutritionalInfo;
                if (calories < 0 || protein < 0 || carbs < 0 || fat < 0) {
                    return {
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Nutritional values cannot be negative',
                        },
                    };
                }
            }
            if (data.name && data.name !== existingItem.name) {
                const duplicateItem = await this.prisma.menuItem.findFirst({
                    where: {
                        name: data.name,
                        schoolId: existingItem.schoolId,
                        id: { not: data.id },
                    },
                });
                if (duplicateItem) {
                    return {
                        success: false,
                        error: {
                            code: 'DUPLICATE_ITEM',
                            message: 'Menu item with this name already exists in the school',
                        },
                    };
                }
            }
            const updateData = {
                updatedAt: new Date(),
            };
            if (data.name !== undefined)
                updateData.name = data.name;
            if (data.description !== undefined)
                updateData.description = data.description;
            if (data.price !== undefined)
                updateData.price = data.price;
            if (data.category !== undefined)
                updateData.category = data.category;
            if (data.imageUrl !== undefined)
                updateData.imageUrl = data.imageUrl;
            if (data.nutritionalInfo !== undefined) {
                updateData.nutritionalInfo = data.nutritionalInfo
                    ? JSON.stringify(data.nutritionalInfo)
                    : null;
            }
            if (data.allergens !== undefined) {
                updateData.allergens = data.allergens ? JSON.stringify(data.allergens) : null;
            }
            if (data.dietaryRestrictions !== undefined) {
                updateData.dietaryRestrictions = data.dietaryRestrictions
                    ? JSON.stringify(data.dietaryRestrictions)
                    : null;
            }
            if (data.preparationTime !== undefined)
                updateData.preparationTime = data.preparationTime;
            if (data.available !== undefined)
                updateData.available = data.available;
            if (data.maxDailyQuantity !== undefined)
                updateData.maxDailyQuantity = data.maxDailyQuantity;
            if (data.tags !== undefined) {
                updateData.tags = data.tags ? JSON.stringify(data.tags) : null;
            }
            const updatedItem = await this.prisma.menuItem.update({
                where: { id: data.id },
                data: updateData,
            });
            await this.clearMenuCache(existingItem.schoolId);
            logger_1.logger.info('Menu item updated', { id: data.id, name: updatedItem.name });
            return { success: true, data: updatedItem };
        }
        catch (error) {
            logger_1.logger.error('Failed to update menu item', error, { data });
            return {
                success: false,
                error: {
                    code: 'UPDATE_FAILED',
                    message: 'Failed to update menu item',
                },
            };
        }
    }
    async deleteMenuItem(id) {
        try {
            const existingItem = await this.prisma.menuItem.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { orderItems: true },
                    },
                },
            });
            if (!existingItem) {
                return {
                    success: false,
                    error: {
                        code: 'ITEM_NOT_FOUND',
                        message: 'Menu item not found',
                    },
                };
            }
            if (existingItem._count.orderItems > 0) {
                return {
                    success: false,
                    error: {
                        code: 'ITEM_IN_USE',
                        message: 'Cannot delete menu item that is used in existing orders',
                        details: { orderCount: existingItem._count.orderItems },
                    },
                };
            }
            await this.prisma.menuItem.delete({
                where: { id },
            });
            await this.clearMenuCache(existingItem.schoolId);
            logger_1.logger.info('Menu item deleted', { id, name: existingItem.name });
            return { success: true, data: true };
        }
        catch (error) {
            logger_1.logger.error('Failed to delete menu item', error, { id });
            return {
                success: false,
                error: {
                    code: 'DELETE_FAILED',
                    message: 'Failed to delete menu item',
                },
            };
        }
    }
    async getMenuItem(id) {
        try {
            const cacheKey = `menu_item:${id}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return { success: true, data: JSON.parse(cached) };
            }
            const item = await this.prisma.menuItem.findUnique({
                where: { id },
            });
            if (!item) {
                return {
                    success: false,
                    error: {
                        code: 'ITEM_NOT_FOUND',
                        message: 'Menu item not found',
                    },
                };
            }
            await cache_1.cache.setex(cacheKey, 600, JSON.stringify(item));
            return { success: true, data: item };
        }
        catch (error) {
            logger_1.logger.error('Failed to get menu item', error, { id });
            return {
                success: false,
                error: {
                    code: 'FETCH_FAILED',
                    message: 'Failed to fetch menu item',
                },
            };
        }
    }
    async getMenuItems(filters = {}) {
        try {
            const cacheKey = `menu_items:${JSON.stringify(filters)}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return { success: true, data: JSON.parse(cached) };
            }
            const where = {};
            if (filters.schoolId) {
                where.schoolId = filters.schoolId;
            }
            if (filters.category) {
                where.category = filters.category;
            }
            if (filters.available !== undefined) {
                where.available = filters.available;
            }
            if (filters.dietaryRestrictions?.length) {
                where.dietaryRestrictions = {
                    contains: JSON.stringify(filters.dietaryRestrictions),
                };
            }
            if (filters.allergens?.length) {
                where.allergens = {
                    not: {
                        contains: JSON.stringify(filters.allergens),
                    },
                };
            }
            if (filters.nutritionalInfo) {
                const { minCalories, maxCalories, minProtein, maxProtein } = filters.nutritionalInfo;
                if (minCalories || maxCalories || minProtein || maxProtein) {
                    where.nutritionalInfo = {};
                    if (minCalories || maxCalories) {
                        where.nutritionalInfo.contains = '"calories":';
                    }
                }
            }
            const items = await this.prisma.menuItem.findMany({
                where,
                orderBy: { name: 'asc' },
            });
            await cache_1.cache.setex(cacheKey, 300, JSON.stringify(items));
            return { success: true, data: items };
        }
        catch (error) {
            logger_1.logger.error('Failed to get menu items', error, { filters });
            return {
                success: false,
                error: {
                    code: 'FETCH_FAILED',
                    message: 'Failed to fetch menu items',
                },
            };
        }
    }
    async getMenuByCategory(schoolId, category) {
        return this.getMenuItems({ schoolId, category, available: true });
    }
    async bulkUpdateMenuItems(updates) {
        try {
            let successful = 0;
            let failed = 0;
            const errors = [];
            for (const update of updates.items) {
                try {
                    const result = await this.updateMenuItem(update);
                    if (result.success) {
                        successful++;
                    }
                    else {
                        failed++;
                        errors.push({
                            id: update.id,
                            error: result.error,
                        });
                    }
                }
                catch (error) {
                    failed++;
                    errors.push({
                        id: update.id,
                        error: { message: 'Unexpected error during update' },
                    });
                }
            }
            return {
                success: true,
                data: { successful, failed, errors },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to bulk update menu items', error, { updates });
            return {
                success: false,
                error: {
                    code: 'BULK_UPDATE_FAILED',
                    message: 'Failed to bulk update menu items',
                },
            };
        }
    }
    async createMenuPlan(data) {
        try {
            if (!data.name || !data.schoolId || !data.startDate || !data.endDate) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Missing required fields: name, schoolId, startDate, endDate',
                    },
                };
            }
            if (data.startDate >= data.endDate) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'End date must be after start date',
                    },
                };
            }
            const menuPlan = await this.prisma.menuPlan.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    schoolId: data.schoolId,
                    name: data.name,
                    description: data.description,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    status: data.isActive ? 'active' : 'inactive',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: 'system',
                },
            });
            logger_1.logger.info('Menu plan created', { id: menuPlan.id, name: menuPlan.name });
            return { success: true, data: menuPlan };
        }
        catch (error) {
            logger_1.logger.error('Failed to create menu plan', error, { data });
            return {
                success: false,
                error: {
                    code: 'PLAN_CREATION_FAILED',
                    message: 'Failed to create menu plan',
                },
            };
        }
    }
    async addMenuSlot(data) {
        try {
            const menuPlan = await this.prisma.menuPlan.findUnique({
                where: { id: data.menuPlanId },
            });
            if (!menuPlan) {
                return {
                    success: false,
                    error: {
                        code: 'PLAN_NOT_FOUND',
                        message: 'Menu plan not found',
                    },
                };
            }
            if (menuPlan.status !== 'active') {
                return {
                    success: false,
                    error: {
                        code: 'PLAN_INACTIVE',
                        message: 'Menu plan is not active',
                    },
                };
            }
            const slotDate = new Date(data.date);
            if (slotDate < menuPlan.startDate || slotDate > menuPlan.endDate) {
                return {
                    success: false,
                    error: {
                        code: 'DATE_OUT_OF_RANGE',
                        message: 'Slot date is outside the menu plan date range',
                    },
                };
            }
            const menuItem = await this.prisma.menuItem.findUnique({
                where: { id: data.menuItemId },
            });
            if (!menuItem || !menuItem.available) {
                return {
                    success: false,
                    error: {
                        code: 'ITEM_NOT_AVAILABLE',
                        message: 'Menu item not found or not available',
                    },
                };
            }
            const menuSlot = {
                id: (0, uuid_1.v4)(),
                menuPlanId: data.menuPlanId,
                menuItemId: data.menuItemId,
                date: data.date,
                mealType: data.mealType,
                quantity: data.quantity,
                price: data.price,
                isAvailable: data.isAvailable,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            logger_1.logger.info('Menu slot added', { id: menuSlot.id, menuItemId: data.menuItemId });
            return { success: true, data: menuSlot };
        }
        catch (error) {
            logger_1.logger.error('Failed to add menu slot', error, { data });
            return {
                success: false,
                error: {
                    code: 'SLOT_CREATION_FAILED',
                    message: 'Failed to add menu slot',
                },
            };
        }
    }
    async getMenuAnalytics(schoolId, startDate, endDate) {
        try {
            const where = { schoolId };
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = startDate;
                if (endDate)
                    where.createdAt.lte = endDate;
            }
            const items = await this.prisma.menuItem.findMany({
                where,
                include: {
                    _count: {
                        select: { orderItems: true },
                    },
                },
            });
            const totalItems = items.length;
            const activeItems = items.filter(item => item.available).length;
            const itemsByCategory = {};
            let totalPrice = 0;
            const nutritionalStats = {
                totalCalories: 0,
                totalProtein: 0,
                allergenCount: new Map(),
            };
            const popularItems = [];
            for (const item of items) {
                itemsByCategory[item.category] = (itemsByCategory[item.category] || 0) + 1;
                totalPrice += this.safeDecimalOperation(item.price);
                if (item.nutritionalInfo) {
                    try {
                        const nutrition = JSON.parse(item.nutritionalInfo);
                        nutritionalStats.totalCalories += nutrition.calories || 0;
                        nutritionalStats.totalProtein += nutrition.protein || 0;
                    }
                    catch (e) {
                    }
                }
                if (item.allergens) {
                    try {
                        const allergens = JSON.parse(item.allergens);
                        allergens.forEach((allergen) => {
                            nutritionalStats.allergenCount.set(allergen, (nutritionalStats.allergenCount.get(allergen) || 0) + 1);
                        });
                    }
                    catch (e) {
                    }
                }
                const orderCount = item._count.orderItems;
                if (orderCount > 0) {
                    popularItems.push({
                        id: item.id,
                        name: item.name,
                        orderCount,
                        revenue: orderCount * this.safeDecimalOperation(item.price),
                    });
                }
            }
            popularItems.sort((a, b) => b.orderCount - a.orderCount);
            const analytics = {
                totalItems,
                activeItems,
                itemsByCategory,
                averagePrice: totalItems > 0 ? totalPrice / totalItems : 0,
                popularItems: popularItems.slice(0, 10),
                nutritionalStats: {
                    averageCalories: activeItems > 0 ? nutritionalStats.totalCalories / activeItems : 0,
                    averageProtein: activeItems > 0 ? nutritionalStats.totalProtein / activeItems : 0,
                    commonAllergens: Array.from(nutritionalStats.allergenCount.entries())
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([allergen]) => allergen),
                },
            };
            return { success: true, data: analytics };
        }
        catch (error) {
            logger_1.logger.error('Failed to get menu analytics', error, {
                schoolId,
                startDate,
                endDate,
            });
            return {
                success: false,
                error: {
                    code: 'ANALYTICS_FAILED',
                    message: 'Failed to get menu analytics',
                },
            };
        }
    }
    async clearMenuCache(schoolId) {
        try {
            const cacheKeys = await redis_service_1.RedisService.keys(`menu_items:*${schoolId}*`);
            if (cacheKeys.length > 0) {
                await redis_service_1.RedisService.del(cacheKeys);
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to clear menu cache', { schoolId });
        }
    }
    safeDecimalOperation(value) {
        if (typeof value === 'number')
            return value;
        if (value && typeof value.toNumber === 'function')
            return value.toNumber();
        return 0;
    }
    async getMenuItemsLegacy() {
        const result = await this.getMenuItems({});
        return result.success ? result.data || [] : [];
    }
    async createMenuItemLegacy(item) {
        const result = await this.createMenuItem(item);
        if (result.success) {
            return result.data;
        }
        throw new Error(result.error?.message || 'Failed to create menu item');
    }
    async updateMenuItemLegacy(id, updates) {
        const result = await this.updateMenuItem({ id, ...updates });
        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to update menu item');
        }
    }
    async deleteMenuItemLegacy(id) {
        const result = await this.deleteMenuItem(id);
        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to delete menu item');
        }
    }
}
exports.MenuService = MenuService;
const menuServiceInstance = MenuService.getInstance();
exports.menuService = menuServiceInstance;
exports._menuService = menuServiceInstance;
exports.default = menuServiceInstance;
//# sourceMappingURL=menu.service.js.map