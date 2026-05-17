/**
 * HASIVU Epic 3 → Story 4: Data Warehouse Type Definitions
 *
 * Comprehensive type definitions for the data warehouse platform
 *
 * @author HASIVU Development Team
 * @version 1.0.0
 * @since 2024-09-18
 */

// Import proper types from engine-specific files
import { ETLPipelineConfig } from './etl-types';
import { AnalyticsStorageConfig } from './storage-types';
import {
  IntegrationConfig as _BaseIntegrationConfig,
  ConnectionConfig as _ConnectionConfig,
  DataMapping as _DataMapping,
  SyncSchedule as _SyncSchedule,
  RetryPolicy as _RetryPolicy,
  HealthCheckConfig as _HealthCheckConfig,
  DataSyncConfig,
  EventStreamConfig,
  APIGatewayConfig,
  ServiceMeshConfig,
} from './integration-types';

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

// Create a warehouse-specific integration config that extends the base
export interface WarehouseIntegrationConfig {
  // Legacy compatibility properties
  apis: string[];
  webhooks: string[];
  realTimeSync: boolean;

  // Extended properties for orchestrator compatibility
  systems: {
    enabled: string[];
    predictiveAnalytics: { endpoint: string };
    businessIntelligence: { endpoint: string };
    performanceMonitoring: { endpoint: string };
    vendorMarketplace: { endpoint: string };
    authentication: { endpoint: string };
    kitchenManagement: { endpoint: string };
    core: { endpoint: string };
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

// Use WarehouseIntegrationConfig as the integration config type for the warehouse
export type IntegrationConfig = WarehouseIntegrationConfig;

export interface PartitioningConfig {
  enabled: boolean;
  strategy: 'time_based' | 'hash_based';
  interval?: 'daily' | 'weekly' | 'monthly';
}

// Core warehouse configuration
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

// Warehouse status types
export type DataWarehouseStatus =
  | 'initializing'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'error';

// Orchestrator configuration
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

// Schema definitions
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
    indexes: Array<{ columns: string[]; type: string }>;
    statistics: Record<string, unknown>;
    evolution?: {
      previousVersion: number;
      changes: Record<string, unknown>;
      appliedAt: Date;
    };
  };
}

// Data model types
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

// Query types
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

// Partition strategy types
export interface PartitionStrategy {
  type: 'time_based' | 'hash_based' | 'range_based' | 'hybrid';
  config: {
    partitionColumn?: string;
    interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    buckets?: number;
    ranges?: Array<{ min: unknown; max: unknown }>;
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

// Compression configuration
export interface CompressionConfig {
  enabled: boolean;
  algorithm: 'snappy' | 'gzip' | 'lz4' | 'zstd';
  level: number;
  columnStore?: boolean;
  deltaEncoding?: boolean;
  dictionaryCompression?: boolean;
}

// Temporal data management
export interface TemporalConfig {
  enabled: boolean;
  retentionPeriod: string;
  archiveStrategy: 'delete' | 'archive' | 'compress';
  slowlyChangingDimensions: {
    type1: boolean; // overwrite
    type2: boolean; // add new record
    type3: boolean; // add new attribute
  };
}

// Data lineage
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

// Metadata management
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

// Query optimization
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

// Tenant isolation
export interface TenantIsolationConfig {
  enabled: boolean;
  strategy: 'schema' | 'database' | 'row_level';
  defaultIsolation: 'strict' | 'relaxed';
  crossTenantQueries: boolean;
}

// Star schema specific
export interface StarSchemaConfig {
  maxDimensions: number;
  autoIndexing: boolean;
  denormalization: {
    enabled: boolean;
    threshold: number;
  };
}

// Snowflake schema specific
export interface SnowflakeSchemaConfig {
  maxHierarchyDepth: number;
  normalizationLevel: number;
  bridgeTableSupport: boolean;
}

// Lineage configuration
export interface LineageConfig {
  trackingEnabled: boolean;
  impactAnalysis: boolean;
  retentionPeriod: string;
  realTimeTracking: boolean;
}

// Re-export specific types to avoid conflicts
// Note: Individual engine files should import their required types directly
// to prevent circular dependencies and conflicts

// Types are already exported through their interface declarations above
