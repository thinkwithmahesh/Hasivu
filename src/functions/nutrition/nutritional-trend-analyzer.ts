import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { SageMakerRuntimeClient, InvokeEndpointCommand } from '@aws-sdk/client-sagemaker-runtime';
import { z } from 'zod';

// Initialize AWS clients
const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
const sageMakerClient = new SageMakerRuntimeClient({ region: 'us-east-1' });

// Validation schemas
const TrendAnalysisRequestSchema = z.object({
  schoolId: z.string().min(1),
  ageGroups: z.array(z.object({
    min: z.number().min(0).max(18),
    max: z.number().min(0).max(18)
  })).optional(),
  timeframe: z.object({
    startDate: z.string(),
    endDate: z.string(),
    granularity: z.enum(['daily', 'weekly', 'monthly'])
  }),
  focusAreas: z.array(z.enum(['nutrition', 'growth', 'preferences', 'health', 'behavior', 'seasonal'])),
  comparisonMetrics: z.array(z.string()).optional(),
  outputFormat: z.enum(['summary', 'detailed', 'executive']).default('summary'),
  includeVisualizations: z.boolean().default(true),
  includePredictions: z.boolean().default(false)
});

type TrendAnalysisRequest = z.infer<typeof TrendAnalysisRequestSchema>;

interface NutritionalDataPoint {
  studentId: string;
  timestamp: string;
  mealType: string;
  nutritionalValues: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    vitamins: Record<string, number>;
    minerals: Record<string, number>;
  };
  consumptionPercentage: number;
  preferences: string[];
  demographicInfo: {
    age: number;
    gender: string;
    grade: string;
  };
}

interface TrendAnalysisResult {
  analysisId: string;
  timestamp: string;
  timeframe: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  trendAnalysis: {
    nutritionalTrends: {
      calories: TrendData;
      macronutrients: {
        protein: TrendData;
        carbohydrates: TrendData;
        fat: TrendData;
      };
      micronutrients: Record<string, TrendData>;
    };
    growthPatterns: {
      correlations: Array<{
        metric1: string;
        metric2: string;
        correlation: number;
        significance: string;
      }>;
    };
    behavioralPatterns: {
      acceptanceRates: Record<string, number>;
      preferenceShifts: Array<{
        foodItem: string;
        trend: 'increasing' | 'decreasing' | 'stable';
        magnitude: number;
      }>;
    };
    seasonalInfluences: {
      seasonalTrends: Record<string, TrendData>;
      climaticCorrelations: Array<{
        factor: string;
        impact: number;
      }>;
    }
  };
  comparativeAnalysis: {
    benchmarkComparison: Record<string, {
      current: number;
      benchmark: number;
      deviation: number;
    }>;
    peerGroupAnalysis: Array<{
      group: string;
      metrics: Record<string, number>;
    }>;
  };
  predictiveInsights: {
    shortTermPredictions: Array<{
      metric: string;
      predictedValue: number;
      confidence: number;
      timeHorizon: string;
    }>;
    scenarios: Array<{
      name: string;
      description: string;
      probability: number;
      impact: string;
    }>;
  };
  aiInsights: {
    keyFindings: string[];
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      category: string;
      action: string;
      expectedImpact: string;
    }>;
    riskFactors: Array<{
      factor: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      affectedStudents: number;
    }>;
  };
  visualizations: {
    chartConfigs: Array<{
      type: string;
      data: any;
      title: string;
    }>;
    dashboardUrl?: string;
  };
}

interface TrendData {
  current: number;
  previous: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  significance: string;
  dataPoints: Array<{
    date: string;
    value: number;
  }>;
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    min: number;
    max: number;
  };
  demographics: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
  };
}

