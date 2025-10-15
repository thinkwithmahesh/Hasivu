// Metrics Service - Business Metrics Tracking & Analysis
// Infrastructure Reliability Expert - Performance Monitoring

import { cloudwatchService } from './cloudwatch.service';
import { MetricNames } from '../config/cloudwatch.config';

interface PaymentMetrics {
  transactionId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  gateway: string;
  processingTime: number;
}

interface OrderMetrics {
  orderId: string;
  userId: string;
  schoolId: string;
  totalAmount: number;
  itemCount: number;
  processingTime: number;
}

interface RFIDMetrics {
  rfidTag: string;
  operation: 'verification' | 'registration';
  status: 'success' | 'failed';
  processingTime: number;
  location?: string;
}

interface UserActivityMetrics {
  userId: string;
  action: 'login' | 'logout' | 'order_created' | 'payment_completed' | 'rfid_verified';
  sessionDuration?: number;
  deviceType?: string;
}

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  userId?: string;
}

interface SystemHealthMetrics {
  timestamp: number;
  components: {
    api: { healthy: boolean; responseTime: number };
    database: { healthy: boolean; connectionPool: number };
    cache: { healthy: boolean; hitRate: number };
    payment: { healthy: boolean; successRate: number };
  };
  overallScore: number;
}

class MetricsService {
  /**
   * Track payment transaction with comprehensive metrics
   */
  async trackPayment(metrics: PaymentMetrics): Promise<void> {
    try {
      // Track transaction status
      await cloudwatchService.trackPaymentTransaction(metrics.status, metrics.amount);

      // Track payment processing time
      await cloudwatchService.putMetric({
        metricName: 'PaymentProcessingTime',
        value: metrics.processingTime,
        unit: 'Milliseconds',
        dimensions: {
          Gateway: metrics.gateway,
          Status: metrics.status,
        },
        namespace: 'HASIVU/Business',
      });

      // Calculate and track success rate
      if (metrics.status === 'success' || metrics.status === 'failed') {
        const successRate = metrics.status === 'success' ? 100 : 0;
        await cloudwatchService.trackBusinessMetric(MetricNames.PAYMENT_SUCCESS_RATE, successRate, {
          Gateway: metrics.gateway,
        });
      }

      // Log business event
      await cloudwatchService.logBusinessEvent('Payment transaction processed', {
        transactionId: metrics.transactionId,
        amount: metrics.amount,
        currency: metrics.currency,
        status: metrics.status,
        gateway: metrics.gateway,
        processingTime: metrics.processingTime,
      });
    } catch (error) {
      console.error('Error tracking payment metrics:', error);
      await cloudwatchService.logError(error as Error, { context: 'trackPayment', metrics });
    }
  }

  /**
   * Track order lifecycle with detailed metrics
   */
  async trackOrderCreation(metrics: OrderMetrics): Promise<void> {
    try {
      // Track order created
      await cloudwatchService.trackOrder('created', metrics.orderId);

      // Track order value
      await cloudwatchService.trackBusinessMetric('OrderValue', metrics.totalAmount, {
        SchoolId: metrics.schoolId,
        Currency: 'INR',
      });

      // Track items per order
      await cloudwatchService.trackBusinessMetric('ItemsPerOrder', metrics.itemCount, {
        SchoolId: metrics.schoolId,
      });

      // Track order processing time
      await cloudwatchService.putMetric({
        metricName: 'OrderProcessingTime',
        value: metrics.processingTime,
        unit: 'Milliseconds',
        dimensions: {
          SchoolId: metrics.schoolId,
        },
        namespace: 'HASIVU/Business',
      });

      // Log business event
      await cloudwatchService.logBusinessEvent('Order created', {
        orderId: metrics.orderId,
        userId: metrics.userId,
        schoolId: metrics.schoolId,
        totalAmount: metrics.totalAmount,
        itemCount: metrics.itemCount,
      });
    } catch (error) {
      console.error('Error tracking order creation metrics:', error);
      await cloudwatchService.logError(error as Error, { context: 'trackOrderCreation', metrics });
    }
  }

