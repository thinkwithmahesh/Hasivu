import { StorageTier, PartitionInfo } from '../../types/storage-types';
export declare class DataTieringManager {
    private partitions;
    private tieringRules;
    private migrationQueue;
    private isRunning;
    constructor();
    initialize(): Promise<void>;
    evaluatePartition(partitionId: string): Promise<StorageTier>;
    migratePartition(partitionId: string, targetTier: StorageTier): Promise<void>;
    getPartitionsByTier(tier: StorageTier): Promise<PartitionInfo[]>;
    getTieringStatistics(): Promise<any>;
    getHealth(): Promise<any>;
    private setupDefaultTieringRules;
    private evaluateRule;
    private parseCondition;
    private safeEvaluate;
    private calculateAccessFrequency;
    private loadPartitionMetadata;
    private startTieringEngine;
    private evaluateAllPartitions;
    private processMigrationQueue;
    private executeMigration;
    private performTierMigration;
    private getMigrationDelay;
    private estimateMigrationTime;
    shutdown(): Promise<void>;
    getStatistics(): Promise<any>;
    getHealthStatus(): Promise<any>;
    compactTables(): Promise<number>;
    private needsCompaction;
    private compactPartition;
    private calculateTieringEfficiency;
    private calculateAverageMigrationTime;
    private calculateCostOptimization;
}
export default DataTieringManager;
//# sourceMappingURL=data-tiering-manager.d.ts.map