import type { PredictionValue, MetricValue } from '../../types/ml.types';
export interface ModelMonitoringConfig {
    modelId: string;
    driftThreshold: number;
    performanceThreshold: number;
    alertChannels: string[];
    retrainingTriggers: {
        accuracyDrop: number;
        driftMagnitude: number;
        predictionVolume: number;
    };
    complianceRequirements: string[];
}
export interface ModelHealthMetrics {
    accuracy: number;
    latency: number;
    throughput: number;
    driftScore: number;
    lastUpdated: Date;
}
export interface DriftDetectionResult {
    modelId: string;
    driftDetected: boolean;
    driftMagnitude: number;
    affectedFeatures: string[];
    timestamp: Date;
    confidence: number;
}
export interface RetrainingPipeline {
    pipelineId: string;
    modelId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    triggerReason: string;
    startTime: Date;
    endTime?: Date;
    metrics: MetricValue;
}
export interface ComplianceReport {
    modelId: string;
    compliant: boolean;
    regulations: string[];
    lastAudit: Date;
    issues: string[];
}
export declare class ModelMonitoringService {
    private static _instance;
    private monitoringConfigs;
    private constructor();
    static getInstance(): ModelMonitoringService;
    initialize(): Promise<void>;
    configureMonitoring(modelId: string, config: ModelMonitoringConfig): Promise<void>;
    getModelHealth(_modelId: string): Promise<ModelHealthMetrics>;
    detectDrift(modelId: string, _data?: unknown[]): Promise<DriftDetectionResult>;
    logPrediction(_modelId: string, _prediction: PredictionValue, _actual?: PredictionValue): Promise<void>;
    triggerRetraining(modelId: string, _reason: string): Promise<string>;
    getRetrainingStatus(_pipelineId: string): Promise<RetrainingPipeline | null>;
    generateComplianceReport(modelId: string): Promise<ComplianceReport>;
}
//# sourceMappingURL=model-monitoring.service.d.ts.map