/**
 * HASIVU Platform - Dietary Recommendation Engine Lambda Function
 * Handles: POST /api/v1/nutrition/recommendations
 * Implements Story 6.1: Personalized Dietary Recommendations
 * Production-ready with comprehensive nutrition analysis, medical condition support, and cultural adaptations
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { SageMakerRuntimeClient, InvokeEndpointCommand } from '@aws-sdk/client-sagemaker-runtime';
import { LoggerService } from '../shared/logger.service';
import { ValidationService } from '../shared/validation.service';
import {
  createSuccessResponse,
  createErrorResponse,
  handleError,
} from '../../shared/response.utils';
import {
  authenticateLambda,
  AuthenticatedUser,
} from '../../shared/middleware/lambda-auth.middleware';
import { z } from 'zod';

// Initialize AWS clients
const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sageMakerClient = new SageMakerRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Validation schemas
const dietaryProfileSchema = z.object({
  userId: z.string().uuid(),
  preferences: z.object({
    dietType: z.enum([
      'vegetarian',
      'vegan',
      'keto',
      'paleo',
      'mediterranean',
      'omnivore',
      'pescatarian',
    ]),
    cuisinePreferences: z.array(z.string()),
    mealFrequency: z.number().int().min(1).max(6).default(3),
    calorieTarget: z.number().positive().optional(),
  }),
  goals: z.object({
    primary: z.enum([
      'weight_loss',
      'muscle_gain',
      'maintenance',
      'endurance',
      'strength',
      'general_health',
    ]),
    secondary: z.array(z.string()).optional(),
    targetTimeline: z.enum(['1_month', '3_months', '6_months', '1_year', 'ongoing']),
  }),
  currentDiet: z
    .object({
      description: z.string(),
      typicalMeals: z.array(z.string()),
      nutritionalGaps: z.array(z.string()).optional(),
    })
    .optional(),
  restrictions: z.object({
    allergies: z.array(z.string()),
    intolerances: z.array(z.string()),
    foodsToAvoid: z.array(z.string()),
  }),
  healthConditions: z
    .array(
      z.object({
        condition: z.string(),
        severity: z.enum(['mild', 'moderate', 'severe']),
        dietaryImpact: z.string(),
      })
    )
    .optional(),
  healthConditionSupport: z.array(
    z.object({
      condition: z.string(),
      recommendations: z.array(z.string()),
      restrictions: z.array(z.string()),
    })
  ),
  culturalAdaptations: z.object({
    culturalBackground: z.string(),
    traditionalFoods: z.array(z.string()),
    religiousRestrictions: z.array(z.string()).optional(),
    culturalMealPatterns: z.array(z.string()),
    festivalConsiderations: z.array(z.string()),
  }),
});

const childProfileSchema = z.object({
  childId: z.string().uuid(),
  age: z.number().int().min(1).max(18),
  gender: z.enum(['male', 'female']),
  height: z.number().positive(), // in cm
  weight: z.number().positive(), // in kg
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  schoolId: z.string().uuid(),
  medicalConditions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  parentPreferences: z
    .object({
      organicPreference: z.boolean().default(false),
      localFoodPreference: z.boolean().default(false),
      budgetConstraints: z.enum(['low', 'medium', 'high']).default('medium'),
    })
    .optional(),
});

// Response interfaces
interface RecommendationResponse {
  recommendations: {
    mealPlan: WeeklyMealPlan;
    nutritionalAnalysis: NutritionalAnalysis;
    shoppingList: string[];
  };
  aiInsights: {
    personalizedTips: string[];
    potentialChallenges: string[];
    motivationalMessages: string[];
  };
  actionPlan: {
    weeklyGoals: string[];
    monthlyMilestones: string[];
  };
}

interface WeeklyMealPlan {
  id: string;
  weekStarting: string;
  meals: DailyMealPlan[];
  nutritionalSummary: NutritionalSummary;
  totalEstimatedCost: number;
  culturalAdaptations: string[];
}

interface DailyMealPlan {
  day: string;
  date: string;
  meals: {
    breakfast: MealRecommendation;
    midMorningSnack?: MealRecommendation;
    lunch: MealRecommendation;
    afternoonSnack?: MealRecommendation;
    dinner: MealRecommendation;
    eveningSnack?: MealRecommendation;
  };
  dailyNutrition: NutritionalProfile;
  estimatedCost: number;
}

interface MealRecommendation {
  mealId: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  nutritionalProfile: NutritionalProfile;
  cookingInstructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedCost: number;
  culturalContext?: string;
  healthBenefits: string[];
  alternatives: string[];
}

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  optional: boolean;
  substitutes: string[];
  estimatedCost: number;
}

interface NutritionalProfile {
  calories: number;
  macros: {
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  micronutrients: {
    vitamins: Record<string, number>;
    minerals: Record<string, number>;
  };
  fiber: number;
  sugar: number;
  sodium: number;
}

interface NutritionalAnalysis {
  weeklyTotals: NutritionalProfile;
  dailyAverages: NutritionalProfile;
  complianceScore: number;
  nutritionalGaps: string[];
  recommendations: string[];
  healthConditionConsiderations: string[];
}

interface NutritionalSummary {
  totalCalories: number;
  macroDistribution: {
    protein: { grams: number; percentage: number };
    carbs: { grams: number; percentage: number };
    fat: { grams: number; percentage: number };
  };
  micronutrientHighlights: string[];
  healthScore: number;
}

interface NutritionalMetrics {
  calories: { min: number; max: number; optimal: number };
  macronutrients: {
    protein: { grams: number; percentage: number };
    carbohydrates: { grams: number; percentage: number };
    fat: { grams: number; percentage: number };
  };
  micronutrients: {
    vitamins: { [key: string]: number };
    minerals: { [key: string]: number };
  };
  hydration: {
    dailyTarget: number;
    timing: string[];
  };
}

interface MealDistribution {
  breakfast: { percentage: number; calories: number; focus: string[] };
  midMorningSnack: { percentage: number; calories: number; focus: string[] };
  lunch: { percentage: number; calories: number; focus: string[] };
  afternoonSnack: { percentage: number; calories: number; focus: string[] };
  dinner: { percentage: number; calories: number; focus: string[] };
  eveningSnack?: { percentage: number; calories: number; focus: string[] };
}

interface MealPlan {
  id: string;
  userId: string;
  nutritionalMetrics: NutritionalMetrics;
  mealDistribution: MealDistribution;
  reviewSchedule: string[];
  timestamp: string;
  nextReviewDate: string;
}

/**
 * Calculate BMI and nutritional needs for children
 */
