/**
 * HASIVU Platform - Mobile Delivery Tracking Lambda Function
 * Handles: GET /api/v1/mobile/tracking/orders/{orderId}, GET /api/v1/mobile/tracking/student/{studentId}
 * Implements Story 2.4: Parent Mobile Integration - Real-time Order Tracking for Mobile App
 * Production-ready with comprehensive tracking and delivery status updates
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils';
import {
  authenticateLambda,
  AuthenticatedUser,
} from '../../shared/middleware/lambda-auth.middleware';
import Joi from 'joi';

// Initialize database client
const prisma = new PrismaClient();

// Tracking request schema
const trackingQuerySchema = Joi.object({
  includeHistory: Joi.boolean().optional().default(false),
  includePrediction: Joi.boolean().optional().default(true),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
  status: Joi.string().valid('active', 'completed', 'all').optional().default('all'),
});

// Order tracking interfaces
interface TrackingStep {
  step: number;
  title: string;
  description: string;
  timestamp?: Date;
  completed: boolean;
  current: boolean;
  icon: string;
  estimatedTime?: Date;
}

interface DeliveryVerificationInfo {
  id: string;
  verifiedAt: Date;
  location: string;
  readerId?: string;
  readerName?: string;
  readerLocation?: string;
  verifiedBy?: string;
}

interface MobileOrderTracking {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: Date;
  deliveryDate: Date;
  estimatedDeliveryTime?: Date;
  totalAmount: number;
  itemCount: number;
  paymentStatus: string;
  trackingSteps: TrackingStep[];
  currentStep: number;
  student: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    grade?: string;
    section?: string;
  };
  school: {
    id: string;
    name: string;
    code: string;
  };
  deliveryVerification?: DeliveryVerificationInfo;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    category: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    sentAt: Date;
    type: string;
  }>;
}

interface StudentTrackingOverview {
  student: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    grade?: string;
    section?: string;
    profileImage?: string;
  };
  school: {
    id: string;
    name: string;
    code: string;
  };
  activeOrders: MobileOrderTracking[];
  recentDeliveries: MobileOrderTracking[];
  upcomingOrders: MobileOrderTracking[];
  deliveryStats: {
    totalOrders: number;
    successfulDeliveries: number;
    averageDeliveryTime: number; // in minutes
    lastDeliveryDate?: Date;
    nextScheduledDelivery?: Date;
    favoriteItems: Array<{
      name: string;
      orderCount: number;
      category: string;
    }>;
  };
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    sentAt: Date;
    type: string;
    isRead: boolean;
  }>;
}

/**
 * Validate parent access to student data
 */
async function validateParentAccess(studentId: string, parentUserId: string): Promise<any> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      school: {
        select: { id: true, name: true, code: true, isActive: true },
      },
      rfidCards: {
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { id: true, cardNumber: true },
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  if (student.role !== 'student') {
    throw new Error('User is not a student');
  }

  if (!student.isActive) {
    throw new Error('Student account is inactive');
  }

  // Verify parent relationship
  const parentRelationship = await prisma.studentParent.findFirst({
    where: {
      studentId,
      parentId: parentUserId,
      isActive: true,
    },
    include: {
      parent: {
        select: { id: true, isActive: true },
      },
    },
  });

  if (!parentRelationship) {
    throw new Error('Parent-student relationship not found');
  }

  if (!parentRelationship.parent.isActive) {
    throw new Error('Parent account is inactive');
  }

  return { student, parentRelationship };
}

/**
 * Generate tracking steps for an order
 */
