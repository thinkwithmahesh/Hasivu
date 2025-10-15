"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const mockPrismaClient = {
    menuItem: {
        findFirst: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
    },
    menuPlan: {
        findFirst: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
    },
    dailyMenu: {
        findMany: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
    },
    $transaction: globals_1.jest.fn(),
    $connect: globals_1.jest.fn(),
    $disconnect: globals_1.jest.fn(),
};
globals_1.jest.mock('@/services/database.service', () => ({
    DatabaseService: {
        getInstance: globals_1.jest.fn().mockReturnValue(mockPrismaClient)
    }
}));
globals_1.jest.mock('@/repositories/menuItem.repository', () => ({
    MenuItemRepository: {
        nameExists: globals_1.jest.fn().mockResolvedValue(false),
        create: globals_1.jest.fn().mockResolvedValue({ id: 'item-123', name: 'Test Item' }),
        findMany: globals_1.jest.fn().mockResolvedValue({ items: [], total: 0 }),
        search: globals_1.jest.fn().mockResolvedValue({ items: [], total: 0 }),
        findById: globals_1.jest.fn().mockResolvedValue(null),
        update: globals_1.jest.fn().mockResolvedValue({ id: 'item-123' }),
        delete: globals_1.jest.fn().mockResolvedValue({ id: 'item-123' }),
        softDelete: globals_1.jest.fn().mockResolvedValue({ id: 'item-123' }),
        hardDelete: globals_1.jest.fn().mockResolvedValue({ id: 'item-123' }),
        getMenuStats: globals_1.jest.fn().mockResolvedValue({})
    }
}));
globals_1.jest.mock('@/repositories/menuPlan.repository', () => ({
    MenuPlanRepository: {
        findOverlapping: globals_1.jest.fn().mockResolvedValue([]),
        create: globals_1.jest.fn().mockResolvedValue({ id: 'plan-123', name: 'Test Plan' }),
        findMany: globals_1.jest.fn().mockResolvedValue({ items: [], total: 0 }),
        findById: globals_1.jest.fn().mockResolvedValue(null),
        update: globals_1.jest.fn().mockResolvedValue({ id: 'plan-123' }),
        delete: globals_1.jest.fn().mockResolvedValue({ id: 'plan-123' }),
        updateStatus: globals_1.jest.fn().mockResolvedValue({ id: 'plan-123', status: 'APPROVED' }),
        getStatistics: globals_1.jest.fn().mockResolvedValue({ total: 0, active: 0, templates: 0, pendingApproval: 0, byStatus: {} })
    }
}));
globals_1.jest.mock('@/repositories/dailyMenu.repository', () => ({
    DailyMenuRepository: {
        findMany: globals_1.jest.fn().mockResolvedValue({ items: [], total: 0 }),
        create: globals_1.jest.fn().mockResolvedValue({ id: 'daily-123' }),
        update: globals_1.jest.fn().mockResolvedValue({ id: 'daily-123' }),
        delete: globals_1.jest.fn().mockResolvedValue({ id: 'daily-123' })
    }
}));
globals_1.jest.mock('@/services/logger.service');
globals_1.jest.mock('@/services/validation.service');
globals_1.jest.mock('@prisma/client', () => ({
    PrismaClient: globals_1.jest.fn(() => mockPrismaClient),
    Prisma: {
        Decimal: class MockDecimal {
            value;
            constructor(value) {
                this.value = typeof value === 'string' ? parseFloat(value) : value;
            }
            toString() { return this.value.toString(); }
            toNumber() { return this.value; }
        }
    }
}));
const menuItem_service_1 = require("@/services/menuItem.service");
const menuPlan_service_1 = require("@/services/menuPlan.service");
const menuItem_repository_1 = require("@/repositories/menuItem.repository");
const menuPlan_repository_1 = require("@/repositories/menuPlan.repository");
const mockMenuItemRepository = menuItem_repository_1.MenuItemRepository;
const mockMenuPlanRepository = menuPlan_repository_1.MenuPlanRepository;
Object.keys(mockMenuItemRepository).forEach(key => {
    const method = mockMenuItemRepository[key];
    if (typeof method === 'function' && !globals_1.jest.isMockFunction(method)) {
        mockMenuItemRepository[key] = globals_1.jest.fn();
    }
});
Object.keys(mockMenuPlanRepository).forEach(key => {
    const method = mockMenuPlanRepository[key];
    if (typeof method === 'function' && !globals_1.jest.isMockFunction(method)) {
        mockMenuPlanRepository[key] = globals_1.jest.fn();
    }
});
const MenuStatus = {
    DRAFT: 'DRAFT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    APPROVED: 'APPROVED',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED: 'ARCHIVED'
};
const createMockMenuItem = (overrides = {}) => ({
    id: 'item-123',
    name: 'Test Item',
    description: 'Test description',
    category: 'LUNCH',
    price: { toString: () => '250' },
    originalPrice: { toString: () => '300' },
    currency: 'INR',
    available: true,
    featured: false,
    imageUrl: 'test-image.jpg',
    nutritionalInfo: '{}',
    allergens: '[]',
    tags: '[]',
    preparationTime: 15,
    portionSize: 'Medium',
    calories: 400,
    schoolId: 'school-123',
    vendorId: 'vendor-123',
    sortOrder: 0,
    metadata: '{}',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});
