/**
 * HASIVU Platform - Daily Menu Hook
 * Custom hook for managing daily menu data and operations
 */

import { useState, useEffect, useCallback } from 'react';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
  preparationTime: number;
  allergens?: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface Menu {
  id: string;
  category: string;
  isActive: boolean;
  notes?: string;
  availableQuantity?: number;
  menuItems: MenuItem[];
}

export interface DailyMenuData {
  date: string;
  menus: Menu[];
}

export interface UseDailyMenuReturn {
  currentMenu: DailyMenuData | null;
  selectedDate: string;
  selectedDateMenus: Menu[];
  isLoading: boolean;
  isLoadingWeekly: boolean;
  error: string | null;
  hasMenuForSelectedDate: boolean;
  isEmpty: boolean;
  hasError: boolean;
  loadDailyMenu: (schoolId: string, date: string) => Promise<void>;
  selectDate: (date: string) => void;
  refreshMenu: (schoolId: string) => Promise<void>;
  dismissError: () => void;
}

export const useDailyMenu = (): UseDailyMenuReturn => {
  const [currentMenu, setCurrentMenu] = useState<DailyMenuData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWeekly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDailyMenu = useCallback(async (schoolId: string, date: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this would make an API call
      // For now, return mock data
      const mockMenu: DailyMenuData = {
        date,
        menus: [
          {
            id: '1',
            category: 'Breakfast',
            isActive: true,
            notes: 'Fresh and nutritious breakfast options',
            availableQuantity: 150,
            menuItems: [
              {
                id: 'b1',
                name: 'Idli with Sambar',
                description: 'Traditional South Indian breakfast',
                price: 25,
                category: 'Breakfast',
                available: true,
                preparationTime: 10,
                allergens: ['gluten'],
                nutritionalInfo: {
                  calories: 180,
                  protein: 6,
                  carbs: 35,
                  fat: 3,
                },
              },
              {
                id: 'b2',
                name: 'Poha',
                description: 'Flattened rice with vegetables',
                price: 20,
                category: 'Breakfast',
                available: true,
                preparationTime: 8,
                allergens: [],
                nutritionalInfo: {
                  calories: 150,
                  protein: 4,
                  carbs: 30,
                  fat: 2,
                },
              },
            ],
          },
          {
            id: '2',
            category: 'Lunch',
            isActive: true,
            notes: 'Balanced lunch with vegetables and protein',
            availableQuantity: 200,
            menuItems: [
              {
                id: 'l1',
                name: 'Rice with Dal and Vegetables',
                description: 'Complete meal with rice, lentils, and seasonal vegetables',
                price: 40,
                category: 'Lunch',
                available: true,
                preparationTime: 15,
                allergens: [],
                nutritionalInfo: {
                  calories: 350,
                  protein: 12,
                  carbs: 65,
                  fat: 8,
                },
              },
            ],
          },
        ],
      };

      setCurrentMenu(mockMenu);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const refreshMenu = useCallback(async (schoolId: string) => {
    await loadDailyMenu(schoolId, selectedDate);
  }, [loadDailyMenu, selectedDate]);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  // Load menu when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      // Note: In a real implementation, we'd need the schoolId here
      // For now, we'll skip auto-loading and let components call loadDailyMenu explicitly
    }
  }, [selectedDate]);

  const selectedDateMenus = currentMenu?.menus || [];
  const hasMenuForSelectedDate = selectedDateMenus.length > 0;
  const isEmpty = !isLoading && !hasMenuForSelectedDate && !error;
  const hasError = !!error;

  return {
    currentMenu,
    selectedDate,
    selectedDateMenus,
    isLoading,
    isLoadingWeekly,
    error,
    hasMenuForSelectedDate,
    isEmpty,
    hasError,
    loadDailyMenu,
    selectDate,
    refreshMenu,
    dismissError,
  };
};