"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionPlansHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const createSubscriptionPlanSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    planType: zod_1.z.string().min(1).max(50),
    price: zod_1.z.number().min(0),
    currency: zod_1.z.string().length(3).default('INR'),
    billingCycle: zod_1.z.string().min(1).max(50),
    mealsPerDay: zod_1.z.number().positive().default(1),
    mealsPerWeek: zod_1.z.number().positive().optional(),
    mealsPerMonth: zod_1.z.number().positive().optional(),
    benefits: zod_1.z.string().default('{}'),
    trialPeriodDays: zod_1.z.number().min(0).max(90).default(0),
    trialPrice: zod_1.z.number().min(0).default(0),
    isActive: zod_1.z.boolean().default(true),
    availableFrom: zod_1.z.string().datetime().optional(),
    availableTo: zod_1.z.string().datetime().optional()
});
const updateSubscriptionPlanSchema = createSubscriptionPlanSchema.partial();
const planComparisonSchema = zod_1.z.object({
    planIds: zod_1.z.array(zod_1.z.string().uuid()).min(2).max(5),
    schoolId: zod_1.z.string().uuid().optional(),
    includeFeatures: zod_1.z.boolean().default(true),
    includePricing: zod_1.z.boolean().default(true),
    includeMetrics: zod_1.z.boolean().default(false)
});
const planFilterSchema = zod_1.z.object({
    planType: zod_1.z.string().optional(),
    minPrice: zod_1.z.number().min(0).optional(),
    maxPrice: zod_1.z.number().min(0).optional(),
    currency: zod_1.z.string().length(3).optional(),
    billingCycle: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
    limit: zod_1.z.number().min(1).max(100).default(20),
    offset: zod_1.z.number().min(0).default(0)
});
async function createSubscriptionPlan(event, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        if (!['super_admin', 'admin', 'school_admin'].includes(authenticatedUser.role)) {
            logger.warn('Unauthorized subscription plan creation attempt', {
                userId: authenticatedUser.id || "",
                userRole: authenticatedUser.role
            });
            return (0, response_utils_1.createErrorResponse)('Insufficient permissions to create subscription plans', 403, 'UNAUTHORIZED');
        }
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = createSubscriptionPlanSchema.parse(requestBody);
        const schoolId = authenticatedUser.schoolId;
        if (authenticatedUser.role === 'school_admin' && !schoolId) {
            logger.warn('School admin without school association', {
                userId: authenticatedUser.id
            });
            return (0, response_utils_1.createErrorResponse)('School admin must be associated with a school', 400, 'INVALID_SCHOOL_ASSOCIATION');
        }
        if (schoolId) {
            const existingPlan = await prisma.subscriptionPlan.findFirst({
                where: {
                    name: validatedData.name,
                    schoolId: schoolId
                }
            });
            if (existingPlan) {
                logger.warn('Duplicate subscription plan name for school', {
                    planName: validatedData.name,
                    schoolId: schoolId,
                    existingPlanId: existingPlan.id
                });
                return (0, response_utils_1.createErrorResponse)('A subscription plan with this name already exists in your school', 409, 'DUPLICATE_PLAN_NAME');
            }
        }
        const subscriptionPlan = await prisma.subscriptionPlan.create({
            data: {
                ...validatedData,
                schoolId: schoolId || 'default-school-id'
            }
        });
        await prisma.auditLog.create({
            data: {
                entityType: 'SubscriptionPlan',
                entityId: subscriptionPlan.id,
                action: 'PLAN_CREATED',
                changes: JSON.stringify({
                    planName: subscriptionPlan.name,
                    planType: subscriptionPlan.planType,
                    price: subscriptionPlan.price,
                    currency: subscriptionPlan.currency,
                    billingCycle: subscriptionPlan.billingCycle
                }),
                userId: authenticatedUser.id || "",
                createdById: authenticatedUser.id || "",
                metadata: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    schoolId: schoolId
                })
            }
        });
        logger.info('Subscription plan created successfully', {
            planId: subscriptionPlan.id,
            planName: subscriptionPlan.name,
            schoolId: schoolId,
            createdBy: authenticatedUser.email
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Subscription plan created successfully',
            data: {
                plan: subscriptionPlan
            }
        });
    }
    catch (error) {
        logger.error('Failed to create subscription plan', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            stack: error.stack,
            userId: authenticatedUser.id
        });
        if (error.name === 'ZodError') {
            return (0, response_utils_1.createErrorResponse)('Invalid plan data provided', 400, 'VALIDATION_ERROR');
        }
        return (0, response_utils_1.handleError)(error, 'Failed to create subscription plan');
    }
}
async function listSubscriptionPlans(event, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        const queryParams = event.queryStringParameters || {};
        const filters = planFilterSchema.parse(queryParams);
        const whereClause = {
            isActive: filters.isActive ?? true
        };
        if (authenticatedUser.role === 'school_admin' && authenticatedUser.schoolId) {
            whereClause.schoolId = authenticatedUser.schoolId;
        }
        if (filters.planType)
            whereClause.planType = filters.planType;
        if (filters.currency)
            whereClause.currency = filters.currency;
        if (filters.billingCycle)
            whereClause.billingCycle = filters.billingCycle;
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            whereClause.price = {};
            if (filters.minPrice !== undefined)
                whereClause.price.gte = filters.minPrice;
            if (filters.maxPrice !== undefined)
                whereClause.price.lte = filters.maxPrice;
        }
        const [plans, totalCount] = await Promise.all([
            prisma.subscriptionPlan.findMany({
                where: whereClause,
                orderBy: [
                    { price: 'asc' },
                    { createdAt: 'desc' }
                ],
                skip: filters.offset,
                take: filters.limit,
                include: {
                    school: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    _count: {
                        select: {
                            subscriptions: true
                        }
                    }
                }
            }),
            prisma.subscriptionPlan.count({ where: whereClause })
        ]);
        logger.info('Subscription plans retrieved successfully', {
            userId: authenticatedUser.id || "",
            plansCount: plans.length,
            total: totalCount,
            filters: filters
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Subscription plans retrieved successfully',
            data: {
                plans: plans,
                pagination: {
                    total: totalCount,
                    offset: filters.offset,
                    limit: filters.limit,
                    hasMore: (filters.offset + filters.limit) < totalCount
                }
            }
        });
    }
    catch (error) {
        logger.error('Failed to retrieve subscription plans', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            stack: error.stack,
            userId: authenticatedUser.id
        });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve subscription plans');
    }
}
async function updateSubscriptionPlan(event, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        const planId = event.pathParameters?.planId;
        if (!planId) {
            return (0, response_utils_1.createErrorResponse)('Plan ID is required', 400, 'MISSING_PLAN_ID');
        }
        if (!['super_admin', 'admin', 'school_admin'].includes(authenticatedUser.role)) {
            logger.warn('Unauthorized subscription plan update attempt', {
                userId: authenticatedUser.id || "",
                userRole: authenticatedUser.role,
                planId: planId
            });
            return (0, response_utils_1.createErrorResponse)('Insufficient permissions to update subscription plans', 403, 'UNAUTHORIZED');
        }
        const existingPlan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
            include: {
                _count: {
                    select: {
                        subscriptions: true
                    }
                }
            }
        });
        if (!existingPlan) {
            return (0, response_utils_1.createErrorResponse)('Subscription plan not found', 404, 'PLAN_NOT_FOUND');
        }
        if (authenticatedUser.role === 'school_admin') {
            if (existingPlan.schoolId !== authenticatedUser.schoolId) {
                logger.warn('School admin attempting to update plan from different school', {
                    userId: authenticatedUser.id || "",
                    userSchoolId: authenticatedUser.schoolId,
                    planSchoolId: existingPlan.schoolId,
                    planId: planId
                });
                return (0, response_utils_1.createErrorResponse)('Cannot update plans from other schools', 403, 'UNAUTHORIZED');
            }
        }
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = updateSubscriptionPlanSchema.parse(requestBody);
        if (existingPlan._count.subscriptions > 0) {
            const restrictedFields = ['price', 'billingCycle', 'currency'];
            const hasRestrictedChanges = restrictedFields.some(field => validatedData[field] !== undefined &&
                validatedData[field] !== existingPlan[field]);
            if (hasRestrictedChanges) {
                logger.warn('Attempted to modify pricing for plan with active subscriptions', {
                    planId: planId,
                    activeSubscriptions: existingPlan._count.subscriptions,
                    userId: authenticatedUser.id
                });
                return (0, response_utils_1.createErrorResponse)(`Cannot modify pricing for plan with ${existingPlan._count.subscriptions} active subscriptions`, 400, 'PLAN_HAS_ACTIVE_SUBSCRIPTIONS');
            }
        }
        const updatedPlan = await prisma.subscriptionPlan.update({
            where: { id: planId },
            data: validatedData,
            include: {
                school: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        await prisma.auditLog.create({
            data: {
                entityType: 'SubscriptionPlan',
                entityId: planId,
                action: 'PLAN_UPDATED',
                changes: JSON.stringify({
                    updatedFields: Object.keys(validatedData),
                    previousValues: Object.keys(validatedData).reduce((acc, key) => {
                        acc[key] = existingPlan[key];
                        return acc;
                    }, {}),
                    newValues: validatedData
                }),
                userId: authenticatedUser.id || "",
                createdById: authenticatedUser.id || "",
                metadata: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    activeSubscriptions: existingPlan._count.subscriptions
                })
            }
        });
        logger.info('Subscription plan updated successfully', {
            planId: planId,
            planName: updatedPlan.name,
            updatedBy: authenticatedUser.email,
            updatedFields: Object.keys(validatedData)
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Subscription plan updated successfully',
            data: {
                plan: updatedPlan
            }
        });
    }
    catch (error) {
        logger.error('Failed to update subscription plan', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            stack: error.stack,
            userId: authenticatedUser.id
        });
        if (error.name === 'ZodError') {
            return (0, response_utils_1.createErrorResponse)('Invalid plan data provided', 400, 'VALIDATION_ERROR');
        }
        return (0, response_utils_1.handleError)(error, 'Failed to update subscription plan');
    }
}
async function deactivateSubscriptionPlan(event, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        const planId = event.pathParameters?.planId;
        if (!planId) {
            return (0, response_utils_1.createErrorResponse)('Plan ID is required', 400, 'MISSING_PLAN_ID');
        }
        if (!['super_admin', 'admin', 'school_admin'].includes(authenticatedUser.role)) {
            logger.warn('Unauthorized subscription plan deactivation attempt', {
                userId: authenticatedUser.id || "",
                userRole: authenticatedUser.role,
                planId: planId
            });
            return (0, response_utils_1.createErrorResponse)('Insufficient permissions to deactivate subscription plans', 403, 'UNAUTHORIZED');
        }
        const existingPlan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
            include: {
                _count: {
                    select: {
                        subscriptions: {
                            where: {
                                status: {
                                    in: ['active', 'trialing', 'past_due']
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!existingPlan) {
            return (0, response_utils_1.createErrorResponse)('Subscription plan not found', 404, 'PLAN_NOT_FOUND');
        }
        if (authenticatedUser.role === 'school_admin') {
            if (existingPlan.schoolId !== authenticatedUser.schoolId) {
                logger.warn('School admin attempting to deactivate plan from different school', {
                    userId: authenticatedUser.id || "",
                    userSchoolId: authenticatedUser.schoolId,
                    planSchoolId: existingPlan.schoolId,
                    planId: planId
                });
                return (0, response_utils_1.createErrorResponse)('Cannot deactivate plans from other schools', 403, 'UNAUTHORIZED');
            }
        }
        if (existingPlan._count.subscriptions > 0) {
            logger.warn('Attempted to deactivate plan with active subscriptions', {
                planId: planId,
                activeSubscriptions: existingPlan._count.subscriptions,
                userId: authenticatedUser.id
            });
            return (0, response_utils_1.createErrorResponse)(`Cannot deactivate plan with ${existingPlan._count.subscriptions} active subscriptions`, 400, 'PLAN_HAS_ACTIVE_SUBSCRIPTIONS');
        }
        const deactivatedPlan = await prisma.subscriptionPlan.update({
            where: { id: planId },
            data: {
                isActive: false
            }
        });
        await prisma.auditLog.create({
            data: {
                entityType: 'SubscriptionPlan',
                entityId: planId,
                action: 'PLAN_DEACTIVATED',
                changes: JSON.stringify({
                    previousStatus: 'active',
                    newStatus: 'inactive',
                    reason: 'Manual deactivation'
                }),
                userId: authenticatedUser.id || "",
                createdById: authenticatedUser.id || "",
                metadata: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    deactivatedBy: authenticatedUser.email
                })
            }
        });
        logger.info('Subscription plan deactivated successfully', {
            planId: planId,
            planName: deactivatedPlan.name,
            deactivatedBy: authenticatedUser.email
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Subscription plan deactivated successfully',
            data: {
                plan: deactivatedPlan
            }
        });
    }
    catch (error) {
        logger.error('Failed to deactivate subscription plan', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            stack: error.stack,
            userId: authenticatedUser.id
        });
        return (0, response_utils_1.handleError)(error, 'Failed to deactivate subscription plan');
    }
}
async function compareSubscriptionPlans(event, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const { planIds, schoolId, includeFeatures, includePricing, includeMetrics } = planComparisonSchema.parse(requestBody);
        if (schoolId && authenticatedUser.role === 'school_admin' && authenticatedUser.schoolId !== schoolId) {
            logger.warn('School admin attempting to access other school data', {
                userId: authenticatedUser.id || "",
                userSchoolId: authenticatedUser.schoolId,
                requestedSchoolId: schoolId
            });
            return (0, response_utils_1.createErrorResponse)('Cannot access data from other schools', 403, 'UNAUTHORIZED');
        }
        const plans = await prisma.subscriptionPlan.findMany({
            where: {
                id: {
                    in: planIds
                },
                isActive: true
            },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: includeMetrics ? {
                    select: {
                        subscriptions: true
                    }
                } : undefined
            }
        });
        if (plans.length === 0) {
            return (0, response_utils_1.createErrorResponse)('No active plans found for comparison', 404, 'NO_PLANS_FOUND');
        }
        const comparison = {
            plans: plans.map(plan => ({
                id: plan.id,
                name: plan.name,
                description: plan.description,
                planType: plan.planType,
                school: plan.school,
                ...(includePricing && {
                    pricing: {
                        price: plan.price,
                        currency: plan.currency,
                        billingCycle: plan.billingCycle,
                        trialPeriodDays: plan.trialPeriodDays,
                        trialPrice: plan.trialPrice
                    }
                }),
                ...(includeFeatures && {
                    benefits: plan.benefits,
                    mealsPerDay: plan.mealsPerDay,
                    mealsPerWeek: plan.mealsPerWeek,
                    mealsPerMonth: plan.mealsPerMonth
                }),
                ...(includeMetrics && {
                    metrics: {
                        activeSubscriptions: plan._count?.subscriptions || 0
                    }
                })
            })),
            comparisonMatrix: includeFeatures ? generateFeatureComparisonMatrix(plans) : undefined
        };
        logger.info('Subscription plans compared successfully', {
            userId: authenticatedUser.id || "",
            planIds: planIds,
            plansFound: plans.length
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Subscription plans compared successfully',
            data: comparison
        });
    }
    catch (error) {
        logger.error('Failed to compare subscription plans', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            stack: error.stack,
            userId: authenticatedUser.id
        });
        if (error.name === 'ZodError') {
            return (0, response_utils_1.createErrorResponse)('Invalid comparison parameters', 400, 'VALIDATION_ERROR');
        }
        return (0, response_utils_1.handleError)(error, 'Failed to compare subscription plans');
    }
}
function generateFeatureComparisonMatrix(plans) {
    const allBenefits = [];
    plans.forEach(plan => {
        try {
            const benefits = JSON.parse(plan.benefits || '{}');
            Object.keys(benefits).forEach(key => {
                if (!allBenefits.includes(key)) {
                    allBenefits.push(key);
                }
            });
        }
        catch (e) {
        }
    });
    const matrix = allBenefits.map(benefit => ({
        feature: benefit,
        availability: plans.reduce((acc, plan) => {
            try {
                const benefits = JSON.parse(plan.benefits || '{}');
                acc[plan.id] = Object.prototype.hasOwnProperty.call(benefits, benefit);
            }
            catch (e) {
                acc[plan.id] = false;
            }
            return acc;
        }, {})
    }));
    return {
        features: matrix,
        summary: {
            totalFeatures: allBenefits.length,
            planCoverage: plans.map(plan => {
                let benefitCount = 0;
                try {
                    const benefits = JSON.parse(plan.benefits || '{}');
                    benefitCount = Object.keys(benefits).length;
                }
                catch (e) {
                    benefitCount = 0;
                }
                return {
                    planId: plan.id,
                    planName: plan.name,
                    featureCount: benefitCount,
                    coverage: allBenefits.length > 0 ? ((benefitCount / allBenefits.length * 100).toFixed(1) + '%') : '0%'
                };
            })
        }
    };
}
const subscriptionPlansHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Subscription plans request started', {
            requestId,
            method: event.httpMethod,
            path: event.path
        });
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if ('statusCode' in authResult) {
            return authResult;
        }
        const authenticatedUser = authResult;
        const method = event.httpMethod;
        const pathParams = event.pathParameters;
        if (method === 'GET' && !pathParams?.planId) {
            return await listSubscriptionPlans(event, authenticatedUser);
        }
        else if (method === 'POST' && event.path.includes('/compare')) {
            return await compareSubscriptionPlans(event, authenticatedUser);
        }
        else if (method === 'POST') {
            return await createSubscriptionPlan(event, authenticatedUser);
        }
        else if (method === 'PUT' && pathParams?.planId) {
            return await updateSubscriptionPlan(event, authenticatedUser);
        }
        else if (method === 'DELETE' && pathParams?.planId) {
            return await deactivateSubscriptionPlan(event, authenticatedUser);
        }
        else {
            return (0, response_utils_1.createErrorResponse)('Method not allowed or invalid path', 405, 'METHOD_NOT_ALLOWED');
        }
    }
    catch (error) {
        logger.error('Subscription plans request failed', {
            requestId,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to process subscription plans request');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.subscriptionPlansHandler = subscriptionPlansHandler;
//# sourceMappingURL=subscription-plans.js.map