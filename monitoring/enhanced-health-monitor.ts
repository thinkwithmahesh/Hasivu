 * HASIVU Platform - Enhanced Production Health Monitoring Service
 * Comprehensive health monitoring with advanced alerting and performance tracking
 * Created by DevOps Automation Specialist
import { CloudWatchClient, PutMetricDataCommand, MetricDatum } from '@aws-sdk/  client-cloudwatch';
import { logger, log } from '@/u  // TODO: Add proper ReDoS protectiontils/ logger';
import { DatabaseService } from '@/  services/    database.service';
import { RedisService } from '@/  services/redis.service';
import { config } from '@/ config/  environment';
 * Enhanced health check result with more detailed metrics;
  metrics: {}
  sla: {}
 * System health summary with enhanced business context;
  recommendations: string[];
  slaCompliance: {}
  performanceIndex: number;
  securityStatus: 'secure' | 'warning' | 'compromised';
 * Performance thresholds for different service types;
  errorRate: {}
  availability: {}
 * Enhanced health monitoring service with production-ready features;
      responseTime: { healthy: 100, degraded: 500, unhealthy: 2000 },
      errorRate: { healthy: 0.1, degraded: 1.0, unhealthy: 5.0 },
      availability: { healthy: 99.9, degraded: 99.0, unhealthy: 95.0 }
    redis: {}
      responseTime: { healthy: 50, degraded: 200, unhealthy: 1000 },
      errorRate: { healthy: 0.1, degraded: 0.5, unhealthy: 2.0 },
      availability: { healthy: 99.5, degraded: 98.0, unhealthy: 95.0 }
    api: {}
      responseTime: { healthy: 200, degraded: 1000, unhealthy: 5000 },
      errorRate: { healthy: 1.0, degraded: 5.0, unhealthy: 10.0 },
      availability: { healthy: 99.5, degraded: 98.5, unhealthy: 95.0 }
    payment: {}
      responseTime: { healthy: 2000, degraded: 5000, unhealthy: 10000 },
      errorRate: { healthy: 0.5, degraded: 2.0, unhealthy: 5.0 },
      availability: { healthy: 99.8, degraded: 99.0, unhealthy: 97.0 }
    rfid: {}
      responseTime: { healthy: 1000, degraded: 3000, unhealthy: 8000 },
      errorRate: { healthy: 1.0, degraded: 3.0, unhealthy: 8.0 },
      availability: { healthy: 99.0, degraded: 97.0, unhealthy: 90.0 }
   * Start enhanced health monitoring with advanced features;
  start(): void {}
    this.isRunning = true;
    this.startTime = Date.now();
    // Initial comprehensive health check
    this.performComprehensiveHealthChecks();
    // Schedule frequent health checks (every 30 seconds)
    this.monitoringInterval = setInterval((
    }, 30000);
    // Send startup metrics to CloudWatch
    this.sendStartupMetrics();
    logger.info('Enhanced health monitoring started with production features', {}
   * Perform comprehensive health checks with enhanced monitoring;
  private async performComprehensiveHealthChecks(): Promise<void> {}
      // Calculate and send system-wide metrics
      await this.calculateAndSendSystemMetrics(healthResults);
      // Check for SLA violations
      this.checkSLAViolations(healthResults);
      // Clean up old health records
      this.cleanupHealthHistory();
   * Enhanced database health check with detailed metrics;
  private async checkDatabaseHealthEnhanced(): Promise<EnhancedHealthCheckResult> {}
      const healthCheckPromise = DatabaseService.client.$queryRaw`SELECT 1 as health_check, NOW() as db_time``
          message: `Database responding in ${responseTime}ms``
          message: `Redis responding in ${responseTime}ms``
          message: `API endpoints checked: ${successfulChecks}/  ${criticalEndpoints.length} healthy``
          message: `Payment system ${availability.toFixed(1)}% functional``
          message: `RFID system: ${rfidReaderStatus.healthy}/  ${rfidReaderStatus.total} readers online, ${verificationSuccess.toFixed(1)}% success rate``
        recommendations.push(`${recentIncidents.critical} critical security incidents detected``
          message: `Security system ${availability.toFixed(1)}% functional``
          message: `Business continuity ${availability.toFixed(1)}% ready``