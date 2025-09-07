"use strict";
/**
 * Database Manager for HASIVU Platform
 * Centralized database connection management and utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class DatabaseManager {
    static instance;
    prisma;
    logger = logger_1.Logger.getInstance();
    config;
    startTime;
    metrics;
    isInitialized = false;
    constructor(config) {
        this.config = config;
        this.startTime = new Date();
        this.metrics = {
            totalQueries: 0,
            avgExecutionTime: 0,
            slowQueries: 0,
            errorRate: 0,
            lastReset: new Date()
        };
        this.initializePrisma();
    }
    static getInstance(config) {
        if (!DatabaseManager.instance) {
            if (!config) {
                throw new Error('DatabaseManager requires configuration on first initialization');
            }
            DatabaseManager.instance = new DatabaseManager(config);
        }
        return DatabaseManager.instance;
    }
    /**
     * Initialize Prisma client with configuration
     */
    initializePrisma() {
        try {
            this.prisma = new client_1.PrismaClient({
                datasources: {
                    db: {
                        url: this.config.url
                    }
                },
                log: this.config.enableLogging ? [
                    { emit: 'event', level: 'query' },
                    { emit: 'event', level: 'error' },
                    { emit: 'event', level: 'info' },
                    { emit: 'event', level: 'warn' }
                ] : [],
                errorFormat: 'pretty'
            });
            if (this.config.enableLogging) {
                this.setupPrismaLogging();
            }
            this.isInitialized = true;
            this.logger.info('Database manager initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize database manager', { error, config: this.config });
            throw new errors_1.DatabaseError('initialization', 'Failed to initialize database manager', error);
        }
    }
    /**
     * Setup Prisma event logging
     */
    setupPrismaLogging() {
        // Type-safe Prisma event handling with proper event interface
        this.prisma.$on('query', (e) => {
            const queryTime = parseFloat(e.duration);
            this.updateQueryMetrics(queryTime);
            if (this.config.logLevel === 'query') {
                this.logger.info('Database query executed', {
                    query: e.query,
                    params: e.params,
                    duration: queryTime,
                    target: e.target
                });
            }
            // Log slow queries
            if (queryTime > 1000) { // 1 second threshold
                this.metrics.slowQueries++;
                this.logger.warn('Slow query detected', {
                    query: e.query,
                    duration: queryTime,
                    target: e.target
                });
            }
        });
        this.prisma.$on('error', (e) => {
            this.metrics.errorRate++;
            this.logger.error('Database error', {
                target: e.target,
                message: e.message,
                timestamp: e.timestamp
            });
        });
        this.prisma.$on('info', (e) => {
            if (this.config.logLevel === 'info') {
                this.logger.info('Database info', {
                    target: e.target,
                    message: e.message,
                    timestamp: e.timestamp
                });
            }
        });
        this.prisma.$on('warn', (e) => {
            this.logger.warn('Database warning', {
                target: e.target,
                message: e.message,
                timestamp: e.timestamp
            });
        });
    }
    /**
     * Get Prisma client instance
     */
    getClient() {
        if (!this.isInitialized) {
            throw new errors_1.DatabaseError('connection', 'Database manager not initialized');
        }
        return this.prisma;
    }
    /**
     * Connect to database
     */
    async connect() {
        try {
            await this.prisma.$connect();
            this.logger.info('Database connection established');
        }
        catch (error) {
            this.logger.error('Failed to connect to database', { error });
            throw new errors_1.DatabaseError('connection', 'Failed to connect to database', error);
        }
    }
    /**
     * Disconnect from database
     */
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            this.logger.info('Database connection closed');
        }
        catch (error) {
            this.logger.error('Error disconnecting from database', { error });
            throw new errors_1.DatabaseError('disconnection', 'Failed to disconnect from database', error);
        }
    }
    /**
     * Check database health
     */
    async healthCheck() {
        try {
            // Simple query to test connection
            await this.prisma.$queryRaw `SELECT 1`;
            const uptime = Date.now() - this.startTime.getTime();
            return {
                isConnected: true,
                activeConnections: 1, // Prisma manages connection pooling internally
                maxConnections: this.config.maxConnections || 10,
                lastHealthCheck: new Date(),
                uptime: Math.floor(uptime / 1000) // Convert to seconds
            };
        }
        catch (error) {
            this.logger.error('Database health check failed', { error });
            return {
                isConnected: false,
                activeConnections: 0,
                maxConnections: this.config.maxConnections || 10,
                lastHealthCheck: new Date(),
                uptime: 0
            };
        }
    }
    /**
     * Execute raw SQL query
     */
    async executeRaw(query, params = []) {
        try {
            const startTime = Date.now();
            const result = await this.prisma.$queryRawUnsafe(query, ...params);
            const duration = Date.now() - startTime;
            this.updateQueryMetrics(duration);
            this.logger.info('Raw query executed', { query, duration, resultCount: result.length });
            return result;
        }
        catch (error) {
            this.metrics.errorRate++;
            this.logger.error('Raw query execution failed', { query, params, error });
            throw new errors_1.DatabaseError('query', `Raw query execution failed: ${query}`, error);
        }
    }
    /**
     * Execute transaction
     */
    async transaction(callback, options) {
        try {
            const startTime = Date.now();
            const result = await this.prisma.$transaction(callback, {
                timeout: options?.timeout || this.config.queryTimeout || 5000,
                isolationLevel: options?.isolationLevel,
                maxWait: options?.maxWait || 2000
            });
            const duration = Date.now() - startTime;
            this.updateQueryMetrics(duration);
            this.logger.info('Transaction completed successfully', { duration });
            return result;
        }
        catch (error) {
            this.metrics.errorRate++;
            this.logger.error('Transaction failed', { error, options });
            throw new errors_1.DatabaseError('transaction', 'Transaction execution failed', error);
        }
    }
    /**
     * Reset database (for testing purposes)
     */
    async reset() {
        try {
            await this.prisma.$executeRaw `TRUNCATE TABLE "User", "Order", "Payment", "Child" CASCADE`;
            this.logger.info('Database reset completed');
        }
        catch (error) {
            this.logger.error('Database reset failed', { error });
            throw new errors_1.DatabaseError('reset', 'Database reset failed', error);
        }
    }
    /**
     * Run database migrations
     */
    async migrate() {
        try {
            // This would typically use Prisma migrate commands
            // For now, we'll log that migration would be needed
            this.logger.info('Migration check - use "npx prisma migrate deploy" to run migrations');
        }
        catch (error) {
            this.logger.error('Migration check failed', { error });
            throw new errors_1.DatabaseError('migration', 'Migration failed', error);
        }
    }
    /**
     * Get query metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Reset query metrics
     */
    resetMetrics() {
        this.metrics = {
            totalQueries: 0,
            avgExecutionTime: 0,
            slowQueries: 0,
            errorRate: 0,
            lastReset: new Date()
        };
        this.logger.info('Query metrics reset');
    }
    /**
     * Update query execution metrics
     */
    updateQueryMetrics(duration) {
        const oldTotal = this.metrics.totalQueries;
        const oldAvg = this.metrics.avgExecutionTime;
        this.metrics.totalQueries++;
        this.metrics.avgExecutionTime = ((oldAvg * oldTotal) + duration) / this.metrics.totalQueries;
    }
    /**
     * Create database backup (placeholder for production implementation)
     */
    async createBackup(backupName) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const name = backupName || `backup_${timestamp}`;
            // In production, this would create an actual database backup
            this.logger.info('Database backup created (placeholder)', { backupName: name });
            return name;
        }
        catch (error) {
            this.logger.error('Database backup failed', { error, backupName });
            throw new errors_1.DatabaseError('backup', 'Database backup failed', error);
        }
    }
    /**
     * Restore database from backup (placeholder for production implementation)
     */
    async restoreBackup(backupName) {
        try {
            // In production, this would restore from an actual database backup
            this.logger.info('Database restore completed (placeholder)', { backupName });
        }
        catch (error) {
            this.logger.error('Database restore failed', { error, backupName });
            throw new errors_1.DatabaseError('restore', 'Database restore failed', error);
        }
    }
    /**
     * Get database configuration (without sensitive data)
     */
    getConfig() {
        const { url, ...safeConfig } = this.config;
        return safeConfig;
    }
    /**
     * Check if database is initialized
     */
    isReady() {
        return this.isInitialized;
    }
}
exports.DatabaseManager = DatabaseManager;
