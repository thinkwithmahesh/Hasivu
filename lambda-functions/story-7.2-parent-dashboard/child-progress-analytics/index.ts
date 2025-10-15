/**
 * Epic 7.2: Advanced Parent Dashboard & Insights Portal
 * Lambda Function: child-progress-analytics
 *
 * Student nutrition and engagement analytics service
 * Provides comprehensive analysis of child's nutrition intake,
 * meal preferences, dietary adherence, and engagement with school meals
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import AWS from 'aws-sdk';
import { z } from 'zod';

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const timestream = new AWS.TimestreamQuery();
const cloudwatch = new AWS.CloudWatch();
const s3 = new AWS.S3();

// Analytics configuration
const ANALYTICS_CONFIG = {
  nutrition: {
    daily_calorie_targets: {
      toddler: { min: 1000, max: 1400 },
      preschooler: { min: 1400, max: 2000 },
      school_age: { min: 1800, max: 2400 },
      adolescent: { min: 2200, max: 3200 },
    },
    nutrient_targets: {
      protein: { min: 10, max: 35 }, // % of calories
      carbs: { min: 45, max: 65 }, // % of calories
      fats: { min: 20, max: 35 }, // % of calories
      fiber: { min: 14, max: 31 }, // grams per 1000 calories
      sodium: { max: 2300 }, // mg per day
      sugar: { max: 25 }, // % of calories
    },
    food_groups: {
      vegetables: { servings_per_day: 3 },
      fruits: { servings_per_day: 2 },
      grains: { servings_per_day: 6 },
      protein: { servings_per_day: 3 },
      dairy: { servings_per_day: 3 },
    },
  },
  engagement: {
    metrics: {
      meal_completion_rate: { excellent: 0.9, good: 0.7, needs_improvement: 0.5 },
      food_variety_score: { excellent: 0.8, good: 0.6, needs_improvement: 0.4 },
      preference_alignment: { excellent: 0.85, good: 0.7, needs_improvement: 0.5 },
      social_eating_participation: { excellent: 0.9, good: 0.7, needs_improvement: 0.5 },
    },
    scoring_weights: {
      completion: 0.3,
      variety: 0.25,
      preference: 0.25,
      social: 0.2,
    },
  },
  timeframes: {
    daily: 1,
    weekly: 7,
    monthly: 30,
    quarterly: 90,
    yearly: 365,
  },
} as const;

// Input validation schemas
const ProgressRequestSchema = z.object({
  action: z.enum([
    'get_progress_data',
    'get_nutrition_analytics',
    'get_engagement_metrics',
    'generate_report',
  ]),
  userId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).optional(),
  dateRange: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    })
    .optional(),
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  metrics: z
    .object({
      includeNutrition: z.boolean().optional(),
      includeEngagement: z.boolean().optional(),
      includeComparisons: z.boolean().optional(),
      includeRecommendations: z.boolean().optional(),
      includeTrends: z.boolean().optional(),
    })
    .optional(),
  filters: z
    .object({
      mealTypes: z.array(z.string()).optional(),
      foodCategories: z.array(z.string()).optional(),
      allergenFilters: z.array(z.string()).optional(),
      dietaryRestrictions: z.array(z.string()).optional(),
    })
    .optional(),
});

type ProgressRequest = z.infer<typeof ProgressRequestSchema>;

// Response interfaces
interface ProgressAnalyticsResponse {
  userId: string;
  studentId: string;
  reportPeriod: {
    start: string;
    end: string;
    timeframe: string;
  };
  nutritionAnalytics: NutritionAnalytics;
  engagementMetrics: EngagementMetrics;
  progressIndicators: ProgressIndicator[];
  comparisons: ComparisonData;
  trends: TrendData[];
  recommendations: ProgressRecommendation[];
  alerts: ProgressAlert[];
  summary: ProgressSummary;
  metadata: {
    dataPoints: number;
    completeness: number;
    lastUpdated: string;
    analysisVersion: string;
  };
}

interface NutritionAnalytics {
  dailyAverages: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fats: number;
    fiber: number;
    sodium: number;
    sugar: number;
    vitamins: Record<string, number>;
    minerals: Record<string, number>;
  };
  targetAdherence: {
    calories: {
      target: number;
      actual: number;
      adherence: number;
      status: 'on_track' | 'under' | 'over';
    };
    macronutrients: {
      protein: { target: number; actual: number; adherence: number };
      carbs: { target: number; actual: number; adherence: number };
      fats: { target: number; actual: number; adherence: number };
    };
    micronutrients: Record<
      string,
      {
        target: number;
        actual: number;
        adherence: number;
        status: 'sufficient' | 'deficient' | 'excess';
      }
    >;
  };
  foodGroupAnalysis: {
    vegetables: { target: number; actual: number; variety_score: number };
    fruits: { target: number; actual: number; variety_score: number };
    grains: { target: number; actual: number; whole_grain_ratio: number };
    protein: { target: number; actual: number; source_variety: number };
    dairy: { target: number; actual: number; calcium_content: number };
  };
  mealPatterns: {
    breakfast: { frequency: number; avg_calories: number; skip_rate: number };
    lunch: { frequency: number; avg_calories: number; completion_rate: number };
    snacks: { frequency: number; avg_calories: number; healthy_ratio: number };
    dinner: { frequency: number; avg_calories: number; family_meal_rate: number };
  };
  nutritionScore: {
    overall: number;
    categories: {
      balance: number;
      variety: number;
      moderation: number;
      adequacy: number;
    };
    trending: 'improving' | 'stable' | 'declining';
  };
}

interface EngagementMetrics {
  mealEngagement: {
    completion_rate: number;
    average_time_spent: number;
    portion_consumed: number;
    food_waste: number;
  };
  foodPreferences: {
    liked_foods: Array<{
      food: string;
      preference_score: number;
      frequency: number;
    }>;
    disliked_foods: Array<{
      food: string;
      avoidance_rate: number;
      reasons: string[];
    }>;
    new_foods_tried: number;
    adventurous_eating_score: number;
  };
  socialAspects: {
    peer_influence_score: number;
    group_meal_participation: number;
    sharing_behavior: number;
    mealtime_social_interaction: number;
  };
  behavioralIndicators: {
    meal_enthusiasm: number;
    texture_preferences: Record<string, number>;
    flavor_preferences: Record<string, number>;
    eating_speed: 'fast' | 'normal' | 'slow';
    attention_during_meals: number;
  };
  engagementTrends: {
    weekly_pattern: Array<{
      day: string;
      engagement_score: number;
    }>;
    seasonal_variations: Array<{
      season: string;
      avg_engagement: number;
    }>;
  };
}

interface ProgressIndicator {
  metric: string;
  current_value: number;
  target_value: number;
  progress_percentage: number;
  trend: 'improving' | 'stable' | 'declining';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'nutrition' | 'engagement' | 'development' | 'behavior';
  description: string;
  actionable: boolean;
}

interface ComparisonData {
  peer_comparison: {
    percentile: number;
    category: 'excellent' | 'above_average' | 'average' | 'below_average' | 'needs_attention';
    metrics: Record<
      string,
      {
        student_value: number;
        peer_average: number;
        percentile: number;
      }
    >;
  };
  historical_comparison: {
    vs_last_month: Record<
      string,
      {
        change: number;
        trend: 'improving' | 'stable' | 'declining';
      }
    >;
    vs_last_quarter: Record<
      string,
      {
        change: number;
        trend: 'improving' | 'stable' | 'declining';
      }
    >;
  };
  family_comparison: {
    siblings: Array<{
      sibling_id: string;
      comparative_metrics: Record<string, number>;
    }>;
  };
}

interface TrendData {
  metric: string;
  timeframe: string;
  data_points: Array<{
    date: string;
    value: number;
  }>;
  trend_direction: 'upward' | 'downward' | 'stable' | 'fluctuating';
  correlation_factors: Array<{
    factor: string;
    correlation_strength: number;
  }>;
  seasonal_patterns: boolean;
  prediction: {
    next_period_value: number;
    confidence: number;
  };
}

interface ProgressRecommendation {
  id: string;
  category: 'nutrition' | 'engagement' | 'behavior' | 'development';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  action_items: string[];
  expected_outcome: string;
  implementation_timeframe: string;
  success_metrics: string[];
  related_insights: string[];
}

interface ProgressAlert {
  id: string;
  type: 'info' | 'warning' | 'concern' | 'achievement';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  triggered_by: string;
  threshold_value: number;
  current_value: number;
  action_required: boolean;
  auto_resolve: boolean;
  expiry_date?: string;
}

interface ProgressSummary {
  overall_score: number;
  key_achievements: string[];
  areas_for_improvement: string[];
  weekly_highlights: {
    best_day: string;
    improvement_area: string;
    consistency_score: number;
  };
  parent_focus_areas: string[];
  next_milestones: Array<{
    milestone: string;
    target_date: string;
    progress: number;
  }>;
}

/**
 * Main Lambda handler for child progress analytics
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = context.awsRequestId;

  try {
    // Parse and validate request
    const requestBody = JSON.parse(event.body || '{}');
    const request = ProgressRequestSchema.parse(requestBody);
    const userId = event.requestContext?.authorizer?.user_id || request.userId;

    // Route to appropriate handler
    let result: ProgressAnalyticsResponse | ProgressAnalyticsResponse[];
    switch (request.action) {
      case 'get_progress_data':
        result = await getProgressData(userId, request);
        break;
      case 'get_nutrition_analytics':
        result = await getNutritionAnalytics(userId, request);
        break;
      case 'get_engagement_metrics':
        result = await getEngagementMetrics(userId, request);
        break;
      case 'generate_report':
        result = await generateProgressReport(userId, request);
        break;
      default:
        throw new Error(`Unsupported action: ${request.action}`);
    }

    // Log analytics generation
    await logAnalyticsGeneration(requestId, {
      userId,
      action: request.action,
      studentCount: Array.isArray(result) ? result.length : 1,
      processingTime: Date.now() - startTime,
    });

    return createResponse(200, {
      success: true,
      data: result,
      metadata: {
        requestId,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Progress analytics error:', error);

    await logError(requestId, error, {
      userId: requestBody?.userId,
      action: requestBody?.action,
    });

    return createResponse(error.statusCode || 500, {
      success: false,
      error: {
        code: error.code || 'PROGRESS_ANALYTICS_ERROR',
        message: error.message || 'Internal server error',
        requestId,
      },
    });
  }
};

/**
 * Get comprehensive progress data for students
 */
