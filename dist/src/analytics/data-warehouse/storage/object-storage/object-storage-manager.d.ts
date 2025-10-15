/// <reference types="node" />
/// <reference types="node" />
import { StorageFormat, CompressionFormat } from '../../types/data-lake-types';
export interface ObjectMetadata {
    id: string;
    key: string;
    size: number;
    lastModified: Date;
    contentType: string;
    etag: string;
    metadata: Record<string, string>;
    format?: StorageFormat;
    compression?: CompressionFormat;
    tenantId?: string;
    datasetId?: string;
    version?: number;
    createdAt?: Date;
    checksum?: string;
}
export interface StorageOperationResult {
    success: boolean;
    key: string;
    size: number;
    etag: string;
    versionId?: string;
    executionTime: number;
    metadata?: any;
    data?: any[] | undefined;
    checksum?: string;
}
export interface ObjectStorageConfig {
    provider: 'aws' | 'gcp' | 'azure' | 'minio';
    endpoint?: string;
    region?: string;
    credentials: {
        accessKey?: string;
        secretKey?: string;
        token?: string;
    };
    bucket: string;
    encryption?: {
        enabled: boolean;
        algorithm?: 'AES256' | 'aws:kms' | 'SSE-C';
        keyId?: string;
    };
}
export interface StorageMetrics {
    totalSize: number;
    objectCount: number;
    storageUtilization: number;
    compressionRatio: number;
    accessFrequency: Record<string, number>;
    storageClasses: Record<string, number>;
}
export declare class ObjectStorageManager {
    private config;
    private client;
    private cache;
    constructor(config: ObjectStorageConfig);
    initialize(): Promise<void>;
    putObject(key: string, data: Buffer | string, metadata: ObjectMetadata): Promise<StorageOperationResult>;
    getObject(key: string, version?: string): Promise<Buffer>;
    store(data: any, metadata: ObjectMetadata, options?: any): Promise<StorageOperationResult>;
    retrieve(key: string, options?: any): Promise<Buffer>;
    private generateObjectKey;
    private getFileExtension;
    deleteObject(key: string, version?: string): Promise<void>;
    listObjects(prefix?: string, delimiter?: string): Promise<string[]>;
    getObjectMetadata(key: string, version?: string): Promise<ObjectMetadata>;
    copyObject(sourceKey: string, destinationKey: string, metadata?: Partial<ObjectMetadata>): Promise<void>;
    getStorageMetrics(): Promise<StorageMetrics>;
    optimizeStorage(): Promise<void>;
    private initializeClient;
    private testConnection;
    private configureBucket;
    private configureLifecyclePolicies;
    private applyCompression;
    private applyDecompression;
    private gzipCompress;
    private gzipDecompress;
    private lz4Compress;
    private lz4Decompress;
    private snappyCompress;
    private snappyDecompress;
    private brotliCompress;
    private brotliDecompress;
    private calculateChecksum;
    private uploadToStorage;
    private downloadFromStorage;
    private deleteFromStorage;
    private listFromStorage;
    private getMetadataFromStorage;
    private copyInStorage;
    private transitionStorageClass;
    getStatistics(): Promise<StorageMetrics>;
    shutdown(): Promise<void>;
}
export default ObjectStorageManager;
//# sourceMappingURL=object-storage-manager.d.ts.map