function generateTrackingSteps(order: any, deliveryVerification?: any): TrackingStep[] {
  const steps: TrackingStep[] = [];

  // Step 1: Order Placed
  const placedStep: TrackingStep = {
    step: 1,
    title: 'Order Placed',
    description: `Order #${order.orderNumber} has been placed successfully`,
    timestamp: order.createdAt,
    completed: true,
    current: false,
    icon: 'order-placed',
  };
  steps.push(placedStep);

  // Step 2: Order Confirmed
  const confirmedStep: TrackingStep = {
    step: 2,
    title: 'Order Confirmed',
    description: 'Your order has been confirmed and payment processed',
    timestamp: order.confirmedAt || (order.status === 'confirmed' ? order.updatedAt : undefined),
    completed: ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(
      order.status
    ),
    current: order.status === 'confirmed',
    icon: 'order-confirmed',
  };
  steps.push(confirmedStep);

  // Step 3: Payment Processed
  if (order.paymentStatus === 'paid') {
    const paymentStep: TrackingStep = {
      step: 3,
      title: 'Payment Processed',
      description: 'Payment has been processed successfully',
      timestamp: order.paidAt,
      completed: true,
      current: false,
      icon: 'payment-confirmed',
    };
    steps.push(paymentStep);
  }

  // Step 4: Preparing
  const preparingStep: TrackingStep = {
    step: 4,
    title: 'Preparing Your Meal',
    description: 'Kitchen is preparing your meal with fresh ingredients',
    timestamp: order.preparingAt || (order.status === 'preparing' ? order.updatedAt : undefined),
    completed: ['preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status),
    current: order.status === 'preparing',
    icon: 'preparing',
  };

  if (!preparingStep.completed && order.status === 'confirmed') {
    preparingStep.estimatedTime = new Date(Date.now() + 15 * 60 * 1000); // +15 minutes
  }
  steps.push(preparingStep);

  // Step 5: Ready for Delivery
  const readyStep: TrackingStep = {
    step: 5,
    title: 'Ready for Delivery',
    description: 'Your meal is ready and packed for delivery',
    timestamp: order.readyAt || (order.status === 'ready' ? order.updatedAt : undefined),
    completed: ['ready', 'out_for_delivery', 'delivered'].includes(order.status),
    current: order.status === 'ready',
    icon: 'ready',
  };

  if (!readyStep.completed && ['confirmed', 'preparing'].includes(order.status)) {
    readyStep.estimatedTime = new Date(Date.now() + 30 * 60 * 1000); // +30 minutes
  }
  steps.push(readyStep);

  // Step 6: Out for Delivery
  const outForDeliveryStep: TrackingStep = {
    step: 6,
    title: 'Out for Delivery',
    description: 'Your meal is on the way to the delivery location',
    timestamp:
      order.outForDeliveryAt || (order.status === 'out_for_delivery' ? order.updatedAt : undefined),
    completed: ['out_for_delivery', 'delivered'].includes(order.status),
    current: order.status === 'out_for_delivery',
    icon: 'out-for-delivery',
  };

  if (!outForDeliveryStep.completed && ['confirmed', 'preparing', 'ready'].includes(order.status)) {
    outForDeliveryStep.estimatedTime = new Date(Date.now() + 45 * 60 * 1000); // +45 minutes
  }
  steps.push(outForDeliveryStep);

  // Step 7: Delivered
  const deliveredStep: TrackingStep = {
    step: 7,
    title: 'Delivered',
    description: deliveryVerification
      ? `Delivered and verified via RFID at ${deliveryVerification.location}`
      : 'Your meal has been delivered successfully',
    timestamp: order.deliveredAt || deliveryVerification?.verifiedAt,
    completed: order.status === 'delivered',
    current: order.status === 'delivered',
    icon: 'delivered',
  };
  steps.push(deliveredStep);

  return steps;
}

/**
 * Get detailed order tracking information
 */
async function getOrderTracking(
  orderId: string,
  parentUserId: string
): Promise<MobileOrderTracking> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          grade: true,
          section: true,
        },
      },
      school: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      orderItems: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              category: true,
              price: true,
            },
          },
        },
      },
      deliveryVerifications: {
        include: {
          reader: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
        orderBy: { verifiedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Validate parent access to this order
  await validateParentAccess(order.studentId, parentUserId);

  // Get delivery verification info
  let deliveryVerification: DeliveryVerificationInfo | undefined;
  if (order.deliveryVerifications.length > 0) {
    const verification = order.deliveryVerifications[0];
    deliveryVerification = {
      id: verification.id,
      verifiedAt: verification.verifiedAt,
      location: verification.location || 'School cafeteria',
      readerId: verification.readerId || undefined,
      readerName: verification.reader?.name,
      readerLocation: verification.reader?.location,
    };
  }

  // Generate tracking steps
  const trackingSteps = generateTrackingSteps(order, deliveryVerification);
  const currentStep = trackingSteps.findIndex(step => step.current) + 1;

  // Calculate estimated delivery time
  let estimatedDeliveryTime: Date | undefined;
  if (order.status !== 'delivered') {
    // Estimate based on current status
    const baseTime = new Date();
    switch (order.status) {
      case 'confirmed':
        estimatedDeliveryTime = new Date(baseTime.getTime() + 45 * 60 * 1000); // +45 min
        break;
      case 'preparing':
        estimatedDeliveryTime = new Date(baseTime.getTime() + 30 * 60 * 1000); // +30 min
        break;
      case 'ready':
        estimatedDeliveryTime = new Date(baseTime.getTime() + 15 * 60 * 1000); // +15 min
        break;
      case 'out_for_delivery':
        estimatedDeliveryTime = new Date(baseTime.getTime() + 5 * 60 * 1000); // +5 min
        break;
    }
  }

  // Get recent notifications for this order
  const notifications = await prisma.notification.findMany({
    where: {
      userId: parentUserId,
      // Note: orderId stored in data JSON field for schema compatibility
      type: 'order_update',
    },
    select: {
      id: true,
      title: true,
      message: true,
      createdAt: true,
      type: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    deliveryDate: order.deliveryDate,
    estimatedDeliveryTime,
    totalAmount: order.totalAmount,
    itemCount: order.orderItems.length,
    paymentStatus: order.paymentStatus,
    trackingSteps,
    currentStep,
    student: {
      id: order.student.id,
      name: `${order.student.firstName ?? ''} ${order.student.lastName ?? ''}`,
      firstName: order.student.firstName ?? '',
      lastName: order.student.lastName ?? '',
      grade: order.student.grade || undefined,
      section: order.student.section || undefined,
    },
    school: order.school,
    deliveryVerification,
    items: order.orderItems.map(item => ({
      id: item.id,
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.unitPrice,
      category: item.menuItem.category,
    })),
    notifications: notifications.map(n => ({
      id: n.id,
      title: n.title ?? '',
      message: n.message ?? '',
      sentAt: n.createdAt,
      type: n.type,
    })),
  };
}

/**
 * Get student tracking overview for parent
 */
async function getStudentTrackingOverview(
  studentId: string,
  parentUserId: string,
  filters: any
): Promise<StudentTrackingOverview> {
  // Validate parent access
  const { student } = await validateParentAccess(studentId, parentUserId);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get active orders (not delivered)
  const activeOrders = await prisma.order.findMany({
    where: {
      studentId,
      status: { in: ['confirmed', 'preparing', 'ready', 'out_for_delivery'] },
      deliveryDate: { gte: now },
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, role: true, section: true } },
      school: { select: { id: true, name: true, code: true } },
      orderItems: { include: { menuItem: { select: { name: true, category: true } } } },
      deliveryVerifications: { take: 1, orderBy: { verifiedAt: 'desc' } },
    },
    orderBy: { deliveryDate: 'asc' },
  });

  // Get recent deliveries (last 30 days)
  const recentDeliveries = await prisma.order.findMany({
    where: {
      studentId,
      status: 'delivered',
      deliveredAt: { gte: thirtyDaysAgo },
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, role: true, section: true } },
      school: { select: { id: true, name: true, code: true } },
      orderItems: { include: { menuItem: { select: { name: true, category: true } } } },
      deliveryVerifications: { take: 1, orderBy: { verifiedAt: 'desc' } },
    },
    orderBy: { deliveredAt: 'desc' },
    take: 10,
  });

  // Get upcoming orders (next 7 days)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingOrders = await prisma.order.findMany({
    where: {
      studentId,
      deliveryDate: { gte: now, lte: sevenDaysFromNow },
      status: { in: ['pending', 'confirmed'] },
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, role: true, section: true } },
      school: { select: { id: true, name: true, code: true } },
      orderItems: { include: { menuItem: { select: { name: true, category: true } } } },
    },
    orderBy: { deliveryDate: 'asc' },
  });

  // Calculate delivery statistics
  const totalOrders = await prisma.order.count({
    where: { studentId, createdAt: { gte: thirtyDaysAgo } },
  });

  const successfulDeliveries = await prisma.order.count({
    where: {
      studentId,
      status: 'delivered',
      deliveredAt: { gte: thirtyDaysAgo },
    },
  });

  // Calculate average delivery time
  const deliveryTimes = await prisma.order.findMany({
    where: {
      studentId,
      status: 'delivered',
      deliveredAt: {
        gte: thirtyDaysAgo,
        not: null,
      },
    },
    select: { createdAt: true, deliveredAt: true },
  });

  const averageDeliveryTime =
    deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, order) => {
          const diffMs = order.deliveredAt!.getTime() - order.createdAt.getTime();
          return sum + diffMs;
        }, 0) /
        deliveryTimes.length /
        (1000 * 60) // Convert to minutes
      : 0;

  // Get favorite items
  const favoriteItems = await prisma.orderItem.groupBy({
    by: ['menuItemId'],
    where: {
      order: {
        studentId,
        status: 'delivered',
        deliveredAt: { gte: thirtyDaysAgo },
      },
    },
    _count: { menuItemId: true },
    _sum: { quantity: true },
    orderBy: { _count: { menuItemId: 'desc' } },
    take: 5,
  });

  const favoriteItemsWithDetails = await Promise.all(
    favoriteItems.map(async item => {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        select: { name: true, category: true },
      });
      return {
        name: menuItem?.name || 'Unknown Item',
        orderCount: item._count.menuItemId,
        category: menuItem?.category || 'Unknown',
      };
    })
  );

  // Get recent notifications
  const notifications = await prisma.notification.findMany({
    where: {
      userId: parentUserId,
      // Note: studentId stored in data JSON field for schema compatibility
      type: 'delivery_update',
    },
    select: {
      id: true,
      title: true,
      message: true,
      createdAt: true,
      type: true,
      readAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Convert orders to tracking format
  const convertToTracking = (orders: any[]): MobileOrderTracking[] => {
    return orders.map(order => {
      const deliveryVerification = order.deliveryVerifications?.[0];
      const trackingSteps = generateTrackingSteps(order, deliveryVerification);
      const currentStep = trackingSteps.findIndex(step => step.current) + 1;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        deliveryDate: order.deliveryDate,
        totalAmount: order.totalAmount,
        itemCount: order.orderItems.length,
        paymentStatus: order.paymentStatus,
        trackingSteps,
        currentStep,
        student: {
          id: order.student.id,
          name: `${order.student.firstName ?? ''} ${order.student.lastName ?? ''}`,
          firstName: order.student.firstName ?? '',
          lastName: order.student.lastName ?? '',
          grade: order.student.grade || undefined,
          section: order.student.section || undefined,
        },
        school: order.school,
        deliveryVerification: deliveryVerification
          ? {
              id: deliveryVerification.id,
              verifiedAt: deliveryVerification.verifiedAt,
              location: deliveryVerification.location || 'School cafeteria',
            }
          : undefined,
        items: order.orderItems.map((item: any) => ({
          id: item.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.price,
          category: item.menuItem.category,
        })),
        notifications: [],
      };
    });
  };

  return {
    student: {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade || undefined,
      section: student.section || undefined,
    },
    school: student.school,
    activeOrders: convertToTracking(activeOrders),
    recentDeliveries: convertToTracking(recentDeliveries),
    upcomingOrders: convertToTracking(upcomingOrders),
    deliveryStats: {
      totalOrders,
      successfulDeliveries,
      averageDeliveryTime: Math.round(averageDeliveryTime),
      lastDeliveryDate: recentDeliveries[0]?.deliveredAt ?? undefined,
      nextScheduledDelivery: upcomingOrders[0]?.deliveryDate ?? undefined,
      favoriteItems: favoriteItemsWithDetails,
    },
    notifications: notifications.map(n => ({
      id: n.id,
      title: n.title ?? '',
      message: n.message ?? '',
      sentAt: n.createdAt,
      type: n.type,
      isRead: !!n.readAt,
    })),
  };
}

/**
 * Check if user can access tracking data
 */
function canAccessTracking(requestingUser: AuthenticatedUser, targetUserId: string): boolean {
  // Super admin and admin can access any tracking data
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    return true;
  }

  // Parents can only access their own tracking data
  if (requestingUser.role === 'parent' && requestingUser.id === targetUserId) {
    return true;
  }

  return false;
}

