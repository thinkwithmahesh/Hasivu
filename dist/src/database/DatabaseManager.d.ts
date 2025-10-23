import { PrismaClient, Prisma } from '@prisma/client';
export interface DatabaseConfig {
    url: string;
    logLevel?: 'info' | 'query' | 'warn' | 'error';
}
export interface ConnectionStatus {
    isConnected: boolean;
    lastHealthCheck: Date;
}
export interface TransactionOptions {
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
    maxWait?: number;
}
export declare class DatabaseManager {
    private static instance;
    private prisma;
    private config;
    private isInitialized;
    private constructor();
    static getInstance(config?: DatabaseConfig): DatabaseManager;
    getClient(): PrismaClient;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<ConnectionStatus>;
    executeRaw<T = any>(query: string, params?: any[]): Promise<T[]>;
    transaction<T>(callback: (prisma: Prisma.TransactionClient) => Promise<T>, options?: TransactionOptions): Promise<T>;
    reset(): Promise<void>;
    isReady(): boolean;
    getPrismaClient(): PrismaClient;
}
export declare const prisma: PrismaClient<Prisma.PrismaClientOptions, never, import(".prisma/client/runtime/library").DefaultArgs>;
//# sourceMappingURL=DatabaseManager.d.ts.map