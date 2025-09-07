"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = exports.LambdaDatabaseService = void 0;
const client_1 = require("@prisma/client");
class LambdaDatabaseService {
    static instance;
    _prisma;
    constructor() {
        this._prisma = this.createPrismaClient();
    }
    static getInstance() {
        if (!LambdaDatabaseService.instance) {
            LambdaDatabaseService.instance = new LambdaDatabaseService();
        }
        return LambdaDatabaseService.instance;
    }
    createPrismaClient() {
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
            errorFormat: 'minimal',
        });
        global.__prisma__ = prisma;
        return prisma;
    }
    enhanceDatabaseUrlForLambda(url) {
        try {
            const dbUrl = new URL(url);
            const searchParams = new URLSearchParams(dbUrl.search);
            if (!searchParams.has('connection_limit')) {
                searchParams.set('connection_limit', '1');
            }
            if (!searchParams.has('pool_timeout')) {
                searchParams.set('pool_timeout', '20');
            }
            if (!searchParams.has('connect_timeout')) {
                searchParams.set('connect_timeout', '20');
            }
            if (!searchParams.has('statement_cache_size')) {
                searchParams.set('statement_cache_size', '100');
            }
            dbUrl.search = searchParams.toString();
            return dbUrl.toString();
        }
        catch (error) {
            console.warn('Failed to enhance database URL:', error);
            return url;
        }
    }
    getLogConfig() {
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
            return ['warn', 'error'];
        }
        else {
            return ['query', 'info', 'warn', 'error'];
        }
    }
    get client() {
        return this._prisma;
    }
    get prisma() {
        return this._prisma;
    }
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
    async transaction(fn, options) {
        const transactionOptions = {
            maxWait: options?.maxWait || 5000,
            timeout: options?.timeout || 25000,
            isolationLevel: options?.isolationLevel
        };
        return await this.prisma.$transaction(fn, transactionOptions);
    }
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
    async queryRaw(sql, ...values) {
        return await this.prisma.$queryRaw(sql, ...values);
    }
    async executeRaw(sql, ...values) {
        return await this.prisma.$executeRaw(sql, ...values);
    }
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
    async cleanup() {
        try {
            await this.prisma.$disconnect();
        }
        catch (error) {
            console.error('Database cleanup failed:', error);
        }
    }
    async forceDisconnect() {
        try {
            await this.prisma.$disconnect();
            global.__prisma__ = undefined;
        }
        catch (error) {
            console.error('Database force disconnect failed:', error);
        }
    }
}
exports.LambdaDatabaseService = LambdaDatabaseService;
exports.DatabaseService = LambdaDatabaseService.getInstance();
exports.default = exports.DatabaseService;
//# sourceMappingURL=database.service.js.map