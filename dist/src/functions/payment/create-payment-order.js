"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const client_1 = require("@prisma/client");
const razorpay_service_1 = require("../shared/razorpay.service");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const prisma = new client_1.PrismaClient();
async function validateOrderForPayment(orderId, userId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            student: true,
            school: true,
            payments: {
                where: {
                    status: { in: ['paid', 'captured'] },
                },
            },
        },
    });
    if (!order) {
        throw new Error('Order not found');
    }
    if (order.userId !== userId) {
        const adminUser = await prisma.user.findFirst({
            where: {
                id: userId,
                schoolId: order.schoolId,
                role: { in: ['school_admin', 'admin', 'super_admin'] },
                isActive: true,
            },
        });
        if (!adminUser) {
            throw new Error('Not authorized to create payment for this order');
        }
    }
    if (!['pending', 'confirmed'].includes(order.status)) {
        throw new Error(`Order cannot be paid for in current status: ${order.status}`);
    }
    if (order.payments.length > 0) {
        throw new Error('Order has already been paid');
    }
    if (order.paymentStatus !== 'pending') {
        throw new Error(`Order payment status is ${order.paymentStatus}`);
    }
    return order;
}
const handler = async (event, context) => {
    try {
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 'Only POST method is allowed', 405);
        }
        const body = JSON.parse(event.body || '{}');
        if (!body.orderId) {
            return (0, response_utils_1.createErrorResponse)('Missing order ID', 'orderId is required', 400);
        }
        const userId = authenticatedUser.user.id;
        logger_1.logger.info('Creating payment order', { orderId: body.orderId, userId });
        const order = await validateOrderForPayment(body.orderId, userId);
        const amount = body.amount || Number(order.totalAmount);
        const currency = body.currency || order.currency || 'INR';
        const amountInPaise = Math.round(amount * 100);
        const razorpayOrderOptions = {
            amount: amountInPaise,
            currency,
            receipt: `order_${order.orderNumber}`,
            payment_capture: true,
            notes: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                userId: order.userId,
                studentId: order.studentId,
                schoolId: order.schoolId,
            },
        };
        const razorpayOrder = await razorpay_service_1.razorpayService.createOrder(razorpayOrderOptions);
        const paymentOrder = await prisma.paymentOrder.create({
            data: {
                id: razorpayOrder.id,
                razorpayOrderId: razorpayOrder.id,
                amount: amountInPaise,
                currency,
                status: razorpayOrder.status,
                userId: order.userId,
                orderId: order.id,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                metadata: JSON.stringify({
                    orderNumber: order.orderNumber,
                    studentName: `${order.student.firstName} ${order.student.lastName}`,
                    schoolName: order.school.name,
                }),
            },
        });
        await prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: 'processing',
            },
        });
        const response = {
            id: paymentOrder.id,
            razorpayOrderId: paymentOrder.razorpayOrderId,
            orderId: paymentOrder.orderId,
            amount: Number(paymentOrder.amount),
            currency: paymentOrder.currency,
            status: paymentOrder.status,
            expiresAt: paymentOrder.expiresAt,
            createdAt: paymentOrder.createdAt,
        };
        logger_1.logger.info('Payment order created successfully', {
            paymentOrderId: paymentOrder.id,
            razorpayOrderId: razorpayOrder.id,
            amount,
            orderId: order.id,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                paymentOrder: response,
                razorpayKey: process.env.RAZORPAY_KEY_ID,
            },
            message: 'Payment order created successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create payment order', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return (0, response_utils_1.handleError)(error);
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.handler = handler;
//# sourceMappingURL=create-payment-order.js.map