"use strict";
/**
 * Mobile RFID Tracking API Lambda Function
 *
 * Implements Story 2.4: Parent Mobile Integration - Real-time Order Tracking for Mobile App
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.updateTrackingStatusHandler = exports.getMobileTrackingHandler = void 0;
const logger_1 = require("../../shared/utils/logger");
const client_1 = require("@prisma/client");
const response_utils_1 = require("../shared/response.utils");
// Initialize services
const prisma = new client_1.PrismaClient();
/**
 * Validate parent access to student information
 */
async function validateParentAccess(studentId, parentUserId) {
    try {
        const student = await prisma.user.findFirst({
            where: { id: studentId },
            include: {
                rfidCards: {
                    where: {
                        isActive: true
                    }
                }
            },
            take: 1
        });
        if (!student) {
            return false;
        }
        if (student.role !== 'student') {
            return false;
        }
        if (!student.isActive) {
            return false;
        }
        // Verify parent relationship
        const parentRelationship = await prisma.studentParent.findFirst({
            where: {
                studentId: studentId,
                parentId: parentUserId
            },
            include: {
                parent: true
            }
        });
        if (!parentRelationship) {
            return false;
        }
        if (!parentRelationship.parent.isActive) {
            return false;
        }
        return true;
    }
    catch (error) {
        logger_1.logger.error('Error validating parent access:', error);
        return false;
    }
}
/**
 * Generate tracking steps for an order
 */
