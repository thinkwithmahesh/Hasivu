"use strict";
/**
 * Update Order Status Lambda Function
 * Handles: PUT /orders/{orderId}/status
 * Implements Epic 3: Order Processing System - Order Status Management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const database_service_1 = require("@/services/database.service");
const uuid_1 = require("uuid");
/**
 * Valid order status transitions
 */
const ORDER_STATUS_TRANSITIONS = {
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
const STATUS_DESCRIPTIONS = {
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
async function validateOrderAccess(orderId, userId) {
    const database = database_service_1.DatabaseService.getInstance();
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
        order.parentId === userId; // Parent of student
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
function validateStatusTransition(currentStatus, newStatus) {
    const validStatuses = Object.keys(ORDER_STATUS_TRANSITIONS);
    if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status '${newStatus}'. Valid statuses: ${validStatuses.join(', ')}`);
    }
    const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
        throw new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'. ` +
            `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`);
    }
}
/**
 * Create status history entry
 */
async function createStatusHistory(orderId, status, notes, updatedBy) {
    const database = database_service_1.DatabaseService.getInstance();
    const historyId = (0, uuid_1.v4)();
    try {
        const result = await database.query(`
      INSERT INTO order_status_history (
        id, orderId, status, notes, updatedBy, createdAt
      ) VALUES (
        $1, $2, $3, $4, $5, NOW()
      ) RETURNING *
    `, [historyId, orderId, status, notes, updatedBy]);
        return result.rows[0];
    }
    catch (error) {
        // If order_status_history table doesn't exist, log the status change
        logger_1.logger.warn('Order status history table not available, logging status change', {
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
async function getStatusHistory(orderId) {
    const database = database_service_1.DatabaseService.getInstance();
    try {
        const result = await database.query(`
      SELECT id, status, notes, updatedBy, createdAt as timestamp
      FROM order_status_history
      WHERE orderId = $1
      ORDER BY createdAt DESC
      LIMIT 10
    `, [orderId]);
        return result.rows;
    }
    catch (error) {
        logger_1.logger.warn('Order status history table not available', { orderId });
        return [];
    }
}
/**
 * Update payment status if order is confirmed
 */
async function updatePaymentStatusIfNeeded(orderId, newStatus) {
    const database = database_service_1.DatabaseService.getInstance();
    if (newStatus === 'confirmed') {
        try {
            await database.query(`
        UPDATE orders 
        SET paymentStatus = 'paid'
        WHERE id = $1 AND paymentStatus = 'pending'
      `, [orderId]);
            logger_1.logger.info('Payment status updated to paid for confirmed order', { orderId });
        }
        catch (error) {
            logger_1.logger.warn('Failed to update payment status', {
                orderId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
/**
 * Send status update notification
 */
async function sendStatusNotification(orderId, orderNumber, newStatus, studentName) {
    try {
        // TODO: Integrate with notification service
        const statusMessage = STATUS_DESCRIPTIONS[newStatus] || `Order status updated to ${newStatus}`;
        logger_1.logger.info('Order status notification should be sent', {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to send status notification', {
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
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('updateOrderStatusHandler', { event, context });
    try {
        // Only allow PUT method
        if (event.httpMethod !== 'PUT') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        // Extract orderId from path parameters
        const orderId = event.pathParameters?.orderId;
        if (!orderId) {
            return (0, response_utils_1.createErrorResponse)('Missing orderId in path parameters', 400, 'MISSING_ORDER_ID');
        }
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        logger_1.logger.info('Processing order status update request', { orderId, body });
        // Validate required fields
        const { status, notes, reason } = body;
        if (!status) {
            return (0, response_utils_1.createErrorResponse)('Missing required field: status', 400, 'MISSING_STATUS');
        }
        // Extract userId from event context (would come from JWT in real implementation)
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('User authentication required', 401, 'AUTHENTICATION_REQUIRED');
        }
        // Validate order exists and user has permission
        const order = await validateOrderAccess(orderId, userId);
        const currentStatus = order.status;
        // Check if status is actually changing
        if (currentStatus === status) {
            return (0, response_utils_1.createErrorResponse)(`Order is already in '${status}' status`, 400, 'STATUS_UNCHANGED');
        }
        // Validate status transition
        validateStatusTransition(currentStatus, status);
        // Update order status in database
        const database = database_service_1.DatabaseService.getInstance();
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
            const statusHistoryEntry = await createStatusHistory(orderId, status, notes || reason, userId);
            // Update payment status if needed
            await updatePaymentStatusIfNeeded(orderId, status);
            // Commit transaction
            await database.query('COMMIT');
            // Get complete status history
            const statusHistory = await getStatusHistory(orderId);
            // Send notification
            await sendStatusNotification(orderId, order.orderNumber, status, `${order.firstName} ${order.lastName}`);
            const response = {
                orderId: orderId,
                orderNumber: order.orderNumber,
                previousStatus: currentStatus,
                newStatus: status,
                statusHistory: statusHistory,
                updatedBy: userId,
                updatedAt: updatedOrder.updatedAt
            };
            const duration = Date.now() - startTime;
            logger_1.logger.logFunctionEnd("handler", { statusCode: 200, duration });
            logger_1.logger.info('Order status updated successfully', {
                orderId: orderId,
                orderNumber: order.orderNumber,
                previousStatus: currentStatus,
                newStatus: status,
                updatedBy: userId
            });
            return (0, response_utils_1.createSuccessResponse)({
                data: {
                    orderStatus: response
                },
                message: `Order status updated from '${currentStatus}' to '${status}'`
            });
        }
        catch (transactionError) {
            // Rollback transaction on error
            await database.query('ROLLBACK');
            throw transactionError;
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd("handler", { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Failed to update order status');
    }
};
exports.handler = handler;