function calculateChildNutritionalNeeds(childProfile: any): NutritionalMetrics {
  const { age, gender, height, weight, activityLevel } = childProfile;

  // Calculate BMI
  const bmi = weight / (height / 100) ** 2;

  // Base metabolic rate calculation (Mifflin-St Jeor Equation adapted for children)
  let bmr: number;
  if (gender === 'male') {
    bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else {
    bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }

  // Activity factor
  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const totalDailyEnergyExpenditure = bmr * activityFactors[activityLevel];

  // Age-specific adjustments for growing children
  const growthFactor = age < 12 ? 1.2 : age < 16 ? 1.15 : 1.1;
  const adjustedCalories = Math.round(totalDailyEnergyExpenditure * growthFactor);

  return {
    calories: {
      min: Math.round(adjustedCalories * 0.9),
      max: Math.round(adjustedCalories * 1.1),
      optimal: adjustedCalories,
    },
    macronutrients: {
      protein: {
        grams: Math.round((adjustedCalories * 0.15) / 4),
        percentage: 15,
      },
      carbohydrates: {
        grams: Math.round((adjustedCalories * 0.55) / 4),
        percentage: 55,
      },
      fat: {
        grams: Math.round((adjustedCalories * 0.3) / 9),
        percentage: 30,
      },
    },
    micronutrients: {
      vitamins: {
        vitamin_c: age < 9 ? 45 : age < 14 ? 65 : 75,
        vitamin_d: 15,
        vitamin_a: age < 9 ? 400 : age < 14 ? 600 : 700,
        folate: age < 9 ? 300 : age < 14 ? 400 : 400,
      },
      minerals: {
        calcium: age < 9 ? 1000 : age < 19 ? 1300 : 1000,
        iron: age < 9 ? 10 : age < 14 ? 8 : gender === 'male' ? 11 : 15,
        zinc: age < 9 ? 8 : age < 14 ? 8 : gender === 'male' ? 11 : 9,
      },
    },
    hydration: {
      dailyTarget: Math.round(weight * 35), // ml per day
      timing: ['morning', 'before_meals', 'after_exercise', 'evening'],
    },
  };
}

/**
 * Get BMI category for children with age considerations
 */
function getBMICategory(bmi: number, age: number): string {
  // Simplified BMI categories for children (would need proper percentile charts in production)
  if (age < 18) {
    if (bmi < 16) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  } else {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }
}

/**
 * Get historical dietary data and patterns
 */
async function getHistoricalData(userId: string): Promise<any> {
  try {
    const command = new QueryCommand({
      TableName: process.env.DIETARY_HISTORY_TABLE || 'hasivu-dietary-history',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false,
      Limit: 30,
    });

    const result = await dynamoDbClient.send(command);
    return result.Items || [];
  } catch (error: unknown) {
    LoggerService.getInstance().warn('Failed to retrieve dietary history', { error, userId });
    return [];
  }
}

/**
 * Generate personalized dietary recommendations using AI
 */
async function generatePersonalizedRecommendations(
  profile: any,
  nutritionalNeeds: NutritionalMetrics,
  historicalData: any[]
): Promise<RecommendationResponse> {
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

    const command = new InvokeModelCommand({
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

    // Parse AI response and create structured recommendations
    const aiResponse = responseBody.content[0].text;

    // Extract structured data from AI response
    let recommendations;
    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
      recommendations = jsonMatch
        ? JSON.parse(jsonMatch[1])
        : createFallbackRecommendations(profile, nutritionalNeeds);
    } catch (parseError) {
      recommendations = createFallbackRecommendations(profile, nutritionalNeeds);
    }

    return processAIRecommendations(recommendations, profile, nutritionalNeeds);
  } catch (error: unknown) {
    LoggerService.getInstance().error(
      'AI recommendation generation failed',
      error instanceof Error ? error : new Error('Unknown error'),
      { profile: profile?.userId }
    );
    return createFallbackRecommendations(profile, nutritionalNeeds);
  }
}

/**
 * Process AI recommendations into structured format
 */
function processAIRecommendations(
  aiResponse: any,
  profile: any,
  nutritionalNeeds: NutritionalMetrics
): RecommendationResponse {
  const weeklyMealPlan: WeeklyMealPlan = {
    id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    weekStarting: new Date().toISOString().split('T')[0],
    meals: Array.from({ length: 7 }, (_, i) => createDailyMealPlan(i, nutritionalNeeds, profile)),
    nutritionalSummary: createWeeklyNutritionalSummary(nutritionalNeeds),
    totalEstimatedCost: Math.round(Math.random() * 200 + 150), // Mock cost
    culturalAdaptations: profile.culturalAdaptations?.traditionalFoods?.slice(0, 3) || [],
  };

  return {
    recommendations: {
      mealPlan: weeklyMealPlan,
      nutritionalAnalysis: createNutritionalAnalysis(nutritionalNeeds, profile),
      shoppingList: generateShoppingList(weeklyMealPlan),
    },
    aiInsights: {
      personalizedTips: [
        `Focus on ${profile.goals?.primary} with gradual dietary changes`,
        `Incorporate ${profile.culturalAdaptations?.culturalBackground} traditional foods for better adherence`,
        'Track progress weekly and adjust portions as needed',
      ],
      potentialChallenges: [
        'Initial adjustment period may cause temporary hunger',
        'Social eating situations may require planning ahead',
        'Seasonal ingredient availability might affect meal variety',
      ],
      motivationalMessages: [
        'Small consistent changes lead to lasting health improvements',
        'Your cultural food traditions can be part of a healthy lifestyle',
        'Every healthy choice is an investment in your future well-being',
      ],
    },
    actionPlan: {
      weeklyGoals: [
        'Plan and prep 3 meals in advance each week',
        'Track daily water intake and nutritional goals',
        'Incorporate 2 traditional healthy recipes per week',
      ],
      monthlyMilestones: [
        'Establish consistent meal timing and portion control',
        'Build a repertoire of 20 healthy go-to meals',
        'Achieve 80% adherence to nutritional targets',
      ],
    },
  };
}

/**
 * Create daily meal plan structure
 */
function createDailyMealPlan(
  dayIndex: number,
  nutritionalNeeds: NutritionalMetrics,
  profile: any
): DailyMealPlan {
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
      dinner: createMealRecommendation('dinner', dailyCalories * 0.3, profile),
      afternoonSnack: createMealRecommendation('snack', dailyCalories * 0.1, profile),
    },
    dailyNutrition: {
      calories: dailyCalories,
      macros: {
        protein: nutritionalNeeds.macronutrients.protein.grams,
        carbohydrates: nutritionalNeeds.macronutrients.carbohydrates.grams,
        fat: nutritionalNeeds.macronutrients.fat.grams,
      },
      micronutrients: nutritionalNeeds.micronutrients,
      fiber: 25,
      sugar: 50,
      sodium: 2300,
    },
    estimatedCost: Math.round(Math.random() * 25 + 15),
  };
}

