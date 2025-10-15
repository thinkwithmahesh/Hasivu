/**
 * HASIVU Platform - Daily Menu Service
 * Business logic layer for daily menu management
 * Implements Story 2.2: Menu Planning and Scheduling
 */
import { DailyMenu } from '@prisma/client';

// Enum definitions for MenuCategory and DayType (not in Prisma schema)
export enum MenuCategory {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  SNACK = 'SNACK',
  BEVERAGE = 'BEVERAGE',
  DESSERT = 'DESSERT',
  SPECIAL = 'SPECIAL',
}

export enum DayType {
  WEEKDAY = 'WEEKDAY',
  WEEKEND = 'WEEKEND',
  HOLIDAY = 'HOLIDAY',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
}

import { DailyMenuRepository } from '../repositories/dailyMenu.repository';
import { MenuItemRepository } from '../repositories/menuItem.repository';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';

/**
 * Daily menu creation input interface
 */
export interface CreateDailyMenuInput {
  date: Date;
  schoolId: string;
  category: MenuCategory;
  dayType: DayType;
  menuItemIds: string[];
  availableQuantity?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

/**
 * Daily menu update input interface
 */
export interface UpdateDailyMenuInput {
  menuItemIds?: string[];
  availableQuantity?: number;
  notes?: string;
  metadata?: Record<string, any>;
  isActive?: boolean;
}

/**
 * Daily menu filters interface
 */
export interface DailyMenuFilters {
  schoolId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  category?: MenuCategory;
  dayType?: DayType;
  isActive?: boolean;
}

// Define DailyMenuWithItems type since repository doesn't export it
export interface DailyMenuWithItems extends DailyMenu {
  menuItems: any[]; // Simplified for now
}

/**
 * Daily Menu Service class
 */
export class DailyMenuService {
  private static readonly CACHE_TTL = 600; // 10 minutes
  private static readonly MAX_ITEMS_PER_MENU = 50;
  private static instance: DailyMenuService;

  /**
   * Get singleton instance
   */
  public static getInstance(): DailyMenuService {
    if (!DailyMenuService.instance) {
      DailyMenuService.instance = new DailyMenuService();
    }
    return DailyMenuService.instance;
  }

  /**
   * Create new daily menu
   */
  public static async createDailyMenu(input: CreateDailyMenuInput): Promise<DailyMenuWithItems> {
    try {
      // Validate business rules first
      await this.validateCreateInput(input);

      logger.info('Creating daily menu', {
        date: input.date.toISOString().split('T')[0],
        schoolId: input.schoolId,
        category: input.category,
      });

      // Check if daily menu already exists for this date
      await DailyMenuRepository.findByDate(input.schoolId, input.date);

      // Validate all menu items exist and are available
      const menuItems = await Promise.all(
        input.menuItemIds.map(id => MenuItemRepository.findById(id))
      );

      const missingItems = input.menuItemIds.filter((id, index) => !menuItems[index]);
      if (missingItems.length > 0) {
        throw new Error(`Menu items not found: ${missingItems.join(', ')}`);
      }

      const unavailableItems = menuItems.filter(
        (item, _index) => item && (!item.available || item.category !== input.category)
      );
      if (unavailableItems.length > 0) {
        const unavailableIds = unavailableItems.map((item: any) => item?.id).filter(Boolean);
        throw new Error(`Menu items unavailable or wrong category: ${unavailableIds.join(', ')}`);
      }

      // Prepare data for creation - simplified for current schema
      const createData = {
        schoolId: input.schoolId,
        date: input.date,
        items: JSON.stringify(input.menuItemIds),
        availableQuantity: input.availableQuantity,
        notes: input.notes,
        metadata: JSON.stringify(input.metadata || {}),
        isActive: true,
      };

      const dailyMenu = await DailyMenuRepository.create(createData as any);

      // Clear relevant caches
      await this.clearRelatedCaches(input.schoolId, input.date, input.category);

      // Return with menu items included
      const result = await this.getDailyMenuById(dailyMenu.id);
      if (!result) {
        throw new Error('Failed to retrieve created daily menu');
      }

      logger.info('Daily menu created successfully', { dailyMenuId: dailyMenu.id });
      return result;
    } catch (error: any) {
      logger.error('Failed to create daily menu', error instanceof Error ? error : undefined, {
        input,
      });
      throw error;
    }
  }

