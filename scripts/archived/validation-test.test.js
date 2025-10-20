// Simple validation test for order and payment functions
const fs = require('fs');
const path = require('path');

describe('Phase 1 Remediation Validation', () => {
  test('Order functions should exist and be readable', () => {
    const orderFunctions = [
      'src/functions/orders/create-order.ts',
      'src/functions/orders/get-order.ts',
      'src/functions/orders/get-orders.ts',
      'src/functions/orders/update-order.ts',
      'src/functions/orders/update-status.ts'
    ];

    orderFunctions.forEach(funcPath => {
      expect(fs.existsSync(funcPath)).toBe(true);
      const content = fs.readFileSync(funcPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('export const handler');
    });
  });

  test('Payment functions should exist and be readable', () => {
    const paymentFunctions = [
      'src/functions/payment/create-payment-order.ts',
      'src/functions/payment/verify-payment.ts',
      'src/functions/payment/webhook-handler.ts'
    ];

    paymentFunctions.forEach(funcPath => {
      expect(fs.existsSync(funcPath)).toBe(true);
      const content = fs.readFileSync(funcPath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('export const handler');
    });
  });

  test('Order routes should exist', () => {
    expect(fs.existsSync('src/routes/orders.routes.ts')).toBe(true);
    const content = fs.readFileSync('src/routes/orders.routes.ts', 'utf8');
    expect(content.length).toBeGreaterThan(0);
  });

  test('Payment routes should exist', () => {
    expect(fs.existsSync('src/routes/payments.routes.ts')).toBe(true);
    const content = fs.readFileSync('src/routes/payments.routes.ts', 'utf8');
    expect(content.length).toBeGreaterThan(0);
  });
});