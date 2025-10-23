import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
interface AnalyticsOperation {
    operationId: string;
    operationType: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    progress: number;
    results?: any;
    error?: string;
    metadata: {
        userId: string;
        schoolId?: string;
        priority: 'low' | 'medium' | 'high' | 'critical';
        resourceUsage: {
            cpuTime: number;
            memoryUsage: number;
            networkIO: number;
        };
    };
}
interface SystemHealthMetrics {
    overall: {
        status: 'healthy' | 'degraded' | 'critical' | 'unavailable';
        uptime: number;
        lastUpdate: Date;
        version: string;
    };
    components: {
        crossSchoolAnalytics: {
            status: 'healthy' | 'degraded' | 'critical';
            responseTime: number;
            accuracy: number;
            lastOperation: Date;
            errorRate: number;
        };
        realTimeBenchmarking: {
            status: 'healthy' | 'degraded' | 'critical';
            schoolsMonitored: number;
            anomaliesDetected: number;
            benchmarksUpdated: Date;
            systemLoad: number;
        };
        federatedLearning: {
            status: 'healthy' | 'degraded' | 'critical';
            activeNodes: number;
            modelsTraining: number;
            averageAccuracy: number;
            privacyCompliance: number;
        };
        predictiveInsights: {
            status: 'healthy' | 'degraded' | 'critical';
            forecastAccuracy: number;
            modelsLoaded: number;
            predictionLatency: number;
            dataFreshness: number;
        };
    };
    performance: {
        averageResponseTime: number;
        throughput: number;
        errorRate: number;
        resourceUtilization: {
            cpu: number;
            memory: number;
            network: number;
            storage: number;
        };
    };
    alerts: Array<{
        alertId: string;
        level: 'info' | 'warning' | 'error' | 'critical';
        component: string;
        message: string;
        timestamp: Date;
        resolved: boolean;
    }>;
}
declare class AnalyticsOrchestrator {
    private logger;
    private database;
    private activeOperations;
    private operationQueue;
    private cache;
    private systemMetrics;
    constructor();
    private initializeSystemMetrics;
    private startHealthMonitoring;
    private updateSystemMetrics;
    private updatePerformanceMetrics;
    private cleanExpiredCache;
    private processOperationQueue;
    private executeOperation;
    private executeCrossSchoolAnalytics;
    private executeRealTimeBenchmarking;
    private executePredictiveInsights;
    private executeFederatedLearning;
    private executeComprehensiveAudit;
    private delay;
    private getCachedResult;
    private cacheResult;
    queueOperation(operationType: string, parameters: any, userId: string, schoolId?: string, priority?: 'low' | 'medium' | 'high' | 'critical'): Promise<string>;
    getOperationStatus(operationId: string): AnalyticsOperation | null;
    getSystemHealth(): SystemHealthMetrics;
    getCacheStatistics(): {
        totalEntries: number;
        totalSize: number;
        hitRate: number;
        oldestEntry: Date;
        newestEntry: Date;
    };
}
export { AnalyticsOrchestrator };
export declare const analyticsOrchestratorHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=analytics-orchestrator.d.ts.map