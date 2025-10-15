/**
 * Performance Service
 * Monitors and tracks application performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  metrics: PerformanceMetric[];
  summary: {
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    totalRequests: number;
    errorRate: number;
  };
}

export class PerformanceService {
  private static instance: PerformanceService;
  private static metrics: PerformanceMetric[] = [];
  private static startTimes: Map<string, number> = new Map();
  private static isMonitoringActive: boolean = false;
  private static benchmarks: any[] = [];

  private constructor() {}

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Start tracking an operation
   */
  public startTracking(operationId: string): void {
    PerformanceService.startTimes.set(operationId, Date.now());
  }

  /**
   * End tracking and record metric
   */
  public endTracking(operationId: string, tags?: Record<string, string>): number {
    const startTime = PerformanceService.startTimes.get(operationId);
    if (!startTime) {
      throw new Error(`No start time found for operation: ${operationId}`);
    }

    const duration = Date.now() - startTime;
    PerformanceService.startTimes.delete(operationId);

    this.recordMetric({
      name: operationId,
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      tags,
    });

    return duration;
  }

  /**
   * Record a performance metric
   */
  public recordMetric(metric: PerformanceMetric): void {
    PerformanceService.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory issues
    if (PerformanceService.metrics.length > 1000) {
      PerformanceService.metrics.shift();
    }
  }

  /**
   * Get metrics for a specific operation
   */
  public getMetrics(operationName: string, limit?: number): PerformanceMetric[] {
    const filtered = PerformanceService.metrics.filter(
      (m: PerformanceMetric) => m.name === operationName
    );
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get average performance for an operation
   */
  public getAverage(operationName: string): number {
    const metrics = this.getMetrics(operationName);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get performance percentile
   */
  public getPercentile(operationName: string, percentile: number): number {
    const metrics = this.getMetrics(operationName);
    if (metrics.length === 0) return 0;

    const sorted = metrics.map(m => m.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Generate performance report
   */
  public generateReport(startDate: Date, endDate: Date): PerformanceReport {
    const filtered = PerformanceService.metrics.filter(
      (m: PerformanceMetric) => m.timestamp >= startDate && m.timestamp <= endDate
    );

    const responseTimes = filtered.filter(m => m.unit === 'ms').map(m => m.value);
    const totalRequests = filtered.filter(m => m.name.includes('request')).length;
    const errors = filtered.filter(m => m.name.includes('error')).length;

    return {
      period: { start: startDate, end: endDate },
      metrics: filtered,
      summary: {
        avgResponseTime:
          responseTimes.length > 0
            ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length
            : 0,
        maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
        minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
        totalRequests,
        errorRate: totalRequests > 0 ? (errors / totalRequests) * 100 : 0,
      },
    };
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    PerformanceService.metrics = [];
    PerformanceService.startTimes.clear();
  }

  /**
   * Get memory usage
   */
  public getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  } {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
    };
  }

  /**
   * Record custom metric
   */
  public recordCustomMetric(
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' | 'percent' = 'count',
    tags?: Record<string, string>
  ): void {
    this.recordMetric({
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    });
  }

  /**
   * Start monitoring
   */
  public static startMonitoring(): void {
    PerformanceService.isMonitoringActive = true;
  }

  /**
   * Stop monitoring
   */
  public static stopMonitoring(): void {
    PerformanceService.isMonitoringActive = false;
  }

  /**
   * Check if monitoring is active
   */
  public static isMonitoring(): boolean {
    return PerformanceService.isMonitoringActive;
  }

  /**
   * Record a request metric
   */
  public static async recordRequest(
    endpoint: string,
    responseTime: number,
    statusCode: number
  ): Promise<void> {
    PerformanceService.getInstance().recordMetric({
      name: `request:${endpoint}`,
      value: responseTime,
      unit: 'ms',
      timestamp: new Date(),
      tags: { statusCode: statusCode.toString(), endpoint },
    });
  }

  /**
   * Collect all metrics
   */
  public static async collectMetrics(): Promise<PerformanceMetric[]> {
    return [...PerformanceService.metrics];
  }

  /**
   * Get performance trends
   */
  public static async getPerformanceTrends(
    metricName: string,
    timeRange: { start: Date; end: Date }
  ): Promise<any> {
    const filtered = PerformanceService.metrics.filter(
      (m: PerformanceMetric) =>
        m.name === metricName && m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );

    if (filtered.length === 0) {
      return { trend: 'stable', data: [] };
    }

    const sorted = filtered.sort(
      (a: PerformanceMetric, b: PerformanceMetric) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const values = sorted.map((m: PerformanceMetric) => m.value);

    // Simple trend analysis
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length;

    let trend: string;
    if (secondAvg > firstAvg * 1.1) trend = 'increasing';
    else if (secondAvg < firstAvg * 0.9) trend = 'decreasing';
    else trend = 'stable';

    return {
      trend,
      data: sorted,
      average: values.reduce((a: number, b: number) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  /**
   * Get health status
   */
  public static async getHealthStatus(): Promise<any> {
    const memory = PerformanceService.getInstance().getMemoryUsage();
    const recentMetrics = PerformanceService.metrics.filter(
      (m: PerformanceMetric) => Date.now() - m.timestamp.getTime() < 300000
    ); // Last 5 minutes
    const errorRate =
      (recentMetrics.filter((m: PerformanceMetric) => m.name.includes('error')).length /
        Math.max(recentMetrics.length, 1)) *
      100;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (errorRate > 5) status = 'critical';
    else if (errorRate > 1) status = 'warning';

    return {
      status,
      memory,
      errorRate,
      totalMetrics: PerformanceService.metrics.length,
      monitoringActive: PerformanceService.isMonitoringActive,
      uptime: process.uptime(),
    };
  }

  /**
   * Get aggregated metrics
   */
  public static async getAggregatedMetrics(timeRange: string): Promise<any> {
    const now = Date.now();
    let startTime: number;

    switch (timeRange) {
      case '1h':
        startTime = now - 3600000;
        break;
      case '24h':
        startTime = now - 86400000;
        break;
      case '7d':
        startTime = now - 604800000;
        break;
      default:
        startTime = now - 3600000;
    }

    const filtered = PerformanceService.metrics.filter(
      (m: PerformanceMetric) => m.timestamp.getTime() >= startTime
    );

    const aggregated: Record<string, any> = {};
    filtered.forEach((metric: PerformanceMetric) => {
      if (!aggregated[metric.name]) {
        aggregated[metric.name] = {
          name: metric.name,
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0,
        };
      }

      aggregated[metric.name].count++;
      aggregated[metric.name].sum += metric.value;
      aggregated[metric.name].min = Math.min(aggregated[metric.name].min, metric.value);
      aggregated[metric.name].max = Math.max(aggregated[metric.name].max, metric.value);
      aggregated[metric.name].avg = aggregated[metric.name].sum / aggregated[metric.name].count;
    });

    return Object.values(aggregated);
  }

  /**
   * Set benchmark
   */
  public static async setBenchmark(benchmark: any): Promise<void> {
    PerformanceService.benchmarks.push({
      ...benchmark,
      id: Date.now().toString(),
      createdAt: new Date(),
    });
  }

  /**
   * Get benchmarks
   */
  public static async getBenchmarks(): Promise<any[]> {
    return [...PerformanceService.benchmarks];
  }

  /**
   * Check benchmark compliance
   */
  public static checkBenchmarkCompliance(benchmark: any): boolean {
    const recentMetrics = PerformanceService.metrics.filter(
      (m: PerformanceMetric) =>
        m.name === benchmark.metricName &&
        Date.now() - m.timestamp.getTime() < (benchmark.timeWindow || 3600000)
    );

    if (recentMetrics.length === 0) return false;

    const avgValue =
      recentMetrics.reduce((sum: number, m: PerformanceMetric) => sum + m.value, 0) /
      recentMetrics.length;

    switch (benchmark.condition) {
      case 'lessThan':
        return avgValue < benchmark.threshold;
      case 'greaterThan':
        return avgValue > benchmark.threshold;
      case 'equals':
        return Math.abs(avgValue - benchmark.threshold) < 0.01;
      default:
        return false;
    }
  }
}

// Export singleton instance
export const performanceService = PerformanceService.getInstance();

// Export for direct access
export default PerformanceService;
