"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessMetricsService = exports.BusinessMetricsService = exports.BusinessMetricCategory = void 0;
/**
 * HASIVU Platform - Business Metrics Collection Service
 * Comprehensive business intelligence and KPI tracking
 * Integrates with CloudWatch for real-time business monitoring
 */
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
const logger_1 = require("@/utils/logger");
const database_service_1 = require("@/services/database.service");
const redis_service_1 = require("@/services/redis.service");
const environment_1 = require("@/config/environment");
/**
 * Business metric categories
 */
var BusinessMetricCategory;
(function (BusinessMetricCategory) {
    BusinessMetricCategory["USER_ENGAGEMENT"] = "UserEngagement";
    BusinessMetricCategory["PAYMENT_PERFORMANCE"] = "PaymentPerformance";
    BusinessMetricCategory["ORDER_FULFILLMENT"] = "OrderFulfillment";
    BusinessMetricCategory["RFID_OPERATIONS"] = "RFIDOperations";
    BusinessMetricCategory["SECURITY_EVENTS"] = "SecurityEvents";
    BusinessMetricCategory["SYSTEM_HEALTH"] = "SystemHealth";
})(BusinessMetricCategory || (exports.BusinessMetricCategory = BusinessMetricCategory = {}));
/**
 * Main business metrics service
 */
