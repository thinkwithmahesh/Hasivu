export interface HealthCheckResult {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    details: Record<string, any>;
    error?: string;
    timestamp: Date;
    score: number;
}
export interface SystemHealthReport {
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    overallScore: number;
    services: HealthCheckResult[];
    summary: {
        total: number;
        healthy: number;
        degraded: number;
        unhealthy: number;
        averageResponseTime: number;
    };
    recommendations: string[];
    timestamp: Date;
    executionTime: number;
}
export interface ServiceConfig {
    name: string;
    type: 'database' | 'cache' | 'external' | 'storage' | 'notification';
    enabled: boolean;
    timeout: number;
    retryAttempts: number;
    criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
    healthThresholds: {
        responseTime: number;
        errorRate: number;
    };
}
export interface HealthMetrics {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    activeConnections: number;
    queueDepth: number;
    errorRate: number;
    throughput: number;
}
export declare class ComprehensiveHealthMonitorService {
    private pgClient;
    private redis;
    private cloudwatch;
    private circuitBreakers;
    private services;
    private lastHealthCheck;
    private healthCheckInterval;
    constructor();
    private initializeServiceConfigs;
    private setupCircuitBreakers;
    performComprehensiveHealthCheck(): Promise<SystemHealthReport>;
    private checkPostgreSQL;
    private checkRedis;
    private checkAWS_S3;
    private checkWhatsAppAPI;
    private checkSMSGateway;
    private checkEmailService;
    private createErrorResult;
    private calculateHealthScore;
    private determineStatus;
    private generateHealthReport;
    private calculateOverallScore;
    private generateRecommendations;
    startContinuousMonitoring(intervalMs?: number): void;
    stopContinuousMonitoring(): void;
    getLastHealthCheck(): SystemHealthReport | null;
    getCircuitBreakerStatus(serviceName: string): import("./circuit-breaker.service").CircuitBreakerStats;
    forceCircuitBreakerState(serviceName: string, state: 'open' | 'closed' | 'half_open'): void;
    getSystemMetrics(): Promise<HealthMetrics | null>;
    private parseRedisInfo;
    cleanup(): Promise<void>;
}
export default ComprehensiveHealthMonitorService;
//# sourceMappingURL=comprehensive-health-monitor.service.d.ts.map