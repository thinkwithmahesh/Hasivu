/// <reference types="node" />
export interface SystemHealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: number;
    responseTime: number;
    version: string;
    environment: string;
    services: ServiceHealthStatus[];
    metrics: SystemMetrics;
    alerts: HealthAlert[];
}
export interface ServiceHealthStatus {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime?: number;
    lastCheck: number;
    details: {
        [key: string]: any;
    };
    error?: string;
}
export interface SystemMetrics {
    cpu: {
        usage: number;
        loadAverage: number[];
    };
    memory: {
        used: string;
        total: string;
        percentage: number;
        heap: {
            used: string;
            total: string;
            percentage: number;
        };
    };
    process: {
        uptime: number;
        pid: number;
        version: string;
        memoryUsage: NodeJS.MemoryUsage;
    };
    system: {
        platform: string;
        arch: string;
        hostname: string;
        uptime: number;
        freeMemory: string;
        totalMemory: string;
    };
}
export interface HealthAlert {
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    service?: string;
    timestamp: number;
    threshold?: number;
    current?: number;
}
export interface HealthCheckConfig {
    enableDetailedChecks: boolean;
    checkTimeout: number;
    warningThresholds: {
        cpuUsage: number;
        memoryUsage: number;
        responseTime: number;
    };
    criticalThresholds: {
        cpuUsage: number;
        memoryUsage: number;
        responseTime: number;
    };
    services: {
        database: boolean;
        redis: boolean;
        email: boolean;
        payment: boolean;
    };
}
export interface HealthCheckResult extends SystemHealthStatus {
    summary: {
        healthy: number;
        degraded: number;
        unhealthy: number;
        total: number;
    };
    duration: number;
}
export declare class HealthCheckServiceError extends Error {
    readonly code: string;
    readonly service?: string;
    readonly details: any;
    constructor(message: string, code?: string, service?: string, details?: any);
}
export declare class HealthCheckService {
    private static instance;
    private readonly config;
    private healthHistory;
    private readonly maxHistoryEntries;
    private constructor();
    static getInstance(): HealthCheckService;
    performHealthCheck(): Promise<HealthCheckResult>;
    private collectSystemMetrics;
    private generateMetricAlerts;
    private performServiceChecks;
    private checkDatabaseHealth;
    private checkRedisHealth;
    private checkEmailServiceHealth;
    private checkPaymentServiceHealth;
    private calculateOverallStatus;
    getHealthHistory(): SystemHealthStatus[];
    getLatestHealthStatus(): SystemHealthStatus | null;
    private addToHistory;
    private getEmptyMetrics;
    private withTimeout;
    getServiceConfig(): HealthCheckConfig;
    updateConfig(updates: Partial<HealthCheckConfig>): void;
}
export declare const healthCheckService: HealthCheckService;
//# sourceMappingURL=health-check.service.d.ts.map