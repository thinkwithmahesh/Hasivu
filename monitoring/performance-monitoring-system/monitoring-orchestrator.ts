/**
 * HASIVU Performance Monitoring System Orchestrator
 * Epic 3 → Story 3: Performance Monitoring System
 *
 * Main orchestrator that coordinates all monitoring components and provides
 * unified control plane for the comprehensive performance monitoring system
 * across 500+ school environments.
 */

import { EventEmitter } from 'events';
import { Logger, createLogger, format, transports } from 'winston';
import { MetricsCollector } from './1-real-time-monitoring/custom-monitoring-agents/metrics-collector';
import { AnomalyDetectionEngine } from './2-intelligent-alerting/ai-anomaly-detection/anomaly-engine';
import { DashboardEngine } from './3-performance-analytics/real-time-dashboards/dashboard-engine';
import { CircuitBreakerManager } from './4-automated-recovery/circuit-breaker-patterns/circuit-breaker';
import { PrivacyMonitoringEngine } from './5-compliance-monitoring/gdpr-coppa-compliance/privacy-monitoring';
import { SecurityMonitoringEngine } from './5-compliance-monitoring/security-compliance/security-monitoring';
import {
  HASIVUMonitoringIntegration,
  MonitoringConfig,
} from './6-integration-config/hasivu-integration/monitoring-integration';

export interface MonitoringSystemConfig {
  environment: 'development' | 'staging' | 'production';
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'simple';
    outputs: ('console' | 'file' | 'elasticsearch')[];
  };
  metrics: {
    collectionInterval: number;
    retentionPeriod: number;
    aggregationIntervals: string[];
    exporters: ('prometheus' | 'graphite' | 'datadog')[];
  };
  monitoring: MonitoringConfig['monitoring'];
  integrations: MonitoringConfig['integrations'];
  alerting: MonitoringConfig['alerting'];
  performance: {
    maxConcurrentQueries: number;
    queryTimeout: number;
    cacheSize: number;
    batchSize: number;
  };
  security: {
    enableTLS: boolean;
    requireAuthentication: boolean;
    allowedOrigins: string[];
    rateLimiting: {
      enabled: boolean;
      maxRequests: number;
      windowMs: number;
    };
  };
}

export interface SystemStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'MAINTENANCE';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  components: {
    metricsCollector: 'ACTIVE' | 'INACTIVE' | 'ERROR';
    anomalyDetection: 'ACTIVE' | 'INACTIVE' | 'ERROR';
    dashboards: 'ACTIVE' | 'INACTIVE' | 'ERROR';
    circuitBreakers: 'ACTIVE' | 'INACTIVE' | 'ERROR';
    privacyMonitoring: 'ACTIVE' | 'INACTIVE' | 'ERROR';
    securityMonitoring: 'ACTIVE' | 'INACTIVE' | 'ERROR';
    integration: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  };
  metrics: {
    totalMetrics: number;
    activeAlerts: number;
    circuitBreakersOpen: number;
    anomaliesDetected: number;
    complianceIssues: number;
  };
  performance: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    queryLatency: number;
    throughput: number;
  };
  errors: Array<{
    timestamp: Date;
    component: string;
    error: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
}

export interface MonitoringAPI {
  // System Control
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  getStatus(): Promise<SystemStatus>;

  // Configuration Management
  updateConfig(updates: Partial<MonitoringSystemConfig>): Promise<void>;
  getConfig(): MonitoringSystemConfig;

  // Metrics Operations
  getMetrics(query?: string, timeRange?: string): Promise<any>;
  createCustomMetric(definition: any): Promise<string>;

  // Dashboard Operations
  createDashboard(config: any): Promise<string>;
  getDashboardData(dashboardId: string, options?: any): Promise<any>;
  updateDashboard(dashboardId: string, updates: any): Promise<void>;

  // Alerting Operations
  createAlert(config: any): Promise<string>;
  getActiveAlerts(filters?: any): Promise<any[]>;
  acknowledgeAlert(alertId: string, userId: string): Promise<void>;

