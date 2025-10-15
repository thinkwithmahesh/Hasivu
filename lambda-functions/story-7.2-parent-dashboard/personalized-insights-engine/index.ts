/**
 * Epic 7.2: Advanced Parent Dashboard & Insights Portal
 * Lambda Function: personalized-insights-engine
 *
 * AI-powered insights generation for individual families
 * Uses machine learning models to analyze family behavior patterns,
 * spending habits, nutrition choices, and engagement metrics to provide
 * personalized recommendations and insights
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import AWS from 'aws-sdk';
import { z } from 'zod';

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sagemaker = new AWS.SageMakerRuntime();
const bedrock = new AWS.BedrockRuntime();
const s3 = new AWS.S3();

// Insights configuration
const INSIGHTS_CONFIG = {
  models: {
    spending_patterns: process.env.SPENDING_PATTERNS_MODEL!,
    nutrition_analysis: process.env.NUTRITION_ANALYSIS_MODEL!,
    engagement_prediction: process.env.ENGAGEMENT_PREDICTION_MODEL!,
    recommendation_engine: process.env.RECOMMENDATION_ENGINE_MODEL!,
  },
  bedrock: {
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    maxTokens: 2000,
    temperature: 0.3,
  },
  thresholds: {
    confidence: 0.7,
    significance: 0.5,
    freshness_hours: 24,
  },
  insights_types: {
    spending: {
      budget_analysis: true,
      pattern_detection: true,
      cost_optimization: true,
      spending_forecast: true,
    },
    nutrition: {
      dietary_analysis: true,
      nutrition_gaps: true,
      health_recommendations: true,
      meal_planning: true,
    },
    engagement: {
      usage_patterns: true,
      feature_adoption: true,
      satisfaction_prediction: true,
      churn_risk: true,
    },
    progress: {
      academic_correlation: true,
      development_tracking: true,
      milestone_prediction: true,
      intervention_suggestions: true,
    },
  },
} as const;

// Input validation schemas
const InsightsRequestSchema = z.object({
  action: z.enum(['generate_insights', 'get_recommendations', 'analyze_trends', 'get_predictions']),
  userId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).optional(),
  insightTypes: z.array(z.enum(['spending', 'nutrition', 'engagement', 'progress'])),
  dateRange: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    })
    .optional(),
  options: z
    .object({
      includeMLAnalysis: z.boolean().optional(),
      includeAIRecommendations: z.boolean().optional(),
      confidenceThreshold: z.number().min(0).max(1).optional(),
      maxRecommendations: z.number().min(1).max(20).optional(),
      language: z.string().optional(),
    })
    .optional(),
});

type InsightsRequest = z.infer<typeof InsightsRequestSchema>;

// Response interfaces
interface InsightsResponse {
  userId: string;
  generatedAt: string;
  dataRange: {
    start: string;
    end: string;
  };
  insights: FamilyInsight[];
  recommendations: PersonalizedRecommendation[];
  trends: TrendAnalysis[];
  predictions: PredictionData[];
  metadata: {
    totalDataPoints: number;
    confidenceScore: number;
    modelsUsed: string[];
    processingTime: number;
  };
}

interface FamilyInsight {
  id: string;
  type: 'spending' | 'nutrition' | 'engagement' | 'progress';
  category: string;
  title: string;
  description: string;
  significance: number;
  confidence: number;
  impact: 'positive' | 'negative' | 'neutral';
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: InsightData;
  visualizations: VisualizationData[];
  actionItems: ActionItem[];
  relatedInsights: string[];
  timestamp: string;
}

interface PersonalizedRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  potential_impact: string;
  implementation_difficulty: 'easy' | 'medium' | 'hard';
  estimated_benefit: {
    financial: number;
    health: number;
    engagement: number;
    development: number;
  };
  actionSteps: string[];
  timeframe: string;
  prerequisites: string[];
  metrics_to_track: string[];
  related_features: string[];
}

interface TrendAnalysis {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  velocity: number;
  significance: number;
  timeframe: string;
  data_points: Array<{
    date: string;
    value: number;
    context?: string;
  }>;
  seasonal_patterns: boolean;
  anomalies: Array<{
    date: string;
    value: number;
    explanation: string;
  }>;
}

interface PredictionData {
  metric: string;
  prediction_horizon: string;
  predicted_value: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  factors: Array<{
    name: string;
    influence: number;
    direction: 'positive' | 'negative';
  }>;
  scenario_analysis: {
    best_case: number;
    worst_case: number;
    most_likely: number;
  };
}

interface InsightData {
  key_metrics: Record<string, number>;
  comparisons: Record<string, any>;
  patterns: string[];
  correlations: Array<{
    variables: string[];
    strength: number;
    significance: number;
  }>;
  raw_data: any[];
}

interface VisualizationData {
  type: 'chart' | 'graph' | 'heatmap' | 'table';
  title: string;
  config: any;
  data: any[];
}

interface ActionItem {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_time: string;
  category: string;
}

/**
 * Main Lambda handler for personalized insights generation
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
    const request = InsightsRequestSchema.parse(requestBody);
    const userId = event.requestContext?.authorizer?.user_id || request.userId;

    // Route to appropriate handler
    let result: InsightsResponse;
    switch (request.action) {
      case 'generate_insights':
        result = await generateInsights(userId, request);
        break;
      case 'get_recommendations':
        result = await getPersonalizedRecommendations(userId, request);
        break;
      case 'analyze_trends':
        result = await analyzeTrends(userId, request);
        break;
      case 'get_predictions':
        result = await generatePredictions(userId, request);
        break;
      default:
        throw new Error(`Unsupported action: ${request.action}`);
    }

    // Log insights generation
    await logInsightsGeneration(requestId, {
      userId,
      action: request.action,
      insightTypes: request.insightTypes,
      insightsGenerated: result.insights.length,
      recommendationsGenerated: result.recommendations.length,
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
    console.error('Insights generation error:', error);

    await logError(requestId, error, {
      userId: requestBody?.userId,
      action: requestBody?.action,
    });

    return createResponse(error.statusCode || 500, {
      success: false,
      error: {
        code: error.code || 'INSIGHTS_ERROR',
        message: error.message || 'Internal server error',
        requestId,
      },
    });
  }
};

/**
 * Generate comprehensive insights for a family
 */
