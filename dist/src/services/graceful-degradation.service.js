"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GracefulDegradationService = exports.DegradationStrategy = exports.ServiceStatus = void 0;
const logger_1 = require("@/utils/logger");
const circuit_breaker_service_1 = require("@/services/circuit-breaker.service");
const redis_service_1 = require("@/services/redis.service");
const axios_1 = __importDefault(require("axios"));
var ServiceStatus;
(function (ServiceStatus) {
    ServiceStatus["HEALTHY"] = "healthy";
    ServiceStatus["DEGRADED"] = "degraded";
    ServiceStatus["UNAVAILABLE"] = "unavailable";
    ServiceStatus["RECOVERING"] = "recovering";
})(ServiceStatus || (exports.ServiceStatus = ServiceStatus = {}));
var DegradationStrategy;
(function (DegradationStrategy) {
    DegradationStrategy["FAIL_FAST"] = "fail_fast";
    DegradationStrategy["CACHED_RESPONSE"] = "cached_response";
    DegradationStrategy["SIMPLIFIED_RESPONSE"] = "simplified_response";
    DegradationStrategy["FALLBACK_SERVICE"] = "fallback_service";
    DegradationStrategy["OFFLINE_MODE"] = "offline_mode";
    DegradationStrategy["RETRY_WITH_BACKOFF"] = "retry_with_backoff";
})(DegradationStrategy || (exports.DegradationStrategy = DegradationStrategy = {}));
class GracefulDegradationService {
    serviceHealthMap = new Map();
    degradationConfigs = new Map();
    fallbackCache = new Map();
    healthCheckIntervals = new Map();
    redis;
    isInitialized = false;
    degradationMetrics;
    constructor() {
        this.redis = redis_service_1.RedisService;
        this.degradationMetrics = {
            totalDegradations: 0,
            successfulFallbacks: 0,
            failedOperations: 0,
            averageRecoveryTime: 0,
            mostFailedService: '',
            degradationHistory: []
        };
    }
    async initialize(configs) {
        if (this.isInitialized) {
            logger_1.logger.warn('Graceful degradation already initialized');
            return;
        }
        for (const config of configs) {
            this.degradationConfigs.set(config.service, config);
            this.serviceHealthMap.set(config.service, {
                serviceName: config.service,
                status: ServiceStatus.HEALTHY,
                lastCheck: new Date(),
                responseTime: 0,
                errorCount: 0,
                consecutiveFailures: 0,
                uptime: 100
            });
            this.startHealthMonitoring(config.service);
        }
        this.isInitialized = true;
        logger_1.logger.info('Graceful degradation initialized', {
            serviceCount: configs.length,
            services: configs.map(c => c.service)
        });
    }
    async isServiceAvailable(serviceName) {
        const health = this.serviceHealthMap.get(serviceName);
        if (!health) {
            logger_1.logger.warn('Unknown service health check', { serviceName });
            return true;
        }
        return health.status !== ServiceStatus.UNAVAILABLE;
    }
    getServiceHealth(serviceName) {
        return this.serviceHealthMap.get(serviceName) || null;
    }
    async executeWithDegradation(serviceName, operation, fallbackOperations) {
        const health = this.serviceHealthMap.get(serviceName);
        const config = this.degradationConfigs.get(serviceName);
        if (!health || !config) {
            logger_1.logger.warn('Service not configured for degradation', { serviceName });
            return await operation();
        }
        if (health.status === ServiceStatus.HEALTHY) {
            try {
                const startTime = Date.now();
                const result = await operation();
                const responseTime = Date.now() - startTime;
                this.updateHealthMetrics(serviceName, true, responseTime);
                return result;
            }
            catch (error) {
                this.updateHealthMetrics(serviceName, false, 0);
                throw error;
            }
        }
        if (fallbackOperations && this.shouldUseFallback(serviceName)) {
            return await this.executeFallback(serviceName, fallbackOperations);
        }
        const error = new Error(`Service ${serviceName} is unavailable and no fallback provided`);
        this.degradationMetrics.failedOperations++;
        throw error;
    }
    async executeFallback(serviceName, fallbackOperations) {
        const sortedOperations = fallbackOperations.sort((a, b) => b.priority - a.priority);
        for (const fallback of sortedOperations) {
            try {
                if (fallback.cacheKey) {
                    const cached = await this.getCachedResult(fallback.cacheKey);
                    if (cached) {
                        logger_1.logger.info('Returning cached fallback result', { serviceName, cacheKey: fallback.cacheKey });
                        this.degradationMetrics.successfulFallbacks++;
                        return cached;
                    }
                }
                const result = await fallback.operation();
                if (fallback.cacheKey && fallback.cacheDuration) {
                    await this.cacheResult(fallback.cacheKey, result, fallback.cacheDuration);
                }
                logger_1.logger.info('Fallback operation successful', { serviceName });
                this.degradationMetrics.successfulFallbacks++;
                return result;
            }
            catch (error) {
                logger_1.logger.warn('Fallback operation failed', { serviceName, error: error.message });
                continue;
            }
        }
        throw new Error(`All fallback operations failed for service ${serviceName}`);
    }
    shouldUseFallback(serviceName) {
        const config = this.degradationConfigs.get(serviceName);
        const health = this.serviceHealthMap.get(serviceName);
        if (!config || !health)
            return false;
        switch (config.strategy) {
            case DegradationStrategy.FAIL_FAST:
                return false;
            case DegradationStrategy.CACHED_RESPONSE:
            case DegradationStrategy.SIMPLIFIED_RESPONSE:
            case DegradationStrategy.FALLBACK_SERVICE:
            case DegradationStrategy.OFFLINE_MODE:
                return health.status !== ServiceStatus.HEALTHY;
            case DegradationStrategy.RETRY_WITH_BACKOFF:
                return health.consecutiveFailures < config.retryCount;
            default:
                return true;
        }
    }
    startHealthMonitoring(serviceName) {
        const config = this.degradationConfigs.get(serviceName);
        if (!config)
            return;
        const interval = setInterval(async () => {
            await this.performHealthCheck(serviceName);
        }, config.healthCheckInterval);
        this.healthCheckIntervals.set(serviceName, interval);
    }
    async performHealthCheck(serviceName) {
        const config = this.degradationConfigs.get(serviceName);
        if (!config)
            return;
        try {
            let isHealthy = false;
            let responseTime = 0;
            const startTime = Date.now();
            switch (serviceName) {
                case 'database':
                    isHealthy = await this.checkDatabaseHealth();
                    break;
                case 'redis':
                    isHealthy = await this.checkRedisHealth();
                    break;
                case 'external-api':
                    isHealthy = await this.checkExternalApiHealth(config.fallbackEndpoint);
                    break;
                default: {
                    const circuitBreaker = circuit_breaker_service_1.CircuitBreakerRegistry.get(serviceName);
                    if (circuitBreaker) {
                        const stats = circuitBreaker.getStats();
                        isHealthy = !stats.isOpen;
                    }
                    else {
                        isHealthy = true;
                    }
                }
            }
            responseTime = Date.now() - startTime;
            this.updateHealthStatus(serviceName, isHealthy, responseTime);
        }
        catch (error) {
            logger_1.logger.error('Health check failed', { serviceName, error: error.message });
            this.updateHealthStatus(serviceName, false, 0);
        }
    }
    async checkDatabaseHealth() {
        try {
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async checkRedisHealth() {
        try {
            const pong = await this.redis.ping();
            return pong === 'PONG';
        }
        catch (error) {
            return false;
        }
    }
    async checkExternalApiHealth(endpoint) {
        if (!endpoint)
            return true;
        try {
            const response = await axios_1.default.get(endpoint, { timeout: 5000 });
            return response.status >= 200 && response.status < 300;
        }
        catch (error) {
            return false;
        }
    }
    updateHealthStatus(serviceName, isHealthy, responseTime) {
        const health = this.serviceHealthMap.get(serviceName);
        const config = this.degradationConfigs.get(serviceName);
        if (!health || !config)
            return;
        health.lastCheck = new Date();
        health.responseTime = responseTime;
        if (isHealthy) {
            health.consecutiveFailures = 0;
            if (health.status !== ServiceStatus.HEALTHY && health.consecutiveFailures === 0) {
                health.status = ServiceStatus.RECOVERING;
                if (health.consecutiveFailures <= -config.recoveryThreshold) {
                    health.status = ServiceStatus.HEALTHY;
                    logger_1.logger.info('Service recovered', { serviceName });
                }
            }
            else if (health.status === ServiceStatus.HEALTHY) {
            }
        }
        else {
            health.errorCount++;
            health.consecutiveFailures++;
            if (health.consecutiveFailures >= config.maxConsecutiveFailures) {
                if (health.status !== ServiceStatus.UNAVAILABLE) {
                    health.status = ServiceStatus.UNAVAILABLE;
                    health.degradationReason = `${health.consecutiveFailures} consecutive failures`;
                    this.recordDegradation(serviceName, health.degradationReason);
                    logger_1.logger.error('Service marked as unavailable', { serviceName, consecutiveFailures: health.consecutiveFailures });
                }
            }
            else if (health.consecutiveFailures >= Math.floor(config.maxConsecutiveFailures / 2)) {
                if (health.status !== ServiceStatus.DEGRADED) {
                    health.status = ServiceStatus.DEGRADED;
                    health.degradationReason = `${health.consecutiveFailures} recent failures`;
                    logger_1.logger.warn('Service marked as degraded', { serviceName, consecutiveFailures: health.consecutiveFailures });
                }
            }
        }
        const totalChecks = health.errorCount + (health.consecutiveFailures >= 0 ? 1 : Math.abs(health.consecutiveFailures));
        health.uptime = totalChecks > 0 ? ((totalChecks - health.errorCount) / totalChecks) * 100 : 100;
        this.serviceHealthMap.set(serviceName, health);
    }
    updateHealthMetrics(serviceName, success, responseTime) {
        const health = this.serviceHealthMap.get(serviceName);
        if (!health)
            return;
        if (success) {
            health.consecutiveFailures = Math.max(0, health.consecutiveFailures - 1);
            health.responseTime = responseTime;
        }
        else {
            health.errorCount++;
            health.consecutiveFailures++;
        }
        this.serviceHealthMap.set(serviceName, health);
    }
    recordDegradation(serviceName, reason) {
        this.degradationMetrics.totalDegradations++;
        this.degradationMetrics.degradationHistory.push({
            timestamp: new Date(),
            service: serviceName,
            reason,
            duration: 0
        });
        const serviceFailures = this.degradationMetrics.degradationHistory
            .filter(h => h.service === serviceName).length;
        if (!this.degradationMetrics.mostFailedService || serviceFailures >
            this.degradationMetrics.degradationHistory.filter(h => h.service === this.degradationMetrics.mostFailedService).length) {
            this.degradationMetrics.mostFailedService = serviceName;
        }
    }
    async getCachedResult(cacheKey) {
        try {
            const memCache = this.fallbackCache.get(cacheKey);
            if (memCache && Date.now() - memCache.timestamp.getTime() < 300000) {
                return memCache.data;
            }
            const redisResult = await this.redis.get(`fallback:${cacheKey}`);
            if (redisResult) {
                return JSON.parse(redisResult);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.warn('Failed to get cached result', { cacheKey, error: error.message });
            return null;
        }
    }
    async cacheResult(cacheKey, data, durationMs) {
        try {
            this.fallbackCache.set(cacheKey, {
                data,
                timestamp: new Date()
            });
            await this.redis.setex(`fallback:${cacheKey}`, Math.floor(durationMs / 1000), JSON.stringify(data));
        }
        catch (error) {
            logger_1.logger.warn('Failed to cache result', { cacheKey, error: error.message });
        }
    }
    getDegradationMetrics() {
        return { ...this.degradationMetrics };
    }
    getAllServiceHealth() {
        return Array.from(this.serviceHealthMap.values());
    }
    forceServiceStatus(serviceName, status, reason) {
        const health = this.serviceHealthMap.get(serviceName);
        if (health) {
            health.status = status;
            health.degradationReason = reason;
            logger_1.logger.warn('Service status manually changed', { serviceName, status, reason });
        }
    }
    static createDefaultConfig(serviceName, strategy = DegradationStrategy.CACHED_RESPONSE) {
        return {
            service: serviceName,
            strategy,
            healthCheckInterval: 30000,
            maxConsecutiveFailures: 3,
            recoveryThreshold: 2,
            cacheTimeout: 300000,
            retryCount: 3,
            retryDelay: 1000,
            circuitBreakerEnabled: true,
            priorityLevel: 'medium'
        };
    }
    static createCriticalServiceConfig(serviceName) {
        return {
            service: serviceName,
            strategy: DegradationStrategy.FALLBACK_SERVICE,
            healthCheckInterval: 10000,
            maxConsecutiveFailures: 2,
            recoveryThreshold: 3,
            cacheTimeout: 600000,
            retryCount: 5,
            retryDelay: 500,
            circuitBreakerEnabled: true,
            priorityLevel: 'critical'
        };
    }
    async executeDatabase(operation, fallbackData) {
        const fallbacks = [];
        if (fallbackData !== undefined) {
            fallbacks.push({
                operation: () => fallbackData,
                priority: 1
            });
        }
        return this.executeWithDegradation('database', operation, fallbacks);
    }
    async executeExternalApi(apiName, operation, cachedFallback, cacheKey) {
        const fallbacks = [];
        if (cachedFallback !== undefined) {
            fallbacks.push({
                operation: () => cachedFallback,
                cacheKey: cacheKey || `external-api-${apiName}`,
                cacheDuration: 300000,
                priority: 1
            });
        }
        return this.executeWithDegradation(`external-api-${apiName}`, operation, fallbacks);
    }
    async executeNotification(operation, fallbackNotification) {
        const fallbacks = [];
        if (fallbackNotification) {
            fallbacks.push({
                operation: fallbackNotification,
                priority: 1
            });
        }
        return this.executeWithDegradation('notification', operation, fallbacks);
    }
    async cleanup() {
        for (const [serviceName, interval] of this.healthCheckIntervals.entries()) {
            clearInterval(interval);
            logger_1.logger.info('Stopped health monitoring', { serviceName });
        }
        this.healthCheckIntervals.clear();
        this.serviceHealthMap.clear();
        this.degradationConfigs.clear();
        this.fallbackCache.clear();
        try {
            await this.redis.disconnect();
        }
        catch (error) {
            logger_1.logger.warn('Error disconnecting from Redis', { error });
        }
        this.isInitialized = false;
        logger_1.logger.info('Graceful degradation service cleaned up');
    }
    getSystemHealth() {
        const services = Array.from(this.serviceHealthMap.values());
        const healthyCount = services.filter(s => s.status === ServiceStatus.HEALTHY).length;
        const unavailableCount = services.filter(s => s.status === ServiceStatus.UNAVAILABLE).length;
        let overall = 'healthy';
        if (unavailableCount > 0) {
            overall = 'degraded';
        }
        if (unavailableCount > services.length / 2) {
            overall = 'unavailable';
        }
        return {
            overall,
            timestamp: new Date(),
            uptime: services.length > 0 ? services.reduce((avg, s) => avg + s.uptime, 0) / services.length : 100,
            services,
            summary: {
                healthy: healthyCount,
                unavailable: unavailableCount
            }
        };
    }
    configureFallback(serviceName, fallbackFn) {
        const config = this.degradationConfigs.get(serviceName);
        if (config) {
            config.fallbackOperations = config.fallbackOperations || [];
            logger_1.logger.info('Fallback configured', { serviceName });
        }
    }
    setServiceState(serviceName, status) {
        const health = this.serviceHealthMap.get(serviceName);
        if (health) {
            health.status = status;
            health.lastCheck = new Date();
            this.serviceHealthMap.set(serviceName, health);
            logger_1.logger.info('Service state updated', { serviceName, status });
        }
    }
    async executeRedis(operation) {
        return this.executeWithDegradation('redis', operation);
    }
}
exports.GracefulDegradationService = GracefulDegradationService;
exports.default = GracefulDegradationService;
//# sourceMappingURL=graceful-degradation.service.js.map