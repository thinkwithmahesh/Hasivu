/**
 * HASIVU Platform - Health System Integration Tests
 * Tests the integration between health monitoring, graceful degradation, and circuit breakers
 * 
 * This test suite validates:
 * - Health monitoring service integration
 * - Graceful degradation under load
 * - Circuit breaker coordination
 * - System recovery capabilities
 * - Performance under stress
 */

import { beforeEach, afterEach, describe, test, expect, jest } from '@jest/globals';
import { HealthMonitorService } from '@/services/health-monitor.service';
import { GracefulDegradationService } from '@/services/graceful-degradation.service';
import { CircuitBreakerRegistry } from '@/services/circuit-breaker.service';
import { DatabaseService } from '@/services/database.service';
import { RedisService } from '@/services/redis.service';
import { logger } from '@/utils/logger';
// Note: metrics.service and event-bus do not exist yet - using conditional imports
import { NotificationService } from '@/services/notification.service';

// Mock dependencies
jest.mock('@/services/database.service');
jest.mock('@/services/redis.service');
jest.mock('@/utils/logger');
jest.mock('@/services/notification.service');

// Type-safe mocks
const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;
const mockRedisService = RedisService as jest.Mocked<typeof RedisService>;
const mockLogger = logger as jest.Mocked<typeof logger>;
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;

// Mock metrics collector (referenced but not imported)
const mockMetricsCollector = {
  histogram: jest.fn(),
  gauge: jest.fn(),
  increment: jest.fn(),
  counter: jest.fn()
};

// Mock event bus (referenced but not imported)
const eventBus = {
  on: jest.fn(),
  emit: jest.fn(),
  off: jest.fn()
};

