"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardGenerationService = void 0;
const logger_1 = require("../../utils/logger");
const cache_1 = require("../../utils/cache");
const metric_tracking_1 = require("./metric-tracking");
const analytics_calculators_1 = require("./analytics-calculators");
const DatabaseManager_1 = require("../../database/DatabaseManager");
class DashboardGenerationService {
    static CACHE_TTL = 3600;
    static async generateDashboard(dashboardId, userId, dateRange) {
        try {
            const range = dateRange || {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: new Date(),
            };
            const cacheKey = `dashboard:${dashboardId}:${range.start.getTime()}:${range.end.getTime()}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: JSON.parse(cached),
                };
            }
            const [kpis, revenueAnalytics, userBehavior, orderTrends] = await Promise.all([
                analytics_calculators_1.AnalyticsCalculatorsService.calculateKPIs(range),
                analytics_calculators_1.AnalyticsCalculatorsService.generateRevenueAnalytics(range),
                analytics_calculators_1.AnalyticsCalculatorsService.generateUserBehaviorAnalytics(range),
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
                realTimeMetrics: await metric_tracking_1.MetricTrackingService.getRealtimeMetrics(),
            };
            await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(dashboardData));
            return {
                success: true,
                data: dashboardData,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate dashboard', error instanceof Error ? error : new Error(String(error)), { dashboardId, userId });
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
    static async generateOrderTrends(dateRange) {
        try {
            const dbManager = DatabaseManager_1.DatabaseManager.getInstance();
            const prisma = dbManager.getClient();
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
            const orderTrends = new Map();
            orders.forEach((order) => {
                const dateKey = order.orderDate.toISOString().split('T')[0];
                const existing = orderTrends.get(dateKey) || { orders: 0, revenue: 0 };
                orderTrends.set(dateKey, {
                    orders: existing.orders + 1,
                    revenue: existing.revenue + order.totalAmount,
                });
            });
            return Array.from(orderTrends.entries()).map(([date, data]) => ({
                date,
                orders: data.orders,
                revenue: Math.round(data.revenue * 100) / 100,
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to generate order trends', error instanceof Error ? error : new Error(String(error)));
            return [];
        }
    }
}
exports.DashboardGenerationService = DashboardGenerationService;
//# sourceMappingURL=dashboard-generation.js.map