/**
 * Unit tests for Update Order Lambda — aligned with DatabaseService.query + raw SQL flow.
 */

const mockQuery = jest.fn();

jest.mock('@/shared/database.service', () => ({
  DatabaseService: {
    getInstance: jest.fn(() => ({
      query: mockQuery,
    })),
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

import { handler } from '../../../../src/functions/orders/update-order';

describe('Update Order Lambda Function', () => {
  const mockCreateSuccessResponse = jest.requireMock('@/shared/response.utils')
    .createSuccessResponse as jest.Mock;
  const mockCreateErrorResponse = jest.requireMock('@/shared/response.utils')
    .createErrorResponse as jest.Mock;
  const mockHandleError = jest.requireMock('@/shared/response.utils').handleError as jest.Mock;

  const orderAccessRow = {
    id: 'order1',
    orderNumber: 'ON-001',
    studentId: 'user1',
    schoolId: 'school1',
    status: 'pending',
    paymentStatus: 'pending',
    deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    totalAmount: '100',
    parentId: null,
    firstName: 'S',
    lastName: 'T',
    mealPeriod: 'lunch',
  };

  const updatedOrderRow = {
    id: 'order1',
    orderNumber: 'ON-001',
    status: 'pending',
    paymentStatus: 'pending',
    totalAmount: '100',
    updatedAt: new Date(),
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
    mockHandleError.mockReturnValue({
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to update order' }),
    });
  });

  describe('Input Validation', () => {
    it('rejects non-PUT methods', async () => {
      const event = { httpMethod: 'POST' } as any;
      await handler(event, {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'METHOD_NOT_ALLOWED',
        'Method not allowed',
        405
      );
    });

    it('rejects missing orderId', async () => {
      const event = { httpMethod: 'PUT', pathParameters: {} } as any;
      await handler(event, {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'MISSING_ORDER_ID',
        'Missing orderId in path parameters',
        400
      );
    });
  });

  describe('Order Update', () => {
    beforeEach(() => {
      mockQuery.mockImplementation(async (sql: string) => {
        const s = sql.replace(/\s+/g, ' ').trim();
        if (s.startsWith('BEGIN') || s.startsWith('COMMIT') || s.startsWith('ROLLBACK')) {
          return { rows: [] };
        }
        if (s.includes('FROM orders o') && s.includes('WHERE o.id')) {
          return { rows: [orderAccessRow] };
        }
        if (s.includes('FROM users') && s.includes("role IN ('school_admin'")) {
          return { rows: [] };
        }
        if (s.includes('FROM orders WHERE id')) {
          return { rows: [updatedOrderRow] };
        }
        return { rows: [] };
      });
    });

    it('updates successfully when caller is the student on the order', async () => {
      const event = {
        httpMethod: 'PUT',
        pathParameters: { orderId: 'order1' },
        headers: { 'x-user-id': 'user1' },
        body: JSON.stringify({}),
      } as any;

      await handler(event, {} as any);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Order updated successfully'),
          data: expect.objectContaining({
            order: expect.objectContaining({ id: 'order1', orderNumber: 'ON-001' }),
          }),
        })
      );
    });

    it('rejects when user is not authorized', async () => {
      mockQuery.mockImplementation(async (sql: string) => {
        const s = sql.replace(/\s+/g, ' ').trim();
        if (s.includes('FROM orders o') && s.includes('WHERE o.id')) {
          return {
            rows: [
              {
                ...orderAccessRow,
                studentId: 'student1',
                parentId: null,
              },
            ],
          };
        }
        if (s.includes('FROM users') && s.includes("role IN ('school_admin'")) {
          return { rows: [] };
        }
        return { rows: [] };
      });

      const event = {
        httpMethod: 'PUT',
        pathParameters: { orderId: 'order1' },
        headers: { 'x-user-id': 'unauthorized-user' },
        body: JSON.stringify({}),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to update order'
      );
      const err = mockHandleError.mock.calls[0][0] as Error;
      expect(err.message).toBe('Not authorized to update this order');
    });
  });
});
