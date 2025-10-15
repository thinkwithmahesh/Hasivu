/**
 * HASIVU Epic 3 → Story 4: ETL Pipeline Type Definitions
 *
 * Comprehensive type definitions for ETL/ELT pipelines
 *
 * @author HASIVU Development Team
 * @version 1.0.0
 * @since 2024-09-18
 */

// ETL Pipeline configuration
export interface ETLPipelineConfig {
  maxConcurrentPipelines: number;
  streaming: StreamingConfig;
  batch: BatchConfig;
  deltaLake: DeltaLakeConfig;
  schemaEvolution: SchemaEvolutionConfig;
  orchestration: OrchestrationConfig;
  transformation: TransformationConfig;
  validation: ValidationConfig;
  errorHandling: ErrorHandlingConfig;
  cdc: CDCConfig;
  dataQuality: DataQualityConfig;
}

// Pipeline definition
export interface Pipeline {
  id: string;
  name: string;
  description: string;
  source: DataSource;
  sink: DataSink;
  transformations: TransformationStep[];
  schedule?: string;
  realtime: boolean;
  tenantId: string;
  status: PipelineStatus;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  config: PipelineConfig;
  metadata: PipelineMetadata;
}

export type PipelineStatus = 'created' | 'running' | 'paused' | 'stopped' | 'failed' | 'completed';

export interface PipelineConfig {
  maxRetries: number;
  timeoutMs: number;
  checkpointInterval: number;
  parallelism: number;
  bufferSize: number;
}

export interface PipelineMetadata {
  creator: string;
  tags: string[];
  priority: 'low' | 'normal' | 'high';
  estimatedDuration?: number;
  dependencies?: string[];
}

// Pipeline execution
export interface PipelineExecution {
  id: string;
  pipelineId: string;
  tenantId: string;
  status: ExecutionStatus;
  triggerType: 'manual' | 'scheduled' | 'streaming';
  parameters: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  progress: ExecutionProgress;
  metrics: ExecutionMetrics;
  logs: ExecutionLog[];
  errors: ExecutionError[];
}

export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ExecutionProgress {
  totalSteps: number;
  completedSteps: number;
  currentStep: string;
  percentage: number;
}

export interface ExecutionMetrics {
  recordsProcessed: number;
  recordsSkipped: number;
  recordsFailed: number;
  bytesProcessed: number;
  throughputRecordsPerSec: number;
}

export interface ExecutionLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface ExecutionError {
  message: string;
  stack?: string;
  timestamp: Date;
  step: string;
  recoverable: boolean;
}

// Data sources and sinks
export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  config: DataSourceConfig;
  schema?: SourceSchema;
  tenantId: string;
  cdcEnabled: boolean;
  healthEndpoint?: string;
  credentials?: CredentialConfig;
}

export type DataSourceType =
  | 'postgresql'
  | 'mysql'
  | 'mongodb'
  | 'redis'
  | 'kafka'
  | 'kinesis'
  | 'rest_api'
  | 'file'
  | 's3'
  | 'bigquery'
  | 'snowflake';

export interface DataSourceConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  timeout?: number;
  poolSize?: number;
  [key: string]: any;
}

export interface DataSink {
  id: string;
  name: string;
  type: DataSinkType;
  config: DataSinkConfig;
  schema?: SinkSchema;
  tenantId: string;
  partitioning?: PartitionConfig;
  compression?: CompressionConfig;
}

export type DataSinkType =
  | 'postgresql'
  | 'clickhouse'
  | 'bigquery'
  | 'snowflake'
  | 's3'
  | 'delta_lake'
  | 'elasticsearch'
  | 'kafka';

export interface DataSinkConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  table?: string;
  username?: string;
  password?: string;
  writeMode?: 'append' | 'overwrite' | 'merge';
  batchSize?: number;
  [key: string]: any;
}

// Transformation steps
export interface TransformationStep {
  id: string;
  name: string;
  type: TransformationType;
  config: TransformationConfig;
  inputSchema: any;
  outputSchema: any;
  validation: ValidationRule[];
  errorHandling: ErrorHandlingRule[];
}

