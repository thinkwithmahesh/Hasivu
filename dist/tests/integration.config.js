"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceConfig = exports.testHelpers = exports.testSuiteConfig = exports.integrationConfig = void 0;
const ts_jest_1 = require("ts-jest");
const fs_1 = require("fs");
const path_1 = require("path");
const tsConfig = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../tsconfig.json'), 'utf8'));
const config = {
    testEnvironment: 'node',
    globalSetup: '<rootDir>/tests/setup/global-setup.ts',
    globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',
    setupFilesAfterEnv: [
        '<rootDir>/tests/setup/test-setup.ts',
        '<rootDir>/tests/setup/integration-setup.ts',
        '<rootDir>/tests/setup/database-setup.ts',
        '<rootDir>/tests/setup/redis-setup.ts',
        '<rootDir>/tests/setup/external-service-mocks.ts'
    ],
    testMatch: [
        '<rootDir>/tests/integration/**/*.test.ts',
        '<rootDir>/tests/integration/**/*.spec.ts'
    ],
    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage/integration',
    coverageReporters: [
        'text',
        'html',
        'lcov',
        'json-summary',
        'cobertura'
    ],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.test.ts',
        '!src/**/*.spec.ts',
        '!src/types/**',
        '!src/test-utils/**',
        '!src/migrations/**',
        '!src/seeds/**'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        },
        './src/services/': {
            branches: 80,
            functions: 85,
            lines: 80,
            statements: 80
        },
        './src/controllers/': {
            branches: 75,
            functions: 80,
            lines: 75,
            statements: 75
        },
        './src/utils/': {
            branches: 65,
            functions: 70,
            lines: 65,
            statements: 65
        }
    },
    preset: 'ts-jest',
    transform: {
        '^.+\\.ts$': ['ts-jest', {
                tsconfig: {
                    module: 'commonjs',
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                    skipLibCheck: true,
                    strict: true,
                    experimentalDecorators: true,
                    emitDecoratorMetadata: true
                }
            }]
    },
    moduleNameMapper: {
        ...(0, ts_jest_1.pathsToModuleNameMapper)(tsConfig.compilerOptions.paths || {}, {
            prefix: '<rootDir>/'
        }),
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@test/(.*)$': '<rootDir>/tests/$1',
        '^@fixtures/(.*)$': '<rootDir>/tests/fixtures/$1',
        '^@mocks/(.*)$': '<rootDir>/tests/mocks/$1'
    },
    moduleFileExtensions: [
        'ts',
        'tsx',
        'js',
        'jsx',
        'json',
        'node'
    ],
    maxWorkers: '50%',
    testTimeout: 30000,
    verbose: true,
    reporters: [
        'default',
        ['jest-html-reporters', {
                publicPath: './reports/integration',
                filename: 'integration-test-report.html',
                expand: true,
                hideIcon: false,
                pageTitle: 'Hasivu Integration Test Report'
            }],
        ['jest-junit', {
                outputDirectory: './reports/integration',
                outputName: 'integration-test-results.xml',
                classNameTemplate: '{classname}',
                titleTemplate: '{title}',
                ancestorSeparator: ' › ',
                usePathForSuiteName: true
            }]
    ],
    globals: {
        'ts-jest': {
            useESM: false,
            isolatedModules: true
        },
        TEST_ENVIRONMENT: 'integration',
        TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/hasivu_test',
        TEST_REDIS_URL: process.env.TEST_REDIS_URL || 'redis://localhost:6379/1',
        TEST_PAYMENT_GATEWAY_URL: process.env.TEST_PAYMENT_GATEWAY_URL || 'https://api.sandbox.razorpay.com',
        TEST_SMS_GATEWAY_URL: process.env.TEST_SMS_GATEWAY_URL || 'https://api.textlocal.in',
        TEST_EMAIL_SERVICE_URL: process.env.TEST_EMAIL_SERVICE_URL || 'https://api.sendgrid.com',
        TEST_WHATSAPP_API_URL: process.env.TEST_WHATSAPP_API_URL || 'https://graph.facebook.com',
        ENABLE_EXTERNAL_SERVICES: process.env.ENABLE_EXTERNAL_SERVICES === 'true',
        MOCK_EXTERNAL_SERVICES: process.env.MOCK_EXTERNAL_SERVICES !== 'false',
        ENABLE_DATABASE_TRANSACTIONS: true,
        ENABLE_REDIS_CLEANUP: true,
        LOAD_TEST_DURATION: parseInt(process.env.LOAD_TEST_DURATION || '60', 10),
        CONCURRENT_USERS: parseInt(process.env.CONCURRENT_USERS || '50', 10),
        REQUEST_RATE_LIMIT: parseInt(process.env.REQUEST_RATE_LIMIT || '100', 10),
        RFID_READER_SIMULATION: true,
        RFID_BATCH_SIZE: parseInt(process.env.RFID_BATCH_SIZE || '100', 10),
        RFID_TRANSACTION_TIMEOUT: parseInt(process.env.RFID_TRANSACTION_TIMEOUT || '5000', 10),
        SCHOOL_ADMIN_SIMULATION: true,
        BULK_OPERATION_LIMIT: parseInt(process.env.BULK_OPERATION_LIMIT || '1000', 10),
        CONCURRENT_SCHOOL_OPERATIONS: parseInt(process.env.CONCURRENT_SCHOOL_OPERATIONS || '10', 10)
    },
    testEnvironmentOptions: {
        url: 'http://localhost:3000',
        exposedGlobals: [
            'TextEncoder',
            'TextDecoder',
            'Response',
            'Request',
            'Headers',
            'fetch',
            'FormData',
            'URLSearchParams'
        ]
    },
    clearMocks: true,
    restoreMocks: true,
    resetMocks: false,
    detectOpenHandles: true,
    forceExit: false,
    modulePathIgnorePatterns: [
        '<rootDir>/dist/',
        '<rootDir>/build/',
        '<rootDir>/coverage/',
        '<rootDir>/node_modules/'
    ],
    transformIgnorePatterns: [
        'node_modules/(?!(.*\\.mjs$|@testing-library|@jest))'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/build/',
        '/coverage/',
        '/docs/',
        '/scripts/(?!test)'
    ],
    testSequencer: '<rootDir>/tests/config/integration-sequencer.ts',
    errorOnDeprecated: true,
    bail: 0,
    watchPathIgnorePatterns: [
        '/node_modules/',
        '/coverage/',
        '/dist/',
        '/build/',
        '/.git/'
    ],
    testRunner: 'jest-circus/runner',
    snapshotSerializers: [
        '<rootDir>/tests/serializers/date-serializer.ts',
        '<rootDir>/tests/serializers/object-id-serializer.ts',
        '<rootDir>/tests/serializers/uuid-serializer.ts'
    ],
    slowTestThreshold: 5,
};
exports.integrationConfig = {
    database: {
        host: process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
        username: process.env.TEST_DB_USER || 'test_user',
        password: process.env.TEST_DB_PASS || 'test_password',
        database: process.env.TEST_DB_NAME || 'hasivu_integration_test',
        schema: process.env.TEST_DB_SCHEMA || 'public',
        connectionPoolSize: parseInt(process.env.TEST_DB_POOL_SIZE || '10', 10),
        connectionTimeout: parseInt(process.env.TEST_DB_TIMEOUT || '30000', 10),
        queryTimeout: parseInt(process.env.TEST_DB_QUERY_TIMEOUT || '15000', 10),
        dropSchemaBeforeTest: true,
        createSchemaBeforeTest: true,
        runMigrationsBeforeTest: true,
        seedDataBeforeTest: true,
        cleanupAfterTest: true,
        useTransactions: true,
        rollbackAfterEachTest: true,
        isolationLevel: 'READ_COMMITTED'
    },
    redis: {
        host: process.env.TEST_REDIS_HOST || 'localhost',
        port: parseInt(process.env.TEST_REDIS_PORT || '6379', 10),
        password: process.env.TEST_REDIS_PASSWORD || '',
        database: parseInt(process.env.TEST_REDIS_DB || '1', 10),
        connectTimeout: 10000,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        flushDatabaseBeforeTest: true,
        cleanupAfterTest: true,
        keyPrefix: 'test:',
        keyExpiration: 3600
    },
    externalServices: {
        payment: {
            mockProvider: 'razorpay',
            apiKey: 'test_rzp_key_mock',
            apiSecret: 'test_rzp_secret_mock',
            webhookSecret: 'test_webhook_secret',
            mockEndpoints: {
                createOrder: '/api/mock/payment/orders',
                capturePayment: '/api/mock/payment/capture',
                refundPayment: '/api/mock/payment/refund',
                webhookHandler: '/api/mock/payment/webhook'
            }
        },
        sms: {
            mockProvider: 'textlocal',
            apiKey: 'test_sms_api_key_mock',
            mockEndpoints: {
                sendSms: '/api/mock/sms/send',
                bulkSms: '/api/mock/sms/bulk',
                deliveryStatus: '/api/mock/sms/status'
            }
        },
        email: {
            mockProvider: 'sendgrid',
            apiKey: 'test_email_api_key_mock',
            mockEndpoints: {
                sendEmail: '/api/mock/email/send',
                templateEmail: '/api/mock/email/template',
                bounceWebhook: '/api/mock/email/bounce'
            }
        },
        whatsapp: {
            mockProvider: 'facebook',
            accessToken: 'test_wa_access_token_mock',
            verifyToken: 'test_wa_verify_token_mock',
            mockEndpoints: {
                sendMessage: '/api/mock/whatsapp/send',
                webhook: '/api/mock/whatsapp/webhook',
                mediaUpload: '/api/mock/whatsapp/media'
            }
        },
        rfid: {
            mockReaders: [
                {
                    id: 'reader_001',
                    location: 'main_gate',
                    type: 'long_range',
                    status: 'active'
                },
                {
                    id: 'reader_002',
                    location: 'cafeteria_entrance',
                    type: 'medium_range',
                    status: 'active'
                },
                {
                    id: 'reader_003',
                    location: 'delivery_area',
                    type: 'short_range',
                    status: 'active'
                }
            ],
            simulationMode: true,
            batchProcessing: true,
            concurrentReads: 50
        }
    },
    loadTesting: {
        enabled: process.env.ENABLE_LOAD_TESTS === 'true',
        scenarios: {
            normal: {
                duration: '60s',
                concurrentUsers: 50,
                rampUpTime: '10s',
                thresholds: {
                    http_req_duration: ['p(95)<500'],
                    http_req_failed: ['rate<0.01']
                }
            },
            peak: {
                duration: '120s',
                concurrentUsers: 200,
                rampUpTime: '30s',
                thresholds: {
                    http_req_duration: ['p(95)<1000'],
                    http_req_failed: ['rate<0.05']
                }
            },
            stress: {
                duration: '300s',
                concurrentUsers: 500,
                rampUpTime: '60s',
                thresholds: {
                    http_req_duration: ['p(95)<2000'],
                    http_req_failed: ['rate<0.10']
                }
            }
        }
    },
    security: {
        rateLimitTesting: true,
        authenticationTesting: true,
        authorizationTesting: true,
        inputValidationTesting: true,
        sqlInjectionTesting: true,
        xssTesting: true,
        csrfTesting: true,
        maxFailedLoginAttempts: 5,
        accountLockoutDuration: 900,
        sessionTimeout: 3600,
        passwordMinLength: 8,
        bruteForceSimulation: {
            enabled: true,
            maxAttempts: 100,
            timeWindow: 300
        }
    },
    api: {
        baseUrl: process.env.TEST_API_BASE_URL || 'http://localhost:3000',
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000,
        versions: ['v1', 'v2'],
        versioningStrategy: 'header',
        validateResponseSchema: true,
        validateResponseTime: true,
        validateErrorHandling: true,
        supportedContentTypes: [
            'application/json',
            'application/x-www-form-urlencoded',
            'multipart/form-data',
            'text/plain'
        ]
    },
    microservices: {
        services: [
            {
                name: 'auth-service',
                url: process.env.TEST_AUTH_SERVICE_URL || 'http://localhost:3001',
                healthCheck: '/health',
                timeout: 5000
            },
            {
                name: 'payment-service',
                url: process.env.TEST_PAYMENT_SERVICE_URL || 'http://localhost:3002',
                healthCheck: '/health',
                timeout: 5000
            },
            {
                name: 'notification-service',
                url: process.env.TEST_NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
                healthCheck: '/health',
                timeout: 5000
            },
            {
                name: 'menu-service',
                url: process.env.TEST_MENU_SERVICE_URL || 'http://localhost:3004',
                healthCheck: '/health',
                timeout: 5000
            },
            {
                name: 'order-service',
                url: process.env.TEST_ORDER_SERVICE_URL || 'http://localhost:3005',
                healthCheck: '/health',
                timeout: 5000
            },
            {
                name: 'rfid-service',
                url: process.env.TEST_RFID_SERVICE_URL || 'http://localhost:3006',
                healthCheck: '/health',
                timeout: 5000
            }
        ],
        serviceRegistry: {
            enabled: true,
            registryUrl: process.env.TEST_SERVICE_REGISTRY_URL || 'http://localhost:8500',
            healthCheckInterval: 30000,
            retryAttempts: 3
        },
        circuitBreaker: {
            enabled: true,
            failureThreshold: 5,
            resetTimeout: 30000,
            monitoringPeriod: 60000
        }
    },
    messageQueue: {
        provider: 'rabbitmq',
        connection: {
            url: process.env.TEST_RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
            heartbeat: 60,
            connectionTimeout: 10000
        },
        queues: {
            orderProcessing: 'test.order.processing',
            paymentNotification: 'test.payment.notification',
            menuUpdates: 'test.menu.updates',
            rfidEvents: 'test.rfid.events',
            userNotifications: 'test.user.notifications'
        },
        deadLetterQueue: {
            enabled: true,
            retryAttempts: 3,
            retryDelay: 5000
        }
    },
    fileStorage: {
        provider: 'local',
        basePath: './test-uploads',
        allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'text/csv',
            'application/vnd.ms-excel'
        ],
        maxFileSize: 10 * 1024 * 1024,
        maxTotalSize: 100 * 1024 * 1024,
        cleanupAfterTest: true,
        preserveTestFiles: process.env.PRESERVE_TEST_FILES === 'true'
    },
    monitoring: {
        enabled: true,
        metricsEndpoint: '/metrics',
        healthEndpoint: '/health',
        trackResponseTime: true,
        trackThroughput: true,
        trackErrorRate: true,
        trackResourceUsage: true,
        alerts: {
            responseTimeThreshold: 1000,
            errorRateThreshold: 0.05,
            throughputThreshold: 100,
            memoryUsageThreshold: 0.85
        }
    },
    dataGeneration: {
        userCount: 1000,
        schoolCount: 10,
        menuItemCount: 500,
        orderCount: 10000,
        generateRealisticNames: true,
        generateRealisticAddresses: true,
        generateRealisticPhoneNumbers: true,
        generateRealisticMenuItems: true,
        generateHistoricalData: true,
        historicalDataDays: 90,
        generateFutureData: true,
        futureDataDays: 30
    },
    parallelExecution: {
        enabled: true,
        maxConcurrency: 4,
        isolationLevel: 'process',
        groupBy: 'service',
        balanceStrategy: 'runtime',
        memoryLimitPerWorker: '512MB',
        timeoutPerWorker: 600000
    },
    debugging: {
        logLevel: process.env.TEST_LOG_LEVEL || 'info',
        enableSqlLogging: process.env.ENABLE_SQL_LOGGING === 'true',
        enableRedisLogging: process.env.ENABLE_REDIS_LOGGING === 'true',
        enableApiLogging: process.env.ENABLE_API_LOGGING === 'true',
        preserveTestData: process.env.PRESERVE_TEST_DATA === 'true',
        captureScreenshots: process.env.CAPTURE_SCREENSHOTS === 'true',
        recordTestVideos: process.env.RECORD_TEST_VIDEOS === 'true',
        enableProfiling: process.env.ENABLE_PROFILING === 'true',
        profilingInterval: 1000,
        memorySnapshots: process.env.MEMORY_SNAPSHOTS === 'true'
    }
};
exports.testSuiteConfig = {
    categories: {
        core: {
            pattern: '**/core/**/*.test.ts',
            timeout: 15000,
            retries: 2,
            priority: 'high'
        },
        api: {
            pattern: '**/api/**/*.test.ts',
            timeout: 20000,
            retries: 1,
            priority: 'high'
        },
        database: {
            pattern: '**/database/**/*.test.ts',
            timeout: 30000,
            retries: 2,
            priority: 'medium'
        },
        external: {
            pattern: '**/external/**/*.test.ts',
            timeout: 45000,
            retries: 3,
            priority: 'medium'
        },
        e2e: {
            pattern: '**/e2e/**/*.test.ts',
            timeout: 60000,
            retries: 1,
            priority: 'high'
        },
        performance: {
            pattern: '**/performance/**/*.test.ts',
            timeout: 120000,
            retries: 0,
            priority: 'low'
        },
        security: {
            pattern: '**/security/**/*.test.ts',
            timeout: 30000,
            retries: 1,
            priority: 'high'
        }
    },
    executionStrategy: {
        dependencyOrder: [
            'database',
            'core',
            'api',
            'external',
            'security',
            'e2e',
            'performance'
        ],
        parallelGroups: [
            ['database', 'core'],
            ['api', 'external'],
            ['security'],
            ['e2e'],
            ['performance']
        ],
        cleanupBetweenCategories: true,
        resetDatabaseBetweenCategories: true,
        clearCacheBetweenCategories: true
    }
};
exports.testHelpers = {
    database: {
        seedDataPath: './tests/fixtures/seeds',
        migrationPath: './tests/fixtures/migrations',
        backupPath: './tests/fixtures/backups',
        generateTestData: true,
        useFixtureData: true,
        preserveReferentialIntegrity: true
    },
    api: {
        requestTimeout: 10000,
        defaultHeaders: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Hasivu-Integration-Tests/1.0'
        },
        authTokenLifetime: 3600,
        refreshTokenLifetime: 86400,
        generateTestTokens: true
    },
    filesystem: {
        testUploadPath: './test-uploads',
        testDownloadPath: './test-downloads',
        generateTestImages: true,
        generateTestDocuments: true,
        generateTestCSVs: true,
        cleanupTestFiles: true,
        preserveFailureArtifacts: true
    },
    temporal: {
        useFixedTime: true,
        fixedTime: '2024-01-15T10:00:00.000Z',
        timeZone: 'Asia/Kolkata',
        enableTimeTravel: true,
        timeStepSize: 'minutes',
        businessHours: {
            start: '08:00',
            end: '20:00',
            days: [1, 2, 3, 4, 5, 6]
        }
    },
    mocks: {
        enableHttpMocks: true,
        recordHttpCalls: process.env.RECORD_HTTP_CALLS === 'true',
        replayHttpCalls: process.env.REPLAY_HTTP_CALLS === 'true',
        mockExternalServices: process.env.MOCK_EXTERNAL_SERVICES !== 'false',
        mockDatabaseCalls: false,
        mockRedisOperations: false,
        useRealPaymentGateway: process.env.USE_REAL_PAYMENT_GATEWAY === 'true',
        useRealSmsService: process.env.USE_REAL_SMS_SERVICE === 'true',
        useRealEmailService: process.env.USE_REAL_EMAIL_SERVICE === 'true'
    }
};
exports.performanceConfig = {
    thresholds: {
        authentication: 200,
        userOperations: 300,
        menuOperations: 250,
        orderProcessing: 500,
        paymentProcessing: 1000,
        notificationDelivery: 150,
        rfidOperations: 100,
        simpleQuery: 50,
        complexQuery: 200,
        transactionCommit: 100,
        bulkOperations: 1000,
        baseMemoryUsage: 100,
        peakMemoryUsage: 500,
        memoryLeakThreshold: 50,
        averageCpuUsage: 30,
        peakCpuUsage: 80,
        maxConcurrentRequests: 500,
        maxConcurrentDbConnections: 50,
        maxConcurrentRfidReads: 100
    },
    loadScenarios: {
        lunchRush: {
            description: 'Peak lunch hour traffic simulation',
            duration: 1800,
            users: {
                students: 800,
                staff: 50,
                parents: 200
            },
            operations: {
                menuBrowsing: 0.4,
                orderPlacement: 0.3,
                paymentProcessing: 0.2,
                orderTracking: 0.1
            }
        },
        dailyOperations: {
            description: 'Regular daily usage patterns',
            duration: 28800,
            users: {
                students: 1500,
                staff: 100,
                parents: 500,
                admins: 20
            },
            operationDistribution: {
                morning: 0.2,
                lunch: 0.5,
                evening: 0.2,
                night: 0.1
            }
        },
        stressTest: {
            description: 'Maximum capacity stress testing',
            duration: 3600,
            users: {
                concurrent: 2000,
                total: 5000
            },
            rampUp: 300,
            sustainedLoad: 2700,
            rampDown: 300
        }
    },
    monitoring: {
        interval: 1000,
        metrics: [
            'cpu_usage',
            'memory_usage',
            'disk_io',
            'network_io',
            'database_connections',
            'redis_connections',
            'active_sessions',
            'request_queue_size',
            'response_times'
        ],
        alerts: {
            criticalMemoryUsage: 0.90,
            criticalCpuUsage: 0.85,
            criticalDiskUsage: 0.90,
            highErrorRate: 0.05,
            slowResponseTime: 2000
        }
    }
};
exports.default = config;
//# sourceMappingURL=integration.config.js.map