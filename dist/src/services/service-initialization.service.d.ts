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
    initializeFunction: () => Promise<void>;
    healthCheckFunction?: () => Promise<boolean>;
    dependencies?: string[];
    timeout?: number;
    retryAttempts?: number;
    critical?: boolean;
    gracefulDegradation?: boolean;
    circuitBreaker?: boolean;
}
export declare const SERVICE_INITIALIZATION_ORDER: ServiceConfiguration[];
export declare class ServiceInitializationService {
    private static instance;
    private initializationStatuses;
    private isInitialized;
    private startTime;
    private endTime;
    private totalDuration;
    private constructor();
    static getInstance(): ServiceInitializationService;
    initializeServices(): Promise<void>;
    private initializeService;
    private initializeServiceWithRetry;
    private checkDependencies;
    private setupCircuitBreaker;
    private setupGracefulDegradation;
    private setupDegradedMode;
    private validateCriticalServices;
    private startHealthMonitoring;
    getInitializationStatus(): Map<string, ServiceInitializationStatus>;
    getFailedServices(): string[];
    getReadyServices(): string[];
    getDegradedServices(): string[];
    isAllServicesInitialized(): boolean;
    getInitializationSummary(): {
        total: number;
        ready: number;
        failed: number;
        degraded: number;
        duration: number;
        success: boolean;
    };
    restartFailedServices(): Promise<void>;
    shutdown(): Promise<void>;
    private delay;
}
export declare const serviceInitializationService: ServiceInitializationService;
export default serviceInitializationService;
//# sourceMappingURL=service-initialization.service.d.ts.map