  // Compliance Operations
  getComplianceStatus(type?: 'privacy' | 'security'): Promise<any>;
  generateComplianceReport(type: string, schoolId?: string): Promise<any>;

  // Analytics Operations
  detectAnomalies(schoolId?: string): Promise<any[]>;
  getSystemHealth(schoolId?: string): Promise<any>;
  getPerformanceInsights(timeRange?: string): Promise<any>;
}

export class MonitoringSystemOrchestrator extends EventEmitter implements MonitoringAPI {
  private readonly config: MonitoringSystemConfig;
  private readonly logger: Logger;
  private readonly startTime: Date = new Date();

  // Core Components
  private metricsCollector?: MetricsCollector;
  private anomalyEngine?: AnomalyDetectionEngine;
  private dashboardEngine?: DashboardEngine;
  private circuitBreakerManager?: CircuitBreakerManager;
  private privacyEngine?: PrivacyMonitoringEngine;
  private securityEngine?: SecurityMonitoringEngine;
  private integration?: HASIVUMonitoringIntegration;

  // System State
  private isRunning: boolean = false;
  private systemErrors: SystemStatus['errors'] = [];
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(config: MonitoringSystemConfig) {
    super();
    this.config = config;
    this.logger = this.createLogger();
    this.setupErrorHandling();
  }

  /**
   * Start the monitoring system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Monitoring system is already running');
      return;
    }

    this.logger.info('Starting HASIVU Performance Monitoring System', {
      environment: this.config.environment,
      version: process.env.MONITORING_VERSION || '1.0.0',
    });

    try {
      // Initialize core components in dependency order
      await this.initializeComponents();

      // Start health monitoring
      this.startHealthMonitoring();

      // Setup component event listeners
      this.setupComponentEventListeners();

      this.isRunning = true;

      this.logger.info('HASIVU Performance Monitoring System started successfully', {
        uptime: this.getUptime(),
        components: this.getComponentStatus(),
      });

      this.emit('systemStarted', {
        timestamp: new Date(),
        environment: this.config.environment,
      });
    } catch (error) {
      this.logger.error('Failed to start monitoring system', {
        error: error.message,
        stack: error.stack,
      });

      await this.cleanup();
      throw error;
    }
  }

  /**
   * Stop the monitoring system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Monitoring system is not running');
      return;
    }

    this.logger.info('Stopping HASIVU Performance Monitoring System');

    try {
      // Stop health monitoring
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = undefined;
      }

      // Gracefully shutdown all components
      await this.cleanup();

      this.isRunning = false;

      this.logger.info('HASIVU Performance Monitoring System stopped successfully');

      this.emit('systemStopped', {
        timestamp: new Date(),
        uptime: this.getUptime(),
      });
    } catch (error) {
      this.logger.error('Error stopping monitoring system', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Restart the monitoring system
   */
  async restart(): Promise<void> {
    this.logger.info('Restarting HASIVU Performance Monitoring System');

    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await this.start();

    this.emit('systemRestarted', {
      timestamp: new Date(),
    });
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<SystemStatus> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Get component metrics
    const totalMetrics = this.metricsCollector?.getMetricsSummary()?.totalMetrics || 0;
    const anomaliesDetected = this.anomalyEngine?.getDetectionSummary()?.total || 0;

    // Calculate performance metrics
    const queryLatency = await this.measureQueryLatency();
    const throughput = await this.calculateThroughput();

    return {
      status: this.determineOverallStatus(),
      timestamp: new Date(),
      uptime: this.getUptime(),
      version: process.env.MONITORING_VERSION || '1.0.0',
      environment: this.config.environment,
      components: this.getComponentStatus(),
      metrics: {
        totalMetrics,
        activeAlerts: this.getActiveAlertCount(),
        circuitBreakersOpen: this.getOpenCircuitBreakerCount(),
        anomaliesDetected,
        complianceIssues: this.getComplianceIssueCount(),
      },
      performance: {
        memoryUsage,
        cpuUsage,
        queryLatency,
        throughput,
      },
      errors: this.systemErrors.slice(-10), // Last 10 errors
    };
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<MonitoringSystemConfig>): Promise<void> {
    this.logger.info('Updating monitoring system configuration', { updates });

    // Merge configuration updates
    Object.assign(this.config, updates);

    // Apply configuration changes to components
    if (this.integration && updates.monitoring) {
      // Update integration configuration
      await this.integration.shutdown();
      await this.initializeIntegration();
    }

    // Restart components if necessary
    if (updates.metrics && this.metricsCollector) {
      this.metricsCollector.stop();
      await this.initializeMetricsCollector();
    }

    this.emit('configUpdated', { updates, timestamp: new Date() });
  }

