/**
 * Unit Tests for Analytics Orchestrator
 * Epic 2 → Story 4: Centralized Analytics API & System Orchestration
 */

import { analyticsOrchestratorHandler, AnalyticsOrchestrator } from '../analytics-orchestrator';

// Mock dependencies
jest.mock('../shared/logger.service');
jest.mock('../shared/database.service');
jest.mock('../../shared/middleware/lambda-auth.middleware');
jest.mock('../cross-school-analytics');
jest.mock('../federated-learning-engine');
jest.mock('../real-time-benchmarking');
jest.mock('../predictive-insights-engine');

describe('Analytics Orchestrator', () => {
  const mockEvent = {
    httpMethod: 'POST',
    path: '/analytics/execute',
    body: JSON.stringify({
      operation: 'cross_school_analytics',
      parameters: { schoolId: 'test-school' },
      options: { cacheEnabled: false },
    }),
    requestContext: {
      identity: { sourceIp: '127.0.0.1' },
    },
  } as any;

  const mockContext = {
    awsRequestId: 'test-request-id',
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Handler Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      const mockAuthResult = { statusCode: 401 };
      const { authenticateLambda } = require('../../shared/middleware/lambda-auth.middleware');
      authenticateLambda.mockResolvedValue(mockAuthResult);

      const result = await analyticsOrchestratorHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(401);
    });

    it('should reject requests from insufficient permissions', async () => {
      const mockAuthResult = {
        user: { id: 'user1', role: 'student' },
      };
      const { authenticateLambda } = require('../../shared/middleware/lambda-auth.middleware');
      authenticateLambda.mockResolvedValue(mockAuthResult);

      const result = await analyticsOrchestratorHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(403);
    });
  });

  describe('Operation Execution', () => {
    beforeEach(() => {
      const mockAuthResult = {
        user: { id: 'admin1', role: 'admin' },
      };
      const { authenticateLambda } = require('../../shared/middleware/lambda-auth.middleware');
      authenticateLambda.mockResolvedValue(mockAuthResult);
    });

    it('should queue analytics operations successfully', async () => {
      const result = await analyticsOrchestratorHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.operationId).toBeDefined();
    });

    it('should handle invalid request bodies', async () => {
      const invalidEvent = {
        ...mockEvent,
        body: 'invalid json',
      };

      const result = await analyticsOrchestratorHandler(invalidEvent, mockContext);

      expect(result.statusCode).toBe(500);
    });

    it('should validate request schemas', async () => {
      const invalidEvent = {
        ...mockEvent,
        body: JSON.stringify({
          operation: 'invalid_operation',
          parameters: {},
        }),
      };

      const result = await analyticsOrchestratorHandler(invalidEvent, mockContext);

      expect(result.statusCode).toBe(400);
    });
  });

  describe('System Health Monitoring', () => {
    it('should return system health metrics', async () => {
      const healthEvent = {
        ...mockEvent,
        httpMethod: 'GET',
        path: '/analytics/health',
      };

      const mockAuthResult = {
        user: { id: 'admin1', role: 'admin' },
      };
      const { authenticateLambda } = require('../../shared/middleware/lambda-auth.middleware');
      authenticateLambda.mockResolvedValue(mockAuthResult);

      const result = await analyticsOrchestratorHandler(healthEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data.overall).toBeDefined();
      expect(body.data.components).toBeDefined();
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', async () => {
      const cacheEvent = {
        ...mockEvent,
        httpMethod: 'GET',
        path: '/analytics/cache-stats',
      };

      const mockAuthResult = {
        user: { id: 'admin1', role: 'admin' },
      };
      const { authenticateLambda } = require('../../shared/middleware/lambda-auth.middleware');
      authenticateLambda.mockResolvedValue(mockAuthResult);

      const result = await analyticsOrchestratorHandler(cacheEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data.totalEntries).toBeDefined();
      expect(body.data.hitRate).toBeDefined();
    });
  });

  describe('Operation Status Tracking', () => {
    it('should return operation status', async () => {
      const statusEvent = {
        ...mockEvent,
        httpMethod: 'GET',
        path: '/analytics/status',
        queryStringParameters: { operationId: 'test-op-123' },
      };

      const mockAuthResult = {
        user: { id: 'admin1', role: 'admin' },
      };
      const { authenticateLambda } = require('../../shared/middleware/lambda-auth.middleware');
      authenticateLambda.mockResolvedValue(mockAuthResult);

      const result = await analyticsOrchestratorHandler(statusEvent, mockContext);

      expect(result.statusCode).toBe(200);
    });

    it('should handle missing operation IDs', async () => {
      const statusEvent = {
        ...mockEvent,
        httpMethod: 'GET',
        path: '/analytics/status',
      };

      const mockAuthResult = {
        user: { id: 'admin1', role: 'admin' },
      };
      const { authenticateLambda } = require('../../shared/middleware/lambda-auth.middleware');
      authenticateLambda.mockResolvedValue(mockAuthResult);

      const result = await analyticsOrchestratorHandler(statusEvent, mockContext);

      expect(result.statusCode).toBe(400);
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch operation requests', async () => {
      const batchEvent = {
        ...mockEvent,
        path: '/analytics/batch',
        body: JSON.stringify({
          requests: [
            {
              operation: 'cross_school_analytics',
              parameters: { schoolId: 'school1' },
            },
            {
              operation: 'real_time_benchmarking',
              parameters: { schoolId: 'school2' },
            },
          ],
        }),
      };

      const mockAuthResult = {
        user: { id: 'admin1', role: 'admin' },
      };
      const { authenticateLambda } = require('../../shared/middleware/lambda-auth.middleware');
      authenticateLambda.mockResolvedValue(mockAuthResult);

      const result = await analyticsOrchestratorHandler(batchEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data.results).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle system errors gracefully', async () => {
      const mockAuthResult = {
        user: { id: 'admin1', role: 'admin' },
      };
      const { authenticateLambda } = require('../../shared/middleware/lambda-auth.middleware');
      authenticateLambda.mockRejectedValue(new Error('Auth service unavailable'));

      const result = await analyticsOrchestratorHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should handle unsupported HTTP methods', async () => {
      const invalidMethodEvent = {
        ...mockEvent,
        httpMethod: 'PATCH',
      };

      const mockAuthResult = {
        user: { id: 'admin1', role: 'admin' },
      };
      const { authenticateLambda } = require('../../shared/middleware/lambda-auth.middleware');
      authenticateLambda.mockResolvedValue(mockAuthResult);

      const result = await analyticsOrchestratorHandler(invalidMethodEvent, mockContext);

      expect(result.statusCode).toBe(405);
    });
  });

  describe('AnalyticsOrchestrator Class', () => {
    let orchestrator: AnalyticsOrchestrator;

    beforeEach(() => {
      // Create a new instance for testing
      orchestrator = new AnalyticsOrchestrator();
    });

    it('should initialize with proper configuration', () => {
      expect(orchestrator).toBeDefined();
      expect(orchestrator.getSystemHealth()).toBeDefined();
    });

    it('should queue operations correctly', async () => {
      const operationId = await orchestrator.queueOperation(
        'test_operation',
        { param1: 'value1' },
        'user123',
        'school123'
      );

      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
    });

    it('should track operation status', async () => {
      const operationId = await orchestrator.queueOperation('test_operation', {}, 'user123');

      const status = orchestrator.getOperationStatus(operationId);
      expect(status).toBeDefined();
      expect(status?.status).toBe('queued');
    });

    it('should provide cache statistics', () => {
      const stats = orchestrator.getCacheStatistics();

      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('oldestEntry');
      expect(stats).toHaveProperty('newestEntry');
    });
  });
});
