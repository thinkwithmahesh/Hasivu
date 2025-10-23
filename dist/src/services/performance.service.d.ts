export interface PerformanceMetric {
    name: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count' | 'percent';
    timestamp: Date;
    tags?: Record<string, string>;
}
export interface PerformanceReport {
    period: {
        start: Date;
        end: Date;
    };
    metrics: PerformanceMetric[];
    summary: {
        avgResponseTime: number;
        maxResponseTime: number;
        minResponseTime: number;
        totalRequests: number;
        errorRate: number;
    };
}
export declare class PerformanceService {
    private static instance;
    private static metrics;
    private static startTimes;
    private static isMonitoringActive;
    private static benchmarks;
    private constructor();
    static getInstance(): PerformanceService;
    startTracking(operationId: string): void;
    endTracking(operationId: string, tags?: Record<string, string>): number;
    recordMetric(metric: PerformanceMetric): void;
    getMetrics(operationName: string, limit?: number): PerformanceMetric[];
    getAverage(operationName: string): number;
    getPercentile(operationName: string, percentile: number): number;
    generateReport(startDate: Date, endDate: Date): PerformanceReport;
    clearMetrics(): void;
    getMemoryUsage(): {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    recordCustomMetric(name: string, value: number, unit?: 'ms' | 'bytes' | 'count' | 'percent', tags?: Record<string, string>): void;
    static startMonitoring(): void;
    static stopMonitoring(): void;
    static isMonitoring(): boolean;
    static recordRequest(endpoint: string, responseTime: number, statusCode: number): Promise<void>;
    static collectMetrics(): Promise<PerformanceMetric[]>;
    static getPerformanceTrends(metricName: string, timeRange: {
        start: Date;
        end: Date;
    }): Promise<any>;
    static getHealthStatus(): Promise<any>;
    static getAggregatedMetrics(timeRange: string): Promise<any>;
    static setBenchmark(benchmark: any): Promise<void>;
    static getBenchmarks(): Promise<any[]>;
    static checkBenchmarkCompliance(benchmark: any): boolean;
}
export declare const performanceService: PerformanceService;
export default PerformanceService;
//# sourceMappingURL=performance.service.d.ts.map