import { Config } from 'jest';
declare const config: Config;
export declare const integrationConfig: {
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        schema: string;
        connectionPoolSize: number;
        connectionTimeout: number;
        queryTimeout: number;
        dropSchemaBeforeTest: boolean;
        createSchemaBeforeTest: boolean;
        runMigrationsBeforeTest: boolean;
        seedDataBeforeTest: boolean;
        cleanupAfterTest: boolean;
        useTransactions: boolean;
        rollbackAfterEachTest: boolean;
        isolationLevel: string;
    };
    redis: {
        host: string;
        port: number;
        password: string;
        database: number;
        connectTimeout: number;
        lazyConnect: boolean;
        maxRetriesPerRequest: number;
        retryDelayOnFailover: number;
        flushDatabaseBeforeTest: boolean;
        cleanupAfterTest: boolean;
        keyPrefix: string;
        keyExpiration: number;
    };
    externalServices: {
        payment: {
            mockProvider: string;
            apiKey: string;
            apiSecret: string;
            webhookSecret: string;
            mockEndpoints: {
                createOrder: string;
                capturePayment: string;
                refundPayment: string;
                webhookHandler: string;
            };
        };
        sms: {
            mockProvider: string;
            apiKey: string;
            mockEndpoints: {
                sendSms: string;
                bulkSms: string;
                deliveryStatus: string;
            };
        };
        email: {
            mockProvider: string;
            apiKey: string;
            mockEndpoints: {
                sendEmail: string;
                templateEmail: string;
                bounceWebhook: string;
            };
        };
        whatsapp: {
            mockProvider: string;
            accessToken: string;
            verifyToken: string;
            mockEndpoints: {
                sendMessage: string;
                webhook: string;
                mediaUpload: string;
            };
        };
        rfid: {
            mockReaders: {
                id: string;
                location: string;
                type: string;
                status: string;
            }[];
            simulationMode: boolean;
            batchProcessing: boolean;
            concurrentReads: number;
        };
    };
    loadTesting: {
        enabled: boolean;
        scenarios: {
            normal: {
                duration: string;
                concurrentUsers: number;
                rampUpTime: string;
                thresholds: {
                    http_req_duration: string[];
                    http_req_failed: string[];
                };
            };
            peak: {
                duration: string;
                concurrentUsers: number;
                rampUpTime: string;
                thresholds: {
                    http_req_duration: string[];
                    http_req_failed: string[];
                };
            };
            stress: {
                duration: string;
                concurrentUsers: number;
                rampUpTime: string;
                thresholds: {
                    http_req_duration: string[];
                    http_req_failed: string[];
                };
            };
        };
    };
    security: {
        rateLimitTesting: boolean;
        authenticationTesting: boolean;
        authorizationTesting: boolean;
        inputValidationTesting: boolean;
        sqlInjectionTesting: boolean;
        xssTesting: boolean;
        csrfTesting: boolean;
        maxFailedLoginAttempts: number;
        accountLockoutDuration: number;
        sessionTimeout: number;
        passwordMinLength: number;
        bruteForceSimulation: {
            enabled: boolean;
            maxAttempts: number;
            timeWindow: number;
        };
    };
    api: {
        baseUrl: string;
        timeout: number;
        retryAttempts: number;
        retryDelay: number;
        versions: string[];
        versioningStrategy: string;
        validateResponseSchema: boolean;
        validateResponseTime: boolean;
        validateErrorHandling: boolean;
        supportedContentTypes: string[];
    };
    microservices: {
        services: {
            name: string;
            url: string;
            healthCheck: string;
            timeout: number;
        }[];
        serviceRegistry: {
            enabled: boolean;
            registryUrl: string;
            healthCheckInterval: number;
            retryAttempts: number;
        };
        circuitBreaker: {
            enabled: boolean;
            failureThreshold: number;
            resetTimeout: number;
            monitoringPeriod: number;
        };
    };
    messageQueue: {
        provider: string;
        connection: {
            url: string;
            heartbeat: number;
            connectionTimeout: number;
        };
        queues: {
            orderProcessing: string;
            paymentNotification: string;
            menuUpdates: string;
            rfidEvents: string;
            userNotifications: string;
        };
        deadLetterQueue: {
            enabled: boolean;
            retryAttempts: number;
            retryDelay: number;
        };
    };
    fileStorage: {
        provider: string;
        basePath: string;
        allowedTypes: string[];
        maxFileSize: number;
        maxTotalSize: number;
        cleanupAfterTest: boolean;
        preserveTestFiles: boolean;
    };
    monitoring: {
        enabled: boolean;
        metricsEndpoint: string;
        healthEndpoint: string;
        trackResponseTime: boolean;
        trackThroughput: boolean;
        trackErrorRate: boolean;
        trackResourceUsage: boolean;
        alerts: {
            responseTimeThreshold: number;
            errorRateThreshold: number;
            throughputThreshold: number;
            memoryUsageThreshold: number;
        };
    };
    dataGeneration: {
        userCount: number;
        schoolCount: number;
        menuItemCount: number;
        orderCount: number;
        generateRealisticNames: boolean;
        generateRealisticAddresses: boolean;
        generateRealisticPhoneNumbers: boolean;
        generateRealisticMenuItems: boolean;
        generateHistoricalData: boolean;
        historicalDataDays: number;
        generateFutureData: boolean;
        futureDataDays: number;
    };
    parallelExecution: {
        enabled: boolean;
        maxConcurrency: number;
        isolationLevel: string;
        groupBy: string;
        balanceStrategy: string;
        memoryLimitPerWorker: string;
        timeoutPerWorker: number;
    };
    debugging: {
        logLevel: string;
        enableSqlLogging: boolean;
        enableRedisLogging: boolean;
        enableApiLogging: boolean;
        preserveTestData: boolean;
        captureScreenshots: boolean;
        recordTestVideos: boolean;
        enableProfiling: boolean;
        profilingInterval: number;
        memorySnapshots: boolean;
    };
};
export declare const testSuiteConfig: {
    categories: {
        core: {
            pattern: string;
            timeout: number;
            retries: number;
            priority: string;
        };
        api: {
            pattern: string;
            timeout: number;
            retries: number;
            priority: string;
        };
        database: {
            pattern: string;
            timeout: number;
            retries: number;
            priority: string;
        };
        external: {
            pattern: string;
            timeout: number;
            retries: number;
            priority: string;
        };
        e2e: {
            pattern: string;
            timeout: number;
            retries: number;
            priority: string;
        };
        performance: {
            pattern: string;
            timeout: number;
            retries: number;
            priority: string;
        };
        security: {
            pattern: string;
            timeout: number;
            retries: number;
            priority: string;
        };
    };
    executionStrategy: {
        dependencyOrder: string[];
        parallelGroups: string[][];
        cleanupBetweenCategories: boolean;
        resetDatabaseBetweenCategories: boolean;
        clearCacheBetweenCategories: boolean;
    };
};
export declare const testHelpers: {
    database: {
        seedDataPath: string;
        migrationPath: string;
        backupPath: string;
        generateTestData: boolean;
        useFixtureData: boolean;
        preserveReferentialIntegrity: boolean;
    };
    api: {
        requestTimeout: number;
        defaultHeaders: {
            'Content-Type': string;
            Accept: string;
            'User-Agent': string;
        };
        authTokenLifetime: number;
        refreshTokenLifetime: number;
        generateTestTokens: boolean;
    };
    filesystem: {
        testUploadPath: string;
        testDownloadPath: string;
        generateTestImages: boolean;
        generateTestDocuments: boolean;
        generateTestCSVs: boolean;
        cleanupTestFiles: boolean;
        preserveFailureArtifacts: boolean;
    };
    temporal: {
        useFixedTime: boolean;
        fixedTime: string;
        timeZone: string;
        enableTimeTravel: boolean;
        timeStepSize: string;
        businessHours: {
            start: string;
            end: string;
            days: number[];
        };
    };
    mocks: {
        enableHttpMocks: boolean;
        recordHttpCalls: boolean;
        replayHttpCalls: boolean;
        mockExternalServices: boolean;
        mockDatabaseCalls: boolean;
        mockRedisOperations: boolean;
        useRealPaymentGateway: boolean;
        useRealSmsService: boolean;
        useRealEmailService: boolean;
    };
};
export declare const performanceConfig: {
    thresholds: {
        authentication: number;
        userOperations: number;
        menuOperations: number;
        orderProcessing: number;
        paymentProcessing: number;
        notificationDelivery: number;
        rfidOperations: number;
        simpleQuery: number;
        complexQuery: number;
        transactionCommit: number;
        bulkOperations: number;
        baseMemoryUsage: number;
        peakMemoryUsage: number;
        memoryLeakThreshold: number;
        averageCpuUsage: number;
        peakCpuUsage: number;
        maxConcurrentRequests: number;
        maxConcurrentDbConnections: number;
        maxConcurrentRfidReads: number;
    };
    loadScenarios: {
        lunchRush: {
            description: string;
            duration: number;
            users: {
                students: number;
                staff: number;
                parents: number;
            };
            operations: {
                menuBrowsing: number;
                orderPlacement: number;
                paymentProcessing: number;
                orderTracking: number;
            };
        };
        dailyOperations: {
            description: string;
            duration: number;
            users: {
                students: number;
                staff: number;
                parents: number;
                admins: number;
            };
            operationDistribution: {
                morning: number;
                lunch: number;
                evening: number;
                night: number;
            };
        };
        stressTest: {
            description: string;
            duration: number;
            users: {
                concurrent: number;
                total: number;
            };
            rampUp: number;
            sustainedLoad: number;
            rampDown: number;
        };
    };
    monitoring: {
        interval: number;
        metrics: string[];
        alerts: {
            criticalMemoryUsage: number;
            criticalCpuUsage: number;
            criticalDiskUsage: number;
            highErrorRate: number;
            slowResponseTime: number;
        };
    };
};
export default config;
//# sourceMappingURL=integration.config.d.ts.map