"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictiveAnalyticsService = void 0;
const logger_1 = require("../../utils/logger");
const cache_1 = require("../../utils/cache");
const DatabaseManager_1 = require("../../database/DatabaseManager");
class PredictiveAnalyticsService {
    static async generatePredictiveAnalytics() {
        try {
            const cacheKey = 'predictive_analytics';
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: JSON.parse(cached),
                };
            }
            const predictions = await this.calculatePredictiveAnalytics();
            await cache_1.cache.setex(cacheKey, 21600, JSON.stringify(predictions));
            return {
                success: true,
                data: predictions,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate predictive analytics', error instanceof Error ? error : new Error(String(error)));
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
    static async calculatePredictiveAnalytics() {
        try {
            const dbManager = DatabaseManager_1.DatabaseManager.getInstance();
            const prisma = dbManager.getClient();
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
            const dailyStats = new Map();
            historicalOrders.forEach(order => {
                const dateKey = order.orderDate.toISOString().split('T')[0];
                const existing = dailyStats.get(dateKey) || { orders: 0, revenue: 0 };
                dailyStats.set(dateKey, {
                    orders: existing.orders + 1,
                    revenue: existing.revenue + order.totalAmount,
                });
            });
            const dailyData = Array.from(dailyStats.values());
            const avgOrdersPerDay = dailyData.length > 0
                ? dailyData.reduce((sum, day) => sum + day.orders, 0) / dailyData.length
                : 0;
            const avgRevenuePerDay = dailyData.length > 0
                ? dailyData.reduce((sum, day) => sum + day.revenue, 0) / dailyData.length
                : 0;
            let trend = 0;
            if (dailyData.length >= 2) {
                const recent = dailyData.slice(-7);
                const older = dailyData.slice(-14, -7);
                const recentAvg = recent.reduce((sum, day) => sum + day.orders, 0) / recent.length;
                const olderAvg = older.reduce((sum, day) => sum + day.orders, 0) / older.length;
                trend = (recentAvg - olderAvg) / olderAvg;
            }
            const nextWeekPrediction = Math.max(0, Math.round(avgOrdersPerDay * 7 * (1 + trend)));
            const nextMonthPrediction = Math.max(0, Math.round(avgOrdersPerDay * 30 * (1 + trend * 0.8)));
            const nextQuarterRevenue = Math.round(avgRevenuePerDay * 90 * (1 + trend * 0.6));
            const nextYearRevenue = Math.round(avgRevenuePerDay * 365 * (1 + trend * 0.4));
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const churnRiskUsers = await prisma.$queryRaw `
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
                churnProbability: user.lastOrderDate ? 0.6 : 0.8,
                factors: user.lastOrderDate
                    ? ['low_engagement', 'no_recent_orders']
                    : ['never_ordered', 'inactive_account'],
            }));
            const menuItemDemand = await prisma.$queryRaw `
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
                predictedDemand: Math.round(item.avgQuantity * 1.1),
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
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate predictive analytics', error instanceof Error ? error : new Error(String(error)));
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
exports.PredictiveAnalyticsService = PredictiveAnalyticsService;
//# sourceMappingURL=predictive-analytics.js.map