async function generateInsights(
  userId: string,
  request: InsightsRequest
): Promise<InsightsResponse> {
  const dateRange = request.dateRange || getDefaultDateRange();
  const insights: FamilyInsight[] = [];
  const recommendations: PersonalizedRecommendation[] = [];
  const modelsUsed: string[] = [];

  // Collect data for analysis
  const [familyData, spendingData, nutritionData, engagementData] = await Promise.all([
    getFamilyData(userId, request.studentIds),
    getSpendingData(userId, dateRange),
    getNutritionData(userId, dateRange),
    getEngagementData(userId, dateRange),
  ]);

  // Generate insights for each requested type
  for (const insightType of request.insightTypes) {
    try {
      let typeInsights: FamilyInsight[] = [];
      let typeRecommendations: PersonalizedRecommendation[] = [];

      switch (insightType) {
        case 'spending':
          const spendingAnalysis = await analyzeSpendingPatterns(spendingData, familyData);
          typeInsights = await generateSpendingInsights(spendingAnalysis, userId);
          typeRecommendations = await generateSpendingRecommendations(spendingAnalysis);
          modelsUsed.push(INSIGHTS_CONFIG.models.spending_patterns);
          break;

        case 'nutrition':
          const nutritionAnalysis = await analyzeNutritionPatterns(nutritionData, familyData);
          typeInsights = await generateNutritionInsights(nutritionAnalysis, userId);
          typeRecommendations = await generateNutritionRecommendations(nutritionAnalysis);
          modelsUsed.push(INSIGHTS_CONFIG.models.nutrition_analysis);
          break;

        case 'engagement':
          const engagementAnalysis = await analyzeEngagementPatterns(engagementData, familyData);
          typeInsights = await generateEngagementInsights(engagementAnalysis, userId);
          typeRecommendations = await generateEngagementRecommendations(engagementAnalysis);
          modelsUsed.push(INSIGHTS_CONFIG.models.engagement_prediction);
          break;

        case 'progress':
          const progressAnalysis = await analyzeProgressPatterns(familyData, dateRange);
          typeInsights = await generateProgressInsights(progressAnalysis, userId);
          typeRecommendations = await generateProgressRecommendations(progressAnalysis);
          break;
      }

      insights.push(...typeInsights);
      recommendations.push(...typeRecommendations);
    } catch (error) {
      console.warn(`Failed to generate ${insightType} insights:`, error);
    }
  }

  // Filter by confidence threshold
  const confidenceThreshold =
    request.options?.confidenceThreshold || INSIGHTS_CONFIG.thresholds.confidence;
  const filteredInsights = insights.filter(insight => insight.confidence >= confidenceThreshold);
  const filteredRecommendations = recommendations.filter(
    rec => rec.confidence >= confidenceThreshold
  );

  // Generate AI-powered summary if requested
  if (request.options?.includeAIRecommendations) {
    const aiRecommendations = await generateAIRecommendations(
      filteredInsights,
      familyData,
      request.options.language || 'en'
    );
    filteredRecommendations.push(...aiRecommendations);
  }

  return {
    userId,
    generatedAt: new Date().toISOString(),
    dataRange: dateRange,
    insights: filteredInsights,
    recommendations: filteredRecommendations.slice(0, request.options?.maxRecommendations || 10),
    trends: await analyzeTrendsForInsights(filteredInsights),
    predictions: await generatePredictionsFromInsights(filteredInsights, familyData),
    metadata: {
      totalDataPoints: spendingData.length + nutritionData.length + engagementData.length,
      confidenceScore: calculateAverageConfidence(filteredInsights),
      modelsUsed,
      processingTime: 0, // Will be set by caller
    },
  };
}

