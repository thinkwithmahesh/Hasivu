export interface PaymentAnalyticsDashboard {
    metrics: PaymentMetrics;
    trends: PaymentTrends;
    breakdowns: PaymentBreakdowns;
    topPerformers: TopPerformers;
    alerts: PaymentAlert[];
    recommendations: PaymentRecommendation[];
}
export interface PaymentMetrics {
    totalPayments: number;
    totalRevenue: number;
    avgOrderValue: number;
    paymentSuccessRate: number;
    refundRate: number;
    chargebackRate: number;
    newCustomers: number;
    returningCustomers: number;
}
export interface PaymentTrends {
    revenue: TrendPoint[];
    volume: TrendPoint[];
    successRate: TrendPoint[];
    avgOrderValue: TrendPoint[];
}
export interface PaymentBreakdowns {
    byMethod: PaymentMethodBreakdown[];
    bySchool: SchoolBreakdown[];
    byTimeOfDay: TimeOfDayBreakdown[];
}
export interface SchoolBreakdown {
    schoolId: string;
    schoolName: string;
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    successRate: number;
}
export interface PaymentMethodBreakdown {
    method: string;
    count: number;
    revenue: number;
    successRate: number;
    avgProcessingTime: number;
}
export interface TimeOfDayBreakdown {
    hour: number;
    orderCount: number;
    revenue: number;
    avgOrderValue: number;
}
export interface TrendPoint {
    date: string;
    value: number;
    change?: number;
}
export interface TopPerformers {
    schools: SchoolBreakdown[];
    paymentMethods: PaymentMethodBreakdown[];
    products: ProductPerformance[];
}
export interface ProductPerformance {
    productId: string;
    productName: string;
    orderCount: number;
    revenue: number;
    avgOrderValue: number;
}
export interface PaymentAlert {
    id: string;
    type: 'high_failure_rate' | 'low_revenue' | 'unusual_pattern';
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface PaymentRecommendation {
    id: string;
    type: 'optimization' | 'feature' | 'integration';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    estimatedImpact: string;
    effort: 'low' | 'medium' | 'high';
}
export declare class PaymentAnalyticsService {
    private readonly CACHE_TTL;
    getDashboardData(period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly', schoolId?: string): Promise<PaymentAnalyticsDashboard>;
    private generateDateRange;
    private getPaymentMetrics;
    private getPaymentTrends;
    private getPaymentBreakdowns;
    private getTopPerformers;
    private generateAlerts;
    private generateRecommendations;
}
export default PaymentAnalyticsService;
//# sourceMappingURL=payment-analytics.service.d.ts.map