async function getProgressData(
  userId: string,
  request: ProgressRequest
): Promise<ProgressAnalyticsResponse | ProgressAnalyticsResponse[]> {
  const dateRange = request.dateRange || getDefaultDateRange(request.timeframe || 'monthly');
  const students = await getStudentsForParent(userId, request.studentIds);

  if (students.length === 0) {
    throw new Error('No students found for this parent');
  }

  // Process each student
  const results = await Promise.all(
    students.map(student => generateProgressAnalytics(student, dateRange, request))
  );

  return students.length === 1 ? results[0] : results;
}

/**
 * Get nutrition analytics for students
 */
async function getNutritionAnalytics(
  userId: string,
  request: ProgressRequest
): Promise<ProgressAnalyticsResponse | ProgressAnalyticsResponse[]> {
  const enhancedRequest = {
    ...request,
    metrics: {
      ...request.metrics,
      includeNutrition: true,
      includeEngagement: false,
    },
  };

  return getProgressData(userId, enhancedRequest);
}

/**
 * Get engagement metrics for students
 */
async function getEngagementMetrics(
  userId: string,
  request: ProgressRequest
): Promise<ProgressAnalyticsResponse | ProgressAnalyticsResponse[]> {
  const enhancedRequest = {
    ...request,
    metrics: {
      ...request.metrics,
      includeNutrition: false,
      includeEngagement: true,
    },
  };

  return getProgressData(userId, enhancedRequest);
}

