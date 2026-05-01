import crypto from 'crypto';
import { PaymentService } from '../../src/services/payment.service';

describe('Required Gate: payment service', () => {
  test('verifyPaymentSignature accepts valid signature', () => {
    const svc = new PaymentService();
    (svc as unknown as { webhookSecret: string }).webhookSecret = 'required-gate-secret';

    const orderId = 'order_123';
    const paymentId = 'pay_123';
    const signature = crypto
      .createHmac('sha256', 'required-gate-secret')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    expect(svc.verifyPaymentSignature(orderId, paymentId, signature)).toBe(true);
  });

  test('verifyPaymentSignature rejects invalid signature', () => {
    const svc = new PaymentService();
    (svc as unknown as { webhookSecret: string }).webhookSecret = 'required-gate-secret';

    expect(svc.verifyPaymentSignature('order_123', 'pay_123', 'bad-signature')).toBe(false);
  });
});
