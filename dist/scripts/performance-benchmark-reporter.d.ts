interface BenchmarkData {
    timestamp: string;
    environment: string;
    version: string;
    testDuration: number;
    concurrentUsers: number;
}
interface PerformanceScore {
    category: string;
    score: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D';
    status: 'excellent' | 'good' | 'fair' | 'poor';
    metrics: Record<string, any>;
    issues: string[];
    recommendations: string[];
}
interface BenchmarkReport {
    metadata: BenchmarkData;
    summary: {
        overallScore: number;
        overallGrade: string;
        readinessLevel: number;
        criticalIssues: number;
        warnings: number;
        recommendations: number;
    };
    scores: PerformanceScore[];
    detailed: {
        api: any;
        database: any;
        lambda: any;
        websocket: any;
        redis: any;
        rfid: any;
    };
    optimization: {
        immediate: Array<{
            priority: 'critical' | 'high' | 'medium' | 'low';
            category: string;
            issue: string;
            solution: string;
            impact: string;
            effort: string;
        }>;
        roadmap: Array<{
            phase: string;
            timeline: string;
            objectives: string[];
            deliverables: string[];
            successMetrics: string[];
        }>;
    };
    monitoring: {
        alerts: Array<{
            metric: string;
            threshold: number;
            condition: string;
            action: string;
        }>;
        dashboards: Array<{
            name: string;
            widgets: string[];
            audience: string;
        }>;
    };
}
declare class PerformanceBenchmarkReporter {
    private thresholds;
    private report;
    constructor();
    private initializeThresholds;
    generateBenchmarkReport(testResultsPath?: string): Promise<BenchmarkReport>;
    private loadTestResults;
    private generateMockTestResults;
    private initializeReport;
    private analyzeAPIPerformance;
    private analyzeDatabasePerformance;
    private analyzeLambdaPerformance;
    private analyzeWebSocketPerformance;
    private analyzeRedisPerformance;
    private analyzeRFIDPerformance;
    private calculateCategoryScore;
    private createEmptyScore;
    private calculateOverallScore;
    private calculateReadinessLevel;
    private generateOptimizationRoadmap;
    private generateMonitoringRecommendations;
    private getGradeFromScore;
    private getStatusFromScore;
    private saveReport;
    private generateMarkdownReport;
    private generateExecutiveSummary;
    private displayReportSummary;
    private fileExists;
}
export default PerformanceBenchmarkReporter;
//# sourceMappingURL=performance-benchmark-reporter.d.ts.map