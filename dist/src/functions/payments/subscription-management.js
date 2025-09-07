"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionManagementHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const database_service_1 = require("../shared/database.service");
const Razorpay = require('razorpay');
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const logger = logger_service_1.LoggerService.getInstance();
const database = database_service_1.LambdaDatabaseService.getInstance();
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});
const createSubscriptionSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid(),
    studentId: zod_1.z.string().uuid().optional(),
    subscriptionPlanId: zod_1.z.string().uuid(),
    paymentMethodId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    trialPeriodDays: zod_1.z.number().int().min(0).max(90).optional(),
    prorationEnabled: zod_1.z.boolean().default(true),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).default({})
});
const updateSubscriptionSchema = zod_1.z.object({
    subscriptionPlanId: zod_1.z.string().uuid().optional(),
    paymentMethodId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['active', 'paused', 'cancelled', 'past_due', 'suspended']).optional(),
    gracePeriodDays: zod_1.z.number().int().min(0).max(30).optional(),
    prorationEnabled: zod_1.z.boolean().optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
});
const subscriptionActionSchema = zod_1.z.object({
    action: zod_1.z.enum(['pause', 'resume', 'cancel', 'upgrade', 'downgrade']),
    newPlanId: zod_1.z.string().uuid().optional(),
    reason: zod_1.z.string().optional(),
    effectiveDate: zod_1.z.string().datetime().optional(),
    prorationEnabled: zod_1.z.boolean().default(true)
});
const getSubscriptionsQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
    status: zod_1.z.enum(['active', 'paused', 'cancelled', 'past_due', 'suspended', 'trial']).optional(),
    schoolId: zod_1.z.string().uuid().optional(),
    planType: zod_1.z.string().optional(),
    includeTrials: zod_1.z.coerce.boolean().default(false)
});
async function validateUserAccess(event, requestId) {
    const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
    const userId = event.headers['x-user-id'] || event.requestContext?.authorizer?.userId;
    const schoolId = event.headers['x-school-id'] || event.requestContext?.authorizer?.schoolId;
    const role = event.headers['x-user-role'] || event.requestContext?.authorizer?.role || 'user';
    if (!userId) {
        logger.warn('Subscription access denied - no user ID', {
            requestId,
            clientIP,
            userAgent: userAgent.substring(0, 200),
            action: 'authentication_failed'
        });
        throw new Error('Authentication required');
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
async function calculateProration(subscription, newPlan, effectiveDate = new Date()) {
    try {
        const currentPlan = subscription.subscriptionPlan;
        const billingCycleStart = new Date(subscription.startDate);
        const billingCycleEnd = new Date(subscription.nextBillingDate || new Date());
        const totalCycleDays = Math.ceil((billingCycleEnd.getTime() - billingCycleStart.getTime()) / (1000 * 60 * 60 * 24));
        const remainingDays = Math.ceil((billingCycleEnd.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24));
        const usedDays = totalCycleDays - remainingDays;
        if (remainingDays <= 0) {
            return {
                creditAmount: 0,
                chargeAmount: newPlan.price,
                description: 'Full charge for new plan - no remaining time',
                effectiveDate
            };
        }
        const currentDailyRate = currentPlan.price / totalCycleDays;
        const newDailyRate = newPlan.price / totalCycleDays;
        const creditAmount = currentDailyRate * remainingDays;
        const chargeAmount = newDailyRate * remainingDays;
        const netAmount = chargeAmount - creditAmount;
        logger.info('Proration calculated', {
            subscriptionId: subscription.id,
            currentPlanPrice: currentPlan.price,
            newPlanPrice: newPlan.price,
            totalCycleDays,
            remainingDays,
            usedDays,
            creditAmount,
            chargeAmount,
            netAmount
        });
        return {
            creditAmount: Math.max(0, creditAmount),
            chargeAmount: Math.max(0, chargeAmount),
            description: `Prorated ${remainingDays}/${totalCycleDays} days remaining`,
            effectiveDate
        };
    }
    catch (error) {
        logger.error('Proration calculation failed', {
            subscriptionId: subscription.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw new Error('Failed to calculate proration');
    }
}
async function createBillingCycle(subscriptionId, subscriptionPlan, startDate, nextBillingDate, isTrialCycle = false) {
    try {
        const billingAmount = isTrialCycle ? (subscriptionPlan.trialPrice || 0) : subscriptionPlan.price;
        const billingCycle = await database.prisma.billingCycle.create({
            data: {
                id: (0, uuid_1.v4)(),
                subscriptionId,
                cycleNumber: 1,
                cycleStart: startDate,
                cycleEnd: nextBillingDate,
                billingAmount,
                prorationAmount: 0,
                totalAmount: billingAmount,
                currency: subscriptionPlan.currency || 'INR',
                status: isTrialCycle ? 'trial' : 'active',
                billingDate: nextBillingDate,
                dueDate: nextBillingDate,
                dunningAttempts: 0
            }
        });
        logger.info('Billing cycle created', {
            subscriptionId,
            billingCycleId: billingCycle.id,
            billingAmount,
            isTrialCycle,
            nextBillingDate: nextBillingDate.toISOString()
        });
        return billingCycle;
    }
    catch (error) {
        logger.error('Failed to create billing cycle', {
            subscriptionId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
async function createSubscription(data, userId, requestId) {
    try {
        const validatedData = createSubscriptionSchema.parse(data);
        const subscriptionPlan = await database.prisma.subscriptionPlan.findFirst({
            where: {
                id: validatedData.subscriptionPlanId,
                isActive: true
            }
        });
        if (!subscriptionPlan) {
            throw new Error('Subscription plan not found or inactive');
        }
        const school = await database.prisma.school.findUnique({
            where: { id: validatedData.schoolId }
        });
        if (!school) {
            throw new Error('School not found');
        }
        if (validatedData.paymentMethodId) {
            const paymentMethod = await database.prisma.paymentMethod.findFirst({
                where: {
                    id: validatedData.paymentMethodId,
                    userId
                }
            });
            if (!paymentMethod) {
                throw new Error('Payment method not found');
            }
        }
        const existingSubscription = await database.prisma.subscription.findFirst({
            where: {
                userId,
                schoolId: validatedData.schoolId,
                status: { in: ['active', 'trial', 'past_due'] }
            }
        });
        if (existingSubscription) {
            throw new Error('Active subscription already exists for this school');
        }
        const now = new Date();
        const startDate = validatedData.startDate ? new Date(validatedData.startDate) : now;
        const trialDays = validatedData.trialPeriodDays ?? subscriptionPlan.trialPeriodDays;
        let nextBillingDate;
        let trialEndDate = null;
        let isTrialActive = false;
        if (trialDays && trialDays > 0) {
            trialEndDate = new Date(startDate.getTime() + trialDays * 24 * 60 * 60 * 1000);
            nextBillingDate = trialEndDate;
            isTrialActive = true;
        }
        else {
            switch (subscriptionPlan.billingCycle) {
                case 'monthly':
                    nextBillingDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                    break;
                case 'yearly':
                    nextBillingDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
                    break;
                case 'weekly':
                    nextBillingDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    nextBillingDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            }
        }
        const subscription = await database.prisma.subscription.create({
            data: {
                id: (0, uuid_1.v4)(),
                schoolId: validatedData.schoolId,
                userId,
                studentId: validatedData.studentId,
                subscriptionPlanId: validatedData.subscriptionPlanId,
                paymentMethodId: validatedData.paymentMethodId,
                status: isTrialActive ? 'trial' : 'active',
                startDate,
                nextBillingDate,
                billingCycle: subscriptionPlan.billingCycle,
                billingAmount: subscriptionPlan.price,
                currency: subscriptionPlan.currency || 'INR',
                prorationEnabled: validatedData.prorationEnabled,
                gracePeriodDays: 3,
                dunningAttempts: 0,
                maxDunningAttempts: 3,
                trialPeriodDays: trialDays,
                trialEndDate,
                isTrialActive
            },
            include: {
                subscriptionPlan: true,
                school: { select: { name: true, id: true } },
                user: { select: { email: true, firstName: true, lastName: true } }
            }
        });
        await createBillingCycle(subscription.id, subscriptionPlan, startDate, nextBillingDate, isTrialActive);
        await database.prisma.auditLog.create({
            data: {
                entityType: 'Subscription',
                entityId: subscription.id,
                action: 'SUBSCRIPTION_CREATED',
                changes: JSON.stringify(validatedData),
                userId,
                createdById: userId,
                metadata: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    subscriptionPlanId: validatedData.subscriptionPlanId,
                    schoolId: validatedData.schoolId,
                    trialPeriodDays: trialDays,
                    isTrialActive
                })
            }
        });
        logger.info('Subscription created successfully', {
            requestId,
            subscriptionId: subscription.id,
            userId,
            schoolId: validatedData.schoolId,
            planId: validatedData.subscriptionPlanId,
            trialDays,
            isTrialActive,
            nextBillingDate: nextBillingDate.toISOString()
        });
        return subscription;
    }
    catch (error) {
        logger.error('Failed to create subscription', {
            requestId,
            userId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
async function getSubscriptions(query, userRole, schoolId, requestId) {
    try {
        const whereClause = {};
        if (userRole === 'school_admin' && schoolId) {
            whereClause.schoolId = schoolId;
        }
        else if (query.schoolId) {
            whereClause.schoolId = query.schoolId;
        }
        if (query.status) {
            if (query.status === 'trial') {
                whereClause.isTrialActive = true;
            }
            else {
                whereClause.status = query.status;
                if (!query.includeTrials) {
                    whereClause.isTrialActive = false;
                }
            }
        }
        if (query.planType) {
            whereClause.subscriptionPlan = {
                planType: query.planType
            };
        }
        const [subscriptions, total] = await Promise.all([
            database.prisma.subscription.findMany({
                where: whereClause,
                include: {
                    subscriptionPlan: {
                        select: { name: true, planType: true, price: true, billingCycle: true }
                    },
                    school: {
                        select: { name: true, id: true }
                    },
                    user: {
                        select: { email: true, firstName: true, lastName: true }
                    },
                    billingCycles: {
                        select: { id: true, status: true, billingAmount: true, dueDate: true },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: query.offset,
                take: query.limit
            }),
            database.prisma.subscription.count({
                where: whereClause
            })
        ]);
        logger.info('Subscriptions retrieved', {
            requestId,
            total,
            returned: subscriptions.length,
            filters: query
        });
        return {
            subscriptions: subscriptions.map(sub => ({
                ...sub,
                user: sub.user ? {
                    email: sub.user.email,
                    name: `${sub.user.firstName} ${sub.user.lastName}`
                } : null
            })),
            total
        };
    }
    catch (error) {
        logger.error('Failed to get subscriptions', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
async function updateSubscription(subscriptionId, data, userId, requestId) {
    try {
        const validatedData = updateSubscriptionSchema.parse(data);
        const existing = await database.prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                subscriptionPlan: true,
                user: { select: { id: true, email: true } }
            }
        });
        if (!existing) {
            throw new Error('Subscription not found');
        }
        if (existing.userId !== userId) {
            throw new Error('Access denied - not your subscription');
        }
        let newPlan = null;
        if (validatedData.subscriptionPlanId) {
            newPlan = await database.prisma.subscriptionPlan.findFirst({
                where: {
                    id: validatedData.subscriptionPlanId,
                    isActive: true
                }
            });
            if (!newPlan) {
                throw new Error('New subscription plan not found or inactive');
            }
        }
        let prorationResult = null;
        if (newPlan && newPlan.id !== existing.subscriptionPlanId && validatedData.prorationEnabled !== false) {
            prorationResult = await calculateProration(existing, newPlan);
        }
        const updateData = {
            updatedAt: new Date()
        };
        if (validatedData.subscriptionPlanId) {
            updateData.subscriptionPlanId = validatedData.subscriptionPlanId;
            updateData.billingAmount = newPlan.price;
            updateData.billingCycle = newPlan.billingCycle;
            updateData.prorationAmount = prorationResult ? prorationResult.creditAmount - prorationResult.chargeAmount : 0;
        }
        if (validatedData.paymentMethodId) {
            updateData.paymentMethodId = validatedData.paymentMethodId;
        }
        if (validatedData.status) {
            updateData.status = validatedData.status;
            if (validatedData.status === 'cancelled') {
                updateData.endDate = new Date();
            }
            else if (validatedData.status === 'suspended') {
                updateData.suspendedAt = new Date();
            }
        }
        if (validatedData.gracePeriodDays !== undefined) {
            updateData.gracePeriodDays = validatedData.gracePeriodDays;
        }
        if (validatedData.prorationEnabled !== undefined) {
            updateData.prorationEnabled = validatedData.prorationEnabled;
        }
        const updated = await database.prisma.subscription.update({
            where: { id: subscriptionId },
            data: updateData,
            include: {
                subscriptionPlan: true,
                school: { select: { name: true, id: true } },
                user: { select: { email: true, firstName: true } }
            }
        });
        await database.prisma.auditLog.create({
            data: {
                entityType: 'Subscription',
                entityId: subscriptionId,
                action: 'SUBSCRIPTION_UPDATED',
                changes: JSON.stringify(validatedData),
                userId,
                createdById: userId,
                metadata: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    updatedFields: Object.keys(validatedData),
                    prorationResult
                })
            }
        });
        logger.info('Subscription updated successfully', {
            requestId,
            subscriptionId,
            userId,
            updatedFields: Object.keys(validatedData),
            prorationAmount: prorationResult ? prorationResult.creditAmount - prorationResult.chargeAmount : 0
        });
        return {
            subscription: updated,
            proration: prorationResult
        };
    }
    catch (error) {
        logger.error('Failed to update subscription', {
            requestId,
            subscriptionId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
async function handleSubscriptionAction(subscriptionId, data, userId, requestId) {
    try {
        const validatedData = subscriptionActionSchema.parse(data);
        const subscription = await database.prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                subscriptionPlan: true,
                user: { select: { id: true, email: true } }
            }
        });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        if (subscription.userId !== userId) {
            throw new Error('Access denied - not your subscription');
        }
        let updateData = { updatedAt: new Date() };
        let actionResult = {};
        switch (validatedData.action) {
            case 'pause':
                if (subscription.status !== 'active') {
                    throw new Error('Can only pause active subscriptions');
                }
                updateData.status = 'paused';
                updateData.suspendedAt = new Date();
                break;
            case 'resume':
                if (subscription.status !== 'paused') {
                    throw new Error('Can only resume paused subscriptions');
                }
                updateData.status = 'active';
                updateData.suspendedAt = null;
                break;
            case 'cancel':
                if (['cancelled', 'expired'].includes(subscription.status)) {
                    throw new Error('Subscription is already cancelled or expired');
                }
                updateData.status = 'cancelled';
                updateData.endDate = new Date();
                break;
            case 'upgrade':
            case 'downgrade':
                if (!validatedData.newPlanId) {
                    throw new Error('New plan ID required for upgrade/downgrade');
                }
                const newPlan = await database.prisma.subscriptionPlan.findFirst({
                    where: { id: validatedData.newPlanId, isActive: true }
                });
                if (!newPlan) {
                    throw new Error('New plan not found or inactive');
                }
                if (validatedData.prorationEnabled) {
                    const effectiveDate = validatedData.effectiveDate ? new Date(validatedData.effectiveDate) : new Date();
                    const prorationResult = await calculateProration(subscription, newPlan, effectiveDate);
                    actionResult.proration = prorationResult;
                    updateData.prorationAmount = prorationResult.creditAmount - prorationResult.chargeAmount;
                }
                updateData.subscriptionPlanId = validatedData.newPlanId;
                updateData.billingAmount = newPlan.price;
                updateData.billingCycle = newPlan.billingCycle;
                break;
            default:
                throw new Error(`Unsupported action: ${validatedData.action}`);
        }
        const updated = await database.prisma.subscription.update({
            where: { id: subscriptionId },
            data: updateData,
            include: {
                subscriptionPlan: true,
                school: { select: { name: true } },
                user: { select: { email: true, firstName: true } }
            }
        });
        await database.prisma.auditLog.create({
            data: {
                entityType: 'Subscription',
                entityId: subscriptionId,
                action: `SUBSCRIPTION_${validatedData.action.toUpperCase()}`,
                changes: JSON.stringify(validatedData),
                userId,
                createdById: userId,
                metadata: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    action: validatedData.action,
                    reason: validatedData.reason,
                    actionResult
                })
            }
        });
        logger.info(`Subscription ${validatedData.action} completed`, {
            requestId,
            subscriptionId,
            userId,
            action: validatedData.action,
            newStatus: updateData.status || subscription.status,
            newPlanId: validatedData.newPlanId
        });
        return {
            subscription: updated,
            action: validatedData.action,
            result: actionResult
        };
    }
    catch (error) {
        logger.error(`Failed to ${data.action} subscription`, {
            requestId,
            subscriptionId,
            action: data.action,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
const subscriptionManagementHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
        const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
        logger.info('Subscription management request started', {
            requestId,
            method: event.httpMethod,
            path: event.path,
            clientIP,
            userAgent: userAgent.substring(0, 200)
        });
        const { userId, schoolId, role } = await validateUserAccess(event, requestId);
        const subscriptionId = event.pathParameters?.subscriptionId;
        let result;
        switch (`${event.httpMethod}:${event.path}`) {
            case 'POST:/subscriptions':
                if (!event.body) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Request body required', undefined, 'MISSING_BODY', requestId);
                }
                const createData = JSON.parse(event.body);
                result = await createSubscription(createData, userId, requestId);
                break;
            case 'GET:/subscriptions':
                const queryParams = event.queryStringParameters || {};
                const listQuery = getSubscriptionsQuerySchema.parse(queryParams);
                const { subscriptions, total } = await getSubscriptions(listQuery, role, schoolId, requestId);
                result = {
                    subscriptions,
                    total,
                    pagination: {
                        offset: listQuery.offset,
                        limit: listQuery.limit,
                        hasMore: (listQuery.offset + listQuery.limit) < total
                    }
                };
                break;
            case 'GET:/subscriptions':
                if (!subscriptionId) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Missing subscriptionId in path parameters', undefined, 'MISSING_SUBSCRIPTION_ID', requestId);
                }
                const subscription = await database.prisma.subscription.findUnique({
                    where: { id: subscriptionId },
                    include: {
                        subscriptionPlan: true,
                        school: { select: { name: true, id: true } },
                        user: { select: { email: true, firstName: true, lastName: true } },
                        billingCycles: {
                            orderBy: { createdAt: 'desc' },
                            take: 5
                        }
                    }
                });
                if (!subscription) {
                    return (0, response_utils_1.createErrorResponse)(404, 'Subscription not found', undefined, 'NOT_FOUND', requestId);
                }
                result = { subscription };
                break;
            case 'PUT:/subscriptions':
                if (!subscriptionId) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Missing subscriptionId in path parameters', undefined, 'MISSING_SUBSCRIPTION_ID', requestId);
                }
                if (!event.body) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Request body required', undefined, 'MISSING_BODY', requestId);
                }
                const updateData = JSON.parse(event.body);
                result = await updateSubscription(subscriptionId, updateData, userId, requestId);
                break;
            case 'POST:/subscriptions/actions':
                if (!subscriptionId) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Missing subscriptionId in path parameters', undefined, 'MISSING_SUBSCRIPTION_ID', requestId);
                }
                if (!event.body) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Request body required', undefined, 'MISSING_BODY', requestId);
                }
                const actionData = JSON.parse(event.body);
                result = await handleSubscriptionAction(subscriptionId, actionData, userId, requestId);
                break;
            default:
                return (0, response_utils_1.createErrorResponse)(405, `Method ${event.httpMethod} not allowed for path ${event.path}`, undefined, 'METHOD_NOT_ALLOWED', requestId);
        }
        const duration = Date.now() - startTime;
        logger.info('Subscription management request completed', {
            requestId,
            method: event.httpMethod,
            path: event.path,
            userId,
            duration,
            success: true
        });
        return (0, response_utils_1.createSuccessResponse)(200, 'Subscription management operation completed successfully', result, requestId);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Subscription management request failed', {
            requestId,
            method: event.httpMethod,
            path: event.path,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration
        });
        if (error instanceof Error) {
            if (error.message.includes('Authentication required')) {
                return (0, response_utils_1.createErrorResponse)(401, 'Authentication required', undefined, 'AUTHENTICATION_REQUIRED', requestId);
            }
            if (error.message.includes('Access denied')) {
                return (0, response_utils_1.createErrorResponse)(403, 'Access denied', undefined, 'ACCESS_DENIED', requestId);
            }
            if (error.message.includes('not found')) {
                return (0, response_utils_1.createErrorResponse)(404, 'Resource not found', undefined, 'NOT_FOUND', requestId);
            }
            if (error.message.includes('already exists')) {
                return (0, response_utils_1.createErrorResponse)(409, 'Resource already exists', undefined, 'CONFLICT', requestId);
            }
        }
        return (0, response_utils_1.createErrorResponse)(500, 'Internal server error', undefined, 'INTERNAL_ERROR', requestId);
    }
};
exports.subscriptionManagementHandler = subscriptionManagementHandler;
//# sourceMappingURL=subscription-management.js.map