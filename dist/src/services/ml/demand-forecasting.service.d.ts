import { MLBaseService, ModelConfig, TrainingData } from './ml-base.service';
import * as tf from '@tensorflow/tfjs-node';
export declare enum DemandForecastType {
    DAILY_DEMAND = "daily_demand",
    WEEKLY_DEMAND = "weekly_demand",
    MONTHLY_DEMAND = "monthly_demand",
    MEAL_CATEGORY_DEMAND = "meal_category_demand",
    INGREDIENT_DEMAND = "ingredient_demand",
    SEASONAL_DEMAND = "seasonal_demand",
    EVENT_DEMAND = "event_demand",
    EMERGENCY_DEMAND = "emergency_demand"
}
export interface DemandForecastFeatures {
    dayOfWeek: number;
    dayOfMonth: number;
    dayOfYear: number;
    weekOfYear: number;
    month: number;
    quarter: number;
    isHoliday: boolean;
    isSchoolDay: boolean;
    isExamPeriod: boolean;
    isSpecialEvent: boolean;
    demand_lag_1: number;
    demand_lag_7: number;
    demand_lag_30: number;
    movingAvg_7: number;
    movingAvg_30: number;
    trendComponent: number;
    seasonalComponent: number;
    schoolId: string;
    totalStudents: number;
    activeStudents: number;
    attendanceRate: number;
    mealProgramParticipation: number;
    avgStudentSpending: number;
    menuDiversity: number;
    newItemsCount: number;
    popularItemsCount: number;
    healthyOptionsRatio: number;
    avgMealPrice: number;
    discountRate: number;
    weatherTemperature: number;
    weatherCondition: string;
    precipitationProbability: number;
    airQualityIndex: number;
    localEvents: boolean;
    economicIndicator: number;
    regionDemand: number;
    districtTrend: number;
    similarSchoolsDemand: number;
    competitorActivity: number;
    socialMediaMentions: number;
    parentFeedbackScore: number;
    studentRatingScore: number;
    complaintCount: number;
    suggestionCount: number;
    kitchenCapacity: number;
    staffCount: number;
    equipmentStatus: number;
    supplyChainReliability: number;
    inventoryLevel: number;
    wastageRate: number;
}
export interface DemandForecast {
    forecastId: string;
    schoolId: string;
    forecastType: DemandForecastType;
    forecastDate: Date;
    targetDate: Date;
    predictedDemand: number;
    confidence: number;
    confidenceInterval: {
        lower: number;
        upper: number;
        probability: number;
    };
    decomposition: {
        trend: number;
        seasonal: number;
        cyclical: number;
        irregular: number;
    };
    influencingFactors: Array<{
        factor: string;
        impact: number;
        importance: number;
        description: string;
    }>;
    scenarios: {
        optimistic: number;
        pessimistic: number;
        mostLikely: number;
    };
    recommendations: {
        procurement: string[];
        staffing: string[];
        marketing: string[];
        operations: string[];
    };
    metadata: {
        modelVersion: string;
        features: DemandForecastFeatures;
        timestamp: Date;
    };
}
export interface MultiSchoolDemandAnalysis {
    analysisId: string;
    region: string;
    schools: string[];
    analysisDate: Date;
    correlationMatrix: number[][];
    leadingIndicators: Array<{
        schoolId: string;
        schoolName: string;
        leadTime: number;
        correlation: number;
        influence: number;
    }>;
    sharedFactors: Array<{
        factor: string;
        impact: number;
        affectedSchools: string[];
        description: string;
    }>;
    demandClusters: Array<{
        clusterId: string;
        schools: string[];
        characteristics: string[];
        avgDemand: number;
        volatility: number;
    }>;
    transferEffects: Array<{
        fromSchool: string;
        toSchool: string;
        transferRate: number;
        conditions: string[];
    }>;
}
export interface SeasonalDemandPattern {
    patternId: string;
    schoolId: string;
    seasonType: 'academic' | 'calendar' | 'weather' | 'cultural';
    season: string;
    avgDemandMultiplier: number;
    peakDays: string[];
    lowDays: string[];
    volatility: number;
    confidence: number;
    factors: Array<{
        factor: string;
        correlation: number;
        description: string;
    }>;
    yearsOfData: number;
    lastUpdated: Date;
}
export declare class DemandForecastingService extends MLBaseService {
    private static instance;
    private featureExtractor;
    private timeSeriesProcessor;
    private constructor();
    static getInstance(): DemandForecastingService;
    initialize(): Promise<void>;
    trainDemandModel(forecastType: DemandForecastType, schoolId?: string, options?: {
        dataRange?: {
            start: Date;
            end: Date;
        };
        timeHorizon?: number;
        includeExternalFactors?: boolean;
        crossSchoolFeatures?: boolean;
        validationSplit?: number;
        epochs?: number;
    }): Promise<string>;
    forecastDemand(schoolId: string, forecastType: DemandForecastType, targetDate: Date, options?: {
        confidenceLevel?: number;
        includeScenarios?: boolean;
        includeRecommendations?: boolean;
        externalFactors?: Record<string, any>;
    }): Promise<DemandForecast>;
    analyzeMultiSchoolDemand(region: string, schoolIds: string[], analysisOptions?: {
        timeRange?: {
            start: Date;
            end: Date;
        };
        includeTransferEffects?: boolean;
        clusterAnalysis?: boolean;
    }): Promise<MultiSchoolDemandAnalysis>;
    analyzeSeasonalPatterns(schoolId: string, seasonTypes?: Array<'academic' | 'calendar' | 'weather' | 'cultural'>): Promise<SeasonalDemandPattern[]>;
    getBulkForecast(schoolId: string, forecastType: DemandForecastType, startDate: Date, days: number): Promise<DemandForecast[]>;
    protected trainModel(data: TrainingData, config: ModelConfig): Promise<tf.LayersModel>;
    protected predict(model: tf.LayersModel, features: tf.Tensor): Promise<tf.Tensor>;
    private ensureDemandModels;
    private prepareTimeSeriesData;
    private createTimeSeriesModelConfig;
    private getDemandFeatures;
    private getTargetColumn;
    private getDemandModelId;
    private prepareForecastFeatures;
    private calculateConfidenceInterval;
    private decomposeForecast;
    private generateDemandScenarios;
    private generateDemandRecommendations;
    private extractInfluencingFactors;
    private evaluateTimeSeriesModel;
    private extractMultiSchoolDemandData;
    private calculateCorrelationMatrix;
    private calculateCorrelation;
    private identifyLeadingIndicators;
    private analyzeSharedFactors;
    private performClusterAnalysis;
    private analyzeTransferEffects;
    private extractSeasonalPatterns;
    private tagModel;
    private cacheDemandForecast;
    private cacheMultiSchoolAnalysis;
    private cacheSeasonalPattern;
}
//# sourceMappingURL=demand-forecasting.service.d.ts.map