import { PaymentStatus, OrderStatus } from '../../src/types/index';
export interface LoadTestUser {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'parent' | 'admin';
    phone: string;
    schoolId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface LoadTestOrder {
    id: string;
    userId: string;
    parentId: string;
    schoolId: string;
    items: Array<{
        menuItemId: string;
        quantity: number;
        price: number;
        totalPrice: number;
    }>;
    totalAmount: number;
    currency: string;
    status: OrderStatus;
    deliveryDate: Date;
    deliverySlot: string;
    paymentStatus: PaymentStatus;
    paymentId: string | null;
    rfidVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface LoadTestPaymentOrder {
    id: string;
    orderId: string;
    amount: number;
    currency: string;
    status: string;
    gateway: string;
    gatewayOrderId: string;
    gatewayPaymentId: string | null;
    metadata: Record<string, any>;
    attempts: number;
    maxAttempts: number;
    expiresAt: Date;
    completedAt: Date | null;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class LoadTestDataGenerator {
    private readonly userIdPrefix;
    private readonly orderIdPrefix;
    private readonly paymentIdPrefix;
    private readonly schoolId;
    private userCounter;
    private orderCounter;
    private paymentCounter;
    constructor();
    generateUsers(count: number): LoadTestUser[];
    generateUser(): LoadTestUser;
    generateOrders(count: number, users?: LoadTestUser[]): LoadTestOrder[];
    generateOrder(users?: LoadTestUser[]): LoadTestOrder;
    generatePaymentOrders(count: number, orders?: LoadTestOrder[]): LoadTestPaymentOrder[];
    generatePaymentOrder(orders?: LoadTestOrder[]): LoadTestPaymentOrder;
    generateConcurrentUserScenarios(userCount: number): any[];
    generateUserActionSequence(): string[];
    getPerformanceThresholds(): {
        PAYMENT_PROCESSING_MS: number;
        TRANSACTION_COMPLETION_MS: number;
        DATABASE_QUERY_MS: number;
        API_RESPONSE_MS: number;
        CONCURRENT_LOAD_SUCCESS_RATE: number;
        MEMORY_USAGE_MB: number;
        CPU_USAGE_PERCENT: number;
    };
    seedMenuItems(count: number): Promise<void>;
    seedCustomers(count: number): Promise<void>;
    reset(): void;
    private getRandomRole;
    private getRandomOrderStatus;
    private getRandomPaymentStatus;
    private getRandomDeliverySlot;
    private getRandomFutureDate;
    private getRandomFailureReason;
    private getRandomMenuCategory;
    private getWeightedRandom;
    seedPaymentHistory(count: number): Promise<void>;
    generateCustomer(): LoadTestUser;
    getRandomMenuItems(count?: number): any[];
}
//# sourceMappingURL=LoadTestDataGenerator.d.ts.map