"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dunningManagementHandler = void 0;
const client_1 = require("@prisma/client");
const razorpay_1 = __importDefault(require("razorpay"));
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient({
    log: ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});
const MAX_DUNNING_ATTEMPTS = parseInt(process.env.MAX_DUNNING_ATTEMPTS || '5');
const GRACE_PERIOD_DAYS = parseInt(process.env.PAYMENT_GRACE_PERIOD_DAYS || '7');
const DUNNING_ESCALATION_DAYS = [1, 3, 7, 14, 30];
const processDunningSchema = zod_1.z.object({
    paymentId: zod_1.z.string().uuid().optional(),
    subscriptionId: zod_1.z.string().uuid().optional(),
    dryRun: zod_1.z.boolean().default(false),
    forceProcess: zod_1.z.boolean().default(false),
    maxBatchSize: zod_1.z.number().int().min(1).max(100).default(50)
});
const updateDunningConfigSchema = zod_1.z.object({
    subscriptionId: zod_1.z.string().uuid(),
    gracePeriodDays: zod_1.z.number().int().min(0).max(30).optional(),
    maxAttempts: zod_1.z.number().int().min(1).max(10).optional()
});
const dunningStatusSchema = zod_1.z.object({
    subscriptionId: zod_1.z.string().uuid().optional(),
    paymentId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['active', 'suspended', 'cancelled']).optional(),
    dateRange: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional()
    }).optional(),
    limit: zod_1.z.number().int().min(1).max(500).default(100),
    offset: zod_1.z.number().int().min(0).default(0)
});
function calculateNextAttemptDate(attemptNumber, failureDate, escalationDays) {
    const escalationIndex = Math.min(attemptNumber - 1, escalationDays.length - 1);
    const delayDays = escalationDays[escalationIndex] || escalationDays[escalationDays.length - 1];
    const nextAttempt = new Date(failureDate);
    nextAttempt.setDate(nextAttempt.getDate() + delayDays);
    return nextAttempt;
}
function calculateGracePeriodEnd(paymentDueDate, gracePeriodDays) {
    const gracePeriodEnd = new Date(paymentDueDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);
    return gracePeriodEnd;
}
async function getDunningConfig(subscriptionId) {
    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
    });
    if (!subscription) {
        throw new Error('Subscription not found');
    }
    return {
        subscriptionId,
        gracePeriodDays: subscription.gracePeriodDays || GRACE_PERIOD_DAYS,
        maxAttempts: subscription.maxDunningAttempts || MAX_DUNNING_ATTEMPTS,
        escalationDays: DUNNING_ESCALATION_DAYS
    };
}
async function processDunningManagement(options = {}, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    const now = new Date();
    logger.info('Starting dunning management process', {
        options,
        executedBy: authenticatedUser.email,
        timestamp: now.toISOString()
    });
    const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        suspended: 0,
        errors: []
    };
    try {
        const whereConditions = {
            status: 'failed'
        };
        if (options.paymentId) {
            whereConditions.id = options.paymentId;
        }
        if (options.subscriptionId) {
            whereConditions.subscriptionId = options.subscriptionId;
        }
        const failedPayments = await prisma.payment.findMany({
            where: whereConditions,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            },
            take: options.maxBatchSize || 50
        });
        logger.info(`Found ${failedPayments.length} failed payments for dunning processing`);
        for (const payment of failedPayments) {
            try {
                results.processed++;
                const processResult = await processSinglePaymentDunning(payment, { dryRun: options.dryRun || false, forceProcess: options.forceProcess || false }, authenticatedUser);
                if (processResult.success) {
                    results.successful++;
                    if (processResult.suspended) {
                        results.suspended++;
                    }
                }
                else {
                    results.failed++;
                    results.errors.push({
                        paymentId: payment.id,
                        error: processResult.error || 'Unknown error'
                    });
                }
            }
            catch (error) {
                results.failed++;
                results.errors.push({
                    paymentId: payment.id,
                    error: error instanceof Error ? error.message : String(error)
                });
                logger.error(`Error processing dunning for payment ${payment.id}:`, error);
            }
        }
        logger.info('Dunning management process completed', {
            results,
            executedBy: authenticatedUser.email,
            duration: Date.now() - now.getTime()
        });
        return results;
    }
    catch (error) {
        logger.error('Dunning management process failed:', error);
        throw error;
    }
}
async function processSinglePaymentDunning(payment, options, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        if (!payment.subscriptionId) {
            logger.info(`Payment ${payment.id} has no subscription, skipping dunning`);
            return { success: true };
        }
        const subscription = await prisma.subscription.findUnique({
            where: { id: payment.subscriptionId }
        });
        if (!subscription) {
            throw new Error('Subscription not found for payment');
        }
        const dunningConfig = await getDunningConfig(payment.subscriptionId);
        const dunningAttempts = subscription.dunningAttempts || 0;
        const nextDunningAt = subscription.updatedAt;
        if (dunningAttempts === 0 && !options.forceProcess) {
            const gracePeriodEnd = calculateGracePeriodEnd(payment.createdAt, dunningConfig.gracePeriodDays);
            if (new Date() < gracePeriodEnd) {
                await sendGracePeriodNotification(payment, gracePeriodEnd);
                return { success: true };
            }
        }
        if (dunningAttempts >= dunningConfig.maxAttempts) {
            logger.info(`Maximum dunning attempts exceeded for payment ${payment.id}`);
            return await suspendSubscription(payment, dunningAttempts, options.dryRun);
        }
        if (!options.forceProcess && nextDunningAt && new Date() < nextDunningAt) {
            logger.info(`Next dunning attempt not yet due for payment ${payment.id}`);
            return { success: true };
        }
        const attemptResult = await processPaymentDunningAttempt(payment, dunningAttempts + 1, dunningConfig, options.dryRun, authenticatedUser);
        return attemptResult;
    }
    catch (error) {
        logger.error(`Failed to process dunning for payment ${payment.id}:`, error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
async function processPaymentDunningAttempt(payment, attemptNumber, config, dryRun, _authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        if (!dryRun && payment.subscriptionId) {
            await prisma.subscription.update({
                where: { id: payment.subscriptionId },
                data: {
                    updatedAt: new Date()
                }
            });
        }
        const paymentResult = await attemptPaymentRetry(payment, attemptNumber, dryRun);
        if (paymentResult.success) {
            if (!dryRun) {
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'completed',
                        gatewayResponse: JSON.stringify(paymentResult),
                        paidAt: new Date(),
                        updatedAt: new Date()
                    }
                });
                if (payment.subscriptionId) {
                    await prisma.subscription.update({
                        where: { id: payment.subscriptionId },
                        data: {
                            dunningAttempts: 0
                        }
                    });
                }
            }
            await sendPaymentSuccessNotification(payment);
            logger.info(`Payment retry successful: ${payment.id}`);
            return { success: true };
        }
        else {
            const nextAttemptNumber = attemptNumber;
            if (nextAttemptNumber >= config.maxAttempts) {
                return await suspendSubscription(payment, nextAttemptNumber, dryRun);
            }
            else {
                const nextAttemptDate = calculateNextAttemptDate(nextAttemptNumber + 1, payment.createdAt, config.escalationDays);
                if (!dryRun && payment.subscriptionId) {
                    await prisma.subscription.update({
                        where: { id: payment.subscriptionId },
                        data: {
                            dunningAttempts: nextAttemptNumber,
                            updatedAt: new Date()
                        }
                    });
                }
                await sendDunningNotification(payment, nextAttemptNumber, nextAttemptDate);
            }
            return { success: true };
        }
    }
    catch (error) {
        logger.error(`Error processing payment retry attempt ${attemptNumber}:`, error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
async function attemptPaymentRetry(payment, attemptNumber, dryRun) {
    const logger = logger_service_1.LoggerService.getInstance();
    if (dryRun) {
        const simulatedSuccess = Math.random() > 0.3;
        return {
            success: simulatedSuccess,
            error: simulatedSuccess ? undefined : 'Simulated payment failure',
            gatewayOrderId: simulatedSuccess ? `order_sim_${Date.now()}` : undefined
        };
    }
    try {
        const orderOptions = {
            amount: payment.amount * 100,
            currency: payment.currency || 'INR',
            receipt: `dunning_${payment.id}_${Date.now()}`,
            notes: {
                original_payment_id: payment.id,
                subscription_id: payment.subscriptionId,
                dunning_attempt: attemptNumber.toString(),
                retry_type: 'dunning_management'
            }
        };
        const razorpayOrder = await razorpay.orders.create(orderOptions);
        logger.info(`Razorpay order created for dunning retry: ${razorpayOrder.id}`);
        return {
            success: true,
            gatewayOrderId: razorpayOrder.id
        };
    }
    catch (error) {
        logger.error(`Razorpay order creation failed for payment ${payment.id}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error) || 'Payment gateway error'
        };
    }
}
async function suspendSubscription(payment, attemptNumber, dryRun) {
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        if (!dryRun && payment.subscriptionId) {
            await prisma.subscription.update({
                where: { id: payment.subscriptionId },
                data: {
                    status: 'suspended',
                    dunningAttempts: attemptNumber,
                    updatedAt: new Date()
                }
            });
        }
        await sendSuspensionNotification(payment);
        logger.info(`Subscription suspended due to payment failures: ${payment.subscriptionId}`);
        return { success: true, suspended: true };
    }
    catch (error) {
        logger.error(`Failed to suspend subscription ${payment.subscriptionId}:`, error);
        return { success: false, suspended: false, error: error instanceof Error ? error.message : String(error) };
    }
}
async function sendGracePeriodNotification(payment, gracePeriodEnd) {
    const logger = logger_service_1.LoggerService.getInstance();
    const userId = payment.user.id;
    logger.info(`Sending grace period notification to user ${userId} for subscription ${payment.subscriptionId}`);
    const notificationData = {
        type: 'grace_period',
        userId,
        subscriptionId: payment.subscriptionId,
        paymentId: payment.id,
        gracePeriodEnd: gracePeriodEnd.toISOString(),
        amount: payment.amount,
        currency: payment.currency
    };
    logger.info('Grace period notification data prepared', notificationData);
}
async function sendDunningNotification(payment, attemptNumber, nextAttemptDate) {
    const logger = logger_service_1.LoggerService.getInstance();
    const userId = payment.user.id;
    logger.info(`Sending dunning notification to user ${userId} for payment ${payment.id}, attempt ${attemptNumber}`);
    const notificationData = {
        type: 'dunning_notice',
        userId,
        subscriptionId: payment.subscriptionId,
        paymentId: payment.id,
        attemptNumber,
        nextAttemptDate: nextAttemptDate.toISOString(),
        amount: payment.amount,
        currency: payment.currency,
        customerName: `${payment.user.firstName} ${payment.user.lastName}`
    };
    logger.info('Dunning notification data prepared', notificationData);
}
async function sendPaymentSuccessNotification(payment) {
    const logger = logger_service_1.LoggerService.getInstance();
    const userId = payment.user.id;
    logger.info(`Sending payment success notification to user ${userId} for payment ${payment.id}`);
    const notificationData = {
        type: 'payment_success',
        userId,
        subscriptionId: payment.subscriptionId,
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency
    };
    logger.info('Payment success notification data prepared', notificationData);
}
async function sendSuspensionNotification(payment) {
    const logger = logger_service_1.LoggerService.getInstance();
    const userId = payment.user.id;
    logger.info(`Sending suspension notification to user ${userId} for subscription ${payment.subscriptionId}`);
    const notificationData = {
        type: 'subscription_suspended',
        userId,
        subscriptionId: payment.subscriptionId,
        paymentId: payment.id,
        suspensionDate: new Date().toISOString()
    };
    logger.info('Suspension notification data prepared', notificationData);
}
async function getDunningAnalytics(options) {
    const whereClause = {};
    if (options.subscriptionId) {
        whereClause.id = options.subscriptionId;
    }
    if (options.dateRange) {
        whereClause.createdAt = {
            gte: options.dateRange.startDate,
            lte: options.dateRange.endDate
        };
    }
    const subscriptions = await prisma.subscription.findMany({
        where: whereClause,
        include: {
            user: true
        }
    });
    const totalFailures = subscriptions.filter(s => s.dunningAttempts > 0).length;
    const activeProcesses = subscriptions.filter(s => s.dunningAttempts > 0 && s.status === 'active').length;
    const completedProcesses = subscriptions.filter(s => s.dunningAttempts > 0 && s.status === 'active').length;
    const recoveryRate = totalFailures > 0 ? Math.round((completedProcesses / totalFailures) * 100) : 0;
    const recoveryDurations = subscriptions
        .filter(s => s.dunningAttempts > 0 && s.updatedAt)
        .map(s => {
        const duration = new Date().getTime() - new Date(s.updatedAt).getTime();
        return Math.round(duration / (1000 * 60 * 60 * 24));
    });
    const averageRecoveryDays = recoveryDurations.length > 0 ?
        Math.round(recoveryDurations.reduce((a, b) => a + b, 0) / recoveryDurations.length) : 0;
    const gracePeriodSubscriptions = subscriptions.filter(s => s.status === 'active' && s.dunningAttempts === 0).length;
    const suspendedSubscriptions = await prisma.subscription.count({
        where: { status: 'suspended' }
    });
    const escalationBreakdown = [1, 2, 3, 4, 5].map(level => {
        const levelSubscriptions = subscriptions.filter(s => s.dunningAttempts === level);
        const levelSuccesses = levelSubscriptions.filter(s => s.status === 'active');
        return {
            level,
            count: levelSubscriptions.length,
            successRate: levelSubscriptions.length > 0 ? Math.round((levelSuccesses.length / levelSubscriptions.length) * 100) : 0
        };
    });
    return {
        totalFailures,
        activeProcesses,
        gracePeriodSubscriptions,
        suspendedSubscriptions,
        recoveryRate,
        averageRecoveryDays,
        escalationBreakdown
    };
}
const dunningManagementHandler = async (event) => {
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        logger.info('Dunning management request started', {
            method: event.httpMethod,
            path: event.path
        });
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if ('statusCode' in authResult) {
            return authResult;
        }
        const { user: authenticatedUser } = authResult;
        if (!authenticatedUser) {
            return (0, response_utils_1.createErrorResponse)('Authentication failed - user not found', 401, 'AUTHENTICATION_ERROR');
        }
        const method = event.httpMethod;
        const path = event.path;
        switch (`${method}:${path}`) {
            case 'POST:/api/v1/payments/dunning/process':
                return await handleProcessDunning(event, authenticatedUser);
            case 'GET:/api/v1/payments/dunning/status':
                return await handleGetDunningStatus(event);
            case 'GET:/api/v1/payments/dunning/analytics':
                return await handleGetDunningAnalytics(event);
            case 'PUT:/api/v1/payments/dunning/config':
                return await handleUpdateDunningConfig(event, authenticatedUser);
            case 'GET:/api/v1/payments/dunning/config':
                return await handleGetDunningConfig(event);
            default:
                return (0, response_utils_1.createErrorResponse)(`Method ${method} not supported for path ${path}`, 405, 'METHOD_NOT_ALLOWED');
        }
    }
    catch (error) {
        logger.error('Dunning management request failed', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return (0, response_utils_1.handleError)(error, 'Dunning management operation failed');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.dunningManagementHandler = dunningManagementHandler;
async function handleProcessDunning(event, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestBody = JSON.parse(event.body || '{}');
    const processData = processDunningSchema.parse(requestBody);
    logger.info('Processing dunning management request', {
        processData,
        executedBy: authenticatedUser.email
    });
    const results = await processDunningManagement({
        paymentId: processData.paymentId,
        subscriptionId: processData.subscriptionId,
        dryRun: processData.dryRun,
        forceProcess: processData.forceProcess,
        maxBatchSize: processData.maxBatchSize
    }, authenticatedUser);
    logger.info('Dunning processing completed', {
        results,
        executedBy: authenticatedUser.email
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Dunning management processing completed',
        data: {
            ...results,
            metadata: {
                dryRun: processData.dryRun,
                processedAt: new Date().toISOString()
            }
        }
    });
}
async function handleGetDunningStatus(event) {
    const queryParams = event.queryStringParameters || {};
    const statusQuery = dunningStatusSchema.parse(queryParams);
    const whereClause = {};
    if (statusQuery.subscriptionId) {
        whereClause.id = statusQuery.subscriptionId;
    }
    if (statusQuery.status) {
        whereClause.status = statusQuery.status;
    }
    if (statusQuery.dateRange) {
        whereClause.createdAt = {
            gte: statusQuery.dateRange.startDate ? new Date(statusQuery.dateRange.startDate) : undefined,
            lte: statusQuery.dateRange.endDate ? new Date(statusQuery.dateRange.endDate) : undefined
        };
    }
    const subscriptions = await prisma.subscription.findMany({
        where: whereClause,
        include: {
            user: {
                select: { id: true, email: true, firstName: true, lastName: true }
            },
            subscriptionPlan: {
                select: { name: true, price: true, currency: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        skip: statusQuery.offset,
        take: statusQuery.limit
    });
    const totalCount = await prisma.subscription.count({ where: whereClause });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Dunning status retrieved successfully',
        data: {
            subscriptions: subscriptions,
            pagination: {
                total: totalCount,
                offset: statusQuery.offset,
                limit: statusQuery.limit,
                hasMore: statusQuery.offset + statusQuery.limit < totalCount
            }
        }
    });
}
async function handleGetDunningAnalytics(event) {
    const queryParams = event.queryStringParameters || {};
    const options = {};
    if (queryParams.subscriptionId) {
        const validationService = validation_service_1.ValidationService.getInstance();
        validationService.validateUUID(queryParams.subscriptionId, 'Subscription ID');
        options.subscriptionId = queryParams.subscriptionId;
    }
    if (queryParams.startDate && queryParams.endDate) {
        options.dateRange = {
            startDate: new Date(queryParams.startDate),
            endDate: new Date(queryParams.endDate)
        };
    }
    const analytics = await getDunningAnalytics(options);
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Dunning analytics retrieved successfully',
        data: analytics
    });
}
async function handleUpdateDunningConfig(event, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestBody = JSON.parse(event.body || '{}');
    const configData = updateDunningConfigSchema.parse(requestBody);
    const updatedConfig = await prisma.subscription.update({
        where: {
            id: configData.subscriptionId
        },
        data: {
            gracePeriodDays: configData.gracePeriodDays,
            maxDunningAttempts: configData.maxAttempts,
            updatedAt: new Date()
        }
    });
    logger.info('Dunning configuration updated', {
        subscriptionId: configData.subscriptionId,
        updatedBy: authenticatedUser.email
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Dunning configuration updated successfully',
        data: updatedConfig
    });
}
async function handleGetDunningConfig(event) {
    const subscriptionId = event.queryStringParameters?.subscriptionId;
    if (!subscriptionId) {
        return (0, response_utils_1.createErrorResponse)('Subscription ID is required', 400, 'MISSING_SUBSCRIPTION_ID');
    }
    const validationService = validation_service_1.ValidationService.getInstance();
    validationService.validateUUID(subscriptionId, 'Subscription ID');
    const config = await getDunningConfig(subscriptionId);
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Dunning configuration retrieved successfully',
        data: config
    });
}
//# sourceMappingURL=dunning-management.js.map