import { Order } from '@prisma/client';
export interface OrderFilters {
    schoolId?: string;
    studentId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
}
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PREPARING = "preparing",
    READY = "ready",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
    COMPLETED = "completed"
}
export interface CreateOrderData {
    schoolId: string;
    studentId: string;
    items: Array<{
        menuItemId: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    deliveryTime?: Date;
}
export declare class OrderService {
    private static instance;
    private prisma;
    private orderRepo;
    private menuItemRepo;
    private userRepo;
    protected constructor();
    static getInstance(): OrderService;
    static createOrder(orderData: {
        studentId: string;
        parentId: string;
        schoolId: string;
        items: Array<{
            menuItemId: string;
            quantity: number;
            specialInstructions?: string;
        }>;
        deliveryDate: Date;
        deliveryType: 'delivery' | 'pickup';
        deliveryAddress?: string;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
    static addToCart(cartData: {
        studentId: string;
        menuItemId: string;
        quantity: number;
        specialInstructions?: string;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
    static updateOrderStatus(orderId: string, newStatus: string, message?: string): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
    static processOrderPayment(paymentData: {
        orderId: string;
        paymentMethod: 'razorpay' | 'stripe' | 'paypal';
        paymentDetails?: any;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
    static getOrderTracking(orderId: string): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
    static getOrdersByStudent(studentId: string, query: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
    static cancelOrder(orderId: string, cancellationReason: string): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
    static getOrderAnalytics(query: {
        schoolId: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
    static getPopularItems(query: {
        schoolId: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
    private static buildOrderTimeline;
    private static getStatusDescription;
    private static isValidStatusTransition;
    findById(id: string): Promise<Order | null>;
    findBySchool(schoolId: string): Promise<Order[]>;
    findByStudent(studentId: string): Promise<Order[]>;
    findByStatus(schoolId: string, status: string): Promise<Order[]>;
    findAll(filters?: OrderFilters): Promise<Order[]>;
    create(data: CreateOrderData): Promise<Order>;
    updateStatus(id: string, status: string): Promise<Order>;
    confirmOrder(id: string): Promise<Order>;
    prepareOrder(id: string): Promise<Order>;
    completeOrder(id: string): Promise<Order>;
    cancelOrder(id: string): Promise<Order>;
    getPendingOrders(schoolId: string): Promise<Order[]>;
    getActiveOrders(schoolId: string): Promise<Order[]>;
    getOrderStats(schoolId: string, startDate?: Date, endDate?: Date): Promise<{
        totalOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
        statusBreakdown: {
            [status: string]: number;
        };
    }>;
    getParentChildren(parentId: string): Promise<any[]>;
    findMany(filters: OrderFilters & {
        skip?: number;
        take?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        items: Order[];
        total: number;
    }>;
    getTrackingInfo(orderId: string): Promise<any>;
    estimateDeliveryTime(orderId: string): Promise<Date | null>;
    getStatusCounts(schoolId: string): Promise<{
        [status: string]: number;
    }>;
    getDetailedTrackingInfo(orderId: string): Promise<any>;
    getDeliveryStatus(orderId: string): Promise<string>;
    getPreparationInfo(orderId: string): Promise<any>;
    canUserAccessOrder(userId: string, orderId: string): Promise<boolean>;
    canCancelOrder(orderId: string): Promise<boolean>;
    canModifyOrder(orderId: string): Promise<boolean>;
    isRefundEligible(orderId: string): Promise<boolean>;
    validateDeliverySlot(deliveryDate: Date, deliveryTimeSlot: string): Promise<{
        valid: boolean;
        message?: string;
    }>;
    validateOrderItems(items: any[]): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    calculateOrderPricing(items: any[]): Promise<{
        subtotal: number;
        tax: number;
        total: number;
    }>;
    validatePaymentMethod(paymentMethodId: string): Promise<{
        valid: boolean;
        message?: string;
    }>;
    processRefund(orderId: string, amount: number, reason: string): Promise<{
        success: boolean;
        refundId?: string;
        error?: string;
    }>;
    canUserUpdateOrder(userId: string, orderId: string): Promise<boolean>;
    canChangeStatus(orderId: string, newStatus: string): Promise<boolean>;
    validateItemModification(orderId: string, modifications: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    update(orderId: string, updates: any): Promise<Order>;
    handleStatusUpdate(orderId: string, newStatus: string): Promise<void>;
    canParentOrderForStudent(parentId: string, studentId: string): Promise<boolean>;
    createOrder(orderData: any): Promise<{
        success: boolean;
        data?: any;
        error?: any;
    }>;
    getComprehensiveTrackingInfo(orderId: string): Promise<any>;
}
export declare const orderService: OrderService;
export default OrderService;
//# sourceMappingURL=order.service.d.ts.map