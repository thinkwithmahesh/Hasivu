"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationOrchestrator = exports.SecurityComplianceFramework = exports.DataLakeManager = exports.AnalyticsStorageEngine = exports.ETLPipelineEngine = exports.DataWarehouseOrchestrator = exports.DataWarehousePlatform = void 0;
const warehouse_orchestrator_1 = require("./core/warehouse-orchestrator");
Object.defineProperty(exports, "DataWarehouseOrchestrator", { enumerable: true, get: function () { return warehouse_orchestrator_1.DataWarehouseOrchestrator; } });
const pipeline_engine_1 = require("./etl/pipeline-engine");
Object.defineProperty(exports, "ETLPipelineEngine", { enumerable: true, get: function () { return pipeline_engine_1.ETLPipelineEngine; } });
const analytics_storage_1 = require("./storage/analytics-storage");
Object.defineProperty(exports, "AnalyticsStorageEngine", { enumerable: true, get: function () { return analytics_storage_1.AnalyticsStorageEngine; } });
const data_lake_manager_1 = require("./storage/data-lake-manager");
Object.defineProperty(exports, "DataLakeManager", { enumerable: true, get: function () { return data_lake_manager_1.DataLakeManager; } });
const compliance_framework_1 = require("./security/compliance-framework");
Object.defineProperty(exports, "SecurityComplianceFramework", { enumerable: true, get: function () { return compliance_framework_1.SecurityComplianceFramework; } });
const integration_orchestrator_1 = require("./integration/integration-orchestrator");
Object.defineProperty(exports, "IntegrationOrchestrator", { enumerable: true, get: function () { return integration_orchestrator_1.IntegrationOrchestrator; } });
const warehouse_config_factory_1 = require("./config/warehouse-config-factory");
const logger_1 = require("../../shared/utils/logger");
const metrics_service_1 = require("../../services/metrics.service");
const health_monitor_service_1 = __importStar(require("../../services/health-monitor.service"));
class DataWarehousePlatform {
    config;
    static createDevelopment(overrides) {
        const config = warehouse_config_factory_1.DataWarehouseConfigFactory.createDevelopmentConfig(overrides);
        return new DataWarehousePlatform(config);
    }
    static createProduction(overrides) {
        const config = warehouse_config_factory_1.DataWarehouseConfigFactory.createProductionConfig(overrides);
        return new DataWarehousePlatform(config);
    }
    static createTest(overrides) {
        const config = warehouse_config_factory_1.DataWarehouseConfigFactory.createTestConfig(overrides);
        return new DataWarehousePlatform(config);
    }
    metrics = new metrics_service_1.MetricsCollector();
    health = new health_monitor_service_1.default(health_monitor_service_1.default.createDefaultConfig());
    orchestrator;
    etlEngine;
    storageEngine;
    dataLake;
    security;
    integration;
    isInitialized = false;
    status = 'initializing';
    constructor(config) {
        this.config = config;
        const validation = warehouse_config_factory_1.DataWarehouseConfigFactory.validateConfiguration(config);
        if (!validation.valid) {
            throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
        }
        logger_1.logger.info('Initializing HASIVU Data Warehousing Platform', {
            version: '1.0.0',
            supportedSchools: config.maxSchools || 500,
            storageMode: config.storage.mode,
            configValidation: 'passed'
        });
        this.initializeComponents();
    }
    async initializeComponents() {
        try {
            logger_1.logger.info('Initializing data warehouse components...');
            this.orchestrator = new warehouse_orchestrator_1.DataWarehouseOrchestrator(this.config.orchestrator);
            this.etlEngine = new pipeline_engine_1.ETLPipelineEngine(this.config.etl);
            this.storageEngine = new analytics_storage_1.AnalyticsStorageEngine(this.config.storage);
            this.dataLake = new data_lake_manager_1.DataLakeManager(this.convertDataLakeConfig(this.config.dataLake));
            this.security = new compliance_framework_1.SecurityComplianceFramework(this.convertSecurityConfig(this.config.security));
            this.integration = new integration_orchestrator_1.IntegrationOrchestrator(this.config.integration);
            logger_1.logger.info('Data warehouse components initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize data warehouse components', { error });
            throw error;
        }
    }
    async start() {
        try {
            logger_1.logger.info('Starting HASIVU Data Warehousing Platform...');
            this.status = 'starting';
            await this.security.initialize();
            logger_1.logger.info('Security framework initialized');
            await this.storageEngine.start();
            await this.dataLake.initialize();
            logger_1.logger.info('Storage engines started');
            await this.etlEngine.start();
            logger_1.logger.info('ETL pipeline engine started');
            await this.integration.start();
            logger_1.logger.info('Integration orchestrator started');
            await this.orchestrator.start();
            logger_1.logger.info('Data warehouse orchestrator started');
            this.status = 'running';
            this.isInitialized = true;
            this.startHealthMonitoring();
            logger_1.logger.info('HASIVU Data Warehousing Platform started successfully', {
                status: this.status,
                timestamp: new Date().toISOString()
            });
            this.metrics.increment('datawarehouse.startup.success');
            this.metrics.gauge('datawarehouse.status', 1);
        }
        catch (error) {
            this.status = 'error';
            logger_1.logger.error('Failed to start data warehousing platform', { error });
            this.metrics.increment('datawarehouse.startup.failure');
            throw error;
        }
    }
    async stop() {
        try {
            logger_1.logger.info('Stopping HASIVU Data Warehousing Platform...');
            this.status = 'stopping';
            await this.orchestrator.stop();
            await this.integration.stop();
            await this.etlEngine.stop();
            await this.dataLake.shutdown();
            await this.storageEngine.stop();
            await this.security.shutdown();
            this.status = 'stopped';
            this.isInitialized = false;
            logger_1.logger.info('Data warehousing platform stopped successfully');
            this.metrics.gauge('datawarehouse.status', 0);
        }
        catch (error) {
            this.status = 'error';
            logger_1.logger.error('Error stopping data warehousing platform', { error });
            throw error;
        }
    }
    async getStatus() {
        const [orchestratorHealth, etlHealth, storageHealth, dataLakeHealth, securityHealth, integrationHealth] = await Promise.all([
            this.orchestrator?.getHealthStatus() || { healthy: false },
            this.etlEngine?.getHealthStatus() || { healthy: false },
            this.storageEngine?.getHealthStatus() || { healthy: false },
            this.dataLake?.getHealthStatus() || { healthy: false },
            this.security?.getHealthStatus() || { healthy: false },
            this.integration?.getHealthStatus() || { healthy: false }
        ]);
        return {
            status: this.status,
            components: {
                orchestrator: orchestratorHealth,
                etlEngine: etlHealth,
                storageEngine: storageHealth,
                dataLake: dataLakeHealth,
                security: securityHealth,
                integration: integrationHealth
            },
            metrics: {
                totalQueries: this.metrics.getCounter('datawarehouse.query.total') || 0,
                successfulQueries: this.metrics.getCounter('datawarehouse.query.success') || 0,
                failedQueries: this.metrics.getCounter('datawarehouse.query.failed') || 0,
                averageQueryTime: this.metrics.getGauge('datawarehouse.query.avg_time') || 0,
                activeConnections: this.metrics.getGauge('datawarehouse.connections.active') || 0,
                storageUtilization: this.metrics.getGauge('datawarehouse.storage.utilization') || 0
            },
            health: {
                overall: this.status === 'running' && this.isInitialized,
                orchestrator: orchestratorHealth.healthy,
                etlEngine: etlHealth.healthy,
                storageEngine: storageHealth.healthy,
                dataLake: dataLakeHealth.healthy,
                security: securityHealth.healthy,
                integration: integrationHealth.healthy
            }
        };
    }
    startHealthMonitoring() {
        this.health.registerHealthCheck('datawarehouse-platform', async () => {
            const status = await this.getStatus();
            const startTime = Date.now();
            return {
                service: 'datawarehouse-platform',
                status: status.health.overall ? health_monitor_service_1.HealthSeverity.HEALTHY : health_monitor_service_1.HealthSeverity.CRITICAL,
                responseTime: Date.now() - startTime,
                timestamp: new Date(),
                message: status.health.overall ? 'Data warehouse platform operational' : 'Data warehouse platform has issues',
                details: status.components,
                metadata: {
                    version: '1.0.0',
                    uptime: this.isInitialized ? Date.now() - (this.metrics.getGauge('datawarehouse.startup.time') || Date.now()) : 0,
                    connections: status.metrics.activeConnections || 0,
                    memory: {
                        used: process.memoryUsage().heapUsed,
                        total: process.memoryUsage().heapTotal,
                        percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
                    }
                }
            };
        });
        setInterval(async () => {
            try {
                const status = await this.getStatus();
                this.metrics.gauge('datawarehouse.health.overall', status.health.overall ? 1 : 0);
                this.metrics.gauge('datawarehouse.health.orchestrator', status.health.orchestrator ? 1 : 0);
                this.metrics.gauge('datawarehouse.health.etl', status.health.etlEngine ? 1 : 0);
                this.metrics.gauge('datawarehouse.health.storage', status.health.storageEngine ? 1 : 0);
                this.metrics.gauge('datawarehouse.health.datalake', status.health.dataLake ? 1 : 0);
                this.metrics.gauge('datawarehouse.health.security', status.health.security ? 1 : 0);
                this.metrics.gauge('datawarehouse.health.integration', status.health.integration ? 1 : 0);
                Object.entries(status.health).forEach(([component, healthy]) => {
                    if (!healthy && component !== 'overall') {
                        logger_1.logger.warn(`Data warehouse component unhealthy: ${component}`);
                        this.metrics.increment(`datawarehouse.health.failure.${component}`);
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('Error during health monitoring', { error });
                this.metrics.increment('datawarehouse.health.monitoring.error');
            }
        }, 30000);
    }
    getOrchestrator() {
        if (!this.isInitialized) {
            throw new Error('Data warehouse not initialized');
        }
        return this.orchestrator;
    }
    getETLEngine() {
        if (!this.isInitialized) {
            throw new Error('Data warehouse not initialized');
        }
        return this.etlEngine;
    }
    getStorageEngine() {
        if (!this.isInitialized) {
            throw new Error('Data warehouse not initialized');
        }
        return this.storageEngine;
    }
    getDataLake() {
        if (!this.isInitialized) {
            throw new Error('Data warehouse not initialized');
        }
        return this.dataLake;
    }
    getSecurity() {
        if (!this.isInitialized) {
            throw new Error('Data warehouse not initialized');
        }
        return this.security;
    }
    getIntegration() {
        if (!this.isInitialized) {
            throw new Error('Data warehouse not initialized');
        }
        return this.integration;
    }
    convertDataLakeConfig(warehouseConfig) {
        return {
            storageLocation: {
                type: 's3',
                path: `s3://${warehouseConfig.bucketName}/data-lake`,
                region: warehouseConfig.region || 'us-east-1',
                bucket: warehouseConfig.bucketName,
                credentials: {
                    accessKey: process.env.AWS_ACCESS_KEY_ID,
                    secretKey: process.env.AWS_SECRET_ACCESS_KEY
                }
            },
            defaultFormat: 'parquet',
            defaultCompression: 'snappy',
            defaultPartitioning: 'time-based',
            retentionPolicy: {
                enabled: true,
                type: 'time-based',
                value: 2555,
                unit: 'days',
                exceptions: []
            },
            accessControl: {
                enabled: true,
                visibility: 'internal',
                permissions: [],
                roles: [],
                policies: [],
                encryption: {
                    enabled: true,
                    algorithm: 'AES-256',
                    keyId: 'auto-generated',
                    keyManagement: 'automatic',
                    keyRotation: true,
                    rotationPeriod: 90,
                    rotationInterval: 90,
                    encryptionScope: 'file'
                }
            },
            encryption: {
                enabled: warehouseConfig.encryption?.enabled || false,
                algorithm: 'AES-256',
                keyId: warehouseConfig.encryption?.kmsKeyId || 'default',
                keyRotation: true,
                rotationInterval: 90,
                encryptionScope: 'file'
            },
            monitoring: {
                enabled: true,
                metricsInterval: 60,
                alerting: {
                    enabled: true,
                    channels: [],
                    thresholds: [],
                    escalation: {
                        levels: [],
                        timeout: 30
                    }
                },
                logging: {
                    enabled: true,
                    level: 'info',
                    format: 'json',
                    destination: 'console',
                    retention: 30
                },
                healthChecks: {
                    enabled: true,
                    interval: 30,
                    timeout: 10,
                    retries: 3,
                    endpoints: []
                }
            },
            optimization: {
                enabled: true,
                autoOptimization: true,
                compactionEnabled: true,
                compactionThreshold: 100,
                indexingEnabled: true,
                cacheEnabled: true,
                cacheSize: 1024,
                cachePolicy: 'lru'
            },
            replication: {
                enabled: false,
                targets: [],
                strategy: 'async',
                consistency: 'eventual',
                compression: false,
                encryption: false,
                verification: false,
                retryPolicy: {
                    maxAttempts: 3,
                    initialDelay: 1000,
                    maxDelay: 30000,
                    multiplier: 2,
                    strategy: 'exponential'
                }
            },
            backup: {
                enabled: true,
                frequency: 'daily',
                schedule: 'daily',
                retention: 30,
                compression: true,
                encryption: true,
                location: {
                    type: 's3',
                    path: 's3://hasivu-backups/data-warehouse',
                    region: 'us-east-1',
                    bucket: 'hasivu-backups'
                },
                verification: true,
                notification: {
                    enabled: true,
                    recipients: [],
                    channels: [],
                    template: 'backup-complete',
                    immediate: false
                }
            },
            governance: [],
            formats: {
                default: 'structured',
                supported: ['structured', 'semi-structured', 'unstructured']
            },
            compression: {
                default: 'snappy',
                supported: ['snappy', 'gzip', 'lz4', 'brotli']
            }
        };
    }
    convertSecurityConfig(warehouseConfig) {
        return {
            encryption: {
                algorithm: 'AES-256',
                keyRotation: { enabled: true, frequency: 30 },
                keyManagement: 'local',
                enabled: warehouseConfig.encryption || false
            },
            accessControl: {
                enabled: warehouseConfig.accessControl || false,
                defaultDeny: true,
                sessionTimeout: 3600
            },
            audit: {
                enabled: warehouseConfig.auditLogging || false,
                retentionDays: 365,
                logLevel: 'detailed'
            },
            monitoring: {
                enabled: true,
                realTimeAlerts: true,
                thresholds: { errorRate: 0.01, responseTime: 1000 }
            },
            compliance: {
                gdpr: { enabled: warehouseConfig.compliance?.gdpr || false },
                coppa: { enabled: warehouseConfig.compliance?.coppa || false }
            },
            zeroTrust: { enabled: false }
        };
    }
}
exports.DataWarehousePlatform = DataWarehousePlatform;
__exportStar(require("./types/security-types"), exports);
__exportStar(require("./types/integration-types"), exports);
exports.default = DataWarehousePlatform;
//# sourceMappingURL=index.js.map