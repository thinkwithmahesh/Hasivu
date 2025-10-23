"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardUrls = exports.getDashboardUrl = exports.snsTopics = exports.AlarmNames = exports.MetricNames = exports.cloudwatchConfig = exports.cloudwatchLogsClient = exports.cloudwatchClient = void 0;
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const region = process.env.AWS_REGION || 'ap-south-1';
exports.cloudwatchClient = new client_cloudwatch_1.CloudWatchClient({
    region,
    maxAttempts: 3,
});
exports.cloudwatchLogsClient = new client_cloudwatch_logs_1.CloudWatchLogsClient({
    region,
    maxAttempts: 3,
});
exports.cloudwatchConfig = {
    environment: process.env.NODE_ENV || 'development',
    namespaces: {
        business: 'HASIVU/Business',
        infrastructure: 'HASIVU/Infrastructure',
        application: 'HASIVU/Application',
        security: 'HASIVU/Security',
        cost: 'HASIVU/Cost',
        database: 'HASIVU/Database',
    },
    dimensions: {
        environment: process.env.NODE_ENV || 'development',
        application: 'hasivu-platform',
        region,
    },
    logGroups: {
        application: `/aws/lambda/hasivu-platform-${process.env.NODE_ENV}`,
        errors: `/aws/lambda/hasivu-platform-${process.env.NODE_ENV}/errors`,
        business: `/aws/lambda/hasivu-platform-${process.env.NODE_ENV}/business`,
        security: `/aws/lambda/hasivu-platform-${process.env.NODE_ENV}/security`,
        performance: `/aws/lambda/hasivu-platform-${process.env.NODE_ENV}/performance`,
    },
    batch: {
        maxSize: 20,
        flushInterval: 60000,
    },
    thresholds: {
        apiLatency: {
            warning: 1000,
            critical: 3000,
        },
        errorRate: {
            warning: 1,
            critical: 5,
        },
        dbCpu: {
            warning: 70,
            critical: 85,
        },
        dbConnections: {
            warning: 80,
            critical: 95,
        },
        slowQueryThreshold: 1000,
        lambdaDuration: {
            warning: 5000,
            critical: 10000,
        },
        lambdaErrors: {
            warning: 10,
            critical: 20,
        },
        paymentFailureRate: {
            warning: 3,
            critical: 5,
        },
        systemHealthScore: {
            warning: 85,
            critical: 75,
        },
        failedLoginAttempts: {
            warning: 30,
            critical: 50,
        },
        suspiciousActivity: {
            warning: 1,
            critical: 5,
        },
        dailyCost: {
            warning: 300,
            critical: 500,
        },
    },
    metrics: {
        enabled: process.env.CLOUDWATCH_METRICS_ENABLED !== 'false',
        highResolution: false,
        units: {
            count: 'Count',
            milliseconds: 'Milliseconds',
            seconds: 'Seconds',
            percent: 'Percent',
            bytes: 'Bytes',
            megabytes: 'Megabytes',
            gigabytes: 'Gigabytes',
            currency: 'None',
        },
    },
    logs: {
        enabled: process.env.CLOUDWATCH_LOGS_ENABLED !== 'false',
        retentionDays: 30,
        batchSize: 100,
        flushInterval: 5000,
    },
};
exports.MetricNames = {
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
    API_RESPONSE_TIME: 'ApiResponseTime',
    API_ERROR_RATE: 'ApiErrorRate',
    LAMBDA_DURATION: 'LambdaDuration',
    LAMBDA_COLD_STARTS: 'LambdaColdStarts',
    DATABASE_QUERY_DURATION: 'DatabaseQueryDuration',
    CACHE_HIT_RATE: 'CacheHitRate',
    FAILED_LOGIN_ATTEMPTS: 'FailedLoginAttempts',
    SUSPICIOUS_ACTIVITY: 'SuspiciousActivity',
    PAYMENT_FRAUD_ATTEMPTS: 'PaymentFraudAttempts',
    UNAUTHORIZED_ACCESS_ATTEMPTS: 'UnauthorizedAccessAttempts',
    ESTIMATED_LAMBDA_COST: 'EstimatedLambdaCost',
    ESTIMATED_RDS_COST: 'EstimatedRDSCost',
    ESTIMATED_API_GATEWAY_COST: 'EstimatedAPIGatewayCost',
    ESTIMATED_S3_COST: 'EstimatedS3Cost',
    COST_PER_TRANSACTION: 'CostPerTransaction',
    REVENUE_PER_TRANSACTION: 'RevenuePerTransaction',
    SLOW_QUERIES: 'SlowQueries',
    DEADLOCK_COUNT: 'DeadlockCount',
    FAILED_CONNECTIONS: 'FailedConnections',
    TRANSACTION_ROLLBACKS: 'TransactionRollbacks',
    CONNECTION_POOL_UTILIZATION: 'ConnectionPoolUtilization',
    MEMORY_UTILIZATION: 'MemoryUtilization',
    CPU_UTILIZATION: 'CPUUtilization',
    NETWORK_THROUGHPUT: 'NetworkThroughput',
    DISK_UTILIZATION: 'DiskUtilization',
};
exports.AlarmNames = {
    PAYMENT_SYSTEM_ERRORS: 'Payment-System-High-Errors',
    PAYMENT_VERIFICATION_ERRORS: 'Payment-Verification-Errors',
    PAYMENT_WEBHOOK_ERRORS: 'Payment-Webhook-Errors',
    API_HIGH_ERROR_RATE: 'API-High-Error-Rate',
    DATABASE_HIGH_CPU: 'Database-High-CPU',
    DATABASE_LOW_STORAGE: 'Database-Low-Storage',
    HEALTH_CHECK_FAILURE: 'Health-Check-Failure',
    SYSTEM_HEALTH_LOW: 'Low-System-Health',
    API_HIGH_LATENCY: 'API-High-Latency',
    LAMBDA_HIGH_DURATION: 'Lambda-High-Duration',
    DATABASE_HIGH_CONNECTIONS: 'Database-High-Connections',
    AUTH_HIGH_ERRORS: 'Auth-High-Errors',
    HIGH_PAYMENT_FAILURE_RATE: 'High-Payment-Failure-Rate',
    HIGH_RFID_FAILURE_RATE: 'High-RFID-Failure-Rate',
    HIGH_FAILED_LOGIN_ATTEMPTS: 'High-Failed-Login-Attempts',
    SUSPICIOUS_ACTIVITY_DETECTED: 'Suspicious-Activity',
    PAYMENT_FRAUD_ATTEMPT: 'Payment-Fraud-Attempt',
    HIGH_LAMBDA_COSTS: 'High-Lambda-Costs',
    UNUSUAL_COST_SPIKE: 'Unusual-Cost-Spike',
};
exports.snsTopics = {
    critical: process.env.SNS_TOPIC_CRITICAL_ALERTS,
    warning: process.env.SNS_TOPIC_WARNING_ALERTS,
    business: process.env.SNS_TOPIC_BUSINESS_ALERTS,
};
const getDashboardUrl = (dashboardName) => {
    return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${process.env.NODE_ENV}-HASIVU-${dashboardName}`;
};
exports.getDashboardUrl = getDashboardUrl;
exports.dashboardUrls = {
    executive: (0, exports.getDashboardUrl)('Executive-Overview'),
    lambda: (0, exports.getDashboardUrl)('Lambda-Performance'),
    apiGateway: (0, exports.getDashboardUrl)('API-Gateway'),
    database: (0, exports.getDashboardUrl)('Database-Performance'),
    business: (0, exports.getDashboardUrl)('Business-Metrics'),
    cost: (0, exports.getDashboardUrl)('Cost-Optimization'),
};
//# sourceMappingURL=cloudwatch.config.js.map