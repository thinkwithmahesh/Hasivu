interface PaymentData {
    id: string;
    amount: number;
    currency: string;
    status: string;
    method?: string;
    orderId?: string;
    createdAt: Date;
}
interface OrderData {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
    createdAt: Date;
}
interface PaymentAnalytics {
    totalAmount: number;
    totalCount: number;
    refundedAmount: number;
    refundedCount: number;
    averageAmount: number;
    successRate: number;
    period: {
        start: Date;
        end: Date;
    };
    byMethod: Record<string, {
        amount: number;
        count: number;
        successRate: number;
    }>;
}
export declare const PAYMENT_METHODS: {
    readonly CARD: "card";
    readonly NETBANKING: "netbanking";
    readonly WALLET: "wallet";
    readonly UPI: "upi";
    readonly EMI: "emi";
    readonly PAYLATER: "paylater";
    readonly CARDLESS_EMI: "cardless_emi";
    readonly BANK_TRANSFER: "bank_transfer";
};
export declare const PAYMENT_STATUS: {
    readonly CREATED: "created";
    readonly AUTHORIZED: "authorized";
    readonly CAPTURED: "captured";
    readonly REFUNDED: "refunded";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
export declare const SUPPORTED_CURRENCIES: readonly ["INR", "USD", "EUR"];
export declare const RECEIPT_PREFIX: {
    readonly ORDER: "ORD_";
    readonly PAYMENT: "PAY_";
    readonly REFUND: "REF_";
};
export declare const AMOUNT_LIMITS: {
    readonly INR: {
        readonly min: 100;
        readonly max: 1500000000;
    };
    readonly USD: {
        readonly min: 100;
        readonly max: 200000000;
    };
    readonly EUR: {
        readonly min: 100;
        readonly max: 200000000;
    };
};
export declare function generateReceiptNumber(prefix?: string): string;
export declare function isValidCurrency(currency: string): currency is typeof SUPPORTED_CURRENCIES[number];
export declare function validatePaymentAmount(amount: number, currency: string): {
    valid: boolean;
    error?: string;
    normalizedAmount?: number;
};
export declare function generatePaymentSignature(orderId: string, paymentId: string, secret: string): string;
export declare function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string): boolean;
export declare function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
export declare function formatAmount(amount: number, currency: string): string;
export declare function parseAmount(formattedAmount: string, currency: string): number;
export declare function getPaymentMethodName(method: string): string;
export declare function supportsRefund(method: string): boolean;
export declare function calculatePaymentAnalytics(payments: PaymentData[], startDate: Date, endDate: Date): PaymentAnalytics;
export declare function validateOrderData(orderData: Partial<OrderData>): {
    valid: boolean;
    errors: string[];
};
export declare function generateTestPaymentData(): PaymentData;
export type { PaymentData, OrderData, PaymentAnalytics };
//# sourceMappingURL=razorpay.utils.d.ts.map