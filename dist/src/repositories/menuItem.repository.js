"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuItemRepository = exports.MenuItemRepository = exports.MenuCategory = void 0;
var MenuCategory;
(function (MenuCategory) {
    MenuCategory["BREAKFAST"] = "BREAKFAST";
    MenuCategory["LUNCH"] = "LUNCH";
    MenuCategory["SNACKS"] = "SNACKS";
    MenuCategory["DINNER"] = "DINNER";
})(MenuCategory || (exports.MenuCategory = MenuCategory = {}));
const database_service_1 = require("../services/database.service");
const logger_1 = require("../utils/logger");
class MenuItemRepository {
    static async create(data) {
        try {
            const menuItem = await database_service_1.DatabaseService.client.menuItem.create({
                data
            });
            logger_1.logger.debug('MenuItem created', { menuItemId: menuItem.id });
            return menuItem;
        }
        catch (error) {
            logger_1.logger.error('Failed to create menu item', error, { data });
            throw error;
        }
    }
    static async findById(id, includeSchool = false) {
        try {
            const menuItem = await database_service_1.DatabaseService.client.menuItem.findUnique({
                where: { id },
                ...(includeSchool && {
                    include: {
                        school: true
                    }
                })
            });
            return menuItem;
        }
        catch (error) {
            logger_1.logger.error('Failed to find menu item by ID', error, { menuItemId: id });
            throw error;
        }
    }
    static async findByNameAndSchool(name, schoolId) {
        try {
            const menuItem = await database_service_1.DatabaseService.client.menuItem.findFirst({
                where: {
                    name: {
                        equals: name,
                        mode: 'insensitive'
                    },
                    schoolId
                }
            });
            return menuItem;
        }
        catch (error) {
            logger_1.logger.error('Failed to find menu item by name and school', error, { name, schoolId });
            throw error;
        }
    }
    static async nameExists(name, schoolId) {
        try {
            const menuItem = await MenuItemRepository.findByNameAndSchool(name, schoolId);
            return menuItem !== null;
        }
        catch (error) {
            logger_1.logger.error('Failed to check menu item name existence', error, { name, schoolId });
            throw error;
        }
    }
    static async findByIdWithIncludes(id, include) {
        try {
            const menuItem = await database_service_1.DatabaseService.client.menuItem.findUnique({
                where: { id },
                include
            });
            return menuItem;
        }
        catch (error) {
            logger_1.logger.error('Failed to find menu item by ID with includes', error, { menuItemId: id });
            throw error;
        }
    }
    static async findMany(options = {}) {
        try {
            const { filters = {}, ids, skip = 0, take = 20, sortBy = 'createdAt', sortOrder = 'desc', include } = options;
            let where = { ...filters };
            if (ids && ids.length > 0) {
                where = {
                    ...where,
                    id: { in: ids }
                };
            }
            const orderBy = {
                [sortBy]: sortOrder
            };
            const [items, total] = await Promise.all([
                database_service_1.DatabaseService.client.menuItem.findMany({
                    where,
                    skip,
                    take,
                    orderBy,
                    ...(include && { include })
                }),
                database_service_1.DatabaseService.client.menuItem.count({ where })
            ]);
            return { items, total };
        }
        catch (error) {
            logger_1.logger.error('Failed to find menu items', error, { options });
            throw error;
        }
    }
    static async search(searchTerm, filters = {}, pagination = {}) {
        try {
            const page = pagination.page || 1;
            const limit = pagination.limit || 20;
            const skip = (page - 1) * limit;
            const where = {
                ...filters,
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { description: { contains: searchTerm, mode: 'insensitive' } }
                ]
            };
            const [items, total] = await Promise.all([
                database_service_1.DatabaseService.client.menuItem.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { name: 'asc' },
                    include: {
                        school: true
                    }
                }),
                database_service_1.DatabaseService.client.menuItem.count({ where })
            ]);
            return { items, total };
        }
        catch (error) {
            logger_1.logger.error('Failed to search menu items', error, { searchTerm, filters });
            throw error;
        }
    }
    static async searchAdvanced(options = {}) {
        try {
            const { query, category, schoolId, available, featured, priceMin, priceMax, allergens, tags, page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = options;
            const skip = (page - 1) * limit;
            const where = {
                ...(schoolId && { schoolId }),
                ...(available !== undefined && { available }),
                ...(featured !== undefined && { featured }),
                ...(category && { category }),
                ...(priceMin !== undefined && { price: { gte: priceMin } }),
                ...(priceMax !== undefined && { price: { lte: priceMax } })
            };
            if (priceMin !== undefined && priceMax !== undefined) {
                where.price = { gte: priceMin, lte: priceMax };
            }
            else if (priceMin !== undefined) {
                where.price = { gte: priceMin };
            }
            else if (priceMax !== undefined) {
                where.price = { lte: priceMax };
            }
            if (query) {
                where.OR = [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ];
            }
            if (allergens && allergens.length > 0) {
                where.allergens = {
                    not: {
                        in: allergens
                    }
                };
            }
            if (tags && tags.length > 0) {
                where.OR = tags.map(tag => ({
                    tags: {
                        contains: tag
                    }
                }));
            }
            const orderBy = {
                [sortBy]: sortOrder
            };
            const [items, total] = await Promise.all([
                database_service_1.DatabaseService.client.menuItem.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        school: true
                    }
                }),
                database_service_1.DatabaseService.client.menuItem.count({ where })
            ]);
            return { items, total };
        }
        catch (error) {
            logger_1.logger.error('Failed to search menu items', error, { options });
            throw error;
        }
    }
    static async update(id, data) {
        try {
            const menuItem = await database_service_1.DatabaseService.client.menuItem.update({
                where: { id },
                data
            });
            logger_1.logger.debug('MenuItem updated', { menuItemId: menuItem.id });
            return menuItem;
        }
        catch (error) {
            logger_1.logger.error('Failed to update menu item', error, { menuItemId: id, data });
            throw error;
        }
    }
    static async delete(id) {
        try {
            const menuItem = await database_service_1.DatabaseService.client.menuItem.delete({
                where: { id }
            });
            logger_1.logger.debug('MenuItem deleted', { menuItemId: menuItem.id });
            return menuItem;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete menu item', error, { menuItemId: id });
            throw error;
        }
    }
    static async count(filters = {}) {
        try {
            const count = await database_service_1.DatabaseService.client.menuItem.count({
                where: filters
            });
            return count;
        }
        catch (error) {
            logger_1.logger.error('Failed to count menu items', error, { filters });
            throw error;
        }
    }
    static async findBySchoolId(schoolId, options = {}) {
        try {
            return await this.findMany({
                ...options,
                filters: { schoolId }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find menu items by school ID', error, { schoolId });
            throw error;
        }
    }
    static async findByCategory(category, options = {}) {
        try {
            return await this.findMany({
                ...options,
                filters: { category }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find menu items by category', error, { category });
            throw error;
        }
    }
    static async findAvailable(schoolId, options = {}) {
        try {
            const filters = { available: true };
            if (schoolId) {
                filters.schoolId = schoolId;
            }
            return await this.findMany({
                ...options,
                filters
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find available menu items', error, { schoolId });
            throw error;
        }
    }
    static async findFeatured(schoolId, options = {}) {
        try {
            const filters = { featured: true };
            if (schoolId) {
                filters.schoolId = schoolId;
            }
            return await this.findMany({
                ...options,
                filters
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find featured menu items', error, { schoolId });
            throw error;
        }
    }
    static async updateMany(where, data) {
        try {
            const result = await database_service_1.DatabaseService.client.menuItem.updateMany({
                where,
                data
            });
            logger_1.logger.debug('MenuItems updated in batch', { count: result.count });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to update menu items in batch', error, { where, data });
            throw error;
        }
    }
    static async getStatistics(schoolId) {
        try {
            const where = schoolId ? { schoolId } : {};
            const [totalItems, availableItems, featuredItems, categoryGroups, priceStats] = await Promise.all([
                this.count(where),
                this.count({ ...where, available: true }),
                this.count({ ...where, featured: true }),
                database_service_1.DatabaseService.client.menuItem.groupBy({
                    by: ['category'],
                    where,
                    _count: { id: true }
                }),
                database_service_1.DatabaseService.client.menuItem.aggregate({
                    where,
                    _avg: { price: true }
                })
            ]);
            const itemsByCategory = {};
            categoryGroups.forEach(group => {
                itemsByCategory[group.category] = group._count.id;
            });
            return {
                totalItems,
                availableItems,
                featuredItems,
                itemsByCategory,
                averagePrice: Number(priceStats._avg.price || 0)
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get menu item statistics', error, { schoolId });
            throw error;
        }
    }
    static async findByPriceRange(minPrice, maxPrice, schoolId, options = {}) {
        try {
            const filters = {
                price: {
                    gte: minPrice,
                    lte: maxPrice
                }
            };
            if (schoolId) {
                filters.schoolId = schoolId;
            }
            return await this.findMany({
                ...options,
                filters
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find items by price range', error, { minPrice, maxPrice, schoolId });
            throw error;
        }
    }
    static async getPopularItems(schoolId, limit = 10) {
        try {
            const result = await this.findFeatured(schoolId, {
                take: limit,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });
            return result.items.map(item => ({
                ...item,
                orderCount: 0
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get popular items', error, { schoolId, limit });
            throw error;
        }
    }
    static async batchUpdateSortOrders(updates) {
        try {
            logger_1.logger.debug('Executing batch sort order updates', { count: updates.length });
            await database_service_1.DatabaseService.client.$transaction(async (tx) => {
                const updatePromises = updates.map(({ id, sortOrder }) => tx.menuItem.update({
                    where: { id },
                    data: { sortOrder }
                }));
                await Promise.all(updatePromises);
            });
            logger_1.logger.debug('Batch sort order updates completed', { count: updates.length });
        }
        catch (error) {
            logger_1.logger.error('Failed to batch update sort orders', error, { updates });
            throw error;
        }
    }
}
exports.MenuItemRepository = MenuItemRepository;
exports.menuItemRepository = new MenuItemRepository();
//# sourceMappingURL=menuItem.repository.js.map