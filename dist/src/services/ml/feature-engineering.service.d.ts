type FeatureValue = string | number | boolean | null;
type FeatureMap = Record<string, FeatureValue>;
type TransformationParameters = Record<string, FeatureValue>;
type SchemaDefinition = Record<string, unknown>;
export interface FeatureDefinition {
    name: string;
    type: 'categorical' | 'numerical' | 'text' | 'embedding' | 'derived';
    description: string;
    source: {
        table?: string;
        column?: string;
        computation?: string;
        dependencies?: string[];
    };
    transformation: {
        method: 'standardization' | 'normalization' | 'encoding' | 'embedding' | 'aggregation' | 'custom';
        parameters: TransformationParameters;
    };
    validation: {
        required: boolean;
        min?: number;
        max?: number;
        allowedValues?: FeatureValue[];
        pattern?: string;
        customValidation?: string;
    };
    versioning: {
        version: string;
        createdAt: Date;
        updatedAt: Date;
        deprecated?: boolean;
        backwardCompatible: boolean;
    };
    metadata: {
        owner: string;
        tags: string[];
        businessLogic: string;
        sla: {
            freshness: number;
            availability: number;
            accuracy: number;
        };
    };
}
export interface FeatureStore {
    name: string;
    schoolId: string;
    features: Map<string, FeatureValue>;
    lastUpdated: Date;
    version: string;
    schema: SchemaDefinition;
}
export interface FeatureValueRecord {
    name: string;
    value: FeatureValue;
    timestamp: Date;
    version: string;
    confidence?: number;
    metadata?: {
        source: string;
        computation_time: number;
        quality_score: number;
    };
}
export interface FeatureSchema {
    version: string;
    features: Record<string, FeatureDefinition>;
    relationships: Array<{
        feature1: string;
        feature2: string;
        relationship: 'depends_on' | 'derived_from' | 'correlated_with';
        strength?: number;
    }>;
    constraints: Array<{
        type: 'uniqueness' | 'referential' | 'business' | 'statistical';
        expression: string;
        severity: 'error' | 'warning' | 'info';
    }>;
}
export interface DataQualityReport {
    timestamp: Date;
    schoolId: string;
    overall_score: number;
    feature_quality: Record<string, {
        completeness: number;
        accuracy: number;
        consistency: number;
        timeliness: number;
        validity: number;
        anomaly_score: number;
    }>;
    issues: Array<{
        feature: string;
        issue_type: 'missing' | 'outlier' | 'invalid' | 'stale' | 'inconsistent';
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        suggested_action: string;
    }>;
    drift_detection: {
        features_with_drift: string[];
        drift_magnitude: Record<string, number>;
        recommended_actions: string[];
    };
}
export interface FeatureLineage {
    feature: string;
    upstream: Array<{
        feature?: string;
        table?: string;
        column?: string;
        transformation?: string;
    }>;
    downstream: Array<{
        model: string;
        importance: number;
        last_used: Date;
    }>;
    computation_graph: {
        nodes: Array<{
            id: string;
            type: 'source' | 'transform' | 'feature';
            name: string;
        }>;
        edges: Array<{
            from: string;
            to: string;
            transformation: string;
        }>;
    };
}
export interface StreamingFeatureConfig {
    windowSize: number;
    aggregationMethods: ('sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct')[];
    triggerConditions: {
        timeWindow?: number;
        eventCount?: number;
        dataSizeThreshold?: number;
    };
    outputFormat: 'json' | 'avro' | 'parquet';
    partitioning: {
        by: 'school' | 'time' | 'feature_group';
        interval: string;
    };
}
export interface ExtractFeaturesOptions {
    includeMetadata?: boolean;
    validateSchema?: boolean;
    transformations?: string[];
}
export interface PreprocessedFeatures {
    features: FeatureMap;
    metadata?: {
        preprocessingTime: number;
        transformationsApplied: string[];
    };
}
export declare class FeatureEngineeringService {
    private featureDefinitions;
    private featureStores;
    constructor();
    initialize(): Promise<void>;
    extractFeatures(inputData: Record<string, FeatureValue>, _modelType: string, _schoolId: string, _options?: ExtractFeaturesOptions): Promise<FeatureMap>;
    preprocessForModel(features: FeatureMap, _modelId: string): Promise<PreprocessedFeatures>;
    validateInputSchema(_inputData: Record<string, FeatureValue>, _modelType: string): Promise<void>;
    startDriftMonitoring(): Promise<void>;
    generateDataQualityReport(schoolId?: string, _timeRange?: {
        start: Date;
        end: Date;
    }): Promise<DataQualityReport>;
    getFeatureLineage(featureName: string): Promise<FeatureLineage>;
    processStreamingFeatures(_config: StreamingFeatureConfig, _dataStream: AsyncIterable<Record<string, FeatureValue>>): Promise<void>;
    updatePipeline(_features: string[]): Promise<void>;
}
export {};
//# sourceMappingURL=feature-engineering.service.d.ts.map