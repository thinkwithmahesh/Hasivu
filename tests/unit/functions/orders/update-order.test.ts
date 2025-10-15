/**
 * Unit Tests for Update Order Lambda Function
 * Tests Epic 3: Order Processing System - Order Modification
 */

import { handler } from '../../../../src/functions/orders/update-order';

// Mock dependencies
jest.mock('@/functions/shared/database.service', () => ({
  DatabaseService: {
    prisma: {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
    },
    transaction: jest.fn(),
  },
}));

jest.mock('../../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    logFunctionStart: jest.fn(),
    logFunctionEnd: jest.fn(),
  },
}));

jest.mock('../../../../src/shared/response.utils', () => ({
  createSuccessResponse: jest.fn(),
  createErrorResponse: jest.fn(),
  handleError: jest.fn(),
}));

describe('Update Order Lambda Function', () => {
  const mockCreateSuccessResponse = require('../../../../src/shared/response.utils').createSuccessResponse;
  const mockCreateErrorResponse = require('../../../../src/shared/response.utils').createErrorResponse;
  const mockHandleError = require('@/shared/response.utils').handleError;
  const mockPrisma = require('@/functions/shared/database.service').DatabaseService.prisma;
  const mockTransaction = require('@/functions/shared/database.service').DatabaseService.transaction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSuccessResponse.mockReturnValue({
      statusCode: 200,
      body: JSON.stringify({ message: 'Order updated successfully' }),
    });
  });

  describe('Input Validation', () => {
    test('should reject non-PUT methods', async () => {
      const event = { httpMethod: 'POST' } as any;
      mockCreateErrorResponse.mockReturnValue({ statusCode: 405 });

      await handler(event, {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    });

    test('should reject missing orderId', async () => {
      const event = { httpMethod: 'PUT', pathParameters: {} } as any;
      mockCreateErrorResponse.mockReturnValue({ statusCode: 400 });

      await handler(event, {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith('MISSING_ORDER_ID', 'Missing orderId in path parameters', 400);
    });
  });

  describe('Order Update', () => {
    beforeEach(() => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order1',
        status: 'pending',
        userId: 'user1',
        studentId: 'student1',
        schoolId: 'school1',
      } as any);

      mockTransaction.mockImplementation(async (callback: any) => callback(mockPrisma));
      mockPrisma.order.update.mockResolvedValue({
        id: 'order1',
        specialInstructions: 'Updated instructions',
        updatedAt: new Date(),
      } as any);
    });

    test('should update order successfully', async () => {
      const event = {
        httpMethod: 'PUT',
        pathParameters: { orderId: 'order1' },
        headers: { 'x-user-id': 'user1' },
        body: JSON.stringify({
          specialInstructions: 'Updated instructions',
        }),
      } as any;

      await handler(event, {} as any);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Order updated successfully',
        }),
        200
      );
    });

    test('should reject unauthorized updates', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null); // No admin access

      const event = {
        httpMethod: 'PUT',
        pathParameters: { orderId: 'order1' },
        headers: { 'x-user-id': 'unauthorized-user' },
        body: JSON.stringify({ specialInstructions: 'Test' }),
      } as any;

      await handler(event, {} as any);
      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized to update this order',
        })
      );
    });
  });
});