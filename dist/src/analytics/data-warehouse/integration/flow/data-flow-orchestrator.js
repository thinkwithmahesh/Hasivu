"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFlowOrchestrator = void 0;
const logger_1 = require("../../../../shared/utils/logger");
const events_1 = require("events");
class DataFlowOrchestrator extends events_1.EventEmitter {
    config;
    flows = new Map();
    executions = new Map();
    activeFlows = new Set();
    metrics = {
        totalFlows: 0,
        activeFlows: 0,
        completedFlows: 0,
        failedFlows: 0,
        totalRecordsProcessed: 0,
        averageThroughput: 0
    };
    schedulerInterval;
    constructor(config) {
        super();
        this.config = config;
        this.initializeOrchestrator();
    }
    async initializeOrchestrator() {
        logger_1.logger.info('Initializing Data Flow Orchestrator', {
            maxConcurrentFlows: this.config.maxConcurrentFlows,
            enableScheduling: this.config.enableScheduling
        });
        if (this.config.enableScheduling) {
            this.startScheduler();
        }
        this.setupMetricsCollection();
        this.setupHealthMonitoring();
    }
    startScheduler() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
        }
        this.schedulerInterval = setInterval(async () => {
            try {
                await this.processScheduledFlows();
            }
            catch (error) {
                logger_1.logger.error('Scheduler error', { error });
            }
        }, 60000);
        logger_1.logger.info('Data flow scheduler started');
    }
    async processScheduledFlows() {
        const now = new Date();
        for (const [flowId, flow] of Array.from(this.flows)) {
            if (this.shouldExecuteScheduledFlow(flow, now)) {
                try {
                    await this.executeFlow(flowId);
                    logger_1.logger.info('Scheduled flow executed', { flowId, flowName: flow.name });
                }
                catch (error) {
                    logger_1.logger.error('Failed to execute scheduled flow', { flowId, error });
                }
            }
        }
    }
    shouldExecuteScheduledFlow(flow, now) {
        if (!flow.executionPolicy.schedule || !flow.executionPolicy.schedule.expression) {
            return false;
        }
        const scheduleMinutes = this.parseCronExpression(flow.executionPolicy.schedule.expression);
        const currentMinutes = now.getMinutes();
        return scheduleMinutes.includes(currentMinutes);
    }
    parseCronExpression(expression) {
        const parts = expression.split(' ');
        if (parts.length >= 1) {
            const minutes = parts[0];
            if (minutes === '*') {
                return Array.from({ length: 60 }, (_, i) => i);
            }
            else if (minutes.includes('/')) {
                const [start, interval] = minutes.split('/').map(Number);
                const result = [];
                for (let i = start; i < 60; i += interval) {
                    result.push(i);
                }
                return result;
            }
            else if (!isNaN(Number(minutes))) {
                return [Number(minutes)];
            }
        }
        return [];
    }
    setupMetricsCollection() {
        if (!this.config.metricsEnabled) {
            return;
        }
        setInterval(() => {
            this.collectFlowMetrics();
        }, 30000);
        logger_1.logger.info('Metrics collection setup completed');
    }
    collectFlowMetrics() {
        this.metrics.totalFlows = this.flows.size;
        this.metrics.activeFlows = this.activeFlows.size;
        let totalThroughput = 0;
        let completedExecutions = 0;
        for (const execution of Array.from(this.executions.values())) {
            if (execution.status === 'completed' && execution.throughput > 0) {
                totalThroughput += execution.throughput;
                completedExecutions++;
            }
        }
        this.metrics.averageThroughput = completedExecutions > 0 ? totalThroughput / completedExecutions : 0;
        logger_1.logger.debug('Flow metrics collected', this.metrics);
    }
    setupHealthMonitoring() {
        setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckInterval || 60000);
        logger_1.logger.info('Health monitoring setup completed');
    }
    performHealthCheck() {
        const unhealthyFlows = [];
        const now = Date.now();
        for (const execution of Array.from(this.executions.values())) {
            if (execution.status === 'running') {
                const duration = now - execution.startTime.getTime();
                if (duration > 300000) {
                    unhealthyFlows.push(execution.id);
                }
            }
        }
        if (unhealthyFlows.length > 0) {
            logger_1.logger.warn('Detected stuck executions', { executionIds: unhealthyFlows });
        }
        this.emit('healthCheck', {
            healthy: unhealthyFlows.length === 0,
            activeFlows: this.activeFlows.size,
            totalExecutions: this.executions.size,
            stuckExecutions: unhealthyFlows.length
        });
    }
    async registerFlow(flowConfig) {
        try {
            await this.validateFlowConfig(flowConfig);
            this.flows.set(flowConfig.id, flowConfig);
            this.metrics.totalFlows++;
            logger_1.logger.info('Data flow registered successfully', {
                flowId: flowConfig.id,
                flowName: flowConfig.name,
                sourceCount: flowConfig.sourceConnections.length,
                targetCount: flowConfig.targetConnections.length
            });
            this.emit('flowRegistered', flowConfig);
        }
        catch (error) {
            logger_1.logger.error('Failed to register data flow', {
                flowId: flowConfig.id,
                error: error.message
            });
            throw error;
        }
    }
    async executeFlow(flowId, _parameters) {
        const flow = this.flows.get(flowId);
        if (!flow) {
            throw new Error(`Data flow not found: ${flowId}`);
        }
        if (this.activeFlows.size >= this.config.maxConcurrentFlows) {
            throw new Error('Maximum concurrent flows limit reached');
        }
        const executionId = this.generateExecutionId();
        const execution = {
            id: executionId,
            flowId,
            status: 'pending',
            startTime: new Date(),
            processedRecords: 0,
            errorCount: 0,
            throughput: 0,
            metrics: this.initializeExecutionMetrics(),
            checkpoints: [],
            errors: []
        };
        this.executions.set(executionId, execution);
        this.activeFlows.add(flowId);
        this.metrics.activeFlows++;
        this.executeFlowAsync(execution, flow, parameters || {});
        logger_1.logger.info('Data flow execution started', {
            executionId,
            flowId,
            flowName: flow.name
        });
        return executionId;
    }
    async executeFlowAsync(execution, flow, _parameters) {
        try {
            execution.status = 'running';
            this.emit('executionStarted', execution);
            const extractedData = await this.extractData(flow.sourceConnections, execution);
            const transformedData = await this.transformData(extractedData, flow.transformations, execution);
            await this.loadData(transformedData, flow.targetConnections, execution);
            execution.status = 'completed';
            execution.endTime = new Date();
            execution.throughput = this.calculateThroughput(execution);
            this.metrics.completedFlows++;
            this.metrics.totalRecordsProcessed += execution.processedRecords;
            this.updateAverageThroughput();
            logger_1.logger.info('Data flow execution completed successfully', {
                executionId: execution.id,
                flowId: flow.id,
                processedRecords: execution.processedRecords,
                duration: execution.endTime.getTime() - execution.startTime.getTime(),
                throughput: execution.throughput
            });
            this.emit('executionCompleted', execution);
        }
        catch (error) {
            await this.handleExecutionError(execution, flow, error);
        }
        finally {
            this.activeFlows.delete(flow.id);
            this.metrics.activeFlows--;
        }
    }
    async extractData(sources, execution) {
        const results = [];
        for (const source of sources) {
            try {
                const checkpoint = this.createCheckpoint('extraction', source.id);
                execution.checkpoints.push(checkpoint);
                let data;
                switch (source.type) {
                    case 'database':
                        data = await this.extractFromDatabase(source);
                        break;
                    case 'api':
                        data = await this.extractFromAPI(source);
                        break;
                    case 'file':
                        data = await this.extractFromFile(source);
                        break;
                    case 'stream':
                        data = await this.extractFromStream(source);
                        break;
                    case 'queue':
                        data = await this.extractFromQueue(source);
                        break;
                    default:
                        throw new Error(`Unsupported source type: ${source.type}`);
                }
                const filteredData = this.applyFilters(data, source.filters);
                results.push({
                    sourceId: source.id,
                    data: filteredData,
                    schema: source.schema,
                    recordCount: filteredData?.length || 0
                });
                execution.processedRecords += filteredData?.length || 0;
                checkpoint.endTime = new Date();
                checkpoint.status = 'completed';
            }
            catch (error) {
                const flowError = {
                    phase: 'extraction',
                    sourceId: source.id,
                    error: error.message,
                    timestamp: new Date(),
                    retryable: this.isRetryableError(error)
                };
                execution.errors.push(flowError);
                execution.errorCount++;
                if (!this.shouldContinueOnError(source, error)) {
                    throw error;
                }
            }
        }
        return results;
    }
    async transformData(extractedData, rules, execution) {
        const results = [];
        for (const data of extractedData) {
            try {
                const checkpoint = this.createCheckpoint('transformation', data.sourceId);
                execution.checkpoints.push(checkpoint);
                let transformedRecords = data.data;
                for (const rule of rules) {
                    transformedRecords = await this.applyTransformationRule(transformedRecords, rule);
                }
                const validatedRecords = this.validateTransformedData(transformedRecords, rules);
                results.push({
                    sourceId: data.sourceId,
                    data: validatedRecords,
                    transformations: rules.map(r => r.id),
                    recordCount: validatedRecords?.length || 0
                });
                checkpoint.endTime = new Date();
                checkpoint.status = 'completed';
            }
            catch (error) {
                const flowError = {
                    phase: 'transformation',
                    sourceId: data.sourceId,
                    error: error.message,
                    timestamp: new Date(),
                    retryable: this.isRetryableError(error)
                };
                execution.errors.push(flowError);
                execution.errorCount++;
                throw error;
            }
        }
        return results;
    }
    async loadData(transformedData, targets, execution) {
        for (const target of targets) {
            try {
                const checkpoint = this.createCheckpoint('loading', target.id);
                execution.checkpoints.push(checkpoint);
                for (const data of transformedData) {
                    switch (target.type) {
                        case 'database':
                            await this.loadToDatabase(data.data, target);
                            break;
                        case 'api':
                            await this.loadToAPI(data.data, target);
                            break;
                        case 'file':
                            await this.loadToFile(data.data, target);
                            break;
                        case 'stream':
                            await this.loadToStream(data.data, target);
                            break;
                        case 'queue':
                            await this.loadToQueue(data.data, target);
                            break;
                        default:
                            throw new Error(`Unsupported target type: ${target.type}`);
                    }
                }
                checkpoint.endTime = new Date();
                checkpoint.status = 'completed';
            }
            catch (error) {
                const flowError = {
                    phase: 'loading',
                    targetId: target.id,
                    error: error.message,
                    timestamp: new Date(),
                    retryable: this.isRetryableError(error)
                };
                execution.errors.push(flowError);
                execution.errorCount++;
                throw error;
            }
        }
    }
    async extractFromDatabase(source) {
        const { host, database } = source.config;
        logger_1.logger.info('Extracting data from database', {
            sourceId: source.id,
            database,
            host
        });
        return new Promise((resolve, _reject) => {
            setTimeout(() => {
                const mockData = Array.from({ length: 1000 }, (_, i) => ({
                    id: i + 1,
                    timestamp: new Date(),
                    value: Math.random() * 100
                }));
                resolve(mockData);
            }, 100);
        });
    }
    async extractFromAPI(source) {
        const { endpoint, method, headers, authentication } = source.config;
        logger_1.logger.info('Extracting data from API', {
            sourceId: source.id,
            endpoint,
            method
        });
        const axios = await Promise.resolve().then(() => __importStar(require('axios')));
        try {
            const axiosModule = axios.default || axios;
            const config = {
                method: method || 'GET',
                url: endpoint,
                headers: headers || {},
                timeout: 30000
            };
            if (authentication) {
                if (authentication.type === 'bearer') {
                    config.headers.Authorization = `Bearer ${authentication.token}`;
                }
                else if (authentication.type === 'basic') {
                    config.auth = {
                        username: authentication.username,
                        password: authentication.password
                    };
                }
            }
            const response = await axiosModule(config);
            return Array.isArray(response.data) ? response.data : [response.data];
        }
        catch (error) {
            logger_1.logger.error('API extraction failed', {
                sourceId: source.id,
                endpoint,
                error: error.message
            });
            throw error;
        }
    }
    async extractFromFile(source) {
        const { filePath, format, encoding } = source.config;
        logger_1.logger.info('Extracting data from file', {
            sourceId: source.id,
            filePath,
            format
        });
        const fs = (await Promise.resolve().then(() => __importStar(require('fs')))).promises;
        try {
            const fileContent = await fs.readFile(filePath, encoding || 'utf8');
            switch (format) {
                case 'json': {
                    const jsonData = JSON.parse(fileContent);
                    return Array.isArray(jsonData) ? jsonData : [jsonData];
                }
                case 'csv': {
                    const csv = await Promise.resolve().then(() => __importStar(require('csv-parser')));
                    const results = [];
                    return new Promise((resolve, reject) => {
                        (await Promise.resolve().then(() => __importStar(require('stream')))).Readable.from([fileContent])
                            .pipe(csv.default())
                            .on('data', (data) => results.push(data))
                            .on('end', () => resolve(results))
                            .on('error', reject);
                    });
                }
                case 'xml': {
                    const xml2js = await Promise.resolve().then(() => __importStar(require('xml2js')));
                    const parser = new xml2js.Parser();
                    const result = await parser.parseStringPromise(fileContent);
                    return [result];
                }
                default:
                    throw new Error(`Unsupported file format: ${format}`);
            }
        }
        catch (error) {
            logger_1.logger.error('File extraction failed', {
                sourceId: source.id,
                filePath,
                error: error.message
            });
            throw error;
        }
    }
    async extractFromStream(source) {
        const { streamType, topic, brokers, consumerGroup } = source.config;
        logger_1.logger.info('Extracting data from stream', {
            sourceId: source.id,
            streamType,
            topic
        });
        if (streamType === 'kafka') {
            const kafka = await Promise.resolve().then(() => __importStar(require('kafkajs')));
            const client = kafka.default({
                clientId: `data-flow-${source.id}`,
                brokers: brokers || ['localhost:9092']
            });
            const consumer = client.consumer({ groupId: consumerGroup || 'data-flow' });
            await consumer.connect();
            await consumer.subscribe({ topic });
            const messages = [];
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    consumer.disconnect();
                    resolve(messages);
                }, 10000);
                consumer.run({
                    eachMessage: async ({ message }) => {
                        try {
                            const data = JSON.parse(message.value?.toString() || '{}');
                            messages.push(data);
                            if (messages.length >= (source.config.batchSize || 100)) {
                                clearTimeout(timeout);
                                await consumer.disconnect();
                                resolve(messages);
                            }
                        }
                        catch (error) {
                            logger_1.logger.error('Error processing stream message', { error });
                        }
                    }
                }).catch(reject);
            });
        }
        throw new Error(`Unsupported stream type: ${streamType}`);
    }
    async extractFromQueue(source) {
        const { queueType, queueName, connectionString } = source.config;
        logger_1.logger.info('Extracting data from queue', {
            sourceId: source.id,
            queueType,
            queueName
        });
        if (queueType === 'rabbitmq') {
            const amqp = await Promise.resolve().then(() => __importStar(require('amqplib')));
            try {
                const connection = await amqp.default.connect(connectionString);
                const channel = await connection.createChannel();
                await channel.assertQueue(queueName, { durable: true });
                const messages = [];
                const batchSize = source.config.batchSize || 100;
                for (let i = 0; i < batchSize; i++) {
                    const message = await channel.get(queueName, { noAck: true });
                    if (message) {
                        const data = JSON.parse(message.content.toString());
                        messages.push(data);
                    }
                    else {
                        break;
                    }
                }
                await connection.close();
                return messages;
            }
            catch (error) {
                logger_1.logger.error('Queue extraction failed', {
                    sourceId: source.id,
                    queueName,
                    error: error.message
                });
                throw error;
            }
        }
        throw new Error(`Unsupported queue type: ${queueType}`);
    }
    validateFlowConfig(_config) {
        return Promise.resolve();
    }
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    initializeExecutionMetrics() {
        return {
            recordsProcessed: 0,
            recordsSkipped: 0,
            recordsFailed: 0,
            bytesProcessed: 0,
            throughputRecordsPerSec: 0,
            extractionTime: 0,
            transformationTime: 0,
            loadTime: 0,
            totalTime: 0,
            memoryUsage: 0,
            cpuUsage: 0
        };
    }
    createCheckpoint(phase, resourceId) {
        return {
            id: `cp_${Date.now()}_${resourceId}`,
            phase,
            resourceId,
            startTime: new Date(),
            status: 'running'
        };
    }
    calculateThroughput(execution) {
        if (!execution.endTime) {
            return 0;
        }
        const durationSeconds = (execution.endTime.getTime() - execution.startTime.getTime()) / 1000;
        return durationSeconds > 0 ? execution.processedRecords / durationSeconds : 0;
    }
    updateAverageThroughput() {
        let totalThroughput = 0;
        let completedCount = 0;
        for (const execution of Array.from(this.executions.values())) {
            if (execution.status === 'completed' && execution.throughput > 0) {
                totalThroughput += execution.throughput;
                completedCount++;
            }
        }
        this.metrics.averageThroughput = completedCount > 0 ? totalThroughput / completedCount : 0;
    }
    async handleExecutionError(execution, flow, error) {
        execution.status = 'failed';
        execution.endTime = new Date();
        const flowError = {
            phase: 'execution',
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            timestamp: new Date(),
            retryable: this.isRetryableError(error)
        };
        execution.errors.push(flowError);
        execution.errorCount++;
        this.metrics.failedFlows++;
        logger_1.logger.error('Flow execution failed', {
            executionId: execution.id,
            flowId: flow.id,
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            retryable: flowError.retryable
        });
        if (flowError.retryable && flow.executionPolicy.resourceLimits.timeout > 0) {
            logger_1.logger.info('Error is retryable, but retry logic not implemented in this demo');
        }
        this.emit('executionFailed', { execution, flow, error });
    }
    applyFilters(data, filters) {
        if (!filters || filters.length === 0) {
            return data;
        }
        if (!data) {
            return data;
        }
        return data.filter(record => {
            return filters.every(filter => {
                const value = record[filter.field];
                switch (filter.operator) {
                    case 'eq':
                        return value === filter.value;
                    case 'ne':
                        return value !== filter.value;
                    case 'gt':
                        return value > filter.value;
                    case 'gte':
                        return value >= filter.value;
                    case 'lt':
                        return value < filter.value;
                    case 'lte':
                        return value <= filter.value;
                    case 'in':
                        return Array.isArray(filter.value) && filter.value.includes(value);
                    case 'like':
                        return typeof value === 'string' && value.includes(filter.value);
                    default:
                        return true;
                }
            });
        });
    }
    async applyTransformationRule(data, rule) {
        logger_1.logger.debug('Applying transformation rule', {
            ruleId: rule.id,
            ruleType: rule.type,
            recordCount: data?.length || 0
        });
        if (!data) {
            return [];
        }
        switch (rule.type) {
            case 'map':
                return this.applyMapTransformation(data, rule);
            case 'filter':
                return this.applyFilterTransformation(data, rule);
            case 'aggregate':
                return this.applyAggregateTransformation(data, rule);
            case 'join':
                return this.applyJoinTransformation(data, rule);
            case 'split':
                return this.applySplitTransformation(data, rule);
            case 'enrich':
                return this.applyEnrichTransformation(data, rule);
            default:
                logger_1.logger.warn('Unsupported transformation type', { type: rule.type });
                return data;
        }
    }
    applyMapTransformation(data, rule) {
        if (!data) {
            return [];
        }
        if (!rule.expression) {
            return data;
        }
        try {
            return data.map(record => {
                const result = { ...record };
                if (rule.parameters) {
                    Object.entries(rule.parameters).forEach(([targetField, sourceField]) => {
                        if (typeof sourceField === 'string' && record[sourceField] !== undefined) {
                            result[targetField] = record[sourceField];
                        }
                    });
                }
                return result;
            });
        }
        catch (error) {
            logger_1.logger.error('Map transformation failed', { ruleId: rule.id, error });
            return data;
        }
    }
    applyFilterTransformation(data, rule) {
        if (!data) {
            return [];
        }
        if (!rule.parameters || !rule.parameters.conditions) {
            return data;
        }
        const conditions = rule.parameters.conditions;
        return this.applyFilters(data, conditions) || [];
    }
    applyAggregateTransformation(data, rule) {
        if (!data) {
            return [];
        }
        if (!rule.parameters || !rule.parameters.groupBy) {
            return data;
        }
        const groupBy = rule.parameters.groupBy;
        const aggregations = rule.parameters.aggregations || [];
        const grouped = new Map();
        data.forEach(record => {
            const key = groupBy.map(field => record[field]).join('|');
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(record);
        });
        return Array.from(grouped.entries()).map(([key, records]) => {
            const result = {};
            groupBy.forEach((field, index) => {
                result[field] = key.split('|')[index];
            });
            aggregations.forEach((agg) => {
                const values = records.map(r => r[agg.field]).filter(v => v != null);
                switch (agg.function) {
                    case 'count':
                        result[agg.alias] = records.length;
                        break;
                    case 'sum':
                        result[agg.alias] = values.reduce((sum, val) => sum + (Number(val) || 0), 0);
                        break;
                    case 'avg': {
                        const sum = values.reduce((s, val) => s + (Number(val) || 0), 0);
                        result[agg.alias] = values.length > 0 ? sum / values.length : 0;
                        break;
                    }
                    case 'min':
                        result[agg.alias] = values.length > 0 ? Math.min(...values.map(Number)) : null;
                        break;
                    case 'max':
                        result[agg.alias] = values.length > 0 ? Math.max(...values.map(Number)) : null;
                        break;
                }
            });
            return result;
        });
    }
    applyJoinTransformation(data, _rule) {
        if (!data) {
            return [];
        }
        logger_1.logger.info('Join transformation not fully implemented in demo');
        return data;
    }
    applySplitTransformation(data, rule) {
        if (!data) {
            return [];
        }
        if (!rule.parameters || !rule.parameters.splitField) {
            return data;
        }
        const splitField = rule.parameters.splitField;
        const separator = rule.parameters.separator || ',';
        const result = [];
        data.forEach(record => {
            const value = record[splitField];
            if (typeof value === 'string') {
                const parts = value.split(separator);
                parts.forEach(part => {
                    result.push({
                        ...record,
                        [splitField]: part.trim()
                    });
                });
            }
            else {
                result.push(record);
            }
        });
        return result;
    }
    applyEnrichTransformation(data, rule) {
        if (!data) {
            return [];
        }
        if (!rule.parameters) {
            return data;
        }
        return data.map(record => {
            const enriched = { ...record };
            if (rule.parameters.addTimestamp) {
                enriched.enriched_at = new Date().toISOString();
            }
            if (rule.parameters.computedFields) {
                Object.entries(rule.parameters.computedFields).forEach(([field, expression]) => {
                    if (typeof expression === 'string' && expression.includes('+')) {
                        const [field1, field2] = expression.split('+').map(s => s.trim());
                        enriched[field] = (Number(record[field1]) || 0) + (Number(record[field2]) || 0);
                    }
                });
            }
            return enriched;
        });
    }
    validateTransformedData(data, rules) {
        if (!data) {
            return [];
        }
        const validData = [];
        data.forEach(record => {
            let isValid = true;
            rules.forEach(rule => {
                if (rule.validation && rule.validation.length > 0) {
                    rule.validation.forEach(validation => {
                        if (!this.validateRecord(record, validation)) {
                            isValid = false;
                            logger_1.logger.warn('Record validation failed', {
                                ruleId: rule.id,
                                validation: validation.type,
                                record: record
                            });
                        }
                    });
                }
            });
            if (isValid) {
                validData.push(record);
            }
        });
        return validData;
    }
    validateRecord(record, validation) {
        switch (validation.type) {
            case 'not_null': {
                return record[validation.field] != null;
            }
            case 'unique': {
                return true;
            }
            case 'range': {
                const value = Number(record[validation.field]);
                const min = validation.parameters?.min || Number.MIN_SAFE_INTEGER;
                const max = validation.parameters?.max || Number.MAX_SAFE_INTEGER;
                return value >= min && value <= max;
            }
            case 'pattern': {
                const pattern = new RegExp(validation.parameters?.pattern || '.*');
                return pattern.test(String(record[validation.field]));
            }
            default:
                return true;
        }
    }
    isRetryableError(error) {
        const retryableErrors = [
            'ECONNRESET',
            'ETIMEDOUT',
            'ENOTFOUND',
            'ECONNREFUSED',
            'NETWORK_ERROR',
            'TEMPORARY_FAILURE'
        ];
        return retryableErrors.some(retryable => (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)).includes(retryable) || error.name.includes(retryable));
    }
    shouldContinueOnError(connection, error) {
        const strategy = connection.errorHandling?.onError || 'fail';
        switch (strategy) {
            case 'skip':
                return true;
            case 'retry':
                return this.isRetryableError(error);
            case 'fail':
            case 'quarantine':
            default:
                return false;
        }
    }
    async loadToDatabase(data, target) {
        if (!data) {
            logger_1.logger.info('No data to load to database', { targetId: target.id });
            return;
        }
        const { database, table, writeMode } = target.config;
        logger_1.logger.info('Loading data to database', {
            targetId: target.id,
            database,
            table,
            recordCount: data.length,
            writeMode
        });
        return new Promise((resolve) => {
            setTimeout(() => {
                logger_1.logger.info('Database load completed', {
                    targetId: target.id,
                    recordsLoaded: data.length
                });
                resolve();
            }, 200);
        });
    }
    async loadToAPI(data, target) {
        if (!data) {
            logger_1.logger.info('No data to load to API', { targetId: target.id });
            return;
        }
        const { endpoint, method } = target.config;
        logger_1.logger.info('Loading data to API', {
            targetId: target.id,
            endpoint,
            method: method || 'POST',
            recordCount: data.length
        });
        try {
            const batchSize = target.config.batchSize || 100;
            const batches = [];
            for (let i = 0; i < data.length; i += batchSize) {
                batches.push(data.slice(i, i + batchSize));
            }
            for (const batch of batches) {
                await this.sendBatchToAPI(batch, target);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            logger_1.logger.info('API load completed', {
                targetId: target.id,
                batchCount: batches.length,
                recordsLoaded: data.length
            });
        }
        catch (error) {
            logger_1.logger.error('API load failed', {
                targetId: target.id,
                error: error.message
            });
            throw error;
        }
    }
    async sendBatchToAPI(_batch, _target) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() < 0.05) {
                    reject(new Error('API_TEMPORARY_FAILURE'));
                }
                else {
                    resolve();
                }
            }, 50);
        });
    }
    async loadToFile(data, target) {
        if (!data) {
            logger_1.logger.info('No data to load to file', { targetId: target.id });
            return;
        }
        const { filePath, format } = target.config;
        logger_1.logger.info('Loading data to file', {
            targetId: target.id,
            filePath,
            format: format || 'json',
            recordCount: data.length
        });
        try {
            let content;
            switch (format) {
                case 'csv':
                    content = this.convertToCSV(data);
                    break;
                case 'json':
                default:
                    content = JSON.stringify(data, null, 2);
                    break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            logger_1.logger.info('File load completed', {
                targetId: target.id,
                filePath,
                recordsLoaded: data.length,
                fileSize: content.length
            });
        }
        catch (error) {
            logger_1.logger.error('File load failed', {
                targetId: target.id,
                error: error.message
            });
            throw error;
        }
    }
    convertToCSV(data) {
        if (!data || data.length === 0) {
            return '';
        }
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        });
        return csvRows.join('\n');
    }
    async loadToStream(data, target) {
        if (!data) {
            logger_1.logger.info('No data to load to stream', { targetId: target.id });
            return;
        }
        const { streamType, topic } = target.config;
        logger_1.logger.info('Loading data to stream', {
            targetId: target.id,
            streamType,
            topic,
            recordCount: data.length
        });
        switch (streamType) {
            case 'kafka':
                await this.loadToKafkaStream(data, target);
                break;
            case 'kinesis':
                await this.loadToKinesisStream(data, target);
                break;
            default:
                throw new Error(`Unsupported stream type: ${streamType}`);
        }
    }
    async loadToKafkaStream(data, target) {
        if (!data) {
            logger_1.logger.info('No data to load to Kafka stream', { targetId: target.id });
            return;
        }
        const { topic, brokers } = target.config;
        try {
            logger_1.logger.info('Kafka stream load simulation', {
                targetId: target.id,
                topic,
                brokers,
                recordCount: data.length
            });
            await new Promise(resolve => setTimeout(resolve, 300));
            logger_1.logger.info('Kafka stream load completed', {
                targetId: target.id,
                recordsStreamed: data.length
            });
        }
        catch (error) {
            logger_1.logger.error('Kafka stream load failed', {
                targetId: target.id,
                error: error.message
            });
            throw error;
        }
    }
    async loadToKinesisStream(data, target) {
        if (!data) {
            logger_1.logger.info('No data to load to Kinesis stream', { targetId: target.id });
            return;
        }
        const { streamName, region } = target.config;
        try {
            logger_1.logger.info('Kinesis stream load simulation', {
                targetId: target.id,
                streamName,
                region,
                recordCount: data.length
            });
            await new Promise(resolve => setTimeout(resolve, 250));
            logger_1.logger.info('Kinesis stream load completed', {
                targetId: target.id,
                recordsStreamed: data.length
            });
        }
        catch (error) {
            logger_1.logger.error('Kinesis stream load failed', {
                targetId: target.id,
                error: error.message
            });
            throw error;
        }
    }
    async loadToQueue(data, target) {
        if (!data) {
            logger_1.logger.info('No data to load to queue', { targetId: target.id });
            return;
        }
        const { queueType, queueName } = target.config;
        logger_1.logger.info('Loading data to queue', {
            targetId: target.id,
            queueType,
            queueName,
            recordCount: data.length
        });
        switch (queueType) {
            case 'rabbitmq':
                await this.loadToRabbitMQQueue(data, target);
                break;
            case 'sqs':
                await this.loadToSQSQueue(data, target);
                break;
            default:
                throw new Error(`Unsupported queue type: ${queueType}`);
        }
    }
    async loadToRabbitMQQueue(data, target) {
        if (!data) {
            logger_1.logger.info('No data to load to RabbitMQ queue', { targetId: target.id });
            return;
        }
        const { queueName } = target.config;
        try {
            logger_1.logger.info('RabbitMQ queue load simulation', {
                targetId: target.id,
                queueName,
                recordCount: data.length
            });
            await new Promise(resolve => setTimeout(resolve, 200));
            logger_1.logger.info('RabbitMQ queue load completed', {
                targetId: target.id,
                messagesQueued: data.length
            });
        }
        catch (error) {
            logger_1.logger.error('RabbitMQ queue load failed', {
                targetId: target.id,
                error: error.message
            });
            throw error;
        }
    }
    async loadToSQSQueue(data, target) {
        if (!data) {
            logger_1.logger.info('No data to load to SQS queue', { targetId: target.id });
            return;
        }
        const { queueUrl, region } = target.config;
        try {
            logger_1.logger.info('SQS queue load simulation', {
                targetId: target.id,
                queueUrl,
                region,
                recordCount: data.length
            });
            await new Promise(resolve => setTimeout(resolve, 150));
            logger_1.logger.info('SQS queue load completed', {
                targetId: target.id,
                messagesQueued: data.length
            });
        }
        catch (error) {
            logger_1.logger.error('SQS queue load failed', {
                targetId: target.id,
                error: error.message
            });
            throw error;
        }
    }
    getExecutionStatus(executionId) {
        return this.executions.get(executionId);
    }
    getFlowExecutions(flowId) {
        return Array.from(this.executions.values()).filter(exec => exec.flowId === flowId);
    }
    getMetrics() {
        return { ...this.metrics };
    }
    async stopExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (execution && execution.status === 'running') {
            execution.status = 'cancelled';
            execution.endTime = new Date();
            logger_1.logger.info('Execution stopped', { executionId });
            this.emit('executionStopped', execution);
        }
    }
    cleanupCompletedExecutions(maxAge = 24 * 60 * 60 * 1000) {
        const cutoffTime = Date.now() - maxAge;
        const toDelete = [];
        for (const [id, execution] of Array.from(this.executions.entries())) {
            if (execution.endTime && execution.endTime.getTime() < cutoffTime) {
                toDelete.push(id);
            }
        }
        toDelete.forEach(id => this.executions.delete(id));
        if (toDelete.length > 0) {
            logger_1.logger.info('Cleaned up completed executions', { count: toDelete.length });
        }
    }
    async shutdown() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
        }
        const activeExecutions = Array.from(this.executions.values())
            .filter(exec => exec.status === 'running');
        if (activeExecutions.length > 0) {
            logger_1.logger.info('Waiting for active executions to complete', {
                count: activeExecutions.length
            });
            await new Promise(resolve => setTimeout(resolve, 30000));
            for (const execution of activeExecutions) {
                if (execution.status === 'running') {
                    await this.stopExecution(execution.id);
                }
            }
        }
        this.flows.clear();
        this.executions.clear();
        this.activeFlows.clear();
        logger_1.logger.info('Data Flow Orchestrator shut down complete');
    }
}
exports.DataFlowOrchestrator = DataFlowOrchestrator;
exports.default = DataFlowOrchestrator;
//# sourceMappingURL=data-flow-orchestrator.js.map