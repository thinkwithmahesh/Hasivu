/**
 * Menu Item Service
 * Manages individual menu items and their properties
 */

import { MenuItem, PrismaClient } from '@prisma/client';
import { MenuItemRepository, MenuCategory } from '../repositories/menuItem.repository';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';

// Re-export MenuCategory for convenience
export { MenuCategory } from '../repositories/menuItem.repository';

export interface CreateMenuItemInput {
  name: string;
  description?: string;
  category: MenuCategory;
  price: number;
  currency?: string;
  schoolId: string;
  available?: boolean;
  nutritionalInfo?: any;
  allergens?: string[];
  imageUrl?: string;
  originalPrice?: number;
  featured?: boolean;
  sortOrder?: number;
}

export interface UpdateMenuItemInput {
  name?: string;
  description?: string;
  category?: MenuCategory;
  price?: number;
  currency?: string;
  available?: boolean;
  nutritionalInfo?: any;
  allergens?: string[];
  imageUrl?: string;
  originalPrice?: number;
  featured?: boolean;
  sortOrder?: number;
}

export interface MenuItemFilters {
  schoolId?: string;
  category?: MenuCategory;
  available?: boolean;
  priceMin?: number;
  priceMax?: number;
  featured?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MenuItemListResult {
  items: MenuItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExtendedMenuItem extends Omit<MenuItem, 'allergens' | 'nutritionalInfo'> {
  allergens: string[];
  nutritionalInfo: any;
}

export interface NutritionalSummary {
  totalCalories: number;
  allergens: string[];
  nutritionalInfo: Record<string, number>;
}

export interface FeaturedItemsOptions {
  schoolId?: string;
  category?: MenuCategory;
  limit?: number;
}

export interface CategoryItemsOptions {
  schoolId?: string;
  available?: boolean;
  limit?: number;
}

export interface SortOrderUpdate {
  id: string;
  sortOrder: number;
}

export class MenuItemService {
  private static repository: MenuItemRepository;
  private static instance: MenuItemService;

  /**
   * Get singleton instance
   */
  public static getInstance(): MenuItemService {
    if (!MenuItemService.instance) {
      MenuItemService.instance = new MenuItemService();
    }
    return MenuItemService.instance;
  }

  /**
   * Create a new menu item
   */
  static async createMenuItem(input: CreateMenuItemInput): Promise<MenuItem> {
    // Validate input
    if (!input.name?.trim()) {
      throw new Error('Menu item name is required');
    }

    if (input.name.length > 200) {
      throw new Error('Menu item name cannot exceed 200 characters');
    }

    if (input.description && input.description.length > 1000) {
      throw new Error('Menu item description cannot exceed 1000 characters');
    }

    if (input.price <= 0) {
      throw new Error('Menu item price must be greater than 0');
    }

    if (input.originalPrice && input.originalPrice <= input.price) {
      throw new Error('Original price must be greater than current price');
    }

    // Check for duplicate name in same school
    const existing = await MenuItemRepository.findByNameAndSchool(input.name, input.schoolId);
    if (existing) {
      throw new Error(`Menu item with name "${input.name}" already exists for this school`);
    }

    const data = {
      name: input.name,
      description: input.description || null,
      category: input.category,
      price: input.price,
      currency: input.currency || 'INR',
      schoolId: input.schoolId,
      available: input.available ?? true,
      nutritionalInfo: input.nutritionalInfo ? JSON.stringify(input.nutritionalInfo) : null,
      allergens: input.allergens ? JSON.stringify(input.allergens) : null,
      imageUrl: input.imageUrl || null,
      originalPrice: input.originalPrice,
      featured: input.featured ?? false,
      sortOrder: input.sortOrder ?? 0,
      // Default values for required fields
      tags: [],
      preparationTime: 0,
      portionSize: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      vendorId: null,
      metadata: {},
    } as any;

    const menuItem = await MenuItemRepository.create(data);

    // Clear relevant caches
    await cache.clear();

    return menuItem;
  }

  /**
   * Get menu item by ID with caching
   */
  static async getMenuItemById(
    id: string,
    includeUnavailable: boolean = true
  ): Promise<MenuItem | null> {
    const cacheKey = `menu_item:${id}:${includeUnavailable}`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from repository
    const menuItem = await MenuItemRepository.findById(id);
    if (!menuItem) {
      logger.warn('Menu item not found', { menuItemId: id });
      return null;
    }

    if (!includeUnavailable && !menuItem.available) {
      return null;
    }

    // Cache for 5 minutes
    await cache.setex(cacheKey, 300, JSON.stringify(menuItem));

    return menuItem;
  }

  /**
   * Get paginated menu items with filters
   */
  static async getMenuItems(
    filters: MenuItemFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<MenuItemListResult> {
    const { page = 1, limit = 20, sortBy = 'sortOrder', sortOrder = 'asc' } = pagination;

    const skip = (page - 1) * limit;

    const result = await MenuItemRepository.findMany({
      filters,
      skip,
      take: limit,
      sortBy,
      sortOrder,
    });

    const totalPages = Math.ceil(result.total / limit);

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Search menu items
   */
  static async searchMenuItems(
    term: string,
    filters: MenuItemFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<MenuItemListResult> {
    if (!term.trim()) {
      return this.getMenuItems(filters, pagination);
    }

    const { page = 1, limit = 20, sortBy = 'sortOrder', sortOrder = 'asc' } = pagination;

    const skip = (page - 1) * limit;

    const result = await MenuItemRepository.search({
      query: term,
      filters,
      skip,
      take: limit,
      sortBy,
      sortOrder,
    });

    const totalPages = Math.ceil(result.total / limit);

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Update menu item
   */
  static async updateMenuItem(id: string, input: UpdateMenuItemInput): Promise<MenuItem> {
    // Validate input
    if (input.name && input.name.length > 200) {
      throw new Error('Menu item name cannot exceed 200 characters');
    }

    if (input.description && input.description.length > 1000) {
      throw new Error('Menu item description cannot exceed 1000 characters');
    }

    if (input.price !== undefined && input.price <= 0) {
      throw new Error('Menu item price must be greater than 0');
    }

    if (input.originalPrice && input.price !== undefined && input.originalPrice <= input.price) {
      throw new Error('Original price must be greater than current price');
    }

    // Check if item exists
    const existing = await MenuItemRepository.findById(id);
    if (!existing) {
      throw new Error(`Menu item with ID ${id} not found`);
    }

    // Check for duplicate name if name is being updated
    if (input.name && input.name !== existing.name && existing.schoolId) {
      const duplicate = await MenuItemRepository.findByNameAndSchool(input.name, existing.schoolId);
      if (duplicate) {
        throw new Error(`Menu item with name "${input.name}" already exists for this school`);
      }
    }

    const updateData: any = { ...input };
    if (input.allergens) {
      updateData.allergens = JSON.stringify(input.allergens);
    }
    if (input.nutritionalInfo) {
      updateData.nutritionalInfo = JSON.stringify(input.nutritionalInfo);
    }

    const updated = await MenuItemRepository.update(id, updateData);

    // Clear caches
    await cache.del(`menu_item:${id}:true`);
    await cache.del(`menu_item:${id}:false`);
    await cache.clear();

    return updated;
  }

  /**
   * Delete menu item (soft or hard delete)
   */
  static async deleteMenuItem(id: string, hard: boolean = false): Promise<MenuItem> {
    const existing = await MenuItemRepository.findById(id);
    if (!existing) {
      throw new Error(`Menu item with ID ${id} not found`);
    }

    let deleted: MenuItem;

    if (hard) {
      deleted = await MenuItemRepository.delete(id);
    } else {
      // Soft delete - set available to false
      deleted = await MenuItemRepository.update(id, { available: false });
    }

    // Clear caches
    await cache.del(`menu_item:${id}:true`);
    await cache.del(`menu_item:${id}:false`);
    await cache.clear();

    return deleted;
  }

  /**
   * Update sort orders for multiple items
   */
  static async updateSortOrders(updates: SortOrderUpdate[]): Promise<void> {
    if (updates.length > 100) {
      throw new Error('Cannot update more than 100 items at once');
    }

    if (updates.length === 0) {
      return;
    }

    // Validate all items exist
    const ids = updates.map(u => u.id);
    const existingItems = await MenuItemRepository.findMany({
      filters: { ids },
      take: ids.length,
    });

    if (existingItems.total !== ids.length) {
      const foundIds = new Set(existingItems.items.map((item: MenuItem) => item.id));
      const missingIds = ids.filter(id => !foundIds.has(id));
      throw new Error(`Menu items not found: ${missingIds.join(', ')}`);
    }

    await MenuItemRepository.batchUpdateSortOrders(updates);

    // Clear caches
    await cache.clear();
  }

  /**
   * Toggle featured status
   */
  static async toggleFeatured(id: string): Promise<MenuItem> {
    const item = await this.getMenuItemById(id);
    if (!item) {
      throw new Error(`Menu item with ID ${id} not found`);
    }

    return this.updateMenuItem(id, { featured: !item.featured });
  }

  /**
   * Get menu items filtered by allergens
   */
  static async getMenuItemsByAllergens(allergens: string[]): Promise<MenuItem[]> {
    const result = await this.getMenuItems();
    return result.items.filter(item => {
      if (!item.allergens) {
        return true; // Include items with no allergen data
      }
      try {
        const itemAllergens = JSON.parse(item.allergens as string);
        if (!Array.isArray(itemAllergens)) {
          return true; // Include items with invalid allergen data
        }
        return !allergens.some(allergen =>
          itemAllergens.some((itemAllergen: string) =>
            itemAllergen.toLowerCase().includes(allergen.toLowerCase())
          )
        );
      } catch (error) {
        return true; // Include items with invalid JSON
      }
    });
  }

  /**
   * Get nutritional summary for multiple items
   */
  static async getNutritionalSummary(itemIds: string[]): Promise<NutritionalSummary> {
    let totalCalories = 0;
    const allAllergens = new Set<string>();
    const nutritionalTotals: Record<string, number> = {};

    for (const id of itemIds) {
      const item = await this.getMenuItemById(id);
      if (item) {
        // Parse nutritional info
        if (item.nutritionalInfo) {
          try {
            const nutrition =
              typeof item.nutritionalInfo === 'string'
                ? JSON.parse(item.nutritionalInfo)
                : item.nutritionalInfo;

            if (nutrition.calories) {
              totalCalories += nutrition.calories;
            }

            // Aggregate nutritional values
            Object.entries(nutrition).forEach(([key, value]) => {
              if (typeof value === 'number') {
                nutritionalTotals[key] = (nutritionalTotals[key] || 0) + value;
              }
            });
          } catch (error) {
            // Skip invalid nutritional info
          }
        }

        // Collect allergens
        if (item.allergens) {
          try {
            const allergens = JSON.parse(item.allergens as string);
            if (Array.isArray(allergens)) {
              allergens.forEach((allergen: string) => allAllergens.add(allergen));
            }
          } catch (error) {
            // Skip invalid allergens
          }
        }
      }
    }

    return {
      totalCalories,
      allergens: Array.from(allAllergens),
      nutritionalInfo: nutritionalTotals,
    };
  }

  /**
   * Get featured items
   */
  static async getFeaturedItems(options: FeaturedItemsOptions = {}): Promise<MenuItem[]> {
    const filters: MenuItemFilters = {
      featured: true,
      available: true,
      schoolId: options.schoolId,
      category: options.category,
    };

    const result = await this.getMenuItems(filters, {
      limit: options.limit || 10,
      sortBy: 'sortOrder',
      sortOrder: 'asc',
    });

    return result.items;
  }

  /**
   * Get menu items by category
   */
  static async getMenuItemsByCategory(
    category: MenuCategory,
    options: CategoryItemsOptions = {}
  ): Promise<MenuItem[]> {
    const filters: MenuItemFilters = {
      category,
      available: options.available ?? true,
      schoolId: options.schoolId,
    };

    const result = await this.getMenuItems(filters, {
      limit: options.limit || 50,
      sortBy: 'sortOrder',
      sortOrder: 'asc',
    });

    return result.items;
  }

  /**
   * Toggle availability
   */
  static async toggleAvailability(id: string): Promise<MenuItem> {
    const item = await this.getMenuItemById(id);
    if (!item) {
      throw new Error(`Menu item with ID ${id} not found`);
    }

    return this.updateMenuItem(id, { available: !item.available });
  }

  /**
   * Static method: Create a new menu item
   */
  static async create(input: CreateMenuItemInput): Promise<MenuItem> {
    return await MenuItemService.createMenuItem(input);
  }

  /**
   * Static method: Get menu item by ID
   */
  static async findById(id: string): Promise<MenuItem | null> {
    return await MenuItemService.getMenuItemById(id, true);
  }

  /**
   * Static method: Get menu items by school ID
   */
  static async findBySchool(
    schoolId: string,
    includeUnavailable: boolean = true
  ): Promise<MenuItem[]> {
    const result = await MenuItemService.getMenuItems({ schoolId }, { limit: 1000 });
    if (!includeUnavailable) {
      return result.items.filter(item => item.available);
    }
    return result.items;
  }

  /**
   * Static method: Find menu items by category
   */
  static async findByCategory(schoolId: string, category: MenuCategory): Promise<MenuItem[]> {
    return await MenuItemService.getMenuItemsByCategory(category, { schoolId, available: true });
  }

  /**
   * Static method: Search menu items
   */
  static async search(schoolId: string, query: string): Promise<MenuItem[]> {
    if (!query.trim()) {
      return [];
    }
    const result = await MenuItemService.searchMenuItems(
      query,
      { schoolId, available: true },
      { limit: 100 }
    );
    return result.items;
  }

  /**
   * Static method: Get menu statistics
   */
  static async getMenuStats(schoolId?: string): Promise<{
    totalItems: number;
    averagePrice: number;
    byCategory: Record<MenuCategory, number>;
  }> {
    const prisma = new PrismaClient();

    try {
      const where = schoolId ? { schoolId } : {};

      // Get total count and average price
      const aggregateResult = await prisma.menuItem.aggregate({
        where,
        _count: { id: true },
        _avg: { price: true },
      });

      // Get count by category
      const categoryStats = await prisma.menuItem.groupBy({
        by: ['category'],
        where,
        _count: { category: true },
      });

      const byCategory: Record<MenuCategory, number> = {} as Record<MenuCategory, number>;
      categoryStats.forEach((stat: any) => {
        byCategory[stat.category as MenuCategory] = stat._count.category;
      });

      return {
        totalItems: aggregateResult._count.id || 0,
        averagePrice: Number(aggregateResult._avg.price) || 0,
        byCategory,
      };
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Helper method to extend menu item with parsed JSON fields
   */
  private static extendMenuItem(item: MenuItem): ExtendedMenuItem {
    return {
      ...item,
      allergens: item.allergens ? JSON.parse(item.allergens as string) : [],
      nutritionalInfo: item.nutritionalInfo ? JSON.parse(item.nutritionalInfo as string) : {},
    };
  }
}

// Export for backward compatibility
export default MenuItemService;
