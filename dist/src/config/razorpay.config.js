"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._razorpayTestConfig = exports._webhookEvents = exports._razorpayEndpoints = exports.paymentMethodsConfig = exports.razorpayConfig = void 0;
exports.razorpayConfig = {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    currency: 'INR',
    limits: {
        maxAmount: 500000,
        minAmount: 100,
    },
    fees: {
        domestic: 2.36,
        international: 3.36,
    },
};
exports.paymentMethodsConfig = {
    card: {
        enabled: true,
        networks: ['Visa', 'MasterCard', 'Maestro', 'RuPay'],
    },
    netbanking: {
        enabled: true,
        banks: ['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak'],
    },
    upi: {
        enabled: true,
        apps: ['PhonePe', 'GooglePay', 'Paytm', 'BHIM'],
    },
    wallet: {
        enabled: true,
        providers: ['Paytm', 'PhonePe', 'Mobikwik', 'FreeCharge'],
    },
};
exports._razorpayEndpoints = {
    orders: '/v1/orders',
    payments: '/v1/payments',
    refunds: '/v1/refunds',
    customers: '/v1/customers',
    subscriptions: '/v1/subscriptions',
    webhooks: '/v1/webhooks',
};
exports._webhookEvents = {
    PAYMENT_AUTHORIZED: 'payment.authorized',
    PAYMENT_CAPTURED: 'payment.captured',
    PAYMENT_FAILED: 'payment.failed',
    ORDER_PAID: 'order.paid',
    REFUND_CREATED: 'refund.created',
    SUBSCRIPTION_CHARGED: 'subscription.charged',
};
exports._razorpayTestConfig = {
    testCards: {
        success: {
            number: '4111111111111111',
            cvv: '123',
            expiry: '12/25',
        },
        failure: {
            number: '4000000000000002',
            cvv: '123',
            expiry: '12/25',
        },
    },
    testUPI: {
        success: 'success@razorpay',
        failure: 'failure@razorpay',
    },
};
exports.default = exports.razorpayConfig;
//# sourceMappingURL=razorpay.config.js.map