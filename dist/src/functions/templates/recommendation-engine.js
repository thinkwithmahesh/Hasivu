"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const openai_1 = require("openai");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});
let openaiClient;
if (process.env.OPENAI_API_KEY) {
    openaiClient = new openai_1.OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}
const handler = async (event, context) => {
    const startTime = Date.now();
    const method = event.httpMethod;
    const path = event.path;
    console.log(`Recommendation Engine - ${method} ${path}`);
    const requestId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'X-Request-ID': requestId
        };
        if (method === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: ''
            };
        }
        if (method === 'POST' && path.includes('/recommendations')) {
            const request = JSON.parse(event.body || '{}');
            if (!request.userId || !request.context) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Missing required fields: userId, context'
                    })
                };
            }
            const recommendations = await generateRecommendations(request);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    ...recommendations,
                    metadata: {
                        ...recommendations.metadata,
                        requestId,
                        processingTime: Date.now() - startTime
                    }
                })
            };
        }
        if (method === 'POST' && path.includes('/feedback')) {
            const { recommendationId, feedback, outcome } = JSON.parse(event.body || '{}');
            await recordFeedback(recommendationId, feedback, outcome);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Feedback recorded successfully'
                })
            };
        }
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Endpoint not found'
            })
        };
    }
    catch (error) {
        console.error('Recommendation Engine Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                requestId
            })
        };
    }
};
exports.handler = handler;
async function generateRecommendations(request) {
    const userProfile = await getUserProfile(request.userId);
    const recommendations = [];
    const reasoning = [];
    if (request.context === 'communication_timing' || !request.type) {
        const timingRec = await generateTimingRecommendations(userProfile);
        recommendations.push(...timingRec);
    }
    if (request.context === 'channel_selection' || !request.type) {
        const channelRec = await generateChannelRecommendations(userProfile);
        recommendations.push(...channelRec);
    }
    if (request.context === 'content_personalization' || !request.type) {
        const contentRec = await generateContentRecommendations(userProfile);
        recommendations.push(...contentRec);
    }
    if (request.context === 'cultural_adaptation' || !request.type) {
        const culturalRec = await generateCulturalRecommendations(userProfile);
        recommendations.push(...culturalRec);
    }
    if (request.preferences?.includeAI && openaiClient) {
        const aiRec = await generateAIRecommendations(userProfile, request);
        recommendations.push(...aiRec);
    }
    const analysis = {
        userSegment: determineUserSegment(userProfile),
        engagementScore: calculateEngagementScore(userProfile),
        riskFactors: identifyRiskFactors(userProfile),
        opportunities: identifyOpportunities(userProfile)
    };
    reasoning.push(`Generated ${recommendations.length} recommendations for user ${request.userId}`);
    reasoning.push(`Based on analysis of ${userProfile.engagementPatterns.length} engagement patterns`);
    reasoning.push(`Considering ${userProfile.channelPreferences.length} channel preferences`);
    reasoning.push(`Cultural profile: ${userProfile.culturalProfile.primaryCulture} with ${userProfile.culturalProfile.communicationStyle} style`);
    const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
    if (highPriorityCount > 0) {
        reasoning.push(`${highPriorityCount} high-priority recommendations identified for immediate action`);
    }
    return {
        success: true,
        recommendations: recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority] || b.confidence - a.confidence;
        }),
        analysis,
        metadata: {
            requestId: `rec_${Date.now()}`,
            processingTime: 0,
            aiGenerated: !!request.preferences?.includeAI,
            confidence: recommendations.reduce((acc, r) => acc + r.confidence, 0) / recommendations.length || 0
        },
        reasoning
    };
}
async function getUserProfile(userId) {
    try {
        const command = new client_dynamodb_1.GetItemCommand({
            TableName: process.env.USER_PROFILES_TABLE || 'UserProfiles',
            Key: {
                userId: { S: userId }
            }
        });
        const result = await dynamoClient.send(command);
        if (!result.Item) {
            return createDefaultUserProfile(userId);
        }
        return {
            userId,
            engagementPatterns: JSON.parse(result.Item.engagementPatterns?.S || '[]'),
            channelPreferences: JSON.parse(result.Item.channelPreferences?.S || '[]'),
            contentPreferences: JSON.parse(result.Item.contentPreferences?.S || '[]'),
            culturalProfile: JSON.parse(result.Item.culturalProfile?.S || '{}'),
            behaviorMetrics: JSON.parse(result.Item.behaviorMetrics?.S || '{}')
        };
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        return createDefaultUserProfile(userId);
    }
}
function createDefaultUserProfile(userId) {
    return {
        userId,
        engagementPatterns: [],
        channelPreferences: [
            { channel: 'email', effectiveness: 0.7, lastUsed: new Date().toISOString() },
            { channel: 'sms', effectiveness: 0.8, lastUsed: new Date().toISOString() },
            { channel: 'push', effectiveness: 0.6, lastUsed: new Date().toISOString() }
        ],
        contentPreferences: [
            { contentType: 'informational', engagementRate: 0.5, clickThroughRate: 0.2 },
            { contentType: 'promotional', engagementRate: 0.3, clickThroughRate: 0.1 }
        ],
        culturalProfile: {
            primaryCulture: 'global',
            communicationStyle: 'direct',
            formalityPreference: 'medium',
            timezone: 'UTC',
            languagePreference: 'en'
        },
        behaviorMetrics: {
            averageSessionDuration: 300,
            preferredContactTimes: ['09:00', '14:00', '19:00'],
            responsePatterns: {},
            churnRisk: 0.2
        }
    };
}
async function generateTimingRecommendations(userProfile) {
    const recommendations = [];
    const bestTime = userProfile.engagementPatterns.reduce((best, pattern) => {
        return pattern.engagementRate > best.engagementRate ? pattern : best;
    }, { dayOfWeek: 'Tuesday', timeSlot: '10:00', engagementRate: 0.6 });
    recommendations.push({
        id: `timing_${Date.now()}`,
        type: 'timing_optimization',
        title: 'Optimal Communication Timing',
        description: `Send messages on ${bestTime.dayOfWeek} at ${bestTime.timeSlot} for maximum engagement`,
        priority: 'high',
        confidence: 0.85,
        expectedImpact: {
            metric: 'engagement_rate',
            improvement: `${(bestTime.engagementRate * 100).toFixed(1)}%`
        },
        implementation: {
            steps: [
                'Update communication schedule',
                'Configure automated sending times',
                'Monitor engagement metrics'
            ],
            timeline: '1-2 days',
            resources: ['Communication scheduler', 'Analytics dashboard']
        },
        successCriteria: [`Engagement rate improvement of ${(bestTime.engagementRate * 100).toFixed(1)}%`],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    return recommendations;
}
async function generateChannelRecommendations(userProfile) {
    const recommendations = [];
    const primaryChannel = userProfile.channelPreferences.reduce((best, channel) => {
        return channel.effectiveness > best.effectiveness ? channel : best;
    }, { channel: 'email', effectiveness: 0.5 });
    recommendations.push({
        id: `channel_${Date.now()}`,
        type: 'channel_selection',
        title: `Primary Channel Recommendation: ${primaryChannel.channel.toUpperCase()}`,
        description: `Use ${primaryChannel.channel} as the primary communication channel with ${(primaryChannel.effectiveness * 100).toFixed(1)}% effectiveness`,
        priority: 'medium',
        confidence: 0.8,
        expectedImpact: {
            metric: 'response_rate',
            improvement: `${(primaryChannel.effectiveness * 100).toFixed(1)}%`
        },
        implementation: {
            steps: [
                'Update primary channel preference',
                'Configure fallback channels',
                'Monitor channel performance'
            ],
            timeline: '1 day',
            resources: ['Channel management system']
        },
        successCriteria: [`Improved response rate on ${primaryChannel.channel}`],
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    });
    return recommendations;
}
async function generateContentRecommendations(userProfile) {
    const recommendations = [];
    const topContent = userProfile.contentPreferences
        .sort((a, b) => b.engagementRate - a.engagementRate)
        .slice(0, 2);
    topContent.forEach(contentPref => {
        recommendations.push({
            id: `content_${Date.now()}_${contentPref.contentType}`,
            type: 'content_personalization',
            title: `Content Strategy: ${contentPref.contentType.charAt(0).toUpperCase() + contentPref.contentType.slice(1)}`,
            description: `Update content strategy to emphasize ${contentPref.contentType}`,
            priority: 'medium',
            confidence: 0.75,
            expectedImpact: {
                metric: 'engagement_rate',
                improvement: `${(contentPref.engagementRate * 100).toFixed(1)}%`
            },
            implementation: {
                steps: [
                    'Review current content mix',
                    'Increase content type allocation',
                    'A/B test new approach'
                ],
                timeline: '1-2 weeks',
                resources: ['Content team', 'A/B testing platform']
            },
            successCriteria: [`Increased ${contentPref.contentType} content engagement`],
            validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
        });
    });
    return recommendations;
}
async function generateCulturalRecommendations(userProfile) {
    const recommendations = [];
    const culturalAdaptations = [
        {
            culturalRule: `${userProfile.culturalProfile.communicationStyle} communication preferred`,
            adaptation: `Use ${userProfile.culturalProfile.communicationStyle} tone and structure`
        },
        {
            culturalRule: `${userProfile.culturalProfile.formalityPreference} formality expected`,
            adaptation: `Adjust language formality to ${userProfile.culturalProfile.formalityPreference} level`
        }
    ];
    culturalAdaptations.forEach(adaptation => {
        recommendations.push({
            id: `cultural_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            type: 'cultural_adaptation',
            title: 'Cultural Communication Adaptation',
            description: adaptation.adaptation,
            priority: 'medium',
            confidence: 0.7,
            expectedImpact: {
                metric: 'user_satisfaction',
                improvement: 'Higher cultural relevance'
            },
            implementation: {
                steps: [
                    'Update communication templates',
                    'Train content team on cultural preferences',
                    'Monitor user feedback'
                ],
                timeline: '1 week',
                resources: ['Content templates', 'Training materials']
            },
            successCriteria: ['Improved user satisfaction scores', 'Reduced cultural friction'],
            validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: {
                culturalRule: adaptation.culturalRule,
                primaryCulture: userProfile.culturalProfile.primaryCulture
            }
        });
    });
    return recommendations;
}
async function generateAIRecommendations(userProfile, request) {
    if (!openaiClient) {
        return [];
    }
    try {
        const prompt = `
    Based on the following user profile data, provide 1-2 specific, actionable communication recommendations:
    
    User Profile Summary:
    - Engagement Patterns: ${JSON.stringify(userProfile.engagementPatterns)}
    - Channel Preferences: ${userProfile.channelPreferences.map(c => `${c.channel} (${c.effectiveness})`).join(', ')}
    - Content Preferences: ${userProfile.contentPreferences.map(c => `${c.contentType} (${c.engagementRate})`).join(', ')}
    - Cultural Profile: ${userProfile.culturalProfile.primaryCulture} culture with ${userProfile.culturalProfile.communicationStyle} style
    - Behavior Metrics: ${JSON.stringify(userProfile.behaviorMetrics)}
    
    Context: ${request.context}
    
    Provide recommendations in JSON format with fields: title, description, rationale, expectedImpact.
    `;
        const completion = await openaiClient.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
            temperature: 0.7
        });
        const aiResponse = completion.choices[0]?.message?.content;
        if (!aiResponse) {
            return [];
        }
        const aiRecommendations = JSON.parse(aiResponse);
        return Array.isArray(aiRecommendations) ? aiRecommendations.map((rec, index) => ({
            id: `ai_personalization_${Date.now()}_${index}`,
            type: 'engagement_improvement',
            title: rec.title || 'AI-Generated Recommendation',
            description: rec.description || 'AI-powered personalization suggestion',
            priority: 'medium',
            confidence: 0.7,
            expectedImpact: {
                metric: 'overall_engagement',
                improvement: rec.expectedImpact || 'Improved user engagement'
            },
            implementation: {
                steps: ['Review AI recommendation', 'Implement suggested changes', 'Monitor results'],
                timeline: '1 week',
                resources: ['AI insights', 'Implementation team']
            },
            successCriteria: ['Improved engagement metrics', 'Positive user feedback'],
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: {
                aiGenerated: true,
                rationale: rec.rationale
            }
        })) : [];
    }
    catch (error) {
        console.error('AI recommendation generation failed:', error);
        return [];
    }
}
function determineUserSegment(userProfile) {
    const avgEngagement = userProfile.engagementPatterns.reduce((acc, pattern) => acc + pattern.engagementRate, 0) / userProfile.engagementPatterns.length || 0;
    if (avgEngagement > 0.8)
        return 'highly_engaged';
    if (avgEngagement > 0.5)
        return 'moderately_engaged';
    if (avgEngagement > 0.2)
        return 'low_engagement';
    return 'inactive';
}
function calculateEngagementScore(userProfile) {
    const patternScore = userProfile.engagementPatterns.reduce((acc, pattern) => acc + pattern.engagementRate, 0) / userProfile.engagementPatterns.length || 0;
    const contentScore = userProfile.contentPreferences.reduce((acc, content) => acc + content.engagementRate, 0) / userProfile.contentPreferences.length || 0;
    const sessionScore = Math.min(userProfile.behaviorMetrics.averageSessionDuration / 600, 1);
    return Math.round(((patternScore + contentScore + sessionScore) / 3) * 100);
}
function identifyRiskFactors(userProfile) {
    const risks = [];
    if (userProfile.behaviorMetrics.churnRisk > 0.7) {
        risks.push('High churn risk detected');
    }
    if (userProfile.behaviorMetrics.averageSessionDuration < 60) {
        risks.push('Very short session duration');
    }
    const recentEngagement = userProfile.engagementPatterns
        .slice(-5)
        .reduce((acc, pattern) => acc + pattern.engagementRate, 0) / 5;
    if (recentEngagement < 0.3) {
        risks.push('Declining engagement trend');
    }
    return risks;
}
function identifyOpportunities(userProfile) {
    const opportunities = [];
    const bestChannel = userProfile.channelPreferences.reduce((best, channel) => channel.effectiveness > best.effectiveness ? channel : best);
    if (bestChannel.effectiveness > 0.7) {
        opportunities.push(`Strong performance on ${bestChannel.channel} channel`);
    }
    const bestContent = userProfile.contentPreferences.reduce((best, content) => content.engagementRate > best.engagementRate ? content : best);
    if (bestContent.engagementRate > 0.6) {
        opportunities.push(`High engagement with ${bestContent.contentType} content`);
    }
    if (userProfile.behaviorMetrics.preferredContactTimes.length > 0) {
        opportunities.push('Clear timing preferences identified');
    }
    return opportunities;
}
async function recordFeedback(recommendationId, feedback, outcome) {
    console.log(`Storing feedback for recommendation: ${recommendationId}`);
    try {
        const command = new client_dynamodb_1.PutItemCommand({
            TableName: process.env.RECOMMENDATION_FEEDBACK_TABLE || 'RecommendationFeedback',
            Item: {
                recommendationId: { S: recommendationId },
                feedback: { S: JSON.stringify(feedback) },
                outcome: { S: JSON.stringify(outcome) },
                timestamp: { S: new Date().toISOString() }
            }
        });
        await dynamoClient.send(command);
        console.log(`Updating models with feedback: ${recommendationId}`);
    }
    catch (error) {
        console.error('Error recording feedback:', error);
        throw error;
    }
}
//# sourceMappingURL=recommendation-engine.js.map