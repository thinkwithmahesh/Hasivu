/**
 * HASIVU Platform - System Health Monitoring Service
 * Comprehensive health monitoring with real-time status reporting
 * Integrates with graceful degradation and circuit breakers
 */
import { logger } from '@/utils/logger';
import { GracefulDegradationService, ServiceStatus } from '@/services/graceful-degradation.service';
import { CircuitBreakerRegistry } from '@/services/circuit-breaker.service';
import { DatabaseService } from '@/services/database.service';
import { RedisService } from '@/services/redis.service';

/**
 * Health check severity levels
 */
export enum HealthSeverity {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  FAILED = 'failed'
}

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  service: string;
  status: HealthSeverity;
  responseTime: number;
  timestamp: Date;
  message: string;
  details?: Record<string, any>;
  metadata?: {
    version?: string;
    uptime?: number;
    connections?: number;
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

/**
 * System health summary
 */
export interface SystemHealthSummary {
  overallStatus: HealthSeverity;
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  failedServices: number;
  checks: HealthCheckResult[];
  lastUpdated: Date;
  uptime: number;
  systemMetrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: boolean;
  };
  metadata?: {
    monitoringDuration?: number;
    totalChecks?: number;
    successfulChecks?: number;
    [key: string]: any;
  };
}

/**
 * Health monitoring configuration
 */
export interface HealthMonitorConfig {
  checkInterval: number;
  timeout: number;
  retries: number;
  enabledChecks: string[];
  thresholds: {
    cpu: number;
    memory: number;
    responseTime: number;
    errorRate: number;
  };
  alerting: {
    enabled: boolean;
    webhookUrl?: string;
    emailRecipients?: string[];
    slackChannel?: string;
  };
}

/**
 * Main health monitoring service
 */
export class HealthMonitorService {
  private isRunning = false;
  private monitoringInterval?: NodeJS.Timeout;
  private healthHistory: Map<string, HealthCheckResult[]> = new Map();
  private lastHealthSummary?: SystemHealthSummary;
  private startTime = 0;
  private redis: typeof RedisService;
  private gracefulDegradation: GracefulDegradationService;

  constructor(private config: HealthMonitorConfig) {
    this.redis = RedisService;
    this.gracefulDegradation = new GracefulDegradationService();
    this.validateConfig();
  }

  /**
   * Validate health monitor configuration
   */
  private validateConfig(): void {
    if (this.config.checkInterval < 5000) {
      throw new Error('Check interval must be at least 5 seconds');
    }
    if (this.config.timeout < 1000) {
      throw new Error('Timeout must be at least 1 second');
    }
    if (this.config.retries < 0 || this.config.retries > 5) {
      throw new Error('Retries must be between 0 and 5');
    }
  }

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Health monitoring already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();

    // Initial health check
    this.performHealthChecks();

    // Schedule periodic health checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.checkInterval);

