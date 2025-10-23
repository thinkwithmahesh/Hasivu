"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client_sagemaker_runtime_1 = require("@aws-sdk/client-sagemaker-runtime");
const zod_1 = require("zod");
const dynamoDbClient = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient({}));
const bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: 'us-east-1' });
const sageMakerClient = new client_sagemaker_runtime_1.SageMakerRuntimeClient({ region: 'us-east-1' });
const TrendAnalysisRequestSchema = zod_1.z.object({
    schoolId: zod_1.z.string().min(1),
    ageGroups: zod_1.z
        .array(zod_1.z.object({
        min: zod_1.z.number().min(0).max(18),
        max: zod_1.z.number().min(0).max(18),
    }))
        .optional(),
    timeframe: zod_1.z.object({
        startDate: zod_1.z.string(),
        endDate: zod_1.z.string(),
        granularity: zod_1.z.enum(['daily', 'weekly', 'monthly']),
    }),
    focusAreas: zod_1.z.array(zod_1.z.enum(['nutrition', 'growth', 'preferences', 'health', 'behavior', 'seasonal'])),
    comparisonMetrics: zod_1.z.array(zod_1.z.string()).optional(),
    outputFormat: zod_1.z.enum(['summary', 'detailed', 'executive']).default('summary'),
    includeVisualizations: zod_1.z.boolean().default(true),
    includePredictions: zod_1.z.boolean().default(false),
});
async function fetchNutritionalData(schoolId, startDate, endDate, ageGroups) {
    const data = [];
    const intakeResult = await dynamoDbClient.send(new lib_dynamodb_1.QueryCommand({
        TableName: process.env.NUTRITION_TABLE_NAME || 'NutritionIntake',
        KeyConditionExpression: 'schoolId = :schoolId',
        FilterExpression: '#timestamp BETWEEN :startDate AND :endDate',
        ExpressionAttributeNames: {
            '#timestamp': 'timestamp',
        },
        ExpressionAttributeValues: {
            ':schoolId': schoolId,
            ':startDate': startDate,
            ':endDate': endDate,
        },
    }));
    data.push(...(intakeResult.Items || []));
    const mealPlanResult = await dynamoDbClient.send(new lib_dynamodb_1.QueryCommand({
        TableName: process.env.MEAL_PLANS_TABLE_NAME || 'MealPlans',
        KeyConditionExpression: 'schoolId = :schoolId',
        FilterExpression: '#dateServed BETWEEN :startDate AND :endDate',
        ExpressionAttributeNames: {
            '#dateServed': 'dateServed',
        },
        ExpressionAttributeValues: {
            ':schoolId': schoolId,
            ':startDate': startDate,
            ':endDate': endDate,
        },
    }));
    const mealPlanData = mealPlanResult.Items || [];
    const enrichedData = data.map(point => {
        const mealPlan = mealPlanData.find(mp => mp.dateServed === point.timestamp.split('T')[0] && mp.mealType === point.mealType);
        return {
            ...point,
            plannedNutrition: mealPlan?.nutritionalValues || null,
            variance: mealPlan
                ? calculateNutritionalVariance(point.nutritionalValues, mealPlan.nutritionalValues)
                : null,
        };
    });
    const healthResult = await dynamoDbClient.send(new lib_dynamodb_1.ScanCommand({
        TableName: process.env.CHILD_HEALTH_TABLE_NAME || 'ChildHealth',
        FilterExpression: 'schoolId = :schoolId',
        ExpressionAttributeValues: {
            ':schoolId': schoolId,
        },
    }));
    const healthData = healthResult.Items || [];
    let filteredData = enrichedData;
    if (ageGroups && ageGroups.length > 0) {
        filteredData = enrichedData.filter(point => {
            return ageGroups.some(group => point.demographicInfo.age >= group.min && point.demographicInfo.age <= group.max);
        });
    }
    const dataWithHealthInfo = filteredData.map(point => {
        const healthInfo = healthData.find(h => h.studentId === point.studentId);
        return {
            ...point,
            healthMetrics: healthInfo
                ? {
                    height: healthInfo.height,
                    weight: healthInfo.weight,
                    bmi: healthInfo.bmi,
                    growthPercentile: healthInfo.growthPercentile,
                }
                : null,
        };
    });
    return dataWithHealthInfo;
}
function calculateNutritionalVariance(actual, planned) {
    const variance = {};
    const keys = ['calories', 'protein', 'carbohydrates', 'fat', 'fiber'];
    keys.forEach(key => {
        if (actual[key] !== undefined && planned[key] !== undefined) {
            variance[key] = ((actual[key] - planned[key]) / planned[key]) * 100;
        }
    });
    return variance;
}
async function analyzeTrendsWithAI(data, focusAreas, analysisId) {
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
        const command = new client_bedrock_runtime_1.InvokeModelCommand({
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 4000,
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
        return JSON.parse(responseBody.content[0].text);
    }
    catch (error) {
        return {
            trendAnalysis: {
                nutritionalTrends: { error: 'AI analysis failed, using statistical fallback' },
                behavioralPatterns: {},
                seasonalInfluences: {},
            },
            keyFindings: ['AI analysis unavailable - manual review recommended'],
            recommendations: [
                {
                    priority: 'high',
                    category: 'system',
                    action: 'Review AI analysis configuration',
                    expectedImpact: 'Restored comprehensive trend insights',
                },
            ],
            riskFactors: [],
            confidenceScores: { overall: 0.3 },
        };
    }
}
function calculateTrendStatistics(dataPoints) {
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
        changePercentage,
    };
}
function performStatisticalAnalysis(data) {
    const timeSeriesData = {};
    data.forEach(point => {
        const date = point.timestamp.split('T')[0];
        if (!timeSeriesData.calories)
            timeSeriesData.calories = [];
        if (!timeSeriesData.protein)
            timeSeriesData.protein = [];
        if (!timeSeriesData.carbohydrates)
            timeSeriesData.carbohydrates = [];
        if (!timeSeriesData.fat)
            timeSeriesData.fat = [];
        timeSeriesData.calories.push({ date, value: point.nutritionalValues.calories });
        timeSeriesData.protein.push({ date, value: point.nutritionalValues.protein });
        timeSeriesData.carbohydrates.push({ date, value: point.nutritionalValues.carbohydrates });
        timeSeriesData.fat.push({ date, value: point.nutritionalValues.fat });
    });
    const nutritionalTrends = {};
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
                max: stats.max,
            },
            demographics: calculateDemographicBreakdown(data, component),
        };
    });
    return {
        nutritionalTrends: {
            calories: nutritionalTrends.calories,
            macronutrients: {
                protein: nutritionalTrends.protein,
                carbohydrates: nutritionalTrends.carbohydrates,
                fat: nutritionalTrends.fat,
            },
            micronutrients: {},
        },
        growthPatterns: {
            correlations: calculateNutritionHealthCorrelations(data),
        },
        behavioralPatterns: {
            acceptanceRates: calculateAcceptanceRates(data),
            preferenceShifts: calculatePreferenceShifts(data),
        },
        seasonalInfluences: {
            seasonalTrends: calculateSeasonalTrends(data),
            climaticCorrelations: [],
        },
    };
}
function calculateDemographicBreakdown(data, component) {
    const ageGroups = {};
    const genderDistribution = {};
    data.forEach(point => {
        const ageGroup = point.demographicInfo.age < 6 ? 'under-6' : point.demographicInfo.age < 12 ? '6-11' : '12-18';
        if (!ageGroups[ageGroup])
            ageGroups[ageGroup] = 0;
        if (!genderDistribution[point.demographicInfo.gender])
            genderDistribution[point.demographicInfo.gender] = 0;
        ageGroups[ageGroup] += point.nutritionalValues[component] || 0;
        genderDistribution[point.demographicInfo.gender] +=
            point.nutritionalValues[component] || 0;
    });
    return { ageGroups, genderDistribution };
}
function calculateAcceptanceRates(data) {
    const acceptanceRates = {};
    const mealTypeCounts = {};
    data.forEach(point => {
        if (!acceptanceRates[point.mealType])
            acceptanceRates[point.mealType] = 0;
        if (!mealTypeCounts[point.mealType])
            mealTypeCounts[point.mealType] = 0;
        acceptanceRates[point.mealType] += point.consumptionPercentage;
        mealTypeCounts[point.mealType] += 1;
    });
    Object.keys(acceptanceRates).forEach(mealType => {
        acceptanceRates[mealType] = acceptanceRates[mealType] / mealTypeCounts[mealType];
    });
    return acceptanceRates;
}
function calculatePreferenceShifts(data) {
    const preferenceTracking = {};
    data.forEach(point => {
        point.preferences.forEach(preference => {
            if (!preferenceTracking[preference])
                preferenceTracking[preference] = [];
            const existingEntry = preferenceTracking[preference].find(entry => entry.date === point.timestamp.split('T')[0]);
            if (existingEntry) {
                existingEntry.count += 1;
            }
            else {
                preferenceTracking[preference].push({
                    date: point.timestamp.split('T')[0],
                    count: 1,
                });
            }
        });
    });
    return Object.keys(preferenceTracking)
        .map(foodItem => {
        const dataPoints = preferenceTracking[foodItem];
        const values = dataPoints.map(dp => dp.count);
        if (values.length < 2) {
            return { foodItem, trend: 'stable', magnitude: 0 };
        }
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        return {
            foodItem,
            trend: Math.abs(change) < 5
                ? 'stable'
                : change > 0
                    ? 'increasing'
                    : 'decreasing',
            magnitude: Math.abs(change),
        };
    })
        .filter(shift => shift.magnitude > 0);
}
function calculateSeasonalTrends(data) {
    const seasonalData = {
        spring: [],
        summer: [],
        fall: [],
        winter: [],
    };
    data.forEach(point => {
        const month = new Date(point.timestamp).getMonth() + 1;
        const season = month >= 3 && month <= 5
            ? 'spring'
            : month >= 6 && month <= 8
                ? 'summer'
                : month >= 9 && month <= 11
                    ? 'fall'
                    : 'winter';
        seasonalData[season].push(point);
    });
    const seasonalTrends = {};
    Object.keys(seasonalData).forEach(season => {
        const seasonData = seasonalData[season];
        if (seasonData.length === 0)
            return;
        const avgCalories = seasonData.reduce((sum, point) => sum + point.nutritionalValues.calories, 0) /
            seasonData.length;
        const timeSeriesPoints = seasonData.map(point => ({
            date: point.timestamp.split('T')[0],
            value: point.nutritionalValues.calories,
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
                max: stats.max,
            },
            demographics: calculateDemographicBreakdown(seasonData, 'calories'),
        };
    });
    return seasonalTrends;
}
function calculateNutritionHealthCorrelations(data) {
    const healthData = data.filter(point => point.healthMetrics);
    if (healthData.length < 10) {
        return [];
    }
    const correlations = [];
    const calorieValues = healthData.map(point => point.nutritionalValues.calories);
    const bmiValues = healthData.map(point => point.healthMetrics.bmi);
    const calorieCorrelation = calculateCorrelation(calorieValues, bmiValues);
    correlations.push({
        metric1: 'calorie_intake',
        metric2: 'bmi',
        correlation: calorieCorrelation,
        significance: Math.abs(calorieCorrelation) > 0.3 ? 'significant' : 'low',
    });
    return correlations;
}
function calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0)
        return 0;
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
function generatePredictiveInsights(trendData) {
    const predictions = [];
    const scenarios = [];
    if (trendData.nutritionalTrends.calories) {
        const caloriesTrend = trendData.nutritionalTrends.calories;
        const predictedCalories = caloriesTrend.current + (caloriesTrend.changePercentage / 100) * caloriesTrend.current;
        predictions.push({
            metric: 'daily_calories',
            predictedValue: Math.round(predictedCalories),
            confidence: caloriesTrend.significance === 'high' ? 0.8 : 0.6,
            timeHorizon: '30_days',
        });
        if (caloriesTrend.trend === 'decreasing' && Math.abs(caloriesTrend.changePercentage) > 15) {
            scenarios.push({
                name: 'declining_nutrition_intake',
                description: 'Continued decline in caloric intake may lead to nutritional deficiencies',
                probability: 0.7,
                impact: 'high',
            });
        }
    }
    return {
        shortTermPredictions: predictions,
        scenarios,
    };
}
function generateRecommendations(analysis) {
    const recommendations = [];
    const { nutritionalTrends } = analysis;
    if (nutritionalTrends.calories && nutritionalTrends.calories.trend === 'decreasing') {
        recommendations.push({
            priority: 'high',
            category: 'nutrition_intervention',
            action: 'Implement calorie enhancement program with appealing meal options',
            expectedImpact: 'Increase daily caloric intake by 10-15% within 4 weeks',
        });
    }
    if (analysis.behavioralPatterns.acceptanceRates) {
        const lowAcceptanceRates = Object.entries(analysis.behavioralPatterns.acceptanceRates).filter(([_, rate]) => rate < 70);
        if (lowAcceptanceRates.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'menu_optimization',
                action: `Redesign meal options with low acceptance rates: ${lowAcceptanceRates.map(([meal, _]) => meal).join(', ')}`,
                expectedImpact: 'Improve meal acceptance rates by 20-30%',
            });
        }
    }
    return recommendations;
}
function generateVisualizations(analysis) {
    const chartConfigs = [];
    if (analysis.nutritionalTrends.calories) {
        chartConfigs.push({
            type: 'line',
            title: 'Daily Calorie Intake Trends',
            data: {
                labels: analysis.nutritionalTrends.calories.dataPoints.map((dp) => dp.date),
                datasets: [
                    {
                        label: 'Calories',
                        data: analysis.nutritionalTrends.calories.dataPoints.map((dp) => dp.value),
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                    },
                ],
            },
        });
    }
    if (analysis.behavioralPatterns.acceptanceRates) {
        const acceptanceData = analysis.behavioralPatterns.acceptanceRates;
        chartConfigs.push({
            type: 'pie',
            title: 'Meal Acceptance Rates by Type',
            data: {
                labels: Object.keys(acceptanceData),
                datasets: [
                    {
                        data: Object.values(acceptanceData),
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
                    },
                ],
            },
        });
    }
    return { chartConfigs };
}
async function storeAnalysisResults(analysisId, results) {
    await dynamoDbClient.send(new lib_dynamodb_1.PutCommand({
        TableName: process.env.TREND_ANALYSIS_TABLE_NAME || 'NutritionalTrendAnalysis',
        Item: {
            ...results,
            createdAt: new Date().toISOString(),
            ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
        },
    }));
}
const handler = async (event) => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const validatedData = TrendAnalysisRequestSchema.parse(body);
        const analysisId = `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const nutritionalData = await fetchNutritionalData(validatedData.schoolId, validatedData.timeframe.startDate, validatedData.timeframe.endDate, validatedData.ageGroups);
        if (nutritionalData.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    success: false,
                    error: 'No nutritional data found for the specified criteria',
                    analysisId,
                }),
            };
        }
        const statisticalAnalysis = performStatisticalAnalysis(nutritionalData);
        let aiInsights = null;
        if (validatedData.focusAreas.length > 0) {
            try {
                aiInsights = await analyzeTrendsWithAI(nutritionalData, validatedData.focusAreas, analysisId);
            }
            catch (error) {
            }
        }
        const predictiveInsights = generatePredictiveInsights(statisticalAnalysis);
        const recommendations = generateRecommendations(statisticalAnalysis);
        const visualizations = validatedData.includeVisualizations
            ? generateVisualizations(statisticalAnalysis)
            : { chartConfigs: [] };
        const results = {
            analysisId,
            timestamp: new Date().toISOString(),
            timeframe: {
                startDate: validatedData.timeframe.startDate,
                endDate: validatedData.timeframe.endDate,
                totalDays: Math.ceil((new Date(validatedData.timeframe.endDate).getTime() -
                    new Date(validatedData.timeframe.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)),
            },
            trendAnalysis: statisticalAnalysis,
            comparativeAnalysis: {
                benchmarkComparison: {},
                peerGroupAnalysis: [],
            },
            predictiveInsights,
            aiInsights: aiInsights || {
                keyFindings: ['Statistical analysis completed - AI insights unavailable'],
                recommendations,
                riskFactors: [],
            },
            visualizations,
        };
        await storeAnalysisResults(analysisId, results);
        let responseData;
        if (validatedData.outputFormat === 'summary') {
            responseData = {
                analysisId: results.analysisId,
                keyFindings: results.aiInsights.keyFindings,
                recommendations: results.aiInsights.recommendations.slice(0, 3),
                trends: {
                    calories: statisticalAnalysis.nutritionalTrends.calories?.trend || 'unknown',
                    overallHealth: statisticalAnalysis.nutritionalTrends.calories?.trend === 'increasing'
                        ? 'improving'
                        : 'concerning',
                },
            };
        }
        else {
            responseData = results;
        }
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                data: responseData,
                metadata: {
                    dataPoints: nutritionalData.length,
                    analysisType: validatedData.focusAreas,
                    processingTime: Date.now() - parseInt(analysisId.split('_')[1]),
                },
            }),
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid request data',
                    details: error.issues,
                }),
            };
        }
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=nutritional-trend-analyzer.js.map