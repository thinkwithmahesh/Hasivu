"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detailedHealthHandler = void 0;
const database_service_1 = require("../../services/database.service");
const redis_service_1 = require("../../services/redis.service");
const logger_service_1 = require("../../services/logger.service");
const logger = logger_service_1.LoggerService.getInstance();
const createResponse = (statusCode, body, headers = {}) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        ...headers
    },
    body: JSON.stringify(body)
});
const detailedHealthHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        logger.info('Starting detailed health check', {
            requestId: context.awsRequestId,
            functionName: context.functionName
        });
        const [databaseHealth, redisHealth] = await Promise.allSettled([
            performDetailedDatabaseCheck(),
            performDetailedRedisCheck()
        ]);
        const services = [
            databaseHealth.status === 'fulfilled' ? databaseHealth.value : createFailedServiceHealth('database', databaseHealth.reason),
            redisHealth.status === 'fulfilled' ? redisHealth.value : createFailedServiceHealth('redis', redisHealth.reason)
        ];
        const overallStatus = determineOverallStatus(services);
        const systemMetrics = getDetailedSystemMetrics();
        const environmentInfo = getEnvironmentInfo();
        const diagnostics = await runDiagnostics(services, systemMetrics);
        const totalResponseTime = Date.now() - startTime;
        const healthResult = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            responseTime: totalResponseTime,
            services,
            system: systemMetrics,
            environment: environmentInfo,
            diagnostics
        };
        logger.info('Detailed health check completed', {
            status: overallStatus,
            responseTime: totalResponseTime,
            servicesChecked: services.length,
            diagnosticsRun: diagnostics.length,
            requestId: context.awsRequestId
        });
        const statusCode = overallStatus === 'healthy' ? 200 :
            overallStatus === 'degraded' ? 200 : 503;
        return createResponse(statusCode, {
            success: true,
            data: healthResult,
            message: `Detailed health check completed - ${overallStatus.toUpperCase()}`
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Detailed health check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            duration,
            requestId: context.awsRequestId
        });
        return createResponse(500, {
            success: false,
            error: 'Internal server error during detailed health check',
            requestId: context.awsRequestId
        });
    }
};
exports.detailedHealthHandler = detailedHealthHandler;
async function performDetailedDatabaseCheck() {
    const startTime = Date.now();
    const tests = [];
    try {
        const testStart = Date.now();
        await database_service_1.DatabaseService.client.$queryRaw `SELECT 1 as test`;
        tests.push({
            name: 'connection',
            status: 'passed',
            responseTime: Date.now() - testStart
        });
    }
    catch (error) {
        tests.push({
            name: 'connection',
            status: 'failed',
            responseTime: 0,
            error: error instanceof Error ? error.message : 'Connection failed'
        });
    }
    try {
        const testStart = Date.now();
        await database_service_1.DatabaseService.client.$queryRaw `SELECT pg_database_size(current_database()) as size`;
        const responseTime = Date.now() - testStart;
        tests.push({
            name: 'performance',
            status: responseTime > 1000 ? 'warning' : 'passed',
            responseTime,
            details: { threshold: '1000ms', actual: `${responseTime}ms` }
        });
    }
    catch (error) {
        tests.push({
            name: 'performance',
            status: 'failed',
            responseTime: 0,
            error: error instanceof Error ? error.message : 'Performance test failed'
        });
    }
    const failedTests = tests.filter(t => t.status === 'failed');
    const warningTests = tests.filter(t => t.status === 'warning');
    const status = failedTests.length > 0 ? 'unhealthy' :
        warningTests.length > 0 ? 'degraded' : 'healthy';
    return {
        name: 'database',
        status,
        responseTime: Date.now() - startTime,
        details: {
            testsRun: tests.length,
            testsPassed: tests.filter(t => t.status === 'passed').length,
            testsWarning: warningTests.length,
            testsFailed: failedTests.length
        },
        tests
    };
}
async function performDetailedRedisCheck() {
    const startTime = Date.now();
    const tests = [];
    try {
        const testStart = Date.now();
        const testKey = `health_detailed:${Date.now()}`;
        await redis_service_1.RedisService.set(testKey, 'test', 5);
        const value = await redis_service_1.RedisService.get(testKey);
        if (value === 'test') {
            tests.push({
                name: 'connection',
                status: 'passed',
                responseTime: Date.now() - testStart
            });
        }
        else {
            tests.push({
                name: 'connection',
                status: 'failed',
                responseTime: Date.now() - testStart,
                error: 'Read/write validation failed'
            });
        }
    }
    catch (error) {
        tests.push({
            name: 'connection',
            status: 'failed',
            responseTime: 0,
            error: error instanceof Error ? error.message : 'Connection failed'
        });
    }
    try {
        const testStart = Date.now();
        const testKey = `perf_test:${Date.now()}`;
        await redis_service_1.RedisService.set(testKey, 'performance_test', 1);
        await redis_service_1.RedisService.get(testKey);
        const responseTime = Date.now() - testStart;
        tests.push({
            name: 'performance',
            status: responseTime > 500 ? 'warning' : 'passed',
            responseTime,
            details: { threshold: '500ms', actual: `${responseTime}ms` }
        });
    }
    catch (error) {
        tests.push({
            name: 'performance',
            status: 'failed',
            responseTime: 0,
            error: error instanceof Error ? error.message : 'Performance test failed'
        });
    }
    const failedTests = tests.filter(t => t.status === 'failed');
    const warningTests = tests.filter(t => t.status === 'warning');
    const status = failedTests.length > 0 ? 'unhealthy' :
        warningTests.length > 0 ? 'degraded' : 'healthy';
    return {
        name: 'redis',
        status,
        responseTime: Date.now() - startTime,
        details: {
            testsRun: tests.length,
            testsPassed: tests.filter(t => t.status === 'passed').length,
            testsWarning: warningTests.length,
            testsFailed: failedTests.length
        },
        tests
    };
}
function createFailedServiceHealth(serviceName, error) {
    return {
        name: serviceName,
        status: 'unhealthy',
        responseTime: 0,
        details: { error: error instanceof Error ? error.message : 'Service check failed' },
        tests: [{
                name: 'initialization',
                status: 'failed',
                responseTime: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            }]
    };
}
function determineOverallStatus(services) {
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');
    if (unhealthyServices.length > 0) {
        return 'unhealthy';
    }
    if (degradedServices.length > 0) {
        return 'degraded';
    }
    return 'healthy';
}
function getDetailedSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    return {
        uptime: process.uptime(),
        memory: {
            used: memoryUsage.heapUsed,
            free: memoryUsage.heapTotal - memoryUsage.heapUsed,
            total: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            external: memoryUsage.external,
            arrayBuffers: memoryUsage.arrayBuffers
        },
        cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
        },
        process: {
            pid: process.pid,
            uptime: process.uptime(),
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version
        }
    };
}
function getEnvironmentInfo() {
    return {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        region: process.env.AWS_REGION || 'unknown',
        stage: process.env.STAGE || 'unknown',
        version: process.env.APP_VERSION || '1.0.0',
        deployment: {
            timestamp: process.env.DEPLOYMENT_TIMESTAMP,
            commit: process.env.GIT_COMMIT,
            branch: process.env.GIT_BRANCH
        }
    };
}
async function runDiagnostics(services, system) {
    const diagnostics = [];
    const memoryUsedPercent = (system.memory.heapUsed / system.memory.heapTotal) * 100;
    if (memoryUsedPercent > 90) {
        diagnostics.push({
            category: 'resource',
            level: 'error',
            message: `Critical memory usage: ${memoryUsedPercent.toFixed(1)}%`,
            details: { threshold: '90%', current: `${memoryUsedPercent.toFixed(1)}%` }
        });
    }
    else if (memoryUsedPercent > 75) {
        diagnostics.push({
            category: 'resource',
            level: 'warning',
            message: `High memory usage: ${memoryUsedPercent.toFixed(1)}%`,
            details: { threshold: '75%', current: `${memoryUsedPercent.toFixed(1)}%` }
        });
    }
    services.forEach(service => {
        if (service.responseTime > 2000) {
            diagnostics.push({
                category: 'performance',
                level: 'warning',
                message: `Slow response time for ${service.name}: ${service.responseTime}ms`,
                details: { service: service.name, responseTime: service.responseTime, threshold: '2000ms' }
            });
        }
    });
    if (process.env.NODE_ENV === 'development') {
        diagnostics.push({
            category: 'configuration',
            level: 'info',
            message: 'Running in development mode',
            details: { nodeEnv: process.env.NODE_ENV }
        });
    }
    return diagnostics;
}
//# sourceMappingURL=detailed.js.map