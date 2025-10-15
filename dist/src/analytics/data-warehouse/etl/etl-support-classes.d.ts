import { BatchConfig, DeltaLakeConfig, SchemaEvolutionConfig, OrchestrationConfig, TransformationConfig, ValidationConfig, ErrorHandlingConfig, CDCConfig, DataQualityConfig } from '../types/etl-types';
export declare class BatchProcessingEngine {
    private readonly config;
    private isInitialized;
    constructor(config: BatchConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    processBatch(data: Record<string, unknown>[] | undefined, _transformations: Record<string, unknown>[] | undefined): Promise<Record<string, unknown>[]>;
    getStats(): Promise<Record<string, unknown>>;
    getHealthStatus(): Promise<Record<string, unknown>>;
}
export declare class DeltaLakeManager {
    private readonly config;
    private isInitialized;
    constructor(config: DeltaLakeConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    writeData(table: string, data: Record<string, unknown>[] | undefined): Promise<void>;
    readData(table: string, _filters?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
    optimize(table: string): Promise<void>;
    vacuum(table: string): Promise<void>;
    getHealthStatus(): Promise<Record<string, unknown>>;
}
export declare class SchemaEvolutionManager {
    private readonly config;
    private isInitialized;
    constructor(config: SchemaEvolutionConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    evolveSchema(oldSchema: Record<string, unknown>, newSchema: Record<string, unknown>): Promise<void>;
    validateSchemaCompatibility(oldSchema: Record<string, unknown>, newSchema: Record<string, unknown>): Promise<boolean>;
    getHealthStatus(): Promise<Record<string, unknown>>;
}
export declare class AirflowOrchestrator {
    private readonly config;
    private isInitialized;
    constructor(config: OrchestrationConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    scheduleDAG(dagId: string, schedule: string): Promise<void>;
    triggerDAG(dagId: string, _config?: Record<string, unknown>): Promise<void>;
    registerPipeline(pipeline: Record<string, unknown>): Promise<void>;
    getHealthStatus(): Promise<Record<string, unknown>>;
}
export declare class TransformationEngine {
    private readonly config;
    private isInitialized;
    constructor(config: TransformationConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    transform(data: Record<string, unknown>[] | undefined, transformations: Record<string, unknown>[] | undefined): Promise<Record<string, unknown>[]>;
    validateTransformations(transformations: Record<string, unknown>[] | undefined): Promise<void>;
    executeTransformation(transformation: Record<string, unknown>, _execution: Record<string, unknown>): Promise<void>;
    getHealthStatus(): Promise<Record<string, unknown>>;
}
export declare class DataValidationEngine {
    private readonly config;
    private isInitialized;
    constructor(config: ValidationConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    validate(data: Record<string, unknown>[] | undefined, rules: Record<string, unknown>[] | undefined): Promise<{
        isValid: boolean;
        errors: Record<string, unknown>[] | undefined;
    }>;
    getHealthStatus(): Promise<Record<string, unknown>>;
}
export declare class ErrorRecoveryManager {
    private readonly config;
    private isInitialized;
    constructor(config: ErrorHandlingConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    handleError(error: Error, context: Record<string, unknown>): Promise<void>;
    retryOperation(operation: () => Promise<unknown>, maxRetries?: number): Promise<unknown>;
    handlePipelineFailure(pipeline: Record<string, unknown>, execution: Record<string, unknown>, error: Error): Promise<void>;
    getHealthStatus(): Promise<any>;
}
export declare class ChangeDataCaptureManager {
    private readonly config;
    private isInitialized;
    constructor(config: CDCConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    startCapture(source: string): Promise<void>;
    stopCapture(source: string): Promise<void>;
    setupCDC(source: any): Promise<void>;
    getHealthStatus(): Promise<any>;
}
export declare class DataQualityMonitor {
    private readonly config;
    private isInitialized;
    constructor(config: DataQualityConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    checkDataQuality(data: any[] | undefined): Promise<{
        score: number;
        issues: any[] | undefined;
    }>;
    getOverallStatistics(): Promise<any>;
    performQualityCheck(): Promise<void>;
    getHealthStatus(): Promise<any>;
}
//# sourceMappingURL=etl-support-classes.d.ts.map