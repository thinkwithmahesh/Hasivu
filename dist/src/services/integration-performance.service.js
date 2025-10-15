"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationPerformanceService = void 0;
const logger_1 = require("@/utils/logger");
const redis_service_1 = require("@/services/redis.service");
class IntegrationPerformanceService {
    static instance;
    activeSagas = new Map();
    epicMetrics = new Map();
    dataFlowTraces = [];
    retryConfigs = new Map();
    circuitBreakers = new Map();
    performanceHistory = [];
    constructor() {
        this.initializeDefaultRetryConfigs();
        this.startPerformanceMonitoring();
    }
    static getInstance() {
        if (!IntegrationPerformanceService.instance) {
            IntegrationPerformanceService.instance = new IntegrationPerformanceService();
        }
        return IntegrationPerformanceService.instance;
    }
    initializeDefaultRetryConfigs() {
        const defaultConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            backoffMultiplier: 2,
            jitter: true
        };
        const epics = [
            'authentication', 'profile_management', 'nutrition_planning',
            'community_engagement', 'payments', 'notifications', 'templates'
        ];
        epics.forEach(epic => {
            this.retryConfigs.set(epic, { ...defaultConfig });
        });
        this.retryConfigs.set('payments', {
            ...defaultConfig,
            maxRetries: 5,
            maxDelay: 60000
        });
        this.retryConfigs.set('notifications', {
            ...defaultConfig,
            maxRetries: 2,
            baseDelay: 500
        });
        epics.forEach(epic => {
            this.circuitBreakers.set(epic, {
                isOpen: false,
                failureCount: 0,
                successCount: 0,
                lastFailureTime: new Date(0),
                timeout: 60000
            });
        });
    }
    startPerformanceMonitoring() {
        setInterval(async () => {
            await this.updateEpicMetrics();
        }, 30000);
        setInterval(async () => {
            await this.analyzeDataFlowPerformance();
        }, 60000);
        setInterval(() => {
            this.cleanupOldTraces();
        }, 300000);
        setInterval(async () => {
            await this.generatePerformanceReport();
        }, 120000);
    }
    async executeSaga(type, steps, metadata = {}) {
        const sagaId = this.generateSagaId(type);
        const saga = {
            id: sagaId,
            type,
            status: 'pending',
            steps: steps.map((step, index) => ({
                ...step,
                id: `${sagaId}-step-${index}`,
                status: 'pending',
                retries: 0
            })),
            metadata,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.activeSagas.set(sagaId, saga);
        try {
            logger_1.logger.info(`Starting saga transaction: ${sagaId}`, { type, stepsCount: steps.length });
            saga.status = 'running';
            saga.updatedAt = new Date();
            const results = [];
            for (let i = 0; i < saga.steps.length; i++) {
                const step = saga.steps[i];
                const stepResult = await this.executeStep(step, saga);
                if (stepResult.success) {
                    step.result = stepResult.result;
                    results.push(stepResult.result);
                }
                else {
                    logger_1.logger.error(`Saga step failed: ${step.id}`, { error: stepResult.error });
                    await this.compensateTransaction(saga, i - 1);
                    saga.status = 'failed';
                    return { success: false, error: stepResult.error };
                }
            }
            saga.status = 'completed';
            saga.updatedAt = new Date();
            logger_1.logger.info(`Saga transaction completed: ${sagaId}`, { resultsCount: results.length });
            await this.cacheSagaResult(saga, results);
            return { success: true, result: results };
        }
        catch (error) {
            logger_1.logger.error(`Saga transaction error: ${sagaId}`, error);
            saga.status = 'failed';
            saga.updatedAt = new Date();
            await this.compensateTransaction(saga, saga.steps.length - 1);
            return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error' };
        }
        finally {
            setTimeout(() => {
                this.activeSagas.delete(sagaId);
            }, 3600000);
        }
    }
    async executeStep(step, saga) {
        const retryConfig = this.retryConfigs.get(step.epic);
        if (!retryConfig) {
            throw new Error(`No retry configuration found for epic: ${step.epic}`);
        }
        if (this.isCircuitOpen(step.epic)) {
            throw new Error(`Circuit breaker open for epic: ${step.epic}`);
        }
        const startTime = Date.now();
        step.status = 'running';
        for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
            try {
                step.retries = attempt;
                const result = await this.simulateStepExecution(step);
                step.status = 'completed';
                step.duration = Date.now() - startTime;
                this.recordCircuitBreakerSuccess(step.epic);
                await this.trackDataFlow(step, saga, true, Date.now() - startTime);
                return { success: true, result };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error';
                step.error = errorMessage;
                this.recordCircuitBreakerFailure(step.epic);
                if (attempt < retryConfig.maxRetries) {
                    const delay = this.calculateRetryDelay(attempt, retryConfig);
                    logger_1.logger.warn(`Step ${step.id} failed, retrying in ${delay}ms`, { attempt, error: errorMessage });
                    await this.sleep(delay);
                }
                else {
                    step.status = 'failed';
                    step.duration = Date.now() - startTime;
                    await this.trackDataFlow(step, saga, false, Date.now() - startTime);
                    return { success: false, error: errorMessage };
                }
            }
        }
        return { success: false, error: 'Max retries exceeded' };
    }
    async compensateTransaction(saga, lastCompletedStepIndex) {
        logger_1.logger.info(`Starting compensation for saga: ${saga.id}`, { lastCompletedStepIndex });
        saga.status = 'compensating';
        for (let i = lastCompletedStepIndex; i >= 0; i--) {
            const step = saga.steps[i];
            if (step.status === 'completed' && step.compensationAction) {
                try {
                    await this.executeCompensation(step);
                    step.status = 'compensated';
                }
                catch (error) {
                    logger_1.logger.error(`Compensation failed for step: ${step.id}`, error);
                }
            }
        }
        logger_1.logger.info(`Compensation completed for saga: ${saga.id}`);
    }
    async simulateStepExecution(step) {
        await this.sleep(Math.random() * 1000 + 500);
        if (Math.random() < 0.1) {
            throw new Error(`Simulated failure for step: ${step.action}`);
        }
        return {
            stepId: step.id,
            action: step.action,
            epic: step.epic,
            timestamp: new Date(),
            data: { processed: true }
        };
    }
    async executeCompensation(step) {
        logger_1.logger.info(`Executing compensation for step: ${step.id}`, { compensationAction: step.compensationAction });
        await this.sleep(Math.random() * 500 + 200);
    }
    async trackDataFlow(step, saga, success, duration) {
        const trace = {
            id: this.generateTraceId(),
            sourceEpic: saga.metadata.sourceEpic || 'unknown',
            targetEpic: step.epic,
            operationType: step.action,
            dataSize: JSON.stringify(step.result || {}).length,
            duration,
            status: success ? 'success' : 'failed',
            timestamp: new Date(),
            metadata: {
                sagaId: saga.id,
                stepId: step.id,
                retries: step.retries
            }
        };
        this.dataFlowTraces.push(trace);
        if (this.dataFlowTraces.length > 1000) {
            this.dataFlowTraces = this.dataFlowTraces.slice(-1000);
        }
    }
    async cacheSagaResult(saga, results) {
        try {
            const key = `saga:result:${saga.id}`;
            const cacheData = {
                sagaId: saga.id,
                type: saga.type,
                results,
                completedAt: new Date(),
                ttl: 3600
            };
            await redis_service_1.RedisService.setex(key, 3600, JSON.stringify(cacheData));
        }
        catch (error) {
            logger_1.logger.warn('Failed to cache saga result', error);
        }
    }
    async updateEpicMetrics() {
        const currentTime = new Date();
        const epicStats = new Map();
        const recentTraces = this.dataFlowTraces.filter(trace => currentTime.getTime() - trace.timestamp.getTime() < 300000);
        recentTraces.forEach(trace => {
            const stats = epicStats.get(trace.targetEpic) || { total: 0, successful: 0, failed: 0, totalTime: 0 };
            stats.total++;
            stats.totalTime += trace.duration;
            if (trace.status === 'success') {
                stats.successful++;
            }
            else {
                stats.failed++;
            }
            epicStats.set(trace.targetEpic, stats);
        });
        epicStats.forEach((stats, epic) => {
            const metrics = {
                epic,
                totalTransactions: stats.total,
                successfulTransactions: stats.successful,
                failedTransactions: stats.failed,
                averageResponseTime: stats.total > 0 ? stats.totalTime / stats.total : 0,
                errorRate: stats.total > 0 ? stats.failed / stats.total : 0,
                lastUpdate: currentTime
            };
            this.epicMetrics.set(epic, metrics);
        });
    }
    async analyzeDataFlowPerformance() {
        const flows = new Map();
        let totalDuration = 0;
        let successCount = 0;
        let totalCount = 0;
        const currentTime = new Date();
        const recentTraces = this.dataFlowTraces.filter(trace => currentTime.getTime() - trace.timestamp.getTime() < 600000);
        recentTraces.forEach(trace => {
            const flowKey = `${trace.sourceEpic}->${trace.targetEpic}`;
            const flowStats = flows.get(flowKey) || { count: 0, totalDuration: 0, successCount: 0, errorCount: 0 };
            flowStats.count++;
            flowStats.totalDuration += trace.duration;
            totalDuration += trace.duration;
            totalCount++;
            if (trace.status === 'success') {
                flowStats.successCount++;
                successCount++;
            }
            else {
                flowStats.errorCount++;
            }
            flows.set(flowKey, flowStats);
        });
        const consistencyCheck = totalCount > 0 ? successCount / totalCount >= 0.95 : true;
        return {
            flows,
            totalDuration,
            consistencyCheck
        };
    }
    async generatePerformanceReport() {
        const timestamp = new Date();
        const epicMetrics = Array.from(this.epicMetrics.values());
        const dataFlowMetrics = await this.analyzeDataFlowPerformance();
        const activeSagas = this.activeSagas.size;
        const recommendations = [];
        const poorPerformingEpics = epicMetrics.filter(metric => metric.averageResponseTime > 5000);
        const highErrorEpics = epicMetrics.filter(metric => metric.errorRate > 0.05);
        if (poorPerformingEpics.length > 0) {
            recommendations.push(`Poor performing epics detected: ${poorPerformingEpics.map(e => e.epic).join(', ')}. Consider optimization.`);
        }
        if (highErrorEpics.length > 0) {
            recommendations.push(`High error rates in epics: ${highErrorEpics.map(e => e.epic).join(', ')}. Review error handling.`);
        }
        const dataFlowStats = await this.analyzeDataFlowPerformance();
        const averageFlowTime = dataFlowStats.totalDuration / Math.max(dataFlowStats.flows.size, 1);
        if (averageFlowTime > 3000) {
            recommendations.push(`High average data flow time (${averageFlowTime}ms). Consider caching or async processing.`);
        }
        const consistencyRate = dataFlowStats.consistencyCheck ? 100 : 85;
        if (consistencyRate < 95) {
            recommendations.push(`Data consistency rate below 95% (${consistencyRate}%). Review transaction boundaries.`);
        }
        if (activeSagas > 50) {
            recommendations.push(`High number of active saga transactions (${activeSagas}). Monitor for potential bottlenecks.`);
        }
        let systemHealth = 'healthy';
        if (poorPerformingEpics.length > 2 || highErrorEpics.length > 1 || !dataFlowStats.consistencyCheck) {
            systemHealth = 'critical';
        }
        else if (poorPerformingEpics.length > 0 || highErrorEpics.length > 0 || activeSagas > 30) {
            systemHealth = 'degraded';
        }
        const report = {
            timestamp,
            epicMetrics,
            dataFlowMetrics,
            recommendations,
            activeSagas,
            systemHealth
        };
        this.performanceHistory.push(report);
        if (this.performanceHistory.length > 100) {
            this.performanceHistory = this.performanceHistory.slice(-100);
        }
        if (systemHealth === 'critical') {
            logger_1.logger.error('Critical system health detected', { report });
        }
        else if (systemHealth === 'degraded') {
            logger_1.logger.warn('System health degraded', { report });
        }
        return report;
    }
    async getPerformanceMetrics() {
        const dataFlowMetrics = await this.analyzeDataFlowPerformance();
        return {
            epicMetrics: Array.from(this.epicMetrics.values()),
            dataFlowMetrics,
            activeSagas: this.activeSagas.size,
            recentReports: this.performanceHistory.slice(-10)
        };
    }
    isCircuitOpen(epic) {
        const circuitBreaker = this.circuitBreakers.get(epic);
        if (!circuitBreaker)
            return false;
        if (circuitBreaker.isOpen) {
            const now = new Date().getTime();
            if (now - circuitBreaker.lastFailureTime.getTime() > circuitBreaker.timeout) {
                circuitBreaker.isOpen = false;
                circuitBreaker.failureCount = 0;
                circuitBreaker.successCount = 0;
                return false;
            }
            return true;
        }
        return false;
    }
    recordCircuitBreakerSuccess(epic) {
        const circuitBreaker = this.circuitBreakers.get(epic);
        if (circuitBreaker) {
            circuitBreaker.successCount++;
            if (circuitBreaker.isOpen && circuitBreaker.successCount >= 3) {
                circuitBreaker.isOpen = false;
                circuitBreaker.failureCount = 0;
                logger_1.logger.info(`Circuit breaker closed for epic: ${epic}`);
            }
        }
    }
    recordCircuitBreakerFailure(epic) {
        const circuitBreaker = this.circuitBreakers.get(epic);
        if (circuitBreaker) {
            circuitBreaker.failureCount++;
            circuitBreaker.lastFailureTime = new Date();
            if (circuitBreaker.failureCount >= 5) {
                circuitBreaker.isOpen = true;
                circuitBreaker.successCount = 0;
                logger_1.logger.warn(`Circuit breaker opened for epic: ${epic}`);
            }
        }
    }
    generateSagaId(type) {
        return `saga-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    generateTraceId() {
        return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    calculateRetryDelay(attempt, config) {
        let delay = Math.min(config.baseDelay * Math.pow(config.backoffMultiplier, attempt), config.maxDelay);
        if (config.jitter) {
            delay *= (0.5 + Math.random() * 0.5);
        }
        return Math.floor(delay);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    cleanupOldTraces() {
        const cutoffTime = new Date().getTime() - 3600000;
        this.dataFlowTraces = this.dataFlowTraces.filter(trace => trace.timestamp.getTime() > cutoffTime);
    }
    async getSagaStatus(sagaId) {
        return this.activeSagas.get(sagaId) || null;
    }
    async getActiveSagas() {
        return Array.from(this.activeSagas.values());
    }
    async getEpicHealth(epic) {
        const metrics = this.epicMetrics.get(epic) || null;
        const circuitBreakerStatus = this.circuitBreakers.get(epic) || null;
        const isHealthy = !circuitBreakerStatus?.isOpen &&
            (metrics?.errorRate || 0) < 0.05 &&
            (metrics?.averageResponseTime || 0) < 5000;
        return {
            metrics,
            circuitBreakerStatus,
            isHealthy
        };
    }
    async optimizeRetryConfiguration(epic, config) {
        const currentConfig = this.retryConfigs.get(epic);
        if (currentConfig) {
            this.retryConfigs.set(epic, { ...currentConfig, ...config });
            logger_1.logger.info(`Updated retry configuration for epic: ${epic}`, config);
        }
    }
}
exports.IntegrationPerformanceService = IntegrationPerformanceService;
exports.default = IntegrationPerformanceService.getInstance();
//# sourceMappingURL=integration-performance.service.js.map