"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentOrderHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const database_service_1 = require("../shared/database.service");
const uuid_1 = require("uuid");
const logger = logger_service_1.LoggerService.getInstance();
const database = database_service_1.LambdaDatabaseService.getInstance();
async function validateUser(userId, requestId) {
    try {
        const user = await database.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                isActive: true,
                status: true
            }
        });
        if (!user) {
            logger.warn('Payment order creation attempted for non-existent user', {
                userId,
                requestId,
                action: 'user_validation_failed',
                reason: 'user_not_found'
            });
            throw new Error('User account not found');
        }
        if (!user.isActive) {
            logger.warn('Payment order creation attempted for inactive user', {
                userId,
                requestId,
                action: 'user_validation_failed',
                reason: 'account_inactive'
            });
            throw new Error('User account is not active');
        }
        if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
            logger.warn('Payment order creation attempted for restricted user', {
                userId,
                requestId,
                accountStatus: user.status,
                action: 'user_validation_failed',
                reason: 'account_restricted'
            });
            throw new Error('User account access has been restricted');
        }
        logger.info('User validation successful for payment order', {
            userId,
            requestId,
            userEmail: user.email,
            action: 'user_validated'
        });
        return user;
    }
    catch (error) {
        logger.error('Database error during user validation', {
            userId,
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'user_validation_error'
        });
        throw error;
    }
}
async function validateMealOrder(orderId, userId, requestId) {
    try {
        const order = await database.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                status: true,
                totalAmount: true,
                currency: true,
                orderDate: true,
                deliveryDate: true,
                specialInstructions: true,
                paymentStatus: true
            }
        });
        if (!order) {
            logger.warn('Payment order creation attempted for non-existent meal order', {
                orderId,
                userId,
                requestId,
                action: 'order_validation_failed',
                reason: 'order_not_found'
            });
            throw new Error('Meal order not found');
        }
        if (order.userId !== userId) {
            logger.warn('Payment order creation attempted for unauthorized meal order', {
                orderId,
                userId,
                actualUserId: order.userId,
                requestId,
                action: 'order_validation_failed',
                reason: 'unauthorized_access'
            });
            throw new Error('Access denied: Order does not belong to the specified user');
        }
        if (order.status === 'completed' || order.status === 'cancelled') {
            logger.warn('Payment order creation attempted for invalid meal order status', {
                orderId,
                userId,
                orderStatus: order.status,
                requestId,
                action: 'order_validation_failed',
                reason: 'invalid_order_status'
            });
            throw new Error(`Cannot create payment for ${order.status} order`);
        }
        if (!order.totalAmount || order.totalAmount <= 0) {
            logger.warn('Payment order creation attempted for zero-amount meal order', {
                orderId,
                userId,
                totalAmount: order.totalAmount,
                requestId,
                action: 'order_validation_failed',
                reason: 'invalid_amount'
            });
            throw new Error('Invalid order amount for payment creation');
        }
        logger.info('Meal order validation successful for payment order', {
            orderId,
            userId,
            requestId,
            orderStatus: order.status,
            totalAmount: order.totalAmount,
            action: 'order_validated'
        });
        return order;
    }
    catch (error) {
        logger.error('Database error during meal order validation', {
            orderId,
            userId,
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'order_validation_error'
        });
        throw error;
    }
}
async function createRazorpayPaymentOrder(amountInPaise, currency, userId, requestId, orderId, description, metadata) {
    try {
        const timestamp = Date.now();
        const userHash = userId.substring(0, 8);
        const receipt = `HSVU_${timestamp}_${userHash}`;
        const orderOptions = {
            amount: amountInPaise,
            currency: currency.toUpperCase(),
            receipt: receipt,
            payment_capture: true,
            notes: {
                platform: 'HASIVU',
                userId: userId,
                orderId: orderId || 'direct_payment',
                description: description || 'HASIVU Platform Payment',
                requestId: requestId,
                timestamp: new Date().toISOString(),
                ...metadata
            }
        };
        logger.info('Creating Razorpay payment order', {
            receipt,
            amount: amountInPaise,
            currency,
            userId,
            orderId,
            requestId,
            action: 'razorpay_order_creation_start'
        });
        const razorpayOrder = await Promise.race([
            createRazorpayOrderWithRetry(orderOptions, requestId),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Razorpay API timeout')), 10000))
        ]);
        logger.info('Razorpay payment order created successfully', {
            razorpayOrderId: razorpayOrder.id,
            receipt: receipt,
            amount: amountInPaise,
            currency,
            status: razorpayOrder.status,
            userId,
            requestId,
            action: 'razorpay_order_created'
        });
        return {
            id: razorpayOrder.id,
            receipt: receipt,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            status: razorpayOrder.status
        };
    }
    catch (error) {
        logger.error('Failed to create Razorpay payment order', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            userId,
            orderId,
            amount: amountInPaise,
            currency,
            requestId,
            action: 'razorpay_order_creation_failed'
        });
        let errorMessage = 'Payment gateway service temporarily unavailable';
        if (error instanceof Error) {
            if (error.message.includes('timeout')) {
                errorMessage = 'Payment gateway timeout - please try again';
            }
            else if (error.message.includes('authentication')) {
                errorMessage = 'Payment gateway authentication failed';
            }
            else if (error.message.includes('amount')) {
                errorMessage = 'Invalid payment amount';
            }
        }
        throw new Error(errorMessage);
    }
}
async function createRazorpayOrderWithRetry(orderOptions, requestId, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            const mockRazorpayOrder = {
                id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                amount: orderOptions.amount,
                currency: orderOptions.currency,
                receipt: orderOptions.receipt,
                status: 'created',
                created_at: Math.floor(Date.now() / 1000)
            };
            return mockRazorpayOrder;
        }
        catch (error) {
            logger.warn(`Razorpay order creation attempt ${attempt} failed`, {
                attempt,
                maxRetries: maxRetries + 1,
                error: error instanceof Error ? error.message : 'Unknown error',
                requestId,
                action: 'razorpay_retry_attempt'
            });
            if (attempt === maxRetries + 1) {
                throw error;
            }
            const delay = 500 * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
const createPaymentOrderHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
        const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
        logger.info('Create payment order request started', {
            requestId,
            method: event.httpMethod,
            path: event.path,
            clientIP,
            userAgent: userAgent.substring(0, 200)
        });
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed', undefined, 'METHOD_NOT_ALLOWED', requestId);
        }
        logger.info('Authentication bypassed for development', { requestId });
        let body;
        try {
            body = JSON.parse(event.body || '{}');
        }
        catch (parseError) {
            logger.warn('Invalid JSON in payment order creation request', {
                requestId,
                clientIP,
                error: parseError instanceof Error ? parseError.message : 'JSON parse failed',
                action: 'json_parse_failed'
            });
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid JSON in request body', undefined, 'INVALID_JSON', requestId);
        }
        logger.info('Processing create payment order request', {
            requestId,
            userId: body.userId,
            amount: body.amount,
            currency: body.currency || 'INR',
            hasOrderId: !!body.orderId,
            hasMetadata: !!body.metadata && Object.keys(body.metadata).length > 0,
            action: 'request_processing_start'
        });
        const { userId, amount, currency = 'INR', description, orderId, metadata = {}, customerInfo } = body;
        if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
            return (0, response_utils_1.createErrorResponse)(400, 'Valid userId is required', undefined, 'MISSING_USER_ID', requestId);
        }
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return (0, response_utils_1.createErrorResponse)(400, 'Valid amount greater than 0 is required', undefined, 'INVALID_AMOUNT', requestId);
        }
        if (amount > 1000000) {
            return (0, response_utils_1.createErrorResponse)(400, 'Amount exceeds maximum limit of 10,000 INR', undefined, 'AMOUNT_LIMIT_EXCEEDED', requestId);
        }
        if (!customerInfo || typeof customerInfo !== 'object') {
            return (0, response_utils_1.createErrorResponse)(400, 'Customer information is required', undefined, 'MISSING_CUSTOMER_INFO', requestId);
        }
        if (!customerInfo.name || typeof customerInfo.name !== 'string' || customerInfo.name.trim().length === 0) {
            return (0, response_utils_1.createErrorResponse)(400, 'Customer name is required', undefined, 'MISSING_CUSTOMER_NAME', requestId);
        }
        if (!customerInfo.email || typeof customerInfo.email !== 'string' || !isValidEmail(customerInfo.email)) {
            return (0, response_utils_1.createErrorResponse)(400, 'Valid customer email is required', undefined, 'INVALID_CUSTOMER_EMAIL', requestId);
        }
        const supportedCurrencies = ['INR', 'USD'];
        if (!supportedCurrencies.includes(currency.toUpperCase())) {
            return (0, response_utils_1.createErrorResponse)(400, `Unsupported currency. Supported: ${supportedCurrencies.join(', ')}`, undefined, 'UNSUPPORTED_CURRENCY', requestId);
        }
        const user = await validateUser(userId, requestId);
        let order = null;
        if (orderId && typeof orderId === 'string' && orderId.trim().length > 0) {
            order = await validateMealOrder(orderId.trim(), userId, requestId);
            if (order && order.totalAmount && Math.abs(order.totalAmount - amount) > 0.01) {
                logger.warn('Payment amount mismatch with meal order', {
                    requestId,
                    userId,
                    orderId,
                    orderAmount: order.totalAmount,
                    paymentAmount: amount,
                    action: 'amount_mismatch_detected'
                });
                return (0, response_utils_1.createErrorResponse)(400, 'Payment amount does not match order total', undefined, 'AMOUNT_MISMATCH', requestId);
            }
        }
        const amountInPaise = Math.round(amount * 100);
        const paymentOrderId = (0, uuid_1.v4)();
        try {
            const paymentOrderData = {
                id: paymentOrderId,
                razorpayOrderId: 'pending',
                amount: Math.round(amount * 100),
                currency: currency.toUpperCase(),
                status: 'created',
                userId: userId,
                orderId: orderId || null,
                metadata: JSON.stringify({
                    description: description || `HASIVU Payment - ${user.firstName} ${user.lastName}`,
                    customerInfo: {
                        name: customerInfo.name.trim(),
                        email: customerInfo.email.trim().toLowerCase(),
                        phone: customerInfo.phone ? customerInfo.phone.trim() : null
                    },
                    ...metadata,
                    clientIP,
                    userAgent: userAgent.substring(0, 200),
                    requestId,
                    platform: 'HASIVU_WEB',
                    version: '1.0'
                }),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const paymentOrder = await database.prisma.paymentOrder.create({
                data: paymentOrderData
            });
            logger.info('Payment order created in database', {
                requestId,
                paymentOrderId,
                userId,
                amount,
                currency,
                orderId,
                action: 'db_payment_order_created'
            });
            const razorpayOrder = await createRazorpayPaymentOrder(amountInPaise, currency, userId, requestId, orderId, description, metadata);
            const updatedPaymentOrder = await database.prisma.paymentOrder.update({
                where: { id: paymentOrderId },
                data: {
                    razorpayOrderId: razorpayOrder.id,
                    status: 'pending',
                    metadata: JSON.stringify({
                        ...JSON.parse(paymentOrderData.metadata),
                        razorpayReceipt: razorpayOrder.receipt
                    }),
                    updatedAt: new Date()
                }
            });
            const response = {
                paymentOrderId: paymentOrderId,
                razorpayOrderId: razorpayOrder.id,
                amount: amount,
                currency: currency.toUpperCase(),
                receipt: razorpayOrder.receipt,
                status: 'pending',
                createdAt: updatedPaymentOrder.createdAt
            };
            const duration = Date.now() - startTime;
            logger.info('Payment order created successfully', {
                requestId,
                paymentOrderId,
                razorpayOrderId: razorpayOrder.id,
                amount,
                currency,
                orderId,
                userId,
                duration,
                action: 'payment_order_creation_success'
            });
            return (0, response_utils_1.createSuccessResponse)({
                paymentOrder: response
            }, 'Payment order created successfully', 201, requestId);
        }
        catch (dbError) {
            logger.error('Database error during payment order creation', {
                requestId,
                userId,
                paymentOrderId,
                error: dbError instanceof Error ? dbError.message : 'Unknown database error',
                stack: dbError instanceof Error ? dbError.stack : undefined,
                action: 'db_payment_order_creation_failed'
            });
            try {
                await database.prisma.paymentOrder.deleteMany({
                    where: {
                        id: paymentOrderId,
                        status: 'created'
                    }
                });
            }
            catch (cleanupError) {
                logger.error('Failed to clean up incomplete payment order', {
                    requestId,
                    paymentOrderId,
                    cleanupError: cleanupError instanceof Error ? cleanupError.message : 'Cleanup failed'
                });
            }
            throw new Error('Database error occurred during payment order creation');
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Payment order creation failed', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            duration,
            action: 'payment_order_creation_failed'
        });
        return (0, response_utils_1.handleError)(error, 'Failed to create payment order', 500, requestId);
    }
};
exports.createPaymentOrderHandler = createPaymentOrderHandler;
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 320;
}
//# sourceMappingURL=create-order.js.map