/**
 * Get personalized recommendations
 */
async function getPersonalizedRecommendations(
  userId: string,
  request: InsightsRequest
): Promise<InsightsResponse> {
  // Get recent insights
  const recentInsights = await getRecentInsights(userId);

  // Generate new recommendations based on latest data
  const recommendations = await generateRecommendationsFromML(userId, recentInsights, request);

  return {
    userId,
    generatedAt: new Date().toISOString(),
    dataRange: request.dateRange || getDefaultDateRange(),
    insights: recentInsights,
    recommendations,
    trends: [],
    predictions: [],
    metadata: {
      totalDataPoints: recentInsights.length,
      confidenceScore: calculateAverageConfidence(recentInsights),
      modelsUsed: [INSIGHTS_CONFIG.models.recommendation_engine],
      processingTime: 0,
    },
  };
}

/**
 * Analyze spending patterns using ML
 */
async function analyzeSpendingPatterns(spendingData: any[], familyData: any) {
  const modelInput = {
    family_profile: {
      family_size: familyData.children?.length || 1,
      income_bracket: familyData.income_bracket || 'middle',
      dietary_preferences: familyData.dietary_preferences || [],
    },
    spending_data: spendingData.map(record => ({
      date: record.date,
      amount: record.amount,
      category: record.category,
      meal_type: record.meal_type,
      student_id: record.student_id,
    })),
    time_period_days: 30,
  };

  return invokeSageMakerModel(INSIGHTS_CONFIG.models.spending_patterns, modelInput);
}

/**
 * Generate spending insights
 */
async function generateSpendingInsights(analysis: any, userId: string): Promise<FamilyInsight[]> {
  const insights: FamilyInsight[] = [];

  // Budget variance insight
  if (analysis.budget_analysis?.variance > 0.15) {
    insights.push({
      id: `spending-budget-${Date.now()}`,
      type: 'spending',
      category: 'budget',
      title: 'Budget Variance Detected',
      description: `Your spending is ${(analysis.budget_analysis.variance * 100).toFixed(1)}% ${analysis.budget_analysis.variance > 0 ? 'above' : 'below'} your average monthly budget.`,
      significance: Math.abs(analysis.budget_analysis.variance),
      confidence: analysis.budget_analysis.confidence || 0.8,
      impact: analysis.budget_analysis.variance > 0 ? 'negative' : 'positive',
      priority: Math.abs(analysis.budget_analysis.variance) > 0.3 ? 'high' : 'medium',
      data: {
        key_metrics: {
          variance_percentage: analysis.budget_analysis.variance * 100,
          average_monthly: analysis.budget_analysis.average_monthly,
          current_month: analysis.budget_analysis.current_month,
        },
        comparisons: analysis.budget_analysis.comparisons,
        patterns: analysis.patterns || [],
        correlations: [],
        raw_data: analysis.raw_data || [],
      },
      visualizations: [
        {
          type: 'chart',
          title: 'Monthly Spending Trend',
          config: { type: 'line', xAxis: 'month', yAxis: 'amount' },
          data: analysis.monthly_trends || [],
        },
      ],
      actionItems: [
        {
          id: `action-budget-${Date.now()}`,
          description: 'Review and adjust monthly food budget',
          priority: 'medium',
          difficulty: 'easy',
          estimated_time: '15 minutes',
          category: 'budget_management',
        },
      ],
      relatedInsights: [],
      timestamp: new Date().toISOString(),
    });
  }

  // Add more spending insights based on analysis
  if (analysis.meal_type_patterns) {
    insights.push(await generateMealTypeInsight(analysis.meal_type_patterns, userId));
  }

  return insights;
}

