export declare enum CircuitState {
    CLOSED = "closed",
    OPEN = "open",
    HALF_OPEN = "half_open"
}
export interface CircuitBreakerConfig {
    name: string;
    failureThreshold: number;
    recoveryTimeout: number;
    requestTimeout: number;
    resetTimeout: number;
    monitoringWindow: number;
    volumeThreshold: number;
    errorThresholdPercentage: number;
}
export interface CircuitBreakerStats {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    totalRequests: number;
    lastFailureTime: number;
    lastSuccessTime: number;
    nextRetryTime: number;
    failureRate: number;
    isOpen: boolean;
    isHalfOpen: boolean;
    isClosed: boolean;
}
export declare class CircuitBreakerError extends Error {
    circuitName: string;
    state: CircuitState;
    constructor(message: string, circuitName: string, state: CircuitState);
}
export declare class CircuitBreakerOpenError extends CircuitBreakerError {
    constructor(circuitName: string);
}
export declare class CircuitBreakerTimeoutError extends CircuitBreakerError {
    constructor(circuitName: string, timeout: number);
}
export declare class CircuitBreaker {
    private config;
    private state;
    private failureCount;
    private successCount;
    private totalRequests;
    private lastFailureTime;
    private lastSuccessTime;
    private nextRetryTime;
    private requestQueue;
    private metrics;
    private redis;
    constructor(config: CircuitBreakerConfig);
    private validateConfig;
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private shouldOpenCircuit;
    private openCircuit;
    private calculateFailureRate;
    private recordMetric;
    private cancelPendingRequests;
    private cleanup;
    private startMetricsCleanup;
    getStats(): CircuitBreakerStats;
    forceState(state: CircuitState): void;
    reset(): void;
}
export declare class CircuitBreakerFactory {
    static createDatabaseCircuitBreaker(operationName: string): CircuitBreaker;
    static createRedisCircuitBreaker(operationName: string): CircuitBreaker;
    static createPaymentCircuitBreaker(operationName: string): CircuitBreaker;
    static createExternalApiCircuitBreaker(apiName: string): CircuitBreaker;
}
export declare class CircuitBreakerRegistry {
    private static breakers;
    static getOrCreate(name: string, config: CircuitBreakerConfig): CircuitBreaker;
    static get(name: string): CircuitBreaker | undefined;
    static remove(name: string): boolean;
    static getAllStats(): Record<string, CircuitBreakerStats>;
    static resetAll(): void;
    static getHealthyBreakers(): string[];
    static getUnhealthyBreakers(): string[];
}
export default CircuitBreaker;
//# sourceMappingURL=circuit-breaker.service.d.ts.map