/**
 * HASIVU Epic 3 → Story 4: Analytics Storage Type Definitions
 *
 * Comprehensive type definitions for analytics storage engine
 *
 * @author HASIVU Development Team
 * @version 1.0.0
 * @since 2024-09-18
 */

// Analytics storage configuration
export interface AnalyticsStorageConfig {
  mode: 'distributed' | 'memory' | 'hybrid';
  maxConcurrentQueries: number;
  cacheSize: string;
  distributed: DistributedConfig;
  memory: MemoryConfig;
  hybrid: HybridConfig;
  tiering: TieringConfig;
  indexing: IndexingConfig;
  compression: CompressionConfig;
  views: MaterializedViewConfig;
  optimization: OptimizationConfig;
  parallel: ParallelConfig;
  monitoring: MonitoringConfig;
  tenantIsolation: TenantIsolationConfig;
  performance: PerformanceConfig;
}

// Storage query interface
export interface StorageQuery {
  id: string;
  sql?: string;
  queryType: QueryType;
  parameters?: Record<string, any>;
  cacheTimeout?: number;
  cacheable?: boolean;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  explain?: boolean;
  filters?: QueryFilter[];
  joins?: QueryJoin[];
  limit?: number;
  offset?: number;
  aggregations?: QueryAggregation[];
}

export interface QueryFilter {
  column: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';
  value: any;
}

export interface QueryJoin {
  type: 'inner' | 'left' | 'right' | 'full';
  table: string;
  condition: string;
}

export interface QueryAggregation {
  function: 'count' | 'sum' | 'avg' | 'min' | 'max';
  column?: string;
  alias?: string;
}

export type QueryType = 'select' | 'aggregate' | 'join' | 'window' | 'analytical' | 'olap';

// Query result interface
export interface QueryResult {
  id: string;
  rows: any[] | undefined | undefined;
  columns: ColumnMetadata[];
  rowCount: number;
  executionTimeMs: number;
  executionTime?: number; // Legacy support, same as executionTimeMs
  executedAt: Date;
  cached: boolean;
  tenantId: string;
  executionPlan?: QueryPlan;
  metadata: QueryMetadata;
}

export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  precision?: number;
  scale?: number;
}

export interface QueryMetadata {
  tablesScanned: string[];
  partitionsPruned: number;
  indexesUsed: string[];
  optimizations: string[];
  cacheHit: boolean;
  tier: StorageTier;
  totalRecords?: number; // For distributed query results
  nodesQueried?: number; // For distributed processing
  executionTime?: number; // For distributed query timing
}

// Storage tiers
export type StorageTier = 'memory' | 'hot' | 'warm' | 'cold' | 'distributed' | 'archive';

// Query plan
export interface QueryPlan {
  id: string;
  query: StorageQuery;
  tenantId: string;
  tier: StorageTier;
  indexes: string[];
  parallelism: number;
  estimatedTime: number;
  estimatedCost: number;
  createdAt: Date;
  optimizations: PlanOptimization[];
  nodes?: string[]; // For distributed execution
  fragments?: Record<string, any>; // For distributed query fragments
}

export interface PlanOptimization {
  type:
    | 'predicate_pushdown'
    | 'projection_pushdown'
    | 'join_reorder'
    | 'index_scan'
    | 'partition_pruning';
  description: string;
  impact: 'high' | 'medium' | 'low';
}

// Distributed configuration
export interface DistributedConfig {
  enabled: boolean;
  engine: 'spark' | 'presto' | 'trino' | 'clickhouse';
  cluster: ClusterConfig;
  storage: DistributedStorageConfig;
  networking: NetworkingConfig;
}

export interface ClusterConfig {
  nodes: NodeConfig[];
  coordinator: CoordinatorConfig;
  autoScaling: AutoScalingConfig;
}

export interface NodeConfig {
  id: string;
  host: string;
  port: number;
  cores: number;
  memory: string;
  storage: string;
  role: 'coordinator' | 'worker' | 'hybrid';
}

export interface CoordinatorConfig {
  host: string;
  port: number;
  webUI: {
    enabled: boolean;
    port: number;
  };
}

export interface AutoScalingConfig {
  enabled: boolean;
  minNodes: number;
  maxNodes: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number;
}

export interface DistributedStorageConfig {
  backend: 'hdfs' | 's3' | 'gcs' | 'azure_blob';
  replicationFactor: number;
  blockSize: string;
  compression: CompressionStrategy;
}

export interface NetworkingConfig {
  protocol: 'tcp' | 'ssl';
  maxConnections: number;
  timeout: number;
  bufferSize: string;
}

// Memory configuration
export interface MemoryConfig {
  enabled: boolean;
  engine: 'redis' | 'hazelcast' | 'ignite' | 'custom';
  cluster: MemoryClusterConfig;
  caching: CachingConfig;
  persistence: PersistenceConfig;
}

export interface MemoryClusterConfig {
  nodes: MemoryNodeConfig[];
  replication: ReplicationConfig;
  partitioning: PartitioningConfig;
}

export interface MemoryNodeConfig {
  id: string;
  host: string;
  port: number;
  memory: string;
  role: 'master' | 'replica' | 'sentinel';
}

