import { OrderItem, Prisma } from '@prisma/client';
export interface OrderItemFindOptions {
    filters?: Record<string, any>;
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    include?: Prisma.OrderItemInclude;
}
export interface OrderItemFindResult {
    items: OrderItem[];
    total: number;
}
export interface PopularItem {
    menuItemId: string;
    menuItemName: string;
    totalQuantity: number;
    orderCount: number;
    revenue: number;
}
export declare class OrderItemRepository {
    static create(data: Prisma.OrderItemCreateInput): Promise<OrderItem>;
    static createMany(data: Prisma.OrderItemCreateManyInput[]): Promise<Prisma.BatchPayload>;
    static findById(id: string): Promise<OrderItem | null>;
    static findByIdWithIncludes(id: string, include: Prisma.OrderItemInclude): Promise<OrderItem | null>;
    static findMany(options?: OrderItemFindOptions): Promise<OrderItemFindResult>;
    static update(id: string, data: Prisma.OrderItemUpdateInput): Promise<OrderItem>;
    static delete(id: string): Promise<OrderItem>;
    static findByOrderId(orderId: string, options?: Omit<OrderItemFindOptions, 'filters'>): Promise<OrderItemFindResult>;
    static findByMenuItemId(menuItemId: string, options?: Omit<OrderItemFindOptions, 'filters'>): Promise<OrderItemFindResult>;
    static count(filters?: Record<string, any>): Promise<number>;
    static getPopularItems(filters?: Record<string, any>, limit?: number): Promise<PopularItem[]>;
    static getStatistics(filters?: Record<string, any>): Promise<{
        totalItems: number;
        totalQuantity: number;
        totalRevenue: number;
        averageQuantityPerOrder: number;
        averageRevenuePerOrder: number;
    }>;
    static updateMany(where: Prisma.OrderItemWhereInput, data: Prisma.OrderItemUpdateManyMutationInput): Promise<Prisma.BatchPayload>;
    static deleteMany(where: Prisma.OrderItemWhereInput): Promise<Prisma.BatchPayload>;
    static findWithMenuItems(filters?: Record<string, any>, options?: Omit<OrderItemFindOptions, 'filters' | 'include'>): Promise<OrderItemFindResult>;
    static getRevenueBreakdown(filters?: Record<string, any>): Promise<Array<{
        menuItemId: string;
        menuItemName: string;
        totalRevenue: number;
        totalQuantity: number;
        averagePrice: number;
    }>>;
    private static buildWhereClause;
}
export declare const orderItemRepository: OrderItemRepository;
//# sourceMappingURL=orderItem.repository.d.ts.map