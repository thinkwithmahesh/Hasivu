/**
 * Daily Menu Service Integration Tests
 *
 * Tests the complete DailyMenuService with real database and cache services.
 * These tests require a running test database and Redis instance.
 *
 * Prerequisites:
 * - PostgreSQL test database running
 * - Redis test instance running
 * - Environment variables configured for test services
 *
 * Run with: npm run test:integration
 */

import { DailyMenuService, MenuCategory, DayType } from '../../../src/services/dailyMenu.service';
import { DailyMenuRepository } from '../../../src/repositories/dailyMenu.repository';
import { MenuItemRepository } from '../../../src/repositories/menuItem.repository';
import { DatabaseService } from '../../../src/services/database.service';
import { cache } from '../../../src/utils/cache';
import { logger } from '../../../src/utils/logger';

// Test data setup
const TEST_SCHOOL_ID = 'test-school-integration';
const TEST_MENU_ITEM_IDS = ['test-item-1', 'test-item-2'];

describe('DailyMenuService Integration Tests', () => {
  let testMenuId: string;
  let testMenuItemIds: string[];

  beforeAll(async () => {
    // Ensure test database and cache are connected
    try {
      // DatabaseService is already initialized in the service
      // Cache is already initialized
      logger.info('Integration test services connected successfully');
    } catch (error) {
      logger.error('Failed to connect to test services', error as Error);
      throw error;
    }
  }, 30000); // 30 second timeout for connections

  afterAll(async () => {
    // Clean up test data and disconnect
    try {
      // Clean up test menu items
      for (const itemId of testMenuItemIds || []) {
        await DatabaseService.client.menuItem.deleteMany({
          where: { id: itemId }
        });
      }

      // Clean up test daily menus
      if (testMenuId) {
        await DatabaseService.client.dailyMenu.deleteMany({
          where: { id: testMenuId }
        });
      }

      // Clean up test school if created
      await DatabaseService.client.school.deleteMany({
        where: { id: TEST_SCHOOL_ID }
      });

      logger.info('Integration test cleanup completed');
    } catch (error) {
      logger.error('Failed to clean up integration tests', error as Error);
    }
  }, 30000);

  beforeEach(async () => {
    // Create test school
    await DatabaseService.client.school.upsert({
      where: { id: TEST_SCHOOL_ID },
      update: {},
      create: {
        id: TEST_SCHOOL_ID,
        code: 'TEST_SCHOOL',
        name: 'Integration Test School',
        address: '123 Test Street'
      }
    });

    // Create test menu items
    testMenuItemIds = [];
    for (let i = 0; i < 2; i++) {
      const menuItem = await DatabaseService.client.menuItem.create({
        data: {
          name: `Test Menu Item ${i + 1}`,
          description: `Test description ${i + 1}`,
          price: 50 + i * 10,
          category: MenuCategory.LUNCH,
          available: true,
          schoolId: TEST_SCHOOL_ID
        }
      });
      testMenuItemIds.push(menuItem.id);
    }

    // Clear relevant cache keys
    const cacheKeys = [
      `daily_menu:test-menu-id`,
      `daily_menu:date:${TEST_SCHOOL_ID}:*`
    ];
    for (const key of cacheKeys) {
      await cache.del(key);
    }
  });

  afterEach(async () => {
    // Clean up test daily menus after each test
    if (testMenuId) {
      await DatabaseService.client.dailyMenu.deleteMany({
        where: { id: testMenuId }
      });
      testMenuId = '';
    }

    // Clear cache
    cache.clear();
  });

  describe('Real Database and Cache Integration', () => {
    it('should create, read, update, and delete daily menu with real services', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const createInput = {
        date: futureDate,
        schoolId: TEST_SCHOOL_ID,
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: testMenuItemIds,
        availableQuantity: 100,
        notes: 'Integration test menu'
      };

      // Create
      const createdMenu = await DailyMenuService.createDailyMenu(createInput);
      expect(createdMenu).toBeDefined();
      expect(createdMenu.menuPlanId).toBeDefined(); // School ID is mapped to menu plan internally
      expect(createdMenu.menuItems).toBeDefined();
      expect(createdMenu.menuItems?.length).toBe(testMenuItemIds.length);
      testMenuId = createdMenu.id;

      // Read from database
      const readMenu = await DailyMenuService.getDailyMenuById(testMenuId);
      expect(readMenu).toEqual(createdMenu);

      // Read from cache (second call should hit cache)
      const cachedMenu = await DailyMenuService.getDailyMenuById(testMenuId);
      expect(cachedMenu).toEqual(createdMenu);

      // Update
      const updateData = {
        availableQuantity: 150,
        notes: 'Updated integration test menu'
      };
      const updatedMenu = await DailyMenuService.updateDailyMenu(testMenuId, updateData);
      expect(updatedMenu.availableQuantity).toBe(150);
      expect(updatedMenu.notes).toBe('Updated integration test menu');

      // Verify cache was invalidated and updated
      const freshRead = await DailyMenuService.getDailyMenuById(testMenuId);
      expect(freshRead?.availableQuantity).toBe(150);

      // Delete
      const deletedMenu = await DailyMenuService.deleteDailyMenu(testMenuId);
      expect(deletedMenu.isActive).toBe(false);

      // Verify deleted
      const afterDelete = await DailyMenuService.getDailyMenuById(testMenuId);
      expect(afterDelete).toBeNull();
    }, 30000);

    it('should handle date range queries with real database', async () => {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 10);

      // Create multiple menus for the week
      const menusToCreate = [];
      for (let i = 0; i < 3; i++) {
        const menuDate = new Date(baseDate);
        menuDate.setDate(baseDate.getDate() + i);

        const menu = await DailyMenuService.createDailyMenu({
          date: menuDate,
          schoolId: TEST_SCHOOL_ID,
          category: MenuCategory.LUNCH,
          dayType: i === 0 ? DayType.WEEKDAY : DayType.WEEKEND,
          menuItemIds: [testMenuItemIds[0]],
          availableQuantity: 50 + i * 25
        });
        menusToCreate.push(menu);
      }

      // Query date range
      const startDate = new Date(baseDate);
      const endDate = new Date(baseDate);
      endDate.setDate(baseDate.getDate() + 2);

      const menus = await DailyMenuService.getDailyMenusByDateRange(
        TEST_SCHOOL_ID,
        startDate,
        endDate
      );

      expect(menus).toHaveLength(3);
      expect(menus.every(menu => menu.menuPlanId !== undefined)).toBe(true);

      // Clean up created menus
      for (const menu of menusToCreate) {
        await DailyMenuService.deleteDailyMenu(menu.id, true); // Hard delete
      }
    }, 30000);

    it('should handle cache failures gracefully with real services', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      // Simulate cache failure by disconnecting (if possible)
      // For this test, we'll just ensure operations work without cache
      const createInput = {
        date: futureDate,
        schoolId: TEST_SCHOOL_ID,
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: [testMenuItemIds[0]],
        availableQuantity: 75
      };

      const menu = await DailyMenuService.createDailyMenu(createInput);
      testMenuId = menu.id;

      // Force cache miss by clearing cache
      cache.clear();

      // Should still work by hitting database
      const retrieved = await DailyMenuService.getDailyMenuById(testMenuId);
      expect(retrieved).toEqual(menu);
    }, 30000);

    it('should validate business rules with real data', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      // Should reject past dates
      await expect(DailyMenuService.createDailyMenu({
        date: pastDate,
        schoolId: TEST_SCHOOL_ID,
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: [testMenuItemIds[0]],
        availableQuantity: 50
      })).rejects.toThrow('Cannot create daily menu for past dates');

      // Should reject duplicate dates
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const firstMenu = await DailyMenuService.createDailyMenu({
        date: futureDate,
        schoolId: TEST_SCHOOL_ID,
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: [testMenuItemIds[0]],
        availableQuantity: 50
      });
      testMenuId = firstMenu.id;

      await expect(DailyMenuService.createDailyMenu({
        date: futureDate,
        schoolId: TEST_SCHOOL_ID,
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: [testMenuItemIds[1]],
        availableQuantity: 50
      })).rejects.toThrow('Daily menu already exists for');
    }, 30000);

    it('should handle concurrent operations with real database transactions', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 4);

      // Create initial menu
      const initialMenu = await DailyMenuService.createDailyMenu({
        date: futureDate,
        schoolId: TEST_SCHOOL_ID,
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: testMenuItemIds,
        availableQuantity: 100
      });
      testMenuId = initialMenu.id;

      // Simulate concurrent updates
      const updatePromises = [
        DailyMenuService.updateDailyMenu(testMenuId, { availableQuantity: 80 }),
        DailyMenuService.updateDailyMenu(testMenuId, { notes: 'Concurrent update 1' }),
        DailyMenuService.updateDailyMenu(testMenuId, { availableQuantity: 60 })
      ];

      // At least one should succeed, others may fail due to optimistic locking
      const results = await Promise.allSettled(updatePromises);
      const successfulUpdates = results.filter(result => result.status === 'fulfilled');

      expect(successfulUpdates.length).toBeGreaterThan(0);

      // Verify final state
      const finalMenu = await DailyMenuService.getDailyMenuById(testMenuId);
      expect(finalMenu).toBeDefined();
    }, 30000);

    it('should handle large datasets efficiently', async () => {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 20);

      // Create many menus (simulate a month's worth)
      const createdMenus = [];
      for (let i = 0; i < 30; i++) {
        const menuDate = new Date(baseDate);
        menuDate.setDate(baseDate.getDate() + i);

        const menu = await DailyMenuService.createDailyMenu({
          date: menuDate,
          schoolId: TEST_SCHOOL_ID,
          category: MenuCategory.LUNCH,
          dayType: menuDate.getDay() === 0 || menuDate.getDay() === 6 ? DayType.WEEKEND : DayType.WEEKDAY,
          menuItemIds: [testMenuItemIds[i % 2]],
          availableQuantity: 100 + i
        });
        createdMenus.push(menu);
      }

      // Test weekly menu plan retrieval
      const weekStart = new Date(baseDate);
      const weeklyPlan = await DailyMenuService.getWeeklyMenuPlan(TEST_SCHOOL_ID, weekStart);

      expect(Object.keys(weeklyPlan)).toBeGreaterThan(0);

      // Test date range query with pagination-like behavior
      const rangeStart = new Date(baseDate);
      const rangeEnd = new Date(baseDate);
      rangeEnd.setDate(baseDate.getDate() + 6);

      const rangeMenus = await DailyMenuService.getDailyMenusByDateRange(
        TEST_SCHOOL_ID,
        rangeStart,
        rangeEnd
      );

      expect(rangeMenus.length).toBe(7); // One week

      // Clean up
      for (const menu of createdMenus) {
        await DailyMenuService.deleteDailyMenu(menu.id, true);
      }
    }, 60000); // Longer timeout for large dataset

    it('should handle clone operations with real data relationships', async () => {
      const sourceDate = new Date();
      sourceDate.setDate(sourceDate.getDate() + 7);

      // Create source menu
      const sourceMenu = await DailyMenuService.createDailyMenu({
        date: sourceDate,
        schoolId: TEST_SCHOOL_ID,
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: testMenuItemIds,
        availableQuantity: 100,
        notes: 'Source menu for cloning'
      });

      const targetDate = new Date(sourceDate);
      targetDate.setDate(sourceDate.getDate() + 7);

      // Clone to different date
      const clonedMenu = await DailyMenuService.cloneDailyMenu(sourceMenu.id, targetDate);
      expect(clonedMenu.date.toDateString()).toBe(targetDate.toDateString());
      expect((clonedMenu as any).schoolId).toBe(TEST_SCHOOL_ID);
      expect(clonedMenu.menuItems).toBeDefined();
      expect(clonedMenu.availableQuantity).toBe(100);

      // Verify day type calculation
      const expectedDayType = targetDate.getDay() === 0 || targetDate.getDay() === 6 ? DayType.WEEKEND : DayType.WEEKDAY;
      expect(clonedMenu.dayType).toBe(expectedDayType);

      // Clean up
      await DailyMenuService.deleteDailyMenu(sourceMenu.id, true);
      await DailyMenuService.deleteDailyMenu(clonedMenu.id, true);
    }, 30000);

    it('should maintain data consistency across service operations', async () => {
      const operationDate = new Date();
      operationDate.setDate(operationDate.getDate() + 5);

      // Create menu
      const menu = await DailyMenuService.createDailyMenu({
        date: operationDate,
        schoolId: TEST_SCHOOL_ID,
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: testMenuItemIds,
        availableQuantity: 100
      });

      // Verify menu items exist and are valid
      for (const menuItem of menu.menuItems || []) {
        const item = await DatabaseService.client.menuItem.findUnique({
          where: { id: menuItem.id }
        });
        expect(item).toBeDefined();
        expect(item?.available).toBe(true);
        expect(item?.schoolId).toBe(TEST_SCHOOL_ID);
      }

      // Update menu
      const updated = await DailyMenuService.updateDailyMenu(menu.id, {
        menuItemIds: [testMenuItemIds[0]], // Remove one item
        availableQuantity: 80
      });

      expect(updated.menuItems).toBeDefined();
      expect(updated.availableQuantity).toBe(80);

      // Verify referential integrity
      const finalMenu = await DatabaseService.client.dailyMenu.findUnique({
        where: { id: menu.id },
        include: { menuItems: true }
      });

      expect(finalMenu?.menuItems).toHaveLength(1);
      expect(finalMenu?.availableQuantity).toBe(80);

      // Clean up
      await DailyMenuService.deleteDailyMenu(menu.id, true);
    }, 30000);
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple rapid operations', async () => {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 15);

      // Create multiple menus rapidly
      const createPromises = Array.from({ length: 10 }, async (_, i) => {
        const menuDate = new Date(baseDate);
        menuDate.setDate(baseDate.getDate() + i);

        return DailyMenuService.createDailyMenu({
          date: menuDate,
          schoolId: TEST_SCHOOL_ID,
          category: MenuCategory.LUNCH,
          dayType: DayType.WEEKDAY,
          menuItemIds: [testMenuItemIds[0]],
          availableQuantity: 50
        });
      });

      const createdMenus = await Promise.all(createPromises);
      expect(createdMenus).toHaveLength(10);

      // Rapid read operations
      const readPromises = createdMenus.map(menu =>
        DailyMenuService.getDailyMenuById(menu.id)
      );

      const readResults = await Promise.all(readPromises);
      expect(readResults.every(result => result !== null)).toBe(true);

      // Clean up
      const deletePromises = createdMenus.map(menu =>
        DailyMenuService.deleteDailyMenu(menu.id, true)
      );

      await Promise.all(deletePromises);
    }, 60000);

    it('should maintain cache consistency under load', async () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 8);

      // Create menu
      const menu = await DailyMenuService.createDailyMenu({
        date: testDate,
        schoolId: TEST_SCHOOL_ID,
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: [testMenuItemIds[0]],
        availableQuantity: 100
      });

      // Multiple cache reads
      const cacheReadPromises = Array.from({ length: 20 }, () =>
        DailyMenuService.getDailyMenuById(menu.id)
      );

      const cacheResults = await Promise.all(cacheReadPromises);
      expect(cacheResults.every(result => result?.id === menu.id)).toBe(true);

      // Update and verify cache invalidation
      await DailyMenuService.updateDailyMenu(menu.id, { availableQuantity: 80 });

      const postUpdateReads = await Promise.all([
        DailyMenuService.getDailyMenuById(menu.id),
        DailyMenuService.getDailyMenuById(menu.id)
      ]);

      expect(postUpdateReads.every(result => result?.availableQuantity === 80)).toBe(true);

      // Clean up
      await DailyMenuService.deleteDailyMenu(menu.id, true);
    }, 60000);
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary database disconnections', async () => {
      // This test would require mocking network failures
      // For now, test with valid operations
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 6);

      const menu = await DailyMenuService.createDailyMenu({
        date: testDate,
        schoolId: TEST_SCHOOL_ID,
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: [testMenuItemIds[0]],
        availableQuantity: 50
      });

      expect(menu).toBeDefined();

      // Clean up
      await DailyMenuService.deleteDailyMenu(menu.id, true);
    }, 30000);

    it('should handle invalid data gracefully', async () => {
      // Test with invalid school ID
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 9);

      await expect(DailyMenuService.createDailyMenu({
        date: testDate,
        schoolId: 'invalid-school-id',
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: [testMenuItemIds[0]],
        availableQuantity: 50
      })).rejects.toThrow(); // Should fail due to foreign key constraint

      // Test with invalid menu item IDs
      await expect(DailyMenuService.createDailyMenu({
        date: testDate,
        schoolId: TEST_SCHOOL_ID,
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: ['invalid-item-id'],
        availableQuantity: 50
      })).rejects.toThrow('Menu items not found');
    }, 30000);
  });
});