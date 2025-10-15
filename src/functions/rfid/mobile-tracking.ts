/**
 * Mobile RFID Tracking API Lambda Function
 *
 * Implements Story 2.4: Parent Mobile Integration - Real-time Order Tracking for Mobile App
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '../../shared/utils/logger';
import { PrismaClient } from '@prisma/client';
import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils';

// Initialize services
const prisma = new PrismaClient();

// Types and interfaces
interface TrackingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  timestamp?: Date;
  location?: string;
  icon: string;
}

interface DeliveryVerificationInfo {
  rfidCardId: string;
  location: string;
  timestamp: Date;
  verifiedBy: string;
  method: 'RFID' | 'Manual' | 'QR';
}

interface NotificationInfo {
  id: string;
  type: 'order_confirmed' | 'preparing' | 'ready' | 'delivered' | 'delay';
  message: string;
  timestamp: Date;
  read: boolean;
}

interface MobileOrderTracking {
  orderId: string;
  orderNumber: string;
  status: string;
  menuPlan: {
    name: string;
    date: Date;
    meal: string;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    grade: string;
    school: {
      name: string;
      location: string;
    };
  };
  trackingSteps: TrackingStep[];
  deliveryVerification?: DeliveryVerificationInfo;
  estimatedDeliveryTime?: Date;
  notifications: NotificationInfo[];
}

interface MobileTrackingResponse {
  activeOrders: MobileOrderTracking[];
  recentDeliveries: MobileOrderTracking[];
  deliveryStats: {
    totalDelivered: number;
    onTimeDeliveryRate: number;
    averageDeliveryTime: number;
  };
  upcomingOrders: MobileOrderTracking[];
}

/**
 * Validate parent access to student information
 */
