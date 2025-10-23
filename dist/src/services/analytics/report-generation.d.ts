import { AnalyticsReport, ServiceResponse, TimePeriod } from './types';
export declare class ReportGenerationService {
    private static readonly CACHE_TTL;
    static generateReport(period: TimePeriod, reportType: 'summary' | 'detailed' | 'executive'): Promise<ServiceResponse<AnalyticsReport>>;
    private static generateSummaryReport;
    private static generateDetailedReport;
    private static generateExecutiveReport;
}
//# sourceMappingURL=report-generation.d.ts.map