"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.livenessCheckHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const createResponse = (statusCode, body, headers = {}) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...headers
    },
    body: JSON.stringify(body)
});
const checkLiveness = (context) => {
    const checks = {};
    const issues = [];
    try {
        const remainingTime = context.getRemainingTimeInMillis();
        checks.lambda = {
            status: remainingTime > 1000 ? 'alive' : 'warning',
            remainingTime: `${remainingTime}ms`,
            requestId: context.awsRequestId,
            functionName: context.functionName,
            functionVersion: context.functionVersion,
            message: remainingTime > 1000
                ? 'Lambda execution context is healthy'
                : 'Lambda execution time is running low'
        };
        if (remainingTime <= 1000) {
            issues.push('Lambda execution time running low');
        }
        const uptime = process.uptime();
        const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
        checks.process = {
            status: 'alive',
            uptime: uptimeFormatted,
            uptimeSeconds: Math.floor(uptime),
            pid: process.pid,
            nodeVersion: process.version,
            message: `Process has been running for ${Math.floor(uptime)} seconds`
        };
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
        checks.memory = {
            status: 'alive',
            heapUsed: `${heapUsedMB}MB`,
            heapTotal: `${heapTotalMB}MB`,
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
            message: 'Memory allocation is functioning normally'
        };
        const startTime = Date.now();
        let counter = 0;
        for (let i = 0; i < 100000; i++) {
            counter += i;
        }
        const cpuTestDuration = Date.now() - startTime;
        checks.responsiveness = {
            status: cpuTestDuration < 100 ? 'alive' : 'slow',
            testDuration: `${cpuTestDuration}ms`,
            testResult: counter,
            message: cpuTestDuration < 100
                ? 'CPU and event loop are responsive'
                : 'CPU or event loop may be under stress'
        };
        if (cpuTestDuration >= 100) {
            issues.push('CPU responsiveness is slower than expected');
        }
    }
    catch (error) {
        checks.error = {
            status: 'error',
            message: `Liveness check encountered an error: ${error.message}`
        };
        issues.push('Error during liveness check');
    }
    const alive = issues.length === 0;
    return { alive, checks, issues };
};
const livenessCheckHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Liveness check started', { requestId });
        const livenessResult = checkLiveness(context);
        const duration = Date.now() - startTime;
        const response = {
            alive: livenessResult.alive,
            timestamp: new Date().toISOString(),
            checks: livenessResult.checks,
            issues: livenessResult.issues,
            duration: `${duration}ms`
        };
        logger.info('Liveness check completed', {
            requestId,
            alive: livenessResult.alive,
            issueCount: livenessResult.issues.length,
            duration: `${duration}ms`
        });
        return createResponse(200, {
            success: true,
            data: response,
            message: livenessResult.alive
                ? 'Service is alive and responsive'
                : `Service is alive but has issues: ${livenessResult.issues.join(', ')}`
        });
    }
    catch (error) {
        logger.error('Liveness check failed', {
            requestId,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            stack: error.stack
        });
        return createResponse(200, {
            success: false,
            data: {
                alive: false,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            },
            message: 'Liveness check failed but service is responding'
        });
    }
};
exports.livenessCheckHandler = livenessCheckHandler;
//# sourceMappingURL=live.js.map