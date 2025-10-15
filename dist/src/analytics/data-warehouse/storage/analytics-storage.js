"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsStorageEngine = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
const logger_1 = require("../../../shared/utils/logger");
const metrics_service_1 = require("../../../services/metrics.service");
const cache_service_1 = require("../../../services/cache.service");
const distributed_query_processor_1 = require("./distributed/distributed-query-processor");
const in_memory_analytics_engine_1 = require("./memory/in-memory-analytics-engine");
const data_tiering_manager_1 = require("./tiering/data-tiering-manager");
const index_manager_1 = require("./indexing/index-manager");
const compression_manager_1 = require("./compression/compression-manager");
const materialized_view_manager_1 = require("./views/materialized-view-manager");
const query_optimizer_1 = require("./optimization/query-optimizer");
const parallel_processor_1 = require("./parallel/parallel-processor");
const storage_monitor_1 = require("./monitoring/storage-monitor");
const tenant_isolation_storage_1 = require("./tenancy/tenant-isolation-storage");
class AnalyticsStorageEngine extends events_1.EventEmitter {
    config;
    metrics = new metrics_service_1.MetricsCollector();
    cache = new cache_service_1.CacheService();
    distributedProcessor;
    memoryEngine;
    tieringManager;
    indexManager;
    compressionManager;
    viewManager;
    queryOptimizer;
    parallelProcessor;
    storageMonitor;
    tenantIsolation;
    isRunning = false;
    queryHistory = new Map();
    activeQueries = new Map();
    materializedViews = new Map();
    constructor(config) {
        super();
        this.config = config;
        logger_1.logger.info('Initializing Analytics Storage Engine', {
            mode: config.mode,
            maxConcurrentQueries: config.maxConcurrentQueries || 100,
            cacheSize: config.cacheSize || '50GB',
            compressionEnabled: config.compression.enabled
        });
        this.distributedProcessor = new distributed_query_processor_1.DistributedQueryProcessor();
        this.memoryEngine = new in_memory_analytics_engine_1.InMemoryAnalyticsEngine();
        this.tieringManager = new data_tiering_manager_1.DataTieringManager();
        this.indexManager = new index_manager_1.IndexManager();
        this.compressionManager = new compression_manager_1.CompressionManager(config.compression);
        this.viewManager = new materialized_view_manager_1.MaterializedViewManager(config.views);
        this.queryOptimizer = new query_optimizer_1.QueryOptimizer(config.optimization);
        this.parallelProcessor = new parallel_processor_1.ParallelProcessor(config.parallel);
        this.storageMonitor = new storage_monitor_1.StorageMonitor(config.monitoring);
        this.tenantIsolation = new tenant_isolation_storage_1.TenantIsolationStorage(config.tenantIsolation);
        this.setupEventHandlers();
    }
    async validateTenantAccess(tenantId) {
        if (!tenantId) {
            throw new Error('Tenant ID is required');
        }
    }
    async start() {
        try {
            logger_1.logger.info('Starting Analytics Storage Engine...');
            await this.tenantIsolation.initialize();
            await this.compressionManager.initialize();
            await this.indexManager.initialize();
            await this.tieringManager.initialize();
            if (this.config.mode === 'distributed' || this.config.mode === 'hybrid') {
                await this.distributedProcessor.initialize();
            }
            if (this.config.mode === 'memory' || this.config.mode === 'hybrid') {
                await this.memoryEngine.initialize();
            }
            await this.viewManager.initialize();
            await this.queryOptimizer.initialize();
            await this.parallelProcessor.initialize();
            await this.storageMonitor.initialize();
            await this.loadMaterializedViews();
            this.startBackgroundTasks();
            this.isRunning = true;
            logger_1.logger.info('Analytics Storage Engine started successfully');
            this.emit('started');
        }
        catch (error) {
            logger_1.logger.error('Failed to start Analytics Storage Engine', { error });
            throw error;
        }
    }
    async stop() {
        try {
            logger_1.logger.info('Stopping Analytics Storage Engine...');
            this.isRunning = false;
            await this.cancelActiveQueries();
            await Promise.all([
                this.distributedProcessor.shutdown?.() || Promise.resolve(),
                this.memoryEngine.shutdown?.() || Promise.resolve(),
                this.tieringManager.shutdown?.() || Promise.resolve(),
                this.indexManager.shutdown?.() || Promise.resolve(),
                this.compressionManager.shutdown?.() || Promise.resolve(),
                this.viewManager.shutdown?.() || Promise.resolve(),
                this.queryOptimizer.shutdown?.() || Promise.resolve(),
                this.parallelProcessor.shutdown?.() || Promise.resolve(),
                this.storageMonitor.shutdown?.() || Promise.resolve(),
                this.tenantIsolation.shutdown?.() || Promise.resolve()
            ]);
            logger_1.logger.info('Analytics Storage Engine stopped successfully');
            this.emit('stopped');
        }
        catch (error) {
            logger_1.logger.error('Error stopping Analytics Storage Engine', { error });
            throw error;
        }
    }
    async executeQuery(query, tenantId, options = {}) {
        const startTime = Date.now();
        const queryId = this.generateQueryId();
        try {
            logger_1.logger.debug('Executing analytics query', {
                queryId,
                tenantId,
                sql: query.sql?.substring(0, 100) + '...',
                priority: options.priority || 'normal'
            });
            await this.validateTenantAccess(tenantId);
            if (options.useCache !== false && !options.forceRefresh) {
                const cachedResult = await this.getCachedResult(query, tenantId);
                if (cachedResult) {
                    logger_1.logger.debug('Returning cached query result', { queryId });
                    this.metrics.increment('storage.query.cache.hit');
                    return cachedResult;
                }
            }
            const optimizedQuery = await this.queryOptimizer.optimizeQuery(query);
            const queryPlan = await this.generateQueryPlan(query, tenantId, options);
            this.activeQueries.set(queryId, queryPlan);
            const result = await this.executeQueryPlan(queryPlan, tenantId);
            if (query.cacheable !== false) {
                await this.cacheResult(query, result, tenantId);
            }
            const executionTime = Date.now() - startTime;
            logger_1.logger.info('Query executed successfully', {
                queryId,
                executionTime,
                rowCount: result.rows?.length || 0,
                tier: queryPlan.tier,
                tenantId
            });
            this.metrics.timing('storage.query.execution.time', executionTime);
            this.metrics.increment('storage.query.executed.success');
            this.metrics.gauge('storage.query.result.rows', result.rows?.length || 0);
            this.queryHistory.set(queryId, result);
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            logger_1.logger.error('Failed to execute analytics query', {
                error,
                queryId,
                executionTime,
                tenantId
            });
            this.metrics.timing('storage.query.execution.time.failed', executionTime);
            this.metrics.increment('storage.query.executed.failed');
            throw error;
        }
        finally {
            this.activeQueries.delete(queryId);
        }
    }
    async createIndex(tableName, columns, indexType, tenantId, options = {}) {
        try {
            logger_1.logger.info('Creating analytics index', {
                tableName,
                columns,
                indexType,
                tenantId
            });
            await this.validateTenantAccess(tenantId);
            const indexStrategy = 'btree';
            const indexConfig = {
                table: tableName,
                columns,
                strategy: indexType,
                unique: options.unique,
                partial: options.partial ? true : false,
                concurrent: options.concurrent
            };
            const indexId = await this.indexManager.createIndex(indexConfig);
            logger_1.logger.info('Index created successfully', {
                indexId,
                tableName,
                columns
            });
            this.metrics.increment('storage.index.created');
            return indexId;
        }
        catch (error) {
            logger_1.logger.error('Failed to create index', {
                error,
                tableName,
                columns
            });
            throw error;
        }
    }
    async createMaterializedView(viewName, query, tenantId, options = {}) {
        try {
            logger_1.logger.info('Creating materialized view', {
                viewName,
                tenantId,
                refreshInterval: options.refreshInterval || 60
            });
            await this.validateTenantAccess(tenantId);
            const optimizedQuery = await this.queryOptimizer.optimizeQuery(query);
            const viewId = await this.viewManager.createView({
                name: viewName,
                query: optimizedQuery.query,
                tenantId,
                refreshInterval: options.refreshInterval,
                incremental: options.incremental,
                partitionBy: options.partitionBy
            });
            const materializedView = {
                id: viewId,
                name: viewName,
                query: optimizedQuery.query,
                tenantId,
                refreshInterval: options.refreshInterval || 60000,
                incremental: options.incremental || false,
                lastRefresh: new Date(),
                status: 'active',
                metadata: {
                    size: 0,
                    rowCount: 0,
                    dependencies: [],
                    refreshHistory: [],
                    performance: {
                        avgRefreshTime: 0,
                        hitRate: 0,
                        querySpeedup: 0
                    }
                }
            };
            this.materializedViews.set(viewId, materializedView);
            await this.refreshMaterializedView(viewId);
            logger_1.logger.info('Materialized view created successfully', {
                viewId,
                viewName
            });
            this.metrics.increment('storage.view.created');
            return materializedView;
        }
        catch (error) {
            logger_1.logger.error('Failed to create materialized view', {
                error,
                viewName
            });
            throw error;
        }
    }
    async refreshMaterializedView(viewId, force = false) {
        try {
            const view = this.materializedViews.get(viewId);
            if (!view) {
                throw new Error(`Materialized view not found: ${viewId}`);
            }
            logger_1.logger.debug('Refreshing materialized view', { viewId, force });
            await this.viewManager.refreshView(viewId, force);
            logger_1.logger.info('Materialized view refreshed successfully', { viewId });
            this.metrics.increment('storage.view.refreshed');
        }
        catch (error) {
            logger_1.logger.error('Failed to refresh materialized view', {
                error,
                viewId
            });
            throw error;
        }
    }
    async configureTiering(tableName, tieringPolicy, tenantId) {
        try {
            logger_1.logger.info('Configuring data tiering', {
                tableName,
                tieringPolicy,
                tenantId
            });
            await this.tieringManager.migratePartition(tableName, 'cold');
            logger_1.logger.info('Data tiering configured successfully', { tableName });
            this.metrics.increment('storage.tiering.configured');
        }
        catch (error) {
            logger_1.logger.error('Failed to configure data tiering', {
                error,
                tableName
            });
            throw error;
        }
    }
    async getStorageStatistics(_tenantId) {
        try {
            const [distributedStats, memoryStats, tieringStats, indexStats, compressionStats] = await Promise.all([
                this.distributedProcessor.getStatistics?.() || { totalSize: 0, usedSize: 0, availableSize: 0 },
                this.memoryEngine.getStatistics(),
                this.tieringManager.getStatistics?.() || { totalSize: 0, usedSize: 0, availableSize: 0 },
                this.indexManager.getStatistics?.() || { totalSize: 0, usedSize: 0, availableSize: 0 },
                this.compressionManager.getStatistics?.() || { totalSize: 0, usedSize: 0, availableSize: 0 }
            ]);
            return {
                totalSize: distributedStats.totalSize + memoryStats.totalSize,
                usedSize: distributedStats.usedSize + memoryStats.usedSize,
                availableSize: distributedStats.availableSize + memoryStats.availableSize,
                compressionRatio: compressionStats.overallRatio,
                tiering: {
                    hot: tieringStats.hot,
                    warm: tieringStats.warm,
                    cold: tieringStats.cold,
                    archived: tieringStats.archived
                },
                indexes: {
                    totalIndexes: indexStats.totalIndexes,
                    totalSize: indexStats.totalSize,
                    averageHitRate: indexStats.averageHitRate,
                    maintenanceOverhead: indexStats.maintenanceOverhead
                },
                queries: {
                    total: this.queryHistory.size,
                    averageExecutionTime: this.calculateAverageQueryTime(),
                    cacheHitRate: this.calculateCacheHitRate(),
                    slowQueries: this.calculateSlowQueries()
                },
                materializedViews: {
                    total: this.materializedViews.size,
                    lastRefresh: this.getLastViewRefresh() || new Date(0),
                    hitRate: await this.viewManager.getHitRate(),
                    averageRefreshTime: this.calculateAverageRefreshTime()
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get storage statistics', { error });
            throw error;
        }
    }
    async optimizeStorage(options = {}) {
        try {
            logger_1.logger.info('Starting storage optimization', { options });
            const results = {
                indexesOptimized: 0,
                tablesCompacted: 0,
                statisticsUpdated: 0,
                viewsRefreshed: 0
            };
            if (options.analyzeIndexes) {
                results.indexesOptimized = await this.indexManager.optimizeIndexes();
            }
            if (options.compactTables) {
                results.tablesCompacted = await this.tieringManager.compactTables();
            }
            if (options.updateStatistics) {
                results.statisticsUpdated = await this.storageMonitor.updateStatistics();
            }
            if (options.refreshViews) {
                results.viewsRefreshed = await this.refreshAllViews();
            }
            logger_1.logger.info('Storage optimization completed', { results });
            this.metrics.increment('storage.optimization.completed');
            return results;
        }
        catch (error) {
            logger_1.logger.error('Failed to optimize storage', { error });
            throw error;
        }
    }
    async getHealthStatus() {
        try {
            const [distributedHealth, memoryHealth, tieringHealth, indexHealth, compressionHealth, viewHealth, optimizerHealth, parallelHealth, monitorHealth, tenantHealth] = await Promise.all([
                this.distributedProcessor.getHealthStatus(),
                this.memoryEngine.getHealthStatus(),
                this.tieringManager.getHealthStatus(),
                this.indexManager.getHealthStatus(),
                this.compressionManager.getHealthStatus(),
                this.viewManager.getHealthStatus(),
                this.queryOptimizer.getHealthStatus(),
                this.parallelProcessor.getHealthStatus(),
                this.storageMonitor.getHealthStatus(),
                this.tenantIsolation.getHealthStatus()
            ]);
            const components = {
                distributedProcessor: distributedHealth,
                memoryEngine: memoryHealth,
                dataTeiring: tieringHealth,
                indexManager: indexHealth,
                compressionManager: compressionHealth,
                viewManager: viewHealth,
                queryOptimizer: optimizerHealth,
                parallelProcessor: parallelHealth,
                storageMonitor: monitorHealth,
                tenantIsolation: tenantHealth
            };
            const healthy = Object.values(components).every(comp => comp.healthy) && this.isRunning;
            return {
                healthy,
                components,
                metrics: {
                    activeQueries: this.activeQueries.size,
                    queryHistory: this.queryHistory.size,
                    materializedViews: this.materializedViews.size,
                    memoryUsage: process.memoryUsage().heapUsed,
                    uptime: process.uptime()
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting health status', { error });
            return {
                healthy: false,
                components: {},
                metrics: {}
            };
        }
    }
    async generateQueryPlan(query, tenantId, _options) {
        const plan = {
            id: this.generateQueryId(),
            query,
            tenantId,
            tier: await this.selectOptimalTier(query),
            indexes: await this.indexManager.getOptimalIndexes(),
            parallelism: await this.parallelProcessor.calculateOptimalParallelism(),
            estimatedTime: await this.calculateEstimatedTime(query),
            estimatedCost: await this.calculateQueryCost(query),
            createdAt: new Date(),
            optimizations: await this.generateOptimizations(query)
        };
        return plan;
    }
    async executeQueryPlan(plan, _tenantId) {
        const startTime = Date.now();
        try {
            let result;
            switch (plan.tier) {
                case 'memory':
                    result = await this.memoryEngine.executeQuery(plan.query);
                    break;
                case 'distributed':
                    result = await this.distributedProcessor.executeQuery(plan.query);
                    break;
                default:
                    result = await this.executeHybridQuery(plan, _tenantId);
            }
            result.executionPlan = plan;
            result.executionTimeMs = Date.now() - startTime;
            return result;
        }
        catch (error) {
            logger_1.logger.error('Query plan execution failed', {
                error,
                planId: plan.id,
                tier: plan.tier
            });
            throw error;
        }
    }
    async executeHybridQuery(plan, tenantId) {
        try {
            if (plan.estimatedCost < this.config.hybrid.memoryThreshold) {
                return await this.memoryEngine.executeQuery(plan.query);
            }
        }
        catch (error) {
            logger_1.logger.debug('Memory engine failed, falling back to distributed', { error });
        }
        return await this.distributedProcessor.executeQuery(plan.query);
    }
    async selectOptimalTier(query) {
        const cost = await this.calculateQueryCost(query);
        const complexity = await this.analyzeQueryComplexity(query);
        if (this.config.mode === 'memory')
            return 'memory';
        if (this.config.mode === 'distributed')
            return 'distributed';
        if (cost < this.config.hybrid.memoryThreshold && complexity < 0.5) {
            return 'memory';
        }
        return 'distributed';
    }
    async calculateQueryCost(query) {
        const baseCost = 1;
        const joins = (query.sql?.match(/JOIN/gi) || []).length;
        const aggregations = (query.sql?.match(/GROUP BY|COUNT|SUM|AVG/gi) || []).length;
        return baseCost + (joins * 2) + (aggregations * 1.5);
    }
    async analyzeQueryComplexity(query) {
        const sql = query.sql || '';
        const subqueries = (sql.match(/\(/g) || []).length;
        const unions = (sql.match(/UNION/gi) || []).length;
        const windows = (sql.match(/OVER\s*\(/gi) || []).length;
        const complexity = Math.min(1, (subqueries + unions * 2 + windows * 3) / 10);
        return complexity;
    }
    async getCachedResult(query, tenantId) {
        const cacheKey = this.generateCacheKey(query, tenantId);
        return await this.cache.get(cacheKey);
    }
    async cacheResult(query, result, tenantId) {
        const cacheKey = this.generateCacheKey(query, tenantId);
        const ttl = query.cacheTimeout || 300;
        await this.cache.set(cacheKey, result, { ttl });
    }
    generateCacheKey(query, tenantId) {
        const hash = (0, crypto_1.createHash)('sha256')
            .update(`${query.sql}:${tenantId}:${JSON.stringify(query.parameters || {})}`)
            .digest('hex');
        return `storage:query:${hash}`;
    }
    generateQueryId() {
        return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async loadMaterializedViews() {
        try {
            const views = await this.viewManager.getAllViews();
            views.forEach(view => {
                this.materializedViews.set(view.id, view);
            });
            logger_1.logger.info(`Loaded ${views.length} materialized views`);
        }
        catch (error) {
            logger_1.logger.error('Failed to load materialized views', { error });
        }
    }
    async cancelActiveQueries() {
        const activeQueryIds = Array.from(this.activeQueries.keys());
        await Promise.all(activeQueryIds.map(queryId => this.cancelQuery(queryId)));
    }
    async cancelQuery(queryId) {
        const plan = this.activeQueries.get(queryId);
        if (plan) {
            logger_1.logger.info('Cancelling query', { queryId });
            if (plan.tier === 'memory') {
                await this.memoryEngine.cancelQuery(queryId);
            }
            else {
                await this.distributedProcessor.cancelQuery(queryId);
            }
            this.activeQueries.delete(queryId);
        }
    }
    async refreshAllViews() {
        let refreshed = 0;
        for (const [viewId] of Array.from(this.materializedViews)) {
            try {
                await this.refreshMaterializedView(viewId);
                refreshed++;
            }
            catch (error) {
                logger_1.logger.error('Failed to refresh view during optimization', {
                    error,
                    viewId
                });
            }
        }
        return refreshed;
    }
    calculateAverageQueryTime() {
        const queries = Array.from(this.queryHistory.values());
        if (queries.length === 0)
            return 0;
        const totalTime = queries.reduce((sum, query) => sum + query.executionTimeMs, 0);
        return totalTime / queries.length;
    }
    calculateCacheHitRate() {
        const hits = this.metrics.getCounter("storage.queries.executed") || 0 || 0;
        const misses = this.metrics.getCounter("storage.queries.executed") || 0 || 0;
        const total = hits + misses;
        return total > 0 ? hits / total : 0;
    }
    getLastViewRefresh() {
        const views = Array.from(this.materializedViews.values());
        if (views.length === 0)
            return null;
        return views.reduce((latest, view) => {
            return view.lastRefresh > latest ? view.lastRefresh : latest;
        }, new Date(0));
    }
    startBackgroundTasks() {
        setInterval(() => {
            this.monitorQueryPerformance();
        }, 30000);
        setInterval(() => {
            this.cleanupQueryHistory();
        }, 5 * 60 * 1000);
        setInterval(() => {
            this.scheduleViewRefreshes();
        }, 60 * 1000);
        setInterval(() => {
            this.performAutomaticOptimization();
        }, 60 * 60 * 1000);
    }
    async monitorQueryPerformance() {
        try {
            const stats = await this.getStorageStatistics();
            this.metrics.gauge('storage.queries.average_time', stats.queries.averageExecutionTime);
            this.metrics.gauge('storage.cache.hit_rate', stats.queries.cacheHitRate);
            this.metrics.gauge('storage.compression.ratio', stats.compressionRatio);
            if (stats.queries.averageExecutionTime > this.config.performance.slowQueryThreshold) {
                logger_1.logger.warn('Slow query performance detected', {
                    averageTime: stats.queries.averageExecutionTime,
                    threshold: this.config.performance.slowQueryThreshold
                });
                this.emit('performance:slow_queries', stats);
            }
        }
        catch (error) {
            logger_1.logger.error('Error monitoring query performance', { error });
        }
    }
    cleanupQueryHistory() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
        for (const [queryId, result] of Array.from(this.queryHistory.entries())) {
            if (result.executedAt.getTime() < cutoffTime) {
                this.queryHistory.delete(queryId);
            }
        }
    }
    async scheduleViewRefreshes() {
        const now = new Date();
        for (const [viewId, view] of Array.from(this.materializedViews)) {
            const minutesSinceRefresh = (now.getTime() - view.lastRefresh.getTime()) / (1000 * 60);
            if (minutesSinceRefresh >= view.refreshInterval) {
                try {
                    await this.refreshMaterializedView(viewId);
                }
                catch (error) {
                    logger_1.logger.error('Failed to refresh scheduled view', {
                        error,
                        viewId
                    });
                }
            }
        }
    }
    async performAutomaticOptimization() {
        try {
            if (this.config.optimization.autoOptimize) {
                await this.optimizeStorage({
                    analyzeIndexes: true,
                    updateStatistics: true
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error during automatic optimization', { error });
        }
    }
    calculateSlowQueries() {
        const slowQueryThreshold = 5000;
        let slowCount = 0;
        for (const query of Array.from(this.queryHistory.values())) {
            if (query.executionTimeMs && query.executionTimeMs > slowQueryThreshold) {
                slowCount++;
            }
        }
        return slowCount;
    }
    calculateAverageRefreshTime() {
        const refreshTimes = [];
        for (const view of Array.from(this.materializedViews.values())) {
            if (view.lastRefresh) {
                refreshTimes.push(view.lastRefresh.getTime());
            }
        }
        if (refreshTimes.length === 0) {
            return 0;
        }
        return refreshTimes.reduce((sum, time) => sum + time, 0) / refreshTimes.length;
    }
    async calculateEstimatedTime(query) {
        const baseTime = 100;
        const complexityMultiplier = query.filters?.length || 1;
        const joinMultiplier = query.joins?.length || 1;
        return baseTime * complexityMultiplier * joinMultiplier;
    }
    async generateOptimizations(query) {
        const optimizations = [];
        if (query.filters) {
            optimizations.push({
                type: 'index',
                suggestion: 'Consider adding indexes on filtered columns',
                columns: query.filters.map(f => f.column),
                impact: 'high'
            });
        }
        if (query.joins && query.joins.length > 2) {
            optimizations.push({
                type: 'query_rewrite',
                suggestion: 'Consider breaking complex joins into smaller queries',
                impact: 'medium'
            });
        }
        return optimizations;
    }
    setupEventHandlers() {
        this.on('query:started', (_queryId) => {
            this.metrics.increment('storage.events.query.started');
        });
        this.on('query:completed', (_queryId, executionTime) => {
            this.metrics.increment('storage.events.query.completed');
            this.metrics.timing('storage.query.execution.time', executionTime);
        });
        this.on('query:failed', (_queryId, error) => {
            this.metrics.increment('storage.events.query.failed');
            logger_1.logger.error('Query execution failed', { queryId: _queryId, error });
        });
        this.on('performance:slow_queries', (stats) => {
            this.metrics.increment('storage.events.performance.slow_queries');
        });
        this.on('error', (error) => {
            logger_1.logger.error('Storage engine error', { error });
            this.metrics.increment('storage.errors.engine');
        });
    }
}
exports.AnalyticsStorageEngine = AnalyticsStorageEngine;
//# sourceMappingURL=analytics-storage.js.map