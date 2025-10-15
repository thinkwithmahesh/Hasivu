/// <reference types="node" />
import { EventEmitter } from 'events';
import { DataLakeManagerConfig, DataFormat, StorageLocation, CompressionFormat, PartitionScheme, DataCatalogEntry, DataLineage } from '../types/data-lake-types';
import { SchemaInference } from './schema/schema-inference-engine';
export declare class DataLakeManager extends EventEmitter {
    private readonly config;
    private readonly log;
    private readonly metrics;
    private readonly objectStorage;
    private readonly schemaInference;
    private readonly versionManager;
    private readonly catalogManager;
    private readonly replicationManager;
    private readonly formatOptimizer;
    private readonly partitionManager;
    private readonly metadataIndexer;
    private readonly qualityScanner;
    private readonly accessControl;
    private isInitialized;
    private readonly datasets;
    private readonly schemas;
    private readonly versions;
    constructor(config: DataLakeManagerConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    storeData(datasetName: string, data: any, options: {
        format?: DataFormat;
        compression?: CompressionFormat;
        partition?: PartitionScheme;
        tenantId: string;
        metadata?: Record<string, any>;
        version?: string;
    }): Promise<{
        location: StorageLocation;
        schema: SchemaInference;
        version: string;
        size: number;
    }>;
    retrieveData(datasetName: string, options: {
        version?: string;
        format?: DataFormat;
        filter?: Record<string, any>;
        partition?: string;
        tenantId: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: any;
        schema: SchemaInference;
        version: string;
        metadata: Record<string, any>;
    }>;
    createBranch(datasetName: string, branchName: string, fromVersion: string, tenantId: string, metadata?: Record<string, any>): Promise<string>;
    queryData(query: string, options: {
        tenantId: string;
        format?: DataFormat;
        limit?: number;
        timeout?: number;
    }): Promise<{
        results: any[] | undefined;
        schema: any;
        executionTime: number;
        scannedBytes: number;
    }>;
    getCatalog(options?: {
        tenantId?: string;
        search?: string;
        format?: DataFormat;
        tags?: string[];
        limit?: number;
        offset?: number;
    }): Promise<{
        datasets: DataCatalogEntry[];
        total: number;
        schemas: SchemaInference[];
    }>;
    getDataLineage(datasetName: string, tenantId: string): Promise<DataLineage>;
    optimize(options?: {
        compaction?: boolean;
        indexing?: boolean;
        cleanup?: boolean;
        replication?: boolean;
    }): Promise<{
        compactedDatasets: number;
        indexesCreated: number;
        cleanedFiles: number;
        replicationUpdated: number;
    }>;
    getStatistics(): Promise<{
        totalSize: number;
        totalDatasets: number;
        totalVersions: number;
        formatDistribution: Record<DataFormat, number>;
        compressionSavings: number;
        replicationStatus: Record<string, any>;
        qualityScore: number;
        usage: {
            reads: number;
            writes: number;
            queries: number;
        };
    }>;
    getHealthStatus(): Promise<{
        healthy: boolean;
        components: Record<string, {
            healthy: boolean;
            details?: any;
        }>;
        metrics: Record<string, number>;
    }>;
    private registerDataset;
    private getDataset;
    private generateStorageLocation;
    private loadExistingDatasets;
    private loadSchemas;
    private parseQuery;
    private executeQuery;
    private performCompaction;
    private createOptimalIndexes;
    private cleanupOldVersions;
    private updateReplication;
    private startBackgroundTasks;
    private performQualityScans;
    private updateMetadataIndexes;
    private performMaintenanceTasks;
    private convertStorageLocationToObjectStorageConfig;
    private setupEventHandlers;
    private convertToStorageFormat;
    private convertRecommendationToScheme;
}
//# sourceMappingURL=data-lake-manager.d.ts.map