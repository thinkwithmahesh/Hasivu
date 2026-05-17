/**
 * PerformanceService — aligned with in-memory implementation (no Redis/DB in service).
 */

import PerformanceService from '../../../src/services/performance.service';

describe('PerformanceService', () => {
  beforeEach(() => {
    PerformanceService.resetStateForTests();
  });

  afterEach(() => {
    PerformanceService.resetStateForTests();
  });

  it('getInstance returns singleton', () => {
    const a = PerformanceService.getInstance();
    const b = PerformanceService.getInstance();
    expect(a).toBe(b);
  });

  it('startTracking and endTracking record duration', () => {
    const svc = PerformanceService.getInstance();
    svc.startTracking('op1');
    const ms = svc.endTracking('op1', { route: '/x' });
    expect(ms).toBeGreaterThanOrEqual(0);
    expect(svc.getMetrics('op1').length).toBe(1);
    expect(svc.getAverage('op1')).toBe(ms);
  });

  it('endTracking throws when operation was not started', () => {
    const svc = PerformanceService.getInstance();
    expect(() => svc.endTracking('missing')).toThrow('No start time found');
  });

  it('clearMetrics removes stored metrics', () => {
    const svc = PerformanceService.getInstance();
    svc.recordMetric({
      name: 'm1',
      value: 1,
      unit: 'count',
      timestamp: new Date(),
    });
    expect(svc.getMetrics('m1').length).toBe(1);
    svc.clearMetrics();
    expect(svc.getMetrics('m1').length).toBe(0);
  });

  it('getPercentile returns sorted value', () => {
    const svc = PerformanceService.getInstance();
    [10, 30, 20].forEach((v, i) =>
      svc.recordMetric({ name: 'p', value: v, unit: 'ms', timestamp: new Date(Date.now() + i) })
    );
    expect(svc.getPercentile('p', 50)).toBe(20);
  });

  it('generateReport summarizes request and error metrics', () => {
    const svc = PerformanceService.getInstance();
    const t0 = new Date('2026-01-01T00:00:00Z');
    const t1 = new Date('2026-01-02T00:00:00Z');
    svc.recordMetric({
      name: 'request:/api',
      value: 100,
      unit: 'ms',
      timestamp: new Date('2026-01-01T12:00:00Z'),
    });
    svc.recordMetric({
      name: 'error:/api',
      value: 1,
      unit: 'count',
      timestamp: new Date('2026-01-01T12:01:00Z'),
    });
    const report = svc.generateReport(t0, t1);
    expect(report.metrics.length).toBe(2);
    expect(report.summary.totalRequests).toBe(1);
    expect(report.summary.avgResponseTime).toBe(100);
  });

  it('getMemoryUsage returns MB-shaped numbers', () => {
    const svc = PerformanceService.getInstance();
    const m = svc.getMemoryUsage();
    expect(m.heapUsed).toBeGreaterThan(0);
    expect(m.rss).toBeGreaterThan(0);
  });

  it('startMonitoring and stopMonitoring toggle flag', () => {
    PerformanceService.startMonitoring();
    expect(PerformanceService.isMonitoring()).toBe(true);
    PerformanceService.stopMonitoring();
    expect(PerformanceService.isMonitoring()).toBe(false);
  });

  it('recordRequest stores a metric', async () => {
    await PerformanceService.recordRequest('/orders', 42, 200);
    const svc = PerformanceService.getInstance();
    expect(svc.getMetrics('request:/orders').length).toBe(1);
  });

  it('collectMetrics returns snapshot of metrics', async () => {
    PerformanceService.getInstance().recordMetric({
      name: 'x',
      value: 1,
      unit: 'count',
      timestamp: new Date(),
    });
    const all = await PerformanceService.collectMetrics();
    expect(all.some(m => m.name === 'x')).toBe(true);
  });

  it('getPerformanceTrends returns stable when no data', async () => {
    const out = await PerformanceService.getPerformanceTrends('none', {
      start: new Date(0),
      end: new Date(),
    });
    expect(out.trend).toBe('stable');
    expect(out.data).toEqual([]);
  });

  it('getHealthStatus includes memory and uptime', async () => {
    const h = await PerformanceService.getHealthStatus();
    expect(h.status).toMatch(/healthy|warning|critical/);
    expect(h.memory).toBeDefined();
    expect(typeof h.uptime).toBe('number');
  });

  it('getAggregatedMetrics groups by name', async () => {
    const svc = PerformanceService.getInstance();
    svc.recordMetric({ name: 'a', value: 10, unit: 'ms', timestamp: new Date() });
    svc.recordMetric({ name: 'a', value: 20, unit: 'ms', timestamp: new Date() });
    const agg = await PerformanceService.getAggregatedMetrics('1h');
    const a = agg.find((x: { name: string }) => x.name === 'a');
    expect(a.count).toBe(2);
    expect(a.sum).toBe(30);
  });

  it('setBenchmark and getBenchmarks round-trip', async () => {
    await PerformanceService.setBenchmark({ metricName: 'cpu', threshold: 50, condition: 'lessThan' });
    const list = await PerformanceService.getBenchmarks();
    expect(list.length).toBe(1);
    expect(list[0].metricName).toBe('cpu');
  });

  it('checkBenchmarkCompliance evaluates recent metrics', async () => {
    const svc = PerformanceService.getInstance();
    svc.recordMetric({ name: 'lat', value: 10, unit: 'ms', timestamp: new Date() });
    svc.recordMetric({ name: 'lat', value: 20, unit: 'ms', timestamp: new Date() });
    const ok = PerformanceService.checkBenchmarkCompliance({
      metricName: 'lat',
      threshold: 25,
      condition: 'lessThan',
      timeWindow: 3600000,
    });
    expect(ok).toBe(true);
  });
});
