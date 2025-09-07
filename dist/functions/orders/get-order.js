"use strict";
/**
 * Get Order Details Lambda Function
 * Handles: GET /orders/{orderId}
 * Implements Epic 3: Order Processing System - Order Retrieval
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const database_service_1 = require("@/services/database.service");
/**
 * Validate order exists and user has permission to view
 */
async function validateOrderAccess(orderId, userId) {
    const database = database_service_1.DatabaseService.getInstance();
    const result = await database.query(`
    SELECT o.id, o.studentId, o.schoolId, o.status, s.parentId,
           st.firstName as student_firstName, st.lastName as student_lastName,
           st.grade, st.section, st.schoolId as student_schoolId,
           sc.name as school_name, sc.address as school_address
    FROM orders o
    LEFT JOIN users s ON o.studentId = s.id
    LEFT JOIN users st ON o.studentId = st.id
    LEFT JOIN schools sc ON o.schoolId = sc.id
    WHERE o.id = $1
  `, [orderId]);
    const order = result.rows[0];
    if (!order) {
        throw new Error('Order not found');
    }
    // Check if user has permission to view this order
    const canView = order.studentId === userId || // Student themselves
        order.parentId === userId; // Parent of student
    if (!canView) {
        // Check if user is school staff with access
        const staffAccessResult = await database.query(`
      SELECT id FROM users 
      WHERE id = $1 AND schoolId = $2 AND role IN ('school_admin', 'admin', 'super_admin', 'staff') AND isActive = true
    `, [userId, order.schoolId]);
        if (staffAccessResult.rows.length === 0) {
            throw new Error('Not authorized to view this order');
        }
    }
    return order;
}
/**
 * Get comprehensive order details
 */
async function getOrderDetails(orderId) {
    const database = database_service_1.DatabaseService.getInstance();
    const result = await database.query(`
    SELECT o.*, 
           s.firstName as student_firstName, s.lastName as student_lastName, 
           s.grade, s.section,
           sc.name as school_name, sc.address as school_address
    FROM orders o
    LEFT JOIN users s ON o.studentId = s.id
    LEFT JOIN schools sc ON o.schoolId = sc.id
    WHERE o.id = $1
  `, [orderId]);
    const order = result.rows[0];
    if (!order) {
        throw new Error('Order not found');
    }
    return order;
}
/**
 * Get order items with menu details
 */
async function getOrderItems(orderId) {
    const database = database_service_1.DatabaseService.getInstance();
    const result = await database.query(`
    SELECT oi.*, 
           mi.name as menuItemName, mi.nutritionalInfo, mi.allergens,
           mi.ingredients, mi.preparationTime
    FROM order_items oi
    LEFT JOIN menu_items mi ON oi.menuItemId = mi.id
    WHERE oi.orderId = $1
    ORDER BY oi.createdAt
  `, [orderId]);
    return result.rows.map(item => ({
        id: item.id,
        menuItemId: item.menuItemId,
        menuItemName: item.menuItemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        specialInstructions: item.specialInstructions,
        customizations: parseJsonField(item.customizations, 'customizations', orderId),
        nutritionalInfo: parseJsonField(item.nutritionalInfo, 'nutritionalInfo', orderId),
        allergens: item.allergens || [],
        ingredients: item.ingredients || [],
        preparationTime: item.preparationTime
    }));
}
/**
 * Get order tracking history
 */
async function getOrderTrackingHistory(orderId) {
    const database = database_service_1.DatabaseService.getInstance();
    try {
        const result = await database.query(`
      SELECT id, orderId, status, notes, updatedBy, createdAt as timestamp
      FROM order_status_history
      WHERE orderId = $1
      ORDER BY createdAt DESC
    `, [orderId]);
        return result.rows;
    }
    catch (error) {
        // If order_status_history table doesn't exist, return basic history
        logger_1.logger.warn('Order status history table not available, using basic tracking', { orderId });
        const orderResult = await database.query(`
      SELECT status, updatedAt, createdAt
      FROM orders
      WHERE id = $1
    `, [orderId]);
        const order = orderResult.rows[0];
        if (!order)
            return [];
        return [
            {
                id: `${orderId}-created`,
                status: 'pending',
                timestamp: order.createdAt,
                notes: 'Order created'
            },
            {
                id: `${orderId}-current`,
                status: order.status,
                timestamp: order.updatedAt,
                notes: `Order status: ${order.status}`
            }
        ];
    }
}
/**
 * Get payment details for the order
 */
