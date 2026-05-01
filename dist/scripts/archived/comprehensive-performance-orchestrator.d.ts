#!/usr/bin/env ts-node
interface DatabaseResult {
    metrics: {
        status: string;
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
    };
    recommendations: Array<{
        priority: 'high' | 'medium' | 'low';
        issue: string;
        recommendation: string;
        impact: string;
    }>;
    timestamp: string;
}
interface LambdaResult {
    summary: {
        totalFunctions: number;
        avgColdStartDuration?: number;
        criticalIssues: number;
        avgExecutionDuration?: number;
    };
    recommendations?: Array<{
        functions?: string[];
        description: string;
        action: string;
        priority: string;
        impact: string;
    }>;
}
interface RealTimeResult {
    api?: Array<{
        endpoint: string;
        averageResponseTime: number;
        errorRate: number;
    }>;
    webSocket?: {
        averageLatency: number;
        errorRate: number;
    };
    redis?: {
        cacheHitRatio: number;
        averageGetTime: number;
    };
}
interface OptimizationResult {
    applied: number;
    skipped: number;
    errors: string[];
    optimizations: Array<{
        type: string;
        description: string;
        success: boolean;
    }>;
}
interface OrchestrationConfig {
    environment: 'development' | 'staging' | 'production';
    runDatabaseAnalysis: boolean;
    runLambdaAnalysis: boolean;
    runRealTimeTests: boolean;
    runComprehensiveReport: boolean;
    concurrentUsers: number;
    testDuration: number;
    enableOptimizations: boolean;
    saveResults: boolean;
}
interface TestResults {
    database?: DatabaseResult;
    lambda?: LambdaResult;
    realTime?: RealTimeResult;
    optimization?: OptimizationResult;
}
interface OrchestrationReport {
    startTime: string;
    endTime: string;
    duration: number;
    environment: string;
    testsExecuted: string[];
    results: TestResults;
    summary: {
        overallScore: number;
        readinessLevel: number;
        criticalIssues: number;
        optimizationsApplied: number;
        recommendationsGenerated: number;
    };
    nextSteps: string[];
}
declare class ComprehensivePerformanceOrchestrator {
    private config;
    private results;
    private executionLog;
    private startTime;
    constructor(config: OrchestrationConfig);
    executePerformanceAnalysis(): Promise<OrchestrationReport>;
    private executeDatabaseAnalysis;
    private executeLambdaAnalysis;
    private executeRealTimeTests;
    private applyOptimizations;
    private generateComprehensiveReport;
    private generateOrchestrationReport;
    private calculateSummaryMetrics;
    private calculateLambdaScore;
    private calculateRealtimeScore;
    private generateNextSteps;
    private saveOrchestrationReport;
    private displayFinalSummary;
    private getBaseUrl;
    private getWebSocketUrl;
    private getRedisUrl;
    private log;
}
export default ComprehensivePerformanceOrchestrator;
//# sourceMappingURL=comprehensive-performance-orchestrator.d.ts.map