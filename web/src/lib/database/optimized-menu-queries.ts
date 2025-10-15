import { z } from 'zod';

// TypeScript interfaces for menu data structures
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  isAvailable: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  allergens?: string[];
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  imageUrl?: string;
  sortOrder: number;
  preparationTime?: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuWithItems {
  category: MenuCategory;
  items: MenuItem[];
}

export interface MenuQueryFilters {
  categoryId?: string;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
}

export interface MenuQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'price' | 'sortOrder' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  includeUnavailable?: boolean;
}

// Validation schemas
export const _menuItemSchema =  z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  currency: z.string().length(3),
  isAvailable: z.boolean(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  allergens: z.array(z.string()).optional(),
  nutritionInfo: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
  }).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int(),
  preparationTime: z.number().int().positive().optional(),
});

export const _menuCategorySchema =  z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

// Mock data for development
const mockCategories: MenuCategory[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Appetizers',
    description: 'Start your meal with our delicious appetizers',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Main Courses',
    description: 'Hearty main dishes to satisfy your appetite',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Desserts',
    description: 'Sweet treats to end your meal perfectly',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Beverages',
    description: 'Refreshing drinks and specialty beverages',
    sortOrder: 4,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const mockMenuItems: MenuItem[] = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    categoryId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Crispy Calamari',
    description: 'Fresh squid rings served with marinara sauce',
    price: 12.99,
    currency: 'USD',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    allergens: ['seafood', 'gluten'],
    nutritionInfo: {
      calories: 320,
      protein: 18,
      carbs: 25,
      fat: 15,
    },
    imageUrl: 'https://example.com/images/calamari.jpg',
    sortOrder: 1,
    preparationTime: 15,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    categoryId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Bruschetta Trio',
    description: 'Three varieties of toasted bread with fresh toppings',
    price: 9.99,
    currency: 'USD',
    isAvailable: true,
    isVegetarian: true,
    isVegan: false,
    allergens: ['gluten', 'dairy'],
    nutritionInfo: {
      calories: 280,
      protein: 8,
      carbs: 35,
      fat: 12,
    },
    sortOrder: 2,
    preparationTime: 10,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    categoryId: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Grilled Salmon',
    description: 'Atlantic salmon with lemon herb butter',
    price: 24.99,
    currency: 'USD',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    allergens: ['fish'],
    nutritionInfo: {
      calories: 420,
      protein: 38,
      carbs: 5,
      fat: 28,
    },
    sortOrder: 1,
    preparationTime: 20,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440004',
    categoryId: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Vegetarian Pasta',
    description: 'Penne pasta with seasonal vegetables in herb sauce',
    price: 18.99,
    currency: 'USD',
    isAvailable: true,
    isVegetarian: true,
    isVegan: true,
    allergens: ['gluten'],
    nutritionInfo: {
      calories: 380,
      protein: 14,
      carbs: 68,
      fat: 8,
    },
    sortOrder: 2,
    preparationTime: 15,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Optimized query class
export class OptimizedMenuQueries {
  private static instance: OptimizedMenuQueries;
  private categories: MenuCategory[] = mockCategories;
  private menuItems: MenuItem[] = mockMenuItems;

  private constructor() {
  }

  public static getInstance(): OptimizedMenuQueries {
    if (!OptimizedMenuQueries.instance) {
      OptimizedMenuQueries._instance =  new OptimizedMenuQueries();
    }
    return OptimizedMenuQueries.instance;
  }

  /**
   * Get all active menu categories with optional sorting
   */
  async getMenuCategories(_includeInactive =  false): Promise<MenuCategory[]> {
    try {

      const _filteredCategories =  this.categories.filter(_category 
      return filteredCategories.sort((a, _b) => a.sortOrder - b.sortOrder);
    } catch (error) {
      throw new Error('Failed to fetch menu categories');
    }
  }

  /**
   * Get menu items with advanced filtering and pagination
   */
  async getMenuItems(
    filters: MenuQueryFilters = {},
    options: MenuQueryOptions = {}
  ): Promise<{ items: MenuItem[]; total: number; hasMore: boolean }> {
    try {

      let _filteredItems =  this.menuItems;

      // Apply filters
      if (filters.categoryId) {
        _filteredItems =  filteredItems.filter(item 
      }

      if (filters.isAvailable !== undefined) {
        _filteredItems =  filteredItems.filter(item 
      }

      if (filters.isVegetarian !== undefined) {
        _filteredItems =  filteredItems.filter(item 
      }

      if (filters.isVegan !== undefined) {
        _filteredItems =  filteredItems.filter(item 
      }

      if (filters.minPrice !== undefined) {
        _filteredItems =  filteredItems.filter(item 
      }

      if (filters.maxPrice !== undefined) {
        _filteredItems =  filteredItems.filter(item 
      }

      if (filters.searchTerm) {
        const _searchLower =  filters.searchTerm.toLowerCase();
        _filteredItems =  filteredItems.filter(item 
      }

      // Apply sorting
      if (options.sortBy) {
        filteredItems.sort(_(a, _b) => {
          const _aVal =  a[options.sortBy!];
          const _bVal =  b[options.sortBy!];

          if (typeof _aVal = 
            return options._sortOrder = 
          }

          if (typeof _aVal = 
            return options._sortOrder = 
          }

          return 0;
        });
      }

      const _total =  filteredItems.length;

      // Apply pagination
      const _limit =  options.limit || 50;
      const _offset =  options.offset || 0;
      const _paginatedItems =  filteredItems.slice(offset, offset + limit);
      const _hasMore =  offset + limit < total;

      return {
        items: paginatedItems,
        total,
        hasMore,
      };
    } catch (error) {
      throw new Error('Failed to fetch menu items');
    }
  }

  /**
   * Get complete menu with categories and their items
   */
  async getCompleteMenu(_includeUnavailable =  false): Promise<MenuWithItems[]> {
    try {

      const _categories =  await this.getMenuCategories();
      const result: MenuWithItems[] = [];

      for (const category of categories) {
        const { items } = await this.getMenuItems(
          {
            categoryId: category.id,
            isAvailable: includeUnavailable ? undefined : true
          },
          { sortBy: 'sortOrder', sortOrder: 'asc' }
        );

        result.push({
          category,
          items,
        });
      }

      return result;
    } catch (error) {
      throw new Error('Failed to fetch complete menu');
    }
  }

  /**
   * Get menu item by ID with validation
   */
  async getMenuItemById(id: string): Promise<MenuItem | null> {
    try {

      const _item =  this.menuItems.find(item 
      return item || null;
    } catch (error) {
      throw new Error('Failed to fetch menu item');
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<MenuCategory | null> {
    try {

      const _category =  this.categories.find(cat 
      return category || null;
    } catch (error) {
      throw new Error('Failed to fetch category');
    }
  }

  /**
   * Get menu statistics
   */
  async getMenuStatistics(): Promise<{
    totalCategories: number;
    totalItems: number;
    availableItems: number;
    vegetarianItems: number;
    veganItems: number;
    avgPrice: number;
  }> {
    try {

      const _totalCategories =  this.categories.filter(cat 
      const _totalItems =  this.menuItems.length;
      const _availableItems =  this.menuItems.filter(item 
      const _vegetarianItems =  this.menuItems.filter(item 
      const _veganItems =  this.menuItems.filter(item 
      const _avgPrice =  this.menuItems.reduce((sum, item) 
      return {
        totalCategories,
        totalItems,
        availableItems,
        vegetarianItems,
        veganItems,
        avgPrice: Math.round(avgPrice * 100) / 100,
      };
    } catch (error) {
      throw new Error('Failed to fetch menu statistics');
    }
  }
}

// Export singleton instance
export const _optimizedMenuQueries =  OptimizedMenuQueries.getInstance();

// Export individual functions for backward compatibility
export const _getMenuCategories =  (includeInactive?: boolean) 
export const _getMenuItems =  (filters?: MenuQueryFilters, options?: MenuQueryOptions) 
export const _getCompleteMenu =  (includeUnavailable?: boolean) 
export const _getMenuItemById =  (id: string) 
export const _getCategoryById =  (id: string) 
export const _getMenuStatistics =  () 