async function getPaymentDetails(orderId) {
    const database = database_service_1.DatabaseService.getInstance();
    try {
        const result = await database.query(`
      SELECT po.id as paymentOrderId, po.razorpayOrderId, po.status, po.paidAt,
             pt.razorpayPaymentId, pt.capturedAt
      FROM payment_orders po
      LEFT JOIN payment_transactions pt ON po.id = pt.paymentOrderId
      WHERE po.orderId = $1
      ORDER BY po.createdAt DESC
      LIMIT 1
    `, [orderId]);
        if (result.rows.length === 0) {
            return null;
        }
        const payment = result.rows[0];
        return {
            paymentOrderId: payment.paymentOrderId,
            razorpayOrderId: payment.razorpayOrderId,
            paymentMethod: payment.razorpayPaymentId ? 'razorpay' : 'pending',
            status: payment.status,
            paidAt: payment.paidAt || payment.capturedAt
        };
    }
    catch (error) {
        logger_1.logger.warn('Payment details not available', { orderId, error: error instanceof Error ? error.message : 'Unknown error' });
        return null;
    }
}
/**
 * Get delivery details including RFID verification
 */
async function getDeliveryDetails(orderId, status) {
    const database = database_service_1.DatabaseService.getInstance();
    try {
        const result = await database.query(`
      SELECT deliveredAt, deliveredBy, rfidVerified, deliveryNotes
      FROM order_deliveries
      WHERE orderId = $1
      ORDER BY createdAt DESC
      LIMIT 1
    `, [orderId]);
        if (result.rows.length === 0) {
            // Return estimated delivery time based on order status
            if (['confirmed', 'preparing', 'ready'].includes(status)) {
                const estimatedTime = new Date();
                estimatedTime.setHours(estimatedTime.getHours() + 2); // 2 hours from now
                return {
                    estimatedDeliveryTime: estimatedTime,
                    actualDeliveryTime: null,
                    deliveredBy: null,
                    rfidVerified: false
                };
            }
            return null;
        }
        const delivery = result.rows[0];
        return {
            estimatedDeliveryTime: null,
            actualDeliveryTime: delivery.deliveredAt,
            deliveredBy: delivery.deliveredBy,
            rfidVerified: delivery.rfidVerified || false,
            deliveryNotes: delivery.deliveryNotes
        };
    }
    catch (error) {
        logger_1.logger.warn('Delivery details not available', { orderId, error: error instanceof Error ? error.message : 'Unknown error' });
        return null;
    }
}
/**
 * Parse JSON fields safely
 */
function parseJsonField(jsonString, fieldName, orderId) {
    if (!jsonString)
        return {};
    try {
        return JSON.parse(jsonString);
    }
    catch (error) {
        logger_1.logger.warn(`Failed to parse ${fieldName} for order ${orderId}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            jsonString
        });
        return {};
    }
}
/**
 * Get Order Details Lambda Function Handler
 */
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('getOrderHandler', { event, context });
    try {
        // Only allow GET method
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        // Extract orderId from path parameters
        const orderId = event.pathParameters?.orderId;
        if (!orderId) {
            return (0, response_utils_1.createErrorResponse)('Missing orderId in path parameters', 400, 'MISSING_ORDER_ID');
        }
        // Extract userId from event context (would come from JWT in real implementation)
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('User authentication required', 401, 'AUTHENTICATION_REQUIRED');
        }
        logger_1.logger.info('Processing get order request', { orderId, userId });
        // Validate order exists and user has permission
        await validateOrderAccess(orderId, userId);
        // Get comprehensive order details
        const orderData = await getOrderDetails(orderId);
        const orderItems = await getOrderItems(orderId);
        const trackingHistory = await getOrderTrackingHistory(orderId);
        const paymentDetails = await getPaymentDetails(orderId);
        const deliveryDetails = await getDeliveryDetails(orderId, orderData.status);
        const response = {
            id: orderData.id,
            orderNumber: orderData.orderNumber,
            studentId: orderData.studentId,
            student: {
                id: orderData.studentId,
                firstName: orderData.student_firstName,
                lastName: orderData.student_lastName,
                grade: orderData.grade,
                section: orderData.section
            },
            school: {
                id: orderData.schoolId,
                name: orderData.school_name,
                address: orderData.school_address
            },
            deliveryDate: orderData.deliveryDate,
            mealPeriod: orderData.mealPeriod,
            status: orderData.status,
            paymentStatus: orderData.paymentStatus,
            totalAmount: orderData.totalAmount,
            orderItems: orderItems,
            trackingHistory: trackingHistory,
            paymentDetails: paymentDetails,
            deliveryDetails: deliveryDetails,
            deliveryInstructions: orderData.deliveryInstructions,
            contactPhone: orderData.contactPhone,
            createdAt: orderData.createdAt,
            updatedAt: orderData.updatedAt
        };
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd("handler", { statusCode: 200, duration });
        logger_1.logger.info('Order details retrieved successfully', {
            orderId: orderId,
            itemCount: orderItems.length,
            status: orderData.status
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                order: response
            },
            message: 'Order details retrieved successfully'
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd("handler", { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve order details');
    }
};
exports.handler = handler;
