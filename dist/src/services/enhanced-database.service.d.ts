import { PrismaClient } from '@prisma/client';
export interface EnhancedDatabaseHealth {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    connections: {
        active: number;
        idle: number;
        total: number;
        maxConnections: number;
        poolUtilization: number;
    };
    performance: {
        avgQueryTime: number;
        slowQueries: number;
        queryThroughput: number;
        cacheHitRate: number;
    };
    replication: {
        readReplicas: Array<{
            id: string;
            status: 'healthy' | 'degraded' | 'offline';
            lag: number;
        }>;
        writeStatus: 'healthy' | 'degraded' | 'offline';
    };
    cache: {
        hitRate: number;
        missRate: number;
        evictions: number;
        memory: number;
    };
    tables: Array<{
        name: string;
        rowCount: number;
        size: string;
        indexHealth: 'good' | 'needs_optimization';
    }>;
    errors: Array<{
        type: string;
        message: string;
        timestamp: Date;
        count: number;
    }>;
    timestamp: Date;
}
export interface QueryOptimization {
    useCache: boolean;
    cacheTTL?: number;
    useReadReplica: boolean;
    timeout?: number;
    retries?: number;
    batchSize?: number;
    indexHints?: string[];
}
export interface TransactionOptions {
    isolation?: any;
    maxWait?: number;
    timeout?: number;
    retries?: number;
}
declare class EnhancedDatabaseService {
    private prisma;
    constructor();
    executeQuery<T>(queryFn: (prisma: PrismaClient) => Promise<T>, options?: QueryOptimization): Promise<T>;
    executeTransaction<T>(transactionFn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>, options?: TransactionOptions): Promise<T>;
    batchInsert<T>(data: T[], insertFn: (items: T[]) => Promise<any>, batchSize?: number): Promise<void>;
    getHealth(): Promise<EnhancedDatabaseHealth>;
    optimizeDatabase(): Promise<{
        optimizations: string[];
        performance: {
            before: any;
            after: any;
        };
    }>;
    cleanup(): Promise<void>;
}
export declare const enhancedDatabaseService: EnhancedDatabaseService;
export default enhancedDatabaseService;
//# sourceMappingURL=enhanced-database.service.d.ts.map