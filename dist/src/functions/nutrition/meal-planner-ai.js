"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealPlannerHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const database_service_1 = require("../shared/database.service");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const zod_1 = require("zod");
const logger = logger_service_1.LoggerService.getInstance();
const database = database_service_1.LambdaDatabaseService.getInstance();
const bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const mealPlannerRequestSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    studentIds: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(50),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    mealTypes: zod_1.z.array(zod_1.z.enum(['breakfast', 'lunch', 'snack', 'dinner'])).min(1),
    nutritionalGoals: zod_1.z.object({
        caloriesPerDay: zod_1.z.number().positive().max(5000),
        proteinGrams: zod_1.z.number().positive().max(200),
        carbsGrams: zod_1.z.number().positive().max(500),
        fatGrams: zod_1.z.number().positive().max(200),
        fiberGrams: zod_1.z.number().positive().max(100),
        sodiumMg: zod_1.z.number().positive().max(5000),
        sugarGrams: zod_1.z.number().positive().max(100)
    }),
    dietaryRestrictions: zod_1.z.array(zod_1.z.string()).default([]),
    allergies: zod_1.z.array(zod_1.z.string()).default([]),
    preferences: zod_1.z.object({
        favoriteCategories: zod_1.z.array(zod_1.z.string()).default([]),
        dislikedItems: zod_1.z.array(zod_1.z.string()).default([]),
        spiceLevel: zod_1.z.enum(['none', 'mild', 'medium', 'spicy']).default('mild'),
        preferredCuisines: zod_1.z.array(zod_1.z.string()).default([])
    }).default(() => ({
        favoriteCategories: [],
        dislikedItems: [],
        spiceLevel: 'mild',
        preferredCuisines: []
    })),
    budget: zod_1.z.object({
        maxCostPerMeal: zod_1.z.number().positive().max(50),
        maxCostPerDay: zod_1.z.number().positive().max(200)
    }).optional(),
    optimizationPriorities: zod_1.z.array(zod_1.z.enum(['nutrition', 'cost', 'variety', 'preferences', 'health'])).default(['nutrition', 'health'])
});
const generateMealPlanSchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    mealType: zod_1.z.enum(['breakfast', 'lunch', 'snack', 'dinner']),
    availableItems: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        category: zod_1.z.string(),
        nutritionalInfo: zod_1.z.object({
            calories: zod_1.z.number(),
            protein: zod_1.z.number(),
            carbs: zod_1.z.number(),
            fat: zod_1.z.number(),
            fiber: zod_1.z.number(),
            sodium: zod_1.z.number(),
            sugar: zod_1.z.number()
        }),
        cost: zod_1.z.number(),
        allergens: zod_1.z.array(zod_1.z.string()),
        ingredients: zod_1.z.array(zod_1.z.string())
    })),
    requirements: zod_1.z.object({
        targetCalories: zod_1.z.number().positive(),
        dietaryRestrictions: zod_1.z.array(zod_1.z.string()),
        allergies: zod_1.z.array(zod_1.z.string()),
        preferences: zod_1.z.object({
            favoriteCategories: zod_1.z.array(zod_1.z.string()),
            dislikedItems: zod_1.z.array(zod_1.z.string())
        }),
        maxCost: zod_1.z.number().positive().optional()
    })
});
async function validateUserAccess(event, requestId) {
    const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
    const userId = event.headers['x-user-id'] || event.requestContext?.authorizer?.userId;
    const schoolId = event.headers['x-school-id'] || event.requestContext?.authorizer?.schoolId;
    const role = event.headers['x-user-role'] || event.requestContext?.authorizer?.role || 'student';
    if (!userId) {
        logger.warn('Meal planner access denied - no user ID', {
            requestId,
            clientIP,
            userAgent: userAgent.substring(0, 200),
            action: 'authentication_failed'
        });
        throw new Error('Authentication required');
    }
    if (!schoolId) {
        throw new Error('School context required');
    }
    const user = await database.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true, role: true }
    });
    if (!user || user.status !== 'ACTIVE') {
        throw new Error('Access denied');
    }
    if (!['admin', 'nutritionist'].includes(user.role)) {
        const studentSchool = await database.prisma.user.findFirst({
            where: { id: userId, schoolId },
            select: { id: true }
        });
        if (!studentSchool) {
            throw new Error('Access denied - invalid school context');
        }
    }
    return { userId, schoolId, role: user.role };
}
async function getAvailableMenuItems(schoolId, startDate, endDate, requestId) {
    try {
        const menuItems = await database.prisma.menuItem.findMany({
            where: {
                schoolId,
                available: true
            },
            select: {
                id: true,
                name: true,
                description: true,
                category: true,
                price: true,
                available: true,
                nutritionalInfo: true,
                allergens: true,
                tags: true,
                preparationTime: true,
                portionSize: true,
                imageUrl: true
            }
        });
        return menuItems;
    }
    catch (error) {
        logger.error('Failed to get available menu items', {
            requestId,
            schoolId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw new Error('Failed to retrieve menu items');
    }
}
async function getUserPreferences(userId, schoolId, requestId) {
    try {
        const recentMeals = await database.prisma.orderItem.findMany({
            where: {
                order: {
                    userId: userId,
                    createdAt: {
                        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            include: {
                menuItem: true,
                order: true
            },
            orderBy: { createdAt: 'desc' },
            take: 200
        });
        const categoryPreferences = {};
        const itemRatings = {};
        const dislikedItems = [];
        recentMeals.forEach(meal => {
            if (meal.menuItem) {
                const category = meal.menuItem.category;
                categoryPreferences[category] = (categoryPreferences[category] || 0) + 1;
                itemRatings[meal.menuItem.id] = (itemRatings[meal.menuItem.id] || 0) + 1;
            }
        });
        return {
            categoryPreferences,
            itemRatings,
            dislikedItems,
            recentSelections: recentMeals.slice(0, 20).map(m => ({
                itemId: m.menuItem?.id,
                itemName: m.menuItem?.name,
                selectedAt: m.createdAt
            }))
        };
    }
    catch (error) {
        logger.error('Failed to get user preferences', {
            requestId,
            userId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            categoryPreferences: {},
            itemRatings: {},
            dislikedItems: [],
            recentSelections: []
        };
    }
}
async function generateMealRecommendations(availableItems, requirements, preferences, mealType, date, requestId) {
    try {
        const prompt = `You are an expert pediatric nutritionist and AI meal planner. Generate optimal meal recommendations for school children.

Available Menu Items: ${JSON.stringify(availableItems.slice(0, 30), null, 2)}
User Preferences: ${JSON.stringify(preferences, null, 2)}
Nutritional Requirements: ${JSON.stringify(requirements, null, 2)}
Meal Type: ${mealType}
Date: ${date}

Please recommend the best 3-5 meal options that:
1. Meet the nutritional requirements for this meal type
2. Respect dietary restrictions and allergies: ${requirements.allergies?.join(', ') || 'none'}
3. Consider user preferences and historical choices
4. Optimize for nutritional balance and health score
5. Provide variety and appeal for children (age-appropriate portions and flavors)
6. Stay within budget constraints if specified

For each recommendation, provide:
- Item selection with detailed reasoning
- Nutritional contribution to daily goals
- Health score assessment (1-10 scale)
- Appeal factor for children (1-10 scale)
- Portion size recommendations
- Any modifications or additions suggested

IMPORTANT: Respond with a valid JSON array containing recommendation objects with these exact fields:
[
  {
    "itemId": "string",
    "itemName": "string", 
    "category": "string",
    "portionSize": number,
    "nutritionalContribution": {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "sodium": number,
      "sugar": number
    },
    "cost": number,
    "healthScore": number,
    "appealFactor": number,
    "reasoning": "string",
    "modifications": ["string"]
  }
]

Ensure the response is valid JSON only, no additional text.`;
        const command = new client_bedrock_runtime_1.InvokeModelCommand({
            modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 4000,
                temperature: 0.3,
                messages: [{
                        role: 'user',
                        content: prompt
                    }]
            }),
            contentType: 'application/json',
            accept: 'application/json'
        });
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        let recommendations;
        try {
            const aiResponse = responseBody.content[0].text;
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            const jsonText = jsonMatch ? jsonMatch[0] : aiResponse;
            recommendations = JSON.parse(jsonText);
        }
        catch (parseError) {
            logger.warn('Failed to parse AI response, using fallback', { requestId, parseError });
            recommendations = generateFallbackRecommendations(availableItems, requirements, mealType);
        }
        return recommendations.map(rec => ({
            ...rec,
            itemId: rec.itemId || 'unknown',
            itemName: rec.itemName || 'Unknown Item',
            category: rec.category || 'general',
            portionSize: Math.max(0.1, Math.min(3.0, rec.portionSize || 1.0)),
            healthScore: Math.max(1, Math.min(10, rec.healthScore || 5)),
            appealFactor: Math.max(1, Math.min(10, rec.appealFactor || 5)),
            reasoning: rec.reasoning || 'AI recommendation',
            modifications: rec.modifications || []
        }));
    }
    catch (error) {
        logger.error('Failed to generate AI meal recommendations', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return generateFallbackRecommendations(availableItems, requirements, mealType);
    }
}
function generateFallbackRecommendations(availableItems, requirements, mealType) {
    const mealTargets = {
        breakfast: { caloriesPct: 0.25, proteinPct: 0.3 },
        lunch: { caloriesPct: 0.35, proteinPct: 0.4 },
        snack: { caloriesPct: 0.15, proteinPct: 0.15 },
        dinner: { caloriesPct: 0.25, proteinPct: 0.15 }
    };
    const target = mealTargets[mealType] || mealTargets.lunch;
    const safeItems = availableItems.filter(item => {
        if (requirements.allergies?.length > 0) {
            const itemAllergens = item.allergens?.map((a) => a.allergen) || [];
            if (itemAllergens.some((allergen) => requirements.allergies.includes(allergen.toLowerCase()))) {
                return false;
            }
        }
        if (requirements.dietaryRestrictions?.length > 0) {
            if (requirements.dietaryRestrictions.includes('vegetarian') &&
                item.category?.toLowerCase().includes('meat')) {
                return false;
            }
        }
        return true;
    });
    const recommendations = safeItems
        .slice(0, 5)
        .map(item => ({
        itemId: item.id,
        itemName: item.name,
        category: item.category || 'general',
        portionSize: 1.0,
        nutritionalContribution: {
            calories: item.nutritionalInfo?.calories || 200,
            protein: item.nutritionalInfo?.protein || 8,
            carbs: item.nutritionalInfo?.carbs || 25,
            fat: item.nutritionalInfo?.fat || 7,
            fiber: item.nutritionalInfo?.fiber || 3,
            sodium: item.nutritionalInfo?.sodium || 300,
            sugar: item.nutritionalInfo?.sugar || 8
        },
        cost: item.cost || 3.50,
        healthScore: 6,
        appealFactor: 7,
        reasoning: `Fallback recommendation for ${mealType}. Meets basic nutritional needs and dietary restrictions.`,
        modifications: []
    }));
    return recommendations;
}
function calculateDayNutrition(dailyMeals) {
    const summary = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sodium: 0,
        sugar: 0
    };
    Object.values(dailyMeals).flat().forEach(item => {
        summary.calories += item.nutritionalContribution.calories * item.portionSize;
        summary.protein += item.nutritionalContribution.protein * item.portionSize;
        summary.carbs += item.nutritionalContribution.carbs * item.portionSize;
        summary.fat += item.nutritionalContribution.fat * item.portionSize;
        summary.fiber += item.nutritionalContribution.fiber * item.portionSize;
        summary.sodium += item.nutritionalContribution.sodium * item.portionSize;
        summary.sugar += item.nutritionalContribution.sugar * item.portionSize;
    });
    return summary;
}
function calculateHealthScore(nutrition, goals) {
    const scores = [];
    const calorieRatio = nutrition.calories / goals.calories;
    scores.push(calorieRatio >= 0.85 && calorieRatio <= 1.15 ? 10 : Math.max(0, 10 - Math.abs(1 - calorieRatio) * 20));
    const proteinRatio = nutrition.protein / goals.protein;
    scores.push(proteinRatio >= 0.9 ? 10 : proteinRatio * 10);
    const fiberRatio = nutrition.fiber / goals.fiber;
    scores.push(Math.min(10, fiberRatio * 10));
    const sodiumRatio = nutrition.sodium / goals.sodium;
    scores.push(sodiumRatio <= 1.0 ? 10 : Math.max(0, 10 - (sodiumRatio - 1) * 20));
    const sugarRatio = nutrition.sugar / goals.sugar;
    scores.push(sugarRatio <= 1.0 ? 10 : Math.max(0, 10 - (sugarRatio - 1) * 15));
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}
async function generateWeeklyMealPlan(data, userId, schoolId, requestId) {
    try {
        const availableItems = await getAvailableMenuItems(schoolId, data.startDate, data.endDate, requestId);
        if (availableItems.length === 0) {
            throw new Error(`No menu items available for date range: ${data.startDate} to ${data.endDate}`);
        }
        const historicalPreferences = await getUserPreferences(userId, schoolId, requestId);
        const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const dailyPlans = [];
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            const dayAvailableItems = availableItems.filter(item => item.availability.some((avail) => new Date(avail.availableDate).toISOString().split('T')[0] === dateStr));
            if (dayAvailableItems.length === 0) {
                logger.warn(`No items available for ${dateStr}`, { requestId, schoolId });
                continue;
            }
            const dailyMeals = {};
            for (const mealType of data.mealTypes) {
                const mealCalories = data.nutritionalGoals.caloriesPerDay *
                    (mealType === 'breakfast' ? 0.25 : mealType === 'lunch' ? 0.35 : mealType === 'dinner' ? 0.25 : 0.15);
                const requirements = {
                    targetCalories: mealCalories,
                    dietaryRestrictions: data.dietaryRestrictions,
                    allergies: data.allergies,
                    preferences: {
                        ...data.preferences,
                        ...historicalPreferences
                    },
                    maxCost: data.budget?.maxCostPerMeal
                };
                try {
                    const recommendations = await generateMealRecommendations(dayAvailableItems, requirements, historicalPreferences, mealType, dateStr, requestId);
                    dailyMeals[mealType] = recommendations.slice(0, 2);
                }
                catch (error) {
                    logger.error(`Failed to generate meal for ${dateStr} ${mealType}`, {
                        requestId,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    continue;
                }
            }
            const dailyNutrition = calculateDayNutrition(dailyMeals);
            const goalsForComparison = {
                calories: data.nutritionalGoals.caloriesPerDay,
                protein: data.nutritionalGoals.proteinGrams,
                carbs: data.nutritionalGoals.carbsGrams,
                fat: data.nutritionalGoals.fatGrams,
                fiber: data.nutritionalGoals.fiberGrams,
                sodium: data.nutritionalGoals.sodiumMg,
                sugar: data.nutritionalGoals.sugarGrams
            };
            const dailyHealthScore = calculateHealthScore(dailyNutrition, goalsForComparison);
            const estimatedCost = Object.values(dailyMeals).flat().reduce((sum, item) => sum + (item.cost * item.portionSize), 0);
            const varietyScore = Object.keys(dailyMeals).length * 2.5;
            dailyPlans.push({
                date: dateStr,
                meals: dailyMeals,
                dailyNutrition,
                dailyHealthScore,
                estimatedCost,
                varietyScore
            });
        }
        if (dailyPlans.length === 0) {
            throw new Error('Failed to generate any daily meal plans');
        }
        const totalCost = dailyPlans.reduce((sum, day) => sum + day.estimatedCost, 0);
        const avgHealthScore = Math.round(dailyPlans.reduce((sum, day) => sum + day.dailyHealthScore, 0) / dailyPlans.length);
        const avgVarietyScore = Math.round(dailyPlans.reduce((sum, day) => sum + day.varietyScore, 0) / dailyPlans.length);
        const totalNutrition = dailyPlans.reduce((total, day) => ({
            calories: total.calories + day.dailyNutrition.calories,
            protein: total.protein + day.dailyNutrition.protein,
            carbs: total.carbs + day.dailyNutrition.carbs,
            fat: total.fat + day.dailyNutrition.fat,
            fiber: total.fiber + day.dailyNutrition.fiber,
            sodium: total.sodium + day.dailyNutrition.sodium,
            sugar: total.sugar + day.dailyNutrition.sugar
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0 });
        const avgNutrition = Object.keys(totalNutrition).reduce((avg, key) => {
            avg[key] = totalNutrition[key] / dailyPlans.length;
            return avg;
        }, {});
        const goalAchievement = {
            calories: Math.round((avgNutrition.calories / data.nutritionalGoals.caloriesPerDay) * 100),
            protein: Math.round((avgNutrition.protein / data.nutritionalGoals.proteinGrams) * 100),
            carbs: Math.round((avgNutrition.carbs / data.nutritionalGoals.carbsGrams) * 100),
            fat: Math.round((avgNutrition.fat / data.nutritionalGoals.fatGrams) * 100),
            fiber: Math.round((avgNutrition.fiber / data.nutritionalGoals.fiberGrams) * 100),
            sodium: Math.round((avgNutrition.sodium / data.nutritionalGoals.sodiumMg) * 100),
            sugar: Math.round((avgNutrition.sugar / data.nutritionalGoals.sugarGrams) * 100)
        };
        const aiInsights = {
            strengths: [
                avgHealthScore >= 8 ? 'Excellent nutritional balance achieved' : 'Good nutritional foundation',
                avgVarietyScore >= 8 ? 'Great meal variety for engaging dining' : 'Adequate meal variety',
                goalAchievement.protein >= 90 ? 'Strong protein intake for growth' : 'Moderate protein levels'
            ],
            improvementAreas: [
                goalAchievement.fiber < 80 ? 'Increase fiber-rich foods for digestive health' : '',
                goalAchievement.sodium > 110 ? 'Consider lower-sodium alternatives' : '',
                avgHealthScore < 7 ? 'Focus on more nutrient-dense options' : ''
            ].filter(Boolean),
            nutritionalGaps: [
                goalAchievement.fiber < 80 ? 'fiber' : '',
                goalAchievement.protein < 80 ? 'protein' : '',
                avgNutrition.calories < data.nutritionalGoals.caloriesPerDay * 0.85 ? 'calories' : ''
            ].filter(Boolean),
            varietyRecommendations: [
                'Try rotating between different protein sources',
                'Include more colorful vegetables for variety',
                'Explore different preparation methods for favorite foods'
            ],
            costOptimizations: [
                totalCost > (data.budget?.maxCostPerDay || 10) * dailyPlans.length ? 'Consider more cost-effective protein sources' : '',
                'Seasonal ingredients may offer better value',
                'Bulk preparation can reduce overall costs'
            ].filter(Boolean)
        };
        const weeklyPlan = {
            planId,
            schoolId,
            userId,
            studentIds: data.studentIds,
            startDate: data.startDate,
            endDate: data.endDate,
            mealTypes: data.mealTypes,
            nutritionalGoals: {
                calories: data.nutritionalGoals.caloriesPerDay,
                protein: data.nutritionalGoals.proteinGrams,
                carbs: data.nutritionalGoals.carbsGrams,
                fat: data.nutritionalGoals.fatGrams,
                fiber: data.nutritionalGoals.fiberGrams,
                sodium: data.nutritionalGoals.sodiumMg,
                sugar: data.nutritionalGoals.sugarGrams
            },
            dailyPlans,
            overallSummary: {
                totalCost,
                avgHealthScore,
                avgVarietyScore,
                nutritionalBalance: avgHealthScore,
                goalAchievement
            },
            aiInsights,
            preferences: data.preferences,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await database.prisma.$transaction(async (prisma) => {
            await prisma.menuPlan.create({
                data: {
                    id: planId,
                    schoolId,
                    name: `Weekly Plan - ${new Date(data.startDate).toLocaleDateString()}`,
                    description: `AI-generated weekly meal plan with health score: ${avgHealthScore}/100`,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                    status: 'ACTIVE',
                    createdBy: userId,
                    metadata: JSON.stringify({
                        studentIds: data.studentIds,
                        planType: 'weekly',
                        nutritionalGoals: data.nutritionalGoals,
                        planData: weeklyPlan,
                        totalCost,
                        avgHealthScore
                    })
                }
            });
            await prisma.auditLog.create({
                data: {
                    entityType: 'meal_plan',
                    entityId: planId,
                    action: 'meal_plan_generated',
                    userId,
                    createdById: userId,
                    metadata: JSON.stringify({
                        schoolId,
                        studentCount: data.studentIds.length,
                        dayCount: dailyPlans.length,
                        mealTypes: data.mealTypes,
                        totalCost,
                        avgHealthScore
                    })
                }
            });
        });
        logger.info('Weekly meal plan generated successfully', {
            requestId,
            planId,
            userId,
            schoolId,
            dayCount: dailyPlans.length,
            totalCost,
            avgHealthScore
        });
        return weeklyPlan;
    }
    catch (error) {
        logger.error('Failed to generate weekly meal plan', {
            requestId,
            userId,
            schoolId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
const mealPlannerHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
        const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
        logger.info('AI meal planner request started', {
            requestId,
            method: event.httpMethod,
            path: event.path,
            clientIP,
            userAgent: userAgent.substring(0, 200)
        });
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)(405, `Method ${event.httpMethod} not allowed`, undefined, 'METHOD_NOT_ALLOWED', requestId);
        }
        if (!event.body) {
            return (0, response_utils_1.createErrorResponse)(400, 'Request body required', undefined, 'MISSING_BODY', requestId);
        }
        const { userId, schoolId } = await validateUserAccess(event, requestId);
        const requestData = JSON.parse(event.body);
        const validatedData = mealPlannerRequestSchema.parse(requestData);
        if (validatedData.schoolId !== schoolId) {
            return (0, response_utils_1.createErrorResponse)(403, 'Access denied - invalid school context', undefined, 'ACCESS_DENIED', requestId);
        }
        const startDate = new Date(validatedData.startDate);
        const endDate = new Date(validatedData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
            return (0, response_utils_1.createErrorResponse)(400, 'Start date cannot be in the past', undefined, 'INVALID_DATE_RANGE', requestId);
        }
        if (endDate <= startDate) {
            return (0, response_utils_1.createErrorResponse)(400, 'End date must be after start date', undefined, 'INVALID_DATE_RANGE', requestId);
        }
        const dayDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        if (dayDiff > 14) {
            return (0, response_utils_1.createErrorResponse)(400, 'Date range cannot exceed 14 days', undefined, 'DATE_RANGE_TOO_LONG', requestId);
        }
        const mealPlan = await generateWeeklyMealPlan(validatedData, userId, schoolId, requestId);
        const duration = Date.now() - startTime;
        logger.info('AI meal planner request completed', {
            requestId,
            userId,
            schoolId,
            planId: mealPlan.planId,
            dayCount: mealPlan.dailyPlans.length,
            totalCost: mealPlan.overallSummary.totalCost,
            avgHealthScore: mealPlan.overallSummary.avgHealthScore,
            duration,
            success: true
        });
        return (0, response_utils_1.createSuccessResponse)({
            mealPlan,
            summary: {
                planId: mealPlan.planId,
                totalDays: mealPlan.dailyPlans.length,
                totalCost: mealPlan.overallSummary.totalCost,
                avgHealthScore: mealPlan.overallSummary.avgHealthScore,
                goalAchievement: mealPlan.overallSummary.goalAchievement
            }
        }, 'Meal plan generated successfully', 201, requestId);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('AI meal planner request failed', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration
        });
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid request data', error.issues, 'VALIDATION_ERROR', requestId);
        }
        if (error instanceof Error) {
            if (error.message.includes('Authentication required')) {
                return (0, response_utils_1.createErrorResponse)(401, 'Authentication required', undefined, 'AUTHENTICATION_REQUIRED', requestId);
            }
            if (error.message.includes('Access denied')) {
                return (0, response_utils_1.createErrorResponse)(403, 'Access denied', undefined, 'ACCESS_DENIED', requestId);
            }
            if (error.message.includes('No menu items available')) {
                return (0, response_utils_1.createErrorResponse)(404, 'No menu items available for the specified date range', undefined, 'NO_MENU_ITEMS', requestId);
            }
            if (error.message.includes('Failed to generate')) {
                return (0, response_utils_1.createErrorResponse)(422, error.message, undefined, 'GENERATION_FAILED', requestId);
            }
        }
        return (0, response_utils_1.createErrorResponse)(500, 'Internal server error', undefined, 'INTERNAL_ERROR', requestId);
    }
};
exports.mealPlannerHandler = mealPlannerHandler;
//# sourceMappingURL=meal-planner-ai.js.map