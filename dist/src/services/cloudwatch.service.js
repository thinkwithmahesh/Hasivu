"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudwatchService = void 0;
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const cloudwatch_config_1 = require("../config/cloudwatch.config");
class CloudWatchService {
    metricBuffer = [];
    flushTimer = null;
    logSequenceToken;
    constructor() {
        this.startBatchFlush();
    }
    startBatchFlush() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flushTimer = setInterval(() => {
            this.flushMetrics();
        }, cloudwatch_config_1.cloudwatchConfig.batch.flushInterval);
    }
    async putMetric(data) {
        if (!cloudwatch_config_1.cloudwatchConfig.metrics.enabled) {
            return;
        }
        try {
            const metric = {
                MetricName: data.metricName,
                Value: data.value,
                Unit: data.unit || client_cloudwatch_1.StandardUnit.None,
                Timestamp: data.timestamp || new Date(),
                Dimensions: this.buildDimensions(data.dimensions),
            };
            this.metricBuffer.push(metric);
            if (this.metricBuffer.length >= cloudwatch_config_1.cloudwatchConfig.batch.maxSize) {
                await this.flushMetrics();
            }
        }
        catch (error) {
            console.error('Error putting metric to CloudWatch:', error);
        }
    }
    async putMetrics(metrics) {
        if (!cloudwatch_config_1.cloudwatchConfig.metrics.enabled) {
            return;
        }
        try {
            const metricData = metrics.map(data => ({
                MetricName: data.metricName,
                Value: data.value,
                Unit: data.unit || client_cloudwatch_1.StandardUnit.None,
                Timestamp: data.timestamp || new Date(),
                Dimensions: this.buildDimensions(data.dimensions),
            }));
            this.metricBuffer.push(...metricData);
            if (this.metricBuffer.length >= cloudwatch_config_1.cloudwatchConfig.batch.maxSize) {
                await this.flushMetrics();
            }
        }
        catch (error) {
            console.error('Error putting metrics to CloudWatch:', error);
        }
    }
    async flushMetrics() {
        if (this.metricBuffer.length === 0) {
            return;
        }
        try {
            const namespace = cloudwatch_config_1.cloudwatchConfig.namespaces.application || 'HASIVU/Application';
            const command = new client_cloudwatch_1.PutMetricDataCommand({
                Namespace: namespace,
                MetricData: this.metricBuffer,
            });
            await cloudwatch_config_1.cloudwatchClient.send(command);
            this.metricBuffer = [];
        }
        catch (error) {
            console.error('Error flushing metrics to CloudWatch:', error);
        }
    }
    async trackBusinessMetric(metricName, value, dimensions) {
        await this.putMetric({
            metricName,
            value,
            unit: client_cloudwatch_1.StandardUnit.Count,
            dimensions: {
                ...cloudwatch_config_1.cloudwatchConfig.dimensions,
                ...dimensions,
            },
            namespace: cloudwatch_config_1.cloudwatchConfig.namespaces.business,
        });
    }
    async trackPaymentTransaction(status, amount) {
        await Promise.all([
            this.trackBusinessMetric(cloudwatch_config_1.MetricNames.PAYMENT_TRANSACTIONS, 1, {
                Status: status,
            }),
            this.trackBusinessMetric(cloudwatch_config_1.MetricNames.TOTAL_REVENUE, amount, {
                Currency: 'INR',
            }),
        ]);
    }
    async trackOrder(action, orderId) {
        const metricMap = {
            created: cloudwatch_config_1.MetricNames.ORDERS_CREATED,
            completed: cloudwatch_config_1.MetricNames.ORDERS_COMPLETED,
            cancelled: cloudwatch_config_1.MetricNames.ORDERS_CANCELLED,
        };
        await this.trackBusinessMetric(metricMap[action], 1, {
            OrderId: orderId,
        });
    }
    async trackRFIDOperation(operation, status) {
        await this.trackBusinessMetric(cloudwatch_config_1.MetricNames.RFID_OPERATIONS, 1, {
            Operation: operation,
            Status: status,
        });
    }
    async trackApiPerformance(endpoint, duration, statusCode) {
        const isError = statusCode >= 400;
        await Promise.all([
            this.putMetric({
                metricName: cloudwatch_config_1.MetricNames.API_RESPONSE_TIME,
                value: duration,
                unit: client_cloudwatch_1.StandardUnit.Milliseconds,
                dimensions: {
                    Endpoint: endpoint,
                },
            }),
            isError
                ? this.putMetric({
                    metricName: cloudwatch_config_1.MetricNames.API_ERROR_RATE,
                    value: 1,
                    unit: client_cloudwatch_1.StandardUnit.Count,
                    dimensions: {
                        Endpoint: endpoint,
                        StatusCode: statusCode.toString(),
                    },
                })
                : Promise.resolve(),
        ]);
    }
    async trackLambdaPerformance(functionName, duration, coldStart) {
        await Promise.all([
            this.putMetric({
                metricName: cloudwatch_config_1.MetricNames.LAMBDA_DURATION,
                value: duration,
                unit: client_cloudwatch_1.StandardUnit.Milliseconds,
                dimensions: {
                    FunctionName: functionName,
                },
            }),
            coldStart
                ? this.putMetric({
                    metricName: cloudwatch_config_1.MetricNames.LAMBDA_COLD_STARTS,
                    value: 1,
                    unit: client_cloudwatch_1.StandardUnit.Count,
                    dimensions: {
                        FunctionName: functionName,
                    },
                })
                : Promise.resolve(),
        ]);
    }
    async trackDatabaseQuery(queryType, duration, success) {
        const isSlow = duration > cloudwatch_config_1.cloudwatchConfig.thresholds.slowQueryThreshold;
        await Promise.all([
            this.putMetric({
                metricName: cloudwatch_config_1.MetricNames.DATABASE_QUERY_DURATION,
                value: duration,
                unit: client_cloudwatch_1.StandardUnit.Milliseconds,
                dimensions: {
                    QueryType: queryType,
                },
                namespace: cloudwatch_config_1.cloudwatchConfig.namespaces.database,
            }),
            isSlow
                ? this.putMetric({
                    metricName: cloudwatch_config_1.MetricNames.SLOW_QUERIES,
                    value: 1,
                    unit: client_cloudwatch_1.StandardUnit.Count,
                    dimensions: {
                        QueryType: queryType,
                    },
                    namespace: cloudwatch_config_1.cloudwatchConfig.namespaces.database,
                })
                : Promise.resolve(),
            !success
                ? this.putMetric({
                    metricName: 'QueryErrors',
                    value: 1,
                    unit: client_cloudwatch_1.StandardUnit.Count,
                    dimensions: {
                        QueryType: queryType,
                    },
                    namespace: cloudwatch_config_1.cloudwatchConfig.namespaces.database,
                })
                : Promise.resolve(),
        ]);
    }
    async trackSecurityEvent(eventType, userId) {
        await this.putMetric({
            metricName: 'SecurityEvents',
            value: 1,
            unit: client_cloudwatch_1.StandardUnit.Count,
            dimensions: {
                EventType: eventType,
                ...(userId && { UserId: userId }),
            },
            namespace: cloudwatch_config_1.cloudwatchConfig.namespaces.security,
        });
        if (eventType === 'failed_login') {
            await this.putMetric({
                metricName: cloudwatch_config_1.MetricNames.FAILED_LOGIN_ATTEMPTS,
                value: 1,
                unit: client_cloudwatch_1.StandardUnit.Count,
                namespace: cloudwatch_config_1.cloudwatchConfig.namespaces.security,
            });
        }
        else if (eventType === 'suspicious_activity') {
            await this.putMetric({
                metricName: cloudwatch_config_1.MetricNames.SUSPICIOUS_ACTIVITY,
                value: 1,
                unit: client_cloudwatch_1.StandardUnit.Count,
                namespace: cloudwatch_config_1.cloudwatchConfig.namespaces.security,
            });
        }
        else if (eventType === 'fraud_attempt') {
            await this.putMetric({
                metricName: cloudwatch_config_1.MetricNames.PAYMENT_FRAUD_ATTEMPTS,
                value: 1,
                unit: client_cloudwatch_1.StandardUnit.Count,
                namespace: cloudwatch_config_1.cloudwatchConfig.namespaces.security,
            });
        }
    }
    async trackSystemHealth(healthScore) {
        await this.trackBusinessMetric(cloudwatch_config_1.MetricNames.SYSTEM_HEALTH_SCORE, healthScore);
    }
    async trackCost(service, estimatedCost) {
        await this.putMetric({
            metricName: `Estimated${service}Cost`,
            value: estimatedCost,
            unit: client_cloudwatch_1.StandardUnit.None,
            dimensions: {
                Service: service,
            },
            namespace: cloudwatch_config_1.cloudwatchConfig.namespaces.cost,
        });
    }
    async log(logGroupName, data) {
        if (!cloudwatch_config_1.cloudwatchConfig.logs.enabled) {
            return;
        }
        try {
            const logStreamName = this.getLogStreamName();
            await this.ensureLogStream(logGroupName, logStreamName);
            const timestamp = data.timestamp || Date.now();
            const message = JSON.stringify({
                level: data.level,
                message: data.message,
                metadata: data.metadata,
                timestamp: new Date(timestamp).toISOString(),
                environment: cloudwatch_config_1.cloudwatchConfig.environment,
            });
            const command = new client_cloudwatch_logs_1.PutLogEventsCommand({
                logGroupName,
                logStreamName,
                logEvents: [
                    {
                        message,
                        timestamp,
                    },
                ],
                sequenceToken: this.logSequenceToken,
            });
            const response = await cloudwatch_config_1.cloudwatchLogsClient.send(command);
            this.logSequenceToken = response.nextSequenceToken;
        }
        catch (error) {
            console.error('Error logging to CloudWatch Logs:', error);
        }
    }
    async logApplication(level, message, metadata) {
        await this.log(cloudwatch_config_1.cloudwatchConfig.logGroups.application, {
            level,
            message,
            metadata,
        });
    }
    async logError(error, context) {
        await this.log(cloudwatch_config_1.cloudwatchConfig.logGroups.errors, {
            level: 'ERROR',
            message: error.message,
            metadata: {
                stack: error.stack,
                name: error.name,
                ...context,
            },
        });
    }
    async logBusinessEvent(message, metadata) {
        await this.log(cloudwatch_config_1.cloudwatchConfig.logGroups.business, {
            level: 'INFO',
            message,
            metadata,
        });
    }
    async logSecurityEvent(message, metadata) {
        await this.log(cloudwatch_config_1.cloudwatchConfig.logGroups.security, {
            level: 'WARN',
            message,
            metadata,
        });
    }
    buildDimensions(customDimensions) {
        const dimensions = {
            ...cloudwatch_config_1.cloudwatchConfig.dimensions,
            ...customDimensions,
        };
        return Object.entries(dimensions).map(([Name, Value]) => ({
            Name,
            Value,
        }));
    }
    getLogStreamName() {
        const date = new Date().toISOString().split('T')[0];
        const instanceId = process.env.AWS_LAMBDA_LOG_STREAM_NAME || 'local';
        return `${date}/${instanceId}`;
    }
    async ensureLogStream(logGroupName, logStreamName) {
        try {
            const describeCommand = new client_cloudwatch_logs_1.DescribeLogStreamsCommand({
                logGroupName,
                logStreamNamePrefix: logStreamName,
            });
            const response = await cloudwatch_config_1.cloudwatchLogsClient.send(describeCommand);
            if (!response.logStreams || response.logStreams.length === 0) {
                const createCommand = new client_cloudwatch_logs_1.CreateLogStreamCommand({
                    logGroupName,
                    logStreamName,
                });
                await cloudwatch_config_1.cloudwatchLogsClient.send(createCommand);
            }
        }
        catch (error) {
            console.error('Error ensuring log stream:', error);
        }
    }
    async cleanup() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        await this.flushMetrics();
    }
}
exports.cloudwatchService = new CloudWatchService();
process.on('beforeExit', async () => {
    await exports.cloudwatchService.cleanup();
});
process.on('SIGINT', async () => {
    await exports.cloudwatchService.cleanup();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await exports.cloudwatchService.cleanup();
    process.exit(0);
});
//# sourceMappingURL=cloudwatch.service.js.map