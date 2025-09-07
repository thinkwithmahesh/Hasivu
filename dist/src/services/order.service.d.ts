import { Order } from '@prisma/client';
export declare enum OrderStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    PREPARING = "PREPARING",
    READY = "READY",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}
export interface CreateOrderInput {
    studentId: string;
    parentId: string;
    schoolId: string;
    items: Array<{
        menuItemId: string;
        quantity: number;
        specialInstructions?: string;
        customizations?: Record<string, any>;
    }>;
    deliveryDate: Date;
    deliveryType: 'pickup' | 'delivery';
    deliveryTime?: string;
    deliveryAddress?: string;
    specialInstructions?: string;
    metadata?: Record<string, any>;
}
export interface CartItem {
    menuItemId: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
    customizations?: Record<string, any>;
}
export interface Cart {
    items: CartItem[];
    totalAmount: number;
    lastUpdated: Date;
    expiresAt: Date;
}
export interface AddToCartInput {
    studentId: string;
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
    customizations?: Record<string, any>;
}
export interface ProcessPaymentInput {
    orderId: string;
    paymentMethod: 'razorpay' | 'wallet' | 'cash';
    paymentDetails?: Record<string, any>;
    amountPaid?: number;
}
export interface OrderTrackingData extends Order {
    timeline: Array<{
        status: OrderStatus;
        timestamp: Date;
        message?: string;
    }>;
    estimatedDelivery?: Date;
    canCancel: boolean;
    deliveryDetails?: {
        verifiedAt: Date;
        location: string;
        rfidData: Record<string, any>;
    };
}
export interface OrdersQuery {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    dateFrom?: Date;
    dateTo?: Date;
    schoolId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface AnalyticsQuery {
    schoolId?: string;
    startDate: Date;
    endDate: Date;
    groupBy?: 'day' | 'week' | 'month';
}
export interface OrderAnalytics {
    totalOrders: number;
    totalRevenue: number;
    deliveryRate: number;
    cancellationRate: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus, number>;
    revenueByDay: Array<{
        date: string;
        revenue: number;
        orders: number;
    }>;
}
export interface PopularItemsQuery {
    schoolId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}
export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
        details?: any;
    };
}
export declare class OrderService {
    private static readonly CACHE_TTL;
    private static readonly CART_EXPIRY;
    private static readonly MAX_QUANTITY_PER_ITEM;
    private static readonly ORDER_CUTOFF_HOURS;
    private static readonly VALID_STATUS_TRANSITIONS;
    static createOrder(input: CreateOrderInput): Promise<ServiceResponse<Order>>;
    static addToCart(input: AddToCartInput): Promise<ServiceResponse<Cart>>;
    static updateOrderStatus(orderId: string, newStatus: OrderStatus, message?: string): Promise<ServiceResponse<Order>>;
    static processOrderPayment(input: ProcessPaymentInput): Promise<ServiceResponse<any>>;
    static getOrderTracking(orderId: string): Promise<ServiceResponse<OrderTrackingData>>;
    static getOrdersByStudent(studentId: string, query?: OrdersQuery): Promise<ServiceResponse<{
        orders: Order[];
        pagination: any;
    }>>;
    static cancelOrder(orderId: string, reason: string): Promise<ServiceResponse<Order>>;
    static getOrderAnalytics(query: AnalyticsQuery): Promise<ServiceResponse<OrderAnalytics>>;
    static getPopularItems(query: PopularItemsQuery): Promise<ServiceResponse<any[]>>;
    static clearCart(studentId: string): Promise<void>;
    static getCart(studentId: string): Promise<ServiceResponse<Cart | null>>;
    private static validateOrderInput;
    private static checkDietaryRestrictions;
}
export declare const orderService: OrderService;
//# sourceMappingURL=order.service.d.ts.map