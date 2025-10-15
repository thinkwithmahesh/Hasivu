// Production Monitoring Service - Mock Implementation for Testing
// Priority 5: Advanced Testing & Quality Assurance

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    heapUsed: number;
    heapTotal: number;
  };
  uptime: number;
  timestamp: number;
}

export interface PerformanceMetrics {
  timestamp: number;
  operations: {
    total: number;
    cache: {
      hits: number;
      misses: number;
      sets: number;
      gets: number;
      hitRate: number;
    };
    database: {
      queries: number;
      avgResponseTime: number;
      slowQueries: number;
      errorRate: number;
    };
    api: {
      requests: number;
      avgResponseTime: number;
      errors: number;
      errorRate: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
    };
  };
  throughput: {
    requestsPerSecond: number;
    operationsPerSecond: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  alerts: PerformanceAlert[];
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
}

export interface PerformanceThresholds {
  responseTime: {
    warning: number; // ms
    critical: number; // ms
  };
  errorRate: {
    warning: number; // percentage
    critical: number; // percentage
  };
  memoryUsage: {
    warning: number; // percentage
    critical: number; // percentage
  };
  cacheHitRate: {
    warning: number; // percentage
    critical: number; // percentage
  };
}

export class ProductionMonitoringService {
  private metrics: Map<string, any> = new Map();
  private performanceData: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private responseTimes: number[] = [];
  private thresholds: PerformanceThresholds;
  private alertCooldowns: Map<string, number> = new Map();

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      responseTime: { warning: 1000, critical: 5000 }, // ms
      errorRate: { warning: 5, critical: 15 }, // percentage
      memoryUsage: { warning: 80, critical: 95 }, // percentage
      cacheHitRate: { warning: 70, critical: 50 }, // percentage
      ...thresholds,
    };

