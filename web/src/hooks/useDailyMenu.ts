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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWeekly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDailyMenu = useCallback(async (schoolId: string, date: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/menus/daily?schoolId=${schoolId}&date=${date}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load menu');
      }

      const rawItems: MenuItem[] = result.data?.data || result.data || [];

      // Group items by category
      const grouped = rawItems.reduce(
        (acc, item) => {
          const cat = item.category || 'Other';
          if (!acc[cat]) {
            acc[cat] = {
              id: cat,
              category: cat,
              isActive: true,
              menuItems: [],
            };
          }
          acc[cat].menuItems.push(item);
          return acc;
        },
        {} as Record<string, Menu>
      );

      setCurrentMenu({
        date,
        menus: Object.values(grouped),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const refreshMenu = useCallback(
    async (schoolId: string) => {
      await loadDailyMenu(schoolId, selectedDate);
    },
    [loadDailyMenu, selectedDate]
  );

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
