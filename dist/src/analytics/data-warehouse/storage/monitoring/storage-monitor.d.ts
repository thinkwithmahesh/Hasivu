import { MonitoringConfig } from '../../types/storage-types';
export declare class StorageMonitor {
    private config;
    private metrics;
    private alerts;
    private thresholds;
    private isRunning;
    constructor(config: MonitoringConfig);
    initialize(): Promise<void>;
    recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
    getMetrics(name?: string, timeRange?: TimeRange): Promise<MetricSeries[]>;
    getHealthMetrics(): Promise<HealthMetrics>;
    createAlert(alert: AlertDefinition): Promise<string>;
    getActiveAlerts(): Promise<Alert[]>;
    acknowledgeAlert(alertId: string): Promise<void>;
    getStorageStatistics(): Promise<StorageStatistics>;
    getHealth(): Promise<any>;
    private setupDefaultThresholds;
    private startMetricsCollection;
    private startAlertingEngine;
    private collectSystemMetrics;
    private collectStorageMetrics;
    private checkThresholds;
    private triggerAlert;
    private evaluateAlerts;
    private shouldResolveAlert;
    private getLatestMetric;
    private filterByTimeRange;
    private calculateOverallHealth;
    private cleanupOldMetrics;
    shutdown(): Promise<void>;
    getStatistics(): Promise<any>;
    getHealthStatus(): Promise<any>;
    updateStatistics(): Promise<number>;
}
interface MetricSeries {
    name: string;
    values: DataPoint[];
    lastValue: number;
    avgValue: number;
    minValue: number;
    maxValue: number;
    sampleCount: number;
}
interface DataPoint {
    timestamp: Date;
    value: number;
    tags: Record<string, string>;
}
interface TimeRange {
    start: Date;
    end: Date;
}
interface AlertDefinition {
    name: string;
    condition: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    threshold: number;
    description?: string;
}
interface Alert {
    id: string;
    name: string;
    condition: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    threshold: AlertThreshold;
    status: 'active' | 'triggered' | 'acknowledged' | 'resolved';
    createdAt: Date;
    lastTriggered: Date | null | undefined;
    triggerCount: number;
    description?: string;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
}
interface AlertThreshold {
    metric: string;
    warning: number;
    critical: number;
    operator: 'greater_than' | 'less_than' | 'equals';
}
interface HealthMetrics {
    overall: 'healthy' | 'warning' | 'critical';
    cpu: {
        usage: number;
        status: 'healthy' | 'warning' | 'critical';
    };
    memory: {
        usage: number;
        status: 'healthy' | 'warning' | 'critical';
    };
    disk: {
        usage: number;
        status: 'healthy' | 'warning' | 'critical';
    };
    performance: {
        queryLatency: number;
        throughput: number;
        errorRate: number;
        status: 'healthy' | 'warning' | 'critical';
    };
    timestamp: Date;
}
interface StorageStatistics {
    totalSize: number;
    usedSize: number;
    availableSize: number;
    compressionRatio: number;
    tiering: {
        hot: TierStatistics;
        warm: TierStatistics;
        cold: TierStatistics;
        archived: TierStatistics;
    };
    indexes: {
        totalIndexes: number;
        totalSize: number;
        averageHitRate: number;
        maintenanceOverhead: number;
    };
    queries: {
        total: number;
        averageExecutionTime: number;
        cacheHitRate: number;
        slowQueries: number;
    };
    materializedViews: {
        total: number;
        lastRefresh: Date;
        hitRate: number;
        averageRefreshTime: number;
    };
}
interface TierStatistics {
    size: number;
    objectCount: number;
    accessFrequency: number;
    lastAccessed: Date;
}
export default StorageMonitor;
//# sourceMappingURL=storage-monitor.d.ts.map