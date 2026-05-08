/**
 * Get Order Lambda — prisma from DatabaseManager + authorizer / x-user-id.
 */

const prismaMock = {
  order: {
    findUnique: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
};

jest.mock('@/database/DatabaseManager', () => ({
  prisma: prismaMock,
  DatabaseManager: {},
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    logFunctionStart: jest.fn(),
    logFunctionEnd: jest.fn(),
  },
}));

jest.mock('@/shared/response.utils', () => ({
  createSuccessResponse: jest.fn(),
  createErrorResponse: jest.fn(),
  handleError: jest.fn(),
}));

import { handler } from '../../../../src/functions/orders/get-order';

function buildOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'test-order-id',
    orderNumber: 'ORD20241201120000TEST',
    userId: 'test-user-id',
    studentId: 'test-student-id',
    schoolId: 'test-school-id',
    deliveryDate: new Date('2024-12-01'),
    status: 'pending',
    paymentStatus: 'pending',
    totalAmount: 100,
    currency: 'INR',
    specialInstructions: 'No onions',
    allergyInfo: 'Peanut allergy',
    createdAt: new Date(),
    updatedAt: new Date(),
    deliveredAt: null,
    user: {
      id: 'test-user-id',
      firstName: 'John',
      lastName: 'Parent',
    },
    student: {
      id: 'test-student-id',
      firstName: 'Jane',
      lastName: 'Student',
      grade: '5',
      section: 'A',
      parentId: 'test-user-id',
      schoolId: 'test-school-id',
    },
    school: {
      id: 'test-school-id',
      name: 'Test School',
      address: '123 Test St',
    },
    orderItems: [
      {
        id: 'test-item-id',
        orderId: 'test-order-id',
        menuItemId: 'test-menu-item-id',
        quantity: 2,
        unitPrice: 50,
        totalPrice: 100,
        notes: 'Extra spicy',
        customizations: '{"spicy": true}',
        menuItem: {
          id: 'test-menu-item-id',
          name: 'Test Item',
          nutritionalInfo: '{"calories": 200}',
          allergens: ['nuts'],
        },
      },
    ],
    payments: [
      {
        id: 'test-payment-id',
        status: 'paid',
        amount: 100,
        razorpayPaymentId: 'rzp_test_123',
        paidAt: new Date(),
      },
    ],
    ...overrides,
  };
}

describe('Get Order Lambda Function', () => {
  const mockCreateSuccessResponse = jest.requireMock('@/shared/response.utils')
    .createSuccessResponse as jest.Mock;
  const mockCreateErrorResponse = jest.requireMock('@/shared/response.utils')
    .createErrorResponse as jest.Mock;
  const mockHandleError = jest.requireMock('@/shared/response.utils').handleError as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSuccessResponse.mockReturnValue({
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    });
    mockCreateErrorResponse.mockImplementation((code: string, msg: string, status: number) => ({
      statusCode: status,
      body: JSON.stringify({ code, message: msg }),
    }));
    mockHandleError.mockReturnValue({
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed' }),
    });
  });

  describe('Input validation', () => {
    it('rejects non-GET methods', async () => {
      await handler(
        { httpMethod: 'POST', pathParameters: { orderId: 'test-order-id' } } as any,
        {} as any
      );
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'METHOD_NOT_ALLOWED',
        'Method not allowed',
        405
      );
    });

    it('rejects missing orderId', async () => {
      await handler({ httpMethod: 'GET', pathParameters: {} } as any, {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'MISSING_ORDER_ID',
        'Missing orderId in path parameters',
        400
      );
    });

    it('rejects missing authentication', async () => {
      await handler(
        {
          httpMethod: 'GET',
          pathParameters: { orderId: 'test-order-id' },
          headers: {},
          requestContext: {},
        } as any,
        {} as any
      );
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'AUTHENTICATION_REQUIRED',
        'User authentication required',
        401
      );
    });
  });

  describe('Order retrieval', () => {
    beforeEach(() => {
      prismaMock.order.findUnique.mockResolvedValue(buildOrder());
    });

    it('returns order for authorized parent (x-user-id)', async () => {
      await handler(
        {
          httpMethod: 'GET',
          pathParameters: { orderId: 'test-order-id' },
          headers: { 'x-user-id': 'test-user-id' },
        } as any,
        {} as any
      );

      expect(prismaMock.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-order-id' },
        include: expect.any(Object),
      });

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            order: expect.objectContaining({
              id: 'test-order-id',
              orderNumber: 'ORD20241201120000TEST',
              totalAmount: 100,
            }),
          },
          message: 'Order details retrieved successfully',
        })
      );
    });

    it('returns order when requestContext.authorizer.userId matches student', async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        buildOrder({
          student: {
            id: 'test-student-id',
            firstName: 'Jane',
            lastName: 'Student',
            grade: '5',
            section: 'A',
            parentId: 'parent-1',
            schoolId: 'test-school-id',
          },
        })
      );

      await handler(
        {
          httpMethod: 'GET',
          pathParameters: { orderId: 'test-order-id' },
          requestContext: { authorizer: { userId: 'test-student-id' } },
        } as any,
        {} as any
      );

      expect(mockCreateSuccessResponse).toHaveBeenCalled();
    });

    it('rejects when order not found', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);
      await handler(
        {
          httpMethod: 'GET',
          pathParameters: { orderId: 'missing' },
          headers: { 'x-user-id': 'test-user-id' },
        } as any,
        {} as any
      );
      expect(mockHandleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to retrieve order details');
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe('Order not found');
    });

    it('rejects unauthorized viewer', async () => {
      prismaMock.order.findUnique.mockResolvedValue(
        buildOrder({
          student: {
            id: 'test-student-id',
            firstName: 'Jane',
            lastName: 'Student',
            grade: '5',
            section: 'A',
            parentId: 'other-parent',
            schoolId: 'test-school-id',
          },
        })
      );
      prismaMock.user.findFirst.mockResolvedValue(null);

      await handler(
        {
          httpMethod: 'GET',
          pathParameters: { orderId: 'test-order-id' },
          headers: { 'x-user-id': 'unauthorized-user' },
        } as any,
        {} as any
      );

      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe(
        'Not authorized to view this order'
      );
    });
  });

  describe('Error handling', () => {
    it('handles database errors', async () => {
      prismaMock.order.findUnique.mockRejectedValue(new Error('Database connection failed'));
      await handler(
        {
          httpMethod: 'GET',
          pathParameters: { orderId: 'test-order-id' },
          headers: { 'x-user-id': 'test-user-id' },
        } as any,
        {} as any
      );
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe('Database connection failed');
    });
  });
});
