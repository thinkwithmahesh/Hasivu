"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsCollectionService = exports.MetricsCollectionService = void 0;
const redis_service_1 = require("@/services/redis.service");
const logger_1 = require("@/utils/logger");
/**
 * Metrics collection service class
 */
class MetricsCollectionService {
    metricsRetentionHours = 24;
    collectionIntervalMs = 60000; // 1 minute
    metricsBuffer = [];
    collectionTimer;
    constructor() {
        logger_1.logger.info('Metrics collection service initialized', {
            collectionInterval: `${this.collectionIntervalMs / 1000}s`,
            retention: `${this.metricsRetentionHours}h`
        });
    }
    /**
     * Start metrics collection
     */
    startCollection() {
        logger_1.logger.info('Starting metrics collection', {
            interval: `${this.collectionIntervalMs / 1000}s`,
            retention: `${this.metricsRetentionHours}h`
        });
        this.collectionTimer = setInterval(async () => {
            try {
                await this.collectSystemMetrics();
                await this.collectBusinessMetrics();
                await this.collectPerformanceMetrics();
            }
            catch (error) {
                logger_1.logger.error('Error during metrics collection cycle', error);
            }
        }, this.collectionIntervalMs);
    }
    /**
     * Stop metrics collection
     */
    stopCollection() {
        if (this.collectionTimer) {
            clearInterval(this.collectionTimer);
            this.collectionTimer = undefined;
            logger_1.logger.info('Metrics collection stopped');
        }
    }
    /**
     * Collect system metrics
     */
    async collectSystemMetrics() {
        try {
            const memoryUsage = process.memoryUsage();
            const timestamp = new Date();
            const metrics = {
                timestamp,
                cpuUsage: this.getCpuUsage(),
                memoryUsage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
                activeConnections: this.getActiveConnections(),
                requestCount: this.getRequestCount(),
                errorRate: this.getErrorRate(),
                throughput: this.getThroughput()
            };
            // Store metrics in Redis for recent access
            const key = `metrics:system:${Math.floor(timestamp.getTime() / 60000)}`;
            await redis_service_1.RedisService.setex(key, this.metricsRetentionHours * 3600, JSON.stringify(metrics));
            // Store in database for long-term retention
            await this.storeSystemMetrics(metrics);
            logger_1.logger.debug('System metrics collected', { metrics });
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Error collecting system metrics', error);
            throw error;
        }
    }
    /**
     * Collect business metrics
     */
    async collectBusinessMetrics() {
        try {
            const timestamp = new Date();
            const metrics = {
                timestamp,
                users: await this.getUserMetrics(),
                schools: await this.getSchoolMetrics(),
                payments: await this.getPaymentMetrics(),
                rfid: await this.getRfidMetrics(),
                notifications: await this.getNotificationMetrics()
            };
            // Store metrics in Redis for recent access
            const key = `metrics:business:${Math.floor(timestamp.getTime() / 60000)}`;
            await redis_service_1.RedisService.setex(key, this.metricsRetentionHours * 3600, JSON.stringify(metrics));
            // Store in database for long-term retention
            await this.storeBusinessMetrics(metrics);
            logger_1.logger.debug('Business metrics collected', { metrics });
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Error collecting business metrics', error);
            throw error;
        }
    }
    /**
     * Collect performance metrics
     */
    async collectPerformanceMetrics() {
        try {
            const timestamp = new Date();
            const metrics = {
                timestamp,
                database: await this.getDatabaseMetrics(),
                redis: await this.getRedisMetrics(),
                externalServices: await this.getExternalServiceMetrics()
            };
            // Store metrics in Redis for recent access
            const key = `metrics:performance:${Math.floor(timestamp.getTime() / 60000)}`;
            await redis_service_1.RedisService.setex(key, this.metricsRetentionHours * 3600, JSON.stringify(metrics));
            // Store in database for long-term retention
            await this.storePerformanceMetrics(metrics);
            logger_1.logger.debug('Performance metrics collected', { metrics });
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Error collecting performance metrics', error);
            throw error;
        }
    }
    /**
     * Get recent metrics from cache
     */
    async getRecentMetrics(type, minutes = 60) {
        try {
            const now = Date.now();
            const metrics = [];
            for (let i = 0; i < minutes; i++) {
                const timestamp = now - (i * 60000);
                const key = `metrics:${type}:${Math.floor(timestamp / 60000)}`;
                const data = await redis_service_1.RedisService.get(key);
                if (data) {
                    metrics.push(JSON.parse(data));
                }
            }
            return metrics.reverse(); // Return in chronological order
        }
        catch (error) {
            logger_1.logger.error('Error getting recent metrics', error, { type, minutes });
            return [];
        }
    }
    /**
     * Check metric thresholds and trigger alerts
     */
    async checkThresholds(metricName, value, threshold) {
        if (value > threshold) {
            const alertKey = `alert:${metricName}`;
            const existingAlert = await redis_service_1.RedisService.get(alertKey);
            if (!existingAlert) {
                logger_1.logger.warn(`Metrics alert triggered: ${metricName} = ${value} (threshold: ${threshold})`);
                // Set alert flag with expiration
                await redis_service_1.RedisService.setex(alertKey, 300, JSON.stringify({
                    metricName,
                    value,
                    threshold,
                    timestamp: new Date()
                }));
                // Could also send notifications here
                await this.sendAlert(metricName, value, threshold);
            }
        }
        else {
            // Clear alert if value is back within threshold
            const alertKey = `alert:${metricName}`;
            const existingAlert = await redis_service_1.RedisService.get(alertKey);
            if (existingAlert) {
                await redis_service_1.RedisService.del(alertKey);
                logger_1.logger.info(`Metrics alert cleared: ${metricName} = ${value}`);
            }
        }
    }
    /**
     * Send alert notification
     */
    async sendAlert(metricName, value, threshold) {
        try {
            // This would integrate with notification service
            logger_1.logger.warn(`Metrics alert: ${metricName} exceeded threshold`, {
                metric: metricName,
                value,
                threshold,
                timestamp: new Date()
            });
            // Store alert in Redis for dashboard
            const alertKey = `alert:active:${metricName}:${Date.now()}`;
            await redis_service_1.RedisService.setex(alertKey, 3600, JSON.stringify({
                type: 'metrics_threshold',
                severity: value > threshold * 1.5 ? 'high' : 'medium',
                message: `${metricName} is at ${value} (threshold: ${threshold})`,
                timestamp: new Date()
            }));
        }
        catch (error) {
            logger_1.logger.error('Error sending metrics alert', error);
        }
    }
    /**
     * Helper methods for getting specific metrics
     */
    getCpuUsage() {
        // This would require OS-level monitoring (e.g., os.loadavg())
        return Math.random() * 100; // Mock implementation
    }
    getActiveConnections() {
        // This would track actual connection pools
        return Math.floor(Math.random() * 50) + 10; // Mock implementation
    }
    getRequestCount() {
        // This would track actual request counters
        return Math.floor(Math.random() * 1000) + 100; // Mock implementation
    }
    getErrorRate() {
        // This would calculate actual error rates
        return Math.random() * 5; // Mock implementation (0-5%)
    }
    getThroughput() {
        // This would calculate actual throughput
        return Math.floor(Math.random() * 500) + 50; // Mock implementation
    }
    async getUserMetrics() {
        // This would query actual user data
        return {
            active: 150,
            total: 500,
            newToday: 5,
            retention: 85.2
        };
    }
    async getSchoolMetrics() {
        // This would query actual school data
        return {
            active: 25,
            total: 30,
            newThisMonth: 2,
            utilization: 78.5
        };
    }
    async getPaymentMetrics() {
        // This would query actual payment data
        return {
            todayRevenue: 15000,
            todayCount: 85,
            successRate: 98.2,
            avgOrderValue: 176.47
        };
    }
    async getRfidMetrics() {
        // This would query actual RFID data
        return {
            verificationsToday: 320,
            successRate: 99.1,
            activeReaders: 12,
            responseTime: 150
        };
    }
    async getNotificationMetrics() {
        // This would query actual notification data
        return {
            sentToday: 450,
            deliveryRate: 97.8,
            channels: {
                email: 180,
                sms: 120,
                push: 150,
                inApp: 200
            }
        };
    }
    async getDatabaseMetrics() {
        // This would query actual database connection pool
        return {
            connectionPool: {
                active: 1,
                idle: 4,
                total: 5
            },
            queryPerformance: {
                averageTime: 10,
                slowQueries: 0,
                totalQueries: 1000
            }
        };
    }
    async getRedisMetrics() {
        try {
            const health = await redis_service_1.RedisService.getHealth();
            const stats = redis_service_1.RedisService.getStats();
            return {
                connectionStatus: health.connected ? 'connected' : 'disconnected',
                memoryUsage: {
                    used: 1024,
                    peak: 2048,
                    percentage: 50
                },
                operations: {
                    hits: 80,
                    misses: 20,
                    hitRate: 80
                }
            };
        }
        catch (error) {
            return {
                connectionStatus: 'disconnected',
                memoryUsage: { used: 0, peak: 0, percentage: 0 },
                operations: { hits: 0, misses: 0, hitRate: 0 }
            };
        }
    }
    async getExternalServiceMetrics() {
        // This would test actual external services
        return {
            paymentGateway: {
                status: 'online',
                responseTime: 200,
                successRate: 99.2
            },
            notificationService: {
                status: 'online',
                responseTime: 150,
                deliveryRate: 97.8
            },
            rfidSystem: {
                status: 'online',
                responseTime: 100,
                verificationRate: 99.5
            }
        };
    }
    /**
     * Store metrics in database for long-term retention
     */
    async storeSystemMetrics(metrics) {
        try {
            // This would store in actual database table
            logger_1.logger.debug('Storing system metrics in database', { timestamp: metrics.timestamp });
        }
        catch (error) {
            logger_1.logger.error('Error storing system metrics', error);
        }
    }
    async storeBusinessMetrics(metrics) {
        try {
            // This would store in actual database table
            logger_1.logger.debug('Storing business metrics in database', { timestamp: metrics.timestamp });
        }
        catch (error) {
            logger_1.logger.error('Error storing business metrics', error);
        }
    }
    async storePerformanceMetrics(metrics) {
        try {
            // This would store in actual database table
            logger_1.logger.debug('Storing performance metrics in database', { timestamp: metrics.timestamp });
        }
        catch (error) {
            logger_1.logger.error('Error storing performance metrics', error);
        }
    }
    /**
     * Cleanup old metrics from Redis
     */
    async cleanupOldMetrics() {
        try {
            const cutoffTime = Date.now() - (this.metricsRetentionHours * 3600 * 1000);
            const cutoffMinute = Math.floor(cutoffTime / 60000);
            // This would clean up keys older than retention period
            logger_1.logger.debug('Cleaning up old metrics', { cutoffTime: new Date(cutoffTime) });
        }
        catch (error) {
            logger_1.logger.error('Error cleaning up old metrics', error);
        }
    }
    /**
     * Shutdown cleanup
     */
    async shutdown() {
        this.stopCollection();
        await this.cleanupOldMetrics();
        logger_1.logger.info('Metrics collection service shutdown complete');
    }
}
exports.MetricsCollectionService = MetricsCollectionService;
// Export singleton instance
exports.metricsCollectionService = new MetricsCollectionService();
exports.default = exports.metricsCollectionService;
