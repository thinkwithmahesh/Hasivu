import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TrendDirection } from '../../types/analytics.types';
interface MarketOpportunity {
    opportunityId: string;
    title: string;
    category: 'market_expansion' | 'product_innovation' | 'operational_efficiency' | 'partnership' | 'technology_adoption';
    description: string;
    market: {
        totalAddressableMarket: number;
        servicableAddressableMarket: number;
        servicableObtainableMarket: number;
        marketGrowthRate: number;
        competitiveIntensity: number;
        marketMaturity: 'emerging' | 'growing' | 'mature' | 'declining';
    };
    opportunity: {
        impactPotential: number;
        difficulty: number;
        timeToRealization: number;
        resourceRequirement: 'low' | 'medium' | 'high' | 'very_high';
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
    };
    financialProjection: {
        investmentRequired: number;
        expectedRevenue: {
            year1: number;
            year2: number;
            year3: number;
        };
        breakEvenPoint: number;
        roi: number;
        npv: number;
        irr: number;
    };
    implementation: {
        prerequisiteCapabilities: string[];
        keyMilestones: Array<{
            milestone: string;
            timeline: string;
            dependencies: string[];
        }>;
        successMetrics: string[];
        riskMitigationStrategies: string[];
    };
    priorityScore: number;
    recommendationLevel: 'immediate' | 'short_term' | 'medium_term' | 'long_term' | 'not_recommended';
}
interface CompetitiveIntelligence {
    analysisId: string;
    generatedAt: Date;
    marketOverview: {
        totalMarketSize: number;
        marketGrowthRate: number;
        keyMarketDrivers: string[];
        marketChallenges: string[];
        regulatoryEnvironment: string;
    };
    competitors: Array<{
        competitorId: string;
        name: string;
        marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
        marketShare: number;
        strengths: string[];
        weaknesses: string[];
        strategicFocus: string[];
        recentMoves: string[];
        financialHealth: {
            revenue: number;
            profitability: number;
            growthRate: number;
            investmentCapacity: 'high' | 'medium' | 'low';
        };
        operationalMetrics: {
            customerSatisfaction: number;
            serviceQuality: number;
            innovationIndex: number;
            marketAgility: number;
        };
        threatLevel: 'high' | 'medium' | 'low';
        competitiveAdvantage: string;
    }>;
    ourPosition: {
        marketRank: number;
        marketShare: number;
        competitiveAdvantages: string[];
        vulnerabilities: string[];
        differentiationFactors: string[];
        benchmarkComparison: {
            versusMarketLeader: {
                strengthAreas: string[];
                gapAreas: string[];
                improvementPotential: number;
            };
            versusDirectCompetitors: {
                superiorAreas: string[];
                laggingAreas: string[];
                neutralAreas: string[];
            };
        };
    };
    strategicRecommendations: Array<{
        recommendation: string;
        rationale: string;
        expectedImpact: 'high' | 'medium' | 'low';
        implementationComplexity: 'low' | 'medium' | 'high';
        timeline: string;
        priority: number;
    }>;
}
interface GrowthStrategy {
    strategyId: string;
    strategyName: string;
    strategicTheme: 'organic_growth' | 'market_expansion' | 'product_diversification' | 'strategic_partnerships' | 'digital_transformation';
    currentState: {
        baselineMetrics: {
            revenue: number;
            customers: number;
            marketShare: number;
            profitability: number;
        };
        coreCapabilities: string[];
        resourceAvailability: {
            financial: number;
            human: number;
            technological: number;
            operational: number;
        };
    };
    growthVectors: Array<{
        vector: string;
        category: 'existing_markets' | 'new_markets' | 'existing_products' | 'new_products';
        growthPotential: number;
        requiredInvestment: number;
        timeToImpact: number;
        riskLevel: 'low' | 'medium' | 'high';
        enablers: string[];
        barriers: string[];
        successFactors: string[];
    }>;
    strategicInitiatives: Array<{
        initiative: string;
        description: string;
        objectives: string[];
        implementation: {
            phases: Array<{
                phase: string;
                duration: number;
                activities: string[];
                deliverables: string[];
                resources: string[];
            }>;
            totalDuration: number;
            totalInvestment: number;
        };
        expectedOutcomes: {
            revenueImpact: number;
            customerImpact: number;
            operationalImpact: number;
            strategicImpact: number;
        };
        riskFactors: Array<{
            risk: string;
            probability: number;
            impact: number;
            mitigation: string;
        }>;
        successMetrics: Array<{
            metric: string;
            baseline: number;
            target: number;
            timeline: string;
        }>;
    }>;
    resourceRequirements: {
        financial: {
            totalInvestment: number;
            yearlyBudget: number[];
            fundingSources: string[];
        };
        human: {
            newHires: number;
            skillRequirements: string[];
            trainingNeeds: string[];
        };
        technological: {
            platformRequirements: string[];
            infrastructureNeeds: string[];
            integrationRequirements: string[];
        };
    };
    timeline: {
        quickWins: string[];
        shortTerm: string[];
        mediumTerm: string[];
        longTerm: string[];
    };
}
interface RiskAssessment {
    assessmentId: string;
    assessmentDate: Date;
    assessmentScope: 'strategic' | 'operational' | 'financial' | 'regulatory' | 'technological';
    riskCategories: {
        strategic: {
            marketRisks: Array<{
                risk: string;
                description: string;
                probability: number;
                impact: number;
                riskScore: number;
                category: 'market_shift' | 'competition' | 'demand_change' | 'technology_disruption';
                indicators: Array<{
                    indicator: string;
                    currentValue: any;
                    thresholdValue: any;
                    trendDirection: TrendDirection;
                }>;
                mitigationStrategies: Array<{
                    strategy: string;
                    effectiveness: number;
                    cost: number;
                    timeToImplement: number;
                }>;
            }>;
            competitiveRisks: Array<{
                risk: string;
                competitor: string;
                probability: number;
                impact: number;
                potentialLoss: number;
                mitigationActions: string[];
            }>;
        };
        operational: {
            resourceRisks: Array<{
                risk: string;
                resourceType: 'human' | 'financial' | 'technological' | 'physical';
                criticality: 'high' | 'medium' | 'low';
                contingencyPlans: string[];
            }>;
            processRisks: Array<{
                risk: string;
                affectedProcesses: string[];
                businessImpact: string;
                preventiveControls: string[];
            }>;
        };
        regulatory: {
            complianceRisks: Array<{
                regulation: string;
                riskLevel: 'high' | 'medium' | 'low';
                complianceStatus: 'compliant' | 'partially_compliant' | 'non_compliant';
                potentialPenalties: number;
                remediationActions: string[];
            }>;
        };
    };
    riskMatrix: {
        highProbabilityHighImpact: string[];
        highProbabilityLowImpact: string[];
        lowProbabilityHighImpact: string[];
        lowProbabilityLowImpact: string[];
    };
    riskMitigationRoadmap: {
        immediate: Array<{
            action: string;
            targetRisks: string[];
            owner: string;
            deadline: Date;
            budget: number;
        }>;
        shortTerm: Array<{
            action: string;
            targetRisks: string[];
            timeline: string;
            dependencies: string[];
        }>;
        longTerm: Array<{
            action: string;
            strategicImportance: 'high' | 'medium' | 'low';
            investmentRequired: number;
        }>;
    };
    monitoringFramework: {
        keyRiskIndicators: Array<{
            indicator: string;
            measurementFrequency: string;
            alertThresholds: {
                yellow: any;
                red: any;
            };
            responsibleParty: string;
        }>;
        reviewSchedule: {
            dailyMonitoring: string[];
            weeklyReviews: string[];
            monthlyAssessments: string[];
            quarterlyUpdates: string[];
        };
    };
}
interface ScenarioAnalysis {
    analysisId: string;
    analysisDate: Date;
    planningHorizon: number;
    baselineScenario: {
        name: string;
        description: string;
        assumptions: string[];
        keyMetrics: {
            revenue: number[];
            growth: number[];
            marketShare: number[];
            profitability: number[];
        };
        probability: number;
    };
    alternativeScenarios: Array<{
        scenarioId: string;
        name: string;
        description: string;
        scenarioType: 'optimistic' | 'pessimistic' | 'disruptive' | 'regulatory_change';
        keyChanges: Array<{
            factor: string;
            changeDescription: string;
            impactMagnitude: number;
        }>;
        projectedOutcomes: {
            financial: {
                revenueImpact: number;
                profitabilityImpact: number;
                cashFlowImpact: number;
                investmentRequirements: number;
            };
            operational: {
                customerImpact: number;
                marketPositionImpact: number;
                operationalEfficiencyImpact: number;
                competitiveAdvantageImpact: number;
            };
            strategic: {
                goalAchievementImpact: number;
                riskExposureChange: number;
                opportunityAvailability: number;
                adaptationRequirements: string[];
            };
        };
        probability: number;
        impactSeverity: 'low' | 'medium' | 'high' | 'critical';
        strategicResponses: Array<{
            response: string;
            triggerConditions: string[];
            preparationActions: string[];
            implementationComplexity: 'low' | 'medium' | 'high';
        }>;
    }>;
    crossScenarioInsights: {
        robustStrategies: string[];
        vulnerableAreas: string[];
        hedgingOpportunities: string[];
        adaptabilityFactors: string[];
    };
    strategicImplications: {
        portfolioOptimization: string[];
        contingencyPlanning: string[];
        riskManagement: string[];
        investmentPrioritization: string[];
    };
    monitoringIndicators: Array<{
        indicator: string;
        scenario: string;
        earlyWarningSignals: string[];
        measurementFrequency: string;
        responsePlan: string;
    }>;
}
interface StrategicRecommendation {
    recommendationId: string;
    title: string;
    category: 'growth' | 'efficiency' | 'innovation' | 'market_position' | 'risk_mitigation' | 'digital_transformation';
    priority: 'critical' | 'high' | 'medium' | 'low';
    executiveSummary: string;
    strategicRationale: string;
    businessCase: {
        problemStatement: string;
        proposedSolution: string;
        expectedBenefits: Array<{
            benefit: string;
            quantification: string;
            timeline: string;
        }>;
        investmentRequired: {
            totalInvestment: number;
            capitalExpenditure: number;
            operationalExpenditure: number;
            humanResources: number;
        };
        financialReturns: {
            roi: number;
            paybackPeriod: number;
            npv: number;
            irr: number;
        };
    };
    implementationPlan: {
        phases: Array<{
            phase: string;
            objectives: string[];
            duration: number;
            keyActivities: string[];
            deliverables: string[];
            resources: string[];
            dependencies: string[];
        }>;
        timeline: {
            preparationPhase: string;
            executionPhase: string;
            monitoringPhase: string;
            optimizationPhase: string;
        };
        governance: {
            executiveSponsor: string;
            projectManager: string;
            steeringCommittee: string[];
            workingGroups: string[];
        };
    };
    riskAssessment: {
        implementationRisks: Array<{
            risk: string;
            probability: number;
            impact: number;
            mitigation: string;
        }>;
        businessRisks: Array<{
            risk: string;
            category: string;
            severity: 'low' | 'medium' | 'high';
            contingency: string;
        }>;
    };
    successMetrics: Array<{
        metric: string;
        baseline: number;
        target: number;
        measurementMethod: string;
        reportingFrequency: string;
        owner: string;
    }>;
    alternatives: Array<{
        alternative: string;
        prosAndCons: {
            pros: string[];
            cons: string[];
        };
        riskProfile: string;
        recommendationReason: string;
    }>;
}
declare class StrategicInsightsGenerator {
    private database;
    private logger;
    private marketDataCache;
    private competitorDataCache;
    private trendAnalysisCache;
    constructor();
    generateMarketOpportunityAnalysis(scope?: string, timeHorizon?: string, focusAreas?: string[]): Promise<MarketOpportunity[]>;
    generateCompetitiveIntelligence(includeFinancialData?: boolean, analysisDepth?: string): Promise<CompetitiveIntelligence>;
    generateGrowthStrategy(strategicTheme?: string, timeHorizon?: string): Promise<GrowthStrategy>;
    generateStrategicRiskAssessment(assessmentScope?: string, timeHorizon?: string): Promise<RiskAssessment>;
    generateScenarioAnalysis(baselineScenario: string, alternativeScenarios: string[], timeframe?: string): Promise<ScenarioAnalysis>;
    generateStrategicRecommendations(analysisTypes: string[], priorityLevel?: string): Promise<StrategicRecommendation[]>;
    getStrategicInsightsDashboard(timeHorizon?: string, includeScenarios?: boolean): Promise<{
        marketOpportunities: MarketOpportunity[];
        competitiveIntelligence: CompetitiveIntelligence;
        growthStrategy: GrowthStrategy;
        riskAssessment: RiskAssessment;
        scenarioAnalysis?: ScenarioAnalysis;
        strategicRecommendations: StrategicRecommendation[];
        executiveSummary: {
            keyFindings: string[];
            criticalActions: string[];
            strategicPriorities: string[];
            riskAlerts: string[];
        };
    }>;
}
export declare const strategicInsightsHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const strategicInsightsGenerator: StrategicInsightsGenerator;
export { StrategicInsightsGenerator };
export type { MarketOpportunity, CompetitiveIntelligence, GrowthStrategy, RiskAssessment, ScenarioAnalysis, StrategicRecommendation, };
//# sourceMappingURL=strategic-insights-generator.d.ts.map