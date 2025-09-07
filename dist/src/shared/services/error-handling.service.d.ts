export interface ErrorContext {
    operation: string;
    userId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
    timestamp?: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
    retryableErrors: string[];
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    monitoringWindow: number;
}
export interface CircuitBreakerState {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failures: number;
    successes: number;
    lastFailureTime: number;
    nextAttemptTime: number;
}
export interface DLQMessage {
    originalError: {
        name: string;
        message: string;
        stack?: string;
        code?: string;
    };
    context: ErrorContext;
    retryAttempts: number;
    timestamp: number;
    environment: string;
    service: string;
}
export interface ErrorNotification {
    subject: string;
    message: string;
    severity: ErrorContext['severity'];
    timestamp: number;
    context: ErrorContext;
    environment: string;
}
export declare class ErrorHandlingServiceError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details: any;
    constructor(message: string, code?: string, statusCode?: number, details?: any);
}
export declare class ErrorHandlingService {
    private static instance;
    private sqsClient;
    private snsClient;
    private circuitBreakers;
    private readonly deadLetterQueueUrl;
    private readonly retryQueueUrl;
    private readonly notificationTopicArn;
    private readonly environment;
    private readonly serviceName;
    private readonly defaultRetryConfig;
    private readonly defaultCircuitBreakerConfig;
    private constructor();
    static getInstance(): ErrorHandlingService;
    private validateConfiguration;
    executeWithRetry<T>(operation: () => Promise<T>, context: ErrorContext, config?: Partial<RetryConfig>): Promise<T>;
    executeWithCircuitBreaker<T>(operation: () => Promise<T>, operationName: string, config?: Partial<CircuitBreakerConfig>): Promise<T>;
    executeWithFullProtection<T>(operation: () => Promise<T>, context: ErrorContext, retryConfig?: Partial<RetryConfig>, circuitConfig?: Partial<CircuitBreakerConfig>): Promise<T>;
    handleUnrecoverableError(error: Error, context: ErrorContext): Promise<void>;
    private sendToDeadLetterQueue;
    private sendErrorNotification;
    private formatErrorNotification;
    private getCircuitBreakerState;
    private recordCircuitBreakerSuccess;
    private recordCircuitBreakerFailure;
    private isRetryableError;
    private sleep;
    getCircuitBreakerStatus(): Record<string, CircuitBreakerState>;
    resetCircuitBreaker(operationName: string): void;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        timestamp: number;
        configuration: {
            dlqConfigured: boolean;
            retryQueueConfigured: boolean;
            notificationsConfigured: boolean;
            environment: string;
            serviceName: string;
        };
        circuitBreakers: {
            total: number;
            open: number;
            halfOpen: number;
            closed: number;
        };
        error?: string;
    }>;
}
export declare const errorHandlingService: ErrorHandlingService;
//# sourceMappingURL=error-handling.service.d.ts.map