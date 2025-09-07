export type MetricType = 'counter' | 'gauge' | 'histogram' | 'distribution';
export type TimePeriod = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
export type AnalyticsDimension = 'school' | 'user_type' | 'order_status' | 'payment_method' | 'meal_category' | 'device_type';
export interface AnalyticsMetric {
    id: string;
    name: string;
    type: MetricType;
    value: number;
    dimensions: Record<string, string>;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface AnalyticsReport {
    id: string;
    title: string;
    description?: string;
    type: 'dashboard' | 'scheduled' | 'adhoc';
    period: TimePeriod;
    metrics: AnalyticsMetric[];
    data: any[];
    filters: Record<string, any>;
    generatedAt: Date;
    generatedBy: string;
}
export interface DashboardWidget {
    id: string;
    title: string;
    type: 'chart' | 'table' | 'kpi' | 'counter';
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    metric: string;
    dimensions: AnalyticsDimension[];
    filters: Record<string, any>;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: Record<string, any>;
}
export interface KPI {
    id: string;
    name: string;
    description: string;
    current: number;
    target: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    changeValue: number;
    changePercentage: number;
    unit: string;
    format: 'number' | 'currency' | 'percentage' | 'duration';
}
export interface AnalyticsQuery {
    metrics: string[];
    dimensions?: AnalyticsDimension[];
    filters?: Record<string, any>;
    dateRange: {
        start: Date;
        end: Date;
    };
    groupBy?: TimePeriod;
    orderBy?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    limit?: number;
    offset?: number;
}
export interface CohortAnalysis {
    cohortId: string;
    cohortDate: Date;
    userCount: number;
    retentionByPeriod: Record<string, number>;
    lifetimeValue: number;
    avgOrderValue: number;
}
export interface RevenueAnalytics {
    totalRevenue: number;
    recurringRevenue: number;
    averageOrderValue: number;
    revenueGrowthRate: number;
    revenueBySchool: Array<{
        schoolId: string;
        schoolName: string;
        revenue: number;
        orderCount: number;
    }>;
    revenueByPeriod: Array<{
        period: string;
        revenue: number;
        orders: number;
    }>;
}
export interface UserBehaviorAnalytics {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    retentionRate: number;
    engagementScore: number;
    mostPopularFeatures: Array<{
        feature: string;
        usageCount: number;
        uniqueUsers: number;
    }>;
    userJourney: Array<{
        step: string;
        conversionRate: number;
        dropoffRate: number;
    }>;
}
export interface PredictiveAnalytics {
    orderPrediction: {
        nextWeek: number;
        nextMonth: number;
        confidence: number;
    };
    revenueForecast: {
        nextQuarter: number;
        nextYear: number;
        confidence: number;
    };
    churnPrediction: {
        riskUsers: Array<{
            userId: string;
            churnProbability: number;
            factors: string[];
        }>;
    };
    demandForecast: Array<{
        menuItemId: string;
        predictedDemand: number;
        confidence: number;
    }>;
}
export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
        details?: any;
    };
}
export declare class AnalyticsService {
    private static readonly CACHE_TTL;
    private static readonly REALTIME_TTL;
    private static readonly BATCH_SIZE;
    private static readonly RETENTION_PERIODS;
    private static readonly METRIC_DEFINITIONS;
    static initialize(): Promise<void>;
    static trackMetric(name: string, value: number, dimensions?: Record<string, string>, metadata?: Record<string, any>): Promise<ServiceResponse<AnalyticsMetric>>;
    static executeQuery(query: AnalyticsQuery): Promise<ServiceResponse<any[]>>;
    static generateDashboard(dashboardId: string, userId: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<ServiceResponse<any>>;
    static generateReport(period: TimePeriod, reportType: 'summary' | 'detailed' | 'executive'): Promise<ServiceResponse<AnalyticsReport>>;
    static generateCohortAnalysis(startDate: Date, endDate: Date): Promise<ServiceResponse<CohortAnalysis[]>>;
    static generatePredictiveAnalytics(): Promise<ServiceResponse<PredictiveAnalytics>>;
    static getRealtimeMetrics(): Promise<Record<string, any>>;
    private static calculateKPIs;
    private static generateRevenueAnalytics;
    private static generateUserBehaviorAnalytics;
    private static generateOrderTrends;
    private static storeMetric;
    private static updateRealtimeMetric;
    private static generateQueryCacheKey;
    private static performAggregation;
    private static calculatePeriodRange;
    private static generateSummaryReport;
    private static generateDetailedReport;
    private static generateExecutiveReport;
    private static calculateCohortAnalysis;
    private static calculatePredictiveAnalytics;
    private static getOrderStatistics;
    private static getRevenueStatistics;
    private static getUserRetentionStatistics;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map