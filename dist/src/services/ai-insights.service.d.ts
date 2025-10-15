/// <reference types="node" />
import { EventEmitter } from 'events';
export interface AIGeneratedInsight {
    id: string;
    type: 'trend' | 'anomaly' | 'recommendation' | 'prediction' | 'correlation';
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    title: string;
    description: string;
    details: string;
    visualizations: VisualizationConfig[];
    actionItems: ActionItem[];
    dataPoints: Record<string, unknown>[] | undefined;
    metadata: {
        algorithm: string;
        modelVersion: string;
        generatedAt: Date;
        reviewStatus: 'pending' | 'approved' | 'rejected';
    };
}
export interface AnomalyDetectionConfig {
    sensitivity: number;
    algorithm: 'isolation_forest' | 'one_class_svm' | 'local_outlier_factor' | 'elliptic_envelope';
    contamination?: number;
    seasonality?: boolean;
    trendAware?: boolean;
}
export interface PredictionConfig {
    horizon: string;
    confidence: number;
    algorithm?: 'arima' | 'lstm' | 'prophet' | 'linear_regression';
    includeSeasonality?: boolean;
    includeHolidays?: boolean;
}
export interface CorrelationConfig {
    threshold: number;
    method: 'pearson' | 'spearman' | 'kendall';
    includeNonLinear?: boolean;
    maxVariables?: number;
}
export interface RecommendationConfig {
    context: string;
    priority: 'cost_savings' | 'efficiency' | 'quality' | 'business_impact';
    maxRecommendations?: number;
    includeImplementationSteps?: boolean;
}
export interface TrendAnalysis {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    strength: number;
    significance: number;
    seasonality?: {
        detected: boolean;
        period?: number;
        strength?: number;
    };
    changePoints: Array<{
        date: Date;
        magnitude: number;
        confidence: number;
    }>;
    forecast: Array<{
        date: Date;
        value: number;
        confidence_lower: number;
        confidence_upper: number;
    }>;
}
export interface AnomalyResult {
    dataPoint: Record<string, unknown>;
    score: number;
    isAnomaly: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    explanation: string;
    similarPatterns: Record<string, unknown>[] | undefined;
    recommendedActions: string[];
}
export declare class AIInsightsEngine extends EventEmitter {
    private readonly config;
    private readonly metrics;
    private readonly cache;
    private readonly bedrockClient;
    private readonly sagemakerClient;
    private isInitialized;
    private readonly modelConfigs;
    private readonly insightCache;
    constructor(config: {
        awsRegion: string;
        bedrockModel: string;
        sagemakerEndpoints: {
            anomalyDetection?: string;
            timeSeriesForecasting?: string;
            nlpInsights?: string;
        };
        cacheTimeout: number;
        maxInsightsPerRequest: number;
        confidenceThreshold: number;
    });
    initialize(): Promise<void>;
    analyzeTrends(data: Record<string, Record<string, unknown>[]>, dateRange: {
        start: Date;
        end: Date;
    }, config?: {
        minDataPoints?: number;
        significanceLevel?: number;
    }): Promise<AIGeneratedInsight[]>;
    detectAnomalies(data: Record<string, Record<string, unknown>[]>, config: AnomalyDetectionConfig): Promise<AIGeneratedInsight[]>;
    generatePredictions(data: Record<string, Record<string, unknown>[]>, config: PredictionConfig): Promise<AIGeneratedInsight[]>;
    findCorrelations(data: Record<string, Record<string, unknown>[]>, config: CorrelationConfig): Promise<AIGeneratedInsight[]>;
    generateRecommendations(data: Record<string, Record<string, unknown>[]>, kpis: Record<string, number>, config: RecommendationConfig): Promise<AIGeneratedInsight[]>;
    generateNaturalLanguageExplanation(insight: Omit<AIGeneratedInsight, 'description' | 'details'>, context: Record<string, unknown>): Promise<{
        description: string;
        details: string;
    }>;
    private testModelConnections;
    private loadModelConfigurations;
    private performTrendAnalysis;
    private generateTrendInsight;
    private detectAnomaliesInDataset;
    private generateAnomalyInsight;
    private generateTimeSeriesPredictions;
    private generatePredictionInsight;
    private calculateCorrelationMatrix;
    private generateCorrelationInsight;
    private analyzePerformance;
    private generateLLMRecommendations;
    private createRecommendationInsight;
    private buildExplanationPrompt;
    private invokeLLMForExplanation;
    private testSagemakerEndpoint;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        initialized: boolean;
        bedrockConnected: boolean;
        sagemakerConnected: boolean;
        cacheSize: number;
        modelsLoaded: number;
    }>;
    private setupEventHandlers;
}
interface VisualizationConfig {
    type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'gauge' | 'treemap';
    dimensions: string[];
    metrics: string[];
    colors: string[];
    animations: boolean;
    interactions: boolean;
    responsive: boolean;
}
interface ActionItem {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: Date;
}
export {};
//# sourceMappingURL=ai-insights.service.d.ts.map