function generateTrackingSteps(order) {
    const steps = [];
    // Step 1: Order Placed
    const placedStep = {
        id: 'placed',
        title: 'Order Placed',
        description: `Order #${order.orderNumber} has been placed successfully`,
        completed: true,
        timestamp: order.createdAt,
        icon: 'shopping-cart'
    };
    steps.push(placedStep);
    // Step 2: Order Confirmed
    const confirmedStep = {
        id: 'confirmed',
        title: 'Order Confirmed',
        description: 'Your order has been confirmed and is being processed',
        completed: order.status !== 'pending',
        timestamp: order.confirmedAt,
        icon: 'check-circle'
    };
    steps.push(confirmedStep);
    // Step 3: Payment Processed
    if (order.paymentStatus === 'paid') {
        const paymentStep = {
            id: 'payment',
            title: 'Payment Processed',
            description: 'Payment has been successfully processed',
            completed: true,
            timestamp: order.paidAt,
            icon: 'credit-card'
        };
        steps.push(paymentStep);
    }
    // Step 4: Preparing
    const preparingStep = {
        id: 'preparing',
        title: 'Preparing Your Order',
        description: 'Your meal is being prepared in the kitchen',
        completed: ['preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status),
        timestamp: order.preparingAt,
        icon: 'chef-hat'
    };
    if (!preparingStep.completed && order.status === 'confirmed') {
        preparingStep.description = 'Your order will start preparation soon';
    }
    steps.push(preparingStep);
    // Step 5: Ready for Delivery
    const readyStep = {
        id: 'ready',
        title: 'Ready for Delivery',
        description: 'Your meal is ready and waiting for delivery',
        completed: ['ready', 'out_for_delivery', 'delivered'].includes(order.status),
        timestamp: order.readyAt,
        icon: 'package'
    };
    if (!readyStep.completed && ['confirmed', 'preparing'].includes(order.status)) {
        readyStep.description = 'Your meal will be ready soon';
    }
    steps.push(readyStep);
    // Step 6: Out for Delivery
    const outForDeliveryStep = {
        id: 'out_for_delivery',
        title: 'Out for Delivery',
        description: 'Your order is on its way to the delivery location',
        completed: ['out_for_delivery', 'delivered'].includes(order.status),
        timestamp: order.outForDeliveryAt,
        icon: 'truck'
    };
    if (!outForDeliveryStep.completed && ['confirmed', 'preparing', 'ready'].includes(order.status)) {
        outForDeliveryStep.description = 'Your order will be dispatched soon';
    }
    steps.push(outForDeliveryStep);
    // Step 7: Delivered
    const deliveredStep = {
        id: 'delivered',
        title: 'Delivered',
        description: 'Your order has been delivered',
        completed: order.status === 'delivered',
        timestamp: order.deliveredAt,
        location: undefined,
        icon: 'check-circle-2'
    };
    steps.push(deliveredStep);
    return steps;
}
/**
 * Get mobile tracking information for a student
 */
const getMobileTrackingHandler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.info('getMobileTracking function started', { eventPath: event.path });
    try {
        // Extract student ID from path parameters
        const studentId = event.pathParameters?.studentId;
        if (!studentId) {
            return (0, response_utils_1.createErrorResponse)(400, 'Student ID is required');
        }
        // Extract parent user ID from JWT token (assuming it's in the request context)
        const parentUserId = event.requestContext?.authorizer?.principalId;
        if (!parentUserId) {
            return (0, response_utils_1.createErrorResponse)(401, 'Unauthorized: Parent authentication required');
        }
        // Validate parent access to student
        const hasAccess = await validateParentAccess(studentId, parentUserId);
        if (!hasAccess) {
            return (0, response_utils_1.createErrorResponse)(403, 'Unauthorized: Access denied to student information');
        }
        // Get student information
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                school: true,
                rfidCards: {
                    where: {
                        isActive: true
                    }
                }
            }
        });
        if (!student) {
            return (0, response_utils_1.createErrorResponse)(404, 'Student not found');
        }
        // Get active orders (current day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const activeOrders = await prisma.order.findMany({
            where: {
                studentId: studentId,
                createdAt: {
                    gte: today,
                    lt: tomorrow
                },
                status: {
                    in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']
                }
            },
            include: {
                student: {
                    include: {
                        school: true
                    }
                },
                orderItems: {
                    include: {
                        menuItem: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Get recent deliveries (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentDeliveries = await prisma.order.findMany({
            where: {
                studentId: studentId,
                status: 'delivered',
                deliveredAt: {
                    gte: weekAgo
                }
            },
            include: {
                student: {
                    include: {
                        school: true
                    }
                },
                orderItems: {
                    include: {
                        menuItem: true
                    }
                }
            },
            orderBy: {
                deliveredAt: 'desc'
            },
            take: 10
        });
        // Get upcoming orders (next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const upcomingOrders = await prisma.order.findMany({
            where: {
                studentId: studentId,
                deliveryDate: {
                    gt: today,
                    lte: nextWeek
                }
            },
            include: {
                student: {
                    include: {
                        school: true
                    }
                },
                orderItems: {
                    include: {
                        menuItem: true
                    }
                }
            },
            orderBy: {
                deliveryDate: 'asc'
            }
        });
        // Calculate delivery stats
        const totalDelivered = recentDeliveries.length;
        const onTimeDeliveries = recentDeliveries.filter(order => order.deliveredAt && order.deliveryDate &&
            order.deliveredAt <= order.deliveryDate).length;
        const onTimeDeliveryRate = totalDelivered > 0 ? (onTimeDeliveries / totalDelivered) * 100 : 0;
        const deliveryTimes = recentDeliveries
            .filter(order => order.createdAt && order.deliveredAt)
            .map(order => (order.deliveredAt.getTime() - order.createdAt.getTime()) / (1000 * 60)); // minutes
        const averageDeliveryTime = deliveryTimes.length > 0
            ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
            : 0;
        // Transform orders to mobile tracking format
        const transformOrder = (order) => ({
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            menuPlan: {
                name: order.orderItems?.[0]?.menuItem?.name || 'Meal Order',
                date: order.deliveryDate,
                meal: order.orderItems?.[0]?.menuItem?.category || 'Lunch'
            },
            student: {
                id: order.student.id,
                firstName: order.student.firstName,
                lastName: order.student.lastName,
                grade: order.student.grade || 'N/A',
                school: {
                    name: order.student.school.name,
                    location: order.student.school.address || 'School Campus'
                }
            },
            trackingSteps: generateTrackingSteps(order),
            deliveryVerification: undefined, // TODO: Implement delivery verification lookup
            estimatedDeliveryTime: order.deliveryDate,
            notifications: [] // TODO: Implement notifications system
        });
        const response = {
            activeOrders: activeOrders.map(transformOrder),
            recentDeliveries: recentDeliveries.map(transformOrder),
            deliveryStats: {
                totalDelivered,
                onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
                averageDeliveryTime: Math.round(averageDeliveryTime)
            },
            upcomingOrders: upcomingOrders.map(transformOrder)
        };
        const duration = Date.now() - startTime;
        logger_1.logger.info("getMobileTracking completed", { statusCode: 200, duration });
        return (0, response_utils_1.createSuccessResponse)(response);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error);
    }
};
exports.getMobileTrackingHandler = getMobileTrackingHandler;
/**
 * Update tracking status for an order
 */
