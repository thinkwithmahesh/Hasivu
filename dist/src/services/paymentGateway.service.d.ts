export interface PaymentMethod {
    id: string;
    type: 'card' | 'upi' | 'wallet' | 'netbanking';
    provider: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
    isActive: boolean;
    metadata?: Record<string, any>;
}
export interface PaymentRequest {
    amount: number;
    currency: string;
    orderId: string;
    userId: string;
    paymentMethodId?: string;
    description?: string;
    metadata?: Record<string, any>;
}
export interface PaymentResponse {
    transactionId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    gatewayTransactionId?: string;
    gatewayResponse?: Record<string, any>;
    amount: number;
    currency: string;
    fees?: number;
    netAmount?: number;
    processedAt?: Date;
    failureReason?: string;
}
export interface RefundRequest {
    transactionId: string;
    amount?: number;
    reason: string;
    metadata?: Record<string, any>;
}
export interface RefundResponse {
    refundId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    amount: number;
    processedAt?: Date;
    gatewayRefundId?: string;
}
export interface WebhookPayload {
    event: string;
    transactionId: string;
    gatewayTransactionId: string;
    status: string;
    amount: number;
    currency: string;
    timestamp: string;
    signature: string;
    data: Record<string, any>;
}
export declare class PaymentGatewayService {
    private static instance;
    private db;
    private logger;
    private constructor();
    static getInstance(): PaymentGatewayService;
    processPayment(request: PaymentRequest): Promise<PaymentResponse>;
    processRefund(request: RefundRequest): Promise<RefundResponse>;
    handleWebhook(payload: WebhookPayload): Promise<void>;
    getPaymentMethods(userId: string): Promise<PaymentMethod[]>;
    addPaymentMethod(userId: string, methodData: Partial<PaymentMethod>): Promise<PaymentMethod>;
    private validatePaymentRequest;
    private processWithGateway;
    private processRefundWithGateway;
    private verifyWebhookSignature;
    private mapGatewayStatus;
    private handleStatusUpdate;
    private mapToPaymentMethod;
}
//# sourceMappingURL=paymentGateway.service.d.ts.map