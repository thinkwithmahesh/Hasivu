import { DataVersion, DataLineage } from '../../types/data-lake-types';
export interface VersionMetadata {
    createdBy?: string;
    description?: string;
    tags?: string[];
    source?: string;
    transformations?: any[] | undefined;
    [key: string]: any;
}
export interface VersionConfig {
    enableAutoVersioning: boolean;
    retentionPolicy: {
        maxVersions: number;
        maxAge: number;
    };
    compressionStrategy: 'delta' | 'snapshot' | 'hybrid';
    checksumAlgorithm: 'md5' | 'sha256' | 'crc32';
}
export interface VersionDiff {
    added: Record<string, any>[];
    modified: Record<string, any>[];
    deleted: Record<string, any>[];
    summary: {
        totalChanges: number;
        addedCount: number;
        modifiedCount: number;
        deletedCount: number;
    };
}
export declare class DataVersionManager {
    private config;
    private versions;
    private lineage;
    constructor(config?: Partial<VersionConfig>);
    initialize(): Promise<void>;
    createVersion(datasetId: string, data: any[] | undefined, metadata?: Partial<VersionMetadata>): Promise<DataVersion>;
    getVersion(datasetId: string, version?: number): Promise<DataVersion | null>;
    listVersions(datasetId: string): Promise<DataVersion[]>;
    deleteVersion(datasetId: string, version: number): Promise<void>;
    compareVersions(datasetId: string, fromVersion: number, toVersion: number): Promise<VersionDiff>;
    getLineage(datasetId: string): Promise<DataLineage | null>;
    queryAtTimestamp(datasetId: string, timestamp: Date): Promise<DataVersion | null>;
    restoreVersion(datasetId: string, version: number): Promise<DataVersion>;
    tagVersion(datasetId: string, version: number, tag: string, description?: string): Promise<void>;
    private calculateChecksum;
    private calculateDataSize;
    private calculateChanges;
    private calculateDiff;
    private getRecordId;
    private storeVersionData;
    private getVersionData;
    private deleteVersionData;
    private updateLineage;
    private applyRetentionPolicy;
    getVersionStats(datasetId: string): Promise<{
        totalVersions: number;
        totalSize: number;
        oldestVersion: Date;
        newestVersion: Date;
        averageVersionSize: number;
    }>;
    getCurrentVersion(datasetId: string): Promise<DataVersion | null>;
    createBranch(datasetId: string, branchName: string, sourceVersion?: number): Promise<string>;
    shutdown(): Promise<void>;
}
export default DataVersionManager;
//# sourceMappingURL=data-version-manager.d.ts.map