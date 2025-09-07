/// <reference types="node" />
export interface MonitoringDashboard {
    health: ServiceHealth;
    system: SystemMetrics;
    performance: PerformanceMetrics;
    business: BusinessMetrics;
    alerts: Alert[];
    recommendations: Recommendation[];
}
export interface ServiceHealth {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: {
        database: 'healthy' | 'degraded' | 'unhealthy';
        redis: 'healthy' | 'degraded' | 'unhealthy';
        external: 'healthy' | 'degraded' | 'unhealthy';
    };
    uptime: number;
    lastHealthCheck: Date;
}
export interface SystemMetrics {
    cpu: {
        usage: number;
        load: number[];
        cores: number;
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    process: {
        pid: number;
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
    };
}
export interface PerformanceMetrics {
    database: {
        connectionPool: {
            active: number;
            idle: number;
            total: number;
        };
        queryPerformance: {
            averageTime: number;
            slowQueries: number;
            totalQueries: number;
        };
    };
    redis: {
        connectionStatus: 'connected' | 'disconnected';
        memoryUsage: {
            used: number;
            peak: number;
            percentage: number;
        };
        operations: {
            hits: number;
            misses: number;
            hitRate: number;
        };
    };
    externalServices: {
        paymentGateway: 'online' | 'offline' | 'degraded';
        notificationService: 'online' | 'offline' | 'degraded';
        rfidSystem: 'online' | 'offline' | 'degraded';
    };
}
export interface BusinessMetrics {
    users: {
        active: number;
        total: number;
        newToday: number;
    };
    schools: {
        active: number;
        total: number;
        newThisMonth: number;
    };
    payments: {
        todayRevenue: number;
        todayCount: number;
        successRate: number;
    };
    rfid: {
        verificationsToday: number;
        successRate: number;
        activeReaders: number;
    };
    notifications: {
        sentToday: number;
        deliveryRate: number;
        channels: {
            email: number;
            sms: number;
            push: number;
        };
    };
}
export interface Alert {
    id: string;
    type: 'system' | 'performance' | 'business' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    timestamp: Date;
    resolved: boolean;
    metadata?: Record<string, any>;
}
export interface Recommendation {
    id: string;
    category: 'performance' | 'security' | 'cost' | 'maintenance';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    estimatedImpact: string;
    estimatedEffort: string;
}
export declare class MonitoringDashboardService {
    private readonly CACHE_TTL;
    getDashboardData(): Promise<MonitoringDashboard>;
    private getServiceHealth;
    private getSystemMetrics;
    private getPerformanceMetrics;
    private getBusinessMetrics;
    private getActiveAlerts;
    private getRecommendations;
    healthCheck(): Promise<{
        status: string;
        timestamp: Date;
        services: any;
    }>;
    getDatabaseHealth(): Promise<{
        status: string;
        timestamp: Date;
        responseTime: number;
    }>;
    getCacheHealth(): Promise<{
        status: string;
        timestamp: Date;
        responseTime: number;
    }>;
    getPaymentServiceHealth(): Promise<{
        status: string;
        timestamp: Date;
        responseTime: number;
    }>;
    getRfidServiceHealth(): Promise<{
        status: string;
        timestamp: Date;
        responseTime: number;
    }>;
}
export declare const monitoringDashboardService: MonitoringDashboardService;
export default monitoringDashboardService;
//# sourceMappingURL=monitoring-dashboard.service.d.ts.map