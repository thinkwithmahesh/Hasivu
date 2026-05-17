/**
 * Menu Service
 * Business logic for menu and menu item management
 */

import { PrismaClient, MenuItem, MenuPlan } from '@prisma/client';
import { DatabaseService } from './database.service';
import { RedisService } from './redis.service';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface MenuItemFilters {
  schoolId?: string;
  category?: string;
  available?: boolean;
  dietaryRestrictions?: string[];
  allergens?: string[];
  nutritionalInfo?: {
    minCalories?: number;
    maxCalories?: number;
    minProtein?: number;
    maxProtein?: number;
  };
}

export interface CreateMenuItemData {
  schoolId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  allergens?: string[];
  dietaryRestrictions?: string[];
  preparationTime?: number; // in minutes
  available: boolean;
  maxDailyQuantity?: number;
  tags?: string[];
}

export interface UpdateMenuItemData extends Partial<CreateMenuItemData> {
  id: string;
}

export interface MenuPlanData {
  schoolId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  mealTypes: string[];
}

export interface MenuSlotData {
  menuPlanId: string;
  menuItemId: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity: number;
  price: number;
  isAvailable: boolean;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface BulkMenuItemUpdate {
  items: Array<{
    id: string;
    updates: Partial<CreateMenuItemData>;
  }>;
}

export interface MenuAnalytics {
  totalItems: number;
  activeItems: number;
  itemsByCategory: Record<string, number>;
  averagePrice: number;
  popularItems: Array<{
    id: string;
    name: string;
    orderCount: number;
    revenue: number;
  }>;
  nutritionalStats: {
    averageCalories: number;
    averageProtein: number;
    commonAllergens: string[];
  };
}

export class MenuService {
  private static instance: MenuService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = DatabaseService.getInstance().client;
    logger.info('MenuService initialized');
  }

  public static getInstance(): MenuService {
    if (!MenuService.instance) {
      MenuService.instance = new MenuService();
    }
    return MenuService.instance;
  }