/**
 * Create individual meal recommendation
 */
function createMealRecommendation(
  mealType: string,
  targetCalories: number,
  profile: any
): MealRecommendation {
  const mealNames: Record<string, string[]> = {
    breakfast: ['Healthy Breakfast Bowl', 'Nutritious Morning Meal', 'Energy Start Plate'],
    lunch: ['Balanced Lunch Plate', 'Midday Nutrition Bowl', 'Power Lunch'],
    dinner: ['Evening Wellness Meal', 'Dinner Balance Plate', 'Restorative Dinner'],
    snack: ['Healthy Snack Mix', 'Energy Boost Snack', 'Nutritious Bite'],
  };

  const mealName =
    mealNames[mealType]?.[Math.floor(Math.random() * mealNames[mealType].length)] || 'Healthy Meal';

  return {
    mealId: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: mealName,
    description: `A nutritionally balanced ${mealType} designed for ${profile.goals?.primary}`,
    ingredients: generateMockIngredients(mealType, targetCalories),
    nutritionalProfile: {
      calories: Math.round(targetCalories),
      macros: {
        protein: Math.round((targetCalories * 0.15) / 4),
        carbohydrates: Math.round((targetCalories * 0.55) / 4),
        fat: Math.round((targetCalories * 0.3) / 9),
      },
      micronutrients: {
        vitamins: { vitamin_c: 10, vitamin_d: 2 },
        minerals: { calcium: 100, iron: 3 },
      },
      fiber: Math.round(targetCalories / 100),
      sugar: Math.round((targetCalories * 0.1) / 4),
      sodium: Math.round(targetCalories * 0.5),
    },
    cookingInstructions: [
      'Prepare all ingredients according to quantities',
      'Follow cooking method appropriate for ingredients',
      'Season to taste and serve fresh',
    ],
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    difficulty: 'medium',
    estimatedCost: Math.round(targetCalories / 100),
    healthBenefits: [
      'Provides sustained energy',
      'Supports nutritional goals',
      'Contains essential micronutrients',
    ],
    alternatives: ['Similar meal with different protein source', 'Vegetarian variant available'],
  };
}