// Fetch nutritional data for analysis
async function fetchNutritionalData(
  schoolId: string, 
  startDate: string, 
  endDate: string, 
  ageGroups?: Array<{ min: number; max: number }>
): Promise<NutritionalDataPoint[]> {
  try {
    const data: NutritionalDataPoint[] = [];

    // Fetch nutritional intake data
    const intakeResult = await dynamoDbClient.send(new QueryCommand({
      TableName: process.env.NUTRITION_TABLE_NAME || 'NutritionIntake',
      KeyConditionExpression: 'schoolId = :schoolId',
      FilterExpression: '#timestamp BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':schoolId': schoolId,
        ':startDate': startDate,
        ':endDate': endDate
      }
    }));
    
    data.push(...(intakeResult.Items as NutritionalDataPoint[] || []));

    // Fetch meal plan data for context
    const mealPlanResult = await dynamoDbClient.send(new QueryCommand({
      TableName: process.env.MEAL_PLANS_TABLE_NAME || 'MealPlans',
      KeyConditionExpression: 'schoolId = :schoolId',
      FilterExpression: '#dateServed BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#dateServed': 'dateServed'
      },
      ExpressionAttributeValues: {
        ':schoolId': schoolId,
        ':startDate': startDate,
        ':endDate': endDate
      }
    }));
    
    // Merge meal plan data with nutritional data
    const mealPlanData = mealPlanResult.Items || [];
    const enrichedData = data.map(point => {
      const mealPlan = mealPlanData.find(mp => 
        mp.dateServed === point.timestamp.split('T')[0] && 
        mp.mealType === point.mealType
      );
      return {
        ...point,
        plannedNutrition: mealPlan?.nutritionalValues || null,
        variance: mealPlan ? calculateNutritionalVariance(point.nutritionalValues, mealPlan.nutritionalValues) : null
      };
    });

    // Fetch child health data for correlations
    const healthResult = await dynamoDbClient.send(new ScanCommand({
      TableName: process.env.CHILD_HEALTH_TABLE_NAME || 'ChildHealth',
      FilterExpression: 'schoolId = :schoolId',
      ExpressionAttributeValues: {
        ':schoolId': schoolId
      }
    }));
    
    const healthData = healthResult.Items || [];
    
    // Filter by age groups if specified
    let filteredData = enrichedData;
    if (ageGroups && ageGroups.length > 0) {
      filteredData = enrichedData.filter(point => {
        return ageGroups.some(group => 
          point.demographicInfo.age >= group.min && 
          point.demographicInfo.age <= group.max
        );
      });
    }

    // Add health correlations
    const dataWithHealthInfo = filteredData.map(point => {
      const healthInfo = healthData.find(h => h.studentId === point.studentId);
      return {
        ...point,
        healthMetrics: healthInfo ? {
          height: healthInfo.height,
          weight: healthInfo.weight,
          bmi: healthInfo.bmi,
          growthPercentile: healthInfo.growthPercentile
        } : null
      };
    });

    console.log(`Fetched ${dataWithHealthInfo.length} nutritional data points for trend analysis`);
    return dataWithHealthInfo;
  } catch (error) {
    console.error('Error fetching nutritional data:', error);
    throw error;
  }
}

function calculateNutritionalVariance(actual: any, planned: any): Record<string, number> {
  const variance: Record<string, number> = {};
  const keys = ['calories', 'protein', 'carbohydrates', 'fat', 'fiber'];
  
  keys.forEach(key => {
    if (actual[key] !== undefined && planned[key] !== undefined) {
      variance[key] = ((actual[key] - planned[key]) / planned[key]) * 100;
    }
  });
  
  return variance;
}

// AI-powered trend analysis using Bedrock
async function analyzeTrendsWithAI(
  data: NutritionalDataPoint[], 
  focusAreas: string[], 
  analysisId: string
): Promise<any> {
  try {
    const prompt = `You are an expert pediatric nutritionist and data analyst. Analyze the following nutritional trend data:

Data Summary: ${data.length} data points
Focus Areas: ${focusAreas.join(', ')}
Sample Data: ${JSON.stringify(data.slice(0, 3), null, 2)}

Please analyze trends focusing on:
1. Nutritional intake patterns over time
2. Growth and development correlations  
3. Behavioral changes in food acceptance
4. Seasonal influences on nutrition
5. Risk factors and concerning patterns
6. Positive trends and success indicators

Provide insights into:
- Statistical significance of observed trends
- Correlation between different nutritional metrics
- Predictive indicators for future outcomes
- Risk assessment for nutritional deficiencies
- Evidence-based recommendations for improvement

Format as structured JSON with detailed statistical analysis and actionable insights.

Expected JSON structure:
{
  "trendAnalysis": {
    "nutritionalTrends": {...},
    "growthPatterns": {...},
    "behavioralPatterns": {...},
    "seasonalInfluences": {...}
  },
  "keyFindings": [...],
  "recommendations": [...],
  "riskFactors": [...],
  "confidenceScores": {...}
}`;

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log(`AI trend analysis completed for ${analysisId}`);
    return JSON.parse(responseBody.content[0].text);
  } catch (error) {
    console.error('Error in AI trend analysis:', error);
    // Return fallback analysis
    return {
      trendAnalysis: {
        nutritionalTrends: { error: 'AI analysis failed, using statistical fallback' },
        behavioralPatterns: {},
        seasonalInfluences: {}
      },
      keyFindings: ['AI analysis unavailable - manual review recommended'],
      recommendations: [{
        priority: 'high',
        category: 'system',
        action: 'Review AI analysis configuration',
        expectedImpact: 'Restored comprehensive trend insights'
      }],
      riskFactors: [],
      confidenceScores: { overall: 0.3 }
    };
  }
}

