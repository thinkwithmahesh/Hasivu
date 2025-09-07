/// <reference types="node" />
/// <reference types="node" />
export interface S3UploadOptions {
    contentType?: string;
    maxFileSize?: number;
    allowedTypes?: string[];
    metadata?: Record<string, string>;
    tags?: Record<string, string>;
    cacheControl?: string;
    acl?: 'private' | 'public-read' | 'public-read-write';
    serverSideEncryption?: 'AES256' | 'aws:kms';
    kmsKeyId?: string;
    storageClass?: 'STANDARD' | 'STANDARD_IA' | 'ONEZONE_IA' | 'GLACIER' | 'DEEP_ARCHIVE';
}
export interface S3UploadResult {
    key: string;
    bucket: string;
    location: string;
    etag: string;
    versionId?: string;
    size: number;
    contentType: string;
    timestamp: number;
    metadata?: Record<string, string>;
}
export interface S3DownloadOptions {
    range?: string;
    versionId?: string;
    responseContentType?: string;
    responseContentDisposition?: string;
    responseContentEncoding?: string;
    responseExpires?: Date;
    responseCacheControl?: string;
}
export interface S3FileInfo {
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
    contentType: string;
    metadata?: Record<string, string>;
    storageClass: string;
    versionId?: string;
}
export interface PresignedUrlOptions {
    expiresIn?: number;
    responseContentType?: string;
    responseContentDisposition?: string;
    conditions?: Array<any>;
}
export interface MultipartUploadInfo {
    uploadId: string;
    key: string;
    bucket: string;
    parts: MultipartPart[];
    maxPartSize: number;
    minPartSize: number;
}
export interface MultipartPart {
    partNumber: number;
    etag: string;
    size: number;
}
export interface Base64ImageData {
    data: string;
    mimeType: string;
    filename?: string;
}
export declare class S3ServiceError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly key?: string;
    constructor(message: string, code?: string, statusCode?: number, key?: string);
}
export declare class S3Service {
    private static instance;
    private readonly client;
    private readonly bucketName;
    private readonly region;
    private readonly baseUrl;
    private readonly defaultUploadOptions;
    private readonly multipartThreshold;
    private readonly partSize;
    private constructor();
    static getInstance(): S3Service;
    private generateFileKey;
    private validateUpload;
    uploadFile(category: string, entityId: string, filename: string, buffer: Buffer, options?: S3UploadOptions, userId?: string): Promise<S3UploadResult>;
    uploadBase64Image(category: string, entityId: string, imageData: Base64ImageData, options?: S3UploadOptions, userId?: string): Promise<S3UploadResult>;
    private multipartUpload;
    downloadFile(key: string, options?: S3DownloadOptions): Promise<Buffer>;
    generateUploadUrl(category: string, entityId: string, filename: string, options?: PresignedUrlOptions, userId?: string): Promise<{
        uploadUrl: string;
        key: string;
        fields?: Record<string, string>;
    }>;
    generateDownloadUrl(key: string, options?: PresignedUrlOptions): Promise<string>;
    deleteFile(key: string, versionId?: string): Promise<void>;
    fileExists(key: string, versionId?: string): Promise<boolean>;
    getFileInfo(key: string, versionId?: string): Promise<S3FileInfo>;
    listFiles(prefix: string, maxKeys?: number): Promise<S3FileInfo[]>;
    copyFile(sourceKey: string, destinationKey: string, options?: S3UploadOptions): Promise<S3UploadResult>;
    uploadDeliveryPhoto(orderId: string, imageBuffer: Buffer, filename: string, userId?: string): Promise<S3UploadResult>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        timestamp: number;
        bucketAccessible: boolean;
        error?: string;
    }>;
    getServiceInfo(): {
        bucket: string;
        region: string;
        baseUrl: string;
        multipartThreshold: number;
        partSize: number;
        defaultMaxFileSize: number;
    };
}
export declare const s3Service: S3Service;
//# sourceMappingURL=s3.service.d.ts.map