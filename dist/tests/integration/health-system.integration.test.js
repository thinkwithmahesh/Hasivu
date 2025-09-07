"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const health_monitor_service_1 = require("@/services/health-monitor.service");
const graceful_degradation_service_1 = require("@/services/graceful-degradation.service");
const circuit_breaker_service_1 = require("@/services/circuit-breaker.service");
const database_service_1 = require("@/services/database.service");
const redis_service_1 = require("@/services/redis.service");
const logger_1 = require("@/utils/logger");
const notification_service_1 = require("@/services/notification.service");
globals_1.jest.mock('@/services/database.service');
globals_1.jest.mock('@/services/redis.service');
globals_1.jest.mock('@/utils/logger');
globals_1.jest.mock('@/services/notification.service');
const mockDatabaseService = database_service_1.DatabaseService;
const mockRedisService = redis_service_1.RedisService;
const mockLogger = logger_1.logger;
const mockNotificationService = notification_service_1.NotificationService;
const mockMetricsCollector = {
    histogram: globals_1.jest.fn(),
    gauge: globals_1.jest.fn(),
    increment: globals_1.jest.fn(),
    counter: globals_1.jest.fn()
};
const eventBus = {
    on: globals_1.jest.fn(),
    emit: globals_1.jest.fn(),
    off: globals_1.jest.fn()
};
(0, globals_1.describe)('Health System Integration', () => {
    let originalEnvironment;
    let healthMonitorService;
    let gracefulDegradationService;
    let circuitBreakerRegistry;
    (0, globals_1.beforeEach)(async () => {
        originalEnvironment = process.env.NODE_ENV || 'test';
        process.env.NODE_ENV = 'test';
        globals_1.jest.clearAllMocks();
        const mockQueryRaw = globals_1.jest.fn().mockResolvedValue([{ health_check: 1 }]);
        mockDatabaseService.client = {
            $queryRaw: mockQueryRaw
        };
        mockRedisService.ping.mockResolvedValue('PONG');
        mockRedisService.get.mockImplementation((key) => Promise.resolve(key.includes('health') ? '{"status":"healthy"}' : null));
        mockRedisService.set.mockResolvedValue('OK');
        if ('sendAlert' in mockNotificationService && typeof mockNotificationService.sendAlert === 'function') {
            mockNotificationService.sendAlert.mockResolvedValue(true);
        }
        else {
            const mockSendAlert = globals_1.jest.fn().mockResolvedValue(true);
            mockNotificationService.sendAlert = mockSendAlert;
        }
        try {
            const healthConfig = {
                checkInterval: 5000,
                timeout: 2000,
                retries: 3,
                enabledChecks: ['database', 'redis', 'external-api'],
                thresholds: {
                    cpu: 80,
                    memory: 85,
                    responseTime: 1000,
                    errorRate: 2
                },
                alerting: {
                    enabled: true
                }
            };
            healthMonitorService = new health_monitor_service_1.HealthMonitorService(healthConfig);
            gracefulDegradationService = new graceful_degradation_service_1.GracefulDegradationService();
            circuitBreakerRegistry = new circuit_breaker_service_1.CircuitBreakerRegistry();
            if ('initialize' in gracefulDegradationService && typeof gracefulDegradationService.initialize === 'function') {
                await gracefulDegradationService.initialize([]);
            }
            if ('start' in healthMonitorService && typeof healthMonitorService.start === 'function') {
                await healthMonitorService.start();
            }
            if ('reset' in circuitBreakerRegistry && typeof circuitBreakerRegistry.reset === 'function') {
                circuitBreakerRegistry.reset();
            }
        }
        catch (error) {
            console.warn('Service initialization partial:', error);
        }
    });
    (0, globals_1.afterEach)(async () => {
        process.env.NODE_ENV = originalEnvironment;
    });
    (0, globals_1.describe)('Healthy System State', () => {
        (0, globals_1.test)('should maintain healthy state with successful operations', async () => {
            const mockDatabaseOperation = globals_1.jest.fn().mockResolvedValue({ id: 'test', data: 'success' });
            const mockRedisOperation = globals_1.jest.fn().mockResolvedValue('OK');
            const dbResult = await gracefulDegradationService.executeDatabase(mockDatabaseOperation);
            const redisResult = await gracefulDegradationService.executeRedis(mockRedisOperation);
            (0, globals_1.expect)(dbResult).toEqual({ id: 'test', data: 'success' });
            (0, globals_1.expect)(redisResult).toBe('OK');
            const systemHealth = gracefulDegradationService.getSystemHealth();
            (0, globals_1.expect)(systemHealth.overallStatus).toBe('HEALTHY');
            (0, globals_1.expect)(systemHealth.summary.healthy).toBeGreaterThan(0);
            (0, globals_1.expect)(systemHealth.summary.unavailable).toBe(0);
            (0, globals_1.expect)(systemHealth.services.length).toBeGreaterThan(0);
        });
        (0, globals_1.test)('should report accurate health metrics', async () => {
            const healthStatus = await healthMonitorService.getSystemHealth();
            (0, globals_1.expect)(healthStatus.overallStatus).toBe('healthy');
            (0, globals_1.expect)(healthStatus.lastUpdated).toBeDefined();
            (0, globals_1.expect)(healthStatus.uptime).toBeGreaterThan(0);
            (0, globals_1.expect)(healthStatus.checks).toEqual(globals_1.expect.arrayContaining([
                globals_1.expect.objectContaining({
                    service: 'database',
                    status: 'healthy',
                    responseTime: globals_1.expect.any(Number)
                }),
                globals_1.expect.objectContaining({
                    service: 'redis',
                    status: 'healthy',
                    responseTime: globals_1.expect.any(Number)
                })
            ]));
        });
        (0, globals_1.test)('should track performance metrics during healthy operations', async () => {
            const startTime = Date.now();
            const operations = Array.from({ length: 5 }, (_, i) => gracefulDegradationService.executeDatabase(globals_1.jest.fn().mockResolvedValue({ id: `test-${i}` })));
            await Promise.all(operations);
            const endTime = Date.now();
            const duration = endTime - startTime;
            (0, globals_1.expect)(mockMetricsCollector.histogram).toHaveBeenCalledWith('health_system.operation_duration', globals_1.expect.any(Number), globals_1.expect.objectContaining({
                operation: globals_1.expect.any(String),
                service: globals_1.expect.any(String)
            }));
            (0, globals_1.expect)(duration).toBeLessThan(1000);
        });
    });
    (0, globals_1.describe)('Service Degradation Scenarios', () => {
        (0, globals_1.test)('should detect and handle database service failures', async () => {
            const failingOperation = globals_1.jest.fn().mockRejectedValue(new Error('Database connection lost'));
            const fallbackOperation = globals_1.jest.fn().mockResolvedValue({ cached: true });
            gracefulDegradationService.configureFallback('database', globals_1.jest.fn().mockResolvedValue({ cached: true }));
            for (let i = 0; i < 3; i++) {
                try {
                    await gracefulDegradationService.executeDatabase(failingOperation, {
                        fallbackData: { cached: true }
                    });
                }
                catch (error) {
                }
            }
            await new Promise(resolve => setTimeout(resolve, 300));
            const systemHealth = gracefulDegradationService.getSystemHealth();
            const healthMonitorStatus = await healthMonitorService.getSystemHealth();
            (0, globals_1.expect)(systemHealth.overallStatus).not.toBe('HEALTHY');
            (0, globals_1.expect)(healthMonitorStatus.overallStatus).not.toBe('healthy');
            (0, globals_1.expect)(systemHealth.services.some(s => s.status === 'DEGRADED')).toBe(true);
        });
        (0, globals_1.test)('should use fallbacks when services are degraded', async () => {
            const failingOperation = globals_1.jest.fn().mockRejectedValue(new Error('Service unavailable'));
            const fallbackData = { id: 'fallback', source: 'cache' };
            await gracefulDegradationService.setServiceState('database', 'DEGRADED');
            const result = await gracefulDegradationService.executeDatabase(failingOperation, {
                fallbackData
            });
            (0, globals_1.expect)(result).toEqual(fallbackData);
            (0, globals_1.expect)(failingOperation).not.toHaveBeenCalled();
        });
        (0, globals_1.test)('should handle Redis service failures gracefully', async () => {
            mockRedisService.ping.mockRejectedValue(new Error('Redis connection timeout'));
            mockRedisService.get.mockRejectedValue(new Error('Redis unavailable'));
            const failingRedisOperation = globals_1.jest.fn().mockRejectedValue(new Error('Redis error'));
            const result = await gracefulDegradationService.executeRedis(failingRedisOperation);
            (0, globals_1.expect)(result).toBeUndefined();
            await new Promise(resolve => setTimeout(resolve, 300));
            const healthStatus = await healthMonitorService.getSystemHealth();
            const redisService = healthStatus.checks.find(s => s.service === 'redis');
            (0, globals_1.expect)(redisService?.status).not.toBe('healthy');
        });
        (0, globals_1.test)('should maintain service isolation during failures', async () => {
            const failingDbOperation = globals_1.jest.fn().mockRejectedValue(new Error('Database error'));
            const successRedisOperation = globals_1.jest.fn().mockResolvedValue('OK');
            try {
                await gracefulDegradationService.executeDatabase(failingDbOperation);
            }
            catch (error) {
            }
            const redisResult = await gracefulDegradationService.executeRedis(successRedisOperation);
            (0, globals_1.expect)(redisResult).toBe('OK');
            await new Promise(resolve => setTimeout(resolve, 300));
            const systemHealth = gracefulDegradationService.getSystemHealth();
            (0, globals_1.expect)(systemHealth.overallStatus).toBe('DEGRADED');
            (0, globals_1.expect)(systemHealth.summary.healthy).toBeGreaterThan(0);
            (0, globals_1.expect)(systemHealth.summary.degraded).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('Circuit Breaker Integration', () => {
        (0, globals_1.test)('should coordinate circuit breaker state with health monitoring', async () => {
            const circuitBreaker = circuitBreakerRegistry.getCircuitBreaker('test-service');
            for (let i = 0; i < 5; i++) {
                try {
                    await circuitBreaker.call(async () => {
                        throw new Error('Service failure');
                    });
                }
                catch (error) {
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            const circuitBreakerStats = circuitBreakerRegistry.getHealthSummary();
            const systemHealth = await healthMonitorService.getSystemHealth();
            (0, globals_1.expect)(circuitBreakerStats.failed).toBeGreaterThan(0);
            (0, globals_1.expect)(systemHealth.circuitBreakers.failed).toBeGreaterThan(0);
            (0, globals_1.expect)(systemHealth.circuitBreakers.open).toBeGreaterThan(0);
        });
        (0, globals_1.test)('should integrate circuit breaker status with health monitoring', async () => {
            const circuitBreaker = circuitBreakerRegistry.getCircuitBreaker('critical-service');
            circuitBreaker.forceHalfOpen();
            const healthStatus = await healthMonitorService.getSystemHealth();
            const circuitBreakerCheck = healthStatus.checks.find(check => check.service === 'circuitBreakers');
            (0, globals_1.expect)(circuitBreakerCheck?.status).toBeDefined();
            (0, globals_1.expect)(healthStatus.overallStatus).not.toBe('healthy');
        });
        (0, globals_1.test)('should recover when circuit breakers close', async () => {
            const circuitBreaker = circuitBreakerRegistry.getCircuitBreaker('recovery-service');
            for (let i = 0; i < 5; i++) {
                try {
                    await circuitBreaker.call(async () => {
                        throw new Error('Initial failure');
                    });
                }
                catch (error) {
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            circuitBreaker.forceHalfOpen();
            for (let i = 0; i < 3; i++) {
                await circuitBreaker.call(async () => {
                    return `success-${i}`;
                });
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            const healthStatus = await healthMonitorService.getSystemHealth();
            const circuitBreakerStats = circuitBreakerRegistry.getHealthSummary();
            (0, globals_1.expect)(circuitBreakerStats.closed).toBeGreaterThan(0);
            (0, globals_1.expect)(healthStatus.overallStatus).toBe('healthy');
        });
    });
    (0, globals_1.describe)('System Recovery Scenarios', () => {
        (0, globals_1.test)('should recover from service failures automatically', async () => {
            await gracefulDegradationService.setServiceState('database', 'UNAVAILABLE');
            let systemHealth = gracefulDegradationService.getSystemHealth();
            (0, globals_1.expect)(systemHealth.overallStatus).not.toBe('HEALTHY');
            mockDatabaseService.client.$queryRaw.mockResolvedValue([{ health_check: 1 }]);
            const successOperation = globals_1.jest.fn().mockResolvedValue({ id: 'success' });
            for (let i = 0; i < 5; i++) {
                await gracefulDegradationService.executeDatabase(successOperation);
            }
            await new Promise(resolve => setTimeout(resolve, 300));
            systemHealth = gracefulDegradationService.getSystemHealth();
            (0, globals_1.expect)(systemHealth.overallStatus).toBe('HEALTHY');
            (0, globals_1.expect)(systemHealth.summary.healthy).toBeGreaterThan(0);
        });
        (0, globals_1.test)('should handle partial system recovery', async () => {
            await gracefulDegradationService.setServiceState('database', 'DEGRADED');
            await gracefulDegradationService.setServiceState('redis', 'HEALTHY');
            const systemHealth = gracefulDegradationService.getSystemHealth();
            (0, globals_1.expect)(systemHealth.overallStatus).toBe('DEGRADED');
            (0, globals_1.expect)(systemHealth.summary.healthy).toBeGreaterThan(0);
            (0, globals_1.expect)(systemHealth.summary.degraded).toBeGreaterThan(0);
            (0, globals_1.expect)(systemHealth.summary.unavailable).toBe(0);
        });
        (0, globals_1.test)('should maintain recovery state consistency', async () => {
            await gracefulDegradationService.setServiceState('database', 'DEGRADED');
            const healthBefore = gracefulDegradationService.getSystemHealth();
            const monitorBefore = await healthMonitorService.getSystemHealth();
            (0, globals_1.expect)(healthBefore.overallStatus).toBe('DEGRADED');
            (0, globals_1.expect)(monitorBefore.overallStatus).toBe('degraded');
            const successfulOp = globals_1.jest.fn().mockResolvedValue({ recovered: true });
            for (let i = 0; i < 10; i++) {
                await gracefulDegradationService.executeDatabase(successfulOp);
            }
            await new Promise(resolve => setTimeout(resolve, 300));
            const healthAfter = gracefulDegradationService.getSystemHealth();
            const monitorAfter = await healthMonitorService.getSystemHealth();
            (0, globals_1.expect)(healthAfter.overallStatus).toBe('HEALTHY');
            (0, globals_1.expect)(monitorAfter.overallStatus).toBe('healthy');
        });
    });
    (0, globals_1.describe)('Comprehensive Health Reporting', () => {
        (0, globals_1.test)('should track health metrics over time', async () => {
            const startTime = Date.now();
            const operations = [
                () => gracefulDegradationService.executeDatabase(globals_1.jest.fn().mockResolvedValue({ test: 1 })),
                () => gracefulDegradationService.executeRedis(globals_1.jest.fn().mockResolvedValue('OK')),
                () => healthMonitorService.runHealthChecks()
            ];
            for (const operation of operations) {
                await operation();
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            const endTime = Date.now();
            const duration = endTime - startTime;
            (0, globals_1.expect)(mockMetricsCollector.gauge).toHaveBeenCalledWith(globals_1.expect.stringMatching(/health_system\./), globals_1.expect.any(Number), globals_1.expect.any(Object));
            (0, globals_1.expect)(mockMetricsCollector.histogram).toHaveBeenCalledWith(globals_1.expect.stringMatching(/operation_duration|health_check_duration/), globals_1.expect.any(Number), globals_1.expect.any(Object));
            (0, globals_1.expect)(duration).toBeLessThan(2000);
        });
        (0, globals_1.test)('should generate comprehensive health reports', async () => {
            await gracefulDegradationService.executeDatabase(globals_1.jest.fn().mockResolvedValue({ id: 1 }));
            await gracefulDegradationService.executeRedis(globals_1.jest.fn().mockResolvedValue('SET'));
            const healthReport = await healthMonitorService.generateHealthReport();
            (0, globals_1.expect)(healthReport).toMatchObject({
                timestamp: globals_1.expect.any(String),
                overall: globals_1.expect.stringMatching(/healthy|degraded|unhealthy/),
                uptime: globals_1.expect.any(Number),
                services: globals_1.expect.arrayContaining([
                    globals_1.expect.objectContaining({
                        service: globals_1.expect.any(String),
                        status: globals_1.expect.any(String),
                        responseTime: globals_1.expect.any(Number),
                        lastCheck: globals_1.expect.any(String)
                    })
                ]),
                circuitBreakers: globals_1.expect.objectContaining({
                    total: globals_1.expect.any(Number),
                    closed: globals_1.expect.any(Number),
                    open: globals_1.expect.any(Number),
                    halfOpen: globals_1.expect.any(Number)
                }),
                resources: globals_1.expect.objectContaining({
                    memory: globals_1.expect.any(Object),
                    cpu: globals_1.expect.any(Object)
                })
            });
        });
        (0, globals_1.test)('should provide detailed service diagnostics', async () => {
            const serviceDiagnostics = await healthMonitorService.getServiceDiagnostics('database');
            (0, globals_1.expect)(serviceDiagnostics).toMatchObject({
                service: 'database',
                status: globals_1.expect.any(String),
                metrics: globals_1.expect.objectContaining({
                    responseTime: globals_1.expect.any(Number),
                    successRate: globals_1.expect.any(Number),
                    errorRate: globals_1.expect.any(Number)
                }),
                history: globals_1.expect.any(Array),
                recommendations: globals_1.expect.any(Array)
            });
        });
    });
    (0, globals_1.describe)('Health Check Endpoints Simulation', () => {
        (0, globals_1.test)('should support liveness checks', async () => {
            const livenessCheck = await healthMonitorService.checkLiveness();
            (0, globals_1.expect)(livenessCheck).toMatchObject({
                status: 'alive',
                timestamp: globals_1.expect.any(String),
                uptime: globals_1.expect.any(Number),
                version: globals_1.expect.any(String)
            });
        });
        (0, globals_1.test)('should support readiness checks', async () => {
            const readinessCheck = await healthMonitorService.checkReadiness();
            (0, globals_1.expect)(readinessCheck).toMatchObject({
                status: globals_1.expect.stringMatching(/ready|not_ready/),
                timestamp: globals_1.expect.any(String),
                dependencies: globals_1.expect.objectContaining({
                    database: globals_1.expect.any(Boolean),
                    redis: globals_1.expect.any(Boolean)
                }),
                services: globals_1.expect.any(Array)
            });
        });
        (0, globals_1.test)('should handle force health check runs', async () => {
            const startTime = Date.now();
            const forceCheck = await healthMonitorService.forceHealthCheck();
            const endTime = Date.now();
            const duration = endTime - startTime;
            (0, globals_1.expect)(forceCheck).toMatchObject({
                forced: true,
                timestamp: globals_1.expect.any(String),
                overall: globals_1.expect.any(String),
                services: globals_1.expect.any(Array),
                duration: globals_1.expect.any(Number)
            });
            (0, globals_1.expect)(duration).toBeLessThan(5000);
        });
        (0, globals_1.test)('should support startup health validation', async () => {
            await healthMonitorService.stop();
            const startupValidation = await healthMonitorService.validateStartup();
            (0, globals_1.expect)(startupValidation).toMatchObject({
                valid: globals_1.expect.any(Boolean),
                requirements: globals_1.expect.objectContaining({
                    database: globals_1.expect.any(Boolean),
                    redis: globals_1.expect.any(Boolean),
                    environment: globals_1.expect.any(Boolean)
                }),
                errors: globals_1.expect.any(Array),
                warnings: globals_1.expect.any(Array)
            });
            await healthMonitorService.start();
        });
    });
    (0, globals_1.describe)('Error Propagation and Isolation', () => {
        (0, globals_1.test)('should isolate failures between different services', async () => {
            const failingDbOperation = globals_1.jest.fn().mockRejectedValue(new Error('DB failure'));
            const successRedisOperation = globals_1.jest.fn().mockResolvedValue('OK');
            try {
                await gracefulDegradationService.executeDatabase(failingDbOperation);
            }
            catch (error) {
            }
            const redisResult = await gracefulDegradationService.executeRedis(successRedisOperation);
            (0, globals_1.expect)(redisResult).toBe('OK');
            await new Promise(resolve => setTimeout(resolve, 300));
            const systemHealth = gracefulDegradationService.getSystemHealth();
            (0, globals_1.expect)(systemHealth.overallStatus).toBe('DEGRADED');
            (0, globals_1.expect)(systemHealth.summary.healthy).toBeGreaterThan(0);
            (0, globals_1.expect)(systemHealth.summary.degraded).toBeGreaterThan(0);
            const dbService = systemHealth.services.find(s => s.name === 'database');
            const redisService = systemHealth.services.find(s => s.name === 'redis');
            (0, globals_1.expect)(dbService?.status).not.toBe('HEALTHY');
            (0, globals_1.expect)(redisService?.status).toBe('HEALTHY');
        });
        (0, globals_1.test)('should handle cascading failures gracefully', async () => {
            const cascadingError = new Error('Cascading failure');
            mockDatabaseService.client.$queryRaw.mockRejectedValue(cascadingError);
            mockRedisService.ping.mockRejectedValue(cascadingError);
            const operations = [
                gracefulDegradationService.executeDatabase(globals_1.jest.fn().mockRejectedValue(cascadingError)),
                gracefulDegradationService.executeRedis(globals_1.jest.fn().mockRejectedValue(cascadingError))
            ];
            await Promise.allSettled(operations);
            await new Promise(resolve => setTimeout(resolve, 500));
            const systemHealth = gracefulDegradationService.getSystemHealth();
            const healthStatus = await healthMonitorService.getSystemHealth();
            (0, globals_1.expect)(systemHealth.overallStatus).toBe('UNAVAILABLE');
            (0, globals_1.expect)(healthStatus.overallStatus).toBe('unhealthy');
            (0, globals_1.expect)(systemHealth.timestamp).toBeDefined();
            (0, globals_1.expect)(healthStatus.lastUpdated).toBeDefined();
        });
        (0, globals_1.test)('should prevent error propagation to healthy services', async () => {
            const healthyOperation = globals_1.jest.fn().mockResolvedValue({ healthy: true });
            const failingOperation = globals_1.jest.fn().mockRejectedValue(new Error('Service down'));
            gracefulDegradationService.configureFallback('healthy-service', {
                enabled: false,
                maxRetries: 0
            });
            gracefulDegradationService.configureFallback('failing-service', {
                enabled: true,
                fallbackData: { fallback: true }
            });
            const results = await Promise.allSettled([
                gracefulDegradationService.executeOperation('healthy-service', healthyOperation),
                gracefulDegradationService.executeOperation('failing-service', failingOperation)
            ]);
            (0, globals_1.expect)(results[0].status).toBe('fulfilled');
            (0, globals_1.expect)(results[0].value).toEqual({ healthy: true });
            (0, globals_1.expect)(results[1].status).toBe('fulfilled');
            (0, globals_1.expect)(results[1].value).toEqual({ fallback: true });
        });
    });
    (0, globals_1.describe)('Performance Under Load', () => {
        (0, globals_1.test)('should maintain performance with concurrent health checks', async () => {
            const startTime = Date.now();
            const promises = Array.from({ length: 10 }, () => healthMonitorService.runHealthChecks());
            const results = await Promise.all(promises);
            const endTime = Date.now();
            const duration = endTime - startTime;
            results.forEach(result => {
                (0, globals_1.expect)(result).toMatchObject({
                    overall: globals_1.expect.any(String),
                    services: globals_1.expect.any(Array),
                    timestamp: globals_1.expect.any(String)
                });
            });
            (0, globals_1.expect)(duration).toBeLessThan(3000);
        });
        (0, globals_1.test)('should maintain performance with many circuit breakers', async () => {
            const startTime = Date.now();
            const circuitBreakers = Array.from({ length: 20 }, (_, i) => circuitBreakerRegistry.getCircuitBreaker(`service-${i}`));
            const operations = circuitBreakers.map((cb, i) => cb.call(async () => `value-${i}`));
            const results = await Promise.all(operations);
            const endTime = Date.now();
            const duration = endTime - startTime;
            results.forEach((result, i) => {
                (0, globals_1.expect)(result).toBe(`value-${i}`);
            });
            (0, globals_1.expect)(duration).toBeLessThan(2000);
            const cbHealth = circuitBreakerRegistry.getHealthSummary();
            (0, globals_1.expect)(cbHealth.total).toBe(20);
            (0, globals_1.expect)(cbHealth.closed).toBe(20);
            (0, globals_1.expect)(cbHealth.failed).toBe(0);
        });
        (0, globals_1.test)('should handle high-frequency degradation state changes', async () => {
            const states = ['HEALTHY', 'DEGRADED', 'UNAVAILABLE'];
            const stateChanges = [];
            for (let i = 0; i < 50; i++) {
                const state = states[i % states.length];
                const timestamp = Date.now();
                await gracefulDegradationService.setServiceState('test-service', state);
                stateChanges.push({ state, timestamp });
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            const finalHealth = gracefulDegradationService.getSystemHealth();
            (0, globals_1.expect)(finalHealth.timestamp).toBeDefined();
            (0, globals_1.expect)(mockMetricsCollector.increment).toHaveBeenCalledWith(globals_1.expect.stringMatching(/health_system\.state_change/), globals_1.expect.any(Object));
            (0, globals_1.expect)(stateChanges.length).toBe(50);
            (0, globals_1.expect)(stateChanges.every(change => change.timestamp > 0)).toBe(true);
        });
    });
    (0, globals_1.describe)('Health Check Scheduling and Timing', () => {
        (0, globals_1.test)('should respect health check intervals', async () => {
            const checkTimes = [];
            const originalRunChecks = healthMonitorService.runHealthChecks;
            healthMonitorService.runHealthChecks = globals_1.jest.fn().mockImplementation(async () => {
                checkTimes.push(Date.now());
                return originalRunChecks.call(healthMonitorService);
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            (0, globals_1.expect)(checkTimes.length).toBeGreaterThan(1);
            if (checkTimes.length >= 2) {
                const intervals = checkTimes.slice(1).map((time, i) => time - checkTimes[i]);
                const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
                (0, globals_1.expect)(avgInterval).toBeGreaterThan(50);
                (0, globals_1.expect)(avgInterval).toBeLessThan(500);
            }
        });
        (0, globals_1.test)('should handle health check timeouts gracefully', async () => {
            const slowHealthCheck = globals_1.jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ status: 'slow' }), 2000)));
            mockDatabaseService.client.$queryRaw = slowHealthCheck;
            const startTime = Date.now();
            const healthResult = await healthMonitorService.runHealthChecks();
            const endTime = Date.now();
            const duration = endTime - startTime;
            (0, globals_1.expect)(duration).toBeLessThan(1500);
            (0, globals_1.expect)(healthResult.services).toBeDefined();
            const checkedServices = healthResult.services.filter(s => s.status !== 'timeout');
            (0, globals_1.expect)(checkedServices.length).toBeGreaterThan(0);
        });
        (0, globals_1.test)('should prioritize critical service health checks', async () => {
            const checkOrder = [];
            const trackingMock = (serviceName) => globals_1.jest.fn().mockImplementation(async () => {
                checkOrder.push(serviceName);
                return { status: 'healthy' };
            });
            mockDatabaseService.client.$queryRaw = trackingMock('database');
            mockRedisService.ping = trackingMock('redis');
            await healthMonitorService.runHealthChecks();
            (0, globals_1.expect)(checkOrder.length).toBeGreaterThan(0);
            (0, globals_1.expect)(checkOrder.includes('database')).toBe(true);
            (0, globals_1.expect)(checkOrder.includes('redis')).toBe(true);
        });
    });
    (0, globals_1.describe)('Health Event System', () => {
        (0, globals_1.test)('should emit health state change events', async () => {
            const stateChangeEvents = [];
            eventBus.on('health.state.changed', (event) => {
                stateChangeEvents.push(event);
            });
            await gracefulDegradationService.setServiceState('test-service', 'DEGRADED');
            await gracefulDegradationService.setServiceState('test-service', 'UNAVAILABLE');
            await gracefulDegradationService.setServiceState('test-service', 'HEALTHY');
            await new Promise(resolve => setTimeout(resolve, 100));
            (0, globals_1.expect)(stateChangeEvents.length).toBeGreaterThanOrEqual(3);
            stateChangeEvents.forEach(event => {
                (0, globals_1.expect)(event).toMatchObject({
                    service: 'test-service',
                    previousState: globals_1.expect.any(String),
                    currentState: globals_1.expect.any(String),
                    timestamp: globals_1.expect.any(String)
                });
            });
        });
        (0, globals_1.test)('should emit health threshold breach events', async () => {
            const thresholdEvents = [];
            eventBus.on('health.threshold.breached', (event) => {
                thresholdEvents.push(event);
            });
            const failingOperation = globals_1.jest.fn().mockRejectedValue(new Error('Threshold breach'));
            for (let i = 0; i < 10; i++) {
                try {
                    await gracefulDegradationService.executeDatabase(failingOperation);
                }
                catch (error) {
                }
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            (0, globals_1.expect)(thresholdEvents.length).toBeGreaterThan(0);
            thresholdEvents.forEach(event => {
                (0, globals_1.expect)(event).toMatchObject({
                    service: globals_1.expect.any(String),
                    threshold: globals_1.expect.any(String),
                    value: globals_1.expect.any(Number),
                    limit: globals_1.expect.any(Number),
                    timestamp: globals_1.expect.any(String)
                });
            });
        });
        (0, globals_1.test)('should emit recovery events', async () => {
            const recoveryEvents = [];
            eventBus.on('health.recovery.completed', (event) => {
                recoveryEvents.push(event);
            });
            await gracefulDegradationService.setServiceState('recovery-service', 'DEGRADED');
            const successOperation = globals_1.jest.fn().mockResolvedValue({ recovered: true });
            for (let i = 0; i < 15; i++) {
                await gracefulDegradationService.executeOperation('recovery-service', successOperation);
            }
            await new Promise(resolve => setTimeout(resolve, 300));
            (0, globals_1.expect)(recoveryEvents.length).toBeGreaterThan(0);
            recoveryEvents.forEach(event => {
                (0, globals_1.expect)(event).toMatchObject({
                    service: globals_1.expect.any(String),
                    recoveredAt: globals_1.expect.any(String),
                    degradedDuration: globals_1.expect.any(Number),
                    recoveryTrigger: globals_1.expect.any(String)
                });
            });
        });
    });
    (0, globals_1.describe)('Advanced Health Monitoring Features', () => {
        (0, globals_1.test)('should support custom health check definitions', async () => {
            const customCheck = {
                name: 'payment-gateway',
                check: globals_1.jest.fn().mockResolvedValue({ status: 'healthy', latency: 45 }),
                interval: 5000,
                timeout: 2000,
                critical: true
            };
            await healthMonitorService.addCustomHealthCheck(customCheck);
            const healthStatus = await healthMonitorService.getSystemHealth();
            const customService = healthStatus.checks.find(s => s.service === 'payment-gateway');
            (0, globals_1.expect)(customService).toMatchObject({
                service: 'payment-gateway',
                status: 'healthy',
                responseTime: 45,
                critical: true
            });
        });
        (0, globals_1.test)('should support health check dependencies', async () => {
            await healthMonitorService.configureDependencies({
                'app': ['database'],
                'database': ['redis']
            });
            mockRedisService.ping.mockRejectedValue(new Error('Redis down'));
            const healthStatus = await healthMonitorService.getSystemHealth();
            const redisService = healthStatus.checks.find(s => s.service === 'redis');
            const dbService = healthStatus.checks.find(s => s.service === 'database');
            const appService = healthStatus.checks.find(s => s.service === 'app');
            (0, globals_1.expect)(redisService?.status).not.toBe('healthy');
            (0, globals_1.expect)(dbService?.status).toBeDefined();
            (0, globals_1.expect)(appService?.status).toBeDefined();
        });
        (0, globals_1.test)('should support health check maintenance mode', async () => {
            await healthMonitorService.enableMaintenanceMode('scheduled-maintenance');
            const healthStatus = await healthMonitorService.getSystemHealth();
            (0, globals_1.expect)(healthStatus.overallStatus).toMatch(/maintenance|degraded/);
            await healthMonitorService.disableMaintenanceMode();
            const postMaintenanceStatus = await healthMonitorService.getSystemHealth();
            (0, globals_1.expect)(postMaintenanceStatus.maintenanceMode).toBe(false);
        });
    });
    (0, globals_1.describe)('Integration with External Monitoring', () => {
        (0, globals_1.test)('should export metrics for external monitoring systems', async () => {
            await gracefulDegradationService.executeDatabase(globals_1.jest.fn().mockResolvedValue({ test: 1 }));
            await healthMonitorService.runHealthChecks();
            const exportedMetrics = await healthMonitorService.exportMetrics();
            (0, globals_1.expect)(exportedMetrics).toMatchObject({
                timestamp: globals_1.expect.any(String),
                metrics: globals_1.expect.objectContaining({
                    'health_check_duration': globals_1.expect.any(Number),
                    'service_availability': globals_1.expect.any(Number),
                    'system_uptime': globals_1.expect.any(Number)
                }),
                labels: globals_1.expect.objectContaining({
                    environment: 'test',
                    version: globals_1.expect.any(String)
                })
            });
        });
        (0, globals_1.test)('should support health check webhooks', async () => {
            const webhookCalls = [];
            const mockWebhook = globals_1.jest.fn().mockImplementation((data) => {
                webhookCalls.push(data);
                return Promise.resolve({ status: 'received' });
            });
            await healthMonitorService.configureWebhook({
                url: 'http://monitoring.example.com/webhook',
                method: 'POST',
                triggers: ['state_change', 'threshold_breach'],
                handler: mockWebhook
            });
            await gracefulDegradationService.setServiceState('webhook-test', 'DEGRADED');
            await new Promise(resolve => setTimeout(resolve, 200));
            (0, globals_1.expect)(webhookCalls.length).toBeGreaterThan(0);
            webhookCalls.forEach(call => {
                (0, globals_1.expect)(call).toMatchObject({
                    event: globals_1.expect.any(String),
                    service: globals_1.expect.any(String),
                    timestamp: globals_1.expect.any(String),
                    data: globals_1.expect.any(Object)
                });
            });
        });
        (0, globals_1.test)('should integrate with alerting systems', async () => {
            const alertEvents = [];
            eventBus.on('health.alert.triggered', (event) => {
                alertEvents.push(event);
            });
            await healthMonitorService.configureAlerts({
                'error_rate_high': {
                    condition: 'error_rate > 5%',
                    severity: 'warning',
                    cooldown: 300000
                },
                'service_unavailable': {
                    condition: 'service_status = unavailable',
                    severity: 'critical',
                    cooldown: 60000
                }
            });
            await gracefulDegradationService.setServiceState('alert-test', 'UNAVAILABLE');
            await new Promise(resolve => setTimeout(resolve, 200));
            (0, globals_1.expect)(alertEvents.length).toBeGreaterThan(0);
            alertEvents.forEach(alert => {
                (0, globals_1.expect)(alert).toMatchObject({
                    alert: globals_1.expect.any(String),
                    severity: globals_1.expect.stringMatching(/warning|critical|info/),
                    timestamp: globals_1.expect.any(String),
                    service: globals_1.expect.any(String),
                    condition: globals_1.expect.any(String)
                });
            });
        });
    });
    (0, globals_1.describe)('Health System Configuration', () => {
        (0, globals_1.test)('should support dynamic health check configuration', async () => {
            const newConfig = {
                interval: 2000,
                timeout: 1000,
                retries: 2,
                services: {
                    database: { enabled: true, critical: true },
                    redis: { enabled: true, critical: false },
                    external_api: { enabled: false, critical: false }
                }
            };
            await healthMonitorService.updateConfiguration(newConfig);
            const currentConfig = healthMonitorService.getConfiguration();
            (0, globals_1.expect)(currentConfig).toMatchObject({
                interval: 2000,
                timeout: 1000,
                retries: 2,
                services: globals_1.expect.objectContaining({
                    database: { enabled: true, critical: true },
                    redis: { enabled: true, critical: false }
                })
            });
        });
        (0, globals_1.test)('should validate health check configuration', async () => {
            const invalidConfig = {
                interval: -1,
                timeout: 0,
                services: null
            };
            await (0, globals_1.expect)(healthMonitorService.updateConfiguration(invalidConfig)).rejects.toThrow('Invalid health check configuration');
            const currentConfig = healthMonitorService.getConfiguration();
            (0, globals_1.expect)(currentConfig.interval).toBeGreaterThan(0);
            (0, globals_1.expect)(currentConfig.timeout).toBeGreaterThan(0);
        });
        (0, globals_1.test)('should support environment-specific configurations', async () => {
            const environments = ['development', 'staging', 'production'];
            for (const env of environments) {
                process.env.NODE_ENV = env;
                const envConfig = await healthMonitorService.getEnvironmentConfiguration();
                (0, globals_1.expect)(envConfig).toMatchObject({
                    environment: env,
                    interval: globals_1.expect.any(Number),
                    timeout: globals_1.expect.any(Number),
                    critical_threshold: globals_1.expect.any(Number)
                });
                if (env === 'production') {
                    (0, globals_1.expect)(envConfig.interval).toBeLessThanOrEqual(5000);
                    (0, globals_1.expect)(envConfig.timeout).toBeLessThanOrEqual(2000);
                }
            }
            process.env.NODE_ENV = 'test';
        });
    });
    (0, globals_1.describe)('Health System Security', () => {
        (0, globals_1.test)('should secure health check endpoints', async () => {
            const unauthorizedRequest = {
                headers: {},
                user: null
            };
            const healthEndpoint = healthMonitorService.getHealthEndpoint();
            const result = await healthEndpoint.handler(unauthorizedRequest);
            (0, globals_1.expect)(result).toMatchObject({
                status: globals_1.expect.any(String),
                timestamp: globals_1.expect.any(String)
            });
            (0, globals_1.expect)(result.services).toBeUndefined();
            (0, globals_1.expect)(result.internal).toBeUndefined();
        });
        (0, globals_1.test)('should support authenticated health checks', async () => {
            const authenticatedRequest = {
                headers: {
                    authorization: 'Bearer valid-health-token'
                },
                user: { role: 'admin' }
            };
            const healthEndpoint = healthMonitorService.getHealthEndpoint();
            const result = await healthEndpoint.handler(authenticatedRequest);
            (0, globals_1.expect)(result).toMatchObject({
                status: globals_1.expect.any(String),
                timestamp: globals_1.expect.any(String),
                services: globals_1.expect.any(Array),
                circuitBreakers: globals_1.expect.any(Object),
                resources: globals_1.expect.any(Object)
            });
        });
        (0, globals_1.test)('should audit health system access', async () => {
            const auditEvents = [];
            eventBus.on('health.audit.access', (event) => {
                auditEvents.push(event);
            });
            await healthMonitorService.getSystemHealth();
            await healthMonitorService.runHealthChecks();
            await gracefulDegradationService.getSystemHealth();
            await new Promise(resolve => setTimeout(resolve, 100));
            (0, globals_1.expect)(auditEvents.length).toBeGreaterThan(0);
            auditEvents.forEach(event => {
                (0, globals_1.expect)(event).toMatchObject({
                    action: globals_1.expect.any(String),
                    timestamp: globals_1.expect.any(String),
                    source: globals_1.expect.any(String),
                    result: globals_1.expect.any(String)
                });
            });
        });
    });
    (0, globals_1.describe)('Error Handling and Edge Cases', () => {
        (0, globals_1.test)('should handle malformed service responses', async () => {
            mockDatabaseService.client.$queryRaw.mockResolvedValue(null);
            const healthResult = await healthMonitorService.runHealthChecks();
            (0, globals_1.expect)(healthResult.overallStatus).toBe('degraded');
            const dbService = healthResult.services.find(s => s.service === 'database');
            (0, globals_1.expect)(dbService?.status).toBe('unhealthy');
            (0, globals_1.expect)(dbService?.error).toContain('malformed response');
        });
        (0, globals_1.test)('should handle service initialization failures', async () => {
            await healthMonitorService.stop();
            await gracefulDegradationService.shutdown();
            const initError = new Error('Initialization failed');
            globals_1.jest.spyOn(gracefulDegradationService, 'initialize').mockRejectedValue(initError);
            await (0, globals_1.expect)(gracefulDegradationService.initialize({})).rejects.toThrow('Initialization failed');
            const healthResult = await healthMonitorService.getSystemHealth();
            (0, globals_1.expect)(healthResult.overallStatus).toBe('unhealthy');
        });
        (0, globals_1.test)('should handle concurrent service state changes', async () => {
            const statePromises = [
                gracefulDegradationService.setServiceState('concurrent-test', 'DEGRADED'),
                gracefulDegradationService.setServiceState('concurrent-test', 'HEALTHY'),
                gracefulDegradationService.setServiceState('concurrent-test', 'UNAVAILABLE'),
                gracefulDegradationService.setServiceState('concurrent-test', 'HEALTHY')
            ];
            await Promise.all(statePromises);
            const finalHealth = gracefulDegradationService.getSystemHealth();
            (0, globals_1.expect)(finalHealth.timestamp).toBeDefined();
            const testService = finalHealth.services.find(s => s.name === 'concurrent-test');
            (0, globals_1.expect)(testService?.status).toBeDefined();
        });
    });
    (0, globals_1.describe)('Performance Monitoring Integration', () => {
        (0, globals_1.test)('should track health check performance metrics', async () => {
            const performanceMetrics = [];
            mockMetricsCollector.histogram.mockImplementation((metric, value, labels) => {
                if (metric.includes('health_check')) {
                    performanceMetrics.push({ metric, value, labels });
                }
            });
            await healthMonitorService.runHealthChecks();
            await gracefulDegradationService.getSystemHealth();
            (0, globals_1.expect)(performanceMetrics.length).toBeGreaterThan(0);
            performanceMetrics.forEach(metric => {
                (0, globals_1.expect)(metric).toMatchObject({
                    metric: globals_1.expect.stringMatching(/health_check|system_health/),
                    value: globals_1.expect.any(Number),
                    labels: globals_1.expect.any(Object)
                });
            });
        });
        (0, globals_1.test)('should monitor degradation service performance', async () => {
            const operationMetrics = [];
            mockMetricsCollector.histogram.mockImplementation((metric, value, labels) => {
                if (metric.includes('degradation')) {
                    operationMetrics.push({ metric, value, labels });
                }
            });
            const operations = Array.from({ length: 5 }, (_, i) => gracefulDegradationService.executeDatabase(globals_1.jest.fn().mockResolvedValue({ id: i })));
            await Promise.all(operations);
            (0, globals_1.expect)(operationMetrics.length).toBeGreaterThan(0);
            operationMetrics.forEach(metric => {
                (0, globals_1.expect)(metric.value).toBeGreaterThan(0);
                (0, globals_1.expect)(metric.labels).toMatchObject({
                    service: globals_1.expect.any(String),
                    operation: globals_1.expect.any(String)
                });
            });
        });
        (0, globals_1.test)('should correlate health metrics with system performance', async () => {
            const correlationData = [];
            eventBus.on('health.metrics.correlated', (data) => {
                correlationData.push(data);
            });
            const loadOperations = Array.from({ length: 20 }, (_, i) => async () => {
                await gracefulDegradationService.executeDatabase(globals_1.jest.fn().mockResolvedValue({ load: i }));
                return healthMonitorService.runHealthChecks();
            });
            await Promise.all(loadOperations.map(op => op()));
            await new Promise(resolve => setTimeout(resolve, 200));
            (0, globals_1.expect)(correlationData.length).toBeGreaterThan(0);
            correlationData.forEach(data => {
                (0, globals_1.expect)(data).toMatchObject({
                    healthMetric: globals_1.expect.any(String),
                    performanceMetric: globals_1.expect.any(String),
                    correlation: globals_1.expect.any(Number),
                    timestamp: globals_1.expect.any(String)
                });
            });
        });
    });
    (0, globals_1.describe)('Health System Stress Testing', () => {
        (0, globals_1.test)('should handle extreme load conditions', async () => {
            const startTime = Date.now();
            const concurrency = 50;
            const stressOperations = Array.from({ length: concurrency }, (_, i) => async () => {
                const operation = globals_1.jest.fn().mockImplementation(async () => {
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
                    return { stress: i };
                });
                return Promise.all([
                    gracefulDegradationService.executeDatabase(operation),
                    gracefulDegradationService.executeRedis(operation),
                    healthMonitorService.runHealthChecks()
                ]);
            });
            const results = await Promise.all(stressOperations.map(op => op()));
            const endTime = Date.now();
            const duration = endTime - startTime;
            (0, globals_1.expect)(results.length).toBe(concurrency);
            (0, globals_1.expect)(duration).toBeLessThan(10000);
            const finalHealth = gracefulDegradationService.getSystemHealth();
            (0, globals_1.expect)(finalHealth.timestamp).toBeDefined();
        });
        (0, globals_1.test)('should gracefully degrade under memory pressure', async () => {
            const memoryIntensiveOperation = globals_1.jest.fn().mockImplementation(async () => {
                const largeArray = new Array(100000).fill('memory-pressure');
                return { memory: largeArray.length };
            });
            const operations = Array.from({ length: 10 }, () => gracefulDegradationService.executeDatabase(memoryIntensiveOperation));
            const results = await Promise.all(operations);
            (0, globals_1.expect)(results.length).toBe(10);
            const systemHealth = gracefulDegradationService.getSystemHealth();
            (0, globals_1.expect)(systemHealth.timestamp).toBeDefined();
            (0, globals_1.expect)(mockMetricsCollector.gauge).toHaveBeenCalledWith(globals_1.expect.stringMatching(/memory|resource/), globals_1.expect.any(Number), globals_1.expect.any(Object));
        });
        (0, globals_1.test)('should handle network partition scenarios', async () => {
            mockDatabaseService.client.$queryRaw.mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 1000)));
            mockRedisService.ping.mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 1000)));
            const startTime = Date.now();
            const partitionOperations = [
                gracefulDegradationService.executeDatabase(globals_1.jest.fn()),
                gracefulDegradationService.executeRedis(globals_1.jest.fn()),
                healthMonitorService.runHealthChecks()
            ];
            await Promise.allSettled(partitionOperations);
            const endTime = Date.now();
            const duration = endTime - startTime;
            (0, globals_1.expect)(duration).toBeLessThan(5000);
            const systemHealth = gracefulDegradationService.getSystemHealth();
            (0, globals_1.expect)(systemHealth.overallStatus).toBe('UNAVAILABLE');
            (0, globals_1.expect)(systemHealth.summary.unavailable).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('Health Check Compliance and Standards', () => {
        (0, globals_1.test)('should comply with Kubernetes health check standards', async () => {
            const k8sLivenessCheck = await healthMonitorService.getKubernetesLivenessProbe();
            const k8sReadinessCheck = await healthMonitorService.getKubernetesReadinessProbe();
            (0, globals_1.expect)(k8sLivenessCheck).toMatchObject({
                httpGet: globals_1.expect.objectContaining({
                    path: '/health/live',
                    port: globals_1.expect.any(Number),
                    scheme: 'HTTP'
                }),
                initialDelaySeconds: globals_1.expect.any(Number),
                periodSeconds: globals_1.expect.any(Number),
                timeoutSeconds: globals_1.expect.any(Number),
                failureThreshold: globals_1.expect.any(Number)
            });
            (0, globals_1.expect)(k8sReadinessCheck).toMatchObject({
                httpGet: globals_1.expect.objectContaining({
                    path: '/health/ready',
                    port: globals_1.expect.any(Number),
                    scheme: 'HTTP'
                }),
                initialDelaySeconds: globals_1.expect.any(Number),
                periodSeconds: globals_1.expect.any(Number),
                timeoutSeconds: globals_1.expect.any(Number),
                failureThreshold: globals_1.expect.any(Number)
            });
        });
        (0, globals_1.test)('should support Docker health check format', async () => {
            const dockerHealthCheck = await healthMonitorService.getDockerHealthCheck();
            (0, globals_1.expect)(dockerHealthCheck).toMatchObject({
                test: globals_1.expect.arrayContaining([
                    'CMD-SHELL',
                    globals_1.expect.stringMatching(/curl|wget/)
                ]),
                interval: globals_1.expect.stringMatching(/\d+[sm]/),
                timeout: globals_1.expect.stringMatching(/\d+[sm]/),
                retries: globals_1.expect.any(Number),
                start_period: globals_1.expect.stringMatching(/\d+[sm]/)
            });
        });
        (0, globals_1.test)('should generate OpenAPI health endpoints specification', async () => {
            const openApiSpec = await healthMonitorService.getOpenApiHealthSpecification();
            (0, globals_1.expect)(openApiSpec).toMatchObject({
                openapi: '3.0.0',
                info: globals_1.expect.objectContaining({
                    title: globals_1.expect.stringContaining('Health'),
                    version: globals_1.expect.any(String)
                }),
                paths: globals_1.expect.objectContaining({
                    '/health': globals_1.expect.any(Object),
                    '/health/live': globals_1.expect.any(Object),
                    '/health/ready': globals_1.expect.any(Object)
                })
            });
            const healthPath = openApiSpec.paths['/health'];
            (0, globals_1.expect)(healthPath.get).toMatchObject({
                summary: globals_1.expect.any(String),
                responses: globals_1.expect.objectContaining({
                    '200': globals_1.expect.any(Object),
                    '503': globals_1.expect.any(Object)
                })
            });
        });
    });
    (0, globals_1.describe)('Health System Analytics and Reporting', () => {
        (0, globals_1.test)('should generate health trend reports', async () => {
            const timePoints = [
                { delay: 0, state: 'HEALTHY' },
                { delay: 100, state: 'DEGRADED' },
                { delay: 200, state: 'UNAVAILABLE' },
                { delay: 300, state: 'HEALTHY' }
            ];
            for (const point of timePoints) {
                await new Promise(resolve => setTimeout(resolve, point.delay));
                await gracefulDegradationService.setServiceState('trend-test', point.state);
            }
            const trendReport = await healthMonitorService.generateTrendReport({
                period: '1h',
                services: ['trend-test'],
                metrics: ['availability', 'response_time', 'error_rate']
            });
            (0, globals_1.expect)(trendReport).toMatchObject({
                period: '1h',
                services: globals_1.expect.arrayContaining([
                    globals_1.expect.objectContaining({
                        service: 'trend-test',
                        metrics: globals_1.expect.objectContaining({
                            availability: globals_1.expect.any(Number),
                            response_time: globals_1.expect.any(Number),
                            error_rate: globals_1.expect.any(Number)
                        }),
                        trend: globals_1.expect.objectContaining({
                            direction: globals_1.expect.stringMatching(/up|down|stable/),
                            change: globals_1.expect.any(Number)
                        })
                    })
                ])
            });
        });
        (0, globals_1.test)('should calculate service level objectives (SLO)', async () => {
            const sloConfig = {
                availability: 99.9,
                response_time: 200,
                error_rate: 0.1
            };
            await healthMonitorService.configureSLO('slo-test-service', sloConfig);
            const operations = Array.from({ length: 100 }, (_, i) => {
                const operation = globals_1.jest.fn().mockImplementation(async () => {
                    if (i % 50 === 0) {
                        throw new Error('Occasional failure');
                    }
                    return { success: i };
                });
                return gracefulDegradationService.executeOperation('slo-test-service', operation);
            });
            await Promise.allSettled(operations);
            const sloReport = await healthMonitorService.getSLOReport('slo-test-service');
            (0, globals_1.expect)(sloReport).toMatchObject({
                service: 'slo-test-service',
                period: globals_1.expect.any(String),
                objectives: globals_1.expect.objectContaining({
                    availability: globals_1.expect.objectContaining({
                        target: 99.9,
                        actual: globals_1.expect.any(Number),
                        status: globals_1.expect.stringMatching(/met|breached/)
                    }),
                    response_time: globals_1.expect.objectContaining({
                        target: 200,
                        actual: globals_1.expect.any(Number),
                        status: globals_1.expect.stringMatching(/met|breached/)
                    })
                }),
                budget: globals_1.expect.objectContaining({
                    remaining: globals_1.expect.any(Number),
                    consumed: globals_1.expect.any(Number)
                })
            });
        });
        (0, globals_1.test)('should provide health system recommendations', async () => {
            await gracefulDegradationService.setServiceState('rec-db', 'DEGRADED');
            await gracefulDegradationService.setServiceState('rec-redis', 'HEALTHY');
            await gracefulDegradationService.setServiceState('rec-external', 'UNAVAILABLE');
            const recommendations = await healthMonitorService.getHealthRecommendations();
            (0, globals_1.expect)(recommendations).toEqual(globals_1.expect.arrayContaining([
                globals_1.expect.objectContaining({
                    type: globals_1.expect.stringMatching(/scaling|configuration|maintenance/),
                    priority: globals_1.expect.stringMatching(/high|medium|low/),
                    service: globals_1.expect.any(String),
                    description: globals_1.expect.any(String),
                    action: globals_1.expect.any(String)
                })
            ]));
            const degradedRecommendations = recommendations.filter(r => r.service === 'rec-db' && r.priority === 'high');
            (0, globals_1.expect)(degradedRecommendations.length).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('Health System Backup and Recovery', () => {
        (0, globals_1.test)('should backup health configuration and state', async () => {
            await gracefulDegradationService.setServiceState('backup-test-1', 'HEALTHY');
            await gracefulDegradationService.setServiceState('backup-test-2', 'DEGRADED');
            await healthMonitorService.updateConfiguration({
                interval: 3000,
                services: {
                    'backup-test-1': { enabled: true, critical: true },
                    'backup-test-2': { enabled: true, critical: false }
                }
            });
            const backup = await healthMonitorService.createBackup();
            (0, globals_1.expect)(backup).toMatchObject({
                timestamp: globals_1.expect.any(String),
                version: globals_1.expect.any(String),
                configuration: globals_1.expect.objectContaining({
                    interval: 3000,
                    services: globals_1.expect.any(Object)
                }),
                state: globals_1.expect.objectContaining({
                    services: globals_1.expect.any(Object),
                    overall: globals_1.expect.any(String)
                })
            });
        });
        (0, globals_1.test)('should restore health system from backup', async () => {
            const originalConfig = {
                interval: 1000,
                services: {
                    'restore-test': { enabled: true, critical: true }
                }
            };
            await healthMonitorService.updateConfiguration(originalConfig);
            const backup = await healthMonitorService.createBackup();
            await healthMonitorService.updateConfiguration({
                interval: 5000,
                services: {
                    'different-service': { enabled: false, critical: false }
                }
            });
            await healthMonitorService.restoreFromBackup(backup);
            const restoredConfig = healthMonitorService.getConfiguration();
            (0, globals_1.expect)(restoredConfig).toMatchObject({
                interval: 1000,
                services: globals_1.expect.objectContaining({
                    'restore-test': { enabled: true, critical: true }
                })
            });
        });
    });
    (0, globals_1.describe)('Integration Test Scenarios', () => {
        (0, globals_1.test)('should integrate all health system components under normal load', async () => {
            const integrationResults = {
                healthChecks: 0,
                degradationActions: 0,
                circuitBreakerActions: 0,
                recoveryActions: 0
            };
            eventBus.on('health.*', () => integrationResults.healthChecks++);
            eventBus.on('degradation.*', () => integrationResults.degradationActions++);
            eventBus.on('circuit.*', () => integrationResults.circuitBreakerActions++);
            eventBus.on('recovery.*', () => integrationResults.recoveryActions++);
            const integrationScenario = async () => {
                await gracefulDegradationService.executeDatabase(globals_1.jest.fn().mockResolvedValue({ normal: 1 }));
                await gracefulDegradationService.executeRedis(globals_1.jest.fn().mockResolvedValue('OK'));
                await gracefulDegradationService.executeDatabase(globals_1.jest.fn().mockRejectedValue(new Error('Temporary failure')));
                for (let i = 0; i < 3; i++) {
                    await gracefulDegradationService.executeDatabase(globals_1.jest.fn().mockResolvedValue({ recover: i }));
                }
                return healthMonitorService.getSystemHealth();
            };
            const finalHealth = await integrationScenario();
            (0, globals_1.expect)(finalHealth).toMatchObject({
                overall: globals_1.expect.any(String),
                services: globals_1.expect.any(Array),
                circuitBreakers: globals_1.expect.any(Object),
                timestamp: globals_1.expect.any(String)
            });
            (0, globals_1.expect)(integrationResults.healthChecks).toBeGreaterThan(0);
        });
        (0, globals_1.test)('should maintain data consistency across health components', async () => {
            const consistency = {
                gracefulDegradation: null,
                healthMonitor: null,
                circuitBreakers: null
            };
            await gracefulDegradationService.executeDatabase(globals_1.jest.fn().mockResolvedValue({ consistency: 1 }));
            await new Promise(resolve => setTimeout(resolve, 200));
            consistency.gracefulDegradation = gracefulDegradationService.getSystemHealth();
            consistency.healthMonitor = await healthMonitorService.getSystemHealth();
            consistency.circuitBreakers = circuitBreakerRegistry.getHealthSummary();
            const timestamps = [
                new Date(consistency.gracefulDegradation.timestamp).getTime(),
                new Date(consistency.healthMonitor.timestamp).getTime()
            ];
            const maxTimestampDiff = Math.max(...timestamps) - Math.min(...timestamps);
            (0, globals_1.expect)(maxTimestampDiff).toBeLessThan(1000);
            const states = [
                consistency.gracefulDegradation.overallStatus,
                consistency.healthMonitor.overallStatus
            ];
            const compatibleStates = [
                ['HEALTHY', 'healthy'],
                ['DEGRADED', 'degraded'],
                ['UNAVAILABLE', 'unhealthy']
            ];
            const isConsistent = compatibleStates.some(([gd, hm]) => states.includes(gd) && states.includes(hm));
            (0, globals_1.expect)(isConsistent).toBe(true);
        });
        (0, globals_1.test)('should handle end-to-end health system workflow', async () => {
            const workflowSteps = [];
            workflowSteps.push('startup');
            await healthMonitorService.start();
            workflowSteps.push('normal_operations');
            for (let i = 0; i < 5; i++) {
                await gracefulDegradationService.executeDatabase(globals_1.jest.fn().mockResolvedValue({ step: 2, op: i }));
            }
            workflowSteps.push('degradation');
            await gracefulDegradationService.setServiceState('workflow-test', 'DEGRADED');
            workflowSteps.push('fallback');
            const fallbackOp = globals_1.jest.fn().mockRejectedValue(new Error('Service down'));
            await gracefulDegradationService.executeOperation('workflow-test', fallbackOp, {
                fallbackData: { fallback: true }
            });
            workflowSteps.push('circuit_breaker');
            const cb = circuitBreakerRegistry.getCircuitBreaker('workflow-circuit');
            for (let i = 0; i < 5; i++) {
                try {
                    await cb.call(async () => { throw new Error('Circuit test'); });
                }
                catch (e) { }
            }
            workflowSteps.push('recovery');
            for (let i = 0; i < 10; i++) {
                await gracefulDegradationService.executeOperation('workflow-test', globals_1.jest.fn().mockResolvedValue({ recovery: i }));
            }
            workflowSteps.push('final_check');
            const finalHealth = await healthMonitorService.getSystemHealth();
            (0, globals_1.expect)(workflowSteps).toEqual([
                'startup',
                'normal_operations',
                'degradation',
                'fallback',
                'circuit_breaker',
                'recovery',
                'final_check'
            ]);
            (0, globals_1.expect)(finalHealth).toMatchObject({
                overall: globals_1.expect.any(String),
                services: globals_1.expect.any(Array),
                workflow: globals_1.expect.objectContaining({
                    completed: true,
                    steps: workflowSteps.length
                })
            });
        });
    });
});
//# sourceMappingURL=health-system.integration.test.js.map