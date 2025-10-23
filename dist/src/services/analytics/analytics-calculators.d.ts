import { KPI, RevenueAnalytics, UserBehaviorAnalytics } from './types';
export declare class AnalyticsCalculatorsService {
    static calculateKPIs(dateRange: {
        start: Date;
        end: Date;
    }): Promise<KPI[]>;
    private static createOrderCompletionKPI;
    private static createRevenueKPI;
    private static createUserRetentionKPI;
    static generateRevenueAnalytics(_dateRange: {
        start: Date;
        end: Date;
    }): Promise<RevenueAnalytics>;
    static generateUserBehaviorAnalytics(_dateRange: {
        start: Date;
        end: Date;
    }): Promise<UserBehaviorAnalytics>;
    private static getOrderStatistics;
    private static getRevenueStatistics;
    private static getUserRetentionStatistics;
}
//# sourceMappingURL=analytics-calculators.d.ts.map