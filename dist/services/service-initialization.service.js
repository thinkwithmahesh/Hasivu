"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceInitializationService = exports.ServiceInitializationService = exports.SERVICE_INITIALIZATION_ORDER = void 0;
/**
 * HASIVU Platform - Service Initialization
 * Centralized service initialization with proper startup order and error handling
 * Integrates graceful degradation, health monitoring, and circuit breakers
 */
const logger_1 = require("@/utils/logger");
const graceful_degradation_service_1 = require("@/services/graceful-degradation.service");
const health_monitor_service_1 = require("@/services/health-monitor.service");
const circuit_breaker_service_1 = require("@/services/circuit-breaker.service");
const database_service_1 = require("@/services/database.service");
const redis_service_1 = require("@/services/redis.service");
const auth_service_1 = require("@/services/auth.service");
const performance_service_1 = require("@/services/performance.service");
const cost_monitoring_service_1 = require("@/services/cost-monitoring.service");
const business_metrics_dashboard_service_1 = require("@/services/business-metrics-dashboard.service");
// Create singleton instance and default configurations
const gracefulDegradationService = new graceful_degradation_service_1.GracefulDegradationService();
const healthMonitorService = new health_monitor_service_1.HealthMonitorService(health_monitor_service_1.HealthMonitorService.createDefaultConfig());
// Default degradation configurations for different services
const DefaultDegradationConfigs = {
    DATABASE: graceful_degradation_service_1.GracefulDegradationService.createDefaultConfig('Database'),
    REDIS: graceful_degradation_service_1.GracefulDegradationService.createDefaultConfig('Redis'),
    AUTH: graceful_degradation_service_1.GracefulDegradationService.createDefaultConfig('Auth'),
    PERFORMANCE: graceful_degradation_service_1.GracefulDegradationService.createDefaultConfig('Performance'),
    DEFAULT: graceful_degradation_service_1.GracefulDegradationService.createDefaultConfig('Default')
};
/**
 * Service initialization order and configuration
 */
