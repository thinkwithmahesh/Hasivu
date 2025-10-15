"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configFactory = exports.DataWarehouseConfigFactory = void 0;
class DataWarehouseConfigFactory {
    static createDevelopmentConfig(overrides = {}) {
        const baseConfig = {
            orchestrator: this.createDevelopmentOrchestratorConfig(),
            etl: this.createDevelopmentETLConfig(),
            storage: this.createDevelopmentStorageConfig(),
            dataLake: this.createDevelopmentDataLakeConfig(),
            security: this.createDevelopmentSecurityConfig(),
            integration: this.createDevelopmentIntegrationConfig(),
            maxSchools: 10,
            performance: {
                queryTimeout: 30000,
                maxConcurrentQueries: 5,
                cacheSize: '1GB'
            }
        };
        return this.mergeConfigurations(baseConfig, overrides);
    }
    static createProductionConfig(overrides = {}) {
        const baseConfig = {
            orchestrator: this.createProductionOrchestratorConfig(),
            etl: this.createProductionETLConfig(),
            storage: this.createProductionStorageConfig(),
            dataLake: this.createProductionDataLakeConfig(),
            security: this.createProductionSecurityConfig(),
            integration: this.createProductionIntegrationConfig(),
            maxSchools: 500,
            performance: {
                queryTimeout: 60000,
                maxConcurrentQueries: 100,
                cacheSize: '10GB'
            }
        };
        return this.mergeConfigurations(baseConfig, overrides);
    }
    static createTestConfig(overrides = {}) {
        const baseConfig = {
            orchestrator: this.createTestOrchestratorConfig(),
            etl: this.createTestETLConfig(),
            storage: this.createTestStorageConfig(),
            dataLake: this.createTestDataLakeConfig(),
            security: this.createTestSecurityConfig(),
            integration: this.createTestIntegrationConfig(),
            maxSchools: 5,
            performance: {
                queryTimeout: 15000,
                maxConcurrentQueries: 2,
                cacheSize: '512MB'
            }
        };
        return this.mergeConfigurations(baseConfig, overrides);
    }
    static validateConfiguration(config) {
        const errors = [];
        if (!config.orchestrator) {
            errors.push('Orchestrator configuration is required');
        }
        else {
            if (config.orchestrator.maxSchemas <= 0) {
                errors.push('Orchestrator maxSchemas must be greater than 0');
            }
            if (!config.orchestrator.cacheSize) {
                errors.push('Orchestrator cacheSize is required');
            }
        }
        if (!config.etl) {
            errors.push('ETL configuration is required');
        }
        else {
            if (config.etl.maxConcurrentPipelines <= 0) {
                errors.push('ETL maxConcurrentPipelines must be greater than 0');
            }
        }
        if (!config.storage) {
            errors.push('Storage configuration is required');
        }
        else {
            if (config.storage.maxConcurrentQueries <= 0) {
                errors.push('Storage maxConcurrentQueries must be greater than 0');
            }
            if (!config.storage.mode || !['distributed', 'memory', 'hybrid'].includes(config.storage.mode)) {
                errors.push('Storage mode must be one of: distributed, memory, hybrid');
            }
        }
        if (config.dataLake?.enabled && !config.dataLake.bucketName) {
            errors.push('Data lake bucket name is required when enabled');
        }
        if (config.performance.queryTimeout <= 0) {
            errors.push('Performance queryTimeout must be greater than 0');
        }
        if (config.performance.maxConcurrentQueries <= 0) {
            errors.push('Performance maxConcurrentQueries must be greater than 0');
        }
        if (config.maxSchools <= 0) {
            errors.push('maxSchools must be greater than 0');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    static createDevelopmentOrchestratorConfig() {
        return {
            maxSchemas: 50,
            cacheSize: '1GB',
            compression: {
                enabled: true,
                algorithm: 'snappy',
                level: 3,
                columnStore: true,
                deltaEncoding: true,
                dictionaryCompression: true
            },
            schemas: {
                star: {
                    maxDimensions: 10,
                    autoIndexing: true,
                    denormalization: {
                        enabled: true,
                        threshold: 80
                    }
                },
                snowflake: {
                    maxHierarchyDepth: 5,
                    normalizationLevel: 3,
                    bridgeTableSupport: true
                }
            },
            temporal: {
                enabled: true,
                retentionPeriod: '1 year',
                archiveStrategy: 'compress',
                slowlyChangingDimensions: {
                    type1: true,
                    type2: true,
                    type3: false
                }
            },
            lineage: {
                trackingEnabled: true,
                impactAnalysis: true,
                retentionPeriod: '6 months',
                realTimeTracking: false
            },
            metadata: {
                autoDiscovery: true,
                cataloging: {
                    enabled: true,
                    scanInterval: '24h'
                },
                governance: {
                    approvalRequired: false,
                    versionControl: true
                }
            },
            queryOptimization: {
                enabled: true,
                statisticsCollection: {
                    enabled: true,
                    interval: '1h'
                },
                costBasedOptimization: true,
                indexHints: true,
                pushdownOptimization: true
            },
            partitioning: {
                enabled: true,
                strategy: 'time_based',
                interval: 'daily'
            },
            tenantIsolation: {
                enabled: true,
                strategy: 'schema',
                defaultIsolation: 'strict',
                crossTenantQueries: false
            }
        };
    }
    static createDevelopmentETLConfig() {
        return {
            maxConcurrentPipelines: 5,
            streaming: {
                enabled: true,
                engine: 'kafka',
                config: {
                    brokers: ['localhost:9092'],
                    topics: ['hasivu-events'],
                    consumerGroup: 'hasivu-dev'
                },
                checkpointing: {
                    enabled: true,
                    interval: 10000,
                    storage: 'filesystem',
                    path: '/tmp/checkpoints'
                },
                watermarks: {
                    enabled: true,
                    maxOutOfOrderness: 5000
                },
                windowing: {
                    type: 'tumbling',
                    size: 60000
                }
            },
            batch: {
                enabled: true,
                engine: 'spark',
                config: {
                    executors: 2,
                    executorMemory: '2g',
                    executorCores: 2,
                    driverMemory: '1g'
                },
                scheduling: {
                    cron: '0 */6 * * *',
                    timezone: 'UTC',
                    maxConcurrency: 2
                },
                resources: {
                    cpu: '2',
                    memory: '4Gi'
                }
            },
            deltaLake: {
                enabled: true,
                storageLocation: 's3a://hasivu-dev-lake/delta',
                optimizeConfig: {
                    autoOptimize: true,
                    optimizeWrite: true,
                    autoCompact: true,
                    maxFileSize: '1GB',
                    minFileSize: '128MB'
                },
                vaccumConfig: {
                    autoVacuum: true,
                    retentionHours: 168,
                    dryRun: false
                },
                versionRetention: 30
            },
            schemaEvolution: {
                enabled: true,
                strategy: 'permissive',
                compatibility: 'backward',
                conflictResolution: {
                    addColumn: 'allow',
                    removeColumn: 'prompt',
                    changeType: 'deny',
                    renameColumn: 'prompt'
                }
            },
            orchestration: {
                engine: 'airflow',
                config: {
                    webserverHost: 'localhost',
                    webserverPort: 8080,
                    executorType: 'local',
                    parallelism: 5,
                    dagDir: '/opt/airflow/dags'
                },
                monitoring: {
                    enabled: true,
                    alerting: {
                        enabled: true,
                        channels: ['email', 'slack'],
                        thresholds: {
                            failureRate: 0.05,
                            avgDuration: 300
                        }
                    },
                    logging: {
                        level: 'info',
                        format: 'json',
                        destination: 'file'
                    }
                }
            },
            transformation: {
                sql: 'SELECT * FROM source_table',
                parameters: {
                    defaultParallelism: 4,
                    maxMemoryFraction: 0.8,
                    serializer: 'kryo'
                }
            },
            validation: {
                enabled: true,
                rules: [
                    {
                        type: 'not_null',
                        columns: ['id', 'tenant_id'],
                        parameters: {},
                        severity: 'error'
                    }
                ],
                onFailure: 'warn'
            },
            errorHandling: {
                strategy: 'skip_and_continue',
                maxRetries: 3,
                retryDelay: 5000,
                deadLetterQueue: {
                    enabled: true,
                    storage: 'database',
                    retention: '7d',
                    notification: {
                        enabled: true,
                        channels: ['email'],
                        template: 'error_notification'
                    }
                }
            },
            cdc: {
                enabled: true,
                engine: 'debezium',
                config: {
                    connectorClass: 'io.debezium.connector.postgresql.PostgresConnector',
                    databaseHostname: 'localhost',
                    databasePort: 5432,
                    databaseUser: 'postgres'
                },
                filtering: {
                    includeTables: ['users', 'schools', 'orders'],
                    excludeTables: ['audit_log', 'temp_*']
                }
            },
            dataQuality: {
                enabled: true,
                rules: [
                    {
                        id: 'completeness_check',
                        name: 'Data Completeness Check',
                        type: 'completeness',
                        condition: 'COUNT(*) > 0',
                        threshold: 0.95,
                        severity: 'high'
                    },
                    {
                        id: 'uniqueness_check',
                        name: 'Primary Key Uniqueness',
                        type: 'uniqueness',
                        condition: 'COUNT(DISTINCT id) = COUNT(*)',
                        threshold: 1.0,
                        severity: 'critical'
                    }
                ],
                monitoring: {
                    enabled: true,
                    interval: '1h',
                    alerting: {
                        enabled: true,
                        channels: ['email', 'slack'],
                        thresholds: {
                            qualityScore: 0.9
                        }
                    },
                    reporting: {
                        enabled: true,
                        schedule: '0 0 * * *',
                        format: 'json',
                        recipients: ['data-team@hasivu.com']
                    }
                },
                profiling: {
                    enabled: true,
                    sampleSize: 10000,
                    statisticsCollection: true,
                    patternDetection: true
                }
            }
        };
    }
    static createDevelopmentStorageConfig() {
        return {
            mode: 'hybrid',
            maxConcurrentQueries: 10,
            cacheSize: '2GB',
            distributed: {
                enabled: true,
                engine: 'clickhouse',
                cluster: {
                    nodes: [{
                            id: 'node1',
                            host: 'localhost',
                            port: 9000,
                            cores: 4,
                            memory: '8GB',
                            storage: '100GB',
                            role: 'hybrid'
                        }],
                    coordinator: {
                        host: 'localhost',
                        port: 9000,
                        webUI: {
                            enabled: true,
                            port: 8123
                        }
                    },
                    autoScaling: {
                        enabled: false,
                        minNodes: 1,
                        maxNodes: 3,
                        scaleUpThreshold: 80,
                        scaleDownThreshold: 30,
                        cooldownPeriod: 300
                    }
                },
                storage: {
                    backend: 'hdfs',
                    replicationFactor: 1,
                    blockSize: '128MB',
                    compression: {
                        algorithm: 'snappy',
                        level: 3,
                        blockSize: '64KB'
                    }
                },
                networking: {
                    protocol: 'tcp',
                    maxConnections: 100,
                    timeout: 30000,
                    bufferSize: '64KB'
                }
            },
            memory: {
                enabled: true,
                engine: 'redis',
                cluster: {
                    nodes: [{
                            id: 'redis1',
                            host: 'localhost',
                            port: 6379,
                            memory: '2GB',
                            role: 'master'
                        }],
                    replication: {
                        enabled: false,
                        factor: 1,
                        strategy: 'async',
                        consistency: 'eventual'
                    },
                    partitioning: {
                        strategy: 'hash',
                        partitions: 16,
                        keyColumn: 'tenant_id'
                    }
                },
                caching: {
                    strategy: 'lru',
                    maxSize: '1GB',
                    ttl: 3600,
                    evictionPolicy: {
                        algorithm: 'lru',
                        maxMemoryPolicy: 'allkeys-lru',
                        samples: 5
                    }
                },
                persistence: {
                    enabled: true,
                    strategy: 'rdb',
                    interval: 900,
                    compression: true
                }
            },
            hybrid: {
                memoryThreshold: 1073741824,
                costThreshold: 100,
                routingStrategy: 'cost_based',
                fallbackStrategy: 'distributed'
            },
            tiering: {
                enabled: true,
                policies: [
                    {
                        name: 'hot_to_warm',
                        conditions: [
                            {
                                type: 'age',
                                operator: 'gt',
                                value: 7,
                                unit: 'days'
                            }
                        ],
                        sourceTier: 'memory',
                        targetTier: 'hot'
                    }
                ],
                migration: {
                    batchSize: 1000,
                    parallelism: 4,
                    retryPolicy: {
                        maxAttempts: 3,
                        backoffStrategy: 'exponential',
                        initialDelay: 1000,
                        maxDelay: 10000,
                        multiplier: 2
                    },
                    verification: true
                },
                monitoring: {
                    enabled: true,
                    metrics: ['tier_usage', 'migration_speed'],
                    alerting: {
                        enabled: true,
                        channels: [
                            {
                                type: 'email',
                                config: {
                                    recipients: ['ops@hasivu.com'],
                                    subject: 'Tiering Migration Alert'
                                }
                            }
                        ],
                        rules: [
                            {
                                name: 'migration_failure_rate',
                                condition: 'migration_failure_rate > 0.05',
                                severity: 'high',
                                threshold: 0.05,
                                duration: 300
                            }
                        ]
                    }
                }
            },
            indexing: {
                autoIndexing: true,
                strategies: [
                    {
                        type: 'btree',
                        conditions: [
                            {
                                selectivity: 0.1,
                                cardinality: 1000,
                                accessPattern: 'range',
                                queryFrequency: 100
                            }
                        ],
                        cost: {
                            creationTime: 5000,
                            maintenanceOverhead: 0.1,
                            storageOverhead: 0.2,
                            querySpeedup: 3.0
                        },
                        maintenance: {
                            rebuildThreshold: 0.3,
                            statisticsUpdate: true
                        }
                    }
                ],
                monitoring: {
                    enabled: true,
                    metrics: ['index_usage', 'query_performance'],
                    alerting: {
                        enabled: true,
                        channels: [
                            {
                                type: 'email',
                                config: {
                                    recipients: ['dba@hasivu.com']
                                }
                            }
                        ],
                        rules: [
                            {
                                name: 'index_usage_low',
                                condition: 'index_usage < 0.8',
                                severity: 'medium',
                                threshold: 0.8,
                                duration: 600
                            }
                        ]
                    }
                },
                maintenance: {
                    autoRebuild: true,
                    rebuildSchedule: '0 2 * * 0',
                    statisticsUpdate: {
                        enabled: true,
                        schedule: '0 1 * * *'
                    }
                }
            },
            compression: {
                enabled: true,
                strategies: [
                    {
                        algorithm: 'snappy',
                        level: 3,
                        blockSize: '64KB',
                        dictionary: false
                    }
                ],
                adaptiveCompression: {
                    enabled: true,
                    dataTypeOptimization: true,
                    compressionRatioThreshold: 0.8,
                    performanceImpactThreshold: 0.1
                },
                monitoring: {
                    enabled: true,
                    metrics: ['compression_ratio', 'compression_time'],
                    reporting: {
                        enabled: true,
                        schedule: '0 0 * * *',
                        format: 'json',
                        recipients: ['ops-team@hasivu.com']
                    }
                }
            },
            views: {
                enabled: true,
                maxViews: 100,
                defaultRefreshInterval: 3600,
                autoRefresh: true,
                monitoring: {
                    enabled: true,
                    metrics: ['refresh_time', 'hit_rate'],
                    alerting: {
                        enabled: true,
                        channels: [
                            {
                                type: 'email',
                                config: {
                                    recipients: ['data-eng@hasivu.com']
                                }
                            }
                        ],
                        rules: [
                            {
                                name: 'view_refresh_failure',
                                condition: 'refresh_failure_rate > 0.05',
                                severity: 'high',
                                threshold: 0.05,
                                duration: 300
                            }
                        ]
                    }
                }
            },
            optimization: {
                enabled: true,
                autoOptimize: true,
                costBasedOptimization: true,
                ruleBasedOptimization: true,
                statisticsCollection: {
                    enabled: true,
                    autoUpdate: true,
                    updateSchedule: '0 2 * * *',
                    sampleSize: 10000,
                    histograms: true
                },
                queryRewriting: {
                    enabled: true,
                    rules: [
                        {
                            name: 'predicate_pushdown',
                            condition: 'WHERE clause exists',
                            transformation: 'PUSH_DOWN_PREDICATE',
                            priority: 1
                        },
                        {
                            name: 'projection_elimination',
                            condition: 'Unused columns exist',
                            transformation: 'ELIMINATE_PROJECTION',
                            priority: 2
                        }
                    ],
                    predicate_pushdown: true,
                    projection_pushdown: true
                },
                joinOptimization: {
                    enabled: true,
                    reorderJoins: true,
                    bloomFilters: true,
                    broadcastThreshold: '10MB'
                }
            },
            parallel: {
                enabled: true,
                maxParallelism: 8,
                adaptiveParallelism: true,
                workStealing: true,
                loadBalancing: {
                    strategy: 'resource_based',
                    healthChecks: true,
                    failover: {
                        enabled: true,
                        retryAttempts: 3,
                        timeout: 5000,
                        circuitBreaker: {
                            enabled: true,
                            failureThreshold: 5,
                            timeout: 30000,
                            halfOpenMaxCalls: 3
                        }
                    }
                }
            },
            monitoring: {
                enabled: true,
                metrics: {
                    collection: {
                        enabled: true,
                        interval: 60
                    },
                    storage: {
                        backend: 'prometheus',
                        retention: '30d'
                    },
                    exporters: [
                        {
                            type: 'prometheus',
                            endpoint: 'http://prometheus:9090',
                            interval: 30
                        }
                    ]
                },
                alerting: {
                    enabled: true,
                    channels: [
                        {
                            type: 'email',
                            config: {
                                recipients: ['alerts@hasivu.com']
                            }
                        },
                        {
                            type: 'slack',
                            config: {
                                webhook: 'https://hooks.slack.com/services/...'
                            }
                        }
                    ],
                    rules: [
                        {
                            name: 'slow_query_count',
                            condition: 'slow_query_count > 10',
                            severity: 'high',
                            threshold: 10,
                            duration: 300
                        },
                        {
                            name: 'error_rate_high',
                            condition: 'error_rate > 0.05',
                            severity: 'critical',
                            threshold: 0.05,
                            duration: 60
                        }
                    ]
                },
                tracing: {
                    enabled: true,
                    sampler: {
                        type: 'probabilistic',
                        param: 0.1
                    },
                    reporter: {
                        endpoint: 'http://jaeger:14268',
                        bufferSize: 1000,
                        flushInterval: 5000
                    }
                },
                profiling: {
                    enabled: true,
                    cpuProfiling: true,
                    memoryProfiling: true,
                    queryProfiling: true,
                    duration: 300
                }
            },
            tenantIsolation: {
                enabled: true,
                strategy: 'schema',
                enforcement: 'strict',
                monitoring: true
            },
            performance: {
                queryTimeout: 30000,
                slowQueryThreshold: 5000,
                maxMemoryUsage: '8GB',
                gcTuning: {
                    algorithm: 'G1',
                    heapSize: '8GB',
                    newRatio: 2,
                    maxGCPauseMillis: 200
                },
                connectionPooling: {
                    maxConnections: 10,
                    minConnections: 2,
                    maxIdleTime: 300000,
                    connectionTimeout: 30000
                }
            }
        };
    }
    static createDevelopmentDataLakeConfig() {
        return {
            enabled: true,
            provider: 'aws-s3',
            bucketName: 'hasivu-dev-datalake',
            region: 'us-east-1',
            encryption: {
                enabled: true,
                kmsKeyId: 'arn:aws:kms:us-east-1:123456789:key/12345'
            },
            lifecycle: {
                enabled: true,
                transitionToIA: 30,
                transitionToGlacier: 90,
                expiration: 2555
            }
        };
    }
    static createDevelopmentSecurityConfig() {
        return {
            encryption: true,
            accessControl: true,
            auditLogging: true,
            compliance: {
                gdpr: true,
                coppa: true,
                soc2: false,
                hipaa: false
            },
            dataClassification: {
                enabled: true,
                levels: ['public', 'internal', 'confidential', 'restricted']
            }
        };
    }
    static createDevelopmentIntegrationConfig() {
        return {
            id: 'dev-integration',
            name: 'Development Integration',
            type: 'hasivu_system',
            enabled: true,
            connection: {
                endpoint: 'http://localhost:3000',
                method: 'REST',
                authentication: {
                    type: 'bearer',
                    credentials: {
                        token: process.env.DEV_API_TOKEN || 'dev-token'
                    }
                },
                timeout: 30000
            },
            mapping: {
                source: {
                    schema: 'hasivu_dev',
                    fields: []
                },
                target: {
                    schema: 'warehouse_dev',
                    fields: []
                },
                transformations: []
            },
            retryPolicy: {
                maxAttempts: 3,
                backoffStrategy: 'exponential',
                initialDelay: 1000,
                maxDelay: 10000,
                multiplier: 2
            },
            healthCheck: {
                enabled: true,
                interval: 60,
                timeout: 5,
                expectedStatus: 200
            }
        };
    }
    static createProductionOrchestratorConfig() {
        return this.createDevelopmentOrchestratorConfig();
    }
    static createProductionETLConfig() {
        return this.createDevelopmentETLConfig();
    }
    static createProductionStorageConfig() {
        return this.createDevelopmentStorageConfig();
    }
    static createProductionDataLakeConfig() {
        return this.createDevelopmentDataLakeConfig();
    }
    static createProductionSecurityConfig() {
        return this.createDevelopmentSecurityConfig();
    }
    static createProductionIntegrationConfig() {
        return this.createDevelopmentIntegrationConfig();
    }
    static createTestOrchestratorConfig() {
        return this.createDevelopmentOrchestratorConfig();
    }
    static createTestETLConfig() {
        return this.createDevelopmentETLConfig();
    }
    static createTestStorageConfig() {
        return this.createDevelopmentStorageConfig();
    }
    static createTestDataLakeConfig() {
        return this.createDevelopmentDataLakeConfig();
    }
    static createTestSecurityConfig() {
        return this.createDevelopmentSecurityConfig();
    }
    static createTestIntegrationConfig() {
        return this.createDevelopmentIntegrationConfig();
    }
    static mergeConfigurations(base, overrides) {
        return {
            ...base,
            ...overrides,
            orchestrator: { ...base.orchestrator, ...overrides.orchestrator },
            etl: { ...base.etl, ...overrides.etl },
            storage: { ...base.storage, ...overrides.storage },
            dataLake: { ...base.dataLake, ...overrides.dataLake },
            security: { ...base.security, ...overrides.security },
            integration: { ...base.integration, ...overrides.integration },
            performance: { ...base.performance, ...overrides.performance }
        };
    }
}
exports.DataWarehouseConfigFactory = DataWarehouseConfigFactory;
exports.configFactory = DataWarehouseConfigFactory;
//# sourceMappingURL=warehouse-config-factory.js.map