/**
 * Generate AI-powered recommendations using Bedrock
 */
async function generateAIRecommendations(
  insights: FamilyInsight[],
  familyData: any,
  language: string = 'en'
): Promise<PersonalizedRecommendation[]> {
  const prompt = `
You are a family nutrition and spending advisor. Based on the following insights about a family's food spending and nutrition patterns, provide personalized recommendations.

Family Profile:
- Children: ${familyData.children?.length || 1}
- Dietary preferences: ${familyData.dietary_preferences?.join(', ') || 'None specified'}
- School: ${familyData.school_name || 'Not specified'}

Key Insights:
${insights.map(insight => `- ${insight.title}: ${insight.description}`).join('\n')}

Please provide 3-5 actionable recommendations that are:
1. Specific and practical
2. Tailored to this family's situation
3. Focused on improving nutrition, saving money, or enhancing engagement
4. Easy to implement

Format each recommendation as JSON with these fields:
- title: Brief descriptive title
- description: 2-3 sentence explanation
- reasoning: Why this recommendation is relevant
- potential_impact: Expected benefits
- implementation_difficulty: easy/medium/hard
- actionSteps: Array of specific steps to take
- timeframe: How long to see results
- metrics_to_track: How to measure success

Respond only with a JSON array of recommendations.`;

  try {
    const response = await bedrock
      .invokeModel({
        modelId: INSIGHTS_CONFIG.bedrock.modelId,
        contentType: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: INSIGHTS_CONFIG.bedrock.maxTokens,
          temperature: INSIGHTS_CONFIG.bedrock.temperature,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })
      .promise();

    const responseBody = JSON.parse(response.body.toString());
    const aiRecommendations = JSON.parse(responseBody.content[0].text);

    return aiRecommendations.map((rec: any, index: number) => ({
      id: `ai-rec-${Date.now()}-${index}`,
      category: 'ai_generated',
      title: rec.title,
      description: rec.description,
      reasoning: rec.reasoning,
      confidence: 0.85,
      potential_impact: rec.potential_impact,
      implementation_difficulty: rec.implementation_difficulty,
      estimated_benefit: {
        financial: 0,
        health: 0,
        engagement: 0,
        development: 0,
      },
      actionSteps: rec.actionSteps || [],
      timeframe: rec.timeframe,
      prerequisites: [],
      metrics_to_track: rec.metrics_to_track || [],
      related_features: [],
    }));
  } catch (error) {
    console.warn('AI recommendation generation failed:', error);
    return [];
  }
}

/**
 * Helper functions
 */
async function getFamilyData(userId: string, studentIds?: string[]) {
  const userResult = await dynamodb
    .get({
      TableName: process.env.USERS_TABLE!,
      Key: { id: userId },
    })
    .promise();

  const user = userResult.Item;
  if (!user) throw new Error('User not found');

  // Get children data
  let children = [];
  if (studentIds) {
    const childrenResult = await dynamodb
      .batchGet({
        RequestItems: {
          [process.env.USERS_TABLE!]: {
            Keys: studentIds.map(id => ({ id })),
          },
        },
      })
      .promise();
    children = childrenResult.Responses?.[process.env.USERS_TABLE!] || [];
  } else {
    const relationshipResult = await dynamodb
      .query({
        TableName: process.env.PARENT_CHILDREN_TABLE!,
        IndexName: 'ParentIdIndex',
        KeyConditionExpression: 'parentId = :parentId',
        ExpressionAttributeValues: { ':parentId': userId },
      })
      .promise();
    children = relationshipResult.Items || [];
  }

  return {
    ...user,
    children,
  };
}

