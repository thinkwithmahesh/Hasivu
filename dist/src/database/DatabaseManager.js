"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.DatabaseManager = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class DatabaseManager {
    static instance;
    prisma;
    config;
    isInitialized = false;
    constructor(config) {
        this.config = config;
        this.prisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: this.config.url,
                },
            },
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
        this.isInitialized = true;
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
    getClient() {
        return this.prisma;
    }
    async connect() {
        try {
            await this.prisma.$connect();
            logger_1.logger.info('Database connection established');
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to database', error);
            throw new errors_1.DatabaseError('Failed to connect to database', 'CONNECTION_ERROR');
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            logger_1.logger.info('Database connection closed');
        }
        catch (error) {
            logger_1.logger.error('Error disconnecting from database', error);
            throw new errors_1.DatabaseError('Failed to disconnect from database', 'DISCONNECTION_ERROR');
        }
    }
    async healthCheck() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return {
                isConnected: true,
                lastHealthCheck: new Date(),
            };
        }
        catch (error) {
            logger_1.logger.error('Database health check failed', error);
            return {
                isConnected: false,
                lastHealthCheck: new Date(),
            };
        }
    }
    async executeRaw(query, params = []) {
        try {
            return await this.prisma.$queryRawUnsafe(query, ...params);
        }
        catch (error) {
            logger_1.logger.error('Raw query execution failed', error, { query });
            throw new errors_1.DatabaseError(`Raw query execution failed: ${query}`, 'QUERY_ERROR');
        }
    }
    async transaction(callback, options) {
        try {
            return await this.prisma.$transaction(callback, {
                timeout: options?.timeout || 5000,
                isolationLevel: options?.isolationLevel,
                maxWait: options?.maxWait || 2000,
            });
        }
        catch (error) {
            logger_1.logger.error('Transaction failed', error);
            throw new errors_1.DatabaseError('Transaction execution failed', 'TRANSACTION_ERROR');
        }
    }
    async reset() {
        try {
            await this.prisma.$executeRaw `TRUNCATE TABLE "User", "Order", "Payment", "Child" CASCADE`;
            logger_1.logger.info('Database reset completed');
        }
        catch (error) {
            logger_1.logger.error('Database reset failed', error);
            throw new errors_1.DatabaseError('Database reset failed', 'RESET_ERROR');
        }
    }
    isReady() {
        return this.isInitialized;
    }
    getPrismaClient() {
        return this.prisma;
    }
}
exports.DatabaseManager = DatabaseManager;
exports.prisma = DatabaseManager.getInstance({
    url: process.env.DATABASE_URL || '',
}).getClient();
//# sourceMappingURL=DatabaseManager.js.map