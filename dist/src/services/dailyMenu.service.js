"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyMenuService = exports.DailyMenuService = exports.DayType = exports.MenuCategory = void 0;
var MenuCategory;
(function (MenuCategory) {
    MenuCategory["BREAKFAST"] = "BREAKFAST";
    MenuCategory["LUNCH"] = "LUNCH";
    MenuCategory["SNACK"] = "SNACK";
    MenuCategory["BEVERAGE"] = "BEVERAGE";
    MenuCategory["DESSERT"] = "DESSERT";
    MenuCategory["SPECIAL"] = "SPECIAL";
})(MenuCategory || (exports.MenuCategory = MenuCategory = {}));
var DayType;
(function (DayType) {
    DayType["WEEKDAY"] = "WEEKDAY";
    DayType["WEEKEND"] = "WEEKEND";
    DayType["HOLIDAY"] = "HOLIDAY";
    DayType["SPECIAL_EVENT"] = "SPECIAL_EVENT";
})(DayType || (exports.DayType = DayType = {}));
const dailyMenu_repository_1 = require("../repositories/dailyMenu.repository");
const menuItem_repository_1 = require("../repositories/menuItem.repository");
const logger_1 = require("../utils/logger");
const cache_1 = require("../utils/cache");
const uuid_1 = require("uuid");
class DailyMenuService {
    static CACHE_TTL = 600;
    static MAX_ITEMS_PER_MENU = 50;
    static async createDailyMenu(input) {
        try {
            await this.validateCreateInput(input);
            logger_1.logger.info('Creating daily menu', {
                date: input.date.toISOString().split('T')[0],
                schoolId: input.schoolId,
                category: input.category
            });
            const existingMenu = await dailyMenu_repository_1.DailyMenuRepository.findByDateRange(input.date, input.date, input.schoolId);
            if (existingMenu) {
                throw new Error(`Daily menu already exists for ${input.date.toISOString().split('T')[0]} 
          in ${input.category} category for this school`);
            }
            const menuItems = await Promise.all(input.menuItemIds.map(id => menuItem_repository_1.MenuItemRepository.findById(id)));
            const missingItems = input.menuItemIds.filter((id, index) => !menuItems[index]);
            if (missingItems.length > 0) {
                throw new Error(`Menu items not found: ${missingItems.join(', ')}`);
            }
            const unavailableItems = menuItems.filter((item, index) => item && (!item.available || item.category !== input.category));
            if (unavailableItems.length > 0) {
                const unavailableIds = unavailableItems.map(item => item?.id).filter(Boolean);
                throw new Error(`Menu items unavailable or wrong category: ${unavailableIds.join(', ')}`);
            }
            const createData = {
                id: (0, uuid_1.v4)(),
                date: input.date,
                dayType: input.dayType,
                availableQuantity: input.availableQuantity,
                notes: input.notes,
                metadata: JSON.stringify(input.metadata || {}),
                isActive: true,
                menuPlan: { connect: { id: input.schoolId || 'default-menu-plan' } },
                menuItems: {
                    connect: input.menuItemIds.map(id => ({ id }))
                }
            };
            const dailyMenu = await dailyMenu_repository_1.DailyMenuRepository.create(createData);
            await this.clearRelatedCaches(input.schoolId, input.date, input.category);
            const result = await this.getDailyMenuById(dailyMenu.id);
            if (!result) {
                throw new Error('Failed to retrieve created daily menu');
            }
            logger_1.logger.info('Daily menu created successfully', { dailyMenuId: dailyMenu.id });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to create daily menu', error, { input });
            throw error;
        }
    }
    static async getDailyMenuById(id) {
        try {
            const cacheKey = `daily_menu:${id}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            const dailyMenu = await dailyMenu_repository_1.DailyMenuRepository.findByIdWithItems(id);
            if (!dailyMenu) {
                logger_1.logger.warn('Daily menu not found', { dailyMenuId: id });
                return null;
            }
            await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(dailyMenu));
            return dailyMenu;
        }
        catch (error) {
            logger_1.logger.error('Failed to get daily menu by ID', error, { dailyMenuId: id });
            throw error;
        }
    }
    static async getDailyMenusByDateRange(schoolId, startDate, endDate, category) {
        try {
            logger_1.logger.info('Getting daily menus by date range', {
                schoolId,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                category
            });
            const filters = {
                schoolId,
                dateFrom: startDate,
                dateTo: endDate,
                isActive: true,
                ...(category && { category })
            };
            const result = await dailyMenu_repository_1.DailyMenuRepository.findManyWithItems(filters);
            logger_1.logger.info('Retrieved daily menus by date range', {
                count: result.length,
                schoolId,
                category
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to get daily menus by date range', error, {
                schoolId,
                startDate,
                endDate,
                category
            });
            throw error;
        }
    }
    static async getDailyMenuByDate(schoolId, date, category) {
        try {
            const cacheKey = `daily_menu:date:${schoolId}:${date.toISOString().split('T')[0]}:${category || 'all'}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            const filters = {
                schoolId,
                dateFrom: date,
                dateTo: date,
                isActive: true,
                ...(category && { category })
            };
            const result = await dailyMenu_repository_1.DailyMenuRepository.findManyWithItems(filters);
            await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to get daily menu by date', error, { schoolId, date, category });
            throw error;
        }
    }
    static async updateDailyMenu(id, input) {
        try {
            logger_1.logger.info('Updating daily menu', { dailyMenuId: id });
            const existing = await dailyMenu_repository_1.DailyMenuRepository.findById(id);
            if (!existing) {
                throw new Error(`Daily menu with ID ${id} not found`);
            }
            if (input.menuItemIds) {
                if (input.menuItemIds.length > this.MAX_ITEMS_PER_MENU) {
                    throw new Error(`Cannot add more than ${this.MAX_ITEMS_PER_MENU} items to a daily menu`);
                }
                const menuItems = await Promise.all(input.menuItemIds.map(itemId => menuItem_repository_1.MenuItemRepository.findById(itemId)));
                const missingItems = input.menuItemIds.filter((id, index) => !menuItems[index]);
                if (missingItems.length > 0) {
                    throw new Error(`Menu items not found: ${missingItems.join(', ')}`);
                }
                const unavailableItems = menuItems.filter(item => item && !item.available);
                if (unavailableItems.length > 0) {
                    const unavailableIds = unavailableItems.map(item => item?.id).filter(Boolean);
                    throw new Error(`Menu items unavailable or wrong category: ${unavailableIds.join(', ')}`);
                }
            }
            const updateData = {};
            if (input.availableQuantity !== undefined)
                updateData.availableQuantity = input.availableQuantity;
            if (input.notes !== undefined)
                updateData.notes = input.notes;
            if (input.metadata !== undefined)
                updateData.metadata = JSON.stringify(input.metadata);
            if (input.isActive !== undefined)
                updateData.isActive = input.isActive;
            if (input.menuItemIds) {
                updateData.menuItems = {
                    set: input.menuItemIds.map(id => ({ id }))
                };
            }
            const dailyMenu = await dailyMenu_repository_1.DailyMenuRepository.update(id, updateData);
            await this.clearRelatedCaches('default-school', existing.date, MenuCategory.LUNCH);
            await cache_1.cache.del(`daily_menu:${id}`);
            const result = await this.getDailyMenuById(dailyMenu.id);
            if (!result) {
                throw new Error('Failed to retrieve updated daily menu');
            }
            logger_1.logger.info('Daily menu updated successfully', { dailyMenuId: dailyMenu.id });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to update daily menu', error, { dailyMenuId: id, input });
            throw error;
        }
    }
    static async deleteDailyMenu(id, hard = false) {
        try {
            logger_1.logger.info('Deleting daily menu', { dailyMenuId: id, hard });
            const existing = await dailyMenu_repository_1.DailyMenuRepository.findById(id);
            if (!existing) {
                throw new Error(`Daily menu with ID ${id} not found`);
            }
            let dailyMenu;
            if (hard) {
                dailyMenu = await dailyMenu_repository_1.DailyMenuRepository.delete(id);
            }
            else {
                dailyMenu = await dailyMenu_repository_1.DailyMenuRepository.update(id, { isActive: false });
            }
            await this.clearRelatedCaches('default-school', existing.date, MenuCategory.LUNCH);
            await cache_1.cache.del(`daily_menu:${id}`);
            logger_1.logger.info('Daily menu deleted successfully', {
                dailyMenuId: dailyMenu.id,
                hard
            });
            return dailyMenu;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete daily menu', error, { dailyMenuId: id });
            throw error;
        }
    }
    static async cloneDailyMenu(sourceId, targetDate, schoolId) {
        try {
            logger_1.logger.info('Cloning daily menu', { sourceId, targetDate });
            const sourceMenu = await this.getDailyMenuById(sourceId);
            if (!sourceMenu) {
                throw new Error(`Source daily menu with ID ${sourceId} not found`);
            }
            const targetSchoolId = schoolId || 'fallback_school_id';
            const existingTargetMenu = await dailyMenu_repository_1.DailyMenuRepository.findByDateAndPlan(targetDate, sourceMenu.menuPlanId);
            if (existingTargetMenu) {
                throw new Error(`Daily menu already exists for ${targetDate.toISOString().split('T')[0]} 
          for this menu plan`);
            }
            const clonedMenu = await dailyMenu_repository_1.DailyMenuRepository.clone(sourceId, targetDate, sourceMenu.menuPlanId);
            logger_1.logger.info('Daily menu cloned successfully', {
                sourceId,
                clonedId: clonedMenu.id,
                targetDate
            });
            return clonedMenu;
        }
        catch (error) {
            logger_1.logger.error('Failed to clone daily menu', error, { sourceId, targetDate, schoolId });
            throw error;
        }
    }
    static async getWeeklyMenuPlan(schoolId, startDate) {
        try {
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            const menus = await this.getDailyMenusByDateRange(schoolId, startDate, endDate);
            const weeklyPlan = {};
            menus.forEach(menu => {
                const dateKey = menu.date.toISOString().split('T')[0];
                if (!weeklyPlan[dateKey]) {
                    weeklyPlan[dateKey] = [];
                }
                weeklyPlan[dateKey].push(menu);
            });
            logger_1.logger.info('Retrieved weekly menu plan', {
                schoolId,
                startDate: startDate.toISOString().split('T')[0],
                daysWithMenus: Object.keys(weeklyPlan).length
            });
            return weeklyPlan;
        }
        catch (error) {
            logger_1.logger.error('Failed to get weekly menu plan', error, { schoolId, startDate });
            throw error;
        }
    }
    static async validateCreateInput(input) {
        if (!input.date) {
            throw new Error('Date is required');
        }
        if (!input.schoolId) {
            throw new Error('School ID is required');
        }
        if (!input.category) {
            throw new Error('Category is required');
        }
        if (!input.dayType) {
            throw new Error('Day type is required');
        }
        if (!input.menuItemIds || input.menuItemIds.length === 0) {
            throw new Error('At least one menu item is required');
        }
        if (input.menuItemIds.length > this.MAX_ITEMS_PER_MENU) {
            throw new Error(`Cannot add more than ${this.MAX_ITEMS_PER_MENU} items to a daily menu`);
        }
        if (input.availableQuantity && input.availableQuantity < 0) {
            throw new Error('Available quantity cannot be negative');
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const inputDate = new Date(input.date);
        inputDate.setHours(0, 0, 0, 0);
        if (inputDate < today) {
            throw new Error('Cannot create daily menu for past dates');
        }
    }
    static getDayTypeFromDate(date) {
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return 'WEEKEND';
        }
        else {
            return 'WEEKDAY';
        }
    }
    static async clearRelatedCaches(schoolId, date, category) {
        try {
            const dateKey = date.toISOString().split('T')[0];
            const cacheKeys = [
                `daily_menu:date:${schoolId}:${dateKey}:*`,
                `daily_menu:school:${schoolId}:*`,
                `daily_menu:category:${category}:*`,
                'weekly_plan:*'
            ];
            cache_1.cache.clear();
        }
        catch (error) {
            logger_1.logger.warn('Failed to clear caches', error);
        }
    }
}
exports.DailyMenuService = DailyMenuService;
exports.dailyMenuService = new DailyMenuService();
//# sourceMappingURL=dailyMenu.service.js.map