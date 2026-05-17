/**
 * Create Order Lambda — aligned with prisma + DatabaseManager.transaction + authorizer userId.
 */

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  menuItem: {
    findMany: jest.fn(),
  },
};

const mockTransaction = jest.fn();

jest.mock('@/database/DatabaseManager', () => ({
  prisma: prismaMock,
  DatabaseManager: {
    getInstance: jest.fn(() => ({
      transaction: mockTransaction,
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

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

import { handler } from '../../../../src/functions/orders/create-order';
import { v4 as uuidv4 } from 'uuid';

describe('Create Order Lambda Function', () => {
  const mockCreateSuccessResponse = jest.requireMock('@/shared/response.utils')
    .createSuccessResponse as jest.Mock;
  const mockCreateErrorResponse = jest.requireMock('@/shared/response.utils')
    .createErrorResponse as jest.Mock;
  const mockHandleError = jest.requireMock('@/shared/response.utils').handleError as jest.Mock;

  const authorizerEvent = (body: object): any => ({
    httpMethod: 'POST',
    requestContext: { authorizer: { userId: 'test-user-id' } },
    body: JSON.stringify(body),
  });

  const validStudent = {
    id: 'test-student',
    firstName: 'John',
    lastName: 'Doe',
    parentId: 'test-user-id',
    schoolId: 'school1',
    isActive: true,
    school: { id: 'school1', name: 'Test School', isActive: true },
  };

  const menuItemRow = {
    id: 'item1',
    name: 'Test Item',
    price: 50,
    available: true,
  };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-01T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    let uuidCount = 0;
    (uuidv4 as jest.Mock).mockImplementation(() => {
      uuidCount += 1;
      return `uuid-${uuidCount}`;
    });

    mockCreateSuccessResponse.mockReturnValue({
      statusCode: 201,
      body: JSON.stringify({ success: true }),
    });
    mockCreateErrorResponse.mockImplementation((code: string, msg: string, status: number) => ({
      statusCode: status,
      body: JSON.stringify({ code, message: msg }),
    }));
    mockHandleError.mockReturnValue({
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create order' }),
    });

    mockTransaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const tx = {
        order: {
          create: jest.fn().mockResolvedValue({
            id: 'uuid-1',
            orderNumber: 'ORD20260601120000ABCD',
            userId: 'test-user-id',
            studentId: 'test-student',
            schoolId: 'school1',
            deliveryDate: new Date('2026-06-04'),
            status: 'pending',
            paymentStatus: 'pending',
            totalAmount: 50,
            currency: 'INR',
            createdAt: new Date('2026-06-01T12:00:00.000Z'),
            updatedAt: new Date('2026-06-01T12:00:00.000Z'),
          }),
        },
        orderItem: {
          create: jest.fn().mockResolvedValue({
            id: 'uuid-2',
            orderId: 'uuid-1',
            menuItemId: 'item1',
            quantity: 1,
            unitPrice: 50,
            totalPrice: 50,
            notes: null,
            customizations: '{}',
          }),
        },
      };
      return callback(tx);
    });
  });

  describe('Input validation', () => {
    it('rejects non-POST methods', async () => {
      await handler({ httpMethod: 'GET', body: '{}' } as any, {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'METHOD_NOT_ALLOWED',
        'Method not allowed',
        405
      );
    });

    it('rejects missing required fields', async () => {
      await handler(authorizerEvent({}), {} as any);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'MISSING_REQUIRED_FIELDS',
        'Missing required fields: studentId, deliveryDate, orderItems',
        400
      );
    });

    it('rejects when not authenticated', async () => {
      await handler(
        {
          httpMethod: 'POST',
          requestContext: {},
          body: JSON.stringify({
            studentId: 'test-student',
            deliveryDate: '2026-06-04',
            orderItems: [{ menuItemId: 'item1', quantity: 1 }],
          }),
        } as any,
        {} as any
      );
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'AUTHENTICATION_REQUIRED',
        'User authentication required',
        401
      );
    });

    it('rejects invalid delivery date format', async () => {
      prismaMock.user.findUnique.mockResolvedValue(validStudent);
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: 'not-a-date',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
        {} as any
      );
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'INVALID_DATE_FORMAT',
        'Invalid delivery date format',
        400
      );
    });

    it('rejects delivery date too soon', async () => {
      prismaMock.user.findUnique.mockResolvedValue(validStudent);
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: '2026-06-02',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
        {} as any
      );
      expect(mockHandleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to create order'
      );
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe(
        'Delivery date must be at least 24 hours in advance'
      );
    });

    it('rejects weekend delivery dates', async () => {
      prismaMock.user.findUnique.mockResolvedValue(validStudent);
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: '2026-06-06',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
        {} as any
      );
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe(
        'Delivery is not available on weekends'
      );
    });
  });

  describe('Student validation', () => {
    it('rejects non-existent student', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await handler(
        authorizerEvent({
          studentId: 'missing',
          deliveryDate: '2026-06-04',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
        {} as any
      );
      expect(mockHandleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to create order');
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe('Student not found');
    });

    it('rejects inactive student', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...validStudent, isActive: false });
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: '2026-06-04',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
        {} as any
      );
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe(
        'Student account is not active'
      );
    });

    it('rejects inactive school', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...validStudent,
        school: { id: 'school1', name: 'Test School', isActive: false },
      });
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: '2026-06-04',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
        {} as any
      );
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe('School is not active');
    });

    it('rejects unauthorized user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...validStudent,
        parentId: 'other-parent',
      });
      prismaMock.user.findFirst.mockResolvedValue(null);
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: '2026-06-04',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
        {} as any
      );
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe(
        'Not authorized to place orders for this student'
      );
    });
  });

  describe('Order items validation', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue(validStudent);
      prismaMock.menuItem.findMany.mockResolvedValue([]);
    });

    it('rejects empty order items', async () => {
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: '2026-06-04',
          orderItems: [],
        }),
        {} as any
      );
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe(
        'Order must contain at least one item'
      );
    });

    it('rejects too many line items', async () => {
      const many = Array.from({ length: 25 }, () => ({ menuItemId: 'item1', quantity: 1 }));
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: '2026-06-04',
          orderItems: many,
        }),
        {} as any
      );
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe(
        'Maximum 20 items allowed per order'
      );
    });

    it('rejects zero quantity', async () => {
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: '2026-06-04',
          orderItems: [{ menuItemId: 'item1', quantity: 0 }],
        }),
        {} as any
      );
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe(
        'Item quantity must be greater than 0'
      );
    });

    it('rejects excessive quantity per line', async () => {
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: '2026-06-04',
          orderItems: [{ menuItemId: 'item1', quantity: 15 }],
        }),
        {} as any
      );
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe(
        'Maximum 10 quantity allowed per item'
      );
    });

    it('rejects unknown menu item', async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([]);
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: '2026-06-04',
          orderItems: [{ menuItemId: 'missing-item', quantity: 1 }],
        }),
        {} as any
      );
      expect((mockHandleError.mock.calls[0][0] as Error).message).toBe(
        'Menu item not found: missing-item'
      );
    });
  });

  describe('Order creation', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue(validStudent);
      prismaMock.menuItem.findMany.mockResolvedValue([menuItemRow]);
    });

    it('creates order successfully', async () => {
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: '2026-06-04',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
          specialInstructions: 'No onions',
          allergyInfo: 'Peanut allergy',
        }),
        {} as any
      );

      expect(mockTransaction).toHaveBeenCalled();
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Order created successfully',
          data: expect.objectContaining({
            order: expect.objectContaining({
              studentId: 'test-student',
              totalAmount: 50,
            }),
          }),
        }),
        201
      );
    });

    it('surfaces transaction failures', async () => {
      mockTransaction.mockRejectedValueOnce(new Error('Database error'));
      await handler(
        authorizerEvent({
          studentId: 'test-student',
          deliveryDate: '2026-06-04',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
        {} as any
      );
      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Database error' }),
        'Failed to create order'
      );
    });
  });
});
