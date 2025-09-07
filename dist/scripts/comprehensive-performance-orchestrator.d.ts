#!/usr/bin/env ts-node
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
    database?: any;
    lambda?: any;
    realTime?: any;
    optimization?: any;
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