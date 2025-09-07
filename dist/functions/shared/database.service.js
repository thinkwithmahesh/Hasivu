"use strict";
/**
 * Lambda-Optimized Database Service
 * Prisma client with connection pooling optimized for AWS Lambda cold starts
 * Migration from Express-based database service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = exports.LambdaDatabaseService = void 0;
const client_1 = require("@prisma/client");
/**
 * Lambda-optimized database service class
 * Uses global connection caching to minimize cold start impact
 */
class LambdaDatabaseService {
    static instance;
    _prisma;
    constructor() {
        this._prisma = this.createPrismaClient();
    }
    /**
     * Get singleton instance (optimized for Lambda)
     */
    static getInstance() {
        if (!LambdaDatabaseService.instance) {
            LambdaDatabaseService.instance = new LambdaDatabaseService();
        }
        return LambdaDatabaseService.instance;
    }
    /**
     * Create Prisma client with Lambda-optimized configuration
     */
    createPrismaClient() {
        // Reuse connection if available (Lambda warm start)
        if (global.__prisma__) {
            return global.__prisma__;
        }
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        const enhancedUrl = this.enhanceDatabaseUrlForLambda(databaseUrl);
        const prisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: enhancedUrl
                }
            },
            log: this.getLogConfig(),
            errorFormat: 'minimal', // Reduce payload size
        });
        // Cache globally for Lambda warm starts
        global.__prisma__ = prisma;
        return prisma;
    }
    /**
     * Enhance database URL for Lambda execution environment
     */
    enhanceDatabaseUrlForLambda(url) {
        try {
            const dbUrl = new URL(url);
            // Add connection pooling parameters optimized for serverless
            const searchParams = new URLSearchParams(dbUrl.search);
            // Serverless-optimized connection settings
            if (!searchParams.has('connection_limit')) {
                searchParams.set('connection_limit', '1'); // Single connection per Lambda
            }
            if (!searchParams.has('pool_timeout')) {
                searchParams.set('pool_timeout', '20'); // 20 seconds timeout
            }
            if (!searchParams.has('connect_timeout')) {
                searchParams.set('connect_timeout', '20'); // 20 seconds connect timeout
            }
            if (!searchParams.has('statement_cache_size')) {
                searchParams.set('statement_cache_size', '100'); // Cache prepared statements
            }
            dbUrl.search = searchParams.toString();
            return dbUrl.toString();
        }
        catch (error) {
            // If URL parsing fails, return original URL
            console.warn('Failed to enhance database URL:', error);
            return url;
        }
    }
    /**
     * Get logging configuration for Lambda
     */
    getLogConfig() {
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
            return ['warn', 'error'];
        }
        else {
            return ['query', 'info', 'warn', 'error'];
        }
    }
    /**
     * Get Prisma client instance
     */
    get client() {
        return this._prisma;
    }
    /**
     * Get Prisma client instance (alias for backwards compatibility)
     */
    get prisma() {
        return this._prisma;
    }
    /**
     * Convenient access to all Prisma models
     */
    get user() {
        return this.prisma.user;
    }
    get school() {
        return this.prisma.school;
    }
    get parentChild() {
        return this.prisma.parentChild;
    }
    get role() {
        return this.prisma.role;
    }
    get userRoleAssignment() {
        return this.prisma.userRoleAssignment;
    }
    get auditLog() {
        return this.prisma.auditLog;
    }
    get authSession() {
        return this.prisma.authSession;
    }
    // Note: Students are represented by User model with role='student'
    get order() {
        return this.prisma.order;
    }
    get paymentTransaction() {
        return this.prisma.paymentTransaction;
    }
    get rfidCard() {
        return this.prisma.rFIDCard;
    }
    get whatsappMessage() {
        return this.prisma.whatsAppMessage;
    }
    // Menu management models - these will be added based on actual Prisma schema
    // public get menuItem() {
    //   return this.prisma.menuItem;
    // }
    // public get menuPlan() {
    //   return this.prisma.menuPlan;
    // }
    // public get dailyMenu() {
    //   return this.prisma.dailyMenu;
    // }
    // public get mealSlot() {
    //   return this.prisma.mealSlot;
    // }
    // public get menuItemSlot() {
    //   return this.prisma.menuItemSlot;
    // }
    // Note: These models will be added in future stories
    // public get product() { return this.prisma.product; }
    // public get orderItem() { return this.prisma.orderItem; }
    // public get notification() { return this.prisma.notification; }
    /**
     * Execute transaction with Lambda-appropriate timeouts
     */
    async transaction(fn, options) {
        const transactionOptions = {
            maxWait: options?.maxWait || 5000, // 5 seconds max wait
            timeout: options?.timeout || 25000, // 25 seconds timeout (within Lambda limit)
            isolationLevel: options?.isolationLevel
        };
        return await this.prisma.$transaction(fn, transactionOptions);
    }
    /**
     * Test database connection
     */
    async testConnection() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    }
    /**
     * Get health status for Lambda functions
     */
    async getHealthStatus() {
        const startTime = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            const latency = Date.now() - startTime;
            return {
                status: 'healthy',
                connected: true,
                latency
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            return {
                status: 'unhealthy',
                connected: false,
                latency,
                details: error instanceof Error ? error.message : 'Unknown database error'
            };
        }
    }
    /**
     * Execute raw SQL query (with type safety)
     */
    async queryRaw(sql, ...values) {
        return await this.prisma.$queryRaw(sql, ...values);
    }
    /**
     * Execute raw SQL command (for DDL operations)
     */
    async executeRaw(sql, ...values) {
        return await this.prisma.$executeRaw(sql, ...values);
    }
    /**
     * Check if database is ready for queries
     */
    async isReady() {
        try {
            await this.prisma.$connect();
            return true;
        }
        catch (error) {
            console.error('Database readiness check failed:', error);
            return false;
        }
    }
    /**
     * Graceful cleanup for Lambda function end
     */
    async cleanup() {
        try {
            await this.prisma.$disconnect();
        }
        catch (error) {
            console.error('Database cleanup failed:', error);
        }
    }
    /**
     * Force disconnect (for testing or emergency situations)
     */
    async forceDisconnect() {
        try {
            await this.prisma.$disconnect();
            // Clear global cache to force new connection
            global.__prisma__ = undefined;
        }
        catch (error) {
            console.error('Database force disconnect failed:', error);
        }
    }
}
exports.LambdaDatabaseService = LambdaDatabaseService;
// Export singleton instance
exports.DatabaseService = LambdaDatabaseService.getInstance();
// Default export
exports.default = exports.DatabaseService;
