import { ETLPipelineConfig } from '../types/etl-types';
import { AnalyticsStorageConfig } from '../types/storage-types';
import { IntegrationConfig } from '../types/integration-types';
export interface DataWarehouseConfig {
    orchestrator: WarehouseOrchestratorConfig;
    etl: ETLPipelineConfig;
    storage: AnalyticsStorageConfig;
    dataLake: DataLakeConfig;
    security: SecurityConfig;
    integration: IntegrationConfig;
    maxSchools: number;
    performance: {
        queryTimeout: number;
        maxConcurrentQueries: number;
        cacheSize: string;
    };
}
export interface WarehouseOrchestratorConfig {
    maxSchemas: number;
    cacheSize: string;
    compression: CompressionConfig;
    schemas: {
        star: StarSchemaConfig;
        snowflake: SnowflakeSchemaConfig;
    };
    temporal: TemporalConfig;
    lineage: LineageConfig;
    metadata: MetadataConfig;
    queryOptimization: QueryOptimizationConfig;
    partitioning: PartitioningConfig;
    tenantIsolation: TenantIsolationConfig;
}
export interface DataLakeConfig {
    enabled: boolean;
    provider: 'aws-s3' | 'gcp-storage' | 'azure-blob';
    bucketName: string;
    region?: string;
    encryption?: {
        enabled: boolean;
        kmsKeyId?: string;
    };
    lifecycle?: {
        enabled: boolean;
        transitionToIA: number;
        transitionToGlacier: number;
        expiration: number;
    };
}
export interface SecurityConfig {
    encryption: boolean;
    accessControl: boolean;
    auditLogging: boolean;
    compliance: {
        gdpr: boolean;
        coppa: boolean;
        soc2: boolean;
        hipaa: boolean;
    };
    dataClassification: {
        enabled: boolean;
        levels: string[];
    };
}
export interface CompressionConfig {
    enabled: boolean;
    algorithm: 'snappy' | 'gzip' | 'lz4' | 'zstd';
    level: number;
    columnStore?: boolean;
    deltaEncoding?: boolean;
    dictionaryCompression?: boolean;
}
export interface StarSchemaConfig {
    maxDimensions: number;
    autoIndexing: boolean;
    denormalization: {
        enabled: boolean;
        threshold: number;
    };
}
export interface SnowflakeSchemaConfig {
    maxHierarchyDepth: number;
    normalizationLevel: number;
    bridgeTableSupport: boolean;
}
export interface TemporalConfig {
    enabled: boolean;
    retentionPeriod: string;
    archiveStrategy: 'delete' | 'archive' | 'compress';
    slowlyChangingDimensions: {
        type1: boolean;
        type2: boolean;
        type3: boolean;
    };
}
export interface LineageConfig {
    trackingEnabled: boolean;
    impactAnalysis: boolean;
    retentionPeriod: string;
    realTimeTracking: boolean;
}
export interface MetadataConfig {
    autoDiscovery: boolean;
    cataloging: {
        enabled: boolean;
        scanInterval: string;
    };
    governance: {
        approvalRequired: boolean;
        versionControl: boolean;
    };
}
export interface QueryOptimizationConfig {
    enabled: boolean;
    statisticsCollection: {
        enabled: boolean;
        interval: string;
    };
    costBasedOptimization: boolean;
    indexHints: boolean;
    pushdownOptimization: boolean;
}
export interface PartitioningConfig {
    enabled: boolean;
    strategy: 'time_based' | 'hash_based';
    interval?: 'daily' | 'weekly' | 'monthly';
}
export interface TenantIsolationConfig {
    enabled: boolean;
    strategy: 'schema' | 'database' | 'row_level';
    defaultIsolation: 'strict' | 'relaxed';
    crossTenantQueries: boolean;
}
export declare class DataWarehouseConfigFactory {
    static createDevelopmentConfig(overrides?: Partial<DataWarehouseConfig>): DataWarehouseConfig;
    static createProductionConfig(overrides?: Partial<DataWarehouseConfig>): DataWarehouseConfig;
    static createTestConfig(overrides?: Partial<DataWarehouseConfig>): DataWarehouseConfig;
    static validateConfiguration(config: DataWarehouseConfig): {
        valid: boolean;
        errors: string[];
    };
    private static createDevelopmentOrchestratorConfig;
    private static createDevelopmentETLConfig;
    private static createDevelopmentStorageConfig;
    private static createDevelopmentDataLakeConfig;
    private static createDevelopmentSecurityConfig;
    private static createDevelopmentIntegrationConfig;
    private static createProductionOrchestratorConfig;
    private static createProductionETLConfig;
    private static createProductionStorageConfig;
    private static createProductionDataLakeConfig;
    private static createProductionSecurityConfig;
    private static createProductionIntegrationConfig;
    private static createTestOrchestratorConfig;
    private static createTestETLConfig;
    private static createTestStorageConfig;
    private static createTestDataLakeConfig;
    private static createTestSecurityConfig;
    private static createTestIntegrationConfig;
    private static mergeConfigurations;
}
export declare const configFactory: typeof DataWarehouseConfigFactory;
//# sourceMappingURL=warehouse-config-factory.d.ts.map