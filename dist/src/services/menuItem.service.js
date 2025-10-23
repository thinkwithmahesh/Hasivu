"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItemService = exports.MenuCategory = void 0;
const client_1 = require("@prisma/client");
const menuItem_repository_1 = require("../repositories/menuItem.repository");
const cache_1 = require("../utils/cache");
const logger_1 = require("../utils/logger");
var menuItem_repository_2 = require("../repositories/menuItem.repository");
Object.defineProperty(exports, "MenuCategory", { enumerable: true, get: function () { return menuItem_repository_2.MenuCategory; } });
class MenuItemService {
    static repository;
    static instance;
    static getInstance() {
        if (!MenuItemService.instance) {
            MenuItemService.instance = new MenuItemService();
        }
        return MenuItemService.instance;
    }
    static async createMenuItem(input) {
        if (!input.name?.trim()) {
            throw new Error('Menu item name is required');
        }
        if (input.name.length > 200) {
            throw new Error('Menu item name cannot exceed 200 characters');
        }
        if (input.description && input.description.length > 1000) {
            throw new Error('Menu item description cannot exceed 1000 characters');
        }
        if (input.price <= 0) {
            throw new Error('Menu item price must be greater than 0');
        }
        if (input.originalPrice && input.originalPrice <= input.price) {
            throw new Error('Original price must be greater than current price');
        }
        const existing = await menuItem_repository_1.MenuItemRepository.findByNameAndSchool(input.name, input.schoolId);
        if (existing) {
            throw new Error(`Menu item with name "${input.name}" already exists for this school`);
        }
        const data = {
            name: input.name,
            description: input.description || null,
            category: input.category,
            price: input.price,
            currency: input.currency || 'INR',
            schoolId: input.schoolId,
            available: input.available ?? true,
            nutritionalInfo: input.nutritionalInfo ? JSON.stringify(input.nutritionalInfo) : null,
            allergens: input.allergens ? JSON.stringify(input.allergens) : null,
            imageUrl: input.imageUrl || null,
            originalPrice: input.originalPrice,
            featured: input.featured ?? false,
            sortOrder: input.sortOrder ?? 0,
            tags: [],
            preparationTime: 0,
            portionSize: '',
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            vendorId: null,
            metadata: {},
        };
        const menuItem = await menuItem_repository_1.MenuItemRepository.create(data);
        await cache_1.cache.clear();
        return menuItem;
    }
    static async getMenuItemById(id, includeUnavailable = true) {
        const cacheKey = `menu_item:${id}:${includeUnavailable}`;
        const cached = await cache_1.cache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const menuItem = await menuItem_repository_1.MenuItemRepository.findById(id);
        if (!menuItem) {
            logger_1.logger.warn('Menu item not found', { menuItemId: id });
            return null;
        }
        if (!includeUnavailable && !menuItem.available) {
            return null;
        }
        await cache_1.cache.setex(cacheKey, 300, JSON.stringify(menuItem));
        return menuItem;
    }
    static async getMenuItems(filters = {}, pagination = {}) {
        const { page = 1, limit = 20, sortBy = 'sortOrder', sortOrder = 'asc' } = pagination;
        const skip = (page - 1) * limit;
        const result = await menuItem_repository_1.MenuItemRepository.findMany({
            filters,
            skip,
            take: limit,
            sortBy,
            sortOrder,
        });
        const totalPages = Math.ceil(result.total / limit);
        return {
            items: result.items,
            total: result.total,
            page,
            limit,
            totalPages,
        };
    }
    static async searchMenuItems(term, filters = {}, pagination = {}) {
        if (!term.trim()) {
            return this.getMenuItems(filters, pagination);
        }
        const { page = 1, limit = 20, sortBy = 'sortOrder', sortOrder = 'asc' } = pagination;
        const skip = (page - 1) * limit;
        const result = await menuItem_repository_1.MenuItemRepository.search({
            query: term,
            filters,
            skip,
            take: limit,
            sortBy,
            sortOrder,
        });
        const totalPages = Math.ceil(result.total / limit);
        return {
            items: result.items,
            total: result.total,
            page,
            limit,
            totalPages,
        };
    }
    static async updateMenuItem(id, input) {
        if (input.name && input.name.length > 200) {
            throw new Error('Menu item name cannot exceed 200 characters');
        }
        if (input.description && input.description.length > 1000) {
            throw new Error('Menu item description cannot exceed 1000 characters');
        }
        if (input.price !== undefined && input.price <= 0) {
            throw new Error('Menu item price must be greater than 0');
        }
        if (input.originalPrice && input.price !== undefined && input.originalPrice <= input.price) {
            throw new Error('Original price must be greater than current price');
        }
        const existing = await menuItem_repository_1.MenuItemRepository.findById(id);
        if (!existing) {
            throw new Error(`Menu item with ID ${id} not found`);
        }
        if (input.name && input.name !== existing.name && existing.schoolId) {
            const duplicate = await menuItem_repository_1.MenuItemRepository.findByNameAndSchool(input.name, existing.schoolId);
            if (duplicate) {
                throw new Error(`Menu item with name "${input.name}" already exists for this school`);
            }
        }
        const updateData = { ...input };
        if (input.allergens) {
            updateData.allergens = JSON.stringify(input.allergens);
        }
        if (input.nutritionalInfo) {
            updateData.nutritionalInfo = JSON.stringify(input.nutritionalInfo);
        }
        const updated = await menuItem_repository_1.MenuItemRepository.update(id, updateData);
        await cache_1.cache.del(`menu_item:${id}:true`);
        await cache_1.cache.del(`menu_item:${id}:false`);
        await cache_1.cache.clear();
        return updated;
    }
    static async deleteMenuItem(id, hard = false) {
        const existing = await menuItem_repository_1.MenuItemRepository.findById(id);
        if (!existing) {
            throw new Error(`Menu item with ID ${id} not found`);
        }
        let deleted;
        if (hard) {
            deleted = await menuItem_repository_1.MenuItemRepository.delete(id);
        }
        else {
            deleted = await menuItem_repository_1.MenuItemRepository.update(id, { available: false });
        }
        await cache_1.cache.del(`menu_item:${id}:true`);
        await cache_1.cache.del(`menu_item:${id}:false`);
        await cache_1.cache.clear();
        return deleted;
    }
    static async updateSortOrders(updates) {
        if (updates.length > 100) {
            throw new Error('Cannot update more than 100 items at once');
        }
        if (updates.length === 0) {
            return;
        }
        const ids = updates.map(u => u.id);
        const existingItems = await menuItem_repository_1.MenuItemRepository.findMany({
            filters: { ids },
            take: ids.length,
        });
        if (existingItems.total !== ids.length) {
            const foundIds = new Set(existingItems.items.map((item) => item.id));
            const missingIds = ids.filter(id => !foundIds.has(id));
            throw new Error(`Menu items not found: ${missingIds.join(', ')}`);
        }
        await menuItem_repository_1.MenuItemRepository.batchUpdateSortOrders(updates);
        await cache_1.cache.clear();
    }
    static async toggleFeatured(id) {
        const item = await this.getMenuItemById(id);
        if (!item) {
            throw new Error(`Menu item with ID ${id} not found`);
        }
        return this.updateMenuItem(id, { featured: !item.featured });
    }
    static async getMenuItemsByAllergens(allergens) {
        const result = await this.getMenuItems();
        return result.items.filter(item => {
            if (!item.allergens) {
                return true;
            }
            try {
                const itemAllergens = JSON.parse(item.allergens);
                if (!Array.isArray(itemAllergens)) {
                    return true;
                }
                return !allergens.some(allergen => itemAllergens.some((itemAllergen) => itemAllergen.toLowerCase().includes(allergen.toLowerCase())));
            }
            catch (error) {
                return true;
            }
        });
    }
    static async getNutritionalSummary(itemIds) {
        let totalCalories = 0;
        const allAllergens = new Set();
        const nutritionalTotals = {};
        for (const id of itemIds) {
            const item = await this.getMenuItemById(id);
            if (item) {
                if (item.nutritionalInfo) {
                    try {
                        const nutrition = typeof item.nutritionalInfo === 'string'
                            ? JSON.parse(item.nutritionalInfo)
                            : item.nutritionalInfo;
                        if (nutrition.calories) {
                            totalCalories += nutrition.calories;
                        }
                        Object.entries(nutrition).forEach(([key, value]) => {
                            if (typeof value === 'number') {
                                nutritionalTotals[key] = (nutritionalTotals[key] || 0) + value;
                            }
                        });
                    }
                    catch (error) {
                    }
                }
                if (item.allergens) {
                    try {
                        const allergens = JSON.parse(item.allergens);
                        if (Array.isArray(allergens)) {
                            allergens.forEach((allergen) => allAllergens.add(allergen));
                        }
                    }
                    catch (error) {
                    }
                }
            }
        }
        return {
            totalCalories,
            allergens: Array.from(allAllergens),
            nutritionalInfo: nutritionalTotals,
        };
    }
    static async getFeaturedItems(options = {}) {
        const filters = {
            featured: true,
            available: true,
            schoolId: options.schoolId,
            category: options.category,
        };
        const result = await this.getMenuItems(filters, {
            limit: options.limit || 10,
            sortBy: 'sortOrder',
            sortOrder: 'asc',
        });
        return result.items;
    }
    static async getMenuItemsByCategory(category, options = {}) {
        const filters = {
            category,
            available: options.available ?? true,
            schoolId: options.schoolId,
        };
        const result = await this.getMenuItems(filters, {
            limit: options.limit || 50,
            sortBy: 'sortOrder',
            sortOrder: 'asc',
        });
        return result.items;
    }
    static async toggleAvailability(id) {
        const item = await this.getMenuItemById(id);
        if (!item) {
            throw new Error(`Menu item with ID ${id} not found`);
        }
        return this.updateMenuItem(id, { available: !item.available });
    }
    static async create(input) {
        return await MenuItemService.createMenuItem(input);
    }
    static async findById(id) {
        return await MenuItemService.getMenuItemById(id, true);
    }
    static async findBySchool(schoolId, includeUnavailable = true) {
        const result = await MenuItemService.getMenuItems({ schoolId }, { limit: 1000 });
        if (!includeUnavailable) {
            return result.items.filter(item => item.available);
        }
        return result.items;
    }
    static async findByCategory(schoolId, category) {
        return await MenuItemService.getMenuItemsByCategory(category, { schoolId, available: true });
    }
    static async search(schoolId, query) {
        if (!query.trim()) {
            return [];
        }
        const result = await MenuItemService.searchMenuItems(query, { schoolId, available: true }, { limit: 100 });
        return result.items;
    }
    static async getMenuStats(schoolId) {
        const prisma = new client_1.PrismaClient();
        try {
            const where = schoolId ? { schoolId } : {};
            const aggregateResult = await prisma.menuItem.aggregate({
                where,
                _count: { id: true },
                _avg: { price: true },
            });
            const categoryStats = await prisma.menuItem.groupBy({
                by: ['category'],
                where,
                _count: { category: true },
            });
            const byCategory = {};
            categoryStats.forEach((stat) => {
                byCategory[stat.category] = stat._count.category;
            });
            return {
                totalItems: aggregateResult._count.id || 0,
                averagePrice: Number(aggregateResult._avg.price) || 0,
                byCategory,
            };
        }
        finally {
            await prisma.$disconnect();
        }
    }
    static extendMenuItem(item) {
        return {
            ...item,
            allergens: item.allergens ? JSON.parse(item.allergens) : [],
            nutritionalInfo: item.nutritionalInfo ? JSON.parse(item.nutritionalInfo) : {},
        };
    }
}
exports.MenuItemService = MenuItemService;
exports.default = MenuItemService;
//# sourceMappingURL=menuItem.service.js.map