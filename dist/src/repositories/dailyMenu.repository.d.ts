import { DailyMenu, Prisma } from '@prisma/client';
export declare enum MenuCategory {
    BREAKFAST = "BREAKFAST",
    LUNCH = "LUNCH",
    SNACKS = "SNACKS",
    DINNER = "DINNER"
}
export declare enum DayType {
    WEEKDAY = "WEEKDAY",
    WEEKEND = "WEEKEND",
    HOLIDAY = "HOLIDAY",
    SPECIAL_EVENT = "SPECIAL_EVENT"
}
export interface DailyMenuFindOptions {
    filters?: {
        menuPlanId?: string;
        dateFrom?: Date;
        dateTo?: Date;
        dayType?: DayType;
        isActive?: boolean;
    };
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeItems?: boolean;
}
export interface DailyMenuWithItems extends DailyMenu {
    menuItems?: Array<{
        id: string;
        category: string;
        isVisible: boolean;
        menuItem: {
            id: string;
            name: string;
            description: string | null;
            price: any;
            category: string;
            available: boolean;
            imageUrl: string | null;
        };
    }>;
}
export declare class DailyMenuRepository {
    static create(data: Prisma.DailyMenuCreateInput): Promise<DailyMenu>;
    static findById(id: string): Promise<DailyMenu | null>;
    static findByIdWithItems(id: string): Promise<DailyMenuWithItems | null>;
    static findByDateAndPlan(date: Date, menuPlanId: string): Promise<DailyMenu | null>;
    static findMany(options?: DailyMenuFindOptions): Promise<DailyMenu[]>;
    static findManyWithItems(filters?: {
        menuPlanId?: string;
        dateFrom?: Date;
        dateTo?: Date;
        dayType?: DayType;
        isActive?: boolean;
    }): Promise<DailyMenuWithItems[]>;
    static update(id: string, data: Prisma.DailyMenuUpdateInput): Promise<DailyMenu>;
    static delete(id: string): Promise<DailyMenu>;
    static count(filters?: Record<string, any>): Promise<number>;
    static findByMenuPlanId(menuPlanId: string, options?: Omit<DailyMenuFindOptions, 'filters'>): Promise<DailyMenu[]>;
    static findByDateRange(startDate: Date, endDate: Date, schoolId?: string, options?: Omit<DailyMenuFindOptions, 'filters'>): Promise<DailyMenu[]>;
    static findActive(schoolId?: string, options?: Omit<DailyMenuFindOptions, 'filters'>): Promise<DailyMenu[]>;
    static updateMany(where: Prisma.DailyMenuWhereInput, data: Prisma.DailyMenuUpdateManyMutationInput): Promise<Prisma.BatchPayload>;
    static getStatistics(menuPlanId?: string): Promise<{
        totalMenus: number;
        activeMenus: number;
        menusByDayType: Record<string, number>;
        averageItemsPerMenu: number;
    }>;
    static clone(sourceId: string, targetDate: Date, targetMenuPlanId?: string): Promise<DailyMenu>;
}
export declare const dailyMenuRepository: DailyMenuRepository;
//# sourceMappingURL=dailyMenu.repository.d.ts.map