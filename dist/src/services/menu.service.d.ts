import { MenuItem, MenuPlan } from '@prisma/client';
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
    preparationTime?: number;
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
export declare class MenuService {
    private static instance;
    private prisma;
    private constructor();
    static getInstance(): MenuService;
    createMenuItem(data: CreateMenuItemData): Promise<ServiceResponse<MenuItem>>;
    updateMenuItem(data: UpdateMenuItemData): Promise<ServiceResponse<MenuItem>>;
    deleteMenuItem(id: string): Promise<ServiceResponse<boolean>>;
    getMenuItem(id: string): Promise<ServiceResponse<MenuItem>>;
    getMenuItems(filters?: MenuItemFilters): Promise<ServiceResponse<MenuItem[]>>;
    getMenuByCategory(schoolId: string, category: string): Promise<ServiceResponse<MenuItem[]>>;
    bulkUpdateMenuItems(updates: BulkMenuItemUpdate): Promise<ServiceResponse<{
        successful: number;
        failed: number;
        errors: any[];
    }>>;
    createMenuPlan(data: MenuPlanData): Promise<ServiceResponse<MenuPlan>>;
    addMenuSlot(data: MenuSlotData): Promise<ServiceResponse<any>>;
    getMenuAnalytics(schoolId: string, startDate?: Date, endDate?: Date): Promise<ServiceResponse<MenuAnalytics>>;
    private clearMenuCache;
    private safeDecimalOperation;
    getMenuItemsLegacy(): Promise<any[]>;
    createMenuItemLegacy(item: any): Promise<any>;
    updateMenuItemLegacy(id: string, updates: any): Promise<void>;
    deleteMenuItemLegacy(id: string): Promise<void>;
}
declare const menuServiceInstance: MenuService;
export declare const menuService: MenuService;
export declare const _menuService: MenuService;
export default menuServiceInstance;
//# sourceMappingURL=menu.service.d.ts.map