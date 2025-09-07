import { MenuItem, Prisma } from '@prisma/client';
export declare enum MenuCategory {
    BREAKFAST = "BREAKFAST",
    LUNCH = "LUNCH",
    SNACKS = "SNACKS",
    DINNER = "DINNER"
}
export interface MenuItemFindOptions {
    filters?: Record<string, any>;
    ids?: string[];
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    include?: Prisma.MenuItemInclude;
}
export interface MenuItemFindResult {
    items: MenuItem[];
    total: number;
}
export interface MenuItemSearchOptions {
    query?: string;
    category?: MenuCategory;
    schoolId?: string;
    available?: boolean;
    featured?: boolean;
    priceMin?: number;
    priceMax?: number;
    allergens?: string[];
    tags?: string[];
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}
export declare class MenuItemRepository {
    static create(data: Prisma.MenuItemCreateInput): Promise<MenuItem>;
    static findById(id: string, includeSchool?: boolean): Promise<MenuItem | null>;
    static findByNameAndSchool(name: string, schoolId: string): Promise<MenuItem | null>;
    static nameExists(name: string, schoolId: string): Promise<boolean>;
    static findByIdWithIncludes(id: string, include: Prisma.MenuItemInclude): Promise<MenuItem | null>;
    static findMany(options?: MenuItemFindOptions): Promise<MenuItemFindResult>;
    static search(searchTerm: string, filters?: Record<string, any>, pagination?: {
        page?: number;
        limit?: number;
    }): Promise<MenuItemFindResult>;
    static searchAdvanced(options?: MenuItemSearchOptions): Promise<MenuItemFindResult>;
    static update(id: string, data: Prisma.MenuItemUpdateInput): Promise<MenuItem>;
    static delete(id: string): Promise<MenuItem>;
    static count(filters?: Record<string, any>): Promise<number>;
    static findBySchoolId(schoolId: string, options?: Omit<MenuItemFindOptions, 'filters'>): Promise<MenuItemFindResult>;
    static findByCategory(category: MenuCategory, options?: Omit<MenuItemFindOptions, 'filters'>): Promise<MenuItemFindResult>;
    static findAvailable(schoolId?: string, options?: Omit<MenuItemFindOptions, 'filters'>): Promise<MenuItemFindResult>;
    static findFeatured(schoolId?: string, options?: Omit<MenuItemFindOptions, 'filters'>): Promise<MenuItemFindResult>;
    static updateMany(where: Prisma.MenuItemWhereInput, data: Prisma.MenuItemUpdateManyMutationInput): Promise<Prisma.BatchPayload>;
    static getStatistics(schoolId?: string): Promise<{
        totalItems: number;
        availableItems: number;
        featuredItems: number;
        itemsByCategory: Record<string, number>;
        averagePrice: number;
    }>;
    static findByPriceRange(minPrice: number, maxPrice: number, schoolId?: string, options?: Omit<MenuItemFindOptions, 'filters'>): Promise<MenuItemFindResult>;
    static getPopularItems(schoolId?: string, limit?: number): Promise<Array<MenuItem & {
        orderCount: number;
    }>>;
    static batchUpdateSortOrders(updates: Array<{
        id: string;
        sortOrder: number;
    }>): Promise<void>;
}
export declare const menuItemRepository: MenuItemRepository;
//# sourceMappingURL=menuItem.repository.d.ts.map