"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const client_1 = require("@prisma/client");
const razorpay_service_1 = require("../shared/razorpay.service");
const prisma = new client_1.PrismaClient();
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_MINUTES = [5, 30, 120];
async function validatePaymentRetry(paymentId, userId) {
    const paymentTransaction = await prisma.paymentTransaction.findUnique({
        where: { id: paymentId },
        include: {
            paymentOrder: {
                include: {
                    paymentTransactions: true,
                },
            },
            refunds: true,
        },
    });
    if (!paymentTransaction) {
        throw new Error('Payment transaction not found');
    }
    if (!['failed', 'created'].includes(paymentTransaction.status)) {
        throw new Error(`Payment with status '${paymentTransaction.status}' cannot be retried`);
    }
    if (paymentTransaction.refunds && paymentTransaction.refunds.length > 0) {
        throw new Error('Refunded payments cannot be retried');
    }
    const { paymentOrder } = paymentTransaction;
    if (!paymentOrder) {
        throw new Error('Payment order not found');
    }
    if (paymentOrder.userId !== userId) {
        const order = paymentOrder.orderId
            ? await prisma.order.findUnique({
                where: { id: paymentOrder.orderId },
            })
            : null;
        const adminUser = await prisma.user.findFirst({
            where: {
                id: userId,
                schoolId: order?.schoolId,
                role: { in: ['school_admin', 'admin', 'super_admin'] },
                isActive: true,
            },
        });
        if (!adminUser) {
            throw new Error('Not authorized to retry this payment');
        }
    }
    const existingRetries = await prisma.paymentRetry.count({
        where: { paymentId },
    });
    if (existingRetries >= MAX_RETRY_ATTEMPTS) {
        throw new Error(`Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) exceeded`);
    }
    if (paymentOrder.orderId) {
        const order = await prisma.order.findUnique({
            where: { id: paymentOrder.orderId },
        });
        if (!order || !['pending', 'confirmed'].includes(order.status)) {
            throw new Error('Order is no longer valid for payment retry');
        }
    }
    if (paymentOrder.subscriptionId) {
        const subscription = await prisma.subscription.findUnique({
            where: { id: paymentOrder.subscriptionId },
        });
        if (!subscription || !['active', 'suspended', 'trialing'].includes(subscription.status)) {
            throw new Error('Subscription is no longer valid for payment retry');
        }
    }
    return {
        paymentTransaction,
        paymentOrder,
        existingRetries,
    };
}
const handler = async (event, context) => {
    try {
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 'Only POST method is allowed', 405);
        }
        const paymentId = event.pathParameters?.paymentId;
        if (!paymentId) {
            return (0, response_utils_1.createErrorResponse)('Missing payment ID', 'paymentId is required in path', 400);
        }
        const body = JSON.parse(event.body || '{}');
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('Authentication required', 'User authentication required', 401);
        }
        logger_1.logger.info('Retrying payment', { paymentId, userId });
        const { paymentTransaction, paymentOrder, existingRetries } = await validatePaymentRetry(paymentId, userId);
        const attemptNumber = existingRetries + 1;
        const retryDelay = RETRY_DELAYS_MINUTES[Math.min(existingRetries, RETRY_DELAYS_MINUTES.length - 1)];
        const retryAt = new Date(Date.now() + retryDelay * 60 * 1000);
        const razorpayOrderOptions = {
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            receipt: `retry_${paymentOrder.razorpayOrderId}_attempt_${attemptNumber}`,
            payment_capture: true,
            notes: {
                originalOrderId: paymentOrder.razorpayOrderId,
                originalPaymentId: paymentTransaction.razorpayPaymentId,
                retryAttempt: String(attemptNumber),
                orderId: paymentOrder.orderId || '',
                subscriptionId: paymentOrder.subscriptionId || '',
                userId: paymentOrder.userId,
            },
        };
        const razorpayOrder = await razorpay_service_1.razorpayService.createOrder(razorpayOrderOptions);
        const newPaymentOrder = await prisma.paymentOrder.create({
            data: {
                id: razorpayOrder.id,
                razorpayOrderId: razorpayOrder.id,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                status: razorpayOrder.status,
                userId: paymentOrder.userId,
                orderId: paymentOrder.orderId,
                subscriptionId: paymentOrder.subscriptionId,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                metadata: JSON.stringify({
                    ...JSON.parse(paymentOrder.metadata),
                    retryAttempt: attemptNumber,
                    originalOrderId: paymentOrder.razorpayOrderId,
                }),
            },
        });
        await prisma.paymentRetry.create({
            data: {
                paymentId,
                attemptNumber,
                retryAt,
                retryReason: body.retryReason || 'User initiated retry',
                retryMethod: body.paymentMethodId || null,
                status: 'pending',
            },
        });
        await prisma.paymentTransaction.update({
            where: { id: paymentId },
            data: {
                status: 'retry_initiated',
            },
        });
        await prisma.auditLog.create({
            data: {
                entityType: 'PaymentTransaction',
                entityId: paymentId,
                action: 'PAYMENT_RETRY',
                changes: JSON.stringify({
                    attemptNumber,
                    newOrderId: razorpayOrder.id,
                    retryAt: retryAt.toISOString(),
                }),
                userId,
                createdById: userId,
                metadata: JSON.stringify({
                    action: 'PAYMENT_RETRY_INITIATED',
                    originalPaymentId: paymentId,
                    newPaymentOrderId: newPaymentOrder.id,
                }),
            },
        });
        const response = {
            paymentOrderId: newPaymentOrder.id,
            razorpayOrderId: newPaymentOrder.razorpayOrderId,
            orderId: paymentOrder.orderId || undefined,
            subscriptionId: paymentOrder.subscriptionId || undefined,
            amount: Number(newPaymentOrder.amount),
            currency: newPaymentOrder.currency,
            attemptNumber,
            status: newPaymentOrder.status,
            expiresAt: newPaymentOrder.expiresAt,
            retryScheduledFor: retryAt,
        };
        logger_1.logger.info('Payment retry initiated successfully', {
            originalPaymentId: paymentId,
            newPaymentOrderId: newPaymentOrder.id,
            attemptNumber,
            retryAt: retryAt.toISOString(),
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                retry: response,
                razorpayKey: process.env.RAZORPAY_KEY_ID,
            },
            message: `Payment retry initiated successfully (Attempt ${attemptNumber}/${MAX_RETRY_ATTEMPTS})`,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to retry payment', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return (0, response_utils_1.handleError)(error);
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.handler = handler;
//# sourceMappingURL=retry-payment.js.map