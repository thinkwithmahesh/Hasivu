import { StandardUnit } from '@aws-sdk/client-cloudwatch';
interface MetricData {
    metricName: string;
    value: number;
    unit?: StandardUnit;
    dimensions?: Record<string, string>;
    timestamp?: Date;
    namespace?: string;
}
interface LogData {
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    message: string;
    metadata?: Record<string, any>;
    timestamp?: number;
}
declare class CloudWatchService {
    private metricBuffer;
    private flushTimer;
    private logSequenceToken;
    constructor();
    private startBatchFlush;
    putMetric(data: MetricData): Promise<void>;
    putMetrics(metrics: MetricData[]): Promise<void>;
    flushMetrics(): Promise<void>;
    trackBusinessMetric(metricName: string, value: number, dimensions?: Record<string, string>): Promise<void>;
    trackPaymentTransaction(status: 'success' | 'failed' | 'pending', amount: number): Promise<void>;
    trackOrder(action: 'created' | 'completed' | 'cancelled', orderId: string): Promise<void>;
    trackRFIDOperation(operation: 'verification' | 'registration', status: 'success' | 'failed'): Promise<void>;
    trackApiPerformance(endpoint: string, duration: number, statusCode: number): Promise<void>;
    trackLambdaPerformance(functionName: string, duration: number, coldStart: boolean): Promise<void>;
    trackDatabaseQuery(queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE', duration: number, success: boolean): Promise<void>;
    trackSecurityEvent(eventType: 'failed_login' | 'suspicious_activity' | 'fraud_attempt' | 'unauthorized_access', userId?: string): Promise<void>;
    trackSystemHealth(healthScore: number): Promise<void>;
    trackCost(service: string, estimatedCost: number): Promise<void>;
    log(logGroupName: string, data: LogData): Promise<void>;
    logApplication(level: LogData['level'], message: string, metadata?: Record<string, any>): Promise<void>;
    logError(error: Error, context?: Record<string, any>): Promise<void>;
    logBusinessEvent(message: string, metadata?: Record<string, any>): Promise<void>;
    logSecurityEvent(message: string, metadata?: Record<string, any>): Promise<void>;
    private buildDimensions;
    private getLogStreamName;
    private ensureLogStream;
    cleanup(): Promise<void>;
}
export declare const cloudwatchService: CloudWatchService;
export {};
//# sourceMappingURL=cloudwatch.service.d.ts.map