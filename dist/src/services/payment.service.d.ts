import { Payment } from '@prisma/client';
export interface PaymentFilters {
    userId?: string;
    orderId?: string;
    status?: string;
    method?: string;
}
export interface CreatePaymentData {
    orderId: string;
    userId: string;
    amount: number;
    currency?: string;
    method: string;
    transactionId?: string;
}
export declare class PaymentService {
    private static instance;
    private prisma;
    private razorpay;
    private webhookSecret;
    isRazorpayAvailable(): boolean;
    constructor();
    static getInstance(): PaymentService;
    findById(id: string): Promise<Payment | null>;
    findByOrder(orderId: string): Promise<Payment[]>;
    findByUser(userId: string): Promise<Payment[]>;
    findAll(filters?: PaymentFilters): Promise<Payment[]>;
    create(data: CreatePaymentData): Promise<Payment>;
    updateStatus(id: string, status: string, transactionId?: string): Promise<Payment>;
    processPayment(paymentId: string): Promise<Payment>;
    refund(paymentId: string, amount?: number): Promise<Payment>;
    getTotalRevenue(filters?: PaymentFilters): Promise<number>;
    initialize(): Promise<void>;
    createPaymentOrder(data: {
        userId: string;
        amount: number;
        currency?: string;
        notes?: any;
        receipt?: string;
    }): Promise<any>;
    verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;
    capturePayment(orderId: string, paymentId: string, signature: string): Promise<any>;
    createRefund(paymentId: string, amount?: number, reason?: string): Promise<any>;
    createSubscriptionPlan(data: {
        interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
        period: number;
        amount: number;
        currency?: string;
    }): Promise<any>;
    createSubscription(data: {
        userId: string;
        planId: string;
    }): Promise<any>;
    handleWebhook(body: string, signature: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPaymentOrder(orderId: string): Promise<any>;
    updateOrder(_orderId: string, _updates: any): Promise<void>;
    getAllOrders(_filters?: any): Promise<any[]>;
    getPaymentAnalytics(_filters?: any): Promise<any>;
    createOrder(data: any): Promise<any>;
    static processPayment(paymentData: {
        orderId: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        paymentDetails?: any;
    }): Promise<{
        success: boolean;
        data?: {
            paymentId: string;
            status: string;
        };
        error?: {
            message: string;
            code: string;
        };
    }>;
    static refundPayment(refundData: {
        paymentId: string;
        amount: number;
        reason: string;
    }): Promise<{
        success: boolean;
        data?: {
            refundId: string;
            status: string;
        };
        error?: {
            message: string;
            code: string;
        };
    }>;
    static getUserPaymentIds(userId: string): Promise<string[]>;
    static findMany(filters?: PaymentFilters): Promise<Payment[]>;
    static validatePaymentOrder(paymentMethod: string): Promise<boolean>;
    static checkDuplicatePayment(orderId: string, amount: number): Promise<boolean>;
    static initiatePayment(paymentData: {
        orderId: string;
        amount: number;
        paymentMethod: string;
    }): Promise<{
        success: boolean;
        data?: {
            paymentId: string;
            status: string;
        };
        error?: {
            message: string;
            code: string;
        };
    }>;
    static createPaymentRecord(data: CreatePaymentData): Promise<Payment>;
    static findById(id: string): Promise<Payment | null>;
    static canUserVerifyPayment(userId: string, paymentId: string): Promise<boolean>;
    static completePayment(paymentId: string): Promise<Payment>;
    static updateOrderAfterPayment(_orderId: string, _paymentId: string): Promise<void>;
    static validateRefund(paymentId: string, amount?: number): Promise<boolean>;
    static updateOrderAfterRefund(_orderId: string, _refundId: string): Promise<void>;
    static createPaymentOrder(data: {
        userId: string;
        amount: number;
        currency?: string;
        notes?: any;
        receipt?: string;
    }): Promise<any>;
    static updateOrder(_orderId: string, _updates: any): Promise<void>;
    static getPaymentOrder(orderId: string): Promise<any>;
    static getAllOrders(_filters?: any): Promise<any[]>;
    static getPaymentAnalytics(_filters?: any): Promise<any>;
    static getPaymentStatus(_orderId: string): string;
}
export declare const paymentService: PaymentService;
export default PaymentService;
//# sourceMappingURL=payment.service.d.ts.map