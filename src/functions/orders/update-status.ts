/**
 * Update Order Status Lambda Function
 * Handles: PUT /orders/{orderId}/status
 * Implements Epic 3: Order Processing System - Order Status Management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '@/utils/logger';
import { createSuccessResponse, createErrorResponse, handleError } from '@/shared/response.utils';
import { DatabaseService } from '@/services/database.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Order status update interface
 */
interface UpdateOrderStatusRequest {
  status: string;
  notes?: string;
  reason?: string;
}

/**
 * Order status response interface
 */
interface OrderStatusResponse {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  statusHistory: Array<{
    id: string;
    status: string;
    notes?: string;
    updatedBy: string;
    timestamp: Date;
  }>;
  updatedBy: string;
  updatedAt: Date;
}

/**
 * Valid order status transitions
 */
const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['preparing', 'cancelled'],
  'preparing': ['ready', 'cancelled'],
  'ready': ['delivered', 'cancelled'],
  'delivered': ['completed'],
  'completed': [], // Final state
  'cancelled': [] // Final state
};

/**
 * Status descriptions for notifications
 */
const STATUS_DESCRIPTIONS: Record<string, string> = {
  'pending': 'Order is pending confirmation',
  'confirmed': 'Order has been confirmed and payment processed',
  'preparing': 'Order is being prepared in the kitchen',
  'ready': 'Order is ready for delivery',
  'delivered': 'Order has been delivered to the student',
  'completed': 'Order has been completed successfully',
  'cancelled': 'Order has been cancelled'
};

/**
 * Validate order exists and user has permission to update
 */
async function validateOrderAccess(orderId: string, userId: string): Promise<any> {
  const database = DatabaseService.getInstance();
  
  const result = await database.query(`
    SELECT o.id, o.orderNumber, o.studentId, o.schoolId, o.status, o.paymentStatus,
           s.parentId, st.firstName, st.lastName
    FROM orders o
    LEFT JOIN users s ON o.studentId = s.id
    LEFT JOIN users st ON o.studentId = st.id
    WHERE o.id = $1
  `, [orderId]);
  
  const order = result.rows[0];
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  // Check if user has permission to update this order
  const canUpdate = order.studentId === userId || // Student themselves
                    order.parentId === userId;     // Parent of student
  
  if (!canUpdate) {
    // Check if user is school staff with access
    const staffAccessResult = await database.query(`
      SELECT id, role FROM users 
      WHERE id = $1 AND schoolId = $2 AND role IN ('school_admin', 'admin', 'super_admin', 'staff', 'kitchen_staff') AND isActive = true
    `, [userId, order.schoolId]);
    
    if (staffAccessResult.rows.length === 0) {
      throw new Error('Not authorized to update this order');
    }
  }
  
  return order;
}

/**
 * Validate status transition
 */
