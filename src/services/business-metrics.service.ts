/**
 * HASIVU Platform - Business Metrics Collection Service
 * Comprehensive business intelligence and KPI tracking
 * Integrates with CloudWatch for real-time business monitoring
 */
import { CloudWatchClient, PutMetricDataCommand, MetricDatum } from '@aws-sdk/client-cloudwatch';
import { logger } from '@/utils/logger';
import { DatabaseService } from '@/services/database.service';
import { RedisService } from '@/services/redis.service';
import { config } from '@/config/environment';

/**
 * Business metric categories
 */
export enum BusinessMetricCategory {
  USER_ENGAGEMENT = 'UserEngagement',
  PAYMENT_PERFORMANCE = 'PaymentPerformance',
  ORDER_FULFILLMENT = 'OrderFulfillment',
  RFID_OPERATIONS = 'RFIDOperations',
  SECURITY_EVENTS = 'SecurityEvents',
  SYSTEM_HEALTH = 'SystemHealth'
}

/**
 * Business metric interface
 */
export interface BusinessMetric {
  name: string;
  value: number;
  unit: 'Count' | 'Percent' | 'Seconds' | 'Bytes' | 'None';
  category: BusinessMetricCategory;
  dimensions?: Array<{ name: string; value: string }>;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * KPI calculation interface
 */
export interface KPICalculation {
  name: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  unit: string;
  period: string;
}

/**
 * Main business metrics service
 */
export class BusinessMetricsService {
  private cloudWatchClient: CloudWatchClient;
  private metricsBuffer: MetricDatum[] = [];
  private readonly FLUSH_INTERVAL = 60000; // 1 minute
  private readonly BUFFER_SIZE = 20; // CloudWatch limit
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.cloudWatchClient = new CloudWatchClient({
      region: config.aws.region || 'us-west-2'
    });

    // Start periodic buffer flushing
    this.startPeriodicFlush();
  }

  /**
   * Track user engagement metrics
   */
  async trackUserEngagement(userId: string, action: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const metrics: BusinessMetric[] = [
        {
          name: 'UserAction',
          value: 1,
          unit: 'Count',
          category: BusinessMetricCategory.USER_ENGAGEMENT,
          dimensions: [
            { name: 'Environment', value: config.server.nodeEnv },
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
            { name: 'Environment', value: config.server.nodeEnv },
            { name: 'UserId', value: userId }
          ]
        });
      }