  /**
   * Track order completion
   */
  async trackOrderCompletion(orderId: string, deliveryTime: number): Promise<void> {
    try {
      await cloudwatchService.trackOrder('completed', orderId);

      // Track delivery time
      await cloudwatchService.putMetric({
        metricName: 'DeliveryTime',
        value: deliveryTime,
        unit: 'Milliseconds',
        namespace: 'HASIVU/Business',
      });

      await cloudwatchService.logBusinessEvent('Order completed', {
        orderId,
        deliveryTime,
      });
    } catch (error) {
      console.error('Error tracking order completion metrics:', error);
    }
  }

  /**
   * Track order cancellation
   */
  async trackOrderCancellation(
    orderId: string,
    reason: string,
    refundAmount?: number
  ): Promise<void> {
    try {
      await cloudwatchService.trackOrder('cancelled', orderId);

      // Track cancellation reason
      await cloudwatchService.trackBusinessMetric('OrderCancellations', 1, {
        Reason: reason,
      });

      if (refundAmount) {
        await cloudwatchService.trackBusinessMetric('RefundAmount', refundAmount, {
          Currency: 'INR',
        });
      }

      await cloudwatchService.logBusinessEvent('Order cancelled', {
        orderId,
        reason,
        refundAmount,
      });
    } catch (error) {
      console.error('Error tracking order cancellation metrics:', error);
    }
  }

