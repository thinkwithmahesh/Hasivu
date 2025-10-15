import { DataLakeDataset, DataLineage } from '../../types/data-lake-types';
export interface IndexConfig {
    indexingEnabled: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
    maxIndexSize: number;
    searchFields: string[];
}
export interface MetadataIndex {
    datasetId: string;
    fields: Record<string, any>;
    searchTerms: string[];
    lastIndexed: Date;
    indexVersion: number;
}
export interface SearchResult {
    datasetId: string;
    title: string;
    description: string;
    tags: string[];
    score: number;
    lastModified: Date;
    size: number;
    format: string;
}
export interface IndexStats {
    totalDocuments: number;
    indexSize: number;
    lastUpdated: Date;
    searchLatency: number;
    updateLatency: number;
}
export interface SearchOptions {
    limit?: number;
    offset?: number;
    filters?: {
        format?: string[];
        tags?: string[];
        dateRange?: {
            start: Date;
            end: Date;
        };
        sizeRange?: {
            min: number;
            max: number;
        };
    };
    sortBy?: 'relevance' | 'date' | 'size' | 'name';
    sortOrder?: 'asc' | 'desc';
}
export declare class MetadataIndexer {
    private indexes;
    private config;
    private searchIndex;
    private lineageIndex;
    constructor(config?: Partial<IndexConfig>);
    indexDataset(dataset: DataLakeDataset): Promise<void>;
    searchDatasets(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    getRelatedDatasets(datasetId: string, limit?: number): Promise<SearchResult[]>;
    updateIndex(datasetId: string, dataset: DataLakeDataset): Promise<void>;
    removeFromIndex(datasetId: string): Promise<void>;
    refreshIndex(): Promise<void>;
    getIndexStatistics(): Promise<IndexStats>;
    getDatasetLineage(datasetId: string): Promise<DataLineage[]>;
    private createSearchDocument;
    private createSearchableContent;
    private extractIndexFields;
    private generateSearchTerms;
    private tokenizeQuery;
    private tokenizeText;
    private calculateRelevanceScore;
    private calculateSimilarity;
    private extractSchemaFields;
    private matchesFilters;
    private sortResults;
    private updateLineageIndex;
    private cleanupStaleEntries;
    private updateIndexStatistics;
    private estimateIndexSize;
    private calculateAverageSearchLatency;
    private calculateAverageUpdateLatency;
    private startAutoRefresh;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
}
export default MetadataIndexer;
//# sourceMappingURL=metadata-indexer.d.ts.map