// Statistical analysis functions
function calculateTrendStatistics(dataPoints: Array<{ date: string; value: number }>): {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
} {
  const values = dataPoints.map(dp => dp.value);
  const sortedValues = [...values].sort((a, b) => a - b);
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];
  
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate trend using linear regression
  const n = dataPoints.length;
  const xValues = dataPoints.map((_, index) => index);
  const yValues = values;
  
  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = yValues.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  const trend = Math.abs(slope) < 0.01 ? 'stable' : slope > 0 ? 'increasing' : 'decreasing';
  const changePercentage = values.length > 1 ? ((values[values.length - 1] - values[0]) / values[0]) * 100 : 0;
  
  return {
    mean,
    median,
    standardDeviation,
    min,
    max,
    trend,
    changePercentage
  };
}

function performStatisticalAnalysis(data: NutritionalDataPoint[]): any {
  const timeSeriesData: Record<string, Array<{ date: string; value: number }>> = {};
  
  // Group data by nutritional components
  data.forEach(point => {
    const date = point.timestamp.split('T')[0];
    
    if (!timeSeriesData.calories) timeSeriesData.calories = [];
    if (!timeSeriesData.protein) timeSeriesData.protein = [];
    if (!timeSeriesData.carbohydrates) timeSeriesData.carbohydrates = [];
    if (!timeSeriesData.fat) timeSeriesData.fat = [];
    
    timeSeriesData.calories.push({ date, value: point.nutritionalValues.calories });
    timeSeriesData.protein.push({ date, value: point.nutritionalValues.protein });
    timeSeriesData.carbohydrates.push({ date, value: point.nutritionalValues.carbohydrates });
    timeSeriesData.fat.push({ date, value: point.nutritionalValues.fat });
  });
  
  // Calculate statistics for each component
  const nutritionalTrends: any = {};
  Object.keys(timeSeriesData).forEach(component => {
    const stats = calculateTrendStatistics(timeSeriesData[component]);
    nutritionalTrends[component] = {
      current: stats.mean,
      previous: timeSeriesData[component][0]?.value || 0,
      trend: stats.trend,
      changePercentage: stats.changePercentage,
      significance: Math.abs(stats.changePercentage) > 10 ? 'high' : 'low',
      dataPoints: timeSeriesData[component],
      statistics: {
        mean: stats.mean,
        median: stats.median,
        standardDeviation: stats.standardDeviation,
        min: stats.min,
        max: stats.max
      },
      demographics: calculateDemographicBreakdown(data, component)
    };
  });
  
  return {
    nutritionalTrends: {
      calories: nutritionalTrends.calories,
      macronutrients: {
        protein: nutritionalTrends.protein,
        carbohydrates: nutritionalTrends.carbohydrates,
        fat: nutritionalTrends.fat
      },
      micronutrients: {} // Would be populated with vitamin/mineral analysis
    },
    growthPatterns: {
      correlations: calculateNutritionHealthCorrelations(data)
    },
    behavioralPatterns: {
      acceptanceRates: calculateAcceptanceRates(data),
      preferenceShifts: calculatePreferenceShifts(data)
    },
    seasonalInfluences: {
      seasonalTrends: calculateSeasonalTrends(data),
      climaticCorrelations: []
    }
  };
}

