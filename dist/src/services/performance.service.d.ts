export interface PerformanceMetrics {
    timestamp: number;
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    requestCount: number;
    errorRate: number;
    responseTime: number;
    throughput: number;
    diskUsage: number;
    networkLatency: number;
    queueSize: number;
    cacheHitRate: number;
    cpu?: number;
    memory?: number;
    database?: number;
    redis?: number;
}
export interface AlertConfig {
    metricName: keyof PerformanceMetrics;
    threshold: number;
    operator: 'greater_than' | 'less_than' | 'equals';
    severity: 'low' | 'medium' | 'high' | 'critical' | 'warning' | 'info';
    enabled: boolean;
    cooldownMs: number;
    description: string;
    webhookUrl?: string;
    emailRecipients?: string[];
    lastTriggered?: number;
}
export interface PerformanceTrend {
    metricName: keyof PerformanceMetrics;
    timeframe: '1h' | '24h' | '7d' | '30d';
    dataPoints: Array<{
        timestamp: number;
        value: number;
    }>;
    average: number;
    min: number;
    max: number;
    trend: 'improving' | 'degrading' | 'stable';
    percentileData: {
        p50: number;
        p90: number;
        p95: number;
        p99: number;
    };
}
export interface BottleneckAnalysis {
    timestamp: number;
    bottlenecks: Array<{
        component: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        impact: number;
        description: string;
        recommendations: string[];
        estimatedFixTime: string;
    }>;
    overallScore: number;
    recommendedActions: string[];
    cpu?: {
        usage?: number;
        load?: number;
        cores?: number;
        processes?: number;
    };
    memory?: {
        usage?: number;
        load?: number;
        available?: number;
        allocated?: number;
    };
    database?: {
        connections?: number;
        load?: number;
        queryTime?: number;
    };
}
export interface OptimizationRecommendation {
    id: string;
    category: 'database' | 'cache' | 'cpu' | 'memory' | 'network' | 'code';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    expectedImpact: string;
    implementationEffort: 'low' | 'medium' | 'high';
    estimatedImpact?: string;
    steps?: string[];
    estimatedTimeToComplete: string;
    resources: string[];
    metrics: {
        before: Partial<PerformanceMetrics>;
        expectedAfter: Partial<PerformanceMetrics>;
    };
}
export declare class PerformanceService {
    private redis;
    private alerts;
    private monitoringInterval?;
    private isMonitoring;
    private collectionIntervalMs;
    private metricsRetentionHours;
    private alertCooldowns;
    private baselineMetrics;
    constructor();
    private initializeDefaultAlerts;
    startMonitoring(): void;
    stopMonitoring(): void;
    private collectMetrics;
    private gatherSystemMetrics;
    private getCPUUsage;
    private getMemoryUsage;
    private getDatabaseMetrics;
    private getRedisMetrics;
    private getNetworkLatency;
    private getApplicationMetrics;
    private getDiskUsage;
    private storeMetrics;
    private checkAlerts;
    private evaluateAlert;
    private triggerAlert;
    private clearAlert;
    private sendAlertNotification;
    private updateBaselines;
    private cleanupOldMetrics;
    getPerformanceTrends(metricName: keyof PerformanceMetrics, timeframe: '1h' | '24h' | '7d' | '30d'): Promise<PerformanceTrend>;
    performBottleneckAnalysis(): Promise<BottleneckAnalysis>;
    getOptimizationRecommendations(): Promise<OptimizationRecommendation[]>;
    private getDefaultMetrics;
    private getDefaultTrend;
    private calculateTrend;
    private getPercentile;
    private generateRecommendedActions;
    private getConnectionCount;
    private measureQueryTime;
    private extractRedisMetric;
    private calculateCacheHitRate;
    private getRequestCount;
    private getErrorRate;
    private getAverageResponseTime;
    private getThroughput;
    private getQueueSize;
    configureAlert(config: AlertConfig): void;
    getCurrentMetrics(): Promise<PerformanceMetrics>;
    getDashboardData(params: any): Promise<any>;
    getHistoricalData(params: {
        startDate: Date;
        endDate: Date;
        metrics?: string[];
    }): Promise<any>;
    getAlerts(params: any): Promise<any>;
    identifyBottlenecks(params: {
        threshold?: number;
        timeWindow?: string;
    }): Promise<any>;
    recordMetric(params: {
        name: string;
        value: number;
        tags?: Record<string, string>;
    }): Promise<void>;
    getOptimizationSuggestions(params?: any): Promise<any>;
    getSystemHealth(schoolId?: string): Promise<any>;
    private calculateHealthScore;
    getMonitoringStatus(): {
        isRunning: boolean;
        interval: number;
        uptime: number;
    };
    exportPerformanceData(timeframe: '1h' | '24h' | '7d' | '30d'): Promise<any>;
    static recordRequest(endpoint: string, responseTime: number, statusCode: number): void;
    static getPerformanceTrends(metricName: string, timeRange: {
        start: number;
        end: number;
    }): any;
    static getHealthStatus(): any;
    static startMonitoring(): void;
    static stopMonitoring(): void;
}
export declare const performanceService: PerformanceService;
export default PerformanceService;
//# sourceMappingURL=performance.service.d.ts.map