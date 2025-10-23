export interface QueryMetrics {
    query: string;
    executionTime: number;
    timestamp: Date;
    success: boolean;
    error?: string;
}
export interface PerformanceReport {
    slowQueries: QueryMetrics[];
    averageQueryTime: number;
    totalQueries: number;
    failedQueries: number;
    recommendations: string[];
}
export interface PerformanceMetrics {
    status: 'healthy' | 'warning' | 'critical';
    performance: {
        avgQueryTime: number;
        connectionPoolUsage: number;
        indexEfficiency: number;
        queriesPerSecond: number;
    };
    slowQueries: Array<{
        query: string;
        duration: number;
        timestamp: Date;
    }>;
    issues: string[];
}
export interface OptimizationRecommendation {
    priority: 'high' | 'medium' | 'low';
    issue: string;
    recommendation: string;
    impact: string;
}
export interface OptimizationResult {
    applied: number;
    skipped: number;
    errors: string[];
    optimizations: Array<{
        type: string;
        description: string;
        success: boolean;
    }>;
}
export declare class DatabasePerformanceService {
    private static instance;
    private prisma;
    private queryMetrics;
    private readonly SLOW_QUERY_THRESHOLD;
    private constructor();
    static getInstance(): DatabasePerformanceService;
    trackQuery(query: string, executeFn: () => Promise<any>): Promise<any>;
    getSlowQueries(threshold?: number): QueryMetrics[];
    getAverageQueryTime(): number;
    getFailedQueries(): QueryMetrics[];
    generateReport(): PerformanceReport;
    analyzeTablePerformance(tableName: string): Promise<{
        rowCount: number;
        estimatedSize: string;
        recommendations: string[];
    }>;
    suggestIndexes(): Promise<string[]>;
    clearMetrics(): void;
    healthCheck(): Promise<{
        healthy: boolean;
        latency?: number;
    }>;
    getPerformanceMetrics(): Promise<PerformanceMetrics>;
    getOptimizationRecommendations(): Promise<OptimizationRecommendation[]>;
    applyAutomaticOptimizations(): Promise<OptimizationResult>;
}
export declare const databasePerformanceService: DatabasePerformanceService;
export default DatabasePerformanceService;
//# sourceMappingURL=database-performance.service.d.ts.map