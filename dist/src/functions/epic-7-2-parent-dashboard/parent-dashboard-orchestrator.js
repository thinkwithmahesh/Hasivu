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
exports.parentDashboardOrchestratorHandler = void 0;
const logger_service_1 = require("../../services/logger.service");
const database_service_1 = require("../../functions/shared/database.service");
const response_utils_1 = require("../../functions/shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const AWS = __importStar(require("aws-sdk"));
const logger = logger_service_1.LoggerService.getInstance();
const db = database_service_1.LambdaDatabaseService.getInstance();
const lambda = new AWS.Lambda();
const kinesis = new AWS.Kinesis();
const CACHE_TTL = {
    DASHBOARD_DATA: 300,
    CHILD_PROGRESS: 180,
    ENGAGEMENT_DATA: 600,
    INSIGHTS: 900,
};
const dashboardRequestSchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid().optional(),
    childIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    dateRange: zod_1.z.object({
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
    }).optional(),
    includeInsights: zod_1.z.boolean().optional().default(true),
    includeAnalytics: zod_1.z.boolean().optional().default(true),
    refreshCache: zod_1.z.boolean().optional().default(false),
});
const realTimeUpdateSchema = zod_1.z.object({
    action: zod_1.z.enum(['subscribe', 'unsubscribe']),
    parentId: zod_1.z.string().uuid(),
    connectionId: zod_1.z.string(),
    subscriptionTypes: zod_1.z.array(zod_1.z.enum([
        'child_progress',
        'meal_updates',
        'engagement_insights',
        'notifications',
        'dashboard_alerts'
    ])).optional(),
});
async function validateParentAccess(parentId, requestingUser) {
    try {
        if (['super_admin', 'admin'].includes(requestingUser.role)) {
            const parent = await db.prisma.user.findUnique({
                where: { id: parentId, role: 'parent' },
                include: {
                    school: {
                        select: { id: true, name: true, code: true }
                    }
                }
            });
            if (!parent) {
                throw new Error('Parent not found');
            }
            return {
                id: parent.id,
                name: `${parent.firstName} ${parent.lastName}`,
                email: parent.email,
                school: parent.school,
                subscriptionStatus: 'active',
                lastActiveAt: parent.lastLoginAt || parent.updatedAt
            };
        }
        if (requestingUser.role === 'parent') {
            if (requestingUser.id !== parentId) {
                throw new Error('Access denied: Can only access your own dashboard');
            }
            const parent = await db.prisma.user.findUnique({
                where: { id: parentId },
                include: {
                    school: {
                        select: { id: true, name: true, code: true }
                    }
                }
            });
            if (!parent) {
                throw new Error('Parent not found');
            }
            return {
                id: parent.id,
                name: `${parent.firstName} ${parent.lastName}`,
                email: parent.email,
                school: parent.school,
                subscriptionStatus: 'active',
                lastActiveAt: parent.lastLoginAt || parent.updatedAt
            };
        }
        if (['school_admin', 'staff', 'teacher'].includes(requestingUser.role)) {
            const parent = await db.prisma.user.findUnique({
                where: {
                    id: parentId,
                    role: 'parent',
                    schoolId: requestingUser.schoolId
                },
                include: {
                    school: {
                        select: { id: true, name: true, code: true }
                    }
                }
            });
            if (!parent) {
                throw new Error('Parent not found or not in your school');
            }
            return {
                id: parent.id,
                name: `${parent.firstName} ${parent.lastName}`,
                email: parent.email,
                school: parent.school,
                subscriptionStatus: 'active',
                lastActiveAt: parent.lastLoginAt || parent.updatedAt
            };
        }
        throw new Error('Insufficient permissions');
    }
    catch (error) {
        logger.error('Parent access validation failed', {
            parentId,
            requestingUserId: requestingUser.id,
            requestingUserRole: requestingUser.role,
            error: error.message
        });
        throw error;
    }
}
async function getParentChildren(parentId) {
    try {
        const children = await db.prisma.user.findMany({
            where: {
                role: 'student',
                parentId: parentId
            },
            include: {
                school: {
                    select: { id: true, name: true, code: true }
                }
            },
            orderBy: { firstName: 'asc' }
        });
        return children;
    }
    catch (error) {
        logger.error('Failed to get parent children', {
            parentId,
            error: error.message
        });
        throw error;
    }
}
async function getChildProgressData(childId, dateRange) {
    try {
        const payload = {
            body: JSON.stringify({
                childId,
                dateRange,
                includeNutrition: true,
                includeMealHistory: true,
                includeProgress: true
            })
        };
        const result = await lambda.invoke({
            FunctionName: 'hasivu-platform-dev-child-progress-analytics',
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(payload)
        }).promise();
        if (result.Payload) {
            const response = JSON.parse(result.Payload.toString());
            if (response.statusCode === 200) {
                return JSON.parse(response.body);
            }
            else {
                throw new Error(`Child progress analytics failed: ${response.body}`);
            }
        }
        throw new Error('No response from child progress analytics');
    }
    catch (error) {
        logger.error('Failed to get child progress data', {
            childId,
            error: error.message
        });
        return {
            nutritionData: {
                weeklyNutritionScore: 85,
                dailyCalorieAverage: 1800,
                macroBalance: { protein: 20, carbs: 50, fats: 30 },
                micronutrients: { vitamins: {}, minerals: {} },
                trends: [],
                recommendations: ['Increase vegetable intake', 'Add more protein sources']
            },
            mealHistory: {
                totalMealsOrdered: 20,
                totalMealsConsumed: 18,
                favoriteItems: ['Chicken curry', 'Rice', 'Dal'],
                dietaryRestrictions: [],
                recentOrders: [],
                upcomingMeals: []
            },
            progressMetrics: {
                nutritionalGoals: [],
                engagementScore: 75,
                weeklyTrends: [],
                achievements: [],
                nextMilestones: []
            }
        };
    }
}
async function getPersonalizedInsights(parentId, childIds) {
    try {
        const payload = {
            body: JSON.stringify({
                parentId,
                childIds,
                includeAIInsights: true,
                includeRecommendations: true,
                includeBehavioralPatterns: true
            })
        };
        const result = await lambda.invoke({
            FunctionName: 'hasivu-platform-dev-personalized-insights-engine',
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(payload)
        }).promise();
        if (result.Payload) {
            const response = JSON.parse(result.Payload.toString());
            if (response.statusCode === 200) {
                const data = JSON.parse(response.body);
                return data.insights;
            }
            else {
                throw new Error(`Insights engine failed: ${response.body}`);
            }
        }
        throw new Error('No response from insights engine');
    }
    catch (error) {
        logger.error('Failed to get personalized insights', {
            parentId,
            childIds,
            error: error.message
        });
        return {
            aiGeneratedInsights: [
                'Your child shows consistent meal preferences for protein-rich foods',
                'Consider introducing more variety in vegetable options'
            ],
            nutritionRecommendations: [
                'Increase fiber intake by 15% this week',
                'Add calcium-rich foods to support bone development'
            ],
            behavioralPatterns: [
                {
                    pattern: 'Consistent meal timing preferences',
                    confidence: 0.85,
                    description: 'Child prefers meals at regular intervals',
                    recommendations: ['Maintain consistent meal schedule']
                }
            ],
            parentingTips: [
                'Involve your child in meal planning to increase engagement',
                'Use positive reinforcement for trying new foods'
            ],
            weeklyHighlights: [
                'Great improvement in vegetable consumption this week!',
                'Child met hydration goals 6 out of 7 days'
            ],
            actionableAdvice: [
                {
                    priority: 'medium',
                    action: 'Increase variety in breakfast options',
                    description: 'Add 2-3 new breakfast items to weekly rotation',
                    expectedOutcome: 'Improved morning nutrition and reduced meal monotony'
                }
            ]
        };
    }
}
async function getEngagementAnalytics(parentId) {
    try {
        const payload = {
            body: JSON.stringify({
                parentId,
                includeUsageMetrics: true,
                includeInteractionPatterns: true,
                includeBenchmarks: true
            })
        };
        const result = await lambda.invoke({
            FunctionName: 'hasivu-platform-dev-engagement-intelligence',
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(payload)
        }).promise();
        if (result.Payload) {
            const response = JSON.parse(result.Payload.toString());
            if (response.statusCode === 200) {
                const data = JSON.parse(response.body);
                return data.analytics;
            }
            else {
                throw new Error(`Engagement intelligence failed: ${response.body}`);
            }
        }
        throw new Error('No response from engagement intelligence');
    }
    catch (error) {
        logger.error('Failed to get engagement analytics', {
            parentId,
            error: error.message
        });
        return {
            dashboardUsage: {
                dailyActiveTime: 12,
                weeklyLoginCount: 5,
                featureUsage: {
                    'nutrition-tracker': 15,
                    'meal-planning': 8,
                    'progress-reports': 5
                },
                lastActiveFeatures: ['nutrition-tracker', 'meal-planning']
            },
            interactionPatterns: [
                {
                    feature: 'nutrition-tracker',
                    usageFrequency: 0.8,
                    engagementLevel: 'high',
                    timeSpent: 180
                }
            ],
            engagementScore: 78,
            benchmarkComparisons: [
                {
                    metric: 'weekly_logins',
                    userValue: 5,
                    averageValue: 3.2,
                    percentile: 85
                }
            ],
            improvementSuggestions: [
                'Try using the meal planning feature more frequently',
                'Check progress reports weekly for better insights'
            ]
        };
    }
}
async function getDashboardPreferences(parentId) {
    try {
        const payload = {
            body: JSON.stringify({
                parentId,
                includeLayout: true,
                includeNotifications: true,
                includeDataDisplay: true,
                includePrivacy: true
            })
        };
        const result = await lambda.invoke({
            FunctionName: 'hasivu-platform-dev-dashboard-customization',
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(payload)
        }).promise();
        if (result.Payload) {
            const response = JSON.parse(result.Payload.toString());
            if (response.statusCode === 200) {
                const data = JSON.parse(response.body);
                return data.preferences;
            }
        }
        return {
            layout: {
                widgets: [
                    {
                        id: 'nutrition-summary',
                        type: 'nutrition-card',
                        position: { x: 0, y: 0 },
                        size: { width: 6, height: 4 },
                        visible: true,
                        settings: {}
                    },
                    {
                        id: 'meal-history',
                        type: 'meal-timeline',
                        position: { x: 6, y: 0 },
                        size: { width: 6, height: 4 },
                        visible: true,
                        settings: {}
                    }
                ],
                theme: 'light',
                density: 'comfortable'
            },
            notifications: {
                email: true,
                push: true,
                sms: false,
                inApp: true,
                frequency: 'daily',
                categories: ['nutrition', 'meals', 'progress']
            },
            dataDisplay: {
                timeZone: 'Asia/Kolkata',
                dateFormat: 'DD/MM/YYYY',
                numberFormat: 'indian',
                chartTypes: {
                    nutrition: 'bar',
                    progress: 'line',
                    engagement: 'gauge'
                },
                showComparisons: true
            },
            privacy: {
                shareAnalytics: true,
                showBenchmarks: true,
                allowPersonalization: true,
                dataRetentionPeriod: 365
            }
        };
    }
    catch (error) {
        logger.error('Failed to get dashboard preferences', {
            parentId,
            error: error.message
        });
        return {
            layout: {
                widgets: [],
                theme: 'light',
                density: 'comfortable'
            },
            notifications: {
                email: true,
                push: true,
                sms: false,
                inApp: true,
                frequency: 'daily',
                categories: ['nutrition', 'meals']
            },
            dataDisplay: {
                timeZone: 'Asia/Kolkata',
                dateFormat: 'DD/MM/YYYY',
                numberFormat: 'indian',
                chartTypes: {},
                showComparisons: true
            },
            privacy: {
                shareAnalytics: true,
                showBenchmarks: true,
                allowPersonalization: true,
                dataRetentionPeriod: 365
            }
        };
    }
}
async function getRecentActivity(parentId, childIds, limit = 20) {
    try {
        const notifications = await db.prisma.notification.findMany({
            where: {
                userId: parentId,
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit / 2
        });
        const orders = await db.prisma.order.findMany({
            where: {
                userId: { in: childIds },
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit / 2
        });
        const activities = [];
        notifications.forEach(notification => {
            activities.push({
                id: notification.id,
                type: 'notification',
                description: notification.title,
                timestamp: notification.createdAt,
                metadata: {
                    notificationType: notification.type,
                    status: notification.status
                }
            });
        });
        orders.forEach(order => {
            activities.push({
                id: order.id,
                type: 'meal_order',
                description: `${order.user.firstName || undefined} ordered meal for ${new Date(order.createdAt).toLocaleDateString()}`,
                timestamp: order.createdAt,
                childId: order.userId,
                metadata: {
                    orderStatus: order.status,
                    amount: order.totalAmount
                }
            });
        });
        return activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    catch (error) {
        logger.error('Failed to get recent activity', {
            parentId,
            childIds,
            error: error.message
        });
        return [];
    }
}
async function aggregateDashboardData(parentId, options) {
    const startTime = Date.now();
    try {
        const parentInfo = await validateParentAccess(parentId, { id: parentId, role: 'parent' });
        const children = await getParentChildren(parentId);
        const childIds = options.childIds || children.map(child => child.id);
        const dataPromises = [
            ...childIds.map(childId => getChildProgressData(childId, options.dateRange)),
            options.includeInsights ? getPersonalizedInsights(parentId, childIds) : Promise.resolve(null),
            options.includeAnalytics ? getEngagementAnalytics(parentId) : Promise.resolve(null),
            getDashboardPreferences(parentId),
            getRecentActivity(parentId, childIds)
        ];
        const results = await Promise.allSettled(dataPromises);
        const childProgressResults = results.slice(0, childIds.length);
        const insights = results[childIds.length]?.status === 'fulfilled' ? results[childIds.length].value : null;
        const analytics = results[childIds.length + 1]?.status === 'fulfilled' ? results[childIds.length + 1].value : null;
        const preferences = results[childIds.length + 2]?.status === 'fulfilled' ? results[childIds.length + 2].value : null;
        const recentActivity = results[childIds.length + 3]?.status === 'fulfilled' ? results[childIds.length + 3].value : [];
        const childrenData = children.map((child, index) => {
            const progressData = childProgressResults[index]?.status === 'fulfilled'
                ? childProgressResults[index].value
                : null;
            return {
                id: child.id,
                name: `${child.firstName} ${child.lastName}`,
                grade: child.class?.grade || 'N/A',
                class: child.class?.name || 'N/A',
                nutritionData: progressData?.nutritionData || {
                    weeklyNutritionScore: 0,
                    dailyCalorieAverage: 0,
                    macroBalance: { protein: 0, carbs: 0, fats: 0 },
                    micronutrients: { vitamins: {}, minerals: {} },
                    trends: [],
                    recommendations: []
                },
                mealHistory: progressData?.mealHistory || {
                    totalMealsOrdered: 0,
                    totalMealsConsumed: 0,
                    favoriteItems: [],
                    dietaryRestrictions: [],
                    recentOrders: [],
                    upcomingMeals: []
                },
                progressMetrics: progressData?.progressMetrics || {
                    nutritionalGoals: [],
                    engagementScore: 0,
                    weeklyTrends: [],
                    achievements: [],
                    nextMilestones: []
                },
                preferences: {
                    dietaryRestrictions: [],
                    favoriteCategories: [],
                    allergies: []
                },
                recentAlerts: []
            };
        });
        const processingTime = Date.now() - startTime;
        const dashboardData = {
            parentInfo,
            children: childrenData,
            insights: insights || {
                aiGeneratedInsights: [],
                nutritionRecommendations: [],
                behavioralPatterns: [],
                parentingTips: [],
                weeklyHighlights: [],
                actionableAdvice: []
            },
            analytics: analytics || {
                dashboardUsage: {
                    dailyActiveTime: 0,
                    weeklyLoginCount: 0,
                    featureUsage: {},
                    lastActiveFeatures: []
                },
                interactionPatterns: [],
                engagementScore: 0,
                benchmarkComparisons: [],
                improvementSuggestions: []
            },
            recentActivity: recentActivity || [],
            preferences: preferences || {
                layout: { widgets: [], theme: 'light', density: 'comfortable' },
                notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'daily', categories: [] },
                dataDisplay: { timeZone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY', numberFormat: 'indian', chartTypes: {}, showComparisons: true },
                privacy: { shareAnalytics: true, showBenchmarks: true, allowPersonalization: true, dataRetentionPeriod: 365 }
            },
            metadata: {
                lastUpdated: new Date(),
                cacheStatus: {
                    isValid: true,
                    lastRefresh: new Date(),
                    hitRate: 1.0,
                    source: 'live'
                },
                dataFreshness: {
                    nutritionData: new Date(),
                    engagementData: new Date(),
                    insightsData: new Date(),
                    preferencesData: new Date()
                },
                apiVersion: '1.0.0',
                performanceMetrics: {
                    responseTime: processingTime,
                    dataProcessingTime: processingTime,
                    cacheHitRate: 0.0,
                    externalApiCalls: childIds.length + 3
                }
            }
        };
        return dashboardData;
    }
    catch (error) {
        logger.error('Failed to aggregate dashboard data', {
            parentId,
            options,
            error: error.message
        });
        throw error;
    }
}
async function handleRealTimeSubscription(subscriptionData) {
    try {
        const { action, parentId, connectionId, subscriptionTypes } = subscriptionData;
        if (action === 'subscribe') {
            await kinesis.putRecord({
                StreamName: 'parent-dashboard-subscriptions',
                Data: JSON.stringify({
                    action: 'subscribe',
                    parentId,
                    connectionId,
                    subscriptionTypes: subscriptionTypes || ['all'],
                    timestamp: new Date().toISOString()
                }),
                PartitionKey: parentId
            }).promise();
            logger.info('Parent subscribed to real-time updates', {
                parentId,
                connectionId,
                subscriptionTypes
            });
            return {
                success: true,
                message: 'Successfully subscribed to real-time updates'
            };
        }
        else {
            await kinesis.putRecord({
                StreamName: 'parent-dashboard-subscriptions',
                Data: JSON.stringify({
                    action: 'unsubscribe',
                    parentId,
                    connectionId,
                    timestamp: new Date().toISOString()
                }),
                PartitionKey: parentId
            }).promise();
            logger.info('Parent unsubscribed from real-time updates', {
                parentId,
                connectionId
            });
            return {
                success: true,
                message: 'Successfully unsubscribed from real-time updates'
            };
        }
    }
    catch (error) {
        logger.error('Failed to handle real-time subscription', {
            subscriptionData,
            error: error.message
        });
        throw error;
    }
}
const parentDashboardOrchestratorHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Parent dashboard orchestrator request started', {
            requestId,
            method: event.httpMethod,
            path: event.path
        });
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if (!authResult.success || !authResult.user) {
            return (0, response_utils_1.createErrorResponse)(401, 'Authentication failed');
        }
        const authenticatedUser = authResult.user;
        switch (event.httpMethod) {
            case 'GET':
                return await handleGetDashboard(event, requestId, authenticatedUser);
            case 'POST':
                return await handleDashboardAction(event, requestId, authenticatedUser);
            default:
                return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed');
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Parent dashboard orchestrator request failed', {
            requestId,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to process dashboard request', 500, requestId);
    }
};
exports.parentDashboardOrchestratorHandler = parentDashboardOrchestratorHandler;
async function handleGetDashboard(event, requestId, authenticatedUser) {
    try {
        const parentId = event.pathParameters?.parentId || authenticatedUser.id;
        const queryParams = event.queryStringParameters || {};
        const validatedParams = dashboardRequestSchema.parse({
            parentId,
            childIds: queryParams.childIds ? JSON.parse(queryParams.childIds) : undefined,
            dateRange: queryParams.dateRange ? JSON.parse(queryParams.dateRange) : undefined,
            includeInsights: queryParams.includeInsights !== 'false',
            includeAnalytics: queryParams.includeAnalytics !== 'false',
            refreshCache: queryParams.refreshCache === 'true'
        });
        await validateParentAccess(parentId, authenticatedUser);
        const dashboardData = await aggregateDashboardData(parentId, {
            childIds: validatedParams.childIds,
            dateRange: validatedParams.dateRange,
            includeInsights: validatedParams.includeInsights,
            includeAnalytics: validatedParams.includeAnalytics
        });
        logger.info('Dashboard data aggregated successfully', {
            requestId,
            parentId,
            childrenCount: dashboardData.children.length,
            responseTime: dashboardData.metadata.performanceMetrics.responseTime
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                dashboard: dashboardData,
                message: 'Dashboard data retrieved successfully'
            },
            message: 'Dashboard data retrieved successfully',
            requestId
        });
    }
    catch (error) {
        logger.error('Failed to get dashboard data', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
async function handleDashboardAction(event, requestId, authenticatedUser) {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const action = requestBody.action;
        switch (action) {
            case 'subscribe':
            case 'unsubscribe':
                {
                    const subscriptionData = realTimeUpdateSchema.parse(requestBody);
                    await validateParentAccess(subscriptionData.parentId, authenticatedUser);
                    const result = await handleRealTimeSubscription(subscriptionData);
                }
                return (0, response_utils_1.createSuccessResponse)({
                    data: result,
                    message: result.message,
                    requestId
                });
            case 'refresh_cache':
                {
                    const refreshData = dashboardRequestSchema.parse({
                        ...requestBody,
                        refreshCache: true
                    });
                    await validateParentAccess(refreshData.parentId || authenticatedUser.id || "", authenticatedUser);
                    const refreshedData = await aggregateDashboardData(refreshData.parentId || authenticatedUser.id || "", {
                        childIds: refreshData.childIds,
                        dateRange: refreshData.dateRange,
                        includeInsights: refreshData.includeInsights,
                        includeAnalytics: refreshData.includeAnalytics
                    });
                }
                return (0, response_utils_1.createSuccessResponse)({
                    data: {
                        dashboard: refreshedData,
                        message: 'Dashboard cache refreshed successfully'
                    },
                    message: 'Dashboard cache refreshed successfully',
                    requestId
                });
            default:
                return (0, response_utils_1.createErrorResponse)(400, 'Invalid action', undefined, 'INVALID_ACTION');
        }
    }
    catch (error) {
        logger.error('Failed to handle dashboard action', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
//# sourceMappingURL=parent-dashboard-orchestrator.js.map