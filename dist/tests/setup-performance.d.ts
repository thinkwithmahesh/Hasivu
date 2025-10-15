declare const PERFORMANCE_CONFIG: {
    targetUrl: string;
    apiKey: string;
    testTimeout: number;
    thresholds: {
        responseTime: {
            api: number;
            database: number;
            cache: number;
            fileUpload: number;
            auth: number;
        };
        throughput: {
            minRps: number;
            targetRps: number;
            peakRps: number;
        };
        resources: {
            maxMemoryMB: number;
            maxCpuPercent: number;
            maxConnections: number;
        };
        availability: {
            uptime: number;
            errorRate: number;
        };
    };
    loadTest: {
        rampUpUsers: number[];
        testDuration: number;
        cooldownTime: number;
    };
    reports: {
        outputDir: string;
        summaryReport: string;
        detailedReport: string;
        loadTestReport: string;
        stressTestReport: string;
    };
};
interface PerformanceMetrics {
    responseTime: number;
    throughput: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
    timestamp: number;
    endpoint: string;
    testType: string;
    userLoad: number;
}
interface LoadTestResult {
    userCount: number;
    duration: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    memoryPeak: number;
    cpuPeak: number;
}
interface PerformanceTestState {
    metrics: PerformanceMetrics[];
    loadTestResults: LoadTestResult[];
    currentTestStartTime: number;
    baselineMetrics: Map<string, PerformanceMetrics>;
    performanceAlerts: string[];
}
declare global {
    var performanceTestState: PerformanceTestState;
}
export declare const performanceHelpers: {
    measureResponseTime(endpoint: string, method?: string, body?: any): Promise<{
        responseTime: number;
        success: boolean;
        status: number;
        metric: PerformanceMetrics;
    }>;
    performLoadTest(endpoint: string, userCounts?: number[]): Promise<LoadTestResult[]>;
    performStressTest(endpoint: string, maxUsers?: number, stepSize?: number): Promise<{
        breakingPoint: number;
        maxStableUsers: number;
        results: LoadTestResult[];
    }>;
    testMemoryLeaks(endpoint: string, iterations?: number): Promise<{
        initialMemory: number;
        finalMemory: number;
        memoryIncrease: number;
        memoryIncreasePercent: number;
        hasMemoryLeak: boolean;
        memoryReadings: number[];
    }>;
    testDatabasePerformance(queries: {
        name: string;
        query: string;
    }[]): Promise<{
        name: string;
        executionTime: number;
        success: boolean;
        recordCount: any;
        error: any;
    }[]>;
    testCachePerformance(operations: {
        key: string;
        value: any;
    }[]): Promise<({
        key: string;
        setTime: number;
        getTime: number;
        setSuccess: boolean;
        getSuccess: boolean;
        cacheHit: boolean;
        error?: undefined;
    } | {
        key: string;
        setTime: number;
        getTime: number;
        setSuccess: boolean;
        getSuccess: boolean;
        cacheHit: boolean;
        error: string;
    })[]>;
};
export { PERFORMANCE_CONFIG };
//# sourceMappingURL=setup-performance.d.ts.map