import { MenuItem } from '@prisma/client';
import { MenuCategory } from '../repositories/menuItem.repository';
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
export declare class MenuItemService {
    private static repository;
    private static instance;
    static getInstance(): MenuItemService;
    static createMenuItem(input: CreateMenuItemInput): Promise<MenuItem>;
    static getMenuItemById(id: string, includeUnavailable?: boolean): Promise<MenuItem | null>;
    static getMenuItems(filters?: MenuItemFilters, pagination?: PaginationOptions): Promise<MenuItemListResult>;
    static searchMenuItems(term: string, filters?: MenuItemFilters, pagination?: PaginationOptions): Promise<MenuItemListResult>;
    static updateMenuItem(id: string, input: UpdateMenuItemInput): Promise<MenuItem>;
    static deleteMenuItem(id: string, hard?: boolean): Promise<MenuItem>;
    static updateSortOrders(updates: SortOrderUpdate[]): Promise<void>;
    static toggleFeatured(id: string): Promise<MenuItem>;
    static getMenuItemsByAllergens(allergens: string[]): Promise<MenuItem[]>;
    static getNutritionalSummary(itemIds: string[]): Promise<NutritionalSummary>;
    static getFeaturedItems(options?: FeaturedItemsOptions): Promise<MenuItem[]>;
    static getMenuItemsByCategory(category: MenuCategory, options?: CategoryItemsOptions): Promise<MenuItem[]>;
    static toggleAvailability(id: string): Promise<MenuItem>;
    static create(input: CreateMenuItemInput): Promise<MenuItem>;
    static findById(id: string): Promise<MenuItem | null>;
    static findBySchool(schoolId: string, includeUnavailable?: boolean): Promise<MenuItem[]>;
    static findByCategory(schoolId: string, category: MenuCategory): Promise<MenuItem[]>;
    static search(schoolId: string, query: string): Promise<MenuItem[]>;
    static getMenuStats(schoolId?: string): Promise<{
        totalItems: number;
        averagePrice: number;
        byCategory: Record<MenuCategory, number>;
    }>;
    private static extendMenuItem;
}
export default MenuItemService;
//# sourceMappingURL=menuItem.service.d.ts.map