import { Order } from '@prisma/client';
import { IServiceContainer } from '../container/ServiceContainer';
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
export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
        details?: any;
    };
}
export declare class EnhancedOrderService {
    private container;
    private readonly CACHE_TTL;
    private readonly CART_EXPIRY;
    private readonly MAX_QUANTITY_PER_ITEM;
    private readonly ORDER_CUTOFF_HOURS;
    private readonly VALID_STATUS_TRANSITIONS;
    constructor(container: IServiceContainer);
    createOrder(input: CreateOrderInput): Promise<ServiceResponse<Order>>;
    addToCart(input: AddToCartInput): Promise<ServiceResponse<Cart>>;
    updateOrderStatus(orderId: string, newStatus: OrderStatus, message?: string): Promise<ServiceResponse<Order>>;
    processOrderPayment(input: ProcessPaymentInput): Promise<ServiceResponse<any>>;
    clearCart(studentId: string): Promise<void>;
    getCart(studentId: string): Promise<ServiceResponse<Cart | null>>;
    private validateOrderInput;
    private checkDietaryRestrictions;
}
//# sourceMappingURL=order.service.enhanced.d.ts.map