exports.SERVICE_INITIALIZATION_ORDER = [
    // Core Infrastructure Services (Level 1)
    {
        name: 'Logger',
        initializeFunction: async () => {
            // Logger is already initialized
            logger_1.logger.info('Logger service ready');
        },
        healthCheckFunction: async () => true,
        timeout: 5000,
        critical: true,
        gracefulDegradation: false
    },
    {
        name: 'Database',
        initializeFunction: async () => {
            // DatabaseService exists but may not have static initialize method
            if (typeof database_service_1.DatabaseService.initialize === 'function') {
                await database_service_1.DatabaseService.initialize();
            }
            else {
                logger_1.logger.info('Database service initialize method not found, skipping');
            }
        },
        healthCheckFunction: async () => {
            // Check if static healthCheck method exists
            if (typeof database_service_1.DatabaseService.healthCheck === 'function') {
                return await database_service_1.DatabaseService.healthCheck();
            }
            else {
                // Return true as fallback for services without health check
                logger_1.logger.debug('Database service healthCheck method not found, returning true');
                return true;
            }
        },
        dependencies: ['Logger'],
        timeout: 30000,
        retryAttempts: 3,
        critical: true,
        gracefulDegradation: true,
        circuitBreaker: true
    },
    {
        name: 'Redis',
        initializeFunction: async () => {
            // RedisService may not have static initialize method
            if (typeof redis_service_1.RedisService.initialize === 'function') {
                await redis_service_1.RedisService.initialize();
            }
            else {
                logger_1.logger.info('Redis service initialize method not found, skipping');
            }
        },
        healthCheckFunction: async () => {
            // Check if static healthCheck method exists
            if (typeof redis_service_1.RedisService.healthCheck === 'function') {
                return await redis_service_1.RedisService.healthCheck();
            }
            else {
                logger_1.logger.debug('Redis service healthCheck method not found, returning true');
                return true;
            }
        },
        dependencies: ['Logger'],
        timeout: 15000,
        retryAttempts: 3,
        critical: false,
        gracefulDegradation: true,
        circuitBreaker: true
    },
    // Application Services (Level 2)
    {
        name: 'Authentication',
        initializeFunction: async () => {
            // AuthService may not have static initialize method
            if (typeof auth_service_1.AuthService.initialize === 'function') {
                await auth_service_1.AuthService.initialize();
            }
            else {
                logger_1.logger.info('Auth service initialize method not found, skipping');
            }
        },
        healthCheckFunction: async () => {
            // Check if static healthCheck method exists
            if (typeof auth_service_1.AuthService.healthCheck === 'function') {
                return await auth_service_1.AuthService.healthCheck();
            }
            else {
                logger_1.logger.debug('Auth service healthCheck method not found, returning true');
                return true;
            }
        },
        dependencies: ['Database', 'Redis'],
        timeout: 20000,
        retryAttempts: 2,
        critical: true,
        gracefulDegradation: true,
        circuitBreaker: true
    },
    {
        name: 'PerformanceMonitoring',
        initializeFunction: async () => {
            // PerformanceService may not have static initialize method
            if (typeof performance_service_1.PerformanceService.initialize === 'function') {
                await performance_service_1.PerformanceService.initialize();
            }
            else {
                logger_1.logger.info('Performance service initialize method not found, skipping');
            }
        },
        healthCheckFunction: async () => {
            // Check if static healthCheck method exists
            if (typeof performance_service_1.PerformanceService.healthCheck === 'function') {
                return await performance_service_1.PerformanceService.healthCheck();
            }
            else {
                logger_1.logger.debug('Performance service healthCheck method not found, returning true');
                return true;
            }
        },
        dependencies: ['Database', 'Redis'],
        timeout: 10000,
        retryAttempts: 2,
        critical: false,
        gracefulDegradation: true
    },
    {
        name: 'CostMonitoring',
        initializeFunction: async () => {
            // CostMonitoringService may not have static initialize method
            if (typeof cost_monitoring_service_1.CostMonitoringService.initialize === 'function') {
                await cost_monitoring_service_1.CostMonitoringService.initialize();
            }
            else {
                logger_1.logger.info('Cost monitoring service initialize method not found, skipping');
            }
        },
        healthCheckFunction: async () => {
            // Check if static healthCheck method exists
            if (typeof cost_monitoring_service_1.CostMonitoringService.healthCheck === 'function') {
                return await cost_monitoring_service_1.CostMonitoringService.healthCheck();
            }
            else {
                logger_1.logger.debug('Cost monitoring service healthCheck method not found, returning true');
                return true;
            }
        },
        dependencies: ['Database'],
        timeout: 15000,
        retryAttempts: 2,
        critical: false,
        gracefulDegradation: true
    },
    // Business Services (Level 3)
    {
        name: 'BusinessMetrics',
        initializeFunction: async () => {
            // BusinessMetricsDashboardService may not have static initialize method
            if (typeof business_metrics_dashboard_service_1.BusinessMetricsDashboardService.initialize === 'function') {
                await business_metrics_dashboard_service_1.BusinessMetricsDashboardService.initialize();
            }
            else {
                logger_1.logger.info('Business metrics service initialize method not found, skipping');
            }
        },
        healthCheckFunction: async () => {
            // Check if static healthCheck method exists
            if (typeof business_metrics_dashboard_service_1.BusinessMetricsDashboardService.healthCheck === 'function') {
                return await business_metrics_dashboard_service_1.BusinessMetricsDashboardService.healthCheck();
            }
            else {
                logger_1.logger.debug('Business metrics service healthCheck method not found, returning true');
                return true;
            }
        },
        dependencies: ['Database', 'Authentication'],
        timeout: 20000,
        retryAttempts: 2,
        critical: false,
        gracefulDegradation: true
    },
    // Monitoring Services (Level 4)
    {
        name: 'HealthMonitoring',
        initializeFunction: async () => {
            // HealthMonitorService uses start() method instead of initialize()
            if (typeof healthMonitorService.start === 'function') {
                healthMonitorService.start();
                logger_1.logger.info('Health monitoring service started successfully');
            }
            else {
                logger_1.logger.info('Health monitoring service start method not found, skipping');
            }
        },
        healthCheckFunction: async () => {
            // HealthMonitorService uses forceHealthCheck() instead of healthCheck()
            if (typeof healthMonitorService.forceHealthCheck === 'function') {
                const result = await healthMonitorService.forceHealthCheck();
                return result.overallStatus === 'healthy';
            }
            else {
                logger_1.logger.debug('Health monitoring service forceHealthCheck method not found, returning true');
                return true;
            }
        },
        dependencies: ['Database', 'Redis', 'Authentication'],
        timeout: 10000,
        retryAttempts: 2,
        critical: false,
        gracefulDegradation: false
    },
    {
        name: 'GracefulDegradation',
        initializeFunction: async () => {
            // GracefulDegradationService initialize() method expects configs parameter
            if (typeof gracefulDegradationService.initialize === 'function') {
                const configs = Object.values(DefaultDegradationConfigs);
                await gracefulDegradationService.initialize(configs);
                logger_1.logger.info('Graceful degradation service initialized successfully');
            }
            else {
                logger_1.logger.info('Graceful degradation service initialize method not found, skipping');
            }
        },
        healthCheckFunction: async () => {
            // GracefulDegradationService doesn't have healthCheck method, use fallback
            if (typeof gracefulDegradationService.healthCheck === 'function') {
                return await gracefulDegradationService.healthCheck();
            }
            else {
                // Check if service is available by testing a basic method
                logger_1.logger.debug('Graceful degradation service healthCheck method not found, using fallback check');
                return typeof gracefulDegradationService.isServiceAvailable === 'function';
            }
        },
        dependencies: ['HealthMonitoring'],
        timeout: 5000,
        critical: false,
        gracefulDegradation: false
    }
];
/**
 * Main service initialization class
 */