    this.performanceData = {
      timestamp: Date.now(),
      operations: {
        total: 0,
        cache: { hits: 0, misses: 0, sets: 0, gets: 0, hitRate: 0 },
        database: { queries: 0, avgResponseTime: 0, slowQueries: 0, errorRate: 0 },
        api: {
          requests: 0,
          avgResponseTime: 0,
          errors: 0,
          errorRate: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
        },
      },
      throughput: {
        requestsPerSecond: 0,
        operationsPerSecond: 0,
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
      },
      alerts: [],
    };
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    return {
      cpu: {
        usage: Math.random() * 100, // Mock CPU usage
        loadAverage: [1.2, 1.5, 1.8],
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
      },
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      ...this.performanceData,
      timestamp: Date.now(),
    };
  }

  async logMetric(name: string, value: any): Promise<void> {
    this.metrics.set(name, {
      value,
      timestamp: Date.now(),
    });

    // Update performance data based on metric type
    if (name.includes('cache')) {
      this.performanceData.operations.cache.sets++;
    } else if (name.includes('db') || name.includes('database')) {
      this.performanceData.operations.database.queries++;
    } else if (name.includes('api')) {
      this.performanceData.operations.api.requests++;
    }

    this.performanceData.operations.total++;
  }

  async getMetric(name: string): Promise<any> {
    return this.metrics.get(name);
  }

  async getAllMetrics(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.metrics.entries()) {
      result[key] = value;
    }
    return result;
  }

  async clearMetrics(): Promise<void> {
    this.metrics.clear();
    this.alerts = [];
    this.responseTimes = [];
    this.alertCooldowns.clear();
    // Reset performance data
    this.performanceData = {
      timestamp: Date.now(),
      operations: {
        total: 0,
        cache: { hits: 0, misses: 0, sets: 0, gets: 0, hitRate: 0 },
        database: { queries: 0, avgResponseTime: 0, slowQueries: 0, errorRate: 0 },
        api: {
          requests: 0,
          avgResponseTime: 0,
          errors: 0,
          errorRate: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
        },
      },
      throughput: {
        requestsPerSecond: 0,
        operationsPerSecond: 0,
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
      },
      alerts: [],
    };
  }

  async recordCacheHit(): Promise<void> {
    this.performanceData.operations.cache.hits++;
    this.performanceData.operations.total++;
  }

  async recordCacheMiss(): Promise<void> {
    this.performanceData.operations.cache.misses++;
    this.performanceData.operations.total++;
  }

  async recordApiRequest(responseTime: number, isError: boolean = false): Promise<void> {
    const currentRequests = this.performanceData.operations.api.requests;
    const currentAvg = this.performanceData.operations.api.avgResponseTime;

    this.performanceData.operations.api.requests++;
    this.performanceData.operations.api.avgResponseTime =
      (currentAvg * currentRequests + responseTime) / (currentRequests + 1);

    if (isError) {
      this.performanceData.operations.api.errors++;
    }

    // Track response times for percentiles
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000); // Keep last 1000 samples
    }

    // Calculate percentiles
    if (this.responseTimes.length >= 10) {
      const sorted = [...this.responseTimes].sort((a, b) => a - b);
      this.performanceData.operations.api.p95ResponseTime =
        sorted[Math.floor(sorted.length * 0.95)];
      this.performanceData.operations.api.p99ResponseTime =
        sorted[Math.floor(sorted.length * 0.99)];
    }

    // Calculate error rate
    this.performanceData.operations.api.errorRate =
      (this.performanceData.operations.api.errors / this.performanceData.operations.api.requests) *
      100;

    this.performanceData.operations.total++;

    // Check for alerts
    await this.checkPerformanceAlerts();
  }

  /**
   * Record database query metrics
   */
  async recordDatabaseQuery(responseTime: number, isError: boolean = false): Promise<void> {
    const currentQueries = this.performanceData.operations.database.queries;
    const currentAvg = this.performanceData.operations.database.avgResponseTime;

    this.performanceData.operations.database.queries++;
    this.performanceData.operations.database.avgResponseTime =
      (currentAvg * currentQueries + responseTime) / (currentQueries + 1);

    if (responseTime > 1000) {
      this.performanceData.operations.database.slowQueries++;
    }

    if (isError) {
      this.performanceData.operations.database.errorRate =
        ((this.performanceData.operations.database.errorRate * currentQueries + 1) /
          (currentQueries + 1)) *
        100;
    }

    this.performanceData.operations.total++;
  }

  /**
   * Record cache operation
   */
  async recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'get'): Promise<void> {
    switch (operation) {
      case 'hit':
        this.performanceData.operations.cache.hits++;
        break;
      case 'miss':
        this.performanceData.operations.cache.misses++;
        break;
      case 'set':
        this.performanceData.operations.cache.sets++;
        break;
      case 'get':
        this.performanceData.operations.cache.gets++;
        break;
    }

    // Calculate hit rate
    const totalGets =
      this.performanceData.operations.cache.hits + this.performanceData.operations.cache.misses;
    if (totalGets > 0) {
      this.performanceData.operations.cache.hitRate =
        (this.performanceData.operations.cache.hits / totalGets) * 100;
    }

    this.performanceData.operations.total++;
  }

  /**
   * Update memory metrics
   */
  async updateMemoryMetrics(): Promise<void> {
    const memUsage = process.memoryUsage();
    this.performanceData.memory = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
    };
  }

  /**
   * Check for performance alerts
   */
  private async checkPerformanceAlerts(): Promise<void> {
    const now = Date.now();

    // Response time alerts
    if (
      this.performanceData.operations.api.avgResponseTime > this.thresholds.responseTime.critical
    ) {
      await this.createAlert(
        'critical',
        'High average response time',
        'api_response_time',
        this.performanceData.operations.api.avgResponseTime,
        this.thresholds.responseTime.critical
      );
    } else if (
      this.performanceData.operations.api.avgResponseTime > this.thresholds.responseTime.warning
    ) {
      await this.createAlert(
        'warning',
        'Elevated average response time',
        'api_response_time',
        this.performanceData.operations.api.avgResponseTime,
        this.thresholds.responseTime.warning
      );
    }

    // Error rate alerts
    if (this.performanceData.operations.api.errorRate > this.thresholds.errorRate.critical) {
      await this.createAlert(
        'critical',
        'High error rate detected',
        'api_error_rate',
        this.performanceData.operations.api.errorRate,
        this.thresholds.errorRate.critical
      );
    } else if (this.performanceData.operations.api.errorRate > this.thresholds.errorRate.warning) {
      await this.createAlert(
        'warning',
        'Elevated error rate',
        'api_error_rate',
        this.performanceData.operations.api.errorRate,
        this.thresholds.errorRate.warning
      );
    }

    // Memory usage alerts
    const memoryUsagePercent =
      (this.performanceData.memory.heapUsed / this.performanceData.memory.heapTotal) * 100;
    if (memoryUsagePercent > this.thresholds.memoryUsage.critical) {
      await this.createAlert(
        'critical',
        'Critical memory usage',
        'memory_usage',
        memoryUsagePercent,
        this.thresholds.memoryUsage.critical
      );
    } else if (memoryUsagePercent > this.thresholds.memoryUsage.warning) {
      await this.createAlert(
        'warning',
        'High memory usage',
        'memory_usage',
        memoryUsagePercent,
        this.thresholds.memoryUsage.warning
      );
    }

    // Cache hit rate alerts
    if (this.performanceData.operations.cache.hitRate < this.thresholds.cacheHitRate.critical) {
      await this.createAlert(
        'critical',
        'Low cache hit rate',
        'cache_hit_rate',
        this.performanceData.operations.cache.hitRate,
        this.thresholds.cacheHitRate.critical
      );
    } else if (
      this.performanceData.operations.cache.hitRate < this.thresholds.cacheHitRate.warning
    ) {
      await this.createAlert(
        'warning',
        'Low cache hit rate',
        'cache_hit_rate',
        this.performanceData.operations.cache.hitRate,
        this.thresholds.cacheHitRate.warning
      );
    }
  }

  /**
   * Create a performance alert
   */
  private async createAlert(
    type: 'warning' | 'critical' | 'info',
    message: string,
    metric: string,
    value: number,
    threshold: number
  ): Promise<void> {
    const alertKey = `${metric}_${type}`;
    const lastAlertTime = this.alertCooldowns.get(alertKey) || 0;
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes cooldown

    if (Date.now() - lastAlertTime < cooldownPeriod) {
      return; // Still in cooldown
    }

    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      metric,
      value,
      threshold,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(alert);
    this.alertCooldowns.set(alertKey, Date.now());

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Update performance data alerts
    this.performanceData.alerts = this.alerts.filter(a => !a.resolved);

    // Log alert
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<PerformanceAlert[]> {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Get performance health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    await this.updateMemoryMetrics();

    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check response time
    if (
      this.performanceData.operations.api.avgResponseTime > this.thresholds.responseTime.critical
    ) {
      issues.push('Critical response time');
      recommendations.push('Optimize database queries and implement caching');
      score -= 30;
    } else if (
      this.performanceData.operations.api.avgResponseTime > this.thresholds.responseTime.warning
    ) {
      issues.push('High response time');
      recommendations.push('Review query performance and consider caching');
      score -= 15;
    }

    // Check error rate
    if (this.performanceData.operations.api.errorRate > this.thresholds.errorRate.critical) {
      issues.push('Critical error rate');
      recommendations.push('Investigate error sources and implement circuit breakers');
      score -= 25;
    } else if (this.performanceData.operations.api.errorRate > this.thresholds.errorRate.warning) {
      issues.push('High error rate');
      recommendations.push('Monitor error patterns and improve error handling');
      score -= 10;
    }

    // Check memory usage
    const memoryUsagePercent =
      (this.performanceData.memory.heapUsed / this.performanceData.memory.heapTotal) * 100;
    if (memoryUsagePercent > this.thresholds.memoryUsage.critical) {
      issues.push('Critical memory usage');
      recommendations.push('Optimize memory usage and consider scaling');
      score -= 20;
    } else if (memoryUsagePercent > this.thresholds.memoryUsage.warning) {
      issues.push('High memory usage');
      recommendations.push('Monitor memory leaks and optimize data structures');
      score -= 10;
    }

    // Check cache performance
    if (this.performanceData.operations.cache.hitRate < this.thresholds.cacheHitRate.critical) {
      issues.push('Poor cache performance');
      recommendations.push('Review cache strategy and warm frequently accessed data');
      score -= 15;
    } else if (
      this.performanceData.operations.cache.hitRate < this.thresholds.cacheHitRate.warning
    ) {
      issues.push('Low cache hit rate');
      recommendations.push('Optimize cache keys and increase cache TTL');
      score -= 5;
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (score < 70) {
      status = 'critical';
    } else if (score < 85) {
      status = 'warning';
    }

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  }
}
