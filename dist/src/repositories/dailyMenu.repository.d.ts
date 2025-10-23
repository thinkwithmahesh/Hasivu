import { DailyMenu } from '@prisma/client';
export declare class DailyMenuRepository {
    private static prisma;
    static initialize(): void;
    constructor();
    static findAll(schoolId?: string): Promise<DailyMenu[]>;
    static findById(id: string): Promise<DailyMenu | null>;
    static findBySchool(schoolId: string): Promise<DailyMenu[]>;
    static findByDate(schoolId: string, date: Date): Promise<DailyMenu | null>;
    static findByDateRange(schoolId: string, startDate: Date, endDate: Date): Promise<DailyMenu[]>;
    static create(data: Omit<DailyMenu, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailyMenu>;
    static update(id: string, data: Partial<DailyMenu>): Promise<DailyMenu>;
    static delete(id: string): Promise<DailyMenu>;
    static getUpcoming(schoolId: string, limit?: number): Promise<DailyMenu[]>;
    static findByIdWithItems(id: string): Promise<any>;
    static findManyWithItems(filters: any): Promise<any[]>;
}
export default DailyMenuRepository;
//# sourceMappingURL=dailyMenu.repository.d.ts.map