/// <reference types="node" />
import { EventEmitter } from 'events';
import { ExecutionMetrics as BaseExecutionMetrics } from '../../types/etl-types';
export interface OrchestratorConfig {
    maxConcurrentFlows: number;
    enableScheduling: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
    metricsEnabled: boolean;
}
export interface FlowMetrics {
    totalFlows: number;
    activeFlows: number;
    completedFlows: number;
    failedFlows: number;
    totalRecordsProcessed: number;
    averageThroughput: number;
}
export interface Checkpoint {
    id: string;
    phase: string;
    resourceId: string;
    startTime: Date;
    endTime?: Date;
    status: 'running' | 'completed' | 'failed';
}
export interface FlowError {
    phase: 'extraction' | 'transformation' | 'loading' | 'execution';
    sourceId?: string;
    targetId?: string;
    error: string;
    timestamp: Date;
    retryable: boolean;
}
export interface DataFlowConfig {
    id: string;
    name: string;
    description: string;
    source: SourceConnection;
    target: TargetConnection;
    transformations: TransformationRule[];
    enabled: boolean;
    schedule?: CronSchedule;
    metadata?: Record<string, unknown>;
    executionPolicy: ExecutionPolicy;
    sourceConnections: SourceConnection[];
    targetConnections: TargetConnection[];
}
export interface SourceConnection {
    id: string;
    type: 'database' | 'api' | 'file' | 'stream' | 'queue';
    config: ConnectionParameters;
    schema: DataSchema;
    filters: DataFilter[];
    partitioning: PartitioningStrategy;
    errorHandling?: ErrorHandlingStrategy;
}
export interface TargetConnection {
    id: string;
    type: 'database' | 'api' | 'file' | 'stream' | 'queue';
    config: ConnectionParameters;
    schema: DataSchema;
    writeMode: 'append' | 'overwrite' | 'upsert' | 'merge';
    partitioning: PartitioningStrategy;
    errorHandling?: ErrorHandlingStrategy;
}
export interface TransformationRule {
    id: string;
    name: string;
    type: 'map' | 'filter' | 'aggregate' | 'join' | 'split' | 'enrich';
    expression: string;
    parameters: Record<string, unknown>;
    validation: ValidationRule[];
    errorHandling: ErrorHandlingStrategy;
}
export interface ExtractedData {
    sourceId: string;
    data: unknown[] | undefined;
    schema: DataSchema;
    recordCount: number;
}
export interface TransformedData {
    sourceId: string;
    data: unknown[] | undefined;
    transformations: string[];
    recordCount: number;
}
export interface FlowExecutionMetrics extends BaseExecutionMetrics {
    extractionTime: number;
    transformationTime: number;
    loadTime: number;
    totalTime: number;
    memoryUsage: number;
    cpuUsage: number;
}
export interface RetryConfiguration {
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential' | 'fixed';
    initialDelay: number;
    maxDelay: number;
    multiplier?: number;
}
export interface MonitoringConfig {
    enabled: boolean;
    metricsInterval: number;
    alertThresholds: {
        errorRate: number;
        throughputMin: number;
        latencyMax: number;
    };
}
export interface SecurityConfig {
    encryption: boolean;
    authentication: {
        enabled: boolean;
        type: 'api_key' | 'oauth' | 'jwt';
    };
    accessControl: {
        enabled: boolean;
        roles: string[];
    };
}
export interface ConnectionParameters {
    endpoint: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    query?: string;
    method?: string;
    headers?: Record<string, string>;
    authentication?: Record<string, unknown>;
    filePath?: string;
    format?: string;
    encoding?: string;
    streamType?: string;
    topic?: string;
    brokers?: string[];
    consumerGroup?: string;
    batchSize?: number;
    queueType?: string;
    queueName?: string;
    connectionString?: string;
    table?: string;
    writeMode?: string;
    streamName?: string;
    region?: string;
    queueUrl?: string;
    credentials?: {
        username?: string;
        password?: string;
        apiKey?: string;
        token?: string;
    };
    timeout: number;
    retryPolicy: RetryConfiguration;
}
export interface DataSchema {
    format: 'json' | 'xml' | 'csv' | 'avro' | 'parquet';
    fields: {
        name: string;
        type: string;
        required: boolean;
        description?: string;
    }[];
}
export interface DataFilter {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';
    value: unknown;
    logicalOperator?: 'and' | 'or';
}
export interface PartitioningStrategy {
    enabled: boolean;
    type: 'time' | 'hash' | 'range';
    column: string;
    buckets?: number;
    interval?: string;
}
export interface ValidationRule {
    id: string;
    name: string;
    type: 'not_null' | 'unique' | 'range' | 'pattern';
    field: string;
    condition: string;
    parameters?: Record<string, unknown>;
    message: string;
    severity: 'error' | 'warning';
}
export interface ErrorHandlingStrategy {
    onError: 'skip' | 'retry' | 'fail' | 'quarantine';
    maxRetries: number;
    retryDelay: number;
    quarantineLocation?: string;
}
export interface CronSchedule {
    expression: string;
    timezone?: string;
}
export interface TriggerCondition {
    type: 'data_available' | 'time_based' | 'event';
    condition: string;
    parameters?: Record<string, unknown>;
}
export interface ParallelismConfig {
    enabled: boolean;
    maxParallel: number;
    partitioningStrategy: 'round_robin' | 'key_based' | 'size_based';
}
export interface ResourceLimits {
    maxMemory: string;
    maxCpu: string;
    timeout: number;
    diskSpace: string;
}
export interface DataTransformation {
    id: string;
    name: string;
    type: 'map' | 'filter' | 'aggregate' | 'join' | 'split' | 'enrich';
    expression: string;
    parameters: Record<string, unknown>;
    validation: ValidationRule[];
    errorHandling: ErrorHandlingStrategy;
}
export interface ExecutionPolicy {
    type: 'batch' | 'streaming' | 'micro_batch';
    schedule?: CronSchedule;
    triggers: TriggerCondition[];
    parallelism: ParallelismConfig;
    resourceLimits: ResourceLimits;
}
export interface DataFlowExecution {
    id: string;
    flowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    processedRecords: number;
    errorCount: number;
    throughput: number;
    metrics: FlowExecutionMetrics;
    checkpoints: Checkpoint[];
    errors: FlowError[];
}
export declare class DataFlowOrchestrator extends EventEmitter {
    private config;
    private flows;
    private executions;
    private activeFlows;
    private metrics;
    private schedulerInterval?;
    constructor(config: OrchestratorConfig);
    private initializeOrchestrator;
    private startScheduler;
    private processScheduledFlows;
    private shouldExecuteScheduledFlow;
    private parseCronExpression;
    private setupMetricsCollection;
    private collectFlowMetrics;
    private setupHealthMonitoring;
    private performHealthCheck;
    registerFlow(flowConfig: DataFlowConfig): Promise<void>;
    executeFlow(flowId: string, _parameters?: Record<string, unknown>): Promise<string>;
    private executeFlowAsync;
    private extractData;
    private transformData;
    private loadData;
    private extractFromDatabase;
    private extractFromAPI;
    private extractFromFile;
    private extractFromStream;
    private extractFromQueue;
    private validateFlowConfig;
    private generateExecutionId;
    private initializeExecutionMetrics;
    private createCheckpoint;
    private calculateThroughput;
    private updateAverageThroughput;
    private handleExecutionError;
    private applyFilters;
    private applyTransformationRule;
    private applyMapTransformation;
    private applyFilterTransformation;
    private applyAggregateTransformation;
    private applyJoinTransformation;
    private applySplitTransformation;
    private applyEnrichTransformation;
    private validateTransformedData;
    private validateRecord;
    private isRetryableError;
    private shouldContinueOnError;
    private loadToDatabase;
    private loadToAPI;
    private sendBatchToAPI;
    private loadToFile;
    private convertToCSV;
    private loadToStream;
    private loadToKafkaStream;
    private loadToKinesisStream;
    private loadToQueue;
    private loadToRabbitMQQueue;
    private loadToSQSQueue;
    getExecutionStatus(executionId: string): DataFlowExecution | undefined;
    getFlowExecutions(flowId: string): DataFlowExecution[];
    getMetrics(): FlowMetrics;
    stopExecution(executionId: string): Promise<void>;
    cleanupCompletedExecutions(maxAge?: number): void;
    shutdown(): Promise<void>;
}
export default DataFlowOrchestrator;
//# sourceMappingURL=data-flow-orchestrator.d.ts.map