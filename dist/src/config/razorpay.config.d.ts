export interface RazorpayConfig {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
    currency: string;
    limits: {
        maxAmount: number;
        minAmount: number;
    };
    fees: {
        domestic: number;
        international: number;
    };
}
export interface PaymentMethodsConfig {
    card: {
        enabled: boolean;
        networks: string[];
    };
    netbanking: {
        enabled: boolean;
        banks: string[];
    };
    upi: {
        enabled: boolean;
        apps: string[];
    };
    wallet: {
        enabled: boolean;
        providers: string[];
    };
}
export declare const razorpayConfig: RazorpayConfig;
export declare const paymentMethodsConfig: PaymentMethodsConfig;
export declare const _razorpayEndpoints: {
    orders: string;
    payments: string;
    refunds: string;
    customers: string;
    subscriptions: string;
    webhooks: string;
};
export declare const _webhookEvents: {
    PAYMENT_AUTHORIZED: string;
    PAYMENT_CAPTURED: string;
    PAYMENT_FAILED: string;
    ORDER_PAID: string;
    REFUND_CREATED: string;
    SUBSCRIPTION_CHARGED: string;
};
export declare const _razorpayTestConfig: {
    testCards: {
        success: {
            number: string;
            cvv: string;
            expiry: string;
        };
        failure: {
            number: string;
            cvv: string;
            expiry: string;
        };
    };
    testUPI: {
        success: string;
        failure: string;
    };
};
export default razorpayConfig;
//# sourceMappingURL=razorpay.config.d.ts.map