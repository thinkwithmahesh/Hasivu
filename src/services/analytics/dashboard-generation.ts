/**
 * HASIVU Platform - Dashboard Generation Module
 * Handles comprehensive dashboard data generation
 */

import { logger } from '../../utils/logger';
import { cache } from '../../utils/cache';
import { ServiceResponse } from './types';
import { MetricTrackingService } from './metric-tracking';
import { AnalyticsCalculatorsService } from './analytics-calculators';
import { DatabaseManager } from '../../database/DatabaseManager';

export class DashboardGenerationService {
  private static readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Generate comprehensive dashboard data
   */
  public static async generateDashboard(
    dashboardId: string,
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<ServiceResponse<any>> {
    try {
      const range = dateRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
      };

      const cacheKey = `dashboard:${dashboardId}:${range.start.getTime()}:${range.end.getTime()}`;
      const cached = await cache.get(cacheKey);

      if (cached) {
        return {
          success: true,
          data: JSON.parse(cached),
        };
      }

      // Generate dashboard data
      const [kpis, revenueAnalytics, userBehavior, orderTrends] = await Promise.all([
        AnalyticsCalculatorsService.calculateKPIs(range),
        AnalyticsCalculatorsService.generateRevenueAnalytics(range),
        AnalyticsCalculatorsService.generateUserBehaviorAnalytics(range),
        this.generateOrderTrends(range),
      ]);

      const dashboardData = {
        id: dashboardId,
        generatedAt: new Date(),
        generatedBy: userId,
        dateRange: range,
        kpis,
        revenueAnalytics,
        userBehavior,
        orderTrends,
        realTimeMetrics: await MetricTrackingService.getRealtimeMetrics(),
      };

      // Cache for 1 hour
      await cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(dashboardData));

      return {
        success: true,
        data: dashboardData,
      };
    } catch (error: unknown) {
      logger.error(
        'Failed to generate dashboard',
        error instanceof Error ? error : new Error(String(error)),
        { dashboardId, userId }
      );
      return {
        success: false,
        error: {
          message: 'Failed to generate dashboard',
          code: 'DASHBOARD_GENERATION_FAILED',
          details: error,
        },
      };
    }
  }

  /**
   * Generate order trends
   */
  private static async generateOrderTrends(dateRange: { start: Date; end: Date }): Promise<any[]> {
    try {
      const dbManager = DatabaseManager.getInstance();
      const prisma = dbManager.getClient();

      // Query orders within date range, group by date
      const orders = await prisma.order.findMany({
        where: {
          orderDate: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
          status: {
            in: ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'],
          },
        },
        select: {
          orderDate: true,
          totalAmount: true,
        },
        orderBy: {
          orderDate: 'asc',
        },
      });

      // Group orders by date and calculate totals
      const orderTrends = new Map<string, { orders: number; revenue: number }>();

      orders.forEach((order: { orderDate: Date; totalAmount: number }) => {
        const dateKey = order.orderDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        const existing = orderTrends.get(dateKey) || { orders: 0, revenue: 0 };

        orderTrends.set(dateKey, {
          orders: existing.orders + 1,
          revenue: existing.revenue + order.totalAmount,
        });
      });

      // Convert to array format
      return Array.from(orderTrends.entries()).map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: Math.round(data.revenue * 100) / 100, // Round to 2 decimal places
      }));
    } catch (error) {
      logger.error(
        'Failed to generate order trends',
        error instanceof Error ? error : new Error(String(error))
      );
      // Return empty array on error rather than throwing
      return [];
    }
  }
}