  /**
   * Get current configuration
   */
  getConfig(): MonitoringSystemConfig {
    return { ...this.config };
  }

  /**
   * Get metrics data
   */
  async getMetrics(query?: string, timeRange?: string): Promise<any> {
    if (!this.metricsCollector) {
      throw new Error('Metrics collector not initialized');
    }

    if (query) {
      return await this.metricsCollector.queryMetrics({
        query,
        start: timeRange ? new Date(Date.now() - this.parseTimeRange(timeRange)) : undefined,
        end: new Date(),
      });
    }

    return await this.metricsCollector.getMetrics();
  }

  /**
   * Create custom metric
   */
  async createCustomMetric(definition: any): Promise<string> {
    if (!this.metricsCollector) {
      throw new Error('Metrics collector not initialized');
    }

    this.metricsCollector.defineMetric(definition);
    return definition.name;
  }

  /**
   * Create dashboard
   */
  async createDashboard(config: any): Promise<string> {
    if (!this.dashboardEngine) {
      throw new Error('Dashboard engine not initialized');
    }

    this.dashboardEngine.createDashboard(config);
    return config.id;
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(dashboardId: string, options?: any): Promise<any> {
    if (!this.dashboardEngine) {
      throw new Error('Dashboard engine not initialized');
    }

    return await this.dashboardEngine.getDashboardData(
      dashboardId,
      options?.timeRange,
      options?.variables
    );
  }

  /**
   * Update dashboard
   */
  async updateDashboard(dashboardId: string, updates: any): Promise<void> {
    // Implementation would update dashboard configuration
    this.logger.info('Dashboard updated', { dashboardId, updates });
  }

  /**
   * Create alert
   */
  async createAlert(config: any): Promise<string> {
    if (!this.metricsCollector) {
      throw new Error('Metrics collector not initialized');
    }

    return this.metricsCollector.addAlertRule('global', config);
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(filters?: any): Promise<any[]> {
    // Implementation would return active alerts
    return [];
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    this.logger.info('Alert acknowledged', { alertId, userId });
  }

  /**
   * Get compliance status
   */
  async getComplianceStatus(type?: 'privacy' | 'security'): Promise<any> {
    const status: any = {};

    if (!type || type === 'privacy') {
      if (this.privacyEngine) {
        status.privacy = await this.privacyEngine.generateComplianceReport(
          'global',
          'PRIVACY_AUDIT',
          {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date(),
          }
        );
      }
    }

    if (!type || type === 'security') {
      if (this.securityEngine) {
        status.security = await this.securityEngine.getSecurityDashboard();
      }
    }

    return status;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(type: string, schoolId?: string): Promise<any> {
    if (type === 'privacy' && this.privacyEngine) {
      return await this.privacyEngine.generateComplianceReport(
        schoolId || 'global',
        'PRIVACY_AUDIT',
        {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
        }
      );
    }

    if (type === 'security' && this.securityEngine) {
      return await this.securityEngine.getSecurityDashboard(schoolId);
    }

    throw new Error(`Unsupported compliance report type: ${type}`);
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(schoolId?: string): Promise<any[]> {
    if (!this.anomalyEngine) {
      throw new Error('Anomaly detection engine not initialized');
    }

    return await this.anomalyEngine.detectAnomalies(schoolId);
  }

  /**
   * Get system health
   */
  async getSystemHealth(schoolId?: string): Promise<any> {
    if (!this.circuitBreakerManager) {
      throw new Error('Circuit breaker manager not initialized');
    }

    return await this.circuitBreakerManager.getSystemHealth();
  }

  /**
   * Get performance insights
   */
  async getPerformanceInsights(timeRange?: string): Promise<any> {
    if (!this.dashboardEngine) {
      throw new Error('Dashboard engine not initialized');
    }

    return await this.dashboardEngine.getExecutiveSummary();
  }

  /**
   * Initialize all monitoring components
   */
  private async initializeComponents(): Promise<void> {
    this.logger.info('Initializing monitoring components');

    // Initialize metrics collector first (required by others)
    await this.initializeMetricsCollector();

    // Initialize anomaly detection engine
    await this.initializeAnomalyEngine();

    // Initialize dashboard engine
    await this.initializeDashboardEngine();

    // Initialize circuit breaker manager
    await this.initializeCircuitBreakerManager();

    // Initialize compliance engines
    await this.initializePrivacyEngine();
    await this.initializeSecurityEngine();

    // Initialize HASIVU integration (depends on all others)
    await this.initializeIntegration();

    this.logger.info('All monitoring components initialized successfully');
  }

  private async initializeMetricsCollector(): Promise<void> {
    this.logger.debug('Initializing metrics collector');
    this.metricsCollector = new MetricsCollector(this.logger);
    this.logger.debug('Metrics collector initialized');
  }

  private async initializeAnomalyEngine(): Promise<void> {
    if (!this.metricsCollector) {
      throw new Error('Metrics collector must be initialized first');
    }

    this.logger.debug('Initializing anomaly detection engine');
    this.anomalyEngine = new AnomalyDetectionEngine(this.logger, this.metricsCollector);
    this.logger.debug('Anomaly detection engine initialized');
  }

  private async initializeDashboardEngine(): Promise<void> {
    if (!this.metricsCollector) {
      throw new Error('Metrics collector must be initialized first');
    }

    this.logger.debug('Initializing dashboard engine');
    this.dashboardEngine = new DashboardEngine(this.logger, this.metricsCollector);
    this.logger.debug('Dashboard engine initialized');
  }

  private async initializeCircuitBreakerManager(): Promise<void> {
    this.logger.debug('Initializing circuit breaker manager');
    this.circuitBreakerManager = new CircuitBreakerManager(this.logger, this.metricsCollector!);
    this.logger.debug('Circuit breaker manager initialized');
  }

  private async initializePrivacyEngine(): Promise<void> {
    if (!this.config.monitoring.compliance.privacy) {
      this.logger.debug('Privacy monitoring disabled');
      return;
    }

    this.logger.debug('Initializing privacy monitoring engine');
    this.privacyEngine = new PrivacyMonitoringEngine(this.logger, this.metricsCollector!);
    this.logger.debug('Privacy monitoring engine initialized');
  }

  private async initializeSecurityEngine(): Promise<void> {
    if (!this.config.monitoring.compliance.security) {
      this.logger.debug('Security monitoring disabled');
      return;
    }

    this.logger.debug('Initializing security monitoring engine');
    this.securityEngine = new SecurityMonitoringEngine(this.logger, this.metricsCollector!);
    this.logger.debug('Security monitoring engine initialized');
  }

  private async initializeIntegration(): Promise<void> {
    if (
      !this.metricsCollector ||
      !this.anomalyEngine ||
      !this.dashboardEngine ||
      !this.circuitBreakerManager
    ) {
      throw new Error('All core components must be initialized first');
    }

    this.logger.debug('Initializing HASIVU integration');

    const integrationConfig: MonitoringConfig = {
      enabled: true,
      environment: this.config.environment,
      monitoring: this.config.monitoring,
      integrations: this.config.integrations,
      alerting: this.config.alerting,
    };

    this.integration = new HASIVUMonitoringIntegration(
      integrationConfig,
      this.logger,
      this.metricsCollector,
      this.anomalyEngine,
      this.dashboardEngine,
      this.circuitBreakerManager,
      this.privacyEngine!,
      this.securityEngine!
    );

    this.logger.debug('HASIVU integration initialized');
  }

  /**
   * Setup component event listeners
   */
  private setupComponentEventListeners(): void {
    // Metrics collector events
    if (this.metricsCollector) {
      this.metricsCollector.on('metricRecorded', metric => {
        this.emit('metricRecorded', metric);
      });
    }

    // Anomaly detection events
    if (this.anomalyEngine) {
      this.anomalyEngine.on('anomalyDetected', anomaly => {
        this.emit('anomalyDetected', anomaly);
      });
    }

    // Dashboard events
    if (this.dashboardEngine) {
      this.dashboardEngine.on('dashboardDataLoaded', data => {
        this.emit('dashboardDataLoaded', data);
      });
    }

    // Integration events
    if (this.integration) {
      this.integration.on('healthStatusUpdate', status => {
        this.emit('healthStatusUpdate', status);
      });

      this.integration.on('anomalyAlert', alert => {
        this.emit('anomalyAlert', alert);
      });
    }

    this.logger.debug('Component event listeners configured');
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        const status = await this.getStatus();
        this.emit('healthCheck', status);

        // Check for critical issues
        if (status.status === 'UNHEALTHY') {
          this.logger.error('System health check failed', {
            components: status.components,
            errors: status.errors,
          });
        }
      } catch (error) {
        this.logger.error('Health check error', { errorMessage: error.message });
      }
    }, 30000); // Every 30 seconds

    this.logger.debug('Health monitoring started');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    process.on('uncaughtException', error => {
      this.logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });

      this.recordSystemError('SYSTEM', error.message, 'CRITICAL');
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection', {
        reason,
        promise,
      });

