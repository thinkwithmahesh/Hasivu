// CloudWatch Configuration for HASIVU Platform
// Infrastructure Reliability - Monitoring & Alerting System

import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';

const region = process.env.AWS_REGION || 'ap-south-1';

// CloudWatch Client Configuration
export const cloudwatchClient = new CloudWatchClient({
  region,
  maxAttempts: 3,
});

// CloudWatch Logs Client Configuration
export const cloudwatchLogsClient = new CloudWatchLogsClient({
  region,
  maxAttempts: 3,
});

// CloudWatch Configuration
export const cloudwatchConfig = {
  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Namespace Configuration
  namespaces: {
    business: 'HASIVU/Business',
    infrastructure: 'HASIVU/Infrastructure',
    application: 'HASIVU/Application',
    security: 'HASIVU/Security',
    cost: 'HASIVU/Cost',
    database: 'HASIVU/Database',
  },

  // Metric Dimensions
  dimensions: {
    environment: process.env.NODE_ENV || 'development',
    application: 'hasivu-platform',
    region,
  },

  // Log Groups
  logGroups: {
    application: `/aws/lambda/hasivu-platform-${process.env.NODE_ENV}`,
    errors: `/aws/lambda/hasivu-platform-${process.env.NODE_ENV}/errors`,
    business: `/aws/lambda/hasivu-platform-${process.env.NODE_ENV}/business`,
    security: `/aws/lambda/hasivu-platform-${process.env.NODE_ENV}/security`,
    performance: `/aws/lambda/hasivu-platform-${process.env.NODE_ENV}/performance`,
  },

  // Batch Configuration
  batch: {
    maxSize: 20, // Maximum metrics per batch
    flushInterval: 60000, // Flush every 60 seconds
  },

  // Alarm Thresholds
  thresholds: {
    // Performance Thresholds
    apiLatency: {
      warning: 1000, // 1 second
      critical: 3000, // 3 seconds
    },
    errorRate: {
      warning: 1, // 1%
      critical: 5, // 5%
    },

    // Database Thresholds
    dbCpu: {
      warning: 70,
      critical: 85,
    },
    dbConnections: {
      warning: 80,
      critical: 95,
    },
    slowQueryThreshold: 1000, // 1 second

    // Lambda Thresholds
    lambdaDuration: {
      warning: 5000,
      critical: 10000,
    },
    lambdaErrors: {
      warning: 10,
      critical: 20,
    },

    // Business Metrics Thresholds
    paymentFailureRate: {
      warning: 3, // 3%
      critical: 5, // 5%
    },
    systemHealthScore: {
      warning: 85,
      critical: 75,
    },

    // Security Thresholds
    failedLoginAttempts: {
      warning: 30,
      critical: 50,
    },
    suspiciousActivity: {
      warning: 1,
      critical: 5,
    },

    // Cost Thresholds (USD)
    dailyCost: {
      warning: 300,
      critical: 500,
    },
  },

  // Metric Collection Configuration
  metrics: {
    // Enable/disable metric collection
    enabled: process.env.CLOUDWATCH_METRICS_ENABLED !== 'false',

    // High-resolution metrics (1-second intervals)
    highResolution: false,

    // Metric units
    units: {
      count: 'Count',
      milliseconds: 'Milliseconds',
      seconds: 'Seconds',
      percent: 'Percent',
      bytes: 'Bytes',
      megabytes: 'Megabytes',
      gigabytes: 'Gigabytes',
      currency: 'None', // For currency values
    },
  },

  // Log Streaming Configuration
  logs: {
    enabled: process.env.CLOUDWATCH_LOGS_ENABLED !== 'false',
    retentionDays: 30,
    batchSize: 100,
    flushInterval: 5000, // 5 seconds
  },
};

