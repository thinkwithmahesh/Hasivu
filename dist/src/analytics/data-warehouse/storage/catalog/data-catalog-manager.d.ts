import { DataLakeDataset, StorageFormat, DataLineage } from '../../types/data-lake-types';
export interface CatalogEntry {
    id: string;
    dataset: DataLakeDataset;
    discoverable: boolean;
    tags: string[];
    owner: string;
    steward?: string;
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    lastCrawled: Date;
    popularity: number;
    qualityScore: number;
    governancePolicies: string[];
    name: string;
    description: string;
    schema?: any;
    format: StorageFormat;
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt?: Date;
    version: string;
    lineage?: DataLineage;
    size: number;
}
export interface CatalogSearchFilter {
    query?: string;
    tags?: string[];
    owner?: string;
    classification?: string[];
    format?: StorageFormat[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    qualityThreshold?: number;
}
export interface CatalogStats {
    totalDatasets: number;
    totalSize: number;
    formatDistribution: Record<StorageFormat, number>;
    classificationDistribution: Record<string, number>;
    popularDatasets: CatalogEntry[];
    recentDatasets: CatalogEntry[];
    qualityDistribution: {
        high: number;
        medium: number;
        low: number;
    };
}
export declare class DataCatalogManager {
    private catalog;
    private searchIndex;
    private tagIndex;
    constructor();
    initialize(): Promise<void>;
    registerDataset(dataset: DataLakeDataset, metadata: {
        owner: string;
        steward?: string;
        classification?: 'public' | 'internal' | 'confidential' | 'restricted';
        tags?: string[];
        discoverable?: boolean;
    }): Promise<CatalogEntry>;
    updateDataset(datasetId: string, updates: Partial<CatalogEntry>): Promise<CatalogEntry>;
    removeDataset(datasetId: string): Promise<void>;
    searchDatasets(filter: CatalogSearchFilter): Promise<CatalogEntry[]>;
    getDataset(datasetId: string): Promise<CatalogEntry | null>;
    getRelatedDatasets(datasetId: string, limit?: number): Promise<CatalogEntry[]>;
    getDatasetLineage(datasetId: string): Promise<{
        upstream: CatalogEntry[];
        downstream: CatalogEntry[];
    }>;
    getCatalogStats(): Promise<CatalogStats>;
    tagDataset(datasetId: string, tags: string[]): Promise<void>;
    getTagSuggestions(datasetId: string): Promise<string[]>;
    private loadCatalog;
    private buildSearchIndexes;
    private updateSearchIndexes;
    private updateSearchIndexesSync;
    private removeFromSearchIndexes;
    private calculateQualityScore;
    private calculateSimilarity;
    private applyGovernancePolicies;
    private startBackgroundTasks;
    private updateQualityScores;
    private optimizeIndexes;
    search(query: string, filters?: {
        tags?: string[];
        format?: string;
        createdAfter?: Date;
        createdBefore?: Date;
    }): Promise<CatalogEntry[]>;
    getLineage(datasetId: string): Promise<DataLineage | null>;
    getStatistics(): Promise<{
        totalDatasets: number;
        totalSize: number;
        formatDistribution: Record<string, number>;
        tagDistribution: Record<string, number>;
        averageDatasetSize: number;
        recentActivity: {
            created: number;
            updated: number;
            accessed: number;
        };
    }>;
    private calculateRelevanceScore;
    private findDependencies;
    shutdown(): Promise<void>;
}
export default DataCatalogManager;
//# sourceMappingURL=data-catalog-manager.d.ts.map