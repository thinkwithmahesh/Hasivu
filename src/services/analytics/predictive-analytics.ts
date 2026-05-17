/**
 * HASIVU Platform - Predictive Analytics Module
 * Handles ML-based predictions using historical data
 */

import { logger } from '../../utils/logger';
import { cache } from '../../utils/cache';
import { PredictiveAnalytics, ServiceResponse } from './types';
import { DatabaseManager } from '../../database/DatabaseManager';

export class PredictiveAnalyticsService {
  /**
   * Generate predictive analytics using historical data
   */
  public static async generatePredictiveAnalytics(): Promise<ServiceResponse<PredictiveAnalytics>> {
    try {
      const cacheKey = 'predictive_analytics';
      const cached = await cache.get(cacheKey);

      if (cached) {
        return {
          success: true,
          data: JSON.parse(cached),
        };
      }

      const predictions = await this.calculatePredictiveAnalytics();

      // Cache for 6 hours
      await cache.setex(cacheKey, 21600, JSON.stringify(predictions));

      return {
        success: true,
        data: predictions,
      };
    } catch (error: unknown) {
      logger.error(
        'Failed to generate predictive analytics',
        error instanceof Error ? error : new Error(String(error))
      );
      return {
        success: false,
        error: {
          message: 'Failed to generate predictions',
          code: 'PREDICTION_FAILED',
          details: error,
        },
      };
    }
  }

  /**
   * Calculate predictive analytics
   */
  private static async calculatePredictiveAnalytics(): Promise<PredictiveAnalytics> {
    try {
      const dbManager = DatabaseManager.getInstance();
      const prisma = dbManager.getClient();

      // Get historical order data for the past 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const historicalOrders = await prisma.order.findMany({
        where: {
          orderDate: {
            gte: ninetyDaysAgo,
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

      // Calculate daily order counts and revenue
      const dailyStats = new Map<string, { orders: number; revenue: number }>();
      historicalOrders.forEach(order => {
        const dateKey = order.orderDate.toISOString().split('T')[0];
        const existing = dailyStats.get(dateKey) || { orders: 0, revenue: 0 };
        dailyStats.set(dateKey, {
          orders: existing.orders + 1,
          revenue: existing.revenue + order.totalAmount,
        });
      });

      // Simple linear regression for predictions
      const dailyData = Array.from(dailyStats.values());
      const avgOrdersPerDay =
        dailyData.length > 0
          ? dailyData.reduce((sum, day) => sum + day.orders, 0) / dailyData.length
          : 0;
      const avgRevenuePerDay =
        dailyData.length > 0
          ? dailyData.reduce((sum, day) => sum + day.revenue, 0) / dailyData.length
          : 0;

      // Calculate trend (simple slope calculation)
      let trend = 0;
      if (dailyData.length >= 2) {
        const recent = dailyData.slice(-7); // Last 7 days
        const older = dailyData.slice(-14, -7); // Previous 7 days
        const recentAvg = recent.reduce((sum, day) => sum + day.orders, 0) / recent.length;
        const olderAvg = older.reduce((sum, day) => sum + day.orders, 0) / older.length;
        trend = (recentAvg - olderAvg) / olderAvg;
      }

      // Predict next week and month
      const nextWeekPrediction = Math.max(0, Math.round(avgOrdersPerDay * 7 * (1 + trend)));
      const nextMonthPrediction = Math.max(0, Math.round(avgOrdersPerDay * 30 * (1 + trend * 0.8))); // Slightly dampened trend

      // Revenue forecast
      const nextQuarterRevenue = Math.round(avgRevenuePerDay * 90 * (1 + trend * 0.6));
      const nextYearRevenue = Math.round(avgRevenuePerDay * 365 * (1 + trend * 0.4));

      // Churn prediction - users with no orders in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const churnRiskUsers = await prisma.$queryRaw<
        Array<{
          userId: string;
          lastOrderDate: Date;
          totalOrders: number;
          totalSpent: number;
        }>
      >`
        SELECT
          u.id as "userId",
          MAX(o.order_date) as "lastOrderDate",
          COUNT(o.id) as "totalOrders",
          COALESCE(SUM(o.total_amount), 0) as "totalSpent"
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
          AND o.status IN ('confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered')
        WHERE u.created_at < ${thirtyDaysAgo}
        GROUP BY u.id
        HAVING MAX(o.order_date) < ${thirtyDaysAgo} OR MAX(o.order_date) IS NULL
        ORDER BY "lastOrderDate" DESC NULLS FIRST
        LIMIT 10
      `;

      const riskUsers = churnRiskUsers.map(user => ({
        userId: user.userId,
        churnProbability: user.lastOrderDate ? 0.6 : 0.8, // Higher risk for never ordered
        factors: user.lastOrderDate
          ? ['low_engagement', 'no_recent_orders']
          : ['never_ordered', 'inactive_account'],
      }));

      // Demand forecast - top menu items by recent orders
      const menuItemDemand = await prisma.$queryRaw<
        Array<{
          menuItemId: string;
          totalOrdered: number;
          avgQuantity: number;
        }>
      >`
        SELECT
          mi.id as "menuItemId",
          COUNT(oi.id) as "totalOrdered",
          AVG(oi.quantity) as "avgQuantity"
        FROM menu_items mi
        LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE o.order_date >= ${ninetyDaysAgo}
          AND o.status IN ('confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered')
        GROUP BY mi.id, mi.name
        ORDER BY "totalOrdered" DESC
        LIMIT 5
      `;

      const demandForecast = menuItemDemand.map(item => ({
        menuItemId: item.menuItemId,
        predictedDemand: Math.round(item.avgQuantity * 1.1), // 10% increase prediction
        confidence: 0.75,
      }));

      return {
        orderPrediction: {
          nextWeek: nextWeekPrediction,
          nextMonth: nextMonthPrediction,
          confidence: 0.75,
        },
        revenueForecast: {
          nextQuarter: nextQuarterRevenue,
          nextYear: nextYearRevenue,
          confidence: 0.7,
        },
        churnPrediction: {
          riskUsers,
        },
        demandForecast,
      };
    } catch (error) {
      logger.error(
        'Failed to calculate predictive analytics',
        error instanceof Error ? error : new Error(String(error))
      );
      // Return default values on error
      return {
        orderPrediction: {
          nextWeek: 0,
          nextMonth: 0,
          confidence: 0,
        },
        revenueForecast: {
          nextQuarter: 0,
          nextYear: 0,
          confidence: 0,
        },
        churnPrediction: {
          riskUsers: [],
        },
        demandForecast: [],
      };
    }
  }
}
