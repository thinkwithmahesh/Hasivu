/**
 * HASIVU Platform - Analytics Service Tests
 * Comprehensive test suite for Epic 7: Advanced Features - Analytics and Business Intelligence
 * Tests analytics service including metric tracking, query execution, dashboard generation,
 * KPI calculations, cohort analysis, and predictive analytics
 */
import { AnalyticsService, AnalyticsMetric, AnalyticsQuery, KPI, RevenueAnalytics, UserBehaviorAnalytics, PredictiveAnalytics, CohortAnalysis } from '../../../src/services/analytics.service';
import { DatabaseService } from '../../../src/services/database.service';
import { RedisService } from '../../../src/services/redis.service';
import { cache } from '../../../src/utils/cache';
import { logger } from '../../../src/utils/logger';

// Mock dependencies
jest.mock('../../../src/services/database.service');
jest.mock('../../../src/services/redis.service');
jest.mock('../../../src/utils/cache');
jest.mock('../../../src/utils/logger');

const MockedDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;
const MockedRedisService = RedisService as jest.Mocked<typeof RedisService>;
const MockedCache = cache as jest.Mocked<typeof cache>;
const MockedLogger = logger as jest.Mocked<typeof logger>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    MockedCache.get.mockResolvedValue(null);
    MockedCache.setex.mockResolvedValue(undefined);
    MockedLogger.info.mockImplementation(() => {});
    MockedLogger.error.mockImplementation(() => {});
    MockedLogger.debug.mockImplementation(() => {});
  });

  describe('Initialization', () => {
    it('should initialize analytics service successfully', async () => {
      await expect(AnalyticsService.initialize()).resolves.not.toThrow();
      expect(MockedLogger.info).toHaveBeenCalledWith('Analytics service initialized successfully');
    });

    it('should handle initialization errors gracefully', async () => {
      const error = new Error('Initialization failed');
      MockedLogger.info.mockImplementationOnce(() => {
        throw error;
      });

      await expect(AnalyticsService.initialize()).rejects.toThrow('Initialization failed');
      expect(MockedLogger.error).toHaveBeenCalledWith('Failed to initialize analytics service', error);
    });
  });

  describe('Metric Tracking', () => {
    const validMetricName = 'orders.total';
    const validValue = 100;
    const validDimensions = { school: 'test_school', user_type: 'student' };
    const validMetadata = { orderId: 'order123' };

    it('should track metric successfully with valid data', async () => {
      const result = await AnalyticsService.trackMetric(validMetricName, validValue, validDimensions, validMetadata);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe(validMetricName);
      expect(result.data!.value).toBe(validValue);
      expect(result.data!.dimensions).toEqual(validDimensions);
      expect(result.data!.metadata).toEqual(validMetadata);
      expect(result.data!.type).toBe('counter');
      expect(MockedLogger.debug).toHaveBeenCalledWith('Metric tracked successfully', { 
        name: validMetricName, 
        value: validValue, 
        dimensions: validDimensions 
      });
    });

    it('should reject unknown metric names', async () => {
      const unknownMetric = 'unknown.metric';
      const result = await AnalyticsService.trackMetric(unknownMetric, validValue);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe(`Unknown metric: ${unknownMetric}`);
      expect(result.error!.code).toBe('UNKNOWN_METRIC');
    });

    it('should handle metric tracking errors gracefully', async () => {
      const error = new Error('Storage failed');
      jest.spyOn(AnalyticsService as any, 'storeMetric').mockRejectedValueOnce(error);

      const result = await AnalyticsService.trackMetric(validMetricName, validValue);

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('Failed to track metric');
      expect(result.error!.code).toBe('METRIC_TRACKING_FAILED');
      expect(MockedLogger.error).toHaveBeenCalledWith('Failed to track metric', error, {
        name: validMetricName,
        value: validValue,
        dimensions: {}
      });
    });

    it('should track different metric types correctly', async () => {
      const testCases = [
        { name: 'orders.total', expectedType: 'counter' },
        { name: 'users.total', expectedType: 'gauge' },
        { name: 'system.response_time', expectedType: 'histogram' }
      ];

      for (const testCase of testCases) {
        const result = await AnalyticsService.trackMetric(testCase.name, 100);
        expect(result.success).toBe(true);
        expect(result.data!.type).toBe(testCase.expectedType);
      }
    });

    it('should track metrics with empty dimensions and metadata', async () => {
      const result = await AnalyticsService.trackMetric(validMetricName, validValue);

      expect(result.success).toBe(true);
      expect(result.data!.dimensions).toEqual({});
      expect(result.data!.metadata).toBeUndefined();
    });
  });

  describe('Analytics Query Execution', () => {
    const validQuery: AnalyticsQuery = {
      metrics: ['orders.total', 'orders.value'],
      dimensions: ['school', 'user_type'],
      filters: { school: 'test_school' },
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      },
      groupBy: 'day',
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: 100,
      offset: 0
    };

    it('should execute analytics query successfully', async () => {
      const mockResults = [
        { metric: 'orders.total', value: 100, timestamp: new Date() }
      ];
      jest.spyOn(AnalyticsService as any, 'performAggregation').mockResolvedValueOnce(mockResults);

      const result = await AnalyticsService.executeQuery(validQuery);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
      expect(MockedLogger.info).toHaveBeenCalledWith('Executing analytics query', {
        metrics: validQuery.metrics,
        dateRange: validQuery.dateRange
      });
    });

    it('should return cached query results when available', async () => {
      const cachedResults = [{ metric: 'orders.total', value: 50, timestamp: '2025-08-17T05:41:12.423Z' }];
      MockedCache.get.mockResolvedValueOnce(JSON.stringify(cachedResults));

      const result = await AnalyticsService.executeQuery(validQuery);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedResults);
      expect(MockedCache.setex).not.toHaveBeenCalled();
    });

    it('should cache query results after execution', async () => {
      const mockResults = [{ metric: 'orders.total', value: 100, timestamp: new Date() }];
      jest.spyOn(AnalyticsService as any, 'performAggregation').mockResolvedValueOnce(mockResults);

      await AnalyticsService.executeQuery(validQuery);

      expect(MockedCache.setex).toHaveBeenCalledWith(
        expect.any(String),
        3600,
        JSON.stringify(mockResults)
      );
    });

    it('should handle query execution errors gracefully', async () => {
      const error = new Error('Database connection failed');
      jest.spyOn(AnalyticsService as any, 'performAggregation').mockRejectedValueOnce(error);

      const result = await AnalyticsService.executeQuery(validQuery);

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('Failed to execute query');
      expect(result.error!.code).toBe('QUERY_EXECUTION_FAILED');
      expect(MockedLogger.error).toHaveBeenCalledWith('Failed to execute analytics query', error, { query: validQuery });
    });

    it('should generate proper cache keys for queries', async () => {
      const mockResults = [];
      jest.spyOn(AnalyticsService as any, 'performAggregation').mockResolvedValueOnce(mockResults);

      await AnalyticsService.executeQuery(validQuery);

      const expectedCacheKey = [
        'analytics_query',
        validQuery.metrics.join(','),
        validQuery.dateRange.start.getTime(),
        validQuery.dateRange.end.getTime(),
        validQuery.groupBy || 'none',
        JSON.stringify(validQuery.filters || {}),
        validQuery.limit || 'all',
        validQuery.offset || 0
      ].join(':');

      expect(MockedCache.setex).toHaveBeenCalledWith(
        expectedCacheKey,
        3600,
        JSON.stringify(mockResults)
      );
    });
  });

  describe('Dashboard Generation', () => {
    const dashboardId = 'test_dashboard';
    const userId = 'user123';
    const dateRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    };

    it('should generate dashboard data successfully', async () => {
      const mockKPIs: KPI[] = [{
        id: 'test_kpi',
        name: 'Test KPI',
        description: 'Test description',
        current: 85,
        target: 90,
        percentage: 94.4,
        trend: 'up',
        changeValue: 5,
        changePercentage: 6.25,
        unit: '%',
        format: 'percentage'
      }];

      const mockRevenue: RevenueAnalytics = {
        totalRevenue: 125000,
        recurringRevenue: 95000,
        averageOrderValue: 250,
        revenueGrowthRate: 15.2,
        revenueBySchool: [],
        revenueByPeriod: []
      };

      const mockUserBehavior: UserBehaviorAnalytics = {
        totalUsers: 1250,
        activeUsers: 890,
        newUsers: 45,
        retentionRate: 78.5,
        engagementScore: 8.2,
        mostPopularFeatures: [],
        userJourney: []
      };

      const mockOrderTrends = [
        { date: '2024-01-01', orders: 45, revenue: 11250 }
      ];

      const mockRealtimeMetrics = {
        'orders.total': 100,
        'users.total': 1250
      };

      jest.spyOn(AnalyticsService as any, 'calculateKPIs').mockResolvedValueOnce(mockKPIs);
      jest.spyOn(AnalyticsService as any, 'generateRevenueAnalytics').mockResolvedValueOnce(mockRevenue);
      jest.spyOn(AnalyticsService as any, 'generateUserBehaviorAnalytics').mockResolvedValueOnce(mockUserBehavior);
      jest.spyOn(AnalyticsService as any, 'generateOrderTrends').mockResolvedValueOnce(mockOrderTrends);
      jest.spyOn(AnalyticsService, 'getRealtimeMetrics').mockResolvedValueOnce(mockRealtimeMetrics);

      const result = await AnalyticsService.generateDashboard(dashboardId, userId, dateRange);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(dashboardId);
      expect(result.data.generatedBy).toBe(userId);
      expect(result.data.dateRange).toEqual(dateRange);
      expect(result.data.kpis).toEqual(mockKPIs);
      expect(result.data.revenueAnalytics).toEqual(mockRevenue);
      expect(result.data.userBehavior).toEqual(mockUserBehavior);
      expect(result.data.orderTrends).toEqual(mockOrderTrends);
      expect(result.data.realTimeMetrics).toEqual(mockRealtimeMetrics);
    });

    it('should use default date range when not provided', async () => {
      jest.spyOn(AnalyticsService as any, 'calculateKPIs').mockResolvedValueOnce([]);
      jest.spyOn(AnalyticsService as any, 'generateRevenueAnalytics').mockResolvedValueOnce({} as RevenueAnalytics);
      jest.spyOn(AnalyticsService as any, 'generateUserBehaviorAnalytics').mockResolvedValueOnce({} as UserBehaviorAnalytics);
      jest.spyOn(AnalyticsService as any, 'generateOrderTrends').mockResolvedValueOnce([]);
      jest.spyOn(AnalyticsService, 'getRealtimeMetrics').mockResolvedValueOnce({});

      await AnalyticsService.generateDashboard(dashboardId, userId);

      // Verify that calculateKPIs was called with a date range (30 days ago to now)
      expect(AnalyticsService['calculateKPIs']).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date)
        })
      );
    });

    it('should return cached dashboard data when available', async () => {
      const cachedData = {
        id: dashboardId,
        generatedAt: '2025-08-17T05:41:12.429Z',
        generatedBy: userId,
        dateRange: {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-31T00:00:00.000Z'
        },
        kpis: [],
        revenueAnalytics: {} as RevenueAnalytics,
        userBehavior: {} as UserBehaviorAnalytics,
        orderTrends: [],
        realTimeMetrics: {}
      };

      MockedCache.get.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await AnalyticsService.generateDashboard(dashboardId, userId, dateRange);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedData);
    });

    it('should handle dashboard generation errors gracefully', async () => {
      const error = new Error('KPI calculation failed');
      jest.spyOn(AnalyticsService as any, 'calculateKPIs').mockRejectedValueOnce(error);

      const result = await AnalyticsService.generateDashboard(dashboardId, userId, dateRange);

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('Failed to generate dashboard');
      expect(result.error!.code).toBe('DASHBOARD_GENERATION_FAILED');
      expect(MockedLogger.error).toHaveBeenCalledWith('Failed to generate dashboard', error, { dashboardId, userId });
    });

    it('should cache dashboard data after generation', async () => {
      jest.spyOn(AnalyticsService as any, 'calculateKPIs').mockResolvedValueOnce([]);
      jest.spyOn(AnalyticsService as any, 'generateRevenueAnalytics').mockResolvedValueOnce({} as RevenueAnalytics);
      jest.spyOn(AnalyticsService as any, 'generateUserBehaviorAnalytics').mockResolvedValueOnce({} as UserBehaviorAnalytics);
      jest.spyOn(AnalyticsService as any, 'generateOrderTrends').mockResolvedValueOnce([]);
      jest.spyOn(AnalyticsService, 'getRealtimeMetrics').mockResolvedValueOnce({});

      await AnalyticsService.generateDashboard(dashboardId, userId, dateRange);

      const expectedCacheKey = `dashboard:${dashboardId}:${dateRange.start.getTime()}:${dateRange.end.getTime()}`;
      expect(MockedCache.setex).toHaveBeenCalledWith(
        expectedCacheKey,
        3600,
        expect.any(String)
      );
    });
  });

  describe('Report Generation', () => {
    it('should generate summary report successfully', async () => {
      const mockReportData = [{ summary: 'High-level metrics and trends' }];
      jest.spyOn(AnalyticsService as any, 'generateSummaryReport').mockResolvedValueOnce(mockReportData);

      const result = await AnalyticsService.generateReport('day', 'summary');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.title).toBe('Day summary Report');
      expect(result.data!.type).toBe('scheduled');
      expect(result.data!.period).toBe('day');
      expect(result.data!.data).toEqual(mockReportData);
      expect(result.data!.generatedBy).toBe('system');
    });

    it('should generate detailed report successfully', async () => {
      const mockReportData = [{ detailed: 'Comprehensive metrics breakdown' }];
      jest.spyOn(AnalyticsService as any, 'generateDetailedReport').mockResolvedValueOnce(mockReportData);

      const result = await AnalyticsService.generateReport('week', 'detailed');

      expect(result.success).toBe(true);
      expect(result.data!.title).toBe('Week detailed Report');
      expect(result.data!.data).toEqual(mockReportData);
    });

    it('should generate executive report successfully', async () => {
      const mockReportData = [{ executive: 'Executive summary and insights' }];
      jest.spyOn(AnalyticsService as any, 'generateExecutiveReport').mockResolvedValueOnce(mockReportData);

      const result = await AnalyticsService.generateReport('month', 'executive');

      expect(result.success).toBe(true);
      expect(result.data!.title).toBe('Month executive Report');
      expect(result.data!.data).toEqual(mockReportData);
    });

    it('should use appropriate cache duration for different periods', async () => {
      jest.spyOn(AnalyticsService as any, 'generateSummaryReport').mockResolvedValue([]);

      // Test hourly report (should cache for 1 hour)
      await AnalyticsService.generateReport('hour', 'summary');
      expect(MockedCache.setex).toHaveBeenCalledWith(
        expect.any(String),
        3600,
        expect.any(String)
      );

      jest.clearAllMocks();
      MockedCache.get.mockResolvedValue(null);

      // Test daily report (should cache for 24 hours)
      await AnalyticsService.generateReport('day', 'summary');
      expect(MockedCache.setex).toHaveBeenCalledWith(
        expect.any(String),
        86400,
        expect.any(String)
      );
    });

    it('should return cached report when available', async () => {
      const cachedReport = {
        id: 'day_summary_123',
        title: 'Day summary Report',
        type: 'scheduled',
        period: 'day',
        data: [{ cached: true }]
      };

      MockedCache.get.mockResolvedValueOnce(JSON.stringify(cachedReport));

      const result = await AnalyticsService.generateReport('day', 'summary');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedReport);
    });

    it('should handle report generation errors gracefully', async () => {
      const error = new Error('Report generation failed');
      jest.spyOn(AnalyticsService as any, 'generateSummaryReport').mockRejectedValueOnce(error);

      const result = await AnalyticsService.generateReport('day', 'summary');

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('Failed to generate report');
      expect(result.error!.code).toBe('REPORT_GENERATION_FAILED');
      expect(MockedLogger.error).toHaveBeenCalledWith('Failed to generate report', error, { period: 'day', reportType: 'summary' });
    });
  });

  describe('Cohort Analysis', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    it('should generate cohort analysis successfully', async () => {
      const mockCohorts: CohortAnalysis[] = [{
        cohortId: 'cohort_2024_01',
        cohortDate: new Date('2024-01-01'),
        userCount: 100,
        retentionByPeriod: { '7d': 85, '30d': 72, '90d': 65 },
        lifetimeValue: 1250,
        avgOrderValue: 250
      }];

      jest.spyOn(AnalyticsService as any, 'calculateCohortAnalysis').mockResolvedValueOnce(mockCohorts);

      const result = await AnalyticsService.generateCohortAnalysis(startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCohorts);
    });

    it('should return cached cohort analysis when available', async () => {
      const cachedCohorts: CohortAnalysis[] = [{
        cohortId: 'cached_cohort',
        cohortDate: new Date('2024-01-01T00:00:00.000Z'),
        userCount: 50,
        retentionByPeriod: { '7d': 80 },
        lifetimeValue: 1000,
        avgOrderValue: 200
      }];

      MockedCache.get.mockResolvedValueOnce(JSON.stringify(cachedCohorts));

      const result = await AnalyticsService.generateCohortAnalysis(startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedCohorts);
    });

    it('should cache cohort analysis for 24 hours', async () => {
      const mockCohorts: CohortAnalysis[] = [];
      jest.spyOn(AnalyticsService as any, 'calculateCohortAnalysis').mockResolvedValueOnce(mockCohorts);

      await AnalyticsService.generateCohortAnalysis(startDate, endDate);

      const expectedCacheKey = `cohort:${startDate.getTime()}:${endDate.getTime()}`;
      expect(MockedCache.setex).toHaveBeenCalledWith(
        expectedCacheKey,
        86400,
        JSON.stringify(mockCohorts)
      );
    });

    it('should handle cohort analysis errors gracefully', async () => {
      const error = new Error('Cohort calculation failed');
      jest.spyOn(AnalyticsService as any, 'calculateCohortAnalysis').mockRejectedValueOnce(error);

      const result = await AnalyticsService.generateCohortAnalysis(startDate, endDate);

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('Failed to generate cohort analysis');
      expect(result.error!.code).toBe('COHORT_ANALYSIS_FAILED');
      expect(MockedLogger.error).toHaveBeenCalledWith('Failed to generate cohort analysis', error, { startDate, endDate });
    });
  });

  describe('Predictive Analytics', () => {
    it('should generate predictive analytics successfully', async () => {
      const mockPredictions: PredictiveAnalytics = {
        orderPrediction: {
          nextWeek: 350,
          nextMonth: 1400,
          confidence: 0.85
        },
        revenueForecast: {
          nextQuarter: 125000,
          nextYear: 500000,
          confidence: 0.78
        },
        churnPrediction: {
          riskUsers: [{
            userId: 'user123',
            churnProbability: 0.75,
            factors: ['low_engagement', 'payment_failures']
          }]
        },
        demandForecast: [{
          menuItemId: 'item123',
          predictedDemand: 120,
          confidence: 0.82
        }]
      };

      jest.spyOn(AnalyticsService as any, 'calculatePredictiveAnalytics').mockResolvedValueOnce(mockPredictions);

      const result = await AnalyticsService.generatePredictiveAnalytics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPredictions);
    });

    it('should return cached predictions when available', async () => {
      const cachedPredictions: PredictiveAnalytics = {
        orderPrediction: { nextWeek: 300, nextMonth: 1200, confidence: 0.8 },
        revenueForecast: { nextQuarter: 100000, nextYear: 400000, confidence: 0.75 },
        churnPrediction: { riskUsers: [] },
        demandForecast: []
      };

      MockedCache.get.mockResolvedValueOnce(JSON.stringify(cachedPredictions));

      const result = await AnalyticsService.generatePredictiveAnalytics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedPredictions);
    });

    it('should cache predictions for 6 hours', async () => {
      const mockPredictions: PredictiveAnalytics = {
        orderPrediction: { nextWeek: 350, nextMonth: 1400, confidence: 0.85 },
        revenueForecast: { nextQuarter: 125000, nextYear: 500000, confidence: 0.78 },
        churnPrediction: { riskUsers: [] },
        demandForecast: []
      };

      jest.spyOn(AnalyticsService as any, 'calculatePredictiveAnalytics').mockResolvedValueOnce(mockPredictions);

      await AnalyticsService.generatePredictiveAnalytics();

      expect(MockedCache.setex).toHaveBeenCalledWith(
        'predictive_analytics',
        21600,
        JSON.stringify(mockPredictions)
      );
    });

    it('should handle prediction errors gracefully', async () => {
      const error = new Error('Prediction calculation failed');
      jest.spyOn(AnalyticsService as any, 'calculatePredictiveAnalytics').mockRejectedValueOnce(error);

      const result = await AnalyticsService.generatePredictiveAnalytics();

      expect(result.success).toBe(false);
      expect(result.error!.message).toBe('Failed to generate predictions');
      expect(result.error!.code).toBe('PREDICTION_FAILED');
      expect(MockedLogger.error).toHaveBeenCalledWith('Failed to generate predictive analytics', error);
    });
  });

  describe('Real-time Metrics', () => {
    it('should get real-time metrics successfully', async () => {
      const mockMetrics = {
        'orders.total': '150',
        'users.total': '1500',
        'payments.success_rate': '98.5',
        'system.response_time': '120',
        'system.concurrent_users': '45'
      };

      MockedCache.get
        .mockResolvedValueOnce(mockMetrics['orders.total'])
        .mockResolvedValueOnce(mockMetrics['users.total'])
        .mockResolvedValueOnce(mockMetrics['payments.success_rate'])
        .mockResolvedValueOnce(mockMetrics['system.response_time'])
        .mockResolvedValueOnce(mockMetrics['system.concurrent_users']);

      const result = await AnalyticsService.getRealtimeMetrics();

      expect(result).toEqual({
        'orders.total': 150,
        'users.total': 1500,
        'payments.success_rate': 98.5,
        'system.response_time': 120,
        'system.concurrent_users': 45
      });
    });

    it('should handle missing metrics gracefully', async () => {
      MockedCache.get.mockResolvedValue(null);

      const result = await AnalyticsService.getRealtimeMetrics();

      expect(result).toEqual({
        'orders.total': null,
        'users.total': null,
        'payments.success_rate': null,
        'system.response_time': null,
        'system.concurrent_users': null
      });
    });

    it('should handle cache errors gracefully', async () => {
      const error = new Error('Cache connection failed');
      MockedCache.get.mockRejectedValue(error);

      const result = await AnalyticsService.getRealtimeMetrics();

      expect(result).toEqual({});
      expect(MockedLogger.error).toHaveBeenCalledWith('Failed to get realtime metrics', error);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined values in metric tracking', async () => {
      const result = await AnalyticsService.trackMetric('orders.total', 0, {}, null as any);

      expect(result.success).toBe(true);
      expect(result.data!.value).toBe(0);
      expect(result.data!.metadata).toBeNull();
    });

    it('should handle very large metric values', async () => {
      const largeValue = Number.MAX_SAFE_INTEGER;
      const result = await AnalyticsService.trackMetric('orders.total', largeValue);

      expect(result.success).toBe(true);
      expect(result.data!.value).toBe(largeValue);
    });

    it('should handle negative metric values', async () => {
      const negativeValue = -100;
      const result = await AnalyticsService.trackMetric('orders.total', negativeValue);

      expect(result.success).toBe(true);
      expect(result.data!.value).toBe(negativeValue);
    });

    it('should handle empty analytics queries', async () => {
      const emptyQuery: AnalyticsQuery = {
        metrics: [],
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };

      jest.spyOn(AnalyticsService as any, 'performAggregation').mockResolvedValueOnce([]);

      const result = await AnalyticsService.executeQuery(emptyQuery);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle invalid date ranges in queries', async () => {
      const invalidQuery: AnalyticsQuery = {
        metrics: ['orders.total'],
        dateRange: {
          start: new Date('2024-01-31'),
          end: new Date('2024-01-01') // End before start
        }
      };

      jest.spyOn(AnalyticsService as any, 'performAggregation').mockResolvedValueOnce([]);

      const result = await AnalyticsService.executeQuery(invalidQuery);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle concurrent metric tracking', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        AnalyticsService.trackMetric('orders.total', i)
      );

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data!.value).toBe(index);
      });
    });

    it('should handle cache failures gracefully', async () => {
      // Test case: Cache write failure causes method to fail (current implementation behavior)
      MockedCache.get.mockResolvedValueOnce(null); // Cache miss
      const cacheError = new Error('Redis connection failed');
      MockedCache.setex.mockRejectedValueOnce(cacheError); // Cache write fails

      jest.spyOn(AnalyticsService as any, 'performAggregation').mockResolvedValueOnce([]);

      const query: AnalyticsQuery = {
        metrics: ['orders.total'],
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };

      // Current implementation: cache write failure causes method to fail
      const result = await AnalyticsService.executeQuery(query);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('QUERY_EXECUTION_FAILED');
    });
  });
});