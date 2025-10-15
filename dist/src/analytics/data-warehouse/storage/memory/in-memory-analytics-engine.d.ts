import { StorageQuery, QueryResult } from '../../types/storage-types';
export declare class InMemoryAnalyticsEngine {
    private dataStore;
    private indexes;
    private queryCache;
    private memoryUsage;
    private maxMemoryMB;
    constructor(maxMemoryMB?: number);
    initialize(): Promise<void>;
    executeQuery(query: StorageQuery): Promise<QueryResult>;
    loadDataset(name: string, data: any[] | undefined): Promise<void>;
    getStatistics(): Promise<any>;
    getHealth(): Promise<any>;
    private processQuery;
    private applyFilters;
    private applySorting;
    private applyAggregations;
    private buildIndexes;
    private estimateDataSize;
    private generateCacheKey;
    private shouldCache;
    private setupMemoryMonitoring;
    private loadHotData;
    private performMemoryCleanup;
    shutdown(): Promise<void>;
    getHealthStatus(): Promise<any>;
    cancelQuery(queryId: string): Promise<void>;
    private extractTableName;
}
export default InMemoryAnalyticsEngine;
//# sourceMappingURL=in-memory-analytics-engine.d.ts.map