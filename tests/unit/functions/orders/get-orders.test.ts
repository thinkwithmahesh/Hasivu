/**
 * Unit Tests for Get Orders Lambda Function
 * Tests Epic 3: Order Processing System - Order Listing
 */

import { handler } from '../../../../src/functions/orders/get-orders';

// Mock dependencies
jest.mock('@/functions/shared/database.service', () => ({
  DatabaseService: {
    prisma: {
      order: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    },
  },
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

describe('Get Orders Lambda Function', () => {
  const mockCreateSuccessResponse = require('@/shared/response.utils').createSuccessResponse;
  const mockCreateErrorResponse = require('@/shared/response.utils').createErrorResponse;
  const mockHandleError = require('@/shared/response.utils').handleError;
  const mockPrisma = require('@/functions/shared/database.service').DatabaseService.prisma;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSuccessResponse.mockReturnValue({
      statusCode: 200,
      body: JSON.stringify({ message: 'Orders retrieved successfully' }),
    });
  });

  describe('Input Validation', () => {
    test('should reject non-GET methods', async () => {
      const event = { httpMethod: 'POST' } as any;
      mockCreateErrorResponse.mockReturnValue({ statusCode: 405 });

      await handler(event, {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    });

    test('should reject missing authentication', async () => {
      const event = { httpMethod: 'GET', headers: {} } as any;
      mockCreateErrorResponse.mockReturnValue({ statusCode: 401 });

      await handler(event, {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
    });
  });

  describe('Order Retrieval', () => {
    beforeEach(() => {
      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'order1',
          orderNumber: 'ORD001',
          status: 'pending',
          totalAmount: 100,
          createdAt: new Date(),
        },
      ]);
      mockPrisma.order.count.mockResolvedValue(1);
    });

    test('should retrieve orders successfully', async () => {
      const event = {
        httpMethod: 'GET',
        headers: { 'x-user-id': 'test-user' },
        queryStringParameters: {},
      } as any;

      await handler(event, {} as any);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orders: expect.any(Array),
            pagination: expect.any(Object),
          }),
        }),
        200
      );
    });

    test('should handle filtering and pagination', async () => {
      const event = {
        httpMethod: 'GET',
        headers: { 'x-user-id': 'test-user' },
        queryStringParameters: {
          status: 'pending',
          page: '1',
          limit: '10',
        },
      } as any;

      await handler(event, {} as any);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'pending',
          }),
          skip: 0,
          take: 10,
        })
      );
    });
  });
});