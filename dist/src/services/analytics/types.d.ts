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
    metadata?: Record<string, unknown>;
}
export interface AnalyticsReport {
    id: string;
    title: string;
    description?: string;
    type: 'dashboard' | 'scheduled' | 'adhoc';
    period: TimePeriod;
    metrics: AnalyticsMetric[];
    data: unknown[] | undefined;
    filters: Record<string, unknown>;
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
    filters: Record<string, unknown>;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: Record<string, unknown>;
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
    filters?: Record<string, unknown>;
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
        details?: unknown;
    };
}
//# sourceMappingURL=types.d.ts.map