import { Order, Prisma } from '@prisma/client';
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PREPARING = "preparing",
    READY = "ready",
    OUT_FOR_DELIVERY = "out_for_delivery",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export interface OrderFindOptions {
    filters?: Record<string, any>;
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    include?: Prisma.OrderInclude;
}
export interface OrderFindResult {
    items: Order[];
    total: number;
}
export interface AnalyticsResult {
    totalOrders: number;
    totalRevenue: number;
    deliveredOrders: number;
    cancelledOrders: number;
    ordersByStatus: Record<OrderStatus, number>;
    revenueByDay: Array<{
        date: string;
        revenue: number;
        orders: number;
    }>;
}
export declare class OrderRepository {
    static create(data: Prisma.OrderCreateInput): Promise<Order>;
    static findById(id: string): Promise<Order | null>;
    static findByIdWithIncludes(id: string, include: Prisma.OrderInclude): Promise<Order | null>;
    static findMany(options?: OrderFindOptions): Promise<OrderFindResult>;
    static update(id: string, data: Prisma.OrderUpdateInput): Promise<Order>;
    static delete(id: string): Promise<Order>;
    static count(filters?: Record<string, any>): Promise<number>;
    static getAnalytics(filters?: Record<string, any>, groupBy?: 'day' | 'week' | 'month'): Promise<AnalyticsResult>;
    static findByStudentId(studentId: string, options?: Omit<OrderFindOptions, 'filters'> & {
        status?: OrderStatus;
    }): Promise<OrderFindResult>;
    static findByParentId(parentId: string, options?: Omit<OrderFindOptions, 'filters'> & {
        status?: OrderStatus;
    }): Promise<OrderFindResult>;
    static findBySchoolId(schoolId: string, options?: Omit<OrderFindOptions, 'filters'> & {
        status?: OrderStatus;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<OrderFindResult>;
    static findActiveOrders(filters?: Record<string, any>, options?: Omit<OrderFindOptions, 'filters'>): Promise<OrderFindResult>;
    static findByDeliveryDate(deliveryDate: Date, options?: Omit<OrderFindOptions, 'filters'> & {
        schoolId?: string;
    }): Promise<OrderFindResult>;
    static updateMany(where: Prisma.OrderWhereInput, data: Prisma.OrderUpdateManyMutationInput): Promise<Prisma.BatchPayload>;
    static getDashboardStats(schoolId?: string, dateRange?: {
        from: Date;
        to: Date;
    }): Promise<{
        todayOrders: number;
        pendingOrders: number;
        completedOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
    }>;
}
export declare const orderRepository: OrderRepository;
//# sourceMappingURL=order.repository.d.ts.map