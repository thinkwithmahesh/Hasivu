import { PrismaClient } from '@prisma/client';
export interface DatabaseHealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    connections: {
        active: number;
        idle: number;
        total: number;
        max: number;
    };
    performance: {
        averageQueryTime: number;
        slowQueries: number;
        totalQueries: number;
    };
    lastCheck: Date;
    errors: string[];
    uptime: number;
}
export interface QueryPerformance {
    query: string;
    params: any;
    duration: number;
    timestamp: Date;
    target: string;
    slow: boolean;
}
export interface DatabaseConfig {
    url: string;
    maxConnections: number;
    connectionTimeoutMs: number;
    queryTimeoutMs: number;
    slowQueryThreshold: number;
    enableLogging: boolean;
    enableMetrics: boolean;
    poolConfig: {
        min: number;
        max: number;
        acquireTimeoutMillis: number;
        idleTimeoutMillis: number;
    };
}
export interface ConnectionMetrics {
    created: number;
    destroyed: number;
    active: number;
    idle: number;
    pending: number;
    errors: number;
    totalQueries: number;
    slowQueries: number;
    averageLatency: number;
    uptime: number;
    lastActivity: Date;
}
export declare class DatabaseService {
    private static instance;
    private client;
    private isConnected;
    private connectionAttempts;
    private lastConnectionTime;
    private queryMetrics;
    private connectionMetrics;
    private healthStatus;
    private maxRetries;
    private retryDelay;
    private constructor();
    static getInstance(): DatabaseService;
    private initializeConnectionMetrics;
    private initializeHealthStatus;
    private initializeClient;
    private getConfiguration;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getPrismaClient(): PrismaClient;
    executeOperation<T>(operation: (client: PrismaClient) => Promise<T>, operationName?: string): Promise<T>;
    private isConnectionError;
    private trackQueryPerformance;
    private updateHealthStatus;
    getHealthStatus(): Promise<DatabaseHealthStatus>;
    getConnectionMetrics(): ConnectionMetrics;
    getQueryMetrics(limit?: number): QueryPerformance[];
    getSlowQueries(limit?: number): QueryPerformance[];
    clearMetrics(): void;
    testConnection(): Promise<{
        connected: boolean;
        latency: number;
        version?: string;
        error?: string;
    }>;
    shutdown(): Promise<void>;
    getConfigurationSafe(): Partial<DatabaseConfig>;
    private delay;
    isReady(): boolean;
    getUptime(): number;
    executeRawQuery<T>(query: string, params?: any[]): Promise<T>;
    executeTransaction<T>(operations: (client: PrismaClient) => Promise<T>, options?: {
        timeout?: number;
        isolationLevel?: string;
    }): Promise<T>;
}
export declare const databaseService: DatabaseService;
export default DatabaseService;
//# sourceMappingURL=database.service.d.ts.map