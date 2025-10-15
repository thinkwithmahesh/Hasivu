"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceInitializationManager = void 0;
const logger_1 = require("@/utils/logger");
const graceful_degradation_service_1 = require("@/services/graceful-degradation.service");
const health_monitor_service_1 = require("@/services/health-monitor.service");
const circuit_breaker_service_1 = require("@/services/circuit-breaker.service");
const database_service_1 = require("@/services/database.service");
const redis_service_1 = require("@/services/redis.service");
const auth_service_1 = require("@/services/auth.service");
const performance_service_1 = require("@/services/performance.service");
const cost_monitoring_service_1 = require("@/services/cost-monitoring.service");
const retry_service_1 = require("@/services/retry.service");
const business_metrics_dashboard_service_1 = require("@/services/business-metrics-dashboard.service");
const gracefulDegradationService = new graceful_degradation_service_1.GracefulDegradationService();
const healthMonitorService = new health_monitor_service_1.HealthMonitorService(health_monitor_service_1.HealthMonitorService.createDefaultConfig());
const DefaultDegradationConfigs = {
    DATABASE: graceful_degradation_service_1.GracefulDegradationService.createDefaultConfig('Database'),
    REDIS: graceful_degradation_service_1.GracefulDegradationService.createDefaultConfig('Redis'),
    AUTH: graceful_degradation_service_1.GracefulDegradationService.createDefaultConfig('Auth'),
    PERFORMANCE: graceful_degradation_service_1.GracefulDegradationService.createDefaultConfig('Performance'),
    DEFAULT: graceful_degradation_service_1.GracefulDegradationService.createDefaultConfig('Default')
};
const defaultServiceConfigs = {
    database: {
        name: 'Database',
        order: 1,
        required: true,
        timeout: 30000,
        retryEnabled: true,
        maxRetries: 3,
        retryDelay: 2000,
        healthCheckEnabled: true,
        healthCheckInterval: 30000,
        gracefulDegradationEnabled: true,
        circuitBreakerEnabled: true,
        circuitBreakerConfig: {
            threshold: 5,
            timeout: 10000,
            resetTimeout: 60000
        }
    },
    redis: {
        name: 'Redis',
        order: 2,
        required: false,
        timeout: 10000,
        retryEnabled: true,
        maxRetries: 2,
        retryDelay: 1000,
        healthCheckEnabled: true,
        healthCheckInterval: 15000,
        gracefulDegradationEnabled: true,
        circuitBreakerEnabled: true,
        circuitBreakerConfig: {
            threshold: 3,
            timeout: 5000,
            resetTimeout: 30000
        }
    },
    auth: {
        name: 'Auth',
        order: 3,
        required: true,
        timeout: 15000,
        retryEnabled: true,
        maxRetries: 2,
        retryDelay: 1500,
        healthCheckEnabled: true,
        healthCheckInterval: 20000,
        gracefulDegradationEnabled: true,
        dependencies: ['database'],
        circuitBreakerEnabled: false
    },
    performance: {
        name: 'Performance',
        order: 4,
        required: false,
        timeout: 5000,
        retryEnabled: false,
        maxRetries: 0,
        retryDelay: 0,
        healthCheckEnabled: true,
        healthCheckInterval: 60000,
        gracefulDegradationEnabled: true,
        circuitBreakerEnabled: false
    },
    costMonitoring: {
        name: 'Cost Monitoring',
        order: 5,
        required: false,
        timeout: 5000,
        retryEnabled: false,
        maxRetries: 0,
        retryDelay: 0,
        healthCheckEnabled: true,
        healthCheckInterval: 300000,
        gracefulDegradationEnabled: true,
        circuitBreakerEnabled: false
    },
    businessMetrics: {
        name: 'Business Metrics',
        order: 6,
        required: false,
        timeout: 8000,
        retryEnabled: true,
        maxRetries: 1,
        retryDelay: 2000,
        healthCheckEnabled: true,
        healthCheckInterval: 120000,
        gracefulDegradationEnabled: true,
        dependencies: ['database'],
        circuitBreakerEnabled: false
    }
};
class ServiceInitializationManager {
    static instance = null;
    serviceStatuses = new Map();
    retryService = new retry_service_1.RetryService();
    isInitialized = false;
    startupStart;
    constructor() {
        this.startupStart = Date.now();
        logger_1.logger.info('Service Initialization Manager created');
    }
    static getInstance() {
        if (!ServiceInitializationManager.instance) {
            ServiceInitializationManager.instance = new ServiceInitializationManager();
        }
        return ServiceInitializationManager.instance;
    }
    async initializeAllServices(customConfigs) {
        try {
            logger_1.logger.info('Starting service initialization sequence...');
            const configs = this.mergeConfigurations(customConfigs);
            const sortedServices = Object.entries(configs).sort(([, a], [, b]) => a.order - b.order);
            for (const [serviceName, config] of sortedServices) {
                await this.initializeService(serviceName, config);
            }
            await this.startHealthMonitoring();
            this.isInitialized = true;
            const totalDuration = Date.now() - this.startupStart;
            logger_1.logger.info('Service initialization completed successfully', {
                totalDuration,
                services: Array.from(this.serviceStatuses.keys()),
                readyServices: this.getReadyServices().length,
                failedServices: this.getFailedServices().length
            });
        }
        catch (error) {
            logger_1.logger.error('Service initialization failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - this.startupStart
            });
            throw error;
        }
    }
    async initializeService(serviceName, config) {
        const status = {
            name: config.name,
            status: 'pending',
            dependencies: config.dependencies,
            retryCount: 0
        };
        this.serviceStatuses.set(serviceName, status);
        try {
            logger_1.logger.info(`Initializing service: ${config.name}`, { order: config.order });
            if (config.dependencies) {
                await this.validateDependencies(config.dependencies);
            }
            status.status = 'initializing';
            status.startTime = Date.now();
            this.updateServiceStatus(serviceName, status);
            if (config.circuitBreakerEnabled && config.circuitBreakerConfig) {
                circuit_breaker_service_1.CircuitBreakerRegistry.createCircuitBreaker(serviceName, config.circuitBreakerConfig.threshold, config.circuitBreakerConfig.timeout, config.circuitBreakerConfig.resetTimeout);
            }
            const initializeWithRetry = async () => {
                switch (serviceName) {
                    case 'database':
                        await this.initializeDatabaseService();
                        break;
                    case 'redis':
                        await this.initializeRedisService();
                        break;
                    case 'auth':
                        await this.initializeAuthService();
                        break;
                    case 'performance':
                        await this.initializePerformanceService();
                        break;
                    case 'costMonitoring':
                        await this.initializeCostMonitoringService();
                        break;
                    case 'businessMetrics':
                        await this.initializeBusinessMetricsService();
                        break;
                    default:
                        throw new Error(`Unknown service: ${serviceName}`);
                }
            };
            if (config.retryEnabled && config.maxRetries > 0) {
                await this.retryService.execute(initializeWithRetry, config.maxRetries, config.retryDelay, {
                    onRetry: (attempt) => {
                        status.retryCount = attempt;
                        logger_1.logger.warn(`Retrying ${config.name} initialization (attempt ${attempt})`);
                        this.updateServiceStatus(serviceName, status);
                    }
                });
            }
            else {
                await this.executeWithTimeout(initializeWithRetry, config.timeout);
            }
            let healthCheckPassed = true;
            if (config.healthCheckEnabled) {
                healthCheckPassed = await this.performHealthCheck(serviceName);
            }
            status.status = healthCheckPassed ? 'ready' : 'degraded';
            status.endTime = Date.now();
            status.duration = status.endTime - (status.startTime || 0);
            status.healthCheck = healthCheckPassed;
            this.updateServiceStatus(serviceName, status);
            logger_1.logger.info(`Service ${config.name} initialized successfully`, {
                duration: status.duration,
                healthCheck: healthCheckPassed
            });
            if (config.gracefulDegradationEnabled) {
                const degradationConfig = DefaultDegradationConfigs[serviceName.toUpperCase()] || DefaultDegradationConfigs.DEFAULT;
                gracefulDegradationService.registerService(serviceName, degradationConfig);
            }
        }
        catch (error) {
            status.status = 'failed';
            status.error = error instanceof Error ? error : new Error(String(error));
            status.endTime = Date.now();
            status.duration = status.endTime - (status.startTime || 0);
            this.updateServiceStatus(serviceName, status);
            logger_1.logger.error(`Failed to initialize service: ${config.name}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: status.duration,
                retryCount: status.retryCount
            });
            if (config.required) {
                throw new Error(`Required service ${config.name} failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            if (config.gracefulDegradationEnabled) {
                logger_1.logger.info(`Enabling graceful degradation for failed service: ${config.name}`);
                gracefulDegradationService.setServiceUnavailable(serviceName);
            }
        }
    }
    async initializeDatabaseService() {
        try {
            if (typeof database_service_1.DatabaseService.initialize === 'function') {
                await database_service_1.DatabaseService.initialize();
            }
            else {
                logger_1.logger.info('Database service initialize method not found, skipping');
            }
        }
        catch (error) {
            throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async initializeRedisService() {
        try {
            if (typeof redis_service_1.RedisService.initialize === 'function') {
                await redis_service_1.RedisService.initialize();
            }
            else {
                logger_1.logger.info('Redis service initialize method not found, skipping');
            }
        }
        catch (error) {
            throw new Error(`Redis initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async initializeAuthService() {
        try {
            if (typeof auth_service_1.AuthService.initialize === 'function') {
                await auth_service_1.AuthService.initialize();
            }
            else {
                logger_1.logger.info('Auth service initialize method not found, skipping');
            }
        }
        catch (error) {
            throw new Error(`Auth service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async initializePerformanceService() {
        try {
            if (typeof performance_service_1.PerformanceService.initialize === 'function') {
                await performance_service_1.PerformanceService.initialize();
            }
            else {
                logger_1.logger.info('Performance service initialize method not found, skipping');
            }
        }
        catch (error) {
            throw new Error(`Performance service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async initializeCostMonitoringService() {
        try {
            if (typeof cost_monitoring_service_1.CostMonitoringService.initialize === 'function') {
                await cost_monitoring_service_1.CostMonitoringService.initialize();
            }
            else {
                logger_1.logger.info('Cost monitoring service initialize method not found, skipping');
            }
        }
        catch (error) {
            throw new Error(`Cost monitoring service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async initializeBusinessMetricsService() {
        try {
            if (typeof business_metrics_dashboard_service_1.BusinessMetricsDashboardService.initialize === 'function') {
                await business_metrics_dashboard_service_1.BusinessMetricsDashboardService.initialize();
            }
            else {
                logger_1.logger.info('Business metrics service initialize method not found, skipping');
            }
        }
        catch (error) {
            throw new Error(`Business metrics service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async performHealthCheck(serviceName) {
        try {
            switch (serviceName) {
                case 'database':
                    if (typeof database_service_1.DatabaseService.healthCheck === 'function') {
                        return await database_service_1.DatabaseService.healthCheck();
                    }
                    else {
                        logger_1.logger.debug('Database service healthCheck method not found, returning true');
                        return true;
                    }
                case 'redis':
                    if (typeof redis_service_1.RedisService.healthCheck === 'function') {
                        return await redis_service_1.RedisService.healthCheck();
                    }
                    else {
                        logger_1.logger.debug('Redis service healthCheck method not found, returning true');
                        return true;
                    }
                case 'auth':
                    if (typeof auth_service_1.AuthService.healthCheck === 'function') {
                        return await auth_service_1.AuthService.healthCheck();
                    }
                    else {
                        logger_1.logger.debug('Auth service healthCheck method not found, returning true');
                        return true;
                    }
                case 'performance':
                    if (typeof performance_service_1.PerformanceService.healthCheck === 'function') {
                        return await performance_service_1.PerformanceService.healthCheck();
                    }
                    else {
                        logger_1.logger.debug('Performance service healthCheck method not found, returning true');
                        return true;
                    }
                case 'costMonitoring':
                    if (typeof cost_monitoring_service_1.CostMonitoringService.healthCheck === 'function') {
                        return await cost_monitoring_service_1.CostMonitoringService.healthCheck();
                    }
                    else {
                        logger_1.logger.debug('Cost monitoring service healthCheck method not found, returning true');
                        return true;
                    }
                case 'businessMetrics':
                    if (typeof business_metrics_dashboard_service_1.BusinessMetricsDashboardService.healthCheck === 'function') {
                        return await business_metrics_dashboard_service_1.BusinessMetricsDashboardService.healthCheck();
                    }
                    else {
                        logger_1.logger.debug('Business metrics service healthCheck method not found, returning true');
                        return true;
                    }
                default:
                    logger_1.logger.debug(`Unknown service for health check: ${serviceName}, returning true`);
                    return true;
            }
        }
        catch (error) {
            logger_1.logger.warn(`Health check failed for ${serviceName}`, {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
    async startHealthMonitoring() {
        try {
            healthMonitorService.addHealthCheck('gracefulDegradation', async () => {
                if (typeof gracefulDegradationService.healthCheck === 'function') {
                    return await gracefulDegradationService.healthCheck();
                }
                else {
                    logger_1.logger.debug('Graceful degradation service healthCheck method not found, using fallback check');
                    return typeof gracefulDegradationService.isServiceAvailable === 'function';
                }
            });
            for (const [serviceName] of this.serviceStatuses) {
                healthMonitorService.addHealthCheck(serviceName, async () => {
                    return await this.performHealthCheck(serviceName);
                });
            }
            healthMonitorService.startMonitoring();
            logger_1.logger.info('Health monitoring started for all services');
        }
        catch (error) {
            logger_1.logger.error('Failed to start health monitoring', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async validateDependencies(dependencies) {
        for (const dependency of dependencies) {
            const status = this.serviceStatuses.get(dependency);
            if (!status || status.status !== 'ready') {
                throw new Error(`Dependency ${dependency} is not ready`);
            }
        }
    }
    async executeWithTimeout(fn, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Operation timed out after ${timeout}ms`));
            }, timeout);
            fn()
                .then(resolve)
                .catch(reject)
                .finally(() => clearTimeout(timer));
        });
    }
    updateServiceStatus(serviceName, status) {
        const updateData = {
            ...status,
            lastUpdated: Date.now()
        };
        this.serviceStatuses.set(serviceName, status);
        logger_1.logger.debug(`Service status updated: ${serviceName}`, updateData);
    }
    mergeConfigurations(customConfigs) {
        const configs = { ...defaultServiceConfigs };
        if (customConfigs) {
            for (const [serviceName, customConfig] of Object.entries(customConfigs)) {
                if (configs[serviceName]) {
                    configs[serviceName] = { ...configs[serviceName], ...customConfig };
                }
            }
        }
        return configs;
    }
    getServiceStatuses() {
        return new Map(this.serviceStatuses);
    }
    getServiceStatus(serviceName) {
        return this.serviceStatuses.get(serviceName);
    }
    getReadyServices() {
        return Array.from(this.serviceStatuses.values()).filter(status => status.status === 'ready');
    }
    getFailedServices() {
        return Array.from(this.serviceStatuses.values()).filter(status => status.status === 'failed');
    }
    getDegradedServices() {
        return Array.from(this.serviceStatuses.values()).filter(status => status.status === 'degraded');
    }
    isAllServicesInitialized() {
        return this.isInitialized;
    }
    isCriticalServicesReady() {
        const criticalServices = ['database', 'auth'];
        return criticalServices.every(serviceName => {
            const status = this.serviceStatuses.get(serviceName);
            return status && status.status === 'ready';
        });
    }
    getSystemHealth() {
        const statuses = Array.from(this.serviceStatuses.values());
        const readyCount = statuses.filter(s => s.status === 'ready').length;
        const failedCount = statuses.filter(s => s.status === 'failed').length;
        const degradedCount = statuses.filter(s => s.status === 'degraded').length;
        const totalCount = statuses.length;
        let status;
        if (failedCount === 0 && degradedCount === 0) {
            status = 'healthy';
        }
        else if (this.isCriticalServicesReady()) {
            status = 'degraded';
        }
        else {
            status = 'unhealthy';
        }
        return {
            status,
            readyServices: readyCount,
            failedServices: failedCount,
            degradedServices: degradedCount,
            totalServices: totalCount,
            uptime: Date.now() - this.startupStart
        };
    }
    async restartService(serviceName) {
        const config = defaultServiceConfigs[serviceName];
        if (!config) {
            throw new Error(`Unknown service: ${serviceName}`);
        }
        logger_1.logger.info(`Restarting service: ${config.name}`);
        await this.initializeService(serviceName, config);
    }
    async shutdown() {
        logger_1.logger.info('Starting graceful shutdown of all services...');
        try {
            healthMonitorService.stopMonitoring();
            this.serviceStatuses.clear();
            this.isInitialized = false;
            logger_1.logger.info('Graceful shutdown completed');
        }
        catch (error) {
            logger_1.logger.error('Error during graceful shutdown', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}
exports.ServiceInitializationManager = ServiceInitializationManager;
exports.default = ServiceInitializationManager.getInstance();
//# sourceMappingURL=service-initialization.service.js.map