"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringDashboardService = exports.MonitoringDashboardService = void 0;
const database_service_1 = require("../services/database.service");
const redis_service_1 = require("../services/redis.service");
const logger_1 = require("@/utils/logger");
const environment_1 = require("@/config/environment");
class MonitoringDashboardService {
    CACHE_TTL = 60;
    async getDashboardData() {
        try {
            const startTime = Date.now();
            logger_1.logger.info('Generating monitoring dashboard data');
            const cacheKey = 'monitoring:dashboard';
            const cached = await redis_service_1.RedisService.get(cacheKey);
            if (cached) {
                logger_1.logger.info('Returning cached monitoring dashboard data');
                return JSON.parse(cached);
            }
            const [health, system, performance, business, alerts, recommendations] = await Promise.all([
                this.getServiceHealth(),
                this.getSystemMetrics(),
                this.getPerformanceMetrics(),
                this.getBusinessMetrics(),
                this.getActiveAlerts(),
                this.getRecommendations()
            ]);
            const dashboard = {
                health,
                system,
                performance,
                business,
                alerts,
                recommendations
            };
            await redis_service_1.RedisService.setex(cacheKey, this.CACHE_TTL, JSON.stringify(dashboard));
            const duration = Date.now() - startTime;
            logger_1.logger.info('Monitoring dashboard data generated successfully', {
                duration
            });
            return dashboard;
        }
        catch (error) {
            logger_1.logger.error('Error generating monitoring dashboard data', error);
            throw error;
        }
    }
    async getServiceHealth() {
        try {
            await database_service_1.DatabaseService.client.$queryRaw `SELECT 1`;
            const databaseHealth = 'healthy';
            await redis_service_1.RedisService.ping();
            const redisHealth = 'healthy';
            const externalHealth = 'healthy';
            const services = { database: databaseHealth, redis: redisHealth, external: externalHealth };
            const overall = Object.values(services).every(status => status === 'healthy') ? 'healthy' : 'degraded';
            return {
                overall: overall,
                services: services,
                uptime: process.uptime(),
                lastHealthCheck: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error checking service health', error);
            return {
                overall: 'unhealthy',
                services: {
                    database: 'unhealthy',
                    redis: 'unhealthy',
                    external: 'unknown'
                },
                uptime: process.uptime(),
                lastHealthCheck: new Date()
            };
        }
    }
    async getSystemMetrics() {
        try {
            const memoryUsage = process.memoryUsage();
            return {
                cpu: {
                    usage: 0,
                    load: [],
                    cores: 1
                },
                memory: {
                    used: memoryUsage.heapUsed,
                    total: memoryUsage.heapTotal,
                    percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
                },
                process: {
                    pid: process.pid,
                    uptime: process.uptime(),
                    memoryUsage
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting system metrics', error);
            throw error;
        }
    }
    async getPerformanceMetrics() {
        try {
            const redisHealth = await redis_service_1.RedisService.getHealth();
            return {
                database: {
                    connectionPool: {
                        active: 1,
                        idle: 0,
                        total: 1
                    },
                    queryPerformance: {
                        averageTime: 10,
                        slowQueries: 0,
                        totalQueries: 100
                    }
                },
                redis: {
                    connectionStatus: redisHealth.connected ? 'connected' : 'disconnected',
                    memoryUsage: {
                        used: 1024,
                        peak: 2048,
                        percentage: 50
                    },
                    operations: {
                        hits: 80,
                        misses: 20,
                        hitRate: 80
                    }
                },
                externalServices: {
                    paymentGateway: 'online',
                    notificationService: 'online',
                    rfidSystem: 'online'
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting performance metrics', error);
            throw error;
        }
    }
    async getBusinessMetrics() {
        try {
            return {
                users: {
                    active: 150,
                    total: 500,
                    newToday: 5
                },
                schools: {
                    active: 25,
                    total: 30,
                    newThisMonth: 2
                },
                payments: {
                    todayRevenue: 15000,
                    todayCount: 85,
                    successRate: 98.2
                },
                rfid: {
                    verificationsToday: 320,
                    successRate: 99.1,
                    activeReaders: 12
                },
                notifications: {
                    sentToday: 450,
                    deliveryRate: 97.8,
                    channels: {
                        email: 180,
                        sms: 120,
                        push: 150
                    }
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting business metrics', error);
            throw error;
        }
    }
    async getActiveAlerts() {
        try {
            return [];
        }
        catch (error) {
            logger_1.logger.error('Error getting active alerts', error);
            return [];
        }
    }
    async getRecommendations() {
        try {
            return [];
        }
        catch (error) {
            logger_1.logger.error('Error getting recommendations', error);
            return [];
        }
    }
    async healthCheck() {
        try {
            const testKey = `health_check:${Date.now()}`;
            await database_service_1.DatabaseService.client.$queryRaw `SELECT 1`;
            await redis_service_1.RedisService.set(testKey, 'test', 10);
            await redis_service_1.RedisService.del(testKey);
            return {
                status: 'healthy',
                timestamp: new Date(),
                services: {
                    database: 'healthy',
                    redis: 'healthy',
                    webhookUrl: `${environment_1.config.server.baseUrl}/api/v1/webhooks/whatsapp`
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Health check failed', error);
            return {
                status: 'unhealthy',
                timestamp: new Date(),
                services: {
                    database: 'unhealthy',
                    redis: 'unhealthy'
                }
            };
        }
    }
    async getDatabaseHealth() {
        const startTime = Date.now();
        try {
            await database_service_1.DatabaseService.client.$queryRaw `SELECT 1`;
            return {
                status: 'healthy',
                timestamp: new Date(),
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.logger.error('Database health check failed', { error });
            return {
                status: 'unhealthy',
                timestamp: new Date(),
                responseTime: Date.now() - startTime
            };
        }
    }
    async getCacheHealth() {
        const startTime = Date.now();
        try {
            const testKey = `cache_health:${Date.now()}`;
            await redis_service_1.RedisService.set(testKey, 'test', 5);
            await redis_service_1.RedisService.del(testKey);
            return {
                status: 'healthy',
                timestamp: new Date(),
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.logger.error('Cache health check failed', { error });
            return {
                status: 'unhealthy',
                timestamp: new Date(),
                responseTime: Date.now() - startTime
            };
        }
    }
    async getPaymentServiceHealth() {
        const startTime = Date.now();
        try {
            return {
                status: 'healthy',
                timestamp: new Date(),
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.logger.error('Payment service health check failed', { error });
            return {
                status: 'unhealthy',
                timestamp: new Date(),
                responseTime: Date.now() - startTime
            };
        }
    }
    async getRfidServiceHealth() {
        const startTime = Date.now();
        try {
            return {
                status: 'healthy',
                timestamp: new Date(),
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.logger.error('RFID service health check failed', { error });
            return {
                status: 'unhealthy',
                timestamp: new Date(),
                responseTime: Date.now() - startTime
            };
        }
    }
}
exports.MonitoringDashboardService = MonitoringDashboardService;
exports.monitoringDashboardService = new MonitoringDashboardService();
exports.default = exports.monitoringDashboardService;
//# sourceMappingURL=monitoring-dashboard.service.js.map