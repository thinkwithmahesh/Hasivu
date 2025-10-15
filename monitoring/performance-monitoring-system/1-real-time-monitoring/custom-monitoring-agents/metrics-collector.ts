/**
 * HASIVU Custom Metrics Collector
 * Epic 3 → Story 3: Performance Monitoring System
 *
 * Advanced metrics collection engine with multi-tenant isolation,
 * Kubernetes-native monitoring, and intelligent data aggregation
 * for 500+ school environments.
 */

import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Summary } from 'prom-client';

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  labels?: string[];
  buckets?: number[]; // For histograms
  percentiles?: number[]; // For summaries
  maxAgeSeconds?: number; // For summaries
  ageBuckets?: number; // For summaries
}

export interface MetricValue {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

export interface CustomMetric {
  id: string;
  schoolId: string;
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
  metadata: {
    source: string;
    component: string;
    environment: string;
    version: string;
  };
}

export interface MetricAggregation {
  metric: string;
  timeWindow: string;
  aggregationType: 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT' | 'P50' | 'P95' | 'P99';
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  duration: string; // e.g., '5m', '1h'
  labels?: Record<string, string>;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  annotations: Record<string, string>;
  enabled: boolean;
}

export interface MetricQuery {
  query: string;
  start?: Date;
  end?: Date;
  step?: string;
  labels?: Record<string, string>;
}

export interface QueryResult {
  metric: Record<string, string>;
  values: Array<[number, string]>; // [timestamp, value]
}

export class MetricsCollector extends EventEmitter {
  private readonly logger: Logger;
  private readonly metrics: Map<string, any> = new Map();
  private readonly customMetrics: Map<string, CustomMetric[]> = new Map();
  private readonly alertRules: Map<string, AlertRule[]> = new Map();
  private readonly aggregations: Map<string, MetricAggregation[]> = new Map();
  private readonly collectionInterval: number = 15000; // 15 seconds
  private readonly retentionPeriod: number = 90 * 24 * 60 * 60 * 1000; // 90 days
  private collectionTimer?: NodeJS.Timeout;

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    this.initializeDefaultMetrics();
    this.startCollection();
  }

