import { StorageQuery, QueryPlan, OptimizationConfig } from '../../types/storage-types';
export declare class QueryOptimizer {
    private config;
    private optimizationCache;
    private statistics;
    private optimizationRules;
    constructor(config: OptimizationConfig);
    initialize(): Promise<void>;
    optimizeQuery(query: StorageQuery): Promise<QueryPlan>;
    analyzeQuery(query: StorageQuery): Promise<QueryAnalysis>;
    updateStatistics(tableName: string, statistics: Partial<TableStatistics>): Promise<void>;
    getOptimizationStatistics(): Promise<any>;
    getHealth(): Promise<any>;
    private setupOptimizationRules;
    private createBasePlan;
    private applyOptimizations;
    private estimateQueryCost;
    private estimateExecutionTime;
    private selectOptimalTier;
    private calculateParallelism;
    private calculateComplexity;
    private identifyTableScans;
    private identifyJoins;
    private identifyAggregations;
    private identifyPredicates;
    private generateRecommendations;
    private hasPredicates;
    private hasProjections;
    private hasJoins;
    private canUseIndexes;
    private canPrunePartitions;
    private applyPredicatePushdown;
    private applyProjectionPushdown;
    private applyJoinReordering;
    private applyIndexSelection;
    private applyPartitionPruning;
    private calculateOptimizationImpact;
    private generateCacheKey;
    private isCacheStale;
    private calculateCacheHitRate;
    private calculateAvgOptimizationTime;
    private loadStatistics;
    private startStatisticsCollection;
    private collectTableStatistics;
    shutdown(): Promise<void>;
    getStatistics(): Promise<any>;
    getHealthStatus(): Promise<any>;
}
interface QueryAnalysis {
    queryId: string;
    complexity: 'low' | 'medium' | 'high';
    tableScans: string[];
    joinOperations: string[];
    aggregations: string[];
    predicates: string[];
    recommendations: OptimizationRecommendation[];
}
interface OptimizationRecommendation {
    type: 'performance' | 'indexing' | 'partitioning' | 'query_rewrite';
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: string;
}
interface TableStatistics {
    tableName: string;
    rowCount: number;
    columnStats: Map<string, ColumnStats>;
    indexStats: Map<string, IndexStats>;
    lastUpdated: Date;
}
interface ColumnStats {
    distinctValues: number;
    nullCount: number;
    minValue: any;
    maxValue: any;
    avgLength?: number;
}
interface IndexStats {
    indexName: string;
    selectivity: number;
    cardinality: number;
    size: number;
    lastUsed: Date;
}
export default QueryOptimizer;
//# sourceMappingURL=query-optimizer.d.ts.map