import { MenuPlan } from '@prisma/client';
export declare enum MenuPlanStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    ARCHIVED = "ARCHIVED"
}
export interface CreateMenuPlanInput {
    name: string;
    description?: string;
    schoolId: string;
    startDate: Date;
    endDate: Date;
    status?: MenuPlanStatus;
    isActive?: boolean;
    approvalRequired?: boolean;
    approvalWorkflow?: Record<string, any>;
    metadata?: Record<string, any>;
    createdBy: string;
}
export interface UpdateMenuPlanInput {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    status?: MenuPlanStatus;
    isActive?: boolean;
    approvalRequired?: boolean;
    approvalWorkflow?: Record<string, any>;
    metadata?: Record<string, any>;
}
export interface MenuPlanFilters {
    schoolId?: string;
    status?: MenuPlanStatus;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
    createdBy?: string;
    approvalRequired?: boolean;
}
export interface DailyMenuAssignment {
    date: Date;
    menuItems: Array<{
        menuItemId: string;
        mealType: 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER';
        servingSize?: number;
        notes?: string;
    }>;
}
export interface MenuItemAssignment {
    menuItemId: string;
    mealType: 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER';
    date: Date;
    servingSize?: number;
    notes?: string;
}
export interface MenuPlanWithMenus extends MenuPlan {
    dailyMenus: Array<{
        id: string;
        date: Date;
        mealType: string;
        menuItems: Array<{
            id: string;
            name: string;
            category: string;
            price: number;
            servingSize?: number;
            notes?: string;
        }>;
    }>;
}
export interface MenuPlanAnalytics {
    totalMenuItems: number;
    averageCaloriesPerDay: number;
    allergenSummary: Record<string, number>;
    costAnalysis: {
        totalCost: number;
        averageCostPerDay: number;
        costByMealType: Record<string, number>;
    };
    nutritionalSummary: Record<string, number>;
}
export declare class MenuPlanService {
    private static readonly CACHE_TTL;
    private static readonly MAX_PLAN_DURATION_DAYS;
    private static readonly VALID_APPROVAL_TYPES;
    static createMenuPlan(input: CreateMenuPlanInput): Promise<MenuPlan>;
    static getMenuPlanById(id: string, includeMenus?: boolean): Promise<MenuPlanWithMenus | MenuPlan | null>;
    static getMenuPlans(filters?: MenuPlanFilters, pagination?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        plans: MenuPlan[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    static getActiveMenuPlan(schoolId: string, date: Date): Promise<MenuPlan | null>;
    static updateMenuPlan(id: string, input: UpdateMenuPlanInput): Promise<MenuPlan>;
    static deleteMenuPlan(id: string): Promise<MenuPlan>;
    static assignDailyMenus(planId: string, assignments: DailyMenuAssignment[]): Promise<void>;
    static activateMenuPlan(id: string): Promise<MenuPlan>;
    static submitForApproval(id: string, submittedBy: string): Promise<MenuPlan>;
    static approveMenuPlan(id: string, approvedBy: string, notes?: string): Promise<MenuPlan>;
    static rejectMenuPlan(id: string, rejectedBy: string, reason: string): Promise<MenuPlan>;
    static getMenuPlanAnalytics(id: string): Promise<MenuPlanAnalytics>;
    static cloneMenuPlan(id: string, newName: string, startDate: Date, endDate: Date, createdBy: string): Promise<MenuPlan>;
    private static validateCreateInput;
    private static validateUpdateInput;
    private static validateDailyMenuAssignment;
    private static calculateAnalytics;
    private static mapDailyMenusToAssignments;
    private static clearRelatedCaches;
    disconnect(): Promise<void>;
    createMenuPlan(input: CreateMenuPlanInput): Promise<MenuPlan>;
    getMenuPlanById(id: string, includeDetails?: boolean): Promise<MenuPlan | null>;
    updateMenuPlan(id: string, input: UpdateMenuPlanInput): Promise<MenuPlan>;
    deleteMenuPlan(id: string): Promise<boolean>;
    getActiveMenuPlan(schoolId: string): Promise<MenuPlan | null>;
    assignMenuItemsToPlan(planId: string, assignments: MenuItemAssignment[]): Promise<MenuPlan>;
    activateMenuPlan(planId: string): Promise<MenuPlan>;
    deactivateMenuPlan(planId: string): Promise<MenuPlan>;
    createWeeklyPlan(input: CreateMenuPlanInput): Promise<MenuPlan>;
    calculateNutritionalSummary(planId: string): Promise<any>;
}
export declare const menuPlanService: MenuPlanService;
//# sourceMappingURL=menuPlan.service.d.ts.map