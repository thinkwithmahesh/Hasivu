import Razorpay from 'razorpay';
export interface RazorpayOrderOptions {
    amount: number;
    currency: string;
    receipt: string;
    payment_capture?: boolean;
    notes?: Record<string, string>;
}
export type RazorpayOrder = any;
export type RazorpayPayment = any;
export type RazorpayRefund = any;
export declare class RazorpayService {
    private static instance;
    private razorpay;
    private readonly keySecret;
    private constructor();
    static getInstance(): RazorpayService;
    createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrder>;
    fetchPayment(paymentId: string): Promise<RazorpayPayment>;
    capturePayment(paymentId: string, amount: number, currency?: string): Promise<RazorpayPayment>;
    createRefund(paymentId: string, options?: {
        amount?: number;
        notes?: Record<string, string>;
        receipt?: string;
        speed?: 'normal' | 'optimum';
    }): Promise<RazorpayRefund>;
    fetchRefund(refundId: string): Promise<RazorpayRefund>;
    verifyWebhookSignature(body: string, signature: string, secret?: string): boolean;
    generateSignature(orderId: string, paymentId: string, secret?: string): string;
    verifyPaymentSignature(orderId: string, paymentId: string, signature: string, secret?: string): boolean;
    getRazorpayInstance(): Razorpay;
    validateConfiguration(): {
        isValid: boolean;
        errors: string[];
    };
}
export declare const razorpayService: RazorpayService;
//# sourceMappingURL=razorpay.service.d.ts.map