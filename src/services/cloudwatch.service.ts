// CloudWatch Service - Comprehensive Monitoring & Logging
// Infrastructure Reliability Expert - DevOps Specialist

import {
  PutMetricDataCommand,
  MetricDatum,
  StandardUnit,
  Dimension,
} from '@aws-sdk/client-cloudwatch';
import {
  PutLogEventsCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  cloudwatchClient,
  cloudwatchLogsClient,
  cloudwatchConfig,
  MetricNames,
} from '../config/cloudwatch.config';

interface MetricData {
  metricName: string;
  value: number;
  unit?: StandardUnit;
  dimensions?: Record<string, string>;
  timestamp?: Date;
  namespace?: string;
}

interface LogData {
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  metadata?: Record<string, any>;
  timestamp?: number;
}

class CloudWatchService {
  private metricBuffer: MetricDatum[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private logSequenceToken: string | undefined;

  constructor() {
    // Initialize flush timer for batching
    this.startBatchFlush();
  }

  /**
   * Start automatic batch flushing
   */
  private startBatchFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushMetrics();
    }, cloudwatchConfig.batch.flushInterval);
  }

  /**
   * Put a single metric to CloudWatch
   */
  async putMetric(data: MetricData): Promise<void> {
    if (!cloudwatchConfig.metrics.enabled) {
      return;
    }

    try {
      const metric: MetricDatum = {
        MetricName: data.metricName,
        Value: data.value,
        Unit: data.unit || StandardUnit.None,
        Timestamp: data.timestamp || new Date(),
        Dimensions: this.buildDimensions(data.dimensions),
      };

      // Add to buffer for batching
      this.metricBuffer.push(metric);

      // Flush if buffer is full
      if (this.metricBuffer.length >= cloudwatchConfig.batch.maxSize) {
        await this.flushMetrics();
      }
    } catch (error) {
      console.error('Error putting metric to CloudWatch:', error);
    }
  }

  /**
   * Put multiple metrics at once
   */
  async putMetrics(metrics: MetricData[]): Promise<void> {
    if (!cloudwatchConfig.metrics.enabled) {
      return;
    }

    try {
      const metricData: MetricDatum[] = metrics.map(data => ({
        MetricName: data.metricName,
        Value: data.value,
        Unit: data.unit || StandardUnit.None,
        Timestamp: data.timestamp || new Date(),
        Dimensions: this.buildDimensions(data.dimensions),
      }));

      // Add to buffer
      this.metricBuffer.push(...metricData);

      // Flush if buffer is full
      if (this.metricBuffer.length >= cloudwatchConfig.batch.maxSize) {
        await this.flushMetrics();
      }
    } catch (error) {
      console.error('Error putting metrics to CloudWatch:', error);
    }
  }

  /**
   * Flush buffered metrics to CloudWatch
   */
  async flushMetrics(): Promise<void> {
    if (this.metricBuffer.length === 0) {
      return;
    }

    try {
      const namespace = cloudwatchConfig.namespaces.application || 'HASIVU/Application';

      const command = new PutMetricDataCommand({
        Namespace: namespace,
        MetricData: this.metricBuffer,
      });

      await cloudwatchClient.send(command);

      // Clear buffer after successful flush
      this.metricBuffer = [];
    } catch (error) {
      console.error('Error flushing metrics to CloudWatch:', error);
      // Don't clear buffer on error, will retry on next flush
    }
  }

  /**
   * Track business metric
   */
  async trackBusinessMetric(
    metricName: string,
    value: number,
    dimensions?: Record<string, string>
  ): Promise<void> {
    await this.putMetric({
      metricName,
      value,
      unit: StandardUnit.Count,
      dimensions: {
        ...cloudwatchConfig.dimensions,
        ...dimensions,
      },
      namespace: cloudwatchConfig.namespaces.business,
    });
  }

  /**
   * Track payment transaction
   */
  async trackPaymentTransaction(
    status: 'success' | 'failed' | 'pending',
    amount: number
  ): Promise<void> {
    await Promise.all([
      this.trackBusinessMetric(MetricNames.PAYMENT_TRANSACTIONS, 1, {
        Status: status,
      }),
      this.trackBusinessMetric(MetricNames.TOTAL_REVENUE, amount, {
        Currency: 'INR',
      }),
    ]);
  }

  /**
   * Track order lifecycle
   */
  async trackOrder(action: 'created' | 'completed' | 'cancelled', orderId: string): Promise<void> {
    const metricMap = {
      created: MetricNames.ORDERS_CREATED,
      completed: MetricNames.ORDERS_COMPLETED,
      cancelled: MetricNames.ORDERS_CANCELLED,
    };

    await this.trackBusinessMetric(metricMap[action], 1, {
      OrderId: orderId,
    });
  }

  /**
   * Track RFID operations
   */
  async trackRFIDOperation(
    operation: 'verification' | 'registration',
    status: 'success' | 'failed'
  ): Promise<void> {
    await this.trackBusinessMetric(MetricNames.RFID_OPERATIONS, 1, {
      Operation: operation,
      Status: status,
    });
  }

  /**
   * Track API performance
   */
  async trackApiPerformance(endpoint: string, duration: number, statusCode: number): Promise<void> {
    const isError = statusCode >= 400;

    await Promise.all([
      this.putMetric({
        metricName: MetricNames.API_RESPONSE_TIME,
        value: duration,
        unit: StandardUnit.Milliseconds,
        dimensions: {
          Endpoint: endpoint,
        },
      }),
      isError
        ? this.putMetric({
            metricName: MetricNames.API_ERROR_RATE,
            value: 1,
            unit: StandardUnit.Count,
            dimensions: {
              Endpoint: endpoint,
              StatusCode: statusCode.toString(),
            },
          })
        : Promise.resolve(),
    ]);
  }

  /**
   * Track Lambda performance
   */
  async trackLambdaPerformance(
    functionName: string,
    duration: number,
    coldStart: boolean
  ): Promise<void> {
    await Promise.all([
      this.putMetric({
        metricName: MetricNames.LAMBDA_DURATION,
        value: duration,
        unit: StandardUnit.Milliseconds,
        dimensions: {
          FunctionName: functionName,
        },
      }),
      coldStart
        ? this.putMetric({
            metricName: MetricNames.LAMBDA_COLD_STARTS,
            value: 1,
            unit: StandardUnit.Count,
            dimensions: {
              FunctionName: functionName,
            },
          })
        : Promise.resolve(),
    ]);
  }

  /**
   * Track database performance
   */
  async trackDatabaseQuery(
    queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    duration: number,
    success: boolean
  ): Promise<void> {
    const isSlow = duration > cloudwatchConfig.thresholds.slowQueryThreshold;

    await Promise.all([
      this.putMetric({
        metricName: MetricNames.DATABASE_QUERY_DURATION,
        value: duration,
        unit: StandardUnit.Milliseconds,
        dimensions: {
          QueryType: queryType,
        },
        namespace: cloudwatchConfig.namespaces.database,
      }),
      isSlow
        ? this.putMetric({
            metricName: MetricNames.SLOW_QUERIES,
            value: 1,
            unit: StandardUnit.Count,
            dimensions: {
              QueryType: queryType,
            },
            namespace: cloudwatchConfig.namespaces.database,
          })
        : Promise.resolve(),
      !success
        ? this.putMetric({
            metricName: 'QueryErrors',
            value: 1,
            unit: StandardUnit.Count,
            dimensions: {
              QueryType: queryType,
            },
            namespace: cloudwatchConfig.namespaces.database,
          })
        : Promise.resolve(),
    ]);
  }

  /**
   * Track security events
   */
  async trackSecurityEvent(
    eventType: 'failed_login' | 'suspicious_activity' | 'fraud_attempt' | 'unauthorized_access',
    userId?: string
  ): Promise<void> {
    await this.putMetric({
      metricName: 'SecurityEvents',
      value: 1,
      unit: StandardUnit.Count,
      dimensions: {
        EventType: eventType,
        ...(userId && { UserId: userId }),
      },
      namespace: cloudwatchConfig.namespaces.security,
    });

    // Track specific metrics for critical security events
    if (eventType === 'failed_login') {
      await this.putMetric({
        metricName: MetricNames.FAILED_LOGIN_ATTEMPTS,
        value: 1,
        unit: StandardUnit.Count,
        namespace: cloudwatchConfig.namespaces.security,
      });
    } else if (eventType === 'suspicious_activity') {
      await this.putMetric({
        metricName: MetricNames.SUSPICIOUS_ACTIVITY,
        value: 1,
        unit: StandardUnit.Count,
        namespace: cloudwatchConfig.namespaces.security,
      });
    } else if (eventType === 'fraud_attempt') {
      await this.putMetric({
        metricName: MetricNames.PAYMENT_FRAUD_ATTEMPTS,
        value: 1,
        unit: StandardUnit.Count,
        namespace: cloudwatchConfig.namespaces.security,
      });
    }
  }

  /**
   * Track system health score
   */
  async trackSystemHealth(healthScore: number): Promise<void> {
    await this.trackBusinessMetric(MetricNames.SYSTEM_HEALTH_SCORE, healthScore);
  }

  /**
   * Track cost metrics
   */
  async trackCost(service: string, estimatedCost: number): Promise<void> {
    await this.putMetric({
      metricName: `Estimated${service}Cost`,
      value: estimatedCost,
      unit: StandardUnit.None,
      dimensions: {
        Service: service,
      },
      namespace: cloudwatchConfig.namespaces.cost,
    });
  }

  /**
   * Log to CloudWatch Logs
   */
  async log(logGroupName: string, data: LogData): Promise<void> {
    if (!cloudwatchConfig.logs.enabled) {
      return;
    }

    try {
      const logStreamName = this.getLogStreamName();

      // Ensure log stream exists
      await this.ensureLogStream(logGroupName, logStreamName);

      const timestamp = data.timestamp || Date.now();
      const message = JSON.stringify({
        level: data.level,
        message: data.message,
        metadata: data.metadata,
        timestamp: new Date(timestamp).toISOString(),
        environment: cloudwatchConfig.environment,
      });

      const command = new PutLogEventsCommand({
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

      const response = await cloudwatchLogsClient.send(command);
      this.logSequenceToken = response.nextSequenceToken;
    } catch (error) {
      console.error('Error logging to CloudWatch Logs:', error);
    }
  }

  /**
   * Log application event
   */
  async logApplication(
    level: LogData['level'],
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(cloudwatchConfig.logGroups.application, {
      level,
      message,
      metadata,
    });
  }

  /**
   * Log error
   */
  async logError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.log(cloudwatchConfig.logGroups.errors, {
      level: 'ERROR',
      message: error.message,
      metadata: {
        stack: error.stack,
        name: error.name,
        ...context,
      },
    });
  }

  /**
   * Log business event
   */
  async logBusinessEvent(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log(cloudwatchConfig.logGroups.business, {
      level: 'INFO',
      message,
      metadata,
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log(cloudwatchConfig.logGroups.security, {
      level: 'WARN',
      message,
      metadata,
    });
  }

  /**
   * Build dimensions for metrics
   */
  private buildDimensions(customDimensions?: Record<string, string>): Dimension[] {
    const dimensions: Record<string, string> = {
      ...cloudwatchConfig.dimensions,
      ...customDimensions,
    };

    return Object.entries(dimensions).map(([Name, Value]) => ({
      Name,
      Value,
    }));
  }

  /**
   * Get log stream name
   */
  private getLogStreamName(): string {
    const date = new Date().toISOString().split('T')[0];
    const instanceId = process.env.AWS_LAMBDA_LOG_STREAM_NAME || 'local';
    return `${date}/${instanceId}`;
  }

  /**
   * Ensure log stream exists
   */
  private async ensureLogStream(logGroupName: string, logStreamName: string): Promise<void> {
    try {
      // Check if log stream exists
      const describeCommand = new DescribeLogStreamsCommand({
        logGroupName,
        logStreamNamePrefix: logStreamName,
      });

      const response = await cloudwatchLogsClient.send(describeCommand);

      if (!response.logStreams || response.logStreams.length === 0) {
        // Create log stream
        const createCommand = new CreateLogStreamCommand({
          logGroupName,
          logStreamName,
        });

        await cloudwatchLogsClient.send(createCommand);
      }
    } catch (error) {
      console.error('Error ensuring log stream:', error);
    }
  }

  /**
   * Cleanup - flush remaining metrics and clear timers
   */
  async cleanup(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flushMetrics();
  }
}

// Export singleton instance
export const cloudwatchService = new CloudWatchService();

// Graceful shutdown - flush metrics on process exit
process.on('beforeExit', async () => {
  await cloudwatchService.cleanup();
});

process.on('SIGINT', async () => {
  await cloudwatchService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cloudwatchService.cleanup();
  process.exit(0);
});
