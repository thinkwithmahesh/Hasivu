/**
 * CloudWatch Metrics Utility
 * Performance monitoring and custom metrics for Hasivu Platform
 */

import { CloudWatch } from 'aws-sdk';

const cloudwatch = new CloudWatch({
  region: process.env.AWS_REGION || 'ap-south-1',
});

// Global flag to track Lambda warmup state
declare global {
  var lambdaWarmupFlag: boolean | undefined;
}

/**
 * Record custom metric to CloudWatch
 *
 * @param metricName - Name of the metric
 * @param value - Metric value
 * @param unit - Unit of measurement
 * @param dimensions - Optional dimensions for filtering
 */
export async function recordMetric(
  metricName: string,
  value: number,
  unit: 'Milliseconds' | 'Count' | 'Bytes' | 'Percent' = 'Milliseconds',
  dimensions?: Record<string, string>
): Promise<void> {
  // Skip in development to avoid AWS costs
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
  } catch (error) {
    // Don't throw on metric errors - they shouldn't break the application
    console.error('Failed to record metric:', error);
  }
}

/**
 * Record multiple metrics in a single CloudWatch API call
 * More efficient than multiple individual calls
 *
 * @param metrics - Array of metrics to record
 */
export async function recordMetrics(
  metrics: Array<{
    name: string;
    value: number;
    unit?: 'Milliseconds' | 'Count' | 'Bytes' | 'Percent';
    dimensions?: Record<string, string>;
  }>
): Promise<void> {
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
  } catch (error) {
    console.error('Failed to record metrics:', error);
  }
}

/**
 * Measure and record performance of an async operation
 * Automatically tracks cold starts, duration, and errors
 *
 * @param operation - Name of the operation
 * @param fn - Async function to measure
 * @param additionalDimensions - Optional additional dimensions
 * @returns Result of the function
 */
export async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  additionalDimensions?: Record<string, string>
): Promise<T> {
  const start = Date.now();
  const isColdStart = !global.lambdaWarmupFlag;

  try {
    const result = await fn();
    const duration = Date.now() - start;

    // Prepare metrics to record
    const metrics: Array<{
      name: string;
      value: number;
      unit: 'Milliseconds' | 'Count' | 'Bytes' | 'Percent';
      dimensions?: Record<string, string>;
    }> = [
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

    // Track cold starts separately
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

    // Record success metric
    metrics.push({
      name: `${operation}Success`,
      value: 1,
      unit: 'Count',
      dimensions: {
        Operation: operation,
        ...additionalDimensions,
      },
    });

    // Record all metrics in batch
    await recordMetrics(metrics);

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    // Record error metrics
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

/**
 * Measure database query performance
 * Specialized wrapper for database operations
 *
 * @param queryType - Type of query (e.g., "UserLookup", "OrderList")
 * @param fn - Async database query function
 * @returns Query result
 */
export async function measureDatabaseQuery<T>(queryType: string, fn: () => Promise<T>): Promise<T> {
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

    // Warn if query is slow
    if (duration > 100) {
      console.warn(`Slow database query detected: ${queryType} took ${duration}ms`);
      await recordMetric('SlowDatabaseQueries', 1, 'Count', { QueryType: queryType });
    }

    return result;
  } catch (error) {
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

/**
 * Measure external API call performance
 * Tracks latency and failures for third-party integrations
 *
 * @param apiName - Name of the external API
 * @param fn - Async API call function
 * @returns API response
 */
export async function measureExternalAPI<T>(apiName: string, fn: () => Promise<T>): Promise<T> {
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
  } catch (error) {
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

/**
 * Track business metrics
 * Use for tracking important business events
 *
 * @param eventName - Name of the business event
 * @param value - Optional numeric value
 * @param attributes - Optional event attributes
 */
export async function trackBusinessEvent(
  eventName: string,
  value: number = 1,
  attributes?: Record<string, string>
): Promise<void> {
  await recordMetric(eventName, value, 'Count', attributes);
}

/**
 * Create a performance timer
 * Returns functions to mark checkpoints and complete the timer
 */
export function createPerformanceTimer(operationName: string) {
  const start = Date.now();
  const checkpoints: Record<string, number> = {};

  return {
    /**
     * Mark a checkpoint in the operation
     */
    checkpoint: (name: string) => {
      checkpoints[name] = Date.now() - start;
    },

    /**
     * Complete the timer and record all metrics
     */
    complete: async (additionalDimensions?: Record<string, string>) => {
      const total = Date.now() - start;

      const metrics: Array<{
        name: string;
        value: number;
        unit: 'Milliseconds' | 'Count' | 'Bytes' | 'Percent';
        dimensions?: Record<string, string>;
      }> = [
        {
          name: `${operationName}TotalDuration`,
          value: total,
          unit: 'Milliseconds',
          dimensions: additionalDimensions,
        },
      ];

      // Record checkpoint durations
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

/**
 * Get recent metrics data from CloudWatch
 * Useful for dashboards and monitoring
 *
 * @param metricName - Name of the metric to query
 * @param period - Period in seconds (e.g., 300 for 5 minutes)
 * @param statistics - Statistics to retrieve (e.g., ["Average", "Maximum"])
 * @param startTime - Start time for the query
 * @param endTime - End time for the query
 */
export async function getMetricStatistics(
  metricName: string,
  period: number = 300,
  statistics: string[] = ['Average', 'Maximum', 'Minimum'],
  startTime: Date = new Date(Date.now() - 3600000), // Last hour
  endTime: Date = new Date()
) {
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
  } catch (error) {
    console.error('Failed to get metric statistics:', error);
    return [];
  }
}
