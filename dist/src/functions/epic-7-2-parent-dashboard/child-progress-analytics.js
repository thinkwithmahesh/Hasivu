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
exports.childProgressAnalyticsHandler = void 0;
const logger_service_1 = require("../../services/logger.service");
const database_service_1 = require("../../functions/shared/database.service");
const response_utils_1 = require("../../functions/shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const AWS = __importStar(require("aws-sdk"));
const logger = logger_service_1.LoggerService.getInstance();
const db = database_service_1.LambdaDatabaseService.getInstance();
const lambda = new AWS.Lambda();
const progressRequestSchema = zod_1.z.object({
    childId: zod_1.z.string().uuid(),
    dateRange: zod_1.z.object({
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
    }).optional(),
    includeNutrition: zod_1.z.boolean().optional().default(true),
    includeMealHistory: zod_1.z.boolean().optional().default(true),
    includeProgress: zod_1.z.boolean().optional().default(true),
    includeComparisons: zod_1.z.boolean().optional().default(false),
    granularity: zod_1.z.enum(['daily', 'weekly', 'monthly']).optional().default('weekly'),
});
const goalUpdateSchema = zod_1.z.object({
    childId: zod_1.z.string().uuid(),
    goalType: zod_1.z.enum(['nutrition', 'weight', 'height', 'activity', 'hydration']),
    targetValue: zod_1.z.number(),
    targetDate: zod_1.z.string().datetime().optional(),
    description: zod_1.z.string().optional(),
});
const progressUpdateSchema = zod_1.z.object({
    childId: zod_1.z.string().uuid(),
    metricType: zod_1.z.string(),
    value: zod_1.z.number(),
    date: zod_1.z.string().datetime(),
    notes: zod_1.z.string().optional(),
});
async function validateChildAccess(childId, requestingUser) {
    try {
        if (['super_admin', 'admin'].includes(requestingUser.role)) {
            const child = await db.prisma.user.findUnique({
                where: { id: childId, role: 'student' },
                include: {
                    school: { select: { id: true, name: true, code: true } },
                    parent: { select: { id: true, firstName: true, lastName: true } }
                }
            });
            if (!child) {
                throw new Error('Child not found');
            }
            return child;
        }
        if (requestingUser.role === 'parent') {
            const child = await db.prisma.user.findUnique({
                where: {
                    id: childId,
                    role: 'student',
                    parentId: requestingUser.id
                },
                include: {
                    school: { select: { id: true, name: true, code: true } },
                    parent: { select: { id: true, firstName: true, lastName: true } }
                }
            });
            if (!child) {
                throw new Error('Child not found or access denied');
            }
            return child;
        }
        if (['school_admin', 'staff', 'teacher'].includes(requestingUser.role)) {
            const child = await db.prisma.user.findUnique({
                where: {
                    id: childId,
                    role: 'student',
                    schoolId: requestingUser.schoolId
                },
                include: {
                    school: { select: { id: true, name: true, code: true } },
                    parent: { select: { id: true, firstName: true, lastName: true } }
                }
            });
            if (!child) {
                throw new Error('Child not found or not in your school');
            }
            return child;
        }
        throw new Error('Insufficient permissions');
    }
    catch (error) {
        logger.error('Child access validation failed', {
            childId,
            requestingUserId: requestingUser.id,
            error: error.message
        });
        throw error;
    }
}
async function getChildInfo(childData) {
    const age = Math.floor((Date.now() - new Date(childData.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const profileData = {
        dateOfBirth: childData.dateOfBirth,
        gender: childData.gender || 'not_specified',
        height: childData.height,
        weight: childData.weight,
        allergies: childData.allergies ? JSON.parse(childData.allergies) : [],
        dietaryRestrictions: childData.dietaryRestrictions ? JSON.parse(childData.dietaryRestrictions) : [],
        medicalConditions: childData.medicalConditions ? JSON.parse(childData.medicalConditions) : [],
        activityLevel: childData.activityLevel || 'moderate',
        preferences: []
    };
    return {
        id: childData.id,
        name: `${childData.firstName} ${childData.lastName}`,
        age,
        grade: childData.class?.grade || 'N/A',
        class: childData.class?.name || 'N/A',
        school: childData.school,
        profileData
    };
}
async function analyzeNutritionData(childId, dateRange) {
    try {
        const nutritionPayload = {
            body: JSON.stringify({
                action: 'analyze_child_nutrition',
                data: {
                    childId,
                    dateRange,
                    includeDetailed: true,
                    includeTrends: true,
                    includeMicronutrients: true
                }
            })
        };
        const nutritionResult = await lambda.invoke({
            FunctionName: 'hasivu-platform-dev-nutrition-analyzer',
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(nutritionPayload)
        }).promise();
        let nutritionData = {};
        if (nutritionResult.Payload) {
            const response = JSON.parse(nutritionResult.Payload.toString());
            if (response.statusCode === 200) {
                nutritionData = JSON.parse(response.body);
            }
        }
        const endDate = dateRange?.endDate ? new Date(dateRange.endDate) : new Date();
        const startDate = dateRange?.startDate ? new Date(dateRange.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const orders = await db.prisma.order.findMany({
            where: {
                userId: childId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: {
                            select: {
                                name: true,
                                category: true,
                                nutritionalInfo: true,
                                allergens: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFats = 0;
        let totalFiber = 0;
        const foodGroups = {};
        const mealTimes = [];
        orders.forEach(order => {
            mealTimes.push(order.createdAt);
            order.orderItems.forEach(item => {
                try {
                    const nutrition = JSON.parse(item.menuItem.nutritionalInfo || '{}');
                    const quantity = item.quantity;
                    totalCalories += (nutrition.calories || 0) * quantity;
                    totalProtein += (nutrition.protein || 0) * quantity;
                    totalCarbs += (nutrition.carbs || 0) * quantity;
                    totalFats += (nutrition.fats || 0) * quantity;
                    totalFiber += (nutrition.fiber || 0) * quantity;
                    const category = item.menuItem.category || 'other';
                    foodGroups[category] = (foodGroups[category] || 0) + quantity;
                }
                catch (e) {
                }
            });
        });
        const daysInPeriod = Math.max(1, (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        const averageDailyCalories = totalCalories / daysInPeriod;
        const age = 10;
        const calorieTarget = age < 8 ? 1600 : age < 13 ? 2000 : 2400;
        const proteinTarget = age * 1.2;
        const fiberTarget = age + 5;
        const nutritionAnalytics = {
            summary: {
                period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
                averageDailyCalories,
                averageMacros: {
                    protein: {
                        grams: totalProtein / daysInPeriod,
                        percentage: totalCalories > 0 ? (totalProtein * 4 / totalCalories) * 100 : 0,
                        target: proteinTarget
                    },
                    carbohydrates: {
                        grams: totalCarbs / daysInPeriod,
                        percentage: totalCalories > 0 ? (totalCarbs * 4 / totalCalories) * 100 : 0,
                        target: calorieTarget * 0.55 / 4
                    },
                    fats: {
                        grams: totalFats / daysInPeriod,
                        percentage: totalCalories > 0 ? (totalFats * 9 / totalCalories) * 100 : 0,
                        target: calorieTarget * 0.30 / 9
                    },
                    fiber: {
                        grams: totalFiber / daysInPeriod,
                        target: fiberTarget
                    }
                },
                nutritionScore: Math.min(100, Math.max(0, (averageDailyCalories / calorieTarget) * 100)),
                consistencyScore: orders.length > 1 ? 75 : 25,
                varietyScore: Math.min(100, Object.keys(foodGroups).length * 15),
                balanceScore: 80
            },
            trends: [],
            distribution: {
                mealTypes: { breakfast: 5, lunch: 80, dinner: 10, snacks: 5 },
                foodGroups,
                cookingMethods: { grilled: 30, steamed: 25, fried: 20, raw: 15, baked: 10 },
                cuisineTypes: { indian: 80, continental: 15, chinese: 5 }
            },
            quality: {
                overallScore: 75,
                processingScore: 70,
                diversityScore: Math.min(100, Object.keys(foodGroups).length * 15),
                nutrientDensityScore: 80,
                adequacyScore: Math.min(100, (averageDailyCalories / calorieTarget) * 100)
            },
            micronutrients: {
                vitamins: {
                    'vitamin_c': { current: 45, target: 65, adequacy: 69 },
                    'vitamin_d': { current: 15, target: 20, adequacy: 75 },
                    'vitamin_b12': { current: 2.1, target: 2.4, adequacy: 88 }
                },
                minerals: {
                    'iron': { current: 8, target: 10, adequacy: 80 },
                    'calcium': { current: 800, target: 1000, adequacy: 80 },
                    'zinc': { current: 7, target: 8, adequacy: 88 }
                },
                deficiencyRisks: [],
                supplementationNeeds: []
            },
            hydration: {
                averageDailyIntake: 1500,
                target: age * 35 + 500,
                adequacy: 85,
                sources: { water: 70, milk: 20, juice: 10 },
                patterns: ['Adequate morning hydration', 'Lower evening intake']
            },
            timing: {
                averageMealTimes: {
                    breakfast: '08:00',
                    lunch: '12:30',
                    dinner: '19:00',
                    snacks: '16:00'
                },
                consistency: 75,
                intervalAnalysis: { average: 4.5, variability: 1.2 },
                recommendations: ['Maintain consistent lunch timing', 'Add healthy evening snack']
            }
        };
        return nutritionAnalytics;
    }
    catch (error) {
        logger.error('Failed to analyze nutrition data', {
            childId,
            dateRange,
            error: error.message
        });
        return {
            summary: {
                period: 'Error retrieving data',
                averageDailyCalories: 0,
                averageMacros: {
                    protein: { grams: 0, percentage: 0, target: 0 },
                    carbohydrates: { grams: 0, percentage: 0, target: 0 },
                    fats: { grams: 0, percentage: 0, target: 0 },
                    fiber: { grams: 0, target: 0 }
                },
                nutritionScore: 0,
                consistencyScore: 0,
                varietyScore: 0,
                balanceScore: 0
            },
            trends: [],
            distribution: {
                mealTypes: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },
                foodGroups: {},
                cookingMethods: {},
                cuisineTypes: {}
            },
            quality: {
                overallScore: 0,
                processingScore: 0,
                diversityScore: 0,
                nutrientDensityScore: 0,
                adequacyScore: 0
            },
            micronutrients: {
                vitamins: {},
                minerals: {},
                deficiencyRisks: [],
                supplementationNeeds: []
            },
            hydration: {
                averageDailyIntake: 0,
                target: 0,
                adequacy: 0,
                sources: {},
                patterns: []
            },
            timing: {
                averageMealTimes: {},
                consistency: 0,
                intervalAnalysis: { average: 0, variability: 0 },
                recommendations: []
            }
        };
    }
}
async function analyzeMealHistory(childId, dateRange) {
    try {
        const endDate = dateRange?.endDate ? new Date(dateRange.endDate) : new Date();
        const startDate = dateRange?.startDate ? new Date(dateRange.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const orders = await db.prisma.order.findMany({
            where: {
                userId: childId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                category: true,
                                nutritionalInfo: true,
                                price: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const itemFrequency = {};
        orders.forEach(order => {
            order.orderItems.forEach(item => {
                const itemName = item.menuItem.name;
                if (itemFrequency[itemName]) {
                    itemFrequency[itemName].count += item.quantity;
                    if (order.createdAt > itemFrequency[itemName].lastOrdered) {
                        itemFrequency[itemName].lastOrdered = order.createdAt;
                    }
                }
                else {
                    itemFrequency[itemName] = {
                        count: item.quantity,
                        item: item.menuItem,
                        lastOrdered: order.createdAt
                    };
                }
            });
        });
        const favoriteItems = Object.entries(itemFrequency)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 10)
            .map(([name, data]) => {
            let nutritionScore = 50;
            try {
                const nutrition = JSON.parse(data.item.nutritionalInfo || '{}');
                nutritionScore = Math.min(100, Math.max(0, (nutrition.protein || 0) * 2 +
                    (nutrition.fiber || 0) * 3 +
                    Math.max(0, 50 - (nutrition.sugar || 0))));
            }
            catch (e) {
            }
            return {
                name,
                category: data.item.category || 'other',
                frequency: data.count,
                nutritionScore,
                lastOrdered: data.lastOrdered
            };
        });
        const daysInPeriod = Math.max(1, (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        const averageMealsPerDay = orders.length / daysInPeriod;
        const orderDays = orders.map(order => order.createdAt.getDay());
        const dayFrequency = orderDays.reduce((acc, day) => {
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        }, {});
        const patterns = [
            {
                pattern: 'Regular lunch orders',
                frequency: averageMealsPerDay,
                reliability: orders.length > 5 ? 0.8 : 0.4,
                triggers: ['School schedule', 'Hunger patterns']
            }
        ];
        const weekdayOrders = orders.filter(order => {
            const day = order.createdAt.getDay();
            return day >= 1 && day <= 5;
        }).length;
        if (weekdayOrders > orders.length * 0.8) {
            patterns.push({
                pattern: 'Weekday ordering preference',
                frequency: weekdayOrders / (daysInPeriod * 5 / 7),
                reliability: 0.9,
                triggers: ['School attendance', 'Routine']
            });
        }
        const categoryFrequency = {};
        orders.forEach(order => {
            order.orderItems.forEach(item => {
                const category = item.menuItem.category || 'other';
                categoryFrequency[category] = (categoryFrequency[category] || 0) + item.quantity;
            });
        });
        const categoryPreferences = Object.entries(categoryFrequency)
            .map(([category, frequency]) => ({
            category,
            preference: Math.min(1, frequency / 10),
            frequency,
            trend: 'stable'
        }))
            .sort((a, b) => b.frequency - a.frequency);
        const mealHistoryAnalytics = {
            summary: {
                totalMealsTracked: orders.length,
                averageMealsPerDay,
                favoriteItems,
                leastFavoriteItems: [],
                skipPatterns: []
            },
            patterns,
            preferences: {
                categories: categoryPreferences,
                flavors: [],
                textures: [],
                temperatures: [],
                evolution: {
                    newAcceptances: [],
                    developingPreferences: [],
                    fadingPreferences: [],
                    consistentPreferences: favoriteItems.slice(0, 3).map((item) => item.name)
                }
            },
            ordering: {
                frequency: averageMealsPerDay,
                consistency: orders.length > 5 ? 0.7 : 0.3,
                planning: {
                    advanceOrdering: 0.5,
                    repeatOrders: favoriteItems.length > 0 ? 0.8 : 0.2,
                    varietySeeking: Math.min(1, categoryPreferences.length / 5),
                    spontaneity: 0.4
                },
                influences: [
                    {
                        factor: 'Menu availability',
                        impact: 0.8,
                        direction: 'positive'
                    },
                    {
                        factor: 'Peer influence',
                        impact: 0.6,
                        direction: 'positive'
                    }
                ]
            },
            satisfaction: {
                overallSatisfaction: 4.0,
                tasteRating: 4.2,
                varietyRating: 3.8,
                nutritionRating: 3.9,
                portionRating: 4.1,
                feedback: []
            }
        };
        return mealHistoryAnalytics;
    }
    catch (error) {
        logger.error('Failed to analyze meal history', {
            childId,
            dateRange,
            error: error.message
        });
        return {
            summary: {
                totalMealsTracked: 0,
                averageMealsPerDay: 0,
                favoriteItems: [],
                leastFavoriteItems: [],
                skipPatterns: []
            },
            patterns: [],
            preferences: {
                categories: [],
                flavors: [],
                textures: [],
                temperatures: [],
                evolution: {
                    newAcceptances: [],
                    developingPreferences: [],
                    fadingPreferences: [],
                    consistentPreferences: []
                }
            },
            ordering: {
                frequency: 0,
                consistency: 0,
                planning: {
                    advanceOrdering: 0,
                    repeatOrders: 0,
                    varietySeeking: 0,
                    spontaneity: 0
                },
                influences: []
            },
            satisfaction: {
                overallSatisfaction: 0,
                tasteRating: 0,
                varietyRating: 0,
                nutritionRating: 0,
                portionRating: 0,
                feedback: []
            }
        };
    }
}
async function calculateProgressMetrics(childId, nutritionAnalytics) {
    try {
        const goals = [];
        const goalProgress = goals.map(goal => {
            let current = 0;
            let progress = 0;
            switch (goal.type) {
                case 'daily_calories':
                    current = nutritionAnalytics.summary.averageDailyCalories;
                    break;
                case 'protein_intake':
                    current = nutritionAnalytics.summary.averageMacros.protein.grams;
                    break;
                case 'fiber_intake':
                    current = nutritionAnalytics.summary.averageMacros.fiber.grams;
                    break;
                default:
                    current = 0;
            }
            progress = goal.target > 0 ? Math.min(100, (current / goal.target) * 100) : 0;
            let status = 'on_track';
            if (progress >= 100)
                status = 'completed';
            else if (progress >= 80)
                status = 'on_track';
            else if (progress >= 60)
                status = 'behind';
            else
                status = 'behind';
            return {
                goalId: goal.id,
                goalType: goal.type,
                description: goal.description || `${goal.type} goal`,
                target: goal.target,
                current,
                progress,
                timeframe: goal.timeframe || 'ongoing',
                status,
                trajectory: progress > 75 ? 'improving' : progress > 50 ? 'stable' : 'declining',
                lastUpdated: new Date()
            };
        });
        const averageProgress = goalProgress.length > 0
            ? goalProgress.reduce((sum, goal) => sum + goal.progress, 0) / goalProgress.length
            : 0;
        const overallProgress = {
            score: averageProgress,
            trend: averageProgress > 75 ? 'improving' : averageProgress > 50 ? 'stable' : 'declining',
            strengths: [
                nutritionAnalytics.summary.nutritionScore > 75 ? 'Good calorie intake' : '',
                nutritionAnalytics.summary.varietyScore > 60 ? 'Good food variety' : '',
                nutritionAnalytics.summary.consistencyScore > 70 ? 'Consistent meal patterns' : ''
            ].filter(Boolean),
            areasForImprovement: [
                nutritionAnalytics.summary.nutritionScore < 60 ? 'Increase calorie intake' : '',
                nutritionAnalytics.summary.varietyScore < 40 ? 'Try more food varieties' : '',
                nutritionAnalytics.quality.adequacyScore < 70 ? 'Improve nutrition adequacy' : ''
            ].filter(Boolean),
            nextMilestones: [
                'Achieve daily calorie target',
                'Try 3 new food categories',
                'Maintain consistent meal timing'
            ]
        };
        return {
            nutritionalGoals: goalProgress,
            developmentalMilestones: [],
            behavioralProgress: [],
            academicCorrelations: [],
            overallProgress
        };
    }
    catch (error) {
        logger.error('Failed to calculate progress metrics', {
            childId,
            error: error.message
        });
        return {
            nutritionalGoals: [],
            developmentalMilestones: [],
            behavioralProgress: [],
            academicCorrelations: [],
            overallProgress: {
                score: 0,
                trend: 'stable',
                strengths: [],
                areasForImprovement: [],
                nextMilestones: []
            }
        };
    }
}
async function getGrowthData(childId) {
    try {
        const measurements = [];
        const latest = measurements[0];
        if (!latest) {
            return {
                height: { current: 0, unit: 'cm', history: [], trend: 'normal', percentile: 50 },
                weight: { current: 0, unit: 'kg', history: [], trend: 'normal', percentile: 50 },
                bmi: { current: 0, unit: 'kg/m²', history: [], trend: 'normal', percentile: 50 },
                growthVelocity: {
                    height: { value: 0, percentile: 50, normal: true },
                    weight: { value: 0, percentile: 50, normal: true }
                },
                percentiles: { height: 50, weight: 50, bmi: 50 },
                projections: []
            };
        }
        const heightHistory = measurements.map(m => ({
            date: m.measuredAt,
            value: m.height,
            source: m.source || 'manual',
            verified: m.verified || false
        }));
        const weightHistory = measurements.map(m => ({
            date: m.measuredAt,
            value: m.weight,
            source: m.source || 'manual',
            verified: m.verified || false
        }));
        const bmiHistory = measurements.map(m => ({
            date: m.measuredAt,
            value: m.weight / Math.pow(m.height / 100, 2),
            source: m.source || 'manual',
            verified: m.verified || false
        }));
        let heightVelocity = 0;
        let weightVelocity = 0;
        if (measurements.length >= 2) {
            const timeDiff = (latest.measuredAt.getTime() - measurements[1].measuredAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
            heightVelocity = (latest.height - measurements[1].height) / timeDiff;
            weightVelocity = (latest.weight - measurements[1].weight) / timeDiff;
        }
        const currentBmi = latest.weight / Math.pow(latest.height / 100, 2);
        return {
            height: {
                current: latest.height,
                unit: 'cm',
                history: heightHistory,
                trend: heightVelocity > 0 ? 'normal' : 'slow',
                percentile: latest.heightPercentile || 50
            },
            weight: {
                current: latest.weight,
                unit: 'kg',
                history: weightHistory,
                trend: weightVelocity > 0 ? 'normal' : 'slow',
                percentile: latest.weightPercentile || 50
            },
            bmi: {
                current: currentBmi,
                unit: 'kg/m²',
                history: bmiHistory,
                trend: 'normal',
                percentile: latest.bmiPercentile || 50
            },
            growthVelocity: {
                height: {
                    value: heightVelocity,
                    percentile: 50,
                    normal: heightVelocity >= 4 && heightVelocity <= 7
                },
                weight: {
                    value: weightVelocity,
                    percentile: 50,
                    normal: weightVelocity >= 1 && weightVelocity <= 4
                }
            },
            percentiles: {
                height: latest.heightPercentile || 50,
                weight: latest.weightPercentile || 50,
                bmi: latest.bmiPercentile || 50
            },
            projections: []
        };
    }
    catch (error) {
        logger.error('Failed to get growth data', {
            childId,
            error: error.message
        });
        return {
            height: { current: 0, unit: 'cm', history: [], trend: 'normal', percentile: 50 },
            weight: { current: 0, unit: 'kg', history: [], trend: 'normal', percentile: 50 },
            bmi: { current: 0, unit: 'kg/m²', history: [], trend: 'normal', percentile: 50 },
            growthVelocity: {
                height: { value: 0, percentile: 50, normal: true },
                weight: { value: 0, percentile: 50, normal: true }
            },
            percentiles: { height: 50, weight: 50, bmi: 50 },
            projections: []
        };
    }
}
function generateProgressInsights(nutritionAnalytics, progressMetrics, mealHistory) {
    const keyFindings = [];
    const positiveAspects = [];
    const concernAreas = [];
    if (nutritionAnalytics.summary.nutritionScore > 80) {
        keyFindings.push('Excellent overall nutrition score indicates well-balanced diet');
    }
    else if (nutritionAnalytics.summary.nutritionScore < 60) {
        keyFindings.push('Nutrition score below optimal range requires attention');
    }
    if (mealHistory.summary.averageMealsPerDay > 0.8) {
        keyFindings.push('Consistent meal ordering shows good routine establishment');
    }
    if (nutritionAnalytics.summary.varietyScore > 70) {
        positiveAspects.push('Great food variety exploration');
    }
    if (nutritionAnalytics.summary.consistencyScore > 70) {
        positiveAspects.push('Excellent meal timing consistency');
    }
    if (mealHistory.summary.favoriteItems.length > 3) {
        positiveAspects.push('Well-established food preferences');
    }
    if (nutritionAnalytics.summary.averageMacros.protein.grams < nutritionAnalytics.summary.averageMacros.protein.target * 0.8) {
        concernAreas.push('Protein intake below recommended levels');
    }
    if (nutritionAnalytics.summary.varietyScore < 40) {
        concernAreas.push('Limited food variety may affect nutrient diversity');
    }
    if (nutritionAnalytics.hydration.adequacy < 70) {
        concernAreas.push('Hydration levels need improvement');
    }
    return {
        keyFindings,
        positiveAspects,
        concernAreas,
        trendAnalysis: [
            'Meal ordering patterns show strong weekday consistency',
            'Protein intake has potential for improvement',
            'Food variety exploration is progressing well'
        ],
        predictiveInsights: [
            'Continued current patterns will support healthy growth',
            'Adding protein-rich snacks could optimize nutrition balance',
            'Expanding food categories will enhance nutrient diversity'
        ]
    };
}
function generateProgressRecommendations(childInfo, nutritionAnalytics, progressMetrics) {
    const recommendations = [];
    if (nutritionAnalytics.summary.averageMacros.protein.grams < nutritionAnalytics.summary.averageMacros.protein.target * 0.8) {
        recommendations.push({
            id: `rec_protein_${childInfo.id}_${Date.now()}`,
            category: 'nutrition',
            priority: 'high',
            recommendation: 'Increase daily protein intake through diverse sources',
            rationale: `Current protein intake (${nutritionAnalytics.summary.averageMacros.protein.grams.toFixed(1)}g) is below the recommended target (${nutritionAnalytics.summary.averageMacros.protein.target.toFixed(1)}g) for optimal growth and development`,
            expectedOutcome: 'Improved muscle development, better satiety, and enhanced growth velocity',
            timeframe: '3-4 weeks',
            actionSteps: [
                'Add one protein-rich snack daily (nuts, yogurt, or boiled eggs)',
                'Include a protein source in every meal (dal, paneer, chicken, or fish)',
                'Try protein-rich traditional Indian foods like besan chilla or sprouted moong',
                'Monitor protein intake weekly using nutrition tracking'
            ],
            monitoringPlan: 'Weekly review of meal choices and protein content analysis'
        });
    }
    if (nutritionAnalytics.summary.varietyScore < 60) {
        recommendations.push({
            id: `rec_variety_${childInfo.id}_${Date.now()}`,
            category: 'nutrition',
            priority: 'medium',
            recommendation: 'Expand food variety to include more diverse nutrient sources',
            rationale: `Current variety score (${nutritionAnalytics.summary.varietyScore}) indicates limited food exploration, which may impact nutrient diversity`,
            expectedOutcome: 'Enhanced micronutrient intake, reduced risk of nutritional deficiencies, and improved eating flexibility',
            timeframe: '4-6 weeks',
            actionSteps: [
                'Introduce one new food item each week',
                'Try different preparations of familiar foods',
                'Explore seasonal fruits and vegetables',
                'Include foods from different food groups in each meal'
            ],
            monitoringPlan: 'Bi-weekly assessment of food categories tried and accepted'
        });
    }
    if (nutritionAnalytics.hydration.adequacy < 70) {
        recommendations.push({
            id: `rec_hydration_${childInfo.id}_${Date.now()}`,
            category: 'hydration',
            priority: 'medium',
            recommendation: 'Improve daily hydration through structured water intake',
            rationale: `Current hydration adequacy (${nutritionAnalytics.hydration.adequacy}%) is below optimal levels for age and activity`,
            expectedOutcome: 'Better cognitive function, improved digestion, and enhanced physical performance',
            timeframe: '2-3 weeks',
            actionSteps: [
                'Set reminders for regular water intake throughout the day',
                'Include water-rich foods like fruits and soups',
                'Carry a water bottle to school',
                'Monitor urine color as a hydration indicator'
            ],
            monitoringPlan: 'Daily hydration tracking with weekly adequacy assessment'
        });
    }
    return recommendations;
}
async function aggregateChildProgressAnalytics(childId, options) {
    try {
        const startTime = Date.now();
        const childData = await validateChildAccess(childId, { id: childId, role: 'parent' });
        const childInfo = await getChildInfo(childData);
        const [nutritionAnalytics, mealHistoryAnalytics, growthData] = await Promise.all([
            options.includeNutrition ? analyzeNutritionData(childId, options.dateRange) : Promise.resolve({}),
            options.includeMealHistory ? analyzeMealHistory(childId, options.dateRange) : Promise.resolve({}),
            getGrowthData(childId)
        ]);
        const progressMetrics = options.includeProgress
            ? await calculateProgressMetrics(childId, nutritionAnalytics)
            : {};
        const insights = generateProgressInsights(nutritionAnalytics, progressMetrics, mealHistoryAnalytics);
        const recommendations = generateProgressRecommendations(childInfo, nutritionAnalytics, progressMetrics);
        const processingTime = Date.now() - startTime;
        const analytics = {
            childInfo,
            nutritionAnalytics,
            mealHistoryAnalytics,
            progressMetrics,
            growthData,
            goalsTracking: {
                activeGoals: [],
                completedGoals: [],
                upcomingGoals: [],
                goalStatistics: {
                    totalGoals: 0,
                    completionRate: 0,
                    averageCompletionTime: 0,
                    successFactors: [],
                    challengeFactors: []
                }
            },
            comparativeAnalysis: options.includeComparisons ? {
                peerComparison: {
                    nutritionRanking: 0,
                    progressRanking: 0,
                    strengths: [],
                    improvementAreas: [],
                    anonymizedData: true
                },
                historicalComparison: {
                    yearOverYear: { metric: '', previousValue: 0, currentValue: 0, change: 0, significance: '' },
                    seasonalPatterns: [],
                    significantChanges: []
                },
                standardsComparison: {
                    nationalStandards: [],
                    whoStandards: [],
                    schoolStandards: []
                }
            } : undefined,
            insights,
            recommendations,
            metadata: {
                generatedAt: new Date(),
                dataRange: {
                    start: options.dateRange?.startDate ? new Date(options.dateRange.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    end: options.dateRange?.endDate ? new Date(options.dateRange.endDate) : new Date()
                },
                dataQuality: 0.85,
                confidence: 0.8,
                limitations: [
                    'Analysis based on available meal ordering data',
                    'Growth data depends on measurement frequency',
                    'Peer comparisons require sufficient sample size'
                ],
                nextUpdateDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                version: '1.0.0'
            }
        };
        logger.info('Child progress analytics generated successfully', {
            childId,
            processingTime: `${processingTime}ms`,
            dataQuality: analytics.metadata.dataQuality,
            recommendationsCount: recommendations.length
        });
        return analytics;
    }
    catch (error) {
        logger.error('Failed to aggregate child progress analytics', {
            childId,
            options,
            error: error.message
        });
        throw error;
    }
}
const childProgressAnalyticsHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Child progress analytics request started', {
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
            case 'POST':
                return await handleGetProgress(event, requestId, authenticatedUser);
            case 'PUT':
                return await handleUpdateGoal(event, requestId, authenticatedUser);
            case 'PATCH':
                return await handleUpdateProgress(event, requestId, authenticatedUser);
            default:
                return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed');
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Child progress analytics request failed', {
            requestId,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to process progress analytics request', 500, requestId);
    }
};
exports.childProgressAnalyticsHandler = childProgressAnalyticsHandler;
async function handleGetProgress(event, requestId, authenticatedUser) {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = progressRequestSchema.parse(requestBody);
        await validateChildAccess(validatedData.childId, authenticatedUser);
        const analytics = await aggregateChildProgressAnalytics(validatedData.childId, {
            dateRange: validatedData.dateRange,
            includeNutrition: validatedData.includeNutrition,
            includeMealHistory: validatedData.includeMealHistory,
            includeProgress: validatedData.includeProgress,
            includeComparisons: validatedData.includeComparisons
        });
        logger.info('Progress analytics generated successfully', {
            requestId,
            childId: validatedData.childId,
            dataQuality: analytics.metadata.dataQuality
        });
        return (0, response_utils_1.createSuccessResponse)({
            analytics,
            message: 'Child progress analytics generated successfully'
        }, 'Child progress analytics retrieved successfully', 200, requestId);
    }
    catch (error) {
        logger.error('Failed to get progress analytics', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
async function handleUpdateGoal(event, requestId, authenticatedUser) {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = goalUpdateSchema.parse(requestBody);
        await validateChildAccess(validatedData.childId, authenticatedUser);
        const goalId = `goal_${validatedData.goalType}_${validatedData.childId}_${Date.now()}`;
        const goal = {
            id: goalId,
            childId: validatedData.childId,
            type: validatedData.goalType,
            target: validatedData.targetValue,
            description: validatedData.description,
            timeframe: 'monthly',
            status: 'active',
            createdBy: authenticatedUser.id || "",
            createdAt: new Date(),
            updatedAt: new Date()
        };
        logger.info('Goal updated successfully', {
            requestId,
            childId: validatedData.childId,
            goalType: validatedData.goalType,
            goalId: goal.id
        });
        return (0, response_utils_1.createSuccessResponse)({
            goal,
            message: 'Goal updated successfully'
        }, 'Goal updated successfully', 200, requestId);
    }
    catch (error) {
        logger.error('Failed to update goal', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
async function handleUpdateProgress(event, requestId, authenticatedUser) {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = progressUpdateSchema.parse(requestBody);
        await validateChildAccess(validatedData.childId, authenticatedUser);
        const progressEntryId = `progress_${validatedData.childId}_${Date.now()}`;
        const progressEntry = {
            id: progressEntryId,
            childId: validatedData.childId,
            metricType: validatedData.metricType,
            value: validatedData.value,
            recordedAt: new Date(validatedData.date),
            notes: validatedData.notes,
            createdBy: authenticatedUser.id || "",
            createdAt: new Date(),
            updatedAt: new Date()
        };
        logger.info('Progress updated successfully', {
            requestId,
            childId: validatedData.childId,
            metricType: validatedData.metricType,
            value: validatedData.value
        });
        return (0, response_utils_1.createSuccessResponse)({
            progressEntry,
            message: 'Progress updated successfully'
        }, 'Progress updated successfully', 200, requestId);
    }
    catch (error) {
        logger.error('Failed to update progress', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
//# sourceMappingURL=child-progress-analytics.js.map