  // Menu Item CRUD Operations
  async createMenuItem(data: CreateMenuItemData): Promise<ServiceResponse<MenuItem>> {
    try {
      // Validate required fields
      if (!data.name || !data.price || !data.category || !data.schoolId) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: name, price, category, schoolId',
          },
        };
      }

      // Validate nutritional info if provided
      if (data.nutritionalInfo) {
        const { calories, protein, carbs, fat } = data.nutritionalInfo;
        if (calories < 0 || protein < 0 || carbs < 0 || fat < 0) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Nutritional values cannot be negative',
            },
          };
        }
      }

      // Check for duplicate name in same school
      const existingItem = await this.prisma.menuItem.findFirst({
        where: {
          name: data.name,
          schoolId: data.schoolId,
        },
      });

      if (existingItem) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_ITEM',
            message: 'Menu item with this name already exists in the school',
          },
        };
      }

      const menuItem = await this.prisma.menuItem.create({
        data: {
          id: uuidv4(),
          schoolId: data.schoolId,
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          imageUrl: data.imageUrl,
          nutritionalInfo: data.nutritionalInfo ? JSON.stringify(data.nutritionalInfo) : null,
          allergens: data.allergens ? JSON.stringify(data.allergens) : undefined,
          // dietaryRestrictions: data.dietaryRestrictions
          //   ? JSON.stringify(data.dietaryRestrictions)
          //   : null, // TODO: Add dietaryRestrictions to Prisma schema
          preparationTime: data.preparationTime,
          available: data.available,
          // maxDailyQuantity: data.maxDailyQuantity, // TODO: Add maxDailyQuantity to Prisma schema
          tags: data.tags ? JSON.stringify(data.tags) : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Clear cache
      await this.clearMenuCache(data.schoolId);

      logger.info('Menu item created', { id: menuItem.id, name: menuItem.name });
      return { success: true, data: menuItem };
    } catch (error) {
      logger.error('Failed to create menu item', error as Error, { data });
      return {
        success: false,
        error: {
          code: 'CREATION_FAILED',
          message: 'Failed to create menu item',
        },
      };
    }
  }

  async updateMenuItem(data: UpdateMenuItemData): Promise<ServiceResponse<MenuItem>> {
    try {
      const existingItem = await this.prisma.menuItem.findUnique({
        where: { id: data.id },
      });

      if (!existingItem) {
        return {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Menu item not found',
          },
        };
      }

      // Validate nutritional info if provided
      if (data.nutritionalInfo) {
        const { calories, protein, carbs, fat } = data.nutritionalInfo;
        if (calories < 0 || protein < 0 || carbs < 0 || fat < 0) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Nutritional values cannot be negative',
            },
          };
        }
      }

      // Check for duplicate name if name is being updated
      if (data.name && data.name !== existingItem.name) {
        const duplicateItem = await this.prisma.menuItem.findFirst({
          where: {
            name: data.name,
            schoolId: existingItem.schoolId,
            id: { not: data.id },
          },
        });

        if (duplicateItem) {
          return {
            success: false,
            error: {
              code: 'DUPLICATE_ITEM',
              message: 'Menu item with this name already exists in the school',
            },
          };
        }
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      // Only include fields that are provided
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.nutritionalInfo !== undefined) {
        updateData.nutritionalInfo = data.nutritionalInfo
          ? JSON.stringify(data.nutritionalInfo)
          : null;
      }
      if (data.allergens !== undefined) {
        updateData.allergens = data.allergens ? JSON.stringify(data.allergens) : null;
      }
      if (data.dietaryRestrictions !== undefined) {
        updateData.dietaryRestrictions = data.dietaryRestrictions
          ? JSON.stringify(data.dietaryRestrictions)
          : null;
      }
      if (data.preparationTime !== undefined) updateData.preparationTime = data.preparationTime;
      if (data.available !== undefined) updateData.available = data.available;
      if (data.maxDailyQuantity !== undefined) updateData.maxDailyQuantity = data.maxDailyQuantity;
      if (data.tags !== undefined) {
        updateData.tags = data.tags ? JSON.stringify(data.tags) : null;
      }

      const updatedItem = await this.prisma.menuItem.update({
        where: { id: data.id },
        data: updateData,
      });

      // Clear cache
      await this.clearMenuCache(existingItem.schoolId!);

      logger.info('Menu item updated', { id: data.id, name: updatedItem.name });
      return { success: true, data: updatedItem };
    } catch (error) {
      logger.error('Failed to update menu item', error as Error, { data });
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update menu item',
        },
      };
    }
  }

  async deleteMenuItem(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const existingItem = await this.prisma.menuItem.findUnique({
        where: { id },
        include: {
          _count: {
            select: { orderItems: true },
          },
        },
      });

      if (!existingItem) {
        return {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Menu item not found',
          },
        };
      }

      // Check if item is used in active orders
      if (existingItem._count.orderItems > 0) {
        return {
          success: false,
          error: {
            code: 'ITEM_IN_USE',
            message: 'Cannot delete menu item that is used in existing orders',
            details: { orderCount: existingItem._count.orderItems },
          },
        };
      }

      await this.prisma.menuItem.delete({
        where: { id },
      });

      // Clear cache
      await this.clearMenuCache(existingItem.schoolId!);

      logger.info('Menu item deleted', { id, name: existingItem.name });
      return { success: true, data: true };
    } catch (error) {
      logger.error('Failed to delete menu item', error as Error, { id });
      return {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete menu item',
        },
      };
    }
  }

  async getMenuItem(id: string): Promise<ServiceResponse<MenuItem>> {
    try {
      const cacheKey = `menu_item:${id}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return { success: true, data: JSON.parse(cached) };
      }

      const item = await this.prisma.menuItem.findUnique({
        where: { id },
      });

      if (!item) {
        return {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Menu item not found',
          },
        };
      }

      await cache.setex(cacheKey, 600, JSON.stringify(item)); // 10 minutes
      return { success: true, data: item };
    } catch (error) {
      logger.error('Failed to get menu item', error as Error, { id });
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch menu item',
        },
      };
    }
  }

  async getMenuItems(filters: MenuItemFilters = {}): Promise<ServiceResponse<MenuItem[]>> {
    try {
      const cacheKey = `menu_items:${JSON.stringify(filters)}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return { success: true, data: JSON.parse(cached) };
      }

      const where: any = {};

      if (filters.schoolId) {
        where.schoolId = filters.schoolId;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.available !== undefined) {
        where.available = filters.available;
      }

      // Handle dietary restrictions and allergens
      if (filters.dietaryRestrictions?.length) {
        where.dietaryRestrictions = {
          contains: JSON.stringify(filters.dietaryRestrictions),
        };
      }

      if (filters.allergens?.length) {
        // Exclude items that contain specified allergens
        where.allergens = {
          not: {
            contains: JSON.stringify(filters.allergens),
          },
        };
      }

      // Handle nutritional filters
      if (filters.nutritionalInfo) {
        const { minCalories, maxCalories, minProtein, maxProtein } = filters.nutritionalInfo;

        if (minCalories || maxCalories || minProtein || maxProtein) {
          where.nutritionalInfo = {};

          if (minCalories || maxCalories) {
            where.nutritionalInfo.contains = '"calories":';
            // Note: This is a simplified filter. In production, you'd need more complex JSON querying
          }
        }
      }

      const items = await this.prisma.menuItem.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      await cache.setex(cacheKey, 300, JSON.stringify(items)); // 5 minutes
      return { success: true, data: items };
    } catch (error) {
      logger.error('Failed to get menu items', error as Error, { filters });
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch menu items',
        },
      };
    }
  }

  async getMenuByCategory(
    schoolId: string,
    category: string
  ): Promise<ServiceResponse<MenuItem[]>> {
    return this.getMenuItems({ schoolId, category, available: true });
  }

  async bulkUpdateMenuItems(
    updates: BulkMenuItemUpdate
  ): Promise<ServiceResponse<{ successful: number; failed: number; errors: any[] }>> {
    try {
      let successful = 0;
      let failed = 0;
      const errors: any[] = [];

      for (const update of updates.items) {
        try {
          const result = await this.updateMenuItem(update);
          if (result.success) {
            successful++;
          } else {
            failed++;
            errors.push({
              id: update.id,
              error: result.error,
            });
          }
        } catch (error) {
          failed++;
          errors.push({
            id: update.id,
            error: { message: 'Unexpected error during update' },
          });
        }
      }

      return {
        success: true,
        data: { successful, failed, errors },
      };
    } catch (error) {
      logger.error('Failed to bulk update menu items', error as Error, { updates });
      return {
        success: false,
        error: {
          code: 'BULK_UPDATE_FAILED',
          message: 'Failed to bulk update menu items',
        },
      };
    }
  }

  // Menu Plan Management
  async createMenuPlan(data: MenuPlanData): Promise<ServiceResponse<MenuPlan>> {
    try {
      if (!data.name || !data.schoolId || !data.startDate || !data.endDate) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: name, schoolId, startDate, endDate',
          },
        };
      }

      if (data.startDate >= data.endDate) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'End date must be after start date',
          },
        };
      }

      const menuPlan = await this.prisma.menuPlan.create({
        data: {
          id: uuidv4(),
          schoolId: data.schoolId,
          name: data.name,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.isActive ? 'active' : 'inactive',
          // mealTypes: null, // TODO: Add mealTypes to Prisma schema
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system', // TODO: Add createdBy to MenuPlanData interface
        },
      });

      logger.info('Menu plan created', { id: menuPlan.id, name: menuPlan.name });
      return { success: true, data: menuPlan };
    } catch (error) {
      logger.error('Failed to create menu plan', error as Error, { data });
      return {
        success: false,
        error: {
          code: 'PLAN_CREATION_FAILED',
          message: 'Failed to create menu plan',
        },
      };
    }
  }

  async addMenuSlot(data: MenuSlotData): Promise<ServiceResponse<any>> {
    try {
      // Validate menu plan exists and is active
      const menuPlan = await this.prisma.menuPlan.findUnique({
        where: { id: data.menuPlanId },
      });

      if (!menuPlan) {
        return {
          success: false,
          error: {
            code: 'PLAN_NOT_FOUND',
            message: 'Menu plan not found',
          },
        };
      }

      if (menuPlan.status !== 'active') {
        return {
          success: false,
          error: {
            code: 'PLAN_INACTIVE',
            message: 'Menu plan is not active',
          },
        };
      }

      // Validate date is within plan range
      const slotDate = new Date(data.date);
      if (slotDate < menuPlan.startDate || slotDate > menuPlan.endDate) {
        return {
          success: false,
          error: {
            code: 'DATE_OUT_OF_RANGE',
            message: 'Slot date is outside the menu plan date range',
          },
        };
      }

      // Validate menu item exists and is available
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: data.menuItemId },
      });

      if (!menuItem || !menuItem.available) {
        return {
          success: false,
          error: {
            code: 'ITEM_NOT_AVAILABLE',
            message: 'Menu item not found or not available',
          },
        };
      }

      // Note: MenuSlot functionality is not implemented in current schema
      // This would need to be added to the database schema first
      const menuSlot = {
        id: uuidv4(),
        menuPlanId: data.menuPlanId,
        menuItemId: data.menuItemId,
        date: data.date,
        mealType: data.mealType,
        quantity: data.quantity,
        price: data.price,
        isAvailable: data.isAvailable,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      logger.info('Menu slot added', { id: menuSlot.id, menuItemId: data.menuItemId });
      return { success: true, data: menuSlot };
    } catch (error) {
      logger.error('Failed to add menu slot', error as Error, { data });
      return {
        success: false,
        error: {
          code: 'SLOT_CREATION_FAILED',
          message: 'Failed to add menu slot',
        },
      };
    }
  }

  async getMenuAnalytics(
    schoolId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ServiceResponse<MenuAnalytics>> {
    try {
      const where: any = { schoolId };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const items = await this.prisma.menuItem.findMany({
        where,
        include: {
          _count: {
            select: { orderItems: true },
          },
        },
      });

      const totalItems = items.length;
      const activeItems = items.filter(item => item.available).length;

      const itemsByCategory: Record<string, number> = {};
      let totalPrice = 0;
      const nutritionalStats = {
        totalCalories: 0,
        totalProtein: 0,
        allergenCount: new Map<string, number>(),
      };

      const popularItems: Array<{
        id: string;
        name: string;
        orderCount: number;
        revenue: number;
      }> = [];

      for (const item of items) {
        // Category count
        itemsByCategory[item.category] = (itemsByCategory[item.category] || 0) + 1;

        // Price sum
        totalPrice += this.safeDecimalOperation(item.price);

        // Nutritional stats
        if (item.nutritionalInfo) {
          try {
            const nutrition = JSON.parse(item.nutritionalInfo);
            nutritionalStats.totalCalories += nutrition.calories || 0;
            nutritionalStats.totalProtein += nutrition.protein || 0;
          } catch (e) {
            // Ignore parsing errors
          }
        }

        // Allergens
        if (item.allergens) {
          try {
            const allergens = JSON.parse(item.allergens);
            allergens.forEach((allergen: string) => {
              nutritionalStats.allergenCount.set(
                allergen,
                (nutritionalStats.allergenCount.get(allergen) || 0) + 1
              );
            });
          } catch (e) {
            // Ignore parsing errors
          }
        }

        // Popular items
        const orderCount = item._count.orderItems;
        if (orderCount > 0) {
          popularItems.push({
            id: item.id,
            name: item.name,
            orderCount,
            revenue: orderCount * this.safeDecimalOperation(item.price),
          });
        }
      }

      // Sort popular items by order count
      popularItems.sort((a, b) => b.orderCount - a.orderCount);

      const analytics: MenuAnalytics = {
        totalItems,
        activeItems,
        itemsByCategory,
        averagePrice: totalItems > 0 ? totalPrice / totalItems : 0,
        popularItems: popularItems.slice(0, 10), // Top 10
        nutritionalStats: {
          averageCalories: activeItems > 0 ? nutritionalStats.totalCalories / activeItems : 0,
          averageProtein: activeItems > 0 ? nutritionalStats.totalProtein / activeItems : 0,
          commonAllergens: Array.from(nutritionalStats.allergenCount.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([allergen]) => allergen),
        },
      };

      return { success: true, data: analytics };
    } catch (error) {
      logger.error('Failed to get menu analytics', error as Error, {
        schoolId,
        startDate,
        endDate,
      });
      return {
        success: false,
        error: {
          code: 'ANALYTICS_FAILED',
          message: 'Failed to get menu analytics',
        },
      };
    }
  }

  // Cache management
  private async clearMenuCache(schoolId: string): Promise<void> {
    try {
      const cacheKeys = await RedisService.keys(`menu_items:*${schoolId}*`);
      if (cacheKeys.length > 0) {
        await RedisService.del(cacheKeys);
      }
    } catch (error) {
      logger.warn('Failed to clear menu cache', { schoolId });
    }
  }

  // Helper method to handle Decimal arithmetic
  private safeDecimalOperation(value: any): number {
    if (typeof value === 'number') return value;
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    return 0;
  }

  // Legacy methods for backward compatibility
  async getMenuItemsLegacy(): Promise<any[]> {
    const result = await this.getMenuItems({});
    return result.success ? result.data || [] : [];
  }

  async createMenuItemLegacy(item: any): Promise<any> {
    const result = await this.createMenuItem(item as CreateMenuItemData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error?.message || 'Failed to create menu item');
  }

  async updateMenuItemLegacy(id: string, updates: any): Promise<void> {
    const result = await this.updateMenuItem({ id, ...updates });
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update menu item');
    }
  }

  async deleteMenuItemLegacy(id: string): Promise<void> {
    const result = await this.deleteMenuItem(id);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete menu item');
    }
  }
}

const menuServiceInstance = MenuService.getInstance();
export const menuService = menuServiceInstance;
export const _menuService = menuServiceInstance;
export default menuServiceInstance;