/**
 * Mobile Delivery Tracking Lambda Handler
 */
export const deliveryTrackingHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  const httpMethod = event.httpMethod;
  const pathParameters = event.pathParameters || {};

  try {
    logger.info('Mobile delivery tracking request started', { requestId, httpMethod });

    // Authenticate request
    const authResult = await authenticateLambda(event as any);

    // Check authentication success and extract user
    if (!authResult.success || !authResult.user) {
      logger.warn('Authentication failed', { requestId, error: authResult.error });
      return createErrorResponse('AUTHENTICATION_FAILED', 'Authentication failed', 401);
    }

    const authenticatedUser = authResult.user;

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const { error, value: filters } = trackingQuerySchema.validate(queryParams);

    if (error) {
      logger.warn('Invalid tracking query parameters', { requestId, error: error.details });
      return createErrorResponse(
        'INVALID_PARAMETERS',
        'Invalid query parameters',
        400,
        error.details
      );
    }

    if (pathParameters.orderId) {
      // Get specific order tracking
      const orderId = pathParameters.orderId;

      // For order tracking, we need to verify parent access through the order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { studentId: true },
      });

      if (!order) {
        return createErrorResponse('ORDER_NOT_FOUND', 'Order not found', 404);
      }

      // Check if user can access this order's tracking data
      if (!canAccessTracking(authenticatedUser, authenticatedUser.id)) {
        return createErrorResponse(
          'INSUFFICIENT_PERMISSIONS',
          'Insufficient permissions to access tracking data',
          403
        );
      }

      const tracking = await getOrderTracking(orderId, authenticatedUser.id);

      logger.info('Order tracking retrieved', {
        requestId,
        orderId,
        orderStatus: tracking.status,
      });

      return createSuccessResponse({
        message: 'Order tracking retrieved successfully',
        data: tracking,
      });
    } else if (pathParameters.studentId) {
      // Get student tracking overview
      const studentId = pathParameters.studentId;

      // Check if user can access this student's tracking data
      if (!canAccessTracking(authenticatedUser, authenticatedUser.id)) {
        return createErrorResponse(
          'INSUFFICIENT_PERMISSIONS',
          'Insufficient permissions to access tracking data',
          403
        );
      }

      const overview = await getStudentTrackingOverview(studentId, authenticatedUser.id, filters);

      logger.info('Student tracking overview retrieved', {
        requestId,
        studentId,
        activeOrdersCount: overview.activeOrders.length,
        recentDeliveriesCount: overview.recentDeliveries.length,
      });

      return createSuccessResponse({
        message: 'Student tracking overview retrieved successfully',
        data: overview,
      });
    } else {
      return createErrorResponse(
        'INVALID_REQUEST',
        'Either orderId or studentId must be provided in path parameters',
        400
      );
    }
  } catch (error: any) {
    logger.error(
      'Mobile delivery tracking failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        requestId,
        httpMethod,
      }
    );

    return handleError(error instanceof Error ? error : new Error(String(error)));
  } finally {
    await prisma.$disconnect();
  }
};
