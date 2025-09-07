import { PrismaClient, Prisma } from '@prisma/client';
export interface DatabaseConfig {
    url: string;
    maxConnections?: number;
    connectionTimeout?: number;
    queryTimeout?: number;
    logLevel?: 'info' | 'query' | 'warn' | 'error';
    enableLogging?: boolean;
}
export interface ConnectionStatus {
    isConnected: boolean;
    activeConnections: number;
    maxConnections: number;
    lastHealthCheck: Date;
    uptime: number;
}
export interface QueryMetrics {
    totalQueries: number;
    avgExecutionTime: number;
    slowQueries: number;
    errorRate: number;
    lastReset: Date;
}
export interface TransactionOptions {
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
    maxWait?: number;
}
export declare class DatabaseManager {
    private static instance;
    private prisma;
    private logger;
    private config;
    private startTime;
    private metrics;
    private isInitialized;
    private constructor();
    static getInstance(config?: DatabaseConfig): DatabaseManager;
    private initializePrisma;
    private setupPrismaLogging;
    getClient(): PrismaClient;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<ConnectionStatus>;
    executeRaw<T = any>(query: string, params?: any[]): Promise<T[]>;
    transaction<T>(callback: (prisma: Prisma.TransactionClient) => Promise<T>, options?: TransactionOptions): Promise<T>;
    reset(): Promise<void>;
    migrate(): Promise<void>;
    getMetrics(): QueryMetrics;
    resetMetrics(): void;
    private updateQueryMetrics;
    createBackup(backupName?: string): Promise<string>;
    restoreBackup(backupName: string): Promise<void>;
    getConfig(): Omit<DatabaseConfig, 'url'>;
    isReady(): boolean;
}
//# sourceMappingURL=DatabaseManager.d.ts.map