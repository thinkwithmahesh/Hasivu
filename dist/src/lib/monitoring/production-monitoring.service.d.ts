export interface SystemMetrics {
    cpu: {
        usage: number;
        loadAverage: number[];
    };
    memory: {
        used: number;
        total: number;
        heapUsed: number;
        heapTotal: number;
    };
    uptime: number;
    timestamp: number;
}
export interface PerformanceMetrics {
    timestamp: number;
    operations: {
        total: number;
        cache: {
            hits: number;
            misses: number;
            sets: number;
            gets: number;
            hitRate: number;
        };
        database: {
            queries: number;
            avgResponseTime: number;
            slowQueries: number;
            errorRate: number;
        };
        api: {
            requests: number;
            avgResponseTime: number;
            errors: number;
            errorRate: number;
            p95ResponseTime: number;
            p99ResponseTime: number;
        };
    };
    throughput: {
        requestsPerSecond: number;
        operationsPerSecond: number;
    };
    memory: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    alerts: PerformanceAlert[];
}
export interface PerformanceAlert {
    id: string;
    type: 'warning' | 'critical' | 'info';
    message: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: number;
    resolved: boolean;
}
export interface PerformanceThresholds {
    responseTime: {
        warning: number;
        critical: number;
    };
    errorRate: {
        warning: number;
        critical: number;
    };
    memoryUsage: {
        warning: number;
        critical: number;
    };
    cacheHitRate: {
        warning: number;
        critical: number;
    };
}
export declare class ProductionMonitoringService {
    private metrics;
    private performanceData;
    private alerts;
    private responseTimes;
    private thresholds;
    private alertCooldowns;
    constructor(thresholds?: Partial<PerformanceThresholds>);
    getSystemMetrics(): Promise<SystemMetrics>;
    getPerformanceMetrics(): Promise<PerformanceMetrics>;
    logMetric(name: string, value: any): Promise<void>;
    getMetric(name: string): Promise<any>;
    getAllMetrics(): Promise<Record<string, any>>;
    clearMetrics(): Promise<void>;
    recordCacheHit(): Promise<void>;
    recordCacheMiss(): Promise<void>;
    recordApiRequest(responseTime: number, isError?: boolean): Promise<void>;
    recordDatabaseQuery(responseTime: number, isError?: boolean): Promise<void>;
    recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'get'): Promise<void>;
    updateMemoryMetrics(): Promise<void>;
    private checkPerformanceAlerts;
    private createAlert;
    getActiveAlerts(): Promise<PerformanceAlert[]>;
    resolveAlert(alertId: string): Promise<boolean>;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'warning' | 'critical';
        score: number;
        issues: string[];
        recommendations: string[];
    }>;
}
//# sourceMappingURL=production-monitoring.service.d.ts.map