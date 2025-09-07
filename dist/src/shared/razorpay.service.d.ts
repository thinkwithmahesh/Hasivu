import { APIGatewayProxyEvent } from 'aws-lambda';
import { razorpayConfig } from '../config/razorpay.config';
export interface RazorpayOrderOptions {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
    payment_capture?: 0 | 1;
    partial_payment?: boolean;
}
export interface RazorpayOrderResponse {
    id: string;
    entity: 'order';
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    offer_id: string | null;
    status: 'created' | 'attempted' | 'paid';
    attempts: number;
    notes: Record<string, string>;
    created_at: number;
}
export interface PaymentVerificationData {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}
export interface WebhookVerificationData {
    signature: string;
    body: string;
    webhookSecret: string;
}
export interface PaymentStatusResponse {
    id: string;
    entity: 'payment';
    amount: number;
    currency: string;
    status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
    order_id: string;
    invoice_id: string | null;
    international: boolean;
    method: string;
    amount_refunded: number;
    refund_status: string | null;
    captured: boolean;
    description: string;
    card_id: string | null;
    bank: string | null;
    wallet: string | null;
    vpa: string | null;
    email: string;
    contact: string;
    notes: Record<string, string>;
    fee: number;
    tax: number;
    error_code: string | null;
    error_description: string | null;
    error_source: string | null;
    error_step: string | null;
    error_reason: string | null;
    acquirer_data: Record<string, any>;
    created_at: number;
}
export interface RefundOptions {
    amount?: number;
    speed?: 'normal' | 'optimum';
    notes?: Record<string, string>;
    receipt?: string;
}
export interface RefundResponse {
    id: string;
    entity: 'refund';
    amount: number;
    currency: string;
    payment_id: string;
    notes: Record<string, string>;
    receipt: string | null;
    acquirer_data: Record<string, any>;
    created_at: number;
    batch_id: string | null;
    status: 'pending' | 'processed' | 'failed';
    speed_processed: 'normal' | 'optimum';
    speed_requested: 'normal' | 'optimum';
}
export interface SettlementDetails {
    id: string;
    entity: 'settlement';
    amount: number;
    status: 'created' | 'processed' | 'failed';
    fees: number;
    tax: number;
    utr: string;
    created_at: number;
}
export declare class RazorpayServiceError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details: any;
    constructor(message: string, code?: string, statusCode?: number, details?: any);
}
export declare class RazorpayService {
    private static instance;
    private razorpayClient;
    private readonly keyId;
    private readonly keySecret;
    private readonly webhookSecret;
    private readonly environment;
    private readonly baseUrl;
    private constructor();
    static getInstance(): RazorpayService;
    private validateConfiguration;
    createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrderResponse>;
    verifyPaymentSignature(data: PaymentVerificationData): boolean;
    verifyWebhookSignature(data: WebhookVerificationData): boolean;
    getPayment(paymentId: string): Promise<PaymentStatusResponse>;
    getOrder(orderId: string): Promise<RazorpayOrderResponse>;
    refundPayment(paymentId: string, options?: RefundOptions): Promise<RefundResponse>;
    getRefund(refundId: string): Promise<RefundResponse>;
    capturePayment(paymentId: string, amount?: number, currency?: string): Promise<PaymentStatusResponse>;
    private validateOrderAmount;
    private generateReceiptId;
    extractWebhookEvent(event: APIGatewayProxyEvent): any;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        timestamp: number;
        environment: string;
        keyId: string;
        configuration: {
            webhookSecret: boolean;
            limits: typeof razorpayConfig.limits;
            baseUrl: string;
        };
        connectivity?: {
            razorpayApi: boolean;
            responseTime?: number;
        };
        error?: string;
    }>;
    getServiceInfo(): {
        environment: string;
        keyId: string;
        baseUrl: string;
        limits: typeof razorpayConfig.limits;
        webhookConfigured: boolean;
    };
}
export declare const razorpayService: RazorpayService;
//# sourceMappingURL=razorpay.service.d.ts.map