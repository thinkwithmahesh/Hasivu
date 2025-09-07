"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.webhookHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const database_service_1 = require("../shared/database.service");
const crypto = __importStar(require("crypto"));
const node_timers_1 = require("node:timers");
const logger = logger_service_1.LoggerService.getInstance();
const database = database_service_1.LambdaDatabaseService.getInstance();
var WebhookEventType;
(function (WebhookEventType) {
    WebhookEventType["PAYMENT_CAPTURED"] = "payment.captured";
    WebhookEventType["PAYMENT_FAILED"] = "payment.failed";
    WebhookEventType["PAYMENT_AUTHORIZED"] = "payment.authorized";
    WebhookEventType["ORDER_PAID"] = "order.paid";
    WebhookEventType["REFUND_CREATED"] = "refund.created";
    WebhookEventType["REFUND_PROCESSED"] = "refund.processed";
    WebhookEventType["SUBSCRIPTION_ACTIVATED"] = "subscription.activated";
    WebhookEventType["SUBSCRIPTION_CHARGED"] = "subscription.charged";
})(WebhookEventType || (WebhookEventType = {}));
function verifyWebhookSignature(signature, body, secret, requestId) {
    try {
        if (!signature || !body || !secret) {
            logger.warn('Webhook signature verification failed - missing parameters', {
                requestId,
                hasSignature: !!signature,
                hasBody: !!body,
                hasSecret: !!secret,
                action: 'signature_verification_failed',
                reason: 'missing_parameters'
            });
            return false;
        }
        const cleanSignature = signature.startsWith('sha256=') ? signature.slice(7) : signature;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body, 'utf8')
            .digest('hex');
        const isValid = crypto.timingSafeEqual(Buffer.from(cleanSignature, 'hex'), Buffer.from(expectedSignature, 'hex'));
        if (!isValid) {
            logger.warn('Webhook signature verification failed', {
                requestId,
                providedSignature: cleanSignature.substring(0, 8) + '...',
                expectedSignature: expectedSignature.substring(0, 8) + '...',
                action: 'signature_verification_failed',
                reason: 'signature_mismatch'
            });
        }
        else {
            logger.info('Webhook signature verification successful', {
                requestId,
                action: 'signature_verified'
            });
        }
        return isValid;
    }
    catch (error) {
        logger.error('Error during webhook signature verification', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'signature_verification_error'
        });
        return false;
    }
}
async function processPaymentCaptured(payload, requestId) {
    try {
        const payment = payload.payment?.entity;
        if (!payment) {
            throw new Error('Payment entity not found in webhook payload');
        }
        const { id: paymentId, order_id: razorpayOrderId, amount, currency, status } = payment;
        logger.info('Processing payment captured webhook', {
            requestId,
            paymentId,
            razorpayOrderId,
            amount,
            status,
            action: 'process_payment_captured'
        });
        const paymentOrder = await database.prisma.paymentOrder.findUnique({
            where: { razorpayOrderId },
            select: {
                id: true,
                userId: true,
                orderId: true,
                amount: true,
                status: true
            }
        });
        if (!paymentOrder) {
            throw new Error(`Payment order not found for Razorpay order ID: ${razorpayOrderId}`);
        }
        await database.prisma.paymentTransaction.upsert({
            where: { razorpayPaymentId: paymentId },
            create: {
                id: crypto.randomUUID(),
                razorpayPaymentId: paymentId,
                paymentOrderId: paymentOrder.id,
                amount: amount,
                currency: currency || 'INR',
                status: 'captured',
                method: payment.method || 'unknown',
                gateway: 'razorpay',
                fees: JSON.stringify(payment.fee || {}),
                capturedAt: new Date()
            },
            update: {
                status: 'captured',
                capturedAt: new Date(),
                updatedAt: new Date()
            }
        });
        await database.prisma.paymentOrder.update({
            where: { id: paymentOrder.id },
            data: {
                status: 'completed',
                updatedAt: new Date()
            }
        });
        if (paymentOrder.orderId) {
            await database.prisma.order.update({
                where: { id: paymentOrder.orderId },
                data: {
                    paymentStatus: 'paid',
                    status: 'confirmed',
                    updatedAt: new Date()
                }
            });
            logger.info('Updated meal order status to confirmed', {
                requestId,
                orderId: paymentOrder.orderId,
                paymentId,
                action: 'order_confirmed'
            });
        }
        logger.info('Payment captured webhook processed successfully', {
            requestId,
            paymentId,
            paymentOrderId: paymentOrder.id,
            orderId: paymentOrder.orderId,
            amount,
            action: 'payment_captured_success'
        });
        return {
            success: true,
            eventType: 'payment.captured',
            processedAt: new Date(),
            entityId: paymentId,
            status: 'captured',
            message: 'Payment captured and order confirmed'
        };
    }
    catch (error) {
        logger.error('Error processing payment captured webhook', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'payment_captured_error'
        });
        return {
            success: false,
            eventType: 'payment.captured',
            processedAt: new Date(),
            entityId: '',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function processPaymentFailed(payload, requestId) {
    try {
        const payment = payload.payment?.entity;
        if (!payment) {
            throw new Error('Payment entity not found in webhook payload');
        }
        const { id: paymentId, order_id: razorpayOrderId, amount, currency, status, error_code: errorCode, error_description: errorDescription } = payment;
        logger.info('Processing payment failed webhook', {
            requestId,
            paymentId,
            razorpayOrderId,
            amount,
            status,
            errorCode,
            action: 'process_payment_failed'
        });
        const paymentOrder = await database.prisma.paymentOrder.findUnique({
            where: { razorpayOrderId },
            select: {
                id: true,
                userId: true,
                orderId: true,
                amount: true,
                status: true
            }
        });
        if (!paymentOrder) {
            throw new Error(`Payment order not found for Razorpay order ID: ${razorpayOrderId}`);
        }
        await database.prisma.paymentTransaction.upsert({
            where: { razorpayPaymentId: paymentId },
            create: {
                id: crypto.randomUUID(),
                razorpayPaymentId: paymentId,
                paymentOrderId: paymentOrder.id,
                amount: amount,
                currency: currency || 'INR',
                status: 'failed',
                method: payment.method || 'unknown',
                gateway: 'razorpay',
                fees: JSON.stringify({}),
                refundedAt: null,
                capturedAt: null
            },
            update: {
                status: 'failed',
                updatedAt: new Date()
            }
        });
        await database.prisma.paymentOrder.update({
            where: { id: paymentOrder.id },
            data: {
                status: 'failed',
                updatedAt: new Date()
            }
        });
        if (paymentOrder.orderId) {
            await database.prisma.order.update({
                where: { id: paymentOrder.orderId },
                data: {
                    paymentStatus: 'failed',
                    status: 'pending',
                    updatedAt: new Date()
                }
            });
            logger.info('Updated meal order status to pending due to payment failure', {
                requestId,
                orderId: paymentOrder.orderId,
                paymentId,
                errorCode,
                action: 'order_payment_failed'
            });
        }
        logger.info('Payment failed webhook processed successfully', {
            requestId,
            paymentId,
            paymentOrderId: paymentOrder.id,
            orderId: paymentOrder.orderId,
            errorCode,
            errorDescription,
            action: 'payment_failed_processed'
        });
        return {
            success: true,
            eventType: 'payment.failed',
            processedAt: new Date(),
            entityId: paymentId,
            status: 'failed',
            message: `Payment failed: ${errorDescription || errorCode}`
        };
    }
    catch (error) {
        logger.error('Error processing payment failed webhook', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'payment_failed_error'
        });
        return {
            success: false,
            eventType: 'payment.failed',
            processedAt: new Date(),
            entityId: '',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function processRefundCreated(payload, requestId) {
    try {
        const refund = payload.refund?.entity;
        if (!refund) {
            throw new Error('Refund entity not found in webhook payload');
        }
        const { id: refundId, payment_id: paymentId, amount, currency, status, notes } = refund;
        logger.info('Processing refund created webhook', {
            requestId,
            refundId,
            paymentId,
            amount,
            status,
            action: 'process_refund_created'
        });
        const paymentTransaction = await database.prisma.paymentTransaction.findUnique({
            where: { razorpayPaymentId: paymentId },
            select: {
                id: true,
                paymentOrderId: true,
                amount: true
            }
        });
        if (!paymentTransaction) {
            throw new Error(`Payment transaction not found for payment ID: ${paymentId}`);
        }
        await database.prisma.paymentRefund.create({
            data: {
                id: crypto.randomUUID(),
                razorpayRefundId: refundId,
                paymentId: paymentTransaction.id,
                amount: amount,
                currency: currency || 'INR',
                status: status || 'pending',
                reason: 'Customer requested refund',
                notes: JSON.stringify(notes || {}),
                processedAt: new Date()
            }
        });
        await database.prisma.paymentTransaction.update({
            where: { id: paymentTransaction.id },
            data: {
                refundedAt: new Date(),
                updatedAt: new Date()
            }
        });
        logger.info('Refund created webhook processed successfully', {
            requestId,
            refundId,
            paymentId,
            amount,
            action: 'refund_created_success'
        });
        return {
            success: true,
            eventType: 'refund.created',
            processedAt: new Date(),
            entityId: refundId,
            status: 'created',
            message: 'Refund created successfully'
        };
    }
    catch (error) {
        logger.error('Error processing refund created webhook', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'refund_created_error'
        });
        return {
            success: false,
            eventType: 'refund.created',
            processedAt: new Date(),
            entityId: '',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function processWebhookEvent(payload, requestId) {
    const eventType = payload.event;
    switch (eventType) {
        case WebhookEventType.PAYMENT_CAPTURED:
            return await processPaymentCaptured(payload.payload, requestId);
        case WebhookEventType.PAYMENT_FAILED:
            return await processPaymentFailed(payload.payload, requestId);
        case WebhookEventType.REFUND_CREATED:
            return await processRefundCreated(payload.payload, requestId);
        case WebhookEventType.PAYMENT_AUTHORIZED:
            logger.info('Payment authorized event received - no processing required', {
                requestId,
                eventType,
                action: 'payment_authorized_acknowledged'
            });
            return {
                success: true,
                eventType: 'payment.authorized',
                processedAt: new Date(),
                entityId: payload.payload.payment?.entity?.id || '',
                status: 'authorized',
                message: 'Payment authorization acknowledged'
            };
        default:
            logger.warn('Unhandled webhook event type', {
                requestId,
                eventType,
                action: 'unhandled_webhook_event'
            });
            return {
                success: true,
                eventType: eventType,
                processedAt: new Date(),
                entityId: '',
                message: `Unhandled event type: ${eventType}`
            };
    }
}
const webhookHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
        const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
        logger.info('Webhook processing request started', {
            requestId,
            method: event.httpMethod,
            path: event.path,
            clientIP,
            userAgent: userAgent.substring(0, 200),
            action: 'webhook_request_started'
        });
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed', undefined, 'METHOD_NOT_ALLOWED', requestId);
        }
        if (!event.body) {
            logger.warn('Webhook request received without body', {
                requestId,
                clientIP,
                action: 'webhook_validation_failed',
                reason: 'missing_body'
            });
            return (0, response_utils_1.createErrorResponse)(400, 'Request body is required', undefined, 'MISSING_BODY', requestId);
        }
        const signature = event.headers['X-Razorpay-Signature'] || event.headers['x-razorpay-signature'];
        if (!signature) {
            logger.warn('Webhook request received without signature', {
                requestId,
                clientIP,
                action: 'webhook_validation_failed',
                reason: 'missing_signature'
            });
            return (0, response_utils_1.createErrorResponse)(400, 'Webhook signature is required', undefined, 'MISSING_SIGNATURE', requestId);
        }
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            logger.error('Razorpay webhook secret not configured', {
                requestId,
                action: 'webhook_configuration_error',
                reason: 'missing_webhook_secret'
            });
            return (0, response_utils_1.createErrorResponse)(500, 'Webhook processing not properly configured', undefined, 'CONFIGURATION_ERROR', requestId);
        }
        if (!verifyWebhookSignature(signature, event.body, webhookSecret, requestId)) {
            logger.warn('Webhook signature verification failed', {
                requestId,
                clientIP,
                action: 'webhook_security_failed',
                reason: 'invalid_signature'
            });
            return (0, response_utils_1.createErrorResponse)(401, 'Invalid webhook signature', undefined, 'INVALID_SIGNATURE', requestId);
        }
        let webhookPayload;
        try {
            webhookPayload = JSON.parse(event.body);
        }
        catch (error) {
            logger.warn('Failed to parse webhook payload JSON', {
                requestId,
                clientIP,
                error: error instanceof Error ? error.message : 'Parse error',
                action: 'webhook_validation_failed',
                reason: 'invalid_json'
            });
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid JSON payload', undefined, 'INVALID_JSON', requestId);
        }
        if (!webhookPayload.event || !webhookPayload.payload) {
            logger.warn('Webhook payload missing required fields', {
                requestId,
                hasEvent: !!webhookPayload.event,
                hasPayload: !!webhookPayload.payload,
                action: 'webhook_validation_failed',
                reason: 'missing_required_fields'
            });
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid webhook payload format', undefined, 'INVALID_PAYLOAD', requestId);
        }
        const timeoutPromise = new Promise((_, reject) => {
            (0, node_timers_1.setTimeout)(() => {
                reject(new Error('Webhook processing timeout'));
            }, 25000);
        });
        const processingPromise = processWebhookEvent(webhookPayload, requestId);
        const result = await Promise.race([processingPromise, timeoutPromise]);
        const processingTime = Date.now() - startTime;
        if (result.success) {
            logger.info('Webhook processed successfully', {
                requestId,
                eventType: result.eventType,
                entityId: result.entityId,
                status: result.status,
                processingTime,
                action: 'webhook_processed_success'
            });
            return (0, response_utils_1.createSuccessResponse)({
                message: 'Webhook processed successfully',
                eventType: result.eventType,
                entityId: result.entityId,
                processedAt: result.processedAt,
                processingTime
            }, requestId);
        }
        else {
            logger.error('Webhook processing failed', {
                requestId,
                eventType: result.eventType,
                error: result.error,
                processingTime,
                action: 'webhook_processing_failed'
            });
            return (0, response_utils_1.createErrorResponse)(500, 'Webhook processing failed', { error: result.error, eventType: result.eventType }, 'PROCESSING_FAILED', requestId);
        }
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        logger.error('Webhook handler error', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            processingTime,
            action: 'webhook_handler_error'
        });
        return (0, response_utils_1.createErrorResponse)(500, 'Internal server error during webhook processing', { error: error instanceof Error ? error.message : 'Unknown error' }, 'INTERNAL_ERROR', requestId);
    }
};
exports.webhookHandler = webhookHandler;
exports.handler = exports.webhookHandler;
//# sourceMappingURL=webhook-handler.js.map