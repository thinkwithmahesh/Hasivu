/**
 * Epic 7.2: Advanced Parent Dashboard & Insights Portal
 * Lambda Function: parent-dashboard-orchestrator
 *
 * Main coordination function for parent dashboard data aggregation
 * Orchestrates data collection from multiple services and provides
 * comprehensive dashboard analytics for parent users
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import AWS from 'aws-sdk';
import { z } from 'zod';

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();
const eventbridge = new AWS.EventBridge();
const cloudwatch = new AWS.CloudWatch();

// Dashboard configuration
const DASHBOARD_CONFIG = {
  aggregation: {
    cacheTimeout: 300, // 5 minutes
    batchSize: 50,
    maxParallelOperations: 10,
  },
  metrics: {
    responseTimeThreshold: 2000, // 2 seconds
    errorRateThreshold: 0.05, // 5%
    cacheMissThreshold: 0.2, // 20%
  },
  modules: {
    childProgress: 'child-progress-analytics',
    personalizedInsights: 'personalized-insights-engine',
    engagement: 'engagement-intelligence',
    customization: 'dashboard-customization',
  },
} as const;

// Input validation schemas
const DashboardRequestSchema = z.object({
  action: z.enum(['get_dashboard', 'refresh_data', 'get_widgets', 'update_preferences']),
  userId: z.string().uuid(),
  schoolId: z.string().uuid().optional(),
  studentIds: z.array(z.string().uuid()).optional(),
  dateRange: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    })
    .optional(),
  preferences: z
    .object({
      widgets: z.array(z.string()).optional(),
      layout: z.enum(['grid', 'list', 'compact']).optional(),
      refreshInterval: z.number().min(30).max(3600).optional(),
      notifications: z.boolean().optional(),
    })
    .optional(),
  metrics: z
    .object({
      includePerformance: z.boolean().optional(),
      includeEngagement: z.boolean().optional(),
      includeNutrition: z.boolean().optional(),
      includeProgress: z.boolean().optional(),
    })
    .optional(),
});

type DashboardRequest = z.infer<typeof DashboardRequestSchema>;

// Response interfaces
interface DashboardData {
  userId: string;
  schoolId?: string;
  lastUpdated: string;
  dataFreshness: {
    childProgress: string;
    engagement: string;
    insights: string;
    customization: string;
  };
  summary: {
    totalChildren: number;
    activeOrders: number;
    weeklySpend: number;
    engagementScore: number;
    lastActivity: string;
  };
  widgets: WidgetData[];
  alerts: AlertData[];
  recommendations: RecommendationData[];
  performance: PerformanceMetrics;
}

interface WidgetData {
  id: string;
  type: string;
  title: string;
  data: any;
  status: 'loading' | 'ready' | 'error' | 'stale';
  lastUpdated: string;
  refreshInterval: number;
  priority: number;
}

interface AlertData {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
  dismissible: boolean;
  timestamp: string;
  expiresAt?: string;
}

interface RecommendationData {
  id: string;
  category: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  metadata: Record<string, any>;
}

interface PerformanceMetrics {
  aggregationTime: number;
  cacheHitRate: number;
  errorRate: number;
  dataCompleteness: number;
  responseTime: number;
}

/**
 * Main Lambda handler for parent dashboard orchestration
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
    const request = DashboardRequestSchema.parse(requestBody);
    const userId = event.requestContext?.authorizer?.user_id || request.userId;

    // Route to appropriate handler
    let result: DashboardData;
    switch (request.action) {
      case 'get_dashboard':
        result = await getDashboardData(userId, request);
        break;
      case 'refresh_data':
        result = await refreshDashboardData(userId, request);
        break;
      case 'get_widgets':
        result = await getWidgetData(userId, request);
        break;
      case 'update_preferences':
        result = await updateDashboardPreferences(userId, request);
        break;
      default:
        throw new Error(`Unsupported action: ${request.action}`);
    }

    // Log performance metrics
    await logPerformanceMetrics(requestId, {
      action: request.action,
      userId,
      responseTime: Date.now() - startTime,
      dataCompleteness: result.performance.dataCompleteness,
      cacheHitRate: result.performance.cacheHitRate,
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
    console.error('Dashboard orchestration error:', error);

    await logError(requestId, error, {
      userId: requestBody?.userId,
      action: requestBody?.action,
    });

    return createResponse(error.statusCode || 500, {
      success: false,
      error: {
        code: error.code || 'DASHBOARD_ERROR',
        message: error.message || 'Internal server error',
        requestId,
      },
    });
  }
};

/**
 * Get comprehensive dashboard data
 */
