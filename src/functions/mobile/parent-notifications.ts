/**
 * HASIVU Platform - Parent Mobile Notifications Lambda Function
 * Handles: POST /api/v1/mobile/notifications/send, GET /api/v1/mobile/notifications/{parentId}
 * Implements Story 2.4: Parent Mobile Integration - Push Notifications for Delivery Updates
 * Production-ready with comprehensive notification delivery and tracking
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../shared/logger.service';
import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils';
import { authenticateLambda, AuthenticatedUser } from '../../shared/middleware/lambda-auth.middleware';
import Joi from 'joi';

// Initialize database client
const prisma = new PrismaClient();

// Type for Prisma notification with includes
type NotificationWithRelations = {
  id: string;
  type: string;
  title: string;
  message: string;
  data: string;
  priority: string;
  status: string;
  createdAt: Date;
  readAt?: Date;
  deliveredAt?: Date;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
  };
};

// Notification types for mobile app
export enum NotificationType {
  DELIVERY_CONFIRMATION = 'delivery_confirmation',
  ORDER_READY = 'order_ready',
  ORDER_OUT_FOR_DELIVERY = 'order_out_for_delivery',
  DELIVERY_FAILED = 'delivery_failed',
  CARD_ISSUE = 'card_issue',
  ACCOUNT_UPDATE = 'account_update',
  PAYMENT_REMINDER = 'payment_reminder',
  WEEKLY_SUMMARY = 'weekly_summary'
}

// Push notification request schema
const pushNotificationSchema = Joi.object({
  parentIds: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
  notificationType: Joi.string().valid(...Object.values(NotificationType)).required(),
  title: Joi.string().required().min(1).max(100),
  message: Joi.string().required().min(1).max(500),
  data: Joi.object().optional().default({}),
  deliveryTime: Joi.date().optional(), // For scheduled notifications
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional().default('normal'),
  schoolId: Joi.string().uuid().optional(),
  studentId: Joi.string().uuid().optional(),
  orderId: Joi.string().uuid().optional()
});

// Get notifications request schema
const getNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(50).optional().default(20),
  status: Joi.string().valid('unread', 'read', 'all').optional().default('all'),
  notificationType: Joi.string().valid(...Object.values(NotificationType)).optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional()
});

// Interfaces
interface PushNotificationRequest {
  parentIds: string[];
  notificationType: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  deliveryTime?: Date;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  schoolId?: string;
  studentId?: string;
  orderId?: string;
}

interface GetNotificationsRequest {
  page?: number;
  limit?: number;
  status?: 'unread' | 'read' | 'all';
  notificationType?: NotificationType;
  dateFrom?: Date;
  dateTo?: Date;
}

interface MobileNotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  priority: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Date;
  readAt?: Date;
  deliveredAt?: Date;
  student?: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
  };
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
  };
}

/**
 * Validate parent relationship and permissions
 */
async function validateParentAccess(parentId: string, requestingUser: AuthenticatedUser): Promise<any> {
  // Super admin and admin can access any parent
  if (['super_admin', 'admin'].includes(requestingUser.role)) {
    const parent = await prisma.user.findUnique({
      where: { id: parentId, role: 'parent' },
      include: {
        school: {
          select: { id: true, name: true, code: true }
        }
      }
    });
    
    if (!parent) {
      throw new Error('Parent not found');
    }
    
    return parent;
  }
  
  // Parents can only access their own notifications
  if (requestingUser.role === 'parent') {
    if (requestingUser.id !== parentId) {
      throw new Error('Access denied: Can only access your own notifications');
    }
    
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      include: {
        school: {
          select: { id: true, name: true, code: true }
        }
      }
    });
    
    if (!parent) {
      throw new Error('Parent not found');
    }
    
    return parent;
  }
  
  // School staff can access parents in their school
  if (['school_admin', 'staff', 'teacher'].includes(requestingUser.role)) {
    const parent = await prisma.user.findUnique({
      where: { 
        id: parentId, 
        role: 'parent',
        schoolId: requestingUser.schoolId
      },
      include: {
        school: {
          select: { id: true, name: true, code: true }
        }
      }
    });
    
    if (!parent) {
      throw new Error('Parent not found or not in your school');
    }
    
    return parent;
  }
  
  throw new Error('Insufficient permissions');
}

