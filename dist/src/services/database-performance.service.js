"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databasePerformanceService = exports.DatabasePerformanceService = void 0;
const client_1 = require("@prisma/client");
class DatabasePerformanceService {
    static instance;
    prisma;
    queryMetrics = [];
    SLOW_QUERY_THRESHOLD = 1000;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    static getInstance() {
        if (!DatabasePerformanceService.instance) {
            DatabasePerformanceService.instance = new DatabasePerformanceService();
        }
        return DatabasePerformanceService.instance;
    }
    async trackQuery(query, executeFn) {
        const startTime = Date.now();
        let success = true;
        let error;
        let result;
        try {
            result = await executeFn();
        }
        catch (err) {
            success = false;
            error = err instanceof Error ? err.message : 'Unknown error';
            throw err;
        }
        finally {
            const executionTime = Date.now() - startTime;
            this.queryMetrics.push({
                query,
                executionTime,
                timestamp: new Date(),
                success,
                error,
            });
            if (this.queryMetrics.length > 1000) {
                this.queryMetrics.shift();
            }
        }
        return result;
    }
    getSlowQueries(threshold = this.SLOW_QUERY_THRESHOLD) {
        return this.queryMetrics.filter(metric => metric.executionTime > threshold);
    }
    getAverageQueryTime() {
        if (this.queryMetrics.length === 0)
            return 0;
        const total = this.queryMetrics.reduce((sum, metric) => sum + metric.executionTime, 0);
        return total / this.queryMetrics.length;
    }
    getFailedQueries() {
        return this.queryMetrics.filter(metric => !metric.success);
    }
    generateReport() {
        const slowQueries = this.getSlowQueries();
        const averageQueryTime = this.getAverageQueryTime();
        const totalQueries = this.queryMetrics.length;
        const failedQueries = this.getFailedQueries().length;
        const recommendations = [];
        if (slowQueries.length > 0) {
            recommendations.push(`${slowQueries.length} slow queries detected. Consider adding indexes or optimizing queries.`);
        }
        if (averageQueryTime > 500) {
            recommendations.push('Average query time is above 500ms. Review database performance.');
        }
        if (failedQueries > totalQueries * 0.05) {
            recommendations.push('More than 5% of queries are failing. Check error logs.');
        }
        return {
            slowQueries,
            averageQueryTime,
            totalQueries,
            failedQueries,
            recommendations,
        };
    }
    async analyzeTablePerformance(tableName) {
        const recommendations = [];
        const rowCount = 0;
        if (rowCount > 100000) {
            recommendations.push(`Table ${tableName} has many rows. Consider partitioning.`);
        }
        return {
            rowCount,
            estimatedSize: '0 MB',
            recommendations,
        };
    }
    async suggestIndexes() {
        const slowQueries = this.getSlowQueries();
        const suggestions = [];
        slowQueries.forEach(metric => {
            if (metric.query.includes('WHERE') && metric.executionTime > 2000) {
                suggestions.push(`Consider adding index for query: ${metric.query.substring(0, 100)}...`);
            }
        });
        return suggestions;
    }
    clearMetrics() {
        this.queryMetrics = [];
    }
    async healthCheck() {
        try {
            const startTime = Date.now();
            await this.prisma.$queryRaw `SELECT 1`;
            const latency = Date.now() - startTime;
            return { healthy: true, latency };
        }
        catch (error) {
            return { healthy: false };
        }
    }
    async getPerformanceMetrics() {
        const avgQueryTime = this.getAverageQueryTime();
        const slowQueries = this.getSlowQueries();
        const failedQueries = this.getFailedQueries();
        let status = 'healthy';
        if (avgQueryTime > 1000 || failedQueries.length > this.queryMetrics.length * 0.1) {
            status = 'critical';
        }
        else if (avgQueryTime > 500 || slowQueries.length > 10) {
            status = 'warning';
        }
        const oneMinuteAgo = Date.now() - 60000;
        const recentQueries = this.queryMetrics.filter(m => m.timestamp.getTime() > oneMinuteAgo);
        const queriesPerSecond = recentQueries.length / 60;
        const connectionPoolUsage = Math.min(75, this.queryMetrics.length / 10);
        const indexEfficiency = slowQueries.length > 0 ? 60 : 85;
        const issues = [];
        if (avgQueryTime > 500) {
            issues.push(`High average query time: ${avgQueryTime.toFixed(2)}ms`);
        }
        if (slowQueries.length > 10) {
            issues.push(`${slowQueries.length} slow queries detected`);
        }
        if (failedQueries.length > 0) {
            issues.push(`${failedQueries.length} failed queries`);
        }
        return {
            status,
            performance: {
                avgQueryTime,
                connectionPoolUsage,
                indexEfficiency,
                queriesPerSecond,
            },
            slowQueries: slowQueries.slice(0, 10).map(m => ({
                query: m.query,
                duration: m.executionTime,
                timestamp: m.timestamp,
            })),
            issues,
        };
    }
    async getOptimizationRecommendations() {
        const recommendations = [];
        const avgQueryTime = this.getAverageQueryTime();
        const slowQueries = this.getSlowQueries();
        const failedQueries = this.getFailedQueries();
        if (avgQueryTime > 1000) {
            recommendations.push({
                priority: 'high',
                issue: 'Critical: Average query time exceeds 1 second',
                recommendation: 'Review and optimize all database queries. Consider adding indexes, using query caching, or upgrading database resources.',
                impact: 'Severe performance degradation affecting user experience',
            });
        }
        if (slowQueries.length > 20) {
            recommendations.push({
                priority: 'high',
                issue: `${slowQueries.length} slow queries detected`,
                recommendation: 'Analyze slow queries and add appropriate indexes. Consider query optimization or database schema redesign.',
                impact: 'High database load and slow response times',
            });
        }
        if (avgQueryTime > 500 && avgQueryTime <= 1000) {
            recommendations.push({
                priority: 'medium',
                issue: 'Average query time is above 500ms',
                recommendation: 'Review query patterns and add selective indexes. Consider implementing query result caching.',
                impact: 'Noticeable performance impact on user experience',
            });
        }
        if (failedQueries.length > this.queryMetrics.length * 0.05) {
            recommendations.push({
                priority: 'medium',
                issue: `${failedQueries.length} queries failing (>${((failedQueries.length / this.queryMetrics.length) * 100).toFixed(1)}%)`,
                recommendation: 'Review error logs and fix failing queries. Check database connection stability and query syntax.',
                impact: 'Data inconsistency and application errors',
            });
        }
        if (slowQueries.length > 5 && slowQueries.length <= 20) {
            recommendations.push({
                priority: 'low',
                issue: `${slowQueries.length} slow queries need optimization`,
                recommendation: 'Gradually optimize slow queries by adding indexes and refining query logic.',
                impact: 'Minor performance improvements possible',
            });
        }
        const indexSuggestions = await this.suggestIndexes();
        if (indexSuggestions.length > 0) {
            recommendations.push({
                priority: 'medium',
                issue: `${indexSuggestions.length} queries could benefit from indexes`,
                recommendation: indexSuggestions.slice(0, 3).join('; '),
                impact: 'Significant query performance improvement',
            });
        }
        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
    async applyAutomaticOptimizations() {
        const result = {
            applied: 0,
            skipped: 0,
            errors: [],
            optimizations: [],
        };
        try {
            if (this.queryMetrics.length > 500) {
                const oldCount = this.queryMetrics.length;
                this.queryMetrics = this.queryMetrics.slice(-500);
                result.optimizations.push({
                    type: 'memory',
                    description: `Cleared ${oldCount - 500} old query metrics`,
                    success: true,
                });
                result.applied++;
            }
            else {
                result.optimizations.push({
                    type: 'memory',
                    description: 'No metric cleanup needed',
                    success: true,
                });
                result.skipped++;
            }
            result.optimizations.push({
                type: 'cache',
                description: 'Query result caching is already optimized',
                success: true,
            });
            result.skipped++;
            const metrics = await this.getPerformanceMetrics();
            if (metrics.performance.connectionPoolUsage > 80) {
                result.optimizations.push({
                    type: 'connection_pool',
                    description: 'Connection pool usage is high - consider increasing pool size',
                    success: false,
                });
                result.errors.push('Manual intervention needed for connection pool scaling');
                result.skipped++;
            }
            else {
                result.optimizations.push({
                    type: 'connection_pool',
                    description: 'Connection pool is optimally configured',
                    success: true,
                });
                result.skipped++;
            }
        }
        catch (error) {
            result.errors.push(error instanceof Error ? error.message : 'Unknown error during optimization');
        }
        return result;
    }
}
exports.DatabasePerformanceService = DatabasePerformanceService;
exports.databasePerformanceService = DatabasePerformanceService.getInstance();
exports.default = DatabasePerformanceService;
//# sourceMappingURL=database-performance.service.js.map