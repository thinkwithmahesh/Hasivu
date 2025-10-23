export * from './analytics/types';
import { AnalyticsQuery, ServiceResponse, TimePeriod } from './analytics/types';
export declare class AnalyticsService {
    private static instance;
    static getInstance(): AnalyticsService;
    static initialize(): Promise<void>;
    static trackMetric(name: string, value: number, dimensions?: Record<string, string>, metadata?: Record<string, any>): Promise<ServiceResponse<any>>;
    static executeQuery(query: AnalyticsQuery): Promise<ServiceResponse<any[]>>;
    static generateDashboard(dashboardId: string, userId: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<ServiceResponse<any>>;
    static generateReport(period: TimePeriod, reportType: 'summary' | 'detailed' | 'executive'): Promise<ServiceResponse<any>>;
    static generateCohortAnalysis(startDate: Date, endDate: Date): Promise<ServiceResponse<any[]>>;
    static generatePredictiveAnalytics(): Promise<ServiceResponse<any>>;
    static getRealtimeMetrics(): Promise<Record<string, any>>;
}
export declare const _analyticsService: AnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map