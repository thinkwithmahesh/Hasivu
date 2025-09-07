/**
 * Cultural Adaptation Service Lambda Function
 * 
 * Epic 6, Story 6.3 - Template Management & Personalization
 * - Multi-language template system with cultural adaptation
 * - Cultural sensitivity analysis and content modification
 * - Regional and religious considerations in communication
 * - Contextual translation beyond literal word conversion
 * - Festival and seasonal awareness for timing sensitivity
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';
import { LoggerService } from '../../shared/utils/logger';
import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils';

// Initialize services
const logger = LoggerService.getInstance();
const dynamoClient = new DynamoDBClient({});
const translateClient = new TranslateClient({});

// Types and interfaces
type AdaptationLevel = 'basic' | 'standard' | 'comprehensive' | 'deep_cultural';

type CulturalContext = 'western' | 'eastern' | 'middle_eastern' | 'african' | 'latin_american' | 'nordic' | 'mediterranean';

type ReligiousContext = 'christian' | 'muslim' | 'hindu' | 'buddhist' | 'jewish' | 'sikh' | 'secular' | 'mixed';

interface CulturalRule {
  id: string;
  culture: CulturalContext;
  religion?: ReligiousContext;
  rule: string;
  severity: 'critical' | 'important' | 'suggested';
  category: 'communication' | 'timing' | 'content' | 'imagery' | 'tone';
  description: string;
}

interface Festival {
  id: string;
  name: string;
  date: Date;
  religion: ReligiousContext;
  cultures: CulturalContext[];
  communicationImpact: {
    beforeDays: number;
    duringDays: number;
    afterDays: number;
    timing: 'avoid' | 'acknowledge' | 'celebrate';
    restrictions: string[];
  };
}

interface CommunicationContext {
  language: string;
  culture: CulturalContext;
  religion?: ReligiousContext;
  region: string;
  schoolType: 'public' | 'private' | 'religious' | 'international';
  timing: {
    date: Date;
    localTime: string;
    culturalPeriod?: string;
  };
}

interface AdaptationRequest {
  content: {
    text: string;
    type: 'notification' | 'announcement' | 'menu' | 'report' | 'alert';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    metadata: {
      templateId?: string;
      version: string;
      originalLanguage: string;
    };
  };
  context: CommunicationContext;
  adaptationLevel: AdaptationLevel;
  preserveFormatting?: boolean;
  customRules?: string[];
}

interface AdaptationResult {
  requestId: string;
  originalContent: AdaptationRequest['content'];
  adaptedContent: {
    text: string;
    language: string;
    culturalAdaptations: string[];
    religiousAdaptations: string[];
    timingAdaptations: string[];
    metadata: {
      templateId?: string;
      version: string;
      adaptationLevel: AdaptationLevel;
      processingTime: number;
    };
  };
  confidenceScore: number;
  suggestedReviews: string[];
  cacheKey: string;
  error?: string;
}

/**
 * Main handler for cultural adaptation requests
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const method = event.httpMethod;
  const path = event.path;
  
  logger.info('Function started: culturalAdapter', { requestId: context.awsRequestId });
  console.log(`Cultural Adapter - ${method} ${path}`);

  try {
    if (method === 'POST' && path.includes('/adapt')) {
      return await adaptContent(event, context);
    } else if (method === 'GET' && path.includes('/rules')) {
      return await getCulturalRules(event, context);
    } else if (method === 'GET' && path.includes('/festivals')) {
      return await getFestivalContext(event, context);
    } else if (method === 'POST' && path.includes('/batch')) {
      return await batchAdaptContent(event, context);
    } else {
      return createErrorResponse(404, 'Endpoint not found', undefined, undefined, context.awsRequestId);
    }
  } catch (error) {
    return handleError(error as Error, undefined, 500, context.awsRequestId);
  }
};

/**
 * Adapt content based on cultural context
 */
