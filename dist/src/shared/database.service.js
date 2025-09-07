"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = exports.DatabaseService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class DatabaseService {
    static instance;
    client;
    isConnected = false;
    connectionAttempts = 0;
    lastConnectionTime = null;
    queryMetrics = [];
    connectionMetrics;
    healthStatus;
    maxRetries = 3;
    retryDelay = 1000;
    constructor() {
        this.initializeConnectionMetrics();
        this.initializeHealthStatus();
        this.initializeClient();
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    initializeConnectionMetrics() {
        this.connectionMetrics = {
            created: 0,
            destroyed: 0,
            active: 0,
            idle: 0,
            pending: 0,
            errors: 0,
            totalQueries: 0,
            slowQueries: 0,
            averageLatency: 0,
            uptime: Date.now(),
            lastActivity: new Date()
        };
    }
    initializeHealthStatus() {
        this.healthStatus = {
            status: 'healthy',
            latency: 0,
            connections: {
                active: 0,
                idle: 0,
                total: 0,
                max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '100')
            },
            performance: {
                averageQueryTime: 0,
                slowQueries: 0,
                totalQueries: 0
            },
            lastCheck: new Date(),
            errors: [],
            uptime: Date.now()
        };
    }
    initializeClient() {
        try {
            const config = this.getConfiguration();
            this.client = new client_1.PrismaClient({
                datasources: {
                    db: {
                        url: config.url
                    }
                },
                log: config.enableLogging ? [
                    { emit: 'event', level: 'query' },
                    { emit: 'event', level: 'error' },
                    { emit: 'event', level: 'warn' }
                ] : [],
                errorFormat: 'pretty'
            });
            if (config.enableLogging) {
                this.client.$on('query', (event) => {
                    const queryTime = parseFloat(event.duration);
                    const isSlowQuery = queryTime > config.slowQueryThreshold;
                    this.trackQueryPerformance({
                        query: event.query,
                        params: event.params,
                        duration: queryTime,
                        timestamp: new Date(),
                        target: event.target,
                        slow: isSlowQuery
                    });
                    if (process.env.NODE_ENV === 'development' || isSlowQuery) {
                        logger_1.logger.debug('Database query executed', {
                            query: event.query,
                            params: event.params,
                            duration: queryTime,
                            target: event.target,
                            slow: isSlowQuery
                        });
                    }
                });
                this.client.$on('error', (event) => {
                    this.connectionMetrics.errors++;
                    this.healthStatus.errors.push(event.message);
                    logger_1.logger.error('Database error', {
                        message: event.message,
                        timestamp: event.timestamp
                    });
                });
                this.client.$on('warn', (event) => {
                    logger_1.logger.warn('Database warning', {
                        message: event.message,
                        timestamp: event.timestamp
                    });
                });
            }
            logger_1.logger.info('Database service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize database service', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    getConfiguration() {
        return {
            url: process.env.DATABASE_URL || '',
            maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '100'),
            connectionTimeoutMs: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'),
            queryTimeoutMs: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000'),
            slowQueryThreshold: parseInt(process.env.DATABASE_SLOW_QUERY_THRESHOLD || '1000'),
            enableLogging: process.env.DATABASE_LOGGING === 'true',
            enableMetrics: process.env.DATABASE_METRICS === 'true',
            poolConfig: {
                min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
                max: parseInt(process.env.DATABASE_POOL_MAX || '100'),
                acquireTimeoutMillis: parseInt(process.env.DATABASE_POOL_ACQUIRE_TIMEOUT || '60000'),
                idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '300000')
            }
        };
    }
    async connect() {
        if (this.isConnected) {
            return;
        }
        const startTime = Date.now();
        this.connectionAttempts++;
        try {
            logger_1.logger.info('Attempting to connect to database', {
                attempt: this.connectionAttempts,
                maxRetries: this.maxRetries
            });
            await this.client.$connect();
            await this.client.$queryRaw `SELECT 1`;
            this.isConnected = true;
            this.lastConnectionTime = new Date();
            this.connectionMetrics.created++;
            this.connectionMetrics.lastActivity = new Date();
            const connectionTime = Date.now() - startTime;
            logger_1.logger.info('Successfully connected to database', {
                attempt: this.connectionAttempts,
                connectionTime: `${connectionTime}ms`,
                timestamp: this.lastConnectionTime
            });
            this.connectionAttempts = 0;
        }
        catch (error) {
            this.connectionMetrics.errors++;
            logger_1.logger.error('Database connection failed', {
                attempt: this.connectionAttempts,
                maxRetries: this.maxRetries,
                error: error.message,
                duration: `${Date.now() - startTime}ms`
            });
            if (this.connectionAttempts < this.maxRetries) {
                const delay = this.retryDelay * Math.pow(2, this.connectionAttempts - 1);
                logger_1.logger.info(`Retrying database connection in ${delay}ms`, {
                    nextAttempt: this.connectionAttempts + 1,
                    maxRetries: this.maxRetries
                });
                await this.delay(delay);
                return this.connect();
            }
            else {
                logger_1.logger.error('Max database connection attempts exceeded', {
                    attempts: this.connectionAttempts,
                    maxRetries: this.maxRetries
                });
                throw new Error(`Database connection failed after ${this.maxRetries} attempts: ${error.message}`);
            }
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await this.client.$disconnect();
            this.isConnected = false;
            this.connectionMetrics.destroyed++;
            logger_1.logger.info('Disconnected from database successfully');
        }
        catch (error) {
            logger_1.logger.error('Error disconnecting from database', {
                error: error.message
            });
            throw error;
        }
    }
    getPrismaClient() {
        if (!this.isConnected) {
            logger_1.logger.warn('Database client requested but not connected. Attempting to connect...');
            this.connect().catch(error => {
                logger_1.logger.error('Failed to auto-connect database', { error: error.message });
            });
        }
        return this.client;
    }
    async executeOperation(operation, operationName = 'unknown') {
        const startTime = Date.now();
        try {
            await this.connect();
            const result = await operation(this.client);
            const duration = Date.now() - startTime;
            this.connectionMetrics.totalQueries++;
            this.connectionMetrics.lastActivity = new Date();
            this.connectionMetrics.averageLatency =
                (this.connectionMetrics.averageLatency * (this.connectionMetrics.totalQueries - 1) + duration)
                    / this.connectionMetrics.totalQueries;
            logger_1.logger.debug('Database operation completed', {
                operation: operationName,
                duration: duration,
                totalQueries: this.connectionMetrics.totalQueries
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.connectionMetrics.errors++;
            logger_1.logger.error('Database operation failed', {
                operation: operationName,
                duration: `${duration}ms`,
                error: error.message,
                stack: error.stack
            });
            if (this.isConnectionError(error)) {
                this.isConnected = false;
                logger_1.logger.warn('Connection lost, will attempt to reconnect on next operation');
            }
            throw error;
        }
    }
    isConnectionError(error) {
        const connectionErrorMessages = [
            'connection',
            'timeout',
            'network',
            'ECONNREFUSED',
            'ENOTFOUND',
            'ETIMEDOUT',
            'Client has already been connected',
            'Connection terminated unexpectedly'
        ];
        const errorMessage = error.message?.toLowerCase() || '';
        return connectionErrorMessages.some(msg => errorMessage.includes(msg));
    }
    trackQueryPerformance(performance) {
        this.queryMetrics.push(performance);
        if (performance.slow) {
            this.connectionMetrics.slowQueries++;
        }
        if (this.queryMetrics.length > 1000) {
            this.queryMetrics = this.queryMetrics.slice(-1000);
        }
        this.updateHealthStatus();
    }
    updateHealthStatus() {
        const now = new Date();
        const config = this.getConfiguration();
        const totalQueries = this.connectionMetrics.totalQueries;
        const slowQueries = this.connectionMetrics.slowQueries;
        const averageLatency = this.connectionMetrics.averageLatency;
        const errorRate = totalQueries > 0 ? (this.connectionMetrics.errors / totalQueries) * 100 : 0;
        let status = 'healthy';
        if (!this.isConnected || errorRate > 10 || averageLatency > config.slowQueryThreshold * 2) {
            status = 'unhealthy';
        }
        else if (errorRate > 5 || averageLatency > config.slowQueryThreshold || (slowQueries / totalQueries) > 0.1) {
            status = 'degraded';
        }
        this.healthStatus = {
            status,
            latency: averageLatency,
            connections: {
                active: this.connectionMetrics.active,
                idle: this.connectionMetrics.idle,
                total: this.connectionMetrics.active + this.connectionMetrics.idle,
                max: config.maxConnections
            },
            performance: {
                averageQueryTime: averageLatency,
                slowQueries: slowQueries,
                totalQueries: totalQueries
            },
            lastCheck: now,
            errors: this.healthStatus.errors.slice(-10),
            uptime: now.getTime() - this.connectionMetrics.uptime
        };
    }
    async getHealthStatus() {
        try {
            const healthCheckStart = Date.now();
            await this.client.$queryRaw `SELECT 1 as health_check`;
            const healthCheckLatency = Date.now() - healthCheckStart;
            this.healthStatus.latency = healthCheckLatency;
            this.healthStatus.lastCheck = new Date();
            this.healthStatus.connections.active = this.isConnected ? 1 : 0;
            return { ...this.healthStatus };
        }
        catch (error) {
            logger_1.logger.error('Health check failed', { error: error.message });
            return {
                ...this.healthStatus,
                status: 'unhealthy',
                latency: -1,
                lastCheck: new Date(),
                errors: [...this.healthStatus.errors, error.message].slice(-10)
            };
        }
    }
    getConnectionMetrics() {
        return { ...this.connectionMetrics };
    }
    getQueryMetrics(limit = 100) {
        return this.queryMetrics.slice(-limit);
    }
    getSlowQueries(limit = 50) {
        return this.queryMetrics
            .filter(metric => metric.slow)
            .slice(-limit);
    }
    clearMetrics() {
        this.queryMetrics = [];
        this.connectionMetrics.slowQueries = 0;
        this.connectionMetrics.totalQueries = 0;
        this.connectionMetrics.averageLatency = 0;
        logger_1.logger.info('Database metrics cleared');
    }
    async testConnection() {
        const startTime = Date.now();
        try {
            await this.connect();
            const result = await this.client.$queryRaw `SELECT version() as version, current_timestamp as timestamp`;
            const latency = Date.now() - startTime;
            return {
                connected: true,
                latency,
                version: result[0]?.version
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            return {
                connected: false,
                latency,
                error: error.message
            };
        }
    }
    async shutdown() {
        logger_1.logger.info('Initiating database service shutdown');
        try {
            await this.disconnect();
            this.clearMetrics();
            logger_1.logger.info('Database service shutdown completed');
        }
        catch (error) {
            logger_1.logger.error('Error during database service shutdown', {
                error: error.message
            });
            throw error;
        }
    }
    getConfigurationSafe() {
        const config = this.getConfiguration();
        return {
            maxConnections: config.maxConnections,
            connectionTimeoutMs: config.connectionTimeoutMs,
            queryTimeoutMs: config.queryTimeoutMs,
            slowQueryThreshold: config.slowQueryThreshold,
            enableLogging: config.enableLogging,
            enableMetrics: config.enableMetrics,
            poolConfig: config.poolConfig
        };
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    isReady() {
        return this.isConnected && this.healthStatus.status !== 'unhealthy';
    }
    getUptime() {
        return Date.now() - this.connectionMetrics.uptime;
    }
    async executeRawQuery(query, params) {
        return this.executeOperation(async (client) => {
            if (params) {
                return await client.$queryRawUnsafe(query, ...params);
            }
            else {
                return await client.$queryRawUnsafe(query);
            }
        }, `raw_query_${query.substring(0, 50)}...`);
    }
    async executeTransaction(operations, options = {}) {
        return this.executeOperation(async (client) => {
            return await client.$transaction(operations, {
                timeout: options.timeout || 30000,
                isolationLevel: options.isolationLevel
            });
        }, 'transaction');
    }
}
exports.DatabaseService = DatabaseService;
exports.databaseService = DatabaseService.getInstance();
exports.default = DatabaseService;
//# sourceMappingURL=database.service.js.map