function validateStatusTransition(currentStatus: string, newStatus: string): void {
  const validStatuses = Object.keys(ORDER_STATUS_TRANSITIONS);
  
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status '${newStatus}'. Valid statuses: ${validStatuses.join(', ')}`);
  }
  
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from '${currentStatus}' to '${newStatus}'. ` +
      `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
    );
  }
}

/**
 * Create status history entry
 */
async function createStatusHistory(
  orderId: string,
  status: string,
  notes: string | undefined,
  updatedBy: string
): Promise<any> {
  const database = DatabaseService.getInstance();
  const historyId = uuidv4();
  
  try {
    const result = await database.query(`
      INSERT INTO order_status_history (
        id, orderId, status, notes, updatedBy, createdAt
      ) VALUES (
        $1, $2, $3, $4, $5, NOW()
      ) RETURNING *
    `, [historyId, orderId, status, notes, updatedBy]);
    
    return result.rows[0];
  } catch (error) {
    // If order_status_history table doesn't exist, log the status change
    logger.warn('Order status history table not available, logging status change', {
      orderId,
      status,
      notes,
      updatedBy,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return {
      id: historyId,
      orderId,
      status,
      notes,
      updatedBy,
      createdAt: new Date()
    };
  }
}

/**
 * Get order status history
 */
async function getStatusHistory(orderId: string): Promise<any[]> {
  const database = DatabaseService.getInstance();
  
  try {
    const result = await database.query(`
      SELECT id, status, notes, updatedBy, createdAt as timestamp
      FROM order_status_history
      WHERE orderId = $1
      ORDER BY createdAt DESC
      LIMIT 10
    `, [orderId]);
    
    return result.rows;
  } catch (error) {
    logger.warn('Order status history table not available', { orderId });
    return [];
  }
}

/**
 * Update payment status if order is confirmed
 */
async function updatePaymentStatusIfNeeded(orderId: string, newStatus: string): Promise<void> {
  const database = DatabaseService.getInstance();
  
  if (newStatus === 'confirmed') {
    try {
      await database.query(`
        UPDATE orders 
        SET paymentStatus = 'paid'
        WHERE id = $1 AND paymentStatus = 'pending'
      `, [orderId]);
      
      logger.info('Payment status updated to paid for confirmed order', { orderId });
    } catch (error) {
      logger.warn('Failed to update payment status', { 
        orderId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
}

/**
 * Send status update notification
 */
async function sendStatusNotification(
  orderId: string,
  orderNumber: string,
  newStatus: string,
  studentName: string
): Promise<void> {
  try {
    // TODO: Integrate with notification service
    const statusMessage = STATUS_DESCRIPTIONS[newStatus] || `Order status updated to ${newStatus}`;
    
    logger.info('Order status notification should be sent', {
      orderId,
      orderNumber,
      newStatus,
      studentName,
      message: statusMessage
    });
    
    // In production, integrate with:
    // - Email service
    // - SMS service
    // - WhatsApp service
    // - Push notification service
    
  } catch (error) {
    logger.error('Failed to send status notification', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId,
      newStatus
    });
    // Don't fail status update if notification fails
  }
}

/**
 * Update Order Status Lambda Function Handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.logFunctionStart('updateOrderStatusHandler', { event, context });

  try {
    // Only allow PUT method
    if (event.httpMethod !== 'PUT') {
      return createErrorResponse(
        'Method not allowed',
        405,
        'METHOD_NOT_ALLOWED'
      );
    }

    // Extract orderId from path parameters
    const orderId = event.pathParameters?.orderId;
    if (!orderId) {
      return createErrorResponse(
        'Missing orderId in path parameters',
        400,
        'MISSING_ORDER_ID'
      );
    }

    // Parse request body
    const body: UpdateOrderStatusRequest = JSON.parse(event.body || '{}');
    logger.info('Processing order status update request', { orderId, body });

    // Validate required fields
    const { status, notes, reason } = body;

    if (!status) {
      return createErrorResponse(
        'Missing required field: status',
        400,
        'MISSING_STATUS'
      );
    }

    // Extract userId from event context (would come from JWT in real implementation)
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse(
        'User authentication required',
        401,
        'AUTHENTICATION_REQUIRED'
      );
    }

    // Validate order exists and user has permission
    const order = await validateOrderAccess(orderId, userId);
    const currentStatus = order.status;
    
    // Check if status is actually changing
    if (currentStatus === status) {
      return createErrorResponse(
        `Order is already in '${status}' status`,
        400,
        'STATUS_UNCHANGED'
      );
    }

    // Validate status transition
    validateStatusTransition(currentStatus, status);

    // Update order status in database
    const database = DatabaseService.getInstance();
    
    // Begin transaction
    await database.query('BEGIN');

    try {
      // Update order status
      const updateResult = await database.query(`
        UPDATE orders 
        SET status = $1, updatedAt = NOW()
        WHERE id = $2
        RETURNING *
      `, [status, orderId]);

      const updatedOrder = updateResult.rows[0];

      // Create status history entry
      const statusHistoryEntry = await createStatusHistory(
        orderId,
        status,
        notes || reason,
        userId
      );

      // Update payment status if needed
      await updatePaymentStatusIfNeeded(orderId, status);

      // Commit transaction
      await database.query('COMMIT');

      // Get complete status history
      const statusHistory = await getStatusHistory(orderId);

      // Send notification
      await sendStatusNotification(
        orderId,
        order.orderNumber,
        status,
        `${order.firstName} ${order.lastName}`
      );

      const response: OrderStatusResponse = {
        orderId: orderId,
        orderNumber: order.orderNumber,
        previousStatus: currentStatus,
        newStatus: status,
        statusHistory: statusHistory,
        updatedBy: userId,
        updatedAt: updatedOrder.updatedAt
      };

      const duration = Date.now() - startTime;
      logger.logFunctionEnd("handler", { statusCode: 200, duration });
      logger.info('Order status updated successfully', {
        orderId: orderId,
        orderNumber: order.orderNumber,
        previousStatus: currentStatus,
        newStatus: status,
        updatedBy: userId
      });

      return createSuccessResponse({
        data: {
          orderStatus: response
        },
        message: `Order status updated from '${currentStatus}' to '${status}'`
      });

    } catch (transactionError) {
      // Rollback transaction on error
      await database.query('ROLLBACK');
      throw transactionError;
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logFunctionEnd("handler", { statusCode: 500, duration });
    return handleError(error, 'Failed to update order status');
  }
};