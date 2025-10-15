export interface ServiceInitializationStatus {
    name: string;
    status: 'pending' | 'initializing' | 'ready' | 'failed' | 'degraded';
    startTime?: number;
    endTime?: number;
    duration?: number;
    error?: Error;
    healthCheck?: boolean;
    dependencies?: string[];
    retryCount?: number;
    degradationLevel?: string;
}
export interface ServiceConfiguration {
    name: string;
    order: number;
    required: boolean;
    timeout: number;
    retryEnabled: boolean;
    maxRetries: number;
    retryDelay: number;
    healthCheckEnabled: boolean;
    healthCheckInterval: number;
    gracefulDegradationEnabled: boolean;
    dependencies?: string[];
    circuitBreakerEnabled?: boolean;
    circuitBreakerConfig?: {
        threshold: number;
        timeout: number;
        resetTimeout: number;
    };
}
export declare class ServiceInitializationManager {
    private static instance;
    private readonly serviceStatuses;
    private readonly retryService;
    private isInitialized;
    private readonly startupStart;
    private constructor();
    static getInstance(): ServiceInitializationManager;
    initializeAllServices(customConfigs?: Record<string, Partial<ServiceConfiguration>>): Promise<void>;
    private initializeService;
    private initializeDatabaseService;
    private initializeRedisService;
    private initializeAuthService;
    private initializePerformanceService;
    private initializeCostMonitoringService;
    private initializeBusinessMetricsService;
    private performHealthCheck;
    private startHealthMonitoring;
    private validateDependencies;
    private executeWithTimeout;
    private updateServiceStatus;
    private mergeConfigurations;
    getServiceStatuses(): Map<string, ServiceInitializationStatus>;
    getServiceStatus(serviceName: string): ServiceInitializationStatus | undefined;
    getReadyServices(): ServiceInitializationStatus[];
    getFailedServices(): ServiceInitializationStatus[];
    getDegradedServices(): ServiceInitializationStatus[];
    isAllServicesInitialized(): boolean;
    isCriticalServicesReady(): boolean;
    getSystemHealth(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        readyServices: number;
        failedServices: number;
        degradedServices: number;
        totalServices: number;
        uptime: number;
    };
    restartService(serviceName: string): Promise<void>;
    shutdown(): Promise<void>;
}
declare const _default: ServiceInitializationManager;
export default _default;
//# sourceMappingURL=service-initialization.service.d.ts.map