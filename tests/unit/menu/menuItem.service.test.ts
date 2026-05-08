/**
 * MenuItemService — aligned with MenuItemRepository + cache (get / setex / del / clear).
 */

jest.mock('../../../src/repositories/menuItem.repository', () => ({
  MenuItemRepository: {
    findByNameAndSchool: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    search: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    batchUpdateSortOrders: jest.fn(),
  },
}));

jest.mock('../../../src/utils/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../src/services/database.service', () => ({
  DatabaseService: {
    client: {},
    getInstance: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    getHealth: jest.fn(),
    isConnected: jest.fn(),
  },
}));

import { MenuItemService } from '../../../src/services/menuItem.service';
import { MenuItemRepository } from '../../../src/repositories/menuItem.repository';
import { cache } from '../../../src/utils/cache';

const repo = jest.mocked(MenuItemRepository);
const mockedCache = jest.mocked(cache);

describe('MenuItemService', () => {
  const validInput = {
    name: 'Pizza Margherita',
    description: 'Classic',
    category: 'LUNCH' as any,
    price: 12.99,
    currency: 'INR',
    schoolId: 'school-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockedCache.get as jest.Mock).mockResolvedValue(null);
    (mockedCache.setex as jest.Mock).mockResolvedValue('OK');
    (mockedCache.del as jest.Mock).mockResolvedValue(1);
    (mockedCache.clear as jest.Mock).mockResolvedValue(undefined);
  });

  describe('createMenuItem', () => {
    it('creates when name is unique', async () => {
      repo.findByNameAndSchool.mockResolvedValue(null);
      const created = { id: 'item-1', ...validInput, available: true } as any;
      repo.create.mockResolvedValue(created);

      const result = await MenuItemService.createMenuItem(validInput);

      expect(result.id).toBe('item-1');
      expect(repo.create).toHaveBeenCalled();
      expect(mockedCache.clear).toHaveBeenCalled();
    });

    it('rejects duplicate name in same school', async () => {
      repo.findByNameAndSchool.mockResolvedValue({ id: 'existing' } as any);
      await expect(MenuItemService.createMenuItem(validInput)).rejects.toThrow('already exists');
    });

    it('rejects empty name', async () => {
      await expect(MenuItemService.createMenuItem({ ...validInput, name: '  ' })).rejects.toThrow(
        'name is required'
      );
    });
  });

  describe('getMenuItemById', () => {
    it('returns cached JSON when present', async () => {
      const payload = { id: 'x', name: 'Cached', available: true };
      (mockedCache.get as jest.Mock).mockResolvedValue(JSON.stringify(payload));

      const out = await MenuItemService.getMenuItemById('x');
      expect(out).toEqual(payload);
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('loads from repository and caches on miss', async () => {
      const row = { id: 'y', name: 'DB', available: true } as any;
      repo.findById.mockResolvedValue(row);

      const out = await MenuItemService.getMenuItemById('y');
      expect(out).toEqual(row);
      expect(repo.findById).toHaveBeenCalledWith('y');
      expect(mockedCache.setex).toHaveBeenCalledWith('menu_item:y:true', 300, expect.any(String));
    });

    it('returns null when not found', async () => {
      repo.findById.mockResolvedValue(null);
      expect(await MenuItemService.getMenuItemById('missing')).toBeNull();
    });
  });

  describe('getMenuItems', () => {
    it('delegates to repository findMany with pagination', async () => {
      repo.findMany.mockResolvedValue({ items: [], total: 0 });
      const result = await MenuItemService.getMenuItems(
        { schoolId: 'school-123' },
        { page: 1, limit: 20 }
      );
      expect(result.items).toEqual([]);
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { schoolId: 'school-123' },
          skip: 0,
          take: 20,
        })
      );
    });
  });

  describe('updateMenuItem', () => {
    it('updates and clears caches', async () => {
      repo.findById.mockResolvedValue({ id: 'i1', name: 'Old', schoolId: 's1' } as any);
      repo.findByNameAndSchool.mockResolvedValue(null);
      repo.update.mockResolvedValue({ id: 'i1', name: 'New' } as any);

      const out = await MenuItemService.updateMenuItem('i1', { name: 'New' });
      expect(out.name).toBe('New');
      expect(mockedCache.del).toHaveBeenCalledWith('menu_item:i1:true');
      expect(mockedCache.del).toHaveBeenCalledWith('menu_item:i1:false');
      expect(mockedCache.clear).toHaveBeenCalled();
    });
  });
});
