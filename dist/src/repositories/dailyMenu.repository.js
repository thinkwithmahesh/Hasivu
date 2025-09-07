"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyMenuRepository = exports.DailyMenuRepository = exports.DayType = exports.MenuCategory = void 0;
var MenuCategory;
(function (MenuCategory) {
    MenuCategory["BREAKFAST"] = "BREAKFAST";
    MenuCategory["LUNCH"] = "LUNCH";
    MenuCategory["SNACKS"] = "SNACKS";
    MenuCategory["DINNER"] = "DINNER";
})(MenuCategory || (exports.MenuCategory = MenuCategory = {}));
var DayType;
(function (DayType) {
    DayType["WEEKDAY"] = "WEEKDAY";
    DayType["WEEKEND"] = "WEEKEND";
    DayType["HOLIDAY"] = "HOLIDAY";
    DayType["SPECIAL_EVENT"] = "SPECIAL_EVENT";
})(DayType || (exports.DayType = DayType = {}));
const database_service_1 = require("../services/database.service");
const logger_1 = require("../utils/logger");
class DailyMenuRepository {
    static async create(data) {
        try {
            const dailyMenu = await database_service_1.DatabaseService.client.dailyMenu.create({
                data,
                include: {
                    menuPlan: true,
                    menuItems: true
                }
            });
            logger_1.logger.debug('DailyMenu created', { dailyMenuId: dailyMenu.id });
            return dailyMenu;
        }
        catch (error) {
            logger_1.logger.error('Failed to create daily menu', error, { data });
            throw error;
        }
    }
    static async findById(id) {
        try {
            const dailyMenu = await database_service_1.DatabaseService.client.dailyMenu.findUnique({
                where: { id },
                include: {
                    menuPlan: true
                }
            });
            return dailyMenu;
        }
        catch (error) {
            logger_1.logger.error('Failed to find daily menu by ID', error, { dailyMenuId: id });
            throw error;
        }
    }
    static async findByIdWithItems(id) {
        try {
            const dailyMenu = await database_service_1.DatabaseService.client.dailyMenu.findUnique({
                where: { id },
                include: {
                    menuPlan: true,
                    menuItems: {
                        where: { isVisible: true },
                        include: {
                            menuItem: {
                                select: {
                                    id: true,
                                    name: true,
                                    description: true,
                                    price: true,
                                    category: true,
                                    available: true,
                                    imageUrl: true
                                }
                            }
                        },
                        orderBy: { displayOrder: 'asc' }
                    }
                }
            });
            return dailyMenu;
        }
        catch (error) {
            logger_1.logger.error('Failed to find daily menu with items', error, { dailyMenuId: id });
            throw error;
        }
    }
    static async findByDateAndPlan(date, menuPlanId) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            const dailyMenu = await database_service_1.DatabaseService.client.dailyMenu.findFirst({
                where: {
                    menuPlanId,
                    date: {
                        gte: startOfDay,
                        lte: endOfDay
                    },
                    isActive: true
                },
                include: {
                    menuPlan: true
                }
            });
            return dailyMenu;
        }
        catch (error) {
            logger_1.logger.error('Failed to find daily menu by date/plan', error, {
                date,
                menuPlanId
            });
            throw error;
        }
    }
    static async findMany(options = {}) {
        try {
            const { filters = {}, skip = 0, take = 20, sortBy = 'date', sortOrder = 'asc', includeItems = false } = options;
            const where = {};
            if (filters.menuPlanId)
                where.menuPlanId = filters.menuPlanId;
            if (filters.dayType)
                where.dayType = filters.dayType;
            if (filters.isActive !== undefined)
                where.isActive = filters.isActive;
            if (filters.dateFrom || filters.dateTo) {
                where.date = {};
                if (filters.dateFrom) {
                    const startOfDay = new Date(filters.dateFrom);
                    startOfDay.setHours(0, 0, 0, 0);
                    where.date.gte = startOfDay;
                }
                if (filters.dateTo) {
                    const endOfDay = new Date(filters.dateTo);
                    endOfDay.setHours(23, 59, 59, 999);
                    where.date.lte = endOfDay;
                }
            }
            const include = {
                menuPlan: true,
                ...(includeItems && {
                    menuItems: {
                        where: { isVisible: true },
                        orderBy: { displayOrder: 'asc' }
                    }
                })
            };
            const orderBy = {
                [sortBy]: sortOrder
            };
            const dailyMenus = await database_service_1.DatabaseService.client.dailyMenu.findMany({
                where,
                include,
                skip,
                take,
                orderBy
            });
            return dailyMenus;
        }
        catch (error) {
            logger_1.logger.error('Failed to find daily menus', error, { options });
            throw error;
        }
    }
    static async findManyWithItems(filters = {}) {
        try {
            const options = {
                filters,
                includeItems: true,
                sortBy: 'date',
                sortOrder: 'asc'
            };
            const result = await this.findMany(options);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to find daily menus with items', error, { filters });
            throw error;
        }
    }
    static async update(id, data) {
        try {
            const dailyMenu = await database_service_1.DatabaseService.client.dailyMenu.update({
                where: { id },
                data,
                include: {
                    menuPlan: true,
                    menuItems: true
                }
            });
            logger_1.logger.debug('DailyMenu updated', { dailyMenuId: dailyMenu.id });
            return dailyMenu;
        }
        catch (error) {
            logger_1.logger.error('Failed to update daily menu', error, { dailyMenuId: id, data });
            throw error;
        }
    }
    static async delete(id) {
        try {
            const dailyMenu = await database_service_1.DatabaseService.client.dailyMenu.delete({
                where: { id }
            });
            logger_1.logger.debug('DailyMenu deleted', { dailyMenuId: dailyMenu.id });
            return dailyMenu;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete daily menu', error, { dailyMenuId: id });
            throw error;
        }
    }
    static async count(filters = {}) {
        try {
            const where = { ...filters };
            const count = await database_service_1.DatabaseService.client.dailyMenu.count({
                where
            });
            return count;
        }
        catch (error) {
            logger_1.logger.error('Failed to count daily menus', error, { filters });
            throw error;
        }
    }
    static async findByMenuPlanId(menuPlanId, options = {}) {
        try {
            return await this.findMany({
                ...options,
                filters: { menuPlanId }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find daily menus by menu plan ID', error, { menuPlanId });
            throw error;
        }
    }
    static async findByDateRange(startDate, endDate, schoolId, options = {}) {
        try {
            const filters = {
                dateFrom: startDate,
                dateTo: endDate,
                ...(schoolId && { schoolId })
            };
            return await this.findMany({
                ...options,
                filters
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find daily menus by date range', error, {
                startDate,
                endDate,
                schoolId
            });
            throw error;
        }
    }
    static async findActive(schoolId, options = {}) {
        try {
            const filters = {
                isActive: true,
                ...(schoolId && { schoolId })
            };
            return await this.findMany({
                ...options,
                filters
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find active daily menus', error, { schoolId });
            throw error;
        }
    }
    static async updateMany(where, data) {
        try {
            const result = await database_service_1.DatabaseService.client.dailyMenu.updateMany({
                where,
                data
            });
            logger_1.logger.debug('DailyMenus updated in batch', { count: result.count });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to update daily menus in batch', error, { where, data });
            throw error;
        }
    }
    static async getStatistics(menuPlanId) {
        try {
            const where = menuPlanId ? { menuPlanId } : {};
            const [totalMenus, activeMenus, dayTypeGroups] = await Promise.all([
                this.count(where),
                this.count({ ...where, isActive: true }),
                database_service_1.DatabaseService.client.dailyMenu.groupBy({
                    by: ['dayType'],
                    where,
                    _count: { id: true }
                })
            ]);
            const menusByDayType = {};
            dayTypeGroups.forEach(group => {
                menusByDayType[group.dayType] = group._count.id;
            });
            return {
                totalMenus,
                activeMenus,
                menusByDayType,
                averageItemsPerMenu: 0
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get daily menu statistics', error, { menuPlanId });
            throw error;
        }
    }
    static async clone(sourceId, targetDate, targetMenuPlanId) {
        try {
            logger_1.logger.debug('Cloning daily menu', { sourceId, targetDate });
            const sourceMenu = await this.findByIdWithItems(sourceId);
            if (!sourceMenu) {
                throw new Error(`Source daily menu with ID ${sourceId} not found`);
            }
            const menuPlanId = targetMenuPlanId || sourceMenu.menuPlanId;
            const createData = {
                date: targetDate,
                dayType: sourceMenu.dayType,
                availableQuantity: sourceMenu.availableQuantity,
                notes: sourceMenu.notes,
                metadata: sourceMenu.metadata,
                isActive: true,
                menuPlan: { connect: { id: menuPlanId } }
            };
            const clonedMenu = await this.create(createData);
            logger_1.logger.debug('Daily menu cloned successfully', {
                sourceId,
                clonedId: clonedMenu.id
            });
            return clonedMenu;
        }
        catch (error) {
            logger_1.logger.error('Failed to clone daily menu', error, { sourceId, targetDate, targetMenuPlanId });
            throw error;
        }
    }
}
exports.DailyMenuRepository = DailyMenuRepository;
exports.dailyMenuRepository = new DailyMenuRepository();
//# sourceMappingURL=dailyMenu.repository.js.map