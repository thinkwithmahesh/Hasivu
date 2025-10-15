import { PartitionScheme, PartitionMetadata, PartitionRecommendation } from '../../types/data-lake-types';
export interface PartitionAnalysis {
    currentPartitions: PartitionMetadata[];
    recommendedStrategy: PartitionScheme;
    estimatedQueryPerformance: number;
    estimatedStorageOptimization: number;
    reason: string;
}
export interface PartitionConfig {
    maxPartitionSize: number;
    maxPartitionsPerLevel: number;
    pruningEnabled: boolean;
    compactionEnabled: boolean;
    autoOptimization: boolean;
    enabled?: boolean;
}
export declare class PartitionManager {
    private config;
    private partitionCache;
    constructor(config?: Partial<PartitionConfig>);
    createPartitionScheme(datasetId: string, data: Record<string, unknown>[] | undefined, strategy: PartitionScheme, columns: string[]): Promise<PartitionScheme>;
    optimizePartitions(datasetId: string): Promise<PartitionAnalysis>;
    suggestPartitioning(datasetId: string, data: Record<string, unknown>[] | undefined, accessPatterns?: string[]): Promise<PartitionRecommendation>;
    private analyzeDataCharacteristics;
    private analyzeAccessPatterns;
    private determinePartitionStrategy;
    private suggestPartitionColumns;
    private estimatePartitionCount;
    private estimatePerformanceGain;
    private generateImplementationPlan;
    prunePartitions(datasetId: string, queryFilters: Record<string, any>): Promise<PartitionMetadata[]>;
    compactPartitions(datasetId: string): Promise<void>;
    getPartitionStatistics(datasetId: string): Promise<{
        totalPartitions: number;
        totalSize: number;
        averagePartitionSize: number;
        largestPartition: number;
        smallestPartition: number;
        compressionRatio: number;
    }>;
    private analyzeDataDistribution;
    private calculateOptimalBuckets;
    private generatePartitions;
    private generateRangePartitions;
    private generateHashPartitions;
    private generateListPartitions;
    private analyzePartitionPerformance;
    private recommendOptimization;
    private shouldIncludePartition;
    private groupPartitionsForCompaction;
    private compactPartitionGroup;
    private inferDataType;
    private calculateDistribution;
    private estimatePartitionSize;
    private getMinValue;
    private getMaxValue;
    private hashFunction;
    private calculateVariance;
    private estimateQueryPerformance;
    private estimateStorageOptimization;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    private validateConfig;
}
export default PartitionManager;
//# sourceMappingURL=partition-manager.d.ts.map