/**
 * Generate comprehensive progress report
 */
async function generateProgressReport(
  userId: string,
  request: ProgressRequest
): Promise<ProgressAnalyticsResponse | ProgressAnalyticsResponse[]> {
  const enhancedRequest = {
    ...request,
    metrics: {
      includeNutrition: true,
      includeEngagement: true,
      includeComparisons: true,
      includeRecommendations: true,
      includeTrends: true,
    },
  };

  return getProgressData(userId, enhancedRequest);
}

/**
 * Generate analytics for a single student
 */
async function generateProgressAnalytics(
  student: any,
  dateRange: any,
  request: ProgressRequest
): Promise<ProgressAnalyticsResponse> {
  const studentId = student.id;

  // Collect all necessary data in parallel
  const [mealData, nutritionData, engagementData, orderData, preferencesData] = await Promise.all([
    getMealData(studentId, dateRange),
    getNutritionData(studentId, dateRange),
    getEngagementData(studentId, dateRange),
    getOrderData(studentId, dateRange),
    getStudentPreferences(studentId),
  ]);

  // Generate analytics components
  const nutritionAnalytics =
    request.metrics?.includeNutrition !== false
      ? await generateNutritionAnalytics(mealData, nutritionData, student)
      : getEmptyNutritionAnalytics();

  const engagementMetrics =
    request.metrics?.includeEngagement !== false
      ? await generateEngagementAnalytics(engagementData, orderData, preferencesData, student)
      : getEmptyEngagementMetrics();

  const progressIndicators = await generateProgressIndicators(
    nutritionAnalytics,
    engagementMetrics,
    student
  );

  const comparisons = request.metrics?.includeComparisons
    ? await generateComparisons(studentId, nutritionAnalytics, engagementMetrics, dateRange)
    : getEmptyComparisons();

  const trends = request.metrics?.includeTrends ? await generateTrends(studentId, dateRange) : [];

  const recommendations = request.metrics?.includeRecommendations
    ? await generateRecommendations(nutritionAnalytics, engagementMetrics, progressIndicators)
    : [];

  const alerts = await generateAlerts(progressIndicators, nutritionAnalytics, engagementMetrics);

  const summary = await generateSummary(
    nutritionAnalytics,
    engagementMetrics,
    progressIndicators,
    trends
  );

  return {
    userId: request.userId,
    studentId,
    reportPeriod: {
      start: dateRange.start,
      end: dateRange.end,
      timeframe: request.timeframe || 'monthly',
    },
    nutritionAnalytics,
    engagementMetrics,
    progressIndicators,
    comparisons,
    trends,
    recommendations,
    alerts,
    summary,
    metadata: {
      dataPoints: mealData.length + nutritionData.length + engagementData.length,
      completeness: calculateDataCompleteness(mealData, nutritionData, engagementData, dateRange),
      lastUpdated: new Date().toISOString(),
      analysisVersion: '2.1.0',
    },
  };
}

