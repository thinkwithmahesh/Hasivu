"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const database_service_1 = require("@/shared/database.service");
async function validateOrderAccess(orderId, userId) {
    const database = database_service_1.DatabaseService.getInstance();
    const result = await database.query(`
    SELECT o.id, o.orderNumber, o.studentId, o.schoolId, o.status, o.paymentStatus,
           o.deliveryDate, o.totalAmount, s.parentId,
           st.firstName, st.lastName
    FROM orders o
    LEFT JOIN users s ON o.studentId = s.id
    LEFT JOIN users st ON o.studentId = st.id
    WHERE o.id = $1
  `, [orderId]);
    const order = result.rows[0];
    if (!order) {
        throw new Error('Order not found');
    }
    if (['delivered', 'completed', 'cancelled'].includes(order.status)) {
        throw new Error(`Cannot modify order with status: ${order.status}`);
    }
    if (order.paymentStatus === 'paid') {
        throw new Error('Cannot modify order after payment is processed');
    }
    const canUpdate = order.studentId === userId ||
        order.parentId === userId;
    if (!canUpdate) {
        const staffAccessResult = await database.query(`
      SELECT id, role FROM users 
      WHERE id = $1 AND schoolId = $2 AND role IN ('school_admin', 'admin', 'super_admin', 'staff') AND isActive = true
    `, [userId, order.schoolId]);
        if (staffAccessResult.rows.length === 0) {
            throw new Error('Not authorized to update this order');
        }
    }
    return order;
}
function validateDeliveryDate(deliveryDate, currentDeliveryDate) {
    const now = new Date();
    const minDate = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const maxFutureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (deliveryDate < minDate) {
        throw new Error('Delivery date must be at least 12 hours in advance');
    }
    if (deliveryDate > maxFutureDate) {
        throw new Error('Delivery date cannot be more than 30 days in advance');
    }
    const dayOfWeek = deliveryDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        throw new Error('Delivery is not available on weekends');
    }
    const currentDate = new Date(currentDeliveryDate);
    if (deliveryDate < currentDate && currentDate > now) {
        throw new Error('Cannot change delivery date to an earlier date');
    }
}
async function validateOrderItemUpdates(orderItems, schoolId, deliveryDate, mealPeriod) {
    const database = database_service_1.DatabaseService.getInstance();
    if (!orderItems || orderItems.length === 0) {
        return { validatedItems: [], totalAmountChange: 0 };
    }
    const validatedItems = [];
    let totalAmountChange = 0;
    for (const item of orderItems) {
        if (item.action === 'remove') {
            if (!item.id) {
                throw new Error('Item ID required for remove action');
            }
            const currentItemResult = await database.query(`
        SELECT totalPrice FROM order_items WHERE id = $1
      `, [item.id]);
            if (currentItemResult.rows.length > 0) {
                totalAmountChange -= parseFloat(currentItemResult.rows[0].totalPrice);
            }
            validatedItems.push({
                id: item.id,
                action: 'remove',
            });
            continue;
        }
        if (!item.quantity || item.quantity <= 0) {
            throw new Error('Item quantity must be greater than 0');
        }
        if (item.quantity > 10) {
            throw new Error('Maximum 10 quantity allowed per item');
        }
        const menuItemResult = await database.query(`
      SELECT id, name, price, schoolId, isActive, 
             availableDays, preparationTime, maxOrderQuantity
      FROM menu_items 
      WHERE id = $1 AND schoolId = $2 AND isActive = true
    `, [item.menuItemId, schoolId]);
        const menuItem = menuItemResult.rows[0];
        if (!menuItem) {
            throw new Error(`Menu item not found: ${item.menuItemId}`);
        }
        const deliveryDayName = deliveryDate
            .toLocaleDateString('en-US', { weekday: 'long' })
            .toLowerCase();
        if (menuItem.availableDays && !menuItem.availableDays.includes(deliveryDayName)) {
            throw new Error(`${menuItem.name} is not available on ${deliveryDayName}`);
        }
        if (menuItem.maxOrderQuantity && item.quantity > menuItem.maxOrderQuantity) {
            throw new Error(`Maximum ${menuItem.maxOrderQuantity} items allowed per order for ${menuItem.name}`);
        }
        const itemTotal = menuItem.price * item.quantity;
        if (item.action === 'add') {
            totalAmountChange += itemTotal;
        }
        else if (item.action === 'update' && item.id) {
            const currentItemResult = await database.query(`
        SELECT totalPrice FROM order_items WHERE id = $1
      `, [item.id]);
            if (currentItemResult.rows.length > 0) {
                const currentTotal = parseFloat(currentItemResult.rows[0].totalPrice);
                totalAmountChange += itemTotal - currentTotal;
            }
            else {
                totalAmountChange += itemTotal;
            }
        }
        validatedItems.push({
            id: item.id,
            menuItemId: item.menuItemId,
            menuItemName: menuItem.name,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            totalPrice: itemTotal,
            specialInstructions: item.specialInstructions,
            customizations: item.customizations,
            action: item.action,
        });
    }
    return { validatedItems, totalAmountChange };
}
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('updateOrderHandler', { event, context });
    try {
        if (event.httpMethod !== 'PUT') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const orderId = event.pathParameters?.orderId;
        if (!orderId) {
            return (0, response_utils_1.createErrorResponse)('MISSING_ORDER_ID', 'Missing orderId in path parameters', 400);
        }
        const body = JSON.parse(event.body || '{}');
        logger_1.logger.info('Processing update order request', { orderId, body });
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
        }
        const order = await validateOrderAccess(orderId, userId);
        const database = database_service_1.DatabaseService.getInstance();
        const updatedFields = [];
        let totalAmountChange = 0;
        const itemsChanged = {
            added: 0,
            updated: 0,
            removed: 0,
        };
        await database.query('BEGIN');
        try {
            if (body.deliveryDate) {
                const newDeliveryDate = new Date(body.deliveryDate);
                if (isNaN(newDeliveryDate.getTime())) {
                    throw new Error('Invalid delivery date format');
                }
                validateDeliveryDate(newDeliveryDate, new Date(order.deliveryDate));
                await database.query(`
          UPDATE orders SET deliveryDate = $1, updatedAt = NOW()
          WHERE id = $2
        `, [newDeliveryDate.toISOString().split('T')[0], orderId]);
                updatedFields.push('deliveryDate');
            }
            if (body.mealPeriod) {
                if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(body.mealPeriod)) {
                    throw new Error('Invalid meal period. Must be one of: breakfast, lunch, dinner, snack');
                }
                await database.query(`
          UPDATE orders SET mealPeriod = $1, updatedAt = NOW()
          WHERE id = $2
        `, [body.mealPeriod, orderId]);
                updatedFields.push('mealPeriod');
            }
            if (body.deliveryInstructions !== undefined) {
                await database.query(`
          UPDATE orders SET deliveryInstructions = $1, updatedAt = NOW()
          WHERE id = $2
        `, [body.deliveryInstructions, orderId]);
                updatedFields.push('deliveryInstructions');
            }
            if (body.contactPhone !== undefined) {
                await database.query(`
          UPDATE orders SET contactPhone = $1, updatedAt = NOW()
          WHERE id = $2
        `, [body.contactPhone, orderId]);
                updatedFields.push('contactPhone');
            }
            if (body.orderItems && body.orderItems.length > 0) {
                const deliveryDate = body.deliveryDate
                    ? new Date(body.deliveryDate)
                    : new Date(order.deliveryDate);
                const mealPeriod = body.mealPeriod || order.mealPeriod;
                const { validatedItems, totalAmountChange: amountChange } = await validateOrderItemUpdates(body.orderItems, order.schoolId, deliveryDate, mealPeriod);
                totalAmountChange = amountChange;
                for (const item of validatedItems) {
                    if (item.action === 'remove') {
                        await database.query(`
              DELETE FROM order_items WHERE id = $1
            `, [item.id]);
                        itemsChanged.removed++;
                    }
                    else if (item.action === 'add') {
                        const { v4: uuidv4 } = require('uuid');
                        const orderItemId = uuidv4();
                        await database.query(`
              INSERT INTO order_items (
                id, orderId, menuItemId, quantity, unitPrice, totalPrice,
                specialInstructions, customizations, createdAt, updatedAt
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
              )
            `, [
                            orderItemId,
                            orderId,
                            item.menuItemId,
                            item.quantity,
                            item.unitPrice,
                            item.totalPrice,
                            item.specialInstructions,
                            JSON.stringify(item.customizations || {}),
                        ]);
                        itemsChanged.added++;
                    }
                    else if (item.action === 'update' && item.id) {
                        await database.query(`
              UPDATE order_items 
              SET quantity = $1, totalPrice = $2, specialInstructions = $3,
                  customizations = $4, updatedAt = NOW()
              WHERE id = $5
            `, [
                            item.quantity,
                            item.totalPrice,
                            item.specialInstructions,
                            JSON.stringify(item.customizations || {}),
                            item.id,
                        ]);
                        itemsChanged.updated++;
                    }
                }
                updatedFields.push('orderItems');
            }
            if (totalAmountChange !== 0) {
                const newTotalAmount = parseFloat(order.totalAmount) + totalAmountChange;
                if (newTotalAmount < 0) {
                    throw new Error('Order total amount cannot be negative');
                }
                await database.query(`
          UPDATE orders SET totalAmount = $1, updatedAt = NOW()
          WHERE id = $2
        `, [newTotalAmount, orderId]);
                updatedFields.push('totalAmount');
            }
            const updatedOrderResult = await database.query(`
        SELECT id, orderNumber, status, paymentStatus, totalAmount, updatedAt
        FROM orders WHERE id = $1
      `, [orderId]);
            const updatedOrder = updatedOrderResult.rows[0];
            await database.query('COMMIT');
            const response = {
                id: orderId,
                orderNumber: updatedOrder.orderNumber,
                status: updatedOrder.status,
                paymentStatus: updatedOrder.paymentStatus,
                totalAmount: parseFloat(updatedOrder.totalAmount),
                itemsChanged,
                updatedFields,
                updatedAt: updatedOrder.updatedAt,
            };
            const duration = Date.now() - startTime;
            logger_1.logger.logFunctionEnd('handler', { statusCode: 200, duration });
            logger_1.logger.info('Order updated successfully', {
                orderId,
                updatedFields,
                itemsChanged,
                totalAmountChange,
            });
            return (0, response_utils_1.createSuccessResponse)({
                data: {
                    order: response,
                },
                message: `Order updated successfully. Fields changed: ${updatedFields.join(', ')}`,
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
        return (0, response_utils_1.handleError)(error, 'Failed to update order');
    }
};
exports.handler = handler;
//# sourceMappingURL=update-order.js.map