export interface ReplicationConfig {
  enabled: boolean;
  factor: number;
  strategy: 'sync' | 'async';
  consistency: 'strong' | 'eventual';
}

export interface PartitioningConfig {
  strategy: 'hash' | 'range' | 'list';
  partitions: number;
  keyColumn: string;
}

export interface CachingConfig {
  strategy: 'lru' | 'lfu' | 'ttl' | 'custom';
  maxSize: string;
  ttl: number;
  evictionPolicy: EvictionPolicy;
}

export interface EvictionPolicy {
  algorithm: 'lru' | 'lfu' | 'random' | 'ttl';
  maxMemoryPolicy: 'volatile-lru' | 'allkeys-lru' | 'volatile-random' | 'allkeys-random';
  samples: number;
}

export interface PersistenceConfig {
  enabled: boolean;
  strategy: 'rdb' | 'aof' | 'both';
  interval: number;
  compression: boolean;
}

// Hybrid configuration
export interface HybridConfig {
  memoryThreshold: number;
  costThreshold: number;
  routingStrategy: 'cost_based' | 'size_based' | 'complexity_based' | 'adaptive';
  fallbackStrategy: 'distributed' | 'memory' | 'fail';
}

// Tiering configuration
export interface TieringConfig {
  enabled: boolean;
  policies: TieringPolicy[];
  migration: MigrationConfig;
  monitoring: TieringMonitoringConfig;
}

export interface TieringPolicy {
  name: string;
  conditions: TieringCondition[];
  sourceTier: StorageTier;
  targetTier: StorageTier;
  schedule?: string;
}

export interface TieringCondition {
  type: 'age' | 'access_frequency' | 'size' | 'cost' | 'custom';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  value: any;
  unit?: string;
}

export interface MigrationConfig {
  batchSize: number;
  parallelism: number;
  retryPolicy: RetryPolicy;
  verification: boolean;
}

export interface TieringMonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerting: AlertingConfig;
}

// Indexing configuration
export interface IndexingConfig {
  autoIndexing: boolean;
  strategies: IndexStrategy[];
  monitoring: IndexMonitoringConfig;
  maintenance: IndexMaintenanceConfig;
}

export interface IndexStrategy {
  type: 'btree' | 'hash' | 'bitmap' | 'inverted' | 'bloom' | 'zonemap';
  conditions: IndexCondition[];
  cost: IndexCost;
  maintenance: IndexMaintenance;
}

export interface IndexCondition {
  selectivity: number;
  cardinality: number;
  accessPattern: 'sequential' | 'random' | 'range';
  queryFrequency: number;
}

export interface IndexCost {
  creationTime: number;
  maintenanceOverhead: number;
  storageOverhead: number;
  querySpeedup: number;
}

export interface IndexMaintenance {
  rebuildThreshold: number;
  rebuildSchedule?: string;
  statisticsUpdate: boolean;
}

export interface IndexMonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerting: AlertingConfig;
}

export interface IndexMaintenanceConfig {
  autoRebuild: boolean;
  rebuildSchedule: string;
  statisticsUpdate: {
    enabled: boolean;
    schedule: string;
  };
}

// Compression configuration
export interface CompressionStrategy {
  algorithm: 'snappy' | 'gzip' | 'lz4' | 'zstd' | 'brotli';
  level: number;
  blockSize?: string;
  dictionary?: boolean;
}

export interface CompressionConfig {
  enabled: boolean;
  strategies: CompressionStrategy[];
  adaptiveCompression: AdaptiveCompressionConfig;
  monitoring: CompressionMonitoringConfig;
}

export interface AdaptiveCompressionConfig {
  enabled: boolean;
  dataTypeOptimization: boolean;
  compressionRatioThreshold: number;
  performanceImpactThreshold: number;
}

export interface CompressionMonitoringConfig {
  enabled: boolean;
  metrics: string[];
  reporting: ReportingConfig;
}

// Materialized views
export interface MaterializedView {
  id: string;
  name: string;
  query: StorageQuery;
  tenantId: string;
  refreshInterval: number;
  incremental: boolean;
  partitionBy?: string;
  lastRefresh: Date;
  status: ViewStatus;
  metadata: ViewMetadata;
}

export type ViewStatus = 'creating' | 'active' | 'refreshing' | 'failed' | 'disabled';

export interface ViewMetadata {
  size: number;
  rowCount: number;
  dependencies: string[];
  refreshHistory: RefreshHistory[];
  performance: ViewPerformance;
}

export interface RefreshHistory {
  timestamp: Date;
  duration: number;
  rowsProcessed: number;
  status: 'success' | 'failed';
  error?: string;
}

export interface ViewPerformance {
  avgRefreshTime: number;
  hitRate: number;
  querySpeedup: number;
}

export interface MaterializedViewConfig {
  enabled: boolean;
  maxViews: number;
  defaultRefreshInterval: number;
  autoRefresh: boolean;
  monitoring: ViewMonitoringConfig;
}

export interface ViewMonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerting: AlertingConfig;
}

