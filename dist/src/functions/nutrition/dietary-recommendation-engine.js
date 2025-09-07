"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.dietaryRecommendationHandler = void 0;
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
const sageMakerClient = new client_sagemaker_runtime_1.SageMakerRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dietaryProfileSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    preferences: zod_1.z.object({
        dietType: zod_1.z.enum(['vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'omnivore', 'pescatarian']),
        cuisinePreferences: zod_1.z.array(zod_1.z.string()),
        mealFrequency: zod_1.z.number().int().min(1).max(6).default(3),
        calorieTarget: zod_1.z.number().positive().optional()
    }),
    goals: zod_1.z.object({
        primary: zod_1.z.enum(['weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'strength', 'general_health']),
        secondary: zod_1.z.array(zod_1.z.string()).optional(),
        targetTimeline: zod_1.z.enum(['1_month', '3_months', '6_months', '1_year', 'ongoing'])
    }),
    currentDiet: zod_1.z.object({
        description: zod_1.z.string(),
        typicalMeals: zod_1.z.array(zod_1.z.string()),
        nutritionalGaps: zod_1.z.array(zod_1.z.string()).optional()
    }).optional(),
    restrictions: zod_1.z.object({
        allergies: zod_1.z.array(zod_1.z.string()),
        intolerances: zod_1.z.array(zod_1.z.string()),
        foodsToAvoid: zod_1.z.array(zod_1.z.string())
    }),
    healthConditions: zod_1.z.array(zod_1.z.object({
        condition: zod_1.z.string(),
        severity: zod_1.z.enum(['mild', 'moderate', 'severe']),
        dietaryImpact: zod_1.z.string()
    })).optional(),
    healthConditionSupport: zod_1.z.array(zod_1.z.object({
        condition: zod_1.z.string(),
        recommendations: zod_1.z.array(zod_1.z.string()),
        restrictions: zod_1.z.array(zod_1.z.string())
    })),
    culturalAdaptations: zod_1.z.object({
        culturalBackground: zod_1.z.string(),
        traditionalFoods: zod_1.z.array(zod_1.z.string()),
        religiousRestrictions: zod_1.z.array(zod_1.z.string()).optional(),
        culturalMealPatterns: zod_1.z.array(zod_1.z.string()),
        festivalConsiderations: zod_1.z.array(zod_1.z.string())
    })
});
const childProfileSchema = zod_1.z.object({
    childId: zod_1.z.string().uuid(),
    age: zod_1.z.number().int().min(1).max(18),
    gender: zod_1.z.enum(['male', 'female']),
    height: zod_1.z.number().positive(),
    weight: zod_1.z.number().positive(),
    activityLevel: zod_1.z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    schoolId: zod_1.z.string().uuid(),
    medicalConditions: zod_1.z.array(zod_1.z.string()).optional(),
    allergies: zod_1.z.array(zod_1.z.string()).optional(),
    parentPreferences: zod_1.z.object({
        organicPreference: zod_1.z.boolean().default(false),
        localFoodPreference: zod_1.z.boolean().default(false),
        budgetConstraints: zod_1.z.enum(['low', 'medium', 'high']).default('medium')
    }).optional()
});
function calculateChildNutritionalNeeds(childProfile) {
    const { age, gender, height, weight, activityLevel } = childProfile;
    const bmi = weight / ((height / 100) ** 2);
    let bmr;
    if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    }
    else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    const activityFactors = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
    };
    const totalDailyEnergyExpenditure = bmr * activityFactors[activityLevel];
    const growthFactor = age < 12 ? 1.2 : age < 16 ? 1.15 : 1.1;
    const adjustedCalories = Math.round(totalDailyEnergyExpenditure * growthFactor);
    return {
        calories: {
            min: Math.round(adjustedCalories * 0.9),
            max: Math.round(adjustedCalories * 1.1),
            optimal: adjustedCalories
        },
        macronutrients: {
            protein: {
                grams: Math.round(adjustedCalories * 0.15 / 4),
                percentage: 15
            },
            carbohydrates: {
                grams: Math.round(adjustedCalories * 0.55 / 4),
                percentage: 55
            },
            fat: {
                grams: Math.round(adjustedCalories * 0.30 / 9),
                percentage: 30
            }
        },
        micronutrients: {
            vitamins: {
                'vitamin_c': age < 9 ? 45 : age < 14 ? 65 : 75,
                'vitamin_d': 15,
                'vitamin_a': age < 9 ? 400 : age < 14 ? 600 : 700,
                'folate': age < 9 ? 300 : age < 14 ? 400 : 400
            },
            minerals: {
                'calcium': age < 9 ? 1000 : age < 19 ? 1300 : 1000,
                'iron': age < 9 ? 10 : age < 14 ? 8 : gender === 'male' ? 11 : 15,
                'zinc': age < 9 ? 8 : age < 14 ? 8 : gender === 'male' ? 11 : 9
            }
        },
        hydration: {
            dailyTarget: Math.round(weight * 35),
            timing: ['morning', 'before_meals', 'after_exercise', 'evening']
        }
    };
}
function getBMICategory(bmi, age) {
    if (age < 18) {
        if (bmi < 16)
            return 'underweight';
        if (bmi < 25)
            return 'normal';
        if (bmi < 30)
            return 'overweight';
        return 'obese';
    }
    else {
        if (bmi < 18.5)
            return 'underweight';
        if (bmi < 25)
            return 'normal';
        if (bmi < 30)
            return 'overweight';
        return 'obese';
    }
}
async function getHistoricalData(userId) {
    try {
        const command = new lib_dynamodb_1.QueryCommand({
            TableName: process.env.DIETARY_HISTORY_TABLE || 'hasivu-dietary-history',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false,
            Limit: 30
        });
        const result = await dynamoDbClient.send(command);
        return result.Items || [];
    }
    catch (error) {
        logger_service_1.LoggerService.getInstance().warn('Failed to retrieve dietary history', { error, userId });
        return [];
    }
}
async function generatePersonalizedRecommendations(profile, nutritionalNeeds, historicalData) {
    try {
        const prompt = `You are a certified nutritionist and dietary expert. Create personalized dietary recommendations based on:

Profile: ${JSON.stringify(profile, null, 2)}
Nutritional Needs: ${JSON.stringify(nutritionalNeeds, null, 2)}
Historical Patterns: ${JSON.stringify(historicalData.slice(0, 5), null, 2)}

Create comprehensive dietary recommendations including:

1. WEEKLY MEAL PLAN:
   - 7 days of complete meal plans
   - Culturally appropriate meals based on background
   - Consider dietary restrictions and health conditions
   - Include nutritional analysis for each meal

2. PERSONALIZED INSIGHTS:
   - Tailored tips based on goals and preferences
   - Potential challenges and solutions
   - Motivational messages aligned with cultural context

3. ACTION PLAN:
   - Progressive weekly goals
   - Monthly milestones tracking
   - Implementation strategies

4. SHOPPING LIST:
   - Ingredients organized by category
   - Seasonal and local alternatives
   - Budget-friendly options

Focus on:
- Cultural sensitivity and traditional foods
- Health condition management through nutrition
- Practical implementation strategies
- Evidence-based nutritional science
- Sustainable dietary changes

Return structured JSON response with meal plans, insights, and actionable recommendations.`;
        const command = new client_bedrock_runtime_1.InvokeModelCommand({
            modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 4000,
                temperature: 0.7,
                messages: [{
                        role: 'user',
                        content: prompt
                    }]
            })
        });
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const aiResponse = responseBody.content[0].text;
        let recommendations;
        try {
            const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
            recommendations = jsonMatch ? JSON.parse(jsonMatch[1]) : createFallbackRecommendations(profile, nutritionalNeeds);
        }
        catch (parseError) {
            recommendations = createFallbackRecommendations(profile, nutritionalNeeds);
        }
        return processAIRecommendations(recommendations, profile, nutritionalNeeds);
    }
    catch (error) {
        logger_service_1.LoggerService.getInstance().error('AI recommendation generation failed', { error });
        return createFallbackRecommendations(profile, nutritionalNeeds);
    }
}
function processAIRecommendations(aiResponse, profile, nutritionalNeeds) {
    const weeklyMealPlan = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        weekStarting: new Date().toISOString().split('T')[0],
        meals: Array.from({ length: 7 }, (_, i) => createDailyMealPlan(i, nutritionalNeeds, profile)),
        nutritionalSummary: createWeeklyNutritionalSummary(nutritionalNeeds),
        totalEstimatedCost: Math.round(Math.random() * 200 + 150),
        culturalAdaptations: profile.culturalAdaptations?.traditionalFoods?.slice(0, 3) || []
    };
    return {
        recommendations: {
            mealPlan: weeklyMealPlan,
            nutritionalAnalysis: createNutritionalAnalysis(nutritionalNeeds, profile),
            shoppingList: generateShoppingList(weeklyMealPlan)
        },
        aiInsights: {
            personalizedTips: [
                `Focus on ${profile.goals?.primary} with gradual dietary changes`,
                `Incorporate ${profile.culturalAdaptations?.culturalBackground} traditional foods for better adherence`,
                'Track progress weekly and adjust portions as needed'
            ],
            potentialChallenges: [
                'Initial adjustment period may cause temporary hunger',
                'Social eating situations may require planning ahead',
                'Seasonal ingredient availability might affect meal variety'
            ],
            motivationalMessages: [
                'Small consistent changes lead to lasting health improvements',
                'Your cultural food traditions can be part of a healthy lifestyle',
                'Every healthy choice is an investment in your future well-being'
            ]
        },
        actionPlan: {
            weeklyGoals: [
                'Plan and prep 3 meals in advance each week',
                'Track daily water intake and nutritional goals',
                'Incorporate 2 traditional healthy recipes per week'
            ],
            monthlyMilestones: [
                'Establish consistent meal timing and portion control',
                'Build a repertoire of 20 healthy go-to meals',
                'Achieve 80% adherence to nutritional targets'
            ]
        }
    };
}
function createDailyMealPlan(dayIndex, nutritionalNeeds, profile) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date();
    date.setDate(date.getDate() + dayIndex);
    const dailyCalories = nutritionalNeeds.calories.optimal;
    return {
        day: days[dayIndex],
        date: date.toISOString().split('T')[0],
        meals: {
            breakfast: createMealRecommendation('breakfast', dailyCalories * 0.25, profile),
            lunch: createMealRecommendation('lunch', dailyCalories * 0.35, profile),
            dinner: createMealRecommendation('dinner', dailyCalories * 0.30, profile),
            afternoonSnack: createMealRecommendation('snack', dailyCalories * 0.10, profile)
        },
        dailyNutrition: {
            calories: dailyCalories,
            macros: {
                protein: nutritionalNeeds.macronutrients.protein.grams,
                carbohydrates: nutritionalNeeds.macronutrients.carbohydrates.grams,
                fat: nutritionalNeeds.macronutrients.fat.grams
            },
            micronutrients: nutritionalNeeds.micronutrients,
            fiber: 25,
            sugar: 50,
            sodium: 2300
        },
        estimatedCost: Math.round(Math.random() * 25 + 15)
    };
}
function createMealRecommendation(mealType, targetCalories, profile) {
    const mealNames = {
        breakfast: ['Healthy Breakfast Bowl', 'Nutritious Morning Meal', 'Energy Start Plate'],
        lunch: ['Balanced Lunch Plate', 'Midday Nutrition Bowl', 'Power Lunch'],
        dinner: ['Evening Wellness Meal', 'Dinner Balance Plate', 'Restorative Dinner'],
        snack: ['Healthy Snack Mix', 'Energy Boost Snack', 'Nutritious Bite']
    };
    const mealName = mealNames[mealType]?.[Math.floor(Math.random() * mealNames[mealType].length)] || 'Healthy Meal';
    return {
        mealId: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: mealName,
        description: `A nutritionally balanced ${mealType} designed for ${profile.goals?.primary}`,
        ingredients: generateMockIngredients(mealType, targetCalories),
        nutritionalProfile: {
            calories: Math.round(targetCalories),
            macros: {
                protein: Math.round(targetCalories * 0.15 / 4),
                carbohydrates: Math.round(targetCalories * 0.55 / 4),
                fat: Math.round(targetCalories * 0.30 / 9)
            },
            micronutrients: {
                vitamins: { vitamin_c: 10, vitamin_d: 2 },
                minerals: { calcium: 100, iron: 3 }
            },
            fiber: Math.round(targetCalories / 100),
            sugar: Math.round(targetCalories * 0.1 / 4),
            sodium: Math.round(targetCalories * 0.5)
        },
        cookingInstructions: [
            'Prepare all ingredients according to quantities',
            'Follow cooking method appropriate for ingredients',
            'Season to taste and serve fresh'
        ],
        prepTime: 15,
        cookTime: 20,
        servings: 1,
        difficulty: 'medium',
        estimatedCost: Math.round(targetCalories / 100),
        healthBenefits: [
            'Provides sustained energy',
            'Supports nutritional goals',
            'Contains essential micronutrients'
        ],
        alternatives: ['Similar meal with different protein source', 'Vegetarian variant available']
    };
}
function generateMockIngredients(mealType, calories) {
    const baseIngredients = {
        breakfast: [
            { name: 'Oats', quantity: 50, unit: 'g', optional: false, substitutes: ['quinoa', 'millet'], estimatedCost: 0.50 },
            { name: 'Milk', quantity: 200, unit: 'ml', optional: false, substitutes: ['almond milk', 'soy milk'], estimatedCost: 0.75 },
            { name: 'Banana', quantity: 1, unit: 'medium', optional: false, substitutes: ['apple', 'berries'], estimatedCost: 0.25 }
        ],
        lunch: [
            { name: 'Brown rice', quantity: 75, unit: 'g', optional: false, substitutes: ['quinoa', 'bulgur'], estimatedCost: 1.00 },
            { name: 'Chicken breast', quantity: 100, unit: 'g', optional: false, substitutes: ['tofu', 'lentils'], estimatedCost: 2.50 },
            { name: 'Mixed vegetables', quantity: 150, unit: 'g', optional: false, substitutes: ['seasonal vegetables'], estimatedCost: 1.50 }
        ],
        dinner: [
            { name: 'Salmon fillet', quantity: 120, unit: 'g', optional: false, substitutes: ['cod', 'tofu'], estimatedCost: 4.00 },
            { name: 'Sweet potato', quantity: 150, unit: 'g', optional: false, substitutes: ['regular potato', 'quinoa'], estimatedCost: 0.75 },
            { name: 'Broccoli', quantity: 100, unit: 'g', optional: false, substitutes: ['cauliflower', 'green beans'], estimatedCost: 1.00 }
        ],
        snack: [
            { name: 'Greek yogurt', quantity: 150, unit: 'g', optional: false, substitutes: ['regular yogurt'], estimatedCost: 1.25 },
            { name: 'Mixed nuts', quantity: 20, unit: 'g', optional: false, substitutes: ['seeds'], estimatedCost: 0.75 }
        ]
    };
    return baseIngredients[mealType] || baseIngredients.snack;
}
function createNutritionalAnalysis(nutritionalNeeds, profile) {
    return {
        weeklyTotals: {
            calories: nutritionalNeeds.calories.optimal * 7,
            macros: {
                protein: nutritionalNeeds.macronutrients.protein.grams * 7,
                carbohydrates: nutritionalNeeds.macronutrients.carbohydrates.grams * 7,
                fat: nutritionalNeeds.macronutrients.fat.grams * 7
            },
            micronutrients: nutritionalNeeds.micronutrients,
            fiber: 175,
            sugar: 350,
            sodium: 16100
        },
        dailyAverages: {
            calories: nutritionalNeeds.calories.optimal,
            macros: {
                protein: nutritionalNeeds.macronutrients.protein.grams,
                carbohydrates: nutritionalNeeds.macronutrients.carbohydrates.grams,
                fat: nutritionalNeeds.macronutrients.fat.grams
            },
            micronutrients: nutritionalNeeds.micronutrients,
            fiber: 25,
            sugar: 50,
            sodium: 2300
        },
        complianceScore: 85,
        nutritionalGaps: ['Omega-3 fatty acids could be increased', 'Consider adding more fiber sources'],
        recommendations: [
            'Include fatty fish 2-3 times per week',
            'Add variety in vegetable colors for diverse micronutrients',
            'Monitor portion sizes to maintain caloric goals'
        ],
        healthConditionConsiderations: profile.healthConditions?.map((condition) => `${condition.condition}: Follow specific dietary guidelines for optimal management`) || []
    };
}
function createWeeklyNutritionalSummary(nutritionalNeeds) {
    return {
        totalCalories: nutritionalNeeds.calories.optimal * 7,
        macroDistribution: {
            protein: {
                grams: nutritionalNeeds.macronutrients.protein.grams * 7,
                percentage: nutritionalNeeds.macronutrients.protein.percentage
            },
            carbs: {
                grams: nutritionalNeeds.macronutrients.carbohydrates.grams * 7,
                percentage: nutritionalNeeds.macronutrients.carbohydrates.percentage
            },
            fat: {
                grams: nutritionalNeeds.macronutrients.fat.grams * 7,
                percentage: nutritionalNeeds.macronutrients.fat.percentage
            }
        },
        micronutrientHighlights: [
            'Rich in vitamin C for immune support',
            'Adequate calcium for bone health',
            'Sufficient iron for energy metabolism'
        ],
        healthScore: 8.5
    };
}
function generateShoppingList(mealPlan) {
    const ingredients = new Set();
    mealPlan.meals.forEach(day => {
        Object.values(day.meals).forEach(meal => {
            if (meal) {
                meal.ingredients.forEach(ingredient => {
                    ingredients.add(`${ingredient.name} (${ingredient.quantity} ${ingredient.unit})`);
                });
            }
        });
    });
    return Array.from(ingredients).sort();
}
function createFallbackRecommendations(profile, nutritionalNeeds) {
    const weeklyMealPlan = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        weekStarting: new Date().toISOString().split('T')[0],
        meals: Array.from({ length: 7 }, (_, i) => createDailyMealPlan(i, nutritionalNeeds, profile)),
        nutritionalSummary: createWeeklyNutritionalSummary(nutritionalNeeds),
        totalEstimatedCost: 175,
        culturalAdaptations: []
    };
    return {
        recommendations: {
            mealPlan: weeklyMealPlan,
            nutritionalAnalysis: createNutritionalAnalysis(nutritionalNeeds, profile),
            shoppingList: generateShoppingList(weeklyMealPlan)
        },
        aiInsights: {
            personalizedTips: [
                'Follow portion guidelines for sustainable results',
                'Stay hydrated throughout the day',
                'Include variety in your meal choices'
            ],
            potentialChallenges: [
                'Initial meal preparation time investment',
                'Adjusting to new eating patterns'
            ],
            motivationalMessages: [
                'Consistency leads to lasting health improvements',
                'Every healthy choice matters for your well-being'
            ]
        },
        actionPlan: {
            weeklyGoals: [
                'Follow meal plan 5 days per week',
                'Track progress daily'
            ],
            monthlyMilestones: [
                'Establish sustainable eating habits',
                'Achieve nutritional targets consistently'
            ]
        }
    };
}
async function storeRecommendationResult(userId, request, recommendations) {
    try {
        const recommendationId = `dietary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const command = new lib_dynamodb_1.PutCommand({
            TableName: process.env.RECOMMENDATIONS_TABLE || 'hasivu-dietary-recommendations',
            Item: {
                recommendationId,
                userId,
                timestamp: new Date().toISOString(),
                request,
                recommendations,
                status: 'active',
                version: '1.0',
                ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
            }
        });
        await dynamoDbClient.send(command);
    }
    catch (error) {
        logger_service_1.LoggerService.getInstance().warn('Failed to store recommendation result', { error, userId });
    }
}
const dietaryRecommendationHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Dietary recommendation request started', { requestId });
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        const requestBody = JSON.parse(event.body || '{}');
        const isChildRequest = requestBody.childId;
        let validatedRequest;
        if (isChildRequest) {
            validatedRequest = childProfileSchema.parse(requestBody);
        }
        else {
            validatedRequest = dietaryProfileSchema.parse(requestBody);
        }
        logger.info('Processing dietary recommendation', {
            requestId,
            userId: authenticatedUser.id,
            isChildRequest,
            primaryGoal: validatedRequest.goals?.primary || 'general_health'
        });
        let nutritionalNeeds;
        if (isChildRequest) {
            nutritionalNeeds = calculateChildNutritionalNeeds(validatedRequest);
        }
        else {
            nutritionalNeeds = {
                calories: { min: 1800, max: 2200, optimal: 2000 },
                macronutrients: {
                    protein: { grams: 150, percentage: 20 },
                    carbohydrates: { grams: 250, percentage: 50 },
                    fat: { grams: 67, percentage: 30 }
                },
                micronutrients: {
                    vitamins: { vitamin_c: 90, vitamin_d: 15 },
                    minerals: { calcium: 1000, iron: 18 }
                },
                hydration: { dailyTarget: 2500, timing: ['morning', 'throughout_day'] }
            };
        }
        const historicalData = await getHistoricalData(authenticatedUser.id);
        const recommendations = await generatePersonalizedRecommendations(validatedRequest, nutritionalNeeds, historicalData);
        await storeRecommendationResult(authenticatedUser.id, validatedRequest, recommendations);
        logger.info('Dietary recommendations generated successfully', {
            requestId,
            userId: authenticatedUser.id,
            mealPlanId: recommendations.recommendations.mealPlan.id,
            totalCost: recommendations.recommendations.mealPlan.totalEstimatedCost,
            healthScore: recommendations.recommendations.mealPlan.nutritionalSummary.healthScore
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Dietary recommendations generated successfully',
            data: {
                recommendations,
                nutritionalNeeds,
                profile: validatedRequest,
                metadata: {
                    requestId,
                    generatedAt: new Date().toISOString(),
                    version: '1.0',
                    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
                }
            }
        });
    }
    catch (error) {
        logger.error('Dietary recommendation generation failed', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        if (error.name === 'ZodError') {
            return (0, response_utils_1.createErrorResponse)('Invalid dietary profile data', 400, 'VALIDATION_ERROR');
        }
        return (0, response_utils_1.handleError)(error, 'Failed to generate dietary recommendations');
    }
};
exports.dietaryRecommendationHandler = dietaryRecommendationHandler;
exports.handler = exports.dietaryRecommendationHandler;
//# sourceMappingURL=dietary-recommendation-engine.js.map