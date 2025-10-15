/**
 * Monitoring Dashboard Service
 * Provides real-time monitoring data and health metrics
 */

import { performanceService } from './performance.service';
import { databaseService } from './database.service';
import { redisService } from './redis.service';
import os from 'os';

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  lastCheck: Date;
  message?: string;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  timestamp: Date;
}

export interface DashboardData {
  health: ServiceHealth[];
  metrics: SystemMetrics;
  performance: {
    avgResponseTime: number;
    requestCount: number;
    errorRate: number;
  };
}

export class MonitoringDashboardService {
  private static instance: MonitoringDashboardService;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): MonitoringDashboardService {
    if (!MonitoringDashboardService.instance) {
      MonitoringDashboardService.instance = new MonitoringDashboardService();
    }
    return MonitoringDashboardService.instance;
  }

  /**
   * Check health of all services
   */
  public async checkAllServices(): Promise<ServiceHealth[]> {
    const services: ServiceHealth[] = [];

    // Check database
    try {
      const dbHealth = await databaseService.healthCheck();
      services.push({
        service: 'database',
        status: dbHealth.healthy ? 'healthy' : 'unhealthy',
        latency: dbHealth.latency,
        lastCheck: new Date(),
      });
    } catch (error) {
      services.push({
        service: 'database',
        status: 'unhealthy',
        lastCheck: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check Redis
    try {
      const redisHealth = await redisService.healthCheck();
      services.push({
        service: 'redis',
        status: redisHealth.healthy ? 'healthy' : 'unhealthy',
        latency: redisHealth.latency,
        lastCheck: new Date(),
      });
    } catch (error) {
      services.push({
        service: 'redis',
        status: 'unhealthy',
        lastCheck: new Date(),
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return services;
  }

  /**
   * Get system metrics
   */
  public getSystemMetrics(): SystemMetrics {
    const memUsage = performanceService.getMemoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;

    return {
      cpu: {
        usage: 0, // Stub - would use actual CPU monitoring
        cores: os.cpus().length,
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100,
      },
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }

  /**
   * Get dashboard data
   */
  public async getDashboardData(): Promise<DashboardData> {
    const health = await this.checkAllServices();
    const metrics = this.getSystemMetrics();

    // Get performance data from last hour
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
    const perfReport = performanceService.generateReport(startDate, endDate);

    return {
      health,
      metrics,
      performance: {
        avgResponseTime: perfReport.summary.avgResponseTime,
        requestCount: perfReport.summary.totalRequests,
        errorRate: perfReport.summary.errorRate,
      },
    };
  }

  /**
   * Start automatic health checks
   */
  public startHealthChecks(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      return; // Already running
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkAllServices();
      } catch (error) {
        // Error handled silently
      }
    }, intervalMs);
  }

  /**
   * Stop automatic health checks
   */
  public stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get service status
   */
  public async getServiceStatus(serviceName: string): Promise<ServiceHealth | null> {
    const allServices = await this.checkAllServices();
    return allServices.find(s => s.service === serviceName) || null;
  }

  /**
   * Get alerts based on thresholds
   */
  public async getAlerts(): Promise<Array<{ severity: 'warning' | 'critical'; message: string }>> {
    const alerts: Array<{ severity: 'warning' | 'critical'; message: string }> = [];
    const health = await this.checkAllServices();
    const metrics = this.getSystemMetrics();

    // Check for unhealthy services
    health.forEach(service => {
      if (service.status === 'unhealthy') {
        alerts.push({
          severity: 'critical',
          message: `Service ${service.service} is unhealthy: ${service.message || 'Unknown error'}`,
        });
      } else if (service.status === 'degraded') {
        alerts.push({
          severity: 'warning',
          message: `Service ${service.service} is degraded`,
        });
      }
    });

    // Check memory usage
    if (metrics.memory.percentage > 90) {
      alerts.push({
        severity: 'critical',
        message: `Memory usage is critical: ${metrics.memory.percentage.toFixed(1)}%`,
      });
    } else if (metrics.memory.percentage > 80) {
      alerts.push({
        severity: 'warning',
        message: `Memory usage is high: ${metrics.memory.percentage.toFixed(1)}%`,
      });
    }

    return alerts;
  }
}

// Export singleton instance
export const monitoringDashboardService = MonitoringDashboardService.getInstance();

// Export for direct access
export default MonitoringDashboardService;
