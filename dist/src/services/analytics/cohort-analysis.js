"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CohortAnalysisService = void 0;
const logger_1 = require("../../utils/logger");
const cache_1 = require("../../utils/cache");
const DatabaseManager_1 = require("../../database/DatabaseManager");
class CohortAnalysisService {
    static async generateCohortAnalysis(startDate, endDate) {
        try {
            const cacheKey = `cohort:${startDate.getTime()}:${endDate.getTime()}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: JSON.parse(cached),
                };
            }
            const cohorts = await this.calculateCohortAnalysis(startDate, endDate);
            await cache_1.cache.setex(cacheKey, 86400, JSON.stringify(cohorts));
            return {
                success: true,
                data: cohorts,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate cohort analysis', error instanceof Error ? error : new Error(String(error)), { startDate, endDate });
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
    static async calculateCohortAnalysis(startDate, endDate) {
        try {
            const dbManager = DatabaseManager_1.DatabaseManager.getInstance();
            const prisma = dbManager.getClient();
            const cohorts = await prisma.$queryRaw `
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
            const cohortAnalysis = [];
            for (const cohort of cohorts) {
                const cohortStart = new Date(cohort.cohortDate);
                const retentionByPeriod = {};
                const periods = [
                    { label: '7d', days: 7 },
                    { label: '30d', days: 30 },
                    { label: '90d', days: 90 },
                ];
                for (const period of periods) {
                    const periodEnd = new Date(cohortStart);
                    periodEnd.setDate(periodEnd.getDate() + period.days);
                    const retainedUsers = await prisma.$queryRaw `
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
                    const retentionRate = cohort.userCount > 0
                        ? Math.round((retainedUsers[0].count / cohort.userCount) * 100)
                        : 0;
                    retentionByPeriod[period.label] = retentionRate;
                }
                cohortAnalysis.push({
                    cohortId: `cohort_${cohort.cohortDate.getFullYear()}_${String(cohort.cohortDate.getMonth() + 1).padStart(2, '0')}`,
                    cohortDate: cohort.cohortDate,
                    userCount: cohort.userCount,
                    retentionByPeriod,
                    lifetimeValue: cohort.userCount > 0 ? Math.round(cohort.totalRevenue / cohort.userCount) : 0,
                    avgOrderValue: cohort.totalOrders > 0 ? Math.round(cohort.totalRevenue / cohort.totalOrders) : 0,
                });
            }
            return cohortAnalysis;
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate cohort analysis', error instanceof Error ? error : new Error(String(error)));
            return [];
        }
    }
}
exports.CohortAnalysisService = CohortAnalysisService;
//# sourceMappingURL=cohort-analysis.js.map