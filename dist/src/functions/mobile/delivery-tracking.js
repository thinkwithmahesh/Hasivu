"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryTrackingHandler = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../../utils/logger");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const joi_1 = __importDefault(require("joi"));
const prisma = new client_1.PrismaClient();
const trackingQuerySchema = joi_1.default.object({
    includeHistory: joi_1.default.boolean().optional().default(false),
    includePrediction: joi_1.default.boolean().optional().default(true),
    dateFrom: joi_1.default.date().optional(),
    dateTo: joi_1.default.date().optional(),
    status: joi_1.default.string().valid('active', 'completed', 'all').optional().default('all'),
});
async function validateParentAccess(studentId, parentUserId) {
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
function generateTrackingSteps(order, deliveryVerification) {
    const steps = [];
    const placedStep = {
        step: 1,
        title: 'Order Placed',
        description: `Order #${order.orderNumber} has been placed successfully`,
        timestamp: order.createdAt,
        completed: true,
        current: false,
        icon: 'order-placed',
    };
    steps.push(placedStep);
    const confirmedStep = {
        step: 2,
        title: 'Order Confirmed',
        description: 'Your order has been confirmed and payment processed',
        timestamp: order.confirmedAt || (order.status === 'confirmed' ? order.updatedAt : undefined),
        completed: ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status),
        current: order.status === 'confirmed',
        icon: 'order-confirmed',
    };
    steps.push(confirmedStep);
    if (order.paymentStatus === 'paid') {
        const paymentStep = {
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
    const preparingStep = {
        step: 4,
        title: 'Preparing Your Meal',
        description: 'Kitchen is preparing your meal with fresh ingredients',
        timestamp: order.preparingAt || (order.status === 'preparing' ? order.updatedAt : undefined),
        completed: ['preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status),
        current: order.status === 'preparing',
        icon: 'preparing',
    };
    if (!preparingStep.completed && order.status === 'confirmed') {
        preparingStep.estimatedTime = new Date(Date.now() + 15 * 60 * 1000);
    }
    steps.push(preparingStep);
    const readyStep = {
        step: 5,
        title: 'Ready for Delivery',
        description: 'Your meal is ready and packed for delivery',
        timestamp: order.readyAt || (order.status === 'ready' ? order.updatedAt : undefined),
        completed: ['ready', 'out_for_delivery', 'delivered'].includes(order.status),
        current: order.status === 'ready',
        icon: 'ready',
    };
    if (!readyStep.completed && ['confirmed', 'preparing'].includes(order.status)) {
        readyStep.estimatedTime = new Date(Date.now() + 30 * 60 * 1000);
    }
    steps.push(readyStep);
    const outForDeliveryStep = {
        step: 6,
        title: 'Out for Delivery',
        description: 'Your meal is on the way to the delivery location',
        timestamp: order.outForDeliveryAt || (order.status === 'out_for_delivery' ? order.updatedAt : undefined),
        completed: ['out_for_delivery', 'delivered'].includes(order.status),
        current: order.status === 'out_for_delivery',
        icon: 'out-for-delivery',
    };
    if (!outForDeliveryStep.completed && ['confirmed', 'preparing', 'ready'].includes(order.status)) {
        outForDeliveryStep.estimatedTime = new Date(Date.now() + 45 * 60 * 1000);
    }
    steps.push(outForDeliveryStep);
    const deliveredStep = {
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
async function getOrderTracking(orderId, parentUserId) {
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
    await validateParentAccess(order.studentId, parentUserId);
    let deliveryVerification;
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
    const trackingSteps = generateTrackingSteps(order, deliveryVerification);
    const currentStep = trackingSteps.findIndex(step => step.current) + 1;
    let estimatedDeliveryTime;
    if (order.status !== 'delivered') {
        const baseTime = new Date();
        switch (order.status) {
            case 'confirmed':
                estimatedDeliveryTime = new Date(baseTime.getTime() + 45 * 60 * 1000);
                break;
            case 'preparing':
                estimatedDeliveryTime = new Date(baseTime.getTime() + 30 * 60 * 1000);
                break;
            case 'ready':
                estimatedDeliveryTime = new Date(baseTime.getTime() + 15 * 60 * 1000);
                break;
            case 'out_for_delivery':
                estimatedDeliveryTime = new Date(baseTime.getTime() + 5 * 60 * 1000);
                break;
        }
    }
    const notifications = await prisma.notification.findMany({
        where: {
            userId: parentUserId,
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
async function getStudentTrackingOverview(studentId, parentUserId, filters) {
    const { student } = await validateParentAccess(studentId, parentUserId);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
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
    const averageDeliveryTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((sum, order) => {
            const diffMs = order.deliveredAt.getTime() - order.createdAt.getTime();
            return sum + diffMs;
        }, 0) /
            deliveryTimes.length /
            (1000 * 60)
        : 0;
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
    const favoriteItemsWithDetails = await Promise.all(favoriteItems.map(async (item) => {
        const menuItem = await prisma.menuItem.findUnique({
            where: { id: item.menuItemId },
            select: { name: true, category: true },
        });
        return {
            name: menuItem?.name || 'Unknown Item',
            orderCount: item._count.menuItemId,
            category: menuItem?.category || 'Unknown',
        };
    }));
    const notifications = await prisma.notification.findMany({
        where: {
            userId: parentUserId,
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
    const convertToTracking = (orders) => {
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
                items: order.orderItems.map((item) => ({
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
function canAccessTracking(requestingUser, targetUserId) {
    if (['super_admin', 'admin'].includes(requestingUser.role)) {
        return true;
    }
    if (requestingUser.role === 'parent' && requestingUser.id === targetUserId) {
        return true;
    }
    return false;
}
const deliveryTrackingHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const httpMethod = event.httpMethod;
    const pathParameters = event.pathParameters || {};
    try {
        logger_1.logger.info('Mobile delivery tracking request started', { requestId, httpMethod });
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if (!authResult.success || !authResult.user) {
            logger_1.logger.warn('Authentication failed', { requestId, error: authResult.error });
            return (0, response_utils_1.createErrorResponse)('AUTHENTICATION_FAILED', 'Authentication failed', 401);
        }
        const authenticatedUser = authResult.user;
        const queryParams = event.queryStringParameters || {};
        const { error, value: filters } = trackingQuerySchema.validate(queryParams);
        if (error) {
            logger_1.logger.warn('Invalid tracking query parameters', { requestId, error: error.details });
            return (0, response_utils_1.createErrorResponse)('INVALID_PARAMETERS', 'Invalid query parameters', 400, error.details);
        }
        if (pathParameters.orderId) {
            const orderId = pathParameters.orderId;
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { studentId: true },
            });
            if (!order) {
                return (0, response_utils_1.createErrorResponse)('ORDER_NOT_FOUND', 'Order not found', 404);
            }
            if (!canAccessTracking(authenticatedUser, authenticatedUser.id)) {
                return (0, response_utils_1.createErrorResponse)('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions to access tracking data', 403);
            }
            const tracking = await getOrderTracking(orderId, authenticatedUser.id);
            logger_1.logger.info('Order tracking retrieved', {
                requestId,
                orderId,
                orderStatus: tracking.status,
            });
            return (0, response_utils_1.createSuccessResponse)({
                message: 'Order tracking retrieved successfully',
                data: tracking,
            });
        }
        else if (pathParameters.studentId) {
            const studentId = pathParameters.studentId;
            if (!canAccessTracking(authenticatedUser, authenticatedUser.id)) {
                return (0, response_utils_1.createErrorResponse)('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions to access tracking data', 403);
            }
            const overview = await getStudentTrackingOverview(studentId, authenticatedUser.id, filters);
            logger_1.logger.info('Student tracking overview retrieved', {
                requestId,
                studentId,
                activeOrdersCount: overview.activeOrders.length,
                recentDeliveriesCount: overview.recentDeliveries.length,
            });
            return (0, response_utils_1.createSuccessResponse)({
                message: 'Student tracking overview retrieved successfully',
                data: overview,
            });
        }
        else {
            return (0, response_utils_1.createErrorResponse)('INVALID_REQUEST', 'Either orderId or studentId must be provided in path parameters', 400);
        }
    }
    catch (error) {
        logger_1.logger.error('Mobile delivery tracking failed', error instanceof Error ? error : new Error(String(error)), {
            requestId,
            httpMethod,
        });
        return (0, response_utils_1.handleError)(error instanceof Error ? error : new Error(String(error)));
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.deliveryTrackingHandler = deliveryTrackingHandler;
//# sourceMappingURL=delivery-tracking.js.map