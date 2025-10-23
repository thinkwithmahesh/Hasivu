import { Order } from '@prisma/client';
import { OrderService } from './order.service';
export interface OrderAnalytics {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: {
        [status: string]: number;
    };
    ordersByDay: {
        [date: string]: number;
    };
    topStudents: Array<{
        studentId: string;
        orderCount: number;
        totalSpent: number;
    }>;
}
export interface BulkOrderResult {
    successful: number;
    failed: number;
    errors: Array<{
        index: number;
        error: string;
    }>;
}
export declare class EnhancedOrderService extends OrderService {
    private static enhancedInstance;
    private notificationService;
    private paymentService;
    private constructor();
    static getInstance(): EnhancedOrderService;
    createWithNotification(data: any, notifyStudent?: boolean): Promise<Order>;
    updateStatusWithNotification(id: string, status: string): Promise<Order>;
    getAnalytics(schoolId: string, startDate?: Date, endDate?: Date): Promise<OrderAnalytics>;
    bulkCreate(orders: any[]): Promise<BulkOrderResult>;
    bulkUpdateStatus(orderIds: string[], status: string): Promise<BulkOrderResult>;
    getRevenueByDateRange(schoolId: string, startDate: Date, endDate: Date): Promise<{
        date: string;
        revenue: number;
    }[]>;
    getOrderFulfillmentRate(schoolId: string): Promise<{
        total: number;
        completed: number;
        cancelled: number;
        fulfillmentRate: number;
    }>;
    static getCart(userId: string): Promise<any>;
    static clearCart(_userId: string): Promise<void>;
}
export declare const enhancedOrderService: EnhancedOrderService;
export default EnhancedOrderService;
//# sourceMappingURL=order.service.enhanced.d.ts.map