export type TransformationType =
  | 'filter'
  | 'map'
  | 'aggregate'
  | 'join'
  | 'union'
  | 'sort'
  | 'deduplicate'
  | 'pivot'
  | 'window'
  | 'custom_sql'
  | 'custom_function';

export interface TransformationConfig {
  expression?: string;
  sql?: string;
  function?: string;
  parameters?: Record<string, any>;
  conditions?: FilterCondition[];
  aggregations?: AggregationRule[];
  joinConditions?: JoinCondition[];
}

export interface FilterCondition {
  column: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'like' | 'regex';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface AggregationRule {
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'stddev' | 'variance';
  column: string;
  alias: string;
  groupBy?: string[];
}

export interface JoinCondition {
  leftColumn: string;
  rightColumn: string;
  joinType: 'inner' | 'left' | 'right' | 'full' | 'cross';
}

// Streaming configuration
export interface StreamingConfig {
  enabled: boolean;
  engine: 'kafka' | 'kinesis' | 'pulsar' | 'redis_streams';
  config: StreamingEngineConfig;
  checkpointing: CheckpointConfig;
  watermarks: WatermarkConfig;
  windowing: WindowConfig;
}

export interface StreamingEngineConfig {
  brokers?: string[];
  topics?: string[];
  consumerGroup?: string;
  autoOffsetReset?: 'earliest' | 'latest';
  maxPollRecords?: number;
  sessionTimeout?: number;
  [key: string]: any;
}

export interface CheckpointConfig {
  enabled: boolean;
  interval: number;
  storage: 'filesystem' | 's3' | 'kafka' | 'database';
  path?: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  maxOutOfOrderness: number;
  idlenessTimeout?: number;
}

export interface WindowConfig {
  type: 'tumbling' | 'sliding' | 'session';
  size: number;
  slide?: number;
  gap?: number;
}

// Batch configuration
export interface BatchConfig {
  enabled: boolean;
  engine: 'spark' | 'flink' | 'airflow' | 'custom';
  config: BatchEngineConfig;
  scheduling: SchedulingConfig;
  resources: ResourceConfig;
}

export interface BatchEngineConfig {
  executors?: number;
  executorMemory?: string;
  executorCores?: number;
  driverMemory?: string;
  maxRetries?: number;
  [key: string]: any;
}

export interface SchedulingConfig {
  cron?: string;
  timezone?: string;
  maxConcurrency?: number;
  retryPolicy?: RetryPolicy;
}

export interface ResourceConfig {
  cpu: string;
  memory: string;
  disk?: string;
  gpu?: number;
}

// Delta Lake configuration
export interface DeltaLakeConfig {
  enabled: boolean;
  storageLocation: string;
  optimizeConfig: OptimizeConfig;
  vaccumConfig: VacuumConfig;
  versionRetention: number;
}

export interface OptimizeConfig {
  autoOptimize: boolean;
  optimizeWrite: boolean;
  autoCompact: boolean;
  maxFileSize: string;
  minFileSize: string;
}

export interface VacuumConfig {
  autoVacuum: boolean;
  retentionHours: number;
  dryRun: boolean;
}

// Schema evolution
export interface SchemaEvolutionConfig {
  enabled: boolean;
  strategy: 'strict' | 'permissive' | 'adaptive';
  compatibility: 'backward' | 'forward' | 'full';
  conflictResolution: ConflictResolutionStrategy;
}

export interface ConflictResolutionStrategy {
  addColumn: 'allow' | 'deny' | 'prompt';
  removeColumn: 'allow' | 'deny' | 'prompt';
  changeType: 'allow' | 'deny' | 'prompt';
  renameColumn: 'allow' | 'deny' | 'prompt';
}

// Orchestration
export interface OrchestrationConfig {
  engine: 'airflow' | 'prefect' | 'dagster' | 'custom';
  config: OrchestrationEngineConfig;
  monitoring: OrchestrationMonitoring;
}

export interface OrchestrationEngineConfig {
  webserverHost?: string;
  webserverPort?: number;
  executorType?: 'sequential' | 'local' | 'celery' | 'kubernetes';
  parallelism?: number;
  dagDir?: string;
  [key: string]: any;
}

export interface OrchestrationMonitoring {
  enabled: boolean;
  alerting: AlertingConfig;
  logging: LoggingConfig;
}

// Error handling
export interface ErrorHandlingConfig {
  strategy: 'fail_fast' | 'skip_and_continue' | 'retry_and_fail' | 'dead_letter_queue';
  maxRetries: number;
  retryDelay: number;
  deadLetterQueue?: DeadLetterQueueConfig;
}

export interface DeadLetterQueueConfig {
  enabled: boolean;
  storage: 'database' | 's3' | 'kafka';
  retention: string;
  notification: NotificationConfig;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  multiplier?: number;
}

export interface ErrorHandlingRule {
  errorType: string;
  action: 'skip' | 'retry' | 'fail' | 'transform';
  maxRetries?: number;
  transformation?: string;
}

// Validation
export interface ValidationConfig {
  enabled: boolean;
  rules: ValidationRuleConfig[];
  onFailure: 'fail' | 'warn' | 'skip';
}

export interface ValidationRuleConfig {
  type: 'notnull' | 'unique' | 'range' | 'pattern' | 'custom';
  columns: string[];
  parameters?: Record<string, any>;
  severity: 'error' | 'warning';
}

export interface ValidationRule {
  id: string;
  name: string;
  type: string;
  condition: string;
  message: string;
  severity: 'error' | 'warning';
}

// Change Data Capture
export interface CDCConfig {
  enabled: boolean;
  engine: 'debezium' | 'maxwell' | 'canal' | 'custom';
  config: CDCEngineConfig;
  filtering: CDCFilterConfig;
}

export interface CDCEngineConfig {
  connectorClass?: string;
  databaseHostname?: string;
  databasePort?: number;
  databaseUser?: string;
  databasePassword?: string;
  databaseServerId?: number;
  binlogPosition?: string;
  [key: string]: any;
}

export interface CDCFilterConfig {
  includeTables?: string[];
  excludeTables?: string[];
  includeColumns?: Record<string, string[]>;
  excludeColumns?: Record<string, string[]>;
}

// Data quality
export interface DataQualityConfig {
  enabled: boolean;
  rules: DataQualityRule[];
  monitoring: QualityMonitoringConfig;
  profiling: DataProfilingConfig;
}

export interface DataQualityRule {
  id: string;
  name: string;
  type: 'completeness' | 'uniqueness' | 'validity' | 'consistency' | 'accuracy';
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface QualityMonitoringConfig {
  enabled: boolean;
  interval: string;
  alerting: AlertingConfig;
  reporting: ReportingConfig;
}

export interface DataProfilingConfig {
  enabled: boolean;
  sampleSize: number;
  statisticsCollection: boolean;
  patternDetection: boolean;
}

// Common configurations
export interface PartitionConfig {
  strategy: 'time' | 'hash' | 'range' | 'list';
  columns: string[];
  numberOfPartitions?: number;
}

export interface CompressionConfig {
  algorithm: 'gzip' | 'snappy' | 'lz4' | 'zstd';
  level?: number;
}

export interface CredentialConfig {
  type: 'basic' | 'oauth' | 'api_key' | 'certificate';
  credentials: Record<string, string>;
  encryption: boolean;
}

export interface SourceSchema {
  format: 'avro' | 'json' | 'protobuf' | 'csv' | 'parquet';
  schema: any;
  evolution: boolean;
}

export interface SinkSchema {
  format: 'avro' | 'json' | 'protobuf' | 'csv' | 'parquet' | 'delta';
  schema: any;
  partitioning?: string[];
}

export interface AlertingConfig {
  enabled: boolean;
  channels: string[];
  thresholds: Record<string, number>;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  destination: 'console' | 'file' | 'elasticsearch';
}

export interface NotificationConfig {
  enabled: boolean;
  channels: string[];
  template: string;
}

export interface ReportingConfig {
  enabled: boolean;
  schedule: string;
  format: 'html' | 'pdf' | 'json';
  recipients: string[];
}
