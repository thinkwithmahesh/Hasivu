import { Order } from '@prisma/client';
export declare class OrderRepository {
    private prisma;
    constructor();
    findAll(schoolId?: string): Promise<Order[]>;
    findById(id: string): Promise<Order | null>;
    findBySchool(schoolId: string): Promise<Order[]>;
    findByStudent(studentId: string): Promise<Order[]>;
    findByStatus(schoolId: string, status: string): Promise<Order[]>;
    findByDateRange(schoolId: string, startDate: Date, endDate: Date): Promise<Order[]>;
    create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
    update(id: string, data: Partial<Order>): Promise<Order>;
    updateStatus(id: string, status: string): Promise<Order>;
    delete(id: string): Promise<Order>;
    getPendingOrders(schoolId: string): Promise<Order[]>;
    getActiveOrders(schoolId: string): Promise<Order[]>;
    findByIdWithIncludes(id: string, include?: any): Promise<Order | null>;
    static findByIdWithIncludes(id: string, include?: any): Promise<Order | null>;
    static findById(id: string): Promise<Order | null>;
    static update(id: string, data: Partial<Order>): Promise<Order>;
    static findMany(options: {
        filters?: {
            studentId?: string;
            status?: string;
            schoolId?: string;
        };
        skip?: number;
        take?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        items: Order[];
        total: number;
    }>;
    static count(filters?: {
        studentId?: string;
        status?: string;
        schoolId?: string;
    }): Promise<number>;
    static getAnalytics(schoolId: string, startDate?: Date, endDate?: Date): Promise<{
        totalOrders: number;
        totalRevenue: number;
        deliveredOrders: number;
        cancelledOrders: number;
        ordersByStatus: {
            [status: string]: number;
        };
        revenueByDay: Array<{
            date: string;
            revenue: number;
        }>;
    }>;
    findMany(options: {
        filters?: {
            studentId?: string;
            status?: string;
        };
        skip?: number;
        take?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        items: Order[];
        total: number;
    }>;
    count(filters?: {
        studentId?: string;
        status?: string;
    }): Promise<number>;
    getAnalytics(schoolId: string, startDate?: Date, endDate?: Date): Promise<{
        totalOrders: number;
        totalRevenue: number;
        deliveredOrders: number;
        cancelledOrders: number;
        ordersByStatus: {
            [status: string]: number;
        };
        revenueByDay: Array<{
            date: string;
            revenue: number;
        }>;
    }>;
}
export default OrderRepository;
//# sourceMappingURL=order.repository.d.ts.map