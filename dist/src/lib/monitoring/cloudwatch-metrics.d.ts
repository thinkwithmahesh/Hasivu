import { CloudWatch } from 'aws-sdk';
declare global {
    var lambdaWarmupFlag: boolean | undefined;
}
export declare function recordMetric(metricName: string, value: number, unit?: 'Milliseconds' | 'Count' | 'Bytes' | 'Percent', dimensions?: Record<string, string>): Promise<void>;
export declare function recordMetrics(metrics: Array<{
    name: string;
    value: number;
    unit?: 'Milliseconds' | 'Count' | 'Bytes' | 'Percent';
    dimensions?: Record<string, string>;
}>): Promise<void>;
export declare function measurePerformance<T>(operation: string, fn: () => Promise<T>, additionalDimensions?: Record<string, string>): Promise<T>;
export declare function measureDatabaseQuery<T>(queryType: string, fn: () => Promise<T>): Promise<T>;
export declare function measureExternalAPI<T>(apiName: string, fn: () => Promise<T>): Promise<T>;
export declare function trackBusinessEvent(eventName: string, value?: number, attributes?: Record<string, string>): Promise<void>;
export declare function createPerformanceTimer(operationName: string): {
    checkpoint: (name: string) => void;
    complete: (additionalDimensions?: Record<string, string>) => Promise<{
        total: number;
        checkpoints: Record<string, number>;
    }>;
};
export declare function getMetricStatistics(metricName: string, period?: number, statistics?: string[], startTime?: Date, endTime?: Date): Promise<CloudWatch.Datapoints | undefined>;
//# sourceMappingURL=cloudwatch-metrics.d.ts.map