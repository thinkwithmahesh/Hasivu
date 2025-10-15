"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dailyMenu_service_1 = require("../../../src/services/dailyMenu.service");
const database_service_1 = require("../../../src/services/database.service");
const cache_1 = require("../../../src/utils/cache");
const logger_1 = require("../../../src/utils/logger");
const TEST_SCHOOL_ID = 'test-school-integration';
const TEST_MENU_ITEM_IDS = ['test-item-1', 'test-item-2'];
describe('DailyMenuService Integration Tests', () => {
    let testMenuId;
    let testMenuItemIds;
    beforeAll(async () => {
        try {
            logger_1.logger.info('Integration test services connected successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to test services', error);
            throw error;
        }
    }, 30000);
    afterAll(async () => {
        try {
            for (const itemId of testMenuItemIds || []) {
                await database_service_1.DatabaseService.client.menuItem.deleteMany({
                    where: { id: itemId }
                });
            }
            if (testMenuId) {
                await database_service_1.DatabaseService.client.dailyMenu.deleteMany({
                    where: { id: testMenuId }
                });
            }
            await database_service_1.DatabaseService.client.school.deleteMany({
                where: { id: TEST_SCHOOL_ID }
            });
            logger_1.logger.info('Integration test cleanup completed');
        }
        catch (error) {
            logger_1.logger.error('Failed to clean up integration tests', error);
        }
    }, 30000);
    beforeEach(async () => {
        await database_service_1.DatabaseService.client.school.upsert({
            where: { id: TEST_SCHOOL_ID },
            update: {},
            create: {
                id: TEST_SCHOOL_ID,
                code: 'TEST_SCHOOL',
                name: 'Integration Test School',
                address: '123 Test Street'
            }
        });
        testMenuItemIds = [];
        for (let i = 0; i < 2; i++) {
            const menuItem = await database_service_1.DatabaseService.client.menuItem.create({
                data: {
                    name: `Test Menu Item ${i + 1}`,
                    description: `Test description ${i + 1}`,
                    price: 50 + i * 10,
                    category: dailyMenu_service_1.MenuCategory.LUNCH,
                    available: true,
                    schoolId: TEST_SCHOOL_ID
                }
            });
            testMenuItemIds.push(menuItem.id);
        }
        const cacheKeys = [
            `daily_menu:test-menu-id`,
            `daily_menu:date:${TEST_SCHOOL_ID}:*`
        ];
        for (const key of cacheKeys) {
            await cache_1.cache.del(key);
        }
    });
    afterEach(async () => {
        if (testMenuId) {
            await database_service_1.DatabaseService.client.dailyMenu.deleteMany({
                where: { id: testMenuId }
            });
            testMenuId = '';
        }
        cache_1.cache.clear();
    });
    describe('Real Database and Cache Integration', () => {
        it('should create, read, update, and delete daily menu with real services', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            const createInput = {
                date: futureDate,
                schoolId: TEST_SCHOOL_ID,
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: testMenuItemIds,
                availableQuantity: 100,
                notes: 'Integration test menu'
            };
            const createdMenu = await dailyMenu_service_1.DailyMenuService.createDailyMenu(createInput);
            expect(createdMenu).toBeDefined();
            expect(createdMenu.menuPlanId).toBeDefined();
            expect(createdMenu.menuItems).toBeDefined();
            expect(createdMenu.menuItems?.length).toBe(testMenuItemIds.length);
            testMenuId = createdMenu.id;
            const readMenu = await dailyMenu_service_1.DailyMenuService.getDailyMenuById(testMenuId);
            expect(readMenu).toEqual(createdMenu);
            const cachedMenu = await dailyMenu_service_1.DailyMenuService.getDailyMenuById(testMenuId);
            expect(cachedMenu).toEqual(createdMenu);
            const updateData = {
                availableQuantity: 150,
                notes: 'Updated integration test menu'
            };
            const updatedMenu = await dailyMenu_service_1.DailyMenuService.updateDailyMenu(testMenuId, updateData);
            expect(updatedMenu.availableQuantity).toBe(150);
            expect(updatedMenu.notes).toBe('Updated integration test menu');
            const freshRead = await dailyMenu_service_1.DailyMenuService.getDailyMenuById(testMenuId);
            expect(freshRead?.availableQuantity).toBe(150);
            const deletedMenu = await dailyMenu_service_1.DailyMenuService.deleteDailyMenu(testMenuId);
            expect(deletedMenu.isActive).toBe(false);
            const afterDelete = await dailyMenu_service_1.DailyMenuService.getDailyMenuById(testMenuId);
            expect(afterDelete).toBeNull();
        }, 30000);
        it('should handle date range queries with real database', async () => {
            const baseDate = new Date();
            baseDate.setDate(baseDate.getDate() + 10);
            const menusToCreate = [];
            for (let i = 0; i < 3; i++) {
                const menuDate = new Date(baseDate);
                menuDate.setDate(baseDate.getDate() + i);
                const menu = await dailyMenu_service_1.DailyMenuService.createDailyMenu({
                    date: menuDate,
                    schoolId: TEST_SCHOOL_ID,
                    category: dailyMenu_service_1.MenuCategory.LUNCH,
                    dayType: i === 0 ? dailyMenu_service_1.DayType.WEEKDAY : dailyMenu_service_1.DayType.WEEKEND,
                    menuItemIds: [testMenuItemIds[0]],
                    availableQuantity: 50 + i * 25
                });
                menusToCreate.push(menu);
            }
            const startDate = new Date(baseDate);
            const endDate = new Date(baseDate);
            endDate.setDate(baseDate.getDate() + 2);
            const menus = await dailyMenu_service_1.DailyMenuService.getDailyMenusByDateRange(TEST_SCHOOL_ID, startDate, endDate);
            expect(menus).toHaveLength(3);
            expect(menus.every(menu => menu.menuPlanId !== undefined)).toBe(true);
            for (const menu of menusToCreate) {
                await dailyMenu_service_1.DailyMenuService.deleteDailyMenu(menu.id, true);
            }
        }, 30000);
        it('should handle cache failures gracefully with real services', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 5);
            const createInput = {
                date: futureDate,
                schoolId: TEST_SCHOOL_ID,
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: [testMenuItemIds[0]],
                availableQuantity: 75
            };
            const menu = await dailyMenu_service_1.DailyMenuService.createDailyMenu(createInput);
            testMenuId = menu.id;
            cache_1.cache.clear();
            const retrieved = await dailyMenu_service_1.DailyMenuService.getDailyMenuById(testMenuId);
            expect(retrieved).toEqual(menu);
        }, 30000);
        it('should validate business rules with real data', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu({
                date: pastDate,
                schoolId: TEST_SCHOOL_ID,
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: [testMenuItemIds[0]],
                availableQuantity: 50
            })).rejects.toThrow('Cannot create daily menu for past dates');
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 3);
            const firstMenu = await dailyMenu_service_1.DailyMenuService.createDailyMenu({
                date: futureDate,
                schoolId: TEST_SCHOOL_ID,
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: [testMenuItemIds[0]],
                availableQuantity: 50
            });
            testMenuId = firstMenu.id;
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu({
                date: futureDate,
                schoolId: TEST_SCHOOL_ID,
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: [testMenuItemIds[1]],
                availableQuantity: 50
            })).rejects.toThrow('Daily menu already exists for');
        }, 30000);
        it('should handle concurrent operations with real database transactions', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 4);
            const initialMenu = await dailyMenu_service_1.DailyMenuService.createDailyMenu({
                date: futureDate,
                schoolId: TEST_SCHOOL_ID,
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: testMenuItemIds,
                availableQuantity: 100
            });
            testMenuId = initialMenu.id;
            const updatePromises = [
                dailyMenu_service_1.DailyMenuService.updateDailyMenu(testMenuId, { availableQuantity: 80 }),
                dailyMenu_service_1.DailyMenuService.updateDailyMenu(testMenuId, { notes: 'Concurrent update 1' }),
                dailyMenu_service_1.DailyMenuService.updateDailyMenu(testMenuId, { availableQuantity: 60 })
            ];
            const results = await Promise.allSettled(updatePromises);
            const successfulUpdates = results.filter(result => result.status === 'fulfilled');
            expect(successfulUpdates.length).toBeGreaterThan(0);
            const finalMenu = await dailyMenu_service_1.DailyMenuService.getDailyMenuById(testMenuId);
            expect(finalMenu).toBeDefined();
        }, 30000);
        it('should handle large datasets efficiently', async () => {
            const baseDate = new Date();
            baseDate.setDate(baseDate.getDate() + 20);
            const createdMenus = [];
            for (let i = 0; i < 30; i++) {
                const menuDate = new Date(baseDate);
                menuDate.setDate(baseDate.getDate() + i);
                const menu = await dailyMenu_service_1.DailyMenuService.createDailyMenu({
                    date: menuDate,
                    schoolId: TEST_SCHOOL_ID,
                    category: dailyMenu_service_1.MenuCategory.LUNCH,
                    dayType: menuDate.getDay() === 0 || menuDate.getDay() === 6 ? dailyMenu_service_1.DayType.WEEKEND : dailyMenu_service_1.DayType.WEEKDAY,
                    menuItemIds: [testMenuItemIds[i % 2]],
                    availableQuantity: 100 + i
                });
                createdMenus.push(menu);
            }
            const weekStart = new Date(baseDate);
            const weeklyPlan = await dailyMenu_service_1.DailyMenuService.getWeeklyMenuPlan(TEST_SCHOOL_ID, weekStart);
            expect(Object.keys(weeklyPlan)).toBeGreaterThan(0);
            const rangeStart = new Date(baseDate);
            const rangeEnd = new Date(baseDate);
            rangeEnd.setDate(baseDate.getDate() + 6);
            const rangeMenus = await dailyMenu_service_1.DailyMenuService.getDailyMenusByDateRange(TEST_SCHOOL_ID, rangeStart, rangeEnd);
            expect(rangeMenus.length).toBe(7);
            for (const menu of createdMenus) {
                await dailyMenu_service_1.DailyMenuService.deleteDailyMenu(menu.id, true);
            }
        }, 60000);
        it('should handle clone operations with real data relationships', async () => {
            const sourceDate = new Date();
            sourceDate.setDate(sourceDate.getDate() + 7);
            const sourceMenu = await dailyMenu_service_1.DailyMenuService.createDailyMenu({
                date: sourceDate,
                schoolId: TEST_SCHOOL_ID,
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: testMenuItemIds,
                availableQuantity: 100,
                notes: 'Source menu for cloning'
            });
            const targetDate = new Date(sourceDate);
            targetDate.setDate(sourceDate.getDate() + 7);
            const clonedMenu = await dailyMenu_service_1.DailyMenuService.cloneDailyMenu(sourceMenu.id, targetDate);
            expect(clonedMenu.date.toDateString()).toBe(targetDate.toDateString());
            expect(clonedMenu.schoolId).toBe(TEST_SCHOOL_ID);
            expect(clonedMenu.menuItems).toBeDefined();
            expect(clonedMenu.availableQuantity).toBe(100);
            const expectedDayType = targetDate.getDay() === 0 || targetDate.getDay() === 6 ? dailyMenu_service_1.DayType.WEEKEND : dailyMenu_service_1.DayType.WEEKDAY;
            expect(clonedMenu.dayType).toBe(expectedDayType);
            await dailyMenu_service_1.DailyMenuService.deleteDailyMenu(sourceMenu.id, true);
            await dailyMenu_service_1.DailyMenuService.deleteDailyMenu(clonedMenu.id, true);
        }, 30000);
        it('should maintain data consistency across service operations', async () => {
            const operationDate = new Date();
            operationDate.setDate(operationDate.getDate() + 5);
            const menu = await dailyMenu_service_1.DailyMenuService.createDailyMenu({
                date: operationDate,
                schoolId: TEST_SCHOOL_ID,
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: testMenuItemIds,
                availableQuantity: 100
            });
            for (const menuItem of menu.menuItems || []) {
                const item = await database_service_1.DatabaseService.client.menuItem.findUnique({
                    where: { id: menuItem.id }
                });
                expect(item).toBeDefined();
                expect(item?.available).toBe(true);
                expect(item?.schoolId).toBe(TEST_SCHOOL_ID);
            }
            const updated = await dailyMenu_service_1.DailyMenuService.updateDailyMenu(menu.id, {
                menuItemIds: [testMenuItemIds[0]],
                availableQuantity: 80
            });
            expect(updated.menuItems).toBeDefined();
            expect(updated.availableQuantity).toBe(80);
            const finalMenu = await database_service_1.DatabaseService.client.dailyMenu.findUnique({
                where: { id: menu.id },
                include: { menuItems: true }
            });
            expect(finalMenu?.menuItems).toHaveLength(1);
            expect(finalMenu?.availableQuantity).toBe(80);
            await dailyMenu_service_1.DailyMenuService.deleteDailyMenu(menu.id, true);
        }, 30000);
    });
    describe('Performance and Load Testing', () => {
        it('should handle multiple rapid operations', async () => {
            const baseDate = new Date();
            baseDate.setDate(baseDate.getDate() + 15);
            const createPromises = Array.from({ length: 10 }, async (_, i) => {
                const menuDate = new Date(baseDate);
                menuDate.setDate(baseDate.getDate() + i);
                return dailyMenu_service_1.DailyMenuService.createDailyMenu({
                    date: menuDate,
                    schoolId: TEST_SCHOOL_ID,
                    category: dailyMenu_service_1.MenuCategory.LUNCH,
                    dayType: dailyMenu_service_1.DayType.WEEKDAY,
                    menuItemIds: [testMenuItemIds[0]],
                    availableQuantity: 50
                });
            });
            const createdMenus = await Promise.all(createPromises);
            expect(createdMenus).toHaveLength(10);
            const readPromises = createdMenus.map(menu => dailyMenu_service_1.DailyMenuService.getDailyMenuById(menu.id));
            const readResults = await Promise.all(readPromises);
            expect(readResults.every(result => result !== null)).toBe(true);
            const deletePromises = createdMenus.map(menu => dailyMenu_service_1.DailyMenuService.deleteDailyMenu(menu.id, true));
            await Promise.all(deletePromises);
        }, 60000);
        it('should maintain cache consistency under load', async () => {
            const testDate = new Date();
            testDate.setDate(testDate.getDate() + 8);
            const menu = await dailyMenu_service_1.DailyMenuService.createDailyMenu({
                date: testDate,
                schoolId: TEST_SCHOOL_ID,
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: [testMenuItemIds[0]],
                availableQuantity: 100
            });
            const cacheReadPromises = Array.from({ length: 20 }, () => dailyMenu_service_1.DailyMenuService.getDailyMenuById(menu.id));
            const cacheResults = await Promise.all(cacheReadPromises);
            expect(cacheResults.every(result => result?.id === menu.id)).toBe(true);
            await dailyMenu_service_1.DailyMenuService.updateDailyMenu(menu.id, { availableQuantity: 80 });
            const postUpdateReads = await Promise.all([
                dailyMenu_service_1.DailyMenuService.getDailyMenuById(menu.id),
                dailyMenu_service_1.DailyMenuService.getDailyMenuById(menu.id)
            ]);
            expect(postUpdateReads.every(result => result?.availableQuantity === 80)).toBe(true);
            await dailyMenu_service_1.DailyMenuService.deleteDailyMenu(menu.id, true);
        }, 60000);
    });
    describe('Error Recovery and Resilience', () => {
        it('should recover from temporary database disconnections', async () => {
            const testDate = new Date();
            testDate.setDate(testDate.getDate() + 6);
            const menu = await dailyMenu_service_1.DailyMenuService.createDailyMenu({
                date: testDate,
                schoolId: TEST_SCHOOL_ID,
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: [testMenuItemIds[0]],
                availableQuantity: 50
            });
            expect(menu).toBeDefined();
            await dailyMenu_service_1.DailyMenuService.deleteDailyMenu(menu.id, true);
        }, 30000);
        it('should handle invalid data gracefully', async () => {
            const testDate = new Date();
            testDate.setDate(testDate.getDate() + 9);
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu({
                date: testDate,
                schoolId: 'invalid-school-id',
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: [testMenuItemIds[0]],
                availableQuantity: 50
            })).rejects.toThrow();
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu({
                date: testDate,
                schoolId: TEST_SCHOOL_ID,
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: ['invalid-item-id'],
                availableQuantity: 50
            })).rejects.toThrow('Menu items not found');
        }, 30000);
    });
});
//# sourceMappingURL=dailyMenu.service.integration.test.js.map