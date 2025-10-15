/**
 * Menu Item Repository
 * Data access layer for menu items
 */

import { PrismaClient, MenuItem, Prisma } from '@prisma/client';

/**
 * Menu Category Enum
 * Categorizes menu items for organization and filtering
 */
export enum MenuCategory {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACKS = 'SNACKS',
  BEVERAGES = 'BEVERAGES',
  DESSERTS = 'DESSERTS',
}

export interface MenuItemFindOptions {
  filters?: {
    schoolId?: string;
    category?: MenuCategory;
    available?: boolean;
    priceMin?: number;
    priceMax?: number;
    featured?: boolean;
    search?: string;
    ids?: string[];
  };
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MenuItemFindResult {
  items: MenuItem[];
  total: number;
}

export interface MenuItemSearchOptions extends MenuItemFindOptions {
  query: string;
}

export interface SortOrderUpdate {
  id: string;
  sortOrder: number;
}

export class MenuItemRepository {
  private static prisma: PrismaClient;

  static initialize() {
    if (!MenuItemRepository.prisma) {
      MenuItemRepository.prisma = new PrismaClient();
    }
  }

  static async findAll(schoolId?: string): Promise<MenuItem[]> {
    MenuItemRepository.initialize();
    return await MenuItemRepository.prisma.menuItem.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { name: 'asc' },
    });
  }

  static async findById(id: string): Promise<MenuItem | null> {
    MenuItemRepository.initialize();
    return await MenuItemRepository.prisma.menuItem.findUnique({
      where: { id },
    });
  }

  static async findByNameAndSchool(name: string, schoolId: string): Promise<MenuItem | null> {
    MenuItemRepository.initialize();
    return await MenuItemRepository.prisma.menuItem.findFirst({
      where: {
        name,
        schoolId,
      },
    });
  }

  static async findBySchool(schoolId: string): Promise<MenuItem[]> {
    MenuItemRepository.initialize();
    return await MenuItemRepository.prisma.menuItem.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });
  }

  static async findByCategory(schoolId: string, category: string): Promise<MenuItem[]> {
    MenuItemRepository.initialize();
    return await MenuItemRepository.prisma.menuItem.findMany({
      where: {
        schoolId,
        category,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async create(data: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuItem> {
    MenuItemRepository.initialize();
    return await MenuItemRepository.prisma.menuItem.create({
      data: data as any,
    });
  }

  static async update(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
    MenuItemRepository.initialize();
    return await MenuItemRepository.prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<MenuItem> {
    MenuItemRepository.initialize();
    return await MenuItemRepository.prisma.menuItem.delete({
      where: { id },
    });
  }

  static async search(options: MenuItemSearchOptions): Promise<MenuItemFindResult> {
    MenuItemRepository.initialize();
    const {
      query,
      filters = {},
      skip = 0,
      take = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = options;

    const where: Prisma.MenuItemWhereInput = {
      AND: [
        // Search query
        {
          OR: [{ name: { contains: query } }, { description: { contains: query } }],
        },
        // Filters
        ...(filters.schoolId ? [{ schoolId: filters.schoolId }] : []),
        ...(filters.category ? [{ category: filters.category }] : []),
        ...(filters.available !== undefined ? [{ available: filters.available }] : []),
        ...(filters.featured !== undefined ? [{ featured: filters.featured }] : []),
        ...(filters.priceMin !== undefined || filters.priceMax !== undefined
          ? [
              {
                price: {
                  ...(filters.priceMin !== undefined ? { gte: filters.priceMin } : {}),
                  ...(filters.priceMax !== undefined ? { lte: filters.priceMax } : {}),
                },
              },
            ]
          : []),
      ],
    };

    const [items, total] = await Promise.all([
      MenuItemRepository.prisma.menuItem.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      MenuItemRepository.prisma.menuItem.count({ where }),
    ]);

    return { items, total };
  }

  static async findMany(options: MenuItemFindOptions): Promise<MenuItemFindResult> {
    MenuItemRepository.initialize();
    const { filters = {}, skip = 0, take = 20, sortBy = 'name', sortOrder = 'asc' } = options;

    const whereConditions: Prisma.MenuItemWhereInput[] = [];

    if (filters.schoolId) {
      whereConditions.push({ schoolId: filters.schoolId });
    }

    if (filters.category) {
      whereConditions.push({ category: filters.category });
    }

    if (filters.available !== undefined) {
      whereConditions.push({ available: filters.available });
    }

    if (filters.featured !== undefined) {
      whereConditions.push({ featured: filters.featured });
    }

    if (filters.search) {
      whereConditions.push({
        OR: [{ name: { contains: filters.search } }, { description: { contains: filters.search } }],
      });
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      whereConditions.push({
        price: {
          ...(filters.priceMin !== undefined ? { gte: filters.priceMin } : {}),
          ...(filters.priceMax !== undefined ? { lte: filters.priceMax } : {}),
        },
      });
    }

    if (filters.ids) {
      whereConditions.push({ id: { in: filters.ids } });
    }

    const where: Prisma.MenuItemWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [items, total] = await Promise.all([
      MenuItemRepository.prisma.menuItem.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      MenuItemRepository.prisma.menuItem.count({ where }),
    ]);

    return { items, total };
  }

  static async batchUpdateSortOrders(updates: SortOrderUpdate[]): Promise<void> {
    MenuItemRepository.initialize();
    const updatePromises = updates.map(({ id, sortOrder }) =>
      MenuItemRepository.prisma.menuItem.update({
        where: { id },
        data: { sortOrder },
      })
    );

    await MenuItemRepository.prisma.$transaction(updatePromises);
  }

  static async nameExists(name: string, schoolId: string): Promise<boolean> {
    MenuItemRepository.initialize();
    const existing = await MenuItemRepository.prisma.menuItem.findFirst({
      where: {
        name,
        schoolId,
      },
    });
    return !!existing;
  }
}

export default MenuItemRepository;
