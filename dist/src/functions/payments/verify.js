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
exports.paymentVerificationHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const database_service_1 = require("../shared/database.service");
const response_utils_1 = require("../shared/response.utils");
const crypto = __importStar(require("crypto"));
const zod_1 = require("zod");
const logger = logger_service_1.LoggerService.getInstance();
const validator = validation_service_1.ValidationService.getInstance();
const db = database_service_1.LambdaDatabaseService.getInstance();
const paymentVerificationSchema = zod_1.z.object({
    razorpayOrderId: zod_1.z.string().min(1, 'Razorpay order ID is required'),
    razorpayPaymentId: zod_1.z.string().min(1, 'Razorpay payment ID is required'),
    razorpaySignature: zod_1.z.string().min(1, 'Razorpay signature is required'),
    additionalData: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    orderId: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive().optional(),
    currency: zod_1.z.string().length(3).optional()
});
async function validatePaymentOrder(razorpayOrderId) {
    try {
        const paymentOrder = await db.prisma.paymentOrder.findUnique({
            where: { razorpayOrderId }
        });
        if (!paymentOrder) {
            throw new Error('Payment order not found');
        }
        if (paymentOrder.status === 'paid') {
            throw new Error('Payment order is already paid');
        }
        if (paymentOrder.status === 'cancelled') {
            throw new Error('Payment order is cancelled');
        }
        if (paymentOrder.status === 'expired') {
            throw new Error('Payment order has expired');
        }
        if (paymentOrder.expiresAt && paymentOrder.expiresAt < new Date()) {
            throw new Error('Payment order has expired');
        }
        return paymentOrder;
    }
    catch (error) {
        logger.error('Payment order validation failed', {
            razorpayOrderId,
            error: error.message
        });
        throw error;
    }
}
function verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    try {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret || secret.length < 32) {
            logger.error('Razorpay key secret not configured or too short');
            return false;
        }
        if (!razorpaySignature || typeof razorpaySignature !== 'string') {
            logger.error('Invalid signature format');
            return false;
        }
        const body = `${razorpayOrderId}|${razorpayPaymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body, 'utf8')
            .digest('hex');
        if (expectedSignature.length !== razorpaySignature.length) {
            return false;
        }
        let result = 0;
        for (let i = 0; i < expectedSignature.length; i++) {
            result |= expectedSignature.charCodeAt(i) ^ razorpaySignature.charCodeAt(i);
        }
        const isValid = result === 0;
        if (!isValid) {
            logger.warn('Payment signature verification failed', {
                razorpayOrderId,
                razorpayPaymentId,
                expectedLength: expectedSignature.length,
                providedLength: razorpaySignature.length
            });
        }
        return isValid;
    }
    catch (error) {
        logger.error('Payment signature verification error', {
            error: error.message,
            razorpayOrderId,
            razorpayPaymentId
        });
        return false;
    }
}
async function checkDuplicatePayment(razorpayPaymentId) {
    try {
        const existingTransaction = await db.prisma.paymentTransaction.findFirst({
            where: {
                razorpayPaymentId: razorpayPaymentId
            },
            select: {
                id: true,
                status: true,
                createdAt: true
            }
        });
        if (existingTransaction) {
            logger.warn('Duplicate payment detection', {
                razorpayPaymentId,
                existingTransactionId: existingTransaction.id,
                existingStatus: existingTransaction.status,
                createdAt: existingTransaction.createdAt
            });
            return true;
        }
        return false;
    }
    catch (error) {
        logger.error('Error checking duplicate payment', {
            razorpayPaymentId,
            error: error.message
        });
        throw error;
    }
}
async function createPaymentTransaction(paymentOrder, razorpayPaymentId, additionalData) {
    try {
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const paymentTransaction = await db.prisma.paymentTransaction.create({
            data: {
                id: transactionId,
                paymentOrderId: paymentOrder.id,
                razorpayPaymentId: razorpayPaymentId,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency || 'INR',
                status: 'captured',
                method: 'online',
                gateway: 'razorpay',
                capturedAt: new Date(),
                fees: JSON.stringify({
                    gatewayFee: 0,
                    taxes: 0,
                    platformFee: 0
                })
            }
        });
        logger.info('Payment transaction created successfully', {
            transactionId,
            paymentOrderId: paymentOrder.id,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            razorpayPaymentId
        });
        return paymentTransaction;
    }
    catch (error) {
        logger.error('Failed to create payment transaction', {
            paymentOrderId: paymentOrder.id,
            razorpayPaymentId,
            error: error.message
        });
        throw error;
    }
}
async function updatePaymentOrderStatus(paymentOrderId, status, userId) {
    try {
        const updatedPaymentOrder = await db.prisma.paymentOrder.update({
            where: { id: paymentOrderId },
            data: {
                status
            }
        });
        logger.info('Payment order status updated successfully', {
            paymentOrderId,
            status,
            updatedBy: userId || 'payment-verification'
        });
        return updatedPaymentOrder;
    }
    catch (error) {
        logger.error('Failed to update payment order status', {
            paymentOrderId,
            status,
            error: error.message
        });
        throw error;
    }
}
async function updateMealOrderStatus(orderId, userId) {
    try {
        const updatedOrder = await db.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'confirmed'
            }
        });
        logger.info('Meal order status updated to paid successfully', {
            orderId,
            status: updatedOrder.status
        });
        return updatedOrder;
    }
    catch (error) {
        logger.warn('Failed to update meal order status', {
            orderId,
            error: error.message
        });
        return null;
    }
}
async function createAuditLog(paymentOrder, paymentTransaction, userId) {
    try {
        await db.prisma.auditLog.create({
            data: {
                id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                entityType: 'payment_verification',
                entityId: paymentTransaction.id,
                action: 'payment_verified',
                changes: JSON.stringify({
                    paymentOrderId: paymentOrder.id,
                    razorpayOrderId: paymentOrder.razorpayOrderId,
                    razorpayPaymentId: paymentTransaction.razorpayPaymentId,
                    amount: paymentOrder.amount,
                    currency: paymentOrder.currency,
                    status: 'verified',
                    verifiedAt: new Date().toISOString()
                }),
                userId: userId || null,
                createdById: userId || 'system-payment-verification',
                ipAddress: 'lambda-function',
                userAgent: 'payment-verification-lambda'
            }
        });
        logger.info('Payment verification audit log created', {
            paymentOrderId: paymentOrder.id,
            transactionId: paymentTransaction.id
        });
    }
    catch (error) {
        logger.error('Failed to create payment verification audit log', {
            error: error.message,
            paymentOrderId: paymentOrder.id,
            transactionId: paymentTransaction.id
        });
    }
}
async function sendPaymentNotification(paymentOrder, paymentTransaction) {
    try {
        logger.info('Payment confirmation notification created', {
            paymentOrderId: paymentOrder.id,
            userId: paymentOrder.userId,
            amount: paymentOrder.amount
        });
    }
    catch (error) {
        logger.error('Failed to send payment notification', {
            error: error.message,
            paymentOrderId: paymentOrder.id
        });
    }
}
async function processPaymentVerification(verificationData, userId) {
    try {
        return await db.prisma.$transaction(async (prisma) => {
            const paymentOrder = await validatePaymentOrder(verificationData.razorpayOrderId);
            const isSignatureValid = verifyRazorpaySignature(verificationData.razorpayOrderId, verificationData.razorpayPaymentId, verificationData.razorpaySignature);
            if (!isSignatureValid) {
                throw new Error('Invalid payment signature - authentication failed');
            }
            const isDuplicate = await checkDuplicatePayment(verificationData.razorpayPaymentId);
            if (isDuplicate) {
                throw new Error('Payment ID already processed - duplicate payment detected');
            }
            const paymentTransaction = await createPaymentTransaction(paymentOrder, verificationData.razorpayPaymentId, verificationData.additionalData);
            const updatedPaymentOrder = await updatePaymentOrderStatus(paymentOrder.id, 'paid', userId);
            let updatedOrder = null;
            if (paymentOrder.orderId) {
                updatedOrder = await updateMealOrderStatus(paymentOrder.orderId, userId);
            }
            setImmediate(() => {
                createAuditLog(paymentOrder, paymentTransaction, userId);
                sendPaymentNotification(paymentOrder, paymentTransaction);
            });
            return {
                success: true,
                paymentOrderId: paymentOrder.id,
                razorpayOrderId: verificationData.razorpayOrderId,
                razorpayPaymentId: verificationData.razorpayPaymentId,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency || 'INR',
                status: 'verified',
                verifiedAt: new Date().toISOString(),
                paymentTransaction: {
                    id: paymentTransaction.id,
                    status: paymentTransaction.status,
                    capturedAt: paymentTransaction.capturedAt.toISOString()
                },
                order: updatedOrder ? {
                    id: updatedOrder.id,
                    status: updatedOrder.status
                } : undefined
            };
        });
    }
    catch (error) {
        logger.error('Payment verification processing failed', {
            razorpayOrderId: verificationData.razorpayOrderId,
            razorpayPaymentId: verificationData.razorpayPaymentId,
            error: error.message
        });
        throw error;
    }
}
const paymentVerificationHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Payment verification request started', {
            requestId,
            method: event.httpMethod
        });
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed', undefined, 'METHOD_NOT_ALLOWED', requestId);
        }
        const requestBody = JSON.parse(event.body || '{}');
        if (!requestBody) {
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid request body', undefined, 'INVALID_REQUEST_BODY', requestId);
        }
        const validatedData = paymentVerificationSchema.parse(requestBody);
        logger.info('Processing payment verification', {
            requestId,
            razorpayOrderId: validatedData.razorpayOrderId,
            razorpayPaymentId: validatedData.razorpayPaymentId
        });
        let authenticatedUser;
        const result = await processPaymentVerification(validatedData, authenticatedUser?.userId);
        const duration = Date.now() - startTime;
        logger.info('Payment verification completed successfully', {
            requestId,
            paymentOrderId: result.paymentOrderId,
            razorpayPaymentId: result.razorpayPaymentId,
            amount: result.amount,
            duration: `${duration}ms`
        });
        return (0, response_utils_1.createSuccessResponse)({
            verification: result,
            message: 'Payment verified successfully'
        }, 'Payment verified successfully', 200, requestId);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Payment verification request failed', {
            requestId,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack
        });
        if (error instanceof Error) {
            if (error.message.includes('signature')) {
                return (0, response_utils_1.createErrorResponse)(401, 'Payment signature validation failed', undefined, 'INVALID_SIGNATURE', requestId);
            }
            if (error.message.includes('duplicate')) {
                return (0, response_utils_1.createErrorResponse)(409, 'Payment already processed', undefined, 'DUPLICATE_PAYMENT', requestId);
            }
            if (error.message.includes('not found')) {
                return (0, response_utils_1.createErrorResponse)(404, 'Payment order not found', undefined, 'ORDER_NOT_FOUND', requestId);
            }
            if (error.message.includes('expired')) {
                return (0, response_utils_1.createErrorResponse)(400, 'Payment order has expired', undefined, 'ORDER_EXPIRED', requestId);
            }
            if (error.message.includes('already paid')) {
                return (0, response_utils_1.createErrorResponse)(400, 'Payment order is already paid', undefined, 'ALREADY_PAID', requestId);
            }
        }
        return (0, response_utils_1.handleError)(error, 'Payment verification failed', 500, requestId);
    }
};
exports.paymentVerificationHandler = paymentVerificationHandler;
//# sourceMappingURL=verify.js.map