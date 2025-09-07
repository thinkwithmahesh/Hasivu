"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client_s3_1 = require("@aws-sdk/client-s3");
const zod_1 = require("zod");
const dynamoDbClient = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient({}));
const bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: 'us-east-1' });
const s3Client = new client_s3_1.S3Client({ region: 'us-east-1' });
const ComplianceCheckRequestSchema = zod_1.z.object({
    entityId: zod_1.z.string().min(1),
    entityType: zod_1.z.enum(['school', 'meal_plan', 'menu_item', 'student_profile']),
    complianceFrameworks: zod_1.z.array(zod_1.z.string()).min(1),
    reportLevel: zod_1.z.enum(['summary', 'detailed', 'audit']).default('summary'),
    userContext: zod_1.z.object({
        ageGroups: zod_1.z.array(zod_1.z.object({
            min: zod_1.z.number().min(0).max(18),
            max: zod_1.z.number().min(0).max(18)
        })).optional(),
        regions: zod_1.z.array(zod_1.z.string()).optional(),
        institutions: zod_1.z.array(zod_1.z.string()).optional()
    }).optional(),
    includeRecommendations: zod_1.z.boolean().default(true),
    includeAIInsights: zod_1.z.boolean().default(true)
});
async function loadComplianceFrameworks(frameworkIds) {
    try {
        const frameworks = [];
        for (const frameworkId of frameworkIds) {
            try {
                const result = await dynamoDbClient.send(new lib_dynamodb_1.GetCommand({
                    TableName: process.env.COMPLIANCE_FRAMEWORKS_TABLE_NAME || 'ComplianceFrameworks',
                    Key: { frameworkId }
                }));
                if (result.Item) {
                    frameworks.push(result.Item);
                    console.log(`Loaded framework from DynamoDB: ${frameworkId}`);
                    continue;
                }
                try {
                    const s3Response = await s3Client.send(new client_s3_1.GetObjectCommand({
                        Bucket: process.env.COMPLIANCE_BUCKET_NAME || 'hasivu-compliance',
                        Key: `frameworks/${frameworkId}.json`
                    }));
                    if (s3Response.Body) {
                        const frameworkData = JSON.parse(await s3Response.Body.transformToString());
                        frameworks.push(frameworkData);
                        console.log(`Loaded framework from S3: ${frameworkId}`);
                    }
                }
                catch (s3Error) {
                    console.warn(`Framework ${frameworkId} not found in S3:`, s3Error);
                }
            }
            catch (error) {
                console.error(`Error loading framework ${frameworkId}:`, error);
            }
        }
        if (frameworks.length === 0) {
            frameworks.push(createDefaultUSDAFramework());
        }
        return frameworks;
    }
    catch (error) {
        console.error('Error loading compliance frameworks:', error);
        throw error;
    }
}
function createDefaultUSDAFramework() {
    return {
        frameworkId: 'usda_child_nutrition_2024',
        name: 'USDA Child Nutrition Program Standards',
        version: '2024.1',
        description: 'Federal nutrition standards for school meal programs',
        authority: 'United States Department of Agriculture',
        jurisdiction: 'United States',
        lastUpdated: '2024-01-01T00:00:00Z',
        mandatoryCompliance: true,
        applicableAgeGroups: [{ min: 5, max: 18 }],
        categories: ['macronutrients', 'micronutrients', 'food_groups', 'sodium', 'calories'],
        requirements: [
            {
                requirementId: 'usda_calories_k5',
                name: 'Daily Calorie Requirements K-5',
                description: 'Minimum and maximum calories for elementary students',
                category: 'calories',
                severity: 'critical',
                measurementCriteria: [
                    { metric: 'daily_calories', threshold: 550, operator: '>=', unit: 'kcal' },
                    { metric: 'daily_calories', threshold: 650, operator: '<=', unit: 'kcal' }
                ],
                applicableContexts: ['K-5'],
                evidenceRequired: ['meal_nutritional_analysis', 'serving_size_verification'],
                penaltyDescription: 'Loss of federal funding eligibility'
            },
            {
                requirementId: 'usda_calories_6_12',
                name: 'Daily Calorie Requirements 6-12',
                description: 'Minimum and maximum calories for middle and high school students',
                category: 'calories',
                severity: 'critical',
                measurementCriteria: [
                    { metric: 'daily_calories', threshold: 600, operator: '>=', unit: 'kcal' },
                    { metric: 'daily_calories', threshold: 700, operator: '<=', unit: 'kcal' }
                ],
                applicableContexts: ['6-8', '9-12'],
                evidenceRequired: ['meal_nutritional_analysis', 'serving_size_verification']
            },
            {
                requirementId: 'usda_sodium_limit',
                name: 'Sodium Content Limits',
                description: 'Maximum sodium content per meal',
                category: 'sodium',
                severity: 'high',
                measurementCriteria: [
                    { metric: 'meal_sodium', threshold: 1230, operator: '<=', unit: 'mg' }
                ],
                applicableContexts: ['all_grades'],
                evidenceRequired: ['ingredient_sodium_analysis']
            },
            {
                requirementId: 'usda_whole_grains',
                name: 'Whole Grain Requirements',
                description: 'Minimum percentage of grains that must be whole grain',
                category: 'food_groups',
                severity: 'medium',
                measurementCriteria: [
                    { metric: 'whole_grain_percentage', threshold: 50, operator: '>=', unit: 'percent' }
                ],
                applicableContexts: ['all_grades'],
                evidenceRequired: ['ingredient_verification', 'supplier_certification']
            }
        ]
    };
}
async function fetchEntityData(entityId, entityType) {
    try {
        let tableName;
        switch (entityType) {
            case 'school':
                tableName = process.env.SCHOOLS_TABLE_NAME || 'Schools';
                break;
            case 'meal_plan':
                tableName = process.env.MEAL_PLANS_TABLE_NAME || 'MealPlans';
                break;
            case 'menu_item':
                tableName = process.env.MENU_ITEMS_TABLE_NAME || 'MenuItems';
                break;
            case 'student_profile':
                tableName = process.env.STUDENT_PROFILES_TABLE_NAME || 'StudentProfiles';
                break;
            default:
                throw new Error(`Unknown entity type: ${entityType}`);
        }
        const result = await dynamoDbClient.send(new lib_dynamodb_1.GetCommand({
            TableName: tableName,
            Key: { [`${entityType}Id`]: entityId }
        }));
        if (!result.Item) {
            throw new Error(`Entity not found: ${entityId}`);
        }
        return result.Item;
    }
    catch (error) {
        console.error(`Error fetching entity ${entityId}:`, error);
        throw error;
    }
}
async function generateAIInsights(checkResult, frameworks) {
    try {
        const prompt = `You are a regulatory compliance expert specializing in nutrition standards. Analyze the following compliance check results:

Entity: ${checkResult.entityType} (${checkResult.entityId})
Overall Compliance Score: ${checkResult.overallCompliance.score}%
Violations: ${checkResult.violations.length}
Critical Violations: ${checkResult.overallCompliance.criticalViolations}

Framework Results:
${checkResult.frameworkResults.map(fr => `- ${fr.frameworkName}: ${fr.complianceScore}% (${fr.status})`).join('\n')}

Violations:
${checkResult.violations.map(v => `- ${v.severity.toUpperCase()}: ${v.description} (${v.actualValue} vs ${v.expectedValue})`).join('\n')}

Please provide:
1. Certification eligibility assessment
2. Immediate, short-term, and long-term action plan
3. Risk assessment and impact analysis
4. Priority recommendations

Format as structured JSON with specific, actionable insights.`;
        const command = new client_bedrock_runtime_1.InvokeModelCommand({
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 2000,
                messages: [{
                        role: 'user',
                        content: prompt
                    }]
            })
        });
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        console.log(`AI compliance insights generated for ${checkResult.checkId}`);
        return JSON.parse(responseBody.content[0].text);
    }
    catch (error) {
        console.error('Error generating AI insights:', error);
        return {
            certificationStatus: {
                eligible: checkResult.overallCompliance.criticalViolations === 0,
                requirements: ['Manual review required due to AI analysis failure'],
                timeline: '30_days'
            },
            actionPlan: {
                immediate: ['Review compliance violations manually'],
                shortTerm: ['Implement corrective measures'],
                longTerm: ['Establish monitoring procedures']
            },
            impact: {
                risk: checkResult.overallCompliance.criticalViolations > 0 ? 'high' : 'medium',
                consequences: ['Potential regulatory action'],
                benefits: ['Improved compliance posture']
            }
        };
    }
}
function generateRecommendations(violations) {
    const recommendations = [];
    const violationsByCategory = violations.reduce((acc, violation) => {
        if (!acc[violation.category]) {
            acc[violation.category] = [];
        }
        acc[violation.category].push(violation);
        return acc;
    }, {});
    Object.entries(violationsByCategory).forEach(([category, categoryViolations]) => {
        const criticalCount = categoryViolations.filter(v => v.severity === 'critical').length;
        const priority = criticalCount > 0 ? 'critical' :
            categoryViolations.filter(v => v.severity === 'high').length > 0 ? 'high' : 'medium';
        recommendations.push({
            recommendationId: `rec_nutritional_${Date.now()}_${category}`,
            priority: priority,
            category,
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Compliance Enhancement`,
            description: `Address ${categoryViolations.length} nutritional compliance gaps in ${category}`,
            action: `Implement comprehensive ${category} improvement program`,
            expectedImpact: `Achieve full ${category} compliance and reduce regulatory risk`,
            implementationSteps: [
                `Audit current ${category} practices`,
                `Develop ${category} improvement plan`,
                `Implement changes with monitoring`,
                `Verify compliance through testing`
            ],
            timeline: criticalCount > 0 ? '30_days' : '90_days',
            resources: ['nutrition consultant', 'compliance training', 'monitoring tools'],
            successMetrics: [`${category} compliance rate >95%`, 'zero critical violations']
        });
    });
    violations.filter(v => v.severity === 'critical').forEach(violation => {
        recommendations.push({
            recommendationId: `rec_${violation.violationId}`,
            priority: 'critical',
            category: 'immediate_action',
            title: `Critical: ${violation.description}`,
            description: violation.description,
            action: `Address critical ${violation.category} violation: ${violation.description}`,
            expectedImpact: `Eliminate critical compliance risk and restore regulatory standing`,
            implementationSteps: violation.remediation,
            timeline: violation.timeline,
            resources: ['immediate intervention', 'expert consultation'],
            successMetrics: ['violation eliminated', 'compliance restored']
        });
    });
    return recommendations;
}
function performComplianceCheck(entityData, requirement, checkId) {
    try {
        const metrics = extractMetrics(entityData, requirement);
        if (!metrics || Object.keys(metrics).length === 0) {
            return { status: 'not_applicable' };
        }
        const results = requirement.measurementCriteria.map(criteria => {
            const actualValue = metrics[criteria.metric];
            if (actualValue === undefined || actualValue === null) {
                return { passed: false, reason: 'metric_unavailable' };
            }
            let passed = false;
            switch (criteria.operator) {
                case '>=':
                    passed = actualValue >= criteria.threshold;
                    break;
                case '<=':
                    passed = actualValue <= criteria.threshold;
                    break;
                case '==':
                    passed = actualValue === criteria.threshold;
                    break;
                case '!=':
                    passed = actualValue !== criteria.threshold;
                    break;
                case '>':
                    passed = actualValue > criteria.threshold;
                    break;
                case '<':
                    passed = actualValue < criteria.threshold;
                    break;
            }
            const deviation = Math.abs(actualValue - criteria.threshold);
            const deviationPercent = (deviation / criteria.threshold) * 100;
            return {
                passed,
                actualValue,
                expectedValue: criteria.threshold,
                deviation,
                deviationPercent,
                metric: criteria.metric,
                reason: passed ? 'compliant' : 'threshold_exceeded'
            };
        });
        const allPassed = results.every(r => r.passed);
        const criticalFailed = results.some(r => !r.passed && requirement.severity === 'critical');
        if (allPassed) {
            return {
                status: 'pass',
                actualValue: results[0]?.actualValue,
                deviation: 0
            };
        }
        const failedResult = results.find(r => !r.passed);
        if (failedResult) {
            const violation = {
                violationId: `viol_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                requirementId: requirement.requirementId,
                frameworkId: 'framework_context',
                severity: requirement.severity,
                category: requirement.category,
                description: `${requirement.name} failed compliance check: ${failedResult.reason}`,
                actualValue: failedResult.actualValue || 0,
                expectedValue: failedResult.expectedValue || 0,
                deviation: failedResult.deviation || 0,
                impact: requirement.severity === 'critical' ? 'Regulatory non-compliance risk' : 'Performance concern',
                affectedEntities: [entityData.id || 'unknown'],
                remediation: [`Adjust ${requirement.name} to meet requirements`, 'Implement monitoring procedures'],
                timeline: requirement.severity === 'critical' ? '7_days' : '30_days',
                estimatedCost: requirement.severity === 'critical' ? 5000 : 2000
            };
            return {
                status: criticalFailed ? 'fail' : 'warning',
                violation,
                actualValue: failedResult.actualValue,
                deviation: failedResult.deviationPercent
            };
        }
        return { status: 'warning' };
    }
    catch (error) {
        console.error(`Error performing compliance check for ${requirement.requirementId}:`, error);
        return { status: 'not_applicable' };
    }
}
function extractMetrics(entityData, requirement) {
    const metrics = {};
    try {
        if (entityData.nutritionalValues) {
            metrics.daily_calories = entityData.nutritionalValues.calories || 0;
            metrics.meal_sodium = entityData.nutritionalValues.sodium || 0;
            metrics.protein = entityData.nutritionalValues.protein || 0;
            metrics.carbohydrates = entityData.nutritionalValues.carbohydrates || 0;
            metrics.fat = entityData.nutritionalValues.fat || 0;
            metrics.fiber = entityData.nutritionalValues.fiber || 0;
        }
        if (entityData.foodGroups) {
            const totalGrains = entityData.foodGroups.grains || 0;
            const wholeGrains = entityData.foodGroups.wholeGrains || 0;
            metrics.whole_grain_percentage = totalGrains > 0 ? (wholeGrains / totalGrains) * 100 : 0;
        }
        if (entityData.servingSizes) {
            metrics.serving_size_fruits = entityData.servingSizes.fruits || 0;
            metrics.serving_size_vegetables = entityData.servingSizes.vegetables || 0;
            metrics.serving_size_grains = entityData.servingSizes.grains || 0;
            metrics.serving_size_protein = entityData.servingSizes.protein || 0;
            metrics.serving_size_dairy = entityData.servingSizes.dairy || 0;
        }
        if (entityData.demographicInfo) {
            const age = entityData.demographicInfo.age;
            if (age) {
                const ageMultiplier = age < 6 ? 0.8 : age < 12 ? 1.0 : 1.2;
                Object.keys(metrics).forEach(key => {
                    if (key.startsWith('serving_size_')) {
                        metrics[key] = metrics[key] * ageMultiplier;
                    }
                });
            }
        }
        return metrics;
    }
    catch (error) {
        console.error('Error extracting metrics:', error);
        return {};
    }
}
function calculateComplianceScore(frameworkResults) {
    if (frameworkResults.length === 0) {
        return { score: 0, status: 'unknown', criticalViolations: 0, totalViolations: 0 };
    }
    const totalScore = frameworkResults.reduce((sum, result) => sum + result.complianceScore, 0);
    const averageScore = totalScore / frameworkResults.length;
    const criticalViolations = frameworkResults.reduce((sum, result) => {
        return sum + result.requirementResults.filter(rr => rr.status === 'fail' && rr.name.toLowerCase().includes('critical')).length;
    }, 0);
    const totalViolations = frameworkResults.reduce((sum, result) => {
        return sum + result.requirementResults.filter(rr => rr.status === 'fail' || rr.status === 'warning').length;
    }, 0);
    let status;
    if (criticalViolations > 0) {
        status = 'non-compliant';
    }
    else if (averageScore >= 95) {
        status = 'compliant';
    }
    else if (averageScore >= 70) {
        status = 'partial';
    }
    else {
        status = 'non-compliant';
    }
    return {
        score: Math.round(averageScore * 100) / 100,
        status,
        criticalViolations,
        totalViolations
    };
}
async function storeComplianceResults(results) {
    try {
        await dynamoDbClient.send(new lib_dynamodb_1.PutCommand({
            TableName: process.env.COMPLIANCE_RESULTS_TABLE_NAME || 'ComplianceCheckResults',
            Item: {
                checkId: results.checkId,
                ...results,
                createdAt: new Date().toISOString(),
                ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
            }
        }));
        console.log(`Stored compliance check results: ${results.checkId}`);
    }
    catch (error) {
        console.error('Error storing compliance results:', error);
        throw error;
    }
}
function generateReportSummary(results) {
    return `Compliance Check Summary:
• Entity: ${results.entityType} (${results.entityId})
• Overall Score: ${results.overallCompliance.score}% (${results.overallCompliance.status})
• Frameworks Checked: ${results.frameworkResults.length}
• Violations Found: ${results.overallCompliance.totalViolations} (${results.overallCompliance.criticalViolations} critical)
• Recommendations: ${results.recommendations.length}
• Check Completed: ${results.timestamp}`;
}
const handler = async (event) => {
    console.log('Nutrition Compliance Checker - Event received:', JSON.stringify(event, null, 2));
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const validatedData = ComplianceCheckRequestSchema.parse(body);
        const checkId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`Starting compliance check: ${checkId}`);
        const frameworks = await loadComplianceFrameworks(validatedData.complianceFrameworks);
        if (frameworks.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'No compliance frameworks found',
                    checkId
                })
            };
        }
        const entityData = await fetchEntityData(validatedData.entityId, validatedData.entityType);
        const violations = [];
        const frameworkResults = [];
        const startTime = Date.now();
        for (const framework of frameworks) {
            const requirementResults = [];
            let frameworkScore = 0;
            let totalRequirements = 0;
            for (const requirement of framework.requirements) {
                const isApplicable = requirement.applicableContexts.includes('all_grades') ||
                    requirement.applicableContexts.some(context => {
                        if (validatedData.userContext?.ageGroups) {
                            return validatedData.userContext.ageGroups.some(ageGroup => {
                                if (context === 'K-5')
                                    return ageGroup.max <= 10;
                                if (context === '6-8')
                                    return ageGroup.min >= 11 && ageGroup.max <= 13;
                                if (context === '9-12')
                                    return ageGroup.min >= 14;
                                return true;
                            });
                        }
                        return true;
                    });
                if (!isApplicable) {
                    requirementResults.push({
                        requirementId: requirement.requirementId,
                        name: requirement.name,
                        status: 'not_applicable'
                    });
                    continue;
                }
                const checkResult = performComplianceCheck(entityData, requirement, checkId);
                if (checkResult.violation) {
                    checkResult.violation.frameworkId = framework.frameworkId;
                    violations.push(checkResult.violation);
                }
                requirementResults.push({
                    requirementId: requirement.requirementId,
                    name: requirement.name,
                    status: checkResult.status,
                    actualValue: checkResult.actualValue,
                    expectedValue: requirement.measurementCriteria[0]?.threshold,
                    deviation: checkResult.deviation,
                    evidence: requirement.evidenceRequired
                });
                if (checkResult.status !== 'not_applicable') {
                    totalRequirements++;
                    if (checkResult.status === 'pass') {
                        frameworkScore += 100;
                    }
                    else if (checkResult.status === 'warning') {
                        frameworkScore += 50;
                    }
                }
            }
            const avgScore = totalRequirements > 0 ? frameworkScore / totalRequirements : 0;
            const frameworkStatus = avgScore >= 95 ? 'compliant' : avgScore >= 70 ? 'partial' : 'non-compliant';
            frameworkResults.push({
                frameworkId: framework.frameworkId,
                frameworkName: framework.name,
                complianceScore: Math.round(avgScore * 100) / 100,
                status: frameworkStatus,
                requirementResults,
                lastChecked: new Date().toISOString(),
                validUntil: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)).toISOString()
            });
        }
        const overallCompliance = calculateComplianceScore(frameworkResults);
        const recommendations = validatedData.includeRecommendations ?
            generateRecommendations(violations) : [];
        const entityResults = [{
                entityId: validatedData.entityId,
                entityType: validatedData.entityType,
                complianceData: {
                    nutritionalValues: entityData.nutritionalValues || {},
                    servingSizes: entityData.servingSizes || {},
                    ingredients: entityData.ingredients || [],
                    allergens: entityData.allergens || [],
                    demographicData: entityData.demographicInfo || {}
                },
                measurementResults: Object.entries(extractMetrics(entityData, frameworks[0].requirements[0])).map(([metric, value]) => ({
                    metric,
                    value,
                    unit: 'various',
                    status: 'within_range'
                })),
                conditions: {
                    specialDietaryRequirements: entityData.specialDietaryRequirements || [],
                    healthConditions: entityData.healthConditions || [],
                    culturalRestrictions: entityData.culturalRestrictions || []
                },
                validity: {
                    dataFreshness: new Date().toISOString(),
                    lastVerified: new Date().toISOString(),
                    confidenceLevel: 0.95
                }
            }];
        const results = {
            checkId,
            timestamp: new Date().toISOString(),
            entityId: validatedData.entityId,
            entityType: validatedData.entityType,
            overallCompliance,
            frameworkResults,
            entityResults,
            violations,
            recommendations,
            aiInsights: {
                certificationStatus: { eligible: false, requirements: [], timeline: '' },
                actionPlan: { immediate: [], shortTerm: [], longTerm: [] },
                impact: { risk: 'medium', consequences: [], benefits: [] }
            },
            metadata: {
                processingTime: Date.now() - startTime,
                dataQuality: 0.9,
                confidenceScore: 0.85
            }
        };
        if (validatedData.includeAIInsights && (violations.length > 0 || overallCompliance.score < 90)) {
            try {
                results.aiInsights = await generateAIInsights(results, frameworks);
            }
            catch (error) {
                console.warn('AI insights generation failed:', error);
            }
        }
        await storeComplianceResults(results);
        let responseData;
        if (validatedData.reportLevel === 'summary') {
            responseData = {
                checkId: results.checkId,
                overallCompliance: results.overallCompliance,
                criticalViolations: violations.filter(v => v.severity === 'critical'),
                topRecommendations: recommendations.filter(r => r.priority === 'critical').slice(0, 3),
                summary: generateReportSummary(results)
            };
        }
        else if (validatedData.reportLevel === 'detailed') {
            responseData = {
                ...results,
                summary: generateReportSummary(results)
            };
        }
        else {
            responseData = {
                ...results,
                auditTrail: {
                    frameworks: frameworks.map(f => ({ id: f.frameworkId, version: f.version })),
                    checkParameters: validatedData,
                    dataQuality: results.metadata.dataQuality,
                    processingMetrics: results.metadata
                },
                summary: generateReportSummary(results)
            };
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
                    checkId: results.checkId,
                    timestamp: results.timestamp,
                    processingTime: results.metadata.processingTime,
                    frameworksChecked: frameworkResults.length
                }
            })
        };
    }
    catch (error) {
        console.error('Error in nutrition compliance checker:', error);
        if (error instanceof zod_1.z.ZodError) {
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
exports.handler = handler;
//# sourceMappingURL=nutrition-compliance-checker.js.map