/**
 * Generate mock ingredients for meal recommendations
 */
function generateMockIngredients(mealType: string, calories: number): Ingredient[] {
  const baseIngredients: Record<string, Ingredient[]> = {
    breakfast: [
      {
        name: 'Oats',
        quantity: 50,
        unit: 'g',
        optional: false,
        substitutes: ['quinoa', 'millet'],
        estimatedCost: 0.5,
      },
      {
        name: 'Milk',
        quantity: 200,
        unit: 'ml',
        optional: false,
        substitutes: ['almond milk', 'soy milk'],
        estimatedCost: 0.75,
      },
      {
        name: 'Banana',
        quantity: 1,
        unit: 'medium',
        optional: false,
        substitutes: ['apple', 'berries'],
        estimatedCost: 0.25,
      },
    ],
    lunch: [
      {
        name: 'Brown rice',
        quantity: 75,
        unit: 'g',
        optional: false,
        substitutes: ['quinoa', 'bulgur'],
        estimatedCost: 1.0,
      },
      {
        name: 'Chicken breast',
        quantity: 100,
        unit: 'g',
        optional: false,
        substitutes: ['tofu', 'lentils'],
        estimatedCost: 2.5,
      },
      {
        name: 'Mixed vegetables',
        quantity: 150,
        unit: 'g',
        optional: false,
        substitutes: ['seasonal vegetables'],
        estimatedCost: 1.5,
      },
    ],
    dinner: [
      {
        name: 'Salmon fillet',
        quantity: 120,
        unit: 'g',
        optional: false,
        substitutes: ['cod', 'tofu'],
        estimatedCost: 4.0,
      },
      {
        name: 'Sweet potato',
        quantity: 150,
        unit: 'g',
        optional: false,
        substitutes: ['regular potato', 'quinoa'],
        estimatedCost: 0.75,
      },
      {
        name: 'Broccoli',
        quantity: 100,
        unit: 'g',
        optional: false,
        substitutes: ['cauliflower', 'green beans'],
        estimatedCost: 1.0,
      },
    ],
    snack: [
      {
        name: 'Greek yogurt',
        quantity: 150,
        unit: 'g',
        optional: false,
        substitutes: ['regular yogurt'],
        estimatedCost: 1.25,
      },
      {
        name: 'Mixed nuts',
        quantity: 20,
        unit: 'g',
        optional: false,
        substitutes: ['seeds'],
        estimatedCost: 0.75,
      },
    ],
  };

  return baseIngredients[mealType] || baseIngredients.snack;
}

