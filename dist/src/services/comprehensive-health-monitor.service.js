"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComprehensiveHealthMonitorService = void 0;
const pg_1 = require("pg");
const axios_1 = __importDefault(require("axios"));
const aws_sdk_1 = require("aws-sdk");
const logger_1 = require("@/utils/logger");
const circuit_breaker_service_1 = require("./circuit-breaker.service");
const redis_service_1 = require("./redis.service");
class ComprehensiveHealthMonitorService {
    pgClient;
    redis;
    cloudwatch;
    circuitBreakers;
    services;
    lastHealthCheck = null;
    healthCheckInterval = null;
    constructor() {
        this.pgClient = new pg_1.Client({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectionTimeoutMillis: 5000,
            query_timeout: 10000,
            statement_timeout: 10000,
            idle_in_transaction_session_timeout: 10000
        });
        this.redis = redis_service_1.RedisService;
        this.cloudwatch = new aws_sdk_1.CloudWatch({ region: process.env.AWS_REGION });
        this.circuitBreakers = new Map();
        this.services = this.initializeServiceConfigs();
        this.setupCircuitBreakers();
    }
    initializeServiceConfigs() {
        return [
            {
                name: 'postgresql',
                type: 'database',
                enabled: true,
                timeout: 5000,
                retryAttempts: 3,
                criticalityLevel: 'critical',
                healthThresholds: {
                    responseTime: 1000,
                    errorRate: 5
                }
            },
            {
                name: 'redis',
                type: 'cache',
                enabled: true,
                timeout: 3000,
                retryAttempts: 2,
                criticalityLevel: 'high',
                healthThresholds: {
                    responseTime: 500,
                    errorRate: 10
                }
            },
            {
                name: 'aws-s3',
                type: 'storage',
                enabled: true,
                timeout: 10000,
                retryAttempts: 3,
                criticalityLevel: 'medium',
                healthThresholds: {
                    responseTime: 2000,
                    errorRate: 15
                }
            },
            {
                name: 'whatsapp-api',
                type: 'notification',
                enabled: !!process.env.WHATSAPP_ACCESS_TOKEN,
                timeout: 8000,
                retryAttempts: 2,
                criticalityLevel: 'medium',
                healthThresholds: {
                    responseTime: 3000,
                    errorRate: 20
                }
            },
            {
                name: 'sms-gateway',
                type: 'notification',
                enabled: !!process.env.SMS_GATEWAY_URL,
                timeout: 8000,
                retryAttempts: 2,
                criticalityLevel: 'medium',
                healthThresholds: {
                    responseTime: 3000,
                    errorRate: 20
                }
            },
            {
                name: 'email-service',
                type: 'notification',
                enabled: !!process.env.SMTP_HOST,
                timeout: 8000,
                retryAttempts: 2,
                criticalityLevel: 'medium',
                healthThresholds: {
                    responseTime: 3000,
                    errorRate: 20
                }
            }
        ];
    }
    setupCircuitBreakers() {
        for (const service of this.services) {
            if (!service.enabled)
                continue;
            let circuitBreaker;
            switch (service.type) {
                case 'database':
                    circuitBreaker = circuit_breaker_service_1.CircuitBreakerFactory.createDatabaseCircuitBreaker(service.name);
                    break;
                case 'cache':
                    circuitBreaker = circuit_breaker_service_1.CircuitBreakerFactory.createRedisCircuitBreaker(service.name);
                    break;
                default:
                    circuitBreaker = circuit_breaker_service_1.CircuitBreakerFactory.createExternalApiCircuitBreaker(service.name);
                    break;
            }
            this.circuitBreakers.set(service.name, circuitBreaker);
        }
    }
    async performComprehensiveHealthCheck() {
        const startTime = Date.now();
        const results = [];
        const enabledServices = this.services.filter(s => s.enabled);
        logger_1.logger.info('Starting comprehensive health check');
        const healthCheckPromises = enabledServices.map(async (service, index) => {
            const circuitBreaker = this.circuitBreakers.get(service.name);
            if (!circuitBreaker) {
                return this.createErrorResult(service.name, 'Circuit breaker not found');
            }
            try {
                return await circuitBreaker.execute(async () => {
                    switch (service.name) {
                        case 'postgresql':
                            return await this.checkPostgreSQL(service);
                        case 'redis':
                            return await this.checkRedis(service);
                        case 'aws-s3':
                            return await this.checkAWS_S3(service);
                        case 'whatsapp-api':
                            return await this.checkWhatsAppAPI(service);
                        case 'sms-gateway':
                            return await this.checkSMSGateway(service);
                        case 'email-service':
                            return await this.checkEmailService(service);
                        default:
                            return this.createErrorResult(service.name, 'Unknown service type');
                    }
                });
            }
            catch (error) {
                return this.createErrorResult(service.name, error.message);
            }
        });
        const healthCheckResults = await Promise.all(healthCheckPromises);
        results.push(...healthCheckResults);
        const totalTime = Date.now() - startTime;
        const report = this.generateHealthReport(results, totalTime);
        this.lastHealthCheck = report;
        logger_1.logger.info(`Health check completed in ${totalTime}ms with overall status: ${report.overallStatus}`);
        return report;
    }
    async checkPostgreSQL(service) {
        const startTime = Date.now();
        try {
            await this.pgClient.connect();
            const basicQuery = await this.pgClient.query('SELECT 1 as test');
            const performanceQuery = await this.pgClient.query(`
        SELECT 
          count(*) as total_connections,
          max(state) as max_state
        FROM pg_stat_activity 
        WHERE state IS NOT NULL
      `);
            const tableQuery = await this.pgClient.query(`
        SELECT count(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
            await this.pgClient.end();
            const responseTime = Date.now() - startTime;
            const score = this.calculateHealthScore(service, responseTime, 0);
            return {
                name: service.name,
                status: this.determineStatus(service, responseTime, 0),
                responseTime,
                details: {
                    basicQuery: basicQuery.rows[0],
                    performance: performanceQuery.rows[0],
                    tableCount: tableQuery.rows[0].table_count,
                    connectionString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
                },
                timestamp: new Date(),
                score
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return this.createErrorResult(service.name, error.message, responseTime);
        }
    }
    async checkRedis(service) {
        const startTime = Date.now();
        try {
            const pong = await this.redis.ping();
            const testKey = `health_check_${Date.now()}`;
            await this.redis.set(testKey, 'test_value', 10);
            const testValue = await this.redis.get(testKey);
            await this.redis.del(testKey);
            const memoryInfo = 'not_available';
            const responseTime = Date.now() - startTime;
            const score = this.calculateHealthScore(service, responseTime, 0);
            return {
                name: service.name,
                status: this.determineStatus(service, responseTime, 0),
                responseTime,
                details: {
                    ping: pong,
                    readWriteTest: testValue === 'test_value',
                    memoryUsage: memoryInfo || 'unknown',
                    redisVersion: 'in_memory_cache'
                },
                timestamp: new Date(),
                score
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return this.createErrorResult(service.name, error.message, responseTime);
        }
    }
    async checkAWS_S3(service) {
        const startTime = Date.now();
        try {
            const s3 = new (require('aws-sdk')).S3();
            const buckets = await s3.listBuckets().promise();
            const testKey = `health-check-${Date.now()}.txt`;
            const testBucket = process.env.AWS_S3_BUCKET;
            if (testBucket) {
                await s3.putObject({
                    Bucket: testBucket,
                    Key: testKey,
                    Body: 'health check test',
                    ContentType: 'text/plain'
                }).promise();
                const object = await s3.getObject({
                    Bucket: testBucket,
                    Key: testKey
                }).promise();
                await s3.deleteObject({
                    Bucket: testBucket,
                    Key: testKey
                }).promise();
            }
            const responseTime = Date.now() - startTime;
            const score = this.calculateHealthScore(service, responseTime, 0);
            return {
                name: service.name,
                status: this.determineStatus(service, responseTime, 0),
                responseTime,
                details: {
                    bucketsCount: buckets.Buckets?.length || 0,
                    testBucket: testBucket || 'not configured',
                    readWriteTest: true,
                    region: process.env.AWS_REGION
                },
                timestamp: new Date(),
                score
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return this.createErrorResult(service.name, error.message, responseTime);
        }
    }
    async checkWhatsAppAPI(service) {
        const startTime = Date.now();
        try {
            const response = await axios_1.default.get('https://graph.facebook.com/v17.0/me', {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
                },
                timeout: service.timeout
            });
            const responseTime = Date.now() - startTime;
            const score = this.calculateHealthScore(service, responseTime, 0);
            return {
                name: service.name,
                status: this.determineStatus(service, responseTime, 0),
                responseTime,
                details: {
                    apiResponse: response.data,
                    statusCode: response.status,
                    apiVersion: 'v17.0'
                },
                timestamp: new Date(),
                score
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return this.createErrorResult(service.name, error.message, responseTime);
        }
    }
    async checkSMSGateway(service) {
        const startTime = Date.now();
        try {
            const response = await axios_1.default.get(`${process.env.SMS_GATEWAY_URL}/health`, {
                timeout: service.timeout,
                headers: {
                    'Authorization': process.env.SMS_GATEWAY_TOKEN || ''
                }
            });
            const responseTime = Date.now() - startTime;
            const score = this.calculateHealthScore(service, responseTime, 0);
            return {
                name: service.name,
                status: this.determineStatus(service, responseTime, 0),
                responseTime,
                details: {
                    gatewayResponse: response.data,
                    statusCode: response.status,
                    gatewayUrl: process.env.SMS_GATEWAY_URL
                },
                timestamp: new Date(),
                score
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return this.createErrorResult(service.name, error.message, responseTime);
        }
    }
    async checkEmailService(service) {
        const startTime = Date.now();
        try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });
            await transporter.verify();
            const responseTime = Date.now() - startTime;
            const score = this.calculateHealthScore(service, responseTime, 0);
            return {
                name: service.name,
                status: this.determineStatus(service, responseTime, 0),
                responseTime,
                details: {
                    smtpHost: process.env.SMTP_HOST,
                    smtpPort: process.env.SMTP_PORT,
                    connectionVerified: true
                },
                timestamp: new Date(),
                score
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return this.createErrorResult(service.name, error.message, responseTime);
        }
    }
    createErrorResult(serviceName, error, responseTime = 0) {
        return {
            name: serviceName,
            status: 'unhealthy',
            responseTime,
            details: { error },
            error,
            timestamp: new Date(),
            score: 0
        };
    }
    calculateHealthScore(service, responseTime, errorRate) {
        let score = 100;
        if (responseTime > service.healthThresholds.responseTime) {
            const penalty = Math.min(50, (responseTime / service.healthThresholds.responseTime - 1) * 25);
            score -= penalty;
        }
        if (errorRate > service.healthThresholds.errorRate) {
            const penalty = Math.min(50, (errorRate / service.healthThresholds.errorRate - 1) * 25);
            score -= penalty;
        }
        return Math.max(0, Math.round(score));
    }
    determineStatus(service, responseTime, errorRate) {
        if (errorRate > service.healthThresholds.errorRate * 2) {
            return 'unhealthy';
        }
        if (responseTime > service.healthThresholds.responseTime * 2) {
            return 'unhealthy';
        }
        if (errorRate > service.healthThresholds.errorRate || responseTime > service.healthThresholds.responseTime) {
            return 'degraded';
        }
        return 'healthy';
    }
    generateHealthReport(results, executionTime) {
        const summary = {
            total: results.length,
            healthy: results.filter(r => r.status === 'healthy').length,
            degraded: results.filter(r => r.status === 'degraded').length,
            unhealthy: results.filter(r => r.status === 'unhealthy').length,
            averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
        };
        const overallScore = this.calculateOverallScore(results);
        let overallStatus;
        if (summary.unhealthy > 0) {
            const criticalUnhealthy = results.filter(r => r.status === 'unhealthy' &&
                this.services.find(s => s.name === r.name)?.criticalityLevel === 'critical');
            overallStatus = criticalUnhealthy.length > 0 ? 'unhealthy' : 'degraded';
        }
        else if (summary.degraded > 0) {
            overallStatus = 'degraded';
        }
        else {
            overallStatus = 'healthy';
        }
        const recommendations = this.generateRecommendations(results);
        return {
            overallStatus,
            overallScore,
            services: results,
            summary,
            recommendations,
            timestamp: new Date(),
            executionTime
        };
    }
    calculateOverallScore(results) {
        let totalWeight = 0;
        let weightedSum = 0;
        for (const result of results) {
            const service = this.services.find(s => s.name === result.name);
            if (!service)
                continue;
            let weight = 1;
            switch (service.criticalityLevel) {
                case 'critical':
                    weight = 4;
                    break;
                case 'high':
                    weight = 3;
                    break;
                case 'medium':
                    weight = 2;
                    break;
                case 'low':
                    weight = 1;
                    break;
            }
            weightedSum += result.score * weight;
            totalWeight += weight;
        }
        return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    }
    generateRecommendations(results) {
        const recommendations = [];
        for (const check of results) {
            const service = this.services.find(s => s.name === check.name);
            if (!service)
                continue;
            if (check.status === 'unhealthy') {
                if (service.criticalityLevel === 'critical') {
                    recommendations.push(`CRITICAL: ${check.name} service is down - ${check.error}`);
                }
                else {
                    recommendations.push(`WARNING: ${check.name} service issues detected - ${check.error}`);
                }
            }
            else if (check.status === 'degraded') {
                recommendations.push(`NOTICE: ${check.name} service performance degraded`);
            }
            if (check.responseTime > service.healthThresholds.responseTime) {
                recommendations.push(`Performance issue: ${check.name} response time is ${check.responseTime}ms (threshold: ${service.healthThresholds.responseTime}ms)`);
            }
        }
        const summary = {
            unhealthy: results.filter(r => r.status === 'unhealthy').length,
            degraded: results.filter(r => r.status === 'degraded').length
        };
        if (summary.unhealthy > 1) {
            recommendations.push('ALERT: Multiple services are unhealthy. Consider scaling or maintenance.');
        }
        if (summary.degraded > 2) {
            recommendations.push('WARNING: Multiple services showing degraded performance. Monitor resource usage.');
        }
        return recommendations;
    }
    startContinuousMonitoring(intervalMs = 60000) {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.performComprehensiveHealthCheck();
            }
            catch (error) {
                logger_1.logger.error('Continuous health monitoring error:', error);
            }
        }, intervalMs);
        logger_1.logger.info(`Started continuous health monitoring with ${intervalMs}ms interval`);
    }
    stopContinuousMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            logger_1.logger.info('Stopped continuous health monitoring');
        }
    }
    getLastHealthCheck() {
        return this.lastHealthCheck;
    }
    getCircuitBreakerStatus(serviceName) {
        const circuitBreaker = this.circuitBreakers.get(serviceName);
        return circuitBreaker ? circuitBreaker.getStats() : null;
    }
    forceCircuitBreakerState(serviceName, state) {
        const circuitBreaker = this.circuitBreakers.get(serviceName);
        if (circuitBreaker) {
            circuitBreaker.forceState(state);
            logger_1.logger.warn(`Circuit breaker opened for ${serviceName}`);
        }
    }
    async getSystemMetrics() {
        try {
            const params = {
                MetricDataQueries: [
                    {
                        Id: 'cpu',
                        MetricStat: {
                            Metric: {
                                Namespace: 'AWS/EC2',
                                MetricName: 'CPUUtilization'
                            },
                            Period: 300,
                            Stat: 'Average'
                        }
                    }
                ],
                StartTime: new Date(Date.now() - 5 * 60 * 1000),
                EndTime: new Date()
            };
            const result = await this.cloudwatch.getMetricData(params).promise();
            return {
                cpuUsage: 0,
                memoryUsage: 0,
                diskUsage: 0,
                networkLatency: 0,
                activeConnections: 0,
                queueDepth: 0,
                errorRate: 0,
                throughput: 0
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch system metrics:', error);
            return null;
        }
    }
    parseRedisInfo(info, metric) {
        const match = info.match(new RegExp(`${metric}:(\\d+)`));
        return match ? match[1] : null;
    }
    async cleanup() {
        this.stopContinuousMonitoring();
        try {
            await this.pgClient.end();
        }
        catch (error) {
            logger_1.logger.warn('Error closing PostgreSQL connection:', error);
        }
        try {
            await this.redis.disconnect();
        }
        catch (error) {
            logger_1.logger.warn('Error closing Redis connection:', error);
        }
    }
}
exports.ComprehensiveHealthMonitorService = ComprehensiveHealthMonitorService;
exports.default = ComprehensiveHealthMonitorService;
//# sourceMappingURL=comprehensive-health-monitor.service.js.map