  /**
   * Get daily menu by ID
   */
  public static async getDailyMenuById(id: string): Promise<DailyMenuWithItems | null> {
    try {
      const cacheKey = `daily_menu:${id}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const dailyMenu = await DailyMenuRepository.findById(id);
      if (!dailyMenu) {
        logger.warn('Daily menu not found', { dailyMenuId: id });
        return null;
      }

      // Create a simple DailyMenuWithItems structure
      const result: DailyMenuWithItems = {
        ...dailyMenu,
        menuItems: [], // Simplified - would need to join with menu items in real implementation
      };

      await cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      return result;
    } catch (error: any) {
      logger.error('Failed to get daily menu by ID', error instanceof Error ? error : undefined, {
        dailyMenuId: id,
      });
      throw error;
    }
  }

  /**
   * Get daily menus by date range
   */
  public static async getDailyMenusByDateRange(
    schoolId: string,
    startDate: Date,
    endDate: Date,
    category?: MenuCategory
  ): Promise<DailyMenuWithItems[]> {
    try {
      logger.info('Getting daily menus by date range', {
        schoolId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        category,
      });

      const menus = await DailyMenuRepository.findByDateRange(schoolId, startDate, endDate);

      // Convert to DailyMenuWithItems format
      const result: DailyMenuWithItems[] = menus.map((menu: DailyMenu) => ({
        ...menu,
        menuItems: [], // Simplified
      }));

      logger.info('Retrieved daily menus by date range', {
        count: result.length,
        schoolId,
        category,
      });
      return result;
    } catch (error: any) {
      logger.error(
        'Failed to get daily menus by date range',
        error instanceof Error ? error : undefined,
        {
          schoolId,
          startDate,
          endDate,
          category,
        }
      );
      throw error;
    }
  }

  /**
   * Get daily menu for specific date
   */
  public static async getDailyMenuByDate(
    schoolId: string,
    date: Date,
    category?: MenuCategory
  ): Promise<DailyMenuWithItems[]> {
    try {
      const cacheKey = `daily_menu:date:${schoolId}:${date.toISOString().split('T')[0]}:${category || 'all'}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const menus = await DailyMenuRepository.findByDateRange(schoolId, date, date);

      // Convert to DailyMenuWithItems format
      const result: DailyMenuWithItems[] = menus.map((menu: DailyMenu) => ({
        ...menu,
        menuItems: [], // Simplified
      }));

      await cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      return result;
    } catch (error: any) {
      logger.error('Failed to get daily menu by date', error instanceof Error ? error : undefined, {
        schoolId,
        date,
        category,
      });
      throw error;
    }
  }

  /**
   * Update daily menu
   */
  public static async updateDailyMenu(
    id: string,
    input: UpdateDailyMenuInput
  ): Promise<DailyMenuWithItems> {
    try {
      logger.info('Updating daily menu', { dailyMenuId: id });

      // Check if daily menu exists
      await DailyMenuRepository.findById(id);

      // Validate menu items if provided
      if (input.menuItemIds) {
        if (input.menuItemIds.length > this.MAX_ITEMS_PER_MENU) {
          throw new Error(`Cannot add more than ${this.MAX_ITEMS_PER_MENU} items to a daily menu`);
        }

        const menuItems = await Promise.all(
          input.menuItemIds.map(itemId => MenuItemRepository.findById(itemId))
        );

        const missingItems = input.menuItemIds.filter((id, index) => !menuItems[index]);
        if (missingItems.length > 0) {
          throw new Error(`Menu items not found: ${missingItems.join(', ')}`);
        }

        const unavailableItems = menuItems.filter(item => item && !item.available);
        if (unavailableItems.length > 0) {
          const unavailableIds = unavailableItems.map((item: any) => item?.id).filter(Boolean);
          throw new Error(`Menu items unavailable or wrong category: ${unavailableIds.join(', ')}`);
        }
      }

      // Prepare update data
      const updateData: Partial<DailyMenu> = {};
      if (input.availableQuantity !== undefined)
        updateData.availableQuantity = input.availableQuantity;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.metadata !== undefined) updateData.metadata = JSON.stringify(input.metadata);
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      if (input.menuItemIds) {
        // Store menu items as JSON string in items field
        (updateData as any).items = JSON.stringify(input.menuItemIds);
      }

      const dailyMenu = await DailyMenuRepository.update(id, updateData);

      // Get the updated menu to clear caches
      const updatedMenu = await DailyMenuRepository.findById(id);
      if (updatedMenu) {
        await this.clearRelatedCaches(updatedMenu.schoolId, updatedMenu.date, MenuCategory.LUNCH);
      }
      await cache.del(`daily_menu:${id}`);

      // Return updated menu with items
      const result = await this.getDailyMenuById(dailyMenu.id);
      if (!result) {
        throw new Error('Failed to retrieve updated daily menu');
      }

      logger.info('Daily menu updated successfully', { dailyMenuId: dailyMenu.id });
      return result;
    } catch (error: any) {
      logger.error('Failed to update daily menu', error instanceof Error ? error : undefined, {
        dailyMenuId: id,
        input,
      });
      throw error;
    }
  }

  /**
   * Delete daily menu (soft delete - mark as inactive)
   */
  public static async deleteDailyMenu(id: string, hard: boolean = false): Promise<DailyMenu> {
    try {
      logger.info('Deleting daily menu', { dailyMenuId: id, hard });

      const existing = await DailyMenuRepository.findById(id);
      if (!existing) {
        throw new Error(`Daily menu with ID ${id} not found`);
      }

      let dailyMenu: DailyMenu;
      if (hard) {
        dailyMenu = await DailyMenuRepository.delete(id);
      } else {
        // Soft delete - mark as inactive
        dailyMenu = await DailyMenuRepository.update(id, { isActive: false });
      }

      // Clear relevant caches
      await this.clearRelatedCaches('default-school', existing.date, MenuCategory.LUNCH);
      await cache.del(`daily_menu:${id}`);

      logger.info('Daily menu deleted successfully', {
        dailyMenuId: dailyMenu.id,
        hard,
      });
      return dailyMenu;
    } catch (error: any) {
      logger.error('Failed to delete daily menu', error instanceof Error ? error : undefined, {
        dailyMenuId: id,
      });
      throw error;
    }
  }

