"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = exports.DatabaseService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const events_1 = require("events");
class DatabaseService extends events_1.EventEmitter {
    static instance;
    prismaClient;
    queryStats;
    healthCheckInterval;
    SLOW_QUERY_THRESHOLD = 1000;
    HEALTH_CHECK_INTERVAL = 30000;
    constructor() {
        super();
        this.queryStats = {
            totalQueries: 0,
            avgResponseTime: 0,
            slowQueries: 0,
            failedQueries: 0,
            connectionMetrics: {
                activeConnections: 0,
                totalConnections: 0,
                poolUtilization: 0
            }
        };
        this.prismaClient = new client_1.PrismaClient({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'info' },
                { emit: 'event', level: 'warn' }
            ],
            errorFormat: 'pretty'
        });
        this.setupEventListeners();
        this.startHealthChecks();
        logger_1.logger.info('Database service initialized successfully');
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    static get client() {
        return DatabaseService.getInstance().prismaClient;
    }
    static get query() {
        return DatabaseService.getInstance().prismaClient;
    }
    static async connect() {
        return DatabaseService.getInstance().connect();
    }
    get school() {
        return this.prismaClient.school;
    }
    get user() {
        return this.prismaClient.user;
    }
    get menuItem() {
        return this.prismaClient.menuItem;
    }
    get order() {
        return this.prismaClient.order;
    }
    get orderItem() {
        return this.prismaClient.orderItem;
    }
    get paymentOrder() {
        return this.prismaClient.paymentOrder;
    }
    get rfidCard() {
        return this.prismaClient.rFIDCard;
    }
    get rfidReader() {
        return this.prismaClient.rFIDReader;
    }
    get deliveryVerification() {
        return this.prismaClient.deliveryVerification;
    }
    get notification() {
        return this.prismaClient.notification;
    }
    get session() {
        return {
            create: (data) => Promise.resolve(data),
            findFirst: (query) => Promise.resolve(null),
            update: (params) => Promise.resolve(params.data),
            delete: (query) => Promise.resolve({}),
            findMany: (query) => Promise.resolve([])
        };
    }
    get passwordReset() {
        return {
            create: (data) => Promise.resolve(data),
            findFirst: (query) => Promise.resolve(null),
            update: (params) => Promise.resolve(params.data),
            delete: (query) => Promise.resolve({})
        };
    }
    get whatsAppMessage() {
        return this.prismaClient.whatsAppMessage;
    }
    get studentProfile() {
        return {
            create: (data) => Promise.resolve(data),
            findFirst: (query) => Promise.resolve(null),
            update: (params) => Promise.resolve(params.data),
            delete: (query) => Promise.resolve({})
        };
    }
    get teacherProfile() {
        return {
            create: (data) => Promise.resolve(data),
            findFirst: (query) => Promise.resolve(null),
            update: (params) => Promise.resolve(params.data),
            delete: (query) => Promise.resolve({})
        };
    }
    get parentProfile() {
        return {
            create: (data) => Promise.resolve(data),
            findFirst: (query) => Promise.resolve(null),
            update: (params) => Promise.resolve(params.data),
            delete: (query) => Promise.resolve({})
        };
    }
    get query() {
        return async (sql, params = []) => {
            try {
                let prismaQuery = sql;
                params.forEach((param, index) => {
                    const placeholder = `$${index + 1}`;
                    const escapedValue = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
                    prismaQuery = prismaQuery.replace(new RegExp(`\\${placeholder}`, 'g'), escapedValue);
                });
                const result = await this.prismaClient.$queryRawUnsafe(prismaQuery);
                return {
                    rows: Array.isArray(result) ? result : [result],
                    rowCount: Array.isArray(result) ? result.length : 1
                };
            }
            catch (error) {
                logger_1.logger.error('Legacy SQL query failed', { sql: sql.substring(0, 100), error });
                throw error;
            }
        };
    }
    static async transaction(callback, options) {
        const instance = DatabaseService.getInstance();
        try {
            const result = await instance.prismaClient.$transaction(callback, {
                maxWait: options?.maxWait ?? 5000,
                timeout: options?.timeout ?? 10000,
                isolationLevel: options?.isolationLevel
            });
            logger_1.logger.debug('Database transaction completed successfully');
            return result;
        }
        catch (error) {
            logger_1.logger.error('Database transaction failed', error);
            throw error;
        }
    }
    async connect() {
        try {
            await this.prismaClient.$connect();
            logger_1.logger.info('Database connection established');
            this.emit('connected');
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to database', error);
            this.emit('error', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
            }
            await this.prismaClient.$disconnect();
            logger_1.logger.info('Database connection closed');
            this.emit('disconnected');
        }
        catch (error) {
            logger_1.logger.error('Failed to disconnect from database', error);
            throw error;
        }
    }
    async getHealth() {
        const startTime = Date.now();
        const errors = [];
        try {
            await this.prismaClient.$queryRaw `SELECT 1`;
            const responseTime = Date.now() - startTime;
            const connectionInfo = {
                active: 0,
                idle: 0,
                total: 1,
                maxConnections: 100
            };
            const tables = await this.getTableInfo();
            const connectionPoolUsage = (connectionInfo.active / connectionInfo.maxConnections) * 100;
            return {
                status: responseTime < 500 ? 'healthy' : responseTime < 1000 ? 'warning' : 'error',
                responseTime,
                connections: connectionInfo,
                performance: {
                    avgQueryTime: this.queryStats.avgResponseTime,
                    slowQueries: this.queryStats.slowQueries,
                    connectionPoolUsage
                },
                tables,
                errors,
                timestamp: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Database health check failed', error);
            errors.push(error instanceof Error ? error.message : 'Unknown error');
            return {
                status: 'error',
                responseTime: Date.now() - startTime,
                connections: { active: 0, idle: 0, total: 0, maxConnections: 0 },
                performance: { avgQueryTime: 0, slowQueries: 0, connectionPoolUsage: 0 },
                tables: [],
                errors,
                timestamp: new Date()
            };
        }
    }
    getStats() {
        return { ...this.queryStats };
    }
    resetStats() {
        this.queryStats = {
            totalQueries: 0,
            avgResponseTime: 0,
            slowQueries: 0,
            failedQueries: 0,
            connectionMetrics: {
                activeConnections: 0,
                totalConnections: 0,
                poolUtilization: 0
            }
        };
        logger_1.logger.info('Database statistics reset');
    }
    async executeRaw(query, ...values) {
        const startTime = Date.now();
        try {
            const result = await this.prismaClient.$queryRaw(query, ...values);
            const duration = Date.now() - startTime;
            this.updateQueryStats(duration, false);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.updateQueryStats(duration, true);
            logger_1.logger.error('Raw query execution failed', error);
            throw error;
        }
    }
    setupEventListeners() {
        this.prismaClient.$on('query', (event) => {
            const duration = parseInt(event.duration || '0');
            this.updateQueryStats(duration, false);
            if (duration > this.SLOW_QUERY_THRESHOLD) {
                logger_1.logger.warn('Slow query detected', {
                    query: event.query || 'unknown',
                    duration: duration,
                    params: event.params || []
                });
            }
        });
        this.prismaClient.$on('error', (event) => {
            this.queryStats.failedQueries++;
            logger_1.logger.error('Database error', {
                target: event.target || 'unknown',
                message: event.message || 'No message'
            });
            this.emit('error', event);
        });
        this.prismaClient.$on('info', (event) => {
            logger_1.logger.info('Database info', {
                target: event.target || 'unknown',
                message: event.message || 'No message'
            });
        });
        this.prismaClient.$on('warn', (event) => {
            logger_1.logger.warn('Database warning', {
                target: event.target || 'unknown',
                message: event.message || 'No message'
            });
        });
    }
    updateQueryStats(duration, failed) {
        this.queryStats.totalQueries++;
        if (failed) {
            this.queryStats.failedQueries++;
        }
        else {
            const totalTime = this.queryStats.avgResponseTime * (this.queryStats.totalQueries - 1) + duration;
            this.queryStats.avgResponseTime = totalTime / this.queryStats.totalQueries;
            if (duration > this.SLOW_QUERY_THRESHOLD) {
                this.queryStats.slowQueries++;
            }
        }
    }
    async getTableInfo() {
        try {
            const tableNames = [
                'User', 'School', 'MenuItem', 'Order', 'OrderItem',
                'PaymentOrder', 'RfidCard', 'RfidReader', 'DeliveryVerification',
                'Notification', 'Session', 'PasswordReset'
            ];
            const tables = [];
            for (const tableName of tableNames) {
                try {
                    const result = await this.prismaClient.$queryRawUnsafe(`SELECT COUNT(*) as count FROM \`${tableName}\``);
                    const rowCount = Number(result[0]?.count || 0);
                    tables.push({
                        name: tableName,
                        rowCount,
                        size: this.formatBytes(rowCount * 1024)
                    });
                }
                catch (error) {
                    logger_1.logger.debug(`Failed to get info for table ${tableName}`, error);
                }
            }
            return tables;
        }
        catch (error) {
            logger_1.logger.error('Failed to get table information', error);
            return [];
        }
    }
    startHealthChecks() {
        this.healthCheckInterval = setInterval(async () => {
            try {
                const health = await this.getHealth();
                this.emit('healthCheck', health);
                if (health.status === 'error') {
                    logger_1.logger.error('Database health check failed', { health });
                }
                else if (health.status === 'warning') {
                    logger_1.logger.warn('Database performance warning', { health });
                }
            }
            catch (error) {
                logger_1.logger.error('Health check error', error);
            }
        }, this.HEALTH_CHECK_INTERVAL);
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    getConnectionPoolStatus() {
        return {
            active: this.queryStats.connectionMetrics.activeConnections,
            idle: this.queryStats.connectionMetrics.totalConnections - this.queryStats.connectionMetrics.activeConnections,
            total: this.queryStats.connectionMetrics.totalConnections,
            maxConnections: 50
        };
    }
    isSSLEnabled() {
        const databaseUrl = process.env.DATABASE_URL || '';
        return databaseUrl.includes('sslmode=require') ||
            databaseUrl.includes('ssl=true') ||
            databaseUrl.includes('sslmode=prefer');
    }
    async initialize() {
        try {
            await this.connect();
            logger_1.logger.info('Database service initialized successfully');
            return { success: true, data: { message: 'Database service initialized' } };
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize database service', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Database initialization failed'
            };
        }
    }
    async validateConnectionSecurity() {
        try {
            const securityChecks = {
                sslEnabled: process.env.DATABASE_SSL === 'true',
                connectionEncrypted: process.env.DATABASE_URL?.includes('sslmode=require') || false,
                credentialsSecured: !!(process.env.DATABASE_PASSWORD && process.env.DATABASE_USERNAME),
                connectionPoolConfigured: !!process.env.DATABASE_POOL_SIZE,
                readOnlyUser: process.env.DATABASE_READ_ONLY === 'true',
                auditingEnabled: process.env.DATABASE_AUDIT === 'enabled'
            };
            const connectionSettings = {
                maxConnections: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
                connectionTimeout: parseInt(process.env.DATABASE_TIMEOUT || '30000'),
                idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '300000'),
                ssl: process.env.DATABASE_SSL === 'true'
            };
            const passed = Object.values(securityChecks).filter(Boolean).length;
            const total = Object.keys(securityChecks).length;
            const securityScore = (passed / total) * 100;
            return {
                success: true,
                data: {
                    securityChecks,
                    connectionSettings,
                    securityScore: Math.round(securityScore),
                    status: securityScore >= 80 ? 'secure' : securityScore >= 60 ? 'warning' : 'insecure',
                    recommendations: securityScore < 80 ? [
                        'Enable SSL connections',
                        'Use encrypted connection strings',
                        'Configure connection pooling',
                        'Enable database auditing'
                    ] : []
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Connection security validation failed'
            };
        }
    }
    async getUserCount() {
        try {
            return await this.prismaClient.user.count();
        }
        catch (error) {
            logger_1.logger.error('Failed to get user count', error);
            return 0;
        }
    }
    async searchMenuItems(query) {
        try {
            return await this.prismaClient.menuItem.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to search menu items', error);
            return [];
        }
    }
    async getAllMenuItems() {
        try {
            return await this.prismaClient.menuItem.findMany();
        }
        catch (error) {
            logger_1.logger.error('Failed to get all menu items', error);
            return [];
        }
    }
    async createMenuItem(data) {
        try {
            return await this.prismaClient.menuItem.create({ data });
        }
        catch (error) {
            logger_1.logger.error('Failed to create menu item', error);
            throw error;
        }
    }
    sanitizeQuery(query) {
        if (typeof query === 'string') {
            return query.replace(/['";\\]/g, '').substring(0, 100);
        }
        else if (typeof query === 'object' && query !== null) {
            const safeQuery = {};
            const allowedFields = ['email', 'firstName', 'lastName', 'id'];
            for (const key of Object.keys(query)) {
                if (allowedFields.includes(key) && !key.startsWith('$')) {
                    safeQuery[key] = query[key];
                }
            }
            return safeQuery;
        }
        return '';
    }
    async cleanup() {
        try {
            await this.disconnect();
            logger_1.logger.info('Database service cleaned up successfully');
            return { success: true, data: { message: 'Database service cleaned up' } };
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup database service', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Database cleanup failed'
            };
        }
    }
}
exports.DatabaseService = DatabaseService;
exports.databaseService = DatabaseService.getInstance();
exports.default = DatabaseService;
//# sourceMappingURL=database.service.js.map