function calculateDemographicBreakdown(data: NutritionalDataPoint[], component: string): any {
  const ageGroups: Record<string, number> = {};
  const genderDistribution: Record<string, number> = {};
  
  data.forEach(point => {
    const ageGroup = point.demographicInfo.age < 6 ? 'under-6' : 
                    point.demographicInfo.age < 12 ? '6-11' : '12-18';
    
    if (!ageGroups[ageGroup]) ageGroups[ageGroup] = 0;
    if (!genderDistribution[point.demographicInfo.gender]) genderDistribution[point.demographicInfo.gender] = 0;
    
    ageGroups[ageGroup] += (point.nutritionalValues as any)[component] || 0;
    genderDistribution[point.demographicInfo.gender] += (point.nutritionalValues as any)[component] || 0;
  });
  
  return { ageGroups, genderDistribution };
}

function calculateAcceptanceRates(data: NutritionalDataPoint[]): Record<string, number> {
  const acceptanceRates: Record<string, number> = {};
  const mealTypeCounts: Record<string, number> = {};
  
  data.forEach(point => {
    if (!acceptanceRates[point.mealType]) acceptanceRates[point.mealType] = 0;
    if (!mealTypeCounts[point.mealType]) mealTypeCounts[point.mealType] = 0;
    
    acceptanceRates[point.mealType] += point.consumptionPercentage;
    mealTypeCounts[point.mealType] += 1;
  });
  
  Object.keys(acceptanceRates).forEach(mealType => {
    acceptanceRates[mealType] = acceptanceRates[mealType] / mealTypeCounts[mealType];
  });
  
  return acceptanceRates;
}

function calculatePreferenceShifts(data: NutritionalDataPoint[]): Array<{
  foodItem: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  magnitude: number;
}> {
  const preferenceTracking: Record<string, Array<{ date: string; count: number }>> = {};
  
  data.forEach(point => {
    point.preferences.forEach(preference => {
      if (!preferenceTracking[preference]) preferenceTracking[preference] = [];
      
      const existingEntry = preferenceTracking[preference].find(entry => 
        entry.date === point.timestamp.split('T')[0]
      );
      
      if (existingEntry) {
        existingEntry.count += 1;
      } else {
        preferenceTracking[preference].push({
          date: point.timestamp.split('T')[0],
          count: 1
        });
      }
    });
  });
  
  return Object.keys(preferenceTracking).map(foodItem => {
    const dataPoints = preferenceTracking[foodItem];
    const values = dataPoints.map(dp => dp.count);
    
    if (values.length < 2) {
      return { foodItem, trend: 'stable' as const, magnitude: 0 };
    }
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    return {
      foodItem,
      trend: Math.abs(change) < 5 ? 'stable' as const : change > 0 ? 'increasing' as const : 'decreasing' as const,
      magnitude: Math.abs(change)
    };
  }).filter(shift => shift.magnitude > 0);
}

function calculateSeasonalTrends(data: NutritionalDataPoint[]): Record<string, TrendData> {
  const seasonalData: Record<string, NutritionalDataPoint[]> = {
    spring: [],
    summer: [],
    fall: [],
    winter: []
  };
  
  data.forEach(point => {
    const month = new Date(point.timestamp).getMonth() + 1;
    const season = month >= 3 && month <= 5 ? 'spring' :
                  month >= 6 && month <= 8 ? 'summer' :
                  month >= 9 && month <= 11 ? 'fall' : 'winter';
    
    seasonalData[season].push(point);
  });
  
  const seasonalTrends: Record<string, TrendData> = {};
  
  Object.keys(seasonalData).forEach(season => {
    const seasonData = seasonalData[season];
    if (seasonData.length === 0) return;
    
    const avgCalories = seasonData.reduce((sum, point) => 
      sum + point.nutritionalValues.calories, 0) / seasonData.length;
    
    const timeSeriesPoints = seasonData.map(point => ({
      date: point.timestamp.split('T')[0],
      value: point.nutritionalValues.calories
    }));
    
    const stats = calculateTrendStatistics(timeSeriesPoints);
    
    seasonalTrends[season] = {
      current: avgCalories,
      previous: timeSeriesPoints[0]?.value || 0,
      trend: stats.trend,
      changePercentage: stats.changePercentage,
      significance: Math.abs(stats.changePercentage) > 15 ? 'high' : 'low',
      dataPoints: timeSeriesPoints,
      statistics: {
        mean: stats.mean,
        median: stats.median,
        standardDeviation: stats.standardDeviation,
        min: stats.min,
        max: stats.max
      },
      demographics: calculateDemographicBreakdown(seasonData, 'calories')
    };
  });
  
  return seasonalTrends;
}

