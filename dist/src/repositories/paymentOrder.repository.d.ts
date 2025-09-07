import { PaymentOrder, Prisma } from '@prisma/client';
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export interface PaymentOrderFindOptions {
    filters?: Record<string, any>;
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    include?: Prisma.PaymentOrderInclude;
}
export interface PaymentOrderFindResult {
    items: PaymentOrder[];
    total: number;
}
export interface PaymentStatistics {
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    successRate: number;
    averageAmount: number;
    paymentsByMethod: Record<string, number>;
}
export declare class PaymentOrderRepository {
    static create(data: Prisma.PaymentOrderCreateInput): Promise<PaymentOrder>;
    static findById(id: string): Promise<PaymentOrder | null>;
    static findByIdWithIncludes(id: string, include: Prisma.PaymentOrderInclude): Promise<PaymentOrder | null>;
    static findByOrderId(orderId: string): Promise<PaymentOrder | null>;
    static findByRazorpayOrderId(razorpayOrderId: string): Promise<PaymentOrder | null>;
    static findMany(options?: PaymentOrderFindOptions): Promise<PaymentOrderFindResult>;
    static update(id: string, data: Prisma.PaymentOrderUpdateInput): Promise<PaymentOrder>;
    static delete(id: string): Promise<PaymentOrder>;
    static count(filters?: Record<string, any>): Promise<number>;
    static findByStatus(status: PaymentStatus, options?: Omit<PaymentOrderFindOptions, 'filters'>): Promise<PaymentOrderFindResult>;
    static findByMethod(method: string, options?: Omit<PaymentOrderFindOptions, 'filters'>): Promise<PaymentOrderFindResult>;
    static findPendingPayments(options?: Omit<PaymentOrderFindOptions, 'filters'>): Promise<PaymentOrderFindResult>;
    static findFailedPayments(filters?: Record<string, any>, options?: Omit<PaymentOrderFindOptions, 'filters'>): Promise<PaymentOrderFindResult>;
    static getStatistics(filters?: Record<string, any>): Promise<PaymentStatistics>;
    static findByDateRange(startDate: Date, endDate: Date, options?: Omit<PaymentOrderFindOptions, 'filters'>): Promise<PaymentOrderFindResult>;
    static findSuccessfulPayments(startDate: Date, endDate: Date, options?: Omit<PaymentOrderFindOptions, 'filters'>): Promise<PaymentOrderFindResult>;
    static updateMany(where: Prisma.PaymentOrderWhereInput, data: Prisma.PaymentOrderUpdateManyMutationInput): Promise<Prisma.BatchPayload>;
    static getDailySummary(date: Date, filters?: Record<string, any>): Promise<{
        date: string;
        totalPayments: number;
        totalAmount: number;
        successfulPayments: number;
        failedPayments: number;
        pendingPayments: number;
        successRate: number;
    }>;
    static findPaymentsForReconciliation(olderThan: Date, options?: Omit<PaymentOrderFindOptions, 'filters'>): Promise<PaymentOrderFindResult>;
    static getRevenueReport(startDate: Date, endDate: Date, groupBy?: 'day' | 'week' | 'month'): Promise<Array<{
        period: string;
        totalAmount: number;
        paymentCount: number;
        averageAmount: number;
    }>>;
}
export declare const paymentOrderRepository: PaymentOrderRepository;
//# sourceMappingURL=paymentOrder.repository.d.ts.map