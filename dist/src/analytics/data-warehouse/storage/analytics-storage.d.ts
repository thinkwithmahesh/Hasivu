/// <reference types="node" />
import { EventEmitter } from 'events';
import { AnalyticsStorageConfig, StorageQuery, QueryResult, MaterializedView, StorageStatistics } from '../types/storage-types';
export declare class AnalyticsStorageEngine extends EventEmitter {
    private readonly config;
    private readonly metrics;
    private readonly cache;
    private readonly distributedProcessor;
    private readonly memoryEngine;
    private readonly tieringManager;
    private readonly indexManager;
    private readonly compressionManager;
    private readonly viewManager;
    private readonly queryOptimizer;
    private readonly parallelProcessor;
    private readonly storageMonitor;
    private readonly tenantIsolation;
    private isRunning;
    private readonly queryHistory;
    private readonly activeQueries;
    private readonly materializedViews;
    constructor(config: AnalyticsStorageConfig);
    private validateTenantAccess;
    start(): Promise<void>;
    stop(): Promise<void>;
    executeQuery(query: StorageQuery, tenantId: string, options?: {
        priority?: 'low' | 'normal' | 'high';
        timeout?: number;
        useCache?: boolean;
        forceRefresh?: boolean;
    }): Promise<QueryResult>;
    createIndex(tableName: string, columns: string[], indexType: 'btree' | 'hash' | 'bitmap' | 'inverted', tenantId: string, options?: {
        unique?: boolean;
        partial?: string;
        concurrent?: boolean;
    }): Promise<string>;
    createMaterializedView(viewName: string, query: StorageQuery, tenantId: string, options?: {
        refreshInterval?: number;
        incremental?: boolean;
        partitionBy?: string;
    }): Promise<MaterializedView>;
    refreshMaterializedView(viewId: string, force?: boolean): Promise<void>;
    configureTiering(tableName: string, tieringPolicy: {
        hotDays: number;
        warmDays: number;
        coldDays: number;
        archiveDays?: number;
    }, tenantId: string): Promise<void>;
    getStorageStatistics(_tenantId?: string): Promise<StorageStatistics>;
    optimizeStorage(options?: {
        analyzeIndexes?: boolean;
        compactTables?: boolean;
        updateStatistics?: boolean;
        refreshViews?: boolean;
    }): Promise<{
        indexesOptimized: number;
        tablesCompacted: number;
        statisticsUpdated: number;
        viewsRefreshed: number;
    }>;
    getHealthStatus(): Promise<{
        healthy: boolean;
        components: Record<string, {
            healthy: boolean;
            details?: any;
        }>;
        metrics: Record<string, number>;
    }>;
    private generateQueryPlan;
    private executeQueryPlan;
    private executeHybridQuery;
    private selectOptimalTier;
    private calculateQueryCost;
    private analyzeQueryComplexity;
    private getCachedResult;
    private cacheResult;
    private generateCacheKey;
    private generateQueryId;
    private loadMaterializedViews;
    private cancelActiveQueries;
    private cancelQuery;
    private refreshAllViews;
    private calculateAverageQueryTime;
    private calculateCacheHitRate;
    private getLastViewRefresh;
    private startBackgroundTasks;
    private monitorQueryPerformance;
    private cleanupQueryHistory;
    private scheduleViewRefreshes;
    private performAutomaticOptimization;
    private calculateSlowQueries;
    private calculateAverageRefreshTime;
    private calculateEstimatedTime;
    private generateOptimizations;
    private setupEventHandlers;
}
//# sourceMappingURL=analytics-storage.d.ts.map