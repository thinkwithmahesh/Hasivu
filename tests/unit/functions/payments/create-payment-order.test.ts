/**
 * Create payment order Lambda — mocks avoid loading real RazorpayService (module-level getInstance).
 */

const mockCreateOrder = jest.fn();

jest.mock('../../../../src/functions/shared/razorpay.service', () => ({
  razorpayService: {
    createOrder: (...args: unknown[]) => mockCreateOrder(...args),
  },
}));

jest.mock('../../../../src/shared/middleware/lambda-auth.middleware', () => ({
  authenticateLambda: jest.fn(),
}));

const prismaMock = {
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  paymentOrder: {
    create: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
  $disconnect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
}));

jest.mock('../../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    logFunctionStart: jest.fn(),
    logFunctionEnd: jest.fn(),
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
    body: JSON.stringify({ success: false, error: { message: err.message } }),
  })),
}));

import { handler } from '../../../../src/functions/payment/create-payment-order';
import { authenticateLambda } from '../../../../src/shared/middleware/lambda-auth.middleware';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../../../src/shared/response.utils';

describe('Create Payment Order Lambda', () => {
  const baseEvent = (): any => ({
    httpMethod: 'POST',
    body: JSON.stringify({ orderId: 'order-123' }),
    headers: { authorization: 'Bearer test-token' },
  });

  const orderRow = {
    id: 'order-123',
    userId: 'user-123',
    orderNumber: 'ON-1',
    totalAmount: 500,
    currency: 'INR',
    status: 'pending',
    paymentStatus: 'pending',
    schoolId: 'school-1',
    studentId: 'student-1',
    user: {},
    student: { firstName: 'A', lastName: 'B' },
    school: { name: 'Test School' },
    payments: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret_value';

    (authenticateLambda as jest.Mock).mockResolvedValue({
      success: true,
      user: { id: 'user-123', userId: 'user-123', email: 'u@test.com', role: 'parent' },
    });

    prismaMock.order.findUnique.mockResolvedValue(orderRow);
    prismaMock.paymentOrder.create.mockResolvedValue({
      id: 'order_razorpay_abc',
      razorpayOrderId: 'order_razorpay_abc',
      orderId: 'order-123',
      amount: 50000,
      currency: 'INR',
      status: 'created',
      expiresAt: new Date(),
      createdAt: new Date(),
    });
    prismaMock.order.update.mockResolvedValue({});

    mockCreateOrder.mockResolvedValue({
      id: 'order_razorpay_abc',
      amount: 50000,
      currency: 'INR',
      status: 'created',
    });
  });

  it('returns 405 for non-POST', async () => {
    const res = await handler({ ...baseEvent(), httpMethod: 'GET' } as any, {} as any);
    expect(createErrorResponse).toHaveBeenCalledWith(
      'Method not allowed',
      'Only POST method is allowed',
      405
    );
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 when orderId missing', async () => {
    const res = await handler(
      { ...baseEvent(), body: JSON.stringify({}) } as any,
      {} as any
    );
    expect(createErrorResponse).toHaveBeenCalledWith('Missing order ID', 'orderId is required', 400);
    expect(res.statusCode).toBe(400);
  });

  it('creates Razorpay order and payment order on success', async () => {
    const res = await handler(baseEvent(), {} as any);

    expect(mockCreateOrder).toHaveBeenCalled();
    expect(prismaMock.paymentOrder.create).toHaveBeenCalled();
    expect(prismaMock.order.update).toHaveBeenCalled();
    expect(createSuccessResponse).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});
