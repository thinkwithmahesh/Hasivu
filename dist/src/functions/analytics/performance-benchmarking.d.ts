import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TrendDirection } from '../../types/analytics.types';
interface BenchmarkMetric {
    metricId: string;
    name: string;
    category: 'financial' | 'operational' | 'customer' | 'growth' | 'efficiency' | 'quality';
    value: number;
    unit: string;
    description: string;
    percentileRanking: {
        p10: number;
        p25: number;
        p50: number;
        p75: number;
        p90: number;
    };
    industryComparison: {
        industryAverage: number;
        industryMedian: number;
        topPerformers: number;
        ourPosition: number;
        gap: number;
        gapPercentage: number;
    };
    trend: {
        direction: TrendDirection;
        rate: number;
        period: string;
        sustainability: 'sustainable' | 'at_risk' | 'unsustainable';
    };
    benchmarkSources: Array<{
        source: string;
        type: 'industry_report' | 'survey_data' | 'public_data' | 'peer_analysis';
        credibility: number;
        sampleSize: number;
        lastUpdated: Date;
    }>;
}
interface PeerGroupAnalysis {
    peerGroupId: string;
    groupName: string;
    description: string;
    criteria: {
        studentCountRange: [number, number];
        revenueRange: [number, number];
        geographicRegion: string[];
        businessModel: string[];
        establishmentYear: [number, number];
    };
    memberCount: number;
    anonymizedMembers: Array<{
        memberId: string;
        memberTier: 'top_quartile' | 'upper_middle' | 'lower_middle' | 'bottom_quartile';
        keyCharacteristics: string[];
        strengthAreas: string[];
        improvementAreas: string[];
    }>;
    groupBenchmarks: {
        financial: {
            averageRevenue: number;
            medianRevenue: number;
            revenueGrowthRate: number;
            profitMargin: number;
            customerLifetimeValue: number;
        };
        operational: {
            customerSatisfaction: number;
            operationalEfficiency: number;
            serviceUptime: number;
            orderFulfillmentRate: number;
            averageDeliveryTime: number;
        };
        growth: {
            customerGrowthRate: number;
            marketExpansionRate: number;
            newProductAdoption: number;
            retentionRate: number;
        };
    };
    bestPractices: Array<{
        practiceId: string;
        title: string;
        category: string;
        description: string;
        adoptionRate: number;
        impactScore: number;
        implementationComplexity: 'low' | 'medium' | 'high';
        resourceRequirements: string;
        successFactors: string[];
    }>;
    groupInsights: {
        commonChallenges: Array<{
            challenge: string;
            prevalence: number;
            severity: 'low' | 'medium' | 'high' | 'critical';
            typicalSolutions: string[];
        }>;
        emergingTrends: Array<{
            trend: string;
            adoptionStage: 'early' | 'growing' | 'mainstream' | 'mature';
            potentialImpact: number;
            timeToMainstream: string;
        }>;
        competitiveThreats: Array<{
            threat: string;
            urgency: 'low' | 'medium' | 'high' | 'critical';
            impactArea: string[];
            mitigationStrategies: string[];
        }>;
    };
}
interface CompetitiveAnalysis {
    analysisId: string;
    analysisType: string;
    generatedAt: Date;
    analysisScope: {
        timeHorizon: string;
        geographicScope: string;
        industrySegments: string[];
        competitorCount: number;
    };
    marketPosition: {
        marketShare: number;
        marketRank: number;
        totalMarketSize: number;
        growthRate: number;
        competitiveStrength: number;
        positioningMatrix: {
            quadrant: 'leaders' | 'challengers' | 'visionaries' | 'niche_players';
            x_axis: string;
            y_axis: string;
            x_value: number;
            y_value: number;
        };
    };
    competitorProfiles: Array<{
        competitorId: string;
        name: string;
        type: 'direct' | 'indirect' | 'potential';
        marketShare: number;
        strengths: Array<{
            area: string;
            description: string;
            impact: 'high' | 'medium' | 'low';
            sustainability: 'strong' | 'moderate' | 'weak';
        }>;
        weaknesses: Array<{
            area: string;
            description: string;
            exploitability: 'high' | 'medium' | 'low';
            ourAdvantage: boolean;
        }>;
        strategies: Array<{
            strategy: string;
            focus: string;
            effectiveness: number;
            threat_level: 'low' | 'medium' | 'high' | 'critical';
        }>;
        financialMetrics: {
            estimatedRevenue: number;
            growthRate: number;
            marketInvestment: number;
            pricingStrategy: string;
            profitabilityLevel: 'high' | 'medium' | 'low' | 'unknown';
        };
        recentMoves: Array<{
            date: Date;
            action: string;
            impact: string;
            ourResponse: string;
        }>;
    }>;
    swotAnalysis: {
        strengths: Array<{
            strength: string;
            uniqueness: 'unique' | 'difficult_to_copy' | 'common';
            sustainability: 'long_term' | 'medium_term' | 'short_term';
            competitiveAdvantage: boolean;
        }>;
        weaknesses: Array<{
            weakness: string;
            severity: 'critical' | 'high' | 'medium' | 'low';
            addressability: 'easy' | 'moderate' | 'difficult';
            competitorExploitation: 'high' | 'medium' | 'low';
        }>;
        opportunities: Array<{
            opportunity: string;
            marketSize: number;
            timeline: string;
            requiredInvestment: number;
            successProbability: number;
            competitiveIntensity: 'low' | 'medium' | 'high';
        }>;
        threats: Array<{
            threat: string;
            probability: number;
            impact: number;
            timeline: string;
            mitigationStrategies: string[];
        }>;
    };
    competitiveGaps: Array<{
        area: string;
        gapType: 'feature' | 'capability' | 'market' | 'technology' | 'customer_segment';
        gapSize: 'small' | 'medium' | 'large' | 'critical';
        description: string;
        competitorAdvantage: string;
        closingStrategy: string;
        investmentRequired: number;
        timeToClose: string;
        priority: 'critical' | 'high' | 'medium' | 'low';
    }>;
    recommendations: Array<{
        recommendation: string;
        category: 'strategic' | 'operational' | 'tactical' | 'defensive';
        urgency: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
        impact: 'transformational' | 'significant' | 'moderate' | 'incremental';
        investment: 'high' | 'medium' | 'low';
        riskLevel: 'high' | 'medium' | 'low';
        successFactors: string[];
    }>;
}
interface IndustryBenchmark {
    benchmarkId: string;
    industrySegment: string;
    generatedAt: Date;
    dataValidityPeriod: {
        startDate: Date;
        endDate: Date;
    };
    sampleCharacteristics: {
        totalCompanies: number;
        averageRevenue: number;
        geographicDistribution: Record<string, number>;
        companyStages: Record<string, number>;
        dataQuality: number;
    };
    keyMetrics: BenchmarkMetric[];
    industryInsights: {
        marketTrends: Array<{
            trend: string;
            strength: 'weak' | 'moderate' | 'strong' | 'dominant';
            direction: 'accelerating' | 'stable' | 'declining';
            impactAreas: string[];
            timeframe: string;
        }>;
        disruptiveForces: Array<{
            force: string;
            disruptionLevel: 'low' | 'medium' | 'high' | 'transformational';
            affectedSegments: string[];
            timeline: string;
            preparednessLevel: string;
        }>;
        successFactors: Array<{
            factor: string;
            importance: number;
            correlation: number;
            controllability: 'high' | 'medium' | 'low';
            improvementStrategies: string[];
        }>;
        emergingOpportunities: Array<{
            opportunity: string;
            marketPotential: number;
            competitiveIntensity: 'low' | 'medium' | 'high';
            barrierToEntry: 'low' | 'medium' | 'high';
            timeToMarket: string;
        }>;
    };
    performanceDistribution: {
        topPerformers: {
            characteristicsProfile: Array<{
                characteristic: string;
                prevalence: number;
                uniqueness: string;
            }>;
            commonStrategies: string[];
            investmentPatterns: Record<string, number>;
        };
        strugglingPerformers: {
            commonChallenges: string[];
            typicalCauses: string[];
            recoveryStrategies: string[];
            turnaroundTimeline: string;
        };
    };
    regulatoryEnvironment: {
        currentRegulations: Array<{
            regulation: string;
            impact: 'high' | 'medium' | 'low';
            complianceCost: number;
            complianceComplexity: 'low' | 'medium' | 'high';
        }>;
        upcomingChanges: Array<{
            change: string;
            effectiveDate: Date;
            preparationRequired: string;
            businessImpact: string;
        }>;
    };
}
interface BestPracticeRecommendation {
    practiceId: string;
    title: string;
    category: 'operational' | 'financial' | 'strategic' | 'technology' | 'customer' | 'hr';
    evidenceBase: {
        studyBasis: string;
        sampleSize: number;
        dataQuality: number;
        statisticalSignificance: number;
        reproducibility: 'high' | 'medium' | 'low';
    };
    performance_impact: {
        averageImprovement: number;
        improvementRange: [number, number];
        timeToImpact: string;
        sustainabilityFactor: number;
        riskFactors: string[];
    };
    implementation: {
        description: string;
        prerequisites: string[];
        keySteps: Array<{
            step: number;
            description: string;
            duration: string;
            resources: string[];
            successCriteria: string[];
            commonPitfalls: string[];
        }>;
        resourceRequirements: {
            humanResources: Array<{
                role: string;
                timeCommitment: string;
                skillsRequired: string[];
            }>;
            financialInvestment: {
                initialCost: number;
                ongoingCost: number;
                roi_timeline: string;
                paybackPeriod: string;
            };
            technologyRequirements: string[];
            processChanges: string[];
        };
    };
    adaptation: {
        contextualFactors: Array<{
            factor: string;
            importance: 'critical' | 'high' | 'medium' | 'low';
            adaptationGuidance: string;
        }>;
        scalingConsiderations: Array<{
            consideration: string;
            scalingStrategy: string;
            potentialChallenges: string[];
        }>;
        customizationOptions: Array<{
            option: string;
            applicableWhen: string;
            modifications: string[];
            impactOnEffectiveness: string;
        }>;
    };
    successStories: Array<{
        organizationType: string;
        implementation_approach: string;
        resultsAchieved: string;
        keyLearnings: string[];
        timeline: string;
    }>;
    monitoring: {
        kpis: Array<{
            kpi: string;
            measurement: string;
            frequency: string;
            targetValue: number;
            alertThresholds: Array<{
                level: 'warning' | 'critical';
                threshold: number;
                action: string;
            }>;
        }>;
        reviewSchedule: {
            frequency: string;
            reviewCriteria: string[];
            adjustmentTriggers: string[];
        };
    };
}
declare class PerformanceBenchmarkingEngine {
    private database;
    private logger;
    private benchmarkCache;
    private peerGroupCache;
    private competitiveCache;
    constructor();
    private initializeBenchmarkData;
    private generateIndustryMetrics;
    generateIndustryBenchmark(metrics: string[], timeframe: string, includeForecasts?: boolean): Promise<IndustryBenchmark>;
    generatePeerGroupAnalysis(schoolId?: string, anonymize?: boolean): Promise<PeerGroupAnalysis>;
    private generateAnonymizedMembers;
    private generateMemberCharacteristics;
    private generateStrengthAreas;
    private generateImprovementAreas;
    private generateBestPractices;
    generateCompetitiveAnalysis(analysisType: string, geographicScope?: string, includePublicData?: boolean): Promise<CompetitiveAnalysis>;
    private generateCompetitorProfiles;
    private generateSWOTAnalysis;
    private generateCompetitiveGaps;
    private generateCompetitiveRecommendations;
    generateBestPracticeRecommendations(category?: string, implementationComplexity?: string): Promise<BestPracticeRecommendation[]>;
    getBenchmarkData(benchmarkId: string): IndustryBenchmark | null;
    getPeerGroupAnalysis(peerGroupId: string): PeerGroupAnalysis | null;
    getCompetitiveAnalysis(analysisId: string): CompetitiveAnalysis | null;
}
declare const performanceBenchmarkingEngine: PerformanceBenchmarkingEngine;
export declare const performanceBenchmarkingHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export { PerformanceBenchmarkingEngine, performanceBenchmarkingEngine };
//# sourceMappingURL=performance-benchmarking.d.ts.map