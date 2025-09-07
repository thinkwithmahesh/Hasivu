export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
    retryCondition?: (error: any) => boolean;
    onRetry?: (error: any, attempt: number) => void;
    timeout?: number;
}
export interface RetryResult<T> {
    result: T;
    attempts: number;
    totalTime: number;
    lastError?: Error;
    allErrors: Error[];
}
export interface RetryMetadata {
    operationType: string;
    startTime: number;
    endTime: number;
    totalAttempts: number;
    success: boolean;
    finalError?: Error;
    delaySequence: number[];
}
export declare const RetryConfigs: {
    DATABASE: RetryConfig;
    REDIS: RetryConfig;
    PAYMENT_GATEWAY: RetryConfig;
    EXTERNAL_API: RetryConfig;
    RFID_READER: RetryConfig;
    FILE_OPERATIONS: RetryConfig;
};
export declare class RetryService {
    static executeWithRetry<T>(operation: () => Promise<T>, config: RetryConfig, operationName?: string): Promise<T>;
    static executeWithRetryResult<T>(operation: () => Promise<T>, config: RetryConfig, operationName?: string): Promise<RetryResult<T>>;
    private static calculateDelay;
    private static defaultRetryCondition;
    private static delay;
    static createRetryMetadata(operationType: string, startTime: number, attempts: number, success: boolean, finalError?: Error, delaySequence?: number[]): RetryMetadata;
    static getRetryStats(): {
        configuredOperations: string[];
        defaultConfigs: Record<string, RetryConfig>;
    };
}
export declare const retryDatabaseOperation: <T>(operation: () => Promise<T>, operationName?: string) => Promise<T>;
export declare const retryRedisOperation: <T>(operation: () => Promise<T>, operationName?: string) => Promise<T>;
export declare const retryPaymentOperation: <T>(operation: () => Promise<T>, operationName?: string) => Promise<T>;
export declare const retryExternalApiOperation: <T>(operation: () => Promise<T>, operationName?: string) => Promise<T>;
export declare const retryRfidOperation: <T>(operation: () => Promise<T>, operationName?: string) => Promise<T>;
export declare const retryFileOperation: <T>(operation: () => Promise<T>, operationName?: string) => Promise<T>;
export declare const retryWithConfig: <T>(operation: () => Promise<T>, config: Partial<RetryConfig>, operationName?: string) => Promise<T>;
export declare function Retry(config?: Partial<RetryConfig>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export default RetryService;
//# sourceMappingURL=retry.service.d.ts.map