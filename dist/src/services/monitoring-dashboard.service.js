"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringDashboardService = exports.MonitoringDashboardService = void 0;
const performance_service_1 = require("./performance.service");
const database_service_1 = require("./database.service");
const redis_service_1 = require("./redis.service");
const os_1 = __importDefault(require("os"));
class MonitoringDashboardService {
    static instance;
    healthCheckInterval = null;
    constructor() { }
    static getInstance() {
        if (!MonitoringDashboardService.instance) {
            MonitoringDashboardService.instance = new MonitoringDashboardService();
        }
        return MonitoringDashboardService.instance;
    }
    async checkAllServices() {
        const services = [];
        try {
            const dbHealth = await database_service_1.databaseService.healthCheck();
            services.push({
                service: 'database',
                status: dbHealth.healthy ? 'healthy' : 'unhealthy',
                latency: dbHealth.latency,
                lastCheck: new Date(),
            });
        }
        catch (error) {
            services.push({
                service: 'database',
                status: 'unhealthy',
                lastCheck: new Date(),
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        try {
            const redisHealth = await redis_service_1.redisService.healthCheck();
            services.push({
                service: 'redis',
                status: redisHealth.healthy ? 'healthy' : 'unhealthy',
                latency: redisHealth.latency,
                lastCheck: new Date(),
            });
        }
        catch (error) {
            services.push({
                service: 'redis',
                status: 'unhealthy',
                lastCheck: new Date(),
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        return services;
    }
    getSystemMetrics() {
        const memUsage = performance_service_1.performanceService.getMemoryUsage();
        const totalMemory = memUsage.heapTotal;
        const usedMemory = memUsage.heapUsed;
        return {
            cpu: {
                usage: 0,
                cores: os_1.default.cpus().length,
            },
            memory: {
                used: usedMemory,
                total: totalMemory,
                percentage: (usedMemory / totalMemory) * 100,
            },
            uptime: process.uptime(),
            timestamp: new Date(),
        };
    }
    async getDashboardData() {
        const health = await this.checkAllServices();
        const metrics = this.getSystemMetrics();
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
        const perfReport = performance_service_1.performanceService.generateReport(startDate, endDate);
        return {
            health,
            metrics,
            performance: {
                avgResponseTime: perfReport.summary.avgResponseTime,
                requestCount: perfReport.summary.totalRequests,
                errorRate: perfReport.summary.errorRate,
            },
        };
    }
    startHealthChecks(intervalMs = 30000) {
        if (this.healthCheckInterval) {
            return;
        }
        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.checkAllServices();
            }
            catch (error) {
            }
        }, intervalMs);
    }
    stopHealthChecks() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
    async getServiceStatus(serviceName) {
        const allServices = await this.checkAllServices();
        return allServices.find(s => s.service === serviceName) || null;
    }
    async getAlerts() {
        const alerts = [];
        const health = await this.checkAllServices();
        const metrics = this.getSystemMetrics();
        health.forEach(service => {
            if (service.status === 'unhealthy') {
                alerts.push({
                    severity: 'critical',
                    message: `Service ${service.service} is unhealthy: ${service.message || 'Unknown error'}`,
                });
            }
            else if (service.status === 'degraded') {
                alerts.push({
                    severity: 'warning',
                    message: `Service ${service.service} is degraded`,
                });
            }
        });
        if (metrics.memory.percentage > 90) {
            alerts.push({
                severity: 'critical',
                message: `Memory usage is critical: ${metrics.memory.percentage.toFixed(1)}%`,
            });
        }
        else if (metrics.memory.percentage > 80) {
            alerts.push({
                severity: 'warning',
                message: `Memory usage is high: ${metrics.memory.percentage.toFixed(1)}%`,
            });
        }
        return alerts;
    }
}
exports.MonitoringDashboardService = MonitoringDashboardService;
exports.monitoringDashboardService = MonitoringDashboardService.getInstance();
exports.default = MonitoringDashboardService;
//# sourceMappingURL=monitoring-dashboard.service.js.map