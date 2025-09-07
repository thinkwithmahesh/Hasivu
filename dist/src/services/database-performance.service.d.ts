/// <reference types="node" />
import { EventEmitter } from 'events';
export interface DatabasePerformanceMetrics {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    performance: {
        avgQueryTime: number;
        slowQueries: number;
        connectionPoolUsage: number;
        indexEfficiency: number;
        queriesPerSecond: number;
        cacheHitRatio: number;
    };
    connections: {
        active: number;
        idle: number;
        total: number;
        maxConnections: number;
        queueLength: number;
        acquireTimeout: number;
    };
    slowQueries: Array<{
        query: string;
        duration: number;
        timestamp: Date;
        parameters?: any;
    }>;
    indexAnalysis: {
        missingIndexes: Array<{
            table: string;
            columns: string[];
            usage: number;
            impact: 'high' | 'medium' | 'low';
        }>;
        redundantIndexes: Array<{
            table: string;
            indexName: string;
            reason: string;
        }>;
        indexUsageStats: Array<{
            table: string;
            indexName: string;
            usage: number;
            scans: number;
            seeks: number;
        }>;
    };
    tableMetrics: Array<{
        name: string;
        rowCount: number;
        tableSize: number;
        indexSize: number;
        avgQueryTime: number;
        mostCommonQueries: string[];
    }>;
    errors: string[];
}
export interface QueryOptimizationRecommendation {
    queryPattern: string;
    table: string;
    issue: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImprovement: string;
    implementationSteps: string[];
}
export declare class DatabasePerformanceService extends EventEmitter {
    private prisma;
    private queryMetrics;
    private recentQueries;
    private connectionStats;
    private performanceHistory;
    private readonly SLOW_QUERY_THRESHOLD;
    private readonly MAX_RECENT_QUERIES;
    private readonly PERFORMANCE_HISTORY_LIMIT;
    private monitoringInterval?;
    constructor();
    private initializePrismaClient;
    private setupQueryListeners;
    private setupPerformanceMonitoring;
    private startContinuousMonitoring;
    getPerformanceMetrics(): Promise<DatabasePerformanceMetrics>;
    private getConnectionStatistics;
    private getTableMetrics;
    private getIndexAnalysis;
    private identifyMissingIndexes;
    getOptimizationRecommendations(): Promise<QueryOptimizationRecommendation[]>;
    applyAutomaticOptimizations(): Promise<{
        applied: string[];
        failed: string[];
        recommendations: QueryOptimizationRecommendation[];
    }>;
    private updateQueryMetrics;
    private trackSlowQuery;
    private addRecentQuery;
    private calculateAverageQueryTime;
    private calculateQueriesPerSecond;
    private calculateIndexEfficiency;
    private getCacheHitRatio;
    private getSlowQueries;
    private determineHealthStatus;
    private updateConnectionStats;
    private emitPerformanceMetrics;
    private addToPerformanceHistory;
    private checkForOptimizationOpportunities;
    private extractQueryPattern;
    private extractTableName;
    private getTableAverageQueryTime;
    private getTableCommonQueries;
    disconnect(): Promise<void>;
}
export declare const databasePerformanceService: DatabasePerformanceService;
//# sourceMappingURL=database-performance.service.d.ts.map