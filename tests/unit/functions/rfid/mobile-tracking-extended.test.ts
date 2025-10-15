/**
 * HASIVU Platform - Extended Mobile RFID Tracking Lambda Function Tests
 * Comprehensive test coverage for real-time delivery tracking with Phase 2.1 enhancements
 * Tests order tracking, delivery verification, and mobile notifications
 * Generated for RFID Extended Features - Phase 2.1
 */
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { getMobileTrackingHandler, updateTrackingStatusHandler } from '../../../../src/functions/rfid/mobile-tracking';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn()
    },
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    deliveryVerification: {
      create: jest.fn()
    },
    studentParent: {
      findFirst: jest.fn()
    },
    $disconnect: jest.fn()
  }))
}));

jest.mock('../../../../src/shared/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

jest.mock('../../../../src/shared/response.utils', () => ({
  createSuccessResponse: jest.fn((data) => ({
    statusCode: 200,
    body: JSON.stringify(data)
  })),
  createErrorResponse: jest.fn((message, statusCode) => ({
    statusCode,
    body: JSON.stringify({ error: message })
  })),
  handleError: jest.fn((error) => ({
    statusCode: 500,
    body: JSON.stringify({ error: 'Internal server error' })
  }))
}));

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const { createSuccessResponse, createErrorResponse, handleError } = require('../../../../src/shared/response.utils');

describe('Extended Mobile RFID Tracking - Phase 2.1', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'mobile-rfid-tracking-extended',
    functionVersion: '2.1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:mobile-rfid-tracking-extended',
    memoryLimitInMB: '256',
    awsRequestId: 'tracking-test-request-id',
    logGroupName: '/aws/lambda/mobile-rfid-tracking-extended',
    logStreamName: '2024/01/01/[1]tracking-extended',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn()
  };

  const mockParentUser = {
    id: 'parent-tracking-123',
    email: 'parent@tracking.com',
    role: 'parent'
  };

  const mockStudent = {
    id: 'student-tracking-456',
    firstName: 'Alex',
    lastName: 'Track',
    email: 'alex.track@school.com',
    role: 'student',
    isActive: true,
    grade: '8th',
    school: {
      id: 'school-tracking-789',
      name: 'Tracking Test School',
      address: '456 Tracking Ave'
    }
  };

  const mockActiveOrders = [
    {
      id: 'order-active-1',
      orderNumber: 'ORD-2024-001',
      status: 'preparing',
      deliveryDate: new Date('2024-01-15'),
      createdAt: new Date('2024-01-15T08:00:00Z'),
      confirmedAt: new Date('2024-01-15T08:15:00Z'),
      preparingAt: new Date('2024-01-15T08:30:00Z'),
      studentId: 'student-tracking-456',
      student: mockStudent,
      orderItems: [{
        menuItem: {
          name: 'Grilled Chicken Lunch',
          category: 'Main Course'
        }
      }]
    },
    {
      id: 'order-active-2',
      orderNumber: 'ORD-2024-002',
      status: 'ready',
      deliveryDate: new Date('2024-01-15'),
      createdAt: new Date('2024-01-15T09:00:00Z'),
      confirmedAt: new Date('2024-01-15T09:15:00Z'),
      preparingAt: new Date('2024-01-15T09:30:00Z'),
      readyAt: new Date('2024-01-15T10:00:00Z'),
      studentId: 'student-tracking-456',
      student: mockStudent,
      orderItems: [{
        menuItem: {
          name: 'Vegetable Pasta',
          category: 'Main Course'
        }
      }]
    }
  ];

  const mockRecentDeliveries = [
    {
      id: 'order-delivered-1',
      orderNumber: 'ORD-2024-DEL-001',
      status: 'delivered',
      deliveryDate: new Date('2024-01-14'),
      deliveredAt: new Date('2024-01-14T12:30:00Z'),
      createdAt: new Date('2024-01-14T08:00:00Z'),
      studentId: 'student-tracking-456',
      student: mockStudent,
      orderItems: [{
        menuItem: {
          name: 'Cheese Pizza',
          category: 'Main Course'
        }
      }]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock authentication - simulate parent user ID from JWT
    (global as any).mockParentUserId = 'parent-tracking-123';

    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockStudent);
    (mockPrisma.order.findMany as jest.Mock)
      .mockResolvedValueOnce(mockActiveOrders) // Active orders
      .mockResolvedValueOnce(mockRecentDeliveries) // Recent deliveries
      .mockResolvedValue([]); // Upcoming orders
    (mockPrisma.studentParent.findFirst as jest.Mock).mockResolvedValue({
      parentId: 'parent-tracking-123',
      parent: { isActive: true }
    });
  });

  describe('Phase 2.1 Enhanced Tracking Retrieval', () => {

    it('should successfully retrieve comprehensive mobile tracking information', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { studentId: 'student-tracking-456' },
        headers: {},
        body: null,
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/students/student-tracking-456/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await getMobileTrackingHandler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.activeOrders).toHaveLength(2);
      expect(responseBody.recentDeliveries).toHaveLength(1);
      expect(responseBody.deliveryStats.totalDelivered).toBe(1);
      expect(responseBody.upcomingOrders).toHaveLength(0);
    });

    it('should validate parent access to student tracking data', async () => {
      (mockPrisma.studentParent.findFirst as jest.Mock).mockResolvedValue(null);

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { studentId: 'unauthorized-student' },
        headers: {},
        body: null,
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/students/unauthorized-student/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await getMobileTrackingHandler(event, mockContext);

      expect(result.statusCode).toBe(403);
      expect(createErrorResponse).toHaveBeenCalledWith('FORBIDDEN', 'Unauthorized: Access denied to student information', 403);
    });

    it('should generate accurate tracking steps for different order statuses', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { studentId: 'student-tracking-456' },
        headers: {},
        body: null,
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/students/student-tracking-456/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      await getMobileTrackingHandler(event, mockContext);

      // Verify tracking steps are generated correctly
      const responseBody = JSON.parse((createSuccessResponse as jest.Mock).mock.calls[0][0]);
      const preparingOrder = responseBody.activeOrders.find((order: any) => order.status === 'preparing');
      const readyOrder = responseBody.activeOrders.find((order: any) => order.status === 'ready');

      expect(preparingOrder.trackingSteps).toBeDefined();
      expect(readyOrder.trackingSteps).toBeDefined();

      // Check that steps have correct completion status
      const preparingSteps = preparingOrder.trackingSteps;
      const readySteps = readyOrder.trackingSteps;

      expect(preparingSteps.find((step: any) => step.id === 'preparing').completed).toBe(true);
      expect(readySteps.find((step: any) => step.id === 'ready').completed).toBe(true);
    });

    it('should calculate delivery statistics accurately', async () => {
      // Mock additional deliveries for statistics
      const additionalDeliveries = [
        ...mockRecentDeliveries,
        {
          ...mockRecentDeliveries[0],
          id: 'order-delivered-2',
          deliveredAt: new Date('2024-01-13T11:00:00Z'),
          deliveryDate: new Date('2024-01-13')
        }
      ];

      (mockPrisma.order.findMany as jest.Mock)
        .mockResolvedValueOnce(mockActiveOrders)
        .mockResolvedValueOnce(additionalDeliveries)
        .mockResolvedValue([]);

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { studentId: 'student-tracking-456' },
        headers: {},
        body: null,
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/students/student-tracking-456/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      await getMobileTrackingHandler(event, mockContext);

      const responseBody = JSON.parse((createSuccessResponse as jest.Mock).mock.calls[0][0]);
      expect(responseBody.deliveryStats.totalDelivered).toBe(2);
      expect(responseBody.deliveryStats.onTimeDeliveryRate).toBeDefined();
      expect(responseBody.deliveryStats.averageDeliveryTime).toBeDefined();
    });

    it('should handle students with no order history', async () => {
      (mockPrisma.order.findMany as jest.Mock)
        .mockResolvedValueOnce([]) // No active orders
        .mockResolvedValueOnce([]) // No recent deliveries
        .mockResolvedValue([]); // No upcoming orders

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { studentId: 'student-tracking-456' },
        headers: {},
        body: null,
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/students/student-tracking-456/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await getMobileTrackingHandler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.activeOrders).toHaveLength(0);
      expect(responseBody.recentDeliveries).toHaveLength(0);
      expect(responseBody.upcomingOrders).toHaveLength(0);
      expect(responseBody.deliveryStats.totalDelivered).toBe(0);
    });
  });

  describe('Phase 2.1 Enhanced Tracking Updates', () => {

    it('should successfully update order tracking status', async () => {
      (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue({
        ...mockActiveOrders[0],
        student: mockStudent
      });
      (mockPrisma.order.update as jest.Mock).mockResolvedValue({
        ...mockActiveOrders[0],
        status: 'ready',
        readyAt: new Date()
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'PUT',
        pathParameters: { orderId: 'order-active-1' },
        headers: {},
        body: JSON.stringify({
          status: 'ready',
          location: 'Kitchen Station A'
        }),
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/orders/order-active-1/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await updateTrackingStatusHandler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-active-1' },
        data: expect.objectContaining({
          status: 'ready',
          readyAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      });
    });

    it('should create delivery verification for RFID-enabled deliveries', async () => {
      (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue({
        ...mockActiveOrders[0],
        student: {
          ...mockStudent,
          rfidCards: [{ id: 'rfid-card-123', isActive: true }]
        }
      });

      const event: APIGatewayProxyEvent = {
        httpMethod: 'PUT',
        pathParameters: { orderId: 'order-active-1' },
        headers: {},
        body: JSON.stringify({
          status: 'delivered',
          location: 'Classroom Pickup',
          rfidCardId: 'rfid-card-123'
        }),
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/orders/order-active-1/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      await updateTrackingStatusHandler(event, mockContext);

      expect(mockPrisma.deliveryVerification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-active-1',
          studentId: 'student-tracking-456',
          cardId: 'rfid-card-123',
          location: 'Classroom Pickup',
          verificationNotes: 'Mobile tracking update'
        })
      });
    });

    it('should validate tracking status transitions', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'PUT',
        pathParameters: { orderId: 'order-active-1' },
        headers: {},
        body: JSON.stringify({
          status: 'invalid_status'
        }),
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/orders/order-active-1/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await updateTrackingStatusHandler(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(createErrorResponse).toHaveBeenCalledWith('VALIDATION_ERROR', 'Invalid status value', 400);
    });

    it('should handle non-existent orders gracefully', async () => {
      (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const event: APIGatewayProxyEvent = {
        httpMethod: 'PUT',
        pathParameters: { orderId: 'nonexistent-order' },
        headers: {},
        body: JSON.stringify({
          status: 'ready'
        }),
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/orders/nonexistent-order/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await updateTrackingStatusHandler(event, mockContext);

      expect(result.statusCode).toBe(404);
      expect(createErrorResponse).toHaveBeenCalledWith('NOT_FOUND', 'Order not found', 404);
    });
  });

  describe('Phase 2.1 Security and Authorization', () => {

    it('should enforce authentication for tracking access', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { studentId: 'student-tracking-456' },
        headers: {},
        body: null,
        requestContext: {} as any, // Missing authorizer
        path: '/mobile/students/student-tracking-456/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await getMobileTrackingHandler(event, mockContext);

      expect(result.statusCode).toBe(401);
      expect(createErrorResponse).toHaveBeenCalledWith('UNAUTHORIZED', 'Unauthorized: Parent authentication required', 401);
    });

    it('should prevent cross-student data access', async () => {
      (mockPrisma.studentParent.findFirst as jest.Mock).mockResolvedValue(null);

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { studentId: 'other-student-789' },
        headers: {},
        body: null,
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/students/other-student-789/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await getMobileTrackingHandler(event, mockContext);

      expect(result.statusCode).toBe(403);
      expect(createErrorResponse).toHaveBeenCalledWith('FORBIDDEN', 'Unauthorized: Access denied to student information', 403);
    });

    it('should validate student existence', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { studentId: 'nonexistent-student' },
        headers: {},
        body: null,
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/students/nonexistent-student/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await getMobileTrackingHandler(event, mockContext);

      expect(result.statusCode).toBe(404);
      expect(createErrorResponse).toHaveBeenCalledWith('NOT_FOUND', 'Student not found', 404);
    });
  });

  describe('Phase 2.1 Error Handling and Edge Cases', () => {

    it('should handle database connection failures', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { studentId: 'student-tracking-456' },
        headers: {},
        body: null,
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/students/student-tracking-456/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await getMobileTrackingHandler(event, mockContext);

      expect(result.statusCode).toBe(500);
      expect(handleError).toHaveBeenCalled();
    });

    it('should handle malformed JSON in update requests', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'PUT',
        pathParameters: { orderId: 'order-active-1' },
        headers: {},
        body: '{ invalid json',
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/orders/order-active-1/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await updateTrackingStatusHandler(event, mockContext);

      expect(result.statusCode).toBe(500);
      expect(handleError).toHaveBeenCalled();
    });

    it('should handle missing required fields in updates', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'PUT',
        pathParameters: { orderId: 'order-active-1' },
        headers: {},
        body: JSON.stringify({}), // Missing status
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/orders/order-active-1/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await updateTrackingStatusHandler(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(createErrorResponse).toHaveBeenCalledWith('VALIDATION_ERROR', 'Status is required', 400);
    });

    it('should handle concurrent tracking updates', async () => {
      (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue({
        ...mockActiveOrders[0],
        student: mockStudent
      });

      const event1: APIGatewayProxyEvent = {
        httpMethod: 'PUT',
        pathParameters: { orderId: 'order-active-1' },
        headers: {},
        body: JSON.stringify({ status: 'ready' }),
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/orders/order-active-1/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const event2: APIGatewayProxyEvent = {
        httpMethod: 'PUT',
        pathParameters: { orderId: 'order-active-2' },
        headers: {},
        body: JSON.stringify({ status: 'out_for_delivery' }),
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/orders/order-active-2/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const [result1, result2] = await Promise.all([
        updateTrackingStatusHandler(event1, mockContext),
        updateTrackingStatusHandler(event2, mockContext)
      ]);

      expect(result1.statusCode).toBe(200);
      expect(result2.statusCode).toBe(200);
    });
  });

  describe('Phase 2.1 Performance and Scalability', () => {

    it('should optimize database queries for tracking data', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { studentId: 'student-tracking-456' },
        headers: {},
        body: null,
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/students/student-tracking-456/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      await getMobileTrackingHandler(event, mockContext);

      expect(mockPrisma.order.findMany).toHaveBeenCalledTimes(3); // Active, recent, upcoming
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'student-tracking-456' },
        include: expect.objectContaining({
          school: true,
          rfidCards: expect.any(Object)
        })
      });
    });

    it('should limit data retrieval for performance', async () => {
      // Mock large dataset
      const largeOrderSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockActiveOrders[0],
        id: `order-${i}`,
        orderNumber: `ORD-2024-${i.toString().padStart(3, '0')}`
      }));

      (mockPrisma.order.findMany as jest.Mock)
        .mockResolvedValueOnce(largeOrderSet.slice(0, 50)) // Active orders
        .mockResolvedValueOnce(largeOrderSet.slice(50)) // Recent deliveries
        .mockResolvedValue([]); // Upcoming

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { studentId: 'student-tracking-456' },
        headers: {},
        body: null,
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/students/student-tracking-456/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const startTime = Date.now();
      const result = await getMobileTrackingHandler(event, mockContext);
      const duration = Date.now() - startTime;

      expect(result.statusCode).toBe(200);
      expect(duration).toBeLessThan(2000); // Should complete within reasonable time
    });

    it('should handle memory efficiently with large datasets', async () => {
      const largeOrderSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockActiveOrders[0],
        id: `order-${i}`,
        orderNumber: `ORD-2024-${i.toString().padStart(4, '0')}`
      }));

      (mockPrisma.order.findMany as jest.Mock)
        .mockResolvedValueOnce(largeOrderSet)
        .mockResolvedValue([])
        .mockResolvedValue([]);

      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        pathParameters: { studentId: 'student-tracking-456' },
        headers: {},
        body: null,
        requestContext: {
          authorizer: { principalId: 'parent-tracking-123' }
        } as any,
        path: '/mobile/students/student-tracking-456/tracking',
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        queryStringParameters: null,
        stageVariables: null,
        resource: ''
      };

      const result = await getMobileTrackingHandler(event, mockContext);

      expect(result.statusCode).toBe(200);
      // Verify response doesn't include excessive data
      const responseBody = JSON.parse(result.body);
      expect(responseBody.activeOrders.length).toBeLessThanOrEqual(1000);
    });
  });
});