/**
 * Generate nutrition analytics
 */
async function generateNutritionAnalytics(
  mealData: any[],
  nutritionData: any[],
  student: any
): Promise<NutritionAnalytics> {
  const ageGroup = getAgeGroup(student.dateOfBirth);
  const targets = ANALYTICS_CONFIG.nutrition.daily_calorie_targets[ageGroup];

  // Calculate daily averages
  const dailyAverages = calculateDailyNutritionAverages(nutritionData);

  // Calculate target adherence
  const targetAdherence = calculateTargetAdherence(dailyAverages, targets, ageGroup);

  // Analyze food groups
  const foodGroupAnalysis = analyzeFoodGroups(mealData);

  // Analyze meal patterns
  const mealPatterns = analyzeMealPatterns(mealData);

  // Calculate overall nutrition score
  const nutritionScore = calculateNutritionScore(targetAdherence, foodGroupAnalysis, mealPatterns);

  return {
    dailyAverages,
    targetAdherence,
    foodGroupAnalysis,
    mealPatterns,
    nutritionScore,
  };
}

/**
 * Generate engagement analytics
 */
async function generateEngagementAnalytics(
  engagementData: any[],
  orderData: any[],
  preferencesData: any,
  student: any
): Promise<EngagementMetrics> {
  // Calculate meal engagement metrics
  const mealEngagement = calculateMealEngagement(engagementData);

  // Analyze food preferences
  const foodPreferences = analyzeFoodPreferences(engagementData, orderData, preferencesData);

  // Calculate social aspects
  const socialAspects = calculateSocialAspects(engagementData);

  // Analyze behavioral indicators
  const behavioralIndicators = analyzeBehavioralIndicators(engagementData);

  // Calculate engagement trends
  const engagementTrends = calculateEngagementTrends(engagementData);

  return {
    mealEngagement,
    foodPreferences,
    socialAspects,
    behavioralIndicators,
    engagementTrends,
  };
}