      await this.addMetricsToBuffer(metrics);
      logger.info('User engagement tracked', { userId, action, metricsCount: metrics.length });

    } catch (error) {
      logger.error('Error tracking user engagement', { error, userId, action });
    }
  }

  /**
   * Track payment performance metrics
   */
  async trackPaymentMetrics(
    orderId: string,
    amount: number,
    status: 'success' | 'failed' | 'pending',
    paymentMethod: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const metrics: BusinessMetric[] = [
        {
          name: 'PaymentAttempt',
          value: 1,
          unit: 'Count',
          category: BusinessMetricCategory.PAYMENT_PERFORMANCE,
          dimensions: [
            { name: 'Environment', value: config.server.nodeEnv },
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
            { name: 'Environment', value: config.server.nodeEnv },
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
            { name: 'Environment', value: config.server.nodeEnv },
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
            { name: 'Environment', value: config.server.nodeEnv },
            { name: 'Period', value: 'Daily' }
          ]
        });

        metrics.push({
          name: 'RevenueByMethod',
          value: amount,
          unit: 'None',
          category: BusinessMetricCategory.PAYMENT_PERFORMANCE,
          dimensions: [
            { name: 'Environment', value: config.server.nodeEnv },
            { name: 'PaymentMethod', value: paymentMethod }
          ]
        });
      }

      await this.addMetricsToBuffer(metrics);
      logger.info('Payment metrics tracked', { orderId, status, amount, paymentMethod });

    } catch (error) {
      logger.error('Error tracking payment metrics', { error, orderId, status });
    }
  }

  /**
   * Track order fulfillment metrics
   */
  async trackOrderMetrics(
    orderId: string,
    status: 'created' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const metrics: BusinessMetric[] = [
        {
          name: 'OrderStatus',
          value: 1,
          unit: 'Count',
          category: BusinessMetricCategory.ORDER_FULFILLMENT,
          dimensions: [
            { name: 'Environment', value: config.server.nodeEnv },
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
            dimensions: [{ name: 'Environment', value: config.server.nodeEnv }]
          });
          break;

        case 'delivered':
          metrics.push({
            name: 'OrdersDelivered',
            value: 1,
            unit: 'Count',
            category: BusinessMetricCategory.ORDER_FULFILLMENT,
            dimensions: [{ name: 'Environment', value: config.server.nodeEnv }]
          });

          // Track fulfillment time if available
          if (metadata?.createdAt) {
            const fulfillmentTime = Date.now() - new Date(metadata.createdAt).getTime();
            metrics.push({
              name: 'FulfillmentTime',
              value: fulfillmentTime / 1000 / 60, // Convert to minutes
              unit: 'None',
              category: BusinessMetricCategory.ORDER_FULFILLMENT,
              dimensions: [{ name: 'Environment', value: config.server.nodeEnv }]
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
              { name: 'Environment', value: config.server.nodeEnv },
              { name: 'Reason', value: metadata?.cancelReason || 'Unknown' }
            ]
          });
          break;
      }

      await this.addMetricsToBuffer(metrics);
      logger.info('Order metrics tracked', { orderId, status });

    } catch (error) {
      logger.error('Error tracking order metrics', { error, orderId, status });
    }
  }

  /**
   * Track RFID operations metrics
   */
  async trackRFIDMetrics(
    operation: 'verification' | 'registration' | 'reader_status',
    status: 'success' | 'failed',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const metrics: BusinessMetric[] = [
        {
          name: 'RFIDOperation',
          value: 1,
          unit: 'Count',
          category: BusinessMetricCategory.RFID_OPERATIONS,
          dimensions: [
            { name: 'Environment', value: config.server.nodeEnv },
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
          dimensions: [{ name: 'Environment', value: config.server.nodeEnv }]
        });

        if (status === 'failed') {
          metrics.push({
            name: 'RFIDVerificationFailures',
            value: 1,
            unit: 'Count',
            category: BusinessMetricCategory.RFID_OPERATIONS,
            dimensions: [
              { name: 'Environment', value: config.server.nodeEnv },
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
            dimensions: [{ name: 'Environment', value: config.server.nodeEnv }]
          });
        }
      }

      await this.addMetricsToBuffer(metrics);
      logger.info('RFID metrics tracked', { operation, status });

    } catch (error) {
      logger.error('Error tracking RFID metrics', { error, operation, status });
    }
  }

  /**
   * Track security events
   */
  async trackSecurityEvent(
    eventType: 'failed_login' | 'suspicious_activity' | 'fraud_attempt' | 'unauthorized_access',
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const metrics: BusinessMetric[] = [
        {
          name: 'SecurityEvent',
          value: 1,
          unit: 'Count',
          category: BusinessMetricCategory.SECURITY_EVENTS,
          dimensions: [
            { name: 'Environment', value: config.server.nodeEnv },
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
            dimensions: [{ name: 'Environment', value: config.server.nodeEnv }]
          });
          break;

        case 'suspicious_activity':
          metrics.push({
            name: 'SuspiciousActivities',
            value: 1,
            unit: 'Count',
            category: BusinessMetricCategory.SECURITY_EVENTS,
            dimensions: [{ name: 'Environment', value: config.server.nodeEnv }]
          });
          break;

        case 'fraud_attempt':
          metrics.push({
            name: 'FraudAttempts',
            value: 1,
            unit: 'Count',
            category: BusinessMetricCategory.SECURITY_EVENTS,
            dimensions: [{ name: 'Environment', value: config.server.nodeEnv }]
          });
          break;

        case 'unauthorized_access':
          metrics.push({
            name: 'UnauthorizedAccess',
            value: 1,
            unit: 'Count',
            category: BusinessMetricCategory.SECURITY_EVENTS,
            dimensions: [{ name: 'Environment', value: config.server.nodeEnv }]
          });
          break;
      }

      // Immediate flush for critical security events
      if (severity === 'critical') {
        await this.flushMetricsBuffer();
      } else {
        await this.addMetricsToBuffer(metrics);
      }

      logger.security('Security event tracked', { eventType, severity, metadata });

    } catch (error) {
      logger.error('Error tracking security event', { error, eventType, severity });
    }
  }

  /**
   * Calculate and track system health score
   */
  async calculateSystemHealthScore(): Promise<number> {
    try {
      // This would calculate health based on various system metrics
      const healthScore = 95.5; // Mock implementation

      await this.addMetricsToBuffer([{
        name: 'SystemHealthScore',
        value: healthScore,
        unit: 'Percent',
        category: BusinessMetricCategory.SYSTEM_HEALTH,
        dimensions: [{ name: 'Environment', value: config.server.nodeEnv }],
        metadata: {
          calculatedAt: new Date(),
          components: ['database', 'redis', 'external_services']
        }
      }]);

      return healthScore;

    } catch (error) {
      logger.error('Error calculating system health score', { error });
      return 0;
    }
  }

  /**
   * Generate KPI report
   */
  async generateKPIReport(timeWindow: '1h' | '24h' | '7d' | '30d'): Promise<KPICalculation[]> {
    try {
      const kpis: KPICalculation[] = [];

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

      logger.info('KPI report generated', { timeWindow, kpisCount: kpis.length });
      return kpis;

    } catch (error) {
      logger.error('Error generating KPI report', { error, timeWindow });
      return [];
    }
  }

  /**
   * Add metrics to buffer
   */
  private async addMetricsToBuffer(metrics: BusinessMetric[]): Promise<void> {
    const metricData: MetricDatum[] = metrics.map(metric => ({
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
  private async flushMetricsBuffer(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metricData = [...this.metricsBuffer];
      
      // Split into chunks of 20 (CloudWatch limit)
      const chunks = this.chunkArray(metricData, 20);
      
      for (const chunk of chunks) {
        const command = new PutMetricDataCommand({
          Namespace: 'HASIVU/BusinessMetrics',
          MetricData: chunk
        });
        
        await this.cloudWatchClient.send(command);
      }

      logger.info('Metrics flushed to CloudWatch', { count: metricData.length });
      
      // Clear buffer
      this.metricsBuffer = [];

    } catch (error) {
      logger.error('Error flushing metrics to CloudWatch', error);
      // Keep metrics in buffer for retry
    }
  }

  /**
   * Start periodic buffer flushing
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushMetricsBuffer();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Stop periodic buffer flushing
   */
  public stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Utility function to chunk array
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Health check methods
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await DatabaseService.client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkCacheHealth(): Promise<boolean> {
    try {
      await RedisService.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkPaymentSystemHealth(): Promise<boolean> {
    // This would check payment gateway connectivity
    return true; // Mock implementation
  }

  private async checkRFIDSystemHealth(): Promise<boolean> {
    // This would check RFID system connectivity
    return true; // Mock implementation
  }

  /**
   * KPI calculation methods (stubbed for brevity)
   */
  private async calculatePaymentSuccessRate(timeWindow: string): Promise<any> {
    // This would calculate actual payment success rate from metrics
    return { current: 98.2, trend: 'up', change: 0.3 };
  }

  private async calculateOrderCompletionRate(timeWindow: string): Promise<any> {
    // This would calculate actual order completion rate from metrics
    return { current: 96.1, trend: 'stable', change: 0.1 };
  }

  private async calculateRFIDVerificationRate(timeWindow: string): Promise<any> {
    // This would calculate actual RFID verification rate from metrics
    return { current: 99.2, trend: 'up', change: 0.2 };
  }

  private async calculateUserSatisfactionScore(timeWindow: string): Promise<any> {
    // This would calculate user satisfaction based on various metrics
    return { current: 94.8, trend: 'down', change: -0.5 };
  }

  /**
   * Cleanup on service shutdown
   */
  public async shutdown(): Promise<void> {
    this.stopPeriodicFlush();
    await this.flushMetricsBuffer();
    logger.info('Business metrics service shutdown complete');
  }
}

// Export singleton instance
export const businessMetricsService = new BusinessMetricsService();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await businessMetricsService.shutdown();
});

process.on('SIGINT', async () => {
  await businessMetricsService.shutdown();
});

export default businessMetricsService;