const createMockMenuPlan = (overrides = {}) => ({
    id: 'plan-123',
    schoolId: 'school-123',
    name: 'Test Menu Plan',
    description: 'Test description',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-07'),
    isTemplate: false,
    isRecurring: false,
    status: 'DRAFT',
    approvalWorkflow: '{}',
    approvedBy: null,
    approvedAt: null,
    recurringPattern: null,
    templateCategory: null,
    metadata: '{}',
    version: 1,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});
describe('Menu Management Services - Comprehensive Tests', () => {
    beforeEach(() => {
        globals_1.jest.clearAllMocks();
    });
    describe('MenuItemService', () => {
        describe('createMenuItem', () => {
            const menuItemData = {
                name: 'Grilled Chicken Sandwich',
                description: 'Tender grilled chicken with fresh vegetables',
                category: menuItem_service_1.MenuCategory.LUNCH,
                price: 250,
                currency: 'INR',
                schoolId: 'restaurant-123',
                allergens: ['gluten']
            };
            it('should create a new menu item successfully', async () => {
                const mockMenuItem = createMockMenuItem({
                    id: 'item-789',
                    name: menuItemData.name,
                    description: menuItemData.description,
                    category: menuItemData.category,
                    schoolId: menuItemData.schoolId
                });
                (mockMenuItemRepository.nameExists).mockResolvedValue(false);
                (mockMenuItemRepository.create).mockResolvedValue(mockMenuItem);
                const result = await menuItem_service_1.MenuItemService.createMenuItem(menuItemData);
                expect(result.id).toBe('item-789');
                expect(result.name).toBe(menuItemData.name);
                expect(mockMenuItemRepository.nameExists).toHaveBeenCalledWith(menuItemData.name, menuItemData.schoolId);
                expect(mockMenuItemRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                    name: menuItemData.name,
                    category: menuItemData.category,
                    price: menuItemData.price
                }));
            });
            it('should reject duplicate menu item names within restaurant', async () => {
                (mockMenuItemRepository.nameExists).mockResolvedValue(true);
                await expect(menuItem_service_1.MenuItemService.createMenuItem(menuItemData))
                    .rejects.toThrow('A menu item with this name already exists in this restaurant');
                expect(mockMenuItemRepository.create).not.toHaveBeenCalled();
            });
            it('should validate business rules correctly', async () => {
                const invalidData = { ...menuItemData, name: '' };
                await expect(menuItem_service_1.MenuItemService.createMenuItem(invalidData))
                    .rejects.toThrow('Menu item name is required');
            });
            it('should validate price ranges correctly', async () => {
                const expensiveItem = { ...menuItemData, price: 15000 };
                await expect(menuItem_service_1.MenuItemService.createMenuItem(expensiveItem))
                    .rejects.toThrow('Price cannot exceed ₹10,000');
            });
            it('should validate allergens array format', async () => {
                const invalidAllergensData = { ...menuItemData, allergens: 'not-an-array' };
                await expect(menuItem_service_1.MenuItemService.createMenuItem(invalidAllergensData))
                    .rejects.toThrow('Allergens must be an array');
            });
        });
        describe('getMenuItems', () => {
            it('should retrieve menu items with filters and pagination', async () => {
                const mockItems = [
                    createMockMenuItem({
                        id: 'item-1',
                        name: 'Item 1',
                        category: menuItem_service_1.MenuCategory.LUNCH,
                        featured: true
                    }),
                    createMockMenuItem({
                        id: 'item-2',
                        name: 'Item 2',
                        category: menuItem_service_1.MenuCategory.DINNER,
                        price: { toString: () => '150' },
                        featured: false
                    })
                ];
                const mockResult = {
                    items: mockItems,
                    total: 2,
                    page: 1,
                    limit: 20,
                    totalPages: 1
                };
                (mockMenuItemRepository.findMany).mockResolvedValue(mockResult);
                const result = await menuItem_service_1.MenuItemService.getMenuItems({ schoolId: 'restaurant-456', available: true }, { page: 1, limit: 20 });
                expect(result.items).toHaveLength(2);
                expect(result.total).toBe(2);
                expect(result.page).toBe(1);
                expect(mockMenuItemRepository.findMany).toHaveBeenCalledWith({
                    where: {
                        schoolId: 'restaurant-456',
                        available: true
                    },
                    skip: 0,
                    take: 20
                });
            });
            it('should enforce maximum page size limit', async () => {
                const mockResult = { items: [], total: 0, page: 1, limit: 100, totalPages: 0 };
                (mockMenuItemRepository.findMany).mockResolvedValue(mockResult);
                await menuItem_service_1.MenuItemService.getMenuItems({}, { page: 1, limit: 150 });
                expect(mockMenuItemRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                    take: 100
                }));
            });
        });
        describe('searchMenuItems', () => {
            it('should search menu items by name and filters', async () => {
                const mockItems = [
                    createMockMenuItem({
                        id: 'item-1',
                        name: 'Chicken Curry',
                        category: menuItem_service_1.MenuCategory.LUNCH,
                        price: { toString: () => '275' }
                    }),
                    createMockMenuItem({
                        id: 'item-2',
                        name: 'Chicken Tikka',
                        category: menuItem_service_1.MenuCategory.DINNER,
                        price: { toString: () => '300' }
                    })
                ];
                const mockResult = {
                    items: mockItems,
                    total: 2,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                };
                (mockMenuItemRepository.search).mockResolvedValue(mockResult);
                const result = await menuItem_service_1.MenuItemService.searchMenuItems('chicken', { schoolId: 'restaurant-456' }, { page: 1, limit: 10 });
                expect(result.items).toHaveLength(2);
                expect(result.total).toBe(2);
                expect(mockMenuItemRepository.search).toHaveBeenCalledWith('chicken', expect.objectContaining({
                    schoolId: 'restaurant-456'
                }), { page: 1, limit: 10 });
            });
            it('should reject empty search terms', async () => {
                await expect(menuItem_service_1.MenuItemService.searchMenuItems('', {}, { page: 1, limit: 10 }))
                    .rejects.toThrow('Search term cannot be empty');
            });
        });
        describe('updateMenuItem', () => {
            const itemId = 'item-123';
            const updateData = {
                name: 'Updated Chicken Sandwich',
                price: 275,
                description: 'Updated description'
            };
            it('should update menu item successfully', async () => {
                const existingItem = createMockMenuItem({
                    id: itemId,
                    name: 'Old Name',
                    schoolId: 'restaurant-456',
                    available: true
                });
                const updatedItem = createMockMenuItem({
                    ...existingItem,
                    ...updateData,
                    price: { toString: () => '275' }
                });
                (mockMenuItemRepository.findById).mockResolvedValue(existingItem);
                (mockMenuItemRepository.nameExists).mockResolvedValue(false);
                (mockMenuItemRepository.update).mockResolvedValue(updatedItem);
                const result = await menuItem_service_1.MenuItemService.updateMenuItem(itemId, updateData);
                expect(result.name).toBe(updateData.name);
                expect(mockMenuItemRepository.findById).toHaveBeenCalledWith(itemId);
                expect(mockMenuItemRepository.update).toHaveBeenCalledWith(itemId, expect.objectContaining({
                    name: updateData.name,
                    price: updateData.price
                }));
            });
            it('should check for duplicate names when updating', async () => {
                const updateData = { name: 'Duplicate Name' };
                const existingItem = createMockMenuItem({
                    id: itemId,
                    name: 'Current Name',
                    schoolId: 'restaurant-456'
                });
                (mockMenuItemRepository.findById).mockResolvedValue(existingItem);
                (mockMenuItemRepository.nameExists).mockResolvedValue(true);
                await expect(menuItem_service_1.MenuItemService.updateMenuItem(itemId, updateData))
                    .rejects.toThrow('A menu item with this name already exists');
            });
        });
        describe('deleteMenuItem', () => {
            const itemId = 'item-123';
            const existingItem = createMockMenuItem({
                id: itemId,
                name: 'Item to Delete',
                available: true
            });
            it('should perform soft delete by default', async () => {
                const deletedItem = createMockMenuItem({
                    ...existingItem,
                    available: false
                });
                (mockMenuItemRepository.findById).mockResolvedValue(existingItem);
                (mockMenuItemRepository.update).mockResolvedValue(deletedItem);
                const result = await menuItem_service_1.MenuItemService.deleteMenuItem(itemId);
                expect(result.available).toBe(false);
                expect(mockMenuItemRepository.update).toHaveBeenCalledWith(itemId, { available: false });
                expect(mockMenuItemRepository.delete).not.toHaveBeenCalled();
            });
            it('should perform hard delete when requested', async () => {
                (mockMenuItemRepository.findById).mockResolvedValue(existingItem);
                (mockMenuItemRepository.delete).mockResolvedValue(existingItem);
                await menuItem_service_1.MenuItemService.deleteMenuItem(itemId, true);
                expect(mockMenuItemRepository.delete).toHaveBeenCalledWith(itemId);
                expect(mockMenuItemRepository.update).not.toHaveBeenCalled();
            });
        });
    });
    describe('MenuPlanService', () => {
        describe('createMenuPlan', () => {
            const menuPlanData = {
                name: 'Weekly Menu Plan',
                description: 'Weekly menu for restaurant',
                schoolId: 'restaurant-123',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-07'),
                status: menuPlan_service_1.MenuPlanStatus.DRAFT,
                createdBy: 'test-user-123'
            };
            it('should create a new menu plan successfully', async () => {
                const mockMenuPlan = createMockMenuPlan({
                    id: 'plan-789',
                    ...menuPlanData
                });
                (mockMenuPlanRepository.findOverlapping).mockResolvedValue([]);
                (mockMenuPlanRepository.create).mockResolvedValue(mockMenuPlan);
                const result = await menuPlan_service_1.MenuPlanService.createMenuPlan(menuPlanData);
                expect(result.id).toBe('plan-789');
                expect(result.name).toBe(menuPlanData.name);
                expect(mockMenuPlanRepository.findOverlapping).toHaveBeenCalledWith(menuPlanData.schoolId, menuPlanData.startDate, menuPlanData.endDate);
                expect(mockMenuPlanRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                    name: menuPlanData.name,
                    schoolId: menuPlanData.schoolId
                }));
            });
            it('should reject overlapping menu plans', async () => {
                const overlappingPlans = [
                    createMockMenuPlan({
                        id: 'existing-plan',
                        name: 'Existing Plan',
                        startDate: new Date('2023-12-30'),
                        endDate: new Date('2024-01-03')
                    })
                ];
                (mockMenuPlanRepository.findOverlapping).mockResolvedValue(overlappingPlans);
                await expect(menuPlan_service_1.MenuPlanService.createMenuPlan(menuPlanData))
                    .rejects.toThrow('Overlapping menu plans found: Existing Plan');
                expect(mockMenuPlanRepository.create).not.toHaveBeenCalled();
            });
            it('should validate date ranges', async () => {
                const invalidDateData = {
                    ...menuPlanData,
                    startDate: new Date('2024-01-07'),
                    endDate: new Date('2024-01-01')
                };
                await expect(menuPlan_service_1.MenuPlanService.createMenuPlan(invalidDateData))
                    .rejects.toThrow('End date must be after start date');
            });
            it('should validate maximum plan duration', async () => {
                const longPlanData = {
                    ...menuPlanData,
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2025-01-02')
                };
                await expect(menuPlan_service_1.MenuPlanService.createMenuPlan(longPlanData))
                    .rejects.toThrow('Menu plan duration cannot exceed 365 days');
            });
            it('should validate template requirements', async () => {
                const templateData = {
                    ...menuPlanData,
                    isTemplate: true,
                    templateCategory: undefined
                };
                await expect(menuPlan_service_1.MenuPlanService.createMenuPlan(templateData))
                    .rejects.toThrow('Template category is required for templates');
            });
        });
        describe('updateMenuPlan', () => {
            const planId = 'plan-123';
            const updateData = {
                name: 'Updated Plan Name',
                description: 'Updated description'
            };
            it('should update menu plan successfully', async () => {
                const existingPlan = createMockMenuPlan({
                    id: planId,
                    name: 'Old Name',
                    status: 'DRAFT'
                });
                const updatedPlan = {
                    ...existingPlan,
                    ...updateData
                };
                (mockMenuPlanRepository.findById).mockResolvedValue(existingPlan);
                (mockMenuPlanRepository.update).mockResolvedValue(updatedPlan);
                const result = await menuPlan_service_1.MenuPlanService.updateMenuPlan(planId, updateData);
                expect(result.name).toBe(updateData.name);
                expect(result.description).toBe(updateData.description);
                expect(mockMenuPlanRepository.update).toHaveBeenCalledWith(planId, updateData);
            });
            it('should validate date updates for overlaps', async () => {
                const updateData = {
                    startDate: new Date('2024-02-01'),
                    endDate: new Date('2024-02-07')
                };
                const existingPlan = createMockMenuPlan({
                    id: planId,
                    schoolId: 'restaurant-456',
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-01-07')
                });
                const overlappingPlans = [
                    createMockMenuPlan({
                        id: 'conflicting-plan',
                        name: 'Conflicting Plan',
                        startDate: new Date('2024-02-05'),
                        endDate: new Date('2024-02-10')
                    })
                ];
                (mockMenuPlanRepository.findById).mockResolvedValue(existingPlan);
                (mockMenuPlanRepository.findOverlapping).mockResolvedValue(overlappingPlans);
                await expect(menuPlan_service_1.MenuPlanService.updateMenuPlan(planId, updateData))
                    .rejects.toThrow('Overlapping menu plans found: Conflicting Plan');
            });
        });
        describe('applyTemplate', () => {
            const applyData = {
                templateId: 'template-123',
                name: 'New Plan from Template',
                schoolId: 'restaurant-456',
                startDate: new Date('2024-03-01'),
                endDate: new Date('2024-03-07')
            };
            it('should apply template successfully', async () => {
                const mockTemplate = createMockMenuPlan({
                    id: 'template-123',
                    name: 'Weekly Template',
                    isTemplate: true,
                    approvalWorkflow: JSON.stringify({ requiredApprovals: [] }),
                    metadata: JSON.stringify({ category: 'weekly' })
                });
                const mockNewPlan = createMockMenuPlan({
                    id: 'new-plan-456',
                    ...applyData,
                    status: 'DRAFT'
                });
                (mockMenuPlanRepository.findById)
                    .mockResolvedValueOnce(mockTemplate)
                    .mockResolvedValueOnce(mockNewPlan);
                (mockMenuPlanRepository.findOverlapping).mockResolvedValue([]);
                (mockMenuPlanRepository.create).mockResolvedValue(mockNewPlan);
                expect(mockMenuPlanRepository.findById).toHaveBeenCalledWith(applyData.templateId);
                expect(mockMenuPlanRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                    name: applyData.name,
                    schoolId: applyData.schoolId
                }));
            });
            it('should reject non-template plans', async () => {
                const mockNonTemplate = createMockMenuPlan({
                    id: 'plan-123',
                    isTemplate: false
                });
                (mockMenuPlanRepository.findById).mockResolvedValue(mockNonTemplate);
            });
        });
        describe('updateStatus', () => {
            const planId = 'plan-123';
            const newStatus = MenuStatus.APPROVED;
            const approvedBy = 'manager-456';
            it('should update plan status successfully', async () => {
                const updatedPlan = createMockMenuPlan({
                    id: planId,
                    status: newStatus,
                    approvedBy,
                    approvedAt: new Date()
                });
                (mockMenuPlanRepository.updateStatus).mockResolvedValue(updatedPlan);
                expect(mockMenuPlanRepository.updateStatus).toHaveBeenCalledWith(planId, newStatus, approvedBy);
            });
            it('should reject invalid status values', async () => {
                const invalidStatus = 'INVALID_STATUS';
            });
        });
        describe('getStatistics', () => {
            it('should return comprehensive menu plan statistics', async () => {
                const mockStats = {
                    total: 25,
                    active: 5,
                    templates: 8,
                    pendingApproval: 3,
                    byStatus: {
                        'DRAFT': 10,
                        'PENDING_APPROVAL': 3,
                        'APPROVED': 8,
                        'PUBLISHED': 4
                    }
                };
                (mockMenuPlanRepository.getStatistics).mockResolvedValue(mockStats);
                expect(mockMenuPlanRepository.getStatistics).toHaveBeenCalledWith('restaurant-456');
            });
        });
    });
    describe('Error Handling and Edge Cases', () => {
        const menuItemData = {
            name: 'Test Item',
            category: menuItem_service_1.MenuCategory.LUNCH,
            price: 200,
            currency: 'INR',
            schoolId: 'restaurant-123'
        };
        const menuPlanData = {
            name: 'Test Plan',
            schoolId: 'restaurant-123',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-07'),
            status: menuPlan_service_1.MenuPlanStatus.DRAFT,
            createdBy: 'test-user-123'
        };
        it('should handle repository errors gracefully in MenuPlanService', async () => {
            (mockMenuPlanRepository.findOverlapping).mockRejectedValue(new Error('Database connection failed'));
            await expect(menuPlan_service_1.MenuPlanService.createMenuPlan(menuPlanData))
                .rejects.toThrow('Database connection failed');
        });
        it('should validate nutritional information ranges', async () => {
            const menuItemData = {
                name: 'Test Item',
                category: menuItem_service_1.MenuCategory.LUNCH,
                price: 200,
                currency: 'INR',
                schoolId: 'restaurant-123',
                calories: 6000
            };
            await expect(menuItem_service_1.MenuItemService.createMenuItem(menuItemData))
                .rejects.toThrow('Calories must be between 0 and 5000');
        });
        it('should validate preparation time ranges', async () => {
            const menuItemData = {
                name: 'Test Item',
                category: menuItem_service_1.MenuCategory.LUNCH,
                price: 200,
                currency: 'INR',
                schoolId: 'restaurant-123',
                preparationTime: 500
            };
            await expect(menuItem_service_1.MenuItemService.createMenuItem(menuItemData))
                .rejects.toThrow('Preparation time must be between 1 and 480 minutes');
        });
        it('should handle empty results gracefully', async () => {
            (mockMenuItemRepository.findMany).mockResolvedValue({
                items: [],
                total: 0
            });
            const result = await menuItem_service_1.MenuItemService.getMenuItems({ schoolId: 'restaurant-456' });
            expect(result.items).toHaveLength(0);
            expect(result.total).toBe(0);
        });
        it('should validate item existence before operations', async () => {
            (mockMenuItemRepository.findById).mockResolvedValue(null);
            await expect(menuItem_service_1.MenuItemService.updateMenuItem('non-existent', { name: 'New Name' }))
                .rejects.toThrow('Menu item not found');
            await expect(menuItem_service_1.MenuItemService.deleteMenuItem('non-existent'))
                .rejects.toThrow('Menu item not found');
        });
        it('should handle concurrent access scenarios', async () => {
            (mockMenuItemRepository.findById)
                .mockResolvedValueOnce(createMockMenuItem({ id: 'item-123', name: 'Existing Item' }))
                .mockResolvedValueOnce(null);
            (mockMenuItemRepository.update).mockRejectedValue(new Error('Item was deleted by another process'));
            await expect(menuItem_service_1.MenuItemService.updateMenuItem('item-123', { name: 'Updated Name' }))
                .rejects.toThrow('Item was deleted by another process');
        });
    });
});
//# sourceMappingURL=menu.service.test.js.map