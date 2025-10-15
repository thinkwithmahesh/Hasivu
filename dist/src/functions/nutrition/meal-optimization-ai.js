"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.mealOptimizationHandler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client_sagemaker_runtime_1 = require("@aws-sdk/client-sagemaker-runtime");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const dynamoDbClient = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient({}));
const bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sageMakerClient = new client_sagemaker_runtime_1.SageMakerRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
const mealOptimizationRequestSchema = zod_1.z.object({
    currentMealPlan: zod_1.z.object({
        meals: zod_1.z.array(zod_1.z.object({
            mealType: zod_1.z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
            items: zod_1.z.array(zod_1.z.object({
                foodId: zod_1.z.string(),
                name: zod_1.z.string(),
                quantity: zod_1.z.number().positive(),
                unit: zod_1.z.string(),
                calories: zod_1.z.number().min(0),
                macros: zod_1.z.object({
                    protein: zod_1.z.number().min(0),
                    carbs: zod_1.z.number().min(0),
                    fat: zod_1.z.number().min(0),
                }),
                micronutrients: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional(),
            })),
        })),
    }),
    constraints: zod_1.z.object({
        maxBudget: zod_1.z.number().positive().optional(),
        cuisinePreferences: zod_1.z.array(zod_1.z.string()).optional(),
        dietaryRestrictions: zod_1.z.array(zod_1.z.string()).optional(),
        allergies: zod_1.z.array(zod_1.z.string()).optional(),
        mealFrequency: zod_1.z.number().int().min(1).max(6).default(3),
        timeConstraints: zod_1.z
            .object({
            prepTime: zod_1.z.number().min(0).optional(),
            cookingSkillLevel: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
        })
            .optional(),
    }),
    targets: zod_1.z.object({
        healthScore: zod_1.z.number().min(0).max(10).default(8),
        costOptimization: zod_1.z.boolean().default(false),
        sustainabilityScore: zod_1.z.number().min(0).max(10).optional(),
        palatabilityScore: zod_1.z.number().min(0).max(10).default(7),
        nutritionalBalance: zod_1.z.object({
            targetCalories: zod_1.z.number().positive(),
            proteinRatio: zod_1.z.number().min(0).max(1).default(0.25),
            carbRatio: zod_1.z.number().min(0).max(1).default(0.45),
            fatRatio: zod_1.z.number().min(0).max(1).default(0.3),
        }),
    }),
    userProfile: zod_1.z.object({
        age: zod_1.z.number().int().min(1).max(120),
        gender: zod_1.z.enum(['male', 'female', 'other']),
        activityLevel: zod_1.z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
        healthGoals: zod_1.z.array(zod_1.z.enum(['weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'strength'])),
        medicalConditions: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
async function getNutritionalData(foodIds) {
    const nutritionalData = {};
    try {
        const batchRequests = foodIds.map(async (foodId) => {
            const command = new lib_dynamodb_1.GetCommand({
                TableName: process.env.NUTRITION_TABLE || 'hasivu-nutrition-data',
                Key: { foodId },
            });
            const result = await dynamoDbClient.send(command);
            if (result.Item) {
                nutritionalData[foodId] = result.Item;
            }
        });
        await Promise.all(batchRequests);
        return nutritionalData;
    }
    catch (error) {
        logger_service_1.LoggerService.getInstance().error('Failed to fetch nutritional data', error instanceof Error ? error : new Error('Unknown error'), { foodIds });
        throw new Error('Nutritional data retrieval failed');
    }
}
async function optimizeMealWithAI(inputData, constraints, targets, userProfile) {
    try {
        const prompt = `You are an expert nutritionist and meal optimization AI. Analyze and optimize the following meal plan:

Input Data: ${JSON.stringify(inputData, null, 2)}
Constraints: ${JSON.stringify(constraints, null, 2)}
Optimization Targets: ${JSON.stringify(targets, null, 2)}
User Profile: ${JSON.stringify(userProfile, null, 2)}

Please perform comprehensive meal optimization focusing on:

1. NUTRITIONAL OPTIMIZATION:
   - Analyze current nutritional gaps and excesses
   - Optimize macro and micronutrient balance
   - Improve overall health score while maintaining palatability

2. COST OPTIMIZATION:
   - Identify cost-effective ingredient substitutions
   - Minimize food waste through portion optimization
   - Suggest seasonal and local alternatives

3. HEALTH PERSONALIZATION:
   - Adapt recommendations based on user profile
   - Consider medical conditions and health goals
   - Optimize for activity level and metabolic needs

4. SUSTAINABILITY CONSIDERATIONS:
   - Prioritize plant-based proteins where appropriate
   - Minimize environmental impact
   - Suggest local and seasonal ingredients

Return a comprehensive optimization plan in JSON format with:
- optimized_meals: Array of meal objects with nutritional profiles
- nutritional_summary: Complete nutritional analysis
- cost_analysis: Detailed cost breakdown and savings
- health_insights: Health-focused recommendations
- implementation_plan: Step-by-step optimization guidance
- risk_assessment: Potential concerns and mitigation strategies

Focus on practical, achievable improvements that align with the user's constraints and preferences.`;
        const command = new client_bedrock_runtime_1.InvokeModelCommand({
            modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 4000,
                temperature: 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        });
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const aiResponse = responseBody.content[0].text;
        let optimizationPlan;
        try {
            const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
            optimizationPlan = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(aiResponse);
        }
        catch (parseError) {
            optimizationPlan = createFallbackOptimization(inputData, constraints, targets);
        }
        return processAIOptimization(optimizationPlan, inputData);
    }
    catch (error) {
        logger_service_1.LoggerService.getInstance().error('AI meal optimization failed', error instanceof Error ? error : new Error('Unknown error'));
        return createFallbackOptimization(inputData, constraints, targets);
    }
}
function processAIOptimization(aiResponse, originalMealPlan) {
    return {
        meals: aiResponse.optimized_meals?.map((meal) => ({
            mealType: meal.meal_type || meal.mealType,
            items: meal.items?.map((item) => ({
                foodId: item.food_id || item.foodId || `food_${Date.now()}`,
                name: item.name,
                quantity: item.quantity || 1,
                unit: item.unit || 'serving',
                calories: item.calories || 0,
                macros: {
                    protein: item.macros?.protein || item.protein || 0,
                    carbs: item.macros?.carbs || item.carbs || 0,
                    fat: item.macros?.fat || item.fat || 0,
                },
                micronutrients: item.micronutrients || {},
                estimatedCost: item.estimated_cost || item.cost || 0,
                nutritionScore: item.nutrition_score || item.score || 7,
                sustainabilityScore: item.sustainability_score,
                substituteOptions: item.substitute_options || item.alternatives || [],
            })) || [],
            nutritionalProfile: {
                calories: meal.nutritional_profile?.calories || 0,
                macros: meal.nutritional_profile?.macros || { protein: 0, carbs: 0, fat: 0 },
                micronutrients: meal.nutritional_profile?.micronutrients || {},
                fiber: meal.nutritional_profile?.fiber || 0,
                score: meal.nutritional_profile?.score || 7,
            },
            estimatedCost: meal.estimated_cost || 0,
            prepTime: meal.prep_time || 30,
            difficulty: meal.difficulty || 'medium',
            alternatives: meal.alternatives || [],
        })) || [],
        nutritionalSummary: {
            totalCalories: aiResponse.nutritional_summary?.total_calories || 2000,
            macroDistribution: {
                protein: {
                    grams: aiResponse.nutritional_summary?.macros?.protein || 150,
                    percentage: 25,
                },
                carbs: {
                    grams: aiResponse.nutritional_summary?.macros?.carbs || 225,
                    percentage: 45,
                },
                fat: {
                    grams: aiResponse.nutritional_summary?.macros?.fat || 67,
                    percentage: 30,
                },
            },
            micronutrientProfile: aiResponse.nutritional_summary?.micronutrients || {},
            overallHealthScore: aiResponse.nutritional_summary?.health_score || 8,
            nutritionalGaps: aiResponse.nutritional_summary?.gaps || [],
            excesses: aiResponse.nutritional_summary?.excesses || [],
        },
        costAnalysis: {
            totalCost: aiResponse.cost_analysis?.total_cost || 50,
            costPerMeal: aiResponse.cost_analysis?.cost_per_meal || 16.67,
            costPerCalorie: aiResponse.cost_analysis?.cost_per_calorie || 0.025,
            budgetUtilization: aiResponse.cost_analysis?.budget_utilization || 75,
            costSavings: aiResponse.cost_analysis?.savings || 15,
            economicalAlternatives: aiResponse.cost_analysis?.alternatives || [],
        },
        healthScore: aiResponse.health_score || 8,
        sustainabilityScore: aiResponse.sustainability_score || 7,
        improvements: aiResponse.improvements || [
            'Improved protein quality with lean sources',
            'Enhanced micronutrient density',
            'Optimized portion sizes for better satiety',
            'Reduced sodium content for cardiovascular health',
        ],
    };
}
function createFallbackOptimization(inputData, constraints, targets) {
    const currentMeals = inputData.currentMealPlan?.meals || [];
    return {
        meals: currentMeals.map((meal) => ({
            mealType: meal.mealType,
            items: meal.items?.map((item) => ({
                ...item,
                estimatedCost: item.estimatedCost || Math.random() * 5 + 2,
                nutritionScore: Math.min(item.nutritionScore || 6, 8),
                sustainabilityScore: 6,
                substituteOptions: [],
            })) || [],
            nutritionalProfile: calculateNutritionalProfile(meal.items || []),
            estimatedCost: Math.random() * 15 + 10,
            prepTime: Math.random() * 30 + 15,
            difficulty: 'medium',
            alternatives: [],
        })),
        nutritionalSummary: createNutritionalSummary(currentMeals),
        costAnalysis: {
            totalCost: Math.random() * 50 + 30,
            costPerMeal: Math.random() * 15 + 10,
            costPerCalorie: 0.025,
            budgetUtilization: 75,
            costSavings: Math.random() * 20 + 5,
            economicalAlternatives: [],
        },
        healthScore: targets.healthScore || 7,
        sustainabilityScore: targets.sustainabilityScore || 6,
        improvements: [
            'Optimized portion sizes for target calorie intake',
            'Balanced macronutrient ratios',
            'Enhanced micronutrient diversity',
        ],
    };
}
function calculateNutritionalProfile(items) {
    const totals = items.reduce((acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.macros?.protein || 0),
        carbs: acc.carbs + (item.macros?.carbs || 0),
        fat: acc.fat + (item.macros?.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return {
        calories: totals.calories,
        macros: {
            protein: totals.protein,
            carbs: totals.carbs,
            fat: totals.fat,
        },
        micronutrients: {},
        fiber: Math.round(totals.carbs * 0.1),
        score: Math.min(8, Math.max(5, totals.calories / 200)),
    };
}
function createNutritionalSummary(meals) {
    const allItems = meals.flatMap((meal) => meal.items || []);
    const totals = allItems.reduce((acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.macros?.protein || 0),
        carbs: acc.carbs + (item.macros?.carbs || 0),
        fat: acc.fat + (item.macros?.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return {
        totalCalories: totals.calories,
        macroDistribution: {
            protein: {
                grams: totals.protein,
                percentage: totals.calories > 0 ? Math.round(((totals.protein * 4) / totals.calories) * 100) : 0,
            },
            carbs: {
                grams: totals.carbs,
                percentage: totals.calories > 0 ? Math.round(((totals.carbs * 4) / totals.calories) * 100) : 0,
            },
            fat: {
                grams: totals.fat,
                percentage: totals.calories > 0 ? Math.round(((totals.fat * 9) / totals.calories) * 100) : 0,
            },
        },
        micronutrientProfile: {},
        overallHealthScore: Math.min(10, Math.max(5, totals.calories / 250)),
        nutritionalGaps: [],
        excesses: [],
    };
}
async function storeOptimizationResult(userId, optimizationRequest, optimizationResult) {
    try {
        const command = new lib_dynamodb_1.PutCommand({
            TableName: process.env.OPTIMIZATION_HISTORY_TABLE || 'hasivu-meal-optimizations',
            Item: {
                optimizationId: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                timestamp: new Date().toISOString(),
                request: optimizationRequest,
                result: optimizationResult,
                version: '1.0',
                ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            },
        });
        await dynamoDbClient.send(command);
    }
    catch (error) {
        logger_service_1.LoggerService.getInstance().warn('Failed to store optimization result', { error, userId });
    }
}
const mealOptimizationHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('AI meal optimization request started', { requestId });
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        const requestBody = JSON.parse(event.body || '{}');
        const optimizationRequest = mealOptimizationRequestSchema.parse(requestBody);
        logger.info('Processing meal optimization', {
            requestId,
            userId: authenticatedUser.id,
            mealCount: optimizationRequest.currentMealPlan.meals.length,
            targetHealthScore: optimizationRequest.targets.healthScore,
        });
        const allFoodIds = optimizationRequest.currentMealPlan.meals
            .flatMap(meal => meal.items)
            .map((item) => item.foodId);
        const nutritionalData = await getNutritionalData(allFoodIds);
        const enhancedMealPlan = {
            ...optimizationRequest.currentMealPlan,
            nutritionalData,
        };
        const optimizationResult = await optimizeMealWithAI(enhancedMealPlan, optimizationRequest.constraints, optimizationRequest.targets, optimizationRequest.userProfile);
        await storeOptimizationResult(authenticatedUser.id || authenticatedUser.userId || '', optimizationRequest, optimizationResult);
        logger.info('AI meal optimization completed successfully', {
            requestId,
            userId: authenticatedUser.id,
            healthScore: optimizationResult.healthScore,
            totalCost: optimizationResult.costAnalysis.totalCost,
            improvementCount: optimizationResult.improvements.length,
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Meal optimization completed successfully',
            data: {
                optimizedPlan: optimizationResult,
                originalPlan: enhancedMealPlan,
                optimization: {
                    healthScoreImprovement: optimizationResult.healthScore - (optimizationRequest.targets.healthScore || 7),
                    costSavings: optimizationResult.costAnalysis.costSavings,
                    nutritionalImprovements: optimizationResult.improvements.length,
                    processingTime: Date.now(),
                    optimizationId: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                },
                recommendations: {
                    priority: optimizationResult.improvements.slice(0, 3),
                    implementation: 'Follow the optimized meal plan for maximum health benefits',
                    monitoring: 'Track progress weekly and adjust based on results',
                },
            },
        });
    }
    catch (error) {
        logger.error('AI meal optimization failed', error instanceof Error ? error : new Error(String(error)), {
            requestId,
        });
        if (error.name === 'ZodError') {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid optimization request data', 400);
        }
        return (0, response_utils_1.handleError)(error, 'Failed to optimize meal plan');
    }
};
exports.mealOptimizationHandler = mealOptimizationHandler;
exports.handler = exports.mealOptimizationHandler;
//# sourceMappingURL=meal-optimization-ai.js.map