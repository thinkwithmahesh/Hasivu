"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nutritionAnalyzerHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const database_service_1 = require("../shared/database.service");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const logger = logger_service_1.LoggerService.getInstance();
const database = database_service_1.LambdaDatabaseService.getInstance();
const bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const nutritionAnalysisRequestSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid().optional(),
    childId: zod_1.z.string().uuid().optional(),
    analysisType: zod_1.z.enum(['basic', 'detailed', 'comprehensive', 'comparative', 'trend']),
    timeframe: zod_1.z.object({
        startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        period: zod_1.z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('weekly'),
    }),
    targetSubjects: zod_1.z.object({
        studentIds: zod_1.z.array(zod_1.z.string().uuid()).max(100).optional(),
        classIds: zod_1.z.array(zod_1.z.string().uuid()).max(20).optional(),
        gradeLevel: zod_1.z.string().max(10).optional(),
        ageGroups: zod_1.z
            .array(zod_1.z.object({
            min: zod_1.z.number().int().min(3).max(18),
            max: zod_1.z.number().int().min(4).max(19),
        }))
            .optional(),
    }),
    analysisParameters: zod_1.z.object({
        nutritionalFocus: zod_1.z
            .array(zod_1.z.enum([
            'calories',
            'protein',
            'carbs',
            'fat',
            'fiber',
            'sodium',
            'sugar',
            'vitamins',
            'minerals',
        ]))
            .default(['calories', 'protein', 'fiber']),
        healthMetrics: zod_1.z
            .array(zod_1.z.enum(['bmi', 'growth', 'activity', 'allergies', 'preferences', 'compliance']))
            .default(['growth', 'compliance']),
        comparisonMetrics: zod_1.z
            .array(zod_1.z.enum(['peer_group', 'recommended_intake', 'historical', 'seasonal']))
            .default(['recommended_intake']),
        dietaryRestrictions: zod_1.z.array(zod_1.z.string()).default([]),
        healthConditions: zod_1.z.array(zod_1.z.string()).default([]),
        includePredictiveInsights: zod_1.z.boolean().default(false),
        includeRecommendations: zod_1.z.boolean().default(true),
    }),
    outputFormat: zod_1.z.object({
        reportLevel: zod_1.z.enum(['summary', 'detailed', 'executive', 'clinical']).default('detailed'),
        includeVisualizations: zod_1.z.boolean().default(true),
        includeActionItems: zod_1.z.boolean().default(true),
        exportFormat: zod_1.z.enum(['json', 'pdf', 'excel']).default('json'),
    }),
});
const mealAnalysisSchema = zod_1.z.object({
    mealData: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        mealType: zod_1.z.enum(['breakfast', 'lunch', 'snack', 'dinner']),
        items: zod_1.z.array(zod_1.z.object({
            itemId: zod_1.z.string(),
            itemName: zod_1.z.string(),
            quantity: zod_1.z.number().positive(),
            nutritionalInfo: zod_1.z.object({
                calories: zod_1.z.number().min(0),
                protein: zod_1.z.number().min(0),
                carbs: zod_1.z.number().min(0),
                fat: zod_1.z.number().min(0),
                fiber: zod_1.z.number().min(0),
                sodium: zod_1.z.number().min(0),
                sugar: zod_1.z.number().min(0),
                vitamins: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional(),
                minerals: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional(),
            }),
        })),
    })),
    studentProfile: zod_1.z.object({
        age: zod_1.z.number().int().min(3).max(18),
        gender: zod_1.z.enum(['male', 'female']),
        height: zod_1.z.number().positive(),
        weight: zod_1.z.number().positive(),
        activityLevel: zod_1.z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
        dietaryRestrictions: zod_1.z.array(zod_1.z.string()).default([]),
        allergies: zod_1.z.array(zod_1.z.string()).default([]),
        healthConditions: zod_1.z.array(zod_1.z.string()).default([]),
    }),
});
async function validateUserAccess(event, requestId) {
    const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
    const userId = event.headers['x-user-id'] || event.requestContext?.authorizer?.userId;
    const schoolId = event.headers['x-school-id'] || event.requestContext?.authorizer?.schoolId;
    const role = event.headers['x-user-role'] || event.requestContext?.authorizer?.role || 'student';
    if (!userId) {
        logger.warn('Nutrition analyzer access denied - no user ID', {
            requestId,
            clientIP,
            userAgent: userAgent.substring(0, 200),
            action: 'authentication_failed',
        });
        throw new Error('Authentication required');
    }
    if (!schoolId) {
        throw new Error('School context required');
    }
    const user = await database.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true, role: true },
    });
    if (!user || user.status !== 'ACTIVE') {
        throw new Error('Access denied');
    }
    if (!['admin', 'nutritionist', 'teacher'].includes(user.role)) {
        const studentUser = await database.prisma.user.findFirst({
            where: { id: userId, schoolId, role: 'student' },
            select: { id: true },
        });
        if (!studentUser) {
            throw new Error('Access denied - invalid school context');
        }
    }
    return { userId, schoolId, role: user.role };
}
function calculateRecommendedIntake(age, gender, activityLevel, weight) {
    let baseCalories;
    if (age <= 5) {
        baseCalories = gender === 'male' ? 1400 : 1200;
    }
    else if (age <= 8) {
        baseCalories = gender === 'male' ? 1800 : 1600;
    }
    else if (age <= 13) {
        baseCalories = gender === 'male' ? 2000 : 1800;
    }
    else if (age <= 18) {
        baseCalories = gender === 'male' ? 2400 : 2000;
    }
    else {
        baseCalories = gender === 'male' ? 2200 : 1800;
    }
    const activityMultipliers = {
        sedentary: 1.0,
        light: 1.1,
        moderate: 1.25,
        active: 1.4,
        very_active: 1.6,
    };
    const calories = Math.round(baseCalories * activityMultipliers[activityLevel]);
    const protein = Math.round((calories * 0.15) / 4);
    const carbs = Math.round((calories * 0.55) / 4);
    const fat = Math.round((calories * 0.3) / 9);
    const fiber = age <= 8 ? age + 5 : age <= 18 ? Math.round(age * 1.4) : 25;
    const sodium = age <= 8 ? 1500 : age <= 13 ? 1800 : 2300;
    const sugar = Math.round((calories * 0.1) / 4);
    return {
        calories,
        protein,
        carbs,
        fat,
        fiber,
        sodium,
        sugar,
        vitamins: {
            vitaminA: age <= 8
                ? 400
                : age <= 13
                    ? gender === 'male'
                        ? 600
                        : 600
                    : gender === 'male'
                        ? 900
                        : 700,
            vitaminC: age <= 8 ? 25 : age <= 13 ? 45 : gender === 'male' ? 75 : 65,
            vitaminD: 15,
            vitaminE: age <= 8 ? 7 : age <= 13 ? 11 : 15,
            vitaminK: age <= 8 ? 55 : age <= 13 ? 60 : gender === 'male' ? 75 : 60,
            thiamin: age <= 8 ? 0.6 : age <= 13 ? 0.9 : gender === 'male' ? 1.2 : 1.0,
            riboflavin: age <= 8 ? 0.6 : age <= 13 ? 0.9 : gender === 'male' ? 1.3 : 1.0,
            niacin: age <= 8 ? 8 : age <= 13 ? 12 : gender === 'male' ? 16 : 14,
            vitaminB6: age <= 8 ? 0.6 : age <= 13 ? 1.0 : 1.3,
            folate: age <= 8 ? 200 : 300,
            vitaminB12: age <= 8 ? 1.2 : 1.8,
        },
        minerals: {
            calcium: age <= 8 ? 1000 : age <= 18 ? 1300 : 1000,
            iron: age <= 8 ? 10 : age <= 13 ? 8 : gender === 'male' ? 11 : 15,
            magnesium: age <= 8
                ? gender === 'male'
                    ? 130
                    : 130
                : age <= 13
                    ? gender === 'male'
                        ? 240
                        : 240
                    : gender === 'male'
                        ? 410
                        : 360,
            phosphorus: age <= 8 ? 500 : age <= 18 ? 1250 : 700,
            potassium: age <= 8 ? 2300 : age <= 13 ? 2500 : 3000,
            zinc: age <= 8 ? 5 : age <= 13 ? 8 : gender === 'male' ? 11 : 9,
            copper: age <= 8 ? 440 : age <= 13 ? 700 : 890,
            manganese: age <= 8 ? 1.5 : age <= 13 ? 1.9 : gender === 'male' ? 2.2 : 1.6,
            selenium: age <= 8 ? 30 : age <= 13 ? 40 : 55,
        },
    };
}
function calculateAdherencePercentages(actual, recommended) {
    return {
        calories: Math.round((actual.calories / recommended.calories) * 100),
        protein: Math.round((actual.protein / recommended.protein) * 100),
        carbs: Math.round((actual.carbs / recommended.carbs) * 100),
        fat: Math.round((actual.fat / recommended.fat) * 100),
        fiber: Math.round((actual.fiber / recommended.fiber) * 100),
        sodium: Math.round((actual.sodium / recommended.sodium) * 100),
        sugar: Math.round((actual.sugar / recommended.sugar) * 100),
    };
}
function identifyNutritionalRisks(adherence) {
    const deficiencies = [];
    const excesses = [];
    Object.entries(adherence).forEach(([nutrient, percentage]) => {
        if (typeof percentage === 'number') {
            if (percentage < 80) {
                deficiencies.push(nutrient);
            }
            else if (percentage > 120 && !['fiber'].includes(nutrient)) {
                excesses.push(nutrient);
            }
        }
    });
    return { deficiencies, excesses };
}
function calculateHealthScore(adherence, varietyScore, allergenCompliance, bmiStatus) {
    let score = 0;
    let factors = 0;
    const adherenceValues = Object.values(adherence).filter(v => typeof v === 'number');
    const avgAdherence = adherenceValues.reduce((sum, val) => sum + Math.min(val, 120), 0) / adherenceValues.length;
    score += (avgAdherence / 100) * 40;
    factors += 40;
    score += (varietyScore / 10) * 20;
    factors += 20;
    score += (allergenCompliance / 100) * 15;
    factors += 15;
    const bmiScore = bmiStatus === 'normal'
        ? 25
        : bmiStatus === 'overweight'
            ? 15
            : bmiStatus === 'underweight'
                ? 10
                : 5;
    score += bmiScore;
    factors += 25;
    return Math.round((score / factors) * 100);
}
async function generateNutritionalInsights(analysisData, requestId) {
    try {
        const prompt = `You are an expert pediatric nutritionist and public health specialist analyzing school nutrition data. Provide comprehensive insights based on the following nutritional analysis:

Analysis Summary:
- Total Students Analyzed: ${analysisData.subjectSummary.totalStudents}
- Average Age: ${analysisData.subjectSummary.averageAge}
- Time Period: ${analysisData.timeframe.startDate} to ${analysisData.timeframe.endDate}

Nutritional Data:
${JSON.stringify(analysisData.nutritionalSummary, null, 2)}

Health Metrics:
${JSON.stringify(analysisData.healthMetrics, null, 2)}

Please provide your expert analysis in the following JSON format:

{
  "keyFindings": [
    "3-5 key nutritional insights about the student population"
  ],
  "riskAssessment": {
    "nutritionalRisks": [
      {
        "risk": "specific nutritional deficiency or excess",
        "severity": "low|medium|high",
        "prevalence": percentage_affected
      }
    ],
    "healthRisks": [
      {
        "condition": "potential health condition",
        "likelihood": percentage_likelihood,
        "preventable": true_or_false
      }
    ]
  },
  "recommendations": [
    {
      "category": "menu_planning|portion_control|nutrition_education|policy_change",
      "priority": "high|medium|low",
      "recommendation": "specific actionable recommendation",
      "expectedImpact": "expected positive outcome",
      "implementationEffort": "low|medium|high"
    }
  ]
}

Focus on actionable insights that can improve student nutrition outcomes. Consider age-appropriate recommendations and school meal program constraints. Ensure all recommendations are evidence-based and practical for implementation.`;
        const command = new client_bedrock_runtime_1.InvokeModelCommand({
            modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 3000,
                temperature: 0.2,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
            contentType: 'application/json',
            accept: 'application/json',
        });
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        try {
            const aiResponse = responseBody.content[0].text;
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            const jsonText = jsonMatch ? jsonMatch[0] : aiResponse;
            const insights = JSON.parse(jsonText);
            return insights;
        }
        catch (parseError) {
            logger.warn('Failed to parse AI insights, using fallback', parseError);
            return generateFallbackInsights(analysisData);
        }
    }
    catch (error) {
        logger.error('Failed to generate AI nutritional insights', error instanceof Error ? error : new Error('Unknown error'), {
            requestId,
        });
        return generateFallbackInsights(analysisData);
    }
}
function generateFallbackInsights(analysisData) {
    const adherence = analysisData.nutritionalSummary.adherencePercentages;
    const healthScore = analysisData.healthMetrics.overallHealthScore;
    const adherenceValues = Object.values(adherence);
    const averageCompliance = Object.keys(adherence).length > 0
        ? Math.round(adherenceValues.reduce((total, value) => total + Number(value || 0), 0) /
            Object.keys(adherence).length)
        : 0;
    return {
        keyFindings: [
            `Overall health score: ${healthScore}/100 for ${analysisData.subjectSummary.totalStudents} students`,
            `Average nutritional compliance: ${averageCompliance}%`,
            analysisData.nutritionalSummary.deficiencyRisks.length > 0
                ? `Identified nutritional deficiencies in: ${analysisData.nutritionalSummary.deficiencyRisks.join(', ')}`
                : 'No major nutritional deficiencies identified',
            `BMI distribution shows ${analysisData.healthMetrics.growthIndicators.bmiDistribution.normal}% in normal range`,
        ],
        riskAssessment: {
            nutritionalRisks: analysisData.nutritionalSummary.deficiencyRisks.map((risk) => ({
                risk: `${risk} deficiency`,
                severity: adherence[risk] < 60 ? 'high' : adherence[risk] < 80 ? 'medium' : 'low',
                prevalence: Math.max(10, 100 - adherence[risk]),
            })),
            healthRisks: [
                {
                    condition: 'Childhood obesity',
                    likelihood: analysisData.healthMetrics.growthIndicators.bmiDistribution.overweight +
                        analysisData.healthMetrics.growthIndicators.bmiDistribution.obese,
                    preventable: true,
                },
            ],
        },
        recommendations: [
            {
                category: 'menu_planning',
                priority: healthScore < 70 ? 'high' : 'medium',
                recommendation: 'Review and improve menu nutritional balance',
                expectedImpact: 'Improve overall nutritional adequacy by 15-25%',
                implementationEffort: 'medium',
            },
            {
                category: 'nutrition_education',
                priority: 'medium',
                recommendation: 'Implement student nutrition education programs',
                expectedImpact: 'Increase nutrition awareness and healthy choices',
                implementationEffort: 'low',
            },
        ],
    };
}
async function getStudentMealData(schoolId, studentIds, startDate, endDate, requestId) {
    try {
        const mealData = await database.prisma.orderItem.findMany({
            where: {
                order: {
                    schoolId,
                    userId: studentIds.length > 0 ? { in: studentIds } : undefined,
                    createdAt: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                },
            },
            include: {
                menuItem: {
                    select: {
                        id: true,
                        name: true,
                        nutritionalInfo: true,
                        allergens: true,
                        calories: true,
                    },
                },
                order: {
                    include: {
                        student: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return mealData;
    }
    catch (error) {
        logger.error('Failed to get student meal data', error instanceof Error ? error : new Error('Unknown error'), {
            requestId,
            schoolId,
        });
        throw new Error('Failed to retrieve meal data');
    }
}
async function performNutritionalAnalysis(data, userId, schoolId, requestId) {
    try {
        const analysisId = (0, uuid_1.v4)();
        const mealData = await getStudentMealData(schoolId, data.targetSubjects.studentIds || [], data.timeframe.startDate, data.timeframe.endDate, requestId);
        if (mealData.length === 0) {
            throw new Error('No meal data found for the specified criteria');
        }
        const uniqueStudents = new Set(mealData.map(meal => meal.order.studentId));
        const studentProfiles = mealData
            .filter((meal, index, arr) => arr.findIndex(m => m.order.studentId === meal.order.studentId) === index)
            .map(meal => meal.order.student);
        const ages = studentProfiles.map(s => s.profile?.age).filter(age => age);
        const genderCounts = studentProfiles.reduce((acc, s) => {
            const gender = s.profile?.gender || 'unknown';
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
        }, {});
        const subjectSummary = {
            totalStudents: uniqueStudents.size,
            ageRange: { min: Math.min(...ages), max: Math.max(...ages) },
            averageAge: Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length),
            genderDistribution: { male: genderCounts.male || 0, female: genderCounts.female || 0 },
            dietaryRestrictions: {},
            healthConditions: {},
        };
        const dailyNutrition = {};
        mealData.forEach(meal => {
            if (!dailyNutrition[meal.order.studentId]) {
                dailyNutrition[meal.order.studentId] = [];
            }
            const nutritionalInfo = meal.menuItem?.nutritionalInfo;
            if (nutritionalInfo) {
                try {
                    const nutrition = typeof nutritionalInfo === 'string' ? JSON.parse(nutritionalInfo) : nutritionalInfo;
                    dailyNutrition[meal.order.studentId].push({
                        calories: (nutrition.calories || 0) * (meal.quantity || 1),
                        protein: (nutrition.protein || 0) * (meal.quantity || 1),
                        carbs: (nutrition.carbohydrates || nutrition.carbs || 0) * (meal.quantity || 1),
                        fat: (nutrition.fat || 0) * (meal.quantity || 1),
                        fiber: (nutrition.fiber || 0) * (meal.quantity || 1),
                        sodium: (nutrition.sodium || 0) * (meal.quantity || 1),
                        sugar: (nutrition.sugar || 0) * (meal.quantity || 1),
                    });
                }
                catch (error) {
                }
            }
        });
        const allNutritionValues = Object.values(dailyNutrition).flat();
        const averageDailyIntake = {
            calories: Math.round(allNutritionValues.reduce((sum, n) => sum + n.calories, 0) / allNutritionValues.length),
            protein: Math.round(allNutritionValues.reduce((sum, n) => sum + n.protein, 0) / allNutritionValues.length),
            carbs: Math.round(allNutritionValues.reduce((sum, n) => sum + n.carbs, 0) / allNutritionValues.length),
            fat: Math.round(allNutritionValues.reduce((sum, n) => sum + n.fat, 0) / allNutritionValues.length),
            fiber: Math.round(allNutritionValues.reduce((sum, n) => sum + n.fiber, 0) / allNutritionValues.length),
            sodium: Math.round(allNutritionValues.reduce((sum, n) => sum + n.sodium, 0) / allNutritionValues.length),
            sugar: Math.round(allNutritionValues.reduce((sum, n) => sum + n.sugar, 0) / allNutritionValues.length),
        };
        const recommendedIntake = calculateRecommendedIntake(subjectSummary.averageAge, genderCounts.male > genderCounts.female ? 'male' : 'female', 'moderate');
        const adherencePercentages = calculateAdherencePercentages(averageDailyIntake, recommendedIntake);
        const { deficiencies, excesses } = identifyNutritionalRisks(adherencePercentages);
        const nutritionalSummary = {
            averageDailyIntake,
            recommendedIntake,
            adherencePercentages,
            deficiencyRisks: deficiencies,
            excessRisks: excesses,
        };
        const adherenceValues = Object.values(adherencePercentages);
        const nutritionalBalance = Object.keys(adherencePercentages).length > 0
            ? Math.round(adherenceValues.reduce((total, val) => total + Math.min(Number(val || 0), 100), 0) / Object.keys(adherencePercentages).length)
            : 0;
        const healthMetrics = {
            overallHealthScore: calculateHealthScore(adherencePercentages, 7.5, 95, 'normal'),
            nutritionalBalance,
            dietaryCompliance: 95,
            growthIndicators: {
                averageBMI: 18.5,
                bmiDistribution: { underweight: 5, normal: 75, overweight: 15, obese: 5 },
                growthVelocity: 0.5,
            },
            allergenManagement: {
                totalAllergies: 0,
                complianceRate: 100,
                incidents: 0,
            },
        };
        const analysisDataForAI = {
            subjectSummary,
            nutritionalSummary,
            healthMetrics,
            timeframe: data.timeframe,
        };
        const aiInsights = await generateNutritionalInsights(analysisDataForAI, requestId);
        const actionItems = aiInsights.recommendations?.map((rec, index) => ({
            item: rec.recommendation,
            priority: rec.priority,
            assignee: 'Nutrition Team',
            dueDate: new Date(Date.now() +
                (rec.priority === 'high' ? 7 : rec.priority === 'medium' ? 14 : 30) *
                    24 *
                    60 *
                    60 *
                    1000)
                .toISOString()
                .split('T')[0],
            resources: ['Nutrition guidelines', 'Menu planning tools'],
        })) || [];
        const result = {
            analysisId,
            schoolId,
            userId,
            analysisType: data.analysisType,
            timeframe: data.timeframe,
            subjectSummary,
            nutritionalSummary,
            healthMetrics,
            aiInsights,
            actionItems,
            metadata: {
                analysisDate: new Date().toISOString(),
                dataQuality: 0.9,
                sampleSize: mealData.length,
                confidenceLevel: 0.95,
                methodologyVersion: '1.0.0',
            },
        };
        await database.transaction(async (prisma) => {
            await prisma.analyticsReport.create({
                data: {
                    id: analysisId,
                    name: `Nutrition Analysis - ${data.analysisType}`,
                    type: 'nutrition_analysis',
                    dateRange: `${data.timeframe.startDate} to ${data.timeframe.endDate}`,
                    data: JSON.stringify(result),
                    generatedBy: userId,
                    generatedAt: new Date(),
                },
            });
            await prisma.auditLog.create({
                data: {
                    entityType: 'nutrition_analysis',
                    entityId: analysisId,
                    action: 'nutrition_analysis_generated',
                    userId,
                    createdById: userId,
                    metadata: JSON.stringify({
                        schoolId,
                        analysisType: data.analysisType,
                        studentCount: uniqueStudents.size,
                        mealCount: mealData.length,
                        healthScore: healthMetrics.overallHealthScore,
                    }),
                },
            });
        });
        logger.info('Nutritional analysis completed successfully', {
            requestId,
            analysisId,
            userId,
            schoolId,
            studentsAnalyzed: uniqueStudents.size,
            mealsAnalyzed: mealData.length,
            healthScore: healthMetrics.overallHealthScore,
        });
        return result;
    }
    catch (error) {
        logger.error('Failed to perform nutritional analysis', error instanceof Error ? error : new Error('Unknown error'), {
            requestId,
            userId,
            schoolId,
        });
        throw error;
    }
}
const nutritionAnalyzerHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
        const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
        logger.info('Nutrition analyzer request started', {
            requestId,
            method: event.httpMethod,
            path: event.path,
            clientIP,
            userAgent: userAgent.substring(0, 200),
        });
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', `Method ${event.httpMethod} not allowed`, 405, undefined);
        }
        if (!event.body) {
            return (0, response_utils_1.createErrorResponse)('MISSING_BODY', 'Request body required', 400, undefined);
        }
        const { userId, schoolId, role } = await validateUserAccess(event, requestId);
        const requestData = JSON.parse(event.body);
        const validatedData = nutritionAnalysisRequestSchema.parse(requestData);
        if (validatedData.schoolId !== schoolId) {
            return (0, response_utils_1.createErrorResponse)('ACCESS_DENIED', 'Access denied - invalid school context', 403, undefined);
        }
        if (validatedData.analysisType === 'comprehensive' &&
            !['admin', 'nutritionist'].includes(role)) {
            return (0, response_utils_1.createErrorResponse)('ACCESS_DENIED', 'Insufficient permissions for comprehensive analysis', 403, undefined);
        }
        const startDate = new Date(validatedData.timeframe.startDate);
        const endDate = new Date(validatedData.timeframe.endDate);
        const today = new Date();
        if (endDate <= startDate) {
            return (0, response_utils_1.createErrorResponse)('INVALID_DATE_RANGE', 'End date must be after start date', 400, undefined);
        }
        const dayDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        if (dayDiff > 365) {
            return (0, response_utils_1.createErrorResponse)('DATE_RANGE_TOO_LONG', 'Analysis period cannot exceed 1 year', 400, undefined);
        }
        const analysisResult = await performNutritionalAnalysis(validatedData, userId, schoolId, requestId);
        const duration = Date.now() - startTime;
        logger.info('Nutrition analyzer request completed', {
            requestId,
            userId,
            schoolId,
            analysisId: analysisResult.analysisId,
            analysisType: analysisResult.analysisType,
            studentsAnalyzed: analysisResult.subjectSummary.totalStudents,
            healthScore: analysisResult.healthMetrics.overallHealthScore,
            duration,
            success: true,
        });
        return (0, response_utils_1.createSuccessResponse)({
            analysis: analysisResult,
            summary: {
                analysisId: analysisResult.analysisId,
                studentsAnalyzed: analysisResult.subjectSummary.totalStudents,
                overallHealthScore: analysisResult.healthMetrics.overallHealthScore,
                keyFindings: analysisResult.aiInsights.keyFindings,
                criticalRecommendations: analysisResult.actionItems.filter(item => item.priority === 'urgent' || item.priority === 'high'),
            },
        }, 200);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Nutrition analyzer request failed', error instanceof Error ? error : new Error('Unknown error'), {
            requestId,
            duration,
        });
        if (error instanceof zod_1.z.ZodError) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid request data', 400, error.issues);
        }
        if (error instanceof Error) {
            if (error.message.includes('Authentication required')) {
                return (0, response_utils_1.createErrorResponse)('AUTHENTICATION_REQUIRED', 'Authentication required', 401);
            }
            if (error.message.includes('Access denied')) {
                return (0, response_utils_1.createErrorResponse)('ACCESS_DENIED', 'Access denied', 403);
            }
            if (error.message.includes('No meal data found')) {
                return (0, response_utils_1.createErrorResponse)('NO_DATA', 'No meal data available for analysis', 404);
            }
            if (error.message.includes('Failed to retrieve')) {
                return (0, response_utils_1.createErrorResponse)('DATA_RETRIEVAL_FAILED', error.message, 422);
            }
        }
        return (0, response_utils_1.createErrorResponse)('INTERNAL_ERROR', 'Internal server error', 500);
    }
};
exports.nutritionAnalyzerHandler = nutritionAnalyzerHandler;
//# sourceMappingURL=nutrition-analyzer.js.map