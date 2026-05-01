"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const payment_service_1 = require("../../src/services/payment.service");
describe('Required Gate: payment service', () => {
    test('verifyPaymentSignature accepts valid signature', () => {
        const svc = new payment_service_1.PaymentService();
        svc.webhookSecret = 'required-gate-secret';
        const orderId = 'order_123';
        const paymentId = 'pay_123';
        const signature = crypto_1.default
            .createHmac('sha256', 'required-gate-secret')
            .update(`${orderId}|${paymentId}`)
            .digest('hex');
        expect(svc.verifyPaymentSignature(orderId, paymentId, signature)).toBe(true);
    });
    test('verifyPaymentSignature rejects invalid signature', () => {
        const svc = new payment_service_1.PaymentService();
        svc.webhookSecret = 'required-gate-secret';
        expect(svc.verifyPaymentSignature('order_123', 'pay_123', 'bad-signature')).toBe(false);
    });
});
//# sourceMappingURL=payment.service.required.test.js.map