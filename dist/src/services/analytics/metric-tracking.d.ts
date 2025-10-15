export interface MetricData {
    name: string;
    value: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export declare class MetricTrackingService {
    static initialize(): Promise<void>;
    static trackMetric(name: string, value: number, dimensions?: Record<string, string>, metadata?: Record<string, any>): Promise<{
        success: boolean;
        error?: any;
    }>;
    static getRealtimeMetrics(): Promise<Record<string, any>>;
    trackMetricInstance(metric: MetricData): Promise<void>;
    getMetrics(filter: {
        name?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<MetricData[]>;
    trackMetricsBatch(metrics: MetricData[]): Promise<void>;
    cleanupOldMetrics(retentionDays?: number): Promise<number>;
}
export declare const metricTrackingService: MetricTrackingService;
//# sourceMappingURL=metric-tracking.d.ts.map