async function getDashboardData(userId: string, request: DashboardRequest): Promise<DashboardData> {
  const cacheKey = `dashboard:${userId}:${hashRequest(request)}`;

  // Try to get cached data first
  const cachedData = await getCachedDashboard(cacheKey);
  if (cachedData && !isStale(cachedData)) {
    return cachedData;
  }

  // Parallel data aggregation
  const [userProfile, childrenData, progressData, engagementData, insightsData, customizationData] =
    await Promise.allSettled([
      getUserProfile(userId),
      getChildrenData(userId, request.studentIds),
      invokeChildProgressAnalytics(userId, request),
      invokeEngagementIntelligence(userId, request),
      invokePersonalizedInsights(userId, request),
      invokeDashboardCustomization(userId, request),
    ]);

  // Process results and handle errors gracefully
  const dashboardData: DashboardData = {
    userId,
    schoolId: extractValue(userProfile)?.schoolId,
    lastUpdated: new Date().toISOString(),
    dataFreshness: {
      childProgress: extractValue(progressData)?.timestamp || new Date().toISOString(),
      engagement: extractValue(engagementData)?.timestamp || new Date().toISOString(),
      insights: extractValue(insightsData)?.timestamp || new Date().toISOString(),
      customization: extractValue(customizationData)?.timestamp || new Date().toISOString(),
    },
    summary: await generateSummary(extractValue(userProfile), extractValue(childrenData)),
    widgets: await generateWidgets(
      extractValue(progressData),
      extractValue(engagementData),
      extractValue(insightsData),
      extractValue(customizationData)
    ),
    alerts: await generateAlerts(userId, extractValue(progressData), extractValue(engagementData)),
    recommendations: await generateRecommendations(
      extractValue(insightsData),
      extractValue(progressData)
    ),
    performance: calculatePerformanceMetrics([
      userProfile,
      childrenData,
      progressData,
      engagementData,
      insightsData,
      customizationData,
    ]),
  };

  // Cache the result
  await cacheDashboard(cacheKey, dashboardData);

  return dashboardData;
}

/**
 * Refresh dashboard data by invalidating cache and fetching fresh data
 */
async function refreshDashboardData(
  userId: string,
  request: DashboardRequest
): Promise<DashboardData> {
  // Invalidate all related caches
  await invalidateDashboardCache(userId);

  // Force fresh data collection
  return getDashboardData(userId, request);
}

/**
 * Get specific widget data
 */
async function getWidgetData(userId: string, request: DashboardRequest): Promise<DashboardData> {
  const widgets = request.preferences?.widgets || [];

  // Fetch only requested widget data
  const widgetResults = await Promise.allSettled(
    widgets.map(widgetType => fetchWidgetData(userId, widgetType, request))
  );

  return {
    userId,
    lastUpdated: new Date().toISOString(),
    dataFreshness: {
      childProgress: new Date().toISOString(),
      engagement: new Date().toISOString(),
      insights: new Date().toISOString(),
      customization: new Date().toISOString(),
    },
    summary: {
      totalChildren: 0,
      activeOrders: 0,
      weeklySpend: 0,
      engagementScore: 0,
      lastActivity: new Date().toISOString(),
    },
    widgets: widgetResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<WidgetData>).value),
    alerts: [],
    recommendations: [],
    performance: {
      aggregationTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      dataCompleteness: 1,
      responseTime: 0,
    },
  };
}

/**
 * Update dashboard preferences
 */
async function updateDashboardPreferences(
  userId: string,
  request: DashboardRequest
): Promise<DashboardData> {
  if (!request.preferences) {
    throw new Error('Preferences data is required for update action');
  }

  // Update preferences in database
  await dynamodb
    .update({
      TableName: process.env.DASHBOARD_PREFERENCES_TABLE!,
      Key: { userId },
      UpdateExpression: 'SET preferences = :prefs, updatedAt = :now',
      ExpressionAttributeValues: {
        ':prefs': request.preferences,
        ':now': new Date().toISOString(),
      },
    })
    .promise();

  // Invalidate cache to reflect new preferences
  await invalidateDashboardCache(userId);

  // Return updated dashboard data
  return getDashboardData(userId, request);
}

/**
 * Invoke child progress analytics Lambda
 */
async function invokeChildProgressAnalytics(userId: string, request: DashboardRequest) {
  return invokeLambdaFunction(DASHBOARD_CONFIG.modules.childProgress, {
    action: 'get_progress_data',
    userId,
    studentIds: request.studentIds,
    dateRange: request.dateRange,
    includeNutrition: request.metrics?.includeNutrition,
    includeEngagement: request.metrics?.includeEngagement,
  });
}

/**
 * Invoke engagement intelligence Lambda
 */
