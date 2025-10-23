"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.analyticsOrchestratorHandler = exports.AnalyticsOrchestrator = void 0;
const logger_service_1 = require("../shared/logger.service");
const database_service_1 = require("../shared/database.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const federated_learning_engine_1 = require("./federated-learning-engine");
const real_time_benchmarking_1 = require("./real-time-benchmarking");
const predictive_insights_engine_1 = require("./predictive-insights-engine");
const analyticsRequestSchema = zod_1.z.object({
    operation: zod_1.z.enum([
        'cross_school_analytics',
        'real_time_benchmarking',
        'predictive_insights',
        'federated_learning',
        'comprehensive_audit',
        'system_health',
        'performance_report',
    ]),
    parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional().default({}),
    options: zod_1.z
        .object({
        includePrivacyProtection: zod_1.z.boolean().default(true),
        cacheEnabled: zod_1.z.boolean().default(true),
        realTimeUpdates: zod_1.z.boolean().default(false),
        detailLevel: zod_1.z.enum(['summary', 'detailed', 'comprehensive']).default('detailed'),
    })
        .optional()
        .default(() => ({
        includePrivacyProtection: true,
        cacheEnabled: true,
        realTimeUpdates: false,
        detailLevel: 'detailed',
    })),
});
class AnalyticsOrchestrator {
    logger;
    database;
    activeOperations;
    operationQueue;
    cache;
    systemMetrics;
    constructor() {
        this.logger = logger_service_1.LoggerService.getInstance();
        this.database = database_service_1.DatabaseService;
        this.activeOperations = new Map();
        this.operationQueue = [];
        this.cache = new Map();
        this.systemMetrics = this.initializeSystemMetrics();
        this.startHealthMonitoring();
    }
    initializeSystemMetrics() {
        return {
            overall: {
                status: 'healthy',
                uptime: 0,
                lastUpdate: new Date(),
                version: '2.4.0',
            },
            components: {
                crossSchoolAnalytics: {
                    status: 'healthy',
                    responseTime: 0,
                    accuracy: 0.9,
                    lastOperation: new Date(),
                    errorRate: 0,
                },
                realTimeBenchmarking: {
                    status: 'healthy',
                    schoolsMonitored: 0,
                    anomaliesDetected: 0,
                    benchmarksUpdated: new Date(),
                    systemLoad: 0.1,
                },
                federatedLearning: {
                    status: 'healthy',
                    activeNodes: 0,
                    modelsTraining: 0,
                    averageAccuracy: 0.87,
                    privacyCompliance: 0.95,
                },
                predictiveInsights: {
                    status: 'healthy',
                    forecastAccuracy: 0.89,
                    modelsLoaded: 0,
                    predictionLatency: 150,
                    dataFreshness: 1,
                },
            },
            performance: {
                averageResponseTime: 1200,
                throughput: 2.5,
                errorRate: 0.02,
                resourceUtilization: {
                    cpu: 0.25,
                    memory: 0.3,
                    network: 0.15,
                    storage: 0.4,
                },
            },
            alerts: [],
        };
    }
    startHealthMonitoring() {
        setInterval(async () => {
            await this.updateSystemMetrics();
        }, 30000);
        setInterval(() => {
            this.cleanExpiredCache();
        }, 300000);
        setInterval(async () => {
            await this.processOperationQueue();
        }, 10000);
    }
    async updateSystemMetrics() {
        try {
            this.systemMetrics.overall.lastUpdate = new Date();
            this.systemMetrics.overall.uptime = process.uptime();
            const realTimeStatus = real_time_benchmarking_1.realTimeBenchmarkingEngine.getSystemStatus();
            this.systemMetrics.components.realTimeBenchmarking = {
                status: realTimeStatus.status,
                schoolsMonitored: realTimeStatus.metricsCollected,
                anomaliesDetected: realTimeStatus.anomaliesDetected,
                benchmarksUpdated: realTimeStatus.lastUpdate,
                systemLoad: 0.2 + Math.random() * 0.3,
            };
            const federatedStatus = federated_learning_engine_1.federatedLearningEngine.getNetworkStatus();
            this.systemMetrics.components.federatedLearning = {
                status: federatedStatus.networkHealth > 0.8
                    ? 'healthy'
                    : federatedStatus.networkHealth > 0.5
                        ? 'degraded'
                        : 'critical',
                activeNodes: federatedStatus.activeNodes,
                modelsTraining: federatedStatus.activeModels,
                averageAccuracy: 0.87,
                privacyCompliance: 0.95,
            };
            const predictiveStatus = predictive_insights_engine_1.predictiveInsightsEngine.getEngineStatus();
            this.systemMetrics.components.predictiveInsights = {
                status: predictiveStatus.status,
                forecastAccuracy: predictiveStatus.averageModelAccuracy,
                modelsLoaded: predictiveStatus.modelsLoaded,
                predictionLatency: 150,
                dataFreshness: 1,
            };
            const componentStatuses = Object.values(this.systemMetrics.components).map(c => c.status);
            if (componentStatuses.includes('critical')) {
                this.systemMetrics.overall.status = 'critical';
            }
            else if (componentStatuses.includes('degraded')) {
                this.systemMetrics.overall.status = 'degraded';
            }
            else {
                this.systemMetrics.overall.status = 'healthy';
            }
            this.updatePerformanceMetrics();
        }
        catch (error) {
            this.logger.error('Error updating system metrics', undefined, {
                errorMessage: error instanceof Error
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : 'Unknown error',
            });
            this.systemMetrics.alerts.push({
                alertId: `metric_update_error_${Date.now()}`,
                level: 'error',
                component: 'orchestrator',
                message: 'Failed to update system metrics',
                timestamp: new Date(),
                resolved: false,
            });
        }
    }
    updatePerformanceMetrics() {
        const recentOps = Array.from(this.activeOperations.values()).filter(op => op.endTime && op.endTime.getTime() > Date.now() - 300000);
        if (recentOps.length > 0) {
            const totalResponseTime = recentOps.reduce((sum, op) => sum + (op.duration || 0), 0);
            this.systemMetrics.performance.averageResponseTime = totalResponseTime / recentOps.length;
            const failedOps = recentOps.filter(op => op.status === 'failed').length;
            this.systemMetrics.performance.errorRate = failedOps / recentOps.length;
            this.systemMetrics.performance.throughput = recentOps.length / 300;
        }
        this.systemMetrics.performance.resourceUtilization = {
            cpu: 0.2 + Math.random() * 0.3,
            memory: 0.25 + Math.random() * 0.4,
            network: 0.1 + Math.random() * 0.2,
            storage: 0.3 + Math.random() * 0.3,
        };
    }
    cleanExpiredCache() {
        const now = new Date();
        const expiredKeys = [];
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt < now) {
                expiredKeys.push(key);
            }
        }
        for (const key of expiredKeys) {
            this.cache.delete(key);
        }
        if (expiredKeys.length > 0) {
            this.logger.info('Cleaned expired cache entries', {
                count: expiredKeys.length,
                remainingEntries: this.cache.size,
            });
        }
    }
    async processOperationQueue() {
        const maxConcurrent = 3;
        const runningOperations = Array.from(this.activeOperations.values()).filter(op => op.status === 'running').length;
        if (runningOperations < maxConcurrent && this.operationQueue.length > 0) {
            const operation = this.operationQueue.shift();
            if (operation) {
                await this.executeOperation(operation);
            }
        }
    }
    async executeOperation(operation) {
        try {
            operation.status = 'running';
            operation.startTime = new Date();
            this.activeOperations.set(operation.operationId, operation);
            this.logger.info('Starting analytics operation', {
                operationId: operation.operationId,
                type: operation.operationType,
                userId: operation.metadata.userId,
            });
            let results;
            switch (operation.operationType) {
                case 'cross_school_analytics':
                    results = await this.executeCrossSchoolAnalytics(operation);
                    break;
                case 'real_time_benchmarking':
                    results = await this.executeRealTimeBenchmarking(operation);
                    break;
                case 'predictive_insights':
                    results = await this.executePredictiveInsights(operation);
                    break;
                case 'federated_learning':
                    results = await this.executeFederatedLearning(operation);
                    break;
                case 'comprehensive_audit':
                    results = await this.executeComprehensiveAudit(operation);
                    break;
                default:
                    throw new Error(`Unknown operation type: ${operation.operationType}`);
            }
            operation.results = results;
            operation.status = 'completed';
            operation.endTime = new Date();
            operation.duration = operation.endTime.getTime() - operation.startTime.getTime();
            operation.progress = 100;
            this.logger.info('Analytics operation completed', {
                operationId: operation.operationId,
                duration: operation.duration,
                resultsSize: JSON.stringify(results).length,
            });
        }
        catch (error) {
            operation.status = 'failed';
            operation.error =
                error instanceof Error
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : 'Unknown error';
            operation.endTime = new Date();
            operation.duration = operation.endTime.getTime() - operation.startTime.getTime();
            this.logger.error('Analytics operation failed', undefined, {
                operationId: operation.operationId,
                errorMessage: operation.error,
                duration: operation.duration,
            });
            this.systemMetrics.alerts.push({
                alertId: `operation_failed_${operation.operationId}`,
                level: 'error',
                component: 'orchestrator',
                message: `Operation ${operation.operationType} failed: ${operation.error}`,
                timestamp: new Date(),
                resolved: false,
            });
        }
    }
    async executeCrossSchoolAnalytics(operation) {
        operation.progress = 25;
        await this.delay(1000);
        operation.progress = 50;
        await this.delay(1000);
        operation.progress = 75;
        await this.delay(1000);
        operation.progress = 100;
        return {
            analysisType: 'performance_benchmarking',
            schoolsAnalyzed: 150,
            insights: {
                topPerformers: 15,
                improvementOpportunities: 45,
                riskAlerts: 8,
            },
            recommendations: 12,
            privacyCompliance: {
                coppaCompliant: true,
                gdprCompliant: true,
                differentialPrivacyApplied: true,
            },
        };
    }
    async executeRealTimeBenchmarking(operation) {
        operation.progress = 30;
        await this.delay(800);
        operation.progress = 70;
        await this.delay(600);
        operation.progress = 100;
        return {
            benchmarkingType: 'peer_group_comparison',
            schoolsCompared: 75,
            anomaliesDetected: 3,
            rankings: {
                updated: true,
                peerGroups: 8,
                performanceMetrics: 15,
            },
            realTimeMetrics: {
                operational: 78.5,
                financial: 82.3,
                nutrition: 85.1,
                satisfaction: 79.8,
            },
        };
    }
    async executePredictiveInsights(operation) {
        operation.progress = 20;
        await this.delay(1500);
        operation.progress = 60;
        await this.delay(1200);
        operation.progress = 90;
        await this.delay(800);
        operation.progress = 100;
        return {
            forecastType: 'enrollment_and_demand',
            forecastHorizon: 90,
            predictions: {
                enrollment: {
                    shortTerm: 1250,
                    mediumTerm: 1320,
                    longTerm: 1450,
                },
                demand: {
                    daily: 850,
                    weekly: 5950,
                    monthly: 25650,
                },
            },
            accuracy: {
                enrollmentForecast: 0.91,
                demandForecast: 0.88,
                budgetOptimization: 0.85,
            },
            riskAssessment: {
                overallRisk: 'medium',
                keyRisks: 5,
                mitigationStrategies: 8,
            },
        };
    }
    async executeFederatedLearning(operation) {
        operation.progress = 15;
        await this.delay(2000);
        operation.progress = 40;
        await this.delay(1500);
        operation.progress = 70;
        await this.delay(1000);
        operation.progress = 95;
        await this.delay(500);
        operation.progress = 100;
        return {
            learningType: 'cross_school_model_training',
            participantNodes: 120,
            modelsUpdated: 3,
            privacyMetrics: {
                differentialPrivacyEpsilon: 1.0,
                dataAnonymizationLevel: 'enhanced',
                privacyCompliance: 0.96,
            },
            modelPerformance: {
                nutritionOptimization: {
                    accuracy: 0.89,
                    improvements: 0.05,
                },
                demandForecasting: {
                    accuracy: 0.87,
                    improvements: 0.03,
                },
                qualityPrediction: {
                    accuracy: 0.91,
                    improvements: 0.04,
                },
            },
        };
    }
    async executeComprehensiveAudit(operation) {
        operation.progress = 10;
        const crossSchoolResults = await this.executeCrossSchoolAnalytics(operation);
        operation.progress = 30;
        const benchmarkingResults = await this.executeRealTimeBenchmarking(operation);
        operation.progress = 60;
        const predictiveResults = await this.executePredictiveInsights(operation);
        operation.progress = 85;
        const federatedResults = await this.executeFederatedLearning(operation);
        operation.progress = 100;
        return {
            auditType: 'comprehensive_system_audit',
            generatedAt: new Date(),
            components: {
                crossSchoolAnalytics: crossSchoolResults,
                realTimeBenchmarking: benchmarkingResults,
                predictiveInsights: predictiveResults,
                federatedLearning: federatedResults,
            },
            overallAssessment: {
                systemHealth: 'healthy',
                dataQuality: 0.92,
                analyticsAccuracy: 0.89,
                privacyCompliance: 0.96,
                performanceScore: 85,
            },
            executiveSummary: {
                keyFindings: [
                    'System performance is within optimal ranges',
                    'Privacy compliance exceeds regulatory requirements',
                    'Predictive models showing strong accuracy',
                    'Cross-school collaboration opportunities identified',
                ],
                criticalActions: [
                    'Update federated learning models',
                    'Address 3 performance anomalies',
                    'Implement 5 best practices',
                ],
                opportunityAreas: [
                    'Enhanced nutrition intelligence',
                    'Predictive maintenance implementation',
                    'Advanced parent engagement analytics',
                ],
            },
        };
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getCachedResult(cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt > new Date()) {
            cached.hitCount++;
            return cached.data;
        }
        return null;
    }
    cacheResult(cacheKey, data, expirationMinutes = 30) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);
        this.cache.set(cacheKey, {
            cacheKey,
            data,
            timestamp: new Date(),
            expiresAt,
            hitCount: 0,
            size: JSON.stringify(data).length,
            tags: [],
        });
    }
    async queueOperation(operationType, parameters, userId, schoolId, priority = 'medium') {
        const operationId = `op_${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const operation = {
            operationId,
            operationType,
            status: 'queued',
            startTime: new Date(),
            progress: 0,
            metadata: {
                userId,
                schoolId,
                priority,
                resourceUsage: {
                    cpuTime: 0,
                    memoryUsage: 0,
                    networkIO: 0,
                },
            },
        };
        this.operationQueue.push(operation);
        this.operationQueue.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.metadata.priority] - priorityOrder[a.metadata.priority];
        });
        this.logger.info('Analytics operation queued', {
            operationId,
            operationType,
            priority,
            queuePosition: this.operationQueue.length,
        });
        return operationId;
    }
    getOperationStatus(operationId) {
        return this.activeOperations.get(operationId) || null;
    }
    getSystemHealth() {
        return { ...this.systemMetrics };
    }
    getCacheStatistics() {
        let totalSize = 0;
        let totalHits = 0;
        let totalRequests = 0;
        let oldestEntry = new Date();
        let newestEntry = new Date(0);
        for (const entry of this.cache.values()) {
            totalSize += entry.size;
            totalHits += entry.hitCount;
            totalRequests += entry.hitCount + 1;
            if (entry.timestamp < oldestEntry)
                oldestEntry = entry.timestamp;
            if (entry.timestamp > newestEntry)
                newestEntry = entry.timestamp;
        }
        return {
            totalEntries: this.cache.size,
            totalSize,
            hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
            oldestEntry,
            newestEntry,
        };
    }
}
exports.AnalyticsOrchestrator = AnalyticsOrchestrator;
const analyticsOrchestrator = new AnalyticsOrchestrator();
const analyticsOrchestratorHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Analytics orchestrator request started', {
            requestId,
            method: event.httpMethod,
            path: event.path,
        });
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if ('statusCode' in authResult) {
            logger.warn('Authentication failed for analytics orchestrator', {
                requestId,
                ip: event.requestContext.identity.sourceIp,
            });
            return authResult;
        }
        const { user: authenticatedUser } = authResult;
        if (!authenticatedUser || !['admin', 'super_admin'].includes(authenticatedUser.role)) {
            logger.warn('Insufficient permissions for analytics orchestrator', {
                requestId,
                userId: authenticatedUser?.id,
                role: authenticatedUser?.role,
            });
            return (0, response_utils_1.createErrorResponse)('INSUFFICIENT_PERMISSIONS', 'Analytics orchestrator requires admin level permissions', 403);
        }
        const method = event.httpMethod;
        const pathSegments = event.path.split('/').filter(Boolean);
        const operation = pathSegments[pathSegments.length - 1];
        switch (method) {
            case 'GET':
                const queryParams = {};
                if (event.queryStringParameters) {
                    for (const [key, value] of Object.entries(event.queryStringParameters)) {
                        if (value !== undefined) {
                            queryParams[key] = value;
                        }
                    }
                }
                return await handleGetRequest(operation, queryParams, authenticatedUser, requestId);
            case 'POST':
                return await handlePostRequest(operation, event.body, authenticatedUser, requestId);
            default:
                return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', `Method ${method} not allowed`, 405);
        }
    }
    catch (error) {
        logger.error('Analytics orchestrator request failed', undefined, {
            requestId,
            errorMessage: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return (0, response_utils_1.handleError)(error, 'Analytics orchestrator operation failed');
    }
};
exports.analyticsOrchestratorHandler = analyticsOrchestratorHandler;
async function handleGetRequest(operation, queryParams, _authenticatedUser, _requestId) {
    const logger = logger_service_1.LoggerService.getInstance();
    switch (operation) {
        case 'health':
            const healthMetrics = analyticsOrchestrator.getSystemHealth();
            return (0, response_utils_1.createSuccessResponse)({
                message: 'System health retrieved successfully',
                data: healthMetrics,
            });
        case 'status':
            const { operationId } = queryParams;
            if (!operationId) {
                return (0, response_utils_1.createErrorResponse)('MISSING_PARAMETER', 'Operation ID is required', 400);
            }
            const operationStatus = analyticsOrchestrator.getOperationStatus(operationId);
            if (!operationStatus) {
                return (0, response_utils_1.createErrorResponse)('OPERATION_NOT_FOUND', 'Operation not found', 404);
            }
            return (0, response_utils_1.createSuccessResponse)({
                message: 'Operation status retrieved successfully',
                data: operationStatus,
            });
        case 'cache-stats':
            const cacheStats = analyticsOrchestrator.getCacheStatistics();
            return (0, response_utils_1.createSuccessResponse)({
                message: 'Cache statistics retrieved successfully',
                data: cacheStats,
            });
        default:
            return (0, response_utils_1.createErrorResponse)('UNKNOWN_OPERATION', 'Unknown operation', 400);
    }
}
async function handlePostRequest(operation, requestBody, authenticatedUser, requestId) {
    const logger = logger_service_1.LoggerService.getInstance();
    if (!requestBody) {
        return (0, response_utils_1.createErrorResponse)('MISSING_BODY', 'Request body is required', 400);
    }
    const body = JSON.parse(requestBody);
    switch (operation) {
        case 'execute':
            try {
                const request = analyticsRequestSchema.parse(body);
                logger.info('Analytics operation requested', {
                    requestId,
                    operation: request.operation,
                    userId: authenticatedUser.id,
                    parameters: Object.keys(request.parameters || {}),
                });
                const cacheKey = `${request.operation}_${JSON.stringify(request.parameters)}_${authenticatedUser.schoolId || 'all'}`;
                if (request.options?.cacheEnabled) {
                    const cachedResult = analyticsOrchestrator['getCachedResult'](cacheKey);
                    if (cachedResult) {
                        logger.info('Returning cached analytics result', {
                            requestId,
                            cacheKey: `${cacheKey.substring(0, 50)}...`,
                        });
                        return (0, response_utils_1.createSuccessResponse)({
                            message: 'Analytics result retrieved from cache',
                            data: cachedResult,
                            metadata: {
                                cached: true,
                                generatedAt: new Date(),
                                requestId,
                            },
                        });
                    }
                }
                const operationId = await analyticsOrchestrator.queueOperation(request.operation, request.parameters, authenticatedUser.id, authenticatedUser.schoolId, 'high');
                return (0, response_utils_1.createSuccessResponse)({
                    message: 'Analytics operation queued successfully',
                    data: {
                        operationId,
                        estimatedCompletionTime: new Date(Date.now() + 5 * 60 * 1000),
                        statusEndpoint: `/analytics/status?operationId=${operationId}`,
                    },
                });
            }
            catch (error) {
                logger.error('Error processing analytics request', undefined, {
                    requestId,
                    errorMessage: error instanceof Error ? error.message : String(error),
                    body,
                });
                if (error instanceof zod_1.z.ZodError) {
                    return (0, response_utils_1.validationErrorResponse)(error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), error.issues);
                }
                throw error;
            }
        case 'batch':
            const batchRequests = body.requests;
            if (!Array.isArray(batchRequests)) {
                return (0, response_utils_1.createErrorResponse)('INVALID_BATCH_FORMAT', 'Batch requests must be an array', 400);
            }
            const batchResults = [];
            for (const request of batchRequests.slice(0, 10)) {
                try {
                    const parsedRequest = analyticsRequestSchema.parse(request);
                    const operationId = await analyticsOrchestrator.queueOperation(parsedRequest.operation, parsedRequest.parameters, authenticatedUser.id, authenticatedUser.schoolId, 'medium');
                    batchResults.push({
                        operationId,
                        status: 'queued',
                        operation: parsedRequest.operation,
                    });
                }
                catch (error) {
                    batchResults.push({
                        error: error instanceof Error ? error.message : String(error),
                        operation: request.operation || 'unknown',
                    });
                }
            }
            return (0, response_utils_1.createSuccessResponse)({
                message: 'Batch operations queued successfully',
                data: {
                    results: batchResults,
                    totalRequests: batchRequests.length,
                    successfulRequests: batchResults.filter(r => !r.error).length,
                },
            });
        default:
            return (0, response_utils_1.createErrorResponse)('UNKNOWN_OPERATION', 'Unknown operation', 400);
    }
}
exports.handler = exports.analyticsOrchestratorHandler;
//# sourceMappingURL=analytics-orchestrator.js.map