"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardGenerationService = void 0;
const logger_1 = require("../../utils/logger");
const cache_1 = require("../../utils/cache");
const metric_tracking_1 = require("./metric-tracking");
const analytics_calculators_1 = require("./analytics-calculators");
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
    static async generateOrderTrends(_dateRange) {
        return [
            { date: '2024-01-01', orders: 45, revenue: 11250 },
            { date: '2024-01-02', orders: 52, revenue: 13000 },
            { date: '2024-01-03', orders: 48, revenue: 12000 },
        ];
    }
}
exports.DashboardGenerationService = DashboardGenerationService;
//# sourceMappingURL=dashboard-generation.js.map