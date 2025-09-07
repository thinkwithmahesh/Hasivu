"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRetryHandler = void 0;
const client_1 = require("@prisma/client");
const razorpay_1 = __importDefault(require("razorpay"));
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});
const retryPaymentSchema = zod_1.z.object({
    paymentId: zod_1.z.string().uuid(),
    retryReason: zod_1.z.string().min(1).max(500),
    delayMinutes: zod_1.z.number().int().min(1).max(1440).optional(),
    maxRetries: zod_1.z.number().int().min(1).max(5).default(3),
    notifyUser: zod_1.z.boolean().default(true),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
});
const scheduleRetrySchema = zod_1.z.object({
    paymentId: zod_1.z.string().uuid(),
    scheduleType: zod_1.z.enum(['immediate', 'delayed', 'smart']).default('smart'),
    delayMinutes: zod_1.z.number().int().min(5).max(1440).optional(),
    maxAttempts: zod_1.z.number().int().min(1).max(5).default(3),
    notificationSettings: zod_1.z.object({
        notifyOnFailure: zod_1.z.boolean().default(true),
        notifyOnSuccess: zod_1.z.boolean().default(true),
        notifyOnMaxRetries: zod_1.z.boolean().default(true)
    }).optional()
});
function calculateSmartDelay(attemptCount, previousFailures) {
    const baseDelay = 5;
    const exponentialFactor = Math.pow(2, attemptCount - 1);
    const jitter = Math.random() * 0.3;
    let patternMultiplier = 1;
    if (previousFailures.length > 0) {
        const recentFailures = previousFailures.slice(-3);
        const hasNetworkIssues = recentFailures.some(f => f.reason?.includes('network') || f.reason?.includes('timeout'));
        if (hasNetworkIssues) {
            patternMultiplier = 1.5;
        }
    }
    const calculatedDelay = Math.min(baseDelay * exponentialFactor * patternMultiplier * (1 + jitter), 120);
    return Math.round(calculatedDelay);
}
async function canRetryPayment(paymentId, userId) {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            paymentRetries: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });
    if (!payment) {
        return { canRetry: false, reason: 'Payment not found' };
    }
    if (payment.status === 'completed') {
        return { canRetry: false, reason: 'Payment already completed' };
    }
    if (payment.status === 'cancelled') {
        return { canRetry: false, reason: 'Payment was cancelled' };
    }
    const maxRetries = 5;
    const currentAttempts = payment.paymentRetries.length;
    if (currentAttempts >= maxRetries) {
        return {
            canRetry: false,
            reason: `Maximum retry attempts (${maxRetries}) exceeded for this payment`,
            maxRetries,
            currentAttempts
        };
    }
    const pendingRetry = await prisma.paymentRetry.findFirst({
        where: {
            paymentId,
            status: 'scheduled'
        }
    });
    if (pendingRetry) {
        return { canRetry: false, reason: 'Payment retry already scheduled' };
    }
    return {
        canRetry: true,
        maxRetries,
        currentAttempts
    };
}
async function createRetryAttempt(paymentId, userId, retryReason, retryType, scheduledFor) {
    const existingRetries = await prisma.paymentRetry.count({
        where: { paymentId }
    });
    const retryAttempt = await prisma.paymentRetry.create({
        data: {
            paymentId,
            attemptNumber: existingRetries + 1,
            retryAt: scheduledFor || new Date(),
            retryReason,
            retryMethod: retryType,
            status: 'scheduled'
        }
    });
    return retryAttempt.id;
}
async function executePaymentRetry(retryId, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    const retryAttempt = await prisma.paymentRetry.findUnique({
        where: { id: retryId },
        include: {
            payment: {
                include: {
                    order: true,
                    paymentRetries: true
                }
            }
        }
    });
    if (!retryAttempt) {
        throw new Error('Retry attempt not found');
    }
    if (retryAttempt.status !== 'scheduled') {
        throw new Error('Retry attempt is not in scheduled status');
    }
    await prisma.paymentRetry.update({
        where: { id: retryId },
        data: {
            status: 'processing'
        }
    });
    try {
        const orderOptions = {
            amount: retryAttempt.payment.amount * 100,
            currency: retryAttempt.payment.currency,
            receipt: `retry_${retryAttempt.payment.id}_${Date.now()}`,
            notes: {
                original_payment_id: retryAttempt.payment.id,
                retry_attempt_id: retryId,
                retry_count: retryAttempt.payment.paymentRetries?.length || 0
            }
        };
        const razorpayOrder = await razorpay.orders.create(orderOptions);
        await prisma.payment.update({
            where: { id: retryAttempt.paymentId },
            data: {
                razorpayOrderId: razorpayOrder.id,
                status: 'pending',
                updatedAt: new Date()
            }
        });
        await prisma.paymentRetry.update({
            where: { id: retryId },
            data: {
                status: 'completed'
            }
        });
        logger.info('Payment retry executed successfully', {
            retryId,
            paymentId: retryAttempt.paymentId,
            razorpayOrderId: razorpayOrder.id,
            executedBy: authenticatedUser.email
        });
        return {
            retryId,
            paymentId: retryAttempt.paymentId,
            gatewayOrderId: razorpayOrder.id,
            status: 'completed',
            amount: retryAttempt.payment.amount,
            currency: retryAttempt.payment.currency
        };
    }
    catch (error) {
        logger.error('Payment retry execution failed', {
            retryId,
            paymentId: retryAttempt.paymentId,
            error: error.message
        });
        await prisma.paymentRetry.update({
            where: { id: retryId },
            data: {
                status: 'failed',
                failureReason: error.message
            }
        });
        throw error;
    }
}
async function getRetryAnalytics(paymentId) {
    const whereClause = paymentId ? { paymentId } : {};
    const retryAttempts = await prisma.paymentRetry.findMany({
        where: whereClause,
        include: {
            payment: true
        }
    });
    const totalRetries = retryAttempts.length;
    const successfulRetries = retryAttempts.filter(r => r.status === 'completed').length;
    const failedRetriesArray = retryAttempts.filter(r => r.status === 'failed');
    const failedRetries = failedRetriesArray.length;
    const averageRetryTime = 0;
    const failureReasons = failedRetriesArray.reduce((acc, retry) => {
        const reason = retry.retryReason || 'Unknown';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
    }, {});
    const commonFailureReasons = Object.entries(failureReasons)
        .map(([reason, count]) => ({
        reason,
        count,
        percentage: Math.round((count / failedRetriesArray.length) * 100)
    }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    const retrySuccessRate = totalRetries > 0 ?
        Math.round((successfulRetries / totalRetries) * 100) : 0;
    return {
        totalRetries,
        successfulRetries,
        failedRetries,
        averageRetryTime,
        commonFailureReasons,
        retrySuccessRate
    };
}
const paymentRetryHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Payment retry request started', { requestId, method: event.httpMethod });
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if (!authResult.success || !authResult.user) {
            return {
                statusCode: 401,
                body: JSON.stringify({
                    error: 'Authentication failed',
                    code: 'AUTHENTICATION_FAILED'
                })
            };
        }
        const authenticatedUser = authResult.user;
        const method = event.httpMethod;
        const pathParameters = event.pathParameters || {};
        switch (method) {
            case 'POST':
                if (event.path.includes('/schedule')) {
                    return await handleScheduleRetry(event, authenticatedUser, requestId);
                }
                else {
                    return await handleManualRetry(event, authenticatedUser, requestId);
                }
            case 'GET':
                if (pathParameters.paymentId) {
                    return await handleGetRetryStatus(pathParameters.paymentId, authenticatedUser, requestId);
                }
                else {
                    return await handleGetRetryAnalytics(event.queryStringParameters, authenticatedUser, requestId);
                }
            case 'DELETE':
                if (pathParameters.retryId) {
                    return await handleCancelRetry(pathParameters.retryId, authenticatedUser, requestId);
                }
                break;
            default:
                return (0, response_utils_1.createErrorResponse)(`Method ${method} not allowed`, 405, 'METHOD_NOT_ALLOWED');
        }
        return (0, response_utils_1.createErrorResponse)('Invalid request path', 400, 'INVALID_PATH');
    }
    catch (error) {
        logger.error('Payment retry request failed', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Payment retry operation failed');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.paymentRetryHandler = paymentRetryHandler;
async function handleManualRetry(event, authenticatedUser, requestId) {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestBody = JSON.parse(event.body || '{}');
    const retryData = retryPaymentSchema.parse(requestBody);
    const retryCheck = await canRetryPayment(retryData.paymentId, authenticatedUser.id);
    if (!retryCheck.canRetry) {
        logger.warn('Payment retry not allowed', {
            requestId,
            paymentId: retryData.paymentId,
            reason: retryCheck.reason
        });
        return (0, response_utils_1.createErrorResponse)(retryCheck.reason || 'Payment cannot be retried', 400, 'RETRY_NOT_ALLOWED');
    }
    const retryId = await createRetryAttempt(retryData.paymentId, authenticatedUser.id, retryData.retryReason, 'manual', retryData.delayMinutes ? new Date(Date.now() + retryData.delayMinutes * 60 * 1000) : new Date());
    if (!retryData.delayMinutes) {
        const result = await executePaymentRetry(retryId, authenticatedUser);
        logger.info('Manual payment retry completed', {
            requestId,
            paymentId: retryData.paymentId,
            retryId,
            executedBy: authenticatedUser.email
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Payment retry executed successfully',
            data: result
        });
    }
    else {
        logger.info('Payment retry scheduled', {
            requestId,
            paymentId: retryData.paymentId,
            retryId,
            delayMinutes: retryData.delayMinutes,
            scheduledBy: authenticatedUser.email
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Payment retry scheduled successfully',
            data: {
                retryId,
                paymentId: retryData.paymentId,
                scheduledFor: new Date(Date.now() + retryData.delayMinutes * 60 * 1000).toISOString(),
                delayMinutes: retryData.delayMinutes
            }
        });
    }
}
async function handleScheduleRetry(event, authenticatedUser, requestId) {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestBody = JSON.parse(event.body || '{}');
    const scheduleData = scheduleRetrySchema.parse(requestBody);
    const retryCheck = await canRetryPayment(scheduleData.paymentId, authenticatedUser.id);
    if (!retryCheck.canRetry) {
        return (0, response_utils_1.createErrorResponse)(retryCheck.reason || 'Payment cannot be retried', 400, 'RETRY_NOT_ALLOWED');
    }
    let delayMinutes = 5;
    if (scheduleData.scheduleType === 'immediate') {
        delayMinutes = 0;
    }
    else if (scheduleData.scheduleType === 'delayed' && scheduleData.delayMinutes) {
        delayMinutes = scheduleData.delayMinutes;
    }
    else if (scheduleData.scheduleType === 'smart') {
        const previousFailures = await prisma.paymentRetry.findMany({
            where: { paymentId: scheduleData.paymentId, status: 'failed' },
            orderBy: { createdAt: 'desc' }
        });
        delayMinutes = calculateSmartDelay((retryCheck.currentAttempts || 0) + 1, previousFailures);
    }
    const scheduledFor = delayMinutes > 0 ?
        new Date(Date.now() + delayMinutes * 60 * 1000) :
        new Date();
    const retryId = await createRetryAttempt(scheduleData.paymentId, authenticatedUser.id, `Smart retry scheduled - ${scheduleData.scheduleType}`, 'automatic', scheduledFor);
    logger.info('Payment retry scheduled', {
        requestId,
        paymentId: scheduleData.paymentId,
        retryId,
        scheduleType: scheduleData.scheduleType,
        delayMinutes,
        scheduledBy: authenticatedUser.email
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Payment retry scheduled successfully',
        data: {
            retryId,
            paymentId: scheduleData.paymentId,
            scheduleType: scheduleData.scheduleType,
            scheduledFor: scheduledFor.toISOString(),
            delayMinutes
        }
    });
}
async function handleGetRetryStatus(paymentId, authenticatedUser, requestId) {
    const validationService = validation_service_1.ValidationService.getInstance();
    validationService.validateUUID(paymentId, 'Payment ID');
    const retryAttempts = await prisma.paymentRetry.findMany({
        where: { paymentId },
        orderBy: { createdAt: 'desc' },
        include: {
            payment: {
                select: { id: true, amount: true, currency: true, status: true }
            }
        }
    });
    const analytics = await getRetryAnalytics(paymentId);
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Retry status retrieved successfully',
        data: {
            paymentId,
            retryAttempts,
            analytics
        }
    });
}
async function handleGetRetryAnalytics(queryParams, authenticatedUser, requestId) {
    const paymentId = queryParams?.paymentId;
    if (paymentId) {
        const validationService = validation_service_1.ValidationService.getInstance();
        validationService.validateUUID(paymentId, 'Payment ID');
    }
    const analytics = await getRetryAnalytics(paymentId);
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Retry analytics retrieved successfully',
        data: {
            paymentId: paymentId || 'system-wide',
            analytics
        }
    });
}
async function handleCancelRetry(retryId, authenticatedUser, requestId) {
    const logger = logger_service_1.LoggerService.getInstance();
    const validationService = validation_service_1.ValidationService.getInstance();
    validationService.validateUUID(retryId, 'Retry ID');
    const retryAttempt = await prisma.paymentRetry.findUnique({
        where: { id: retryId }
    });
    if (!retryAttempt) {
        return (0, response_utils_1.createErrorResponse)('Retry attempt not found', 404, 'RETRY_NOT_FOUND');
    }
    if (retryAttempt.status !== 'scheduled') {
        return (0, response_utils_1.createErrorResponse)('Can only cancel scheduled retries', 400, 'INVALID_RETRY_STATUS');
    }
    await prisma.paymentRetry.update({
        where: { id: retryId },
        data: {
            status: 'cancelled',
            failureReason: 'User cancelled retry attempt'
        }
    });
    logger.info('Payment retry cancelled', {
        requestId,
        retryId,
        paymentId: retryAttempt.paymentId,
        cancelledBy: authenticatedUser.email
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Payment retry cancelled successfully',
        data: {
            retryId,
            paymentId: retryAttempt.paymentId,
            status: 'cancelled'
        }
    });
}
//# sourceMappingURL=payment-retry.js.map