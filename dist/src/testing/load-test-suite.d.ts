import { AxiosResponse } from 'axios';
export interface LoadTestConfig {
    baseUrl: string;
    duration: number;
    maxConcurrentUsers: number;
    rampUpTime: number;
    rampDownTime: number;
    requestDelay: number;
    environment: 'development' | 'staging' | 'production';
    targets: {
        responseTime: number;
        throughput: number;
        errorRate: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
    };
    retryConfig: {
        maxRetries: number;
        retryDelay: number;
        exponentialBackoff: boolean;
    };
    monitoring: {
        enableTracing: boolean;
        enableResourceMonitoring: boolean;
        collectGCMetrics: boolean;
        enableRequestLogging: boolean;
    };
    warmup: {
        enabled: boolean;
        duration: number;
        concurrency: number;
    };
}
export interface LoadTestEndpoint {
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    payload?: any;
    headers?: Record<string, string>;
    weight: number;
    expectedStatus: number[];
    timeout: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    authentication?: {
        type: 'bearer' | 'basic' | 'api-key';
        token?: string;
        username?: string;
        password?: string;
        apiKey?: string;
    };
    validation?: {
        responseSchema?: any;
        customValidator?: (response: AxiosResponse) => boolean;
    };
}
export interface LoadTestMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
    concurrentUsers: number;
    totalDataTransferred: number;
    averageDataPerRequest: number;
    requestsPerSecond: number[];
    responseTimesOverTime: number[];
    errorRatesOverTime: number[];
    resourceUtilization: {
        memoryUsage: number;
        cpuUsage: number;
        gcMetrics: {
            collections: number;
            totalTime: number;
            averageTime: number;
        };
    };
}
export interface EndpointMetrics extends LoadTestMetrics {
    endpoint: string;
    method: string;
    successRate: number;
    averagePayloadSize: number;
    statusCodeDistribution: Record<number, number>;
    errorTypes: Record<string, number>;
}
export interface LoadTestResult {
    testName: string;
    startTime: number;
    endTime: number;
    duration: number;
    environment: string;
    configuration: LoadTestConfig;
    overallMetrics: LoadTestMetrics;
    endpointMetrics: Map<string, EndpointMetrics>;
    metrics: LoadTestMetrics;
    performanceTargets: {
        responseTime: {
            target: number;
            actual: number;
            passed: boolean;
        };
        errorRate: {
            target: number;
            actual: number;
            passed: boolean;
        };
        throughput: {
            target: number;
            actual: number;
            passed: boolean;
        };
        p95ResponseTime: {
            target: number;
            actual: number;
            passed: boolean;
        };
        p99ResponseTime: {
            target: number;
            actual: number;
            passed: boolean;
        };
    };
    recommendations: string[];
    bottlenecks: Array<{
        type: 'response-time' | 'error-rate' | 'throughput' | 'resource-utilization';
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        affectedEndpoints: string[];
        suggestedFixes: string[];
    }>;
    resourceMetrics: {
        peakMemoryUsage: number;
        averageMemoryUsage: number;
        peakCpuUsage: number;
        averageCpuUsage: number;
        gcImpact: number;
    };
    testStatus: 'passed' | 'failed' | 'warning' | 'error';
    errorSummary?: string;
}
interface RequestMetric {
    endpoint: string;
    method: string;
    startTime: number;
    endTime: number;
    responseTime: number;
    statusCode: number;
    success: boolean;
    error?: string;
    dataTransferred: number;
    userId: number;
    retryCount: number;
}
export declare class LoadTestSuite {
    private static instance;
    private client;
    private config;
    private endpoints;
    private metrics;
    private virtualUsers;
    private testStartTime;
    private testEndTime;
    private activeRequests;
    private tracing;
    private resourceMonitor;
    private resourceMetrics;
    private constructor();
    static getInstance(config?: LoadTestConfig): LoadTestSuite;
    private initializeHttpClient;
    private setupRequestTracking;
    private initializeMonitoring;
    private startResourceMonitoring;
    private stopResourceMonitoring;
    private recordRequest;
    addEndpoint(endpoint: LoadTestEndpoint): void;
    addEndpoints(endpoints: LoadTestEndpoint[]): void;
    runLoadTest(testName: string): Promise<LoadTestResult>;
    private runWarmup;
    private executeLoadTest;
    private runVirtualUser;
    private selectEndpoint;
    private addAuthentication;
    private executeRequestWithRetry;
    private waitForCompletion;
    private generateLoadTestResult;
    private calculateOverallMetrics;
    private calculateEndpointMetrics;
    private calculatePercentile;
    private calculateRequestsPerSecond;
    private calculateResponseTimesOverTime;
    private calculateErrorRatesOverTime;
    private evaluatePerformanceTargets;
    private identifyBottlenecks;
    private generateRecommendations;
    private calculateResourceMetrics;
    exportResults(result: LoadTestResult, format?: 'json' | 'html' | 'csv'): string;
    private generateHtmlReport;
    private generateCsvReport;
    getCurrentMetrics(): RequestMetric[];
    clearTestData(): void;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        timestamp: number;
        checks: {
            targetConnectivity: boolean;
            resourceAvailability: boolean;
            configurationValid: boolean;
        };
        error?: string;
    }>;
}
export declare const defaultLoadTestConfig: LoadTestConfig;
export declare const loadTestSuite: LoadTestSuite;
export {};
//# sourceMappingURL=load-test-suite.d.ts.map