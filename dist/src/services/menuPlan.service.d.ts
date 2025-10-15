export interface MenuPlanItem {
    menuItemId: string;
    quantity?: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}
export interface CreateMenuPlanDto {
    schoolId: string;
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    items: MenuPlanItem[];
    isActive?: boolean;
}
export interface UpdateMenuPlanDto {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    items?: MenuPlanItem[];
    isActive?: boolean;
}
export interface CreateMenuPlanInput {
    name: string;
    description?: string;
    schoolId: string;
    startDate: Date;
    endDate: Date;
    status: MenuPlanStatus;
    createdBy: string;
    isTemplate?: boolean;
    templateCategory?: string;
}
export interface UpdateMenuPlanInput {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
}
export declare enum MenuPlanStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare class MenuPlanService {
    private static instance;
    private prisma;
    private constructor();
    static getInstance(): MenuPlanService;
    create(data: CreateMenuPlanDto): Promise<any>;
    findById(_id: string): Promise<any | null>;
    findBySchool(_schoolId: string): Promise<any[]>;
    findActiveBySchool(_schoolId: string, _date?: Date): Promise<any | null>;
    update(id: string, data: UpdateMenuPlanDto): Promise<any>;
    delete(id: string): Promise<any>;
    activate(id: string): Promise<any>;
    deactivate(id: string): Promise<any>;
    getMenuForDate(schoolId: string, date: Date, mealType?: string): Promise<MenuPlanItem[]>;
    existsForDateRange(_schoolId: string, _startDate: Date, _endDate: Date): Promise<boolean>;
    clone(planId: string, startDate: Date, endDate: Date): Promise<any>;
    static createMenuPlan(data: CreateMenuPlanInput): Promise<any>;
    static updateMenuPlan(id: string, data: UpdateMenuPlanInput): Promise<any>;
    static applyTemplate(data: {
        templateId: string;
        name: string;
        schoolId: string;
        startDate: Date;
        endDate: Date;
    }): Promise<any>;
    static updateStatus(id: string, status: MenuPlanStatus, approvedBy: string): Promise<any>;
    static getStatistics(_schoolId: string): Promise<any>;
}
export declare const menuPlanService: MenuPlanService;
export default MenuPlanService;
//# sourceMappingURL=menuPlan.service.d.ts.map