function calculateNutritionHealthCorrelations(data: NutritionalDataPoint[]): Array<{
  metric1: string;
  metric2: string;
  correlation: number;
  significance: string;
}> {
  // Filter data with health metrics
  const healthData = data.filter(point => (point as any).healthMetrics);
  
  if (healthData.length < 10) {
    return [];
  }
  
  const correlations = [];
  
  // Correlation between calorie intake and BMI
  const calorieValues = healthData.map(point => point.nutritionalValues.calories);
  const bmiValues = healthData.map(point => (point as any).healthMetrics.bmi);
  
  const calorieCorrelation = calculateCorrelation(calorieValues, bmiValues);
  correlations.push({
    metric1: 'calorie_intake',
    metric2: 'bmi',
    correlation: calorieCorrelation,
    significance: Math.abs(calorieCorrelation) > 0.3 ? 'significant' : 'low'
  });
  
  return correlations;
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

// Generate predictive insights
function generatePredictiveInsights(trendData: any): any {
  const predictions = [];
  const scenarios = [];
  
  // Generate predictions based on trend analysis
  if (trendData.nutritionalTrends.calories) {
    const caloriesTrend = trendData.nutritionalTrends.calories;
    const predictedCalories = caloriesTrend.current + (caloriesTrend.changePercentage / 100 * caloriesTrend.current);
    
    predictions.push({
      metric: 'daily_calories',
      predictedValue: Math.round(predictedCalories),
      confidence: caloriesTrend.significance === 'high' ? 0.8 : 0.6,
      timeHorizon: '30_days'
    });
    
    // Generate risk scenarios
    if (caloriesTrend.trend === 'decreasing' && Math.abs(caloriesTrend.changePercentage) > 15) {
      scenarios.push({
        name: 'declining_nutrition_intake',
        description: 'Continued decline in caloric intake may lead to nutritional deficiencies',
        probability: 0.7,
        impact: 'high'
      });
    }
  }
  
  return {
    shortTermPredictions: predictions,
    scenarios
  };
}

// Generate comprehensive recommendations
function generateRecommendations(analysis: any): Array<{
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  expectedImpact: string;
}> {
  const recommendations = [];
  
  // Check for declining trends
  const nutritionalTrends = analysis.nutritionalTrends;
  
  if (nutritionalTrends.calories && nutritionalTrends.calories.trend === 'decreasing') {
    recommendations.push({
      priority: 'high' as const,
      category: 'nutrition_intervention',
      action: 'Implement calorie enhancement program with appealing meal options',
      expectedImpact: 'Increase daily caloric intake by 10-15% within 4 weeks'
    });
  }
  
  if (analysis.behavioralPatterns.acceptanceRates) {
    const lowAcceptanceRates = Object.entries(analysis.behavioralPatterns.acceptanceRates)
      .filter(([_, rate]) => (rate as number) < 70);
    
    if (lowAcceptanceRates.length > 0) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'menu_optimization',
        action: `Redesign meal options with low acceptance rates: ${lowAcceptanceRates.map(([meal, _]) => meal).join(', ')}`,
        expectedImpact: 'Improve meal acceptance rates by 20-30%'
      });
    }
  }
  
  return recommendations;
}