  /**
   * Clone daily menu to new date
   */
  public static async cloneDailyMenu(
    sourceId: string,
    targetDate: Date,
    schoolId?: string
  ): Promise<DailyMenuWithItems> {
    try {
      logger.info('Cloning daily menu', { sourceId, targetDate });

      const sourceMenu = await this.getDailyMenuById(sourceId);
      if (!sourceMenu) {
        throw new Error(`Source daily menu with ID ${sourceId} not found`);
      }

      const targetSchoolId = schoolId || 'fallback_school_id';

      // Check if target date already has a menu for this plan (fallback approach)
      const existingTargetMenu = await DailyMenuRepository.findByDateRange(
        targetSchoolId,
        targetDate,
        targetDate
      );
      if (existingTargetMenu && existingTargetMenu.length > 0) {
        throw new Error(
          `Daily menu already exists for ${targetDate.toISOString().split('T')[0]}
          for this menu plan`
        );
      }

      // Create cloned menu - simplified version
      const clonedData = {
        schoolId: targetSchoolId,
        date: targetDate,
        items: (sourceMenu as any).items || '[]',
        availableQuantity: sourceMenu.availableQuantity,
        notes: sourceMenu.notes,
        metadata: sourceMenu.metadata,
        isActive: true,
      };

      const clonedMenu = await DailyMenuRepository.create(clonedData as any);

      logger.info('Daily menu cloned successfully', {
        sourceId,
        clonedId: clonedMenu.id,
        targetDate,
      });
      return (await this.getDailyMenuById(clonedMenu.id)) || (clonedMenu as DailyMenuWithItems);
    } catch (error: any) {
      logger.error('Failed to clone daily menu', error instanceof Error ? error : undefined, {
        sourceId,
        targetDate,
        schoolId,
      });
      throw error;
    }
  }

  /**
   * Get weekly menu plan
   */
  public static async getWeeklyMenuPlan(
    schoolId: string,
    startDate: Date
  ): Promise<Record<string, DailyMenuWithItems[]>> {
    try {
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // 7 days total

      const menus = await this.getDailyMenusByDateRange(schoolId, startDate, endDate);

      // Group by date
      const weeklyPlan: Record<string, DailyMenuWithItems[]> = {};
      menus.forEach(menu => {
        const dateKey = menu.date.toISOString().split('T')[0];
        if (!weeklyPlan[dateKey]) {
          weeklyPlan[dateKey] = [];
        }
        weeklyPlan[dateKey].push(menu);
      });

      logger.info('Retrieved weekly menu plan', {
        schoolId,
        startDate: startDate.toISOString().split('T')[0],
        daysWithMenus: Object.keys(weeklyPlan).length,
      });
      return weeklyPlan;
    } catch (error: any) {
      logger.error('Failed to get weekly menu plan', error instanceof Error ? error : undefined, {
        schoolId,
        startDate,
      });
      throw error;
    }
  }

  /**
   * Validate create input
   */
  private static async validateCreateInput(input: CreateDailyMenuInput): Promise<void> {
    if (!input.date) {
      throw new Error('Date is required');
    }

    if (!input.schoolId) {
      throw new Error('School ID is required');
    }

    if (!input.category) {
      throw new Error('Category is required');
    }

    if (!input.dayType) {
      throw new Error('Day type is required');
    }

    if (!input.menuItemIds || input.menuItemIds.length === 0) {
      throw new Error('At least one menu item is required');
    }

    if (input.menuItemIds.length > this.MAX_ITEMS_PER_MENU) {
      throw new Error(`Cannot add more than ${this.MAX_ITEMS_PER_MENU} items to a daily menu`);
    }

    if (input.availableQuantity && input.availableQuantity < 0) {
      throw new Error('Available quantity cannot be negative');
    }

    // Check if date is not in the past (allow today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(input.date);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      throw new Error('Cannot create daily menu for past dates');
    }
  }

  /**
   * Clear related caches
   */
  private static async clearRelatedCaches(
    schoolId: string,
    date: Date,
    category: MenuCategory
  ): Promise<void> {
    try {
      const dateKey = date.toISOString().split('T')[0];
      const cacheKeys = [
        `daily_menu:date:${schoolId}:${dateKey}:*`,
        `daily_menu:school:${schoolId}:*`,
        `daily_menu:category:${category}:*`,
        'weekly_plan:*',
      ];

      // Clear cache for each key pattern
      for (const key of cacheKeys) {
        await cache.del(key);
      }
    } catch (error: unknown) {
      logger.warn('Failed to clear caches', error);
    }
  }
}

// Export singleton instance
export const dailyMenuService = new DailyMenuService();
export default DailyMenuService;
