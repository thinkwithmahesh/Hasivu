import { CohortAnalysis, ServiceResponse } from './types';
export declare class CohortAnalysisService {
    static generateCohortAnalysis(startDate: Date, endDate: Date): Promise<ServiceResponse<CohortAnalysis[]>>;
    private static calculateCohortAnalysis;
}
//# sourceMappingURL=cohort-analysis.d.ts.map