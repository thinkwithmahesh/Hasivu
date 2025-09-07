/**
 * Menu Item Service Test Suite
 * Comprehensive tests for Epic 2: Menu Management System
 * Tests cover all service methods with edge cases and error scenarios
 */

import { MenuItemService, MenuCategory } from '../../../src/services/menuItem.service';
import { MenuItemRepository } from '../../../src/repositories/menuItem.repository';
import { cache } from '../../../src/utils/cache';
import { logger } from '../../../src/utils/logger';

// Mock dependencies
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

const MockedMenuItemRepository = jest.mocked(MenuItemRepository);
const MockedCache = jest.mocked(cache);

describe('MenuItemService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMenuItem', () => {
    const validInput = {
      name: 'Pizza Margherita',
      description: 'Classic pizza with tomato and mozzarella',
      category: MenuCategory.LUNCH,
      price: 12.99,
      currency: 'INR',
      schoolId: 'school-123'
    };

    it('should create menu item successfully', async () => {
      const mockMenuItem = {
        id: 'item-123',
        ...validInput,
        available: true,
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      MockedMenuItemRepository.findByNameAndSchool.mockResolvedValue(null);
      MockedMenuItemRepository.create.mockResolvedValue(mockMenuItem as any);

      const result = await MenuItemService.createMenuItem(validInput);

      expect(result).toEqual(mockMenuItem);
      expect(MockedMenuItemRepository.findByNameAndSchool).toHaveBeenCalledWith(
        'Pizza Margherita',
        'school-123'
      );
      expect(MockedMenuItemRepository.create).toHaveBeenCalled();
    });

    it('should throw error for duplicate menu item name in same school', async () => {
      const existingItem = { id: 'existing-123', name: 'Pizza Margherita' };
      MockedMenuItemRepository.findByNameAndSchool.mockResolvedValue(existingItem as any);

      await expect(MenuItemService.createMenuItem(validInput))
        .rejects.toThrow('Menu item with name "Pizza Margherita" already exists for this school');
    });

    it('should validate required fields', async () => {
      const invalidInput = { ...validInput, name: '' };

      await expect(MenuItemService.createMenuItem(invalidInput))
        .rejects.toThrow('Menu item name is required');
    });

    it('should validate price is positive', async () => {
      const invalidInput = { ...validInput, price: -5 };

      await expect(MenuItemService.createMenuItem(invalidInput))
        .rejects.toThrow('Menu item price must be greater than 0');
    });

    it('should validate original price is greater than current price', async () => {
      const invalidInput = { ...validInput, originalPrice: 10 };

      await expect(MenuItemService.createMenuItem(invalidInput))
        .rejects.toThrow('Original price must be greater than current price');
    });

    it('should validate name length limit', async () => {
      const invalidInput = { ...validInput, name: 'A'.repeat(201) };

      await expect(MenuItemService.createMenuItem(invalidInput))
        .rejects.toThrow('Menu item name cannot exceed 200 characters');
    });

    it('should validate description length limit', async () => {
      const invalidInput = { ...validInput, description: 'A'.repeat(1001) };

      await expect(MenuItemService.createMenuItem(invalidInput))
        .rejects.toThrow('Menu item description cannot exceed 1000 characters');
    });
  });

  describe('getMenuItemById', () => {
    it('should return cached menu item', async () => {
      const mockMenuItem = { id: 'item-123', name: 'Pizza' };
      MockedCache.get.mockResolvedValue(JSON.stringify(mockMenuItem));

      const result = await MenuItemService.getMenuItemById('item-123');

      expect(result).toEqual(mockMenuItem);
      expect(MockedCache.get).toHaveBeenCalledWith('menu_item:item-123:true');
      expect(MockedMenuItemRepository.findById).not.toHaveBeenCalled();
    });

    it('should fetch and cache menu item when not cached', async () => {
      const mockMenuItem = { id: 'item-123', name: 'Pizza' };
      MockedCache.get.mockResolvedValue(null);
      MockedMenuItemRepository.findById.mockResolvedValue(mockMenuItem as any);

      const result = await MenuItemService.getMenuItemById('item-123');

      expect(result).toEqual(mockMenuItem);
      expect(MockedMenuItemRepository.findById).toHaveBeenCalledWith('item-123', true);
      expect(MockedCache.setex).toHaveBeenCalledWith(
        'menu_item:item-123:true',
        300,
        JSON.stringify(mockMenuItem)
      );
    });

    it('should return null for non-existent menu item', async () => {
      MockedCache.get.mockResolvedValue(null);
      MockedMenuItemRepository.findById.mockResolvedValue(null);

      const result = await MenuItemService.getMenuItemById('nonexistent');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith('Menu item not found', { menuItemId: 'nonexistent' });
    });
  });

  describe('getMenuItems', () => {
    it('should return paginated menu items with default parameters', async () => {
      const mockItems = [
        { id: 'item-1', name: 'Pizza', category: MenuCategory.LUNCH },
        { id: 'item-2', name: 'Salad', category: MenuCategory.SNACKS }
      ];
      const mockResult = { items: mockItems, total: 2 };
      MockedMenuItemRepository.findMany.mockResolvedValue(mockResult as any);

      const result = await MenuItemService.getMenuItems();

      expect(result).toEqual({
        items: mockItems,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1
      });
      expect(MockedMenuItemRepository.findMany).toHaveBeenCalledWith({
        filters: {},
        skip: 0,
        take: 20,
        sortBy: 'sortOrder',
        sortOrder: 'asc'
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        schoolId: 'school-123',
        category: MenuCategory.LUNCH,
        available: true,
        priceMin: 5,
        priceMax: 15
      };
      const mockResult = { items: [], total: 0 };
      MockedMenuItemRepository.findMany.mockResolvedValue(mockResult as any);

      await MenuItemService.getMenuItems(filters);

      expect(MockedMenuItemRepository.findMany).toHaveBeenCalledWith({
        filters,
        skip: 0,
        take: 20,
        sortBy: 'sortOrder',
        sortOrder: 'asc'
      });
    });

    it('should handle pagination correctly', async () => {
      const pagination = { page: 2, limit: 10 };
      const mockResult = { items: [], total: 25 };
      MockedMenuItemRepository.findMany.mockResolvedValue(mockResult as any);

      const result = await MenuItemService.getMenuItems({}, pagination);

      expect(result.totalPages).toBe(3);
      expect(MockedMenuItemRepository.findMany).toHaveBeenCalledWith({
        filters: {},
        skip: 10,
        take: 10,
        sortBy: 'sortOrder',
        sortOrder: 'asc'
      });
    });

    it('should limit maximum items per page', async () => {
      const pagination = { limit: 200 };
      const mockResult = { items: [], total: 0 };
      MockedMenuItemRepository.findMany.mockResolvedValue(mockResult as any);

      await MenuItemService.getMenuItems({}, pagination);

      expect(MockedMenuItemRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });
  });

  describe('searchMenuItems', () => {
    it('should search menu items with term', async () => {
      const mockResult = { items: [{ id: 'item-1', name: 'Pizza' }], total: 1 };
      MockedMenuItemRepository.search.mockResolvedValue(mockResult as any);

      const result = await MenuItemService.searchMenuItems('pizza');

      expect(result).toEqual(mockResult);
      expect(MockedMenuItemRepository.search).toHaveBeenCalledWith(
        'pizza',
        {},
        {}
      );
    });

    it('should return all items for empty search term', async () => {
      const mockResult = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      jest.spyOn(MenuItemService, 'getMenuItems').mockResolvedValue(mockResult);

      const result = await MenuItemService.searchMenuItems('');

      expect(result).toEqual({ items: [], total: 0 });
      expect(MenuItemService.getMenuItems).toHaveBeenCalledWith({}, {});
    });

    it('should apply filters during search', async () => {
      const filters = { category: MenuCategory.DINNER };
      const mockResult = { items: [], total: 0 };
      MockedMenuItemRepository.search.mockResolvedValue(mockResult as any);

      await MenuItemService.searchMenuItems('chocolate', filters);

      expect(MockedMenuItemRepository.search).toHaveBeenCalledWith(
        'chocolate',
        filters,
        {}
      );
    });
  });

  describe('updateMenuItem', () => {
    const updateInput = {
      name: 'Updated Pizza',
      price: 15.99,
      available: false
    };

    it('should update menu item successfully', async () => {
      const existingItem = {
        id: 'item-123',
        name: 'Pizza',
        schoolId: 'school-123',
        category: MenuCategory.LUNCH
      };
      const updatedItem = { ...existingItem, ...updateInput };

      MockedMenuItemRepository.findById.mockResolvedValue(existingItem as any);
      MockedMenuItemRepository.findByNameAndSchool.mockResolvedValue(null);
      MockedMenuItemRepository.update.mockResolvedValue(updatedItem as any);

      const result = await MenuItemService.updateMenuItem('item-123', updateInput);

      expect(result).toEqual(updatedItem);
      expect(MockedMenuItemRepository.update).toHaveBeenCalled();
    });

    it('should throw error for non-existent menu item', async () => {
      MockedMenuItemRepository.findById.mockResolvedValue(null);

      await expect(MenuItemService.updateMenuItem('nonexistent', updateInput))
        .rejects.toThrow('Menu item with ID nonexistent not found');
    });

    it('should check for duplicate names when updating', async () => {
      const existingItem = { id: 'item-123', name: 'Pizza', schoolId: 'school-123' };
      const duplicateItem = { id: 'item-456', name: 'Updated Pizza' };

      MockedMenuItemRepository.findById.mockResolvedValue(existingItem as any);
      MockedMenuItemRepository.findByNameAndSchool.mockResolvedValue(duplicateItem as any);

      await expect(MenuItemService.updateMenuItem('item-123', updateInput))
        .rejects.toThrow('Menu item with name "Updated Pizza" already exists for this school');
    });

    it('should validate price during update', async () => {
      const existingItem = { id: 'item-123', name: 'Pizza' };
      MockedMenuItemRepository.findById.mockResolvedValue(existingItem as any);

      const invalidUpdate = { price: -5 };

      await expect(MenuItemService.updateMenuItem('item-123', invalidUpdate))
        .rejects.toThrow('Menu item price must be greater than 0');
    });
  });

  describe('deleteMenuItem', () => {
    it('should soft delete menu item by default', async () => {
      const existingItem = {
        id: 'item-123',
        name: 'Pizza',
        schoolId: 'school-123',
        category: MenuCategory.LUNCH
      };
      const deletedItem = { ...existingItem, available: false };

      MockedMenuItemRepository.findById.mockResolvedValue(existingItem as any);
      MockedMenuItemRepository.update.mockResolvedValue(deletedItem as any);

      const result = await MenuItemService.deleteMenuItem('item-123');

      expect(result).toEqual(deletedItem);
      expect(MockedMenuItemRepository.update).toHaveBeenCalledWith(
        'item-123',
        { available: false }
      );
    });

    it('should hard delete when specified', async () => {
      const existingItem = { id: 'item-123', name: 'Pizza' };
      MockedMenuItemRepository.findById.mockResolvedValue(existingItem as any);
      MockedMenuItemRepository.delete.mockResolvedValue(existingItem as any);

      const result = await MenuItemService.deleteMenuItem('item-123', true);

      expect(result).toEqual(existingItem);
      expect(MockedMenuItemRepository.delete).toHaveBeenCalledWith('item-123');
    });

    it('should throw error for non-existent item', async () => {
      MockedMenuItemRepository.findById.mockResolvedValue(null);

      await expect(MenuItemService.deleteMenuItem('nonexistent'))
        .rejects.toThrow('Menu item with ID nonexistent not found');
    });
  });

  describe('updateSortOrders', () => {
    it('should update sort orders for multiple items', async () => {
      const updates = [
        { id: 'item-1', sortOrder: 1 },
        { id: 'item-2', sortOrder: 2 }
      ];
      const existingItems = [
        { id: 'item-1', schoolId: 'school-123', category: MenuCategory.LUNCH },
        { id: 'item-2', schoolId: 'school-123', category: MenuCategory.LUNCH }
      ];

      MockedMenuItemRepository.findById
        .mockResolvedValueOnce(existingItems[0] as any)
        .mockResolvedValueOnce(existingItems[1] as any);
      MockedMenuItemRepository.batchUpdateSortOrders.mockResolvedValue(undefined);

      await MenuItemService.updateSortOrders(updates);

      expect(MockedMenuItemRepository.batchUpdateSortOrders).toHaveBeenCalledWith(updates);
    });

    it('should throw error for missing items', async () => {
      const updates = [{ id: 'nonexistent', sortOrder: 1 }];
      MockedMenuItemRepository.findById.mockResolvedValue(null);

      await expect(MenuItemService.updateSortOrders(updates))
        .rejects.toThrow('Menu items not found: nonexistent');
    });

    it('should reject too many updates', async () => {
      const updates = Array.from({ length: 101 }, (_, i) => ({
        id: `item-${i}`,
        sortOrder: i
      }));

      await expect(MenuItemService.updateSortOrders(updates))
        .rejects.toThrow('Cannot update more than 100 items at once');
    });

    it('should handle empty updates array', async () => {
      await MenuItemService.updateSortOrders([]);
      expect(MockedMenuItemRepository.batchUpdateSortOrders).not.toHaveBeenCalled();
    });
  });

  describe('toggleFeatured', () => {
    it('should toggle featured status from false to true', async () => {
      const mockItem = { id: 'item-123', featured: false };
      const updatedItem = { ...mockItem, featured: true };

      jest.spyOn(MenuItemService, 'getMenuItemById').mockResolvedValue(mockItem as any);
      jest.spyOn(MenuItemService, 'updateMenuItem').mockResolvedValue(updatedItem as any);

      const result = await MenuItemService.toggleFeatured('item-123');

      expect(result).toEqual(updatedItem);
      expect(MenuItemService.updateMenuItem).toHaveBeenCalledWith('item-123', { featured: true });
    });

    it('should throw error for non-existent item', async () => {
      jest.spyOn(MenuItemService, 'getMenuItemById').mockResolvedValue(null);

      await expect(MenuItemService.toggleFeatured('nonexistent'))
        .rejects.toThrow('Menu item with ID nonexistent not found');
    });
  });

  describe('getMenuItemsByAllergens', () => {
    it('should filter out items with excluded allergens', async () => {
      const mockItems = [
        { id: 'item-1', allergens: JSON.stringify(['nuts', 'dairy']) },
        { id: 'item-2', allergens: JSON.stringify(['gluten']) },
        { id: 'item-3', allergens: null }
      ];
      const mockResult = { items: mockItems, total: 3, page: 1, limit: 20, totalPages: 1 };

      jest.spyOn(MenuItemService, 'getMenuItems').mockResolvedValue(mockResult as any);

      const result = await MenuItemService.getMenuItemsByAllergens(['nuts']);

      expect(result).toHaveLength(2);
      expect(result.find(item => item.id === 'item-1')).toBeUndefined();
    });

    it('should include items with no allergen data', async () => {
      const mockItems = [
        { id: 'item-1', allergens: null },
        { id: 'item-2', allergens: undefined }
      ];
      const mockResult = { items: mockItems, total: 2, page: 1, limit: 20, totalPages: 1 };

      jest.spyOn(MenuItemService, 'getMenuItems').mockResolvedValue(mockResult as any);

      const result = await MenuItemService.getMenuItemsByAllergens(['nuts']);

      expect(result).toHaveLength(2);
    });

    it('should handle invalid allergen JSON', async () => {
      const mockItems = [
        { id: 'item-1', allergens: 'invalid-json' }
      ];
      const mockResult = { items: mockItems, total: 1, page: 1, limit: 20, totalPages: 1 };

      jest.spyOn(MenuItemService, 'getMenuItems').mockResolvedValue(mockResult as any);

      const result = await MenuItemService.getMenuItemsByAllergens(['nuts']);

      expect(result).toHaveLength(1);
    });
  });

  describe('getNutritionalSummary', () => {
    it('should calculate nutritional summary for multiple items', async () => {
      const mockItems = [
        {
          id: 'item-1',
          calories: 300,
          allergens: JSON.stringify(['nuts']),
          nutritionalInfo: JSON.stringify({ protein: 15, carbs: 30 })
        },
        {
          id: 'item-2',
          calories: 200,
          allergens: JSON.stringify(['dairy']),
          nutritionalInfo: JSON.stringify({ protein: 10, carbs: 20 })
        }
      ];

      jest.spyOn(MenuItemService, 'getMenuItemById')
        .mockResolvedValueOnce(mockItems[0] as any)
        .mockResolvedValueOnce(mockItems[1] as any);

      const result = await MenuItemService.getNutritionalSummary(['item-1', 'item-2']);

      expect(result).toEqual({
        totalCalories: 500,
        allergens: ['nuts', 'dairy'],
        nutritionalInfo: { protein: 25, carbs: 50 }
      });
    });

    it('should handle missing items gracefully', async () => {
      jest.spyOn(MenuItemService, 'getMenuItemById')
        .mockResolvedValueOnce({ id: 'item-1', calories: 300 } as any)
        .mockResolvedValueOnce(null);

      const result = await MenuItemService.getNutritionalSummary(['item-1', 'nonexistent']);

      expect(result.totalCalories).toBe(300);
    });

    it('should handle invalid nutritional JSON', async () => {
      const mockItem = {
        id: 'item-1',
        calories: 300,
        allergens: 'invalid-json',
        nutritionalInfo: 'invalid-json'
      };

      jest.spyOn(MenuItemService, 'getMenuItemById').mockResolvedValue(mockItem as any);

      const result = await MenuItemService.getNutritionalSummary(['item-1']);

      expect(result).toEqual({
        totalCalories: 300,
        allergens: [],
        nutritionalInfo: {}
      });
    });
  });

  describe('getFeaturedItems', () => {
    it('should get featured items with default options', async () => {
      const mockResult = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      jest.spyOn(MenuItemService, 'getMenuItems').mockResolvedValue(mockResult);

      const result = await MenuItemService.getFeaturedItems();

      expect(MenuItemService.getMenuItems).toHaveBeenCalledWith(
        { featured: true, available: true },
        { limit: 10, sortBy: 'sortOrder', sortOrder: 'asc' }
      );
      expect(result).toEqual(mockResult.items);
    });

    it('should apply school and category filters', async () => {
      const options = { schoolId: 'school-123', category: MenuCategory.DINNER, limit: 5 };
      const mockResult = { items: [], total: 0, page: 1, limit: 5, totalPages: 0 };
      jest.spyOn(MenuItemService, 'getMenuItems').mockResolvedValue(mockResult);

      await MenuItemService.getFeaturedItems(options);

      expect(MenuItemService.getMenuItems).toHaveBeenCalledWith(
        {
          featured: true,
          available: true,
          schoolId: 'school-123',
          category: MenuCategory.DINNER
        },
        { limit: 5, sortBy: 'sortOrder', sortOrder: 'asc' }
      );
    });
  });

  describe('getMenuItemsByCategory', () => {
    it('should get items by category with default options', async () => {
      const mockResult = { items: [], total: 0, page: 1, limit: 50, totalPages: 0 };
      jest.spyOn(MenuItemService, 'getMenuItems').mockResolvedValue(mockResult);

      const result = await MenuItemService.getMenuItemsByCategory(MenuCategory.LUNCH);

      expect(MenuItemService.getMenuItems).toHaveBeenCalledWith(
        { category: MenuCategory.LUNCH },
        { limit: 50, sortBy: 'sortOrder', sortOrder: 'asc' }
      );
      expect(result).toEqual(mockResult.items);
    });

    it('should apply additional filters', async () => {
      const options = { schoolId: 'school-123', available: true, limit: 20 };
      const mockResult = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      jest.spyOn(MenuItemService, 'getMenuItems').mockResolvedValue(mockResult);

      await MenuItemService.getMenuItemsByCategory(MenuCategory.SNACKS, options);

      expect(MenuItemService.getMenuItems).toHaveBeenCalledWith(
        {
          category: MenuCategory.SNACKS,
          schoolId: 'school-123',
          available: true
        },
        { limit: 20, sortBy: 'sortOrder', sortOrder: 'asc' }
      );
    });
  });

  describe('toggleAvailability', () => {
    it('should toggle availability from true to false', async () => {
      const mockItem = { id: 'item-123', available: true };
      const updatedItem = { ...mockItem, available: false };

      jest.spyOn(MenuItemService, 'getMenuItemById').mockResolvedValue(mockItem as any);
      jest.spyOn(MenuItemService, 'updateMenuItem').mockResolvedValue(updatedItem as any);

      const result = await MenuItemService.toggleAvailability('item-123');

      expect(result).toEqual(updatedItem);
      expect(MenuItemService.updateMenuItem).toHaveBeenCalledWith('item-123', { available: false });
    });

    it('should throw error for non-existent item', async () => {
      jest.spyOn(MenuItemService, 'getMenuItemById').mockResolvedValue(null);

      await expect(MenuItemService.toggleAvailability('nonexistent'))
        .rejects.toThrow('Menu item with ID nonexistent not found');
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const error = new Error('Database connection failed');
      MockedMenuItemRepository.findById.mockRejectedValue(error);

      await expect(MenuItemService.getMenuItemById('item-123'))
        .rejects.toThrow('Database connection failed');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get menu item by ID',
        error,
        { menuItemId: 'item-123' }
      );
    });

    it('should handle cache errors gracefully', async () => {
      const cacheError = new Error('Redis connection failed');
      MockedCache.get.mockRejectedValue(cacheError);
      MockedMenuItemRepository.findById.mockResolvedValue({ id: 'item-123' } as any);

      const result = await MenuItemService.getMenuItemById('item-123');

      expect(result).toEqual({ id: 'item-123' });
      expect(MockedMenuItemRepository.findById).toHaveBeenCalled();
    });
  });

  describe('cache management', () => {
    it('should clear relevant caches after create', async () => {
      const validInput = {
        name: 'Pizza',
        category: MenuCategory.LUNCH,
        price: 12.99,
        currency: 'INR',
        schoolId: 'school-123'
      };
      const mockMenuItem = { id: 'item-123', ...validInput, schoolId: 'school-123' };

      MockedMenuItemRepository.findByNameAndSchool.mockResolvedValue(null);
      MockedMenuItemRepository.create.mockResolvedValue(mockMenuItem as any);
      MockedCache.clear.mockResolvedValue(undefined);

      await MenuItemService.createMenuItem(validInput);

      expect(MockedCache.clear).toHaveBeenCalled();
    });

    it('should clear caches after update', async () => {
      const existingItem = {
        id: 'item-123',
        schoolId: 'school-123',
        category: MenuCategory.LUNCH
      };
      MockedMenuItemRepository.findById.mockResolvedValue(existingItem as any);
      MockedMenuItemRepository.update.mockResolvedValue(existingItem as any);

      await MenuItemService.updateMenuItem('item-123', { name: 'Updated Pizza' });

      expect(MockedCache.del).toHaveBeenCalledWith('menu_item:item-123:true');
      expect(MockedCache.del).toHaveBeenCalledWith('menu_item:item-123:false');
    });
  });
});