// Generate visualization configurations
function generateVisualizations(analysis: any): any {
  const chartConfigs = [];
  
  // Trend chart for calories
  if (analysis.nutritionalTrends.calories) {
    chartConfigs.push({
      type: 'line',
      title: 'Daily Calorie Intake Trends',
      data: {
        labels: analysis.nutritionalTrends.calories.dataPoints.map((dp: any) => dp.date),
        datasets: [{
          label: 'Calories',
          data: analysis.nutritionalTrends.calories.dataPoints.map((dp: any) => dp.value),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      }
    });
  }
  
  // Acceptance rate pie chart
  if (analysis.behavioralPatterns.acceptanceRates) {
    const acceptanceData = analysis.behavioralPatterns.acceptanceRates;
    chartConfigs.push({
      type: 'pie',
      title: 'Meal Acceptance Rates by Type',
      data: {
        labels: Object.keys(acceptanceData),
        datasets: [{
          data: Object.values(acceptanceData),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
        }]
      }
    });
  }
  
  return { chartConfigs };
}

// Store analysis results
async function storeAnalysisResults(analysisId: string, results: TrendAnalysisResult): Promise<void> {
  try {
    await dynamoDbClient.send(new PutCommand({
      TableName: process.env.TREND_ANALYSIS_TABLE_NAME || 'NutritionalTrendAnalysis',
      Item: {
        analysisId,
        ...results,
        createdAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days
      }
    }));
    
    console.log(`Stored trend analysis results: ${analysisId}`);
  } catch (error) {
    console.error('Error storing analysis results:', error);
    throw error;
  }
}

// Main Lambda handler
export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Nutritional Trend Analyzer - Event received:', JSON.stringify(event, null, 2));
  
  try {
    // Parse and validate request
    const body = event.body ? JSON.parse(event.body) : {};
    const validatedData = TrendAnalysisRequestSchema.parse(body);
    
    const analysisId = `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Starting trend analysis: ${analysisId}`);
    
    // Fetch nutritional data
    const nutritionalData = await fetchNutritionalData(
      validatedData.schoolId,
      validatedData.timeframe.startDate,
      validatedData.timeframe.endDate,
      validatedData.ageGroups as Array<{ min: number; max: number }> | undefined
    );
    
    if (nutritionalData.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'No nutritional data found for the specified criteria',
          analysisId
        })
      };
    }
    
    // Perform statistical analysis
    const statisticalAnalysis = performStatisticalAnalysis(nutritionalData);
    
    // AI-powered analysis (if requested)
    let aiInsights = null;
    if (validatedData.focusAreas.length > 0) {
      try {
        aiInsights = await analyzeTrendsWithAI(nutritionalData, validatedData.focusAreas, analysisId);
      } catch (error) {
        console.warn('AI analysis failed, continuing with statistical analysis only:', error);
      }
    }
    
    // Generate predictive insights
    const predictiveInsights = generatePredictiveInsights(statisticalAnalysis);
    
    // Generate recommendations
    const recommendations = generateRecommendations(statisticalAnalysis);
    
    // Generate visualizations
    const visualizations = validatedData.includeVisualizations ? 
      generateVisualizations(statisticalAnalysis) : { chartConfigs: [] };
    
    // Compile final results
    const results: TrendAnalysisResult = {
      analysisId,
      timestamp: new Date().toISOString(),
      timeframe: {
        startDate: validatedData.timeframe.startDate,
        endDate: validatedData.timeframe.endDate,
        totalDays: Math.ceil(
          (new Date(validatedData.timeframe.endDate).getTime() - 
           new Date(validatedData.timeframe.startDate).getTime()) / 
          (1000 * 60 * 60 * 24)
        )
      },
      trendAnalysis: statisticalAnalysis,
      comparativeAnalysis: {
        benchmarkComparison: {},
        peerGroupAnalysis: []
      },
      predictiveInsights,
      aiInsights: aiInsights || {
        keyFindings: ['Statistical analysis completed - AI insights unavailable'],
        recommendations,
        riskFactors: []
      },
      visualizations
    };
    
    // Store results
    await storeAnalysisResults(analysisId, results);
    
    // Format response based on output format
    let responseData;
    if (validatedData.outputFormat === 'summary') {
      responseData = {
        analysisId: results.analysisId,
        keyFindings: results.aiInsights.keyFindings,
        recommendations: results.aiInsights.recommendations.slice(0, 3),
        trends: {
          calories: statisticalAnalysis.nutritionalTrends.calories?.trend || 'unknown',
          overallHealth: statisticalAnalysis.nutritionalTrends.calories?.trend === 'increasing' ? 'improving' : 'concerning'
        }
      };
    } else {
      responseData = results;
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: responseData,
        metadata: {
          dataPoints: nutritionalData.length,
          analysisType: validatedData.focusAreas,
          processingTime: Date.now() - parseInt(analysisId.split('_')[1])
        }
      })
    };
    
  } catch (error) {
    console.error('Error in nutritional trend analyzer:', error);
    
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid request data',
          details: error.issues
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};