// Metric Names Constants
export const MetricNames = {
  // Business Metrics
  TOTAL_REVENUE: 'TotalRevenue',
  PAYMENT_TRANSACTIONS: 'PaymentTransactions',
  ORDERS_CREATED: 'OrdersCreated',
  ORDERS_COMPLETED: 'OrdersCompleted',
  ORDERS_CANCELLED: 'OrdersCancelled',
  ACTIVE_USERS: 'ActiveUsers',
  RFID_OPERATIONS: 'RFIDOperations',
  FAILED_VERIFICATIONS: 'FailedVerifications',
  SYSTEM_HEALTH_SCORE: 'SystemHealthScore',
  USER_SATISFACTION_SCORE: 'UserSatisfactionScore',
  PAYMENT_SUCCESS_RATE: 'PaymentSuccessRate',

  // Performance Metrics
  API_RESPONSE_TIME: 'ApiResponseTime',
  API_ERROR_RATE: 'ApiErrorRate',
  LAMBDA_DURATION: 'LambdaDuration',
  LAMBDA_COLD_STARTS: 'LambdaColdStarts',
  DATABASE_QUERY_DURATION: 'DatabaseQueryDuration',
  CACHE_HIT_RATE: 'CacheHitRate',

  // Security Metrics
  FAILED_LOGIN_ATTEMPTS: 'FailedLoginAttempts',
  SUSPICIOUS_ACTIVITY: 'SuspiciousActivity',
  PAYMENT_FRAUD_ATTEMPTS: 'PaymentFraudAttempts',
  UNAUTHORIZED_ACCESS_ATTEMPTS: 'UnauthorizedAccessAttempts',

  // Cost Metrics
  ESTIMATED_LAMBDA_COST: 'EstimatedLambdaCost',
  ESTIMATED_RDS_COST: 'EstimatedRDSCost',
  ESTIMATED_API_GATEWAY_COST: 'EstimatedAPIGatewayCost',
  ESTIMATED_S3_COST: 'EstimatedS3Cost',
  COST_PER_TRANSACTION: 'CostPerTransaction',
  REVENUE_PER_TRANSACTION: 'RevenuePerTransaction',

  // Database Metrics
  SLOW_QUERIES: 'SlowQueries',
  DEADLOCK_COUNT: 'DeadlockCount',
  FAILED_CONNECTIONS: 'FailedConnections',
  TRANSACTION_ROLLBACKS: 'TransactionRollbacks',
  CONNECTION_POOL_UTILIZATION: 'ConnectionPoolUtilization',

  // Infrastructure Metrics
  MEMORY_UTILIZATION: 'MemoryUtilization',
  CPU_UTILIZATION: 'CPUUtilization',
  NETWORK_THROUGHPUT: 'NetworkThroughput',
  DISK_UTILIZATION: 'DiskUtilization',
} as const;

// Alarm Names Constants
export const AlarmNames = {
  // Critical Alarms
  PAYMENT_SYSTEM_ERRORS: 'Payment-System-High-Errors',
  PAYMENT_VERIFICATION_ERRORS: 'Payment-Verification-Errors',
  PAYMENT_WEBHOOK_ERRORS: 'Payment-Webhook-Errors',
  API_HIGH_ERROR_RATE: 'API-High-Error-Rate',
  DATABASE_HIGH_CPU: 'Database-High-CPU',
  DATABASE_LOW_STORAGE: 'Database-Low-Storage',
  HEALTH_CHECK_FAILURE: 'Health-Check-Failure',
  SYSTEM_HEALTH_LOW: 'Low-System-Health',

  // Warning Alarms
  API_HIGH_LATENCY: 'API-High-Latency',
  LAMBDA_HIGH_DURATION: 'Lambda-High-Duration',
  DATABASE_HIGH_CONNECTIONS: 'Database-High-Connections',
  AUTH_HIGH_ERRORS: 'Auth-High-Errors',

  // Business Alarms
  HIGH_PAYMENT_FAILURE_RATE: 'High-Payment-Failure-Rate',
  HIGH_RFID_FAILURE_RATE: 'High-RFID-Failure-Rate',

  // Security Alarms
  HIGH_FAILED_LOGIN_ATTEMPTS: 'High-Failed-Login-Attempts',
  SUSPICIOUS_ACTIVITY_DETECTED: 'Suspicious-Activity',
  PAYMENT_FRAUD_ATTEMPT: 'Payment-Fraud-Attempt',

  // Cost Alarms
  HIGH_LAMBDA_COSTS: 'High-Lambda-Costs',
  UNUSUAL_COST_SPIKE: 'Unusual-Cost-Spike',
} as const;

// SNS Topic ARNs (to be configured via environment variables)
export const snsTopics = {
  critical: process.env.SNS_TOPIC_CRITICAL_ALERTS,
  warning: process.env.SNS_TOPIC_WARNING_ALERTS,
  business: process.env.SNS_TOPIC_BUSINESS_ALERTS,
};

// Dashboard URLs (auto-generated)
export const getDashboardUrl = (dashboardName: string): string => {
  return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${process.env.NODE_ENV}-HASIVU-${dashboardName}`;
};

export const dashboardUrls = {
  executive: getDashboardUrl('Executive-Overview'),
  lambda: getDashboardUrl('Lambda-Performance'),
  apiGateway: getDashboardUrl('API-Gateway'),
  database: getDashboardUrl('Database-Performance'),
  business: getDashboardUrl('Business-Metrics'),
  cost: getDashboardUrl('Cost-Optimization'),
};
