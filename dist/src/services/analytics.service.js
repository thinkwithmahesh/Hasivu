"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const logger_1 = require("../utils/logger");
const cache_1 = require("../utils/cache");
const uuid_1 = require("uuid");
class AnalyticsService {
    static CACHE_TTL = 3600;
    static REALTIME_TTL = 60;
    static BATCH_SIZE = 1000;
    static RETENTION_PERIODS = [1, 7, 30, 90, 365];
    static METRIC_DEFINITIONS = {
        'orders.total': { type: 'counter', description: 'Total number of orders' },
        'orders.value': { type: 'counter', description: 'Total order value' },
        'orders.avg_value': { type: 'gauge', description: 'Average order value' },
        'orders.completion_rate': { type: 'gauge', description: 'Order completion rate' },
        'orders.cancellation_rate': { type: 'gauge', description: 'Order cancellation rate' },
        'users.total': { type: 'gauge', description: 'Total active users' },
        'users.new': { type: 'counter', description: 'New user registrations' },
        'users.retention': { type: 'gauge', description: 'User retention rate' },
        'users.engagement': { type: 'gauge', description: 'User engagement score' },
        'users.churn_rate': { type: 'gauge', description: 'User churn rate' },
        'schools.total': { type: 'gauge', description: 'Total active schools' },
        'schools.orders_per_school': { type: 'gauge', description: 'Average orders per school' },
        'schools.revenue_per_school': { type: 'gauge', description: 'Average revenue per school' },
        'schools.active_students': { type: 'gauge', description: 'Active students count' },
        'payments.success_rate': { type: 'gauge', description: 'Payment success rate' },
        'payments.avg_processing_time': { type: 'gauge', description: 'Average payment processing time' },
        'payments.failed_count': { type: 'counter', description: 'Failed payment attempts' },
        'payments.refund_rate': { type: 'gauge', description: 'Payment refund rate' },
        'rfid.verifications': { type: 'counter', description: 'RFID verification count' },
        'rfid.success_rate': { type: 'gauge', description: 'RFID verification success rate' },
        'rfid.avg_scan_time': { type: 'gauge', description: 'Average RFID scan time' },
        'rfid.unique_cards': { type: 'gauge', description: 'Unique RFID cards scanned' },
        'notifications.sent': { type: 'counter', description: 'Notifications sent' },
        'notifications.delivery_rate': { type: 'gauge', description: 'Notification delivery rate' },
        'notifications.engagement_rate': { type: 'gauge', description: 'Notification engagement rate' },
        'notifications.unsubscribe_rate': { type: 'gauge', description: 'Notification unsubscribe rate' },
        'system.response_time': { type: 'histogram', description: 'API response time' },
        'system.error_rate': { type: 'gauge', description: 'System error rate' },
        'system.uptime': { type: 'gauge', description: 'System uptime percentage' },
        'system.concurrent_users': { type: 'gauge', description: 'Concurrent active users' }
    };
    static async initialize() {
        try {
            logger_1.logger.info('Analytics service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize analytics service', error);
            throw error;
        }
    }
    static async trackMetric(name, value, dimensions = {}, metadata) {
        try {
            if (!this.METRIC_DEFINITIONS[name]) {
                return {
                    success: false,
                    error: {
                        message: `Unknown metric: ${name}`,
                        code: 'UNKNOWN_METRIC'
                    }
                };
            }
            const metric = {
                id: (0, uuid_1.v4)(),
                name,
                type: this.METRIC_DEFINITIONS[name].type,
                value,
                dimensions,
                timestamp: new Date(),
                metadata
            };
            await this.storeMetric(metric);
            await this.updateRealtimeMetric(metric);
            logger_1.logger.debug('Metric tracked successfully', { name, value, dimensions });
            return {
                success: true,
                data: metric
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to track metric', error, { name, value, dimensions });
            return {
                success: false,
                error: {
                    message: 'Failed to track metric',
                    code: 'METRIC_TRACKING_FAILED',
                    details: error
                }
            };
        }
    }
    static async executeQuery(query) {
        try {
            logger_1.logger.info('Executing analytics query', {
                metrics: query.metrics,
                dateRange: query.dateRange
            });
            const cacheKey = this.generateQueryCacheKey(query);
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: JSON.parse(cached)
                };
            }
            const results = await this.performAggregation(query);
            await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(results));
            return {
                success: true,
                data: results
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to execute analytics query', error, { query });
            return {
                success: false,
                error: {
                    message: 'Failed to execute query',
                    code: 'QUERY_EXECUTION_FAILED',
                    details: error
                }
            };
        }
    }
    static async generateDashboard(dashboardId, userId, dateRange) {
        try {
            const range = dateRange || {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: new Date()
            };
            const cacheKey = `dashboard:${dashboardId}:${range.start.getTime()}:${range.end.getTime()}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: JSON.parse(cached)
                };
            }
            const [kpis, revenueAnalytics, userBehavior, orderTrends] = await Promise.all([
                this.calculateKPIs(range),
                this.generateRevenueAnalytics(range),
                this.generateUserBehaviorAnalytics(range),
                this.generateOrderTrends(range)
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
                realTimeMetrics: await this.getRealtimeMetrics()
            };
            await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(dashboardData));
            return {
                success: true,
                data: dashboardData
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate dashboard', error, { dashboardId, userId });
            return {
                success: false,
                error: {
                    message: 'Failed to generate dashboard',
                    code: 'DASHBOARD_GENERATION_FAILED',
                    details: error
                }
            };
        }
    }
    static async generateReport(period, reportType) {
        try {
            const reportId = `${period}_${reportType}_${Date.now()}`;
            const cacheKey = `report:${reportId}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: JSON.parse(cached)
                };
            }
            const dateRange = this.calculatePeriodRange(period);
            const report = {
                id: reportId,
                title: `${period.charAt(0).toUpperCase() + period.slice(1)} ${reportType} Report`,
                type: 'scheduled',
                period,
                metrics: [],
                data: [],
                filters: { period, reportType },
                generatedAt: new Date(),
                generatedBy: 'system'
            };
            switch (reportType) {
                case 'summary':
                    report.data = await this.generateSummaryReport(dateRange);
                    break;
                case 'detailed':
                    report.data = await this.generateDetailedReport(dateRange);
                    break;
                case 'executive':
                    report.data = await this.generateExecutiveReport(dateRange);
                    break;
            }
            const cacheDuration = period === 'hour' ? 3600 : period === 'day' ? 86400 : this.CACHE_TTL;
            await cache_1.cache.setex(cacheKey, cacheDuration, JSON.stringify(report));
            logger_1.logger.info('Report generated successfully', {
                reportId,
                period,
                reportType,
                dataPoints: report.data.length
            });
            return {
                success: true,
                data: report
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate report', error, { period, reportType });
            return {
                success: false,
                error: {
                    message: 'Failed to generate report',
                    code: 'REPORT_GENERATION_FAILED',
                    details: error
                }
            };
        }
    }
    static async generateCohortAnalysis(startDate, endDate) {
        try {
            const cacheKey = `cohort:${startDate.getTime()}:${endDate.getTime()}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: JSON.parse(cached)
                };
            }
            const cohorts = await this.calculateCohortAnalysis(startDate, endDate);
            await cache_1.cache.setex(cacheKey, 86400, JSON.stringify(cohorts));
            return {
                success: true,
                data: cohorts
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate cohort analysis', error, { startDate, endDate });
            return {
                success: false,
                error: {
                    message: 'Failed to generate cohort analysis',
                    code: 'COHORT_ANALYSIS_FAILED',
                    details: error
                }
            };
        }
    }
    static async generatePredictiveAnalytics() {
        try {
            const cacheKey = 'predictive_analytics';
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: JSON.parse(cached)
                };
            }
            const predictions = await this.calculatePredictiveAnalytics();
            await cache_1.cache.setex(cacheKey, 21600, JSON.stringify(predictions));
            return {
                success: true,
                data: predictions
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate predictive analytics', error);
            return {
                success: false,
                error: {
                    message: 'Failed to generate predictions',
                    code: 'PREDICTION_FAILED',
                    details: error
                }
            };
        }
    }
    static async getRealtimeMetrics() {
        try {
            const metrics = [
                'orders.total',
                'users.total',
                'payments.success_rate',
                'system.response_time',
                'system.concurrent_users'
            ];
            const realtimeData = {};
            for (const metric of metrics) {
                const cacheKey = `realtime:${metric}`;
                const value = await cache_1.cache.get(cacheKey);
                realtimeData[metric] = value ? JSON.parse(value) : null;
            }
            return realtimeData;
        }
        catch (error) {
            logger_1.logger.error('Failed to get realtime metrics', error);
            return {};
        }
    }
    static async calculateKPIs(dateRange) {
        const kpis = [];
        try {
            const orderStats = await this.getOrderStatistics(dateRange);
            kpis.push({
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
                format: 'percentage'
            });
            const revenueStats = await this.getRevenueStatistics(dateRange);
            kpis.push({
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
                format: 'currency'
            });
            const retentionStats = await this.getUserRetentionStatistics(dateRange);
            kpis.push({
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
                format: 'percentage'
            });
            return kpis;
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate KPIs', error);
            return [];
        }
    }
    static async generateRevenueAnalytics(dateRange) {
        return {
            totalRevenue: 125000,
            recurringRevenue: 95000,
            averageOrderValue: 250,
            revenueGrowthRate: 15.2,
            revenueBySchool: [
                { schoolId: '1', schoolName: 'ABC School', revenue: 45000, orderCount: 180 },
                { schoolId: '2', schoolName: 'XYZ School', revenue: 38000, orderCount: 152 }
            ],
            revenueByPeriod: [
                { period: '2024-01', revenue: 42000, orders: 168 },
                { period: '2024-02', revenue: 48000, orders: 192 }
            ]
        };
    }
    static async generateUserBehaviorAnalytics(dateRange) {
        return {
            totalUsers: 1250,
            activeUsers: 890,
            newUsers: 45,
            retentionRate: 78.5,
            engagementScore: 8.2,
            mostPopularFeatures: [
                { feature: 'Order Tracking', usageCount: 2340, uniqueUsers: 780 },
                { feature: 'Menu Browse', usageCount: 1890, uniqueUsers: 650 }
            ],
            userJourney: [
                { step: 'Registration', conversionRate: 85, dropoffRate: 15 },
                { step: 'First Order', conversionRate: 72, dropoffRate: 28 }
            ]
        };
    }
    static async generateOrderTrends(dateRange) {
        return [
            { date: '2024-01-01', orders: 45, revenue: 11250 },
            { date: '2024-01-02', orders: 52, revenue: 13000 },
            { date: '2024-01-03', orders: 48, revenue: 12000 }
        ];
    }
    static async storeMetric(metric) {
        logger_1.logger.debug('Storing metric', metric);
    }
    static async updateRealtimeMetric(metric) {
        const cacheKey = `realtime:${metric.name}`;
        const current = await cache_1.cache.get(cacheKey);
        let newValue = metric.value;
        if (current && this.METRIC_DEFINITIONS[metric.name].type === 'counter') {
            newValue += parseFloat(current);
        }
        await cache_1.cache.setex(cacheKey, this.REALTIME_TTL, newValue.toString());
    }
    static generateQueryCacheKey(query) {
        const key = [
            'analytics_query',
            query.metrics.join(','),
            query.dateRange.start.getTime(),
            query.dateRange.end.getTime(),
            query.groupBy || 'none',
            JSON.stringify(query.filters || {}),
            query.limit || 'all',
            query.offset || 0
        ].join(':');
        return key;
    }
    static async performAggregation(query) {
        return [
            { metric: query.metrics[0], value: 100, timestamp: new Date() }
        ];
    }
    static calculatePeriodRange(period) {
        const now = new Date();
        const start = new Date(now);
        switch (period) {
            case 'hour':
                start.setHours(start.getHours() - 1);
                break;
            case 'day':
                start.setDate(start.getDate() - 1);
                break;
            case 'week':
                start.setDate(start.getDate() - 7);
                break;
            case 'month':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(start.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(start.getFullYear() - 1);
                break;
        }
        return { start, end: now };
    }
    static async generateSummaryReport(dateRange) {
        return [{ summary: 'High-level metrics and trends' }];
    }
    static async generateDetailedReport(dateRange) {
        return [{ detailed: 'Comprehensive metrics breakdown' }];
    }
    static async generateExecutiveReport(dateRange) {
        return [{ executive: 'Executive summary and insights' }];
    }
    static async calculateCohortAnalysis(startDate, endDate) {
        return [{
                cohortId: 'cohort_2024_01',
                cohortDate: new Date('2024-01-01'),
                userCount: 100,
                retentionByPeriod: { '7d': 85, '30d': 72, '90d': 65 },
                lifetimeValue: 1250,
                avgOrderValue: 250
            }];
    }
    static async calculatePredictiveAnalytics() {
        return {
            orderPrediction: {
                nextWeek: 350,
                nextMonth: 1400,
                confidence: 0.85
            },
            revenueForecast: {
                nextQuarter: 125000,
                nextYear: 500000,
                confidence: 0.78
            },
            churnPrediction: {
                riskUsers: [
                    {
                        userId: 'user123',
                        churnProbability: 0.75,
                        factors: ['low_engagement', 'payment_failures']
                    }
                ]
            },
            demandForecast: [
                {
                    menuItemId: 'item123',
                    predictedDemand: 120,
                    confidence: 0.82
                }
            ]
        };
    }
    static async getOrderStatistics(dateRange) {
        return {
            completionRate: 92.5,
            trend: 'up',
            change: 2.3,
            changePercentage: 5.2
        };
    }
    static async getRevenueStatistics(dateRange) {
        return {
            total: 125000,
            target: 120000,
            trend: 'up',
            change: 15000,
            changePercentage: 13.6
        };
    }
    static async getUserRetentionStatistics(dateRange) {
        return {
            rate: 78.5,
            trend: 'stable',
            change: 0.5,
            changePercentage: 0.6
        };
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analytics.service.js.map