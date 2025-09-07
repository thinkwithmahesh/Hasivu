"use strict";
/**
 * HASIVU Platform - Database Health Check Lambda Function
 * Dedicated database health check endpoint
 * Implements: GET /health/database
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseHealthHandler = void 0;
const database_service_1 = require("../../services/database.service");
const logger_service_1 = require("../../services/logger.service");
// Initialize services
const logger = logger_service_1.LoggerService.getInstance();
// Common Lambda response helper
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
/**
 * Database health check handler
 * GET /health/database
 */
const databaseHealthHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        logger.info('Starting database health check', {
            requestId: context.awsRequestId,
            functionName: context.functionName
        });
        // Run database tests
        const tests = await runDatabaseTests();
        // Calculate overall status
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
        // Return appropriate status code based on health
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
            error: error instanceof Error ? error.message : 'Unknown error',
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
/**
 * Run comprehensive database tests
 */
async function runDatabaseTests() {
    const tests = [];
    // Test 1: Basic connection test
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
            error: error instanceof Error ? error.message : 'Unknown connection error'
        });
    }
    // Test 2: Database version check
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
            error: error instanceof Error ? error.message : 'Version check failed'
        });
    }
    // Test 3: Write/Read test (if tables exist)
    try {
        const startTime = Date.now();
        // Check if users table exists
        const tableExists = await database_service_1.DatabaseService.client.$queryRaw `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
        if (tableExists) {
            // Simple count query
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
            error: error instanceof Error ? error.message : 'Read test failed'
        });
    }
    // Test 4: Transaction test
    try {
        const startTime = Date.now();
        await database_service_1.DatabaseService.client.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT 1`;
            // Transaction automatically commits
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
            error: error instanceof Error ? error.message : 'Transaction test failed'
        });
    }
    return tests;
}
