"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const database_service_1 = require("@/shared/database.service");
const uuid_1 = require("uuid");
const ORDER_STATUS_TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['delivered', 'cancelled'],
    delivered: ['completed'],
    completed: [],
    cancelled: [],
};
const STATUS_DESCRIPTIONS = {
    pending: 'Order is pending confirmation',
    confirmed: 'Order has been confirmed and payment processed',
    preparing: 'Order is being prepared in the kitchen',
    ready: 'Order is ready for delivery',
    delivered: 'Order has been delivered to the student',
    completed: 'Order has been completed successfully',
    cancelled: 'Order has been cancelled',
};
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
    const canUpdate = order.studentId === userId ||
        order.parentId === userId;
    if (!canUpdate) {
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
        logger_1.logger.warn('Order status history table not available, logging status change', {
            orderId,
            status,
            notes,
            updatedBy,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
        return {
            id: historyId,
            orderId,
            status,
            notes,
            updatedBy,
            createdAt: new Date(),
        };
    }
}
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
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}
async function sendStatusNotification(orderId, orderNumber, newStatus, studentName) {
    try {
        const statusMessage = STATUS_DESCRIPTIONS[newStatus] || `Order status updated to ${newStatus}`;
        logger_1.logger.info('Order status notification should be sent', {
            orderId,
            orderNumber,
            newStatus,
            studentName,
            message: statusMessage,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to send status notification', error instanceof Error ? error : undefined, {
            orderId,
            newStatus,
        });
    }
}
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('updateOrderStatusHandler', { event, context });
    try {
        if (event.httpMethod !== 'PUT') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const orderId = event.pathParameters?.orderId;
        if (!orderId) {
            return (0, response_utils_1.createErrorResponse)('MISSING_ORDER_ID', 'Missing orderId in path parameters', 400);
        }
        const body = JSON.parse(event.body || '{}');
        logger_1.logger.info('Processing order status update request', { orderId, body });
        const { status, notes, reason } = body;
        if (!status) {
            return (0, response_utils_1.createErrorResponse)('MISSING_STATUS', 'Missing required field: status', 400);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
        }
        const order = await validateOrderAccess(orderId, userId);
        const currentStatus = order.status;
        if (currentStatus === status) {
            return (0, response_utils_1.createErrorResponse)('STATUS_UNCHANGED', `Order is already in '${status}' status`, 400);
        }
        validateStatusTransition(currentStatus, status);
        const database = database_service_1.DatabaseService.getInstance();
        await database.query('BEGIN');
        try {
            const updateResult = await database.query(`
        UPDATE orders 
        SET status = $1, updatedAt = NOW()
        WHERE id = $2
        RETURNING *
      `, [status, orderId]);
            const updatedOrder = updateResult.rows[0];
            const statusHistoryEntry = await createStatusHistory(orderId, status, notes || reason, userId);
            await updatePaymentStatusIfNeeded(orderId, status);
            await database.query('COMMIT');
            const statusHistory = await getStatusHistory(orderId);
            await sendStatusNotification(orderId, order.orderNumber, status, `${order.firstName} ${order.lastName}`);
            const response = {
                orderId,
                orderNumber: order.orderNumber,
                previousStatus: currentStatus,
                newStatus: status,
                statusHistory,
                updatedBy: userId,
                updatedAt: updatedOrder.updatedAt,
            };
            const duration = Date.now() - startTime;
            logger_1.logger.logFunctionEnd('handler', { statusCode: 200, duration });
            logger_1.logger.info('Order status updated successfully', {
                orderId,
                orderNumber: order.orderNumber,
                previousStatus: currentStatus,
                newStatus: status,
                updatedBy: userId,
            });
            return (0, response_utils_1.createSuccessResponse)({
                data: {
                    orderStatus: response,
                },
                message: `Order status updated from '${currentStatus}' to '${status}'`,
            });
        }
        catch (transactionError) {
            await database.query('ROLLBACK');
            throw transactionError;
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('handler', { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Failed to update order status');
    }
};
exports.handler = handler;
//# sourceMappingURL=update-status.js.map