async function getSpendingData(userId: string, dateRange: any) {
  const result = await dynamodb
    .query({
      TableName: process.env.PAYMENTS_TABLE!,
      IndexName: 'UserIdDateIndex',
      KeyConditionExpression: 'userId = :userId AND #date BETWEEN :start AND :end',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':start': dateRange.start,
        ':end': dateRange.end,
      },
    })
    .promise();

  return result.Items || [];
}

async function getNutritionData(userId: string, dateRange: any) {
  // Get nutrition data from orders/meals
  const result = await dynamodb
    .query({
      TableName: process.env.ORDERS_TABLE!,
      IndexName: 'UserIdDateIndex',
      KeyConditionExpression: 'userId = :userId AND orderDate BETWEEN :start AND :end',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':start': dateRange.start,
        ':end': dateRange.end,
      },
    })
    .promise();

  return result.Items || [];
}

async function getEngagementData(userId: string, dateRange: any) {
  // Get app usage and engagement metrics
  return []; // Implementation would fetch from analytics tables
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30); // Last 30 days

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function invokeSageMakerModel(modelName: string, input: any) {
  const params = {
    EndpointName: modelName,
    ContentType: 'application/json',
    Body: JSON.stringify(input),
  };

  const result = await sagemaker.invokeEndpoint(params).promise();
  return JSON.parse(result.Body.toString());
}

function calculateAverageConfidence(insights: FamilyInsight[]): number {
  if (insights.length === 0) return 0;
  return insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length;
}

// Additional helper functions would be implemented here...
async function analyzeNutritionPatterns(nutritionData: any[], familyData: any) {
  return {};
}
async function analyzeEngagementPatterns(engagementData: any[], familyData: any) {
  return {};
}
async function analyzeProgressPatterns(familyData: any, dateRange: any) {
  return {};
}
async function generateNutritionInsights(analysis: any, userId: string): Promise<FamilyInsight[]> {
  return [];
}
async function generateEngagementInsights(analysis: any, userId: string): Promise<FamilyInsight[]> {
  return [];
}
async function generateProgressInsights(analysis: any, userId: string): Promise<FamilyInsight[]> {
  return [];
}
async function generateSpendingRecommendations(
  analysis: any
): Promise<PersonalizedRecommendation[]> {
  return [];
}
async function generateNutritionRecommendations(
  analysis: any
): Promise<PersonalizedRecommendation[]> {
  return [];
}
async function generateEngagementRecommendations(
  analysis: any
): Promise<PersonalizedRecommendation[]> {
  return [];
}
async function generateProgressRecommendations(
  analysis: any
): Promise<PersonalizedRecommendation[]> {
  return [];
}
async function analyzeTrendsForInsights(insights: FamilyInsight[]): Promise<TrendAnalysis[]> {
  return [];
}
async function generatePredictionsFromInsights(
  insights: FamilyInsight[],
  familyData: any
): Promise<PredictionData[]> {
  return [];
}
async function getRecentInsights(userId: string): Promise<FamilyInsight[]> {
  return [];
}
async function generateRecommendationsFromML(
  userId: string,
  insights: FamilyInsight[],
  request: InsightsRequest
): Promise<PersonalizedRecommendation[]> {
  return [];
}
async function generateMealTypeInsight(patterns: any, userId: string): Promise<FamilyInsight> {
  return {} as FamilyInsight;
}
async function analyzeTrends(userId: string, request: InsightsRequest): Promise<InsightsResponse> {
  return {} as InsightsResponse;
}
async function generatePredictions(
  userId: string,
  request: InsightsRequest
): Promise<InsightsResponse> {
  return {} as InsightsResponse;
}

async function logInsightsGeneration(requestId: string, metrics: any): Promise<void> {
  console.log('Insights generation completed:', { requestId, ...metrics });
}

async function logError(requestId: string, error: Error, context: any): Promise<void> {
  console.error('Insights generation error:', { requestId, error: error.message, context });
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