async function validateParentAccess(studentId: string, parentUserId: string): Promise<boolean> {
  try {
    const student = await prisma.user.findFirst({
      where: { id: studentId },
      include: {
        rfidCards: {
          where: {
            isActive: true,
          },
        },
      },
      take: 1,
    });

    if (!student) {
      return false;
    }

    if (student.role !== 'student') {
      return false;
    }

    if (!student.isActive) {
      return false;
    }

    // Verify parent relationship
    const parentRelationship = await prisma.studentParent.findFirst({
      where: {
        studentId,
        parentId: parentUserId,
      },
      include: {
        parent: true,
      },
    });

    if (!parentRelationship) {
      return false;
    }

    if (!parentRelationship.parent.isActive) {
      return false;
    }

    return true;
  } catch (error: unknown) {
    logger.error(
      'Error validating parent access:',
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}

/**
 * Generate tracking steps for an order
 */
function generateTrackingSteps(order: any): TrackingStep[] {
  const steps: TrackingStep[] = [];

  // Step 1: Order Placed
  const placedStep: TrackingStep = {
    id: 'placed',
    title: 'Order Placed',
    description: `Order #${order.orderNumber} has been placed successfully`,
    completed: true,
    timestamp: order.createdAt,
    icon: 'shopping-cart',
  };
  steps.push(placedStep);

  // Step 2: Order Confirmed
  const confirmedStep: TrackingStep = {
    id: 'confirmed',
    title: 'Order Confirmed',
    description: 'Your order has been confirmed and is being processed',
    completed: order.status !== 'pending',
    timestamp: order.confirmedAt,
    icon: 'check-circle',
  };
  steps.push(confirmedStep);

  // Step 3: Payment Processed
  if (order.paymentStatus === 'paid') {
    const paymentStep: TrackingStep = {
      id: 'payment',
      title: 'Payment Processed',
      description: 'Payment has been successfully processed',
      completed: true,
      timestamp: order.paidAt,
      icon: 'credit-card',
    };
    steps.push(paymentStep);
  }

  // Step 4: Preparing
  const preparingStep: TrackingStep = {
    id: 'preparing',
    title: 'Preparing Your Order',
    description: 'Your meal is being prepared in the kitchen',
    completed: ['preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status),
    timestamp: order.preparingAt,
    icon: 'chef-hat',
  };

  if (!preparingStep.completed && order.status === 'confirmed') {
    preparingStep.description = 'Your order will start preparation soon';
  }
  steps.push(preparingStep);

  // Step 5: Ready for Delivery
  const readyStep: TrackingStep = {
    id: 'ready',
    title: 'Ready for Delivery',
    description: 'Your meal is ready and waiting for delivery',
    completed: ['ready', 'out_for_delivery', 'delivered'].includes(order.status),
    timestamp: order.readyAt,
    icon: 'package',
  };

  if (!readyStep.completed && ['confirmed', 'preparing'].includes(order.status)) {
    readyStep.description = 'Your meal will be ready soon';
  }
  steps.push(readyStep);

  // Step 6: Out for Delivery
  const outForDeliveryStep: TrackingStep = {
    id: 'out_for_delivery',
    title: 'Out for Delivery',
    description: 'Your order is on its way to the delivery location',
    completed: ['out_for_delivery', 'delivered'].includes(order.status),
    timestamp: order.outForDeliveryAt,
    icon: 'truck',
  };

  if (!outForDeliveryStep.completed && ['confirmed', 'preparing', 'ready'].includes(order.status)) {
    outForDeliveryStep.description = 'Your order will be dispatched soon';
  }
  steps.push(outForDeliveryStep);

  // Step 7: Delivered
  const deliveredStep: TrackingStep = {
    id: 'delivered',
    title: 'Delivered',
    description: 'Your order has been delivered',
    completed: order.status === 'delivered',
    timestamp: order.deliveredAt,
    location: undefined,
    icon: 'check-circle-2',
  };
  steps.push(deliveredStep);

  return steps;
}

/**
 * Get mobile tracking information for a student
 */
export const getMobileTrackingHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.info('getMobileTracking function started', { eventPath: event.path });

  try {
    // Extract student ID from path parameters
    const studentId = event.pathParameters?.studentId;
    if (!studentId) {
      return createErrorResponse('VALIDATION_ERROR', 'Student ID is required', 400);
    }

    // Extract parent user ID from JWT token (assuming it's in the request context)
    const parentUserId = event.requestContext?.authorizer?.principalId;
    if (!parentUserId) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Unauthorized: Parent authentication required',
        401
      );
    }

    // Validate parent access to student
    const hasAccess = await validateParentAccess(studentId, parentUserId);
    if (!hasAccess) {
      return createErrorResponse(
        'FORBIDDEN',
        'Unauthorized: Access denied to student information',
        403
      );
    }

    // Get student information
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        school: true,
        rfidCards: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!student) {
      return createErrorResponse('NOT_FOUND', 'Student not found', 404);
    }

    // Get active orders (current day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeOrders = await prisma.order.findMany({
      where: {
        studentId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'],
        },
      },
      include: {
        student: {
          include: {
            school: true,
          },
        },
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get recent deliveries (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentDeliveries = await prisma.order.findMany({
      where: {
        studentId,
        status: 'delivered',
        deliveredAt: {
          gte: weekAgo,
        },
      },
      include: {
        student: {
          include: {
            school: true,
          },
        },
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        deliveredAt: 'desc',
      },
      take: 10,
    });

    // Get upcoming orders (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingOrders = await prisma.order.findMany({
      where: {
        studentId,
        deliveryDate: {
          gt: today,
          lte: nextWeek,
        },
      },
      include: {
        student: {
          include: {
            school: true,
          },
        },
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        deliveryDate: 'asc',
      },
    });

    // Calculate delivery stats
    const totalDelivered = recentDeliveries.length;
    const onTimeDeliveries = recentDeliveries.filter(
      order => order.deliveredAt && order.deliveryDate && order.deliveredAt <= order.deliveryDate
    ).length;
    const onTimeDeliveryRate = totalDelivered > 0 ? (onTimeDeliveries / totalDelivered) * 100 : 0;

    const deliveryTimes = recentDeliveries
      .filter(order => order.createdAt && order.deliveredAt)
      .map(order => (order.deliveredAt!.getTime() - order.createdAt.getTime()) / (1000 * 60)); // minutes

    const averageDeliveryTime =
      deliveryTimes.length > 0
        ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
        : 0;

    // Transform orders to mobile tracking format
    const transformOrder = (order: any): MobileOrderTracking => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      menuPlan: {
        name: order.orderItems?.[0]?.menuItem?.name || 'Meal Order',
        date: order.deliveryDate,
        meal: order.orderItems?.[0]?.menuItem?.category || 'Lunch',
      },
      student: {
        id: order.student.id,
        firstName: order.student.firstName,
        lastName: order.student.lastName,
        grade: order.student.grade || 'N/A',
        school: {
          name: order.student.school.name,
          location: order.student.school.address || 'School Campus',
        },
      },
      trackingSteps: generateTrackingSteps(order),
      deliveryVerification: undefined, // TODO: Implement delivery verification lookup
      estimatedDeliveryTime: order.deliveryDate,
      notifications: [], // TODO: Implement notifications system
    });

    const response: MobileTrackingResponse = {
      activeOrders: activeOrders.map(transformOrder),
      recentDeliveries: recentDeliveries.map(transformOrder),
      deliveryStats: {
        totalDelivered,
        onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
        averageDeliveryTime: Math.round(averageDeliveryTime),
      },
      upcomingOrders: upcomingOrders.map(transformOrder),
    };

    const duration = Date.now() - startTime;
    logger.info('getMobileTracking completed', { statusCode: 200, duration });

    return createSuccessResponse(response);
  } catch (error: unknown) {
    return handleError(error as Error);
  }
};

