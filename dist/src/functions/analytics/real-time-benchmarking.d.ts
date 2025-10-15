import { TrendDirection } from '../../types/analytics.types';
interface RealTimeMetric {
    metricId: string;
    schoolId: string;
    metricType: 'operational_efficiency' | 'financial_health' | 'nutrition_quality' | 'student_satisfaction' | 'safety_compliance';
    value: number;
    timestamp: Date;
    confidence: number;
    context: {
        studentCount: number;
        mealVolume: number;
        staffCount: number;
        seasonalFactor: number;
    };
}
interface PeerGroupDefinition {
    groupId: string;
    groupName: string;
    criteria: {
        studentCountRange: [number, number];
        subscriptionTier: string[];
        geographicRegion?: string;
        establishmentYearRange?: [number, number];
    };
    memberSchools: string[];
    benchmarks: {
        operationalEfficiency: number;
        financialHealth: number;
        nutritionQuality: number;
        studentSatisfaction: number;
        safetyCompliance: number;
    };
    performanceDistribution: {
        p25: Record<string, number>;
        p50: Record<string, number>;
        p75: Record<string, number>;
        p90: Record<string, number>;
    };
}
interface PerformanceRanking {
    rankingId: string;
    generatedAt: Date;
    peerGroupId: string;
    schoolRankings: Array<{
        anonymousId: string;
        overallRank: number;
        percentileRank: number;
        categoryRanks: {
            operational: number;
            financial: number;
            nutrition: number;
            satisfaction: number;
            safety: number;
        };
        trendDirection: TrendDirection;
        performanceScore: number;
        strengthAreas: string[];
        improvementAreas: string[];
    }>;
    industryInsights: {
        topPerformanceFactors: Array<{
            factor: string;
            correlation: number;
            significance: number;
        }>;
        commonChallenges: Array<{
            challenge: string;
            affectedPercentage: number;
            severityScore: number;
        }>;
        emergingTrends: Array<{
            trend: string;
            adoptionRate: number;
            impactScore: number;
        }>;
    };
}
interface PerformanceAnomaly {
    anomalyId: string;
    schoolId?: string;
    anonymousId: string;
    detectedAt: Date;
    anomalyType: 'sudden_drop' | 'gradual_decline' | 'unusual_spike' | 'pattern_deviation' | 'peer_deviation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    affectedMetrics: Array<{
        metric: string;
        currentValue: number;
        expectedValue: number;
        deviation: number;
        historicalRange: [number, number];
    }>;
    context: {
        detectionMethod: 'statistical' | 'ml_based' | 'peer_comparison' | 'trend_analysis';
        timeWindow: string;
        comparisonBaseline: 'historical' | 'peer_group' | 'industry_standard';
    };
    potentialCauses: Array<{
        cause: string;
        probability: number;
        category: 'operational' | 'external' | 'seasonal' | 'systematic';
        evidenceStrength: number;
    }>;
    recommendations: Array<{
        recommendation: string;
        priority: 'immediate' | 'high' | 'medium' | 'low';
        estimatedImpact: string;
        implementationComplexity: 'low' | 'medium' | 'high';
        timeframe: string;
    }>;
    resolutionStatus: 'detected' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive';
    estimatedResolutionTime?: Date;
    actualResolutionTime?: Date;
}
interface BestPracticeRecommendation {
    practiceId: string;
    title: string;
    category: 'operational' | 'financial' | 'nutritional' | 'technological' | 'managerial';
    evidenceStrength: number;
    adoptionRate: number;
    averageImpact: number;
    description: string;
    implementationSteps: string[];
    resourceRequirements: {
        timeInvestment: string;
        budgetRange: string;
        staffTrainingRequired: boolean;
        technologyRequirements: string[];
    };
    successFactors: Array<{
        factor: string;
        importance: number;
        controllability: number;
    }>;
    potentialObstacles: Array<{
        obstacle: string;
        likelihood: number;
        mitigationStrategies: string[];
    }>;
    performanceCorrelation: {
        operationalEfficiency: number;
        financialHealth: number;
        nutritionQuality: number;
        studentSatisfaction: number;
    };
    successCases: Array<{
        anonymousSchoolId: string;
        implementationDate: Date;
        measuredImpact: Record<string, number>;
        lessonsLearned: string[];
    }>;
}
interface PredictivePerformanceModel {
    modelId: string;
    modelType: 'performance_trajectory' | 'risk_assessment' | 'opportunity_identification' | 'benchmark_achievement';
    trainedOn: Date;
    accuracy: number;
    precision: number;
    recall: number;
    dataPoints: number;
    predictionHorizon: {
        shortTerm: number;
        mediumTerm: number;
        longTerm: number;
    };
    featureImportance: Array<{
        feature: string;
        importance: number;
        category: 'controllable' | 'external' | 'seasonal';
        description: string;
    }>;
    predictions: Array<{
        schoolId: string;
        anonymousId: string;
        predictionType: 'performance_score' | 'rank_change' | 'risk_level' | 'improvement_potential';
        shortTermPrediction: {
            value: number;
            confidence: number;
            confidenceInterval: [number, number];
        };
        mediumTermPrediction: {
            value: number;
            confidence: number;
            confidenceInterval: [number, number];
        };
        longTermPrediction: {
            value: number;
            confidence: number;
            confidenceInterval: [number, number];
        };
        keyDrivers: Array<{
            driver: string;
            impact: number;
            controllability: number;
        }>;
        scenarios: {
            bestCase: {
                conditions: string[];
                predictedOutcome: number;
                probability: number;
            };
            worstCase: {
                conditions: string[];
                predictedOutcome: number;
                probability: number;
            };
            mostLikely: {
                conditions: string[];
                predictedOutcome: number;
                probability: number;
            };
        };
    }>;
}
declare class RealTimeBenchmarkingEngine {
    private database;
    private logger;
    private metricsCache;
    private peerGroups;
    private anomalyDetectors;
    private performancePredictors;
    constructor();
    initialize(schools: any[] | undefined): Promise<void>;
    private createPeerGroups;
    private getSchoolSizeCategory;
    private getSchoolSizeRange;
    private createAnonymousId;
    private calculateGroupBenchmarks;
    private calculatePerformanceDistribution;
    private calculatePercentile;
    private calculateSchoolMetrics;
    private initializeAnomalyDetectors;
    private initializePerformancePredictors;
    private startMetricCollection;
    private collectRealTimeMetrics;
    private calculateSeasonalFactor;
    private performAnomalyDetection;
    private detectSchoolAnomalies;
    private getHistoricalMetrics;
    private detectPeerGroupAnomalies;
    private identifyPotentialCauses;
    private generateAnomalyRecommendations;
    private generatePeerComparisonRecommendations;
    private updatePerformanceRankings;
    private generatePeerGroupRanking;
    private calculateCategoryRank;
    private calculateTrendDirection;
    private identifyStrengthAreas;
    private identifyImprovementAreas;
    private reverseAnonymousId;
    getSystemStatus(): {
        status: 'healthy' | 'degraded' | 'critical';
        metricsCollected: number;
        anomaliesDetected: number;
        peerGroupsActive: number;
        lastUpdate: Date;
    };
}
export declare const realTimeBenchmarkingEngine: RealTimeBenchmarkingEngine;
export { RealTimeBenchmarkingEngine };
export type { RealTimeMetric, PeerGroupDefinition, PerformanceRanking, PerformanceAnomaly, BestPracticeRecommendation, PredictivePerformanceModel, };
//# sourceMappingURL=real-time-benchmarking.d.ts.map