      this.recordSystemError('SYSTEM', `Unhandled rejection: ${reason}`, 'HIGH');
    });
  }

  /**
   * Record system error
   */
  private recordSystemError(
    component: string,
    error: string,
    severity: SystemStatus['errors'][0]['severity']
  ): void {
    this.systemErrors.push({
      timestamp: new Date(),
      component,
      error,
      severity,
    });

    // Keep only last 100 errors
    if (this.systemErrors.length > 100) {
      this.systemErrors = this.systemErrors.slice(-100);
    }

    this.emit('systemError', { component, error, severity, timestamp: new Date() });
  }

  /**
   * Helper methods
   */
  private createLogger(): Logger {
    return createLogger({
      level: this.config.logging.level,
      format:
        this.config.logging.format === 'json'
          ? format.combine(format.timestamp(), format.errors({ stack: true }), format.json())
          : format.combine(format.colorize(), format.timestamp(), format.simple()),
      transports: this.createLogTransports(),
      defaultMeta: {
        service: 'hasivu-monitoring',
        environment: this.config.environment,
      },
    });
  }

  private createLogTransports(): any[] {
    const transports_list = [];

    if (this.config.logging.outputs.includes('console')) {
      transports_list.push(new transports.Console());
    }

    if (this.config.logging.outputs.includes('file')) {
      transports_list.push(
        new transports.File({
          filename: 'logs/monitoring-system.log',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        })
      );
    }

    return transports_list;
  }

  private getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  private getComponentStatus(): SystemStatus['components'] {
    return {
      metricsCollector: this.metricsCollector ? 'ACTIVE' : 'INACTIVE',
      anomalyDetection: this.anomalyEngine ? 'ACTIVE' : 'INACTIVE',
      dashboards: this.dashboardEngine ? 'ACTIVE' : 'INACTIVE',
      circuitBreakers: this.circuitBreakerManager ? 'ACTIVE' : 'INACTIVE',
      privacyMonitoring: this.privacyEngine ? 'ACTIVE' : 'INACTIVE',
      securityMonitoring: this.securityEngine ? 'ACTIVE' : 'INACTIVE',
      integration: this.integration ? 'ACTIVE' : 'INACTIVE',
    };
  }

  private determineOverallStatus(): SystemStatus['status'] {
    if (!this.isRunning) return 'UNHEALTHY';

    const components = this.getComponentStatus();
    const inactiveCount = Object.values(components).filter(status => status !== 'ACTIVE').length;

    if (inactiveCount === 0) return 'HEALTHY';
    if (inactiveCount <= 2) return 'DEGRADED';
    return 'UNHEALTHY';
  }

  private getActiveAlertCount(): number {
    // Implementation would count active alerts
    return 0;
  }

  private getOpenCircuitBreakerCount(): number {
    if (!this.circuitBreakerManager) return 0;

    const metrics = this.circuitBreakerManager.getAllMetrics();
    // Implementation would count open circuit breakers
    return 0;
  }

  private getComplianceIssueCount(): number {
    // Implementation would count compliance issues
    return 0;
  }

  private async measureQueryLatency(): Promise<number> {
    if (!this.metricsCollector) return 0;

    const start = Date.now();
    try {
      await this.metricsCollector.getMetrics();
      return Date.now() - start;
    } catch {
      return -1;
    }
  }

  private async calculateThroughput(): Promise<number> {
    // Implementation would calculate system throughput
    return 0;
  }

  private parseTimeRange(timeRange: string): number {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

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
        return 60 * 60 * 1000; // Default 1 hour
    }
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    this.logger.debug('Cleaning up monitoring system resources');

    // Stop all components
    if (this.integration) {
      this.integration.shutdown();
    }

    if (this.metricsCollector) {
      this.metricsCollector.stop();
    }

    if (this.anomalyEngine) {
      this.anomalyEngine.stop();
    }

    if (this.dashboardEngine) {
      this.dashboardEngine.destroy();
    }

    // Clear timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    this.logger.debug('Cleanup completed');
  }
}