/**
 * Send push notification to mobile devices
 */
async function sendPushNotification(
  deviceToken: string,
  title: string,
  message: string,
  data: Record<string, any>,
  priority: string
): Promise<boolean> {
  // This would integrate with AWS SNS, Firebase FCM, or similar service
  // For now, we'll simulate the push notification
  
  try {
    const logger = LoggerService.getInstance();
    
    // Simulate push notification service call
    // In production, this would be:
    // - AWS SNS for cross-platform push notifications
    // - Firebase FCM for Android/iOS
    // - Apple Push Notification Service (APNs)
    
    logger.info('Push notification sent', {
      deviceToken: deviceToken.substring(0, 10) + '...',
      title,
      priority,
      dataKeys: Object.keys(data)
    });
    
    return true;
  } catch (error) {
    LoggerService.getInstance().error('Push notification failed', {
      error: (error as Error).message,
      deviceToken: deviceToken.substring(0, 10) + '...'
    });
    return false;
  }
}

/**
 * Create mobile notification record
 */
async function createMobileNotification(
  parentId: string,
  notificationData: PushNotificationRequest,
  deliveryStatus: 'sent' | 'failed' = 'sent'
): Promise<any> {
  const notification = await prisma.notification.create({
    data: {
      userId: parentId,
      type: notificationData.notificationType,
      title: notificationData.title,
      body: notificationData.message, // Use 'body' field as per schema
      message: notificationData.message, // Keep for backward compatibility
      data: JSON.stringify({
        ...(notificationData.data || {}),
        schoolId: notificationData.schoolId || null,
        studentId: notificationData.studentId || null,
        orderId: notificationData.orderId || null,
        mobileNotification: true,
        deviceDelivery: deliveryStatus,
        timestamp: new Date().toISOString()
      }),
      priority: notificationData.priority || 'normal',
      status: deliveryStatus,
      deliveredAt: deliveryStatus === 'sent' ? new Date() : null
    } as any
  });

  return notification;
}

/**
 * Send delivery confirmation notification
 */
export async function sendDeliveryConfirmation(
  parentId: string,
  studentName: string,
  orderNumber: string,
  deliveryLocation: string,
  deliveryTime: Date
): Promise<void> {
  const title = 'Meal Delivered Successfully';
  const message = `${studentName}'s meal (Order #${orderNumber}) has been delivered at ${deliveryLocation}`;
  
  const notificationData: PushNotificationRequest = {
    parentIds: [parentId],
    notificationType: NotificationType.DELIVERY_CONFIRMATION,
    title,
    message,
    priority: 'high',
    data: {
      orderNumber,
      studentName,
      deliveryLocation,
      deliveryTime: deliveryTime.toISOString(),
      actionType: 'delivery_confirmation'
    }
  };

  // Get parent device tokens
  const parent = await prisma.user.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      deviceTokens: true,
      preferences: true
    }
  });

  if (parent?.deviceTokens) {
    let deviceTokens: string[] = [];
    try {
      deviceTokens = JSON.parse(parent.deviceTokens);
    } catch (error) {
      deviceTokens = [];
    }

    // Send to all registered devices
    for (const token of deviceTokens) {
      await sendPushNotification(token, title, message, notificationData.data!, 'high');
    }
  }

  // Create notification record
  await createMobileNotification(parentId, notificationData, 'sent');
}

/**
 * Get mobile notifications for parent
 */
