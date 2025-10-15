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
exports.paymentWebhookHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const database_service_1 = require("../shared/database.service");
const response_utils_1 = require("../shared/response.utils");
const crypto = __importStar(require("crypto"));
const zod_1 = require("zod");
const logger = logger_service_1.LoggerService.getInstance();
const db = database_service_1.LambdaDatabaseService.getInstance();
var WebhookEventType;
(function (WebhookEventType) {
    WebhookEventType["PAYMENT_AUTHORIZED"] = "payment.authorized";
    WebhookEventType["PAYMENT_CAPTURED"] = "payment.captured";
    WebhookEventType["PAYMENT_FAILED"] = "payment.failed";
    WebhookEventType["REFUND_CREATED"] = "refund.created";
    WebhookEventType["REFUND_PROCESSED"] = "refund.processed";
})(WebhookEventType || (WebhookEventType = {}));
const WEBHOOK_CONFIG = {
    MAX_BODY_SIZE: 1024 * 1024,
    PROCESSING_TIMEOUT: 25000,
    RATE_LIMIT_WINDOW: 60000,
    MAX_REQUESTS_PER_WINDOW: 100
};
const rateLimitStore = new Map();
function checkRateLimit(clientIP) {
    const now = Date.now();
    const key = `webhook_${clientIP}`;
    const current = rateLimitStore.get(key);
    if (!current || now > current.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + WEBHOOK_CONFIG.RATE_LIMIT_WINDOW });
        return { allowed: true };
    }
    if (current.count >= WEBHOOK_CONFIG.MAX_REQUESTS_PER_WINDOW) {
        const retryAfter = Math.ceil((current.resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }
    current.count++;
    return { allowed: true };
}
function verifyWebhookSignature(body, signature) {
    try {
        if (!signature || !body) {
            logger.error('Missing signature or body for webhook verification');
            return false;
        }
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret || webhookSecret.length < 32) {
            logger.error('Razorpay webhook secret not configured or too short');
            return false;
        }
        if (!signature.startsWith('sha256=') || signature.length !== 71) {
            logger.error('Invalid signature format');
            return false;
        }
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body, 'utf8')
            .digest('hex');
        const providedSignature = signature.slice(7);
        if (expectedSignature.length !== providedSignature.length) {
            return false;
        }
        let result = 0;
        for (let i = 0; i < expectedSignature.length; i++) {
            result |= expectedSignature.charCodeAt(i) ^ providedSignature.charCodeAt(i);
        }
        const isValid = result === 0;
        if (!isValid) {
            logger.warn('Webhook signature verification failed', {
                expectedLength: expectedSignature.length,
                providedLength: providedSignature.length,
                signaturePrefix: signature.substring(0, 15) + '...'
            });
        }
        return isValid;
    }
    catch (error) {
        logger.error('Webhook signature verification error', { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
}
const webhookPayloadSchema = zod_1.z.object({
    entity: zod_1.z.string().min(1),
    account_id: zod_1.z.string().min(1),
    event: zod_1.z.nativeEnum(WebhookEventType),
    contains: zod_1.z.array(zod_1.z.string()),
    payload: zod_1.z.object({
        payment: zod_1.z.object({ entity: zod_1.z.unknown() }).optional(),
        order: zod_1.z.object({ entity: zod_1.z.unknown() }).optional(),
        refund: zod_1.z.object({ entity: zod_1.z.unknown() }).optional()
    }),
    created_at: zod_1.z.number().positive()
});
function validatePayload(payload) {
    const errors = [];
    try {
        const validationResult = webhookPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            errors.push(...validationResult.error.issues.map(err => `${err.path.join('.')}: ${err.message}`));
        }
        const typedPayload = payload;
        if (typedPayload.created_at) {
            const maxAge = 300000;
            const now = Date.now();
            const payloadAge = now - (typedPayload.created_at * 1000);
            if (payloadAge > maxAge) {
                errors.push('Payload too old - possible replay attack');
            }
            if (payloadAge < -60000) {
                errors.push('Payload from future - possible replay attack');
            }
        }
        if (typedPayload.event && validationResult.success) {
            switch (typedPayload.event) {
                case WebhookEventType.PAYMENT_AUTHORIZED:
                case WebhookEventType.PAYMENT_CAPTURED:
                case WebhookEventType.PAYMENT_FAILED:
                    if (!typedPayload.payload?.payment?.entity) {
                        errors.push('Payment entity missing for payment event');
                    }
                    break;
                case WebhookEventType.REFUND_CREATED:
                case WebhookEventType.REFUND_PROCESSED:
                    if (!typedPayload.payload?.refund?.entity) {
                        errors.push('Refund entity missing for refund event');
                    }
                    break;
            }
        }
    }
    catch (error) {
        errors.push(`Payload validation error: ${error instanceof Error ? error.message : String(error)}`);
    }
    return { valid: errors.length === 0, errors };
}
async function handlePaymentAuthorized(paymentData) {
    const typedPaymentData = paymentData;
    const paymentId = typedPaymentData.id;
    logger.info('Processing payment authorized event', { paymentId });
    try {
        const paymentOrder = await db.prisma.paymentOrder.findUnique({
            where: { razorpayOrderId: typedPaymentData.order_id },
            select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                userId: true,
                orderId: true
            }
        });
        if (!paymentOrder) {
            logger.warn('Payment order not found for authorized payment', {
                paymentId,
                orderId: typedPaymentData.order_id
            });
            return;
        }
        const existingTransaction = await db.prisma.paymentTransaction.findUnique({
            where: { razorpayPaymentId: paymentId }
        });
        if (existingTransaction) {
            logger.info('Payment transaction already exists', { paymentId });
            return;
        }
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.prisma.paymentTransaction.create({
            data: {
                id: transactionId,
                paymentOrderId: paymentOrder.id,
                razorpayPaymentId: paymentId,
                amount: typedPaymentData.amount / 100,
                currency: typedPaymentData.currency || 'INR',
                status: 'authorized',
                method: typedPaymentData.method || 'unknown',
                gateway: 'razorpay',
                fees: JSON.stringify(typedPaymentData.fee ? { fee: typedPaymentData.fee } : {})
            }
        });
        await db.prisma.auditLog.create({
            data: {
                id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                entityType: 'payment_transaction',
                entityId: transactionId,
                action: 'payment_authorized',
                changes: JSON.stringify({
                    paymentId,
                    amount: typedPaymentData.amount,
                    method: typedPaymentData.method
                }),
                createdById: 'system-webhook-handler',
                ipAddress: 'webhook',
                userAgent: 'razorpay-webhook'
            }
        });
        logger.info('Payment authorized event processed successfully', {
            paymentId,
            transactionId,
            amount: typedPaymentData.amount
        });
    }
    catch (error) {
        logger.error('Failed to process payment authorized event', {
            paymentId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
async function handlePaymentCaptured(paymentData) {
    const typedPaymentData = paymentData;
    const paymentId = typedPaymentData.id;
    logger.info('Processing payment captured event', { paymentId });
    try {
        await db.prisma.$transaction(async (prisma) => {
            const paymentTransaction = await prisma.paymentTransaction.findUnique({
                where: { razorpayPaymentId: paymentId },
                include: {
                    paymentOrder: {
                        select: {
                            id: true,
                            orderId: true,
                            userId: true,
                            amount: true,
                            currency: true
                        }
                    }
                }
            });
            if (!paymentTransaction) {
                logger.warn('Payment transaction not found for captured payment', { paymentId });
                return;
            }
            await prisma.paymentTransaction.update({
                where: { id: paymentTransaction.id },
                data: {
                    status: 'captured',
                    capturedAt: new Date(),
                    fees: JSON.stringify({
                        ...JSON.parse(paymentTransaction.fees || '{}'),
                        capturedFee: typedPaymentData.fee || 0,
                        capturedAt: new Date().toISOString(),
                        captureId: typedPaymentData.id,
                        captureAmount: typedPaymentData.amount
                    })
                }
            });
            await prisma.paymentOrder.update({
                where: { id: paymentTransaction.paymentOrderId },
                data: {
                    status: 'paid'
                }
            });
            if (paymentTransaction.paymentOrder.orderId) {
                try {
                    await prisma.order.update({
                        where: { id: paymentTransaction.paymentOrder.orderId },
                        data: {
                            paymentStatus: 'paid',
                            status: 'confirmed',
                        }
                    });
                }
                catch (orderError) {
                    logger.warn('Failed to update order payment status', {
                        orderId: paymentTransaction.paymentOrder.orderId,
                        error: orderError instanceof Error ? orderError.message : String(orderError)
                    });
                }
            }
            await prisma.auditLog.create({
                data: {
                    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    entityType: 'payment_transaction',
                    entityId: paymentTransaction.id,
                    action: 'payment_captured',
                    changes: JSON.stringify({
                        paymentId,
                        amount: typedPaymentData.amount,
                        capturedAt: new Date().toISOString(),
                        orderId: paymentTransaction.paymentOrderId
                    }),
                    createdById: 'system-webhook-handler',
                    ipAddress: 'webhook',
                    userAgent: 'razorpay-webhook'
                }
            });
        });
        logger.info('Payment captured event processed successfully', {
            paymentId,
            amount: typedPaymentData.amount
        });
    }
    catch (error) {
        logger.error('Failed to process payment captured event', {
            paymentId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
async function handlePaymentFailed(paymentData) {
    const typedPaymentData = paymentData;
    const paymentId = typedPaymentData.id;
    const failureReason = typedPaymentData.error_description || typedPaymentData.error_reason || 'Payment failed';
    logger.info('Processing payment failed event', { paymentId, failureReason });
    try {
        await db.prisma.$transaction(async (prisma) => {
            const paymentOrder = await prisma.paymentOrder.findUnique({
                where: { razorpayOrderId: typedPaymentData.order_id },
                select: {
                    id: true,
                    amount: true,
                    currency: true,
                    userId: true,
                    orderId: true
                }
            });
            if (!paymentOrder) {
                logger.warn('Payment order not found for failed payment', {
                    paymentId,
                    orderId: typedPaymentData.order_id
                });
                return;
            }
            const existingTransaction = await prisma.paymentTransaction.findUnique({
                where: { razorpayPaymentId: paymentId }
            });
            if (existingTransaction) {
                await prisma.paymentTransaction.update({
                    where: { id: existingTransaction.id },
                    data: {
                        status: 'failed',
                    }
                });
            }
            else {
                const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await prisma.paymentTransaction.create({
                    data: {
                        id: transactionId,
                        paymentOrderId: paymentOrder.id,
                        razorpayPaymentId: paymentId,
                        amount: typedPaymentData.amount / 100,
                        currency: typedPaymentData.currency || 'INR',
                        status: 'failed',
                        method: typedPaymentData.method || 'unknown',
                        gateway: 'razorpay',
                        fees: JSON.stringify({}),
                    }
                });
            }
            await prisma.paymentOrder.update({
                where: { id: paymentOrder.id },
                data: {
                    status: 'failed'
                }
            });
            if (paymentOrder.orderId) {
                try {
                    await prisma.order.update({
                        where: { id: paymentOrder.orderId },
                        data: {
                            paymentStatus: 'failed',
                        }
                    });
                }
                catch (orderError) {
                    logger.warn('Failed to update order payment status', {
                        orderId: paymentOrder.orderId,
                        error: orderError instanceof Error ? orderError.message : String(orderError)
                    });
                }
            }
            await prisma.auditLog.create({
                data: {
                    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    entityType: 'payment_transaction',
                    entityId: existingTransaction?.id || `transaction_for_${paymentId}`,
                    action: 'payment_failed',
                    changes: JSON.stringify({
                        paymentId,
                        amount: typedPaymentData.amount,
                        failureReason,
                        errorCode: typedPaymentData.error_code,
                        failedAt: new Date().toISOString()
                    }),
                    createdById: 'system-webhook-handler',
                    ipAddress: 'webhook',
                    userAgent: 'razorpay-webhook'
                }
            });
        });
        logger.info('Payment failed event processed successfully', {
            paymentId,
            reason: failureReason
        });
    }
    catch (error) {
        logger.error('Failed to process payment failed event', {
            paymentId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
async function handleRefundEvent(refundData, eventType) {
    const typedRefundData = refundData;
    const refundId = typedRefundData.id;
    const paymentId = typedRefundData.payment_id;
    logger.info('Processing refund event', { refundId, eventType, paymentId });
    try {
        await db.prisma.$transaction(async (prisma) => {
            const paymentTransaction = await prisma.paymentTransaction.findUnique({
                where: { razorpayPaymentId: paymentId },
                select: {
                    id: true,
                    amount: true,
                    currency: true,
                    paymentOrderId: true,
                    status: true
                }
            });
            if (!paymentTransaction) {
                logger.warn('Payment transaction not found for refund', {
                    refundId,
                    paymentId
                });
                return;
            }
            const existingRefund = await prisma.paymentRefund.findUnique({
                where: { razorpayRefundId: refundId }
            });
            const refundAmount = typedRefundData.amount / 100;
            const isProcessed = eventType === WebhookEventType.REFUND_PROCESSED;
            if (existingRefund) {
                await prisma.paymentRefund.update({
                    where: { id: existingRefund.id },
                    data: {
                        status: typedRefundData.status,
                        processedAt: isProcessed ? new Date() : existingRefund.processedAt,
                    }
                });
            }
            else {
                const refundTransactionId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await prisma.paymentRefund.create({
                    data: {
                        id: refundTransactionId,
                        razorpayRefundId: refundId,
                        paymentId: paymentTransaction.id,
                        amount: refundAmount,
                        currency: typedRefundData.currency || 'INR',
                        status: typedRefundData.status,
                        reason: typedRefundData.reason || 'customer_request',
                        processedAt: isProcessed ? new Date() : null,
                    }
                });
            }
            if (isProcessed) {
                await prisma.paymentTransaction.update({
                    where: { id: paymentTransaction.id },
                    data: {
                        status: 'refunded',
                        refundedAt: new Date(),
                    }
                });
            }
            await prisma.auditLog.create({
                data: {
                    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    entityType: 'payment_refund',
                    entityId: existingRefund?.id || refundId,
                    action: `refund_${eventType.split('.')[1]}`,
                    changes: JSON.stringify({
                        refundId,
                        paymentId,
                        amount: typedRefundData.amount,
                        status: typedRefundData.status,
                        eventType,
                        processedAt: isProcessed ? new Date().toISOString() : null
                    }),
                    createdById: 'system-webhook-handler',
                    ipAddress: 'webhook',
                    userAgent: 'razorpay-webhook'
                }
            });
        });
        logger.info('Refund event processed successfully', {
            refundId,
            amount: typedRefundData.amount,
            status: typedRefundData.status,
            eventType
        });
    }
    catch (error) {
        logger.error('Failed to process refund event', {
            refundId,
            eventType,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
async function processWebhookEvent(payload) {
    const eventType = payload.event;
    const eventStartTime = Date.now();
    try {
        logger.info('Processing webhook event', {
            eventType,
            accountId: payload.account_id,
            entityId: payload.payload.payment?.entity?.id || payload.payload.refund?.entity?.id
        });
        switch (eventType) {
            case WebhookEventType.PAYMENT_AUTHORIZED:
                if (payload.payload.payment?.entity) {
                    await handlePaymentAuthorized(payload.payload.payment.entity);
                }
                else {
                    throw new Error('Payment entity missing for payment.authorized event');
                }
                break;
            case WebhookEventType.PAYMENT_CAPTURED:
                if (payload.payload.payment?.entity) {
                    await handlePaymentCaptured(payload.payload.payment.entity);
                }
                else {
                    throw new Error('Payment entity missing for payment.captured event');
                }
                break;
            case WebhookEventType.PAYMENT_FAILED:
                if (payload.payload.payment?.entity) {
                    await handlePaymentFailed(payload.payload.payment.entity);
                }
                else {
                    throw new Error('Payment entity missing for payment.failed event');
                }
                break;
            case WebhookEventType.REFUND_CREATED:
            case WebhookEventType.REFUND_PROCESSED:
                if (payload.payload.refund?.entity) {
                    await handleRefundEvent(payload.payload.refund.entity, eventType);
                }
                else {
                    throw new Error('Refund entity missing for refund event');
                }
                break;
            default:
                logger.warn('Unhandled webhook event type', {
                    eventType,
                    availableEvents: Object.values(WebhookEventType)
                });
                break;
        }
        const eventDuration = Date.now() - eventStartTime;
        logger.info('Webhook event processed successfully', {
            eventType,
            duration: `${eventDuration}ms`
        });
    }
    catch (error) {
        const eventDuration = Date.now() - eventStartTime;
        logger.error('Webhook event processing failed', {
            eventType,
            duration: `${eventDuration}ms`,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
const paymentWebhookHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
        const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
        const requestPath = event.path || '/payments/webhook';
        logger.info('Webhook request received', {
            requestId,
            clientIP,
            userAgent,
            path: requestPath,
            method: event.httpMethod
        });
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed', undefined, 'METHOD_NOT_ALLOWED');
        }
        const rateLimitResult = checkRateLimit(clientIP);
        if (!rateLimitResult.allowed) {
            logger.warn('Rate limit exceeded for webhook', { clientIP, requestId });
            return (0, response_utils_1.createErrorResponse)(429, 'Rate limit exceeded', rateLimitResult.retryAfter ? { 'Retry-After': rateLimitResult.retryAfter.toString() } : {}, 'RATE_LIMIT_EXCEEDED');
        }
        const body = event.body;
        if (!body || body.trim().length === 0) {
            logger.error('Webhook request missing body', { requestId, clientIP });
            return (0, response_utils_1.createErrorResponse)(400, 'Request body is required', undefined, 'MISSING_BODY');
        }
        if (body.length > WEBHOOK_CONFIG.MAX_BODY_SIZE) {
            logger.error('Webhook request body too large', {
                requestId,
                bodySize: body.length,
                maxSize: WEBHOOK_CONFIG.MAX_BODY_SIZE,
                clientIP
            });
            return (0, response_utils_1.createErrorResponse)(413, 'Request body too large', undefined, 'PAYLOAD_TOO_LARGE');
        }
        const signature = event.headers['x-razorpay-signature'] ||
            event.headers['X-Razorpay-Signature'] ||
            event.headers['X-RAZORPAY-SIGNATURE'];
        if (!signature || typeof signature !== 'string') {
            logger.error('Missing webhook signature', {
                requestId,
                headers: Object.keys(event.headers),
                clientIP
            });
            return (0, response_utils_1.createErrorResponse)(401, 'Missing webhook signature', undefined, 'MISSING_SIGNATURE');
        }
        const isValidSignature = verifyWebhookSignature(body, signature);
        if (!isValidSignature) {
            logger.error('Invalid webhook signature', {
                requestId,
                signatureProvided: !!signature,
                bodyLength: body.length,
                clientIP
            });
            return (0, response_utils_1.createErrorResponse)(401, 'Invalid webhook signature', undefined, 'INVALID_SIGNATURE');
        }
        let payload;
        try {
            payload = JSON.parse(body);
        }
        catch (parseError) {
            logger.error('Failed to parse webhook payload', {
                requestId,
                body: body.substring(0, 100) + '...',
                error: parseError instanceof Error ? parseError.message : String(parseError),
                clientIP
            });
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid JSON payload', undefined, 'INVALID_JSON');
        }
        const validation = validatePayload(payload);
        if (!validation.valid) {
            logger.error('Invalid webhook payload', {
                requestId,
                errors: validation.errors,
                eventType: payload.event,
                clientIP
            });
            return (0, response_utils_1.createErrorResponse)(400, `Invalid payload: ${validation.errors.join(', ')}`, undefined, 'INVALID_PAYLOAD');
        }
        logger.info('Processing Razorpay webhook', {
            requestId,
            eventType: payload.event,
            paymentId: payload.payload.payment?.entity?.id,
            orderId: payload.payload.payment?.entity?.order_id,
            amount: payload.payload.payment?.entity?.amount,
            clientIP,
            accountId: payload.account_id
        });
        const processingPromise = processWebhookEvent(payload);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Webhook processing timeout')), WEBHOOK_CONFIG.PROCESSING_TIMEOUT);
        });
        await Promise.race([processingPromise, timeoutPromise]);
        const duration = Date.now() - startTime;
        logger.info('Webhook processed successfully', {
            requestId,
            eventType: payload.event,
            duration: `${duration}ms`,
            clientIP
        });
        return (0, response_utils_1.createSuccessResponse)({
            success: true,
            eventType: payload.event,
            processedAt: new Date().toISOString()
        }, 'Webhook processed successfully', 200);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Webhook processing failed', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: `${duration}ms`,
            stack: error instanceof Error ? error.stack : undefined,
            clientIP: event.requestContext?.identity?.sourceIp
        });
        if (error instanceof Error) {
            if (error instanceof Error ? error.message : String(error) === 'Webhook processing timeout') {
                return (0, response_utils_1.createErrorResponse)(408, 'Processing timeout', undefined, 'PROCESSING_TIMEOUT');
            }
            if (error instanceof Error ? error.message : String(error).includes('signature')) {
                return (0, response_utils_1.createErrorResponse)(401, 'Authentication failed', undefined, 'AUTH_FAILED');
            }
            if (error instanceof Error ? error.message : String(error).includes('rate limit')) {
                return (0, response_utils_1.createErrorResponse)(429, 'Rate limit exceeded', undefined, 'RATE_LIMITED');
            }
            if (error instanceof Error ? error.message : String(error).includes('validation')) {
                return (0, response_utils_1.createErrorResponse)(400, 'Validation failed', undefined, 'VALIDATION_ERROR');
            }
        }
        return (0, response_utils_1.handleError)(error, requestId);
    }
};
exports.paymentWebhookHandler = paymentWebhookHandler;
//# sourceMappingURL=webhook.js.map