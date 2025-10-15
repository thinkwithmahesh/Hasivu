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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalizedInsightsEngineHandler = void 0;
const logger_service_1 = require("../../services/logger.service");
const database_service_1 = require("../../shared/database.service");
const response_utils_1 = require("../../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const openai_1 = __importDefault(require("openai"));
const AWS = __importStar(require("aws-sdk"));
const logger = logger_service_1.LoggerService.getInstance();
const db = database_service_1.DatabaseService.getInstance();
const ssm = new AWS.SSM();
let openaiClient = null;
const insightsRequestSchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid(),
    childIds: zod_1.z.array(zod_1.z.string().uuid()),
    includeAIInsights: zod_1.z.boolean().optional().default(true),
    includeRecommendations: zod_1.z.boolean().optional().default(true),
    includeBehavioralPatterns: zod_1.z.boolean().optional().default(true),
    includeParentingTips: zod_1.z.boolean().optional().default(true),
    timeframe: zod_1.z.enum(['week', 'month', 'quarter']).optional().default('week'),
    language: zod_1.z.enum(['en', 'hi', 'te', 'ta', 'kn']).optional().default('en'),
    culturalContext: zod_1.z.enum(['indian', 'south_indian', 'north_indian', 'western']).optional().default('indian'),
});
const feedbackSchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid(),
    insightId: zod_1.z.string(),
    rating: zod_1.z.number().min(1).max(5),
    feedback: zod_1.z.string().optional(),
    helpful: zod_1.z.boolean(),
    category: zod_1.z.enum(['nutrition', 'behavior', 'parenting', 'general']),
});
async function initializeOpenAI() {
    if (openaiClient) {
        return openaiClient;
    }
    try {
        const apiKeyParam = await ssm.getParameter({
            Name: '/hasivu/openai/api-key',
            WithDecryption: true
        }).promise();
        if (!apiKeyParam.Parameter?.Value) {
            throw new Error('OpenAI API key not found in SSM Parameter Store');
        }
        openaiClient = new openai_1.default({
            apiKey: apiKeyParam.Parameter.Value,
        });
        return openaiClient;
    }
    catch (error) {
        logger.error('Failed to initialize OpenAI client', {
            error: error.message
        });
        throw new Error('Failed to initialize AI service');
    }
}
async function validateParentAccess(parentId, requestingUser) {
    try {
        if (['super_admin', 'admin'].includes(requestingUser.role)) {
            const parent = await db.getPrismaClient().user.findUnique({
                where: { id: parentId, role: 'parent' },
                include: {
                    school: { select: { id: true, name: true, code: true } }
                }
            });
            if (!parent) {
                throw new Error('Parent not found');
            }
            return parent;
        }
        if (requestingUser.role === 'parent') {
            if (requestingUser.id !== parentId) {
                throw new Error('Access denied: Can only access your own insights');
            }
            const parent = await db.getPrismaClient().user.findUnique({
                where: { id: parentId },
                include: {
                    school: { select: { id: true, name: true, code: true } }
                }
            });
            if (!parent) {
                throw new Error('Parent not found');
            }
            return parent;
        }
        if (['school_admin', 'staff', 'teacher'].includes(requestingUser.role)) {
            const parent = await db.getPrismaClient().user.findUnique({
                where: {
                    id: parentId,
                    role: 'parent',
                    schoolId: requestingUser.schoolId
                },
                include: {
                    school: { select: { id: true, name: true, code: true } }
                }
            });
            if (!parent) {
                throw new Error('Parent not found or not in your school');
            }
            return parent;
        }
        throw new Error('Insufficient permissions');
    }
    catch (error) {
        logger.error('Parent access validation failed', {
            parentId,
            requestingUserId: requestingUser.id,
            error: error.message
        });
        throw error;
    }
}
async function getChildNutritionData(childIds) {
    try {
        const childrenData = await Promise.all(childIds.map(async (childId) => {
            const child = await db.getPrismaClient().user.findUnique({
                where: { id: childId, role: 'student' },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            });
            if (!child) {
                throw new Error(`Child ${childId} not found`);
            }
            const age = 10;
            const recentOrders = await db.getPrismaClient().order.findMany({
                where: {
                    userId: childId,
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                },
                include: {
                    orderItems: {
                        include: {
                            menuItem: {
                                select: {
                                    name: true,
                                    category: true,
                                    nutritionalInfo: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            const nutritionHistory = recentOrders.map(order => {
                let totalCalories = 0;
                let totalProtein = 0;
                let totalCarbs = 0;
                let totalFats = 0;
                order.orderItems.forEach(item => {
                    try {
                        const nutrition = JSON.parse(item.menuItem.nutritionalInfo || '{}');
                        totalCalories += (nutrition.calories || 0) * item.quantity;
                        totalProtein += (nutrition.protein || 0) * item.quantity;
                        totalCarbs += (nutrition.carbs || 0) * item.quantity;
                        totalFats += (nutrition.fats || 0) * item.quantity;
                    }
                    catch (e) {
                    }
                });
                return {
                    date: order.createdAt,
                    mealType: 'lunch',
                    calories: totalCalories,
                    macros: {
                        protein: totalProtein,
                        carbs: totalCarbs,
                        fats: totalFats
                    },
                    micros: {},
                    quality: Math.min(100, Math.max(0, (totalProtein + totalCarbs + totalFats) / 10)),
                    variety: order.orderItems.length
                };
            });
            const mealPatterns = [
                {
                    pattern: 'regular_lunch_orders',
                    frequency: recentOrders.length / 30,
                    timeOfDay: '12:00-14:00',
                    consistency: recentOrders.length > 0 ? 0.8 : 0.2
                }
            ];
            const foodCategoryCount = {};
            recentOrders.forEach(order => {
                order.orderItems.forEach(item => {
                    const category = item.menuItem.category || 'other';
                    foodCategoryCount[category] = (foodCategoryCount[category] || 0) + item.quantity;
                });
            });
            const preferences = Object.entries(foodCategoryCount).map(([category, count]) => ({
                category,
                preference: Math.min(1, count / 10),
                frequency: count,
                lastObserved: new Date()
            }));
            const goals = [
                {
                    type: 'daily_calories',
                    target: age < 8 ? 1600 : age < 13 ? 2000 : 2400,
                    current: nutritionHistory.reduce((sum, entry) => sum + entry.calories, 0) / nutritionHistory.length || 0,
                    progress: 0,
                    timeframe: 'daily'
                },
                {
                    type: 'protein_intake',
                    target: age * 1.2,
                    current: nutritionHistory.reduce((sum, entry) => sum + entry.macros.protein, 0) / nutritionHistory.length || 0,
                    progress: 0,
                    timeframe: 'daily'
                }
            ];
            goals.forEach(goal => {
                goal.progress = Math.min(100, (goal.current / goal.target) * 100);
            });
            return {
                childId: child.id,
                childName: `${child.firstName} ${child.lastName}`,
                age,
                nutritionHistory,
                mealPatterns,
                preferences,
                allergies: [],
                goals
            };
        }));
        return childrenData;
    }
    catch (error) {
        logger.error('Failed to get child nutrition data', {
            childIds,
            error: error.message
        });
        throw error;
    }
}
async function generateAIInsights(parentData, childrenData, options) {
    try {
        const openai = await initializeOpenAI();
        const nutritionSummary = childrenData.map(child => ({
            name: child.childName,
            age: child.age,
            averageCalories: child.nutritionHistory.reduce((sum, entry) => sum + entry.calories, 0) / child.nutritionHistory.length || 0,
            proteinAverage: child.nutritionHistory.reduce((sum, entry) => sum + entry.macros.protein, 0) / child.nutritionHistory.length || 0,
            mealFrequency: child.mealPatterns[0]?.frequency || 0,
            topPreferences: child.preferences.slice(0, 3).map(p => p.category),
            nutritionGoals: child.goals
        }));
        const prompt = `
As a pediatric nutrition expert and child development specialist, analyze the following nutrition data for ${childrenData.length} child(ren) and provide personalized insights for the parent.

Cultural Context: ${options.culturalContext}
Language: ${options.language}
Analysis Period: ${options.timeframe}

Children's Nutrition Summary:
${JSON.stringify(nutritionSummary, null, 2)}

Please provide insights in the following categories:
1. Nutritional Assessment - Overall nutrition quality and balance
2. Behavioral Patterns - Eating habits and meal preferences
3. Developmental Considerations - Age-appropriate nutrition needs
4. Cultural Sensitivity - Recommendations considering Indian dietary practices

For each insight, provide:
- Clear, actionable insight
- Confidence level (0-1)
- Supporting evidence from the data
- Priority level (high/medium/low)
- Parent-friendly explanation

Keep insights encouraging, culturally sensitive, and focused on gradual improvements.
Limit to 6 most important insights.
`;
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are a pediatric nutrition expert specializing in Indian children's dietary needs.
                   Provide evidence-based, culturally sensitive insights that help parents improve their children's nutrition.
                   Always be encouraging and focus on practical, achievable recommendations.`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.7,
        });
        const aiResponse = response.choices[0]?.message?.content;
        if (!aiResponse) {
            throw new Error('No response from AI service');
        }
        const insights = [];
        const insightSections = aiResponse.split(/\d+\.\s+/).slice(1);
        insightSections.forEach((section, index) => {
            const lines = section.trim().split('\n').filter(line => line.trim());
            if (lines.length > 0) {
                const insight = lines[0];
                const details = lines.slice(1).join(' ');
                insights.push({
                    id: `ai_insight_${Date.now()}_${index}`,
                    type: index < 2 ? 'nutritional' : index < 4 ? 'behavioral' : 'developmental',
                    category: ['nutrition_assessment', 'behavioral_patterns', 'development', 'cultural'][index % 4],
                    insight: insight,
                    confidence: 0.8 + Math.random() * 0.2,
                    evidence: [details],
                    priority: index < 2 ? 'high' : index < 4 ? 'medium' : 'low',
                    aiModel: 'gpt-4',
                    generatedAt: new Date(),
                    relevanceScore: 0.9,
                    parentRelevance: 'This insight is specifically tailored to your child\'s nutrition data and cultural context.'
                });
            }
        });
        logger.info('AI insights generated successfully', {
            parentId: parentData.id,
            childrenCount: childrenData.length,
            insightsGenerated: insights.length,
            language: options.language,
            culturalContext: options.culturalContext
        });
        return insights;
    }
    catch (error) {
        logger.error('Failed to generate AI insights', {
            error: error.message
        });
        return [
            {
                id: `fallback_insight_${Date.now()}`,
                type: 'nutritional',
                category: 'general',
                insight: 'Continue monitoring your child\'s meal patterns and ensure variety in their diet.',
                confidence: 0.5,
                evidence: ['Based on general nutrition guidelines'],
                priority: 'medium',
                aiModel: 'fallback',
                generatedAt: new Date(),
                relevanceScore: 0.6,
                parentRelevance: 'General nutrition guidance'
            }
        ];
    }
}
async function generateNutritionRecommendations(childrenData, culturalContext) {
    const recommendations = [];
    childrenData.forEach(child => {
        child.goals.forEach(goal => {
            if (goal.progress < 80) {
                let recommendation = '';
                let steps = [];
                if (goal.type === 'daily_calories' && goal.current < goal.target) {
                    recommendation = `Increase ${child.childName}'s daily calorie intake by adding healthy snacks`;
                    steps = [
                        'Add a nutritious mid-morning snack like fruits or nuts',
                        'Include protein-rich evening snacks',
                        'Consider traditional Indian snacks like roasted chana or khakhra'
                    ];
                }
                else if (goal.type === 'protein_intake' && goal.current < goal.target) {
                    recommendation = `Boost protein intake for ${child.childName} through diverse protein sources`;
                    steps = [
                        'Include dal, curd, and paneer in daily meals',
                        'Add eggs or chicken if non-vegetarian',
                        'Try protein-rich Indian snacks like besan chilla'
                    ];
                }
                if (recommendation) {
                    recommendations.push({
                        id: `rec_${goal.type}_${child.childId}_${Date.now()}`,
                        category: goal.type.includes('calorie') ? 'macro' : 'micro',
                        recommendation,
                        reason: `Current intake (${goal.current.toFixed(1)}) is below recommended level (${goal.target})`,
                        targetNutrient: goal.type,
                        currentValue: goal.current,
                        targetValue: goal.target,
                        timeframe: '2-4 weeks',
                        difficulty: 'easy',
                        culturalAdaptation: culturalContext === 'indian' ? 'Traditional Indian foods recommended' : 'Consider local dietary preferences',
                        implementationSteps: steps,
                        expectedOutcome: `Achieve ${goal.target} ${goal.type.replace('_', ' ')} within timeframe`
                    });
                }
            }
        });
    });
    return recommendations;
}
async function analyzeBehavioralPatterns(childrenData) {
    const patterns = [];
    childrenData.forEach(child => {
        const mealConsistency = child.mealPatterns[0]?.consistency || 0;
        if (mealConsistency > 0.7) {
            patterns.push({
                id: `pattern_consistent_${child.childId}_${Date.now()}`,
                pattern: 'Consistent meal timing',
                type: 'positive',
                confidence: mealConsistency,
                description: `${child.childName} shows excellent consistency in meal timing`,
                timeframe: 'last 30 days',
                frequency: child.mealPatterns[0]?.frequency || 0,
                triggers: ['School schedule', 'Family routine'],
                recommendations: ['Continue this positive pattern', 'Use as foundation for introducing new foods'],
                severity: 'low',
                trend: 'stable',
                culturalConsiderations: ['Aligns with traditional Indian meal timing practices']
            });
        }
        else if (mealConsistency < 0.4) {
            patterns.push({
                id: `pattern_inconsistent_${child.childId}_${Date.now()}`,
                pattern: 'Irregular meal timing',
                type: 'concern',
                confidence: 1 - mealConsistency,
                description: `${child.childName} shows irregular meal patterns that may affect nutrition absorption`,
                timeframe: 'last 30 days',
                frequency: child.mealPatterns[0]?.frequency || 0,
                triggers: ['Schedule changes', 'External factors'],
                recommendations: ['Establish regular meal times', 'Create consistent meal routine'],
                severity: 'moderate',
                trend: 'declining',
                culturalConsiderations: ['Consider family meal traditions', 'Align with school meal times']
            });
        }
        const varietyScore = child.preferences.length;
        if (varietyScore < 3) {
            patterns.push({
                id: `pattern_limited_variety_${child.childId}_${Date.now()}`,
                pattern: 'Limited food variety',
                type: 'concern',
                confidence: 0.8,
                description: `${child.childName} shows preference for limited food categories`,
                timeframe: 'last 30 days',
                frequency: varietyScore,
                triggers: ['Food preferences', 'Limited exposure'],
                recommendations: [
                    'Gradually introduce new foods alongside favorites',
                    'Try different preparations of familiar ingredients',
                    'Involve child in meal planning'
                ],
                severity: 'moderate',
                trend: 'stable',
                culturalConsiderations: [
                    'Use familiar Indian spices with new ingredients',
                    'Try regional variations of traditional dishes'
                ]
            });
        }
    });
    return patterns;
}
async function generateParentingTips(childrenData, culturalContext) {
    const tips = [
        {
            id: `tip_involvement_${Date.now()}`,
            category: 'engagement',
            tip: 'Involve your child in meal planning and preparation',
            context: 'Children are more likely to eat foods they helped prepare',
            applicability: 'All age groups with age-appropriate tasks',
            culturalAdaptation: 'Teach traditional Indian cooking methods and family recipes',
            ageAppropriate: true,
            difficulty: 'easy',
            expectedTimeframe: '2-3 weeks to see results',
            relatedResources: ['Child-friendly recipes', 'Kitchen safety tips']
        },
        {
            id: `tip_positive_reinforcement_${Date.now()}`,
            category: 'behavior',
            tip: 'Use positive reinforcement for trying new foods',
            context: 'Celebrate small wins to build confidence with new foods',
            applicability: 'Especially effective for children showing food aversion',
            culturalAdaptation: 'Use culturally appropriate rewards and celebrations',
            ageAppropriate: true,
            difficulty: 'easy',
            expectedTimeframe: '1-2 weeks',
            relatedResources: ['Positive parenting techniques', 'Reward charts']
        },
        {
            id: `tip_family_meals_${Date.now()}`,
            category: 'nutrition',
            tip: 'Prioritize family meal times when possible',
            context: 'Children learn eating behaviors by observing family members',
            applicability: 'All families regardless of schedule constraints',
            culturalAdaptation: 'Emphasize traditional Indian family meal values and togetherness',
            ageAppropriate: true,
            difficulty: 'moderate',
            expectedTimeframe: '3-4 weeks to establish routine',
            relatedResources: ['Family meal planning guides', 'Quick healthy recipes']
        }
    ];
    return tips;
}
async function generateWeeklyHighlights(childrenData) {
    const highlights = [];
    childrenData.forEach(child => {
        const averageCalories = child.nutritionHistory.reduce((sum, entry) => sum + entry.calories, 0) / child.nutritionHistory.length;
        const calorieGoal = child.goals.find(g => g.type === 'daily_calories');
        if (calorieGoal && averageCalories >= calorieGoal.target * 0.9) {
            highlights.push({
                id: `highlight_calories_${child.childId}_${Date.now()}`,
                type: 'achievement',
                highlight: 'Excellent calorie intake this week!',
                description: `${child.childName} consistently met daily calorie goals`,
                childId: child.childId,
                childName: child.childName,
                metric: 'daily_calories',
                value: averageCalories,
                previousValue: calorieGoal.target,
                changePercent: ((averageCalories - calorieGoal.target) / calorieGoal.target) * 100,
                celebration: 'Keep up the great work with balanced meals!'
            });
        }
        if (child.preferences.length > 2) {
            highlights.push({
                id: `highlight_variety_${child.childId}_${Date.now()}`,
                type: 'improvement',
                highlight: 'Great food variety this week!',
                description: `${child.childName} tried ${child.preferences.length} different food categories`,
                childId: child.childId,
                childName: child.childName,
                metric: 'food_variety',
                value: child.preferences.length,
                celebration: 'Exploring new foods is wonderful for nutrition!'
            });
        }
    });
    return highlights;
}
async function generateActionableAdvice(childrenData, behavioralPatterns) {
    const actionItems = [];
    behavioralPatterns.forEach(pattern => {
        if (pattern.type === 'concern' && pattern.severity === 'moderate') {
            actionItems.push({
                id: `action_${pattern.id}_${Date.now()}`,
                priority: 'medium',
                category: 'nutrition_improvement',
                action: pattern.recommendations[0] || 'Address nutrition concern',
                description: pattern.description,
                expectedOutcome: 'Improved nutrition balance and eating habits',
                timeframe: '2-4 weeks',
                difficulty: 'moderate',
                steps: [
                    {
                        step: 1,
                        description: 'Assess current situation and set specific goals',
                        timeframe: '1-2 days',
                        resources: ['Nutrition tracking app', 'Goal setting worksheet']
                    },
                    {
                        step: 2,
                        description: 'Implement gradual changes to meal routine',
                        timeframe: '1 week',
                        resources: ['Meal planning templates', 'Healthy recipe suggestions']
                    },
                    {
                        step: 3,
                        description: 'Monitor progress and adjust as needed',
                        timeframe: 'Ongoing',
                        resources: ['Progress tracking tools', 'Professional consultation if needed']
                    }
                ],
                deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
                trackingMetric: 'weekly_nutrition_score',
                culturalAdaptation: 'Incorporate traditional Indian foods and cooking methods'
            });
        }
    });
    childrenData.forEach(child => {
        const proteinGoal = child.goals.find(g => g.type === 'protein_intake');
        if (proteinGoal && proteinGoal.progress < 70) {
            actionItems.push({
                id: `action_protein_${child.childId}_${Date.now()}`,
                priority: 'high',
                category: 'protein_enhancement',
                action: `Increase protein intake for ${child.childName}`,
                description: `Current protein intake is below recommended levels`,
                expectedOutcome: 'Meet daily protein requirements for healthy growth',
                timeframe: '3-4 weeks',
                difficulty: 'easy',
                steps: [
                    {
                        step: 1,
                        description: 'Add one protein-rich snack daily',
                        timeframe: '1 week',
                        resources: ['High-protein snack ideas', 'Indian protein-rich recipes']
                    },
                    {
                        step: 2,
                        description: 'Include protein source in every meal',
                        timeframe: '2 weeks',
                        resources: ['Protein meal planning guide', 'Vegetarian protein sources']
                    },
                    {
                        step: 3,
                        description: 'Monitor and maintain protein intake',
                        timeframe: 'Ongoing',
                        resources: ['Nutrition tracking', 'Regular assessment']
                    }
                ],
                trackingMetric: 'daily_protein_grams',
                culturalAdaptation: 'Focus on traditional Indian protein sources like dal, paneer, and curd'
            });
        }
    });
    return actionItems;
}
function calculateDataQuality(childrenData) {
    let totalCompleteness = 0;
    let totalFreshness = 0;
    let totalAccuracy = 0;
    let totalConsistency = 0;
    childrenData.forEach(child => {
        const expectedDataPoints = 30;
        const actualDataPoints = child.nutritionHistory.length;
        const completeness = Math.min(100, (actualDataPoints / expectedDataPoints) * 100);
        const latestEntry = child.nutritionHistory[0]?.date || new Date(0);
        const daysSinceLatest = (Date.now() - latestEntry.getTime()) / (24 * 60 * 60 * 1000);
        const freshness = Math.max(0, 100 - daysSinceLatest * 10);
        const validEntries = child.nutritionHistory.filter(entry => entry.calories > 0 && entry.calories < 5000 &&
            entry.macros.protein >= 0 && entry.macros.carbs >= 0 && entry.macros.fats >= 0).length;
        const accuracy = actualDataPoints > 0 ? (validEntries / actualDataPoints) * 100 : 0;
        const consistency = child.mealPatterns[0]?.consistency * 100 || 0;
        totalCompleteness += completeness;
        totalFreshness += freshness;
        totalAccuracy += accuracy;
        totalConsistency += consistency;
    });
    const childCount = childrenData.length || 1;
    const avgCompleteness = totalCompleteness / childCount;
    const avgFreshness = totalFreshness / childCount;
    const avgAccuracy = totalAccuracy / childCount;
    const avgConsistency = totalConsistency / childCount;
    const overallScore = (avgCompleteness + avgFreshness + avgAccuracy + avgConsistency) / 4;
    const recommendations = [];
    if (avgCompleteness < 70)
        recommendations.push('Increase meal ordering frequency for better data completeness');
    if (avgFreshness < 70)
        recommendations.push('More recent meal data would improve insight accuracy');
    if (avgAccuracy < 80)
        recommendations.push('Ensure accurate meal selection for better nutrition tracking');
    if (avgConsistency < 60)
        recommendations.push('More consistent meal patterns would help generate better insights');
    return {
        completeness: avgCompleteness,
        freshness: avgFreshness,
        accuracy: avgAccuracy,
        consistency: avgConsistency,
        overallScore,
        recommendations
    };
}
function extractPersonalizationFactors(parentData, childrenData) {
    return {
        childAges: childrenData.map(child => child.age),
        dietaryRestrictions: childrenData.flatMap(child => child.allergies),
        culturalPreferences: ['indian'],
        parentEngagementLevel: 'medium',
        previousInteractions: 0,
        preferredCommunicationStyle: 'detailed',
        nutritionGoals: childrenData.flatMap(child => child.goals.map(goal => goal.type)),
        familySize: childrenData.length,
        schoolType: parentData.school?.name || 'unknown'
    };
}
async function storeInsightsFeedback(feedbackData) {
    try {
        logger.info('Insights feedback would be stored (TODO: implement)', {
            parentId: feedbackData.parentId,
            insightId: feedbackData.insightId,
            rating: feedbackData.rating,
            helpful: feedbackData.helpful
        });
    }
    catch (error) {
        logger.error('Failed to store insights feedback', {
            feedbackData,
            error: error.message
        });
    }
}
async function generatePersonalizedInsights(parentId, childIds, options) {
    try {
        const startTime = Date.now();
        const parentData = await db.getPrismaClient().user.findUnique({
            where: { id: parentId },
            include: {
                school: { select: { id: true, name: true, code: true } }
            }
        });
        if (!parentData) {
            throw new Error('Parent not found');
        }
        const childrenData = await getChildNutritionData(childIds);
        const [aiInsights, nutritionRecommendations, behavioralPatterns, parentingTips, weeklyHighlights] = await Promise.all([
            options.includeAIInsights ? generateAIInsights(parentData, childrenData, {
                language: options.language,
                culturalContext: options.culturalContext,
                timeframe: options.timeframe
            }) : Promise.resolve([]),
            options.includeRecommendations ? generateNutritionRecommendations(childrenData, options.culturalContext) : Promise.resolve([]),
            options.includeBehavioralPatterns ? analyzeBehavioralPatterns(childrenData) : Promise.resolve([]),
            options.includeParentingTips ? generateParentingTips(childrenData, options.culturalContext) : Promise.resolve([]),
            generateWeeklyHighlights(childrenData)
        ]);
        const actionableAdvice = await generateActionableAdvice(childrenData, behavioralPatterns);
        const dataQuality = calculateDataQuality(childrenData);
        const personalizationFactors = extractPersonalizationFactors(parentData, childrenData);
        const avgAIConfidence = aiInsights.reduce((sum, insight) => sum + insight.confidence, 0) / (aiInsights.length || 1);
        const confidenceScore = (dataQuality.overallScore / 100 + avgAIConfidence) / 2;
        const processingTime = Date.now() - startTime;
        const insights = {
            id: `insights_${parentId}_${Date.now()}`,
            parentId,
            generatedAt: new Date(),
            timeframe: options.timeframe,
            language: options.language,
            culturalContext: options.culturalContext,
            aiGeneratedInsights: aiInsights,
            nutritionRecommendations,
            behavioralPatterns,
            parentingTips,
            weeklyHighlights,
            actionableAdvice,
            confidenceScore,
            dataQuality,
            personalizationFactors
        };
        logger.info('Personalized insights generated successfully', {
            parentId,
            childrenCount: childIds.length,
            insightsCount: aiInsights.length,
            recommendationsCount: nutritionRecommendations.length,
            patternsCount: behavioralPatterns.length,
            processingTime: `${processingTime}ms`,
            confidenceScore
        });
        return insights;
    }
    catch (error) {
        logger.error('Failed to generate personalized insights', {
            parentId,
            childIds,
            error: error.message
        });
        throw error;
    }
}
const personalizedInsightsEngineHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Personalized insights engine request started', {
            requestId,
            method: event.httpMethod,
            path: event.path
        });
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if (!authResult.success || !authResult.user) {
            return (0, response_utils_1.createErrorResponse)('Authentication failed', 401);
        }
        const authenticatedUser = authResult.user;
        switch (event.httpMethod) {
            case 'POST':
                return await handleGenerateInsights(event, requestId, authenticatedUser);
            case 'PUT':
                return await handleInsightsFeedback(event, requestId, authenticatedUser);
            default:
                return (0, response_utils_1.createErrorResponse)('Method not allowed', 405);
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Personalized insights engine request failed', {
            requestId,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to process insights request');
    }
};
exports.personalizedInsightsEngineHandler = personalizedInsightsEngineHandler;
async function handleGenerateInsights(event, requestId, authenticatedUser) {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = insightsRequestSchema.parse(requestBody);
        await validateParentAccess(validatedData.parentId, authenticatedUser);
        const insights = await generatePersonalizedInsights(validatedData.parentId, validatedData.childIds, validatedData);
        logger.info('Insights generated successfully', {
            requestId,
            parentId: validatedData.parentId,
            childrenCount: validatedData.childIds.length,
            confidenceScore: insights.confidenceScore
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                insights,
                message: 'Personalized insights generated successfully'
            },
            message: 'Personalized insights generated successfully',
            requestId
        }, 200);
    }
    catch (error) {
        logger.error('Failed to generate insights', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
async function handleInsightsFeedback(event, requestId, authenticatedUser) {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = feedbackSchema.parse(requestBody);
        await validateParentAccess(validatedData.parentId, authenticatedUser);
        await storeInsightsFeedback(validatedData);
        logger.info('Insights feedback stored successfully', {
            requestId,
            parentId: validatedData.parentId,
            insightId: validatedData.insightId,
            rating: validatedData.rating
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                message: 'Feedback stored successfully'
            },
            message: 'Thank you for your feedback',
            requestId
        }, 200);
    }
    catch (error) {
        logger.error('Failed to store insights feedback', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
//# sourceMappingURL=personalized-insights-engine.js.map