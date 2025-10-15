"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseHealthHandler = void 0;
const database_service_1 = require("../../services/database.service");
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
const databaseHealthHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        logger.info('Starting database health check', {
            requestId: context.awsRequestId,
            functionName: context.functionName
        });
        const tests = await runDatabaseTests();
        const failedTests = tests.filter(test => test.status === 'failed');
        const status = failedTests.length === 0 ? 'healthy' :
            failedTests.length <= 1 ? 'degraded' : 'unhealthy';
        const totalResponseTime = Date.now() - startTime;
        const healthResult = {
            status,
            timestamp: new Date().toISOString(),
            responseTime: totalResponseTime,
            tests
        };
        logger.info('Database health check completed', {
            status,
            responseTime: totalResponseTime,
            testsRun: tests.length,
            failedTests: failedTests.length,
            requestId: context.awsRequestId
        });
        const statusCode = status === 'healthy' ? 200 :
            status === 'degraded' ? 200 : 503;
        return createResponse(statusCode, {
            success: true,
            data: healthResult,
            message: `Database health check completed - ${status.toUpperCase()}`
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Database health check failed', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
            duration,
            requestId: context.awsRequestId
        });
        return createResponse(500, {
            success: false,
            error: 'Internal server error during database health check',
            requestId: context.awsRequestId
        });
    }
};
exports.databaseHealthHandler = databaseHealthHandler;
async function runDatabaseTests() {
    const tests = [];
    try {
        const startTime = Date.now();
        await database_service_1.DatabaseService.client.$queryRaw `SELECT 1 as test`;
        tests.push({
            name: 'connection_test',
            status: 'passed',
            responseTime: Date.now() - startTime
        });
    }
    catch (error) {
        tests.push({
            name: 'connection_test',
            status: 'failed',
            responseTime: 0,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown connection error'
        });
    }
    try {
        const startTime = Date.now();
        await database_service_1.DatabaseService.client.$queryRaw `SELECT version() as version`;
        tests.push({
            name: 'version_check',
            status: 'passed',
            responseTime: Date.now() - startTime
        });
    }
    catch (error) {
        tests.push({
            name: 'version_check',
            status: 'failed',
            responseTime: 0,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Version check failed'
        });
    }
    try {
        const startTime = Date.now();
        const tableExists = await database_service_1.DatabaseService.client.$queryRaw `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
        if (tableExists) {
            await database_service_1.DatabaseService.client.$queryRaw `SELECT COUNT(*) FROM users LIMIT 1`;
        }
        tests.push({
            name: 'read_test',
            status: 'passed',
            responseTime: Date.now() - startTime
        });
    }
    catch (error) {
        tests.push({
            name: 'read_test',
            status: 'failed',
            responseTime: 0,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Read test failed'
        });
    }
    try {
        const startTime = Date.now();
        await database_service_1.DatabaseService.client.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT 1`;
        });
        tests.push({
            name: 'transaction_test',
            status: 'passed',
            responseTime: Date.now() - startTime
        });
    }
    catch (error) {
        tests.push({
            name: 'transaction_test',
            status: 'failed',
            responseTime: 0,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Transaction test failed'
        });
    }
    return tests;
}
//# sourceMappingURL=database-health.js.map