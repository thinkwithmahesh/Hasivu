export type TrendDirection = 'improving' | 'stable' | 'declining' | 'volatile';
export type AnalysisConfidence = number;
export interface TrendAnalysis {
    direction: TrendDirection;
    rate: number;
    period: string;
    sustainability: 'sustainable' | 'at_risk' | 'unsustainable';
}
export interface PerformanceMetric {
    metricId: string;
    name: string;
    category: 'financial' | 'operational' | 'customer' | 'growth' | 'efficiency' | 'quality';
    value: number;
    unit: string;
    description: string;
    trendDirection: TrendDirection;
    analysisConfidence: AnalysisConfidence;
}
//# sourceMappingURL=analytics.types.d.ts.map