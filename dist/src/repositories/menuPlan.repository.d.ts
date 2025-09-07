import { MenuPlan } from '@prisma/client';
interface MenuPlanCreateInput {
    name: string;
    description?: string;
    schoolId: string;
    startDate: Date;
    endDate: Date;
    isTemplate?: boolean;
    isRecurring?: boolean;
    status?: string;
    approvalWorkflow?: any;
    recurringPattern?: any;
    templateCategory?: string;
    metadata?: any;
    createdBy: string;
}
interface MenuPlanFilters {
    schoolId?: string;
    status?: string;
    isTemplate?: boolean;
    isRecurring?: boolean;
    templateCategory?: string;
    createdBy?: string;
    dateFrom?: Date;
    dateTo?: Date;
}
interface PaginationOptions {
    filters?: MenuPlanFilters;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
interface MenuPlanResponse {
    plans: MenuPlan[];
    total: number;
    pages: number;
    currentPage: number;
}
export declare class MenuPlanRepository {
    private static prisma;
    static create(data: MenuPlanCreateInput): Promise<MenuPlan>;
    static findById(id: string, includeDetails?: boolean): Promise<MenuPlan | null>;
    static findMany(options?: PaginationOptions): Promise<MenuPlanResponse>;
    static update(id: string, data: Partial<MenuPlanCreateInput>): Promise<MenuPlan>;
    static delete(id: string): Promise<MenuPlan>;
    static getTemplates(schoolId: string, category?: string): Promise<MenuPlan[]>;
    static getActivePlansForDateRange(schoolId: string, startDate: Date, endDate: Date): Promise<MenuPlan[]>;
    static findOverlapping(schoolId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<MenuPlan[]>;
    static updateStatus(id: string, status: string, approvedBy?: string): Promise<MenuPlan>;
    static getStatistics(schoolId?: string): Promise<{
        total: number;
        active: number;
        templates: number;
        pendingApproval: number;
        byStatus: Record<string, number>;
    }>;
    static cloneAsTemplate(sourceId: string, templateData: {
        name: string;
        description?: string;
        templateCategory?: string;
        createdBy: string;
    }): Promise<MenuPlan>;
}
export default MenuPlanRepository;
//# sourceMappingURL=menuPlan.repository.d.ts.map