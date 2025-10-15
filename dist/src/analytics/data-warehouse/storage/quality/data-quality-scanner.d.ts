export interface DataQualityMetrics {
    completeness: number;
    accuracy: number;
    consistency: number;
    validity: number;
    uniqueness: number;
    timeliness: number;
    totalRecords: number;
    qualityScore: number;
}
export interface DataQualityRule {
    type: string;
    parameters?: Record<string, any>;
}
export interface DataQualityReport {
    datasetId: string;
    generatedAt: Date;
    latestScan: QualityScanResult;
    historicalData: QualityScanResult[];
    trend: QualityTrend;
    summary: {
        currentScore: number;
        averageScore: number;
        trendDirection: string;
        criticalIssues: number;
        totalIssues: number;
    };
    recommendations: string[];
}
export interface QualityConfig {
    enableScanning: boolean;
    autoScan: boolean;
    scanInterval: number;
    qualityThreshold: number;
    sampleSize: number;
    maxIssuesPerCheck: number;
    retentionDays: number;
}
export interface QualityCheck {
    id: string;
    name: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'completeness' | 'accuracy' | 'consistency' | 'validity' | 'uniqueness' | 'timeliness';
    rule: DataQualityRule;
}
export interface QualityScanResult {
    datasetId: string;
    scanId: string;
    timestamp: Date;
    metrics: DataQualityMetrics;
    issues: QualityIssue[];
    recommendations: string[];
    overallScore: number;
    executionTime: number;
}
export interface QualityIssue {
    checkId: string;
    severity: string;
    category: string;
    description: string;
    affectedRecords: number;
    affectedColumns: string[];
    sampleValues: any[] | undefined;
    suggestedFix: string;
}
export interface QualityTrend {
    datasetId: string;
    period: string;
    scores: number[];
    averageScore: number;
    trend: 'improving' | 'declining' | 'stable';
    recommendations: string[];
}
export declare class DataQualityScanner {
    private config;
    private qualityChecks;
    private scanHistory;
    constructor(config?: Partial<QualityConfig>);
    scanDataset(datasetId: string, data: any[] | undefined): Promise<QualityScanResult>;
    addQualityCheck(check: QualityCheck): Promise<void>;
    removeQualityCheck(checkId: string): Promise<void>;
    getQualityReport(datasetId: string): Promise<DataQualityReport>;
    getQualityTrends(datasetId: string, days?: number): Promise<QualityTrend>;
    getDatasetSummary(datasetId: string): Promise<{
        latestScore: number;
        lastScanDate: Date;
        totalScans: number;
        criticalIssues: number;
        status: 'healthy' | 'warning' | 'critical';
    }>;
    private initializeDefaultChecks;
    private sampleData;
    private runQualityCheck;
    private runNullCheck;
    private runDuplicateCheck;
    private runDataTypeCheck;
    private runRangeCheck;
    private runPatternCheck;
    private runReferentialIntegrityCheck;
    private updateMetrics;
    private calculateOverallScore;
    private calculateQualityTrend;
    private generateTrendRecommendations;
    private generateReportRecommendations;
    private deduplicateRecommendations;
    private storeScanResult;
    private inferExpectedType;
    private getNumericColumns;
    private calculateQuartiles;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    private setupDefaultThresholds;
}
export default DataQualityScanner;
//# sourceMappingURL=data-quality-scanner.d.ts.map