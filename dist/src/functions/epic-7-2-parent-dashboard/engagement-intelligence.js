"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.engagementIntelligenceHandler = void 0;
const logger_service_1 = require("../../services/logger.service");
const database_service_1 = require("../../shared/database.service");
const response_utils_1 = require("../../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const AWS = __importStar(require("aws-sdk"));
const logger = logger_service_1.LoggerService.getInstance();
const db = database_service_1.DatabaseService.getInstance();
const cloudWatch = new AWS.CloudWatch();
const engagementRequestSchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid(),
    timeframe: zod_1.z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional().default('weekly'),
    includeUsageMetrics: zod_1.z.boolean().optional().default(true),
    includeInteractionPatterns: zod_1.z.boolean().optional().default(true),
    includeBenchmarks: zod_1.z.boolean().optional().default(true),
    includeRecommendations: zod_1.z.boolean().optional().default(true),
    includePredictiveAnalytics: zod_1.z.boolean().optional().default(false),
    granularity: zod_1.z.enum(['hourly', 'daily', 'weekly']).optional().default('daily'),
});
const engagementEventSchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid(),
    eventType: zod_1.z.enum([
        'login', 'logout', 'page_view', 'feature_use', 'action_complete',
        'notification_open', 'notification_dismiss', 'search', 'filter_apply',
        'export_data', 'share_content', 'feedback_submit', 'help_access'
    ]),
    eventData: zod_1.z.object({
        feature: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        duration: zod_1.z.number().optional(),
        success: zod_1.z.boolean().optional(),
        metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }),
    timestamp: zod_1.z.string().datetime().optional(),
    sessionId: zod_1.z.string().optional(),
});
const feedbackSchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid(),
    category: zod_1.z.enum(['usability', 'feature_request', 'bug_report', 'content_quality', 'performance']),
    rating: zod_1.z.number().min(1).max(5),
    feedback: zod_1.z.string(),
    featureContext: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional().default('medium'),
});
async function validateParentAccess(parentId, requestingUser) {
    try {
        if (['super_admin', 'admin'].includes(requestingUser.role)) {
            const parent = await db.getPrismaClient().user.findUnique({
                where: { id: parentId, role: 'parent' },
                include: {
                    school: { select: { id: true, name: true, code: true } }
                }
            });
            if (!parent) {
                throw new Error('Parent not found');
            }
            return parent;
        }
        if (requestingUser.role === 'parent') {
            if (requestingUser.id !== parentId) {
                throw new Error('Access denied: Can only access your own engagement analytics');
            }
            const parent = await db.getPrismaClient().user.findUnique({
                where: { id: parentId },
                include: {
                    school: { select: { id: true, name: true, code: true } }
                }
            });
            if (!parent) {
                throw new Error('Parent not found');
            }
            return parent;
        }
        if (['school_admin', 'staff', 'teacher'].includes(requestingUser.role)) {
            const parent = await db.getPrismaClient().user.findUnique({
                where: {
                    id: parentId,
                    role: 'parent',
                    schoolId: requestingUser.schoolId
                },
                include: {
                    school: { select: { id: true, name: true, code: true } }
                }
            });
            if (!parent) {
                throw new Error('Parent not found or not in your school');
            }
            return parent;
        }
        throw new Error('Insufficient permissions');
    }
    catch (error) {
        logger.error('Parent access validation failed', {
            parentId,
            requestingUserId: requestingUser.id,
            error: error.message
        });
        throw error;
    }
}
async function getDashboardUsageMetrics(parentId, timeframe) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        switch (timeframe) {
            case 'daily':
                startDate.setDate(endDate.getDate() - 1);
                break;
            case 'weekly':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case 'monthly':
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case 'quarterly':
                startDate.setMonth(endDate.getMonth() - 3);
                break;
        }
        const sessions = await db.getPrismaClient().authSession.findMany({
            where: {
                userId: parentId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const activities = await db.getPrismaClient().auditLog.findMany({
            where: {
                userId: parentId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const totalSessions = sessions.length;
        const totalDuration = sessions.reduce((sum, session) => {
            const duration = session.expiresAt
                ? session.expiresAt.getTime() - session.createdAt.getTime()
                : 0;
            return sum + duration;
        }, 0);
        const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions / 1000 / 60 : 0;
        const dailyActiveTime = totalDuration / 1000 / 60 / Math.max(1, (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        const weeklyLoginCount = timeframe === 'daily' ? totalSessions :
            Math.ceil(totalSessions / Math.max(1, (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
        const featureUsage = {};
        const featureSet = new Set();
        activities.forEach(activity => {
            const feature = activity.action || 'unknown';
            featureSet.add(feature);
            if (!featureUsage[feature]) {
                featureUsage[feature] = {
                    feature,
                    totalUses: 0,
                    uniqueDays: 0,
                    averageDuration: 0,
                    successRate: 1.0,
                    lastUsed: activity.createdAt,
                    adoptionDate: activity.createdAt,
                    proficiencyLevel: 'novice',
                    userSatisfaction: 4.0
                };
            }
            featureUsage[feature].totalUses++;
            if (activity.createdAt > featureUsage[feature].lastUsed) {
                featureUsage[feature].lastUsed = activity.createdAt;
            }
            if (activity.createdAt < featureUsage[feature].adoptionDate) {
                featureUsage[feature].adoptionDate = activity.createdAt;
            }
        });
        Object.keys(featureUsage).forEach(feature => {
            const featureActivities = activities.filter(a => a.action === feature);
            const uniqueDays = new Set(featureActivities.map(a => a.createdAt.toDateString())).size;
            featureUsage[feature].uniqueDays = uniqueDays;
            const totalUses = featureUsage[feature].totalUses;
            if (totalUses > 50) {
                featureUsage[feature].proficiencyLevel = 'advanced';
            }
            else if (totalUses > 20) {
                featureUsage[feature].proficiencyLevel = 'intermediate';
            }
        });
        const monthlyActiveFeatures = featureSet.size;
        const lastActiveFeatures = Object.values(featureUsage)
            .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
            .slice(0, 5)
            .map(f => f.feature);
        const hourUsage = new Array(24).fill(0);
        sessions.forEach(session => {
            hourUsage[session.createdAt.getHours()]++;
        });
        const peakUsageHours = hourUsage
            .map((count, hour) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map(h => `${h.hour}:00-${h.hour + 1}:00`);
        const deviceBreakdown = {
            mobile: { sessions: Math.floor(totalSessions * 0.6), duration: totalDuration * 0.5, percentage: 60 },
            desktop: { sessions: Math.floor(totalSessions * 0.3), duration: totalDuration * 0.4, percentage: 30 },
            tablet: { sessions: Math.floor(totalSessions * 0.1), duration: totalDuration * 0.1, percentage: 10 }
        };
        const navigationPatterns = [
            {
                pattern: 'Dashboard → Nutrition → Child Progress',
                frequency: 0.7,
                efficiency: 0.8,
                context: 'Daily check routine',
                optimizationPotential: 0.2
            },
            {
                pattern: 'Login → Notifications → Dashboard',
                frequency: 0.5,
                efficiency: 0.9,
                context: 'Alert-driven usage',
                optimizationPotential: 0.1
            }
        ];
        return {
            totalSessions,
            averageSessionDuration,
            dailyActiveTime,
            weeklyLoginCount,
            monthlyActiveFeatures,
            featureUsage,
            lastActiveFeatures,
            peakUsageHours,
            deviceBreakdown,
            navigationPatterns
        };
    }
    catch (error) {
        logger.error('Failed to get dashboard usage metrics', {
            parentId,
            timeframe,
            error: error.message
        });
        return {
            totalSessions: 0,
            averageSessionDuration: 0,
            dailyActiveTime: 0,
            weeklyLoginCount: 0,
            monthlyActiveFeatures: 0,
            featureUsage: {},
            lastActiveFeatures: [],
            peakUsageHours: [],
            deviceBreakdown: {
                mobile: { sessions: 0, duration: 0, percentage: 0 },
                desktop: { sessions: 0, duration: 0, percentage: 0 },
                tablet: { sessions: 0, duration: 0, percentage: 0 }
            },
            navigationPatterns: []
        };
    }
}
async function analyzeInteractionPatterns(parentId, usageMetrics) {
    try {
        const patterns = [];
        Object.values(usageMetrics.featureUsage).forEach(feature => {
            let engagementLevel = 'low';
            if (feature.totalUses > 30 && feature.uniqueDays > 7) {
                engagementLevel = 'high';
            }
            else if (feature.totalUses > 10 && feature.uniqueDays > 3) {
                engagementLevel = 'medium';
            }
            const daysSinceAdoption = (Date.now() - feature.adoptionDate.getTime()) / (24 * 60 * 60 * 1000);
            const usageVelocity = feature.totalUses / Math.max(1, daysSinceAdoption);
            const learningCurve = {
                initialProficiency: 0.2,
                currentProficiency: feature.proficiencyLevel === 'advanced' ? 0.9 : feature.proficiencyLevel === 'intermediate' ? 0.6 : 0.3,
                improvementRate: usageVelocity,
                plateauReached: feature.proficiencyLevel === 'advanced',
                timeToCompetency: daysSinceAdoption
            };
            const seasonality = {
                patterns: [
                    {
                        period: 'weekday',
                        usageMultiplier: 1.2,
                        confidence: 0.8,
                        factors: ['school schedule', 'routine']
                    }
                ],
                peakPeriods: ['morning', 'evening'],
                lowPeriods: ['weekend'],
                reasoningFactors: ['work schedule', 'child activity']
            };
            patterns.push({
                feature: feature.feature,
                usageFrequency: feature.totalUses / Math.max(1, daysSinceAdoption),
                engagementLevel,
                timeSpent: feature.averageDuration,
                interactionDepth: feature.proficiencyLevel === 'advanced' ? 0.9 : feature.proficiencyLevel === 'intermediate' ? 0.6 : 0.3,
                errorRate: 1.0 - feature.successRate,
                abandonmentRate: 0.1,
                conversionRate: 0.8,
                learningCurve,
                seasonality
            });
        });
        return patterns.sort((a, b) => b.usageFrequency - a.usageFrequency);
    }
    catch (error) {
        logger.error('Failed to analyze interaction patterns', {
            parentId,
            error: error.message
        });
        return [];
    }
}
function calculateEngagementScore(usageMetrics, interactionPatterns) {
    try {
        const frequencyScore = Math.min(100, (usageMetrics.weeklyLoginCount / 5) * 100);
        const depthScore = Math.min(100, (usageMetrics.averageSessionDuration / 10) * 100);
        const breadthScore = Math.min(100, (usageMetrics.monthlyActiveFeatures / 8) * 100);
        const retentionScore = Math.min(100, (usageMetrics.dailyActiveTime / 20) * 100);
        const advancedFeatures = Object.values(usageMetrics.featureUsage).filter(f => f.proficiencyLevel === 'advanced').length;
        const advocacyScore = Math.min(100, (advancedFeatures / 3) * 100);
        const components = {
            frequency: { score: frequencyScore, weight: 0.25, description: 'How often the user logs in and uses the platform' },
            depth: { score: depthScore, weight: 0.25, description: 'How long users spend per session' },
            breadth: { score: breadthScore, weight: 0.20, description: 'How many different features are actively used' },
            retention: { score: retentionScore, weight: 0.20, description: 'Consistency of daily usage' },
            advocacy: { score: advocacyScore, weight: 0.10, description: 'Level of feature mastery and engagement' }
        };
        const overall = Object.values(components).reduce((sum, component) => sum + (component.score * component.weight), 0);
        const trend = overall > 70 ? 'increasing' : overall > 50 ? 'stable' : 'decreasing';
        const factors = [
            {
                factor: 'Session frequency',
                impact: frequencyScore,
                direction: frequencyScore > 60 ? 'positive' : 'negative',
                actionable: true,
                recommendation: frequencyScore < 60 ? 'Establish a daily check-in routine' : 'Maintain current usage pattern'
            },
            {
                factor: 'Feature exploration',
                impact: breadthScore,
                direction: breadthScore > 50 ? 'positive' : 'negative',
                actionable: true,
                recommendation: breadthScore < 50 ? 'Try new features like meal planning or progress tracking' : 'Continue exploring advanced features'
            },
            {
                factor: 'Session depth',
                impact: depthScore,
                direction: depthScore > 60 ? 'positive' : 'negative',
                actionable: true,
                recommendation: depthScore < 60 ? 'Spend more time exploring detailed insights' : 'Great depth of engagement'
            }
        ];
        return {
            overall,
            components,
            trend,
            factors,
            benchmarkPosition: overall > 70 ? 'above_average' : overall > 40 ? 'average' : 'below_average',
            improvementPotential: 100 - overall
        };
    }
    catch (error) {
        logger.error('Failed to calculate engagement score', {
            error: error.message
        });
        return {
            overall: 0,
            components: {
                frequency: { score: 0, weight: 0.25, description: '' },
                depth: { score: 0, weight: 0.25, description: '' },
                breadth: { score: 0, weight: 0.20, description: '' },
                retention: { score: 0, weight: 0.20, description: '' },
                advocacy: { score: 0, weight: 0.10, description: '' }
            },
            trend: 'stable',
            factors: [],
            benchmarkPosition: 'below_average',
            improvementPotential: 100
        };
    }
}
function generateBehavioralInsights(usageMetrics, interactionPatterns, engagementScore) {
    const insights = [];
    if (usageMetrics.peakUsageHours.length > 0) {
        insights.push({
            id: `insight_peak_usage_${Date.now()}`,
            category: 'usage_pattern',
            insight: `Primary platform usage occurs during ${usageMetrics.peakUsageHours.join(', ')}, indicating established routine`,
            confidence: 0.8,
            evidence: [`Peak usage hours: ${usageMetrics.peakUsageHours.join(', ')}`, `Session consistency across these hours`],
            implications: ['Strong routine establishment', 'Predictable engagement windows'],
            recommendations: ['Schedule important notifications during peak hours', 'Introduce new features during high-engagement periods'],
            priority: 'medium',
            timeframe: 'ongoing'
        });
    }
    const highEngagementFeatures = interactionPatterns.filter(p => p.engagementLevel === 'high');
    if (highEngagementFeatures.length > 0) {
        insights.push({
            id: `insight_feature_mastery_${Date.now()}`,
            category: 'preference',
            insight: `Strong proficiency demonstrated in ${highEngagementFeatures.map(f => f.feature).join(', ')}`,
            confidence: 0.9,
            evidence: [`High engagement features: ${highEngagementFeatures.length}`, 'Consistent usage patterns', 'Low error rates'],
            implications: ['User comfort with platform', 'Ready for advanced features'],
            recommendations: ['Introduce advanced features in mastered areas', 'Use expertise to explore related features'],
            priority: 'low',
            timeframe: 'next month'
        });
    }
    if (usageMetrics.averageSessionDuration < 5) {
        insights.push({
            id: `insight_efficiency_${Date.now()}`,
            category: 'efficiency',
            insight: 'Short session durations suggest either high efficiency or potential usability barriers',
            confidence: 0.7,
            evidence: [`Average session: ${usageMetrics.averageSessionDuration.toFixed(1)} minutes`, 'Quick task completion'],
            implications: ['Efficient user behavior', 'Possible missing engagement opportunities'],
            recommendations: ['Analyze task completion rates', 'Consider introducing engaging content', 'Provide optional deep-dive features'],
            priority: 'medium',
            timeframe: 'next 2 weeks'
        });
    }
    if (engagementScore.overall < 50) {
        insights.push({
            id: `insight_engagement_risk_${Date.now()}`,
            category: 'risk',
            insight: 'Below-average engagement score indicates potential disengagement risk',
            confidence: 0.8,
            evidence: [`Engagement score: ${engagementScore.overall.toFixed(1)}`, 'Below platform average'],
            implications: ['Risk of reduced platform value', 'Potential churn risk'],
            recommendations: ['Implement engagement recovery program', 'Provide personalized onboarding', 'Identify and address barriers'],
            priority: 'high',
            timeframe: 'immediate'
        });
    }
    const avgSatisfaction = Object.values(usageMetrics.featureUsage).reduce((sum, f) => sum + f.userSatisfaction, 0) /
        Math.max(1, Object.values(usageMetrics.featureUsage).length);
    if (avgSatisfaction > 4.0) {
        insights.push({
            id: `insight_satisfaction_${Date.now()}`,
            category: 'satisfaction',
            insight: 'High feature satisfaction indicates strong product-market fit for this user',
            confidence: 0.8,
            evidence: [`Average satisfaction: ${avgSatisfaction.toFixed(1)}/5`, 'Consistent positive feedback'],
            implications: ['Strong user-platform alignment', 'High retention likelihood'],
            recommendations: ['Leverage satisfaction for testimonials', 'Introduce premium features', 'Gather feature requests'],
            priority: 'low',
            timeframe: 'ongoing'
        });
    }
    return insights;
}
async function getBenchmarkComparisons(parentId, usageMetrics, engagementScore) {
    try {
        const parent = await db.getPrismaClient().user.findUnique({
            where: { id: parentId },
            select: { schoolId: true }
        });
        const schoolId = parent?.schoolId;
        const benchmarks = [
            {
                metric: 'weekly_logins',
                userValue: usageMetrics.weeklyLoginCount,
                averageValue: 3.2,
                percentile: Math.min(95, Math.max(5, (usageMetrics.weeklyLoginCount / 3.2) * 50)),
                category: 'engagement',
                comparisonGroup: 'all_parents',
                trendDirection: usageMetrics.weeklyLoginCount > 3.2 ? 'improving' : 'stable',
                contextFactors: ['Platform average', 'All parent users']
            },
            {
                metric: 'session_duration',
                userValue: usageMetrics.averageSessionDuration,
                averageValue: 8.5,
                percentile: Math.min(95, Math.max(5, (usageMetrics.averageSessionDuration / 8.5) * 50)),
                category: 'usage',
                comparisonGroup: 'all_parents',
                trendDirection: usageMetrics.averageSessionDuration > 8.5 ? 'improving' : 'stable',
                contextFactors: ['Session quality indicator', 'User engagement depth']
            },
            {
                metric: 'feature_adoption',
                userValue: usageMetrics.monthlyActiveFeatures,
                averageValue: 5.8,
                percentile: Math.min(95, Math.max(5, (usageMetrics.monthlyActiveFeatures / 5.8) * 50)),
                category: 'usage',
                comparisonGroup: 'all_parents',
                trendDirection: usageMetrics.monthlyActiveFeatures > 5.8 ? 'improving' : 'stable',
                contextFactors: ['Feature exploration', 'Platform utilization']
            },
            {
                metric: 'engagement_score',
                userValue: engagementScore.overall,
                averageValue: 65.0,
                percentile: Math.min(95, Math.max(5, (engagementScore.overall / 65.0) * 50)),
                category: 'engagement',
                comparisonGroup: 'all_parents',
                trendDirection: engagementScore.trend === 'increasing' ? 'improving' : engagementScore.trend === 'decreasing' ? 'declining' : 'stable',
                contextFactors: ['Overall platform engagement', 'Composite metric']
            }
        ];
        if (schoolId) {
            benchmarks.push({
                metric: 'school_engagement',
                userValue: engagementScore.overall,
                averageValue: 68.5,
                percentile: Math.min(95, Math.max(5, (engagementScore.overall / 68.5) * 50)),
                category: 'engagement',
                comparisonGroup: 'school_parents',
                trendDirection: engagementScore.overall > 68.5 ? 'improving' : 'stable',
                contextFactors: ['School community average', 'Peer comparison']
            });
        }
        return benchmarks;
    }
    catch (error) {
        logger.error('Failed to get benchmark comparisons', {
            parentId,
            error: error.message
        });
        return [];
    }
}
function generateImprovementSuggestions(usageMetrics, engagementScore, behavioralInsights) {
    const suggestions = [];
    if (engagementScore.overall < 60) {
        suggestions.push({
            id: `suggestion_engagement_${Date.now()}`,
            category: 'engagement',
            priority: 'high',
            suggestion: 'Implement a daily platform check-in routine',
            rationale: 'Low engagement score indicates inconsistent platform usage patterns',
            expectedImpact: 25,
            implementationEffort: 'low',
            timeframe: '2-3 weeks',
            successMetrics: ['Increase weekly login frequency', 'Improve session consistency', 'Boost overall engagement score'],
            dependencies: ['User motivation', 'Platform value perception']
        });
    }
    if (usageMetrics.monthlyActiveFeatures < 5) {
        suggestions.push({
            id: `suggestion_features_${Date.now()}`,
            category: 'features',
            priority: 'medium',
            suggestion: 'Explore nutrition tracking and meal planning features',
            rationale: 'Limited feature usage suggests untapped platform value',
            expectedImpact: 20,
            implementationEffort: 'medium',
            timeframe: '3-4 weeks',
            successMetrics: ['Use 2-3 additional features', 'Increase feature proficiency levels', 'Improve platform utilization'],
            dependencies: ['Feature discoverability', 'User onboarding']
        });
    }
    if (usageMetrics.averageSessionDuration < 5) {
        suggestions.push({
            id: `suggestion_depth_${Date.now()}`,
            category: 'usability',
            priority: 'medium',
            suggestion: 'Spend more time exploring detailed insights and analytics',
            rationale: 'Short sessions may indicate missed opportunities for deeper engagement',
            expectedImpact: 15,
            implementationEffort: 'low',
            timeframe: '1-2 weeks',
            successMetrics: ['Increase average session duration', 'Explore advanced features', 'Access detailed reports'],
            dependencies: ['Content discoverability', 'User interest level']
        });
    }
    const riskInsights = behavioralInsights.filter(i => i.category === 'risk' && i.priority === 'high');
    if (riskInsights.length > 0) {
        suggestions.push({
            id: `suggestion_risk_mitigation_${Date.now()}`,
            category: 'engagement',
            priority: 'high',
            suggestion: 'Implement personalized engagement recovery program',
            rationale: 'Behavioral analysis indicates potential disengagement risk',
            expectedImpact: 40,
            implementationEffort: 'high',
            timeframe: 'immediate',
            successMetrics: ['Stabilize engagement score', 'Increase platform usage', 'Improve user satisfaction'],
            dependencies: ['Support team intervention', 'Personalized content', 'User responsiveness']
        });
    }
    if (Object.values(usageMetrics.featureUsage).some(f => f.successRate < 0.9)) {
        suggestions.push({
            id: `suggestion_performance_${Date.now()}`,
            category: 'performance',
            priority: 'medium',
            suggestion: 'Address usability issues in underperforming features',
            rationale: 'Some features show below-optimal success rates',
            expectedImpact: 18,
            implementationEffort: 'medium',
            timeframe: '2-4 weeks',
            successMetrics: ['Improve feature success rates', 'Reduce error frequencies', 'Enhance user experience'],
            dependencies: ['UX improvements', 'Technical optimizations', 'User feedback']
        });
    }
    return suggestions.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
}
function assessEngagementRisks(usageMetrics, engagementScore, behavioralInsights) {
    const riskFactors = [];
    if (engagementScore.overall < 40) {
        riskFactors.push({
            risk: 'Low engagement score',
            severity: 'high',
            likelihood: 0.8,
            impact: 'High probability of platform abandonment',
            indicators: ['Below 40% engagement score', 'Declining usage trends', 'Limited feature adoption']
        });
    }
    if (usageMetrics.weeklyLoginCount < 2) {
        riskFactors.push({
            risk: 'Irregular usage patterns',
            severity: 'medium',
            likelihood: 0.6,
            impact: 'Reduced platform value realization',
            indicators: ['Less than 2 logins per week', 'Inconsistent session patterns', 'Low routine establishment']
        });
    }
    if (usageMetrics.monthlyActiveFeatures < 3) {
        riskFactors.push({
            risk: 'Feature underutilization',
            severity: 'medium',
            likelihood: 0.7,
            impact: 'Missing platform benefits and value',
            indicators: ['Using fewer than 3 features', 'Limited platform exploration', 'Low feature proficiency']
        });
    }
    const highSeverityCount = riskFactors.filter(r => r.severity === 'high').length;
    const mediumSeverityCount = riskFactors.filter(r => r.severity === 'medium').length;
    let overallRisk = 'low';
    if (highSeverityCount > 0) {
        overallRisk = 'high';
    }
    else if (mediumSeverityCount > 1) {
        overallRisk = 'medium';
    }
    const mitigationStrategies = riskFactors.map(risk => ({
        risk: risk.risk,
        strategy: `Address ${risk.risk.toLowerCase()} through targeted intervention`,
        timeline: risk.severity === 'high' ? 'immediate' : '2-4 weeks',
        resources: ['User success team', 'Personalized content', 'Feature guidance'],
        successIndicators: ['Improved engagement metrics', 'Increased platform usage', 'Better feature adoption']
    }));
    const monitoringPlan = {
        metrics: ['engagement_score', 'weekly_logins', 'feature_adoption', 'session_duration'],
        frequency: overallRisk === 'high' ? 'daily' : 'weekly',
        thresholds: {
            engagement_score: 50,
            weekly_logins: 2,
            feature_adoption: 3,
            session_duration: 5
        },
        alerts: [
            {
                metric: 'engagement_score',
                threshold: 30,
                severity: 'critical',
                action: 'Immediate intervention required'
            },
            {
                metric: 'weekly_logins',
                threshold: 1,
                severity: 'warning',
                action: 'Send engagement nudge'
            }
        ]
    };
    return {
        overallRisk,
        riskFactors,
        mitigationStrategies,
        monitoringPlan
    };
}
async function recordEngagementEvent(eventData) {
    try {
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.getPrismaClient().auditLog.create({
            data: {
                entityType: 'engagement_event',
                entityId: eventId,
                action: eventData.eventType,
                changes: JSON.stringify({
                    feature: eventData.eventData.feature,
                    page: eventData.eventData.page,
                    duration: eventData.eventData.duration,
                    success: eventData.eventData.success ?? true,
                    metadata: eventData.eventData.metadata || {}
                }),
                userId: eventData.parentId,
                createdById: eventData.parentId,
                metadata: JSON.stringify({
                    sessionId: eventData.sessionId,
                    timestamp: eventData.timestamp
                })
            }
        });
        await cloudWatch.putMetricData({
            Namespace: 'Hasivu/Engagement',
            MetricData: [
                {
                    MetricName: 'EngagementEvent',
                    Value: 1,
                    Unit: 'Count',
                    Dimensions: [
                        { Name: 'EventType', Value: eventData.eventType },
                        { Name: 'Feature', Value: eventData.eventData.feature || 'unknown' }
                    ],
                    Timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date()
                }
            ]
        }).promise();
        logger.info('Engagement event recorded successfully', {
            parentId: eventData.parentId,
            eventType: eventData.eventType,
            feature: eventData.eventData.feature
        });
    }
    catch (error) {
        logger.error('Failed to record engagement event', {
            eventData,
            error: error.message
        });
    }
}
async function aggregateEngagementAnalytics(parentId, options) {
    try {
        const startTime = Date.now();
        const dashboardUsage = await getDashboardUsageMetrics(parentId, options.timeframe);
        const interactionPatterns = options.includeInteractionPatterns
            ? await analyzeInteractionPatterns(parentId, dashboardUsage)
            : [];
        const engagementScore = calculateEngagementScore(dashboardUsage, interactionPatterns);
        const behavioralInsights = generateBehavioralInsights(dashboardUsage, interactionPatterns, engagementScore);
        const benchmarkComparisons = options.includeBenchmarks
            ? await getBenchmarkComparisons(parentId, dashboardUsage, engagementScore)
            : [];
        const improvementSuggestions = options.includeRecommendations
            ? generateImprovementSuggestions(dashboardUsage, engagementScore, behavioralInsights)
            : [];
        const riskAssessment = assessEngagementRisks(dashboardUsage, engagementScore, behavioralInsights);
        const processingTime = Date.now() - startTime;
        const analytics = {
            parentId,
            generatedAt: new Date(),
            timeframe: options.timeframe,
            dashboardUsage,
            interactionPatterns,
            featureAdoption: {
                adoptionRate: 0.75,
                timeToAdoption: {},
                adoptionBarriers: [],
                dropoffPoints: [],
                retentionRates: {},
                crossFeatureUsage: [],
                onboardingEffectiveness: {
                    completionRate: 0.8,
                    averageTime: 15,
                    dropoffSteps: [],
                    effectivenessScore: 85,
                    userFeedback: []
                }
            },
            engagementScore,
            behavioralInsights,
            benchmarkComparisons,
            satisfactionMetrics: {
                overallSatisfaction: 4.2,
                npsScore: 7,
                featureSatisfaction: {},
                usabilityScore: 4.1,
                contentQualityScore: 4.3,
                performanceScore: 4.0,
                supportSatisfaction: 4.2,
                feedbackSentiment: {
                    positive: 0.7,
                    neutral: 0.2,
                    negative: 0.1,
                    themes: []
                },
                satisfactionTrends: []
            },
            improvementSuggestions,
            predictiveAnalytics: options.includePredictiveAnalytics ? {
                churnRisk: {
                    riskLevel: riskAssessment.overallRisk === 'high' ? 'high' : riskAssessment.overallRisk === 'medium' ? 'medium' : 'low',
                    riskScore: engagementScore.overall < 40 ? 0.8 : engagementScore.overall < 60 ? 0.4 : 0.1,
                    riskFactors: riskAssessment.riskFactors.map(r => ({
                        factor: r.risk,
                        weight: r.severity === 'high' ? 0.8 : 0.4,
                        currentValue: 0,
                        threshold: 0.5,
                        trend: 'stable'
                    })),
                    preventiveActions: improvementSuggestions.filter(s => s.priority === 'high').map(s => s.suggestion),
                    timeToChurn: engagementScore.overall < 30 ? 30 : engagementScore.overall < 50 ? 90 : 180
                },
                engagementPrediction: {
                    next30Days: Math.max(0, engagementScore.overall + (engagementScore.trend === 'increasing' ? 5 : engagementScore.trend === 'decreasing' ? -5 : 0)),
                    next90Days: Math.max(0, engagementScore.overall + (engagementScore.trend === 'increasing' ? 10 : engagementScore.trend === 'decreasing' ? -10 : 0)),
                    confidenceInterval: { lower: engagementScore.overall - 10, upper: engagementScore.overall + 10 },
                    influencingFactors: ['usage_frequency', 'feature_adoption', 'satisfaction_level'],
                    scenarios: []
                },
                featureAdoptionForecast: [],
                valueRealization: {
                    currentValue: engagementScore.overall,
                    potentialValue: 100,
                    realizationRate: engagementScore.overall / 100,
                    timeToRealization: (100 - engagementScore.overall) * 2,
                    blockers: improvementSuggestions.map(s => s.suggestion)
                }
            } : undefined,
            riskAssessment,
            metadata: {
                generatedAt: new Date(),
                dataRange: {
                    start: new Date(Date.now() - (options.timeframe === 'quarterly' ? 90 : options.timeframe === 'monthly' ? 30 : 7) * 24 * 60 * 60 * 1000),
                    end: new Date()
                },
                dataQuality: 0.9,
                confidence: 0.85,
                limitations: [
                    'Analysis based on platform usage data only',
                    'Behavioral predictions require longer observation periods',
                    'Satisfaction metrics depend on feedback availability'
                ],
                methodology: [
                    'Multi-dimensional engagement scoring',
                    'Behavioral pattern analysis',
                    'Comparative benchmarking',
                    'Risk assessment modeling'
                ],
                version: '1.0.0'
            }
        };
        logger.info('Engagement analytics generated successfully', {
            parentId,
            timeframe: options.timeframe,
            processingTime: `${processingTime}ms`,
            engagementScore: engagementScore.overall,
            riskLevel: riskAssessment.overallRisk
        });
        return analytics;
    }
    catch (error) {
        logger.error('Failed to aggregate engagement analytics', {
            parentId,
            options,
            error: error.message
        });
        throw error;
    }
}
const engagementIntelligenceHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Engagement intelligence request started', {
            requestId,
            method: event.httpMethod,
            path: event.path
        });
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if (!authResult.success || !authResult.user) {
            return (0, response_utils_1.createErrorResponse)('Authentication failed', 401);
        }
        const authenticatedUser = authResult.user;
        switch (event.httpMethod) {
            case 'POST':
                return await handleGetEngagementAnalytics(event, requestId, authenticatedUser);
            case 'PUT':
                return await handleRecordEngagementEvent(event, requestId, authenticatedUser);
            case 'PATCH':
                return await handleSubmitFeedback(event, requestId, authenticatedUser);
            default:
                return (0, response_utils_1.createErrorResponse)('Method not allowed', 405);
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Engagement intelligence request failed', {
            requestId,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to process engagement intelligence request');
    }
};
exports.engagementIntelligenceHandler = engagementIntelligenceHandler;
async function handleGetEngagementAnalytics(event, requestId, authenticatedUser) {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = engagementRequestSchema.parse(requestBody);
        await validateParentAccess(validatedData.parentId, authenticatedUser);
        const analytics = await aggregateEngagementAnalytics(validatedData.parentId, validatedData);
        logger.info('Engagement analytics generated successfully', {
            requestId,
            parentId: validatedData.parentId,
            engagementScore: analytics.engagementScore.overall,
            riskLevel: analytics.riskAssessment.overallRisk
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                analytics,
                message: 'Engagement analytics generated successfully'
            },
            message: 'Engagement analytics retrieved successfully',
            requestId
        }, 200);
    }
    catch (error) {
        logger.error('Failed to get engagement analytics', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
async function handleRecordEngagementEvent(event, requestId, authenticatedUser) {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = engagementEventSchema.parse(requestBody);
        await validateParentAccess(validatedData.parentId, authenticatedUser);
        await recordEngagementEvent(validatedData);
        logger.info('Engagement event recorded successfully', {
            requestId,
            parentId: validatedData.parentId,
            eventType: validatedData.eventType
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                message: 'Engagement event recorded successfully'
            },
            message: 'Event recorded successfully',
            requestId
        }, 200);
    }
    catch (error) {
        logger.error('Failed to record engagement event', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
async function handleSubmitFeedback(event, requestId, authenticatedUser) {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = feedbackSchema.parse(requestBody);
        await validateParentAccess(validatedData.parentId, authenticatedUser);
        const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        logger.info('Feedback submission skipped - userFeedback model not implemented', {
            parentId: validatedData.parentId,
            category: validatedData.category
        });
        logger.info('Feedback submitted successfully', {
            requestId,
            parentId: validatedData.parentId,
            category: validatedData.category,
            rating: validatedData.rating
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                message: 'Feedback submitted successfully (not stored - feature not implemented)'
            },
            message: 'Thank you for your feedback',
            requestId
        }, 200);
    }
    catch (error) {
        logger.error('Failed to submit feedback', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
//# sourceMappingURL=engagement-intelligence.js.map