  /**
   * Track RFID operations
   */
  async trackRFID(metrics: RFIDMetrics): Promise<void> {
    try {
      await cloudwatchService.trackRFIDOperation(metrics.operation, metrics.status);

      // Track RFID processing time
      await cloudwatchService.putMetric({
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

      // Track failed verifications separately for alerting
      if (metrics.operation === 'verification' && metrics.status === 'failed') {
        await cloudwatchService.trackBusinessMetric(MetricNames.FAILED_VERIFICATIONS, 1);
      }

      await cloudwatchService.logBusinessEvent('RFID operation', {
        rfidTag: metrics.rfidTag,
        operation: metrics.operation,
        status: metrics.status,
        location: metrics.location,
      });
    } catch (error) {
      console.error('Error tracking RFID metrics:', error);
    }
  }

  /**
   * Track user activity
   */
  async trackUserActivity(metrics: UserActivityMetrics): Promise<void> {
    try {
      await cloudwatchService.trackBusinessMetric('UserActivity', 1, {
        Action: metrics.action,
        ...(metrics.deviceType && { DeviceType: metrics.deviceType }),
      });

      // Track session duration for logout events
      if (metrics.action === 'logout' && metrics.sessionDuration) {
        await cloudwatchService.putMetric({
          metricName: 'SessionDuration',
          value: metrics.sessionDuration,
          unit: 'Milliseconds',
          namespace: 'HASIVU/Business',
        });
      }

      // Track active users
      if (metrics.action === 'login') {
        await cloudwatchService.trackBusinessMetric(MetricNames.ACTIVE_USERS, 1);
      }
    } catch (error) {
      console.error('Error tracking user activity metrics:', error);
    }
  }

  /**
   * Track API performance
   */
  async trackApiRequest(metrics: PerformanceMetrics): Promise<void> {
    try {
      await cloudwatchService.trackApiPerformance(
        metrics.endpoint,
        metrics.duration,
        metrics.statusCode
      );

      // Track by HTTP method
      await cloudwatchService.putMetric({
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

      // Track slow API requests
      if (metrics.duration > 1000) {
        await cloudwatchService.putMetric({
          metricName: 'SlowApiRequests',
          value: 1,
          unit: 'Count',
          dimensions: {
            Endpoint: metrics.endpoint,
          },
          namespace: 'HASIVU/Application',
        });
      }
    } catch (error) {
      console.error('Error tracking API performance metrics:', error);
    }
  }

  /**
   * Track system health
   */
  async trackSystemHealth(metrics: SystemHealthMetrics): Promise<void> {
    try {
      // Track overall health score
      await cloudwatchService.trackSystemHealth(metrics.overallScore);

      // Track component health
      for (const [component, health] of Object.entries(metrics.components)) {
        await cloudwatchService.putMetric({
          metricName: 'ComponentHealth',
          value: health.healthy ? 100 : 0,
          unit: 'Percent',
          dimensions: {
            Component: component,
          },
          namespace: 'HASIVU/Infrastructure',
        });

        // Track component-specific metrics
        if (component === 'api' && 'responseTime' in health) {
          await cloudwatchService.putMetric({
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
          await cloudwatchService.putMetric({
            metricName: MetricNames.CACHE_HIT_RATE,
            value: health.hitRate,
            unit: 'Percent',
            dimensions: {
              Component: component,
            },
            namespace: 'HASIVU/Infrastructure',
          });
        }

        if (component === 'payment' && 'successRate' in health) {
          await cloudwatchService.trackBusinessMetric(
            MetricNames.PAYMENT_SUCCESS_RATE,
            health.successRate
          );
        }
      }

      await cloudwatchService.logApplication('INFO', 'System health check completed', {
        overallScore: metrics.overallScore,
        components: metrics.components,
      });
    } catch (error) {
      console.error('Error tracking system health metrics:', error);
    }
  }

  /**
   * Track security event
   */
  async trackSecurityEvent(
    eventType: 'failed_login' | 'suspicious_activity' | 'fraud_attempt' | 'unauthorized_access',
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await cloudwatchService.trackSecurityEvent(eventType, userId);

      await cloudwatchService.logSecurityEvent(`Security event: ${eventType}`, {
        eventType,
        userId,
        ...details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error tracking security event:', error);
    }
  }

  /**
   * Track cost metrics
   */
  async trackCostMetric(
    service: 'Lambda' | 'RDS' | 'APIGateway' | 'S3',
    estimatedCost: number
  ): Promise<void> {
    try {
      await cloudwatchService.trackCost(service, estimatedCost);
    } catch (error) {
      console.error('Error tracking cost metric:', error);
    }
  }

  /**
   * Calculate and track revenue per transaction
   */
  async calculateRevenueMetrics(totalRevenue: number, transactionCount: number): Promise<void> {
    try {
      const revenuePerTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;

      await cloudwatchService.trackBusinessMetric(
        MetricNames.REVENUE_PER_TRANSACTION,
        revenuePerTransaction,
        {
          Currency: 'INR',
        }
      );

      await cloudwatchService.logBusinessEvent('Revenue metrics calculated', {
        totalRevenue,
        transactionCount,
        revenuePerTransaction,
      });
    } catch (error) {
      console.error('Error calculating revenue metrics:', error);
    }
  }

  /**
   * Track database performance
   */
  async trackDatabasePerformance(
    queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    duration: number,
    success: boolean,
    rowCount?: number
  ): Promise<void> {
    try {
      await cloudwatchService.trackDatabaseQuery(queryType, duration, success);

      if (rowCount !== undefined) {
        await cloudwatchService.putMetric({
          metricName: 'DatabaseRowsAffected',
          value: rowCount,
          unit: 'Count',
          dimensions: {
            QueryType: queryType,
          },
          namespace: 'HASIVU/Database',
        });
      }
    } catch (error) {
      console.error('Error tracking database performance:', error);
    }
  }

  /**
   * Track cache performance
   */
  async trackCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    duration: number
  ): Promise<void> {
    try {
      await cloudwatchService.putMetric({
        metricName: 'CacheOperations',
        value: 1,
        unit: 'Count',
        dimensions: {
          Operation: operation,
        },
        namespace: 'HASIVU/Infrastructure',
      });

      await cloudwatchService.putMetric({
        metricName: 'CacheOperationDuration',
        value: duration,
        unit: 'Milliseconds',
        dimensions: {
          Operation: operation,
        },
        namespace: 'HASIVU/Infrastructure',
      });
    } catch (error) {
      console.error('Error tracking cache operation:', error);
    }
  }

  /**
   * Track error occurrence
   */
  async trackError(
    errorType: string,
    errorMessage: string,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      await cloudwatchService.putMetric({
        metricName: 'ApplicationErrors',
        value: 1,
        unit: 'Count',
        dimensions: {
          ErrorType: errorType,
        },
        namespace: 'HASIVU/Application',
      });

      await cloudwatchService.logError(new Error(errorMessage), {
        errorType,
        ...context,
      });
    } catch (error) {
      console.error('Error tracking error metric:', error);
    }
  }

  /**
   * Get aggregated metrics summary
   */
  async getMetricsSummary(): Promise<Record<string, any>> {
    // This would typically query CloudWatch for recent metrics
    // For now, return a structure that shows what's being tracked
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

// Export singleton instance
export const metricsService = new MetricsService();
