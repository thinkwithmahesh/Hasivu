"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceService = exports.PerformanceService = void 0;
const logger_1 = require("@/utils/logger");
const redis_service_1 = require("@/services/redis.service");
class PerformanceService {
    redis;
    alerts = new Map();
    monitoringInterval;
    isMonitoring = false;
    collectionIntervalMs = 30000;
    metricsRetentionHours = 72;
    alertCooldowns = new Map();
    baselineMetrics = new Map();
    constructor() {
        this.redis = redis_service_1.RedisService;
        this.initializeDefaultAlerts();
    }
    initializeDefaultAlerts() {
        const defaultAlerts = [
            {
                metricName: 'cpuUsage',
                threshold: 80,
                operator: 'greater_than',
                severity: 'high',
                enabled: true,
                cooldownMs: 300000,
                description: 'High CPU usage detected'
            },
            {
                metricName: 'memoryUsage',
                threshold: 85,
                operator: 'greater_than',
                severity: 'high',
                enabled: true,
                cooldownMs: 300000,
                description: 'High memory usage detected'
            },
            {
                metricName: 'responseTime',
                threshold: 2000,
                operator: 'greater_than',
                severity: 'medium',
                enabled: true,
                cooldownMs: 180000,
                description: 'Slow response time detected'
            },
            {
                metricName: 'errorRate',
                threshold: 5,
                operator: 'greater_than',
                severity: 'critical',
                enabled: true,
                cooldownMs: 60000,
                description: 'High error rate detected'
            },
            {
                metricName: 'activeConnections',
                threshold: 1000,
                operator: 'greater_than',
                severity: 'medium',
                enabled: true,
                cooldownMs: 300000,
                description: 'High number of active connections'
            }
        ];
        defaultAlerts.forEach(alert => {
            this.alerts.set(alert.metricName, alert);
        });
        logger_1.logger.info('Performance monitoring alerts initialized', {
            alertCount: defaultAlerts.length
        });
    }
    startMonitoring() {
        if (this.isMonitoring) {
            logger_1.logger.warn('Performance monitoring already running');
            return;
        }
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(async () => {
            await this.collectMetrics();
        }, this.collectionIntervalMs);
        logger_1.logger.info('Performance monitoring started', {
            interval: `${this.collectionIntervalMs / 1000}s`,
            retention: `${this.metricsRetentionHours}h`
        });
    }
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        this.isMonitoring = false;
        logger_1.logger.info('Performance monitoring stopped');
    }
    async collectMetrics() {
        try {
            const metrics = await this.gatherSystemMetrics();
            await this.storeMetrics(metrics);
            await this.checkAlerts(metrics);
            this.updateBaselines(metrics);
            await this.cleanupOldMetrics();
        }
        catch (error) {
            logger_1.logger.error('Failed to collect performance metrics', {
                error: error.message
            });
        }
    }
    async gatherSystemMetrics() {
        const startTime = Date.now();
        try {
            const cpuUsage = await this.getCPUUsage();
            const memoryUsage = this.getMemoryUsage();
            const dbMetrics = await this.getDatabaseMetrics();
            const redisMetrics = await this.getRedisMetrics();
            const networkLatency = await this.getNetworkLatency();
            const appMetrics = await this.getApplicationMetrics();
            return {
                timestamp: Date.now(),
                cpuUsage: cpuUsage.percentage,
                memoryUsage: memoryUsage.percentage,
                activeConnections: dbMetrics.activeConnections + redisMetrics.connections,
                requestCount: appMetrics.requestCount,
                errorRate: appMetrics.errorRate,
                responseTime: appMetrics.averageResponseTime,
                throughput: appMetrics.throughput,
                diskUsage: await this.getDiskUsage(),
                networkLatency: networkLatency,
                queueSize: appMetrics.queueSize,
                cacheHitRate: redisMetrics.hitRate
            };
        }
        catch (error) {
            logger_1.logger.error('Error gathering system metrics', {
                error: error.message,
                duration: Date.now() - startTime
            });
            return this.getDefaultMetrics();
        }
    }
    async getCPUUsage() {
        return new Promise(resolve => {
            const startUsage = process.cpuUsage();
            setTimeout(() => {
                const endUsage = process.cpuUsage(startUsage);
                const userCPU = endUsage.user / 1000;
                const systemCPU = endUsage.system / 1000;
                const totalCPU = userCPU + systemCPU;
                const percentage = Math.min((totalCPU / 1000) * 100, 100);
                resolve({
                    percentage: Math.round(percentage * 100) / 100,
                    details: { userCPU, systemCPU, totalCPU }
                });
            }, 1000);
        });
    }
    getMemoryUsage() {
        const usage = process.memoryUsage();
        const totalMemory = usage.heapTotal;
        const usedMemory = usage.heapUsed;
        const percentage = (usedMemory / totalMemory) * 100;
        return {
            percentage: Math.round(percentage * 100) / 100,
            details: {
                heapUsed: Math.round(usedMemory / 1024 / 1024 * 100) / 100,
                heapTotal: Math.round(totalMemory / 1024 / 1024 * 100) / 100,
                external: Math.round(usage.external / 1024 / 1024 * 100) / 100,
                rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100
            }
        };
    }
    async getDatabaseMetrics() {
        try {
            const connectionCount = await this.getConnectionCount();
            const queryTime = await this.measureQueryTime();
            return {
                activeConnections: connectionCount,
                averageQueryTime: queryTime,
                connectionPoolUsage: 0
            };
        }
        catch (error) {
            logger_1.logger.warn('Failed to get database metrics', { error: error.message });
            return {
                activeConnections: 0,
                averageQueryTime: 0,
                connectionPoolUsage: 0
            };
        }
    }
    async getRedisMetrics() {
        try {
            const info = typeof this.redis.info === 'function'
                ? await this.redis.info()
                : 'redis_version:unknown\nconnected_clients:0\nkeyspace_hits:0\nkeyspace_misses:0';
            const connections = this.extractRedisMetric(info, 'connected_clients') || 0;
            const hitRate = this.calculateCacheHitRate(info);
            return {
                connections: parseInt(connections.toString()),
                hitRate: hitRate,
                memoryUsage: this.extractRedisMetric(info, 'used_memory') || 0
            };
        }
        catch (error) {
            logger_1.logger.warn('Failed to get Redis metrics', { error: error.message });
            return {
                connections: 0,
                hitRate: 0,
                memoryUsage: 0
            };
        }
    }
    async getNetworkLatency() {
        try {
            const startTime = Date.now();
            await this.redis.ping();
            return Date.now() - startTime;
        }
        catch (error) {
            logger_1.logger.warn('Failed to measure network latency', { error: error.message });
            return 0;
        }
    }
    async getApplicationMetrics() {
        try {
            return {
                requestCount: await this.getRequestCount(),
                errorRate: await this.getErrorRate(),
                averageResponseTime: await this.getAverageResponseTime(),
                throughput: await this.getThroughput(),
                queueSize: await this.getQueueSize()
            };
        }
        catch (error) {
            logger_1.logger.warn('Failed to get application metrics', { error: error.message });
            return {
                requestCount: 0,
                errorRate: 0,
                averageResponseTime: 0,
                throughput: 0,
                queueSize: 0
            };
        }
    }
    async getDiskUsage() {
        try {
            const fs = require('fs');
            const stats = fs.statSync('/');
            const total = stats.size || 1;
            const free = stats.free || 0;
            const used = total - free;
            return Math.round(((used / total) * 100) * 100) / 100;
        }
        catch (error) {
            logger_1.logger.warn('Failed to get disk usage', { error: error.message });
            return 0;
        }
    }
    async storeMetrics(metrics) {
        try {
            const key = `metrics:performance:${Math.floor(metrics.timestamp / 60000)}`;
            const ttl = this.metricsRetentionHours * 3600;
            await this.redis.set(key, JSON.stringify(metrics), ttl);
            if (typeof this.redis.zadd === 'function') {
                await this.redis.zadd('metrics:performance:timeline', metrics.timestamp, JSON.stringify(metrics));
            }
            else {
                logger_1.logger.debug('Redis zadd method not found, skipping sorted set storage');
            }
            const cutoff = Date.now() - (this.metricsRetentionHours * 60 * 60 * 1000);
            if (typeof this.redis.zremrangebyscore === 'function') {
                await this.redis.zremrangebyscore('metrics:performance:timeline', 0, cutoff);
            }
            else {
                logger_1.logger.debug('Redis zremrangebyscore method not found, skipping old entries cleanup');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to store metrics', { error: error.message });
        }
    }
    async checkAlerts(metrics) {
        for (const [metricName, alert] of this.alerts.entries()) {
            if (!alert.enabled)
                continue;
            const metricValue = metrics[metricName];
            const shouldAlert = this.evaluateAlert(metricValue, alert);
            if (shouldAlert) {
                await this.triggerAlert(metricName, metricValue, alert);
            }
            else {
                await this.clearAlert(metricName);
            }
        }
    }
    evaluateAlert(value, alert) {
        switch (alert.operator) {
            case 'greater_than':
                return value > alert.threshold;
            case 'less_than':
                return value < alert.threshold;
            case 'equals':
                return value === alert.threshold;
            default:
                return false;
        }
    }
    async triggerAlert(metricName, value, alert) {
        const now = Date.now();
        const lastAlert = this.alertCooldowns.get(metricName) || 0;
        if (now - lastAlert < alert.cooldownMs) {
            return;
        }
        this.alertCooldowns.set(metricName, now);
        const alertKey = `alert:${metricName}`;
        const isNewAlert = !(await this.redis.exists(alertKey));
        if (isNewAlert) {
            logger_1.logger.warn(`Performance alert triggered: ${metricName}`, {
                metric: metricName,
                value,
                threshold: alert.threshold,
                severity: alert.severity,
                description: alert.description
            });
            await this.redis.set(alertKey, JSON.stringify({
                metric: metricName,
                value,
                threshold: alert.threshold,
                severity: alert.severity,
                triggeredAt: now,
                description: alert.description
            }), 3600);
            await this.sendAlertNotification(alert, value);
        }
    }
    async clearAlert(metricName) {
        const alertKey = `alert:${metricName}`;
        const alertExists = await this.redis.exists(alertKey);
        if (alertExists) {
            await this.redis.del(alertKey);
            logger_1.logger.info(`Performance alert cleared: ${metricName}`);
        }
    }
    async sendAlertNotification(alert, value) {
        try {
            if (alert.webhookUrl) {
                const axios = require('axios');
                await axios.post(alert.webhookUrl, {
                    alert: alert.metricName,
                    value,
                    threshold: alert.threshold,
                    severity: alert.severity,
                    description: alert.description,
                    timestamp: new Date().toISOString()
                }, { timeout: 5000 });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send alert notification', {
                error: error.message,
                alert: alert.metricName
            });
        }
    }
    updateBaselines(metrics) {
        Object.entries(metrics).forEach(([key, value]) => {
            if (key !== 'timestamp' && typeof value === 'number') {
                const baseline = this.baselineMetrics.get(key) || value;
                const newBaseline = (baseline * 0.9) + (value * 0.1);
                this.baselineMetrics.set(key, newBaseline);
            }
        });
    }
    async cleanupOldMetrics() {
        try {
            const cutoff = Date.now() - (this.metricsRetentionHours * 60 * 60 * 1000);
            if (typeof this.redis.zremrangebyscore === 'function') {
                await this.redis.zremrangebyscore('metrics:performance:timeline', 0, cutoff);
            }
            else {
                logger_1.logger.debug('Redis zremrangebyscore method not found, skipping sorted set cleanup');
            }
            logger_1.logger.debug('Old metrics cleaned up', { cutoff: new Date(cutoff) });
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup old metrics', { error: error.message });
        }
    }
    async getPerformanceTrends(metricName, timeframe) {
        const timeframes = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        const startTime = Date.now() - timeframes[timeframe];
        const endTime = Date.now();
        try {
            const rawData = typeof this.redis.zrangebyscore === 'function'
                ? await this.redis.zrangebyscore('metrics:performance:timeline', startTime, endTime)
                : [];
            if (typeof this.redis.zrangebyscore !== 'function') {
                logger_1.logger.debug('Redis zrangebyscore method not found, returning empty data');
            }
            const dataPoints = rawData
                .map(data => {
                try {
                    const parsed = JSON.parse(data);
                    return {
                        timestamp: parsed.timestamp,
                        value: parsed[metricName]
                    };
                }
                catch {
                    return null;
                }
            })
                .filter(point => point !== null);
            if (dataPoints.length === 0) {
                return this.getDefaultTrend(metricName, timeframe);
            }
            const values = dataPoints.map(p => p.value);
            const average = values.reduce((a, b) => a + b, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const trend = this.calculateTrend(dataPoints);
            const sortedValues = [...values].sort((a, b) => a - b);
            const percentileData = {
                p50: this.getPercentile(sortedValues, 50),
                p90: this.getPercentile(sortedValues, 90),
                p95: this.getPercentile(sortedValues, 95),
                p99: this.getPercentile(sortedValues, 99)
            };
            return {
                metricName,
                timeframe,
                dataPoints,
                average,
                min,
                max,
                trend,
                percentileData
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get performance trends', {
                error: error.message,
                metricName,
                timeframe
            });
            return this.getDefaultTrend(metricName, timeframe);
        }
    }
    async performBottleneckAnalysis() {
        try {
            const currentMetrics = await this.gatherSystemMetrics();
            const bottlenecks = [];
            if (currentMetrics.cpuUsage > 80) {
                bottlenecks.push({
                    component: 'CPU',
                    severity: currentMetrics.cpuUsage > 95 ? 'critical' : 'high',
                    impact: currentMetrics.cpuUsage,
                    description: `High CPU usage: ${currentMetrics.cpuUsage.toFixed(1)}%`,
                    recommendations: [
                        'Optimize CPU-intensive operations',
                        'Implement caching to reduce processing',
                        'Consider horizontal scaling',
                        'Profile and optimize hot code paths'
                    ],
                    estimatedFixTime: '2-8 hours'
                });
            }
            if (currentMetrics.memoryUsage > 85) {
                bottlenecks.push({
                    component: 'Memory',
                    severity: currentMetrics.memoryUsage > 95 ? 'critical' : 'high',
                    impact: currentMetrics.memoryUsage,
                    description: `High memory usage: ${currentMetrics.memoryUsage.toFixed(1)}%`,
                    recommendations: [
                        'Identify memory leaks',
                        'Optimize data structures',
                        'Implement memory-efficient algorithms',
                        'Increase available memory'
                    ],
                    estimatedFixTime: '4-12 hours'
                });
            }
            if (currentMetrics.responseTime > 1000) {
                bottlenecks.push({
                    component: 'Response Time',
                    severity: currentMetrics.responseTime > 5000 ? 'critical' : 'medium',
                    impact: currentMetrics.responseTime,
                    description: `Slow response time: ${currentMetrics.responseTime.toFixed(0)}ms`,
                    recommendations: [
                        'Optimize database queries',
                        'Implement caching strategies',
                        'Reduce external API calls',
                        'Optimize business logic'
                    ],
                    estimatedFixTime: '1-6 hours'
                });
            }
            const maxImpact = Math.max(...bottlenecks.map(b => b.impact), 1);
            const overallScore = Math.max(0, 100 - (maxImpact / maxImpact) * 50);
            const recommendedActions = this.generateRecommendedActions(bottlenecks);
            return {
                timestamp: Date.now(),
                bottlenecks,
                overallScore: Math.round(overallScore),
                recommendedActions
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to perform bottleneck analysis', {
                error: error.message
            });
            return {
                timestamp: Date.now(),
                bottlenecks: [],
                overallScore: 100,
                recommendedActions: ['Enable monitoring to detect bottlenecks']
            };
        }
    }
    async getOptimizationRecommendations() {
        const currentMetrics = await this.gatherSystemMetrics();
        const trends = await Promise.all([
            this.getPerformanceTrends('cpuUsage', '24h'),
            this.getPerformanceTrends('memoryUsage', '24h'),
            this.getPerformanceTrends('responseTime', '24h')
        ]);
        const recommendations = [];
        if (currentMetrics.responseTime > 500) {
            recommendations.push({
                id: 'db-query-optimization',
                category: 'database',
                priority: currentMetrics.responseTime > 2000 ? 'critical' : 'high',
                title: 'Database Query Optimization',
                description: 'Optimize slow database queries to improve response times',
                expectedImpact: `Reduce response time by 30-60% (current: ${currentMetrics.responseTime}ms)`,
                implementationEffort: 'medium',
                estimatedTimeToComplete: '2-5 days',
                resources: [
                    'Database performance monitoring tools',
                    'Query execution plan analysis',
                    'Index optimization guidelines'
                ],
                metrics: {
                    before: { responseTime: currentMetrics.responseTime },
                    expectedAfter: { responseTime: currentMetrics.responseTime * 0.5 }
                }
            });
        }
        if (currentMetrics.cacheHitRate < 80) {
            recommendations.push({
                id: 'cache-optimization',
                category: 'cache',
                priority: 'high',
                title: 'Cache Strategy Optimization',
                description: 'Improve caching strategy to reduce database load and improve performance',
                expectedImpact: `Increase cache hit rate to 90%+ (current: ${currentMetrics.cacheHitRate.toFixed(1)}%)`,
                implementationEffort: 'medium',
                estimatedTimeToComplete: '1-3 days',
                resources: [
                    'Redis configuration optimization',
                    'Cache key strategy review',
                    'Cache invalidation logic'
                ],
                metrics: {
                    before: { cacheHitRate: currentMetrics.cacheHitRate },
                    expectedAfter: { cacheHitRate: 90 }
                }
            });
        }
        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    getDefaultMetrics() {
        return {
            timestamp: Date.now(),
            cpuUsage: 0,
            memoryUsage: 0,
            activeConnections: 0,
            requestCount: 0,
            errorRate: 0,
            responseTime: 0,
            throughput: 0,
            diskUsage: 0,
            networkLatency: 0,
            queueSize: 0,
            cacheHitRate: 0
        };
    }
    getDefaultTrend(metricName, timeframe) {
        return {
            metricName,
            timeframe: timeframe,
            dataPoints: [],
            average: 0,
            min: 0,
            max: 0,
            trend: 'stable',
            percentileData: { p50: 0, p90: 0, p95: 0, p99: 0 }
        };
    }
    calculateTrend(dataPoints) {
        if (dataPoints.length < 2)
            return 'stable';
        const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
        const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));
        const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        if (Math.abs(change) < 5)
            return 'stable';
        return change > 0 ? 'degrading' : 'improving';
    }
    getPercentile(sortedValues, percentile) {
        const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
        return sortedValues[Math.max(0, index)] || 0;
    }
    generateRecommendedActions(bottlenecks) {
        const actions = ['Monitor system performance regularly'];
        if (bottlenecks.some(b => b.component === 'CPU')) {
            actions.push('Optimize CPU-intensive operations');
        }
        if (bottlenecks.some(b => b.component === 'Memory')) {
            actions.push('Investigate memory usage patterns');
        }
        if (bottlenecks.some(b => b.component === 'Response Time')) {
            actions.push('Optimize application response times');
        }
        return actions;
    }
    async getConnectionCount() { return 0; }
    async measureQueryTime() { return 0; }
    extractRedisMetric(info, metric) { return 0; }
    calculateCacheHitRate(info) { return 0; }
    async getRequestCount() { return 0; }
    async getErrorRate() { return 0; }
    async getAverageResponseTime() { return 0; }
    async getThroughput() { return 0; }
    async getQueueSize() { return 0; }
    configureAlert(config) {
        this.alerts.set(config.metricName, config);
        logger_1.logger.info('Alert configuration updated', {
            metric: config.metricName,
            threshold: config.threshold,
            severity: config.severity
        });
    }
    async getCurrentMetrics() {
        return await this.gatherSystemMetrics();
    }
    async getDashboardData(params) {
        try {
            const currentMetrics = await this.getCurrentMetrics();
            const trends = await this.getPerformanceTrends('cpu', '1h');
            return {
                currentMetrics,
                trends,
                alerts: Array.from(this.alerts.entries()).map(([key, alert]) => ({
                    metric: key,
                    ...alert
                })),
                summary: {
                    systemHealth: this.calculateHealthScore(currentMetrics),
                    totalAlerts: this.alerts.size,
                    lastUpdated: new Date().toISOString()
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get dashboard data:', error);
            throw new Error('Failed to retrieve dashboard data');
        }
    }
    async getHistoricalData(params) {
        try {
            const { startDate, endDate, metrics = ['cpu', 'memory', 'database'] } = params;
            const historicalData = await Promise.all(metrics.map(async (metric) => {
                const trends = await this.getPerformanceTrends(metric, '24h');
                return {
                    metric,
                    data: trends.dataPoints.filter(point => point.timestamp >= startDate.getTime() &&
                        point.timestamp <= endDate.getTime())
                };
            }));
            return {
                timeRange: { startDate, endDate },
                metrics: historicalData,
                summary: {
                    totalDataPoints: historicalData.reduce((sum, m) => sum + m.data.length, 0),
                    metricsIncluded: metrics
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get historical data:', error);
            throw new Error('Failed to retrieve historical data');
        }
    }
    async getAlerts(params) {
        try {
            const activeAlerts = Array.from(this.alerts.entries()).map(([metric, alert]) => ({
                metric,
                threshold: alert.threshold,
                operator: alert.operator,
                severity: alert.severity,
                description: alert.description,
                isActive: true,
                lastTriggered: alert.lastTriggered
            }));
            return {
                alerts: activeAlerts,
                summary: {
                    total: activeAlerts.length,
                    critical: activeAlerts.filter(a => a.severity === 'critical').length,
                    warning: activeAlerts.filter(a => a.severity === 'warning').length,
                    info: activeAlerts.filter(a => a.severity === 'info').length
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get alerts:', error);
            throw new Error('Failed to retrieve alerts');
        }
    }
    async identifyBottlenecks(params) {
        try {
            const analysis = await this.performBottleneckAnalysis();
            const { threshold = 80, timeWindow = '1h' } = params;
            const bottlenecks = [
                ...(analysis.cpu.usage > threshold ? [{
                        type: 'CPU',
                        severity: analysis.cpu.usage > 90 ? 'critical' : 'warning',
                        value: analysis.cpu.usage,
                        description: 'High CPU usage detected - consider optimizing resource-intensive operations',
                        impact: 'high'
                    }] : []),
                ...(analysis.memory.usage > threshold ? [{
                        type: 'Memory',
                        severity: analysis.memory.usage > 90 ? 'critical' : 'warning',
                        value: analysis.memory.usage,
                        description: 'High memory usage detected - consider memory optimization strategies',
                        impact: 'high'
                    }] : []),
                ...(analysis.database.queryTime && analysis.database.queryTime > 1000 ? [{
                        type: 'Database',
                        severity: 'warning',
                        value: analysis.database.queryTime || 0,
                        description: 'Slow database queries detected',
                        impact: 'medium'
                    }] : [])
            ];
            return {
                bottlenecks,
                summary: {
                    total: bottlenecks.length,
                    critical: bottlenecks.filter(b => b.severity === 'critical').length,
                    warning: bottlenecks.filter(b => b.severity === 'warning').length,
                    analysisTime: new Date().toISOString(),
                    timeWindow
                },
                recommendations: await this.getOptimizationRecommendations()
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to identify bottlenecks:', error);
            throw new Error('Failed to identify bottlenecks');
        }
    }
    async recordMetric(params) {
        try {
            const { name, value, tags = {} } = params;
            const metricData = {
                name,
                value,
                timestamp: Date.now(),
                tags
            };
            const redisClient = this.redis.client;
            if (redisClient && typeof redisClient.zadd === 'function') {
                await redisClient.zadd(`metrics:${name}`, Date.now(), JSON.stringify(metricData));
            }
            else if (typeof this.redis.zadd === 'function') {
                await this.redis.zadd(`metrics:${name}`, Date.now(), JSON.stringify(metricData));
            }
            else {
                logger_1.logger.debug('Redis zadd method not found, skipping metric storage');
            }
            if (redisClient && typeof redisClient.zremrangebyrank === 'function') {
                await redisClient.zremrangebyrank(`metrics:${name}`, 0, -1001);
            }
            else if (typeof this.redis.zremrangebyrank === 'function') {
                await this.redis.zremrangebyrank(`metrics:${name}`, 0, -1001);
            }
            else {
                logger_1.logger.debug('Redis zremrangebyrank method not found, skipping old entries cleanup');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to record metric:', error);
            throw new Error('Failed to record metric');
        }
    }
    async getOptimizationSuggestions(params = {}) {
        try {
            const recommendations = await this.getOptimizationRecommendations();
            return {
                suggestions: recommendations.map(rec => ({
                    category: rec.category,
                    priority: rec.priority,
                    title: rec.title,
                    description: rec.description,
                    estimatedImpact: rec.estimatedImpact,
                    implementationEffort: rec.implementationEffort,
                    steps: rec.steps
                })),
                summary: {
                    total: recommendations.length,
                    highPriority: recommendations.filter(r => r.priority === 'high').length,
                    mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
                    lowPriority: recommendations.filter(r => r.priority === 'low').length,
                    categories: [...new Set(recommendations.map(r => r.category))]
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get optimization suggestions:', error);
            throw new Error('Failed to get optimization suggestions');
        }
    }
    async getSystemHealth(schoolId) {
        try {
            const metrics = await this.getCurrentMetrics();
            const healthScore = this.calculateHealthScore(metrics);
            return {
                overall: {
                    score: healthScore,
                    status: healthScore > 80 ? 'healthy' : healthScore > 60 ? 'warning' : 'critical',
                    timestamp: new Date().toISOString()
                },
                components: {
                    cpu: {
                        status: (metrics.cpu || metrics.cpuUsage || 0) < 80 ? 'healthy' : 'warning',
                        value: metrics.cpu || metrics.cpuUsage || 0,
                        unit: '%'
                    },
                    memory: {
                        status: (metrics.memory || metrics.memoryUsage || 0) < 80 ? 'healthy' : 'warning',
                        value: metrics.memory || metrics.memoryUsage || 0,
                        unit: '%'
                    },
                    database: {
                        status: (metrics.database || metrics.activeConnections || 0) < 80 ? 'healthy' : 'warning',
                        value: metrics.database || metrics.activeConnections || 0,
                        unit: 'connections'
                    },
                    redis: {
                        status: (metrics.redis || 0) < 80 ? 'healthy' : 'warning',
                        value: metrics.redis || 0,
                        unit: '%'
                    }
                },
                alerts: this.alerts.size,
                uptime: process.uptime()
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get system health:', error);
            throw new Error('Failed to get system health');
        }
    }
    calculateHealthScore(metrics) {
        const cpuScore = Math.max(0, 100 - (metrics.cpu || metrics.cpuUsage || 0));
        const memoryScore = Math.max(0, 100 - (metrics.memory || metrics.memoryUsage || 0));
        const dbScore = Math.max(0, 100 - ((metrics.database || metrics.activeConnections || 0) / 100 * 100));
        const redisScore = Math.max(0, 100 - (metrics.redis || 0));
        return Math.round((cpuScore + memoryScore + dbScore + redisScore) / 4);
    }
    getMonitoringStatus() {
        return {
            isRunning: this.isMonitoring,
            interval: this.collectionIntervalMs,
            uptime: this.isMonitoring ? Date.now() : 0
        };
    }
    async exportPerformanceData(timeframe) {
        const metrics = ['cpuUsage', 'memoryUsage', 'responseTime', 'throughput'];
        const trends = await Promise.all(metrics.map(metric => this.getPerformanceTrends(metric, timeframe)));
        return {
            timeframe,
            exportedAt: new Date().toISOString(),
            trends,
            summary: {
                totalDataPoints: trends.reduce((sum, trend) => sum + trend.dataPoints.length, 0),
                timeRange: {
                    start: Math.min(...trends.flatMap(t => t.dataPoints.map(p => p.timestamp))),
                    end: Math.max(...trends.flatMap(t => t.dataPoints.map(p => p.timestamp)))
                }
            }
        };
    }
    static recordRequest(endpoint, responseTime, statusCode) {
        const instance = new PerformanceService();
        const metric = {
            endpoint,
            responseTime,
            statusCode,
            timestamp: Date.now()
        };
        instance.redis.sadd('performance:requests', JSON.stringify(metric));
    }
    static getPerformanceTrends(metricName, timeRange) {
        return {
            metricName,
            dataPoints: [],
            trends: {
                average: 0,
                min: 0,
                max: 0,
                change: 0
            },
            timeRange
        };
    }
    static getHealthStatus() {
        return {
            status: 'healthy',
            metrics: {
                cpu: 0,
                memory: 0,
                responseTime: 0
            },
            timestamp: Date.now()
        };
    }
    static startMonitoring() {
        const instance = new PerformanceService();
        instance.startMonitoring();
    }
    static stopMonitoring() {
    }
}
exports.PerformanceService = PerformanceService;
exports.performanceService = new PerformanceService();
exports.default = PerformanceService;
//# sourceMappingURL=performance.service.js.map