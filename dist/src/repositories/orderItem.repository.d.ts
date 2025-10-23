import { OrderItem } from '@prisma/client';
export declare class OrderItemRepository {
    private prisma;
    constructor();
    findAll(orderId?: string): Promise<OrderItem[]>;
    findById(id: string): Promise<OrderItem | null>;
    findByOrder(orderId: string): Promise<OrderItem[]>;
    findByMenuItem(menuItemId: string): Promise<OrderItem[]>;
    create(data: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrderItem>;
    update(id: string, data: Partial<OrderItem>): Promise<OrderItem>;
    delete(id: string): Promise<OrderItem>;
    deleteByOrder(orderId: string): Promise<number>;
    getOrderTotal(orderId: string): Promise<number>;
    static getPopularItems(_query: {
        schoolId: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<Array<{
        menuItemId: string;
        menuItemName: string;
        totalQuantity: number;
        orderCount: number;
        revenue: number;
    }>>;
}
export default OrderItemRepository;
//# sourceMappingURL=orderItem.repository.d.ts.map