class BusinessMetricsService {
    cloudWatchClient;
    metricsBuffer = [];
    FLUSH_INTERVAL = 60000; // 1 minute
    BUFFER_SIZE = 20; // CloudWatch limit
    flushTimer;
    constructor() {
        this.cloudWatchClient = new client_cloudwatch_1.CloudWatchClient({
            region: environment_1.config.aws.region || 'us-west-2'
        });
        // Start periodic buffer flushing
        this.startPeriodicFlush();
    }
    /**
     * Track user engagement metrics
     */
    async trackUserEngagement(userId, action, metadata) {
        try {
            const metrics = [
                {
                    name: 'UserAction',
                    value: 1,
                    unit: 'Count',
                    category: BusinessMetricCategory.USER_ENGAGEMENT,
                    dimensions: [
                        { name: 'Environment', value: environment_1.config.server.nodeEnv },
                        { name: 'Action', value: action }
                    ],
                    metadata: { userId, ...metadata }
                }
            ];
            // Track session duration if available
            if (metadata?.sessionStart) {
                const sessionDuration = Date.now() - metadata.sessionStart;
                metrics.push({
                    name: 'SessionDuration',
                    value: sessionDuration / 1000, // Convert to seconds
                    unit: 'Seconds',
                    category: BusinessMetricCategory.USER_ENGAGEMENT,
                    dimensions: [
                        { name: 'Environment', value: environment_1.config.server.nodeEnv },
                        { name: 'UserId', value: userId }
                    ]
                });
            }
            await this.addMetricsToBuffer(metrics);
            logger_1.logger.info('User engagement tracked', { userId, action, metricsCount: metrics.length });
        }
        catch (error) {
            logger_1.logger.error('Error tracking user engagement', { error, userId, action });
        }
    }
    /**
     * Track payment performance metrics
     */
    async trackPaymentMetrics(orderId, amount, status, paymentMethod, metadata) {
        try {
            const metrics = [
                {
                    name: 'PaymentAttempt',
                    value: 1,
                    unit: 'Count',
                    category: BusinessMetricCategory.PAYMENT_PERFORMANCE,
                    dimensions: [
                        { name: 'Environment', value: environment_1.config.server.nodeEnv },
                        { name: 'Status', value: status },
                        { name: 'PaymentMethod', value: paymentMethod }
                    ],
                    metadata: { orderId, amount, ...metadata }
                },
                {
                    name: 'PaymentAmount',
                    value: amount,
                    unit: 'None',
                    category: BusinessMetricCategory.PAYMENT_PERFORMANCE,
                    dimensions: [
                        { name: 'Environment', value: environment_1.config.server.nodeEnv },
                        { name: 'Currency', value: 'INR' }
                    ]
                }
            ];
            // Track success/failure rates
            if (status === 'success') {
                metrics.push({
                    name: 'PaymentSuccess',
                    value: 1,
                    unit: 'Count',
                    category: BusinessMetricCategory.PAYMENT_PERFORMANCE,
                    dimensions: [
                        { name: 'Environment', value: environment_1.config.server.nodeEnv },
                        { name: 'PaymentMethod', value: paymentMethod }
                    ]
                });
                // Track revenue
                metrics.push({
                    name: 'Revenue',
                    value: amount,
                    unit: 'None',
                    category: BusinessMetricCategory.PAYMENT_PERFORMANCE,
                    dimensions: [
                        { name: 'Environment', value: environment_1.config.server.nodeEnv },
                        { name: 'Period', value: 'Daily' }
                    ]
                });
                metrics.push({
                    name: 'RevenueByMethod',
                    value: amount,
                    unit: 'None',
                    category: BusinessMetricCategory.PAYMENT_PERFORMANCE,
                    dimensions: [
                        { name: 'Environment', value: environment_1.config.server.nodeEnv },
                        { name: 'PaymentMethod', value: paymentMethod }
                    ]
                });
            }
            await this.addMetricsToBuffer(metrics);
            logger_1.logger.info('Payment metrics tracked', { orderId, status, amount, paymentMethod });
        }
        catch (error) {
            logger_1.logger.error('Error tracking payment metrics', { error, orderId, status });
        }
    }
    /**
     * Track order fulfillment metrics
     */
    async trackOrderMetrics(orderId, status, metadata) {
        try {
            const metrics = [
                {
                    name: 'OrderStatus',
                    value: 1,
                    unit: 'Count',
                    category: BusinessMetricCategory.ORDER_FULFILLMENT,
                    dimensions: [
                        { name: 'Environment', value: environment_1.config.server.nodeEnv },
                        { name: 'Status', value: status }
                    ],
                    metadata: { orderId, ...metadata }
                }
            ];
            // Track specific order state metrics
            switch (status) {
                case 'created':
                    metrics.push({
                        name: 'OrdersCreated',
                        value: 1,
                        unit: 'Count',
                        category: BusinessMetricCategory.ORDER_FULFILLMENT,
                        dimensions: [{ name: 'Environment', value: environment_1.config.server.nodeEnv }]
                    });
                    break;
                case 'delivered':
                    metrics.push({
                        name: 'OrdersDelivered',
                        value: 1,
                        unit: 'Count',
                        category: BusinessMetricCategory.ORDER_FULFILLMENT,
                        dimensions: [{ name: 'Environment', value: environment_1.config.server.nodeEnv }]
                    });
                    // Track fulfillment time if available
                    if (metadata?.createdAt) {
                        const fulfillmentTime = Date.now() - new Date(metadata.createdAt).getTime();
                        metrics.push({
                            name: 'FulfillmentTime',
                            value: fulfillmentTime / 1000 / 60, // Convert to minutes
                            unit: 'None',
                            category: BusinessMetricCategory.ORDER_FULFILLMENT,
                            dimensions: [{ name: 'Environment', value: environment_1.config.server.nodeEnv }]
                        });
                    }
                    break;
                case 'cancelled':
                    metrics.push({
                        name: 'OrdersCancelled',
                        value: 1,
                        unit: 'Count',
                        category: BusinessMetricCategory.ORDER_FULFILLMENT,
                        dimensions: [
                            { name: 'Environment', value: environment_1.config.server.nodeEnv },
                            { name: 'Reason', value: metadata?.cancelReason || 'Unknown' }
                        ]
                    });
                    break;
            }
            await this.addMetricsToBuffer(metrics);
            logger_1.logger.info('Order metrics tracked', { orderId, status });
        }
        catch (error) {
            logger_1.logger.error('Error tracking order metrics', { error, orderId, status });
        }
    }
    /**
     * Track RFID operations metrics
     */
    async trackRFIDMetrics(operation, status, metadata) {
        try {
            const metrics = [
                {
                    name: 'RFIDOperation',
                    value: 1,
                    unit: 'Count',
                    category: BusinessMetricCategory.RFID_OPERATIONS,
                    dimensions: [
                        { name: 'Environment', value: environment_1.config.server.nodeEnv },
                        { name: 'Operation', value: operation },
                        { name: 'Status', value: status }
                    ],
                    metadata
                }
            ];
            // Track specific operation metrics
            if (operation === 'verification') {
                metrics.push({
                    name: 'RFIDVerifications',
                    value: 1,
                    unit: 'Count',
                    category: BusinessMetricCategory.RFID_OPERATIONS,
                    dimensions: [{ name: 'Environment', value: environment_1.config.server.nodeEnv }]
                });
                if (status === 'failed') {
                    metrics.push({
                        name: 'RFIDVerificationFailures',
                        value: 1,
                        unit: 'Count',
                        category: BusinessMetricCategory.RFID_OPERATIONS,
                        dimensions: [
                            { name: 'Environment', value: environment_1.config.server.nodeEnv },
                            { name: 'Reason', value: metadata?.failureReason || 'Unknown' }
                        ]
                    });
                }
                // Track verification response time if available
                if (metadata?.responseTime) {
                    metrics.push({
                        name: 'RFIDVerificationResponseTime',
                        value: metadata.responseTime,
                        unit: 'Seconds',
                        category: BusinessMetricCategory.RFID_OPERATIONS,
                        dimensions: [{ name: 'Environment', value: environment_1.config.server.nodeEnv }]
                    });
                }
            }
            await this.addMetricsToBuffer(metrics);
            logger_1.logger.info('RFID metrics tracked', { operation, status });
        }
        catch (error) {
            logger_1.logger.error('Error tracking RFID metrics', { error, operation, status });
        }
    }
    /**
     * Track security events
     */
    async trackSecurityEvent(eventType, severity, metadata) {
        try {
            const metrics = [
                {
                    name: 'SecurityEvent',
                    value: 1,
                    unit: 'Count',
                    category: BusinessMetricCategory.SECURITY_EVENTS,
                    dimensions: [
                        { name: 'Environment', value: environment_1.config.server.nodeEnv },
                        { name: 'EventType', value: eventType },
                        { name: 'Severity', value: severity }
                    ],
                    metadata
                }
            ];
            // Track specific security event metrics
            switch (eventType) {
                case 'failed_login':
                    metrics.push({
                        name: 'FailedLogins',
                        value: 1,
                        unit: 'Count',
                        category: BusinessMetricCategory.SECURITY_EVENTS,
                        dimensions: [{ name: 'Environment', value: environment_1.config.server.nodeEnv }]
                    });
                    break;
                case 'suspicious_activity':
                    metrics.push({
                        name: 'SuspiciousActivities',
                        value: 1,
                        unit: 'Count',
                        category: BusinessMetricCategory.SECURITY_EVENTS,
                        dimensions: [{ name: 'Environment', value: environment_1.config.server.nodeEnv }]
                    });
                    break;
                case 'fraud_attempt':
                    metrics.push({
                        name: 'FraudAttempts',
                        value: 1,
                        unit: 'Count',
                        category: BusinessMetricCategory.SECURITY_EVENTS,
                        dimensions: [{ name: 'Environment', value: environment_1.config.server.nodeEnv }]
                    });
                    break;
                case 'unauthorized_access':
                    metrics.push({
                        name: 'UnauthorizedAccess',
                        value: 1,
                        unit: 'Count',
                        category: BusinessMetricCategory.SECURITY_EVENTS,
                        dimensions: [{ name: 'Environment', value: environment_1.config.server.nodeEnv }]
                    });
                    break;
            }
            // Immediate flush for critical security events
            if (severity === 'critical') {
                await this.flushMetricsBuffer();
            }
            else {
                await this.addMetricsToBuffer(metrics);
            }
            logger_1.logger.security('Security event tracked', { eventType, severity, metadata });
        }
        catch (error) {
            logger_1.logger.error('Error tracking security event', { error, eventType, severity });
        }
    }
    /**
     * Calculate and track system health score
     */
    async calculateSystemHealthScore() {
        try {
            // This would calculate health based on various system metrics
            const healthScore = 95.5; // Mock implementation
            await this.addMetricsToBuffer([{
                    name: 'SystemHealthScore',
                    value: healthScore,
                    unit: 'Percent',
                    category: BusinessMetricCategory.SYSTEM_HEALTH,
                    dimensions: [{ name: 'Environment', value: environment_1.config.server.nodeEnv }],
                    metadata: {
                        calculatedAt: new Date(),
                        components: ['database', 'redis', 'external_services']
                    }
                }]);
            return healthScore;
        }
        catch (error) {
            logger_1.logger.error('Error calculating system health score', { error });
            return 0;
        }
    }
    /**
     * Generate KPI report
     */
    async generateKPIReport(timeWindow) {
        try {
            const kpis = [];
            // Calculate payment success rate
            const paymentSuccessRate = await this.calculatePaymentSuccessRate(timeWindow);
            kpis.push({
                name: 'Payment Success Rate',
                current: paymentSuccessRate.current,
                previous: paymentSuccessRate.previous || 0,
                change: paymentSuccessRate.change || 0,
                trend: paymentSuccessRate.trend || 'stable',
                target: 99.0,
                unit: '%',
                period: timeWindow
            });
            // Calculate order completion rate
            const orderCompletionRate = await this.calculateOrderCompletionRate(timeWindow);
            kpis.push({
                name: 'Order Completion Rate',
                current: orderCompletionRate.current,
                previous: orderCompletionRate.previous || 0,
                change: orderCompletionRate.change || 0,
                trend: orderCompletionRate.trend || 'stable',
                target: 95.0,
                unit: '%',
                period: timeWindow
            });
            // Calculate RFID verification rate
            const rfidVerificationRate = await this.calculateRFIDVerificationRate(timeWindow);
            kpis.push({
                name: 'RFID Verification Rate',
                current: rfidVerificationRate.current,
                previous: rfidVerificationRate.previous || 0,
                change: rfidVerificationRate.change || 0,
                trend: rfidVerificationRate.trend || 'stable',
                target: 99.5,
                unit: '%',
                period: timeWindow
            });
            // Calculate user satisfaction score (based on system performance)
            const userSatisfactionScore = await this.calculateUserSatisfactionScore(timeWindow);
            kpis.push({
                name: 'User Satisfaction Score',
                current: userSatisfactionScore.current,
                previous: userSatisfactionScore.previous || 0,
                change: userSatisfactionScore.change || 0,
                trend: userSatisfactionScore.trend || 'stable',
                target: 90.0,
                unit: 'Score',
                period: timeWindow
            });
            logger_1.logger.info('KPI report generated', { timeWindow, kpisCount: kpis.length });
            return kpis;
        }
        catch (error) {
            logger_1.logger.error('Error generating KPI report', { error, timeWindow });
            return [];
        }
    }
    /**
     * Add metrics to buffer
     */
    async addMetricsToBuffer(metrics) {
        const metricData = metrics.map(metric => ({
            MetricName: metric.name,
            Value: metric.value,
            Unit: metric.unit,
            Timestamp: metric.timestamp || new Date(),
            Dimensions: metric.dimensions?.map(dim => ({
                Name: dim.name,
                Value: dim.value
            }))
        }));
        this.metricsBuffer.push(...metricData);
        // Auto-flush if buffer is getting full
        if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
            await this.flushMetricsBuffer();
        }
    }
    /**
     * Flush metrics buffer to CloudWatch
     */
    async flushMetricsBuffer() {
        if (this.metricsBuffer.length === 0)
            return;
        try {
            const metricData = [...this.metricsBuffer];
            // Split into chunks of 20 (CloudWatch limit)
            const chunks = this.chunkArray(metricData, 20);
            for (const chunk of chunks) {
                const command = new client_cloudwatch_1.PutMetricDataCommand({
                    Namespace: 'HASIVU/BusinessMetrics',
                    MetricData: chunk
                });
                await this.cloudWatchClient.send(command);
            }
            logger_1.logger.info('Metrics flushed to CloudWatch', { count: metricData.length });
            // Clear buffer
            this.metricsBuffer = [];
        }
        catch (error) {
            logger_1.logger.error('Error flushing metrics to CloudWatch', error);
            // Keep metrics in buffer for retry
        }
    }
    /**
     * Start periodic buffer flushing
     */
    startPeriodicFlush() {
        this.flushTimer = setInterval(async () => {
            await this.flushMetricsBuffer();
        }, this.FLUSH_INTERVAL);
    }
    /**
     * Stop periodic buffer flushing
     */
    stopPeriodicFlush() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = undefined;
        }
    }
    /**
     * Utility function to chunk array
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    /**
     * Health check methods
     */
    async checkDatabaseHealth() {
        try {
            await database_service_1.DatabaseService.client.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async checkCacheHealth() {
        try {
            await redis_service_1.RedisService.ping();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async checkPaymentSystemHealth() {
        // This would check payment gateway connectivity
        return true; // Mock implementation
    }
    async checkRFIDSystemHealth() {
        // This would check RFID system connectivity
        return true; // Mock implementation
    }
    /**
     * KPI calculation methods (stubbed for brevity)
     */
    async calculatePaymentSuccessRate(timeWindow) {
        // This would calculate actual payment success rate from metrics
        return { current: 98.2, trend: 'up', change: 0.3 };
    }
    async calculateOrderCompletionRate(timeWindow) {
        // This would calculate actual order completion rate from metrics
        return { current: 96.1, trend: 'stable', change: 0.1 };
    }
    async calculateRFIDVerificationRate(timeWindow) {
        // This would calculate actual RFID verification rate from metrics
        return { current: 99.2, trend: 'up', change: 0.2 };
    }
    async calculateUserSatisfactionScore(timeWindow) {
        // This would calculate user satisfaction based on various metrics
        return { current: 94.8, trend: 'down', change: -0.5 };
    }
    /**
     * Cleanup on service shutdown
     */
    async shutdown() {
        this.stopPeriodicFlush();
        await this.flushMetricsBuffer();
        logger_1.logger.info('Business metrics service shutdown complete');
    }
}
exports.BusinessMetricsService = BusinessMetricsService;
// Export singleton instance
exports.businessMetricsService = new BusinessMetricsService();
// Graceful shutdown handling
process.on('SIGTERM', async () => {
    await exports.businessMetricsService.shutdown();
});
process.on('SIGINT', async () => {
    await exports.businessMetricsService.shutdown();
});
exports.default = exports.businessMetricsService;
