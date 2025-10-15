export declare enum ModelType {
    STUDENT_BEHAVIOR = "student_behavior",
    DEMAND_FORECASTING = "demand_forecasting",
    SUPPLY_CHAIN_OPTIMIZATION = "supply_chain_optimization",
    FINANCIAL_FORECASTING = "financial_forecasting",
    HEALTH_NUTRITION = "health_nutrition",
    OPERATIONAL_EFFICIENCY = "operational_efficiency"
}
export interface PredictionRequest {
    modelType: ModelType;
    features: Record<string, unknown>;
    schoolId: string;
    userId?: string;
    context?: Record<string, unknown>;
    predictionHorizon?: '1d' | '1w' | '1m' | '1y';
    requireConfidence?: boolean;
    explainPrediction?: boolean;
    personalization?: Record<string, unknown>;
}
export interface PredictionResponse {
    prediction: Record<string, unknown>;
    confidence: number;
    explanation?: ExplanationResult;
    recommendations?: Recommendation[];
    metadata: PredictionMetadata;
    federatedInsights?: FederatedInsight[];
}
export interface PredictionMetadata {
    modelId: string;
    version: string;
    latency: number;
    timestamp: Date;
    schoolId: string;
    federated: boolean;
    privacyPreserved: boolean;
}
export interface ExplanationResult {
    method: string;
    featureImportance: Record<string, number>;
    reasoning: string;
    factors: ExplanationFactor[];
    personalizations: Personalization[];
    uncertainty: UncertaintyMetrics;
}
export interface ExplanationFactor {
    factor: string;
    weight: number;
    contribution: number;
    direction: 'positive' | 'negative' | 'neutral';
}
export interface Personalization {
    aspect: string;
    value: string;
    confidence: number;
    source: string;
}
export interface UncertaintyMetrics {
    confidence: number;
    variance: number;
    entropy: number;
    reliability: 'high' | 'medium' | 'low';
}
export interface Recommendation {
    type: string;
    title: string;
    description: string;
    impact_score: number;
    confidence: number;
    actions: RecommendationAction[];
    explanation: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
}
export interface RecommendationAction {
    action: string;
    parameters: Record<string, unknown>;
    expectedOutcome: string;
}
export interface FederatedInsight {
    schoolId: string;
    contribution: number;
    privacyLevel: 'high' | 'medium' | 'low';
    aggregated: boolean;
}
export interface ModelTrainingRequest {
    modelType: ModelType;
    trainingData: Record<string, unknown>[] | undefined;
    config: {
        algorithm?: string;
        hyperparameters?: Record<string, unknown>;
        validationSplit?: number;
    };
    schoolId: string;
    federatedConfig?: Record<string, unknown>;
}
export interface ModelTrainingResponse {
    modelId: string;
    status: 'training' | 'completed' | 'failed';
    metrics?: Record<string, unknown>;
    federated?: Record<string, unknown>;
    error?: string;
}
export interface AnalyticsRequest {
    schoolId: string;
    timeRange?: {
        start: Date;
        end: Date;
    };
    includePrivacyMetrics?: boolean;
    granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
}
export interface AnalyticsResponse {
    performance: PerformanceAnalytics;
    models: ModelAnalytics[];
    predictions: PredictionAnalytics;
    federated: FederatedAnalytics;
    privacy: PrivacyAnalytics;
    recommendations: SystemRecommendation[];
}
export interface PerformanceAnalytics {
    totalPredictions: number;
    averageLatency: number;
    successRate: number;
    errorRate: number;
    throughput: number;
    uptime: number;
}
export interface ModelAnalytics {
    modelId: string;
    modelType: ModelType;
    status: 'active' | 'training' | 'failed' | 'deprecated';
    accuracy: number;
    lastUpdated: Date;
    usageCount: number;
    driftScore: number;
}
export interface PredictionAnalytics {
    totalPredictions: number;
    averageConfidence: number;
    topModels: string[];
    errorPatterns: ErrorPattern[];
    userSatisfaction: number;
}
export interface ErrorPattern {
    errorType: string;
    frequency: number;
    impact: 'high' | 'medium' | 'low';
    resolution: string;
}
export interface FederatedAnalytics {
    activeParticipants: number;
    roundsCompleted: number;
    averageContribution: number;
    privacyBudgetRemaining: number;
    convergenceRate: number;
}
export interface PrivacyAnalytics {
    totalQueries: number;
    privacyBudgetUsed: number;
    complianceStatus: 'compliant' | 'warning' | 'breach';
    auditEvents: number;
    dataMinimization: number;
}
export interface SystemRecommendation {
    category: string;
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    impact: string;
    implementation: string[];
}
export type RetrainingResponse = 'started' | 'not_needed' | 'failed';
export interface RecommendationRequest {
    userId: string;
    userType: 'student' | 'parent' | 'kitchen_staff' | 'admin';
    schoolId: string;
    context?: Record<string, unknown>;
    limit?: number;
}
export declare class PredictiveAnalyticsService {
    private static instance;
    private circuitBreaker;
    private db;
    private recommendationEngine;
    private activeModels;
    private modelConfigs;
    private constructor();
    static getInstance(): PredictiveAnalyticsService;
    private initializeModels;
    makePrediction(request: PredictionRequest): Promise<PredictionResponse>;
    trainModel(request: ModelTrainingRequest): Promise<ModelTrainingResponse>;
    getAnalytics(schoolId: string, timeRange?: {
        start: Date;
        end: Date;
    }, includePrivacyMetrics?: boolean): Promise<AnalyticsResponse>;
    retrain(request: {
        modelType: ModelType;
        schoolId?: string;
        force?: boolean;
    }): Promise<RetrainingResponse>;
    getRecommendations(request: RecommendationRequest): Promise<Recommendation[]>;
    getModelStatus(modelId: string): Promise<Record<string, unknown>>;
    getAvailableModels(): Promise<string[]>;
    getPerformanceMetrics(schoolId: string, timeRange?: Record<string, unknown>): Promise<Record<string, unknown>>;
    getPrivacyMetrics(): Promise<Record<string, unknown>>;
    getPrivacyAnalytics(): Promise<Record<string, unknown>>;
    getDriftAnalysis(): Promise<Record<string, unknown>>;
    private validatePredictionRequest;
    private validateTrainingRequest;
    private generatePrediction;
    private predictStudentBehavior;
    private predictDemand;
    private optimizeSupplyChain;
    private analyzeNutrition;
    private analyzeEfficiency;
    private calculateConfidence;
    private generateExplanation;
    private getFederatedInsights;
    private logPrediction;
    private getModelFeatures;
    private getPerformanceAnalytics;
    private getModelAnalytics;
    private getPredictionAnalytics;
    private getFederatedAnalytics;
    private generateSystemRecommendations;
}
//# sourceMappingURL=predictive-analytics.service.d.ts.map