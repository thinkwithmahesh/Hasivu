"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../shared/utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const DatabaseManager_1 = require("../../database/DatabaseManager");
const razorpay_service_1 = require("../shared/razorpay.service");
const SUPPORTED_EVENTS = [
    'payment.captured',
    'payment.failed',
    'payment.authorized',
    'order.paid',
    'refund.created',
    'refund.processed',
];
const WEBHOOK_EXPIRY_MINUTES = 10;
const processedWebhooks = new Map();
function isWebhookProcessed(webhookId) {
    const now = Date.now();
    for (const [id, timestamp] of processedWebhooks.entries()) {
        if (now - timestamp > WEBHOOK_EXPIRY_MINUTES * 60 * 1000) {
            processedWebhooks.delete(id);
        }
    }
    if (processedWebhooks.has(webhookId)) {
        return true;
    }
    processedWebhooks.set(webhookId, now);
    return false;
}
async function processPaymentCaptured(eventData) {
    const paymentEntity = eventData.payment.entity;
    logger_1.logger.info('Processing payment.captured event', {
        paymentId: paymentEntity.id,
        orderId: paymentEntity.order_id,
        amount: paymentEntity.amount,
    });
    await DatabaseManager_1.prisma.paymentTransaction.updateMany({
        where: { razorpayPaymentId: paymentEntity.id },
        data: {
            status: 'captured',
            capturedAt: new Date(),
        },
    });
    await DatabaseManager_1.prisma.paymentOrder.updateMany({
        where: { razorpayOrderId: paymentEntity.order_id },
        data: { status: 'captured' },
    });
    const paymentOrder = await DatabaseManager_1.prisma.paymentOrder.findFirst({
        where: { razorpayOrderId: paymentEntity.order_id },
    });
    if (!paymentOrder) {
        logger_1.logger.warn('Payment order not found for captured payment', {
            razorpayOrderId: paymentEntity.order_id,
        });
        return;
    }
    if (paymentOrder.orderId) {
        await DatabaseManager_1.prisma.order.update({
            where: { id: paymentOrder.orderId },
            data: {
                paymentStatus: 'paid',
                status: 'confirmed',
            },
        });
        logger_1.logger.info('Order status updated to confirmed', {
            orderId: paymentOrder.orderId,
            paymentId: paymentEntity.id,
        });
    }
    if (paymentOrder.subscriptionId) {
        const billingCycle = await DatabaseManager_1.prisma.billingCycle.findFirst({
            where: {
                subscriptionId: paymentOrder.subscriptionId,
                status: 'processing',
            },
            orderBy: {
                cycleStart: 'asc',
            },
        });
        if (billingCycle) {
            await DatabaseManager_1.prisma.billingCycle.update({
                where: { id: billingCycle.id },
                data: {
                    status: 'paid',
                    paidDate: new Date(),
                    paymentId: paymentOrder.id,
                },
            });
            await DatabaseManager_1.prisma.subscription.update({
                where: { id: paymentOrder.subscriptionId },
                data: {
                    status: 'active',
                    dunningAttempts: 0,
                },
            });
            logger_1.logger.info('Subscription billing cycle updated', {
                subscriptionId: paymentOrder.subscriptionId,
                billingCycleId: billingCycle.id,
            });
        }
    }
}
async function processPaymentFailed(eventData) {
    const paymentEntity = eventData.payment.entity;
    logger_1.logger.info('Processing payment.failed event', {
        paymentId: paymentEntity.id,
        orderId: paymentEntity.order_id,
        errorCode: paymentEntity.error_code,
        errorDescription: paymentEntity.error_description,
    });
    await DatabaseManager_1.prisma.paymentTransaction.updateMany({
        where: { razorpayPaymentId: paymentEntity.id },
        data: {
            status: 'failed',
        },
    });
    await DatabaseManager_1.prisma.paymentOrder.updateMany({
        where: { razorpayOrderId: paymentEntity.order_id },
        data: { status: 'failed' },
    });
    const paymentOrder = await DatabaseManager_1.prisma.paymentOrder.findFirst({
        where: { razorpayOrderId: paymentEntity.order_id },
    });
    if (!paymentOrder) {
        logger_1.logger.warn('Payment order not found for failed payment', {
            razorpayOrderId: paymentEntity.order_id,
        });
        return;
    }
    if (paymentOrder.orderId) {
        await DatabaseManager_1.prisma.order.update({
            where: { id: paymentOrder.orderId },
            data: {
                paymentStatus: 'failed',
                status: 'cancelled',
            },
        });
        logger_1.logger.info('Order status updated to cancelled due to payment failure', {
            orderId: paymentOrder.orderId,
            paymentId: paymentEntity.id,
        });
    }
    if (paymentOrder.subscriptionId) {
        const subscription = await DatabaseManager_1.prisma.subscription.findUnique({
            where: { id: paymentOrder.subscriptionId },
        });
        if (subscription) {
            const newDunningAttempts = subscription.dunningAttempts + 1;
            const shouldSuspend = newDunningAttempts >= subscription.maxDunningAttempts;
            await DatabaseManager_1.prisma.subscription.update({
                where: { id: paymentOrder.subscriptionId },
                data: {
                    dunningAttempts: newDunningAttempts,
                    status: shouldSuspend ? 'suspended' : subscription.status,
                    suspendedAt: shouldSuspend ? new Date() : undefined,
                },
            });
            logger_1.logger.info('Subscription dunning attempt recorded', {
                subscriptionId: paymentOrder.subscriptionId,
                dunningAttempts: newDunningAttempts,
                suspended: shouldSuspend,
            });
        }
    }
}
async function processRefundCreated(eventData) {
    const refundEntity = eventData.refund.entity;
    logger_1.logger.info('Processing refund.created event', {
        refundId: refundEntity.id,
        paymentId: refundEntity.payment_id,
        amount: refundEntity.amount,
    });
    const existingRefund = await DatabaseManager_1.prisma.paymentRefund.findUnique({
        where: { razorpayRefundId: refundEntity.id },
    });
    if (existingRefund) {
        logger_1.logger.info('Refund already exists, skipping creation', {
            refundId: refundEntity.id,
        });
        return;
    }
    const paymentTransaction = await DatabaseManager_1.prisma.paymentTransaction.findFirst({
        where: { razorpayPaymentId: refundEntity.payment_id },
    });
    if (!paymentTransaction) {
        logger_1.logger.warn('Payment transaction not found for refund', {
            paymentId: refundEntity.payment_id,
        });
        return;
    }
    await DatabaseManager_1.prisma.paymentRefund.create({
        data: {
            razorpayRefundId: refundEntity.id,
            paymentId: paymentTransaction.id,
            amount: refundEntity.amount,
            currency: refundEntity.currency,
            status: refundEntity.status,
            reason: 'webhook_refund',
            notes: JSON.stringify(refundEntity.notes || {}),
            processedAt: new Date(),
        },
    });
    await DatabaseManager_1.prisma.paymentTransaction.update({
        where: { id: paymentTransaction.id },
        data: {
            refundedAt: new Date(),
        },
    });
    logger_1.logger.info('Refund record created', {
        refundId: refundEntity.id,
        paymentId: refundEntity.payment_id,
    });
}
async function processWebhookEvent(eventType, eventData) {
    switch (eventType) {
        case 'payment.captured':
            await processPaymentCaptured(eventData);
            break;
        case 'payment.failed':
            await processPaymentFailed(eventData);
            break;
        case 'payment.authorized':
            logger_1.logger.info('Payment authorized (not captured yet)', {
                paymentId: eventData.payment.entity.id,
            });
            break;
        case 'order.paid':
            logger_1.logger.info('Order marked as paid', {
                orderId: eventData.order.entity.id,
            });
            break;
        case 'refund.created':
            await processRefundCreated(eventData);
            break;
        case 'refund.processed':
            logger_1.logger.info('Refund processed', {
                refundId: eventData.refund.entity.id,
            });
            break;
        default:
            logger_1.logger.warn('Unhandled webhook event type', { eventType });
    }
}
function validateWebhookSignature(body, signature, secret) {
    try {
        return razorpay_service_1.razorpayService.verifyWebhookSignature(body, signature, secret);
    }
    catch (error) {
        logger_1.logger.error('Webhook signature validation failed', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
}
const handler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 'Only POST method is allowed', 405);
        }
        const signature = event.headers['x-razorpay-signature'];
        if (!signature) {
            logger_1.logger.warn('Missing Razorpay signature header', { requestId });
            return (0, response_utils_1.createErrorResponse)('Missing signature', 'X-Razorpay-Signature header required', 400);
        }
        const { body } = event;
        if (!body) {
            return (0, response_utils_1.createErrorResponse)('Missing body', 'Request body required', 400);
        }
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            logger_1.logger.error('RAZORPAY_WEBHOOK_SECRET not configured');
            return (0, response_utils_1.createErrorResponse)('Configuration error', 'Webhook secret not configured', 500);
        }
        const isValidSignature = validateWebhookSignature(body, signature, webhookSecret);
        if (!isValidSignature) {
            logger_1.logger.warn('Invalid webhook signature', { requestId });
            return (0, response_utils_1.createErrorResponse)('Invalid signature', 'Webhook signature verification failed', 401);
        }
        const webhookData = JSON.parse(body);
        const eventType = webhookData.event;
        const webhookId = webhookData.id || `${webhookData.event}_${Date.now()}`;
        const eventData = webhookData;
        if (isWebhookProcessed(webhookId)) {
            logger_1.logger.warn('Duplicate webhook detected (replay attack prevention)', {
                webhookId,
                eventType,
                requestId,
            });
            return (0, response_utils_1.createSuccessResponse)({
                message: 'Webhook already processed',
            });
        }
        logger_1.logger.info('Received valid Razorpay webhook', {
            requestId,
            eventType,
            eventId: webhookData.id,
            webhookId,
        });
        if (!SUPPORTED_EVENTS.includes(eventType)) {
            logger_1.logger.info('Ignoring unsupported webhook event', { eventType, requestId });
            return (0, response_utils_1.createSuccessResponse)({
                message: 'Event type not supported, ignored',
            });
        }
        await processWebhookEvent(eventType, eventData);
        await DatabaseManager_1.prisma.auditLog.create({
            data: {
                entityType: 'Webhook',
                entityId: webhookData.id || webhookId,
                action: 'WEBHOOK_RECEIVED',
                changes: JSON.stringify({
                    eventType,
                    eventId: webhookData.id,
                    webhookId,
                    processedAt: new Date().toISOString(),
                }),
                userId: 'system',
                createdById: 'system',
                metadata: JSON.stringify({
                    source: 'razorpay',
                    signature: `${signature.substring(0, 10)}...`,
                    requestId,
                }),
            },
        });
        logger_1.logger.info('Webhook processed successfully', {
            requestId,
            eventType,
            eventId: webhookData.id,
            webhookId,
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Webhook processed successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Webhook processing failed', error, { requestId });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Webhook processing failed, but acknowledged',
        });
    }
    finally {
        await DatabaseManager_1.prisma.$disconnect();
    }
};
exports.handler = handler;
//# sourceMappingURL=webhook-handler.js.map