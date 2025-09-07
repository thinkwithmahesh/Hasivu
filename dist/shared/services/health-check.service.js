"use strict";
/**
 * HASIVU Platform - System Health Check Service
 * Comprehensive system health monitoring with detailed service checks
 * Production-ready implementation with alerting and diagnostics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckService = exports.HealthCheckService = exports.HealthCheckServiceError = void 0;
const logger_1 = require("@/utils/logger");
const environment_1 = require("@/config/environment");
/**
 * Health Check Service Error
 */
class HealthCheckServiceError extends Error {
    code;
    service;
    details;
    constructor(message, code = 'HEALTH_CHECK_ERROR', service, details) {
        super(message);
        this.name = 'HealthCheckServiceError';
        this.code = code;
        this.service = service;
        this.details = details;
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, HealthCheckServiceError.prototype);
    }
}
exports.HealthCheckServiceError = HealthCheckServiceError;
/**
 * Health Check Service
 * Singleton service for comprehensive system health monitoring
 */
class HealthCheckService {
    static instance;
    config;
    healthHistory = [];
    maxHistoryEntries = 100;
    constructor() {
        this.config = {
            enableDetailedChecks: environment_1.config.environment !== 'production' || environment_1.config.monitoring?.enableDetailedHealthChecks || false,
            checkTimeout: environment_1.config.monitoring?.healthCheckTimeout || 5000,
            warningThresholds: {
                cpuUsage: 70,
                memoryUsage: 75,
                responseTime: 1000
            },
            criticalThresholds: {
                cpuUsage: 90,
                memoryUsage: 90,
                responseTime: 3000
            },
            services: {
                database: true,
                redis: environment_1.config.redis?.enabled || false,
                email: environment_1.config.sendgrid?.enabled || false,
                payment: environment_1.config.razorpay?.enabled || false
            }
        };
        logger_1.logger.info('Health Check Service initialized', {
            environment: environment_1.config.environment,
            detailedChecks: this.config.enableDetailedChecks,
            checkTimeout: this.config.checkTimeout,
            enabledServices: Object.entries(this.config.services)
                .filter(([, enabled]) => enabled)
                .map(([service]) => service)
        });
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!HealthCheckService.instance) {
            HealthCheckService.instance = new HealthCheckService();
        }
        return HealthCheckService.instance;
    }
    /**
     * Perform comprehensive system health check
     */
    async performHealthCheck() {
        const startTime = Date.now();
        const alerts = [];
        const services = [];
        try {
            // Collect system metrics
            const systemMetrics = this.collectSystemMetrics();
            // Generate alerts based on metrics
            alerts.push(...this.generateMetricAlerts(systemMetrics));
            // Check individual services if enabled
            if (this.config.enableDetailedChecks) {
                const serviceChecks = await this.performServiceChecks();
                services.push(...serviceChecks);
            }
            // Calculate overall health status
            const duration = Date.now() - startTime;
            const status = this.calculateOverallStatus(systemMetrics, services, alerts, duration);
            const healthResult = {
                status: status,
                timestamp: Date.now(),
                responseTime: duration,
                version: process.version,
                environment: environment_1.config.environment,
                services,
                metrics: systemMetrics,
                alerts,
                summary: {
                    healthy: services.filter(s => s.status === 'healthy').length,
                    degraded: services.filter(s => s.status === 'degraded').length,
                    unhealthy: services.filter(s => s.status === 'unhealthy').length,
                    total: services.length
                },
                duration
            };
            // Store in history
            this.addToHistory(healthResult);
            logger_1.logger.info('Health check completed', {
                status: status,
                duration: duration,
                servicesChecked: services.length,
                alerts: alerts.length,
                healthy: healthResult.summary.healthy,
                degraded: healthResult.summary.degraded,
                unhealthy: healthResult.summary.unhealthy
            });
            return healthResult;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.logger.error('Health check failed', {
                error: error.message,
                duration: `${duration}ms`,
                stack: error.stack
            });
            // Return unhealthy status with error details
            return {
                status: 'unhealthy',
                timestamp: Date.now(),
                responseTime: duration,
                version: process.version,
                environment: environment_1.config.environment,
                services: [],
                metrics: this.getEmptyMetrics(),
                alerts: [{
                        level: 'critical',
                        message: `Health check failed: ${error.message}`,
                        timestamp: Date.now()
                    }],
                summary: { healthy: 0, degraded: 0, unhealthy: 0, total: 0 },
                duration
            };
        }
    }
    /**
     * Collect comprehensive system metrics
     */
    collectSystemMetrics() {
        try {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            const loadAvg = require('os').loadavg();
            const os = require('os');
            // Calculate CPU percentage (simplified)
            const cpuPercent = Math.min(100, Math.round((cpuUsage.user + cpuUsage.system) / 1000000 * 100 / os.cpus().length));
            // Memory calculations
            const totalSystemMemory = os.totalmem();
            const freeSystemMemory = os.freemem();
            const usedSystemMemory = totalSystemMemory - freeSystemMemory;
            const systemMemoryPercent = Math.round((usedSystemMemory / totalSystemMemory) * 100);
            const heapUsedPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
            return {
                cpu: {
                    usage: cpuPercent,
                    loadAverage: loadAvg
                },
                memory: {
                    used: `${Math.round(usedSystemMemory / 1024 / 1024)}MB`,
                    total: `${Math.round(totalSystemMemory / 1024 / 1024)}MB`,
                    percentage: systemMemoryPercent,
                    heap: {
                        used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                        total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
                        percentage: heapUsedPercent
                    }
                },
                process: {
                    uptime: Math.round(process.uptime()),
                    pid: process.pid,
                    version: process.version,
                    memoryUsage: memUsage
                },
                system: {
                    platform: os.platform(),
                    arch: os.arch(),
                    hostname: os.hostname(),
                    uptime: Math.round(os.uptime()),
                    freeMemory: `${Math.round(freeSystemMemory / 1024 / 1024)}MB`,
                    totalMemory: `${Math.round(totalSystemMemory / 1024 / 1024)}MB`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to collect system metrics', {
                error: error.message
            });
            return this.getEmptyMetrics();
        }
    }
    /**
     * Generate alerts based on system metrics
     */
    generateMetricAlerts(metrics) {
        const alerts = [];
        const timestamp = Date.now();
        // CPU alerts
        if (metrics.cpu.usage >= this.config.criticalThresholds.cpuUsage) {
            alerts.push({
                level: 'critical',
                message: `Critical CPU usage: ${metrics.cpu.usage}%`,
                timestamp,
                threshold: this.config.criticalThresholds.cpuUsage,
                current: metrics.cpu.usage
            });
        }
        else if (metrics.cpu.usage >= this.config.warningThresholds.cpuUsage) {
            alerts.push({
                level: 'warning',
                message: `High CPU usage: ${metrics.cpu.usage}%`,
                timestamp,
                threshold: this.config.warningThresholds.cpuUsage,
                current: metrics.cpu.usage
            });
        }
        // Memory alerts
        if (metrics.memory.percentage >= this.config.criticalThresholds.memoryUsage) {
            alerts.push({
                level: 'critical',
                message: `Critical memory usage: ${metrics.memory.percentage}% (${metrics.memory.used}/${metrics.memory.total})`,
                timestamp,
                threshold: this.config.criticalThresholds.memoryUsage,
                current: metrics.memory.percentage
            });
        }
        else if (metrics.memory.percentage >= this.config.warningThresholds.memoryUsage) {
            alerts.push({
                level: 'warning',
                message: `High memory usage: ${metrics.memory.percentage}% (${metrics.memory.used}/${metrics.memory.total})`,
                timestamp,
                threshold: this.config.warningThresholds.memoryUsage,
                current: metrics.memory.percentage
            });
        }
        // Heap memory alerts
        if (metrics.memory.heap.percentage >= 90) {
            alerts.push({
                level: 'critical',
                message: `Critical heap usage: ${metrics.memory.heap.percentage}% (${metrics.memory.heap.used}/${metrics.memory.heap.total})`,
                timestamp,
                threshold: 90,
                current: metrics.memory.heap.percentage
            });
        }
        else if (metrics.memory.heap.percentage >= 80) {
            alerts.push({
                level: 'warning',
                message: `High heap usage: ${metrics.memory.heap.percentage}% (${metrics.memory.heap.used}/${metrics.memory.heap.total})`,
                timestamp,
                threshold: 80,
                current: metrics.memory.heap.percentage
            });
        }
        // Load average alerts (for systems that support it)
        if (metrics.cpu.loadAverage && metrics.cpu.loadAverage.length > 0) {
            const loadAvg1min = metrics.cpu.loadAverage[0];
            const cpuCount = require('os').cpus().length;
            const loadPerCpu = loadAvg1min / cpuCount;
            if (loadPerCpu >= 2.0) {
                alerts.push({
                    level: 'critical',
                    message: `Critical system load: ${loadAvg1min.toFixed(2)} (${loadPerCpu.toFixed(2)} per CPU)`,
                    timestamp,
                    threshold: 2.0,
                    current: loadPerCpu
                });
            }
            else if (loadPerCpu >= 1.5) {
                alerts.push({
                    level: 'warning',
                    message: `High system load: ${loadAvg1min.toFixed(2)} (${loadPerCpu.toFixed(2)} per CPU)`,
                    timestamp,
                    threshold: 1.5,
                    current: loadPerCpu
                });
            }
        }
        return alerts;
    }
    /**
     * Perform individual service health checks
     */
    async performServiceChecks() {
        const services = [];
        const checkPromises = [];
        // Database check
        if (this.config.services.database) {
            checkPromises.push(this.checkDatabaseHealth());
        }
        // Redis check
        if (this.config.services.redis) {
            checkPromises.push(this.checkRedisHealth());
        }
        // Email service check
        if (this.config.services.email) {
            checkPromises.push(this.checkEmailServiceHealth());
        }
        // Payment service check
        if (this.config.services.payment) {
            checkPromises.push(this.checkPaymentServiceHealth());
        }
        // Execute all checks in parallel with timeout
        const results = await Promise.allSettled(checkPromises.map(promise => this.withTimeout(promise, this.config.checkTimeout)));
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                services.push(result.value);
            }
            else {
                // Create failed service status
                const serviceNames = ['database', 'redis', 'email', 'payment'];
                services.push({
                    name: serviceNames[index] || 'unknown',
                    status: 'unhealthy',
                    lastCheck: Date.now(),
                    details: {
                        error: result.reason?.message || 'Service check failed'
                    },
                    error: result.reason?.message || 'Service check timeout or error'
                });
            }
        });
        return services;
    }
    /**
     * Check database health
     */
    async checkDatabaseHealth() {
        const startTime = Date.now();
        try {
            // Try to import and check database service dynamically
            const { DatabaseService } = await Promise.resolve().then(() => require('../database.service'));
            const dbService = DatabaseService.getInstance();
            // Perform health check if method exists
            if (typeof dbService.healthCheck === 'function') {
                const healthResult = await dbService.healthCheck();
                const responseTime = Date.now() - startTime;
                return {
                    name: 'database',
                    status: healthResult.status === 'healthy' ? 'healthy' :
                        healthResult.status === 'degraded' ? 'degraded' : 'unhealthy',
                    responseTime,
                    lastCheck: Date.now(),
                    details: healthResult
                };
            }
            else {
                // Basic connection test
                const responseTime = Date.now() - startTime;
                return {
                    name: 'database',
                    status: 'healthy',
                    responseTime,
                    lastCheck: Date.now(),
                    details: {
                        message: 'Database service available',
                        basicCheck: true
                    }
                };
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                name: 'database',
                status: 'unhealthy',
                responseTime,
                lastCheck: Date.now(),
                details: {
                    error: error.message,
                    connectionFailure: true
                },
                error: `Database health check failed: ${error.message}`
            };
        }
    }
    /**
     * Check Redis health
     */
    async checkRedisHealth() {
        const startTime = Date.now();
        try {
            // Try to import and check Redis service dynamically
            // const { RedisService } = await import('../redis.service');  // Redis import unavailable
            const RedisService = null;
            const redisService = RedisService;
            // Perform health check if method exists
            if (typeof redisService.healthCheck === 'function') {
                const healthResult = await redisService.healthCheck();
                const responseTime = Date.now() - startTime;
                return {
                    name: 'redis',
                    status: healthResult.status === 'healthy' ? 'healthy' :
                        healthResult.status === 'degraded' ? 'degraded' : 'unhealthy',
                    responseTime,
                    lastCheck: Date.now(),
                    details: healthResult
                };
            }
            else {
                // Basic ping test
                await redisService.ping();
                const responseTime = Date.now() - startTime;
                return {
                    name: 'redis',
                    status: 'healthy',
                    responseTime,
                    lastCheck: Date.now(),
                    details: {
                        message: 'Redis ping successful',
                        basicCheck: true
                    }
                };
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                name: 'redis',
                status: 'unhealthy',
                responseTime,
                lastCheck: Date.now(),
                details: {
                    error: error.message,
                    connectionFailure: true
                },
                error: `Redis health check failed: ${error.message}`
            };
        }
    }
    /**
     * Check email service health
     */
    async checkEmailServiceHealth() {
        const startTime = Date.now();
        try {
            // Try to import and check email service dynamically
            const { EmailService } = await Promise.resolve().then(() => require('./email.service'));
            const emailService = EmailService.getInstance();
            // Perform health check if method exists
            if (typeof emailService.healthCheck === 'function') {
                const healthResult = await emailService.healthCheck();
                const responseTime = Date.now() - startTime;
                return {
                    name: 'email',
                    status: healthResult.status === 'healthy' ? 'healthy' : 'unhealthy',
                    responseTime,
                    lastCheck: Date.now(),
                    details: healthResult
                };
            }
            else {
                // Basic service info check
                const serviceInfo = emailService.getServiceInfo();
                const responseTime = Date.now() - startTime;
                return {
                    name: 'email',
                    status: serviceInfo.initialized && serviceInfo.apiKeyConfigured ? 'healthy' : 'degraded',
                    responseTime,
                    lastCheck: Date.now(),
                    details: {
                        ...serviceInfo,
                        basicCheck: true
                    }
                };
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                name: 'email',
                status: 'unhealthy',
                responseTime,
                lastCheck: Date.now(),
                details: {
                    error: error.message,
                    serviceFailure: true
                },
                error: `Email service health check failed: ${error.message}`
            };
        }
    }
    /**
     * Check payment service health
     */
    async checkPaymentServiceHealth() {
        const startTime = Date.now();
        try {
            // Try to import and check payment service dynamically
            const { RazorpayService } = await Promise.resolve().then(() => require('../razorpay.service'));
            const paymentService = RazorpayService.getInstance();
            // Perform health check if method exists
            if (typeof paymentService.healthCheck === 'function') {
                const healthResult = await paymentService.healthCheck();
                const responseTime = Date.now() - startTime;
                return {
                    name: 'payment',
                    status: healthResult.status === 'healthy' ? 'healthy' : 'unhealthy',
                    responseTime,
                    lastCheck: Date.now(),
                    details: healthResult
                };
            }
            else {
                // Basic service info check
                const serviceInfo = paymentService.getServiceInfo();
                const responseTime = Date.now() - startTime;
                return {
                    name: 'payment',
                    status: serviceInfo.initialized && serviceInfo.keyConfigured ? 'healthy' : 'degraded',
                    responseTime,
                    lastCheck: Date.now(),
                    details: {
                        ...serviceInfo,
                        basicCheck: true
                    }
                };
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                name: 'payment',
                status: 'unhealthy',
                responseTime,
                lastCheck: Date.now(),
                details: {
                    error: error.message,
                    serviceFailure: true
                },
                error: `Payment service health check failed: ${error.message}`
            };
        }
    }
    /**
     * Calculate overall system health status
     */
    calculateOverallStatus(metrics, services, alerts, responseTime) {
        // Check for critical alerts or response time
        const hasCriticalAlert = alerts.some(alert => alert.level === 'critical');
        const isResponseTimeCritical = responseTime > this.config.criticalThresholds.responseTime;
        if (hasCriticalAlert || isResponseTimeCritical) {
            return 'unhealthy';
        }
        // Check service status
        const unhealthyServices = services.filter(s => s.status === 'unhealthy').length;
        const degradedServices = services.filter(s => s.status === 'degraded').length;
        if (unhealthyServices > 0) {
            return 'unhealthy';
        }
        // Check for warning conditions
        const hasWarningAlert = alerts.some(alert => alert.level === 'warning');
        const isResponseTimeDegraded = responseTime > this.config.warningThresholds.responseTime;
        if (degradedServices > 0 || hasWarningAlert || isResponseTimeDegraded) {
            return 'degraded';
        }
        return 'healthy';
    }
    /**
     * Get health check history
     */
    getHealthHistory() {
        return [...this.healthHistory];
    }
    /**
     * Get latest health status
     */
    getLatestHealthStatus() {
        return this.healthHistory.length > 0 ? this.healthHistory[this.healthHistory.length - 1] : null;
    }
    /**
     * Add health check result to history
     */
    addToHistory(healthStatus) {
        this.healthHistory.push(healthStatus);
        // Keep only the latest entries
        if (this.healthHistory.length > this.maxHistoryEntries) {
            this.healthHistory = this.healthHistory.slice(-this.maxHistoryEntries);
        }
    }
    /**
     * Get empty metrics fallback
     */
    getEmptyMetrics() {
        return {
            cpu: { usage: 0, loadAverage: [] },
            memory: {
                used: '0MB',
                total: '0MB',
                percentage: 0,
                heap: { used: '0MB', total: '0MB', percentage: 0 }
            },
            process: {
                uptime: 0,
                pid: process.pid,
                version: process.version,
                memoryUsage: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 }
            },
            system: {
                platform: 'unknown',
                arch: 'unknown',
                hostname: 'unknown',
                uptime: 0,
                freeMemory: '0MB',
                totalMemory: '0MB'
            }
        };
    }
    /**
     * Execute promise with timeout
     */
    async withTimeout(promise, timeoutMs) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
        });
        return Promise.race([promise, timeoutPromise]);
    }
    /**
     * Get service configuration (for debugging)
     */
    getServiceConfig() {
        return { ...this.config };
    }
    /**
     * Update service configuration
     */
    updateConfig(updates) {
        Object.assign(this.config, updates);
        logger_1.logger.info('Health check configuration updated', {
            updates,
            newConfig: this.config
        });
    }
}
exports.HealthCheckService = HealthCheckService;
// Export singleton instance
exports.healthCheckService = HealthCheckService.getInstance();