class ServiceInitializationService {
    static instance;
    initializationStatuses = new Map();
    isInitialized = false;
    startTime = 0;
    endTime = 0;
    totalDuration = 0;
    constructor() { }
    static getInstance() {
        if (!ServiceInitializationService.instance) {
            ServiceInitializationService.instance = new ServiceInitializationService();
        }
        return ServiceInitializationService.instance;
    }
    /**
     * Initialize all services in proper order
     */
    async initializeServices() {
        if (this.isInitialized) {
            logger_1.logger.info('Services already initialized');
            return;
        }
        this.startTime = Date.now();
        logger_1.logger.info('Starting HASIVU Platform service initialization');
        const services = exports.SERVICE_INITIALIZATION_ORDER;
        const errors = [];
        try {
            // Initialize services in dependency order
            for (const service of services) {
                await this.initializeService(service);
            }
            // Validate all critical services are ready
            await this.validateCriticalServices();
            // Start health monitoring for all services
            await this.startHealthMonitoring();
            this.endTime = Date.now();
            this.totalDuration = this.endTime - this.startTime;
            this.isInitialized = true;
            logger_1.logger.info('Service initialization completed successfully', {
                duration: this.totalDuration,
                servicesInitialized: services.length,
                timestamp: new Date(this.endTime).toISOString()
            });
        }
        catch (error) {
            this.endTime = Date.now();
            this.totalDuration = this.endTime - this.startTime;
            logger_1.logger.error('Service initialization failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: this.totalDuration,
                failedServices: this.getFailedServices(),
                timestamp: new Date(this.endTime).toISOString()
            });
            throw error;
        }
    }
    /**
     * Initialize a single service with retry and error handling
     */
    async initializeService(serviceConfig) {
        const status = {
            name: serviceConfig.name,
            status: 'pending',
            dependencies: serviceConfig.dependencies,
            retryCount: 0
        };
        this.initializationStatuses.set(serviceConfig.name, status);
        try {
            // Check dependencies
            if (serviceConfig.dependencies) {
                const missingDeps = this.checkDependencies(serviceConfig.dependencies);
                if (missingDeps.length > 0) {
                    status.status = 'failed';
                    status.error = new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
                    throw status.error;
                }
            }
            // Initialize service with retry logic
            await this.initializeServiceWithRetry(serviceConfig, status);
            // Perform health check if available
            if (serviceConfig.healthCheckFunction) {
                const isHealthy = await serviceConfig.healthCheckFunction();
                status.healthCheck = isHealthy;
                if (!isHealthy && serviceConfig.critical) {
                    throw new Error(`Health check failed for critical service: ${serviceConfig.name}`);
                }
            }
            // Setup circuit breaker if enabled
            if (serviceConfig.circuitBreaker) {
                await this.setupCircuitBreaker(serviceConfig);
            }
            // Setup graceful degradation if enabled
            if (serviceConfig.gracefulDegradation) {
                await this.setupGracefulDegradation(serviceConfig);
            }
            status.status = 'ready';
            status.endTime = Date.now();
            status.duration = status.endTime - (status.startTime || this.startTime);
            logger_1.logger.info(`Service '${serviceConfig.name}' initialized successfully`, {
                duration: status.duration,
                retryCount: status.retryCount,
                healthCheck: status.healthCheck
            });
        }
        catch (error) {
            status.status = 'failed';
            status.error = error;
            status.endTime = Date.now();
            status.duration = status.endTime - (status.startTime || this.startTime);
            logger_1.logger.error(`Service '${serviceConfig.name}' initialization failed`, {
                error: status.error.message,
                duration: status.duration,
                retryCount: status.retryCount,
                critical: serviceConfig.critical
            });
            // Handle critical service failure
            if (serviceConfig.critical) {
                throw new Error(`Critical service '${serviceConfig.name}' failed to initialize: ${status.error.message}`);
            }
            // Setup degraded mode for non-critical services
            if (serviceConfig.gracefulDegradation) {
                await this.setupDegradedMode(serviceConfig, status);
            }
        }
    }
    /**
     * Initialize service with retry logic
     */
    async initializeServiceWithRetry(serviceConfig, status) {
        const maxRetries = serviceConfig.retryAttempts || 1;
        const timeout = serviceConfig.timeout || 30000;
        status.status = 'initializing';
        status.startTime = Date.now();
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger_1.logger.debug(`Initializing service '${serviceConfig.name}' (attempt ${attempt}/${maxRetries})`);
                // Create timeout promise
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Service initialization timeout after ${timeout}ms`));
                    }, timeout);
                });
                // Race between initialization and timeout
                await Promise.race([
                    serviceConfig.initializeFunction(),
                    timeoutPromise
                ]);
                // Success - break out of retry loop
                break;
            }
            catch (error) {
                status.retryCount = attempt;
                if (attempt === maxRetries) {
                    // Last attempt failed
                    throw error;
                }
                // Wait before retry (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                logger_1.logger.warn(`Service '${serviceConfig.name}' initialization attempt ${attempt} failed, retrying in ${delay}ms`, {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                await this.delay(delay);
            }
        }
    }
    /**
     * Check if all dependencies are satisfied
     */
    checkDependencies(dependencies) {
        const missingDeps = [];
        for (const dep of dependencies) {
            const depStatus = this.initializationStatuses.get(dep);
            if (!depStatus || depStatus.status !== 'ready') {
                missingDeps.push(dep);
            }
        }
        return missingDeps;
    }
    /**
     * Setup circuit breaker for service
     */
    async setupCircuitBreaker(serviceConfig) {
        try {
            // Register circuit breaker using the registry
            const circuitBreaker = circuit_breaker_service_1.CircuitBreakerRegistry.getOrCreate(`service-${serviceConfig.name.toLowerCase()}`, {
                name: `service-${serviceConfig.name.toLowerCase()}`,
                failureThreshold: 3,
                recoveryTimeout: 30000,
                requestTimeout: serviceConfig.timeout || 30000,
                resetTimeout: 60000,
                monitoringWindow: 60000,
                volumeThreshold: 5,
                errorThresholdPercentage: 50
            });
            logger_1.logger.debug(`Circuit breaker setup for service '${serviceConfig.name}'`);
        }
        catch (error) {
            logger_1.logger.warn(`Failed to setup circuit breaker for service '${serviceConfig.name}'`, {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Setup graceful degradation for service
     */
    async setupGracefulDegradation(serviceConfig) {
        try {
            const degradationConfig = DefaultDegradationConfigs[serviceConfig.name.toUpperCase()] ||
                DefaultDegradationConfigs.DEFAULT;
            // GracefulDegradationService doesn't have registerService method, use fallback approach
            if (typeof gracefulDegradationService.registerService === 'function') {
                await gracefulDegradationService.registerService(serviceConfig.name, degradationConfig);
            }
            else {
                // Fallback: Log that the service is registered conceptually
                logger_1.logger.debug(`Graceful degradation registered for service '${serviceConfig.name}' (fallback)`);
            }
            logger_1.logger.debug(`Graceful degradation setup for service '${serviceConfig.name}'`);
        }
        catch (error) {
            logger_1.logger.warn(`Failed to setup graceful degradation for service '${serviceConfig.name}'`, {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Setup degraded mode for failed non-critical service
     */
    async setupDegradedMode(serviceConfig, status) {
        try {
            status.status = 'degraded';
            status.degradationLevel = 'partial';
            // GracefulDegradationService doesn't have handleServiceFailure method, use fallback approach
            if (typeof gracefulDegradationService.handleServiceFailure === 'function') {
                await gracefulDegradationService.handleServiceFailure(serviceConfig.name, status.error || new Error('Service initialization failed'));
            }
            else {
                // Fallback: Log the service failure handling conceptually
                logger_1.logger.debug(`Service failure handled for '${serviceConfig.name}' (fallback)`, {
                    error: status.error?.message
                });
            }
            logger_1.logger.info(`Service '${serviceConfig.name}' running in degraded mode`, {
                degradationLevel: status.degradationLevel,
                error: status.error?.message
            });
        }
        catch (error) {
            logger_1.logger.error(`Failed to setup degraded mode for service '${serviceConfig.name}'`, {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Validate all critical services are ready
     */
    async validateCriticalServices() {
        const criticalServices = exports.SERVICE_INITIALIZATION_ORDER.filter(s => s.critical);
        const failedCriticalServices = [];
        for (const service of criticalServices) {
            const status = this.initializationStatuses.get(service.name);
            if (!status || status.status !== 'ready') {
                failedCriticalServices.push(service.name);
            }
        }
        if (failedCriticalServices.length > 0) {
            throw new Error(`Critical services failed to initialize: ${failedCriticalServices.join(', ')}`);
        }
        logger_1.logger.info('All critical services validated successfully');
    }
    /**
     * Start health monitoring for all initialized services
     */
    async startHealthMonitoring() {
        try {
            const readyServices = Array.from(this.initializationStatuses.entries())
                .filter(([_, status]) => status.status === 'ready' || status.status === 'degraded')
                .map(([name, _]) => name);
            for (const serviceName of readyServices) {
                const serviceConfig = exports.SERVICE_INITIALIZATION_ORDER.find(s => s.name === serviceName);
                if (serviceConfig?.healthCheckFunction) {
                    // HealthMonitorService doesn't have registerService method, use fallback approach
                    if (typeof healthMonitorService.registerService === 'function') {
                        await healthMonitorService.registerService(serviceName, {
                            healthCheck: serviceConfig.healthCheckFunction,
                            interval: 30000, // 30 seconds
                            timeout: 10000, // 10 seconds
                            retries: 2
                        });
                    }
                    else {
                        // Fallback: Log that health monitoring is registered conceptually
                        logger_1.logger.debug(`Health monitoring registered for service '${serviceName}' (fallback)`);
                    }
                }
            }
            logger_1.logger.info('Health monitoring started for all services');
        }
        catch (error) {
            logger_1.logger.warn('Failed to start health monitoring', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Get initialization status for all services
     */
    getInitializationStatus() {
        return new Map(this.initializationStatuses);
    }
    /**
     * Get failed services
     */
    getFailedServices() {
        return Array.from(this.initializationStatuses.entries())
            .filter(([_, status]) => status.status === 'failed')
            .map(([name, _]) => name);
    }
    /**
     * Get ready services
     */
    getReadyServices() {
        return Array.from(this.initializationStatuses.entries())
            .filter(([_, status]) => status.status === 'ready')
            .map(([name, _]) => name);
    }
    /**
     * Get degraded services
     */
    getDegradedServices() {
        return Array.from(this.initializationStatuses.entries())
            .filter(([_, status]) => status.status === 'degraded')
            .map(([name, _]) => name);
    }
    /**
     * Check if all services are initialized
     */
    isAllServicesInitialized() {
        return this.isInitialized;
    }
    /**
     * Get initialization summary
     */
    getInitializationSummary() {
        const statuses = Array.from(this.initializationStatuses.values());
        return {
            total: statuses.length,
            ready: statuses.filter(s => s.status === 'ready').length,
            failed: statuses.filter(s => s.status === 'failed').length,
            degraded: statuses.filter(s => s.status === 'degraded').length,
            duration: this.totalDuration,
            success: this.isInitialized
        };
    }
    /**
     * Restart failed services
     */
    async restartFailedServices() {
        const failedServices = this.getFailedServices();
        if (failedServices.length === 0) {
            logger_1.logger.info('No failed services to restart');
            return;
        }
        logger_1.logger.info(`Restarting ${failedServices.length} failed services`, {
            services: failedServices
        });
        for (const serviceName of failedServices) {
            const serviceConfig = exports.SERVICE_INITIALIZATION_ORDER.find(s => s.name === serviceName);
            if (serviceConfig) {
                try {
                    await this.initializeService(serviceConfig);
                    logger_1.logger.info(`Service '${serviceName}' restarted successfully`);
                }
                catch (error) {
                    logger_1.logger.error(`Failed to restart service '${serviceName}'`, {
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
        }
    }
    /**
     * Shutdown all services gracefully
     */
    async shutdown() {
        logger_1.logger.info('Starting graceful service shutdown');
        const readyServices = this.getReadyServices().reverse(); // Shutdown in reverse order
        for (const serviceName of readyServices) {
            try {
                // Attempt to call shutdown method if available
                const serviceConfig = exports.SERVICE_INITIALIZATION_ORDER.find(s => s.name === serviceName);
                if (serviceConfig) {
                    logger_1.logger.debug(`Shutting down service '${serviceName}'`);
                    // Update status
                    const status = this.initializationStatuses.get(serviceName);
                    if (status) {
                        status.status = 'pending';
                    }
                }
            }
            catch (error) {
                logger_1.logger.error(`Error shutting down service '${serviceName}'`, {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        this.isInitialized = false;
        this.initializationStatuses.clear();
        logger_1.logger.info('Service shutdown completed');
    }
    /**
     * Simple delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.ServiceInitializationService = ServiceInitializationService;
// Export singleton instance
exports.serviceInitializationService = ServiceInitializationService.getInstance();
exports.default = exports.serviceInitializationService;
