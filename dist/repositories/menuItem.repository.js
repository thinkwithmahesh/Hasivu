"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuItemRepository = exports.MenuItemRepository = exports.MenuCategory = void 0;
// Local enum to match schema
var MenuCategory;
(function (MenuCategory) {
    MenuCategory["BREAKFAST"] = "BREAKFAST";
    MenuCategory["LUNCH"] = "LUNCH";
    MenuCategory["SNACKS"] = "SNACKS";
    MenuCategory["DINNER"] = "DINNER";
})(MenuCategory || (exports.MenuCategory = MenuCategory = {}));
const database_service_1 = require("../services/database.service");
const logger_1 = require("../utils/logger");
/**
 * MenuItem Repository class
 */
class MenuItemRepository {
    /**
     * Create new menu item
     */
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
    /**
     * Find menu item by ID
     */
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
    /**
     * Find menu item by name and school
     */
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
    /**
     * Check if menu item name exists in a school
     */
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
    /**
     * Find menu item by ID with includes
     */
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
    /**
     * Find multiple menu items with options
     */
    static async findMany(options = {}) {
        try {
            const { filters = {}, ids, skip = 0, take = 20, sortBy = 'createdAt', sortOrder = 'desc', include } = options;
            // Build where clause
            let where = { ...filters };
            // Add IDs filter if provided
            if (ids && ids.length > 0) {
                where = {
                    ...where,
                    id: { in: ids }
                };
            }
            // Build orderBy clause
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
    /**
     * Search menu items with text query and filters
     */
    static async search(searchTerm, filters = {}, pagination = {}) {
        try {
            const page = pagination.page || 1;
            const limit = pagination.limit || 20;
            const skip = (page - 1) * limit;
            // Build where clause with search
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
    /**
     * Search menu items with advanced filtering (legacy)
     */
    static async searchAdvanced(options = {}) {
        try {
            const { query, category, schoolId, available, featured, priceMin, priceMax, allergens, tags, page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = options;
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {
                ...(schoolId && { schoolId }),
                ...(available !== undefined && { available }),
                ...(featured !== undefined && { featured }),
                ...(category && { category }),
                ...(priceMin !== undefined && { price: { gte: priceMin } }),
                ...(priceMax !== undefined && { price: { lte: priceMax } })
            };
            // Add price range filter
            if (priceMin !== undefined && priceMax !== undefined) {
                where.price = { gte: priceMin, lte: priceMax };
            }
            else if (priceMin !== undefined) {
                where.price = { gte: priceMin };
            }
            else if (priceMax !== undefined) {
                where.price = { lte: priceMax };
            }
            // Add text search
            if (query) {
                where.OR = [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ];
            }
            // Add allergens filter
            if (allergens && allergens.length > 0) {
                where.allergens = {
                    not: {
                        in: allergens
                    }
                };
            }
            // Add tags filter (tags is a JSON string field)
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
    /**
     * Update menu item
     */
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
    /**
     * Delete menu item
     */
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
    /**
     * Count menu items with filters
     */
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
    /**
     * Find menu items by school ID
     */
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
    /**
     * Find menu items by category
     */
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
    /**
     * Find available menu items
     */
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
    /**
     * Find featured menu items
     */
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
    /**
     * Update menu items in batch
     */
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
    /**
     * Get menu item statistics
     */
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
    /**
     * Find items by price range
     */
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
    /**
     * Get popular menu items based on order frequency
     */
    static async getPopularItems(schoolId, limit = 10) {
        try {
            // This would require joining with order items table
            // For now, return featured items as a fallback
            const result = await this.findFeatured(schoolId, {
                take: limit,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });
            return result.items.map(item => ({
                ...item,
                orderCount: 0 // Would be calculated from actual orders
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get popular items', error, { schoolId, limit });
            throw error;
        }
    }
    /**
     * Batch update sort orders for multiple menu items
     */
    static async batchUpdateSortOrders(updates) {
        try {
            logger_1.logger.debug('Executing batch sort order updates', { count: updates.length });
            // Use transaction for atomic updates
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
// Export singleton instance
exports.menuItemRepository = new MenuItemRepository();