    logger.info('Health monitoring started', {
      interval: this.config.checkInterval,
      enabledChecks: this.config.enabledChecks
    });
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.isRunning = false;
    logger.info('Health monitoring stopped');
  }

  /**
   * Perform all health checks
   */
  private async performHealthChecks(): Promise<void> {
    const checks: HealthCheckResult[] = [];

    try {
      // Perform enabled health checks in parallel
      const checkPromises = this.config.enabledChecks.map(async (checkName) => {
        try {
          switch (checkName) {
            case 'database':
              return await this.checkDatabase();
            case 'redis':
              return await this.checkRedis();
            case 'memory':
              return await this.checkMemory();
            case 'circuitBreakers':
              return await this.checkCircuitBreakers();
            case 'degradationServices':
              return await this.checkDegradationServices();
            case 'disk':
              return await this.checkDisk();
            case 'cpu':
              return await this.checkCPU();
            default:
              logger.warn('Unknown health check', { checkName });
              return null;
          }
        } catch (error) {
          logger.error('Health check failed', { checkName, error: (error as Error).message });
          return {
            service: checkName,
            status: HealthSeverity.FAILED,
            responseTime: 0,
            timestamp: new Date(),
            message: `Health check failed: ${(error as Error).message}`
          };
        }
      });

      const results = await Promise.allSettled(checkPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          checks.push(result.value);
        } else if (result.status === 'rejected') {
          checks.push({
            service: this.config.enabledChecks[index],
            status: HealthSeverity.FAILED,
            responseTime: 0,
            timestamp: new Date(),
            message: `Health check promise rejected: ${result.reason}`
          });
        }
      });

      // Update health history
      checks.forEach(check => {
        this.updateHealthHistory(check);
      });

      // Generate system health summary
      this.lastHealthSummary = this.generateHealthSummary(checks);

      // Store in Redis for external access
      await this.storeHealthSummary(this.lastHealthSummary);

      // Check for alerting conditions
      await this.checkAlertConditions(this.lastHealthSummary);

      // Clean up old health records
      this.cleanupHealthHistory();

    } catch (error) {
      logger.error('Health check cycle failed', { error: (error as Error).message });
    }
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Perform simple database health check
      const healthCheckPromise = DatabaseService.client.$queryRaw`SELECT 1 as health_check`;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database health check timeout')), this.config.timeout)
      );

      await Promise.race([healthCheckPromise, timeoutPromise]);
      
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'database',
        status: responseTime > this.config.thresholds.responseTime ? HealthSeverity.WARNING : HealthSeverity.HEALTHY,
        responseTime,
        timestamp: new Date(),
        message: `Database responding in ${responseTime}ms`,
        metadata: {
          connections: await this.getDatabaseConnections(),
          version: await this.getDatabaseVersion()
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'database',
        status: HealthSeverity.FAILED,
        responseTime,
        timestamp: new Date(),
        message: `Database health check failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const pong = await Promise.race([
        this.redis.ping(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis ping timeout')), this.config.timeout)
        )
      ]);
      
      const responseTime = Date.now() - startTime;
      const isHealthy = pong === 'PONG';
      
      return {
        service: 'redis',
        status: isHealthy ? HealthSeverity.HEALTHY : HealthSeverity.FAILED,
        responseTime,
        timestamp: new Date(),
        message: `Redis responding in ${responseTime}ms`,
        metadata: {
          connections: await this.getRedisConnections(),
          memory: await this.getRedisMemoryUsage()
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        service: 'redis',
        status: HealthSeverity.FAILED,
        responseTime,
        timestamp: new Date(),
        message: `Redis health check failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthCheckResult> {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100;
    const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    let status = HealthSeverity.HEALTHY;
    let message = `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapUsagePercent.toFixed(1)}%)`;

    if (heapUsagePercent > 90) {
      status = HealthSeverity.CRITICAL;
      message = `Critical memory usage: ${heapUsagePercent.toFixed(1)}%`;
    } else if (heapUsagePercent > this.config.thresholds.memory) {
      status = HealthSeverity.WARNING;
      message = `High memory usage: ${heapUsagePercent.toFixed(1)}%`;
    }

    return {
      service: 'memory',
      status,
      responseTime: 0,
      timestamp: new Date(),
      message,
      metadata: {
        memory: {
          used: heapUsedMB,
          total: heapTotalMB,
          percentage: heapUsagePercent
        }
      }
    };
  }

  /**
   * Check circuit breakers health
   */
  private async checkCircuitBreakers(): Promise<HealthCheckResult> {
    const allStats = CircuitBreakerRegistry.getAllStats();
    const healthyBreakers = CircuitBreakerRegistry.getHealthyBreakers();
    const unhealthyBreakers = CircuitBreakerRegistry.getUnhealthyBreakers();

    const totalBreakers = Object.keys(allStats).length;
    const healthyCount = healthyBreakers.length;
    const unhealthyCount = unhealthyBreakers.length;

    let status = HealthSeverity.HEALTHY;
    let message = `${healthyCount}/${totalBreakers} circuit breakers healthy`;

    if (unhealthyCount > 0) {
      if (unhealthyCount > totalBreakers * 0.5) {
        status = HealthSeverity.CRITICAL;
        message = `${unhealthyCount} circuit breakers failed`;
      } else {
        status = HealthSeverity.WARNING;
        message = `${unhealthyCount} circuit breakers degraded`;
      }
    }

    return {
      service: 'circuitBreakers',
      status,
      responseTime: 0,
      timestamp: new Date(),
      message,
      details: {
        healthy: healthyBreakers,
        unhealthy: unhealthyBreakers,
        stats: allStats
      }
    };
  }

  /**
   * Check degradation services health
   */
  private async checkDegradationServices(): Promise<HealthCheckResult> {
    const allServiceHealth = this.gracefulDegradation.getAllServiceHealth();
    const healthyServices = allServiceHealth.filter(s => s.status === ServiceStatus.HEALTHY);
    const degradedServices = allServiceHealth.filter(s => s.status === ServiceStatus.DEGRADED);
    const failedServices = allServiceHealth.filter(s => s.status === ServiceStatus.UNAVAILABLE);

    const totalServices = allServiceHealth.length;
    const healthyCount = healthyServices.length;
    const degradedCount = degradedServices.length;
    const failedCount = failedServices.length;

    let status = HealthSeverity.HEALTHY;
    let message = `${healthyCount}/${totalServices} services healthy`;

    if (failedCount > 0) {
      status = HealthSeverity.CRITICAL;
      message = `${failedCount} services failed, ${degradedCount} degraded`;
    } else if (degradedCount > 0) {
      status = HealthSeverity.WARNING;
      message = `${degradedCount} services degraded`;
    }

    return {
      service: 'degradationServices',
      status,
      responseTime: 0,
      timestamp: new Date(),
      message,
      details: {
        healthy: healthyServices.map(s => s.serviceName),
        degraded: degradedServices.map(s => s.serviceName),
        failed: failedServices.map(s => s.serviceName),
        metrics: this.gracefulDegradation.getDegradationMetrics()
      }
    };
  }

  /**
   * Check disk usage
   */
  private async checkDisk(): Promise<HealthCheckResult> {
    try {
      const fs = require('fs');
      const stats = fs.statSync('/');
      const diskUsage = {
        free: stats.free || 0,
        size: stats.size || 1,
        used: (stats.size || 1) - (stats.free || 0)
      };
      
      const usagePercent = (diskUsage.used / diskUsage.size) * 100;
      
      let status = HealthSeverity.HEALTHY;
      let message = `Disk usage: ${usagePercent.toFixed(1)}%`;

      if (usagePercent > 95) {
        status = HealthSeverity.CRITICAL;
        message = `Critical disk usage: ${usagePercent.toFixed(1)}%`;
      } else if (usagePercent > 85) {
        status = HealthSeverity.WARNING;
        message = `High disk usage: ${usagePercent.toFixed(1)}%`;
      }

      return {
        service: 'disk',
        status,
        responseTime: 0,
        timestamp: new Date(),
        message
      };
    } catch (error) {
      return {
        service: 'disk',
        status: HealthSeverity.FAILED,
        responseTime: 0,
        timestamp: new Date(),
        message: `Disk check failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Check CPU usage
   */
  private async checkCPU(): Promise<HealthCheckResult> {
    const startUsage = process.cpuUsage();
    
    return new Promise(resolve => {
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const userCPU = endUsage.user / 1000; // Convert to milliseconds
        const systemCPU = endUsage.system / 1000;
        const totalCPU = userCPU + systemCPU;
        const cpuPercent = (totalCPU / 1000) * 100; // Approximate percentage

        let status = HealthSeverity.HEALTHY;
        let message = `CPU usage: ${cpuPercent.toFixed(1)}%`;

        if (cpuPercent > 95) {
          status = HealthSeverity.CRITICAL;
          message = `Critical CPU usage: ${cpuPercent.toFixed(1)}%`;
        } else if (cpuPercent > this.config.thresholds.cpu) {
          status = HealthSeverity.WARNING;
          message = `High CPU usage: ${cpuPercent.toFixed(1)}%`;
        }

        resolve({
          service: 'cpu',
          status,
          responseTime: 0,
          timestamp: new Date(),
          message
        });
      }, 1000);
    });
  }

  /**
   * Generate system health summary
   */
  private generateHealthSummary(checks: HealthCheckResult[]): SystemHealthSummary {
    const healthyCount = checks.filter(c => c.status === HealthSeverity.HEALTHY).length;
    const warningCount = checks.filter(c => c.status === HealthSeverity.WARNING).length;
    const criticalCount = checks.filter(c => c.status === HealthSeverity.CRITICAL).length;
    const failedCount = checks.filter(c => c.status === HealthSeverity.FAILED).length;

    let overallStatus = HealthSeverity.HEALTHY;
    if (failedCount > 0 || criticalCount > 0) {
      overallStatus = HealthSeverity.CRITICAL;
    } else if (warningCount > 0) {
      overallStatus = HealthSeverity.WARNING;
    }

    const memoryCheck = checks.find(c => c.service === 'memory');
    const cpuCheck = checks.find(c => c.service === 'cpu');
    const diskCheck = checks.find(c => c.service === 'disk');

    return {
      overallStatus,
      totalServices: checks.length,
      healthyServices: healthyCount,
      degradedServices: warningCount,
      failedServices: failedCount + criticalCount,
      checks,
      lastUpdated: new Date(),
      uptime: this.startTime > 0 ? Date.now() - this.startTime : 0,
      systemMetrics: {
        cpu: 0, // CPU percentage not available in current health check structure
        memory: memoryCheck?.metadata?.memory?.percentage || 0,
        disk: 0, // Extract from disk check if available
        network: checks.find(c => c.service === 'redis')?.status === HealthSeverity.HEALTHY
      }
    };
  }

  /**
   * Update health history for a service
   */
  private updateHealthHistory(check: HealthCheckResult): void {
    if (!this.healthHistory.has(check.service)) {
      this.healthHistory.set(check.service, []);
    }

    const history = this.healthHistory.get(check.service)!;
    history.push(check);

    // Keep only last 100 entries per service
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  /**
   * Store health summary in Redis
   */
  private async storeHealthSummary(summary: SystemHealthSummary): Promise<void> {
    try {
      await this.redis.setex(
        'health:system:summary',
        this.config.checkInterval * 2 / 1000, // TTL = 2x check interval
        JSON.stringify(summary)
      );
    } catch (error) {
      logger.warn('Failed to store health summary in Redis', { error: (error as Error).message });
    }
  }

  /**
   * Check alert conditions and send notifications
   */
  private async checkAlertConditions(summary: SystemHealthSummary): Promise<void> {
    if (!this.config.alerting.enabled) return;

    const criticalChecks = summary.checks.filter(c => 
      c.status === HealthSeverity.CRITICAL || c.status === HealthSeverity.FAILED
    );

    if (criticalChecks.length > 0) {
      await this.sendHealthAlert(summary, criticalChecks);
    }
  }

  /**
   * Send health alert notifications
   */
  private async sendHealthAlert(summary: SystemHealthSummary, criticalChecks: HealthCheckResult[]): Promise<void> {
    const alertMessage = {
      timestamp: new Date().toISOString(),
      severity: 'CRITICAL',
      summary: `${criticalChecks.length} critical health issues detected`,
      details: criticalChecks.map(c => ({
        service: c.service,
        status: c.status,
        message: c.message
      })),
      systemStatus: summary.overallStatus
    };

    try {
      // Send webhook alert if configured
      if (this.config.alerting.webhookUrl) {
        const axios = require('axios');
        await axios.post(this.config.alerting.webhookUrl, alertMessage, {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      logger.error('Health alert sent', alertMessage);
    } catch (error) {
      logger.error('Failed to send health alert', { error: (error as Error).message });
    }
  }

  /**
   * Clean up old health history
   */
  private cleanupHealthHistory(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    for (const [service, history] of this.healthHistory.entries()) {
      const filtered = history.filter(check => check.timestamp.getTime() > cutoffTime);
      this.healthHistory.set(service, filtered);
    }
  }

  /**
   * Get current health summary
   */
  getHealthSummary(): SystemHealthSummary | null {
    return this.lastHealthSummary || null;
  }

  /**
   * Get health history for a service
   */
  getServiceHealthHistory(serviceName: string): HealthCheckResult[] {
    return this.healthHistory.get(serviceName) || [];
  }

  /**
   * Force health check execution
   */
  async forceHealthCheck(): Promise<SystemHealthSummary> {
    await this.performHealthChecks();
    return this.lastHealthSummary!;
  }

  /**
   * Get database connections count
   */
  private async getDatabaseConnections(): Promise<number> {
    try {
      // This would be implemented based on your database type
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get database version
   */
  private async getDatabaseVersion(): Promise<string> {
    try {
      // This would be implemented based on your database type
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get Redis connections count
   */
  private async getRedisConnections(): Promise<number> {
    try {
      // RedisService doesn't have info method, return fallback
      return 1;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get Redis memory usage
   */
  private async getRedisMemoryUsage(): Promise<{ used: number; total: number; percentage: number }> {
    try {
      // Note: RedisService.info() method not available in current implementation
      // Providing fallback memory usage estimation based on cache size
      const stats = this.redis.getStats();
      const estimatedUsed = stats.size * 1024; // Rough estimate: 1KB per key
      const estimatedTotal = estimatedUsed * 10; // Conservative total estimate
      const percentage = estimatedTotal > 0 ? Math.round((estimatedUsed / estimatedTotal) * 100) : 0;
      
      return { 
        used: estimatedUsed, 
        total: estimatedTotal, 
        percentage 
      };
    } catch (error) {
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * Create default health monitor configuration
   */
  static createDefaultConfig(): HealthMonitorConfig {
    return {
      checkInterval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      retries: 2,
      enabledChecks: [
        'database',
        'redis',
        'memory',
        'cpu',
        'disk',
        'circuitBreakers',
        'degradationServices'
      ],
      thresholds: {
        cpu: 80,
        memory: 85,
        responseTime: 2000,
        errorRate: 5
      },
      alerting: {
        enabled: true
      }
    };
  }

  /**
   * Create production health monitor configuration
   */
  static createProductionConfig(): HealthMonitorConfig {
    return {
      checkInterval: 15000, // 15 seconds
      timeout: 3000, // 3 seconds
      retries: 3,
      enabledChecks: [
        'database',
        'redis',
        'memory',
        'cpu',
        'disk',
        'circuitBreakers',
        'degradationServices'
      ],
      thresholds: {
        cpu: 70,
        memory: 80,
        responseTime: 1000,
        errorRate: 2
      },
      alerting: {
        enabled: true,
        webhookUrl: process.env.HEALTH_WEBHOOK_URL,
        emailRecipients: process.env.HEALTH_ALERT_EMAILS?.split(','),
        slackChannel: process.env.HEALTH_SLACK_CHANNEL
      }
    };
  }

  /**
   * Get system health summary
   */
  getSystemHealth(): SystemHealthSummary {
    return this.lastHealthSummary || {
      overallStatus: HealthSeverity.HEALTHY,
      totalServices: 0,
      healthyServices: 0,
      degradedServices: 0,
      failedServices: 0,
      lastUpdated: new Date(),
      checks: [],
      uptime: 100,
      systemMetrics: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: true
      },
      metadata: {
        monitoringDuration: Date.now() - this.startTime,
        totalChecks: 0,
        successfulChecks: 0
      }
    };
  }
}

export default HealthMonitorService;