  /**
   * Initialize default Prometheus metrics collection
   */
  private initializeDefaultMetrics(): void {
    // Collect default Node.js metrics
    collectDefaultMetrics({
      register,
      prefix: 'hasivu_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
      eventLoopMonitoringPrecision: 5,
    });

    // Define HASIVU-specific metrics
    this.defineMetric({
      name: 'hasivu_requests_total',
      type: 'counter',
      help: 'Total number of HTTP requests',
      labels: ['method', 'route', 'status_code', 'school_id'],
    });

    this.defineMetric({
      name: 'hasivu_request_duration_seconds',
      type: 'histogram',
      help: 'HTTP request duration in seconds',
      labels: ['method', 'route', 'school_id'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    });

    this.defineMetric({
      name: 'hasivu_database_connections',
      type: 'gauge',
      help: 'Current number of database connections',
      labels: ['database', 'school_id', 'pool'],
    });

    this.defineMetric({
      name: 'hasivu_database_query_duration_seconds',
      type: 'histogram',
      help: 'Database query duration in seconds',
      labels: ['operation', 'table', 'school_id'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    this.defineMetric({
      name: 'hasivu_cache_operations_total',
      type: 'counter',
      help: 'Total cache operations',
      labels: ['operation', 'result', 'school_id'],
    });

    this.defineMetric({
      name: 'hasivu_queue_size',
      type: 'gauge',
      help: 'Current queue size',
      labels: ['queue_name', 'school_id'],
    });

    this.defineMetric({
      name: 'hasivu_active_users',
      type: 'gauge',
      help: 'Current number of active users',
      labels: ['school_id', 'user_type'],
    });

    this.defineMetric({
      name: 'hasivu_business_operations_total',
      type: 'counter',
      help: 'Total business operations',
      labels: ['operation_type', 'school_id', 'status'],
    });

    this.defineMetric({
      name: 'hasivu_error_rate',
      type: 'gauge',
      help: 'Current error rate percentage',
      labels: ['component', 'school_id', 'error_type'],
    });

    this.defineMetric({
      name: 'hasivu_resource_utilization',
      type: 'gauge',
      help: 'Resource utilization percentage',
      labels: ['resource_type', 'school_id', 'component'],
    });

    this.logger.info('Default metrics initialized');
  }

  /**
   * Define a custom metric
   */
  defineMetric(definition: MetricDefinition): void {
    if (this.metrics.has(definition.name)) {
      this.logger.warn(`Metric ${definition.name} already exists`);
      return;
    }

    let metric;

    switch (definition.type) {
      case 'counter':
        metric = new Counter({
          name: definition.name,
          help: definition.help,
          labelNames: definition.labels || [],
          registers: [register],
        });
        break;

      case 'gauge':
        metric = new Gauge({
          name: definition.name,
          help: definition.help,
          labelNames: definition.labels || [],
          registers: [register],
        });
        break;

      case 'histogram':
        metric = new Histogram({
          name: definition.name,
          help: definition.help,
          labelNames: definition.labels || [],
          buckets: definition.buckets || [0.1, 0.5, 1, 2, 5, 10],
          registers: [register],
        });
        break;

      case 'summary':
        metric = new Summary({
          name: definition.name,
          help: definition.help,
          labelNames: definition.labels || [],
          percentiles: definition.percentiles || [0.5, 0.9, 0.95, 0.99],
          maxAgeSeconds: definition.maxAgeSeconds || 300,
          ageBuckets: definition.ageBuckets || 5,
          registers: [register],
        });
        break;

      default:
        throw new Error(`Unsupported metric type: ${definition.type}`);
    }

    this.metrics.set(definition.name, metric);

    this.logger.info('Metric defined', {
      name: definition.name,
      type: definition.type,
      labels: definition.labels,
    });
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels?: Record<string, string>, value: number = 1): void {
    const metric = this.metrics.get(name);
    if (!metric || typeof metric.inc !== 'function') {
      this.logger.error(`Counter metric not found: ${name}`);
      return;
    }

    if (labels) {
      metric.labels(labels).inc(value);
    } else {
      metric.inc(value);
    }

    this.recordCustomMetric(name, value, labels, 'counter');
  }

  /**
   * Set a gauge metric value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric || typeof metric.set !== 'function') {
      this.logger.error(`Gauge metric not found: ${name}`);
      return;
    }

    if (labels) {
      metric.labels(labels).set(value);
    } else {
      metric.set(value);
    }

    this.recordCustomMetric(name, value, labels, 'gauge');
  }

  /**
   * Increment a gauge metric
   */
  incrementGauge(name: string, labels?: Record<string, string>, value: number = 1): void {
    const metric = this.metrics.get(name);
    if (!metric || typeof metric.inc !== 'function') {
      this.logger.error(`Gauge metric not found: ${name}`);
      return;
    }

    if (labels) {
      metric.labels(labels).inc(value);
    } else {
      metric.inc(value);
    }

    this.recordCustomMetric(name, value, labels, 'gauge');
  }

  /**
   * Decrement a gauge metric
   */
  decrementGauge(name: string, labels?: Record<string, string>, value: number = 1): void {
    const metric = this.metrics.get(name);
    if (!metric || typeof metric.dec !== 'function') {
      this.logger.error(`Gauge metric not found: ${name}`);
      return;
    }

    if (labels) {
      metric.labels(labels).dec(value);
    } else {
      metric.dec(value);
    }

    this.recordCustomMetric(name, -value, labels, 'gauge');
  }

  /**
   * Observe a histogram metric
   */
  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric || typeof metric.observe !== 'function') {
      this.logger.error(`Histogram metric not found: ${name}`);
      return;
    }

    if (labels) {
      metric.labels(labels).observe(value);
    } else {
      metric.observe(value);
    }

    this.recordCustomMetric(name, value, labels, 'histogram');
  }

  /**
   * Observe a summary metric
   */
  observeSummary(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric || typeof metric.observe !== 'function') {
      this.logger.error(`Summary metric not found: ${name}`);
      return;
    }

    if (labels) {
      metric.labels(labels).observe(value);
    } else {
      metric.observe(value);
    }

    this.recordCustomMetric(name, value, labels, 'summary');
  }

  /**
   * Record a custom metric with tenant isolation
   */
  private recordCustomMetric(
    name: string,
    value: number,
    labels?: Record<string, string>,
    type?: string
  ): void {
    const schoolId = labels?.school_id || 'global';

    const customMetric: CustomMetric = {
      id: `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      schoolId,
      name,
      value,
      labels: labels || {},
      timestamp: new Date(),
      metadata: {
        source: 'metrics-collector',
        component: 'monitoring-system',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
      },
    };

    if (!this.customMetrics.has(schoolId)) {
      this.customMetrics.set(schoolId, []);
    }
    this.customMetrics.get(schoolId)!.push(customMetric);

    // Emit for real-time processing
    this.emit('metricRecorded', customMetric);

    // Clean up old metrics
    this.cleanupOldMetrics(schoolId);
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Query metrics with time range and aggregation
   */
  async queryMetrics(query: MetricQuery): Promise<QueryResult[]> {
    const results: QueryResult[] = [];

    // Parse the query and extract metric name
    const metricName = this.parseMetricName(query.query);

    // Get metrics for all schools or specific school
    const schoolId = query.labels?.school_id;
    const metricsToSearch = schoolId
      ? this.customMetrics.get(schoolId) || []
      : Array.from(this.customMetrics.values()).flat();

    // Filter by metric name and time range
    const filteredMetrics = metricsToSearch.filter(metric => {
      const nameMatch = metric.name === metricName;
      const timeMatch = this.isWithinTimeRange(metric.timestamp, query.start, query.end);
      const labelsMatch = this.matchesLabels(metric.labels, query.labels);

      return nameMatch && timeMatch && labelsMatch;
    });

    // Group by label combinations
    const groupedMetrics = this.groupMetricsByLabels(filteredMetrics);

    // Convert to QueryResult format
    for (const [labelKey, metrics] of groupedMetrics) {
      const values: Array<[number, string]> = metrics.map(metric => [
        metric.timestamp.getTime() / 1000, // Convert to seconds
        metric.value.toString(),
      ]);

      results.push({
        metric: this.parseLabels(labelKey),
        values,
      });
    }

    return results;
  }

  /**
   * Add alert rule for metric monitoring
   */
  addAlertRule(schoolId: string, rule: Omit<AlertRule, 'id'>): string {
    const alertRule: AlertRule = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...rule,
    };

    if (!this.alertRules.has(schoolId)) {
      this.alertRules.set(schoolId, []);
    }
    this.alertRules.get(schoolId)!.push(alertRule);

    this.logger.info('Alert rule added', {
      ruleId: alertRule.id,
      schoolId,
      metric: rule.metric,
      threshold: rule.threshold,
    });

    return alertRule.id;
  }

  /**
   * Check alert rules and trigger alerts
   */
  private async checkAlertRules(): Promise<void> {
    for (const [schoolId, rules] of this.alertRules) {
      for (const rule of rules) {
        if (!rule.enabled) continue;

        try {
          const isAlertTriggered = await this.evaluateAlertRule(schoolId, rule);

          if (isAlertTriggered) {
            this.emit('alertTriggered', {
              schoolId,
              rule,
              timestamp: new Date(),
            });
          }
        } catch (error) {
          this.logger.error('Error evaluating alert rule', {
            ruleId: rule.id,
            error: error.message,
          });
        }
      }
    }
  }

  /**
   * Evaluate alert rule against current metrics
   */
  private async evaluateAlertRule(schoolId: string, rule: AlertRule): Promise<boolean> {
    const queryResult = await this.queryMetrics({
      query: rule.metric,
      start: new Date(Date.now() - this.parseDuration(rule.duration)),
      end: new Date(),
      labels: { school_id: schoolId, ...rule.labels },
    });

    if (queryResult.length === 0) return false;

    // Get the latest value
    const latestResult = queryResult[0];
    if (latestResult.values.length === 0) return false;

    const latestValue = parseFloat(latestResult.values[latestResult.values.length - 1][1]);

    // Evaluate condition
    switch (rule.operator) {
      case '>':
        return latestValue > rule.threshold;
      case '<':
        return latestValue < rule.threshold;
      case '>=':
        return latestValue >= rule.threshold;
      case '<=':
        return latestValue <= rule.threshold;
      case '==':
        return latestValue === rule.threshold;
      case '!=':
        return latestValue !== rule.threshold;
      default:
        return false;
    }
  }

  /**
   * Start metrics collection
   */
  private startCollection(): void {
    this.collectionTimer = setInterval(async () => {
      await this.collectSystemMetrics();
      await this.collectBusinessMetrics();
      await this.checkAlertRules();
      await this.performAggregations();
    }, this.collectionInterval);

    this.logger.info('Metrics collection started', {
      interval: this.collectionInterval,
    });
  }

  /**
   * Collect system-level metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      this.setGauge('hasivu_memory_usage_bytes', memUsage.rss, { type: 'rss' });
      this.setGauge('hasivu_memory_usage_bytes', memUsage.heapUsed, { type: 'heap_used' });
      this.setGauge('hasivu_memory_usage_bytes', memUsage.heapTotal, { type: 'heap_total' });

      // CPU usage (would need additional implementation for accurate CPU metrics)
      const cpuUsage = process.cpuUsage();
      this.setGauge('hasivu_cpu_usage_microseconds', cpuUsage.user, { type: 'user' });
      this.setGauge('hasivu_cpu_usage_microseconds', cpuUsage.system, { type: 'system' });

      // Event loop lag (would need additional implementation)
      // this.observeHistogram('hasivu_event_loop_lag_seconds', eventLoopLag);
    } catch (error) {
      this.logger.error('Error collecting system metrics', { errorMessage: error.message });
    }
  }

  /**
   * Collect business-specific metrics
   */
  private async collectBusinessMetrics(): Promise<void> {
    try {
      // School-specific metrics would be collected here
      // This would interface with the HASIVU application layer
      // Example: Active sessions per school
      // const activeSessions = await this.getActiveSessionsPerSchool();
      // for (const [schoolId, count] of activeSessions) {
      //   this.setGauge('hasivu_active_sessions', count, { school_id: schoolId });
      // }
    } catch (error) {
      this.logger.error('Error collecting business metrics', { errorMessage: error.message });
    }
  }

  /**
   * Perform metric aggregations
   */
  private async performAggregations(): Promise<void> {
    const timeWindows = ['1m', '5m', '15m', '1h', '1d'];

    for (const window of timeWindows) {
      await this.aggregateMetrics(window);
    }
  }

  /**
   * Aggregate metrics for a specific time window
   */
  private async aggregateMetrics(timeWindow: string): Promise<void> {
    const windowMs = this.parseDuration(timeWindow);
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    // Aggregate for each school
    for (const [schoolId, metrics] of this.customMetrics) {
      const windowMetrics = metrics.filter(m => m.timestamp >= windowStart && m.timestamp <= now);

      // Group by metric name
      const metricGroups = new Map<string, CustomMetric[]>();
      for (const metric of windowMetrics) {
        if (!metricGroups.has(metric.name)) {
          metricGroups.set(metric.name, []);
        }
        metricGroups.get(metric.name)!.push(metric);
      }

      // Calculate aggregations
      for (const [metricName, metricList] of metricGroups) {
        const aggregations = this.calculateAggregations(metricList, timeWindow);

        for (const aggregation of aggregations) {
          this.storeAggregation(schoolId, aggregation);
        }
      }
    }
  }

  /**
   * Calculate various aggregations for a metric set
   */
  private calculateAggregations(metrics: CustomMetric[], timeWindow: string): MetricAggregation[] {
    if (metrics.length === 0) return [];

    const values = metrics.map(m => m.value);
    const timestamp = new Date();
    const metricName = metrics[0].name;
    const labels = metrics[0].labels;

    const aggregations: MetricAggregation[] = [
      {
        metric: metricName,
        timeWindow,
        aggregationType: 'SUM',
        value: values.reduce((sum, val) => sum + val, 0),
        timestamp,
        labels,
      },
      {
        metric: metricName,
        timeWindow,
        aggregationType: 'AVG',
        value: values.reduce((sum, val) => sum + val, 0) / values.length,
        timestamp,
        labels,
      },
      {
        metric: metricName,
        timeWindow,
        aggregationType: 'MIN',
        value: Math.min(...values),
        timestamp,
        labels,
      },
      {
        metric: metricName,
        timeWindow,
        aggregationType: 'MAX',
        value: Math.max(...values),
        timestamp,
        labels,
      },
      {
        metric: metricName,
        timeWindow,
        aggregationType: 'COUNT',
        value: values.length,
        timestamp,
        labels,
      },
    ];

    // Calculate percentiles
    const sortedValues = values.sort((a, b) => a - b);
    const percentiles = [50, 95, 99];

    for (const p of percentiles) {
      const index = Math.ceil((p / 100) * sortedValues.length) - 1;
      aggregations.push({
        metric: metricName,
        timeWindow,
        aggregationType: `P${p}` as any,
        value: sortedValues[index] || 0,
        timestamp,
        labels,
      });
    }

    return aggregations;
  }

  /**
   * Store aggregation result
   */
  private storeAggregation(schoolId: string, aggregation: MetricAggregation): void {
    if (!this.aggregations.has(schoolId)) {
      this.aggregations.set(schoolId, []);
    }
    this.aggregations.get(schoolId)!.push(aggregation);

    // Emit for real-time processing
    this.emit('aggregationCalculated', { schoolId, aggregation });
  }

  /**
   * Clean up old metrics based on retention period
   */
  private cleanupOldMetrics(schoolId: string): void {
    const cutoffTime = new Date(Date.now() - this.retentionPeriod);

    const metrics = this.customMetrics.get(schoolId);
    if (metrics) {
      const filteredMetrics = metrics.filter(m => m.timestamp > cutoffTime);
      this.customMetrics.set(schoolId, filteredMetrics);
    }

    const aggregations = this.aggregations.get(schoolId);
    if (aggregations) {
      const filteredAggregations = aggregations.filter(a => a.timestamp > cutoffTime);
      this.aggregations.set(schoolId, filteredAggregations);
    }
  }

  /**
   * Helper methods
   */
  private parseMetricName(query: string): string {
    // Simple implementation - would need more sophisticated parsing for complex queries
    return query.split('{')[0].trim();
  }

  private isWithinTimeRange(timestamp: Date, start?: Date, end?: Date): boolean {
    if (start && timestamp < start) return false;
    if (end && timestamp > end) return false;
    return true;
  }

  private matchesLabels(
    metricLabels: Record<string, string>,
    queryLabels?: Record<string, string>
  ): boolean {
    if (!queryLabels) return true;

    for (const [key, value] of Object.entries(queryLabels)) {
      if (metricLabels[key] !== value) return false;
    }

    return true;
  }

  private groupMetricsByLabels(metrics: CustomMetric[]): Map<string, CustomMetric[]> {
    const groups = new Map<string, CustomMetric[]>();

    for (const metric of metrics) {
      const labelKey = JSON.stringify(metric.labels);
      if (!groups.has(labelKey)) {
        groups.set(labelKey, []);
      }
      groups.get(labelKey)!.push(metric);
    }

    return groups;
  }

  private parseLabels(labelKey: string): Record<string, string> {
    try {
      return JSON.parse(labelKey);
    } catch {
      return {};
    }
  }

  private parseDuration(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1));

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return value;
    }
  }

  /**
   * Stop metrics collection
   */
  stop(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }

    this.logger.info('Metrics collection stopped');
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(schoolId?: string): any {
    const summary = {
      totalMetrics: 0,
      metricTypes: new Set<string>(),
      timeRange: { start: null as Date | null, end: null as Date | null },
      schools: new Set<string>(),
    };

    const metricsToAnalyze = schoolId
      ? this.customMetrics.get(schoolId) || []
      : Array.from(this.customMetrics.values()).flat();

    summary.totalMetrics = metricsToAnalyze.length;

    for (const metric of metricsToAnalyze) {
      summary.metricTypes.add(metric.name);
      summary.schools.add(metric.schoolId);

      if (!summary.timeRange.start || metric.timestamp < summary.timeRange.start) {
        summary.timeRange.start = metric.timestamp;
      }
      if (!summary.timeRange.end || metric.timestamp > summary.timeRange.end) {
        summary.timeRange.end = metric.timestamp;
      }
    }

    return {
      ...summary,
      metricTypes: Array.from(summary.metricTypes),
      schools: Array.from(summary.schools),
    };
  }
}

export default MetricsCollector;
