"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.getCustomerLifetimeValue = exports.getChurnAnalysis = exports.getRevenueAnalysis = exports.getCohortAnalysis = exports.getSubscriptionDashboard = exports.getSubscriptionAnalytics = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../../shared/utils/logger");
const auth_1 = require("../../shared/middleware/auth");
// Response utilities replaced with standard HTTP responses
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
// Validation schemas
const analyticsQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    period: zod_1.z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
    subscriptionPlanId: zod_1.z.string().optional(),
    groupBy: zod_1.z.array(zod_1.z.enum(['plan', 'date', 'status'])).optional(),
    metrics: zod_1.z.array(zod_1.z.enum(['revenue', 'subscriptions', 'churn', 'mrr', 'arr'])).optional()
});
const cohortAnalysisSchema = zod_1.z.object({
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    cohortType: zod_1.z.enum(['monthly', 'weekly']),
    periods: zod_1.z.number().min(1).max(24)
});
const revenueAnalysisSchema = zod_1.z.object({
    period: zod_1.z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
    breakdown: zod_1.z.enum(['plan', 'billing_cycle']).optional(),
    includeProjections: zod_1.z.boolean().optional()
});
/**
 * Gets comprehensive subscription analytics
 */
async function getSubscriptionAnalytics(event) {
    try {
        const authResult = await (0, auth_1.authenticateJWT)(event);
        if (!authResult.success) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: authResult.error })
            };
        }
        if (!['admin', 'super_admin', 'school_admin'].includes(authResult.user?.role || '')) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Insufficient permissions' })
            };
        }
        const query = event.queryStringParameters || {};
        const validatedQuery = analyticsQuerySchema.parse(query);
        const schoolId = authResult.schoolId;
        if (!schoolId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'School ID is required' })
            };
        }
        // Set default date range if not provided
        const endDate = validatedQuery.endDate ? new Date(validatedQuery.endDate) : new Date();
        const startDate = validatedQuery.startDate ? new Date(validatedQuery.startDate) : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        const analytics = await generateComprehensiveAnalytics(schoolId, startDate, endDate, validatedQuery.period, validatedQuery.subscriptionPlanId, validatedQuery.groupBy, validatedQuery.metrics);
        return {
            statusCode: 200,
            body: JSON.stringify({
                ...analytics,
                dateRange: { startDate, endDate },
                period: validatedQuery.period,
                generatedAt: new Date().toISOString()
            })
        };
    }
    catch (error) {
        logger_1.logger.error('Error getting subscription analytics:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
}
exports.getSubscriptionAnalytics = getSubscriptionAnalytics;
/**
 * Gets subscription metrics dashboard data
 */
async function getSubscriptionDashboard(event) {
    try {
        const authResult = await (0, auth_1.authenticateJWT)(event);
        if (!authResult.success) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: authResult.error })
            };
        }
        if (!['admin', 'super_admin', 'school_admin'].includes(authResult.user?.role || '')) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Insufficient permissions' })
            };
        }
        const schoolId = authResult.schoolId;
        if (!schoolId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'School ID is required' })
            };
        }
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const dashboard = await generateDashboardMetrics(schoolId, now, thirtyDaysAgo, ninetyDaysAgo);
        return {
            statusCode: 200,
            body: JSON.stringify(dashboard)
        };
    }
    catch (error) {
        logger_1.logger.error('Error getting subscription dashboard:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
}
exports.getSubscriptionDashboard = getSubscriptionDashboard;
/**
 * Gets cohort analysis for subscription retention
 */
async function getCohortAnalysis(event) {
    try {
        const authResult = await (0, auth_1.authenticateJWT)(event);
        if (!authResult.success) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: authResult.error })
            };
        }
        if (!['admin', 'super_admin', 'school_admin'].includes(authResult.user?.role || '')) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Insufficient permissions' })
            };
        }
        const body = JSON.parse(event.body || '{}');
        const validatedData = cohortAnalysisSchema.parse(body);
        const schoolId = authResult.schoolId;
        if (!schoolId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'School ID is required' })
            };
        }
        const cohortAnalysis = await generateCohortAnalysis(schoolId, new Date(validatedData.startDate), new Date(validatedData.endDate), validatedData.cohortType, validatedData.periods);
        return {
            statusCode: 200,
            body: JSON.stringify(cohortAnalysis)
        };
    }
    catch (error) {
        logger_1.logger.error('Error getting cohort analysis:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
}
exports.getCohortAnalysis = getCohortAnalysis;
/**
 * Gets revenue analysis and projections
 */
async function getRevenueAnalysis(event) {
    try {
        const authResult = await (0, auth_1.authenticateJWT)(event);
        if (!authResult.success) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: authResult.error })
            };
        }
        if (!['admin', 'super_admin', 'school_admin'].includes(authResult.user?.role || '')) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Insufficient permissions' })
            };
        }
        const query = event.queryStringParameters || {};
        const validatedQuery = revenueAnalysisSchema.parse(query);
        const schoolId = authResult.schoolId;
        if (!schoolId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'School ID is required' })
            };
        }
        const revenueAnalysis = await generateRevenueAnalysis(schoolId, validatedQuery.period, validatedQuery.breakdown, validatedQuery.includeProjections);
        return {
            statusCode: 200,
            body: JSON.stringify(revenueAnalysis)
        };
    }
    catch (error) {
        logger_1.logger.error('Error getting revenue analysis:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
}
exports.getRevenueAnalysis = getRevenueAnalysis;
/**
 * Gets subscription churn analysis
 */
async function getChurnAnalysis(event) {
    try {
        const authResult = await (0, auth_1.authenticateJWT)(event);
        if (!authResult.success) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: authResult.error })
            };
        }
        if (!['admin', 'super_admin', 'school_admin'].includes(authResult.user?.role || '')) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Insufficient permissions' })
            };
        }
        const schoolId = authResult.schoolId;
        if (!schoolId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'School ID is required' })
            };
        }
        const churnAnalysis = await generateChurnAnalysis(schoolId);
        return {
            statusCode: 200,
            body: JSON.stringify(churnAnalysis)
        };
    }
    catch (error) {
        logger_1.logger.error('Error getting churn analysis:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
}
exports.getChurnAnalysis = getChurnAnalysis;
/**
 * Gets customer lifetime value analysis
 */
async function getCustomerLifetimeValue(event) {
    try {
        const authResult = await (0, auth_1.authenticateJWT)(event);
        if (!authResult.success) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: authResult.error })
            };
        }
        if (!['admin', 'super_admin', 'school_admin'].includes(authResult.user?.role || '')) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Insufficient permissions' })
            };
        }
        const schoolId = authResult.schoolId;
        if (!schoolId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'School ID is required' })
            };
        }
        const clvAnalysis = await generateCustomerLifetimeValueAnalysis(schoolId);
        return {
            statusCode: 200,
            body: JSON.stringify(clvAnalysis)
        };
    }
    catch (error) {
        logger_1.logger.error('Error getting customer lifetime value:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
}
exports.getCustomerLifetimeValue = getCustomerLifetimeValue;
// Helper functions for analytics generation
async function generateComprehensiveAnalytics(schoolId, startDate, endDate, period, subscriptionPlanId, groupBy, metrics) {
    const baseQuery = {
        where: {
            subscriptionPlan: subscriptionPlanId
                ? { schoolId, id: subscriptionPlanId }
                : { schoolId },
            createdAt: { gte: startDate, lte: endDate }
        }
    };
    const [subscriptions, payments, activeSubscriptions, cancelledSubscriptions] = await Promise.all([
        prisma.subscription.findMany(baseQuery),
        prisma.payment.findMany({
            where: {
                subscriptionId: {
                    in: (await prisma.subscription.findMany({
                        where: { subscriptionPlan: { schoolId } },
                        select: { id: true }
                    })).map(s => s.id)
                },
                createdAt: { gte: startDate, lte: endDate }
            }
        }),
        prisma.subscription.count({
            where: {
                subscriptionPlan: { schoolId },
                status: { in: ['active', 'trial'] }
            }
        }),
        prisma.subscription.count({
            where: {
                subscriptionPlan: { schoolId },
                status: 'cancelled',
                endDate: { gte: startDate, lte: endDate, not: null }
            }
        })
    ]);
    const analytics = {};
    // Revenue metrics
    if (!metrics || metrics.includes('revenue')) {
        analytics.revenue = calculateRevenueMetrics(payments);
    }
    // Subscription metrics
    if (!metrics || metrics.includes('subscriptions')) {
        analytics.subscriptions = calculateSubscriptionMetrics(subscriptions, activeSubscriptions);
    }
    // Churn metrics
    if (!metrics || metrics.includes('churn')) {
        analytics.churn = calculateChurnMetrics(subscriptions, cancelledSubscriptions);
    }
    // MRR/ARR metrics
    if (!metrics || metrics.includes('mrr') || metrics.includes('arr')) {
        analytics.recurringRevenue = await calculateRecurringRevenue(schoolId, endDate);
    }
    // Plan-wise breakdown
    if (groupBy?.includes('plan')) {
        analytics.planBreakdown = generatePlanBreakdown(subscriptions, payments);
    }
    // Time-series data
    if (groupBy?.includes('date')) {
        analytics.timeSeries = generateTimeSeriesData(subscriptions, payments, period || 'monthly');
    }
    return analytics;
}
async function generateDashboardMetrics(schoolId, now, thirtyDaysAgo, ninetyDaysAgo) {
    const [activeSubscriptions, totalRevenue, newSubscriptions, cancelledSubscriptions, successfulPayments, failedPayments, totalPlans, previousNewSubscriptions, previousRevenue] = await Promise.all([
        prisma.subscription.count({
            where: {
                subscriptionPlan: { schoolId },
                status: { in: ['active', 'trial'] }
            }
        }),
        prisma.payment.aggregate({
            where: {
                subscriptionId: {
                    in: (await prisma.subscription.findMany({
                        where: { subscriptionPlan: { schoolId } },
                        select: { id: true }
                    })).map(s => s.id)
                },
                status: 'completed',
                createdAt: { gte: thirtyDaysAgo }
            },
            _sum: { amount: true }
        }),
        prisma.subscription.count({
            where: {
                subscriptionPlan: { schoolId },
                createdAt: { gte: thirtyDaysAgo }
            }
        }),
        prisma.subscription.count({
            where: {
                subscriptionPlan: { schoolId },
                status: 'cancelled',
                endDate: { gte: thirtyDaysAgo, not: null }
            }
        }),
        prisma.payment.count({
            where: {
                subscriptionId: {
                    in: (await prisma.subscription.findMany({
                        where: { subscriptionPlan: { schoolId } },
                        select: { id: true }
                    })).map(s => s.id)
                },
                status: 'completed',
                createdAt: { gte: thirtyDaysAgo }
            }
        }),
        prisma.payment.count({
            where: {
                subscriptionId: {
                    in: (await prisma.subscription.findMany({
                        where: { subscriptionPlan: { schoolId } },
                        select: { id: true }
                    })).map(s => s.id)
                },
                status: 'failed',
                createdAt: { gte: thirtyDaysAgo }
            }
        }),
        prisma.subscriptionPlan.count({
            where: { schoolId, isActive: true }
        }),
        prisma.subscription.count({
            where: {
                subscriptionPlan: { schoolId },
                createdAt: { gte: ninetyDaysAgo, lt: thirtyDaysAgo }
            }
        }),
        prisma.payment.aggregate({
            where: {
                subscriptionId: {
                    in: (await prisma.subscription.findMany({
                        where: { subscriptionPlan: { schoolId } },
                        select: { id: true }
                    })).map(s => s.id)
                },
                status: 'completed',
                createdAt: { gte: ninetyDaysAgo, lt: thirtyDaysAgo }
            },
            _sum: { amount: true }
        })
    ]);
    // Calculate growth rates
    const subscriptionGrowthRate = previousNewSubscriptions > 0
        ? ((newSubscriptions - previousNewSubscriptions) / previousNewSubscriptions) * 100
        : 0;
    const revenueGrowthRate = (previousRevenue._sum.amount || 0) > 0
        ? (((totalRevenue._sum.amount || 0) - (previousRevenue._sum.amount || 0)) / (previousRevenue._sum.amount || 0)) * 100
        : 0;
    const churnRate = activeSubscriptions + cancelledSubscriptions > 0
        ? (cancelledSubscriptions / (activeSubscriptions + cancelledSubscriptions)) * 100
        : 0;
    return {
        overview: {
            activeSubscriptions,
            totalRevenue: totalRevenue._sum.amount || 0,
            newSubscriptions,
            churnRate
        },
        growth: {
            subscriptionGrowthRate,
            revenueGrowthRate
        },
        payments: {
            successful: successfulPayments,
            failed: failedPayments,
            successRate: (successfulPayments + failedPayments) > 0 ? (successfulPayments / (successfulPayments + failedPayments)) * 100 : 0
        },
        plans: {
            total: totalPlans
        }
    };
}
async function generateCohortAnalysis(schoolId, startDate, endDate, cohortType, periods) {
    const subscriptions = await prisma.subscription.findMany({
        where: {
            subscriptionPlan: { schoolId },
            createdAt: { gte: startDate, lte: endDate }
        },
        orderBy: { createdAt: 'asc' }
    });
    // Get payments separately since there's no direct relation
    const subscriptionIds = subscriptions.map(s => s.id);
    const payments = await prisma.payment.findMany({
        where: {
            subscriptionId: { in: subscriptionIds },
            status: 'completed'
        },
        orderBy: { createdAt: 'asc' }
    });
    // Group subscriptions by cohort (month or week)
    const cohorts = {};
    subscriptions.forEach(subscription => {
        const cohortKey = getCohortKey(subscription.createdAt, cohortType);
        if (!cohorts[cohortKey]) {
            cohorts[cohortKey] = [];
        }
        cohorts[cohortKey].push(subscription);
    });
    // Calculate retention for each cohort
    const cohortAnalysis = Object.keys(cohorts).map(cohortKey => {
        const cohortSubscriptions = cohorts[cohortKey];
        const cohortSize = cohortSubscriptions.length;
        const retentionPeriods = [];
        for (let period = 0; period < periods; period++) {
            const activeInPeriod = cohortSubscriptions.filter(sub => {
                return isActiveInPeriod(sub, sub.createdAt, period, cohortType);
            }).length;
            retentionPeriods.push({
                period,
                activeUsers: activeInPeriod,
                retentionRate: cohortSize > 0 ? (activeInPeriod / cohortSize) * 100 : 0
            });
        }
        return {
            cohort: cohortKey,
            cohortSize,
            retentionPeriods
        };
    });
    return {
        cohortType,
        periods,
        cohorts: cohortAnalysis
    };
}
async function generateRevenueAnalysis(schoolId, period, breakdown, includeProjections) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const payments = await prisma.payment.findMany({
        where: {
            subscriptionId: {
                in: (await prisma.subscription.findMany({
                    where: { subscriptionPlan: { schoolId } },
                    select: { id: true }
                })).map(s => s.id)
            },
            status: 'completed',
            createdAt: { gte: oneYearAgo }
        },
        orderBy: { createdAt: 'asc' }
    });
    const revenueData = groupRevenueByPeriod(payments, period || 'monthly');
    const breakdownData = breakdown === 'plan'
        ? groupRevenueByPlan(payments)
        : groupRevenueByBillingCycle(payments);
    let projections = {};
    if (includeProjections) {
        projections = calculateRevenueProjections(payments);
    }
    return {
        revenueData,
        breakdown: breakdownData,
        projections,
        period: period || 'monthly'
    };
}
async function generateChurnAnalysis(schoolId) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const [allSubscriptions, cancelledSubscriptions, newSubscriptions] = await Promise.all([
        prisma.subscription.findMany({
            where: {
                subscriptionPlan: { schoolId },
                status: { in: ['active', 'trial'] }
            }
        }),
        prisma.subscription.findMany({
            where: {
                subscriptionPlan: { schoolId },
                status: 'cancelled',
                endDate: { gte: sixMonthsAgo, not: null }
            },
            include: { subscriptionPlan: true }
        }),
        prisma.subscription.findMany({
            where: {
                subscriptionPlan: { schoolId },
                createdAt: { gte: sixMonthsAgo }
            },
            include: { subscriptionPlan: true }
        })
    ]);
    const churnRate = allSubscriptions.length > 0
        ? (cancelledSubscriptions.length / allSubscriptions.length) * 100
        : 0;
    const churnReasons = cancelledSubscriptions.reduce((acc, sub) => {
        const reason = sub.cancellationReason || 'Not specified';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
    }, {});
    const churnByPlan = cancelledSubscriptions.reduce((acc, sub) => {
        const planName = sub.subscriptionPlan.name;
        acc[planName] = (acc[planName] || 0) + 1;
        return acc;
    }, {});
    return {
        churnRate,
        churnReasons,
        churnByPlan,
        totalCancelled: cancelledSubscriptions.length
    };
}
async function generateCustomerLifetimeValueAnalysis(schoolId) {
    const subscriptions = await prisma.subscription.findMany({
        where: {
            subscriptionPlan: { schoolId }
        },
        include: {
            subscriptionPlan: true
        }
    });
    // Get payments for all subscriptions
    const subscriptionIds = subscriptions.map(s => s.id);
    const allPayments = await prisma.payment.findMany({
        where: {
            subscriptionId: { in: subscriptionIds },
            status: 'completed'
        }
    });
    const clvData = subscriptions.map(subscription => {
        const subscriptionPayments = allPayments.filter(p => p.subscriptionId === subscription.id);
        const totalRevenue = subscriptionPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const lifespanDays = subscription.endDate
            ? Math.ceil((subscription.endDate.getTime() - subscription.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : Math.ceil((new Date().getTime() - subscription.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return {
            subscriptionId: subscription.id,
            planName: subscription.subscriptionPlan.name,
            totalRevenue,
            lifespanDays
        };
    });
    const averageCLV = clvData.length > 0
        ? clvData.reduce((sum, data) => sum + data.totalRevenue, 0) / clvData.length
        : 0;
    const averageLifespan = clvData.length > 0
        ? clvData.reduce((sum, data) => sum + data.lifespanDays, 0) / clvData.length
        : 0;
    const clvByPlan = clvData.reduce((acc, data) => {
        if (!acc[data.planName]) {
            acc[data.planName] = { totalRevenue: 0, count: 0 };
        }
        acc[data.planName].totalRevenue += data.totalRevenue;
        acc[data.planName].count += 1;
        return acc;
    }, {});
    // Calculate average CLV by plan
    Object.keys(clvByPlan).forEach(planName => {
        clvByPlan[planName].averageCLV = clvByPlan[planName].totalRevenue / clvByPlan[planName].count;
    });
    return {
        averageCLV,
        averageLifespan,
        clvByPlan,
        totalSubscriptions: clvData.length
    };
}
// Helper calculation functions
function calculateRevenueMetrics(payments) {
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const averageOrderValue = payments.length > 0 ? totalRevenue / payments.length : 0;
    return {
        totalRevenue,
        averageOrderValue,
        paymentCount: payments.length
    };
}
function calculateSubscriptionMetrics(subscriptions, activeCount) {
    const planStats = {};
    subscriptions.forEach(sub => {
        const planName = sub.subscriptionPlan?.name || 'Unknown';
        if (!planStats[planName]) {
            planStats[planName] = { subscriptionCount: 0, activeCount: 0 };
        }
        planStats[planName].subscriptionCount++;
        if (['active', 'trial'].includes(sub.status)) {
            planStats[planName].activeCount++;
        }
    });
    return {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeCount,
        planStats
    };
}
function calculateChurnMetrics(subscriptions, cancelledCount) {
    const totalSubscriptions = subscriptions.length;
    const churnRate = totalSubscriptions > 0 ? (cancelledCount / totalSubscriptions) * 100 : 0;
    return {
        churnRate,
        totalCancelled: cancelledCount,
        totalSubscriptions
    };
}
async function calculateRecurringRevenue(schoolId, endDate) {
    const activeSubscriptions = await prisma.subscription.findMany({
        where: {
            subscriptionPlan: { schoolId },
            status: { in: ['active', 'trial'] },
            createdAt: { lte: endDate }
        },
        include: {
            subscriptionPlan: true
        }
    });
    const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
        const planPrice = sub.subscriptionPlan.price;
        const billingCycle = sub.subscriptionPlan.billingCycle;
        // Convert to monthly revenue
        let monthlyAmount = 0;
        if (billingCycle === 'monthly') {
            monthlyAmount = planPrice;
        }
        else if (billingCycle === 'quarterly') {
            monthlyAmount = planPrice / 3;
        }
        else if (billingCycle === 'yearly') {
            monthlyAmount = planPrice / 12;
        }
        return sum + monthlyAmount;
    }, 0);
    return {
        mrr: monthlyRevenue,
        arr: monthlyRevenue * 12
    };
}
function generatePlanBreakdown(subscriptions, payments) {
    const planStats = {};
    subscriptions.forEach(sub => {
        const planName = sub.subscriptionPlan?.name || 'Unknown';
        if (!planStats[planName]) {
            planStats[planName] = { subscriptionCount: 0, revenue: 0, activeCount: 0 };
        }
        planStats[planName].subscriptionCount++;
        if (['active', 'trial'].includes(sub.status)) {
            planStats[planName].activeCount++;
        }
    });
    payments.forEach(payment => {
        const planName = payment.subscription?.subscriptionPlan?.name || 'Unknown';
        if (planStats[planName]) {
            planStats[planName].revenue += payment.amount;
        }
    });
    return planStats;
}
function groupRevenueByPeriod(payments, period) {
    const grouped = {};
    payments.forEach(payment => {
        const key = getPeriodKey(payment.createdAt, period);
        grouped[key] = (grouped[key] || 0) + payment.amount;
    });
    return grouped;
}
function generateTimeSeriesData(subscriptions, payments, period) {
    const subscriptionData = groupSubscriptionsByPeriod(subscriptions, period);
    const revenueData = groupRevenueByPeriod(payments, period);
    return {
        subscriptions: subscriptionData,
        revenue: revenueData
    };
}
function groupSubscriptionsByPeriod(subscriptions, period) {
    const grouped = {};
    subscriptions.forEach(subscription => {
        const key = getPeriodKey(subscription.createdAt, period);
        grouped[key] = (grouped[key] || 0) + 1;
    });
    return grouped;
}
function getPeriodKey(date, period) {
    const d = new Date(date);
    switch (period) {
        case 'daily':
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        case 'weekly':
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        case 'monthly':
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        case 'quarterly':
            const quarter = Math.ceil((d.getMonth() + 1) / 3);
            return `${d.getFullYear()}-Q${quarter}`;
        default:
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
}
function groupRevenueByPlan(payments) {
    const grouped = {};
    payments.forEach(payment => {
        const planName = payment.subscription?.subscriptionPlan?.name || 'Unknown';
        grouped[planName] = (grouped[planName] || 0) + payment.amount;
    });
    return grouped;
}
function groupRevenueByBillingCycle(payments) {
    const grouped = {};
    payments.forEach(payment => {
        const billingCycle = payment.subscription?.subscriptionPlan?.billingCycle || 'unknown';
        grouped[billingCycle] = (grouped[billingCycle] || 0) + payment.amount;
    });
    return grouped;
}
function calculateRevenueProjections(payments) {
    // Simple linear projection based on recent trends
    const recentPayments = payments.slice(-90); // Last 90 days
    const monthlyAverage = recentPayments.reduce((sum, p) => sum + p.amount, 0) / 3; // Approximate monthly average
    const projections = [];
    for (let i = 0; i < 12; i++) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i + 1);
        const futureKey = `projection_${i + 1}`;
        projections.push({
            period: futureKey,
            projectedRevenue: monthlyAverage * (1 + (i * 0.05)), // 5% growth per month assumption
            confidence: Math.max(0.5, 1 - (i * 0.1)) // Decreasing confidence over time
        });
    }
    return projections;
}
function getCohortKey(date, cohortType) {
    if (cohortType === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
    }
    else {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
}
function isActiveInPeriod(subscription, cohortStart, period, cohortType) {
    const periodStart = new Date(cohortStart);
    if (cohortType === 'weekly') {
        periodStart.setDate(periodStart.getDate() + (period * 7));
    }
    else {
        periodStart.setMonth(periodStart.getMonth() + period);
    }
    const periodEnd = new Date(periodStart);
    if (cohortType === 'weekly') {
        periodEnd.setDate(periodEnd.getDate() + 6);
    }
    else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(periodEnd.getDate() - 1);
    }
    // Check if subscription was active during this period
    const subStart = subscription.createdAt;
    const subEnd = subscription.cancelledAt || new Date();
    return subStart <= periodEnd && subEnd >= periodStart;
}
// Export handler for serverless framework
const handler = async (event, context) => {
    const { httpMethod, path } = event;
    try {
        switch (`${httpMethod}:${path}`) {
            case 'GET:/subscription-analytics':
                return await getSubscriptionAnalytics(event);
            case 'GET:/subscription-analytics/dashboard':
                return await getSubscriptionDashboard(event);
            case 'POST:/subscription-analytics/cohort':
                return await getCohortAnalysis(event);
            case 'GET:/subscription-analytics/revenue':
                return await getRevenueAnalysis(event);
            case 'GET:/subscription-analytics/churn':
                return await getChurnAnalysis(event);
            case 'GET:/subscription-analytics/clv':
                return await getCustomerLifetimeValue(event);
            default:
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'Endpoint not found' })
                };
        }
    }
    catch (error) {
        logger_1.logger.error('Subscription analytics handler error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.handler = handler;
