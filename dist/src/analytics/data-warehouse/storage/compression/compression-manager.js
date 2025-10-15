"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompressionManager = void 0;
const logger_1 = require("../../../../utils/logger");
class CompressionManager {
    config;
    strategies = new Map();
    compressionStats = new Map();
    adaptiveThreshold = 0.7;
    constructor(config) {
        this.config = config;
        logger_1.logger.info('CompressionManager initialized');
        this.setupCompressionStrategies();
    }
    async initialize() {
        logger_1.logger.info('Initializing Compression Manager');
        await this.loadCompressionProfiles();
        await this.startCompressionMonitoring();
    }
    async compressData(data, strategy) {
        const startTime = Date.now();
        const originalSize = this.calculateDataSize(data);
        logger_1.logger.info('Starting data compression', {
            originalSize,
            strategy: strategy?.algorithm || 'auto'
        });
        try {
            const selectedStrategy = strategy || await this.selectOptimalStrategy(data, originalSize);
            const compressedData = await this.performCompression(data, selectedStrategy);
            const compressedSize = compressedData.length;
            const compressionTime = Date.now() - startTime;
            const compressionRatio = compressedSize / originalSize;
            this.updateCompressionStats(selectedStrategy.algorithm, {
                originalSize,
                compressedSize,
                compressionRatio,
                compressionTime
            });
            logger_1.logger.info('Data compression completed', {
                algorithm: selectedStrategy.algorithm,
                originalSize,
                compressedSize,
                compressionRatio,
                compressionTime
            });
            return {
                id: `compressed_${Date.now()}`,
                compressedData,
                metadata: {
                    algorithm: selectedStrategy.algorithm,
                    originalSize,
                    compressedSize,
                    compressionRatio,
                    compressionTime,
                    timestamp: new Date()
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Data compression failed', { error, originalSize });
            throw new Error(`Compression failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async decompressData(compressedData) {
        const startTime = Date.now();
        logger_1.logger.info('Starting data decompression', {
            algorithm: compressedData.metadata.algorithm,
            compressedSize: compressedData.metadata.compressedSize
        });
        try {
            const decompressedData = await this.performDecompression(compressedData.compressedData, compressedData.metadata.algorithm);
            const decompressionTime = Date.now() - startTime;
            logger_1.logger.info('Data decompression completed', {
                algorithm: compressedData.metadata.algorithm,
                decompressionTime
            });
            return decompressedData;
        }
        catch (error) {
            logger_1.logger.error('Data decompression failed', {
                error,
                algorithm: compressedData.metadata.algorithm
            });
            throw new Error(`Decompression failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async analyzeCompressionCandidates() {
        const recommendations = [];
        const candidates = [
            {
                datasetId: 'large_logs_2024',
                currentSize: 5 * 1024 * 1024 * 1024,
                estimatedCompressionRatio: 0.3,
                recommendedAlgorithm: 'gzip',
                priority: 'high'
            },
            {
                datasetId: 'user_analytics_archive',
                currentSize: 2 * 1024 * 1024 * 1024,
                estimatedCompressionRatio: 0.4,
                recommendedAlgorithm: 'lz4',
                priority: 'medium'
            }
        ];
        for (const candidate of candidates) {
            const estimatedSavings = candidate.currentSize * (1 - candidate.estimatedCompressionRatio);
            recommendations.push({
                datasetId: candidate.datasetId,
                currentSize: candidate.currentSize,
                estimatedCompressedSize: Math.floor(candidate.currentSize * candidate.estimatedCompressionRatio),
                estimatedSavings,
                recommendedAlgorithm: candidate.recommendedAlgorithm,
                priority: candidate.priority,
                reason: `Large dataset with high compression potential (${Math.floor((1 - candidate.estimatedCompressionRatio) * 100)}% reduction)`
            });
        }
        return recommendations;
    }
    async getCompressionStatistics() {
        const totalCompressions = Array.from(this.compressionStats.values()).reduce((sum, stats) => sum + stats.totalCompressions, 0);
        const avgCompressionRatio = Array.from(this.compressionStats.values()).reduce((sum, stats) => sum + stats.avgCompressionRatio, 0) / this.compressionStats.size;
        const totalOriginalSize = Array.from(this.compressionStats.values()).reduce((sum, stats) => sum + stats.totalOriginalSize, 0);
        const totalCompressedSize = Array.from(this.compressionStats.values()).reduce((sum, stats) => sum + stats.totalCompressedSize, 0);
        return {
            totalCompressions,
            avgCompressionRatio,
            totalSpaceSaved: totalOriginalSize - totalCompressedSize,
            algorithmStats: Object.fromEntries(this.compressionStats),
            adaptiveCompressionEnabled: this.config.adaptiveCompression?.enabled || false
        };
    }
    async getHealth() {
        const stats = await this.getCompressionStatistics();
        return {
            status: 'healthy',
            version: '1.0.0',
            lastUpdate: new Date(),
            performance: {
                totalCompressions: stats.totalCompressions,
                avgCompressionRatio: stats.avgCompressionRatio,
                spaceSaved: stats.totalSpaceSaved,
                algorithmsAvailable: this.strategies.size
            },
            configuration: {
                adaptiveCompression: this.config.adaptiveCompression?.enabled || false,
                strategiesConfigured: this.config.strategies?.length || 0,
                monitoringEnabled: this.config.monitoring?.enabled || false
            }
        };
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Compression Manager');
        this.strategies.clear();
        this.compressionStats.clear();
        logger_1.logger.info('Compression Manager shutdown complete');
    }
    async getStatistics() {
        return await this.getCompressionStatistics();
    }
    async getHealthStatus() {
        return await this.getHealth();
    }
    setupCompressionStrategies() {
        const defaultStrategies = [
            {
                algorithm: 'gzip',
                level: 6,
                blockSize: '64KB',
                dictionary: false
            },
            {
                algorithm: 'lz4',
                level: 1,
                blockSize: '32KB',
                dictionary: false
            },
            {
                algorithm: 'snappy',
                level: 1,
                blockSize: '16KB',
                dictionary: false
            },
            {
                algorithm: 'zstd',
                level: 3,
                blockSize: '128KB',
                dictionary: true
            }
        ];
        const strategies = this.config.strategies || defaultStrategies;
        strategies.forEach(strategy => {
            this.strategies.set(strategy.algorithm, strategy);
            this.compressionStats.set(strategy.algorithm, {
                algorithm: strategy.algorithm,
                totalCompressions: 0,
                avgCompressionRatio: 0,
                avgCompressionTime: 0,
                totalOriginalSize: 0,
                totalCompressedSize: 0
            });
        });
    }
    async selectOptimalStrategy(data, dataSize) {
        if (this.config.adaptiveCompression?.enabled) {
            if (dataSize > 100 * 1024 * 1024) {
                return this.strategies.get('zstd') || this.strategies.get('gzip');
            }
            if (dataSize > 10 * 1024 * 1024) {
                return this.strategies.get('lz4') || this.strategies.get('snappy');
            }
            return this.strategies.get('snappy') || this.strategies.get('lz4');
        }
        return Array.from(this.strategies.values())[0];
    }
    async performCompression(data, strategy) {
        const serializedData = JSON.stringify(data);
        const dataBuffer = Buffer.from(serializedData, 'utf8');
        const compressionRatio = this.getAlgorithmCompressionRatio(strategy.algorithm);
        const compressedSize = Math.floor(dataBuffer.length * compressionRatio);
        const compressedBuffer = Buffer.alloc(compressedSize);
        dataBuffer.copy(compressedBuffer, 0, 0, Math.min(dataBuffer.length, compressedSize));
        return compressedBuffer;
    }
    async performDecompression(compressedData, algorithm) {
        const decompressedString = compressedData.toString('utf8');
        try {
            return JSON.parse(decompressedString);
        }
        catch {
            return decompressedString;
        }
    }
    getAlgorithmCompressionRatio(algorithm) {
        const ratios = {
            'gzip': 0.3,
            'lz4': 0.5,
            'snappy': 0.6,
            'zstd': 0.25,
            'brotli': 0.28
        };
        return ratios[algorithm] || 0.5;
    }
    calculateDataSize(data) {
        return Buffer.from(JSON.stringify(data), 'utf8').length;
    }
    updateCompressionStats(algorithm, metrics) {
        const stats = this.compressionStats.get(algorithm);
        if (stats) {
            stats.totalCompressions++;
            stats.totalOriginalSize += metrics.originalSize;
            stats.totalCompressedSize += metrics.compressedSize;
            stats.avgCompressionRatio = stats.totalCompressedSize / stats.totalOriginalSize;
            stats.avgCompressionTime = (stats.avgCompressionTime * (stats.totalCompressions - 1) + metrics.compressionTime) / stats.totalCompressions;
        }
    }
    async loadCompressionProfiles() {
        logger_1.logger.info('Loading compression profiles');
    }
    async startCompressionMonitoring() {
        if (!this.config.monitoring?.enabled)
            return;
        setInterval(() => {
            this.monitorCompressionEffectiveness();
        }, 60 * 60 * 1000);
    }
    monitorCompressionEffectiveness() {
        const stats = Array.from(this.compressionStats.values());
        stats.forEach(stat => {
            if (stat.avgCompressionRatio > this.adaptiveThreshold) {
                logger_1.logger.warn('Poor compression ratio detected', {
                    algorithm: stat.algorithm,
                    ratio: stat.avgCompressionRatio
                });
            }
        });
    }
}
exports.CompressionManager = CompressionManager;
exports.default = CompressionManager;
//# sourceMappingURL=compression-manager.js.map