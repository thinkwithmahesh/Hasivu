import { MLBaseService, ModelConfig, TrainingData } from './ml-base.service';
import * as tf from '@tensorflow/tfjs-node';
export declare enum BehaviorPredictionType {
    MEAL_PREFERENCE = "meal_preference",
    ORDER_TIMING = "order_timing",
    QUANTITY_PREFERENCE = "quantity_preference",
    DIETARY_COMPLIANCE = "dietary_compliance",
    NUTRITIONAL_NEEDS = "nutritional_needs",
    SOCIAL_INFLUENCE = "social_influence",
    SEASONAL_PREFERENCE = "seasonal_preference",
    HEALTH_OUTCOME = "health_outcome"
}
export interface StudentBehaviorFeatures {
    age: number;
    grade: number;
    gender: string;
    bmi?: number;
    healthConditions: string[];
    allergies: string[];
    totalOrders: number;
    avgOrderValue: number;
    favoriteCategories: string[];
    orderFrequency: number;
    avgOrderTime: number;
    weekdayVsWeekend: number;
    proteinPreference: number;
    vegetarianTendency: number;
    spicyFoodTolerance: number;
    sweetTooth: number;
    peersInfluence: number;
    parentalGuidance: number;
    schoolEventImpact: number;
    seasonalVariation: number;
    weatherSensitivity: number;
    energyLevels: number;
    concentrationLevels: number;
    physicalActivity: number;
    timeOfDay: number;
    dayOfWeek: number;
    monthOfYear: number;
    specialEvent: boolean;
    weatherCondition: string;
    schoolId: string;
    classSize: number;
    mealProgramType: string;
}
export interface StudentBehaviorPrediction {
    studentId: string;
    predictionType: BehaviorPredictionType;
    prediction: any;
    confidence: number;
    probability?: number[];
    explanation: {
        topFactors: Array<{
            factor: string;
            importance: number;
            description: string;
        }>;
        reasoning: string;
        recommendations: string[];
    };
    metadata: {
        modelVersion: string;
        timestamp: Date;
        features: StudentBehaviorFeatures;
    };
}
export interface StudentBehaviorAnalytics {
    studentId: string;
    analysisDate: Date;
    timeframe: string;
    patterns: {
        orderingPatterns: {
            preferredTimes: number[];
            preferredDays: string[];
            orderFrequency: number;
            avgOrderValue: number;
        };
        mealPreferences: {
            favoriteCategories: string[];
            avoidedCategories: string[];
            nutritionalBalance: number;
            dietaryCompliance: number;
        };
        socialInfluence: {
            peerInfluenceScore: number;
            parentalInfluenceScore: number;
            trendFollowing: number;
        };
        healthCorrelations: {
            energyLevelCorrelation: number;
            concentrationCorrelation: number;
            activityLevelCorrelation: number;
            moodCorrelation: number;
        };
    };
    predictions: {
        nextWeekOrders: number;
        likelyMealChoices: string[];
        riskFactors: string[];
        opportunities: string[];
    };
    recommendations: {
        forStudent: string[];
        forParents: string[];
        forSchool: string[];
        forKitchen: string[];
    };
}
export declare class StudentBehaviorService extends MLBaseService {
    private static instance;
    private featureExtractor;
    private constructor();
    static getInstance(): StudentBehaviorService;
    initialize(): Promise<void>;
    trainBehaviorModel(predictionType: BehaviorPredictionType, schoolId?: string, options?: {
        dataRange?: {
            start: Date;
            end: Date;
        };
        validationSplit?: number;
        epochs?: number;
        batchSize?: number;
    }): Promise<string>;
    predictStudentBehavior(studentId: string, predictionType: BehaviorPredictionType, context?: Partial<StudentBehaviorFeatures>): Promise<StudentBehaviorPrediction>;
    generateStudentAnalytics(studentId: string, timeframe?: string): Promise<StudentBehaviorAnalytics>;
    getGroupBehaviorInsights(studentIds: string[], predictionType: BehaviorPredictionType): Promise<Array<{
        studentId: string;
        prediction: any;
        confidence: number;
        riskLevel: 'low' | 'medium' | 'high';
    }>>;
    protected trainModel(data: TrainingData, config: ModelConfig): Promise<tf.LayersModel>;
    protected predict(model: tf.LayersModel, features: tf.Tensor): Promise<tf.Tensor>;
    private ensureBehaviorModels;
    private prepareTrainingData;
    private createBehaviorModelConfig;
    private getBehaviorFeatures;
    private getTargetColumn;
    private getOutputUnits;
    private getOutputActivation;
    private getLossFunction;
    private getBehaviorModelId;
    private featuresToPredictionInput;
    private interpretBehaviorPrediction;
    private analyzeStudentPatterns;
    private generateBehaviorPredictions;
    private generatePersonalizedRecommendations;
    private calculateRiskLevel;
    private tagModel;
    private cacheStudentAnalytics;
}
//# sourceMappingURL=student-behavior.service.d.ts.map