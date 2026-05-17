/**
 * Unit tests for Get Orders Lambda — prisma from DatabaseManager + authorizer userId.
 */

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    count: jest.fn(),
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

import { handler } from '../../../../src/functions/orders/get-orders';

describe('Get Orders Lambda Function', () => {
  const mockCreateSuccessResponse = jest.requireMock('@/shared/response.utils')
    .createSuccessResponse as jest.Mock;
  const mockCreateErrorResponse = jest.requireMock('@/shared/response.utils')
    .createErrorResponse as jest.Mock;

  const baseEvent = {
    httpMethod: 'GET',
    requestContext: { authorizer: { userId: 'test-user' } },
    queryStringParameters: null as Record<string, string> | null,
  };

  const adminUser = {
    id: 'test-user',
    role: 'admin',
    schoolId: null,
    isActive: true,
  };

  const sampleOrder = {
    id: 'order1',
    orderNumber: 'ORD001',
    studentId: 's1',
    deliveryDate: new Date('2026-06-01'),
    status: 'pending',
    paymentStatus: 'pending',
    totalAmount: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: {
      id: 's1',
      firstName: 'A',
      lastName: 'B',
      grade: '5',
      section: 'A',
    },
    school: { id: 'sch1', name: 'Test School' },
    orderItems: [{ id: 'oi1' }],
  };

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
  });

  describe('Input Validation', () => {
    it('rejects non-GET methods', async () => {
      const event = { ...baseEvent, httpMethod: 'POST' } as any;
      await handler(event, {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'METHOD_NOT_ALLOWED',
        'Method not allowed',
        405
      );
    });

    it('rejects missing authentication', async () => {
      const event = {
        httpMethod: 'GET',
        requestContext: {} as any,
        queryStringParameters: {},
      } as any;
      await handler(event, {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'AUTHENTICATION_REQUIRED',
        'User authentication required',
        401
      );
    });
  });

  describe('Order Retrieval', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      prismaMock.order.count.mockResolvedValue(1);
      prismaMock.order.findMany.mockResolvedValue([sampleOrder]);
    });

    it('retrieves orders successfully', async () => {
      await handler({ ...baseEvent, queryStringParameters: {} } as any, {} as any);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orders: expect.any(Array),
            pagination: expect.any(Object),
          }),
        })
      );
    });

    it('applies filtering and pagination', async () => {
      await handler({
        ...baseEvent,
        queryStringParameters: {
          status: 'pending',
          page: '1',
          limit: '10',
        },
      } as any, {} as any);

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'pending' }),
          skip: 0,
          take: 10,
        })
      );
    });
  });
});
