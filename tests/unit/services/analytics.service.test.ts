/**
 * AnalyticsService — tests aligned with orchestrator + submodule behavior.
 */

jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../src/utils/cache', () => ({
  cache: {
    get: jest.fn(),
    setex: jest.fn(),
  },
}));

jest.mock('../../../src/database/DatabaseManager', () => {
  const mockPrisma = {
    order: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: 0 } }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    school: { findMany: jest.fn().mockResolvedValue([]) },
    authSession: { count: jest.fn().mockResolvedValue(0) },
    payment: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }) },
    analyticsMetric: {
      create: jest.fn().mockResolvedValue({ id: 'm1' }),
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _avg: { value: 0 } }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    user: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
  (globalThis as { __analyticsPrismaMock?: typeof mockPrisma }).__analyticsPrismaMock = mockPrisma;
  return {
    prisma: mockPrisma,
    DatabaseManager: {
      getInstance: () => ({
        getClient: () => mockPrisma,
      }),
    },
  };
});

import { AnalyticsService } from '../../../src/services/analytics.service';
import { logger } from '../../../src/utils/logger';
import { cache } from '../../../src/utils/cache';

const MockedLogger = logger as jest.Mocked<typeof logger>;
const MockedCache = cache as jest.Mocked<typeof cache>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockedCache.get.mockResolvedValue(null);
    MockedCache.setex.mockResolvedValue(undefined);
  });

  it('initialize delegates to metric tracking', async () => {
    await expect(AnalyticsService.initialize()).resolves.toBeUndefined();
    expect(MockedLogger.info).toHaveBeenCalledWith('Metric tracking service initialized');
  });

  it('trackMetric returns success when logging path succeeds', async () => {
    const result = await AnalyticsService.trackMetric('orders.total', 42, { school: 's1' });
    expect(result.success).toBe(true);
  });

  it('executeQuery returns empty successful payload', async () => {
    const result = await AnalyticsService.executeQuery({
      metrics: ['orders'],
      dimensions: [],
      filters: {},
      dateRange: { start: new Date(), end: new Date() },
    } as never);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('getRealtimeMetrics returns default shape', async () => {
    const m = await AnalyticsService.getRealtimeMetrics();
    expect(m).toMatchObject({
      activeUsers: 0,
      ordersInProgress: 0,
      revenue24h: 0,
      avgResponseTime: 0,
    });
  });

  it('generateDashboard caches and returns dashboard payload', async () => {
    const result = await AnalyticsService.generateDashboard('dash-1', 'user-1');
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('dash-1');
    expect(Array.isArray(result.data?.kpis)).toBe(true);
    expect(MockedCache.setex).toHaveBeenCalled();
  });

  it('generateReport builds a report and caches it', async () => {
    const result = await AnalyticsService.generateReport('day', 'summary');
    expect(result.success).toBe(true);
    expect(result.data?.period).toBe('day');
    expect(MockedCache.setex).toHaveBeenCalled();
  });

  it('generateCohortAnalysis succeeds with empty cohort data', async () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');
    const result = await AnalyticsService.generateCohortAnalysis(start, end);
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('generatePredictiveAnalytics succeeds', async () => {
    const result = await AnalyticsService.generatePredictiveAnalytics();
    expect(result.success).toBe(true);
    expect(result.data?.orderPrediction).toBeDefined();
  });
});
