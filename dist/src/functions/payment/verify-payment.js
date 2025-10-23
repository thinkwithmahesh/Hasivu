"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const client_1 = require("@prisma/client");
const razorpay_service_1 = require("../shared/razorpay.service");
const prisma = new client_1.PrismaClient();
async function verifyAndProcessPayment(orderId, paymentId, signature, userId) {
    const isValidSignature = razorpay_service_1.razorpayService.verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValidSignature) {
        throw new Error('Invalid payment signature');
    }
    const razorpayPayment = await razorpay_service_1.razorpayService.fetchPayment(paymentId);
    const paymentOrder = await prisma.paymentOrder.findUnique({
        where: { razorpayOrderId: orderId },
    });
    if (!paymentOrder) {
        throw new Error('Payment order not found');
    }
    const order = paymentOrder.orderId
        ? await prisma.order.findUnique({
            where: { id: paymentOrder.orderId },
            include: {
                user: true,
                student: true,
                school: true,
            },
        })
        : null;
    if (paymentOrder.userId !== userId && order?.userId !== userId) {
        throw new Error('Not authorized to verify this payment');
    }
    const existingTransaction = await prisma.paymentTransaction.findUnique({
        where: { razorpayPaymentId: paymentId },
    });
    if (existingTransaction) {
        return {
            success: existingTransaction.status === 'captured',
            paymentId: existingTransaction.id,
            orderId: paymentOrder.orderId,
            amount: Number(existingTransaction.amount),
            currency: existingTransaction.currency,
            status: existingTransaction.status,
            verifiedAt: existingTransaction.createdAt,
        };
    }
    const transaction = await prisma.paymentTransaction.create({
        data: {
            razorpayPaymentId: paymentId,
            paymentOrderId: paymentOrder.id,
            amount: razorpayPayment.amount,
            currency: razorpayPayment.currency,
            status: razorpayPayment.status,
            method: razorpayPayment.method,
            gateway: 'razorpay',
            fees: JSON.stringify({
                fee: razorpayPayment.fee || 0,
                tax: razorpayPayment.tax || 0,
            }),
            capturedAt: razorpayPayment.captured ? new Date(razorpayPayment.created_at * 1000) : null,
        },
    });
    await prisma.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: {
            status: razorpayPayment.status,
        },
    });
    if (razorpayPayment.status === 'captured' || razorpayPayment.status === 'authorized') {
        await prisma.order.update({
            where: { id: paymentOrder.orderId },
            data: {
                paymentStatus: 'paid',
                status: 'confirmed',
            },
        });
        await prisma.auditLog.create({
            data: {
                entityType: 'Order',
                entityId: paymentOrder.orderId,
                action: 'PAYMENT_COMPLETED',
                changes: JSON.stringify({
                    paymentId,
                    amount: razorpayPayment.amount,
                    method: razorpayPayment.method,
                }),
                userId,
                createdById: userId,
                metadata: JSON.stringify({
                    razorpayOrderId: orderId,
                    razorpayPaymentId: paymentId,
                }),
            },
        });
        logger_1.logger.info('Payment verified and order updated', {
            orderId: paymentOrder.orderId,
            paymentId,
            amount: razorpayPayment.amount,
        });
    }
    return {
        success: razorpayPayment.status === 'captured',
        paymentId: transaction.id,
        orderId: paymentOrder.orderId,
        amount: Number(razorpayPayment.amount),
        currency: razorpayPayment.currency,
        status: razorpayPayment.status,
        verifiedAt: transaction.createdAt,
    };
}
const handler = async (event, context) => {
    try {
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 'Only POST method is allowed', 405);
        }
        const body = JSON.parse(event.body || '{}');
        if (!body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
            return (0, response_utils_1.createErrorResponse)('Missing required fields', 'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required', 400);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('Authentication required', 'User authentication required', 401);
        }
        logger_1.logger.info('Verifying payment', {
            razorpayOrderId: body.razorpayOrderId,
            razorpayPaymentId: body.razorpayPaymentId,
            userId,
        });
        const verificationResult = await verifyAndProcessPayment(body.razorpayOrderId, body.razorpayPaymentId, body.razorpaySignature, userId);
        const response = {
            success: verificationResult.success,
            paymentId: verificationResult.paymentId,
            orderId: verificationResult.orderId,
            amount: verificationResult.amount,
            currency: verificationResult.currency,
            status: verificationResult.status,
            verifiedAt: verificationResult.verifiedAt,
        };
        logger_1.logger.info('Payment verification completed', {
            success: verificationResult.success,
            paymentId: verificationResult.paymentId,
            status: verificationResult.status,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                verification: response,
            },
            message: verificationResult.success
                ? 'Payment verified successfully'
                : 'Payment verification completed',
        });
    }
    catch (error) {
        logger_1.logger.error('Payment verification failed', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return (0, response_utils_1.handleError)(error);
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.handler = handler;
//# sourceMappingURL=verify-payment.js.map