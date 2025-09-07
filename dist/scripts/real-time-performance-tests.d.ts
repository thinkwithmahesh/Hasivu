import WebSocket from 'ws';
interface TestConfig {
    baseUrl: string;
    webSocketUrl: string;
    redisUrl: string;
    concurrentUsers: number;
    testDuration: number;
    rampUpTime: number;
    environment: 'development' | 'staging' | 'production';
}
interface PerformanceMetrics {
    startTime: number;
    endTime: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    concurrentConnections: number;
}
interface APIEndpointMetrics extends PerformanceMetrics {
    endpoint: string;
    method: string;
    statusCodes: Record<number, number>;
}
declare class RealTimePerformanceTestSuite {
    private config;
    private activeConnections;
    private redis;
    private responseTimes;
    private testResults;
    constructor(config: TestConfig);
    runComprehensiveTests(): Promise<void>;
    testAPIEndpoints(): Promise<void>;
    testEndpoint(endpoint: {
        path: string;
        method: string;
        weight: number;
    }): Promise<APIEndpointMetrics>;
    makeAPIRequest(path: string, method: string): Promise<any>;
    testWebSocketPerformance(): Promise<void>;
    createWebSocketConnection(): Promise<WebSocket>;
    testWebSocketMessages(ws: WebSocket): Promise<number>;
    sendWebSocketMessage(ws: WebSocket, message: any): Promise<number>;
    testRedisPerformance(): Promise<void>;
    testRFIDVerificationPerformance(): Promise<void>;
    generatePerformanceReport(): void;
    calculateOverallGrade(): string;
    generateRecommendations(): void;
    saveTestResults(): Promise<void>;
    parseRedisMemoryUsage(info: string): number;
    parseRedisKeyspaceSize(info: string): number;
    cleanup(): Promise<void>;
}
export default RealTimePerformanceTestSuite;
//# sourceMappingURL=real-time-performance-tests.d.ts.map