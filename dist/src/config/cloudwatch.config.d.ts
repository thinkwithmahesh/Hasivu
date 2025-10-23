import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
export declare const cloudwatchClient: CloudWatchClient;
export declare const cloudwatchLogsClient: CloudWatchLogsClient;
export declare const cloudwatchConfig: {
    environment: string;
    namespaces: {
        business: string;
        infrastructure: string;
        application: string;
        security: string;
        cost: string;
        database: string;
    };
    dimensions: {
        environment: string;
        application: string;
        region: string;
    };
    logGroups: {
        application: string;
        errors: string;
        business: string;
        security: string;
        performance: string;
    };
    batch: {
        maxSize: number;
        flushInterval: number;
    };
    thresholds: {
        apiLatency: {
            warning: number;
            critical: number;
        };
        errorRate: {
            warning: number;
            critical: number;
        };
        dbCpu: {
            warning: number;
            critical: number;
        };
        dbConnections: {
            warning: number;
            critical: number;
        };
        slowQueryThreshold: number;
        lambdaDuration: {
            warning: number;
            critical: number;
        };
        lambdaErrors: {
            warning: number;
            critical: number;
        };
        paymentFailureRate: {
            warning: number;
            critical: number;
        };
        systemHealthScore: {
            warning: number;
            critical: number;
        };
        failedLoginAttempts: {
            warning: number;
            critical: number;
        };
        suspiciousActivity: {
            warning: number;
            critical: number;
        };
        dailyCost: {
            warning: number;
            critical: number;
        };
    };
    metrics: {
        enabled: boolean;
        highResolution: boolean;
        units: {
            count: string;
            milliseconds: string;
            seconds: string;
            percent: string;
            bytes: string;
            megabytes: string;
            gigabytes: string;
            currency: string;
        };
    };
    logs: {
        enabled: boolean;
        retentionDays: number;
        batchSize: number;
        flushInterval: number;
    };
};
export declare const MetricNames: {
    readonly TOTAL_REVENUE: "TotalRevenue";
    readonly PAYMENT_TRANSACTIONS: "PaymentTransactions";
    readonly ORDERS_CREATED: "OrdersCreated";
    readonly ORDERS_COMPLETED: "OrdersCompleted";
    readonly ORDERS_CANCELLED: "OrdersCancelled";
    readonly ACTIVE_USERS: "ActiveUsers";
    readonly RFID_OPERATIONS: "RFIDOperations";
    readonly FAILED_VERIFICATIONS: "FailedVerifications";
    readonly SYSTEM_HEALTH_SCORE: "SystemHealthScore";
    readonly USER_SATISFACTION_SCORE: "UserSatisfactionScore";
    readonly PAYMENT_SUCCESS_RATE: "PaymentSuccessRate";
    readonly API_RESPONSE_TIME: "ApiResponseTime";
    readonly API_ERROR_RATE: "ApiErrorRate";
    readonly LAMBDA_DURATION: "LambdaDuration";
    readonly LAMBDA_COLD_STARTS: "LambdaColdStarts";
    readonly DATABASE_QUERY_DURATION: "DatabaseQueryDuration";
    readonly CACHE_HIT_RATE: "CacheHitRate";
    readonly FAILED_LOGIN_ATTEMPTS: "FailedLoginAttempts";
    readonly SUSPICIOUS_ACTIVITY: "SuspiciousActivity";
    readonly PAYMENT_FRAUD_ATTEMPTS: "PaymentFraudAttempts";
    readonly UNAUTHORIZED_ACCESS_ATTEMPTS: "UnauthorizedAccessAttempts";
    readonly ESTIMATED_LAMBDA_COST: "EstimatedLambdaCost";
    readonly ESTIMATED_RDS_COST: "EstimatedRDSCost";
    readonly ESTIMATED_API_GATEWAY_COST: "EstimatedAPIGatewayCost";
    readonly ESTIMATED_S3_COST: "EstimatedS3Cost";
    readonly COST_PER_TRANSACTION: "CostPerTransaction";
    readonly REVENUE_PER_TRANSACTION: "RevenuePerTransaction";
    readonly SLOW_QUERIES: "SlowQueries";
    readonly DEADLOCK_COUNT: "DeadlockCount";
    readonly FAILED_CONNECTIONS: "FailedConnections";
    readonly TRANSACTION_ROLLBACKS: "TransactionRollbacks";
    readonly CONNECTION_POOL_UTILIZATION: "ConnectionPoolUtilization";
    readonly MEMORY_UTILIZATION: "MemoryUtilization";
    readonly CPU_UTILIZATION: "CPUUtilization";
    readonly NETWORK_THROUGHPUT: "NetworkThroughput";
    readonly DISK_UTILIZATION: "DiskUtilization";
};
export declare const AlarmNames: {
    readonly PAYMENT_SYSTEM_ERRORS: "Payment-System-High-Errors";
    readonly PAYMENT_VERIFICATION_ERRORS: "Payment-Verification-Errors";
    readonly PAYMENT_WEBHOOK_ERRORS: "Payment-Webhook-Errors";
    readonly API_HIGH_ERROR_RATE: "API-High-Error-Rate";
    readonly DATABASE_HIGH_CPU: "Database-High-CPU";
    readonly DATABASE_LOW_STORAGE: "Database-Low-Storage";
    readonly HEALTH_CHECK_FAILURE: "Health-Check-Failure";
    readonly SYSTEM_HEALTH_LOW: "Low-System-Health";
    readonly API_HIGH_LATENCY: "API-High-Latency";
    readonly LAMBDA_HIGH_DURATION: "Lambda-High-Duration";
    readonly DATABASE_HIGH_CONNECTIONS: "Database-High-Connections";
    readonly AUTH_HIGH_ERRORS: "Auth-High-Errors";
    readonly HIGH_PAYMENT_FAILURE_RATE: "High-Payment-Failure-Rate";
    readonly HIGH_RFID_FAILURE_RATE: "High-RFID-Failure-Rate";
    readonly HIGH_FAILED_LOGIN_ATTEMPTS: "High-Failed-Login-Attempts";
    readonly SUSPICIOUS_ACTIVITY_DETECTED: "Suspicious-Activity";
    readonly PAYMENT_FRAUD_ATTEMPT: "Payment-Fraud-Attempt";
    readonly HIGH_LAMBDA_COSTS: "High-Lambda-Costs";
    readonly UNUSUAL_COST_SPIKE: "Unusual-Cost-Spike";
};
export declare const snsTopics: {
    critical: string | undefined;
    warning: string | undefined;
    business: string | undefined;
};
export declare const getDashboardUrl: (dashboardName: string) => string;
export declare const dashboardUrls: {
    executive: string;
    lambda: string;
    apiGateway: string;
    database: string;
    business: string;
    cost: string;
};
//# sourceMappingURL=cloudwatch.config.d.ts.map