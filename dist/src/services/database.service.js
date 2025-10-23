"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = exports.DatabaseService = void 0;
const client_1 = require("@prisma/client");
class DatabaseService {
    static instance;
    client;
    constructor() {
        this.client = new client_1.PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    static get client() {
        return DatabaseService.getInstance().client;
    }
    static async transaction(fn) {
        return await DatabaseService.getInstance().transaction(fn);
    }
    async transaction(fn) {
        return await this.client.$transaction(fn);
    }
    async healthCheck() {
        try {
            const startTime = Date.now();
            await this.client.$queryRaw `SELECT 1`;
            const latency = Date.now() - startTime;
            return { healthy: true, latency };
        }
        catch (error) {
            return { healthy: false };
        }
    }
    async executeRaw(query, ...params) {
        return await this.client.$executeRaw(client_1.Prisma.raw(query), ...params);
    }
    async queryRaw(query, ...params) {
        return await this.client.$queryRaw(client_1.Prisma.raw(query), ...params);
    }
    async query(query, params = []) {
        const result = await this.client.$queryRaw(client_1.Prisma.raw(query), ...params);
        return { rows: result };
    }
    async disconnect() {
        await this.client.$disconnect();
    }
    async connect() {
        await this.client.$connect();
    }
    async getHealth() {
        try {
            const startTime = Date.now();
            await this.client.$queryRaw `SELECT 1`;
            const responseTime = Date.now() - startTime;
            const connections = {
                active: 1,
                idle: 0,
                total: 1,
            };
            const performance = {
                queryTime: responseTime,
                connectionTime: responseTime,
            };
            const tables = ['user', 'order', 'menuItem', 'orderItem', 'paymentOrder'];
            return {
                status: 'healthy',
                responseTime,
                connections,
                performance,
                tables,
                errors: [],
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                status: 'error',
                responseTime: 0,
                connections: null,
                performance: null,
                tables: [],
                errors: [error.message || 'Database health check failed'],
                timestamp: new Date(),
            };
        }
    }
    sanitizeQuery(query) {
        if (typeof query === 'string') {
            return query
                .replace(/DROP\s+/gi, '')
                .replace(/DELETE\s+/gi, '')
                .replace(/TRUNCATE\s+/gi, '');
        }
        return query;
    }
    get user() {
        return this.client.user;
    }
    get order() {
        return this.client.order;
    }
    get menuItem() {
        return this.client.menuItem;
    }
    get orderItem() {
        return this.client.orderItem;
    }
    get paymentOrder() {
        return this.client.paymentOrder;
    }
    get rfidCard() {
        return this.client.rFIDCard;
    }
    get rfidReader() {
        return this.client.rFIDReader;
    }
    get deliveryVerification() {
        return this.client.deliveryVerification;
    }
    get notification() {
        return this.client.notification;
    }
    get whatsAppMessage() {
        return this.client.whatsAppMessage;
    }
}
exports.DatabaseService = DatabaseService;
exports.databaseService = DatabaseService.getInstance();
exports.default = DatabaseService;
//# sourceMappingURL=database.service.js.map