export type PrivacyLevel = 'none' | 'basic' | 'differential' | 'federated';
export type SchoolTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'developing';
export type BenchmarkCategory = 'operational_efficiency' | 'nutrition_quality' | 'student_satisfaction' | 'cost_effectiveness' | 'sustainability' | 'safety_compliance';
export type FederatedModelType = 'nutrition_optimization' | 'demand_forecasting' | 'cost_prediction' | 'quality_assessment' | 'waste_reduction';
export interface DifferentialPrivacyParams {
    epsilon: number;
    delta: number;
    sensitivity: number;
    mechanism: 'laplace' | 'gaussian' | 'exponential';
}
export interface AnonymizedSchool {
    anonymousId: string;
    tier: SchoolTier;
    region: string;
    studentCount: number;
    establishedYear: number;
    characteristics: string[];
    performanceVector: number[];
}
export interface CrossSchoolBenchmark {
    benchmarkId: string;
    category: BenchmarkCategory;
    generatedAt: Date;
    privacyLevel: PrivacyLevel;
    schoolCount: number;
    peerGroups: Array<{
        tierGroup: SchoolTier;
        schoolCount: number;
        averageScore: number;
        medianScore: number;
        topPercentile: number;
        bottomPercentile: number;
        improvementTrend: number;
    }>;
    bestPractices: Array<{
        practiceId: string;
        category: string;
        description: string;
        effectivenessScore: number;
        adoptionRate: number;
        schoolTiers: SchoolTier[];
        anonymizedCaseStudy?: string;
    }>;
    insights: Array<{
        type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
        description: string;
        confidence: number;
        affectedTiers: SchoolTier[];
        recommendedActions: string[];
    }>;
    privacyAudit: {
        dataPoints: number;
        anonymizationLevel: number;
        privacyBudgetUsed: number;
        complianceScore: number;
    };
}
export interface NutritionIntelligence {
    analysisId: string;
    generatedAt: Date;
    nutritionMetrics: {
        averageNutritionalScore: number;
        balanceIndex: number;
        varietyScore: number;
        seasonalAdaptation: number;
        wastageRate: number;
        studentSatisfaction: number;
    };
    menuOptimization: Array<{
        recommendation: string;
        nutritionalImpact: number;
        costImpact: number;
        implementationDifficulty: 'low' | 'medium' | 'high';
        evidenceStrength: number;
        anonymizedSuccessStories: string[];
    }>;
    dietaryPatterns: Array<{
        pattern: string;
        prevalence: number;
        healthScore: number;
        culturalRelevance: number;
        seasonalFactors: string[];
    }>;
    wasteReduction: Array<{
        strategy: string;
        potentialSavings: number;
        environmentalImpact: number;
        implementationCost: number;
        successProbability: number;
    }>;
}
export interface OperationalExcellence {
    analysisId: string;
    generatedAt: Date;
    kitchenEfficiency: {
        averagePreparationTime: number;
        equipmentUtilization: number;
        staffProductivity: number;
        qualityConsistency: number;
        energyEfficiency: number;
    };
    staffInsights: Array<{
        metric: string;
        benchmarkValue: number;
        topPerformerValue: number;
        improvementPotential: number;
        trainingRecommendations: string[];
    }>;
    supplyChainOptimization: Array<{
        category: string;
        currentEfficiency: number;
        potentialImprovement: number;
        costSavings: number;
        qualityImpact: number;
        recommendations: string[];
    }>;
    equipmentPredictions: Array<{
        equipmentType: string;
        maintenanceScore: number;
        replacementRecommendation: 'immediate' | 'short_term' | 'long_term' | 'none';
        costImplication: number;
        efficiencyImpact: number;
    }>;
}
export interface PredictiveInsights {
    forecastId: string;
    generatedAt: Date;
    confidenceLevel: number;
    demandForecasting: {
        nextMonth: {
            enrollmentChange: number;
            mealDemand: number;
            peakDays: string[];
            resourceRequirements: Record<string, number>;
        };
        nextQuarter: {
            enrollmentTrend: number;
            seasonalFactors: Record<string, number>;
            budgetProjection: number;
            staffingNeeds: number;
        };
        nextYear: {
            growthProjection: number;
            infrastructureNeeds: string[];
            investmentRecommendations: Array<{
                area: string;
                priority: number;
                estimatedCost: number;
                expectedROI: number;
            }>;
        };
    };
    riskAssessment: Array<{
        riskType: string;
        probability: number;
        impact: number;
        riskScore: number;
        mitigationStrategies: string[];
        monitoringRecommendations: string[];
    }>;
    growthOpportunities: Array<{
        opportunity: string;
        marketPotential: number;
        competitiveAdvantage: number;
        resourceRequirement: 'low' | 'medium' | 'high';
        timeToImplement: number;
        expectedBenefit: string;
    }>;
}
export interface FederatedTrainingResult {
    modelId: string;
    modelType: FederatedModelType;
    trainingRound: number;
    participatingSchools: number;
    globalModelPerformance: {
        accuracy: number;
        loss: number;
        convergence: number;
        generalizationScore: number;
    };
    aggregatedInsights: Array<{
        insight: string;
        confidence: number;
        applicability: SchoolTier[];
        evidenceStrength: number;
    }>;
    deployment: {
        readyForDeployment: boolean;
        recommendedTiers: SchoolTier[];
        performanceGuarantees: Record<string, number>;
        rollbackPlan: string;
    };
}
export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
        details?: unknown;
    };
}
export declare class CrossSchoolAnalyticsService {
    private static readonly CACHE_TTL;
    private static readonly PRIVACY_EPSILON;
    private static readonly MIN_SCHOOLS_FOR_COMPARISON;
    private static readonly FEDERATED_LEARNING_ROUNDS;
    private static readonly DEFAULT_PRIVACY_PARAMS;
    static initialize(): Promise<void>;
    static generateCrossSchoolBenchmark(category: BenchmarkCategory, targetSchoolId?: string, privacyLevel?: PrivacyLevel): Promise<ServiceResponse<CrossSchoolBenchmark>>;
    static generateNutritionIntelligence(schoolIds?: string[], privacyLevel?: PrivacyLevel): Promise<ServiceResponse<NutritionIntelligence>>;
    static generateOperationalExcellence(schoolIds?: string[], privacyLevel?: PrivacyLevel): Promise<ServiceResponse<OperationalExcellence>>;
    static generatePredictiveInsights(schoolIds?: string[], forecastHorizon?: number): Promise<ServiceResponse<PredictiveInsights>>;
    static trainFederatedModel(modelType: FederatedModelType, participatingSchoolIds: string[], privacyParams?: DifferentialPrivacyParams): Promise<ServiceResponse<FederatedTrainingResult>>;
    static getRealtimePerformanceMetrics(schoolId?: string): Promise<ServiceResponse<Record<string, unknown>>>;
    private static initializeFederatedLearning;
    private static initializePrivacyProtection;
    private static initializeRealtimeBenchmarking;
    private static getAnonymizedSchoolData;
    private static generatePeerGroupAnalysis;
    private static identifyBestPractices;
    private static generateCrossSchoolInsights;
    private static auditPrivacyCompliance;
    private static getNutritionDataWithPrivacy;
    private static calculateNutritionMetrics;
    private static generateMenuOptimization;
    private static analyzeDietaryPatterns;
    private static generateWasteReductionStrategies;
    private static getOperationalDataWithPrivacy;
    private static calculateKitchenEfficiency;
    private static generateStaffInsights;
    private static optimizeSupplyChain;
    private static predictEquipmentMaintenance;
    private static getHistoricalDataForForecasting;
    private static generateDemandForecasting;
    private static assessRisks;
    private static identifyGrowthOpportunities;
    private static calculateForecastConfidence;
    private static executeFederatedTraining;
    private static calculateRealtimeMetrics;
}
export declare const crossSchoolAnalyticsService: CrossSchoolAnalyticsService;
//# sourceMappingURL=cross-school-analytics.service.d.ts.map