async function invokeEngagementIntelligence(userId: string, request: DashboardRequest) {
  return invokeLambdaFunction(DASHBOARD_CONFIG.modules.engagement, {
    action: 'get_engagement_data',
    userId,
    dateRange: request.dateRange,
    includeAppUsage: true,
    includeInteractions: true,
  });
}

/**
 * Invoke personalized insights engine Lambda
 */
async function invokePersonalizedInsights(userId: string, request: DashboardRequest) {
  return invokeLambdaFunction(DASHBOARD_CONFIG.modules.personalizedInsights, {
    action: 'generate_insights',
    userId,
    studentIds: request.studentIds,
    insightTypes: ['nutrition', 'spending', 'engagement', 'progress'],
  });
}

/**
 * Invoke dashboard customization Lambda
 */
async function invokeDashboardCustomization(userId: string, request: DashboardRequest) {
  return invokeLambdaFunction(DASHBOARD_CONFIG.modules.customization, {
    action: 'get_customization',
    userId,
    includeLayout: true,
    includeWidgets: true,
  });
}

/**
 * Generic Lambda function invocation
 */
async function invokeLambdaFunction(functionName: string, payload: any) {
  const params = {
    FunctionName: functionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(payload),
  };

  const result = await lambda.invoke(params).promise();

  if (result.FunctionError) {
    throw new Error(`Lambda function ${functionName} failed: ${result.FunctionError}`);
  }

  return JSON.parse(result.Payload as string);
}

/**
 * Get user profile information
 */
async function getUserProfile(userId: string) {
  const result = await dynamodb
    .get({
      TableName: process.env.USERS_TABLE!,
      Key: { id: userId },
    })
    .promise();

  return result.Item;
}

/**
 * Get children data for parent
 */
async function getChildrenData(userId: string, studentIds?: string[]) {
  if (studentIds) {
    // Get specific children
    const results = await dynamodb
      .batchGet({
        RequestItems: {
          [process.env.USERS_TABLE!]: {
            Keys: studentIds.map(id => ({ id })),
          },
        },
      })
      .promise();

    return results.Responses?.[process.env.USERS_TABLE!] || [];
  }

  // Get all children for parent
  const result = await dynamodb
    .query({
      TableName: process.env.PARENT_CHILDREN_TABLE!,
      IndexName: 'ParentIdIndex',
      KeyConditionExpression: 'parentId = :parentId',
      ExpressionAttributeValues: {
        ':parentId': userId,
      },
    })
    .promise();

  return result.Items || [];
}

/**
 * Generate dashboard summary
 */
async function generateSummary(userProfile: any, childrenData: any[]) {
  const summary = {
    totalChildren: childrenData?.length || 0,
    activeOrders: 0,
    weeklySpend: 0,
    engagementScore: 0,
    lastActivity: new Date().toISOString(),
  };

  // Calculate active orders
  if (childrenData?.length > 0) {
    const orderResults = await Promise.allSettled(
      childrenData.map(child => getActiveOrders(child.id))
    );

    summary.activeOrders = orderResults
      .filter(result => result.status === 'fulfilled')
      .reduce(
        (total, result) => total + ((result as PromiseFulfilledResult<number>).value || 0),
        0
      );
  }

  return summary;
}

/**
 * Generate widget data
 */
async function generateWidgets(...dataSource: any[]): Promise<WidgetData[]> {
  const widgets: WidgetData[] = [];

  // Progress widgets
  if (dataSource[0]) {
    widgets.push({
      id: 'child-progress',
      type: 'progress',
      title: 'Child Progress',
      data: dataSource[0],
      status: 'ready',
      lastUpdated: new Date().toISOString(),
      refreshInterval: 300,
      priority: 1,
    });
  }

  // Engagement widgets
  if (dataSource[1]) {
    widgets.push({
      id: 'engagement-stats',
      type: 'engagement',
      title: 'Engagement Statistics',
      data: dataSource[1],
      status: 'ready',
      lastUpdated: new Date().toISOString(),
      refreshInterval: 600,
      priority: 2,
    });
  }

  return widgets;
}

/**
 * Generate alerts
 */