/**
 * Helper functions for data retrieval
 */
async function getStudentsForParent(userId: string, studentIds?: string[]) {
  if (studentIds) {
    // Get specific students
    const result = await dynamodb
      .batchGet({
        RequestItems: {
          [process.env.USERS_TABLE!]: {
            Keys: studentIds.map(id => ({ id })),
          },
        },
      })
      .promise();

    return result.Responses?.[process.env.USERS_TABLE!] || [];
  }

  // Get all children for parent
  const relationshipResult = await dynamodb
    .query({
      TableName: process.env.PARENT_CHILDREN_TABLE!,
      IndexName: 'ParentIdIndex',
      KeyConditionExpression: 'parentId = :parentId',
      ExpressionAttributeValues: { ':parentId': userId },
    })
    .promise();

  const relationships = relationshipResult.Items || [];

  if (relationships.length === 0) return [];

  const studentResult = await dynamodb
    .batchGet({
      RequestItems: {
        [process.env.USERS_TABLE!]: {
          Keys: relationships.map(rel => ({ id: rel.childId })),
        },
      },
    })
    .promise();

  return studentResult.Responses?.[process.env.USERS_TABLE!] || [];
}

async function getMealData(studentId: string, dateRange: any) {
  const result = await dynamodb
    .query({
      TableName: process.env.MEALS_TABLE!,
      IndexName: 'StudentIdDateIndex',
      KeyConditionExpression: 'studentId = :studentId AND mealDate BETWEEN :start AND :end',
      ExpressionAttributeValues: {
        ':studentId': studentId,
        ':start': dateRange.start,
        ':end': dateRange.end,
      },
    })
    .promise();

  return result.Items || [];
}

async function getNutritionData(studentId: string, dateRange: any) {
  // Query nutrition tracking data from TimeStream or DynamoDB
  const result = await dynamodb
    .query({
      TableName: process.env.NUTRITION_TRACKING_TABLE!,
      IndexName: 'StudentIdDateIndex',
      KeyConditionExpression: 'studentId = :studentId AND #date BETWEEN :start AND :end',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: {
        ':studentId': studentId,
        ':start': dateRange.start,
        ':end': dateRange.end,
      },
    })
    .promise();

  return result.Items || [];
}

async function getEngagementData(studentId: string, dateRange: any) {
  // Get engagement metrics from tracking tables
  const result = await dynamodb
    .query({
      TableName: process.env.ENGAGEMENT_TRACKING_TABLE!,
      IndexName: 'StudentIdDateIndex',
      KeyConditionExpression: 'studentId = :studentId AND #date BETWEEN :start AND :end',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: {
        ':studentId': studentId,
        ':start': dateRange.start,
        ':end': dateRange.end,
      },
    })
    .promise();

  return result.Items || [];
}

async function getOrderData(studentId: string, dateRange: any) {
  const result = await dynamodb
    .query({
      TableName: process.env.ORDERS_TABLE!,
      IndexName: 'StudentIdDateIndex',
      KeyConditionExpression: 'studentId = :studentId AND orderDate BETWEEN :start AND :end',
      ExpressionAttributeValues: {
        ':studentId': studentId,
        ':start': dateRange.start,
        ':end': dateRange.end,
      },
    })
    .promise();

  return result.Items || [];
}

async function getStudentPreferences(studentId: string) {
  const result = await dynamodb
    .get({
      TableName: process.env.STUDENT_PREFERENCES_TABLE!,
      Key: { studentId },
    })
    .promise();

  return result.Item || {};
}

/**
 * Helper functions for calculations
 */
