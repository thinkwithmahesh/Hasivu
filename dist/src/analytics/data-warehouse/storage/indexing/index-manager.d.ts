import { IndexStrategy } from '../../types/storage-types';
export declare class IndexManager {
    private indexes;
    private indexUsageStats;
    private indexRecommendations;
    private autoIndexingEnabled;
    constructor();
    initialize(): Promise<void>;
    createIndex(config: IndexCreateConfig): Promise<string>;
    dropIndex(indexId: string): Promise<void>;
    analyzeQuery(query: string, _queryPlan: any): Promise<IndexRecommendation[]>;
    getIndexStatistics(): Promise<any>;
    getHealth(): Promise<any>;
    private loadExistingIndexes;
    private startUsageMonitoring;
    private validateIndexConfig;
    private buildIndex;
    private calculateIndexSize;
    private calculateIndexCardinality;
    private removeIndexData;
    private parseQuery;
    private findSuitableIndex;
    private suggestIndexStrategy;
    private findUnusedIndexes;
    private getUsageStatsSummary;
    private updateUsageStatistics;
    private performAutoIndexing;
    private estimateIndexBuildTime;
    private arraysEqual;
    private formatBytes;
    shutdown(): Promise<void>;
    getStatistics(): Promise<any>;
    getHealthStatus(): Promise<any>;
    optimizeIndexes(): Promise<number>;
    private needsRebuild;
    private rebuildIndex;
    getOptimalIndexes(): Promise<string[]>;
    private isRecentlyUsed;
}
interface IndexCreateConfig {
    name?: string;
    table: string;
    columns: string[];
    strategy?: IndexStrategy;
    unique?: boolean;
    partial?: boolean;
    condition?: string;
}
interface IndexRecommendation {
    type: 'create' | 'drop' | 'modify';
    indexId?: string;
    table: string;
    columns?: string[];
    strategy?: IndexStrategy;
    benefit: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    estimatedImpact: {
        queryTimeReduction?: string;
        ioCostReduction?: string;
        storageReduction?: string;
        maintenanceReduction?: string;
    };
}
export default IndexManager;
//# sourceMappingURL=index-manager.d.ts.map