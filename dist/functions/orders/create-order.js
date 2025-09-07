"use strict";
/**
 * Create Meal Order Lambda Function
 * Handles: POST /orders
 * Implements Epic 3: Order Processing System - Meal Order Creation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const database_service_1 = require("@/services/database.service");
const uuid_1 = require("uuid");
/**
 * Validate student exists and is active
 */
async function validateStudent(studentId, userId) {
    const database = database_service_1.DatabaseService.getInstance();
    const result = await database.query(`
    SELECT s.id, s.firstName, s.lastName, s.parentId, s.schoolId, s.isActive,
           sc.id as school_id, sc.name as school_name, sc.isActive as school_active
    FROM users s
    LEFT JOIN schools sc ON s.schoolId = sc.id
    WHERE s.id = $1
  `, [studentId]);
    const student = result.rows[0];
    if (!student) {
        throw new Error('Student not found');
    }
    if (!student.isActive) {
        throw new Error('Student account is not active');
    }
    if (!student.school_active) {
        throw new Error('School is not active');
    }
    // Check if user is the parent or authorized to place orders for this student
    if (student.parentId !== userId && student.id !== userId) {
        // Check if user has school admin access
        const adminAccessResult = await database.query(`
      SELECT id FROM users 
      WHERE id = $1 AND schoolId = $2 AND role IN ('school_admin', 'admin', 'super_admin', 'staff') AND isActive = true
    `, [userId, student.schoolId]);
        if (adminAccessResult.rows.length === 0) {
            throw new Error('Not authorized to place orders for this student');
        }
    }
    return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        parentId: student.parentId,
        schoolId: student.schoolId,
        school: {
            id: student.school_id,
            name: student.school_name
        }
    };
}
/**
 * Validate delivery date
 */
function validateDeliveryDate(deliveryDate) {
    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    const maxFutureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    if (deliveryDate < minDate) {
        throw new Error('Delivery date must be at least 24 hours in advance');
    }
    if (deliveryDate > maxFutureDate) {
        throw new Error('Delivery date cannot be more than 30 days in advance');
    }
    // Check if delivery date is a weekend (schools typically closed)
    const dayOfWeek = deliveryDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        throw new Error('Delivery is not available on weekends');
    }
}
/**
 * Validate order items and calculate total
 */
async function validateOrderItems(orderItems, schoolId, deliveryDate, mealPeriod) {
    const database = database_service_1.DatabaseService.getInstance();
    if (orderItems.length === 0) {
        throw new Error('Order must contain at least one item');
    }
    if (orderItems.length > 20) {
        throw new Error('Maximum 20 items allowed per order');
    }
    const validatedItems = [];
    let totalAmount = 0;
    for (const item of orderItems) {
        if (!item.quantity || item.quantity <= 0) {
            throw new Error('Item quantity must be greater than 0');
        }
        if (item.quantity > 10) {
            throw new Error('Maximum 10 quantity allowed per item');
        }
        // Get menu item with availability check
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
        if (!menuItem.isActive) {
            throw new Error(`Menu item is not available: ${menuItem.name}`);
        }
        // Check if menu item is available on delivery date
        const deliveryDayName = deliveryDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (menuItem.availableDays && !menuItem.availableDays.includes(deliveryDayName)) {
            throw new Error(`${menuItem.name} is not available on ${deliveryDayName}`);
        }
        // Check maximum order quantity
        if (menuItem.maxOrderQuantity && item.quantity > menuItem.maxOrderQuantity) {
            throw new Error(`Maximum ${menuItem.maxOrderQuantity} items allowed per order for ${menuItem.name}`);
        }
        const itemTotal = menuItem.price * item.quantity;
        totalAmount += itemTotal;
        validatedItems.push({
            menuItemId: item.menuItemId,
            menuItemName: menuItem.name,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            totalPrice: itemTotal,
            specialInstructions: item.specialInstructions,
            customizations: item.customizations
        });
    }
    return { validatedItems, totalAmount };
}
/**
 * Generate unique order number
 */
