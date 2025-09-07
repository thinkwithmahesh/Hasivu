interface BusinessMetrics {
    revenue: {
        total: number;
        monthly: number;
        weekly: number;
        daily: number;
        growth: number;
    };
    orders: {
        total: number;
        pending: number;
        completed: number;
        cancelled: number;
        averageOrderValue: number;
    };
    customers: {
        total: number;
        active: number;
        new: number;
        retention: number;
    };
    schools: {
        total: number;
        active: number;
        subscriptionRate: number;
    };
    performance: {
        responseTime: number;
        uptime: number;
        errorRate: number;
        throughput: number;
    };
}
interface TimeRange {
    startDate: Date;
    endDate: Date;
}
interface MetricsFilter {
    schoolId?: string;
    region?: string;
    subscriptionTier?: string;
    timeRange?: TimeRange;
}
export declare class BusinessMetricsDashboardService {
    private static prisma;
    static getDashboardMetrics(filters?: MetricsFilter): Promise<BusinessMetrics>;
    private static getRevenueMetrics;
    private static getOrderMetrics;
    private static getCustomerMetrics;
    private static getSchoolMetrics;
    private static getPerformanceMetrics;
    static getTimeSeriesData(metric: keyof BusinessMetrics, filters?: MetricsFilter, granularity?: 'hour' | 'day' | 'week' | 'month'): Promise<Array<{
        timestamp: Date;
        value: number;
    }>>;
    private static getRevenueTimeSeries;
    private static getOrdersTimeSeries;
    private static getCustomersTimeSeries;
    private static buildBaseWhereClause;
    private static buildSchoolWhereClause;
    private static getTimeKey;
    static getRealTimeUpdate(filters?: MetricsFilter): Promise<Partial<BusinessMetrics>>;
}
export default BusinessMetricsDashboardService;
//# sourceMappingURL=business-metrics-dashboard.service.d.ts.map