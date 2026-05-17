/**
 * HASIVU Platform - Cohort Analysis Module
 * Handles user cohort analysis for retention tracking
 */

import { logger } from '../../utils/logger';
import { cache } from '../../utils/cache';
import { CohortAnalysis, ServiceResponse } from './types';
import { DatabaseManager } from '../../database/DatabaseManager';

export class CohortAnalysisService {
  /**
   * Generate cohort analysis for user retention
   */
  public static async generateCohortAnalysis(
    startDate: Date,
    endDate: Date
  ): Promise<ServiceResponse<CohortAnalysis[]>> {
    try {
      const cacheKey = `cohort:${startDate.getTime()}:${endDate.getTime()}`;
      const cached = await cache.get(cacheKey);

      if (cached) {
        return {
          success: true,
          data: JSON.parse(cached),
        };
      }

      const cohorts = await this.calculateCohortAnalysis(startDate, endDate);

      // Cache for 24 hours
      await cache.setex(cacheKey, 86400, JSON.stringify(cohorts));

      return {
        success: true,
        data: cohorts,
      };
    } catch (error: unknown) {
      logger.error(
        'Failed to generate cohort analysis',
        error instanceof Error ? error : new Error(String(error)),
        { startDate, endDate }
      );
      return {
        success: false,
        error: {
          message: 'Failed to generate cohort analysis',
          code: 'COHORT_ANALYSIS_FAILED',
          details: error,
        },
      };
    }
  }

  /**
   * Calculate cohort analysis
   */
  private static async calculateCohortAnalysis(
    startDate: Date,
    endDate: Date
  ): Promise<CohortAnalysis[]> {
    try {
      const dbManager = DatabaseManager.getInstance();
      const prisma = dbManager.getClient();

      // Get users who made their first order within the date range
      const cohorts = await prisma.$queryRaw<
        Array<{
          cohortMonth: string;
          cohortDate: Date;
          userCount: number;
          totalRevenue: number;
          totalOrders: number;
        }>
      >`
        SELECT
          DATE_TRUNC('month', first_order_date) as cohort_month,
          DATE_TRUNC('month', first_order_date) as cohort_date,
          COUNT(DISTINCT user_id) as user_count,
          COALESCE(SUM(total_revenue), 0) as total_revenue,
          COALESCE(SUM(order_count), 0) as total_orders
        FROM (
          SELECT
            o.user_id,
            MIN(o.order_date) as first_order_date,
            SUM(o.total_amount) as total_revenue,
            COUNT(o.id) as order_count
          FROM orders o
          WHERE o.order_date BETWEEN ${startDate} AND ${endDate}
            AND o.status IN ('confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered')
          GROUP BY o.user_id
        ) user_first_orders
        GROUP BY DATE_TRUNC('month', first_order_date)
        ORDER BY cohort_month
      `;

      // Calculate retention for each cohort
      const cohortAnalysis: CohortAnalysis[] = [];

      for (const cohort of cohorts) {
        const cohortStart = new Date(cohort.cohortDate);
        const retentionByPeriod: Record<string, number> = {};

        // Calculate retention for different periods
        const periods = [
          { label: '7d', days: 7 },
          { label: '30d', days: 30 },
          { label: '90d', days: 90 },
        ];

        for (const period of periods) {
          const periodEnd = new Date(cohortStart);
          periodEnd.setDate(periodEnd.getDate() + period.days);

          const retainedUsers = await prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(DISTINCT o.user_id) as count
            FROM orders o
            INNER JOIN (
              SELECT user_id, MIN(order_date) as first_order_date
              FROM orders
              WHERE order_date BETWEEN ${startDate} AND ${endDate}
                AND status IN ('confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered')
              GROUP BY user_id
              HAVING DATE_TRUNC('month', MIN(order_date)) = ${cohort.cohortDate}
            ) first_orders ON o.user_id = first_orders.user_id
            WHERE o.order_date BETWEEN ${cohortStart} AND ${periodEnd}
              AND o.status IN ('confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered')
          `;

          const retentionRate =
            cohort.userCount > 0
              ? Math.round((retainedUsers[0].count / cohort.userCount) * 100)
              : 0;
          retentionByPeriod[period.label] = retentionRate;
        }

        cohortAnalysis.push({
          cohortId: `cohort_${cohort.cohortDate.getFullYear()}_${String(cohort.cohortDate.getMonth() + 1).padStart(2, '0')}`,
          cohortDate: cohort.cohortDate,
          userCount: cohort.userCount,
          retentionByPeriod,
          lifetimeValue:
            cohort.userCount > 0 ? Math.round(cohort.totalRevenue / cohort.userCount) : 0,
          avgOrderValue:
            cohort.totalOrders > 0 ? Math.round(cohort.totalRevenue / cohort.totalOrders) : 0,
        });
      }

      return cohortAnalysis;
    } catch (error) {
      logger.error(
        'Failed to calculate cohort analysis',
        error instanceof Error ? error : new Error(String(error))
      );
      // Return empty array on error rather than throwing
      return [];
    }
  }
}
