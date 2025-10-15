export interface PredictionServiceRequest {
    modelType: string;
    features: Record<string, any>;
    schoolId: string;
    requestId?: string;
    personalization?: {
        userId?: string;
        userType: 'student' | 'parent' | 'kitchen_staff' | 'admin';
        preferences?: Record<string, any>;
    };
    options?: {
        useCache?: boolean;
        timeout?: number;
        fallbackEnabled?: boolean;
    };
}
export interface PredictionServiceResponse {
    value: any;
    confidence: number;
    modelId: string;
    version: string;
    latency: number;
    fromCache: boolean;
    experimentGroup?: string;
}
export interface ABTestConfig {
    modelType: string;
    currentModelId: string;
    newModelId: string;
    trafficSplit: number;
    metrics: string[];
    duration: number;
    successCriteria: {
        accuracy_improvement: number;
        latency_threshold: number;
        confidence_threshold: number;
    };
}
export interface CanaryDeploymentConfig {
    modelId: string;
    targetModelType: string;
    rolloutStrategy: 'linear' | 'exponential' | 'blue_green';
    stages: Array<{
        percentage: number;
        duration: number;
        criteria: Record<string, number>;
    }>;
    rollbackCriteria: {
        error_rate_threshold: number;
        latency_threshold: number;
        accuracy_threshold: number;
    };
}
export interface StreamingPredictionConfig {
    topic: string;
    batchSize: number;
    batchTimeout: number;
    enableCheckpointing: boolean;
    parallelism: number;
}
export interface ModelServingMetrics {
    predictions_per_second: number;
    average_latency: number;
    p95_latency: number;
    p99_latency: number;
    error_rate: number;
    cache_hit_rate: number;
    active_experiments: number;
    model_versions: Record<string, {
        version: string;
        traffic_percentage: number;
        performance_metrics: Record<string, number>;
    }>;
}
export declare class RealtimePredictionService {
    private static instance;
    private isInitialized;
    private constructor();
    static getInstance(): RealtimePredictionService;
    initialize(): Promise<void>;
    predict(request: PredictionServiceRequest): Promise<PredictionServiceResponse>;
    setupABTest(config: ABTestConfig): Promise<string>;
    deployWithCanary(config: CanaryDeploymentConfig): Promise<string>;
    processStreamingPredictions(config: StreamingPredictionConfig): Promise<void>;
    getMetrics(): ModelServingMetrics;
    hasModel(modelType: string, schoolId: string): Promise<boolean>;
    updateModel(modelId: string, weights: any[] | undefined): Promise<void>;
    rollbackModel(modelId: string): Promise<void>;
    deployModel(modelId: string): Promise<void>;
}
//# sourceMappingURL=realtime-prediction.service.d.ts.map