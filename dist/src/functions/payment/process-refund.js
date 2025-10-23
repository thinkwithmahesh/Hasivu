"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const client_1 = require("@prisma/client");
const razorpay_service_1 = require("../shared/razorpay.service");
const prisma = new client_1.PrismaClient();
async function validateRefundRequest(paymentId, amount, userId) {
    const paymentTransaction = await prisma.paymentTransaction.findUnique({
        where: { id: paymentId },
    });
    if (!paymentTransaction) {
        throw new Error('Payment transaction not found');
    }
    const paymentOrder = paymentTransaction.paymentOrderId
        ? await prisma.paymentOrder.findUnique({
            where: { id: paymentTransaction.paymentOrderId },
        })
        : null;
    const order = paymentOrder?.orderId
        ? await prisma.order.findUnique({
            where: { id: paymentOrder.orderId },
        })
        : null;
    if (paymentTransaction.status !== 'captured') {
        throw new Error('Only captured payments can be refunded');
    }
    if (paymentOrder?.userId !== userId) {
        const adminUser = await prisma.user.findFirst({
            where: {
                id: userId,
                schoolId: order?.schoolId,
                role: { in: ['school_admin', 'admin', 'super_admin'] },
                isActive: true,
            },
        });
        if (!adminUser) {
            throw new Error('Not authorized to process refund for this payment');
        }
    }
    const existingRefund = await prisma.paymentRefund.findFirst({
        where: { paymentId },
    });
    if (existingRefund) {
        throw new Error('Payment has already been refunded');
    }
    const refundAmount = amount || Number(paymentTransaction.amount);
    if (refundAmount > Number(paymentTransaction.amount)) {
        throw new Error('Refund amount cannot exceed payment amount');
    }
    return {
        paymentTransaction,
        refundAmount,
    };
}
const handler = async (event, context) => {
    try {
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 'Only POST method is allowed', 405);
        }
        const body = JSON.parse(event.body || '{}');
        if (!body.paymentId || !body.reason) {
            return (0, response_utils_1.createErrorResponse)('Missing required fields', 'paymentId and reason are required', 400);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('Authentication required', 'User authentication required', 401);
        }
        logger_1.logger.info('Processing refund request', {
            paymentId: body.paymentId,
            amount: body.amount,
            reason: body.reason,
        });
        const { paymentTransaction, refundAmount } = await validateRefundRequest(body.paymentId, body.amount, userId);
        const razorpayRefund = await razorpay_service_1.razorpayService.createRefund(paymentTransaction.razorpayPaymentId, {
            amount: refundAmount,
            notes: {
                reason: body.reason,
                notes: body.notes || '',
                processedBy: userId,
            },
        });
        const refund = await prisma.paymentRefund.create({
            data: {
                razorpayRefundId: razorpayRefund.id,
                paymentId: body.paymentId,
                amount: refundAmount,
                currency: razorpayRefund.currency,
                status: razorpayRefund.status,
                reason: body.reason,
                notes: JSON.stringify({
                    reason: body.reason,
                    notes: body.notes || '',
                    processedBy: userId,
                }),
                processedAt: new Date(),
            },
        });
        await prisma.paymentTransaction.update({
            where: { id: body.paymentId },
            data: {
                refundedAt: new Date(),
            },
        });
        if (paymentTransaction.paymentOrder?.orderId) {
            await prisma.order.update({
                where: { id: paymentTransaction.paymentOrder.orderId },
                data: {
                    paymentStatus: 'refunded',
                    status: 'cancelled',
                },
            });
        }
        await prisma.auditLog.create({
            data: {
                entityType: 'PaymentRefund',
                entityId: refund.id,
                action: 'CREATE',
                changes: JSON.stringify({
                    paymentId: body.paymentId,
                    amount: refundAmount,
                    reason: body.reason,
                    razorpayRefundId: razorpayRefund.id,
                }),
                userId,
                createdById: userId,
                metadata: JSON.stringify({
                    action: 'PAYMENT_REFUND_PROCESSED',
                    razorpayRefundId: razorpayRefund.id,
                }),
            },
        });
        const response = {
            id: refund.id,
            paymentId: body.paymentId,
            amount: Number(refund.amount),
            currency: refund.currency,
            status: refund.status,
            reason: refund.reason,
            notes: body.notes,
            processedAt: refund.processedAt || new Date(),
            createdAt: refund.createdAt,
        };
        logger_1.logger.info('Refund processed successfully', {
            refundId: refund.id,
            paymentId: body.paymentId,
            amount: refundAmount,
            status: refund.status,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                refund: response,
            },
            message: 'Refund processed successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Refund processing failed', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return (0, response_utils_1.handleError)(error);
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.handler = handler;
//# sourceMappingURL=process-refund.js.map