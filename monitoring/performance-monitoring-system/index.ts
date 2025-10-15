/**
 * HASIVU Performance Monitoring System - Main Entry Point
 * Epic 3 → Story 3: Performance Monitoring System
 *
 * Comprehensive performance monitoring system providing real-time observability,
 * intelligent alerting, automated incident response, and proactive performance
 * optimization across the entire HASIVU ecosystem supporting 500+ schools.
 *
 * @version 1.0.0
 * @author HASIVU DevOps Team
 * @license MIT
 */

// Core System Components
export {
  default as MonitoringSystemOrchestrator,
  createMonitoringSystem,
} from './monitoring-orchestrator';
export type {
  MonitoringSystemConfig,
  SystemStatus,
  MonitoringAPI,
} from './monitoring-orchestrator';

// Real-Time Monitoring Components
export { default as MetricsCollector } from './1-real-time-monitoring/custom-monitoring-agents/metrics-collector';
export type {
  MetricDefinition,
  MetricValue,
  CustomMetric,
  MetricAggregation,
  AlertRule,
  MetricQuery,
  QueryResult,
} from './1-real-time-monitoring/custom-monitoring-agents/metrics-collector';

// Intelligent Alerting Components
export { default as AnomalyDetectionEngine } from './2-intelligent-alerting/ai-anomaly-detection/anomaly-engine';
export type {
  AnomalyModel,
  AnomalyDetection,
  StatisticalFeatures,
  TemporalFeatures,
  ContextualFeatures,
  AnomalyPattern,
  ModelTrainingData,
  ModelPrediction,
} from './2-intelligent-alerting/ai-anomaly-detection/anomaly-engine';

// Performance Analytics Components
export { default as DashboardEngine } from './3-performance-analytics/real-time-dashboards/dashboard-engine';
export type {
  DashboardConfig,
  DashboardFilter,
  DashboardVariable,
  PanelConfig,
  QueryTarget,
  DataTransform,
  VisualizationConfig,
  AxisConfig,
  Threshold,
  AlertConfig,
  NotificationConfig,
  DashboardData,
  PanelData,
  DataSeries,
  DataPoint,
  SLAConfig,
  SLAStatus,
} from './3-performance-analytics/real-time-dashboards/dashboard-engine';

// Automated Recovery Components
export {
  default as CircuitBreaker,
  CircuitBreakerManager,
} from './4-automated-recovery/circuit-breaker-patterns/circuit-breaker';
export type {
  CircuitState,
  FailureType,
  CircuitBreakerConfig,
  CircuitMetrics,
  CircuitEvent,
  FallbackStrategy,
  HealthCheck,
  ServiceDependency,
} from './4-automated-recovery/circuit-breaker-patterns/circuit-breaker';

// Compliance Monitoring Components
export { default as PrivacyMonitoringEngine } from './5-compliance-monitoring/gdpr-coppa-compliance/privacy-monitoring';
export type {
  PrivacyEvent,
  ConsentRecord,
  DataRetentionPolicy,
  ComplianceAlert,
} from './5-compliance-monitoring/gdpr-coppa-compliance/privacy-monitoring';

export { default as SecurityMonitoringEngine } from './5-compliance-monitoring/security-compliance/security-monitoring';
export type {
  SecurityEvent,
  VulnerabilityAssessment,
  Vulnerability,
  ComplianceStatus,
  RemediationAction,
  ThreatIntelligence,
} from './5-compliance-monitoring/security-compliance/security-monitoring';

// Integration Components
export { default as HASIVUMonitoringIntegration } from './6-integration-config/hasivu-integration/monitoring-integration';
export type {
  MonitoringConfig,
  HASIVUComponent,
  MonitoringState,
} from './6-integration-config/hasivu-integration/monitoring-integration';

/**
 * Pre-configured monitoring system instances for different environments
 */
