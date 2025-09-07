"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databasePerformanceService = exports.DatabasePerformanceService = void 0;
/**
 * HASIVU Platform - Database Performance Optimization Service
 * Advanced database performance monitoring, optimization, and analytics
 * Production-ready service with connection pooling, query optimization, and real-time metrics
 */
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
const environment_1 = require("@/config/environment");
const perf_hooks_1 = require("perf_hooks");
const events_1 = require("events");
/**
 * Database Performance Service with advanced optimization capabilities
 */
class DatabasePerformanceService extends events_1.EventEmitter {
    prisma;
    queryMetrics = new Map();
    recentQueries = [];
    connectionStats = {
        active: 0,
        idle: 0,
        total: 0,
        maxConnections: environment_1.config.database.poolMax || 10,
        queueLength: 0,
        totalAcquired: 0,
        totalReleased: 0
    };
    performanceHistory = [];
    SLOW_QUERY_THRESHOLD = 1000; // 1 second
    MAX_RECENT_QUERIES = 100;
    PERFORMANCE_HISTORY_LIMIT = 1000;
    monitoringInterval;
    constructor() {
        super();
        this.initializePrismaClient();
        this.setupPerformanceMonitoring();
        this.startContinuousMonitoring();
    }
    /**
     * Initialize Prisma client with optimized configuration
     */
    initializePrismaClient() {
        try {
            this.prisma = new client_1.PrismaClient({
                datasources: {
                    db: {
                        url: environment_1.config.database.url
                    }
                },
                log: [
                    { emit: 'event', level: 'query' },
                    { emit: 'event', level: 'error' },
                    { emit: 'event', level: 'info' },
                    { emit: 'event', level: 'warn' }
                ],
                errorFormat: 'pretty'
            });
            // Setup query event listeners
            this.setupQueryListeners();
            logger_1.logger.info('Database Performance Service initialized', {
                poolMin: environment_1.config.database.poolMin,
                poolMax: environment_1.config.database.poolMax,
                acquireTimeout: environment_1.config.database.acquireTimeout,
                idleTimeout: environment_1.config.database.idleTimeout
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Prisma client', { error });
            throw error;
        }
    }
    /**
     * Setup query event listeners for performance monitoring
     */
    setupQueryListeners() {
        // Modern Prisma doesn't support 'query' event - using fallback approach
        try {
            this.prisma.$on('query', (event) => {
                const duration = parseInt(event.duration);
                const query = event.query;
                // Update query metrics
                this.updateQueryMetrics(query, duration);
                // Track slow queries
                if (duration > this.SLOW_QUERY_THRESHOLD) {
                    this.trackSlowQuery(query, duration, event.params);
                }
                // Add to recent queries
                this.addRecentQuery(query, duration, event.params);
                // Emit performance event
                this.emit('query', { query, duration, timestamp: new Date() });
            });
            this.prisma.$on('error', (event) => {
                logger_1.logger.error('Database query error', { error: event });
                this.emit('error', event);
            });
        }
        catch (error) {
            logger_1.logger.warn('Prisma event listeners not available in current version', error);
        }
    }
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor connection pool every 5 seconds
        setInterval(() => {
            this.updateConnectionStats();
        }, 5000);
        // Emit performance metrics every 30 seconds
        setInterval(() => {
            this.emitPerformanceMetrics();
        }, 30000);
    }
    /**
     * Start continuous monitoring
     */
    startContinuousMonitoring() {
        this.monitoringInterval = setInterval(async () => {
            try {
                const metrics = await this.getPerformanceMetrics();
                this.addToPerformanceHistory(metrics);
                // Check for performance degradation
                if (metrics.status === 'degraded' || metrics.status === 'unhealthy') {
                    this.emit('performance-degradation', metrics);
                }
                // Auto-optimization triggers
                await this.checkForOptimizationOpportunities(metrics);
            }
            catch (error) {
                logger_1.logger.error('Error in continuous monitoring', { error });
            }
        }, 60000); // Every minute
    }
    /**
     * Get comprehensive performance metrics
     */
    async getPerformanceMetrics() {
        const startTime = perf_hooks_1.performance.now();
        try {
            // Test basic connectivity
            await this.prisma.$queryRaw `SELECT 1`;
            const responseTime = perf_hooks_1.performance.now() - startTime;
            // Get performance statistics
            const [connectionStats, tableMetrics, indexAnalysis] = await Promise.all([
                this.getConnectionStatistics(),
                this.getTableMetrics(),
                this.getIndexAnalysis()
            ]);
            // Calculate performance indicators
            const avgQueryTime = this.calculateAverageQueryTime();
            const slowQueriesCount = this.recentQueries.filter(q => q.duration > this.SLOW_QUERY_THRESHOLD).length;
            const queriesPerSecond = this.calculateQueriesPerSecond();
            // Determine health status
            const status = this.determineHealthStatus(responseTime, avgQueryTime, slowQueriesCount);
            const metrics = {
                status,
                responseTime,
                performance: {
                    avgQueryTime,
                    slowQueries: slowQueriesCount,
                    connectionPoolUsage: (connectionStats.active / connectionStats.maxConnections) * 100,
                    indexEfficiency: this.calculateIndexEfficiency(indexAnalysis),
                    queriesPerSecond,
                    cacheHitRatio: await this.getCacheHitRatio()
                },
                connections: connectionStats,
                slowQueries: this.getSlowQueries(),
                indexAnalysis,
                tableMetrics,
                errors: []
            };
            logger_1.logger.debug('Database performance metrics collected', {
                status: metrics.status,
                responseTime: `${responseTime.toFixed(2)}ms`,
                avgQueryTime: `${avgQueryTime.toFixed(2)}ms`,
                connectionPoolUsage: `${metrics.performance.connectionPoolUsage.toFixed(1)}%`
            });
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Failed to collect performance metrics', { error });
            throw error;
        }
    }
    /**
     * Get database connection statistics
     */
    async getConnectionStatistics() {
        try {
            // Get connection pool statistics from PostgreSQL
            const connectionInfo = await this.prisma.$queryRaw `
        SELECT state, count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database() 
        GROUP BY state
      `;
            const activeConnections = connectionInfo.find(c => c.state === 'active')?.count || BigInt(0);
            const idleConnections = connectionInfo.find(c => c.state === 'idle')?.count || BigInt(0);
            return {
                active: Number(activeConnections),
                idle: Number(idleConnections),
                total: Number(activeConnections) + Number(idleConnections),
                maxConnections: this.connectionStats.maxConnections,
                queueLength: this.connectionStats.queueLength,
                acquireTimeout: environment_1.config.database.acquireTimeout || 30000
            };
        }
        catch (error) {
            logger_1.logger.warn('Could not get connection statistics', { error });
            return {
                active: 0,
                idle: 0,
                total: 0,
                maxConnections: this.connectionStats.maxConnections,
                queueLength: 0,
                acquireTimeout: environment_1.config.database.acquireTimeout || 30000
            };
        }
    }
    /**
     * Get table performance metrics
     */
    async getTableMetrics() {
        try {
            const tableStats = await this.prisma.$queryRaw `
        SELECT 
          schemaname||'.'||tablename as table_name,
          n_tup_ins + n_tup_upd + n_tup_del as row_count,
          pg_total_relation_size(schemaname||'.'||tablename) as table_size,
          pg_indexes_size(schemaname||'.'||tablename) as index_size
        FROM pg_stat_user_tables 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 20
      `;
            return tableStats.map(stat => ({
                name: stat.table_name,
                rowCount: Number(stat.row_count),
                tableSize: Number(stat.table_size),
                indexSize: Number(stat.index_size),
                avgQueryTime: this.getTableAverageQueryTime(stat.table_name),
                mostCommonQueries: this.getTableCommonQueries(stat.table_name)
            }));
        }
        catch (error) {
            logger_1.logger.warn('Could not get table metrics', { error });
            return [];
        }
    }
    /**
     * Get index analysis
     */
    async getIndexAnalysis() {
        try {
            // Get unused indexes
            const unusedIndexes = await this.prisma.$queryRaw `
        SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
        ORDER BY pg_relation_size(indexrelid) DESC
      `;
            // Get index usage statistics
            const indexUsage = await this.prisma.$queryRaw `
        SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
        FROM pg_stat_user_indexes 
        ORDER BY idx_tup_read DESC
        LIMIT 50
      `;
            return {
                missingIndexes: await this.identifyMissingIndexes(),
                redundantIndexes: unusedIndexes.map(idx => ({
                    table: `${idx.schemaname}.${idx.tablename}`,
                    indexName: idx.indexname,
                    reason: 'Index is never used'
                })),
                indexUsageStats: indexUsage.map(idx => ({
                    table: `${idx.schemaname}.${idx.tablename}`,
                    indexName: idx.indexname,
                    usage: Number(idx.idx_tup_read),
                    scans: Number(idx.idx_tup_read),
                    seeks: Number(idx.idx_tup_fetch)
                }))
            };
        }
        catch (error) {
            logger_1.logger.warn('Could not get index analysis', { error });
            return {
                missingIndexes: [],
                redundantIndexes: [],
                indexUsageStats: []
            };
        }
    }
    /**
     * Identify missing indexes based on query patterns
     */
    async identifyMissingIndexes() {
        // Analyze recent slow queries for potential missing indexes
        const slowQueries = this.getSlowQueries();
        const recommendations = [];
        // Common patterns that indicate missing indexes
        const patterns = [
            // WHERE clauses without indexes
            { pattern: /WHERE\s+(\w+)\s*=/, table: 'users', columns: ['email'], impact: 'high' },
            { pattern: /WHERE\s+(\w+)\s*IN/, table: 'orders', columns: ['userId'], impact: 'high' },
            { pattern: /ORDER\s+BY\s+(\w+)/, table: 'orders', columns: ['createdAt'], impact: 'medium' },
            // Foreign key lookups
            { pattern: /JOIN\s+\w+\s+ON\s+\w+\.(\w+)/, table: 'orders', columns: ['schoolId'], impact: 'high' }
        ];
        for (const query of slowQueries) {
            for (const pattern of patterns) {
                if (pattern.pattern.test(query.query)) {
                    recommendations.push({
                        table: pattern.table,
                        columns: pattern.columns,
                        usage: slowQueries.filter(q => q.query.includes(pattern.table)).length,
                        impact: pattern.impact
                    });
                }
            }
        }
        return recommendations;
    }
    /**
     * Get optimization recommendations
     */
    async getOptimizationRecommendations() {
        const metrics = await this.getPerformanceMetrics();
        const recommendations = [];
        // Analyze slow queries
        for (const slowQuery of metrics.slowQueries) {
            if (slowQuery.duration > 2000) { // 2+ seconds
                recommendations.push({
                    queryPattern: this.extractQueryPattern(slowQuery.query),
                    table: this.extractTableName(slowQuery.query),
                    issue: `Query takes ${slowQuery.duration}ms to execute`,
                    recommendation: 'Add appropriate indexes or optimize query structure',
                    priority: 'high',
                    estimatedImprovement: '50-80% faster execution',
                    implementationSteps: [
                        'Analyze query execution plan',
                        'Identify missing indexes',
                        'Create composite indexes for multi-column WHERE clauses',
                        'Consider query rewriting for better performance'
                    ]
                });
            }
        }
        // Analyze missing indexes
        for (const missingIndex of metrics.indexAnalysis.missingIndexes) {
            if (missingIndex.impact === 'high') {
                recommendations.push({
                    queryPattern: `Queries on ${missingIndex.table}`,
                    table: missingIndex.table,
                    issue: `Missing index on columns: ${missingIndex.columns.join(', ')}`,
                    recommendation: `CREATE INDEX idx_${missingIndex.table}_${missingIndex.columns.join('_')} ON ${missingIndex.table} (${missingIndex.columns.join(', ')})`,
                    priority: missingIndex.impact,
                    estimatedImprovement: '60-90% faster queries',
                    implementationSteps: [
                        `Run: CREATE INDEX CONCURRENTLY idx_${missingIndex.table}_${missingIndex.columns.join('_')} ON ${missingIndex.table} (${missingIndex.columns.join(', ')})`,
                        'Monitor query performance improvement',
                        'Validate index usage with EXPLAIN ANALYZE'
                    ]
                });
            }
        }
        // Connection pool optimization
        if (metrics.performance.connectionPoolUsage > 80) {
            recommendations.push({
                queryPattern: 'Connection Pool',
                table: 'system',
                issue: `High connection pool usage: ${metrics.performance.connectionPoolUsage.toFixed(1)}%`,
                recommendation: 'Increase connection pool size or optimize connection usage',
                priority: 'medium',
                estimatedImprovement: 'Reduced connection wait times',
                implementationSteps: [
                    'Increase DATABASE_POOL_MAX environment variable',
                    'Review long-running transactions',
                    'Implement connection pooling best practices',
                    'Consider using read replicas for read-heavy operations'
                ]
            });
        }
        return recommendations;
    }
    /**
     * Apply automatic optimizations
     */
    async applyAutomaticOptimizations() {
        const applied = [];
        const failed = [];
        const recommendations = await this.getOptimizationRecommendations();
        for (const rec of recommendations) {
            try {
                if (rec.priority === 'high' && rec.table !== 'system') {
                    // Apply safe optimizations only
                    if (rec.recommendation.includes('CREATE INDEX')) {
                        // Create indexes automatically for high-impact recommendations
                        await this.prisma.$executeRawUnsafe(rec.recommendation);
                        applied.push(`Applied: ${rec.recommendation}`);
                        logger_1.logger.info('Applied automatic optimization', { optimization: rec.recommendation });
                    }
                }
            }
            catch (error) {
                failed.push(`Failed: ${rec.recommendation} - ${error}`);
                logger_1.logger.warn('Failed to apply optimization', {
                    optimization: rec.recommendation,
                    error
                });
            }
        }
        return { applied, failed, recommendations };
    }
    // Helper methods
    updateQueryMetrics(query, duration) {
        const pattern = this.extractQueryPattern(query);
        const existing = this.queryMetrics.get(pattern);
        if (existing) {
            existing.count++;
            existing.totalTime += duration;
            existing.avgTime = existing.totalTime / existing.count;
            existing.slowestTime = Math.max(existing.slowestTime, duration);
            existing.lastExecuted = new Date();
        }
        else {
            this.queryMetrics.set(pattern, {
                count: 1,
                totalTime: duration,
                avgTime: duration,
                slowestTime: duration,
                lastExecuted: new Date()
            });
        }
    }
    trackSlowQuery(query, duration, params) {
        logger_1.logger.warn('Slow query detected', {
            query: query.substring(0, 200),
            duration, // Keep as number for proper type
            durationMs: `${duration}ms`, // Add string version for display
            params
        });
        this.emit('slow-query', { query, duration, params, timestamp: new Date() });
    }
    addRecentQuery(query, duration, params) {
        this.recentQueries.push({
            query,
            duration,
            timestamp: new Date(),
            parameters: params
        });
        if (this.recentQueries.length > this.MAX_RECENT_QUERIES) {
            this.recentQueries.shift();
        }
    }
    calculateAverageQueryTime() {
        if (this.recentQueries.length === 0)
            return 0;
        const totalTime = this.recentQueries.reduce((sum, q) => sum + q.duration, 0);
        return totalTime / this.recentQueries.length;
    }
    calculateQueriesPerSecond() {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        const recentQueries = this.recentQueries.filter(q => q.timestamp > oneMinuteAgo);
        return recentQueries.length / 60;
    }
    calculateIndexEfficiency(indexAnalysis) {
        const totalIndexes = indexAnalysis.indexUsageStats.length;
        const usedIndexes = indexAnalysis.indexUsageStats.filter(idx => idx.usage > 0).length;
        return totalIndexes > 0 ? (usedIndexes / totalIndexes) * 100 : 100;
    }
    async getCacheHitRatio() {
        try {
            const result = await this.prisma.$queryRaw `
        SELECT 
          CASE 
            WHEN blks_hit + blks_read = 0 THEN 100 
            ELSE (blks_hit::float / (blks_hit + blks_read) * 100)
          END as cache_hit_ratio
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;
            return result[0]?.cache_hit_ratio || 0;
        }
        catch (error) {
            return 0;
        }
    }
    getSlowQueries() {
        return this.recentQueries
            .filter(q => q.duration > this.SLOW_QUERY_THRESHOLD)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10);
    }
    determineHealthStatus(responseTime, avgQueryTime, slowQueriesCount) {
        if (responseTime > 5000 || avgQueryTime > 1000 || slowQueriesCount > 10) {
            return 'unhealthy';
        }
        else if (responseTime > 1000 || avgQueryTime > 500 || slowQueriesCount > 5) {
            return 'degraded';
        }
        return 'healthy';
    }
    updateConnectionStats() {
        // This would typically interface with the actual connection pool
        // For now, we'll simulate based on query activity
        const recentActivity = this.recentQueries.filter(q => q.timestamp > new Date(Date.now() - 10000)).length;
        this.connectionStats.active = Math.min(recentActivity, this.connectionStats.maxConnections);
        this.connectionStats.idle = this.connectionStats.maxConnections - this.connectionStats.active;
        this.connectionStats.total = this.connectionStats.active + this.connectionStats.idle;
    }
    emitPerformanceMetrics() {
        const metrics = {
            avgQueryTime: this.calculateAverageQueryTime(),
            queriesPerSecond: this.calculateQueriesPerSecond(),
            slowQueriesCount: this.getSlowQueries().length,
            connectionPoolUsage: (this.connectionStats.active / this.connectionStats.maxConnections) * 100
        };
        this.emit('performance-metrics', metrics);
    }
    addToPerformanceHistory(metrics) {
        this.performanceHistory.push({
            timestamp: new Date(),
            metrics
        });
        if (this.performanceHistory.length > this.PERFORMANCE_HISTORY_LIMIT) {
            this.performanceHistory.shift();
        }
    }
    async checkForOptimizationOpportunities(metrics) {
        // Auto-trigger optimizations for critical issues
        if (metrics.status === 'unhealthy') {
            logger_1.logger.warn('Database performance is unhealthy, triggering automatic optimizations');
            try {
                const results = await this.applyAutomaticOptimizations();
                if (results.applied.length > 0) {
                    logger_1.logger.info('Applied automatic optimizations', { applied: results.applied });
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to apply automatic optimizations', { error });
            }
        }
    }
    extractQueryPattern(query) {
        // Extract pattern by removing specific values
        return query
            .replace(/\$\d+/g, '$?')
            .replace(/'[^']*'/g, "'?'")
            .replace(/\d+/g, '?')
            .substring(0, 100);
    }
    extractTableName(query) {
        const match = query.match(/(?:FROM|JOIN|UPDATE|INTO)\s+["`]?(\w+)["`]?/i);
        return match ? match[1] : 'unknown';
    }
    getTableAverageQueryTime(tableName) {
        const tableQueries = this.recentQueries.filter(q => q.query.toLowerCase().includes(tableName.toLowerCase()));
        if (tableQueries.length === 0)
            return 0;
        const totalTime = tableQueries.reduce((sum, q) => sum + q.duration, 0);
        return totalTime / tableQueries.length;
    }
    getTableCommonQueries(tableName) {
        const tableQueries = this.recentQueries
            .filter(q => q.query.toLowerCase().includes(tableName.toLowerCase()))
            .map(q => this.extractQueryPattern(q.query));
        const queryFrequency = new Map();
        tableQueries.forEach(query => {
            queryFrequency.set(query, (queryFrequency.get(query) || 0) + 1);
        });
        return Array.from(queryFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([query]) => query);
    }
    /**
     * Cleanup resources
     */
    async disconnect() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        await this.prisma.$disconnect();
        logger_1.logger.info('Database Performance Service disconnected');
    }
}
exports.DatabasePerformanceService = DatabasePerformanceService;
exports.databasePerformanceService = new DatabasePerformanceService();
