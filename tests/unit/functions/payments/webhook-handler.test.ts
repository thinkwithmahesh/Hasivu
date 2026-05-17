/**
 * Payment webhook Lambda — prisma from DatabaseManager; logger from shared/utils/logger.
 */

const verifyWebhookSignature = jest.fn();

jest.mock('../../../../src/functions/shared/razorpay.service', () => ({
  razorpayService: {
    verifyWebhookSignature: (...args: unknown[]) => verifyWebhookSignature(...args),
  },
}));

const prismaMock = {
  paymentTransaction: {
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  paymentOrder: {
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    findFirst: jest.fn(),
  },
  order: {
    update: jest.fn().mockResolvedValue({}),
  },
  paymentRefund: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  subscription: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  billingCycle: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({}),
  },
  $disconnect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../../../../src/database/DatabaseManager', () => ({
  prisma: prismaMock,
  DatabaseManager: {},
}));

jest.mock('../../../../src/shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../../src/shared/response.utils', () => ({
  createSuccessResponse: jest.fn((payload: unknown, statusCode = 200) => ({
    statusCode,
    body: JSON.stringify(payload),
  })),
  createErrorResponse: jest.fn((code: string, message: string, statusCode: number) => ({
    statusCode,
    body: JSON.stringify({ success: false, error: { code, message } }),
  })),
  handleError: jest.fn((err: Error) => ({
    statusCode: 500,
    body: JSON.stringify({ message: err.message }),
  })),
}));

import { handler } from '../../../../src/functions/payment/webhook-handler';
import { createErrorResponse, createSuccessResponse } from '../../../../src/shared/response.utils';

function capturedBody() {
  return JSON.stringify({
    event: 'payment.captured',
    id: 'evt_webhook_1',
    payment: {
      entity: {
        id: 'pay_test_123',
        order_id: 'order_test_123',
        amount: 50000,
        status: 'captured',
        method: 'card',
      },
    },
  });
}

describe('Payment webhook Lambda', () => {
  const ctx = { awsRequestId: 'req-1' } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_test';
    verifyWebhookSignature.mockReturnValue(true);
    prismaMock.paymentOrder.findFirst.mockResolvedValue({
      id: 'po-1',
      orderId: 'order-1',
      subscriptionId: null,
    });
  });

  it('returns 405 for non-POST', async () => {
    const res = await handler(
      { httpMethod: 'GET', headers: {}, body: capturedBody() } as any,
      ctx
    );
    expect(createErrorResponse).toHaveBeenCalledWith(
      'Method not allowed',
      'Only POST method is allowed',
      405
    );
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 when signature header missing', async () => {
    const res = await handler(
      {
        httpMethod: 'POST',
        headers: {},
        body: capturedBody(),
      } as any,
      ctx
    );
    expect(createErrorResponse).toHaveBeenCalledWith(
      'Missing signature',
      'X-Razorpay-Signature header required',
      400
    );
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when body missing', async () => {
    const res = await handler(
      {
        httpMethod: 'POST',
        headers: { 'x-razorpay-signature': 'sig' },
        body: null,
      } as any,
      ctx
    );
    expect(createErrorResponse).toHaveBeenCalledWith('Missing body', 'Request body required', 400);
    expect(res.statusCode).toBe(400);
  });

  it('processes valid payment.captured webhook', async () => {
    const res = await handler(
      {
        httpMethod: 'POST',
        headers: { 'x-razorpay-signature': 'valid-sig' },
        body: capturedBody(),
      } as any,
      ctx
    );

    expect(verifyWebhookSignature).toHaveBeenCalled();
    expect(prismaMock.paymentTransaction.updateMany).toHaveBeenCalled();
    expect(prismaMock.auditLog.create).toHaveBeenCalled();
    expect(createSuccessResponse).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});
