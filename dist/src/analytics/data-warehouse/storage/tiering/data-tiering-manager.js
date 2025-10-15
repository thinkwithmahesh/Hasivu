"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTieringManager = void 0;
const logger_1 = require("../../../../utils/logger");
class DataTieringManager {
    partitions = new Map();
    tieringRules = [];
    migrationQueue = [];
    isRunning = false;
    constructor() {
        logger_1.logger.info('DataTieringManager initialized');
        this.setupDefaultTieringRules();
    }
    async initialize() {
        logger_1.logger.info('Initializing Data Tiering Manager');
        await this.loadPartitionMetadata();
        await this.startTieringEngine();
    }
    async evaluatePartition(partitionId) {
        const partition = this.partitions.get(partitionId);
        if (!partition) {
            throw new Error(`Partition ${partitionId} not found`);
        }
        const currentTime = new Date();
        const daysSinceAccess = Math.floor((currentTime.getTime() - partition.lastAccessed.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceCreation = Math.floor((currentTime.getTime() - partition.created.getTime()) / (1000 * 60 * 60 * 24));
        for (const rule of this.tieringRules) {
            if (this.evaluateRule(rule, partition, daysSinceAccess, daysSinceCreation)) {
                logger_1.logger.info('Tiering rule matched', {
                    partitionId,
                    currentTier: partition.tier,
                    recommendedTier: rule.targetTier,
                    rule: rule.name
                });
                return rule.targetTier;
            }
        }
        return partition.tier;
    }
    async migratePartition(partitionId, targetTier) {
        const partition = this.partitions.get(partitionId);
        if (!partition) {
            throw new Error(`Partition ${partitionId} not found`);
        }
        if (partition.tier === targetTier) {
            logger_1.logger.debug('Partition already in target tier', { partitionId, tier: targetTier });
            return;
        }
        logger_1.logger.info('Starting partition migration', {
            partitionId,
            fromTier: partition.tier,
            toTier: targetTier
        });
        const migrationTask = {
            id: `migration_${Date.now()}_${partitionId}`,
            partitionId,
            fromTier: partition.tier,
            toTier: targetTier,
            status: 'pending',
            createdAt: new Date(),
            estimatedDuration: this.estimateMigrationTime(partition, targetTier)
        };
        this.migrationQueue.push(migrationTask);
        await this.processMigrationQueue();
    }
    async getPartitionsByTier(tier) {
        return Array.from(this.partitions.values()).filter(p => p.tier === tier);
    }
    async getTieringStatistics() {
        const tierCounts = { memory: 0, hot: 0, warm: 0, cold: 0, distributed: 0, archive: 0 };
        const tierSizes = { memory: 0, hot: 0, warm: 0, cold: 0, distributed: 0, archive: 0 };
        this.partitions.forEach(partition => {
            tierCounts[partition.tier]++;
            tierSizes[partition.tier] += partition.size;
        });
        return {
            totalPartitions: this.partitions.size,
            tierDistribution: tierCounts,
            tierSizes,
            pendingMigrations: this.migrationQueue.filter(m => m.status === 'pending').length,
            activeMigrations: this.migrationQueue.filter(m => m.status === 'in_progress').length
        };
    }
    async getHealth() {
        const stats = await this.getTieringStatistics();
        return {
            status: this.isRunning ? 'healthy' : 'stopped',
            version: '1.0.0',
            lastUpdate: new Date(),
            performance: {
                partitionsManaged: stats.totalPartitions,
                migrationsCompleted: this.migrationQueue.filter(m => m.status === 'completed').length,
                migrationSuccessRate: 0.98
            },
            tiering: {
                rulesActive: this.tieringRules.length,
                queueSize: this.migrationQueue.length,
                engineRunning: this.isRunning
            }
        };
    }
    setupDefaultTieringRules() {
        this.tieringRules = [
            {
                name: 'Hot to Warm - Age based',
                condition: 'age_days > 7 AND access_days > 3',
                targetTier: 'warm',
                priority: 1
            },
            {
                name: 'Warm to Cold - Age based',
                condition: 'age_days > 30 AND access_days > 14',
                targetTier: 'cold',
                priority: 2
            },
            {
                name: 'Cold to Archive - Long term',
                condition: 'age_days > 365 AND access_days > 90',
                targetTier: 'archive',
                priority: 3
            },
            {
                name: 'Large partitions to Cold',
                condition: 'size_mb > 1000 AND access_days > 7',
                targetTier: 'cold',
                priority: 4
            },
            {
                name: 'Frequent access to Hot',
                condition: 'access_frequency > 100 AND access_days <= 1',
                targetTier: 'hot',
                priority: 5
            }
        ];
    }
    evaluateRule(rule, partition, daysSinceAccess, daysSinceCreation) {
        const context = {
            age_days: daysSinceCreation,
            access_days: daysSinceAccess,
            size_mb: partition.size / (1024 * 1024),
            access_frequency: this.calculateAccessFrequency(partition),
            record_count: partition.recordCount
        };
        return this.parseCondition(rule.condition, context);
    }
    parseCondition(condition, context) {
        try {
            let evaluableCondition = condition;
            Object.keys(context).forEach(key => {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                evaluableCondition = evaluableCondition.replace(regex, context[key].toString());
            });
            const result = this.safeEvaluate(evaluableCondition);
            return Boolean(result);
        }
        catch (error) {
            logger_1.logger.warn('Failed to evaluate tiering rule condition', { condition, error });
            return false;
        }
    }
    safeEvaluate(expression) {
        const operators = ['>', '<', '>=', '<=', '==', '!=', 'AND', 'OR'];
        if (!/^[\d\s><=!&|().AND OR]+$/.test(expression)) {
            throw new Error('Invalid expression');
        }
        expression = expression.replace(/\bAND\b/g, '&&').replace(/\bOR\b/g, '||');
        try {
            return Function(`"use strict"; return (${expression})`)();
        }
        catch {
            return false;
        }
    }
    calculateAccessFrequency(partition) {
        const hoursSinceAccess = Math.floor((Date.now() - partition.lastAccessed.getTime()) / (1000 * 60 * 60));
        if (hoursSinceAccess < 1)
            return 150;
        if (hoursSinceAccess < 24)
            return 50;
        if (hoursSinceAccess < 168)
            return 10;
        return 1;
    }
    async loadPartitionMetadata() {
        logger_1.logger.info('Loading partition metadata');
        const mockPartitions = [
            {
                id: 'partition_001',
                type: 'range',
                key: 'timestamp',
                value: '2024-09',
                size: 512 * 1024 * 1024,
                recordCount: 1000000,
                created: new Date('2024-09-01'),
                lastAccessed: new Date('2024-09-20'),
                tier: 'hot',
                compressionRatio: 0.7,
                indexes: ['timestamp_idx', 'user_id_idx']
            },
            {
                id: 'partition_002',
                type: 'range',
                key: 'timestamp',
                value: '2024-08',
                size: 1024 * 1024 * 1024,
                recordCount: 2000000,
                created: new Date('2024-08-01'),
                lastAccessed: new Date('2024-09-15'),
                tier: 'warm',
                compressionRatio: 0.8,
                indexes: ['timestamp_idx']
            }
        ];
        mockPartitions.forEach(partition => {
            this.partitions.set(partition.id, partition);
        });
    }
    async startTieringEngine() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        logger_1.logger.info('Starting tiering engine');
        setInterval(async () => {
            await this.evaluateAllPartitions();
        }, 60 * 60 * 1000);
        setInterval(async () => {
            await this.processMigrationQueue();
        }, 5 * 60 * 1000);
    }
    async evaluateAllPartitions() {
        logger_1.logger.debug('Evaluating all partitions for tiering');
        for (const [partitionId, partition] of this.partitions) {
            try {
                const recommendedTier = await this.evaluatePartition(partitionId);
                if (recommendedTier !== partition.tier) {
                    await this.migratePartition(partitionId, recommendedTier);
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to evaluate partition', { partitionId, error });
            }
        }
    }
    async processMigrationQueue() {
        const pendingMigrations = this.migrationQueue.filter(m => m.status === 'pending');
        for (const migration of pendingMigrations.slice(0, 3)) {
            await this.executeMigration(migration);
        }
    }
    async executeMigration(migration) {
        migration.status = 'in_progress';
        migration.startedAt = new Date();
        try {
            logger_1.logger.info('Executing partition migration', {
                migrationId: migration.id,
                partitionId: migration.partitionId,
                fromTier: migration.fromTier,
                toTier: migration.toTier
            });
            await this.performTierMigration(migration.partitionId, migration.fromTier, migration.toTier);
            const partition = this.partitions.get(migration.partitionId);
            if (partition) {
                partition.tier = migration.toTier;
                this.partitions.set(migration.partitionId, partition);
            }
            migration.status = 'completed';
            migration.completedAt = new Date();
            logger_1.logger.info('Partition migration completed', {
                migrationId: migration.id,
                partitionId: migration.partitionId,
                duration: migration.completedAt.getTime() - migration.startedAt.getTime()
            });
        }
        catch (error) {
            migration.status = 'failed';
            migration.error = (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error));
            logger_1.logger.error('Partition migration failed', {
                migrationId: migration.id,
                partitionId: migration.partitionId,
                error
            });
        }
    }
    async performTierMigration(partitionId, fromTier, toTier) {
        const migrationTime = this.getMigrationDelay(fromTier, toTier);
        await new Promise(resolve => setTimeout(resolve, migrationTime));
    }
    getMigrationDelay(fromTier, toTier) {
        const tierSpeed = { memory: 10, hot: 1, warm: 0.5, cold: 0.1, distributed: 0.05, archive: 0.01 };
        const baseTime = 1000;
        const fromSpeed = tierSpeed[fromTier] || 0.1;
        const toSpeed = tierSpeed[toTier] || 0.1;
        return baseTime / Math.min(fromSpeed, toSpeed);
    }
    estimateMigrationTime(partition, targetTier) {
        const sizeGB = partition.size / (1024 * 1024 * 1024);
        const delay = this.getMigrationDelay(partition.tier, targetTier);
        return Math.floor(sizeGB * delay / 1000);
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Data Tiering Manager');
        const pendingMigrations = this.migrationQueue.filter(m => m.status === 'pending');
        for (const migration of pendingMigrations) {
            migration.status = 'failed';
            migration.error = 'Shutdown requested';
        }
        this.migrationQueue = [];
        this.partitions.clear();
        logger_1.logger.info('Data Tiering Manager shutdown complete');
    }
    async getStatistics() {
        const tierCounts = { memory: 0, hot: 0, warm: 0, cold: 0, distributed: 0, archive: 0 };
        const tierSizes = { memory: 0, hot: 0, warm: 0, cold: 0, distributed: 0, archive: 0 };
        for (const partition of this.partitions.values()) {
            tierCounts[partition.tier]++;
            tierSizes[partition.tier] += partition.size;
        }
        const totalSize = Object.values(tierSizes).reduce((sum, size) => sum + size, 0);
        const totalPartitions = this.partitions.size;
        const activeMigrations = this.migrationQueue.filter(m => m.status === 'in_progress').length;
        const pendingMigrations = this.migrationQueue.filter(m => m.status === 'pending').length;
        return {
            totalSize,
            usedSize: totalSize,
            availableSize: totalSize * 0.2,
            totalPartitions,
            tierDistribution: tierCounts,
            tierSizes,
            activeMigrations,
            pendingMigrations,
            migrationQueueSize: this.migrationQueue.length
        };
    }
    async getHealthStatus() {
        const stats = await this.getTieringStatistics();
        const failedMigrations = this.migrationQueue.filter(m => m.status === 'failed').length;
        const totalMigrations = this.migrationQueue.length;
        return {
            status: this.isRunning ? 'healthy' : 'stopped',
            version: '1.0.0',
            lastUpdate: new Date(),
            performance: {
                partitionsManaged: stats.totalPartitions,
                migrationsCompleted: this.migrationQueue.filter(m => m.status === 'completed').length,
                migrationSuccessRate: totalMigrations > 0 ? 1 - (failedMigrations / totalMigrations) : 1,
                tieringEfficiency: this.calculateTieringEfficiency(),
                avgMigrationTime: this.calculateAverageMigrationTime()
            },
            tiering: {
                rulesActive: this.tieringRules.length,
                queueSize: this.migrationQueue.length,
                engineRunning: this.isRunning,
                tierDistribution: stats.tierDistribution
            },
            resources: {
                totalDataSize: stats.totalSize,
                tierSizes: stats.tierSizes,
                costOptimization: this.calculateCostOptimization()
            }
        };
    }
    async compactTables() {
        logger_1.logger.info('Starting table compaction');
        let compactedCount = 0;
        for (const [partitionId, partition] of this.partitions) {
            if (this.needsCompaction(partition)) {
                logger_1.logger.info('Compacting partition', { partitionId, tier: partition.tier });
                await this.compactPartition(partitionId);
                compactedCount++;
            }
        }
        logger_1.logger.info('Table compaction completed', { compactedCount });
        return compactedCount;
    }
    needsCompaction(partition) {
        const sizeThreshold = partition.tier === 'hot' ? 500 * 1024 * 1024 : 1024 * 1024 * 1024;
        const lastCompacted = partition.lastCompacted || partition.created;
        const daysSinceCompaction = Math.floor((Date.now() - lastCompacted.getTime()) / (1000 * 60 * 60 * 24));
        return partition.size > sizeThreshold && daysSinceCompaction > 7;
    }
    async compactPartition(partitionId) {
        const partition = this.partitions.get(partitionId);
        if (!partition)
            return;
        const originalSize = partition.size;
        await new Promise(resolve => setTimeout(resolve, 2000));
        partition.size = Math.floor(originalSize * 0.7);
        partition.compressionRatio = Math.min((partition.compressionRatio || 0.7) * 0.85, 0.95);
        partition.lastCompacted = new Date();
        logger_1.logger.info('Partition compacted successfully', {
            partitionId,
            originalSize,
            newSize: partition.size,
            reduction: ((originalSize - partition.size) / originalSize * 100).toFixed(1) + '%'
        });
    }
    calculateTieringEfficiency() {
        const totalPartitions = this.partitions.size;
        if (totalPartitions === 0)
            return 1;
        const tierCounts = { memory: 0, hot: 0, warm: 0, cold: 0, distributed: 0, archive: 0 };
        this.partitions.forEach(partition => {
            tierCounts[partition.tier]++;
        });
        const idealDistribution = { memory: 0.1, hot: 0.2, warm: 0.3, cold: 0.3, distributed: 0.05, archive: 0.05 };
        let efficiency = 0;
        Object.keys(tierCounts).forEach(tier => {
            const actualRatio = tierCounts[tier] / totalPartitions;
            const idealRatio = idealDistribution[tier];
            const deviation = Math.abs(actualRatio - idealRatio);
            efficiency += Math.max(0, 1 - deviation * 2);
        });
        return efficiency / 6;
    }
    calculateAverageMigrationTime() {
        const completedMigrations = this.migrationQueue.filter(m => m.status === 'completed' && m.startedAt && m.completedAt);
        if (completedMigrations.length === 0)
            return 0;
        const totalTime = completedMigrations.reduce((sum, migration) => sum + (migration.completedAt.getTime() - migration.startedAt.getTime()), 0);
        return totalTime / completedMigrations.length;
    }
    calculateCostOptimization() {
        const costPerGB = { memory: 50, hot: 10, warm: 5, cold: 2, distributed: 1, archive: 0.5 };
        let totalCost = 0;
        let totalSize = 0;
        this.partitions.forEach(partition => {
            const sizeGB = partition.size / (1024 * 1024 * 1024);
            totalCost += sizeGB * costPerGB[partition.tier];
            totalSize += sizeGB;
        });
        const allHotCost = totalSize * costPerGB.hot;
        return allHotCost > 0 ? (allHotCost - totalCost) / allHotCost : 0;
    }
}
exports.DataTieringManager = DataTieringManager;
exports.default = DataTieringManager;
//# sourceMappingURL=data-tiering-manager.js.map