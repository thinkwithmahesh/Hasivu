"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderHandler = void 0;
const client_1 = require("@prisma/client");
const razorpay_1 = __importDefault(require("razorpay"));
const zod_1 = require("zod");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const logger_1 = require("../../shared/utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const prisma = new client_1.PrismaClient();
async function retryWithBackoff(operation, retries = 3, delay = 1000) {
    try {
        return await operation();
    }
    catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryWithBackoff(operation, retries - 1, delay * 2);
        }
        throw error;
    }
}
async function checkStudentParentRelation(studentId, parentId, prisma) {
    try {
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: { parentId: true }
        });
        return student?.parentId === parentId;
    }
    catch (error) {
        logger_1.logger.error('Error checking student-parent relation', { studentId, parentId, error });
        return false;
    }
}
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const createPaymentOrderSchema = zod_1.z.object({
    amount: zod_1.z.number()
        .positive('Amount must be greater than 0')
        .max(1000000, 'Amount exceeds maximum allowed limit (₹10,00,000)')
        .multipleOf(0.01, 'Amount can have maximum 2 decimal places'),
    currency: zod_1.z.enum(['INR']).default('INR'),
    orderId: zod_1.z.string().uuid('Invalid order ID format').optional(),
    subscriptionId: zod_1.z.string().uuid('Invalid subscription ID format').optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    returnUrl: zod_1.z.string().url('Invalid return URL format').optional(),
    webhookUrl: zod_1.z.string().url('Invalid webhook URL format').optional(),
    description: zod_1.z.string().max(255, 'Description too long').optional(),
    notes: zod_1.z.record(zod_1.z.string(), zod_1.z.string().max(512, 'Note value too long')).optional()
}).refine((data) => data.orderId || data.subscriptionId, {
    message: 'Either orderId or subscriptionId must be provided',
    path: ['orderId']
}).refine((data) => !(data.orderId && data.subscriptionId), {
    message: 'Cannot provide both orderId and subscriptionId',
    path: ['orderId']
});
function validatePaymentOrderRequest(request, user) {
    try {
        createPaymentOrderSchema.parse(request);
        if (request.amount <= 0) {
            return { valid: false, error: 'Amount must be greater than 0' };
        }
        if (request.amount > 1000000) {
            return { valid: false, error: 'Amount exceeds maximum allowed limit (₹10,00,000)' };
        }
        if (request.currency && !['INR'].includes(request.currency)) {
            return { valid: false, error: 'Invalid currency. Only INR is supported' };
        }
        if (!request.orderId && !request.subscriptionId) {
            return { valid: false, error: 'Either orderId or subscriptionId must be provided' };
        }
        if (request.orderId && request.subscriptionId) {
            return { valid: false, error: 'Cannot provide both orderId and subscriptionId' };
        }
        if (request.metadata && JSON.stringify(request.metadata).length > 2048) {
            return { valid: false, error: 'Metadata too large (max 2KB)' };
        }
        if (request.notes && Object.keys(request.notes).length > 15) {
            return { valid: false, error: 'Too many notes (max 15)' };
        }
        return { valid: true };
    }
    catch (error) {
        logger_1.logger.error('Payment order validation error:', { error, request, userId: user.id });
        return {
            valid: false,
            error: error && typeof error === 'object' && 'issues' in error && Array.isArray(error.issues)
                ? error.issues.map(i => i.message).join(', ')
                : 'Invalid request format'
        };
    }
}
async function validateOrderAccess(orderId, user, prisma) {
    try {
        logger_1.logger.info('Validating order access', { orderId, userId: user.id, userRole: user.role });
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true, email: true } },
                student: {
                    select: {
                        id: true,
                        parentId: true
                    }
                },
                school: { select: { id: true } },
                orderItems: {
                    select: {
                        id: true,
                        quantity: true,
                        unitPrice: true,
                    }
                }
            }
        });
        if (!order) {
            logger_1.logger.warn('Order not found', { orderId, userId: user.id });
            return { valid: false, error: 'Order not found' };
        }
        const hasAccess = order.userId === user.id ||
            order.studentId && await checkStudentParentRelation(order.studentId, user.id, prisma) ||
            (user.role === 'admin' || user.role === 'super_admin') ||
            (user.schoolId === order.schoolId && ['staff', 'school_admin'].includes(user.role));
        if (!hasAccess) {
            logger_1.logger.warn('Access denied for order payment creation', {
                orderId,
                userId: user.id,
                userRole: user.role,
                orderUserId: order.userId,
                studentParentId: order.studentId ? 'student-relation' : null,
                userSchoolId: user.schoolId,
                orderSchoolId: order.schoolId
            });
            return { valid: false, error: 'Access denied: You do not have permission to create payment for this order' };
        }
        if (order.paymentStatus === 'paid') {
            logger_1.logger.warn('Attempt to create payment for already paid order', { orderId, userId: user.id });
            return { valid: false, error: 'Order is already paid' };
        }
        if (order.status === 'cancelled') {
            logger_1.logger.warn('Attempt to create payment for cancelled order', { orderId, userId: user.id });
            return { valid: false, error: 'Cannot create payment for cancelled order' };
        }
        const orderExpiry = order.metadata ? JSON.parse(order.metadata)?.expiresAt : null;
        if (orderExpiry && new Date(orderExpiry) < new Date()) {
            logger_1.logger.warn('Attempt to create payment for expired order', { orderId, userId: user.id, expiresAt: orderExpiry });
            return { valid: false, error: 'Order has expired' };
        }
        logger_1.logger.info('Order access validation successful', { orderId, userId: user.id });
        return { valid: true, order };
    }
    catch (error) {
        logger_1.logger.error('Failed to validate order access', { error, orderId, userId: user.id });
        return { valid: false, error: 'Failed to validate order access' };
    }
}
async function validateSubscriptionAccess(subscriptionId, user, prisma) {
    try {
        logger_1.logger.info('Validating subscription access', { subscriptionId, userId: user.id });
        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                student: {
                    select: {
                        id: true,
                        parentId: true,
                        firstName: true,
                        lastName: true,
                        school: { select: { id: true, name: true } }
                    }
                },
                subscriptionPlan: { select: { id: true, name: true, price: true, currency: true } }
            }
        });
        if (!subscription) {
            logger_1.logger.warn('Subscription not found', { subscriptionId, userId: user.id });
            return { valid: false, error: 'Subscription not found' };
        }
        const studentParentCheck = subscription.studentId ? await checkStudentParentRelation(subscription.studentId, user.id, prisma) : false;
        const hasAccess = subscription.userId === user.id ||
            studentParentCheck ||
            (user.role === 'admin' || user.role === 'super_admin');
        if (!hasAccess) {
            logger_1.logger.warn('Access denied for subscription payment creation', {
                subscriptionId,
                userId: user.id,
                subscriptionUserId: subscription.userId,
                studentParentId: subscription.studentId ? 'student-relation' : null
            });
            return { valid: false, error: 'Access denied: You do not have permission to create payment for this subscription' };
        }
        if (subscription.status !== 'active' && subscription.status !== 'past_due') {
            logger_1.logger.warn('Attempt to create payment for inactive subscription', { subscriptionId, status: subscription.status });
            return { valid: false, error: `Cannot create payment for ${subscription.status} subscription` };
        }
        logger_1.logger.info('Subscription access validation successful', { subscriptionId, userId: user.id });
        return { valid: true, subscription };
    }
    catch (error) {
        logger_1.logger.error('Failed to validate subscription access', { error, subscriptionId, userId: user.id });
        return { valid: false, error: 'Failed to validate subscription access' };
    }
}
async function createRazorpayOrder(amount, currency, referenceId, metadata, description, notes) {
    const orderOptions = {
        amount,
        currency,
        receipt: `rcpt_${referenceId}_${Date.now()}`,
        payment_capture: 1,
        notes: {
            referenceId,
            createdBy: 'hasivu-platform',
            ...(notes || {}),
            ...(description ? { description: description.toString() } : {})
        }
    };
    logger_1.logger.info('Creating Razorpay order', { orderOptions: { ...orderOptions, notes: 'redacted' } });
    try {
        const razorpayOrder = await retryWithBackoff(async () => {
            const order = await razorpay.orders.create(orderOptions);
            logger_1.logger.info('Razorpay order created successfully', {
                razorpayOrderId: order.id,
                amount: order.amount,
                currency: order.currency,
                status: order.status
            });
            return order;
        }, 3, 1000);
        return razorpayOrder;
    }
    catch (error) {
        logger_1.logger.error('Failed to create Razorpay order after retries', {
            error,
            orderOptions: { ...orderOptions, notes: 'redacted' },
            metadata: { amount, currency, referenceId }
        });
        throw new Error(`Payment gateway error: ${error instanceof Error ? error.message : String(error) || 'Failed to create order'}`);
    }
}
async function handleOrderPayment(requestBody, user, prisma) {
    const { orderId } = requestBody;
    const orderValidation = await validateOrderAccess(orderId, user, prisma);
    if (!orderValidation.valid || !orderValidation.order) {
        throw new Error(orderValidation.error);
    }
    const order = orderValidation.order;
    const amountInPaise = Math.round(requestBody.amount * 100);
    const currency = requestBody.currency || 'INR';
    const razorpayOrder = await createRazorpayOrder(amountInPaise, currency, orderId, {
        orderId,
        userId: user.id,
        schoolId: order.school?.id,
        ...requestBody.metadata
    }, requestBody.description || `Payment for order ${order.title}`, requestBody.notes);
    const paymentOrder = await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.paymentOrder.create({
            data: {
                razorpayOrderId: razorpayOrder.id,
                amount: requestBody.amount,
                currency,
                status: 'created',
                userId: user.id,
                orderId,
                metadata: JSON.stringify(requestBody.metadata || {}),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }
        });
        await tx.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: 'pending',
                updatedAt: new Date()
            }
        });
        return createdOrder;
    });
    return {
        paymentOrder,
        razorpayOrder,
        order
    };
}
async function handleSubscriptionPayment(requestBody, user, prisma) {
    const { subscriptionId } = requestBody;
    const subscriptionValidation = await validateSubscriptionAccess(subscriptionId, user, prisma);
    if (!subscriptionValidation.valid || !subscriptionValidation.subscription) {
        throw new Error(subscriptionValidation.error);
    }
    const subscription = subscriptionValidation.subscription;
    const amountInPaise = Math.round(requestBody.amount * 100);
    const currency = requestBody.currency || subscription.subscriptionPlan.currency || 'INR';
    const razorpayOrder = await createRazorpayOrder(amountInPaise, currency, subscriptionId, {
        subscriptionId,
        userId: user.id,
        planId: subscription.subscriptionPlan.id,
        ...requestBody.metadata
    }, requestBody.description || `Payment for ${subscription.subscriptionPlan.name} subscription`, requestBody.notes);
    const paymentOrder = await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.paymentOrder.create({
            data: {
                razorpayOrderId: razorpayOrder.id,
                amount: requestBody.amount,
                currency,
                status: 'created',
                userId: user.id,
                subscriptionId,
                metadata: JSON.stringify(requestBody.metadata || {}),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            }
        });
        if (subscription.status === 'past_due') {
            await tx.subscription.update({
                where: { id: subscriptionId },
                data: {
                    status: 'active',
                    updatedAt: new Date()
                }
            });
        }
        return createdOrder;
    });
    return {
        paymentOrder,
        razorpayOrder,
        subscription
    };
}
const createOrderHandler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.info('Payment order creation request received', {
        method: event.httpMethod,
        path: event.path,
        requestId: context.awsRequestId,
        userAgent: event.headers['User-Agent'],
        ip: event.requestContext.identity.sourceIp
    });
    try {
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if ('statusCode' in authResult) {
            logger_1.logger.warn('Authentication failed for payment order creation', {
                requestId: context.awsRequestId,
                ip: event.requestContext.identity.sourceIp
            });
            return authResult;
        }
        const { user } = authResult;
        if (!user) {
            return (0, response_utils_1.createErrorResponse)('Authentication failed - user not found', 401, 'AUTHENTICATION_ERROR');
        }
        logger_1.logger.info('User authenticated for payment order creation', {
            userId: user.id,
            userRole: user.role,
            requestId: context.awsRequestId
        });
        let requestBody;
        try {
            requestBody = JSON.parse(event.body || '{}');
        }
        catch (parseError) {
            logger_1.logger.error('Failed to parse request body', { error: parseError, body: event.body });
            return (0, response_utils_1.createErrorResponse)('Invalid JSON in request body', 400, 'INVALID_JSON');
        }
        const validation = validatePaymentOrderRequest(requestBody, user);
        if (!validation.valid) {
            logger_1.logger.warn('Payment order request validation failed', {
                error: validation.error,
                userId: user.id,
                requestBody: { ...requestBody, metadata: 'redacted' }
            });
            return (0, response_utils_1.createErrorResponse)(validation.error, 400, 'VALIDATION_FAILED');
        }
        logger_1.logger.info('Payment order request validated successfully', {
            userId: user.id,
            amount: requestBody.amount,
            currency: requestBody.currency,
            orderId: requestBody.orderId,
            subscriptionId: requestBody.subscriptionId
        });
        let result;
        if (requestBody.orderId) {
            result = await handleOrderPayment(requestBody, user, prisma);
        }
        else if (requestBody.subscriptionId) {
            result = await handleSubscriptionPayment(requestBody, user, prisma);
        }
        else {
            return (0, response_utils_1.createErrorResponse)('Either orderId or subscriptionId must be provided', 400, 'INVALID_REQUEST');
        }
        const { paymentOrder, razorpayOrder } = result;
        const response = {
            id: paymentOrder.id,
            razorpayOrderId: razorpayOrder.id,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            status: paymentOrder.status,
            createdAt: paymentOrder.createdAt.toISOString(),
            expiresAt: paymentOrder.expiresAt.toISOString(),
            keyId: process.env.RAZORPAY_KEY_ID,
            user: {
                id: user.id,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                email: user.email
            }
        };
        if ('order' in result && result.order) {
            response.order = {
                id: result.order.id,
                title: result.order.title,
                description: result.order.description,
                school: result.order.school
            };
        }
        const duration = Date.now() - startTime;
        logger_1.logger.info('Payment order created successfully', {
            paymentOrderId: paymentOrder.id,
            razorpayOrderId: razorpayOrder.id,
            userId: user.id,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            duration: `${duration}ms`,
            requestId: context.awsRequestId
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Payment order created successfully',
            data: response,
            requestId: context.awsRequestId,
            service: 'payment-service'
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.error('Payment order creation failed', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            requestId: context.awsRequestId,
            duration: `${duration}ms`,
            event: {
                method: event.httpMethod,
                path: event.path,
                headers: event.headers,
                body: event.body ? 'present' : 'absent'
            }
        });
        return (0, response_utils_1.handleError)(error, 'Failed to create payment order');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.createOrderHandler = createOrderHandler;
//# sourceMappingURL=create-order-fixed.js.map