export const MonitoringProfiles = {
  /**
   * Development environment configuration
   * - Reduced retention periods
   * - Increased logging verbosity
   * - Relaxed thresholds
   * - Local storage only
   */
  development: {
    environment: 'development' as const,
    logging: {
      level: 'debug' as const,
      format: 'simple' as const,
      outputs: ['console' as const],
    },
    metrics: {
      collectionInterval: 30000, // 30 seconds
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      aggregationIntervals: ['1m', '5m', '15m', '1h'],
      exporters: ['prometheus' as const],
    },
    monitoring: {
      metricsCollection: {
        enabled: true,
        interval: 30000,
        retention: 7 * 24 * 60 * 60 * 1000,
      },
      anomalyDetection: {
        enabled: true,
        sensitivity: 0.5, // Lower sensitivity for dev
        models: ['statistical_general'],
      },
      dashboards: {
        enabled: true,
        refreshInterval: 60000, // 1 minute
        defaultTimeRange: '1h',
      },
      circuitBreakers: {
        enabled: true,
        defaultTimeout: 10000, // 10 seconds
        errorThreshold: 20, // Higher threshold for dev
      },
      compliance: {
        privacy: false,
        security: false,
        auditLogging: false,
      },
    },
    alerting: {
      channels: {
        email: false,
        slack: false,
        webhook: false,
        sms: false,
      },
      escalation: {
        enabled: false,
        levels: 1,
        timeouts: [600],
      },
    },
  },

  /**
   * Staging environment configuration
   * - Production-like settings
   * - Enhanced testing capabilities
   * - Moderate retention periods
   * - Full compliance monitoring
   */
  staging: {
    environment: 'staging' as const,
    logging: {
      level: 'info' as const,
      format: 'json' as const,
      outputs: ['console' as const, 'file' as const],
    },
    metrics: {
      collectionInterval: 20000, // 20 seconds
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
      aggregationIntervals: ['1m', '5m', '15m', '1h', '1d'],
      exporters: ['prometheus' as const],
    },
    monitoring: {
      metricsCollection: {
        enabled: true,
        interval: 20000,
        retention: 30 * 24 * 60 * 60 * 1000,
      },
      anomalyDetection: {
        enabled: true,
        sensitivity: 0.7,
        models: ['statistical_general', 'lstm_timeseries'],
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
    alerting: {
      channels: {
        email: true,
        slack: true,
        webhook: false,
        sms: false,
      },
      escalation: {
        enabled: true,
        levels: 2,
        timeouts: [300, 900],
      },
    },
  },

  /**
   * Production environment configuration
   * - Maximum reliability and performance
   * - Full feature set enabled
   * - Extended retention periods
   * - Comprehensive alerting
   */
  production: {
    environment: 'production' as const,
    logging: {
      level: 'info' as const,
      format: 'json' as const,
      outputs: ['console' as const, 'file' as const, 'elasticsearch' as const],
    },
    metrics: {
      collectionInterval: 15000, // 15 seconds
      retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
      aggregationIntervals: ['1m', '5m', '15m', '1h', '1d', '7d'],
      exporters: ['prometheus' as const, 'datadog' as const],
    },
    monitoring: {
      metricsCollection: {
        enabled: true,
        interval: 15000,
        retention: 90 * 24 * 60 * 60 * 1000,
      },
      anomalyDetection: {
        enabled: true,
        sensitivity: 0.8, // High sensitivity for production
        models: ['statistical_general', 'lstm_timeseries', 'isolation_forest', 'ensemble_advanced'],
      },
      dashboards: {
        enabled: true,
        refreshInterval: 15000,
        defaultTimeRange: '1h',
      },
      circuitBreakers: {
        enabled: true,
        defaultTimeout: 3000,
        errorThreshold: 5, // Strict threshold for production
      },
      compliance: {
        privacy: true,
        security: true,
        auditLogging: true,
      },
    },
    alerting: {
      channels: {
        email: true,
        slack: true,
        webhook: true,
        sms: true,
      },
      escalation: {
        enabled: true,
        levels: 3,
        timeouts: [300, 900, 1800], // 5min, 15min, 30min
      },
    },
  },
};

/**
 * Monitoring system factory with pre-configured profiles
 */
export class MonitoringSystemFactory {
  /**
   * Create monitoring system for development environment
   */
  static createDevelopment(overrides?: Partial<typeof MonitoringProfiles.development>) {
    const config = { ...MonitoringProfiles.development, ...overrides };
    return createMonitoringSystem(config);
  }

  /**
   * Create monitoring system for staging environment
   */
  static createStaging(overrides?: Partial<typeof MonitoringProfiles.staging>) {
    const config = { ...MonitoringProfiles.staging, ...overrides };
    return createMonitoringSystem(config);
  }

  /**
   * Create monitoring system for production environment
   */
  static createProduction(overrides?: Partial<typeof MonitoringProfiles.production>) {
    const config = { ...MonitoringProfiles.production, ...overrides };
    return createMonitoringSystem(config);
  }

  /**
   * Create monitoring system from environment variable
   */
  static createFromEnvironment(overrides?: any) {
    const env = process.env.NODE_ENV || 'development';

    switch (env) {
      case 'production':
        return this.createProduction(overrides);
      case 'staging':
        return this.createStaging(overrides);
      case 'development':
      default:
        return this.createDevelopment(overrides);
    }
  }
}

/**
 * Utility functions for monitoring operations
 */
export const MonitoringUtils = {
  /**
   * Validate monitoring configuration
   */
  validateConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.environment) {
      errors.push('Environment must be specified');
    }

    if (config.metrics?.collectionInterval < 1000) {
      errors.push('Collection interval must be at least 1000ms');
    }

    if (config.metrics?.retentionPeriod < 3600000) {
      errors.push('Retention period must be at least 1 hour');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Parse time range string to milliseconds
   */
  parseTimeRange(timeRange: string): number {
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
      case 'w':
        return value * 7 * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Invalid time unit: ${unit}`);
    }
  },

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },

  /**
   * Format duration to human readable string
   */
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },

  /**
   * Calculate percentile from array of numbers
   */
  calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  },
};

/**
 * Constants used throughout the monitoring system
 */
export const MonitoringConstants = {
  // Metric name prefixes
  METRIC_PREFIX: 'hasivu_',

  // Default time ranges
  TIME_RANGES: {
    LAST_5_MINUTES: '5m',
    LAST_15_MINUTES: '15m',
    LAST_1_HOUR: '1h',
    LAST_6_HOURS: '6h',
    LAST_24_HOURS: '24h',
    LAST_7_DAYS: '7d',
    LAST_30_DAYS: '30d',
  },

  // Alert severity levels
  ALERT_SEVERITY: {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
    INFO: 'INFO',
  },

  // Circuit breaker states
  CIRCUIT_STATES: {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN',
  },

  // Component status values
  COMPONENT_STATUS: {
    HEALTHY: 'HEALTHY',
    DEGRADED: 'DEGRADED',
    UNHEALTHY: 'UNHEALTHY',
    UNKNOWN: 'UNKNOWN',
  },

  // System status values
  SYSTEM_STATUS: {
    HEALTHY: 'HEALTHY',
    DEGRADED: 'DEGRADED',
    UNHEALTHY: 'UNHEALTHY',
    MAINTENANCE: 'MAINTENANCE',
  },

  // SLA compliance levels
  SLA_COMPLIANCE: {
    COMPLIANT: 'COMPLIANT',
    WARNING: 'WARNING',
    NON_COMPLIANT: 'NON_COMPLIANT',
  },

  // Default SLA targets
  DEFAULT_SLA_TARGETS: {
    AVAILABILITY: 99.9, // 99.9%
    RESPONSE_TIME: 200, // 200ms
    ERROR_RATE: 0.1, // 0.1%
    THROUGHPUT: 1000, // 1000 requests/minute
  },
};

/**
 * Version information
 */
export const VERSION = {
  MAJOR: 1,
  MINOR: 0,
  PATCH: 0,
  BUILD: process.env.BUILD_NUMBER || 'development',
  VERSION_STRING: '1.0.0',
  RELEASE_DATE: '2024-09-18',
  COMPATIBILITY: {
    NODE_MIN: '18.0.0',
    NODE_MAX: '20.x.x',
  },
};

/**
 * Main monitoring system instance for direct usage
 */
let defaultMonitoringSystem: MonitoringSystemOrchestrator | null = null;

/**
 * Get or create the default monitoring system instance
 */
export function getDefaultMonitoringSystem(): MonitoringSystemOrchestrator {
  if (!defaultMonitoringSystem) {
    defaultMonitoringSystem = MonitoringSystemFactory.createFromEnvironment();
  }
  return defaultMonitoringSystem;
}

/**
 * Initialize and start the default monitoring system
 */
export async function initializeMonitoring(config?: any): Promise<MonitoringSystemOrchestrator> {
  const system = config ? createMonitoringSystem(config) : getDefaultMonitoringSystem();
  await system.start();
  return system;
}

/**
 * Shutdown the default monitoring system
 */
export async function shutdownMonitoring(): Promise<void> {
  if (defaultMonitoringSystem) {
    await defaultMonitoringSystem.stop();
    defaultMonitoringSystem = null;
  }
}

// Export version and build information
export { VERSION as MonitoringVersion };

// Re-export main classes for convenience
export {
  MonitoringSystemOrchestrator as MonitoringSystem,
  MetricsCollector as Metrics,
  AnomalyDetectionEngine as AnomalyDetection,
  DashboardEngine as Dashboards,
  CircuitBreaker,
  CircuitBreakerManager as CircuitBreakers,
  PrivacyMonitoringEngine as PrivacyMonitoring,
  SecurityMonitoringEngine as SecurityMonitoring,
  HASIVUMonitoringIntegration as Integration,
};

/**
 * Default export - Monitoring System Factory
 */
export default MonitoringSystemFactory;
