"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.getPrismaClient = exports.DatabaseManager = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class DatabaseManager {
    static instance;
    prisma;
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
            lastReset: new Date(),
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
    initializePrisma() {
        try {
            this.prisma = new client_1.PrismaClient({
                datasources: {
                    db: {
                        url: this.config.url,
                    },
                },
                log: this.config.enableLogging
                    ? [
                        { emit: 'event', level: 'query' },
                        { emit: 'event', level: 'error' },
                        { emit: 'event', level: 'info' },
                        { emit: 'event', level: 'warn' },
                    ]
                    : [],
                errorFormat: 'pretty',
            });
            if (this.config.enableLogging) {
                this.setupPrismaLogging();
            }
            this.isInitialized = true;
            logger_1.logger.info('Database manager initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize database manager', error, {
                config: this.config,
            });
            throw new errors_1.DatabaseError('Failed to initialize database manager', 'INITIALIZATION_ERROR');
        }
    }
    setupPrismaLogging() {
        this.prisma.$on('query', (e) => {
            const queryTime = parseFloat(e.duration);
            this.updateQueryMetrics(queryTime);
            if (this.config.logLevel === 'query') {
                logger_1.logger.info('Database query executed', {
                    query: e.query,
                    params: e.params,
                    duration: queryTime,
                    target: e.target,
                });
            }
            if (queryTime > 1000) {
                this.metrics.slowQueries++;
                logger_1.logger.warn('Slow query detected', {
                    query: e.query,
                    duration: queryTime,
                    target: e.target,
                });
            }
        });
        this.prisma.$on('error', (e) => {
            this.metrics.errorRate++;
            logger_1.logger.error('Database error', undefined, {
                target: e.target,
                message: e.message,
                timestamp: e.timestamp,
            });
        });
        this.prisma.$on('info', (e) => {
            if (this.config.logLevel === 'info') {
                logger_1.logger.info('Database info', {
                    target: e.target,
                    message: e.message,
                    timestamp: e.timestamp,
                });
            }
        });
        this.prisma.$on('warn', (e) => {
            logger_1.logger.warn('Database warning', {
                target: e.target,
                message: e.message,
                timestamp: e.timestamp,
            });
        });
    }
    getClient() {
        if (!this.isInitialized) {
            throw new errors_1.DatabaseError('connection', 'Database manager not initialized');
        }
        return this.prisma;
    }
    async connect() {
        try {
            await this.prisma.$connect();
            logger_1.logger.info('Database connection established');
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to database', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            throw new errors_1.DatabaseError('Failed to connect to database', 'CONNECTION_ERROR');
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            logger_1.logger.info('Database connection closed');
        }
        catch (error) {
            logger_1.logger.error('Error disconnecting from database', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            throw new errors_1.DatabaseError('Failed to disconnect from database', 'DISCONNECTION_ERROR');
        }
    }
    async healthCheck() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            const uptime = Date.now() - this.startTime.getTime();
            return {
                isConnected: true,
                activeConnections: 1,
                maxConnections: this.config.maxConnections || 10,
                lastHealthCheck: new Date(),
                uptime: Math.floor(uptime / 1000),
            };
        }
        catch (error) {
            logger_1.logger.error('Database health check failed', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            return {
                isConnected: false,
                activeConnections: 0,
                maxConnections: this.config.maxConnections || 10,
                lastHealthCheck: new Date(),
                uptime: 0,
            };
        }
    }
    async executeRaw(query, params = []) {
        try {
            const startTime = Date.now();
            const result = await this.prisma.$queryRawUnsafe(query, ...params);
            const duration = Date.now() - startTime;
            this.updateQueryMetrics(duration);
            logger_1.logger.info('Raw query executed', { query, duration, resultCount: result.length });
            return result;
        }
        catch (error) {
            this.metrics.errorRate++;
            logger_1.logger.error('Raw query execution failed', error, { query, params });
            throw new errors_1.DatabaseError(`Raw query execution failed: ${query}`, 'QUERY_ERROR');
        }
    }
    async transaction(callback, options) {
        try {
            const startTime = Date.now();
            const result = await this.prisma.$transaction(callback, {
                timeout: options?.timeout || this.config.queryTimeout || 5000,
                isolationLevel: options?.isolationLevel,
                maxWait: options?.maxWait || 2000,
            });
            const duration = Date.now() - startTime;
            this.updateQueryMetrics(duration);
            logger_1.logger.info('Transaction completed successfully', { duration });
            return result;
        }
        catch (error) {
            this.metrics.errorRate++;
            logger_1.logger.error('Transaction failed', error, { options });
            throw new errors_1.DatabaseError('Transaction execution failed', 'TRANSACTION_ERROR');
        }
    }
    async reset() {
        try {
            await this.prisma.$executeRaw `TRUNCATE TABLE "User", "Order", "Payment", "Child" CASCADE`;
            logger_1.logger.info('Database reset completed');
        }
        catch (error) {
            logger_1.logger.error('Database reset failed', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            throw new errors_1.DatabaseError('Database reset failed', 'RESET_ERROR');
        }
    }
    async migrate() {
        try {
            logger_1.logger.info('Migration check - use "npx prisma migrate deploy" to run migrations');
        }
        catch (error) {
            logger_1.logger.error('Migration check failed', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            throw new errors_1.DatabaseError('Migration failed', 'MIGRATION_ERROR');
        }
    }
    getMetrics() {
        return { ...this.metrics };
    }
    resetMetrics() {
        this.metrics = {
            totalQueries: 0,
            avgExecutionTime: 0,
            slowQueries: 0,
            errorRate: 0,
            lastReset: new Date(),
        };
        logger_1.logger.info('Query metrics reset');
    }
    updateQueryMetrics(duration) {
        const oldTotal = this.metrics.totalQueries;
        const oldAvg = this.metrics.avgExecutionTime;
        this.metrics.totalQueries++;
        this.metrics.avgExecutionTime = (oldAvg * oldTotal + duration) / this.metrics.totalQueries;
    }
    async createBackup(backupName) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const name = backupName || `backup_${timestamp}`;
            logger_1.logger.info('Database backup created (placeholder)', { backupName: name });
            return name;
        }
        catch (error) {
            logger_1.logger.error('Database backup failed', error, { backupName });
            throw new errors_1.DatabaseError('Database backup failed', 'BACKUP_ERROR');
        }
    }
    async restoreBackup(backupName) {
        try {
            logger_1.logger.info('Database restore completed (placeholder)', { backupName });
        }
        catch (error) {
            logger_1.logger.error('Database restore failed', error, { backupName });
            throw new errors_1.DatabaseError('Database restore failed', 'RESTORE_ERROR');
        }
    }
    getConfig() {
        const { url, ...safeConfig } = this.config;
        return safeConfig;
    }
    isReady() {
        return this.isInitialized;
    }
    getPrismaClient() {
        if (!this.isInitialized) {
            throw new errors_1.DatabaseError('Database not initialized. Call initialize() first.', 'NOT_INITIALIZED');
        }
        return this.prisma;
    }
}
exports.DatabaseManager = DatabaseManager;
function getPrismaClient() {
    const dbManager = DatabaseManager.getInstance();
    return dbManager.getPrismaClient();
}
exports.getPrismaClient = getPrismaClient;
let prismaInstance = null;
exports.prisma = new Proxy({}, {
    get(_target, prop) {
        if (!prismaInstance) {
            try {
                prismaInstance = DatabaseManager.getInstance().getPrismaClient();
            }
            catch (error) {
                return () => {
                    throw new Error('Database not initialized. Call DatabaseManager.getInstance().initialize() first.');
                };
            }
        }
        return prismaInstance[prop];
    },
});
//# sourceMappingURL=DatabaseManager.js.map