/**
 * Update tracking status for an order
 */
export const updateTrackingStatusHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.info('updateTrackingStatus function started', { eventPath: event.path });

  try {
    // Extract order ID from path parameters
    const orderId = event.pathParameters?.orderId;
    if (!orderId) {
      return createErrorResponse('VALIDATION_ERROR', 'Order ID is required', 400);
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { status, location, rfidCardId } = body;

    // Validate required fields
    if (!status) {
      return createErrorResponse('VALIDATION_ERROR', 'Status is required', 400);
    }

    // Validate status value
    const validStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid status value', 400);
    }

    // Get order information
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        student: {
          include: {
            rfidCards: true,
          },
        },
      },
    });

    if (!order) {
      return createErrorResponse('NOT_FOUND', 'Order not found', 404);
    }

    // Update order status
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Set timestamp fields based on status
    switch (status) {
      case 'confirmed':
        updateData.confirmedAt = new Date();
        break;
      case 'preparing':
        updateData.preparingAt = new Date();
        break;
      case 'ready':
        updateData.readyAt = new Date();
        break;
      case 'out_for_delivery':
        updateData.outForDeliveryAt = new Date();
        break;
      case 'delivered':
        updateData.deliveredAt = new Date();
        break;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Create delivery verification for delivered orders
    if (status === 'delivered' && rfidCardId) {
      await prisma.deliveryVerification.create({
        data: {
          orderId,
          studentId: order.studentId,
          cardId: rfidCardId,
          readerId: 'default-reader', // Default reader ID - should be configurable
          location: location || 'School',
          verificationNotes: 'Mobile tracking update',
        },
      });
    }

    const duration = Date.now() - startTime;
    logger.info('getMobileTracking completed', { statusCode: 200, duration });

    return createSuccessResponse({
      message: 'Tracking status updated successfully',
      orderId,
      status,
      timestamp: new Date(),
    });
  } catch (error: unknown) {
    return handleError(error as Error);
  }
};

// Main handler for serverless deployment
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path } = event;

  try {
    switch (`${httpMethod}:${path}`) {
      case 'GET:/mobile/students/{studentId}/tracking':
        return await getMobileTrackingHandler(event, context);
      case 'PUT:/mobile/orders/{orderId}/tracking':
        return await updateTrackingStatusHandler(event, context);
      default:
        return createErrorResponse('NOT_FOUND', 'Endpoint not found', 404);
    }
  } catch (error: unknown) {
    logger.error(
      'Mobile tracking handler error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return handleError(error instanceof Error ? error : new Error(String(error)));
  } finally {
    await prisma.$disconnect();
  }
};

export default {
  getMobileTrackingHandler,
  updateTrackingStatusHandler,
};
