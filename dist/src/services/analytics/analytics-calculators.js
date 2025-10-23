"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsCalculatorsService = void 0;
const logger_1 = require("../../utils/logger");
class AnalyticsCalculatorsService {
    static async calculateKPIs(dateRange) {
        try {
            const [orderStats, revenueStats, retentionStats] = await Promise.all([
                this.getOrderStatistics(dateRange),
                this.getRevenueStatistics(dateRange),
                this.getUserRetentionStatistics(dateRange),
            ]);
            return [
                this.createOrderCompletionKPI(orderStats),
                this.createRevenueKPI(revenueStats),
                this.createUserRetentionKPI(retentionStats),
            ];
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate KPIs', error instanceof Error ? error : new Error(String(error)));
            return [];
        }
    }
    static createOrderCompletionKPI(orderStats) {
        return {
            id: 'order_completion_rate',
            name: 'Order Completion Rate',
            description: 'Percentage of orders successfully completed',
            current: orderStats.completionRate,
            target: 95,
            percentage: (orderStats.completionRate / 95) * 100,
            trend: orderStats.trend,
            changeValue: orderStats.change,
            changePercentage: orderStats.changePercentage,
            unit: '%',
            format: 'percentage',
        };
    }
    static createRevenueKPI(revenueStats) {
        return {
            id: 'total_revenue',
            name: 'Total Revenue',
            description: 'Total revenue generated in the period',
            current: revenueStats.total,
            target: revenueStats.target,
            percentage: (revenueStats.total / revenueStats.target) * 100,
            trend: revenueStats.trend,
            changeValue: revenueStats.change,
            changePercentage: revenueStats.changePercentage,
            unit: '₹',
            format: 'currency',
        };
    }
    static createUserRetentionKPI(retentionStats) {
        return {
            id: 'user_retention',
            name: 'User Retention Rate',
            description: '30-day user retention rate',
            current: retentionStats.rate,
            target: 80,
            percentage: (retentionStats.rate / 80) * 100,
            trend: retentionStats.trend,
            changeValue: retentionStats.change,
            changePercentage: retentionStats.changePercentage,
            unit: '%',
            format: 'percentage',
        };
    }
    static async generateRevenueAnalytics(_dateRange) {
        return {
            totalRevenue: 125000,
            recurringRevenue: 95000,
            averageOrderValue: 250,
            revenueGrowthRate: 15.2,
            revenueBySchool: [
                { schoolId: '1', schoolName: 'ABC School', revenue: 45000, orderCount: 180 },
                { schoolId: '2', schoolName: 'XYZ School', revenue: 38000, orderCount: 152 },
            ],
            revenueByPeriod: [
                { period: '2024-01', revenue: 42000, orders: 168 },
                { period: '2024-02', revenue: 48000, orders: 192 },
            ],
        };
    }
    static async generateUserBehaviorAnalytics(_dateRange) {
        return {
            totalUsers: 1250,
            activeUsers: 890,
            newUsers: 45,
            retentionRate: 78.5,
            engagementScore: 8.2,
            mostPopularFeatures: [
                { feature: 'Order Tracking', usageCount: 2340, uniqueUsers: 780 },
                { feature: 'Menu Browse', usageCount: 1890, uniqueUsers: 650 },
            ],
            userJourney: [
                { step: 'Registration', conversionRate: 85, dropoffRate: 15 },
                { step: 'First Order', conversionRate: 72, dropoffRate: 28 },
            ],
        };
    }
    static async getOrderStatistics(_dateRange) {
        return {
            completionRate: 92.5,
            trend: 'up',
            change: 2.3,
            changePercentage: 5.2,
        };
    }
    static async getRevenueStatistics(_dateRange) {
        return {
            total: 125000,
            target: 120000,
            trend: 'up',
            change: 15000,
            changePercentage: 13.6,
        };
    }
    static async getUserRetentionStatistics(_dateRange) {
        return {
            rate: 78.5,
            trend: 'stable',
            change: 0.5,
            changePercentage: 0.6,
        };
    }
}
exports.AnalyticsCalculatorsService = AnalyticsCalculatorsService;
//# sourceMappingURL=analytics-calculators.js.map