function getDefaultDateRange(timeframe: string) {
  const end = new Date();
  const start = new Date();
  const days =
    ANALYTICS_CONFIG.timeframes[timeframe as keyof typeof ANALYTICS_CONFIG.timeframes] || 30;
  start.setDate(start.getDate() - days);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function getAgeGroup(
  dateOfBirth: string
): keyof typeof ANALYTICS_CONFIG.nutrition.daily_calorie_targets {
  const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();

  if (age <= 3) return 'toddler';
  if (age <= 6) return 'preschooler';
  if (age <= 12) return 'school_age';
  return 'adolescent';
}

// Placeholder implementations for complex calculations
function calculateDailyNutritionAverages(nutritionData: any[]) {
  return {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fats: 0,
    fiber: 0,
    sodium: 0,
    sugar: 0,
    vitamins: {},
    minerals: {},
  };
}

function calculateTargetAdherence(dailyAverages: any, targets: any, ageGroup: string) {
  return {
    calories: {
      target: targets.min,
      actual: dailyAverages.calories,
      adherence: 0.85,
      status: 'on_track' as const,
    },
    macronutrients: {
      protein: { target: 15, actual: 12, adherence: 0.8 },
      carbs: { target: 55, actual: 60, adherence: 0.9 },
      fats: { target: 30, actual: 28, adherence: 0.93 },
    },
    micronutrients: {},
  };
}

function analyzeFoodGroups(mealData: any[]) {
  return {
    vegetables: { target: 3, actual: 2.5, variety_score: 0.7 },
    fruits: { target: 2, actual: 1.8, variety_score: 0.6 },
    grains: { target: 6, actual: 5.5, whole_grain_ratio: 0.4 },
    protein: { target: 3, actual: 2.8, source_variety: 0.8 },
    dairy: { target: 3, actual: 2.2, calcium_content: 800 },
  };
}

function analyzeMealPatterns(mealData: any[]) {
  return {
    breakfast: { frequency: 0.9, avg_calories: 350, skip_rate: 0.1 },
    lunch: { frequency: 0.95, avg_calories: 500, completion_rate: 0.85 },
    snacks: { frequency: 0.8, avg_calories: 200, healthy_ratio: 0.6 },
    dinner: { frequency: 0.9, avg_calories: 450, family_meal_rate: 0.7 },
  };
}

function calculateNutritionScore(targetAdherence: any, foodGroupAnalysis: any, mealPatterns: any) {
  return {
    overall: 78,
    categories: {
      balance: 80,
      variety: 75,
      moderation: 82,
      adequacy: 76,
    },
    trending: 'improving' as const,
  };
}

function calculateMealEngagement(engagementData: any[]) {
  return {
    completion_rate: 0.85,
    average_time_spent: 18, // minutes
    portion_consumed: 0.8,
    food_waste: 0.15,
  };
}

function analyzeFoodPreferences(engagementData: any[], orderData: any[], preferencesData: any) {
  return {
    liked_foods: [
      { food: 'Pizza', preference_score: 0.9, frequency: 0.3 },
      { food: 'Pasta', preference_score: 0.8, frequency: 0.25 },
    ],
    disliked_foods: [{ food: 'Broccoli', avoidance_rate: 0.7, reasons: ['texture', 'taste'] }],
    new_foods_tried: 5,
    adventurous_eating_score: 0.6,
  };
}

function calculateSocialAspects(engagementData: any[]) {
  return {
    peer_influence_score: 0.7,
    group_meal_participation: 0.85,
    sharing_behavior: 0.6,
    mealtime_social_interaction: 0.75,
  };
}

function analyzeBehavioralIndicators(engagementData: any[]) {
  return {
    meal_enthusiasm: 0.7,
    texture_preferences: { smooth: 0.6, crunchy: 0.8, chewy: 0.4 },
    flavor_preferences: { sweet: 0.9, salty: 0.7, sour: 0.3, bitter: 0.1 },
    eating_speed: 'normal' as const,
    attention_during_meals: 0.6,
  };
}

function calculateEngagementTrends(engagementData: any[]) {
  return {
    weekly_pattern: [
      { day: 'Monday', engagement_score: 0.8 },
      { day: 'Tuesday', engagement_score: 0.75 },
      { day: 'Wednesday', engagement_score: 0.85 },
      { day: 'Thursday', engagement_score: 0.7 },
      { day: 'Friday', engagement_score: 0.9 },
    ],
    seasonal_variations: [
      { season: 'Spring', avg_engagement: 0.8 },
      { season: 'Summer', avg_engagement: 0.7 },
      { season: 'Fall', avg_engagement: 0.85 },
      { season: 'Winter', avg_engagement: 0.75 },
    ],
  };
}

// Additional helper functions (implementations would be more complex in production)
async function generateProgressIndicators(
  nutritionAnalytics: any,
  engagementMetrics: any,
  student: any
): Promise<ProgressIndicator[]> {
  return [];
}
async function generateComparisons(
  studentId: string,
  nutritionAnalytics: any,
  engagementMetrics: any,
  dateRange: any
): Promise<ComparisonData> {
  return {} as ComparisonData;
}
async function generateTrends(studentId: string, dateRange: any): Promise<TrendData[]> {
  return [];
}
async function generateRecommendations(
  nutritionAnalytics: any,
  engagementMetrics: any,
  progressIndicators: any
): Promise<ProgressRecommendation[]> {
  return [];
}
async function generateAlerts(
  progressIndicators: any,
  nutritionAnalytics: any,
  engagementMetrics: any
): Promise<ProgressAlert[]> {
  return [];
}
async function generateSummary(
  nutritionAnalytics: any,
  engagementMetrics: any,
  progressIndicators: any,
  trends: any
): Promise<ProgressSummary> {
  return {} as ProgressSummary;
}
function calculateDataCompleteness(
  mealData: any[],
  nutritionData: any[],
  engagementData: any[],
  dateRange: any
): number {
  return 0.85;
}

function getEmptyNutritionAnalytics(): NutritionAnalytics {
  return {
    dailyAverages: {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fats: 0,
      fiber: 0,
      sodium: 0,
      sugar: 0,
      vitamins: {},
      minerals: {},
    },
    targetAdherence: {
      calories: { target: 0, actual: 0, adherence: 0, status: 'on_track' },
      macronutrients: {
        protein: { target: 0, actual: 0, adherence: 0 },
        carbs: { target: 0, actual: 0, adherence: 0 },
        fats: { target: 0, actual: 0, adherence: 0 },
      },
      micronutrients: {},
    },
    foodGroupAnalysis: {
      vegetables: { target: 0, actual: 0, variety_score: 0 },
      fruits: { target: 0, actual: 0, variety_score: 0 },
      grains: { target: 0, actual: 0, whole_grain_ratio: 0 },
      protein: { target: 0, actual: 0, source_variety: 0 },
      dairy: { target: 0, actual: 0, calcium_content: 0 },
    },
    mealPatterns: {
      breakfast: { frequency: 0, avg_calories: 0, skip_rate: 0 },
      lunch: { frequency: 0, avg_calories: 0, completion_rate: 0 },
      snacks: { frequency: 0, avg_calories: 0, healthy_ratio: 0 },
      dinner: { frequency: 0, avg_calories: 0, family_meal_rate: 0 },
    },
    nutritionScore: {
      overall: 0,
      categories: { balance: 0, variety: 0, moderation: 0, adequacy: 0 },
      trending: 'stable',
    },
  };
}

function getEmptyEngagementMetrics(): EngagementMetrics {
  return {
    mealEngagement: {
      completion_rate: 0,
      average_time_spent: 0,
      portion_consumed: 0,
      food_waste: 0,
    },
    foodPreferences: {
      liked_foods: [],
      disliked_foods: [],
      new_foods_tried: 0,
      adventurous_eating_score: 0,
    },
    socialAspects: {
      peer_influence_score: 0,
      group_meal_participation: 0,
      sharing_behavior: 0,
      mealtime_social_interaction: 0,
    },
    behavioralIndicators: {
      meal_enthusiasm: 0,
      texture_preferences: {},
      flavor_preferences: {},
      eating_speed: 'normal',
      attention_during_meals: 0,
    },
    engagementTrends: { weekly_pattern: [], seasonal_variations: [] },
  };
}

function getEmptyComparisons(): ComparisonData {
  return {
    peer_comparison: { percentile: 0, category: 'average', metrics: {} },
    historical_comparison: { vs_last_month: {}, vs_last_quarter: {} },
    family_comparison: { siblings: [] },
  };
}

async function logAnalyticsGeneration(requestId: string, metrics: any): Promise<void> {
  console.log('Progress analytics completed:', { requestId, ...metrics });
}

async function logError(requestId: string, error: Error, context: any): Promise<void> {
  console.error('Progress analytics error:', { requestId, error: error.message, context });
}

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}
