"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartitionManager = void 0;
const logger_1 = require("../../../../utils/logger");
class PartitionManager {
    config;
    partitionCache = new Map();
    constructor(config = {}) {
        this.config = {
            maxPartitionSize: 1024 * 1024 * 1024,
            maxPartitionsPerLevel: 1000,
            pruningEnabled: true,
            compactionEnabled: true,
            autoOptimization: true,
            ...config
        };
        logger_1.logger.info('PartitionManager initialized', {
            maxPartitionSize: this.config.maxPartitionSize,
            autoOptimization: this.config.autoOptimization
        });
    }
    async createPartitionScheme(datasetId, data, strategy, columns) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Creating partition scheme', {
                datasetId,
                strategy,
                columns,
                recordCount: data?.length || 0
            });
            const analysis = this.analyzeDataDistribution(data, columns);
            const partitionStrategy = {
                strategy,
                columns,
                buckets: this.calculateOptimalBuckets(analysis, strategy),
                pruning: this.config.pruningEnabled,
                compaction: {
                    enabled: this.config.compactionEnabled,
                    strategy: 'size_based',
                    threshold: this.config.maxPartitionSize
                }
            };
            const scheme = strategy;
            const partitions = await this.generatePartitions(datasetId, data, partitionStrategy);
            this.partitionCache.set(datasetId, partitions);
            const executionTime = Date.now() - startTime;
            logger_1.logger.info('Partition scheme created successfully', {
                datasetId,
                partitionCount: partitions.length,
                executionTime
            });
            return scheme;
        }
        catch (error) {
            logger_1.logger.error('Failed to create partition scheme', { datasetId, error });
            throw new Error(`Partition scheme creation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async optimizePartitions(datasetId) {
        try {
            logger_1.logger.info('Optimizing partitions', { datasetId });
            const currentPartitions = this.partitionCache.get(datasetId) || [];
            if (currentPartitions.length === 0) {
                throw new Error(`No partitions found for dataset: ${datasetId}`);
            }
            const analysis = this.analyzePartitionPerformance(currentPartitions);
            const recommendation = this.recommendOptimization(analysis);
            logger_1.logger.info('Partition optimization analysis completed', {
                datasetId,
                currentPartitionCount: currentPartitions.length,
                recommendedStrategy: recommendation.recommendedStrategy
            });
            return recommendation;
        }
        catch (error) {
            logger_1.logger.error('Failed to optimize partitions', { datasetId, error });
            throw new Error(`Partition optimization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async suggestPartitioning(datasetId, data, accessPatterns) {
        try {
            logger_1.logger.info('Suggesting partitioning strategy', {
                datasetId,
                recordCount: data?.length || 0,
                accessPatterns
            });
            const dataAnalysis = this.analyzeDataCharacteristics(data);
            const patternAnalysis = this.analyzeAccessPatterns(accessPatterns || []);
            const recommendation = {
                strategy: this.determinePartitionStrategy(dataAnalysis, patternAnalysis),
                partitionColumns: this.suggestPartitionColumns(dataAnalysis),
                estimatedPartitionCount: this.estimatePartitionCount(data?.length || 0, dataAnalysis),
                expectedPerformanceGain: this.estimatePerformanceGain(dataAnalysis, patternAnalysis),
                implementation: this.generateImplementationPlan(dataAnalysis, patternAnalysis)
            };
            logger_1.logger.info('Partitioning strategy suggested', {
                datasetId,
                strategy: recommendation.strategy,
                partitionColumns: recommendation.partitionColumns,
                estimatedPartitionCount: recommendation.estimatedPartitionCount
            });
            return recommendation;
        }
        catch (error) {
            logger_1.logger.error('Failed to suggest partitioning', { datasetId, error });
            throw new Error(`Partitioning suggestion failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    analyzeDataCharacteristics(data) {
        if (!data || data.length === 0) {
            return {
                totalRecords: 0,
                columns: {},
                dataTypes: [],
                hasTimestamps: false
            };
        }
        const sample = data.slice(0, Math.min(1000, data.length));
        const columns = new Map();
        sample.forEach(record => {
            if (typeof record === 'object' && record !== null) {
                Object.keys(record).forEach(key => {
                    const value = record[key];
                    const type = typeof value;
                    if (!columns.has(key)) {
                        columns.set(key, { type, cardinality: 0, distribution: new Set() });
                    }
                    const columnInfo = columns.get(key);
                    columnInfo.distribution.add(value);
                    columnInfo.cardinality = columnInfo.distribution.size;
                });
            }
        });
        return {
            totalRecords: data.length,
            columns: Object.fromEntries(Array.from(columns.entries()).map(([key, value]) => [
                key,
                {
                    type: value.type,
                    cardinality: value.cardinality,
                    selectivity: value.cardinality / sample.length
                }
            ])),
            dataTypes: Array.from(new Set(Array.from(columns.values()).map(c => c.type))),
            hasTimestamps: Array.from(columns.keys()).some(key => key.toLowerCase().includes('date') || key.toLowerCase().includes('time'))
        };
    }
    analyzeAccessPatterns(accessPatterns) {
        return {
            queryTypes: accessPatterns.filter(p => ['analytical', 'transactional', 'streaming'].includes(p)),
            filterColumns: accessPatterns.filter(p => p.startsWith('filter:')).map(p => p.replace('filter:', '')),
            sortColumns: accessPatterns.filter(p => p.startsWith('sort:')).map(p => p.replace('sort:', '')),
            timeRangeQueries: accessPatterns.includes('time_range'),
            pointQueries: accessPatterns.includes('point_lookup')
        };
    }
    determinePartitionStrategy(dataAnalysis, patternAnalysis) {
        if (dataAnalysis.hasTimestamps && patternAnalysis.timeRangeQueries) {
            return 'range-based';
        }
        if (patternAnalysis.pointQueries && patternAnalysis.filterColumns.length > 0) {
            return 'hash-based';
        }
        if (patternAnalysis.filterColumns.length > 1) {
            return 'hybrid';
        }
        return 'range-based';
    }
    suggestPartitionColumns(dataAnalysis) {
        const columns = Object.entries(dataAnalysis.columns)
            .filter(([_, info]) => info.selectivity > 0.1 && info.selectivity < 0.9)
            .sort(([_, a], [__, b]) => Math.abs(0.5 - a.selectivity) - Math.abs(0.5 - b.selectivity))
            .slice(0, 3)
            .map(([name, _]) => name);
        return columns.length > 0 ? columns : ['id'];
    }
    estimatePartitionCount(recordCount, dataAnalysis) {
        const targetPartitionSize = 100000;
        const estimatedCount = Math.ceil(recordCount / targetPartitionSize);
        return Math.min(Math.max(estimatedCount, 1), 1000);
    }
    estimatePerformanceGain(dataAnalysis, patternAnalysis) {
        let gain = 0.2;
        if (patternAnalysis.timeRangeQueries && dataAnalysis.hasTimestamps) {
            gain += 0.3;
        }
        if (patternAnalysis.filterColumns.length > 0) {
            gain += 0.1 * patternAnalysis.filterColumns.length;
        }
        return Math.min(gain, 0.8);
    }
    generateImplementationPlan(dataAnalysis, patternAnalysis) {
        return {
            steps: [
                'Analyze current data distribution',
                'Create partition scheme definition',
                'Implement partition creation logic',
                'Migrate existing data to partitioned structure',
                'Update query optimizer for partition pruning',
                'Monitor and adjust partition strategy'
            ],
            estimatedTime: '2-4 hours',
            complexity: dataAnalysis.columns ? Object.keys(dataAnalysis.columns).length > 10 ? 'high' : 'medium' : 'low',
            prerequisites: [
                'Data analysis completion',
                'Query pattern analysis',
                'Storage space availability'
            ]
        };
    }
    async prunePartitions(datasetId, queryFilters) {
        try {
            if (!this.config.pruningEnabled) {
                const allPartitions = this.partitionCache.get(datasetId) || [];
                return allPartitions;
            }
            logger_1.logger.debug('Pruning partitions', { datasetId, queryFilters });
            const allPartitions = this.partitionCache.get(datasetId) || [];
            const prunedPartitions = allPartitions.filter(partition => this.shouldIncludePartition(partition, queryFilters));
            const pruningRatio = 1 - (prunedPartitions.length / allPartitions.length);
            logger_1.logger.debug('Partition pruning completed', {
                datasetId,
                totalPartitions: allPartitions.length,
                prunedPartitions: prunedPartitions.length,
                pruningRatio: Math.round(pruningRatio * 100)
            });
            return prunedPartitions;
        }
        catch (error) {
            logger_1.logger.error('Failed to prune partitions', { datasetId, error });
            throw new Error(`Partition pruning failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async compactPartitions(datasetId) {
        try {
            if (!this.config.compactionEnabled) {
                logger_1.logger.info('Partition compaction disabled', { datasetId });
                return;
            }
            logger_1.logger.info('Starting partition compaction', { datasetId });
            const partitions = this.partitionCache.get(datasetId) || [];
            const smallPartitions = partitions.filter(p => p.size < this.config.maxPartitionSize * 0.1);
            if (smallPartitions.length < 2) {
                logger_1.logger.info('No partitions need compaction', { datasetId });
                return;
            }
            const compactionGroups = this.groupPartitionsForCompaction(smallPartitions);
            logger_1.logger.info('Compacting partition groups', {
                datasetId,
                groupCount: compactionGroups.length,
                totalPartitions: smallPartitions.length
            });
            for (const group of compactionGroups) {
                await this.compactPartitionGroup(datasetId, group);
            }
            logger_1.logger.info('Partition compaction completed', { datasetId });
        }
        catch (error) {
            logger_1.logger.error('Failed to compact partitions', { datasetId, error });
            throw new Error(`Partition compaction failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getPartitionStatistics(datasetId) {
        try {
            const partitions = this.partitionCache.get(datasetId) || [];
            if (partitions.length === 0) {
                return {
                    totalPartitions: 0,
                    totalSize: 0,
                    averagePartitionSize: 0,
                    largestPartition: 0,
                    smallestPartition: 0,
                    compressionRatio: 0
                };
            }
            const sizes = partitions.map(p => p.size);
            const totalSize = sizes.reduce((sum, size) => sum + size, 0);
            const uncompressedSizes = partitions.map(p => p.size * 1.5);
            const totalUncompressedSize = uncompressedSizes.reduce((sum, size) => sum + size, 0);
            return {
                totalPartitions: partitions.length,
                totalSize,
                averagePartitionSize: totalSize / partitions.length,
                largestPartition: Math.max(...sizes),
                smallestPartition: Math.min(...sizes),
                compressionRatio: totalUncompressedSize > 0 ? totalSize / totalUncompressedSize : 1
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get partition statistics', { datasetId, error });
            throw new Error(`Partition statistics failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    analyzeDataDistribution(data, columns) {
        if (!data || data.length === 0) {
            return {};
        }
        const analysis = {};
        columns.forEach(column => {
            const values = data.map((row) => row[column]).filter(val => val != null);
            const uniqueValues = new Set(values);
            analysis[column] = {
                cardinality: uniqueValues.size,
                dataType: this.inferDataType(values[0]),
                distribution: this.calculateDistribution(values),
                nullPercentage: (data.length - values.length) / data.length
            };
        });
        return analysis;
    }
    calculateOptimalBuckets(analysis, strategy) {
        switch (strategy) {
            case 'range-based':
                return Math.min(100, Math.max(10, Object.keys(analysis).length * 10));
            case 'hash-based':
                return Math.min(1000, Math.max(50, Object.keys(analysis).length * 20));
            case 'list-based':
                return Math.max(1, Math.min(...Object.values(analysis).map((a) => a.cardinality)));
            default:
                return 50;
        }
    }
    async generatePartitions(datasetId, data, strategy) {
        const partitions = [];
        switch (strategy.strategy) {
            case 'range-based':
                partitions.push(...this.generateRangePartitions(datasetId, data, strategy));
                break;
            case 'hash-based':
                partitions.push(...this.generateHashPartitions(datasetId, data, strategy));
                break;
            case 'list-based':
                partitions.push(...this.generateListPartitions(datasetId, data, strategy));
                break;
        }
        return partitions;
    }
    generateRangePartitions(datasetId, data, strategy) {
        if (!data || data.length === 0) {
            return [];
        }
        const partitions = [];
        const buckets = strategy.buckets || 10;
        const bucketSize = Math.ceil(data.length / buckets);
        for (let i = 0; i < buckets; i++) {
            const startIndex = i * bucketSize;
            const endIndex = Math.min(startIndex + bucketSize, data.length);
            const partitionData = data.slice(startIndex, endIndex);
            if (partitionData.length > 0) {
                partitions.push({
                    id: `${datasetId}_range_${i}`,
                    path: `/${datasetId}/range/${i}`,
                    strategy: 'range-based',
                    column: strategy.columns[0] || 'id',
                    value: `range_${i}`,
                    startValue: this.getMinValue(partitionData, strategy.columns[0] || 'id')?.toString(),
                    endValue: this.getMaxValue(partitionData, strategy.columns[0] || 'id')?.toString(),
                    size: this.estimatePartitionSize(partitionData),
                    rowCount: partitionData.length,
                    createdAt: new Date(),
                    lastAccessed: new Date()
                });
            }
        }
        return partitions;
    }
    generateHashPartitions(datasetId, data, strategy) {
        if (!data || data.length === 0) {
            return [];
        }
        const partitions = [];
        const buckets = strategy.buckets || 10;
        const bucketsArray = Array.from({ length: buckets }, () => []);
        data.forEach(row => {
            const hashValue = this.hashFunction(row[strategy.columns[0] || 'id']);
            const bucketIndex = hashValue % buckets;
            bucketsArray[bucketIndex].push(row);
        });
        bucketsArray.forEach((bucketData, index) => {
            if (bucketData.length > 0) {
                partitions.push({
                    id: `${datasetId}_hash_${index}`,
                    path: `/${datasetId}/hash/${index}`,
                    strategy: 'hash-based',
                    column: strategy.columns[0] || 'id',
                    value: `hash_${index}`,
                    size: this.estimatePartitionSize(bucketData),
                    rowCount: bucketData.length,
                    createdAt: new Date(),
                    lastAccessed: new Date()
                });
            }
        });
        return partitions;
    }
    generateListPartitions(datasetId, data, strategy) {
        if (!data || data.length === 0) {
            return [];
        }
        const partitions = [];
        const groups = new Map();
        data.forEach(row => {
            const key = row[strategy.columns[0] || 'id'];
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(row);
        });
        groups.forEach((groupData, key) => {
            partitions.push({
                id: `${datasetId}_list_${key}`,
                path: `/${datasetId}/list/${key}`,
                strategy: 'list-based',
                column: strategy.columns[0] || 'id',
                value: String(key),
                size: this.estimatePartitionSize(groupData),
                rowCount: groupData.length,
                createdAt: new Date(),
                lastAccessed: new Date()
            });
        });
        return partitions;
    }
    analyzePartitionPerformance(partitions) {
        const sizes = partitions.map(p => p.size);
        const recordCounts = partitions.map(p => p.rowCount);
        return {
            partitionCount: partitions.length,
            averageSize: sizes.reduce((sum, size) => sum + size, 0) / sizes.length,
            sizeVariance: this.calculateVariance(sizes),
            averageRecordCount: recordCounts.reduce((sum, count) => sum + count, 0) / recordCounts.length,
            recordCountVariance: this.calculateVariance(recordCounts),
            skewFactor: Math.max(...sizes) / Math.min(...sizes)
        };
    }
    recommendOptimization(analysis) {
        let recommendedStrategy = 'hash-based';
        let reason = 'Default hash partitioning for balanced distribution';
        if (analysis.skewFactor > 10) {
            recommendedStrategy = 'range-based';
            reason = 'High skew detected, range partitioning recommended';
        }
        else if (analysis.partitionCount > this.config.maxPartitionsPerLevel) {
            recommendedStrategy = 'hash-based';
            reason = 'Too many partitions, hash partitioning for consolidation';
        }
        return {
            currentPartitions: [],
            recommendedStrategy,
            estimatedQueryPerformance: this.estimateQueryPerformance(analysis),
            estimatedStorageOptimization: this.estimateStorageOptimization(analysis),
            reason
        };
    }
    shouldIncludePartition(partition, queryFilters) {
        for (const [column, value] of Object.entries(queryFilters)) {
            if (partition.startValue && partition.endValue) {
                if (value < partition.startValue || value > partition.endValue) {
                    return false;
                }
            }
            if (partition.value && partition.value !== String(value)) {
                return false;
            }
        }
        return true;
    }
    groupPartitionsForCompaction(partitions) {
        const groups = [];
        let currentGroup = [];
        let currentGroupSize = 0;
        partitions.forEach(partition => {
            if (currentGroupSize + partition.size <= this.config.maxPartitionSize) {
                currentGroup.push(partition);
                currentGroupSize += partition.size;
            }
            else {
                if (currentGroup.length > 0) {
                    groups.push([...currentGroup]);
                }
                currentGroup = [partition];
                currentGroupSize = partition.size;
            }
        });
        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }
        return groups;
    }
    async compactPartitionGroup(datasetId, group) {
        logger_1.logger.debug('Compacting partition group', {
            datasetId,
            partitionCount: group.length,
            totalSize: group.reduce((sum, p) => sum + p.size, 0)
        });
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    inferDataType(value) {
        if (typeof value === 'number')
            return 'number';
        if (typeof value === 'boolean')
            return 'boolean';
        if (value instanceof Date)
            return 'date';
        return 'string';
    }
    calculateDistribution(values) {
        if (!values) {
            return {};
        }
        const counts = new Map();
        values.forEach(value => {
            counts.set(value, (counts.get(value) || 0) + 1);
        });
        return Object.fromEntries(counts);
    }
    estimatePartitionSize(data) {
        return Buffer.byteLength(JSON.stringify(data), 'utf8');
    }
    getMinValue(data, column) {
        if (!data || data.length === 0) {
            return null;
        }
        const values = data.map((row) => row[column]).filter(val => val != null);
        return values.length > 0 ? Math.min(...values) : null;
    }
    getMaxValue(data, column) {
        if (!data || data.length === 0) {
            return null;
        }
        const values = data.map((row) => row[column]).filter(val => val != null);
        return values.length > 0 ? Math.max(...values) : null;
    }
    hashFunction(value) {
        const str = String(value);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }
    estimateQueryPerformance(analysis) {
        const baseScore = 0.5;
        const skewPenalty = Math.min(0.3, analysis.skewFactor / 50);
        const partitionCountBonus = Math.min(0.2, analysis.partitionCount / 1000);
        return Math.max(0, Math.min(1, baseScore - skewPenalty + partitionCountBonus));
    }
    estimateStorageOptimization(analysis) {
        const baseOptimization = 0.2;
        const compressionBonus = 0.1;
        return Math.min(1, baseOptimization + compressionBonus);
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing Partition Manager');
            this.partitionCache = new Map();
            this.validateConfig();
            logger_1.logger.info('Partition Manager initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Partition Manager', { error });
            throw new Error(`Partition Manager initialization failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async shutdown() {
        try {
            logger_1.logger.info('Shutting down Partition Manager');
            this.partitionCache.clear();
            logger_1.logger.info('Partition Manager shutdown complete');
        }
        catch (error) {
            logger_1.logger.error('Error during Partition Manager shutdown', { error });
            throw error;
        }
    }
    validateConfig() {
        if (!this.config) {
            throw new Error('Partition Manager configuration is required');
        }
        if (!this.config.enabled) {
            logger_1.logger.info('Partitioning is disabled');
            return;
        }
    }
}
exports.PartitionManager = PartitionManager;
exports.default = PartitionManager;
//# sourceMappingURL=partition-manager.js.map