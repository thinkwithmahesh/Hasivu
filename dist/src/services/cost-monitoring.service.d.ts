export interface CostBreakdown {
    service: string;
    amount: number;
    currency: string;
    percentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    details: {
        region?: string;
        usage?: number;
        unit?: string;
    };
}
export interface CostTrends {
    dailyGrowth: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
    yearOverYear: number;
    forecast: {
        nextWeek: number;
        nextMonth: number;
        nextQuarter: number;
    };
    seasonality: {
        pattern: 'seasonal' | 'stable' | 'volatile';
        confidence: number;
    };
}
export interface BudgetStatus {
    name: string;
    budgetLimit: number;
    actualSpend: number;
    forecastedSpend: number;
    utilizationPercentage: number;
    status: 'ok' | 'warning' | 'critical' | 'exceeded';
    daysRemaining: number;
    alertThresholds: number[];
}
export interface CostEfficiencyMetrics {
    rightsizingOpportunities: {
        instanceType: string;
        currentCost: number;
        recommendedCost: number;
        savings: number;
        confidence: number;
    }[];
    unusedResources: {
        resourceType: string;
        resourceId: string;
        cost: number;
        lastUsed: Date;
    }[];
    reservedInstanceUtilization: {
        utilization: number;
        coverage: number;
        savings: number;
    };
    spotInstanceOpportunities: {
        instanceType: string;
        potentialSavings: number;
        availability: number;
    }[];
}
export interface CostOptimizationRecommendation {
    type: 'rightsizing' | 'reserved_instances' | 'spot_instances' | 'storage_optimization' | 'unused_resources';
    priority: 'high' | 'medium' | 'low';
    description: string;
    potentialSavings: number;
    implementation: string[];
    impact: 'high' | 'medium' | 'low';
    effort: 'easy' | 'moderate' | 'complex';
    resourcesAffected: string[];
    estimatedTimeToImplement: string;
}
export interface CostReport {
    period: string;
    totalCost: number;
    currency: string;
    breakdown: CostBreakdown[];
    trends: CostTrends;
    budgets: BudgetStatus[];
    efficiency: CostEfficiencyMetrics;
    recommendations: CostOptimizationRecommendation[];
    alerts: CostAlert[];
    timestamp: Date;
    reportId: string;
}
export interface CostAlert {
    type: 'budget_threshold' | 'anomaly_detection' | 'cost_spike' | 'unused_resource';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    affectedResources: string[];
    recommendedActions: string[];
    triggerValue: number;
    timestamp: Date;
}
export interface CostAnomaly {
    service: string;
    anomalyScore: number;
    impact: number;
    rootCauses: string[];
    detected: Date;
    dimension: string;
    dimensionValue: string;
}
export declare class CostMonitoringService {
    private costExplorer;
    private cloudwatch;
    private budgets;
    private dbClient;
    private monitoringInterval;
    constructor();
    generateCostReport(period?: string): Promise<CostReport>;
    private getCostBreakdown;
    private calculateServiceTrend;
    private getCostTrends;
    private getBudgetStatuses;
    private getCostEfficiencyMetrics;
    private generateOptimizationRecommendations;
    private detectCostAnomalies;
    private generateCostAlerts;
    private storeCostReport;
    startContinuousMonitoring(intervalMs?: number): void;
    stopContinuousMonitoring(): void;
    private getDateRange;
    private subtractDays;
    private calculateGrowthRate;
    private generateCostForecast;
    private analyzeSeasonality;
    private calculateVariance;
    private getDefaultTrends;
    private getBudgetActualSpend;
    private calculateDaysRemaining;
    cleanup(): Promise<void>;
}
export default CostMonitoringService;
//# sourceMappingURL=cost-monitoring.service.d.ts.map