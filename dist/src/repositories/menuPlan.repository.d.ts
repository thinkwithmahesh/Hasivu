import { MenuPlan } from '@prisma/client';
export declare class MenuPlanRepository {
    private prisma;
    constructor();
    findAll(schoolId?: string): Promise<MenuPlan[]>;
    findById(id: string): Promise<MenuPlan | null>;
    findBySchool(schoolId: string): Promise<MenuPlan[]>;
    findActive(schoolId: string): Promise<MenuPlan[]>;
    create(data: Omit<MenuPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuPlan>;
    update(id: string, data: Partial<MenuPlan>): Promise<MenuPlan>;
    delete(id: string): Promise<MenuPlan>;
    activate(id: string): Promise<MenuPlan>;
    deactivate(id: string): Promise<MenuPlan>;
    static findOverlapping(schoolId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<MenuPlan[]>;
    static create(data: Omit<MenuPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuPlan>;
    static findById(id: string): Promise<MenuPlan | null>;
    static update(id: string, data: Partial<MenuPlan>): Promise<MenuPlan>;
    static updateStatus(id: string, status: string): Promise<MenuPlan>;
    static getStatistics(schoolId?: string): Promise<any>;
}
export default MenuPlanRepository;
//# sourceMappingURL=menuPlan.repository.d.ts.map