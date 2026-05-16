/**
 * HASIVU Platform - Metric Tracking Service
 * Handles analytics metric tracking and storage
 */

import { logger } from '../../utils/logger';
import { prisma as defaultPrisma } from '../../database/DatabaseManager';

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Metric tracking service for storing and retrieving analytics metrics
 */
export class MetricTrackingService {
  /**
   * Initialize the metric tracking service
   */
  static async initialize(): Promise<void> {
    logger.info('Metric tracking service initialized');
  }

  /**
   * Track a metric value (static wrapper)
   */
  static async trackMetric(
    name: string,
    value: number,
    dimensions: Record<string, string> = {},
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const service = new MetricTrackingService();
      await service.trackMetricInstance({
        name,
        value,
        timestamp: new Date(),
        metadata: { ...dimensions, ...metadata },
      });
      return { success: true };
    } catch (error) {
      logger.error('Failed to track metric (static)', error as Error, { name, value });
      return { success: false, error };
    }
  }

  /**
   * Get real-time metrics for dashboard
   */
  static async getRealtimeMetrics(): Promise<Record<string, any>> {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [ordersInProgress, activeUsers, revenueAggregate, responseMetric] = await Promise.all([
        defaultPrisma.order.count({
          where: { status: { in: ['pending', 'confirmed', 'preparing', 'ready'] } },
        }),
        defaultPrisma.authSession.count({
          where: { isActive: true, lastActivity: { gte: since } },
        }),
        defaultPrisma.payment.aggregate({
          where: { status: { in: ['completed', 'captured', 'paid'] }, createdAt: { gte: since } },
          _sum: { amount: true },
        }),
        defaultPrisma.analyticsMetric.aggregate({
          where: { name: 'http.response_time_ms', createdAt: { gte: since } },
          _avg: { value: true },
        }),
      ]);
      return {
        activeUsers,
        ordersInProgress,
        revenue24h: Number(revenueAggregate._sum.amount || 0),
        avgResponseTime: responseMetric._avg.value || 0,
      };
    } catch (error) {
      logger.error('Failed to fetch real-time metrics', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return {};
    }
  }

  /**
   * Track a metric value (instance method)
   */
  async trackMetricInstance(metric: MetricData): Promise<void> {
    try {
      await defaultPrisma.analyticsMetric.create({
        data: {
          name: metric.name,
          value: metric.value,
          metadata: metric.metadata || undefined,
          createdAt: metric.timestamp,
        },
      });
    } catch (error) {
      logger.error('Failed to track metric', error as Error, { metric });
      throw error;
    }
  }

  /**
   * Get metrics based on filter criteria (instance method)
   */
  async getMetrics(filter: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<MetricData[]> {
    try {
      const metrics = await defaultPrisma.analyticsMetric.findMany({
        where: {
          ...(filter.name ? { name: filter.name } : {}),
          createdAt:
            filter.startDate || filter.endDate
              ? {
                  ...(filter.startDate ? { gte: filter.startDate } : {}),
                  ...(filter.endDate ? { lte: filter.endDate } : {}),
                }
              : undefined,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });
      return metrics.map(metric => ({
        name: metric.name,
        value: metric.value,
        timestamp: metric.createdAt,
        metadata: (metric.metadata as Record<string, any> | null) || undefined,
      }));
    } catch (error) {
      logger.error('Failed to fetch metrics', error as Error, { filter });
      throw error;
    }
  }

  /**
   * Track multiple metrics in batch (instance method)
   */
  async trackMetricsBatch(metrics: MetricData[]): Promise<void> {
    try {
      logger.info('Tracking metrics batch', { count: metrics.length });

      for (const metric of metrics) {
        await this.trackMetricInstance(metric);
      }
    } catch (error) {
      logger.error('Failed to track metrics batch', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete old metrics based on retention policy
   */
  async cleanupOldMetrics(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await defaultPrisma.analyticsMetric.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      });
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup old metrics', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const metricTrackingService = new MetricTrackingService();
