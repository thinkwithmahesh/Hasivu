import { Prisma } from '@prisma/client';
export declare enum IsolationLevel {
    READ_UNCOMMITTED = "READ UNCOMMITTED",
    READ_COMMITTED = "READ COMMITTED",
    REPEATABLE_READ = "REPEATABLE READ",
    SERIALIZABLE = "SERIALIZABLE"
}
export interface TransactionOptions {
    isolationLevel?: IsolationLevel;
    timeout?: number;
    retryCount?: number;
    distributedLock?: {
        key: string;
        ttl?: number;
        retryDelay?: number;
        maxRetries?: number;
    };
    deadlockDetection?: boolean;
    rollbackOnError?: boolean;
    metrics?: boolean;
}
export interface TransactionResult<T> {
    data: T;
    transactionId: string;
    duration: number;
    retryCount: number;
    deadlockDetected: boolean;
    lockAcquired: boolean;
    rollbackOccurred: boolean;
    timestamp: Date;
    metrics?: TransactionMetrics;
}
export interface DistributedLock {
    key: string;
    token: string;
    ttl: number;
    acquiredAt: Date;
    expiresAt: Date;
}
export interface TransactionMetrics {
    startTime: number;
    endTime: number;
    duration: number;
    lockWaitTime?: number;
    retryAttempts: number;
    deadlockCount: number;
    rollbackCount: number;
    operationCount: number;
    queryCount: number;
    affectedRows: number;
}
export interface DeadlockInfo {
    detected: boolean;
    processes: Array<{
        pid: number;
        query: string;
        waitingFor: string;
        lockType: string;
    }>;
    resolution: 'abort' | 'retry' | 'escalate';
    timestamp: Date;
}
export interface TransactionContext {
    transactionId: string;
    isolationLevel: IsolationLevel;
    startTime: number;
    operations: string[];
    locks: DistributedLock[];
    savepoints: string[];
    parentTransaction?: string;
}
export declare class TransactionService {
    private static instance;
    private prisma;
    private redisService;
    private transactionCounter;
    private activeTransactions;
    private lockRegistry;
    private constructor();
    static getInstance(): TransactionService;
    executeTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>, options?: TransactionOptions): Promise<TransactionResult<T>>;
    private acquireDistributedLock;
    private releaseDistributedLock;
    private analyzeDeadlock;
    private isDeadlockError;
    private isRetryableError;
    private calculateMetrics;
    private delay;
    getActiveTransactionCount(): number;
    getActiveLockCount(): number;
    getTransactionContext(transactionId: string): TransactionContext | undefined;
    cleanupExpiredLocks(): Promise<number>;
}
export declare class TransactionPatterns {
    private static transactionService;
    static executeUserRegistration(userData: any): Promise<TransactionResult<any>>;
    static executeOrderProcessing(orderData: any): Promise<TransactionResult<any>>;
    static executePaymentProcessing(paymentData: any): Promise<TransactionResult<any>>;
}
export default TransactionService;
//# sourceMappingURL=transaction.service.d.ts.map