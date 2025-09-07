/**
 * Daily Menu Service Test Suite
 * Comprehensive tests for Epic 2: Daily Menu Planning and Scheduling
 * Tests cover all service methods with edge cases and error scenarios
 */

import { DailyMenuService, MenuCategory, DayType } from '../../../src/services/dailyMenu.service';
import { DailyMenuRepository } from '../../../src/repositories/dailyMenu.repository';
import { MenuItemRepository } from '../../../src/repositories/menuItem.repository';
import { cache } from '../../../src/utils/cache';
import { logger } from '../../../src/utils/logger';

// Using actual enums imported from service

// Mock dependencies
jest.mock('../../../src/repositories/dailyMenu.repository');
jest.mock('../../../src/repositories/menuItem.repository');
jest.mock('../../../src/utils/cache');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/services/database.service', () => ({
  DatabaseService: {
    client: {},
    getInstance: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    getHealth: jest.fn(),
    isConnected: jest.fn()
  }
}));

const MockedDailyMenuRepository = jest.mocked(DailyMenuRepository);
const MockedMenuItemRepository = jest.mocked(MenuItemRepository);
const MockedCache = jest.mocked(cache);

describe('DailyMenuService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDailyMenu', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
    
    const validInput = {
      date: futureDate,
      schoolId: 'school-123',
      category: MenuCategory.LUNCH,
      dayType: DayType.WEEKDAY,
      menuItemIds: ['item-1', 'item-2'],
      availableQuantity: 100,
      notes: 'Special menu for future date'
    };

    const mockMenuItems = [
      {
        id: 'item-1',
        name: 'Pizza',
        category: MenuCategory.LUNCH,
        available: true
      },
      {
        id: 'item-2',
        name: 'Pasta',
        category: MenuCategory.LUNCH,
        available: true
      }
    ];

    it('should create daily menu successfully', async () => {
      const mockDailyMenu = {
        id: 'daily-menu-123',
        ...validInput,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(null);
      MockedMenuItemRepository.findById
        .mockResolvedValueOnce(mockMenuItems[0] as any)
        .mockResolvedValueOnce(mockMenuItems[1] as any);
      MockedDailyMenuRepository.create.mockResolvedValue(mockDailyMenu as any);
      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(mockDailyMenu as any);

      const result = await DailyMenuService.createDailyMenu(validInput);

      expect(result).toEqual(mockDailyMenu);
      expect(MockedDailyMenuRepository.findByDateRange).toHaveBeenCalledWith(
        validInput.date,
        validInput.date,
        validInput.schoolId
      );
      expect(MockedDailyMenuRepository.create).toHaveBeenCalled();
    });

    it('should throw error for duplicate daily menu', async () => {
      const existingMenu = { id: 'existing-123', date: validInput.date };
      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(existingMenu as any);

      const dateStr = futureDate.toISOString().split('T')[0];
      await expect(DailyMenuService.createDailyMenu(validInput))
        .rejects.toThrow(`Daily menu already exists for ${dateStr}`);
    });

    it('should validate required fields', async () => {
      const invalidInput = { ...validInput, date: null as any };

      await expect(DailyMenuService.createDailyMenu(invalidInput))
        .rejects.toThrow('Date is required');
    });

    it('should validate school ID is required', async () => {
      const invalidInput = { ...validInput, schoolId: '' };

      await expect(DailyMenuService.createDailyMenu(invalidInput))
        .rejects.toThrow('School ID is required');
    });

    it('should validate at least one menu item is required', async () => {
      const invalidInput = { ...validInput, menuItemIds: [] };

      await expect(DailyMenuService.createDailyMenu(invalidInput))
        .rejects.toThrow('At least one menu item is required');
    });

    it('should validate maximum items per menu', async () => {
      const invalidInput = {
        ...validInput,
        menuItemIds: Array.from({ length: 51 }, (_, i) => `item-${i}`)
      };

      await expect(DailyMenuService.createDailyMenu(invalidInput))
        .rejects.toThrow('Cannot add more than 50 items to a daily menu');
    });

    it('should validate menu items exist', async () => {
      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(null);
      MockedMenuItemRepository.findById
        .mockResolvedValueOnce(mockMenuItems[0] as any)
        .mockResolvedValueOnce(null);

      await expect(DailyMenuService.createDailyMenu(validInput))
        .rejects.toThrow('Menu items not found: item-2');
    });

    it('should validate menu items are available', async () => {
      const unavailableItem = { ...mockMenuItems[1], available: false };
      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(null);
      MockedMenuItemRepository.findById
        .mockResolvedValueOnce(mockMenuItems[0] as any)
        .mockResolvedValueOnce(unavailableItem as any);

      await expect(DailyMenuService.createDailyMenu(validInput))
        .rejects.toThrow('Menu items unavailable or wrong category: item-2');
    });

    it('should validate menu items have correct category', async () => {
      const wrongCategoryItem = { ...mockMenuItems[1], category: MenuCategory.DESSERT };
      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(null);
      MockedMenuItemRepository.findById
        .mockResolvedValueOnce(mockMenuItems[0] as any)
        .mockResolvedValueOnce(wrongCategoryItem as any);

      await expect(DailyMenuService.createDailyMenu(validInput))
        .rejects.toThrow('Menu items unavailable or wrong category: item-2');
    });

    it('should not allow creating daily menu for past dates', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const invalidInput = { ...validInput, date: pastDate };

      await expect(DailyMenuService.createDailyMenu(invalidInput))
        .rejects.toThrow('Cannot create daily menu for past dates');
    });

    it('should allow creating daily menu for today', async () => {
      const today = new Date();
      const todayInput = { ...validInput, date: today };

      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(null);
      MockedMenuItemRepository.findById
        .mockResolvedValueOnce(mockMenuItems[0] as any)
        .mockResolvedValueOnce(mockMenuItems[1] as any);
      MockedDailyMenuRepository.create.mockResolvedValue({ id: 'menu-123' } as any);
      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue({ id: 'menu-123' } as any);

      const result = await DailyMenuService.createDailyMenu(todayInput);

      expect(result).toBeDefined();
    });

    it('should validate available quantity is not negative', async () => {
      const invalidInput = { ...validInput, availableQuantity: -10 };

      await expect(DailyMenuService.createDailyMenu(invalidInput))
        .rejects.toThrow('Available quantity cannot be negative');
    });
  });

  describe('getDailyMenuById', () => {
    it('should return cached daily menu', async () => {
      const mockMenu = { id: 'menu-123', date: new Date() };
      const serializedMenu = JSON.stringify(mockMenu);
      MockedCache.get.mockResolvedValue(serializedMenu);

      const result = await DailyMenuService.getDailyMenuById('menu-123');
      const expectedResult = JSON.parse(serializedMenu);

      expect(result).toEqual(expectedResult);
      expect(MockedCache.get).toHaveBeenCalledWith('daily_menu:menu-123');
      expect(MockedDailyMenuRepository.findByIdWithItems).not.toHaveBeenCalled();
    });

    it('should fetch and cache daily menu when not cached', async () => {
      const mockMenu = { id: 'menu-123', date: new Date() };
      MockedCache.get.mockResolvedValue(null);
      MockedDailyMenuRepository.findByIdWithItems.mockResolvedValue(mockMenu as any);

      const result = await DailyMenuService.getDailyMenuById('menu-123');

      expect(result).toEqual(mockMenu);
      expect(MockedDailyMenuRepository.findByIdWithItems).toHaveBeenCalledWith('menu-123');
      expect(MockedCache.setex).toHaveBeenCalledWith(
        'daily_menu:menu-123',
        600,
        JSON.stringify(mockMenu)
      );
    });

    it('should return null for non-existent daily menu', async () => {
      MockedCache.get.mockResolvedValue(null);
      MockedDailyMenuRepository.findByIdWithItems.mockResolvedValue(null);

      const result = await DailyMenuService.getDailyMenuById('nonexistent');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith('Daily menu not found', { dailyMenuId: 'nonexistent' });
    });
  });

  describe('getDailyMenusByDateRange', () => {
    const startDate = new Date('2024-01-15');
    const endDate = new Date('2024-01-21');
    const schoolId = 'school-123';

    it('should get daily menus for date range', async () => {
      const mockMenus = [
        { id: 'menu-1', date: new Date('2024-01-15') },
        { id: 'menu-2', date: new Date('2024-01-16') }
      ];
      MockedDailyMenuRepository.findManyWithItems.mockResolvedValue(mockMenus as any);

      const result = await DailyMenuService.getDailyMenusByDateRange(schoolId, startDate, endDate);

      expect(result).toEqual(mockMenus);
      expect(MockedDailyMenuRepository.findManyWithItems).toHaveBeenCalledWith({
        schoolId,
        dateFrom: startDate,
        dateTo: endDate,
        isActive: true
      });
    });

    it('should filter by category when provided', async () => {
      const mockMenus = [{ id: 'menu-1', category: MenuCategory.LUNCH }];
      MockedDailyMenuRepository.findManyWithItems.mockResolvedValue(mockMenus as any);

      await DailyMenuService.getDailyMenusByDateRange(
        schoolId,
        startDate,
        endDate,
        MenuCategory.LUNCH
      );

      expect(MockedDailyMenuRepository.findManyWithItems).toHaveBeenCalledWith({
        schoolId,
        dateFrom: startDate,
        dateTo: endDate,
        isActive: true,
        category: MenuCategory.LUNCH
      });
    });
  });

  describe('getDailyMenuByDate', () => {
    const date = new Date('2024-01-15');
    const schoolId = 'school-123';

    it('should return cached daily menu for date', async () => {
      const mockMenus = [{ id: 'menu-123', date }];
      const cacheKey = 'daily_menu:date:school-123:2024-01-15:all';
      const serializedMenus = JSON.stringify(mockMenus);
      MockedCache.get.mockResolvedValue(serializedMenus);

      const result = await DailyMenuService.getDailyMenuByDate(schoolId, date);
      const expectedResult = JSON.parse(serializedMenus);

      expect(result).toEqual(expectedResult);
      expect(MockedCache.get).toHaveBeenCalledWith(cacheKey);
    });

    it('should fetch and cache daily menu for date when not cached', async () => {
      const mockMenus = [{ id: 'menu-123', date }];
      MockedCache.get.mockResolvedValue(null);
      MockedDailyMenuRepository.findManyWithItems.mockResolvedValue(mockMenus as any);

      const result = await DailyMenuService.getDailyMenuByDate(schoolId, date);

      expect(result).toEqual(mockMenus);
      expect(MockedDailyMenuRepository.findManyWithItems).toHaveBeenCalledWith({
        schoolId,
        dateFrom: date,
        dateTo: date,
        isActive: true
      });
    });

    it('should filter by category when provided', async () => {
      const mockMenus = [{ id: 'menu-123', category: MenuCategory.DESSERT }];
      const cacheKey = 'daily_menu:date:school-123:2024-01-15:DESSERT';
      MockedCache.get.mockResolvedValue(null);
      MockedDailyMenuRepository.findManyWithItems.mockResolvedValue(mockMenus as any);

      await DailyMenuService.getDailyMenuByDate(schoolId, date, MenuCategory.DESSERT);

      expect(MockedCache.get).toHaveBeenCalledWith(cacheKey);
      expect(MockedDailyMenuRepository.findManyWithItems).toHaveBeenCalledWith({
        schoolId,
        dateFrom: date,
        dateTo: date,
        isActive: true,
        category: MenuCategory.DESSERT
      });
    });
  });

  describe('updateDailyMenu', () => {
    const updateInput = {
      menuItemIds: ['item-3', 'item-4'],
      availableQuantity: 150,
      notes: 'Updated notes',
      isActive: false
    };

    it('should update daily menu successfully', async () => {
      const existingMenu = {
        id: 'menu-123',
        schoolId: 'school-123',
        date: new Date('2024-01-15'),
        category: MenuCategory.LUNCH
      };
      const updatedMenu = { ...existingMenu, ...updateInput };
      const menuItems = [
        { id: 'item-3', available: true, category: MenuCategory.LUNCH },
        { id: 'item-4', available: true, category: MenuCategory.LUNCH }
      ];

      MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu as any);
      MockedMenuItemRepository.findById
        .mockResolvedValueOnce(menuItems[0] as any)
        .mockResolvedValueOnce(menuItems[1] as any);
      MockedDailyMenuRepository.update.mockResolvedValue(updatedMenu as any);
      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(updatedMenu as any);

      const result = await DailyMenuService.updateDailyMenu('menu-123', updateInput);

      expect(result).toEqual(updatedMenu);
      expect(MockedDailyMenuRepository.update).toHaveBeenCalled();
    });

    it('should throw error for non-existent daily menu', async () => {
      MockedDailyMenuRepository.findById.mockResolvedValue(null);

      await expect(DailyMenuService.updateDailyMenu('nonexistent', updateInput))
        .rejects.toThrow('Daily menu with ID nonexistent not found');
    });

    it('should validate menu items when updating', async () => {
      const existingMenu = { id: 'menu-123', category: MenuCategory.LUNCH };
      MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu as any);
      MockedMenuItemRepository.findById
        .mockResolvedValueOnce({ id: 'item-3', available: true, category: MenuCategory.LUNCH } as any)
        .mockResolvedValueOnce(null);

      await expect(DailyMenuService.updateDailyMenu('menu-123', updateInput))
        .rejects.toThrow('Menu items not found: item-4');
    });

    it('should validate maximum items per menu when updating', async () => {
      const existingMenu = { id: 'menu-123' };
      const tooManyItems = {
        menuItemIds: Array.from({ length: 51 }, (_, i) => `item-${i}`)
      };
      MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu as any);

      await expect(DailyMenuService.updateDailyMenu('menu-123', tooManyItems))
        .rejects.toThrow('Cannot add more than 50 items to a daily menu');
    });

    it('should update without menu items', async () => {
      const existingMenu = { id: 'menu-123', schoolId: 'school-123', date: new Date(), category: MenuCategory.LUNCH };
      const updateWithoutItems = { notes: 'New notes', availableQuantity: 200 };
      const updatedMenu = { ...existingMenu, ...updateWithoutItems };

      MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu as any);
      MockedDailyMenuRepository.update.mockResolvedValue(updatedMenu as any);
      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(updatedMenu as any);

      const result = await DailyMenuService.updateDailyMenu('menu-123', updateWithoutItems);

      expect(result).toEqual(updatedMenu);
    });
  });

  describe('deleteDailyMenu', () => {
    it('should soft delete daily menu by default', async () => {
      const existingMenu = {
        id: 'menu-123',
        schoolId: 'school-123',
        date: new Date('2024-01-15'),
        category: MenuCategory.LUNCH
      };
      const deletedMenu = { ...existingMenu, isActive: false };

      MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu as any);
      MockedDailyMenuRepository.update.mockResolvedValue(deletedMenu as any);

      const result = await DailyMenuService.deleteDailyMenu('menu-123');

      expect(result).toEqual(deletedMenu);
      expect(MockedDailyMenuRepository.update).toHaveBeenCalledWith(
        'menu-123',
        { isActive: false }
      );
    });

    it('should hard delete when specified', async () => {
      const existingMenu = { id: 'menu-123', schoolId: 'school-123', date: new Date(), category: MenuCategory.LUNCH };
      MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu as any);
      MockedDailyMenuRepository.delete.mockResolvedValue(existingMenu as any);

      const result = await DailyMenuService.deleteDailyMenu('menu-123', true);

      expect(result).toEqual(existingMenu);
      expect(MockedDailyMenuRepository.delete).toHaveBeenCalledWith('menu-123');
    });

    it('should throw error for non-existent daily menu', async () => {
      MockedDailyMenuRepository.findById.mockResolvedValue(null);

      await expect(DailyMenuService.deleteDailyMenu('nonexistent'))
        .rejects.toThrow('Daily menu with ID nonexistent not found');
    });
  });

  describe('cloneDailyMenu', () => {
    const targetDate = new Date('2024-01-20');

    it('should clone daily menu successfully', async () => {
      const sourceMenu = {
        id: 'source-123',
        schoolId: 'school-123',
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        availableQuantity: 100,
        notes: 'Original notes',
        metadata: JSON.stringify({ special: true }),
        menuItems: [{ id: 'item-1' }, { id: 'item-2' }]
      };
      const clonedMenu = { id: 'cloned-123', date: targetDate };

      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(sourceMenu as any);
      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(null);
      jest.spyOn(DailyMenuService, 'createDailyMenu').mockResolvedValue(clonedMenu as any);

      const result = await DailyMenuService.cloneDailyMenu('source-123', targetDate);

      expect(result).toEqual(clonedMenu);
      expect(DailyMenuService.createDailyMenu).toHaveBeenCalledWith({
        date: targetDate,
        schoolId: 'school-123',
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKEND, // Saturday
        menuItemIds: ['item-1', 'item-2'],
        availableQuantity: 100,
        notes: 'Original notes',
        metadata: { special: true }
      });
    });

    it('should clone to different school when specified', async () => {
      const sourceMenu = {
        id: 'source-123',
        schoolId: 'school-123',
        category: MenuCategory.LUNCH,
        menuItems: []
      };
      const clonedMenu = { id: 'cloned-123' };

      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(sourceMenu as any);
      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(null);
      jest.spyOn(DailyMenuService, 'createDailyMenu').mockResolvedValue(clonedMenu as any);

      await DailyMenuService.cloneDailyMenu('source-123', targetDate, 'school-456');

      expect(DailyMenuService.createDailyMenu).toHaveBeenCalledWith(
        expect.objectContaining({ schoolId: 'school-456' })
      );
    });

    it('should throw error for non-existent source menu', async () => {
      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(null);

      await expect(DailyMenuService.cloneDailyMenu('nonexistent', targetDate))
        .rejects.toThrow('Source daily menu with ID nonexistent not found');
    });

    it('should throw error when target date already has menu', async () => {
      const sourceMenu = { id: 'source-123', schoolId: 'school-123', category: MenuCategory.LUNCH };
      const existingMenu = { id: 'existing-123' };

      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(sourceMenu as any);
      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(existingMenu as any);

      await expect(DailyMenuService.cloneDailyMenu('source-123', targetDate))
        .rejects.toThrow('Daily menu already exists for 2024-01-20');
    });

    it('should handle menu with no items', async () => {
      const sourceMenu = {
        id: 'source-123',
        schoolId: 'school-123',
        category: MenuCategory.LUNCH,
        menuItems: null
      };
      const clonedMenu = { id: 'cloned-123' };

      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(sourceMenu as any);
      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(null);
      jest.spyOn(DailyMenuService, 'createDailyMenu').mockResolvedValue(clonedMenu as any);

      await DailyMenuService.cloneDailyMenu('source-123', targetDate);

      expect(DailyMenuService.createDailyMenu).toHaveBeenCalledWith(
        expect.objectContaining({ menuItemIds: [] })
      );
    });
  });

  describe('getWeeklyMenuPlan', () => {
    const startDate = new Date('2024-01-15'); // Monday
    const schoolId = 'school-123';

    it('should get weekly menu plan grouped by date', async () => {
      const mockMenus = [
        { id: 'menu-1', date: new Date('2024-01-15'), category: MenuCategory.LUNCH },
        { id: 'menu-2', date: new Date('2024-01-15'), category: MenuCategory.DESSERT },
        { id: 'menu-3', date: new Date('2024-01-16'), category: MenuCategory.LUNCH }
      ];
      jest.spyOn(DailyMenuService, 'getDailyMenusByDateRange').mockResolvedValue(mockMenus as any);

      const result = await DailyMenuService.getWeeklyMenuPlan(schoolId, startDate);

      expect(result).toEqual({
        '2024-01-15': [mockMenus[0], mockMenus[1]],
        '2024-01-16': [mockMenus[2]]
      });
      expect(DailyMenuService.getDailyMenusByDateRange).toHaveBeenCalledWith(
        schoolId,
        startDate,
        new Date('2024-01-21') // Sunday
      );
    });

    it('should handle empty menu plan', async () => {
      jest.spyOn(DailyMenuService, 'getDailyMenusByDateRange').mockResolvedValue([]);

      const result = await DailyMenuService.getWeeklyMenuPlan(schoolId, startDate);

      expect(result).toEqual({});
    });
  });

  describe('getDayTypeFromDate', () => {
    it('should return WEEKDAY for Monday to Friday', async () => {
      const monday = new Date('2024-01-15'); // Monday
      const friday = new Date('2024-01-19'); // Friday

      // Test through cloneDailyMenu which uses this private method
      const sourceMenu = { id: 'source-123', schoolId: 'school-123', category: MenuCategory.LUNCH, menuItems: [] };
      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(sourceMenu as any);
      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(null);
      jest.spyOn(DailyMenuService, 'createDailyMenu').mockResolvedValue({ id: 'cloned' } as any);

      await DailyMenuService.cloneDailyMenu('source-123', monday);
      expect(DailyMenuService.createDailyMenu).toHaveBeenCalledWith(
        expect.objectContaining({ dayType: DayType.WEEKDAY })
      );

      await DailyMenuService.cloneDailyMenu('source-123', friday);
      expect(DailyMenuService.createDailyMenu).toHaveBeenCalledWith(
        expect.objectContaining({ dayType: DayType.WEEKDAY })
      );
    });

    it('should return WEEKEND for Saturday and Sunday', async () => {
      const saturday = new Date('2024-01-20'); // Saturday
      const sunday = new Date('2024-01-21'); // Sunday

      const sourceMenu = { id: 'source-123', schoolId: 'school-123', category: MenuCategory.LUNCH, menuItems: [] };
      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(sourceMenu as any);
      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(null);
      jest.spyOn(DailyMenuService, 'createDailyMenu').mockResolvedValue({ id: 'cloned' } as any);

      await DailyMenuService.cloneDailyMenu('source-123', saturday);
      expect(DailyMenuService.createDailyMenu).toHaveBeenCalledWith(
        expect.objectContaining({ dayType: DayType.WEEKEND })
      );

      await DailyMenuService.cloneDailyMenu('source-123', sunday);
      expect(DailyMenuService.createDailyMenu).toHaveBeenCalledWith(
        expect.objectContaining({ dayType: DayType.WEEKEND })
      );
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const error = new Error('Database connection failed');
      MockedDailyMenuRepository.findByIdWithItems.mockRejectedValue(error);

      await expect(DailyMenuService.getDailyMenuById('menu-123'))
        .rejects.toThrow('Database connection failed');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get daily menu by ID',
        error,
        { dailyMenuId: 'menu-123' }
      );
    });

    it('should handle cache errors gracefully', async () => {
      const cacheError = new Error('Redis connection failed');
      MockedCache.get.mockRejectedValue(cacheError);
      MockedDailyMenuRepository.findByIdWithItems.mockResolvedValue({ id: 'menu-123' } as any);

      // Should continue operation and fall back to repository
      const result = await DailyMenuService.getDailyMenuById('menu-123');

      expect(result).toEqual({ id: 'menu-123' });
      expect(MockedDailyMenuRepository.findByIdWithItems).toHaveBeenCalled();
    });
  });

  describe('cache management', () => {
    it('should clear relevant caches after create', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const validInput = {
        date: futureDate,
        schoolId: 'school-123',
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: ['item-1']
      };
      const mockMenuItem = { id: 'item-1', available: true, category: MenuCategory.LUNCH };
      const mockDailyMenu = { id: 'menu-123', ...validInput };

      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(null);
      MockedMenuItemRepository.findById.mockResolvedValue(mockMenuItem as any);
      MockedDailyMenuRepository.create.mockResolvedValue(mockDailyMenu as any);
      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(mockDailyMenu as any);
      MockedCache.clear = jest.fn().mockResolvedValue(true);

      await DailyMenuService.createDailyMenu(validInput);

      // Verify cache was cleared after creation
      expect(MockedCache.clear).toHaveBeenCalled();
    });

    it('should clear caches after update', async () => {
      const existingMenu = {
        id: 'menu-123',
        schoolId: 'school-123',
        date: new Date('2024-01-15'),
        category: MenuCategory.LUNCH
      };
      MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu as any);
      MockedDailyMenuRepository.update.mockResolvedValue(existingMenu as any);
      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(existingMenu as any);

      await DailyMenuService.updateDailyMenu('menu-123', { notes: 'Updated' });

      expect(MockedCache.del).toHaveBeenCalledWith('daily_menu:menu-123');
    });

    it('should clear caches after delete', async () => {
      const existingMenu = {
        id: 'menu-123',
        schoolId: 'school-123',
        date: new Date('2024-01-15'),
        category: MenuCategory.LUNCH
      };
      MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu as any);
      MockedDailyMenuRepository.update.mockResolvedValue(existingMenu as any);

      await DailyMenuService.deleteDailyMenu('menu-123');

      expect(MockedCache.del).toHaveBeenCalledWith('daily_menu:menu-123');
    });
  });

  describe('cache failures should not break functionality', () => {
    it('should continue operation when cache clear fails', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      
      const validInput = {
        date: futureDate,
        schoolId: 'school-123',
        category: MenuCategory.LUNCH,
        dayType: DayType.WEEKDAY,
        menuItemIds: ['item-1']
      };
      const mockMenuItem = { id: 'item-1', available: true, category: MenuCategory.LUNCH };
      const mockDailyMenu = { id: 'menu-123', ...validInput };

      MockedDailyMenuRepository.findByDateRange.mockResolvedValue(null);
      MockedMenuItemRepository.findById.mockResolvedValue(mockMenuItem as any);
      MockedDailyMenuRepository.create.mockResolvedValue(mockDailyMenu as any);
      jest.spyOn(DailyMenuService, 'getDailyMenuById').mockResolvedValue(mockDailyMenu as any);
      MockedCache.clear.mockRejectedValue(new Error('Cache service down'));

      const result = await DailyMenuService.createDailyMenu(validInput);

      expect(result).toEqual(mockDailyMenu);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to clear caches',
        expect.any(Error),
        expect.objectContaining({ schoolId: 'school-123' })
      );
    });
  });
});