/// <reference types="node" />
import { EventEmitter } from 'events';
import { ETLPipelineConfig, Pipeline, PipelineExecution, DataSource, DataSink, TransformationStep } from '../types/etl-types';
export declare class ETLPipelineEngine extends EventEmitter {
    private readonly config;
    private readonly metrics;
    private readonly queue;
    private readonly streamingEngine;
    private readonly batchEngine;
    private readonly deltaLakeManager;
    private readonly schemaEvolution;
    private readonly airflowOrchestrator;
    private readonly transformationEngine;
    private readonly validationEngine;
    private readonly errorRecovery;
    private readonly cdcManager;
    private readonly qualityMonitor;
    private isRunning;
    private readonly activePipelines;
    private readonly pipelineExecutions;
    private readonly dataSourceRegistry;
    private readonly dataSinkRegistry;
    constructor(config: ETLPipelineConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    createPipeline(pipelineDef: {
        name: string;
        description: string;
        sourceId: string;
        sinkId: string;
        transformations: TransformationStep[];
        schedule?: string;
        realtime?: boolean;
        tenantId: string;
    }): Promise<Pipeline>;
    executePipeline(pipelineId: string, options?: {
        triggerType: 'manual' | 'scheduled' | 'streaming';
        parameters?: Record<string, any>;
        priority?: 'low' | 'normal' | 'high';
    }): Promise<PipelineExecution>;
    registerDataSource(source: DataSource): Promise<void>;
    registerDataSink(sink: DataSink): Promise<void>;
    monitorExecution(executionId: string): Promise<PipelineExecution | null>;
    getPipelines(tenantId?: string): Promise<Pipeline[]>;
    getExecutionHistory(pipelineId: string, limit?: number): Promise<PipelineExecution[]>;
    getPipelineStatistics(): Promise<{
        totalPipelines: number;
        activePipelines: number;
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        averageExecutionTime: number;
        throughput: {
            recordsPerHour: number;
            bytesPerHour: number;
        };
        dataQuality: {
            overallScore: number;
            issues: number;
            trends: string[];
        };
    }>;
    getHealthStatus(): Promise<{
        healthy: boolean;
        components: Record<string, {
            healthy: boolean;
            details?: any;
        }>;
        metrics: Record<string, number>;
    }>;
    private executePipelineSteps;
    private executeSourceStep;
    private executeTransformationStep;
    private executeSinkStep;
    private loadExistingPipelines;
    private loadDataSources;
    private loadDataSinks;
    private validateDataSource;
    private validateDataSink;
    private initializeDataSource;
    private initializeDataSink;
    private stopAllPipelines;
    private stopPipelineExecution;
    private generatePipelineId;
    private generateExecutionId;
    private startBackgroundTasks;
    private monitorPipelineHealth;
    private checkPipelineHealth;
    private cleanupExecutions;
    private monitorDataQuality;
    private setupEventHandlers;
}
//# sourceMappingURL=pipeline-engine.d.ts.map