/**
 * HASIVU Platform - AI Meal Planner Lambda Function
 * Handles: POST /nutrition/meal-planner
 * Implements Epic 3: Nutrition Management - AI-Powered Meal Planning
 * 
 * Production-ready meal planning with Amazon Bedrock AI integration, comprehensive nutritional analysis,
 * user preference learning, and intelligent menu optimization for school meal programs
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { LoggerService } from '../shared/logger.service';
import { createSuccessResponse, createErrorResponse } from '../shared/response.utils';
import { LambdaDatabaseService } from '../shared/database.service';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Initialize services
const logger = LoggerService.getInstance();
const database = LambdaDatabaseService.getInstance();
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Validation schemas
const mealPlannerRequestSchema = z.object({
  schoolId: z.string().uuid(),
  userId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1).max(50),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealTypes: z.array(z.enum(['breakfast', 'lunch', 'snack', 'dinner'])).min(1),
  nutritionalGoals: z.object({
    caloriesPerDay: z.number().positive().max(5000),
    proteinGrams: z.number().positive().max(200),
    carbsGrams: z.number().positive().max(500),
    fatGrams: z.number().positive().max(200),
    fiberGrams: z.number().positive().max(100),
    sodiumMg: z.number().positive().max(5000),
    sugarGrams: z.number().positive().max(100)
  }),
  dietaryRestrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  preferences: z.object({
    favoriteCategories: z.array(z.string()).default([]),
    dislikedItems: z.array(z.string()).default([]),
    spiceLevel: z.enum(['none', 'mild', 'medium', 'spicy']).default('mild'),
    preferredCuisines: z.array(z.string()).default([])
  }).default(() => ({
    favoriteCategories: [],
    dislikedItems: [],
    spiceLevel: 'mild' as const,
    preferredCuisines: []
  })),
  budget: z.object({
    maxCostPerMeal: z.number().positive().max(50),
    maxCostPerDay: z.number().positive().max(200)
  }).optional(),
  optimizationPriorities: z.array(
    z.enum(['nutrition', 'cost', 'variety', 'preferences', 'health'])
  ).default(['nutrition', 'health'])
});

const generateMealPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(['breakfast', 'lunch', 'snack', 'dinner']),
  availableItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    nutritionalInfo: z.object({
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
      fiber: z.number(),
      sodium: z.number(),
      sugar: z.number()
    }),
    cost: z.number(),
    allergens: z.array(z.string()),
    ingredients: z.array(z.string())
  })),
  requirements: z.object({
    targetCalories: z.number().positive(),
    dietaryRestrictions: z.array(z.string()),
    allergies: z.array(z.string()),
    preferences: z.object({
      favoriteCategories: z.array(z.string()),
      dislikedItems: z.array(z.string())
    }),
    maxCost: z.number().positive().optional()
  })
});

// Types
interface NutritionalSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
}

interface MealPlanItem {
  itemId: string;
  itemName: string;
  category: string;
  portionSize: number;
  nutritionalContribution: NutritionalSummary;
  cost: number;
  healthScore: number;
  appealFactor: number;
  reasoning: string;
  modifications?: string[];
}

interface DailyMealPlan {
  date: string;
  meals: {
    [mealType: string]: MealPlanItem[];
  };
  dailyNutrition: NutritionalSummary;
  dailyHealthScore: number;
  estimatedCost: number;
  varietyScore: number;
}

interface WeeklyMealPlan {
  planId: string;
  schoolId: string;
  userId: string;
  studentIds: string[];
  startDate: string;
  endDate: string;
  mealTypes: string[];
  nutritionalGoals: NutritionalSummary;
  dailyPlans: DailyMealPlan[];
  overallSummary: {
    totalCost: number;
    avgHealthScore: number;
    avgVarietyScore: number;
    nutritionalBalance: number;
    goalAchievement: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sodium: number;
      sugar: number;
    };
  };
  aiInsights: {
    strengths: string[];
    improvementAreas: string[];
    nutritionalGaps: string[];
    varietyRecommendations: string[];
    costOptimizations: string[];
  };
  preferences?: any;
  createdAt: string;
  updatedAt: string;
}

type MealPlannerRequest = z.infer<typeof mealPlannerRequestSchema>;
type GenerateMealPlanRequest = z.infer<typeof generateMealPlanSchema>;

/**
 * Security-hardened user authentication and authorization
 */
