#!/usr/bin/env ts-node
interface MLAnalysisConfig {
    environment: 'dev' | 'staging' | 'production';
    analysisType: 'demand_forecasting' | 'customer_segmentation' | 'anomaly_detection' | 'predictive_maintenance' | 'nutritional_patterns';
    timeRange: {
        start: Date;
        end: Date;
    };
    parameters?: Record<string, any>;
}
interface MLInsight {
    type: string;
    confidence: number;
    prediction: any;
    explanation: string;
    recommendations: string[];
    data: any;
}
declare class AdvancedAnalyticsML {
    private config;
    constructor(config: MLAnalysisConfig);
    runAnalysis(): Promise<MLInsight[]>;
    private analyzeDemandForecasting;
    private analyzeCustomerSegmentation;
    private analyzeAnomalyDetection;
    private analyzePredictiveMaintenance;
    private analyzeNutritionalPatterns;
    private generateMockOrderData;
    private calculateMovingAverageForecast;
    private generateMockCustomerData;
    private performRFMSegmentation;
    private generateMockSystemMetrics;
    private detectStatisticalAnomalies;
    private generateMockRFIDData;
    private predictRFIDMaintenance;
    private generateMockNutritionData;
    private analyzeNutritionTrends;
    private saveInsights;
}
export { AdvancedAnalyticsML };
export type { MLAnalysisConfig, MLInsight };
//# sourceMappingURL=advanced-analytics-ml.d.ts.map