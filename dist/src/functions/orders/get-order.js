"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const DatabaseManager_1 = require("@/database/DatabaseManager");
async function getOrderWithAuthorization(orderId, userId) {
    const order = await DatabaseManager_1.prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    grade: true,
                    section: true,
                    parentId: true,
                    schoolId: true,
                },
            },
            school: {
                select: {
                    id: true,
                    name: true,
                    address: true,
                },
            },
            orderItems: {
                include: {
                    menuItem: {
                        select: {
                            id: true,
                            name: true,
                            nutritionalInfo: true,
                            allergens: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
            },
            payments: {
                select: {
                    id: true,
                    status: true,
                    amount: true,
                    razorpayPaymentId: true,
                    paidAt: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 1,
            },
        },
    });
    if (!order) {
        throw new Error('Order not found');
    }
    const canView = order.studentId === userId ||
        order.student.parentId === userId;
    if (!canView) {
        const staffUser = await DatabaseManager_1.prisma.user.findFirst({
            where: {
                id: userId,
                schoolId: order.schoolId,
                role: { in: ['school_admin', 'admin', 'super_admin', 'staff'] },
                isActive: true,
            },
        });
        if (!staffUser) {
            throw new Error('Not authorized to view this order');
        }
    }
    return order;
}
function getBasicTrackingHistory(order) {
    return [
        {
            id: `${order.id}-created`,
            status: 'pending',
            timestamp: order.createdAt,
            notes: 'Order created',
        },
        {
            id: `${order.id}-current`,
            status: order.status,
            timestamp: order.updatedAt,
            notes: `Order status: ${order.status}`,
        },
    ];
}
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('getOrderHandler', { event, context });
    try {
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const orderId = event.pathParameters?.orderId;
        if (!orderId) {
            return (0, response_utils_1.createErrorResponse)('MISSING_ORDER_ID', 'Missing orderId in path parameters', 400);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
        }
        logger_1.logger.info('Processing get order request', { orderId, userId });
        const order = await getOrderWithAuthorization(orderId, userId);
        const trackingHistory = getBasicTrackingHistory(order);
        const paymentDetails = order.payments.length > 0
            ? {
                paymentOrderId: order.payments[0].id,
                razorpayOrderId: undefined,
                paymentMethod: 'payment',
                status: order.payments[0].status,
                paidAt: order.payments[0].paidAt || undefined,
            }
            : undefined;
        const deliveryDetails = order.deliveredAt
            ? {
                estimatedDeliveryTime: undefined,
                actualDeliveryTime: order.deliveredAt,
                deliveredBy: undefined,
                rfidVerified: false,
            }
            : undefined;
        const response = {
            id: order.id,
            orderNumber: order.orderNumber,
            studentId: order.studentId,
            student: {
                id: order.student.id,
                firstName: order.student.firstName,
                lastName: order.student.lastName,
                grade: order.student.grade,
                section: order.student.section,
            },
            school: {
                id: order.school.id,
                name: order.school.name,
                address: order.school.address,
            },
            deliveryDate: order.deliveryDate.toISOString().split('T')[0],
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: Number(order.totalAmount),
            orderItems: order.orderItems.map((item) => ({
                id: item.id,
                menuItemId: item.menuItemId,
                menuItemName: item.menuItem.name,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
                specialInstructions: item.notes,
                customizations: item.customizations ? JSON.parse(item.customizations) : {},
                nutritionalInfo: item.menuItem.nutritionalInfo
                    ? JSON.parse(item.menuItem.nutritionalInfo)
                    : {},
                allergens: item.menuItem.allergens || [],
            })),
            trackingHistory,
            paymentDetails: paymentDetails || undefined,
            deliveryDetails: deliveryDetails || undefined,
            deliveryInstructions: order.specialInstructions,
            contactPhone: undefined,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('handler', { statusCode: 200, duration });
        logger_1.logger.info('Order details retrieved successfully', {
            orderId,
            itemCount: order.orderItems.length,
            status: order.status,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                order: response,
            },
            message: 'Order details retrieved successfully',
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('handler', { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve order details');
    }
};
exports.handler = handler;
//# sourceMappingURL=get-order.js.map