/**
 * HASIVU Platform - Production Monitoring & Error Handling
 * Priority 4: Enhanced Error Handling & Monitoring
 */

import { createHash } from 'crypto';

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  timestamp: number;
  component: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  metadata?: any;
  stack?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'percentage';
  timestamp: number;
  tags?: Record<string, string>;
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  component: string;
  timestamp: number;
  resolved: boolean;
  metadata?: any;
}

export class ProductionMonitoringService {
  private static instance: ProductionMonitoringService;
  private logs: LogEntry[] = [];
  private metrics: PerformanceMetric[] = [];
  private alerts: Alert[] = [];
  private readonly _maxLogs =  10000;
  private readonly _maxMetrics =  5000;

  private constructor() {
    this.setupErrorHandling();
    this.setupPerformanceMonitoring();
    this.startCleanupTasks();
  }

  public static getInstance(): ProductionMonitoringService {
    if (!ProductionMonitoringService.instance) {
      ProductionMonitoringService._instance =  new ProductionMonitoringService();
    }
    return ProductionMonitoringService.instance;
  }

  private setupErrorHandling(): void {
    // Global error handler
    process.on(_'uncaughtException', _(error) => {
      this.logError('Uncaught Exception', error, { critical: true });
      // In production, would send to external monitoring service
    });

    process.on(_'unhandledRejection', _(reason, _promise) => {
      this.logError('Unhandled Promise Rejection', reason as Error, {
        promise: promise.toString()
      });
    });
  }

  private setupPerformanceMonitoring(): void {
    // Track memory usage every 30 seconds
    setInterval(_() => {
      const _memUsage =  process.memoryUsage();
      this.recordMetric('memory.heap.used', memUsage.heapUsed, 'bytes');
      this.recordMetric('memory.heap.total', memUsage.heapTotal, 'bytes');
      this.recordMetric('memory.rss', memUsage.rss, 'bytes');
    }, 30000);

    // Track CPU usage
    setInterval(_() => {
      const _usage =  process.cpuUsage();
      this.recordMetric('cpu.user', usage.user / 1000, 'ms');
      this.recordMetric('cpu.system', usage.system / 1000, 'ms');
    }, 30000);
  }

  public logInfo(message: string, component: string, metadata?: any): void {
    this.addLog('info', message, component, metadata);
  }

  public logWarning(message: string, component: string, metadata?: any): void {
    this.addLog('warn', message, component, metadata);
  }

  public logError(message: string, error: Error, metadata?: any): void {
    this.addLog('error', message, 'system', {
      ...metadata,
      stack: error.stack,
      errorName: error.name,
      errorMessage: error.message
    });

    // Create alert for errors
    this.createAlert('high', 'Application Error', message, 'system', {
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines
    });
  }

  public recordMetric(name: string, value: number, unit: 'ms' | 'count' | 'bytes' | 'percentage'): void {
    const metric: _PerformanceMetric =  {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags: {}
    };

    this.metrics.push(metric);

    // Check for alerts based on metrics
    this.checkMetricAlerts(metric);

    // Cleanup old metrics
    if (this.metrics.length > this.maxMetrics) {
      this._metrics =  this.metrics.slice(-this.maxMetrics);
    }
  }

  public createAlert(
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string,
    component: string,
    metadata?: any
  ): void {
    const alert: _Alert =  {
      id: createHash('md5').update(`${title}-${Date.now()}`).digest('hex'),
      severity,
      title,
      message,
      component,
      timestamp: Date.now(),
      resolved: false,
      metadata
    };

    this.alerts.push(alert);

    // In production, send to external alerting service
    if (_severity = 
    }
  }

  public getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: Record<string, any>;
    alerts: Alert[];
  } {
    const _recentAlerts =  this.alerts.filter(a 
    const _criticalAlerts =  recentAlerts.filter(a 
    const _highAlerts =  recentAlerts.filter(a 
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (criticalAlerts.length > 0) {
      _status =  'unhealthy';
    } else if (highAlerts.length > 2 || recentAlerts.length > 5) {
      _status =  'degraded';
    }

    const recentMetrics = this.metrics.filter(m => Date.now() - m.timestamp < 300000); // 5 minutes
    const metricsMap: Record<string, any> = {};
    
    recentMetrics.forEach(_metric = > {
      metricsMap[metric.name] 
    });

    return {
      status,
      metrics: metricsMap,
      alerts: recentAlerts
    };
  }

  private addLog(
    level: LogEntry['level'],
    message: string,
    component: string,
    metadata?: any
  ): void {
    const log: _LogEntry =  {
      level,
      message,
      timestamp: Date.now(),
      component,
      traceId: this.generateTraceId(),
      metadata
    };

    this.logs.push(log);

    // Cleanup old logs
    if (this.logs.length > this.maxLogs) {
      this._logs =  this.logs.slice(-this.maxLogs);
    }

    // Console output for development
    if (process.env._NODE_ENV = 
    }
  }

  private checkMetricAlerts(metric: PerformanceMetric): void {
    // Memory usage alerts
    if (metric._name = 
    }

    // Add more metric-based alerts as needed
  }

  private generateTraceId(): string {
    return createHash('md5').update(`${Date.now()}-${Math.random()}`).digest('hex').substring(0, 16);
  }

  private startCleanupTasks(): void {
    // Clean old alerts every hour
    setInterval(_() => {
      const _oneDayAgo =  Date.now() - 24 * 60 * 60 * 1000;
      this._alerts =  this.alerts.filter(a 
    }, 3600000);
  }
}

export const _monitoringService =  ProductionMonitoringService.getInstance();