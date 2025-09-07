import { MenuItem } from '@prisma/client';
export declare enum MenuCategory {
    BREAKFAST = "BREAKFAST",
    LUNCH = "LUNCH",
    SNACKS = "SNACKS",
    DINNER = "DINNER"
}
export interface CreateMenuItemInput {
    name: string;
    description?: string;
    category: MenuCategory;
    price: number;
    originalPrice?: number;
    currency: string;
    available?: boolean;
    featured?: boolean;
    imageUrl?: string;
    nutritionalInfo?: Record<string, any>;
    allergens?: string[];
    ingredients?: string[];
    tags?: string[];
    preparationTime?: number;
    portionSize?: string;
    calories?: number;
    sortOrder?: number;
    metadata?: Record<string, any>;
    schoolId?: string;
}
export interface UpdateMenuItemInput {
    name?: string;
    description?: string;
    category?: MenuCategory;
    price?: number;
    originalPrice?: number;
    currency?: string;
    available?: boolean;
    featured?: boolean;
    imageUrl?: string;
    nutritionalInfo?: Record<string, any>;
    allergens?: string[];
    ingredients?: string[];
    tags?: string[];
    preparationTime?: number;
    portionSize?: string;
    calories?: number;
    sortOrder?: number;
    metadata?: Record<string, any>;
}
export interface BulkAvailabilityUpdate {
    id: string;
    available: boolean;
}
export interface MenuItemFilters {
    schoolId?: string;
    category?: MenuCategory;
    available?: boolean;
    featured?: boolean;
    priceMin?: number;
    priceMax?: number;
    allergens?: string[];
    tags?: string[];
    caloriesMin?: number;
    caloriesMax?: number;
}
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface MenuItemListResult {
    items: ExtendedMenuItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface ExtendedMenuItem extends Omit<MenuItem, 'nutritionalInfo' | 'allergens' | 'tags' | 'metadata'> {
    ingredients?: string[];
    isActive?: boolean;
    nutritionalInfo?: any;
    allergens?: string[];
    tags?: string[];
    metadata?: any;
}
export declare class MenuItemService {
    private static readonly CACHE_TTL;
    private static readonly MAX_BATCH_SIZE;
    static createMenuItem(input: CreateMenuItemInput): Promise<ExtendedMenuItem>;
    static getMenuItemById(id: string, includeSchool?: boolean): Promise<ExtendedMenuItem | null>;
    static getMenuItems(filters?: MenuItemFilters, pagination?: PaginationOptions): Promise<MenuItemListResult>;
    static getMenuItemsByCategory(category: MenuCategory, options?: {
        schoolId?: string;
        available?: boolean;
        limit?: number;
    }): Promise<ExtendedMenuItem[]>;
    static getFeaturedItems(options?: {
        schoolId?: string;
        category?: MenuCategory;
        limit?: number;
    }): Promise<ExtendedMenuItem[]>;
    static searchMenuItems(searchTerm: string, filters?: MenuItemFilters, pagination?: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: ExtendedMenuItem[];
        total: number;
    }>;
    static updateMenuItem(id: string, input: UpdateMenuItemInput): Promise<ExtendedMenuItem>;
    static deleteMenuItem(id: string, hard?: boolean): Promise<ExtendedMenuItem>;
    static updateSortOrders(updates: Array<{
        id: string;
        sortOrder: number;
    }>): Promise<void>;
    static toggleFeatured(id: string): Promise<ExtendedMenuItem>;
    static toggleAvailability(id: string): Promise<ExtendedMenuItem>;
    static getMenuItemsByAllergens(excludeAllergens: string[], options?: {
        schoolId?: string;
        category?: MenuCategory;
    }): Promise<ExtendedMenuItem[]>;
    static getNutritionalSummary(itemIds: string[]): Promise<{
        totalCalories: number;
        allergens: string[];
        nutritionalInfo: Record<string, any>;
    }>;
    private static validateCreateInput;
    private static validateUpdateInput;
    private static transformMenuItem;
    static bulkCreateMenuItems(items: CreateMenuItemInput[]): Promise<ExtendedMenuItem[]>;
    static bulkUpdateAvailability(updates: BulkAvailabilityUpdate[]): Promise<ExtendedMenuItem[]>;
    private static clearRelatedCaches;
    clearCache(): Promise<void>;
    disconnect(): Promise<void>;
    createMenuItem(input: CreateMenuItemInput): Promise<ExtendedMenuItem>;
    getMenuItemById(id: string, includeSchool?: boolean): Promise<ExtendedMenuItem | null>;
    getMenuItems(filters?: MenuItemFilters, pagination?: PaginationOptions): Promise<MenuItemListResult>;
    updateMenuItem(id: string, input: UpdateMenuItemInput): Promise<ExtendedMenuItem>;
    deleteMenuItem(id: string, hard?: boolean): Promise<ExtendedMenuItem>;
    getMenuItemsByCategory(category: MenuCategory, options?: {
        schoolId?: string;
        available?: boolean;
        limit?: number;
    }): Promise<ExtendedMenuItem[]>;
    getFeaturedItems(options?: {
        schoolId?: string;
        category?: MenuCategory;
        limit?: number;
    }): Promise<ExtendedMenuItem[]>;
    searchMenuItems(searchOptions: {
        query: string;
        schoolId?: string;
        filters?: MenuItemFilters;
        pagination?: {
            page?: number;
            limit?: number;
        };
        limit?: number;
    }): Promise<ExtendedMenuItem[]>;
    bulkCreateMenuItems(items: CreateMenuItemInput[]): Promise<ExtendedMenuItem[]>;
    bulkUpdateAvailability(updates: BulkAvailabilityUpdate[]): Promise<ExtendedMenuItem[]>;
    transformMenuItem(rawItem: any): ExtendedMenuItem;
    static getMenuStats(schoolId?: string): Promise<{
        totalItems: number;
        averagePrice: number;
        byCategory: Record<string, number>;
    }>;
}
export declare const menuItemService: MenuItemService;
//# sourceMappingURL=menuItem.service.d.ts.map