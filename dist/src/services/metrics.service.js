"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsService = void 0;
const cloudwatch_service_1 = require("./cloudwatch.service");
const cloudwatch_config_1 = require("../config/cloudwatch.config");
class MetricsService {
    async trackPayment(metrics) {
        try {
            await cloudwatch_service_1.cloudwatchService.trackPaymentTransaction(metrics.status, metrics.amount);
            await cloudwatch_service_1.cloudwatchService.putMetric({
                metricName: 'PaymentProcessingTime',
                value: metrics.processingTime,
                unit: 'Milliseconds',
                dimensions: {
                    Gateway: metrics.gateway,
                    Status: metrics.status,
                },
                namespace: 'HASIVU/Business',
            });
            if (metrics.status === 'success' || metrics.status === 'failed') {
                const successRate = metrics.status === 'success' ? 100 : 0;
                await cloudwatch_service_1.cloudwatchService.trackBusinessMetric(cloudwatch_config_1.MetricNames.PAYMENT_SUCCESS_RATE, successRate, {
                    Gateway: metrics.gateway,
                });
            }
            await cloudwatch_service_1.cloudwatchService.logBusinessEvent('Payment transaction processed', {
                transactionId: metrics.transactionId,
                amount: metrics.amount,
                currency: metrics.currency,
                status: metrics.status,
                gateway: metrics.gateway,
                processingTime: metrics.processingTime,
            });
        }
        catch (error) {
            console.error('Error tracking payment metrics:', error);
            await cloudwatch_service_1.cloudwatchService.logError(error, { context: 'trackPayment', metrics });
        }
    }
    async trackOrderCreation(metrics) {
        try {
            await cloudwatch_service_1.cloudwatchService.trackOrder('created', metrics.orderId);
            await cloudwatch_service_1.cloudwatchService.trackBusinessMetric('OrderValue', metrics.totalAmount, {
                SchoolId: metrics.schoolId,
                Currency: 'INR',
            });
            await cloudwatch_service_1.cloudwatchService.trackBusinessMetric('ItemsPerOrder', metrics.itemCount, {
                SchoolId: metrics.schoolId,
            });
            await cloudwatch_service_1.cloudwatchService.putMetric({
                metricName: 'OrderProcessingTime',
                value: metrics.processingTime,
                unit: 'Milliseconds',
                dimensions: {
                    SchoolId: metrics.schoolId,
                },
                namespace: 'HASIVU/Business',
            });
            await cloudwatch_service_1.cloudwatchService.logBusinessEvent('Order created', {
                orderId: metrics.orderId,
                userId: metrics.userId,
                schoolId: metrics.schoolId,
                totalAmount: metrics.totalAmount,
                itemCount: metrics.itemCount,
            });
        }
        catch (error) {
            console.error('Error tracking order creation metrics:', error);
            await cloudwatch_service_1.cloudwatchService.logError(error, { context: 'trackOrderCreation', metrics });
        }
    }
    async trackOrderCompletion(orderId, deliveryTime) {
        try {
            await cloudwatch_service_1.cloudwatchService.trackOrder('completed', orderId);
            await cloudwatch_service_1.cloudwatchService.putMetric({
                metricName: 'DeliveryTime',
                value: deliveryTime,
                unit: 'Milliseconds',
                namespace: 'HASIVU/Business',
            });
            await cloudwatch_service_1.cloudwatchService.logBusinessEvent('Order completed', {
                orderId,
                deliveryTime,
            });
        }
        catch (error) {
            console.error('Error tracking order completion metrics:', error);
        }
    }
    async trackOrderCancellation(orderId, reason, refundAmount) {
        try {
            await cloudwatch_service_1.cloudwatchService.trackOrder('cancelled', orderId);
            await cloudwatch_service_1.cloudwatchService.trackBusinessMetric('OrderCancellations', 1, {
                Reason: reason,
            });
            if (refundAmount) {
                await cloudwatch_service_1.cloudwatchService.trackBusinessMetric('RefundAmount', refundAmount, {
                    Currency: 'INR',
                });
            }
            await cloudwatch_service_1.cloudwatchService.logBusinessEvent('Order cancelled', {
                orderId,
                reason,
                refundAmount,
            });
        }
        catch (error) {
            console.error('Error tracking order cancellation metrics:', error);
        }
    }
    async trackRFID(metrics) {
        try {
            await cloudwatch_service_1.cloudwatchService.trackRFIDOperation(metrics.operation, metrics.status);
            await cloudwatch_service_1.cloudwatchService.putMetric({
                metricName: 'RFIDProcessingTime',
                value: metrics.processingTime,
                unit: 'Milliseconds',
                dimensions: {
                    Operation: metrics.operation,
                    Status: metrics.status,
                    ...(metrics.location && { Location: metrics.location }),
                },
                namespace: 'HASIVU/Business',
            });
            if (metrics.operation === 'verification' && metrics.status === 'failed') {
                await cloudwatch_service_1.cloudwatchService.trackBusinessMetric(cloudwatch_config_1.MetricNames.FAILED_VERIFICATIONS, 1);
            }
            await cloudwatch_service_1.cloudwatchService.logBusinessEvent('RFID operation', {
                rfidTag: metrics.rfidTag,
                operation: metrics.operation,
                status: metrics.status,
                location: metrics.location,
            });
        }
        catch (error) {
            console.error('Error tracking RFID metrics:', error);
        }
    }
    async trackUserActivity(metrics) {
        try {
            await cloudwatch_service_1.cloudwatchService.trackBusinessMetric('UserActivity', 1, {
                Action: metrics.action,
                ...(metrics.deviceType && { DeviceType: metrics.deviceType }),
            });
            if (metrics.action === 'logout' && metrics.sessionDuration) {
                await cloudwatch_service_1.cloudwatchService.putMetric({
                    metricName: 'SessionDuration',
                    value: metrics.sessionDuration,
                    unit: 'Milliseconds',
                    namespace: 'HASIVU/Business',
                });
            }
            if (metrics.action === 'login') {
                await cloudwatch_service_1.cloudwatchService.trackBusinessMetric(cloudwatch_config_1.MetricNames.ACTIVE_USERS, 1);
            }
        }
        catch (error) {
            console.error('Error tracking user activity metrics:', error);
        }
    }
    async trackApiRequest(metrics) {
        try {
            await cloudwatch_service_1.cloudwatchService.trackApiPerformance(metrics.endpoint, metrics.duration, metrics.statusCode);
            await cloudwatch_service_1.cloudwatchService.putMetric({
                metricName: 'ApiRequestsByMethod',
                value: 1,
                unit: 'Count',
                dimensions: {
                    Method: metrics.method,
                    Endpoint: metrics.endpoint,
                    StatusCode: metrics.statusCode.toString(),
                },
                namespace: 'HASIVU/Application',
            });
            if (metrics.duration > 1000) {
                await cloudwatch_service_1.cloudwatchService.putMetric({
                    metricName: 'SlowApiRequests',
                    value: 1,
                    unit: 'Count',
                    dimensions: {
                        Endpoint: metrics.endpoint,
                    },
                    namespace: 'HASIVU/Application',
                });
            }
        }
        catch (error) {
            console.error('Error tracking API performance metrics:', error);
        }
    }
    async trackSystemHealth(metrics) {
        try {
            await cloudwatch_service_1.cloudwatchService.trackSystemHealth(metrics.overallScore);
            for (const [component, health] of Object.entries(metrics.components)) {
                await cloudwatch_service_1.cloudwatchService.putMetric({
                    metricName: 'ComponentHealth',
                    value: health.healthy ? 100 : 0,
                    unit: 'Percent',
                    dimensions: {
                        Component: component,
                    },
                    namespace: 'HASIVU/Infrastructure',
                });
                if (component === 'api' && 'responseTime' in health) {
                    await cloudwatch_service_1.cloudwatchService.putMetric({
                        metricName: 'ComponentResponseTime',
                        value: health.responseTime,
                        unit: 'Milliseconds',
                        dimensions: {
                            Component: component,
                        },
                        namespace: 'HASIVU/Infrastructure',
                    });
                }
                if (component === 'cache' && 'hitRate' in health) {
                    await cloudwatch_service_1.cloudwatchService.putMetric({
                        metricName: cloudwatch_config_1.MetricNames.CACHE_HIT_RATE,
                        value: health.hitRate,
                        unit: 'Percent',
                        dimensions: {
                            Component: component,
                        },
                        namespace: 'HASIVU/Infrastructure',
                    });
                }
                if (component === 'payment' && 'successRate' in health) {
                    await cloudwatch_service_1.cloudwatchService.trackBusinessMetric(cloudwatch_config_1.MetricNames.PAYMENT_SUCCESS_RATE, health.successRate);
                }
            }
            await cloudwatch_service_1.cloudwatchService.logApplication('INFO', 'System health check completed', {
                overallScore: metrics.overallScore,
                components: metrics.components,
            });
        }
        catch (error) {
            console.error('Error tracking system health metrics:', error);
        }
    }
    async trackSecurityEvent(eventType, userId, details) {
        try {
            await cloudwatch_service_1.cloudwatchService.trackSecurityEvent(eventType, userId);
            await cloudwatch_service_1.cloudwatchService.logSecurityEvent(`Security event: ${eventType}`, {
                eventType,
                userId,
                ...details,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error('Error tracking security event:', error);
        }
    }
    async trackCostMetric(service, estimatedCost) {
        try {
            await cloudwatch_service_1.cloudwatchService.trackCost(service, estimatedCost);
        }
        catch (error) {
            console.error('Error tracking cost metric:', error);
        }
    }
    async calculateRevenueMetrics(totalRevenue, transactionCount) {
        try {
            const revenuePerTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;
            await cloudwatch_service_1.cloudwatchService.trackBusinessMetric(cloudwatch_config_1.MetricNames.REVENUE_PER_TRANSACTION, revenuePerTransaction, {
                Currency: 'INR',
            });
            await cloudwatch_service_1.cloudwatchService.logBusinessEvent('Revenue metrics calculated', {
                totalRevenue,
                transactionCount,
                revenuePerTransaction,
            });
        }
        catch (error) {
            console.error('Error calculating revenue metrics:', error);
        }
    }
    async trackDatabasePerformance(queryType, duration, success, rowCount) {
        try {
            await cloudwatch_service_1.cloudwatchService.trackDatabaseQuery(queryType, duration, success);
            if (rowCount !== undefined) {
                await cloudwatch_service_1.cloudwatchService.putMetric({
                    metricName: 'DatabaseRowsAffected',
                    value: rowCount,
                    unit: 'Count',
                    dimensions: {
                        QueryType: queryType,
                    },
                    namespace: 'HASIVU/Database',
                });
            }
        }
        catch (error) {
            console.error('Error tracking database performance:', error);
        }
    }
    async trackCacheOperation(operation, duration) {
        try {
            await cloudwatch_service_1.cloudwatchService.putMetric({
                metricName: 'CacheOperations',
                value: 1,
                unit: 'Count',
                dimensions: {
                    Operation: operation,
                },
                namespace: 'HASIVU/Infrastructure',
            });
            await cloudwatch_service_1.cloudwatchService.putMetric({
                metricName: 'CacheOperationDuration',
                value: duration,
                unit: 'Milliseconds',
                dimensions: {
                    Operation: operation,
                },
                namespace: 'HASIVU/Infrastructure',
            });
        }
        catch (error) {
            console.error('Error tracking cache operation:', error);
        }
    }
    async trackError(errorType, errorMessage, context) {
        try {
            await cloudwatch_service_1.cloudwatchService.putMetric({
                metricName: 'ApplicationErrors',
                value: 1,
                unit: 'Count',
                dimensions: {
                    ErrorType: errorType,
                },
                namespace: 'HASIVU/Application',
            });
            await cloudwatch_service_1.cloudwatchService.logError(new Error(errorMessage), {
                errorType,
                ...context,
            });
        }
        catch (error) {
            console.error('Error tracking error metric:', error);
        }
    }
    async getMetricsSummary() {
        return {
            business: {
                revenue: 'Tracked via TotalRevenue metric',
                transactions: 'Tracked via PaymentTransactions metric',
                orders: 'Tracked via Orders* metrics',
                rfid: 'Tracked via RFIDOperations metric',
                users: 'Tracked via ActiveUsers metric',
            },
            performance: {
                api: 'Tracked via ApiResponseTime metric',
                lambda: 'Tracked via LambdaDuration metric',
                database: 'Tracked via DatabaseQueryDuration metric',
                cache: 'Tracked via CacheHitRate metric',
            },
            security: {
                auth: 'Tracked via FailedLoginAttempts metric',
                fraud: 'Tracked via PaymentFraudAttempts metric',
                suspicious: 'Tracked via SuspiciousActivity metric',
            },
            cost: {
                services: 'Tracked via Estimated*Cost metrics',
                perTransaction: 'Tracked via CostPerTransaction metric',
            },
            health: {
                system: 'Tracked via SystemHealthScore metric',
                components: 'Tracked via ComponentHealth metric',
            },
        };
    }
}
exports.metricsService = new MetricsService();
//# sourceMappingURL=metrics.service.js.map