const updateTrackingStatusHandler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.info('updateTrackingStatus function started', { eventPath: event.path });
    try {
        // Extract order ID from path parameters
        const orderId = event.pathParameters?.orderId;
        if (!orderId) {
            return (0, response_utils_1.createErrorResponse)(400, 'Order ID is required');
        }
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { status, location, rfidCardId } = body;
        // Validate required fields
        if (!status) {
            return (0, response_utils_1.createErrorResponse)(400, 'Status is required');
        }
        // Validate status value
        const validStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
        if (!validStatuses.includes(status)) {
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid status value');
        }
        // Get order information
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                student: {
                    include: {
                        rfidCards: true
                    }
                }
            }
        });
        if (!order) {
            return (0, response_utils_1.createErrorResponse)(404, 'Order not found');
        }
        // Update order status
        const updateData = {
            status: status,
            updatedAt: new Date()
        };
        // Set timestamp fields based on status
        switch (status) {
            case 'confirmed':
                updateData.confirmedAt = new Date();
                break;
            case 'preparing':
                updateData.preparingAt = new Date();
                break;
            case 'ready':
                updateData.readyAt = new Date();
                break;
            case 'out_for_delivery':
                updateData.outForDeliveryAt = new Date();
                break;
            case 'delivered':
                updateData.deliveredAt = new Date();
                break;
        }
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData
        });
        // Create delivery verification for delivered orders
        if (status === 'delivered' && rfidCardId) {
            await prisma.deliveryVerification.create({
                data: {
                    orderId: orderId,
                    studentId: order.studentId,
                    cardId: rfidCardId,
                    readerId: 'default-reader', // Default reader ID - should be configurable
                    location: location || 'School',
                    verificationNotes: 'Mobile tracking update'
                }
            });
        }
        const duration = Date.now() - startTime;
        logger_1.logger.info("getMobileTracking completed", { statusCode: 200, duration });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Tracking status updated successfully',
            orderId: orderId,
            status: status,
            timestamp: new Date()
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error);
    }
};
exports.updateTrackingStatusHandler = updateTrackingStatusHandler;
// Main handler for serverless deployment
const handler = async (event, context) => {
    const { httpMethod, path } = event;
    try {
        switch (`${httpMethod}:${path}`) {
            case 'GET:/mobile/students/{studentId}/tracking':
                return await (0, exports.getMobileTrackingHandler)(event, context);
            case 'PUT:/mobile/orders/{orderId}/tracking':
                return await (0, exports.updateTrackingStatusHandler)(event, context);
            default:
                return (0, response_utils_1.createErrorResponse)(404, 'Endpoint not found');
        }
    }
    catch (error) {
        logger_1.logger.error('Mobile tracking handler error:', error);
        return (0, response_utils_1.handleError)(error);
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.handler = handler;
exports.default = {
    getMobileTrackingHandler: exports.getMobileTrackingHandler,
    updateTrackingStatusHandler: exports.updateTrackingStatusHandler
};