function generateOrderNumber() {
    const now = new Date();
    const dateString = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeString = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD${dateString}${timeString}${random}`;
}
/**
 * Create Meal Order Lambda Function Handler
 */
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('createOrderHandler', { event, context });
    try {
        // Only allow POST method
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        logger_1.logger.info('Processing create order request', { body });
        // Validate required fields
        const { studentId, deliveryDate, mealPeriod, orderItems, deliveryInstructions, contactPhone } = body;
        if (!studentId || !deliveryDate || !mealPeriod || !orderItems) {
            return (0, response_utils_1.createErrorResponse)('Missing required fields: studentId, deliveryDate, mealPeriod, orderItems', 400, 'MISSING_REQUIRED_FIELDS');
        }
        if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealPeriod)) {
            return (0, response_utils_1.createErrorResponse)('Invalid meal period. Must be one of: breakfast, lunch, dinner, snack', 400, 'INVALID_MEAL_PERIOD');
        }
        // Extract userId from event context (would come from JWT in real implementation)
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('User authentication required', 401, 'AUTHENTICATION_REQUIRED');
        }
        // Validate student and get student/school details
        const student = await validateStudent(studentId, userId);
        // Parse and validate delivery date
        const parsedDeliveryDate = new Date(deliveryDate);
        if (isNaN(parsedDeliveryDate.getTime())) {
            return (0, response_utils_1.createErrorResponse)('Invalid delivery date format', 400, 'INVALID_DATE_FORMAT');
        }
        validateDeliveryDate(parsedDeliveryDate);
        // Validate order items and calculate total
        const { validatedItems, totalAmount } = await validateOrderItems(orderItems, student.schoolId, parsedDeliveryDate, mealPeriod);
        // Create order in database
        const database = database_service_1.DatabaseService.getInstance();
        const orderId = (0, uuid_1.v4)();
        const orderNumber = generateOrderNumber();
        // Begin transaction
        await database.query('BEGIN');
        try {
            // Create main order record
            const orderResult = await database.query(`
        INSERT INTO orders (
          id, orderNumber, studentId, schoolId, deliveryDate, mealPeriod,
          status, paymentStatus, totalAmount, deliveryInstructions,
          contactPhone, createdBy, createdAt, updatedAt
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        ) RETURNING *
      `, [
                orderId,
                orderNumber,
                studentId,
                student.schoolId,
                parsedDeliveryDate.toISOString().split('T')[0],
                mealPeriod,
                'pending',
                'pending',
                totalAmount,
                deliveryInstructions,
                contactPhone,
                userId
            ]);
            const order = orderResult.rows[0];
            // Create order items
            const orderItemPromises = validatedItems.map(async (item, index) => {
                const orderItemId = (0, uuid_1.v4)();
                return database.query(`
          INSERT INTO order_items (
            id, orderId, menuItemId, quantity, unitPrice, totalPrice,
            specialInstructions, customizations, createdAt, updatedAt
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
          ) RETURNING *
        `, [
                    orderItemId,
                    orderId,
                    item.menuItemId,
                    item.quantity,
                    item.unitPrice,
                    item.totalPrice,
                    item.specialInstructions,
                    JSON.stringify(item.customizations || {})
                ]);
            });
            const orderItemResults = await Promise.all(orderItemPromises);
            const createdOrderItems = orderItemResults.map((result, index) => ({
                id: result.rows[0].id,
                ...validatedItems[index]
            }));
            // Commit transaction
            await database.query('COMMIT');
            const response = {
                id: orderId,
                orderNumber: orderNumber,
                studentId: studentId,
                student: {
                    id: student.id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    schoolId: student.schoolId
                },
                school: student.school,
                deliveryDate: parsedDeliveryDate.toISOString().split('T')[0],
                mealPeriod: mealPeriod,
                status: 'pending',
                paymentStatus: 'pending',
                totalAmount: totalAmount,
                orderItems: createdOrderItems,
                deliveryInstructions: deliveryInstructions,
                contactPhone: contactPhone,
                createdAt: order.createdAt
            };
            const duration = Date.now() - startTime;
            logger_1.logger.logFunctionEnd("handler", { statusCode: 201, duration });
            logger_1.logger.info('Order created successfully', {
                orderId: orderId,
                orderNumber: orderNumber,
                totalAmount: totalAmount,
                itemCount: orderItems.length
            });
            return (0, response_utils_1.createSuccessResponse)({
                data: {
                    order: response
                },
                message: 'Order created successfully'
            }, 201);
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
        return (0, response_utils_1.handleError)(error, 'Failed to create order');
    }
};
exports.handler = handler;
