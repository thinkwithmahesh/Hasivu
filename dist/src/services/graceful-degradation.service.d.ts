export declare enum ServiceStatus {
    HEALTHY = "healthy",
    DEGRADED = "degraded",
    UNAVAILABLE = "unavailable",
    RECOVERING = "recovering"
}
export declare enum DegradationStrategy {
    FAIL_FAST = "fail_fast",
    CACHED_RESPONSE = "cached_response",
    SIMPLIFIED_RESPONSE = "simplified_response",
    FALLBACK_SERVICE = "fallback_service",
    OFFLINE_MODE = "offline_mode",
    RETRY_WITH_BACKOFF = "retry_with_backoff"
}
export interface ServiceHealth {
    serviceName: string;
    status: ServiceStatus;
    lastCheck: Date;
    responseTime: number;
    errorCount: number;
    consecutiveFailures: number;
    uptime: number;
    degradationReason?: string;
    recoveryEstimate?: Date;
}
export interface DegradationConfig {
    service: string;
    strategy: DegradationStrategy;
    healthCheckInterval: number;
    maxConsecutiveFailures: number;
    recoveryThreshold: number;
    cacheTimeout: number;
    retryCount: number;
    retryDelay: number;
    circuitBreakerEnabled: boolean;
    fallbackEndpoint?: string;
    fallbackOperations?: FallbackOperation<any>[];
    priorityLevel: 'critical' | 'high' | 'medium' | 'low';
}
export interface FallbackOperation<T> {
    operation: () => Promise<T> | T;
    cacheKey?: string;
    cacheDuration?: number;
    priority: number;
}
export interface DegradationMetrics {
    totalDegradations: number;
    successfulFallbacks: number;
    failedOperations: number;
    averageRecoveryTime: number;
    mostFailedService: string;
    degradationHistory: {
        timestamp: Date;
        service: string;
        reason: string;
        duration: number;
    }[];
}
export declare class GracefulDegradationService {
    private serviceHealthMap;
    private degradationConfigs;
    private fallbackCache;
    private healthCheckIntervals;
    private redis;
    private isInitialized;
    private degradationMetrics;
    constructor();
    initialize(configs: DegradationConfig[]): Promise<void>;
    isServiceAvailable(serviceName: string): Promise<boolean>;
    getServiceHealth(serviceName: string): ServiceHealth | null;
    executeWithDegradation<T>(serviceName: string, operation: () => Promise<T>, fallbackOperations?: FallbackOperation<T>[]): Promise<T>;
    private executeFallback;
    private shouldUseFallback;
    private startHealthMonitoring;
    private performHealthCheck;
    private checkDatabaseHealth;
    private checkRedisHealth;
    private checkExternalApiHealth;
    private updateHealthStatus;
    private updateHealthMetrics;
    private recordDegradation;
    private getCachedResult;
    private cacheResult;
    getDegradationMetrics(): DegradationMetrics;
    getAllServiceHealth(): ServiceHealth[];
    forceServiceStatus(serviceName: string, status: ServiceStatus, reason?: string): void;
    static createDefaultConfig(serviceName: string, strategy?: DegradationStrategy): DegradationConfig;
    static createCriticalServiceConfig(serviceName: string): DegradationConfig;
    executeDatabase<T>(operation: () => Promise<T>, fallbackData?: T): Promise<T>;
    executeExternalApi<T>(apiName: string, operation: () => Promise<T>, cachedFallback?: T, cacheKey?: string): Promise<T>;
    executeNotification<T>(operation: () => Promise<T>, fallbackNotification?: () => Promise<T>): Promise<T>;
    cleanup(): Promise<void>;
    getSystemHealth(): {
        overall: string;
        timestamp: Date;
        uptime: number;
        services: ServiceHealth[];
        summary: {
            healthy: number;
            unavailable: number;
        };
    };
    configureFallback(serviceName: string, fallbackFn: () => Promise<any>): void;
    setServiceState(serviceName: string, status: ServiceStatus): void;
    executeRedis<T>(operation: () => Promise<T>): Promise<T>;
}
export default GracefulDegradationService;
//# sourceMappingURL=graceful-degradation.service.d.ts.map