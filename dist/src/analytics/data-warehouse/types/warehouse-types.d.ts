import { ETLPipelineConfig } from './etl-types';
import { AnalyticsStorageConfig } from './storage-types';
import { DataSyncConfig, EventStreamConfig, APIGatewayConfig, ServiceMeshConfig } from './integration-types';
export interface DataLakeConfig {
    enabled: boolean;
    provider: 'aws-s3' | 'gcp-storage' | 'azure-blob';
    bucketName: string;
}
export interface SecurityConfig {
    encryption: boolean;
    accessControl: boolean;
    auditLogging: boolean;
}
export interface WarehouseIntegrationConfig {
    apis: string[];
    webhooks: string[];
    realTimeSync: boolean;
    systems: {
        enabled: string[];
        predictiveAnalytics: {
            endpoint: string;
        };
        businessIntelligence: {
            endpoint: string;
        };
        performanceMonitoring: {
            endpoint: string;
        };
        vendorMarketplace: {
            endpoint: string;
        };
        authentication: {
            endpoint: string;
        };
        kitchenManagement: {
            endpoint: string;
        };
        core: {
            endpoint: string;
        };
    };
    sync: DataSyncConfig;
    streaming: EventStreamConfig;
    apiGateway: APIGatewayConfig;
    serviceMesh: ServiceMeshConfig;
    dataFlow: {
        enabled: boolean;
        maxConcurrent: number;
    };
    tracing: {
        enabled: boolean;
        samplingRate: number;
    };
}
export type IntegrationConfig = WarehouseIntegrationConfig;
export interface PartitioningConfig {
    enabled: boolean;
    strategy: 'time_based' | 'hash_based';
    interval?: 'daily' | 'weekly' | 'monthly';
}
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
export type DataWarehouseStatus = 'initializing' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
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
export interface SchemaDefinition {
    name: string;
    type: 'star' | 'snowflake';
    schema: Record<string, unknown>;
    partitionStrategy: PartitionStrategy;
    compressionConfig: CompressionConfig;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    metadata: {
        factTable?: string;
        dimensionTables?: string[];
        dimensionHierarchy?: Record<string, string[]>;
        indexes: Array<{
            columns: string[];
            type: string;
        }>;
        statistics: Record<string, unknown>;
        evolution?: {
            previousVersion: number;
            changes: Record<string, unknown>;
            appliedAt: Date;
        };
    };
}
export interface DataModel {
    name: string;
    schema: string;
    tables: TableDefinition[];
    relationships: RelationshipDefinition[];
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TableDefinition {
    name: string;
    columns: ColumnDefinition[];
    primaryKey: string[];
    foreignKeys: ForeignKeyDefinition[];
    indexes: IndexDefinition[];
    partitioning?: PartitionDefinition;
}
export interface ColumnDefinition {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: unknown;
    constraints?: string[];
    classification?: 'public' | 'internal' | 'confidential' | 'restricted';
}
export interface RelationshipDefinition {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many';
}
export interface ForeignKeyDefinition {
    columns: string[];
    referencedTable: string;
    referencedColumns: string[];
    onDelete: 'cascade' | 'restrict' | 'set null';
    onUpdate: 'cascade' | 'restrict' | 'set null';
}
export interface IndexDefinition {
    name: string;
    columns: string[];
    type: 'btree' | 'hash' | 'bitmap' | 'inverted';
    unique: boolean;
    partial?: string;
}
export interface PartitionDefinition {
    type: 'range' | 'hash' | 'list';
    columns: string[];
    partitions: PartitionInfo[];
}
export interface PartitionInfo {
    name: string;
    condition: string;
    tablespace?: string;
}
export interface WarehouseQuery {
    id: string;
    sql: string;
    parameters?: Record<string, unknown>;
    cacheTimeout?: number;
    cacheable?: boolean;
    priority?: 'low' | 'normal' | 'high';
    timeout?: number;
}
export interface QueryResult {
    id: string;
    rows: unknown[];
    columns: ColumnInfo[];
    rowCount: number;
    executionTimeMs: number;
    executedAt: Date;
    cached: boolean;
    tenantId: string;
    metadata: {
        tablesScanned: string[];
        partitionsPruned: number;
        indexesUsed: string[];
        optimizations: string[];
    };
}
export interface ColumnInfo {
    name: string;
    type: string;
    nullable: boolean;
}
export interface PartitionStrategy {
    type: 'time_based' | 'hash_based' | 'range_based' | 'hybrid';
    config: {
        partitionColumn?: string;
        interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
        buckets?: number;
        ranges?: Array<{
            min: unknown;
            max: unknown;
        }>;
        timePartition?: {
            column: string;
            interval: string;
        };
        hashPartition?: {
            column: string;
            buckets: number;
        };
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
export interface DataLineage {
    id: string;
    sourceTables: string[];
    targetTable: string;
    transformations: TransformationInfo[];
    dependencies: DependencyInfo[];
    impact: ImpactInfo[];
    createdAt: Date;
    updatedAt: Date;
}
export interface TransformationInfo {
    type: 'join' | 'aggregate' | 'filter' | 'project' | 'union';
    description: string;
    parameters: Record<string, unknown>;
}
export interface DependencyInfo {
    table: string;
    columns: string[];
    relationshipType: 'direct' | 'indirect';
}
export interface ImpactInfo {
    affectedTable: string;
    affectedColumns: string[];
    impactType: 'data' | 'schema' | 'performance';
}
export interface MetadataEntry {
    id: string;
    type: 'table' | 'column' | 'index' | 'view' | 'procedure';
    name: string;
    description?: string;
    tags: string[];
    properties: Record<string, unknown>;
    owner: string;
    createdAt: Date;
    updatedAt: Date;
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
export interface TenantIsolationConfig {
    enabled: boolean;
    strategy: 'schema' | 'database' | 'row_level';
    defaultIsolation: 'strict' | 'relaxed';
    crossTenantQueries: boolean;
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
export interface LineageConfig {
    trackingEnabled: boolean;
    impactAnalysis: boolean;
    retentionPeriod: string;
    realTimeTracking: boolean;
}
//# sourceMappingURL=warehouse-types.d.ts.map