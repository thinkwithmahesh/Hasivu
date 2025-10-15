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
    metrics: Record<string, number | string>;
    issues: string[];
    recommendations: string[];
}
interface APIResult {
    endpoint: string;
    method: string;
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    requestsPerSecond: number;
    successfulRequests: number;
    totalRequests: number;
}
interface DatabaseResult {
    status: string;
    performance: {
        avgQueryTime: number;
        slowQueries: number;
        connectionPoolUsage: number;
        indexEfficiency: number;
        queriesPerSecond: number;
    };
    connections: {
        active: number;
        idle: number;
        total: number;
        maxConnections: number;
    };
    indexAnalysis: {
        missingIndexes: Array<{
            table: string;
            columns: string[];
            impact: string;
        }>;
        redundantIndexes: unknown[];
        indexUsageStats: unknown[];
    };
}
interface LambdaResult {
    summary: {
        totalFunctions: number;
        avgColdStartDuration: number;
        avgExecutionDuration: number;
        criticalIssues: number;
        avgMemoryEfficiency: number;
        highImpactColdStarts?: number;
    };
    functions: Array<{
        functionName: string;
        performance: {
            coldStart: {
                avgDuration: number;
                impact: string;
            };
            duration: {
                average: number;
                p95: number;
            };
            memory: {
                efficiency: number;
            };
            errors: {
                rate: number;
            };
        };
    }>;
}
interface WebSocketResult {
    successfulRequests: number;
    totalRequests: number;
    averageLatency: number;
    messagesExchanged: number;
    errorRate: number;
}
interface RedisResult {
    cacheHitRatio: number;
    averageGetTime: number;
    averageSetTime: number;
    requestsPerSecond: number;
    errorRate: number;
}
interface RFIDResult {
    verificationsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    bulkVerificationTime: number;
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
        api: APIResult[];
        database: DatabaseResult;
        lambda: LambdaResult;
        websocket: WebSocketResult;
        redis: RedisResult;
        rfid: RFIDResult;
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