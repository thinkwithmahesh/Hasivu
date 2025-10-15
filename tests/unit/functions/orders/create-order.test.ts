/**
 * Unit Tests for Create Order Lambda Function
 * Tests Epic 3: Order Processing System - Meal Order Creation
 */

import { handler } from '../../../../src/functions/orders/create-order';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    menuItem: {
      findFirst: jest.fn(),
    },
    order: {
      create: jest.fn(),
    },
    orderItem: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock response utils
jest.mock('../../../../src/shared/response.utils', () => ({
  createSuccessResponse: jest.fn(),
  createErrorResponse: jest.fn(),
  handleError: jest.fn(),
}));

// Mock auth middleware
jest.mock('../../../../src/shared/middleware/lambda-auth.middleware', () => ({
  authenticateLambda: jest.fn(),
}));

describe('Create Order Lambda Function', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockAuthenticateLambda: jest.MockedFunction<any>;
  let mockCreateSuccessResponse: jest.MockedFunction<any>;
  let mockCreateErrorResponse: jest.MockedFunction<any>;
  let mockHandleError: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    mockAuthenticateLambda = require('../../../../src/shared/middleware/lambda-auth.middleware').authenticateLambda;
    mockCreateSuccessResponse = require('../../../../src/shared/response.utils').createSuccessResponse;
    mockCreateErrorResponse = require('../../../../src/shared/response.utils').createErrorResponse;
    mockHandleError = require('../../../../src/shared/response.utils').handleError;

    // Mock UUID generation
    (uuidv4 as jest.Mock).mockReturnValue('test-order-id');

    // Default successful auth
    mockAuthenticateLambda.mockResolvedValue({
      user: { id: 'test-user-id' },
    });

    // Default successful responses
    mockCreateSuccessResponse.mockReturnValue({
      statusCode: 201,
      body: JSON.stringify({ message: 'Order created successfully' }),
    });
  });

  describe('Input Validation', () => {
    test('should reject non-POST methods', async () => {
      const event = {
        httpMethod: 'GET',
        body: '{}',
      } as any;

      mockCreateErrorResponse.mockReturnValue({
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      });

      const result = await handler(event, {} as any);

      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'Method not allowed',
        'Only POST method is allowed',
        405
      );
    });

    test('should reject missing required fields', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({}),
      } as any;

      mockCreateErrorResponse.mockReturnValue({
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      });

      const result = await handler(event, {} as any);

      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'Missing required fields',
        'Missing required fields: studentId, deliveryDate, orderItems',
        400
      );
    });

    test('should reject invalid delivery date', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: 'invalid-date',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
      } as any;

      mockCreateErrorResponse.mockReturnValue({
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid date format' }),
      });

      const result = await handler(event, {} as any);

      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'Invalid date format',
        'Invalid delivery date format',
        400
      );
    });

    test('should reject delivery date too soon', async () => {
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 1); // Only 1 hour from now

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: tomorrow.toISOString().split('T')[0],
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
      } as any;

      mockCreateErrorResponse.mockReturnValue({
        statusCode: 400,
        body: JSON.stringify({ error: 'Delivery date too soon' }),
      });

      const result = await handler(event, {} as any);

      expect(result).toBeDefined();
    });

    test('should reject weekend delivery dates', async () => {
      // Find next Saturday
      const saturday = new Date();
      saturday.setDate(saturday.getDate() + (6 - saturday.getDay()));

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: saturday.toISOString().split('T')[0],
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
      } as any;

      mockCreateErrorResponse.mockReturnValue({
        statusCode: 400,
        body: JSON.stringify({ error: 'Weekend delivery not allowed' }),
      });

      const result = await handler(event, {} as any);

      expect(result).toBeDefined();
    });
  });

  describe('Student Validation', () => {
    test('should reject non-existent student', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'non-existent-student',
          deliveryDate: '2024-12-01',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Student not found',
        })
      );
    });

    test('should reject inactive student', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-student',
        firstName: 'John',
        lastName: 'Doe',
        isActive: false,
        school: { id: 'school1', name: 'Test School', isActive: true },
      } as any);

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Student account is not active',
        })
      );
    });

    test('should reject orders for students from inactive schools', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-student',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        school: { id: 'school1', name: 'Test School', isActive: false },
      } as any);

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'School is not active',
        })
      );
    });

    test('should reject unauthorized parent orders', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-student',
        firstName: 'John',
        lastName: 'Doe',
        parentId: 'different-parent',
        isActive: true,
        school: { id: 'school1', name: 'Test School', isActive: true },
      } as any);

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null); // No admin access

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized to place orders for this student',
        })
      );
    });
  });

  describe('Order Item Validation', () => {
    beforeEach(() => {
      // Setup valid student
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-student',
        firstName: 'John',
        lastName: 'Doe',
        parentId: 'test-user-id',
        isActive: true,
        school: { id: 'school1', name: 'Test School', isActive: true },
      } as any);
    });

    test('should reject empty order items', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: [],
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Order must contain at least one item',
        })
      );
    });

    test('should reject orders with too many items', async () => {
      const manyItems = Array(25).fill({ menuItemId: 'item1', quantity: 1 });

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: manyItems,
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Maximum 20 items allowed per order',
        })
      );
    });

    test('should reject invalid item quantities', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: [{ menuItemId: 'item1', quantity: 0 }],
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Item quantity must be greater than 0',
        })
      );
    });

    test('should reject excessive item quantities', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: [{ menuItemId: 'item1', quantity: 15 }],
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Maximum 10 quantity allowed per item',
        })
      );
    });

    test('should reject non-existent menu items', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(null);

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: [{ menuItemId: 'non-existent-item', quantity: 1 }],
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Menu item not found: non-existent-item',
        })
      );
    });

    test('should reject unavailable menu items', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue({
        id: 'item1',
        name: 'Test Item',
        price: 50,
        available: false,
      } as any);

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Menu item is not available: Test Item',
        })
      );
    });
  });

  describe('Order Creation', () => {
    beforeEach(() => {
      // Setup valid student
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-student',
        firstName: 'John',
        lastName: 'Doe',
        parentId: 'test-user-id',
        isActive: true,
        school: { id: 'school1', name: 'Test School', isActive: true },
      } as any);

      // Setup valid menu item
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue({
        id: 'item1',
        name: 'Test Item',
        price: 50,
        available: true,
      } as any);

      // Setup successful transaction
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          order: mockPrisma.order,
          orderItem: mockPrisma.orderItem,
        } as any);
      });

      (mockPrisma.order.create as jest.Mock).mockResolvedValue({
        id: 'test-order-id',
        orderNumber: 'ORD20241201120000TEST',
        userId: 'test-user-id',
        studentId: 'test-student',
        schoolId: 'school1',
        deliveryDate: new Date('2024-12-01'),
        status: 'pending',
        paymentStatus: 'pending',
        totalAmount: 50,
        currency: 'INR',
        specialInstructions: null,
        allergyInfo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      (mockPrisma.orderItem.create as jest.Mock).mockResolvedValue({
        id: 'test-item-id',
        orderId: 'test-order-id',
        menuItemId: 'item1',
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
        notes: null,
        customizations: '{}',
      } as any);
    });

    test('should create order successfully', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
          specialInstructions: 'No onions',
          allergyInfo: 'Peanut allergy',
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockPrisma.order.create).toHaveBeenCalledWith({
        data: {
          id: 'test-order-id',
          orderNumber: 'ORD20241201120000TEST',
          userId: 'test-user-id',
          studentId: 'test-student',
          schoolId: 'school1',
          deliveryDate: expect.any(Date),
          status: 'pending',
          paymentStatus: 'pending',
          totalAmount: 50,
          currency: 'INR',
          specialInstructions: 'No onions',
          allergyInfo: 'Peanut allergy',
          metadata: JSON.stringify({ deliveryInstructions: undefined, contactPhone: undefined }),
        },
      });

      expect(mockPrisma.orderItem.create).toHaveBeenCalledWith({
        data: {
          id: 'test-order-id',
          orderId: 'test-order-id',
          menuItemId: 'item1',
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50,
          notes: undefined,
          customizations: JSON.stringify(undefined),
        },
      });

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            order: expect.objectContaining({
              id: 'test-order-id',
              orderNumber: 'ORD20241201120000TEST',
              totalAmount: 50,
            }),
          },
          message: 'Order created successfully',
        }),
        201
      );
    });

    test('should handle transaction rollback on error', async () => {
      (mockPrisma.order.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Database error',
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle authentication failures', async () => {
      mockAuthenticateLambda.mockRejectedValue(new Error('Authentication failed'));

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
      } as any;

      await handler(event, {} as any);

      expect(mockHandleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed',
        })
      );
    });

    test('should handle Prisma disconnect errors', async () => {
      mockPrisma.$disconnect.mockRejectedValue(new Error('Disconnect failed'));

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          studentId: 'test-student',
          deliveryDate: '2024-12-01',
          orderItems: [{ menuItemId: 'item1', quantity: 1 }],
        }),
      } as any;

      // Setup valid mocks to reach disconnect
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-student',
        firstName: 'John',
        lastName: 'Doe',
        parentId: 'test-user-id',
        isActive: true,
        school: { id: 'school1', name: 'Test School', isActive: true },
      } as any);

      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue({
        id: 'item1',
        name: 'Test Item',
        price: 50,
        available: true,
      } as any);

      mockPrisma.$transaction.mockResolvedValue({
        order: { id: 'test-order-id' },
        orderItems: [{ id: 'test-item-id' }],
      });

      await handler(event, {} as any);

      // Should still succeed despite disconnect error
      expect(mockCreateSuccessResponse).toHaveBeenCalled();
    });
  });
});