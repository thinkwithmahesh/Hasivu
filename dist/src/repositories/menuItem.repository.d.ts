import { MenuItem } from '@prisma/client';
export declare enum MenuCategory {
    BREAKFAST = "BREAKFAST",
    LUNCH = "LUNCH",
    DINNER = "DINNER",
    SNACKS = "SNACKS",
    BEVERAGES = "BEVERAGES",
    DESSERTS = "DESSERTS"
}
export interface MenuItemFindOptions {
    filters?: {
        schoolId?: string;
        category?: MenuCategory;
        available?: boolean;
        priceMin?: number;
        priceMax?: number;
        featured?: boolean;
        search?: string;
        ids?: string[];
    };
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface MenuItemFindResult {
    items: MenuItem[];
    total: number;
}
export interface MenuItemSearchOptions extends MenuItemFindOptions {
    query: string;
}
export interface SortOrderUpdate {
    id: string;
    sortOrder: number;
}
export declare class MenuItemRepository {
    private static prisma;
    static initialize(): void;
    static findAll(schoolId?: string): Promise<MenuItem[]>;
    static findById(id: string): Promise<MenuItem | null>;
    static findByNameAndSchool(name: string, schoolId: string): Promise<MenuItem | null>;
    static findBySchool(schoolId: string): Promise<MenuItem[]>;
    static findByCategory(schoolId: string, category: string): Promise<MenuItem[]>;
    static create(data: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuItem>;
    static update(id: string, data: Partial<MenuItem>): Promise<MenuItem>;
    static delete(id: string): Promise<MenuItem>;
    static search(options: MenuItemSearchOptions): Promise<MenuItemFindResult>;
    static findMany(options: MenuItemFindOptions): Promise<MenuItemFindResult>;
    static batchUpdateSortOrders(updates: SortOrderUpdate[]): Promise<void>;
    static nameExists(name: string, schoolId: string): Promise<boolean>;
}
export default MenuItemRepository;
//# sourceMappingURL=menuItem.repository.d.ts.map