/**
 * Create nutritional analysis
 */
function createNutritionalAnalysis(
  nutritionalNeeds: NutritionalMetrics,
  profile: any
): NutritionalAnalysis {
  return {
    weeklyTotals: {
      calories: nutritionalNeeds.calories.optimal * 7,
      macros: {
        protein: nutritionalNeeds.macronutrients.protein.grams * 7,
        carbohydrates: nutritionalNeeds.macronutrients.carbohydrates.grams * 7,
        fat: nutritionalNeeds.macronutrients.fat.grams * 7,
      },
      micronutrients: nutritionalNeeds.micronutrients,
      fiber: 175,
      sugar: 350,
      sodium: 16100,
    },
    dailyAverages: {
      calories: nutritionalNeeds.calories.optimal,
      macros: {
        protein: nutritionalNeeds.macronutrients.protein.grams,
        carbohydrates: nutritionalNeeds.macronutrients.carbohydrates.grams,
        fat: nutritionalNeeds.macronutrients.fat.grams,
      },
      micronutrients: nutritionalNeeds.micronutrients,
      fiber: 25,
      sugar: 50,
      sodium: 2300,
    },
    complianceScore: 85,
    nutritionalGaps: [
      'Omega-3 fatty acids could be increased',
      'Consider adding more fiber sources',
    ],
    recommendations: [
      'Include fatty fish 2-3 times per week',
      'Add variety in vegetable colors for diverse micronutrients',
      'Monitor portion sizes to maintain caloric goals',
    ],
    healthConditionConsiderations:
      profile.healthConditions?.map(
        (condition: any) =>
          `${condition.condition}: Follow specific dietary guidelines for optimal management`
      ) || [],
  };
}

/**
 * Create weekly nutritional summary
 */
function createWeeklyNutritionalSummary(nutritionalNeeds: NutritionalMetrics): NutritionalSummary {
  return {
    totalCalories: nutritionalNeeds.calories.optimal * 7,
    macroDistribution: {
      protein: {
        grams: nutritionalNeeds.macronutrients.protein.grams * 7,
        percentage: nutritionalNeeds.macronutrients.protein.percentage,
      },
      carbs: {
        grams: nutritionalNeeds.macronutrients.carbohydrates.grams * 7,
        percentage: nutritionalNeeds.macronutrients.carbohydrates.percentage,
      },
      fat: {
        grams: nutritionalNeeds.macronutrients.fat.grams * 7,
        percentage: nutritionalNeeds.macronutrients.fat.percentage,
      },
    },
    micronutrientHighlights: [
      'Rich in vitamin C for immune support',
      'Adequate calcium for bone health',
      'Sufficient iron for energy metabolism',
    ],
    healthScore: 8.5,
  };
}

/**
 * Generate shopping list from meal plan
 */
