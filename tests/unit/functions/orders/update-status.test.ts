/**
 * Update Order Status Lambda — aligned with DatabaseService.query + raw SQL.
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
    warn: jest.fn(),
    logFunctionStart: jest.fn(),
    logFunctionEnd: jest.fn(),
  },
}));

jest.mock('@/shared/response.utils', () => ({
  createSuccessResponse: jest.fn(),
  createErrorResponse: jest.fn(),
  handleError: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: () => 'hist-uuid-1',
}));

import { handler } from '../../../../src/functions/orders/update-status';

describe('Update Order Status Lambda Function', () => {
  const mockCreateSuccessResponse = jest.requireMock('@/shared/response.utils')
    .createSuccessResponse as jest.Mock;
  const mockCreateErrorResponse = jest.requireMock('@/shared/response.utils')
    .createErrorResponse as jest.Mock;
  const mockHandleError = jest.requireMock('@/shared/response.utils').handleError as jest.Mock;

  const orderRowPending = {
    id: 'order1',
    orderNumber: 'ORD001',
    studentId: 'user1',
    schoolId: 'school1',
    status: 'pending',
    paymentStatus: 'pending',
    parentId: null,
    firstName: 'Jane',
    lastName: 'Student',
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
      body: JSON.stringify({ error: 'Failed' }),
    });
  });

  describe('Input validation', () => {
    it('rejects non-PUT methods', async () => {
      await handler({ httpMethod: 'POST' } as any, {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'METHOD_NOT_ALLOWED',
        'Method not allowed',
        405
      );
    });

    it('rejects missing orderId', async () => {
      await handler({ httpMethod: 'PUT', pathParameters: {} } as any, {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'MISSING_ORDER_ID',
        'Missing orderId in path parameters',
        400
      );
    });

    it('rejects missing status', async () => {
      await handler(
        {
          httpMethod: 'PUT',
          pathParameters: { orderId: 'order1' },
          body: JSON.stringify({}),
        } as any,
        {} as any
      );
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'MISSING_STATUS',
        'Missing required field: status',
        400
      );
    });
  });

  describe('Status validation', () => {
    it('rejects invalid status transitions', async () => {
      mockQuery.mockImplementation(async (sql: string) => {
        const s = sql.replace(/\s+/g, ' ').trim();
        if (s.includes('FROM orders o') && s.includes('WHERE o.id')) {
          return {
            rows: [
              {
                ...orderRowPending,
                status: 'delivered',
                studentId: 'user1',
              },
            ],
          };
        }
        return { rows: [] };
      });

      await handler(
        {
          httpMethod: 'PUT',
          pathParameters: { orderId: 'order1' },
          headers: { 'x-user-id': 'user1' },
          body: JSON.stringify({ status: 'pending' }),
        } as any,
        {} as any
      );

      expect(mockHandleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to update order status');
      expect((mockHandleError.mock.calls[0][0] as Error).message).toEqual(
        expect.stringContaining('Invalid status transition')
      );
    });
  });

  describe('Status update', () => {
    it('updates status successfully', async () => {
      mockQuery.mockImplementation(async (sql: string, params?: unknown[]) => {
        const s = sql.replace(/\s+/g, ' ').trim();
        if (s.includes('FROM orders o') && s.includes('WHERE o.id')) {
          return { rows: [orderRowPending] };
        }
        if (s.startsWith('BEGIN') || s.startsWith('COMMIT') || s.startsWith('ROLLBACK')) {
          return { rows: [] };
        }
        if (s.includes('UPDATE orders') && s.includes('SET status') && s.includes('RETURNING')) {
          return {
            rows: [
              {
                id: 'order1',
                status: 'confirmed',
                updatedAt: new Date('2026-06-01T12:00:00.000Z'),
              },
            ],
          };
        }
        if (s.includes('INSERT INTO order_status_history')) {
          return {
            rows: [
              {
                id: 'hist-1',
                orderId: 'order1',
                status: 'confirmed',
                notes: null,
                updatedBy: 'user1',
                createdAt: new Date(),
              },
            ],
          };
        }
        if (s.includes('FROM order_status_history')) {
          return { rows: [] };
        }
        if (s.includes('UPDATE orders') && s.includes('paymentStatus')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

      await handler(
        {
          httpMethod: 'PUT',
          pathParameters: { orderId: 'order1' },
          headers: { 'x-user-id': 'user1' },
          body: JSON.stringify({ status: 'confirmed' }),
        } as any,
        {} as any
      );

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            orderStatus: expect.objectContaining({
              orderId: 'order1',
              previousStatus: 'pending',
              newStatus: 'confirmed',
            }),
          },
          message: expect.stringContaining('pending'),
        })
      );
    });

    it('rejects when status is unchanged', async () => {
      mockQuery.mockImplementation(async (sql: string) => {
        const s = sql.replace(/\s+/g, ' ').trim();
        if (s.includes('FROM orders o') && s.includes('WHERE o.id')) {
          return { rows: [{ ...orderRowPending, status: 'pending' }] };
        }
        return { rows: [] };
      });

      await handler(
        {
          httpMethod: 'PUT',
          pathParameters: { orderId: 'order1' },
          headers: { 'x-user-id': 'user1' },
          body: JSON.stringify({ status: 'pending' }),
        } as any,
        {} as any
      );

      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'STATUS_UNCHANGED',
        expect.stringContaining('already'),
        400
      );
    });
  });
});
