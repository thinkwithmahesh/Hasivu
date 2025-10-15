import { ServiceResponse } from './types';
export declare class DashboardGenerationService {
    private static readonly CACHE_TTL;
    static generateDashboard(dashboardId: string, userId: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<ServiceResponse<any>>;
    private static generateOrderTrends;
}
//# sourceMappingURL=dashboard-generation.d.ts.map