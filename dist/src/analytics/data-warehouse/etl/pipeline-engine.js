"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETLPipelineEngine = void 0;
const events_1 = require("events");
const logger_1 = require("../../../shared/utils/logger");
const metrics_service_1 = require("../../../services/metrics.service");
const queue_manager_service_1 = require("../../../services/queue-manager.service");
const streaming_ingestion_engine_1 = require("./streaming/streaming-ingestion-engine");
const etl_support_classes_1 = require("./etl-support-classes");
class ETLPipelineEngine extends events_1.EventEmitter {
    config;
    metrics = new metrics_service_1.MetricsCollector();
    queue = new queue_manager_service_1.QueueManager();
    streamingEngine;
    batchEngine;
    deltaLakeManager;
    schemaEvolution;
    airflowOrchestrator;
    transformationEngine;
    validationEngine;
    errorRecovery;
    cdcManager;
    qualityMonitor;
    isRunning = false;
    activePipelines = new Map();
    pipelineExecutions = new Map();
    dataSourceRegistry = new Map();
    dataSinkRegistry = new Map();
    constructor(config) {
        super();
        this.config = config;
        logger_1.logger.info('Initializing ETL Pipeline Engine', {
            streamingEnabled: config.streaming.enabled,
            batchEnabled: config.batch.enabled,
            deltaLakeEnabled: config.deltaLake.enabled,
            maxConcurrentPipelines: config.maxConcurrentPipelines || 10
        });
        this.streamingEngine = new streaming_ingestion_engine_1.StreamingIngestionEngine(config.streaming);
        this.batchEngine = new etl_support_classes_1.BatchProcessingEngine(config.batch);
        this.deltaLakeManager = new etl_support_classes_1.DeltaLakeManager(config.deltaLake);
        this.schemaEvolution = new etl_support_classes_1.SchemaEvolutionManager(config.schemaEvolution);
        this.airflowOrchestrator = new etl_support_classes_1.AirflowOrchestrator(config.orchestration);
        this.transformationEngine = new etl_support_classes_1.TransformationEngine(config.transformation);
        this.validationEngine = new etl_support_classes_1.DataValidationEngine(config.validation);
        this.errorRecovery = new etl_support_classes_1.ErrorRecoveryManager(config.errorHandling);
        this.cdcManager = new etl_support_classes_1.ChangeDataCaptureManager(config.cdc);
        this.qualityMonitor = new etl_support_classes_1.DataQualityMonitor(config.dataQuality);
        this.setupEventHandlers();
    }
    async start() {
        try {
            logger_1.logger.info('Starting ETL Pipeline Engine...');
            await Promise.all([
                this.streamingEngine.initialize(),
                this.batchEngine.initialize(),
                this.deltaLakeManager.initialize(),
                this.schemaEvolution.initialize(),
                this.airflowOrchestrator.initialize(),
                this.transformationEngine.initialize(),
                this.validationEngine.initialize(),
                this.errorRecovery.initialize(),
                this.cdcManager.initialize(),
                this.qualityMonitor.initialize()
            ]);
            await this.queue.start();
            await this.loadExistingPipelines();
            await this.loadDataSources();
            await this.loadDataSinks();
            this.isRunning = true;
            this.startBackgroundTasks();
            logger_1.logger.info('ETL Pipeline Engine started successfully');
            this.emit('started');
        }
        catch (error) {
            logger_1.logger.error('Failed to start ETL Pipeline Engine', { error });
            throw error;
        }
    }
    async stop() {
        try {
            logger_1.logger.info('Stopping ETL Pipeline Engine...');
            this.isRunning = false;
            await this.stopAllPipelines();
            await Promise.all([
                this.streamingEngine.shutdown(),
                this.batchEngine.shutdown(),
                this.deltaLakeManager.shutdown(),
                this.schemaEvolution.shutdown(),
                this.airflowOrchestrator.shutdown(),
                this.transformationEngine.shutdown(),
                this.validationEngine.shutdown(),
                this.errorRecovery.shutdown(),
                this.cdcManager.shutdown(),
                this.qualityMonitor.shutdown()
            ]);
            await this.queue.stop();
            logger_1.logger.info('ETL Pipeline Engine stopped successfully');
            this.emit('stopped');
        }
        catch (error) {
            logger_1.logger.error('Error stopping ETL Pipeline Engine', { error });
            throw error;
        }
    }
    async createPipeline(pipelineDef) {
        try {
            logger_1.logger.info('Creating ETL pipeline', {
                name: pipelineDef.name,
                sourceId: pipelineDef.sourceId,
                sinkId: pipelineDef.sinkId,
                tenantId: pipelineDef.tenantId
            });
            const source = this.dataSourceRegistry.get(pipelineDef.sourceId);
            const sink = this.dataSinkRegistry.get(pipelineDef.sinkId);
            if (!source) {
                throw new Error(`Data source not found: ${pipelineDef.sourceId}`);
            }
            if (!sink) {
                throw new Error(`Data sink not found: ${pipelineDef.sinkId}`);
            }
            await this.transformationEngine.validateTransformations(pipelineDef.transformations);
            const pipeline = {
                id: this.generatePipelineId(),
                name: pipelineDef.name,
                description: pipelineDef.description,
                source,
                sink,
                transformations: pipelineDef.transformations,
                schedule: pipelineDef.schedule,
                realtime: pipelineDef.realtime || false,
                tenantId: pipelineDef.tenantId,
                status: 'created',
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
                config: {
                    maxRetries: 3,
                    timeoutMs: 300000,
                    checkpointInterval: 10000,
                    parallelism: 4,
                    bufferSize: 1000
                },
                metadata: {
                    creator: 'system',
                    tags: ['auto-generated'],
                    priority: 'normal'
                }
            };
            if (pipeline.schedule) {
                await this.airflowOrchestrator.registerPipeline(pipeline);
            }
            if (pipeline.realtime) {
                await this.streamingEngine.registerPipeline(pipeline);
            }
            this.activePipelines.set(pipeline.id, pipeline);
            logger_1.logger.info('ETL pipeline created successfully', {
                pipelineId: pipeline.id,
                name: pipeline.name
            });
            this.metrics.increment('etl.pipeline.created');
            this.emit('pipeline:created', pipeline);
            return pipeline;
        }
        catch (error) {
            logger_1.logger.error('Failed to create ETL pipeline', { error, pipelineDef });
            this.metrics.increment('etl.pipeline.creation.failed');
            throw error;
        }
    }
    async executePipeline(pipelineId, options = { triggerType: 'manual' }) {
        const startTime = Date.now();
        try {
            const pipeline = this.activePipelines.get(pipelineId);
            if (!pipeline) {
                throw new Error(`Pipeline not found: ${pipelineId}`);
            }
            logger_1.logger.info('Executing ETL pipeline', {
                pipelineId,
                triggerType: options.triggerType,
                tenantId: pipeline.tenantId
            });
            const execution = {
                id: this.generateExecutionId(),
                pipelineId,
                tenantId: pipeline.tenantId,
                status: 'running',
                triggerType: options.triggerType,
                parameters: options.parameters || {},
                startTime: new Date(),
                progress: {
                    totalSteps: pipeline.transformations.length + 2,
                    completedSteps: 0,
                    currentStep: 'initializing',
                    percentage: 0
                },
                metrics: {
                    recordsProcessed: 0,
                    recordsSkipped: 0,
                    recordsFailed: 0,
                    bytesProcessed: 0,
                    throughputRecordsPerSec: 0
                },
                logs: [],
                errors: []
            };
            this.pipelineExecutions.set(execution.id, execution);
            try {
                await this.executePipelineSteps(pipeline, execution);
                execution.status = 'completed';
                execution.endTime = new Date();
                execution.progress.percentage = 100;
                execution.progress.currentStep = 'completed';
                const executionTime = Date.now() - startTime;
                logger_1.logger.info('Pipeline execution completed successfully', {
                    pipelineId,
                    executionId: execution.id,
                    executionTime,
                    recordsProcessed: execution.metrics.recordsProcessed
                });
                this.metrics.timing('etl.pipeline.execution.time', executionTime);
                this.metrics.increment('etl.pipeline.execution.success');
                this.metrics.gauge('etl.pipeline.records.processed', execution.metrics.recordsProcessed);
                this.emit('pipeline:completed', execution);
            }
            catch (error) {
                execution.status = 'failed';
                execution.endTime = new Date();
                const err = error instanceof Error ? error : new Error(String(error));
                execution.errors.push({
                    message: err.message,
                    stack: err.stack,
                    timestamp: new Date(),
                    step: execution.progress.currentStep,
                    recoverable: true
                });
                logger_1.logger.error('Pipeline execution failed', {
                    error,
                    pipelineId,
                    executionId: execution.id
                });
                this.metrics.increment('etl.pipeline.execution.failed');
                this.emit('pipeline:failed', execution);
                const pipelineError = error instanceof Error ? error : new Error(String(error));
                await this.errorRecovery.handlePipelineFailure(pipeline, execution, pipelineError);
                throw error;
            }
            return execution;
        }
        catch (error) {
            logger_1.logger.error('Failed to execute pipeline', { error, pipelineId });
            throw error;
        }
    }
    async registerDataSource(source) {
        try {
            logger_1.logger.info('Registering data source', {
                id: source.id,
                type: source.type,
                tenantId: source.tenantId
            });
            await this.validateDataSource(source);
            await this.initializeDataSource(source);
            this.dataSourceRegistry.set(source.id, source);
            if (source.cdcEnabled) {
                await this.cdcManager.setupCDC(source);
            }
            logger_1.logger.info('Data source registered successfully', { id: source.id });
            this.metrics.increment('etl.datasource.registered');
        }
        catch (error) {
            logger_1.logger.error('Failed to register data source', { error, source });
            throw error;
        }
    }
    async registerDataSink(sink) {
        try {
            logger_1.logger.info('Registering data sink', {
                id: sink.id,
                type: sink.type,
                tenantId: sink.tenantId
            });
            await this.validateDataSink(sink);
            await this.initializeDataSink(sink);
            this.dataSinkRegistry.set(sink.id, sink);
            logger_1.logger.info('Data sink registered successfully', { id: sink.id });
            this.metrics.increment('etl.datasink.registered');
        }
        catch (error) {
            logger_1.logger.error('Failed to register data sink', { error, sink });
            throw error;
        }
    }
    async monitorExecution(executionId) {
        return this.pipelineExecutions.get(executionId) || null;
    }
    async getPipelines(tenantId) {
        const pipelines = Array.from(this.activePipelines.values());
        if (tenantId) {
            return pipelines.filter(p => p.tenantId === tenantId);
        }
        return pipelines;
    }
    async getExecutionHistory(pipelineId, limit = 100) {
        const executions = Array.from(this.pipelineExecutions.values())
            .filter(e => e.pipelineId === pipelineId)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .slice(0, limit);
        return executions;
    }
    async getPipelineStatistics() {
        try {
            const totalPipelines = this.activePipelines.size;
            const activePipelines = Array.from(this.activePipelines.values())
                .filter(p => p.status === 'running').length;
            const executions = Array.from(this.pipelineExecutions.values());
            const successfulExecutions = executions.filter(e => e.status === 'completed').length;
            const failedExecutions = executions.filter(e => e.status === 'failed').length;
            const completedExecutions = executions.filter(e => e.endTime);
            const avgExecutionTime = completedExecutions.length > 0
                ? completedExecutions.reduce((sum, e) => {
                    return sum + (e.endTime.getTime() - e.startTime.getTime());
                }, 0) / completedExecutions.length
                : 0;
            const totalRecordsProcessed = executions.reduce((sum, e) => sum + e.metrics.recordsProcessed, 0);
            const totalBytesProcessed = executions.reduce((sum, e) => sum + e.metrics.bytesProcessed, 0);
            const qualityStats = await this.qualityMonitor.getOverallStatistics();
            return {
                totalPipelines,
                activePipelines,
                totalExecutions: executions.length,
                successfulExecutions,
                failedExecutions,
                averageExecutionTime: avgExecutionTime,
                throughput: {
                    recordsPerHour: totalRecordsProcessed,
                    bytesPerHour: totalBytesProcessed
                },
                dataQuality: {
                    overallScore: qualityStats.overallScore,
                    issues: qualityStats.totalIssues,
                    trends: qualityStats.trends
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get pipeline statistics', { error });
            throw error;
        }
    }
    async getHealthStatus() {
        try {
            const [streamingHealth, batchHealth, deltaHealth, schemaHealth, airflowHealth, transformHealth, validationHealth, recoveryHealth, cdcHealth, qualityHealth] = await Promise.all([
                this.streamingEngine.getHealthStatus(),
                this.batchEngine.getHealthStatus(),
                this.deltaLakeManager.getHealthStatus(),
                this.schemaEvolution.getHealthStatus(),
                this.airflowOrchestrator.getHealthStatus(),
                this.transformationEngine.getHealthStatus(),
                this.validationEngine.getHealthStatus(),
                this.errorRecovery.getHealthStatus(),
                this.cdcManager.getHealthStatus(),
                this.qualityMonitor.getHealthStatus()
            ]);
            const components = {
                streaming: streamingHealth,
                batch: batchHealth,
                deltaLake: deltaHealth,
                schemaEvolution: schemaHealth,
                airflow: airflowHealth,
                transformation: transformHealth,
                validation: validationHealth,
                errorRecovery: recoveryHealth,
                cdc: cdcHealth,
                dataQuality: qualityHealth
            };
            const healthy = Object.values(components).every(comp => comp.healthy) && this.isRunning;
            return {
                healthy,
                components,
                metrics: {
                    activePipelines: this.activePipelines.size,
                    activeExecutions: Array.from(this.pipelineExecutions.values())
                        .filter(e => e.status === 'running').length,
                    registeredSources: this.dataSourceRegistry.size,
                    registeredSinks: this.dataSinkRegistry.size,
                    memoryUsage: process.memoryUsage().heapUsed,
                    uptime: process.uptime()
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting health status', { error });
            return {
                healthy: false,
                components: {},
                metrics: {}
            };
        }
    }
    async executePipelineSteps(pipeline, execution) {
        const steps = [
            { name: 'source', fn: () => this.executeSourceStep(pipeline, execution) },
            ...pipeline.transformations.map((transform, index) => ({
                name: `transform_${index}`,
                fn: () => this.executeTransformationStep(pipeline, execution, transform)
            })),
            { name: 'sink', fn: () => this.executeSinkStep(pipeline, execution) }
        ];
        for (const [index, step] of steps.entries()) {
            execution.progress.currentStep = step.name;
            execution.progress.completedSteps = index;
            execution.progress.percentage = Math.round((index / steps.length) * 100);
            logger_1.logger.debug('Executing pipeline step', {
                pipelineId: pipeline.id,
                executionId: execution.id,
                step: step.name
            });
            await step.fn();
        }
    }
    async executeSourceStep(pipeline, execution) {
        execution.logs.push({
            level: 'info',
            message: `Started reading from source: ${pipeline.source.id}`,
            timestamp: new Date()
        });
    }
    async executeTransformationStep(pipeline, execution, transformation) {
        await this.transformationEngine.executeTransformation(transformation, execution);
    }
    async executeSinkStep(pipeline, execution) {
        execution.logs.push({
            level: 'info',
            message: `Completed writing to sink: ${pipeline.sink.id}`,
            timestamp: new Date()
        });
    }
    async loadExistingPipelines() {
    }
    async loadDataSources() {
    }
    async loadDataSinks() {
    }
    async validateDataSource(source) {
        if (!source.id || !source.type || !source.config) {
            throw new Error('Invalid data source configuration');
        }
    }
    async validateDataSink(sink) {
        if (!sink.id || !sink.type || !sink.config) {
            throw new Error('Invalid data sink configuration');
        }
    }
    async initializeDataSource(_source) {
    }
    async initializeDataSink(_sink) {
    }
    async stopAllPipelines() {
        const runningExecutions = Array.from(this.pipelineExecutions.values())
            .filter(e => e.status === 'running');
        await Promise.all(runningExecutions.map(execution => this.stopPipelineExecution(execution.id)));
    }
    async stopPipelineExecution(executionId) {
        const execution = this.pipelineExecutions.get(executionId);
        if (execution && execution.status === 'running') {
            execution.status = 'cancelled';
            execution.endTime = new Date();
            logger_1.logger.info('Pipeline execution stopped', { executionId });
        }
    }
    generatePipelineId() {
        return `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateExecutionId() {
        return `execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    startBackgroundTasks() {
        setInterval(() => {
            this.monitorPipelineHealth();
        }, 30000);
        setInterval(() => {
            this.cleanupExecutions();
        }, 10 * 60 * 1000);
        setInterval(() => {
            this.monitorDataQuality();
        }, 5 * 60 * 1000);
    }
    async monitorPipelineHealth() {
        try {
            for (const [id, pipeline] of this.activePipelines.entries()) {
                const health = await this.checkPipelineHealth(pipeline);
                if (!health.healthy) {
                    logger_1.logger.warn('Unhealthy pipeline detected', {
                        pipelineId: id,
                        issues: health.issues
                    });
                    this.emit('pipeline:unhealthy', { pipeline, health });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error monitoring pipeline health', { error });
        }
    }
    async checkPipelineHealth(pipeline) {
        const issues = [];
        try {
            await this.validateDataSource(pipeline.source);
        }
        catch (error) {
            const sourceError = error instanceof Error ? error : new Error(String(error));
            issues.push(`Source connectivity issue: ${sourceError.message}`);
        }
        try {
            await this.validateDataSink(pipeline.sink);
        }
        catch (error) {
            const sinkError = error instanceof Error ? error : new Error(String(error));
            issues.push(`Sink connectivity issue: ${sinkError.message}`);
        }
        return {
            healthy: issues.length === 0,
            issues
        };
    }
    cleanupExecutions() {
        const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000));
        for (const [id, execution] of this.pipelineExecutions.entries()) {
            if (execution.endTime && execution.endTime < cutoffTime) {
                this.pipelineExecutions.delete(id);
            }
        }
    }
    async monitorDataQuality() {
        try {
            await this.qualityMonitor.performQualityCheck();
        }
        catch (error) {
            logger_1.logger.error('Error monitoring data quality', { error });
        }
    }
    setupEventHandlers() {
        this.on('pipeline:created', (pipeline) => {
            logger_1.logger.info('Pipeline created event', { pipelineId: pipeline.id });
            this.metrics.increment('etl.events.pipeline.created');
        });
        this.on('pipeline:completed', (execution) => {
            logger_1.logger.info('Pipeline completed event', {
                pipelineId: execution.pipelineId,
                executionId: execution.id
            });
            this.metrics.increment('etl.events.pipeline.completed');
        });
        this.on('pipeline:failed', (execution) => {
            logger_1.logger.error('Pipeline failed event', {
                pipelineId: execution.pipelineId,
                executionId: execution.id,
                errors: execution.errors
            });
            this.metrics.increment('etl.events.pipeline.failed');
        });
        this.on('error', (error) => {
            logger_1.logger.error('ETL engine error', { error });
            this.metrics.increment('etl.errors.engine');
        });
    }
}
exports.ETLPipelineEngine = ETLPipelineEngine;
//# sourceMappingURL=pipeline-engine.js.map