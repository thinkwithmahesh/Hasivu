export interface SystemMetrics {
    timestamp: Date;
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    requestCount: number;
    errorRate: number;
    throughput: number;
}
export interface BusinessMetrics {
    timestamp: Date;
    users: {
        active: number;
        total: number;
        newToday: number;
        retention: number;
    };
    schools: {
        active: number;
        total: number;
        newThisMonth: number;
        utilization: number;
    };
    payments: {
        todayRevenue: number;
        todayCount: number;
        successRate: number;
        avgOrderValue: number;
    };
    rfid: {
        verificationsToday: number;
        successRate: number;
        activeReaders: number;
        responseTime: number;
    };
    notifications: {
        sentToday: number;
        deliveryRate: number;
        channels: {
            email: number;
            sms: number;
            push: number;
            inApp: number;
        };
    };
}
export interface PerformanceMetrics {
    timestamp: Date;
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
        paymentGateway: {
            status: 'online' | 'offline' | 'degraded';
            responseTime: number;
            successRate: number;
        };
        notificationService: {
            status: 'online' | 'offline' | 'degraded';
            responseTime: number;
            deliveryRate: number;
        };
        rfidSystem: {
            status: 'online' | 'offline' | 'degraded';
            responseTime: number;
            verificationRate: number;
        };
    };
}
export declare class MetricsCollectionService {
    private readonly metricsRetentionHours;
    private readonly collectionIntervalMs;
    private metricsBuffer;
    private collectionTimer?;
    constructor();
    startCollection(): void;
    stopCollection(): void;
    collectSystemMetrics(): Promise<SystemMetrics>;
    collectBusinessMetrics(): Promise<BusinessMetrics>;
    collectPerformanceMetrics(): Promise<PerformanceMetrics>;
    getRecentMetrics(type: 'system' | 'business' | 'performance', minutes?: number): Promise<any[]>;
    private checkThresholds;
    private sendAlert;
    private getCpuUsage;
    private getActiveConnections;
    private getRequestCount;
    private getErrorRate;
    private getThroughput;
    private getUserMetrics;
    private getSchoolMetrics;
    private getPaymentMetrics;
    private getRfidMetrics;
    private getNotificationMetrics;
    private getDatabaseMetrics;
    private getRedisMetrics;
    private getExternalServiceMetrics;
    private storeSystemMetrics;
    private storeBusinessMetrics;
    private storePerformanceMetrics;
    cleanupOldMetrics(): Promise<void>;
    shutdown(): Promise<void>;
}
export declare const metricsCollectionService: MetricsCollectionService;
export default metricsCollectionService;
//# sourceMappingURL=metrics-collection.service.d.ts.map