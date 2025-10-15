export declare enum HealthSeverity {
    HEALTHY = "healthy",
    WARNING = "warning",
    CRITICAL = "critical",
    FAILED = "failed"
}
export interface HealthCheckResult {
    service: string;
    status: HealthSeverity;
    responseTime: number;
    timestamp: Date;
    message: string;
    details?: Record<string, any>;
    metadata?: {
        version?: string;
        uptime?: number;
        connections?: number;
        memory?: {
            used: number;
            total: number;
            percentage: number;
        };
    };
}
export interface SystemHealthSummary {
    overallStatus: HealthSeverity;
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    failedServices: number;
    checks: HealthCheckResult[];
    lastUpdated: Date;
    uptime: number;
    systemMetrics: {
        cpu: number;
        memory: number;
        disk: number;
        network: boolean;
    };
    metadata?: {
        monitoringDuration?: number;
        totalChecks?: number;
        successfulChecks?: number;
        [key: string]: any;
    };
}
export interface HealthMonitorConfig {
    checkInterval: number;
    timeout: number;
    retries: number;
    enabledChecks: string[];
    thresholds: {
        cpu: number;
        memory: number;
        responseTime: number;
        errorRate: number;
    };
    alerting: {
        enabled: boolean;
        webhookUrl?: string;
        emailRecipients?: string[];
        slackChannel?: string;
    };
}
export declare class HealthMonitorService {
    private config;
    private isRunning;
    private monitoringInterval?;
    private healthHistory;
    private lastHealthSummary?;
    private startTime;
    private redis;
    private gracefulDegradation;
    private customHealthChecks?;
    constructor(config: HealthMonitorConfig);
    private validateConfig;
    start(): void;
    stop(): void;
    private performHealthChecks;
    private checkDatabase;
    private checkRedis;
    private checkMemory;
    private checkCircuitBreakers;
    private checkDegradationServices;
    private checkDisk;
    private checkCPU;
    private generateHealthSummary;
    private updateHealthHistory;
    private storeHealthSummary;
    private checkAlertConditions;
    private sendHealthAlert;
    private cleanupHealthHistory;
    getHealthSummary(): SystemHealthSummary | null;
    getServiceHealthHistory(serviceName: string): HealthCheckResult[];
    forceHealthCheck(): Promise<SystemHealthSummary>;
    private getDatabaseConnections;
    private getDatabaseVersion;
    private getRedisConnections;
    private getRedisMemoryUsage;
    static createDefaultConfig(): HealthMonitorConfig;
    static createProductionConfig(): HealthMonitorConfig;
    registerHealthCheck(name: string, checkFn: () => Promise<HealthCheckResult>): void;
    getSystemHealth(): SystemHealthSummary;
}
export default HealthMonitorService;
//# sourceMappingURL=health-monitor.service.d.ts.map