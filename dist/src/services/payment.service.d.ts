export declare enum PaymentMethod {
    CARD = "card",
    NETBANKING = "netbanking",
    UPI = "upi",
    WALLET = "wallet",
    UNKNOWN = "unknown"
}
export declare enum PaymentRefundStatus {
    PENDING = "pending",
    PROCESSED = "processed",
    FAILED = "failed"
}
export interface PaymentMethodInterface {
    id: string;
    type: PaymentMethod;
    provider: string;
    details: Record<string, any>;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface PaymentOrder {
    id: string;
    razorpayOrderId: string;
    userId: string;
    amount: number;
    currency: string;
    status: 'created' | 'attempted' | 'paid' | 'failed' | 'cancelled';
    notes: Record<string, any>;
    receipt: string;
    createdAt: Date;
    expiresAt: Date;
}
export interface PaymentTransaction {
    id: string;
    orderId: string;
    razorpayPaymentId: string;
    method: PaymentMethod | string;
    amount: number;
    currency: string;
    status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
    gateway: string;
    fees: Record<string, number> | string;
    notes?: Record<string, any>;
    createdAt: Date;
    capturedAt?: Date;
    refundedAt?: Date;
}
export interface PaymentRefund {
    id: string;
    paymentId: string;
    razorpayRefundId: string;
    amount: number;
    currency: string;
    status: PaymentRefundStatus | 'pending' | 'processed' | 'failed';
    reason: string;
    notes?: Record<string, any> | string;
    createdAt: Date;
    processedAt?: Date;
}
export interface PaymentSubscription {
    id: string;
    razorpaySubscriptionId: string;
    userId: string;
    planId: string;
    status: 'created' | 'authenticated' | 'active' | 'paused' | 'cancelled' | 'completed';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    notes: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PaymentService {
    private razorpay?;
    private webhookSecret;
    constructor();
    private isRazorpayAvailable;
    initialize(): Promise<void>;
    createPaymentOrder(orderData: {
        userId: string;
        amount: number;
        currency?: string;
        notes?: Record<string, any>;
        receipt?: string;
    }): Promise<PaymentOrder>;
    createOrder(orderData: {
        userId: string;
        amount?: number;
        currency?: string;
        notes?: Record<string, any>;
        receipt?: string;
        schoolId?: string;
        deliveryDate?: Date;
        items?: any[];
    }): Promise<{
        success: boolean;
        order: PaymentOrder;
        error?: string;
    }>;
    verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): boolean;
    capturePayment(orderId: string, paymentId: string, signature: string): Promise<PaymentTransaction>;
    createRefund(paymentId: string, amount?: number, reason?: string): Promise<PaymentRefund>;
    createSubscriptionPlan(planData: {
        interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
        period: number;
        amount: number;
        currency?: string;
        notes?: Record<string, any>;
    }): Promise<any>;
    createSubscription(subscriptionParams: {
        userId: string;
        planId: string;
        notes?: Record<string, any>;
    }): Promise<PaymentSubscription>;
    handleWebhook(body: string, signature: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPaymentOrder(orderId: string): Promise<PaymentOrder | null>;
    private handlePaymentCaptured;
    private handlePaymentFailed;
    private handleRefundProcessed;
    private handleSubscriptionCharged;
    processPayment(paymentData: {
        orderId?: string;
        amount: number;
        currency?: string;
        paymentMethodId?: string;
        notes?: Record<string, any>;
        userId?: string;
        userRole?: string;
    }): Promise<{
        success: boolean;
        payment?: any;
        message?: string;
    }>;
    updateOrder(orderId: string, updateData: any, token?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    private isValidToken;
    getAllOrders(filters?: any, token?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    getOrderAnalytics(token?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    refundOrder(orderId: string, token?: string, amount?: number): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    cancelAnyOrder(orderId: string, reason?: string, token?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    viewAllPayments(filters?: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    refundPayment(paymentId: string, token: string, amount?: number): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    viewSchoolFinancials(token: string, schoolId?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    manageSchoolPayments(token: string, schoolId?: string, action?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    createPayment(paymentData: any): Promise<{
        success: boolean;
        id?: string;
        error?: string;
    }>;
    encryptPaymentData(paymentData: any): Promise<any>;
    decryptPaymentData(encryptedData: any): Promise<any>;
    registerWebhook(url: string, events: string[]): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    sendWebhook(webhookId: string, event: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    updateOrderStatus(orderId: string, status: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    renewSubscription(subscriptionId: string, token?: string): Promise<{
        success: boolean;
        subscription?: any;
        error?: string;
    }>;
    getSubscriptionById(subscriptionId: string): Promise<any>;
    cancelSubscription(params: {
        userId: string;
        subscriptionId: string;
        cancelAtCycleEnd?: boolean;
    }): Promise<any>;
    getPaymentAnalytics(params: {
        userId: string;
        period: string;
        type: string;
    }): Promise<any>;
    static processPayment(paymentData: {
        orderId?: string;
        amount: number;
        currency?: string;
        paymentMethodId?: string;
        notes?: Record<string, any>;
        userId?: string;
        userRole?: string;
    }): Promise<{
        success: boolean;
        payment?: any;
        message?: string;
        error?: string;
    }>;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=payment.service.d.ts.map