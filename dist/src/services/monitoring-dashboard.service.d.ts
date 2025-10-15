export interface ServiceHealth {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency?: number;
    lastCheck: Date;
    message?: string;
}
export interface SystemMetrics {
    cpu: {
        usage: number;
        cores: number;
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    uptime: number;
    timestamp: Date;
}
export interface DashboardData {
    health: ServiceHealth[];
    metrics: SystemMetrics;
    performance: {
        avgResponseTime: number;
        requestCount: number;
        errorRate: number;
    };
}
export declare class MonitoringDashboardService {
    private static instance;
    private healthCheckInterval;
    private constructor();
    static getInstance(): MonitoringDashboardService;
    checkAllServices(): Promise<ServiceHealth[]>;
    getSystemMetrics(): SystemMetrics;
    getDashboardData(): Promise<DashboardData>;
    startHealthChecks(intervalMs?: number): void;
    stopHealthChecks(): void;
    getServiceStatus(serviceName: string): Promise<ServiceHealth | null>;
    getAlerts(): Promise<Array<{
        severity: 'warning' | 'critical';
        message: string;
    }>>;
}
export declare const monitoringDashboardService: MonitoringDashboardService;
export default MonitoringDashboardService;
//# sourceMappingURL=monitoring-dashboard.service.d.ts.map