// Optimization configuration
export interface OptimizationConfig {
  enabled: boolean;
  autoOptimize: boolean;
  costBasedOptimization: boolean;
  ruleBasedOptimization: boolean;
  statisticsCollection: StatisticsConfig;
  queryRewriting: QueryRewritingConfig;
  joinOptimization: JoinOptimizationConfig;
}

export interface StatisticsConfig {
  enabled: boolean;
  autoUpdate: boolean;
  updateSchedule: string;
  sampleSize: number;
  histograms: boolean;
}

export interface QueryRewritingConfig {
  enabled: boolean;
  rules: RewritingRule[];
  predicate_pushdown: boolean;
  projection_pushdown: boolean;
}

export interface RewritingRule {
  name: string;
  condition: string;
  transformation: string;
  priority: number;
}

export interface JoinOptimizationConfig {
  enabled: boolean;
  reorderJoins: boolean;
  bloomFilters: boolean;
  broadcastThreshold: string;
}

// Parallel processing
export interface ParallelConfig {
  enabled: boolean;
  maxParallelism: number;
  adaptiveParallelism: boolean;
  workStealing: boolean;
  loadBalancing: LoadBalancingConfig;
}

export interface LoadBalancingConfig {
  strategy: 'round_robin' | 'least_connections' | 'resource_based' | 'adaptive';
  healthChecks: boolean;
  failover: FailoverConfig;
}

export interface FailoverConfig {
  enabled: boolean;
  retryAttempts: number;
  timeout: number;
  circuitBreaker: CircuitBreakerConfig;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  timeout: number;
  halfOpenMaxCalls: number;
}

// Monitoring configuration
export interface MonitoringConfig {
  enabled: boolean;
  metrics: MetricsConfig;
  alerting: AlertingConfig;
  tracing: TracingConfig;
  profiling: ProfilingConfig;
}

export interface MetricsConfig {
  collection: {
    enabled: boolean;
    interval: number;
  };
  storage: {
    backend: 'prometheus' | 'influxdb' | 'elasticsearch';
    retention: string;
  };
  exporters: ExporterConfig[];
}

export interface ExporterConfig {
  type: 'prometheus' | 'jaeger' | 'zipkin' | 'custom';
  endpoint: string;
  interval: number;
}

export interface TracingConfig {
  enabled: boolean;
  sampler: {
    type: 'const' | 'probabilistic' | 'adaptive';
    param: number;
  };
  reporter: {
    endpoint: string;
    bufferSize: number;
    flushInterval: number;
  };
}

export interface ProfilingConfig {
  enabled: boolean;
  cpuProfiling: boolean;
  memoryProfiling: boolean;
  queryProfiling: boolean;
  duration: number;
}

// Performance configuration
export interface PerformanceConfig {
  queryTimeout: number;
  slowQueryThreshold: number;
  maxMemoryUsage: string;
  gcTuning: GCTuningConfig;
  connectionPooling: ConnectionPoolingConfig;
}

export interface GCTuningConfig {
  algorithm: 'G1' | 'CMS' | 'Parallel' | 'Serial';
  heapSize: string;
  newRatio: number;
  maxGCPauseMillis: number;
}

export interface ConnectionPoolingConfig {
  maxConnections: number;
  minConnections: number;
  maxIdleTime: number;
  connectionTimeout: number;
}

// Storage statistics
export interface StorageStatistics {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  compressionRatio: number;
  tiering: TieringStatistics;
  indexes: IndexStatistics;
  queries: QueryStatistics;
  materializedViews: ViewStatistics;
}

export interface TieringStatistics {
  hot: TierStatistics;
  warm: TierStatistics;
  cold: TierStatistics;
  archived: TierStatistics;
}

export interface TierStatistics {
  size: number;
  objectCount: number;
  accessFrequency: number;
  lastAccessed: Date;
}

export interface IndexStatistics {
  totalIndexes: number;
  totalSize: number;
  averageHitRate: number;
  maintenanceOverhead: number;
}

export interface QueryStatistics {
  total: number;
  averageExecutionTime: number;
  cacheHitRate: number;
  slowQueries: number;
}

export interface ViewStatistics {
  total: number;
  lastRefresh: Date;
  hitRate: number;
  averageRefreshTime: number;
}

// Common interfaces
export interface AlertingConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  config: Record<string, any>;
}

export interface AlertRule {
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  duration: number;
}

export interface ReportingConfig {
  enabled: boolean;
  schedule: string;
  format: 'json' | 'csv' | 'html' | 'pdf';
  recipients: string[];
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  multiplier?: number;
}

export interface TenantIsolationConfig {
  enabled: boolean;
  strategy: 'namespace' | 'database' | 'schema' | 'row_level';
  enforcement: 'strict' | 'permissive';
  monitoring: boolean;
}

export interface PartitionInfo {
  id: string;
  type: 'range' | 'hash' | 'list' | 'composite';
  key: string;
  value: any;
  size: number;
  recordCount: number;
  created: Date;
  lastAccessed: Date;
  lastCompacted?: Date;
  tier: StorageTier;
  compressionRatio?: number;
  indexes: string[];
}
