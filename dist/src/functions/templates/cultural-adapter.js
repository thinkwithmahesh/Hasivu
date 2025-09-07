"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const client_translate_1 = require("@aws-sdk/client-translate");
const logger_1 = require("../../shared/utils/logger");
const response_utils_1 = require("../shared/response.utils");
const logger = logger_1.LoggerService.getInstance();
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const translateClient = new client_translate_1.TranslateClient({});
const handler = async (event, context) => {
    const startTime = Date.now();
    const method = event.httpMethod;
    const path = event.path;
    logger.info('Function started: culturalAdapter', { requestId: context.awsRequestId });
    console.log(`Cultural Adapter - ${method} ${path}`);
    try {
        if (method === 'POST' && path.includes('/adapt')) {
            return await adaptContent(event, context);
        }
        else if (method === 'GET' && path.includes('/rules')) {
            return await getCulturalRules(event, context);
        }
        else if (method === 'GET' && path.includes('/festivals')) {
            return await getFestivalContext(event, context);
        }
        else if (method === 'POST' && path.includes('/batch')) {
            return await batchAdaptContent(event, context);
        }
        else {
            return (0, response_utils_1.createErrorResponse)(404, 'Endpoint not found', undefined, undefined, context.awsRequestId);
        }
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, undefined, 500, context.awsRequestId);
    }
};
exports.handler = handler;
async function adaptContent(event, context) {
    const startTime = Date.now();
    try {
        const adaptationRequest = JSON.parse(event.body || '{}');
        const requestId = `adapt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (!adaptationRequest.content?.text || !adaptationRequest.context) {
            return (0, response_utils_1.createErrorResponse)(400, 'Content and context are required', undefined, undefined, context.awsRequestId);
        }
        const cacheKey = generateCacheKey(adaptationRequest);
        const cachedResult = await getCachedAdaptation(cacheKey);
        if (cachedResult) {
            logger.info('Returning cached adaptation result', { requestId, cacheKey });
            return (0, response_utils_1.createSuccessResponse)(cachedResult, 'Cached adaptation result', 200, context.awsRequestId);
        }
        const culturalRules = await getCulturalRulesForContext(adaptationRequest.context);
        const festivalContext = await getFestivalContextForDate(adaptationRequest.context.timing.date, adaptationRequest.context.religion);
        const adaptedContent = await performCulturalAdaptation(adaptationRequest.content, adaptationRequest.context, culturalRules, festivalContext, adaptationRequest.adaptationLevel);
        const religiousAdaptedContent = await applyReligiousAdaptations(adaptedContent, adaptationRequest.context, culturalRules);
        const timingAdaptedContent = await applyTimingAdaptations(religiousAdaptedContent, adaptationRequest.context, festivalContext);
        const confidenceScore = calculateConfidenceScore(adaptationRequest, culturalRules, festivalContext);
        const suggestedReviews = generateSuggestedReviews(culturalRules, festivalContext, adaptationRequest.context);
        const result = {
            requestId,
            originalContent: adaptationRequest.content,
            adaptedContent: {
                text: timingAdaptedContent.text,
                language: adaptationRequest.context.language,
                culturalAdaptations: timingAdaptedContent.culturalAdaptations || [],
                religiousAdaptations: timingAdaptedContent.religiousAdaptations || [],
                timingAdaptations: timingAdaptedContent.timingAdaptations || [],
                metadata: {
                    templateId: adaptationRequest.content.metadata.templateId,
                    version: `${adaptationRequest.content.metadata.version}_culturally_adapted`,
                    adaptationLevel: adaptationRequest.adaptationLevel,
                    processingTime: Date.now() - startTime
                }
            },
            confidenceScore,
            suggestedReviews,
            cacheKey
        };
        await cacheAdaptationResult(cacheKey, result);
        console.log(`Caching adaptation result: ${result.requestId}`);
        const duration = Date.now() - startTime;
        logger.info('Function completed: culturalAdapter', { statusCode: 200, duration, requestId: context.awsRequestId });
        return (0, response_utils_1.createSuccessResponse)(result, 'Content adapted successfully', 200, context.awsRequestId);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, undefined, 500, context.awsRequestId);
    }
}
async function getCulturalRules(event, context) {
    try {
        const culture = event.queryStringParameters?.culture;
        const religion = event.queryStringParameters?.religion;
        if (!culture) {
            return (0, response_utils_1.createErrorResponse)(400, 'Culture parameter is required', undefined, undefined, context.awsRequestId);
        }
        const rules = await getCulturalRulesForContext({
            culture,
            religion,
            language: 'en',
            region: 'global',
            schoolType: 'public',
            timing: { date: new Date(), localTime: '12:00' }
        });
        return (0, response_utils_1.createSuccessResponse)({
            culture,
            religion,
            ruleCount: rules.length,
            rules: rules.map(rule => ({
                id: rule.id,
                rule: rule.rule,
                severity: rule.severity,
                category: rule.category,
                description: rule.description
            }))
        }, 'Cultural rules retrieved successfully', 200, context.awsRequestId);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, undefined, 500, context.awsRequestId);
    }
}
async function getFestivalContext(event, context) {
    try {
        const dateParam = event.queryStringParameters?.date;
        const religion = event.queryStringParameters?.religion;
        const date = dateParam ? new Date(dateParam) : new Date();
        const festivalContext = await getFestivalContextForDate(date, religion);
        return (0, response_utils_1.createSuccessResponse)(festivalContext, 'Festival context retrieved successfully', 200, context.awsRequestId);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, undefined, 500, context.awsRequestId);
    }
}
async function batchAdaptContent(event, context) {
    try {
        const body = JSON.parse(event.body || '{}');
        const requests = body.requests || [];
        if (!Array.isArray(requests) || requests.length === 0) {
            return (0, response_utils_1.createErrorResponse)(400, 'Requests array is required', undefined, undefined, context.awsRequestId);
        }
        if (requests.length > 50) {
            return (0, response_utils_1.createErrorResponse)(400, 'Maximum 50 requests per batch', undefined, undefined, context.awsRequestId);
        }
        const batchId = `batch_${Date.now()}`;
        const results = [];
        const concurrency = 5;
        const chunks = [];
        for (let i = 0; i < requests.length; i += concurrency) {
            chunks.push(requests.slice(i, i + concurrency));
        }
        for (const chunk of chunks) {
            const chunkPromises = chunk.map(async (request) => {
                try {
                    const mockEvent = { ...event, body: JSON.stringify(request) };
                    const result = await adaptContent(mockEvent, context);
                    return JSON.parse(result.body);
                }
                catch (error) {
                    logger.error('Batch adaptation error:', error);
                    return {
                        error: 'Adaptation failed',
                        details: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            });
            const chunkResults = await Promise.all(chunkPromises);
            results.push(...chunkResults);
        }
        return (0, response_utils_1.createSuccessResponse)({
            batchId,
            totalRequests: requests.length,
            successfulAdaptations: results.filter(r => !r.error).length,
            failedAdaptations: results.filter(r => r.error).length,
            results
        }, 'Batch adaptation completed', 200, context.awsRequestId);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, undefined, 500, context.awsRequestId);
    }
}
function generateCacheKey(request) {
    const content = request.content.text.substring(0, 100);
    const context = `${request.context.culture}_${request.context.language}_${request.context.religion || 'none'}`;
    const date = request.context.timing.date.toISOString().split('T')[0];
    return `cultural_adapt_${Buffer.from(`${content}_${context}_${date}_${request.adaptationLevel}`).toString('base64').substring(0, 32)}`;
}
async function getCachedAdaptation(cacheKey) {
    try {
        const result = await dynamoClient.send(new client_dynamodb_1.GetItemCommand({
            TableName: process.env.CULTURAL_CACHE_TABLE || 'CulturalAdaptationCache',
            Key: {
                cacheKey: { S: cacheKey }
            }
        }));
        if (result.Item) {
            return JSON.parse(result.Item.adaptationResult.S || '{}');
        }
        return null;
    }
    catch (error) {
        logger.warn('Cache retrieval failed:', error);
        return null;
    }
}
async function cacheAdaptationResult(cacheKey, result) {
    try {
        await dynamoClient.send(new client_dynamodb_1.PutItemCommand({
            TableName: process.env.CULTURAL_CACHE_TABLE || 'CulturalAdaptationCache',
            Item: {
                cacheKey: { S: cacheKey },
                adaptationResult: { S: JSON.stringify(result) },
                ttl: { N: Math.floor(Date.now() / 1000 + 86400).toString() },
                createdAt: { S: new Date().toISOString() }
            }
        }));
    }
    catch (error) {
        logger.warn('Cache storage failed:', error);
    }
}
async function getCulturalRulesForContext(context) {
    const rules = [];
    if (context.culture === 'middle_eastern' || context.religion === 'muslim') {
        rules.push({
            id: 'halal_food_only',
            culture: context.culture,
            religion: context.religion,
            rule: 'Ensure all food content is halal-compliant',
            severity: 'critical',
            category: 'content',
            description: 'All food items must comply with Islamic dietary laws'
        });
    }
    if (context.religion === 'hindu') {
        rules.push({
            id: 'vegetarian_preference',
            culture: context.culture,
            religion: context.religion,
            rule: 'Prefer vegetarian options and avoid beef content',
            severity: 'important',
            category: 'content',
            description: 'Respect Hindu dietary preferences and restrictions'
        });
    }
    if (context.culture === 'eastern') {
        rules.push({
            id: 'formal_communication',
            culture: context.culture,
            rule: 'Use formal language and honorifics',
            severity: 'important',
            category: 'tone',
            description: 'Eastern cultures often prefer formal communication styles'
        });
    }
    return rules;
}
async function getFestivalContextForDate(date, religion) {
    const festivals = [];
    const currentMonth = date.getMonth() + 1;
    const currentDay = date.getDate();
    if (currentMonth === 12 && currentDay >= 20) {
        festivals.push({
            id: 'christmas_season',
            name: 'Christmas Season',
            date: new Date(date.getFullYear(), 11, 25),
            religion: 'christian',
            cultures: ['western', 'latin_american'],
            communicationImpact: {
                beforeDays: 14,
                duringDays: 3,
                afterDays: 7,
                timing: 'acknowledge',
                restrictions: ['avoid_scheduling_during_christmas_day']
            }
        });
    }
    const currentFestivals = festivals.filter(f => Math.abs(f.date.getTime() - date.getTime()) < 86400000);
    const upcomingFestivals = festivals.filter(f => f.date.getTime() > date.getTime() &&
        f.date.getTime() - date.getTime() < 7 * 86400000);
    const recommendations = [];
    if (currentFestivals.length > 0) {
        recommendations.push('Consider acknowledging current festivals in communications');
    }
    if (upcomingFestivals.length > 0) {
        recommendations.push('Be mindful of upcoming festivals when scheduling communications');
    }
    return {
        currentFestivals,
        upcomingFestivals,
        communicationRecommendations: recommendations
    };
}
async function performCulturalAdaptation(content, context, rules, festivalContext, level) {
    let adaptedText = content.text;
    const adaptations = [];
    for (const rule of rules.filter(r => r.category === 'content' || r.category === 'tone')) {
        if (rule.severity === 'critical' || level !== 'basic') {
            if (rule.id === 'formal_communication') {
                adaptedText = adaptedText.replace(/\bhi\b/gi, 'Dear Parent/Guardian')
                    .replace(/\bthanks\b/gi, 'Thank you for your attention');
                adaptations.push('Applied formal communication style');
            }
            if (rule.id === 'halal_food_only') {
                adaptedText = adaptedText.replace(/pork/gi, 'halal protein')
                    .replace(/bacon/gi, 'halal alternative');
                adaptations.push('Adapted content for halal compliance');
            }
        }
    }
    if (festivalContext.currentFestivals.length > 0 && level !== 'basic') {
        const festival = festivalContext.currentFestivals[0];
        if (festival.communicationImpact.timing === 'acknowledge') {
            const greeting = `We extend our warm wishes for ${festival.name}. `;
            adaptedText = greeting + adaptedText;
            adaptations.push(`Added ${festival.name} acknowledgment`);
        }
    }
    return { text: adaptedText, culturalAdaptations: adaptations };
}
async function applyReligiousAdaptations(content, context, rules) {
    let adaptedText = content.text;
    const religiousAdaptations = [];
    const religiousRules = rules.filter(r => r.religion === context.religion);
    for (const rule of religiousRules) {
        if (rule.category === 'content' && rule.severity === 'critical') {
            religiousAdaptations.push(`Applied ${rule.rule}`);
        }
    }
    return {
        text: adaptedText,
        culturalAdaptations: content.culturalAdaptations,
        religiousAdaptations
    };
}
async function applyTimingAdaptations(content, context, festivalContext) {
    const timingAdaptations = [];
    for (const festival of festivalContext.upcomingFestivals) {
        if (festival.communicationImpact.timing === 'avoid') {
            timingAdaptations.push(`Consider rescheduling to avoid conflict with ${festival.name}`);
        }
    }
    return {
        ...content,
        timingAdaptations
    };
}
function calculateConfidenceScore(request, rules, festivalContext) {
    let score = 0.7;
    if (rules.length > 0)
        score += 0.1;
    if (rules.some(r => r.severity === 'critical'))
        score += 0.1;
    switch (request.adaptationLevel) {
        case 'basic':
            score += 0.0;
            break;
        case 'standard':
            score += 0.05;
            break;
        case 'comprehensive':
            score += 0.1;
            break;
        case 'deep_cultural':
            score += 0.15;
            break;
    }
    if (festivalContext.currentFestivals.length > 0 || festivalContext.upcomingFestivals.length > 0) {
        score += 0.05;
    }
    return Math.min(score, 1.0);
}
function generateSuggestedReviews(rules, festivalContext, context) {
    const suggestions = [];
    const criticalRules = rules.filter(r => r.severity === 'critical');
    if (criticalRules.length > 0) {
        suggestions.push('Review for critical cultural compliance requirements');
    }
    if (festivalContext.upcomingFestivals.length > 0) {
        suggestions.push('Consider timing impact of upcoming festivals');
    }
    if (context.schoolType === 'religious') {
        suggestions.push('Review for religious institution appropriateness');
    }
    return suggestions;
}
exports.default = exports.handler;
//# sourceMappingURL=cultural-adapter.js.map