/**
 * Get Order Details Lambda Function
 * Handles: GET /orders/{orderId}
 * Implements Epic 3: Order Processing System - Order Retrieval
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '@/utils/logger';
import { createSuccessResponse, createErrorResponse, handleError } from '@/shared/response.utils';
import { prisma, DatabaseManager } from '@/database/DatabaseManager';

/**
 * Order details response interface
 */
interface OrderDetailsResponse {
  id: string;
  orderNumber: string;
  studentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    grade?: string;
    section?: string;
  };
  school: {
    id: string;
    name: string;
    address?: string;
  };
  deliveryDate: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  orderItems: Array<{
    id: string;
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialInstructions?: string;
    customizations?: Record<string, any>;
    nutritionalInfo?: Record<string, any>;
    allergens?: string[];
  }>;
  trackingHistory: Array<{
    id: string;
    status: string;
    timestamp: Date;
    notes?: string;
    updatedBy?: string;
  }>;
  paymentDetails?: {
    paymentOrderId?: string;
    razorpayOrderId?: string;
    paymentMethod?: string;
    paidAt?: Date;
  };
  deliveryDetails?: {
    estimatedDeliveryTime?: Date;
    actualDeliveryTime?: Date;
    deliveredBy?: string;
    rfidVerified?: boolean;
  };
  deliveryInstructions?: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get comprehensive order details with authorization check
 */
async function getOrderWithAuthorization(orderId: string, userId: string): Promise<any> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          grade: true,
          section: true,
          parentId: true,
          schoolId: true,
        },
      },
      school: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
      orderItems: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              nutritionalInfo: true,
              allergens: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      payments: {
        select: {
          id: true,
          status: true,
          amount: true,
          razorpayPaymentId: true,
          paidAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Check if user has permission to view this order
  const canView =
    order.studentId === userId || // Student themselves
    order.student.parentId === userId; // Parent of student

  if (!canView) {
    // Check if user is school staff with access
    const staffUser = await prisma.user.findFirst({
      where: {
        id: userId,
        schoolId: order.schoolId,
        role: { in: ['school_admin', 'admin', 'super_admin', 'staff'] },
        isActive: true,
      },
    });

    if (!staffUser) {
      throw new Error('Not authorized to view this order');
    }
  }

  return order;
}

/**
 * Get basic tracking history (simplified for current schema)
 */
function getBasicTrackingHistory(order: any): any[] {
  return [
    {
      id: `${order.id}-created`,
      status: 'pending',
      timestamp: order.createdAt,
      notes: 'Order created',
    },
    {
      id: `${order.id}-current`,
      status: order.status,
      timestamp: order.updatedAt,
      notes: `Order status: ${order.status}`,
    },
  ];
}

/**
 * Get Order Details Lambda Function Handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.logFunctionStart('getOrderHandler', { event, context });

  try {
    // Only allow GET method
    if (event.httpMethod !== 'GET') {
      return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    // Extract orderId from path parameters
    const orderId = event.pathParameters?.orderId;
    if (!orderId) {
      return createErrorResponse('MISSING_ORDER_ID', 'Missing orderId in path parameters', 400);
    }

    // Extract userId from event context (would come from JWT in real implementation)
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
    }

    logger.info('Processing get order request', { orderId, userId });

    // Get comprehensive order details with authorization
    const order = await getOrderWithAuthorization(orderId, userId);

    // Get basic tracking history
    const trackingHistory = getBasicTrackingHistory(order);

    // Prepare payment details from included payments
    const paymentDetails =
      order.payments.length > 0
        ? {
            paymentOrderId: order.payments[0].id,
            razorpayOrderId: undefined, // Not available in current schema
            paymentMethod: 'payment',
            status: order.payments[0].status,
            paidAt: order.payments[0].paidAt || undefined,
          }
        : undefined;

    // Prepare delivery details (simplified for current schema)
    const deliveryDetails = order.deliveredAt
      ? {
          estimatedDeliveryTime: undefined,
          actualDeliveryTime: order.deliveredAt,
          deliveredBy: undefined,
          rfidVerified: false,
        }
      : undefined;

    const response: OrderDetailsResponse = {
      id: order.id,
      orderNumber: order.orderNumber,
      studentId: order.studentId,
      student: {
        id: order.student.id,
        firstName: order.student.firstName,
        lastName: order.student.lastName,
        grade: order.student.grade,
        section: order.student.section,
      },
      school: {
        id: order.school.id,
        name: order.school.name,
        address: order.school.address,
      },
      deliveryDate: order.deliveryDate.toISOString().split('T')[0],
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: Number(order.totalAmount),
      orderItems: order.orderItems.map((item: any) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        specialInstructions: item.notes,
        customizations: item.customizations ? JSON.parse(item.customizations) : {},
        nutritionalInfo: item.menuItem.nutritionalInfo
          ? JSON.parse(item.menuItem.nutritionalInfo)
          : {},
        allergens: item.menuItem.allergens || [],
      })),
      trackingHistory,
      paymentDetails: paymentDetails || undefined,
      deliveryDetails: deliveryDetails || undefined,
      deliveryInstructions: order.specialInstructions,
      contactPhone: undefined, // Not in current schema
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    const duration = Date.now() - startTime;
    logger.logFunctionEnd('handler', { statusCode: 200, duration });
    logger.info('Order details retrieved successfully', {
      orderId,
      itemCount: order.orderItems.length,
      status: order.status,
    });

    return createSuccessResponse({
      data: {
        order: response,
      },
      message: 'Order details retrieved successfully',
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logger.logFunctionEnd('handler', { statusCode: 500, duration });
    return handleError(error, 'Failed to retrieve order details');
  }
};
