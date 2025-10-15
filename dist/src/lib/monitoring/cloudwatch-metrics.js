"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetricStatistics = exports.createPerformanceTimer = exports.trackBusinessEvent = exports.measureExternalAPI = exports.measureDatabaseQuery = exports.measurePerformance = exports.recordMetrics = exports.recordMetric = void 0;
const aws_sdk_1 = require("aws-sdk");
const cloudwatch = new aws_sdk_1.CloudWatch({
    region: process.env.AWS_REGION || 'ap-south-1',
});
async function recordMetric(metricName, value, unit = 'Milliseconds', dimensions) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Metric] ${metricName}: ${value} ${unit}`, dimensions);
        return;
    }
    try {
        await cloudwatch
            .putMetricData({
            Namespace: 'HASIVU/Performance',
            MetricData: [
                {
                    MetricName: metricName,
                    Value: value,
                    Unit: unit,
                    Timestamp: new Date(),
                    Dimensions: dimensions
                        ? Object.entries(dimensions).map(([key, value]) => ({
                            Name: key,
                            Value: value,
                        }))
                        : undefined,
                },
            ],
        })
            .promise();
    }
    catch (error) {
        console.error('Failed to record metric:', error);
    }
}
exports.recordMetric = recordMetric;
async function recordMetrics(metrics) {
    if (process.env.NODE_ENV === 'development') {
        metrics.forEach(m => {
            console.log(`[Metric] ${m.name}: ${m.value} ${m.unit || 'Milliseconds'}`, m.dimensions);
        });
        return;
    }
    try {
        await cloudwatch
            .putMetricData({
            Namespace: 'HASIVU/Performance',
            MetricData: metrics.map(metric => ({
                MetricName: metric.name,
                Value: metric.value,
                Unit: metric.unit || 'Milliseconds',
                Timestamp: new Date(),
                Dimensions: metric.dimensions
                    ? Object.entries(metric.dimensions).map(([key, value]) => ({
                        Name: key,
                        Value: value,
                    }))
                    : undefined,
            })),
        })
            .promise();
    }
    catch (error) {
        console.error('Failed to record metrics:', error);
    }
}
exports.recordMetrics = recordMetrics;
async function measurePerformance(operation, fn, additionalDimensions) {
    const start = Date.now();
    const isColdStart = !global.lambdaWarmupFlag;
    try {
        const result = await fn();
        const duration = Date.now() - start;
        const metrics = [
            {
                name: `${operation}Duration`,
                value: duration,
                unit: 'Milliseconds',
                dimensions: {
                    Operation: operation,
                    ColdStart: isColdStart ? 'true' : 'false',
                    ...additionalDimensions,
                },
            },
        ];
        if (isColdStart) {
            metrics.push({
                name: 'ColdStartDuration',
                value: duration,
                unit: 'Milliseconds',
                dimensions: {
                    Operation: operation,
                    ...additionalDimensions,
                },
            });
            global.lambdaWarmupFlag = true;
        }
        metrics.push({
            name: `${operation}Success`,
            value: 1,
            unit: 'Count',
            dimensions: {
                Operation: operation,
                ...additionalDimensions,
            },
        });
        await recordMetrics(metrics);
        return result;
    }
    catch (error) {
        const duration = Date.now() - start;
        await recordMetrics([
            {
                name: `${operation}Errors`,
                value: 1,
                unit: 'Count',
                dimensions: {
                    Operation: operation,
                    ErrorType: error instanceof Error ? error.name : 'Unknown',
                    ...additionalDimensions,
                },
            },
            {
                name: `${operation}ErrorDuration`,
                value: duration,
                unit: 'Milliseconds',
                dimensions: {
                    Operation: operation,
                    ...additionalDimensions,
                },
            },
        ]);
        throw error;
    }
}
exports.measurePerformance = measurePerformance;
async function measureDatabaseQuery(queryType, fn) {
    const start = Date.now();
    try {
        const result = await fn();
        const duration = Date.now() - start;
        await recordMetrics([
            {
                name: 'DatabaseQueryDuration',
                value: duration,
                unit: 'Milliseconds',
                dimensions: {
                    QueryType: queryType,
                    Status: 'Success',
                },
            },
            {
                name: 'DatabaseQueryCount',
                value: 1,
                unit: 'Count',
                dimensions: {
                    QueryType: queryType,
                    Status: 'Success',
                },
            },
        ]);
        if (duration > 100) {
            console.warn(`Slow database query detected: ${queryType} took ${duration}ms`);
            await recordMetric('SlowDatabaseQueries', 1, 'Count', { QueryType: queryType });
        }
        return result;
    }
    catch (error) {
        const duration = Date.now() - start;
        await recordMetrics([
            {
                name: 'DatabaseQueryDuration',
                value: duration,
                unit: 'Milliseconds',
                dimensions: {
                    QueryType: queryType,
                    Status: 'Error',
                },
            },
            {
                name: 'DatabaseQueryErrors',
                value: 1,
                unit: 'Count',
                dimensions: {
                    QueryType: queryType,
                    ErrorType: error instanceof Error ? error.name : 'Unknown',
                },
            },
        ]);
        throw error;
    }
}
exports.measureDatabaseQuery = measureDatabaseQuery;
async function measureExternalAPI(apiName, fn) {
    const start = Date.now();
    try {
        const result = await fn();
        const duration = Date.now() - start;
        await recordMetrics([
            {
                name: 'ExternalAPILatency',
                value: duration,
                unit: 'Milliseconds',
                dimensions: {
                    APIName: apiName,
                    Status: 'Success',
                },
            },
            {
                name: 'ExternalAPICallCount',
                value: 1,
                unit: 'Count',
                dimensions: {
                    APIName: apiName,
                    Status: 'Success',
                },
            },
        ]);
        return result;
    }
    catch (error) {
        const duration = Date.now() - start;
        await recordMetrics([
            {
                name: 'ExternalAPILatency',
                value: duration,
                unit: 'Milliseconds',
                dimensions: {
                    APIName: apiName,
                    Status: 'Error',
                },
            },
            {
                name: 'ExternalAPIFailures',
                value: 1,
                unit: 'Count',
                dimensions: {
                    APIName: apiName,
                    ErrorType: error instanceof Error ? error.name : 'Unknown',
                },
            },
        ]);
        throw error;
    }
}
exports.measureExternalAPI = measureExternalAPI;
async function trackBusinessEvent(eventName, value = 1, attributes) {
    await recordMetric(eventName, value, 'Count', attributes);
}
exports.trackBusinessEvent = trackBusinessEvent;
function createPerformanceTimer(operationName) {
    const start = Date.now();
    const checkpoints = {};
    return {
        checkpoint: (name) => {
            checkpoints[name] = Date.now() - start;
        },
        complete: async (additionalDimensions) => {
            const total = Date.now() - start;
            const metrics = [
                {
                    name: `${operationName}TotalDuration`,
                    value: total,
                    unit: 'Milliseconds',
                    dimensions: additionalDimensions,
                },
            ];
            for (const [name, duration] of Object.entries(checkpoints)) {
                metrics.push({
                    name: `${operationName}Checkpoint`,
                    value: duration,
                    unit: 'Milliseconds',
                    dimensions: {
                        Checkpoint: name,
                        ...additionalDimensions,
                    },
                });
            }
            await recordMetrics(metrics);
            return {
                total,
                checkpoints,
            };
        },
    };
}
exports.createPerformanceTimer = createPerformanceTimer;
async function getMetricStatistics(metricName, period = 300, statistics = ['Average', 'Maximum', 'Minimum'], startTime = new Date(Date.now() - 3600000), endTime = new Date()) {
    try {
        const result = await cloudwatch
            .getMetricStatistics({
            Namespace: 'HASIVU/Performance',
            MetricName: metricName,
            StartTime: startTime,
            EndTime: endTime,
            Period: period,
            Statistics: statistics,
        })
            .promise();
        return result.Datapoints;
    }
    catch (error) {
        console.error('Failed to get metric statistics:', error);
        return [];
    }
}
exports.getMetricStatistics = getMetricStatistics;
//# sourceMappingURL=cloudwatch-metrics.js.map