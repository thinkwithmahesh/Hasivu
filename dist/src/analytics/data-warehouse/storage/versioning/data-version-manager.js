"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataVersionManager = void 0;
const logger_1 = require("../../../../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
class DataVersionManager {
    config;
    versions = new Map();
    lineage = new Map();
    constructor(config = {}) {
        this.config = {
            enableAutoVersioning: true,
            retentionPolicy: {
                maxVersions: 100,
                maxAge: 365
            },
            compressionStrategy: 'delta',
            checksumAlgorithm: 'sha256',
            ...config
        };
        logger_1.logger.info('DataVersionManager initialized', {
            enableAutoVersioning: this.config.enableAutoVersioning,
            compressionStrategy: this.config.compressionStrategy
        });
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing Data Version Manager');
            logger_1.logger.info('Data Version Manager initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Data Version Manager', { error });
            throw new Error(`Data Version Manager initialization failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async createVersion(datasetId, data, metadata = {}) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Creating new data version', {
                datasetId,
                recordCount: data?.length || 0
            });
            const existingVersions = this.versions.get(datasetId) || [];
            const versionNumber = existingVersions.length + 1;
            const checksum = await this.calculateChecksum(data);
            if (existingVersions.length > 0) {
                const latestVersion = existingVersions[existingVersions.length - 1];
                if (latestVersion.checksum === checksum) {
                    logger_1.logger.info('No changes detected, skipping version creation', {
                        datasetId,
                        latestChecksum: latestVersion.checksum
                    });
                    return latestVersion;
                }
            }
            const version = {
                id: `${datasetId}_v${versionNumber}`,
                datasetId,
                version: versionNumber.toString(),
                major: versionNumber,
                minor: 0,
                patch: 0,
                hash: checksum,
                checksum,
                size: this.calculateDataSize(data),
                timestamp: new Date(),
                createdAt: new Date(),
                createdBy: metadata.createdBy || 'system',
                author: metadata.createdBy || 'system',
                message: metadata.description || `Version ${versionNumber}`,
                changes: existingVersions.length > 0
                    ? await this.calculateChanges(existingVersions[existingVersions.length - 1], data)
                    : [],
                compatible: true,
                deprecated: false,
                metadata: {
                    description: metadata.description,
                    tags: metadata.tags || [],
                    source: metadata.source || 'unknown',
                    transformations: metadata.transformations || [],
                    ...metadata
                },
                location: {
                    type: 'local',
                    path: `/data/versions/${datasetId}/${versionNumber}`
                },
                schema: `${datasetId}_schema`
            };
            await this.storeVersionData(version, data);
            existingVersions.push(version);
            this.versions.set(datasetId, existingVersions);
            await this.updateLineage(datasetId, version);
            await this.applyRetentionPolicy(datasetId);
            const executionTime = Date.now() - startTime;
            logger_1.logger.info('Data version created successfully', {
                datasetId,
                version: versionNumber,
                checksum: checksum.substring(0, 8),
                executionTime
            });
            return version;
        }
        catch (error) {
            logger_1.logger.error('Failed to create data version', { datasetId, error });
            throw new Error(`Version creation failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getVersion(datasetId, version) {
        try {
            const versions = this.versions.get(datasetId);
            if (!versions || versions.length === 0) {
                return null;
            }
            if (version === undefined) {
                return versions[versions.length - 1];
            }
            const targetVersion = versions.find(v => v.version === version?.toString());
            return targetVersion || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get version', { datasetId, version, error });
            throw new Error(`Version retrieval failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async listVersions(datasetId) {
        try {
            return this.versions.get(datasetId) || [];
        }
        catch (error) {
            logger_1.logger.error('Failed to list versions', { datasetId, error });
            throw new Error(`Version listing failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async deleteVersion(datasetId, version) {
        try {
            logger_1.logger.info('Deleting data version', { datasetId, version });
            const versions = this.versions.get(datasetId);
            if (!versions) {
                throw new Error(`Dataset not found: ${datasetId}`);
            }
            const versionIndex = versions.findIndex(v => v.version === version.toString());
            if (versionIndex === -1) {
                throw new Error(`Version ${version} not found for dataset ${datasetId}`);
            }
            await this.deleteVersionData(versions[versionIndex]);
            versions.splice(versionIndex, 1);
            this.versions.set(datasetId, versions);
            logger_1.logger.info('Data version deleted successfully', { datasetId, version });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete version', { datasetId, version, error });
            throw new Error(`Version deletion failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async compareVersions(datasetId, fromVersion, toVersion) {
        try {
            logger_1.logger.debug('Comparing data versions', {
                datasetId,
                fromVersion,
                toVersion
            });
            const fromData = await this.getVersionData(datasetId, fromVersion);
            const toData = await this.getVersionData(datasetId, toVersion);
            if (!fromData || !toData) {
                throw new Error('One or both versions not found');
            }
            const diff = this.calculateDiff(fromData, toData);
            logger_1.logger.debug('Version comparison completed', {
                datasetId,
                totalChanges: diff.summary.totalChanges
            });
            return diff;
        }
        catch (error) {
            logger_1.logger.error('Failed to compare versions', {
                datasetId,
                fromVersion,
                toVersion,
                error
            });
            throw new Error(`Version comparison failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getLineage(datasetId) {
        try {
            return this.lineage.get(datasetId) || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get lineage', { datasetId, error });
            throw new Error(`Lineage retrieval failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async queryAtTimestamp(datasetId, timestamp) {
        try {
            const versions = this.versions.get(datasetId);
            if (!versions || versions.length === 0) {
                return null;
            }
            const applicableVersions = versions.filter(v => v.createdAt <= timestamp);
            if (applicableVersions.length === 0) {
                return null;
            }
            return applicableVersions[applicableVersions.length - 1];
        }
        catch (error) {
            logger_1.logger.error('Failed to query at timestamp', { datasetId, timestamp, error });
            throw new Error(`Timestamp query failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async restoreVersion(datasetId, version) {
        try {
            logger_1.logger.info('Restoring data version', { datasetId, version });
            const targetVersion = await this.getVersion(datasetId, version);
            if (!targetVersion) {
                throw new Error(`Version ${version} not found for dataset ${datasetId}`);
            }
            const versionData = await this.getVersionData(datasetId, version);
            if (!versionData) {
                throw new Error(`Version data not found for ${datasetId} v${version}`);
            }
            const restoredVersion = await this.createVersion(datasetId, versionData, {
                description: `Restored from version ${version}`,
                source: 'restore_operation',
                restoredFrom: targetVersion.id
            });
            logger_1.logger.info('Data version restored successfully', {
                datasetId,
                originalVersion: version,
                newVersion: restoredVersion.version
            });
            return restoredVersion;
        }
        catch (error) {
            logger_1.logger.error('Failed to restore version', { datasetId, version, error });
            throw new Error(`Version restore failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async tagVersion(datasetId, version, tag, description) {
        try {
            const versions = this.versions.get(datasetId);
            if (!versions) {
                throw new Error(`Dataset not found: ${datasetId}`);
            }
            const targetVersion = versions.find(v => v.version === version?.toString());
            if (!targetVersion) {
                throw new Error(`Version ${version} not found`);
            }
            if (!targetVersion.metadata) {
                targetVersion.metadata = {};
            }
            if (!targetVersion.metadata.tags) {
                targetVersion.metadata.tags = [];
            }
            const tagEntry = description ? `${tag}:${description}` : tag;
            if (!targetVersion.metadata.tags.includes(tagEntry)) {
                targetVersion.metadata.tags.push(tagEntry);
            }
            logger_1.logger.info('Version tagged successfully', {
                datasetId,
                version,
                tag
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to tag version', { datasetId, version, tag, error });
            throw new Error(`Version tagging failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async calculateChecksum(data) {
        const dataString = JSON.stringify(data);
        return crypto_1.default
            .createHash(this.config.checksumAlgorithm)
            .update(dataString)
            .digest('hex');
    }
    calculateDataSize(data) {
        return Buffer.byteLength(JSON.stringify(data), 'utf8');
    }
    async calculateChanges(previousVersion, newData) {
        const previousData = await this.getVersionData(previousVersion.datasetId, parseInt(previousVersion.version));
        if (!previousData) {
            return {
                type: 'full_replace',
                recordsAdded: newData?.length || 0,
                recordsRemoved: 0,
                recordsModified: 0
            };
        }
        const diff = this.calculateDiff(previousData, newData);
        return {
            type: 'delta',
            recordsAdded: diff.summary.addedCount,
            recordsRemoved: diff.summary.deletedCount,
            recordsModified: diff.summary.modifiedCount,
            totalChanges: diff.summary.totalChanges
        };
    }
    calculateDiff(oldData, newData) {
        const added = [];
        const modified = [];
        const deleted = [];
        const oldMap = new Map((oldData || []).map((item, index) => [this.getRecordId(item, index), item]));
        const newMap = new Map((newData || []).map((item, index) => [this.getRecordId(item, index), item]));
        newMap.forEach((newRecord, id) => {
            const oldRecord = oldMap.get(id);
            if (!oldRecord) {
                added.push(newRecord);
            }
            else if (JSON.stringify(oldRecord) !== JSON.stringify(newRecord)) {
                modified.push({ old: oldRecord, new: newRecord });
            }
        });
        oldMap.forEach((oldRecord, id) => {
            if (!newMap.has(id)) {
                deleted.push(oldRecord);
            }
        });
        return {
            added,
            modified,
            deleted,
            summary: {
                totalChanges: added.length + modified.length + deleted.length,
                addedCount: added.length,
                modifiedCount: modified.length,
                deletedCount: deleted.length
            }
        };
    }
    getRecordId(record, fallbackIndex) {
        return record.id || record._id || record.uuid || String(fallbackIndex);
    }
    async storeVersionData(version, data) {
        logger_1.logger.debug('Storing version data', {
            versionId: version.id,
            dataSize: version.size
        });
    }
    async getVersionData(datasetId, version) {
        return [{ id: 1, data: 'mock_data' }];
    }
    async deleteVersionData(version) {
        logger_1.logger.debug('Deleting version data', { versionId: version.id });
    }
    async updateLineage(datasetId, version) {
        const existingLineage = this.lineage.get(datasetId);
        const lineage = {
            datasetId,
            source: `${datasetId}:${version.version}`,
            upstream: existingLineage?.upstream || [],
            downstream: existingLineage?.downstream || [],
            transformations: version.metadata?.transformations || [],
            dependencies: existingLineage?.dependencies || [],
            impact: existingLineage?.impact || {
                upstreamCount: 0,
                downstreamCount: 0,
                criticalityScore: 0,
                businessImpact: 'low',
                affectedSystems: [],
                affectedUsers: [],
                affectedDatasets: [],
                estimatedRecords: 0,
                recoveryTime: 0
            }
        };
        this.lineage.set(datasetId, lineage);
    }
    async applyRetentionPolicy(datasetId) {
        const versions = this.versions.get(datasetId);
        if (!versions)
            return;
        const { maxVersions, maxAge } = this.config.retentionPolicy;
        const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
        const versionsToKeep = versions
            .filter(v => v.createdAt > cutoffDate)
            .slice(-maxVersions);
        const versionsToDelete = versions.filter(v => !versionsToKeep.includes(v));
        for (const version of versionsToDelete) {
            try {
                await this.deleteVersionData(version);
                logger_1.logger.debug('Version cleaned up by retention policy', {
                    datasetId,
                    version: version.version
                });
            }
            catch (error) {
                logger_1.logger.warn('Failed to clean up version', {
                    datasetId,
                    version: version.version,
                    error
                });
            }
        }
        this.versions.set(datasetId, versionsToKeep);
    }
    async getVersionStats(datasetId) {
        const versions = this.versions.get(datasetId) || [];
        if (versions.length === 0) {
            return {
                totalVersions: 0,
                totalSize: 0,
                oldestVersion: new Date(),
                newestVersion: new Date(),
                averageVersionSize: 0
            };
        }
        const totalSize = versions.reduce((sum, v) => sum + v.size, 0);
        const dates = versions.map(v => v.createdAt);
        return {
            totalVersions: versions.length,
            totalSize,
            oldestVersion: new Date(Math.min(...dates.map(d => d.getTime()))),
            newestVersion: new Date(Math.max(...dates.map(d => d.getTime()))),
            averageVersionSize: totalSize / versions.length
        };
    }
    async getCurrentVersion(datasetId) {
        try {
            logger_1.logger.debug('Getting current version', { datasetId });
            const versions = this.versions.get(datasetId);
            if (!versions || versions.length === 0) {
                return null;
            }
            const currentVersion = versions[versions.length - 1];
            logger_1.logger.debug('Current version retrieved', {
                datasetId,
                version: currentVersion.version
            });
            return currentVersion;
        }
        catch (error) {
            logger_1.logger.error('Failed to get current version', { datasetId, error });
            throw new Error(`Current version retrieval failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async createBranch(datasetId, branchName, sourceVersion) {
        try {
            logger_1.logger.info('Creating version branch', { datasetId, branchName, sourceVersion });
            const sourceVersionData = sourceVersion
                ? await this.getVersion(datasetId, sourceVersion)
                : await this.getCurrentVersion(datasetId);
            if (!sourceVersionData) {
                throw new Error(`Source version not found for dataset: ${datasetId}`);
            }
            const branchId = `${datasetId}_branch_${branchName}`;
            const branchVersion = {
                ...sourceVersionData,
                id: `${branchId}_v1`,
                version: '1',
                createdAt: new Date(),
                metadata: {
                    ...sourceVersionData.metadata,
                    branch: branchName,
                    sourceVersion: sourceVersionData.version,
                    branchCreatedAt: new Date().toISOString()
                }
            };
            const existingBranchVersions = this.versions.get(branchId) || [];
            existingBranchVersions.push(branchVersion);
            this.versions.set(branchId, existingBranchVersions);
            logger_1.logger.info('Version branch created successfully', {
                datasetId,
                branchName,
                branchId,
                sourceVersion: sourceVersionData.version
            });
            return branchId;
        }
        catch (error) {
            logger_1.logger.error('Failed to create version branch', { datasetId, branchName, error });
            throw new Error(`Branch creation failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Data Version Manager');
        this.versions.clear();
        this.lineage.clear();
        logger_1.logger.info('Data Version Manager shutdown complete');
    }
}
exports.DataVersionManager = DataVersionManager;
exports.default = DataVersionManager;
//# sourceMappingURL=data-version-manager.js.map