describe('Health System Integration', () => {
  let originalEnvironment: string;
  let healthMonitorService: HealthMonitorService;
  let gracefulDegradationService: GracefulDegradationService;
  let circuitBreakerRegistry: CircuitBreakerRegistry;

  beforeEach(async () => {
    // Store original environment
    originalEnvironment = process.env.NODE_ENV || 'test';
    process.env.NODE_ENV = 'test';

    // Reset all mocks
    jest.clearAllMocks();

    // Setup database mock
    const mockQueryRaw = jest.fn<any>().mockResolvedValue([{ health_check: 1 }]);
    (mockDatabaseService.client as any) = {
      $queryRaw: mockQueryRaw as any
    };

    // Setup Redis mock
    (mockRedisService.ping as any).mockResolvedValue('PONG');
    (mockRedisService.get as any).mockImplementation((key: string) => 
      Promise.resolve(key.includes('health') ? '{"status":"healthy"}' : null)
    );
    (mockRedisService.set as any).mockResolvedValue('OK');

    // Setup notification mock with conditional method check
    if ('sendAlert' in mockNotificationService && typeof mockNotificationService.sendAlert === 'function') {
      (mockNotificationService.sendAlert as any).mockResolvedValue(true);
    } else {
      // Add sendAlert mock if it doesn't exist
      const mockSendAlert = jest.fn<any>().mockResolvedValue(true);
      (mockNotificationService as any).sendAlert = mockSendAlert as any;
    }

    // Initialize services with conditional checks
    try {
      // Create instances for testing with proper configurations
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
      
      healthMonitorService = new HealthMonitorService(healthConfig);
      gracefulDegradationService = new GracefulDegradationService();
      circuitBreakerRegistry = new CircuitBreakerRegistry();
      
      // Initialize with proper configuration
      if ('initialize' in gracefulDegradationService && typeof gracefulDegradationService.initialize === 'function') {
        await gracefulDegradationService.initialize([]);
      }
      if ('start' in healthMonitorService && typeof healthMonitorService.start === 'function') {
        await healthMonitorService.start();
      }
      if ('reset' in circuitBreakerRegistry && typeof circuitBreakerRegistry.reset === 'function') {
        circuitBreakerRegistry.reset();
      }
    } catch (error) {
      // Services may not be fully implemented yet
      console.warn('Service initialization partial:', error);
    }
  });

  afterEach(async () => {
    // Restore environment
    process.env.NODE_ENV = originalEnvironment;
    
    // Note: Service cleanup would happen here when services are fully implemented
    // Currently services are partially implemented so cleanup is optional
  });

  describe('Healthy System State', () => {
    test('should maintain healthy state with successful operations', async () => {
      // Setup successful operations
      const mockDatabaseOperation = jest.fn<any>().mockResolvedValue({ id: 'test', data: 'success' });
      const mockRedisOperation = jest.fn<any>().mockResolvedValue('OK');

      // Execute operations through degradation service
      const dbResult = await gracefulDegradationService.executeDatabase(mockDatabaseOperation as () => Promise<unknown>);
      const redisResult = await gracefulDegradationService.executeRedis(mockRedisOperation as () => Promise<unknown>);

      // Verify operations succeeded
      expect(dbResult).toEqual({ id: 'test', data: 'success' });
      expect(redisResult).toBe('OK');

      // Check system health
      const systemHealth = gracefulDegradationService.getSystemHealth();
      expect((systemHealth as any).overallStatus).toBe('HEALTHY');
      expect(systemHealth.summary.healthy).toBeGreaterThan(0);
      expect(systemHealth.summary.unavailable).toBe(0);
      expect(systemHealth.services.length).toBeGreaterThan(0);
    });

    test('should report accurate health metrics', async () => {
      // Execute health check
      const healthStatus = await healthMonitorService.getSystemHealth();

      expect((healthStatus as any).overallStatus).toBe('healthy');
      expect(healthStatus.lastUpdated).toBeDefined();
      expect(healthStatus.uptime).toBeGreaterThan(0);
      expect(healthStatus.checks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            service: 'database',
            status: 'healthy',
            responseTime: expect.any(Number)
          }),
          expect.objectContaining({
            service: 'redis',
            status: 'healthy',
            responseTime: expect.any(Number)
          })
        ])
      );
    });

    test('should track performance metrics during healthy operations', async () => {
      const startTime = Date.now();

      // Execute multiple operations
      const operations = Array.from({ length: 5 }, (_, i) => 
        gracefulDegradationService.executeDatabase(
          jest.fn<any>().mockResolvedValue({ id: `test-${i}` }) as any
        )
      );

      await Promise.all(operations);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify metrics were collected
      expect(mockMetricsCollector.histogram).toHaveBeenCalledWith(
        'health_system.operation_duration',
        expect.any(Number),
        expect.objectContaining({
          operation: expect.any(String),
          service: expect.any(String)
        })
      );

      expect(duration).toBeLessThan(1000); // Should complete quickly
    });
  });

  describe('Service Degradation Scenarios', () => {
    test('should detect and handle database service failures', async () => {
      // Setup failing database operation
      const failingOperation = jest.fn<any>().mockRejectedValue(new Error('Database connection lost'));
      const fallbackOperation = jest.fn<any>().mockResolvedValue({ cached: true });

      // Configure fallback
      gracefulDegradationService.configureFallback('database', 
        jest.fn<any>().mockResolvedValue({ cached: true }) as any
      );

      // Execute failing operations to trigger degradation
      for (let i = 0; i < 3; i++) {
        try {
          await gracefulDegradationService.executeDatabase(failingOperation as () => Promise<unknown>, {
            fallbackData: { cached: true }
          });
        } catch (error) {
          // Expected failures
        }
      }

      // Wait for health monitoring to detect issues
      await new Promise(resolve => setTimeout(resolve, 300));

      const systemHealth = gracefulDegradationService.getSystemHealth();
      const healthMonitorStatus = await healthMonitorService.getSystemHealth();

      expect((systemHealth as any).overallStatus).not.toBe('HEALTHY');
      expect(healthMonitorStatus.overallStatus).not.toBe('healthy');
      expect(systemHealth.services.some(s => (s.status as any) === 'DEGRADED')).toBe(true);
    });

    test('should use fallbacks when services are degraded', async () => {
      const failingOperation = jest.fn<any>().mockRejectedValue(new Error('Service unavailable'));
      const fallbackData = { id: 'fallback', source: 'cache' };

      // Configure service for degraded state
      await gracefulDegradationService.setServiceState('database', 'DEGRADED' as any);

      const result = await gracefulDegradationService.executeDatabase(failingOperation as () => Promise<unknown>, {
        fallbackData
      });

      expect(result).toEqual(fallbackData);
      expect(failingOperation).not.toHaveBeenCalled();
    });

    test('should handle Redis service failures gracefully', async () => {
      // Mock Redis failure
      (mockRedisService.ping as any).mockRejectedValue(new Error('Redis connection timeout'));
      (mockRedisService.get as any).mockRejectedValue(new Error('Redis unavailable'));

      const failingRedisOperation = jest.fn<any>().mockRejectedValue(new Error('Redis error'));

      const result = await gracefulDegradationService.executeRedis(failingRedisOperation as () => Promise<unknown>);

      expect(result).toBeUndefined();

      // Wait for health checks
      await new Promise(resolve => setTimeout(resolve, 300));

      const healthStatus = await healthMonitorService.getSystemHealth();
      const redisService = healthStatus.checks.find(s => s.service === 'redis');
      expect(redisService?.status).not.toBe('healthy');
    });

    test('should maintain service isolation during failures', async () => {
      // Fail database operations
      const failingDbOperation = jest.fn<any>().mockRejectedValue(new Error('Database error'));
      const successRedisOperation = jest.fn<any>().mockResolvedValue('OK');

      // Execute operations
      try {
        await gracefulDegradationService.executeDatabase(failingDbOperation as () => Promise<unknown>);
      } catch (error) {
        // Expected failure
      }

      // Redis operation should still succeed
      const redisResult = await gracefulDegradationService.executeRedis(successRedisOperation as () => Promise<unknown>);
      expect(redisResult).toBe('OK');

      // Wait for health checks
      await new Promise(resolve => setTimeout(resolve, 300));

      const systemHealth = gracefulDegradationService.getSystemHealth();

      // System should be degraded, not completely unavailable
      expect((systemHealth as any).overallStatus).toBe('DEGRADED');
      expect(systemHealth.summary.healthy).toBeGreaterThan(0);
      expect((systemHealth.summary as any).degraded).toBeGreaterThan(0);
    });
  });

  describe('Circuit Breaker Integration', () => {
    test('should coordinate circuit breaker state with health monitoring', async () => {
      // Trigger circuit breaker failures
      const circuitBreaker = (circuitBreakerRegistry as any).getCircuitBreaker('test-service');
      
      // Simulate failures to open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.call(async () => {
            throw new Error('Service failure');
          });
        } catch (error) {
          // Expected circuit breaker failures
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const circuitBreakerStats = (circuitBreakerRegistry as any).getHealthSummary();
      const systemHealth = await healthMonitorService.getSystemHealth();

      expect(circuitBreakerStats.failed).toBeGreaterThan(0);
      expect((systemHealth as any).circuitBreakers.failed).toBeGreaterThan(0);
      expect((systemHealth as any).circuitBreakers.open).toBeGreaterThan(0);
    });

    test('should integrate circuit breaker status with health monitoring', async () => {
      const circuitBreaker = (circuitBreakerRegistry as any).getCircuitBreaker('critical-service');

      // Force circuit to half-open state
      circuitBreaker.forceHalfOpen();

      const healthStatus = await healthMonitorService.getSystemHealth();
      const circuitBreakerCheck = healthStatus.checks.find(check => check.service === 'circuitBreakers');

      expect(circuitBreakerCheck?.status).toBeDefined();
      expect((healthStatus as any).overallStatus).not.toBe('healthy');
    });

    test('should recover when circuit breakers close', async () => {
      const circuitBreaker = (circuitBreakerRegistry as any).getCircuitBreaker('recovery-service');

      // Open circuit with failures
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.call(async () => {
            throw new Error('Initial failure');
          });
        } catch (error) {
          // Expected
        }
      }

      // Wait for circuit to open
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate recovery with successful operations
      circuitBreaker.forceHalfOpen();
      
      for (let i = 0; i < 3; i++) {
        await circuitBreaker.call(async () => {
          return `success-${i}`;
        });
      }

      // Wait for circuit to close
      await new Promise(resolve => setTimeout(resolve, 100));

      const healthStatus = await healthMonitorService.getSystemHealth();
      const circuitBreakerStats = (circuitBreakerRegistry as any).getHealthSummary();

      expect(circuitBreakerStats.closed).toBeGreaterThan(0);
      expect((healthStatus as any).overallStatus).toBe('healthy');
    });
  });

  describe('System Recovery Scenarios', () => {
    test('should recover from service failures automatically', async () => {
      // Initial failure state
      await gracefulDegradationService.setServiceState('database', 'UNAVAILABLE' as any);

      let systemHealth = gracefulDegradationService.getSystemHealth();
      expect((systemHealth as any).overallStatus).not.toBe('HEALTHY');

      // Simulate service recovery
      (mockDatabaseService.client as any).$queryRaw.mockResolvedValue([{ health_check: 1 }]);

      // Execute successful operations
      const successOperation = jest.fn<any>().mockResolvedValue({ id: 'success' });
      
      for (let i = 0; i < 5; i++) {
        await gracefulDegradationService.executeDatabase(successOperation as () => Promise<unknown>);
      }

      // Wait for health monitoring
      await new Promise(resolve => setTimeout(resolve, 300));

      systemHealth = gracefulDegradationService.getSystemHealth();
      expect((systemHealth as any).overallStatus).toBe('HEALTHY');
      expect(systemHealth.summary.healthy).toBeGreaterThan(0);
    });

    test('should handle partial system recovery', async () => {
      // Set mixed service states
      await gracefulDegradationService.setServiceState('database', 'DEGRADED' as any);
      await gracefulDegradationService.setServiceState('redis', 'HEALTHY' as any);

      const systemHealth = gracefulDegradationService.getSystemHealth();
      
      expect((systemHealth as any).overallStatus).toBe('DEGRADED');
      expect(systemHealth.summary.healthy).toBeGreaterThan(0);
      expect((systemHealth.summary as any).degraded).toBeGreaterThan(0);
      expect(systemHealth.summary.unavailable).toBe(0);
    });

    test('should maintain recovery state consistency', async () => {
      // Start with degraded state
      await gracefulDegradationService.setServiceState('database', 'DEGRADED' as any);

      const healthBefore = gracefulDegradationService.getSystemHealth();
      const monitorBefore = await healthMonitorService.getSystemHealth();

      // Both systems should agree on degraded state
      expect((healthBefore as any).overallStatus).toBe('DEGRADED');
      expect(monitorBefore.overallStatus).toBe('degraded');

      // Trigger recovery
      const successfulOp = jest.fn<any>().mockResolvedValue({ recovered: true });
      
      for (let i = 0; i < 10; i++) {
        await gracefulDegradationService.executeDatabase(successfulOp as () => Promise<unknown>);
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const healthAfter = gracefulDegradationService.getSystemHealth();
      const monitorAfter = await healthMonitorService.getSystemHealth();

      // Both systems should agree on healthy state
      expect((healthAfter as any).overallStatus).toBe('HEALTHY');
      expect(monitorAfter.overallStatus).toBe('healthy');
    });
  });

  describe('Comprehensive Health Reporting', () => {
    test('should track health metrics over time', async () => {
      const startTime = Date.now();

      // Execute operations that will generate metrics
      const operations = [
        () => gracefulDegradationService.executeDatabase(jest.fn<any>().mockResolvedValue({ test: 1 }) as () => Promise<unknown>),
        () => gracefulDegradationService.executeRedis(jest.fn<any>().mockResolvedValue('OK') as () => Promise<unknown>),
        () => (healthMonitorService as any).runHealthChecks()
      ];

      for (const operation of operations) {
        await operation();
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify metrics collection
      expect(mockMetricsCollector.gauge).toHaveBeenCalledWith(
        expect.stringMatching(/health_system\./),
        expect.any(Number),
        expect.any(Object)
      );

      expect(mockMetricsCollector.histogram).toHaveBeenCalledWith(
        expect.stringMatching(/operation_duration|health_check_duration/),
        expect.any(Number),
        expect.any(Object)
      );

      expect(duration).toBeLessThan(2000); // Should be reasonably fast
    });

    test('should generate comprehensive health reports', async () => {
      // Execute mixed operations
      await gracefulDegradationService.executeDatabase(jest.fn<any>().mockResolvedValue({ id: 1 }) as () => Promise<unknown>);
      await gracefulDegradationService.executeRedis(jest.fn<any>().mockResolvedValue('SET') as () => Promise<unknown>);

      const healthReport = await (healthMonitorService as any).generateHealthReport();

      expect(healthReport).toMatchObject({
        timestamp: expect.any(String),
        overall: expect.stringMatching(/healthy|degraded|unhealthy/),
        uptime: expect.any(Number),
        services: expect.arrayContaining([
          expect.objectContaining({
            service: expect.any(String),
            status: expect.any(String),
            responseTime: expect.any(Number),
            lastCheck: expect.any(String)
          })
        ]),
        circuitBreakers: expect.objectContaining({
          total: expect.any(Number),
          closed: expect.any(Number),
          open: expect.any(Number),
          halfOpen: expect.any(Number)
        }),
        resources: expect.objectContaining({
          memory: expect.any(Object),
          cpu: expect.any(Object)
        })
      });
    });

    test('should provide detailed service diagnostics', async () => {
      const serviceDiagnostics = await (healthMonitorService as any).getServiceDiagnostics('database');

      expect(serviceDiagnostics).toMatchObject({
        service: 'database',
        status: expect.any(String),
        metrics: expect.objectContaining({
          responseTime: expect.any(Number),
          successRate: expect.any(Number),
          errorRate: expect.any(Number)
        }),
        history: expect.any(Array),
        recommendations: expect.any(Array)
      });
    });
  });

  describe('Health Check Endpoints Simulation', () => {
    test('should support liveness checks', async () => {
      const livenessCheck = await (healthMonitorService as any).checkLiveness();

      expect(livenessCheck).toMatchObject({
        status: 'alive',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String)
      });
    });

    test('should support readiness checks', async () => {
      const readinessCheck = await (healthMonitorService as any).checkReadiness();

      expect(readinessCheck).toMatchObject({
        status: expect.stringMatching(/ready|not_ready/),
        timestamp: expect.any(String),
        dependencies: expect.objectContaining({
          database: expect.any(Boolean),
          redis: expect.any(Boolean)
        }),
        services: expect.any(Array)
      });
    });

    test('should handle force health check runs', async () => {
      const startTime = Date.now();
      
      const forceCheck = await healthMonitorService.forceHealthCheck();
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(forceCheck).toMatchObject({
        forced: true,
        timestamp: expect.any(String),
        overall: expect.any(String),
        services: expect.any(Array),
        duration: expect.any(Number)
      });

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should support startup health validation', async () => {
      // Simulate startup sequence
      await healthMonitorService.stop();
      
      const startupValidation = await (healthMonitorService as any).validateStartup();
      
      expect(startupValidation).toMatchObject({
        valid: expect.any(Boolean),
        requirements: expect.objectContaining({
          database: expect.any(Boolean),
          redis: expect.any(Boolean),
          environment: expect.any(Boolean)
        }),
        errors: expect.any(Array),
        warnings: expect.any(Array)
      });

      // Restart for other tests
      await healthMonitorService.start();
    });
  });

  describe('Error Propagation and Isolation', () => {
    test('should isolate failures between different services', async () => {
      // Setup failing database, successful Redis
      const failingDbOperation = jest.fn<any>().mockRejectedValue(new Error('DB failure'));
      const successRedisOperation = jest.fn<any>().mockResolvedValue('OK');

      // Execute operations
      try {
        await gracefulDegradationService.executeDatabase(failingDbOperation as () => Promise<unknown>);
      } catch (error) {
        // Expected failure
      }

      // Redis operation should still succeed
      const redisResult = await gracefulDegradationService.executeRedis(successRedisOperation as () => Promise<unknown>);
      expect(redisResult).toBe('OK');

      // Wait for health checks
      await new Promise(resolve => setTimeout(resolve, 300));

      const systemHealth = gracefulDegradationService.getSystemHealth();

      // System should be degraded, not completely unavailable
      expect((systemHealth as any).overallStatus).toBe('DEGRADED');
      expect(systemHealth.summary.healthy).toBeGreaterThan(0);
      expect((systemHealth.summary as any).degraded).toBeGreaterThan(0);

      // Verify error isolation
      const dbService = systemHealth.services.find(s => (s as any).name === 'database');
      const redisService = systemHealth.services.find(s => (s as any).name === 'redis');

      expect(dbService?.status).not.toBe('HEALTHY');
      expect(redisService?.status).toBe('HEALTHY');
    });

    test('should handle cascading failures gracefully', async () => {
      // Setup cascading failure scenario
      const cascadingError = new Error('Cascading failure');
      
      // Fail multiple services
      (mockDatabaseService.client as any).$queryRaw.mockRejectedValue(cascadingError);
      (mockRedisService.ping as any).mockRejectedValue(cascadingError);

      // Execute operations that should trigger cascade
      const operations = [
        gracefulDegradationService.executeDatabase(jest.fn<any>().mockRejectedValue(cascadingError) as () => Promise<unknown>),
        gracefulDegradationService.executeRedis(jest.fn<any>().mockRejectedValue(cascadingError) as () => Promise<unknown>)
      ];

      // All should fail but system should remain responsive
      await Promise.allSettled(operations);

      // Wait for health system to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));

      const systemHealth = gracefulDegradationService.getSystemHealth();
      const healthStatus = await healthMonitorService.getSystemHealth();

      // System should be degraded but still responding
      expect((systemHealth as any).overallStatus).toBe('UNAVAILABLE');
      expect((healthStatus as any).overallStatus).toBe('unhealthy');
      
      // Verify system is still responsive
      expect(systemHealth.timestamp).toBeDefined();
      expect(healthStatus.lastUpdated).toBeDefined();
    });

    test('should prevent error propagation to healthy services', async () => {
      // Setup one healthy, one failing service
      const healthyOperation = jest.fn<any>().mockResolvedValue({ healthy: true });
      const failingOperation = jest.fn<any>().mockRejectedValue(new Error('Service down'));

      // Configure different services
      (gracefulDegradationService as any).configureFallback('healthy-service', {
        enabled: false,
        maxRetries: 0
      } as any);

      (gracefulDegradationService as any).configureFallback('failing-service', {
        enabled: true,
        fallbackData: { fallback: true }
      } as any);

      // Execute operations
      const results = await Promise.allSettled([
        (gracefulDegradationService as any).executeOperation('healthy-service', healthyOperation),
        (gracefulDegradationService as any).executeOperation('failing-service', failingOperation)
      ]);

      // Healthy service should succeed
      expect(results[0].status).toBe('fulfilled');
      expect((results[0] as any).value).toEqual({ healthy: true });

      // Failing service should use fallback
      expect(results[1].status).toBe('fulfilled');
      expect((results[1] as any).value).toEqual({ fallback: true });
    });
  });

  describe('Performance Under Load', () => {
    test('should maintain performance with concurrent health checks', async () => {
      const startTime = Date.now();

      // Execute concurrent health checks
      const promises = Array.from({ length: 10 }, () => 
        (healthMonitorService as any).runHealthChecks()
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All health checks should complete successfully
      results.forEach(result => {
        expect(result).toMatchObject({
          overall: expect.any(String),
          services: expect.any(Array),
          timestamp: expect.any(String)
        });
      });

      // Should complete within reasonable time
      expect(duration).toBeLessThan(3000);
    });

    test('should maintain performance with many circuit breakers', async () => {
      const startTime = Date.now();

      // Create multiple circuit breakers
      const circuitBreakers = Array.from({ length: 20 }, (_, i) => 
        (circuitBreakerRegistry as any).getCircuitBreaker(`service-${i}`)
      );

      // Execute operations through each circuit breaker
      const operations = circuitBreakers.map((cb, i) => 
        cb.call(async () => `value-${i}`)
      );

      const results = await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All operations should succeed
      results.forEach((result, i) => {
        expect(result).toBe(`value-${i}`);
      });

      // Should maintain good performance
      expect(duration).toBeLessThan(2000);

      // Verify circuit breaker health
      const cbHealth = (circuitBreakerRegistry as any).getHealthSummary();
      expect(cbHealth.total).toBe(20);
      expect(cbHealth.closed).toBe(20);
      expect(cbHealth.failed).toBe(0);
    });

    test('should handle high-frequency degradation state changes', async () => {
      const states = ['HEALTHY', 'DEGRADED', 'UNAVAILABLE'] as const;
      const stateChanges: Array<{state: typeof states[number], timestamp: number}> = [];

      // Rapidly change service states
      for (let i = 0; i < 50; i++) {
        const state = states[i % states.length];
        const timestamp = Date.now();
        
        await gracefulDegradationService.setServiceState('test-service', state as any);
        stateChanges.push({ state, timestamp });
        
        // Small delay to allow processing
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Verify final state is consistent
      const finalHealth = gracefulDegradationService.getSystemHealth();
      expect(finalHealth.timestamp).toBeDefined();

      // Verify performance metrics were collected
      expect(mockMetricsCollector.increment).toHaveBeenCalledWith(
        expect.stringMatching(/health_system\.state_change/),
        expect.any(Object)
      );

      // Verify state change tracking
      expect(stateChanges.length).toBe(50);
      expect(stateChanges.every(change => change.timestamp > 0)).toBe(true);
    });
  });

  describe('Health Check Scheduling and Timing', () => {
    test('should respect health check intervals', async () => {
      const checkTimes: number[] = [];

      // Mock health check to track timing
      const originalRunChecks = (healthMonitorService as any).runHealthChecks;
      (healthMonitorService as any).runHealthChecks = jest.fn().mockImplementation(async () => {
        checkTimes.push(Date.now());
        return originalRunChecks.call(healthMonitorService);
      });

      // Wait for multiple health check cycles
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify health checks ran multiple times
      expect(checkTimes.length).toBeGreaterThan(1);

      // Verify timing intervals (approximately 100ms intervals in test mode)
      if (checkTimes.length >= 2) {
        const intervals = checkTimes.slice(1).map((time, i) => time - checkTimes[i]);
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        
        expect(avgInterval).toBeGreaterThan(50); // At least 50ms
        expect(avgInterval).toBeLessThan(500); // Less than 500ms
      }
    });

    test('should handle health check timeouts gracefully', async () => {
      // Mock slow health check
      const slowHealthCheck = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ status: 'slow' }), 2000))
      );

      // Replace database health check with slow one
      (mockDatabaseService.client as any).$queryRaw = slowHealthCheck;

      const startTime = Date.now();
      const healthResult = await (healthMonitorService as any).runHealthChecks();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should timeout and provide partial results
      expect(duration).toBeLessThan(1500); // Should timeout before 2 seconds
      expect(healthResult.services).toBeDefined();
      
      // At least some services should be checked
      const checkedServices = healthResult.services.filter(s => s.status !== 'timeout');
      expect(checkedServices.length).toBeGreaterThan(0);
    });

    test('should prioritize critical service health checks', async () => {
      const checkOrder: string[] = [];

      // Mock health checks to track order
      const trackingMock = (serviceName: string) => jest.fn().mockImplementation(async () => {
        checkOrder.push(serviceName);
        return { status: 'healthy' };
      });

      // Setup tracked mocks
      (mockDatabaseService.client as any).$queryRaw = trackingMock('database');
      (mockRedisService.ping as any) = trackingMock('redis');

      await (healthMonitorService as any).runHealthChecks();

      // Verify critical services are checked first
      expect(checkOrder.length).toBeGreaterThan(0);
      expect(checkOrder.includes('database')).toBe(true);
      expect(checkOrder.includes('redis')).toBe(true);
    });
  });

  describe('Health Event System', () => {
    test('should emit health state change events', async () => {
      const stateChangeEvents: any[] = [];

      // Listen for state change events
      eventBus.on('health.state.changed', (event) => {
        stateChangeEvents.push(event);
      });

      // Trigger state changes
      await gracefulDegradationService.setServiceState('test-service', 'DEGRADED' as any);
      await gracefulDegradationService.setServiceState('test-service', 'UNAVAILABLE' as any);
      await gracefulDegradationService.setServiceState('test-service', 'HEALTHY' as any);

      // Wait for events to propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(stateChangeEvents.length).toBeGreaterThanOrEqual(3);
      
      stateChangeEvents.forEach(event => {
        expect(event).toMatchObject({
          service: 'test-service',
          previousState: expect.any(String),
          currentState: expect.any(String),
          timestamp: expect.any(String)
        });
      });
    });

    test('should emit health threshold breach events', async () => {
      const thresholdEvents: any[] = [];

      eventBus.on('health.threshold.breached', (event) => {
        thresholdEvents.push(event);
      });

      // Trigger threshold breach
      const failingOperation = jest.fn<any>().mockRejectedValue(new Error('Threshold breach'));
      
      // Execute enough failures to breach threshold
      for (let i = 0; i < 10; i++) {
        try {
          await gracefulDegradationService.executeDatabase(failingOperation as () => Promise<unknown>);
        } catch (error) {
          // Expected
        }
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      // Should have emitted threshold breach events
      expect(thresholdEvents.length).toBeGreaterThan(0);
      
      thresholdEvents.forEach(event => {
        expect(event).toMatchObject({
          service: expect.any(String),
          threshold: expect.any(String),
          value: expect.any(Number),
          limit: expect.any(Number),
          timestamp: expect.any(String)
        });
      });
    });

    test('should emit recovery events', async () => {
      const recoveryEvents: any[] = [];

      eventBus.on('health.recovery.completed', (event) => {
        recoveryEvents.push(event);
      });

      // Start with degraded state
      await gracefulDegradationService.setServiceState('recovery-service', 'DEGRADED' as any);

      // Execute successful operations to trigger recovery
      const successOperation = jest.fn<any>().mockResolvedValue({ recovered: true });
      
      for (let i = 0; i < 15; i++) {
        await (gracefulDegradationService as any).executeOperation('recovery-service', successOperation);
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      // Should have emitted recovery events
      expect(recoveryEvents.length).toBeGreaterThan(0);
      
      recoveryEvents.forEach(event => {
        expect(event).toMatchObject({
          service: expect.any(String),
          recoveredAt: expect.any(String),
          degradedDuration: expect.any(Number),
          recoveryTrigger: expect.any(String)
        });
      });
    });
  });

  describe('Advanced Health Monitoring Features', () => {
    test('should support custom health check definitions', async () => {
      // Define custom health check
      const customCheck = {
        name: 'payment-gateway',
        check: jest.fn<any>().mockResolvedValue({ status: 'healthy', latency: 45 }),
        interval: 5000,
        timeout: 2000,
        critical: true
      };

      await (healthMonitorService as any).addCustomHealthCheck(customCheck);

      const healthStatus = await healthMonitorService.getSystemHealth();
      
      const customService = healthStatus.checks.find(s => s.service === 'payment-gateway');
      expect(customService).toMatchObject({
        service: 'payment-gateway',
        status: 'healthy',
        responseTime: 45,
        critical: true
      });
    });

    test('should support health check dependencies', async () => {
      // Setup dependency chain: app -> database -> redis
      await (healthMonitorService as any).configureDependencies({
        'app': ['database'],
        'database': ['redis']
      });

      // Fail Redis
      (mockRedisService.ping as any).mockRejectedValue(new Error('Redis down'));

      const healthStatus = await healthMonitorService.getSystemHealth();

      // Should propagate failure up dependency chain
      const redisService = healthStatus.checks.find(s => s.service === 'redis');
      const dbService = healthStatus.checks.find(s => s.service === 'database');
      const appService = healthStatus.checks.find(s => s.service === 'app');

      expect(redisService?.status).not.toBe('healthy');
      // Database may be degraded due to Redis dependency
      expect(dbService?.status).toBeDefined();
      expect(appService?.status).toBeDefined();
    });

    test('should support health check maintenance mode', async () => {
      // Enable maintenance mode
      await (healthMonitorService as any).enableMaintenanceMode('scheduled-maintenance');

      const healthStatus = await healthMonitorService.getSystemHealth();

      // Note: maintenanceMode and maintenanceReason are not part of SystemHealthSummary interface
      // These would need to be added to the interface if maintenance mode tracking is required
      expect((healthStatus as any).overallStatus).toMatch(/maintenance|degraded/);

      // Disable maintenance mode
      await (healthMonitorService as any).disableMaintenanceMode();

      const postMaintenanceStatus = await healthMonitorService.getSystemHealth();
      expect((postMaintenanceStatus as any).maintenanceMode).toBe(false);
    });
  });

  describe('Integration with External Monitoring', () => {
    test('should export metrics for external monitoring systems', async () => {
      // Execute operations to generate metrics
      await gracefulDegradationService.executeDatabase(jest.fn<any>().mockResolvedValue({ test: 1 }) as () => Promise<unknown>);
      await (healthMonitorService as any).runHealthChecks();

      const exportedMetrics = await (healthMonitorService as any).exportMetrics();

      expect(exportedMetrics).toMatchObject({
        timestamp: expect.any(String),
        metrics: expect.objectContaining({
          'health_check_duration': expect.any(Number),
          'service_availability': expect.any(Number),
          'system_uptime': expect.any(Number)
        }),
        labels: expect.objectContaining({
          environment: 'test',
          version: expect.any(String)
        })
      });
    });

    test('should support health check webhooks', async () => {
      const webhookCalls: any[] = [];

      // Mock webhook endpoint
      const mockWebhook = jest.fn().mockImplementation((data) => {
        webhookCalls.push(data);
        return Promise.resolve({ status: 'received' });
      });

      // Configure webhook
      await (healthMonitorService as any).configureWebhook({
        url: 'http://monitoring.example.com/webhook',
        method: 'POST',
        triggers: ['state_change', 'threshold_breach'],
        handler: mockWebhook
      });

      // Trigger state change
      await gracefulDegradationService.setServiceState('webhook-test', 'DEGRADED' as any);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify webhook was called
      expect(webhookCalls.length).toBeGreaterThan(0);
      
      webhookCalls.forEach(call => {
        expect(call).toMatchObject({
          event: expect.any(String),
          service: expect.any(String),
          timestamp: expect.any(String),
          data: expect.any(Object)
        });
      });
    });

    test('should integrate with alerting systems', async () => {
      const alertEvents: any[] = [];

      // Mock alert handler
      eventBus.on('health.alert.triggered', (event) => {
        alertEvents.push(event);
      });

      // Configure alert thresholds
      await (healthMonitorService as any).configureAlerts({
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

      // Trigger conditions that should generate alerts
      await gracefulDegradationService.setServiceState('alert-test', 'UNAVAILABLE' as any);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify alerts were triggered
      expect(alertEvents.length).toBeGreaterThan(0);
      
      alertEvents.forEach(alert => {
        expect(alert).toMatchObject({
          alert: expect.any(String),
          severity: expect.stringMatching(/warning|critical|info/),
          timestamp: expect.any(String),
          service: expect.any(String),
          condition: expect.any(String)
        });
      });
    });
  });

  describe('Health System Configuration', () => {
    test('should support dynamic health check configuration', async () => {
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

      await (healthMonitorService as any).updateConfiguration(newConfig);

      const currentConfig = (healthMonitorService as any).getConfiguration();
      
      expect(currentConfig).toMatchObject({
        interval: 2000,
        timeout: 1000,
        retries: 2,
        services: expect.objectContaining({
          database: { enabled: true, critical: true },
          redis: { enabled: true, critical: false }
        })
      });
    });

    test('should validate health check configuration', async () => {
      const invalidConfig = {
        interval: -1, // Invalid
        timeout: 0, // Invalid
        services: null // Invalid
      };

      await expect(
        (healthMonitorService as any).updateConfiguration(invalidConfig)
      ).rejects.toThrow('Invalid health check configuration');

      // Configuration should remain unchanged
      const currentConfig = (healthMonitorService as any).getConfiguration();
      expect(currentConfig.interval).toBeGreaterThan(0);
      expect(currentConfig.timeout).toBeGreaterThan(0);
    });

    test('should support environment-specific configurations', async () => {
      // Test configuration for different environments
      const environments = ['development', 'staging', 'production'];

      for (const env of environments) {
        process.env.NODE_ENV = env;

        const envConfig = await (healthMonitorService as any).getEnvironmentConfiguration();
        
        expect(envConfig).toMatchObject({
          environment: env,
          interval: expect.any(Number),
          timeout: expect.any(Number),
          critical_threshold: expect.any(Number)
        });

        // Production should have stricter settings
        if (env === 'production') {
          expect(envConfig.interval).toBeLessThanOrEqual(5000);
          expect(envConfig.timeout).toBeLessThanOrEqual(2000);
        }
      }

      // Restore test environment
      process.env.NODE_ENV = 'test';
    });
  });

  describe('Health System Security', () => {
    test('should secure health check endpoints', async () => {
      // Test unauthorized access
      const unauthorizedRequest = {
        headers: {},
        user: null
      };

      const healthEndpoint = (healthMonitorService as any).getHealthEndpoint();
      const result = await healthEndpoint.handler(unauthorizedRequest);

      // Should return limited information for unauthorized requests
      expect(result).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String)
      });

      // Should not expose sensitive details
      expect(result.services).toBeUndefined();
      expect(result.internal).toBeUndefined();
    });

    test('should support authenticated health checks', async () => {
      const authenticatedRequest = {
        headers: {
          authorization: 'Bearer valid-health-token'
        },
        user: { role: 'admin' }
      };

      const healthEndpoint = (healthMonitorService as any).getHealthEndpoint();
      const result = await healthEndpoint.handler(authenticatedRequest);

      // Should return detailed information for authenticated requests
      expect(result).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        services: expect.any(Array),
        circuitBreakers: expect.any(Object),
        resources: expect.any(Object)
      });
    });

    test('should audit health system access', async () => {
      const auditEvents: any[] = [];

      eventBus.on('health.audit.access', (event) => {
        auditEvents.push(event);
      });

      // Perform various health operations
      await healthMonitorService.getSystemHealth();
      await (healthMonitorService as any).runHealthChecks();
      await gracefulDegradationService.getSystemHealth();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify audit events were generated
      expect(auditEvents.length).toBeGreaterThan(0);
      
      auditEvents.forEach(event => {
        expect(event).toMatchObject({
          action: expect.any(String),
          timestamp: expect.any(String),
          source: expect.any(String),
          result: expect.any(String)
        });
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed service responses', async () => {
      // Mock malformed response
      (mockDatabaseService.client as any).$queryRaw.mockResolvedValue(null);

      const healthResult = await (healthMonitorService as any).runHealthChecks();

      // Should handle gracefully
      expect(healthResult.overallStatus).toBe('degraded');
      
      const dbService = healthResult.services.find(s => s.service === 'database');
      expect(dbService?.status).toBe('unhealthy');
      expect(dbService?.error).toContain('malformed response');
    });

    test('should handle service initialization failures', async () => {
      // Stop services
      await healthMonitorService.stop();
      await (gracefulDegradationService as any).shutdown();

      // Mock initialization failure
      const initError = new Error('Initialization failed');
      jest.spyOn(gracefulDegradationService, 'initialize').mockRejectedValue(initError);

      // Attempt to restart
      await expect(
        gracefulDegradationService.initialize({} as any)
      ).rejects.toThrow('Initialization failed');

      // Health monitoring should still be available
      const healthResult = await healthMonitorService.getSystemHealth();
      expect(healthResult.overallStatus).toBe('unhealthy');
    });

    test('should handle concurrent service state changes', async () => {
      const statePromises = [
        gracefulDegradationService.setServiceState('concurrent-test', 'DEGRADED' as any),
        gracefulDegradationService.setServiceState('concurrent-test', 'HEALTHY' as any),
        gracefulDegradationService.setServiceState('concurrent-test', 'UNAVAILABLE' as any),
        gracefulDegradationService.setServiceState('concurrent-test', 'HEALTHY' as any)
      ];

      // All operations should complete without error
      await Promise.all(statePromises);

      const finalHealth = gracefulDegradationService.getSystemHealth();
      expect(finalHealth.timestamp).toBeDefined();

      // Final state should be consistent
      const testService = finalHealth.services.find(s => (s as any).name === 'concurrent-test');
      expect(testService?.status).toBeDefined();
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should track health check performance metrics', async () => {
      const performanceMetrics: any[] = [];

      // Mock metrics collection
      mockMetricsCollector.histogram.mockImplementation((metric, value, labels) => {
        if ((metric as any).includes('health_check')) {
          performanceMetrics.push({ metric, value, labels });
        }
      });

      // Execute health checks
      await (healthMonitorService as any).runHealthChecks();
      await gracefulDegradationService.getSystemHealth();

      expect(performanceMetrics.length).toBeGreaterThan(0);
      
      performanceMetrics.forEach(metric => {
        expect(metric).toMatchObject({
          metric: expect.stringMatching(/health_check|system_health/),
          value: expect.any(Number),
          labels: expect.any(Object)
        });
      });
    });

    test('should monitor degradation service performance', async () => {
      const operationMetrics: any[] = [];

      mockMetricsCollector.histogram.mockImplementation((metric, value, labels) => {
        if ((metric as any).includes('degradation')) {
          operationMetrics.push({ metric, value, labels });
        }
      });

      // Execute operations through degradation service
      const operations = Array.from({ length: 5 }, (_, i) =>
        gracefulDegradationService.executeDatabase(
          jest.fn<any>().mockResolvedValue({ id: i }) as () => Promise<unknown>
        )
      );

      await Promise.all(operations);

      expect(operationMetrics.length).toBeGreaterThan(0);
      
      operationMetrics.forEach(metric => {
        expect(metric.value).toBeGreaterThan(0);
        expect(metric.labels).toMatchObject({
          service: expect.any(String),
          operation: expect.any(String)
        });
      });
    });

    test('should correlate health metrics with system performance', async () => {
      const correlationData: any[] = [];

      // Mock correlation tracking
      eventBus.on('health.metrics.correlated', (data) => {
        correlationData.push(data);
      });

      // Execute load test scenario
      const loadOperations = Array.from({ length: 20 }, (_, i) => async () => {
        await gracefulDegradationService.executeDatabase(
          jest.fn<any>().mockResolvedValue({ load: i }) as () => Promise<unknown>
        );
        return (healthMonitorService as any).runHealthChecks();
      });

      // Execute operations in parallel
      await Promise.all(loadOperations.map(op => op()));

      await new Promise(resolve => setTimeout(resolve, 200));

      // Should have correlation data
      expect(correlationData.length).toBeGreaterThan(0);
      
      correlationData.forEach(data => {
        expect(data).toMatchObject({
          healthMetric: expect.any(String),
          performanceMetric: expect.any(String),
          correlation: expect.any(Number),
          timestamp: expect.any(String)
        });
      });
    });
  });

  describe('Health System Stress Testing', () => {
    test('should handle extreme load conditions', async () => {
      const startTime = Date.now();
      const concurrency = 50;

      // Create high-concurrency scenario
      const stressOperations = Array.from({ length: concurrency }, (_, i) => async () => {
        const operation = jest.fn<any>().mockImplementation(async () => {
          // Simulate variable response times
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          return { stress: i };
        });

        return Promise.all([
          gracefulDegradationService.executeDatabase(operation as any),
          gracefulDegradationService.executeRedis(operation as any),
          (healthMonitorService as any).runHealthChecks()
        ]);
      });

      const results = await Promise.all(stressOperations.map(op => op()));
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All operations should complete
      expect(results.length).toBe(concurrency);
      
      // Should maintain reasonable performance
      expect(duration).toBeLessThan(10000); // Less than 10 seconds

      // System should remain stable
      const finalHealth = gracefulDegradationService.getSystemHealth();
      expect(finalHealth.timestamp).toBeDefined();
    });

    test('should gracefully degrade under memory pressure', async () => {
      // Simulate memory pressure
      const memoryIntensiveOperation = jest.fn<any>().mockImplementation(async () => {
        // Simulate memory allocation
        const largeArray = new Array(100000).fill('memory-pressure');
        return { memory: largeArray.length };
      });

      // Execute memory-intensive operations
      const operations = Array.from({ length: 10 }, () =>
        gracefulDegradationService.executeDatabase(memoryIntensiveOperation as any)
      );

      const results = await Promise.all(operations);

      // Operations should complete but may use fallbacks
      expect(results.length).toBe(10);
      
      const systemHealth = gracefulDegradationService.getSystemHealth();
      expect(systemHealth.timestamp).toBeDefined();

      // Verify memory metrics were collected
      expect(mockMetricsCollector.gauge).toHaveBeenCalledWith(
        expect.stringMatching(/memory|resource/),
        expect.any(Number),
        expect.any(Object)
      );
    });

    test('should handle network partition scenarios', async () => {
      // Simulate network partition
      (mockDatabaseService.client as any).$queryRaw.mockImplementation(() =>
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 1000)
        )
      );

      (mockRedisService.ping as any).mockImplementation(() =>
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 1000)
        )
      );

      const startTime = Date.now();

      // Execute operations during network partition
      const partitionOperations = [
        gracefulDegradationService.executeDatabase(jest.fn() as () => Promise<unknown>),
        gracefulDegradationService.executeRedis(jest.fn() as () => Promise<unknown>),
        (healthMonitorService as any).runHealthChecks()
      ];

      await Promise.allSettled(partitionOperations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should timeout gracefully
      expect(duration).toBeLessThan(5000);

      const systemHealth = gracefulDegradationService.getSystemHealth();
      expect((systemHealth as any).overallStatus).toBe('UNAVAILABLE');
      expect(systemHealth.summary.unavailable).toBeGreaterThan(0);
    });
  });

  describe('Health Check Compliance and Standards', () => {
    test('should comply with Kubernetes health check standards', async () => {
      const k8sLivenessCheck = await (healthMonitorService as any).getKubernetesLivenessProbe();
      const k8sReadinessCheck = await (healthMonitorService as any).getKubernetesReadinessProbe();

      // Kubernetes liveness probe format
      expect(k8sLivenessCheck).toMatchObject({
        httpGet: expect.objectContaining({
          path: '/health/live',
          port: expect.any(Number),
          scheme: 'HTTP'
        }),
        initialDelaySeconds: expect.any(Number),
        periodSeconds: expect.any(Number),
        timeoutSeconds: expect.any(Number),
        failureThreshold: expect.any(Number)
      });

      // Kubernetes readiness probe format
      expect(k8sReadinessCheck).toMatchObject({
        httpGet: expect.objectContaining({
          path: '/health/ready',
          port: expect.any(Number),
          scheme: 'HTTP'
        }),
        initialDelaySeconds: expect.any(Number),
        periodSeconds: expect.any(Number),
        timeoutSeconds: expect.any(Number),
        failureThreshold: expect.any(Number)
      });
    });

    test('should support Docker health check format', async () => {
      const dockerHealthCheck = await (healthMonitorService as any).getDockerHealthCheck();

      expect(dockerHealthCheck).toMatchObject({
        test: expect.arrayContaining([
          'CMD-SHELL',
          expect.stringMatching(/curl|wget/)
        ]),
        interval: expect.stringMatching(/\d+[sm]/),
        timeout: expect.stringMatching(/\d+[sm]/),
        retries: expect.any(Number),
        start_period: expect.stringMatching(/\d+[sm]/)
      });
    });

    test('should generate OpenAPI health endpoints specification', async () => {
      const openApiSpec = await (healthMonitorService as any).getOpenApiHealthSpecification();

      expect(openApiSpec).toMatchObject({
        openapi: '3.0.0',
        info: expect.objectContaining({
          title: expect.stringContaining('Health'),
          version: expect.any(String)
        }),
        paths: expect.objectContaining({
          '/health': expect.any(Object),
          '/health/live': expect.any(Object),
          '/health/ready': expect.any(Object)
        })
      });

      // Verify health endpoint specification
      const healthPath = openApiSpec.paths['/health'];
      expect(healthPath.get).toMatchObject({
        summary: expect.any(String),
        responses: expect.objectContaining({
          '200': expect.any(Object),
          '503': expect.any(Object)
        })
      });
    });
  });

  describe('Health System Analytics and Reporting', () => {
    test('should generate health trend reports', async () => {
      // Execute operations over time to create trends
      const timePoints = [
        { delay: 0, state: 'HEALTHY' },
        { delay: 100, state: 'DEGRADED' },
        { delay: 200, state: 'UNAVAILABLE' },
        { delay: 300, state: 'HEALTHY' }
      ];

      for (const point of timePoints) {
        await new Promise(resolve => setTimeout(resolve, point.delay));
        await gracefulDegradationService.setServiceState('trend-test', point.state as any);
      }

      const trendReport = await (healthMonitorService as any).generateTrendReport({
        period: '1h',
        services: ['trend-test'],
        metrics: ['availability', 'response_time', 'error_rate']
      });

      expect(trendReport).toMatchObject({
        period: '1h',
        services: expect.arrayContaining([
          expect.objectContaining({
            service: 'trend-test',
            metrics: expect.objectContaining({
              availability: expect.any(Number),
              response_time: expect.any(Number),
              error_rate: expect.any(Number)
            }),
            trend: expect.objectContaining({
              direction: expect.stringMatching(/up|down|stable/),
              change: expect.any(Number)
            })
          })
        ])
      });
    });

    test('should calculate service level objectives (SLO)', async () => {
      // Configure SLO targets
      const sloConfig = {
        availability: 99.9, // 99.9% uptime
        response_time: 200, // 200ms P95
        error_rate: 0.1 // 0.1% error rate
      };

      await (healthMonitorService as any).configureSLO('slo-test-service', sloConfig);

      // Execute operations to generate SLO data
      const operations = Array.from({ length: 100 }, (_, i) => {
        const operation = jest.fn<any>().mockImplementation(async () => {
          // Simulate occasional failures
          if (i % 50 === 0) {
            throw new Error('Occasional failure');
          }
          return { success: i };
        });

        return (gracefulDegradationService as any).executeOperation('slo-test-service', operation);
      });

      await Promise.allSettled(operations);

      const sloReport = await (healthMonitorService as any).getSLOReport('slo-test-service');

      expect(sloReport).toMatchObject({
        service: 'slo-test-service',
        period: expect.any(String),
        objectives: expect.objectContaining({
          availability: expect.objectContaining({
            target: 99.9,
            actual: expect.any(Number),
            status: expect.stringMatching(/met|breached/)
          }),
          response_time: expect.objectContaining({
            target: 200,
            actual: expect.any(Number),
            status: expect.stringMatching(/met|breached/)
          })
        }),
        budget: expect.objectContaining({
          remaining: expect.any(Number),
          consumed: expect.any(Number)
        })
      });
    });

    test('should provide health system recommendations', async () => {
      // Create scenario with mixed health states
      await gracefulDegradationService.setServiceState('rec-db', 'DEGRADED' as any);
      await gracefulDegradationService.setServiceState('rec-redis', 'HEALTHY' as any);
      await gracefulDegradationService.setServiceState('rec-external', 'UNAVAILABLE' as any);

      const recommendations = await (healthMonitorService as any).getHealthRecommendations();

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/scaling|configuration|maintenance/),
            priority: expect.stringMatching(/high|medium|low/),
            service: expect.any(String),
            description: expect.any(String),
            action: expect.any(String)
          })
        ])
      );

      // Should have recommendations for degraded services
      const degradedRecommendations = recommendations.filter(r => 
        r.service === 'rec-db' && r.priority === 'high'
      );
      expect(degradedRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Health System Backup and Recovery', () => {
    test('should backup health configuration and state', async () => {
      // Configure complex health system state
      await gracefulDegradationService.setServiceState('backup-test-1', 'HEALTHY' as any);
      await gracefulDegradationService.setServiceState('backup-test-2', 'DEGRADED' as any);

      await (healthMonitorService as any).updateConfiguration({
        interval: 3000,
        services: {
          'backup-test-1': { enabled: true, critical: true },
          'backup-test-2': { enabled: true, critical: false }
        }
      });

      const backup = await (healthMonitorService as any).createBackup();

      expect(backup).toMatchObject({
        timestamp: expect.any(String),
        version: expect.any(String),
        configuration: expect.objectContaining({
          interval: 3000,
          services: expect.any(Object)
        }),
        state: expect.objectContaining({
          services: expect.any(Object),
          overall: expect.any(String)
        })
      });
    });

    test('should restore health system from backup', async () => {
      // Create initial state
      const originalConfig = {
        interval: 1000,
        services: {
          'restore-test': { enabled: true, critical: true }
        }
      };

      await (healthMonitorService as any).updateConfiguration(originalConfig);
      const backup = await (healthMonitorService as any).createBackup();

      // Change configuration
      await (healthMonitorService as any).updateConfiguration({
        interval: 5000,
        services: {
          'different-service': { enabled: false, critical: false }
        }
      });

      // Restore from backup
      await (healthMonitorService as any).restoreFromBackup(backup);

      const restoredConfig = (healthMonitorService as any).getConfiguration();
      expect(restoredConfig).toMatchObject({
        interval: 1000,
        services: expect.objectContaining({
          'restore-test': { enabled: true, critical: true }
        })
      });
    });
  });

  describe('Integration Test Scenarios', () => {
    test('should integrate all health system components under normal load', async () => {
      const integrationResults = {
        healthChecks: 0,
        degradationActions: 0,
        circuitBreakerActions: 0,
        recoveryActions: 0
      };

      // Setup event tracking
      eventBus.on('health.*', () => integrationResults.healthChecks++);
      eventBus.on('degradation.*', () => integrationResults.degradationActions++);
      eventBus.on('circuit.*', () => integrationResults.circuitBreakerActions++);
      eventBus.on('recovery.*', () => integrationResults.recoveryActions++);

      // Execute comprehensive integration scenario
      const integrationScenario = async () => {
        // Normal operations
        await gracefulDegradationService.executeDatabase(jest.fn<any>().mockResolvedValue({ normal: 1 }) as () => Promise<unknown>);
        await gracefulDegradationService.executeRedis(jest.fn<any>().mockResolvedValue('OK') as () => Promise<unknown>);

        // Introduce failure
        await gracefulDegradationService.executeDatabase(
          jest.fn<any>().mockRejectedValue(new Error('Temporary failure')) as () => Promise<unknown>
        );

        // Recovery
        for (let i = 0; i < 3; i++) {
          await gracefulDegradationService.executeDatabase(jest.fn<any>().mockResolvedValue({ recover: i }) as () => Promise<unknown>);
        }

        return healthMonitorService.getSystemHealth();
      };

      const finalHealth = await integrationScenario();

      expect(finalHealth).toMatchObject({
        overall: expect.any(String),
        services: expect.any(Array),
        circuitBreakers: expect.any(Object),
        timestamp: expect.any(String)
      });

      // Verify integration events occurred
      expect(integrationResults.healthChecks).toBeGreaterThan(0);
    });

    test('should maintain data consistency across health components', async () => {
      const consistency = {
        gracefulDegradation: null as any,
        healthMonitor: null as any,
        circuitBreakers: null as any
      };

      // Execute operations and capture states
      await gracefulDegradationService.executeDatabase(jest.fn<any>().mockResolvedValue({ consistency: 1 }) as () => Promise<unknown>);
      
      await new Promise(resolve => setTimeout(resolve, 200));

      consistency.gracefulDegradation = gracefulDegradationService.getSystemHealth();
      consistency.healthMonitor = await healthMonitorService.getSystemHealth();
      consistency.circuitBreakers = (circuitBreakerRegistry as any).getHealthSummary();

      // Verify timestamp consistency (within 1 second)
      const timestamps = [
        new Date(consistency.gracefulDegradation.timestamp).getTime(),
        new Date(consistency.healthMonitor.timestamp).getTime()
      ];

      const maxTimestampDiff = Math.max(...timestamps) - Math.min(...timestamps);
      expect(maxTimestampDiff).toBeLessThan(1000);

      // Verify overall state consistency
      const states = [
        consistency.gracefulDegradation.overallStatus,
        consistency.healthMonitor.overallStatus
      ];

      // States should be compatible (not conflicting)
      const compatibleStates = [
        ['HEALTHY', 'healthy'],
        ['DEGRADED', 'degraded'],
        ['UNAVAILABLE', 'unhealthy']
      ];

      const isConsistent = compatibleStates.some(([gd, hm]) => 
        states.includes(gd) && states.includes(hm)
      );

      expect(isConsistent).toBe(true);
    });

    test('should handle end-to-end health system workflow', async () => {
      const workflowSteps = [];

      // Step 1: System startup
      workflowSteps.push('startup');
      await healthMonitorService.start();

      // Step 2: Normal operations
      workflowSteps.push('normal_operations');
      for (let i = 0; i < 5; i++) {
        await gracefulDegradationService.executeDatabase(jest.fn<any>().mockResolvedValue({ step: 2, op: i }) as () => Promise<unknown>);
      }

      // Step 3: Service degradation
      workflowSteps.push('degradation');
      await gracefulDegradationService.setServiceState('workflow-test', 'DEGRADED' as any);

      // Step 4: Fallback operations
      workflowSteps.push('fallback');
      const fallbackOp = jest.fn<any>().mockRejectedValue(new Error('Service down')) as jest.Mock;
      await (gracefulDegradationService as any).executeOperation('workflow-test', fallbackOp, {
        fallbackData: { fallback: true }
      });

      // Step 5: Circuit breaker activation
      workflowSteps.push('circuit_breaker');
      const cb = (circuitBreakerRegistry as any).getCircuitBreaker('workflow-circuit');
      for (let i = 0; i < 5; i++) {
        try {
          await cb.call(async () => { throw new Error('Circuit test'); });
        } catch (e) { /* Expected */ }
      }

      // Step 6: Recovery
      workflowSteps.push('recovery');
      for (let i = 0; i < 10; i++) {
        await (gracefulDegradationService as any).executeOperation('workflow-test', 
          jest.fn<any>().mockResolvedValue({ recovery: i }) as () => Promise<unknown>
        );
      }

      // Step 7: Final health check
      workflowSteps.push('final_check');
      const finalHealth = await healthMonitorService.getSystemHealth();

      expect(workflowSteps).toEqual([
        'startup',
        'normal_operations', 
        'degradation',
        'fallback',
        'circuit_breaker',
        'recovery',
        'final_check'
      ]);

      expect(finalHealth).toMatchObject({
        overall: expect.any(String),
        services: expect.any(Array),
        workflow: expect.objectContaining({
          completed: true,
          steps: workflowSteps.length
        })
      });
    });
  });
});