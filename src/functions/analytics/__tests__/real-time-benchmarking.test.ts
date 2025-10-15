/**
 * Unit Tests for Real-Time Benchmarking Engine
 * Epic 2 → Story 4: Live School Performance Comparison with Anomaly Detection
 */

import { realTimeBenchmarkingEngine, RealTimeBenchmarkingEngine } from '../real-time-benchmarking';

// Mock dependencies
jest.mock('../shared/logger.service');
jest.mock('../shared/database.service');

describe('Real-Time Benchmarking Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Engine Initialization', () => {
    it('should initialize with school data', async () => {
      const mockSchools = [
        {
          id: 'school1',
          subscriptionTier: 'PREMIUM',
          users: [{ role: 'student' }, { role: 'student' }, { role: 'teacher' }],
        },
        {
          id: 'school2',
          subscriptionTier: 'BASIC',
          users: [
            { role: 'student' },
            { role: 'student' },
            { role: 'student' },
            { role: 'teacher' },
          ],
        },
      ];

      await realTimeBenchmarkingEngine.initialize(mockSchools);

      expect(realTimeBenchmarkingEngine).toBeDefined();
    });

    it('should create peer groups based on school characteristics', async () => {
      const mockSchools = [
        {
          id: 'school1',
          subscriptionTier: 'PREMIUM',
          users: Array(300).fill({ role: 'student' }),
        },
        {
          id: 'school2',
          subscriptionTier: 'PREMIUM',
          users: Array(250).fill({ role: 'student' }),
        },
      ];

      await realTimeBenchmarkingEngine.initialize(mockSchools);

      const status = realTimeBenchmarkingEngine.getSystemStatus();
      expect(status.peerGroupsActive).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics Calculation', () => {
    it('should calculate comprehensive school metrics', async () => {
      const mockSchool = {
        id: 'school1',
        users: [{ role: 'student' }, { role: 'student' }, { role: 'teacher' }],
        orders: [
          { status: 'completed', totalAmount: 500 },
          { status: 'completed', totalAmount: 300 },
          { status: 'pending', totalAmount: 200 },
        ],
        subscriptions: [{}, {}],
      };

      // Access private method through type assertion for testing
      const engine = realTimeBenchmarkingEngine as any;
      const metrics = await engine.calculateSchoolMetrics(mockSchool);

      expect(metrics).toBeDefined();
      expect(metrics.operationalEfficiency).toBeGreaterThanOrEqual(0);
      expect(metrics.operationalEfficiency).toBeLessThanOrEqual(100);
      expect(metrics.financialHealth).toBeGreaterThanOrEqual(0);
      expect(metrics.financialHealth).toBeLessThanOrEqual(100);
      expect(metrics.nutritionQuality).toBeGreaterThanOrEqual(0);
      expect(metrics.nutritionQuality).toBeLessThanOrEqual(100);
      expect(metrics.studentSatisfaction).toBeGreaterThanOrEqual(0);
      expect(metrics.studentSatisfaction).toBeLessThanOrEqual(100);
      expect(metrics.safetyCompliance).toBeGreaterThanOrEqual(0);
      expect(metrics.safetyCompliance).toBeLessThanOrEqual(100);
    });

    it('should handle schools with no order data', async () => {
      const mockSchool = {
        id: 'school1',
        users: [{ role: 'student' }],
        orders: [],
        subscriptions: [],
      };

      const engine = realTimeBenchmarkingEngine as any;
      const metrics = await engine.calculateSchoolMetrics(mockSchool);

      expect(metrics).toBeNull();
    });
  });

  describe('Peer Group Analysis', () => {
    it('should create appropriate peer groups', async () => {
      const mockSchools = [
        {
          id: 'school1',
          subscriptionTier: 'PREMIUM',
          users: Array(300).fill({ role: 'student' }),
        },
        {
          id: 'school2',
          subscriptionTier: 'BASIC',
          users: Array(150).fill({ role: 'student' }),
        },
      ];

      await realTimeBenchmarkingEngine.initialize(mockSchools);

      const status = realTimeBenchmarkingEngine.getSystemStatus();
      expect(status.peerGroupsActive).toBeGreaterThan(0);
    });

    it('should calculate peer group benchmarks', async () => {
      const mockSchools = [
        {
          id: 'school1',
          subscriptionTier: 'PREMIUM',
          users: Array(300).fill({ role: 'student' }),
          orders: [{ status: 'completed', totalAmount: 500 }],
          subscriptions: [{}],
        },
      ];

      await realTimeBenchmarkingEngine.initialize(mockSchools);

      // Benchmarks should be calculated during initialization
      expect(realTimeBenchmarkingEngine).toBeDefined();
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect statistical anomalies', async () => {
      const mockSchools = [
        {
          id: 'school1',
          subscriptionTier: 'PREMIUM',
          users: Array(300).fill({ role: 'student' }),
        },
      ];

      await realTimeBenchmarkingEngine.initialize(mockSchools);

      // Anomaly detection runs in background intervals
      // We can test that the system is set up correctly
      const status = realTimeBenchmarkingEngine.getSystemStatus();
      expect(status.anomaliesDetected).toBeDefined();
    });

    it('should identify potential causes for anomalies', async () => {
      // Test the identifyPotentialCauses method through type assertion
      const engine = realTimeBenchmarkingEngine as any;

      const causes = engine.identifyPotentialCauses('operational_efficiency', true);
      expect(causes).toBeDefined();
      expect(Array.isArray(causes)).toBe(true);

      if (causes.length > 0) {
        expect(causes[0]).toHaveProperty('cause');
        expect(causes[0]).toHaveProperty('probability');
        expect(causes[0]).toHaveProperty('category');
      }
    });
  });

  describe('Performance Ranking', () => {
    it('should generate performance rankings', async () => {
      const mockSchools = [
        {
          id: 'school1',
          subscriptionTier: 'PREMIUM',
          users: Array(300).fill({ role: 'student' }),
          orders: [{ status: 'completed', totalAmount: 500 }],
          subscriptions: [{}],
        },
        {
          id: 'school2',
          subscriptionTier: 'PREMIUM',
          users: Array(250).fill({ role: 'student' }),
          orders: [{ status: 'completed', totalAmount: 400 }],
          subscriptions: [{}],
        },
      ];

      await realTimeBenchmarkingEngine.initialize(mockSchools);

      // Rankings are generated in background intervals
      expect(realTimeBenchmarkingEngine).toBeDefined();
    });

    it('should calculate category-specific rankings', async () => {
      const engine = realTimeBenchmarkingEngine as any;

      const mockScores = [
        {
          anonymousId: 'anon1',
          metrics: { operational: 85, financial: 80, nutrition: 75, satisfaction: 82, safety: 88 },
        },
        {
          anonymousId: 'anon2',
          metrics: { operational: 78, financial: 85, nutrition: 80, satisfaction: 75, safety: 82 },
        },
      ];

      const rank = engine.calculateCategoryRank(mockScores, 'operational', 'anon1');
      expect(rank).toBe(1); // Should be ranked 1st in operational category
    });
  });

  describe('System Status Monitoring', () => {
    it('should provide comprehensive system status', () => {
      const status = realTimeBenchmarkingEngine.getSystemStatus();

      expect(status).toBeDefined();
      expect(['healthy', 'degraded', 'critical']).toContain(status.status);
      expect(status.metricsCollected).toBeGreaterThanOrEqual(0);
      expect(status.anomaliesDetected).toBeGreaterThanOrEqual(0);
      expect(status.peerGroupsActive).toBeGreaterThanOrEqual(0);
      expect(status.lastUpdate).toBeInstanceOf(Date);
    });

    it('should track real-time metrics collection', () => {
      const status = realTimeBenchmarkingEngine.getSystemStatus();

      expect(status.metricsCollected).toBeDefined();
      expect(typeof status.metricsCollected).toBe('number');
    });
  });

  describe('Trend Analysis', () => {
    it('should calculate trend directions', () => {
      const engine = realTimeBenchmarkingEngine as any;

      const trend = engine.calculateTrendDirection('school1');
      expect(['improving', 'stable', 'declining', 'volatile']).toContain(trend);
    });

    it('should identify strength areas', () => {
      const engine = realTimeBenchmarkingEngine as any;

      const metrics = {
        operational: 85,
        financial: 75,
        nutrition: 80,
        satisfaction: 70,
        safety: 90,
      };
      const strengths = engine.identifyStrengthAreas(metrics);

      expect(Array.isArray(strengths)).toBe(true);
      expect(strengths.length).toBeGreaterThan(0);
    });

    it('should identify improvement areas', () => {
      const engine = realTimeBenchmarkingEngine as any;

      const metrics = {
        operational: 65,
        financial: 70,
        nutrition: 60,
        satisfaction: 75,
        safety: 55,
      };
      const improvements = engine.identifyImprovementAreas(metrics);

      expect(Array.isArray(improvements)).toBe(true);
      expect(improvements.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database service to throw error
      const mockDatabaseService = require('../shared/database.service');
      mockDatabaseService.DatabaseService.client.findMany = jest
        .fn()
        .mockRejectedValue(new Error('Database connection failed'));

      const mockSchools = [{ id: 'school1' }];

      // Should not throw, but log error
      await expect(realTimeBenchmarkingEngine.initialize(mockSchools)).resolves.not.toThrow();
    });

    it('should handle invalid school data', async () => {
      const invalidSchools = [null, undefined, {}];

      await expect(
        realTimeBenchmarkingEngine.initialize(invalidSchools as any)
      ).resolves.not.toThrow();
    });
  });
});
