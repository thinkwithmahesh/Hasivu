"use strict";
/**
 * HASIVU Platform - AWS S3 Service
 * Production-ready S3 integration with multipart upload support and comprehensive file management
 * Handles uploads, downloads, presigned URLs, and file operations for the HASIVU platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = exports.S3ServiceError = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const crypto_1 = require("crypto");
const path_1 = require("path");
// import { LoggerService } from '../logger.service';  // Logger import temporarily unavailable
const logger = {
    info: (message, data) => console.log(message, data),
    warn: (message, data) => console.warn(message, data),
    error: (message, data) => console.error(message, data),
    debug: (message, data) => console.debug(message, data)
};
const environment_1 = require("../../config/environment");
/**
 * S3 Service Error
 */
class S3ServiceError extends Error {
    code;
    statusCode;
    key;
    constructor(message, code = 'S3_ERROR', statusCode = 500, key) {
        super(message);
        this.name = 'S3ServiceError';
        this.code = code;
        this.statusCode = statusCode;
        this.key = key;
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, S3ServiceError.prototype);
    }
}
exports.S3ServiceError = S3ServiceError;
/**
 * AWS S3 Service
 * Singleton service for handling all S3 file operations
 */
class S3Service {
    static instance;
    client;
    bucketName;
    region;
    baseUrl;
    // Default configuration
    defaultUploadOptions = {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'text/csv',
            'application/json'
        ],
        cacheControl: 'public, max-age=31536000', // 1 year
        acl: 'private',
        serverSideEncryption: 'AES256',
        storageClass: 'STANDARD'
    };
    multipartThreshold = 100 * 1024 * 1024; // 100MB
    partSize = 10 * 1024 * 1024; // 10MB per part
    constructor() {
        this.bucketName = environment_1.config.aws.s3?.bucketName || environment_1.config.aws.s3Bucket;
        this.region = environment_1.config.aws.region;
        this.baseUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
        this.client = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: environment_1.config.aws.accessKeyId,
                secretAccessKey: environment_1.config.aws.secretAccessKey
            }
        });
        logger.info('S3Service initialized', {
            bucket: this.bucketName,
            region: this.region,
            baseUrl: this.baseUrl
        });
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!S3Service.instance) {
            S3Service.instance = new S3Service();
        }
        return S3Service.instance;
    }
    /**
     * Generate a secure file key with proper folder structure
     */
    generateFileKey(category, entityId, filename, userId) {
        const timestamp = Date.now();
        const randomId = crypto_1.default.randomBytes(8).toString('hex');
        const extension = path_1.default.extname(filename);
        const baseName = path_1.default.basename(filename, extension);
        const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const sanitizedFilename = `${sanitizedBaseName}${extension}`;
        let key = `${category}/${entityId}`;
        if (userId) {
            key += `/${userId}`;
        }
        key += `/${timestamp}_${randomId}_${sanitizedFilename}`;
        return key;
    }
    /**
     * Validate upload options and file
     */
    validateUpload(buffer, options) {
        // Check file size
        if (options.maxFileSize && buffer.length > options.maxFileSize) {
            throw new S3ServiceError(`File size ${buffer.length} bytes exceeds maximum allowed size ${options.maxFileSize} bytes`, 'FILE_TOO_LARGE', 413);
        }
        // Check content type
        if (options.allowedTypes && options.contentType && !options.allowedTypes.includes(options.contentType)) {
            throw new S3ServiceError(`File type ${options.contentType} not allowed. Allowed types: ${options.allowedTypes.join(', ')}`, 'INVALID_FILE_TYPE', 400);
        }
    }
    /**
     * Upload file to S3
     */
    async uploadFile(category, entityId, filename, buffer, options = {}, userId) {
        const startTime = Date.now();
        try {
            // Merge with defaults
            const uploadOptions = { ...this.defaultUploadOptions, ...options };
            // Validate upload
            this.validateUpload(buffer, uploadOptions);
            // Generate secure key
            const key = this.generateFileKey(category, entityId, filename, userId);
            // Prepare S3 parameters
            const uploadParams = {
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: uploadOptions.contentType || 'application/octet-stream',
                CacheControl: uploadOptions.cacheControl,
                ServerSideEncryption: uploadOptions.serverSideEncryption,
                StorageClass: uploadOptions.storageClass,
                Metadata: uploadOptions.metadata || {}
            };
            // Add KMS key if specified
            if (uploadOptions.serverSideEncryption === 'aws:kms' && uploadOptions.kmsKeyId) {
                uploadParams.SSEKMSKeyId = uploadOptions.kmsKeyId;
            }
            // Add tags if specified
            if (uploadOptions.tags && Object.keys(uploadOptions.tags).length > 0) {
                uploadParams.Tagging = Object.entries(uploadOptions.tags)
                    .map(([k, v]) => `${k}=${v}`)
                    .join('&');
            }
            // Use multipart upload for large files
            if (buffer.length > this.multipartThreshold) {
                return await this.multipartUpload(key, buffer, uploadParams);
            }
            // Single part upload
            const command = new client_s3_1.PutObjectCommand(uploadParams);
            const response = await this.client.send(command);
            const result = {
                key,
                bucket: this.bucketName,
                location: `${this.baseUrl}/${key}`,
                etag: response.ETag || '',
                versionId: response.VersionId,
                size: buffer.length,
                contentType: uploadOptions.contentType || 'application/octet-stream',
                timestamp: Date.now(),
                metadata: uploadOptions.metadata
            };
            const duration = Date.now() - startTime;
            logger.info('File uploaded successfully', {
                key,
                size: buffer.length,
                contentType: uploadOptions.contentType,
                duration: `${duration}ms`
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger.error('S3 upload failed', {
                category,
                entityId,
                filename,
                error: error.message,
                duration: `${duration}ms`
            });
            if (error instanceof S3ServiceError) {
                throw error;
            }
            throw new S3ServiceError(`S3 upload failed: ${error.message}`, 'UPLOAD_FAILED', 500);
        }
    }
    /**
     * Upload base64 image to S3
     */
    async uploadBase64Image(category, entityId, imageData, options = {}, userId) {
        try {
            // Convert base64 to buffer
            const buffer = Buffer.from(imageData.data, 'base64');
            // Determine filename and content type
            const extension = imageData.mimeType.split('/')[1];
            let filename = imageData.filename;
            if (!filename) {
                filename = `image.${extension}`;
            }
            const uploadOptions = {
                ...options,
                contentType: imageData.mimeType
            };
            return await this.uploadFile(category, entityId, filename, buffer, uploadOptions, userId);
        }
        catch (error) {
            logger.error('Base64 image upload failed', {
                category,
                entityId,
                mimeType: imageData.mimeType,
                error: error.message
            });
            if (error instanceof S3ServiceError) {
                throw error;
            }
            throw new S3ServiceError(`Base64 image upload failed: ${error.message}`, 'BASE64_UPLOAD_FAILED', 500);
        }
    }
    /**
     * Multipart upload for large files
     */
    async multipartUpload(key, buffer, params) {
        try {
            const upload = new lib_storage_1.Upload({
                client: this.client,
                params: {
                    ...params,
                    Key: key,
                    Body: buffer
                },
                partSize: this.partSize,
                leavePartsOnError: false
            });
            const result = await upload.done();
            return {
                key,
                bucket: this.bucketName,
                location: `${this.baseUrl}/${key}`,
                etag: result.ETag || '',
                versionId: result.VersionId,
                size: buffer.length,
                contentType: params.ContentType,
                timestamp: Date.now(),
                metadata: params.Metadata
            };
        }
        catch (error) {
            throw new S3ServiceError(`Multipart upload failed: ${error.message}`, 'MULTIPART_UPLOAD_FAILED', 500, key);
        }
    }
    /**
     * Download file from S3
     */
    async downloadFile(key, options = {}) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Range: options.range,
                VersionId: options.versionId,
                ResponseContentType: options.responseContentType,
                ResponseContentDisposition: options.responseContentDisposition,
                ResponseContentEncoding: options.responseContentEncoding,
                ResponseExpires: options.responseExpires,
                ResponseCacheControl: options.responseCacheControl
            });
            const response = await this.client.send(command);
            if (!response.Body) {
                throw new S3ServiceError(`File not found: ${key}`, 'FILE_NOT_FOUND', 404, key);
            }
            // Convert stream to buffer
            const chunks = [];
            const stream = response.Body;
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            logger.info('File downloaded successfully', {
                key,
                size: buffer.length,
                contentType: response.ContentType
            });
            return buffer;
        }
        catch (error) {
            logger.error('S3 download failed', {
                key,
                error: error.message
            });
            if (error instanceof S3ServiceError) {
                throw error;
            }
            throw new S3ServiceError(`Failed to download file: ${error.message}`, 'DOWNLOAD_FAILED', 500, key);
        }
    }
    /**
     * Generate presigned URL for file upload
     */
    async generateUploadUrl(category, entityId, filename, options = {}, userId) {
        try {
            const key = this.generateFileKey(category, entityId, filename, userId);
            const expiresIn = options.expiresIn || 3600; // 1 hour default
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                ContentType: options.responseContentType,
                ContentDisposition: options.responseContentDisposition
            });
            const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
            const finalUrl = `${this.baseUrl}/${key}`;
            logger.info('Presigned upload URL generated', {
                key,
                expiresIn,
                finalUrl
            });
            return {
                uploadUrl,
                key,
                fields: {
                    key,
                    'Content-Type': options.responseContentType || '',
                    'Content-Disposition': options.responseContentDisposition || ''
                }
            };
        }
        catch (error) {
            logger.error('Failed to generate presigned URL', {
                category,
                entityId,
                filename,
                error: error.message
            });
            throw new S3ServiceError(`Failed to generate presigned URL: ${error.message}`, 'PRESIGNED_URL_FAILED', 500);
        }
    }
    /**
     * Generate presigned URL for file download
     */
    async generateDownloadUrl(key, options = {}) {
        try {
            const expiresIn = options.expiresIn || 3600; // 1 hour default
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                ResponseContentType: options.responseContentType,
                ResponseContentDisposition: options.responseContentDisposition
            });
            const downloadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
            logger.info('Presigned download URL generated', {
                key,
                expiresIn
            });
            return downloadUrl;
        }
        catch (error) {
            logger.error('Failed to generate presigned download URL', {
                key,
                error: error.message
            });
            throw new S3ServiceError(`Failed to generate presigned download URL: ${error.message}`, 'PRESIGNED_DOWNLOAD_URL_FAILED', 500, key);
        }
    }
    /**
     * Delete file from S3
     */
    async deleteFile(key, versionId) {
        try {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                VersionId: versionId
            });
            await this.client.send(command);
            logger.info('File deleted successfully', {
                key,
                versionId
            });
        }
        catch (error) {
            logger.error('S3 delete failed', {
                key,
                error: error.message
            });
            throw new S3ServiceError(`Failed to delete file: ${error.message}`, 'DELETE_FAILED', 500, key);
        }
    }
    /**
     * Check if file exists
     */
    async fileExists(key, versionId) {
        try {
            const command = new client_s3_1.HeadObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                VersionId: versionId
            });
            await this.client.send(command);
            return true;
        }
        catch (error) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            logger.error('Error checking file existence', {
                key,
                error: error.message
            });
            throw new S3ServiceError(`Error checking file existence: ${error.message}`, 'FILE_CHECK_FAILED', 500, key);
        }
    }
    /**
     * Get file information
     */
    async getFileInfo(key, versionId) {
        try {
            const command = new client_s3_1.HeadObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                VersionId: versionId
            });
            const response = await this.client.send(command);
            return {
                key,
                size: response.ContentLength || 0,
                lastModified: response.LastModified || new Date(),
                etag: response.ETag || '',
                contentType: response.ContentType || 'application/octet-stream',
                metadata: response.Metadata,
                storageClass: response.StorageClass || 'STANDARD',
                versionId: response.VersionId
            };
        }
        catch (error) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                throw new S3ServiceError(`File not found: ${key}`, 'FILE_NOT_FOUND', 404, key);
            }
            logger.error('Failed to get file info', {
                key,
                error: error.message
            });
            throw new S3ServiceError(`Failed to get file info: ${error.message}`, 'FILE_INFO_FAILED', 500, key);
        }
    }
    /**
     * List files with prefix
     */
    async listFiles(prefix, maxKeys = 1000) {
        try {
            const command = new client_s3_1.ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                MaxKeys: maxKeys
            });
            const response = await this.client.send(command);
            if (!response.Contents) {
                return [];
            }
            return response.Contents.map(obj => ({
                key: obj.Key || '',
                size: obj.Size || 0,
                lastModified: obj.LastModified || new Date(),
                etag: obj.ETag || '',
                contentType: 'application/octet-stream',
                storageClass: obj.StorageClass || 'STANDARD'
            }));
        }
        catch (error) {
            logger.error('Failed to list files', {
                prefix,
                error: error.message
            });
            throw new S3ServiceError(`Failed to list files: ${error.message}`, 'LIST_FILES_FAILED', 500);
        }
    }
    /**
     * Copy file within S3
     */
    async copyFile(sourceKey, destinationKey, options = {}) {
        try {
            const command = new client_s3_1.CopyObjectCommand({
                Bucket: this.bucketName,
                CopySource: `${this.bucketName}/${sourceKey}`,
                Key: destinationKey,
                MetadataDirective: 'REPLACE',
                Metadata: options.metadata || {},
                ContentType: options.contentType,
                CacheControl: options.cacheControl,
                ServerSideEncryption: options.serverSideEncryption,
                StorageClass: options.storageClass
            });
            const response = await this.client.send(command);
            // Get file info to return complete result
            const fileInfo = await this.getFileInfo(destinationKey);
            const result = {
                key: destinationKey,
                bucket: this.bucketName,
                location: `${this.baseUrl}/${destinationKey}`,
                etag: response.CopyObjectResult?.ETag || '',
                versionId: response.VersionId,
                size: fileInfo.size,
                contentType: fileInfo.contentType,
                timestamp: Date.now(),
                metadata: options.metadata
            };
            logger.info('File copied successfully', {
                sourceKey,
                destinationKey,
                size: fileInfo.size
            });
            return result;
        }
        catch (error) {
            logger.error('S3 copy failed', {
                sourceKey,
                destinationKey,
                error: error.message
            });
            throw new S3ServiceError(`Failed to copy file: ${error.message}`, 'COPY_FAILED', 500, sourceKey);
        }
    }
    /**
     * Upload delivery photo (specialized method)
     */
    async uploadDeliveryPhoto(orderId, imageBuffer, filename, userId) {
        try {
            const options = {
                contentType: 'image/jpeg',
                maxFileSize: 5 * 1024 * 1024, // 5MB
                allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
                metadata: {
                    orderId,
                    uploadedBy: userId || 'system',
                    uploadedAt: new Date().toISOString()
                },
                tags: {
                    category: 'delivery',
                    orderId,
                    type: 'photo'
                }
            };
            return await this.uploadFile('delivery', orderId, filename, imageBuffer, options, userId);
        }
        catch (error) {
            logger.error('Failed to upload delivery photo', {
                orderId,
                filename,
                error: error.message
            });
            throw new S3ServiceError(`Failed to upload delivery photo: ${error.message}`, 'DELIVERY_PHOTO_UPLOAD_FAILED', 500);
        }
    }
    /**
     * Health check for S3 service
     */
    async healthCheck() {
        try {
            // Try to list objects with limit 1 to test connectivity
            const command = new client_s3_1.ListObjectsV2Command({
                Bucket: this.bucketName,
                MaxKeys: 1
            });
            await this.client.send(command);
            return {
                status: 'healthy',
                timestamp: Date.now(),
                bucketAccessible: true
            };
        }
        catch (error) {
            logger.error('S3 health check failed', {
                bucket: this.bucketName,
                error: error.message
            });
            return {
                status: 'unhealthy',
                timestamp: Date.now(),
                bucketAccessible: false,
                error: error.message
            };
        }
    }
    /**
     * Get service configuration (safe for logging)
     */
    getServiceInfo() {
        return {
            bucket: this.bucketName,
            region: this.region,
            baseUrl: this.baseUrl,
            multipartThreshold: this.multipartThreshold,
            partSize: this.partSize,
            defaultMaxFileSize: this.defaultUploadOptions.maxFileSize || 0
        };
    }
}
exports.S3Service = S3Service;
// Export singleton instance
exports.s3Service = S3Service.getInstance();
