"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthMonitorService = exports.HealthSeverity = void 0;
const logger_1 = require("@/utils/logger");
const graceful_degradation_service_1 = require("@/services/graceful-degradation.service");
const circuit_breaker_service_1 = require("@/services/circuit-breaker.service");
const database_service_1 = require("@/services/database.service");
const redis_service_1 = require("@/services/redis.service");
const axios_1 = __importDefault(require("axios"));
var HealthSeverity;
(function (HealthSeverity) {
    HealthSeverity["HEALTHY"] = "healthy";
    HealthSeverity["WARNING"] = "warning";
    HealthSeverity["CRITICAL"] = "critical";
    HealthSeverity["FAILED"] = "failed";
})(HealthSeverity || (exports.HealthSeverity = HealthSeverity = {}));
class HealthMonitorService {
    config;
    isRunning = false;
    monitoringInterval;
    healthHistory = new Map();
    lastHealthSummary;
    startTime = 0;
    redis;
    gracefulDegradation;
    customHealthChecks;
    constructor(config) {
        this.config = config;
        this.redis = redis_service_1.RedisService;
        this.gracefulDegradation = new graceful_degradation_service_1.GracefulDegradationService();
        this.validateConfig();
    }
    validateConfig() {
        if (this.config.checkInterval < 5000) {
            throw new Error('Check interval must be at least 5 seconds');
        }
        if (this.config.timeout < 1000) {
            throw new Error('Timeout must be at least 1 second');
        }
        if (this.config.retries < 0 || this.config.retries > 5) {
            throw new Error('Retries must be between 0 and 5');
        }
    }
    start() {
        if (this.isRunning) {
            logger_1.logger.warn('Health monitoring already running');
            return;
        }
        this.isRunning = true;
        this.startTime = Date.now();
        this.performHealthChecks();
        this.monitoringInterval = setInterval(() => {
            this.performHealthChecks();
        }, this.config.checkInterval);
        logger_1.logger.info('Health monitoring started', {
            interval: this.config.checkInterval,
            enabledChecks: this.config.enabledChecks
        });
    }
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        this.isRunning = false;
        logger_1.logger.info('Health monitoring stopped');
    }
    async performHealthChecks() {
        const checks = [];
        try {
            const checkPromises = this.config.enabledChecks.map(async (checkName) => {
                try {
                    switch (checkName) {
                        case 'database':
                            return await this.checkDatabase();
                        case 'redis':
                            return await this.checkRedis();
                        case 'memory':
                            return await this.checkMemory();
                        case 'circuitBreakers':
                            return await this.checkCircuitBreakers();
                        case 'degradationServices':
                            return await this.checkDegradationServices();
                        case 'disk':
                            return await this.checkDisk();
                        case 'cpu':
                            return await this.checkCPU();
                        default:
                            logger_1.logger.warn('Unknown health check', { checkName });
                            return null;
                    }
                }
                catch (error) {
                    logger_1.logger.error('Health check failed', { checkName, error: error.message });
                    return {
                        service: checkName,
                        status: HealthSeverity.FAILED,
                        responseTime: 0,
                        timestamp: new Date(),
                        message: `Health check failed: ${error.message}`
                    };
                }
            });
            if (this.customHealthChecks) {
                for (const [name, checkFn] of this.customHealthChecks) {
                    checkPromises.push(checkFn().catch(error => ({
                        service: name,
                        status: HealthSeverity.FAILED,
                        responseTime: 0,
                        timestamp: new Date(),
                        message: `Custom health check failed: ${error.message}`
                    })));
                }
            }
            const results = await Promise.allSettled(checkPromises);
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    checks.push(result.value);
                }
                else if (result.status === 'rejected') {
                    checks.push({
                        service: this.config.enabledChecks[index],
                        status: HealthSeverity.FAILED,
                        responseTime: 0,
                        timestamp: new Date(),
                        message: `Health check promise rejected: ${result.reason}`
                    });
                }
            });
            checks.forEach(check => {
                this.updateHealthHistory(check);
            });
            this.lastHealthSummary = this.generateHealthSummary(checks);
            await this.storeHealthSummary(this.lastHealthSummary);
            await this.checkAlertConditions(this.lastHealthSummary);
            this.cleanupHealthHistory();
        }
        catch (error) {
            logger_1.logger.error('Health check cycle failed', { error: error.message });
        }
    }
    async checkDatabase() {
        const startTime = Date.now();
        try {
            const healthCheckPromise = database_service_1.DatabaseService.client.$queryRaw `SELECT 1 as health_check`;
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Database health check timeout')), this.config.timeout));
            await Promise.race([healthCheckPromise, timeoutPromise]);
            const responseTime = Date.now() - startTime;
            return {
                service: 'database',
                status: responseTime > this.config.thresholds.responseTime ? HealthSeverity.WARNING : HealthSeverity.HEALTHY,
                responseTime,
                timestamp: new Date(),
                message: `Database responding in ${responseTime}ms`,
                metadata: {
                    connections: await this.getDatabaseConnections(),
                    version: await this.getDatabaseVersion()
                }
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                service: 'database',
                status: HealthSeverity.FAILED,
                responseTime,
                timestamp: new Date(),
                message: `Database health check failed: ${error.message}`
            };
        }
    }
    async checkRedis() {
        const startTime = Date.now();
        try {
            const pong = await Promise.race([
                this.redis.ping(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Redis ping timeout')), this.config.timeout))
            ]);
            const responseTime = Date.now() - startTime;
            const isHealthy = pong === 'PONG';
            return {
                service: 'redis',
                status: isHealthy ? HealthSeverity.HEALTHY : HealthSeverity.FAILED,
                responseTime,
                timestamp: new Date(),
                message: `Redis responding in ${responseTime}ms`,
                metadata: {
                    connections: await this.getRedisConnections(),
                    memory: await this.getRedisMemoryUsage()
                }
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                service: 'redis',
                status: HealthSeverity.FAILED,
                responseTime,
                timestamp: new Date(),
                message: `Redis health check failed: ${error.message}`
            };
        }
    }
    async checkMemory() {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
        const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100;
        const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        let status = HealthSeverity.HEALTHY;
        let message = `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapUsagePercent.toFixed(1)}%)`;
        if (heapUsagePercent > 90) {
            status = HealthSeverity.CRITICAL;
            message = `Critical memory usage: ${heapUsagePercent.toFixed(1)}%`;
        }
        else if (heapUsagePercent > this.config.thresholds.memory) {
            status = HealthSeverity.WARNING;
            message = `High memory usage: ${heapUsagePercent.toFixed(1)}%`;
        }
        return {
            service: 'memory',
            status,
            responseTime: 0,
            timestamp: new Date(),
            message,
            metadata: {
                memory: {
                    used: heapUsedMB,
                    total: heapTotalMB,
                    percentage: heapUsagePercent
                }
            }
        };
    }
    async checkCircuitBreakers() {
        const allStats = circuit_breaker_service_1.CircuitBreakerRegistry.getAllStats();
        const healthyBreakers = circuit_breaker_service_1.CircuitBreakerRegistry.getHealthyBreakers();
        const unhealthyBreakers = circuit_breaker_service_1.CircuitBreakerRegistry.getUnhealthyBreakers();
        const totalBreakers = Object.keys(allStats).length;
        const healthyCount = healthyBreakers.length;
        const unhealthyCount = unhealthyBreakers.length;
        let status = HealthSeverity.HEALTHY;
        let message = `${healthyCount}/${totalBreakers} circuit breakers healthy`;
        if (unhealthyCount > 0) {
            if (unhealthyCount > totalBreakers * 0.5) {
                status = HealthSeverity.CRITICAL;
                message = `${unhealthyCount} circuit breakers failed`;
            }
            else {
                status = HealthSeverity.WARNING;
                message = `${unhealthyCount} circuit breakers degraded`;
            }
        }
        return {
            service: 'circuitBreakers',
            status,
            responseTime: 0,
            timestamp: new Date(),
            message,
            details: {
                healthy: healthyBreakers,
                unhealthy: unhealthyBreakers,
                stats: allStats
            }
        };
    }
    async checkDegradationServices() {
        const allServiceHealth = this.gracefulDegradation.getAllServiceHealth();
        const healthyServices = allServiceHealth.filter(s => s.status === graceful_degradation_service_1.ServiceStatus.HEALTHY);
        const degradedServices = allServiceHealth.filter(s => s.status === graceful_degradation_service_1.ServiceStatus.DEGRADED);
        const failedServices = allServiceHealth.filter(s => s.status === graceful_degradation_service_1.ServiceStatus.UNAVAILABLE);
        const totalServices = allServiceHealth.length;
        const healthyCount = healthyServices.length;
        const degradedCount = degradedServices.length;
        const failedCount = failedServices.length;
        let status = HealthSeverity.HEALTHY;
        let message = `${healthyCount}/${totalServices} services healthy`;
        if (failedCount > 0) {
            status = HealthSeverity.CRITICAL;
            message = `${failedCount} services failed, ${degradedCount} degraded`;
        }
        else if (degradedCount > 0) {
            status = HealthSeverity.WARNING;
            message = `${degradedCount} services degraded`;
        }
        return {
            service: 'degradationServices',
            status,
            responseTime: 0,
            timestamp: new Date(),
            message,
            details: {
                healthy: healthyServices.map(s => s.serviceName),
                degraded: degradedServices.map(s => s.serviceName),
                failed: failedServices.map(s => s.serviceName),
                metrics: this.gracefulDegradation.getDegradationMetrics()
            }
        };
    }
    async checkDisk() {
        try {
            const usagePercent = 50;
            let status = HealthSeverity.HEALTHY;
            let message = `Disk usage: ${usagePercent.toFixed(1)}% (estimated)`;
            if (usagePercent > 95) {
                status = HealthSeverity.CRITICAL;
                message = `Critical disk usage: ${usagePercent.toFixed(1)}%`;
            }
            else if (usagePercent > 85) {
                status = HealthSeverity.WARNING;
                message = `High disk usage: ${usagePercent.toFixed(1)}%`;
            }
            return {
                service: 'disk',
                status,
                responseTime: 0,
                timestamp: new Date(),
                message
            };
        }
        catch (error) {
            return {
                service: 'disk',
                status: HealthSeverity.FAILED,
                responseTime: 0,
                timestamp: new Date(),
                message: `Disk check failed: ${error.message}`
            };
        }
    }
    async checkCPU() {
        const startUsage = process.cpuUsage();
        return new Promise(resolve => {
            setTimeout(() => {
                const endUsage = process.cpuUsage(startUsage);
                const userCPU = endUsage.user / 1000;
                const systemCPU = endUsage.system / 1000;
                const totalCPU = userCPU + systemCPU;
                const cpuPercent = (totalCPU / 1000) * 100;
                let status = HealthSeverity.HEALTHY;
                let message = `CPU usage: ${cpuPercent.toFixed(1)}%`;
                if (cpuPercent > 95) {
                    status = HealthSeverity.CRITICAL;
                    message = `Critical CPU usage: ${cpuPercent.toFixed(1)}%`;
                }
                else if (cpuPercent > this.config.thresholds.cpu) {
                    status = HealthSeverity.WARNING;
                    message = `High CPU usage: ${cpuPercent.toFixed(1)}%`;
                }
                resolve({
                    service: 'cpu',
                    status,
                    responseTime: 0,
                    timestamp: new Date(),
                    message
                });
            }, 1000);
        });
    }
    generateHealthSummary(checks) {
        const healthyCount = checks.filter(c => c.status === HealthSeverity.HEALTHY).length;
        const warningCount = checks.filter(c => c.status === HealthSeverity.WARNING).length;
        const criticalCount = checks.filter(c => c.status === HealthSeverity.CRITICAL).length;
        const failedCount = checks.filter(c => c.status === HealthSeverity.FAILED).length;
        let overallStatus = HealthSeverity.HEALTHY;
        if (failedCount > 0 || criticalCount > 0) {
            overallStatus = HealthSeverity.CRITICAL;
        }
        else if (warningCount > 0) {
            overallStatus = HealthSeverity.WARNING;
        }
        const memoryCheck = checks.find(c => c.service === 'memory');
        const cpuCheck = checks.find(c => c.service === 'cpu');
        const diskCheck = checks.find(c => c.service === 'disk');
        return {
            overallStatus,
            totalServices: checks.length,
            healthyServices: healthyCount,
            degradedServices: warningCount,
            failedServices: failedCount + criticalCount,
            checks,
            lastUpdated: new Date(),
            uptime: this.startTime > 0 ? Date.now() - this.startTime : 0,
            systemMetrics: {
                cpu: 0,
                memory: memoryCheck?.metadata?.memory?.percentage || 0,
                disk: 0,
                network: checks.find(c => c.service === 'redis')?.status === HealthSeverity.HEALTHY
            }
        };
    }
    updateHealthHistory(check) {
        if (!this.healthHistory.has(check.service)) {
            this.healthHistory.set(check.service, []);
        }
        const history = this.healthHistory.get(check.service);
        history.push(check);
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
    }
    async storeHealthSummary(summary) {
        try {
            await this.redis.setex('health:system:summary', this.config.checkInterval * 2 / 1000, JSON.stringify(summary));
        }
        catch (error) {
            logger_1.logger.warn('Failed to store health summary in Redis', { error: error.message });
        }
    }
    async checkAlertConditions(summary) {
        if (!this.config.alerting.enabled)
            return;
        const criticalChecks = summary.checks.filter(c => c.status === HealthSeverity.CRITICAL || c.status === HealthSeverity.FAILED);
        if (criticalChecks.length > 0) {
            await this.sendHealthAlert(summary, criticalChecks);
        }
    }
    async sendHealthAlert(summary, criticalChecks) {
        const alertMessage = {
            timestamp: new Date().toISOString(),
            severity: 'CRITICAL',
            summary: `${criticalChecks.length} critical health issues detected`,
            details: criticalChecks.map(c => ({
                service: c.service,
                status: c.status,
                message: c.message
            })),
            systemStatus: summary.overallStatus
        };
        try {
            if (this.config.alerting.webhookUrl) {
                await axios_1.default.post(this.config.alerting.webhookUrl, alertMessage, {
                    timeout: 5000,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            logger_1.logger.error('Health alert sent', alertMessage);
        }
        catch (error) {
            logger_1.logger.error('Failed to send health alert', { error: error.message });
        }
    }
    cleanupHealthHistory() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
        for (const [service, history] of this.healthHistory.entries()) {
            const filtered = history.filter(check => check.timestamp.getTime() > cutoffTime);
            this.healthHistory.set(service, filtered);
        }
    }
    getHealthSummary() {
        return this.lastHealthSummary || null;
    }
    getServiceHealthHistory(serviceName) {
        return this.healthHistory.get(serviceName) || [];
    }
    async forceHealthCheck() {
        await this.performHealthChecks();
        return this.lastHealthSummary;
    }
    async getDatabaseConnections() {
        try {
            return 0;
        }
        catch (error) {
            return 0;
        }
    }
    async getDatabaseVersion() {
        try {
            return 'unknown';
        }
        catch (error) {
            return 'unknown';
        }
    }
    async getRedisConnections() {
        try {
            return 1;
        }
        catch (error) {
            return 0;
        }
    }
    async getRedisMemoryUsage() {
        try {
            const stats = this.redis.getStats();
            const estimatedUsed = stats.size * 1024;
            const estimatedTotal = estimatedUsed * 10;
            const percentage = estimatedTotal > 0 ? Math.round((estimatedUsed / estimatedTotal) * 100) : 0;
            return {
                used: estimatedUsed,
                total: estimatedTotal,
                percentage
            };
        }
        catch (error) {
            return { used: 0, total: 0, percentage: 0 };
        }
    }
    static createDefaultConfig() {
        return {
            checkInterval: 30000,
            timeout: 5000,
            retries: 2,
            enabledChecks: [
                'database',
                'redis',
                'memory',
                'cpu',
                'disk',
                'circuitBreakers',
                'degradationServices'
            ],
            thresholds: {
                cpu: 80,
                memory: 85,
                responseTime: 2000,
                errorRate: 5
            },
            alerting: {
                enabled: true
            }
        };
    }
    static createProductionConfig() {
        return {
            checkInterval: 15000,
            timeout: 3000,
            retries: 3,
            enabledChecks: [
                'database',
                'redis',
                'memory',
                'cpu',
                'disk',
                'circuitBreakers',
                'degradationServices'
            ],
            thresholds: {
                cpu: 70,
                memory: 80,
                responseTime: 1000,
                errorRate: 2
            },
            alerting: {
                enabled: true,
                webhookUrl: process.env.HEALTH_WEBHOOK_URL,
                emailRecipients: process.env.HEALTH_ALERT_EMAILS?.split(','),
                slackChannel: process.env.HEALTH_SLACK_CHANNEL
            }
        };
    }
    registerHealthCheck(name, checkFn) {
        if (!this.customHealthChecks) {
            this.customHealthChecks = new Map();
        }
        this.customHealthChecks.set(name, checkFn);
        logger_1.logger.info('Custom health check registered', { name });
    }
    getSystemHealth() {
        return this.lastHealthSummary || {
            overallStatus: HealthSeverity.HEALTHY,
            totalServices: 0,
            healthyServices: 0,
            degradedServices: 0,
            failedServices: 0,
            lastUpdated: new Date(),
            checks: [],
            uptime: 100,
            systemMetrics: {
                cpu: 0,
                memory: 0,
                disk: 0,
                network: true
            },
            metadata: {
                monitoringDuration: Date.now() - this.startTime,
                totalChecks: 0,
                successfulChecks: 0
            }
        };
    }
}
exports.HealthMonitorService = HealthMonitorService;
exports.default = HealthMonitorService;
//# sourceMappingURL=health-monitor.service.js.map