async function generateAlerts(
  userId: string,
  progressData: any,
  engagementData: any
): Promise<AlertData[]> {
  const alerts: AlertData[] = [];

  // Check for low engagement
  if (engagementData?.score < 0.3) {
    alerts.push({
      id: `low-engagement-${Date.now()}`,
      type: 'warning',
      title: 'Low Engagement Alert',
      message: 'Your app engagement has decreased. Check for new updates and features.',
      dismissible: true,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return alerts;
}

/**
 * Generate recommendations
 */
async function generateRecommendations(
  insightsData: any,
  progressData: any
): Promise<RecommendationData[]> {
  const recommendations: RecommendationData[] = [];

  if (insightsData?.recommendations) {
    recommendations.push(
      ...insightsData.recommendations.map((rec: any) => ({
        id: rec.id || `rec-${Date.now()}`,
        category: rec.category || 'general',
        title: rec.title,
        description: rec.description,
        confidence: rec.confidence || 0.8,
        impact: rec.impact || 'medium',
        actionable: rec.actionable !== false,
        metadata: rec.metadata || {},
      }))
    );
  }

  return recommendations;
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(results: PromiseSettledResult<any>[]): PerformanceMetrics {
  const totalRequests = results.length;
  const successfulRequests = results.filter(r => r.status === 'fulfilled').length;
  const errorRate = (totalRequests - successfulRequests) / totalRequests;

  return {
    aggregationTime: 0, // Will be set by caller
    cacheHitRate: 0, // Will be calculated separately
    errorRate,
    dataCompleteness: successfulRequests / totalRequests,
    responseTime: 0, // Will be set by caller
  };
}

/**
 * Helper functions
 */
function extractValue<T>(result: PromiseSettledResult<T>): T | undefined {
  return result.status === 'fulfilled' ? result.value : undefined;
}

function hashRequest(request: DashboardRequest): string {
  return Buffer.from(
    JSON.stringify({
      action: request.action,
      studentIds: request.studentIds,
      dateRange: request.dateRange,
      preferences: request.preferences,
    })
  )
    .toString('base64')
    .slice(0, 16);
}

function isStale(data: DashboardData): boolean {
  const staleThreshold = DASHBOARD_CONFIG.aggregation.cacheTimeout * 1000;
  return Date.now() - new Date(data.lastUpdated).getTime() > staleThreshold;
}

async function getCachedDashboard(cacheKey: string): Promise<DashboardData | null> {
  try {
    const result = await dynamodb
      .get({
        TableName: process.env.DASHBOARD_CACHE_TABLE!,
        Key: { cacheKey },
      })
      .promise();

    return result.Item?.data || null;
  } catch (error) {
    console.warn('Cache retrieval failed:', error);
    return null;
  }
}

async function cacheDashboard(cacheKey: string, data: DashboardData): Promise<void> {
  try {
    await dynamodb
      .put({
        TableName: process.env.DASHBOARD_CACHE_TABLE!,
        Item: {
          cacheKey,
          data,
          ttl: Math.floor(Date.now() / 1000) + DASHBOARD_CONFIG.aggregation.cacheTimeout,
        },
      })
      .promise();
  } catch (error) {
    console.warn('Cache storage failed:', error);
  }
}

async function invalidateDashboardCache(userId: string): Promise<void> {
  // Implementation would scan and delete cache entries for user
  console.log(`Invalidating cache for user: ${userId}`);
}

async function fetchWidgetData(
  userId: string,
  widgetType: string,
  request: DashboardRequest
): Promise<WidgetData> {
  // Widget-specific data fetching logic
  return {
    id: widgetType,
    type: widgetType,
    title: `${widgetType} Widget`,
    data: {},
    status: 'ready',
    lastUpdated: new Date().toISOString(),
    refreshInterval: 300,
    priority: 1,
  };
}

async function getActiveOrders(studentId: string): Promise<number> {
  const result = await dynamodb
    .query({
      TableName: process.env.ORDERS_TABLE!,
      IndexName: 'StudentIdStatusIndex',
      KeyConditionExpression: 'studentId = :studentId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':studentId': studentId,
        ':status': 'active',
      },
    })
    .promise();

  return result.Count || 0;
}

async function logPerformanceMetrics(requestId: string, metrics: any): Promise<void> {
  await cloudwatch
    .putMetricData({
      Namespace: 'HASIVU/Dashboard',
      MetricData: [
        {
          MetricName: 'ResponseTime',
          Value: metrics.responseTime,
          Unit: 'Milliseconds',
          Dimensions: [
            { Name: 'Action', Value: metrics.action },
            { Name: 'RequestId', Value: requestId },
          ],
        },
        {
          MetricName: 'DataCompleteness',
          Value: metrics.dataCompleteness,
          Unit: 'Percent',
          Dimensions: [{ Name: 'UserId', Value: metrics.userId }],
        },
      ],
    })
    .promise();
}

async function logError(requestId: string, error: Error, context: any): Promise<void> {
  await eventbridge
    .putEvents({
      Entries: [
        {
          Source: 'hasivu.dashboard.orchestrator',
          DetailType: 'Dashboard Error',
          Detail: JSON.stringify({
            requestId,
            error: error.message,
            stack: error.stack,
            context,
          }),
        },
      ],
    })
    .promise();
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
