import { DailyMenu } from '@prisma/client';
export declare enum MenuCategory {
    BREAKFAST = "BREAKFAST",
    LUNCH = "LUNCH",
    SNACK = "SNACK",
    BEVERAGE = "BEVERAGE",
    DESSERT = "DESSERT",
    SPECIAL = "SPECIAL"
}
export declare enum DayType {
    WEEKDAY = "WEEKDAY",
    WEEKEND = "WEEKEND",
    HOLIDAY = "HOLIDAY",
    SPECIAL_EVENT = "SPECIAL_EVENT"
}
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
export interface UpdateDailyMenuInput {
    menuItemIds?: string[];
    availableQuantity?: number;
    notes?: string;
    metadata?: Record<string, any>;
    isActive?: boolean;
}
export interface DailyMenuFilters {
    schoolId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    category?: MenuCategory;
    dayType?: DayType;
    isActive?: boolean;
}
export interface DailyMenuWithItems extends DailyMenu {
    menuItems: any[];
}
export declare class DailyMenuService {
    private static readonly CACHE_TTL;
    private static readonly MAX_ITEMS_PER_MENU;
    private static instance;
    static getInstance(): DailyMenuService;
    static createDailyMenu(input: CreateDailyMenuInput): Promise<DailyMenuWithItems>;
    static getDailyMenuById(id: string): Promise<DailyMenuWithItems | null>;
    static getDailyMenusByDateRange(schoolId: string, startDate: Date, endDate: Date, category?: MenuCategory): Promise<DailyMenuWithItems[]>;
    static getDailyMenuByDate(schoolId: string, date: Date, category?: MenuCategory): Promise<DailyMenuWithItems[]>;
    static updateDailyMenu(id: string, input: UpdateDailyMenuInput): Promise<DailyMenuWithItems>;
    static deleteDailyMenu(id: string, hard?: boolean): Promise<DailyMenu>;
    static cloneDailyMenu(sourceId: string, targetDate: Date, schoolId?: string): Promise<DailyMenuWithItems>;
    static getWeeklyMenuPlan(schoolId: string, startDate: Date): Promise<Record<string, DailyMenuWithItems[]>>;
    private static validateCreateInput;
    private static clearRelatedCaches;
}
export declare const dailyMenuService: DailyMenuService;
export default DailyMenuService;
//# sourceMappingURL=dailyMenu.service.d.ts.map