/**
 * Factory function to create monitoring system with default configuration
 */
export function createMonitoringSystem(
  config?: Partial<MonitoringSystemConfig>
): MonitoringSystemOrchestrator {
  const defaultConfig: MonitoringSystemConfig = {
    environment: (process.env.NODE_ENV as any) || 'development',
    logging: {
      level: 'info',
      format: 'json',
      outputs: ['console', 'file'],
    },
    metrics: {
      collectionInterval: 15000,
      retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
      aggregationIntervals: ['1m', '5m', '15m', '1h', '1d'],
      exporters: ['prometheus'],
    },
    monitoring: {
      metricsCollection: {
        enabled: true,
        interval: 15000,
        retention: 90 * 24 * 60 * 60 * 1000,
      },
      anomalyDetection: {
        enabled: true,
        sensitivity: 0.7,
        models: ['statistical_general', 'lstm_timeseries', 'isolation_forest'],
      },
      dashboards: {
        enabled: true,
        refreshInterval: 30000,
        defaultTimeRange: '1h',
      },
      circuitBreakers: {
        enabled: true,
        defaultTimeout: 5000,
        errorThreshold: 10,
      },
      compliance: {
        privacy: true,
        security: true,
        auditLogging: true,
      },
    },
    integrations: {
      database: {
        enabled: true,
        connectionPoolMonitoring: true,
        queryPerformanceTracking: true,
        slowQueryThreshold: 1000,
      },
      authentication: {
        enabled: true,
        sessionTracking: true,
        securityEventMonitoring: true,
        bruteForceDetection: true,
      },
      businessLogic: {
        enabled: true,
        kitchenOperations: true,
        vendorMarketplace: true,
        predictiveAnalytics: true,
        crossSchoolAnalytics: true,
      },
      infrastructure: {
        enabled: true,
        kubernetesMetrics: true,
        cloudProviderMetrics: true,
        networkMonitoring: true,
      },
    },
    alerting: {
      channels: {
        email: true,
        slack: true,
        webhook: true,
        sms: false,
      },
      escalation: {
        enabled: true,
        levels: 3,
        timeouts: [300, 900, 1800], // 5min, 15min, 30min
      },
    },
    performance: {
      maxConcurrentQueries: 100,
      queryTimeout: 30000,
      cacheSize: 1000,
      batchSize: 100,
    },
    security: {
      enableTLS: true,
      requireAuthentication: true,
      allowedOrigins: ['*'],
      rateLimiting: {
        enabled: true,
        maxRequests: 1000,
        windowMs: 60000,
      },
    },
  };

  const finalConfig = { ...defaultConfig, ...config };
  return new MonitoringSystemOrchestrator(finalConfig);
}

export default MonitoringSystemOrchestrator;