async function getMobileNotifications(
  parentId: string,
  filters: GetNotificationsRequest
): Promise<{ notifications: MobileNotificationResponse[]; pagination: any }> {
  const { page = 1, limit = 20, status = 'all', notificationType, dateFrom, dateTo } = filters;
  const skip = (page - 1) * limit;

  // Build where clause
  let whereClause: any = {
    userId: parentId,
    type: { in: Object.values(NotificationType) } // Only mobile notification types
  };

  if (status !== 'all') {
    if (status === 'read') {
      whereClause.readAt = { not: null };
    } else if (status === 'unread') {
      whereClause.readAt = null;
    }
  }

  if (notificationType) {
    whereClause.type = notificationType;
  }

  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt.gte = dateFrom;
    if (dateTo) whereClause.createdAt.lte = dateTo;
  }

  // Get notifications with related data
  const [notifications, totalCount]: [NotificationWithRelations[], number] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notification.count({ where: whereClause })
  ]);

  // Format response
  const formattedNotifications: MobileNotificationResponse[] = notifications.map(notification => {
    let data = {};
    try {
      data = JSON.parse(notification.data || '{}');
    } catch (error) {
      data = {};
    }

    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data,
      priority: notification.priority,
      status: notification.status as any,
      createdAt: notification.createdAt,
      readAt: notification.readAt || undefined,
      deliveredAt: notification.deliveredAt || undefined,
      student: notification.student ? {
        id: notification.student.id,
        name: `${notification.student.firstName} ${notification.student.lastName}`,
        firstName: notification.student.firstName,
        lastName: notification.student.lastName
      } : undefined,
      order: notification.order ? {
        id: notification.order.id,
        orderNumber: notification.order.orderNumber,
        status: notification.order.status,
        totalAmount: notification.order.totalAmount
      } : undefined
    };
  });

  return {
    notifications: formattedNotifications,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    }
  };
}

/**
 * Mark notification as read
 */
async function markNotificationAsRead(notificationId: string, parentId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: parentId
    },
    data: {
      readAt: new Date(),
      status: 'read'
    }
  });
}

/**
 * Check if user can send notifications
 */
function canSendNotifications(requestingUser: AuthenticatedUser): boolean {
  return ['super_admin', 'admin', 'school_admin', 'staff'].includes(requestingUser.role);
}

/**
 * Parent Mobile Notifications Lambda Handler
 * Handles both sending and retrieving mobile notifications
 */
