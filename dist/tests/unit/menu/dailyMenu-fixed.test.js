"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repository_mock_1 = require("../../mocks/repository.mock");
const dailyMenu_service_1 = require("../../../src/services/dailyMenu.service");
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
        (0, repository_mock_1.resetAllMocks)();
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
            notes: 'Special menu'
        };
        const mockMenuItems = [
            { id: 'item-1', name: 'Pizza', category: dailyMenu_service_1.MenuCategory.LUNCH, available: true },
            { id: 'item-2', name: 'Pasta', category: dailyMenu_service_1.MenuCategory.LUNCH, available: true }
        ];
        it('should create daily menu successfully', async () => {
            const mockDailyMenu = {
                id: 'daily-menu-123',
                ...validInput,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            repository_mock_1.MockedDailyMenuRepository.findByDateRange.mockResolvedValue([]);
            repository_mock_1.MockedMenuItemRepository.findById
                .mockResolvedValueOnce(mockMenuItems[0])
                .mockResolvedValueOnce(mockMenuItems[1]);
            repository_mock_1.MockedDailyMenuRepository.create.mockResolvedValue(mockDailyMenu);
            jest.spyOn(dailyMenu_service_1.DailyMenuService, 'getDailyMenuById').mockResolvedValue(mockDailyMenu);
            const result = await dailyMenu_service_1.DailyMenuService.createDailyMenu(validInput);
            expect(result).toEqual(mockDailyMenu);
            expect(repository_mock_1.MockedDailyMenuRepository.findByDateRange).toHaveBeenCalledWith(validInput.date, validInput.date, validInput.schoolId);
            expect(repository_mock_1.MockedDailyMenuRepository.create).toHaveBeenCalled();
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
        it('should not allow creating daily menu for past dates', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const invalidInput = { ...validInput, date: pastDate };
            await expect(dailyMenu_service_1.DailyMenuService.createDailyMenu(invalidInput))
                .rejects.toThrow('Cannot create daily menu for past dates');
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
            repository_mock_1.MockedCacheService.get.mockResolvedValue(serializedMenu);
            const result = await dailyMenu_service_1.DailyMenuService.getDailyMenuById('menu-123');
            const expectedResult = JSON.parse(serializedMenu);
            expect(result).toEqual(expectedResult);
            expect(repository_mock_1.MockedCacheService.get).toHaveBeenCalledWith('daily_menu:menu-123');
            expect(repository_mock_1.MockedDailyMenuRepository.findByIdWithItems).not.toHaveBeenCalled();
        });
        it('should fetch and cache daily menu when not cached', async () => {
            const mockMenu = { id: 'menu-123', date: new Date() };
            repository_mock_1.MockedCacheService.get.mockResolvedValue(null);
            repository_mock_1.MockedDailyMenuRepository.findByIdWithItems.mockResolvedValue(mockMenu);
            const result = await dailyMenu_service_1.DailyMenuService.getDailyMenuById('menu-123');
            expect(result).toEqual(mockMenu);
            expect(repository_mock_1.MockedDailyMenuRepository.findByIdWithItems).toHaveBeenCalledWith('menu-123');
            expect(repository_mock_1.MockedCacheService.set).toHaveBeenCalled();
        });
        it('should return null for non-existent daily menu', async () => {
            repository_mock_1.MockedCacheService.get.mockResolvedValue(null);
            repository_mock_1.MockedDailyMenuRepository.findByIdWithItems.mockResolvedValue(null);
            const result = await dailyMenu_service_1.DailyMenuService.getDailyMenuById('nonexistent');
            expect(result).toBeNull();
            expect(repository_mock_1.MockedLogger.warn).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=dailyMenu-fixed.test.js.map