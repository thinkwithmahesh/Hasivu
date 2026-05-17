/**
 * Menu item / menu plan services — aligned with current `MenuItemService` + `MenuPlanService` APIs.
 */

jest.mock('../../../src/utils/cache', () => ({
  cache: {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(1),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../src/repositories/menuItem.repository', () => {
  const actual = jest.requireActual('../../../src/repositories/menuItem.repository') as typeof import('../../../src/repositories/menuItem.repository');
  return {
    MenuCategory: actual.MenuCategory,
    MenuItemRepository: {
      findByNameAndSchool: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      batchUpdateSortOrders: jest.fn().mockResolvedValue(undefined),
    },
  };
});

jest.mock('../../../src/database/DatabaseManager', () => {
  const menuPlan = {
    create: jest.fn().mockResolvedValue({
      id: 'plan-1',
      schoolId: 's1',
      name: 'Week 1',
      startDate: new Date(),
      endDate: new Date(),
    }),
    update: jest.fn().mockImplementation(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
      Promise.resolve({ id: where.id, name: 'Renamed', ...data })
    ),
  };
  return {
    prisma: { menuPlan },
    DatabaseManager: {
      getInstance: () => ({ getClient: () => ({ menuPlan }) }),
    },
  };
});

import { MenuItemService, MenuCategory } from '../../../src/services/menuItem.service';
import { MenuPlanService } from '../../../src/services/menuPlan.service';
import { MenuItemRepository } from '../../../src/repositories/menuItem.repository';
import { cache } from '../../../src/utils/cache';

const repo = MenuItemRepository as jest.Mocked<typeof MenuItemRepository>;

describe('MenuItemService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    repo.findByNameAndSchool.mockResolvedValue(null);
    repo.create.mockResolvedValue({
      id: 'item-1',
      name: 'Test',
      category: MenuCategory.LUNCH,
      price: 100,
      schoolId: 'school-1',
    } as never);
  });

  it('createMenuItem persists when no duplicate name', async () => {
    const item = await MenuItemService.createMenuItem({
      name: 'Paneer Tikka',
      description: 'Grilled',
      category: MenuCategory.LUNCH,
      price: 250,
      schoolId: 'school-1',
    });
    expect(item.id).toBe('item-1');
    expect(repo.findByNameAndSchool).toHaveBeenCalledWith('Paneer Tikka', 'school-1');
    expect(repo.create).toHaveBeenCalled();
    expect(cache.clear).toHaveBeenCalled();
  });

  it('createMenuItem rejects duplicate name in same school', async () => {
    repo.findByNameAndSchool.mockResolvedValue({ id: 'other' } as never);
    await expect(
      MenuItemService.createMenuItem({
        name: 'Dup',
        category: MenuCategory.DINNER,
        price: 10,
        schoolId: 's1',
      })
    ).rejects.toThrow(/already exists for this school/);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('createMenuItem rejects invalid price', async () => {
    await expect(
      MenuItemService.createMenuItem({
        name: 'X',
        category: MenuCategory.SNACKS,
        price: 0,
        schoolId: 's1',
      })
    ).rejects.toThrow('Menu item price must be greater than 0');
  });

  it('getMenuItems delegates to repository.findMany', async () => {
    repo.findMany.mockResolvedValue({ items: [], total: 0 } as never);
    const out = await MenuItemService.getMenuItems({ schoolId: 's1' }, { page: 1, limit: 10 });
    expect(out.total).toBe(0);
    expect(repo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ schoolId: 's1' }),
        skip: 0,
        take: 10,
      })
    );
  });

  it('searchMenuItems with blank term falls back to getMenuItems', async () => {
    repo.findMany.mockResolvedValue({ items: [], total: 0 } as never);
    await MenuItemService.searchMenuItems('   ', {}, { page: 1, limit: 5 });
    expect(repo.findMany).toHaveBeenCalled();
    expect(repo.search).not.toHaveBeenCalled();
  });

  it('updateMenuItem checks duplicate when renaming', async () => {
    repo.findById.mockResolvedValue({
      id: 'i1',
      name: 'Old',
      schoolId: 's1',
    } as never);
    repo.findByNameAndSchool.mockResolvedValue(null);
    repo.update.mockResolvedValue({ id: 'i1', name: 'New' } as never);

    const updated = await MenuItemService.updateMenuItem('i1', { name: 'New' });
    expect(updated.name).toBe('New');
    expect(repo.findByNameAndSchool).toHaveBeenCalledWith('New', 's1');
  });
});

describe('MenuPlanService', () => {
  it('create returns stub plan with id', async () => {
    const svc = MenuPlanService.getInstance();
    const plan = await svc.create({
      schoolId: 's1',
      name: 'Week 1',
      startDate: new Date(),
      endDate: new Date(),
      items: [],
    });
    expect(plan.schoolId).toBe('s1');
    expect(plan.name).toBe('Week 1');
    expect(plan.id).toBe('plan-1');
  });

  it('update merges id and payload', async () => {
    const svc = MenuPlanService.getInstance();
    const out = await svc.update('p1', { name: 'Renamed' });
    expect(out.id).toBe('p1');
    expect(out.name).toBe('Renamed');
  });
});
