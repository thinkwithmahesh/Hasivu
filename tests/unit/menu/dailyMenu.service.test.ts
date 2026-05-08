/**
 * DailyMenuService — aligned with DailyMenuRepository.findByDate / findById / findByDateRange and cache.
 */

jest.mock('../../../src/repositories/dailyMenu.repository', () => ({
  DailyMenuRepository: {
    findByDate: jest.fn(),
    findById: jest.fn(),
    findByDateRange: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/menuItem.repository', () => ({
  MenuItemRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('../../../src/utils/cache', () => ({
  cache: {
    get: jest.fn(),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { DailyMenuService, MenuCategory, DayType } from '../../../src/services/dailyMenu.service';
import { DailyMenuRepository } from '../../../src/repositories/dailyMenu.repository';
import { MenuItemRepository } from '../../../src/repositories/menuItem.repository';
import { cache } from '../../../src/utils/cache';

const mockedDailyMenu = jest.mocked(DailyMenuRepository);
const mockedMenuItem = jest.mocked(MenuItemRepository);
const mockedCache = jest.mocked(cache);

describe('DailyMenuService', () => {
  const futureDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(12, 0, 0, 0);
    return d;
  };

  const baseCreateInput = () => ({
    date: futureDate(),
    schoolId: 'school-123',
    category: MenuCategory.LUNCH,
    dayType: DayType.WEEKDAY,
    menuItemIds: ['item-1', 'item-2'],
    availableQuantity: 100,
    notes: 'Notes',
  });

  const lunchItems = [
    { id: 'item-1', name: 'Pizza', category: MenuCategory.LUNCH, available: true },
    { id: 'item-2', name: 'Pasta', category: MenuCategory.LUNCH, available: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (mockedCache.get as jest.Mock).mockResolvedValue(null);
  });

  describe('createDailyMenu', () => {
    it('creates a daily menu and returns hydrated record', async () => {
      const input = baseCreateInput();
      const createdRow = {
        id: 'daily-menu-123',
        schoolId: input.schoolId,
        date: input.date,
        items: JSON.stringify(input.menuItemIds),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedDailyMenu.findByDate.mockResolvedValue(null);
      mockedMenuItem.findById
        .mockResolvedValueOnce(lunchItems[0] as never)
        .mockResolvedValueOnce(lunchItems[1] as never);
      mockedDailyMenu.create.mockResolvedValue(createdRow as never);
      mockedDailyMenu.findById.mockResolvedValue(createdRow as never);

      const result = await DailyMenuService.createDailyMenu(input);

      expect(mockedDailyMenu.findByDate).toHaveBeenCalledWith(input.schoolId, input.date);
      expect(mockedDailyMenu.create).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'daily-menu-123', menuItems: [] });
      expect(mockedCache.setex).toHaveBeenCalled();
    });

    it('validates required date', async () => {
      await expect(
        DailyMenuService.createDailyMenu({ ...baseCreateInput(), date: null as any })
      ).rejects.toThrow('Date is required');
    });

    it('validates school id', async () => {
      await expect(
        DailyMenuService.createDailyMenu({ ...baseCreateInput(), schoolId: '' })
      ).rejects.toThrow('School ID is required');
    });

    it('validates menu items exist', async () => {
      const input = baseCreateInput();
      mockedDailyMenu.findByDate.mockResolvedValue(null);
      mockedMenuItem.findById.mockResolvedValueOnce(lunchItems[0] as never).mockResolvedValueOnce(null);

      await expect(DailyMenuService.createDailyMenu(input)).rejects.toThrow(
        'Menu items not found: item-2'
      );
    });
  });

  describe('getDailyMenuById', () => {
    it('returns cached payload when present', async () => {
      const payload = { id: 'm1', date: new Date().toISOString(), menuItems: [] };
      (mockedCache.get as jest.Mock).mockResolvedValue(JSON.stringify(payload));

      const out = await DailyMenuService.getDailyMenuById('m1');
      expect(out).toEqual(payload);
      expect(mockedDailyMenu.findById).not.toHaveBeenCalled();
    });

    it('loads from repository and caches when cache miss', async () => {
      const row = {
        id: 'm2',
        date: new Date('2026-06-10'),
        schoolId: 's1',
        items: '[]',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockedDailyMenu.findById.mockResolvedValue(row as never);

      const out = await DailyMenuService.getDailyMenuById('m2');
      expect(out).toMatchObject({ id: 'm2', menuItems: [] });
      expect(mockedDailyMenu.findById).toHaveBeenCalledWith('m2');
      expect(mockedCache.setex).toHaveBeenCalledWith('daily_menu:m2', 600, expect.any(String));
    });

    it('returns null when not found', async () => {
      mockedDailyMenu.findById.mockResolvedValue(null);
      const out = await DailyMenuService.getDailyMenuById('missing');
      expect(out).toBeNull();
    });
  });

  describe('getDailyMenusByDateRange', () => {
    it('returns menus from repository', async () => {
      const menus = [{ id: 'a', date: new Date('2026-01-01') } as never];
      mockedDailyMenu.findByDateRange.mockResolvedValue(menus);

      const out = await DailyMenuService.getDailyMenusByDateRange(
        'school-1',
        new Date('2026-01-01'),
        new Date('2026-01-07')
      );

      expect(mockedDailyMenu.findByDateRange).toHaveBeenCalledWith(
        'school-1',
        new Date('2026-01-01'),
        new Date('2026-01-07')
      );
      expect(out).toHaveLength(1);
      expect(out[0]).toMatchObject({ id: 'a', menuItems: [] });
    });
  });

  describe('getDailyMenuByDate', () => {
    it('uses cache then repository', async () => {
      const keyPayload = [{ id: 'd1', date: new Date('2026-03-01'), menuItems: [] }];
      (mockedCache.get as jest.Mock).mockResolvedValueOnce(null);
      mockedDailyMenu.findByDateRange.mockResolvedValue(keyPayload as never);

      const out = await DailyMenuService.getDailyMenuByDate('school-1', new Date('2026-03-01'));

      expect(out).toEqual(keyPayload);
      expect(mockedDailyMenu.findByDateRange).toHaveBeenCalledWith(
        'school-1',
        new Date('2026-03-01'),
        new Date('2026-03-01')
      );
      expect(mockedCache.setex).toHaveBeenCalled();
    });
  });
});