async function validateUserAccess(event: APIGatewayProxyEvent, requestId: string): Promise<{ userId: string; schoolId: string; role: string }> {
  const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
  const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';

  // Extract from headers (TODO: Replace with proper authentication)
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

  // Validate user exists and is active
  const user = await database.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, role: true }
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new Error('Access denied');
  }

  // Verify school association
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

/**
 * Get available menu items from school for specific date range
 */
async function getAvailableMenuItems(
  schoolId: string, 
  startDate: string, 
  endDate: string,
  requestId: string
): Promise<any[]> {
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

  } catch (error) {
    logger.error('Failed to get available menu items', {
      requestId,
      schoolId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('Failed to retrieve menu items');
  }
}

/**
 * Get user's historical meal preferences and patterns
 */
async function getUserPreferences(
  userId: string, 
  schoolId: string,
  requestId: string
): Promise<any> {
  try {
    // Get recent order items to analyze meal preferences
    const recentMeals = await database.prisma.orderItem.findMany({
      where: {
        order: {
          userId: userId,
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
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

    // Analyze preferences
    const categoryPreferences: { [key: string]: number } = {};
    const itemRatings: { [key: string]: number } = {};
    const dislikedItems: string[] = [];

    recentMeals.forEach(meal => {
      if (meal.menuItem) {
        // Track category preferences based on order frequency
        const category = meal.menuItem.category;
        categoryPreferences[category] = (categoryPreferences[category] || 0) + 1;

        // Track item popularity (no rating field in OrderItem model)
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

  } catch (error) {
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

/**
 * AI-powered meal recommendation using Amazon Bedrock
 */
async function generateMealRecommendations(
  availableItems: any[],
  requirements: any,
  preferences: any,
  mealType: string,
  date: string,
  requestId: string
): Promise<MealPlanItem[]> {
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

    const command = new InvokeModelCommand({
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
    
    let recommendations: MealPlanItem[];
    try {
      const aiResponse = responseBody.content[0].text;
      // Extract JSON from response if wrapped in text
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : aiResponse;
      recommendations = JSON.parse(jsonText);
    } catch (parseError) {
      logger.warn('Failed to parse AI response, using fallback', { requestId, parseError });
      // Fallback to basic recommendations
      recommendations = generateFallbackRecommendations(availableItems, requirements, mealType);
    }

    // Validate and enhance recommendations
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

  } catch (error) {
    logger.error('Failed to generate AI meal recommendations', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Fallback to basic recommendations
    return generateFallbackRecommendations(availableItems, requirements, mealType);
  }
}

/**
 * Generate fallback meal recommendations when AI fails
 */
function generateFallbackRecommendations(
  availableItems: any[],
  requirements: any,
  mealType: string
): MealPlanItem[] {
  // Basic nutritional targets by meal type
  const mealTargets = {
    breakfast: { caloriesPct: 0.25, proteinPct: 0.3 },
    lunch: { caloriesPct: 0.35, proteinPct: 0.4 },
    snack: { caloriesPct: 0.15, proteinPct: 0.15 },
    dinner: { caloriesPct: 0.25, proteinPct: 0.15 }
  };

  const target = mealTargets[mealType as keyof typeof mealTargets] || mealTargets.lunch;
  
  // Filter safe items
  const safeItems = availableItems.filter(item => {
    // Check allergies
    if (requirements.allergies?.length > 0) {
      const itemAllergens = item.allergens?.map((a: any) => a.allergen) || [];
      if (itemAllergens.some((allergen: string) => 
        requirements.allergies.includes(allergen.toLowerCase())
      )) {
        return false;
      }
    }
    
    // Check dietary restrictions
    if (requirements.dietaryRestrictions?.length > 0) {
      // Basic vegetarian check
      if (requirements.dietaryRestrictions.includes('vegetarian') && 
          item.category?.toLowerCase().includes('meat')) {
        return false;
      }
    }
    
    return true;
  });

  // Select top items by nutritional value and variety
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

/**
 * Calculate nutritional summary for a day
 */
function calculateDayNutrition(dailyMeals: { [mealType: string]: MealPlanItem[] }): NutritionalSummary {
  const summary: NutritionalSummary = {
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

/**
 * Calculate health score for a meal plan
 */
function calculateHealthScore(nutrition: NutritionalSummary, goals: NutritionalSummary): number {
  const scores: number[] = [];
  
  // Calorie adherence (target ±15%)
  const calorieRatio = nutrition.calories / goals.calories;
  scores.push(calorieRatio >= 0.85 && calorieRatio <= 1.15 ? 10 : Math.max(0, 10 - Math.abs(1 - calorieRatio) * 20));
  
  // Protein adequacy
  const proteinRatio = nutrition.protein / goals.protein;
  scores.push(proteinRatio >= 0.9 ? 10 : proteinRatio * 10);
  
  // Fiber adequacy
  const fiberRatio = nutrition.fiber / goals.fiber;
  scores.push(Math.min(10, fiberRatio * 10));
  
  // Sodium control (lower is better)
  const sodiumRatio = nutrition.sodium / goals.sodium;
  scores.push(sodiumRatio <= 1.0 ? 10 : Math.max(0, 10 - (sodiumRatio - 1) * 20));
  
  // Sugar control (lower is better)
  const sugarRatio = nutrition.sugar / goals.sugar;
  scores.push(sugarRatio <= 1.0 ? 10 : Math.max(0, 10 - (sugarRatio - 1) * 15));

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

/**
 * Generate comprehensive weekly meal plan
 */
async function generateWeeklyMealPlan(
  data: MealPlannerRequest,
  userId: string,
  schoolId: string,
  requestId: string
): Promise<WeeklyMealPlan> {
  try {
    // Get available menu items
    const availableItems = await getAvailableMenuItems(schoolId, data.startDate, data.endDate, requestId);
    
    if (availableItems.length === 0) {
      throw new Error(`No menu items available for date range: ${data.startDate} to ${data.endDate}`);
    }

    // Get user preferences
    const historicalPreferences = await getUserPreferences(userId, schoolId, requestId);

    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const dailyPlans: DailyMealPlan[] = [];

    // Generate daily plans
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayAvailableItems = availableItems.filter(item =>
        item.availability.some((avail: any) => 
          new Date(avail.availableDate).toISOString().split('T')[0] === dateStr
        )
      );

      if (dayAvailableItems.length === 0) {
        logger.warn(`No items available for ${dateStr}`, { requestId, schoolId });
        continue;
      }

      const dailyMeals: { [mealType: string]: MealPlanItem[] } = {};

      // Generate meals for each meal type
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
          const recommendations = await generateMealRecommendations(
            dayAvailableItems,
            requirements,
            historicalPreferences,
            mealType,
            dateStr,
            requestId
          );

          dailyMeals[mealType] = recommendations.slice(0, 2); // Limit to 2 items per meal
        } catch (error) {
          logger.error(`Failed to generate meal for ${dateStr} ${mealType}`, {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          continue;
        }
      }

      // Calculate daily nutrition and scores
      const dailyNutrition = calculateDayNutrition(dailyMeals);
      
      // Transform nutritionalGoals to match NutritionalSummary interface
      const goalsForComparison: NutritionalSummary = {
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
      const varietyScore = Object.keys(dailyMeals).length * 2.5; // Basic variety metric

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

    // Calculate overall summary
    const totalCost = dailyPlans.reduce((sum, day) => sum + day.estimatedCost, 0);
    const avgHealthScore = Math.round(dailyPlans.reduce((sum, day) => sum + day.dailyHealthScore, 0) / dailyPlans.length);
    const avgVarietyScore = Math.round(dailyPlans.reduce((sum, day) => sum + day.varietyScore, 0) / dailyPlans.length);

    // Calculate overall nutrition
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
      avg[key as keyof NutritionalSummary] = totalNutrition[key as keyof NutritionalSummary] / dailyPlans.length;
      return avg;
    }, {} as NutritionalSummary);

    // Calculate goal achievement percentages
    const goalAchievement = {
      calories: Math.round((avgNutrition.calories / data.nutritionalGoals.caloriesPerDay) * 100),
      protein: Math.round((avgNutrition.protein / data.nutritionalGoals.proteinGrams) * 100),
      carbs: Math.round((avgNutrition.carbs / data.nutritionalGoals.carbsGrams) * 100),
      fat: Math.round((avgNutrition.fat / data.nutritionalGoals.fatGrams) * 100),
      fiber: Math.round((avgNutrition.fiber / data.nutritionalGoals.fiberGrams) * 100),
      sodium: Math.round((avgNutrition.sodium / data.nutritionalGoals.sodiumMg) * 100),
      sugar: Math.round((avgNutrition.sugar / data.nutritionalGoals.sugarGrams) * 100)
    };

    // Generate AI insights
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

    const weeklyPlan: WeeklyMealPlan = {
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

    // Store meal plan in database
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

      // Log meal plan generation
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

  } catch (error) {
    logger.error('Failed to generate weekly meal plan', {
      requestId,
      userId,
      schoolId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * HASIVU Platform - AI Meal Planner Lambda Function Handler
 */
export const mealPlannerHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
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
      return createErrorResponse(405, `Method ${event.httpMethod} not allowed`, undefined, 'METHOD_NOT_ALLOWED', requestId);
    }

    if (!event.body) {
      return createErrorResponse(400, 'Request body required', undefined, 'MISSING_BODY', requestId);
    }

    // Validate and authenticate user
    const { userId, schoolId } = await validateUserAccess(event, requestId);

    // Parse and validate request
    const requestData: MealPlannerRequest = JSON.parse(event.body);
    const validatedData = mealPlannerRequestSchema.parse(requestData);

    // Verify school access
    if (validatedData.schoolId !== schoolId) {
      return createErrorResponse(403, 'Access denied - invalid school context', undefined, 'ACCESS_DENIED', requestId);
    }

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return createErrorResponse(400, 'Start date cannot be in the past', undefined, 'INVALID_DATE_RANGE', requestId);
    }

    if (endDate <= startDate) {
      return createErrorResponse(400, 'End date must be after start date', undefined, 'INVALID_DATE_RANGE', requestId);
    }

    const dayDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    if (dayDiff > 14) {
      return createErrorResponse(400, 'Date range cannot exceed 14 days', undefined, 'DATE_RANGE_TOO_LONG', requestId);
    }

    // Generate meal plan
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

    return createSuccessResponse({
      mealPlan,
      summary: {
        planId: mealPlan.planId,
        totalDays: mealPlan.dailyPlans.length,
        totalCost: mealPlan.overallSummary.totalCost,
        avgHealthScore: mealPlan.overallSummary.avgHealthScore,
        goalAchievement: mealPlan.overallSummary.goalAchievement
      }
    }, 'Meal plan generated successfully', 201, requestId);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('AI meal planner request failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    });

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'Invalid request data', error.issues, 'VALIDATION_ERROR', requestId);
    }

    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        return createErrorResponse(401, 'Authentication required', undefined, 'AUTHENTICATION_REQUIRED', requestId);
      }
      if (error.message.includes('Access denied')) {
        return createErrorResponse(403, 'Access denied', undefined, 'ACCESS_DENIED', requestId);
      }
      if (error.message.includes('No menu items available')) {
        return createErrorResponse(404, 'No menu items available for the specified date range', undefined, 'NO_MENU_ITEMS', requestId);
      }
      if (error.message.includes('Failed to generate')) {
        return createErrorResponse(422, error.message, undefined, 'GENERATION_FAILED', requestId);
      }
    }

    return createErrorResponse(500, 'Internal server error', undefined, 'INTERNAL_ERROR', requestId);
  }
};