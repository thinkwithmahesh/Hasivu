/**
 * Nutrition Service
 * Reads menu-item nutrition metadata and user dietary preferences without making medical claims.
 */

import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../database/DatabaseManager';
import { logger } from '../utils/logger';

type NutritionInfo = {
  itemId: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  allergens: string[];
  timestamp: Date;
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export class NutritionService {
  constructor(private readonly db: PrismaClient = defaultPrisma) {
    logger.info('NutritionService initialized');
  }

  async getNutritionInfo(itemId: string): Promise<NutritionInfo> {
    const item = await this.db.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });

    const info = parseJson<Record<string, number>>(item.nutritionalInfo, {});
    return {
      itemId,
      calories: item.calories ?? info.calories ?? 0,
      protein: info.protein ?? 0,
      carbs: info.carbs ?? 0,
      fat: info.fat ?? 0,
      allergens: parseJson<string[]>(item.allergens, []),
      timestamp: new Date(),
    };
  }

  async calculateMealNutrition(
    items: Array<{ menuItemId?: string; itemId?: string; quantity?: number }> | undefined
  ): Promise<any> {
    if (!items?.length) {
      return { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, items: 0 };
    }

    const itemIds = items.map(item => item.menuItemId || item.itemId).filter(Boolean) as string[];
    const menuItems = await this.db.menuItem.findMany({ where: { id: { in: itemIds } } });

    return items.reduce(
      (total, line) => {
        const menuItem = menuItems.find(item => item.id === (line.menuItemId || line.itemId));
        if (!menuItem) return total;
        const info = parseJson<Record<string, number>>(menuItem.nutritionalInfo, {});
        const quantity = line.quantity || 1;
        total.totalCalories += (menuItem.calories ?? info.calories ?? 0) * quantity;
        total.totalProtein += (info.protein ?? 0) * quantity;
        total.totalCarbs += (info.carbs ?? 0) * quantity;
        total.totalFat += (info.fat ?? 0) * quantity;
        total.items += quantity;
        return total;
      },
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, items: 0 }
    );
  }

  async getDietaryRestrictions(userId: string): Promise<any[]> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const preferences = parseJson<{ dietaryRestrictions?: any[]; allergens?: any[] }>(
      user?.preferences,
      {}
    );
    return preferences.dietaryRestrictions || preferences.allergens || [];
  }

  async validateDietaryCompliance(itemId: string, userId: string): Promise<boolean> {
    const [nutrition, restrictions] = await Promise.all([
      this.getNutritionInfo(itemId),
      this.getDietaryRestrictions(userId),
    ]);
    const normalizedRestrictions = restrictions.map(String).map(value => value.toLowerCase());
    return !nutrition.allergens.some(allergen =>
      normalizedRestrictions.includes(String(allergen).toLowerCase())
    );
  }
}

const nutritionServiceInstance = new NutritionService();
export const nutritionService = nutritionServiceInstance;
export const _nutritionService = nutritionServiceInstance;
export default nutritionServiceInstance;
