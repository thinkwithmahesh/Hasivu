"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionMonitoringService = void 0;
class ProductionMonitoringService {
    metrics = new Map();
    performanceData;
    alerts = [];
    responseTimes = [];
    thresholds;
    alertCooldowns = new Map();
    constructor(thresholds) {
        this.thresholds = {
            responseTime: { warning: 1000, critical: 5000 },
            errorRate: { warning: 5, critical: 15 },
            memoryUsage: { warning: 80, critical: 95 },
            cacheHitRate: { warning: 70, critical: 50 },
            ...thresholds,
        };
        this.performanceData = {
            timestamp: Date.now(),
            operations: {
                total: 0,
                cache: { hits: 0, misses: 0, sets: 0, gets: 0, hitRate: 0 },
                database: { queries: 0, avgResponseTime: 0, slowQueries: 0, errorRate: 0 },
                api: {
                    requests: 0,
                    avgResponseTime: 0,
                    errors: 0,
                    errorRate: 0,
                    p95ResponseTime: 0,
                    p99ResponseTime: 0,
                },
            },
            throughput: {
                requestsPerSecond: 0,
                operationsPerSecond: 0,
            },
            memory: {
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
                rss: 0,
            },
            alerts: [],
        };
    }
    async getSystemMetrics() {
        return {
            cpu: {
                usage: Math.random() * 100,
                loadAverage: [1.2, 1.5, 1.8],
            },
            memory: {
                used: process.memoryUsage().heapUsed,
                total: process.memoryUsage().heapTotal,
                heapUsed: process.memoryUsage().heapUsed,
                heapTotal: process.memoryUsage().heapTotal,
            },
            uptime: process.uptime(),
            timestamp: Date.now(),
        };
    }
    async getPerformanceMetrics() {
        return {
            ...this.performanceData,
            timestamp: Date.now(),
        };
    }
    async logMetric(name, value) {
        this.metrics.set(name, {
            value,
            timestamp: Date.now(),
        });
        if (name.includes('cache')) {
            this.performanceData.operations.cache.sets++;
        }
        else if (name.includes('db') || name.includes('database')) {
            this.performanceData.operations.database.queries++;
        }
        else if (name.includes('api')) {
            this.performanceData.operations.api.requests++;
        }
        this.performanceData.operations.total++;
    }
    async getMetric(name) {
        return this.metrics.get(name);
    }
    async getAllMetrics() {
        const result = {};
        for (const [key, value] of this.metrics.entries()) {
            result[key] = value;
        }
        return result;
    }
    async clearMetrics() {
        this.metrics.clear();
        this.alerts = [];
        this.responseTimes = [];
        this.alertCooldowns.clear();
        this.performanceData = {
            timestamp: Date.now(),
            operations: {
                total: 0,
                cache: { hits: 0, misses: 0, sets: 0, gets: 0, hitRate: 0 },
                database: { queries: 0, avgResponseTime: 0, slowQueries: 0, errorRate: 0 },
                api: {
                    requests: 0,
                    avgResponseTime: 0,
                    errors: 0,
                    errorRate: 0,
                    p95ResponseTime: 0,
                    p99ResponseTime: 0,
                },
            },
            throughput: {
                requestsPerSecond: 0,
                operationsPerSecond: 0,
            },
            memory: {
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
                rss: 0,
            },
            alerts: [],
        };
    }
    async recordCacheHit() {
        this.performanceData.operations.cache.hits++;
        this.performanceData.operations.total++;
    }
    async recordCacheMiss() {
        this.performanceData.operations.cache.misses++;
        this.performanceData.operations.total++;
    }
    async recordApiRequest(responseTime, isError = false) {
        const currentRequests = this.performanceData.operations.api.requests;
        const currentAvg = this.performanceData.operations.api.avgResponseTime;
        this.performanceData.operations.api.requests++;
        this.performanceData.operations.api.avgResponseTime =
            (currentAvg * currentRequests + responseTime) / (currentRequests + 1);
        if (isError) {
            this.performanceData.operations.api.errors++;
        }
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > 1000) {
            this.responseTimes = this.responseTimes.slice(-1000);
        }
        if (this.responseTimes.length >= 10) {
            const sorted = [...this.responseTimes].sort((a, b) => a - b);
            this.performanceData.operations.api.p95ResponseTime =
                sorted[Math.floor(sorted.length * 0.95)];
            this.performanceData.operations.api.p99ResponseTime =
                sorted[Math.floor(sorted.length * 0.99)];
        }
        this.performanceData.operations.api.errorRate =
            (this.performanceData.operations.api.errors / this.performanceData.operations.api.requests) *
                100;
        this.performanceData.operations.total++;
        await this.checkPerformanceAlerts();
    }
    async recordDatabaseQuery(responseTime, isError = false) {
        const currentQueries = this.performanceData.operations.database.queries;
        const currentAvg = this.performanceData.operations.database.avgResponseTime;
        this.performanceData.operations.database.queries++;
        this.performanceData.operations.database.avgResponseTime =
            (currentAvg * currentQueries + responseTime) / (currentQueries + 1);
        if (responseTime > 1000) {
            this.performanceData.operations.database.slowQueries++;
        }
        if (isError) {
            this.performanceData.operations.database.errorRate =
                ((this.performanceData.operations.database.errorRate * currentQueries + 1) /
                    (currentQueries + 1)) *
                    100;
        }
        this.performanceData.operations.total++;
    }
    async recordCacheOperation(operation) {
        switch (operation) {
            case 'hit':
                this.performanceData.operations.cache.hits++;
                break;
            case 'miss':
                this.performanceData.operations.cache.misses++;
                break;
            case 'set':
                this.performanceData.operations.cache.sets++;
                break;
            case 'get':
                this.performanceData.operations.cache.gets++;
                break;
        }
        const totalGets = this.performanceData.operations.cache.hits + this.performanceData.operations.cache.misses;
        if (totalGets > 0) {
            this.performanceData.operations.cache.hitRate =
                (this.performanceData.operations.cache.hits / totalGets) * 100;
        }
        this.performanceData.operations.total++;
    }
    async updateMemoryMetrics() {
        const memUsage = process.memoryUsage();
        this.performanceData.memory = {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss,
        };
    }
    async checkPerformanceAlerts() {
        const now = Date.now();
        if (this.performanceData.operations.api.avgResponseTime > this.thresholds.responseTime.critical) {
            await this.createAlert('critical', 'High average response time', 'api_response_time', this.performanceData.operations.api.avgResponseTime, this.thresholds.responseTime.critical);
        }
        else if (this.performanceData.operations.api.avgResponseTime > this.thresholds.responseTime.warning) {
            await this.createAlert('warning', 'Elevated average response time', 'api_response_time', this.performanceData.operations.api.avgResponseTime, this.thresholds.responseTime.warning);
        }
        if (this.performanceData.operations.api.errorRate > this.thresholds.errorRate.critical) {
            await this.createAlert('critical', 'High error rate detected', 'api_error_rate', this.performanceData.operations.api.errorRate, this.thresholds.errorRate.critical);
        }
        else if (this.performanceData.operations.api.errorRate > this.thresholds.errorRate.warning) {
            await this.createAlert('warning', 'Elevated error rate', 'api_error_rate', this.performanceData.operations.api.errorRate, this.thresholds.errorRate.warning);
        }
        const memoryUsagePercent = (this.performanceData.memory.heapUsed / this.performanceData.memory.heapTotal) * 100;
        if (memoryUsagePercent > this.thresholds.memoryUsage.critical) {
            await this.createAlert('critical', 'Critical memory usage', 'memory_usage', memoryUsagePercent, this.thresholds.memoryUsage.critical);
        }
        else if (memoryUsagePercent > this.thresholds.memoryUsage.warning) {
            await this.createAlert('warning', 'High memory usage', 'memory_usage', memoryUsagePercent, this.thresholds.memoryUsage.warning);
        }
        if (this.performanceData.operations.cache.hitRate < this.thresholds.cacheHitRate.critical) {
            await this.createAlert('critical', 'Low cache hit rate', 'cache_hit_rate', this.performanceData.operations.cache.hitRate, this.thresholds.cacheHitRate.critical);
        }
        else if (this.performanceData.operations.cache.hitRate < this.thresholds.cacheHitRate.warning) {
            await this.createAlert('warning', 'Low cache hit rate', 'cache_hit_rate', this.performanceData.operations.cache.hitRate, this.thresholds.cacheHitRate.warning);
        }
    }
    async createAlert(type, message, metric, value, threshold) {
        const alertKey = `${metric}_${type}`;
        const lastAlertTime = this.alertCooldowns.get(alertKey) || 0;
        const cooldownPeriod = 5 * 60 * 1000;
        if (Date.now() - lastAlertTime < cooldownPeriod) {
            return;
        }
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            message,
            metric,
            value,
            threshold,
            timestamp: Date.now(),
            resolved: false,
        };
        this.alerts.push(alert);
        this.alertCooldowns.set(alertKey, Date.now());
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }
        this.performanceData.alerts = this.alerts.filter(a => !a.resolved);
    }
    async getActiveAlerts() {
        return this.alerts.filter(alert => !alert.resolved);
    }
    async resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            return true;
        }
        return false;
    }
    async getHealthStatus() {
        await this.updateMemoryMetrics();
        const issues = [];
        const recommendations = [];
        let score = 100;
        if (this.performanceData.operations.api.avgResponseTime > this.thresholds.responseTime.critical) {
            issues.push('Critical response time');
            recommendations.push('Optimize database queries and implement caching');
            score -= 30;
        }
        else if (this.performanceData.operations.api.avgResponseTime > this.thresholds.responseTime.warning) {
            issues.push('High response time');
            recommendations.push('Review query performance and consider caching');
            score -= 15;
        }
        if (this.performanceData.operations.api.errorRate > this.thresholds.errorRate.critical) {
            issues.push('Critical error rate');
            recommendations.push('Investigate error sources and implement circuit breakers');
            score -= 25;
        }
        else if (this.performanceData.operations.api.errorRate > this.thresholds.errorRate.warning) {
            issues.push('High error rate');
            recommendations.push('Monitor error patterns and improve error handling');
            score -= 10;
        }
        const memoryUsagePercent = (this.performanceData.memory.heapUsed / this.performanceData.memory.heapTotal) * 100;
        if (memoryUsagePercent > this.thresholds.memoryUsage.critical) {
            issues.push('Critical memory usage');
            recommendations.push('Optimize memory usage and consider scaling');
            score -= 20;
        }
        else if (memoryUsagePercent > this.thresholds.memoryUsage.warning) {
            issues.push('High memory usage');
            recommendations.push('Monitor memory leaks and optimize data structures');
            score -= 10;
        }
        if (this.performanceData.operations.cache.hitRate < this.thresholds.cacheHitRate.critical) {
            issues.push('Poor cache performance');
            recommendations.push('Review cache strategy and warm frequently accessed data');
            score -= 15;
        }
        else if (this.performanceData.operations.cache.hitRate < this.thresholds.cacheHitRate.warning) {
            issues.push('Low cache hit rate');
            recommendations.push('Optimize cache keys and increase cache TTL');
            score -= 5;
        }
        let status = 'healthy';
        if (score < 70) {
            status = 'critical';
        }
        else if (score < 85) {
            status = 'warning';
        }
        return {
            status,
            score: Math.max(0, score),
            issues,
            recommendations,
        };
    }
}
exports.ProductionMonitoringService = ProductionMonitoringService;
//# sourceMappingURL=production-monitoring.service.js.map