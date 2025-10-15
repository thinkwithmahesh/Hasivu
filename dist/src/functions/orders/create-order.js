"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const DatabaseManager_1 = require("@/database/DatabaseManager");
const uuid_1 = require("uuid");
async function validateStudent(studentId, userId) {
    const student = await DatabaseManager_1.prisma.user.findUnique({
        where: { id: studentId },
        include: {
            school: {
                select: {
                    id: true,
                    name: true,
                    isActive: true,
                },
            },
        },
    });
    if (!student) {
        throw new Error('Student not found');
    }
    if (!student.isActive) {
        throw new Error('Student account is not active');
    }
    if (!student.school?.isActive) {
        throw new Error('School is not active');
    }
    if (student.parentId !== userId && student.id !== userId) {
        const adminUser = await DatabaseManager_1.prisma.user.findFirst({
            where: {
                id: userId,
                schoolId: student.schoolId,
                role: { in: ['school_admin', 'admin', 'super_admin', 'staff'] },
                isActive: true,
            },
        });
        if (!adminUser) {
            throw new Error('Not authorized to place orders for this student');
        }
    }
    return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        parentId: student.parentId,
        schoolId: student.schoolId,
        school: student.school,
    };
}
function validateDeliveryDate(deliveryDate) {
    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const maxFutureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (deliveryDate < minDate) {
        throw new Error('Delivery date must be at least 24 hours in advance');
    }
    if (deliveryDate > maxFutureDate) {
        throw new Error('Delivery date cannot be more than 30 days in advance');
    }
    const dayOfWeek = deliveryDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        throw new Error('Delivery is not available on weekends');
    }
}
async function validateOrderItems(orderItems, schoolId, deliveryDate) {
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
        const menuItem = await DatabaseManager_1.prisma.menuItem.findFirst({
            where: {
                id: item.menuItemId,
                schoolId,
                available: true,
            },
        });
        if (!menuItem) {
            throw new Error(`Menu item not found: ${item.menuItemId}`);
        }
        const deliveryDayName = deliveryDate
            .toLocaleDateString('en-US', { weekday: 'long' })
            .toLowerCase();
        const unitPrice = Number(menuItem.price);
        const itemTotal = unitPrice * item.quantity;
        totalAmount += itemTotal;
        validatedItems.push({
            menuItemId: item.menuItemId,
            menuItemName: menuItem.name,
            quantity: item.quantity,
            unitPrice,
            totalPrice: itemTotal,
            specialInstructions: item.specialInstructions,
            customizations: item.customizations,
        });
    }
    return { validatedItems, totalAmount };
}
function generateOrderNumber() {
    const now = new Date();
    const dateString = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeString = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD${dateString}${timeString}${random}`;
}
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('createOrderHandler', { event, context });
    try {
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const body = JSON.parse(event.body || '{}');
        logger_1.logger.info('Processing create order request', { body });
        const { studentId, deliveryDate, orderItems, deliveryInstructions, contactPhone, specialInstructions, allergyInfo, } = body;
        if (!studentId || !deliveryDate || !orderItems) {
            return (0, response_utils_1.createErrorResponse)('MISSING_REQUIRED_FIELDS', 'Missing required fields: studentId, deliveryDate, orderItems', 400);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
        }
        const student = await validateStudent(studentId, userId);
        const parsedDeliveryDate = new Date(deliveryDate);
        if (isNaN(parsedDeliveryDate.getTime())) {
            return (0, response_utils_1.createErrorResponse)('INVALID_DATE_FORMAT', 'Invalid delivery date format', 400);
        }
        validateDeliveryDate(parsedDeliveryDate);
        const { validatedItems, totalAmount } = await validateOrderItems(orderItems, student.schoolId, parsedDeliveryDate);
        const orderId = (0, uuid_1.v4)();
        const orderNumber = generateOrderNumber();
        const result = await DatabaseManager_1.DatabaseManager.getInstance().transaction(async (prisma) => {
            const order = await prisma.order.create({
                data: {
                    id: orderId,
                    orderNumber,
                    userId,
                    studentId,
                    schoolId: student.schoolId,
                    status: 'pending',
                    totalAmount,
                    currency: 'INR',
                    orderDate: new Date(),
                    deliveryDate: parsedDeliveryDate,
                    paymentStatus: 'pending',
                    specialInstructions: body.specialInstructions,
                    allergyInfo: body.allergyInfo,
                    metadata: JSON.stringify({}),
                },
            });
            const orderItemPromises = validatedItems.map(async (item) => {
                const orderItemId = (0, uuid_1.v4)();
                return prisma.orderItem.create({
                    data: {
                        id: orderItemId,
                        orderId,
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                        customizations: JSON.stringify(item.customizations || {}),
                        notes: item.specialInstructions,
                    },
                });
            });
            const createdOrderItems = await Promise.all(orderItemPromises);
            return { order, orderItems: createdOrderItems, validatedItems };
        });
        const response = {
            id: result.order.id,
            orderNumber: result.order.orderNumber,
            studentId,
            student: {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                schoolId: student.schoolId,
            },
            school: student.school,
            deliveryDate: parsedDeliveryDate.toISOString().split('T')[0],
            status: 'pending',
            paymentStatus: 'pending',
            totalAmount,
            orderItems: result.orderItems.map((item, index) => ({
                id: item.id,
                menuItemId: item.menuItemId,
                menuItemName: result.validatedItems[index].menuItemName,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
                customizations: result.validatedItems[index].customizations,
            })),
            deliveryInstructions: body.deliveryInstructions,
            contactPhone: body.contactPhone,
            createdAt: result.order.createdAt,
        };
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('handler', { statusCode: 201, duration });
        logger_1.logger.info('Order created successfully', {
            orderId: result.order.id,
            orderNumber: result.order.orderNumber,
            totalAmount,
            itemCount: orderItems.length,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                order: response,
            },
            message: 'Order created successfully',
        }, 201);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('handler', { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Failed to create order');
    }
};
exports.handler = handler;
//# sourceMappingURL=create-order.js.map