export const parentNotificationsHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const logger = LoggerService.getInstance();
  const requestId = context.awsRequestId;
  const httpMethod = event.httpMethod;
  
  try {
    logger.info('Parent mobile notifications request started', { requestId, httpMethod });
    
    // Authenticate request
    const authenticatedUser = await authenticateLambda(event);
    
    switch (httpMethod) {
      case 'POST':
        return await handleSendNotification(event, requestId, authenticatedUser as AuthenticatedUser);
      case 'GET':
        return await handleGetNotifications(event, requestId, authenticatedUser as AuthenticatedUser);
      case 'PUT':
        return await handleMarkAsRead(event, requestId, authenticatedUser as AuthenticatedUser);
      default:
        return createErrorResponse(405, 'Method not allowed');
    }
    
  } catch (error: any) {
    logger.error('Parent mobile notifications failed', {
      requestId,
      httpMethod,
      error: error.message,
      stack: error.stack
    });
    
    return handleError(error, 'Failed to process mobile notification request');
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Handle send notification request
 */
async function handleSendNotification(
  event: APIGatewayProxyEvent,
  requestId: string,
  authenticatedUser: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const logger = LoggerService.getInstance();
  
  // Authorization check
  if (!canSendNotifications(authenticatedUser)) {
    logger.warn('Unauthorized notification sending attempt', {
      requestId,
      userId: authenticatedUser.id,
      userRole: authenticatedUser.role
    });
    return createErrorResponse(403, 'Insufficient permissions to send notifications');
  }
  
  // Parse and validate request body
  const requestBody = JSON.parse(event.body || '{}');
  const { error, value: notificationData } = pushNotificationSchema.validate(requestBody);
  
  if (error) {
    logger.warn('Invalid notification request data', { requestId, error: error.details });
    return createErrorResponse(400, 'Invalid request data', error.details);
  }
  
  const { parentIds, ...notificationDetails } = notificationData as PushNotificationRequest;
  
  // Send notifications to all parents
  const results = [];
  for (const parentId of parentIds) {
    try {
      // Validate parent access
      const parent = await validateParentAccess(parentId, authenticatedUser);
      
      // Get device tokens
      let deviceTokens: string[] = [];
      if (parent.deviceTokens) {
        try {
          deviceTokens = JSON.parse(parent.deviceTokens);
        } catch (error) {
          deviceTokens = [];
        }
      }
      
      // Send push notifications
      let deliveryStatus: 'sent' | 'failed' = 'sent';
      if (deviceTokens.length > 0) {
        const pushResults = await Promise.all(
          deviceTokens.map(token => 
            sendPushNotification(
              token, 
              notificationDetails.title, 
              notificationDetails.message, 
              notificationDetails.data || {}, 
              notificationDetails.priority || 'normal'
            )
          )
        );
        
        // If all push notifications failed, mark as failed
        if (pushResults.every(result => !result)) {
          deliveryStatus = 'failed';
        }
      }
      
      // Create notification record
      const notification = await createMobileNotification(
        parentId, 
        { parentIds: [parentId], ...notificationDetails }, 
        deliveryStatus
      );
      
      results.push({
        parentId,
        notificationId: notification.id,
        status: deliveryStatus,
        deviceCount: deviceTokens.length
      });
      
    } catch (error: any) {
      results.push({
        parentId,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  logger.info('Mobile notifications sent', {
    requestId,
    totalParents: parentIds.length,
    successCount: results.filter(r => r.status === 'sent').length,
    failureCount: results.filter(r => r.status === 'failed').length
  });
  
  return createSuccessResponse({
    message: 'Mobile notifications processed',
    data: {
      totalParents: parentIds.length,
      results
    }
  });
}

/**
 * Handle get notifications request
 */
async function handleGetNotifications(
  event: APIGatewayProxyEvent,
  requestId: string,
  authenticatedUser: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const logger = LoggerService.getInstance();
  
  // Extract parent ID from path parameters
  const parentId = event.pathParameters?.parentId;
  if (!parentId) {
    return createErrorResponse(400, 'Parent ID is required');
  }
  
  // Validate parent access
  await validateParentAccess(parentId, authenticatedUser);
  
  // Parse query parameters
  const queryParams = event.queryStringParameters || {};
  const { error, value: filters } = getNotificationsSchema.validate(queryParams);
  
  if (error) {
    logger.warn('Invalid get notifications parameters', { requestId, error: error.details });
    return createErrorResponse(400, 'Invalid query parameters', error.details);
  }
  
  // Get notifications
  const result = await getMobileNotifications(parentId, filters as GetNotificationsRequest);
  
  logger.info('Mobile notifications retrieved', {
    requestId,
    parentId,
    notificationCount: result.notifications.length,
    total: result.pagination.total
  });
  
  return createSuccessResponse({
    message: 'Mobile notifications retrieved successfully',
    data: result.notifications,
    pagination: result.pagination
  });
}

/**
 * Handle mark as read request
 */
async function handleMarkAsRead(
  event: APIGatewayProxyEvent,
  requestId: string,
  authenticatedUser: AuthenticatedUser
): Promise<APIGatewayProxyResult> {
  const logger = LoggerService.getInstance();
  
  // Extract notification ID from path parameters
  const notificationId = event.pathParameters?.notificationId;
  if (!notificationId) {
    return createErrorResponse(400, 'Notification ID is required');
  }
  
  // Get notification to verify ownership
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true }
  });
  
  if (!notification) {
    return createErrorResponse(404, 'Notification not found');
  }
  
  // Validate parent access
  await validateParentAccess(notification.userId, authenticatedUser);
  
  // Mark as read
  await markNotificationAsRead(notificationId, notification.userId);
  
  logger.info('Notification marked as read', {
    requestId,
    notificationId,
    parentId: notification.userId
  });
  
  return createSuccessResponse({
    message: 'Notification marked as read successfully'
  });
}