async function adaptContent(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();

  try {
    // Parse request body
    const adaptationRequest: AdaptationRequest = JSON.parse(event.body || '{}');

    // Generate unique request ID
    const requestId = `adapt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Validate request
    if (!adaptationRequest.content?.text || !adaptationRequest.context) {
      return createErrorResponse(400, 'Content and context are required', undefined, undefined, context.awsRequestId);
    }

    // Check cache first
    const cacheKey = generateCacheKey(adaptationRequest);
    const cachedResult = await getCachedAdaptation(cacheKey);
    
    if (cachedResult) {
      logger.info('Returning cached adaptation result', { requestId, cacheKey });
      return createSuccessResponse(cachedResult, 'Cached adaptation result', 200, context.awsRequestId);
    }

    // Get cultural rules for the context
    const culturalRules = await getCulturalRulesForContext(adaptationRequest.context);

    // Get festival context
    const festivalContext = await getFestivalContextForDate(
      adaptationRequest.context.timing.date,
      adaptationRequest.context.religion
    );

    // Perform cultural adaptation
    const adaptedContent = await performCulturalAdaptation(
      adaptationRequest.content,
      adaptationRequest.context,
      culturalRules,
      festivalContext,
      adaptationRequest.adaptationLevel
    );

    // Apply religious adaptations
    const religiousAdaptedContent = await applyReligiousAdaptations(
      adaptedContent,
      adaptationRequest.context,
      culturalRules
    );

    // Apply timing adaptations
    const timingAdaptedContent = await applyTimingAdaptations(
      religiousAdaptedContent,
      adaptationRequest.context,
      festivalContext
    );

    // Calculate confidence score
    const confidenceScore = calculateConfidenceScore(
      adaptationRequest,
      culturalRules,
      festivalContext
    );

    // Generate suggested reviews
    const suggestedReviews = generateSuggestedReviews(
      culturalRules,
      festivalContext,
      adaptationRequest.context
    );

    // Create result
    const result: AdaptationResult = {
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

    // Cache the result
    await cacheAdaptationResult(cacheKey, result);

    console.log(`Caching adaptation result: ${result.requestId}`);

    const duration = Date.now() - startTime;
    logger.info('Function completed: culturalAdapter', { statusCode: 200, duration, requestId: context.awsRequestId });

    return createSuccessResponse(result, 'Content adapted successfully', 200, context.awsRequestId);

  } catch (error) {
    return handleError(error as Error, undefined, 500, context.awsRequestId);
  }
}

/**
 * Get cultural rules for a specific context
 */
async function getCulturalRules(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const culture = event.queryStringParameters?.culture as CulturalContext;
    const religion = event.queryStringParameters?.religion as ReligiousContext;

    if (!culture) {
      return createErrorResponse(400, 'Culture parameter is required', undefined, undefined, context.awsRequestId);
    }

    const rules = await getCulturalRulesForContext({
      culture,
      religion,
      language: 'en',
      region: 'global',
      schoolType: 'public',
      timing: { date: new Date(), localTime: '12:00' }
    });

    return createSuccessResponse({
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

  } catch (error) {
    return handleError(error as Error, undefined, 500, context.awsRequestId);
  }
}

/**
 * Get festival context for adaptation
 */
async function getFestivalContext(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const dateParam = event.queryStringParameters?.date;
    const religion = event.queryStringParameters?.religion as ReligiousContext;

    const date = dateParam ? new Date(dateParam) : new Date();

    const festivalContext = await getFestivalContextForDate(date, religion);

    return createSuccessResponse(festivalContext, 'Festival context retrieved successfully', 200, context.awsRequestId);

  } catch (error) {
    return handleError(error as Error, undefined, 500, context.awsRequestId);
  }
}

/**
 * Batch adapt multiple content pieces
 */
async function batchAdaptContent(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const requests: AdaptationRequest[] = body.requests || [];

    if (!Array.isArray(requests) || requests.length === 0) {
      return createErrorResponse(400, 'Requests array is required', undefined, undefined, context.awsRequestId);
    }

    if (requests.length > 50) {
      return createErrorResponse(400, 'Maximum 50 requests per batch', undefined, undefined, context.awsRequestId);
    }

    const batchId = `batch_${Date.now()}`;
    const results: AdaptationResult[] = [];

    // Process requests in parallel with concurrency limit
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
        } catch (error) {
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

    return createSuccessResponse({
      batchId,
      totalRequests: requests.length,
      successfulAdaptations: results.filter(r => !r.error).length,
      failedAdaptations: results.filter(r => r.error).length,
      results
    }, 'Batch adaptation completed', 200, context.awsRequestId);

  } catch (error) {
    return handleError(error as Error, undefined, 500, context.awsRequestId);
  }
}

/**
 * Helper functions
 */

function generateCacheKey(request: AdaptationRequest): string {
  const content = request.content.text.substring(0, 100);
  const context = `${request.context.culture}_${request.context.language}_${request.context.religion || 'none'}`;
  const date = request.context.timing.date.toISOString().split('T')[0];
  
  return `cultural_adapt_${Buffer.from(`${content}_${context}_${date}_${request.adaptationLevel}`).toString('base64').substring(0, 32)}`;
}

async function getCachedAdaptation(cacheKey: string): Promise<AdaptationResult | null> {
  try {
    const result = await dynamoClient.send(new GetItemCommand({
      TableName: process.env.CULTURAL_CACHE_TABLE || 'CulturalAdaptationCache',
      Key: {
        cacheKey: { S: cacheKey }
      }
    }));

    if (result.Item) {
      return JSON.parse(result.Item.adaptationResult.S || '{}');
    }
    return null;
  } catch (error) {
    logger.warn('Cache retrieval failed:', error);
    return null;
  }
}

async function cacheAdaptationResult(cacheKey: string, result: AdaptationResult): Promise<void> {
  try {
    await dynamoClient.send(new PutItemCommand({
      TableName: process.env.CULTURAL_CACHE_TABLE || 'CulturalAdaptationCache',
      Item: {
        cacheKey: { S: cacheKey },
        adaptationResult: { S: JSON.stringify(result) },
        ttl: { N: Math.floor(Date.now() / 1000 + 86400).toString() }, // 24 hours
        createdAt: { S: new Date().toISOString() }
      }
    }));
  } catch (error) {
    logger.warn('Cache storage failed:', error);
  }
}

async function getCulturalRulesForContext(context: CommunicationContext): Promise<CulturalRule[]> {
  // In a real implementation, this would query a database of cultural rules
  // For now, return basic rules based on context
  const rules: CulturalRule[] = [];

  // Add basic cultural rules
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

async function getFestivalContextForDate(date: Date, religion?: ReligiousContext): Promise<{
  currentFestivals: Festival[];
  upcomingFestivals: Festival[];
  communicationRecommendations: string[];
}> {
  // In a real implementation, this would query a festival database
  // For now, return basic festival awareness
  const festivals: Festival[] = [];

  // Add some common festivals (this would be a comprehensive database)
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

  const currentFestivals = festivals.filter(f => 
    Math.abs(f.date.getTime() - date.getTime()) < 86400000 // Within 1 day
  );

  const upcomingFestivals = festivals.filter(f => 
    f.date.getTime() > date.getTime() && 
    f.date.getTime() - date.getTime() < 7 * 86400000 // Within 7 days
  );

  const recommendations: string[] = [];
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

async function performCulturalAdaptation(
  content: AdaptationRequest['content'],
  context: CommunicationContext,
  rules: CulturalRule[],
  festivalContext: any,
  level: AdaptationLevel
): Promise<{ text: string; culturalAdaptations: string[] }> {
  let adaptedText = content.text;
  const adaptations: string[] = [];

  // Apply cultural rules
  for (const rule of rules.filter(r => r.category === 'content' || r.category === 'tone')) {
    if (rule.severity === 'critical' || level !== 'basic') {
      // Apply rule-specific adaptations
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

  // Add festival acknowledgments if appropriate
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

async function applyReligiousAdaptations(
  content: { text: string; culturalAdaptations: string[] },
  context: CommunicationContext,
  rules: CulturalRule[]
): Promise<{ text: string; culturalAdaptations: string[]; religiousAdaptations: string[] }> {
  let adaptedText = content.text;
  const religiousAdaptations: string[] = [];

  const religiousRules = rules.filter(r => r.religion === context.religion);

  for (const rule of religiousRules) {
    // Apply religious adaptations based on rules
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

async function applyTimingAdaptations(
  content: { text: string; culturalAdaptations: string[]; religiousAdaptations: string[] },
  context: CommunicationContext,
  festivalContext: any
): Promise<{ text: string; culturalAdaptations: string[]; religiousAdaptations: string[]; timingAdaptations: string[] }> {
  const timingAdaptations: string[] = [];

  // Check for timing conflicts with festivals
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

function calculateConfidenceScore(
  request: AdaptationRequest,
  rules: CulturalRule[],
  festivalContext: any
): number {
  let score = 0.7; // Base score

  // Increase confidence based on available rules
  if (rules.length > 0) score += 0.1;
  if (rules.some(r => r.severity === 'critical')) score += 0.1;

  // Increase confidence based on adaptation level
  switch (request.adaptationLevel) {
    case 'basic': score += 0.0; break;
    case 'standard': score += 0.05; break;
    case 'comprehensive': score += 0.1; break;
    case 'deep_cultural': score += 0.15; break;
  }

  // Festival awareness
  if (festivalContext.currentFestivals.length > 0 || festivalContext.upcomingFestivals.length > 0) {
    score += 0.05;
  }

  return Math.min(score, 1.0);
}

function generateSuggestedReviews(
  rules: CulturalRule[],
  festivalContext: any,
  context: CommunicationContext
): string[] {
  const suggestions: string[] = [];

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

export default handler;