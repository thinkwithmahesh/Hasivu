"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dailyMenu_service_1 = require("../../../src/services/dailyMenu.service");
const dailyMenu_repository_1 = require("../../../src/repositories/dailyMenu.repository");
const menuItem_repository_1 = require("../../../src/repositories/menuItem.repository");
const cache_1 = require("../../../src/utils/cache");
const logger_1 = require("../../../src/utils/logger");
const MockedDailyMenuRepository = jest.mocked(dailyMenu_repository_1.DailyMenuRepository);
const MockedMenuItemRepository = jest.mocked(menuItem_repository_1.MenuItemRepository);
const MockedCache = jest.mocked(cache_1.cache);
describe('DailyMenuService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('createDailyMenu', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const validInput = {
            date: futureDate,
            schoolId: 'school-123',
            category: dailyMenu_service_1.MenuCategory.LUNCH,
            dayType: dailyMenu_service_1.DayType.WEEKDAY,
            menuItemIds: ['item-1', 'item-2'],
            availableQuantity: 100,
            notes: 'Special menu for future date'
        };
        const mockMenuItems = [
            {
                id: 'item-1',
                name: 'Pizza',
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                available: true
            },
            {
                id: 'item-2',
                name: 'Pasta',
                category: dailyMenu_service_1.MenuCategory.LUNCH,
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
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            MockedMenuItemRepository.findById
                .mockResolvedValueOnce(mockMenuItems[0])
                .mockResolvedValueOnce(mockMenuItems[1]);
            MockedDailyMenuRepository.create.mockResolvedValue(mockDailyMenu);
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(mockDailyMenu);
            const result = await dailyMenu_service_1.DailyMenuService.createDailyMenu(validInput);
            expect(result).toEqual(mockDailyMenu);
            expect(MockedDailyMenuRepository.findByDateRange).toHaveBeenCalledWith(validInput.date, validInput.date, validInput.schoolId);
            expect(MockedDailyMenuRepository.create).toHaveBeenCalled();
        });
        it('should throw error for duplicate daily menu', async () => {
            const existingMenu = { id: 'existing-123', date: validInput.date };
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue(existingMenu);
            const dateStr = futureDate.toISOString().split('T')[0];
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu(validInput))
                .rejects.toThrow(`Daily menu already exists for ${dateStr}`);
        });
        it('should validate required fields', async () => {
            const invalidInput = { ...validInput, date: null };
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu(invalidInput))
                .rejects.toThrow('Date is required');
        });
        it('should validate school ID is required', async () => {
            const invalidInput = { ...validInput, schoolId: '' };
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu(invalidInput))
                .rejects.toThrow('School ID is required');
        });
        it('should validate at least one menu item is required', async () => {
            const invalidInput = { ...validInput, menuItemIds: [] };
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu(invalidInput))
                .rejects.toThrow('At least one menu item is required');
        });
        it('should validate maximum items per menu', async () => {
            const invalidInput = {
                ...validInput,
                menuItemIds: Array.from({ length: 51 }, (_, i) => `item-${i}`)
            };
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu(invalidInput))
                .rejects.toThrow('Cannot add more than 50 items to a daily menu');
        });
        it('should validate menu items exist', async () => {
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            MockedMenuItemRepository.findById
                .mockResolvedValueOnce(mockMenuItems[0])
                .mockResolvedValueOnce(null);
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu(validInput))
                .rejects.toThrow('Menu items not found: item-2');
        });
        it('should validate menu items are available', async () => {
            const unavailableItem = { ...mockMenuItems[1], available: false };
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            MockedMenuItemRepository.findById
                .mockResolvedValueOnce(mockMenuItems[0])
                .mockResolvedValueOnce(unavailableItem);
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu(validInput))
                .rejects.toThrow('Menu items unavailable or wrong category: item-2');
        });
        it('should validate menu items have correct category', async () => {
            const wrongCategoryItem = { ...mockMenuItems[1], category: dailyMenu_service_1.MenuCategory.DESSERT };
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            MockedMenuItemRepository.findById
                .mockResolvedValueOnce(mockMenuItems[0])
                .mockResolvedValueOnce(wrongCategoryItem);
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu(validInput))
                .rejects.toThrow('Menu items unavailable or wrong category: item-2');
        });
        it('should not allow creating daily menu for past dates', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const invalidInput = { ...validInput, date: pastDate };
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu(invalidInput))
                .rejects.toThrow('Cannot create daily menu for past dates');
        });
        it('should allow creating daily menu for today', async () => {
            const today = new Date();
            const todayInput = { ...validInput, date: today };
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            MockedMenuItemRepository.findById
                .mockResolvedValueOnce(mockMenuItems[0])
                .mockResolvedValueOnce(mockMenuItems[1]);
            MockedDailyMenuRepository.create.mockResolvedValue({ id: 'menu-123' });
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue({ id: 'menu-123' });
            const result = await dailyMenu_service_1.DailyMenuService.createDailyMenu(todayInput);
            expect(result).toBeDefined();
        });
        it('should validate available quantity is not negative', async () => {
            const invalidInput = { ...validInput, availableQuantity: -10 };
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu(invalidInput))
                .rejects.toThrow('Available quantity cannot be negative');
        });
    });
    describe('getDailyMenuById', () => {
        it('should return cached daily menu', async () => {
            const mockMenu = { id: 'menu-123', date: new Date() };
            const serializedMenu = JSON.stringify(mockMenu);
            MockedCache.get.mockResolvedValue(serializedMenu);
            const result = await dailyMenu_service_1.DailyMenuService.getDailyMenuById('menu-123');
            const expectedResult = JSON.parse(serializedMenu);
            expect(result).toEqual(expectedResult);
            expect(MockedCache.get).toHaveBeenCalledWith('daily_menu:menu-123');
            expect(MockedDailyMenuRepository.findByIdWithItems).not.toHaveBeenCalled();
        });
        it('should fetch and cache daily menu when not cached', async () => {
            const mockMenu = { id: 'menu-123', date: new Date() };
            MockedCache.get.mockResolvedValue(null);
            MockedDailyMenuRepository.findByIdWithItems.mockResolvedValue(mockMenu);
            const result = await dailyMenu_service_1.DailyMenuService.getDailyMenuById('menu-123');
            expect(result).toEqual(mockMenu);
            expect(MockedDailyMenuRepository.findByIdWithItems).toHaveBeenCalledWith('menu-123');
            expect(MockedCache.setex).toHaveBeenCalledWith('daily_menu:menu-123', 600, JSON.stringify(mockMenu));
        });
        it('should return null for non-existent daily menu', async () => {
            MockedCache.get.mockResolvedValue(null);
            MockedDailyMenuRepository.findByIdWithItems.mockResolvedValue(null);
            const result = await dailyMenu_service_1.DailyMenuService.getDailyMenuById('nonexistent');
            expect(result).toBeNull();
            expect(logger_1.logger.warn).toHaveBeenCalledWith('Daily menu not found', { dailyMenuId: 'nonexistent' });
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
            MockedDailyMenuRepository.findManyWithItems.mockResolvedValue(mockMenus);
            const result = await dailyMenu_service_1.DailyMenuService.getDailyMenusByDateRange(schoolId, startDate, endDate);
            expect(result).toEqual(mockMenus);
            expect(MockedDailyMenuRepository.findManyWithItems).toHaveBeenCalledWith({
                schoolId,
                dateFrom: startDate,
                dateTo: endDate,
                isActive: true
            });
        });
        it('should filter by category when provided', async () => {
            const mockMenus = [{ id: 'menu-1', category: dailyMenu_service_1.MenuCategory.LUNCH }];
            MockedDailyMenuRepository.findManyWithItems.mockResolvedValue(mockMenus);
            await dailyMenu_service_1.DailyMenuService.getDailyMenusByDateRange(schoolId, startDate, endDate, dailyMenu_service_1.MenuCategory.LUNCH);
            expect(MockedDailyMenuRepository.findManyWithItems).toHaveBeenCalledWith({
                schoolId,
                dateFrom: startDate,
                dateTo: endDate,
                isActive: true,
                category: dailyMenu_service_1.MenuCategory.LUNCH
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
            const result = await dailyMenu_service_1.DailyMenuService.getDailyMenuByDate(schoolId, date);
            const expectedResult = JSON.parse(serializedMenus);
            expect(result).toEqual(expectedResult);
            expect(MockedCache.get).toHaveBeenCalledWith(cacheKey);
        });
        it('should fetch and cache daily menu for date when not cached', async () => {
            const mockMenus = [{ id: 'menu-123', date }];
            MockedCache.get.mockResolvedValue(null);
            MockedDailyMenuRepository.findManyWithItems.mockResolvedValue(mockMenus);
            const result = await dailyMenu_service_1.DailyMenuService.getDailyMenuByDate(schoolId, date);
            expect(result).toEqual(mockMenus);
            expect(MockedDailyMenuRepository.findManyWithItems).toHaveBeenCalledWith({
                schoolId,
                dateFrom: date,
                dateTo: date,
                isActive: true
            });
        });
        it('should filter by category when provided', async () => {
            const mockMenus = [{ id: 'menu-123', category: dailyMenu_service_1.MenuCategory.DESSERT }];
            const cacheKey = 'daily_menu:date:school-123:2024-01-15:DESSERT';
            MockedCache.get.mockResolvedValue(null);
            MockedDailyMenuRepository.findManyWithItems.mockResolvedValue(mockMenus);
            await dailyMenu_service_1.DailyMenuService.getDailyMenuByDate(schoolId, date, dailyMenu_service_1.MenuCategory.DESSERT);
            expect(MockedCache.get).toHaveBeenCalledWith(cacheKey);
            expect(MockedDailyMenuRepository.findManyWithItems).toHaveBeenCalledWith({
                schoolId,
                dateFrom: date,
                dateTo: date,
                isActive: true,
                category: dailyMenu_service_1.MenuCategory.DESSERT
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
                category: dailyMenu_service_1.MenuCategory.LUNCH
            };
            const updatedMenu = { ...existingMenu, ...updateInput };
            const menuItems = [
                { id: 'item-3', available: true, category: dailyMenu_service_1.MenuCategory.LUNCH },
                { id: 'item-4', available: true, category: dailyMenu_service_1.MenuCategory.LUNCH }
            ];
            MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu);
            MockedMenuItemRepository.findById
                .mockResolvedValueOnce(menuItems[0])
                .mockResolvedValueOnce(menuItems[1]);
            MockedDailyMenuRepository.update.mockResolvedValue(updatedMenu);
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(updatedMenu);
            const result = await dailyMenu_service_1.DailyMenuService.updateDailyMenu('menu-123', updateInput);
            expect(result).toEqual(updatedMenu);
            expect(MockedDailyMenuRepository.update).toHaveBeenCalled();
        });
        it('should throw error for non-existent daily menu', async () => {
            MockedDailyMenuRepository.findById.mockResolvedValue(null);
            await expect(dailyMenu_service_1.DailyMenuService.updateDailyMenu('nonexistent', updateInput))
                .rejects.toThrow('Daily menu with ID nonexistent not found');
        });
        it('should validate menu items when updating', async () => {
            const existingMenu = { id: 'menu-123', category: dailyMenu_service_1.MenuCategory.LUNCH };
            MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu);
            MockedMenuItemRepository.findById
                .mockResolvedValueOnce({ id: 'item-3', available: true, category: dailyMenu_service_1.MenuCategory.LUNCH })
                .mockResolvedValueOnce(null);
            await expect(dailyMenu_service_1.DailyMenuService.updateDailyMenu('menu-123', updateInput))
                .rejects.toThrow('Menu items not found: item-4');
        });
        it('should validate maximum items per menu when updating', async () => {
            const existingMenu = { id: 'menu-123' };
            const tooManyItems = {
                menuItemIds: Array.from({ length: 51 }, (_, i) => `item-${i}`)
            };
            MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu);
            await expect(dailyMenu_service_1.DailyMenuService.updateDailyMenu('menu-123', tooManyItems))
                .rejects.toThrow('Cannot add more than 50 items to a daily menu');
        });
        it('should update without menu items', async () => {
            const existingMenu = { id: 'menu-123', schoolId: 'school-123', date: new Date(), category: dailyMenu_service_1.MenuCategory.LUNCH };
            const updateWithoutItems = { notes: 'New notes', availableQuantity: 200 };
            const updatedMenu = { ...existingMenu, ...updateWithoutItems };
            MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu);
            MockedDailyMenuRepository.update.mockResolvedValue(updatedMenu);
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(updatedMenu);
            const result = await dailyMenu_service_1.DailyMenuService.updateDailyMenu('menu-123', updateWithoutItems);
            expect(result).toEqual(updatedMenu);
        });
    });
    describe('deleteDailyMenu', () => {
        it('should soft delete daily menu by default', async () => {
            const existingMenu = {
                id: 'menu-123',
                schoolId: 'school-123',
                date: new Date('2024-01-15'),
                category: dailyMenu_service_1.MenuCategory.LUNCH
            };
            const deletedMenu = { ...existingMenu, isActive: false };
            MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu);
            MockedDailyMenuRepository.update.mockResolvedValue(deletedMenu);
            const result = await dailyMenu_service_1.DailyMenuService.deleteDailyMenu('menu-123');
            expect(result).toEqual(deletedMenu);
            expect(MockedDailyMenuRepository.update).toHaveBeenCalledWith('menu-123', { isActive: false });
        });
        it('should hard delete when specified', async () => {
            const existingMenu = { id: 'menu-123', schoolId: 'school-123', date: new Date(), category: dailyMenu_service_1.MenuCategory.LUNCH };
            MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu);
            MockedDailyMenuRepository.delete.mockResolvedValue(existingMenu);
            const result = await dailyMenu_service_1.DailyMenuService.deleteDailyMenu('menu-123', true);
            expect(result).toEqual(existingMenu);
            expect(MockedDailyMenuRepository.delete).toHaveBeenCalledWith('menu-123');
        });
        it('should throw error for non-existent daily menu', async () => {
            MockedDailyMenuRepository.findById.mockResolvedValue(null);
            await expect(dailyMenu_service_1.DailyMenuService.deleteDailyMenu('nonexistent'))
                .rejects.toThrow('Daily menu with ID nonexistent not found');
        });
    });
    describe('cloneDailyMenu', () => {
        const targetDate = new Date('2024-01-20');
        it('should clone daily menu successfully', async () => {
            const sourceMenu = {
                id: 'source-123',
                schoolId: 'school-123',
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                availableQuantity: 100,
                notes: 'Original notes',
                metadata: JSON.stringify({ special: true }),
                menuItems: [{ id: 'item-1' }, { id: 'item-2' }]
            };
            const clonedMenu = { id: 'cloned-123', date: targetDate };
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(sourceMenu);
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'createDailyMenu').mockResolvedValue(clonedMenu);
            const result = await dailyMenu_service_1.DailyMenuService.cloneDailyMenu('source-123', targetDate);
            expect(result).toEqual(clonedMenu);
            expect(dailyMenu_service_1.DailyMenuService.createDailyMenu).toHaveBeenCalledWith({
                date: targetDate,
                schoolId: 'school-123',
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKEND,
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
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                menuItems: []
            };
            const clonedMenu = { id: 'cloned-123' };
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(sourceMenu);
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'createDailyMenu').mockResolvedValue(clonedMenu);
            await dailyMenu_service_1.DailyMenuService.cloneDailyMenu('source-123', targetDate, 'school-456');
            expect(dailyMenu_service_1.DailyMenuService.createDailyMenu).toHaveBeenCalledWith(expect.objectContaining({ schoolId: 'school-456' }));
        });
        it('should throw error for non-existent source menu', async () => {
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(null);
            await expect(dailyMenu_service_1.DailyMenuService.cloneDailyMenu('nonexistent', targetDate))
                .rejects.toThrow('Source daily menu with ID nonexistent not found');
        });
        it('should throw error when target date already has menu', async () => {
            const sourceMenu = { id: 'source-123', schoolId: 'school-123', category: dailyMenu_service_1.MenuCategory.LUNCH };
            const existingMenu = { id: 'existing-123' };
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(sourceMenu);
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue(existingMenu);
            await expect(dailyMenu_service_1.DailyMenuService.cloneDailyMenu('source-123', targetDate))
                .rejects.toThrow('Daily menu already exists for 2024-01-20');
        });
        it('should handle menu with no items', async () => {
            const sourceMenu = {
                id: 'source-123',
                schoolId: 'school-123',
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                menuItems: null
            };
            const clonedMenu = { id: 'cloned-123' };
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(sourceMenu);
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'createDailyMenu').mockResolvedValue(clonedMenu);
            await dailyMenu_service_1.DailyMenuService.cloneDailyMenu('source-123', targetDate);
            expect(dailyMenu_service_1.DailyMenuService.createDailyMenu).toHaveBeenCalledWith(expect.objectContaining({ menuItemIds: [] }));
        });
    });
    describe('getWeeklyMenuPlan', () => {
        const startDate = new Date('2024-01-15');
        const schoolId = 'school-123';
        it('should get weekly menu plan grouped by date', async () => {
            const mockMenus = [
                { id: 'menu-1', date: new Date('2024-01-15'), category: dailyMenu_service_1.MenuCategory.LUNCH },
                { id: 'menu-2', date: new Date('2024-01-15'), category: dailyMenu_service_1.MenuCategory.DESSERT },
                { id: 'menu-3', date: new Date('2024-01-16'), category: dailyMenu_service_1.MenuCategory.LUNCH }
            ];
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenusByDateRange').mockResolvedValue(mockMenus);
            const result = await dailyMenu_service_1.DailyMenuService.getWeeklyMenuPlan(schoolId, startDate);
            expect(result).toEqual({
                '2024-01-15': [mockMenus[0], mockMenus[1]],
                '2024-01-16': [mockMenus[2]]
            });
            expect(dailyMenu_service_1.DailyMenuService.getDailyMenusByDateRange).toHaveBeenCalledWith(schoolId, startDate, new Date('2024-01-21'));
        });
        it('should handle empty menu plan', async () => {
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenusByDateRange').mockResolvedValue([]);
            const result = await dailyMenu_service_1.DailyMenuService.getWeeklyMenuPlan(schoolId, startDate);
            expect(result).toEqual({});
        });
    });
    describe('getDayTypeFromDate', () => {
        it('should return WEEKDAY for Monday to Friday', async () => {
            const monday = new Date('2024-01-15');
            const friday = new Date('2024-01-19');
            const sourceMenu = { id: 'source-123', schoolId: 'school-123', category: dailyMenu_service_1.MenuCategory.LUNCH, menuItems: [] };
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(sourceMenu);
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'createDailyMenu').mockResolvedValue({ id: 'cloned' });
            await dailyMenu_service_1.DailyMenuService.cloneDailyMenu('source-123', monday);
            expect(dailyMenu_service_1.DailyMenuService.createDailyMenu).toHaveBeenCalledWith(expect.objectContaining({ dayType: dailyMenu_service_1.DayType.WEEKDAY }));
            await dailyMenu_service_1.DailyMenuService.cloneDailyMenu('source-123', friday);
            expect(dailyMenu_service_1.DailyMenuService.createDailyMenu).toHaveBeenCalledWith(expect.objectContaining({ dayType: dailyMenu_service_1.DayType.WEEKDAY }));
        });
        it('should return WEEKEND for Saturday and Sunday', async () => {
            const saturday = new Date('2024-01-20');
            const sunday = new Date('2024-01-21');
            const sourceMenu = { id: 'source-123', schoolId: 'school-123', category: dailyMenu_service_1.MenuCategory.LUNCH, menuItems: [] };
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(sourceMenu);
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'createDailyMenu').mockResolvedValue({ id: 'cloned' });
            await dailyMenu_service_1.DailyMenuService.cloneDailyMenu('source-123', saturday);
            expect(dailyMenu_service_1.DailyMenuService.createDailyMenu).toHaveBeenCalledWith(expect.objectContaining({ dayType: dailyMenu_service_1.DayType.WEEKEND }));
            await dailyMenu_service_1.DailyMenuService.cloneDailyMenu('source-123', sunday);
            expect(dailyMenu_service_1.DailyMenuService.createDailyMenu).toHaveBeenCalledWith(expect.objectContaining({ dayType: dailyMenu_service_1.DayType.WEEKEND }));
        });
    });
    describe('error handling', () => {
        it('should handle repository errors gracefully', async () => {
            const error = new Error('Database connection failed');
            MockedDailyMenuRepository.findByIdWithItems.mockRejectedValue(error);
            await expect(dailyMenu_service_1.DailyMenuService.getDailyMenuById('menu-123'))
                .rejects.toThrow('Database connection failed');
            expect(logger_1.logger.error).toHaveBeenCalledWith('Failed to get daily menu by ID', error, { dailyMenuId: 'menu-123' });
        });
        it('should handle cache errors gracefully', async () => {
            const cacheError = new Error('Redis connection failed');
            MockedCache.get.mockRejectedValue(cacheError);
            MockedDailyMenuRepository.findByIdWithItems.mockResolvedValue({ id: 'menu-123' });
            const result = await dailyMenu_service_1.DailyMenuService.getDailyMenuById('menu-123');
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
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: ['item-1']
            };
            const mockMenuItem = { id: 'item-1', available: true, category: dailyMenu_service_1.MenuCategory.LUNCH };
            const mockDailyMenu = { id: 'menu-123', ...validInput };
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            MockedMenuItemRepository.findById.mockResolvedValue(mockMenuItem);
            MockedDailyMenuRepository.create.mockResolvedValue(mockDailyMenu);
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(mockDailyMenu);
            MockedCache.clear = jest.fn().mockResolvedValue(true);
            await dailyMenu_service_1.DailyMenuService.createDailyMenu(validInput);
            expect(MockedCache.clear).toHaveBeenCalled();
        });
        it('should clear caches after update', async () => {
            const existingMenu = {
                id: 'menu-123',
                schoolId: 'school-123',
                date: new Date('2024-01-15'),
                category: dailyMenu_service_1.MenuCategory.LUNCH
            };
            MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu);
            MockedDailyMenuRepository.update.mockResolvedValue(existingMenu);
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(existingMenu);
            await dailyMenu_service_1.DailyMenuService.updateDailyMenu('menu-123', { notes: 'Updated' });
            expect(MockedCache.del).toHaveBeenCalledWith('daily_menu:menu-123');
        });
        it('should clear caches after delete', async () => {
            const existingMenu = {
                id: 'menu-123',
                schoolId: 'school-123',
                date: new Date('2024-01-15'),
                category: dailyMenu_service_1.MenuCategory.LUNCH
            };
            MockedDailyMenuRepository.findById.mockResolvedValue(existingMenu);
            MockedDailyMenuRepository.update.mockResolvedValue(existingMenu);
            await dailyMenu_service_1.DailyMenuService.deleteDailyMenu('menu-123');
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
                category: dailyMenu_service_1.MenuCategory.LUNCH,
                dayType: dailyMenu_service_1.DayType.WEEKDAY,
                menuItemIds: ['item-1']
            };
            const mockMenuItem = { id: 'item-1', available: true, category: dailyMenu_service_1.MenuCategory.LUNCH };
            const mockDailyMenu = { id: 'menu-123', ...validInput };
            MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            MockedMenuItemRepository.findById.mockResolvedValue(mockMenuItem);
            MockedDailyMenuRepository.create.mockResolvedValue(mockDailyMenu);
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(mockDailyMenu);
            MockedCache.clear.mockRejectedValue(new Error('Cache service down'));
            const result = await dailyMenu_service_1.DailyMenuService.createDailyMenu(validInput);
            expect(result).toEqual(mockDailyMenu);
            expect(logger_1.logger.warn).toHaveBeenCalledWith('Failed to clear caches', expect.any(Error), expect.objectContaining({ schoolId: 'school-123' }));
        });
    });
});
//# sourceMappingURL=dailyMenu.service.test.js.map