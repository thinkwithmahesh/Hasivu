/**
 * Daily Menu Service Test Suite - FIXED VERSION
 * Comprehensive tests with proper mock configuration
 */

// Import test utilities first
import {
  MockedDailyMenuRepository,
  MockedMenuItemRepository,
  MockedCacheService,
  MockedLogger,
  resetAllMocks
} from '../../mocks/repository.mock';

// Then import the service under test
import { DailyMenuService, MenuCategory, DayType } from '../../../src/services/dailyMenu.service';

// Mock the dependencies BEFORE importing service
jest.mock('../../../src/repositories/dailyMenu.repository', () => ({
  DailyMenuRepository: require('../../mocks/repository.mock').MockedDailyMenuRepository
}));

jest.mock('../../../src/repositories/menuItem.repository', () => ({
  MenuItemRepository: require('../../mocks/repository.mock').MockedMenuItemRepository
}));

jest.mock('../../../src/utils/cache', () => ({
  cache: require('../../mocks/repository.mock').MockedCacheService
}));

jest.mock('../../../src/utils/logger', () => ({
  logger: require('../../mocks/repository.mock').MockedLogger
}));

describe('DailyMenuService - FIXED', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('createDailyMenu', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const validInput = {
      date: futureDate,
      schoolId: 'school-123',
      category: MenuCategory.LUNCH,
      dayType: DayType.WEEKDAY,
      menuItemIds: ['item-1', 'item-2'],
      availableQuantity: 100,
      notes: 'Special menu'
    };

    const mockMenuItems = [
      { id: 'item-1', name: 'Pizza', category: MenuCategory.LUNCH, available: true },
      { id: 'item-2', name: 'Pasta', category: MenuCategory.LUNCH, available: true }
    ];

    it('should create daily menu successfully', async () => {
      const mockDailyMenu = {
        id: 'daily-menu-123',
        ...validInput,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Setup mocks with proper type assertions
      (MockedDailyMenuRepository.findByDateRange as jest.Mock).mockResolvedValue([]);
      (MockedMenuItemRepository.findById as jest.Mock)
        .mockResolvedValueOnce(mockMenuItems[0])
        .mockResolvedValueOnce(mockMenuItems[1]);
      (MockedDailyMenuRepository.create as jest.Mock).mockResolvedValue(mockDailyMenu);
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

    it('should not allow creating daily menu for past dates', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const invalidInput = { ...validInput, date: pastDate };

      await expect(DailyMenuService.createDailyMenu(invalidInput))
        .rejects.toThrow('Cannot create daily menu for past dates');
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
      (MockedCacheService.get as jest.Mock).mockResolvedValue(serializedMenu);

      const result = await DailyMenuService.getDailyMenuById('menu-123');
      const expectedResult = JSON.parse(serializedMenu);

      expect(result).toEqual(expectedResult);
      expect(MockedCacheService.get).toHaveBeenCalledWith('daily_menu:menu-123');
      expect(MockedDailyMenuRepository.findByIdWithItems).not.toHaveBeenCalled();
    });

    it('should fetch and cache daily menu when not cached', async () => {
      const mockMenu = { id: 'menu-123', date: new Date() };
      (MockedCacheService.get as jest.Mock).mockResolvedValue(null);
      (MockedDailyMenuRepository.findByIdWithItems as jest.Mock).mockResolvedValue(mockMenu);

      const result = await DailyMenuService.getDailyMenuById('menu-123');

      expect(result).toEqual(mockMenu);
      expect(MockedDailyMenuRepository.findByIdWithItems).toHaveBeenCalledWith('menu-123');
      expect(MockedCacheService.set).toHaveBeenCalled();
    });

    it('should return null for non-existent daily menu', async () => {
      (MockedCacheService.get as jest.Mock).mockResolvedValue(null);
      (MockedDailyMenuRepository.findByIdWithItems as jest.Mock).mockResolvedValue(null);

      const result = await DailyMenuService.getDailyMenuById('nonexistent');

      expect(result).toBeNull();
      expect(MockedLogger.warn).toHaveBeenCalled();
    });
  });
});
