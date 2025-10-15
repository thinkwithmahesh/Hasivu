"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingAutomationHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const database_service_1 = require("../shared/database.service");
const razorpay_1 = __importDefault(require("razorpay"));
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const logger = logger_service_1.LoggerService.getInstance();
const database = database_service_1.LambdaDatabaseService.getInstance();
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});
const processBillingSchema = zod_1.z.object({
    billingDate: zod_1.z.string().datetime().optional(),
    dryRun: zod_1.z.boolean().default(false),
    batchSize: zod_1.z.number().int().min(1).max(500).default(100),
    subscriptionTypes: zod_1.z.array(zod_1.z.string()).optional()
});
const updateBillingCycleSchema = zod_1.z.object({
    status: zod_1.z.enum(['active', 'paused', 'cancelled', 'pending']).optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    billingAmount: zod_1.z.number().positive().optional()
});
const getBillingCyclesQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
    status: zod_1.z.enum(['active', 'paused', 'cancelled', 'pending']).optional(),
    schoolId: zod_1.z.string().uuid().optional(),
    subscriptionType: zod_1.z.string().optional(),
    dueDateFrom: zod_1.z.string().datetime().optional(),
    dueDateTo: zod_1.z.string().datetime().optional()
});
async function validateUserAccess(event, requestId) {
    const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
    const userId = event.headers['x-user-id'] || event.requestContext?.authorizer?.userId;
    const schoolId = event.headers['x-school-id'] || event.requestContext?.authorizer?.schoolId;
    const role = event.headers['x-user-role'] || event.requestContext?.authorizer?.role || 'user';
    if (!userId) {
        logger.warn('Billing access denied - no user ID', {
            requestId,
            clientIP,
            userAgent: userAgent.substring(0, 200),
            action: 'authentication_failed'
        });
        throw new Error('Authentication required');
    }
    if (!['admin', 'super_admin', 'billing_admin'].includes(role)) {
        logger.warn('Billing access denied - insufficient permissions', {
            requestId,
            userId,
            role,
            clientIP
        });
        throw new Error('Admin access required for billing operations');
    }
    const user = await database.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true, role: true }
    });
    if (!user || user.status !== 'ACTIVE') {
        throw new Error('Access denied');
    }
    return { userId, schoolId, role };
}
async function getBillingCycles(query, userRole, schoolId, requestId) {
    try {
        const whereClause = {};
        if (userRole === 'school_admin' && schoolId) {
            whereClause.subscription = {
                schoolId: schoolId
            };
        }
        else if (query.schoolId) {
            whereClause.subscription = {
                schoolId: query.schoolId
            };
        }
        if (query.status) {
            whereClause.status = query.status;
        }
        if (query.subscriptionType) {
            whereClause.subscription = {
                ...whereClause.subscription,
                subscriptionPlan: {
                    planType: query.subscriptionType
                }
            };
        }
        if (query.dueDateFrom || query.dueDateTo) {
            whereClause.dueDate = {};
            if (query.dueDateFrom) {
                whereClause.dueDate.gte = new Date(query.dueDateFrom);
            }
            if (query.dueDateTo) {
                whereClause.dueDate.lte = new Date(query.dueDateTo);
            }
        }
        const [billingCycles, total] = await Promise.all([
            database.prisma.billingCycle.findMany({
                where: whereClause,
                include: {
                    subscription: {
                        include: {
                            school: {
                                select: { name: true, id: true }
                            },
                            user: {
                                select: { email: true, firstName: true, lastName: true }
                            }
                        }
                    }
                },
                orderBy: { dueDate: 'asc' },
                skip: query.offset,
                take: query.limit
            }),
            database.prisma.billingCycle.count({
                where: whereClause
            })
        ]);
        logger.info('Billing cycles retrieved', {
            requestId,
            total,
            returned: billingCycles.length,
            filters: query
        });
        return {
            billingCycles: billingCycles.map(bc => ({
                ...bc,
                subscription: {
                    ...bc.subscription,
                    user: bc.subscription.user ? {
                        email: bc.subscription.user.email,
                        name: `${bc.subscription.user.firstName} ${bc.subscription.user.lastName}`
                    } : null
                }
            })),
            total
        };
    }
    catch (error) {
        logger.error('Failed to get billing cycles', {
            requestId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
async function processBillingCycle(billingCycle, dryRun = false) {
    try {
        if (dryRun) {
            return { success: true, revenue: billingCycle.billingAmount };
        }
        const orderOptions = {
            amount: billingCycle.billingAmount * 100,
            currency: 'INR',
            receipt: `subscription_${billingCycle.subscriptionId}_${Date.now()}`,
            notes: {
                subscriptionId: billingCycle.subscriptionId,
                billingCycleId: billingCycle.id,
                schoolId: billingCycle.subscription.schoolId
            }
        };
        const razorpayOrder = await razorpay.orders.create(orderOptions);
        const payment = await database.prisma.payment.create({
            data: {
                id: (0, uuid_1.v4)(),
                orderId: null,
                userId: billingCycle.subscription.userId,
                subscriptionId: billingCycle.subscriptionId,
                amount: billingCycle.billingAmount,
                currency: 'INR',
                status: 'pending',
                paymentType: 'subscription',
                razorpayOrderId: razorpayOrder.id,
                gatewayResponse: JSON.stringify({
                    subscriptionId: billingCycle.subscriptionId,
                    billingCycleId: billingCycle.id,
                    billingType: 'subscription_auto',
                    razorpayOrder
                })
            }
        });
        await database.prisma.billingCycle.update({
            where: { id: billingCycle.id },
            data: {
                status: 'processed',
                paidDate: new Date(),
                paymentId: payment.id,
                updatedAt: new Date()
            }
        });
        logger.info(`Billing cycle ${billingCycle.id} processed successfully`, {
            subscriptionId: billingCycle.subscriptionId,
            amount: billingCycle.billingAmount,
            paymentId: payment.id,
            razorpayOrderId: razorpayOrder.id
        });
        return { success: true, revenue: billingCycle.billingAmount };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error processing billing cycle ${billingCycle.id}:`, {
            subscriptionId: billingCycle.subscriptionId,
            error: errorMessage
        });
        await database.prisma.billingCycle.update({
            where: { id: billingCycle.id },
            data: {
                status: 'failed',
                updatedAt: new Date()
            }
        });
        return { success: false, revenue: 0, error: errorMessage };
    }
}
async function processDunningManagement(subscriptionId) {
    try {
        const subscription = await database.prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                user: {
                    select: { email: true, firstName: true }
                }
            }
        });
        if (!subscription) {
            return { subscriptionId, action: 'no_action' };
        }
        const failedCyclesCount = await database.prisma.billingCycle.count({
            where: {
                subscriptionId: subscriptionId,
                status: 'failed'
            }
        });
        if (failedCyclesCount === 0) {
            return { subscriptionId, action: 'no_action' };
        }
        if (failedCyclesCount >= 5) {
            await database.prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    status: 'cancelled',
                    endDate: new Date(),
                    updatedAt: new Date()
                }
            });
            logger.warn(`Subscription ${subscriptionId} cancelled due to max payment failures`, {
                failedCount: failedCyclesCount,
                userEmail: subscription.user?.email
            });
            return { subscriptionId, action: 'cancelled' };
        }
        else if (failedCyclesCount >= 3) {
            await database.prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    status: 'suspended',
                    suspendedAt: new Date(),
                    updatedAt: new Date()
                }
            });
            logger.warn(`Subscription ${subscriptionId} suspended due to payment failures`, {
                failedCount: failedCyclesCount,
                userEmail: subscription.user?.email
            });
            return { subscriptionId, action: 'suspended' };
        }
        else {
            const nextRetryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            await database.prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    status: 'past_due',
                    updatedAt: new Date()
                }
            });
            logger.info(`Dunning process triggered for subscription ${subscriptionId}, attempt ${failedCyclesCount}`, {
                userEmail: subscription.user?.email,
                nextRetryDate: nextRetryDate.toISOString()
            });
            return {
                subscriptionId,
                action: 'email_sent',
                nextRetryDate: nextRetryDate.toISOString()
            };
        }
    }
    catch (error) {
        logger.error(`Error in dunning management for subscription ${subscriptionId}:`, {
            error: error instanceof Error ? error.message : String(error)
        });
        return { subscriptionId, action: 'no_action' };
    }
}
async function processBillingCycles(data, userId, requestId) {
    try {
        const now = data.billingDate ? new Date(data.billingDate) : new Date();
        const whereClause = {
            status: 'active',
            dueDate: { lte: now }
        };
        if (data.subscriptionTypes && data.subscriptionTypes.length > 0) {
            whereClause.subscription = {
                subscriptionPlan: {
                    planType: { in: data.subscriptionTypes }
                }
            };
        }
        const dueBillingCycles = await database.prisma.billingCycle.findMany({
            where: whereClause,
            include: {
                subscription: {
                    include: {
                        user: { select: { email: true, firstName: true } },
                        school: { select: { name: true } }
                    }
                }
            },
            orderBy: { dueDate: 'asc' },
            take: data.batchSize
        });
        logger.info(`Found ${dueBillingCycles.length} billing cycles due for processing`, {
            requestId,
            dryRun: data.dryRun,
            billingDate: now.toISOString()
        });
        const result = {
            processed: 0,
            successful: 0,
            failed: 0,
            errors: [],
            totalRevenue: 0
        };
        for (const billingCycle of dueBillingCycles) {
            result.processed++;
            const cycleResult = await processBillingCycle(billingCycle, data.dryRun);
            if (cycleResult.success) {
                result.successful++;
                result.totalRevenue += cycleResult.revenue;
            }
            else {
                result.failed++;
                result.errors.push({
                    subscriptionId: billingCycle.subscriptionId,
                    error: cycleResult.error || 'Unknown error'
                });
                if (!data.dryRun) {
                    await processDunningManagement(billingCycle.subscriptionId);
                }
            }
        }
        if (!data.dryRun) {
            await database.prisma.auditLog.create({
                data: {
                    entityType: 'BillingCycle',
                    entityId: `batch_${Date.now()}`,
                    action: 'BILLING_BATCH_PROCESSED',
                    changes: JSON.stringify({
                        processed: result.processed,
                        successful: result.successful,
                        failed: result.failed,
                        totalRevenue: result.totalRevenue,
                        billingDate: now.toISOString()
                    }),
                    userId,
                    createdById: userId,
                    metadata: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        batchSize: data.batchSize,
                        subscriptionTypes: data.subscriptionTypes
                    })
                }
            });
        }
        logger.info(`Billing processing completed:`, {
            requestId,
            processed: result.processed,
            successful: result.successful,
            failed: result.failed,
            totalRevenue: result.totalRevenue,
            dryRun: data.dryRun
        });
        return result;
    }
    catch (error) {
        logger.error('Failed to process billing cycles', {
            requestId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
async function updateBillingCycle(cycleId, data, userId, requestId) {
    try {
        const validatedData = updateBillingCycleSchema.parse(data);
        const existing = await database.prisma.billingCycle.findUnique({
            where: { id: cycleId },
            include: {
                subscription: {
                    select: { schoolId: true, userId: true }
                }
            }
        });
        if (!existing) {
            throw new Error('Billing cycle not found');
        }
        const updateData = {
            updatedAt: new Date()
        };
        if (validatedData.status) {
            updateData.status = validatedData.status;
        }
        if (validatedData.dueDate) {
            updateData.dueDate = new Date(validatedData.dueDate);
        }
        if (validatedData.billingAmount) {
            updateData.billingAmount = validatedData.billingAmount;
            updateData.totalAmount = validatedData.billingAmount;
        }
        const updated = await database.prisma.billingCycle.update({
            where: { id: cycleId },
            data: updateData,
            include: {
                subscription: {
                    include: {
                        user: { select: { email: true, firstName: true } },
                        school: { select: { name: true } }
                    }
                }
            }
        });
        await database.prisma.auditLog.create({
            data: {
                entityType: 'BillingCycle',
                entityId: cycleId,
                action: 'BILLING_CYCLE_UPDATED',
                changes: JSON.stringify(validatedData),
                userId,
                createdById: userId,
                metadata: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    updatedFields: Object.keys(validatedData)
                })
            }
        });
        logger.info('Billing cycle updated', {
            requestId,
            cycleId,
            updatedFields: Object.keys(validatedData)
        });
        return updated;
    }
    catch (error) {
        logger.error('Failed to update billing cycle', {
            requestId,
            cycleId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
const billingAutomationHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
        const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
        logger.info('Billing automation request started', {
            requestId,
            method: event.httpMethod,
            path: event.path,
            clientIP,
            userAgent: userAgent.substring(0, 200)
        });
        const { userId, schoolId, role } = await validateUserAccess(event, requestId);
        const cycleId = event.pathParameters?.cycleId;
        let result;
        switch (`${event.httpMethod}:${event.path}`) {
            case 'POST:/billing/process': {
                const processData = event.body ?
                    processBillingSchema.parse(JSON.parse(event.body)) :
                    { dryRun: false, batchSize: 100 };
                result = await processBillingCycles(processData, userId, requestId);
                break;
            }
            case 'GET:/billing/cycles': {
                const queryParams = event.queryStringParameters || {};
                const listQuery = getBillingCyclesQuerySchema.parse(queryParams);
                const { billingCycles, total } = await getBillingCycles(listQuery, role, schoolId, requestId);
                result = {
                    billingCycles,
                    total,
                    pagination: {
                        offset: listQuery.offset,
                        limit: listQuery.limit,
                        hasMore: (listQuery.offset + listQuery.limit) < total
                    }
                };
                break;
            }
            case 'PUT:/billing/cycles': {
                if (!cycleId) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Missing cycleId in path parameters', undefined, 'MISSING_CYCLE_ID', requestId);
                }
                if (!event.body) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Request body required', undefined, 'MISSING_BODY', requestId);
                }
                const updateData = JSON.parse(event.body);
                const updatedCycle = await updateBillingCycle(cycleId, updateData, userId, requestId);
                result = {
                    billingCycle: updatedCycle,
                    message: 'Billing cycle updated successfully'
                };
                break;
            }
            default:
                return (0, response_utils_1.createErrorResponse)(405, `Method ${event.httpMethod} not allowed for path ${event.path}`, undefined, 'METHOD_NOT_ALLOWED', requestId);
        }
        const duration = Date.now() - startTime;
        logger.info('Billing automation request completed', {
            requestId,
            method: event.httpMethod,
            path: event.path,
            userId,
            duration,
            success: true
        });
        return (0, response_utils_1.createSuccessResponse)(result, 'Billing automation operation completed successfully', 200, requestId);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Billing automation request failed', {
            requestId,
            method: event.httpMethod,
            path: event.path,
            error: error instanceof Error ? error.message : String(error),
            duration
        });
        if (error instanceof Error) {
            if (error instanceof Error ? error.message : String(error).includes('Authentication required')) {
                return (0, response_utils_1.createErrorResponse)(401, 'Authentication required', undefined, 'AUTHENTICATION_REQUIRED', requestId);
            }
            if (error instanceof Error ? error.message : String(error).includes('Admin access required')) {
                return (0, response_utils_1.createErrorResponse)(403, 'Admin access required for billing operations', undefined, 'INSUFFICIENT_PERMISSIONS', requestId);
            }
            if (error instanceof Error ? error.message : String(error).includes('Access denied')) {
                return (0, response_utils_1.createErrorResponse)(403, 'Access denied', undefined, 'ACCESS_DENIED', requestId);
            }
            if (error instanceof Error ? error.message : String(error).includes('not found')) {
                return (0, response_utils_1.createErrorResponse)(404, 'Billing cycle not found', undefined, 'NOT_FOUND', requestId);
            }
        }
        return (0, response_utils_1.createErrorResponse)(500, 'Internal server error', undefined, 'INTERNAL_ERROR', requestId);
    }
};
exports.billingAutomationHandler = billingAutomationHandler;
//# sourceMappingURL=billing-automation.js.map