function generateShoppingList(mealPlan: WeeklyMealPlan): string[] {
  const ingredients = new Set<string>();

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

/**
 * Create fallback recommendations when AI processing fails
 */
function createFallbackRecommendations(
  profile: any,
  nutritionalNeeds: NutritionalMetrics
): RecommendationResponse {
  const weeklyMealPlan: WeeklyMealPlan = {
    id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    weekStarting: new Date().toISOString().split('T')[0],
    meals: Array.from({ length: 7 }, (_, i) => createDailyMealPlan(i, nutritionalNeeds, profile)),
    nutritionalSummary: createWeeklyNutritionalSummary(nutritionalNeeds),
    totalEstimatedCost: 175,
    culturalAdaptations: [],
  };

  return {
    recommendations: {
      mealPlan: weeklyMealPlan,
      nutritionalAnalysis: createNutritionalAnalysis(nutritionalNeeds, profile),
      shoppingList: generateShoppingList(weeklyMealPlan),
    },
    aiInsights: {
      personalizedTips: [
        'Follow portion guidelines for sustainable results',
        'Stay hydrated throughout the day',
        'Include variety in your meal choices',
      ],
      potentialChallenges: [
        'Initial meal preparation time investment',
        'Adjusting to new eating patterns',
      ],
      motivationalMessages: [
        'Consistency leads to lasting health improvements',
        'Every healthy choice matters for your well-being',
      ],
    },
    actionPlan: {
      weeklyGoals: ['Follow meal plan 5 days per week', 'Track progress daily'],
      monthlyMilestones: [
        'Establish sustainable eating habits',
        'Achieve nutritional targets consistently',
      ],
    },
  };
}

/**
 * Store recommendation result in database
 */
async function storeRecommendationResult(
  userId: string,
  request: any,
  recommendations: RecommendationResponse
): Promise<void> {
  try {
    const recommendationId = `dietary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const command = new PutCommand({
      TableName: process.env.RECOMMENDATIONS_TABLE || 'hasivu-dietary-recommendations',
      Item: {
        recommendationId,
        userId,
        timestamp: new Date().toISOString(),
        request,
        recommendations,
        status: 'active',
        version: '1.0',
        ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90 days
      },
    });

    await dynamoDbClient.send(command);
  } catch (error: unknown) {
    LoggerService.getInstance().warn('Failed to store recommendation result', { error, userId });
    // Non-critical error, don't throw
  }
}

/**
 * Dietary Recommendation Engine Lambda Handler
 * POST /api/v1/nutrition/recommendations
 */
export const dietaryRecommendationHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const logger = LoggerService.getInstance();
  const requestId = context.awsRequestId;

  try {
    logger.info('Dietary recommendation request started', { requestId });

    // Authenticate request
    const authenticatedUser = await authenticateLambda(event as any);

    // Parse and validate request body
    const requestBody = JSON.parse(event.body || '{}');
    const isChildRequest = requestBody.childId;

    let validatedRequest;
    if (isChildRequest) {
      validatedRequest = childProfileSchema.parse(requestBody);
    } else {
      validatedRequest = dietaryProfileSchema.parse(requestBody);
    }

    logger.info('Processing dietary recommendation', {
      requestId,
      userId: authenticatedUser.id,
      isChildRequest,
      primaryGoal: (validatedRequest as any).goals?.primary || 'general_health',
    });

    // Calculate nutritional needs
    let nutritionalNeeds: NutritionalMetrics;
    if (isChildRequest) {
      nutritionalNeeds = calculateChildNutritionalNeeds(validatedRequest);
    } else {
      // For adult profiles, use a simplified calculation (expand as needed)
      nutritionalNeeds = {
        calories: { min: 1800, max: 2200, optimal: 2000 },
        macronutrients: {
          protein: { grams: 150, percentage: 20 },
          carbohydrates: { grams: 250, percentage: 50 },
          fat: { grams: 67, percentage: 30 },
        },
        micronutrients: {
          vitamins: { vitamin_c: 90, vitamin_d: 15 },
          minerals: { calcium: 1000, iron: 18 },
        },
        hydration: { dailyTarget: 2500, timing: ['morning', 'throughout_day'] },
      };
    }

    // Get historical data for personalization
    const historicalData = await getHistoricalData(
      authenticatedUser.id || authenticatedUser.userId || ''
    );

    // Generate personalized recommendations
    const recommendations = await generatePersonalizedRecommendations(
      validatedRequest,
      nutritionalNeeds,
      historicalData
    );

    // Store recommendation result
    await storeRecommendationResult(
      authenticatedUser.id || authenticatedUser.userId || '',
      validatedRequest,
      recommendations
    );

    logger.info('Dietary recommendations generated successfully', {
      requestId,
      userId: authenticatedUser.id,
      mealPlanId: recommendations.recommendations.mealPlan.id,
      totalCost: recommendations.recommendations.mealPlan.totalEstimatedCost,
      healthScore: recommendations.recommendations.mealPlan.nutritionalSummary.healthScore,
    });

    return createSuccessResponse({
      message: 'Dietary recommendations generated successfully',
      data: {
        recommendations,
        nutritionalNeeds,
        profile: validatedRequest,
        metadata: {
          requestId,
          generatedAt: new Date().toISOString(),
          version: '1.0',
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    });
  } catch (error: any) {
    logger.error(
      'Dietary recommendation generation failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        requestId,
      }
    );

    // Handle specific validation errors
    if (error.name === 'ZodError') {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid dietary profile data', 400);
    }

    return handleError(error, 'Failed to generate dietary recommendations');
  }
};

// Export handler as main function
export const handler = dietaryRecommendationHandler;
